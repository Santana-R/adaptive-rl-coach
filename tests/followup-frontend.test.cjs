'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const model = require('../public/sitio/js/followup-model');
const plan = {
  plan_id: '3', version: 2, plan_version_id: '14', block_id: '7',
  exercises: [{ plan_exercise_id: '20' }]
};

function input(changes = {}) {
  return { performed_at: '2026-11-16T12:00:00Z', duration_minutes: '20', notes: ' práctica ', ...changes };
}

test('A28: datos ausentes no se convierten en cero y periodo valida fechas reales', () => {
  assert.equal(model.display(null), 'No disponible');
  assert.equal(model.display(undefined), 'No disponible');
  assert.equal(model.display(0), '0');
  assert.equal(model.period('2026-11-01', '2026-11-30'), 'from=2026-11-01&to=2026-11-30');
  for (const dates of [['2026-02-30', '2026-03-01'], ['2026-11-20', '2026-11-01'], ['', '2026-11-01']]) {
    assert.throws(() => model.period(...dates));
  }
});

test('A28: sesión conserva versión exacta y valida pertenencia, fecha, minutos y notas', () => {
  assert.deepEqual(model.session(input({ plan_exercise_id: '20', plan_version_id: '999' }), plan), {
    plan_version_id: '14', plan_exercise_id: '20', performed_at: '2026-11-16T12:00:00.000Z', duration_minutes: 20, notes: 'práctica'
  });
  assert.throws(() => model.session(input(), null));
  for (const change of [{ duration_minutes: 0 }, { duration_minutes: -1 }, { duration_minutes: 1.5 },
    { duration_minutes: '' }, { duration_minutes: 32768 }, { performed_at: 'no es fecha' },
    { plan_exercise_id: '999' }, { notes: 'x'.repeat(2001) }]) assert.throws(() => model.session(input(change), plan));
});

test('A28: enlace histórico verifica plan, número de versión, ID exacto, bloque y ejercicio', () => {
  const base = { plan_id: '3', version: '2', plan_version_id: '14', block_id: '7', plan_exercise_id: '20' };
  assert.equal(model.matches(plan, new URLSearchParams(base)), true);
  for (const key of Object.keys(base)) assert.equal(model.matches(plan, new URLSearchParams({ ...base, [key]: '999' })), false);
});

function service(ajax, token = 'session-token') {
  const window = { CoachAuth: { getClient: () => ({ auth: { getSession: async () => ({ data: { session: token ? { access_token: token } : null } }) } }) } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/sitio/js/followup-service.js'), 'utf8'), { window, $: { ajax }, Error });
  return window.CoachFollowupService;
}

test('A28: adaptador autentica cada operación, no guarda como GET y codifica identificadores', async () => {
  const calls = [];
  const api = service(async options => { calls.push(options); return { data: [] }; });
  await api.sessions(); await api.create({ plan_version_id: '14' });
  await api.update('a/b', { duration_minutes: 40 }); await api.remove('20');
  await api.report(model.period('2026-11-01', '2026-11-16')); await api.retry('7');
  assert.deepEqual(calls.map(c => c.method), ['GET', 'POST', 'PATCH', 'DELETE', 'GET', 'POST']);
  assert.equal(calls[2].url, '/api/v1/sessions/a%2Fb');
  assert.equal(JSON.parse(calls[1].data).plan_version_id, '14');
  assert.ok(calls.every(c => c.headers.Authorization === 'Bearer session-token'));
  assert.equal(calls[4].url, '/api/v1/reports?from=2026-11-01&to=2026-11-16');
});

test('A28: autenticación ausente no consulta; fallo de escritura es incierto; 404 no es lista vacía', async () => {
  let called = false;
  await assert.rejects(service(async () => { called = true; }, null).sessions(), error => error.status === 401);
  assert.equal(called, false);
  const offline = service(async () => { throw { status: 0 }; });
  await assert.rejects(offline.create({}), error => error.uncertain === true);
  await assert.rejects(offline.sessions(), error => error.uncertain === false);
  await assert.rejects(service(async () => { throw { status: 404 }; }).sessions(), error => error.status === 404);
  await assert.rejects(service(async () => '<html>error</html>').sessions(), /incompatible/);
});
