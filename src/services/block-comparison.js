const { calculateReplayBlockMetrics } = require('./block-metrics');
const { compareBlocks } = require('../domain/comparison');
const { parseTimestamp } = require('../domain/timestamps');

function buildComparisonBlock(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { block_id: null, status: 'invalid', reason_codes: ['BLOCK_INVALID'] };
  }
  const { block_id, replays, profile, source = 'ballchasing' } = input;
  if (typeof source !== 'string' || !source.trim()) {
    return { block_id, status: 'invalid', reason_codes: ['SOURCE_MISSING'] };
  }
  const metrics = calculateReplayBlockMetrics(replays, profile, { source });
  if (!metrics.valid) {
    return { block_id, status: 'invalid', reason_codes: metrics.reason_codes, replay_errors: metrics.replays };
  }

  const timestamps = [];
  const dateExclusions = [];
  for (const replay of replays) {
    let reason = null;
    if (replay.date == null) reason = 'not_available';
    else if (replay.date_has_timezone !== true) reason = 'timezone_unverified';
    const time = reason === null ? parseTimestamp(replay.date) : null;
    if (time === null) {
      dateExclusions.push({ replay_id: replay.id, reason: reason || 'invalid_timestamp' });
    } else {
      timestamps.push(time);
    }
  }
  const dated = timestamps.length === 5;
  const keys = replays.flatMap(replay => ['id', 'rocket_league_id', 'match_guid'].flatMap(field => {
    const value = replay[field];
    return typeof value === 'string' && value.trim() ? [`${field}:${value.trim()}`] : [];
  }));

  return {
    ...metrics.data,
    block_id,
    status: 'ready',
    first_match_at: dated ? new Date(Math.min(...timestamps)).toISOString() : null,
    last_match_at: dated ? new Date(Math.max(...timestamps)).toISOString() : null,
    date_exclusions: dateExclusions,
    replay_keys: keys,
  };
}

function compareReplayBlocks(current, baseline = null) {
  const currentBlock = buildComparisonBlock(current);
  const baselineBlock = baseline === null ? null : buildComparisonBlock(baseline);
  return {
    current: currentBlock,
    baseline: baselineBlock,
    comparison: compareBlocks(currentBlock, baselineBlock),
  };
}

module.exports = { buildComparisonBlock, compareReplayBlocks };
