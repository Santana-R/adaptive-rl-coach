# Generador de propuestas · A18

Implementación preparada con Roberto y asistencia de IA bajo su Release. El dominio y la [ruta de propuesta](integracion-propuestas.md) están implementados y comprobados con datos controlados; el catálogo A23 y repositorios A15 ya están integrados. La propuesta se devuelve sin guardar: A24 conserva versiones y A27 la muestra. La comprobación de sesión real/carga completa continúa en A19/A13/A37.

## Entrada y salida

[generatePlan](../src/domain/plans.js) recibe un objeto con:

| Campo | Entrada normalizada |
| --- | --- |
| `analysis` | `block_id` serializado como cadena, `metrics` de A09 y `rules_version`, `priorities`, `limitations` de A17. El servidor construye este análisis; no se recibe un diagnóstico editable del cliente. |
| `profile` | `platform`, `player_id` y `mode` coincidentes con las métricas; opcionalmente rango y acceso real a Workshop. |
| `catalog` | `catalog_version: mvp.catalog.v1`, `source` y lista de ejercicios normalizados descritos abajo. |
| `availability_minutes` | Minutos enteros de esta propuesta, entre 0 y 32767 (límite positivo de `smallint`). Tiene precedencia sobre cualquier disponibilidad histórica del perfil. Por debajo de cinco no cabe esta rutina. |
| `goals` | Lista opcional de metas activas con ID, métrica, objetivo y unidad. Por defecto `[]`. |
| `version` | Número de propuesta indicado por el llamador; entero positivo, por defecto `1`. A24 asignará/controlará la secuencia persistida. |

El resultado conserva bloque, versiones de métricas/reglas/catálogo/reparto/generador, disponibilidad, minutos asignados/restantes, ejercicios, evidencia del diagnóstico y snapshots de perfil/metas. Cada ejercicio contiene duración, dificultad, recurso, instrucciones, clave/versión de contenido y variante concreta cuando corresponde.

`plan_id`, `plan_version_id` y `plan_exercise_id` quedan **`null`**: la función no inventa IDs SQL ni asegura que exista una transacción guardada. Los IDs de versiones de ejercicios, si vienen del catálogo, se conservan como cadenas, incluidos bigint sin pérdida de precisión. También se conservan `exercise_key` y `content_version` como trazabilidad de contenido.

## El recorrido del código

1. Valida el contexto y versiones. Perfil y análisis deben describir el mismo jugador, plataforma y modalidad. El catálogo debe entregar una sola versión vigente por clave; duplicados o entradas generales inválidas producen un error de entrada.
2. Reutiliza A17 sobre las métricas recibidas para comprobar que cada prioridad de finalización o boost está respaldada. Una prioridad alterada o sin evidencia actual no produce ejercicios. Las prioridades no soportadas se conservan sin cubrir.
3. Filtra ejercicios activos, revisados y compatibles con modalidad/plataforma/requisitos. Rechazos por recurso, instrucciones, versión o variante quedan en `catalog_exclusions`.
4. Elige nivel/variante, selecciona los ejercicios que caben con mínimo cinco y distribuye los minutos.
5. Devuelve otra propuesta con copias de los snapshots. No modifica las entradas ni propuestas anteriores; A24 deberá preservar esa independencia al persistirlas.

Las rutinas publicadas corresponden a **`shooting`**, con los tres recursos acordados en [A23](catalogo-ejercicios.md), y **`boost`**, con dos [rutinas nativas versionadas](disponibilidad-boost.md). Estas últimas conservan su fuente y no se hacen pasar por filas SQL; A24 necesita resolver su persistencia. No se inventan otras necesidades para llenar la sesión ni se incorpora un plan de mantenimiento cuando A17 no tiene prioridades.

## Catálogo que debe entregar la integración A23

La forma normalizada parte del [contenido deportivo](../planning/catalogo-ejercicios.v1.json), con `exercises`, modalidad en cada ejercicio o en `catalog.modes`, claves/versión de contenido y requisitos explícitos. Además necesita:

