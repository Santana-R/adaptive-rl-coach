# Diccionario vigente · 30 tablas de Fase 2

Estructura real consultada el 1 de noviembre de 2026. Sustituye el borrador de ocho entidades. [SQL](../database/esquema-fase2.sql) · [Documento y estado](fase2-estado.md).

Las identidades de usuario son UUID enlazados con auth.users; la mayoría de las entidades de dominio usa bigint generado. Mapear SQL al contrato de API sin crear duplicados para igualar nombres del borrador.

| Grupo | Tablas |
| --- | --- |
| Cuentas, perfil y atención | usuarios, perfiles, cambios_estado_usuario, rangos, solicitudes_contacto |
| Objetivos y definiciones | objetivos, objetivo_versiones, metricas |
| Bloques y estadísticas | bloques, archivos_replay, jugadores_replay, replays, metricas_replay, metricas_bloque |
| Reglas y diagnóstico | conjuntos_reglas, reglas, reglas_config, analisis, prioridades |
| Catálogo y planes | ejercicios, ejercicio_versiones, ejercicio_plataforma, planes, plan_objetivo, plan_ejercicio |
| Práctica y evaluación | sesiones, sesion_versiones, sesion_ejercicio, evaluaciones_objetivo, evaluacion_sesiones |

## Cambios frente al borrador

- metricas es el catálogo de indicadores; mediciones en metricas_replay y metricas_bloque.
- planes representa una versión y conserva contexto; no existe plan_versiones separada.
- Versiones de metas/ejercicios se enlazan mediante plan_objetivo y plan_ejercicio.
- rangos contiene el nivel declarado; no hay rank_history ni historial_rango con ese nombre SQL.
- Reglas/configuración/prioridades tienen tablas propias.
- sesiones y sesion_versiones distinguen identidad y correcciones; evaluacion_sesiones conserva evidencia.

## Columnas y claves verificadas

### analisis

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_analisis | bigint | Sí |
| id_bloque | bigint | Sí |
| id_bloque_base | bigint | No |
| id_conjunto_reglas | bigint | Sí |
| explicacion | text | Sí |
| creado_en | timestamp with time zone | Sí |

Claves: PRIMARY KEY (id_analisis); UNIQUE (id_bloque); FOREIGN KEY (id_bloque) REFERENCES bloques(id_bloque) ON UPDATE RESTRICT ON DELETE RESTRICT; FOREIGN KEY (id_bloque_base) REFERENCES bloques(id_bloque) ON UPDATE RESTRICT ON DELETE RESTRICT; FOREIGN KEY (id_conjunto_reglas) REFERENCES conjuntos_reglas(id_conjunto_reglas) ON UPDATE RESTRICT ON DELETE RESTRICT.

### archivos_replay

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_archivo | bigint | Sí |
| hash_archivo | character(64) | Sí |
| tamano_bytes | bigint | Sí |
| modalidad | character varying(20) | No |
| tipo_partida | character varying(20) | No |
| fecha_partida | timestamp with time zone | No |
| duracion_s | integer | No |

Claves: PRIMARY KEY (id_archivo); UNIQUE (hash_archivo).

### bloques

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_bloque | bigint | Sí |
| id_usuario | uuid | Sí |
| modalidad | character varying(20) | Sí |
| tipo_partida | character varying(20) | Sí |
| ballchasing_grupo_id | text | No |
| estado | character varying(20) | Sí |
| creado_en | timestamp with time zone | Sí |
| completado_en | timestamp with time zone | No |

Claves: PRIMARY KEY (id_bloque); FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE RESTRICT ON DELETE RESTRICT.

### cambios_estado_usuario

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_cambio_estado | bigint | Sí |
| id_usuario | uuid | Sí |
| id_administrador | uuid | Sí |
| estado_nuevo | character varying(20) | Sí |
| motivo | text | Sí |
| fecha | timestamp with time zone | Sí |

