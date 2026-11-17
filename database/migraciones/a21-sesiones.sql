-- A21 · Sesiones de entrenamiento declaradas por el jugador.
-- Requiere a08-permisos-servidor.sql, a16-fix-cardinalidad.sql y a24-planes.sql.
BEGIN;

-- Si el jugador omite la dificultad, se guarda como dato ausente.
ALTER TABLE public.sesion_versiones
  ALTER COLUMN dificultad_percibida DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.a21_crear_sesion(
  p_id_usuario uuid,
  p_id_plan bigint,
  p_id_plan_ejercicio bigint,
  p_fecha_practica timestamptz,
  p_minutos integer,
  p_notas text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_sesion bigint;
  v_version bigint;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.planes AS p
    JOIN public.analisis AS a ON a.id_analisis = p.id_analisis
    JOIN public.bloques AS b ON b.id_bloque = a.id_bloque
    WHERE p.id_plan = p_id_plan AND b.id_usuario = p_id_usuario
  ) THEN
    RAISE EXCEPTION 'El recurso no existe.' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.plan_ejercicio AS pe
    WHERE pe.id_plan_ejercicio = p_id_plan_ejercicio
      AND pe.id_plan = p_id_plan
  ) THEN
    RAISE EXCEPTION 'El ejercicio no pertenece a la versión del plan.'
      USING ERRCODE = 'A2101';
  END IF;

  IF p_fecha_practica IS NULL
    OR p_fecha_practica < TIMESTAMPTZ '0001-01-01 00:00:00+00'
    OR p_fecha_practica > now()
    OR p_minutos IS NULL
    OR p_minutos NOT BETWEEN 1 AND 32767
  THEN
    RAISE EXCEPTION 'Revisa la fecha y la duración de la práctica.'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.sesiones (id_plan)
  VALUES (p_id_plan)
  RETURNING id_sesion INTO v_sesion;

  INSERT INTO public.sesion_versiones (id_sesion, version, fecha_practica, notas)
  VALUES (v_sesion, 1, p_fecha_practica, p_notas)
  RETURNING id_sesion_version INTO v_version;

  INSERT INTO public.sesion_ejercicio (id_sesion_version, id_plan_ejercicio, minutos, completado)
  VALUES (v_version, p_id_plan_ejercicio, p_minutos, false);

  RETURN jsonb_build_object(
    'session_id', v_sesion::text,
    'plan_version_id', p_id_plan::text,
    'plan_exercise_id', p_id_plan_ejercicio::text,
    'version', 1,
    'performed_at', p_fecha_practica,
    'duration_minutes', p_minutos,
    'notes', p_notas,
    'source', 'self_reported'
  );
END;
$$;

-- Consulta de la última versión de cada sesión activa.
CREATE OR REPLACE FUNCTION public.a21_consultar_sesiones(
  p_id_usuario uuid,
  p_id_sesion bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'session_id', s.id_sesion::text,
      'plan_version_id', s.id_plan::text,
      'plan_exercise_id', CASE WHEN e.cantidad = 1 THEN e.id_ejercicio::text END,
      'version', v.version,
      'performed_at', v.fecha_practica,
      'duration_minutes', e.minutos,
      'notes', v.notas,
      'source', 'self_reported'
    ) ORDER BY v.fecha_practica DESC, s.id_sesion DESC
  ), '[]'::jsonb)
  FROM public.sesiones AS s
  JOIN public.planes AS p ON p.id_plan = s.id_plan
  JOIN public.analisis AS a ON a.id_analisis = p.id_analisis
  JOIN public.bloques AS b ON b.id_bloque = a.id_bloque
  JOIN LATERAL (
    SELECT sv.id_sesion_version, sv.version, sv.fecha_practica, sv.notas
    FROM public.sesion_versiones AS sv
    WHERE sv.id_sesion = s.id_sesion
    ORDER BY sv.version DESC
    LIMIT 1
  ) AS v ON true
  CROSS JOIN LATERAL (
    SELECT count(*) AS cantidad, min(se.id_plan_ejercicio) AS id_ejercicio,
           sum(se.minutos) AS minutos
    FROM public.sesion_ejercicio AS se
    WHERE se.id_sesion_version = v.id_sesion_version
  ) AS e
  WHERE b.id_usuario = p_id_usuario
    AND s.eliminado_en IS NULL
    AND (p_id_sesion IS NULL OR s.id_sesion = p_id_sesion);
$$;

