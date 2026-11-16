'use strict';

$(function () {
  const service = window.CoachGoalsService;
  const metrics = {
    performance: [
      {
        key: 'shooting_pct',
        label: 'Precisión de tiro',
        unit: 'percent',
        description: 'Porcentaje (0–100). Requiere bloques comparables.',
        max: 100
      }
    ],
    training: [
      {
        key: 'completed_sessions',
        label: 'Sesiones completas',
        unit: 'sessions',
        description: 'Número entero de sesiones completas hasta la fecha límite.'
      }
    ]
  };
  const names = {
    performance: 'Rendimiento',
    training: 'Entrenamiento',
    active: 'Activo',
    archived: 'Archivado'
  };

  let goals = [];
  let editingId = null;
  let detailId = null;
  let loading = false;

  function message(text, error = false) {
    $('#goals-status').text(text);
    $('#goals-status').attr('data-error', String(error));
  }

  // .text() keeps names and other data as text, rather than interpreting HTML.
  function element(tag, text, className) {
    const node = $(`<${tag}>`);

    if (text !== undefined) {
      node.text(text);
    }

    if (className) {
      node.addClass(className);
    }

    return node;
  }

  function targetText(goal) {
    const comparison = goal.direction === 'at_most' ? 'Como máximo' : 'Al menos';
    const unit = goal.unit === 'percent' ? '%' : goal.unit === 'sessions' ? 'sesiones' : goal.unit;
    return `${comparison} ${goal.target_value} ${unit || ''}`;
  }

  function setBusy(value) {
    loading = value;
    $('#goals-list').attr('aria-busy', String(value));
    $('.goals-page button').prop('disabled', value);
  }

  function updateMetrics() {
    const choices = metrics[$('#goal-type').val()];
    $('#goal-metric').empty();

    choices.forEach(metric => {
      const option = $('<option>').val(metric.key).text(metric.label);
      $('#goal-metric').append(option);
    });
    const metric = choices[0];
    $('#goal-unit').text(metric.description);
    $('#goal-target').attr('min', metric.unit === 'sessions' ? '1' : '0');
    $('#goal-target').attr('step', metric.unit === 'sessions' ? '1' : 'any');
    if (metric.max !== undefined) $('#goal-target').attr('max', String(metric.max));
    else $('#goal-target').removeAttr('max');
    $('#goal-due').prop('required', metric.unit === 'sessions');
    $('#goal-due-label').text(metric.unit === 'sessions' ? 'Fecha límite (obligatoria)' : 'Fecha límite (opcional)');
  }

  function openEditor(goal) {
    $('#goal-form')[0].reset();
    editingId = goal?.goal_id || null;
    $('#editor-title').text(goal ? 'Editar objetivo' : 'Nuevo objetivo');
    $('#goal-type').val(goal?.type || 'performance');
    updateMetrics();
    $('#goal-title').val(goal?.title || '');
    $('#goal-mode').val(goal?.mode || '2v2');
    $('#goal-target').val(goal?.target_value ?? '');
    $('#goal-direction').val(goal?.direction || 'at_least');
    $('#goal-due').val(goal?.due_date || '');
    $('#goal-editor').prop('hidden', false);
    $('#goal-title').trigger('focus');
  }

  function closeEditor() {
    editingId = null;
    $('#goal-editor').prop('hidden', true);
    $('#new-goal').trigger('focus');
  }

  function showDetail(goal) {
    detailId = goal.goal_id;
    const body = $('#detail-body');
    body.empty().append(
      element('h3', goal.title, 'h5'),
      element('p', `${names[goal.type] || goal.type} · ${goal.mode} · ${names[goal.status] || goal.status}`),
      element('p', `${targetText(goal)} · Fecha límite: ${goal.due_date || 'Sin fecha'} · Versión ${goal.version || 'no informada'}`),
      element('p', 'Sin evidencia conectada: no se puede determinar avance ni cumplimiento.'),
      element('h3', 'Versiones anteriores', 'h5')
    );
    const history = goal.history || [];
    if (!history.length) body.append(element('p', 'No hay versiones anteriores disponibles en esta fuente.'));
    else {
      const list = element('ol', undefined, 'goal-history');
      history.forEach(snapshot => list.append(element('li',
        `Versión ${snapshot.version}: ${snapshot.title} · ${snapshot.mode} · ${targetText(snapshot)} · ${snapshot.due_date || 'Sin fecha'} · ${snapshot.action === 'archive' ? 'Antes de archivar' : 'Antes de editar'}`)));
      body.append(list);
    }
    body.append(element('p', service.mode === 'demo' ?
      'Historial simulado en esta pestaña. No hay planes reales vinculados.' :
      'La conservación de planes y versiones debe verificarse con A16.'));
    $('#goal-detail').prop('hidden', false);
    $('#goal-detail').trigger('focus');
  }

  function action(label, handler) {
    const button = element('button', label, 'btn-rl btn-rl-outline');
    button.attr('type', 'button');
    button.prop('disabled', loading);
    button.on('click', handler);
    return button;
  }

  function render() {
    const search = $('#goal-search').val().trim().toLocaleLowerCase('es');
    const visible = goals.filter(goal =>
      String(goal.title || '').toLocaleLowerCase('es').includes(search) &&
      (!$('#filter-type').val() || goal.type === $('#filter-type').val()) &&
      (!$('#filter-mode').val() || goal.mode === $('#filter-mode').val()) &&
      (!$('#filter-status').val() || goal.status === $('#filter-status').val()));
    const container = $('#goals-list');
    container.empty();
    visible.forEach(goal => {
      const card = element('article', undefined, `goals-card ${goal.status === 'archived' ? 'goal-archived' : ''}`);
      card.append(
        element('h2', goal.title, 'h5'),
        element('p', `${names[goal.type] || goal.type} · ${goal.mode} · ${names[goal.status] || goal.status}`, 'goal-meta'),
        element('p', `${targetText(goal)} · ${goal.due_date ? `Hasta ${goal.due_date}` : 'Sin fecha límite'}`),
        element('p', 'Avance no disponible: falta evidencia conectada.', 'goal-meta')
      );
      const actions = element('div', undefined, 'd-flex flex-wrap gap-3 mb-3');
      actions.append(action('Ver detalle e historial', () => showDetail(goal)));
      if (goal.status === 'active') {
        actions.append(action('Editar', () => openEditor(goal)));
        actions.append(action('Archivar', () => archive(goal)));
      }
      card.append(actions);
      container.append(card);
    });
    $('#goal-count').text(`${visible.length} de ${goals.length} objetivos`);
    $('#goals-empty').prop('hidden', visible.length !== 0);
    $('#goals-empty').text(goals.length ? 'Ningún objetivo coincide con los filtros.' : 'No hay objetivos. Crea uno para empezar.');
  }

  async function load() {
    setBusy(true);
    message('Cargando objetivos…');
    try {
      goals = await service.list();
      render();
      message(service.mode === 'demo' ? 'Ejemplos cargados. Los cambios se perderán al actualizar la página.' : 'Objetivos consultados en el servidor.');
    } catch (error) {
      message(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function archive(goal) {
    if (!window.confirm(`¿Archivar «${goal.title}»? Seguirá disponible en el historial.`)) return;
    setBusy(true);
    try {
      await service.archive(goal.goal_id);
      goals = await service.list();
      render();
      if (detailId === goal.goal_id) showDetail(goals.find(item => item.goal_id === detailId) || goal);
      if (editingId === goal.goal_id) closeEditor();
      message(service.mode === 'demo' ? 'Objetivo archivado en la demostración.' : 'Objetivo archivado.');
    } catch (error) {
      message(error.message, true);
    }
    finally {
      setBusy(false);
    }
  }

  $('#goal-form').on('submit', async event => {
    event.preventDefault();
    const form = $('#goal-form');
    if (!form[0].reportValidity()) return;
    const title = $('#goal-title').val().trim();
    if (!title) return message('Escribe un nombre para el objetivo.', true);
    const type = $('#goal-type').val();
    const metric = metrics[type].find(item => item.key === $('#goal-metric').val());
    const value = {
      title,
      mode: $('#goal-mode').val(),
      type,
      metric_key: metric.key,
      target_value: Number($('#goal-target').val()),
      unit: metric.unit,
      direction: $('#goal-direction').val(),
      due_date: $('#goal-due').val() || null
    };
    setBusy(true);
    try {
      await service.save(value, editingId);
      goals = await service.list();
      closeEditor();
      $('#goal-detail').prop('hidden', true);
      detailId = null;
      render();
      message(service.mode === 'demo' ? 'Objetivo guardado solo en la demostración. No se modificaron planes ni métricas.' : 'Objetivo guardado.');
    } catch (error) {
      message(error.message, true);
    }
    finally {
      setBusy(false);
    }
  });

  $('#new-goal').on('click', () => openEditor());
  $('#cancel-goal').on('click', closeEditor);
  $('#goal-type').on('change', updateMetrics);
  $('#reload-goals').on('click', load);
  $('#close-detail').on('click', () => {
    $('#goal-detail').prop('hidden', true);
    detailId = null;
    $('#new-goal').trigger('focus');
  });
  $('#goal-search, #filter-type, #filter-status, #filter-mode').on('input change', render);
  $('#goals-source').text(service.mode === 'demo' ?
    'DEMOSTRACIÓN · Datos sintéticos. Crear, editar y archivar solo afecta esta página abierta; al actualizar se restablecen los ejemplos. No se guardan en tu cuenta.' :
    'MODO SERVIDOR · Requiere sesión activa y operaciones de A16. Los errores no se sustituyen por datos de ejemplo.');
  load();
});
