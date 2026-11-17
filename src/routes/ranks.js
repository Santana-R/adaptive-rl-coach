'use strict';

// A31 · /api/v1/rank-history. El propietario es el usuario de la sesión; la fuente es fija
// (self_reported). El rango se devuelve separado de las métricas de rendimiento y entrenamiento.

const express = require('express');
const { ApiError, sendError, CONTRACT_VERSION } = require('../middleware/auth');
const ranks = require('../repositories/ranks');
const { parseRank, SOURCE } = require('../domain/ranks');
const { MODES } = require('../domain/goals');

const meta = extra => ({ contract_version: CONTRACT_VERSION, source: SOURCE, ...extra });

function failure(res, next, error, message) {
  if (error instanceof ApiError) return next(error);
  return sendError(res, 503, 'PROVIDER_UNAVAILABLE', message);
}

function createRankHistoryRouter({ supabase, requireAuth, requireRole }) {
  const router = express.Router();
  router.use(requireAuth, requireRole('player', 'admin'), (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

  router.get('/', async (req, res, next) => {
    try {
      const mode = req.query.mode;
      if (mode !== undefined && !MODES.includes(mode)) throw new ApiError(400, 'INPUT_INVALID', 'Filtro válido: mode=1v1|2v2|3v3.');
      const data = await ranks.listRanks(supabase, req.user.id, { mode });
      return res.json({ data, meta: meta() });
    } catch (error) { return failure(res, next, error, 'No se pudo consultar el historial de rango.'); }
  });

  router.post('/', async (req, res, next) => {
    try {
      const entry = parseRank(req.body);
      const saved = await ranks.addRank(supabase, req.user.id, entry);
      return res.status(201).json({ data: saved, meta: meta() });
    } catch (error) { return failure(res, next, error, 'No se pudo guardar el rango.'); }
  });

  return router;
}

module.exports = { createRankHistoryRouter };
