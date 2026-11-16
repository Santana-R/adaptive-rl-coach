# Contrato inicial de API y datos

**Base propuesta v1.0, preparada el 13 de octubre.** Las rutas internas y nombres normalizados son decisiones de diseño para coordinar la implementación. No son respuestas reales de Ballchasing ni endpoints ya desplegados. A05 comprueba proveedor, A15/A24 verifican su mapeo al esquema existente y A08 implementa permisos; sus ajustes se registran aquí. A07 solo sigue las observaciones del documento y no bloquea estas tareas. A01 revisa que el equipo entienda esta base.


## Ajuste de integración · 1 de noviembre

La Fase 2 tiene 30 tablas; usar [diccionario vigente](diccionario-datos.md) y SQL. planning/examples contiene objetos sintéticos de interfaz, no filas SQL. planes representa una versión; no crear plan_versiones ni rank_history del borrador. A24 debe fijar el mapeo de identidad/versión en las rutas propuestas.

El recorrido Carga/Análisis/Plan usa fuente identificada y tendrá las interfaces definitivas que diseña y construye Luis según los bosquejos. El cascarón PROGSA es provisional. A06 sirve localhost; A05/A14 verifican entrada; Roberto expone Análisis y conecta sus datos en A19 compartida con Luis; A18/A24 generan/guardan Plan. El modo local de prueba no acredita permisos. Las rutas privadas requieren A08 antes de uso compartido. [Reparto de frontend](frontend-luis.md).

Las rutas siguientes son el contrato objetivo de la aplicación completa del 16, no endpoints acreditados por esta reorganización.

## Qué significa contrato en este proyecto
Luis necesita saber qué enviar y qué leer para pintar una pantalla. Tadeo necesita conocer las rutas y estados que sirve Express. David necesita saber qué relaciones se guardan. Roberto necesita métricas comparables para calcular diferencias y reglas. Los ejemplos en planning/examples permiten trabajar sin esperar que todos terminen; el cierre de las tareas de integración requiere datos reales.

## Convenciones preparadas
- Base interna `/api/v1`; JSON UTF-8 para datos. Éxito: `{ "data": ..., "meta": { "contract_version": "1.0" } }`. Error: el ejemplo error.json, con code estable, mensaje legible y detalles no sensibles.
- Identidades de usuario UUID; entidades de dominio mayormente bigint según Fase 2. Fijar serialización sin perder precisión y no asumir todos los IDs UUID. Los IDs `test-*` y `TEST_PLAYER_01` de los ejemplos son ficticios y no pasan una validación real de identidad Steam/Epic.
- Fechas de eventos ISO 8601 con zona, guardadas en UTC. Fechas de metas YYYY-MM-DD. Reportes from/to son días inclusivos en America/Monterrey; convertir a límites UTC `[inicio del primer día, inicio del día siguiente al último)`.
- Conteos enteros; porcentajes 0–100. Diferencia entre porcentajes en puntos porcentuales: 30 − 25 = +5 pp. Duración de entrenamiento en minutos; tiempos de replay en segundos tras verificar el proveedor.
- Ausencia `null` acompañada de motivo y cobertura. Cero representa un resultado medido. `shots=0` hace shooting_pct null con `zero_denominator`. Cinco replays válidos permiten bloque listo; una métrica opcional ausente conserva null.
- `contract_version` describe esta interfaz; `metrics_version` equivalencia de medición; `rules_version` heurísticas utilizadas; `version` del plan es su generación inmutable. No son intercambiables.
- El propietario procede de la sesión verificada. No se acepta user_id/role/status enviados por un jugador para autorizar operaciones. Estado y rol actuales se consultan en datos protegidos; suspensión se aplica en las siguientes operaciones protegidas.

