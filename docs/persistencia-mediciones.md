# Medidas del proveedor conservadas por replay

Actualización del 18 de noviembre de 2026. No cambia los umbrales ni las versiones de las reglas deportivas.

`processReplayBlock` valida al jugador y extrae las métricas de los cinco resultados privados de Ballchasing. Además de los conteos básicos, guarda en `metricas_replay.mediciones_proveedor` una instantánea JSONB versionada `ballchasing.player.v1`. Contiene solo estas medidas normalizadas del jugador, con su ID de replay:

| Medida | Campo original y unidad |
| --- | --- |
| Duración original de la partida | `play_duration`, segundos, alcance `match` |
| Tiempo con exactamente cero boost | `time_zero_boost`, segundos del jugador |
| Porcentaje con exactamente cero boost | `percent_zero_boost`, porcentaje del jugador |
| Goles recibidos como último defensor | `goals_against_while_last_defender`, conteo |
| Exposición como jugador más atrasado | `time_most_back` y `percent_most_back` |
| Tiempo delante del balón | `percent_infront_ball`, porcentaje |
| Distancia media a compañeros | `avg_distance_to_mates`, unidades del juego |

Cada medida conserva `source_field`, `scope`, `unit`, `value` y `missing_reason`. Se guardan ceros originales y duraciones fraccionales sin redondear. No se guarda el detalle completo de los otros jugadores ni las credenciales del proveedor.

Los repositorios incluyen la columna en consulta, mapeo, upsert y en el RPC `a15_guardar_bloque`. `fromStoredBlock` comprueba proveedor, versión e identidad del replay; los lectores del dominio vuelven a validar unidades, base temporal, valores y ausencias. Un porcentaje no se deduce de segundos; la duración no se reconstruye de `archivos_replay.duracion_s` ni del tiempo de participación del jugador.

La migración aditiva `database/migraciones/20261118200550_persistir_mediciones_proveedor.sql` utiliza el identificador devuelto por Supabase al registrarla. Añade un campo nullable y actualiza el RPC conservando su acceso exclusivo para el servidor. Los diez registros históricos quedan con la nueva columna en NULL. Reanalizarlos no recupera estadísticas que nunca se guardaron; para volver a consultar Ballchasing se necesita otro trabajo explícito.

Las pruebas de `tests/provider-persistence.test.cjs` recorren los repositorios reales con transporte simulado. Comparan activación, orden y evidencia con el cálculo directo, y cubren ceros, fracciones, faltantes, unidades incompatibles y separación por propietario. `database/tests/mediciones-proveedor.sql` recorre el RPC real con cinco registros sintéticos, verifica el rechazo de JSON incompleto y revierte la transacción.

Estas comprobaciones no sustituyen una carga nueva de cinco archivos ranked reales ni una validación deportiva de las heurísticas. El contexto de partidas casuales sigue sin habilitar automáticamente boost o cobertura defensiva.
