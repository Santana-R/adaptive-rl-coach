# Disponibilidad de boost · regla y rutina inicial

Acordado por Roberto el 16 de noviembre de 2026 e implementado con asistencia de IA bajo su Release. Este cambio amplía el motor mientras continúa la integración real A13/A19/A37. No acredita calibración poblacional ni identifica la causa de quedarse sin boost.

## Criterio publicado

`mvp.rules.v2` conserva finalización y añade `boost-disponibilidad`, prioridad `boost`:

| Condición en un bloque de cinco partidas distintas | Resultado |
| --- | --- |
| Al menos tres partidas con `percent_zero_boost >= 15` | Prioridad normal, score técnico 1. |
| Al menos tres partidas con `percent_zero_boost >= 20` | Prioridad alta, score técnico 2. Sustituye la normal; no crea otra prioridad. |
| Solo dos partidas alcanzan 15 %, aunque sus valores sean extremos | Inactiva. No se promedian porcentajes para activar. |
| Falta un porcentaje válido en cualquier partida | No evaluable; no equivale a cero ni a ausencia de necesidad. |

Los límites son inclusivos y se evalúan sin redondear. La versión inicial admite **ranked 2v2 y 3v3** de una misma identidad y modalidad. El estudio exploratorio fue de 2v2: la aplicación provisional en 3v3 requiere validación propia en A26. 1v1, casual y privadas quedan fuera de esta regla; finalización conserva su alcance anterior.

Los scores ordenan prioridades, no son probabilidades ni estimaciones de rendimiento. Orden: score descendente, después ID de regla ascendente. Boost normal y finalización empatan a 1; el desempate técnico coloca `boost-disponibilidad` primero. Una evaluación inactiva tampoco demuestra buen manejo.

## Entrada y trazabilidad

A14 extrae del participante elegido `player.stats.boost.time_zero_boost` y `percent_zero_boost`. No usa estadísticas del equipo, rivales ni el intervalo 0–25. Ambos campos se validan por separado; un porcentaje original válido puede evaluarse aunque falten segundos. Si un campo afirma cero y el otro es positivo, el porcentaje se marca incoherente y no se usa.

A09 conserva `boost_zero_per_replay` con `measurement_basis: provider_percent_zero_boost`, `aggregation: per_replay`, cobertura, exclusiones y cinco observaciones identificadas. Cada observación conserva segundos/porcentaje, unidad, ámbito del jugador y campo de origen. La regla recalcula los conteos a partir de esas observaciones y comprueba IDs y cobertura. No acepta un contador externo como sustituto.

`values.boost_zero_s` suma segundos solo con cobertura 5/5; de lo contrario su valor queda null con cobertura y motivos. No existe un promedio de porcentajes del bloque presentado como porcentaje temporal total. La versión `mvp.metrics.v1` conserva las mediciones anteriores y añade campos opcionales: las entradas antiguas producen boost no disponible sin reinterpretar goles, tiros ni duración.

Los segundos son acumulados: no indican un tramo continuo, número de episodios, posición ni situación táctica. No se deduce que un jugador gaste mal, se desvíe por un boost grande o esté vacío durante la defensa a partir de totales separados.

## Ejercicios y duración

Las instrucciones aprobadas están versionadas en `planning/catalogo-boost.v1.json` como `mvp.native-boost.v1`:

- **Rutas de pads y recuperaciones:** Juego libre, boost ilimitado desactivado, rutas útiles por ambas bandas y centro, giros/aterrizajes conservando movimiento.
- **Golpeo, seguimiento y recarga:** contacto hacia una zona elegida, recuperación y preparación del siguiente toque recogiendo pads sobre el recorrido. Perseguir la pelota durante este ejercicio no prescribe una rotación de ranked.

Son rutinas de instrucciones nativas para Steam/Epic. No dependen de códigos importables, Workshop ni BakkesMod. Su fuente es `bundled_native_instructions`; no se etiquetan como ejercicios consultados en SQL ni como comprobados dentro del juego. `exercise_id` y `exercise_version_id` permanecen null; el snapshot conserva clave, versión, fuente, instrucciones y estado de revisión. A24 necesitará resolver su persistencia antes de guardarlas como relaciones SQL. El catálogo de tiro A23 conserva su control de activo/verificación.

`mvp.plans.v2` vuelve a ejecutar ambas reglas para comprobar el respaldo de cada prioridad. `mvp.allocation.v2` reparte el tiempo por igual entre áreas cubiertas, con restos a favor del orden de prioridad. Atiende una rutina de cada área antes de repetir ejercicios; cada ejercicio conserva un mínimo de cinco minutos. Dentro de tiro se mantienen las cuotas anteriores y dentro de boost el reparto es 50/50.

