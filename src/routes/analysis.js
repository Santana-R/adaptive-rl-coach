const express = require('express');
const { ApiError, assertOwner, sendError } = require('../middleware/auth');
const { analyzeBlock } = require('../services/analysis');
const { demoInput } = require('../services/analysis-demo');

function sendAnalysis(res, input) {
  res.set('Cache-Control', 'no-store');
  const result = analyzeBlock(input);
  if (!result.valid) {
    return res.status(422).json({
      error: { code: 'BLOCK_INVALID', message: 'El bloque no reúne los requisitos para analizarlo.',
        details: { reason_codes: result.reason_codes, replay_errors: result.replay_errors } },
      meta: { contract_version: '1.0' },
    });
  }
  return res.json({ data: result.data, meta: { contract_version: '1.0', source: result.data.source,
    synthetic: result.data.source === 'synthetic' ? true : result.data.source === 'ballchasing' ? false : null } });
}

function createAnalysisRouter({ requireAuth, requireRole, repository = null }) {
  const router = express.Router();
  router.get('/:blockId/analysis', requireAuth, requireRole('player', 'admin'), async (req, res, next) => {
    try {
      const baselineId = req.query.baseline_id;
      if (baselineId !== undefined && (typeof baselineId !== 'string' || !baselineId.trim())) {
        return sendError(res, 400, 'INPUT_INVALID', 'Indica un único bloque anterior válido.');
      }
      if (!repository || typeof repository.getBlockForUser !== 'function' || typeof repository.listBlocksForUser !== 'function') {
        return sendError(res, 503, 'PROVIDER_UNAVAILABLE', 'La consulta de bloques para análisis todavía no está disponible.');
      }
      const current = await repository.getBlockForUser(req.params.blockId, req.user.id);
      if (!current) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'El recurso no existe.');
      assertOwner(req, current.owner_id);
      if (!['ready', 'invalid'].includes(current.status)) return sendError(res, 409, 'BLOCK_NOT_READY', 'El bloque todavía no está listo para analizarse.');
      let baseline = null, history = [];
      if (baselineId !== undefined) {
        baseline = await repository.getBlockForUser(baselineId, req.user.id);
        if (!baseline) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'El recurso no existe.');
        assertOwner(req, baseline.owner_id);
      } else {
        const rows = await repository.listBlocksForUser(req.user.id);
        if (!Array.isArray(rows)) throw new Error('Invalid repository result');
        history = rows.filter(block => block?.owner_id === req.user.id);
      }
      return sendAnalysis(res, { current, baseline, history });
    } catch (error) {
      if (error instanceof ApiError) return next(error);
      return sendError(res, 503, 'PROVIDER_UNAVAILABLE', 'No se pudieron obtener los datos del análisis. Intenta más tarde.');
    }
  });
  return router;
}

function createAnalysisDemoRouter({ enabled = false } = {}) {
  const router = express.Router();
  router.get('/', (req, res) => {
    const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
    if (!enabled || !local) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'La demostración de análisis no está disponible en este servidor.');
    const caseName = req.query.case ?? 'initial';
    if (typeof caseName !== 'string') return sendError(res, 400, 'INPUT_INVALID', 'Elige un único caso de demostración.');
    const input = demoInput(caseName);
    if (!input) return sendError(res, 400, 'INPUT_INVALID', 'El caso de demostración no existe.');
    return sendAnalysis(res, input);
  });
  return router;
}

module.exports = { createAnalysisRouter, createAnalysisDemoRouter };
