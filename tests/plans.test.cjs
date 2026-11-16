const test = require('node:test');
const assert = require('node:assert/strict');
const content = require('../planning/catalogo-ejercicios.v1.json');
const { generatePlan } = require('../src/domain/plans');
const { makePlanInput } = require('./helpers/plan-inputs.cjs');
const keys = ['castro-ground-shots', 'castro-mid-height-shots', 'coco-aim-training'];
const assigned = plan => Object.fromEntries(plan.exercises.map(e => [e.exercise_key, e.assigned_minutes]));
const coco = plan => plan.exercises.find(e => e.exercise_key === keys[2])?.exercise_snapshot;

for (const example of content.allocation_policy.examples) {
  test(`Reparto acordado: ${example.available_minutes} minutos, Workshop ${example.workshop_access}`, () => {
    const plan = generatePlan(makePlanInput({ minutes: example.available_minutes, workshop: example.workshop_access }));
    assert.deepEqual(assigned(plan), example.assigned);
    assert.ok(plan.assigned_minutes <= example.available_minutes);
    assert.ok(plan.exercises.every(e => Number.isInteger(e.assigned_minutes) && e.assigned_minutes >= 5));
    if (example.reason) assert.ok(plan.reason_codes.includes(example.reason));
  });
}

test('Propuesta completa conserva instrucciones, dificultad, recurso, contexto y versiones', () => {
  const input = makePlanInput(); const plan = generatePlan(input);
  assert.equal(plan.coverage, 'complete');
  assert.deepEqual(plan.uncovered_priorities, []);
  assert.equal(plan.rules_version, 'mvp.rules.v1');
  assert.equal(plan.metrics_version, 'mvp.metrics.v1');
  assert.equal(plan.generator_version, 'mvp.plans.v1');
  assert.equal(plan.catalog_version, content.catalog_version);
  assert.equal(plan.allocation_version, content.allocation_policy.version);
  assert.equal(plan.plan_id, null); assert.equal(plan.plan_version_id, null);
  assert.equal(plan.version, 1); assert.equal(plan.block_id, input.analysis.block_id);
  assert.equal(plan.assigned_minutes, 20); assert.equal(plan.unassigned_minutes, 0);
  assert.deepEqual(plan.exercises.map(e => e.order), [1, 2, 3]);
  for (const e of plan.exercises) {
    assert.equal(e.priority_key, 'shooting');
    assert.equal(e.rule_id, 'finalizacion-eficiencia');
    assert.ok(e.exercise_version_id.startsWith('test-'));
    assert.equal(e.exercise_snapshot.content_version, 1);
    assert.ok(e.exercise_snapshot.instructions.length > 0);
    assert.match(e.exercise_snapshot.resource_url, /^https:/);
    assert.ok(e.difficulty >= 1);
  }
  assert.equal(plan.exercises[0].exercise_snapshot.resource_code, '9472-6A26-7F5D-767B');
  assert.ok(plan.limitations.includes('synthetic_catalog'));
});

for (const [rank, variant] of [
  ['bronze', 'easy-base'], ['silver', 'easy-base'], ['gold', 'easy-base'],
  ['platinum', 'normal-fixed'], ['diamond', 'normal-fixed'], ['champion', 'normal-distance'],
  ['grand_champion', 'normal-random'], ['supersonic_legend', 'normal-random'],
]) {
  test(`CoCo elige ${variant} para rango declarado ${rank}`, () => {
    const plan = generatePlan(makePlanInput({ rank }));
    assert.equal(coco(plan).selected_variant.variant_key, variant);
    if (variant === 'normal-fixed') {
      assert.equal(coco(plan).selected_variant.random_target_sizes, false);
      assert.equal(coco(plan).selected_variant.random_wall_distances, false);
      assert.equal(coco(plan).selected_variant.random_ball_drops, false);
    }
  });
}

test('Champion recibe distancia variable y GC todas las opciones variables', () => {
  const champion = coco(generatePlan(makePlanInput({ rank: 'champion' }))).selected_variant;
  assert.deepEqual([champion.random_target_sizes, champion.random_wall_distances, champion.random_ball_drops], [false, true, false]);
  const gc = coco(generatePlan(makePlanInput({ rank: 'grand_champion' }))).selected_variant;
  assert.deepEqual([gc.random_target_sizes, gc.random_wall_distances, gc.random_ball_drops], [true, true, true]);
});

