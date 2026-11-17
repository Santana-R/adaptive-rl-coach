'use strict';

// A39 · Seed limpio de demo para un perfil de desarrollo.
//
// Requiere ejecutado en el SQL Editor (además de A08, A15, A16, A21, A24, A31 y las seeds):
//   database/migraciones/a31-historial-sesiones.sql
//   database/migraciones/a39-auditoria.sql
//
// Uso (desde la raíz del repo):
//   node --env-file=.env scripts/seed-demo.cjs                    crea los datos en TEST_B
//   node --env-file=.env scripts/seed-demo.cjs --reset            solo borra los datos de TEST_B
//   node --env-file=.env scripts/seed-demo.cjs --account TEST_A   usa otra cuenta TEST_ o DEMO_
//
// Primero borra los bloques, planes, sesiones, metas y rangos de la cuenta. Después crea los
// datos con los mismos repositorios que usan las rutas, así las relaciones salen de las reglas
// de la aplicación y no de filas escritas a mano. Al terminar ejecuta las consultas de
// integridad. Los replays son sintéticos: no vienen de Ballchasing.

const crypto = require('node:crypto');
const { createServerClient } = require('../src/services/supabase');
const blocks = require('../src/repositories/blocks');
const plans = require('../src/repositories/plans');
const goals = require('../src/repositories/goals');
const ranks = require('../src/repositories/ranks');
const sessions = require('../src/repositories/sessions');
const sessionRules = require('../src/domain/sessions');
const { parseCreate, parseEdit, todayIn } = require('../src/domain/goals');
const { parseRank } = require('../src/domain/ranks');
const { buildProposal } = require('../src/routes/plans');
const { createStoredAnalysisRepository } = require('../src/services/stored-block');
const { profileByAccount, syntheticReplay, removeBlocks, removeGoals, removeRanks, integrity, requireSessionCleanup } = require('./lib/datos-a39.cjs');

const DAY_MS = 86_400_000;
const daysAgo = days => new Date(Date.now() - days * DAY_MS);

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

/** Cinco replays con una hora de diferencia, a partir de `start`. goals suma los goles del bloque. */
function demoBlock(profile, prefix, start, goalsPerReplay) {
  return { mode: '2v2', match_type: 'ranked', status: 'ready',
    replays: goalsPerReplay.map((goalsCount, index) => syntheticReplay(profile, { prefix, position: index + 1,
      hash: crypto.randomBytes(32).toString('hex'), goals: goalsCount,
      playedAt: new Date(start.getTime() + index * 3_600_000).toISOString() })) };
}

async function wipe(supabase, profile) {
  const removedBlocks = await removeBlocks(supabase, profile.userId);
  const removedGoals = await removeGoals(supabase, profile.userId);
  const removedRanks = await removeRanks(supabase, profile.userId);
  console.log(`Borrado en ${profile.account}: ${removedBlocks} bloques, ${removedGoals} metas, ${removedRanks} rangos.`);
}

