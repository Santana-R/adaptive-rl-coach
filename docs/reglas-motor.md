# Reglas y prioridades · A17

Implementación preparada con Roberto y asistencia de IA bajo su Release. La regla de finalización es `finalizacion-eficiencia`, acordada en A02: eficiencia **≤30 %**, cinco partidas con goles/tiros completos y mínimo de **20 / 15 / 10 tiros** en **1v1 / 2v2 / 3v3**. Son parámetros heurísticos, pendientes de calibración con bloques reales en A26.

## Cómo pasan los datos

1. [evaluateReplayBlockRules](../src/services/block-rules.js) recibe cinco respuestas de replay y un perfil; reutiliza A14 y A09. Si A14 rechaza el bloque, conserva `valid: false`, `data: null` y los motivos; no genera un diagnóstico.
2. [evaluateRules](../src/domain/rules.js) recibe las métricas normalizadas de A09 (`data`), o un bloque de A10. Comprueba contexto, versión, procedencia, cinco IDs distintos y datos necesarios. Devuelve `rules_version`, `priorities`, `evaluations` y `limitations`.
3. [rules-config.js](../src/domain/rules-config.js) fija `mvp.rules.v2`, los mínimos por modalidad, límite inclusivo y máximo de tres prioridades. La configuración está congelada, incluidos sus objetos internos. Cambiar criterios publicados requiere una versión nueva.
4. A18 consume las prioridades con `mvp.plans.v2` y A19 las muestra mediante su ruta HTTP. La persistencia A24 y el recorrido privado real continúan pendientes; ver la [integración de boost](disponibilidad-boost.md).

La clave de prioridad es **`shooting`**, conservando el contrato del catálogo. El ID de regla sigue siendo **`finalizacion-eficiencia`**. La regla funciona sobre el bloque actual sin necesitar un anterior ni fechas: una comparación incompatible o ausente no invalida una señal propia del bloque. A10 mantiene sus validaciones temporales por separado.

## La condición central

Después de comprobar los datos y obtener el mínimo de la modalidad:

```js
const active = shots >= minimumShots && shootingPct <= rule.threshold_pct;
```

`>=` significa «mayor o igual»; `<=`, «menor o igual»; `&&` exige cumplir ambas condiciones. En 3v3, 10 tiros y 30 % activan la regla. Los mismos números en 2v2 no permiten evaluarla: faltan tiros para llegar a 15.

La eficiencia procede de A09: `(goles / tiros) * 100`, conservando precisión y denominadores. A17 comprueba que el porcentaje y su numerador/denominador coincidan con los conteos recibidos. Una medición redondeada o inconsistente no sustituye el resultado normalizado; A15/A19 deberán conservar esa precisión o reconstruir las métricas desde los conteos mediante A09 antes de evaluar.

## Las tres respuestas de la regla

| Estado | Ejemplo | Motivo y efecto |
| --- | --- | --- |
| `active` | 3 goles / 10 tiros en 3v3: 30 %, cobertura 5. | `AT_OR_BELOW_THRESHOLD`; produce una prioridad. |
| `inactive` | 4 goles / 10 tiros en 3v3: 40 %, cobertura 5. | `ABOVE_THRESHOLD`; no produce prioridad por esta regla. No concluye que el jugador carezca de otras necesidades. |
| `not_evaluable` | 3 goles / 10 tiros en 2v2. | `INSUFFICIENT_SHOTS`; no produce prioridad ni acredita mejora. |
| `not_evaluable` | Cero tiros. | `zero_denominator`; eficiencia `null`, nunca 0 % inventado. |
| `not_evaluable` | Falta un dato necesario en una partida. | `INCOMPLETE_METRIC_COVERAGE`; conserva la cobertura y no produce prioridad. |

También se rechazan datos necesarios ausentes, conteos/porcentajes inválidos, unidades incorrectas, contexto/modalidad no soportados, versión incompatible o replays repetidos. `evaluations` conserva estado, motivo estable, explicación en español y evidencia; los motivos de métricas excluidas por replay permanecen en el resultado de A09.

Cero goles con tiros suficientes sí permite evaluar y activar. Duración o boost ausentes no bloquean esta regla porque no utiliza esas métricas. La segunda regla, acordada el 16 de noviembre, se documenta en [Disponibilidad de boost](disponibilidad-boost.md): ≥15 % en al menos 3/5 partidas y prioridad alta con ≥20 % en 3/5. Requiere porcentajes del proveedor en las cinco partidas y evalúa ranked 2v2/3v3.

