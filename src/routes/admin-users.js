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

function toAdminUser(row, authUser) {
  return {
    id: row.id_usuario,
    name: row.nombre,
    role: ROLE_TO_API[row.rol] ?? null,
    status: STATUS_TO_API[row.estado] ?? null,
    // A32 · correo y último acceso desde Supabase Auth (solo el servidor, con la clave privada).
    ...(authUser !== undefined ? {
      email: authUser?.email ?? null,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
    } : {}),
  };
}

// A32 · Usuarios de Supabase Auth por id. Si la consulta no está disponible, la lista sigue
// respondiendo sin correo/último acceso (meta.auth_details = false) en vez de fallar.
async function authUsersById(supabase) {
  if (typeof supabase?.auth?.admin?.listUsers !== 'function') return null;
  const byId = new Map();
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return null;
    for (const user of data?.users ?? []) byId.set(user.id, user);
    if ((data?.users ?? []).length < 200) break;
  }
  return byId;
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

    const authUsers = await authUsersById(supabase);
    return res.json({
      data: (data ?? []).map(row => authUsers ? toAdminUser(row, authUsers.get(row.id_usuario) ?? null) : toAdminUser(row)),
      meta: { contract_version: CONTRACT_VERSION, auth_details: Boolean(authUsers) },
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
    // A32 · Un administrador no cambia su propio estado: suspenderse lo dejaría sin acceso.
    if (userId.toLowerCase() === String(req.user.id).toLowerCase()) {
      throw new ApiError(409, 'SELF_STATUS_CHANGE', 'No puedes cambiar el estado de tu propia cuenta.');
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