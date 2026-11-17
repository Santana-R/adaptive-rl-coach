'use strict';

// A31 · Prueba real contra Supabase dev: rango declarado + integridad del historial.
//
// Requiere ejecutado en el SQL Editor (además de lo de A16/A24/A32):
//   database/migraciones/a31-rangos.sql
//
// Uso (desde la raíz del repo):
//   node --env-file=.env scripts/prueba-a31.cjs
//
// Usa los perfiles de desarrollo TEST_A y TEST_B. Crea un bloque sintético, metas, rangos y un plan;
// después corrige la meta, el rango y el catálogo (desactivar/reactivar un ejercicio del plan) y
// comprueba que la versión guardada del plan no cambia. Al terminar borra todo lo que creó y deja
// el catálogo como estaba. Las correcciones de sesiones dependen de A21 y se marcan pendientes.

const crypto = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { createServerClient } = require('../src/services/supabase');
const blocks = require('../src/repositories/blocks');
const plans = require('../src/repositories/plans');
const goals = require('../src/repositories/goals');
const ranks = require('../src/repositories/ranks');
const admin = require('../src/repositories/exercises-admin');
const { parseCreate, parseEdit, todayIn } = require('../src/domain/goals');
const { parseRank } = require('../src/domain/ranks');
const { buildProposal } = require('../src/routes/plans');
const { createStoredAnalysisRepository } = require('../src/services/stored-block');

const results = [];
const pending = [];
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
  let before = null, after = null;

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

    // 4) Corregir meta, rango y catálogo.
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

    // 7) Propiedad del plan y de la meta.
    const foreignPlan = await plans.getPlanVersion(supabase, B, saved.plan_id, 1);
    check('B lee el plan de A', 'null (404)', foreignPlan === null, foreignPlan === null ? 'null' : 'devuelve el plan');
    const foreignGoal = await attempt(() => goals.saveGoalVersion(supabase, B, goal.goal_id, edited, TZ));
    check('B corrige la meta de A', '404 RESOURCE_NOT_FOUND', foreignGoal === '404 RESOURCE_NOT_FOUND', foreignGoal);

    pending.push('Corregir una sesión (sesion_versiones) y comprobar el plan/reportes: depende de A21 (sesiones, Tadeo).');
    pending.push('Coherencia con reportes: depende de A22 (reportes, Tadeo). GET /api/v1/rank-history ya entrega el rango separado.');
  } finally {
    await cleanup(supabase, created);
    console.log('\nDatos de prueba borrados y catálogo restaurado.');
  }

  if (before) console.log('\nPlan versión 1 ANTES de corregir meta, rango y catálogo:\n' + JSON.stringify(before, null, 2));
  if (after) console.log('\nPlan versión 1 DESPUÉS de corregir:\n' + JSON.stringify(after, null, 2));
  console.log('\n| # | Prueba | Esperado | Obtenido | OK |\n| --- | --- | --- | --- | --- |');
  results.forEach((r, i) => console.log(`| ${i + 1} | ${r.name} | ${r.expected} | ${r.obtained} | ${r.ok ? 'Sí' : 'NO'} |`));
  if (pending.length) console.log('\nPendiente (no cuenta como fallo):\n' + pending.map(p => '- ' + p).join('\n'));
  const passed = results.filter(r => r.ok).length;
  console.log(`\n${passed}/${results.length} comprobaciones correctas.`);
  process.exitCode = passed === results.length ? 0 : 1;
}

main().catch(err => { console.error('Error:', err.message); process.exitCode = 1; });
