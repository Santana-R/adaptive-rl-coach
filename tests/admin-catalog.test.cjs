// A32 · CRUD administrativo del catálogo, resumen del panel y ampliación de usuarios admin.
// La base se simula: las rpc reproducen a32_guardar_ejercicio / a32_borrar_ejercicio. Las funciones
// reales se comprueban con scripts/prueba-a32.cjs.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { parseCreate, parseEdit } = require('../src/domain/exercise-admin');
const { storedDatabase, catalogRows, A } = require('./helpers/stored-database.cjs');

const ADMIN_EMAIL = 'admin@example.test';

function adminDatabase() {
  const db = storedDatabase();
  const s = { exercises: catalogRows(), used: new Set(), seq: { exercise: 3, version: 200 }, rpcCalls: 0, listUsers: true };
  db.state.adminStore = s;
  const baseFrom = db.from.bind(db);
  const users = [
    { id_usuario: 'admin', nombre: 'Admin de prueba', rol: 'administrador', estado: 'activo' },
    { id_usuario: A, nombre: 'Jugador A', rol: 'jugador', estado: 'activo' },
    { id_usuario: 'suspended', nombre: 'Jugador suspendido', rol: 'jugador', estado: 'suspendido' },
  ];
  db.auth.admin = { listUsers: async () => s.listUsers
    ? { data: { users: [{ id: 'admin', email: ADMIN_EMAIL, last_sign_in_at: '2026-11-17T09:00:00Z' }, { id: A, email: 'a@example.test', last_sign_in_at: null }] }, error: null }
    : { data: null, error: { message: 'private' } } };
  db.rpc = async (name, args) => {
    s.rpcCalls += 1;
    const live = id => s.exercises.find(e => String(e.id_ejercicio) === String(id) && e.eliminado_en == null);
    if (name === 'a32_guardar_ejercicio') {
      let row = args.p_id_ejercicio === null ? null : live(args.p_id_ejercicio);
      if (args.p_id_ejercicio !== null && !row) return { data: null, error: { code: 'P0002', message: 'private' } };
      if (!row) { row = { id_ejercicio: String(++s.seq.exercise), activo: false, eliminado_en: null, ejercicio_versiones: [] }; s.exercises.push(row); }
      row.activo = false;
      const f = args.p_ficha, version = Math.max(0, ...row.ejercicio_versiones.map(v => v.version)) + 1;
      row.ejercicio_versiones.push({ id_ejercicio_version: String(++s.seq.version), version, nombre: f.nombre, categoria: f.categoria,
        tipo_recurso: f.tipo_recurso, codigo_enlace: f.codigo_enlace, finalidad: f.finalidad, instrucciones: f.instrucciones,
        meta: f.meta, dificultad_base: f.dificultad_base, minutos_base: f.minutos_base, creado_en: `2026-11-17T1${version}:00:00Z`,
        ejercicio_plataforma: f.plataformas.map(plataforma => ({ plataforma })) });
      return { data: { id_ejercicio: row.id_ejercicio, version }, error: null };
    }
    if (name === 'a32_borrar_ejercicio') {
      const row = live(args.p_id_ejercicio);
      if (!row) return { data: null, error: { code: 'P0002', message: 'private' } };
      if (s.used.has(String(row.id_ejercicio))) {
        if (!row.activo) return { data: 'already_inactive', error: null };
        row.activo = false; return { data: 'deactivated', error: null };
      }
      row.activo = false; row.eliminado_en = '2026-11-17T12:00:00Z';
      return { data: 'deleted', error: null };
    }
    throw new Error('Unexpected rpc ' + name);
  };
  db.from = table => {
    const filters = {};
    let single = false, head = false, patch = null;
    const builder = {
      select(_cols, opts) { head = opts?.head === true; return builder; },
      eq(k, v) { filters[k] = v; return builder; }, is(k, v) { filters[k] = v; return builder; },
      order() { return builder; }, update(values) { patch = values; return builder; },
      maybeSingle() { single = true; return Promise.resolve(result()); },
      then(resolve, reject) { return Promise.resolve().then(result).then(resolve, reject); },
    };
    function result() {
      if (db.state.fail === table) return { data: null, error: { code: 'XX', message: 'private database error' } };
      if (table === 'usuarios') {
        if (single) return baseResult();
        return { data: structuredClone(users), error: null };
      }
      if (table === 'ejercicios') {
        let rows = s.exercises.filter(e => (!('eliminado_en' in filters) || e.eliminado_en == null) &&
          (filters.activo === undefined || e.activo === filters.activo) &&
          (filters.id_ejercicio === undefined || String(e.id_ejercicio) === String(filters.id_ejercicio)));
        if (patch) { rows.forEach(r => Object.assign(r, patch)); return { data: null, error: null }; }
        rows = structuredClone(rows);
        return { data: single ? rows[0] ?? null : rows, error: null };
      }
      if (head) {
        const counts = { bloques: { requiere_correccion: 2, espera_servicio: 1, procesando: 0, completo: 5 }, planes: 4, objetivos: 3 };
        const n = table === 'bloques' ? counts.bloques[filters.estado] ?? 0 : counts[table] ?? 0;
        return { count: n, data: null, error: null };
      }
      return baseResult();
    }
    function baseResult() {
      const q = baseFrom(table); Object.entries(filters).forEach(([k, v]) => q.eq(k, v));
      return single ? q.maybeSingle() : q;
    }
    return builder;
  };
  return db;
}

