-- A21 · Dos versiones de plan y recálculo de entrenamiento.
-- Requiere las migraciones A08/A16/A24/A21 y semillas de reglas y catálogo.
BEGIN;
SET LOCAL lock_timeout = '5s';

DO $$
DECLARE
  jugador uuid;
  bloque bigint;
  conjunto bigint;
  regla bigint;
  analisis bigint;
  prioridad bigint;
  ejercicio_version bigint;
  plan_v1 bigint;
  plan_v2 bigint;
  ejercicio_v1 bigint;
  ejercicio_v2 bigint;
  sesion_v1 bigint;
  sesion_v2 bigint;
  practica timestamptz := now() - interval '1 day';
  fila jsonb;
  metrica_original jsonb;
  esperado integer;
  total integer;
BEGIN
  SELECT id_usuario INTO STRICT jugador
  FROM public.usuarios
  WHERE estado = 'activo' AND rol = 'jugador'
  ORDER BY id_usuario
  LIMIT 1;

  SELECT id_conjunto_reglas, id_regla_config INTO STRICT conjunto, regla
  FROM public.reglas_config
  ORDER BY id_regla_config
  LIMIT 1;

  SELECT id_ejercicio_version INTO STRICT ejercicio_version
  FROM public.ejercicio_versiones
  ORDER BY id_ejercicio_version
  LIMIT 1;

  INSERT INTO public.bloques (id_usuario, modalidad, tipo_partida, estado)
  VALUES (jugador, '2v2', 'casual', 'borrador')
  RETURNING id_bloque INTO bloque;

  INSERT INTO public.metricas_bloque
    (id_bloque, version_calculo, tiempo_jugado_s, tiros_total, goles_total)
  VALUES (bloque, 'prueba-a21', 300, 10, 3);

  SELECT to_jsonb(m) INTO STRICT metrica_original
  FROM public.metricas_bloque AS m
  WHERE m.id_bloque = bloque;

  INSERT INTO public.analisis (id_bloque, id_conjunto_reglas, explicacion)
  VALUES (bloque, conjunto, 'Prueba A21')
  RETURNING id_analisis INTO analisis;

  INSERT INTO public.prioridades (id_analisis, id_regla_config, orden, valor_actual, evidencia)
  VALUES (analisis, regla, 1, 30, 'Prueba A21')
  RETURNING id_prioridad INTO prioridad;

  INSERT INTO public.planes
    (id_analisis, version, estado, plataforma_destino, minutos_disponibles,
     dias_disponibles, sesiones_semana, justificacion, contexto)
  VALUES (analisis, 1, 'completo', 'epic', 30, 3, 3, 'Prueba A21 v1', '{}')
  RETURNING id_plan INTO plan_v1;

  INSERT INTO public.plan_ejercicio
    (id_plan, id_ejercicio_version, id_prioridad, orden, minutos, dificultad)
  VALUES (plan_v1, ejercicio_version, prioridad, 1, 10, 1)
  RETURNING id_plan_ejercicio INTO ejercicio_v1;

  sesion_v1 := (
    public.a21_crear_sesion(jugador, plan_v1, ejercicio_v1, practica, 10)->>'session_id'
  )::bigint;

  INSERT INTO public.planes
    (id_analisis, version, estado, plataforma_destino, minutos_disponibles,
     dias_disponibles, sesiones_semana, justificacion, contexto)
  VALUES (analisis, 2, 'completo', 'epic', 20, 3, 3, 'Prueba A21 v2', '{}')
  RETURNING id_plan INTO plan_v2;

  INSERT INTO public.plan_ejercicio
    (id_plan, id_ejercicio_version, id_prioridad, orden, minutos, dificultad)
  VALUES (plan_v2, ejercicio_version, prioridad, 1, 4, 1)
  RETURNING id_plan_ejercicio INTO ejercicio_v2;

  fila := public.a21_consultar_sesiones(jugador, sesion_v1)->0;
  IF fila->>'plan_version_id' IS DISTINCT FROM plan_v1::text
     OR fila->>'plan_exercise_id' IS DISTINCT FROM ejercicio_v1::text THEN
    RAISE EXCEPTION 'La sesión perdió el vínculo con el plan v1.';
  END IF;

  BEGIN
    PERFORM public.a21_crear_sesion(jugador, plan_v1, ejercicio_v2, practica, 4);
    RAISE EXCEPTION 'Se aceptó un ejercicio de otra versión del plan.';
  EXCEPTION WHEN SQLSTATE 'A2101' THEN
    NULL;
  END;

  sesion_v2 := (
    public.a21_crear_sesion(jugador, plan_v2, ejercicio_v2, practica, 4)->>'session_id'
  )::bigint;

  FOR paso IN 1..3 LOOP
    IF paso = 1 THEN
      esperado := 14;
    ELSIF paso = 2 THEN
      fila := public.a21_corregir_sesion(jugador, sesion_v1, '{"duration_minutes":15}');
      IF (fila->>'version')::integer IS DISTINCT FROM 2 THEN
        RAISE EXCEPTION 'La corrección no generó la versión 2 de la sesión.';
      END IF;
      esperado := 19;
    ELSE
      PERFORM public.a21_eliminar_sesion(jugador, sesion_v1);
      esperado := 4;
    END IF;

    SELECT sum((item->>'duration_minutes')::integer) INTO total
    FROM jsonb_array_elements(public.a21_consultar_sesiones(jugador)) AS item
    WHERE item->>'session_id' IN (sesion_v1::text, sesion_v2::text);

    IF total IS DISTINCT FROM esperado THEN
      RAISE EXCEPTION 'Paso %, minutos esperados %, obtenidos %', paso, esperado, total;
    END IF;
  END LOOP;

  IF public.a21_consultar_sesiones(jugador, sesion_v1) IS DISTINCT FROM '[]'::jsonb
     OR (SELECT count(*) FROM public.sesion_versiones WHERE id_sesion = sesion_v1) <> 2 THEN
    RAISE EXCEPTION 'El borrado no conservó el historial o la sesión sigue visible.';
  END IF;

  IF (SELECT to_jsonb(m) FROM public.metricas_bloque AS m WHERE m.id_bloque = bloque)
     IS DISTINCT FROM metrica_original THEN
    RAISE EXCEPTION 'El CRUD de sesiones cambió las métricas del bloque.';
  END IF;
END;
$$;

SET CONSTRAINTS ALL IMMEDIATE;
ROLLBACK;

SELECT 'A21 OK · 14 → 19 → 4 minutos' AS resultado;