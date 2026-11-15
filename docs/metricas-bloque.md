# Métricas del bloque · primer avance de A09

Implementación preparada con Roberto y asistencia de IA bajo su Release. Este avance calcula **goles, tiros y eficiencia de tiro**. A09 permanece abierta: la duración requiere confirmar/exponer su campo en A14; boost se añadirá cuando se verifiquen su significado, unidad y denominador. No se implementan aquí reglas, comparación entre bloques, rutas HTTP ni pantallas.

## Cómo pasan los datos

1. [calculateReplayBlockMetrics](../src/services/block-metrics.js) recibe cinco respuestas de replay y el perfil del jugador.
2. Reutiliza [extractReplayBlockMetrics de Tadeo](../src/services/replay-validation.js): valida bloque/identidad/modalidad/tipo y extrae exclusivamente al jugador por plataforma e ID. Un bloque rechazado conserva sus motivos y devuelve `data: null`.
3. [calculateBlockMetrics](../src/domain/metrics.js) recibe esa extracción normalizada y agrega los conteos. Es una función sin acceso a archivos, red, credenciales ni interfaz.
4. El servicio devuelve el resultado para que los próximos módulos lo consuman. A19 realizará la conexión con una ruta y la interfaz; no hay un endpoint de métricas nuevo en esta entrega.

El archivo de Tadeo se conserva. El nuevo servicio conecta su extracción con la nueva función de dominio.

## El cálculo y el código

Para cada partida, `readCount` comprueba que el valor existe, es un entero no negativo y tiene unidad `count`. **Cero es un valor disponible**. Ausencia, unidad incorrecta o conteo inválido dejan una exclusión con ID de replay, métrica y motivo.

En `sumCounts` se recorre el bloque con `for...of` y se acumula cada valor disponible:

```js
total += count.value;
coverage += 1;
```

`total += count.value` equivale a `total = total + count.value`. `coverage` cuenta cuántas partidas aportaron un dato utilizable. El total de una métrica se publica solo con cobertura **5 de 5**; si está incompleto, su `value` es `null` y se conservan cobertura/exclusiones.

Cuando ambos totales están completos y hay tiros, `shootingEfficiency` calcula:

```js
value = (goals.value / shots.value) * 100;
```

Se divide una sola vez usando los totales, sin promediar porcentajes por partida. El resultado conserva toda la precisión calculada; el formato visual se resolverá después. Un valor fuera de 0–100 se marca no disponible (`out_of_range`), y un total que exceda la precisión entera segura se marca `unsafe_total`.

## Ejemplos comprobados

El [fixture de A14](../tests/fixtures/replay-validation/bloque-a14.json) es **sintético**. Sus goles/tiros son 3/3, 0/2, 1/4, 2/5 y 1/3: suman **7 goles y 17 tiros**, con eficiencia aproximada de **41.1764705882353 %**.

La prueba manual de ponderación usa 1/1, 1/1, 0/2, 0/2 y 0/2. Los totales dan **2/8 = 25 %**; promediar los cinco porcentajes sin pesos daría 40 %, que no es la eficiencia del bloque.

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

## Qué devuelve cada métrica

| Campo | Significado |
| --- | --- |
| `value` | Total o porcentaje; `null` si no se puede calcular conforme a la cobertura acordada. |
| `unit` | `count` para goles/tiros; `percent` para eficiencia. |
| `coverage` | Número de partidas con datos utilizables (0–5). En eficiencia, partidas con ambos campos. No expresa confianza estadística. |
| `missing_reason` | `null` si se calculó; motivo estable si no está disponible. |
| `excluded` | Lista con `replay_id`, `metric_key` y `reason` para cada dato excluido. Puede contener dos campos de un mismo replay. |
| `numerator` / `denominator` | Solo en eficiencia: goles y tiros utilizados, con clave/unidad/valor. Un total incompleto permanece `null`; cero tiros conserva el denominador 0. |

La salida del dominio incluye `metrics_version`, `sample_size: 5`, contexto del jugador/modalidad/tipo, procedencia y los cinco `replay_ids`. Este servicio interno aún no recibe un `block_id` persistido ni envuelve una respuesta HTTP. El futuro consumidor A19/A15 añadirá esa asociación conforme al [contrato compartido](contratos-api.md).

La procedencia por defecto del adaptador es `ballchasing`; para fixtures, el código de pruebas llama al servicio con `{ source: 'synthetic' }`. La etiqueta se conserva en la salida. Estas pruebas no acreditan cargas reales ni llamadas nuevas al proveedor.

## Cómo comprobarlo

Desde la raíz del repositorio, ejecutar:

```sh
node --test tests/metrics.test.cjs
```

Node ejecuta las [pruebas del módulo](../tests/metrics.test.cjs) y compara los resultados con lo esperado. Se usa su herramienta incorporada, sin instalar dependencias de prueba. Resultado de esta entrega con **Node.js v22.19.0: 23 pruebas aprobadas, 0 fallidas**.

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

Muestra goles = 7, tiros = 17 y eficiencia ≈ 41.18 %, junto con unidades, cobertura y denominadores. El código del ejemplo llama a las funciones implementadas; no elige resultados precargados.

Guía: [motor paso a paso](motor-paso-a-paso.md). Referencia de la herramienta de pruebas: [documentación oficial de Node.js](https://nodejs.org/api/test.html).
