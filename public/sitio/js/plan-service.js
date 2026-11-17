'use strict';

(function () {
  async function request(path, method = 'GET', body) {
    const client = window.CoachAuth?.getClient();
    if (!client) throw new Error('Falta configurar la conexión de autenticación.');
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session) {
      const expired = new Error('Inicia sesión para consultar tu plan.');
      expired.status = 401;
      throw expired;
    }
    const options = {
      url: '/api/v1' + path,
      method,
      headers: { Authorization: 'Bearer ' + data.session.access_token },
      dataType: 'json',
      timeout: 20000
    };
    if (body !== undefined) {
      options.contentType = 'application/json';
      options.data = JSON.stringify(body);
    }
    try {
      return await $.ajax(options);
    } catch (xhr) {
      const failure = xhr.responseJSON?.error;
      const problem = new Error(failure?.message || (method !== 'GET' && xhr.status === 0
        ? 'No se pudo confirmar la operación. Consulta las versiones antes de repetir un guardado.'
        : 'No se pudo conectar con el servidor. Comprueba que Express esté ejecutándose.'));
      problem.status = xhr.status;
      problem.code = failure?.code;
      throw problem;
    }
  }

  const idPath = value => encodeURIComponent(String(value));
  window.CoachPlanService = {
    async blocks() { return (await request('/blocks')).data; },
    async profile() { const value = await request('/profile'); return value.data || value; },
    async goals() { return (await request('/goals?status=active')).data; },
    proposal(blockId, data) { return request('/blocks/' + idPath(blockId) + '/plan-proposal', 'POST', data); },
    saveBlock(blockId, data) { return request('/blocks/' + idPath(blockId) + '/plans', 'POST', data); },
    saveVersion(planId, data) { return request('/plans/' + idPath(planId) + '/versions', 'POST', data); },
    blockPlan(blockId) { return request('/blocks/' + idPath(blockId) + '/plan'); },
    plan(planId) { return request('/plans/' + idPath(planId)); },
    async versions(planId) { return (await request('/plans/' + idPath(planId) + '/versions')).data; },
    version(planId, version) { return request('/plans/' + idPath(planId) + '/versions/' + idPath(version)); }
  };
})();
