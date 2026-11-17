'use strict';

// A32 · Prueba real contra Supabase dev del CRUD administrativo del catálogo.
//
// Requisitos: .env con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY, y ya ejecutadas en el SQL Editor
// las seeds a23/a24 y las migraciones a24-planes, a16-fix-cardinalidad y a32-catalogo-admin.
//
// Uso (desde la raíz del repo):
//   node --env-file=.env scripts/prueba-a32.cjs
//
// Crea un ejercicio de prueba (borrador) y lo borra al final. Desactiva y reactiva el ejercicio
// real 2 (Mid Height Shots) para comprobar la salida/entrada en el catálogo del jugador; al terminar
// se deja como estaba. Para "usado en planes" guarda un plan sintético con a24_guardar_plan.
// Recorre los mismos repositorios que las rutas; la sesión HTTP real no se prueba aquí.

const crypto = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { createServerClient } = require('../src/services/supabase');
const blocks = require('../src/repositories/blocks');
const admin = require('../src/repositories/exercises-admin');
const { getCatalog } = require('../src/repositories/catalog');
const { parseCreate, parseEdit } = require('../src/domain/exercise-admin');
const { RULES_CONFIG } = require('../src/domain/rules-config');

const results = [];
const check = (name, expected, ok, obtained) => results.push({ name, expected, obtained: String(obtained), ok: Boolean(ok) });
const attempt = async fn => { try { await fn(); return 'sin error'; } catch (err) { return `${err.status} ${err.code}`; } };
const hash = () => crypto.randomBytes(32).toString('hex');
const REAL_ID = '2';

const FICHA = { title: 'Prueba A32 recuperaciones', priority_key: 'movement', resource_type: 'custom_training',
  resource: 'ABCD-1234-ABCD-1234', purpose: 'Ficha de prueba de A32; se borra al terminar.',
  instructions: ['Abrir el paquete.', 'Repetir cada tiro.'], success_criterion: 'Completar el recorrido.',
  difficulty_base: 2, reference_duration_minutes: 10, platforms: ['epic', 'steam'] };

function syntheticReplay(position, fileHash) {
  return {
    position, file_name: `a32-prueba-${position}.replay`, status: 'ok', upload_origin: 'own', visibility: 'private',
    access_verified: true, group_verified: true,
    file: { hash: fileHash, size_bytes: 100000 + position, mode: '2v2', match_type: 'ranked', played_at: `2026-11-16T1${position}:00:00Z`, duration_s: 300 },
    player: { platform: 'steam', player_id: 'TEST_A', time_played_s: 295 },
    metrics: { shots: 4, goals: position === 1 ? 2 : 1, assists: 0, saves: 0, score: 100 },
  };
}

async function cleanup(supabase, { exerciseId, blockId, hashes, realActive }) {
  if (blockId) {
    const { data: a } = await supabase.from('analisis').select('id_analisis').eq('id_bloque', Number(blockId));
    const ids = (a ?? []).map(r => r.id_analisis);
    if (ids.length) {
      const { data: p } = await supabase.from('planes').select('id_plan').in('id_analisis', ids);
      const planIds = (p ?? []).map(r => r.id_plan);
      if (planIds.length) {
        await supabase.from('plan_ejercicio').delete().in('id_plan', planIds);
        await supabase.from('planes').delete().in('id_plan', planIds);
      }
      await supabase.from('prioridades').delete().in('id_analisis', ids);
      await supabase.from('analisis').delete().in('id_analisis', ids);
    }
    const { data: reps } = await supabase.from('replays').select('id_jugador_replay').eq('id_bloque', Number(blockId));
    await supabase.from('replays').delete().eq('id_bloque', Number(blockId));
    await supabase.from('bloques').delete().eq('id_bloque', Number(blockId));
    const playerIds = (reps ?? []).map(r => r.id_jugador_replay);
    if (playerIds.length) await supabase.from('metricas_replay').delete().in('id_jugador_replay', playerIds);
  }
  const { data: files } = await supabase.from('archivos_replay').select('id_archivo').in('hash_archivo', hashes);
  const fileIds = (files ?? []).map(f => f.id_archivo);
  if (fileIds.length) {
    await supabase.from('jugadores_replay').delete().in('id_archivo', fileIds);
    await supabase.from('archivos_replay').delete().in('id_archivo', fileIds);
  }
  if (exerciseId) {
    const { data: versions } = await supabase.from('ejercicio_versiones').select('id_ejercicio_version').eq('id_ejercicio', Number(exerciseId));
    const versionIds = (versions ?? []).map(v => v.id_ejercicio_version);
    if (versionIds.length) {
      await supabase.from('ejercicio_plataforma').delete().in('id_ejercicio_version', versionIds);
      await supabase.from('ejercicio_versiones').delete().in('id_ejercicio_version', versionIds);
    }
    await supabase.from('ejercicios').delete().eq('id_ejercicio', Number(exerciseId));
  }
  // El ejercicio real vuelve al estado que tenía al empezar.
  if (realActive !== undefined) await supabase.from('ejercicios').update({ activo: realActive }).eq('id_ejercicio', Number(REAL_ID));
}

