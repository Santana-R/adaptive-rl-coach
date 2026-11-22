'use strict';

$(function () {
  const gate = $('#perfil-gate');
  const content = $('#analysis-content');

  // La demo sintética usa una ruta local separada, sin datos del jugador.
  // El acceso a un bloque propio conserva sesión y perfil obligatorios.
  if (window.CoachAnalysis?.demo(new URLSearchParams(window.location.search))) {
    gate.prop('hidden', true);
    content.prop('hidden', false);
    return;
  }

  content.prop('hidden', true);

  function fail(message) {
    const title = $('<h1>')
      .addClass('h4 text-light')
      .text('Completa tu perfil para continuar');

    const description = $('<p>')
      .addClass('text-bray')
      .text(message);

    const profileLink = $('<a>')
      .addClass('btn-rl btn-rl-accent')
      .attr('href', 'perfil.html')
      .text('Ir a Perfil');

    const retryButton = $('<button>')
      .attr('type', 'button')
      .addClass('btn-rl btn-rl-outline ms-2')
      .text('Reintentar')
      .on('click', checkProfile);

    gate
      .empty()
      .append(
        title,
        description,
        profileLink,
        retryButton
      )
      .prop('hidden', false);
  }

  async function checkProfile() {
    content.prop('hidden', true);

    gate
      .prop('hidden', false)
      .empty()
      .append(
        $('<p>')
          .addClass('text-bray')
          .text('Comprobando perfil…')
      );

    try {
      const profile = await window.CoachProfileApi.load();

      const result =
        window.CoachProfileValidation.validate(profile);

      if (!result.valid) {
        fail(Object.values(result.errors).join(' '));
        return;
      }

      gate.prop('hidden', true);
      content.prop('hidden', false);
      await window.CoachAnalysis?.load();
    } catch (error) {
      if (error.status === 401) {
        window.location.replace('login.html');
      } else {
        fail(
          error.status === 404
            ? 'Aún no hay un perfil guardado. Crea tu perfil para continuar.'
            : error.message
        );
      }
    }
  }

  checkProfile();
});