## Sesión y permisos
Frontend usa Supabase Auth para correo/Google y envía el access token a Express en `Authorization: Bearer <access_token>`. Express verifica identidad mediante el mecanismo documentado de Supabase (por ejemplo getUser(token)), consulta rol/estado actuales y comprueba propietario. Registro público crea jugador. Las claves privadas de Supabase y Ballchasing viven en el servidor. RLS protege tablas expuestas; probar acceso A/B además del middleware. Nunca confiar en user_metadata para autorización.

## Interfaz por módulo
| Método | Ruta o servicio | Acceso | Responsable / tareas | Entrada → salida |
| --- | --- | --- | --- | --- |
| GET | /health | Público | Tadeo A06 | Sin datos privados → estado ok |
| Auth | Supabase Auth | Público/jugador | David A08;Luis A12 | Correo/Google y cierre de sesión; no inventar login Express |
| GET | /api/v1/me | Sesión activa | David A08 | Usuario de sesión → id, role, status |
| GET/PATCH | /api/v1/profile | Propietario | David A15;Luis A12 | profile |
| POST | /api/v1/blocks | Propietario | Tadeo A13;Luis A11 | multipart, files exactamente cinco → 202 block |
| GET | /api/v1/blocks | Propietario | David A15;Luis A11 | Lista de bloques propios con estado y fechas |
| GET | /api/v1/blocks/:blockId | Propietario | Tadeo A13;David A15 | block, progreso/reasons; sin JSON privado ajeno |
| POST | /api/v1/blocks/:blockId/retry | Propietario | Tadeo A13/A30 | Reintentar fallos recuperables → 202, mismo block_id |
| GET | /api/v1/blocks/:blockId/metrics | Propietario | Roberto A09;David A15 | metrics de bloque listo; no calcula diagnóstico con faltantes como cero |
| GET | /api/v1/blocks/:blockId/analysis?baseline_id=... | Propietario | Roberto A19 | analysis; omitir baseline_id para resolver anterior compatible |
| GET/POST/PATCH/DELETE | /api/v1/goals[/:goalId] | Propietario | David A16;Luis A20 | goal; DELETE archiva si está enlazado, respuesta indica efecto |
| POST | /api/v1/blocks/:blockId/plans | Propietario | Roberto A18;David A24 | goal_ids, availability_minutes → plan-version inicial |
| GET | /api/v1/plans/:planId | Propietario | David A24;Luis A27 | Plan y versión actual |
| GET | /api/v1/plans/:planId/versions[/:version] | Propietario | David A24;Luis A27 | Lista/detalle de snapshots históricos |
| POST | /api/v1/plans/:planId/versions | Propietario | Roberto A18;David A24 | Nuevo block_id/contexto/metas/minutos → versión nueva inmutable |
| GET/POST/PATCH/DELETE | /api/v1/sessions[/:sessionId] | Propietario | Tadeo A21;Luis A27 | session; corrección/eliminación recalcula entrenamiento |
| GET | /api/v1/reports?from=YYYY-MM-DD&to=YYYY-MM-DD | Propietario | Tadeo A22;Luis A28 | report con fuentes separadas y periodo |
| GET/POST | /api/v1/rank-history | Propietario | David A31 | rank_label, mode, recorded_at; source fijo self_reported |
| GET | /api/v1/exercises | Jugador activo/admin | David A23 | Jugador recibe activos; admin puede filtrar inactivos |
| POST/PATCH/DELETE | /api/v1/exercises[/:exerciseId] | Administrador | David A23/A32 | exercise; DELETE desactiva si está usado y conserva snapshot |
| GET | /api/v1/admin/users | Administrador | Tadeo A29;David A32 | Lista de usuarios con estado, sin tokens ni claves |
| PATCH | /api/v1/admin/users/:userId/status | Administrador | Tadeo A29;David A32 | status active/suspended → admin-user |

Las rutas agrupadas CRUD son: GET colección/detalle, POST colección, PATCH detalle, DELETE detalle. Roles y propietarios se verifican en cada operación. GET no crea ni modifica planes. Si cambia el diseño, actualizar contrato y consumidores en el mismo cambio.

