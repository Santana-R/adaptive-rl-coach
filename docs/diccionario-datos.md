# Diccionario de datos preparado

Propuesta lógica v1; David la valida en A07 y la convierte en tablas/políticas durante A08/A15/A24/A31. No se han creado tablas ni aplicado migraciones con este documento. Se parte de usuarios, bloques, replays, métricas, objetivos, ejercicios, planes y plan_ejercicio del ERD inicial. Los nombres SQL definitivos pueden conservar los existentes si representan estas relaciones.

| Entidad | Para qué sirve | Campos iniciales | Integridad y acceso |
| --- | --- | --- | --- |
| usuarios/perfiles | Identidad propia, rol y estado | id = auth user UUID; role player/admin; status active/suspended; platform; player_id; mode; available_minutes | Dueño id; rol/estado administrados por operación protegida; no se acepta admin del registro público |
| bloques | Lote de cinco partidas de un jugador | id; user_id; context snapshot; status; reason_codes; metrics_version; first/last_match_at; created_at | FK usuario; contexto e identidad históricos; listo solo con cinco válidos |
| replays | Trazabilidad de cada archivo | id; block_id; user_id; provider_id; content_hash; status; played_at; raw_schema_version | Cinco relaciones por bloque listo; duplicados detectados por archivo/ID; acceso privado |
| metricas | Mediciones por replay y resumen de bloque | id; user_id; block_id; replay_id nullable; metrics_version; metric_key; value nullable; unit; coverage; missing_reason | No confundir promedio y total; conservar muestra y origen; equivalencia versionada |
| objetivos | Metas del jugador y archivo | id; user_id; metric_key; target_value; unit; due_date nullable; status; created_at; updated_at | Borrar si no está enlazado; si ya alimentó plan, archivar; snapshot protege historial |
| ejercicios | Catálogo administrado | id; title; priority_key; modes; platforms; duration_minutes; instructions; resource_url/code; active | CRUD admin; jugador lee activos; recursos revisados; desactivar no borra snapshots |
| planes | Identidad del plan y su versión actual | id; user_id; block_id; current_version; created_at | FK bloque propio; contenedor lógico de versiones |
| plan_versiones (ampliación propuesta) | Datos exactos de cada generación | id; plan_id; user_id; version; block_id; rules_version; metrics_version; diagnosis_snapshot; goals_snapshot; profile_snapshot; availability_minutes; coverage; created_at | Unique plan_id+version; inmutable; nueva versión al actualizar meta/perfil/catálogo usado |
| plan_ejercicio | Ejercicios fijados en una versión | id; plan_version_id; exercise_id; exercise_snapshot; assigned_minutes; priority_key; position | Snapshot incluye recurso, instrucciones y duración; sesión puede apuntar a esta fila |
| sesiones (ampliación propuesta) | Entrenamiento declarado sobre una versión | id; user_id; plan_version_id; plan_exercise_id nullable; performed_at; duration_minutes; notes | FK a versión exacta y ejercicio de esa versión; edición/eliminación recalcula entrenamiento |
| historial_rango (ampliación propuesta) | Rango declarado por modalidad y fecha | id; user_id; mode; rank_label; recorded_at; source = self_reported | Serie separada de replays; no equivale a MMR leído automáticamente |

## Relaciones que deben conservarse
Usuario → bloques → replays/métricas. Usuario → objetivos. Bloque → plan → versiones → ejercicios fijados. Versión → sesiones. Usuario → historial de rango declarado. Cada recurso privado conserva propietario y el servidor lo verifica. Catálogo y estado de usuarios requieren administrador.

## Ejemplo para comprobar A07
El plan P tiene v1, que incluye el ejercicio X con 10 minutos y recurso R. Se guarda una sesión S ligada a v1. Después cambia X o una meta y se genera v2. S sigue mostrando v1, 10 minutos y R; v2 tiene su propio snapshot. Una meta vinculada se archiva, conservando los snapshots anteriores.

## Decisiones preparadas y revisión pendiente
- UUID para identidades internas; índices por propietario/fecha y FK de consulta. Unicidad de plan+versión y de ID externo según proveedor. David verifica el detalle SQL.
- Timestamps en UTC, presentación con zona de Monterrey; tiempo de entrenamiento en minutos. Conteos enteros, porcentajes de 0 a 100 y valores ausentes null.
- Evidencia de reglas se guarda en diagnosis_snapshot de la versión, con regla/valor/unidad/umbral y versión. No hace falta una tabla de reglas nueva para empezar; A17/A26 mantienen configuración versionada.
- RLS en tablas expuestas y políticas de propiedad/rol acordes a cada entidad. Rol y suspensión proceden de datos protegidos del servidor; una clave privilegiada no sale al frontend.
- La política concreta de duplicados, identidad Epic, duración comparable y campos disponibles se verifica en A05/A14. El mapa ya permite comenzar a implementar consultas con fixtures.

David registra ajustes aquí y enlaza migraciones/ERD cuando existan. A01 no exige que David haya terminado las tablas para cerrar la revisión inicial.