async function main() {
  const supabase = createServerClient();
  if (!supabase) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.');
  const { data: profileA } = await supabase.from('perfiles').select('id_usuario').eq('cuenta_juego_id', 'TEST_A').single();
  const hashes = [hash(), hash(), hash(), hash(), hash()];
  const created = { exerciseId: null, blockId: null, hashes, realActive: undefined };
  const playerIds = async () => (await getCatalog(supabase)).exercises.map(e => e.exercise_id);

  try {
    const real = await admin.getExercise(supabase, REAL_ID);
    created.realActive = real?.active;
    check('Ejercicio real 2 de partida', 'activo y revisado', real?.active === true && real.technical_review_status === 'verified', `${real?.active ? 'activo' : 'inactivo'}, ${real?.technical_review_status}`);

    // 1) Alta: borrador inactivo; no se puede activar sin revisión.
    const v1 = await admin.saveExercise(supabase, null, parseCreate(FICHA));
    created.exerciseId = v1.exercise_id;
    check('Crear ejercicio', 'versión 1, inactivo, sin revisión', v1.version === 1 && v1.active === false && v1.technical_review_status === 'not_in_reviewed_content',
      `versión ${v1.version}, ${v1.active ? 'activo' : 'inactivo'}, ${v1.technical_review_status}`);
    const activate = await attempt(() => admin.setActive(supabase, v1.exercise_id, true));
    check('Activar sin revisión', '409 EXERCISE_NOT_VERIFIED', activate === '409 EXERCISE_NOT_VERIFIED', activate);
    check('El jugador no lo recibe', 'fuera del catálogo activo', !(await playerIds()).includes(v1.exercise_id), 'fuera');

    // 2) Editar: versión 2; la 1 intacta; versiones no editables en la base.
    const edit = parseEdit({ reference_duration_minutes: 15 }, v1.ficha);
    const v2 = await admin.saveExercise(supabase, v1.exercise_id, edit.ficha);
    check('Editar crea versión 2', 'versión 2, 15 min, otra fila', v2.version === 2 && v2.ficha.reference_duration_minutes === 15 && v2.exercise_version_id !== v1.exercise_version_id,
      `versión ${v2.version}, ${v2.ficha.reference_duration_minutes} min, fila ${v2.exercise_version_id}`);
    check('Versión 1 intacta', 'idéntica', isDeepStrictEqual(v2.versions[0], v1.versions[0]), isDeepStrictEqual(v2.versions[0], v1.versions[0]) ? 'idéntica' : 'cambió');
    const { error: upd } = await supabase.from('ejercicio_versiones').update({ minutos_base: 99 }).eq('id_ejercicio_version', Number(v1.exercise_version_id));
    check('UPDATE de una versión', 'rechazado (55000)', upd?.code === '55000', upd?.code ?? 'sin error');

    // 3) Desactivar / reactivar el ejercicio real 2 (revisado).
    await admin.setActive(supabase, REAL_ID, false);
    const offIds = await playerIds();
    await admin.setActive(supabase, REAL_ID, true);
    const onIds = await playerIds();
    check('Desactivar y reactivar el ejercicio 2', 'sale del catálogo y vuelve', !offIds.includes(REAL_ID) && onIds.includes(REAL_ID),
      `${offIds.includes(REAL_ID) ? 'sigue' : 'sale'} / ${onIds.includes(REAL_ID) ? 'vuelve' : 'no vuelve'}`);

    // 4) Usado en un plan: DELETE solo desactiva y el plan conserva la versión.
    const block = await blocks.createBlock(supabase, profileA.id_usuario, { mode: '2v2', match_type: 'ranked', status: 'ready',
      replays: hashes.map((h, i) => syntheticReplay(i + 1, h)) });
    created.blockId = block.block_id;
    const { data: savedPlan, error: planError } = await supabase.rpc('a24_guardar_plan', {
      p_id_usuario: profileA.id_usuario, p_id_bloque: Number(block.block_id),
      p_analisis: { rules_version: RULES_CONFIG.rules_version, explicacion: 'Plan sintético de A32.',
        prioridades: [{ rule_id: 'finalizacion-eficiencia', orden: 1, valor_actual: 30, valor_base: null, evidencia: '{"prueba":"A32"}' }] },
      p_plan: { estado: 'completo', plataforma_destino: 'steam', minutos_disponibles: 15, dias_disponibles: 3, sesiones_semana: 3,
        justificacion: 'Plan sintético de A32.', contexto: { prueba: 'A32' },
        ejercicios: [{ orden: 1, rule_id: 'finalizacion-eficiencia', id_ejercicio_version: Number(v2.exercise_version_id), minutos: 15, dificultad: 2 }],
        objetivos: [] },
    });
    check('Plan sintético con el ejercicio de prueba', 'guardado', !planError && savedPlan?.id_plan, planError ? planError.code : `plan ${savedPlan.id_plan}`);
    const effect = await admin.deleteExercise(supabase, v1.exercise_id);
    const afterDelete = await admin.getExercise(supabase, v1.exercise_id);
    // Es borrador (inactivo): usado en un plan, DELETE lo conserva sin eliminarlo.
    check('Borrar ejercicio usado (inactivo)', 'already_inactive, no se elimina, 2 versiones', effect === 'already_inactive' && afterDelete?.versions.length === 2,
      `${effect}, ${afterDelete?.versions.length} versiones`);
    const { data: pe } = await supabase.from('plan_ejercicio').select('id_ejercicio_version, minutos').eq('id_plan', savedPlan.id_plan);
    check('El plan conserva la versión exacta', `versión ${v2.exercise_version_id}, 15 min`, String(pe?.[0]?.id_ejercicio_version) === v2.exercise_version_id && pe[0].minutos === 15,
      pe?.[0] ? `versión ${pe[0].id_ejercicio_version}, ${pe[0].minutos} min` : 'sin filas');

    // 5) Sin uso: DELETE lo elimina del catálogo.
    await cleanup(supabase, { blockId: created.blockId, hashes });
    created.blockId = null;
    const deleted = await admin.deleteExercise(supabase, v1.exercise_id);
    const gone = await admin.getExercise(supabase, v1.exercise_id);
    check('Borrar ejercicio sin uso', 'deleted y ya no aparece', deleted === 'deleted' && gone === null, `${deleted}, ${gone === null ? 'no aparece' : 'aparece'}`);
  } finally {
    await cleanup(supabase, created);
    console.log('\nDatos de prueba borrados; el ejercicio 2 quedó como estaba.');
  }

  const final = await admin.getExercise(supabase, REAL_ID);
  check('Ejercicio real 2 al terminar', 'activo y revisado', final?.active === true && final.technical_review_status === 'verified', `${final?.active ? 'activo' : 'inactivo'}, ${final?.technical_review_status}`);
  console.log('\n| # | Prueba | Esperado | Obtenido | OK |\n| --- | --- | --- | --- | --- |');
  results.forEach((r, i) => console.log(`| ${i + 1} | ${r.name} | ${r.expected} | ${r.obtained} | ${r.ok ? 'Sí' : 'NO'} |`));
  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed}/${results.length} comprobaciones correctas.`);
  process.exitCode = passed === results.length ? 0 : 1;
}

main().catch(err => { console.error('Error:', err.message); process.exitCode = 1; });
