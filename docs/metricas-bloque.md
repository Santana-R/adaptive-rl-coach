# Métricas del bloque · A09

Implementación preparada con Roberto y asistencia de IA bajo sus Releases. Calcula **goles, tiros, eficiencia de tiro y duración jugada de las cinco partidas**. La duración se normaliza desde el campo documentado `play_duration`, con unidad `seconds` y alcance `match`. Boost sigue condicionado a verificar sus campos/denominador en A05, como indica A09. Reglas, comparación entre bloques, rutas HTTP y pantallas corresponden a las siguientes tareas.

## Cómo pasan los datos

1. [calculateReplayBlockMetrics](../src/services/block-metrics.js) recibe cinco respuestas de replay y el perfil del jugador.
2. Reutiliza [extractReplayBlockMetrics de Tadeo](../src/services/replay-validation.js): valida bloque/identidad/modalidad/tipo y extrae exclusivamente al jugador por plataforma e ID. Un bloque rechazado conserva sus motivos y devuelve `data: null`.
3. [calculateBlockMetrics](../src/domain/metrics.js) recibe esa extracción normalizada y agrega conteos/duración. Es una función sin acceso a archivos, red, credenciales ni interfaz.
4. El servicio devuelve el resultado para que los próximos módulos lo consuman. A19 realizará la conexión con una ruta y la interfaz; no hay un endpoint de métricas nuevo en esta entrega.

Se conserva la validación/selección de Tadeo y se amplía su extracción con la duración de la partida. El nuevo servicio conecta esa extracción con la función de dominio.

## El cálculo y el código

Para cada partida, `readCount` comprueba que el valor existe, es un entero no negativo y tiene unidad `count`. **Cero es un valor disponible**. Ausencia, unidad incorrecta o conteo inválido dejan una exclusión con ID de replay, métrica y motivo.

`sumCounts` y `sumDurations` reutilizan el bucle de `sumValues`: cada función indica la unidad, cómo leer un valor y cómo comprobar el total. El bucle recorre el bloque con `for...of` y acumula cada medición disponible:

```js
total += measurement.value;
coverage += 1;
```

`total += measurement.value` equivale a `total = total + measurement.value`. `coverage` cuenta cuántas partidas aportaron un dato utilizable. El total de una métrica se publica solo con cobertura **5 de 5**; si está incompleto, su `value` es `null` y se conservan cobertura/exclusiones.

Cuando ambos totales están completos y hay tiros, `shootingEfficiency` calcula:

```js
value = (goals.value / shots.value) * 100;
```

Se divide una sola vez usando los totales, sin promediar porcentajes por partida. El resultado conserva toda la precisión calculada; el formato visual se resolverá después. Un valor fuera de 0–100 se marca no disponible (`out_of_range`), y un total que exceda la precisión entera segura se marca `unsafe_total`.

## Duración y significado del reloj

