// A16 · Metas con historial. La base se simula: las rpc reproducen las reglas de
// a16_guardar_version / a16_borrar_objetivo (una activa por tipo/modalidad, versión siguiente,
// archivar si está enlazada). Las funciones reales se comprueban con scripts/prueba-a16.cjs.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { parseCreate, parseEdit, todayIn } = require('../src/domain/goals');
const { storedDatabase, A, B } = require('./helpers/stored-database.cjs');

const METRICS = { shooting_pct: { codigo: 'shooting_pct', unidad: 'percent', tipo: 'rendimiento' },
  training_minutes: { codigo: 'training_minutes', unidad: 'minutes', tipo: 'entrenamiento' } };

function goalsDatabase() {
  const db = storedDatabase();
  const s = { goals: [], seq: { goal: 0, version: 0 }, linked: new Set(), rpcFail: null, rpcCalls: 0 };
  db.state.goalStore = s;
  const baseFrom = db.from.bind(db);
  db.rpc = async (name, args) => {
    s.rpcCalls += 1;
    if (s.rpcFail) return { data: null, error: { code: s.rpcFail, message: 'private database error' } };
    if (name === 'a16_guardar_version') {
      const m = args.p_meta;
      let goal;
      if (args.p_id_objetivo === null) {
        if (s.goals.some(g => g.id_usuario === args.p_id_usuario && g.modalidad === m.modalidad && g.tipo === m.tipo && g.estado === 'activo')) {
          return { data: null, error: { code: '23505', message: 'private' } };
        }
        goal = { id_objetivo: ++s.seq.goal, id_usuario: args.p_id_usuario, tipo: m.tipo, modalidad: m.modalidad, estado: 'activo', archivado_en: null, objetivo_versiones: [] };
        s.goals.push(goal);
      } else {
        goal = s.goals.find(g => g.id_objetivo === args.p_id_objetivo && g.id_usuario === args.p_id_usuario);
        if (!goal) return { data: null, error: { code: 'P0002', message: 'private' } };
        if (goal.estado === 'archivado') return { data: null, error: { code: 'A1601', message: 'private' } };
      }
      const metric = METRICS[m.metric_key];
      if (!metric || metric.tipo !== goal.tipo) return { data: null, error: { code: 'A1602', message: 'private' } };
      const version = goal.objetivo_versiones.length + 1, at = `2026-11-17T10:0${version}:00Z`;
      goal.objetivo_versiones.push({ id_objetivo_version: ++s.seq.version, version, nombre: m.nombre, comparador: m.comparador,
        valor_meta: (m.valor_meta).toFixed(4), fecha_inicio: m.fecha_inicio, fecha_limite: m.fecha_limite,
        zona_horaria: m.zona_horaria, activada_en: at, creado_en: at, metricas: { codigo: metric.codigo, unidad: metric.unidad } });
      return { data: { id_objetivo: goal.id_objetivo, id_objetivo_version: s.seq.version, version }, error: null };
    }
    if (name === 'a16_borrar_objetivo') {
      const goal = s.goals.find(g => g.id_objetivo === args.p_id_objetivo && g.id_usuario === args.p_id_usuario);
      if (!goal) return { data: null, error: { code: 'P0002', message: 'private' } };
      if (goal.objetivo_versiones.some(v => s.linked.has(v.id_objetivo_version))) {
        if (goal.estado === 'archivado') return { data: 'already_archived', error: null };
        goal.estado = 'archivado'; goal.archivado_en = '2026-11-17T11:00:00Z';
        return { data: 'archived', error: null };
      }
      s.goals.splice(s.goals.indexOf(goal), 1);
      return { data: 'deleted', error: null };
    }
    throw new Error('Unexpected rpc ' + name);
  };
  db.from = table => {
    if (table !== 'objetivos') return baseFrom(table);
    const filters = {}, ins = {};
    let single = false;
    const result = () => {
      if (db.state.fail === 'objetivos') return { data: null, error: { code: 'XX', message: 'private database error' } };
      let rows = s.goals.filter(g => Object.entries(filters).every(([k, v]) => String(g[k]) === String(v)) &&
        Object.entries(ins).every(([k, v]) => v.map(String).includes(String(g[k]))));
      rows = structuredClone(rows);
      return { data: single ? rows[0] ?? null : rows, error: null };
    };
    return { select() { return this; }, eq(k, v) { filters[k] = v; return this; }, in(k, v) { ins[k] = v; return this; },
      maybeSingle() { single = true; return Promise.resolve(result()); },
      then(resolve, reject) { return Promise.resolve().then(result).then(resolve, reject); } };
  };
  return db;
}

