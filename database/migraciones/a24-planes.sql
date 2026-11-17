-- A24 · Guardar versiones inmutables del plan.
-- Se ejecuta UNA vez en el SQL Editor de Supabase, después de A08/A15 y de las seeds
-- database/seeds/a23-catalogo.sql y database/seeds/a24-reglas.sql. Se puede volver a ejecutar.
--
-- Qué hace:
--   1. Agrega planes.contexto (jsonb): lo que la propuesta usa y no tiene columna propia
--      (rango/Workshop declarados, versiones del generador/asignación/catálogo, reason_codes,
--      exclusiones, metas excluidas, snapshots de perfil/diagnóstico/ejercicios). Una fila de
--      planes sigue siendo UNA versión: no se crea plan_versiones.
--   2. a24_guardar_plan: guarda análisis + prioridades (una vez por bloque), la versión del
--      plan y sus ejercicios/metas en una sola transacción.
--   3. Trigger que impide UPDATE en analisis, prioridades, planes, plan_ejercicio y plan_objetivo:
--      una versión guardada no se reescribe; un cambio inserta la versión siguiente.
--
-- Identidad (expuesta por la API):
--   plan_id         = analisis.id_analisis  (una línea de versiones por bloque, UNIQUE id_bloque)
--   plan_version_id = planes.id_plan        (A21 vincula sesiones.id_plan a esta versión exacta)
--   version         = planes.version        (1, 2, 3… dentro del mismo análisis)
-- Cambiar de bloque crea otro análisis y, por tanto, otro plan_id con su versión 1.
--
-- Permisos: solo service_role (Express). El propietario sale de la sesión verificada.

-- 1) Columna de contexto ----------------------------------------------------------
-- Sin DEFAULT a propósito: si planes ya tuviera filas, el ALTER falla en vez de
-- inventar un contexto vacío. En desarrollo planes está vacía antes de A24.
ALTER TABLE public.planes ADD COLUMN IF NOT EXISTS contexto jsonb NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_planes_contexto_objeto') THEN
    ALTER TABLE public.planes ADD CONSTRAINT ck_planes_contexto_objeto CHECK (jsonb_typeof(contexto) = 'object');
  END IF;
END $$;

