'use strict';

// A32 · Operaciones administrativas del catálogo. La lista sigue siendo getCatalog (A23); aquí se
// consultan el detalle con historial y las escrituras (a32_guardar_ejercicio / a32_borrar_ejercicio).

const { ApiError } = require('../middleware/auth');
const { requireClient, toApiError } = require('./errors');
const { normalizeCatalog } = require('../domain/catalog');
const { toRow } = require('../domain/exercise-admin');
const CONTENT = require('../../planning/catalogo-ejercicios.v1.json');
const VERIFICATION = require('../../planning/catalogo-verificacion.v1.json');

const ID = /^[1-9]\d{0,17}$/;
const notFound = () => new ApiError(404, 'RESOURCE_NOT_FOUND', 'El recurso no existe.');
const SELECT = `id_ejercicio, activo, eliminado_en,
  ejercicio_versiones ( id_ejercicio_version, version, nombre, categoria, tipo_recurso, codigo_enlace,
    finalidad, instrucciones, meta, dificultad_base, minutos_base, creado_en,
    ejercicio_plataforma ( plataforma ) )`;

/** Fila de ejercicio_versiones → ficha de la API (la misma forma que reciben POST/PATCH). */
function toFicha(version) {
  return {
    title: version.nombre, priority_key: version.categoria, resource_type: version.tipo_recurso,
    resource: version.codigo_enlace, purpose: version.finalidad,
    instructions: version.instrucciones.split('\n').filter(line => line.trim()),
    success_criterion: version.meta, difficulty_base: version.dificultad_base,
    reference_duration_minutes: version.minutos_base,
    platforms: (version.ejercicio_plataforma ?? []).map(p => p.plataforma).sort(),
  };
}

/** Detalle con estado de revisión (mismo criterio que el generador) e historial de versiones. */
async function getExercise(supabase, exerciseId, { content = CONTENT, verification = VERIFICATION } = {}) {
  requireClient(supabase);
  if (!ID.test(String(exerciseId))) return null;
  const { data, error } = await supabase.from('ejercicios').select(SELECT)
    .eq('id_ejercicio', exerciseId).is('eliminado_en', null).maybeSingle();
  if (error) throw toApiError(error, 'No se pudo consultar el ejercicio.');
  if (!data || !(data.ejercicio_versiones ?? []).length) return null;
  const [normalized] = normalizeCatalog([data], content, verification).exercises;
  const versions = [...data.ejercicio_versiones].sort((a, b) => a.version - b.version);
  return {
    exercise_id: normalized.exercise_id, exercise_version_id: normalized.exercise_version_id,
    exercise_key: normalized.exercise_key, version: normalized.content_version,
    active: normalized.active, technical_review_status: normalized.technical_review_status,
    ficha: toFicha(versions.at(-1)),
    versions: versions.map(v => ({ exercise_version_id: String(v.id_ejercicio_version), version: v.version,
      created_at: v.creado_en, ...toFicha(v) })),
  };
}

function rpcError(error, fallback) {
  if (error?.code === 'P0002') return notFound();
  return toApiError(error, fallback);
}

/** Crea (exerciseId null) o agrega la versión siguiente. Queda inactivo. Devuelve el detalle. */
async function saveExercise(supabase, exerciseId, ficha, options) {
  requireClient(supabase);
  if (exerciseId !== null && !ID.test(String(exerciseId))) throw notFound();
  const { data, error } = await supabase.rpc('a32_guardar_ejercicio', {
    p_id_ejercicio: exerciseId === null ? null : Number(exerciseId), p_ficha: toRow(ficha),
  });
  if (error) throw rpcError(error, 'No se pudo guardar el ejercicio.');
  const saved = await getExercise(supabase, data.id_ejercicio, options);
  if (!saved) throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'El ejercicio se guardó, pero no se pudo leer.');
  return saved;
}

/** Activa/desactiva. Activar exige revisión técnica verificada de la versión vigente. */
async function setActive(supabase, exerciseId, active, options) {
  const current = await getExercise(supabase, exerciseId, options);
  if (!current) throw notFound();
  if (active && current.technical_review_status !== 'verified') {
    throw new ApiError(409, 'EXERCISE_NOT_VERIFIED',
      'Solo se puede activar un ejercicio cuya versión vigente coincide con una ficha revisada y verificada.');
  }
  if (current.active === active) return { exercise: current, changed: false };
  const { error } = await supabase.from('ejercicios').update({ activo: active })
    .eq('id_ejercicio', Number(exerciseId)).is('eliminado_en', null);
  if (error) throw toApiError(error, 'No se pudo cambiar el estado del ejercicio.');
  return { exercise: await getExercise(supabase, exerciseId, options), changed: true };
}

/** 'deactivated' | 'already_inactive' | 'deleted'. */
async function deleteExercise(supabase, exerciseId) {
  requireClient(supabase);
  if (!ID.test(String(exerciseId))) throw notFound();
  const { data, error } = await supabase.rpc('a32_borrar_ejercicio', { p_id_ejercicio: Number(exerciseId) });
  if (error) throw rpcError(error, 'No se pudo borrar el ejercicio.');
  return data;
}

module.exports = { getExercise, saveExercise, setActive, deleteExercise, toFicha };
