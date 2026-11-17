'use strict';

// A16 · Prueba real contra Supabase dev: alta, edición con historial, archivo y propiedad de metas.
//
// Requisitos: .env con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY, y ya ejecutados en el SQL Editor:
//   database/seeds/a23-catalogo.sql, database/seeds/a24-reglas.sql,
//   database/migraciones/a24-planes.sql, database/migraciones/a16-objetivos.sql
//
// Uso (desde la raíz del repo):
//   node --env-file=.env scripts/prueba-a16.cjs
//
// Usa los perfiles de desarrollo TEST_A y TEST_B. Para el caso "meta enlazada a un plan" crea un
// bloque sintético y guarda un plan con la meta (mismo código que las rutas de A18/A24).
// Al terminar borra todo lo que creó. La sesión HTTP real no se prueba aquí.

const crypto = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { createServerClient } = require('../src/services/supabase');
const blocks = require('../src/repositories/blocks');
const plans = require('../src/repositories/plans');
const goals = require('../src/repositories/goals');
const { parseCreate, parseEdit, todayIn } = require('../src/domain/goals');
const { buildProposal } = require('../src/routes/plans');
const { createStoredAnalysisRepository } = require('../src/services/stored-block');

const results = [];
const check = (name, expected, ok, obtained) => results.push({ name, expected, obtained: String(obtained), ok: Boolean(ok) });
const hash = () => crypto.randomBytes(32).toString('hex');
const TZ = 'America/Monterrey';
const attempt = async fn => { try { await fn(); return 'sin error'; } catch (err) { return `${err.status} ${err.code}`; } };

function syntheticReplay(position, fileHash, goalsCount) {
  return {
    position, file_name: `a16-prueba-${position}.replay`, status: 'ok', upload_origin: 'own', visibility: 'private',
    access_verified: true, group_verified: true,
    file: { hash: fileHash, size_bytes: 100000 + position, mode: '2v2', match_type: 'ranked',
      played_at: `2026-11-16T1${position}:00:00Z`, duration_s: 300 },
    player: { platform: 'steam', player_id: 'TEST_A', time_played_s: 295 },
    metrics: { shots: 4, goals: goalsCount, assists: 0, saves: 0, score: 100 },
  };
}

async function userByAccount(supabase, account) {
  const { data, error } = await supabase.from('perfiles').select('id_usuario').eq('cuenta_juego_id', account).maybeSingle();
  if (error || !data) throw new Error(`No existe el perfil de desarrollo ${account}.`);
  return data.id_usuario;
}

