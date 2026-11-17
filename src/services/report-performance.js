'use strict';

const { compareBlocks, resolveBaseline } = require('../domain/comparison');
const { parseTimestamp } = require('../domain/timestamps');

function usableShootingMetric(metric, sampleSize) {
  return metric?.missing_reason == null && metric?.unit === 'percent' &&
    metric.coverage === sampleSize &&
    Number.isFinite(metric.value) && metric.value >= 0 && metric.value <= 100 &&
    metric.numerator?.metric_key === 'goals' &&
    Number.isSafeInteger(metric.numerator.value) && metric.numerator.value >= 0 &&
    metric.denominator?.metric_key === 'shots' &&
    Number.isSafeInteger(metric.denominator.value) && metric.denominator.value > 0;
}

function buildPerformanceSeries(blocks, interval) {
  const eligible = [];
  const excluded = [];

  for (const block of blocks) {
    const blockId = block.block_id;
    const metrics = block.metrics_block;

    if (block.status !== 'ready' || !metrics) {
      excluded.push({
        block_id: blockId,
        reason: block.status === 'ready' ? 'missing_block_metrics' : 'block_not_ready',
        reason_codes: block.reason_codes ?? []
      });
      continue;
    }

    const first = parseTimestamp(metrics.first_match_at);
    const last = parseTimestamp(metrics.last_match_at);

    if (first !== null && last !== null && first <= last &&
        (last < interval.startMs || first >= interval.endExclusiveMs)) continue;

    const checked = compareBlocks(metrics);
    if (checked.status !== 'baseline') {
      excluded.push({ block_id: blockId, reason: 'invalid_block', reason_codes: checked.reason_codes });
      continue;
    }

    if (first < interval.startMs || last >= interval.endExclusiveMs) {
      excluded.push({ block_id: blockId, reason: 'crosses_period_boundary' });
      continue;
    }

    const efficiency = metrics.values?.shooting_pct;
    if (!usableShootingMetric(efficiency, metrics.sample_size)) {
      excluded.push({ block_id: blockId, reason: efficiency?.missing_reason ?? 'invalid_shooting_pct' });
      continue;
    }

    eligible.push({ metrics, efficiency, last });
  }

  eligible.sort((a, b) => a.last - b.last || a.metrics.block_id.localeCompare(b.metrics.block_id));

  const history = [];
  const points = eligible.map(({ metrics, efficiency }) => {
    const comparison = resolveBaseline(metrics, history);
    history.push(metrics);

    return {
      block_id: metrics.block_id,
      first_match_at: metrics.first_match_at,
      last_match_at: metrics.last_match_at,
      mode: metrics.context.mode,
      match_type: metrics.context.match_type,
      platform: metrics.context.platform,
      source: metrics.source,
      metrics_version: metrics.metrics_version,
      sample_size: efficiency.coverage,
      value: efficiency.value,
      numerator: efficiency.numerator,
      denominator: efficiency.denominator,
      comparison: {
        status: comparison.status,
        baseline_block_id: comparison.baseline_block_id,
        delta_pp: comparison.deltas?.shooting_pct?.delta ?? null,
        reason_codes: comparison.reason_codes
      }
    };
  });

  const shots = points.reduce((total, point) => total + point.denominator.value, 0);

  return {
    period: interval.period,
    source: 'compatible_replays',
    unit: 'percent',
    metric_key: 'shooting_pct',
    sample_size: points.reduce((total, point) => total + point.sample_size, 0),
    denominator: points.length ? { metric_key: 'shots', value: shots, unit: 'count' } : null,
    points,
    excluded
  };
}

module.exports = { buildPerformanceSeries };