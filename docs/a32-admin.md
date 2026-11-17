# A32 · Panel admin y CRUD del catálogo

Las tres pantallas administrativas de los bosquejos de Luis (Resumen, Usuarios y Ejercicios) quedan conectadas a operaciones reales. El servidor exige rol administrador en cada operación; la comprobación de rol en la página solo decide qué se muestra.

## Archivos

| Archivo | Qué hace |
| --- | --- |
| `database/migraciones/a32-catalogo-admin.sql` | `a32_guardar_ejercicio` (alta o versión nueva, con plataformas, en una transacción), `a32_borrar_ejercicio` (desactiva si se usó en planes; si no, `eliminado_en`) y trigger que impide UPDATE en `ejercicio_versiones` y `ejercicio_plataforma`. Solo service_role. |
| `src/domain/exercise-admin.js` | Validación de la ficha. |
| `src/repositories/exercises-admin.js` | Detalle con historial, escrituras y activar/desactivar. |
| `src/routes/exercises.js` | `/api/v1/exercises`. El GET de A23 se movió aquí desde `app.js` sin cambiar su comportamiento. |
| `src/routes/admin-summary.js` | `GET /api/v1/admin/summary`. |
| `src/routes/admin-users.js` (A29) | Agrega correo y último acceso; impide que un admin cambie su propio estado. |
| `public/sitio/html/admin-resumen.html`, `admin-usuarios.html`, `admin-ejercicios.html` | Pantallas conectadas, con la estructura y los componentes de los bosquejos. |
| `public/sitio/js/admin-api.js` | Base común: sesión, comprobación de rol, peticiones, mensajes, confirmación en dos pasos y cierre de sesión. |
| `public/sitio/js/admin-resumen.js`, `admin-usuarios.js`, `admin-ejercicios.js` | Lógica de cada pantalla. |
| `public/sitio/css/index.css` | Bloque `A32`, limitado a `.admin`: campos, acciones, enlaces pendientes y tablas apiladas a 390 px. |
| `tests/admin-catalog.test.cjs` | 9 pruebas. |
| `scripts/prueba-a32.cjs` | Prueba real contra Supabase dev. |

Orden en el SQL Editor: seeds a23/a24, `a24-planes.sql`, `a16-fix-cardinalidad.sql` y `a32-catalogo-admin.sql` (se puede volver a ejecutar).

## API

