# Adaptive RL Coach

Cinco partidas de Rocket League → métricas → prioridades explicables → plan → práctica y comparación posterior.

Aplicación académica UANL–FIME con Express, frontend HTML/JavaScript, Supabase Auth/PostgreSQL y Ballchasing. El motor utiliza reglas deterministas; los criterios deportivos son heurísticas provisionales.

## Estado actual · 18 de noviembre de 2026

El recorrido implementado incluye acceso, perfil, carga privada de cinco replays, procesamiento, métricas persistidas, análisis, versiones del plan, objetivos, sesiones e informes. El administrador consulta usuarios y mantiene el catálogo de ejercicios.

La integración conserva por replay el porcentaje y los segundos con cero boost, las medidas originales de positioning y `play_duration`, con unidades, fuente y motivos de ausencia. El motor vuelve a leer esas medidas desde Supabase. Los bloques anteriores a esta corrección conservan sus faltantes; no se completan con valores inventados ni se reinterpretan los análisis guardados.

[Estado, evidencia y límites vigentes](docs/estado-actual.md) · [Funcionamiento de las medidas persistidas](docs/persistencia-mediciones.md) · [Contexto para colaboradores e IAs](CONTEXTOIA.md).

## Ejecutar con Node

Versión fijada en Docker y CI: **Node 22.19.0**. Desde la raíz:

```sh
cp .env.example .env
# Completar la configuración privada en .env.
npm ci --ignore-scripts
npm start
```

Configurar `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` y `BALLCHASING_TOKEN`. La clave privada de Supabase y el token de Ballchasing solo los utiliza Express. El archivo `.env` se excluye del repositorio y de la imagen.

Abrir [la aplicación local](http://127.0.0.1:3000/) y [la comprobación de salud](http://127.0.0.1:3000/health). El servidor sirve las pantallas oficiales en `public/sitio/html`. `HOST` y `PORT` permiten ajustar la escucha; por defecto Node usa `127.0.0.1:3000`.

Para otra base Supabase, preparar primero su esquema y migraciones según [database/README.md](database/README.md). Crear la imagen no crea cuentas de Auth ni copia los datos remotos.

## Ejecutar con Docker

Con Docker Desktop en ejecución y `.env` completo:

```sh
docker compose up --build -d
docker compose ps
```

Abrir [la aplicación local](http://127.0.0.1:3000/). Compose publica el puerto solo en la Mac y configura la escucha interna en `0.0.0.0`. La aplicación corre con el usuario `node`.

```sh
docker compose logs -f app
docker compose down
```

El volumen `replay-pending` conserva los archivos pendientes al parar o recrear el contenedor. Su caducidad sigue siendo de 60 minutos por defecto; los trabajos se reanudan mediante la acción de reintento del bloque. [Guía de conservación y recuperación](docs/ejecucion-y-recuperacion.md).

## Pruebas

```sh
npm test
node scripts/validar-heuristicas-a26.cjs
```

Todas las suites utilizan ahora el patrón `tests/*.test.cjs`, incluidas las pruebas de frontend de objetivos y plan. La regresión de persistencia recorre extracción → guardado → lectura → reglas con transporte SQL simulado. La prueba SQL `database/tests/mediciones-proveedor.sql` comprueba el RPC real y termina con rollback.

GitHub Actions ejecuta las suites y los 43 escenarios de A26. El flujo de Docker construye una imagen limpia, comprueba HTTP desde el host, el usuario de ejecución, la exclusión de `.env` y la conservación del volumen al recrear el contenedor. Sus resultados y límites se registran en [estado actual](docs/estado-actual.md).

La demo sintética de Análisis se activa con `ANALYSIS_DEMO_ENABLED=true npm start` y se abre en [Análisis de ejemplo](http://127.0.0.1:3000/sitio/html/analisis.html?demo=1); sus resultados se identifican como sintéticos. Una respuesta correcta de `/health` solo confirma que Express está disponible.

## Colaboración

Cada integrante usa su identidad de Git y entrega cambios comprobables mediante PR. Antes de aplicar un nuevo conjunto de cambios se requiere el **Release** de Roberto; una autorización cubre todos los pasos necesarios de ese conjunto. La planificación y partes del código tuvieron asistencia de IA.

[Cómo contribuir](CONTRIBUTING.md) · [Referencias](docs/README.md) · [Tablero](https://github.com/users/Santana-R/projects/1/views/1).
