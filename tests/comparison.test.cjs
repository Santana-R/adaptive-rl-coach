const test = require('node:test');
const assert = require('node:assert/strict');
const comparable = require('./fixtures/analisis/comparable.json');
const firstBlock = require('./fixtures/analisis/primer-bloque.json');
const incompatible = require('./fixtures/analisis/incompatible.json');
const { compareBlocks, resolveBaseline } = require('../src/domain/comparison');
const { buildComparisonBlock, compareReplayBlocks } = require('../src/services/block-comparison');
const { parseTimestamp } = require('../src/domain/timestamps');

// Adapta los totales sintéticos de A02 a cinco respuestas para ejecutar A14 → A09 → A10.
function rawBlock(summary) {
  const { metrics_version, ...context } = summary.context;
  const first = Date.parse(summary.first_match_at), last = Date.parse(summary.last_match_at);
  const teamSize = Number(context.mode[0]);
  const playlist = { '1v1': 'duels', '2v2': 'doubles', '3v3': 'standard' }[context.mode];
  return {
    block_id: summary.block_id,
    source: 'synthetic',
    profile: { platform: context.platform, player_id: context.player_id, mode: context.mode },
    replays: summary.replay_ids.map((id, i) => ({
      id, status: 'ok', team_size: teamSize,
      playlist_id: `${context.match_type === 'ranked' ? 'ranked' : 'unranked'}-${playlist}`,
      date: new Date(first + ((last - first) * i / 4)).toISOString(),
      date_has_timezone: true,
      play_duration: 300,
      blue: { players: [{
        id: { platform: context.platform, id: context.player_id },
        stats: { core: { goals: i === 0 ? summary.goals : 0, shots: i === 0 ? summary.shots : 0 } },
      }] },
    })),
  };
}

function rawPair() {
  return { current: rawBlock(comparable.input.current), baseline: rawBlock(comparable.input.baseline) };
}

function pair() {
  const raw = rawPair();
  return { current: buildComparisonBlock(raw.current), baseline: buildComparisonBlock(raw.baseline) };
}

function rejects(result, reason) {
  assert.equal(result.status, 'not_comparable');
  assert.ok(result.reason_codes.includes(reason), JSON.stringify(result));
  assert.equal(result.deltas, null);
}

test('A02 primer bloque ejecutado con A14/A09: línea base sin delta', () => {
  const result = compareReplayBlocks(rawBlock(firstBlock.input.current)).comparison;
  assert.equal(result.status, firstBlock.expected.comparison_status);
  assert.deepEqual(result.reason_codes, firstBlock.expected.reason_codes);
  assert.equal(result.deltas, firstBlock.expected.delta);
  assert.equal(result.baseline_block_id, null);
});

test('A02 comparable ejecutado con A14/A09: 25 % → 30 % = +5 puntos porcentuales', () => {
  const raw = rawPair();
  const result = compareReplayBlocks(raw.current, raw.baseline).comparison;
  assert.equal(result.status, comparable.expected.comparison_status);
  assert.deepEqual(result.reason_codes, []);
  const pct = result.deltas.shooting_pct;
  assert.equal(pct.baseline, comparable.expected.baseline_shooting_pct);
  assert.equal(pct.current, comparable.expected.current_shooting_pct);
  assert.equal(pct.delta, comparable.expected.delta_pp);
  assert.equal(pct.unit, 'percentage_points');
  assert.equal(result.deltas.goals.delta, 1);
  assert.equal(result.deltas.shots.delta, 2);
  assert.equal(result.current_block_id, 'test-block-current');
  assert.equal(result.baseline_block_id, 'test-block-baseline');
});

test('A02 incompatible ejecutado con A14/A09: modalidad distinta sin delta', () => {
  const result = compareReplayBlocks(rawBlock(incompatible.input.current), rawBlock(incompatible.input.baseline)).comparison;
  assert.equal(result.status, incompatible.expected.comparison_status);
  assert.deepEqual(result.reason_codes, incompatible.expected.reason_codes);
  assert.equal(result.deltas, incompatible.expected.delta);
});

