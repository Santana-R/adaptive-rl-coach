const { collectBoostMeasurements } = require('./boost');
const { collectDefensiveMeasurements } = require('./defensive-positioning');
const REQUIRED_REPLAYS = 5;

// Un cero registrado es válido. null, undefined y conteos inválidos se excluyen.
function readCount(replay, key) {
  const metric = replay.values?.[key];
  if (metric?.value == null) {
    return { value: null, reason: metric?.missing_reason || 'not_available' };
  }
  if (metric.unit !== 'count') return { value: null, reason: 'unit_mismatch' };
  if (!Number.isSafeInteger(metric.value) || metric.value < 0) {
    return { value: null, reason: 'invalid_count' };
  }
  return { value: metric.value, reason: null };
}

function readDuration(replay, key) {
  const metric = replay.values?.[key];
  if (metric?.value == null) {
    return { value: null, reason: metric?.missing_reason || 'not_available' };
  }
  if (metric.unit !== 'seconds') return { value: null, reason: 'unit_mismatch' };
  if (metric.scope !== 'match' || metric.source_field !== 'play_duration') {
    return { value: null, reason: 'incompatible_duration_basis' };
  }
  if (!Number.isFinite(metric.value) || metric.value < 0 ||
      metric.value > Number.MAX_SAFE_INTEGER) {
    return { value: null, reason: 'invalid_duration' };
  }
  return { value: metric.value, reason: null };
}

function sumValues(replays, key, unit, readValue, isSafeTotal) {
  let total = 0;
  let coverage = 0;
  const excluded = [];

  for (const replay of replays) {
    const measurement = readValue(replay, key);
    if (measurement.reason !== null) {
      excluded.push({ replay_id: replay.replay_id, metric_key: key, reason: measurement.reason });
      continue;
    }
    total += measurement.value;
    coverage += 1;
  }

  let missingReason = null;
  if (coverage < REQUIRED_REPLAYS) {
    missingReason = coverage === 0 ? 'not_available' : 'incomplete_coverage';
  } else if (!isSafeTotal(total)) {
    missingReason = 'unsafe_total';
  }

  return {
    value: missingReason === null ? total : null,
    unit,
    coverage,
    missing_reason: missingReason,
    excluded,
  };
}

function sumCounts(replays, key) {
  return sumValues(replays, key, 'count', readCount, Number.isSafeInteger);
}

function sumDurations(replays) {
  const duration = sumValues(replays, 'play_duration_s', 'seconds', readDuration,
    total => Number.isFinite(total) && total <= Number.MAX_SAFE_INTEGER);
  return { ...duration, scope: 'match', source_field: 'play_duration' };
}

function shootingEfficiency(goals, shots) {
  const excluded = [...goals.excluded, ...shots.excluded];
  const excludedIds = new Set(excluded.map(item => item.replay_id));
  const coverage = REQUIRED_REPLAYS - excludedIds.size;
  let value = null;
  let missingReason = null;

  if (goals.value === null || shots.value === null) {
    missingReason = coverage < REQUIRED_REPLAYS
      ? (coverage === 0 ? 'not_available' : 'incomplete_coverage')
      : (goals.missing_reason || shots.missing_reason);
  } else if (shots.value === 0) {
    missingReason = 'zero_denominator';
  } else {
    // Dividimos los totales del bloque, sin promediar porcentajes ni redondear.
    value = (goals.value / shots.value) * 100;
    if (value > 100) {
      value = null;
      missingReason = 'out_of_range';
    }
  }

  return {
    value,
    unit: 'percent',
    coverage,
    missing_reason: missingReason,
    numerator: { metric_key: 'goals', value: goals.value, unit: 'count' },
    denominator: { metric_key: 'shots', value: shots.value, unit: 'count' },
    excluded,
  };
}

// Recibe datos normalizados de A14, sin leer archivos, credenciales ni botones.
function calculateBlockMetrics(block) {
  if (!Array.isArray(block?.replays) || block.replays.length !== REQUIRED_REPLAYS) {
    throw new TypeError('Las métricas requieren exactamente cinco replays normalizados.');
  }
  const replays = Array.from(block.replays);
  const replayIds = replays.map(replay => replay?.replay_id);
  if (replayIds.some(id => typeof id !== 'string' || !id.trim()) ||
      new Set(replayIds).size !== REQUIRED_REPLAYS) {
    throw new TypeError('Cada replay normalizado debe tener un identificador distinto.');
  }
  for (const key of ['platform', 'player_id', 'mode', 'match_type']) {
    if (typeof block.context?.[key] !== 'string' || !block.context[key].trim()) {
      throw new TypeError('Se requiere el contexto del jugador validado por A14.');
    }
  }
  if (typeof block.source !== 'string' || !block.source.trim()) {
    throw new TypeError('Se requiere identificar la procedencia de los datos.');
  }

  const goals = sumCounts(replays, 'goals');
  const shots = sumCounts(replays, 'shots');
  const boost = collectBoostMeasurements(replays);

  return {
    source: block.source,
    context: { ...block.context },
    metrics_version: 'mvp.metrics.v1',
    sample_size: REQUIRED_REPLAYS,
    replay_ids: replayIds,
    boost_zero_per_replay: boost.per_replay,
    ...(replays.some(r => r.values?.defensive_positioning) ? {
      defensive_review_per_replay: collectDefensiveMeasurements(replays),
    } : {}),
    values: {
      goals,
      shots,
      shooting_pct: shootingEfficiency(goals, shots),
      play_duration_s: sumDurations(replays),
      boost_zero_s: boost.seconds,
    },
  };
}

module.exports = { calculateBlockMetrics };
