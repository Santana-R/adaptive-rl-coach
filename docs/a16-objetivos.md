# A16 · Objetivos con historial

Metas por modalidad: una **meta principal de rendimiento** y una **meta opcional de entrenamiento**. Editar una meta crea una versión nueva; las anteriores no se modifican. Borrar una meta enlazada a un plan o evaluación la archiva sin destruir su historial.

## Archivos

| Archivo | Qué hace |
| --- | --- |
| `database/migraciones/a16-objetivos.sql` | Métrica `training_minutes`, índice de una meta activa por tipo/modalidad, funciones `a16_guardar_version` y `a16_borrar_objetivo` (solo service_role) y trigger que impide UPDATE en `objetivo_versiones`. |
| `database/migraciones/a16-fix-cardinalidad.sql` | Corrige `arc_private.bloquear_padre_cardinalidad` del esquema de Fase 2 (ver abajo). |
| `src/domain/goals.js` | Validación: tipos, métricas, comparadores, límites y fechas. |
| `src/repositories/goals.js` | Lectura de metas propias y llamadas a las funciones SQL. |
| `src/routes/goals.js` | Rutas `/api/v1/goals`. |
| `tests/goals.test.cjs` | 8 pruebas (base simulada con las reglas de las funciones SQL). |
| `scripts/prueba-a16.cjs` | Prueba real contra Supabase dev. |

Orden en el SQL Editor: `a24-reglas.sql` (carga `shooting_pct`), `a16-fix-cardinalidad.sql` y `a16-objetivos.sql`. Ambas migraciones se pueden volver a ejecutar.

## Rutas

