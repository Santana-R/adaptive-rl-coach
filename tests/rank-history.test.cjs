const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { parseRank, parseRecordedAt } = require('../src/domain/ranks');
const { storedDatabase, A, B } = require('./helpers/stored-database.cjs');

const NOW = new Date('2026-11-16T18:00:00Z');
const code = fn => { try { fn(); return 'ok'; } catch (err) { return `${err.status} ${err.code}`; } };

test('parseRank: valores normalizados, fuente fija y temporada por defecto', () => {
  const r = parseRank({ mode: '2v2', rank_label: 'diamond', division: 2, recorded_at: '2026-11-10' }, { now: NOW });
  assert.deepEqual(r, { mode: '2v2', rank_label: 'diamond', division: 2, season: 'no_declarada',
    recorded_at: '2026-11-10T12:00:00.000Z', source: 'self_reported' });
  assert.equal(parseRank({ mode: '3v3', rank_label: 'gold' }, { now: NOW }).recorded_at, NOW.toISOString());
  assert.equal(parseRank({ mode: '1v1', rank_label: 'gold', season: ' S21 ' }, { now: NOW }).season, 'S21');
});

for (const [name, body] of [
  ['fuente elegida por el cliente', { mode: '2v2', rank_label: 'gold', source: 'mmr' }],
  ['modalidad inválida', { mode: '4v4', rank_label: 'gold' }],
  ['rango desconocido', { mode: '2v2', rank_label: 'Diamante' }],
  ['división fuera de rango', { mode: '2v2', rank_label: 'gold', division: 5 }],
  ['división en Supersonic Legend', { mode: '2v2', rank_label: 'supersonic_legend', division: 1 }],
  ['temporada vacía', { mode: '2v2', rank_label: 'gold', season: '  ' }],
  ['fecha futura', { mode: '2v2', rank_label: 'gold', recorded_at: '2026-11-20' }],
  ['fecha inexistente', { mode: '2v2', rank_label: 'gold', recorded_at: '2026-02-30' }],
  ['fecha anterior al juego', { mode: '2v2', rank_label: 'gold', recorded_at: '2014-01-01' }],
  ['cuerpo no objeto', ['2v2']],
]) test('parseRank rechaza ' + name, () => assert.equal(code(() => parseRank(body, { now: NOW })), '400 INPUT_INVALID'));

test('Fecha de hoy a mediodía UTC no cuenta como futura', () => {
  const early = new Date('2026-11-16T06:00:00Z');
  assert.equal(parseRecordedAt('2026-11-16', early), early.toISOString());
});

