'use strict';

// A15 · Prueba real contra el proyecto Supabase de desarrollo (y seed de ejemplo).
//
// Requisitos: .env con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY, y la migración
// database/migraciones/a15-guardar-bloque.sql ya ejecutada.
//
// Uso (desde la raíz del repo):
//   node --env-file=.env scripts/prueba-a15.cjs              → prueba y borra lo creado
//   node --env-file=.env scripts/prueba-a15.cjs --conservar  → deja el bloque de ejemplo (seed)
//
// Pide los correos de dos jugadores de prueba (A y B) y no los imprime.
// Todos los datos del bloque son sintéticos: hashes aleatorios, cuenta TEST_A15.

const crypto = require('node:crypto');
const readline = require('node:readline/promises');
const { createServerClient } = require('../src/services/supabase');
const profiles = require('../src/repositories/profile');
const blocks = require('../src/repositories/blocks');

const KEEP = process.argv.includes('--conservar');
const results = [];

function check(name, expected, ok, obtained) {
  results.push({ name, expected, obtained: String(obtained), ok });
}

const hash = () => crypto.randomBytes(32).toString('hex');

function syntheticReplay(position, fileHash, metrics) {
  return {
    position,
    file_name: `a15-prueba-${position}.replay`,
    status: 'ok',
    upload_origin: 'own',
    visibility: 'private',
    access_verified: true,
    group_verified: true,
    file: { hash: fileHash, size_bytes: 100000 + position, mode: '2v2', match_type: 'ranked', played_at: `2026-11-15T1${position}:00:00Z`, duration_s: 300 },
    player: { platform: 'steam', player_id: 'TEST_A15', time_played_s: 295.5 },
    metrics,
  };
}

