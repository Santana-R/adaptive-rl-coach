'use strict';

const { createClient } = require('@supabase/supabase-js');

/**
 * Cliente de Supabase solo para el servidor. Usa la clave privada (service_role o secret),
 * que ignora RLS: por eso cada ruta filtra por req.user.id. Nunca se envía al navegador.
 * Devuelve null si faltan variables, para que la demo estática siga funcionando sin .env.
 */
function createServerClient(env = process.env) {
  const url = env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

// Solo acepta claves de uso público; evita publicar una clave privada colocada por error
// en SUPABASE_ANON_KEY. El formato de una clave legacy no acredita su validez remota.
function isPublicKey(key) {
  if (/^sb_publishable_[\w-]+$/.test(key)) return true;
  try {
    const parts = key.split('.');
    return parts.length === 3 &&
      JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')).role === 'anon';
  } catch {
    return false;
  }
}

function getPublicConfig(env = process.env) {
  const disabled = { url: '', anonKey: '' };
  const url = env.SUPABASE_URL?.trim() || '';
  const anonKey = env.SUPABASE_ANON_KEY?.trim() || '';
  if (!isPublicKey(anonKey) || anonKey === env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      anonKey === env.BALLCHASING_TOKEN?.trim()) return disabled;
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password ||
        parsed.search || parsed.hash) return disabled;
    return { url: url.replace(/\/+$/, ''), anonKey };
  } catch {
    return disabled;
  }
}

module.exports = { createServerClient, getPublicConfig };
