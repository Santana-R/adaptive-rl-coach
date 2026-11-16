const test = require('node:test');
const assert = require('node:assert/strict');
const cases = require('./fixtures/analisis/regla-finalizacion.json');
const tie = require('./fixtures/analisis/empate.json');
const missing = require('./fixtures/analisis/faltantes.json');
const rawFixture = require('./fixtures/replay-validation/bloque-a14.json');
const { calculateBlockMetrics } = require('../src/domain/metrics');
const { evaluateRules, rankPriorities } = require('../src/domain/rules');
const { RULES_CONFIG } = require('../src/domain/rules-config');
const { evaluateReplayBlockRules } = require('../src/services/block-rules');
const { compareReplayBlocks } = require('../src/services/block-comparison');

// Distribución sintética de totales en cinco partidas. Un null del fixture falta en una partida.
function normalized({ mode = '3v3', goals = 3, shots = 10 } = {}) {
  return calculateBlockMetrics({
    source: 'synthetic',
    context: { platform: 'steam', player_id: 'TEST_PLAYER_01', mode, match_type: 'ranked' },
    replays: Array.from({ length: 5 }, (_, index) => ({
      replay_id: `synthetic-${index}`,
      values: {
        goals: { value: index === 0 ? goals : 0, unit: 'count' },
        shots: { value: index === 0 ? shots : 0, unit: 'count' },
      },
    })),
  });
}

function evaluation(block) { return evaluateRules(block).evaluations[0]; }

function matchesManualPercentage(actual, expected) {
  if (expected === null) assert.equal(actual, null);
  // La representación decimal manual y (goles / tiros) * 100 pueden diferir en el último bit.
  // La tolerancia solo compara este resultado esperado; la regla nunca redondea para decidir.
  else assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 1e-12);
}

test('Configuración publicada coincide con la ficha A02 y no se puede mutar', () => {
  const { score, priority_key, ...definition } = RULES_CONFIG.finalization;
  assert.deepEqual({ ...definition, rules_version: RULES_CONFIG.rules_version }, cases.rule);
  assert.equal(score, 1);
  assert.equal(priority_key, 'shooting');
  assert.equal(RULES_CONFIG.max_priorities, 3);
  assert.equal(Object.isFrozen(RULES_CONFIG), true);
  assert.equal(Object.isFrozen(RULES_CONFIG.finalization), true);
  assert.equal(Object.isFrozen(RULES_CONFIG.finalization.min_shots_by_mode), true);
});

for (const scenario of cases.cases) {
  test(`A02: ${scenario.case_id}`, () => {
    const metrics = normalized(scenario.input);
    const result = evaluateRules(metrics);
    const found = result.evaluations[0];
    assert.equal(metrics.values.goals.coverage, scenario.input.goals_coverage);
    assert.equal(metrics.values.shots.coverage, scenario.input.shots_coverage);
    matchesManualPercentage(metrics.values.shooting_pct.value, scenario.expected.shooting_pct);
    assert.equal(found.status, scenario.expected.rule_status);
    assert.equal(found.reason, scenario.expected.reason);
    assert.equal(result.priorities.length, found.status === 'active' ? 1 : 0);
    matchesManualPercentage(found.evidence.value, scenario.expected.shooting_pct);
    assert.equal(found.evidence.min_shots, cases.rule.min_shots_by_mode[scenario.input.mode]);
  });
}

test('Prioridad activa conserva regla, versión, unidad, conteos, muestra y explicación', () => {
  const result = evaluateRules(normalized());
  const p = result.priorities[0];
  assert.equal(p.rule_id, 'finalizacion-eficiencia');
  assert.equal(p.rules_version, 'mvp.rules.v2');
  assert.equal(p.priority_key, 'shooting');
  assert.equal(p.order, 1);
  assert.equal(p.evidence.value, 30);
  assert.equal(p.evidence.unit, 'percent');
  assert.equal(p.evidence.threshold, 30);
  assert.equal(p.evidence.operator, '<=');
  assert.equal(p.evidence.direction, 'below_or_equal');
  assert.deepEqual(p.evidence.goals, { value: 3, unit: 'count', coverage: 5 });
  assert.deepEqual(p.evidence.shots, { value: 10, unit: 'count', coverage: 5 });
  assert.equal(p.evidence.coverage, 5);
  assert.equal(p.evidence.sample_size, 5);
  assert.equal(p.evidence.source, 'synthetic');
  assert.equal(p.evidence.metrics_version, 'mvp.metrics.v1');
  assert.equal(p.evidence.replay_ids.length, 5);
  assert.match(p.explanation, /3 goles en 10 tiros \(30 %\)/);
  assert.match(p.explanation, /3v3/);
  assert.equal(p.calibration_status, 'agreed_heuristic_not_calibrated');
  assert.ok(result.limitations.includes('synthetic_fixture'));
});

