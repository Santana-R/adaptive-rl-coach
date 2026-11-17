'use strict';

const express = require('express');
const { ApiError, CONTRACT_VERSION } = require('../middleware/auth');
const { listGoals } = require('../repositories/goals');
const { listRanks } = require('../repositories/ranks');
const { listTrainingSessions } = require('../repositories/reports');
const { parseReportPeriod, buildTrainingSeries, buildRankSeries } = require('../services/reports');
const { buildPerformanceSeries } = require('../services/report-performance');
const { buildGoalSeries } = require('../services/report-goals');

function createReportsRouter({ supabase, repository, requireAuth, requireRole }) {
  const router = express.Router();

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.use(requireAuth, requireRole('player', 'admin'));

  router.get('/', async (req, res) => {
    const interval = parseReportPeriod(req.query);
    if (typeof repository?.listBlocksForUser !== 'function') {
      throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'No se pudo consultar el historial de bloques.');
    }

    const userId = req.user.id;
    const [blocks, sessions, goals, ranks] = await Promise.all([
      repository.listBlocksForUser(userId),
      listTrainingSessions(supabase, userId, interval),
      listGoals(supabase, userId, { status: 'all', withHistory: true }),
      listRanks(supabase, userId)
    ]);

    if (!Array.isArray(blocks)) {
      throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'El historial de bloques no está disponible.');
    }

    const ownedBlocks = blocks.filter(block => block?.owner_id === userId);
    const performance = buildPerformanceSeries(ownedBlocks, interval);
    const training = buildTrainingSeries(sessions, interval);
    const rank = buildRankSeries(ranks.entries, interval);

    return res.json({
      data: {
        period: interval.period,
        performance,
        training,
        rank,
        goals: buildGoalSeries(goals, training, performance, interval)
      },
      meta: { contract_version: CONTRACT_VERSION }
    });
  });

  return router;
}

module.exports = { createReportsRouter };