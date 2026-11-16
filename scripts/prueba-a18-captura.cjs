// HTTP/repositorios/motor con filas capturadas de una consulta SQL.
// Autenticación y transporte Supabase expresamente simulados.
// Uso: node scripts/prueba-a18-captura.cjs captura.json [salida-ejemplo.json]
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { storedDatabase, A } = require('../tests/helpers/stored-database.cjs');

let server;
(async () => {
  if (!process.argv[2]) throw new Error('Indica un JSON con block, profile y catalog de la consulta SQL de prueba.');
  const captured = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  assert.ok(captured.block && captured.profile && Array.isArray(captured.catalog));
  const db = storedDatabase();
  db.state.rows = [{ ...captured.block, id_bloque: String(captured.block.id_bloque), id_usuario: A }];
  db.state.profiles.set(A, { ...captured.profile, id_usuario: A });
  db.state.catalog = captured.catalog;
  const app = createApp({ supabase: db });
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}/api/v1/blocks/${captured.block.id_bloque}`;
  async function proposal(body, token = 'token-a') {
    const res = await fetch(base + '/plan-proposal', { method: 'POST', headers: {
      'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(body) });
    return { status: res.status, body: await res.json() };
  }
  const first = await proposal({ availability_minutes: 20, workshop_access: true, rank: 'diamond' });
  assert.equal(first.status, 200); assert.equal(first.body.meta.persisted, false);
  assert.deepEqual(first.body.data.exercises.map(e => e.assigned_minutes), [10, 5, 5]);
  assert.equal(first.body.data.plan_id, null);
  const without = await proposal({ availability_minutes: 20 });
  assert.deepEqual(without.body.data.exercises.map(e => e.assigned_minutes), [15, 5]);
  assert.equal((await proposal({}, 'token-b')).status, 404);
  const analysis = await (await fetch(base + '/analysis', { headers: { Authorization: 'Bearer token-a' } })).json();
  assert.equal(analysis.data.metrics.values.shooting_pct.value, 30);
  assert.equal(analysis.data.metrics.values.play_duration_s.value, null);
  assert.equal(analysis.meta.synthetic, null);
  if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify({ evidence: {
    data: 'synthetic block inserted/read inside real SQL transaction, then rolled back',
    database_transport: 'captured responses', authentication: 'simulated', real_user_session_test: false, persisted_plan: false },
    ...first.body }, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, with_workshop: [10, 5, 5], without_workshop: [15, 5],
    foreign_user: 404, shooting_pct: 30, play_duration_s: null,
    data: 'real SQL capture of controlled synthetic block and catalog', auth_and_transport: 'simulated' }));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
});