let db, server, base;
test.before(async () => {
  db = goalsDatabase(); const app = createApp({ supabase: db });
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => new Promise(resolve => server.close(resolve)));
test.beforeEach(() => {
  const s = db.state.goalStore;
  s.goals.length = 0; s.linked.clear(); s.rpcFail = null; s.seq = { goal: 0, version: 0 };
});

async function call(method, path, { body, token = 'token-a' } = {}) {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: res.status, body: await res.json(), location: res.headers.get('location'), cache: res.headers.get('cache-control') };
}
const shooting = (extra = {}) => ({ type: 'performance', mode: '2v2', name: 'Subir eficiencia', target_value: 35, ...extra });
const training = (extra = {}) => ({ type: 'training', mode: '2v2', name: 'Entrenar más', target_value: 120, ...extra });

test('Validación: valores por defecto, límites por métrica y campos no admitidos', () => {
  const today = '2026-11-17';
  const g = parseCreate(shooting(), { today });
  assert.deepEqual([g.metric_key, g.unit, g.comparator, g.start_date, g.due_date], ['shooting_pct', 'percent', '>=', today, null]);
  const t = parseCreate(training(), { today });
  assert.deepEqual([t.metric_key, t.unit, t.comparator], ['training_minutes', 'minutes', '>=']);
  for (const body of [shooting({ target_value: 0 }), shooting({ target_value: 101 }), shooting({ target_value: '35' }),
    shooting({ target_value: 35.12345 }), shooting({ comparator: '<=' }), shooting({ mode: '4v4' }), shooting({ type: 'other' }),
    shooting({ metric_key: 'training_minutes' }), shooting({ name: ' ' }), shooting({ due_date: '2026-11-01', start_date: '2026-11-10' }),
    shooting({ start_date: '2026-02-30' }), shooting({ user_id: B }), shooting({ status: 'archived' }),
    training({ target_value: 30.5 }), training({ comparator: '>' }), training({ target_value: 0 })]) {
    assert.throws(() => parseCreate(body, { today }), e => e.status === 400, JSON.stringify(body));
  }
  assert.throws(() => parseEdit({ mode: '3v3' }, { ...g, type: 'performance' }), e => e.status === 400);
  assert.equal(parseEdit({ name: 'Subir eficiencia' }, { ...g, type: 'performance' }).changed, false);
  assert.match(todayIn('Zona/Inventada'), /^\d{4}-\d{2}-\d{2}$/);
});

test('Crear y consultar: meta de rendimiento y meta opcional de entrenamiento por modalidad', async () => {
  const r = await call('POST', '/api/v1/goals', { body: shooting({ due_date: '2026-12-31' }) });
  assert.equal(r.status, 201); assert.equal(r.cache, 'no-store'); assert.equal(r.location, `/api/v1/goals/${r.body.data.goal_id}`);
  const g = r.body.data;
  assert.deepEqual([g.type, g.mode, g.status, g.metric_key, g.unit, g.target_value, g.version, g.timezone, g.due_date],
    ['performance', '2v2', 'active', 'shooting_pct', 'percent', 35, 1, 'America/Monterrey', '2026-12-31']);
  assert.deepEqual(g.versions.map(v => v.version), [1]);
  const t = await call('POST', '/api/v1/goals', { body: training() });
  assert.equal(t.status, 201); assert.equal(t.body.data.unit, 'minutes');
  assert.equal((await call('POST', '/api/v1/goals', { body: shooting({ mode: '3v3' }) })).status, 201);
  const list = await call('GET', '/api/v1/goals?mode=2v2');
  assert.deepEqual(list.body.data.map(x => x.type), ['performance', 'training']);
  assert.ok(list.body.data.every(x => !('versions' in x)));
  assert.equal((await call('GET', '/api/v1/goals')).body.data.length, 3);
});

