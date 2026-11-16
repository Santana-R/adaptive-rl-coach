const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { toBlock } = require('../src/repositories/blocks');
const { fromStoredBlock } = require('../src/services/stored-block');
const { analyzeBlock } = require('../src/services/analysis');
const { storedDatabase, blockRow, A, B } = require('./helpers/stored-database.cjs');

test('A15 → motor recalcula los cinco replays sin usar agregados guardados ni atribuir duración', () => {
  const row = blockRow(), before = structuredClone(row);
  const a = analyzeBlock({ current: fromStoredBlock(toBlock(row), A) }).data;
  assert.equal(a.metrics.values.goals.value, 6); assert.equal(a.metrics.values.shots.value, 20);
  assert.equal(a.metrics.values.shooting_pct.value, 30); assert.equal(a.metrics.values.play_duration_s.value, null);
  assert.equal(a.metrics.values.play_duration_s.coverage, 0); assert.equal(a.source, 'stored_replay_metrics');
  assert.equal(a.priorities.length, 1); assert.ok(a.limitations.includes('stored_duration_basis_unverified'));
  assert.deepEqual(row, before);
});

for (const [name, change, reason] of [
  ['menos de cinco', r => r.replays.pop(), 'REPLAY_COUNT_INVALID'],
  ['identidad distinta', r => { r.replays[0].jugadores_replay.cuenta_jugador = 'OTHER'; }, 'PLAYER_MISMATCH'],
  ['modalidad distinta', r => { r.replays[0].jugadores_replay.archivos_replay.modalidad = '3v3'; }, 'MODE_MISMATCH'],
  ['tipo distinto', r => { r.replays[0].jugadores_replay.archivos_replay.tipo_partida = 'casual'; }, 'MATCH_TYPE_MISMATCH'],
  ['replay no listo', r => { r.replays[0].estado = 'pending'; }, 'BLOCK_NOT_READY'],
  ['posición repetida', r => { r.replays[0].posicion = 2; }, 'REPLAY_POSITION_INVALID'],
  ['id repetido', r => { r.replays[0].ballchasing_id = r.replays[1].ballchasing_id; }, 'DUPLICATE_REPLAY'],
  ['hash repetido', r => { r.replays[0].jugadores_replay.archivos_replay.hash_archivo = r.replays[1].jugadores_replay.archivos_replay.hash_archivo; }, 'DUPLICATE_REPLAY'],
]) test('Adaptador rechaza ' + name, () => {
  const row = blockRow(); change(row); const r = analyzeBlock({ current: fromStoredBlock(toBlock(row), A) });
  assert.equal(r.valid, false); assert.ok(r.reason_codes.includes(reason));
});

test('Hash identifica sin ID externo; fecha faltante no usa la subida y conserva las métricas', () => {
  const row = blockRow(); row.replays[0].ballchasing_id = null; row.replays[0].jugadores_replay.archivos_replay.fecha_partida = null;
  const a = analyzeBlock({ current: fromStoredBlock(toBlock(row), A) }).data;
  assert.match(a.block.replay_ids[0], /^sha256:/); assert.equal(a.block.first_match_at, null);
  assert.equal(a.metrics.values.shooting_pct.value, 30);
});

test('Faltantes SQL conservan cobertura, sin rellenar con el agregado persistido', () => {
  const row = blockRow(); row.replays[0].jugadores_replay.metricas_replay.tiros = null;
  const a = analyzeBlock({ current: fromStoredBlock(toBlock(row), A) }).data;
  assert.equal(a.metrics.values.shots.value, null); assert.equal(a.metrics.values.shots.coverage, 4); assert.equal(a.priorities.length, 0);
});

test('Hash compartido entre bloques impide comparar aunque cambie el ID externo', () => {
  const current = blockRow(), baseline = blockRow('10', A, { date: '2026-11-10', goals: 5 });
  current.replays[0].jugadores_replay.archivos_replay.hash_archivo = baseline.replays[0].jugadores_replay.archivos_replay.hash_archivo;
  const a = analyzeBlock({ current: fromStoredBlock(toBlock(current), A), baseline: fromStoredBlock(toBlock(baseline), A) }).data;
  assert.equal(a.comparison.status, 'not_comparable'); assert.ok(a.comparison.reason_codes.includes('SHARED_REPLAYS'));
});

