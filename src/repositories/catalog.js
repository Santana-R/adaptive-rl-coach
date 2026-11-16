'use strict';

// A23 · Consulta del catálogo sobre ejercicios, ejercicio_versiones y ejercicio_plataforma.
const { ApiError } = require('../middleware/auth');
const { normalizeCatalog } = require('../domain/catalog');
const CONTENT = require('../../planning/catalogo-ejercicios.v1.json');
const VERIFICATION = require('../../planning/catalogo-verificacion.v1.json');

const SELECT = `id_ejercicio, activo, eliminado_en,
  ejercicio_versiones ( id_ejercicio_version, version, nombre, categoria, tipo_recurso, codigo_enlace,
    finalidad, instrucciones, meta, dificultad_base, minutos_base,
    ejercicio_plataforma ( plataforma ) )`;

/**
 * Devuelve el catálogo normalizado para generatePlan.
 * includeInactive: false (jugador) devuelve solo ejercicios activos; true (admin) también inactivos.
 * Los eliminados (eliminado_en) nunca se devuelven.
 */
async function getCatalog(supabase, { includeInactive = false, content = CONTENT, verification = VERIFICATION } = {}) {
  if (!supabase) throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'Supabase no está configurado.');
  let query = supabase.from('ejercicios').select(SELECT).is('eliminado_en', null);
  if (!includeInactive) query = query.eq('activo', true);
  const { data, error } = await query;
  if (error) throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'No se pudo consultar el catálogo.');
  return normalizeCatalog(data ?? [], content, verification);
}

module.exports = { getCatalog };