CREATE OR REPLACE FUNCTION public.a21_corregir_sesion(
  p_id_usuario uuid,
  p_id_sesion bigint,
  p_cambios jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_plan bigint;
  v_anterior public.sesion_versiones%ROWTYPE;
  v_version bigint;
  v_fecha timestamptz;
  v_notas text;
  v_cantidad bigint;
  v_ejercicio_anterior bigint;
  v_minutos_anteriores integer;
  v_ejercicio bigint;
  v_minutos integer;
  v_edita_practica boolean;
  v_cambia_ejercicio boolean := false;
BEGIN
  SELECT s.id_plan INTO v_plan
  FROM public.sesiones AS s
  JOIN public.planes AS p ON p.id_plan = s.id_plan
  JOIN public.analisis AS a ON a.id_analisis = p.id_analisis
  JOIN public.bloques AS b ON b.id_bloque = a.id_bloque
  WHERE s.id_sesion = p_id_sesion AND s.eliminado_en IS NULL
    AND b.id_usuario = p_id_usuario
  FOR UPDATE OF s;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El recurso no existe.' USING ERRCODE = 'P0002';
  END IF;

  IF jsonb_typeof(p_cambios) IS DISTINCT FROM 'object' OR p_cambios = '{}'::jsonb THEN
    RAISE EXCEPTION 'Indica qué datos de la sesión deseas corregir.' USING ERRCODE = '22023';
  END IF;

  IF p_cambios - ARRAY['plan_exercise_id', 'performed_at', 'duration_minutes', 'notes'] <> '{}'::jsonb THEN
    RAISE EXCEPTION 'La corrección incluye campos no admitidos.' USING ERRCODE = '22023';
  END IF;

  SELECT sv.* INTO STRICT v_anterior
  FROM public.sesion_versiones AS sv
  WHERE sv.id_sesion = p_id_sesion
  ORDER BY sv.version DESC
  LIMIT 1;

  v_fecha := CASE WHEN p_cambios ? 'performed_at'
    THEN (p_cambios->>'performed_at')::timestamptz ELSE v_anterior.fecha_practica END;
  v_notas := CASE WHEN p_cambios ? 'notes'
    THEN p_cambios->>'notes' ELSE v_anterior.notas END;

  IF v_fecha IS NULL OR v_fecha < TIMESTAMPTZ '0001-01-01 00:00:00+00' OR v_fecha > now() THEN
    RAISE EXCEPTION 'Revisa la fecha de la práctica.' USING ERRCODE = '22023';
  END IF;

  v_edita_practica := p_cambios ?| ARRAY['plan_exercise_id', 'duration_minutes'];
  IF v_edita_practica THEN
    SELECT count(*), min(id_plan_ejercicio), min(minutos)
      INTO v_cantidad, v_ejercicio_anterior, v_minutos_anteriores
    FROM public.sesion_ejercicio
    WHERE id_sesion_version = v_anterior.id_sesion_version;

    IF v_cantidad <> 1 THEN
      RAISE EXCEPTION 'La corrección de ejercicio o minutos requiere una sesión con un ejercicio.'
        USING ERRCODE = 'A2102';
    END IF;

    v_ejercicio := CASE WHEN p_cambios ? 'plan_exercise_id'
      THEN (p_cambios->>'plan_exercise_id')::bigint ELSE v_ejercicio_anterior END;
    v_minutos := CASE WHEN p_cambios ? 'duration_minutes'
      THEN (p_cambios->>'duration_minutes')::integer ELSE v_minutos_anteriores END;

    IF NOT EXISTS (
      SELECT 1 FROM public.plan_ejercicio AS pe
      WHERE pe.id_plan_ejercicio = v_ejercicio AND pe.id_plan = v_plan
    ) THEN
      RAISE EXCEPTION 'El ejercicio no pertenece a la versión del plan.' USING ERRCODE = 'A2101';
    END IF;

    IF v_minutos IS NULL OR v_minutos NOT BETWEEN 1 AND 32767 THEN
      RAISE EXCEPTION 'Revisa la duración de la práctica.' USING ERRCODE = '22023';
    END IF;

    v_cambia_ejercicio := v_ejercicio <> v_ejercicio_anterior;
  END IF;

  IF v_fecha = v_anterior.fecha_practica AND v_notas IS NOT DISTINCT FROM v_anterior.notas
    AND (NOT v_edita_practica OR (NOT v_cambia_ejercicio AND v_minutos = v_minutos_anteriores))
  THEN
    RETURN public.a21_consultar_sesiones(p_id_usuario, p_id_sesion)->0;
  END IF;

  INSERT INTO public.sesion_versiones
    (id_sesion, version, fecha_practica, dificultad_percibida, notas)
  VALUES
    (p_id_sesion, v_anterior.version + 1, v_fecha, v_anterior.dificultad_percibida, v_notas)
  RETURNING id_sesion_version INTO v_version;

  INSERT INTO public.sesion_ejercicio
    (id_sesion_version, id_plan_ejercicio, minutos, repeticiones, completado, notas)
  SELECT v_version, CASE WHEN v_cambia_ejercicio THEN v_ejercicio ELSE e.id_plan_ejercicio END,
         CASE WHEN v_edita_practica THEN v_minutos ELSE e.minutos END,
         CASE WHEN NOT v_cambia_ejercicio THEN e.repeticiones END,
         CASE WHEN v_cambia_ejercicio THEN false ELSE e.completado END,
         CASE WHEN NOT v_cambia_ejercicio THEN e.notas END
  FROM public.sesion_ejercicio AS e
  WHERE e.id_sesion_version = v_anterior.id_sesion_version;

  RETURN public.a21_consultar_sesiones(p_id_usuario, p_id_sesion)->0;
END;
$$;

CREATE OR REPLACE FUNCTION public.a21_eliminar_sesion(p_id_usuario uuid, p_id_sesion bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.sesiones AS s
  SET eliminado_en = clock_timestamp(), motivo_exclusion = 'Eliminada por el jugador'
  FROM public.planes AS p
  JOIN public.analisis AS a ON a.id_analisis = p.id_analisis
  JOIN public.bloques AS b ON b.id_bloque = a.id_bloque
  WHERE s.id_plan = p.id_plan AND s.id_sesion = p_id_sesion
    AND s.eliminado_en IS NULL AND b.id_usuario = p_id_usuario;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El recurso no existe.' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object('session_id', p_id_sesion::text, 'effect', 'deleted');
END;
$$;

REVOKE ALL ON FUNCTION
  public.a21_crear_sesion(uuid, bigint, bigint, timestamptz, integer, text),
  public.a21_consultar_sesiones(uuid, bigint),
  public.a21_corregir_sesion(uuid, bigint, jsonb),
  public.a21_eliminar_sesion(uuid, bigint)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
  public.a21_crear_sesion(uuid, bigint, bigint, timestamptz, integer, text),
  public.a21_consultar_sesiones(uuid, bigint),
  public.a21_corregir_sesion(uuid, bigint, jsonb),
  public.a21_eliminar_sesion(uuid, bigint)
TO service_role;

COMMIT;