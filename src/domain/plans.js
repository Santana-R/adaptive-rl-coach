const { isDeepStrictEqual } = require('node:util');
const { evaluateRules, rankPriorities } = require('./rules');
const { RULES_CONFIG } = require('./rules-config');
const { allocateMinutes } = require('./time-allocation');

const nativeBoostCatalog = require('../../planning/catalogo-boost.v1.json');
const nativeReviewCatalog = require('../../planning/catalogo-revision-defensiva.v1.json');

const KEYS = ['castro-ground-shots', 'castro-mid-height-shots', 'coco-aim-training'];
const RANKS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'champion', 'grand_champion', 'supersonic_legend'];
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const unique = values => [...new Set(values)];
const clone = value => structuredClone(value);

function validateInput({ analysis, profile, catalog, availability_minutes, goals, version }) {
  if (!nonempty(analysis?.block_id) || !Array.isArray(analysis.priorities) || !analysis.metrics?.context ||
      analysis.rules_version !== RULES_CONFIG.rules_version ||
      analysis.metrics.metrics_version !== RULES_CONFIG.metrics_version) {
    throw new TypeError('Se requiere un análisis identificado con métricas y reglas compatibles.');
  }
  if ((analysis.metrics_version != null && analysis.metrics_version !== analysis.metrics.metrics_version) ||
      analysis.priorities.some(p => !nonempty(p?.priority_key) || !nonempty(p?.rules_version)) ||
      (analysis.limitations != null && (!Array.isArray(analysis.limitations) || !analysis.limitations.every(nonempty)))) {
    throw new TypeError('Las prioridades, versiones y limitaciones deben ser coherentes con el análisis.');
  }
  const context = analysis.metrics.context;
  for (const key of ['platform', 'player_id', 'mode']) {
    if (!nonempty(profile?.[key]) || profile[key] !== context[key]) {
      throw new TypeError('El perfil debe corresponder al jugador, plataforma y modalidad analizados.');
    }
  }
  if (catalog?.catalog_version !== 'mvp.catalog.v1' || !Array.isArray(catalog.exercises)) {
    throw new TypeError('Se requiere un catálogo normalizado de la versión compatible.');
  }
  const keys = Array.from(catalog.exercises, exercise => exercise?.exercise_key);
  if (keys.some(key => !nonempty(key)) || new Set(keys).size !== keys.length) {
    throw new TypeError('El catálogo debe contener una sola versión vigente por clave de ejercicio.');
  }
  if (!Number.isInteger(availability_minutes) || availability_minutes < 0 || availability_minutes > 32767) {
    throw new RangeError('La disponibilidad debe ser un número entero entre 0 y 32767 minutos.');
  }
  if (!Number.isSafeInteger(version) || version < 1 || !Array.isArray(goals)) {
    throw new TypeError('La versión debe ser un entero positivo y las metas una lista.');
  }
}

function selectRank(profile, reasons) {
  if (!RANKS.includes(profile.rank) || profile.rank_source !== 'self_reported') {
    reasons.push('RANK_NOT_AVAILABLE');
    return null;
  }
  if (profile.rank_mode !== profile.mode) {
    reasons.push('RANK_MODE_MISMATCH');
    return null;
  }
  return profile.rank;
}

