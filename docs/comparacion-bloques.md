# Línea base y comparación de bloques · A10

Implementación preparada con Roberto y asistencia de IA bajo su Release. Reutiliza A14 y A09; calcula diferencias observadas, sin atribuirlas al entrenamiento ni declarar que todos los aumentos representen una mejora deportiva.

## Qué hace cada función

| Función / archivo | Responsabilidad |
| --- | --- |
| [buildComparisonBlock / compareReplayBlocks](../src/services/block-comparison.js) | Recibir replays/perfil, ejecutar la extracción y métricas existentes, reunir fechas/identificadores y entregar la comparación. |
| [compareBlocks](../src/domain/comparison.js) | Comparar un actual y un anterior explícito opcional, sin acceder a red, interfaz o base de datos. |
| [resolveBaseline](../src/domain/comparison.js) | Elegir el anterior compatible más reciente de una lista de candidatos ya obtenida por la aplicación. |
| [parseTimestamp](../src/domain/timestamps.js) | Comprobar una fecha/hora ISO con zona explícita y convertirla en un instante para comparar. |

A19/A15 obtendrán los bloques propios desde persistencia y asociarán sus IDs. A10 recibe esos datos como argumentos; esta entrega no implementa consultas ni un endpoint HTTP. Luis mantiene la interfaz definitiva de Análisis en A19.

## Las tres respuestas

| Estado | Cuándo se devuelve | Diferencias |
| --- | --- | --- |
| `baseline` | El bloque actual tiene metadatos válidos y no se proporcionó anterior, o el historial no contiene uno compatible. | `deltas: null`; motivo `NO_PREVIOUS_COMPATIBLE_BLOCK`. No implica mejora. |
| `comparable` | Bloques compatibles y al menos una métrica comparable. | Un registro por métrica; las no evaluables conservan `delta: null` y motivo. |
| `not_comparable` | Bloque inválido, incompatibilidad, cronología no comprobable o ninguna métrica disponible para comparar. | `deltas: null` y motivos en `reason_codes`. |

La salida conserva `current_block_id` y `baseline_block_id`. Los IDs de dominio se entregan como **cadenas**, incluidos bigint serializados; no se convierten en números ni se exige formato UUID.

## El orden del código

`compareBlocks` primero valida los metadatos de los bloques. Después distingue la ausencia explícita de un anterior:

```js
if (baseline === null) {
  return response(current, null, 'baseline', ['NO_PREVIOUS_COMPATIBLE_BLOCK']);
}
```

`=== null` comprueba que falta ese argumento; un objeto anterior defectuoso se rechaza antes. Esto evita tratar un error de entrada como si fuera el primer bloque.

Luego se reúnen los motivos de incompatibilidad. Solo cuando esa lista queda vacía se calculan las diferencias. La resta central es:

```js
current.value - baseline.value
```

| Comprobación | Motivo principal si falla |
| --- | --- |
| Bloque listo, con ID/contexto/procedencia/versión identificados | `BLOCK_NOT_READY`, `BLOCK_ID_INVALID`, `CONTEXT_INCOMPLETE`, `SOURCE_MISSING` o `METRICS_VERSION_MISSING`. |
| Cinco IDs distintos por bloque | `REPLAY_COUNT_INVALID` o `DUPLICATE_REPLAY`. |
| Bloques distintos | `SAME_BLOCK`. |
| Misma plataforma e identidad | `PLAYER_MISMATCH`. |
| Misma modalidad y tipo de partida | `MODE_MISMATCH` o `MATCH_TYPE_MISMATCH`. |
| Misma versión de métricas y procedencia | `METRICS_VERSION_MISMATCH` o `SOURCE_MISMATCH`. No se mezclan un bloque sintético y uno real. |
| Fechas verificables y seguimiento posterior | `CHRONOLOGY_INVALID`. |
| Sin replays compartidos | `SHARED_REPLAYS`. |
| Alguna métrica disponible para comparar | `NO_COMPARABLE_METRICS`. |

