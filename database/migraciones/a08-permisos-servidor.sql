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