La [API oficial de Ballchasing](https://ballchasing.com/doc/api) documenta `play_duration` como tiempo jugado en segundos, excluyendo las cuentas regresivas de saque; puede estar ausente en replays antiguos. Su ejemplo muestra `duration: 394`, `play_duration: 382` y `overtime_seconds: 60` como campos distintos.

El mapeo es **`replay.play_duration` → `values.play_duration_s`**. Se conserva `scope: 'match'` y `source_field: 'play_duration'` para identificar la medición. A09 suma una vez ese valor de cada replay, admite fracciones de segundo y no añade otra vez `overtime_seconds`. Tampoco rellena un faltante con `duration`, 300 segundos o un intervalo `end_time - start_time` del jugador.

Esta métrica describe las partidas del bloque. **No acredita el tiempo individual de participación**, que puede diferir si un jugador entra tarde o sale antes. A15 no debe mapearla automáticamente a `jugadores_replay.tiempo_jugado_s` ni a `metricas_bloque.tiempo_jugado_s`; ese tiempo individual requiere una fuente propia comprobada. A09 entrega la duración de partidas con su significado explícito, sin inventar ese dato.

Un dato cero registrado se conserva. Un valor ausente, negativo, no numérico o no finito deja la duración no disponible con motivo/cobertura. La suma conserva precisión numérica, sin redondear a minutos. Si las duraciones tienen unidades o bases distintas, se excluyen en vez de mezclarse.

## Ejemplos comprobados

El [fixture de A14](../tests/fixtures/replay-validation/bloque-a14.json) es **sintético**. Sus goles/tiros son 3/3, 0/2, 1/4, 2/5 y 1/3: suman **7 goles y 17 tiros**, con eficiencia aproximada de **41.1764705882353 %**.

La prueba manual de ponderación usa 1/1, 1/1, 0/2, 0/2 y 0/2. Los totales dan **2/8 = 25 %**; promediar los cinco porcentajes sin pesos daría 40 %, que no es la eficiencia del bloque.

Las duraciones sintéticas del fixture son **300 + 315.5 + 240 + 420.25 + 305 = 1580.75 segundos**. El cuarto replay declara tiempo extra; se suma su duración jugada una sola vez. El fixture también conserva `duration` como distractor para comprobar que se elige el campo correcto. Su respuesta normalizada esperada incluye el nuevo dato y se comprueba completa contra la extracción de A14.

| Entrada / situación | Resultado esperado y comprobado |
| --- | --- |
| 3 goles / 10 tiros completos en 2v2 | 30 %. A09 calcula la métrica; A17 aplicará el mínimo de 15 tiros para evaluar la regla. |
| 7 goles / 23 tiros | Aproximadamente 30.434782608695652 %, sin redondear a 30 para decidir. |
| 0 goles con tiros positivos | 0 %, dato medido válido. |
| 0 tiros en cinco partidas con datos | Tiros = 0; eficiencia `null`, `zero_denominator`, cobertura 5. |
| Un replay sin tiros | Total de tiros y eficiencia `null`, cobertura 4; goles completos siguen disponibles. |
| Goles ausentes en un replay y tiros ausentes en otro | Cada conteo tiene cobertura 4; la eficiencia tiene cobertura 3 porque requiere ambos en la misma partida. |
| Ambos campos ausentes en un replay | Eficiencia con cobertura 4; dos exclusiones explican los campos faltantes del mismo replay. |
| Ninguna partida aporta tiros | Tiros/eficiencia `null`, cobertura 0, `not_available`. |
| Duplicado, jugador ausente o contexto incompatible dentro del bloque | A14 rechaza el bloque y el servicio no calcula métricas. |
| Duraciones variables completas | `play_duration_s = 1580.75`, `seconds`, cobertura 5 y alcance `match`. |
| Un replay sin `play_duration` | Duración total `null`, cobertura 4 y replay excluido; goles/tiros válidos siguen disponibles. |
| Cinco duraciones registradas como cero | 0 segundos, cobertura 5. |
| Jugador con intervalo individual más corto que la partida | La duración conserva alcance `match`; no se publica un tiempo individual deducido. |

## Qué devuelve cada métrica

| Campo | Significado |
| --- | --- |
| `value` | Total o porcentaje; `null` si no se puede calcular conforme a la cobertura acordada. |
| `unit` | `count` para goles/tiros; `percent` para eficiencia; `seconds` para duración. |
| `coverage` | Número de partidas con datos utilizables (0–5). En eficiencia, partidas con ambos campos. No expresa confianza estadística. |
| `missing_reason` | `null` si se calculó; motivo estable si no está disponible. |
| `excluded` | Lista con `replay_id`, `metric_key` y `reason` para cada dato excluido. Puede contener dos campos de un mismo replay. |
| `numerator` / `denominator` | Solo en eficiencia: goles y tiros utilizados, con clave/unidad/valor. Un total incompleto permanece `null`; cero tiros conserva el denominador 0. |
| `scope` / `source_field` | Solo en duración: `match` / `play_duration`. Permiten distinguirla de otros relojes y del tiempo individual. |

La salida del dominio incluye `metrics_version`, `sample_size: 5`, contexto del jugador/modalidad/tipo, procedencia y los cinco `replay_ids`. Este servicio interno aún no recibe un `block_id` persistido ni envuelve una respuesta HTTP. El futuro consumidor A19/A15 añadirá esa asociación conforme al [contrato compartido](contratos-api.md).

La procedencia por defecto del adaptador es `ballchasing`; para fixtures, el código de pruebas llama al servicio con `{ source: 'synthetic' }`. La etiqueta se conserva en la salida. Estas pruebas no acreditan cargas reales ni llamadas nuevas al proveedor.

## Cómo comprobarlo

Desde la raíz del repositorio, ejecutar:

```sh
node --test tests/metrics.test.cjs
```

Node ejecuta las [pruebas del módulo](../tests/metrics.test.cjs) y compara los resultados con lo esperado. Se usa su herramienta incorporada, sin instalar dependencias de prueba. Resultado de esta entrega con **Node.js v22.19.0: 41 pruebas aprobadas, 0 fallidas**.

Para ejecutar el ejemplo desde Terminal en Mac, también desde la raíz:

```sh
node <<'NODE'
const fixture = require('./tests/fixtures/replay-validation/bloque-a14.json');
const { calculateReplayBlockMetrics } = require('./src/services/block-metrics');
const result = calculateReplayBlockMetrics(
  fixture.input.replays, fixture.input.profile, { source: 'synthetic' }
);
console.log(result.data.values);
NODE
```

Muestra goles = 7, tiros = 17, eficiencia ≈ 41.18 % y duración = 1580.75 segundos, junto con unidades, cobertura, denominadores y alcance. El código del ejemplo llama a las funciones implementadas; no elige resultados precargados. La verificación del campo de duración se basa en la documentación oficial y pruebas sintéticas: no se ejecutó una nueva consulta autenticada ni una carga real en esta entrega.

Guía: [motor paso a paso](motor-paso-a-paso.md). Referencia de la herramienta de pruebas: [documentación oficial de Node.js](https://nodejs.org/api/test.html).
