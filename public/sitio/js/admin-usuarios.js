'use strict';

// A32 · Usuarios admin: lista (GET /api/v1/admin/users) y suspender/activar
// (PATCH /api/v1/admin/users/:id/status). El servidor autoriza cada cambio.
(async function () {
  const { request, guard, notify, escape, confirmStep, date } = window.CoachAdmin;
  const $ = id => document.getElementById(id);
  const COLUMNS = 'grid-template-columns: 1.5fr 2fr 1.2fr 1fr 1.2fr 1.3fr;';
  const ROLE = { player: 'Jugador', admin: 'Administrador' };
  const STATUS = { active: 'Activo', suspended: 'Suspendido' };
  let users = [], me = null, authDetails = true;

  function visible() {
    const text = $('buscaru').value.trim().toLowerCase();
    const role = $('filtro-rol').value, status = $('filtro-estado').value;
    return users.filter(u => (!role || u.role === role) && (!status || u.status === status) &&
      (!text || `${u.name ?? ''} ${u.email ?? ''}`.toLowerCase().includes(text)));
  }

  function render() {
    if (!me) return;
    const rows = visible();
    $('usuarios-filas').innerHTML = rows.length ? rows.map(u => {
      const own = u.id === me.id;
      const next = u.status === 'active' ? 'suspended' : 'active';
      const action = own ? '<span class="text-bray">Tu cuenta</span>'
        : `<button type="button" class="btn-rl ${next === 'suspended' ? 'btn-rl-outline' : 'btn-rl-accent'} w-100" data-user="${escape(u.id)}" data-next="${next}">${next === 'suspended' ? 'Suspender' : 'Activar'}</button>`;
      return `<div class="table-row" style="${COLUMNS}">
        <span data-label="Usuario">${escape(u.name || 'Sin nombre')}</span>
        <span data-label="Correo">${escape(authDetails ? (u.email ?? '—') : 'No disponible')}</span>
        <span data-label="Rol">${escape(ROLE[u.role] ?? u.role)}</span>
        <span data-label="Estado" class="${u.status === 'suspended' ? 'text-gold' : ''}">${escape(STATUS[u.status] ?? u.status)}</span>
        <span data-label="Último acceso">${escape(authDetails ? date(u.last_sign_in_at) : 'No disponible')}</span>
        <span data-label="Acción">${action}</span>
      </div>`;
    }).join('') : '<p class="text-bray">Ningún usuario coincide con la búsqueda.</p>';
  }

  async function load() {
    notify('Cargando usuarios…');
    const { data, meta } = await request('GET', '/api/v1/admin/users');
    users = data; authDetails = meta.auth_details !== false;
    render();
    notify(`${users.length} usuarios.${authDetails ? '' : ' El correo y el último acceso no están disponibles.'}`);
  }

  $('usuarios-filas').addEventListener('click', async event => {
    const button = event.target.closest('button[data-user]');
    if (!button) return;
    const user = users.find(u => u.id === button.dataset.user);
    const suspend = button.dataset.next === 'suspended';
    if (!confirmStep(button, suspend ? '¿Confirmar suspensión?' : '¿Confirmar activación?')) return;
    button.disabled = true;
    try {
      const { data } = await request('PATCH', `/api/v1/admin/users/${encodeURIComponent(user.id)}/status`, { status: button.dataset.next });
      Object.assign(user, { status: data.status });
      render();
      notify(`${user.name || 'El usuario'} ahora está ${data.status === 'suspended' ? 'suspendido' : 'activo'}.`, 'ok');
    } catch (error) {
      notify(`No se cambió el estado: ${error.message}`, 'error');
      button.disabled = false;
    }
  });

  ['buscaru', 'filtro-rol', 'filtro-estado'].forEach(id => $(id).addEventListener('input', render));
  $('usuarios-filtros').addEventListener('submit', event => event.preventDefault());
  $('usuarios-filtros').addEventListener('reset', () => setTimeout(render));

  me = await guard();
  if (!me) return;
  try { await load(); } catch (error) { notify(`No se pudo cargar la lista: ${error.message}`, 'error'); }
})();
