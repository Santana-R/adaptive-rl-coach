# Prueba de autenticación y permisos · A08

Procedimiento para comprobar A08 con cuentas reales de Supabase: dos jugadores (A y B), un administrador y una suspensión. Las pantallas de acceso las conecta Luis en A12; esta prueba pide los tokens directamente a Supabase Auth.

## Qué quedó implementado

| Pieza | Archivo | Comportamiento |
| --- | --- | --- |
| Registro → usuario de la aplicación | `database/migraciones/a08-auth.sql` | Cada cuenta nueva de Auth (correo o Google) crea su fila en `usuarios` como `jugador`/`activo`. El rol no se lee de los datos del registro. |
| Permisos del servidor | `database/migraciones/a08-permisos-servidor.sql` | Solo `service_role` (clave secreta de Express) lee y escribe las tablas. |
| Acceso directo desde el navegador | Sin permisos para `anon`/`authenticated`, RLS activado sin políticas | Con la clave pública no se puede leer ni escribir ninguna tabla (`permission denied`). |
| Validación del token | `src/middleware/auth.js` → `requireAuth` | Sin token o token inválido: **401 AUTH_REQUIRED**. Lee rol y estado de `usuarios` en cada petición; suspendido: **403 USER_SUSPENDED**. |
| Rol | `requireRole('admin')` | Para rutas de administración (A29/A32): otro rol responde **403 ROLE_DENIED**. |
| Propiedad por recurso | `assertOwner(req, ownerId)` y filtros por `req.user.id` | Las rutas de propietario nunca aceptan `user_id` del cliente. Un recurso ajeno responde **404 RESOURCE_NOT_FOUND**, igual que uno inexistente. |
| Rutas | `GET /api/v1/me`, `GET /api/v1/profile` | `me`: id, role, status. `profile`: solo el perfil propio (A15 añade PATCH). |

Pruebas automáticas con Supabase simulado: `npm test` (12 casos). Prueba real automatizada: `powershell -ExecutionPolicy Bypass -File scripts/prueba-auth.ps1` (14 casos; pide correos y contraseñas en la terminal y no los imprime). Copia en texto de la migración y sus comprobaciones: [a08-auth.md](../database/migraciones/a08-auth.md).

## Preparación (una vez)

1. **Migraciones.** Supabase → SQL Editor → pegar el **contenido** de `database/migraciones/a08-auth.sql` → Run; después el de `a08-permisos-servidor.sql` → Run. Ejecutar las comprobaciones del final de cada archivo y guardar captura.
2. **Variables.** Copiar `.env.example` a `.env` y rellenar `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_ANON_KEY` (Project Settings → API). No compartir `.env`.
3. **Correo.** Authentication → Providers → Email activado. Para la prueba, crear las cuentas desde Authentication → Users → *Add user* con *Auto Confirm User*.
4. **Servidor.** `npm start` → `http://127.0.0.1:3000`.

## Cuentas de prueba

Crear tres usuarios con correos de prueba (por ejemplo `jugador-a@…`, `jugador-b@…`, `admin@…`). Comprobar en SQL Editor que el trigger creó sus filas como jugador:

```sql
SELECT u.email, p.rol, p.estado
FROM auth.users u JOIN public.usuarios p ON p.id_usuario = u.id
ORDER BY u.created_at DESC;
```

Convertir solo la tercera cuenta en administrador y dar perfil sintético a A y B:

```sql
UPDATE public.usuarios SET rol = 'administrador'
WHERE id_usuario = (SELECT id FROM auth.users WHERE email = 'admin@…');

INSERT INTO public.perfiles (id_usuario, gamertag, plataforma, cuenta_juego_id, modalidad_principal, minutos_sesion, dias_semana, zona_horaria)
SELECT id, 'Prueba A', 'steam', 'TEST_A', '2v2', 30, 3, 'America/Monterrey' FROM auth.users WHERE email = 'jugador-a@…'
UNION ALL
SELECT id, 'Prueba B', 'epic', 'TEST_B', '3v3', 45, 4, 'America/Monterrey' FROM auth.users WHERE email = 'jugador-b@…';
```