- `active: true` y **`technical_review_status: verified`** en cada ejercicio elegible, derivados de la comprobación técnica realizada por David. No son una autorización enviada por el jugador ni obligan a crear una columna nueva en SQL.
- `platforms`, `requirements`, recurso/código/enlace, instrucciones, finalidad, criterio de ejecución, dificultad y mínimo de cinco minutos conforme al contenido revisado.
- `exercise_id` / `exercise_version_id` serializados como cadenas cuando existan en persistencia. Su asociación se resuelve en el adaptador A23/A24 sobre las tablas existentes.
- `source`, por ejemplo `database` para un catálogo efectivamente consultado o `synthetic` para un fixture. Cambiar una etiqueta no acredita una consulta real.

El archivo de fichas mantiene **todos los ejercicios inactivos y pendientes**. Al pasarlo directamente a `generatePlan` con solo prioridad de tiro, la salida es vacía con `NO_VERIFIED_ACTIVE_EXERCISE`; el generador no lo activa. Los tests usan una copia expresamente sintética con revisión/actividad simuladas y IDs `test-*`. No es el seed ni una comprobación de los códigos dentro del juego.

## Nivel, metas y CoCo

El perfil normalizado usa `rank`, `rank_mode` y `rank_source: self_reported`. `rank` admite `bronze`, `silver`, `gold`, `platinum`, `diamond`, `champion`, `grand_champion` o `supersonic_legend`. A15 transforma el rango declarado de la modalidad correspondiente a esa representación; el generador no deduce MMR ni interpreta un rango de otra modalidad.

Con rango ausente, desconocido, no declarado o de otra modalidad, se usa la ejecución base y CoCo Easy, conservando el motivo. Las variantes por rango son las de A23. `profile.coco_variant_key` permite elegir una variante más sencilla; Survival solo se acepta por elección expresa de GC–SSL y **sustituye** a Normal durante los mismos minutos. Las instrucciones de la propuesta explicitan modo e interruptores de Normal. No se duplica CoCo.

`profile.workshop_access === true` debe representar acceso confirmado al mapa; una identidad Steam enlazada no basta. Sin esa capacidad, o con plataforma Epic, se usan los paquetes nativos compatibles. Esta versión no configura loaders ni BakkesMod.

Las metas admitidas son activas, para `shooting_pct`, unidad `percent` y objetivo entre 0 y 100, con modalidad compatible si está declarada. Se preservan en `goals_snapshot`. Las archivadas, repetidas, incompatibles o sin prioridad respaldada quedan explicadas en `goals_excluded`. Con una única prioridad de finalización, una meta compatible ya está alineada y **no altera el reparto 50/25/25 ni el umbral de A17**. El reparto entre boost y tiro usa la política v2 descrita abajo; una meta sola no inventa una señal ni cambia ese reparto.

## Cómo se distribuyen los minutos

La política **`mvp.allocation.v2`**, con generador `mvp.plans.v2`, reparte por igual entre áreas respaldadas con recursos. Primero cubre una rutina de cada área; si el tiempo no alcanza, respeta el orden de prioridad y declara cobertura parcial. Dentro de boost divide 50/50 entre sus dos ejercicios. Dentro de tiro conserva los [once ejemplos aprobados](catalogo-ejercicios.md): 50/25/25 con CoCo y 75/25 cuando no hay un CoCo elegible. Primero reduce la cantidad de ejercicios si no caben todos con cinco minutos; con Workshop, en sesiones cortas se eligen Ground Shots y después CoCo.

El ayudante interno [allocateMinutes](../src/domain/time-allocation.js) calcula la cuota:

```js
budget * entry.weight / weight
```

Para veinte minutos, los pesos `2, 1, 1` suman cuatro: Ground Shots recibe `20 × 2 / 4 = 10`; los otros, cinco cada uno. Si una cuota no alcanza cinco, se fija ese mínimo y se redistribuye el presupuesto restante entre los demás. Después se redondea por restos decimales y se desempata en orden Ground Shots → Mid Height Shots → CoCo. La suma se mantiene dentro de disponibilidad y cada ejercicio elegido conserva al menos cinco minutos.

