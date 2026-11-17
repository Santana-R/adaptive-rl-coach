'use strict';

// A28: seguimiento dentro de las pantallas existentes; nunca se suman fuentes distintas.
$(function () {
  const model = window.CoachFollowupModel;
  const service = window.CoachFollowupService;
  const sources = {
    compatible_replays: 'Replays compatibles', self_reported_sessions: 'Sesiones declaradas',
    self_reported: 'Rango declarado por el jugador'
  };
  const units = { minutes: 'minutos', percent: '%', seconds: 'segundos' };

  $('[data-coach-report]').each(function (index) {
    const panel = $(this).addClass('followup-panel');
    let revision = 0;
    const prefix = 'report-' + index + '-';
    const today = new Date();
    const first = new Date(today); first.setDate(first.getDate() - 29);
    const dateInput = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
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
      $('<p>').text('Rendimiento de partidas, práctica y rango declarado se consultan por separado. Los datos ausentes no equivalen a cero.'), form, exampleButton, status, content);

    function series(title, data) {
      const card = $('<section>').addClass('followup-item').append($('<h3>').addClass('h5').text(title));
      if (!data || !Array.isArray(data.points)) return card.append($('<p>').text('Serie no disponible: el servicio no devolvió sus datos.'));
      card.append($('<p>').addClass('followup-muted').text(
        'Fuente: ' + model.display(sources[data.source] || data.source) +
        ' · Unidad: ' + model.display(units[data.unit] || data.unit) +
        ' · Muestra informada: ' + model.display(data.sample_size) +
        (data.metric_key ? ' · Métrica: ' + data.metric_key : '') +
        (data.mode ? ' · Modalidad: ' + data.mode : '')
      ));
      if (!data.points.length) card.append($('<p>').text('Sin observaciones para este periodo.'));
      const list = $('<ul>');
      for (const point of data.points) {
        const value = point.value ?? point.rank_label;
        const origin = point.block_id ? 'Bloque ' + point.block_id : point.recorded_at || point.performed_at || point.date;
        const reason = point.reason || point.missing_reason;
        list.append($('<li>').text(model.display(origin) + ': ' + model.display(value) +
          (model.missing(value) ? ' · ' + (reason || 'El servicio no indicó un valor disponible.') : '') +
          (point.mode ? ' · ' + point.mode : '') +
          (point.source ? ' · Fuente: ' + (sources[point.source] || point.source) : '')));
      }
      card.append(list);
      const exclusions = Array.isArray(data.excluded) ? data.excluded : null;
      card.append($('<p>').text(exclusions ? 'Exclusiones informadas: ' + exclusions.length : 'Exclusiones: no informadas por el servicio.'));
      if (exclusions?.length) card.append($('<ul>').append(exclusions.map(item => $('<li>').text(
        typeof item === 'string' ? item : [item.block_id, item.reason || item.reason_code || item.message].filter(Boolean).join(' · ') || 'Motivo no informado'
      ))));
      return card;
    }

    function render(report, example) {
      content.empty();
      if (!report || typeof report !== 'object' || !report.period) throw new Error('El reporte no incluye su periodo.');
      status.text((example ? 'EJEMPLO ILUSTRATIVO · report.json · No son datos de tu cuenta. ' : '') + 'Periodo recibido: ' + model.display(report.period.from) + ' a ' + model.display(report.period.to) +
        ' · Zona: ' + model.display(report.period.timezone));
      content.append(series('Rendimiento medido', report.performance), series('Entrenamiento declarado', report.training), series('Rango declarado', report.rank));
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
    from.add(to).on('change', function () {
      revision++; button.prop('disabled', false); content.empty(); status.text('Periodo modificado. Consulta para actualizar el seguimiento.');
    });
    load();
  });
});
