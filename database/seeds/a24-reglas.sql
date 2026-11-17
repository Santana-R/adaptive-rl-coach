-- A24 · Seed del conjunto de reglas mvp.rules.v2 (src/domain/rules-config.js).
-- Se ejecuta en el SQL Editor de Supabase ANTES de database/migraciones/a24-planes.sql.
-- Idempotente: si las filas ya existen con los mismos valores no hace nada; si existen con
-- valores distintos aborta sin cambiar nada (una regla publicada cambia con versión nueva).
--
-- Mapeo:
--   metricas          shooting_pct, boost_zero_pct (percent, rendimiento)
--   conjuntos_reglas  mvp.rules.v2
--   reglas            finalizacion-eficiencia → shooting_pct (categoría shooting)
--                     boost-disponibilidad    → boost_zero_pct (categoría boost)
--   reglas_config     comparador/umbral iguales a rules-config.js.
--     muestra_minima = 5 replays del bloque. El mínimo de tiros depende de la modalidad
--     (1v1 20, 2v2 15, 3v3 10) y una columna no lo representa: queda en la evidencia
--     guardada de cada prioridad (evidence.min_shots), junto con el contexto.
--     Boost: umbral 15 % por partida; el umbral alto (20 %) y las 3 de 5 partidas
--     quedan también en la evidencia (high_threshold, required_matches).
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
    ('boost_zero_pct', 'percent', 'rendimiento', 'Porcentaje del tiempo medido con exactamente cero boost, por partida.')
  ) AS t(codigo, unidad, tipo, descripcion)
  LOOP
    INSERT INTO metricas (codigo, unidad, tipo, descripcion) VALUES (r.codigo, r.unidad, r.tipo, r.descripcion)
    ON CONFLICT (codigo) DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM metricas WHERE codigo = r.codigo AND unidad = r.unidad AND tipo = r.tipo) THEN
      RAISE EXCEPTION 'La métrica % ya existe con otra unidad o tipo', r.codigo;
    END IF;
  END LOOP;

  -- Conjunto
  INSERT INTO conjuntos_reglas (version, descripcion)
  VALUES ('mvp.rules.v2', 'Heurísticas acordadas de finalización y disponibilidad de boost; pendientes de calibración (A26).')
  ON CONFLICT (version) DO NOTHING;
  SELECT id_conjunto_reglas INTO v_conjunto FROM conjuntos_reglas WHERE version = 'mvp.rules.v2';

  -- Reglas y su configuración en el conjunto
  FOR r IN SELECT * FROM (VALUES
    ('finalizacion-eficiencia', 'shooting_pct',   'shooting', '<=', 30::numeric, 5, 'higher', 0::numeric),
    ('boost-disponibilidad',    'boost_zero_pct', 'boost',    '>=', 15::numeric, 5, 'lower',  0::numeric)
  ) AS t(codigo, metrica, categoria, comparador, umbral, muestra, direccion, mejora)
  LOOP
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
      RAISE EXCEPTION 'La configuración de % en mvp.rules.v2 ya existe con otros valores', r.codigo;
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
--   ORDER BY r.codigo;
--   Esperado: 2 filas (boost-disponibilidad >= 15, finalizacion-eficiencia <= 30), muestra 5.
