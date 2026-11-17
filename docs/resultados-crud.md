# Resultados de los tres CRUD y de la integridad (A39)

Este archivo lo genera `scripts/auditoria-a39.cjs --doc` con el resultado de una ejecución real. No se edita a mano.

| Dato | Valor |
| --- | --- |
| Fecha de ejecución | 2026-11-16 23:25 (America/Monterrey) |
| Commit base | `92a67de` |
| Entorno | Supabase de desarrollo, Express local |
| Resultado | 56 de 56 casos correctos; 0 consultas de integridad con filas inválidas |

## Cómo se ejecutó

1. La auditoría levanta la aplicación Express real y llama a las rutas por HTTP con tres identidades: el jugador A (`TEST_A`), el jugador B (`TEST_B`) y el administrador.
2. Rol, estado, propiedad, validación, repositorios y base de datos son los reales. Solo se sustituye la verificación del token de Supabase Auth, que ya cubre `scripts/prueba-auth.ps1` ([resultado](prueba-auth.md)).
3. El bloque de cinco replays es sintético. El plan se guarda con `POST /api/v1/blocks/:blockId/plans`.
4. Al terminar, la auditoría borra lo que creó y reactiva el ejercicio que desactivó.

Para repetirla:

```
node --env-file=.env scripts/auditoria-a39.cjs --doc
```

Antes hay que ejecutar en el SQL Editor `database/migraciones/a31-historial-sesiones.sql` y `database/migraciones/a39-auditoria.sql`.

## Metas (`/api/v1/goals`) · 18 de 18

Editar crea una versión nueva. Borrar elimina la meta si no está en ningún plan; si está enlazada, la archiva y conserva sus versiones.

| # | Operación | Caso | Esperado | Obtenido | OK |
| --- | --- | --- | --- | --- | --- |
| 1 | Alta | Crear una meta de rendimiento | 201, versión 1, active | 201, versión 1, active | Sí |
| 2 | Alta | Segunda meta activa del mismo tipo y modalidad | 409 GOAL_ACTIVE_EXISTS | 409 GOAL_ACTIVE_EXISTS | Sí |
| 3 | Alta | Valor fuera de rango (150 %) | 400 INPUT_INVALID | 400 INPUT_INVALID | Sí |
| 4 | Alta | Sin sesión | 401 AUTH_REQUIRED | 401 AUTH_REQUIRED | Sí |
| 5 | Consulta | Lista de metas activas | 200, incluye la meta | 200, incluye la meta | Sí |
| 6 | Consulta | Detalle de la meta | 200, versión 1, meta 35 | 200, versión 1, meta 35 | Sí |
| 7 | Consulta | Otro jugador pide el detalle | 404 RESOURCE_NOT_FOUND | 404 RESOURCE_NOT_FOUND | Sí |
| 8 | Consulta | Otro jugador lista sus metas | 200, sin la meta | 200, sin la meta | Sí |
| 9 | Edición | Cambiar el valor a 40 | 200, versión 2, meta 40, versión nueva | 200, versión 2, meta 40, versión nueva | Sí |
| 10 | Edición | Historial después de editar | 2 versiones; la 1 conserva 35 | 2 versiones; la 1 conserva 35 | Sí |
| 11 | Edición | Enviar el mismo valor | 200, versión 2, sin versión nueva | 200, versión 2, sin versión nueva | Sí |
| 12 | Edición | Otro jugador edita la meta | 404 RESOURCE_NOT_FOUND | 404 RESOURCE_NOT_FOUND | Sí |
| 13 | Eliminación | Otro jugador borra la meta | 404 RESOURCE_NOT_FOUND | 404 RESOURCE_NOT_FOUND | Sí |
| 14 | Eliminación | Borrar una meta sin plan | 200 deleted; después 404 | 200 deleted; después 404 | Sí |
| 15 | Archivo | Borrar una meta enlazada a un plan | 200 archived; archived con 2 versiones | 200 archived; archived con 2 versiones | Sí |
| 16 | Archivo | Listas después de archivar | fuera de activas; en archivadas | fuera de activas; en archivadas | Sí |
| 17 | Archivo | Editar una meta archivada | 409 GOAL_ARCHIVED | 409 GOAL_ARCHIVED | Sí |
| 18 | Archivo | El plan conserva la versión de la meta | plan versión 1 idéntico | plan versión 1 idéntico | Sí |

## Sesiones (`/api/v1/sessions`) · 19 de 19

Corregir crea una versión nueva. Borrar es lógico: la fila queda con `eliminado_en` y deja de contar en la práctica declarada.

