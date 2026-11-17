'use strict';

// Fuente única: API autenticada de A16. No usa fixtures ni almacenamiento local.
(function () {
  async function request(path, method = 'GET', body) {
    const client = window.CoachAuth?.getClient();

    if (!client) {
      throw new Error('Falta configurar la conexión de autenticación.');
    }

    const { data, error } = await client.auth.getSession();

    if (error || !data?.session) {
      const expired = new Error('Inicia sesión para consultar tus objetivos.');
      expired.status = 401;
      throw expired;
    }

    const options = {
      url: '/api/v1/goals' + path,
      method,
      headers: { Authorization: 'Bearer ' + data.session.access_token },
      dataType: 'json',
      timeout: 15000
    };

    if (body !== undefined) {
      options.contentType = 'application/json';
      options.data = JSON.stringify(body);
    }

    let response;

    try {
      response = await $.ajax(options);
    } catch (xhr) {
      const failure = xhr.responseJSON?.error;
      let message = failure?.message;

      if (!message) {
        if (xhr.status === 401) {
          message = 'Tu sesión expiró. Vuelve a iniciar sesión.';
        } else if (xhr.status === 403) {
          message = 'Tu cuenta no tiene acceso a esta operación.';
        } else if (xhr.status === 0 && method !== 'GET') {
          message = 'No se pudo confirmar la operación. Vuelve a consultar antes de repetirla: el servidor podría haberla recibido.';
        } else {
          message = 'No se pudo conectar con Objetivos. Comprueba que Express esté ejecutándose.';
        }
      }

      const requestError = new Error(message);
      requestError.status = xhr.status;
      requestError.code = failure?.code;
      throw requestError;
    }

    if (!response || !Object.prototype.hasOwnProperty.call(response, 'data')) {
      throw new Error('Respuesta no reconocida. Vuelve a consultar antes de repetir la operación.');
    }

    return response;
  }

  function pathFor(id) {
    return '/' + encodeURIComponent(String(id));
  }

  window.CoachGoalsService = {
    async list() {
      const response = await request('?status=all');
      if (!Array.isArray(response.data)) throw new Error('El servidor no devolvió una lista de objetivos.');
      return response.data;
    },

    async get(id) {
      return (await request(pathFor(id))).data;
    },

    create(data) {
      return request('', 'POST', data);
    },

    update(id, data) {
      return request(pathFor(id), 'PATCH', data);
    },

    async remove(id) {
      const response = await request(pathFor(id), 'DELETE');
      if (!['archived', 'already_archived', 'deleted'].includes(response.data?.effect)) {
        throw new Error('No se pudo confirmar el efecto de la retirada. Vuelve a consultar la lista.');
      }
      return response.data;
    }
  };
})();
