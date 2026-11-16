'use strict';

const express = require('express');
const { ApiError, assertOwner, sendError } = require('../middleware/auth');
const { getProfile } = require('../repositories/profile');
const { getCatalog } = require('../repositories/catalog');
const { getPlanGoals } = require('../repositories/plan-goals');
const { analyzeBlock } = require('../services/analysis');
const { generatePlan } = require('../domain/plans');

const RANKS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'champion', 'grand_champion', 'supersonic_legend'];
const VARIANTS = ['easy-base', 'normal-fixed', 'normal-distance', 'normal-random', 'survival-optional'];
function parseProposalInput(body = {}) {
  const allowed = ['availability_minutes', 'goal_ids', 'workshop_access', 'rank', 'coco_variant_key'];
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !allowed.includes(key))) {
    throw new ApiError(400, 'INPUT_INVALID', 'Envía solo disponibilidad, metas y preferencias de esta sesión.');
  }
  if (body.availability_minutes !== undefined && (!Number.isInteger(body.availability_minutes) || body.availability_minutes < 0 || body.availability_minutes > 32767) ||
    body.workshop_access !== undefined && typeof body.workshop_access !== 'boolean' ||
    body.rank !== undefined && body.rank !== null && !RANKS.includes(body.rank) ||
    body.coco_variant_key !== undefined && !VARIANTS.includes(body.coco_variant_key)) {
    throw new ApiError(400, 'INPUT_INVALID', 'Revisa los minutos y las preferencias de entrenamiento.');
  }
  const ids = body.goal_ids === undefined ? [] : body.goal_ids;
  if (!Array.isArray(ids) || ids.length > 20 || ids.some(id => typeof id !== 'string' || !/^[1-9]\d{0,17}$/.test(id)) || new Set(ids).size !== ids.length) {
    throw new ApiError(400, 'INPUT_INVALID', 'Indica una lista de metas válidas sin repetir.');
  }
  return { ...body, goal_ids: ids };
}

function createPlansRouter({ supabase, repository, requireAuth, requireRole }) {
  const router = express.Router();
  // Propuesta sin guardar. A24 implementará los recursos /plans persistidos.
  router.post('/:blockId/plan-proposal', requireAuth, requireRole('player', 'admin'), async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    try {
      const input = parseProposalInput(req.body);
      if (!repository) throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'La consulta de bloques todavía no está disponible.');
      const block = await repository.getBlockForUser(req.params.blockId, req.user.id);
      if (!block) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'El recurso no existe.');
      assertOwner(req, block.owner_id);
      if (block.status !== 'ready' && block.status !== 'invalid') throw new ApiError(409, 'BLOCK_NOT_READY', 'El bloque todavía no está listo.');
      const analysis = analyzeBlock({ current: block });
      if (!analysis.valid) throw new ApiError(422, 'BLOCK_INVALID', 'El bloque no reúne los requisitos para generar una propuesta.');
      const profile = await getProfile(supabase, req.user.id);
      const context = analysis.data.metrics.context;
      if (!profile) throw new ApiError(422, 'PROFILE_REQUIRED', 'Completa tu perfil antes de generar una propuesta.');
      if (profile.platform !== context.platform || profile.player_id !== context.player_id) {
        throw new ApiError(422, 'PROFILE_MISMATCH', 'La identidad del perfil actual no corresponde a la del bloque.');
      }
      const minutes = input.availability_minutes ?? profile.available_minutes;
      if (!Number.isInteger(minutes) || minutes < 0 || minutes > 32767) throw new ApiError(422, 'PROFILE_REQUIRED', 'Revisa los minutos disponibles en tu perfil.');
      const catalog = await getCatalog(supabase);
      const goals = await getPlanGoals(supabase, req.user.id, input.goal_ids);
      const trainingProfile = { ...profile, mode: context.mode, workshop_access: input.workshop_access === true,
        rank: input.rank ?? null, rank_mode: context.mode, rank_source: input.rank ? 'self_reported' : null,
        coco_variant_key: input.coco_variant_key };
      const proposal = generatePlan({ analysis: analysis.data, profile: trainingProfile, catalog,
        goals, availability_minutes: minutes });
      return res.json({ data: proposal, meta: { contract_version: '1.0', persisted: false,
        source: analysis.data.source, session_preferences_source: 'self_reported', catalog_source: catalog.source } });
    } catch (error) {
      if (error instanceof ApiError) return next(error);
      return sendError(res, 503, 'PROVIDER_UNAVAILABLE', 'No se pudo generar la propuesta. Intenta más tarde.');
    }
  });
  return router;
}

module.exports = { createPlansRouter, parseProposalInput };
