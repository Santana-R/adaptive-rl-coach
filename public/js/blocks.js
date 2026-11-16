(function (root) {
  'use strict';

  const labels = {
    pending: 'Pendiente', processing: 'Procesando', invalid: 'Inválido',
    failed: 'Fallido', ready: 'Listo'
  };
  const endpoint = '/api/v1/blocks';

  async function request(path = '', { method = 'GET', body } = {}) {
    const client = root.CoachProfileApi?.getClient();
    if (!client) throw new Error('No se pudo iniciar la conexión de autenticación.');
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session?.access_token) {
      throw new Error('Inicia sesión para cargar o consultar tus replays.');
    }

    const response = await fetch(endpoint + path, {
      method, body, headers: { Authorization: 'Bearer ' + data.session.access_token }
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      throw new Error(payload?.error?.message || 'No se pudo completar la operación de replays.');
    }
    return payload.data;
  }

  function create(files) {
    const body = new FormData();
    for (const file of files) body.append('files', file, file.name);
    return request('', { method: 'POST', body });
  }

  root.CoachBlocks = Object.freeze({
    create,
    list: () => request(),
    get: blockId => request('/' + encodeURIComponent(blockId)),
    retry: blockId => request('/' + encodeURIComponent(blockId) + '/retry', { method: 'POST' }),
    label: status => labels[status] || 'Estado desconocido'
  });
}(window));
