'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const model = require('../public/sitio/js/plan-model');
const { parseProposalInput } = require('../src/routes/plans');
const { createApp } = require('../src/app');
const { getPlanForBlock } = require('../src/repositories/plans');
const { storedDatabase, A, B } = require('./helpers/stored-database.cjs');

const INPUT = { block_id: '11', availability_minutes: 20, workshop_access: false, rank: '', coco_variant_key: '', goal_ids: [] };

test('A27 cuerpo de propuesta compatible con A18: no envía identidad ni plataforma', () => {
  for (const minutes of [0, 4, 20, 40, 32767]) {
    const result = model.validate({ ...INPUT, availability_minutes: minutes });
    assert.equal(result.valid, true);
    assert.doesNotThrow(() => parseProposalInput(result.data));
    for (const key of ['block_id', 'platform', 'user_id', 'plan_id', 'version']) assert.equal(key in result.data, false);
  }
  for (const patch of [{ block_id: '' }, { availability_minutes: 1.5 }, { availability_minutes: -1 },
    { availability_minutes: null }, { rank: 'inventado' }, { coco_variant_key: 'inventada' },
    { workshop_access: 'true' }, { goal_ids: ['1', '1'] }, { goal_ids: ['test-goal'] }]) {
    assert.equal(model.validate({ ...INPUT, ...patch }).valid, false, JSON.stringify(patch));
  }
});

test('A27 no guarda propuestas de cero minutos ni rutinas sin versión SQL', () => {
  assert.equal(model.canSave({ availability_minutes: 20, exercises: [{ exercise_version_id: '123' }] }), true);
  assert.equal(model.canSave({ availability_minutes: 0, exercises: [] }), false);
  assert.equal(model.canSave({ availability_minutes: 20, exercises: [{ exercise_version_id: null }] }), false);
});

test('A27 enlaces seguros y contexto exacto para Sesiones', () => {
  assert.equal(model.safeResource('javascript:alert(1)'), null);
  assert.equal(model.safeResource('data:text/html,test'), null);
  assert.equal(model.safeResource('https://example.com/'), 'https://example.com/');
  const url = model.sessionsUrl({ plan_id: '2', plan_version_id: '8', version: 3, block_id: '11' }, '9');
  const query = new URL(url, 'https://example.com').searchParams;
  assert.equal(query.get('plan_id'), '2');
  assert.equal(query.get('plan_version_id'), '8');
  assert.equal(query.get('plan_exercise_id'), '9');
  assert.equal(query.get('version'), '3');
  assert.equal(model.sessionsUrl({ plan_id: null }), null);
});

function serviceHarness(ajax, session = { access_token: 'token' }) {
  const context = { window: { CoachAuth: { getClient: () => ({ auth: { getSession: async () => ({ data: { session } }) } }) } }, $: { ajax } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/sitio/js/plan-service.js'), 'utf8'), context);
  return context.window.CoachPlanService;
}

test('A27 usa GET para consultar y POST para propuestas/guardado con sesión vigente', async () => {
  const calls = [];
  const api = serviceHarness(async options => { calls.push(options); return { data: [] }; });
  await api.blockPlan('11');
  await api.proposal('11', model.validate(INPUT).data);
  await api.saveBlock('11', model.validate(INPUT).data);
  await api.saveVersion('2', model.validate(INPUT).data);
  await api.versions('2');
  await api.version('2', 1);
  assert.deepEqual(calls.map(c => [c.method, c.url]), [
    ['GET', '/api/v1/blocks/11/plan'], ['POST', '/api/v1/blocks/11/plan-proposal'],
    ['POST', '/api/v1/blocks/11/plans'], ['POST', '/api/v1/plans/2/versions'],
    ['GET', '/api/v1/plans/2/versions'], ['GET', '/api/v1/plans/2/versions/1']
  ]);
  assert.ok(calls.every(c => c.headers.Authorization === 'Bearer token'));
  const guest = serviceHarness(async () => { throw new Error('No debe llamar AJAX'); }, null);
  await assert.rejects(guest.blocks(), error => error.status === 401);
  const offline = serviceHarness(async () => { throw { status: 0 }; });
  await assert.rejects(offline.saveBlock('11', {}), /antes de repetir/);
});

function readDb() {
  const db = storedDatabase();
  const original = db.from.bind(db);
  const row = {
    id_analisis: 7, id_bloque: 11, bloques: { id_usuario: A },
    planes: [{ id_plan: 9, version: 2, estado: 'completo', minutos_disponibles: 20,
      contexto: { coverage: 'complete', exercises: [], limitations: [] },
      plan_ejercicio: [], plan_objetivo: [], creado_en: '2026-11-17T12:00:00Z' }]
  };
  db.from = table => {
    if (table !== 'analisis') return original(table);
    const filters = {};
    return {
      select() { return this; },
      eq(key, value) { filters[key] = value; return this; },
      async maybeSingle() {
        const own = filters['bloques.id_usuario'] === A && String(filters.id_bloque) === '11';
        return { data: own ? structuredClone(row) : null };
      }
    };
  };
  return db;
}

test('A27 lectura del último plan por bloque filtra propietario y no escribe', async () => {
  const db = readDb();
  const own = await getPlanForBlock(db, A, '11');
  assert.equal(own.plan_id, '7');
  assert.equal(own.plan_version_id, '9');
  assert.equal(own.version, 2);
  assert.equal(await getPlanForBlock(db, B, '11'), null);
  assert.equal(await getPlanForBlock(db, A, 'abc'), null);
});

test('A27 GET /blocks/:id/plan exige sesión y no revela planes ajenos', async () => {
  const server = createApp({ supabase: readDb() }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  async function get(id, token) {
    const r = await fetch(base + '/api/v1/blocks/' + id + '/plan', { headers: token ? { Authorization: 'Bearer ' + token } : {} });
    return { status: r.status, cache: r.headers.get('cache-control'), body: await r.json() };
  }
  try {
    const own = await get('11', 'token-a');
    assert.equal(own.status, 200);
    assert.equal(own.cache, 'no-store');
    assert.equal(own.body.meta.persisted, true);
    assert.equal((await get('11')).status, 401);
    assert.equal((await get('11', 'token-suspended')).status, 403);
    const foreign = await get('11', 'token-b');
    assert.equal(foreign.status, 404);
    assert.deepEqual(foreign.body, (await get('99', 'token-a')).body);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
