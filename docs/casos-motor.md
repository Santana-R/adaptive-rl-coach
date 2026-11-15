# Primera regla y casos del motor · A02

Criterios deportivos acordados con Roberto el 14 de noviembre de 2026, con apoyo de IA para documentar y comprobar los ejemplos. A02 definió las entradas y resultados esperados. A09/A10/A17 ya ejecutan métricas, comparación y primera regla con fixtures sintéticos; el recorrido completo con plan sigue en A18/A33. Ver [reglas implementadas](reglas-motor.md).

## Regla: sugerir práctica de finalización

| Campo | Definición acordada |
| --- | --- |
| Identificador / versión de configuración | `finalizacion-eficiencia` / `mvp.rules.v1`. Identifican la configuración publicada y evaluada en A17. |
| Señal | Eficiencia de tiro baja según el criterio inicial; sugiere práctica de colocación y finalización. |
| Fuente de entrada | Goles y tiros del jugador seleccionado en cinco partidas distintas, válidas y de la misma modalidad/tipo. A14 entrega conteos por replay y A09 los agrega. |
| Campos / unidad | `goals` y `shots`: conteos. `shooting_pct`: porcentaje. Faltantes conservan `null` y motivo. |
| Fórmula | `100 × suma(goals) / suma(shots)`, con goles y tiros disponibles en las cinco partidas. No promediar porcentajes de partidos sin ponderarlos. |
| Cobertura necesaria | Datos de goles y tiros en **5 de 5 partidas** del jugador; un dato necesario ausente impide evaluar esta regla. |
| Muestra mínima | **1v1: 20 tiros; 2v2: 15 tiros; 3v3: 10 tiros**, acumulados en el bloque completo. |
| Condición | Cumplir la muestra de la modalidad **y eficiencia menor o igual al 30 %**. Comparar el valor sin redondear. |
| Salida sugerida | Prioridad de finalización con goles, tiros, eficiencia, modalidad, mínimo aplicado y regla/versión utilizada. A17 usa score técnico fijo 1 y publica evidencia conforme al contrato compartido. |
| Explicación de ejemplo | «Anotaste 3 goles en 10 tiros: 30 %. Cumples el mínimo de 10 tiros para 3v3 y el criterio inicial de eficiencia ≤ 30 %; se sugiere practicar colocación y finalización». |
| Actividad posible | Práctica de colocación/finalización en entrenamiento libre o un paquete compatible. A23 prepara un ejercicio activo con recurso revisado; A18 decide su selección y minutos. Aquí no se inventa un código de entrenamiento. |
| Revisión posterior | Reevaluar con otro bloque compatible y la configuración registrada: si cumple el criterio, mantener la sugerencia; si supera 30 %, dejar de activarla en esa evaluación. Muestra insuficiente o faltantes no acreditan mejora. A24 conservará el historial. |
| Límites | Los mínimos y el 30 % son **heurísticos acordados, sin calibración con bloques reales**. El porcentaje aislado no demuestra la causa de los tiros fallados ni que un plan haya producido una mejora. |

## Estados que deben distinguirse

| Situación | Eficiencia mostrada | Evaluación de la regla |
| --- | --- | --- |
| Datos completos, tiros suficientes y eficiencia ≤ 30 % | Valor calculado. | Activada: sugerir finalización. |
| Datos completos, tiros suficientes y eficiencia > 30 % | Valor calculado. | No activada por este criterio; no es una conclusión sobre todas las necesidades del jugador. |
| Datos completos y tiros positivos por debajo del mínimo | Valor calculado. | No evaluable: «Muestra insuficiente para aplicar esta regla». |
| Cero tiros | `null`, motivo `zero_denominator`. | No evaluable; 0/0 no se muestra como 0 %. |
| Goles o tiros necesarios ausentes | `null` y motivo/cobertura. | No evaluable; un faltante no se convierte en cero. |

Cero goles con tiros positivos sí produce 0 % y puede activar la regla si cumple el mínimo. No debe confundirse con falta de datos.

La regla puede evaluar un primer bloque válido que tenga muestra suficiente; no requiere un bloque anterior para sugerir práctica. La comparación temporal es una operación distinta.

## Cálculo comprobado del caso comparable

Fuente: [comparable.json](../tests/fixtures/analisis/comparable.json), datos **sintéticos**, con totales ya proporcionados para dos bloques de cinco partidas.

