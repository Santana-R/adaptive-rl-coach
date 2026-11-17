// Conteos del jugador y duración ORIGINAL de la partida; sin reconstruir relojes.
const BASIS = 'provider_last_defender_goals_per_300_match_play_seconds';
const REFERENCE_SECONDS = 300;
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
  return Object.fromEntries(Object.entries(FIELDS).map(([key,d])=>[key,measurement(null,d,reason)]));
}
function extractDefensiveValues(positioning) {
  if (!positioning || typeof positioning !== 'object' || Array.isArray(positioning)) return null;
  return Object.fromEntries(Object.entries(FIELDS).map(([key,d])=>[key,measurement(positioning[d.source_field],d)]));
}
function readMeasurement(metric, definition) {
  if (metric?.value == null) return measurement(null,definition,metric?.missing_reason);
  if (metric.unit!==definition.unit || metric.scope!=='player' || metric.source_field!==definition.source_field) {
    return measurement(null,definition,'incompatible_measurement');
  }
  return measurement(metric.value,definition,metric.missing_reason);
}
function readDuration(metric) {
  let reason=metric?.missing_reason || null;
  const value=metric?.value;
  if (value==null) reason ||= 'not_available';
  else if (metric.unit!=='seconds' || metric.scope!=='match' || metric.source_field!=='play_duration') {
    reason ||= 'incompatible_duration_basis';
  } else if (typeof value!=='number' || !Number.isFinite(value) || value<0 || value>Number.MAX_SAFE_INTEGER) {
    reason ||= 'invalid_duration';
  }
  return {value:reason?null:value,unit:'seconds',scope:'match',source_field:'play_duration',missing_reason:reason};
}
function rateFor(goals,duration) {
  let reason=goals.missing_reason || duration.missing_reason;
  if (!reason && duration.value===0) reason='zero_duration';
  const scaled=reason?null:goals.value*REFERENCE_SECONDS;
  let value=reason?null:scaled/duration.value;
  if (!reason && (!Number.isSafeInteger(scaled) || !Number.isFinite(value) || value>Number.MAX_SAFE_INTEGER)) {
    reason='unsafe_rate_calculation'; value=null;
  }
  return {value,unit:'goals_per_5_minutes',measurement_basis:BASIS,
    reference_duration_s:REFERENCE_SECONDS,missing_reason:reason || null,
    numerator:{value:goals.value,unit:'count',scope:'player',source_field:FIELDS.goals.source_field},
    denominator:{value:duration.value,unit:'seconds',scope:'match',source_field:'play_duration'}};
}
function collectDefensiveMeasurements(replays) {
  const observations=Array.from(replays,replay=>{
    const fields=Object.fromEntries(Object.entries(FIELDS).map(([key,d])=>
      [key,readMeasurement(replay.values?.defensive_positioning?.[key],d)]));
    const duration=readDuration(replay.values?.play_duration_s);
    return {replay_id:replay.replay_id,...fields,duration,rate:rateFor(fields.goals,duration)};
  });
  const excluded=observations.filter(o=>o.rate.value===null)
    .map(o=>({replay_id:o.replay_id,reason:o.rate.missing_reason}));
  const coverage=observations.length-excluded.length;
  return {
    measurement_basis:BASIS,aggregation:'per_replay',coverage,
    count_coverage:observations.filter(o=>o.goals.value!==null).length,
    duration_coverage:observations.filter(o=>o.duration.value!==null && o.duration.value>0).length,
    missing_reason:coverage===5?null:coverage?'incomplete_coverage':'not_available',
    observations,excluded,
  };
}
module.exports={BASIS,REFERENCE_SECONDS,FIELDS,extractDefensiveValues,unavailableDefensiveValues,collectDefensiveMeasurements};
