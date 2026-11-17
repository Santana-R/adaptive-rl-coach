'use strict';

// A16 · /api/v1/goals. El propietario siempre es el usuario de la sesión (A08).
// Editar crea una versión nueva; borrar archiva si la meta ya está en un plan o evaluación.

const express = require('express');
const { ApiError, sendError, CONTRACT_VERSION } = require('../middleware/auth');
const { getProfile } = require('../repositories/profile');
const goals = require('../repositories/goals');
const { parseCreate, parseEdit, todayIn, MODES } = require('../domain/goals');

const DEFAULT_TZ = 'America/Monterrey';
const EFFECTS = {
  archived: 'La meta está vinculada a un plan o evaluación: se archivó y su historial se conserva.',
  already_archived: 'La meta ya estaba archivada; su historial se conserva.',
  deleted: 'La meta no estaba vinculada a ningún plan ni evaluación y se borró.',
};
const meta = extra => ({ contract_version: CONTRACT_VERSION, ...extra });
const notFound = () => new ApiError(404, 'RESOURCE_NOT_FOUND', 'El recurso no existe.');

function failure(res, next, error, message) {
  if (error instanceof ApiError) return next(error);
  return sendError(res, 503, 'PROVIDER_UNAVAILABLE', message);
}

function createGoalsRouter({ supabase, requireAuth, requireRole }) {
  const router = express.Router();
  router.use(requireAuth, requireRole('player', 'admin'), (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

  router.get('/', async (req, res, next) => {
    try {
      const status = req.query.status ?? 'active';
      const mode = req.query.mode;
      if (!['active', 'archived', 'all'].includes(status) || (mode !== undefined && !MODES.includes(mode))) {
        throw new ApiError(400, 'INPUT_INVALID', 'Filtros válidos: status=active|archived|all y mode=1v1|2v2|3v3.');
      }
      const data = await goals.listGoals(supabase, req.user.id, { status, mode });
      return res.json({ data, meta: meta() });
    } catch (error) { return failure(res, next, error, 'No se pudieron consultar las metas.'); }
  });

  router.post('/', async (req, res, next) => {
    try {
      const profile = await getProfile(supabase, req.user.id);
      const timezone = profile?.timezone || DEFAULT_TZ;
      const goal = parseCreate(req.body, { today: todayIn(timezone) });
      const saved = await goals.saveGoalVersion(supabase, req.user.id, null, goal, timezone);
      res.set('Location', `/api/v1/goals/${saved.goal_id}`);
      return res.status(201).json({ data: saved, meta: meta({ version_created: true }) });
    } catch (error) { return failure(res, next, error, 'No se pudo guardar la meta.'); }
  });

  router.get('/:goalId', async (req, res, next) => {
    try {
      const goal = await goals.getGoal(supabase, req.user.id, req.params.goalId);
      if (!goal) throw notFound();
      return res.json({ data: goal, meta: meta() });
    } catch (error) { return failure(res, next, error, 'No se pudo consultar la meta.'); }
  });

  router.patch('/:goalId', async (req, res, next) => {
    try {
      const current = await goals.getGoal(supabase, req.user.id, req.params.goalId);
      if (!current) throw notFound();
      if (current.status !== 'active') throw new ApiError(409, 'GOAL_ARCHIVED', 'La meta está archivada y no se puede editar.');
      const { goal, changed } = parseEdit(req.body, current);
      if (!changed) return res.json({ data: current, meta: meta({ version_created: false }) });
      const profile = await getProfile(supabase, req.user.id);
      const saved = await goals.saveGoalVersion(supabase, req.user.id, current.goal_id, goal, profile?.timezone || current.timezone || DEFAULT_TZ);
      return res.json({ data: saved, meta: meta({ version_created: true }) });
    } catch (error) { return failure(res, next, error, 'No se pudo guardar la meta.'); }
  });

  router.delete('/:goalId', async (req, res, next) => {
    try {
      const effect = await goals.deleteGoal(supabase, req.user.id, req.params.goalId);
      return res.json({ data: { goal_id: String(req.params.goalId), effect, message: EFFECTS[effect] }, meta: meta() });
    } catch (error) { return failure(res, next, error, 'No se pudo borrar la meta.'); }
  });

  return router;
}

module.exports = { createGoalsRouter };
