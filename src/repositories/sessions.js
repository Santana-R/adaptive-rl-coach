'use strict';

const { ApiError } = require('../middleware/auth');
const { requireClient } = require('./errors');

function unavailable() {
  return new ApiError(503, 'PROVIDER_UNAVAILABLE', 'No se pudieron consultar o guardar las sesiones.');
}

function toSessionError(error) {
  switch (error.code) {
    case 'P0002':
      return new ApiError(404, 'RESOURCE_NOT_FOUND', 'El recurso no existe.');
    case 'A2101':
      return new ApiError(422, 'INPUT_INVALID', 'El ejercicio no pertenece a la versión del plan.');
    case 'A2102':
      return new ApiError(409, 'SESSION_EXERCISE_COUNT', 'Para corregir el ejercicio o los minutos, la sesión debe tener un solo ejercicio.');
    case '22023':
      return new ApiError(400, 'INPUT_INVALID', 'Revisa los datos de la sesión.');
    default:
      return unavailable();
  }
}

async function callRpc(supabase, name, parameters) {
  requireClient(supabase);
  let result;
  try {
    result = await supabase.rpc(name, parameters);
  } catch {
    throw unavailable();
  }

  const { data, error } = result;
  if (error) throw toSessionError(error);
  if (!data || typeof data !== 'object') throw unavailable();
  return data;
}

async function listSessions(supabase, userId, sessionId = null) {
  const data = await callRpc(supabase, 'a21_consultar_sesiones', {
    p_id_usuario: userId,
    p_id_sesion: sessionId
  });

  if (!Array.isArray(data)) throw unavailable();
  return data;
}

function createSession(supabase, userId, session) {
  return callRpc(supabase, 'a21_crear_sesion', {
    p_id_usuario: userId,
    p_id_plan: session.plan_version_id,
    p_id_plan_ejercicio: session.plan_exercise_id,
    p_fecha_practica: session.performed_at,
    p_minutos: session.duration_minutes,
    p_notas: session.notes
  });
}

function updateSession(supabase, userId, sessionId, changes) {
  return callRpc(supabase, 'a21_corregir_sesion', {
    p_id_usuario: userId,
    p_id_sesion: sessionId,
    p_cambios: changes
  });
}

function deleteSession(supabase, userId, sessionId) {
  return callRpc(supabase, 'a21_eliminar_sesion', {
    p_id_usuario: userId,
    p_id_sesion: sessionId
  });
}

module.exports = { listSessions, createSession, updateSession, deleteSession };