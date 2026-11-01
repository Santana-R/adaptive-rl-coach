-- Adaptive RL Coach · estructura real capturada el 1 de noviembre de 2026.

-- Solo DDL: sin filas, credenciales ni cuentas de Supabase Auth.

-- Para un proyecto Supabase de desarrollo vacío, con auth.users y entorno provisionado.

-- No ejecutar sobre las 30 tablas existentes: no es una migración incremental.

-- Restauración en proyecto nuevo pendiente de prueba (A07/A38).

BEGIN;

CREATE SCHEMA IF NOT EXISTS arc_private;

REVOKE ALL ON SCHEMA arc_private FROM PUBLIC;

SET LOCAL search_path = public, extensions, pg_catalog;

CREATE TABLE public."analisis" (
  "id_analisis" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."analisis_id_analisis_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_bloque" bigint NOT NULL,
  "id_bloque_base" bigint,
  "id_conjunto_reglas" bigint NOT NULL,
  "explicacion" text NOT NULL,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."archivos_replay" (
  "id_archivo" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."archivos_replay_id_archivo_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "hash_archivo" character(64) NOT NULL,
  "tamano_bytes" bigint NOT NULL,
  "modalidad" character varying(20),
  "tipo_partida" character varying(20),
  "fecha_partida" timestamp with time zone,
  "duracion_s" integer
);

CREATE TABLE public."bloques" (
  "id_bloque" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."bloques_id_bloque_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_usuario" uuid NOT NULL,
  "modalidad" character varying(20) NOT NULL,
  "tipo_partida" character varying(20) NOT NULL,
  "ballchasing_grupo_id" text,
  "estado" character varying(20) NOT NULL,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL,
  "completado_en" timestamp with time zone
);

CREATE TABLE public."cambios_estado_usuario" (
  "id_cambio_estado" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."cambios_estado_usuario_id_cambio_estado_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_usuario" uuid NOT NULL,
  "id_administrador" uuid NOT NULL,
  "estado_nuevo" character varying(20) NOT NULL,
  "motivo" text NOT NULL,
  "fecha" timestamp with time zone NOT NULL
);

CREATE TABLE public."conjuntos_reglas" (
  "id_conjunto_reglas" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."conjuntos_reglas_id_conjunto_reglas_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "version" character varying(20) NOT NULL,
  "descripcion" text NOT NULL,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."ejercicio_plataforma" (
  "id_ejercicio_version" bigint NOT NULL,
  "plataforma" character varying(20) NOT NULL
);

CREATE TABLE public."ejercicio_versiones" (
  "id_ejercicio_version" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."ejercicio_versiones_id_ejercicio_version_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_ejercicio" bigint NOT NULL,
  "version" integer NOT NULL,
  "nombre" character varying(100) NOT NULL,
  "categoria" character varying(30) NOT NULL,
  "tipo_recurso" character varying(20) NOT NULL,
  "codigo_enlace" text,
  "finalidad" text NOT NULL,
  "instrucciones" text NOT NULL,
  "meta" text NOT NULL,
  "dificultad_base" smallint NOT NULL,
  "minutos_base" smallint NOT NULL,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."ejercicios" (
  "id_ejercicio" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."ejercicios_id_ejercicio_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "activo" boolean NOT NULL,
  "eliminado_en" timestamp with time zone
);

CREATE TABLE public."evaluacion_sesiones" (
  "id_evaluacion" bigint NOT NULL,
  "id_sesion_version" bigint NOT NULL
);

CREATE TABLE public."evaluaciones_objetivo" (
  "id_evaluacion" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."evaluaciones_objetivo_id_evaluacion_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_objetivo_version" bigint NOT NULL,
  "id_bloque" bigint,
  "fecha_corte" timestamp with time zone NOT NULL,
  "calculado_en" timestamp with time zone DEFAULT now() NOT NULL,
  "motivo_no_evaluable" text,
  "evidencia" text NOT NULL
);

CREATE TABLE public."jugadores_replay" (
  "id_jugador_replay" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."jugadores_replay_id_jugador_replay_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_archivo" bigint NOT NULL,
  "plataforma" character varying(20) NOT NULL,
  "cuenta_jugador" character varying(100) NOT NULL,
  "tiempo_jugado_s" numeric(10,3)
);

CREATE TABLE public."metricas" (
  "id_metrica" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."metricas_id_metrica_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "codigo" character varying(60) NOT NULL,
  "unidad" character varying(20) NOT NULL,
  "tipo" character varying(20) NOT NULL,
  "descripcion" text NOT NULL
);

CREATE TABLE public."metricas_bloque" (
  "id_bloque" bigint NOT NULL,
  "version_calculo" character varying(20) NOT NULL,
  "tiempo_jugado_s" numeric(12,3) NOT NULL,
  "tiros_total" integer,
  "goles_total" integer,
  "boost_cero_s" numeric(12,3),
  "boost_bajo_s" numeric(12,3),
  "pads_pequenos_total" integer,
  "velocidad_media" numeric(8,2),
  "distancia_companeros" numeric(10,2),
  "zona_defensiva_s" numeric(12,3)
);

CREATE TABLE public."metricas_replay" (
  "id_jugador_replay" bigint NOT NULL,
  "tiros" integer,
  "goles" integer,
  "asistencias" integer,
  "salvadas" integer,
  "puntos" integer,
  "boost_cero_s" numeric(10,3),
  "boost_bajo_s" numeric(10,3),
  "pads_pequenos" integer,
  "velocidad_media" numeric(8,2),
  "distancia_companeros" numeric(10,2),
  "zona_defensiva_s" numeric(10,3)
);

CREATE TABLE public."objetivo_versiones" (
  "id_objetivo_version" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."objetivo_versiones_id_objetivo_version_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_objetivo" bigint NOT NULL,
  "id_metrica" bigint NOT NULL,
  "id_bloque_base" bigint,
  "version" integer NOT NULL,
  "nombre" character varying(100) NOT NULL,
  "comparador" character varying(4) NOT NULL,
  "valor_meta" numeric(12,4) NOT NULL,
  "fecha_inicio" date NOT NULL,
  "fecha_limite" date,
  "zona_horaria" character varying(64) NOT NULL,
  "activada_en" timestamp with time zone,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."objetivos" (
  "id_objetivo" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."objetivos_id_objetivo_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_usuario" uuid NOT NULL,
  "tipo" character varying(20) NOT NULL,
  "modalidad" character varying(20) NOT NULL,
  "estado" character varying(20) NOT NULL,
  "archivado_en" timestamp with time zone
);

CREATE TABLE public."perfiles" (
  "id_usuario" uuid NOT NULL,
  "gamertag" character varying(60) NOT NULL,
  "plataforma" character varying(20) NOT NULL,
  "cuenta_juego_id" character varying(100) NOT NULL,
  "modalidad_principal" character varying(20) NOT NULL,
  "minutos_sesion" smallint NOT NULL,
  "dias_semana" smallint NOT NULL,
  "zona_horaria" character varying(64) NOT NULL
);

CREATE TABLE public."plan_ejercicio" (
  "id_plan_ejercicio" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."plan_ejercicio_id_plan_ejercicio_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_plan" bigint NOT NULL,
  "id_ejercicio_version" bigint NOT NULL,
  "id_prioridad" bigint NOT NULL,
  "orden" smallint NOT NULL,
  "minutos" smallint NOT NULL,
  "dificultad" smallint NOT NULL
);

CREATE TABLE public."plan_objetivo" (
  "id_plan_objetivo" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."plan_objetivo_id_plan_objetivo_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_plan" bigint NOT NULL,
  "id_objetivo_version" bigint NOT NULL
);

CREATE TABLE public."planes" (
  "id_plan" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."planes_id_plan_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_analisis" bigint NOT NULL,
  "version" integer NOT NULL,
  "estado" character varying(20) NOT NULL,
  "plataforma_destino" character varying(20) NOT NULL,
  "minutos_disponibles" smallint NOT NULL,
  "dias_disponibles" smallint NOT NULL,
  "sesiones_semana" smallint NOT NULL,
  "cumplimiento_previo_pct" numeric(5,2),
  "justificacion" text NOT NULL,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."prioridades" (
  "id_prioridad" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."prioridades_id_prioridad_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_analisis" bigint NOT NULL,
  "id_regla_config" bigint NOT NULL,
  "orden" smallint NOT NULL,
  "valor_actual" numeric(12,4) NOT NULL,
  "valor_base" numeric(12,4),
  "evidencia" text NOT NULL
);

CREATE TABLE public."rangos" (
  "id_rango" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."rangos_id_rango_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_usuario" uuid NOT NULL,
  "modalidad" character varying(20) NOT NULL,
  "temporada" character varying(20) NOT NULL,
  "rango" character varying(40) NOT NULL,
  "division" smallint,
  "fecha_registro" timestamp with time zone DEFAULT now() NOT NULL,
  "fuente" character varying(20) NOT NULL
);

CREATE TABLE public."reglas" (
  "id_regla" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."reglas_id_regla_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "codigo" character varying(40) NOT NULL,
  "id_metrica" bigint NOT NULL,
  "categoria" character varying(30) NOT NULL
);

CREATE TABLE public."reglas_config" (
  "id_regla_config" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."reglas_config_id_regla_config_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_conjunto_reglas" bigint NOT NULL,
  "id_regla" bigint NOT NULL,
  "comparador" character varying(4) NOT NULL,
  "umbral" numeric(12,4) NOT NULL,
  "muestra_minima" integer NOT NULL,
  "direccion_favorable" character varying(16) NOT NULL,
  "umbral_mejora" numeric(12,4) NOT NULL
);

CREATE TABLE public."replays" (
  "id_replay" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."replays_id_replay_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_bloque" bigint NOT NULL,
  "id_jugador_replay" bigint NOT NULL,
  "posicion" smallint NOT NULL,
  "nombre_archivo" character varying(255) NOT NULL,
  "ballchasing_id" text,
  "estado" character varying(12) NOT NULL,
  "error" text,
  "origen_carga" character varying(16) NOT NULL,
  "visibilidad" character varying(12),
  "acceso_verificado" boolean NOT NULL,
  "grupo_verificado" boolean NOT NULL,
  "limpieza_estado" character varying(20) NOT NULL
);

CREATE TABLE public."sesion_ejercicio" (
  "id_sesion_version" bigint NOT NULL,
  "id_plan_ejercicio" bigint NOT NULL,
  "minutos" smallint NOT NULL,
  "repeticiones" integer,
  "completado" boolean NOT NULL,
  "notas" text
);

CREATE TABLE public."sesion_versiones" (
  "id_sesion_version" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."sesion_versiones_id_sesion_version_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_sesion" bigint NOT NULL,
  "version" integer NOT NULL,
  "fecha_practica" timestamp with time zone NOT NULL,
  "dificultad_percibida" character varying(12) NOT NULL,
  "notas" text,
  "motivo_cambio" text,
  "registrado_en" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."sesiones" (
  "id_sesion" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."sesiones_id_sesion_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "id_plan" bigint NOT NULL,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL,
  "eliminado_en" timestamp with time zone,
  "motivo_exclusion" text
);

CREATE TABLE public."solicitudes_contacto" (
  "id_solicitud" bigint GENERATED ALWAYS AS IDENTITY (SEQUENCE NAME public."solicitudes_contacto_id_solicitud_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 NO CYCLE) NOT NULL,
  "nombre" character varying(100) NOT NULL,
  "correo" character varying(254) NOT NULL,
  "mensaje" text NOT NULL,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."usuarios" (
  "id_usuario" uuid NOT NULL,
  "nombre" character varying(100) NOT NULL,
  "rol" character varying(20) NOT NULL,
  "estado" character varying(20) NOT NULL,
  "creado_en" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public."analisis" ADD CONSTRAINT "ck_analisis_base_distinta" CHECK (id_bloque_base IS NULL OR id_bloque_base <> id_bloque);

ALTER TABLE public."analisis" ADD CONSTRAINT "ck_analisis_explicacion_texto" CHECK (length(btrim(explicacion)) > 0);

ALTER TABLE public."analisis" ADD CONSTRAINT "pk_analisis" PRIMARY KEY (id_analisis);

ALTER TABLE public."analisis" ADD CONSTRAINT "uq_analisis_1" UNIQUE (id_bloque);

ALTER TABLE public."archivos_replay" ADD CONSTRAINT "ck_archivos_replay_duracion" CHECK (duracion_s > 0);

ALTER TABLE public."archivos_replay" ADD CONSTRAINT "ck_archivos_replay_hash" CHECK (hash_archivo ~ '^[0-9a-fA-F]{64}$'::text);

ALTER TABLE public."archivos_replay" ADD CONSTRAINT "ck_archivos_replay_tamano" CHECK (tamano_bytes > 0);

ALTER TABLE public."archivos_replay" ADD CONSTRAINT "pk_archivos_replay" PRIMARY KEY (id_archivo);

ALTER TABLE public."archivos_replay" ADD CONSTRAINT "uq_archivos_replay_1" UNIQUE (hash_archivo);

ALTER TABLE public."bloques" ADD CONSTRAINT "ck_bloques_cierre" CHECK ((estado::text = 'completo'::text) = (completado_en IS NOT NULL));

ALTER TABLE public."bloques" ADD CONSTRAINT "ck_bloques_estado" CHECK (estado::text = ANY (ARRAY['borrador'::character varying, 'procesando'::character varying, 'espera_servicio'::character varying, 'requiere_correccion'::character varying, 'completo'::character varying]::text[]));

ALTER TABLE public."bloques" ADD CONSTRAINT "ck_bloques_estado_texto" CHECK (length(btrim(estado::text)) > 0);

ALTER TABLE public."bloques" ADD CONSTRAINT "ck_bloques_fechas" CHECK (completado_en IS NULL OR completado_en >= creado_en);

ALTER TABLE public."bloques" ADD CONSTRAINT "ck_bloques_modalidad_texto" CHECK (length(btrim(modalidad::text)) > 0);

ALTER TABLE public."bloques" ADD CONSTRAINT "ck_bloques_tipo_partida_texto" CHECK (length(btrim(tipo_partida::text)) > 0);

ALTER TABLE public."bloques" ADD CONSTRAINT "pk_bloques" PRIMARY KEY (id_bloque);

ALTER TABLE public."cambios_estado_usuario" ADD CONSTRAINT "ck_cambios_estado_usuario_estado" CHECK (estado_nuevo::text = ANY (ARRAY['activo'::character varying, 'suspendido'::character varying]::text[]));

ALTER TABLE public."cambios_estado_usuario" ADD CONSTRAINT "ck_cambios_estado_usuario_estado_nuevo_texto" CHECK (length(btrim(estado_nuevo::text)) > 0);

ALTER TABLE public."cambios_estado_usuario" ADD CONSTRAINT "ck_cambios_estado_usuario_motivo_texto" CHECK (length(btrim(motivo)) > 0);

ALTER TABLE public."cambios_estado_usuario" ADD CONSTRAINT "pk_cambios_estado_usuario" PRIMARY KEY (id_cambio_estado);

ALTER TABLE public."conjuntos_reglas" ADD CONSTRAINT "ck_conjuntos_reglas_descripcion_texto" CHECK (length(btrim(descripcion)) > 0);

ALTER TABLE public."conjuntos_reglas" ADD CONSTRAINT "ck_conjuntos_reglas_version_texto" CHECK (length(btrim(version::text)) > 0);

ALTER TABLE public."conjuntos_reglas" ADD CONSTRAINT "pk_conjuntos_reglas" PRIMARY KEY (id_conjunto_reglas);

ALTER TABLE public."conjuntos_reglas" ADD CONSTRAINT "uq_conjuntos_reglas_1" UNIQUE (version);

ALTER TABLE public."ejercicio_plataforma" ADD CONSTRAINT "ck_ejercicio_plataforma_plataforma_texto" CHECK (length(btrim(plataforma::text)) > 0);

ALTER TABLE public."ejercicio_plataforma" ADD CONSTRAINT "pk_ejercicio_plataforma" PRIMARY KEY (id_ejercicio_version, plataforma);

ALTER TABLE public."ejercicio_versiones" ADD CONSTRAINT "ck_ejercicio_versiones_categoria_texto" CHECK (length(btrim(categoria::text)) > 0);

ALTER TABLE public."ejercicio_versiones" ADD CONSTRAINT "ck_ejercicio_versiones_dificultad_base_rango" CHECK (dificultad_base > 0);

ALTER TABLE public."ejercicio_versiones" ADD CONSTRAINT "ck_ejercicio_versiones_finalidad_texto" CHECK (length(btrim(finalidad)) > 0);

ALTER TABLE public."ejercicio_versiones" ADD CONSTRAINT "ck_ejercicio_versiones_instrucciones_texto" CHECK (length(btrim(instrucciones)) > 0);

ALTER TABLE public."ejercicio_versiones" ADD CONSTRAINT "ck_ejercicio_versiones_meta_texto" CHECK (length(btrim(meta)) > 0);

ALTER TABLE public."ejercicio_versiones" ADD CONSTRAINT "ck_ejercicio_versiones_minutos_base_rango" CHECK (minutos_base > 0);

ALTER TABLE public."ejercicio_versiones" ADD CONSTRAINT "ck_ejercicio_versiones_nombre_texto" CHECK (length(btrim(nombre::text)) > 0);

ALTER TABLE public."ejercicio_versiones" ADD CONSTRAINT "ck_ejercicio_versiones_tipo_recurso_texto" CHECK (length(btrim(tipo_recurso::text)) > 0);

ALTER TABLE public."ejercicio_versiones" ADD CONSTRAINT "ck_ejercicio_versiones_version_positiva" CHECK (version >= 1);

ALTER TABLE public."ejercicio_versiones" ADD CONSTRAINT "pk_ejercicio_versiones" PRIMARY KEY (id_ejercicio_version);

ALTER TABLE public."ejercicio_versiones" ADD CONSTRAINT "uq_ejercicio_versiones_1" UNIQUE (id_ejercicio, version);

ALTER TABLE public."ejercicios" ADD CONSTRAINT "ck_ejercicios_baja" CHECK (NOT activo OR eliminado_en IS NULL);

ALTER TABLE public."ejercicios" ADD CONSTRAINT "pk_ejercicios" PRIMARY KEY (id_ejercicio);

ALTER TABLE public."evaluacion_sesiones" ADD CONSTRAINT "pk_evaluacion_sesiones" PRIMARY KEY (id_evaluacion, id_sesion_version);

ALTER TABLE public."evaluaciones_objetivo" ADD CONSTRAINT "ck_evaluaciones_objetivo_evidencia_texto" CHECK (length(btrim(evidencia)) > 0);

ALTER TABLE public."evaluaciones_objetivo" ADD CONSTRAINT "ck_evaluaciones_objetivo_fechas" CHECK (fecha_corte <= calculado_en);

ALTER TABLE public."evaluaciones_objetivo" ADD CONSTRAINT "pk_evaluaciones_objetivo" PRIMARY KEY (id_evaluacion);

ALTER TABLE public."jugadores_replay" ADD CONSTRAINT "ck_jugadores_replay_cuenta_jugador_texto" CHECK (length(btrim(cuenta_jugador::text)) > 0);

ALTER TABLE public."jugadores_replay" ADD CONSTRAINT "ck_jugadores_replay_plataforma_texto" CHECK (length(btrim(plataforma::text)) > 0);

ALTER TABLE public."jugadores_replay" ADD CONSTRAINT "ck_jugadores_replay_tiempo" CHECK (tiempo_jugado_s >= 0::numeric);

ALTER TABLE public."jugadores_replay" ADD CONSTRAINT "ck_jugadores_replay_tiempo_jugado_s_finito" CHECK (tiempo_jugado_s <> 'NaN'::numeric);

ALTER TABLE public."jugadores_replay" ADD CONSTRAINT "pk_jugadores_replay" PRIMARY KEY (id_jugador_replay);

ALTER TABLE public."jugadores_replay" ADD CONSTRAINT "uq_jugadores_replay_1" UNIQUE (id_archivo, plataforma, cuenta_jugador);

ALTER TABLE public."metricas" ADD CONSTRAINT "ck_metricas_codigo_texto" CHECK (length(btrim(codigo::text)) > 0);

ALTER TABLE public."metricas" ADD CONSTRAINT "ck_metricas_descripcion_texto" CHECK (length(btrim(descripcion)) > 0);

ALTER TABLE public."metricas" ADD CONSTRAINT "ck_metricas_tipo" CHECK (tipo::text = ANY (ARRAY['rendimiento'::character varying, 'entrenamiento'::character varying]::text[]));

ALTER TABLE public."metricas" ADD CONSTRAINT "ck_metricas_tipo_texto" CHECK (length(btrim(tipo::text)) > 0);

ALTER TABLE public."metricas" ADD CONSTRAINT "ck_metricas_unidad_texto" CHECK (length(btrim(unidad::text)) > 0);

ALTER TABLE public."metricas" ADD CONSTRAINT "pk_metricas" PRIMARY KEY (id_metrica);

ALTER TABLE public."metricas" ADD CONSTRAINT "uq_metricas_1" UNIQUE (codigo);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_boost_bajo_s_denominador" CHECK (boost_bajo_s <= tiempo_jugado_s);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_boost_bajo_s_finito" CHECK (boost_bajo_s <> 'NaN'::numeric);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_boost_bajo_s_rango" CHECK (boost_bajo_s >= 0::numeric);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_boost_cero_s_denominador" CHECK (boost_cero_s <= tiempo_jugado_s);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_boost_cero_s_finito" CHECK (boost_cero_s <> 'NaN'::numeric);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_boost_cero_s_rango" CHECK (boost_cero_s >= 0::numeric);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_boost_inclusion" CHECK (boost_cero_s IS NULL OR boost_bajo_s IS NULL OR boost_cero_s <= boost_bajo_s);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_distancia_companeros_finito" CHECK (distancia_companeros <> 'NaN'::numeric);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_distancia_companeros_rango" CHECK (distancia_companeros >= 0::numeric);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_goles_total_rango" CHECK (goles_total >= 0);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_pads_pequenos_total_rango" CHECK (pads_pequenos_total >= 0);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_tiempo_jugado_s_finito" CHECK (tiempo_jugado_s <> 'NaN'::numeric);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_tiempo_jugado_s_rango" CHECK (tiempo_jugado_s > 0::numeric);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_tiros_total_rango" CHECK (tiros_total >= 0);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_velocidad_media_finito" CHECK (velocidad_media <> 'NaN'::numeric);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_velocidad_media_rango" CHECK (velocidad_media >= 0::numeric);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_version_calculo_texto" CHECK (length(btrim(version_calculo::text)) > 0);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_zona_defensiva_s_denominador" CHECK (zona_defensiva_s <= tiempo_jugado_s);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_zona_defensiva_s_finito" CHECK (zona_defensiva_s <> 'NaN'::numeric);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "ck_metricas_bloque_zona_defensiva_s_rango" CHECK (zona_defensiva_s >= 0::numeric);

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "pk_metricas_bloque" PRIMARY KEY (id_bloque);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_asistencias_rango" CHECK (asistencias >= 0);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_boost_bajo_s_finito" CHECK (boost_bajo_s <> 'NaN'::numeric);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_boost_bajo_s_rango" CHECK (boost_bajo_s >= 0::numeric);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_boost_cero_s_finito" CHECK (boost_cero_s <> 'NaN'::numeric);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_boost_cero_s_rango" CHECK (boost_cero_s >= 0::numeric);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_boost_inclusion" CHECK (boost_cero_s IS NULL OR boost_bajo_s IS NULL OR boost_cero_s <= boost_bajo_s);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_distancia_companeros_finito" CHECK (distancia_companeros <> 'NaN'::numeric);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_distancia_companeros_rango" CHECK (distancia_companeros >= 0::numeric);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_goles_rango" CHECK (goles >= 0);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_pads_pequenos_rango" CHECK (pads_pequenos >= 0);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_puntos_rango" CHECK (puntos >= 0);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_salvadas_rango" CHECK (salvadas >= 0);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_tiros_rango" CHECK (tiros >= 0);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_velocidad_media_finito" CHECK (velocidad_media <> 'NaN'::numeric);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_velocidad_media_rango" CHECK (velocidad_media >= 0::numeric);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_zona_defensiva_s_finito" CHECK (zona_defensiva_s <> 'NaN'::numeric);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "ck_metricas_replay_zona_defensiva_s_rango" CHECK (zona_defensiva_s >= 0::numeric);

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "pk_metricas_replay" PRIMARY KEY (id_jugador_replay);

ALTER TABLE public."objetivo_versiones" ADD CONSTRAINT "ck_objetivo_versiones_activacion" CHECK (activada_en IS NULL OR activada_en >= creado_en);

ALTER TABLE public."objetivo_versiones" ADD CONSTRAINT "ck_objetivo_versiones_comparador" CHECK (comparador::text = ANY (ARRAY['<'::character varying, '<='::character varying, '='::character varying, '>='::character varying, '>'::character varying, '<>'::character varying, '!='::character varying]::text[]));

ALTER TABLE public."objetivo_versiones" ADD CONSTRAINT "ck_objetivo_versiones_comparador_texto" CHECK (length(btrim(comparador::text)) > 0);

ALTER TABLE public."objetivo_versiones" ADD CONSTRAINT "ck_objetivo_versiones_fechas" CHECK (fecha_limite IS NULL OR fecha_limite >= fecha_inicio);

ALTER TABLE public."objetivo_versiones" ADD CONSTRAINT "ck_objetivo_versiones_meta" CHECK (valor_meta >= 0::numeric);

ALTER TABLE public."objetivo_versiones" ADD CONSTRAINT "ck_objetivo_versiones_nombre_texto" CHECK (length(btrim(nombre::text)) > 0);

ALTER TABLE public."objetivo_versiones" ADD CONSTRAINT "ck_objetivo_versiones_valor_meta_finito" CHECK (valor_meta <> 'NaN'::numeric);

ALTER TABLE public."objetivo_versiones" ADD CONSTRAINT "ck_objetivo_versiones_version_positiva" CHECK (version >= 1);

ALTER TABLE public."objetivo_versiones" ADD CONSTRAINT "ck_objetivo_versiones_zona_horaria_texto" CHECK (length(btrim(zona_horaria::text)) > 0);

ALTER TABLE public."objetivo_versiones" ADD CONSTRAINT "pk_objetivo_versiones" PRIMARY KEY (id_objetivo_version);

ALTER TABLE public."objetivo_versiones" ADD CONSTRAINT "uq_objetivo_versiones_1" UNIQUE (id_objetivo, version);

ALTER TABLE public."objetivos" ADD CONSTRAINT "ck_objetivos_archivo" CHECK ((estado::text = 'archivado'::text) = (archivado_en IS NOT NULL));

ALTER TABLE public."objetivos" ADD CONSTRAINT "ck_objetivos_estado" CHECK (estado::text = ANY (ARRAY['activo'::character varying, 'archivado'::character varying]::text[]));

ALTER TABLE public."objetivos" ADD CONSTRAINT "ck_objetivos_estado_texto" CHECK (length(btrim(estado::text)) > 0);

ALTER TABLE public."objetivos" ADD CONSTRAINT "ck_objetivos_modalidad_texto" CHECK (length(btrim(modalidad::text)) > 0);

ALTER TABLE public."objetivos" ADD CONSTRAINT "ck_objetivos_tipo" CHECK (tipo::text = ANY (ARRAY['rendimiento'::character varying, 'entrenamiento'::character varying]::text[]));

ALTER TABLE public."objetivos" ADD CONSTRAINT "ck_objetivos_tipo_texto" CHECK (length(btrim(tipo::text)) > 0);

ALTER TABLE public."objetivos" ADD CONSTRAINT "pk_objetivos" PRIMARY KEY (id_objetivo);

ALTER TABLE public."perfiles" ADD CONSTRAINT "ck_perfiles_cuenta_juego_id_texto" CHECK (length(btrim(cuenta_juego_id::text)) > 0);

ALTER TABLE public."perfiles" ADD CONSTRAINT "ck_perfiles_dias" CHECK (dias_semana >= 1 AND dias_semana <= 7);

ALTER TABLE public."perfiles" ADD CONSTRAINT "ck_perfiles_gamertag_texto" CHECK (length(btrim(gamertag::text)) > 0);

ALTER TABLE public."perfiles" ADD CONSTRAINT "ck_perfiles_minutos" CHECK (minutos_sesion > 0);

ALTER TABLE public."perfiles" ADD CONSTRAINT "ck_perfiles_modalidad_principal_texto" CHECK (length(btrim(modalidad_principal::text)) > 0);

ALTER TABLE public."perfiles" ADD CONSTRAINT "ck_perfiles_plataforma_texto" CHECK (length(btrim(plataforma::text)) > 0);

ALTER TABLE public."perfiles" ADD CONSTRAINT "ck_perfiles_zona_horaria_texto" CHECK (length(btrim(zona_horaria::text)) > 0);

ALTER TABLE public."perfiles" ADD CONSTRAINT "pk_perfiles" PRIMARY KEY (id_usuario);

ALTER TABLE public."plan_ejercicio" ADD CONSTRAINT "ck_plan_ejercicio_dificultad_rango" CHECK (dificultad > 0);

ALTER TABLE public."plan_ejercicio" ADD CONSTRAINT "ck_plan_ejercicio_minutos_rango" CHECK (minutos > 0);

ALTER TABLE public."plan_ejercicio" ADD CONSTRAINT "ck_plan_ejercicio_orden_rango" CHECK (orden > 0);

ALTER TABLE public."plan_ejercicio" ADD CONSTRAINT "pk_plan_ejercicio" PRIMARY KEY (id_plan_ejercicio);

ALTER TABLE public."plan_ejercicio" ADD CONSTRAINT "uq_plan_ejercicio_1" UNIQUE (id_plan, orden);

ALTER TABLE public."plan_objetivo" ADD CONSTRAINT "pk_plan_objetivo" PRIMARY KEY (id_plan_objetivo);

ALTER TABLE public."plan_objetivo" ADD CONSTRAINT "uq_plan_objetivo_1" UNIQUE (id_plan, id_objetivo_version);

ALTER TABLE public."planes" ADD CONSTRAINT "ck_planes_cumplimiento" CHECK (cumplimiento_previo_pct >= 0::numeric AND cumplimiento_previo_pct <= 100::numeric);

ALTER TABLE public."planes" ADD CONSTRAINT "ck_planes_cumplimiento_previo_pct_finito" CHECK (cumplimiento_previo_pct <> 'NaN'::numeric);

ALTER TABLE public."planes" ADD CONSTRAINT "ck_planes_dias" CHECK (dias_disponibles >= 1 AND dias_disponibles <= 7);

ALTER TABLE public."planes" ADD CONSTRAINT "ck_planes_estado" CHECK (estado::text = ANY (ARRAY['borrador'::character varying, 'completo'::character varying, 'parcial'::character varying, 'no_disponible'::character varying]::text[]));

ALTER TABLE public."planes" ADD CONSTRAINT "ck_planes_estado_texto" CHECK (length(btrim(estado::text)) > 0);

ALTER TABLE public."planes" ADD CONSTRAINT "ck_planes_justificacion_texto" CHECK (length(btrim(justificacion)) > 0);

ALTER TABLE public."planes" ADD CONSTRAINT "ck_planes_minutos" CHECK (minutos_disponibles > 0);

ALTER TABLE public."planes" ADD CONSTRAINT "ck_planes_plataforma_destino_texto" CHECK (length(btrim(plataforma_destino::text)) > 0);

ALTER TABLE public."planes" ADD CONSTRAINT "ck_planes_sesiones" CHECK (sesiones_semana >= 1 AND sesiones_semana <= dias_disponibles);

ALTER TABLE public."planes" ADD CONSTRAINT "ck_planes_version_positiva" CHECK (version >= 1);

ALTER TABLE public."planes" ADD CONSTRAINT "pk_planes" PRIMARY KEY (id_plan);

ALTER TABLE public."planes" ADD CONSTRAINT "uq_planes_1" UNIQUE (id_analisis, version);

ALTER TABLE public."prioridades" ADD CONSTRAINT "ck_prioridades_evidencia_texto" CHECK (length(btrim(evidencia)) > 0);

ALTER TABLE public."prioridades" ADD CONSTRAINT "ck_prioridades_orden" CHECK (orden >= 1 AND orden <= 3);

ALTER TABLE public."prioridades" ADD CONSTRAINT "ck_prioridades_valor_actual_finito" CHECK (valor_actual <> 'NaN'::numeric);

ALTER TABLE public."prioridades" ADD CONSTRAINT "ck_prioridades_valor_base_finito" CHECK (valor_base <> 'NaN'::numeric);

ALTER TABLE public."prioridades" ADD CONSTRAINT "pk_prioridades" PRIMARY KEY (id_prioridad);

ALTER TABLE public."prioridades" ADD CONSTRAINT "uq_prioridades_1" UNIQUE (id_analisis, orden);

ALTER TABLE public."prioridades" ADD CONSTRAINT "uq_prioridades_2" UNIQUE (id_analisis, id_regla_config);

ALTER TABLE public."rangos" ADD CONSTRAINT "ck_rangos_division" CHECK (division > 0);

ALTER TABLE public."rangos" ADD CONSTRAINT "ck_rangos_fuente_texto" CHECK (length(btrim(fuente::text)) > 0);

ALTER TABLE public."rangos" ADD CONSTRAINT "ck_rangos_modalidad_texto" CHECK (length(btrim(modalidad::text)) > 0);

ALTER TABLE public."rangos" ADD CONSTRAINT "ck_rangos_rango_texto" CHECK (length(btrim(rango::text)) > 0);

ALTER TABLE public."rangos" ADD CONSTRAINT "ck_rangos_temporada_texto" CHECK (length(btrim(temporada::text)) > 0);

ALTER TABLE public."rangos" ADD CONSTRAINT "pk_rangos" PRIMARY KEY (id_rango);

ALTER TABLE public."reglas" ADD CONSTRAINT "ck_reglas_categoria_texto" CHECK (length(btrim(categoria::text)) > 0);

ALTER TABLE public."reglas" ADD CONSTRAINT "ck_reglas_codigo_texto" CHECK (length(btrim(codigo::text)) > 0);

ALTER TABLE public."reglas" ADD CONSTRAINT "pk_reglas" PRIMARY KEY (id_regla);

ALTER TABLE public."reglas" ADD CONSTRAINT "uq_reglas_1" UNIQUE (codigo);

ALTER TABLE public."reglas_config" ADD CONSTRAINT "ck_reglas_config_comparador" CHECK (comparador::text = ANY (ARRAY['<'::character varying, '<='::character varying, '='::character varying, '>='::character varying, '>'::character varying, '<>'::character varying, '!='::character varying]::text[]));

ALTER TABLE public."reglas_config" ADD CONSTRAINT "ck_reglas_config_comparador_texto" CHECK (length(btrim(comparador::text)) > 0);

ALTER TABLE public."reglas_config" ADD CONSTRAINT "ck_reglas_config_direccion_favorable_texto" CHECK (length(btrim(direccion_favorable::text)) > 0);

ALTER TABLE public."reglas_config" ADD CONSTRAINT "ck_reglas_config_mejora" CHECK (umbral_mejora >= 0::numeric);

ALTER TABLE public."reglas_config" ADD CONSTRAINT "ck_reglas_config_muestra" CHECK (muestra_minima > 0);

ALTER TABLE public."reglas_config" ADD CONSTRAINT "ck_reglas_config_umbral_finito" CHECK (umbral <> 'NaN'::numeric);

ALTER TABLE public."reglas_config" ADD CONSTRAINT "ck_reglas_config_umbral_mejora_finito" CHECK (umbral_mejora <> 'NaN'::numeric);

ALTER TABLE public."reglas_config" ADD CONSTRAINT "pk_reglas_config" PRIMARY KEY (id_regla_config);

ALTER TABLE public."reglas_config" ADD CONSTRAINT "uq_reglas_config_1" UNIQUE (id_conjunto_reglas, id_regla);

ALTER TABLE public."replays" ADD CONSTRAINT "ck_replays_estado" CHECK (estado::text = ANY (ARRAY['pending'::character varying, 'failed'::character varying, 'ok'::character varying]::text[]));

ALTER TABLE public."replays" ADD CONSTRAINT "ck_replays_estado_texto" CHECK (length(btrim(estado::text)) > 0);

ALTER TABLE public."replays" ADD CONSTRAINT "ck_replays_limpieza_estado_texto" CHECK (length(btrim(limpieza_estado::text)) > 0);

ALTER TABLE public."replays" ADD CONSTRAINT "ck_replays_nombre_archivo_texto" CHECK (length(btrim(nombre_archivo::text)) > 0);

ALTER TABLE public."replays" ADD CONSTRAINT "ck_replays_origen" CHECK (origen_carga::text = ANY (ARRAY['propia'::character varying, 'reutilizada'::character varying]::text[]));

ALTER TABLE public."replays" ADD CONSTRAINT "ck_replays_origen_carga_texto" CHECK (length(btrim(origen_carga::text)) > 0);

ALTER TABLE public."replays" ADD CONSTRAINT "ck_replays_posicion" CHECK (posicion >= 1 AND posicion <= 5);

ALTER TABLE public."replays" ADD CONSTRAINT "pk_replays" PRIMARY KEY (id_replay);

ALTER TABLE public."replays" ADD CONSTRAINT "uq_replays_1" UNIQUE (id_bloque, posicion);

ALTER TABLE public."replays" ADD CONSTRAINT "uq_replays_2" UNIQUE (id_bloque, id_jugador_replay);

ALTER TABLE public."sesion_ejercicio" ADD CONSTRAINT "ck_sesion_ejercicio_minutos" CHECK (minutos >= 0);

ALTER TABLE public."sesion_ejercicio" ADD CONSTRAINT "ck_sesion_ejercicio_repeticiones" CHECK (repeticiones >= 0);

ALTER TABLE public."sesion_ejercicio" ADD CONSTRAINT "pk_sesion_ejercicio" PRIMARY KEY (id_sesion_version, id_plan_ejercicio);

ALTER TABLE public."sesion_versiones" ADD CONSTRAINT "ck_sesion_versiones_dificultad" CHECK (dificultad_percibida::text = ANY (ARRAY['Baja'::character varying, 'Adecuada'::character varying, 'Alta'::character varying]::text[]));

ALTER TABLE public."sesion_versiones" ADD CONSTRAINT "ck_sesion_versiones_dificultad_percibida_texto" CHECK (length(btrim(dificultad_percibida::text)) > 0);

ALTER TABLE public."sesion_versiones" ADD CONSTRAINT "ck_sesion_versiones_fechas" CHECK (fecha_practica <= registrado_en);

ALTER TABLE public."sesion_versiones" ADD CONSTRAINT "ck_sesion_versiones_version_positiva" CHECK (version >= 1);

ALTER TABLE public."sesion_versiones" ADD CONSTRAINT "pk_sesion_versiones" PRIMARY KEY (id_sesion_version);

ALTER TABLE public."sesion_versiones" ADD CONSTRAINT "uq_sesion_versiones_1" UNIQUE (id_sesion, version);

ALTER TABLE public."sesiones" ADD CONSTRAINT "ck_sesiones_baja" CHECK (eliminado_en IS NULL AND motivo_exclusion IS NULL OR eliminado_en IS NOT NULL AND motivo_exclusion IS NOT NULL AND length(btrim(motivo_exclusion)) > 0);

ALTER TABLE public."sesiones" ADD CONSTRAINT "ck_sesiones_fechas" CHECK (eliminado_en IS NULL OR eliminado_en >= creado_en);

ALTER TABLE public."sesiones" ADD CONSTRAINT "pk_sesiones" PRIMARY KEY (id_sesion);

ALTER TABLE public."solicitudes_contacto" ADD CONSTRAINT "ck_solicitudes_contacto_correo" CHECK (correo::text ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'::text);

ALTER TABLE public."solicitudes_contacto" ADD CONSTRAINT "ck_solicitudes_contacto_correo_texto" CHECK (length(btrim(correo::text)) > 0);

ALTER TABLE public."solicitudes_contacto" ADD CONSTRAINT "ck_solicitudes_contacto_mensaje_texto" CHECK (length(btrim(mensaje)) > 0);

ALTER TABLE public."solicitudes_contacto" ADD CONSTRAINT "ck_solicitudes_contacto_nombre_texto" CHECK (length(btrim(nombre::text)) > 0);

ALTER TABLE public."solicitudes_contacto" ADD CONSTRAINT "pk_solicitudes_contacto" PRIMARY KEY (id_solicitud);

ALTER TABLE public."usuarios" ADD CONSTRAINT "ck_usuarios_estado" CHECK (estado::text = ANY (ARRAY['activo'::character varying, 'suspendido'::character varying]::text[]));

ALTER TABLE public."usuarios" ADD CONSTRAINT "ck_usuarios_estado_texto" CHECK (length(btrim(estado::text)) > 0);

ALTER TABLE public."usuarios" ADD CONSTRAINT "ck_usuarios_nombre_texto" CHECK (length(btrim(nombre::text)) > 0);

ALTER TABLE public."usuarios" ADD CONSTRAINT "ck_usuarios_rol" CHECK (rol::text = ANY (ARRAY['jugador'::character varying, 'administrador'::character varying]::text[]));

ALTER TABLE public."usuarios" ADD CONSTRAINT "ck_usuarios_rol_texto" CHECK (length(btrim(rol::text)) > 0);

ALTER TABLE public."usuarios" ADD CONSTRAINT "pk_usuarios" PRIMARY KEY (id_usuario);

ALTER TABLE public."analisis" ADD CONSTRAINT "fk_analisis_id_bloque" FOREIGN KEY (id_bloque) REFERENCES bloques(id_bloque) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."analisis" ADD CONSTRAINT "fk_analisis_id_bloque_base" FOREIGN KEY (id_bloque_base) REFERENCES bloques(id_bloque) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."analisis" ADD CONSTRAINT "fk_analisis_id_conjunto_reglas" FOREIGN KEY (id_conjunto_reglas) REFERENCES conjuntos_reglas(id_conjunto_reglas) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."bloques" ADD CONSTRAINT "fk_bloques_id_usuario" FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."cambios_estado_usuario" ADD CONSTRAINT "fk_cambios_estado_usuario_id_administrador" FOREIGN KEY (id_administrador) REFERENCES usuarios(id_usuario) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."cambios_estado_usuario" ADD CONSTRAINT "fk_cambios_estado_usuario_id_usuario" FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."ejercicio_plataforma" ADD CONSTRAINT "fk_ejercicio_plataforma_id_ejercicio_version" FOREIGN KEY (id_ejercicio_version) REFERENCES ejercicio_versiones(id_ejercicio_version) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."ejercicio_versiones" ADD CONSTRAINT "fk_ejercicio_versiones_id_ejercicio" FOREIGN KEY (id_ejercicio) REFERENCES ejercicios(id_ejercicio) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."evaluacion_sesiones" ADD CONSTRAINT "fk_evaluacion_sesiones_id_evaluacion" FOREIGN KEY (id_evaluacion) REFERENCES evaluaciones_objetivo(id_evaluacion) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."evaluacion_sesiones" ADD CONSTRAINT "fk_evaluacion_sesiones_id_sesion_version" FOREIGN KEY (id_sesion_version) REFERENCES sesion_versiones(id_sesion_version) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."evaluaciones_objetivo" ADD CONSTRAINT "fk_evaluaciones_objetivo_id_bloque" FOREIGN KEY (id_bloque) REFERENCES bloques(id_bloque) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."evaluaciones_objetivo" ADD CONSTRAINT "fk_evaluaciones_objetivo_id_objetivo_version" FOREIGN KEY (id_objetivo_version) REFERENCES objetivo_versiones(id_objetivo_version) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."jugadores_replay" ADD CONSTRAINT "fk_jugadores_replay_id_archivo" FOREIGN KEY (id_archivo) REFERENCES archivos_replay(id_archivo) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."metricas_bloque" ADD CONSTRAINT "fk_metricas_bloque_id_bloque" FOREIGN KEY (id_bloque) REFERENCES bloques(id_bloque) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."metricas_replay" ADD CONSTRAINT "fk_metricas_replay_id_jugador_replay" FOREIGN KEY (id_jugador_replay) REFERENCES jugadores_replay(id_jugador_replay) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."objetivo_versiones" ADD CONSTRAINT "fk_objetivo_versiones_id_bloque_base" FOREIGN KEY (id_bloque_base) REFERENCES bloques(id_bloque) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."objetivo_versiones" ADD CONSTRAINT "fk_objetivo_versiones_id_metrica" FOREIGN KEY (id_metrica) REFERENCES metricas(id_metrica) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."objetivo_versiones" ADD CONSTRAINT "fk_objetivo_versiones_id_objetivo" FOREIGN KEY (id_objetivo) REFERENCES objetivos(id_objetivo) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."objetivos" ADD CONSTRAINT "fk_objetivos_id_usuario" FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."perfiles" ADD CONSTRAINT "fk_perfiles_id_usuario" FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."plan_ejercicio" ADD CONSTRAINT "fk_plan_ejercicio_id_ejercicio_version" FOREIGN KEY (id_ejercicio_version) REFERENCES ejercicio_versiones(id_ejercicio_version) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."plan_ejercicio" ADD CONSTRAINT "fk_plan_ejercicio_id_plan" FOREIGN KEY (id_plan) REFERENCES planes(id_plan) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."plan_ejercicio" ADD CONSTRAINT "fk_plan_ejercicio_id_prioridad" FOREIGN KEY (id_prioridad) REFERENCES prioridades(id_prioridad) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."plan_objetivo" ADD CONSTRAINT "fk_plan_objetivo_id_objetivo_version" FOREIGN KEY (id_objetivo_version) REFERENCES objetivo_versiones(id_objetivo_version) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."plan_objetivo" ADD CONSTRAINT "fk_plan_objetivo_id_plan" FOREIGN KEY (id_plan) REFERENCES planes(id_plan) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."planes" ADD CONSTRAINT "fk_planes_id_analisis" FOREIGN KEY (id_analisis) REFERENCES analisis(id_analisis) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."prioridades" ADD CONSTRAINT "fk_prioridades_id_analisis" FOREIGN KEY (id_analisis) REFERENCES analisis(id_analisis) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."prioridades" ADD CONSTRAINT "fk_prioridades_id_regla_config" FOREIGN KEY (id_regla_config) REFERENCES reglas_config(id_regla_config) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."rangos" ADD CONSTRAINT "fk_rangos_id_usuario" FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."reglas" ADD CONSTRAINT "fk_reglas_id_metrica" FOREIGN KEY (id_metrica) REFERENCES metricas(id_metrica) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."reglas_config" ADD CONSTRAINT "fk_reglas_config_id_conjunto_reglas" FOREIGN KEY (id_conjunto_reglas) REFERENCES conjuntos_reglas(id_conjunto_reglas) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."reglas_config" ADD CONSTRAINT "fk_reglas_config_id_regla" FOREIGN KEY (id_regla) REFERENCES reglas(id_regla) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."replays" ADD CONSTRAINT "fk_replays_id_bloque" FOREIGN KEY (id_bloque) REFERENCES bloques(id_bloque) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."replays" ADD CONSTRAINT "fk_replays_id_jugador_replay" FOREIGN KEY (id_jugador_replay) REFERENCES jugadores_replay(id_jugador_replay) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."sesion_ejercicio" ADD CONSTRAINT "fk_sesion_ejercicio_id_plan_ejercicio" FOREIGN KEY (id_plan_ejercicio) REFERENCES plan_ejercicio(id_plan_ejercicio) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."sesion_ejercicio" ADD CONSTRAINT "fk_sesion_ejercicio_id_sesion_version" FOREIGN KEY (id_sesion_version) REFERENCES sesion_versiones(id_sesion_version) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."sesion_versiones" ADD CONSTRAINT "fk_sesion_versiones_id_sesion" FOREIGN KEY (id_sesion) REFERENCES sesiones(id_sesion) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."sesiones" ADD CONSTRAINT "fk_sesiones_id_plan" FOREIGN KEY (id_plan) REFERENCES planes(id_plan) ON UPDATE RESTRICT ON DELETE RESTRICT;

ALTER TABLE public."usuarios" ADD CONSTRAINT "fk_usuarios_id_usuario" FOREIGN KEY (id_usuario) REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT;

CREATE INDEX ix_analisis_id_bloque_base ON public.analisis USING btree (id_bloque_base);

CREATE INDEX ix_analisis_id_conjunto_reglas ON public.analisis USING btree (id_conjunto_reglas);

CREATE INDEX ix_bloques_id_usuario ON public.bloques USING btree (id_usuario);

CREATE INDEX ix_cambios_estado_usuario_id_administrador ON public.cambios_estado_usuario USING btree (id_administrador);

CREATE INDEX ix_cambios_estado_usuario_id_usuario ON public.cambios_estado_usuario USING btree (id_usuario);

CREATE INDEX ix_evaluacion_sesiones_id_sesion_version ON public.evaluacion_sesiones USING btree (id_sesion_version);

CREATE INDEX ix_evaluaciones_objetivo_id_bloque ON public.evaluaciones_objetivo USING btree (id_bloque);

CREATE INDEX ix_evaluaciones_objetivo_id_objetivo_version ON public.evaluaciones_objetivo USING btree (id_objetivo_version);

CREATE INDEX ix_objetivo_versiones_id_bloque_base ON public.objetivo_versiones USING btree (id_bloque_base);

CREATE INDEX ix_objetivo_versiones_id_metrica ON public.objetivo_versiones USING btree (id_metrica);

CREATE INDEX ix_objetivos_id_usuario ON public.objetivos USING btree (id_usuario);

CREATE UNIQUE INDEX uq_objetivos_activo ON public.objetivos USING btree (id_usuario, modalidad, tipo) WHERE ((estado)::text = 'activo'::text);

CREATE INDEX ix_plan_ejercicio_id_ejercicio_version ON public.plan_ejercicio USING btree (id_ejercicio_version);

CREATE INDEX ix_plan_ejercicio_id_prioridad ON public.plan_ejercicio USING btree (id_prioridad);

CREATE INDEX ix_plan_objetivo_id_objetivo_version ON public.plan_objetivo USING btree (id_objetivo_version);

CREATE INDEX ix_prioridades_id_regla_config ON public.prioridades USING btree (id_regla_config);

CREATE INDEX ix_rangos_id_usuario ON public.rangos USING btree (id_usuario);

CREATE INDEX ix_reglas_id_metrica ON public.reglas USING btree (id_metrica);

CREATE INDEX ix_reglas_config_id_regla ON public.reglas_config USING btree (id_regla);

CREATE INDEX ix_replays_id_jugador_replay ON public.replays USING btree (id_jugador_replay);

CREATE INDEX ix_sesion_ejercicio_id_plan_ejercicio ON public.sesion_ejercicio USING btree (id_plan_ejercicio);

CREATE INDEX ix_sesiones_id_plan ON public.sesiones USING btree (id_plan);

CREATE OR REPLACE FUNCTION arc_private.bloquear_padre_cardinalidad()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    ids bigint[] := ARRAY[]::bigint[];
    id_actual bigint;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        ids := array_append(ids, (to_jsonb(OLD) ->> TG_ARGV[2])::bigint);
    END IF;
    IF TG_OP <> 'DELETE' THEN
        ids := array_append(ids, (to_jsonb(NEW) ->> TG_ARGV[2])::bigint);
    END IF;
    FOR id_actual IN SELECT DISTINCT x FROM unnest(ids) AS u(x) WHERE x IS NOT NULL ORDER BY x
    LOOP
        EXECUTE format('UPDATE public.%I SET %I = %I WHERE %I = $1',
            TG_ARGV[0], TG_ARGV[1], TG_ARGV[1], TG_ARGV[1]) USING id_actual;
    END LOOP;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION arc_private.verificar_cardinalidad()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    ids bigint[] := ARRAY[]::bigint[];
    id_actual bigint;
    existe boolean;
    cantidad bigint;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        ids := array_append(ids, (to_jsonb(OLD) ->> TG_ARGV[6])::bigint);
    END IF;
    IF TG_OP <> 'DELETE' THEN
        ids := array_append(ids, (to_jsonb(NEW) ->> TG_ARGV[6])::bigint);
    END IF;
    FOR id_actual IN SELECT DISTINCT x FROM unnest(ids) AS u(x) WHERE x IS NOT NULL ORDER BY x
    LOOP
        EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE %I = $1)',
            TG_ARGV[0], TG_ARGV[1]) INTO existe USING id_actual;
        IF existe THEN
            EXECUTE format('SELECT count(*) FROM public.%I WHERE %I = $1',
                TG_ARGV[2], TG_ARGV[3]) INTO cantidad USING id_actual;
            IF cantidad < TG_ARGV[4]::bigint OR
               (TG_ARGV[5]::bigint >= 0 AND cantidad > TG_ARGV[5]::bigint) THEN
                RAISE EXCEPTION 'Cardinalidad inválida: %.% = %, hijos %: %, mínimo %, máximo %',
                    TG_ARGV[0], TG_ARGV[1], id_actual, TG_ARGV[2], cantidad, TG_ARGV[4], TG_ARGV[5]
                    USING ERRCODE = '23514';
            END IF;
        END IF;
    END LOOP;
    RETURN NULL;
END;
$function$;

CREATE CONSTRAINT TRIGGER ct_cardinalidad_objetivo_versiones AFTER INSERT OR DELETE OR UPDATE ON objetivo_versiones DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION arc_private.verificar_cardinalidad('objetivos', 'id_objetivo', 'objetivo_versiones', 'id_objetivo', '1', '-1', 'id_objetivo');

CREATE TRIGGER tr_bloquear_objetivo_versiones BEFORE INSERT OR DELETE OR UPDATE ON objetivo_versiones FOR EACH ROW EXECUTE FUNCTION arc_private.bloquear_padre_cardinalidad('objetivos', 'id_objetivo', 'id_objetivo');

CREATE CONSTRAINT TRIGGER ct_cardinalidad_objetivos AFTER INSERT OR DELETE OR UPDATE ON objetivos DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION arc_private.verificar_cardinalidad('objetivos', 'id_objetivo', 'objetivo_versiones', 'id_objetivo', '1', '-1', 'id_objetivo');

CREATE CONSTRAINT TRIGGER ct_cardinalidad_plan_objetivo AFTER INSERT OR DELETE OR UPDATE ON plan_objetivo DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION arc_private.verificar_cardinalidad('planes', 'id_plan', 'plan_objetivo', 'id_plan', '0', '2', 'id_plan');

CREATE TRIGGER tr_bloquear_plan_objetivo BEFORE INSERT OR DELETE OR UPDATE ON plan_objetivo FOR EACH ROW EXECUTE FUNCTION arc_private.bloquear_padre_cardinalidad('planes', 'id_plan', 'id_plan');

CREATE CONSTRAINT TRIGGER ct_cardinalidad_planes AFTER INSERT OR DELETE OR UPDATE ON planes DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION arc_private.verificar_cardinalidad('planes', 'id_plan', 'plan_objetivo', 'id_plan', '0', '2', 'id_plan');

CREATE CONSTRAINT TRIGGER ct_cardinalidad_sesion_versiones AFTER INSERT OR DELETE OR UPDATE ON sesion_versiones DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION arc_private.verificar_cardinalidad('sesiones', 'id_sesion', 'sesion_versiones', 'id_sesion', '1', '-1', 'id_sesion');

CREATE TRIGGER tr_bloquear_sesion_versiones BEFORE INSERT OR DELETE OR UPDATE ON sesion_versiones FOR EACH ROW EXECUTE FUNCTION arc_private.bloquear_padre_cardinalidad('sesiones', 'id_sesion', 'id_sesion');

CREATE CONSTRAINT TRIGGER ct_cardinalidad_sesiones AFTER INSERT OR DELETE OR UPDATE ON sesiones DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION arc_private.verificar_cardinalidad('sesiones', 'id_sesion', 'sesion_versiones', 'id_sesion', '1', '-1', 'id_sesion');

ALTER TABLE public."analisis" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."analisis" IS 'Análisis canónico e inmutable de un bloque completo; conserva las reglas aplicadas y, cuando existe, la línea base comparable.';

ALTER TABLE public."archivos_replay" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."archivos_replay" IS 'Archivo identificado por sus bytes; metadatos reales de la partida, separados del contexto solicitado del bloque.';

ALTER TABLE public."bloques" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."bloques" IS 'Conjunto de cinco partidas para una identidad, modalidad y tipo comparables. El cierre permite filtrar reportes por periodo.';

ALTER TABLE public."cambios_estado_usuario" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."cambios_estado_usuario" IS 'Registro de activación o suspensión con responsable, motivo y fecha.';

ALTER TABLE public."conjuntos_reglas" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."conjuntos_reglas" IS 'Versión publicada e inmutable del conjunto de reglas del motor.';

ALTER TABLE public."ejercicio_plataforma" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."ejercicio_plataforma" IS 'Plataformas compatibles con una versión de ejercicio; no se guardan listas de plataformas en una celda.';

ALTER TABLE public."ejercicio_versiones" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."ejercicio_versiones" IS 'Ficha inmutable del ejercicio; sus plataformas compatibles se representan en una tabla intermedia.';

ALTER TABLE public."ejercicios" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."ejercicios" IS 'Identidad y disponibilidad del ejercicio. Su contenido se conserva mediante versiones.';

ALTER TABLE public."evaluacion_sesiones" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."evaluacion_sesiones" IS 'Versiones de registros de práctica utilizadas en un corte de entrenamiento; conserva evidencia anterior a una corrección.';

ALTER TABLE public."evaluaciones_objetivo" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."evaluaciones_objetivo" IS 'Corte de evaluación de una versión del objetivo, independiente del número de planes que orientó. Sus resultados se calculan desde evidencias conservadas.';

ALTER TABLE public."jugadores_replay" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."jugadores_replay" IS 'Identidad seleccionada para un archivo, confirmada al procesarlo. Sus datos no se duplican por incorporación a un bloque.';

ALTER TABLE public."metricas" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."metricas" IS 'Definición canónica de cada métrica: código, unidad y tipo son inmutables.';

ALTER TABLE public."metricas_bloque" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."metricas_bloque" IS 'Evidencia congelada del bloque completo. version_calculo identifica el algoritmo utilizado; los indicadores se consultan con cobertura y denominadores explícitos.';

ALTER TABLE public."metricas_replay" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."metricas_replay" IS 'Medidas del participante seleccionado. Se guardan tiempos base para conservar denominadores y calcular porcentajes.';

ALTER TABLE public."objetivo_versiones" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."objetivo_versiones" IS 'Criterio de una meta, fijo desde su activación. Su vigencia termina con la siguiente edición, el archivo o el fin del periodo; la zona horaria delimita la semana.';

ALTER TABLE public."objetivos" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."objetivos" IS 'Objetivo de rendimiento o entrenamiento por usuario y modalidad; su criterio se conserva en versiones.';

ALTER TABLE public."perfiles" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."perfiles" IS 'Configuración actual del jugador. La identidad y disponibilidad históricas se obtienen de bloques y planes.';

ALTER TABLE public."plan_ejercicio" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."plan_ejercicio" IS 'Prescripción de una versión de ejercicio, con carga propia y prioridad de origen.';

ALTER TABLE public."plan_objetivo" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."plan_objetivo" IS 'Versiones de las metas que orientaron el plan: una de rendimiento y como máximo una de entrenamiento.';

ALTER TABLE public."planes" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."planes" IS 'Versión de la rutina recurrente. Conserva el contexto de generación y admite cobertura completa, parcial o sin actividades.';

ALTER TABLE public."prioridades" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."prioridades" IS 'Resultado de aplicar una configuración de regla. La definición y el umbral se consultan por FK.';

ALTER TABLE public."rangos" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."rangos" IS 'Observación histórica de rango por modalidad y temporada.';

ALTER TABLE public."reglas" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."reglas" IS 'Identidad semántica estable de una regla: su código determina métrica y categoría.';

ALTER TABLE public."reglas_config" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."reglas_config" IS 'Criterios publicados de una regla: señal, muestra mínima y cambio favorable. Las señales descriptivas no se cuentan como mejora.';

ALTER TABLE public."replays" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."replays" IS 'Incorporación del participante al bloque y controles de la carga privada o de un identificador duplicado autorizado.';

ALTER TABLE public."sesion_ejercicio" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."sesion_ejercicio" IS 'Práctica declarada de cada actividad en una versión del registro. Completado incluye los pasos requeridos de la ficha prescrita.';

ALTER TABLE public."sesion_versiones" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."sesion_versiones" IS 'Registro original o corrección de una práctica. La versión vigente es la de mayor número; el cumplimiento se calcula del detalle.';

ALTER TABLE public."sesiones" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."sesiones" IS 'Identidad de una práctica y del plan realizado; se guarda junto con su primera versión. La baja conserva versiones y evidencia histórica.';

ALTER TABLE public."solicitudes_contacto" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."solicitudes_contacto" IS 'Solicitud recibida desde Ayuda y contacto; no almacena contraseñas ni tokens.';

ALTER TABLE public."usuarios" ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public."usuarios" IS 'Cuenta de la aplicación. Nombre y estado administrativo; las credenciales y el último acceso pertenecen a Auth.';

GRANT REFERENCES ON TABLE public."analisis" TO "service_role";

GRANT TRIGGER ON TABLE public."analisis" TO "service_role";

GRANT TRUNCATE ON TABLE public."analisis" TO "service_role";

GRANT REFERENCES ON TABLE public."archivos_replay" TO "service_role";

GRANT TRIGGER ON TABLE public."archivos_replay" TO "service_role";

GRANT TRUNCATE ON TABLE public."archivos_replay" TO "service_role";

GRANT REFERENCES ON TABLE public."bloques" TO "service_role";

GRANT TRIGGER ON TABLE public."bloques" TO "service_role";

GRANT TRUNCATE ON TABLE public."bloques" TO "service_role";

GRANT REFERENCES ON TABLE public."cambios_estado_usuario" TO "service_role";

GRANT TRIGGER ON TABLE public."cambios_estado_usuario" TO "service_role";

GRANT TRUNCATE ON TABLE public."cambios_estado_usuario" TO "service_role";

GRANT REFERENCES ON TABLE public."conjuntos_reglas" TO "service_role";

GRANT TRIGGER ON TABLE public."conjuntos_reglas" TO "service_role";

GRANT TRUNCATE ON TABLE public."conjuntos_reglas" TO "service_role";

GRANT REFERENCES ON TABLE public."ejercicio_plataforma" TO "service_role";

GRANT TRIGGER ON TABLE public."ejercicio_plataforma" TO "service_role";

GRANT TRUNCATE ON TABLE public."ejercicio_plataforma" TO "service_role";

GRANT REFERENCES ON TABLE public."ejercicio_versiones" TO "service_role";

GRANT TRIGGER ON TABLE public."ejercicio_versiones" TO "service_role";

GRANT TRUNCATE ON TABLE public."ejercicio_versiones" TO "service_role";

GRANT REFERENCES ON TABLE public."ejercicios" TO "service_role";

GRANT TRIGGER ON TABLE public."ejercicios" TO "service_role";

GRANT TRUNCATE ON TABLE public."ejercicios" TO "service_role";

GRANT REFERENCES ON TABLE public."evaluacion_sesiones" TO "service_role";

GRANT TRIGGER ON TABLE public."evaluacion_sesiones" TO "service_role";

GRANT TRUNCATE ON TABLE public."evaluacion_sesiones" TO "service_role";

GRANT REFERENCES ON TABLE public."evaluaciones_objetivo" TO "service_role";

GRANT TRIGGER ON TABLE public."evaluaciones_objetivo" TO "service_role";

GRANT TRUNCATE ON TABLE public."evaluaciones_objetivo" TO "service_role";

GRANT REFERENCES ON TABLE public."jugadores_replay" TO "service_role";

GRANT TRIGGER ON TABLE public."jugadores_replay" TO "service_role";

GRANT TRUNCATE ON TABLE public."jugadores_replay" TO "service_role";

GRANT REFERENCES ON TABLE public."metricas" TO "service_role";

GRANT TRIGGER ON TABLE public."metricas" TO "service_role";

GRANT TRUNCATE ON TABLE public."metricas" TO "service_role";

GRANT REFERENCES ON TABLE public."metricas_bloque" TO "service_role";

GRANT TRIGGER ON TABLE public."metricas_bloque" TO "service_role";

GRANT TRUNCATE ON TABLE public."metricas_bloque" TO "service_role";

GRANT REFERENCES ON TABLE public."metricas_replay" TO "service_role";

GRANT TRIGGER ON TABLE public."metricas_replay" TO "service_role";

GRANT TRUNCATE ON TABLE public."metricas_replay" TO "service_role";

GRANT REFERENCES ON TABLE public."objetivo_versiones" TO "service_role";

GRANT TRIGGER ON TABLE public."objetivo_versiones" TO "service_role";

GRANT TRUNCATE ON TABLE public."objetivo_versiones" TO "service_role";

GRANT REFERENCES ON TABLE public."objetivos" TO "service_role";

GRANT TRIGGER ON TABLE public."objetivos" TO "service_role";

GRANT TRUNCATE ON TABLE public."objetivos" TO "service_role";

GRANT REFERENCES ON TABLE public."perfiles" TO "service_role";

GRANT TRIGGER ON TABLE public."perfiles" TO "service_role";

GRANT TRUNCATE ON TABLE public."perfiles" TO "service_role";

GRANT REFERENCES ON TABLE public."plan_ejercicio" TO "service_role";

GRANT TRIGGER ON TABLE public."plan_ejercicio" TO "service_role";

GRANT TRUNCATE ON TABLE public."plan_ejercicio" TO "service_role";

GRANT REFERENCES ON TABLE public."plan_objetivo" TO "service_role";

GRANT TRIGGER ON TABLE public."plan_objetivo" TO "service_role";

GRANT TRUNCATE ON TABLE public."plan_objetivo" TO "service_role";

GRANT REFERENCES ON TABLE public."planes" TO "service_role";

GRANT TRIGGER ON TABLE public."planes" TO "service_role";

GRANT TRUNCATE ON TABLE public."planes" TO "service_role";

GRANT REFERENCES ON TABLE public."prioridades" TO "service_role";

GRANT TRIGGER ON TABLE public."prioridades" TO "service_role";

GRANT TRUNCATE ON TABLE public."prioridades" TO "service_role";

GRANT REFERENCES ON TABLE public."rangos" TO "service_role";

GRANT TRIGGER ON TABLE public."rangos" TO "service_role";

GRANT TRUNCATE ON TABLE public."rangos" TO "service_role";

GRANT REFERENCES ON TABLE public."reglas" TO "service_role";

GRANT TRIGGER ON TABLE public."reglas" TO "service_role";

GRANT TRUNCATE ON TABLE public."reglas" TO "service_role";

GRANT REFERENCES ON TABLE public."reglas_config" TO "service_role";

GRANT TRIGGER ON TABLE public."reglas_config" TO "service_role";

GRANT TRUNCATE ON TABLE public."reglas_config" TO "service_role";

GRANT REFERENCES ON TABLE public."replays" TO "service_role";

GRANT TRIGGER ON TABLE public."replays" TO "service_role";

GRANT TRUNCATE ON TABLE public."replays" TO "service_role";

GRANT REFERENCES ON TABLE public."sesion_ejercicio" TO "service_role";

GRANT TRIGGER ON TABLE public."sesion_ejercicio" TO "service_role";

GRANT TRUNCATE ON TABLE public."sesion_ejercicio" TO "service_role";

GRANT REFERENCES ON TABLE public."sesion_versiones" TO "service_role";

GRANT TRIGGER ON TABLE public."sesion_versiones" TO "service_role";

GRANT TRUNCATE ON TABLE public."sesion_versiones" TO "service_role";

GRANT REFERENCES ON TABLE public."sesiones" TO "service_role";

GRANT TRIGGER ON TABLE public."sesiones" TO "service_role";

GRANT TRUNCATE ON TABLE public."sesiones" TO "service_role";

GRANT REFERENCES ON TABLE public."solicitudes_contacto" TO "service_role";

GRANT TRIGGER ON TABLE public."solicitudes_contacto" TO "service_role";

GRANT TRUNCATE ON TABLE public."solicitudes_contacto" TO "service_role";

GRANT REFERENCES ON TABLE public."usuarios" TO "service_role";

GRANT TRIGGER ON TABLE public."usuarios" TO "service_role";

GRANT TRUNCATE ON TABLE public."usuarios" TO "service_role";

GRANT SELECT ON SEQUENCE public."analisis_id_analisis_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."analisis_id_analisis_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."analisis_id_analisis_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."archivos_replay_id_archivo_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."archivos_replay_id_archivo_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."archivos_replay_id_archivo_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."bloques_id_bloque_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."bloques_id_bloque_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."bloques_id_bloque_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."cambios_estado_usuario_id_cambio_estado_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."cambios_estado_usuario_id_cambio_estado_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."cambios_estado_usuario_id_cambio_estado_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."conjuntos_reglas_id_conjunto_reglas_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."conjuntos_reglas_id_conjunto_reglas_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."conjuntos_reglas_id_conjunto_reglas_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."ejercicio_versiones_id_ejercicio_version_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."ejercicio_versiones_id_ejercicio_version_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."ejercicio_versiones_id_ejercicio_version_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."ejercicios_id_ejercicio_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."ejercicios_id_ejercicio_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."ejercicios_id_ejercicio_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."evaluaciones_objetivo_id_evaluacion_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."evaluaciones_objetivo_id_evaluacion_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."evaluaciones_objetivo_id_evaluacion_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."jugadores_replay_id_jugador_replay_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."jugadores_replay_id_jugador_replay_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."jugadores_replay_id_jugador_replay_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."metricas_id_metrica_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."metricas_id_metrica_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."metricas_id_metrica_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."objetivo_versiones_id_objetivo_version_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."objetivo_versiones_id_objetivo_version_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."objetivo_versiones_id_objetivo_version_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."objetivos_id_objetivo_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."objetivos_id_objetivo_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."objetivos_id_objetivo_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."plan_ejercicio_id_plan_ejercicio_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."plan_ejercicio_id_plan_ejercicio_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."plan_ejercicio_id_plan_ejercicio_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."plan_objetivo_id_plan_objetivo_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."plan_objetivo_id_plan_objetivo_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."plan_objetivo_id_plan_objetivo_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."planes_id_plan_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."planes_id_plan_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."planes_id_plan_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."prioridades_id_prioridad_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."prioridades_id_prioridad_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."prioridades_id_prioridad_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."rangos_id_rango_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."rangos_id_rango_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."rangos_id_rango_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."reglas_config_id_regla_config_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."reglas_config_id_regla_config_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."reglas_config_id_regla_config_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."reglas_id_regla_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."reglas_id_regla_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."reglas_id_regla_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."replays_id_replay_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."replays_id_replay_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."replays_id_replay_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."sesion_versiones_id_sesion_version_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."sesion_versiones_id_sesion_version_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."sesion_versiones_id_sesion_version_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."sesiones_id_sesion_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."sesiones_id_sesion_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."sesiones_id_sesion_seq" TO "postgres";

GRANT SELECT ON SEQUENCE public."solicitudes_contacto_id_solicitud_seq" TO "postgres";

GRANT UPDATE ON SEQUENCE public."solicitudes_contacto_id_solicitud_seq" TO "postgres";

GRANT USAGE ON SEQUENCE public."solicitudes_contacto_id_solicitud_seq" TO "postgres";

-- Sin políticas de aplicación al capturar el esquema; A08 debe implementarlas/comprobarlas antes del uso compartido.

COMMIT;
