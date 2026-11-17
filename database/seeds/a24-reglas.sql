-- A24 · Seed de los conjuntos de reglas mvp.rules.v2 y mvp.rules.v3 (src/domain/rules-config.js).
-- Se ejecuta en el SQL Editor de Supabase ANTES de database/migraciones/a24-planes.sql.
-- Idempotente: si las filas ya existen con los mismos valores no hace nada; si existen con
-- valores distintos aborta sin cambiar nada (una regla publicada cambia con versión nueva).
-- Se conserva mvp.rules.v2 porque los análisis guardados con esa versión siguen apuntando a ella.
--
-- Mapeo:
--   metricas          shooting_pct, boost_zero_pct (percent), goals_against_while_last_defender (count)
--   conjuntos_reglas  mvp.rules.v2 (finalización + boost)
--                     mvp.rules.v3 (finalización + boost + revisión de cobertura defensiva, PR #74)
--   reglas            finalizacion-eficiencia      → shooting_pct                      (shooting)
--                     boost-disponibilidad         → boost_zero_pct                    (boost)
--                     cobertura-defensiva-revision → goals_against_while_last_defender (defensive_review)
--   reglas_config     comparador/umbral iguales a rules-config.js.
--     muestra_minima = 5 replays del bloque. Lo que una columna no representa queda en la
--     evidencia guardada de cada prioridad:
--       finalización: mínimo de tiros por modalidad (1v1 20, 2v2 15, 3v3 10) → evidence.min_shots
--       boost: umbral alto 20 % y 3 de 5 partidas → evidence.high_threshold / required_matches
--       defensiva: >= 2 goles como último defensor en 3 de 5 partidas → evidence.threshold / required_matches
--     umbral_mejora = 0: la mejora entre bloques no está calibrada (A26).

BEGIN;

DO $$
DECLARE
  v_conjunto bigint;
  v_metrica  bigint;
  v_regla    bigint;
  r          record;
BEGIN
  -- Métricas
  FOR r IN SELECT * FROM (VALUES
    ('shooting_pct',   'percent', 'rendimiento', 'Goles entre tiros del jugador en los cinco replays del bloque, en porcentaje.'),
    ('boost_zero_pct', 'percent', 'rendimiento', 'Porcentaje del tiempo medido con exactamente cero boost, por partida.'),
    ('goals_against_while_last_defender', 'count', 'rendimiento', 'Goles recibidos mientras el proveedor registra al jugador como último defensor, por partida.')
  ) AS t(codigo, unidad, tipo, descripcion)
  LOOP
    INSERT INTO metricas (codigo, unidad, tipo, descripcion) VALUES (r.codigo, r.unidad, r.tipo, r.descripcion)
    ON CONFLICT (codigo) DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM metricas WHERE codigo = r.codigo AND unidad = r.unidad AND tipo = r.tipo) THEN
      RAISE EXCEPTION 'La métrica % ya existe con otra unidad o tipo', r.codigo;
    END IF;
  END LOOP;

  -- Conjuntos
  INSERT INTO conjuntos_reglas (version, descripcion) VALUES
    ('mvp.rules.v2', 'Heurísticas acordadas de finalización y disponibilidad de boost; pendientes de calibración (A26).'),
    ('mvp.rules.v3', 'Finalización y boost de v2 más la revisión provisional de cobertura defensiva (2v2 ranked); pendientes de calibración/validación.')
  ON CONFLICT (version) DO NOTHING;

  -- Reglas y su configuración en cada conjunto
  FOR r IN SELECT * FROM (VALUES
    ('mvp.rules.v2', 'finalizacion-eficiencia',      'shooting_pct',                      'shooting',         '<=', 30::numeric, 5, 'higher', 0::numeric),
    ('mvp.rules.v2', 'boost-disponibilidad',         'boost_zero_pct',                    'boost',            '>=', 15::numeric, 5, 'lower',  0::numeric),
    ('mvp.rules.v3', 'finalizacion-eficiencia',      'shooting_pct',                      'shooting',         '<=', 30::numeric, 5, 'higher', 0::numeric),
    ('mvp.rules.v3', 'boost-disponibilidad',         'boost_zero_pct',                    'boost',            '>=', 15::numeric, 5, 'lower',  0::numeric),
    ('mvp.rules.v3', 'cobertura-defensiva-revision', 'goals_against_while_last_defender', 'defensive_review', '>=',  2::numeric, 5, 'lower',  0::numeric)
  ) AS t(conjunto, codigo, metrica, categoria, comparador, umbral, muestra, direccion, mejora)
  LOOP
    SELECT id_conjunto_reglas INTO v_conjunto FROM conjuntos_reglas WHERE version = r.conjunto;
    SELECT id_metrica INTO v_metrica FROM metricas WHERE codigo = r.metrica;
    INSERT INTO reglas (codigo, id_metrica, categoria) VALUES (r.codigo, v_metrica, r.categoria)
    ON CONFLICT (codigo) DO NOTHING;
    SELECT id_regla INTO v_regla FROM reglas WHERE codigo = r.codigo AND id_metrica = v_metrica AND categoria = r.categoria;
    IF v_regla IS NULL THEN
      RAISE EXCEPTION 'La regla % ya existe con otra métrica o categoría', r.codigo;
    END IF;

    INSERT INTO reglas_config (id_conjunto_reglas, id_regla, comparador, umbral, muestra_minima, direccion_favorable, umbral_mejora)
    VALUES (v_conjunto, v_regla, r.comparador, r.umbral, r.muestra, r.direccion, r.mejora)
    ON CONFLICT (id_conjunto_reglas, id_regla) DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM reglas_config WHERE id_conjunto_reglas = v_conjunto AND id_regla = v_regla
                   AND comparador = r.comparador AND umbral = r.umbral AND muestra_minima = r.muestra
                   AND direccion_favorable = r.direccion AND umbral_mejora = r.mejora) THEN
      RAISE EXCEPTION 'La configuración de % en % ya existe con otros valores', r.codigo, r.conjunto;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- Comprobación:
--   SELECT cr.version, r.codigo, m.codigo AS metrica, rc.comparador, rc.umbral, rc.muestra_minima
--   FROM reglas_config rc
--   JOIN conjuntos_reglas cr USING (id_conjunto_reglas)
--   JOIN reglas r USING (id_regla)
--   JOIN metricas m ON m.id_metrica = r.id_metrica
--   ORDER BY cr.version, r.codigo;
--   Esperado: 5 filas (v2: boost >= 15, finalización <= 30; v3: las mismas + cobertura-defensiva-revision >= 2).