for (const [name, change, reason] of [
  ['jugador', b => { b.context.player_id = 'OTHER_PLAYER'; }, 'PLAYER_MISMATCH'],
  ['plataforma', b => { b.context.platform = 'epic'; }, 'PLAYER_MISMATCH'],
  ['modalidad', b => { b.context.mode = '3v3'; }, 'MODE_MISMATCH'],
  ['tipo de partida', b => { b.context.match_type = 'casual'; }, 'MATCH_TYPE_MISMATCH'],
  ['versión', b => { b.metrics_version = 'mvp.metrics.v2'; }, 'METRICS_VERSION_MISMATCH'],
  ['procedencia', b => { b.source = 'ballchasing'; }, 'SOURCE_MISMATCH'],
]) {
  test(`rechaza una diferencia de ${name}`, () => {
    const p = pair();
    change(p.current);
    rejects(compareBlocks(p.current, p.baseline), reason);
  });
}

test('conserva varios motivos de incompatibilidad sin calcular diferencias', () => {
  const p = pair();
  p.current.context.mode = '1v1';
  p.current.context.match_type = 'casual';
  const result = compareBlocks(p.current, p.baseline);
  rejects(result, 'MODE_MISMATCH');
  assert.ok(result.reason_codes.includes('MATCH_TYPE_MISMATCH'));
});

test('un mismo bloque no puede compararse consigo mismo', () => {
  const p = pair();
  p.current.block_id = p.baseline.block_id;
  rejects(compareBlocks(p.current, p.baseline), 'SAME_BLOCK');
});

test('rechaza un ID de replay compartido entre bloques', () => {
  const p = pair();
  p.current.replay_ids[0] = p.baseline.replay_ids[0];
  rejects(compareBlocks(p.current, p.baseline), 'SHARED_REPLAYS');
});

for (const key of ['rocket_league_id', 'match_guid']) {
  test(`conserva ${key} y detecta una partida compartida aunque cambie el ID del proveedor`, () => {
    const p = rawPair();
    p.current.replays[0][key] = 'SAME_MATCH';
    p.baseline.replays[4][key] = 'SAME_MATCH';
    rejects(compareReplayBlocks(p.current, p.baseline).comparison, 'SHARED_REPLAYS');
  });
}

for (const [name, first] of [
  ['intercaladas', '2026-10-08T20:30:00Z'],
  ['igual al último instante anterior', '2026-10-08T21:00:00Z'],
  ['anteriores', '2026-10-07T20:00:00Z'],
]) {
  test(`rechaza partidas actuales ${name}`, () => {
    const p = pair();
    p.current.first_match_at = first;
    rejects(compareBlocks(p.current, p.baseline), 'CHRONOLOGY_INVALID');
  });
}

test('compara instantes en UTC, no el texto de los offsets', () => {
  const p = pair();
  p.current.first_match_at = '2026-10-08T15:00:01-06:00';
  assert.equal(compareBlocks(p.current, p.baseline).status, 'comparable');
  p.current.first_match_at = '2026-10-08T15:00:00-06:00';
  rejects(compareBlocks(p.current, p.baseline), 'CHRONOLOGY_INVALID');
});

test('una ventana invertida dentro del bloque también es inválida', () => {
  const p = pair();
  p.current.first_match_at = '2026-10-11T20:00:00Z';
  rejects(compareBlocks(p.current, p.baseline), 'CHRONOLOGY_INVALID');
});

for (const value of [null, '2026-10-10T20:00:00', '2026-02-30T20:00:00Z', '2026-10-10T24:00:00Z', '2026-10-10T20:00:00+24:00']) {
  test(`rechaza una fecha ausente, ambigua o inválida: ${value}`, () => {
    const p = pair();
    p.current.first_match_at = value;
    rejects(compareBlocks(p.current, p.baseline), 'CHRONOLOGY_INVALID');
  });
}

test('el parser conserva el instante 0 y valida años bisiestos', () => {
  assert.equal(parseTimestamp('1970-01-01T00:00:00Z'), 0);
  assert.equal(parseTimestamp('2024-02-29T00:00:00Z'), Date.parse('2024-02-29T00:00:00Z'));
  assert.equal(parseTimestamp('2026-02-29T00:00:00Z'), null);
});