| Entrada / contexto | Resultado ejecutado con catálogo sintético elegible |
| --- | --- |
| 4 minutos | Vacío, `INSUFFICIENT_TIME`. |
| 10 minutos con Workshop | Ground Shots 5 + CoCo 5. |
| 15 minutos con Workshop | 5 + 5 + 5. |
| 20 minutos con Workshop | 10 + 5 + 5. |
| 25 minutos con Workshop | 13 + 6 + 6. |
| 30 minutos con Workshop | 15 + 8 + 7. |
| 40 minutos con Workshop | 20 + 10 + 10. |
| 20 minutos sin Workshop | Ground Shots 15 + Mid Height Shots 5. |
| Catálogo de tiro sin recursos elegibles | Cero ejercicios; no se fuerza una rutina. |

Si falta algún recurso del catálogo, los pesos disponibles se redistribuyen entre candidatos elegibles. El plan explica la falta; no presenta un ejercicio inactivo o incompatible como sustituto.

## Cobertura y versiones

| `coverage` | Significado |
| --- | --- |
| `complete` | Hay ejercicios, todas las prioridades suministradas quedan respaldadas/cubiertas y están disponibles los recursos de la rutina compatibles con ese contexto. Elegir menos ejercicios por una sesión corta no es por sí solo falta de cobertura. |
| `partial` | Hay práctica propuesta, pero falta una prioridad respaldada/soportada o algún recurso esperado del catálogo para ese contexto. `uncovered_priorities`, `missing_exercises` y motivos explican la diferencia. |
| `empty` | No hay ejercicios seleccionados, por ausencia de señal, catálogo elegible o tiempo. |

La indisponibilidad normal de Workshop en Epic no se cuenta como catálogo parcial: para ese contexto se esperan los dos paquetes de Castro. Una actividad que el catálogo todavía no puede ofrecer sí queda explicada como falta. `assigned_minutes` y `unassigned_minutes` conservan el presupuesto incluso en salida vacía.

Cada llamada copia instrucciones, recurso, dificultad, variante, evidencia y contexto. Generar otra versión con otro bloque o disponibilidad no reescribe la anterior. La función es determinista y no consulta un reloj ni crea IDs aleatorios; **no incrementa versiones persistidas automáticamente**. A24 conservará versiones y controlará sus IDs/secuencia mediante la integración correspondiente.

## Comprobaciones ejecutadas y ejemplo

Desde la raíz:

```sh
node --test tests/plans.test.cjs tests/rules.test.cjs tests/metrics.test.cjs tests/comparison.test.cjs
```

Con Node.js v22.19.0: **210 pruebas aprobadas, 0 fallidas**; 63 de planes y 147 anteriores. Incluyen los once repartos A23, variantes por ocho rangos, ausencia de rango, Survival opcional, metas, prioridades sin respaldo, catálogo parcial/vacío/inactivo/sin revisión, requisitos/recursos incompatibles, las tres modalidades y versiones/snapshots sin mutación. Se comprobaron también todos los presupuestos enteros de 0 a 120 minutos con y sin Workshop: 242 combinaciones dentro de una prueba de invariantes.

El [ejemplo de propuesta](../planning/examples/plan-proposal.json) fue generado con esta función usando un catálogo de consulta **simulado**, análisis real de las funciones A14 → A09 → A17 sobre estadísticas sintéticas y una meta de prueba. No acredita una consulta SQL ni recursos verificados en juego. Para reproducirlo:

```sh
node <<'NODE'
const { makePlanInput } = require('./tests/helpers/plan-inputs.cjs');
const { generatePlan } = require('./src/domain/plans');
const input = makePlanInput(); // fixture sintético; nunca usar este ayudante como fuente de producción
input.goals = [require('./planning/examples/goal.json')];
const plan = generatePlan(input);
console.log(plan.coverage, plan.assigned_minutes);
console.table(plan.exercises.map(e => ({ ejercicio: e.exercise_key, minutos: e.assigned_minutes })));
NODE
```

La ruta `POST /api/v1/blocks/:blockId/plan-proposal` obtiene el perfil, catálogo y metas propias y llama a esta función con el análisis del bloque. A24 toma esa propuesta y conserva sus versiones mediante persistencia; no es un requisito previo para cerrar A18. A27 lo mostrará en la interfaz de Luis. El [contrato](contratos-api.md) distingue la propuesta comprobada de la persistencia pendiente. El alcance y las pruebas integradas están en la guía de la ruta.
