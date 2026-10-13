# Empieza aquí · Guía del equipo

## La base está preparada: empieza aquí

Lee [Base técnica para empezar](base-tecnica.md). Ya tienes mapa de doce RF, flujo de trece pantallas, contrato con ejemplos, diccionario de datos y cinco casos de prueba. A01 consiste en comprender y revisar esa base con Tadeo, dejando dudas/ajustes en [revision-base.md](revision-base.md). Las pruebas reales continúan en A05/A07/A08.

Reparto aceptado por Roberto el 13 de octubre. Entregas intermedias: jueves 15/22/29 de octubre y 5 de noviembre. Cierres semanales conservados.


Revisión del 13 de octubre de 2026. Equipo de LBPWEB: Roberto Santana Trujillo, Omar Tadeo Gasca Deciga, Luis Enrique Almaguer Castillo y David Alonso Torres Guerrero.

Esta guía explica cómo comenzar y cómo entregar trabajo que otro compañero pueda revisar. La implementación de la aplicación sigue pendiente. Roberto aceptó el reparto. La base técnica ya está preparada; A01 la revisa y las comprobaciones reales se realizan en sus tareas.

## El producto que vamos a construir

Un jugador carga exactamente cinco replays de Rocket League. La aplicación identifica sus datos, calcula métricas y explica hasta tres prioridades de entrenamiento mediante reglas. Con esas prioridades, sus objetivos y su disponibilidad, genera un plan. El jugador registra sesiones y, al cargar otro bloque válido, puede comparar resultados y recibir una nueva versión del plan.

El primer bloque establece el punto de partida. Una sesión registrada indica entrenamiento declarado; la mejora en partidas se evalúa con replays comparables. Los planes anteriores conservan los datos y ejercicios que usaron.

La entrega incluye doce requisitos funcionales, trece pantallas y tres CRUD: objetivos, sesiones y ejercicios. El MVP usa reglas deterministas. El alcance completo está en [Alcance y requisitos](alcance-y-requisitos.md).

## Qué abrir para cada cosa

