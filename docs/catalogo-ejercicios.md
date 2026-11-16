# Catálogo inicial de finalización · A23

**Versión de contenido: `mvp.catalog.v1`.** Roberto Santana Trujillo aprobó la selección, instrucciones y criterios iniciales en conversación y autorizó documentarlos con su Release del 15 de noviembre de 2026. Preparado con asistencia de IA. Rangos sugeridos, tiempos y distribución son heurísticos iniciales; no se presentan como criterios calibrados.

Esta entrega aporta **tres fichas deportivas** y la [referencia estructurada](../planning/catalogo-ejercicios.v1.json) para David. No es el seed ni una respuesta del API: `active: false` en ese archivo indica que faltan carga/consulta y comprobación técnica. No acredita filas guardadas, un generador de planes ejecutable o capturas automáticas de práctica. Los recursos son reales; los tiempos de ejemplo son especificación.

## Reparto de A23

| Persona | Entrega |
| --- | --- |
| **Roberto · Santana-R** | Define y revisa contenido deportivo: recursos, ejecución, dificultad, configuraciones, criterios y tiempos. Aporta estas fichas para A23 y construirá el generador A18. |
| **David · dvdatogro-123** | Implementa seed, consulta, filtros de actividad/compatibilidad y conservación de versiones sobre las tablas existentes. Comprueba los recursos en el recorrido de la aplicación antes de ofrecerlos como activos. |

Ambos aportan a A23. David conserva la implementación técnica; estas fichas completan la definición deportiva inicial de Roberto. La issue sigue abierta hasta comprobar el catálogo consultable, sus filtros y sus versiones. No es necesario esperar A07 ni el CRUD completo A32 para avanzar.

## Alcance de los recursos

La prioridad es **`shooting`**, emitida por la regla `finalizacion-eficiencia` de [A17](reglas-motor.md). Las tres actividades pueden trabajar finalización en 1v1, 2v2 y 3v3. Una eficiencia baja activa esa prioridad general; no demuestra por sí sola un error técnico concreto ni determina la dificultad de CoCo.

El nivel sugerido usa el **rango declarado de la modalidad del bloque analizado**. Si falta, se usa la ejecución base/Easy sin inventar un rango. El jugador puede escoger una variante más sencilla. No se estima MMR automáticamente.

| Nivel de práctica inicial | Rangos sugeridos | Ejecución de los paquetes de Castro |
| --- | --- | --- |
| Base | Bronce–Oro | Asegurar el contacto y dirigir el balón a portería. |
| Colocación | Platino–Diamante | Elegir izquierda o derecha antes del tiro y buscar esa zona. |
| Colocación y potencia | Champion–SSL | Elegir una esquina y combinar colocación con potencia. |

Se utilizan los paquetes base y los ajustes propios del mapa, **sin BakkesMod**. No se copian las configuraciones de BakkesMod del documento de Castro. True Neutral's True Shot, otros paquetes y otras prioridades quedan fuera de esta selección inicial.

## Ficha 1 · Ground Shots de Castro

| Campo | Contenido |
| --- | --- |
| Clave de contenido / versión | `castro-ground-shots` / `1`. Es una referencia interna, no un ID SQL inventado. |
| Recurso | Custom Training: **`9472-6A26-7F5D-767B`**. Autor: Castro. |
| Acceso previsto en el MVP | Steam o Epic, mediante entrenamiento personalizado nativo; no requiere Workshop. Confirmar importación del código dentro del juego antes de activarlo. |
| Finalidad | Contacto después del bote, consistencia, colocación y potencia de finalización. |
| Duración de referencia / mínima | **10 / 5 minutos**. Los 10 minutos corresponden a la rutina base de 20; A18 asignará la duración final. |
| Dificultad base | `1`, ejecución base; progresión según el nivel de práctica indicado arriba. |

