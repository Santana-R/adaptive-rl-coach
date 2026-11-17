-- A32 · CRUD administrativo del catálogo (ejercicios, ejercicio_versiones, ejercicio_plataforma).
-- Se ejecuta UNA vez en el SQL Editor de Supabase, después de database/seeds/a23-catalogo.sql.
-- Se puede volver a ejecutar.
--
-- Qué hace:
--   1. a32_guardar_ejercicio: crea un ejercicio (versión 1) o agrega la versión siguiente al editarlo,
--      con sus plataformas, en una transacción. El ejercicio queda INACTIVO (borrador): activarlo
--      requiere que la versión vigente coincida con una ficha revisada y verificada (lo comprueba
--      Express con el mismo criterio que el generador, src/domain/catalog.js).
--   2. a32_borrar_ejercicio: si alguna versión está en plan_ejercicio, solo lo desactiva (los planes
--      guardados conservan su versión y snapshot); si nunca se usó, lo marca eliminado (eliminado_en).
--   3. Trigger que impide UPDATE en ejercicio_versiones y ejercicio_plataforma: una versión publicada
--      no se reescribe; editar crea otra.
--
-- Permisos: solo service_role (Express). La ruta exige rol administrador (A08).
--
-- Errores (SQLSTATE → Express):
--   P0002 ejercicio inexistente o eliminado → 404

-- 1) Crear / nueva versión ------------------------------------------------------------
-- p_ficha: { nombre, categoria, tipo_recurso, codigo_enlace, finalidad, instrucciones, meta,
--            dificultad_base, minutos_base, plataformas: ['epic','steam'] }
-- Devuelve { id_ejercicio, id_ejercicio_version, version }
CREATE OR REPLACE FUNCTION public.a32_guardar_ejercicio(p_id_ejercicio bigint, p_ficha jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_ejercicio bigint := p_id_ejercicio;
  v_version   integer;
  v_id_ver    bigint;
BEGIN
  IF v_ejercicio IS NULL THEN
    INSERT INTO ejercicios (activo, eliminado_en) VALUES (false, NULL) RETURNING id_ejercicio INTO v_ejercicio;
  ELSE
    -- FOR UPDATE serializa dos ediciones del mismo ejercicio (versión siguiente).
    PERFORM 1 FROM ejercicios WHERE id_ejercicio = v_ejercicio AND eliminado_en IS NULL FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Ejercicio inexistente o eliminado' USING ERRCODE = 'P0002';
    END IF;
    -- Una versión nueva todavía no está revisada: vuelve a borrador.
    UPDATE ejercicios SET activo = false WHERE id_ejercicio = v_ejercicio;
  END IF;

  SELECT COALESCE(max(version), 0) + 1 INTO v_version FROM ejercicio_versiones WHERE id_ejercicio = v_ejercicio;

  INSERT INTO ejercicio_versiones (id_ejercicio, version, nombre, categoria, tipo_recurso, codigo_enlace,
                                   finalidad, instrucciones, meta, dificultad_base, minutos_base)
  VALUES (
    v_ejercicio, v_version,
    p_ficha->>'nombre',
    p_ficha->>'categoria',
    p_ficha->>'tipo_recurso',
    p_ficha->>'codigo_enlace',
    p_ficha->>'finalidad',
    p_ficha->>'instrucciones',
    p_ficha->>'meta',
    (p_ficha->>'dificultad_base')::smallint,
    (p_ficha->>'minutos_base')::smallint
  )
  RETURNING id_ejercicio_version INTO v_id_ver;

  INSERT INTO ejercicio_plataforma (id_ejercicio_version, plataforma)
  SELECT v_id_ver, value FROM jsonb_array_elements_text(COALESCE(p_ficha->'plataformas', '[]'::jsonb));

  RETURN jsonb_build_object('id_ejercicio', v_ejercicio, 'id_ejercicio_version', v_id_ver, 'version', v_version);
END;
$$;

REVOKE ALL ON FUNCTION public.a32_guardar_ejercicio(bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.a32_guardar_ejercicio(bigint, jsonb) TO service_role;

-- 2) Borrar o desactivar --------------------------------------------------------------
-- Devuelve 'deactivated' (usado en planes), 'already_inactive' (usado y ya inactivo) o 'deleted'.
CREATE OR REPLACE FUNCTION public.a32_borrar_ejercicio(p_id_ejercicio bigint)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_activo boolean;
BEGIN
  SELECT activo INTO v_activo FROM ejercicios WHERE id_ejercicio = p_id_ejercicio AND eliminado_en IS NULL FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ejercicio inexistente o eliminado' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (SELECT 1 FROM plan_ejercicio pe JOIN ejercicio_versiones ev USING (id_ejercicio_version)
              WHERE ev.id_ejercicio = p_id_ejercicio) THEN
    IF NOT v_activo THEN
      RETURN 'already_inactive';
    END IF;
    UPDATE ejercicios SET activo = false WHERE id_ejercicio = p_id_ejercicio;
    RETURN 'deactivated';
  END IF;

  -- ck_ejercicios_baja: un ejercicio eliminado no puede estar activo.
  UPDATE ejercicios SET activo = false, eliminado_en = now() WHERE id_ejercicio = p_id_ejercicio;
  RETURN 'deleted';
END;
$$;

REVOKE ALL ON FUNCTION public.a32_borrar_ejercicio(bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.a32_borrar_ejercicio(bigint) TO service_role;

-- 3) Versiones inmutables ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.a32_impedir_update_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Las versiones de un ejercicio no se modifican; edítalo para crear una versión nueva'
    USING ERRCODE = '55000';
END;
$$;

DROP TRIGGER IF EXISTS a32_inmutable ON public.ejercicio_versiones;
CREATE TRIGGER a32_inmutable BEFORE UPDATE ON public.ejercicio_versiones
  FOR EACH ROW EXECUTE FUNCTION public.a32_impedir_update_version();
DROP TRIGGER IF EXISTS a32_inmutable ON public.ejercicio_plataforma;
CREATE TRIGGER a32_inmutable BEFORE UPDATE ON public.ejercicio_plataforma
  FOR EACH ROW EXECUTE FUNCTION public.a32_impedir_update_version();

-- Comprobación (ejecutar aparte):
--   SELECT p.proname, has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND p.proname IN ('a32_guardar_ejercicio', 'a32_borrar_ejercicio');
--   Esperado: service_role = true, authenticated = false.