| # | Operación | Caso | Esperado | Obtenido | OK |
| --- | --- | --- | --- | --- | --- |
| 1 | Alta | Registrar 20 min en la versión 1 del plan | 201, versión 1, 20 min | 201, versión 1, 20 min | Sí |
| 2 | Alta | Duración de 0 minutos | 400 INPUT_INVALID | 400 INPUT_INVALID | Sí |
| 3 | Alta | Fecha futura | 400 INPUT_INVALID | 400 INPUT_INVALID | Sí |
| 4 | Alta | Sin sesión | 401 AUTH_REQUIRED | 401 AUTH_REQUIRED | Sí |
| 5 | Alta | Otro jugador registra sobre el plan de A | 404 RESOURCE_NOT_FOUND | 404 RESOURCE_NOT_FOUND | Sí |
| 6 | Consulta | Lista con el resumen de práctica | 200, 1 sesión, 20 min | 200, 1 sesión, 20 min | Sí |
| 7 | Consulta | Detalle de la sesión | 200, versión 1 | 200, versión 1 | Sí |
| 8 | Consulta | Otro jugador pide el detalle | 404 RESOURCE_NOT_FOUND | 404 RESOURCE_NOT_FOUND | Sí |
| 9 | Edición | Corregir a 35 min | 200, versión 2, 35 min | 200, versión 2, 35 min | Sí |
| 10 | Edición | Historial después de corregir | 2 versiones; la 1 conserva 20 min | 2 versiones; la 1 conserva 20 min | Sí |
| 11 | Edición | Enviar el mismo valor | 200, versión 2 | 200, versión 2 | Sí |
| 12 | Edición | Otro jugador corrige la sesión | 404 RESOURCE_NOT_FOUND | 404 RESOURCE_NOT_FOUND | Sí |
| 13 | Edición | Usar un ejercicio de la versión 2 del plan | 422 INPUT_INVALID | 422 INPUT_INVALID | Sí |
| 14 | Edición | Vínculo después de guardar la versión 2 del plan | sigue en la versión 1 | sigue en la versión 1 | Sí |
| 15 | Eliminación | Otro jugador borra la sesión | 404 RESOURCE_NOT_FOUND | 404 RESOURCE_NOT_FOUND | Sí |
| 16 | Eliminación | Borrar la segunda sesión (5 min) | 200 deleted; después 404 | 200 deleted; después 404 | Sí |
| 17 | Eliminación | Recalcular la práctica declarada | antes 2 sesiones y 40 min; después 1 sesión y 35 min | antes 2 sesiones y 40 min; después 1 sesión y 35 min | Sí |
| 18 | Eliminación | Registro de la sesión borrada | la fila se conserva con eliminado_en | la fila se conserva con eliminado_en | Sí |
| 19 | Eliminación | Borrar la misma sesión otra vez | 404 RESOURCE_NOT_FOUND | 404 RESOURCE_NOT_FOUND | Sí |

## Ejercicios (`/api/v1/exercises`) · 19 de 19

Solo el administrador crea, edita y borra. Un ejercicio usado en un plan no se elimina: se desactiva, y el plan guardado conserva su versión.

| # | Operación | Caso | Esperado | Obtenido | OK |
| --- | --- | --- | --- | --- | --- |
| 1 | Consulta | El jugador consulta el catálogo | 200, solo ejercicios activos | 200, solo ejercicios activos | Sí |
| 2 | Consulta | El jugador pide los inactivos | 403 ROLE_DENIED | 403 ROLE_DENIED | Sí |
| 3 | Consulta | Sin sesión | 401 AUTH_REQUIRED | 401 AUTH_REQUIRED | Sí |
| 4 | Alta | El jugador crea un ejercicio | 403 ROLE_DENIED | 403 ROLE_DENIED | Sí |
| 5 | Alta | Ficha sin título | 400 INPUT_INVALID | 400 INPUT_INVALID | Sí |
| 6 | Alta | El administrador crea un ejercicio | 201, versión 1, inactivo, not_in_reviewed_content | 201, versión 1, inactivo, not_in_reviewed_content | Sí |
| 7 | Consulta | Detalle para el administrador | 200, versión 1, 10 min | 200, versión 1, 10 min | Sí |
| 8 | Consulta | Borrador inactivo en el catálogo | el administrador lo ve; el jugador no | el administrador lo ve; el jugador no | Sí |
| 9 | Edición | Cambiar la duración a 15 min | 200, versión 2, 15 min, versión nueva | 200, versión 2, 15 min, versión nueva | Sí |
| 10 | Edición | Historial después de editar | 2 versiones; la 1 conserva 10 min | 2 versiones; la 1 conserva 10 min | Sí |
| 11 | Edición | Activar un ejercicio sin revisión técnica | 409 EXERCISE_NOT_VERIFIED | 409 EXERCISE_NOT_VERIFIED | Sí |
| 12 | Edición | El jugador edita un ejercicio | 403 ROLE_DENIED | 403 ROLE_DENIED | Sí |
| 13 | Eliminación | El jugador borra un ejercicio | 403 ROLE_DENIED | 403 ROLE_DENIED | Sí |
| 14 | Eliminación | Borrar un ejercicio sin uso | 200 deleted; después 404 | 200 deleted; después 404 | Sí |
| 15 | Eliminación | Borrar un ejercicio que no existe | 404 RESOURCE_NOT_FOUND | 404 RESOURCE_NOT_FOUND | Sí |
| 16 | Archivo | Desactivar un ejercicio usado en un plan | 200, inactivo; fuera del catálogo del jugador | 200, inactivo; fuera del catálogo del jugador | Sí |
| 17 | Archivo | El plan conserva el ejercicio | plan versión 1 idéntico | plan versión 1 idéntico | Sí |
| 18 | Archivo | Borrar un ejercicio usado en un plan | 200 already_inactive; el ejercicio se conserva | 200 already_inactive; el ejercicio se conserva | Sí |
| 19 | Archivo | Reactivar el ejercicio | 200, activo; de vuelta en el catálogo del jugador | 200, activo; de vuelta en el catálogo del jugador | Sí |

