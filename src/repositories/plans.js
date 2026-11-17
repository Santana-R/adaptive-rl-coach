'use strict';

// A24 · Versiones del plan en Supabase.
//   plan_id         = analisis.id_analisis (una línea de versiones por bloque)
//   plan_version_id = planes.id_plan       (fila inmutable; A21 vincula sesiones aquí)
// Escribir: a24_guardar_plan (database/migraciones/a24-planes.sql), una transacción.
// Leer: solo planes cuyo bloque pertenece al usuario de la sesión.

const { ApiError } = require('../middleware/auth');
const { requireClient, toApiError } = require('./errors');
const { toStoredAnalysis, toStoredRuleId } = require('./analysis');

const STATUS = { complete: 'completo', partial: 'parcial', empty: 'no_disponible' };
const ID = /^[1-9]\d{0,17}$/;
const notFound = () => new ApiError(404, 'RESOURCE_NOT_FOUND', 'El recurso no existe.');

// Lo que se guarda en planes.contexto: la propuesta tal como se generó, sin los IDs
// (los asigna la base) ni la marca de propuesta sin guardar.
function toContext(proposal) {
  const { plan_id, plan_version_id, version, ...rest } = structuredClone(proposal);
  return {
    ...rest,
    exercises: rest.exercises.map(({ plan_exercise_id, ...exercise }) => exercise),
    limitations: (rest.limitations || []).filter(item => item !== 'unpersisted_proposal'),
  };
}

/** Argumentos de a24_guardar_plan. Lanza 422 si la propuesta no cabe en el esquema. */
function toSaveArgs({ userId, blockId, proposal, analysis, profile }) {
  if (!ID.test(String(blockId))) throw notFound();
  if (!Number.isInteger(proposal.availability_minutes) || proposal.availability_minutes < 1) {
    throw new ApiError(422, 'PLAN_NOT_PERSISTABLE', 'Para guardar un plan indica al menos 1 minuto disponible.');
  }
  if (proposal.exercises.some(e => !ID.test(String(e.exercise_version_id ?? '')))) {
    // Rutinas nativas de boost (exercise_version_id null): todavía no son filas de ejercicio_versiones.
    throw new ApiError(422, 'PLAN_NOT_PERSISTABLE', 'La propuesta incluye rutinas que todavía no están en el catálogo guardado.');
  }
  const days = profile?.days_per_week;
  if (!Number.isInteger(days) || days < 1 || days > 7) {
    throw new ApiError(422, 'PROFILE_REQUIRED', 'Revisa los días disponibles en tu perfil.');
  }
  return {
    p_id_usuario: userId,
    p_id_bloque: Number(blockId),
    p_analisis: toStoredAnalysis(analysis),
    p_plan: {
      estado: STATUS[proposal.coverage],
      plataforma_destino: proposal.profile_snapshot.platform,
      minutos_disponibles: proposal.availability_minutes,
      dias_disponibles: days,
      // El perfil no distingue sesiones de días; se toma una sesión por día disponible.
      sesiones_semana: days,
      justificacion: proposal.explanation,
      contexto: toContext(proposal),
      ejercicios: proposal.exercises.map(e => ({ orden: e.order, rule_id: toStoredRuleId(e.rule_id, analysis.rules_version),
        id_ejercicio_version: Number(e.exercise_version_id), minutos: e.assigned_minutes, dificultad: e.difficulty })),
      objetivos: proposal.goals_snapshot.map(g => Number(g.goal_version_id)),
    },
  };
}

function rpcError(error) {
  switch (error?.code) {
    case 'P0002': return notFound();
    case 'A2401': return new ApiError(503, 'RULES_NOT_CONFIGURED', 'Las reglas de esta versión todavía no están cargadas.');
    case 'A2402': return new ApiError(409, 'ANALYSIS_CONFLICT', 'Este bloque ya tiene un análisis guardado con otras prioridades.');
    case '23505': return new ApiError(409, 'PLAN_VERSION_CONFLICT', 'Otra versión se guardó al mismo tiempo. Intenta de nuevo.');
    default: return toApiError(error, 'No se pudo guardar el plan.');
  }
}

/** Guarda la propuesta como versión siguiente del plan del bloque. Devuelve { plan_id, version }. */
async function savePlan(supabase, args) {
  requireClient(supabase);
  const { data, error } = await supabase.rpc('a24_guardar_plan', toSaveArgs(args));
  if (error) throw rpcError(error);
  return { plan_id: String(data.id_analisis), plan_version_id: String(data.id_plan), version: data.version,
    analysis_created: data.analisis_creado };
}

