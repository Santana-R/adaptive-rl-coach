-- A38 · Instalación inicial en un proyecto Supabase de desarrollo VACÍO.
-- Ejecutar mediante psql desde cualquier directorio (\ir resuelve rutas relativas al archivo).
-- No es una actualización de la base existente. Si falla, detenerse y revisar el destino.
\set ON_ERROR_STOP on

DO $$
BEGIN
  IF to_regclass('auth.users') IS NULL THEN
    RAISE EXCEPTION 'Se necesita un proyecto Supabase provisionado con Auth';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public') THEN
    RAISE EXCEPTION 'El esquema public no está vacío; detener instalación inicial';
  END IF;
END $$;

\ir esquema-fase2.sql

-- Reproducir las restricciones de A08 también si el proyecto destino otorga permisos
-- por defecto al crear tablas. El destino acaba de instalar las 30 tablas de aplicación.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;
\ir migraciones/a08-auth.sql
\ir migraciones/a08-permisos-servidor.sql
\ir migraciones/a15-guardar-bloque.sql
\ir migraciones/a16-fix-cardinalidad.sql
\ir seeds/a23-catalogo.sql
\ir seeds/a24-reglas.sql
\ir migraciones/a16-objetivos.sql
\ir migraciones/a24-planes.sql
\ir migraciones/a21-sesiones.sql
\ir migraciones/a29-cambiar-estado-usuario.sql
\ir migraciones/a31-historial-sesiones.sql
\ir migraciones/a31-rangos.sql
\ir migraciones/a32-catalogo-admin.sql
\ir seeds/a26-reglas-v4.sql
\ir migraciones/a39-auditoria.sql
\ir migraciones/20261118200550_persistir_mediciones_proveedor.sql
\ir seeds/rutinas-nativas.sql

-- Estas consultas son comprobaciones, no pasos de migración.
DO $$
BEGIN
  IF (SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity) <> 30 OR
     (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') <> 30 THEN
    RAISE EXCEPTION 'Se esperaban 30 tablas de aplicación con RLS';
  END IF;
  IF EXISTS (SELECT 1 FROM public.a39_auditar_integridad() WHERE filas_invalidas <> 0) THEN
    RAISE EXCEPTION 'La auditoría de integridad de la instalación no pasó';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_privileges
      WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated', 'PUBLIC')) THEN
    RAISE EXCEPTION 'Existen permisos directos de cliente sobre tablas de aplicación';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger
      WHERE tgrelid = 'auth.users'::regclass AND tgname = 'tr_registrar_usuario_auth') THEN
    RAISE EXCEPTION 'Falta el trigger de alta de usuarios';
  END IF;
END $$;
SELECT count(*) AS tablas_con_rls FROM pg_tables WHERE schemaname = 'public' AND rowsecurity;
SELECT * FROM public.a39_auditar_integridad();
