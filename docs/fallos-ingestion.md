# Fallos de ingestión y reintentos · A30

## Matriz de fallos

| Caso | Resultado | Cómo continuar |
| --- | --- | --- |
| Un replay sigue pendiente | Se hacen hasta seis rondas con pausas de cinco segundos. Al agotarlas, el replay queda con `PROCESSING_TIMEOUT` y el bloque queda `failed`. Se conservan los IDs guardados. | Reintentar el mismo bloque. |
| Error temporal `503` al consultar un replay | Se registra `STATUS_UNAVAILABLE` y se vuelve a consultar ese replay en la siguiente ronda. Si se recupera y los cinco son válidos, el bloque queda `ready`. | Consultar el estado del bloque. |
| Límite `429` después de una carga parcial | Se registra `RATE_LIMITED`. El bloque queda `failed` y conserva los IDs ya aceptados. | Esperar el plazo indicado por `Retry-After` y reintentar. Solo se cargan los archivos que siguen sin ID. |
| Replay duplicado en Ballchasing (`409`) | El bloque queda `invalid` con `DUPLICATE_REPLAY`. El ID del duplicado queda fuera del bloque y se limpian los temporales de ese lote. | Usar un lote con archivos que no estén duplicados. |

## Cómo retomar un bloque

En la pantalla Replays, abre **Estado** para revisar el motivo del fallo. Cuando
aparezca **Reintentar**, úsalo en la fila del bloque original. La API responde
`202` con el mismo `block_id`. El estado actualizado se consulta en
`GET /api/v1/blocks/:blockId`.

Si los cinco IDs ya están guardados, el reintento continúa con las consultas.
Si todavía faltan IDs, necesita las copias temporales. Al caducar esas copias,
el reintento devuelve `REPLAY_FILES_EXPIRED` y se requiere un lote nuevo.

## Privacidad y limpieza

Las cargas a Ballchasing se hacen con `visibility=private`. El bloque pasa a
`ready` cuando los cinco replays son privados y válidos para el jugador.
El reintento se restringe al propietario del bloque.

La limpieza borra únicamente copias temporales locales. El `409` de Ballchasing
no autoriza borrar el replay externo. Los temporales pendientes caducan después
de 60 minutos por defecto, según `REPLAY_TEMP_TTL_MINUTES`.

## Evidencia

- `node --test tests/ingestion.test.cjs` comprueba espera prolongada,
  recuperación tras `503`, reintento de carga parcial, privacidad y duplicados.
- En la prueba local de A13, el bloque 8 conservó su ID al reintentar y llegó
  a Listo con cinco replays válidos.