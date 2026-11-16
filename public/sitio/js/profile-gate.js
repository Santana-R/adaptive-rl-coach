'use strict';
(async () => {
  const client = window.CoachAuth.getClient();
  const gate = document.getElementById('perfil-gate');
  const content = document.getElementById('analysis-content');
  const fail = message => {
    gate.innerHTML = `<h1 class="h4 text-light">Completa tu perfil para continuar</h1><p class="text-bray">${message}</p><a class="btn-rl btn-rl-accent" href="perfil.html">Ir a Perfil</a>`;
  };
  if (!client) return fail('El acceso requiere configurar Supabase.');
  const {
    data: {
      session
    }
  } = await client.auth.getSession();
  if (!session) {
    location.replace('login.html');
    return;
  }
  try {
    const response = await fetch('/api/v1/profile', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    if (!response.ok) return fail(response.status === 404 ? 'Aún no hay un perfil persistido.' : 'No se pudo verificar tu perfil.');
    const profile = await response.json();
    if (!profile.platform || !profile.player_id || !profile.mode) return fail('Agrega plataforma, identificador de juego y modalidad.');
    gate.hidden = true;
    content.hidden = false;
  } catch {
    fail('No se pudo comprobar la conexión.');
  }
})();
