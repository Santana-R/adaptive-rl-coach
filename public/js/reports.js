'use strict';

// A28: seguimiento dentro de las pantallas existentes; nunca se suman fuentes distintas.
$(function () {
  const model = window.CoachFollowupModel;
  const service = window.CoachFollowupService;
  const sources = {
    compatible_replays: 'Replays compatibles', self_reported_sessions: 'Sesiones declaradas',
    self_reported: 'Rango declarado por el jugador', stored_replay_metrics: 'Métricas persistidas de replays',
    goal_versions: 'Versiones de objetivos'
  };
  const units = { minutes: 'minutos', percent: '%', seconds: 'segundos', rank_label: 'rango declarado', count: 'conteo', mixed: 'según cada objetivo' };

  $('[data-coach-report]').each(function (index) {
    const panel = $(this).addClass('followup-panel');
    let revision = 0;
    const prefix = 'report-' + index + '-';
    const today = new Date();
    // A22 interpreta fechas en America/Monterrey, no en la zona del navegador.
    const first = new Date(today); first.setDate(first.getDate() - 29);
    const dateInput = date => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
    const form = $('<form>').addClass('row g-3 align-items-end');
    function dateField(label, key, value) {
      const id = prefix + key;
      const input = $('<input>').attr({ id, type: 'date', required: true }).addClass('form-control').val(value);
      form.append($('<div>').addClass('col-12 col-sm-4').append($('<label>').attr('for', id).text(label), input));
      return input;
    }
    const from = dateField('Desde', 'from', dateInput(first));
    const to = dateField('Hasta', 'to', dateInput(today));
    const button = $('<button>').attr('type', 'submit').addClass('btn-rl btn-rl-outline').text('Consultar seguimiento');
    form.append($('<div>').addClass('col-12 col-sm-4').append(button));
    const status = $('<p>').attr({ role: 'status', 'aria-live': 'polite' }).addClass('mt-3');
    const content = $('<div>');
    const exampleButton = $('<button>').attr('type', 'button').addClass('btn-rl btn-rl-outline mt-3').text('Ver ejemplo de reporte (datos de prueba)');
    panel.append($('<h2>').addClass('h4').text('Seguimiento por periodo'),
      $('<p>').text('Rendimiento de partidas, práctica y rango declarado se consultan por separado. Los datos ausentes no equivalen a cero. Fechas inclusivas en America/Monterrey.'), form, exampleButton, status, content);

    const reasons = {
      no_matching_training_sessions: 'Sin sesiones compatibles con esta versión y periodo de la meta.',
      no_matching_replay_block: 'Sin un bloque compatible para evaluar esta meta.',
      missing_duration: 'Faltan los minutos declarados.', invalid_duration: 'Duración inválida.',
      missing_timestamp: 'Falta la fecha.', invalid_timestamp: 'Fecha inválida.',
      missing_block_metrics: 'Faltan las métricas del bloque.', block_not_ready: 'El bloque aún no está listo.',
      invalid_block: 'El bloque no cumple las condiciones de análisis.',
      crosses_period_boundary: 'El bloque cruza los límites del periodo consultado.',
      invalid_shooting_pct: 'No se puede calcular una efectividad válida.',
      zero_denominator: 'No hay tiros para calcular la efectividad.', not_available: 'Dato no disponible.',
      incomplete_coverage: 'No hay cobertura completa de las cinco partidas.', unit_mismatch: 'La unidad no es compatible.',
      unsupported_goal: 'La versión de objetivo no es compatible.', invalid_goal_dates: 'Fechas del objetivo inválidas.',
      invalid_goal_activation: 'Falta una fecha válida de activación de la meta.', invalid_goal_archive: 'Fecha de archivo inválida.',
      unverified_rank_source: 'La fuente de rango no es una declaración verificada.', invalid_rank: 'Declaración de rango inválida.',
      NO_PREVIOUS_COMPATIBLE_BLOCK: 'Primer bloque o sin bloque anterior compatible.'
    };
    const explain = value => reasons[value] || model.display(value);
    const source = value => sources[value] || model.display(value);
    const unit = value => units[value] || model.display(value);
    const measure = (value, key) => model.display(value) + (model.missing(value) ? '' : ' ' + unit(key));
    const windowText = period => period ? model.display(period.from) + ' a ' + (period.to || 'sin fecha límite') + ' · ' + model.display(period.timezone) : 'No disponible';

    function detailLine(list, label, value) {
      list.append($('<li>').text(label + ': ' + model.display(value)));
    }

    function pointView(kind, point, data) {
      const item = $('<li>').addClass('mb-3');
      const details = $('<ul>').addClass('followup-muted');
      if (kind === 'performance') {
        item.append($('<strong>').text('Bloque ' + model.display(point.block_id) + ': ' + measure(point.value, data.unit)));
        detailLine(details, 'Partidas de la muestra', point.sample_size);
        detailLine(details, 'Goles / tiros', model.display(point.numerator?.value) + ' / ' + model.display(point.denominator?.value));
        detailLine(details, 'Partidas del bloque', model.display(point.first_match_at) + ' a ' + model.display(point.last_match_at));
        detailLine(details, 'Contexto', [point.mode, point.match_type, point.platform].filter(Boolean).join(' · ') || null);
        detailLine(details, 'Fuente del punto', source(point.source));
        detailLine(details, 'Versión de métricas', point.metrics_version);
        if (point.comparison) {
          const comparison = point.comparison;
          detailLine(details, 'Comparación', comparison.status === 'baseline' ? 'Línea base' : comparison.status === 'comparable' ? 'Comparable' : comparison.status);
          detailLine(details, 'Bloque de referencia', comparison.baseline_block_id);
          detailLine(details, 'Cambio de efectividad', model.missing(comparison.delta_pp) ? 'No disponible' : comparison.delta_pp + ' puntos porcentuales');
          for (const reason of comparison.reason_codes || []) detailLine(details, 'Motivo de comparación', explain(reason));
        }
      } else if (kind === 'training') {
        item.append($('<strong>').text('Sesión ' + model.display(point.session_id) + ': ' + measure(point.duration_minutes, 'minutes')));
        detailLine(details, 'Fecha de práctica', point.performed_at);
        detailLine(details, 'Versión exacta del plan', point.plan_version_id);
        detailLine(details, 'Modalidad', point.mode);
      } else if (kind === 'rank') {
        item.append($('<strong>').text(model.display(point.rank_label) + ' · ' + model.display(point.mode)));
        detailLine(details, 'Fecha declarada', point.recorded_at);
        detailLine(details, 'División', point.division);
        detailLine(details, 'Temporada', point.season);
        detailLine(details, 'Fuente', source(data.source));
      } else {
        const states = { met: 'Meta alcanzada en esta evaluación', not_met: 'Meta no alcanzada en esta evaluación', insufficient_data: 'Evidencia insuficiente' };
        item.append($('<strong>').text(model.display(point.name) + ' · versión ' + model.display(point.version)));
        detailLine(details, 'Estado evaluado por el servidor', states[point.status] || point.status);
        detailLine(details, 'Resultado', measure(point.actual_value, point.unit));
        detailLine(details, 'Meta', model.display(point.comparator) + ' ' + measure(point.target_value, point.unit));
        detailLine(details, 'Tipo / modalidad', model.display(point.type) + ' · ' + model.display(point.mode));
        detailLine(details, 'Periodo de la meta', windowText(point.goal_period));
        detailLine(details, 'Ventana evaluada (fin exclusivo)', model.display(point.active_from) + ' a ' + model.display(point.active_until));
        detailLine(details, 'Fuente de evidencia', source(point.source));
        detailLine(details, 'Muestra de evidencia', point.sample_size);
        detailLine(details, 'ID de objetivo / versión', model.display(point.goal_id) + ' / ' + model.display(point.goal_version_id));
        if (point.evidence?.block_id) detailLine(details, 'Bloque de evidencia', point.evidence.block_id);
        if (Array.isArray(point.evidence?.session_ids)) detailLine(details, 'Sesiones de evidencia', point.evidence.session_ids.join(', ') || 'Sin sesiones');
        if (point.denominator) detailLine(details, 'Denominador', model.display(point.denominator.value) + ' ' + model.display(point.denominator.metric_key));
      }
      const reason = point.reason || point.missing_reason;
      if (reason) detailLine(details, 'Motivo', explain(reason));
      else if (kind === 'performance' && model.missing(point.value)) detailLine(details, 'Motivo', 'El servicio no indicó un valor disponible.');
      item.append(details);
      return item;
    }

    function series(title, data, kind) {
      const card = $('<section>').addClass('followup-item').attr('data-report-series', kind).append($('<h3>').addClass('h5').text(title));
      if (!data || !Array.isArray(data.points)) return card.append($('<p>').text('Serie no disponible: el servicio no devolvió sus datos.'));
      const sample = { performance: 'partidas', training: 'sesiones', rank: 'declaraciones', goals: 'evaluaciones con evidencia' };
      card.append($('<p>').addClass('followup-muted').text(
        'Fuente: ' + source(data.source) + ' · Unidad: ' + unit(data.unit) +
        ' · Muestra informada: ' + model.display(data.sample_size) + ' ' + sample[kind] +
        (data.metric_key ? ' · Métrica: ' + data.metric_key : '')
      ));
      if (data.period) card.append($('<p>').text('Periodo de la serie: ' + windowText(data.period)));
      if (kind === 'training' && Object.prototype.hasOwnProperty.call(data, 'total_minutes')) {
        card.append($('<p>').text('Total declarado calculado por el servidor: ' + measure(data.total_minutes, 'minutes')));
      }
      if (data.denominator) card.append($('<p>').text('Denominador informado: ' + model.display(data.denominator.value) + ' ' + model.display(data.denominator.metric_key)));
      if (!data.points.length) card.append($('<p>').text('Sin observaciones para este periodo.'));
      const list = $('<ul>');
      for (const point of data.points) list.append(pointView(kind, point, data));
      card.append(list);
      const exclusions = Array.isArray(data.excluded) ? data.excluded : null;
      card.append($('<p>').text(exclusions ? 'Exclusiones informadas: ' + exclusions.length : 'Exclusiones: no informadas por el servicio.'));
      if (exclusions?.length) card.append($('<ul>').append(exclusions.map(item => $('<li>').text(
        typeof item === 'string' ? explain(item) : [
          item.block_id ? 'Bloque ' + item.block_id : item.session_id ? 'Sesión ' + item.session_id : item.rank_id ? 'Rango ' + item.rank_id : item.goal_id ? 'Objetivo ' + item.goal_id : null,
          item.goal_version_id ? 'Versión ' + item.goal_version_id : null,
          explain(item.reason || item.reason_code || item.message),
          ...(item.reason_codes || []).map(explain)
        ].filter(Boolean).join(' · ')
      ))));
      return card;
    }

    function render(report, example) {
      content.empty();
      if (!report || typeof report !== 'object' || !report.period) throw new Error('El reporte no incluye su periodo.');
      status.text((example ? 'EJEMPLO ILUSTRATIVO · report.json · No son datos de tu cuenta. ' : '') + 'Periodo recibido: ' + model.display(report.period.from) + ' a ' + model.display(report.period.to) +
        ' · Zona: ' + model.display(report.period.timezone));
      content.append(
        series('Rendimiento medido', report.performance, 'performance'),
        series('Entrenamiento declarado', report.training, 'training'),
        series('Rango declarado', report.rank, 'rank'),
        series('Evaluación de objetivos', report.goals, 'goals')
      );
    }

    async function load(event) {
      event?.preventDefault();
      const ticket = ++revision;
      let query;
      try { query = model.period(from.val(), to.val()); }
      catch (error) { status.text(error.message); content.empty(); return; }
      button.prop('disabled', true);
      content.empty(); status.removeClass('followup-error').text('Consultando seguimiento…');
      try {
        const report = await service.report(query);
        if (ticket !== revision) return;
        render(report, false);
      } catch (error) {
        if (ticket === revision) status.addClass('followup-error').text(error.message + ' Puedes volver a consultar.');
      } finally { if (ticket === revision) button.prop('disabled', false); }
    }
    exampleButton.on('click', async function () {
      const ticket = ++revision;
      button.prop('disabled', false); content.empty();
      status.removeClass('followup-error').text('Consultando el ejemplo identificado…');
      try {
        const example = await $.getJSON('/fixtures/report-example.json');
        if (ticket === revision) render(example, true);
      } catch (error) {
        if (ticket === revision) status.addClass('followup-error').text('No se pudo cargar el ejemplo. No se sustituyeron tus datos.');
      }
    });
    form.on('submit', load);
    $(document).on('coach:sessions-changed', () => load());
    from.add(to).on('change', function () {
      revision++; button.prop('disabled', false); content.empty(); status.text('Periodo modificado. Consulta para actualizar el seguimiento.');
    });
    load();
  });
});
