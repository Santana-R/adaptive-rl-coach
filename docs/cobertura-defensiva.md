# Cobertura defensiva y decisiones como último hombre

La versión del PR #78 es `mvp.rules.v4`, preparada con Roberto y asistencia de IA bajo su Release. Ajusta la tercera prioridad de **revisión defensiva** por la duración original de cada partida. La primera implementación `mvp.rules.v3` (PR #74) usaba conteos por partida y se conserva como antecedente. Finalización y boost mantienen sus criterios.

## Criterio provisional

| Entrada en cinco partidas distintas del mismo jugador | Evaluación |
| --- | --- |
| Ranked 2v2 y tasa ≥2 goles como último defensor por cinco minutos en al menos tres partidas, con cinco pares válidos de conteo y duración original positiva | Activa `cobertura-defensiva-revision`, prioridad `defensive_review`, score técnico 1. |
| Datos completos, pero solo dos partidas alcanzan la tasa, aunque tengan conteos extremos | Inactiva por este criterio; no demuestra buena defensa. |
| Falta un conteo o una duración original positiva, aunque tres tasas presentes alcancen el límite | No evaluable. Se conserva el faltante, sin convertirlo en cero. |
| 1v1, 3v3, casual o privada | No evaluable; esta versión no extrapola el criterio. |

El límite es inclusivo y se evalúa por partida: `tasa = goles × 300 / play_duration`. Si las cinco duran 300 segundos, `[2,2,2,0,0]` activa y `[9,9,1,0,0]` no. Si duran 600 segundos, `[2,2,2,0,0]` no activa y `[4,4,4,0,0]` sí. Se requieren tres coincidencias y cinco pares completos.

Cero goles es válido. Cero segundos se conserva pero produce tasa null (`zero_duration`). Se admiten segundos fraccionarios originales. No se promedian duraciones ni se sustituye el reloj por `duration`, SQL `duracion_s` o tiempo individual; tampoco se añade otra vez `overtime_seconds`.

**Dos goles equivalentes por cinco minutos en tres partidas es una heurística provisional, no un benchmark calibrado por rango.** Su estado es `provisional_heuristic_pending_validation`. Roberto pidió considerar cuánto duró cada partido; ese ajuste está incorporado. El reloj de la partida no mide la exposición individual como último defensor.

No hay un mínimo de duración deportiva acordado: un gol en 60 segundos equivale a cinco por cinco minutos. Si sucede en tres de cinco puede activar revisión. D14 conserva este caso pendiente del criterio de Roberto; no se inventa un corte adicional ni se presenta la muestra corta como estable.

