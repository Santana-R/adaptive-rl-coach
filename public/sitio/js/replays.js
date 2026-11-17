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

        async function loadHistory() {
          await window.CoachBlockHistory.refresh();
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

      }());