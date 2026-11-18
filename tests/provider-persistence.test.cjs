'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { defensiveBlock } = require('./helpers/defensive-inputs.cjs');
const { blockRow, A, B } = require('./helpers/stored-database.cjs');
const { findReplayPlayer } = require('../src/services/replay-validation');
const { processReplayBlock } = require('../src/services/ingestion');
const { getBlock, toBlockPayload } = require('../src/repositories/blocks');
const { fromStoredBlock } = require('../src/services/stored-block');
const { analyzeBlock } = require('../src/services/analysis');

// Transporte SQL simulado; ingestión, mapeo, upsert, lectura y motor son reales.
function database(input) {
  const row = blockRow('11', A);
  row.estado = 'pendiente';
  row.replays.forEach((r, i) => {
    r.id_jugador_replay = String(100 + i);
    r.ballchasing_id = input.replays[i].id;
    r.jugadores_replay.id_archivo = String(200 + i);
    r.jugadores_replay.cuenta_jugador = input.profile.player_id;
    r.jugadores_replay.metricas_replay = null;
  });
  const calls = [];
  return { row, calls, from(table) {
    const q = { table, filters: {} }; calls.push(q);
    function result(single) {
      let rows;
      if (table === 'bloques') rows = [row];
      else if (table === 'replays') rows = row.replays.map(r => ({ ...r, id_bloque: row.id_bloque }));
      else if (table === 'archivos_replay') rows = row.replays.map(r => ({
        ...r.jugadores_replay.archivos_replay, id_archivo: r.jugadores_replay.id_archivo,
      }));
      else if (table === 'metricas_replay' && q.upsert) {
        const r = row.replays.find(r => r.id_jugador_replay === q.upsert.id_jugador_replay);
        r.jugadores_replay.metricas_replay = JSON.parse(JSON.stringify(q.upsert));
        return { data: null, error: null };
      } else if (table === 'metricas_bloque' && q.upsert) {
        row.metricas_bloque = JSON.parse(JSON.stringify(q.upsert));
        return { data: null, error: null };
      } else throw new Error('Unexpected table ' + table);
      rows = rows.filter(r => Object.entries(q.filters).every(([k, v]) => r[k] === v));
      if (q.update) for (const selected of rows) {
        if (table === 'bloques') Object.assign(row, q.update);
        else if (table === 'replays') Object.assign(row.replays.find(r => r.posicion === selected.posicion), q.update);
        else Object.assign(row.replays.find(r => r.jugadores_replay.id_archivo === selected.id_archivo)
          .jugadores_replay.archivos_replay, q.update);
      }
      return { data: structuredClone(single ? rows[0] ?? null : rows), error: null };
    }
    return {
      select(columns) { q.columns = columns; return this; },
      eq(k, v) { q.filters[k] = v; return this; },
      is(k, v) { q.filters[k] = v; return this; },
      update(values) { q.update = values; return this; },
      upsert(values) { q.upsert = values; return this; },
      maybeSingle() { return Promise.resolve(result(true)); },
      then(resolve, reject) { return Promise.resolve().then(() => result(false)).then(resolve, reject); },
    };
  } };
}

async function persisted(t, mutate = () => {}) {
  const input = defensiveBlock({ boost: true, shooting: true });
  input.replays.forEach(r => { r.status = 'ok'; r.visibility = 'private'; });
  mutate(input);
  const db = database(input);
  const folder = await mkdtemp(join(tmpdir(), 'arc-persistence-'));
  t.after(() => rm(folder, { force: true, recursive: true }));
  await processReplayBlock({ supabase: db, userId: A, blockId: '11', folder, files: [],
    provider: { getReplay: async id => structuredClone(input.replays.find(r => r.id === id)) },
    wait: async () => {},
  });
  const stored = await getBlock(db, A, '11');
  assert.equal(stored.status, 'ready');
  const data = analyzeBlock({ current: fromStoredBlock(stored, A) }).data;
  return { input, db, stored, data };
}

