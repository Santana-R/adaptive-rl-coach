'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { startAnalysisServer, fakeAuth, A, B } = require('./helpers/analysis-server.cjs');

const input = {
  plan_version_id: '11',
  plan_exercise_id: '21',
  performed_at: '2025-10-01T18:00:00.000Z',
  duration_minutes: 10
};
const first = { ...input, session_id: '1', version: 1, notes: null, source: 'self_reported' };
const second = { ...first, session_id: '2', plan_version_id: '12', plan_exercise_id: '22', duration_minutes: 4 };
const updated = { ...first, duration_minutes: 15, version: 2 };

async function open(t, rpc) {
  const server = await startAnalysisServer({ demo: false, auth: { ...fakeAuth(), rpc } });
  t.after(server.close);

  return async (method, path = '', { token = 'token-a', body } = {}) => {
    const headers = {};
    if (token) headers.Authorization = 'Bearer ' + token;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const response = await fetch(server.base + '/api/v1/sessions' + path, {
      method, headers, body: JSON.stringify(body)
    });

    return { status: response.status, headers: response.headers, body: await response.json() };
  };
}

test('A21 exige sesión activa y valida el cuerpo antes de llamar a Supabase', async (t) => {
  const rpc = t.mock.fn();
  const request = await open(t, rpc);

  const anonymous = await request('GET', '', { token: null });
  assert.equal(anonymous.status, 401);
  assert.equal(anonymous.body.error.code, 'AUTH_REQUIRED');

  const suspended = await request('GET', '', { token: 'token-suspended' });
  assert.equal(suspended.status, 403);
  assert.equal(suspended.body.error.code, 'USER_SUSPENDED');

  for (const change of [{ duration_minutes: 0 }, { performed_at: '2025-02-30T00:00:00Z' }, { user_id: B }]) {
    const result = await request('POST', '', { body: { ...input, ...change } });
    assert.equal(result.status, 400);
  }

  assert.equal((await request('PATCH', '/1', { body: { plan_version_id: '12' } })).status, 400);
  assert.equal(rpc.mock.callCount(), 0);
});

test('A21 conecta alta, consulta, corrección y borrado con la sesión verificada', async (t) => {
  const replies = [first, [first], [first, second], updated, [updated, second], { session_id: '1', effect: 'deleted' }, [second]];
  const rpc = t.mock.fn(async () => ({ data: replies.shift(), error: null }));
  const request = await open(t, rpc);

  const created = await request('POST', '', { body: input });
  assert.equal(created.status, 201);
  assert.equal(created.headers.get('location'), '/api/v1/sessions/1');
  assert.deepEqual(created.body.data, first);
  assert.deepEqual((await request('GET', '/1')).body.data, first);

  const listed = await request('GET');
  assert.equal(listed.headers.get('cache-control'), 'no-store');
  assert.deepEqual(listed.body.meta.training, {
    source: 'self_reported_sessions', session_count: 2, duration_minutes: 14
  });

  const changed = await request('PATCH', '/1', { body: { duration_minutes: 15 } });
  assert.equal(changed.status, 200);
  assert.equal(changed.body.data.version, 2);
  assert.equal((await request('GET')).body.meta.training.duration_minutes, 19);

  const removed = await request('DELETE', '/1');
  assert.equal(removed.status, 200);
  assert.equal(removed.body.data.effect, 'deleted');
  assert.equal((await request('GET')).body.meta.training.duration_minutes, 4);

  assert.deepEqual(rpc.mock.calls.map(call => call.arguments), [
    ['a21_crear_sesion', {
      p_id_usuario: A, p_id_plan: '11', p_id_plan_ejercicio: '21',
      p_fecha_practica: input.performed_at, p_minutos: 10, p_notas: null
    }],
    ['a21_consultar_sesiones', { p_id_usuario: A, p_id_sesion: '1' }],
    ['a21_consultar_sesiones', { p_id_usuario: A, p_id_sesion: null }],
    ['a21_corregir_sesion', { p_id_usuario: A, p_id_sesion: '1', p_cambios: { duration_minutes: 15 } }],
    ['a21_consultar_sesiones', { p_id_usuario: A, p_id_sesion: null }],
    ['a21_eliminar_sesion', { p_id_usuario: A, p_id_sesion: '1' }],
    ['a21_consultar_sesiones', { p_id_usuario: A, p_id_sesion: null }]
  ]);
});

test('A21 responde 404 a una sesión ajena y 422 a un ejercicio de otra versión', async (t) => {
  const replies = [
    { data: [], error: null },
    { data: [], error: null },
    { data: null, error: { code: 'P0002' } },
    { data: null, error: { code: 'A2101' } }
  ];
  const rpc = t.mock.fn(async () => replies.shift());
  const request = await open(t, rpc);

  const foreign = await request('GET', '/1', { token: 'token-b' });
  const missing = await request('GET', '/999', { token: 'token-b' });

  assert.equal(foreign.status, 404);
  assert.deepEqual(foreign.body, missing.body);
  assert.equal((await request('DELETE', '/1', { token: 'token-b' })).status, 404);
  assert.equal((await request('POST', '', { body: { ...input, plan_exercise_id: '22' } })).status, 422);
  assert.deepEqual(rpc.mock.calls.map(call => call.arguments[1].p_id_usuario), [B, B, B, A]);
});