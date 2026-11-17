'use strict';

const express = require('express');
const { ApiError, CONTRACT_VERSION } = require('../middleware/auth');
const { listGoals } = require('../repositories/goals');
const { listRanks } = require('../repositories/ranks');
const { listTrainingSessions } = require('../repositories/reports');
const { parseReportPeriod, buildTrainingSeries, buildRankSeries } = require('../services/reports');
const { buildPerformanceSeries } = require('../services/report-performance');
const { buildGoalSeries } = require('../services/report-goals');

/** Arma las cuatro series del reporte de un usuario. La usa la ruta y la prueba real de A31. */
async function buildReport({ supabase, repository, userId, interval }) {
  if (typeof repository?.listBlocksForUser !== 'function') {
    throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'No se pudo consultar el historial de bloques.');
  }

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

  return {
    period: interval.period,
    performance,
    training,
    rank,
    goals: buildGoalSeries(goals, training, performance, interval)
  };
}

function createReportsRouter({ supabase, repository, requireAuth, requireRole }) {
  const router = express.Router();

  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.use(requireAuth, requireRole('player', 'admin'));

  router.get('/', async (req, res) => {
    const interval = parseReportPeriod(req.query);
    const data = await buildReport({ supabase, repository, userId: req.user.id, interval });

    return res.json({ data, meta: { contract_version: CONTRACT_VERSION } });
  });

  return router;
}

module.exports = { createReportsRouter, buildReport };
