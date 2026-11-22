-- Registra las versiones iniciales de las rutinas incluidas en los catálogos nativos.
-- Ejecutar después de cargar el esquema, A23 y las configuraciones de reglas de A26.
-- Conserva el estado, las versiones vigentes y las referencias de sesiones existentes.
BEGIN;

LOCK TABLE public.ejercicios, public.ejercicio_versiones, public.ejercicio_plataforma
  IN SHARE ROW EXCLUSIVE MODE;

DO $seed$
DECLARE
  v_input record;
  v_existing public.ejercicio_versiones%ROWTYPE;
  v_platforms text[];
  v_exercise_id bigint;
  v_version_id bigint;
BEGIN
  FOR v_input IN SELECT * FROM jsonb_to_recordset($routines$
[
  {
    "version": 1,
    "nombre": "Rutas de pads y recuperaciones",
    "categoria": "boost",
    "tipo_recurso": "free_play",
    "codigo_enlace": "https://dignitas.gg/articles/how-to-manage-your-boost-in-rocket-league-with-apparentlyjack",
    "finalidad": "Practicar recarga durante desplazamientos y conservación del movimiento.",
    "instrucciones": "Abrir Juego libre y desactivar boost ilimitado. No requiere paquetes, Workshop ni BakkesMod.\nSin perseguir la pelota, recorrer rutas desde ambas bandas y el centro hacia una posición defensiva elegida.\nRecoger pads pequeños durante el recorrido sin desviarse para llenar el tanque.\nPracticar giros y aterrizajes sobre las cuatro ruedas conservando el movimiento; evitar gastar boost solo por regresar antes.\nPracticar durante los minutos asignados. Registrar manualmente qué rutas o recuperaciones costaron más.",
    "meta": "Completar rutas recogiendo pads y conservar movimiento al aterrizar. La práctica es autorreportada; no acredita mejora en partidas.",
    "dificultad_base": 1,
    "minutos_base": 5,
    "plataformas": [
      "epic",
      "steam"
    ]
  },
  {
    "version": 1,
    "nombre": "Golpeo, seguimiento y recarga",
    "categoria": "boost",
    "tipo_recurso": "free_play",
    "codigo_enlace": "https://dignitas.gg/articles/how-to-manage-your-boost-in-rocket-league-with-apparentlyjack",
    "finalidad": "Combinar contacto con la pelota, recuperación y recarga para preparar el siguiente toque.",
    "instrucciones": "Abrir Juego libre y desactivar boost ilimitado. No requiere paquetes, Workshop ni BakkesMod.\nGolpear la pelota hacia una zona elegida y recuperar el coche tras el contacto.\nPreparar el siguiente toque recogiendo pads pequeños sobre una ruta útil, sin buscar llenar el tanque a toda costa.\nUsar el boost necesario para la jugada y evitar correcciones bruscas que destruyan el movimiento.\nRepetir durante los minutos asignados. Es un ejercicio mecánico: perseguir la pelota aquí no prescribe una rotación para ranked.",
    "meta": "Encadenar contacto, recuperación y recarga con control. Registrar dificultades manualmente; no hay un porcentaje de éxito calibrado.",
    "dificultad_base": 1,
    "minutos_base": 5,
    "plataformas": [
      "epic",
      "steam"
    ]
  },
  {
    "version": 1,
    "nombre": "Revisión de cobertura defensiva",
    "categoria": "defensive_review",
    "tipo_recurso": "native_replay_review",
    "codigo_enlace": "https://dignitas.gg/articles/a-guide-to-defense-in-rocket-league-with-apparentlyjack",
    "finalidad": "Revisar preparación, cobertura y decisión de entrar o temporizar en situaciones de último defensor.",
    "instrucciones": "Abrir manualmente en Rocket League una replay guardada de las partidas señaladas. No requiere paquetes, Workshop, BakkesMod ni compañero de práctica.\nRecorrer los goles recibidos y retroceder aproximadamente diez segundos para observar la preparación de la jugada.\nComprobar visualmente si ocupabas el papel de último defensor. El conteo agregado no indica el minuto ni cuáles goles corresponden; continuar con otro gol si no corresponde.\nIdentificar las opciones del rival y qué debías cubrir, valorar entrar o ganar tiempo y observar la recuperación de tu compañero.\nAnotar una decisión alternativa concreta o que no identificas una alternativa clara. Si no logras localizar una situación, registrar esa dificultad sin inventar un error.\nDetener la actividad al cumplir los minutos asignados. Diez minutos es una referencia, no un tiempo obligatorio; con más tiempo se pueden revisar más situaciones.",
    "meta": "Dedicar los minutos asignados y registrar qué se pudo revisar y una observación o dificultad. Es una revisión autorreportada, no una prueba de error ni de mejora competitiva.",
    "dificultad_base": 1,
    "minutos_base": 10,
    "plataformas": [
      "epic",
      "steam"
    ]
  }
]
$routines$::jsonb) AS content (
    version integer, nombre text, categoria text, tipo_recurso text, codigo_enlace text,
    finalidad text, instrucciones text, meta text, dificultad_base smallint,
    minutos_base smallint, plataformas text[]
  )
  LOOP
    SELECT * INTO v_existing FROM public.ejercicio_versiones
    WHERE nombre = v_input.nombre AND version = v_input.version
    ORDER BY id_ejercicio_version LIMIT 1;

    IF FOUND THEN
      SELECT array_agg(plataforma::text ORDER BY plataforma) INTO v_platforms
      FROM public.ejercicio_plataforma WHERE id_ejercicio_version = v_existing.id_ejercicio_version;

      IF ROW(v_existing.categoria::text, v_existing.tipo_recurso::text, v_existing.codigo_enlace,
          v_existing.finalidad, v_existing.instrucciones, v_existing.meta, v_existing.dificultad_base,
          v_existing.minutos_base, v_platforms)
        IS DISTINCT FROM ROW(v_input.categoria, v_input.tipo_recurso, v_input.codigo_enlace,
          v_input.finalidad, v_input.instrucciones, v_input.meta, v_input.dificultad_base,
          v_input.minutos_base, v_input.plataformas)
      THEN
        RAISE EXCEPTION 'La versión % de % ya existe con otro contenido.',
          v_input.version, v_input.nombre;
      END IF;
      CONTINUE;
    END IF;

    INSERT INTO public.ejercicios (activo) VALUES (true) RETURNING id_ejercicio INTO v_exercise_id;
    INSERT INTO public.ejercicio_versiones
      (id_ejercicio, version, nombre, categoria, tipo_recurso, codigo_enlace, finalidad, instrucciones,
       meta, dificultad_base, minutos_base)
    VALUES (v_exercise_id, v_input.version, v_input.nombre, v_input.categoria, v_input.tipo_recurso,
      v_input.codigo_enlace, v_input.finalidad, v_input.instrucciones, v_input.meta,
      v_input.dificultad_base, v_input.minutos_base)
    RETURNING id_ejercicio_version INTO v_version_id;

    INSERT INTO public.ejercicio_plataforma (id_ejercicio_version, plataforma)
    SELECT v_version_id, plataforma FROM unnest(v_input.plataformas) AS plataformas(plataforma);
  END LOOP;
END;
$seed$;

COMMIT;
