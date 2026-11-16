'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

const ADMIN = '00000000-0000-4000-8000-000000000001';
const PLAYER = '00000000-0000-4000-8000-000000000002';
const USERS = '/api/v1/admin/users';
const STATUS = `${USERS}/${PLAYER}/status`;

const users = new Map([
  [ADMIN, { id_usuario: ADMIN, nombre: 'Admin de prueba', rol: 'administrador', estado: 'activo' }],
  [PLAYER, { id_usuario: PLAYER, nombre: 'Jugador de prueba', rol: 'jugador', estado: 'activo' }],
]);
const tokens = new Map([['token-admin', ADMIN], ['token-player', PLAYER]]);
const rpcCalls = [];

const supabase = {
  auth: {
    async getUser(token) {
      const id = tokens.get(token);
      return { data: { user: id ? { id } : null }, error: null };
    },
  },
  from(table) {
    assert.equal(table, 'usuarios');
    let id;
    const query = {
      select() { return query; },
      eq(column, value) {
        assert.equal(column, 'id_usuario');
        id = value;
        return query;
      },
      order() { return query; },
      async maybeSingle() {
        return { data: users.get(id) ?? null, error: null };
      },
      then(resolve, reject) {
        return Promise.resolve({ data: [...users.values()], error: null }).then(resolve, reject);
      },
    };
    return query;
  },
  rpc(name, args) {
    assert.equal(name, 'a29_cambiar_estado_usuario');
    rpcCalls.push(args);
    return {
      async maybeSingle() {
        const row = users.get(args.p_user_id);
        if (!row) return { data: null, error: null };
        row.estado = args.p_estado;
        return { data: row, error: null };
      },
    };
  },
};

let server;
let base;

test.before(async () => {
  const app = createApp({ supabase });
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => new Promise(resolve => server.close(resolve)));

async function request(path, { token, method = 'GET', body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(base + path, { method, headers, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

test('A29 exige sesión y rechaza el listado y el cambio de estado para un jugador', async () => {
  const previousCalls = rpcCalls.length;
  const anonymous = await request(USERS);
  assert.equal(anonymous.status, 401);

  const list = await request(USERS, { token: 'token-player' });
  assert.equal(list.status, 403);
  assert.equal(list.body.error.code, 'ROLE_DENIED');

  const change = await request(STATUS, {
    token: 'token-player', method: 'PATCH', body: { status: 'suspended' },
  });
  assert.equal(change.status, 403);
  assert.equal(change.body.error.code, 'ROLE_DENIED');
  assert.equal(rpcCalls.length, previousCalls);
});

test('A29 entrega al administrador el listado con los campos del contrato', async () => {
  const result = await request(USERS, { token: 'token-admin' });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.data, [
    { id: ADMIN, name: 'Admin de prueba', role: 'admin', status: 'active' },
    { id: PLAYER, name: 'Jugador de prueba', role: 'player', status: 'active' },
  ]);
});

test('A29 rechaza campos adicionales en el PATCH antes de llamar a Supabase', async () => {
  const previousCalls = rpcCalls.length;
  const result = await request(STATUS, {
    token: 'token-admin', method: 'PATCH', body: { status: 'suspended', role: 'admin' },
  });
  assert.equal(result.status, 400);
  assert.equal(result.body.error.code, 'INPUT_INVALID');
  assert.equal(rpcCalls.length, previousCalls);
});

test('A29 aplica la suspensión y reactivación a la misma sesión de jugador', async () => {
  const previousCalls = rpcCalls.length;
  const change = status => request(STATUS, {
    token: 'token-admin', method: 'PATCH', body: { status },
  });
  const playerSession = () => request('/api/v1/me', { token: 'token-player' });

  assert.equal((await playerSession()).status, 200);

  const suspended = await change('suspended');
  assert.equal(suspended.status, 200);
  assert.equal(suspended.body.data.status, 'suspended');

  const blocked = await playerSession();
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.error.code, 'USER_SUSPENDED');

  const active = await change('active');
  assert.equal(active.status, 200);
  assert.equal(active.body.data.status, 'active');
  assert.equal((await playerSession()).status, 200);

  assert.deepEqual(rpcCalls.slice(previousCalls), [
    { p_admin_id: ADMIN, p_user_id: PLAYER, p_estado: 'suspendido' },
    { p_admin_id: ADMIN, p_user_id: PLAYER, p_estado: 'activo' },
  ]);
});