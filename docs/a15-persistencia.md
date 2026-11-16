# Persistencia de perfil, bloques, replays y métricas · A15

A15 guarda y recupera en Supabase el perfil del jugador, sus bloques de cinco replays y las métricas por replay y por bloque. Reutiliza las 30 tablas de Fase 2: no crea ni modifica tablas. El único cambio en la base es una función para guardar un bloque en una sola transacción (ver [Cambio de esquema](#cambio-de-esquema)).

| Pieza | Archivo |
| --- | --- |
| Perfil | `src/repositories/profile.js` → `getProfile`, `saveProfile` |
| Bloques, replays y métricas | `src/repositories/blocks.js` → `createBlock`, `getBlock`, `listBlocks`, `updateBlockStatus`, `saveBlockMetrics`, `saveReplayMetrics`, `metricsFromCalculation` |
| Traducción de errores | `src/repositories/errors.js` |
| Guardado transaccional | `database/migraciones/a15-guardar-bloque.sql` → `public.a15_guardar_bloque(uuid, jsonb)` |
| Consultas de integridad | `database/migraciones/a15-integridad.sql` |
| Pruebas con Supabase simulado | `tests/repositories.test.cjs` (`npm test`) |
| Prueba real y seed de ejemplo | `scripts/prueba-a15.cjs` |

## Reglas comunes

- **Propietario.** Cada función recibe el `userId` de la sesión verificada (`req.user.id`, A08) y filtra por él. Un `id`/`user_id` enviado por el cliente se ignora. Un bloque ajeno se comporta igual que uno inexistente: `null`, y la ruta responde 404 `RESOURCE_NOT_FOUND`.
- **Null.** Un dato ausente se guarda y se devuelve como `null`, nunca como 0. Un 0 medido se guarda como 0.
- **Sin duplicados.** Lo garantizan las restricciones existentes:
  - `archivos_replay.hash_archivo` es UNIQUE: el mismo `.replay` subido otra vez reutiliza la fila.
  - `jugadores_replay` es UNIQUE por (archivo, plataforma, cuenta).
  - `replays` es UNIQUE por (bloque, posición) y por (bloque, jugador_replay): el mismo replay no entra dos veces en un bloque → 409 `DUPLICATE_REPLAY`.
  - `metricas_replay` y `metricas_bloque` tienen una fila por clave primaria: volver a guardar reemplaza.
- **Errores.** UNIQUE → 409 `DUPLICATE_REPLAY`; CHECK, NOT NULL o FK → 422 `INPUT_INVALID`; otro fallo → 503 `PROVIDER_UNAVAILABLE`. La respuesta nunca incluye el mensaje original de Postgres.
- **Identificador.** `block_id` es el `id_bloque` (bigint) como texto, por ejemplo `"7"`. Un id que no es numérico devuelve `null` sin consultar.

## Mapeo SQL → objetos de la aplicación

### perfiles → profile

| Columna | Clave API |
| --- | --- |
| id_usuario | id |
| gamertag | gamertag |
| plataforma | platform |
| cuenta_juego_id | player_id |
| modalidad_principal | mode |
| minutos_sesion | available_minutes |
| dias_semana | days_per_week |
| zona_horaria | timezone |

`saveProfile` crea o reemplaza la fila del usuario (upsert por `id_usuario`). Todos los campos son obligatorios en SQL: si falta alguno responde 422 antes de consultar.

### bloques → block

| Columna | Clave API |
| --- | --- |
| id_bloque | block_id (texto) |
| estado | status (ver tabla de estados) |
| modalidad | mode |
| tipo_partida | match_type |
| ballchasing_grupo_id | ballchasing_group_id |
| creado_en | created_at |
| completado_en | completed_at |
| — | expected_replays (5) y ready_replays (replays con estado `ok`) |
| metricas_bloque | metrics |
| replays | replays (ordenados por posición) |

**Estados.** `bloques.estado` usa los valores del CHECK `ck_bloques_estado`. La API usa los del [contrato](contratos-api.md#carga-y-estados).

| SQL | API | Significado |
| --- | --- | --- |
| borrador | pending | Bloque creado, aún sin procesar |
| procesando | processing | Replays en proceso |
| espera_servicio | failed | Fallo recuperable del servicio externo; permite reintento |
| requiere_correccion | invalid | Hay que corregir archivos o contexto |
| completo | ready | Cinco replays válidos; `completado_en` con fecha |

`updateBlockStatus` pone `completado_en` al pasar a `ready` y lo deja en null en cualquier otro estado, como exige `ck_bloques_cierre`.

### replays + jugadores_replay + archivos_replay → replay

| Tabla.columna | Clave API |
| --- | --- |
| replays.posicion | position (1–5) |
| replays.nombre_archivo | file_name |
| replays.ballchasing_id | ballchasing_id |
| replays.estado | status (`pending`, `failed`, `ok`, igual que en SQL) |
| replays.error | error |
| replays.origen_carga | upload_origin (`propia` → `own`, `reutilizada` → `reused`) |
| replays.visibilidad | visibility |
| replays.acceso_verificado | access_verified |
| replays.grupo_verificado | group_verified |
| replays.limpieza_estado | cleanup_status (por defecto `pendiente`) |
| archivos_replay.hash_archivo | file.hash |
| archivos_replay.tamano_bytes | file.size_bytes |
| archivos_replay.modalidad | file.mode |
| archivos_replay.tipo_partida | file.match_type |
| archivos_replay.fecha_partida | file.played_at |
| archivos_replay.duracion_s | file.duration_s |
| jugadores_replay.plataforma | player.platform |
| jugadores_replay.cuenta_jugador | player.player_id |
| jugadores_replay.tiempo_jugado_s | player.time_played_s |

### metricas_replay → replay.metrics

| Columna | Clave API |
| --- | --- |
| tiros | shots |
| goles | goals |
| asistencias | assists |
| salvadas | saves |
| puntos | score |
| boost_cero_s | boost_zero_s |
| boost_bajo_s | boost_low_s |
| pads_pequenos | small_pads |
| velocidad_media | avg_speed |
| distancia_companeros | teammate_distance |
| zona_defensiva_s | defensive_zone_s |

### metricas_bloque → block.metrics

| Columna | Clave API |
| --- | --- |
| version_calculo | metrics_version |
| tiempo_jugado_s | play_duration_s |
| tiros_total | shots |
| goles_total | goals |
| boost_cero_s | boost_zero_s |
| boost_bajo_s | boost_low_s |
| pads_pequenos_total | small_pads |
| velocidad_media | avg_speed |
| distancia_companeros | teammate_distance |
| zona_defensiva_s | defensive_zone_s |

`metricsFromCalculation(resultado)` convierte la salida de `calculateBlockMetrics` (`src/domain/metrics.js`) en este objeto: toma `metrics_version`, `play_duration_s`, `shots` y `goals`, y deja null las métricas que el motor aún no calcula. `shooting_pct` no se guarda porque se deriva de goles y tiros. `tiempo_jugado_s` es obligatorio en SQL (> 0): sin duración no se pueden guardar métricas de bloque (422).

## Cambio de esquema

`database/migraciones/a15-guardar-bloque.sql` añade la función `public.a15_guardar_bloque(p_id_usuario uuid, p_bloque jsonb) → bigint`:

- Inserta en `bloques`, reutiliza o inserta en `archivos_replay` y `jugadores_replay`, inserta en `replays` y, si vienen, en `metricas_replay` y `metricas_bloque`.
- Se ejecuta en una sola transacción: si algo falla (replay repetido, CHECK, FK), no queda nada guardado.
- Solo `service_role` puede ejecutarla (Express). `anon` y `authenticated` no.
- No crea, modifica ni borra tablas. Se puede volver a ejecutar (`CREATE OR REPLACE`).

## Cómo probarlo

1. **Pruebas automáticas:** `npm test`. Los casos de A15 están en `tests/repositories.test.cjs`.
2. **Migración:** Supabase → SQL Editor → pegar el **contenido** de `database/migraciones/a15-guardar-bloque.sql` → Run. Después, la comprobación del final del archivo (esperado: `service_role = true`, `authenticated = false`, `anon = false`).
3. **Prueba real:** `node --env-file=.env scripts/prueba-a15.cjs`. Pide los correos de los jugadores A y B de [la prueba de A08](prueba-auth.md#cuentas-de-prueba) y no los imprime. Crea bloques sintéticos (hashes aleatorios, cuenta `TEST_A15`), comprueba propietario, null, duplicados y atomicidad, imprime una tabla de resultados y borra lo creado.
4. **Seed de ejemplo para el equipo:** el mismo script con `--conservar` deja un bloque completo de 5 replays sintéticos para el jugador A.
5. **Integridad:** pegar `database/migraciones/a15-integridad.sql` en el SQL Editor. Cada consulta debe devolver 0 filas; la última da el resumen de conteos para la evidencia.

## Pendiente

- **Rutas.** `/api/v1/blocks` sigue usando el almacén en memoria (`src/services/block-store.js`, A11). Conectar las rutas a estos repositorios y añadir `PATCH /api/v1/profile` queda para una entrega posterior.
- **A24** reutiliza estas consultas para análisis, prioridades y planes.
- **A37** verifica la seguridad del acceso compartido.

## Resultado de la prueba real · 15 de noviembre de 2026

Ejecutada por David con `scripts/prueba-a15.cjs` contra el proyecto Supabase de desarrollo, con los jugadores A y B de la prueba de A08. Antes se aplicó `a15-guardar-bloque.sql` y se comprobaron los permisos: `service_role = true`, `authenticated = false`, `anon = false`. `npm test`: 247 de 247.

| # | Prueba | Esperado | Obtenido | OK |
| --- | --- | --- | --- | --- |
| 1 | Leer perfil propio | perfil o null | perfil | Sí |
| 2 | Guardar perfil enviando otro id | id = A, mismos datos | id = A | Sí |
| 3 | Crear bloque con 5 replays | 5 replays, processing | 5 replays, processing | Sí |
| 4 | Null conservado | boost_zero_s = null en replay 1 | null; shots = 2 | Sí |
| 5 | Métricas de bloque | tiros 20, otras null | tiros 20, avg_speed null | Sí |
| 6 | B pide el bloque de A | null (404) | null | Sí |
| 7 | Lista de B | no incluye el bloque de A | no lo incluye | Sí |
| 8 | Mismo archivo en otro bloque | no crea otro archivo | archivos 5 → 5 | Sí |
| 9 | Replay repetido en un bloque | 409 DUPLICATE_REPLAY | 409 DUPLICATE_REPLAY | Sí |
| 10 | Sin datos a medias tras el error | bloques sin cambio | bloques 2 → 2 | Sí |
| 11 | Marcar bloque como ready | ready con completed_at | ready, completed_at con fecha | Sí |
| 12 | B cambia el estado del bloque de A | 404 RESOURCE_NOT_FOUND | 404 RESOURCE_NOT_FOUND | Sí |
| 13 | Volver a guardar métricas | 1 fila por bloque | 1 fila | Sí |

**13 de 13 casos correctos.** Después de la prueba no quedaron filas en `bloques`, `replays`, `archivos_replay`, `jugadores_replay`, `metricas_replay` ni `metricas_bloque`. Los 2 perfiles de prueba se conservan con sus datos.

Hallazgo durante la prueba: la primera versión de la función leía el hash en la clave `hash`, mientras que el código lo envía como `hash_archivo`. Postgres rechazó la fila (NOT NULL) y, por la transacción, no quedó nada guardado. Se corrigió la función y se añadió una prueba que compara las claves que lee el SQL con las que envía `toBlockPayload`.
