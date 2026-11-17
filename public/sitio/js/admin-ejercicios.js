'use strict';

// A32 · Ejercicios admin: lista (GET ?include_inactive=true), alta (POST), edición con versión nueva
// (PATCH con ficha), activar/desactivar (PATCH { active }) y eliminar/desactivar (DELETE).
(async function () {
  const { request, guard, notify, escape, confirmStep } = window.CoachAdmin;
  const $ = id => document.getElementById(id);
  const COLUMNS = 'grid-template-columns: 2fr 1fr 1.2fr .8fr 1.5fr 2fr;';
  const PRIORITY = { shooting: 'Tiro', boost: 'Boost', defensive_review: 'Defensa', movement: 'Movimiento' };
  const REVIEW = { verified: 'Revisado', pending: 'Revisión pendiente', not_in_reviewed_content: 'Sin revisión',
    content_mismatch: 'Cambió desde la revisión', duplicate: 'Duplicado' };
  const RESOURCE_LABEL = { custom_training: 'Código del paquete (XXXX-XXXX-XXXX-XXXX)', steam_workshop: 'Enlace https del mapa en Steam Workshop', external_guide: 'Enlace https de la guía' };
  let exercises = [], editing = null;

  const platformText = list => (list ?? []).map(p => p === 'epic' ? 'Epic' : 'Steam').join(' / ') || '—';

  function visible() {
    const text = $('buscare').value.trim().toLowerCase();
    const priority = $('filtro-prioridad').value, platform = $('filtro-plataforma').value, status = $('filtro-estado').value;
    return exercises.filter(e => (!priority || e.priority_key === priority) && (!platform || e.platforms.includes(platform)) &&
      (!status || (status === 'active') === e.active) &&
      (!text || `${e.title} ${PRIORITY[e.priority_key] ?? e.priority_key}`.toLowerCase().includes(text)));
  }

  function render() {
    const rows = visible();
    $('ejercicios-filas').innerHTML = rows.length ? rows.map(e => {
      const verified = e.technical_review_status === 'verified';
      const toggle = e.active
        ? `<button type="button" class="btn btn-link link-admin p-0" data-action="off" data-id="${escape(e.exercise_id)}">Desactivar</button>`
        : verified ? `<button type="button" class="btn btn-link link-admin p-0" data-action="on" data-id="${escape(e.exercise_id)}">Activar</button>`
          : '<span class="text-bray">Requiere revisión</span>';
      return `<div class="table-row" style="${COLUMNS}">
        <span data-label="Ejercicio">${escape(e.title)} <small class="text-bray">v${escape(e.content_version)}</small></span>
        <span data-label="Prioridad">${escape(PRIORITY[e.priority_key] ?? e.priority_key)}</span>
        <span data-label="Plataforma">${escape(platformText(e.platforms))}</span>
        <span data-label="Duración">${escape(e.reference_duration_minutes)} min</span>
        <span data-label="Estado"><span class="${e.active ? '' : 'text-gold'}">${e.active ? 'Activo' : 'Inactivo'}</span> · <small class="text-bray">${escape(REVIEW[e.technical_review_status] ?? e.technical_review_status)}</small></span>
        <span data-label="Acciones" class="link-actions d-flex flex-wrap gap-2">
          <button type="button" class="btn btn-link link-admin p-0" data-action="edit" data-id="${escape(e.exercise_id)}">Ver / editar</button>
          ${toggle}
          <button type="button" class="btn btn-link link-admin p-0" data-action="delete" data-id="${escape(e.exercise_id)}">Eliminar</button>
        </span>
      </div>`;
    }).join('') : '<p class="text-bray">Ningún ejercicio coincide con los filtros.</p>';
  }

  async function load() {
    const { data } = await request('GET', '/api/v1/exercises?include_inactive=true');
    exercises = data.exercises;
    render();
  }

  function resourceLabel() { $('f-resource-label').textContent = RESOURCE_LABEL[$('f-type').value]; }

  function fill(ficha) {
    $('f-title').value = ficha?.title ?? '';
    $('f-priority').value = ficha?.priority_key ?? 'shooting';
    $('f-type').value = ficha?.resource_type ?? 'custom_training';
    $('f-resource').value = ficha?.resource ?? '';
    $('f-purpose').value = ficha?.purpose ?? '';
    $('f-success').value = ficha?.success_criterion ?? '';
    $('f-instructions').value = (ficha?.instructions ?? []).join('\n');
    $('f-difficulty').value = ficha?.difficulty_base ?? 1;
    $('f-minutes').value = ficha?.reference_duration_minutes ?? 10;
    $('f-epic').checked = (ficha?.platforms ?? ['epic', 'steam']).includes('epic');
    $('f-steam').checked = (ficha?.platforms ?? ['epic', 'steam']).includes('steam');
    resourceLabel();
  }

  function readForm() {
    return {
      title: $('f-title').value, priority_key: $('f-priority').value, resource_type: $('f-type').value,
      resource: $('f-resource').value, purpose: $('f-purpose').value, success_criterion: $('f-success').value,
      instructions: $('f-instructions').value.split('\n'),
      difficulty_base: Number($('f-difficulty').value), reference_duration_minutes: Number($('f-minutes').value),
      platforms: ['epic', 'steam'].filter(p => $(`f-${p}`).checked),
    };
  }

  function openEditor(detail) {
    editing = detail;
    $('editor-titulo').textContent = detail ? `Editar: ${detail.ficha.title} (versión ${detail.version})` : 'Nuevo ejercicio';
    $('editor-nota').textContent = detail
      ? `Estado: ${detail.active ? 'activo' : 'inactivo'} · ${REVIEW[detail.technical_review_status] ?? detail.technical_review_status}. Guardar crea la versión ${detail.version + 1} y deja el ejercicio inactivo hasta su revisión.`
      : 'Se guarda como borrador inactivo. Para ofrecerlo en planes, su ficha debe revisarse y verificarse (A23).';
    fill(detail?.ficha);
    $('editor-estado').textContent = '';
    $('editor-historial').hidden = !detail;
    $('historial-lista').innerHTML = detail ? detail.versions.slice().reverse().map(v =>
      `<li>Versión ${escape(v.version)} · ${escape(v.title)} · ${escape(v.reference_duration_minutes)} min · dificultad ${escape(v.difficulty_base)} · ${escape(platformText(v.platforms))}</li>`).join('') : '';
    $('ejercicio-editor').hidden = false;
    $('ejercicio-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('f-title').focus({ preventScroll: true });
  }

  function closeEditor() { editing = null; $('ejercicio-editor').hidden = true; }

  $('nuevo-ejercicio').addEventListener('click', () => openEditor(null));
  $('editor-cancelar').addEventListener('click', closeEditor);
  $('f-type').addEventListener('change', resourceLabel);

  $('ejercicio-form').addEventListener('submit', async event => {
    event.preventDefault();
    const submit = event.submitter || $('ejercicio-form').querySelector('[type="submit"]');
    submit.disabled = true;
    $('editor-estado').textContent = '';
    try {
      const body = readForm();
      const { data, meta } = editing
        ? await request('PATCH', `/api/v1/exercises/${encodeURIComponent(editing.exercise_id)}`, body)
        : await request('POST', '/api/v1/exercises', body);
      notify(editing && !meta.version_created ? 'No hubo cambios: se conserva la misma versión.'
        : `Se guardó "${data.ficha.title}" (versión ${data.version}). Queda inactivo hasta su revisión.`, 'ok');
      closeEditor();
      await load();
    } catch (error) {
      notify(`No se guardó: ${error.message}`, 'error');
      $('editor-estado').textContent = `No se guardó: ${error.message}`;
    } finally {
      submit.disabled = false;
    }
  });

  $('ejercicios-filas').addEventListener('click', async event => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const id = button.dataset.id, action = button.dataset.action;
    const exercise = exercises.find(e => e.exercise_id === id);
    try {
      if (action === 'edit') {
        notify('Cargando ficha…');
        const { data } = await request('GET', `/api/v1/exercises/${encodeURIComponent(id)}`);
        notify('');
        openEditor(data);
        return;
      }
      if (action === 'delete' && !confirmStep(button, '¿Confirmar eliminación?')) return;
      if (action === 'off' && !confirmStep(button, '¿Confirmar desactivación?')) return;
      button.disabled = true;
      if (action === 'delete') {
        const { data } = await request('DELETE', `/api/v1/exercises/${encodeURIComponent(id)}`);
        notify(`${exercise?.title ?? 'Ejercicio'}: ${data.message}`, 'ok');
      } else {
        const { data } = await request('PATCH', `/api/v1/exercises/${encodeURIComponent(id)}`, { active: action === 'on' });
        notify(`${data.ficha.title} ahora está ${data.active ? 'activo: entra en planes nuevos' : 'inactivo: ya no entra en planes nuevos'}.`, 'ok');
      }
      if (editing?.exercise_id === id) closeEditor();
      await load();
    } catch (error) {
      notify(`No se completó la acción: ${error.message}`, 'error');
      button.disabled = false;
    }
  });

  ['buscare', 'filtro-prioridad', 'filtro-plataforma', 'filtro-estado'].forEach(id => $(id).addEventListener('input', render));
  $('ejercicios-filtros').addEventListener('submit', event => event.preventDefault());
  $('ejercicios-filtros').addEventListener('reset', () => setTimeout(render));

  if (!await guard()) return;
  try {
    await load();
    notify(`${exercises.length} ejercicios en el catálogo.`);
  } catch (error) {
    notify(`No se pudo cargar el catálogo: ${error.message}`, 'error');
  }
})();
