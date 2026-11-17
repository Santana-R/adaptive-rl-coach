'use strict';

const { isDate, todayIn, MODES, TYPES } = require('../domain/goals');

function versionProblem(goal, version) {
  const spec = TYPES[goal.type]?.metrics?.[version.metric_key];
  const target = version.target_value;

  if (!MODES.includes(goal.mode) || !spec || version.unit !== spec.unit ||
      !spec.comparators.includes(version.comparator) || !Number.isFinite(target) ||
      target < spec.min || (!spec.minInclusive && target === spec.min) ||
      target > spec.max || (spec.integer && !Number.isInteger(target))) {
    return 'unsupported_goal';
  }

  if (!isDate(version.start_date) ||
      (version.due_date != null && (!isDate(version.due_date) || version.due_date < version.start_date))) {
    return 'invalid_goal_dates';
  }

  return null;
}

function goalWindow(version, activation, cutoff, interval) {
  const startMs = Math.max(interval.startMs, activation);
  const endExclusiveMs = Math.min(interval.endExclusiveMs, cutoff);
  if (startMs >= endExclusiveMs) return null;

  const timezone = version.timezone || interval.period.timezone;
  if (version.start_date > todayIn(timezone, new Date(endExclusiveMs - 1)) ||
      (version.due_date && version.due_date < todayIn(timezone, new Date(startMs)))) {
    return null;
  }

  return { startMs, endExclusiveMs, timezone };
}

function insideGoal(value, version, window) {
  const time = Date.parse(value);
  if (!Number.isFinite(time) || time < window.startMs || time >= window.endExclusiveMs) return false;

  const day = todayIn(window.timezone, new Date(time));
  return day >= version.start_date && (!version.due_date || day <= version.due_date);
}

function trainingEvidence(goal, version, window, points) {
  const matching = points.filter(point =>
    point.mode === goal.mode && insideGoal(point.performed_at, version, window)
  );

  return {
    source: 'self_reported_sessions',
    sample_size: matching.length,
    actual_value: matching.length
      ? matching.reduce((total, point) => total + point.duration_minutes, 0)
      : null,
    denominator: null,
    evidence: { session_ids: matching.map(point => point.session_id) },
    reason: matching.length ? null : 'no_matching_training_sessions'
  };
}

function performanceEvidence(goal, version, window, points) {
  const block = points.findLast(point =>
    point.mode === goal.mode &&
    insideGoal(point.first_match_at, version, window) &&
    insideGoal(point.last_match_at, version, window)
  );

  return {
    source: 'compatible_replays',
    sample_size: block?.sample_size ?? 0,
    actual_value: block?.value ?? null,
    denominator: block?.denominator ?? null,
    evidence: { block_id: block?.block_id ?? null },
    reason: block ? null : 'no_matching_replay_block'
  };
}

function buildGoalSeries(goals, training, performance, interval) {
  const points = [];
  const excluded = [];

  for (const goal of goals) {
    const archivedAt = goal.archived_at == null ? Infinity : Date.parse(goal.archived_at);
    const versions = (goal.versions ?? [goal])
      .map(version => ({ version, activation: Date.parse(version.activated_at) }))
      .filter(({ version, activation }) => {
        if (Number.isFinite(activation)) return true;
        excluded.push({
          goal_id: goal.goal_id,
          goal_version_id: version.goal_version_id,
          reason: 'invalid_goal_activation'
        });
        return false;
      })
      .sort((a, b) => a.activation - b.activation || a.version.version - b.version.version);

    for (const [index, { version, activation }] of versions.entries()) {
      const reason = Number.isNaN(archivedAt) ? 'invalid_goal_archive' : versionProblem(goal, version);
      if (reason !== null) {
        excluded.push({ goal_id: goal.goal_id, goal_version_id: version.goal_version_id, reason });
        continue;
      }

      const cutoff = Math.min(archivedAt, versions[index + 1]?.activation ?? Infinity);
      const window = goalWindow(version, activation, cutoff, interval);
      if (!window) continue;

      const result = goal.type === 'training'
        ? trainingEvidence(goal, version, window, training.points)
        : performanceEvidence(goal, version, window, performance.points);
      const actual = result.actual_value;
      const target = version.target_value;
      const met = version.comparator === '>' ? actual > target : actual >= target;

      points.push({
        goal_id: goal.goal_id,
        goal_version_id: version.goal_version_id,
        version: version.version,
        name: version.name,
        type: goal.type,
        mode: goal.mode,
        metric_key: version.metric_key,
        unit: version.unit,
        comparator: version.comparator,
        target_value: target,
        goal_period: { from: version.start_date, to: version.due_date ?? null, timezone: window.timezone },
        active_from: new Date(window.startMs).toISOString(),
        active_until: new Date(window.endExclusiveMs).toISOString(),
        status: actual === null ? 'insufficient_data' : met ? 'met' : 'not_met',
        ...result
      });
    }
  }

  return {
    period: interval.period,
    source: 'goal_versions',
    unit: 'mixed',
    sample_size: points.filter(point => point.actual_value !== null).length,
    denominator: null,
    points,
    excluded
  };
}

module.exports = { buildGoalSeries };