Claves: PRIMARY KEY (id_cambio_estado); FOREIGN KEY (id_administrador) REFERENCES usuarios(id_usuario) ON UPDATE RESTRICT ON DELETE RESTRICT; FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE RESTRICT ON DELETE RESTRICT.

### conjuntos_reglas

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_conjunto_reglas | bigint | Sí |
| version | character varying(20) | Sí |
| descripcion | text | Sí |
| creado_en | timestamp with time zone | Sí |

Claves: PRIMARY KEY (id_conjunto_reglas); UNIQUE (version).

### ejercicio_plataforma

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_ejercicio_version | bigint | Sí |
| plataforma | character varying(20) | Sí |

Claves: PRIMARY KEY (id_ejercicio_version, plataforma); FOREIGN KEY (id_ejercicio_version) REFERENCES ejercicio_versiones(id_ejercicio_version) ON UPDATE RESTRICT ON DELETE RESTRICT.

### ejercicio_versiones

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_ejercicio_version | bigint | Sí |
| id_ejercicio | bigint | Sí |
| version | integer | Sí |
| nombre | character varying(100) | Sí |
| categoria | character varying(30) | Sí |
| tipo_recurso | character varying(20) | Sí |
| codigo_enlace | text | No |
| finalidad | text | Sí |
| instrucciones | text | Sí |
| meta | text | Sí |
| dificultad_base | smallint | Sí |
| minutos_base | smallint | Sí |
| creado_en | timestamp with time zone | Sí |

Claves: PRIMARY KEY (id_ejercicio_version); UNIQUE (id_ejercicio, version); FOREIGN KEY (id_ejercicio) REFERENCES ejercicios(id_ejercicio) ON UPDATE RESTRICT ON DELETE RESTRICT.

### ejercicios

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_ejercicio | bigint | Sí |
| activo | boolean | Sí |
| eliminado_en | timestamp with time zone | No |

Claves: PRIMARY KEY (id_ejercicio).

### evaluacion_sesiones

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_evaluacion | bigint | Sí |
| id_sesion_version | bigint | Sí |

Claves: PRIMARY KEY (id_evaluacion, id_sesion_version); FOREIGN KEY (id_evaluacion) REFERENCES evaluaciones_objetivo(id_evaluacion) ON UPDATE RESTRICT ON DELETE RESTRICT; FOREIGN KEY (id_sesion_version) REFERENCES sesion_versiones(id_sesion_version) ON UPDATE RESTRICT ON DELETE RESTRICT.

### evaluaciones_objetivo

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_evaluacion | bigint | Sí |
| id_objetivo_version | bigint | Sí |
| id_bloque | bigint | No |
| fecha_corte | timestamp with time zone | Sí |
| calculado_en | timestamp with time zone | Sí |
| motivo_no_evaluable | text | No |
| evidencia | text | Sí |

Claves: PRIMARY KEY (id_evaluacion); FOREIGN KEY (id_bloque) REFERENCES bloques(id_bloque) ON UPDATE RESTRICT ON DELETE RESTRICT; FOREIGN KEY (id_objetivo_version) REFERENCES objetivo_versiones(id_objetivo_version) ON UPDATE RESTRICT ON DELETE RESTRICT.

### jugadores_replay

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_jugador_replay | bigint | Sí |
| id_archivo | bigint | Sí |
| plataforma | character varying(20) | Sí |
| cuenta_jugador | character varying(100) | Sí |
| tiempo_jugado_s | numeric(10,3) | No |

Claves: PRIMARY KEY (id_jugador_replay); UNIQUE (id_archivo, plataforma, cuenta_jugador); FOREIGN KEY (id_archivo) REFERENCES archivos_replay(id_archivo) ON UPDATE RESTRICT ON DELETE RESTRICT.

### metricas

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_metrica | bigint | Sí |
| codigo | character varying(60) | Sí |
| unidad | character varying(20) | Sí |
| tipo | character varying(20) | Sí |
| descripcion | text | Sí |

Claves: PRIMARY KEY (id_metrica); UNIQUE (codigo).

