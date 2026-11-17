# Seguridad y privacidad funcional · A37

## Matriz de autorización

| Sesión o entrada | Petición | Resultado observado |
| --- | --- | --- |
| Sin sesión o con token inválido | `GET /api/v1/blocks/:id/analysis` | `401 AUTH_REQUIRED`. |
| Jugador A, dueño del bloque | `GET /api/v1/blocks/:id/analysis` | `200 OK` con el análisis propio y `Cache-Control: no-store`. |
| Jugador B, bloque ajeno o inexistente | `GET /api/v1/blocks/:id/analysis` | Ambos casos devuelven `404 RESOURCE_NOT_FOUND` sin datos del bloque. |
| Jugador B, historial | `GET /api/v1/blocks` | `200 OK`. El listado excluye el bloque de A. |
| Administrador activo | `GET /api/v1/admin/users` | `200 OK` con `Cache-Control: no-store`. |
| Jugador activo | `GET /api/v1/admin/users` | `403 ROLE_DENIED`. |
| Jugador B, antes y después de suspenderlo | `GET /api/v1/me` | `200 OK` al inicio, `403 USER_SUSPENDED` durante la suspensión y `200 OK` al reactivarlo con la misma sesión. |
| Jugador con un solo replay | `POST /api/v1/blocks` | `400 REPLAY_COUNT_INVALID`. |
| Jugador con cinco archivos `.txt` | `POST /api/v1/blocks` | `422 INPUT_INVALID`. |

## Credenciales y registro de errores

- `git check-ignore .env` confirmó que Git ignora el archivo. `git ls-files -- .env` devolvió una salida vacía.
- Se buscaron los valores de `SUPABASE_SERVICE_ROLE_KEY` y `BALLCHASING_TOKEN` con `git grep -l -F -f - -- .`, pasando los valores por la entrada estándar. La búsqueda no encontró coincidencias en los archivos rastreados del árbol de trabajo, incluido `public/`.
- El cliente web usa la URL de Supabase y la clave publicable. Las dos credenciales privadas se cargan en el entorno del servidor.
- Se cambió el manejador de errores de `src/app.js` para registrar un mensaje fijo. Una prueba en `tests/auth.test.cjs` simula un fallo de base de datos y verifica que tanto la respuesta `500 INTERNAL_ERROR` como el registro omitan el dato privado ficticio.

## Evidencia y reproducción

- Sesiones reales de Supabase y bloques existentes. El [reporte de análisis privado](../planning/evidence/a37-analisis-privado.json) registra 14 comprobaciones aprobadas y 0 fallidas.
- Para repetir el reporte, ejecutar `node --env-file=.env scripts/prueba-a19.cjs --report planning/evidence/a37-analisis-privado.json` con dos cuentas de prueba y un bloque listo de la cuenta A. Usar una ruta de salida libre si el reporte ya existe.
- Las pruebas de administración y carga se hicieron contra el servidor de desarrollo. Para repetir la verificación del registro de errores, ejecutar `node --test tests/auth.test.cjs`.