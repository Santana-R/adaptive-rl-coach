'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CoachProfileValidation = factory();
  }
})(typeof window === 'undefined' ? globalThis : window, function () {

  function validate(input) {
    const errors = {};
    const data = {};

    const textFields = [
      'gamertag',
      'platform',
      'player_id',
      'mode',
      'timezone'
    ];

    for (const key of textFields) {
      data[key] = typeof input?.[key] === 'string'
        ? input[key].trim()
        : '';
    }

    data.available_minutes = input?.available_minutes;
    data.days_per_week = input?.days_per_week;

    if (!data.gamertag || data.gamertag.length > 60) {
      errors.gamertag =
        'Escribe un nombre visible de 1 a 60 caracteres.';
    }

    if (!['steam', 'epic'].includes(data.platform)) {
      errors.platform = 'Selecciona Steam o Epic Games.';
    }

    if (
      !data.player_id ||
      data.player_id.length > 100 ||
      /\s/.test(data.player_id)
    ) {
      errors.player_id =
        'Escribe el identificador de cuenta, sin espacios y de hasta 100 caracteres.';
    }

    if (!['1v1', '2v2', '3v3'].includes(data.mode)) {
      errors.mode = 'Selecciona 1v1, 2v2 o 3v3.';
    }

    if (
      !Number.isInteger(data.available_minutes) ||
      data.available_minutes < 1 ||
      data.available_minutes > 32767
    ) {
      errors.available_minutes =
        'Los minutos deben ser un entero entre 1 y 32767.';
    }

    if (
      !Number.isInteger(data.days_per_week) ||
      data.days_per_week < 1 ||
      data.days_per_week > 7
    ) {
      errors.days_per_week =
        'Selecciona entre 1 y 7 días por semana.';
    }

    try {
      if (!data.timezone || data.timezone.length > 64) {
        throw new Error('Zona horaria inválida');
      }

      new Intl.DateTimeFormat('es', {
        timeZone: data.timezone
      });
    } catch {
      errors.timezone =
        'Escribe una zona horaria válida, por ejemplo America/Monterrey.';
    }

    return {
      data,
      errors,
      valid: Object.keys(errors).length === 0
    };
  }

  return { validate };
});