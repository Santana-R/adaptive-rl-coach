// A24 · Versiones del plan. La base se simula: rpc('a24_guardar_plan') reproduce las reglas
// de la función SQL (bloque propio, análisis una vez por bloque, versión siguiente, metas propias).
// La función real se comprueba contra Supabase dev con scripts/prueba-a24.cjs.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { toSaveArgs, STATUS } = require('../src/repositories/plans');
const { toStoredAnalysis } = require('../src/repositories/analysis');
const { storedDatabase, A, B } = require('./helpers/stored-database.cjs');

function plansDatabase() {
  const db = storedDatabase();
  const saved = { analyses: [], plans: [], seq: { analisis: 0, plan: 0, pe: 0 }, rpcFail: null, rpcCalls: 0 };
  const baseFrom = db.from.bind(db);
  db.state.saved = saved;
  db.rpc = async (name, args) => {
    saved.rpcCalls += 1;
    if (name !== 'a24_guardar_plan') throw new Error('Unexpected rpc ' + name);
    if (saved.rpcFail) return { data: null, error: { code: saved.rpcFail, message: 'private database error' } };
    const block = db.state.rows.find(r => r.id_bloque === String(args.p_id_bloque) && r.id_usuario === args.p_id_usuario);
    if (!block) return { data: null, error: { code: 'P0002', message: 'private' } };
    const key = list => JSON.stringify(list.map(p => [p.rule_id, p.orden, Math.round(p.valor_actual * 1e4) / 1e4]));
    let analysis = saved.analyses.find(a => a.id_bloque === block.id_bloque), created = false;
    if (!analysis) {
      analysis = { id_analisis: ++saved.seq.analisis, id_bloque: block.id_bloque, rules_version: args.p_analisis.rules_version,
        explicacion: args.p_analisis.explicacion, prioridades: structuredClone(args.p_analisis.prioridades) };
      saved.analyses.push(analysis); created = true;
    } else if (analysis.rules_version !== args.p_analisis.rules_version || key(analysis.prioridades) !== key(args.p_analisis.prioridades)) {
      return { data: null, error: { code: 'A2402', message: 'private' } };
    }
    const plan = args.p_plan;
    if (plan.ejercicios.some(e => !analysis.prioridades.some(p => p.rule_id === e.rule_id))) {
      return { data: null, error: { code: '23503', message: 'private' } };
    }
    const version = Math.max(0, ...saved.plans.filter(p => p.id_analisis === analysis.id_analisis).map(p => p.version)) + 1;
    const row = { id_plan: ++saved.seq.plan, id_analisis: analysis.id_analisis, version, estado: plan.estado,
      minutos_disponibles: plan.minutos_disponibles, dias_disponibles: plan.dias_disponibles, sesiones_semana: plan.sesiones_semana,
      justificacion: plan.justificacion, contexto: structuredClone(plan.contexto), creado_en: `2026-11-16T20:0${version}:00Z`,
      plan_ejercicio: plan.ejercicios.map(e => ({ id_plan_ejercicio: ++saved.seq.pe, orden: e.orden, minutos: e.minutos,
        dificultad: e.dificultad, id_ejercicio_version: e.id_ejercicio_version })),
      plan_objetivo: plan.objetivos.map(id => ({ id_objetivo_version: id })) };
    saved.plans.push(row);
    return { data: { id_analisis: analysis.id_analisis, id_plan: row.id_plan, version, analisis_creado: created,
      ejercicios: row.plan_ejercicio.map(pe => ({ orden: pe.orden, id_plan_ejercicio: pe.id_plan_ejercicio })) }, error: null };
  };
  db.from = table => {
    if (table !== 'analisis') return baseFrom(table);
    const filters = {};
    const result = () => {
      if (db.state.fail === 'analisis') return { data: null, error: { code: 'XX', message: 'private database error' } };
      const a = saved.analyses.find(x => String(x.id_analisis) === String(filters.id_analisis));
      const owner = a && db.state.rows.find(r => r.id_bloque === a.id_bloque)?.id_usuario;
      if (!a || owner !== filters['bloques.id_usuario']) return { data: null, error: null };
      return { data: structuredClone({ id_analisis: a.id_analisis, id_bloque: Number(a.id_bloque), bloques: { id_usuario: owner },
        planes: saved.plans.filter(p => p.id_analisis === a.id_analisis) }), error: null };
    };
    return { select() { return this; }, eq(k, v) { filters[k] = v; return this; }, maybeSingle: async () => result() };
  };
  return db;
}

