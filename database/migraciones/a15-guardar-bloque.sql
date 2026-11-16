-- A15 · Guardar un bloque completo en una sola transacción.
-- Se ejecuta UNA vez en el SQL Editor de Supabase, después de las migraciones de A08.
-- No crea, modifica ni borra tablas ni filas existentes. Se puede volver a ejecutar.
--
-- Por qué: guardar un bloque toca cuatro tablas (bloques, archivos_replay,
-- jugadores_replay, replays) y opcionalmente metricas_replay/metricas_bloque.
-- supabase-js no tiene transacciones; una función de Postgres sí: si algo falla
-- (posición repetida, CHECK, FK), no queda nada guardado a medias.
--
-- Sin duplicados:
--   - archivos_replay se reutiliza por hash_archivo (UNIQUE): el mismo .replay
--     subido otra vez no crea otra fila.
--   - jugadores_replay se reutiliza por (id_archivo, plataforma, cuenta_jugador).
--   - metricas_replay y metricas_bloque tienen una fila por clave primaria (upsert).
--   - replays: UNIQUE (id_bloque, posicion) y (id_bloque, id_jugador_replay)
--     rechazan el mismo replay dos veces en un bloque (error 23505).
-- Los null del JSON se guardan como NULL (no se convierten en 0).
--
-- Permisos: solo service_role (Express) puede ejecutarla. El propietario lo
-- decide Express con la sesión verificada (req.user.id), nunca el navegador.

