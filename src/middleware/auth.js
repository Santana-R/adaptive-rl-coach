'use strict';

// Autenticación y permisos de la API (A08).
// - La identidad sale solo del access token de Supabase Auth (Authorization: Bearer).
// - Rol y estado se leen en cada petición de public.usuarios; nunca de user_metadata
//   ni de lo que envíe el cliente.
// - La propiedad se decide con el id de la sesión verificada (req.user.id).

const CONTRACT_VERSION = '1.0';

// Valores guardados en la base → valores del contrato de la API.
const ROLE_TO_API = { jugador: 'player', administrador: 'admin' };
const STATUS_TO_API = { activo: 'active', suspendido: 'suspended' };

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function sendError(res, status, code, message) {
  res.status(status).json({
    error: { code, message },
    meta: { contract_version: CONTRACT_VERSION },
  });
}

function bearerToken(req) {
  const header = req.get('authorization') ?? '';
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

/**
 * Crea los middlewares de autenticación.
 * @param {object|null} supabase Cliente de servidor (clave service_role o secret).
 *   null cuando faltan las variables de entorno: las rutas protegidas responden 503.
 */
function createAuth(supabase) {
  async function requireAuth(req, res, next) {
    if (!supabase) {
      return sendError(res, 503, 'PROVIDER_UNAVAILABLE', 'La autenticación no está configurada en el servidor.');
    }

    const token = bearerToken(req);
    if (!token) {
      return sendError(res, 401, 'AUTH_REQUIRED', 'Inicia sesión para continuar.');
    }

    let authUser;
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        return sendError(res, 401, 'AUTH_REQUIRED', 'La sesión no es válida o expiró. Inicia sesión de nuevo.');
      }
      authUser = data.user;
    } catch {
      return sendError(res, 503, 'PROVIDER_UNAVAILABLE', 'No se pudo verificar la sesión. Intenta más tarde.');
    }

    const { data: row, error: dbError } = await supabase
      .from('usuarios')
      .select('id_usuario, rol, estado')
      .eq('id_usuario', authUser.id)
      .maybeSingle();

    if (dbError) {
      return sendError(res, 503, 'PROVIDER_UNAVAILABLE', 'No se pudo consultar la cuenta. Intenta más tarde.');
    }
    if (!row) {
      // Cuenta de Auth sin fila en usuarios: el trigger de registro no se aplicó.
      return sendError(res, 403, 'ROLE_DENIED', 'La cuenta no está registrada en la aplicación.');
    }
    if (row.estado !== 'activo') {
      return sendError(res, 403, 'USER_SUSPENDED', 'Tu cuenta está suspendida.');
    }

    req.user = {
      id: row.id_usuario,
      role: ROLE_TO_API[row.rol] ?? null,
      status: STATUS_TO_API[row.estado] ?? null,
    };
    return next();
  }

  /** Usar después de requireAuth. Ejemplo: requireRole('admin'). */
  function requireRole(...roles) {
    return (req, res, next) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return sendError(res, 403, 'ROLE_DENIED', 'No tienes permiso para esta operación.');
      }
      return next();
    };
  }

  return { requireAuth, requireRole };
}

/**
 * Política de propiedad para rutas de "Propietario": solo el dueño accede.
 * Un recurso ajeno responde igual que uno inexistente (404) para no revelar que existe.
 * Las rutas de administración usan requireRole('admin') en lugar de esta función.
 */
function assertOwner(req, ownerId) {
  if (!req.user || ownerId == null || String(ownerId) !== String(req.user.id)) {
    throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'El recurso no existe.');
  }
}

module.exports = {
  createAuth,
  assertOwner,
  sendError,
  ApiError,
  CONTRACT_VERSION,
  ROLE_TO_API,
  STATUS_TO_API,
};