La prioridad selecciona partidas para estudiar. No atribuye culpa ni identifica un 2v1, un doble commit o una mala rotación. Tampoco presupone que el gol fuera evitable. La [guía con ApparentlyJack](https://dignitas.gg/articles/a-guide-to-defense-in-rocket-league-with-apparentlyjack) orienta la actividad —paciencia, cobertura y momento de entrada—, pero no respalda estos números.

## Cómo pasa el dato por el código

1. `replay-validation.js` conserva la selección de identidad de A14 y lee exclusivamente `selected_player.stats.positioning`.
2. [defensive-positioning.js](../src/domain/defensive-positioning.js) valida conteos, unidades y campos de origen. [metrics.js](../src/domain/metrics.js) conserva observaciones identificadas en `defensive_review_per_replay`, con cobertura, exclusiones y base `provider_last_defender_goals_per_300_match_play_seconds`.
3. [defensive-rule.js](../src/domain/defensive-rule.js) vuelve a validar las observaciones y su correspondencia con los cinco IDs. Cuenta partidas que cumplen la tasa, recalculada desde conteo y reloj originales; rechaza evidencia alterada.
4. [rules.js](../src/domain/rules.js) evalúa finalización, boost y revisión defensiva de manera independiente. Una métrica de tiro ausente no invalida los conteos defensivos.
5. [plans.js](../src/domain/plans.js) recalcula el respaldo de cada prioridad antes de seleccionar su actividad. Rechaza evidencia o scores alterados.
6. El controlador de Análisis muestra la etiqueta defensiva y sus cinco observaciones con el diseño oficial de Luis, sin confundirlas con eficiencia de tiro.

El núcleo de la decisión es equivalente a:

```js
const matched = observations.filter(o => o.goals.value * 300 >= 2 * o.duration.value).length;
const active = matched >= 3;
```

Solo se llega a esa decisión después de comprobar contexto, procedencia, IDs y cobertura completa.

## Evidencia y campos de contexto

La [API documentada de Ballchasing](https://ballchasing.com/doc/api) incluye los campos siguientes. La extracción no usa nombres alternativos de las páginas públicas como equivalentes automáticos.

| Campo original de positioning | Medición conservada | Uso |
| --- | --- | --- |
| `goals_against_while_last_defender` | `goals`, conteo entero seguro no negativo | Numerador de la tasa por partida. |
| `time_most_back` | `role_seconds`, segundos | Contexto. |
| `percent_most_back` | `role_percent`, porcentaje original 0–100 | Contexto. |
| `percent_infront_ball` | `infront_percent`, porcentaje original 0–100 | Contexto. |
| `avg_distance_to_mates` | `mates_distance`, unidades del juego | Contexto. |

Cada medición conserva `value`, `unit`, `scope: player`, `source_field` y `missing_reason`. Booleanos, cadenas, negativos, valores no finitos y promedios fraccionarios no sustituyen un conteo. Un contexto inválido queda no disponible sin inventar su valor ni sustituir la señal principal.

Cada observación añade `duration` (`seconds`, ámbito `match`, origen `play_duration`) y `rate` (`goals_per_5_minutes`, numerador, denominador y referencia de 300 segundos). `coverage` cuenta pares válidos; `count_coverage` conteos y `duration_coverage` relojes positivos.

Los otros datos posicionales **no cambian la activación**. No se infiere que una distancia media y un gol ocurrieran a la vez. La tasa no es una eficiencia defensiva ni se divide entre saves, goles totales o tiempo individual como último defensor.

Los ejemplos de la API y los tests no acreditan una captura autenticada de estos campos. La evidencia real de A05 conservada en el repositorio verifica goles y tiros; la validación del proveedor y la calibración con bloques completos siguen pendientes.

## Actividad nativa y versión del catálogo

[Catálogo de revisión defensiva](../planning/catalogo-revision-defensiva.v1.json), versión `mvp.native-review.v1`, fuente `bundled_native_review`. Incluye `review-last-defender`: **Revisión de cobertura defensiva**.

- Steam/Epic, replay guardada, sin Workshop, BakkesMod ni compañero de práctica.
- Mínimo de cinco minutos; diez es una referencia, no un límite máximo. El presupuesto del plan puede asignar más tiempo para revisar otras situaciones.
- El recurso enlazado es una guía de apoyo, no un enlace a la replay ni un botón para localizar automáticamente un evento.
- El jugador abre manualmente una partida señalada, revisa goles recibidos y retrocede aproximadamente diez segundos para observar la preparación. Comprueba visualmente si ocupaba el papel de último defensor.
- Preguntas: ¿qué opciones tenía el rival y cuál debía cubrir?, ¿convenía entrar o temporizar?, ¿cómo podía preparar mi posición mientras regresaba el compañero?
- Registra una alternativa o que no identifica una opción clara. Si no consigue localizar una situación, registra esa dificultad. La práctica es autorreportada y no demuestra mejora competitiva.

El conteo agregado no entrega los minutos de los eventos ni identifica qué goles lo componen. La actividad conserva esa limitación en las instrucciones.

La relevancia fue confirmada por Roberto; no se afirma una ejecución comprobada dentro del juego. El snapshot lleva `review_status: relevance_confirmed_execution_and_threshold_pending`, `requires_saved_replay: true`, fuente y versión. `exercise_id` y `exercise_version_id` son null: no se inventan filas SQL. A24 debe resolver su persistencia, igual que con las rutinas nativas de boost.

## Minutos y orden

`mvp.plans.v3` y `mvp.allocation.v3` admiten las tres áreas con recursos elegibles. Reparten el presupuesto por igual entre áreas cubiertas, con restos a favor del orden de prioridad. Cubren una actividad de cada área antes de repetir dentro de otra; cada actividad seleccionada conserva al menos cinco minutos. Los repartos internos de tiro y boost continúan iguales.

El orden sigue siendo score descendente e ID ascendente. Boost alto usa 2; boost normal, revisión defensiva y tiro usan 1. Con las tres activas, el orden actual es boost → revisión defensiva → tiro. El score es técnico, no una probabilidad ni una estimación de responsabilidad. El objetivo principal aún no cambia ese orden.

| Disponibilidad, tres prioridades y recursos elegibles | Boost | Revisión defensiva | Tiro | Cobertura |
| --- | ---: | ---: | ---: | --- |
| 4 min | 0 | 0 | 0 | Vacía. |
| 5 min | 5 | 0 | 0 | Parcial; dos prioridades sin cubrir. |
| 10 min | 5 | 5 | 0 | Parcial; tiro sin cubrir. |
| 15 min | 5 | 5 | 5 | Completa. |
| 20 min | 7 | 7 | 6 | Completa. |
| 30 min | 10 | 10 | 10 | Completa. |

Con una sola área respaldada, recibe el presupuesto disponible si caben al menos cinco minutos. No se crea otra necesidad para llenar la sesión. Si el catálogo SQL de tiro no tiene recursos elegibles, las actividades nativas disponibles aprovechan el tiempo y tiro permanece sin cubrir.

La salida conserva `review_catalog_version` cuando usa esta actividad, además de las versiones y snapshots previos. Sigue siendo una propuesta sin guardar; la pantalla Plan A27 no se sustituye por otra interfaz.

## Qué funciona y qué falta de persistencia

La ruta existente de propuesta reutiliza sesión, rol, propiedad del bloque, perfil y catálogo. La lógica funciona cuando recibe conteos explícitos del jugador y la duración original de cada partida. La demo local y las pruebas HTTP ejecutan ese recorrido con entradas sintéticas identificadas y sesiones/transportes simulados.

**El adaptador A15 todavía no dispone de positioning original persistido ni de reloj con procedencia original comprobada para esta tasa.** [stored-block.js](../src/services/stored-block.js) entrega esos datos como null con `stored_positioning_not_recorded`; no los reconstruye de goles totales o relojes. Por ello, los bloques guardados actuales no activan esta regla hasta conservar las mediciones originales. Esta entrega no modifica la base remota.

A13/A15 tienen entregas cerradas; eso no incorpora automáticamente estos campos nuevos. Su conservación requiere una entrega adicional comprobada. A24 necesita mapear los snapshots nativos antes de guardarlos como relaciones. A19 mantiene pendientes de integración privada y revisión visual; A26, revisión deportiva; A33, regresión del ciclo completo. Esta entrega no cierra esas issues.

## Comprobación ejecutada

Con Node.js **22.19.0** en [GitHub Actions, run 43990285053](https://github.com/Santana-R/adaptive-rl-coach/actions/runs/43990285053), head `985cacb7594d7ffe4ab0efc3ce107cc7b2b20cf1`: **481 pruebas aprobadas, 0 fallidas** y matriz A26 **43/43 coincidentes**. Incluyen 41 casos de la [especificación por duración](../planning/fixtures/cobertura-defensiva-duracion.v1.json). El comprobador histórico de 33 casos conserva la hipótesis anterior y se ejecuta aparte; estas cifras no se suman como escenarios independientes.

Se comprobaron límites sin redondear, cinco/diez minutos, segundos fraccionarios, relojes ausentes/cero/inválidos, ausencia de fallback, tiempo extra sin duplicarlo, duración por partida, metadatos alterados, HTTP y controlador en DOM mínimo. La [evidencia A26 v2](../planning/evidence/a26-resultados.v2.json) conserva la salida real y sus commits.

Las entradas son sintéticas y la sesión/transporte simulados. La VM no acredita revisión visual en navegador, campos reales del proveedor, JWT, SQL, calibración poblacional ni ejecución dentro del juego.

### Repetir y ver la demo

```sh
npm ci
npm test
ANALYSIS_DEMO_ENABLED=true npm start
```

Abrir la vista oficial de Análisis con `?case=defense`, `defense-inactive`, `defense-missing`, `defense-long`, `defense-long-active`, `defense-duration-missing` o `three-priorities`. La demo conserva el control explícito y la restricción a loopback.

La [propuesta v0](cobertura-defensiva-propuesta.md) y sus artefactos conservan la especificación inicial: su `runtime_enabled: false` describe aquel borrador, no es un interruptor de las implementaciones posteriores.
