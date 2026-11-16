# Cobertura defensiva y decisiones como último hombre · propuesta

**Estado al 16 de noviembre de 2026: diseño de la tercera regla, pendiente de validación deportiva y del proveedor.** Roberto confirmó la relevancia del enfoque y autorizó preparar esta entrega con su Release. El umbral numérico siguiente es una hipótesis propuesta por la IA; todavía no fue aceptado por Roberto ni calibrado con bloques reales.

Esta entrega contiene una ficha, una [propuesta estructurada](../planning/proposals/cobertura-defensiva.v0.json), [33 casos sintéticos](../planning/fixtures/cobertura-defensiva-propuesta.v0.json) y un [comprobador aislado](../planning/proposals/comprobar-cobertura-defensiva.v0.cjs). **No activa una tercera regla en el motor.** Las versiones publicadas siguen siendo `mvp.rules.v2`, `mvp.plans.v2` y `mvp.allocation.v2`, con finalización y disponibilidad de boost.

## Qué pretende recomendar

Una actividad para revisar la preparación y las decisiones defensivas cuando el jugador ocupa el papel de último defensor. El objetivo es seleccionar situaciones útiles para aprender; el conteo no demuestra responsabilidad individual, una entrada incorrecta ni una rotación mal ejecutada. Tampoco significa que el jugador haya estado solo o que pudiera evitar el gol.

La prioridad propuesta se llama **Revisar cobertura defensiva y decisiones como último hombre**. Se reservan, sin registrar en producción, el ID `cobertura-defensiva-revision` y la clave `defensive_review`. El score y su relación con las prioridades actuales quedan pendientes; no se asigna automáticamente una gravedad alta.

## Hipótesis numérica para revisar con Roberto

| Elemento | Hipótesis, todavía sin activar |
| --- | --- |
| Contexto inicial | Ranked 2v2, misma identidad, cinco partidas distintas y válidas. |
| Señal | Al menos dos goles recibidos figurando como último defensor en al menos tres de las cinco partidas. |
| Cobertura | Cinco conteos originales válidos del jugador, con procedencia y unidad `count`. |
| Límite | Inclusivo: dos cuenta como coincidencia; tres partidas cumplen la repetición. |
| Datos incompletos | No evaluable. Una omisión o `null` no se convierte en cero, aunque tres valores positivos ya cumplan el límite. |
| Caso sin repetición | No propone esta revisión por la hipótesis; no acredita buena defensa. |

Por ejemplo, **[2, 2, 2, 0, 0]** cumple la hipótesis, **[9, 9, 1, 0, 0]** no la cumple y **[2, 2, 2, null, null]** no es evaluable con la cobertura propuesta.

Se eligió 2 en 3/5 como un punto concreto para discutir repetición, **sin estimar que sea una frecuencia anormal para ningún rango**. No procede de un benchmark, de un umbral publicado por un profesional ni de una comparación poblacional. La investigación previa de boost conservada en el repositorio no contiene estos datos posicionales; no sirve para calibrar esta regla.

Esta hipótesis cuenta eventos por partida. El tiempo extra, una mayor presión rival y pasar más tiempo en el papel de último defensor pueden elevar los conteos. Los casos de exposición distinta y partidas largas conservan deliberadamente la misma decisión provisional para hacer visible esa limitación. Antes de publicarla hay que contrastar bloques completos y revisar si se necesita otro criterio. No se inventan todavía rangos aceptables por nivel ni una tasa ajustada.

## Entrada y significado de los datos

