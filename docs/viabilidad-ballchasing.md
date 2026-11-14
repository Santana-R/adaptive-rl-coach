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