**Instrucciones:** abrir Entrenamiento personalizado, introducir el código y practicar sin añadir aleatorización externa. Esperar el bote y golpear justo después. Recorrer las posiciones en orden con **máximo tres intentos por posición** antes de avanzar. Practicar durante los minutos asignados; no es obligatorio completar el paquete.

**Criterio de ejecución:** buscar el gol tras ese contacto y, según nivel, la zona elegida y potencia. No se exige una velocidad ni porcentaje de acierto supuestamente calibrado.

## Ficha 2 · Mid Height Shots de Castro

| Campo | Contenido |
| --- | --- |
| Clave de contenido / versión | `castro-mid-height-shots` / `1`. |
| Recurso | Custom Training: **`E6E3-1E82-E6DE-C4B4`**. Autor: Castro. |
| Acceso previsto en el MVP | Steam o Epic, mediante entrenamiento personalizado nativo; no requiere Workshop. Confirmar importación del código dentro del juego antes de activarlo. |
| Finalidad | Finalizar balones elevados que todavía permiten aprovechar el flip para generar potencia. |
| Duración de referencia / mínima | **5 / 5 minutos**. |
| Dificultad base | `1`, ejecución base; progresión según el nivel de práctica indicado arriba. |

**Instrucciones:** abrir el paquete mediante su código y practicar sin añadir aleatorización externa. Buscar finalizar directamente, aprovechando el flip cuando sea posible y adaptando la colocación al nivel. Recorrer las posiciones con **máximo tres intentos por posición**; detener la práctica al cumplir los minutos asignados.

**Criterio de ejecución:** contacto controlado y gol directo; añadir colocación y potencia según nivel. No se exige una mecánica avanzada adicional.

## Ficha 3 · Aim Training de CoCo