## Integridad

`a39_auditar_integridad()` cuenta las filas que rompen cada regla en toda la base. Se ejecutó con los datos de la auditoría todavía guardados (una meta archivada con dos versiones, dos versiones del plan, una sesión corregida y otra borrada) y otra vez después de borrarlos, con el mismo resultado.

| Consulta | Filas inválidas |
| --- | --- |
| `objetivos_sin_version` | 0 |
| `objetivo_versiones_no_consecutivas` | 0 |
| `objetivo_versiones_sin_activar` | 0 |
| `objetivos_activos_duplicados` | 0 |
| `objetivos_archivo_incoherente` | 0 |
| `plan_objetivo_de_otro_propietario` | 0 |
| `planes_versiones_no_consecutivas` | 0 |
| `plan_ejercicio_orden_repetido` | 0 |
| `analisis_base_de_otro_propietario` | 0 |
| `sesiones_sin_version` | 0 |
| `sesion_versiones_no_consecutivas` | 0 |
| `sesion_versiones_sin_ejercicio` | 0 |
| `sesion_ejercicio_de_otro_plan` | 0 |
| `sesiones_baja_incoherente` | 0 |
| `ejercicios_sin_version` | 0 |
| `ejercicio_versiones_no_consecutivas` | 0 |
| `ejercicios_activos_eliminados` | 0 |
| `rangos_fuente_no_declarada` | 0 |

| Consulta | Regla |
| --- | --- |
| `objetivos_sin_version`, `sesiones_sin_version`, `ejercicios_sin_version` | Cada meta, sesión y ejercicio tiene al menos una versión. |
| `*_versiones_no_consecutivas` | Las versiones van de 1 a n sin huecos: ninguna se borró ni se reescribió. |
| `objetivo_versiones_sin_activar` | Toda versión de meta guardada está activada. |
| `objetivos_activos_duplicados` | Una sola meta activa por jugador, modalidad y tipo. |
| `objetivos_archivo_incoherente`, `sesiones_baja_incoherente` | El estado y la fecha de archivo o de baja coinciden. |
| `plan_objetivo_de_otro_propietario` | Un plan solo enlaza metas del mismo jugador. |
| `plan_ejercicio_orden_repetido` | Un plan no repite el orden de un ejercicio. |
| `analisis_base_de_otro_propietario` | La línea base de un análisis es un bloque del mismo jugador. |
| `sesion_versiones_sin_ejercicio` | Cada versión de sesión registra su ejercicio y sus minutos. |
| `sesion_ejercicio_de_otro_plan` | Una sesión solo usa ejercicios de la versión del plan a la que está ligada. |
| `ejercicios_activos_eliminados` | Un ejercicio eliminado no queda activo. |
| `rangos_fuente_no_declarada` | Todo rango es declarado por el jugador (`self_reported`). |

Las reglas que la base ya impide por sí misma están en las pruebas de cada tarea: [metas](a16-objetivos.md), [planes](a24-planes.md), [sesiones](a21-sesiones.md), [rango e historial](a31-rangos.md) y [catálogo](a32-admin.md).

## Seed de demo

`scripts/seed-demo.cjs` deja un perfil de desarrollo con datos de demostración coherentes y comprueba la integridad al terminar.

```
node --env-file=.env scripts/seed-demo.cjs              crea los datos en TEST_B
node --env-file=.env scripts/seed-demo.cjs --reset      borra los datos de TEST_B
node --env-file=.env scripts/seed-demo.cjs --account TEST_A
```

Solo acepta cuentas `TEST_` o `DEMO_`. Antes de crear, borra los bloques, planes, sesiones, metas y rangos de esa cuenta.

| Dato | Contenido |
| --- | --- |
| Rango declarado | Dos registros en 2v2: Platinum III hace 28 días y Diamond I hace 7 días. |
| Bloques | Dos bloques 2v2 ranked de cinco replays sintéticos: 25 % de tiro hace 14 días y 30 % hace 2 días. |
| Metas | Rendimiento (versión 1 con 30 %, versión 2 con 35 %) y entrenamiento (60 min). |
| Planes | Uno por bloque. El primero usa la versión 1 de la meta de rendimiento; el segundo, la versión 2. |
| Sesiones | Tres activas sobre el primer plan (20, 25 y 20 min; la última corregida desde 15) y una borrada. |

Las metas se activan al crearse, así que la de rendimiento queda sin datos suficientes hasta que se suba un bloque posterior. La de entrenamiento sí se evalúa con las sesiones del seed.
