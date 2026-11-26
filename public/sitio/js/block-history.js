'use strict';

(function () {
  const model = window.CoachFollowupModel;
  const api = window.CoachFollowupService;
  const labels = { pending: 'Pendiente', processing: 'Procesando', ready: 'Listo', invalid: 'Requiere corrección', failed: 'Fallo recuperable' };
  const reasons = {
    REPLAY_FILES_EXPIRED: 'Caducaron los archivos temporales. Carga otro bloque.',
    REPLAY_FILES_CHANGED: 'Los archivos temporales cambiaron. Carga otro bloque.',
    RATE_LIMITED: 'El proveedor limitó las solicitudes. Espera antes de reintentar.',
    PROCESSING_TIMEOUT: 'El proveedor no terminó dentro del plazo.',
    PLAYER_MISMATCH: 'El jugador no coincide con el perfil.',
    MODE_MISMATCH: 'La modalidad no coincide.',
    MATCH_TYPE_MISMATCH: 'Los tipos de partida no coinciden.',
    PROVIDER_UNAVAILABLE: 'El proveedor no está disponible temporalmente.'
  };
  let panel, status, list, detail, timer, revision = 0, detailRevision = 0, selected = null, busy = false;

  function mount() {
    if (panel) return;
    panel = $('[data-block-history]').first().addClass('followup-panel');
    if (!panel.length) { panel = null; return; }
    status = $('<p>').attr({ role: 'status', 'aria-live': 'polite' });
    list = $('<div>');
    detail = $('<section>').attr({ tabindex: '-1', 'aria-label': 'Detalle del bloque' }).prop('hidden', true);
    const heading = $('<div>').addClass('d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2').append(
      $('<h2>').addClass('h4 mb-0').text('Mis bloques de partidas'),
      $('<button>').attr('type', 'button').addClass('btn-rl btn-rl-outline').text('Actualizar historial').on('click', () => refresh())
    );
    panel.empty().append(heading, status, list, detail);
  }

  const reasonText = code => reasons[code] || code;

  function readyActions(id) {
    const query = '?' + new URLSearchParams({ block_id: id });
    return [
      $('<a>').addClass('btn-rl btn-rl-accent').attr('href', 'analisis.html' + query).text('Ver resultados'),
      $('<a>').addClass('btn-rl btn-rl-outline').attr('href', 'plan.html' + query).text('Mi entrenamiento')
    ];
  }
  async function show(id, focus = true) {
    selected = id;
    const ticket = ++detailRevision;
    detail.prop('hidden', false).empty().append($('<p>').text('Consultando detalle…'));
    try {
      const block = await api.block(id);
      if (ticket !== detailRevision) return;
      detail.empty().append($('<h3>').addClass('h5 mt-3').text('Bloque ' + block.block_id),
        $('<p>').text((labels[block.status] || 'Estado desconocido') + ' · ' + model.display(block.mode) + ' · ' + model.matchType(block.match_type)),
        $('<p>').text('Creado: ' + model.localDate(block.created_at) + ' · Completado: ' + model.localDate(block.completed_at)));
      const replays = $('<ul>');
      for (const replay of block.replays || []) {
        const reason = replay.error ? replay.error.split(',').map(reasonText).join(' ') : '';
        replays.append($('<li>').text(model.display(replay.position) + '. ' + model.display(replay.file_name) + ' · ' +
          (replay.status === 'ok' ? 'Válido' : labels[replay.status] || model.display(replay.status)) + (reason ? ' · ' + reason : '')));
      }
      detail.append(replays);
      if (!(block.replays || []).length) detail.append($('<p>').text('El servicio no devolvió el detalle de partidas.'));
      if (block.status === 'ready') detail.append($('<div>').addClass('d-flex flex-wrap gap-2').append(...readyActions(id)));
      if (focus) detail.trigger('focus');
    } catch (error) { if (ticket === detailRevision) detail.empty().append($('<p>').text(error.message)); }
  }

  async function retry(block, button) {
    if (busy) return;
    if (!window.confirm('¿Reintentar el procesamiento del bloque ' + block.block_id + '?')) return;
    busy = true; button.prop('disabled', true); clearTimeout(timer);
    try {
      await api.retry(block.block_id);
      status.text('Reintento aceptado. Se consultará el estado.');
    } catch (error) {
      status.addClass('followup-error').text(error.message + (error.uncertain ? ' Consulta el estado antes de repetir.' : ''));
      busy = false;
      return; // No reactivar un POST de resultado incierto: exigir actualizar el historial.
    }
    busy = false;
    await refresh();
  }

  async function refresh() {
    mount(); if (!panel || busy) return;
    clearTimeout(timer);
    const ticket = ++revision;
    detailRevision++; detail.prop('hidden', true).empty();
    status.removeClass('followup-error').text('Consultando bloques…');
    panel.attr('aria-busy', 'true');
    list.empty();
    try {
      const blocks = await api.blocks();
      if (ticket !== revision) return;
      if (!Array.isArray(blocks)) throw new Error('Respuesta de historial incompatible.');
      status.text(blocks.length ? '' : 'Todavía no hay bloques cargados.');
      for (const block of blocks) {
        const card = $('<article>').addClass('followup-item block-history-row');
        const facts = $('<div>').append(
          $('<h3>').addClass('h6 mb-1').text('Bloque ' + block.block_id + ' · ' + (labels[block.status] || 'Estado desconocido')),
          $('<p>').addClass('followup-muted mb-0').text(model.display(block.mode) + ' ' + model.matchType(block.match_type) + ' · ' +
            model.display(block.ready_replays) + ' de ' + model.display(block.expected_replays) + ' válidas · ' + model.localDate(block.created_at))
        );
        for (const code of block.reason_codes || []) facts.append($('<p>').addClass('mb-0').text(reasonText(code)));
        const actions = $('<div>').addClass('d-flex flex-wrap gap-2 align-items-center');
        if (block.status === 'ready') actions.append(...readyActions(block.block_id));
        actions.append($('<button>').attr('type', 'button').addClass('btn-rl btn-rl-outline').text('Ver detalle').on('click', () => show(block.block_id)));
        if (block.retry_allowed === true) {
          const button = $('<button>').attr('type', 'button').addClass('btn-rl btn-rl-outline').text('Reintentar procesamiento');
          button.on('click', () => retry(block, button)); actions.append(button);
        }
        list.append(card.append(facts, actions));
      }
      if (selected && blocks.some(block => block.block_id === selected)) await show(selected, false);
      if (blocks.some(block => ['pending', 'processing'].includes(block.status) && !block.retry_allowed) && !document.hidden) {
        timer = setTimeout(() => refresh(), 5000);
      }
    } catch (error) { if (ticket === revision) status.addClass('followup-error').text(error.message + ' Usa Actualizar historial para reintentar.'); }
    finally { if (ticket === revision) panel.attr('aria-busy', 'false'); }
  }
  window.CoachBlockHistory = { refresh };
  $(function () { mount(); if (panel) refresh(); });
  $(document).on('visibilitychange', function () { clearTimeout(timer); if (!document.hidden && panel) refresh(); });
  $(window).on('pagehide', function () { clearTimeout(timer); revision++; detailRevision++; });
}());