| Campo | Contenido |
| --- | --- |
| Clave de contenido / versión | `coco-aim-training` / `1`. |
| Recurso | [Aim Training — CoCo en Steam Workshop](https://steamcommunity.com/sharedfiles/filedetails/?id=1906378036). ID del mapa: `1906378036`; no es un código de Custom Training. |
| Requisito | **Acceso al mapa mediante Steam Workshop**, sin BakkesMod. Tener una cuenta Steam enlazada como identidad del jugador no acredita por sí solo acceso al mapa. Si el acceso no está confirmado, usar los paquetes de Castro. |
| Finalidad | Precisión y consistencia de contacto contra objetivos. |
| Duración de referencia / mínima | **5 / 5 minutos**. |
| Dificultad base | `1`; la dificultad prescrita depende de la variante elegida. |

**Instrucciones:** elegir una sola variante para el bloque de práctica. En Normal, comprobar los tres ajustes de la tabla antes de empezar. Buscar contactos controlados durante el tiempo asignado y registrar la mejor racha. **No reiniciar el cronómetro después de fallar**; tampoco deducir el estado de los ajustes por el color de la captura de ejemplo.

| Variante | Rango sugerido | Dificultad | Tamaños aleatorios | Distancias aleatorias | Caídas aleatorias |
| --- | --- | ---: | --- | --- | --- |
| Easy · `easy-base` | Bronce–Oro; o sin rango declarado | 1 | No aplica | No aplica | No aplica |
| Normal · `normal-fixed` | Platino–Diamante | 2 | Desactivado | Desactivado | Desactivado |
| Normal · `normal-distance` | Champion | 3 | Desactivado | Activado | Desactivado |
| Normal · `normal-random` | Grand Champion–SSL | 4 | Activado | Activado | Activado |
| Survival · `survival-optional` | Alternativa opcional GC–SSL | 4 | No aplica | No aplica | No aplica |

Con los tres ajustes de Normal desactivados, la descripción del autor indica objetivo mediano, distancia cercana y preparación de powershot. Los interruptores de la tabla son propios de **Normal**; no se presupone que controlen Easy o Survival. En el JSON, `null` significa «no aplica» en esas variantes.

**Survival sustituye a Normal**, sin añadir un cuarto ejercicio ni aumentar el tiempo asignado a CoCo. Solo se elige expresamente como alternativa avanzada. Roberto informó que da **cinco segundos para tirar** y reinicia el tiro si se agota ese tiempo; ese detalle procede de su experiencia, no de una prueba automatizada de esta entrega.

**Criterio de ejecución:** contactos controlados y consistencia. Se registra mejor racha sin exigir un número para subir de nivel ni interpretarla como eficiencia de partidos. Si el jugador baja la dificultad, registrar la nueva variante como otro bloque de práctica.

## Distribución del tiempo · especificación para A18

**Versión: `mvp.allocation.v1`.** Se aplica a esta rutina inicial de finalización, no fija el reparto de futuras prioridades. Se seleccionan primero ejercicios activos y compatibles; el contenido pendiente no se activa para llenar tiempo. Se elige una sola variante de CoCo.

Con los tres recursos disponibles: **50 % Ground Shots, 25 % Mid Height Shots y 25 % CoCo**. Sin Workshop: **75 % Ground Shots y 25 % Mid Height Shots**. La duración mínima es **cinco minutos por ejercicio**.

Convención para implementar sin exceder disponibilidad:

1. Trabajar con minutos enteros. Si no caben tres ejercicios de cinco minutos, seleccionar menos. Con Workshop, el orden para esa selección corta es Ground Shots → CoCo → Mid Height Shots; sin Workshop, Ground Shots → Mid Height Shots.
2. Calcular las cuotas proporcionales de los ejercicios elegidos. Si una cuota queda por debajo de cinco, fijarla en cinco y redistribuir el presupuesto restante entre los demás conforme a sus pesos; repetir hasta respetar todos los mínimos. No sumar cinco minutos sobre cuotas ya calculadas.
3. Redondear hacia abajo y distribuir los minutos restantes por mayor resto decimal. En empate: Ground Shots → Mid Height Shots → CoCo. La suma nunca supera los minutos disponibles.
4. Excluir recursos inactivos o incompatibles y explicar la cobertura parcial/vacía. Por debajo de cinco minutos, no cabe esta rutina: devolver vacío con `INSUFFICIENT_TIME`. Con cero prioridades respaldadas, A18 no debe inventar una rutina de diagnóstico.

Los ejemplos siguientes **presuponen que David ya comprobó y activó los recursos**. El JSON actual de fichas conserva `active: false`; no representa un catálogo operativo con estos planes ya generados.

| Disponible | Acceso a CoCo | Ground Shots | Mid Height Shots | CoCo |
| ---: | --- | ---: | ---: | ---: |
| 4 min | Sí | — | — | — |
| 5 min | Sí | 5 | — | — |
| 10 min | Sí | 5 | — | 5 |
| 15 min | Sí | 5 | 5 | 5 |
| 20 min | Sí | 10 | 5 | 5 |
| 25 min | Sí | 13 | 6 | 6 |
| 30 min | Sí | 15 | 8 | 7 |
| 40 min | Sí | 20 | 10 | 10 |
| 10 min | No | 5 | 5 | — |
| 20 min | No | 15 | 5 | — |
| 40 min | No | 30 | 10 | — |

Los tiempos corresponden a práctica; la aplicación debe distinguir tiempo previsto y realizado. Cambiar disponibilidad/contexto genera otra propuesta, sin reescribir lo realizado ni su versión histórica. La preparación del mapa se efectúa antes de iniciar el cronómetro del ejercicio.

## Registro manual de práctica

Registrar minutos reales, ejercicio/versión y, en CoCo, variante, ajustes y mejor racha. La app no lee automáticamente el contador del Workshop ni lo obtiene de Ballchasing. Solo contrastar rachas con la misma variante, ajustes y duración; la aleatoriedad sigue introduciendo variación y la racha no demuestra transferencia a partidos ni causalidad del entrenamiento.

El esquema tiene `sesion_versiones.notas`; A21/A24 podrán usar notas para este registro tras comprobar el mapeo. No se añaden aquí columnas ni un formulario nuevo. Conservar por separado rendimiento medido en replays, práctica autorreportada y rango declarado.

## Entrega técnica que continúa David

Leer [diccionario](diccionario-datos.md) e [instantánea SQL](../database/esquema-fase2.sql). `exercise_key`, `content_version` y `variant_key` son referencias de contenido: no sustituir los bigint asignados por la base ni convertir todos los IDs en UUID.

- `ejercicios`: identidad/estado de actividad. Confirmar recursos antes de ofrecerlos activos.
- `ejercicio_versiones`: nombre, categoría, tipo y código/enlace, finalidad, instrucciones, meta, dificultad base y minutos base. Cargar estos criterios como versiones históricas, sin sobrescribir versiones usadas.
- `ejercicio_plataforma`: compatibilidad ligada a la versión. Resolver Steam/Epic y el acceso real a Workshop; la identidad del perfil no basta para decidir acceso al mapa.
- A18/A24: conservar variante, ajustes e instrucciones prescritos en la versión/snapshot correspondiente y enlazar la versión de ejercicio usada por `plan_ejercicio`. La escala de dificultad y los criterios son iniciales; la instantánea SQL solo exige valores positivos. El mapeo de modalidades, rangos sugeridos, prioridad y capacidades no está resuelto por inventar nuevas columnas en este JSON.

El JSON es una referencia para adaptar al [contrato de ejercicio](../planning/examples/exercise.json), no ese payload público ni una migración. Antes de activar: confirmar los dos códigos en el juego, comprobar apertura/ajustes de CoCo y ejecutar seed/consulta con casos activo, inactivo, Steam con acceso, Epic sin Workshop y catálogo sin cobertura. CoCo tiene evidencia aportada por Roberto de uso y opciones, pero la consulta de la app todavía requiere comprobación.

## Fuentes y procedencia

- [Documento y paquetes de Castro](https://docs.google.com/document/d/1d6D9Yh7KhT_acDZS_NLP7Ejsn_dfuUL3e4I1Qa7eXkI/edit?tab=t.0): códigos y práctica de contacto/consistencia; las configuraciones de BakkesMod se excluyen por acuerdo con Roberto.
- [Descripción del autor de CoCo](https://steamcommunity.com/sharedfiles/filedetails/?id=1906378036): modos y significado de los ajustes de Normal. Captura y explicación de Roberto: opciones disponibles, rachas y límite de cinco segundos en Survival.
- [Psyonix, v1.31](https://www.rocketleague.com/news/patch-notes-v1-31): intercambio entre plataformas de Custom Training. Los dos códigos aún requieren confirmar su importación actual.
- [Psyonix, Workshop y EAC](https://www.rocketleague.com/news/easy-anti-cheat-comes-to-rocket-league-on-pc-today): Workshop puede usarse con EAC; no se necesitan mods adicionales para esta selección.

## Comprobación de esta entrega

Se comprobó la validez del JSON, tres claves únicas y sus códigos/URLs documentados, cinco variantes de CoCo, ocho rangos sin solapamiento entre variantes predeterminadas, requisitos sin BakkesMod y los enlaces locales de los documentos modificados. Se recalcularon los once ejemplos de tiempo con fracciones exactas y la convención descrita: respetan mínimos y disponibilidad, y excluyen CoCo cuando no hay acceso a Workshop. Es una comprobación de contenido y aritmética de especificación; no prueba un generador A18, imports dentro del juego ni un seed/consulta ejecutados.

La aportación cierra la definición inicial de contenido deportivo, **no A23 completa**. David continúa carga, consulta, compatibilidad y versiones. El [generador de dominio A18](generador-planes.md) ya aplica estos criterios con un catálogo normalizado y pruebas sintéticas; su integración con catálogo y ruta de generación sigue pendiente. A24 conserva las versiones después y no bloquea el cierre de A18. El archivo de fichas conserva su carácter inactivo y no es convertido en un seed por esa implementación.