## Carga y estados
POST blocks recibe `multipart/form-data` con cinco partes `files`, valida cantidad/extensión/contenido permitido y usa el perfil persistido. El servidor crea el bloque y responde 202 con block-pending. Guardar archivos temporalmente fuera de Git; tamaño máximo permitido y caducidad se configuran y verifican en A05/A13.

Transiciones preparadas: pending → processing → ready; processing puede terminar failed o invalid. Failed permite reintento solo si el motivo es recuperable; invalid requiere corregir archivos/contexto. Un bloque ready requiere los cinco replays válidos del jugador elegido. El reintento conserva block_id e IDs ya aceptados; el adaptador detecta duplicados y evita nuevas cargas innecesarias.

La API externa documenta autenticación con el token como Authorization, carga en `/v2/upload?visibility=private`, una parte `file`, 201 de éxito, 409 de duplicado y 429 de límite. Tadeo comprueba límites/permisos de la cuenta y mapea estados externos al contrato. 409 no autoriza borrar recursos ajenos. Reintentos transitorios son limitados y con espera; número/plazo finales se verifican en A05/A30.

## Métricas y comparación
Seleccionar jugador por plataforma e ID; jamás sumar estadísticas de todo el equipo como si fueran del usuario. La base propone shots/goals/assists/saves como conteos y shooting_pct derivado; boost_avg es candidato y se confirma en A05. Toda métrica adicional debe tener clave, unidad, extracción, fórmula, cobertura y versión documentadas.

shooting_pct = 100 × suma(goals) / suma(shots), sobre la misma cobertura válida; no promediar porcentajes de partidos sin pesos. Una media temporal necesita duración válida del jugador y cálculo documentado antes de usarla. En A05/A09 se verifica el denominador y los campos reales. No fabricar precisión ni unidades no comprobadas.

### Normalización implementada en A09

El [servicio de métricas](metricas-bloque.md) entrega goles, tiros, eficiencia y `play_duration_s`, con unidades, cobertura y exclusiones. Este último agrega `replay.play_duration` del proveedor: unidad `seconds`, alcance `scope: match` y `source_field: play_duration`. La documentación oficial define ese reloj sin las cuentas regresivas de saque; no se sustituye por `duration` ni se le añade `overtime_seconds`. Un faltante deja `null` con motivo, conservando las demás métricas calculables.

El nuevo campo es una extensión aditiva del [ejemplo de métricas](../planning/examples/metrics.json). A19 consume su unidad/alcance al construir la respuesta y la pantalla junto con Luis; A15 verifica el destino SQL. La duración de las partidas no se copia como tiempo individual de participación (`tiempo_jugado_s`) sin una fuente específica comprobada. El servicio interno conserva procedencia, contexto e IDs de replay; A19/A15 añadirán la asociación al `block_id` persistido y el sobre HTTP. Esta implementación no acredita un endpoint desplegado.

Comparar bloques propios, distintos, listos, con cinco partidas; identidad, modalidad, tipo y medición equivalentes. No hay replays repetidos entre ellos. Todas las partidas del actual deben ser posteriores al anterior para el seguimiento; si no, `CHRONOLOGY_INVALID`. Sin anterior compatible: `baseline`. Con anterior explícito incompatible: `not_comparable` y reason_codes; nunca mostrar deltas fabricados. Sin baseline_id se propone el anterior compatible más reciente y se registra cuál se usó.

Estados de comparison: baseline, comparable, not_comparable. Motivos posibles: NO_PREVIOUS_COMPATIBLE_BLOCK, PLAYER_MISMATCH, MODE_MISMATCH, MATCH_TYPE_MISMATCH, METRICS_VERSION_MISMATCH, CHRONOLOGY_INVALID, SHARED_REPLAYS. Cada métrica ausente queda null y explica motivo; no impide mostrar otras métricas válidas.

