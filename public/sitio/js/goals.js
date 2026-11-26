'use strict';

$(function () {
  const service = window.CoachGoalsService;
  const validation = window.CoachGoalsValidation;
  const labels = {
    performance: 'Rendimiento',
    training: 'Entrenamiento',
    active: 'Activo',
    archived: 'Archivado'
  };
  const metricDescriptions = {
    shooting_pct: 'de precisión de tiro',
    training_minutes: 'de práctica'
  };
  const shortDate = new Intl.DateTimeFormat('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  });
  const fields = {
    name: '#goal-name',
    mode: '#goal-mode',
    type: '#goal-type',
    comparator: '#goal-comparator',
    target_value: '#goal-target',
    start_date: '#goal-start',
    due_date: '#goal-due'
  };

  let goals = [];
  let editing = null;
  let detailId = null;
  let originalForm = '';
  let ready = false;
  let busy = false;

  function node(tag, text, className) {
    const item = $('<' + tag + '>');
    if (text !== undefined) item.text(text);
    if (className) item.addClass(className);
    return item;
  }

  function message(text, error = false) {
    $('#goals-status').text(text).toggleClass('goals-error', error);
  }

  function setBusy(value) {
    busy = value;
    $('#goals-results, #goal-form').attr('aria-busy', String(value));
    $('.goals-page button').prop('disabled', value);
    $('#new-goal').prop('disabled', value || !ready);
    $('#goal-fields').prop('disabled', value || !ready);
  }

  function handleError(error) {
    message(error.message, true);

    if ([401, 403].includes(error.status)) {
      ready = false;
      goals = [];
      $('#goals-results, #goal-detail').prop('hidden', true);
      $('#goal-count').text('');
      $('#goals-login').prop('hidden', error.status !== 401);
    }

    $('#goals-status').trigger('focus');
  }

  function clearErrors() {
    Object.entries(fields).forEach(function ([key, selector]) {
      $(selector).removeAttr('aria-invalid aria-errormessage');
      $('#error-' + key).text('');
    });
  }

  function showErrors(errors) {
    clearErrors();
    let first = null;

    Object.entries(errors).forEach(function ([key, text]) {
      $(fields[key]).attr({
        'aria-invalid': 'true',
        'aria-errormessage': 'error-' + key
      });
      $('#error-' + key).text(text);
      first = first || fields[key];
    });

    if (first) $(first).trigger('focus');
  }

  function readForm() {
    return {
      name: $('#goal-name').val(),
      mode: $('#goal-mode').val(),
      type: $('#goal-type').val(),
      comparator: $('#goal-comparator').val(),
      target_value: $('#goal-target').val() === '' ? null : Number($('#goal-target').val()),
      start_date: $('#goal-start').val(),
      due_date: $('#goal-due').val()
    };
  }

  function hasDraftChanges() {
    return !$('#goal-editor').prop('hidden') && JSON.stringify(readForm()) !== originalForm;
  }

  function allowDiscard() {
    return !hasDraftChanges() || window.confirm('¿Descartar los cambios del formulario sin guardar?');
  }

  function updateMetric() {
    const spec = validation.specs[$('#goal-type').val()];
    $('#goal-comparator').empty();

    spec.comparators.forEach(function (comparator) {
      const text = comparator === '>' ? 'Mayor que (>)' : 'Al menos (≥)';
      $('#goal-comparator').append($('<option>').val(comparator).text(text));
    });

    $('#goal-target-label').text(spec.label + ' (' + spec.unit + ')');
    $('#goal-target').attr({ min: spec.min, max: spec.max, step: spec.step });
    $('#goal-metric-help').text($('#goal-type').val() === 'training'
      ? 'Meta de minutos declarados en sesiones: entero entre 1 y 100000. No mide rendimiento en partidas.'
      : 'Meta de precisión de tiro: mayor que 0 y hasta 100 %, con máximo 4 decimales.');
  }

  function openEditor(goal) {
    if (!allowDiscard()) return;

    if (goal && (!validation.specs[goal.type] || validation.specs[goal.type].metric !== goal.metric_key)) {
      message('Esta métrica no puede editarse desde este formulario.', true);
      return;
    }

    editing = goal || null;
    $('#goal-form')[0].reset();
    $('#goal-edit-impact').prop('hidden', !goal);
    $('#editor-title').text(goal ? 'Editar objetivo · versión ' + goal.version : 'Nuevo objetivo');
    $('#goal-name').val(goal?.name || '');
    $('#goal-mode').val(goal?.mode || '2v2');
    $('#goal-type').val(goal?.type || 'performance');
    updateMetric();
    $('#goal-comparator').val(goal?.comparator || '>=');
    $('#goal-target').val(goal?.target_value ?? '');
    $('#goal-start').val(goal?.start_date || '').prop('required', Boolean(goal));
    $('#goal-due').val(goal?.due_date || '');
    $('#goal-type, #goal-mode').prop('disabled', Boolean(goal));
    $('#goal-edit-note').prop('hidden', !goal);
    clearErrors();
    $('#goal-editor').prop('hidden', false);
    originalForm = JSON.stringify(readForm());
    $('#goal-name').trigger('focus');
  }

  function closeEditor(restoreFocus = true) {
    editing = null;
    originalForm = '';
    $('#goal-editor').prop('hidden', true);
    $('#goal-type, #goal-mode').prop('disabled', false);
    clearErrors();
    if (restoreFocus) $('#new-goal').trigger('focus');
  }

  function targetText(goal) {
    const prefix = goal.comparator === '>' ? 'Mayor que' : 'Al menos';
    const unit = goal.unit === 'percent' ? '%' : goal.unit === 'minutes' ? 'min' : goal.unit;
    return prefix + ' ' + goal.target_value + ' ' + (unit || '');
  }

  function deadlineText(date) {
    if (!date) return 'Sin fecha límite';
    const utcDate = new Date(date + 'T00:00:00Z');
    return 'Hasta el ' + (Number.isNaN(utcDate.getTime()) ? date : shortDate.format(utcDate));
  }

  function button(text, handler, style = 'btn-rl-outline') {
    return node('button', text, 'btn-rl ' + style)
      .attr('type', 'button').prop('disabled', busy || !ready).on('click', handler);
  }

  function render() {
    const search = $('#goal-search').val().trim().toLocaleLowerCase('es');
    const type = $('#filter-type').val();
    const mode = $('#filter-mode').val();
    const status = $('#filter-status').val();
    const visible = goals.filter(function (goal) {
      return String(goal.name || '').toLocaleLowerCase('es').includes(search) &&
        (!type || goal.type === type) && (!status || goal.status === status) && (!mode || goal.mode === mode);
    });

    const activeFilters = Number(Boolean(type)) + Number(Boolean(mode));
    $('#goal-more-filters').text(activeFilters ? 'Más filtros (' + activeFilters + ')' : 'Más filtros');
    $('#performance-list, #training-list').empty();

    visible.forEach(function (goal) {
      const card = node('article', undefined, 'goals-card');
      if (goal.status === 'archived') card.addClass('goal-archived');
      const target = node('p', undefined, 'goal-target').append(node('strong', targetText(goal)));
      if (metricDescriptions[goal.metric_key]) target.append(' ' + metricDescriptions[goal.metric_key]);
      card.append(
        node('h3', goal.name, 'goal-name'),
        target,
        node('p', [goal.mode, labels[goal.status] || goal.status, deadlineText(goal.due_date)].join(' · '), 'goal-meta')
      );

      const actions = node('div', undefined, 'goal-actions');
      if (goal.status === 'active') {
        actions.append(button('Editar', function () { openEditor(goal); }, 'btn-rl-accent'));
      }
      actions.append(button('Ver historial', function () { loadDetail(goal.goal_id); }));
      if (goal.status === 'active') {
        actions.append(button('Retirar objetivo', function () { removeGoal(goal); }, 'goal-retire'));
      }

      card.append(actions);
      $(goal.type === 'training' ? '#training-list' : '#performance-list').append(card);
    });

    $('#goals-filters').prop('hidden', !ready || !goals.length);
    const count = visible.length === goals.length ? String(goals.length) : visible.length + ' de ' + goals.length;
    $('#goal-count').text(goals.length ? count + (goals.length === 1 && visible.length === 1 ? ' objetivo' : ' objetivos') : '');
    $('#goals-empty').prop('hidden', visible.length !== 0).text(goals.length
      ? 'Ningún objetivo coincide con los filtros.'
      : 'Todavía no tienes objetivos. Puedes proponerte llegar al 35 % de eficiencia de tiro o practicar 60 minutos esta semana.');
    $('#performance-section').prop('hidden', !visible.some(function (goal) { return goal.type !== 'training'; }));
    $('#training-section').prop('hidden', !visible.some(function (goal) { return goal.type === 'training'; }));
    $('#goals-results').prop('hidden', !ready);
  }

  function displayDetail(goal) {
    detailId = goal.goal_id;
    const body = $('#detail-body').empty();
    body.append(
      node('h3', goal.name, 'h5'),
      node('p', (labels[goal.type] || goal.type) + ' · ' + goal.mode + ' · ' + (labels[goal.status] || goal.status)),
      node('p', targetText(goal) + ' · Zona horaria: ' + goal.timezone),
      node('p', 'Versión vigente ' + goal.version, 'text-bray')
    );

    if (goal.archived_at) body.append(node('p', 'Archivado: ' + goal.archived_at));

    const wrapper = node('div', undefined, 'table-responsive mb-3');
    const table = node('table', undefined, 'table table-dark goal-table');
    table.append(node('caption', 'Versiones devueltas por el servidor, incluida la vigente.', 'text-bray'));
    const heading = node('tr');
    ['Versión', 'Nombre', 'Meta', 'Inicio', 'Límite', 'Zona', 'Activada'].forEach(function (text) {
      heading.append(node('th', text).attr('scope', 'col'));
    });
    table.append(node('thead').append(heading));
    const rows = node('tbody');

    (goal.versions || []).slice().sort(function (a, b) { return a.version - b.version; }).forEach(function (version) {
      const row = node('tr');
      [version.version, version.name, targetText(version), version.start_date,
        version.due_date || 'Sin fecha', version.timezone, version.activated_at].forEach(function (value) {
        row.append(node('td', value));
      });
      rows.append(row);
    });

    table.append(rows);
    wrapper.append(table);
    body.append(wrapper);
    body.append(node('p', 'Los planes guardados conservan la versión exacta que usaron. Editar o retirar esta meta no reescribe esos planes.'));
    body.append($('<a>').attr('href', 'plan.html').addClass('btn-rl btn-rl-outline mb-3').text('Consultar mis planes'));
    $('#goal-detail').prop('hidden', false).trigger('focus');
  }

  async function loadDetail(id) {
    if (busy) return;
    setBusy(true);
    message('Consultando detalle e historial…');

    try {
      const goal = await service.get(id);
      displayDetail(goal);
      message('Historial consultado en el servidor.');
    } catch (error) {
      $('#goal-detail').prop('hidden', true);
      detailId = null;
      handleError(error);
    } finally {
      setBusy(false);
    }
  }

  async function loadList() {
    if (busy || !allowDiscard()) return;
    setBusy(true);
    message('Consultando objetivos…');

    try {
      goals = await service.list();
      ready = true;
      $('#goals-login').prop('hidden', true);
      closeEditor(false);
      $('#goal-detail').prop('hidden', true);
      detailId = null;
      render();
      message('');
    } catch (error) {
      ready = false;
      $('#goals-results, #goal-detail').prop('hidden', true);
      $('#goal-count').text('');
      handleError(error);
    } finally {
      setBusy(false);
    }
  }

  // Una escritura confirmada no se anuncia como fallida si solo falla la recarga posterior.
  async function refreshAfterWrite(successMessage) {
    try {
      goals = await service.list();
      render();
      message(successMessage);
    } catch (error) {
      render();
      handleError(error);
      message(successMessage + ' No se pudo actualizar toda la lista. Usa Actualizar lista.', true);
    }
  }

  $('#goal-form').on('submit', async function (event) {
    event.preventDefault();
    if (busy || !ready) return;
    const result = validation.validate(readForm(), Boolean(editing));
    clearErrors();

    if (!result.valid) {
      message('Revisa los campos señalados. No se enviaron cambios.', true);
      showErrors(result.errors);
      return;
    }

    setBusy(true);
    message('Guardando objetivo…');

    try {
      const response = editing
        ? await service.update(editing.goal_id, result.data)
        : await service.create(result.data);
      const saved = response.data;
      goals = goals.filter(function (goal) { return goal.goal_id !== saved.goal_id; });
      goals.push(saved);
      closeEditor();
      $('#goal-detail').prop('hidden', true);
      detailId = null;
      $('#goal-search').val('');
      $('#filter-type, #filter-mode').val('');
      $('#filter-status').val('active');
      const text = response.meta?.version_created === false
        ? 'No había cambios: se conserva la versión ' + saved.version + '.'
        : 'Objetivo guardado en el servidor. Versión ' + saved.version + '.';
      await refreshAfterWrite(text);
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  });

  async function removeGoal(goal) {
    if (busy) return;
    const confirmed = window.confirm('¿Retirar «' + goal.name + '»? Si tiene vínculos a planes o evaluaciones se archivará. Si no, se eliminará junto con su historial.');
    if (!confirmed) return;
    if (editing?.goal_id === goal.goal_id && !allowDiscard()) return;
    setBusy(true);
    message('Retirando objetivo…');

    try {
      const result = await service.remove(goal.goal_id);
      if (result.effect === 'deleted') {
        goals = goals.filter(function (item) { return item.goal_id !== goal.goal_id; });
      } else {
        goals = goals.map(function (item) {
          return item.goal_id === goal.goal_id ? { ...item, status: 'archived' } : item;
        });
      }
      if (editing?.goal_id === goal.goal_id) closeEditor();
      if (detailId === goal.goal_id) {
        detailId = null;
        $('#goal-detail').prop('hidden', true);
      }
      await refreshAfterWrite(result.message + (result.effect !== 'deleted' ? ' Puedes consultarla con el filtro Archivados.' : ''));
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  }

  $('#new-goal').on('click', function () { openEditor(); });
  $('#cancel-goal').on('click', function () { if (allowDiscard()) closeEditor(); });
  $('#goal-type').on('change', updateMetric);
  $('#reload-goals').on('click', loadList);
  $('#close-detail').on('click', function () {
    $('#goal-detail').prop('hidden', true);
    detailId = null;
    $('#new-goal').trigger('focus');
  });
  $('#goal-search, #filter-type, #filter-status, #filter-mode').on('input change', render);

  loadList();
});
