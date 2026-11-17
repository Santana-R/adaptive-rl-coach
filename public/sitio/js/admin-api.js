'use strict';

// A32 · Base común de las pantallas de administración.
// - Sesión de Supabase (misma configuración que Perfil) y token en cada petición.
// - Comprueba el rol con GET /api/v1/me antes de mostrar la pantalla. Es solo para la interfaz:
//   el servidor vuelve a exigir rol administrador en cada operación.
(function () {
  let client = null;

  function getClient() {
    if (client) return client;
    const config = window.SUPABASE_CONFIG || {};
    if (!config.url || !config.anonKey || !window.supabase?.createClient) return null;
    client = window.supabase.createClient(config.url, config.anonKey);
    return client;
  }

  async function token() {
    const c = getClient();
    if (!c) throw Object.assign(new Error('Falta configurar la conexión de autenticación.'), { status: 0 });
    const { data, error } = await c.auth.getSession();
    if (error || !data.session) throw Object.assign(new Error('Tu sesión expiró. Vuelve a iniciar sesión.'), { status: 401 });
    return data.session.access_token;
  }

  /** Llama a la API. Devuelve { data, meta } o lanza un Error con status, code y message legibles. */
  async function request(method, path, body) {
    let response;
    try {
      response = await fetch(path, {
        method,
        headers: { Authorization: `Bearer ${await token()}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch (error) {
      if (error.status !== undefined) throw error;
      throw Object.assign(new Error('No se pudo conectar con el servidor. Comprueba que Express esté en ejecución.'), { status: 0 });
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw Object.assign(new Error(payload.error?.message || 'No se pudo completar la operación.'),
        { status: response.status, code: payload.error?.code });
    }
    return payload;
  }

  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** Mensaje accesible en el elemento #admin-estado (role="status"). kind: info | ok | error. */
  function notify(text, kind = 'info') {
    const el = document.getElementById('admin-estado');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('text-bray', 'text-success', 'text-danger');
    el.classList.add(kind === 'error' ? 'text-danger' : kind === 'ok' ? 'text-success' : 'text-bray');
  }

  function blockScreen(title, text, link) {
    const main = document.querySelector('.app-main');
    if (!main) return;
    main.innerHTML = `<h1 class="h4 fw-bold text-light mb-2">${escape(title)}</h1><p class="text-bray">${escape(text)}</p>` +
      (link ? `<a class="btn-rl btn-rl-accent" href="${escape(link.href)}">${escape(link.label)}</a>` : '');
  }

  /** Muestra la pantalla solo a un administrador activo. Devuelve el usuario o null. */
  async function guard() {
    const main = document.querySelector('.app-main');
    if (main) main.setAttribute('aria-busy', 'true');
    try {
      const { id, role, status } = await request('GET', '/api/v1/me');
      if (role !== 'admin' || status !== 'active') {
        blockScreen('Acceso solo para administradores', 'Tu cuenta no tiene permisos de administración.', { href: 'panel.html', label: 'Ir a mi panel' });
        return null;
      }
      return { id, role, status };
    } catch (error) {
      if (error.status === 401) { window.location.replace('login.html'); return null; }
      if (error.status === 403) {
        blockScreen('Acceso no disponible', error.message, { href: 'login.html', label: 'Volver a iniciar sesión' });
        return null;
      }
      blockScreen('No se pudo comprobar tu sesión', error.message, { href: window.location.pathname.split('/').pop(), label: 'Reintentar' });
      return null;
    } finally {
      if (main) main.removeAttribute('aria-busy');
    }
  }

  async function logout() {
    try { await getClient()?.auth.signOut(); } finally { window.location.href = 'login.html'; }
  }

  /** Botón de dos pasos (sin ventanas del navegador): el primer clic pide confirmar durante 5 s. */
  function confirmStep(button, label) {
    if (button.dataset.confirming === 'true') { delete button.dataset.confirming; return true; }
    const original = button.textContent;
    button.dataset.confirming = 'true';
    button.textContent = label;
    setTimeout(() => {
      if (button.dataset.confirming === 'true') { delete button.dataset.confirming; button.textContent = original; }
    }, 5000);
    return false;
  }

  const date = value => value ? new Date(value).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '—';

  document.addEventListener('click', event => {
    if (event.target.closest('[data-admin-logout]')) logout();
  });

  window.CoachAdmin = { request, guard, notify, escape, confirmStep, date };
})();
