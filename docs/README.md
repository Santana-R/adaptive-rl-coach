# Referencias del proyecto

**Actualización del 18 de noviembre de 2026:** para el estado vigente, consultar [estado actual](estado-actual.md) y [persistencia de medidas](persistencia-mediciones.md). Este documento conserva evidencia y decisiones de su fecha; las limitaciones anteriores de almacenamiento de boost/defensa se corrigieron para las nuevas cargas. Los registros históricos mantienen sus faltantes.

Para comenzar basta [la guía breve](empieza-aqui.md) y tu issue. Abre estas referencias cuando tu cambio las necesite.

| Necesitas | Documento |
| --- | --- |
| Aprender/construir el motor | [Motor paso a paso](motor-paso-a-paso.md) |
| Revisar Fase 2 y estructura SQL | [Estado](fase2-estado.md) · [SQL](../database/esquema-fase2.sql) · [Diccionario](diccionario-datos.md) |
| Construir las pantallas definitivas y ver el reparto de Luis | [Guía de frontend](frontend-luis.md) |
| Consultar la primera subida de las cuatro vistas, ya integrada | [Guía de subida de Luis](subir-pantallas-luis.md) |
| Recorrer la demo con datos sintéticos | [Demo PROGSA](demo-progsa.md) |
| Comprobar funciones y pantallas obligatorias | [Alcance](alcance-y-requisitos.md) · [Flujo](flujo-pantallas.md) · [Matriz RF](../planning/trazabilidad-rf.csv) |
| Acordar entradas, salidas y estados | [Contrato](contratos-api.md) · [Ejemplos](../planning/examples) |
| Entender conexiones y responsabilidades | [Base técnica](base-tecnica.md) · [Arquitectura](arquitectura-y-diagramas.md) |
| Implementar datos e historial | [Diccionario](diccionario-datos.md) |
| Preparar el catálogo y distinguir la aportación de Roberto/David | [Fichas deportivas de A23](catalogo-ejercicios.md) · [Contenido estructurado](../planning/catalogo-ejercicios.v1.json) |
| Probar la ruta de propuesta y conexión con bloques guardados | [Integración A18](integracion-propuestas.md) · [Ejemplo HTTP](../planning/examples/plan-proposal-api.json) |
| Comprender/probar la selección de ejercicios y reparto de minutos | [Generador de propuestas A18](generador-planes.md) · [Ejemplo ejecutado](../planning/examples/plan-proposal.json) |
| Comprender/probar datos → motor → API → pantalla de Análisis | [Integración A19 y evidencias](analisis-integracion.md) |
| Verificar métricas y reglas | [Casos del motor](casos-motor.md) · [Fixtures](../tests/fixtures/analisis) |
| Consultar tareas futuras | [Índice del backlog](backlog.md) |
| Consultar acuerdos y fechas | [Equipo](equipo-y-acuerdos-semanales.md) · [Calendario de referencia](calendario-y-dependencias.md) |
| Preparar la entrega académica | [Pruebas y evidencia](pruebas-y-entrega.md) · [Pendientes](riesgos-y-decisiones-pendientes.md) |
| Instalar, desplegar y comprobar desde cero (A38) | [Guía y registro A38](a38-ejecucion-reproducible.md) · [Orden SQL](../database/README.md#instalación-inicial-a38) |

## Historial

Los [acuerdos de septiembre](historico/acuerdos-iniciales.md), la [forma de trabajo de septiembre](historico/forma-de-trabajo.md) y el [registro de publicación del 9–13 de octubre](historico/publicacion-github.md) conservan el contexto anterior. Las instrucciones de trabajo actuales están en la guía breve y las issues. Los enlaces antiguos siguen funcionando mediante páginas de referencia.

La base técnica y demo inicial tuvieron asistencia de IA. Los documentos de diseño son propuestas para verificar; los ejemplos son sintéticos. La evidencia de implementación se agrega con los cambios reales del equipo.