let db, server, base;
test.before(async () => {
  db = adminDatabase(); const app = createApp({ supabase: db });
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => new Promise(resolve => server.close(resolve)));
test.beforeEach(() => {
  const s = db.state.adminStore;
  s.exercises = catalogRows(); s.used.clear(); s.seq = { exercise: 3, version: 200 }; s.listUsers = true;
});

async function call(method, path, { body, token = 'token-admin' } = {}) {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: res.status, body: await res.json(), location: res.headers.get('location'), cache: res.headers.get('cache-control') };
}
const ficha = (extra = {}) => ({ title: 'Recuperaciones', priority_key: 'movement', resource_type: 'custom_training',
  resource: 'ABCD-1234-ABCD-1234', purpose: 'Practicar aterrizajes.', instructions: ['Abrir el paquete.', 'Repetir cada tiro.'],
  success_criterion: 'Aterrizar sobre las cuatro ruedas.', difficulty_base: 2, reference_duration_minutes: 10, platforms: ['steam', 'epic'], ...extra });
const playerCatalogIds = async () => (await call('GET', '/api/v1/exercises', { token: 'token-a' })).body.data.exercises.map(e => e.exercise_id);

test('Validación de la ficha: recursos, límites, plataformas y campos no admitidos', () => {
  const f = parseCreate(ficha({ title: '  Recuperaciones  ', instructions: [' Paso 1 ', '', 'Paso 2'] }));
  assert.equal(f.title, 'Recuperaciones'); assert.deepEqual(f.instructions, ['Paso 1', 'Paso 2']); assert.deepEqual(f.platforms, ['epic', 'steam']);
  for (const body of [ficha({ resource: 'abcd-1234' }), ficha({ resource_type: 'external_guide', resource: 'http://x.test' }),
    ficha({ resource_type: 'steam_workshop', resource: 'https://steamcommunity.com/x', platforms: ['epic', 'steam'] }),
    ficha({ difficulty_base: 6 }), ficha({ reference_duration_minutes: 3 }), ficha({ platforms: [] }), ficha({ platforms: ['xbox'] }),
    ficha({ instructions: [] }), ficha({ title: '' }), ficha({ priority_key: 'otro' }), ficha({ active: true }), ficha({ id: '9' })]) {
    assert.throws(() => parseCreate(body), e => e.status === 400, JSON.stringify(body));
  }
  assert.deepEqual(parseEdit({ active: false }, f), { kind: 'active', active: false });
  assert.throws(() => parseEdit({ active: true, title: 'x' }, f), e => e.status === 400);
  assert.equal(parseEdit({ title: 'Recuperaciones' }, f).changed, false);
});

