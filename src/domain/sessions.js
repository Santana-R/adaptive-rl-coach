'use strict';

const { ApiError } = require('../middleware/auth');
const { parseTimestamp } = require('./timestamps');

const MAX_ID = 9223372036854775807n;
const MAX_MINUTES = 32767;
const FIRST_TIMESTAMP = Date.parse('0001-01-01T00:00:00Z');
const REQUIRED_FIELDS = ['plan_version_id', 'plan_exercise_id', 'performed_at', 'duration_minutes'];
const CREATE_FIELDS = [...REQUIRED_FIELDS, 'notes'];
const PATCH_FIELDS = CREATE_FIELDS.filter(field => field !== 'plan_version_id');

function invalid(message) {
  return new ApiError(400, 'INPUT_INVALID', message);
}

function parseId(value) {
  if (Number.isSafeInteger(value) && value > 0) return String(value);
  if (typeof value !== 'string' || value !== value.trim() || !/^[1-9]\d{0,18}$/.test(value)) {
    return null;
  }
  return BigInt(value) <= MAX_ID ? value : null;
}

function requiredId(value, field) {
  const id = parseId(value);
  if (id === null) throw invalid(field + ' debe ser un identificador válido.');
  return id;
}

const validators = {
  plan_version_id: value => requiredId(value, 'plan_version_id'),
  plan_exercise_id: value => requiredId(value, 'plan_exercise_id'),
  performed_at(value, now) {
    const timestamp = parseTimestamp(value);
    if (timestamp === null || timestamp < FIRST_TIMESTAMP || timestamp > now) {
      throw invalid('Indica una fecha y hora ISO con zona horaria que no sea futura.');
    }
    return new Date(timestamp).toISOString();
  },
  duration_minutes(value) {
    if (!Number.isInteger(value) || value < 1 || value > MAX_MINUTES) {
      throw invalid('La duración debe ser un número entero de minutos entre 1 y 32767.');
    }
    return value;
  },
  notes(value) {
    if (value === null) return null;
    if (typeof value !== 'string' || value.includes('\0')) {
      throw invalid('Las notas deben ser texto o null.');
    }
    return value.trim() || null;
  }
};

function parseFields(body, allowed, now) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw invalid('Envía los datos de la sesión como objeto.');
  }
  const fields = Object.keys(body);
  if (!fields.length || fields.some(field => !allowed.includes(field))) {
    throw invalid('Envía al menos un campo y usa los campos admitidos para esta operación.');
  }
  return Object.fromEntries(fields.map(field => [field, validators[field](body[field], now)]));
}

function parseCreate(body, now = Date.now()) {
  const data = parseFields(body, CREATE_FIELDS, now);
  if (REQUIRED_FIELDS.some(field => !Object.hasOwn(data, field))) {
    throw invalid('Indica la versión del plan, el ejercicio, la fecha y la duración.');
  }
  return { notes: null, ...data };
}

function parsePatch(body, now = Date.now()) {
  return parseFields(body, PATCH_FIELDS, now);
}

module.exports = { parseId, parseCreate, parsePatch };