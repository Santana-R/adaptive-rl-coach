-- A26 · Comprobación directa de SQL con entradas SINTÉTICAS, siempre ROLLBACK.
-- Requisitos: seeds A24 y A26, RPC A24, perfiles de desarrollo TEST_A / TEST_B.
-- No ejecuta el motor, no carga replays y no acredita autenticación HTTP.
-- Crea dos bloques borrador solo para verificar referencias/versiones del RPC.
-- Secuencias de IDs avanzan aunque se reviertan las filas.
BEGIN;
SET LOCAL lock_timeout = '5s';
DO $$
DECLARE
  a uuid; b uuid; block_v4 bigint; block_v3 bigint;
  result jsonb; p4 jsonb; p3 jsonb; plan_arg jsonb;
  first_plan bigint; before_row jsonb; old_row jsonb;
  old_configs jsonb; denial boolean; migration_denial boolean; immutable boolean;
BEGIN
  SELECT id_usuario INTO a FROM perfiles WHERE cuenta_juego_id='TEST_A';
  SELECT id_usuario INTO b FROM perfiles WHERE cuenta_juego_id='TEST_B';
  IF a IS NULL OR b IS NULL OR a=b THEN RAISE EXCEPTION 'Faltan perfiles TEST_A/B distintos'; END IF;
  IF (SELECT count(*) FROM reglas_config rc JOIN conjuntos_reglas c USING(id_conjunto_reglas) WHERE c.version='mvp.rules.v4') <> 3 THEN
    RAISE EXCEPTION 'Ejecutar seed A26 primero';
  END IF;
  SELECT jsonb_agg(to_jsonb(rc) ORDER BY rc.id_regla_config) INTO old_configs
  FROM reglas_config rc JOIN conjuntos_reglas c USING(id_conjunto_reglas)
  WHERE c.version IN ('mvp.rules.v2','mvp.rules.v3');

  INSERT INTO bloques(id_usuario,modalidad,tipo_partida,estado)
  VALUES(a,'2v2','ranked','borrador') RETURNING id_bloque INTO block_v4;
  INSERT INTO bloques(id_usuario,modalidad,tipo_partida,estado)
  VALUES(a,'2v2','ranked','borrador') RETURNING id_bloque INTO block_v3;

  p4 := jsonb_build_object('rules_version','mvp.rules.v4','explicacion','A26 prueba SQL sintética de compatibilidad',
    'prioridades',jsonb_build_array(jsonb_build_object('rule_id','cobertura-defensiva-revision-tasa',
      'orden',1,'valor_actual',3,'valor_base',null,'evidencia',
      '{"source":"synthetic_sql_contract","rule_id":"cobertura-defensiva-revision","rules_version":"mvp.rules.v4","evidence":{"unit":"goals_per_5_minutes","threshold":2,"matched_replays":3,"reference_duration_s":300}}')));
  p3 := jsonb_build_object('rules_version','mvp.rules.v3','explicacion','A26 antecedente sintético v3',
    'prioridades',jsonb_build_array(jsonb_build_object('rule_id','cobertura-defensiva-revision',
      'orden',1,'valor_actual',3,'valor_base',null,'evidencia','{"source":"synthetic_sql_contract","rules_version":"mvp.rules.v3"}')));
  plan_arg := '{"estado":"no_disponible","plataforma_destino":"steam","minutos_disponibles":20,
    "dias_disponibles":3,"sesiones_semana":3,"justificacion":"A26 contrato SQL sintético sin ejercicios",
    "contexto":{"source":"synthetic_sql_contract","marker":1},"ejercicios":[],"objetivos":[]}'::jsonb;
  result := a24_guardar_plan(a,block_v4,p4,plan_arg);
  IF (result->>'version')::int <> 1 THEN RAISE EXCEPTION 'Primera versión incorrecta'; END IF;
  first_plan := (result->>'id_plan')::bigint;
  SELECT to_jsonb(p) INTO before_row FROM planes p WHERE id_plan=first_plan;
  IF NOT EXISTS (
    SELECT 1 FROM prioridades pr JOIN analisis an USING(id_analisis)
    JOIN reglas_config rc USING(id_regla_config) JOIN reglas r USING(id_regla)
    JOIN metricas m USING(id_metrica) JOIN conjuntos_reglas c ON c.id_conjunto_reglas=an.id_conjunto_reglas
    WHERE an.id_bloque=block_v4 AND c.version='mvp.rules.v4'
      AND r.codigo='cobertura-defensiva-revision-tasa' AND m.unidad='goals_per_5_minutes'
      AND pr.valor_actual=3 AND pr.evidencia::jsonb->>'rule_id'='cobertura-defensiva-revision'
  ) THEN RAISE EXCEPTION 'Regla/tasa/evidencia v4 no coinciden'; END IF;
  result := a24_guardar_plan(a,block_v4,p4,
    jsonb_set(jsonb_set(plan_arg,'{minutos_disponibles}','30'),'{contexto,marker}','2'));
  IF (result->>'version')::int <> 2 THEN RAISE EXCEPTION 'Segunda versión incorrecta'; END IF;
  IF before_row IS DISTINCT FROM (SELECT to_jsonb(p) FROM planes p WHERE id_plan=first_plan) THEN
    RAISE EXCEPTION 'La versión anterior cambió';
  END IF;

  denial:=false;
  BEGIN PERFORM a24_guardar_plan(b,block_v4,p4,plan_arg);
  EXCEPTION WHEN SQLSTATE 'P0002' THEN denial:=true; END;
  IF NOT denial THEN RAISE EXCEPTION 'Se permitió propietario ajeno'; END IF;
  immutable:=false;
  BEGIN UPDATE planes SET minutos_disponibles=40 WHERE id_plan=first_plan;
  EXCEPTION WHEN SQLSTATE '55000' THEN immutable:=true; END;
  IF NOT immutable THEN RAISE EXCEPTION 'Se permitió reescribir snapshot'; END IF;

  result := a24_guardar_plan(a,block_v3,p3,plan_arg);
  SELECT to_jsonb(an) INTO old_row FROM analisis an WHERE id_bloque=block_v3;
  migration_denial:=false;
  BEGIN PERFORM a24_guardar_plan(a,block_v3,p4,plan_arg);
  EXCEPTION WHEN SQLSTATE 'A2402' THEN migration_denial:=true; END;
  IF NOT migration_denial OR old_row IS DISTINCT FROM
    (SELECT to_jsonb(an) FROM analisis an WHERE id_bloque=block_v3) THEN
    RAISE EXCEPTION 'Se mezcló el análisis anterior v3 con v4';
  END IF;
  IF old_configs IS DISTINCT FROM (SELECT jsonb_agg(to_jsonb(rc) ORDER BY rc.id_regla_config)
    FROM reglas_config rc JOIN conjuntos_reglas c USING(id_conjunto_reglas)
    WHERE c.version IN ('mvp.rules.v2','mvp.rules.v3')) THEN
    RAISE EXCEPTION 'Cambió una configuración anterior';
  END IF;
  PERFORM set_config('arc.a26_test_report',
    '{"source":"synthetic_sql_contract","v4_rules":3,"new_metric_unit":true,"v4_rpc_save":true,"version_2":true,
      "version_1_unchanged":true,"other_owner_denied":true,"update_denied":true,
      "v3_still_saves":true,"v3_to_v4_conflict_preserved":true,"old_configs_unchanged":true,"rollback":true}',true);
END $$;
SET CONSTRAINTS ALL IMMEDIATE;
SELECT current_setting('arc.a26_test_report')::jsonb AS a26_test_report;
ROLLBACK;
