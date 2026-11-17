'use strict';

// A31 · Rango declarado. Es una observación del jugador ("en esta fecha estaba en Diamond II 2v2"),
// no una métrica calculada: no se infiere del MMR ni de los replays, y su fuente es siempre
// self_reported. Corregir = registrar otro rango; el historial no se reescribe.

const { ApiError } = require('../middleware/auth');
const { MODES } = require('./goals');

const RANKS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'champion', 'grand_champion', 'supersonic_legend'];
const SOURCE = 'self_reported';
const DEFAULT_SEASON = 'no_declarada';
const FIRST_DAY = Date.parse('2015-07-07T00:00:00Z'); // Lanzamiento de Rocket League.
const CLOCK_SKEW_MS = 5 * 60 * 1000;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$/;
const ALLOWED = ['mode', 'rank_label', 'division', 'season', 'recorded_at'];

const invalid = message => new ApiError(400, 'INPUT_INVALID', message);

/**
 * Fecha del registro. Una fecha sola (AAAA-MM-DD) se guarda a mediodía UTC para que se vea el
 * mismo día en cualquier zona horaria de América/Europa. No se aceptan fechas futuras.
 */
function parseRecordedAt(value, now) {
  if (value === undefined || value === null) return now.toISOString();
  if (typeof value !== 'string' || !(DATE_ONLY.test(value) || DATE_TIME.test(value))) {
    throw invalid('La fecha debe tener formato AAAA-MM-DD.');
  }
  const iso = DATE_ONLY.test(value) ? `${value}T12:00:00Z` : value;
  const time = Date.parse(iso);
  if (Number.isNaN(time) || (DATE_ONLY.test(value) && new Date(time).toISOString().slice(0, 10) !== value)) {
    throw invalid('La fecha no existe.');
  }
  if (time < FIRST_DAY) throw invalid('La fecha es anterior al lanzamiento de Rocket League.');
  // Una fecha de hoy guardada a mediodía UTC puede caer unas horas "en el futuro": se recorta a ahora.
  if (DATE_ONLY.test(value) && value <= now.toISOString().slice(0, 10) && time > now.getTime()) return now.toISOString();
  if (time > now.getTime() + CLOCK_SKEW_MS) throw invalid('La fecha no puede ser futura.');
  return new Date(time).toISOString();
}

/** Cuerpo de POST /api/v1/rank-history → valores para la fila de rangos. */
function parseRank(body, { now = new Date() } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => !ALLOWED.includes(k))) {
    throw invalid('Envía solo mode, rank_label, division, season y recorded_at. La fuente no se elige.');
  }
  if (!MODES.includes(body.mode)) throw invalid('La modalidad debe ser 1v1, 2v2 o 3v3.');
  if (!RANKS.includes(body.rank_label)) throw invalid(`El rango debe ser uno de: ${RANKS.join(', ')}.`);
  let division = body.division ?? null;
  if (division !== null) {
    if (!Number.isInteger(division) || division < 1 || division > 4) throw invalid('La división va de 1 a 4.');
    if (body.rank_label === 'supersonic_legend') throw invalid('Supersonic Legend no tiene división.');
  }
  let season = body.season ?? null;
  if (season !== null) {
    if (typeof season !== 'string' || !season.trim() || season.trim().length > 20) {
      throw invalid('La temporada es un texto de 1 a 20 caracteres.');
    }
    season = season.trim();
  }
  return {
    mode: body.mode, rank_label: body.rank_label, division, season: season ?? DEFAULT_SEASON,
    recorded_at: parseRecordedAt(body.recorded_at, now), source: SOURCE,
  };
}

module.exports = { parseRank, parseRecordedAt, RANKS, SOURCE, DEFAULT_SEASON };
