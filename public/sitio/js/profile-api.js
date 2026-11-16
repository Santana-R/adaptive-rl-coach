'use strict';

(function () {
  let fallbackClient = null;

  function getClient() {
    if (window.CoachAuth?.getClient) {
      return window.CoachAuth.getClient();
    }

    const config = window.SUPABASE_CONFIG || {};

    if (
      !config.url ||
      !config.anonKey ||
      !window.supabase?.createClient
    ) {
      return null;
    }

    if (!fallbackClient) {
      fallbackClient = window.supabase.createClient(
        config.url,
        config.anonKey
      );
    }

    return fallbackClient;
  }

  async function request(method, profile) {
    const client = getClient();

    if (!client) {
      throw new Error(
        'Falta configurar la conexión de autenticación.'
      );
    }

    // Obtener el token vigente para cada petición.
    const { data, error } = await client.auth.getSession();

    if (error || !data.session) {
      const sessionError = new Error(
        'Tu sesión expiró. Vuelve a iniciar sesión.'
      );

      sessionError.status = 401;
      throw sessionError;
    }

    const options = {
      url: '/api/v1/profile',
      method,
      headers: {
        Authorization: `Bearer ${data.session.access_token}`
      },
      dataType: 'json',
      timeout: 15000
    };

    if (profile) {
      options.contentType = 'application/json';
      options.data = JSON.stringify(profile);
    }

    try {
      const response = await $.ajax(options);

      return response.data || response;
    } catch (xhr) {
      const apiError = xhr.responseJSON?.error;

      const requestError = new Error(
        apiError?.message ||
        'No se pudo conectar con el servidor. Comprueba que Express esté ejecutándose.'
      );

      requestError.status = xhr.status;
      requestError.details = apiError?.details || {};

      throw requestError;
    }
  }

  window.CoachProfileApi = {
    getClient,

    load: function () {
      return request('GET');
    },

    save: function (profile) {
      return request('PATCH', profile);
    }
  };
})();