let db, server, base;
test.before(async () => {
  db = plansDatabase(); const app = createApp({ supabase: db });
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => new Promise(resolve => server.close(resolve)));
test.beforeEach(() => {
  const s = db.state.saved;
  s.analyses.length = 0; s.plans.length = 0; s.rpcFail = null; s.seq = { analisis: 0, plan: 0, pe: 0 }; db.state.goals = [];
});

async function call(method, path, { body, token = 'token-a' } = {}) {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: res.status, body: await res.json(), location: res.headers.get('location'), cache: res.headers.get('cache-control') };
}

test('Mapeo: análisis/prioridades con evidencia completa y plan con orden, minutos, dificultad y versiones', async () => {
  const proposal = (await call('POST', '/api/v1/blocks/11/plan-proposal', { body: { availability_minutes: 20, workshop_access: true, rank: 'diamond' } })).body.data;
  const analysis = { rules_version: proposal.rules_version, priorities: proposal.diagnosis_snapshot.priorities,
    evaluations: [{ explanation: 'Explicación de prueba.' }] };
  const args = toSaveArgs({ userId: A, blockId: '11', proposal, analysis, profile: { days_per_week: 3 } });
  assert.equal(args.p_id_bloque, 11); assert.equal(args.p_id_usuario, A);
  const [priority] = args.p_analisis.prioridades;
  assert.equal(priority.rule_id, 'finalizacion-eficiencia'); assert.equal(priority.orden, 1); assert.equal(priority.valor_actual, 30);
  const evidence = JSON.parse(priority.evidencia);
  assert.equal(evidence.evidence.min_shots, 15); assert.equal(evidence.evidence.replay_ids.length, 5); assert.equal(evidence.evidence.context.mode, '2v2');
  assert.equal(args.p_plan.estado, 'completo'); assert.equal(args.p_plan.minutos_disponibles, 20);
  assert.equal(args.p_plan.dias_disponibles, 3); assert.equal(args.p_plan.sesiones_semana, 3);
  assert.deepEqual(args.p_plan.ejercicios.map(e => [e.orden, e.minutos, e.dificultad]), proposal.exercises.map(e => [e.order, e.assigned_minutes, e.difficulty]));
  assert.ok(args.p_plan.ejercicios.every(e => Number.isInteger(e.id_ejercicio_version)));
  assert.equal(args.p_plan.contexto.profile_snapshot.rank, 'diamond'); assert.equal(args.p_plan.contexto.profile_snapshot.workshop_access, true);
  for (const k of ['plan_id', 'plan_version_id', 'version']) assert.ok(!(k in args.p_plan.contexto));
  assert.ok(!args.p_plan.contexto.limitations.includes('unpersisted_proposal'));
  assert.deepEqual(STATUS, { complete: 'completo', partial: 'parcial', empty: 'no_disponible' });
});

test('Mapeo de boost usa las partidas que alcanzan el umbral como valor actual', () => {
  const stored = toStoredAnalysis({ rules_version: 'mvp.rules.v2', evaluations: [], priorities: [{ rule_id: 'boost-disponibilidad', order: 1,
    priority_key: 'boost', evidence: { metric_key: 'boost_zero_pct', matched_replays: 4, threshold: 15 } }] });
  assert.equal(stored.prioridades[0].valor_actual, 4); assert.ok(stored.explicacion.length > 0);
});

test('No guarda lo que el esquema no admite: 0 minutos o rutinas sin versión de catálogo', async () => {
  const proposal = (await call('POST', '/api/v1/blocks/11/plan-proposal', { body: {} })).body.data;
  const args = { userId: A, blockId: '11', analysis: { priorities: [] }, profile: { days_per_week: 3 } };
  assert.throws(() => toSaveArgs({ ...args, proposal: { ...proposal, availability_minutes: 0 } }), e => e.code === 'PLAN_NOT_PERSISTABLE');
  const native = structuredClone(proposal); native.exercises[0].exercise_version_id = null;
  assert.throws(() => toSaveArgs({ ...args, proposal: native }), e => e.code === 'PLAN_NOT_PERSISTABLE');
  const zero = await call('POST', '/api/v1/blocks/11/plans', { body: { availability_minutes: 0 } });
  assert.equal(zero.status, 422); assert.equal(zero.body.error.code, 'PLAN_NOT_PERSISTABLE');
  assert.equal(db.state.saved.plans.length, 0);
});