Todas las rutas nuevas exigen sesión (A08), rol administrador y cuenta activa. Responden con `Cache-Control: no-store`. Un jugador recibe 403 aunque llame al endpoint directamente.

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/v1/exercises?include_inactive=true` | Catálogo con inactivos (A23). Cada ejercicio trae `active` y `technical_review_status`. |
| GET | `/api/v1/exercises/:id` | Estado, revisión, `ficha` vigente y `versions` (historial completo). |
| POST | `/api/v1/exercises` | Crea la versión 1 **inactiva**. 201 con `Location`. |
| PATCH | `/api/v1/exercises/:id` | Con campos de ficha: versión siguiente, el ejercicio vuelve a inactivo (`meta.version_created`). Con `{ "active": true\|false }` solo: activa o desactiva (`meta.status_changed`). No se mezclan. |
| DELETE | `/api/v1/exercises/:id` | `effect`: `deactivated` o `already_inactive` si alguna versión está en `plan_ejercicio`; `deleted` si nunca se usó. Incluye un mensaje que explica el efecto. |
| GET | `/api/v1/admin/summary` | Conteos de usuarios, catálogo, bloques por estado, versiones de plan y metas activas. `progress` queda `pending` (A22/A26). |
| GET | `/api/v1/admin/users` | (A29) Ahora agrega `email` y `last_sign_in_at` desde Supabase Auth. Si Auth no responde, la lista sigue sin esos campos y con `meta.auth_details: false`. |
| PATCH | `/api/v1/admin/users/:id/status` | (A29) Ahora rechaza con 409 `SELF_STATUS_CHANGE` que un admin cambie su propia cuenta. |

### Ficha del ejercicio

`title` (1–100), `priority_key` (`shooting`, `boost`, `defensive_review`, `movement`), `resource_type` (`custom_training` con código `XXXX-XXXX-XXXX-XXXX`; `steam_workshop` o `external_guide` con enlace https), `resource`, `purpose`, `instructions` (1–20 pasos), `success_criterion`, `difficulty_base` (1–5), `reference_duration_minutes` (5–120) y `platforms` (`epic`, `steam`; Workshop solo `steam`). Cualquier otro campo responde 400.

### Activación y efecto en planes

- **Activar exige revisión:** solo se activa un ejercicio con `technical_review_status: verified`, es decir, cuando la versión vigente coincide con una ficha revisada (`planning/catalogo-ejercicios.v1.json`) y verificada (`planning/catalogo-verificacion.v1.json`), el mismo criterio que usa el generador. Si no, responde 409 `EXERCISE_NOT_VERIFIED`.
- **Lo nuevo o editado queda en borrador:** un ejercicio creado o editado desde el panel queda **inactivo** y no entra en planes nuevos. Para publicarlo hay que agregar esa versión a las fichas revisadas y registrar su verificación (proceso de A23).
- **Desactivar** saca el ejercicio de los planes nuevos (comprobado: deja de aparecer en la propuesta de plan).
- **Planes ya guardados:** `plan_ejercicio` apunta a la versión exacta. Editar crea otra versión, y desactivar o borrar no modifica esos planes ni sus snapshots.

## Pantallas

- **Resumen:** cuatro tarjetas (usuarios activos, ejercicios ofrecidos, bloques por corregir y planes guardados), una tarjeta de catálogo y otra de apoyo operativo. "Progreso de los jugadores" aparece como **Pendiente**, sin cifras inventadas.
- **Usuarios:** búsqueda por nombre o correo, filtros de rol y estado, y Suspender/Activar con confirmación en dos clics (el botón pasa a "¿Confirmar…?" durante 5 s; no se usan ventanas del navegador). La cuenta propia muestra "Tu cuenta" en lugar del botón.
- **Ejercicios:** lista con filtros (prioridad, plataforma y estado); formulario de alta y edición con historial de versiones; Activar (solo si está revisado; si no, "Requiere revisión"), Desactivar y Eliminar con confirmación. Los errores del servidor se muestran junto al botón Guardar.
- **Común a las tres:** sin sesión se va a `login.html`; con una cuenta que no es de admin, la pantalla muestra "Acceso solo para administradores"; "Cerrar sesión" funciona. Los enlaces Progreso y Errores del bosquejo quedan deshabilitados (pendientes).

## Comprobación

- `npm test`: **475 aprobadas, 0 fallidas** (9 nuevas de A32; las de A23 y A29 siguen pasando).
- Prueba real (`node --env-file=.env scripts/prueba-a32.cjs`): **13/13** en Supabase dev, 17 de noviembre de 2026.

| # | Prueba | Esperado | Obtenido | OK |
| --- | --- | --- | --- | --- |
| 1 | Ejercicio real 2 de partida | activo y revisado | activo, verified | Sí |
| 2 | Crear ejercicio | versión 1, inactivo, sin revisión | versión 1, inactivo, not_in_reviewed_content | Sí |
| 3 | Activar sin revisión | 409 EXERCISE_NOT_VERIFIED | 409 EXERCISE_NOT_VERIFIED | Sí |
| 4 | El jugador no lo recibe | fuera del catálogo activo | fuera | Sí |
| 5 | Editar crea versión 2 | versión 2, 15 min, otra fila | versión 2, 15 min | Sí |
| 6 | Versión 1 intacta | idéntica | idéntica | Sí |
| 7 | UPDATE de una versión | rechazado (55000) | 55000 | Sí |
| 8 | Desactivar y reactivar el ejercicio 2 | sale del catálogo y vuelve | sale / vuelve | Sí |
| 9 | Plan sintético con el ejercicio de prueba | guardado | guardado | Sí |
| 10 | Borrar ejercicio usado (inactivo) | already_inactive, no se elimina, 2 versiones | already_inactive, 2 versiones | Sí |
| 11 | El plan conserva la versión exacta | misma versión, 15 min | misma versión, 15 min | Sí |
| 12 | Borrar ejercicio sin uso | deleted y ya no aparece | deleted, no aparece | Sí |
| 13 | Ejercicio real 2 al terminar | activo y revisado | activo, verified | Sí |

El script borra lo que crea y deja el ejercicio 2 como estaba. Una consulta posterior confirmó los 3 ejercicios activos y 0 planes.

### Recorrido en el navegador · 17 de noviembre de 2026

Servidor local (`npm start`) y sesión real de administrador con Google:

- Sin sesión, `admin-resumen.html` redirige a `login.html`.
- Resumen: cifras reales (7 usuarios activos, 3 de 3 ejercicios ofrecidos, 2 bloques por corregir, 0 planes) y progreso pendiente.
- Usuarios: 7 usuarios con correo y último acceso; la cuenta propia sin botón. El primer clic en "Suspender" muestra "¿Confirmar suspensión?" y vuelve solo a los 5 s; no se suspendió a nadie.
- Ejercicios: el formulario de edición carga la ficha y el historial. Un alta con código inválido muestra el error del servidor junto a Guardar; corregida, se guarda como "Inactivo · Sin revisión" con "Requiere revisión" en lugar de Activar. Eliminar (dos clics) responde "nunca se usó en un plan y se eliminó del catálogo". El ejercicio de prueba se borró después de la base.
- 390 px: las tres pantallas sin desbordamiento horizontal (`scrollWidth` 371 en un ancho de 387); el menú pasa a franja superior, los filtros se apilan y cada fila se muestra como tarjeta con etiquetas. La consola no muestra errores.

Pendiente para cerrar la ficha: la revisión frontend de Luis en el PR (consistencia visual en escritorio y 390 px). La comprobación de un jugador sin acceso en el navegador está cubierta por las pruebas automáticas (403 en cada endpoint) y por `guard()` en las páginas.
