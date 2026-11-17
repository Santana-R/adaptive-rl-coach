'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createClient } = require('@supabase/supabase-js');
const { startAnalysisServer, fakeAuth, A, B } = require('./helpers/analysis-server.cjs');
const { input: blocks } = require('./fixtures/analisis/comparable.json');
const { calculateBlockMetrics } = require('../src/domain/metrics');
const { parseReportPeriod } = require('../src/services/reports');

const PERIOD = '?from=2026-10-08&to=2026-10-10';
const LARGE_ID = '9223372036854775807';

function session(session_id, plan_version_id, performed_at, duration_minutes) {
  return { session_id, plan_version_id, performed_at, duration_minutes };
}

function plan(plan_version_id, id_usuario, modalidad) {
  return { plan_version_id, analisis: { bloques: { id_usuario, modalidad } } };
}

function goalVersion(id, version, activated, metric, unit, target, comparator = '>=') {
  return {
    id_objetivo_version: id, version, nombre: 'Meta de prueba', comparador: comparator,
    valor_meta: target, fecha_inicio: '2026-10-08', fecha_limite: null,
    zona_horaria: 'America/Monterrey', activada_en: activated, creado_en: activated,
    metricas: { codigo: metric, unidad: unit }
  };
}

function goal(id_objetivo, tipo, modalidad, versions) {
  return {
    id_objetivo, tipo, modalidad, estado: 'activo',
    archivado_en: null, objetivo_versiones: versions
  };
}

function fixtureSupabase() {
  const calls = [];
  const rank = {
    id_rango: 1, modalidad: '2v2', temporada: 'prueba', rango: 'diamond',
    division: 1, fecha_registro: '2026-10-10T12:00:00Z', fuente: 'self_reported'
  };
  const fixtures = {
    a21_consultar_sesiones: [
      session('1', LARGE_ID, '2026-10-08T06:00:00Z', 10),
      session('2', '12', '2026-10-10T19:00:00Z', 15),
      session('3', '13', '2026-10-10T20:00:00Z', 6),
      session('4', '14', '2026-10-11T06:00:00Z', 80),
      session('5', '12', '2026-10-10T21:00:00Z', null)
    ],
    planes: [plan(LARGE_ID, A, '2v2'), plan('12', A, '2v2'), plan('13', B, '1v1')],
    objetivos: [
      goal(1, 'entrenamiento', '2v2', [
        goalVersion(2, 2, '2026-10-10T06:00:00Z', 'training_minutes', 'minutes', 20),
        goalVersion(1, 1, '2026-10-08T06:00:00Z', 'training_minutes', 'minutes', 10)
      ]),
      goal(2, 'rendimiento', '2v2', [
        goalVersion(3, 1, '2026-10-08T06:00:00Z', 'shooting_pct', 'percent', 30, '>')
      ]),
      goal(3, 'entrenamiento', '1v1', [
        goalVersion(4, 1, '2026-10-08T06:00:00Z', 'training_minutes', 'minutes', 5)
      ])
    ],
    rangos: [rank, { ...rank, id_rango: 2, fuente: 'mmr' }]
  };

  const supabase = createClient('http://fixture.invalid', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async (input, options) => {
      const url = new URL(input);
      const table = url.pathname.split('/').at(-1);
      calls.push({ table, params: url.searchParams, body: options.body });

      const data = table === 'usuarios'
        ? {
            id_usuario: A,
            rol: 'jugador',
            estado: url.searchParams.get('id_usuario') === 'eq.' + A ? 'activo' : 'suspendido'
          }
        : fixtures[table];

      assert.ok(data, 'Consulta inesperada a ' + table);
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    } }
  });

  supabase.auth.getUser = fakeAuth().auth.getUser;
  return { supabase, calls };
}