for (const [name, mutate, reason] of [
  ['sin rango', p => { delete p.rank; }, 'RANK_NOT_AVAILABLE'],
  ['rango desconocido', p => { p.rank = 'invented'; }, 'RANK_NOT_AVAILABLE'],
  ['sin procedencia declarada', p => { delete p.rank_source; }, 'RANK_NOT_AVAILABLE'],
  ['rango de otra modalidad', p => { p.rank_mode = '1v1'; }, 'RANK_MODE_MISMATCH'],
]) {
  test(`Usa Easy ${name} sin inventar rango`, () => {
    const input = makePlanInput(); mutate(input.profile);
    const plan = generatePlan(input);
    assert.equal(coco(plan).selected_variant.variant_key, 'easy-base');
    assert.equal(plan.profile_snapshot.rank, null);
    assert.ok(plan.reason_codes.includes(reason));
  });
}

test('Jugador puede elegir una variante más sencilla', () => {
  const input = makePlanInput({ rank: 'grand_champion' });
  input.profile.coco_variant_key = 'normal-fixed';
  const plan = generatePlan(input);
  assert.equal(coco(plan).selected_variant.variant_key, 'normal-fixed');
  assert.equal(coco(plan).difficulty, 2);
});

test('Survival es opcional avanzado y sustituye a Normal sin duplicar tiempo', () => {
  const input = makePlanInput({ rank: 'grand_champion' });
  assert.equal(coco(generatePlan(input)).selected_variant.mode, 'normal');
  input.profile.coco_variant_key = 'survival-optional';
  const plan = generatePlan(input);
  assert.equal(coco(plan).selected_variant.mode, 'survival');
  assert.equal(coco(plan).selected_variant.shot_time_limit_seconds, 5);
  assert.equal(plan.exercises.filter(e => e.exercise_key === keys[2]).length, 1);
  assert.equal(plan.assigned_minutes, 20);
});

test('No aplica Survival ni variante más difícil a un nivel inferior', () => {
  for (const requested of ['survival-optional', 'normal-random', 'not-a-variant']) {
    const input = makePlanInput({ rank: 'gold' }); input.profile.coco_variant_key = requested;
    const plan = generatePlan(input);
    assert.equal(coco(plan).selected_variant.mode, 'easy');
    assert.ok(plan.reason_codes.includes('VARIANT_REQUEST_REJECTED'));
  }
});

test('Steam enlazado sin acceso confirmado a Workshop usa solo Custom Training', () => {
  const input = makePlanInput(); delete input.profile.workshop_access;
  const plan = generatePlan(input);
  assert.deepEqual(assigned(plan), { [keys[0]]: 15, [keys[1]]: 5 });
  assert.ok(plan.catalog_exclusions.some(e => e.reason === 'WORKSHOP_UNAVAILABLE'));
});

test('Epic conserva identidad y excluye CoCo incluso si llega una capacidad incoherente', () => {
  const plan = generatePlan(makePlanInput({ platform: 'epic', workshop: true }));
  assert.equal(plan.coverage, 'complete');
  assert.deepEqual(assigned(plan), { [keys[0]]: 15, [keys[1]]: 5 });
  assert.equal(plan.profile_snapshot.platform, 'epic');
});

test('Fichas reales pendientes de A23 no se activan ni generan una rutina ficticia', () => {
  const input = makePlanInput(); input.catalog = structuredClone(content);
  const plan = generatePlan(input);
  assert.equal(plan.coverage, 'empty');
  assert.deepEqual(plan.exercises, []);
  assert.ok(plan.reason_codes.includes('NO_VERIFIED_ACTIVE_EXERCISE'));
  assert.ok(plan.catalog_exclusions.every(e => e.reason === 'INACTIVE'));
  assert.deepEqual(plan.uncovered_priorities, ['shooting']);
});

