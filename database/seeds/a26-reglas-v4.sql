-- A26 · Añadir mvp.rules.v4 sin reescribir reglas ni análisis anteriores.
-- Ejecutar DESPUÉS de database/seeds/a24-reglas.sql. Solo INSERT; sin DDL.
-- El código de reglas tiene métrica inmutable. La tasa nueva usa otro código SQL;
-- el adaptador conserva cobertura-defensiva-revision como ID lógico en snapshots.
-- evidence contiene tasas, conteos, relojes, umbral 2 y repetición 3/5.
-- valor_actual conserva matched_replays (como boost), no una tasa promediada.
BEGIN;
DO $$
DECLARE
  v_conjunto bigint;
  v_metrica bigint;
  v_regla bigint;
  r record;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM conjuntos_reglas WHERE version = 'mvp.rules.v3') THEN
    RAISE EXCEPTION 'Ejecutar primero database/seeds/a24-reglas.sql';
  END IF;
  INSERT INTO metricas (codigo, unidad, tipo, descripcion)
  VALUES ('last_defender_goals_per_5_minutes', 'goals_per_5_minutes', 'rendimiento',
          'Tasa por replay: goles originales del jugador como último defensor por 300 segundos originales de la partida; no mide culpa ni exposición individual.')
  ON CONFLICT (codigo) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM metricas WHERE codigo = 'last_defender_goals_per_5_minutes'
                 AND unidad = 'goals_per_5_minutes' AND tipo = 'rendimiento') THEN
    RAISE EXCEPTION 'La métrica defensiva de tasa ya existe con otra unidad o tipo';
  END IF;
  INSERT INTO conjuntos_reglas (version, descripcion)
  VALUES ('mvp.rules.v4', 'Finalización y boost sin cambios; revisión defensiva por tasa por cinco minutos, con conteos/relojes originales 5/5 y repetición 3/5. Heurística provisional A26.')
  ON CONFLICT (version) DO NOTHING;
  SELECT id_conjunto_reglas INTO v_conjunto FROM conjuntos_reglas WHERE version = 'mvp.rules.v4';

  FOR r IN SELECT * FROM (VALUES
    ('finalizacion-eficiencia', 'shooting_pct', 'shooting', '<=', 30::numeric, 'higher'),
    ('boost-disponibilidad', 'boost_zero_pct', 'boost', '>=', 15::numeric, 'lower'),
    ('cobertura-defensiva-revision-tasa', 'last_defender_goals_per_5_minutes', 'defensive_review', '>=', 2::numeric, 'lower')
  ) AS t(codigo, metrica, categoria, comparador, umbral, direccion)
  LOOP
    SELECT id_metrica INTO v_metrica FROM metricas WHERE codigo = r.metrica;
    IF v_metrica IS NULL THEN RAISE EXCEPTION 'Métrica % no disponible', r.metrica; END IF;
    INSERT INTO reglas (codigo, id_metrica, categoria) VALUES (r.codigo, v_metrica, r.categoria)
    ON CONFLICT (codigo) DO NOTHING;
    SELECT id_regla INTO v_regla FROM reglas WHERE codigo = r.codigo
      AND id_metrica = v_metrica AND categoria = r.categoria;
    IF v_regla IS NULL THEN RAISE EXCEPTION 'Regla % publicada con otra métrica o categoría', r.codigo; END IF;
    INSERT INTO reglas_config (id_conjunto_reglas, id_regla, comparador, umbral, muestra_minima, direccion_favorable, umbral_mejora)
    VALUES (v_conjunto, v_regla, r.comparador, r.umbral, 5, r.direccion, 0)
    ON CONFLICT (id_conjunto_reglas, id_regla) DO NOTHING;
    IF NOT EXISTS (SELECT 1 FROM reglas_config WHERE id_conjunto_reglas = v_conjunto AND id_regla = v_regla
      AND comparador = r.comparador AND umbral = r.umbral AND muestra_minima = 5
      AND direccion_favorable = r.direccion AND umbral_mejora = 0) THEN
      RAISE EXCEPTION 'Configuración v4 de % ya publicada con otros valores', r.codigo;
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM reglas_config WHERE id_conjunto_reglas = v_conjunto) <> 3 THEN
    RAISE EXCEPTION 'V4 debe contener exactamente tres reglas';
  END IF;
END $$;
COMMIT;
