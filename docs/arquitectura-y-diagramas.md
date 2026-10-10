# Arquitectura y diagramas

## Arquitectura del MVP
```mermaid
flowchart TD
  U["Jugador o administrador"] --> W["Interfaz web"]
  W --> S["Supabase Auth"]
  W --> E["API Express: autorización y validación"]
  E --> S
  E --> B["Ballchasing: cargas privadas y métricas"]
  E --> D["PostgreSQL: datos propios e historial"]
  B --> R["Motor de reglas y planes"]
  D --> R
  R --> D
  E --> W
```

Express valida identidad y permisos. El motor usa métricas con trazabilidad y reglas versionadas; no usa objetivos para cambiar el diagnóstico. La clave Ballchasing permanece en el servidor. Los datos se asocian al propietario y al bloque/plan correctos.

## Ciclo adaptativo y estados
```mermaid
flowchart TD
  P["Perfil e identidad"] --> U["Cinco replays privados"]
  U --> V{"¿Bloque válido y listo?"}
  V -->|No| E["Mostrar motivo, esperar o reintentar"]
  E --> U
  V -->|Sí| M["Métricas con unidades y faltantes"]
  M --> C{"¿Historial comparable?"}
  C -->|No| B["Línea base y explicación"]
  C -->|Sí| D["Comparar bloques cronológicos"]
  B --> R["Hasta tres prioridades con evidencia"]
  D --> R
  G["Objetivos y disponibilidad"] --> A["Generar nueva versión de plan"]
  R --> A
  K["Catálogo activo compatible"] --> A
  A --> Q{"¿Cobertura suficiente?"}
  Q -->|Sí| N["Plan completo"]
  Q -->|No| X["Plan parcial o vacío con motivo"]
  N --> S["Sesiones ligadas a la versión"]
  X --> S
  S --> H["Reportes separados"]
  D --> H
  H --> U
```

La primera medición establece línea base. Una sesión autorreportada evidencia entrenamiento; los cambios de rendimiento se calculan con replays comparables. Modificar meta, perfil o catálogo exige una nueva versión de plan. Las vistas de historial conservan evidencia anterior.

## Referencias existentes
[Modelo entidad-relación organizado](https://miro.com/app/board/uXjVEcCTPrc=/)

[System Map](https://miro.com/app/board/uXjVHnaZoh0=/)

[Plan de desarrollo en Miro](https://miro.com/app/board/uXjVEcA_AAE=/)

## Revisión de datos en S1
Auditar sesiones, historial de rango, evidencia de diagnóstico y snapshots completos; el esquema actual de ocho tablas es una base, no una confirmación de implementación. Esta release conserva intactos los tableros anteriores.