test('el servicio ordena fechas aunque los cinco replays lleguen desordenados', () => {
  const p = rawPair();
  p.current.replays.reverse();
  const block = buildComparisonBlock(p.current);
  assert.equal(block.first_match_at, '2026-10-10T20:00:00.000Z');
  assert.equal(block.last_match_at, '2026-10-10T21:00:00.000Z');
  assert.equal(block.values.shooting_pct.value, 30);
});

test('una fecha de subida no sustituye la fecha de partida ausente', () => {
  const p = rawPair();
  delete p.current.replays[0].date;
  p.current.replays[0].created = '2026-10-10T20:00:00Z';
  const result = compareReplayBlocks(p.current, p.baseline);
  rejects(result.comparison, 'CHRONOLOGY_INVALID');
  assert.equal(result.current.values.goals.value, 3);
  assert.equal(result.current.first_match_at, null);
  assert.deepEqual(result.current.date_exclusions, [{ replay_id: 'b1', reason: 'not_available' }]);
});

test('requiere la zona horaria confirmada por el proveedor', () => {
  const p = rawPair();
  p.current.replays[0].date_has_timezone = false;
  const result = compareReplayBlocks(p.current, p.baseline);
  rejects(result.comparison, 'CHRONOLOGY_INVALID');
  assert.equal(result.current.date_exclusions[0].reason, 'timezone_unverified');
});

test('conserva el rechazo de A14 y no compara un bloque inválido', () => {
  const p = rawPair();
  p.current.replays[1].id = p.current.replays[0].id;
  rejects(compareReplayBlocks(p.current, p.baseline).comparison, 'DUPLICATE_REPLAY');
});

for (const [name, change, reason] of [
  ['no listo', b => { b.status = 'processing'; }, 'BLOCK_NOT_READY'],
  ['sin contexto', b => { b.context.player_id = null; }, 'CONTEXT_INCOMPLETE'],
  ['sin versión', b => { delete b.metrics_version; }, 'METRICS_VERSION_MISSING'],
  ['sin procedencia', b => { delete b.source; }, 'SOURCE_MISSING'],
  ['cuatro partidas', b => { b.sample_size = 4; b.replay_ids.pop(); }, 'REPLAY_COUNT_INVALID'],
  ['IDs repetidos', b => { b.replay_ids[1] = b.replay_ids[0]; }, 'DUPLICATE_REPLAY'],
  ['ID de bloque no serializado', b => { b.block_id = Number.MAX_SAFE_INTEGER + 1; }, 'BLOCK_ID_INVALID'],
]) {
  test(`un primer bloque ${name} no se declara línea base válida`, () => {
    const p = pair();
    change(p.current);
    rejects(compareBlocks(p.current), reason);
  });
}

test('un anterior explícito inválido no se trata como si no existiera', () => {
  rejects(compareBlocks(pair().current, false), 'BLOCK_INVALID');
});

test('preserva IDs bigint serializados sin convertirlos a números', () => {
  const p = pair();
  p.current.block_id = '9007199254740993';
  p.baseline.block_id = '9007199254740992';
  const result = compareBlocks(p.current, p.baseline);
  assert.equal(result.status, 'comparable');
  assert.equal(result.current_block_id, '9007199254740993');
});

test('una métrica ausente omite solo su delta y conserva las demás', () => {
  const p = pair();
  p.current.values.shooting_pct.value = null;
  p.current.values.shooting_pct.missing_reason = 'zero_denominator';
  const result = compareBlocks(p.current, p.baseline);
  assert.equal(result.status, 'comparable');
  assert.equal(result.deltas.shooting_pct.delta, null);
  assert.equal(result.deltas.shooting_pct.missing_reason, 'zero_denominator');
  assert.equal(result.deltas.goals.delta, 1);
});

