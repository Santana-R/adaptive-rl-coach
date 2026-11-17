'use strict';

// A16 · Metas en Supabase (objetivos + objetivo_versiones).
// Escribir: a16_guardar_version / a16_borrar_objetivo (database/migraciones/a16-objetivos.sql).
// Leer: solo metas del usuario de la sesión. La versión vigente es la activada más reciente,
// igual que la toma A18 (src/repositories/plan-goals.js).

const { ApiError } = require('../middleware/auth');
const { requireClient, toApiError } = require('./errors');
const { TYPES, TYPE_FROM_SQL } = require('../domain/goals');

const ID = /^[1-9]\d{0,17}$/;
const one = value => Array.isArray(value) ? value[0] : value;
const SELECT = 'id_objetivo, tipo, modalidad, estado, archivado_en, objetivo_versiones(id_objetivo_version, version, ' +
  'nombre, comparador, valor_meta, fecha_inicio, fecha_limite, zona_horaria, activada_en, creado_en, metricas(codigo, unidad))';

function toVersion(row) {
  const metric = one(row.metricas);
  return {
    goal_version_id: String(row.id_objetivo_version), version: row.version, name: row.nombre,
    metric_key: metric?.codigo ?? null, unit: metric?.unidad ?? null, comparator: row.comparador,
    target_value: Number(row.valor_meta), start_date: row.fecha_inicio, due_date: row.fecha_limite ?? null,
    timezone: row.zona_horaria, activated_at: row.activada_en, created_at: row.creado_en,
  };
}

/** Fila de objetivos → goal del contrato. withHistory agrega todas las versiones (1, 2, …). */
function toGoal(row, { withHistory = false } = {}) {
  const versions = (row.objetivo_versiones || []).filter(v => v.activada_en != null)
    .sort((a, b) => a.version - b.version).map(toVersion);
  const current = versions.at(-1);
  if (!current) return null; // Sin versión activada (no la crea A16): no se expone a medias.
  return {
    goal_id: String(row.id_objetivo), type: TYPE_FROM_SQL[row.tipo] ?? row.tipo, mode: row.modalidad,
    status: row.estado === 'activo' && row.archivado_en == null ? 'active' : 'archived',
    archived_at: row.archivado_en ?? null, ...current,
    ...(withHistory ? { versions } : {}),
  };
}

function rpcError(error, fallback) {
  switch (error?.code) {
    case 'P0002': return new ApiError(404, 'RESOURCE_NOT_FOUND', 'El recurso no existe.');
    case '23505': return new ApiError(409, 'GOAL_ACTIVE_EXISTS', 'Ya tienes una meta activa de ese tipo en esa modalidad. Edítala o archívala primero.');
    case 'A1601': return new ApiError(409, 'GOAL_ARCHIVED', 'La meta está archivada y no se puede editar.');
    case 'A1602': return new ApiError(503, 'GOAL_METRIC_NOT_CONFIGURED', 'La métrica de esta meta todavía no está cargada.');
    default: return toApiError(error, fallback);
  }
}

async function listGoals(supabase, userId, { status = 'active', mode } = {}) {
  requireClient(supabase);
  let query = supabase.from('objetivos').select(SELECT).eq('id_usuario', userId);
  if (status === 'active') query = query.eq('estado', 'activo');
  else if (status === 'archived') query = query.eq('estado', 'archivado');
  if (mode) query = query.eq('modalidad', mode);
  const { data, error } = await query;
  if (error) throw toApiError(error, 'No se pudieron consultar las metas.');
  return (data || []).map(row => toGoal(row)).filter(Boolean).sort((a, b) => Number(a.goal_id) - Number(b.goal_id));
}

/** Meta propia con su historial, o null si no existe o es ajena. */
async function getGoal(supabase, userId, goalId) {
  requireClient(supabase);
  if (!ID.test(String(goalId))) return null;
  const { data, error } = await supabase.from('objetivos').select(SELECT)
    .eq('id_usuario', userId).eq('id_objetivo', goalId).maybeSingle();
  if (error) throw toApiError(error, 'No se pudo consultar la meta.');
  return data ? toGoal(data, { withHistory: true }) : null;
}

/** Crea (goalId null) o agrega la versión siguiente. Devuelve la meta guardada con historial. */
async function saveGoalVersion(supabase, userId, goalId, goal, timezone) {
  requireClient(supabase);
  if (goalId !== null && !ID.test(String(goalId))) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'El recurso no existe.');
  const { data, error } = await supabase.rpc('a16_guardar_version', {
    p_id_usuario: userId,
    p_id_objetivo: goalId === null ? null : Number(goalId),
    p_meta: {
      tipo: TYPES[goal.type].sql, modalidad: goal.mode, metric_key: goal.metric_key, nombre: goal.name,
      comparador: goal.comparator, valor_meta: goal.target_value, fecha_inicio: goal.start_date,
      fecha_limite: goal.due_date, zona_horaria: timezone,
    },
  });
  if (error) throw rpcError(error, 'No se pudo guardar la meta.');
  const saved = await getGoal(supabase, userId, data.id_objetivo);
  if (!saved) throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'La meta se guardó, pero no se pudo leer.');
  return saved;
}

/** 'archived' | 'already_archived' | 'deleted'. */
async function deleteGoal(supabase, userId, goalId) {
  requireClient(supabase);
  if (!ID.test(String(goalId))) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'El recurso no existe.');
  const { data, error } = await supabase.rpc('a16_borrar_objetivo', { p_id_usuario: userId, p_id_objetivo: Number(goalId) });
  if (error) throw rpcError(error, 'No se pudo borrar la meta.');
  return data;
}

module.exports = { listGoals, getGoal, saveGoalVersion, deleteGoal, toGoal };
