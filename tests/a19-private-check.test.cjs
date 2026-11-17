'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { storedDatabase, A, B } = require('./helpers/stored-database.cjs');
const { runChecks } = require('../scripts/prueba-a19.cjs');
let server, base;
test.before(async () => {
  server = createApp({ supabase: storedDatabase() }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
});
test.after(() => new Promise(resolve => server.close(resolve)));
const options = () => ({ base, tokenA: 'token-a', tokenB: 'token-b', userA: A, userB: B, blockId: '11' });

test('A19: comprobador contrasta HTTP privado y controlador sin imprimir identidades o tokens (Auth/SQL simulados)', async () => {
  const report = await runChecks(options());
  assert.equal(report.passed, true, JSON.stringify(report));
  assert.equal(report.failed, 0);
  assert.equal(report.total, 14);
  const raw = JSON.stringify(report);
  for (const secret of ['token-a', 'token-b', A, B]) assert.ok(!raw.includes(secret));
  assert.ok(report.cases.find(c => c.id === 'api_controller_values').passed);
  assert.ok(report.cases.find(c => c.id === 'foreign_same_as_missing').passed);
  assert.ok(report.cases.find(c => c.id === 'manual_totals').passed);
});

test('A19: el comprobador falla si una regresión permite a B leer análisis de A', async () => {
  const fetchImpl = (url, options) => {
    const u = new URL(url);
    if (u.pathname === '/api/v1/blocks/11/analysis' && options.headers?.Authorization === 'Bearer token-b') {
      return fetch(url, { ...options, headers: { Authorization: 'Bearer token-a' } });
    }
    return fetch(url, options);
  };
  const report = await runChecks({ ...options(), fetchImpl });
  assert.equal(report.passed, false);
  assert.equal(report.cases.find(c => c.id === 'foreign_same_as_missing').passed, false);
});

test('A19: cuenta repetida o bloque no disponible no producen evidencia aprobada', async () => {
  const repeated = await runChecks({ ...options(), userB: A });
  assert.equal(repeated.passed, false);
  assert.equal(repeated.cases[0].passed, false);
  const missing = await runChecks({ ...options(), blockId: '999999999999999999' });
  assert.equal(missing.passed, false);
  assert.equal(missing.cases.find(c => c.id === 'own_ready_block').passed, false);
  assert.ok(!missing.cases.some(c => c.id === 'own_analysis'));
});
