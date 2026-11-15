-- A08 · Registro de cuentas y permisos de datos.
-- Se ejecuta UNA vez en el SQL Editor de Supabase sobre la base existente (30 tablas).
-- No crea, modifica ni borra tablas. Se puede volver a ejecutar sin duplicar nada.
--
-- Qué hace:
-- 1. Cada cuenta nueva de Supabase Auth (correo o Google) crea su fila en public.usuarios
--    SIEMPRE con rol 'jugador' y estado 'activo'. El rol nunca se toma de los datos del
--    registro (user_metadata), así que el registro público no puede crear administradores.
-- 2. Crea la fila que falte para cuentas de Auth que ya existían antes de esta migración.
--
-- Política de acceso (sin cambios de permisos en esta migración):
-- - Las 30 tablas ya tienen RLS activado y NINGUNA política. Con la clave pública
--   (anon/publishable), el navegador no puede leer ni escribir ninguna tabla directamente,
--   tampoco las de otro usuario.
-- - Todo acceso a datos pasa por Express con la clave privada del servidor; Express verifica
--   el token, consulta rol/estado en public.usuarios y filtra por el id de la sesión
--   (src/middleware/auth.js).
-- - Un administrador se asigna a mano desde el SQL Editor (ver docs/prueba-auth.md).

BEGIN;

CREATE OR REPLACE FUNCTION arc_private.registrar_usuario_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.usuarios (id_usuario, nombre, rol, estado)
  VALUES (
    NEW.id,
    left(coalesce(
      nullif(btrim(NEW.raw_user_meta_data ->> 'full_name'), ''),
      nullif(btrim(NEW.raw_user_meta_data ->> 'name'), ''),
      nullif(btrim(split_part(NEW.email, '@', 1)), ''),
      'Jugador'
    ), 100),
    'jugador',   -- fijo: el registro público nunca asigna administrador
    'activo'
  )
  ON CONFLICT (id_usuario) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION arc_private.registrar_usuario_auth() FROM PUBLIC;
-- Supabase inserta en auth.users con el rol supabase_auth_admin.
GRANT USAGE ON SCHEMA arc_private TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION arc_private.registrar_usuario_auth() TO supabase_auth_admin;

DROP TRIGGER IF EXISTS tr_registrar_usuario_auth ON auth.users;
CREATE TRIGGER tr_registrar_usuario_auth
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION arc_private.registrar_usuario_auth();

-- Cuentas de Auth creadas antes de esta migración.
INSERT INTO public.usuarios (id_usuario, nombre, rol, estado)
SELECT
  u.id,
  left(coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
    nullif(btrim(split_part(u.email, '@', 1)), ''),
    'Jugador'
  ), 100),
  'jugador',
  'activo'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.usuarios p WHERE p.id_usuario = u.id);

COMMIT;

-- Comprobación (ejecutar aparte después de la migración):
--   SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass AND tgname = 'tr_registrar_usuario_auth';
--   SELECT count(*) AS sin_fila FROM auth.users u
--     WHERE NOT EXISTS (SELECT 1 FROM public.usuarios p WHERE p.id_usuario = u.id);   -- esperado: 0
--   SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity;  -- esperado: ninguna
--   SELECT count(*) FROM pg_policies WHERE schemaname = 'public';                     -- esperado: 0
