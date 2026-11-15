(function (root) {
  'use strict';

  const labels = {
    pending: 'Pendiente',
    processing: 'Procesando',
    invalid: 'Inválido',
    failed: 'Fallido',
    ready: 'Listo'
  };

  async function create(files) { //Crea el bloque de files llamando a blocks (POST)
    const body = new FormData();
    files.forEach(file => body.append('files', file, file.name));
    const response = await fetch('/api/v1/blocks', { method: 'POST', body });
    const payload = await response.json();
    if (!response.ok) {
      const message = payload.error?.message || 'No se pudo iniciar la carga.';
      throw new Error(message);
    }
    return payload.data;
  }

  async function get(blockId) {
    const response = await fetch(`/api/v1/blocks/${encodeURIComponent(blockId)}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || 'No se pudo consultar el bloque.');
    return payload.data;
  }
//Se puede acceder a labels al estar dentro del entorno original (function root)
  root.CoachBlocks = Object.freeze({ create, get, label: status => labels[status] || 'Estado desconocido' });
}(window));