test('Una sola meta activa por tipo y modalidad', async () => {
  await call('POST', '/api/v1/goals', { body: shooting() });
  const dup = await call('POST', '/api/v1/goals', { body: shooting({ name: 'Otra' }) });
  assert.equal(dup.status, 409); assert.equal(dup.body.error.code, 'GOAL_ACTIVE_EXISTS');
  assert.equal((await call('POST', '/api/v1/goals', { token: 'token-b', body: shooting() })).status, 201);
});

test('Editar crea la versión 2 y la versión 1 queda intacta en el historial', async () => {
  const v1 = (await call('POST', '/api/v1/goals', { body: shooting() })).body.data;
  const r = await call('PATCH', `/api/v1/goals/${v1.goal_id}`, { body: { target_value: 40, comparator: '>', due_date: '2026-12-15' } });
  assert.equal(r.status, 200); assert.equal(r.body.meta.version_created, true);
  const v2 = r.body.data;
  assert.equal(v2.version, 2); assert.equal(v2.target_value, 40); assert.notEqual(v2.goal_version_id, v1.goal_version_id);
  assert.deepEqual(v2.versions[0], v1.versions[0]);
  assert.deepEqual(v2.versions.map(v => [v.version, v.target_value, v.comparator]), [[1, 35, '>='], [2, 40, '>']]);
  const same = await call('PATCH', `/api/v1/goals/${v1.goal_id}`, { body: { target_value: 40 } });
  assert.equal(same.body.meta.version_created, false); assert.equal(same.body.data.version, 2);
  for (const body of [{ mode: '3v3' }, { type: 'training' }, { metric_key: 'training_minutes' }, { target_value: 200 }, { goal_id: '9' }]) {
    assert.equal((await call('PATCH', `/api/v1/goals/${v1.goal_id}`, { body })).status, 400, JSON.stringify(body));
  }
  assert.equal(db.state.goalStore.goals[0].objetivo_versiones.length, 2);
});

test('Borrar: sin enlaces se borra; enlazada a un plan se archiva y conserva sus versiones', async () => {
  const free = (await call('POST', '/api/v1/goals', { body: training() })).body.data;
  const d = await call('DELETE', `/api/v1/goals/${free.goal_id}`);
  assert.equal(d.status, 200); assert.equal(d.body.data.effect, 'deleted');
  assert.equal((await call('GET', `/api/v1/goals/${free.goal_id}`)).status, 404);

  const linked = (await call('POST', '/api/v1/goals', { body: shooting() })).body.data;
  await call('PATCH', `/api/v1/goals/${linked.goal_id}`, { body: { target_value: 38 } });
  db.state.goalStore.linked.add(Number(linked.goal_version_id)); // la versión 1 quedó en plan_objetivo
  const a = await call('DELETE', `/api/v1/goals/${linked.goal_id}`);
  assert.equal(a.body.data.effect, 'archived'); assert.match(a.body.data.message, /archivó/);
  const archived = (await call('GET', `/api/v1/goals/${linked.goal_id}`)).body.data;
  assert.equal(archived.status, 'archived'); assert.ok(archived.archived_at); assert.equal(archived.versions.length, 2);
  assert.equal((await call('DELETE', `/api/v1/goals/${linked.goal_id}`)).body.data.effect, 'already_archived');
  const edit = await call('PATCH', `/api/v1/goals/${linked.goal_id}`, { body: { target_value: 50 } });
  assert.equal(edit.status, 409); assert.equal(edit.body.error.code, 'GOAL_ARCHIVED');
  assert.deepEqual((await call('GET', '/api/v1/goals')).body.data, []);
  assert.equal((await call('GET', '/api/v1/goals?status=archived')).body.data.length, 1);
  // Archivada ya no ocupa el lugar de meta activa: se puede crear otra.
  assert.equal((await call('POST', '/api/v1/goals', { body: shooting({ name: 'Nueva meta' }) })).status, 201);
  assert.equal((await call('GET', '/api/v1/goals?status=all')).body.data.length, 2);
});

