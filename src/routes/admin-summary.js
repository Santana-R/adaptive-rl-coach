'use strict';

// A32 · GET /api/v1/admin/summary: conteos operativos para el Panel admin.
// Solo datos que existen hoy. Los indicadores de progreso (mejora entre bloques, metas cumplidas,
// rango) dependen de A22/A26 y se devuelven como pendientes, sin números inventados.

const express = require('express');
const { ApiError, CONTRACT_VERSION } = require('../middleware/auth');
const { getCatalog } = require('../repositories/catalog');

async function count(supabase, table, filters = {}) {
  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  for (const [column, value] of Object.entries(filters)) query = query.eq(column, value);
  const { count: n, error } = await query;
  if (error) throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'No se pudo consultar el resumen.');
  return n ?? 0;
}

function createAdminSummaryRouter({ supabase, requireAuth, requireRole }) {
  const router = express.Router();
  router.use(requireAuth, requireRole('admin'), (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

  router.get('/', async (_req, res, next) => {
    try {
      const { data: users, error } = await supabase.from('usuarios').select('rol, estado');
      if (error) throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'No se pudo consultar el resumen.');
      const catalog = await getCatalog(supabase, { includeInactive: true });
      const exercises = catalog.exercises;
      const [needsCorrection, waitingService, processing, ready, plans, activeGoals] = await Promise.all([
        count(supabase, 'bloques', { estado: 'requiere_correccion' }),
        count(supabase, 'bloques', { estado: 'espera_servicio' }),
        count(supabase, 'bloques', { estado: 'procesando' }),
        count(supabase, 'bloques', { estado: 'completo' }),
        count(supabase, 'planes'),
        count(supabase, 'objetivos', { estado: 'activo' }),
      ]);
      const list = users ?? [];
      return res.json({
        data: {
          users: {
            total: list.length,
            active: list.filter(u => u.estado === 'activo').length,
            suspended: list.filter(u => u.estado === 'suspendido').length,
            admins: list.filter(u => u.rol === 'administrador').length,
            players: list.filter(u => u.rol === 'jugador').length,
          },
          catalog: {
            total: exercises.length,
            active: exercises.filter(e => e.active).length,
            inactive: exercises.filter(e => !e.active).length,
            verified: exercises.filter(e => e.technical_review_status === 'verified').length,
            offered: exercises.filter(e => e.active && e.technical_review_status === 'verified').length,
          },
          blocks: { needs_correction: needsCorrection, waiting_service: waitingService, processing, ready },
          plans: { saved_versions: plans },
          goals: { active: activeGoals },
          progress: { status: 'pending', depends_on: ['A22', 'A26'],
            message: 'La mejora entre bloques, las metas cumplidas y el rango se calculan en reportes (A22) y calibración (A26).' },
        },
        meta: { contract_version: CONTRACT_VERSION, generated_at: new Date().toISOString() },
      });
    } catch (error) {
      return next(error instanceof ApiError ? error : new ApiError(503, 'PROVIDER_UNAVAILABLE', 'No se pudo consultar el resumen.'));
    }
  });
  return router;
}

module.exports = { createAdminSummaryRouter };