function normalizedBlock(row, owner_id = A) {
  const metrics = calculateBlockMetrics({
    source: 'stored_replay_metrics',
    context: row.context,
    replays: row.replay_ids.map((replay_id, i) => ({
      replay_id,
      values: {
        goals: { value: i === 0 ? row.goals : 0, unit: 'count' },
        shots: { value: i === 0 ? row.shots : 0, unit: 'count' }
      }
    }))
  });
  const { block_id, first_match_at, last_match_at } = row;

  return {
    owner_id, block_id, status: 'ready',
    metrics_block: { ...metrics, block_id, status: 'ready', first_match_at, last_match_at }
  };
}

test('A22 convierte el período inclusivo de Monterrey a UTC', () => {
  const p = parseReportPeriod({ from: '2022-04-03', to: '2022-04-03' });
  assert.equal(new Date(p.startMs).toISOString(), '2022-04-03T06:00:00.000Z');
  assert.equal(new Date(p.endExclusiveMs).toISOString(), '2022-04-04T05:00:00.000Z');
});

test('A22 valida la sesión, el período y las cuatro series del usuario', async (t) => {
  const { supabase, calls } = fixtureSupabase();
  const repository = { async listBlocksForUser(userId) {
    assert.equal(userId, A);
    return [
      normalizedBlock(blocks.current),
      normalizedBlock(blocks.baseline),
      normalizedBlock({ ...blocks.current, block_id: 'ajeno' }, B),
      normalizedBlock({ ...blocks.current, block_id: 'sin-tiros', shots: 0, goals: 0 })
    ];
  } };
  const server = await startAnalysisServer({ demo: false, auth: supabase, repository });
  t.after(server.close);

  const path = server.base + '/api/v1/reports';
  const headers = { Authorization: 'Bearer token-a' };

  const anonymous = await fetch(path + PERIOD);
  assert.equal(anonymous.status, 401);
  assert.equal(anonymous.headers.get('Cache-Control'), 'no-store');

  const suspended = await fetch(path + PERIOD, { headers: { Authorization: 'Bearer token-suspended' } });
  assert.equal(suspended.status, 403);

  const invalid = await fetch(path + '?from=2026-02-30&to=2026-10-10', { headers });
  assert.equal(invalid.status, 400);
  assert.deepEqual(calls.map(call => call.table), ['usuarios', 'usuarios']);

  const response = await fetch(path + PERIOD + '&user_id=' + B, { headers });
  assert.equal(response.status, 200);

  const { data, meta } = await response.json();
  assert.equal(meta.contract_version, '1.0');
  assert.equal(data.performance.sample_size, 10);
  assert.equal(data.performance.denominator.value, 18);
  assert.equal(data.performance.points[1].comparison.delta_pp, 5);
  assert.deepEqual(data.performance.excluded, [{ block_id: 'sin-tiros', reason: 'zero_denominator' }]);
  assert.equal(data.training.total_minutes, 31);
  assert.deepEqual(data.training.points.map(p => [p.session_id, p.mode]), [
    ['1', '2v2'], ['2', '2v2'], ['3', null]
  ]);
  assert.deepEqual(data.training.excluded, [{ session_id: '5', reason: 'missing_duration' }]);
  assert.equal(data.rank.points[0].rank_label, 'diamond');
  assert.equal(data.rank.sample_size, 1);
  assert.equal(data.goals.sample_size, 3);
  assert.deepEqual(data.goals.points.map(p => [p.version, p.actual_value, p.status]), [
    [1, 10, 'met'],
    [2, 15, 'not_met'],
    [1, 30, 'not_met'],
    [1, null, 'insufficient_data']
  ]);

  const sessions = calls.find(call => call.table === 'a21_consultar_sesiones');
  assert.deepEqual(JSON.parse(sessions.body), { p_id_usuario: A, p_id_sesion: null });

  const planQuery = calls.find(call => call.table === 'planes').params;
  assert.equal(planQuery.get('analisis.bloques.id_usuario'), 'eq.' + A);
  assert.equal(planQuery.get('id_plan'), 'in.(' + LARGE_ID + ',12,13)');

  for (const table of ['objetivos', 'rangos']) {
    assert.equal(calls.find(call => call.table === table).params.get('id_usuario'), 'eq.' + A);
  }
});