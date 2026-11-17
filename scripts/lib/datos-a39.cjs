'use strict';

// A39 · Utilidades compartidas por scripts/auditoria-a39.cjs y scripts/seed-demo.cjs.
// Solo trabajan con perfiles de desarrollo (cuenta TEST_ o DEMO_).

const goals = require('../../src/repositories/goals');

const TEST_ACCOUNT = /^(TEST|DEMO)_[A-Z0-9_]+$/;

async function profileByAccount(supabase, account) {
  if (!TEST_ACCOUNT.test(account)) throw new Error(`La cuenta ${account} no es un perfil de desarrollo (TEST_ o DEMO_).`);
  const { data, error } = await supabase.from('perfiles').select('id_usuario, plataforma, zona_horaria')
    .eq('cuenta_juego_id', account).maybeSingle();
  if (error || !data) throw new Error(`No existe el perfil de desarrollo ${account}.`);
  return { account, userId: data.id_usuario, platform: data.plataforma, timezone: data.zona_horaria };
}

/** Replay sintético del perfil. goals/shots definen la eficiencia del bloque. */
function syntheticReplay(profile, { prefix, position, hash, goals: goalsCount, shots = 4, playedAt }) {
  return {
    position, file_name: `${prefix}-${position}.replay`, status: 'ok', upload_origin: 'own', visibility: 'private',
    access_verified: true, group_verified: true,
    file: { hash, size_bytes: 300000 + position, mode: '2v2', match_type: 'ranked', played_at: playedAt, duration_s: 300 },
    player: { platform: profile.platform, player_id: profile.account, time_played_s: 295 },
    metrics: { shots, goals: goalsCount, assists: 0, saves: 0, score: 100 },
  };
}

async function rows(query, what) {
  const { data, error } = await query;
  if (error) throw new Error(`No se pudo ${what}: ${error.message}`);
  return data ?? [];
}

async function remove(query, what) {
  const { error } = await query;
  if (error) throw new Error(`No se pudo borrar ${what}: ${error.message}`);
}

/**
 * Borra bloques propios con todo lo que cuelga de ellos: sesiones, planes, análisis, métricas,
 * replays y archivos. blockIds null = todos los bloques del usuario.
 */
async function removeBlocks(supabase, userId, blockIds = null) {
  let query = supabase.from('bloques').select('id_bloque').eq('id_usuario', userId);
  if (blockIds) query = query.in('id_bloque', blockIds.map(Number));
  const ids = (await rows(query, 'consultar los bloques')).map(r => r.id_bloque);
  if (!ids.length) return 0;

  const analysisIds = (await rows(supabase.from('analisis').select('id_analisis').in('id_bloque', ids), 'consultar los análisis')).map(r => r.id_analisis);
  if (analysisIds.length) {
    const planIds = (await rows(supabase.from('planes').select('id_plan').in('id_analisis', analysisIds), 'consultar los planes')).map(r => r.id_plan);
    if (planIds.length) {
      const { error } = await supabase.rpc('a31_borrar_sesiones_de_planes', { p_id_usuario: userId, p_ids_plan: planIds });
      if (error) throw new Error('No se pudieron borrar las sesiones: ' + error.message);
      await remove(supabase.from('plan_objetivo').delete().in('id_plan', planIds), 'plan_objetivo');
      await remove(supabase.from('plan_ejercicio').delete().in('id_plan', planIds), 'plan_ejercicio');
      await remove(supabase.from('planes').delete().in('id_plan', planIds), 'planes');
    }
    await remove(supabase.from('prioridades').delete().in('id_analisis', analysisIds), 'prioridades');
    await remove(supabase.from('analisis').delete().in('id_analisis', analysisIds), 'análisis');
  }

  const playerIds = (await rows(supabase.from('replays').select('id_jugador_replay').in('id_bloque', ids), 'consultar los replays')).map(r => r.id_jugador_replay);
  await remove(supabase.from('metricas_bloque').delete().in('id_bloque', ids), 'metricas_bloque');
  await remove(supabase.from('replays').delete().in('id_bloque', ids), 'replays');
  await remove(supabase.from('bloques').delete().in('id_bloque', ids), 'bloques');
  if (playerIds.length) {
    const fileIds = [...new Set((await rows(supabase.from('jugadores_replay').select('id_archivo').in('id_jugador_replay', playerIds), 'consultar los archivos')).map(r => r.id_archivo))];
    await remove(supabase.from('metricas_replay').delete().in('id_jugador_replay', playerIds), 'metricas_replay');
    await remove(supabase.from('jugadores_replay').delete().in('id_jugador_replay', playerIds), 'jugadores_replay');
    if (fileIds.length) await remove(supabase.from('archivos_replay').delete().in('id_archivo', fileIds), 'archivos_replay');
  }
  return ids.length;
}

/** Borra metas propias. Deben estar ya sin planes: a16_borrar_objetivo las borra con sus versiones. */
async function removeGoals(supabase, userId, goalIds = null) {
  const ids = goalIds ?? (await rows(supabase.from('objetivos').select('id_objetivo').eq('id_usuario', userId), 'consultar las metas')).map(r => r.id_objetivo);
  for (const id of ids.filter(Boolean)) {
    try { await goals.deleteGoal(supabase, userId, id); } catch (err) { if (err.status !== 404) throw err; }
  }
  return ids.length;
}

async function removeRanks(supabase, userId) {
  const ids = (await rows(supabase.from('rangos').select('id_rango').eq('id_usuario', userId), 'consultar los rangos')).map(r => r.id_rango);
  if (ids.length) await remove(supabase.from('rangos').delete().in('id_rango', ids), 'rangos');
  return ids.length;
}

/** Quita del catálogo un ejercicio de prueba con sus versiones. Solo para ejercicios sin uso en planes. */
async function removeExercise(supabase, exerciseId) {
  const versionIds = (await rows(supabase.from('ejercicio_versiones').select('id_ejercicio_version').eq('id_ejercicio', Number(exerciseId)), 'consultar el ejercicio')).map(r => r.id_ejercicio_version);
  if (versionIds.length) {
    await remove(supabase.from('ejercicio_plataforma').delete().in('id_ejercicio_version', versionIds), 'ejercicio_plataforma');
    await remove(supabase.from('ejercicio_versiones').delete().in('id_ejercicio_version', versionIds), 'ejercicio_versiones');
  }
  await remove(supabase.from('ejercicios').delete().eq('id_ejercicio', Number(exerciseId)), 'ejercicios');
}

/** Filas de a39_auditar_integridad, o un error claro si falta la migración. */
async function integrity(supabase) {
  const { data, error } = await supabase.rpc('a39_auditar_integridad');
  if (error) throw new Error('Falta ejecutar database/migraciones/a39-auditoria.sql (' + (error.code ?? error.message) + ').');
  return [...data].sort((a, b) => a.orden - b.orden).map(r => ({ check: r.consulta, invalid: Number(r.filas_invalidas) }));
}

async function requireSessionCleanup(supabase, userId) {
  const { error } = await supabase.rpc('a31_borrar_sesiones_de_planes', { p_id_usuario: userId, p_ids_plan: [] });
  if (error) throw new Error('Falta ejecutar database/migraciones/a31-historial-sesiones.sql (' + (error.code ?? error.message) + ').');
}

module.exports = { profileByAccount, syntheticReplay, removeBlocks, removeGoals, removeRanks, removeExercise, integrity, requireSessionCleanup };
