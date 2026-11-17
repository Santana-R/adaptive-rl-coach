'use strict';

const express = require('express');
const {
  ApiError,
  CONTRACT_VERSION,
  ROLE_TO_API,
  STATUS_TO_API,
} = require('../middleware/auth');

const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const STATUS_TO_DB = Object.fromEntries(
  Object.entries(STATUS_TO_API).map(([db, api]) => [api, db])
);

function toAdminUser(row) {
  return {
    id: row.id_usuario,
    name: row.nombre,
    role: ROLE_TO_API[row.rol] ?? null,
    status: STATUS_TO_API[row.estado] ?? null,
  };
}

function createAdminUsersRouter({ supabase, requireAuth, requireRole }) {
  const router = express.Router();

  router.use(requireAuth, requireRole('admin'), (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.get('/', async (_req, res) => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id_usuario, nombre, rol, estado')
      .order('nombre')
      .order('id_usuario');

    if (error) {
      throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'No se pudo consultar la lista de usuarios.');
    }

    return res.json({
      data: (data ?? []).map(toAdminUser),
      meta: { contract_version: CONTRACT_VERSION },
    });
  });

  router.patch('/:userId/status', async (req, res) => {
    const { userId } = req.params;
    if (!UUID.test(userId)) {
      throw new ApiError(400, 'INPUT_INVALID', 'El ID de usuario debe ser un UUID válido.');
    }

    const keys = Object.keys(req.body ?? {});
    const status = req.body?.status;
    if (keys.length !== 1 || keys[0] !== 'status' ||
        typeof status !== 'string' || !Object.hasOwn(STATUS_TO_DB, status)) {
      throw new ApiError(400, 'INPUT_INVALID', 'Envía solo status con el valor active o suspended.');
    }

    const { data, error } = await supabase
      .rpc('a29_cambiar_estado_usuario', {
        p_admin_id: req.user.id,
        p_user_id: userId,
        p_estado: STATUS_TO_DB[status],
      })
      .maybeSingle();

    if (error?.code === '42501' && error.message === 'Se requiere un administrador activo') {
      throw new ApiError(403, 'ROLE_DENIED', 'Se requiere un administrador activo.');
    }
    if (error) {
      throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'No se pudo cambiar el estado del usuario.');
    }
    if (!data) {
      throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'El usuario no existe.');
    }

    return res.json({
      data: toAdminUser(data),
      meta: { contract_version: CONTRACT_VERSION },
    });
  });

  return router;
}

module.exports = { createAdminUsersRouter };