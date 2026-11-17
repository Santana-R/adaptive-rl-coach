# A21 · Sesiones de entrenamiento

## API

| Método | Ruta | Resultado |
| --- | --- | --- |
| POST | `/api/v1/sessions` | `201` con la sesión registrada y su ubicación en `Location`. |
| GET | `/api/v1/sessions` | `200` con las sesiones activas propias y el resumen `meta.training`. |
| GET | `/api/v1/sessions/:sessionId` | `200` con el detalle de una sesión propia activa. |
| PATCH | `/api/v1/sessions/:sessionId` | `200` con la sesión corregida. Un cambio efectivo genera una versión nueva. |
| DELETE | `/api/v1/sessions/:sessionId` | `200` con `effect: deleted`. El borrado lógico excluye la sesión de la consulta y del conteo. |

El alta requiere `plan_version_id`, `plan_exercise_id`, `performed_at` y `duration_minutes`. `notes` es opcional. La fecha debe incluir zona horaria y ser presente o pasada. La duración debe ser un entero de 1 a 32767 minutos.

La sesión queda ligada a una versión exacta del plan. La corrección acepta fecha, ejercicio de esa versión, duración y notas. Una sesión ajena o inexistente devuelve el mismo `404 RESOURCE_NOT_FOUND`. Un ejercicio de otra versión devuelve `422 INPUT_INVALID`.

`meta.training` informa `session_count` y `duration_minutes` con `source: self_reported_sessions`. Estos datos representan práctica declarada por el jugador.

## Verificación

| Prueba | Resultado |
| --- | --- |
| Consulta HTTP sin sesión | `401 AUTH_REQUIRED`. |
| Consulta HTTP con una sesión real | `200` con 0 sesiones activas y 0 minutos declarados. |
| Prueba SQL en Supabase con dos versiones del plan | `A21 OK · 14 → 19 → 4 minutos`. La sesión inicial conservó su vínculo con v1 tras crear v2. |
| Comparación de la fila de métricas del bloque antes y después del CRUD | Los valores fueron iguales. |
| Pruebas automatizadas de Express con Supabase simulado | Tres casos de A21 aprobados. La suite completa terminó con `fail 0`. |

Para reproducir la prueba SQL, aplicar `database/migraciones/a21-sesiones.sql` en desarrollo y ejecutar `database/tests/a21-sesiones.sql`. La prueba revierte las filas temporales al finalizar. Para reproducir las pruebas HTTP, ejecutar `node --test tests/sessions.test.cjs`.