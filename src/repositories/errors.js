'use strict';

const { ApiError } = require('../middleware/auth');

/**
 * Traduce un error de Supabase/Postgres al formato de error de la API.
 * No incluye el mensaje original (puede llevar valores de columnas) en la respuesta.
 */
function toApiError(error, fallbackMessage) {
  switch (error?.code) {
    case '23505': // unique_violation
      return new ApiError(409, 'DUPLICATE_REPLAY', 'Ese replay ya está en el bloque.');
    case '23514': // check_violation
    case '23502': // not_null_violation
    case '22P02': // invalid_text_representation (p. ej. número no válido)
    case '22004': // null_value_not_allowed
      return new ApiError(422, 'INPUT_INVALID', 'Algún dato no cumple las reglas de la base de datos.');
    case '23503': // foreign_key_violation
      return new ApiError(422, 'INPUT_INVALID', 'El registro relacionado no existe.');
    default:
      return new ApiError(503, 'PROVIDER_UNAVAILABLE', fallbackMessage);
  }
}

function requireClient(supabase) {
  if (!supabase) throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'Supabase no está configurado.');
}

module.exports = { toApiError, requireClient };
