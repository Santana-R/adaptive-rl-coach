'use strict';

// A16 must confirm the extended payload before enabling API mode.
(() => {
  const config = window.COACH_GOALS_CONFIG || {};
  const mode = config.mode === 'api' ? 'api' : 'demo';
  const clone = value => JSON.parse(JSON.stringify(value));
  let sequence = 3;
  let goals = [
    {
      goal_id: 'demo-goal-1', title: 'Mejorar precisión de tiro', mode: '2v2',
      type: 'performance', metric_key: 'shooting_pct', target_value: 35,
      unit: 'percent', direction: 'at_least', due_date: null, status: 'active',
      version: 1, history: [], source: 'synthetic'
    },
    {
      goal_id: 'demo-goal-2', title: 'Completar cuatro sesiones', mode: '2v2',
      type: 'training', metric_key: 'completed_sessions', target_value: 4,
      unit: 'sessions', direction: 'at_least', due_date: null, status: 'active',
      version: 1, history: [], source: 'synthetic'
    }
  ];

  function ensureUnique(value, id) {
    if (goals.some(goal => goal.goal_id !== id && goal.status === 'active' &&
      goal.mode === value.mode && goal.type === value.type)) {
      throw new Error('Ya existe una meta activa de ese tipo en esta modalidad. Edita o archiva la anterior.');
    }
  }

  async function request(path = '', method = 'GET', body) {
    const token = await config.getAccessToken?.();
    if (!token) throw new Error('Inicia sesión para consultar tus objetivos.');
    const response = await fetch(`/api/v1/goals${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!response.ok) {
      if ([404, 405].includes(response.status)) {
        throw new Error('La operación de objetivos no está disponible. Falta integrar A16.');
      }
      throw new Error(response.status === 401 ? 'Tu sesión expiró. Vuelve a iniciar sesión.' :
        response.status === 403 ? 'No tienes permiso para esta operación.' :
        'No se pudo completar la operación. Inténtalo de nuevo.');
    }
    if (response.status === 204) return null;
    const payload = await response.json();
    return payload.data;
  }

  window.CoachGoalsService = {
    mode,

    async list() {
      if (mode === 'api') {
        const data = await request();
        if (!Array.isArray(data)) throw new Error('El servidor devolvió una lista no compatible.');
        return data;
      }
      return clone(goals);
    },

    async save(value, id) {
      if (mode === 'api') {
        return request(id ? `/${encodeURIComponent(id)}` : '', id ? 'PATCH' : 'POST', value);
      }
      ensureUnique(value, id);
      if (!id) {
        goals.push({ ...clone(value), goal_id: `demo-goal-${sequence++}`, status: 'active',
          version: 1, history: [], source: 'synthetic' });
        return;
      }
      const previous = goals.find(goal => goal.goal_id === id);
      if (!previous || previous.status !== 'active') throw new Error('La meta ya no se puede editar.');
      const { history, ...snapshot } = previous;
      const next = {
        ...previous, ...clone(value), version: previous.version + 1,
        history: [...history, { ...snapshot, changed_at: new Date().toISOString(), action: 'edit' }]
      };
      goals = goals.map(goal => goal.goal_id === id ? next : goal);
    },

    async archive(id) {
      // PATCH archiva, DELETE no se usa sin el Issue16 terminado para linkear el historial.
      if (mode === 'api') return request(`/${encodeURIComponent(id)}`, 'PATCH', { status: 'archived' });
      const goal = goals.find(item => item.goal_id === id);
      if (!goal || goal.status !== 'active') throw new Error('La meta ya no está activa.');
      const { history, ...snapshot } = goal;
      goal.history = [...history, { ...snapshot, changed_at: new Date().toISOString(), action: 'archive' }];
      goal.status = 'archived';
      goal.version += 1;
    }
  };
})();