-- 2) Guardado transaccional -------------------------------------------------------
-- p_analisis: { rules_version, explicacion,
--               prioridades: [{ rule_id, orden, valor_actual, valor_base, evidencia }] }
-- p_plan:     { estado, plataforma_destino, minutos_disponibles, dias_disponibles,
--               sesiones_semana, justificacion, contexto,
--               ejercicios: [{ orden, rule_id, id_ejercicio_version, minutos, dificultad }],
--               objetivos:  [id_objetivo_version, ...] }
-- Devuelve:   { id_analisis, id_plan, version, analisis_creado, ejercicios: [{ orden, id_plan_ejercicio }] }
--
-- Errores (SQLSTATE → Express):
--   P0002 bloque/meta inexistente o ajena        → 404
--   A2401 reglas de esa versión no cargadas      → 503
--   A2402 el bloque ya tiene un análisis distinto → 409
--   23505 dos guardados simultáneos              → 409 (el bloqueo FOR UPDATE lo evita)
CREATE OR REPLACE FUNCTION public.a24_guardar_plan(p_id_usuario uuid, p_id_bloque bigint, p_analisis jsonb, p_plan jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_conjunto   bigint;
  v_analisis   bigint;
  v_creado     boolean := false;
  v_version    integer;
  v_plan       bigint;
  v_item       jsonb;
  v_config     bigint;
  v_prioridad  bigint;
  v_pe         bigint;
  v_ejercicios jsonb := '[]'::jsonb;
  v_guardadas  jsonb;
  v_nuevas     jsonb;
BEGIN
  IF p_id_usuario IS NULL OR p_id_bloque IS NULL THEN
    RAISE EXCEPTION 'Falta el propietario o el bloque' USING ERRCODE = '22004';
  END IF;

  -- Bloque propio. FOR UPDATE serializa dos guardados del mismo bloque (versión siguiente).
  PERFORM 1 FROM bloques WHERE id_bloque = p_id_bloque AND id_usuario = p_id_usuario FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bloque inexistente o ajeno' USING ERRCODE = 'P0002';
  END IF;

  SELECT id_conjunto_reglas INTO v_conjunto FROM conjuntos_reglas WHERE version = p_analisis->>'rules_version';
  IF v_conjunto IS NULL THEN
    RAISE EXCEPTION 'Conjunto de reglas % no cargado', p_analisis->>'rules_version' USING ERRCODE = 'A2401';
  END IF;

  -- Prioridades recibidas con su regla configurada en este conjunto.
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id_regla_config', rc.id_regla_config,
           'orden', (p->>'orden')::smallint,
           -- Redondeado como numeric(12,4) para compararlo con lo ya guardado.
           'valor_actual', round((p->>'valor_actual')::numeric, 4)
         ) ORDER BY (p->>'orden')::smallint), '[]'::jsonb),
         count(*) FILTER (WHERE rc.id_regla_config IS NULL)
    INTO v_nuevas, v_config
    FROM jsonb_array_elements(COALESCE(p_analisis->'prioridades', '[]'::jsonb)) AS p
    LEFT JOIN reglas r ON r.codigo = p->>'rule_id'
    LEFT JOIN reglas_config rc ON rc.id_regla = r.id_regla AND rc.id_conjunto_reglas = v_conjunto;
  IF v_config > 0 THEN
    RAISE EXCEPTION 'Alguna regla no está configurada en %', p_analisis->>'rules_version' USING ERRCODE = 'A2401';
  END IF;

  SELECT id_analisis INTO v_analisis FROM analisis WHERE id_bloque = p_id_bloque;
  IF v_analisis IS NULL THEN
    INSERT INTO analisis (id_bloque, id_bloque_base, id_conjunto_reglas, explicacion)
    VALUES (p_id_bloque, NULL, v_conjunto, p_analisis->>'explicacion')
    RETURNING id_analisis INTO v_analisis;
    v_creado := true;

    FOR v_item IN SELECT value FROM jsonb_array_elements(COALESCE(p_analisis->'prioridades', '[]'::jsonb))
    LOOP
      INSERT INTO prioridades (id_analisis, id_regla_config, orden, valor_actual, valor_base, evidencia)
      SELECT v_analisis, rc.id_regla_config, (v_item->>'orden')::smallint, (v_item->>'valor_actual')::numeric,
             (v_item->>'valor_base')::numeric, v_item->>'evidencia'
      FROM reglas r JOIN reglas_config rc ON rc.id_regla = r.id_regla AND rc.id_conjunto_reglas = v_conjunto
      WHERE r.codigo = v_item->>'rule_id';
    END LOOP;
  ELSE
    -- El análisis de un bloque se guarda una vez. Si cambió el conjunto de reglas o las
    -- prioridades, no se reescribe: se rechaza en vez de mezclar evidencias.
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'id_regla_config', id_regla_config, 'orden', orden, 'valor_actual', valor_actual
           ) ORDER BY orden), '[]'::jsonb)
      INTO v_guardadas FROM prioridades WHERE id_analisis = v_analisis;
    IF NOT EXISTS (SELECT 1 FROM analisis WHERE id_analisis = v_analisis AND id_conjunto_reglas = v_conjunto)
       OR v_guardadas <> v_nuevas THEN
      RAISE EXCEPTION 'El bloque ya tiene un análisis guardado distinto' USING ERRCODE = 'A2402';
    END IF;
  END IF;

  SELECT COALESCE(max(version), 0) + 1 INTO v_version FROM planes WHERE id_analisis = v_analisis;

  INSERT INTO planes (id_analisis, version, estado, plataforma_destino, minutos_disponibles,
                      dias_disponibles, sesiones_semana, cumplimiento_previo_pct, justificacion, contexto)
  VALUES (
    v_analisis, v_version,
    p_plan->>'estado',
    p_plan->>'plataforma_destino',
    (p_plan->>'minutos_disponibles')::smallint,
    (p_plan->>'dias_disponibles')::smallint,
    (p_plan->>'sesiones_semana')::smallint,
    NULL,
    p_plan->>'justificacion',
    p_plan->'contexto'
  )
  RETURNING id_plan INTO v_plan;

  FOR v_item IN SELECT value FROM jsonb_array_elements(COALESCE(p_plan->'ejercicios', '[]'::jsonb))
  LOOP
    -- La prioridad debe ser de ESTE análisis (la FK sola permitiría la de otro bloque).
    SELECT pr.id_prioridad INTO v_prioridad
      FROM prioridades pr
      JOIN reglas_config rc ON rc.id_regla_config = pr.id_regla_config
      JOIN reglas r ON r.id_regla = rc.id_regla
     WHERE pr.id_analisis = v_analisis AND r.codigo = v_item->>'rule_id';
    IF v_prioridad IS NULL THEN
      RAISE EXCEPTION 'Ejercicio sin prioridad del análisis' USING ERRCODE = '23503';
    END IF;

    INSERT INTO plan_ejercicio (id_plan, id_ejercicio_version, id_prioridad, orden, minutos, dificultad)
    VALUES (v_plan, (v_item->>'id_ejercicio_version')::bigint, v_prioridad, (v_item->>'orden')::smallint,
            (v_item->>'minutos')::smallint, (v_item->>'dificultad')::smallint)
    RETURNING id_plan_ejercicio INTO v_pe;
    v_ejercicios := v_ejercicios || jsonb_build_object('orden', (v_item->>'orden')::int, 'id_plan_ejercicio', v_pe);
  END LOOP;

  FOR v_item IN SELECT value FROM jsonb_array_elements(COALESCE(p_plan->'objetivos', '[]'::jsonb))
  LOOP
    PERFORM 1 FROM objetivo_versiones ov JOIN objetivos o ON o.id_objetivo = ov.id_objetivo
     WHERE ov.id_objetivo_version = (v_item #>> '{}')::bigint AND o.id_usuario = p_id_usuario;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Meta inexistente o ajena' USING ERRCODE = 'P0002';
    END IF;
    INSERT INTO plan_objetivo (id_plan, id_objetivo_version) VALUES (v_plan, (v_item #>> '{}')::bigint);
  END LOOP;

  RETURN jsonb_build_object('id_analisis', v_analisis, 'id_plan', v_plan, 'version', v_version,
                            'analisis_creado', v_creado, 'ejercicios', v_ejercicios);
END;
$$;

REVOKE ALL ON FUNCTION public.a24_guardar_plan(uuid, bigint, jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.a24_guardar_plan(uuid, bigint, jsonb, jsonb) TO service_role;

-- 3) Versiones inmutables ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.a24_impedir_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Las versiones guardadas de % no se modifican; crea una versión nueva', TG_TABLE_NAME
    USING ERRCODE = '55000';
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['analisis', 'prioridades', 'planes', 'plan_ejercicio', 'plan_objetivo']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS a24_inmutable ON public.%I', t);
    EXECUTE format('CREATE TRIGGER a24_inmutable BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.a24_impedir_update()', t);
  END LOOP;
END $$;

-- Comprobaciones (ejecutar aparte):
--
-- 1) Columna y función:
--   SELECT column_name, data_type, is_nullable FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'planes' AND column_name = 'contexto';
--   Esperado: contexto | jsonb | NO
--
--   SELECT p.proname,
--          has_function_privilege('service_role',  p.oid, 'EXECUTE') AS service_role,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated,
--          has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND p.proname = 'a24_guardar_plan';
--   Esperado: service_role = true, authenticated = false, anon = false.
--
-- 2) Triggers:
--   SELECT event_object_table FROM information_schema.triggers WHERE trigger_name = 'a24_inmutable' ORDER BY 1;
--   Esperado: analisis, plan_ejercicio, plan_objetivo, planes, prioridades.
