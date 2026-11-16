// Solo campos explícitos del participante seleccionado; una omisión no significa cero.
const BASIS = 'provider_goals_against_while_last_defender';
const FIELDS = Object.freeze({
  goals: Object.freeze({ unit: 'count', source_field: 'goals_against_while_last_defender' }),
  role_seconds: Object.freeze({ unit: 'seconds', source_field: 'time_most_back' }),
  role_percent: Object.freeze({ unit: 'percent', source_field: 'percent_most_back' }),
  infront_percent: Object.freeze({ unit: 'percent', source_field: 'percent_infront_ball' }),
  mates_distance: Object.freeze({ unit: 'uu', source_field: 'avg_distance_to_mates' }),
});

function measurement(value, definition, missingReason = null) {
  let reason = missingReason;
  if (value == null) reason ||= 'not_available';
  else if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 ||
      value > (definition.unit === 'percent' ? 100 : Number.MAX_SAFE_INTEGER) ||
      (definition.unit === 'count' && !Number.isSafeInteger(value))) reason ||= 'invalid_measurement';
  return { value: reason ? null : value, unit: definition.unit, scope: 'player',
    source_field: definition.source_field, missing_reason: reason };
}

function unavailableDefensiveValues(reason = 'not_available') {
  return Object.fromEntries(Object.entries(FIELDS).map(([key, definition]) =>
    [key, measurement(null, definition, reason)]));
}

function extractDefensiveValues(positioning) {
  if (!positioning || typeof positioning !== 'object' || Array.isArray(positioning)) return null;
  return Object.fromEntries(Object.entries(FIELDS).map(([key, definition]) =>
    [key, measurement(positioning[definition.source_field], definition)]));
}

function readMeasurement(metric, definition) {
  if (metric?.value == null) return measurement(null, definition, metric?.missing_reason);
  if (metric.unit !== definition.unit || metric.scope !== 'player' ||
      metric.source_field !== definition.source_field) {
    return measurement(null, definition, 'incompatible_measurement');
  }
  return measurement(metric.value, definition, metric.missing_reason);
}

function collectDefensiveMeasurements(replays) {
  const observations = Array.from(replays, replay => ({
    replay_id: replay.replay_id,
    ...Object.fromEntries(Object.entries(FIELDS).map(([key, definition]) =>
      [key, readMeasurement(replay.values?.defensive_positioning?.[key], definition)])),
  }));
  const excluded = observations.filter(o => o.goals.value === null)
    .map(o => ({ replay_id: o.replay_id, reason: o.goals.missing_reason }));
  const coverage = observations.length - excluded.length;
  return {
    measurement_basis: BASIS, aggregation: 'per_replay', coverage,
    missing_reason: coverage === 5 ? null : coverage ? 'incomplete_coverage' : 'not_available',
    observations, excluded,
  };
}

module.exports = { BASIS, FIELDS, extractDefensiveValues, unavailableDefensiveValues, collectDefensiveMeasurements };
