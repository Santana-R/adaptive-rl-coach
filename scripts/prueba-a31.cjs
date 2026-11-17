'use strict';

// A31 · Prueba real contra Supabase dev: rango declarado + integridad del historial.
//
// Requiere ejecutado en el SQL Editor (además de lo de A16/A24/A32):
//   database/migraciones/a31-rangos.sql
//   database/migraciones/a21-sesiones.sql
//   database/migraciones/a31-historial-sesiones.sql
//
// Uso (desde la raíz del repo):
//   node --env-file=.env scripts/prueba-a31.cjs
//
// Usa los perfiles de desarrollo TEST_A y TEST_B. Crea un bloque sintético, metas, rangos, un plan y
// dos sesiones; después corrige la meta, el rango, las sesiones y el catálogo (desactivar/reactivar
// un ejercicio del plan) y comprueba que la versión guardada del plan y las versiones anteriores no
// cambian. Genera el reporte (A22) antes y después con el mismo código de GET /api/v1/reports.
// Al terminar borra todo lo que creó y deja el catálogo como estaba.

const crypto = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { createServerClient } = require('../src/services/supabase');
const blocks = require('../src/repositories/blocks');
const plans = require('../src/repositories/plans');
const goals = require('../src/repositories/goals');
const ranks = require('../src/repositories/ranks');
const admin = require('../src/repositories/exercises-admin');
const sessions = require('../src/repositories/sessions');
const sessionRules = require('../src/domain/sessions');
const { buildReport } = require('../src/routes/reports');
const { parseReportPeriod } = require('../src/services/reports');
const { parseCreate, parseEdit, todayIn } = require('../src/domain/goals');
const { parseRank } = require('../src/domain/ranks');
const { buildProposal } = require('../src/routes/plans');
const { createStoredAnalysisRepository } = require('../src/services/stored-block');

const results = [];
const check = (name, expected, ok, obtained) => results.push({ name, expected, obtained: String(obtained), ok: Boolean(ok) });
const hash = () => crypto.randomBytes(32).toString('hex');
const TZ = 'America/Monterrey';
const attempt = async fn => { try { await fn(); return 'sin error'; } catch (err) { return `${err.status} ${err.code}`; } };

function syntheticReplay(position, fileHash, goalsCount) {
  return {
    position, file_name: `a31-prueba-${position}.replay`, status: 'ok', upload_origin: 'own', visibility: 'private',
    access_verified: true, group_verified: true,
    file: { hash: fileHash, size_bytes: 200000 + position, mode: '2v2', match_type: 'ranked',
      played_at: `2026-11-15T1${position}:00:00Z`, duration_s: 300 },
    player: { platform: 'steam', player_id: 'TEST_A', time_played_s: 295 },
    metrics: { shots: 4, goals: goalsCount, assists: 0, saves: 0, score: 100 },
  };
}

async function userByAccount(supabase, account) {
  const { data, error } = await supabase.from('perfiles').select('id_usuario').eq('cuenta_juego_id', account).maybeSingle();
  if (error || !data) throw new Error(`No existe el perfil de desarrollo ${account}.`);
  return data.id_usuario;
}

// Lo que el reporte compara antes/después: lo que el plan guardado dice de sí mismo.
const planView = plan => ({
  version: plan.version,
  rank: plan.profile_snapshot.rank, rank_record: plan.profile_snapshot.rank_record,
  goal_version_ids: plan.goal_version_ids,
  goals: plan.goals_snapshot.map(g => ({ goal_version_id: g.goal_version_id, target_value: g.target_value })),
  exercises: plan.exercises.map(e => ({ exercise_version_id: e.exercise_version_id, title: e.exercise_snapshot.title, minutes: e.assigned_minutes })),
});

// Lo que el reporte dice de los datos de esta prueba (el perfil puede tener otros).
function reportView(report, created, sessionIds) {
  return {
    performance: report.performance.points.filter(p => p.block_id === created.blockId)
      .map(p => ({ block_id: p.block_id, value: p.value, goals: p.numerator.value, shots: p.denominator.value })),
    training: report.training.points.filter(p => sessionIds.includes(p.session_id))
      .map(p => ({ session_id: p.session_id, plan_version_id: p.plan_version_id, mode: p.mode, duration_minutes: p.duration_minutes })),
    rank: report.rank.points.filter(p => created.rankIds.includes(p.rank_id))
      .map(p => ({ rank_id: p.rank_id, mode: p.mode, rank_label: p.rank_label, division: p.division, recorded_at: p.recorded_at.slice(0, 10) })),
    rank_source: report.rank.source,
    goals: report.goals.points.filter(p => created.goalIds.includes(p.goal_id))
      .map(p => ({ goal_version_id: p.goal_version_id, type: p.type, version: p.version, target_value: p.target_value,
        actual_value: p.actual_value, status: p.status, evidence: p.evidence })),
  };
}

