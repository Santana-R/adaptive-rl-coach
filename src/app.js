const express = require('express');
const path = require('node:path');
const blocksRouter = require('./routes/blocks');
const { createAuth, sendError, ApiError, CONTRACT_VERSION } = require('./middleware/auth');
const { createServerClient } = require('./services/supabase');
const { getCatalog } = require('./repositories/catalog');

/**
 * Construye la aplicación. Recibe el cliente de Supabase para poder probarla
 * con un cliente simulado (tests/auth.test.cjs).
 */
function createApp({ supabase = createServerClient() } = {}) {
  const app = express();
  const { requireAuth } = createAuth(supabase);

  app.use(express.raw({
    type: request => request.headers['content-type']?.startsWith('multipart/form-data'),
    limit: '100mb'
  }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // A08 · usuario de la sesión verificada.
  app.get('/api/v1/me', requireAuth, (req, res) => {
    res.json({ id: req.user.id, role: req.user.role, status: req.user.status });
  });

  // A08 · prueba de propiedad: devuelve solo el perfil del usuario de la sesión.
  // No acepta un id de usuario en la petición. A15 añade PATCH y el resto del perfil.
  app.get('/api/v1/profile', requireAuth, async (req, res, next) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('id_usuario, plataforma, cuenta_juego_id, modalidad_principal, minutos_sesion')
        .eq('id_usuario', req.user.id)
        .maybeSingle();
      if (error) throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'No se pudo consultar el perfil.');
      if (!data) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'Todavía no tienes perfil.');
      res.json({
        id: data.id_usuario,
        role: req.user.role,
        status: req.user.status,
        platform: data.plataforma,
        player_id: data.cuenta_juego_id,
        mode: data.modalidad_principal,
        available_minutes: data.minutos_sesion,
      });
    } catch (err) {
      next(err);
    }
  });

  // A23 · catálogo. El jugador recibe solo activos; el admin puede pedir ?include_inactive=true.
  app.get('/api/v1/exercises', requireAuth, async (req, res, next) => {
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

  app.use('/api/v1/blocks', blocksRouter);
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use((err, _req, res, _next) => {
    if (err instanceof ApiError) return sendError(res, err.status, err.code, err.message);
    console.error(err);
    return sendError(res, 500, 'INTERNAL_ERROR', 'Error inesperado del servidor.');
  });

  return app;
}

const app = createApp();
module.exports = app;
module.exports.createApp = createApp;

if (require.main === module) {
  const host = '127.0.0.1';
  const port = Number(process.env.PORT ?? '3000');
  app.listen(port, host, () => {
    console.log(`Adaptive RL Coach en http://${host}:${port}`);
  });
}
