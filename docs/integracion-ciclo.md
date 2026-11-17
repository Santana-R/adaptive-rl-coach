# A25 · Integración del recorrido del motor

## Recorrido con replays reales

Se ejecutó Carga → Análisis → Plan en localhost con una sesión real y dos bloques casuales 2v2 del mismo jugador. La fuente que presenta la API es `stored_replay_metrics`.

| Observación | Bloque 8 | Bloque 37 | Cambio |
| --- | --- | --- | --- |
| Partidas con datos | 5 de 5 | 5 de 5 | |
| Goles | 17 | 15 | −2 |
| Tiros | 31 | 15 | −16 |
| Eficiencia de tiro | 54.84 % | 100 % | +45.16 puntos porcentuales |

Durante la carga, el bloque 36 quedó inválido por un replay duplicado. El bloque 37 recibió un límite temporal de Ballchasing en el tercer archivo y se reanudó hasta quedar listo.

El bloque 37 mostró cero prioridades. La eficiencia superó el umbral de finalización del 30 %. Las reglas de boost y cobertura defensiva requieren partidas clasificatorias. En Plan, la rutina vacía explicó el resultado y mostró 0 minutos asignados.

## Historial del plan

Se guardó el plan 24 del bloque 37 con catálogo de base de datos y reglas `mvp.rules.v4`.

| Versión | Minutos disponibles | Resultado comprobado |
| --- | --- | --- |
| 1 | 20 | Se recuperó desde el historial después de guardar la versión 2. |
| 2 | 40 | Apareció junto a la versión 1 en el selector. |
| 3 | 30 | Se recuperó tras recargar la página y mostró `stored_replay_metrics`. |

Al recuperar la versión 1, la pantalla mostraba «No disponible» en el campo de fuente. El cambio guarda `metrics_source` dentro de la propuesta persistida y la pantalla lo lee al consultar el historial. La versión 3, con ID de versión 36, confirmó la corrección.

## Prueba automatizada con datos sintéticos

El caso A25 usa dos bloques de cinco partidas, las rutas HTTP y el motor del proyecto con una base simulada. Comprueba el cambio de 25 % a 30 %, la prioridad de finalización, planes con ejercicios de 30 y 20 minutos, una versión reducida a 10 minutos y la recuperación de la versión anterior. Al variar la evidencia del segundo bloque a 35 %, la propuesta queda vacía.

La prueba de regresión adicional guarda y recupera una propuesta vacía con su fuente de métricas. En el recorrido con replays reales se guardaron versiones vacías. La asignación de ejercicios se verificó en el caso automatizado.

Para repetir las pruebas, ejecuta `node --test tests/plans-persistence.test.cjs tests/plans.test.cjs tests/plan-route.test.cjs`.

## Cambios revisados

- Carga privada y estados de procesamiento. [PR #75](https://github.com/Santana-R/adaptive-rl-coach/pull/75)
- Integración del motor con Análisis. [PR #66](https://github.com/Santana-R/adaptive-rl-coach/pull/66)
- Propuestas con bloques propios y catálogo operativo. [PR #72](https://github.com/Santana-R/adaptive-rl-coach/pull/72)
- Persistencia y consulta de versiones. [PR #79](https://github.com/Santana-R/adaptive-rl-coach/pull/79)
- Interfaz Plan e historial de versiones. [A27](https://github.com/Santana-R/adaptive-rl-coach/issues/27)