test('Propiedad: B no ve, edita ni borra metas de A (mismo 404 que inexistente)', async () => {
  const g = (await call('POST', '/api/v1/goals', { body: shooting() })).body.data;
  const missing = await call('GET', '/api/v1/goals/999');
  const foreign = await call('GET', `/api/v1/goals/${g.goal_id}`, { token: 'token-b' });
  assert.equal(foreign.status, 404); assert.deepEqual(foreign.body, missing.body);
  assert.equal((await call('PATCH', `/api/v1/goals/${g.goal_id}`, { token: 'token-b', body: { target_value: 50 } })).status, 404);
  assert.equal((await call('DELETE', `/api/v1/goals/${g.goal_id}`, { token: 'token-b' })).status, 404);
  assert.deepEqual((await call('GET', '/api/v1/goals', { token: 'token-b' })).body.data, []);
  assert.equal(db.state.goalStore.goals[0].objetivo_versiones.length, 1);
  assert.equal((await call('GET', '/api/v1/goals', { token: null })).status, 401);
  assert.equal((await call('GET', '/api/v1/goals', { token: 'token-suspended' })).status, 403);
  for (const path of ['/api/v1/goals/abc', '/api/v1/goals/0']) assert.equal((await call('GET', path)).status, 404);
  assert.equal((await call('GET', '/api/v1/goals?status=borrado')).status, 400);
});

test('Errores de la base sin detalles privados', async () => {
  db.state.goalStore.rpcFail = 'A1602';
  let r = await call('POST', '/api/v1/goals', { body: shooting() });
  assert.equal(r.status, 503); assert.equal(r.body.error.code, 'GOAL_METRIC_NOT_CONFIGURED');
  db.state.goalStore.rpcFail = 'XX';
  r = await call('POST', '/api/v1/goals', { body: shooting() });
  assert.equal(r.status, 503); assert.ok(!JSON.stringify(r.body).includes('private'));
  db.state.goalStore.rpcFail = null;
  db.state.fail = 'objetivos';
  try { r = await call('GET', '/api/v1/goals'); assert.equal(r.status, 503); assert.ok(!JSON.stringify(r.body).includes('private')); }
  finally { db.state.fail = null; }
});

test('Las metas no alteran el diagnóstico: entran en el snapshot del plan y, archivadas, quedan fuera', async () => {
  const before = (await call('POST', '/api/v1/blocks/11/plan-proposal', { body: {} })).body.data;
  const g = (await call('POST', '/api/v1/goals', { body: shooting({ target_value: 60 }) })).body.data;
  const withGoal = (await call('POST', '/api/v1/blocks/11/plan-proposal', { body: { goal_ids: [g.goal_id] } })).body.data;
  assert.equal(withGoal.goals_snapshot[0].goal_version_id, g.goal_version_id); assert.equal(withGoal.goals_snapshot[0].target_value, 60);
  assert.deepEqual(withGoal.diagnosis_snapshot, before.diagnosis_snapshot);
  assert.deepEqual(withGoal.exercises, before.exercises);
  db.state.goalStore.linked.add(Number(g.goal_version_id));
  await call('DELETE', `/api/v1/goals/${g.goal_id}`);
  const archived = (await call('POST', '/api/v1/blocks/11/plan-proposal', { body: { goal_ids: [g.goal_id] } })).body.data;
  assert.deepEqual(archived.goals_snapshot, []);
  assert.deepEqual(archived.goals_excluded, [{ goal_id: g.goal_id, reason: 'GOAL_INACTIVE' }]);
  // Una meta de entrenamiento no se usa como meta de rendimiento del plan.
  const t = (await call('POST', '/api/v1/goals', { body: training() })).body.data;
  assert.equal((await call('POST', '/api/v1/blocks/11/plan-proposal', { body: { goal_ids: [t.goal_id] } })).status, 422);
});