| Bloque | Goles | Tiros (denominador) | Eficiencia |
| --- | ---: | ---: | ---: |
| Anterior, 2v2 | 2 | 8 | 100 × 2 / 8 = **25 %** |
| Actual, 2v2 | 3 | 10 | 100 × 3 / 10 = **30 %** |

Diferencia actual − anterior: **30 − 25 = +5 puntos porcentuales**. Se conserva este ejemplo para comprobar la aritmética y el contexto de comparación.

Ambos bloques tienen menos de los **15 tiros requeridos en 2v2**: sus porcentajes se pueden calcular, pero la regla de finalización no es evaluable por muestra insuficiente. La compatibilidad de comparación y la muestra mínima para recomendar algo son criterios separados. A10 y A17 ejecutan este ejemplo mediante cinco respuestas sintéticas; su ejecución no acredita replays reales ni una mejora causada por el entrenamiento.

## Revisión de los cinco escenarios existentes

Todos declaran `synthetic: true`. Primer bloque, comparable e incompatible ahora se ejecutan mediante A14/A09/A10 con cinco respuestas sintéticas preparadas a partir de sus totales/fechas. A17 ahora también ejecuta la primera regla y el ordenador; **el plan y la comprobación completa A33 siguen pendientes**. Cada JSON registra esa distinción en `verification`; ver [comparación de bloques](comparacion-bloques.md).

| Archivo | Resultado esperado revisado | Comprobación registrada | Pendiente contra el motor |
| --- | --- | --- | --- |
| [primer-bloque.json](../tests/fixtures/analisis/primer-bloque.json) | Línea base, motivo legible y delta `null`. | Ejecutado con A14/A09/A10; A17 confirma muestra insuficiente en 2v2. | A33. |
| [comparable.json](../tests/fixtures/analisis/comparable.json) | 25 %, 30 % y +5 pp. | Normalización/comparación ejecutadas; A17 conserva porcentajes y rechaza recomendación por muestra insuficiente. | A33. |
| [incompatible.json](../tests/fixtures/analisis/incompatible.json) | `not_comparable`, `MODE_MISMATCH` y delta `null`. | A10 impide el delta 2v2 → 3v3; A17 sí activa finalización para el actual 3v3 con 3/10. | A33. |
| [faltantes.json](../tests/fixtures/analisis/faltantes.json) | Cero tiros → eficiencia `null`; boost ausente no activa su regla de ejemplo. | A09/A17 ejecutados: 0/0 es null y no hay prioridad. No se publicó una regla de boost. | A33. |
| [empate.json](../tests/fixtures/analisis/empate.json) | Como propuesta técnica: `rule-a`, `rule-b`, `rule-c`; máximo tres. | Ordenador A17 ejecutado por score descendente e ID ascendente; cuatro candidatos ficticios verifican el máximo de tres. | A33. |

El prototipo Python no está disponible en el repositorio y no bloquea esta entrega. A17 contrastó la demo JavaScript disponible, conservó la clave shooting y fijó el orden técnico; los umbrales deportivos siguen la ficha acordada, sin atribuirles calibración.

## Nuevos ejemplos de finalización

Fuente: [regla-finalizacion.json](../tests/fixtures/analisis/regla-finalizacion.json). Contiene **17 casos sintéticos** de totales de bloque y cobertura declarada, para especificar esta regla. Su formato no sustituye la respuesta real de A14 ni modifica el contrato público de la API.

Incluye los mínimos exactos y un tiro por debajo para las tres modalidades; el límite inclusivo del 30 %; valores superiores; el caso 2v2 con 3/10; cero tiros; cero goles con tiros; goles/tiros ausentes y una eficiencia superior al límite que podría verse como 30 % si se redondease a enteros.

Comprobación ejecutada en esta entrega: los **17 resultados esperados** coinciden con la aritmética exacta y los criterios acordados: **6 activados, 4 no activados y 7 no evaluables**. También se comprobaron los seis JSON, los ocho enlaces locales de este documento y la conservación de las entradas/resultados originales de los cinco escenarios existentes. El PR registra el procedimiento y sus límites.

La revisión inicial comprobó la especificación. Ahora los 17 casos se ejecutan mediante A09/A17, con los mismos estados esperados. La suite conjunta suma 147 pruebas aprobadas (55 de A17 y 92 anteriores). A18 elegirá ejercicios del catálogo de A23; A24 conservará versiones y A33 comprobará el recorrido completo.

Guía de trabajo: [motor paso a paso](motor-paso-a-paso.md).
