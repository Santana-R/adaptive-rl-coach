# A38 · Ejecución y despliegue reproducibles

**Tarea:** [#38](https://github.com/Santana-R/adaptive-rl-coach/issues/38) · **Responsable:** Omar Tadeo Gasca Deciga · **Revisor:** Roberto Santana Trujillo.

Esta entrega prepara el procedimiento técnico y registra las comprobaciones realizadas; no certifica la publicación de una versión ni el recorrido privado sin la revisión de otro integrante. No modifica el proyecto Supabase compartido ni crea un tag.

## 1. Entorno acordado para la comprobación

El entorno reproducible es **Docker Compose** con Supabase Auth/PostgreSQL y Ballchasing externos. La ejecución directa con Node es el respaldo local. Ambos sirven las mismas pantallas y API; no se necesita el servidor de desarrollo de `public/sitio` ni otro frontend.

| Componente | Versión / configuración |
| --- | --- |
| Node.js | 22.19.0 (`.nvmrc`, CI y Dockerfile) |
| Express | 5.3.0 (`package.json` y lockfile) |
| Supabase JS del servidor | 2.119.0 (`package.json` y lockfile) |
| Dependencias npm | `npm ci --ignore-scripts`, `package-lock.json` versión 3 |
| Contenedor | `node:22.19.0-bookworm-slim`, usuario `node` |
| Datos y Auth | Supabase provisionado; 30 tablas y migraciones/seeds del [instalador A38](../database/README.md#instalación-inicial-a38) |
| Replays | Ballchasing privado; volumen `replay-pending` para temporales, sujetos a TTL |

### Configuración de cada entorno

Copiar `.env.example` a `.env` sin sobrescribir una configuración existente. El responsable de cada servicio suministra las claves por separado. No se guardan valores reales en Git, capturas, reportes ni este documento.

| Variable | Uso |
| --- | --- |
| `SUPABASE_URL` | URL API del proyecto elegido, para navegador y servidor |
| `SUPABASE_ANON_KEY` | Clave pública `sb_publishable_` (o `anon` legacy) del mismo proyecto; se sirve desde Express |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada `sb_secret_` (o `service_role` legacy); solo servidor |
| `BALLCHASING_TOKEN` | Token privado para las consultas y cargas de replays; solo servidor |
| `HOST` / `PORT` | `127.0.0.1` / `3000` local; Compose usa `0.0.0.0:3000` internamente |
| `REPLAY_UPLOAD_MAX_MB` | 100 MB por formulario como máximo |
| `REPLAY_TEMP_TTL_MINUTES` | 60 minutos por defecto; máximo 1440 |
| `REPLAY_TEMP_DIR` | Carpeta privada opcional; Compose usa `/app/data/replays` |
| `ANALYSIS_DEMO_ENABLED` | `false`; no activar en el entorno privado de entrega |

El navegador carga `/sitio/js/supabase-config.js`, servido dinámicamente por Express. Sin URL y clave pública válidas el acceso permanece deshabilitado sin apuntar a una base diferente; el fallback estático no contiene claves ni proyecto. Una clave privada colocada por error en la variable pública no se sirve. Esto permite revisar contra un Supabase distinto sin tocar los archivos del frontend.

### Arranque desde copia limpia

Seguir el [README](../README.md) para instalar Node, copiar la configuración e instalar con lockfile. Si se usará Docker, tener Docker Engine y el plugin Compose disponibles (`docker version`, `docker compose version`); arrancar `docker compose up --build -d` y revisar `docker compose ps`. Usar `npm start` para el respaldo directo sin Docker. No arrancar ambos simultáneamente en el mismo puerto.

Entrar en [login](http://127.0.0.1:3000/sitio/html/login.html); comprobar [salud](http://127.0.0.1:3000/health). Si no se dispone de proveedores, las páginas/health siguen disponibles, pero las rutas privadas no funcionan.

Para conectar al proyecto compartido, verificar con David que estén aplicadas las migraciones. Si se prepara un Supabase vacío, primero ejecutar `database/instalar-a38.sql` según la guía de base de datos. El instalador no se ejecuta sobre la base activa.

## 2. Publicación del contenedor y respaldo

El mismo `Dockerfile` puede desplegarse en un host autorizado con Docker. Fijar el commit revisado, construir la imagen desde él y dejar `.env` fuera de la imagen. Si se publica en Internet, usar un dominio HTTPS gestionado por el entorno, un proxy que envíe las peticiones al puerto del contenedor y permita el tamaño de carga indicado arriba. Compose permanece limitado al loopback del host; no exponer la base ni el directorio de temporales. Conservar `/app/data` mediante el volumen. En plataformas que inyectan variables, mantener `HOST=0.0.0.0`, adaptar `PORT` y las comprobaciones de salud al puerto asignado.

La ruta de salud es `/health`. Es una comprobación de disponibilidad de Express, no una certificación de las conexiones externas. Tras publicar, configurar OAuth para la URL HTTPS y repetir el smoke y la matriz funcional. Registrar la URL real solo después de observarla funcionando.

Si la publicación falla, conservar `npm start` o el mismo Compose en el equipo local. La restauración de los datos y cuentas de Auth en otro Supabase requiere el respaldo privado y el procedimiento de [ejecución y recuperación](ejecucion-y-recuperacion.md); no extraer credenciales de la base ni usar un volcado con datos reales para una demo pública. No borrar el volumen para reiniciar la aplicación.

## 3. OAuth y conexiones

1. En Google Cloud, confirmar el cliente OAuth de aplicación web. Usar la Callback URL que muestra **el Supabase elegido** (normalmente `https://<proyecto>.supabase.co/auth/v1/callback`). Si el cliente está en modo de prueba, el revisor debe estar autorizado como usuario de prueba.
2. En Supabase Authentication → Providers, confirmar Email y Google. Configurar el ID y secreto de Google en el panel de Supabase, no en `.env` de Express. Revisar confirmación de correo y SMTP si aplica.
3. En Authentication → URL Configuration, establecer la URL de sitio del entorno principal y autorizar las URLs de retorno exactas. Para ejecución local con este README: `http://127.0.0.1:3000/sitio/html/perfil.html` (y el equivalente con `localhost` si se usa ese origen). Para el despliegue: `https://<dominio>/sitio/html/perfil.html`. La pantalla de acceso usa esa ruta en `redirectTo`.
4. Ejecutar `npm run check:connections`. Comprueba los tres proveedores sin cargar, borrar ni modificar replays o filas: ajustes públicos de Auth y Google habilitado, función de auditoría A39 en PostgreSQL y ping autenticado de Ballchasing. El resultado no acredita un login OAuth real.
5. Desde el navegador, iniciar sesión con correo y con Google (cuenta de prueba autorizada) y confirmar el retorno a Perfil. Cerrar sesión y repetir en ventana privada. Verificar el acceso del administrador con su cuenta de prueba y el del jugador sin privilegios.

Referencias: [claves de Supabase](https://supabase.com/docs/guides/getting-started/api-keys), [URLs de redirección](https://supabase.com/docs/guides/auth/redirect-urls), [prueba A08](prueba-auth.md), [API Ballchasing](https://ballchasing.com/doc/_api#ping).

## 4. Smoke test y aceptación del recorrido (P11/P12)

En una copia limpia, ejecutar:

```sh
npm ci --ignore-scripts
npm test
npm run smoke
node scripts/validar-heuristicas-a26.cjs
```

Con el mismo `.env` y el servidor objetivo arrancado:

```sh
npm run smoke -- http://127.0.0.1:3000
npm run check:connections
```

Cambiar la URL por la del entorno autorizado si se usa la publicación HTTPS. El smoke comprueba que se sirven las páginas y que las rutas protegidas rechazan acceso anónimo; no ejecuta acciones de jugador o administrador.

Usar exclusivamente cuentas de revisión y dos conjuntos de cinco replays propios, distintos, cronológicamente ordenados y de la misma modalidad competitiva; el bloque B debe ser posterior a A. No guardar los archivos, datos personales ni tokens en el PR. Registrar resultados observados de la siguiente matriz, sin sustituir partidas reales por los datos de demo:

| Paso | Validación esperada | Resultado observado de revisión |
| --- | --- | --- |
| 1 · Login | Correo y Google llevan a Perfil, sesión recuperable, logout correcto | Pendiente |
| 2 · Perfil | Guardar identidad de juego, modalidad, minutos y disponibilidad; volver a abrir y observar lo guardado | Pendiente |
| 3 · Bloque A | Cargar cinco replays propios; estados de proceso y bloque listo, sin acceso público | Pendiente |
| 4 · Análisis | Métricas de A con fuente, faltantes explícitos y prioridades explicables | Pendiente |
| 5 · Meta | Crear objetivo de rendimiento y consultar su historial | Pendiente |
| 6 · Plan | Generar/guardar versión vinculada a A y a la meta; consultar motivos y minutos | Pendiente |
| 7 · Sesión | Registrar una práctica sobre el ejercicio de la versión del plan, consultarla y corregirla | Pendiente |
| 8 · Bloque B | Cargar cinco partidas posteriores comparables, consultar comparación con A | Pendiente |
| 9 · Reportes | Revisar métricas, metas y sesiones; el plan anterior conserva su versión | Pendiente |
| 10 · Administración | Admin consulta usuarios y administra un ejercicio de prueba; un jugador no puede ejecutar acciones de admin | Pendiente |
| 11 · Permisos y recuperación | Dos jugadores no ven datos ajenos; reiniciar Compose sin borrar el volumen; comprobar respaldo Node | Pendiente |

Complementar con [P01–P12](pruebas-y-entrega.md), [resultados CRUD A39](resultados-crud.md) y [permisos verificados](permisos-verificados.md). No ejecutar scripts de limpieza/seed sobre cuentas de usuarios reales.

## 5. Registro de comprobación técnica · 22 de noviembre de 2026

Base de trabajo: `fce0eeddc18388e0b4189795ef5c82f34fef2ddb` (main), con cambios A38 de esta rama. Las comprobaciones se ejecutaron desde una copia limpia de Git; no se reutilizó un proyecto ejecutado por otro compañero. Node se verificó en la versión 22.19.0.

| Comprobación | Esperado | Observado |
| --- | --- | --- |
| Instalación desde lockfile | Dependencias instaladas sin modificar `package-lock.json` | `npm ci --ignore-scripts`: 74 paquetes; exit 0 (Node 22.19.0) |
| Suite Node | Cero fallos | 560/560 aprobadas, 0 fallos, 0 omitidas (incluye nuevas pruebas de configuración y orden de instalación A38) |
| Motor A26 | 43 escenarios sintéticos coherentes | 43/43; 0 fallos. No acredita calibración deportiva |
| `npm run smoke` | Salud, raíz, 14 archivos HTML y tres rutas protegidas | Correcto sin proveedores; también con configuración ficticia correspondiente a otro proyecto, sin contactar servicios |
| Instalación SQL local | Esquema/migraciones/seeds en el orden del instalador | PostgreSQL 18.7 en PGlite 0.5.17 temporal, Auth/roles simulados: 30 tablas con RLS, 18 consultas A39 con 0 inválidas, ningún permiso directo de cliente y protección ante reinstalación en base no vacía |
| Pruebas SQL | A21, A26 y persistencia de medidas; rollback | 3/3 correctas con dos perfiles sintéticos creados mediante el trigger; 0 bloques después de rollback |
| Docker | Imagen limpia, health, volumen conservado | Pendiente en esta rama: Docker no disponible en el entorno de trabajo. La [prueba CI del 18 de noviembre](estado-actual.md) acredita esos controles de la versión anterior |
| `npm run check:connections` | Auth/Google, A39 y Ballchasing accesibles | Se detuvo correctamente por falta de las variables privadas en esta copia. El proyecto del equipo no aparece entre los accesibles a esta conexión |
| Instalación en Supabase real y login OAuth | Otro proyecto vacío/autorizado, cuentas de prueba | Pendiente; el PostgreSQL temporal no reemplaza un Supabase provisionado |
| Recorrido P11/P12 con otro integrante y publicación HTTPS | Dos bloques reales, permisos, URL/evidencia | Pendiente de Roberto y configuración autorizada |

El contraste SQL temporal ejecutó cada `\ir` del instalador en el orden declarado, incluyendo los controles inicial y final; creó `auth.users` mínima, roles de prueba y privilegios iniciales simulados. Se usó únicamente un PostgreSQL temporal: no se modificó el proyecto compartido ni se restauraron cuentas reales. La herramienta de contraste no es una dependencia del producto.

## 6. Revisión asíncrona y tag

Roberto: revisar el PR, descargar su rama en una copia limpia y repetir el README sin instrucciones por fuera de este documento. Registrar por escrito fecha, commit exacto (`git rev-parse HEAD`), versiones `node --version`, `npm --version` y `docker compose version`, URL o arranque local, salida de las pruebas, resultado de OAuth/conexiones y cada fila de la matriz anterior. Adjuntar capturas anonimizadas del flujo y código de salida, no los tokens o replays.

La entrega es **parcial** mientras no se verifique el entorno elegido, el ciclo real y la instalación por el revisor. El PR debe enlazar `Refs #38`, no cerrar la issue. Si Roberto encuentra un bloqueo, anotarlo con el paso, error y resultado esperado.

Solo después de validar e integrar la versión final, acordar un nombre para el tag y crearlo en ese commit. Confirmar antes que la revisión corresponde a la versión final de `main` y que el tag no existe. Registrar el tag junto con el commit y la evidencia en la issue. No crear ahora un tag ni cerrar A38 automáticamente.
