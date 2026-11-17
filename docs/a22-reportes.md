# A22 · Progreso y reportes

## Petición y respuesta

`GET /api/v1/reports?from=2026-11-01&to=2026-11-16`

La ruta requiere una sesión activa y responde con `Cache-Control: no-store`. Ambas fechas son obligatorias, usan `YYYY-MM-DD` e incluyen el día completo en `America/Monterrey`. Internamente se aplica el intervalo UTC desde el inicio de `from` hasta el inicio del día siguiente a `to`.

La respuesta exitosa contiene `data` y `meta.contract_version`. El ejemplo reproduce `data` con registros ficticios. [Ejemplo de respuesta](../planning/examples/report.json)

## Consumo en A28

| Sección | Qué mostrar |
| --- | --- |
| `performance` | Cada punto es un bloque completo del período. `value` es su porcentaje de tiro, `numerator` son los goles y `denominator` son los tiros. La muestra y el denominador de la serie suman los replays y tiros por bloque. |
| `performance.points[].comparison` | `delta_pp` expresa el cambio en puntos porcentuales frente al bloque anterior compatible de A10 dentro del período. Usa `reason_codes` para explicar una comparación sin diferencia disponible. |
| `training` | `total_minutes` suma la práctica declarada de sesiones activas. `sample_size` cuenta las sesiones con duración válida. Cada punto identifica su sesión y la versión exacta del plan. |
| `rank` | Presenta `rank_label`, `division`, `season` y `recorded_at` como rango declarado. Usa el `mode` de cada punto para separar modalidades. |
| `goals` | Presenta cada versión vigente durante el período con su meta, su valor observado y su evidencia. `sample_size` cuenta las versiones que pudieron evaluarse. |

Cada sección incluye `period`, `source`, `unit`, `sample_size`, `denominator`, `points` y `excluded`. Muestra `null` como «Sin datos» y conserva los ceros registrados. Cuando `training.sample_size` sea `0`, muestra el estado de lista vacía. `excluded` identifica las observaciones que se descartaron y su motivo.

Una meta usa la actividad de su propia vigencia y modalidad. Para entrenamiento se suman los minutos declarados. Para tiro se toma el último bloque válido completo de la modalidad. `active_until` es exclusivo y `goal_period` contiene las fechas de la meta en su zona horaria.

| Estado de la meta | Presentación |
| --- | --- |
| `met` | Cumplida. |
| `not_met` | Pendiente según el valor observado. |
| `insufficient_data` | Sin datos suficientes. `actual_value` es `null` y `reason` indica la causa. |

## Verificación

| Prueba | Resultado |
| --- | --- |
| HTTP sin sesión | `401 AUTH_REQUIRED` y `Cache-Control: no-store`. |
| HTTP con sesión real, del 1 al 16 de noviembre de 2026 | `200` con cinco replays, cero minutos declarados, cero registros de rango y cero metas evaluadas. |
| Caso automatizado con datos ficticios | Cambio de 25 % a 30 % con 18 tiros en la muestra, 31 minutos declarados, un rango y tres versiones de metas evaluadas. |
| Suite completa | `npm test` terminó con `fail 0`. |

Para repetir los casos automatizados, ejecuta `node --test tests/reports.test.cjs`.