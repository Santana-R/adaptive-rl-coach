-- A16 · Objetivos con historial.
-- Se ejecuta UNA vez en el SQL Editor de Supabase, después de database/seeds/a24-reglas.sql
-- (que carga shooting_pct). Se puede volver a ejecutar.
--
-- Qué hace:
--   1. Métrica de entrenamiento training_minutes (minutos declarados en sesiones, A21/A22).
--   2. Índice único parcial: una meta ACTIVA por usuario, modalidad y tipo
--      (meta principal de rendimiento + meta opcional de entrenamiento).
--   3. a16_guardar_version: crea una meta (versión 1) o agrega la versión siguiente al editarla.
--      La versión anterior no se modifica; la nueva queda activada en el mismo momento.
--   4. a16_borrar_objetivo: si alguna versión está en plan_objetivo o evaluaciones_objetivo,
--      archiva la meta (no borra versiones); si no está enlazada, la borra.
--   5. Trigger que impide UPDATE en objetivo_versiones: el historial no se reescribe.
--
-- Permisos: solo service_role (Express). El propietario sale de la sesión verificada.
--
-- Errores (SQLSTATE → Express):
--   P0002 meta inexistente o ajena               → 404
--   23505 ya hay una meta activa de ese tipo      → 409 GOAL_ACTIVE_EXISTS
--   A1601 la meta está archivada (no se edita)    → 409 GOAL_ARCHIVED
--   A1602 métrica no cargada o de otro tipo       → 422 / 503

-- 1) Métrica de entrenamiento --------------------------------------------------------
INSERT INTO public.metricas (codigo, unidad, tipo, descripcion)
VALUES ('training_minutes', 'minutes', 'entrenamiento', 'Minutos de entrenamiento declarados en sesiones dentro del periodo de la meta.')
ON CONFLICT (codigo) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.metricas WHERE codigo = 'training_minutes' AND unidad = 'minutes' AND tipo = 'entrenamiento') THEN
    RAISE EXCEPTION 'La métrica training_minutes ya existe con otra unidad o tipo';
  END IF;
END $$;

-- 2) Una meta activa por usuario, modalidad y tipo ----------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_objetivos_activo_tipo
  ON public.objetivos (id_usuario, modalidad, tipo) WHERE estado = 'activo';