test('POST /blocks/:id/plans guarda la versión 1 y responde lo guardado con IDs reales', async () => {
  const proposal = (await call('POST', '/api/v1/blocks/11/plan-proposal', { body: { availability_minutes: 20 } })).body.data;
  const r = await call('POST', '/api/v1/blocks/11/plans', { body: { availability_minutes: 20 } });
  assert.equal(r.status, 201); assert.equal(r.cache, 'no-store');
  assert.equal(r.body.meta.persisted, true); assert.equal(r.body.meta.analysis_created, true);
  const p = r.body.data;
  assert.equal(p.version, 1); assert.equal(p.plan_id, '1'); assert.equal(p.plan_version_id, '1'); assert.equal(p.block_id, '11');
  assert.equal(p.status, 'completo'); assert.equal(r.location, '/api/v1/plans/1/versions/1');
  assert.ok(p.exercises.every(e => /^\d+$/.test(e.plan_exercise_id)));
  assert.deepEqual(p.exercises.map(e => e.exercise_snapshot), proposal.exercises.map(e => e.exercise_snapshot));
  assert.deepEqual(p.diagnosis_snapshot, proposal.diagnosis_snapshot);
  assert.ok(!p.limitations.includes('unpersisted_proposal'));
});

test('Cambiar contexto crea la versión 2 y la versión 1 se recupera intacta', async () => {
  const v1 = (await call('POST', '/api/v1/blocks/11/plans', { body: { availability_minutes: 20 } })).body.data;
  const r2 = await call('POST', `/api/v1/plans/${v1.plan_id}/versions`, { body: { availability_minutes: 40, workshop_access: true, rank: 'champion' } });
  assert.equal(r2.status, 201); assert.equal(r2.body.meta.analysis_created, false);
  const v2 = r2.body.data;
  assert.equal(v2.version, 2); assert.equal(v2.plan_id, v1.plan_id); assert.notEqual(v2.plan_version_id, v1.plan_version_id);
  assert.equal(v2.assigned_minutes, 40); assert.equal(v2.profile_snapshot.rank, 'champion');
  const again = await call('GET', `/api/v1/plans/${v1.plan_id}/versions/1`);
  assert.equal(again.status, 200); assert.deepEqual(again.body.data, v1);
  const latest = await call('GET', `/api/v1/plans/${v1.plan_id}`);
  assert.deepEqual(latest.body.data, v2);
  const list = await call('GET', `/api/v1/plans/${v1.plan_id}/versions`);
  assert.deepEqual(list.body.data.map(v => [v.version, v.assigned_minutes, v.status]), [[1, 20, 'completo'], [2, 40, 'completo']]);
  // Con la misma petición sobre el bloque también se crea la versión siguiente, sin reescribir.
  const r3 = await call('POST', '/api/v1/blocks/11/plans', { body: { availability_minutes: 20 } });
  assert.equal(r3.body.data.version, 3); assert.deepEqual((await call('GET', `/api/v1/plans/${v1.plan_id}/versions/1`)).body.data, v1);
});

test('Otro bloque tiene su propio plan_id (otro análisis)', async () => {
  const a = (await call('POST', '/api/v1/blocks/11/plans', { body: {} })).body.data;
  const b = await call('POST', '/api/v1/blocks/10/plans', { body: {} });
  assert.equal(b.status, 201); assert.notEqual(b.body.data.plan_id, a.plan_id); assert.equal(b.body.data.version, 1);
  assert.equal(b.body.data.block_id, '10');
});