let db, server, base;
test.before(async () => {
  db = storedDatabase(); const app = createApp({ supabase: db });
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => new Promise(resolve => server.close(resolve)));
test.beforeEach(() => { db.state.ranks.length = 0; db.state.fail = null; });

async function call(path, { method = 'GET', body, token = 'token-a' } = {}) {
  const res = await fetch(base + path, { method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: res.status, body: await res.json(), cache: res.headers.get('cache-control') };
}

test('POST registra con fuente self_reported y GET devuelve historial y vigente por modalidad', async () => {
  const first = await call('/api/v1/rank-history', { method: 'POST', body: { mode: '2v2', rank_label: 'platinum', division: 3, recorded_at: '2026-10-01' } });
  assert.equal(first.status, 201); assert.equal(first.body.data.source, 'self_reported'); assert.equal(first.cache, 'no-store');
  await call('/api/v1/rank-history', { method: 'POST', body: { mode: '2v2', rank_label: 'diamond', division: 1, recorded_at: '2026-11-10' } });
  await call('/api/v1/rank-history', { method: 'POST', body: { mode: '3v3', rank_label: 'gold', recorded_at: '2026-11-01' } });
  const r = await call('/api/v1/rank-history');
  assert.equal(r.status, 200); assert.equal(r.body.meta.source, 'self_reported');
  assert.deepEqual(r.body.data.entries.map(e => [e.mode, e.rank_label]), [['2v2', 'diamond'], ['3v3', 'gold'], ['2v2', 'platinum']]);
  assert.equal(r.body.data.current['2v2'].rank_label, 'diamond'); assert.equal(r.body.data.current['1v1'], null);
  // El rango no se mezcla con métricas: la respuesta solo trae registros declarados.
  assert.ok(r.body.data.entries.every(e => Object.keys(e).sort().join() === 'division,mode,rank_id,rank_label,recorded_at,season,source'));
  const only = await call('/api/v1/rank-history?mode=3v3');
  assert.deepEqual(Object.keys(only.body.data.current), ['3v3']); assert.equal(only.body.data.entries.length, 1);
});

test('Una corrección es un registro nuevo: el anterior se conserva', async () => {
  await call('/api/v1/rank-history', { method: 'POST', body: { mode: '2v2', rank_label: 'champion', recorded_at: '2026-11-12' } });
  await call('/api/v1/rank-history', { method: 'POST', body: { mode: '2v2', rank_label: 'diamond', division: 3, recorded_at: '2026-11-12' } });
  const r = await call('/api/v1/rank-history?mode=2v2');
  assert.equal(r.body.data.entries.length, 2); assert.equal(r.body.data.current['2v2'].rank_label, 'diamond');
});

test('Aislamiento, sesión, filtros y errores de la base sin detalles privados', async () => {
  await call('/api/v1/rank-history', { method: 'POST', body: { mode: '2v2', rank_label: 'gold' } });
  const other = await call('/api/v1/rank-history', { token: 'token-b' });
  assert.equal(other.body.data.entries.length, 0);
  assert.equal(db.state.ranks[0].id_usuario, A);
  assert.equal((await call('/api/v1/rank-history', { token: null })).status, 401);
  assert.equal((await call('/api/v1/rank-history', { token: 'token-suspended' })).status, 403);
  assert.equal((await call('/api/v1/rank-history?mode=4v4')).status, 400);
  db.state.fail = 'rangos';
  const failed = await call('/api/v1/rank-history');
  assert.equal(failed.status, 503); assert.doesNotMatch(JSON.stringify(failed.body), /private database error/);
});

async function proposal(body = {}) {
  return call('/api/v1/blocks/11/plan-proposal', { method: 'POST', body: { availability_minutes: 20, workshop_access: true, ...body } });
}

test('El generador usa el último rango declarado de la modalidad del bloque y lo deja en el snapshot', async () => {
  const none = await proposal();
  assert.equal(none.body.meta.rank_origin, 'none'); assert.equal(none.body.data.profile_snapshot.rank, null);

  await call('/api/v1/rank-history', { method: 'POST', body: { mode: '3v3', rank_label: 'bronze', recorded_at: '2026-11-15' } });
  await call('/api/v1/rank-history', { method: 'POST', body: { mode: '2v2', rank_label: 'gold', recorded_at: '2026-10-01' } });
  await call('/api/v1/rank-history', { method: 'POST', body: { mode: '2v2', rank_label: 'champion', recorded_at: '2026-11-10' } });
  const fromHistory = await proposal();
  const snap = fromHistory.body.data.profile_snapshot;
  assert.equal(fromHistory.status, 200); assert.equal(fromHistory.body.meta.rank_origin, 'rank_history');
  assert.equal(snap.rank, 'champion'); assert.equal(snap.rank_mode, '2v2'); assert.equal(snap.rank_source, 'self_reported');
  assert.deepEqual(snap.rank_record, { rank_id: '3', recorded_at: '2026-11-10T12:00:00.000Z' });
  assert.equal(fromHistory.body.data.exercises[2].exercise_snapshot.selected_variant.variant_key, 'normal-distance');

  const fromRequest = await proposal({ rank: 'gold' });
  assert.equal(fromRequest.body.meta.rank_origin, 'request'); assert.equal(fromRequest.body.data.profile_snapshot.rank_record, null);
  const without = await proposal({ rank: null });
  assert.equal(without.body.meta.rank_origin, 'none'); assert.equal(without.body.data.profile_snapshot.rank, null);
});

test('Rango de otro usuario no entra en la propuesta', async () => {
  db.state.ranks.push({ id_rango: '9', id_usuario: B, modalidad: '2v2', temporada: 'x', rango: 'champion', division: null,
    fecha_registro: '2026-11-01T12:00:00.000Z', fuente: 'self_reported' });
  const r = await proposal();
  assert.equal(r.body.meta.rank_origin, 'none');
});