function selectVariant(exercise, rank, requested, reasons) {
  const variants = Array.isArray(exercise.variants) ? exercise.variants : [];
  if (variants.some(v => !v || !nonempty(v.variant_key)) ||
      new Set(variants.map(v => v.variant_key)).size !== variants.length) return null;
  const defaults = rank === null
    ? variants.filter(v => v.variant_key === 'easy-base')
    : variants.filter(v => v.default_for_ranks === true && Array.isArray(v.suggested_ranks) && v.suggested_ranks.includes(rank));
  if (defaults.length !== 1) return null;
  let selected = defaults[0];
  if (requested != null) {
    const options = variants.filter(v => v.variant_key === requested);
    const option = options[0];
    const survivalAllowed = option?.mode !== 'survival' ||
      ['grand_champion', 'supersonic_legend'].includes(rank);
    if (options.length === 1 && Number.isInteger(option.difficulty) &&
        option.difficulty <= selected.difficulty && survivalAllowed) selected = option;
    else reasons.push('VARIANT_REQUEST_REJECTED');
  }
  if (!['easy', 'normal', 'survival'].includes(selected.mode) ||
      !Number.isInteger(selected.difficulty) || selected.difficulty < 1) return null;
  if (selected.mode === 'normal' && !['random_target_sizes', 'random_wall_distances', 'random_ball_drops']
    .every(key => typeof selected[key] === 'boolean')) return null;
  return clone(selected);
}

function candidateProblem(exercise, catalog, profile) {
  if (exercise.active !== true) return 'INACTIVE';
  if (exercise.technical_review_status !== 'verified') return 'UNVERIFIED_RESOURCE';
  if (!KEYS.includes(exercise.exercise_key) || exercise.priority_key !== 'shooting') return 'UNSUPPORTED_EXERCISE';
  if (!Array.isArray(exercise.platforms) || !exercise.platforms.includes(profile.platform)) return 'PLATFORM_INCOMPATIBLE';
  const modes = exercise.modes ?? catalog.modes;
  if (!Array.isArray(modes) || !modes.includes(profile.mode)) return 'MODE_INCOMPATIBLE';
  const workshop = exercise.exercise_key === KEYS[2];
  if (workshop && (profile.platform !== 'steam' || profile.workshop_access !== true)) return 'WORKSHOP_UNAVAILABLE';
  if (exercise.requirements?.bakkesmod !== false || exercise.requirements?.steam_workshop_access !== workshop) {
    return 'REQUIREMENTS_INCOMPATIBLE';
  }
  if (!Number.isSafeInteger(exercise.content_version) || exercise.content_version < 1 ||
      !Number.isInteger(exercise.difficulty_base) || exercise.difficulty_base < 1 ||
      exercise.minimum_duration_minutes !== 5) return 'EXERCISE_VERSION_INVALID';
  for (const key of ['exercise_id', 'exercise_version_id']) {
    if (exercise[key] != null && !nonempty(exercise[key])) return 'EXERCISE_VERSION_INVALID';
  }
  const instructions = Array.isArray(exercise.instructions) ? exercise.instructions : [exercise.instructions];
  if (![exercise.title, exercise.purpose, exercise.success_criterion, ...instructions].every(nonempty) ||
      instructions.length === 0) return 'INSTRUCTIONS_MISSING';
  let url;
  try { url = new URL(exercise.resource_url); } catch { return 'RESOURCE_INVALID'; }
  if (url.protocol !== 'https:') return 'RESOURCE_INVALID';
  if (workshop) {
    if (exercise.resource_type !== 'steam_workshop' || url.hostname !== 'steamcommunity.com' ||
        !/^\d+$/.test(url.searchParams.get('id') || '')) return 'RESOURCE_INVALID';
  } else if (exercise.resource_type !== 'custom_training' ||
      !/^[A-F0-9]{4}(?:-[A-F0-9]{4}){3}$/.test(exercise.resource_code)) return 'RESOURCE_INVALID';
  return null;
}

