      (function () {
        'use strict';
        const input = document.getElementById('replay-input');
        const form = document.getElementById('replay-upload-form');
        const list = document.getElementById('file-list');
        const count = document.getElementById('file-count');
        const notice = document.getElementById('file-notice');
        const process = document.getElementById('process-block');
        const fileButton = document.getElementById('select-files');
        let files = [];
        let sending = false;

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
            !files.length && !message ? 'Elige cinco archivos .replay distintos.' : error || 'Todo listo. Ya puedes procesar el bloque.',
            !files.length && !message ? 'idle' : error ? 'error' : 'valid'
          );
          process.disabled = Boolean(error);
        }

        async function loadHistory() {
          await window.CoachBlockHistory.refresh();
        }

        fileButton.addEventListener('click', () => input.click());
        input.addEventListener('change', () => {
          files = Array.from(input.files);
          input.value = '';
          renderFiles();
        });
        form.addEventListener('dragover', event => event.preventDefault());
        form.addEventListener('drop', event => {
          event.preventDefault();
          if (sending) return;
          files = Array.from(event.dataTransfer.files);
          renderFiles();
        });
        form.addEventListener('submit', async event => {
          event.preventDefault();
          if (sending) return;
          const error = validate();
          if (error) {
            renderFiles(error);
            return;
          }
          sending = true;
          fileButton.disabled = true;
          list.querySelectorAll('button').forEach(button => { button.disabled = true; });
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
          } finally {
            sending = false;
            fileButton.disabled = false;
            list.querySelectorAll('button').forEach(button => { button.disabled = false; });
          }
        });
        renderFiles();

      }());