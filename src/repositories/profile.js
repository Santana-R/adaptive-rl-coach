'use strict';

const { ApiError } = require('../middleware/auth');
const { toApiError, requireClient } = require('./errors');

// Mapeo perfiles (SQL) ↔ profile (API). Ver docs/a15-persistencia.md.
const FIELDS = [
  // [columna SQL, clave API]
  ['gamertag', 'gamertag'],
  ['plataforma', 'platform'],
  ['cuenta_juego_id', 'player_id'],
  ['modalidad_principal', 'mode'],
  ['minutos_sesion', 'available_minutes'],
  ['dias_semana', 'days_per_week'],
  ['zona_horaria', 'timezone'],
];
const COLUMNS = ['id_usuario', ...FIELDS.map(([col]) => col)].join(', ');

function toProfile(row) {
  if (!row) return null;
  const profile = { id: row.id_usuario };
  for (const [col, key] of FIELDS) profile[key] = row[col] ?? null;
  return profile;
}

/**
 * Convierte el profile de la API en fila SQL. El id siempre es el de la sesión:
 * un id/user_id enviado por el cliente se ignora.
 */
function toProfileRow(userId, profile) {
  const row = { id_usuario: userId };
  const missing = [];
  for (const [col, key] of FIELDS) {
    const value = typeof profile?.[key] === 'string' ? profile[key].trim() : profile?.[key];
    if (value === undefined || value === null || value === '') missing.push(key);
    else row[col] = value;
  }
  if (missing.length) {
    throw new ApiError(422, 'INPUT_INVALID', `Faltan datos del perfil: ${missing.join(', ')}.`);
  }
  return row;
}

async function getProfile(supabase, userId) {
  requireClient(supabase);
  const { data, error } = await supabase
    .from('perfiles')
    .select(COLUMNS)
    .eq('id_usuario', userId)
    .maybeSingle();
  if (error) throw toApiError(error, 'No se pudo consultar el perfil.');
  return toProfile(data);
}

/** Crea o reemplaza el perfil del usuario de la sesión (una fila por usuario). */
async function saveProfile(supabase, userId, profile) {
  requireClient(supabase);
  const row = toProfileRow(userId, profile);
  const { data, error } = await supabase
    .from('perfiles')
    .upsert(row, { onConflict: 'id_usuario' })
    .select(COLUMNS)
    .single();
  if (error) throw toApiError(error, 'No se pudo guardar el perfil.');
  return toProfile(data);
}

module.exports = { getProfile, saveProfile, toProfile, toProfileRow, PROFILE_FIELDS: FIELDS };
