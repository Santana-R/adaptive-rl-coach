const { isDeepStrictEqual } = require('node:util');
const { evaluateRules, rankPriorities } = require('./rules');
const { RULES_CONFIG } = require('./rules-config');
const { allocateMinutes } = require('./time-allocation');

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
  });
}

// Propuesta pura: no asigna IDs SQL, consulta red ni modifica planes anteriores.
function generatePlan({ analysis, profile, catalog, availability_minutes, goals = [], version = 1 }) {
  validateInput({ analysis, profile, catalog, availability_minutes, goals, version });
  const reasons = [];
  const rank = selectRank(profile, reasons);
  const supplied = rankPriorities(analysis.priorities);
  const verified = evaluateRules(analysis.metrics).priorities[0];
  const backed = supplied.filter(p => p.priority_key === 'shooting' && p.rule_id === verified?.rule_id &&
    p.rules_version === analysis.rules_version && p.score === verified.score && isDeepStrictEqual(p.evidence, verified.evidence));
  const supported = backed.length ? [clone(verified)] : [];
  const uncovered = supplied.filter(p => !backed.includes(p)).map(p => p.priority_key);
  if (uncovered.length) reasons.push('UNSUPPORTED_OR_UNBACKED_PRIORITY');
  if (!supplied.length) reasons.push('NO_PRIORITIES');
  const { included: goalsSnapshot, excluded: goalsExcluded } = compatibleGoals(goals, profile.mode, supported, reasons);
  const exclusions = [];
  const candidates = [];
  for (const exercise of catalog.exercises) {
    let reason = candidateProblem(exercise, catalog, profile);
    let variant = null;
    if (!reason && exercise.exercise_key === KEYS[2]) {
      variant = selectVariant(exercise, rank, profile.coco_variant_key, reasons);
      if (variant === null) reason = 'VARIANT_UNAVAILABLE';
    }
    if (reason) exclusions.push({ exercise_key: exercise.exercise_key, reason });
    else candidates.push({ exercise, variant });
  }
  const expectedKeys = profile.platform === 'steam' && profile.workshop_access === true ? KEYS : KEYS.slice(0, 2);
  const availableKeys = new Set(candidates.map(c => c.exercise.exercise_key));
  const missing = expectedKeys.filter(key => !availableKeys.has(key));
  const hasWorkshop = availableKeys.has(KEYS[2]);
  const order = hasWorkshop ? [KEYS[0], KEYS[2], KEYS[1]] : KEYS.slice(0, 2);
  const slots = Math.floor(availability_minutes / 5);
  const selectedKeys = supported.length ? order.filter(key => availableKeys.has(key)).slice(0, slots) : [];
  const weights = hasWorkshop ? [2, 1, 1] : [3, 1, 0];
  const entries = KEYS.filter(key => selectedKeys.includes(key)).map(key => ({ key, weight: weights[KEYS.indexOf(key)] }));
  const allocation = allocateMinutes(availability_minutes, entries);
  const exercises = entries.map(({ key }, index) => {
    const { exercise, variant } = candidates.find(c => c.exercise.exercise_key === key);
    const snapshot = exerciseSnapshot(exercise, variant, rank);
    return {
      plan_exercise_id: null, order: index + 1, priority_key: 'shooting', rule_id: verified.rule_id,
      exercise_key: key, exercise_version_id: snapshot.exercise_version_id,
      assigned_minutes: allocation[key], difficulty: snapshot.difficulty, exercise_snapshot: snapshot,
    };
  });
  if (supported.length && !exercises.length) uncovered.push('shooting');
  if (availability_minutes < 5) reasons.push('INSUFFICIENT_TIME');
  if (supported.length && !candidates.length) reasons.push('NO_VERIFIED_ACTIVE_EXERCISE');
  if (supported.length && missing.length) reasons.push('CATALOG_PARTIAL');
  if (exercises.length && selectedKeys.length < candidates.length) reasons.push('SHORT_SESSION');
  const coverage = exercises.length === 0 ? 'empty' : uncovered.length || missing.length ? 'partial' : 'complete';
  const assigned = exercises.reduce((sum, exercise) => sum + exercise.assigned_minutes, 0);
  const limitations = unique([...(analysis.limitations || []), 'unpersisted_proposal',
    ...(catalog.source === 'synthetic' ? ['synthetic_catalog'] : [])]);
  const explanations = {
    complete: `Se proponen ${exercises.length} ejercicios compatibles para practicar finalización durante ${assigned} minutos.`,
    partial: `Se proponen ${assigned} minutos de práctica con cobertura parcial; revisa las prioridades o recursos sin cubrir.`,
    empty: 'No se propone una rutina con estas entradas; revisa los motivos de prioridad, catálogo o disponibilidad.',
  };
  return {
    plan_id: null, plan_version_id: null, version, generator_version: 'mvp.plans.v1',
    block_id: analysis.block_id, rules_version: analysis.rules_version, metrics_version: analysis.metrics.metrics_version,
    catalog_version: catalog.catalog_version, catalog_source: catalog.source ?? 'content_handoff',
    allocation_version: 'mvp.allocation.v1', availability_minutes, assigned_minutes: assigned,
    unassigned_minutes: availability_minutes - assigned, coverage, explanation: explanations[coverage],
    uncovered_priorities: unique(uncovered), missing_exercises: supported.length ? missing : [],
    reason_codes: unique(reasons), catalog_exclusions: exclusions, goals_excluded: goalsExcluded,
    goals_snapshot: goalsSnapshot,
    profile_snapshot: {
      platform: profile.platform, player_id: profile.player_id, mode: profile.mode,
      available_minutes: availability_minutes, rank, rank_source: rank === null ? null : 'self_reported',
      rank_mode: rank === null ? null : profile.rank_mode, workshop_access: profile.workshop_access === true,
      coco_variant_key: profile.coco_variant_key ?? null,
    },
    diagnosis_snapshot: { priorities: clone(supplied), limitations: clone(analysis.limitations || []) },
    exercises, limitations,
  };
}

// candidateProblem se exporta para que el catálogo (A23) filtre con las mismas reglas que el generador.
module.exports = { generatePlan, candidateProblem, ROUTINE_KEYS: KEYS };