| Disponibilidad | Solo boost | Boost y finalización con recursos elegibles |
| --- | --- | --- |
| 4 min | Sin rutina. | Sin rutina. |
| 5 min | Rutas 5. | Primera prioridad 5; la otra figura sin cubrir. |
| 10 min | Rutas 5 + seguimiento 5. | Boost 5 + Ground Shots 5. |
| 20 min | Rutas 10 + seguimiento 10. | Boost 10 y tiro 10; cuatro ejercicios de 5. |
| 30 min | Rutas 15 + seguimiento 15. | Boost 15 y tiro 15; cada área aplica su reparto interno. |

Si una prioridad carece de catálogo elegible, permanece sin cubrir y se aprovecha el presupuesto en las áreas que sí tienen ejercicios. La cobertura queda parcial. Las metas de tiro conservan el comportamiento previo: no fabrican una señal ni alteran el reparto entre áreas. BCPM y aporte de pads pequeños **no intervienen** en esta versión.

## Investigación exploratoria conservada

`planning/fixtures/boost-research-20261116.json` conserva los valores publicados que se consultaron, URLs de origen, agrupación y exclusiones. Se leyeron 24 de 37 replays solicitadas; 13 devolvieron HTTP 429. Se excluyó una cuenta llamada zen cuya identidad profesional no se verificó. Restaron 23 partidas diferentes (MatchGUID comprobado), 92 registros de participantes y 70 cuentas identificables. No son 92 observaciones independientes. La selección por disponibilidad, temporadas diferentes y jugadores repetidos limita cualquier generalización.

Los subgrupos de la comparación presentada fueron 13 registros de ApparentlyJack/zen/M0nkey M00n, 8 de Mat./syracks, 10 con rango GC, 11 Diamante y 10 Oro. Sus medianas de porcentaje en cero fueron 10.07 %, 10.36 %, 12.23 %, 11.24 % y 11.93 %. Los restantes registros no pertenecen a esos subgrupos o no tenían rango verificable. Mat./syracks se describen como competidores de circuito, sin afirmar su situación contractual. La etiqueta PRO de Ballchasing se basa en [identidad enlazada desde Liquipedia](https://ballchasing.com/doc/using-the-site), no en sueldo o contrato.

La muestra motivó proponer 15/20 %, que Roberto revisó y aceptó como heurística. No estima un umbral óptimo, sensibilidad, especificidad ni causalidad. Hace falta ampliar jugadores/bloques por modalidad y revisar resultados con contexto en A26; A33 permanece abierta para la regresión completa del proyecto.

Referencias de práctica: [ApparentlyJack: gestión de boost](https://dignitas.gg/articles/how-to-manage-your-boost-in-rocket-league-with-apparentlyjack), [Yukeo: recuperaciones](https://dignitas.gg/articles/news/rocket-league/14120/effective-recoveries-a-rocket-league-guide-with-yukeo). Ambos orientan ejercicios y decisiones; no fijan los límites 15/20 %. El [análisis comunitario EU/NA en Reddit](https://www.reddit.com/r/RocketLeagueEsports/comments/1ax558l) se refiere a competición 3v3; su autor reconoce que los totales no distinguen gasto hasta cero de velocidad de recarga. No se trasladan sus resultados como benchmark de ranked 2v2.

## Integración y comprobación

- Dominio: `boost.js` normaliza mediciones; `boost-rule.js` evalúa repetición y gravedad. `rules.js` combina con finalización; `plans.js` selecciona ejercicios y comparte minutos.
- Análisis de Luis: su controlador muestra la etiqueta/evidencia adecuada para cada prioridad, porcentajes y segundos por partida y los motivos de las evaluaciones no activas. Se mantiene su diseño.
- Demo local: `ANALYSIS_DEMO_ENABLED=true npm start`; abrir `/sitio/html/analisis.html?case=boost`, `boost-high` o `boost-missing`. Son datos sintéticos que ejecutan el mismo motor; la demo sigue limitada a loopback.
- API de propuestas: la ruta privada existente conserva sesión/rol/propiedad y construye el diagnóstico en servidor. La vista Plan A27 y persistencia A24 siguen pendientes.
- **Límite A15/A13:** el esquema actual guarda `boost_cero_s`, pero no el porcentaje original ni su denominador comprobado. El adaptador conserva los segundos y devuelve porcentaje null con `stored_boost_percentage_not_recorded`. No divide por `duracion_s` ni `tiempo_jugado_s`. A13/A15 deberán conservar la medición original de forma explícita para activar esta regla en bloques guardados. Esta entrega no modifica ni migra la base remota.

Pruebas ejecutadas con `npm test`: 372 aprobadas, 0 fallidas. Incluyen 38 nuevas de límites, faltantes, independencia de reglas, fuentes/unidades, SQL sin porcentaje, orden, distribución de 0–120 minutos, snapshots y HTTP con sesión/transporte simulados. Se ejecutó el controlador real de Análisis en un DOM mínimo mediante VM para comprobar ambas prioridades y datos faltantes; esto no es una revisión visual en navegador ni una prueba con JWT/replays reales.