test('El jugador no administra aunque llame a los endpoints directamente', async () => {
  for (const [method, path, body] of [['POST', '/api/v1/exercises', ficha()], ['PATCH', '/api/v1/exercises/1', { active: false }],
    ['DELETE', '/api/v1/exercises/1'], ['GET', '/api/v1/exercises/1'], ['GET', '/api/v1/admin/summary'],
    ['GET', '/api/v1/admin/users'], ['GET', '/api/v1/exercises?include_inactive=true']]) {
    const r = await call(method, path, { token: 'token-a', body });
    assert.equal(r.status, 403, `${method} ${path}`);
  }
  assert.equal((await call('POST', '/api/v1/exercises', { token: null, body: ficha() })).status, 401);
  assert.equal(db.state.adminStore.rpcCalls, 0);
  assert.equal(db.state.adminStore.exercises.length, 3);
});

test('Alta: queda como borrador inactivo y no se puede activar sin revisión', async () => {
  const r = await call('POST', '/api/v1/exercises', { body: ficha() });
  assert.equal(r.status, 201); assert.equal(r.cache, 'no-store'); assert.equal(r.location, `/api/v1/exercises/${r.body.data.exercise_id}`);
  const e = r.body.data;
  assert.equal(e.version, 1); assert.equal(e.active, false); assert.equal(e.technical_review_status, 'not_in_reviewed_content');
  assert.deepEqual(e.ficha, parseCreate(ficha()));
  const activate = await call('PATCH', `/api/v1/exercises/${e.exercise_id}`, { body: { active: true } });
  assert.equal(activate.status, 409); assert.equal(activate.body.error.code, 'EXERCISE_NOT_VERIFIED');
  assert.ok(!(await playerCatalogIds()).includes(e.exercise_id));
  const admin = (await call('GET', '/api/v1/exercises?include_inactive=true')).body.data.exercises;
  assert.ok(admin.some(x => x.exercise_id === e.exercise_id && x.active === false));
});

test('Editar crea otra versión, deja el ejercicio en borrador y la versión anterior queda intacta', async () => {
  const before = (await call('GET', '/api/v1/exercises/1')).body.data;
  assert.equal(before.active, true); assert.equal(before.technical_review_status, 'verified'); assert.equal(before.versions.length, 1);
  const r = await call('PATCH', '/api/v1/exercises/1', { body: { reference_duration_minutes: 20 } });
  assert.equal(r.status, 200); assert.equal(r.body.meta.version_created, true);
  const after = r.body.data;
  assert.equal(after.version, 2); assert.equal(after.active, false); assert.equal(after.technical_review_status, 'not_in_reviewed_content');
  assert.equal(after.ficha.reference_duration_minutes, 20);
  assert.deepEqual(after.versions[0], before.versions[0]);
  assert.notEqual(after.exercise_version_id, before.exercise_version_id);
  assert.ok(!(await playerCatalogIds()).includes('1'), 'los planes nuevos ya no lo reciben');
  const same = await call('PATCH', '/api/v1/exercises/1', { body: { reference_duration_minutes: 20 } });
  assert.equal(same.body.meta.version_created, false); assert.equal(same.body.data.version, 2);
});

test('Desactivar saca el ejercicio de los planes nuevos; reactivar uno verificado lo devuelve', async () => {
  assert.ok((await playerCatalogIds()).includes('2'));
  const withIt = (await call('POST', '/api/v1/blocks/11/plan-proposal', { token: 'token-a', body: {} })).body.data;
  assert.ok(withIt.exercises.some(e => e.exercise_snapshot.exercise_id === '2'), 'activo: entra en la propuesta');
  const off = await call('PATCH', '/api/v1/exercises/2', { body: { active: false } });
  assert.equal(off.status, 200); assert.equal(off.body.data.active, false); assert.equal(off.body.meta.status_changed, true);
  assert.ok(!(await playerCatalogIds()).includes('2'));
  const proposal = (await call('POST', '/api/v1/blocks/11/plan-proposal', { token: 'token-a', body: {} })).body.data;
  assert.ok(proposal.exercises.length > 0 && !proposal.exercises.some(e => e.exercise_snapshot.exercise_id === '2'), 'inactivo: fuera de la propuesta');
  const on = await call('PATCH', '/api/v1/exercises/2', { body: { active: true } });
  assert.equal(on.body.data.active, true); assert.ok((await playerCatalogIds()).includes('2'));
  assert.equal((await call('PATCH', '/api/v1/exercises/2', { body: { active: true } })).body.meta.status_changed, false);
});

