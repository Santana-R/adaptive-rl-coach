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

        function renderFiles(message) { //Renders the file. duh
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

        async function loadHistory() {
          const response = await fetch('../../api/v1/blocks');
          const payload = await response.json();
          const container = document.getElementById('blocks-list');
          container.replaceChildren();
          if (!payload.data.length) {
            const empty = document.createElement('p');
            empty.className = 'text-bray';
            empty.textContent = 'Todavía no hay bloques cargados.';
            container.append(empty);
            return;
          }
          payload.data.forEach(block => {
            const row = document.createElement('div');
            row.className = 'table-row';
            row.style.gridTemplateColumns = '1fr 2fr 1fr 1.5fr 1.5fr';
            row.innerHTML = `<span>${block.block_id}</span><span>Contexto pendiente</span><span>${block.ready_replays} de ${block.expected_replays}</span><span>${window.CoachBlocks.label(block.status)}</span><span>Consultar estado</span>`;
            container.append(row);
          });
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
        if (window.location.protocol !== 'file:') { //Evitar que aparezca en rojo desde el inicio.
          loadHistory().catch(() => {});
        }
      }());