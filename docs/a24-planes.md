# A24 · Versiones y snapshots del plan

A24 guarda la propuesta de A18 como una **versión inmutable** del plan. `planes` ya representa una versión: no se crea `plan_versiones`. Cambiar el contexto inserta la versión siguiente, y las anteriores se recuperan tal como se guardaron.

## Archivos

| Archivo | Qué hace |
| --- | --- |
| `database/seeds/a24-reglas.sql` | Carga `metricas`, `conjuntos_reglas` (mvp.rules.v2 y mvp.rules.v3), `reglas` y `reglas_config` desde `src/domain/rules-config.js`. v3 (PR #74) agrega `cobertura-defensiva-revision` (>= 2 goles como último defensor en 3 de 5 partidas). Es idempotente y aborta si ya hay filas con otros valores. |
| `database/migraciones/a24-planes.sql` | Agrega `planes.contexto jsonb` y la función `a24_guardar_plan` (una transacción, solo service_role). También crea el trigger `a24_inmutable`, que rechaza UPDATE en análisis, prioridades, planes, plan_ejercicio y plan_objetivo. |
| `src/repositories/analysis.js` | Convierte el análisis del motor en filas de `analisis`/`prioridades`. |
| `src/repositories/plans.js` | Guarda (rpc) y lee versiones propias, y arma el objeto plan-version del contrato. |
| `src/routes/plans.js` | `buildProposal` (la lógica de A18, extraída sin cambios) y las rutas `/plans`. |
| `tests/plans-persistence.test.cjs` | 11 pruebas con una base simulada que reproduce las reglas de la función SQL. |
| `scripts/prueba-a24.cjs` | Prueba real contra Supabase dev, con comparación antes/después. |

## Orden de ejecución en Supabase (SQL Editor)

1. `database/seeds/a23-catalogo.sql` (ya ejecutado en dev el 16-nov).
2. `database/seeds/a24-reglas.sql`
3. `database/migraciones/a24-planes.sql`
4. `node --env-file=.env scripts/prueba-a24.cjs`

## Identidad y versiones

| Campo de la API | Columna | Significado |
| --- | --- | --- |
| `plan_id` | `analisis.id_analisis` | Una línea de versiones por bloque (`analisis` es UNIQUE por `id_bloque`). |
| `plan_version_id` | `planes.id_plan` | Fila inmutable. A21 vincula `sesiones.id_plan` a esta versión exacta. |
| `version` | `planes.version` | 1, 2, 3… dentro del mismo análisis (UNIQUE `id_analisis, version`). |
| `plan_exercise_id` | `plan_ejercicio.id_plan_ejercicio` | Ejercicio concreto de esa versión (para `sesion_ejercicio`). |

**Diferencia con el contrato:** `contratos-api.md` decía que un `block_id` nuevo crea una versión nueva del mismo plan. El esquema no lo permite: cada bloque tiene su propio análisis y las versiones se numeran por análisis. Por eso, otro bloque genera otro `plan_id` que empieza en versión 1 (`POST /api/v1/blocks/:blockId/plans`). Las versiones del primer plan no cambian.

## Rutas

Todas exigen sesión (A08), rol jugador o admin y que el bloque sea propio. Un plan ajeno o inexistente responde el mismo 404. Ninguna respuesta se guarda en caché (`Cache-Control: no-store`).

| Método | Ruta | Resultado |
| --- | --- | --- |
| POST | `/api/v1/blocks/:blockId/plans` | Genera con la misma entrada que `plan-proposal` y guarda la versión siguiente del bloque (la 1 si es nuevo). Responde 201 con lo guardado y `Location`. |
| GET | `/api/v1/plans/:planId` | La versión más reciente. |
| GET | `/api/v1/plans/:planId/versions` | Lista: versión, estado, cobertura, minutos y fecha. |
| GET | `/api/v1/plans/:planId/versions/:version` | El snapshot completo de esa versión. |
| POST | `/api/v1/plans/:planId/versions` | Nuevo contexto (minutos, metas, rango/Workshop) sobre el mismo bloque → versión siguiente. |

El cuerpo de los POST es el de `plan-proposal`: `availability_minutes`, `goal_ids`, `workshop_access`, `rank` y `coco_variant_key`. Los campos `version`, `plan_id`, `user_id`, `analysis` o `catalog` responden 400.

## Qué se guarda y dónde

| Dato | Dónde |
| --- | --- |
| Conjunto de reglas usado | `analisis.id_conjunto_reglas` → `conjuntos_reglas.version` |
| Prioridad, orden y valor medido | `prioridades` (`id_regla_config`, `orden`, `valor_actual`). En boost, `valor_actual` = partidas que alcanzan el umbral. |
| Evidencia completa | `prioridades.evidencia` (JSON): mínimo de tiros por modalidad, contexto, cinco replays, fuente y versión de métricas |
| Estado | `planes.estado`: complete → `completo`, partial → `parcial`, empty → `no_disponible` |
| Minutos, días y plataforma | `planes.minutos_disponibles`, `dias_disponibles`, `plataforma_destino`. `sesiones_semana` = días (el perfil no los distingue). |
| Explicación | `planes.justificacion` |
| Ejercicios | `plan_ejercicio`: versión exacta del ejercicio, prioridad del mismo análisis, orden, minutos y dificultad |
| Metas usadas | `plan_objetivo`: versión exacta de la meta (solo metas propias) |
| Resto del snapshot | `planes.contexto`: generador/asignación/catálogo, perfil (rango y Workshop declarados), diagnóstico, snapshots de ejercicios, reason_codes, exclusiones y metas excluidas |

Al leer, el orden, los minutos, la dificultad y la versión de ejercicio salen de `plan_ejercicio`; `contexto` aporta el resto del snapshot.

## Lo que A24 no guarda (responde 422 `PLAN_NOT_PERSISTABLE`)

- Disponibilidad de 0 minutos: `planes.minutos_disponibles > 0`. La propuesta sin guardar sigue explicando el vacío.
- Rutinas nativas de boost (`exercise_version_id: null`): todavía no son filas de `ejercicio_versiones`. Hoy no aparecen en un plan real, porque A15 no guarda el porcentaje de boost y la regla queda no evaluable.

## Otros errores

| Caso | Respuesta |
| --- | --- |
| Reglas de esa versión no cargadas (falta la seed) | 503 `RULES_NOT_CONFIGURED` |
| El bloque ya tiene un análisis guardado con otras prioridades | 409 `ANALYSIS_CONFLICT` (no se mezclan evidencias) |
| Dos guardados simultáneos | Se serializan con `FOR UPDATE` sobre el bloque; si aun así choca, 409 `PLAN_VERSION_CONFLICT` |

## Comprobación

- `npm test`: **458 aprobadas, 0 fallidas** con main integrado (incluye las 11 de A24). Auth y Supabase se simulan; se ejecutan el motor, los repositorios y HTTP reales.
- Prueba real (`scripts/prueba-a24.cjs`): **14/14** en Supabase dev el 16 de noviembre de 2026 (Node.js v24.15.0), después de ejecutar `a24-reglas.sql` (con mvp.rules.v3, tras integrar el PR #74) y `a24-planes.sql` en el SQL Editor.

### Resultado de la prueba real · 16 de noviembre de 2026

Bloque sintético de TEST_A (steam, 2v2, ranked, 6 goles en 20 tiros = 30 %). Recorre el mismo código que las rutas: repositorio A15 → análisis → `generatePlan` → `a24_guardar_plan` → lectura. La autenticación HTTP real no forma parte de esta prueba (está cubierta en A08 y en las pruebas simuladas).

| # | Prueba | Esperado | Obtenido | OK |
| --- | --- | --- | --- | --- |
| 1 | Seed de reglas mvp.rules.v3 | 3 reglas configuradas | 3 regla(s) | Sí |
| 2 | Columna planes.contexto | existe | existe | Sí |
| 3 | Bloque sintético listo | 5 replays, ready | 5 replays, ready | Sí |
| 4 | Guardar versión 1 | versión 1, análisis creado | versión 1, análisis creado true | Sí |
| 5 | Minutos de la versión 1 | asignados ≤ 30 y > 0 | 30 de 30 | Sí |
| 6 | Prioridad guardada con evidencia | orden 1, 30 %, mínimo 15 tiros, 5 replays | orden 1, 30 %, mínimo 15, 5 replays | Sí |
| 7 | plan_ejercicio conserva orden/minutos/dificultad/versión | [[1,23,1,1],[2,7,1,2]] | [[1,23,1,1],[2,7,1,2]] | Sí |
| 8 | Cambiar contexto crea versión 2 | mismo plan_id, versión 2, otra fila | plan_id 5, versión 2, fila 9 | Sí |
| 9 | Versión 1 intacta tras la 2 | idéntica a la leída antes | idéntica | Sí |
| 10 | Lista de versiones | [1, 2] | [1,2] | Sí |
| 11 | UPDATE de una versión guardada | rechazado (55000) | 55000 | Sí |
| 12 | B lee el plan de A | null (404) | null | Sí |
| 13 | B guarda sobre el bloque de A | 404 RESOURCE_NOT_FOUND | 404 RESOURCE_NOT_FOUND | Sí |
| 14 | Sin versiones extra tras los rechazos | 2 filas en planes | 2 filas | Sí |

Antes/después de la actualización: la versión 1 (30 min, sin rango ni Workshop) tenía `castro-ground-shots` con 23 min y `castro-mid-height-shots` con 7 min, ambos de dificultad 1 (ejercicio_versiones 1 y 2). Después se guardó la versión 2 (20 min, Workshop declarado, rango diamond). Al volver a leer la versión 1, el objeto completo fue idéntico al leído antes (`isDeepStrictEqual`).

Al terminar, el script borró sus filas. Una consulta posterior confirmó 0 filas en analisis, prioridades, planes, plan_ejercicio, plan_objetivo y sesiones. Los 3 bloques existentes de dev no se tocaron. Las secuencias de IDs avanzan aunque se borren las filas.

Hallazgos durante la prueba:
- `analisis` tiene dos FK a `bloques` (`id_bloque` e `id_bloque_base`), así que la consulta embebida debe nombrar `bloques!fk_analisis_id_bloque`. Ya está corregido en `src/repositories/plans.js`.
- En dev, `sesiones` tiene una regla de cardinalidad: cada sesión exige al menos una `sesion_versiones` en la misma transacción. Por eso la prueba no inserta una sesión suelta. A21 vincula sus sesiones con `plan_version_id` (FK `sesiones.id_plan → planes.id_plan`) y `plan_exercise_id`.

Para repetir:

```sh
node --env-file=.env scripts/prueba-a24.cjs
npm test
```
