# Roberto: construir el motor paso a paso

El motor recibe estadísticas y contexto, calcula métricas, aplica reglas explicables y construye un plan. Es la parte que decide qué practicar y cómo cambia la recomendación. RL significa Rocket League; la primera versión usa reglas deterministas.

Tú propones y revisas la interpretación deportiva. El acompañamiento sigue: **explicación sencilla → ejemplo manual → una parte de código → comprobación → conexión con la web**. Cada comando se explica antes de usarlo. Esta es la ruta de aprendizaje; todavía no acredita implementación.

| Paso | Qué vas a entender y construir | Issue | Comprobación |
| --- | --- | --- | --- |
| 1 | Fórmula y primera ficha de regla. | A02 | Entrada/salida esperada antes de programar. |
| 2 | Resumir cinco partidas sin perder denominadores. | A09 | Coincide con cálculo manual; cero tiros es no evaluable. |
| 3 | Línea base y comparación compatible. | A10 | Primer bloque, posterior e incompatible tienen respuestas explicadas. |
| 4 | Reglas y orden de hasta tres prioridades. | A17 | Variar valores cambia activación; faltantes no inventan conclusiones. |
| 5 | Selección y minutos de ejercicios. | A18 | Respeta plataforma/tiempo y explica cobertura parcial/vacía. |
| 6 | Servicio/endpoint y conexión a la interfaz definitiva de Análisis que construye Luis. | A19 compartida | La interfaz usa el resultado calculado y explica evidencia; cada autor registra su aportación. |
| 7 | Parámetros y adaptación con otro bloque. | A26/A33/A34 | Salidas corresponden a entradas y se conservan versiones. |

Tadeo entrega estadísticas/contexto; David catálogo y guardado; Luis diseña y construye las interfaces definitivas de Carga/Análisis/Plan según los bosquejos. El cascarón PROGSA es provisional; [reparto de frontend](frontend-luis.md). Tus funciones de dominio pueden calcular sin botones, internet ni credenciales.

## Primera sesión: A02

Abrir `tests/fixtures/analisis/comparable.json`. El ejemplo es sintético y resume dos bloques de cinco partidas:

- Anterior: 2 goles / 8 tiros × 100 = 25 %.
- Actual: 3 goles / 10 tiros × 100 = 30 %.
- Diferencia: 30 − 25 = +5 puntos porcentuales.

La eficiencia del bloque utiliza goles totales / tiros totales. Un promedio simple de porcentajes por partido puede ser distinto cuando tienen diferente cantidad de tiros. Cero tiros produce una eficiencia no evaluable.

Antes de código, explicar qué recibe la función, qué devuelve y por qué necesita denominadores. Después registrar el resultado esperado y preparar el primer commit propio.

## Ficha de una regla antes de activarla

| Campo | Qué decidir contigo |
| --- | --- |
| Señal | Necesidad medible y límites de interpretación. |
| Entrada | Campo disponible, unidad, muestra y procedencia verificada. |
| Condición | Comparación y valores iniciales identificados como heurísticos. |
| Evidencia mínima | Cuándo hay información suficiente para evaluarla. |
| Salida | Prioridad, razón legible y criterio para revisarla después. |
| Actividades | Ejercicios compatibles y por qué podrían ayudar. |
| Adaptación | Evidencia para mantener, reducir o sustituir prioridad. |
| Versión | Regla/configuración utilizada. |

Los valores 30 % de boost bajo y 35 % de eficiencia en la demo son ilustrativos. No se copian como umbrales deportivos validados. Si falta campo/muestra, se explica que la regla no es evaluable. Distancia o velocidad aisladas no demuestran errores de rotación/intención.

## Qué demostrar el 9

El motor calcula sobre entradas, sin elegir salidas precargadas por el nombre de un escenario. Mostrar dos bloques comparables, razones, cambio de plan al variar evidencia/minutos y versión anterior conservada.

Casos adicionales: primer bloque, modalidad incompatible, dato ausente/cero tiros, empate, plataforma incompatible y catálogo sin cobertura. Misma entrada/configuración produce mismo resultado.

La ruta preferida usa la fuente real comprobada en A05. Un JSON anonimizado guardado o datos sintéticos sirven como respaldo identificado que ejecuta el mismo motor. No presentar selección de nombres como procesamiento de .replay, ni dos bloques como prueba de que el plan causó una mejora.