### Comparación implementada en A10

El [servicio de comparación](comparacion-bloques.md) conecta A14/A09 con `compareBlocks`. Recibe IDs de bloque serializados como cadenas y obtiene la ventana de fechas desde los cinco `replay.date` con zona confirmada; conserva los motivos de fechas ausentes o inválidas. A19/A15 también pueden entregar bloques ya normalizados con contexto, versión, procedencia, IDs y ventana comprobada.

La comparación devuelve `status`, `current_block_id`, `baseline_block_id`, `reason_codes` y `deltas`. Línea base o incompatibilidad conservan `deltas: null`. Para bloques compatibles, cada delta lleva sus valores anterior/actual, unidad, cobertura y motivo si no puede calcularse. Los porcentajes cambian en `percentage_points`; conteos y segundos conservan su unidad. No se compara una duración de partida con un tiempo individual ni se mezclan fuentes sintéticas/reales. Replays compartidos también se detectan mediante `rocket_league_id`/`match_guid` cuando están disponibles.

`resolveBaseline` elige el anterior compatible más reciente de un historial recibido, con descartes explicados y desempate determinista por ID. La consulta del historial propio, asociación SQL y exposición HTTP continúan en A15/A19; A10 no implementa esas rutas ni modifica las interfaces de Luis. Ver el [ejemplo de análisis actualizado](../planning/examples/analysis.json).

## Diagnóstico y plan
Prioridad: `{ priority_key, rule_id, score, evidence: { metric_key, value, unit, threshold, direction }, rules_version }`. Máximo tres. Los criterios definitivos proceden de las fichas acordadas con Roberto en A02 y se calibrarán en A26; los umbrales ilustrativos del prototipo no se trasladan automáticamente. A17 fija el orden por score descendente y después rule_id ascendente como texto. null no activa una regla que requiera ese valor.

### Reglas implementadas en A17

El [servicio de reglas](reglas-motor.md) reutiliza A14/A09 y devuelve métricas, `rules_version: mvp.rules.v1`, `priorities`, `evaluations` y limitaciones. El dominio también acepta las métricas ya normalizadas, sin requerir anterior ni fechas. Se publica una sola regla: `finalizacion-eficiencia`, clave de prioridad `shooting`, eficiencia ≤30 % y mínimo de 20/15/10 tiros por modalidad 1v1/2v2/3v3, con cobertura completa de cinco partidas. Estos parámetros son heurísticos sin calibración; score 1 es un peso técnico fijo.

Cada evaluación conserva `active`, `inactive` o `not_evaluable`, motivo, explicación y evidencia. Solo `active` produce prioridad; muestra insuficiente, faltantes o cero tiros no se convierten en ausencia de necesidad deportiva. Cada prioridad amplía el objeto base con `order`, `title`, `explanation` y `calibration_status`; la evidencia añade operador, conteos/cobertura, muestra, mínimo, contexto, fuente/versión e IDs de replay. Se conservan las claves existentes del catálogo y se actualiza el ejemplo de análisis. A18 consume las prioridades; A19 conecta la respuesta con la interfaz de Luis; A15/A24 resolverán persistencia y versionado SQL. Esta entrega no acredita un endpoint ni un diagnóstico guardado.

Generar plan usa diagnóstico, metas propias, disponibilidad y ejercicios activos compatibles/revisados. Campos de cobertura: complete/partial/empty, prioridades sin cubrir y reason_codes. Una falta de catálogo devuelve plan parcial/vacío explicado. El ejemplo exercise está inactivo porque su recurso es ficticio; A23 prepara el catálogo revisado.

Cada generación guarda plan_version_id, versión, bloque, reglas/métricas, diagnóstico, metas/perfil y snapshots de ejercicios con instrucciones/recurso/minutos. Actualizar metas, perfil o catálogo utilizado solicita nueva versión mediante POST; la anterior permanece inmutable. El tiempo asignado no supera disponibilidad. A18/A24 definen transacción consistente para plan/versión/ejercicios.

