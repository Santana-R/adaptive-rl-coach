'use strict';

(() => {
  const service = window.CoachGoalsService;
  const $ = id => document.getElementById(id);
  const metrics = {
    performance: [
      { key: 'shooting_pct', label: 'Precisión de tiro', unit: 'percent', description: 'Porcentaje (0–100). Requiere bloques comparables.', max: 100 }
    ],
    training: [
      { key: 'completed_sessions', label: 'Sesiones completas', unit: 'sessions', description: 'Número entero de sesiones completas hasta la fecha límite.' }
    ]
  };
  const names = { performance: 'Rendimiento', training: 'Entrenamiento', active: 'Activo', archived: 'Archivado' };
  let goals = [];
  let editingId = null;
  let detailId = null;
  let loading = false;

  function message(text, error = false) {
    $('goals-status').textContent = text;
    $('goals-status').dataset.error = String(error);
  }

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function targetText(goal) {
    const comparison = goal.direction === 'at_most' ? 'Como máximo' : 'Al menos';
    const unit = goal.unit === 'percent' ? '%' : goal.unit === 'sessions' ? 'sesiones' : goal.unit;
    return `${comparison} ${goal.target_value} ${unit || ''}`;
  }

  function setBusy(value) {
    loading = value;
    $('goals-list').setAttribute('aria-busy', String(value));
    document.querySelectorAll('.goals-page button').forEach(button => { button.disabled = value; });
  }

  function updateMetrics() {
    const choices = metrics[$('goal-type').value];
    $('goal-metric').replaceChildren(...choices.map(metric => new Option(metric.label, metric.key)));
    const metric = choices[0];
    $('goal-unit').textContent = metric.description;
    $('goal-target').min = metric.unit === 'sessions' ? '1' : '0';
    $('goal-target').step = metric.unit === 'sessions' ? '1' : 'any';
    if (metric.max !== undefined) $('goal-target').max = String(metric.max);
    else $('goal-target').removeAttribute('max');
    $('goal-due').required = metric.unit === 'sessions';
    $('goal-due').parentElement.firstChild.textContent = metric.unit === 'sessions' ? 'Fecha límite (obligatoria)' : 'Fecha límite (opcional)';
  }

  function openEditor(goal) {
    $('goal-form').reset();
    editingId = goal?.goal_id || null;
    $('editor-title').textContent = goal ? 'Editar objetivo' : 'Nuevo objetivo';
    $('goal-type').value = goal?.type || 'performance';
    updateMetrics();
    $('goal-title').value = goal?.title || '';
    $('goal-mode').value = goal?.mode || '2v2';
    $('goal-target').value = goal?.target_value ?? '';
    $('goal-direction').value = goal?.direction || 'at_least';
    $('goal-due').value = goal?.due_date || '';
    $('goal-editor').hidden = false;
    $('goal-title').focus();
  }

  function closeEditor() {
    editingId = null;
    $('goal-editor').hidden = true;
    $('new-goal').focus();
  }

  function showDetail(goal) {
    detailId = goal.goal_id;
    const body = $('detail-body');
    body.replaceChildren(
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
    $('goal-detail').hidden = false;
    $('goal-detail').focus();
  }

  function action(label, handler) {
    const button = element('button', label, 'btn-rl btn-rl-outline');
    button.type = 'button';
    button.disabled = loading;
    button.addEventListener('click', handler);
    return button;
  }

  function render() {
    const search = $('goal-search').value.trim().toLocaleLowerCase('es');
    const visible = goals.filter(goal =>
      String(goal.title || '').toLocaleLowerCase('es').includes(search) &&
      (!$('filter-type').value || goal.type === $('filter-type').value) &&
      (!$('filter-mode').value || goal.mode === $('filter-mode').value) &&
      (!$('filter-status').value || goal.status === $('filter-status').value));
    const container = $('goals-list');
    container.replaceChildren();
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
    $('goal-count').textContent = `${visible.length} de ${goals.length} objetivos`;
    $('goals-empty').hidden = visible.length !== 0;
    $('goals-empty').textContent = goals.length ? 'Ningún objetivo coincide con los filtros.' : 'No hay objetivos. Crea uno para empezar.';
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
    } finally { setBusy(false); }
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
    } catch (error) { message(error.message, true); }
    finally { setBusy(false); }
  }

  $('goal-form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = $('goal-form');
    if (!form.reportValidity()) return;
    const title = $('goal-title').value.trim();
    if (!title) return message('Escribe un nombre para el objetivo.', true);
    const type = $('goal-type').value;
    const metric = metrics[type].find(item => item.key === $('goal-metric').value);
    const value = {
      title, mode: $('goal-mode').value, type, metric_key: metric.key,
      target_value: Number($('goal-target').value), unit: metric.unit,
      direction: $('goal-direction').value, due_date: $('goal-due').value || null
    };
    setBusy(true);
    try {
      await service.save(value, editingId);
      goals = await service.list();
      closeEditor();
      $('goal-detail').hidden = true;
      detailId = null;
      render();
      message(service.mode === 'demo' ? 'Objetivo guardado solo en la demostración. No se modificaron planes ni métricas.' : 'Objetivo guardado.');
    } catch (error) { message(error.message, true); }
    finally { setBusy(false); }
  });

  $('new-goal').addEventListener('click', () => openEditor());
  $('cancel-goal').addEventListener('click', closeEditor);
  $('goal-type').addEventListener('change', updateMetrics);
  $('reload-goals').addEventListener('click', load);
  $('close-detail').addEventListener('click', () => {
    $('goal-detail').hidden = true;
    detailId = null;
    $('new-goal').focus();
  });
  ['goal-search', 'filter-type', 'filter-status', 'filter-mode'].forEach(id => $(id).addEventListener('input', render));
  $('goals-source').textContent = service.mode === 'demo' ?
    'DEMOSTRACIÓN · Datos sintéticos. Crear, editar y archivar solo afecta esta página abierta; al actualizar se restablecen los ejemplos. No se guardan en tu cuenta.' :
    'MODO SERVIDOR · Requiere sesión activa y operaciones de A16. Los errores no se sustituyen por datos de ejemplo.';
  load();
})();
