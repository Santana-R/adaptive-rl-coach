# Fase 2 · avance preparado y revisión pendiente

Revisión académica: martes 3 de noviembre de 2026, según Roberto.

## Evidencia disponible

- Documento vigente: [2227084-207-FASES1-2-PWEB-LAB.pdf](https://chatgpt.com/library?file_id=libfile_5e4932c0149881919d876bee1c41b89c&account_id=personal), versión 3, 87 páginas. El enlace apunta al documento original del propietario; si el equipo no tiene acceso, Roberto debe facilitarle el PDF.
- Reúne UML y vistas por áreas, capturas de 30 tablas y explicación de relaciones/historial.
- El 1 de noviembre se verificaron en Supabase las 30 tablas con claves, restricciones, índices y RLS. La [instantánea SQL](../database/esquema-fase2.sql) incluye funciones/triggers necesarios, sin filas ni credenciales.
- [Diccionario](diccionario-datos.md) actualizado con nombres y columnas reales.

El PDF quedó enlazado; no se pudo copiar su archivo binario al repositorio en esta revisión. El SQL y el diccionario sí están versionados aquí.

## Qué falta comprobar o conectar

| Pendiente | Tarea |
| --- | --- |
| Revisión y observaciones del profesor. | A07, el 3 de noviembre. |
| Restauración en un entorno nuevo. | A07/A38. |
| Catálogo inicial utilizable por el motor. | A23. |
| Consultas/guardado de bloques, métricas, análisis y planes. | A15/A24. |
| Acceso y políticas de la aplicación. | A08/A12/A37. |
| Correcciones de revisión y paquete final. | A07/A40. |

Las tablas creadas cuentan como avance de Fase 2; las conexiones de la web y el motor siguen siendo entregas de implementación. La preparación asistida no se atribuye como trabajo individual de David ni de los demás.

## Para explicar el martes

1. Seguir usuarios/perfiles → bloques → replays/métricas → análisis/prioridades → planes/ejercicios.
2. Explicar una relación 1:n y una n:m resuelta con tabla intermedia.
3. Mostrar cómo objetivo_versiones y ejercicio_versiones conservan lo usado por el plan.
4. Aclarar que planes representa cada versión; no existe plan_versiones del antiguo borrador.
5. Explicar restricciones/triggers de cardinalidad y registrar las observaciones del profesor.