async function sessionHistory(supabase, sessionId) {
  const { data, error } = await supabase.from('sesion_versiones')
    .select('id_sesion_version, version, notas, sesion_ejercicio(id_plan_ejercicio, minutos)')
    .eq('id_sesion', Number(sessionId)).order('version');
  if (error) throw new Error('No se pudo leer el historial de la sesión: ' + error.message);
  return data.map(v => ({ id: v.id_sesion_version, version: v.version, notes: v.notas, minutes: v.sesion_ejercicio[0]?.minutos }));
}

async function cleanup(supabase, { blockId, hashes, goalIds, rankIds, owner, reactivate }) {
  for (const id of reactivate) {
    try { await admin.setActive(supabase, id, true); } catch (err) { console.error(`No se pudo reactivar el ejercicio ${id}: ${err.message}`); }
  }
  if (blockId) {
    const { data: a } = await supabase.from('analisis').select('id_analisis').eq('id_bloque', Number(blockId));
    const analysisIds = (a ?? []).map(r => r.id_analisis);
    if (analysisIds.length) {
      const { data: p } = await supabase.from('planes').select('id_plan').in('id_analisis', analysisIds);
      const planIds = (p ?? []).map(r => r.id_plan);
      if (planIds.length) {
        const { error } = await supabase.rpc('a31_borrar_sesiones_de_planes', { p_id_usuario: owner, p_ids_plan: planIds });
        if (error) console.error('No se pudieron borrar las sesiones de prueba: ' + error.message);
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
  for (const id of goalIds.filter(Boolean)) {
    try { await goals.deleteGoal(supabase, owner, id); } catch (err) { if (err.status !== 404) throw err; }
  }
  if (rankIds.length) await supabase.from('rangos').delete().in('id_rango', rankIds.map(Number));
}

async function main() {
  const supabase = createServerClient();
  if (!supabase) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.');
  const A = await userByAccount(supabase, 'TEST_A');
  const B = await userByAccount(supabase, 'TEST_B');
  const today = todayIn(TZ);
  const hashes = [hash(), hash(), hash(), hash(), hash()];
  const created = { blockId: null, hashes, goalIds: [], rankIds: [], owner: A, reactivate: [] };
  let before = null, after = null, reportBefore = null, reportAfter = null;

  const { error: missing } = await supabase.rpc('a31_borrar_sesiones_de_planes', { p_id_usuario: A, p_ids_plan: [] });
  if (missing) throw new Error('Falta ejecutar database/migraciones/a31-historial-sesiones.sql (' + (missing.code ?? missing.message) + ').');

  try {
    // 1) Rango declarado: registro, fuente fija e historial.
    const { count: previous } = await supabase.from('rangos').select('*', { count: 'exact', head: true }).eq('id_usuario', A);
    const r1 = await ranks.addRank(supabase, A, parseRank({ mode: '2v2', rank_label: 'platinum', division: 3, recorded_at: '2026-10-01' }));
    created.rankIds.push(r1.rank_id);
    const r2 = await ranks.addRank(supabase, A, parseRank({ mode: '2v2', rank_label: 'diamond', division: 1, season: 'S21', recorded_at: '2026-11-01' }));
    created.rankIds.push(r2.rank_id);
    check('Registrar rango con fecha y modalidad', 'diamond I 2v2, 2026-11-01, self_reported',
      r2.rank_label === 'diamond' && r2.division === 1 && r2.mode === '2v2' && r2.recorded_at.startsWith('2026-11-01') && r2.source === 'self_reported',
      `${r2.rank_label} ${r2.division} ${r2.mode}, ${r2.recorded_at.slice(0, 10)}, ${r2.source}`);
    const history = await ranks.listRanks(supabase, A, { mode: '2v2' });
    check('Historial de rango', `${previous + 2} registros, vigente diamond`, history.entries.length === previous + 2 && history.current['2v2'].rank_id === r2.rank_id,
      `${history.entries.length} registros, vigente ${history.current['2v2']?.rank_label}`);
    const foreign = await ranks.listRanks(supabase, B, { mode: '2v2' });
    check('B no ve los rangos de A', 'ninguno de A', !foreign.entries.some(e => created.rankIds.includes(e.rank_id)),
      foreign.entries.some(e => created.rankIds.includes(e.rank_id)) ? 've rangos de A' : 'ninguno de A');

    // 2) Reglas en la base.
    const { error: upd } = await supabase.from('rangos').update({ rango: 'champion' }).eq('id_rango', Number(r1.rank_id));
    check('UPDATE de un rango registrado', 'rechazado (A3101)', upd?.code === 'A3101', upd?.code ?? 'sin error');
    const bad = async (values, label) => {
      const { data, error } = await supabase.from('rangos').insert({ id_usuario: A, modalidad: '2v2', temporada: 'x', rango: 'gold',
        fecha_registro: new Date().toISOString(), fuente: 'self_reported', ...values }).select('id_rango').maybeSingle();
      if (data) created.rankIds.push(String(data.id_rango));
      check(`Insertar rango con ${label}`, 'rechazado (23514)', error?.code === '23514', error?.code ?? 'aceptado');
    };
    await bad({ fuente: 'mmr' }, 'fuente distinta de self_reported');
    await bad({ rango: 'Diamante' }, 'rango sin normalizar');
    await bad({ rango: 'supersonic_legend', division: 1 }, 'división en Supersonic Legend');

    // 3) Plan con meta y rango declarado.
    const goal = await goals.saveGoalVersion(supabase, A, null,
      parseCreate({ type: 'performance', mode: '2v2', name: 'Prueba A31 eficiencia', target_value: 35 }, { today }), TZ);
    created.goalIds.push(goal.goal_id);
    const trainingGoal = await goals.saveGoalVersion(supabase, A, null,
      parseCreate({ type: 'training', mode: '2v2', name: 'Prueba A31 minutos', target_value: 30 }, { today }), TZ);
    created.goalIds.push(trainingGoal.goal_id);
    const trainingGoalSavedAt = Date.now();
    const block = await blocks.createBlock(supabase, A, { mode: '2v2', match_type: 'ranked', status: 'ready',
      replays: hashes.map((h, i) => syntheticReplay(i + 1, h, i === 0 ? 2 : 1)) });
    created.blockId = block?.block_id;
    const repository = createStoredAnalysisRepository(supabase);
    const req = { user: { id: A } };
    const body = { goal_ids: [goal.goal_id], availability_minutes: 20 };
    const built = await buildProposal({ supabase, repository, req, blockId: created.blockId, body });
    check('El plan toma el último rango declarado', `rank_history → diamond (registro ${r2.rank_id})`,
      built.rankOrigin === 'rank_history' && built.proposal.profile_snapshot.rank === 'diamond' && built.proposal.profile_snapshot.rank_record?.rank_id === r2.rank_id,
      `${built.rankOrigin} → ${built.proposal.profile_snapshot.rank} (registro ${built.proposal.profile_snapshot.rank_record?.rank_id})`);
    const saved = await plans.savePlan(supabase, { userId: A, blockId: created.blockId, ...built });
    const plan = await plans.getPlanVersion(supabase, A, saved.plan_id, saved.version);
    before = planView(plan);
    check('Plan guardado con rango, meta y ejercicios', 'rank diamond, 1 meta, ≥1 ejercicio',
      plan.profile_snapshot.rank === 'diamond' && plan.goal_version_ids.length === 1 && plan.exercises.length >= 1,
      `rank ${plan.profile_snapshot.rank}, ${plan.goal_version_ids.length} meta, ${plan.exercises.length} ejercicios`);

    // 3b) Dos sesiones ligadas a la versión 1 del plan y el reporte antes de corregir.
    // La práctica se fecha 1 y 2 s después de activar la meta de entrenamiento, según el reloj de
    // la base. Se esperan 3 s desde que se guardó la meta para que esa hora ya haya pasado allá.
    const goalActivation = Date.parse(trainingGoal.activated_at);
    await new Promise(resolve => setTimeout(resolve, Math.max(0, trainingGoalSavedAt + 3000 - Date.now())));
    const newSession = (offsetMs, minutes) => sessions.createSession(supabase, A, sessionRules.parseCreate({
      plan_version_id: plan.plan_version_id, plan_exercise_id: plan.exercises[0].plan_exercise_id,
      performed_at: new Date(goalActivation + offsetMs).toISOString(), duration_minutes: minutes, notes: 'Prueba A31',
    }, goalActivation + 60_000));
    const s1 = await newSession(1000, 20);
    const s2 = await newSession(2000, 5);
    const sessionIds = [s1.session_id, s2.session_id];
    const interval = parseReportPeriod({ from: '2026-10-01', to: today });
    const report = () => buildReport({ supabase, repository, userId: A, interval });
    const fullBefore = await report();
    reportBefore = reportView(fullBefore, created, sessionIds);
    const trainingBefore = reportBefore.goals.find(g => g.type === 'training');
    check('Sesiones registradas en la versión 1 del plan', `2 sesiones (20 y 5 min) en la versión ${plan.plan_version_id}, 2v2`,
      reportBefore.training.length === 2 && reportBefore.training.every(p => p.plan_version_id === plan.plan_version_id && p.mode === '2v2') &&
      isDeepStrictEqual(reportBefore.training.map(p => p.duration_minutes), [20, 5]),
      `${reportBefore.training.length} sesiones (${reportBefore.training.map(p => p.duration_minutes).join(' y ')} min) en la versión ` +
      `${[...new Set(reportBefore.training.map(p => p.plan_version_id))].join()}, ${[...new Set(reportBefore.training.map(p => p.mode))].join()}`);
    check('Reporte antes: meta de entrenamiento', '25 de 30 min, not_met',
      trainingBefore?.actual_value === 25 && trainingBefore.status === 'not_met',
      `${trainingBefore?.actual_value} de ${trainingBefore?.target_value} min, ${trainingBefore?.status}`);
    const rankInPerformance = fullBefore.performance.points.some(p => 'rank_label' in p || 'rank' in p);
    check('Reporte: rango separado de las métricas', 'serie rank self_reported con 2 registros; performance con el bloque y sin rango',
      fullBefore.rank.source === 'self_reported' && reportBefore.rank.length === 2 && !rankInPerformance && reportBefore.performance.length === 1,
      `serie rank ${fullBefore.rank.source} con ${reportBefore.rank.length} registros; performance ${reportBefore.performance.length === 1 ? 'con' : 'sin'} el bloque y ${rankInPerformance ? 'con' : 'sin'} rango`);

    // 4) Corregir meta, rango, sesiones y catálogo.
    const { goal: edited } = parseEdit({ target_value: 45 }, goal);
    const goalV2 = await goals.saveGoalVersion(supabase, A, goal.goal_id, edited, TZ);
    const r3 = await ranks.addRank(supabase, A, parseRank({ mode: '2v2', rank_label: 'champion', division: 2 }));
    created.rankIds.push(r3.rank_id);
    const usedId = (await supabase.from('ejercicio_versiones').select('id_ejercicio')
      .eq('id_ejercicio_version', Number(plan.exercises[0].exercise_version_id)).single()).data.id_ejercicio;
    const off = await admin.setActive(supabase, usedId, false);
    if (off.changed) created.reactivate.push(String(usedId));
    check('Correcciones aplicadas', 'meta v2, rango champion, ejercicio inactivo',
      goalV2.version === 2 && r3.rank_label === 'champion' && off.exercise.active === false,
      `meta v${goalV2.version}, rango ${r3.rank_label}, ejercicio ${off.exercise.active ? 'activo' : 'inactivo'}`);

    // 4b) Corregir una sesión y borrar la otra: el historial queda.
    const corrected = await sessions.updateSession(supabase, A, s1.session_id,
      sessionRules.parsePatch({ duration_minutes: 35, notes: 'Prueba A31 corregida' }));
    const versions = await sessionHistory(supabase, s1.session_id);
    check('Corregir la sesión crea la versión 2 y conserva la 1', 'v1 20 min, v2 35 min; vigente v2',
      corrected.version === 2 && corrected.duration_minutes === 35 && versions.length === 2 &&
      versions[0].minutes === 20 && versions[0].notes === 'Prueba A31' && versions[1].minutes === 35,
      versions.map(v => `v${v.version} ${v.minutes} min`).join(', ') + `; vigente v${corrected.version}`);
    const { error: updVersion } = await supabase.from('sesion_versiones').update({ notas: 'reescrita' }).eq('id_sesion_version', versions[0].id);
    const { error: updMinutes } = await supabase.from('sesion_ejercicio').update({ minutos: 99 }).eq('id_sesion_version', versions[0].id);
    check('UPDATE de una versión de sesión guardada', 'rechazado (A3102) en sesion_versiones y sesion_ejercicio',
      updVersion?.code === 'A3102' && updMinutes?.code === 'A3102', `${updVersion?.code ?? 'sin error'} y ${updMinutes?.code ?? 'sin error'}`);
    await sessions.deleteSession(supabase, A, s2.session_id);
    const { data: deletedRow } = await supabase.from('sesiones').select('eliminado_en').eq('id_sesion', Number(s2.session_id)).maybeSingle();
    const listed = (await sessions.listSessions(supabase, A)).map(s => s.session_id);
    check('Borrar una sesión la excluye sin perder el registro', 'fuera de la lista; fila con eliminado_en',
      !listed.includes(s2.session_id) && listed.includes(s1.session_id) && deletedRow?.eliminado_en != null,
      `${listed.includes(s2.session_id) ? 'en' : 'fuera de'} la lista; fila ${deletedRow?.eliminado_en ? 'con' : 'sin'} eliminado_en`);
    const foreignSession = await attempt(() => sessions.updateSession(supabase, B, s1.session_id, sessionRules.parsePatch({ duration_minutes: 1 })));
    check('B corrige la sesión de A', '404 RESOURCE_NOT_FOUND', foreignSession === '404 RESOURCE_NOT_FOUND', foreignSession);

    // 5) La versión guardada no cambia.
    const planAfter = await plans.getPlanVersion(supabase, A, saved.plan_id, saved.version);
    after = planView(planAfter);
    check('Plan guardado tras las correcciones', 'idéntico (meta v1, rango diamond, mismos ejercicios)',
      isDeepStrictEqual(planAfter, plan), isDeepStrictEqual(planAfter, plan) ? 'idéntico' : 'cambió');

    // 6) Lo nuevo sí usa las correcciones; la nueva versión queda aparte.
    const rebuilt = await buildProposal({ supabase, repository, req, blockId: created.blockId, body });
    const savedV2 = await plans.savePlan(supabase, { userId: A, blockId: created.blockId, ...rebuilt });
    const planV2 = await plans.getPlanVersion(supabase, A, savedV2.plan_id, savedV2.version);
    const usedVersionIds = plan.exercises.map(e => e.exercise_version_id);
    check('Versión 2 del plan usa lo corregido', `rank champion, meta ${goalV2.goal_version_id}, sin el ejercicio inactivo`,
      planV2.version === 2 && planV2.profile_snapshot.rank === 'champion' &&
      isDeepStrictEqual(planV2.goal_version_ids, [goalV2.goal_version_id]) &&
      !planV2.exercises.some(e => e.exercise_version_id === usedVersionIds[0]),
      `v${planV2.version}, rank ${planV2.profile_snapshot.rank}, meta ${planV2.goal_version_ids.join()}, ` +
      `${planV2.exercises.some(e => e.exercise_version_id === usedVersionIds[0]) ? 'incluye' : 'sin'} el inactivo`);
    const v1Again = await plans.getPlanVersion(supabase, A, saved.plan_id, 1);
    check('Versión 1 sigue igual después de guardar la 2', 'idéntica', isDeepStrictEqual(v1Again, plan),
      isDeepStrictEqual(v1Again, plan) ? 'idéntica' : 'cambió');

    // 6b) La sesión sigue ligada a la versión 1 y no acepta ejercicios de la versión 2.
    const [linked] = await sessions.listSessions(supabase, A, s1.session_id);
    const crossVersion = await attempt(() => sessions.updateSession(supabase, A, s1.session_id,
      sessionRules.parsePatch({ plan_exercise_id: planV2.exercises[0].plan_exercise_id })));
    check('La sesión sigue en la versión 1 del plan', `versión ${plan.plan_version_id}; ejercicio de la v2: 422 INPUT_INVALID`,
      linked?.plan_version_id === plan.plan_version_id && linked.plan_exercise_id === plan.exercises[0].plan_exercise_id && crossVersion === '422 INPUT_INVALID',
      `versión ${linked?.plan_version_id}; ejercicio de la v2: ${crossVersion}`);

    // 6c) Reporte después de todas las correcciones.
    const fullAfter = await report();
    reportAfter = reportView(fullAfter, created, sessionIds);
    check('Reporte después: entrenamiento usa la sesión corregida', `1 sesión de 35 min en la versión ${plan.plan_version_id}`,
      isDeepStrictEqual(reportAfter.training, [{ session_id: s1.session_id, plan_version_id: plan.plan_version_id, mode: '2v2', duration_minutes: 35 }]),
      `${reportAfter.training.length} sesión de ${reportAfter.training.map(p => p.duration_minutes).join()} min en la versión ${reportAfter.training.map(p => p.plan_version_id).join()}`);
    const trainingAfter = reportAfter.goals.find(g => g.type === 'training');
    check('Reporte después: meta de entrenamiento', `35 de 30 min, met, evidencia sesión ${s1.session_id}`,
      trainingAfter?.actual_value === 35 && trainingAfter.status === 'met' && isDeepStrictEqual(trainingAfter.evidence.session_ids, [s1.session_id]),
      `${trainingAfter?.actual_value} de ${trainingAfter?.target_value} min, ${trainingAfter?.status}, evidencia sesión ${trainingAfter?.evidence.session_ids.join()}`);
    const perfVersions = fullAfter.goals.points.filter(p => p.goal_id === goal.goal_id);
    const contiguous = perfVersions.length === 2 && perfVersions[0].active_until === perfVersions[1].active_from;
    check('Reporte después: las dos versiones de la meta corregida', 'v1 meta 35 y v2 meta 45, vigencias contiguas',
      contiguous && perfVersions[0].target_value === 35 && perfVersions[1].target_value === 45,
      perfVersions.map(p => `v${p.version} meta ${p.target_value}`).join(' y ') + (contiguous ? ', vigencias contiguas' : ', vigencias no contiguas'));
    const sameRanks = isDeepStrictEqual(reportAfter.rank.slice(0, 2), reportBefore.rank);
    check('Reporte después: rango', 'los 2 registros anteriores iguales + champion',
      reportAfter.rank.length === 3 && sameRanks && reportAfter.rank[2].rank_id === r3.rank_id,
      `${sameRanks ? 'los 2 registros anteriores iguales' : 'cambiaron los anteriores'} + ${reportAfter.rank[2]?.rank_label}`);
    const samePerformance = isDeepStrictEqual(fullAfter.performance, fullBefore.performance);
    check('Reporte después: rendimiento', 'idéntico al de antes', samePerformance, samePerformance ? 'idéntico al de antes' : 'cambió');
    const reportGoalIds = fullAfter.goals.points.map(p => p.goal_version_id);
    const reportRankIds = fullAfter.rank.points.map(p => p.rank_id);
    const planCoherent = [plan, planV2].every(p => p.goal_version_ids.every(id => reportGoalIds.includes(id)) &&
      reportRankIds.includes(p.profile_snapshot.rank_record.rank_id));
    check('Plan y reporte usan los mismos registros', 'las metas y rangos de las versiones 1 y 2 del plan aparecen en el reporte',
      planCoherent, planCoherent ? 'las metas y rangos de las versiones 1 y 2 del plan aparecen en el reporte' : 'falta alguno en el reporte');

    // 7) Propiedad del plan y de la meta.
    const foreignPlan = await plans.getPlanVersion(supabase, B, saved.plan_id, 1);
    check('B lee el plan de A', 'null (404)', foreignPlan === null, foreignPlan === null ? 'null' : 'devuelve el plan');
    const foreignGoal = await attempt(() => goals.saveGoalVersion(supabase, B, goal.goal_id, edited, TZ));
    check('B corrige la meta de A', '404 RESOURCE_NOT_FOUND', foreignGoal === '404 RESOURCE_NOT_FOUND', foreignGoal);

  } finally {
    await cleanup(supabase, created);
    console.log('\nDatos de prueba borrados y catálogo restaurado.');
  }

  if (before) console.log('\nPlan versión 1 ANTES de corregir meta, rango, sesiones y catálogo:\n' + JSON.stringify(before, null, 2));
  if (after) console.log('\nPlan versión 1 DESPUÉS de corregir:\n' + JSON.stringify(after, null, 2));
  if (reportBefore) console.log('\nReporte ANTES de corregir (solo los datos de esta prueba):\n' + JSON.stringify(reportBefore, null, 2));
  if (reportAfter) console.log('\nReporte DESPUÉS de corregir:\n' + JSON.stringify(reportAfter, null, 2));
  console.log('\n| # | Prueba | Esperado | Obtenido | OK |\n| --- | --- | --- | --- | --- |');
  results.forEach((r, i) => console.log(`| ${i + 1} | ${r.name} | ${r.expected} | ${r.obtained} | ${r.ok ? 'Sí' : 'NO'} |`));
  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed}/${results.length} comprobaciones correctas.`);
  process.exitCode = passed === results.length ? 0 : 1;
}

main().catch(err => { console.error('Error:', err.message); process.exitCode = 1; });
