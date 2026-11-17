'use strict';

// A24 · Prueba real contra Supabase dev: guardar versiones del plan y recuperar la anterior intacta.
//
// Requisitos: .env con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY, y ya ejecutados en el SQL Editor:
//   database/seeds/a23-catalogo.sql, database/seeds/a24-reglas.sql,
//   database/seeds/a26-reglas-v4.sql y database/migraciones/a24-planes.sql
//
// Uso (desde la raíz del repo):
//   node --env-file=.env scripts/prueba-a24.cjs              → prueba y borra lo creado
//   node --env-file=.env scripts/prueba-a24.cjs --conservar  → deja el bloque y sus dos versiones
//
// Usa los perfiles de desarrollo TEST_A (steam, 2v2) y TEST_B. El bloque es sintético (hashes
// aleatorios, 6 goles en 20 tiros). Recorre el mismo código que las rutas: repositorio A15 →
// análisis → generatePlan → a24_guardar_plan → lectura. La sesión HTTP real no se prueba aquí.

const crypto = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { createServerClient } = require('../src/services/supabase');
const blocks = require('../src/repositories/blocks');
const plans = require('../src/repositories/plans');
const { buildProposal } = require('../src/routes/plans');
const { createStoredAnalysisRepository } = require('../src/services/stored-block');
const { RULES_CONFIG } = require('../src/domain/rules-config');
// Reglas por conjunto: las claves con rule_id de rules-config.js (v3/v4 = finalización, boost, defensiva; v4 usa alias SQL para tasa).
const RULE_COUNT = Object.values(RULES_CONFIG).filter(value => value && typeof value === 'object' && value.rule_id).length;

const KEEP = process.argv.includes('--conservar');
const results = [];
const check = (name, expected, ok, obtained) => results.push({ name, expected, obtained: String(obtained), ok: Boolean(ok) });
const hash = () => crypto.randomBytes(32).toString('hex');

function syntheticReplay(position, fileHash, goals) {
  return {
    position, file_name: `a24-prueba-${position}.replay`, status: 'ok', upload_origin: 'own', visibility: 'private',
    access_verified: true, group_verified: true,
    file: { hash: fileHash, size_bytes: 100000 + position, mode: '2v2', match_type: 'ranked',
      played_at: `2026-11-16T1${position}:00:00Z`, duration_s: 300 },
    player: { platform: 'steam', player_id: 'TEST_A', time_played_s: 295 },
    metrics: { shots: 4, goals, assists: 0, saves: 0, score: 100 },
  };
}

async function userByAccount(supabase, account) {
  const { data, error } = await supabase.from('perfiles').select('id_usuario').eq('cuenta_juego_id', account).maybeSingle();
  if (error || !data) throw new Error(`No existe el perfil de desarrollo ${account}.`);
  return data.id_usuario;
}

async function cleanup(supabase, blockId, hashes) {
  if (blockId) {
    const { data: a } = await supabase.from('analisis').select('id_analisis').eq('id_bloque', Number(blockId));
    const analysisIds = (a ?? []).map(r => r.id_analisis);
    if (analysisIds.length) {
      const { data: p } = await supabase.from('planes').select('id_plan').in('id_analisis', analysisIds);
      const planIds = (p ?? []).map(r => r.id_plan);
      if (planIds.length) {
        await supabase.from('sesiones').delete().in('id_plan', planIds);
        await supabase.from('plan_objetivo').delete().in('id_plan', planIds);
        await supabase.from('plan_ejercicio').delete().in('id_plan', planIds);
        await supabase.from('planes').delete().in('id_plan', planIds);
      }
      await supabase.from('prioridades').delete().in('id_analisis', analysisIds);
      await supabase.from('analisis').delete().in('id_analisis', analysisIds);
    }
    const { data: reps } = await supabase.from('replays').select('id_jugador_replay').eq('id_bloque', Number(blockId));
    const playerIds = (reps ?? []).map(r => r.id_jugador_replay);
    await supabase.from('metricas_bloque').delete().eq('id_bloque', Number(blockId));
    await supabase.from('replays').delete().eq('id_bloque', Number(blockId));
    await supabase.from('bloques').delete().eq('id_bloque', Number(blockId));
    if (playerIds.length) await supabase.from('metricas_replay').delete().in('id_jugador_replay', playerIds);
  }
  const { data: files } = await supabase.from('archivos_replay').select('id_archivo').in('hash_archivo', hashes);
  const fileIds = (files ?? []).map(f => f.id_archivo);
  if (fileIds.length) {
    await supabase.from('jugadores_replay').delete().in('id_archivo', fileIds);
    await supabase.from('archivos_replay').delete().in('id_archivo', fileIds);
  }
}

