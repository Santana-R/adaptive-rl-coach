# Carga privada y reintentos · A13

La pantalla de Replays usa la sesión de Supabase. El servidor toma el jugador y la modalidad del perfil guardado. Recibe cinco archivos distintos en el campo `files`, guarda el bloque y responde HTTP 202 con `block_id`. Ballchasing procesa cada archivo con visibilidad privada. El bloque queda listo cuando A14 confirma los cinco replays y se guardan sus métricas.

## Cómo probar

1. Completa la configuración de Supabase y `BALLCHASING_TOKEN` en tu `.env` local. La base debe tener aplicada la función de A15.
2. Ejecuta `npm test`. Las pruebas A13 incluyen archivos sintéticos y una interrupción simulada.
3. Ejecuta `npm start`, inicia sesión y completa tu perfil. Abre [Replays](http://127.0.0.1:3000/sitio/html/replays.html).
4. Carga cinco archivos autorizados que Ballchasing todavía no tenga. Deben coincidir con el jugador y la modalidad de tu perfil y tener el mismo tipo de partida.
5. Comprueba el HTTP 202 de `POST /api/v1/blocks` en Red y consulta **Estado** hasta ver **Listo** con cinco partidas válidas. Si aparece un fallo recuperable, pulsa **Reintentar** y comprueba que se conserva `block_id`. Los IDs privados se consultan en la respuesta del detalle autenticado.

El límite de la petición multipart es 100 MB por defecto. `REPLAY_UPLOAD_MAX_MB` lo puede reducir. `REPLAY_TEMP_TTL_MINUTES` controla la caducidad local y el valor predeterminado es 60 minutos. Una vez guardados todos los IDs, el servidor elimina los archivos temporales y el reintento puede continuar solo con los IDs. Si los temporales caducan y aún faltan IDs, el reintento indica que hay que crear otro bloque. El procesamiento está diseñado para una sola instancia de Express.

El servidor consulta hasta seis rondas y espera cinco segundos entre ellas. Para HTTP 429 respeta `Retry-After` cuando está presente. Conserva los IDs aceptados y descarta los duplicados externos. La limpieza se aplica a las copias temporales locales.
