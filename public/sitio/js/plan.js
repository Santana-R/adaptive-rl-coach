'use strict';

$(function () {
  const api = window.CoachPlanService;
  const model = window.CoachPlanModel;
  const coverageLabels = { complete: 'Completo', partial: 'Parcial', empty: 'Vacío' };
  const blockLabels = { ready: 'Listo', invalid: 'Requiere revisión', pending: 'Pendiente', processing: 'Procesando', failed: 'Fallido' };
  const reasons = {
    INSUFFICIENT_TIME: 'El tiempo disponible no alcanza para la rutina mínima.',
    NO_PRIORITIES: 'No hay prioridades respaldadas para proponer ejercicios.',
    NO_VERIFIED_ACTIVE_EXERCISE: 'No hay ejercicios activos y verificados compatibles.',
    CATALOG_PARTIAL: 'Faltan recursos esperados del catálogo para este contexto.',
    SHORT_SESSION: 'La sesión es corta: se seleccionaron los ejercicios que caben.',
    WORKSHOP_UNAVAILABLE: 'No hay acceso confirmado al mapa de Steam Workshop.',
    PLATFORM_INCOMPATIBLE: 'El recurso no es compatible con la plataforma del perfil.',
    MODE_INCOMPATIBLE: 'El ejercicio o la meta corresponde a otra modalidad.',
    REQUIREMENTS_INCOMPATIBLE: 'No se cumplen los requisitos de este recurso.',
    INACTIVE: 'El recurso está inactivo.',
    UNVERIFIED_RESOURCE: 'El recurso no tiene verificación técnica disponible.',
    RANK_NOT_AVAILABLE: 'No hay rango declarado compatible: se utiliza una ejecución base.',
    VARIANT_REQUEST_REJECTED: 'La variante solicitada no se admite para este contexto.',
    GOAL_INACTIVE: 'La meta está archivada.',
    GOAL_MODE_MISMATCH: 'La meta corresponde a otra modalidad.',
    GOAL_WITHOUT_SUPPORTED_PRIORITY: 'La meta no tiene una prioridad respaldada asociada.',
    GOALS_EXCLUDED: 'Algunas metas no se utilizaron; revisa sus motivos.',
    unpersisted_proposal: 'Esta propuesta todavía no está guardada.',
    synthetic_fixture: 'Las estadísticas de origen son sintéticas.',
    synthetic_catalog: 'El catálogo de origen es sintético.',
    heuristics_pending_calibration_A26: 'Las heurísticas todavía requieren calibración.'
  };

  let blocks = [];
  let profile = null;
  let goals = [];
  let blocksLoaded = false;
  let goalsLoaded = false;
  let selectedBlock = '';
  let lineageId = null;
  let versions = [];
  let display = null;
  let busy = false;
  let writeUncertain = false;

  function element(tag, text, className) {
    const item = $('<' + tag + '>');
    if (text !== undefined) item.text(text);
    if (className) item.addClass(className);
    return item;
  }

  function message(text, error = false) {
    $('#plan-status').text(text).toggleClass('plan-error', error);
  }

  function problem(error) {
    message(error.message, true);
    $('#plan-login').prop('hidden', error.status !== 401);
    if ([401, 403].includes(error.status)) {
      profile = null;
      goalsLoaded = false;
      display = null;
      versions = [];
      $('#plan-output, #no-plan').prop('hidden', true);
    }
    $('#plan-status').trigger('focus');
  }

  function canGenerate() {
    const block = blocks.find(item => item.block_id === selectedBlock);
    return profile && goalsLoaded && block && ['ready', 'invalid'].includes(block.status);
  }

  function input() {
    return {
      block_id: selectedBlock,
      availability_minutes: $('#plan-minutes').val() === '' ? null : Number($('#plan-minutes').val()),
      goal_ids: $('#plan-goals input:checked').map(function () { return $(this).val(); }).get(),
      workshop_access: $('#plan-workshop').prop('checked'),
      rank: $('#plan-rank').val(),
      coco_variant_key: $('#plan-variant').val()
    };
  }

  function fingerprint() {
    const value = model.validate(input());
    return value.valid ? JSON.stringify({ block: selectedBlock, data: value.data }) : null;
  }

  function updateControls() {
    $('#plan-fields').prop('disabled', busy || !blocksLoaded);
    $('.plan-page button').prop('disabled', busy);
    $('#preview-plan').prop('disabled', busy || !canGenerate() || writeUncertain);
    $('#plan-version').prop('disabled', busy || !versions.length);
    const savable = display && !display.persisted && model.canSave(display.plan) &&
      display.signature === fingerprint() && canGenerate() && !writeUncertain;
    $('#save-plan').prop('disabled', busy || !savable);
    $('#plan-form, #plan-output').attr('aria-busy', String(busy));
  }

  function setBusy(value) {
    busy = value;
    updateControls();
  }

  function syncUrl() {
    const url = new URL(window.location.href);
    ['scenario', 'minutes', 'history', 'block_id', 'plan_id', 'version'].forEach(key => url.searchParams.delete(key));
    if (selectedBlock) url.searchParams.set('block_id', selectedBlock);
    if (display?.persisted) {
      url.searchParams.set('plan_id', display.plan.plan_id);
      url.searchParams.set('version', String(display.plan.version));
    }
    window.history.replaceState(null, '', url.pathname + url.search);
  }

  function fillGoals() {
    const box = $('#plan-goals').empty();
    if (!goalsLoaded) {
      box.append(element('p', 'No se pudieron consultar tus metas. Actualiza los datos antes de generar.', 'plan-error'));
      return;
    }
    const block = blocks.find(item => item.block_id === selectedBlock);
    const available = goals.filter(goal => goal.type === 'performance' && goal.status === 'active' && goal.mode === block?.mode);
    if (!available.length) box.append(element('p', 'No hay metas activas de rendimiento para esta modalidad. Puedes generar sin metas.', 'text-bray'));
    available.forEach(function (goal) {
      const label = element('label', undefined, 'd-flex gap-2 mb-2');
      label.append($('<input>').attr({ type: 'checkbox', value: goal.goal_id }).addClass('form-check-input'));
      label.append(element('span', goal.name + ' · ' + goal.comparator + ' ' + goal.target_value + ' %'));
      box.append(label);
    });
  }

  function blockHelp() {
    const block = blocks.find(item => item.block_id === selectedBlock);
    $('#plan-block-help').text(block
      ? (blockLabels[block.status] || block.status) + ' · ' + (block.mode || 'Modalidad no disponible') + '. El servidor verifica identidad y validez de los replays.'
      : 'Selecciona un bloque propio. Si no tienes bloques, empieza en Replays.');
  }

  function renderVersions() {
    const selector = $('#plan-version').empty();
    if (!versions.length) selector.append($('<option>').val('').text('No hay versiones guardadas'));
    versions.forEach(function (item) {
      selector.append($('<option>').val(String(item.version)).text(
        'Versión ' + item.version + ' · ' + item.availability_minutes + ' min · ' + (coverageLabels[item.coverage] || item.coverage || item.status)
      ));
    });
    if (display?.persisted) selector.val(String(display.plan.version));
    else if (versions.length) {
      selector.prepend($('<option>').val('').text('Propuesta sin guardar / elegir versión'));
      selector.val('');
    }
    updateControls();
  }

  function explainCode(code) {
    return reasons[code] || 'Motivo informado por el motor: ' + code;
  }

  function appendList(container, title, values, transform) {
    if (!values?.length) return;
    container.append(element('h3', title, 'h6 mt-3'));
    const list = element('ul');
    values.forEach(value => list.append(element('li', transform(value))));
    container.append(list);
  }

  function renderOutput() {
    if (!display) return;
    const plan = display.plan;
    const meta = display.meta || {};
    const snapshot = plan.profile_snapshot || {};
    const number = value => value === null || value === undefined ? 'No disponible' : String(value);
    $('#no-plan').prop('hidden', true);
    $('#plan-output').prop('hidden', false);
    $('#plan-badge').text((display.persisted ? 'Guardado · ' : 'Sin guardar · ') + (coverageLabels[plan.coverage] || plan.coverage));
    $('#plan-identity').text('Bloque ' + plan.block_id + ' · ' + (display.persisted ? 'Versión ' + plan.version : 'Propuesta') +
      ' · ' + (snapshot.mode || 'Modalidad no disponible'));
    const source = plan.metrics_source || meta.source ||
      plan.diagnosis_snapshot?.priorities?.[0]?.evidence?.source ||
      (plan.limitations?.includes('synthetic_fixture') ? 'synthetic' : 'No disponible');
    $('#plan-source').text('Fuente de métricas: ' + source + ' · Catálogo: ' + (plan.catalog_source || meta.catalog_source || 'No disponible') +
      ' · Reglas: ' + (plan.rules_version || 'No disponible'));
    $('#plan-explanation').text(plan.explanation || 'Sin explicación disponible.');
    $('#available-minutes').text(number(plan.availability_minutes));
    $('#assigned-minutes').text(number(plan.assigned_minutes));
    $('#unassigned-minutes').text(number(plan.unassigned_minutes));
    const hasTime = Number.isFinite(plan.availability_minutes) && Number.isFinite(plan.assigned_minutes);
    const percent = plan.availability_minutes > 0 && Number.isFinite(plan.assigned_minutes)
      ? Math.min(100, Math.max(0, 100 * plan.assigned_minutes / plan.availability_minutes)) : 0;
    if (hasTime) $('#plan-time-progress').attr('aria-valuenow', String(Math.round(percent)));
    else $('#plan-time-progress').removeAttr('aria-valuenow');
    $('#plan-time-bar').css('width', percent + '%').text(hasTime ? Math.round(percent) + ' %' : 'No disponible');

    const older = display.persisted && versions.some(item => item.version > plan.version);
    $('#plan-context-note').text(display.persisted
      ? (older ? 'Versión histórica. ' : 'Versión guardada. ') +
      'Se muestran sus instrucciones y preferencias originales; editar el formulario no la modifica. Rango: ' +
      (snapshot.rank || 'Sin declarar') + ' · Workshop declarado: ' + (snapshot.workshop_access ? 'Sí' : 'No') + '.'
      : 'Propuesta calculada con las preferencias indicadas. Todavía no forma parte del historial.');
    $('#save-plan').prop('hidden', display.persisted);
    const missingVersions = (plan.exercises || []).filter(exercise => !model.validId(exercise.exercise_version_id));
    const saveNote = display.persisted ? 'Puedes ajustar la rutina para preparar otra versión.'
      : plan.availability_minutes < 1 ? 'Indica al menos un minuto para guardar el plan.'
      : missingVersions.length ? 'Falta una versión de catálogo para: ' +
        missingVersions.map(exercise => exercise.exercise_snapshot?.title || exercise.exercise_key).join(', ') + '.'
      : 'El plan aparecerá en el historial de este bloque después de guardarlo.';
    $('#plan-save-note').text(saveNote);

    const sessions = display.persisted ? model.sessionsUrl(plan) : null;
    $('#plan-sessions').prop('hidden', !sessions);
    if (sessions) $('#plan-sessions').attr('href', sessions);
    else $('#plan-sessions').removeAttr('href');

    const exerciseBox = $('#plan-exercises').empty();
    if (!plan.exercises?.length) exerciseBox.append(element('p', 'No hay ejercicios para estas entradas. Revisa la explicación y la cobertura.', 'plan-card'));
    (plan.exercises || []).forEach(function (exercise) {
      const content = exercise.exercise_snapshot || {};
      const card = element('details', undefined, 'plan-card');
      card.append(element('summary', exercise.order + '. ' + (content.title || exercise.exercise_key) +
        ' · ' + number(exercise.assigned_minutes) + ' min · Dificultad ' + number(exercise.difficulty), 'fw-bold'));
      card.append(element('p', content.purpose || 'Finalidad no disponible.', 'mt-3'));
      const steps = element('ol');
      (content.instructions || []).forEach(step => steps.append(element('li', step)));
      card.append(steps);
      if (content.practice_level_instruction) card.append(element('p', content.practice_level_instruction));
      if (content.success_criterion) card.append(element('p', 'Criterio de práctica: ' + content.success_criterion));
      if (content.resource_code) card.append(element('p', 'Código del recurso: ' + content.resource_code, 'text-accent'));
      const href = model.safeResource(content.resource_url);
      if (href) card.append($('<a>').attr({ href, target: '_blank', rel: 'noopener noreferrer' }).addClass('text-accent').text('Abrir recurso'));
      card.append(element('p', 'Versión de ejercicio: ' + (exercise.exercise_version_id || 'Rutina nativa sin ID SQL') +
        (content.content_version ? ' · Contenido ' + content.content_version : ''), 'text-bray mt-2'));
      if (content.selected_variant) {
        const variant = content.selected_variant;
        const settings = ['random_target_sizes', 'random_wall_distances', 'random_ball_drops']
          .filter(key => typeof variant[key] === 'boolean').map(key => key + ': ' + (variant[key] ? 'Sí' : 'No')).join(' · ');
        card.append(element('p', 'Variante: ' + variant.variant_key + (settings ? ' · ' + settings : ''), 'text-bray'));
      }
      const exerciseSessions = display.persisted ? model.sessionsUrl(plan, exercise.plan_exercise_id) : null;
      if (exerciseSessions) card.append($('<a>').attr('href', exerciseSessions).addClass('btn-rl btn-rl-outline mt-2').text('Ir a Sesiones con este ejercicio'));
      exerciseBox.append(card);
    });

    const rationale = $('#plan-reasons').empty();
    const priorities = plan.diagnosis_snapshot?.priorities || [];
    if (!priorities.length) rationale.append(element('p', 'Sin prioridades respaldadas para esta propuesta.', 'text-bray'));
    priorities.forEach(priority => {
      rationale.append(element('h3', priority.title || priority.priority_key, 'h6'));
      rationale.append(element('p', priority.explanation || 'Consulta la explicación de cobertura.'));
    });
    const used = $('#plan-used-goals').empty();
    if (!plan.goals_snapshot?.length) used.append(element('p', 'No se utilizaron metas compatibles.', 'text-bray'));
    (plan.goals_snapshot || []).forEach(goal => used.append(element('p',
      (goal.name || goal.metric_key) + ' · ' + goal.comparator + ' ' + goal.target_value + ' % · Versión de meta ' + (goal.goal_version_id || 'No disponible'))));
    const limits = $('#plan-limitations').empty();
    appendList(limits, 'Motivos', plan.reason_codes, explainCode);
    appendList(limits, 'Prioridades sin cubrir', plan.uncovered_priorities, String);
    appendList(limits, 'Recursos faltantes', plan.missing_exercises, String);
    appendList(limits, 'Recursos excluidos', plan.catalog_exclusions, value =>
      (value.exercise_key || value.key || 'Recurso') + ': ' + explainCode(value.reason || value.reason_code || 'No disponible'));
    appendList(limits, 'Metas excluidas', plan.goals_excluded, value => 'Meta ' + value.goal_id + ': ' + explainCode(value.reason));
    appendList(limits, 'Limitaciones', plan.limitations, explainCode);
    if (!limits.children().length) limits.append(element('p', 'No se informaron exclusiones adicionales.', 'text-bray'));
    updateControls();
  }

  async function loadVersions() {
    versions = await api.versions(lineageId);
    if (!Array.isArray(versions)) throw new Error('No se pudo interpretar el historial del plan.');
    $('#versions-note').text('Cada bloque tiene su propio plan. Consultar una versión no modifica su contenido.');
    renderVersions();
  }

  async function showStored(response) {
    display = { plan: response.data, meta: response.meta, persisted: true };
    lineageId = response.data.plan_id;
    selectedBlock = response.data.block_id;
    $('#plan-block').val(selectedBlock);
    try {
      await loadVersions();
    } catch (error) {
      if ([401, 403].includes(error.status)) throw error;
      versions = [{ ...response.data }];
      renderVersions();
      $('#versions-note').text('Se recuperó esta versión, pero no el historial completo. Usa Actualizar datos para reintentar.');
    }
    renderOutput();
    $('#plan-adjust').prop('open', false);
    syncUrl();
  }

  function clearPlan() {
    display = null;
    lineageId = null;
    versions = [];
    $('#plan-output').prop('hidden', true);
    $('#plan-adjust').prop('open', true);
    $('#no-plan').prop('hidden', false).text('No hay un plan consultado. Genera una propuesta para este bloque.');
    renderVersions();
  }

  async function readBlockPlan() {
    clearPlan();
    if (!selectedBlock) {
      $('#no-plan').text('Selecciona un bloque. Si aún no tienes partidas cargadas, empieza en Replays.');
      return;
    }
    try {
      await showStored(await api.blockPlan(selectedBlock));
      message('Plan guardado recuperado del servidor.');
    } catch (error) {
      if (error.status === 404) {
        $('#no-plan').text('Este bloque aún no tiene un plan guardado. Genera una propuesta cuando el bloque esté listo.');
        message('Sin plan guardado para este bloque.');
      } else {
        problem(error);
      }
    }
    syncUrl();
  }

  async function initialize() {
    if (busy) return;
    if (display && !display.persisted && !window.confirm('Actualizar descartará la propuesta sin guardar. ¿Continuar?')) return;
    setBusy(true);
    message('Consultando perfil, bloques y metas…');
    writeUncertain = false;
    const query = new URLSearchParams(window.location.search);
    const results = await Promise.allSettled([api.blocks(), api.profile(), api.goals()]);
    blocksLoaded = results[0].status === 'fulfilled' && Array.isArray(results[0].value);
    blocks = blocksLoaded ? results[0].value.map(block => ({ ...block, block_id: String(block.block_id) })) : [];
    profile = results[1].status === 'fulfilled' ? results[1].value : null;
    goalsLoaded = results[2].status === 'fulfilled' && Array.isArray(results[2].value);
    goals = goalsLoaded ? results[2].value : [];
    const selector = $('#plan-block').empty().append($('<option>').val('').text('Selecciona un bloque'));
    blocks.forEach(block => selector.append($('<option>').val(block.block_id).text(
      'Bloque ' + block.block_id + ' · ' + (block.mode || '') + ' · ' + (blockLabels[block.status] || block.status)
    )));
    $('#plan-profile').text(profile
      ? 'Perfil actual: ' + profile.platform + ' · ' + profile.mode + '. La identidad y plataforma se verifican en el servidor; no se pueden sustituir desde este formulario.'
      : 'No se pudo cargar Perfil. Puedes consultar versiones guardadas, pero necesitas un perfil válido para generar.');
    $('#plan-minutes').val(profile?.available_minutes ?? '');
    $('#plan-platform-help').text(profile?.platform === 'epic'
      ? 'Perfil Epic: Steam Workshop no es compatible. El motor explica la selección de recursos disponibles.'
      : 'Tener Steam no acredita acceso al mapa. Declara Workshop solo si puedes abrirlo.');
    $('#plan-workshop').prop('checked', false);
    selectedBlock = model.validId(query.get('block_id')) ? query.get('block_id') :
      (blocks.find(block => block.status === 'ready')?.block_id || blocks[0]?.block_id || '');
    selector.val(selectedBlock);
    fillGoals();
    blockHelp();
    try {
      const planId = query.get('plan_id');
      const version = query.get('version');
      if (planId) {
        if (!model.validId(planId) || (version && !/^[1-9]\d{0,8}$/.test(version))) throw new Error('El enlace de plan o versión no es válido.');
        const response = version ? await api.version(planId, version) : await api.plan(planId);
        if (!blocks.some(block => block.block_id === response.data.block_id)) {
          blocks.push({ block_id: response.data.block_id, mode: response.data.profile_snapshot?.mode, status: 'unknown' });
          selector.append($('<option>').val(response.data.block_id).text('Bloque ' + response.data.block_id + ' · versión guardada'));
        }
        await showStored(response);
        fillGoals();
        blockHelp();
        message('Versión guardada recuperada del servidor.');
      } else {
        await readBlockPlan();
      }
      if (!blocksLoaded) problem(results[0].reason || new Error('No se pudieron consultar los bloques.'));
      else if (!profile || !goalsLoaded) message('Consulta disponible. Revisa los avisos de Perfil o metas antes de generar.', true);
    } catch (error) {
      clearPlan();
      problem(error);
    } finally {
      setBusy(false);
    }
  }

  $('#plan-block').on('change', async function () {
    if (busy) return;
    const next = $(this).val();
    if (display && !display.persisted && !window.confirm('Cambiar de bloque descartará la propuesta sin guardar. ¿Continuar?')) {
      $(this).val(selectedBlock);
      return;
    }
    selectedBlock = next;
    writeUncertain = false;
    fillGoals();
    blockHelp();
    setBusy(true);
    try { await readBlockPlan(); }
    finally { setBusy(false); }
  });

  $('#plan-form').on('input change', function (event) {
    if (event.target.id === 'plan-block') return;
    if (display && !display.persisted && display.signature !== fingerprint()) {
      $('#plan-save-note').text('Cambiaste las preferencias. Genera otra propuesta antes de guardar; la mostrada conserva el contexto anterior.');
    }
    updateControls();
  });

  $('[data-plan-minutes]').on('click', function () {
    $('#plan-minutes').val(Number($(this).attr('data-plan-minutes'))).trigger('change');
  });

  $('#plan-form').on('submit', async function (event) {
    event.preventDefault();
    if (busy || !canGenerate() || writeUncertain) return;
    const result = model.validate(input());
    if (!result.valid) {
      message(Object.values(result.errors).join(' '), true);
      return;
    }
    setBusy(true);
    message('Calculando propuesta…');
    try {
      const response = await api.proposal(selectedBlock, result.data);
      display = {
        plan: response.data, meta: response.meta, persisted: false,
        request: JSON.parse(JSON.stringify(result.data)), signature: fingerprint()
      };
      renderVersions();
      renderOutput();
      syncUrl();
      $('#plan-adjust').prop('open', false);
      $('#output-title').trigger('focus');
      message('Propuesta calculada. Todavía no está guardada.');
    } catch (error) { problem(error); }
    finally { setBusy(false); }
  });

  $('#save-plan').on('click', async function () {
    if (busy || !display || display.persisted || writeUncertain || display.signature !== fingerprint() || !model.canSave(display.plan)) return;
    if (!window.confirm('Se generará y guardará una nueva versión con estas preferencias. Las anteriores se conservan. ¿Continuar?')) return;
    const request = display.request;
    setBusy(true);
    message('Generando y guardando versión…');
    try {
      const response = lineageId
        ? await api.saveVersion(lineageId, request)
        : await api.saveBlock(selectedBlock, request);
      display = { plan: response.data, meta: response.meta, persisted: true };
      lineageId = response.data.plan_id;
      renderOutput();
      syncUrl();
      try {
        await loadVersions();
        renderOutput();
        message('Versión ' + response.data.version + ' guardada en el servidor.');
      } catch (error) {
        versions = [{ ...response.data }];
        renderVersions();
        message('La versión se guardó, pero no se pudo actualizar el historial. Usa Actualizar datos.', true);
      }
    } catch (error) {
      if (error.status === 0 || error.code === 'PLAN_VERSION_CONFLICT') {
        writeUncertain = true;
        $('#plan-save-note').text('Consulta los datos actuales antes de repetir el guardado.');
      }
      problem(error);
    } finally { setBusy(false); }
  });

  $('#plan-version').on('change', async function () {
    const version = $(this).val();
    if (busy || !version || !lineageId) return;
    if (display && !display.persisted && !window.confirm('Consultar esta versión descartará la propuesta sin guardar. ¿Continuar?')) {
      $(this).val('');
      return;
    }
    setBusy(true);
    message('Consultando versión…');
    try {
      const response = await api.version(lineageId, version);
      display = { plan: response.data, meta: response.meta, persisted: true };
      renderOutput();
      syncUrl();
      message('Versión ' + version + ' consultada sin modificarla.');
    } catch (error) {
      if (display?.persisted) $(this).val(String(display.plan.version));
      problem(error);
    } finally { setBusy(false); }
  });

  $('#reload-plan').on('click', initialize);
  initialize();
});
