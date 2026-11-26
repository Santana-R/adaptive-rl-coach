'use strict';

// A31 · Rango declarado en Perfil. Fuente única: GET/POST /api/v1/rank-history.
// Solo agrega registros; no edita ni borra (el historial se conserva).
(function () {
  const NAMES = {
    bronze: 'Bronce', silver: 'Plata', gold: 'Oro', platinum: 'Platino', diamond: 'Diamante',
    champion: 'Campeón', grand_champion: 'Gran campeón', supersonic_legend: 'Leyenda supersónica'
  };
  const ROMAN = ['', 'I', 'II', 'III', 'IV'];
  const SOURCES = { self_reported: 'Declarado por ti' };

  const $status = $('#rango-estado');
  const $fields = $('#rango-campos');
  const $error = $('#rango-error');
  const $body = $('#rango-historial');

  async function request(method, body) {
    const client = window.CoachAuth?.getClient();
    if (!client) throw new Error('Falta configurar la conexión de autenticación.');
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
    const options = {
      url: '/api/v1/rank-history', method, dataType: 'json', timeout: 15000,
      headers: { Authorization: 'Bearer ' + data.session.access_token }
    };
    if (body !== undefined) {
      options.contentType = 'application/json';
      options.data = JSON.stringify(body);
    }
    try {
      return await $.ajax(options);
    } catch (xhr) {
      let message = xhr.responseJSON?.error?.message;
      if (!message) {
        message = xhr.status === 0 && method === 'POST'
          ? 'No se pudo confirmar el registro. Vuelve a consultar antes de repetirlo.'
          : 'No se pudo conectar con el historial de rango. Comprueba que Express esté ejecutándose.';
      }
      throw new Error(message);
    }
  }

  function label(entry) {
    const division = entry.division ? ' ' + ROMAN[entry.division] : '';
    return NAMES[entry.rank_label] + division;
  }

  function day(iso) {
    // Las fechas sin hora se guardan a mediodía UTC: mostrar la fecha UTC conserva el día elegido.
    return new Date(iso).toLocaleDateString('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });
  }

  function render(data) {
    $body.empty();
    if (!data.entries.length) {
      $body.append($('<tr>').append($('<td colspan="4" class="text-bray">').text('Todavía no registras ningún rango.')));
    }
    for (const entry of data.entries) {
      $body.append($('<tr>').append(
        $('<td>').text(day(entry.recorded_at)),
        $('<td>').text(entry.mode),
        $('<td>').text(label(entry)),
        $('<td>').text(SOURCES[entry.source] || entry.source)
      ));
    }
    const current = Object.entries(data.current).filter(([, e]) => e).map(([mode, e]) => `${mode}: ${label(e)}`);
    $status.text(current.length ? 'Rango vigente — ' + current.join(' · ') + '.' : 'Sin rango declarado. Los planes se generan sin variante por rango.');
  }

  async function load() {
    try {
      const response = await request('GET');
      render(response.data);
      $fields.prop('disabled', false);
    } catch (err) {
      $status.text(err.message);
    }
  }

  function today() {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  $('#rango-valor').on('change', function () {
    const legend = this.value === 'supersonic_legend';
    $('#rango-division').prop('disabled', legend);
    if (legend) $('#rango-division').val('');
  });

  $('#form-rango').on('submit', async function (event) {
    event.preventDefault();
    $error.text('');
    const rank = $('#rango-valor').val();
    const date = $('#rango-fecha').val();
    if (!rank) { $error.text('Selecciona un rango.'); $('#rango-valor').trigger('focus'); return; }
    if (!date) { $error.text('Indica la fecha en que viste ese rango.'); $('#rango-fecha').trigger('focus'); return; }
    if (date > today()) { $error.text('La fecha no puede ser futura.'); $('#rango-fecha').trigger('focus'); return; }
    const division = $('#rango-division').val();
    const body = { mode: $('#rango-modalidad').val(), rank_label: rank, recorded_at: date };
    if (division) body.division = Number(division);

    $fields.prop('disabled', true);
    try {
      await request('POST', body);
      $('#rango-valor').val('').trigger('change');
      await load();
      $status.trigger('focus');
    } catch (err) {
      $error.text(err.message);
      $fields.prop('disabled', false);
    }
  });

  $('#rango-fecha').attr('max', today()).val(today());
  load();
})();