### Generador de dominio comprobado en A18 · integración pendiente

[generatePlan](generador-planes.md) recibe análisis de A09/A17, perfil/contexto, catálogo normalizado, disponibilidad, metas opcionales y número de propuesta. Selecciona ejercicios activos con revisión técnica, aplica la dificultad de A23 y reparte minutos conforme a `mvp.allocation.v1`, con mínimo cinco y redondeo determinista. Devuelve cobertura completa/parcial/vacía, motivos, exclusiones, versiones y snapshots de instrucciones/recursos/variante. Las metas compatibles se conservan; no crean prioridades ni modifican umbrales.

El adaptador A23/A24 deberá aportar `catalog_version`, `source`, actividad y `technical_review_status: verified`, requisitos, modalidades/plataformas y referencias de las versiones de ejercicio. Ese estado de revisión describe datos ya comprobados por la aplicación, no un permiso editable por el jugador ni una columna SQL nueva obligatoria. Rango declarado normalizado (`rank`, `rank_mode`, `rank_source`) y acceso confirmado a Workshop se obtienen del contexto; la identidad Steam no sustituye comprobar el acceso al mapa.

El [ejemplo de propuesta ejecutada](../planning/examples/plan-proposal.json) usa fixtures identificados y mantiene IDs de plan/versión en `null`; la asignación de IDs, secuencia histórica, transacción, ruta HTTP y consulta del catálogo real siguen pendientes de integración. El generador no implementa ni acredita las rutas de la tabla. Consumidores afectados: A23 prepara el catálogo, A24 guarda la propuesta y A27 muestra sus ejercicios/ajustes. El ejemplo anterior `plan-version.json` sigue siendo una forma de referencia para el futuro guardado, no una salida persistida ya comprobada.

## Objetivos, sesiones, reportes y administración
Meta: métrica soportada, valor/unidad compatibles, fecha opcional y estado active/archived. Si ya está vinculada a un plan, DELETE archiva y devuelve el efecto; si no, puede borrar. Perfil/meta/catálogo editados no reescriben snapshots.

Sesión: plan_version_id obligatorio, ejercicio perteneciente a esa versión cuando se elija, performed_at y duration_minutes positivos, notas opcionales. La duración es entrenamiento declarado. Corregir/eliminar recalcula totales de entrenamiento, nunca el rendimiento medido por replays. El ejemplo de sesión requiere una versión con ejercicio y no puede enlazarse al ejemplo de plan vacío.

Reportes contienen performance, training y rank separados. Cada serie declara fuente, período, unidad, muestra y exclusiones. Rango es declarado y fechado por modalidad; no se infiere automáticamente de MMR. No se añade una pantalla nueva: se muestra seguimiento en Análisis/Objetivos/Sesiones.

Admin consulta usuarios y cambia active/suspended; no se publica un formulario de creación de admin. Catálogo tiene CRUD con recursos revisados; desactivar un ejercicio usado conserva sus snapshots. Jugador puede consultar catálogo activo y sus datos propios; operaciones administrativas exigen admin.

## HTTP y errores para que el frontend sepa qué hacer
| HTTP | Código preparado | Acción |
| --- | --- | --- |
| 200/201 | Éxito | Mostrar datos; 201 recurso nuevo |
| 202 | Trabajo aceptado | Mostrar estado y consultar progreso con espera |
| 400 | REPLAY_COUNT_INVALID / INPUT_INVALID | Corregir formulario |
| 401 | AUTH_REQUIRED | Volver a login |
| 403 | ROLE_DENIED / USER_SUSPENDED | Mostrar acceso denegado |
| 404 | RESOURCE_NOT_FOUND | Recurso inexistente o privado ajeno, sin revelar su existencia |
| 409 | BLOCK_NOT_READY / DUPLICATE_REPLAY / VERSION_CONFLICT | Explicar conflicto; no recalcular sobre datos incompletos |
| 422 | BLOCK_INVALID / CONTEXT_INCOMPATIBLE | Mostrar motivo de validación |
| 429 | RATE_LIMITED | Esperar antes de reintentar |
| 502/503 | PROVIDER_UNAVAILABLE | Mostrar fallo temporal sin token ni respuesta privada |

