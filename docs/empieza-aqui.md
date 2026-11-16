# Empieza con una entrega

El recorrido del motor es **estadísticas → motor → Análisis → Plan adaptado**. Luis diseña y construye las interfaces definitivas de Carga, Análisis y Plan según los bosquejos; el cascarón PROGSA fue provisional. Las trece pantallas y los tres CRUD siguen dentro de la entrega completa. [Reparto por pantalla y entrega de Luis](frontend-luis.md).

| Persona | Haz primero | Sabes que entregaste cuando | Orden siguiente |
| --- | --- | --- | --- |
| Roberto | [A02](https://github.com/Santana-R/adaptive-rl-coach/issues/2): cálculo y primera regla. | Entrada, fórmula, resultado y ficha explicable registrados; pendientes identificados. | A09 → A10 → A17 → A18 → A19 → A26/A33/A34. |
| Tadeo | [A06](https://github.com/Santana-R/adaptive-rl-coach/issues/6): servidor mínimo. | Otro integrante arranca el servidor y abre la demo en localhost. | A05 antes del 3 → A14 → apoyo A11/A19 → A25. |
| Luis | [A11](https://github.com/Santana-R/adaptive-rl-coach/issues/11): diseñar, construir y conectar Carga. | Interfaz propia según bosquejos, estados comprobados y PR con capturas de escritorio/móvil. | A19: construir Análisis con Roberto → A27: construir Plan; después A12/A20/A28 y A35. A03/A04 ya están cerradas. |
| David | [A23](https://github.com/Santana-R/adaptive-rl-coach/issues/23): catálogo de ejercicios del motor. | El catálogo inicial se consulta con actividades activas compatibles y fichas revisadas. | A15 → A24. |

[Abrir las cuatro próximas entregas](https://github.com/users/Santana-R/projects/1/views/1) · [Ver la cola del motor por persona](https://github.com/users/Santana-R/projects/1/views/3).

## Catálogo A23: contenido y aplicación

Roberto aporta el criterio deportivo y las [tres fichas de finalización acordadas](catalogo-ejercicios.md): Ground Shots de Castro, Mid Height Shots y CoCo. David implementa su carga/consulta, filtros de compatibilidad/actividad y versiones sobre las tablas existentes. La [referencia estructurada](../planning/catalogo-ejercicios.v1.json) ayuda a preparar el seed; no acredita un catálogo activo. A23 permanece abierta hasta comprobar esa parte técnica. A18 usará el catálogo comprobado para seleccionar ejercicios y distribuir los minutos con los criterios de las fichas.

## Trabajar con una IA

Comparte [CONTEXTOIA.md](../CONTEXTOIA.md), tu issue y los archivos de la tarea con el asistente que prefieras. Pídele que explique cada paso y comando y espere tu Release antes de modificar recursos. El contexto no se carga automáticamente en todas las herramientas; solicita que lo lea o adjúntalo. Incluye un mensaje listo para empezar.

## Forma de avanzar

1. Abrir la issue propia con etiqueta `siguiente` y seguir su primer paso.
2. Hacer una entrega comprobable. Se reutilizan las 44 issues; las entregas grandes se acotaron y el alcance restante apunta a otra issue existente.
3. Subir rama/PR con aportación real y comprobarlo por escrito.
4. Al completar, mover `siguiente` a la próxima entrega de esa persona.
5. Si hay bloqueo, dejar qué se intentó, qué falta y a quién afecta al detectarlo.

No se estiman horas semanales. David tiene carga académica distinta; no se presume mayor disponibilidad. Las fechas internas son propuestas que se ajustan con el avance y los bloqueos.

## Conexiones de esta semana

Tadeo comprueba temprano qué estadísticas reales entrega el proveedor. Roberto desarrolla funciones con fixtures; David prepara catálogo/guardado; Luis diseña y construye las vistas definitivas y las conecta con esos módulos. Catálogo y persistencia no deben esperar al último día.

Un JSON guardado o sintético puede alimentar **el motor ejecutable** como respaldo identificado. Seleccionar nombres ficticios no equivale a procesar .replay. El uso compartido con datos reales requiere autenticación/propiedad verificadas; antes, el modo de prueba permanece local y explícito.

El equipo ya comprobó que el documento de Fase 2 está listo para presentarlo el 3. A07 solo registra la revisión y sus observaciones; el catálogo y las operaciones de la aplicación avanzan desde ahora sobre las 30 tablas existentes. [Estado de Fase 2](fase2-estado.md).

Roberto mantiene motor, endpoint y conexión de datos de A19 con [acompañamiento paso a paso](motor-paso-a-paso.md). Luis es corresponsable de A19 y construye su interfaz definitiva; Tadeo aporta servidor y David consultas. Ambos autores comprueban datos → cálculo → API → pantalla.

[Calendario](calendario-y-dependencias.md) · [Cómo entregar](../CONTRIBUTING.md) · [Referencias](README.md).
