// Los porcentajes proceden del proveedor: no se divide entre un reloj SQL ambiguo.
const BASIS = 'provider_percent_zero_boost';

function boostMeasurement(value, unit, sourceField, missingReason = null) {
  let reason = missingReason;
  if (value == null) reason ||= 'not_available';
  else if (!Number.isFinite(value) || value < 0 ||
      value > (unit === 'percent' ? 100 : Number.MAX_SAFE_INTEGER)) reason ||= 'out_of_range';
  return { value: reason ? null : value, unit, scope: 'player', source_field: sourceField, missing_reason: reason };
}

function extractBoostValues(boost) {
  if (!boost || typeof boost !== 'object') return {};
  return {
    boost_zero_s: boostMeasurement(boost.time_zero_boost, 'seconds', 'time_zero_boost'),
    boost_zero_pct: boostMeasurement(boost.percent_zero_boost, 'percent', 'percent_zero_boost'),
  };
}

function readMeasurement(metric, unit, field) {
  if (metric?.value == null) return boostMeasurement(null, unit, field, metric?.missing_reason);
  if (metric.unit !== unit || metric.scope !== 'player' || metric.source_field !== field) {
    return boostMeasurement(null, unit, field, 'incompatible_measurement');
  }
  return boostMeasurement(metric.value, unit, field, metric.missing_reason);
}

function collectBoostMeasurements(replays) {
  const observations = replays.map(replay => {
    const seconds = readMeasurement(replay.values?.boost_zero_s, 'seconds', 'time_zero_boost');
    let percent = readMeasurement(replay.values?.boost_zero_pct, 'percent', 'percent_zero_boost');
    if (seconds.value !== null && percent.value !== null && (seconds.value === 0) !== (percent.value === 0)) {
      percent = boostMeasurement(null, 'percent', 'percent_zero_boost', 'inconsistent_zero_boost');
    }
    return { replay_id: replay.replay_id, seconds, percent };
  });
  const excluded = observations.filter(o => o.percent.value === null)
    .map(o => ({ replay_id: o.replay_id, reason: o.percent.missing_reason }));
  const secondsExcluded = observations.filter(o => o.seconds.value === null)
    .map(o => ({ replay_id: o.replay_id, metric_key: 'boost_zero_s', reason: o.seconds.missing_reason }));
  const coverage = observations.length - excluded.length;
  const secondsCoverage = observations.length - secondsExcluded.length;
  const secondsTotal = observations.reduce((sum, o) => sum + (o.seconds.value ?? 0), 0);
  const reason = secondsCoverage !== 5 ? (secondsCoverage ? 'incomplete_coverage' : 'not_available')
    : secondsTotal > Number.MAX_SAFE_INTEGER ? 'unsafe_total' : null;
  return {
    per_replay: { measurement_basis: BASIS, aggregation: 'per_replay', coverage,
      missing_reason: coverage === 5 ? null : coverage ? 'incomplete_coverage' : 'not_available',
      observations, excluded },
    seconds: { value: reason ? null : secondsTotal, unit: 'seconds', scope: 'player',
      source_field: 'time_zero_boost', coverage: secondsCoverage, missing_reason: reason, excluded: secondsExcluded },
  };
}

module.exports = { BASIS, boostMeasurement, extractBoostValues, collectBoostMeasurements };
