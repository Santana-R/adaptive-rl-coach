'use strict';

// Contrato de A20: payloads compatibles con el validador real de A16.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseCreate, parseEdit } = require('../src/domain/goals');
const { validate } = require('../public/sitio/js/goals-validation');

const INPUT = {
  type: 'performance', mode: '2v2', name: 'Más precisión', comparator: '>=',
  target_value: 35, start_date: '2026-11-01', due_date: '2026-12-31'
};

test('A20 alta y edición envían solo campos admitidos por A16', () => {
  const created = validate(INPUT);
  assert.equal(created.valid, true);
  const current = parseCreate(created.data, { today: '2026-11-01' });
  assert.equal(current.metric_key, 'shooting_pct');
  const edited = validate({ ...INPUT, target_value: 40 }, true);
  assert.equal(edited.valid, true);
  for (const key of ['type', 'mode', 'metric_key', 'unit', 'status', 'user_id']) {
    assert.equal(key in edited.data, false);
  }
  assert.equal(parseEdit(edited.data, current).goal.target_value, 40);
  assert.equal(parseEdit(validate(INPUT, true).data, current).changed, false);
});

test('A20 usa minutos de entrenamiento y permite inicio por defecto del servidor', () => {
  const parsed = validate({ ...INPUT, type: 'training', target_value: 120, start_date: '', due_date: '' });
  assert.equal(parsed.valid, true);
  assert.equal('start_date' in parsed.data, false);
  const goal = parseCreate(parsed.data, { today: '2026-11-17' });
  assert.equal(goal.metric_key, 'training_minutes');
  assert.equal(goal.unit, 'minutes');
  assert.equal(goal.start_date, '2026-11-17');
  assert.equal(goal.due_date, null);
});

test('A20 límites de porcentaje, minutos, nombres y fechas coinciden con A16', () => {
  const cases = [
    { target_value: 0 }, { target_value: 101 }, { target_value: 35.12345 },
    { target_value: null }, { name: ' ' }, { name: 'x'.repeat(101) },
    { comparator: '<=' }, { mode: '4v4' }, { start_date: '2026-02-30' },
    { due_date: '2026-10-31' }, { type: 'training', target_value: 1.5 },
    { type: 'training', comparator: '>' }, { type: 'training', target_value: 100001 }
  ];
  for (const invalid of cases) {
    assert.equal(validate({ ...INPUT, ...invalid }).valid, false, JSON.stringify(invalid));
    assert.throws(() => parseCreate({ ...INPUT, ...invalid }, { today: '2026-11-01' }));
  }
  for (const value of [0.0001, 35.1234, 100]) {
    assert.equal(validate({ ...INPUT, target_value: value }).valid, true);
    assert.doesNotThrow(() => parseCreate({ ...INPUT, target_value: value }, { today: '2026-11-01' }));
  }
});

function serviceHarness(ajax, session = { access_token: 'current-token' }) {
  const context = {
    window: { CoachAuth: { getClient: () => ({ auth: {
      getSession: async () => ({ data: { session } })
    } }) } },
    $: { ajax }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/sitio/js/goals-service.js'), 'utf8'), context);
  return context.window.CoachGoalsService;
}

test('A20 consulta archivados, manda token y respeta los verbos de A16', async () => {
  const calls = [];
  const service = serviceHarness(async options => {
    calls.push(options);
    return { data: options.method === 'DELETE' ? { effect: 'archived' } : [] };
  });
  await service.list();
  assert.equal(calls[0].url, '/api/v1/goals?status=all');
  assert.equal(calls[0].headers.Authorization, 'Bearer current-token');
  await service.get('7');
  assert.equal(calls[1].url, '/api/v1/goals/7');
  await service.create(validate(INPUT).data);
  assert.equal(calls[2].method, 'POST');
  assert.equal(JSON.parse(calls[2].data).name, INPUT.name);
  await service.update('7', validate(INPUT, true).data);
  assert.equal(calls[3].method, 'PATCH');
  assert.equal('type' in JSON.parse(calls[3].data), false);
  assert.equal((await service.remove('7')).effect, 'archived');
  assert.equal(calls[4].method, 'DELETE');
});

test('A20 sesión ausente, 409, red y respuestas inválidas no se sustituyen por ejemplos', async () => {
  let called = false;
  const guest = serviceHarness(async () => { called = true; }, null);
  await assert.rejects(guest.list(), error => error.status === 401);
  assert.equal(called, false);
  const conflict = serviceHarness(async () => {
    throw { status: 409, responseJSON: { error: { code: 'GOAL_ACTIVE_EXISTS', message: 'Ya existe una meta activa.' } } };
  });
  await assert.rejects(conflict.create(INPUT), error => error.code === 'GOAL_ACTIVE_EXISTS');
  const offline = serviceHarness(async () => { throw { status: 0 }; });
  await assert.rejects(offline.create(INPUT), /antes de repetirla/);
  const malformed = serviceHarness(async () => '<html>');
  await assert.rejects(malformed.list(), /Respuesta no reconocida/);
});