### metricas_bloque

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_bloque | bigint | Sí |
| version_calculo | character varying(20) | Sí |
| tiempo_jugado_s | numeric(12,3) | Sí |
| tiros_total | integer | No |
| goles_total | integer | No |
| boost_cero_s | numeric(12,3) | No |
| boost_bajo_s | numeric(12,3) | No |
| pads_pequenos_total | integer | No |
| velocidad_media | numeric(8,2) | No |
| distancia_companeros | numeric(10,2) | No |
| zona_defensiva_s | numeric(12,3) | No |

Claves: PRIMARY KEY (id_bloque); FOREIGN KEY (id_bloque) REFERENCES bloques(id_bloque) ON UPDATE RESTRICT ON DELETE RESTRICT.

### metricas_replay

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_jugador_replay | bigint | Sí |
| tiros | integer | No |
| goles | integer | No |
| asistencias | integer | No |
| salvadas | integer | No |
| puntos | integer | No |
| boost_cero_s | numeric(10,3) | No |
| boost_bajo_s | numeric(10,3) | No |
| pads_pequenos | integer | No |
| velocidad_media | numeric(8,2) | No |
| distancia_companeros | numeric(10,2) | No |
| zona_defensiva_s | numeric(10,3) | No |

Claves: PRIMARY KEY (id_jugador_replay); FOREIGN KEY (id_jugador_replay) REFERENCES jugadores_replay(id_jugador_replay) ON UPDATE RESTRICT ON DELETE RESTRICT.

### objetivo_versiones

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_objetivo_version | bigint | Sí |
| id_objetivo | bigint | Sí |
| id_metrica | bigint | Sí |
| id_bloque_base | bigint | No |
| version | integer | Sí |
| nombre | character varying(100) | Sí |
| comparador | character varying(4) | Sí |
| valor_meta | numeric(12,4) | Sí |
| fecha_inicio | date | Sí |
| fecha_limite | date | No |
| zona_horaria | character varying(64) | Sí |
| activada_en | timestamp with time zone | No |
| creado_en | timestamp with time zone | Sí |

Claves: PRIMARY KEY (id_objetivo_version); UNIQUE (id_objetivo, version); FOREIGN KEY (id_bloque_base) REFERENCES bloques(id_bloque) ON UPDATE RESTRICT ON DELETE RESTRICT; FOREIGN KEY (id_metrica) REFERENCES metricas(id_metrica) ON UPDATE RESTRICT ON DELETE RESTRICT; FOREIGN KEY (id_objetivo) REFERENCES objetivos(id_objetivo) ON UPDATE RESTRICT ON DELETE RESTRICT.

### objetivos

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_objetivo | bigint | Sí |
| id_usuario | uuid | Sí |
| tipo | character varying(20) | Sí |
| modalidad | character varying(20) | Sí |
| estado | character varying(20) | Sí |
| archivado_en | timestamp with time zone | No |

Claves: PRIMARY KEY (id_objetivo); FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE RESTRICT ON DELETE RESTRICT.

### perfiles

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_usuario | uuid | Sí |
| gamertag | character varying(60) | Sí |
| plataforma | character varying(20) | Sí |
| cuenta_juego_id | character varying(100) | Sí |
| modalidad_principal | character varying(20) | Sí |
| minutos_sesion | smallint | Sí |
| dias_semana | smallint | Sí |
| zona_horaria | character varying(64) | Sí |

Claves: PRIMARY KEY (id_usuario); FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE RESTRICT ON DELETE RESTRICT.

### plan_ejercicio

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_plan_ejercicio | bigint | Sí |
| id_plan | bigint | Sí |
| id_ejercicio_version | bigint | Sí |
| id_prioridad | bigint | Sí |
| orden | smallint | Sí |
| minutos | smallint | Sí |
| dificultad | smallint | Sí |