| Necesitas… | Abre… | Qué encontrarás |
| --- | --- | --- |
| Entender funciones y acuerdos | [Notion](https://app.notion.com/p/3f4dd7559dd8818fbe0ffb78c6423a52) | Esta guía, alcance, reparto y semanas con instrucciones. |
| Entender relaciones entre piezas | [Miro: desarrollo](https://miro.com/app/board/uXjVEcA_AAE=/) | Ciclo del jugador, arquitectura, dependencias y calendario. |
| Saber qué hacer esta semana | [GitHub: Semana activa](https://github.com/users/Santana-R/projects/1/views/3) | Las tareas de S1; el filtro se cambia al comenzar otra semana. |
| Consultar tus responsabilidades | [GitHub: Por integrante](https://github.com/users/Santana-R/projects/1/views/5) | Tareas agrupadas por responsable. |
| Guardar código y documentos | [Repositorio](https://github.com/Santana-R/adaptive-rl-coach) | Archivos y su historial de cambios. |
| Entregar un cambio para revisión | Pull request en el repositorio | Cambios, forma de comprobarlos y evidencia. |

GitHub lleva el estado real de las tareas. Notion explica el trabajo y Miro muestra relaciones. Una tarea abierta en Notion y en GitHub representa el mismo trabajo; no se hace dos veces.

El [System Map](https://miro.com/app/board/uXjVHnaZoh0=/) explica actores y fuerzas del proyecto. El [ERD](https://miro.com/app/board/uXjVEcCTPrc=/) muestra tablas y relaciones; su diseño debe auditarse en A07 antes de implementarlo.

## Quién responde por cada parte

| Integrante | Responsabilidad principal | Conexiones que debe entender |
| --- | --- | --- |
| Luis | Frontend: navegación, formularios, gráficas y experiencia del jugador. | Qué devuelve la API y cómo representar sus estados. |
| Tadeo | Backend: servidor, Ballchasing, endpoints, procesamiento e integración. | Qué necesitan la interfaz, las reglas y la persistencia. |
| David | Base de datos, autenticación, permisos, catálogo e historial. | Cómo se consultan los datos y se conservan planes/sesiones. |
| Roberto | Métricas, comparación, prioridades, planes y función completa de análisis A19. | Persistencia → consulta en servidor → cálculo → pantalla. |

Luis toma frontend por su interés en esa área. Tadeo lleva backend en el reparto aceptado por Roberto; comunicar disponibilidad si afecta una entrega. Cada módulo tiene un responsable, pero sus interfaces y revisiones conectan al equipo.

Roberto desarrolla A19 aprovechando la base visual de Luis, el servidor de Tadeo y las consultas de David. Tadeo coordina A25 para compensar la distribución de integración. Se conservan 44 tareas: Roberto 11, Luis 10, Tadeo 12, David 11, contando contingencias. Esos conteos no miden dificultad ni horas.

En S3 Roberto tiene tres tareas y Luis una, además de revisar A19. En S4 Tadeo coordina tres y Roberto una, además de revisar A25. Confirmar si esa carga cabe; dividir entregas y redistribuir pronto si hace falta.

## Tu primer paso en S1

S1 comienza el 12 de octubre. La entrega intermedia del jueves 15 permite que otros módulos avancen; el corte de la semana es el 18.

| Persona | Primero, al 15 de octubre | Después, al 18 de octubre |
| --- | --- | --- |
| Roberto | [A01](https://github.com/Santana-R/adaptive-rl-coach/issues/1): leer y revisar la base preparada con Tadeo. | [A02](https://github.com/Santana-R/adaptive-rl-coach/issues/2): revisar los cinco casos preparados y contrastar umbrales del prototipo. |
| Luis | [A03](https://github.com/Santana-R/adaptive-rl-coach/issues/3): validar el flujo preparado contra los bosquejos. | [A04](https://github.com/Santana-R/adaptive-rl-coach/issues/4): construir base visual y navegación. |
| Tadeo | [A05](https://github.com/Santana-R/adaptive-rl-coach/issues/5): comprobar Ballchasing con una prueba autorizada. | [A06](https://github.com/Santana-R/adaptive-rl-coach/issues/6): dejar servidor y adaptador básicos. |
| David | [A07](https://github.com/Santana-R/adaptive-rl-coach/issues/7): validar el diccionario preparado contra el ERD. | [A08](https://github.com/Santana-R/adaptive-rl-coach/issues/8): implementar acceso y permisos. |

Las fechas son metas internas propuestas; las fechas académicas siguen pendientes. A01 deja una revisión breve de la base. Contrato, matriz, flujo, diccionario y casos iniciales ya existen; la aplicación y las comprobaciones reales siguen pendientes.

## Cómo trabajar una tarea

1. Abre la issue y lee objetivo, insumos, dependencias y criterios de aceptación. El título solo resume el trabajo.
2. Si falta una entrada, pide el dato concreto: qué necesitas, de quién y para cuándo. Puede acordarse un ejemplo de respuesta antes de terminar el módulo.
3. Cuando entiendas la entrega y tengas las entradas, cambia a Ready. Al comenzar, usa In progress. Mantén como máximo dos tareas activas a la vez.
4. Crea una rama con el ID; por ejemplo, `feat/A19-analisis`. Construye una entrega pequeña y compruébala.
5. Abre un PR con ID, comportamiento, forma de ejecutar la comprobación y evidencia. Vincula la issue; para código puede usarse `Closes #19` cuando ese PR complete toda A19.
6. Cambia a In review. El revisor ejecuta lo indicado, comprueba los criterios y escribe qué observó. Las dudas y correcciones quedan en el PR.
7. Al cumplir los criterios, revisar e integrar, usa Done. Para tareas documentales basta una versión guardada, comprobada y revisada; no se inventa una prueba de código.

| Estado | Significado |
| --- | --- |
| Backlog | Planificada; aún falta preparar o comenzar. |
| Ready | Entrega entendida y entradas disponibles. |
| In progress | Se está construyendo. |
| In review | Entregada para comprobar. |
| Done | Criterios, revisión, integración/guardado y evidencia completos. |
| Blocked | Un impedimento requiere ayuda o una decisión; registrar causa y siguiente acción. |

P0 identifica una tarea que bloquea el ciclo o una entrega. P1 también puede cubrir un requisito obligatorio; no significa que se pueda omitir. Las tareas B01–B04 son contingencias que se activan solo si hacen falta.

## Un ejemplo completo: A02

Ya están preparados cinco casos en [tests/fixtures/analisis](../tests/fixtures/analisis) y [casos-motor.md](casos-motor.md). Un fixture es un conjunto de datos de prueba. A02 revisa/calcula estos ejemplos y completa umbrales del prototipo, no parte de una hoja en blanco.

| Caso | Datos preparados | Resultado esperado |
| --- | --- | --- |
| Primer bloque | Un bloque válido sin historial. | Línea base y explicación de que todavía no hay comparación. |
| Comparable | Dos bloques posteriores del mismo jugador, modalidad, tipo y medición. | Cambios por métrica con unidad y período. |
| Incompatible | Cambia identidad, modalidad, tipo o equivalencia de medición. | No comparar y conservar el motivo. |
| Dato faltante | La métrica tiene `null`. | Mostrar ausencia; no tratarla como cero ni activar su regla. |
| Empate | Dos reglas tienen igual prioridad. | Aplicar desempate acordado y reproducible; máximo tres prioridades. |

Ejemplo inventado para una prueba: A tiene 2 goles de 8 tiros, 25%; B tiene 3 de 10, 30%. El cambio es **+5 puntos porcentuales**. No se presenta como un resultado real ni como un umbral calibrado.

Además, registrar los umbrales que usa el prototipo: métrica, valor, unidad, regla y limitación. No inventar valores para cubrir una casilla. David revisa que entrada y resultado se entiendan y sean coherentes.

## Aprender mientras entregamos

Cada integrante profundiza en su responsabilidad y comprende las conexiones con otras piezas. No se exige trabajo acompañado ni reuniones presenciales para desarrollar.

Dos prácticas forman parte de las entregas existentes:

- **Explicación breve semanal:** cada quien deja qué construyó, cómo funciona, cómo comprobarlo y qué necesita de otro módulo. Puede ser un comentario o la descripción del PR; no requiere reunión.
- **Revisión entre áreas:** quien revisa ejecuta la comprobación y explica lo observado. El objetivo es comprender el cambio además de aprobarlo.

Para Roberto, **A19** concreta el aprendizaje transversal: recuperar bloques guardados, consultar desde Express, reutilizar comparación/reglas y mostrar la respuesta con JavaScript/Chart.js. Luis revisa la interfaz; Tadeo mantiene el servidor común; David mantiene el modelo de datos. Los casos de A02 y A10 se usan para comprobar todo el recorrido. No se añade otra función al alcance.

## Ritmo y calendario

El lunes se confirman compromisos y disponibilidad mediante un intercambio breve. El jueves se entrega el avance intermedio y se registra bloqueo, impacto y ayuda necesaria. Al cierre semanal, cada entrega tiene evidencia, revisión e integración. Estos puntos pueden resolverse por escrito.

| Semana | Resultado que buscamos | Corte interno |
| --- | --- | --- |
| S1 | Contratos, datos revisados, navegación y prueba de Ballchasing. | 18 de octubre |
| S2 | Carga de cinco replays reales, métricas y comparación. | 25 de octubre |
| S3 | Diagnóstico, función completa de análisis, plan y sesiones. | 1 de noviembre |
| S4 | Todo el ciclo integrado y administración. | Viernes 6 de noviembre |
| S5 | Pruebas, ejecución, documentación y demo preparadas. | Viernes 13 de noviembre |
| S6 | Reserva para correcciones y entrega confirmada. | 20 de noviembre |

En S1–S3 el corte propuesto es domingo a las 20:00 de Monterrey. Un bloqueo se comunica al detectarlo y como máximo en 24 horas. Una entrega incompleta permanece abierta con su motivo y siguiente acción.

## Glosario breve

| Término | Significado aquí |
| --- | --- |
| RF | Requisito funcional: una función que debe ofrecer la aplicación. |
| Issue | Ficha de una tarea o defecto en GitHub. |
| Project | Vistas que organizan las mismas issues por estado, semana, persona o fecha. |
| PR | Propuesta de cambios que otro compañero revisa antes de integrar. |
| Endpoint | Ruta del servidor que recibe una petición y devuelve una respuesta. |
| Contrato de datos | Acuerdo de nombres, formatos, unidades, errores y valores ausentes. |
| Fixture | Datos preparados para comprobar un caso. |
| Umbral | Valor a partir del cual una regla se activa. |
| Snapshot | Copia de los datos que usó una versión del plan. |
| CRUD | Crear, consultar, actualizar y eliminar o archivar según las reglas. |
| Línea base | Primera medición válida, todavía sin comparación anterior. |
| Evidencia | Archivo, captura, resultado o ejecución que permite comprobar la entrega. |

## Decisiones que todavía faltan

Disponibilidad y cuentas/accesos de GitHub/Notion cuando afecten compromisos; fechas y rúbricas de ambos cursos; permisos de Ballchasing y entorno de datos; alojamiento de la app. Se registran en [Riesgos y decisiones pendientes](riesgos-y-decisiones-pendientes.md). El equipo de PROGSA puede ser distinto; adaptar responsables de documentos académicos sin confundirlos con este equipo LBPWEB.
