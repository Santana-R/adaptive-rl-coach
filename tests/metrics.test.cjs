const test = require('node:test');
const assert = require('node:assert/strict');
const fixture = require('./fixtures/replay-validation/bloque-a14.json');
const { calculateBlockMetrics } = require('../src/domain/metrics');
const { extractReplayBlockMetrics, findReplayPlayer } = require('../src/services/replay-validation');
const { calculateReplayBlockMetrics } = require('../src/services/block-metrics');

function input() {
  return structuredClone(fixture.input);
}

function evaluate(data) {
  return calculateReplayBlockMetrics(data.replays, data.profile, { source: 'synthetic' });
}

function withCounts(rows) {
  const data = input();
  rows.forEach(([goals, shots], i) => {
    const core = findReplayPlayer(data.replays[i], data.profile).stats.core;
    core.goals = goals;
    core.shots = shots;
  });
  return data;
}

test('A14 → métricas: 7 goles / 17 tiros, contexto, unidades y trazabilidad', () => {
  const result = evaluate(input());
  assert.equal(result.valid, true);
  const metrics = result.data;
  assert.equal(metrics.source, 'synthetic');
  assert.equal(metrics.metrics_version, 'mvp.metrics.v1');
  assert.equal(metrics.sample_size, 5);
  assert.equal(metrics.context.player_id, 'TEST_PLAYER_01');
  assert.deepEqual(metrics.replay_ids, fixture.input.replays.map(replay => replay.id));
  assert.equal(metrics.values.goals.value, 7);
  assert.equal(metrics.values.goals.unit, 'count');
  assert.equal(metrics.values.shots.value, 17);
  assert.equal(metrics.values.shots.coverage, 5);
  const pct = metrics.values.shooting_pct;
  assert.ok(Math.abs(pct.value - 41.1764705882353) < 1e-12);
  assert.equal(pct.unit, 'percent');
  assert.equal(pct.coverage, 5);
  assert.equal(pct.numerator.value, 7);
  assert.equal(pct.denominator.value, 17);
  assert.equal(pct.missing_reason, null);
  assert.deepEqual(pct.excluded, []);
});

test('ponderación manual: 2/8 = 25 %, frente al promedio simple incorrecto de 40 %', () => {
  const data = withCounts([[1, 1], [1, 1], [0, 2], [0, 2], [0, 2]]);
  const values = evaluate(data).data.values;
  assert.equal(values.goals.value, 2);
  assert.equal(values.shots.value, 8);
  assert.equal(values.shooting_pct.value, 25);
});

test('calcula 3/10 = 30 % en 2v2 sin aplicar todavía la muestra mínima de A17', () => {
  const data = withCounts([[1, 2], [1, 2], [1, 2], [0, 2], [0, 2]]);
  assert.equal(evaluate(data).data.values.shooting_pct.value, 30);
});

test('conserva el valor sin redondear: 7/23 es mayor que 30 %', () => {
  const data = withCounts([[2, 5], [2, 5], [1, 5], [1, 4], [1, 4]]);
  const pct = evaluate(data).data.values.shooting_pct.value;
  assert.ok(pct > 30);
  assert.ok(Math.abs(pct - 30.434782608695652) < 1e-12);
});

test('solo agrega al jugador elegido, aunque haya compañeros, rivales e ID en otra plataforma', () => {
  const data = input();
  for (const replay of data.replays) {
    for (const team of ['blue', 'orange']) {
      replay[team] ??= { players: [] };
      replay[team].players.unshift({
        id: { platform: 'epic', id: data.profile.player_id },
        stats: { core: { goals: 999, shots: 999 } },
      });
      replay[team].players.push({
        id: { platform: 'steam', id: 'OTHER_PLAYER' },
        stats: { core: { goals: 888, shots: 888 } },
      });
      replay[team].stats = { core: { goals: 777, shots: 777 } };
    }
  }
  const values = evaluate(data).data.values;
  assert.equal(values.goals.value, 7);
  assert.equal(values.shots.value, 17);
});

test('cero goles con tiros positivos es 0 %, con cobertura completa', () => {
  const values = evaluate(withCounts(Array(5).fill([0, 2]))).data.values;
  assert.equal(values.goals.value, 0);
  assert.equal(values.goals.coverage, 5);
  assert.equal(values.shooting_pct.value, 0);
  assert.equal(values.shooting_pct.missing_reason, null);
});

test('cero tiros conserva el denominador 0 y devuelve eficiencia null', () => {
  const values = evaluate(withCounts(Array(5).fill([0, 0]))).data.values;
  assert.equal(values.shots.value, 0);
  assert.equal(values.shooting_pct.value, null);
  assert.equal(values.shooting_pct.denominator.value, 0);
  assert.equal(values.shooting_pct.coverage, 5);
  assert.equal(values.shooting_pct.missing_reason, 'zero_denominator');
});