for (const [name, mutate, reason] of [
  ['estado processing', b => { b.status = 'processing'; }, 'BLOCK_NOT_READY'],
  ['versión distinta', b => { b.metrics_version = 'otra'; }, 'METRICS_VERSION_MISMATCH'],
  ['procedencia ausente', b => { delete b.source; }, 'SOURCE_MISSING'],
  ['jugador ausente', b => { delete b.context.player_id; }, 'CONTEXT_INCOMPLETE'],
  ['tipo desconocido', b => { b.context.match_type = 'tournament'; }, 'CONTEXT_INCOMPLETE'],
  ['modalidad desconocida', b => { b.context.mode = '4v4'; }, 'MODE_UNSUPPORTED'],
  ['clave heredada no es modalidad', b => { b.context.mode = '__proto__'; }, 'MODE_UNSUPPORTED'],
  ['cuatro partidas', b => { b.sample_size = 4; b.replay_ids.pop(); }, 'REPLAY_COUNT_INVALID'],
  ['seis partidas', b => { b.sample_size = 6; b.replay_ids.push('extra'); }, 'REPLAY_COUNT_INVALID'],
  ['replay duplicado', b => { b.replay_ids[4] = b.replay_ids[0]; }, 'DUPLICATE_REPLAY'],
  ['ID vacío', b => { b.replay_ids[4] = ' '; }, 'REPLAY_COUNT_INVALID'],
  ['unidad incorrecta', b => { b.values.shooting_pct.unit = 'count'; }, 'UNIT_MISMATCH'],
  ['conteo fraccionario', b => { b.values.shots.value = 10.5; }, 'INVALID_METRIC_VALUE'],
  ['conteo negativo', b => { b.values.goals.value = -1; }, 'INVALID_METRIC_VALUE'],
  ['porcentaje NaN', b => { b.values.shooting_pct.value = NaN; }, 'INVALID_METRIC_VALUE'],
  ['porcentaje infinito', b => { b.values.shooting_pct.value = Infinity; }, 'INVALID_METRIC_VALUE'],
  ['porcentaje fuera de rango', b => { b.values.shooting_pct.value = 101; }, 'INVALID_METRIC_VALUE'],
  ['porcentaje inconsistente', b => { b.values.shooting_pct.value = 25; }, 'INCONSISTENT_METRICS'],
  ['denominador inconsistente', b => { b.values.shooting_pct.denominator.value = 20; }, 'INCONSISTENT_METRICS'],
  ['numerador ausente', b => { delete b.values.shooting_pct.numerator; }, 'INCONSISTENT_METRICS'],
  ['cobertura incompleta', b => { b.values.shooting_pct.coverage = 4; }, 'INCOMPLETE_METRIC_COVERAGE'],
  ['porcentaje ausente', b => { delete b.values.shooting_pct; }, 'METRIC_UNAVAILABLE'],
  ['null con cobertura completa', b => { b.values.shooting_pct.value = null; b.values.shooting_pct.missing_reason = 'not_available'; }, 'METRIC_UNAVAILABLE'],
  ['métricas ausentes', b => { delete b.values; }, 'METRIC_UNAVAILABLE'],
]) {
  test(`No concluye con ${name}`, () => {
    const block = normalized(); mutate(block);
    const result = evaluateRules(block);
    assert.deepEqual(result.priorities, []);
    assert.equal(result.evaluations[0].status, 'not_evaluable');
    assert.equal(result.evaluations[0].reason, reason);
  });
}

test('Bloque null no se trata como dato disponible', () => {
  assert.equal(evaluation(null).reason, 'BLOCK_INVALID');
  assert.deepEqual(evaluateRules(null).priorities, []);
});

test('Un primer bloque válido puede activar sin anterior ni fechas', () => {
  const block = normalized();
  block.status = 'ready'; block.first_match_at = null; block.last_match_at = null;
  assert.equal(evaluation(block).status, 'active');
});

test('Misma entrada da el mismo resultado sin modificar métricas ni evidencia original', () => {
  const block = normalized(); const original = structuredClone(block);
  const first = evaluateRules(block);
  assert.deepEqual(evaluateRules(block), first);
  first.priorities[0].evidence.context.mode = '1v1';
  first.priorities[0].evidence.replay_ids.pop();
  assert.deepEqual(block, original);
});

test('Boost y duración ausentes no impiden evaluar finalización ni activan boost sin cobertura', () => {
  const block = normalized();
  block.values.boost_avg = { value: null, unit: 'percent', missing_reason: 'not_available' };
  assert.equal(block.values.play_duration_s.value, null);
  const result = evaluateRules(block);
  assert.deepEqual(result.priorities.map(p => p.rule_id), ['finalizacion-eficiencia']);
  assert.equal(result.evaluations.length, 2);
});

