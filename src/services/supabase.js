'use strict';

const { createClient } = require('@supabase/supabase-js');

/**
 * Cliente de Supabase solo para el servidor. Usa la clave privada (service_role o secret),
 * que ignora RLS: por eso cada ruta filtra por req.user.id. Nunca se envía al navegador.
 * Devuelve null si faltan variables, para que la demo estática siga funcionando sin .env.
 */
function createServerClient(env = process.env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

module.exports = { createServerClient };