async function cleanup(supabase, { blockId, hashes, goalIds, owner }) {
  if (blockId) {
    const { data: a } = await supabase.from('analisis').select('id_analisis').eq('id_bloque', Number(blockId));
    const analysisIds = (a ?? []).map(r => r.id_analisis);
    if (analysisIds.length) {
      const { data: p } = await supabase.from('planes').select('id_plan').in('id_analisis', analysisIds);
      const planIds = (p ?? []).map(r => r.id_plan);
      if (planIds.length) {
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
  // Ya sin planes, cada meta queda sin enlaces y a16_borrar_objetivo la borra con sus versiones en una
  // transacción (borrarlas por separado lo impide la cardinalidad: una meta exige al menos una versión).
  for (const id of goalIds.filter(Boolean)) {
    try { await goals.deleteGoal(supabase, owner, id); } catch (err) { if (err.status !== 404) throw err; }
  }
}

async function main() {
  const supabase = createServerClient();
  if (!supabase) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.');
  const A = await userByAccount(supabase, 'TEST_A');
  const B = await userByAccount(supabase, 'TEST_B');
  const today = todayIn(TZ);
  const hashes = [hash(), hash(), hash(), hash(), hash()];
  const created = { blockId: null, hashes, goalIds: [], owner: A };
  let before = null, after = null;

  try {
    // 1) Métrica de entrenamiento.
    const { data: metric } = await supabase.from('metricas').select('unidad, tipo').eq('codigo', 'training_minutes').maybeSingle();
    check('Métrica training_minutes', 'minutes / entrenamiento', metric?.unidad === 'minutes' && metric.tipo === 'entrenamiento', metric ? `${metric.unidad} / ${metric.tipo}` : 'no existe');

    // 2) Alta de meta de rendimiento (2v2).
    const v1 = await goals.saveGoalVersion(supabase, A, null,
      parseCreate({ type: 'performance', mode: '2v2', name: 'Prueba A16 eficiencia', target_value: 35, due_date: '2026-12-31' }, { today }), TZ);
    created.goalIds.push(v1.goal_id);
    before = structuredClone(v1.versions[0]);
    check('Crear meta de rendimiento', 'versión 1, activa, 35 %', v1.version === 1 && v1.status === 'active' && v1.target_value === 35 && v1.unit === 'percent',
      `versión ${v1.version}, ${v1.status}, ${v1.target_value} ${v1.unit}`);

    // 3) Una activa por tipo y modalidad.
    const dup = await attempt(() => goals.saveGoalVersion(supabase, A, null,
      parseCreate({ type: 'performance', mode: '2v2', name: 'Duplicada', target_value: 40 }, { today }), TZ));
    check('Segunda meta activa de rendimiento en 2v2', '409 GOAL_ACTIVE_EXISTS', dup === '409 GOAL_ACTIVE_EXISTS', dup);

    // 4) Editar → versión 2; la 1 queda intacta.
    const { goal: edited } = parseEdit({ target_value: 40, comparator: '>' }, v1);
    const v2 = await goals.saveGoalVersion(supabase, A, v1.goal_id, edited, TZ);
    after = structuredClone(v2.versions[0]);
    check('Editar crea versión 2', 'versión 2, 40 %, otra fila', v2.version === 2 && v2.target_value === 40 && v2.goal_version_id !== v1.goal_version_id,
      `versión ${v2.version}, ${v2.target_value} %, fila ${v2.goal_version_id}`);
    check('Versión 1 intacta tras editar', 'idéntica', isDeepStrictEqual(after, before), isDeepStrictEqual(after, before) ? 'idéntica' : 'cambió');

    // 5) El historial no se modifica en la base.
    const { error: upd } = await supabase.from('objetivo_versiones').update({ valor_meta: 99 }).eq('id_objetivo_version', Number(v1.goal_version_id));
    check('UPDATE de una versión de meta', 'rechazado (55000)', upd?.code === '55000', upd?.code ?? 'sin error');

    // 6) Propiedad.
    const foreign = await goals.getGoal(supabase, B, v1.goal_id);
    check('B lee la meta de A', 'null (404)', foreign === null, foreign === null ? 'null' : 'devuelve la meta');
    const foreignEdit = await attempt(() => goals.saveGoalVersion(supabase, B, v1.goal_id, edited, TZ));
    check('B edita la meta de A', '404 RESOURCE_NOT_FOUND', foreignEdit === '404 RESOURCE_NOT_FOUND', foreignEdit);
    const foreignDelete = await attempt(() => goals.deleteGoal(supabase, B, v1.goal_id));
    check('B borra la meta de A', '404 RESOURCE_NOT_FOUND', foreignDelete === '404 RESOURCE_NOT_FOUND', foreignDelete);

    // 7) Meta de entrenamiento sin enlaces → se borra.
    const t = await goals.saveGoalVersion(supabase, A, null,
      parseCreate({ type: 'training', mode: '2v2', name: 'Prueba A16 minutos', target_value: 120 }, { today }), TZ);
    created.goalIds.push(t.goal_id);
    const tEffect = await goals.deleteGoal(supabase, A, t.goal_id);
    const tAfter = await goals.getGoal(supabase, A, t.goal_id);
    check('Borrar meta sin enlaces', 'deleted y ya no existe', tEffect === 'deleted' && tAfter === null, `${tEffect}, ${tAfter === null ? 'no existe' : 'sigue'}`);

    // 8) Meta enlazada a un plan guardado → se archiva y conserva sus versiones.
    const block = await blocks.createBlock(supabase, A, { mode: '2v2', match_type: 'ranked', status: 'ready',
      replays: hashes.map((h, i) => syntheticReplay(i + 1, h, i === 0 ? 2 : 1)) });
    created.blockId = block?.block_id;
    const repository = createStoredAnalysisRepository(supabase);
    const req = { user: { id: A } };
    const built = await buildProposal({ supabase, repository, req, blockId: created.blockId, body: { goal_ids: [v1.goal_id] } });
    const saved = await plans.savePlan(supabase, { userId: A, blockId: created.blockId, ...built });
    const plan = await plans.getPlanVersion(supabase, A, saved.plan_id, saved.version);
    check('Plan guardado con la meta', `plan_objetivo = versión ${v2.goal_version_id}`, isDeepStrictEqual(plan.goal_version_ids, [v2.goal_version_id]), JSON.stringify(plan.goal_version_ids));
    const effect = await goals.deleteGoal(supabase, A, v1.goal_id);
    const archived = await goals.getGoal(supabase, A, v1.goal_id);
    check('Borrar meta enlazada', 'archived, 2 versiones', effect === 'archived' && archived?.status === 'archived' && archived.versions.length === 2,
      `${effect}, ${archived?.status}, ${archived?.versions.length} versiones`);
    const planAfter = await plans.getPlanVersion(supabase, A, saved.plan_id, saved.version);
    check('El plan conserva la versión de la meta', 'sin cambios', isDeepStrictEqual(planAfter, plan), isDeepStrictEqual(planAfter, plan) ? 'sin cambios' : 'cambió');

    // 9) Archivada: no se edita y los planes nuevos la excluyen.
    const editArchived = await attempt(() => goals.saveGoalVersion(supabase, A, v1.goal_id, edited, TZ));
    check('Editar meta archivada', '409 GOAL_ARCHIVED', editArchived === '409 GOAL_ARCHIVED', editArchived);
    const next = await buildProposal({ supabase, repository, req, blockId: created.blockId, body: { goal_ids: [v1.goal_id] } });
    check('Propuesta nueva con la meta archivada', 'excluida (GOAL_INACTIVE), diagnóstico igual',
      next.proposal.goals_snapshot.length === 0 && next.proposal.goals_excluded[0]?.reason === 'GOAL_INACTIVE' &&
      isDeepStrictEqual(next.proposal.diagnosis_snapshot, built.proposal.diagnosis_snapshot),
      `${next.proposal.goals_excluded[0]?.reason ?? 'incluida'}, diagnóstico ${isDeepStrictEqual(next.proposal.diagnosis_snapshot, built.proposal.diagnosis_snapshot) ? 'igual' : 'distinto'}`);
  } finally {
    await cleanup(supabase, created);
    console.log('\nDatos de prueba borrados.');
  }

  if (before) console.log('\nVersión 1 antes de editar:\n' + JSON.stringify(before, null, 2));
  if (after) console.log('\nVersión 1 después de crear la versión 2:\n' + JSON.stringify(after, null, 2));
  console.log('\n| # | Prueba | Esperado | Obtenido | OK |\n| --- | --- | --- | --- | --- |');
  results.forEach((r, i) => console.log(`| ${i + 1} | ${r.name} | ${r.expected} | ${r.obtained} | ${r.ok ? 'Sí' : 'NO'} |`));
  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed}/${results.length} comprobaciones correctas.`);
  process.exitCode = passed === results.length ? 0 : 1;
}

main().catch(err => { console.error('Error:', err.message); process.exitCode = 1; });
