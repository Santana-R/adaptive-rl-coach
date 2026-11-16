      (function () {
        'use strict';
        const input = document.getElementById('replay-input');
        const form = document.getElementById('replay-upload-form');
        const list = document.getElementById('file-list');
        const count = document.getElementById('file-count');
        const notice = document.getElementById('file-notice');
        const process = document.getElementById('process-block');
        let files = [];

        function validate() {
          if (files.length !== 5) return 'Selecciona exactamente cinco archivos .replay.';
          if (files.some(file => !file.name.toLowerCase().endsWith('.replay'))) {
            return 'Todos los archivos deben tener extensión .replay.';
          }
          const names = files.map(file => file.name.toLowerCase());
          if (new Set(names).size !== names.length) return 'Hay archivos repetidos.';
          return '';
        }

        function showNotice(message, type) {
          notice.className = `fs-6 mb-4 replay-notice replay-notice-${type}`;
          notice.textContent = message;
        }

        function renderFiles(message) {
          list.replaceChildren();
          files.forEach(file => {
            const item = document.createElement('li');
            item.className = 'd-flex justify-content-between align-items-center';
            const name = document.createElement('span');
            name.textContent = file.name;
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'btn-rl btn-rl-outline';
            remove.textContent = 'Quitar';
            remove.addEventListener('click', () => {
              files = files.filter(candidate => candidate !== file);
              renderFiles();
            });
            item.append(name, remove);
            list.append(item);
          });
          count.textContent = `${files.length} de 5`;
          const error = message || validate();
          showNotice(
            error || 'Cantidad y extensión válidas. Puedes procesar el bloque.',
            error ? 'error' : 'valid'
          );
          process.disabled = Boolean(error);
        }

        const reasons = {
          DUPLICATE_REPLAY: 'El replay ya existe en Ballchasing.',
          RATE_LIMITED: 'Ballchasing limitó las solicitudes temporalmente.',
          REPLAY_FORMAT_INVALID: 'Ballchasing rechazó el formato del archivo.',
          REPLAY_PROCESSING_FAILED: 'Ballchasing no pudo procesar el replay.',
          REPLAY_NOT_PRIVATE: 'No se pudo comprobar la privacidad del replay.',
          REPLAY_FILES_EXPIRED: 'Los archivos temporales caducaron. Crea un bloque nuevo.',
          REPLAY_FILES_CHANGED: 'Un archivo temporal cambió. Crea un bloque nuevo.',
          UPLOAD_UNAVAILABLE: 'Falló la carga a Ballchasing.',
          PROCESSING_TIMEOUT: 'Se agotó la espera para consultar el replay.',
          PLAYER_MISMATCH: 'El jugador del perfil no aparece en este replay.',
          MODE_MISMATCH: 'La modalidad no coincide con la del perfil.',
          MATCH_TYPE_MISMATCH: 'El tipo de partida no coincide con el resto.',
          REPLAY_CONTEXT_UNSUPPORTED: 'El contexto de esta partida no es compatible.'
        };

        const history = document.getElementById('blocks-list');
        let refreshTimer;

        function historyMessage(message) {
          const paragraph = document.createElement('p');
          paragraph.className = 'text-bray';
          paragraph.textContent = message;
          history.replaceChildren(paragraph);
        }

        async function showBlock(blockId) {
          const block = await window.CoachBlocks.get(blockId);
          const files = block.replays.map(replay => {
            const reason = replay.error?.split(',').map(code => reasons[code] || code).join(' ');
            const state = replay.status === 'ok' ? 'Válido' : window.CoachBlocks.label(replay.status);
            return replay.position + '. ' + replay.file_name + ' · ' + (reason || state);
          });
          const details = document.getElementById('block-details');
          details.textContent = 'Bloque ' + blockId + ' · ' + window.CoachBlocks.label(block.status)
            + '\n' + files.join('\n');
          details.hidden = false;
        }

        function actionButton(label, handler) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'btn-rl btn-rl-outline';
          button.textContent = label;
          button.addEventListener('click', async () => {
            button.disabled = true;
            try {
              await handler();
            } catch (error) {
              showNotice(error.message, 'error');
            } finally {
              button.disabled = false;
            }
          });
          return button;
        }

        async function loadHistory() {
          clearTimeout(refreshTimer);
          const blocks = await window.CoachBlocks.list();
          if (!blocks.length) {
            historyMessage('Todavía no hay bloques cargados.');
            return;
          }
          history.replaceChildren();
          for (const block of blocks) {
            const row = document.createElement('div');
            row.className = 'table-row';
            row.style.gridTemplateColumns = '1fr 2fr 1fr 1.5fr 1.5fr';
            for (const text of [
              block.block_id,
              [block.mode, block.match_type === 'pending' ? null : block.match_type].filter(Boolean).join(' · '),
              block.ready_replays + ' de ' + block.expected_replays,
              window.CoachBlocks.label(block.status)
            ]) {
              const cell = document.createElement('span');
              cell.textContent = text;
              row.append(cell);
            }
            const actions = document.createElement('span');
            actions.append(actionButton('Estado', () => showBlock(block.block_id)));
            if (block.retry_allowed) {
              actions.append(actionButton('Reintentar', async () => {
                try {
                  await window.CoachBlocks.retry(block.block_id);
                  showNotice('Reintento aceptado para el bloque ' + block.block_id + '.', 'pending');
                } finally {
                  await loadHistory();
                }
              }));
            }
            if (block.status === 'ready') {
              const link = document.createElement('a');
              link.className = 'btn-rl btn-rl-outline';
              link.href = 'analisis.html?block_id=' + encodeURIComponent(block.block_id);
              link.textContent = 'Ver análisis';
              actions.append(link);
            }
            row.append(actions);
            history.append(row);
          }
          if (blocks.some(block => ['pending', 'processing'].includes(block.status) && !block.retry_allowed)) {
            refreshTimer = setTimeout(() => loadHistory().catch(error => historyMessage(error.message)), 3000);
          }
        }

        document.getElementById('select-files').addEventListener('click', () => input.click());
        input.addEventListener('change', () => {
          files = Array.from(input.files);
          renderFiles();
        });
        form.addEventListener('dragover', event => event.preventDefault());
        form.addEventListener('drop', event => {
          event.preventDefault();
          files = Array.from(event.dataTransfer.files);
          renderFiles();
        });
        form.addEventListener('submit', async event => {
          event.preventDefault();
          const error = validate();
          if (error) {
            renderFiles(error);
            return;
          }
          process.disabled = true;
          showNotice('Enviando replays...', 'pending');
          try {
            const block = await window.CoachBlocks.create(files);
            files = [];
            input.value = '';
            renderFiles();
            showNotice(
              `Bloque ${block.block_id} aceptado. Estado: ${window.CoachBlocks.label(block.status)}.`,
              'success'
            );
            await loadHistory();
          } catch (requestError) {
            process.disabled = false;
            showNotice(requestError.message, 'error');
          }
        });
        renderFiles();
        if (window.location.protocol !== 'file:') {
          loadHistory().catch(error => historyMessage(error.message));
        }
      }());