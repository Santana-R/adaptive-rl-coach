'use strict';

(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.CoachFollowupModel = model;
}(typeof window === 'undefined' ? globalThis : window, function () {
  const id = value => typeof value === 'string' && /^[1-9]\d{0,17}$/.test(value);
  const missing = value => value === null || value === undefined || value === '';

  function display(value) {
    return missing(value) ? 'No disponible' : String(value);
  }

  function period(from, to) {
    const valid = date => /^\d{4}-\d{2}-\d{2}$/.test(date || '') &&
      Number.isFinite(Date.parse(date + 'T00:00:00Z')) &&
      new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) === date;
    if (!valid(from) || !valid(to) || from > to) throw new Error('Revisa las fechas inicial y final.');
    return new URLSearchParams({ from, to }).toString();
  }

  function localDate(value) {
    if (missing(value)) return 'No disponible';
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleString('es-MX') : 'Fecha no disponible';
  }

  function session(input, plan) {
    if (!plan || !id(plan.plan_version_id)) throw new Error('Selecciona una versión guardada y verificada desde Plan.');
    if (input.plan_exercise_id && !plan.exercises.some(item => item.plan_exercise_id === input.plan_exercise_id)) {
      throw new Error('El ejercicio no pertenece a la versión seleccionada.');
    }
    const minutes = Number(input.duration_minutes);
    if (!Number.isInteger(minutes) || minutes <= 0 || minutes > 32767) {
      throw new Error('Indica una duración entera entre 1 y 32767 minutos.');
    }
    const date = new Date(input.performed_at);
    if (!Number.isFinite(date.getTime())) throw new Error('Indica una fecha y hora válidas.');
    if (String(input.notes || '').length > 2000) throw new Error('Las notas admiten hasta 2000 caracteres.');
    const body = {
      plan_version_id: plan.plan_version_id,
      performed_at: date.toISOString(), duration_minutes: minutes,
      notes: String(input.notes || '').trim()
    };
    if (input.plan_exercise_id) body.plan_exercise_id = input.plan_exercise_id;
    return body;
  }

  function matches(plan, params) {
    return plan && id(plan.plan_version_id) && Array.isArray(plan.exercises) &&
      plan.plan_id === params.get('plan_id') && String(plan.version) === params.get('version') &&
      (!params.has('plan_version_id') || params.get('plan_version_id') === plan.plan_version_id) &&
      (!params.has('block_id') || params.get('block_id') === plan.block_id) &&
      (!params.get('plan_exercise_id') || plan.exercises.some(item => item.plan_exercise_id === params.get('plan_exercise_id')));
  }

  return { id, missing, display, period, localDate, session, matches };
}));
