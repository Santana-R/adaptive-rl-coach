const test = require('node:test');
const assert = require('node:assert/strict');
const { boostBlock, boostPlan } = require('./helpers/boost-inputs.cjs');
const { analyzeBlock } = require('../src/services/analysis');
const { generatePlan } = require('../src/domain/plans');
const { findReplayPlayer } = require('../src/services/replay-validation');
const { evaluateRules } = require('../src/domain/rules');
const { fromStoredBlock } = require('../src/services/stored-block');
const { toBlock } = require('../src/repositories/blocks');
const { blockRow, A } = require('./helpers/stored-database.cjs');
const boost = data => data.evaluations.find(e => e.rule_id === 'boost-disponibilidad');
const analyze = options => analyzeBlock({ current: boostBlock(options) }).data;
const cases = [
  [[15,15,15,0,0], 'active', 'normal', 3, 0],
  [[20,20,20,0,0], 'active', 'high', 3, 3],
  [[20,20,19.999999,0,0], 'active', 'normal', 3, 2],
  [[15,15,14.999999,0,0], 'inactive', null, 2, 0],
  [[100,100,0,0,0], 'inactive', null, 2, 2],
  [[0,0,0,0,0], 'inactive', null, 0, 0],
];
for (const [percents, status, severity, count, highCount] of cases) {
  test('Boost por partida: ' + JSON.stringify(percents), () => {
    const data = analyze({ percents }); const e = boost(data);
    assert.equal(e.status, status); assert.equal(e.evidence.severity, severity);
    assert.equal(e.evidence.matched_replays, count); assert.equal(e.evidence.high_matched_replays, highCount);
    assert.equal(e.evidence.coverage, 5); assert.equal(e.evidence.aggregation, 'per_replay');
    const p = data.priorities.find(p => p.priority_key === 'boost');
    assert.equal(p?.score ?? null, status === 'active' ? severity === 'high' ? 2 : 1 : null);
  });
}
for (const value of [null, undefined, '20', -1, 101, NaN, Infinity, true]) {
  test('Boost inválido/faltante no se transforma en cero: ' + String(value), () => {
    const e = boost(analyze({ percents: [20,20,20,value,20] }));
    assert.equal(e.status, 'not_evaluable'); assert.equal(e.evidence.coverage, 4);
    assert.equal(e.evidence.matched_replays, null);
    assert.equal(e.evidence.observations[3].percent_zero_boost, null);
  });
}
test('Boost faltante no impide finalización; porcentaje válido no necesita tiros', () => {
  const block = boostBlock();
  for (const replay of block.replays) delete findReplayPlayer(replay, block.profile).stats.core.shots;
  const data = analyzeBlock({ current: block }).data;
  assert.equal(data.evaluations[0].status, 'not_evaluable');
  assert.deepEqual(data.priorities.map(p => p.priority_key), ['boost']);
  const missing = analyze({ percents: [20,20,null,20,20] });
  assert.deepEqual(missing.priorities.map(p => p.priority_key), ['shooting']);
});
test('No usa boost 0–25, medias del equipo ni estadísticas de otro jugador', () => {
  const block = boostBlock({ percents: [0,0,0,0,0] });
  for (const r of block.replays) {
    findReplayPlayer(r, block.profile).stats.boost.percent_boost_0_25 = 100;
    r.blue.stats = { boost: { percent_zero_boost: 100 } };
    r.blue.players.push({ id: { platform: 'steam', id: 'OTHER' }, stats: { boost: { percent_zero_boost: 100 } } });
  }
  assert.equal(boost(analyzeBlock({ current: block }).data).status, 'inactive');
});
test('Usa porcentaje del proveedor sin deducirlo de duration, play_duration ni segundos', () => {
  const block = boostBlock({ percents: [15,15,15,10,10], seconds: [10,10,10,10,10] });
  block.replays.forEach(r => { delete r.play_duration; r.duration = 9999; });
  const data = analyzeBlock({ current: block }).data;
  assert.equal(boost(data).status, 'active');
  assert.equal(data.metrics.values.play_duration_s.value, null);
  assert.equal(data.metrics.values.boost_zero_s.value, 50);
});
test('Segundos faltantes son null sin invalidar porcentajes originales presentes', () => {
  const data = analyze({ seconds: [60,null,60,30,30] });
  assert.equal(boost(data).status, 'active');
  assert.equal(data.metrics.values.boost_zero_s.value, null);
  assert.equal(data.metrics.values.boost_zero_s.coverage, 4);
});
test('Cero segundos y porcentaje positivo no constituyen evidencia coherente', () => {
  const data = analyze({ seconds: [0,60,60,30,30] });
  assert.equal(boost(data).status, 'not_evaluable');
  assert.equal(boost(data).evidence.observations[0].percent_missing_reason, 'inconsistent_zero_boost');
});
test('Modo 3v3 admite el criterio provisional; 1v1 queda sin evaluar', () => {
  assert.equal(boost(analyze({ mode: '3v3' })).status, 'active');
  assert.equal(boost(analyze({ mode: '1v1' })).reason, 'BOOST_MODE_UNSUPPORTED');
});
for (const type of ['private','unranked-doubles']) test('No extrapola automáticamente a ' + type, () => {
  const block = boostBlock(); block.replays.forEach(r => { r.playlist_id = type; });
  assert.equal(boost(analyzeBlock({ current: block }).data).reason, 'BOOST_MATCH_TYPE_UNSUPPORTED');
});
test('La evaluación rechaza evidencia con IDs, cobertura o base manipulados', () => {
  for (const mutate of [b => { b.coverage = 0; }, b => { b.measurement_basis = 'duration'; },
    b => { b.observations[0].replay_id = 'OTHER'; }, b => { b.observations[0].percent.unit = 'seconds'; }]) {
    const data = analyze(); mutate(data.metrics.boost_zero_per_replay);
    assert.equal(boost(evaluateRules(data.metrics)).status, 'not_evaluable');
  }
});
test('SQL sin porcentaje de origen conserva segundos y no inventa el porcentaje', () => {
  const row = blockRow(); row.replays.forEach(r => { r.jugadores_replay.metricas_replay.boost_cero_s = 100; });
  const data = analyzeBlock({ current: fromStoredBlock(toBlock(row), A) }).data;
  assert.equal(data.metrics.values.boost_zero_s.value, 500);
  assert.equal(boost(data).status, 'not_evaluable');
  assert.equal(boost(data).evidence.observations[0].percent_missing_reason, 'stored_boost_percentage_not_recorded');
});
test('Boost alto ordena antes de finalización y las rutinas son nativas versionadas', () => {
  const p = generatePlan(boostPlan());
  assert.deepEqual(p.diagnosis_snapshot.priorities.map(p => p.priority_key), ['boost','shooting']);
  assert.equal(p.coverage, 'complete'); assert.equal(p.assigned_minutes, 20);
  assert.deepEqual(p.exercises.map(e => e.assigned_minutes), [5,5,5,5]);
  assert.equal(p.native_catalog_version, 'mvp.native-boost.v1');
  const exercises = p.exercises.filter(e => e.priority_key === 'boost');
  assert.equal(exercises.length, 2);
  for (const e of exercises) {
    assert.equal(e.exercise_version_id, null); assert.equal(e.exercise_snapshot.source, 'bundled_native_instructions');
    assert.equal(e.exercise_snapshot.resource_type, 'free_play');
    assert.match(e.exercise_snapshot.instructions.join(' '), /desactivar boost ilimitado/);
    assert.doesNotMatch(e.exercise_snapshot.instructions.join(' '), /asegurar.*gol/i);
  }
});
test('Boost solo reparte 20 minutos en 10+10, también para Epic sin Workshop', () => {
  const p = generatePlan(boostPlan({ platform: 'epic', workshop: false, shooting: false }));
  assert.equal(p.coverage, 'complete'); assert.deepEqual(p.exercises.map(e => e.assigned_minutes), [10,10]);
  assert.ok(p.exercises.every(e => e.priority_key === 'boost'));
});
test('Cinco minutos cubren solo la primera prioridad y diez cubren ambas antes de repetir', () => {
  const five = generatePlan(boostPlan({ minutes: 5 }));
  assert.equal(five.coverage, 'partial'); assert.deepEqual(five.uncovered_priorities, ['shooting']);
  assert.deepEqual(five.exercises.map(e => e.priority_key), ['boost']);
  const ten = generatePlan(boostPlan({ minutes: 10 }));
  assert.equal(ten.coverage, 'complete'); assert.deepEqual(ten.exercises.map(e => e.priority_key), ['boost','shooting']);
});
test('Catálogo SQL sin tiros ofrece boost nativo y declara finalización sin cubrir', () => {
  const input = boostPlan(); input.catalog.exercises = [];
  const p = generatePlan(input);
  assert.equal(p.coverage, 'partial'); assert.deepEqual(p.uncovered_priorities, ['shooting']);
  assert.equal(p.assigned_minutes, 20); assert.deepEqual(p.exercises.map(e => e.assigned_minutes), [10,10]);
});
test('Prioridades con score o evidencia alterados no seleccionan rutinas', () => {
  for (const change of [p => { p.score = 99; }, p => { p.evidence.matched_replays = 4; }]) {
    const input = boostPlan({ shooting: false }); change(input.analysis.priorities[0]);
    const p = generatePlan(input); assert.equal(p.coverage, 'empty'); assert.deepEqual(p.exercises, []);
  }
});
test('Rutinas y snapshots no se mutan entre propuestas', () => {
  const input = boostPlan(); const before = structuredClone(input); const first = generatePlan(input);
  first.exercises[0].exercise_snapshot.instructions.push('alteración');
  first.diagnosis_snapshot.priorities[0].evidence.observations[0].percent_zero_boost = 99;
  const next = generatePlan(input);
  assert.doesNotMatch(next.exercises[0].exercise_snapshot.instructions.join(' '), /alteración/);
  assert.equal(next.diagnosis_snapshot.priorities[0].evidence.observations[0].percent_zero_boost, 20);
  assert.deepEqual(input, before);
});
test('Dos prioridades de 0–120 minutos conservan suma, mínimo y reparto entre áreas', () => {
  for (const workshop of [false,true]) for (const shooting of [false,true]) {
    const input = boostPlan({ workshop, shooting });
    for (let minutes = 0; minutes <= 120; minutes++) {
      input.availability_minutes = minutes; const p = generatePlan(input);
      assert.equal(p.assigned_minutes, minutes < 5 ? 0 : minutes);
      assert.ok(p.exercises.every(e => Number.isInteger(e.assigned_minutes) && e.assigned_minutes >= 5));
      if (shooting && minutes >= 10) {
        const boostMinutes = p.exercises.filter(e => e.priority_key === 'boost').reduce((s,e) => s+e.assigned_minutes,0);
        assert.ok(Math.abs(boostMinutes - minutes/2) <= .5);
      }
    }
  }
});