for (const [name, mutate, reason] of [
  ['inactivo', e => { e.active = false; }, 'INACTIVE'],
  ['sin revisión técnica', e => { delete e.technical_review_status; }, 'UNVERIFIED_RESOURCE'],
  ['plataforma incompatible', e => { e.platforms = ['epic']; }, 'PLATFORM_INCOMPATIBLE'],
  ['modalidad incompatible', e => { e.modes = ['1v1']; }, 'MODE_INCOMPATIBLE'],
  ['requiere BakkesMod', e => { e.requirements.bakkesmod = true; }, 'REQUIREMENTS_INCOMPATIBLE'],
  ['versión inválida', e => { e.content_version = 0; }, 'EXERCISE_VERSION_INVALID'],
  ['ID numérico que puede perder precisión', e => { e.exercise_version_id = 9007199254740992; }, 'EXERCISE_VERSION_INVALID'],
  ['sin instrucciones', e => { e.instructions = []; }, 'INSTRUCTIONS_MISSING'],
  ['recurso inválido', e => { e.resource_url = 'javascript:alert(1)'; }, 'RESOURCE_INVALID'],
  ['código inválido', e => { e.resource_code = 'FAKE'; }, 'RESOURCE_INVALID'],
]) {
  test(`Catálogo parcial excluye ejercicio ${name} sin forzarlo`, () => {
    const input = makePlanInput(); mutate(input.catalog.exercises[1]);
    const plan = generatePlan(input);
    assert.equal(plan.coverage, 'partial');
    assert.deepEqual(assigned(plan), { [keys[0]]: 13, [keys[2]]: 7 });
    assert.ok(plan.catalog_exclusions.some(e => e.exercise_key === keys[1] && e.reason === reason));
    assert.ok(plan.missing_exercises.includes(keys[1]));
  });
}

test('Catálogo vacío explica falta de cobertura', () => {
  const input = makePlanInput(); input.catalog.exercises = [];
  const plan = generatePlan(input);
  assert.equal(plan.coverage, 'empty');
  assert.deepEqual(plan.uncovered_priorities, ['shooting']);
  assert.ok(plan.reason_codes.includes('NO_VERIFIED_ACTIVE_EXERCISE'));
});

test('Variante faltante o ajustes inválidos excluyen CoCo con motivo', () => {
  for (const mutate of [e => { e.variants = []; }, e => { e.variants[1].random_target_sizes = null; },
    e => { e.variants[1] = null; }, e => { e.variants.push(e.variants[1]); }]) {
    const input = makePlanInput(); mutate(input.catalog.exercises[2]);
    const plan = generatePlan(input);
    assert.equal(plan.coverage, 'partial');
    assert.equal(coco(plan), undefined);
    assert.ok(plan.catalog_exclusions.some(e => e.reason === 'VARIANT_UNAVAILABLE'));
  }
});

test('Versión de ejercicio bigint serializada se conserva sin convertir a número', () => {
  const input = makePlanInput(); input.catalog.exercises[0].exercise_version_id = '9007199254740993';
  const plan = generatePlan(input);
  assert.equal(plan.exercises[0].exercise_version_id, '9007199254740993');
});

test('A17 sin señal no produce ejercicios aunque exista catálogo', () => {
  const plan = generatePlan(makePlanInput({ goalsTotal: 10 }));
  assert.deepEqual(plan.exercises, []);
  assert.equal(plan.coverage, 'empty');
  assert.ok(plan.reason_codes.includes('NO_PRIORITIES'));
});

for (const mode of ['1v1', '3v3']) {
  test(`La integración conserva contexto y prioridad propia de ${mode}`, () => {
    const input = makePlanInput({ mode });
    const plan = generatePlan(input);
    assert.equal(plan.coverage, 'complete');
    assert.equal(plan.profile_snapshot.mode, mode);
    assert.equal(plan.diagnosis_snapshot.priorities[0].evidence.context.mode, mode);
    assert.equal(plan.assigned_minutes, 20);
  });
}

test('Prioridad sin respaldo en los datos actuales no se convierte en un plan', () => {
  const input = makePlanInput(); input.analysis.priorities[0].evidence.value = 0;
  const plan = generatePlan(input);
  assert.equal(plan.coverage, 'empty');
  assert.ok(plan.reason_codes.includes('UNSUPPORTED_OR_UNBACKED_PRIORITY'));
});

test('Prioridad adicional no soportada queda sin cubrir, manteniendo finalización válida', () => {
  const input = makePlanInput();
  input.analysis.priorities.push({ rule_id: 'test-future-boost', priority_key: 'boost', score: 2, rules_version: 'mvp.rules.v1', evidence: {} });
  const plan = generatePlan(input);
  assert.equal(plan.coverage, 'partial');
  assert.deepEqual(plan.uncovered_priorities, ['boost']);
  assert.equal(plan.exercises.length, 3);
});