## Obtener tokens (Git Bash)

```bash
set -a; source .env; set +a
token() {
  curl -s "$SUPABASE_URL/auth/v1/token?grant_type=password" \
    -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"$2\"}" | node -pe 'JSON.parse(require("fs").readFileSync(0)).access_token'
}
TA=$(token 'jugador-a@…' 'contraseña-a')
TB=$(token 'jugador-b@…' 'contraseña-b')
TADMIN=$(token 'admin@…' 'contraseña-admin')
API=http://127.0.0.1:3000/api/v1
```

Los tokens no se pegan en el PR ni en capturas.

## Casos y resultado esperado

| # | Comando | Esperado |
| --- | --- | --- |
| 1 | `curl -i $API/me` | 401 `AUTH_REQUIRED` |
| 2 | `curl -i $API/me -H "Authorization: Bearer token-falso"` | 401 `AUTH_REQUIRED` |
| 3 | `curl -s $API/me -H "Authorization: Bearer $TA"` | 200, `role: player`, `status: active` |
| 4 | `curl -s $API/me -H "Authorization: Bearer $TADMIN"` | 200, `role: admin` |
| 5 | `curl -s $API/profile -H "Authorization: Bearer $TA"` | Perfil `TEST_A` |
| 6 | `curl -s "$API/profile?user_id=<id de B>" -H "Authorization: Bearer $TA"` | Sigue devolviendo `TEST_A` |
| 7 | `curl -s $API/profile -H "Authorization: Bearer $TB"` | Perfil `TEST_B` |
| 8 | Acceso directo con clave pública: `curl -s "$SUPABASE_URL/rest/v1/perfiles?select=*" -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $TA"` | `permission denied` (o `[]`): A no lee ninguna fila, ni la de B |
| 9 | Igual que 8 con `usuarios` | `permission denied` (o `[]`) |
| 10 | Registro público pidiendo admin: `curl -s "$SUPABASE_URL/auth/v1/signup" -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" -d '{"email":"intento-admin@…","password":"…","data":{"rol":"administrador","role":"admin"}}'` y luego la consulta SQL de cuentas | La nueva cuenta queda `jugador` |
| 11 | SQL: `UPDATE public.usuarios SET estado='suspendido' WHERE id_usuario=(SELECT id FROM auth.users WHERE email='jugador-b@…');` y repetir 7 con `$TB` | 403 `USER_SUSPENDED` sin pedir token nuevo |
| 12 | Volver a `activo` y repetir 7 | 200 |
| 13 | Cerrar sesión: `curl -s -X POST "$SUPABASE_URL/auth/v1/logout" -H "apikey: $SUPABASE_ANON_KEY" -H "Authorization: Bearer $TA"` y repetir 3 | Registrar el resultado observado |

El caso 11 cambia el estado a mano. El registro en `cambios_estado_usuario` y la ruta de administración corresponden a A29/A32.

## Google

Configurado el 15 de noviembre de 2026. No requiere cambios de código: la cuenta pasa por el mismo trigger.

1. **Google Cloud** (proyecto `adaptive-rl-coach`) → Google Auth Platform:
   - Público **Externo**, estado de publicación **Prueba**. Solo pueden entrar los correos añadidos en *Usuarios de prueba*.
   - Cliente OAuth tipo **Aplicación web** llamado `Supabase`:
     - Origen de JavaScript: `http://127.0.0.1:3000`
     - URI de redireccionamiento: `https://<proyecto>.supabase.co/auth/v1/callback` (la *Callback URL* que muestra Supabase).
   - El secreto del cliente solo se muestra al crearlo. Se guarda fuera del repositorio.
2. **Supabase** → Authentication → Sign In / Providers → Google: activado, con Client ID y Client Secret.
3. **Supabase** → Authentication → URL Configuration:
   - Site URL: `http://127.0.0.1:3000`
   - Redirect URLs: `http://127.0.0.1:3000/**` (también `http://localhost:3000/**`).
