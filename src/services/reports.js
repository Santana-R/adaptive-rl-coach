'use strict';

const { isDate, MODES } = require('../domain/goals');
const { RANKS, SOURCE: RANK_SOURCE } = require('../domain/ranks');
const { parseTimestamp } = require('../domain/timestamps');
const { ApiError } = require('../middleware/auth');

const TIMEZONE = 'America/Monterrey';
const DAY_MS = 86_400_000;
const calendar = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE,
  calendar: 'gregory',
  numberingSystem: 'latn',
  era: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

function dateKey(year, month, day) {
  return year * 10_000 + month * 100 + day;
}

function localDateKey(instant) {
  const parts = Object.fromEntries(
    calendar.formatToParts(instant).map(({ type, value }) => [type, value])
  );
  const year = parts.era === 'BC' ? 1 - Number(parts.year) : Number(parts.year);
  return dateKey(year, Number(parts.month), Number(parts.day));
}

function localDayStart(utcDay) {
  const date = new Date(utcDay);
  const target = dateKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  let low = utcDay - DAY_MS;
  let high = utcDay + DAY_MS;

  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    if (localDateKey(middle) < target) low = middle + 1;
    else high = middle;
  }

  return low;
}

function parseReportPeriod({ from, to } = {}) {
  if (!isDate(from) || !isDate(to) || from > to) {
    throw new ApiError(
      400,
      'INPUT_INVALID',
      'Indica fechas válidas en from y to (YYYY-MM-DD), con from menor o igual a to.'
    );
  }

  const firstDay = Date.parse(from + 'T00:00:00Z');
  const lastDay = Date.parse(to + 'T00:00:00Z');

  return {
    period: { from, to, timezone: TIMEZONE },
    startMs: localDayStart(firstDay),
    endExclusiveMs: localDayStart(lastDay + DAY_MS)
  };
}

function selectDatedRows(rows, interval, timeField, idField) {
  const included = [];
  const excluded = [];

  for (const row of rows) {
    const value = row[timeField];
    // Postgres puede entregar microsegundos. Los límites del reporte usan milisegundos.
    const time = typeof value === 'string'
      ? parseTimestamp(value.replace(/(\.\d{3})\d{1,3}(Z|[+-]\d{2}:\d{2})$/, '$1$2'))
      : null;

    if (time === null) {
      excluded.push({
        [idField]: row[idField],
        reason: value == null ? 'missing_timestamp' : 'invalid_timestamp'
      });
    } else if (time >= interval.startMs && time < interval.endExclusiveMs) {
      included.push({ row, time });
    }
  }

  included.sort((a, b) => a.time - b.time);
  return { rows: included.map(item => item.row), excluded };
}

function buildTrainingSeries(sessions, interval) {
  const { rows, excluded } = selectDatedRows(sessions, interval, 'performed_at', 'session_id');
  const points = [];

  for (const session of rows) {
    if (!Number.isSafeInteger(session.duration_minutes) || session.duration_minutes < 0) {
      excluded.push({
        session_id: session.session_id,
        reason: session.duration_minutes == null ? 'missing_duration' : 'invalid_duration'
      });
      continue;
    }

    points.push({
      session_id: session.session_id,
      plan_version_id: session.plan_version_id,
      mode: session.mode ?? null,
      performed_at: session.performed_at,
      duration_minutes: session.duration_minutes
    });
  }

  return {
    period: interval.period,
    source: 'self_reported_sessions',
    unit: 'minutes',
    sample_size: points.length,
    denominator: null,
    total_minutes: points.reduce((total, point) => total + point.duration_minutes, 0),
    points,
    excluded
  };
}

function buildRankSeries(entries, interval) {
  const { rows, excluded } = selectDatedRows(entries, interval, 'recorded_at', 'rank_id');
  const points = [];

  for (const entry of rows) {
    if (entry.source !== RANK_SOURCE || !MODES.includes(entry.mode) || !RANKS.includes(entry.rank_label)) {
      excluded.push({
        rank_id: entry.rank_id,
        reason: entry.source !== RANK_SOURCE ? 'unverified_rank_source' : 'invalid_rank'
      });
      continue;
    }

    points.push({
      rank_id: entry.rank_id,
      mode: entry.mode,
      rank_label: entry.rank_label,
      division: entry.division ?? null,
      season: entry.season,
      recorded_at: entry.recorded_at
    });
  }

  return {
    period: interval.period,
    source: RANK_SOURCE,
    unit: 'rank_label',
    sample_size: points.length,
    denominator: null,
    points,
    excluded
  };
}

module.exports = { parseReportPeriod, buildTrainingSeries, buildRankSeries };