Claves: PRIMARY KEY (id_plan_ejercicio); UNIQUE (id_plan, orden); FOREIGN KEY (id_ejercicio_version) REFERENCES ejercicio_versiones(id_ejercicio_version) ON UPDATE RESTRICT ON DELETE RESTRICT; FOREIGN KEY (id_plan) REFERENCES planes(id_plan) ON UPDATE RESTRICT ON DELETE RESTRICT; FOREIGN KEY (id_prioridad) REFERENCES prioridades(id_prioridad) ON UPDATE RESTRICT ON DELETE RESTRICT.

### plan_objetivo

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_plan_objetivo | bigint | Sí |
| id_plan | bigint | Sí |
| id_objetivo_version | bigint | Sí |

Claves: PRIMARY KEY (id_plan_objetivo); UNIQUE (id_plan, id_objetivo_version); FOREIGN KEY (id_objetivo_version) REFERENCES objetivo_versiones(id_objetivo_version) ON UPDATE RESTRICT ON DELETE RESTRICT; FOREIGN KEY (id_plan) REFERENCES planes(id_plan) ON UPDATE RESTRICT ON DELETE RESTRICT.

### planes

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_plan | bigint | Sí |
| id_analisis | bigint | Sí |
| version | integer | Sí |
| estado | character varying(20) | Sí |
| plataforma_destino | character varying(20) | Sí |
| minutos_disponibles | smallint | Sí |
| dias_disponibles | smallint | Sí |
| sesiones_semana | smallint | Sí |
| cumplimiento_previo_pct | numeric(5,2) | No |
| justificacion | text | Sí |
| creado_en | timestamp with time zone | Sí |

Claves: PRIMARY KEY (id_plan); UNIQUE (id_analisis, version); FOREIGN KEY (id_analisis) REFERENCES analisis(id_analisis) ON UPDATE RESTRICT ON DELETE RESTRICT.

### prioridades

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_prioridad | bigint | Sí |
| id_analisis | bigint | Sí |
| id_regla_config | bigint | Sí |
| orden | smallint | Sí |
| valor_actual | numeric(12,4) | Sí |
| valor_base | numeric(12,4) | No |
| evidencia | text | Sí |

Claves: PRIMARY KEY (id_prioridad); UNIQUE (id_analisis, orden); UNIQUE (id_analisis, id_regla_config); FOREIGN KEY (id_analisis) REFERENCES analisis(id_analisis) ON UPDATE RESTRICT ON DELETE RESTRICT; FOREIGN KEY (id_regla_config) REFERENCES reglas_config(id_regla_config) ON UPDATE RESTRICT ON DELETE RESTRICT.

### rangos

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_rango | bigint | Sí |
| id_usuario | uuid | Sí |
| modalidad | character varying(20) | Sí |
| temporada | character varying(20) | Sí |
| rango | character varying(40) | Sí |
| division | smallint | No |
| fecha_registro | timestamp with time zone | Sí |
| fuente | character varying(20) | Sí |

Claves: PRIMARY KEY (id_rango); FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON UPDATE RESTRICT ON DELETE RESTRICT.

### reglas

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_regla | bigint | Sí |
| codigo | character varying(40) | Sí |
| id_metrica | bigint | Sí |
| categoria | character varying(30) | Sí |

Claves: PRIMARY KEY (id_regla); UNIQUE (codigo); FOREIGN KEY (id_metrica) REFERENCES metricas(id_metrica) ON UPDATE RESTRICT ON DELETE RESTRICT.

### reglas_config

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_regla_config | bigint | Sí |
| id_conjunto_reglas | bigint | Sí |
| id_regla | bigint | Sí |
| comparador | character varying(4) | Sí |
| umbral | numeric(12,4) | Sí |
| muestra_minima | integer | Sí |
| direccion_favorable | character varying(16) | Sí |
| umbral_mejora | numeric(12,4) | Sí |

Claves: PRIMARY KEY (id_regla_config); UNIQUE (id_conjunto_reglas, id_regla); FOREIGN KEY (id_conjunto_reglas) REFERENCES conjuntos_reglas(id_conjunto_reglas) ON UPDATE RESTRICT ON DELETE RESTRICT; FOREIGN KEY (id_regla) REFERENCES reglas(id_regla) ON UPDATE RESTRICT ON DELETE RESTRICT.

