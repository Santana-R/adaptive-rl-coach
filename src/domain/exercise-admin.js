'use strict';

// A32 · Validación de la ficha de un ejercicio (alta y edición del catálogo por el administrador).
// La ficha se guarda en ejercicio_versiones/ejercicio_plataforma. Que el motor la use depende de
// la revisión técnica (A23): un borrador nuevo queda inactivo y no se ofrece en planes.

const { ApiError } = require('../middleware/auth');

const FIELDS = ['title', 'priority_key', 'resource_type', 'resource', 'purpose', 'instructions',
  'success_criterion', 'difficulty_base', 'reference_duration_minutes', 'platforms'];
const RESOURCE_TYPES = ['custom_training', 'steam_workshop', 'external_guide', 'free_play', 'native_replay_review'];
const PLATFORMS = ['epic', 'steam'];
const PRIORITY_KEYS = ['shooting', 'boost', 'defensive_review', 'movement'];
const CODE = /^[A-F0-9]{4}(?:-[A-F0-9]{4}){3}$/;

const invalid = message => new ApiError(400, 'INPUT_INVALID', message);
const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;

function isHttps(value) {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

/** Ficha de la API → normalizada (sin espacios sobrantes, plataformas ordenadas). Lanza 400. */
function normalizeFicha(body) {
  const ficha = {
    title: typeof body.title === 'string' ? body.title.trim() : body.title,
    priority_key: body.priority_key,
    resource_type: body.resource_type,
    resource: typeof body.resource === 'string' ? body.resource.trim() : body.resource,
    purpose: typeof body.purpose === 'string' ? body.purpose.trim() : body.purpose,
    instructions: Array.isArray(body.instructions) ? body.instructions.map(l => typeof l === 'string' ? l.trim() : l).filter(l => l !== '') : body.instructions,
    success_criterion: typeof body.success_criterion === 'string' ? body.success_criterion.trim() : body.success_criterion,
    difficulty_base: body.difficulty_base,
    reference_duration_minutes: body.reference_duration_minutes,
    platforms: Array.isArray(body.platforms) ? [...body.platforms].sort() : body.platforms,
  };
  if (!text(ficha.title, 100)) throw invalid('El nombre es obligatorio y tiene hasta 100 caracteres.');
  if (!PRIORITY_KEYS.includes(ficha.priority_key)) throw invalid(`La prioridad debe ser una de: ${PRIORITY_KEYS.join(', ')}.`);
  if (!RESOURCE_TYPES.includes(ficha.resource_type)) throw invalid(`El tipo de recurso debe ser uno de: ${RESOURCE_TYPES.join(', ')}.`);
  if (ficha.resource_type === 'custom_training' && !CODE.test(ficha.resource ?? '')) {
    throw invalid('Para Custom Training indica el código del paquete (por ejemplo 9472-6A26-7F5D-767B).');
  }
  if (ficha.resource_type !== 'custom_training' && !isHttps(ficha.resource)) {
    throw invalid('El recurso debe ser un enlace https.');
  }
  if (!text(ficha.purpose, 1000)) throw invalid('La finalidad es obligatoria (hasta 1000 caracteres).');
  if (!Array.isArray(ficha.instructions) || ficha.instructions.length < 1 || ficha.instructions.length > 20 ||
      !ficha.instructions.every(line => text(line, 500))) {
    throw invalid('Las instrucciones son una lista de 1 a 20 pasos, de hasta 500 caracteres cada uno.');
  }
  if (!text(ficha.success_criterion, 1000)) throw invalid('La meta del ejercicio es obligatoria (hasta 1000 caracteres).');
  if (!Number.isInteger(ficha.difficulty_base) || ficha.difficulty_base < 1 || ficha.difficulty_base > 5) {
    throw invalid('La dificultad base es un entero de 1 a 5.');
  }
  if (!Number.isInteger(ficha.reference_duration_minutes) || ficha.reference_duration_minutes < 5 || ficha.reference_duration_minutes > 120) {
    throw invalid('La duración de referencia es un entero de 5 a 120 minutos.');
  }
  if (!Array.isArray(ficha.platforms) || !ficha.platforms.length || ficha.platforms.some(p => !PLATFORMS.includes(p)) ||
      new Set(ficha.platforms).size !== ficha.platforms.length) {
    throw invalid('Elige al menos una plataforma (epic, steam) sin repetir.');
  }
  if (ficha.resource_type === 'steam_workshop' && ficha.platforms.join() !== 'steam') {
    throw invalid('Un mapa de Workshop solo está disponible en Steam.');
  }
  return ficha;
}

function checkKeys(body, allowed) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('Envía la ficha como objeto.');
  const extra = Object.keys(body).filter(key => !allowed.includes(key));
  if (extra.length) throw invalid(`Campos no admitidos: ${extra.join(', ')}.`);
}

/** Alta: la ficha completa. */
function parseCreate(body) {
  checkKeys(body, FIELDS);
  return normalizeFicha(body);
}

/**
 * Edición: { active } solo, o campos de ficha (combinados con la versión vigente).
 * Devuelve { kind: 'active', active } o { kind: 'version', ficha, changed }.
 */
function parseEdit(body, current) {
  if (body && typeof body === 'object' && !Array.isArray(body) && 'active' in body) {
    checkKeys(body, ['active']);
    if (typeof body.active !== 'boolean') throw invalid('active debe ser true o false.');
    return { kind: 'active', active: body.active };
  }
  checkKeys(body, FIELDS);
  if (!Object.keys(body).length) throw invalid('Indica qué campos cambian.');
  const ficha = normalizeFicha({ ...current, ...body });
  const changed = FIELDS.some(key => JSON.stringify(ficha[key]) !== JSON.stringify(current[key]));
  return { kind: 'version', ficha, changed };
}

/** Ficha → filas SQL (mismo formato que el seed de A23: instrucciones unidas por saltos de línea). */
function toRow(ficha) {
  return {
    nombre: ficha.title, categoria: ficha.priority_key, tipo_recurso: ficha.resource_type,
    codigo_enlace: ficha.resource, finalidad: ficha.purpose, instrucciones: ficha.instructions.join('\n'),
    meta: ficha.success_criterion, dificultad_base: ficha.difficulty_base,
    minutos_base: ficha.reference_duration_minutes, plataformas: ficha.platforms,
  };
}

module.exports = { parseCreate, parseEdit, toRow, FIELDS, RESOURCE_TYPES, PLATFORMS, PRIORITY_KEYS };
