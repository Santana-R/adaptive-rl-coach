'use strict';

// A16 · Validación de metas. Una meta tiene tipo (rendimiento/entrenamiento), modalidad y una
// métrica soportada. No altera métricas ni diagnóstico: el motor solo la conserva en snapshots.

const { ApiError } = require('../middleware/auth');

const MODES = ['1v1', '2v2', '3v3'];
const TYPES = {
  // Rendimiento: la única métrica que el generador (A18) y los bloques guardados (A15) soportan.
  performance: { sql: 'rendimiento', metrics: {
    shooting_pct: { unit: 'percent', comparators: ['>=', '>'], integer: false, min: 0, max: 100, minInclusive: false },
  } },
  // Entrenamiento: minutos declarados en sesiones (A21), como la serie training de reportes (A22).
  training: { sql: 'entrenamiento', metrics: {
    training_minutes: { unit: 'minutes', comparators: ['>='], integer: true, min: 1, max: 100000, minInclusive: true },
  } },
};
const TYPE_FROM_SQL = { rendimiento: 'performance', entrenamiento: 'training' };
const CREATE_KEYS = ['type', 'mode', 'metric_key', 'name', 'comparator', 'target_value', 'start_date', 'due_date'];
const EDIT_KEYS = ['name', 'comparator', 'target_value', 'start_date', 'due_date'];

const invalid = message => new ApiError(400, 'INPUT_INVALID', message);

function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Fecha de hoy (YYYY-MM-DD) en la zona horaria del perfil. */
function todayIn(timezone, now = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  }
}

function checkKeys(body, allowed) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('Envía los datos de la meta como objeto.');
  const extra = Object.keys(body).filter(key => !allowed.includes(key));
  if (extra.length) throw invalid(`Campos no admitidos: ${extra.join(', ')}.`);
}

// Valida los campos editables contra la métrica de la meta.
function checkValues(goal, spec) {
  if (typeof goal.name !== 'string' || !goal.name.trim() || goal.name.trim().length > 100) {
    throw invalid('El nombre es obligatorio y tiene hasta 100 caracteres.');
  }
  if (!spec.comparators.includes(goal.comparator)) {
    throw invalid(`Comparador no admitido para ${goal.metric_key}: usa ${spec.comparators.join(' o ')}.`);
  }
  const value = goal.target_value;
  const aboveMin = spec.minInclusive ? value >= spec.min : value > spec.min;
  if (typeof value !== 'number' || !Number.isFinite(value) || !aboveMin || value > spec.max ||
      (spec.integer && !Number.isInteger(value)) || Math.round(value * 1e4) / 1e4 !== value) {
    throw invalid(spec.unit === 'percent'
      ? 'La meta de eficiencia es un porcentaje mayor que 0 y hasta 100 (máximo 4 decimales).'
      : `La meta de minutos es un entero entre ${spec.min} y ${spec.max}.`);
  }
  if (!isDate(goal.start_date)) throw invalid('La fecha de inicio debe ser YYYY-MM-DD.');
  if (goal.due_date !== null && (!isDate(goal.due_date) || goal.due_date < goal.start_date)) {
    throw invalid('La fecha límite debe ser YYYY-MM-DD y no anterior al inicio.');
  }
}

/** Alta: devuelve la meta normalizada. */
function parseCreate(body, { today }) {
  checkKeys(body, CREATE_KEYS);
  const type = TYPES[body.type];
  if (!type) throw invalid('El tipo debe ser performance o training.');
  if (!MODES.includes(body.mode)) throw invalid('La modalidad debe ser 1v1, 2v2 o 3v3.');
  const metricKey = body.metric_key ?? Object.keys(type.metrics)[0];
  const spec = type.metrics[metricKey];
  if (!spec) throw invalid(`Métrica no admitida para metas de ${body.type}.`);
  const goal = {
    type: body.type, mode: body.mode, metric_key: metricKey, unit: spec.unit,
    name: typeof body.name === 'string' ? body.name.trim() : body.name,
    comparator: body.comparator ?? spec.comparators[0], target_value: body.target_value,
    start_date: body.start_date ?? today, due_date: body.due_date ?? null,
  };
  checkValues(goal, spec);
  return goal;
}

/** Edición: combina con la versión vigente. changed = false si no cambia nada. */
function parseEdit(body, current) {
  if (body && typeof body === 'object' && !Array.isArray(body) && ['type', 'mode', 'metric_key'].some(key => key in body)) {
    throw invalid('El tipo, la modalidad y la métrica no se editan: archiva esta meta y crea otra.');
  }
  checkKeys(body, EDIT_KEYS);
  const spec = TYPES[current.type]?.metrics[current.metric_key];
  if (!spec) throw new ApiError(422, 'GOAL_UNSUPPORTED', 'Esta meta usa una métrica que ya no se puede editar.');
  const next = { ...current };
  for (const key of EDIT_KEYS) if (key in body) next[key] = key === 'name' && typeof body.name === 'string' ? body.name.trim() : body[key];
  checkValues(next, spec);
  const changed = EDIT_KEYS.some(key => next[key] !== current[key]);
  return { goal: next, changed };
}

module.exports = { parseCreate, parseEdit, todayIn, isDate, TYPES, TYPE_FROM_SQL, MODES };
