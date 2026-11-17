'use strict';

// /api/v1/exercises
//   A23: GET (jugador: activos; admin: ?include_inactive=true).
//   A32: GET /:id, POST, PATCH /:id, DELETE /:id solo para administrador.
// Los planes guardados apuntan a la versión exacta (plan_ejercicio): editar crea otra versión y
// desactivar o borrar no cambia sus snapshots.

const express = require('express');
const { ApiError, sendError, CONTRACT_VERSION } = require('../middleware/auth');
const { getCatalog } = require('../repositories/catalog');
const admin = require('../repositories/exercises-admin');
const { parseCreate, parseEdit } = require('../domain/exercise-admin');

const EFFECTS = {
  deactivated: 'El ejercicio se usó en planes: se desactivó y los planes guardados conservan su versión.',
  already_inactive: 'El ejercicio se usó en planes y ya estaba inactivo; se conserva.',
  deleted: 'El ejercicio nunca se usó en un plan y se eliminó del catálogo.',
};
const meta = extra => ({ contract_version: CONTRACT_VERSION, ...extra });
const notFound = () => new ApiError(404, 'RESOURCE_NOT_FOUND', 'El recurso no existe.');

function failure(res, next, error, message) {
  if (error instanceof ApiError) return next(error);
  return sendError(res, 503, 'PROVIDER_UNAVAILABLE', message);
}

function createExercisesRouter({ supabase, requireAuth, requireRole, catalogOptions }) {
  const router = express.Router();
  const adminOnly = [requireAuth, requireRole('admin'), (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }];

  // A23 · catálogo. El jugador recibe solo activos; el admin puede pedir ?include_inactive=true.
  router.get('/', requireAuth, async (req, res, next) => {
    try {
      const wantsInactive = req.query.include_inactive === 'true';
      if (wantsInactive && req.user.role !== 'admin') {
        throw new ApiError(403, 'ROLE_DENIED', 'Solo un administrador puede consultar ejercicios inactivos.');
      }
      const catalog = await getCatalog(supabase, { includeInactive: wantsInactive });
      res.json({ data: catalog, meta: { contract_version: CONTRACT_VERSION } });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:exerciseId', adminOnly, async (req, res, next) => {
    try {
      const exercise = await admin.getExercise(supabase, req.params.exerciseId, catalogOptions);
      if (!exercise) throw notFound();
      return res.json({ data: exercise, meta: meta() });
    } catch (error) { return failure(res, next, error, 'No se pudo consultar el ejercicio.'); }
  });

  router.post('/', adminOnly, async (req, res, next) => {
    try {
      const ficha = parseCreate(req.body);
      const saved = await admin.saveExercise(supabase, null, ficha, catalogOptions);
      res.set('Location', `/api/v1/exercises/${saved.exercise_id}`);
      return res.status(201).json({ data: saved, meta: meta({ version_created: true }) });
    } catch (error) { return failure(res, next, error, 'No se pudo guardar el ejercicio.'); }
  });

  router.patch('/:exerciseId', adminOnly, async (req, res, next) => {
    try {
      const current = await admin.getExercise(supabase, req.params.exerciseId, catalogOptions);
      if (!current) throw notFound();
      const edit = parseEdit(req.body, current.ficha);
      if (edit.kind === 'active') {
        const { exercise, changed } = await admin.setActive(supabase, req.params.exerciseId, edit.active, catalogOptions);
        return res.json({ data: exercise, meta: meta({ status_changed: changed }) });
      }
      if (!edit.changed) return res.json({ data: current, meta: meta({ version_created: false }) });
      const saved = await admin.saveExercise(supabase, current.exercise_id, edit.ficha, catalogOptions);
      return res.json({ data: saved, meta: meta({ version_created: true }) });
    } catch (error) { return failure(res, next, error, 'No se pudo guardar el ejercicio.'); }
  });

  router.delete('/:exerciseId', adminOnly, async (req, res, next) => {
    try {
      const effect = await admin.deleteExercise(supabase, req.params.exerciseId);
      return res.json({ data: { exercise_id: String(req.params.exerciseId), effect, message: EFFECTS[effect] }, meta: meta() });
    } catch (error) { return failure(res, next, error, 'No se pudo borrar el ejercicio.'); }
  });

  return router;
}

module.exports = { createExercisesRouter };