function compatibleGoals(goals, mode, priorities, reasons) {
  const included = [], excluded = [];
  const ids = new Set();
  for (const goal of goals) {
    let reason = null;
    if (!nonempty(goal?.goal_id) || ids.has(goal.goal_id)) reason = 'GOAL_INVALID';
    else if (goal.status !== 'active') reason = 'GOAL_INACTIVE';
    else if (goal.mode != null && goal.mode !== mode) reason = 'GOAL_MODE_MISMATCH';
    else if (goal.metric_key !== 'shooting_pct' || goal.unit !== 'percent' ||
        !Number.isFinite(goal.target_value) || goal.target_value < 0 || goal.target_value > 100) reason = 'GOAL_UNSUPPORTED';
    else if (!priorities.some(p => p.priority_key === 'shooting')) reason = 'GOAL_WITHOUT_SUPPORTED_PRIORITY';
    if (nonempty(goal?.goal_id)) ids.add(goal.goal_id);
    if (reason) excluded.push({ goal_id: goal?.goal_id ?? null, reason });
    else included.push(clone(goal));
  }
  if (excluded.length) reasons.push('GOALS_EXCLUDED');
  return { included, excluded };
}

function exerciseSnapshot(exercise, variant, rank) {
  const instructions = Array.isArray(exercise.instructions) ? [...exercise.instructions] : [exercise.instructions];
  let level = 'Asegurar el contacto y dirigir el balón a portería.';
  if (['platinum', 'diamond'].includes(rank)) level = 'Elegir izquierda o derecha antes del tiro y buscar esa zona.';
  if (['champion', 'grand_champion', 'supersonic_legend'].includes(rank)) {
    level = 'Elegir una esquina y combinar colocación con potencia.';
  }
  if (exercise.priority_key === 'boost') {
    level = ['champion', 'grand_champion', 'supersonic_legend'].includes(rank)
      ? 'Añadir wavedashes solo si ya se dominan, sin sacrificar la posición elegida.'
      : 'Priorizar rutas sencillas, giros controlados y aterrizajes; no se exige wavedash.';
  }
  if (exercise.priority_key === 'defensive_review') {
    level = 'Revisar el contexto antes de atribuir responsabilidad; no se exige una mecánica ni un rango.';
  }
  if (variant === null) instructions.push(level);
  else {
    instructions.push(`Modo elegido: ${variant.mode}.`);
    if (variant.mode === 'normal') {
      const setting = value => value ? 'activado' : 'desactivado';
      instructions.push(`Tamaños aleatorios: ${setting(variant.random_target_sizes)}; distancias aleatorias: ${setting(variant.random_wall_distances)}; caídas aleatorias: ${setting(variant.random_ball_drops)}.`);
    }
    if (variant.mode === 'survival') instructions.push('Survival sustituye a Normal durante el mismo tiempo asignado a CoCo.');
  }
  return clone({
    exercise_id: exercise.exercise_id ?? null, exercise_version_id: exercise.exercise_version_id ?? null,
    exercise_key: exercise.exercise_key, content_version: exercise.content_version,
    title: exercise.title, priority_key: exercise.priority_key,
    resource_type: exercise.resource_type, resource_url: exercise.resource_url,
    resource_code: exercise.resource_code ?? null,
    purpose: exercise.purpose, instructions, success_criterion: exercise.success_criterion,
    difficulty: variant?.difficulty ?? exercise.difficulty_base,
    practice_level_instruction: variant === null ? level : null,
    selected_variant: variant,
    ...(exercise.source === 'bundled_native_instructions' ? { source: exercise.source,
      native_catalog_version: nativeBoostCatalog.catalog_version, review_status: exercise.review_status } : {}),
    ...(exercise.source === 'bundled_native_review' ? { source: exercise.source,
      native_catalog_version: nativeReviewCatalog.catalog_version, review_status: exercise.review_status,
      requires_saved_replay: true, resource_role: exercise.resource_role } : {}),
  });
}