for (const key of ['goals', 'shots']) {
  test(`${key} ausente: total null, cobertura 4/5 y replay excluido visible`, () => {
    const data = input();
    delete findReplayPlayer(data.replays[0], data.profile).stats.core[key];
    const values = evaluate(data).data.values;
    assert.equal(values[key].value, null);
    assert.equal(values[key].coverage, 4);
    assert.equal(values[key].missing_reason, 'incomplete_coverage');
    assert.deepEqual(values[key].excluded, [{
      replay_id: 'test-replay-1', metric_key: key, reason: 'not_available',
    }]);
    assert.equal(values[key === 'goals' ? 'shots' : 'goals'].coverage, 5);
    assert.equal(values.shooting_pct.value, null);
    assert.equal(values.shooting_pct.coverage, 4);
  });
}

test('la cobertura de eficiencia exige goles y tiros en la misma partida', () => {
  const data = input();
  delete findReplayPlayer(data.replays[0], data.profile).stats.core.goals;
  delete findReplayPlayer(data.replays[1], data.profile).stats.core.shots;
  const values = evaluate(data).data.values;
  assert.equal(values.goals.coverage, 4);
  assert.equal(values.shots.coverage, 4);
  assert.equal(values.shooting_pct.coverage, 3);
  assert.equal(values.shooting_pct.value, null);
  assert.equal(values.shooting_pct.excluded.length, 2);
});

test('dos campos ausentes en un replay excluyen una sola partida de la cobertura', () => {
  const data = input();
  const core = findReplayPlayer(data.replays[0], data.profile).stats.core;
  delete core.goals;
  delete core.shots;
  const pct = evaluate(data).data.values.shooting_pct;
  assert.equal(pct.coverage, 4);
  assert.equal(pct.excluded.length, 2);
});

test('ausencia total de tiros informa cobertura 0 y no inventa un denominador', () => {
  const data = input();
  for (const replay of data.replays) delete findReplayPlayer(replay, data.profile).stats.core.shots;
  const values = evaluate(data).data.values;
  assert.equal(values.goals.value, 7);
  assert.equal(values.shots.value, null);
  assert.equal(values.shooting_pct.denominator.value, null);
  assert.equal(values.shooting_pct.coverage, 0);
  assert.equal(values.shooting_pct.missing_reason, 'not_available');
});

test('un conteo inválido del proveedor se conserva como faltante, no como cero', () => {
  const data = input();
  findReplayPlayer(data.replays[0], data.profile).stats.core.shots = '3';
  assert.equal(evaluate(data).data.values.shots.value, null);
});

for (const item of fixture.incompatible) {
  test(`un bloque rechazado por A14 no se agrega: ${item.case_id}`, () => {
    const data = input();
    data.replays[4] = { ...data.replays[4], ...structuredClone(item.replay_5_patch) };
    assert.deepEqual(evaluate(data), item.output);
  });
}

for (const count of [4, 6]) {
  test(`rechaza ${count} partidas antes de calcular métricas`, () => {
    const data = input();
    if (count === 4) data.replays.pop();
    else data.replays.push(structuredClone(data.replays[0]));
    const result = evaluate(data);
    assert.equal(result.valid, false);
    assert.deepEqual(result.reason_codes, ['REPLAY_COUNT_INVALID']);
    assert.equal(result.data, null);
  });
}

test('la función de dominio exige IDs distintos incluso si se llama directamente', () => {
  const data = input();
  const normalized = extractReplayBlockMetrics(data.replays, data.profile).data;
  normalized.replays[1].replay_id = normalized.replays[0].replay_id;
  assert.throws(() => calculateBlockMetrics(normalized), /identificador distinto/);
});

test('una unidad distinta de count no se suma como si fueran tiros', () => {
  const data = input();
  const normalized = extractReplayBlockMetrics(data.replays, data.profile).data;
  normalized.replays[0].values.shots.unit = 'percent';
  const shots = calculateBlockMetrics(normalized).values.shots;
  assert.equal(shots.value, null);
  assert.equal(shots.excluded[0].reason, 'unit_mismatch');
});

test('no publica porcentajes fuera de 0–100 ni totales que pierdan precisión entera', () => {
  const badRatio = evaluate(withCounts(Array(5).fill([2, 1]))).data.values.shooting_pct;
  assert.equal(badRatio.value, null);
  assert.equal(badRatio.missing_reason, 'out_of_range');
  const huge = evaluate(withCounts(Array(5).fill([Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]))).data.values;
  assert.equal(huge.goals.value, null);
  assert.equal(huge.goals.missing_reason, 'unsafe_total');
  assert.equal(huge.shooting_pct.value, null);
});

test('no modifica los datos de entrada y conserva la procedencia por defecto', () => {
  const data = input();
  const before = structuredClone(data);
  const result = calculateReplayBlockMetrics(data.replays, data.profile);
  assert.deepEqual(data, before);
  assert.equal(result.data.source, 'ballchasing');
});
