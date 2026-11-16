# Propuesta de entrenamiento por HTTP · A18

El generador ya recibe los datos de los repositorios A15/A23 desde una ruta protegida. Preparado por Roberto con asistencia de IA bajo su Release, conservando los repositorios de David y las interfaces de Luis. La respuesta es una **propuesta sin guardar**; A24 conserva las versiones y A27 las muestra en Plan.

## Recorrido

| Paso | Código | Qué comprueba |
| --- | --- | --- |
| Sesión | A08, `requireAuth` / `requireRole` | Usuario verificado, rol y estado actuales. |
| Bloque propio | A15 y `src/services/stored-block.js` | Consulta con dueño, cinco posiciones, replays listos, identidad/modalidad/tipo e IDs/hash sin repetición. |
| Métricas y diagnóstico | `calculateBlockMetrics` → `analyzeBlock` | Recalcula goles/tiros desde los cinco registros del jugador y evalúa A17. |
| Perfil/catálogo/metas | Repositorios existentes y `src/repositories/plan-goals.js` | Perfil propio, recursos activos y verificados, metas seleccionadas del usuario. |
| Propuesta | `src/routes/plans.js` → `generatePlan` | Disponibilidad, compatibilidad, nivel, cobertura y snapshots. |

`createApp` conecta por defecto el adaptador de A15 cuando no se proporciona otro `analysisRepository`. La misma conexión alimenta `GET /api/v1/blocks/:blockId/analysis`; la demo local separada se conserva.

## Solicitud y respuesta

```http
POST /api/v1/blocks/:blockId/plan-proposal
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "availability_minutes": 20,
  "goal_ids": [],
  "workshop_access": true,
  "rank": "diamond"
}
```

La ruta obtiene análisis, catálogo, identidad y perfil desde el servidor. No admite objetos `analysis`, `catalog`, `profile`, `user_id` ni `version` del navegador. Campos desconocidos o preferencias inválidas responden 400.

| Campo | Comportamiento |
| --- | --- |
| `availability_minutes` | Opcional. Si falta, usa los minutos del perfil; si viene, tiene precedencia, incluido cero. Entero 0–32767. Menos de cinco produce propuesta vacía explicada. |
| `goal_ids` | Opcional, por defecto `[]`. Hasta 20 IDs como cadenas, únicos. Consulta solo metas del propietario; una ajena/inexistente devuelve el mismo 404. |
| `workshop_access` | Declaración de capacidad para esta sesión, booleano; por defecto falso. Steam por sí solo no habilita CoCo. Epic conserva solo los paquetes compatibles. |
| `rank` | Rango opcional declarado para la modalidad del bloque: `bronze`, `silver`, `gold`, `platinum`, `diamond`, `champion`, `grand_champion`, `supersonic_legend`. Sin rango usa base/Easy. No se deduce MMR ni se guarda historial de rango. |
| `coco_variant_key` | Preferencia opcional entre las cinco variantes publicadas. A18 conserva las restricciones de dificultad y Survival. |

El perfil aporta plataforma e identidad; deben coincidir con el bloque. La modalidad proviene del bloque analizado, aunque la modalidad principal del perfil sea otra. Rango/Workshop son preferencias autorreportadas y se identifican mediante `meta.session_preferences_source`; no cambian permisos ni métricas.

La respuesta es HTTP **200**, `{data,meta}`, con `meta.persisted: false`. `data` contiene instrucciones, recurso, dificultad, minutos, cobertura completa/parcial/vacía y snapshots. IDs de planes quedan `null`; las referencias a versiones de ejercicios consultadas se conservan. Cada llamada produce una propuesta independiente, con `version: 1` de dominio; la ruta no crea secuencias de versiones persistidas. A24 las asignará al guardar.

Ejemplo ejecutado: [plan-proposal-api.json](../planning/examples/plan-proposal-api.json). Con la prioridad de finalización y 20 minutos, Steam con acceso declarado a Workshop produce **10 + 5 + 5**; sin ese acceso, **15 + 5**. Catálogo insuficiente o sin ejercicios elegibles devuelve cobertura parcial/vacía, sin forzar recursos.