-- 3) Crear / editar (versión siguiente) ----------------------------------------------
-- p_id_objetivo NULL = crear. p_meta:
--   { tipo, modalidad (solo al crear), metric_key, nombre, comparador, valor_meta,
--     fecha_inicio, fecha_limite, zona_horaria }
-- Devuelve { id_objetivo, id_objetivo_version, version }
CREATE OR REPLACE FUNCTION public.a16_guardar_version(p_id_usuario uuid, p_id_objetivo bigint, p_meta jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_objetivo bigint := p_id_objetivo;
  v_tipo     text;
  v_estado   text;
  v_metrica  bigint;
  v_version  integer;
  v_id_ver   bigint;
BEGIN
  IF p_id_usuario IS NULL THEN
    RAISE EXCEPTION 'Falta el propietario' USING ERRCODE = '22004';
  END IF;

  IF v_objetivo IS NULL THEN
    v_tipo := p_meta->>'tipo';
    INSERT INTO objetivos (id_usuario, tipo, modalidad, estado, archivado_en)
    VALUES (p_id_usuario, v_tipo, p_meta->>'modalidad', 'activo', NULL)
    RETURNING id_objetivo INTO v_objetivo;
  ELSE
    -- FOR UPDATE serializa dos ediciones de la misma meta (versión siguiente).
    SELECT tipo, estado INTO v_tipo, v_estado FROM objetivos
     WHERE id_objetivo = v_objetivo AND id_usuario = p_id_usuario FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Meta inexistente o ajena' USING ERRCODE = 'P0002';
    END IF;
    IF v_estado = 'archivado' THEN
      RAISE EXCEPTION 'La meta está archivada' USING ERRCODE = 'A1601';
    END IF;
  END IF;

  SELECT id_metrica INTO v_metrica FROM metricas WHERE codigo = p_meta->>'metric_key' AND tipo = v_tipo;
  IF v_metrica IS NULL THEN
    RAISE EXCEPTION 'Métrica % no cargada para metas de %', p_meta->>'metric_key', v_tipo USING ERRCODE = 'A1602';
  END IF;

  SELECT COALESCE(max(version), 0) + 1 INTO v_version FROM objetivo_versiones WHERE id_objetivo = v_objetivo;

  INSERT INTO objetivo_versiones (id_objetivo, id_metrica, id_bloque_base, version, nombre, comparador, valor_meta,
                                  fecha_inicio, fecha_limite, zona_horaria, activada_en)
  VALUES (
    v_objetivo, v_metrica, NULL, v_version,
    p_meta->>'nombre',
    p_meta->>'comparador',
    (p_meta->>'valor_meta')::numeric,
    (p_meta->>'fecha_inicio')::date,
    (p_meta->>'fecha_limite')::date,
    p_meta->>'zona_horaria',
    now()
  )
  RETURNING id_objetivo_version INTO v_id_ver;

  RETURN jsonb_build_object('id_objetivo', v_objetivo, 'id_objetivo_version', v_id_ver, 'version', v_version);
END;
$$;

REVOKE ALL ON FUNCTION public.a16_guardar_version(uuid, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.a16_guardar_version(uuid, bigint, jsonb) TO service_role;

-- 4) Borrar o archivar ----------------------------------------------------------------
-- Devuelve 'archived' (enlazada, se archiva), 'already_archived' o 'deleted' (sin enlaces).
CREATE OR REPLACE FUNCTION public.a16_borrar_objetivo(p_id_usuario uuid, p_id_objetivo bigint)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_estado text;
  v_enlazada boolean;
BEGIN
  SELECT estado INTO v_estado FROM objetivos
   WHERE id_objetivo = p_id_objetivo AND id_usuario = p_id_usuario FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Meta inexistente o ajena' USING ERRCODE = 'P0002';
  END IF;

  SELECT EXISTS (
           SELECT 1 FROM plan_objetivo po JOIN objetivo_versiones ov USING (id_objetivo_version)
            WHERE ov.id_objetivo = p_id_objetivo)
      OR EXISTS (
           SELECT 1 FROM evaluaciones_objetivo eo JOIN objetivo_versiones ov USING (id_objetivo_version)
            WHERE ov.id_objetivo = p_id_objetivo)
    INTO v_enlazada;

  IF v_enlazada THEN
    IF v_estado = 'archivado' THEN
      RETURN 'already_archived';
    END IF;
    UPDATE objetivos SET estado = 'archivado', archivado_en = now() WHERE id_objetivo = p_id_objetivo;
    RETURN 'archived';
  END IF;

  DELETE FROM objetivo_versiones WHERE id_objetivo = p_id_objetivo;
  DELETE FROM objetivos WHERE id_objetivo = p_id_objetivo;
  RETURN 'deleted';
END;
$$;

REVOKE ALL ON FUNCTION public.a16_borrar_objetivo(uuid, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.a16_borrar_objetivo(uuid, bigint) TO service_role;

-- 5) Historial inmutable ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.a16_impedir_update_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Las versiones de una meta no se modifican; edita la meta para crear una versión nueva'
    USING ERRCODE = '55000';
END;
$$;

DROP TRIGGER IF EXISTS a16_inmutable ON public.objetivo_versiones;
CREATE TRIGGER a16_inmutable BEFORE UPDATE ON public.objetivo_versiones
  FOR EACH ROW EXECUTE FUNCTION public.a16_impedir_update_version();

-- Comprobaciones (ejecutar aparte):
--   SELECT codigo, unidad, tipo FROM metricas ORDER BY codigo;
--   Esperado: incluye training_minutes | minutes | entrenamiento.
--
--   SELECT p.proname,
--          has_function_privilege('service_role',  p.oid, 'EXECUTE') AS service_role,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND p.proname IN ('a16_guardar_version', 'a16_borrar_objetivo');
--   Esperado: service_role = true, authenticated = false.