### replays

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_replay | bigint | Sí |
| id_bloque | bigint | Sí |
| id_jugador_replay | bigint | Sí |
| posicion | smallint | Sí |
| nombre_archivo | character varying(255) | Sí |
| ballchasing_id | text | No |
| estado | character varying(12) | Sí |
| error | text | No |
| origen_carga | character varying(16) | Sí |
| visibilidad | character varying(12) | No |
| acceso_verificado | boolean | Sí |
| grupo_verificado | boolean | Sí |
| limpieza_estado | character varying(20) | Sí |

Claves: PRIMARY KEY (id_replay); UNIQUE (id_bloque, posicion); UNIQUE (id_bloque, id_jugador_replay); FOREIGN KEY (id_bloque) REFERENCES bloques(id_bloque) ON UPDATE RESTRICT ON DELETE RESTRICT; FOREIGN KEY (id_jugador_replay) REFERENCES jugadores_replay(id_jugador_replay) ON UPDATE RESTRICT ON DELETE RESTRICT.

### sesion_ejercicio

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_sesion_version | bigint | Sí |
| id_plan_ejercicio | bigint | Sí |
| minutos | smallint | Sí |
| repeticiones | integer | No |
| completado | boolean | Sí |
| notas | text | No |

Claves: PRIMARY KEY (id_sesion_version, id_plan_ejercicio); FOREIGN KEY (id_plan_ejercicio) REFERENCES plan_ejercicio(id_plan_ejercicio) ON UPDATE RESTRICT ON DELETE RESTRICT; FOREIGN KEY (id_sesion_version) REFERENCES sesion_versiones(id_sesion_version) ON UPDATE RESTRICT ON DELETE RESTRICT.

### sesion_versiones

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_sesion_version | bigint | Sí |
| id_sesion | bigint | Sí |
| version | integer | Sí |
| fecha_practica | timestamp with time zone | Sí |
| dificultad_percibida | character varying(12) | Sí |
| notas | text | No |
| motivo_cambio | text | No |
| registrado_en | timestamp with time zone | Sí |

Claves: PRIMARY KEY (id_sesion_version); UNIQUE (id_sesion, version); FOREIGN KEY (id_sesion) REFERENCES sesiones(id_sesion) ON UPDATE RESTRICT ON DELETE RESTRICT.

### sesiones

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_sesion | bigint | Sí |
| id_plan | bigint | Sí |
| creado_en | timestamp with time zone | Sí |
| eliminado_en | timestamp with time zone | No |
| motivo_exclusion | text | No |

Claves: PRIMARY KEY (id_sesion); FOREIGN KEY (id_plan) REFERENCES planes(id_plan) ON UPDATE RESTRICT ON DELETE RESTRICT.

### solicitudes_contacto

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_solicitud | bigint | Sí |
| nombre | character varying(100) | Sí |
| correo | character varying(254) | Sí |
| mensaje | text | Sí |
| creado_en | timestamp with time zone | Sí |

Claves: PRIMARY KEY (id_solicitud).

### usuarios

| Columna | Tipo SQL | Obligatoria |
| --- | --- | --- |
| id_usuario | uuid | Sí |
| nombre | character varying(100) | Sí |
| rol | character varying(20) | Sí |
| estado | character varying(20) | Sí |
| creado_en | timestamp with time zone | Sí |

Claves: PRIMARY KEY (id_usuario); FOREIGN KEY (id_usuario) REFERENCES auth.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT.

## Uso durante la implementación

A07 revisa/explica la base. A23 prepara catálogo; A15 guarda perfil/bloques/métricas; A24 guarda análisis/prioridades/planes y versiones; A08 define permisos antes del uso compartido. Comprobar conservación de versiones al cambiar metas/catálogo. Las políticas y operaciones conectadas todavía no se declaran implementadas. El SQL es una instantánea, no una migración para el proyecto existente.
