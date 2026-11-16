const { parseTimestamp } = require('./timestamps');

const METRICS = {
  goals: { unit: 'count', deltaUnit: 'count', integer: true },
  shots: { unit: 'count', deltaUnit: 'count', integer: true },
  shooting_pct: { unit: 'percent', deltaUnit: 'percentage_points', maximum: 100 },
  play_duration_s: { unit: 'seconds', deltaUnit: 'seconds', scope: 'match', source: 'play_duration' },
};

const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const unique = values => [...new Set(values)];
const blockId = block => nonempty(block?.block_id) ? block.block_id.trim() : null;

function blockProblems(block) {
  if (!block || typeof block !== 'object' || Array.isArray(block)) return ['BLOCK_INVALID'];
  if (block.status !== 'ready') {
    const reasons = Array.isArray(block.reason_codes) ? block.reason_codes.filter(nonempty) : [];
    return unique(['BLOCK_NOT_READY', ...reasons]);
  }
  const reasons = [];
  if (blockId(block) === null) reasons.push('BLOCK_ID_INVALID');
  if (!nonempty(block.source)) reasons.push('SOURCE_MISSING');
  if (!nonempty(block.metrics_version)) reasons.push('METRICS_VERSION_MISSING');
  const context = block.context;
  if (!['platform', 'player_id', 'mode', 'match_type'].every(key => nonempty(context?.[key])) ||
      !['1v1', '2v2', '3v3'].includes(context?.mode) ||
      !['ranked', 'casual', 'private'].includes(context?.match_type)) {
    reasons.push('CONTEXT_INCOMPLETE');
  }
  const ids = Array.isArray(block.replay_ids) ? Array.from(block.replay_ids) : [];
  if (block.sample_size !== 5 || ids.length !== 5 || !ids.every(nonempty)) {
    reasons.push('REPLAY_COUNT_INVALID');
  } else if (new Set(ids.map(id => id.trim())).size !== 5) {
    reasons.push('DUPLICATE_REPLAY');
  }
  if (block.replay_keys !== undefined && (!Array.isArray(block.replay_keys) ||
      !Array.from(block.replay_keys).every(key => typeof key === 'string' &&
        (/^(id|rocket_league_id|match_guid):.+$/.test(key) || /^hash:[a-f0-9]{64}$/.test(key))))) {
    reasons.push('REPLAY_KEYS_INVALID');
  }
  const first = parseTimestamp(block.first_match_at);
  const last = parseTimestamp(block.last_match_at);
  if (first === null || last === null || first > last) reasons.push('CHRONOLOGY_INVALID');
  return reasons;
}

function replayKeys(block) {
  return new Set([
    ...block.replay_ids.map(id => `id:${id.trim()}`),
    ...(block.replay_keys || []),
  ]);
}

function metricProblem(metric, definition) {
  if (!metric || metric.value == null) {
    return nonempty(metric?.missing_reason) ? metric.missing_reason : 'not_available';
  }
  if (metric.missing_reason != null) return 'not_available';
  if (metric.coverage !== 5) return 'incomplete_coverage';
  if (metric.unit !== definition.unit) return 'unit_mismatch';
  if (definition.scope && (metric.scope !== definition.scope || metric.source_field !== definition.source)) {
    return 'incompatible_measurement';
  }
  if (!Number.isFinite(metric.value) || metric.value < 0 ||
      metric.value > (definition.maximum ?? Number.MAX_SAFE_INTEGER) ||
      (definition.integer && !Number.isSafeInteger(metric.value))) return 'invalid_value';
  return null;
}

function compareMetric(current, baseline, definition) {
  const missingReason = metricProblem(baseline, definition) || metricProblem(current, definition);
  const difference = missingReason === null ? current.value - baseline.value : null;
  return {
    baseline: Number.isFinite(baseline?.value) ? baseline.value : null,
    current: Number.isFinite(current?.value) ? current.value : null,
    delta: difference === 0 ? 0 : difference,
    unit: definition.deltaUnit,
    coverage: { baseline: baseline?.coverage ?? 0, current: current?.coverage ?? 0 },
    missing_reason: missingReason,
  };
}

function response(current, baseline, status, reasons, deltas = null) {
  return {
    status,
    current_block_id: blockId(current),
    baseline_block_id: blockId(baseline),
    reason_codes: unique(reasons),
    deltas,
  };
}

// Recibe bloques normalizados; no consulta historial, red ni base de datos.
function compareBlocks(current, baseline = null) {
  const reasons = blockProblems(current);
  if (baseline !== null) reasons.push(...blockProblems(baseline));
  if (reasons.length) return response(current, baseline, 'not_comparable', reasons);

  // null significa que no se proporcionó un anterior; un objeto inválido se rechaza arriba.
  if (baseline === null) {
    return response(current, null, 'baseline', ['NO_PREVIOUS_COMPATIBLE_BLOCK']);
  }

  if (blockId(current) === blockId(baseline)) reasons.push('SAME_BLOCK');
  if (current.source !== baseline.source) reasons.push('SOURCE_MISMATCH');
  if (current.context.platform !== baseline.context.platform ||
      current.context.player_id !== baseline.context.player_id) reasons.push('PLAYER_MISMATCH');
  if (current.context.mode !== baseline.context.mode) reasons.push('MODE_MISMATCH');
  if (current.context.match_type !== baseline.context.match_type) reasons.push('MATCH_TYPE_MISMATCH');
  if (current.metrics_version !== baseline.metrics_version) reasons.push('METRICS_VERSION_MISMATCH');
  if (parseTimestamp(current.first_match_at) <= parseTimestamp(baseline.last_match_at)) {
    reasons.push('CHRONOLOGY_INVALID');
  }
  const previousKeys = replayKeys(baseline);
  if ([...replayKeys(current)].some(key => previousKeys.has(key))) reasons.push('SHARED_REPLAYS');
  if (reasons.length) return response(current, baseline, 'not_comparable', reasons);

  const deltas = Object.fromEntries(Object.entries(METRICS).map(([key, definition]) =>
    [key, compareMetric(current.values?.[key], baseline.values?.[key], definition)]
  ));
  if (Object.values(deltas).every(metric => metric.delta === null)) {
    return response(current, baseline, 'not_comparable', ['NO_COMPARABLE_METRICS']);
  }
  return response(current, baseline, 'comparable', [], deltas);
}

// A19/A15 entregarán candidatos propios. Elegimos el anterior compatible más reciente.
function resolveBaseline(current, history = []) {
  if (!Array.isArray(history)) throw new TypeError('El historial debe ser una lista de bloques.');
  const initial = compareBlocks(current);
  if (initial.status !== 'baseline') return initial;
  const candidates = Array.from(history, block => ({ block, comparison: compareBlocks(current, block) }));
  const compatible = candidates.filter(item => item.comparison.status === 'comparable');
  compatible.sort((a, b) => {
    const timeDifference = parseTimestamp(b.block.last_match_at) - parseTimestamp(a.block.last_match_at);
    if (timeDifference !== 0) return timeDifference;
    const aId = blockId(a.block), bId = blockId(b.block);
    return aId < bId ? -1 : aId > bId ? 1 : 0;
  });
  const skipped = candidates.filter(item => item.comparison.status !== 'comparable').map(item => ({
    block_id: blockId(item.block), reason_codes: item.comparison.reason_codes,
  }));
  return { ...(compatible[0]?.comparison || initial), skipped_candidates: skipped };
}

module.exports = { compareBlocks, resolveBaseline };