Cada prioridad conserva regla/versión, clave `shooting`, orden, score, explicación y estado de calibración. Su `evidence` contiene porcentaje/unidad, umbral/comparador, goles/tiros/cobertura, cinco partidas e IDs, mínimo aplicado, contexto, fuente y versión de métricas.

## Orden y límite

`rankPriorities` recibe prioridades **ya justificadas** por reglas: ordena score descendente y, en empate, ID de regla ascendente como texto. Retorna como máximo tres, numeradas desde uno, sin modificar la lista recibida. Rechaza scores no finitos/negativos e IDs vacíos o repetidos. Es un ayudante de dominio, no una ruta para recibir diagnósticos enviados por el cliente.

La regla de finalización usa **score fijo 1** como peso técnico inicial: no expresa probabilidad, confianza, gravedad ni mejora. La salida real contiene **cero, una o dos prioridades**. Boost usa score 1 normal y 2 alto; no se fabrican señales para completar tres lugares. El fixture de empate usa IDs ficticios para verificar el ordenador, no diagnósticos deportivos adicionales. El objetivo principal aún no introduce ponderaciones nuevas.

El prototipo Python/Tkinter no se encontró en el repositorio. Se contrastó la demo JavaScript disponible: usa `shooting` y score 1, pero su umbral ilustrativo de 35 % y la regla de boost no son la ficha A02 aprobada. Se conservó la presentación provisional y se implementaron los criterios acordados en el dominio definitivo. Luis continúa su interfaz.

A15/A24 asociarán códigos/versiones a `reglas`, `reglas_config`, `conjuntos_reglas` y `prioridades`, sin crear tablas duplicadas ni ejecutar cambios SQL en esta entrega. Deben resolver la representación del mínimo dependiente de modalidad y conservar el snapshot de la evidencia; el objeto JSON no se considera una fila ya guardada.

## Comprobación inicial A17 (histórica)

Desde la raíz del repositorio:

```sh
node --test tests/rules.test.cjs tests/metrics.test.cjs tests/comparison.test.cjs
```

Con Node.js v22.19.0: **147 pruebas aprobadas, 0 fallidas**. Son 55 de A17 y las 92 anteriores. Incluyen los 17 casos manuales de A02, límites por modalidad, 30 % inclusivo, faltantes/cero, evidencia/versiones, empates/límite de tres, entradas sin mutación e integración A14 → A09 → A17 variando tiros. También se ejecuta A10 con modalidad incompatible y se comprueba que el bloque actual pueda activar su propia regla.

El ejemplo manual `7/23` conserva su decimal original en el fixture. Según el orden de operaciones, el último decimal binario puede diferir; la prueba admite error absoluto menor a `1e-12` al comparar ese resultado manual. La decisión de la regla usa el porcentaje completo sin redondearlo ni aplicar esa tolerancia al umbral.

Los fixtures son sintéticos y mantienen sus entradas/resultados originales. Los 17 ejemplos producen **6 activaciones, 4 no activaciones y 7 no evaluables**. No acreditan nuevas cargas reales al proveedor, calibración ni la ejecución completa de planes/A33.

### Probar un cambio de entrada

Este comando usa el fixture sintético de A14. Agrega diez tiros al jugador elegido en su primer replay: el bloque pasa de **7/17 ≈ 41.18 %** a **7/27 ≈ 25.93 %**, en 2v2 y con muestra suficiente.

```sh
node <<'NODE'
const input = structuredClone(require('./tests/fixtures/replay-validation/bloque-a14.json').input);
const { evaluateReplayBlockRules } = require('./src/services/block-rules');
function show() {
  const result = evaluateReplayBlockRules(input.replays, input.profile, { source: 'synthetic' });
  const rule = result.data.evaluations[0];
  console.log(rule.status, rule.evidence.value, rule.explanation);
}
show();
input.replays[0].blue.players[0].stats.core.shots += 10;
show();
NODE
```

La primera salida es `inactive`; la segunda, `active`. El cálculo consume las estadísticas; no selecciona un resultado por nombre de escenario. Ver [casos A02](casos-motor.md), [pruebas](../tests/rules.test.cjs), [contrato](contratos-api.md) y [ejemplo de análisis](../planning/examples/analysis.json).

## Segunda regla y comprobación vigente · 16 de noviembre

La versión `mvp.rules.v2` añade `boost-disponibilidad` sin cambiar los umbrales de finalización. Ambas reglas se evalúan de forma independiente. La [ficha vigente](disponibilidad-boost.md) conserva casos, fuente/denominadores, investigación exploratoria, ejercicios y límites A13/A15/A24. `npm test`: 372 aprobadas, 0 fallidas; pruebas nuevas con entradas sintéticas y transporte/sesión simulados, sin acreditar calibración ni recorrido privado real.
