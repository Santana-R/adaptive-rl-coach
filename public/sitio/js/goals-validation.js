'use strict';

// Validación de interfaz alineada con src/domain/goals.js (A16).
// El servidor vuelve a validar y decide propietario, versiones y archivo.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CoachGoalsValidation = factory();
  }
})(typeof window === 'undefined' ? globalThis : window, function () {
  const specs = {
    performance: {
      metric: 'shooting_pct',
      label: 'Precisión de tiro',
      unit: '%',
      comparators: ['>=', '>'],
      min: 0.0001,
      max: 100,
      step: 0.0001
    },
    training: {
      metric: 'training_minutes',
      label: 'Minutos de entrenamiento',
      unit: 'min',
      comparators: ['>='],
      min: 1,
      max: 100000,
      step: 1
    }
  };

  function isDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const date = new Date(value + 'T00:00:00Z');
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function validate(input, editing = false) {
    const errors = {};
    const spec = specs[input.type];
    const name = String(input.name || '').trim();
    const value = input.target_value;

    if (!name || name.length > 100) {
      errors.name = 'Escribe un nombre de 1 a 100 caracteres.';
    }

    if (!spec) {
      errors.type = 'Selecciona rendimiento o entrenamiento.';
    }

    if (!['1v1', '2v2', '3v3'].includes(input.mode)) {
      errors.mode = 'Selecciona una modalidad válida.';
    }

    if (spec && !spec.comparators.includes(input.comparator)) {
      errors.comparator = 'El comparador no corresponde al tipo de meta.';
    }

    if (spec && (
      typeof value !== 'number' || !Number.isFinite(value) ||
      value < spec.min || value > spec.max ||
      (input.type === 'training' && !Number.isInteger(value)) ||
      Math.round(value * 10000) / 10000 !== value
    )) {
      errors.target_value = input.type === 'training'
        ? 'Escribe minutos enteros entre 1 y 100000.'
        : 'Escribe un porcentaje mayor que 0 y hasta 100, con máximo 4 decimales.';
    }

    const start = input.start_date || '';
    const due = input.due_date || null;

    if ((start && !isDate(start)) || (editing && !start)) {
      errors.start_date = 'Escribe una fecha de inicio válida.';
    }

    if (due && (!isDate(due) || (start && due < start))) {
      errors.due_date = 'La fecha límite no puede ser anterior al inicio.';
    }

    // Lista explícita de campos admitidos: PATCH no envía type/mode/metric_key.
    const data = {
      name,
      comparator: input.comparator,
      target_value: value,
      due_date: due
    };

    if (start) data.start_date = start;

    if (!editing) {
      data.type = input.type;
      data.mode = input.mode;
      if (spec) data.metric_key = spec.metric;
    }

    return { valid: Object.keys(errors).length === 0, errors, data };
  }

  return { specs, validate };
});