Metas: se toma la versión activada más reciente del objetivo propio. Esta rutina admite `shooting_pct`, unidad `percent`, comparador `>` / `>=`; otro tipo o una meta sin versión activa responde 422 `GOAL_UNSUPPORTED`. Las archivadas o de otra modalidad no se usan para inventar prioridades. Las metas compatibles quedan en snapshots y no modifican el umbral deportivo ni el reparto. El CRUD completo de metas continúa en A16/A20.

Errores: 401 sin sesión, 403 suspendido/rol indebido, 404 bloque/meta ajena o inexistente, 409 bloque pendiente, 422 bloque inválido/perfil ausente o incompatible/meta no admitida y 503 consulta no disponible. Las respuestas no incluyen detalles privados de errores SQL y usan `Cache-Control: no-store`.

## Traducción de A15 al motor

El adaptador toma `replays[].metrics.goals/shots`, la identidad de `player`, contexto/fecha/hash de `file` y el ID externo cuando exista. Recalcula totales con A09 y conserva cobertura/null. No usa `block.metrics` como relleno si falta una estadística por replay. Un hash SHA-256 puede identificar el archivo sin ID externo; además detecta un mismo archivo entre bloques aunque cambie ese ID.

El origen se etiqueta `stored_replay_metrics`: expresa lectura de estadísticas guardadas, sin afirmar que se haya acreditado su proveedor original. Para ese origen `meta.synthetic` es `null`: la base puede contener replays reales o datos controlados y no conserva esa distinción. La demo mantiene `synthetic: true`.

**Duración:** ni `file.duration_s` ni `player.time_played_s` ni el agregado SQL identifican inequívocamente `play_duration`. La duración del motor queda `null`, con `duration_basis_unverified`, hasta conservar esa procedencia en la ingestión. No se transforma tiempo individual en duración de partida. Goles/tiros siguen disponibles para la regla. Fechas ausentes impiden comparación temporal, sin sustituirlas por fechas de creación/subida.

## Comprobación realizada · 16 de noviembre de 2026

- Node.js v22.19.0, `npm test`: **334 aprobadas, cero fallidas** (37 nuevas sobre las 297 anteriores).
- Casos nuevos: traducción A15, rechazo de posiciones/identidades/contextos/replays inválidos y duplicados, faltantes/fechas, hash compartido, recorrido de repositorios → Análisis/propuesta, catálogo completo/parcial/vacío, minutos, sesión A/B/admin/suspendido, perfil y metas/versiones propias. Autenticación y Supabase se simulan en esas pruebas; se ejecutan los repositorios, motor y HTTP reales.
- Consulta real a Supabase dev: tres ejercicios activos; dos perfiles de desarrollo `TEST*`; inicialmente cero bloques/metas. `scripts/prueba-a18.sql` creó y leyó un bloque sintético de cinco partidas en una transacción, junto con el perfil controlado y catálogo real; terminó con `ROLLBACK`. Una consulta posterior confirmó **cero bloques y cero replays de prueba restantes**. Las secuencias de IDs pueden avanzar aunque la transacción se revierta.
- Se ejecutó `scripts/prueba-a18-captura.cjs` con esas filas capturadas y dueño anonimizado: HTTP 200, 30 %, reparto 10/5/5 o 15/5, IDs de plan nulos, usuario B → 404 y duración no acreditada → null. Este segundo paso usa respuestas de base capturadas y autenticación simulada; **no acredita un inicio de sesión real ni una conexión HTTP → Supabase en vivo**. El entorno local no dispone de `.env` del servidor; la consulta SQL se ejecutó mediante la conexión del proyecto.

Para repetir: ejecutar el SQL de prueba en desarrollo, guardar el objeto `fixture` como JSON y ejecutar:

```sh
node scripts/prueba-a18-captura.cjs captura.json
npm test
```

Una aplicación configurada con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` usa las consultas normales de A15/A23; la clave privada permanece solo en el servidor. No se modificaron esquema, permisos, perfiles, catálogo ni planes remotos con este cambio. La comprobación con sesión real y el recorrido desde cinco archivos autorizados continúa en A19/A13/A37. La pantalla Plan no se conecta en esta entrega.