async function findUserId(supabase, email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error('No se pudieron listar usuarios de Auth.');
    const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (user) return user.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function count(supabase, table) {
  const { count: n, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(`No se pudo contar ${table}.`);
  return n;
}

async function cleanup(supabase, blockIds, fileHashes) {
  const ids = blockIds.filter(Boolean).map(Number);
  if (ids.length) {
    const { data: reps } = await supabase.from('replays').select('id_jugador_replay').in('id_bloque', ids);
    const playerIds = (reps ?? []).map(r => r.id_jugador_replay);
    await supabase.from('metricas_bloque').delete().in('id_bloque', ids);
    await supabase.from('replays').delete().in('id_bloque', ids);
    await supabase.from('bloques').delete().in('id_bloque', ids);
    if (playerIds.length) await supabase.from('metricas_replay').delete().in('id_jugador_replay', playerIds);
  }
  const { data: files } = await supabase.from('archivos_replay').select('id_archivo').in('hash_archivo', fileHashes);
  const fileIds = (files ?? []).map(f => f.id_archivo);
  if (fileIds.length) {
    const { data: players } = await supabase.from('jugadores_replay').select('id_jugador_replay').in('id_archivo', fileIds);
    const pIds = (players ?? []).map(p => p.id_jugador_replay);
    if (pIds.length) await supabase.from('metricas_replay').delete().in('id_jugador_replay', pIds);
    await supabase.from('jugadores_replay').delete().in('id_archivo', fileIds);
    await supabase.from('archivos_replay').delete().in('id_archivo', fileIds);
  }
}

async function main() {
  const supabase = createServerClient();
  if (!supabase) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const emailA = (await rl.question('Correo del jugador A: ')).trim();
  const emailB = (await rl.question('Correo del jugador B: ')).trim();
  rl.close();

  const A = await findUserId(supabase, emailA);
  const B = await findUserId(supabase, emailB);
  if (!A || !B) throw new Error('No se encontró alguno de los dos correos en Auth.');

  const hashes = [hash(), hash(), hash(), hash(), hash()];
  const created = [];

  try {
    // 1-2) Perfil: leer y volver a guardar los mismos datos (no altera la cuenta).
    const original = await profiles.getProfile(supabase, A);
    check('Leer perfil propio', 'perfil o null', true, original ? 'perfil' : 'null');
    if (original) {
      const saved = await profiles.saveProfile(supabase, A, { ...original, id: B });
      check('Guardar perfil ignora id enviado', `id = A, mismos datos`, saved.id === A && saved.player_id === original.player_id, saved.id === A ? 'id = A' : 'id distinto');
    }

    // 3) Crear bloque completo con métricas por replay (con null) y de bloque.
    const replays = hashes.map((h, i) => syntheticReplay(i + 1, h, {
      shots: i + 2, goals: i % 2, assists: 0, saves: 1, score: 100 * (i + 1),
      boost_zero_s: i === 0 ? null : 10.5, boost_low_s: i === 0 ? null : 30.25,
    }));
    const totalShots = replays.reduce((s, r) => s + r.metrics.shots, 0);
    const totalGoals = replays.reduce((s, r) => s + r.metrics.goals, 0);
    const block = await blocks.createBlock(supabase, A, {
      user_id: B, mode: '2v2', match_type: 'ranked', status: 'processing', replays,
      metrics: { metrics_version: 'mvp.metrics.v1', play_duration_s: 1500, shots: totalShots, goals: totalGoals },
    });
    created.push(block?.block_id);
    check('Crear bloque con 5 replays', '5 replays, processing', block?.replays.length === 5 && block.status === 'processing', `${block?.replays.length} replays, ${block?.status}`);

    // 4) Null conservado y valores intactos.
    const r1 = block.replays[0];
    check('Null conservado', 'boost_zero_s = null en replay 1', r1.metrics.boost_zero_s === null && r1.metrics.shots === 2, `boost_zero_s = ${r1.metrics.boost_zero_s}, shots = ${r1.metrics.shots}`);
    check('Métricas de bloque', `tiros ${totalShots}, otras null`, block.metrics.shots === totalShots && block.metrics.avg_speed === null, `tiros ${block.metrics.shots}, avg_speed ${block.metrics.avg_speed}`);

    // 5) Propietario: B no ve el bloque de A.
    const foreign = await blocks.getBlock(supabase, B, block.block_id);
    check('B pide el bloque de A', 'null (404)', foreign === null, foreign === null ? 'null' : 'devuelve el bloque');
    const listB = await blocks.listBlocks(supabase, B);
    check('Lista de B', 'no incluye el bloque de A', !listB.some(b => b.block_id === block.block_id), listB.some(b => b.block_id === block.block_id) ? 'lo incluye' : 'no lo incluye');

    // 6) Sin duplicados: un segundo bloque reutiliza un archivo ya guardado.
    const filesBefore = await count(supabase, 'archivos_replay');
    const block2 = await blocks.createBlock(supabase, A, { mode: '2v2', match_type: 'ranked', status: 'pending', replays: [syntheticReplay(1, hashes[0], null)] });
    created.push(block2?.block_id);
    const filesAfter = await count(supabase, 'archivos_replay');
    check('Mismo archivo en otro bloque', 'no crea otro archivo', filesAfter === filesBefore, `archivos ${filesBefore} → ${filesAfter}`);

    // 7) Atomicidad: el mismo replay dos veces en un bloque falla y no deja nada a medias.
    const blocksBefore = await count(supabase, 'bloques');
    let dupCode = 'sin error';
    try {
      await blocks.createBlock(supabase, A, { mode: '2v2', match_type: 'ranked', status: 'pending', replays: [syntheticReplay(1, hashes[1], null), syntheticReplay(2, hashes[1], null)] });
    } catch (err) { dupCode = `${err.status} ${err.code}`; }
    const blocksAfter = await count(supabase, 'bloques');
    check('Replay repetido en un bloque', '409 DUPLICATE_REPLAY', dupCode === '409 DUPLICATE_REPLAY', dupCode);
    check('Sin datos a medias tras el error', 'bloques sin cambio', blocksAfter === blocksBefore, `bloques ${blocksBefore} → ${blocksAfter}`);

    // 8) Estados: ready fija completado_en.
    const ready = await blocks.updateBlockStatus(supabase, A, block.block_id, 'ready');
    check('Marcar bloque como ready', 'ready con completed_at', ready.status === 'ready' && !!ready.completed_at, `${ready.status}, completed_at ${ready.completed_at ? 'sí' : 'no'}`);
    let foreignUpdate = 'sin error';
    try { await blocks.updateBlockStatus(supabase, B, block.block_id, 'invalid'); } catch (err) { foreignUpdate = `${err.status} ${err.code}`; }
    check('B cambia el estado del bloque de A', '404 RESOURCE_NOT_FOUND', foreignUpdate === '404 RESOURCE_NOT_FOUND', foreignUpdate);

    // 9) Reemplazar métricas no duplica filas.
    await blocks.saveReplayMetrics(supabase, A, block.block_id, 1, { ...replays[0].metrics, shots: 2 });
    const reread = await blocks.saveBlockMetrics(supabase, A, block.block_id, { metrics_version: 'mvp.metrics.v1', play_duration_s: 1500, shots: totalShots, goals: totalGoals });
    const { count: mbRows } = await supabase.from('metricas_bloque').select('*', { count: 'exact', head: true }).eq('id_bloque', Number(block.block_id));
    check('Volver a guardar métricas', '1 fila por bloque', mbRows === 1 && reread.metrics.shots === totalShots, `${mbRows} fila(s)`);
  } finally {
    if (KEEP) {
      // Se conserva el primer bloque como ejemplo; se borran los auxiliares.
      await cleanup(supabase, created.slice(1), []);
      console.log(`\nBloque de ejemplo conservado (id ${created[0]}).`);
    } else {
      await cleanup(supabase, created, hashes);
      console.log('\nDatos de prueba borrados.');
    }
  }

  console.log('\n| # | Prueba | Esperado | Obtenido | OK |\n| --- | --- | --- | --- | --- |');
  results.forEach((r, i) => console.log(`| ${i + 1} | ${r.name} | ${r.expected} | ${r.obtained} | ${r.ok ? 'Sí' : 'NO'} |`));
  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed} de ${results.length} casos correctos.`);
  process.exitCode = passed === results.length ? 0 : 1;
}

main().catch(err => {
  console.error(`Error: ${err.message}`);
  process.exitCode = 1;
});