test('Fixture faltantes: 0/0 sigue null y boost null no activa otra regla', () => {
  const block = normalized(missing.input);
  const result = evaluateRules(block);
  assert.equal(block.values.shooting_pct.value, missing.expected.shooting_pct);
  assert.equal(result.evaluations[0].reason, missing.expected.shooting_missing_reason);
  assert.equal(result.priorities.some(p => p.priority_key === 'boost'), missing.expected.boost_rule_active);
});

test('Empate A02: score descendente, ID ascendente y máximo tres; entrada intacta', () => {
  const input = structuredClone(tie.input.activated_rules), before = structuredClone(input);
  const result = rankPriorities(input);
  assert.deepEqual(result.map(p => p.rule_id), tie.expected.priority_rule_ids);
  assert.equal(result.length, tie.expected.max_priorities);
  assert.deepEqual(result.map(p => p.order), [1, 2, 3]);
  assert.deepEqual(input, before);
  assert.deepEqual(rankPriorities(input.reverse()), result);
});

test('Ordenador conserva la evidencia, acepta cero y no completa lugares vacíos', () => {
  const p = evaluateRules(normalized()).priorities[0];
  assert.deepEqual(rankPriorities([p]), [p]);
  assert.deepEqual(rankPriorities([]), []);
  assert.equal(rankPriorities([{ rule_id: 'zero', score: 0 }]).length, 1);
});

test('Ordenador rechaza score inválido o reglas repetidas', () => {
  for (const input of [null, [{ rule_id: 'a', score: NaN }], [{ rule_id: 'a', score: -1 }],
    [{ rule_id: '', score: 1 }], [{ rule_id: 'a', score: 1 }, { rule_id: 'a', score: 2 }]]) {
    assert.throws(() => rankPriorities(input), TypeError);
  }
});

test('Servicio A14 → A09 → A17 cambia activación al variar tiros y no lee escenarios', () => {
  const fixture = structuredClone(rawFixture.input);
  const inputBefore = structuredClone(fixture);
  let result = evaluateReplayBlockRules(fixture.replays, fixture.profile, { source: 'synthetic' });
  assert.equal(result.valid, true);
  assert.equal(result.data.metrics.values.shots.value, 17);
  assert.equal(result.data.evaluations[0].status, 'inactive'); // 7/17 ≈ 41.18 %.
  assert.deepEqual(fixture, inputBefore);
  fixture.replays[0].blue.players[0].stats.core.shots += 10; // Mismos 7 goles; 27 tiros.
  result = evaluateReplayBlockRules(fixture.replays, fixture.profile, { source: 'synthetic' });
  assert.equal(result.data.metrics.values.shots.value, 27);
  assert.equal(result.data.priorities.length, 1);
  assert.equal(result.data.priorities[0].evidence.value, (7 / 27) * 100);
  assert.equal(result.data.priorities[0].evidence.shots.value, 27);
});

test('Servicio preserva rechazo de A14 por duplicado y no produce diagnóstico', () => {
  const input = structuredClone(rawFixture.input);
  input.replays[4] = input.replays[0];
  const result = evaluateReplayBlockRules(input.replays, input.profile, { source: 'synthetic' });
  assert.equal(result.valid, false);
  assert.equal(result.data, null);
  assert.ok(result.reason_codes.includes('DUPLICATE_REPLAY'));
});

test('A10 y A17 son independientes: incompatible 2v2 → 3v3, pero regla actual activa', () => {
  const fixture = require('./fixtures/analisis/incompatible.json');
  function raw(summary) {
    return {
      block_id: summary.block_id, source: 'synthetic',
      profile: { ...summary.context },
      replays: summary.replay_ids.map((id, index) => ({
        id, status: 'ok', team_size: Number(summary.context.mode[0]),
        playlist_id: summary.context.mode === '3v3' ? 'ranked-standard' : 'ranked-doubles',
        date: new Date(Date.parse(summary.first_match_at) + index * 60000).toISOString(), date_has_timezone: true,
        blue: { players: [{ id: { platform: 'steam', id: 'TEST_PLAYER_01' }, stats: { core: {
          goals: index === 0 ? summary.goals : 0, shots: index === 0 ? summary.shots : 0,
        } } }] },
      })),
    };
  }
  const pair = compareReplayBlocks(raw(fixture.input.current), raw(fixture.input.baseline));
  assert.equal(pair.comparison.status, 'not_comparable');
  assert.ok(pair.comparison.reason_codes.includes('MODE_MISMATCH'));
  assert.equal(evaluation(pair.current).status, 'active');
  assert.equal(evaluation(pair.baseline).reason, 'INSUFFICIENT_SHOTS');
});

test('Casos primer bloque y comparable mantienen comparación pero no cumplen mínimo 2v2', () => {
  for (const name of ['primer-bloque', 'comparable']) {
    const fixture = require(`./fixtures/analisis/${name}.json`);
    const summary = fixture.input.current;
    assert.equal(evaluation(normalized({ ...summary, mode: summary.context.mode })).reason, 'INSUFFICIENT_SHOTS');
  }
});
