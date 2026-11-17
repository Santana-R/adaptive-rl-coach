const express = require('express');
const path = require('node:path');
const blocksRouter = require('./routes/blocks');
const { createAuth, sendError, ApiError, CONTRACT_VERSION } = require('./middleware/auth');
const { createServerClient } = require('./services/supabase');
const profiles = require('./repositories/profile');
const {
  validate: validateProfile
} = require('../public/sitio/js/profile-validation');
const { createExercisesRouter } = require('./routes/exercises');
const { createAdminSummaryRouter } = require('./routes/admin-summary');
const { createAnalysisRouter, createAnalysisDemoRouter } = require('./routes/analysis');
const { createStoredAnalysisRepository } = require('./services/stored-block');
const { createAdminUsersRouter } = require('./routes/admin-users');
const { createPlansRouter, createPlanVersionsRouter } = require('./routes/plans');
const { createGoalsRouter } = require('./routes/goals');
const { createSessionsRouter } = require('./routes/sessions');
const { createRankHistoryRouter } = require('./routes/ranks');
const { createReportsRouter } = require('./routes/reports');
/**
 * Construye la aplicación. Recibe el cliente de Supabase para poder probarla
 * con un cliente simulado (tests/auth.test.cjs).
 */
function createApp({ supabase = createServerClient(), analysisRepository, enableAnalysisDemo = false, enableBlocksDemo = false, catalogOptions } = {}) {
  const app = express();
  const { requireAuth, requireRole } = createAuth(supabase);
  const repository = analysisRepository === undefined ? createStoredAnalysisRepository(supabase) : analysisRepository;

  app.use(express.json({ limit: '1mb' }));

  app.use('/api/v1/admin/users', createAdminUsersRouter({
  supabase,
  requireAuth,
  requireRole,
}));

app.use('/api/v1/sessions', createSessionsRouter({ supabase, requireAuth, requireRole }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // A08 · usuario de la sesión verificada.
  app.get('/api/v1/me', requireAuth, (req, res) => {
    res.json({ id: req.user.id, role: req.user.role, status: req.user.status });
  });

  // A08 · prueba de propiedad: devuelve solo el perfil del usuario de la sesión.
  // No acepta un id de usuario en la petición. A15 añade PATCH y el resto del perfil.
  // Consultar el perfil del usuario autenticado.
app.get('/api/v1/profile', requireAuth, async (req, res, next) => {
  try {
    const profile = await profiles.getProfile(
      supabase,
      req.user.id
    );

    if (!profile) {
      throw new ApiError(
        404,
        'RESOURCE_NOT_FOUND',
        'Todavía no tienes perfil.'
      );
    }

    res.json({
      ...profile,
      role: req.user.role,
      status: req.user.status
    });
  } catch (error) {
    next(error);
  }
});

// Crear o actualizar el perfil del usuario autenticado.
// Recibe todos los campos editables del formulario.
app.patch('/api/v1/profile', requireAuth, async (req, res, next) => {
  try {
    const result = validateProfile(req.body);

    if (!result.valid) {
      return res.status(422).json({
        error: {
          code: 'INPUT_INVALID',
          message: 'Revisa los campos del perfil.',
          details: result.errors
        },
        meta: {
          contract_version: '1.0'
        }
      });
    }

    const profile = await profiles.saveProfile(
      supabase,
      req.user.id,
      result.data
    );

    res.json({
      ...profile,
      role: req.user.role,
      status: req.user.status
    });
  } catch (error) {
    next(error);
  }
});

  // A23 · catálogo (GET) y A32 · CRUD administrativo.
  app.use('/api/v1/exercises', createExercisesRouter({ supabase, requireAuth, requireRole, catalogOptions }));
  app.use('/api/v1/admin/summary', createAdminSummaryRouter({ supabase, requireAuth, requireRole }));

  app.use('/api/v1/blocks', createAnalysisRouter({ requireAuth, requireRole, repository }));
  app.use('/api/v1/blocks', createPlansRouter({ supabase, requireAuth, requireRole, repository }));
  app.use('/api/v1/plans', createPlanVersionsRouter({ supabase, requireAuth, requireRole, repository }));
  app.use('/api/v1/goals', createGoalsRouter({ supabase, requireAuth, requireRole }));
  app.use('/api/v1/rank-history', createRankHistoryRouter({ supabase, requireAuth, requireRole }));
  app.use('/api/v1/reports', createReportsRouter({ supabase, repository, requireAuth, requireRole }));
  app.use('/api/v1/demo/analysis', createAnalysisDemoRouter({ enabled: enableAnalysisDemo }));
    app.use('/api/v1/blocks', enableBlocksDemo && !supabase
      ? blocksRouter
      : blocksRouter.createPrivateBlocksRouter({ supabase, requireAuth }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use((err, _req, res, _next) => {
    if (err instanceof ApiError) return sendError(res, err.status, err.code, err.message);
    console.error('[INTERNAL_ERROR] Error inesperado del servidor.');
    return sendError(res, 500, 'INTERNAL_ERROR', 'Error inesperado del servidor.');
  });

  return app;
}

const app = createApp({ enableAnalysisDemo: process.env.ANALYSIS_DEMO_ENABLED === 'true' });
module.exports = app;
module.exports.createApp = createApp;

if (require.main === module) {
  const host = '127.0.0.1';
  const port = Number(process.env.PORT ?? '3000');
  app.listen(port, host, () => {
    console.log(`Adaptive RL Coach en http://${host}:${port}`);
  });
}
