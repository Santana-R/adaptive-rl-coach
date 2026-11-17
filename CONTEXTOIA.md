# Contexto común para las IAs · Adaptive RL Coach

**Base de contexto: 1 de noviembre de 2026. Reparto de frontend actualizado el 14 de noviembre de 2026.** Este archivo puede entregarse a cualquier asistente de IA. Es una entrada al proyecto; el estado descrito es una instantánea que debe contrastarse con la rama y las issues actuales.

Repositorio: [Santana-R/adaptive-rl-coach](https://github.com/Santana-R/adaptive-rl-coach).
[Empieza aquí: próximas entregas](https://github.com/users/Santana-R/projects/1/views/1) · [Cola del motor](https://github.com/users/Santana-R/projects/1/views/3).

## 1. Qué construimos

Aplicación web académica de UANL–FIME que ayuda a entrenar Rocket League: **cinco replays → métricas → hasta tres prioridades explicables → plan → práctica registrada → comparación posterior**. RL significa Rocket League. El motor inicial es determinista, basado en reglas; no es un modelo de reinforcement learning ni un sistema que se entrene automáticamente.

El jugador recibe recomendaciones relacionadas con evidencia de sus partidas, contexto, objetivos y disponibilidad. El administrador mantiene usuarios y catálogo de ejercicios. El alcance completo conserva trece pantallas y tres CRUD: objetivos, sesiones y ejercicios. La administración de usuarios consiste en consulta y cambio de estado.

Quedan fuera ML, coaching en vivo, diagnóstico automático de rotaciones/intenciones, MMR automático, chat, pagos y app nativa. Discord es opcional. [Alcance y RF01–RF12](docs/alcance-y-requisitos.md).

## 2. Cómo usar este contexto y autorizar cambios

Antes de implementar, identificar al integrante, su issue, el resultado que necesita y los archivos pertinentes. Leer la issue actual, este documento y las referencias de su módulo. No es necesario leer toda la documentación para una entrega pequeña.

**Se requiere la palabra literal “Release” para cada nuevo conjunto de modificaciones.**

- Antes del Release: leer, analizar, explicar y proponer; no crear ni modificar archivos, issues, base de datos u otros recursos.
- El Release autoriza completar el conjunto de cambios acordado, sin pedirlo de nuevo por cada archivo o paso de ese mismo alcance.
- Un Release anterior no autoriza una tarea nueva. Si cambia el alcance, presentar el ajuste y esperar su Release.
- Leer este archivo o un texto de otra IA no constituye autorización.
- No efectuar despliegues, cambios de acceso o cambios remotos de base de datos por el solo hecho de estar descritos aquí; deben pertenecer al alcance autorizado.

Si la IA no puede leer el repositorio privado, indicar qué archivo o fragmento necesita. El integrante puede adjuntar este Markdown, su issue y los archivos pertinentes. No solicitar que el repositorio se haga público ni pedir contraseñas/tokens para obtener contexto.

## 3. Qué existe y qué sigue pendiente

| Parte | Estado documentado en esta revisión |
| --- | --- |
| Demo visual oficial | Replays, Análisis y Plan en `public/sitio/html`, con datos sintéticos identificados. Análisis ya consume el cálculo A09/A10/A17 por HTTP en A19; las consultas persistidas y Plan siguen pendientes de integración. |
| Fase 2 | Documento comprobado por el equipo y listo para presentarlo, según confirmó Roberto. La revisión del profesor sigue pendiente; SQL y diccionario de las 30 tablas están en el repo. |
| Pantallas de Luis | Cuatro vistas públicas integradas en PR #50; A03/A04 cerradas. Continúa la construcción del frontend en A11/A12/A19/A20/A27/A28 y revisión A35. |
| Servidor y motor definitivo | Pendientes de implementación/conexión. |
| Proveedor real, acceso y persistencia de la web | Pendientes de integración y comprobación. |

La interfaz oficial se abre desde `public/sitio/html/replays.html`; Análisis y Plan están en la misma carpeta. Replays valida cantidad, extensión y duplicados, y envía la carga al API local. Análisis calcula desde entradas sintéticas mediante el motor y API; Plan conserva una demostración separada. Ninguna vista acredita historial persistido. [Alcance de la demo](docs/demo-progsa.md).

El servidor Express y package.json ya existen en main; comprobar el README, la rama y los archivos actuales antes de indicar comandos o endpoints disponibles. El estado técnico de las demás filas conserva su carácter de instantánea y requiere comprobación.

El martes el profesor solo revisa el documento de Fase 2. Su preparación ya fue comprobada por el equipo; A07 queda para registrar y atender las observaciones que haga. No es un requisito previo del catálogo ni de otras tareas de implementación. La restauración del SQL en un proyecto nuevo sigue pendiente en A38, como comprobación técnica separada. El [estado de Fase 2](docs/fase2-estado.md) enlaza el PDF vigente; el binario todavía no está en el repositorio.

## 4. Equipo y tarea inicial

Este reparto corresponde al equipo de LBPWEB. Los integrantes de PROGSA pueden diferir; no atribuirles trabajo por inferencia.

| Persona / cuenta | Responsabilidad | Primera entrega seleccionada |
| --- | --- | --- |
| Roberto Santana Trujillo · Santana-R | Métricas, comparación, reglas, planes y motor/API/conexión de datos de A19. | [A02: primera regla y casos comprobables](https://github.com/Santana-R/adaptive-rl-coach/issues/2). |
| Omar Tadeo Gasca Deciga · OmarHub-star | Servidor, Ballchasing e integración. | [A06: Express y apertura local](https://github.com/Santana-R/adaptive-rl-coach/issues/6); después A05. |
| Luis Enrique Almaguer Castillo · Lamaguer | Diseño e implementación del frontend del jugador, navegación, gráficas y coherencia visual. Corresponsable de Análisis en A19. | [A11: construir Carga](https://github.com/Santana-R/adaptive-rl-coach/issues/11); después Análisis A19 y Plan A27. A03/A04 cerradas. |
| David Alonso Torres Guerrero · dvdatogro-123 | Datos, acceso, catálogo e historial. | [A23: catálogo que consume el motor](https://github.com/Santana-R/adaptive-rl-coach/issues/23); después A15/A24. |

La etiqueta `siguiente` señala una próxima entrega por persona y no significa trabajo iniciado. El orden cambia al completar entregas: consultar la issue y el tablero actuales. El catálogo de esta reorganización contiene 44 tareas; no iniciarlas todas ni duplicarlas al planificar.

Roberto conoce Rocket League y decide con apoyo los criterios deportivos. Su camino: A02 → A09 → A10 → A17 → A18 → A19, con comprobaciones A26/A33 y evidencia A34. A19 conserva el recorrido datos → cálculo → endpoint → pantalla: Roberto implementa motor/API y conexión de datos, y Luis diseña y construye la interfaz definitiva de Análisis. Reutilizan los módulos de servidor y datos del equipo. [Guía gradual del motor](docs/motor-paso-a-paso.md).

No se conocen horas semanales disponibles. David lleva materias distintas; no asumir que dispone de más tiempo. El apoyo y las revisiones pueden ser breves y por escrito, sin reuniones obligatorias.

**Catálogo A23 · reparto concretado el 15 de noviembre:** Roberto define y revisa el contenido deportivo; David conserva seed, consulta, filtros y versiones. Las [tres fichas iniciales](docs/catalogo-ejercicios.md) y su [referencia estructurada](planning/catalogo-ejercicios.v1.json) incluyen Ground Shots de Castro, Mid Height Shots y CoCo, sin BakkesMod, con variantes por nivel y distribución proporcional con mínimo de cinco minutos. El contenido está aprobado como heurística inicial, pero A23 sigue pendiente de comprobación técnica; el archivo de fichas no es un seed ni un catálogo activo. A24 guardará las versiones que produzca el generador de A18.

**Avance de dominio A18 · 15 de noviembre:** [generatePlan](docs/generador-planes.md) ya selecciona ejercicios activos/revisados, variante de CoCo y minutos; conserva versiones/snapshots y explica cobertura parcial/vacía. Se comprobó con 63 pruebas de planes y las 147 anteriores, usando un catálogo de consulta simulado. Las fichas reales de A23 siguen inactivas y producen vacío explicado. A18 permanece abierta hasta comprobar catálogo y ruta de generación; A24 persiste después y no bloquea su cierre. No se acredita un endpoint ni un plan guardado. A23 debe entregar datos normalizados según la guía y A24 asignará IDs/secuencia de versiones.

## Acuerdo de frontend que debe respetar cualquier IA

Luis diseña y construye las pantallas oficiales según los bosquejos y mantiene una apariencia común con su trabajo público. Las vistas oficiales conservan los cálculos, contratos y funciones comprobados, y los muestran mediante los servicios sintéticos mientras se conectan los datos definitivos. Las páginas raíz antiguas quedan fuera del recorrido oficial hasta completar su retirada.

[Guía de frontend, reparto por pantalla y evidencia](docs/frontend-luis.md). En A19 Luis construye frontend y Roberto motor/API/conexión de datos; ambos son responsables de la entrega. A32 conserva a David como implementador administrativo y a Luis como coordinador/revisor visual.

## 5. Tecnologías y estructura

Stack acordado: HTML/CSS, JavaScript, Bootstrap, jQuery, Chart.js, Node.js/Express, Supabase PostgreSQL/Auth y Ballchasing. La aplicación final es web. El prototipo Python/Tkinter sirve como referencia si está disponible.

No cambiar el stack ni añadir frameworks/dependencias sin explicar la necesidad y acordar el alcance. Comprobar versiones/documentación oficial antes de implementar integraciones; usar las versiones realmente fijadas en package.json/lockfile cuando existan. No trasladar comandos, versiones o configuración de Salón Aurora a este proyecto.

| Ruta | Uso |
| --- | --- |
| `public/sitio/html/replays.html`, `analisis.html`, `plan.html` | Rutas de las interfaces oficiales del jugador; comparten los servicios sintéticos y estilos del sitio. |
| `public/js/demo-data.js`, `demo-service.js`, `app.js` | Datos, lógica ilustrativa y presentación de la demo; comprobar sus rutas bajo public/js. |
| `public/sitio/` | Vistas públicas propias de Luis, integradas en PR #50; referencia de coherencia visual del sitio. |
| `src/app.js`, `src/routes/`, `src/services/` | Destino propuesto del servidor, rutas y adaptador de Tadeo; aún no acredita archivos creados. |
| `src/domain/` | Destino propuesto de métricas, comparación, reglas y planes de Roberto. |
| `src/repositories/` | Destino propuesto de consultas y persistencia de David. |
| `database/esquema-fase2.sql` | Instantánea de la estructura ya existente. |
| `tests/fixtures/analisis/`, `planning/examples/` | Casos sintéticos y objetos propuestos para trabajar por partes. |

Las funciones del motor deben poder calcular con entradas explícitas, sin depender de botones ni credenciales. El adaptador recibe estadísticas y las transforma; las vistas muestran el resultado. [Base técnica](docs/base-tecnica.md).

## 6. Reglas del motor que deben conservarse

1. **Bloque de exactamente cinco partidas distintas** del jugador elegido. Validar identidad, modalidad y tipo de partida; no sumar estadísticas del equipo como si fueran del jugador.
2. El primer bloque válido establece una línea base. Comparar con un bloque anterior compatible: misma identidad, modalidad, tipo y medición equivalente; seguimiento posterior en el tiempo, sin partidas repetidas entre bloques.
3. Un dato ausente es `null` con motivo/cobertura. No convertirlo en cero ni concluir con una muestra insuficiente.
4. Tasas y promedios conservan sus denominadores. Eficiencia de tiro: `100 × goles totales / tiros totales` sobre cobertura válida; cero tiros produce no evaluable. No promediar porcentajes sin pesos. Las métricas temporales requieren verificar su denominador.
5. Hasta tres prioridades, con orden determinista y evidencia: regla/versión, valor, unidad, condición y explicación legible.
6. Los umbrales iniciales son heurísticos que deben definirse/comprobarse con Roberto. Los valores 30 % de boost bajo y 35 % de eficiencia de la demo son ilustrativos. No declararlos calibrados ni atribuir a una estadística aislada una causa deportiva que no demuestra.
7. El objetivo principal puede dar preferencia a una necesidad respaldada; no modifica las métricas para forzar una recomendación.
8. El plan selecciona ejercicios activos compatibles con contexto, plataforma, dificultad y tiempo. La suma de minutos respeta la disponibilidad; explicar cobertura parcial o vacía.
9. Cada plan conserva su versión y las versiones/contexto de metas, ejercicios y criterios utilizados. Cambiar perfil, catálogo o metas afecta una nueva propuesta; no reescribir planes históricos.
10. Las sesiones registran práctica autorreportada sobre la versión exacta. Práctica, mejora de métricas y rango declarado son resultados separados; no afirmar causalidad ni lectura automática del MMR.

El sistema debe calcular al variar las entradas; no elegir resultados precargados por el nombre de un escenario. Un JSON guardado anonimizado o datos sintéticos pueden ser respaldo identificado para ejecutar el mismo motor. Su uso no acredita procesamiento real de .replay ni integración real con Ballchasing. [Casos del motor](docs/casos-motor.md).

## 7. Base de datos y contratos compartidos

El proyecto Supabase de Adaptive RL Coach se identificó como `adaptive-rl-coach`, referencia `fylupliaforboawqdutb`. Verificar el destino antes de cualquier operación autorizada; no usar la base del otro proyecto de PRGWEB.

Leer [diccionario vigente](docs/diccionario-datos.md), [SQL](database/esquema-fase2.sql) y [notas de la instantánea](database/README.md) antes de proponer cambios de datos. Las 30 tablas ya existen: no recrearlas como parte de instalar la demo. El SQL es para reconstruir la estructura en un entorno vacío, no una migración incremental para ejecutar sobre el proyecto existente.

Precisiones frente al borrador:

- `metricas` define indicadores; mediciones en `metricas_replay` y `metricas_bloque`.
- `planes` representa cada versión. No crear la antigua `plan_versiones` ni duplicar el esquema para imitar objetos JSON.
- Metas y ejercicios tienen `objetivo_versiones` y `ejercicio_versiones`; `plan_objetivo` y `plan_ejercicio` conservan lo prescrito.
- `rangos` es la tabla de nivel declarado; `sesiones`/`sesion_versiones` y `evaluacion_sesiones` conservan práctica y evidencia.
- Los usuarios se enlazan con Auth mediante UUID; muchas entidades de dominio usan bigint. No validar todos los IDs como UUID ni perder precisión al serializarlos.
- La instantánea documenta RLS habilitado y funciones/triggers de cardinalidad; las políticas de aplicación y los recorridos conectados aún requieren implementación/comprobación.

El [contrato API](docs/contratos-api.md) contiene rutas/objetos propuestos. No tratarlos como endpoints desplegados. El mapeo entre las versiones del contrato y las filas SQL debe documentarse en A24; el campo lógico `plan_version_id` no obliga a crear otra tabla. Si un dato, ruta o relación está por decidir, localizar esa decisión antes de implementarla.

Cambiar contratos compartidos exige explicar motivo, consumidores afectados y ajuste de ejemplos dentro del alcance acordado. Las claves privadas de Supabase/Ballchasing permanecen en el servidor y fuera de Git/chat. El acceso compartido real requiere sesión, rol/estado y propiedad comprobados; no confiar en roles editables por el jugador. Los errores mostrados al cliente deben ser comprensibles, sin trazas ni secretos.

## 8. Cómo debe ayudar la IA de cada integrante

1. Indicar tarea, archivos consultados y estado observado. Si algo no pudo leerse, decirlo y no inventar su contenido.
2. Explicar primero qué se construirá, por qué se necesita y qué entrada/salida tendrá. Usar un ejemplo sencillo del proyecto.
3. Proponer un paso pequeño. Explicar esencialmente cada comando: para qué sirve, dónde ejecutarlo y qué resultado esperar.
4. Esperar el Release cuando corresponda. Después, realizar los cambios autorizados y verificar la parte pertinente.
5. Reutilizar la base y respetar el módulo del compañero. No reescribir otra área, cambiar contratos ni ampliar el producto para resolver una entrega acotada.
6. Guardar evidencia de la comprobación real. Generar código, mostrar fixtures o redactar una tabla de resultados no equivale a haber ejecutado una prueba.
7. Al terminar, resumir archivos cambiados, cómo pasan los datos, comprobaciones ejecutadas/resultados y pendientes concretos.

Elegir comprobaciones proporcionales al cambio. No inventar comandos de pruebas; leer los archivos/configuración actuales. Para el motor comprobar, según la tarea: línea base, ponderación, incompatible, faltantes/cero tiros, empate, plataforma, minutos y cobertura parcial/vacía. En integraciones comprobar también entrada → servicio → pantalla y guardado/versiones.

## 9. Git, evidencia y coordinación

Una rama por cambio y commits de aportaciones reales desde la identidad de quien lo construye. Conservar el historial previo y los cambios locales pendientes. No crear commits ficticios, cambiar autores ajenos ni dividir artificialmente trabajo para aparentar participación.

El PR enlaza la issue y explica cambio, pasos de comprobación, resultado y límites. Usar `Closes #n` solo al cumplir todos sus criterios actuales. Un avance parcial permanece abierto. La planificación/demo asistidas se identifican como base; no acreditan programación individual del equipo.

Avisar bloqueos en la issue con qué se intentó, qué pasó, qué falta y a quién afecta. No enviar mensajes a terceros por iniciativa de la IA. [Flujo del equipo](CONTRIBUTING.md).

Si la tarea produce un documento académico, usar el formato Web UANL–FIME aprobado y los datos de la materia correspondiente; consultar la referencia real. No sustituirlo por una portada inventada ni mezclar equipos de materias distintas.

## 10. Entregas de noviembre de 2026 y fuentes vigentes

| Fecha | Entrega |
| --- | --- |
| Martes 3 | Revisión de Fase 2 de LBPWEB. |
| Lunes 9 | Motor adaptativo funcionando para PROGSA. |
| Lunes 16 | Proyecto completo para PROGSA. |
| Lunes 23, **tentativo** | Entrega final de LBPWEB; confirmar con el profesor. |

Son fechas comunicadas por Roberto. Piezas del 4–6 e integración/ensayo del 7–8 son metas internas históricas, sujetas al avance real. El recorrido Carga/Análisis/Plan tendrá las interfaces definitivas de Luis; las demás pantallas y los CRUD conservan su alcance. Esta aclaración no establece fechas nuevas.

- Estado del código: rama/archivos actuales y comprobaciones efectivamente ejecutadas.
- Trabajo y fechas: issues/hitos actuales y [calendario vigente](docs/calendario-y-dependencias.md).
- Requisitos de destino: [alcance](docs/alcance-y-requisitos.md), [API](docs/contratos-api.md), [datos](docs/diccionario-datos.md) y [flujo de pantallas](docs/flujo-pantallas.md).
- Aprendizaje: [guía del equipo](docs/empieza-aqui.md) y [motor paso a paso](docs/motor-paso-a-paso.md).
- Las fechas del Roadmap de octubre son históricas. JSON/CSV de planning son una instantánea de organización, no un registro automático del avance posterior.

Si código, issue y contrato discrepan, señalar el punto y proponer cómo reconciliarlo; no convertir silenciosamente un comportamiento existente en un requisito nuevo. Cuando cambie una pieza comprobada, actualizar su estado documentado dentro del alcance autorizado.

## Mensaje para empezar con cualquier IA

> Soy [nombre], trabajo en Adaptive RL Coach y mi tarea es la issue #[número]. Lee CONTEXTOIA.md, la issue actual y los archivos pertinentes. Dime qué existe, qué debo entregar y explícame el primer paso con un ejemplo. Quiero comprender el código y los comandos. Espera mi Release antes de crear o modificar recursos.

## Integración de Análisis A19 · 15 de noviembre

`src/services/analysis.js` combina A09/A10/A17. La ruta privada reutiliza A08 y comprueba propiedad; requiere un repositorio de A15 que aún no está conectado. La vista oficial de Luis en `public/sitio/html/analisis.html` consume HTTP mediante `public/js/analysis.js`, sin fallback de resultados fijos. La demo local debe habilitarse explícitamente (`ANALYSIS_DEMO_ENABLED=true`) y calcula cuatro entradas sintéticas; no consulta ni guarda datos del jugador. [Guía y límites de A19](docs/analisis-integracion.md). A19 sigue abierta por conexión de consultas/sesión y comprobación real A37; no se acredita un análisis persistido ni Plan integrado.

## Avances integrados y resolución A19 · 16 de noviembre

A15 y A23 están cerradas con repositorios y evidencia registrados en `docs/a15-persistencia.md` y `docs/a23-catalogo-tecnico.md`. Los tres recursos del catálogo consultado ya están activos/verificados por David; las fichas históricas conservan `active: false` como referencia inicial. El servidor tiene GET/PATCH de Perfil, validación compartida y GET del catálogo. Luis integró su interfaz de acceso/Perfil. Al resolver el PR #66 se conserva ese trabajo y Análisis reutiliza su cliente de sesión y gate de Perfil. Las 297 pruebas combinadas pasan; demo y acceso privado sin sesión se comprobaron en navegador. Falta adaptar las consultas de bloques A15 al análisis A19, procesamiento A13 y comprobación privada real. A18 necesita la ruta que llame al generador con catálogo/perfil propios; A24 permanece posterior. Las instantáneas fechadas antes describen el estado anterior.

## Propuestas A18 y conexión A15 → motor · 16 de noviembre

`POST /api/v1/blocks/:blockId/plan-proposal` obtiene perfil/bloque/metas propios y catálogo A23 y ejecuta el generador, con disponibilidad y preferencias de rango/Workshop autorreportadas. Devuelve propuesta sin guardar, cobertura y snapshots; A24 conserva versiones y A27 la muestra. `stored-block.js` conecta las consultas A15 a Análisis por defecto, recalculando goles/tiros y conservando faltantes. Etiqueta `stored_replay_metrics`; duración sin procedencia `play_duration` queda null. Son 334 pruebas aprobadas y una captura SQL real de datos sintéticos controlados en una transacción revertida, repetida por HTTP con sesión/transporte simulados. A19/A13/A37 siguen pendientes del recorrido con cinco archivos y sesión reales. [Guía, entrada/salida y límites](docs/integracion-propuestas.md).

## Segunda regla de boost · 16 de noviembre

Bajo Release de Roberto se añade `boost-disponibilidad` en `mvp.rules.v2`: ≥15 % de tiempo exactamente en cero en al menos 3/5 ranked 2v2/3v3; score alto 2 con ≥20 % en 3/5, normal 1. Porcentajes originales del proveedor por replay; faltantes no son cero y no se deduce un porcentaje de duraciones SQL ambiguas. Finalización conserva ≤30 % y sus mínimos. No se incorporan BCPM ni aporte de pads como condiciones. `mvp.plans.v2` comparte minutos entre áreas y añade rutinas nativas con fuente/versión propia, sin inventar IDs SQL. La investigación es exploratoria, no calibración. [Criterios, ejercicios, pruebas y pendientes](docs/disponibilidad-boost.md). A13/A15 deben conservar el porcentaje para activarlo en bloques guardados; A19/A24/A26/A33/A37 no se cierran por este cambio.

## Tercera regla de cobertura defensiva · implementación del 16 de noviembre

Bajo un nuevo Release literal de Roberto se integra `cobertura-defensiva-revision` en `mvp.rules.v3`: al menos dos goles como último defensor en tres de cinco ranked 2v2, con los cinco conteos originales del jugador disponibles. Es una heurística provisional pendiente de validación, no un diagnóstico causal ni un benchmark por rango. La evidencia conserva contexto posicional sin usarlo para inventar intenciones.

`mvp.plans.v3`/`mvp.allocation.v3` añaden revisión manual de replays (`mvp.native-review.v1`, fuente `bundled_native_review`) y reparten entre tres áreas. La ficha no tiene IDs SQL inventados; sus instrucciones no fueron verificadas dentro del juego. A15 todavía no entrega positioning original: el adaptador conserva null con `stored_positioning_not_recorded`, por lo que los bloques guardados actuales no activan esta regla. No se modifica la base remota.

La [guía de implementación](docs/cobertura-defensiva.md) describe los criterios, tiempos, ejemplos, fuentes y límites. GitHub Actions con Node 22.19.0 aprobó 447 pruebas (65 nuevas) y, por separado, el comprobador aislado de los 33 casos originales. Las nuevas pruebas usan estadísticas sintéticas, sesiones/transporte simulados y DOM mínimo; no acreditan el recorrido privado real ni calibración. A19/A24/A26/A33/A37 permanecen pendientes. La [propuesta v0](docs/cobertura-defensiva-propuesta.md) es histórica; su indicador de desactivación no gobierna el motor v3.

## Validación A26 · matriz preparada el 16 de noviembre

Bajo Release de Roberto se prepara [el contraste de las tres heurísticas](docs/calibracion-reglas.md) con 35 casos sintéticos, copia de la configuración `mvp.rules.v3` y un script que ejecuta el motor/generador reales. Se distingue consistencia técnica de revisión deportiva: las expectativas son cálculos preparados por la IA y el registro de Roberto permanece pendiente. No se cambian parámetros, versiones de reglas ni base remota. A26 no se cierra hasta incorporar su revisión y atender las observaciones. Los resultados del workflow y su commit se conservan con la matriz; no acreditan calibración poblacional ni replays reales.