CREATE OR REPLACE FUNCTION public.a15_guardar_bloque(p_id_usuario uuid, p_bloque jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_id_bloque  bigint;
  v_id_archivo bigint;
  v_id_jugador bigint;
  v_estado     text := p_bloque->>'estado';
  v_replay     jsonb;
  v_archivo    jsonb;
  v_jugador    jsonb;
  v_metricas   jsonb;
BEGIN
  IF p_id_usuario IS NULL THEN
    RAISE EXCEPTION 'Falta el propietario del bloque' USING ERRCODE = '22004';
  END IF;

  INSERT INTO bloques (id_usuario, modalidad, tipo_partida, ballchasing_grupo_id, estado, completado_en)
  VALUES (
    p_id_usuario,
    p_bloque->>'modalidad',
    p_bloque->>'tipo_partida',
    p_bloque->>'ballchasing_grupo_id',
    v_estado,
    CASE WHEN v_estado = 'completo' THEN now() END
  )
  RETURNING id_bloque INTO v_id_bloque;

  FOR v_replay IN SELECT value FROM jsonb_array_elements(COALESCE(p_bloque->'replays', '[]'::jsonb))
  LOOP
    v_archivo := v_replay->'archivo';
    v_jugador := v_replay->'jugador';

    -- Archivo: reutilizar por hash. DO UPDATE sin cambios para obtener el id con RETURNING.
    INSERT INTO archivos_replay (hash_archivo, tamano_bytes, modalidad, tipo_partida, fecha_partida, duracion_s)
    VALUES (
      lower(v_archivo->>'hash_archivo'),
      (v_archivo->>'tamano_bytes')::bigint,
      v_archivo->>'modalidad',
      v_archivo->>'tipo_partida',
      (v_archivo->>'fecha_partida')::timestamptz,
      (v_archivo->>'duracion_s')::integer
    )
    ON CONFLICT (hash_archivo) DO UPDATE SET hash_archivo = EXCLUDED.hash_archivo
    RETURNING id_archivo INTO v_id_archivo;

    INSERT INTO jugadores_replay (id_archivo, plataforma, cuenta_jugador, tiempo_jugado_s)
    VALUES (
      v_id_archivo,
      v_jugador->>'plataforma',
      v_jugador->>'cuenta_jugador',
      (v_jugador->>'tiempo_jugado_s')::numeric
    )
    ON CONFLICT (id_archivo, plataforma, cuenta_jugador)
      DO UPDATE SET tiempo_jugado_s = COALESCE(EXCLUDED.tiempo_jugado_s, jugadores_replay.tiempo_jugado_s)
    RETURNING id_jugador_replay INTO v_id_jugador;

    INSERT INTO replays (id_bloque, id_jugador_replay, posicion, nombre_archivo, ballchasing_id, estado, error,
                         origen_carga, visibilidad, acceso_verificado, grupo_verificado, limpieza_estado)
    VALUES (
      v_id_bloque,
      v_id_jugador,
      (v_replay->>'posicion')::smallint,
      v_replay->>'nombre_archivo',
      v_replay->>'ballchasing_id',
      v_replay->>'estado',
      v_replay->>'error',
      v_replay->>'origen_carga',
      v_replay->>'visibilidad',
      COALESCE((v_replay->>'acceso_verificado')::boolean, false),
      COALESCE((v_replay->>'grupo_verificado')::boolean, false),
      v_replay->>'limpieza_estado'
    );

    v_metricas := v_replay->'metricas';
    IF v_metricas IS NOT NULL AND jsonb_typeof(v_metricas) = 'object' THEN
      INSERT INTO metricas_replay (id_jugador_replay, tiros, goles, asistencias, salvadas, puntos,
                                   boost_cero_s, boost_bajo_s, pads_pequenos, velocidad_media,
                                   distancia_companeros, zona_defensiva_s)
      VALUES (
        v_id_jugador,
        (v_metricas->>'tiros')::integer,
        (v_metricas->>'goles')::integer,
        (v_metricas->>'asistencias')::integer,
        (v_metricas->>'salvadas')::integer,
        (v_metricas->>'puntos')::integer,
        (v_metricas->>'boost_cero_s')::numeric,
        (v_metricas->>'boost_bajo_s')::numeric,
        (v_metricas->>'pads_pequenos')::integer,
        (v_metricas->>'velocidad_media')::numeric,
        (v_metricas->>'distancia_companeros')::numeric,
        (v_metricas->>'zona_defensiva_s')::numeric
      )
      ON CONFLICT (id_jugador_replay) DO UPDATE SET
        tiros = EXCLUDED.tiros, goles = EXCLUDED.goles, asistencias = EXCLUDED.asistencias,
        salvadas = EXCLUDED.salvadas, puntos = EXCLUDED.puntos,
        boost_cero_s = EXCLUDED.boost_cero_s, boost_bajo_s = EXCLUDED.boost_bajo_s,
        pads_pequenos = EXCLUDED.pads_pequenos, velocidad_media = EXCLUDED.velocidad_media,
        distancia_companeros = EXCLUDED.distancia_companeros, zona_defensiva_s = EXCLUDED.zona_defensiva_s;
    END IF;
  END LOOP;

  v_metricas := p_bloque->'metricas';
  IF v_metricas IS NOT NULL AND jsonb_typeof(v_metricas) = 'object' THEN
    INSERT INTO metricas_bloque (id_bloque, version_calculo, tiempo_jugado_s, tiros_total, goles_total,
                                 boost_cero_s, boost_bajo_s, pads_pequenos_total, velocidad_media,
                                 distancia_companeros, zona_defensiva_s)
    VALUES (
      v_id_bloque,
      v_metricas->>'version_calculo',
      (v_metricas->>'tiempo_jugado_s')::numeric,
      (v_metricas->>'tiros_total')::integer,
      (v_metricas->>'goles_total')::integer,
      (v_metricas->>'boost_cero_s')::numeric,
      (v_metricas->>'boost_bajo_s')::numeric,
      (v_metricas->>'pads_pequenos_total')::integer,
      (v_metricas->>'velocidad_media')::numeric,
      (v_metricas->>'distancia_companeros')::numeric,
      (v_metricas->>'zona_defensiva_s')::numeric
    );
  END IF;

  RETURN v_id_bloque;
END;
$$;

REVOKE ALL ON FUNCTION public.a15_guardar_bloque(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.a15_guardar_bloque(uuid, jsonb) TO service_role;

-- Comprobaciones (ejecutar aparte):
--
-- 1) La función existe y solo service_role puede ejecutarla:
--   SELECT p.proname,
--          has_function_privilege('service_role',  p.oid, 'EXECUTE') AS service_role,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated,
--          has_function_privilege('anon',          p.oid, 'EXECUTE') AS anon
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND p.proname = 'a15_guardar_bloque';
--   Esperado: service_role = true, authenticated = false, anon = false.
--
-- 2) Consultas de integridad: database/migraciones/a15-integridad.sql
