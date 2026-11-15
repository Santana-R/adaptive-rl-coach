# Migración A08 · registro de cuentas

Copia en texto de lo que se pega en Supabase → **SQL Editor**. El archivo ejecutable es [`a08-auth.sql`](a08-auth.sql). Si se cambia, actualizar también esta copia.

## Cómo aplicarla

1. Abrir el proyecto en Supabase → **SQL Editor** → *New query*.
2. Pegar **el contenido** del bloque de abajo, no la ruta del archivo.
3. Pulsar **Run**. Resultado esperado: *Success. No rows returned*.
4. Ejecutar las comprobaciones en otra pestaña y guardar una captura para el PR.

No crea, modifica ni borra tablas. Se puede volver a ejecutar sin duplicar nada.

## SQL de la migración

```sql
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
```

## Comprobaciones

```sql
SELECT tgname FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass AND tgname = 'tr_registrar_usuario_auth';
SELECT count(*) AS sin_fila FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM public.usuarios p WHERE p.id_usuario = u.id);
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity;
SELECT count(*) FROM pg_policies WHERE schemaname = 'public';
```

| Consulta | Esperado |
| --- | --- |
| Trigger | Una fila: `tr_registrar_usuario_auth` |
| `sin_fila` | `0` |
| Tablas sin RLS | Ninguna fila |
| Políticas en `public` | `0` |

## Segunda migración: permisos del servidor

Archivo ejecutable: [`a08-permisos-servidor.sql`](a08-permisos-servidor.sql). Se aplica después de la primera, igual: pegar el contenido en el SQL Editor y pulsar **Run**.

Hace falta porque en este proyecto `service_role` (la clave secreta del servidor) no tenía `SELECT` en las tablas. Express respondía **503** con tokens válidos (`permission denied for table usuarios`). No da permisos a `anon` ni a `authenticated`.

```sql
-- A08 · Permisos del servidor (Express) sobre las tablas.
-- Se ejecuta UNA vez en el SQL Editor de Supabase, después de a08-auth.sql.
-- No crea, modifica ni borra tablas ni filas. Se puede volver a ejecutar.
--
-- Por qué: en este proyecto service_role solo tenía REFERENCES/TRIGGER/TRUNCATE
-- (ver database/esquema-fase2.sql), así que Express no podía leer public.usuarios
-- y respondía 503 aunque el token fuera válido ("permission denied for table usuarios").
--
-- Qué hace: da a service_role (la clave secreta, que solo vive en el servidor)
-- lectura y escritura en las tablas de public y uso de sus secuencias (columnas identity).
-- NO da permisos a anon ni a authenticated: el navegador sigue sin acceso directo a
-- ninguna tabla ("permission denied"), y además RLS sigue activado y sin políticas.

BEGIN;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

COMMIT;

-- Comprobación (ejecutar aparte):
--   SELECT grantee, privilege_type, count(*) AS tablas
--   FROM information_schema.role_table_grants
--   WHERE table_schema = 'public' AND grantee IN ('service_role', 'authenticated', 'anon')
--     AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
--   GROUP BY grantee, privilege_type ORDER BY grantee, privilege_type;
--   Esperado: service_role con 30 tablas en cada privilegio. Si aparecen filas de anon o
--   authenticated, revisarlas: el navegador no debe tener acceso directo a las tablas.
```

## Errores comunes

- `syntax error at or near "database"`: se pegó la ruta del archivo en lugar de su contenido.
- Aviso *Potential issue detected / destructive operations*: lo provocan `DROP TRIGGER IF EXISTS` y `REVOKE`. Solo afectan al trigger y la función de esta migración; se puede confirmar.
- La API responde 503 con un token válido: falta aplicar `a08-permisos-servidor.sql`.

Siguiente paso: [prueba de autenticación](../../docs/prueba-auth.md).
