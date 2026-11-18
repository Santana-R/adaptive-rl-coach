'use strict';

// Solo medidas normalizadas del jugador validado; no se guarda el replay completo.
const VERSION = 'ballchasing.player.v1';
const KEYS = ['play_duration_s', 'boost_zero_s', 'boost_zero_pct', 'defensive_positioning'];
const { extractBoostValues } = require('../domain/boost');
const { unavailableDefensiveValues } = require('../domain/defensive-positioning');

function unavailableValues() {
  return {
    ...extractBoostValues({}),
    play_duration_s: { value: null, unit: 'seconds', scope: 'match',
      source_field: 'play_duration', missing_reason: 'not_available' },
    defensive_positioning: unavailableDefensiveValues(),
  };
}

function captureProviderMeasurements(replay) {
  return {
    version: VERSION,
    source: 'ballchasing',
    replay_id: replay.replay_id,
    values: structuredClone({ ...unavailableValues(), ...Object.fromEntries(KEYS
      .filter(key => replay.values[key] !== undefined)
      .map(key => [key, replay.values[key]])) }),
  };
}

function readProviderMeasurements(snapshot, replayId) {
  if (snapshot?.version !== VERSION || snapshot.source !== 'ballchasing' ||
      snapshot.replay_id !== replayId || !snapshot.values ||
      typeof snapshot.values !== 'object' || Array.isArray(snapshot.values)) return null;
  // Los lectores de dominio vuelven a validar unidades, fuente, rango y faltantes.
  return { ...unavailableValues(), ...Object.fromEntries(KEYS.filter(key => snapshot.values[key] !== undefined)
    .map(key => [key, snapshot.values[key]])) };
}

module.exports = { VERSION, captureProviderMeasurements, readProviderMeasurements };