// Propuesta pura: no asigna IDs SQL, consulta red ni modifica planes anteriores.
function generatePlan({ analysis, profile, catalog, availability_minutes, goals = [], version = 1 }) {
  validateInput({ analysis, profile, catalog, availability_minutes, goals, version });
  const reasons = [];
  const rank = selectRank(profile, reasons);
  const supplied = rankPriorities(analysis.priorities);
  const verified = evaluateRules(analysis.metrics).priorities;
  const backed = supplied.filter(p => verified.some(v => p.priority_key === v.priority_key &&
    p.rule_id === v.rule_id && p.rules_version === v.rules_version && p.score === v.score &&
    isDeepStrictEqual(p.evidence, v.evidence)));
  const supported = verified.filter(v => backed.some(p => p.rule_id === v.rule_id)).map(clone);
  const uncovered = supplied.filter(p => !backed.includes(p)).map(p => p.priority_key);
  if (uncovered.length) reasons.push('UNSUPPORTED_OR_UNBACKED_PRIORITY');
  if (!supplied.length) reasons.push('NO_PRIORITIES');
  const { included: goalsSnapshot, excluded: goalsExcluded } = compatibleGoals(goals, profile.mode, supported, reasons);
  const exclusions = [];
  const shootingCandidates = [];
  for (const exercise of catalog.exercises) {
    let reason = candidateProblem(exercise, catalog, profile);
    let variant = null;
    if (!reason && exercise.exercise_key === KEYS[2]) {
      variant = selectVariant(exercise, rank, profile.coco_variant_key, reasons);
      if (variant === null) reason = 'VARIANT_UNAVAILABLE';
    }
    if (reason) exclusions.push({ exercise_key: exercise.exercise_key, reason });
    else shootingCandidates.push({ exercise, variant });
  }
  const hasWorkshop = shootingCandidates.some(c => c.exercise.exercise_key === KEYS[2]);
  const expectedShooting = profile.platform === 'steam' && profile.workshop_access === true ? KEYS : KEYS.slice(0, 2);
  const boostCandidates = nativeBoostCatalog.exercises
    .filter(e => e.platforms.includes(profile.platform) && e.modes.includes(profile.mode))
    .map(exercise => ({ exercise: clone(exercise), variant: null }));
  const reviewCandidates = nativeReviewCatalog.exercises
    .filter(e => e.platforms.includes(profile.platform) && e.modes.includes(profile.mode))
    .map(exercise => ({ exercise: clone(exercise), variant: null }));
  // Las actividades nativas tienen fuente y versión propias; no se hacen pasar por filas SQL.
  const groups = supported.map(priority => {
    const shooting = priority.priority_key === 'shooting';
    const review = priority.priority_key === 'defensive_review';
    const candidates = shooting ? shootingCandidates : review ? reviewCandidates : boostCandidates;
    const expected = shooting ? expectedShooting : (review ? nativeReviewCatalog : nativeBoostCatalog).exercises.map(e => e.exercise_key);
    const available = new Set(candidates.map(c => c.exercise.exercise_key));
    const order = shooting ? hasWorkshop ? [KEYS[0], KEYS[2], KEYS[1]] : KEYS.slice(0, 2) : expected;
    return { priority, candidates, expected, order, available };
  });
  const missing = groups.flatMap(g => g.expected.filter(k => !g.available.has(k)));
  const offered = groups.filter(g => g.candidates.length);
  const slots = Math.floor(availability_minutes / 5);
  const selectedGroups = offered.slice(0, slots);
  const budgets = allocateMinutes(availability_minutes,
    selectedGroups.map(g => ({ key: g.priority.priority_key, weight: 1 })));
  const exercises = [];
  for (const group of groups) {
    if (!selectedGroups.includes(group)) { uncovered.push(group.priority.priority_key); continue; }
    const budget = budgets[group.priority.priority_key];
    const selected = group.order.filter(k => group.available.has(k)).slice(0, Math.floor(budget / 5));
    const weights = group.priority.priority_key === 'shooting'
      ? Object.fromEntries(KEYS.map((k, i) => [k, (hasWorkshop ? [2, 1, 1] : [3, 1, 0])[i]]))
      : Object.fromEntries(group.expected.map(k => [k, 1]));
    const entries = group.expected.filter(k => selected.includes(k)).map(key => ({ key, weight: weights[key] }));
    const allocation = allocateMinutes(budget, entries);
    for (const { key } of entries) {
      const { exercise, variant } = group.candidates.find(c => c.exercise.exercise_key === key);
      const snapshot = exerciseSnapshot(exercise, variant, rank);
      exercises.push({ plan_exercise_id: null, order: exercises.length + 1,
        priority_key: group.priority.priority_key, rule_id: group.priority.rule_id,
        exercise_key: key, exercise_version_id: snapshot.exercise_version_id,
        assigned_minutes: allocation[key], difficulty: snapshot.difficulty, exercise_snapshot: snapshot });
    }
    if (selected.length < group.candidates.length) reasons.push('SHORT_SESSION');
  }
  if (availability_minutes < 5) reasons.push('INSUFFICIENT_TIME');
  if (groups.some(g => !g.candidates.length)) reasons.push('NO_VERIFIED_ACTIVE_EXERCISE');
  if (missing.length) reasons.push('CATALOG_PARTIAL');
  if (selectedGroups.length < offered.length) reasons.push('SHORT_SESSION');
  const coverage = exercises.length === 0 ? 'empty' : uncovered.length || missing.length ? 'partial' : 'complete';
  const assigned = exercises.reduce((sum, exercise) => sum + exercise.assigned_minutes, 0);
  const limitations = unique([...(analysis.limitations || []), 'unpersisted_proposal',
    ...(catalog.source === 'synthetic' ? ['synthetic_catalog'] : [])]);
  const explanations = {
    complete: `Se proponen ${exercises.length} ejercicios compatibles para practicar ${supported.map(p => ({ boost: 'disponibilidad de boost', shooting: 'finalización', defensive_review: 'cobertura defensiva' }[p.priority_key])).join(', ')} durante ${assigned} minutos.`,
    partial: `Se proponen ${assigned} minutos de práctica con cobertura parcial; revisa las prioridades o recursos sin cubrir.`,
    empty: 'No se propone una rutina con estas entradas; revisa los motivos de prioridad, catálogo o disponibilidad.',
  };
  return {
    plan_id: null, plan_version_id: null, version, generator_version: 'mvp.plans.v3',
    block_id: analysis.block_id, rules_version: analysis.rules_version, metrics_version: analysis.metrics.metrics_version,
    catalog_version: catalog.catalog_version, catalog_source: catalog.source ?? 'content_handoff',
    native_catalog_version: exercises.some(e => e.priority_key === 'boost') ? nativeBoostCatalog.catalog_version : null,
    review_catalog_version: exercises.some(e => e.priority_key === 'defensive_review') ? nativeReviewCatalog.catalog_version : null,
    allocation_version: 'mvp.allocation.v3', availability_minutes, assigned_minutes: assigned,
    unassigned_minutes: availability_minutes - assigned, coverage, explanation: explanations[coverage],
    uncovered_priorities: unique(uncovered), missing_exercises: supported.length ? missing : [],
    reason_codes: unique(reasons), catalog_exclusions: exclusions, goals_excluded: goalsExcluded,
    goals_snapshot: goalsSnapshot,
    profile_snapshot: {
      platform: profile.platform, player_id: profile.player_id, mode: profile.mode,
      available_minutes: availability_minutes, rank, rank_source: rank === null ? null : 'self_reported',
      rank_mode: rank === null ? null : profile.rank_mode,
      rank_record: rank === null ? null : profile.rank_record ?? null, workshop_access: profile.workshop_access === true,
      coco_variant_key: profile.coco_variant_key ?? null,
    },
    diagnosis_snapshot: { priorities: clone(supplied), limitations: clone(analysis.limitations || []) },
    exercises, limitations,
  };
}

// candidateProblem se exporta para que el catálogo (A23) filtre con las mismas reglas que el generador.
module.exports = { generatePlan, candidateProblem, ROUTINE_KEYS: KEYS };