test('Propiedad: usuario B no lee ni versiona el plan de A (mismo 404 que inexistente)', async () => {
  const v1 = (await call('POST', '/api/v1/blocks/11/plans', { body: {} })).body.data;
  const missing = await call('GET', '/api/v1/plans/999');
  for (const path of [`/api/v1/plans/${v1.plan_id}`, `/api/v1/plans/${v1.plan_id}/versions`, `/api/v1/plans/${v1.plan_id}/versions/1`]) {
    const r = await call('GET', path, { token: 'token-b' }); assert.equal(r.status, 404); assert.deepEqual(r.body, missing.body);
  }
  assert.equal((await call('POST', `/api/v1/plans/${v1.plan_id}/versions`, { token: 'token-b', body: {} })).status, 404);
  assert.equal((await call('POST', '/api/v1/blocks/11/plans', { token: 'token-b', body: {} })).status, 404);
  assert.equal((await call('GET', `/api/v1/plans/${v1.plan_id}`, { token: null })).status, 401);
  assert.equal((await call('GET', `/api/v1/plans/${v1.plan_id}`, { token: 'token-suspended' })).status, 403);
  for (const path of ['/api/v1/plans/abc', `/api/v1/plans/${v1.plan_id}/versions/0`, `/api/v1/plans/${v1.plan_id}/versions/x`, `/api/v1/plans/${v1.plan_id}/versions/9`]) {
    assert.equal((await call('GET', path)).status, 404, path);
  }
  assert.equal(db.state.saved.plans.length, 1);
});

test('Metas usadas quedan vinculadas por versión exacta (plan_objetivo)', async () => {
  db.state.goals = [{ id_objetivo: '1', id_usuario: A, modalidad: '2v2', estado: 'activo', archivado_en: null,
    objetivo_versiones: [{ id_objetivo_version: '12', version: 2, comparador: '>=', valor_meta: '40.0000',
      activada_en: '2026-11-16T12:00:00Z', metricas: { codigo: 'shooting_pct', unidad: 'percent' } }] }];
  const r = await call('POST', '/api/v1/blocks/11/plans', { body: { goal_ids: ['1'] } });
  assert.equal(r.status, 201); assert.deepEqual(r.body.data.goal_version_ids, ['12']);
  assert.equal(r.body.data.goals_snapshot[0].target_value, 40);
  assert.deepEqual(db.state.saved.plans[0].plan_objetivo, [{ id_objetivo_version: 12 }]);
});

test('Errores de la base: reglas sin cargar, análisis distinto y fallo de lectura sin detalles privados', async () => {
  db.state.saved.rpcFail = 'A2401';
  let r = await call('POST', '/api/v1/blocks/11/plans', { body: {} });
  assert.equal(r.status, 503); assert.equal(r.body.error.code, 'RULES_NOT_CONFIGURED');
  db.state.saved.rpcFail = 'A2402';
  r = await call('POST', '/api/v1/blocks/11/plans', { body: {} });
  assert.equal(r.status, 409); assert.equal(r.body.error.code, 'ANALYSIS_CONFLICT');
  db.state.saved.rpcFail = 'XX';
  r = await call('POST', '/api/v1/blocks/11/plans', { body: {} });
  assert.equal(r.status, 503); assert.ok(!JSON.stringify(r.body).includes('private'));
  db.state.saved.rpcFail = null;
  db.state.fail = 'analisis';
  try { r = await call('GET', '/api/v1/plans/1'); assert.equal(r.status, 503); assert.ok(!JSON.stringify(r.body).includes('private')); }
  finally { db.state.fail = null; }
});

test('Si el análisis guardado del bloque cambió, no se mezcla con otro', async () => {
  await call('POST', '/api/v1/blocks/11/plans', { body: {} });
  db.state.saved.analyses[0].prioridades[0].valor_actual = 25;
  const r = await call('POST', '/api/v1/blocks/11/plans', { body: {} });
  assert.equal(r.status, 409); assert.equal(db.state.saved.plans.length, 1);
});

test('Entrada inválida se rechaza antes de llamar a la base', async () => {
  const before = db.state.saved.rpcCalls;
  for (const body of [{ version: 2 }, { plan_id: '1' }, { availability_minutes: -1 }, { user_id: B }]) {
    assert.equal((await call('POST', '/api/v1/blocks/11/plans', { body })).status, 400);
  }
  assert.equal(db.state.saved.rpcCalls, before);
});