## Ejemplos listos para consultar
- [planning/examples/profile.json](https://github.com/Santana-R/adaptive-rl-coach/blob/main/planning/examples/profile.json)
- [planning/examples/block-pending.json](https://github.com/Santana-R/adaptive-rl-coach/blob/main/planning/examples/block-pending.json)
- [planning/examples/block-ready.json](https://github.com/Santana-R/adaptive-rl-coach/blob/main/planning/examples/block-ready.json)
- [planning/examples/metrics.json](https://github.com/Santana-R/adaptive-rl-coach/blob/main/planning/examples/metrics.json)
- [planning/examples/analysis.json](https://github.com/Santana-R/adaptive-rl-coach/blob/main/planning/examples/analysis.json)
- [planning/examples/goal.json](https://github.com/Santana-R/adaptive-rl-coach/blob/main/planning/examples/goal.json)
- [planning/examples/exercise.json](https://github.com/Santana-R/adaptive-rl-coach/blob/main/planning/examples/exercise.json)
- [planning/examples/plan-version.json](https://github.com/Santana-R/adaptive-rl-coach/blob/main/planning/examples/plan-version.json)
- [planning/examples/plan-proposal.json](https://github.com/Santana-R/adaptive-rl-coach/blob/main/planning/examples/plan-proposal.json)
- [planning/examples/session.json](https://github.com/Santana-R/adaptive-rl-coach/blob/main/planning/examples/session.json)
- [planning/examples/report.json](https://github.com/Santana-R/adaptive-rl-coach/blob/main/planning/examples/report.json)
- [planning/examples/admin-user.json](https://github.com/Santana-R/adaptive-rl-coach/blob/main/planning/examples/admin-user.json)
- [planning/examples/error.json](https://github.com/Santana-R/adaptive-rl-coach/blob/main/planning/examples/error.json)

Todos son sintéticos. Los objetos de ejemplo son el contenido de data; envolverlos en el sobre de éxito al responder desde la API. error.json ya contiene su sobre. No se marcan tareas de integración como terminadas por mostrar estos datos.

## Suposiciones por comprobar sin detener la revisión A01
| Pendiente técnico | Tarea | Resultado que debe actualizar la base |
| --- | --- | --- |
| Identidad Epic/Steam, tipos, permisos, privacidad, métricas/unidades y límites de cuenta | A05/A14 | Mapeo de una respuesta real saneada y decisiones verificadas |
| Nombres SQL, relaciones, índices y snapshots | A15/A24 | Diccionario validado y migraciones |
| Google, token, rol/suspensión, RLS y propiedad | A08/A37 | Pruebas reales de permisos y sesión |
| Umbrales, desempate y limitaciones | A02/A17/A26 | Configuración de reglas versionada |
| Recursos compatibles y duración de ejercicios | A23 | Catálogo activo revisado |
| Alojamiento y ejecución limpia | A38 | README y entorno comprobados |

## Fuentes técnicas consultadas
- [API oficial de Ballchasing](https://ballchasing.com/doc/api): contrato externo de autenticación, carga privada, duplicados y límites. No confundirlo con las rutas internas propuestas.
- [Supabase Auth: getUser](https://supabase.com/docs/reference/javascript/auth-getuser) y [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): verificación de usuario y acceso por políticas. David/Tadeo comprueban configuración real durante la implementación.

Cada cambio al contrato indica motivo, consumidores afectados y fixture ajustado. La versión inicial ofrece una dirección concreta y conserva pendientes verificables.
