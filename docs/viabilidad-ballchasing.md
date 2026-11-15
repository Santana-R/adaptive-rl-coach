# Prueba de viabilidad de Ballchasing

Tarea [A05 · Issue #5](https://github.com/Santana-R/adaptive-rl-coach/issues/5).

## Resultado del 14 de noviembre de 2026

Prueba ejecutada desde Node.js con el archivo de ejemplo
[002c.replay de Boxcars](https://github.com/nickbabcock/boxcars/blob/master/assets/replays/good/002c.replay).
El token se leyó desde el archivo `.env` local.

| Comprobación | Resultado observado |
| --- | --- |
| Conexión con la API | HTTP 200 |
| Carga con `visibility=private` | HTTP 201 y un identificador de replay |
| Consulta por identificador | HTTP 200, `status: ok` y `visibility: private` |
| Estadísticas del primer jugador naranja | 3 goles y 3 tiros |
| Identidad del primer jugador naranja | `id.platform`: `steam`; `id.id` presente |

## Extracto anonimizado

El primer jugador de `orange.players` devolvió estos campos en `stats.core`.
Ambos valores son conteos de una partida.

```json
{
  "goals": 3,
  "shots": 3
}

```

## Cómo repetir la prueba

1. Cargar el token desde `.env` y enviarlo en el encabezado `Authorization` de `GET https://ballchasing.com/api/`. Esperar HTTP 200.
2. Enviar un `.replay` autorizado en el campo `file` de un formulario `multipart/form-data` a `POST https://ballchasing.com/api/v2/upload?visibility=private`. Una carga nueva devuelve HTTP 201 y un `id`.
3. Consultar `GET https://ballchasing.com/api/replays/{id}`. Verificar `status: ok`, `visibility: private` y los campos `id.platform`, `id.id`, `stats.core.goals` y `stats.core.shots` del jugador elegido.

## Cuotas y manejo de fallos

La cuenta de prueba mostraba 10 cargas por cada 24 horas y 70 por cada 7 días. Ambas son ventanas móviles según la [ayuda de Ballchasing](https://ballchasing.com/doc/uploads).

- `401`: revisar el token antes de repetir la solicitud.
- `409`: Ballchasing devuelve el ID de la repetición existente. Para comprobar una carga nueva, usar otro replay autorizado.
- `429`: si se agotó la cuota, esperar a que se libere cupo. Para un límite temporal, respetar `Retry-After` cuando esté presente.
- `pending`: consultar de nuevo el mismo ID con una pausa entre intentos. Como punto de partida, se proponen hasta seis consultas separadas por cinco segundos.
- `failed`: registrar el fallo de procesamiento y detener las consultas de ese replay.
- Fallo de red o `5xx`: reintentar la consulta con espera y un máximo de intentos. Si ya se obtuvo un ID, usarlo para consultar el estado.

## Conclusión

La prueba confirmó la carga privada y la consulta de goles y tiros por jugador. El primer jugador naranja devolvió `steam` como plataforma y un identificador. Estos campos sirven de base para verificar la identidad del jugador en los cinco replays de A14.

## Referencia de duración para A09

A09 amplía la normalización usando `play_duration` del replay, documentado por Ballchasing en segundos y sin las cuentas regresivas de saque. Su disponibilidad se comprueba por archivo; si falta, queda `null` con motivo. Se identifica como duración de la partida (`scope: match`), separada de la participación individual. El mapeo, cobertura y pruebas están en [métricas del bloque](metricas-bloque.md).

Esta ampliación se verificó con la documentación oficial y fixtures sintéticos. No agrega una nueva prueba autenticada a la evidencia real de A05 descrita arriba. El significado/denominador de boost continúa pendiente de verificación antes de su normalización, conforme al alcance condicional de A09.

[Documentación de la API de Ballchasing](https://ballchasing.com/doc/api)