// analisis tiene dos FK a bloques (id_bloque e id_bloque_base): se nombra la del bloque analizado.
const LINEAGE = 'id_analisis, id_bloque, bloques!fk_analisis_id_bloque!inner(id_usuario), planes(id_plan, version, estado, ' +
  'minutos_disponibles, dias_disponibles, sesiones_semana, justificacion, contexto, creado_en, ' +
  'plan_ejercicio(id_plan_ejercicio, orden, minutos, dificultad, id_ejercicio_version), plan_objetivo(id_objetivo_version))';

/** Línea de versiones propia, o null si no existe o es ajena (la ruta responde el mismo 404). */
async function getLineageBy(supabase, userId, column, id) {
  requireClient(supabase);
  if (!ID.test(String(id))) return null;
  const { data, error } = await supabase.from('analisis').select(LINEAGE)
    .eq(column, id).eq('bloques.id_usuario', userId).maybeSingle();
  if (error) throw toApiError(error, 'No se pudo consultar el plan.');
  const owner = Array.isArray(data?.bloques) ? data.bloques[0]?.id_usuario : data?.bloques?.id_usuario;
  if (!data || owner !== userId) return null;
  return { plan_id: String(data.id_analisis), block_id: String(data.id_bloque),
    versions: [...(data.planes || [])].sort((a, b) => a.version - b.version) };
}

// A27: lectura de la línea por ID de plan o por bloque, siempre con propietario.
function getLineage(supabase, userId, planId) {
  return getLineageBy(supabase, userId, 'id_analisis', planId);
}

async function getPlanForBlock(supabase, userId, blockId) {
  const lineage = await getLineageBy(supabase, userId, 'id_bloque', blockId);
  if (!lineage || !lineage.versions.length) return null;
  return toPlanVersion(lineage, lineage.versions.at(-1));
}

/** Fila de planes → plan-version del contrato. Lo relacional (orden/minutos/dificultad/versión) manda. */
function toPlanVersion(lineage, row) {
  const context = row.contexto || {};
  const byOrder = new Map((row.plan_ejercicio || []).map(pe => [pe.orden, pe]));
  const exercises = (context.exercises || []).map(exercise => {
    const pe = byOrder.get(exercise.order);
    if (!pe) throw new ApiError(503, 'PLAN_INTEGRITY', 'La versión guardada está incompleta.');
    return { ...exercise, plan_exercise_id: String(pe.id_plan_ejercicio), order: pe.orden,
      assigned_minutes: pe.minutos, difficulty: pe.dificultad, exercise_version_id: String(pe.id_ejercicio_version) };
  });
  if (exercises.length !== byOrder.size) throw new ApiError(503, 'PLAN_INTEGRITY', 'La versión guardada está incompleta.');
  return {
    ...context,
    plan_id: lineage.plan_id, plan_version_id: String(row.id_plan), version: row.version, block_id: lineage.block_id,
    status: row.estado, availability_minutes: row.minutos_disponibles,
    days_per_week: row.dias_disponibles, sessions_per_week: row.sesiones_semana,
    goal_version_ids: (row.plan_objetivo || []).map(po => String(po.id_objetivo_version)).sort(),
    exercises, created_at: row.creado_en,
  };
}

/** Versión concreta (o la más reciente si version es undefined). null si no existe/ajena. */
async function getPlanVersion(supabase, userId, planId, version) {
  const lineage = await getLineage(supabase, userId, planId);
  if (!lineage || !lineage.versions.length) return null;
  const row = version === undefined ? lineage.versions.at(-1) : lineage.versions.find(v => v.version === version);
  return row ? toPlanVersion(lineage, row) : null;
}

async function listPlanVersions(supabase, userId, planId) {
  const lineage = await getLineage(supabase, userId, planId);
  if (!lineage) return null;
  return lineage.versions.map(row => ({
    plan_id: lineage.plan_id, plan_version_id: String(row.id_plan), version: row.version, block_id: lineage.block_id,
    status: row.estado, coverage: row.contexto?.coverage ?? null, availability_minutes: row.minutos_disponibles,
    assigned_minutes: row.contexto?.assigned_minutes ?? null, created_at: row.creado_en,
  }));
}

module.exports = { savePlan, getPlanForBlock, getLineage, getPlanVersion, listPlanVersions, toSaveArgs, toContext, toPlanVersion, STATUS };
