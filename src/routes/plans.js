'use strict';

const express = require('express');
const { ApiError, assertOwner, sendError, CONTRACT_VERSION } = require('../middleware/auth');
const { getProfile } = require('../repositories/profile');
const { getCatalog } = require('../repositories/catalog');
const { getPlanGoals } = require('../repositories/plan-goals');
const plans = require('../repositories/plans');
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

// A18 · Bloque/perfil/catálogo/metas propios → propuesta. La comparten la propuesta sin
// guardar y las rutas /plans de A24, para que lo guardado sea exactamente lo generado.
async function buildProposal({ supabase, repository, req, blockId, body }) {
  const input = parseProposalInput(body);
  if (!repository) throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'La consulta de bloques todavía no está disponible.');
  const block = await repository.getBlockForUser(blockId, req.user.id);
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
  return { proposal, analysis: analysis.data, profile, catalog };
}

function failure(res, next, error, message) {
  if (error instanceof ApiError) return next(error);
  return sendError(res, 503, 'PROVIDER_UNAVAILABLE', message);
}

// A24 · Genera con buildProposal y guarda la versión siguiente; responde lo que quedó guardado.
async function saveVersion({ supabase, repository, req, res, blockId }) {
  const { proposal, analysis, profile, catalog } = await buildProposal({ supabase, repository, req, blockId, body: req.body });
  const saved = await plans.savePlan(supabase, { userId: req.user.id, blockId, proposal, analysis, profile });
  const stored = await plans.getPlanVersion(supabase, req.user.id, saved.plan_id, saved.version);
  if (!stored) throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'El plan se guardó, pero no se pudo leer.');
  res.set('Location', `/api/v1/plans/${saved.plan_id}/versions/${saved.version}`);
  return res.status(201).json({ data: stored, meta: { contract_version: CONTRACT_VERSION, persisted: true,
    analysis_created: saved.analysis_created, source: analysis.source,
    session_preferences_source: 'self_reported', catalog_source: catalog.source } });
}

function createPlansRouter({ supabase, repository, requireAuth, requireRole }) {
  const router = express.Router();
  // A27: recuperar lo guardado sin generar ni modificar versiones.
  router.get('/:blockId/plan', requireAuth, requireRole('player', 'admin'), async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    try {
      const plan = await plans.getPlanForBlock(supabase, req.user.id, req.params.blockId);
      if (!plan) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'No hay un plan guardado para este bloque.');
      return res.json({ data: plan, meta: { contract_version: CONTRACT_VERSION, persisted: true } });
    } catch (error) {
      return failure(res, next, error, 'No se pudo consultar el plan del bloque.');
    }
  });
  // Propuesta sin guardar (A18).
  router.post('/:blockId/plan-proposal', requireAuth, requireRole('player', 'admin'), async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    try {
      const { proposal, analysis, catalog } = await buildProposal({ supabase, repository, req, blockId: req.params.blockId, body: req.body });
      return res.json({ data: proposal, meta: { contract_version: '1.0', persisted: false,
        source: analysis.source, session_preferences_source: 'self_reported', catalog_source: catalog.source } });
    } catch (error) {
      return failure(res, next, error, 'No se pudo generar la propuesta. Intenta más tarde.');
    }
  });
  // A24 · Primera versión del plan del bloque (o la siguiente, si el bloque ya tiene plan).
  router.post('/:blockId/plans', requireAuth, requireRole('player', 'admin'), async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    try {
      return await saveVersion({ supabase, repository, req, res, blockId: req.params.blockId });
    } catch (error) {
      return failure(res, next, error, 'No se pudo guardar el plan. Intenta más tarde.');
    }
  });
  return router;
}

// A24 · /api/v1/plans. plan_id = análisis del bloque; cada versión es inmutable.
function createPlanVersionsRouter({ supabase, repository, requireAuth, requireRole }) {
  const router = express.Router();
  const guard = [requireAuth, requireRole('player', 'admin')];
  const notFound = () => new ApiError(404, 'RESOURCE_NOT_FOUND', 'El recurso no existe.');
  router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

  router.get('/:planId', guard, async (req, res, next) => {
    try {
      const plan = await plans.getPlanVersion(supabase, req.user.id, req.params.planId);
      if (!plan) throw notFound();
      return res.json({ data: plan, meta: { contract_version: CONTRACT_VERSION, persisted: true } });
    } catch (error) { return failure(res, next, error, 'No se pudo consultar el plan.'); }
  });

  router.get('/:planId/versions', guard, async (req, res, next) => {
    try {
      const versions = await plans.listPlanVersions(supabase, req.user.id, req.params.planId);
      if (!versions) throw notFound();
      return res.json({ data: versions, meta: { contract_version: CONTRACT_VERSION, persisted: true } });
    } catch (error) { return failure(res, next, error, 'No se pudo consultar el plan.'); }
  });

  router.get('/:planId/versions/:version', guard, async (req, res, next) => {
    try {
      const version = /^[1-9]\d{0,8}$/.test(req.params.version) ? Number(req.params.version) : null;
      const plan = version && await plans.getPlanVersion(supabase, req.user.id, req.params.planId, version);
      if (!plan) throw notFound();
      return res.json({ data: plan, meta: { contract_version: CONTRACT_VERSION, persisted: true } });
    } catch (error) { return failure(res, next, error, 'No se pudo consultar el plan.'); }
  });

  // Nuevo contexto (minutos, metas, rango/Workshop) sobre el mismo bloque → versión siguiente.
  // Otro bloque tiene otro análisis: se usa POST /api/v1/blocks/:blockId/plans (otro plan_id).
  router.post('/:planId/versions', guard, async (req, res, next) => {
    try {
      const lineage = await plans.getLineage(supabase, req.user.id, req.params.planId);
      if (!lineage) throw notFound();
      return await saveVersion({ supabase, repository, req, res, blockId: lineage.block_id });
    } catch (error) { return failure(res, next, error, 'No se pudo guardar el plan. Intenta más tarde.'); }
  });
  return router;
}

module.exports = { createPlansRouter, createPlanVersionsRouter, parseProposalInput, buildProposal };