test('Meta activa compatible se conserva; no modifica métricas ni umbral de A17', () => {
  const input = makePlanInput();
  input.goals = [{ goal_id: 'test-goal', metric_key: 'shooting_pct', target_value: 50, unit: 'percent', status: 'active' }];
  const before = structuredClone(input.analysis);
  const plan = generatePlan(input);
  assert.deepEqual(plan.goals_snapshot, input.goals);
  assert.deepEqual(input.analysis, before);
  assert.deepEqual(assigned(plan), { [keys[0]]: 10, [keys[1]]: 5, [keys[2]]: 5 });
});

test('Metas incompatibles, archivadas, duplicadas o sin señal no fabrican necesidades', () => {
  const input = makePlanInput();
  const valid = { goal_id: 'a', metric_key: 'shooting_pct', target_value: 50, unit: 'percent', status: 'active' };
  input.goals = [valid, { ...valid }, { ...valid, goal_id: 'b', status: 'archived' },
    { ...valid, goal_id: 'c', mode: '1v1' }, { ...valid, goal_id: 'd', metric_key: 'boost_avg' }];
  let plan = generatePlan(input);
  assert.equal(plan.goals_snapshot.length, 1); assert.equal(plan.goals_excluded.length, 4);
  input.analysis.priorities = [];
  plan = generatePlan(input);
  assert.equal(plan.goals_snapshot.length, 0); assert.deepEqual(plan.exercises, []);
});

for (const [name, mutate] of [
  ['perfil de otro jugador', i => { i.profile.player_id = 'OTHER'; }],
  ['versión de reglas desconocida', i => { i.analysis.rules_version = 'unknown'; }],
  ['versión de catálogo desconocida', i => { i.catalog.catalog_version = 'unknown'; }],
  ['metadatos de versión contradictorios', i => { i.analysis.metrics_version = 'another'; }],
  ['prioridad sin clave', i => { delete i.analysis.priorities[0].priority_key; }],
  ['ejercicios repetidos', i => { i.catalog.exercises.push(i.catalog.exercises[0]); }],
  ['minutos negativos', i => { i.availability_minutes = -1; }],
  ['minutos fraccionarios', i => { i.availability_minutes = 12.5; }],
  ['minutos fuera del tipo SQL', i => { i.availability_minutes = 32768; }],
  ['versión no positiva', i => { i.version = 0; }],
]) {
  test(`Rechaza ${name}`, () => {
    const input = makePlanInput(); mutate(input);
    assert.throws(() => generatePlan(input));
  });
}

test('De 0 a 120 minutos: enteros, mínimo cinco, suma correcta y decisiones reproducibles', () => {
  for (const workshop of [false, true]) {
    const input = makePlanInput({ workshop });
    for (let minutes = 0; minutes <= 120; minutes++) {
      input.availability_minutes = minutes;
      const plan = generatePlan(input);
      assert.ok(plan.exercises.every(e => Number.isInteger(e.assigned_minutes) && e.assigned_minutes >= 5));
      assert.equal(plan.assigned_minutes, plan.exercises.reduce((sum, e) => sum + e.assigned_minutes, 0));
      assert.equal(plan.assigned_minutes, minutes < 5 ? 0 : minutes);
      assert.deepEqual(generatePlan(input), plan);
    }
  }
});

test('Generar otra versión con minutos/bloque distintos no reescribe la propuesta anterior', () => {
  const input = makePlanInput(); const before = structuredClone(input);
  const first = generatePlan(input), original = structuredClone(first);
  const next = structuredClone(input); next.version = 2; next.availability_minutes = 40; next.analysis.block_id = 'test-block-later';
  const second = generatePlan(next);
  assert.equal(second.version, 2); assert.equal(second.assigned_minutes, 40);
  assert.equal(second.block_id, 'test-block-later');
  assert.deepEqual(first, original); assert.deepEqual(input, before);
  first.exercises[0].exercise_snapshot.instructions.push('change');
  coco(first).selected_variant.random_target_sizes = true;
  first.diagnosis_snapshot.priorities[0].evidence.value = -1;
  assert.deepEqual(input, before);
  assert.deepEqual(generatePlan(input), original);
});