let db, server, base;
test.before(async () => {
  db = storedDatabase(); const app = createApp({ supabase: db });
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => new Promise(resolve => server.close(resolve)));
async function request({ body = {}, token = 'token-a', block = '11', analysis = false } = {}) {
  const res = await fetch(`${base}/api/v1/blocks/${block}/${analysis ? 'analysis' : 'plan-proposal'}`, {
    method: analysis ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    ...(analysis ? {} : { body: JSON.stringify(body) }),
  });
  return { status: res.status, body: await res.json(), cache: res.headers.get('cache-control') };
}

test('Ruta consulta perfil/catálogo propios y entrega propuesta con instrucciones, recursos e IDs de versiones', async () => {
  const r = await request(), p = r.body.data;
  assert.equal(r.status, 200); assert.equal(r.body.meta.persisted, false); assert.equal(r.body.meta.catalog_source, 'database');
  assert.equal(p.plan_id, null); assert.equal(p.plan_version_id, null); assert.equal(p.coverage, 'complete');
  assert.deepEqual(p.exercises.map(e => e.assigned_minutes), [15, 5]);
  assert.ok(p.exercises.every(e => e.exercise_version_id && e.exercise_snapshot.instructions.length));
  assert.equal(r.cache, 'no-store');
});

test('Steam con Workshop declarado → 10 + 5 + 5, variante según rango de la modalidad', async () => {
  const r = await request({ body: { availability_minutes: 20, workshop_access: true, rank: 'champion' } });
  assert.equal(r.status, 200); assert.deepEqual(r.body.data.exercises.map(e => e.assigned_minutes), [10, 5, 5]);
  assert.equal(r.body.data.exercises[2].exercise_snapshot.selected_variant.variant_key, 'normal-distance');
  assert.equal(r.body.data.profile_snapshot.rank_mode, '2v2');
});

test('GET de A19 ya usa A15 por defecto y compara 25 → 30 = +5 pp', async () => {
  const r = await request({ analysis: true });
  assert.equal(r.status, 200); assert.equal(r.body.data.comparison.deltas.shooting_pct.delta, 5);
  assert.equal(r.body.meta.source, 'stored_replay_metrics');
  assert.equal(r.body.meta.synthetic, null);
});

test('La modalidad del bloque prevalece sobre la principal del perfil', async () => {
  const row = db.state.rows[1]; row.modalidad = '3v3';
  row.replays.forEach(r => { r.jugadores_replay.archivos_replay.modalidad = '3v3'; });
  try {
    const r = await request({ body: { rank: 'diamond', workshop_access: true } });
    assert.equal(r.status, 200); assert.equal(r.body.data.profile_snapshot.mode, '3v3');
    assert.equal(r.body.data.profile_snapshot.rank_mode, '3v3');
  } finally { row.modalidad = '2v2'; row.replays.forEach(r => { r.jugadores_replay.archivos_replay.modalidad = '2v2'; }); }
});

test('Sin prioridad respaldada el endpoint devuelve una propuesta vacía', async () => {
  const replay = db.state.rows[1].replays[0].jugadores_replay.metricas_replay;
  const before = replay.goles; replay.goles = 4;
  try {
    const r = await request(); assert.equal(r.status, 200); assert.deepEqual(r.body.data.exercises, []);
    assert.ok(r.body.data.reason_codes.includes('NO_PRIORITIES'));
  } finally { replay.goles = before; }
});

test('Catálogo parcial/vacío devuelve cobertura y motivos, sin forzar ejercicios', async () => {
  const original = structuredClone(db.state.catalog);
  try {
    db.state.catalog[1].activo = false;
    let r = await request(); assert.equal(r.body.data.coverage, 'partial'); assert.equal(r.body.data.exercises.length, 1);
    db.state.catalog.forEach(e => { e.activo = false; });
    r = await request(); assert.equal(r.body.data.coverage, 'empty');
    assert.ok(r.body.data.reason_codes.includes('NO_VERIFIED_ACTIVE_EXERCISE'));
  } finally { db.state.catalog = original; }
});

test('Cambiar minutos no reescribe la propuesta anterior; cero minutos explica el vacío', async () => {
  const first = (await request()).body.data, snapshot = structuredClone(first);
  assert.equal((await request({ body: { availability_minutes: 40 } })).body.data.assigned_minutes, 40);
  assert.deepEqual(first, snapshot);
  const zero = await request({ body: { availability_minutes: 0 } });
  assert.equal(zero.body.data.assigned_minutes, 0); assert.ok(zero.body.data.reason_codes.includes('INSUFFICIENT_TIME'));
});

test('Sesión, suspensión, propiedad y estado se comprueban antes de generar', async () => {
  assert.equal((await request({ token: null })).status, 401); assert.equal((await request({ token: 'token-suspended' })).status, 403);
  const missing = await request({ block: '999' }), foreign = await request({ block: '20' });
  assert.equal(foreign.status, 404); assert.deepEqual(foreign.body, missing.body);
  assert.equal((await request({ token: 'token-admin' })).status, 404); assert.equal((await request({ token: 'token-b', block: '20' })).status, 200);
  db.state.rows[1].estado = 'procesando';
  try { assert.equal((await request()).status, 409); } finally { db.state.rows[1].estado = 'completo'; }
});

test('Listo pero inválido produce 422 tanto en Análisis como en propuesta', async () => {
  const last = db.state.rows[1].replays.pop();
  try { assert.equal((await request()).status, 422); assert.equal((await request({ analysis: true })).status, 422); }
  finally { db.state.rows[1].replays.push(last); }
});

test('Perfil ausente o de otra identidad impide generar', async () => {
  const p = db.state.profiles.get(A); db.state.profiles.delete(A);
  try { assert.equal((await request()).body.error.code, 'PROFILE_REQUIRED'); } finally { db.state.profiles.set(A, p); }
  p.cuenta_juego_id = 'OTHER';
  try { assert.equal((await request()).body.error.code, 'PROFILE_MISMATCH'); } finally { p.cuenta_juego_id = 'TEST_PLAYER_A'; }
});

for (const body of [{ availability_minutes: -1 }, { availability_minutes: '20' }, { availability_minutes: 1.2 }, { workshop_access: 'true' },
  { rank: 'made-up' }, { coco_variant_key: 'made-up' }, { version: 99 }, { user_id: B }, { analysis: {} }, { catalog: {} },
  { goal_ids: ['1', '1'] }, { goal_ids: [1] }, { goal_ids: null }]) test('Rechaza entrada inválida ' + JSON.stringify(body), async () => {
  assert.equal((await request({ body })).status, 400);
});

test('Fallo del catálogo responde sin detalles privados', async () => {
  db.state.fail = 'ejercicios';
  try { const r = await request(); assert.equal(r.status, 503); assert.ok(!JSON.stringify(r.body).includes('private database error')); }
  finally { db.state.fail = null; }
});

test('Metas propias: versión activada más reciente, aislamiento y snapshots independientes', async () => {
  const version = n => ({ id_objetivo_version: String(n + 10), version: n, comparador: '>=', valor_meta: '50.0000',
    activada_en: n === 3 ? null : '2026-11-16T12:00:00Z', metricas: { codigo: 'shooting_pct', unidad: 'percent' } });
  db.state.goals = [{ id_objetivo: '1', id_usuario: A, modalidad: '2v2', estado: 'activo', archivado_en: null, objetivo_versiones: [version(1), version(3), version(2)] }];
  try {
    const r = await request({ body: { goal_ids: ['1'] } }); assert.equal(r.status, 200);
    assert.equal(r.body.data.goals_snapshot[0].version, 2); assert.equal(r.body.data.goals_snapshot[0].goal_version_id, '12');
    assert.equal((await request({ token: 'token-b', block: '20', body: { goal_ids: ['1'] } })).status, 404);
    db.state.goals[0].objetivo_versiones[2].valor_meta = 60; assert.equal(r.body.data.goals_snapshot[0].target_value, 50);
    db.state.goals[0].objetivo_versiones[2].metricas.codigo = 'boost'; assert.equal((await request({ body: { goal_ids: ['1'] } })).status, 422);
  } finally { db.state.goals = []; }
});