test('Extracción → persistencia SQL → lectura → análisis conserva reglas y evidencia', async t => {
  const { input, db, stored, data } = await persisted(t);
  const direct = analyzeBlock({ current: input }).data;
  const storedSource = entry => ({ ...entry, evidence: { ...entry.evidence, source: 'stored_replay_metrics' } });
  assert.deepEqual(data.evaluations, direct.evaluations.map(storedSource));
  assert.deepEqual(data.priorities, direct.priorities.map(storedSource));
  assert.deepEqual(data.priorities.map(p => p.priority_key), ['boost', 'defensive_review', 'shooting']);
  assert.equal(data.metrics.values.play_duration_s.value, 1500);
  assert.equal(data.metrics.values.boost_zero_s.value, direct.metrics.values.boost_zero_s.value);
  assert.ok(!data.limitations.includes('original_provider_not_recorded'));
  assert.ok(db.calls.some(q => q.table === 'bloques' && q.columns.includes('mediciones_proveedor')));
  assert.deepEqual(toBlockPayload(stored).replays[0].metricas.mediciones_proveedor,
    db.row.replays[0].jugadores_replay.metricas_replay.mediciones_proveedor);
  assert.equal(await getBlock(db, B, '11'), null);
});

test('Duración fraccional original se conserva y defensa se calcula sin redondear', async t => {
  const { data } = await persisted(t, input => {
    input.replays.forEach(r => { r.play_duration = 300.125; });
  });
  assert.equal(data.metrics.values.play_duration_s.value, 1500.625);
  const observation = data.metrics.defensive_review_per_replay.observations[0];
  assert.equal(observation.duration.value, 300.125);
  assert.equal(observation.rate.value, 600 / 300.125);
  assert.equal(data.evaluations.find(e => e.rule_id === 'cobertura-defensiva-revision').status, 'inactive');
});

test('Porcentaje, duración y positioning ausentes siguen faltando después de guardar', async t => {
  const { data } = await persisted(t, input => {
    const replay = input.replays[0];
    delete replay.play_duration;
    const player = findReplayPlayer(replay, input.profile);
    delete player.stats.boost.percent_zero_boost;
    delete player.stats.positioning;
  });
  assert.equal(data.metrics.boost_zero_per_replay.coverage, 4);
  assert.equal(data.metrics.defensive_review_per_replay.coverage, 4);
  assert.equal(data.evaluations.find(e => e.rule_id === 'boost-disponibilidad').status, 'not_evaluable');
  assert.equal(data.evaluations.find(e => e.rule_id === 'cobertura-defensiva-revision').status, 'not_evaluable');
  assert.deepEqual(data.priorities.map(p => p.priority_key), ['shooting']);
});

test('Ceros originales se conservan; duración cero excluye defensa sin fabricar reloj', async t => {
  const { data } = await persisted(t, input => {
    for (const r of input.replays) {
      r.play_duration = 0;
      const p = findReplayPlayer(r, input.profile);
      p.stats.boost = { time_zero_boost: 0, percent_zero_boost: 0 };
      p.stats.positioning.goals_against_while_last_defender = 0;
    }
  });
  assert.equal(data.metrics.boost_zero_per_replay.coverage, 5);
  assert.equal(data.evaluations.find(e => e.rule_id === 'boost-disponibilidad').status, 'inactive');
  const observation = data.metrics.defensive_review_per_replay.observations[0];
  assert.equal(observation.goals.value, 0);
  assert.equal(observation.rate.missing_reason, 'zero_duration');
});

test('Análisis almacenado rechaza otra versión, proveedor, replay o unidades', async t => {
  const { stored } = await persisted(t);
  for (const change of [p => { p.version = 'unknown'; }, p => { p.source = 'unknown'; },
    p => { p.replay_id = 'OTHER'; }, p => { p.values = []; },
    p => { p.values.boost_zero_pct.unit = 'seconds'; }]) {
    const block = structuredClone(stored);
    change(block.replays[0].metrics.provider_measurements);
    const data = analyzeBlock({ current: fromStoredBlock(block, A) }).data;
    assert.equal(data.evaluations.find(e => e.rule_id === 'boost-disponibilidad').status, 'not_evaluable');
  }
});

test('Objetos completos de boost y positioning ausentes conservan el motivo del proveedor', async t => {
  const { input, data } = await persisted(t, input => {
    const player = findReplayPlayer(input.replays[0], input.profile);
    delete player.stats.boost;
    delete player.stats.positioning;
  });
  const direct = analyzeBlock({ current: input }).data;
  assert.deepEqual(data.metrics.boost_zero_per_replay, direct.metrics.boost_zero_per_replay);
  assert.deepEqual(data.metrics.defensive_review_per_replay, direct.metrics.defensive_review_per_replay);
});
