'use strict';
(() => {
  const client = window.CoachAuth.getClient();
  const $ = id => document.getElementById(id);
  const message = (id, value, error = false) => {
    const el = $(id);
    if (el) {
      el.textContent = value;
      el.classList.toggle('text-danger', error);
    }
  };

  const busy = (form, value) => form?.querySelectorAll('button').forEach(button => {
    button.disabled = value;
  });

  const explain = error => error?.message || 'No se pudo completar la operación. Inténtalo de nuevo.';
  const register = $('registro'),
    login = $('inicio-sesion');

  function selectForm() {
    const registering = location.hash === '#registro';
    register.hidden = !registering;
    login.hidden = registering;
  }

  selectForm();
  window.addEventListener('hashchange', selectForm);

  if (!client)['registro-estado', 'login-estado'].forEach(id => message(id, 'Acceso deshabilitado: configura SUPABASE_CONFIG.url y anonKey.'));
  register?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) return;
    const password = $('contraseña').value;
    if (password !== $('confirm').value) return message('registro-estado', 'Las contraseñas no coinciden.', true);
    busy(register, true);
    message('registro-estado', 'Creando cuenta…');
    try {
      const {
        data,
        error
      } = await client.auth.signUp({
        email: $('Correo').value.trim(),
        password,
        options: {
          data: {
            display_name: $('Nombre').value.trim()
          }
        }
      });
      if (error) throw error;
      message('registro-estado', data.session ? 'Cuenta creada. Abriendo Perfil…' : 'Cuenta creada. Revisa tu correo para confirmar el registro.');
      if (data.session) location.href = 'perfil.html';
    } catch (error) {
      message('registro-estado', explain(error), true);
    } finally {
      busy(register, false);
    }
  });
  login?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) return;
    busy(login, true);
    message('login-estado', 'Iniciando sesión…');
    try {
      const {
        error
      } = await client.auth.signInWithPassword({
        email: $('login-correo').value.trim(),
        password: $('login-contrasena').value
      });
      if (error) throw error;
      location.href = 'perfil.html';
    } catch (error) {
      message('login-estado', explain(error), true);
    } finally {
      busy(login, false);
    }
  });
  
  async function google() {
    if (!client) return message(register.hidden ? 'login-estado' : 'registro-estado', 'El acceso con Google no está disponible.', true);
    const {
      error
    } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}${location.pathname.replace(/login\.html$/, 'perfil.html')}`
      }
    });
    if (error) message(register.hidden ? 'login-estado' : 'registro-estado', explain(error), true);
  }
  $('google-login')?.addEventListener('click', google);
  $('google-registro')?.addEventListener('click', google);
})();
