'use strict';

$(function () {
  const api = window.CoachFollowupService;
  const model = window.CoachFollowupModel;
  let plan = null, rows = [], editing = null, available = false, busy = false, uncertain = false, revision = 0;
  const status = $('#sessions-status');
  const fields = $('#session-fields');
  const form = $('#session-form');
  const params = new URLSearchParams(window.location.search);

  function controls() {
    fields.prop('disabled', !plan || !plan.exercises.length || !available || busy || uncertain);
    $('#session-minutes, #session-exercise').prop('disabled', Boolean(editing && !editing.plan_exercise_id));
    $('#sessions-refresh').prop('disabled', busy);
    $('#session-cancel').prop('disabled', busy);
    $('#sessions-list button').prop('disabled', busy || !available || uncertain);
    $('#session-submit').text(editing ? 'Guardar corrección' : 'Registrar sesión');
    form.attr('aria-busy', String(busy));
  }

  function message(text, error = false) {
    status.toggleClass('followup-error', error).text(text);
  }

  function reset() {
    editing = null;
    form[0].reset();
    $('#session-edit-note').text('La fecha y hora se introducen en la zona local de este dispositivo. El servidor recibe el instante UTC.');
    if (plan && params.get('plan_exercise_id')) $('#session-exercise').val(params.get('plan_exercise_id'));
    controls();
  }

  async function context() {
    const box = $('#sessions-plan-context');
    if (!params.has('plan_id')) {
      box.text('Abre una versión guardada desde Plan para registrar o corregir una sesión. Puedes consultar el historial sin seleccionar una versión.');
      return;
    }
    box.text('Comprobando la versión guardada del plan…');
    try {
      if (!model.id(params.get('plan_id')) || !/^[1-9]\d{0,8}$/.test(params.get('version') || '')) throw new Error('El enlace no contiene una versión válida.');
      const response = await window.CoachPlanService.version(params.get('plan_id'), params.get('version'));
      if (!model.matches(response.data, params)) throw new Error('El contexto del enlace no corresponde a esa versión guardada.');
      plan = response.data;
      $('#session-exercise').empty().append($('<option>').val('').text('Selecciona un ejercicio'));
      for (const item of plan.exercises) $('#session-exercise').append($('<option>').val(item.plan_exercise_id).text(item.exercise_snapshot.title + ' · ' + item.assigned_minutes + ' min propuestos'));
      box.empty().append($('<h2>').addClass('h5').text('Plan ' + plan.plan_id + ' · Versión ' + plan.version),
        $('<p>').text('ID de versión ' + plan.plan_version_id + ' · Bloque ' + plan.block_id + '. Registrar práctica no modifica este plan histórico.'),
        $('<a>').addClass('btn-rl btn-rl-outline').attr('href', 'plan.html?' + new URLSearchParams({ plan_id: plan.plan_id, version: String(plan.version), block_id: plan.block_id })).text('Consultar esta versión del plan'));
      if (!plan.exercises.length) box.append($('<p>').text('Esta versión no contiene ejercicios: puedes consultarla, pero no registrar una sesión sobre ella.'));
      reset();
    } catch (error) { plan = null; box.text(error.message + ' Vuelve a Plan y selecciona una versión guardada.'); }
    finally { controls(); }
  }

  function render() {
    const list = $('#sessions-list').empty();
    let shown = rows;
    const from = $('#sessions-from').val(), to = $('#sessions-to').val();
    if (from || to) {
      // Fechas locales de las sesiones, coherentes con el formulario del dispositivo.
      const localDay = value => {
        const date = new Date(value);
        if (!Number.isFinite(date.getTime())) return '';
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      };
      shown = rows.filter(row => { const day = localDay(row.performed_at); return day && (!from || day >= from) && (!to || day <= to); });
    }
    if (from && to && from > to) { list.append($('<p>').text('La fecha inicial debe ser anterior o igual a la final.')); return; }
    if (!shown.length) { list.append($('<p>').text('No hay sesiones registradas para esta selección.')); return; }
    for (const row of shown) {
      const card = $('<article>').addClass('followup-item').attr('data-session-id', row.session_id);
      card.append($('<h3>').addClass('h5').text(model.localDate(row.performed_at)),
        $('<p>').text('Versión exacta de plan: ' + model.display(row.plan_version_id) + ' · Duración declarada: ' + model.display(row.duration_minutes) + ' min'),
        $('<p>').text('Ejercicio de plan: ' + (row.plan_exercise_id || 'Varios ejercicios / no individualizado')),
        $('<p>').text(row.notes || 'Sin notas.'));
      const actions = $('<div>').addClass('d-flex flex-wrap gap-2');
      if (plan && row.plan_version_id === plan.plan_version_id && model.id(row.session_id)) {
        actions.append($('<button>').attr('type', 'button').addClass('btn-rl btn-rl-outline').text('Corregir').on('click', () => edit(row)));
      } else card.append($('<p>').addClass('followup-muted').text('Para corregir, abre desde Plan la versión exacta de esta sesión.'));
      if (model.id(row.session_id)) actions.append($('<button>').attr('type', 'button').addClass('btn-rl btn-rl-outline').text('Eliminar').on('click', () => remove(row)));
      list.append(card.append(actions));
    }
    controls();
  }

  function edit(row) {
    if (busy || uncertain || !plan || row.plan_version_id !== plan.plan_version_id) return;
    if (row.plan_exercise_id && !plan.exercises.some(item => item.plan_exercise_id === row.plan_exercise_id)) {
      message('No se pudo verificar el ejercicio de esta sesión. No se puede corregir desde este formulario.', true); return;
    }
    const date = new Date(row.performed_at);
    if (!Number.isFinite(date.getTime())) { message('La sesión tiene una fecha incompatible.', true); return; }
    editing = row;
    $('#session-date').val(new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    $('#session-minutes').val(row.duration_minutes);
    $('#session-exercise').val(row.plan_exercise_id || '');
    $('#session-notes').val(row.notes || '');
    $('#session-edit-note').text('Corrigiendo sesión ' + row.session_id + '. Se conserva la versión de plan ' + row.plan_version_id + '.' + (!row.plan_exercise_id ? ' Esta sesión no individualiza un único ejercicio: solo se corrigen fecha y notas.' : ''));
    controls(); $('#session-date').trigger('focus');
  }

  async function load() {
    if (busy) return;
    const ticket = ++revision;
    available = false; controls();
    $('#sessions-list').empty();
    message('Consultando sesiones…');
    try {
      const response = await api.sessions();
      if (ticket !== revision) return;
      if (!Array.isArray(response) || response.some(row => !row || !model.id(row.session_id) || !model.id(row.plan_version_id))) {
        throw new Error('El listado de sesiones no tiene el formato esperado.');
      }
      rows = response; available = true; uncertain = false;
      message('Historial consultado: ' + rows.length + ' sesiones. Los minutos son práctica declarada, no rendimiento de partidas.');
      render();
    } catch (error) { if (ticket === revision) message(error.message + ' Puedes usar Actualizar sesiones para volver a consultar.', true); }
    finally { if (ticket === revision) controls(); }
  }

  async function mutate(operation, success) {
    busy = true; controls();
    try {
      await operation();
    } catch (error) {
      uncertain = error.uncertain === true;
      message(error.message + (uncertain ? ' No se conoce el resultado. Actualiza el historial y comprueba si se aplicó antes de repetir.' : ''), true);
      busy = false; controls(); return;
    }
    busy = false; reset();
    // No inventar totales ni conservar un listado anterior después de una escritura.
    await load();
    if (available) message(success + ' Historial consultado de nuevo.');
    $(document).trigger('coach:sessions-changed');
  }

  async function remove(row) {
    if (busy || uncertain || !available) return;
    if (!window.confirm('¿Eliminar la sesión ' + row.session_id + ' de ' + model.localDate(row.performed_at) + '? Se recalculará el entrenamiento; las métricas de replays no cambian.')) return;
    await mutate(() => api.remove(row.session_id), 'El servidor confirmó la eliminación.');
  }

  form.on('submit', async function (event) {
    event.preventDefault();
    if (busy || uncertain || !available || !plan) return;
    let body;
    try {
      const values = {
        performed_at: $('#session-date').val(), duration_minutes: $('#session-minutes').val(),
        plan_exercise_id: $('#session-exercise').val(), notes: $('#session-notes').val()
      };
      body = editing ? model.sessionPatch(values, plan, editing) : model.session(values, plan);
    } catch (error) { message(error.message, true); return; }
    if (editing) {
      const id = editing.session_id;
      if (!window.confirm('¿Guardar la corrección de la sesión ' + id + ' sobre la misma versión del plan?')) return;
      // La relación de plan es inmutable: PATCH envía solamente los campos editables.

      await mutate(() => api.update(id, body), 'El servidor confirmó la corrección.');
    } else await mutate(() => api.create(body), 'El servidor confirmó el registro.');
  });
  $('#sessions-refresh').on('click', load);
  $('#session-cancel').on('click', reset);
  $('#sessions-from, #sessions-to').on('change', render);
  controls(); context(); load();
});