const summary = plan => ({ version: plan.version, plan_version_id: plan.plan_version_id, status: plan.status,
  availability_minutes: plan.availability_minutes, rank: plan.profile_snapshot.rank,
  workshop_access: plan.profile_snapshot.workshop_access,
  exercises: plan.exercises.map(e => `${e.order}. ${e.exercise_key} ${e.assigned_minutes} min dif ${e.difficulty} (versión ${e.exercise_version_id}, plan_ejercicio ${e.plan_exercise_id})`) });

async function main() {
  const supabase = createServerClient();
  if (!supabase) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.');
  const A = await userByAccount(supabase, 'TEST_A');
  const B = await userByAccount(supabase, 'TEST_B');
  const repository = createStoredAnalysisRepository(supabase);
  const hashes = [hash(), hash(), hash(), hash(), hash()];
  let blockId = null;
  let before = null, after = null;

  try {
    // 1) Seed de reglas y migración.
    const { data: rules } = await supabase.from('reglas_config')
      .select('comparador, umbral, reglas!inner(codigo), conjuntos_reglas!inner(version)').eq('conjuntos_reglas.version', RULES_CONFIG.rules_version);
    check(`Seed de reglas ${RULES_CONFIG.rules_version}`, `${RULE_COUNT} reglas configuradas`, rules?.length === RULE_COUNT, `${rules?.length ?? 0} regla(s)`);
    const { error: colError } = await supabase.from('planes').select('contexto').limit(1);
    check('Columna planes.contexto', 'existe', !colError, colError ? 'no existe' : 'existe');

    // 2) Bloque sintético listo de TEST_A: 6 goles / 20 tiros = 30 % → prioridad de finalización.
    const block = await blocks.createBlock(supabase, A, { mode: '2v2', match_type: 'ranked', status: 'ready',
      replays: hashes.map((h, i) => syntheticReplay(i + 1, h, i === 0 ? 2 : 1)) });
    blockId = block?.block_id;
    check('Bloque sintético listo', '5 replays, ready', block?.replays.length === 5 && block.status === 'ready', `${block?.replays.length} replays, ${block?.status}`);

    // 3) Primera versión (lo mismo que POST /api/v1/blocks/:blockId/plans).
    const reqA = { user: { id: A } };
    const first = await buildProposal({ supabase, repository, req: reqA, blockId, body: { availability_minutes: 30 } });
    const saved1 = await plans.savePlan(supabase, { userId: A, blockId, ...first });
    const v1 = await plans.getPlanVersion(supabase, A, saved1.plan_id, 1);
    before = structuredClone(v1);
    check('Guardar versión 1', 'versión 1, análisis creado', saved1.version === 1 && saved1.analysis_created === true, `versión ${saved1.version}, análisis creado ${saved1.analysis_created}`);
    check('Minutos de la versión 1', 'asignados ≤ 30 y > 0', v1.assigned_minutes > 0 && v1.assigned_minutes <= 30, `${v1.assigned_minutes} de ${v1.availability_minutes}`);

    // 4) Filas reales: análisis, prioridad con evidencia, plan_ejercicio con orden/minutos/dificultad.
    const { data: pr } = await supabase.from('prioridades').select('orden, valor_actual, evidencia').eq('id_analisis', Number(saved1.plan_id));
    const evidence = pr?.[0] ? JSON.parse(pr[0].evidencia) : null;
    check('Prioridad guardada con evidencia', 'orden 1, 30 %, mínimo 15 tiros, 5 replays',
      pr?.length === 1 && Number(pr[0].valor_actual) === 30 && evidence?.evidence?.min_shots === 15 && evidence.evidence.replay_ids.length === 5,
      pr?.[0] ? `orden ${pr[0].orden}, ${Number(pr[0].valor_actual)} %, mínimo ${evidence?.evidence?.min_shots}, ${evidence?.evidence?.replay_ids?.length} replays` : 'sin filas');
    const { data: pe } = await supabase.from('plan_ejercicio').select('orden, minutos, dificultad, id_ejercicio_version').eq('id_plan', Number(v1.plan_version_id)).order('orden');
    const expected = first.proposal.exercises.map(e => [e.order, e.assigned_minutes, e.difficulty, Number(e.exercise_version_id)]);
    const stored = (pe ?? []).map(r => [r.orden, r.minutos, r.dificultad, Number(r.id_ejercicio_version)]);
    check('plan_ejercicio conserva orden/minutos/dificultad/versión', JSON.stringify(expected), isDeepStrictEqual(stored, expected), JSON.stringify(stored));

    // 5) Nuevo contexto → versión 2 (lo mismo que POST /api/v1/plans/:planId/versions).
    const second = await buildProposal({ supabase, repository, req: reqA, blockId,
      body: { availability_minutes: 20, workshop_access: true, rank: 'diamond' } });
    const saved2 = await plans.savePlan(supabase, { userId: A, blockId, ...second });
    const v2 = await plans.getPlanVersion(supabase, A, saved2.plan_id, 2);
    check('Cambiar contexto crea versión 2', 'mismo plan_id, versión 2, otra fila', saved2.plan_id === saved1.plan_id && saved2.version === 2 && v2.plan_version_id !== v1.plan_version_id && !saved2.analysis_created,
      `plan_id ${saved2.plan_id}, versión ${saved2.version}, fila ${v2.plan_version_id}`);

    // 6) La versión 1 se recupera intacta después de guardar la 2.
    after = await plans.getPlanVersion(supabase, A, saved1.plan_id, 1);
    check('Versión 1 intacta tras la 2', 'idéntica a la leída antes', isDeepStrictEqual(after, before), isDeepStrictEqual(after, before) ? 'idéntica' : 'cambió');
    const list = await plans.listPlanVersions(supabase, A, saved1.plan_id);
    check('Lista de versiones', '[1, 2]', JSON.stringify(list.map(v => v.version)) === '[1,2]', JSON.stringify(list.map(v => v.version)));

    // 7) Inmutable: UPDATE sobre una versión guardada falla.
    const { error: upd } = await supabase.from('planes').update({ justificacion: 'cambio' }).eq('id_plan', Number(v1.plan_version_id));
    check('UPDATE de una versión guardada', 'rechazado (55000)', upd?.code === '55000', upd?.code ?? 'sin error');

    // 8) Una sesión (A21) no se inserta aquí: en dev una sesión exige al menos una sesion_versiones
    //    en la misma transacción. A21 usa plan_version_id / plan_exercise_id de esta versión.

    // 9) Propietario: B no lee ni guarda sobre el plan/bloque de A.
    const foreign = await plans.getPlanVersion(supabase, B, saved1.plan_id);
    check('B lee el plan de A', 'null (404)', foreign === null, foreign === null ? 'null' : 'devuelve el plan');
    let foreignSave = 'sin error';
    try { await plans.savePlan(supabase, { userId: B, blockId, ...first }); } catch (err) { foreignSave = `${err.status} ${err.code}`; }
    check('B guarda sobre el bloque de A', '404 RESOURCE_NOT_FOUND', foreignSave === '404 RESOURCE_NOT_FOUND', foreignSave);
    const { count: planesCount } = await supabase.from('planes').select('*', { count: 'exact', head: true }).eq('id_analisis', Number(saved1.plan_id));
    check('Sin versiones extra tras los rechazos', '2 filas en planes', planesCount === 2, `${planesCount} filas`);
  } finally {
    if (KEEP) console.log(`\nBloque ${blockId} y sus versiones conservados.`);
    else { await cleanup(supabase, blockId, hashes); console.log('\nDatos de prueba borrados.'); }
  }

  if (before) console.log('\nAntes (versión 1 leída al guardarla):\n' + JSON.stringify(summary(before), null, 2));
  if (after) console.log('\nDespués (versión 1 leída tras guardar la versión 2):\n' + JSON.stringify(summary(after), null, 2));
  console.log('\n| # | Prueba | Esperado | Obtenido | OK |\n| --- | --- | --- | --- | --- |');
  results.forEach((r, i) => console.log(`| ${i + 1} | ${r.name} | ${r.expected} | ${r.obtained} | ${r.ok ? 'Sí' : 'NO'} |`));
  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed}/${results.length} comprobaciones correctas.`);
  process.exitCode = passed === results.length ? 0 : 1;
}

main().catch(err => { console.error('Error:', err.message); process.exitCode = 1; });
