'use strict';

(function () {
  async function request(path, method = 'GET', body) {
    const client = window.CoachAuth?.getClient();
    const session = client && await client.auth.getSession();
    if (session?.error || !session?.data?.session?.access_token) {
      const error = new Error('Inicia sesión para consultar tus datos.');
      error.status = 401;
      throw error;
    }
    const options = {
      url: '/api/v1' + path, method, dataType: 'json', timeout: 20000,
      headers: { Authorization: 'Bearer ' + session.data.session.access_token }
    };
    if (body !== undefined) {
      options.contentType = 'application/json';
      options.data = JSON.stringify(body);
    }
    try {
      const response = await $.ajax(options);
      // Las respuestas sin el contrato no se convierten en listas vacías.
      if (!response || !Object.prototype.hasOwnProperty.call(response, 'data')) {
        throw new Error('El servicio devolvió una respuesta incompatible.');
      }
      return response.data;
    } catch (failure) {
      if (failure instanceof Error) {
        failure.uncertain = method !== 'GET';
        throw failure;
      }
      const messages = {
        401: 'Inicia sesión para consultar tus datos.',
        403: 'Tu cuenta no tiene permiso para esta operación.',
        404: 'El recurso o servicio no está disponible. En esta copia faltan las APIs A21/A22/A31.',
        429: 'Se alcanzó el límite de solicitudes. Espera antes de reintentar.'
      };
      const error = new Error(failure.responseJSON?.error?.message || messages[failure.status] || 'No se pudo contactar con el servidor.');
      error.status = failure.status;
      error.code = failure.responseJSON?.error?.code;
      error.uncertain = method !== 'GET' && (!failure.status || failure.status >= 500);
      throw error;
    }
  }

  const key = encodeURIComponent;
  window.CoachFollowupService = Object.freeze({
    request,
    sessions: query => request('/sessions' + (query ? '?' + query : '')),
    create: body => request('/sessions', 'POST', body),
    update: (id, body) => request('/sessions/' + key(id), 'PATCH', body),
    remove: id => request('/sessions/' + key(id), 'DELETE'),
    report: query => request('/reports?' + query),
    blocks: () => request('/blocks'),
    block: id => request('/blocks/' + key(id)),
    retry: id => request('/blocks/' + key(id) + '/retry', 'POST')
  });
}());