for (const [name, change, reason] of [
  ['unidad', m => { m.unit = 'count'; }, 'unit_mismatch'],
  ['cobertura', m => { m.coverage = 4; }, 'incomplete_coverage'],
  ['valor no finito', m => { m.value = NaN; }, 'invalid_value'],
  ['porcentaje fuera de rango', m => { m.value = 101; }, 'invalid_value'],
]) {
  test(`no calcula un delta de eficiencia con ${name} inválida`, () => {
    const p = pair();
    change(p.current.values.shooting_pct);
    const result = compareBlocks(p.current, p.baseline);
    assert.equal(result.status, 'comparable');
    assert.equal(result.deltas.shooting_pct.delta, null);
    assert.equal(result.deltas.shooting_pct.missing_reason, reason);
  });
}

test('mantiene cero como dato y calcula cambios positivos, negativos y nulos', () => {
  const p = pair();
  p.current.values.goals.value = 0;
  p.current.values.shots.value = 8;
  p.current.values.shooting_pct.value = 0;
  const result = compareBlocks(p.current, p.baseline);
  assert.equal(result.deltas.goals.delta, -2);
  assert.equal(result.deltas.shots.delta, 0);
  assert.equal(result.deltas.shooting_pct.delta, -25);
});

test('duraciones con base distinta no se restan aunque ambas usen segundos', () => {
  const p = pair();
  p.current.values.play_duration_s.scope = 'player';
  const result = compareBlocks(p.current, p.baseline);
  assert.equal(result.status, 'comparable');
  assert.equal(result.deltas.play_duration_s.delta, null);
  assert.equal(result.deltas.play_duration_s.missing_reason, 'incompatible_measurement');
  assert.equal(result.deltas.shooting_pct.delta, 5);
});

test('sin ninguna métrica disponible no inventa diferencias', () => {
  const p = pair();
  p.current.values = {};
  rejects(compareBlocks(p.current, p.baseline), 'NO_COMPARABLE_METRICS');
});

function historical(id, day) {
  const block = pair().baseline;
  block.block_id = id;
  block.first_match_at = `2026-10-${day}T20:00:00Z`;
  block.last_match_at = `2026-10-${day}T21:00:00Z`;
  block.replay_ids = Array.from({ length: 5 }, (_, i) => `${id}-${i}`);
  delete block.replay_keys;
  return block;
}

test('resuelve el anterior compatible más reciente y explica candidatos descartados', () => {
  const current = pair().current;
  const old = historical('old', '06'), recent = historical('recent', '08');
  const otherMode = historical('other-mode', '09');
  otherMode.context.mode = '3v3';
  const result = resolveBaseline(current, [otherMode, old, recent]);
  assert.equal(result.status, 'comparable');
  assert.equal(result.baseline_block_id, 'recent');
  assert.deepEqual(result.skipped_candidates, [{ block_id: 'other-mode', reason_codes: ['MODE_MISMATCH'] }]);
});

test('si el historial no ofrece anterior compatible, establece línea base', () => {
  const other = historical('other', '09');
  other.context.mode = '1v1';
  const result = resolveBaseline(pair().current, [other]);
  assert.equal(result.status, 'baseline');
  assert.equal(result.baseline_block_id, null);
  assert.equal(result.deltas, null);
  assert.equal(result.skipped_candidates[0].reason_codes[0], 'MODE_MISMATCH');
});

test('la elección con igual fecha es determinista y no modifica entradas', () => {
  const current = pair().current;
  const history = [historical('z', '08'), historical('a', '08')];
  const snapshot = structuredClone({ current, history });
  assert.equal(resolveBaseline(current, history).baseline_block_id, 'a');
  assert.equal(resolveBaseline(current, [...history].reverse()).baseline_block_id, 'a');
  assert.deepEqual({ current, history }, snapshot);
});

test('un actual inválido no se convierte en línea base al resolver historial', () => {
  const current = pair().current;
  current.first_match_at = null;
  rejects(resolveBaseline(current, [historical('old', '08')]), 'CHRONOLOGY_INVALID');
});

test('la integración no modifica las respuestas de replay ni los perfiles', () => {
  const p = rawPair();
  const snapshot = structuredClone(p);
  compareReplayBlocks(p.current, p.baseline);
  assert.deepEqual(p, snapshot);
});
