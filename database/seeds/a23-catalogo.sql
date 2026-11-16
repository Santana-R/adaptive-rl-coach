-- A23 · Seed del catálogo inicial (mvp.catalog.v1).
-- ARCHIVO GENERADO por scripts/generar-seed-a23.cjs. No editar a mano.
-- Fuentes: planning/catalogo-ejercicios.v1.json (Roberto) y planning/catalogo-verificacion.v1.json (David).
--
-- Se ejecuta en el SQL Editor de Supabase. Se puede volver a ejecutar:
--   * Si la versión no existe, inserta ejercicio + versión + plataformas.
--   * Si ya existe con el mismo contenido, solo actualiza ejercicios.activo según la comprobación.
--   * Si ya existe con otro contenido, se detiene sin cambiar nada (las versiones son inmutables).
-- activo = true solo para los ejercicios con status 'verified' en el registro de comprobación.

BEGIN;

DO $$
DECLARE
  v_row public.ejercicio_versiones%ROWTYPE;
  v_plataformas text;
  v_ejercicio bigint;
  v_version bigint;
BEGIN

  -- castro-ground-shots · versión 1
  SELECT ev.* INTO v_row FROM public.ejercicio_versiones ev
   WHERE ev.nombre = 'Ground Shots — Castro' AND ev.version = 1;
  IF FOUND THEN
    SELECT string_agg(plataforma, ',' ORDER BY plataforma) INTO v_plataformas
      FROM public.ejercicio_plataforma WHERE id_ejercicio_version = v_row.id_ejercicio_version;
    IF v_row.categoria IS DISTINCT FROM 'shooting'
       OR v_row.tipo_recurso IS DISTINCT FROM 'custom_training'
       OR v_row.codigo_enlace IS DISTINCT FROM '9472-6A26-7F5D-767B'
       OR v_row.finalidad IS DISTINCT FROM 'Practicar contacto después del bote, consistencia, colocación y potencia de finalización.'
       OR v_row.instrucciones IS DISTINCT FROM E'Abrir Entrenamiento personalizado e introducir el código del paquete.\nPracticar el paquete base sin BakkesMod y sin añadir aleatorización externa.\nEsperar el bote y golpear justo después; adaptar la colocación al nivel de práctica.\nRecorrer las posiciones en orden, con máximo tres intentos por posición antes de avanzar.\nPracticar durante los minutos asignados; no es necesario completar todo el paquete.'
       OR v_row.meta IS DISTINCT FROM 'Buscar el gol tras el contacto posterior al bote; después trabajar la zona elegida y la potencia según el nivel. No se impone una velocidad ni tasa de acierto calibrada.'
       OR v_row.dificultad_base IS DISTINCT FROM 1
       OR v_row.minutos_base IS DISTINCT FROM 10
       OR v_plataformas IS DISTINCT FROM 'epic,steam' THEN
      RAISE EXCEPTION 'A23: % versión % ya existe con otro contenido. No se sobrescribe: crear otra versión.',
        'Ground Shots — Castro', 1;
    END IF;
    UPDATE public.ejercicios SET activo = true
     WHERE id_ejercicio = v_row.id_ejercicio AND eliminado_en IS NULL;
    RAISE NOTICE 'A23: % ya existía; activo = %', 'Ground Shots — Castro', true;
  ELSE
    INSERT INTO public.ejercicios (activo) VALUES (true) RETURNING id_ejercicio INTO v_ejercicio;
    INSERT INTO public.ejercicio_versiones
      (id_ejercicio, version, nombre, categoria, tipo_recurso, codigo_enlace, finalidad, instrucciones, meta, dificultad_base, minutos_base)
    VALUES (v_ejercicio, 1, 'Ground Shots — Castro', 'shooting', 'custom_training', '9472-6A26-7F5D-767B',
      'Practicar contacto después del bote, consistencia, colocación y potencia de finalización.',
      E'Abrir Entrenamiento personalizado e introducir el código del paquete.\nPracticar el paquete base sin BakkesMod y sin añadir aleatorización externa.\nEsperar el bote y golpear justo después; adaptar la colocación al nivel de práctica.\nRecorrer las posiciones en orden, con máximo tres intentos por posición antes de avanzar.\nPracticar durante los minutos asignados; no es necesario completar todo el paquete.',
      'Buscar el gol tras el contacto posterior al bote; después trabajar la zona elegida y la potencia según el nivel. No se impone una velocidad ni tasa de acierto calibrada.',
      1, 10)
    RETURNING id_ejercicio_version INTO v_version;
    INSERT INTO public.ejercicio_plataforma (id_ejercicio_version, plataforma) VALUES
      (v_version, 'epic'), (v_version, 'steam');
    RAISE NOTICE 'A23: % insertado; activo = %', 'Ground Shots — Castro', true;
  END IF;

  -- castro-mid-height-shots · versión 1
  SELECT ev.* INTO v_row FROM public.ejercicio_versiones ev
   WHERE ev.nombre = 'Mid Height Shots — Castro' AND ev.version = 1;
  IF FOUND THEN
    SELECT string_agg(plataforma, ',' ORDER BY plataforma) INTO v_plataformas
      FROM public.ejercicio_plataforma WHERE id_ejercicio_version = v_row.id_ejercicio_version;
    IF v_row.categoria IS DISTINCT FROM 'shooting'
       OR v_row.tipo_recurso IS DISTINCT FROM 'custom_training'
       OR v_row.codigo_enlace IS DISTINCT FROM 'E6E3-1E82-E6DE-C4B4'
       OR v_row.finalidad IS DISTINCT FROM 'Practicar finalización de balones elevados que permiten aprovechar el flip para generar potencia.'
       OR v_row.instrucciones IS DISTINCT FROM E'Abrir Entrenamiento personalizado e introducir el código del paquete.\nPracticar el paquete base sin BakkesMod y sin añadir aleatorización externa.\nBuscar finalizar directamente y aprovechar el flip cuando sea posible; adaptar la colocación al nivel de práctica.\nRecorrer las posiciones en orden, con máximo tres intentos por posición antes de avanzar.\nPracticar durante los minutos asignados; no es necesario completar todo el paquete.'
       OR v_row.meta IS DISTINCT FROM 'Buscar gol directo con contacto controlado; añadir zona elegida y potencia según el nivel. No se exige una mecánica avanzada adicional.'
       OR v_row.dificultad_base IS DISTINCT FROM 1
       OR v_row.minutos_base IS DISTINCT FROM 5
       OR v_plataformas IS DISTINCT FROM 'epic,steam' THEN
      RAISE EXCEPTION 'A23: % versión % ya existe con otro contenido. No se sobrescribe: crear otra versión.',
        'Mid Height Shots — Castro', 1;
    END IF;
    UPDATE public.ejercicios SET activo = true
     WHERE id_ejercicio = v_row.id_ejercicio AND eliminado_en IS NULL;
    RAISE NOTICE 'A23: % ya existía; activo = %', 'Mid Height Shots — Castro', true;
  ELSE
    INSERT INTO public.ejercicios (activo) VALUES (true) RETURNING id_ejercicio INTO v_ejercicio;
    INSERT INTO public.ejercicio_versiones
      (id_ejercicio, version, nombre, categoria, tipo_recurso, codigo_enlace, finalidad, instrucciones, meta, dificultad_base, minutos_base)
    VALUES (v_ejercicio, 1, 'Mid Height Shots — Castro', 'shooting', 'custom_training', 'E6E3-1E82-E6DE-C4B4',
      'Practicar finalización de balones elevados que permiten aprovechar el flip para generar potencia.',
      E'Abrir Entrenamiento personalizado e introducir el código del paquete.\nPracticar el paquete base sin BakkesMod y sin añadir aleatorización externa.\nBuscar finalizar directamente y aprovechar el flip cuando sea posible; adaptar la colocación al nivel de práctica.\nRecorrer las posiciones en orden, con máximo tres intentos por posición antes de avanzar.\nPracticar durante los minutos asignados; no es necesario completar todo el paquete.',
      'Buscar gol directo con contacto controlado; añadir zona elegida y potencia según el nivel. No se exige una mecánica avanzada adicional.',
      1, 5)
    RETURNING id_ejercicio_version INTO v_version;
    INSERT INTO public.ejercicio_plataforma (id_ejercicio_version, plataforma) VALUES
      (v_version, 'epic'), (v_version, 'steam');
    RAISE NOTICE 'A23: % insertado; activo = %', 'Mid Height Shots — Castro', true;
  END IF;

  -- coco-aim-training · versión 1
  SELECT ev.* INTO v_row FROM public.ejercicio_versiones ev
   WHERE ev.nombre = 'Aim Training — CoCo' AND ev.version = 1;
  IF FOUND THEN
    SELECT string_agg(plataforma, ',' ORDER BY plataforma) INTO v_plataformas
      FROM public.ejercicio_plataforma WHERE id_ejercicio_version = v_row.id_ejercicio_version;
    IF v_row.categoria IS DISTINCT FROM 'shooting'
       OR v_row.tipo_recurso IS DISTINCT FROM 'steam_workshop'
       OR v_row.codigo_enlace IS DISTINCT FROM 'https://steamcommunity.com/sharedfiles/filedetails/?id=1906378036'
       OR v_row.finalidad IS DISTINCT FROM 'Practicar precisión y consistencia de contacto contra objetivos con dificultad elegida.'
       OR v_row.instrucciones IS DISTINCT FROM E'Abrir el mapa desde Steam Workshop y seleccionar una sola variante para el bloque de práctica.\nEn Normal, comprobar los tres ajustes de la variante antes de empezar; no se deduce su estado por la captura de ejemplo.\nBuscar contactos controlados contra el objetivo durante los minutos asignados, sin reiniciar el cronómetro después de fallar.\nRegistrar manualmente minutos realizados, variante, ajustes y mejor racha del bloque.\nSi la dificultad resulta excesiva, elegir una variante más sencilla y registrar el cambio como otro bloque de práctica.'
       OR v_row.meta IS DISTINCT FROM 'Trabajar contactos controlados y consistencia; conservar la mejor racha como práctica autorreportada, sin establecer un umbral para acreditar mejora.'
       OR v_row.dificultad_base IS DISTINCT FROM 1
       OR v_row.minutos_base IS DISTINCT FROM 5
       OR v_plataformas IS DISTINCT FROM 'steam' THEN
      RAISE EXCEPTION 'A23: % versión % ya existe con otro contenido. No se sobrescribe: crear otra versión.',
        'Aim Training — CoCo', 1;
    END IF;
    UPDATE public.ejercicios SET activo = true
     WHERE id_ejercicio = v_row.id_ejercicio AND eliminado_en IS NULL;
    RAISE NOTICE 'A23: % ya existía; activo = %', 'Aim Training — CoCo', true;
  ELSE
    INSERT INTO public.ejercicios (activo) VALUES (true) RETURNING id_ejercicio INTO v_ejercicio;
    INSERT INTO public.ejercicio_versiones
      (id_ejercicio, version, nombre, categoria, tipo_recurso, codigo_enlace, finalidad, instrucciones, meta, dificultad_base, minutos_base)
    VALUES (v_ejercicio, 1, 'Aim Training — CoCo', 'shooting', 'steam_workshop', 'https://steamcommunity.com/sharedfiles/filedetails/?id=1906378036',
      'Practicar precisión y consistencia de contacto contra objetivos con dificultad elegida.',
      E'Abrir el mapa desde Steam Workshop y seleccionar una sola variante para el bloque de práctica.\nEn Normal, comprobar los tres ajustes de la variante antes de empezar; no se deduce su estado por la captura de ejemplo.\nBuscar contactos controlados contra el objetivo durante los minutos asignados, sin reiniciar el cronómetro después de fallar.\nRegistrar manualmente minutos realizados, variante, ajustes y mejor racha del bloque.\nSi la dificultad resulta excesiva, elegir una variante más sencilla y registrar el cambio como otro bloque de práctica.',
      'Trabajar contactos controlados y consistencia; conservar la mejor racha como práctica autorreportada, sin establecer un umbral para acreditar mejora.',
      1, 5)
    RETURNING id_ejercicio_version INTO v_version;
    INSERT INTO public.ejercicio_plataforma (id_ejercicio_version, plataforma) VALUES
      (v_version, 'steam');
    RAISE NOTICE 'A23: % insertado; activo = %', 'Aim Training — CoCo', true;
  END IF;

END $$;

COMMIT;

-- Comprobación (ejecutar aparte):
--   SELECT e.id_ejercicio, e.activo, v.version, v.nombre, v.tipo_recurso, v.codigo_enlace,
--          string_agg(p.plataforma, ',' ORDER BY p.plataforma) AS plataformas
--   FROM public.ejercicios e
--   JOIN public.ejercicio_versiones v USING (id_ejercicio)
--   LEFT JOIN public.ejercicio_plataforma p USING (id_ejercicio_version)
--   GROUP BY e.id_ejercicio, e.activo, v.version, v.nombre, v.tipo_recurso, v.codigo_enlace
--   ORDER BY e.id_ejercicio, v.version;