4. **Prueba sin pantalla de acceso:** con `npm start` en marcha, abrir en incógnito `https://<proyecto>.supabase.co/auth/v1/authorize?provider=google&redirect_to=http://127.0.0.1:3000/` y entrar con un usuario de prueba de Google. A12 hará lo mismo con `signInWithOAuth({ provider: 'google' })`.
5. **Comprobación** en SQL Editor:

```sql
SELECT u.email, u.raw_app_meta_data->>'provider' AS proveedor, p.rol, p.estado
FROM auth.users u JOIN public.usuarios p ON p.id_usuario = u.id
ORDER BY u.created_at DESC LIMIT 5;
```

## Evidencia para el PR

Salida de `npm test`, captura de la comprobación de la migración y tabla de casos con el resultado observado (sin tokens, contraseñas ni correos reales).

## Resultado de la prueba real · 15 de noviembre de 2026

Ejecutada por David con `scripts/prueba-auth.ps1` contra el proyecto Supabase de desarrollo, con el servidor local (`npm start`), dos jugadores (A y B) y un administrador. Ambas migraciones aplicadas y comprobadas antes (trigger presente, 0 cuentas sin fila, 30 tablas con RLS, 0 políticas).

| Caso | Prueba | Esperado | Obtenido | OK |
| --- | --- | --- | --- | --- |
| — | Inicio de sesión por correo (A, B, admin) | Token emitido | Token emitido | Sí |
| 1 | Sin token | 401 AUTH_REQUIRED | 401 AUTH_REQUIRED | Sí |
| 2 | Token inválido | 401 AUTH_REQUIRED | 401 AUTH_REQUIRED | Sí |
| 3 | Jugador A `/me` | 200 player active | 200 player active | Sí |
| 4 | Administrador `/me` | 200 admin active | 200 admin active | Sí |
| 5 | A lee su perfil | 200 TEST_A | 200 TEST_A | Sí |
| 6 | A pide el perfil de B enviando su id | 200 TEST_A (id ignorado) | 200 TEST_A | Sí |
| 7 | B lee su perfil | 200 TEST_B | 200 TEST_B | Sí |
| 8 | Usuario sin perfil | 404 RESOURCE_NOT_FOUND | 404 RESOURCE_NOT_FOUND | Sí |
| 9 | A lee `perfiles` directo con clave pública | Sin acceso | 403 permission denied | Sí |
| 10 | A lee `usuarios` directo con clave pública | Sin acceso | 403 permission denied | Sí |
| 11 | Registro con `rol=administrador` en los datos del registro | jugador | jugador | Sí |
| 12 | B suspendido, mismo token | 403 USER_SUSPENDED | 403 USER_SUSPENDED | Sí |
| 13 | B reactivado | 200 | 200 | Sí |
| 14 | A cierra sesión y reutiliza el token | logout 204; después 401 | logout 204; después 401 AUTH_REQUIRED | Sí |

**14 de 14 casos correctos.** Después de la prueba: B quedó activo de nuevo, la cuenta temporal del caso 11 se borró y quedan 2 jugadores activos y 1 administrador.

Hallazgos durante la prueba:
- `service_role` no tenía `SELECT` en las tablas: Express respondía 503 con tokens válidos. Se corrigió con `a08-permisos-servidor.sql`.
- Supabase rechaza la clave secreta en peticiones con User-Agent de navegador ("Forbidden use of secret API key in browser"). PowerShell 5.1 se identifica como "Mozilla", por lo que el script usa un User-Agent propio. Express no está afectado.

### Inicio de sesión con Google · 15 de noviembre de 2026

Ejecutado por David con la configuración de la sección [Google](#google). Se usó un Gmail distinto de las tres cuentas de correo de la prueba, dado de alta como usuario de prueba en Google Auth Platform.

| Prueba | Esperado | Obtenido | OK |
| --- | --- | --- | --- |
| Entrar por `/auth/v1/authorize?provider=google` | Vuelve a `http://127.0.0.1:3000/` con sesión | Vuelve con sesión | Sí |
| Fila creada por el trigger | `proveedor=google`, `rol=jugador`, `estado=activo` | `google` / `jugador` / `activo` | Sí |

**Pendiente:** las pantallas de acceso de A12 (botón de Google con `signInWithOAuth`).
