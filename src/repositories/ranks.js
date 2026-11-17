'use strict';

// A31 · Historial de rango declarado (tabla rangos). Solo inserción: la migración
// database/migraciones/a31-rangos.sql impide UPDATE. Siempre filtra por el usuario de la sesión.

const { ApiError } = require('../middleware/auth');
const { requireClient, toApiError } = require('./errors');
const { MODES } = require('../domain/goals');

const SELECT = 'id_rango, modalidad, temporada, rango, division, fecha_registro, fuente';

function toEntry(row) {
  return {
    rank_id: String(row.id_rango), mode: row.modalidad, rank_label: row.rango, division: row.division ?? null,
    season: row.temporada, recorded_at: new Date(row.fecha_registro).toISOString(), source: row.fuente,
  };
}

// Más reciente primero; a igual fecha gana el registrado después (id mayor).
const newestFirst = (a, b) => b.recorded_at.localeCompare(a.recorded_at) || Number(b.rank_id) - Number(a.rank_id);

/** Historial del usuario (todas las modalidades o una) y el rango vigente por modalidad. */
async function listRanks(supabase, userId, { mode } = {}) {
  requireClient(supabase);
  let query = supabase.from('rangos').select(SELECT).eq('id_usuario', userId);
  if (mode) query = query.eq('modalidad', mode);
  const { data, error } = await query;
  if (error) throw toApiError(error, 'No se pudo consultar el historial de rango.');
  const entries = (data || []).map(toEntry).sort(newestFirst);
  const modes = mode ? [mode] : MODES;
  const current = Object.fromEntries(modes.map(m => [m, entries.find(e => e.mode === m) ?? null]));
  return { entries, current };
}

/** Rango vigente de una modalidad (el último declarado hasta `at`), o null. Lo usa el generador. */
async function latestRank(supabase, userId, mode, at = new Date()) {
  requireClient(supabase);
  const { data, error } = await supabase.from('rangos').select(SELECT)
    .eq('id_usuario', userId).eq('modalidad', mode).lte('fecha_registro', at.toISOString())
    .order('fecha_registro', { ascending: false }).order('id_rango', { ascending: false }).limit(1);
  if (error) throw toApiError(error, 'No se pudo consultar el rango declarado.');
  const row = Array.isArray(data) ? data[0] : data;
  return row ? toEntry(row) : null;
}

/** Inserta un registro nuevo. `entry` viene de parseRank (domain/ranks.js). */
async function addRank(supabase, userId, entry) {
  requireClient(supabase);
  const { data, error } = await supabase.from('rangos').insert({
    id_usuario: userId, modalidad: entry.mode, temporada: entry.season, rango: entry.rank_label,
    division: entry.division, fecha_registro: entry.recorded_at, fuente: entry.source,
  }).select(SELECT).single();
  if (error) throw toApiError(error, 'No se pudo guardar el rango.');
  if (!data) throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'El rango se guardó, pero no se pudo leer.');
  return toEntry(data);
}

module.exports = { listRanks, latestRank, addRank, toEntry };
