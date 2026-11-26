'use strict';

const { MODES, todayIn } = require('../domain/goals');
const { calculateBlockMetrics } = require('../domain/metrics');
const { RANKS, SOURCE } = require('../domain/ranks');
const { ApiError } = require('../middleware/auth');
const { buildPerformanceSeries } = require('./report-performance');
const { buildGoalSeries } = require('./report-goals');
const { buildRankSeries, buildTrainingSeries, parseReportPeriod } = require('./reports');

// Cada bloque de ejemplo contiene cinco partidas y veinte tiros en total.
// Las fechas se expresan en días antes de hoy para que la demo siga siendo reproducible.
const players = [
  { mode: '2v2', blocks: [[35, 4], [15, 5], [3, 8]], goal: [12, 2, 35], ranks: [[22, 'gold'], [3, 'platinum']] },
  { mode: '2v2', blocks: [[24, 7], [5, 5]], goal: [20, 4, 30], ranks: [[25, 'diamond'], [5, 'platinum']] },
  { mode: '2v2', blocks: [[4, 6]], goal: [10, 2, 30], training: [4, 35], ranks: [[4, 'gold']] },
  { mode: '2v2', blocks: [[53, 4], [39, 7]], goal: [48, 38, 30], ranks: [[50, 'gold'], [39, 'platinum']] },
  { mode: '2v2', blocks: [[18, 3]], goal: [14, 6, 25], ranks: [[18, 'silver']] },
  { mode: '3v3', blocks: [[28, 4], [4, 7]], goal: [18, 2, 30], ranks: [[28, 'platinum'], [4, 'diamond']] },
  { mode: '3v3', blocks: [[20, 6], [12, 6]], goal: [17, 10, 35], ranks: [[20, 'gold'], [12, 'gold']] },
  { mode: '3v3', blocks: [[6, 5]], ranks: [[6, 'silver']] },
];

function demoBlock(playerId, mode, index, date, goals) {
  const id = `${playerId}-block-${index}`;
  const metrics = calculateBlockMetrics({
    source: 'synthetic',
    context: { player_id: playerId, platform: 'steam', mode, match_type: 'ranked' },
    replays: Array.from({ length: 5 }, (_, match) => ({
      replay_id: `${id}-${match}`,
      values: {
        goals: { value: Math.floor(goals / 5) + Number(match < goals % 5), unit: 'count' },
        shots: { value: 4, unit: 'count' },
      },
    })),
  });
  return {
    block_id: id, status: 'ready',
    metrics_block: { ...metrics, block_id: id, status: 'ready',
      first_match_at: `${date}T12:00:00Z`, last_match_at: `${date}T12:30:00Z` },
  };
}

function summarize(values, improved) {
  const evaluated = values.filter(value => value !== null);
  return { count: evaluated.filter(improved).length, evaluated: evaluated.length, excluded: values.length - evaluated.length };
}

function buildAdminProgressDemo({ days = '30', mode = '2v2' } = {}, now = new Date()) {
  if (!['7', '30', '60'].includes(days) || !MODES.includes(mode)) {
    throw new ApiError(400, 'INPUT_INVALID', 'Elige un periodo de 7, 30 o 60 días y una modalidad válida.');
  }

  const today = todayIn('America/Monterrey', now);
  const date = daysAgo => new Date(Date.parse(today) - daysAgo * 86_400_000).toISOString().slice(0, 10);
  const interval = parseReportPeriod({ from: date(Number(days) - 1), to: today });
  const history = parseReportPeriod({ from: date(60), to: today });
  const inPeriod = timestamp => Date.parse(timestamp) >= interval.startMs && Date.parse(timestamp) < interval.endExclusiveMs;
  const comparisons = [], goals = [], ranks = [];

  for (const [index, player] of players.entries()) {
    if (player.mode !== mode) continue;
    const playerId = `demo-${index + 1}`;
    const blocks = player.blocks.map(([ago, goals], block) => demoBlock(playerId, mode, block, date(ago), goals));
    const performance = buildPerformanceSeries(blocks, history);
    const current = performance.points.findLast(point => inPeriod(point.last_match_at));
    if (current) comparisons.push(current.comparison.delta_pp);

    const entries = player.ranks.map(([ago, rank], i) => ({
      rank_id: `${playerId}-${i}`, mode, rank_label: rank,
      season: 'Temporada de ejemplo', source: SOURCE, recorded_at: `${date(ago)}T12:00:00Z`,
    }));
    const points = buildRankSeries(entries, history).points;
    const latest = points.at(-1);
    if (latest && inPeriod(latest.recorded_at)) {
      const previous = points.slice(0, -1).findLast(point => point.season === latest.season);
      ranks.push(previous ? RANKS.indexOf(latest.rank_label) - RANKS.indexOf(previous.rank_label) : null);
    }

    if (!player.goal) continue;
    const [start, due, target] = player.goal;
    if (!inPeriod(date(due) + 'T12:00:00Z')) continue;
    const sessions = player.training ? [{
      session_id: `${playerId}-session`, mode, performed_at: `${date(player.training[0])}T12:00:00Z`,
      duration_minutes: player.training[1],
    }] : [];
    const training = buildTrainingSeries(sessions, interval);
    const [goal] = buildGoalSeries([{
      goal_id: `${playerId}-goal`, mode, type: player.training ? 'training' : 'performance',
      version: 1, activated_at: `${date(start)}T10:00:00Z`, start_date: date(start), due_date: date(due),
      metric_key: player.training ? 'training_minutes' : 'shooting_pct', unit: player.training ? 'minutes' : 'percent',
      target_value: target, comparator: '>=',
    }], training, performance, interval).points;
    goals.push(!goal || goal.status === 'insufficient_data' ? null : goal.status === 'met');
  }

  return {
    source: 'synthetic', mode, period: interval.period,
    shooting: summarize(comparisons, delta => delta > 0),
    goals: summarize(goals, met => met),
    ranks: summarize(ranks, delta => delta > 0),
  };
}

module.exports = { buildAdminProgressDemo };