La [documentación oficial de Ballchasing](https://ballchasing.com/doc/api), consultada el 16 de noviembre, incluye estos campos de `selected_player.stats.positioning`:

| Campo del proveedor | Unidad y uso propuesto |
| --- | --- |
| `goals_against_while_last_defender` | Conteo por jugador y replay; señal principal. |
| `time_most_back` | Segundos en la posición más retrasada; contexto de exposición. |
| `percent_most_back` | Porcentaje posicional original; contexto, sin un objetivo fijo. |
| `percent_infront_ball` | Porcentaje original por delante del balón; contexto. |
| `avg_distance_to_mates` | Distancia media en unidades del juego; contexto. |

Los ejemplos documentales no garantizan que cada respuesta real contenga todos los campos ni fijan con detalle todos los criterios internos del analizador. Hay que conservar una captura autenticada y verificar las omisiones y el significado antes de usar un alias o asumir equivalencias. Las páginas públicas y la respuesta del API no son formatos intercambiables; un nombre observado en la página no autoriza a remapearlo silenciosamente.

En esta hipótesis, los campos de contexto se muestran cuando sean válidos y no modifican el contador de coincidencias. Si faltan, deben figurar como no disponibles. Una distancia media pequeña o pasar mucho tiempo por delante del balón no activa por sí solo una acusación de doble commit o mala rotación. Los promedios tampoco demuestran que varios hechos ocurrieran simultáneamente.

La normalización futura debe conservar identidad seleccionada, ID de replay, campo de origen, unidad, ámbito, valor y motivo del faltante. Los conteos requieren enteros seguros no negativos; un promedio fraccionario de un grupo no sustituye un conteo por partida. El dato debe salir del participante seleccionado, nunca de su equipo, compañero o rival.

No se calcula una supuesta eficiencia defensiva dividiendo estos goles entre saves, goles del equipo o minutos. El tiempo como último defensor no cuenta oportunidades defendidas. `replay.play_duration` describe la partida, no la participación individual ni la exposición en ese papel; tampoco se usa como sustituto de esa exposición.

## Actividad propuesta del catálogo

**Clave de contenido:** `review-last-defender`, versión de propuesta `proposal.1`. Es una actividad nativa de revisión de replays guardadas, disponible conceptualmente en Steam y Epic, sin Workshop, BakkesMod ni compañero de práctica. Requiere que el jugador pueda abrir su archivo guardado.

- Duración mínima propuesta: **5 minutos**; referencia: **10 minutos**. Son decisiones de diseño, todavía sin comprobación de ejecución por Roberto.
- Con cinco minutos, revisar una o dos situaciones según lo que permita el tiempo de apertura y búsqueda. Con diez, continuar con más situaciones sin exigir una cantidad fija.
- `exercise_id` y `exercise_version_id` son `null`; no se inventan IDs SQL ni se registra la ficha como activa.
- La ficha tiene `available_for_generation: false` hasta resolver revisión deportiva, catálogo y persistencia.

### Instrucciones para el jugador

1. Elegir una partida del bloque con un conteo elevado y abrir manualmente su replay guardada.
2. Revisar los goles recibidos, retrocediendo aproximadamente diez segundos para observar cómo se construyó la jugada.
3. Comprobar visualmente si ocupabas el papel de último defensor. El resumen agregado **no identifica el minuto del evento ni qué goles componen ese conteo**. Si un gol no corresponde, continuar dentro del tiempo disponible.
4. Para una situación identificada, responder: ¿qué opciones tenía el rival y cuál debía cubrir?, ¿convenía entrar o ganar tiempo?, ¿cómo podía preparar mi posición mientras regresaba mi compañero?
5. Registrar una decisión alternativa concreta, o indicar que no se reconoce una alternativa clara. Detener la actividad al cumplir los minutos asignados.

Si no se consigue identificar una situación dentro del tiempo, se registra la dificultad de revisión; no se fabrica un error táctico. Lo revisado y sus conclusiones son autorreportados. Completar la actividad no prueba mejora competitiva. La representación de ese registro en Sesiones debe acordarse antes de añadir nuevos campos.

La [guía con ApparentlyJack](https://dignitas.gg/articles/a-guide-to-defense-in-rocket-league-with-apparentlyjack) orienta el contenido: paciencia, momento de entrada y cobertura según la situación. Recomienda práctica contextual en 1v1 y reconoce límites de los paquetes. **La fuente no propone ni valida 2 goles en 3/5.** Los 1v1 pueden ser práctica posterior; su duración variable no se introduce como un ejercicio de cinco minutos. Ningún paquete nuevo se ofrece como verificado.

## Integración pendiente

| Parte | Trabajo necesario antes de activar |
| --- | --- |
| A13/A14, proveedor | Capturas autenticadas, selección del jugador y procedencia de cada campo; comprobar ausencia frente a cero. |
| A09, métricas | Observaciones por replay y cobertura; conservar faltantes y contexto sin promedios inventados. |
| A15, persistencia | Inspeccionar el esquema/consultas reales y conservar mediciones originales. `stored-block.js` no entrega actualmente estos campos; no reconstruirlos de goles totales ni de duración. |
| A17, regla | Validar contexto, cinco IDs y conteos; publicar criterios y evidencia con una versión nueva cuando estén acordados. |
| A18, plan | Incorporar la actividad validada y comprobar reparto entre tres áreas, especialmente presupuestos de 5 y 10 minutos y cobertura parcial. |
| A23/A24, catálogo y versiones | Resolver fuente, IDs y snapshots, sin registrar esta ficha de propuesta como catálogo activo. |
| A19/A27, interfaz | Mostrar explicación prudente y evidencia con el diseño oficial de Luis; no prometer navegación automática al evento. |
| A26/A33, comprobación | Revisión deportiva de bloques y regresión antes de activar. |

Esta tabla describe conexiones necesarias, no reasigna las tareas de otros integrantes ni acredita su implementación. La propuesta tampoco modifica el objetivo principal, sesiones, umbrales actuales o la base remota. A26, A19 y las demás issues permanecen abiertas.

## Casos y comprobación de esta entrega

El archivo de casos usa vectores de cinco conteos, valores por defecto y overrides explícitos. Es un formato de especificación, **no una captura real ni el contrato público de A14/API**.

El comprobador aislado recorre los 33 casos: **6 candidatos a revisión, 5 sin candidato y 22 no evaluables**. Incluye límite exacto, falta de repetición, valores extremos, ceros explícitos, faltantes, tipo/unidad/fuente incorrectos, promedio fraccionario, IDs repetidos, otra identidad, número de partidas, modalidades/tipos no admitidos y contexto que no crea una señal.

**Comprobación inicial:** el mismo código del comprobador se ejecutó en una celda JavaScript V8 con ambos JSON y se verificó su serialización. En esa primera revisión no se ejecutó Node ni `npm test` porque el entorno del proyecto estaba desconectado. Este resultado comprueba consistencia de la hipótesis con su tabla, no extracción, regla de producción, HTTP, interfaz, SQL ni una calibración deportiva. Las 372 pruebas registradas para el PR anterior no verifican esta propuesta.

Cuando vuelva a estar disponible Node, la comprobación aislada puede repetirse desde la raíz:

```sh
node -e 'const check = require("./planning/proposals/comprobar-cobertura-defensiva.v0.cjs"); console.log(JSON.stringify(check(require("./planning/proposals/cobertura-defensiva.v0.json"), require("./planning/fixtures/cobertura-defensiva-propuesta.v0.json")), null, 2))'
```

Antes de activar hay que resolver las condiciones pendientes de la propuesta estructurada, incorporar pruebas de producción y ejecutar la suite. El borrador es revisable; no acredita que el proyecto tenga ya tres reglas activas.

## Continuación de la comprobación con Node · 16 de noviembre

El entorno local continúa desconectado. Se añadió `.github/workflows/node-tests.yml` para ejecutar la suite con Node.js 22.19.0 en GitHub Actions y repetir el comprobador aislado de la propuesta. El workflow usa permiso de lectura del repositorio y no recibe secretos del proveedor ni credenciales de la aplicación.

La base actualizada, conservando los avances de los compañeros, aprobó **382 pruebas, 0 fallidas** en el [run 43977848162](https://github.com/Santana-R/adaptive-rl-coach/actions/runs/43977848162). Esto valida las funcionalidades ya integradas, no una tercera regla activa. El siguiente commit incorpora al workflow la ejecución de los 33 casos del borrador; su resultado se registra en los checks y en la descripción del PR #74.

La integración de la tercera regla en extracción, configuración, generador, presentación y adaptador persistido **no se publicó**. La revisión automática rechazó ese conjunto por considerar que el Release anterior autorizaba la propuesta, no la activación. Se necesita un nuevo Release literal para ese conjunto. Los archivos de dominio y las versiones de producción permanecen sin cambios en este borrador.

El conjunto preparado para esa autorización comprende: conteos explícitos del jugador, evaluación provisional en 2v2, evidencia por partida, actividad nativa con snapshot propio, reparto entre tres áreas y pruebas de dominio/HTTP/presentación. Los faltantes de A15 deben continuar sin inventarse; el umbral numérico y la calibración real siguen pendientes de revisión deportiva. No incluye cambios de base remota ni el cierre de A26/A19.