test('Borrar: usado en planes se desactiva; nunca usado se elimina', async () => {
  db.state.adminStore.used.add('1');
  const used = await call('DELETE', '/api/v1/exercises/1');
  assert.equal(used.status, 200); assert.equal(used.body.data.effect, 'deactivated'); assert.match(used.body.data.message, /conservan/);
  assert.equal((await call('GET', '/api/v1/exercises/1')).body.data.versions.length, 1);
  assert.equal((await call('DELETE', '/api/v1/exercises/1')).body.data.effect, 'already_inactive');
  const created = (await call('POST', '/api/v1/exercises', { body: ficha() })).body.data;
  const del = await call('DELETE', `/api/v1/exercises/${created.exercise_id}`);
  assert.equal(del.body.data.effect, 'deleted');
  assert.equal((await call('GET', `/api/v1/exercises/${created.exercise_id}`)).status, 404);
  assert.equal((await call('DELETE', `/api/v1/exercises/${created.exercise_id}`)).status, 404);
  for (const path of ['/api/v1/exercises/abc', '/api/v1/exercises/999']) assert.equal((await call('GET', path)).status, 404);
});

test('Resumen del panel: conteos reales y progreso pendiente', async () => {
  const r = await call('GET', '/api/v1/admin/summary');
  assert.equal(r.status, 200); assert.equal(r.cache, 'no-store');
  const d = r.body.data;
  assert.deepEqual(d.users, { total: 3, active: 2, suspended: 1, admins: 1, players: 2 });
  assert.deepEqual(d.catalog, { total: 3, active: 3, inactive: 0, verified: 3, offered: 3 });
  assert.deepEqual(d.blocks, { needs_correction: 2, waiting_service: 1, processing: 0, ready: 5 });
  assert.equal(d.plans.saved_versions, 4); assert.equal(d.goals.active, 3);
  assert.equal(d.progress.status, 'pending'); assert.deepEqual(d.progress.depends_on, ['A22', 'A26']);
  db.state.fail = 'planes';
  try { const f = await call('GET', '/api/v1/admin/summary'); assert.equal(f.status, 503); assert.ok(!JSON.stringify(f.body).includes('private')); }
  finally { db.state.fail = null; }
});

test('Usuarios admin: correo y último acceso desde Auth; sin Auth la lista sigue respondiendo', async () => {
  let r = await call('GET', '/api/v1/admin/users');
  assert.equal(r.status, 200); assert.equal(r.body.meta.auth_details, true);
  const admin = r.body.data.find(u => u.id === 'admin');
  assert.equal(admin.email, ADMIN_EMAIL); assert.equal(admin.last_sign_in_at, '2026-11-17T09:00:00Z');
  assert.equal(r.body.data.find(u => u.id === 'suspended').email, null);
  assert.ok(!JSON.stringify(r.body).match(/token|password|key/i));
  db.state.adminStore.listUsers = false;
  r = await call('GET', '/api/v1/admin/users');
  assert.equal(r.status, 200); assert.equal(r.body.meta.auth_details, false); assert.ok(!('email' in r.body.data[0]));
});

test('Un administrador no cambia su propio estado', async () => {
  const createAuthUser = '00000000-0000-4000-8000-0000000000aa';
  // El token de admin del ayudante usa el id "admin"; se comprueba con un UUID propio simulado.
  const { createApp: build } = require('../src/app');
  const selfDb = adminDatabase();
  selfDb.auth.getUser = async () => ({ data: { user: { id: createAuthUser } }, error: null });
  const baseFrom = selfDb.from;
  selfDb.from = table => {
    if (table !== 'usuarios') return baseFrom(table);
    return { select() { return this; }, eq() { return this; }, order() { return this; },
      maybeSingle: async () => ({ data: { id_usuario: createAuthUser, rol: 'administrador', estado: 'activo' }, error: null }) };
  };
  const app = build({ supabase: selfDb });
  const srv = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  try {
    const res = await fetch(`http://127.0.0.1:${srv.address().port}/api/v1/admin/users/${createAuthUser}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer x' }, body: JSON.stringify({ status: 'suspended' }) });
    assert.equal(res.status, 409); assert.equal((await res.json()).error.code, 'SELF_STATUS_CHANGE');
  } finally { await new Promise(resolve => srv.close(resolve)); }
});
