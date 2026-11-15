'use strict';

// Pruebas de A08 con un Supabase simulado: no necesitan claves ni internet.
// Ejecutar: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { assertOwner, ApiError } = require('../src/middleware/auth');

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const ADMIN = '00000000-0000-4000-8000-0000000000ad';
const SUSP = '00000000-0000-4000-8000-0000000000ss';
const HUERFANO = '00000000-0000-4000-8000-0000000000hh';

// Datos sintéticos de prueba.
const tokens = {
  'token-a': A,
  'token-b': B,
  'token-admin': ADMIN,
  'token-suspendido': SUSP,
  'token-huerfano': HUERFANO, // existe en Auth pero no en usuarios
};
const tables = {
  usuarios: [
    { id_usuario: A, rol: 'jugador', estado: 'activo' },
    { id_usuario: B, rol: 'jugador', estado: 'activo' },
    { id_usuario: ADMIN, rol: 'administrador', estado: 'activo' },
    { id_usuario: SUSP, rol: 'jugador', estado: 'suspendido' },
  ],
  perfiles: [
    { id_usuario: A, plataforma: 'steam', cuenta_juego_id: 'TEST_A', modalidad_principal: '2v2', minutos_sesion: 30 },
    { id_usuario: B, plataforma: 'epic', cuenta_juego_id: 'TEST_B', modalidad_principal: '3v3', minutos_sesion: 45 },
  ],
};

function fakeSupabase() {
  return {
    auth: {
      async getUser(token) {
        const id = tokens[token];
        return id ? { data: { user: { id } }, error: null } : { data: { user: null }, error: { message: 'invalid JWT' } };
      },
    },
    from(table) {
      const filters = [];
      const query = {
        select() { return query; },
        eq(col, val) { filters.push([col, val]); return query; },
        async maybeSingle() {
          const rows = (tables[table] ?? []).filter((r) => filters.every(([c, v]) => r[c] === v));
          return { data: rows[0] ?? null, error: null };
        },
      };
      return query;
    },
  };
}

let server;
let base;

test.before(async () => {
  const app = createApp({ supabase: fakeSupabase() });
  await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => new Promise((resolve) => server.close(resolve)));

async function get(path, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(base + path, { headers });
  return { status: res.status, body: await res.json() };
}

test('/health sigue siendo público', async () => {
  const r = await get('/health');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { status: 'ok' });
});

test('sin token → 401 AUTH_REQUIRED', async () => {
  const r = await get('/api/v1/me');
  assert.equal(r.status, 401);
  assert.equal(r.body.error.code, 'AUTH_REQUIRED');
});

test('token inválido → 401 AUTH_REQUIRED', async () => {
  const r = await get('/api/v1/me', 'token-falso');
  assert.equal(r.status, 401);
  assert.equal(r.body.error.code, 'AUTH_REQUIRED');
});

test('jugador activo → /me devuelve su id, role y status', async () => {
  const r = await get('/api/v1/me', 'token-a');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { id: A, role: 'player', status: 'active' });
});

test('administrador → role admin', async () => {
  const r = await get('/api/v1/me', 'token-admin');
  assert.equal(r.status, 200);
  assert.equal(r.body.role, 'admin');
});

test('suspendido → 403 USER_SUSPENDED (comprobado en servidor)', async () => {
  const r = await get('/api/v1/me', 'token-suspendido');
  assert.equal(r.status, 403);
  assert.equal(r.body.error.code, 'USER_SUSPENDED');
  const p = await get('/api/v1/profile', 'token-suspendido');
  assert.equal(p.status, 403);
});

test('cuenta de Auth sin fila en usuarios → 403, sin rol asumido', async () => {
  const r = await get('/api/v1/me', 'token-huerfano');
  assert.equal(r.status, 403);
  assert.equal(r.body.error.code, 'ROLE_DENIED');
});

test('A y B solo reciben su propio perfil', async () => {
  const a = await get('/api/v1/profile', 'token-a');
  const b = await get('/api/v1/profile', 'token-b');
  assert.equal(a.status, 200);
  assert.equal(a.body.id, A);
  assert.equal(a.body.player_id, 'TEST_A');
  assert.equal(b.body.id, B);
  assert.equal(b.body.player_id, 'TEST_B');
});

test('A no puede pedir el perfil de B enviando un id (se ignora)', async () => {
  const r = await get(`/api/v1/profile?user_id=${B}&id_usuario=${B}`, 'token-a');
  assert.equal(r.status, 200);
  assert.equal(r.body.id, A);
});

test('usuario sin perfil → 404 RESOURCE_NOT_FOUND', async () => {
  const r = await get('/api/v1/profile', 'token-admin');
  assert.equal(r.status, 404);
  assert.equal(r.body.error.code, 'RESOURCE_NOT_FOUND');
});

test('assertOwner: recurso ajeno → 404, propio pasa', () => {
  const req = { user: { id: A, role: 'player' } };
  assert.doesNotThrow(() => assertOwner(req, A));
  assert.throws(() => assertOwner(req, B), (e) => e instanceof ApiError && e.status === 404);
  assert.throws(() => assertOwner(req, null), ApiError);
});

test('sin configuración de Supabase → 503, la demo estática sigue', async () => {
  const app = createApp({ supabase: null });
  const srv = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  try {
    const url = `http://127.0.0.1:${srv.address().port}`;
    const me = await fetch(`${url}/api/v1/me`, { headers: { Authorization: 'Bearer token-a' } });
    assert.equal(me.status, 503);
    const health = await fetch(`${url}/health`);
    assert.equal(health.status, 200);
  } finally {
    await new Promise((resolve) => srv.close(resolve));
  }
});
