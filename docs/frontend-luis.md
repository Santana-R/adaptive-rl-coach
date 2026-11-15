# Luis: pantallas definitivas y reparto de frontend

Acuerdo confirmado por Roberto el 14 de noviembre de 2026.

**Luis diseña y construye las pantallas definitivas del jugador, incluidas Carga, Análisis y Plan.** Parte de los bosquejos de Fase 1 y mantiene una apariencia común con sus vistas públicas. Decide la distribución, estilos, componentes y presentación de estados; su responsabilidad incluye implementar la interfaz y conectarla con el equipo.

Las tres pantallas del cascarón PROGSA fueron una entrega provisional asistida. Su HTML/CSS y presentación no se adoptan como interfaz final. Las versiones definitivas requieren el diseño y la implementación de Luis. Los cálculos, contratos y funciones ya comprobados se conservan y se conectan con esas nuevas interfaces; las reglas ilustrativas de la demo no sustituyen al motor.

## Qué pantalla trabaja cada uno

| Pantalla o grupo | Trabajo de interfaz | Issue y conexión |
| --- | --- | --- |
| Inicio, Acerca y Ayuda | Luis: conservar su trabajo y mantener el estilo común. | A03/A04 cerradas registran el avance inicial; no acreditan todo el frontend. |
| Registro/login y Perfil | Luis: completar formularios, navegación y estados. | [A12](https://github.com/Santana-R/adaptive-rl-coach/issues/12); David aporta Auth y persistencia. |
| Carga/historial | Luis: construir Carga; completar historial/detalle en A28. | [A11](https://github.com/Santana-R/adaptive-rl-coach/issues/11) y [A28](https://github.com/Santana-R/adaptive-rl-coach/issues/28); Tadeo aporta carga, validación y estados. |
| Análisis | Luis: diseño e implementación de la interfaz; Roberto: cálculo, endpoint y conexión de datos. | [A19 compartida](https://github.com/Santana-R/adaptive-rl-coach/issues/19); ambos registran sus aportaciones. |
| Objetivos | Luis: construir listado, formularios y estados. | [A20](https://github.com/Santana-R/adaptive-rl-coach/issues/20); David aporta operaciones e historial. |
| Plan | Luis: construir propuesta, ejercicios, cobertura y consulta de versiones. | [A27](https://github.com/Santana-R/adaptive-rl-coach/issues/27); Roberto calcula y David conserva versiones. |
| Sesiones y seguimiento | Luis: construir formularios/historial y presentar reportes dentro de las vistas aprobadas. | [A28](https://github.com/Santana-R/adaptive-rl-coach/issues/28); Tadeo aporta sesiones/reportes. |
| Panel admin, Usuarios admin y Ejercicios admin | David implementa; Luis acuerda componentes y revisa coherencia visual. | [A32](https://github.com/Santana-R/adaptive-rl-coach/issues/32). |

El alcance conserva las trece pantallas de la [tabla de flujo](flujo-pantallas.md). El seguimiento se integra en Análisis, Objetivos y Sesiones, sin añadir una pantalla independiente de Reportes.

## Primer recorrido que construye Luis

1. **Carga — A11:** selección de cinco replays, contexto y origen de datos; estados vacío, pendiente, procesando, inválido, fallido y listo; entrada a Análisis.
2. **Análisis — A19:** métricas y unidades, línea base o comparación válida, datos ausentes y hasta tres prioridades con su evidencia; salida a Plan.
3. **Plan — A27:** ejercicios, motivos, instrucciones/recursos, minutos, cobertura y versiones; estados sin plan, completo, parcial y vacío; enlace a Sesiones.

Los bosquejos fijan el contenido y la navegación. Luis define cómo presentarlos y registra brevemente sus decisiones en el PR. Los umbrales y decisiones deportivas pertenecen al motor de Roberto; la interfaz muestra sus resultados y motivos.

## Cómo conectar sin bloquear el diseño

Luis puede construir las vistas y sus estados con fixtures identificados mientras Roberto, Tadeo y David preparan los servicios. Ese avance visual se registra como parcial; el cierre de una tarea de integración requiere comprobar el recorrido conectado.

Las rutas objetivo siguen siendo `public/carga.html`, `public/analisis.html` y `public/plan.html`, con los estilos/componentes comunes que defina Luis. Si reorganiza archivos, coordina rutas y recursos con Tadeo y lo registra en el PR. A19 separa HTML/CSS y componentes de Luis de cálculo/API y conexión de datos de Roberto; ambos acuerdan cualquier archivo compartido.

La sustitución del cascarón se hará al integrar las nuevas pantallas de Luis y comprobar navegación y comportamiento. Este acuerdo actualiza tareas y documentación; las pantallas definitivas siguen pendientes de construcción.

## Qué evidencia entrega

En cada PR: commits propios, captura de escritorio y de móvil a 390 px, decisiones de diseño breves y pasos/resultados del recorrido. Identificar datos de prueba, funciones conectadas y pendientes. [A35](https://github.com/Santana-R/adaptive-rl-coach/issues/35) comprueba la coherencia, accesibilidad y uso del conjunto.

La siguiente entrega de Luis es A11; después coordina Análisis en A19 y Plan en A27. A12/A20/A28 completan las demás vistas. Las fechas académicas y metas históricas se consultan en el [calendario](calendario-y-dependencias.md); esta aclaración no promete disponibilidad ni fechas nuevas.