Todas exigen sesión (A08) y rol jugador o admin. El propietario siempre es el usuario de la sesión. Una meta ajena o inexistente responde el mismo 404. Las respuestas usan `Cache-Control: no-store`.

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/v1/goals?status=active\|archived\|all&mode=1v1\|2v2\|3v3` | Lista con la versión vigente de cada meta (por defecto, solo activas). |
| POST | `/api/v1/goals` | Crea la meta (versión 1). 201 con `Location`. |
| GET | `/api/v1/goals/:goalId` | Meta vigente y `versions` (historial completo). |
| PATCH | `/api/v1/goals/:goalId` | Edita y crea la versión siguiente. Sin cambios reales responde 200 con `meta.version_created: false`. |
| DELETE | `/api/v1/goals/:goalId` | `effect`: `archived`, `already_archived` o `deleted`, con un mensaje que explica el efecto. |

### Campos

| Campo | Alta | Edición | Regla |
| --- | --- | --- | --- |
| `type` | obligatorio | no | `performance` o `training` |
| `mode` | obligatorio | no | `1v1`, `2v2`, `3v3` |
| `metric_key` | opcional | no | performance: `shooting_pct` (por defecto). training: `training_minutes` (por defecto). |
| `name` | obligatorio | sí | 1 a 100 caracteres |
| `comparator` | opcional | sí | `shooting_pct`: `>=` (por defecto) o `>`. `training_minutes`: `>=`. |
| `target_value` | obligatorio | sí | `shooting_pct`: mayor que 0 y hasta 100, máximo 4 decimales. `training_minutes`: entero de 1 a 100000. |
| `start_date` | opcional | sí | YYYY-MM-DD. Por defecto, hoy en la zona horaria del perfil. |
| `due_date` | opcional | sí | YYYY-MM-DD, no anterior al inicio, o `null` |

Cualquier otro campo (por ejemplo `user_id`, `status` o `goal_id`) responde 400. Para cambiar el tipo, la modalidad o la métrica, la meta se archiva y se crea otra. La zona horaria sale del perfil (`America/Monterrey` si no hay perfil).

Respuesta (`goal`): `goal_id`, `goal_version_id`, `version`, `type`, `mode`, `status` (`active`/`archived`), `archived_at`, `metric_key`, `unit`, `comparator`, `target_value`, `name`, `start_date`, `due_date`, `timezone`, `activated_at`, `created_at` y, en el detalle, `versions`.

### Errores

| Caso | Respuesta |
| --- | --- |
| Ya hay una meta activa de ese tipo en esa modalidad | 409 `GOAL_ACTIVE_EXISTS` |
| Editar una meta archivada | 409 `GOAL_ARCHIVED` |
| Métrica no cargada en la base | 503 `GOAL_METRIC_NOT_CONFIGURED` |
| Datos inválidos | 400 `INPUT_INVALID` |

## Historial y efecto sobre planes

- **Versiones:** una fila de `objetivo_versiones` por versión, con `activada_en` al guardarse. La vigente es la activada más reciente, el mismo criterio que usa A18 (`src/repositories/plan-goals.js`).
- **Planes ya guardados:** `plan_objetivo` apunta a la versión exacta. Editar o archivar la meta no los modifica (comprobado en la prueba real, caso 13).
- **Planes nuevos:** usan la versión vigente. Una meta archivada se excluye con `goals_excluded: GOAL_INACTIVE`. Una meta de entrenamiento enviada en `goal_ids` de un plan responde 422 `GOAL_UNSUPPORTED`, porque el plan solo usa metas de rendimiento.
- **Las metas no alteran métricas ni diagnóstico:** el generador solo las conserva en `goals_snapshot`. La prueba compara el diagnóstico y los ejercicios con y sin meta y son iguales.
- **Borrar:** si alguna versión está en `plan_objetivo` o `evaluaciones_objetivo`, la meta se archiva (`estado = archivado`, `archivado_en`) y conserva todas sus versiones. Si no está enlazada, se borran la meta y sus versiones en una transacción.
- **Evaluación:** el cumplimiento de la meta (bloques y minutos de sesiones) lo calculan A21/A22 en `evaluaciones_objetivo`; A16 no lo calcula.

## Corrección del esquema: bloqueo de cardinalidad

`arc_private.bloquear_padre_cardinalidad` bloqueaba la fila padre con `UPDATE padre SET id = id`. Los id de `objetivos`, `planes` y `sesiones` son `GENERATED ALWAYS AS IDENTITY`, y Postgres rechaza esa asignación (`428C9 column "id_objetivo" can only be updated to DEFAULT`). Por eso, en dev no funcionaba ningún INSERT ni DELETE en `objetivo_versiones`, `plan_objetivo` ni `sesion_versiones`. Esto afecta también a A24 (planes con metas) y a A21 (sesiones).

`a16-fix-cardinalidad.sql` reemplaza solo esa función por `SELECT … FOR UPDATE`, que toma el mismo bloqueo de fila sin modificarla. Los triggers y las verificaciones diferidas de cardinalidad no cambian.

Una consecuencia de la cardinalidad para quien escriba en estas tablas: una meta necesita al menos una versión al confirmar la transacción. Por eso, crear y borrar se hacen dentro de las funciones SQL y no con dos llamadas separadas.

## Comprobación

- `npm test`: **466 aprobadas, 0 fallidas** (8 nuevas de A16).
- Prueba real (`node --env-file=.env scripts/prueba-a16.cjs`): **15/15** en Supabase dev, 17 de noviembre de 2026 (Node.js v24.15.0), con los perfiles de desarrollo TEST_A/TEST_B. La autenticación HTTP real no forma parte de esta prueba.

| # | Prueba | Esperado | Obtenido | OK |
| --- | --- | --- | --- | --- |
| 1 | Métrica training_minutes | minutes / entrenamiento | minutes / entrenamiento | Sí |
| 2 | Crear meta de rendimiento | versión 1, activa, 35 % | versión 1, active, 35 percent | Sí |
| 3 | Segunda meta activa de rendimiento en 2v2 | 409 GOAL_ACTIVE_EXISTS | 409 GOAL_ACTIVE_EXISTS | Sí |
| 4 | Editar crea versión 2 | versión 2, 40 %, otra fila | versión 2, 40 %, fila 4 | Sí |
| 5 | Versión 1 intacta tras editar | idéntica | idéntica | Sí |
| 6 | UPDATE de una versión de meta | rechazado (55000) | 55000 | Sí |
| 7 | B lee la meta de A | null (404) | null | Sí |
| 8 | B edita la meta de A | 404 RESOURCE_NOT_FOUND | 404 RESOURCE_NOT_FOUND | Sí |
| 9 | B borra la meta de A | 404 RESOURCE_NOT_FOUND | 404 RESOURCE_NOT_FOUND | Sí |
| 10 | Borrar meta sin enlaces | deleted y ya no existe | deleted, no existe | Sí |
| 11 | Plan guardado con la meta | plan_objetivo = versión 4 | ["4"] | Sí |
| 12 | Borrar meta enlazada | archived, 2 versiones | archived, archived, 2 versiones | Sí |
| 13 | El plan conserva la versión de la meta | sin cambios | sin cambios | Sí |
| 14 | Editar meta archivada | 409 GOAL_ARCHIVED | 409 GOAL_ARCHIVED | Sí |
| 15 | Propuesta nueva con la meta archivada | excluida (GOAL_INACTIVE), diagnóstico igual | GOAL_INACTIVE, diagnóstico igual | Sí |

Antes/después de editar: la versión 1 (35 %, `>=`, límite 2026-12-31) se leyó igual antes y después de crear la versión 2 (40 %, `>`).

El script borra todo lo que crea. Una consulta posterior confirmó 0 filas en objetivos, objetivo_versiones, analisis, planes y plan_objetivo; los 3 bloques existentes de dev no se tocaron. En la primera corrida, la limpieza dejó una meta archivada de prueba porque borraba versiones y meta en llamadas separadas (la cardinalidad lo impide). Esa meta se borró con `a16_borrar_objetivo`, el script se corrigió para limpiar con esa función y la segunda corrida terminó con todo en 0.
