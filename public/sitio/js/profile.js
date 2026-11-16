'use strict';

$(function () {
  const api = window.CoachProfileApi;
  const validation = window.CoachProfileValidation;

  const fields = {
    gamertag: '#nombre',
    platform: '#plataforma',
    player_id: '#idplat',
    mode: '#modalidad',
    available_minutes: '#minutos',
    days_per_week: '#dias',
    timezone: '#zona-horaria'
  };

  let savedProfile = null;
  let canEdit = false;
  let busy = false;

  function status(message, isError = false) {
    $('#perfil-estado')
      .text(message)
      .toggleClass('text-danger', isError)
      .toggleClass('text-bray', !isError);
  }

  function setBusy(value) {
    busy = value;

    $('#form-perfil').attr('aria-busy', String(value));

    $('#perfil-campos').prop(
      'disabled',
      value || !canEdit
    );

    $('#recargar-perfil').prop('disabled', value);
  }

  function clearErrors() {
    Object.entries(fields).forEach(function ([key, selector]) {
      $(selector).removeAttr('aria-invalid aria-errormessage');
      $('#error-' + key).text('');
    });
  }

  function showErrors(errors) {
    clearErrors();

    let firstField = null;

    Object.entries(errors).forEach(function ([key, message]) {
      if (!fields[key]) {
        return;
      }

      $(fields[key]).attr({
        'aria-invalid': 'true',
        'aria-errormessage': 'error-' + key
      });

      $('#error-' + key).text(message);

      firstField = firstField || fields[key];
    });

    if (firstField) {
      $(firstField).trigger('focus');
    }
  }

  function readForm() {
    const profile = {};

    Object.entries(fields).forEach(function ([key, selector]) {
      const value = $(selector).val();

      if (['available_minutes', 'days_per_week'].includes(key)) {
        profile[key] = value === '' ? null : Number(value);
      } else {
        profile[key] = value;
      }
    });

    return profile;
  }

  function fillForm(profile) {
    Object.entries(fields).forEach(function ([key, selector]) {
      $(selector).val(profile?.[key] ?? '');
    });
  }

  function blankProfile() {
    let timezone = 'America/Monterrey';

    try {
      timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        timezone;
    } catch {
      // La zona también puede escribirse manualmente.
    }

    return { timezone };
  }

  async function loadProfile() {
    if (busy) {
      return;
    }

    canEdit = false;

    setBusy(true);
    clearErrors();
    status('Cargando perfil…');

    try {
      savedProfile = await api.load();

      fillForm(savedProfile);
      canEdit = true;

      if (validation.validate(savedProfile).valid) {
        status('Perfil recuperado del servidor.');
      } else {
        status(
          'El perfil guardado está incompleto. Revisa los campos antes de continuar.'
        );
      }
    } catch (error) {
      if (error.status === 404) {
        savedProfile = blankProfile();

        fillForm(savedProfile);
        canEdit = true;

        status(
          'Aún no tienes perfil. Completa los datos y pulsa Guardar perfil.'
        );
      } else {
        status(
          error.message +
          ' Usa Volver a consultar para reintentar.',
          true
        );
      }
    } finally {
      setBusy(false);
    }
  }

  $('#form-perfil').on('submit', async function (event) {
    event.preventDefault();

    if (busy || !canEdit) {
      return;
    }

    const result = validation.validate(readForm());

    clearErrors();

    if (!result.valid) {
      status(
        'Revisa los campos señalados. No se guardaron cambios.',
        true
      );

      showErrors(result.errors);
      return;
    }

    setBusy(true);
    status('Guardando perfil…');

    let failure = null;

    try {
      savedProfile = await api.save(result.data);

      fillForm(savedProfile);

      status(
        'Perfil guardado en el servidor. Puedes recargar para comprobarlo.'
      );
    } catch (error) {
      failure = error;

      status(
        error.message + ' Tus cambios siguen en el formulario.',
        true
      );
    } finally {
      setBusy(false);
    }

    if (failure) {
      showErrors(failure.details);
    }
  });

  $('#cancelar-perfil').on('click', function () {
    fillForm(savedProfile);
    clearErrors();

    status('Se descartaron los cambios sin guardar.');
  });

  $('#recargar-perfil').on('click', function () {
    const current = validation.validate(readForm()).data;
    const saved = validation.validate(savedProfile).data;

    const hasChanges =
      JSON.stringify(current) !== JSON.stringify(saved);

    if (
      canEdit &&
      hasChanges &&
      !window.confirm(
        'Volver a consultar descartará los cambios sin guardar. ¿Continuar?'
      )
    ) {
      return;
    }

    loadProfile();
  });

  // Compatibilidad con el botón antiguo.
  // La navegación común gestiona botones con data-session-logout.
  $('#cerrar-sesion')
    .not('[data-session-logout]')
    .on('click', async function () {
      const button = $(this).prop('disabled', true);

      try {
        const client = api.getClient();

        if (!client) {
          throw new Error('Falta configurar la autenticación.');
        }

        const { error } = await client.auth.signOut();

        if (error) {
          throw error;
        }

        window.location.replace('login.html');
      } catch {
        status(
          'No se pudo cerrar la sesión. Inténtalo de nuevo.',
          true
        );

        button.prop('disabled', false);
      }
    });

  loadProfile();
});