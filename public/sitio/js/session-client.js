'use strict';

// Un único cliente por página, compartido por acceso, Perfil y navegación.
(() => {
  let client = null;

  function getClient() {
    if (client) {
      return client;
    }

    const config = window.SUPABASE_CONFIG || {};

    if (!config.url || !config.anonKey || !window.supabase?.createClient) {
      return null;
    }

    client = window.supabase.createClient(config.url, config.anonKey);
    return client;
  }

  window.CoachAuth = { getClient };
})();
