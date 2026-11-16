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
| Demo visual oficial | Replays, Análisis y Plan en `public/sitio/html`, con datos sintéticos y reglas ilustrativas mientras se conectan los servicios definitivos. |
| Fase 2 | Documento comprobado por el equipo y listo para presentarlo, según confirmó Roberto. La revisión del profesor sigue pendiente; SQL y diccionario de las 30 tablas están en el repo. |
| Pantallas de Luis | Cuatro vistas públicas integradas en PR #50; A03/A04 cerradas. Continúa la construcción del frontend en A11/A12/A19/A20/A27/A28 y revisión A35. |
| Servidor y motor definitivo | Pendientes de implementación/conexión. |
| Proveedor real, acceso y persistencia de la web | Pendientes de integración y comprobación. |

La interfaz oficial se abre desde `public/sitio/html/replays.html`; Análisis y Plan están en la misma carpeta. Replays valida cantidad, extensión y duplicados, y envía la carga al API local. Las métricas y planes sintéticos de las vistas oficiales siguen siendo una demostración y no acreditan historial persistido. [Alcance de la demo](docs/demo-progsa.md).

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
