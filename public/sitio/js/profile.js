'use strict';
(async () => {
  const config = window.SUPABASE_CONFIG || {};
  const supabase = window.supabase?.createClient && config.url && config.anonKey ? window.supabase.createClient(config.url, config.anonKey) : null;
  const $ = id => document.getElementById(id);
  const status = text => {
    if ($('perfil-estado')) $('perfil-estado').textContent = text;
  };
  if (!supabase) {
    status('Perfil no conectado: configura SUPABASE_CONFIG con la URL y clave pública del proyecto.');
    return;
  }
  const {
    data: {
      session
    }
  } = await supabase.auth.getSession();
  if (!session) {
    location.replace('login.html');
    return;
  }
  $('cerrar-sesion')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    location.replace('login.html');
  });
  try {
    const response = await fetch('/api/v1/profile', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    if (response.status === 404) status('Aún no hay un perfil guardado. Completa los campos obligatorios. El guardado estará disponible al integrar PATCH de perfil.');
    else if (!response.ok) throw new Error('No se pudo cargar el perfil.');
    else {
      const profile = await response.json();
      $('plataforma').value = profile.platform || '';
      $('idplat').value = profile.player_id || '';
      $('modalidad').value = profile.mode || '';
      $('minutos').value = profile.available_minutes || '';
      status('Perfil cargado desde el servidor. El guardado requiere que A15 exponga PATCH /api/v1/profile.');
    }
  } catch (error) {
    status(`${error.message} Verifica tu conexión e inténtalo de nuevo.`);
  }
  $('form-perfil')?.addEventListener('submit', event => {
    event.preventDefault();
    status('Cambios aún no guardados: PATCH /api/v1/profile todavía no está disponible en el backend.');
  });
})();