Se conservan varios motivos cuando corresponda. El servicio también mantiene los rechazos de A14 y los IDs de replay afectados. Los identificadores adicionales `rocket_league_id` y `match_guid`, cuando existen, permiten detectar coincidencias entre bloques aunque cambie el ID del proveedor. No se inventan identificadores ausentes.

## Fechas y cronología

El servicio usa **`replay.date`**, con `date_has_timezone: true`, según la respuesta de detalle de la [API oficial de Ballchasing](https://ballchasing.com/doc/api). La fecha de subida `created` no reemplaza una fecha de partida ausente.

Las cinco fechas deben ser válidas. Se normalizan a UTC y se toma la menor como `first_match_at` y la mayor como `last_match_at`, aunque los archivos lleguen desordenados. Estas son fechas de las partidas; no se deduce la hora de finalización sumando una duración de otro reloj.

La condición entre bloques es **`actual.first_match_at > anterior.last_match_at`**. Fechas iguales, invertidas o intercaladas impiden calcular diferencias. Se comparan instantes, no cadenas de texto con offsets distintos.

El formato interno acepta fecha y hora completas con `Z` u offset `±HH:MM`, con hasta tres decimales de segundo. No se asume la zona de la computadora; un formato incompleto, ambiguo, sin zona o una fecha imposible conserva el motivo. Los replays con problemas aparecen en `date_exclusions` y la comparación no fabrica una cronología. El calendario se valida antes de usar `Date.parse`; referencia: [especificación de ECMAScript](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-date.parse).

## Unidades, cobertura y datos faltantes

| Métrica | Unidad de su diferencia |
| --- | --- |
| `goals`, `shots` | `count`. |
| `shooting_pct` | `percentage_points`: 30 % − 25 % = **+5 pp**. |
| `play_duration_s` | `seconds`; ambas mediciones deben conservar alcance `match` y fuente `play_duration`. |

Cada registro de diferencia contiene `baseline`, `current`, `delta`, `unit`, `coverage` de ambos bloques y `missing_reason`. Una métrica ausente, incompleta o con unidades/base incompatibles deja su delta `null`; no impide las demás diferencias válidas. El cero registrado sí participa en la resta. No se redondean los valores antes de restarlos.

Los mínimos de tiros de A02 se aplicarán a la **regla de finalización en A17**. A10 puede describir 25 % → 30 % en bloques con pocos tiros; esa variación no acredita por sí sola una mejora estable ni una causa.

## Elegir un anterior del historial

`resolveBaseline(current, history)` prueba los candidatos con las mismas condiciones. Elige el de `last_match_at` más reciente; ante la misma fecha, desempata por ID ascendente como texto, de manera determinista. Conserva los candidatos incompatibles y sus motivos en `skipped_candidates`.

Un anterior **explícito** incompatible devuelve `not_comparable`. Al resolver una **lista**, si ninguno es compatible, devuelve `baseline` con la explicación de los descartes. No cambia ni ordena el historial original. A19/A15 filtrarán la lista por propietario antes de llamar a esta función.

## Comprobaciones ejecutadas

Desde la raíz del repositorio:

```sh
node --test tests/comparison.test.cjs tests/metrics.test.cjs
```

Con **Node.js v22.19.0 pasaron 92 pruebas: 51 de comparación y 41 de métricas**, sin fallos. Incluyen las tres respuestas, identidad/contexto/versiones, fechas con offsets, cronología inválida, replays compartidos, campos faltantes, unidades/cobertura y selección del anterior más reciente.

Los escenarios originales de [primer bloque](../tests/fixtures/analisis/primer-bloque.json), [comparable](../tests/fixtures/analisis/comparable.json) e [incompatible](../tests/fixtures/analisis/incompatible.json) se adaptan a cinco respuestas **sintéticas** y ejecutan A14 → A09 → A10. Conservan sus entradas/resultados esperados originales. No son nuevas consultas reales al proveedor; reglas y plan siguen pendientes.

El [ejemplo de análisis](../planning/examples/analysis.json) muestra el objeto de comparación actualizado. Las [pruebas](../tests/comparison.test.cjs) permiten ver cómo se construye cada entrada. Guía anterior: [métricas del bloque](metricas-bloque.md).