async function seed(supabase, profile) {
  const userId = profile.userId;
  const timezone = profile.timezone || 'America/Monterrey';
  const today = todayIn(timezone);
  const repository = createStoredAnalysisRepository(supabase);
  const req = { user: { id: userId } };
  const savePlan = async (blockId, goalIds) => {
    const built = await buildProposal({ supabase, repository, req, blockId, body: { goal_ids: goalIds, availability_minutes: 40 } });
    const saved = await plans.savePlan(supabase, { userId, blockId, ...built });
    const plan = await plans.getPlanVersion(supabase, userId, saved.plan_id, saved.version);
    if (!plan.exercises.length) throw new Error('El plan quedó sin ejercicios: revisa que el catálogo tenga ejercicios activos para la plataforma del perfil.');
    return plan;
  };

  // 1) Rango declarado.
  await ranks.addRank(supabase, userId, parseRank({ mode: '2v2', rank_label: 'platinum', division: 3, recorded_at: daysAgo(28).toISOString().slice(0, 10) }));
  await ranks.addRank(supabase, userId, parseRank({ mode: '2v2', rank_label: 'diamond', division: 1, recorded_at: daysAgo(7).toISOString().slice(0, 10) }));

  // 2) Metas. Se activan al crearse.
  const performance = await goals.saveGoalVersion(supabase, userId, null,
    parseCreate({ type: 'performance', mode: '2v2', name: 'Subir la eficiencia de tiro', target_value: 30 }, { today }), timezone);
  const training = await goals.saveGoalVersion(supabase, userId, null,
    parseCreate({ type: 'training', mode: '2v2', name: 'Practicar una hora', target_value: 60 }, { today }), timezone);
  const trainingSavedAt = Date.now();

  // 3) Primer bloque (25 % de tiro: 5 goles en 20 tiros) y su plan con la meta de rendimiento.
  //    Un plan solo enlaza metas de rendimiento; la de entrenamiento se evalúa con las sesiones.
  const first = await blocks.createBlock(supabase, userId, demoBlock(profile, 'demo-linea-base', daysAgo(14), [1, 1, 1, 1, 1]));
  const firstPlan = await savePlan(first.block_id, [performance.goal_id]);

  // 4) Sesiones sobre el primer plan. Se fechan después de activar la meta de entrenamiento
  //    (reloj de la base) para que cuenten en su periodo; por eso se esperan unos segundos.
  const activation = Date.parse(training.activated_at);
  await new Promise(resolve => setTimeout(resolve, Math.max(0, trainingSavedAt + 6000 - Date.now())));
  const exercise = index => firstPlan.exercises[index % firstPlan.exercises.length].plan_exercise_id;
  const addSession = (offsetMs, minutes, exerciseIndex, notes) => sessions.createSession(supabase, userId, sessionRules.parseCreate({
    plan_version_id: firstPlan.plan_version_id, plan_exercise_id: exercise(exerciseIndex),
    performed_at: new Date(activation + offsetMs).toISOString(), duration_minutes: minutes, notes,
  }, activation + 60_000));
  await addSession(1000, 20, 0, 'Demo: primera práctica del plan.');
  await addSession(2000, 25, 1, 'Demo: segunda práctica del plan.');
  const corrected = await addSession(3000, 15, 0, 'Demo: práctica corta.');
  await sessions.updateSession(supabase, userId, corrected.session_id,
    sessionRules.parsePatch({ duration_minutes: 20, notes: 'Demo: práctica corta, minutos corregidos.' }));
  const discarded = await addSession(4000, 10, 1, 'Demo: registro duplicado.');
  await sessions.deleteSession(supabase, userId, discarded.session_id);

  // 5) La meta de rendimiento sube a 35 % (versión 2). El primer plan conserva la versión 1.
  const { goal: edited } = parseEdit({ target_value: 35 }, performance);
  const performanceV2 = await goals.saveGoalVersion(supabase, userId, performance.goal_id, edited, timezone);

  // 6) Segundo bloque (30 % de tiro: 6 goles en 20 tiros) y su plan con la versión 2 de la meta.
  const second = await blocks.createBlock(supabase, userId, demoBlock(profile, 'demo-posterior', daysAgo(2), [2, 1, 1, 1, 1]));
  const secondPlan = await savePlan(second.block_id, [performance.goal_id]);

  const active = await sessions.listSessions(supabase, userId);
  return {
    bloques: [first.block_id, second.block_id],
    planes: [`${firstPlan.plan_id} (meta de rendimiento versión ${performance.version})`, `${secondPlan.plan_id} (meta de rendimiento versión ${performanceV2.version})`],
    metas: [`${performance.goal_id} rendimiento, ${performanceV2.versions.length} versiones`, `${training.goal_id} entrenamiento`],
    sesiones: `${active.length} activas, ${active.reduce((total, s) => total + s.duration_minutes, 0)} min; 1 borrada`,
    rangos: 2,
  };
}

async function main() {
  const supabase = createServerClient();
  if (!supabase) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.');
  const profile = await profileByAccount(supabase, argument('--account', 'TEST_B'));
  await requireSessionCleanup(supabase, profile.userId);
  await integrity(supabase);

  await wipe(supabase, profile);
  if (!process.argv.includes('--reset')) {
    let summary;
    try {
      summary = await seed(supabase, profile);
    } catch (error) {
      await wipe(supabase, profile);
      throw error;
    }
    console.log(`\nDatos de demo creados en ${profile.account}:\n` + JSON.stringify(summary, null, 2));
  }

  const checks = await integrity(supabase);
  const invalid = checks.filter(r => r.invalid > 0);
  console.log('\nIntegridad: ' + (invalid.length
    ? invalid.map(r => `${r.check} = ${r.invalid}`).join(', ')
    : `${checks.length} consultas, 0 filas inválidas.`));
  process.exitCode = invalid.length ? 1 : 0;
}

main().catch(err => { console.error('Error:', err.message); process.exitCode = 1; });
