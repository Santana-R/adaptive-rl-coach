# Paquete de entrega LBPWEB · A40

Entrega final LBPWEB: **23 de noviembre de 2026, fecha tentativa** comunicada por Roberto el 1 de noviembre. El paquete se revisa antes del corte y se conserva una copia estable cuando los cuatro integrantes firmen el [checklist común](checklist-lbpweb.md).

Este documento reúne lo que ya está en el repositorio. Si algo no tiene evidencia, aparece como pendiente. No se marca nada como comprobado sin un resultado registrado.

## Contenido por rubro

La distribución por materia de [pruebas y entrega](pruebas-y-entrega.md) asigna a LBPWEB requisitos, pantallas, CRUD, modelo de datos, ejecución y pruebas funcionales.

| Rubro | Dónde está | Estado |
| --- | --- | --- |
| Requisitos RF01–RF12 | [Alcance y requisitos](alcance-y-requisitos.md) · [trazabilidad](../planning/trazabilidad-rf.csv) | 11 comprobados, RF01 parcial (falta registrar Google real) |
| Trece pantallas | [Flujo de pantallas](flujo-pantallas.md) · `public/sitio/html/` | Implementadas; faltan capturas de la versión oficial (ver abajo) |
| Tres CRUD | [Resultados CRUD](resultados-crud.md): metas 18/18, sesiones 19/19, ejercicios 19/19 | Comprobado el 16 nov contra Supabase de desarrollo |
| Modelo de datos | [Diccionario](diccionario-datos.md) · [esquema SQL](../database/esquema-fase2.sql) · [migraciones](../database/migraciones/) · UML/ERD en el PDF de Fase 2 ([estado](fase2-estado.md)) | Vigente; el PDF lo facilita Roberto |
| Ejecución e instalación | [README](../README.md) · [A38 ejecución reproducible](a38-ejecucion-reproducible.md) · [ejecución y recuperación](ejecucion-y-recuperacion.md) · `database/instalar-a38.sql` · `Dockerfile` / `compose.yaml` | Procedimiento integrado (PR #99, A38 cerrada); faltan Docker de esta versión, Supabase real y la matriz P11/P12 |
| Seguridad y permisos | [Permisos verificados](permisos-verificados.md) · [prueba de auth](prueba-auth.md) | Comprobado con cuentas reales |
| Pruebas funcionales | [Estado actual](estado-actual.md) (553 pruebas en CI) · [regresión A33](resultados-regresion.md) · [integración del ciclo](integracion-ciclo.md) | Comprobado; límites registrados en cada documento |

## Trece pantallas

Todas están en `public/sitio/html/`. Express las sirve en `http://127.0.0.1:3000/sitio/html/<archivo>`.

| Pantalla | Archivo | RF | Captura de la versión oficial |
| --- | --- | --- | --- |
| Inicio | `index.html` | RF01, RF03 | Pendiente |
| Acerca | `aboutus.html` | RF08 | Pendiente |
| Ayuda | `helpme.html` | RF03, RF05 | Pendiente |
| Registro/login | `login.html` | RF01 | Pendiente |
| Perfil | `perfil.html` | RF02, RF09 | Pendiente |
| Carga/historial | `replays.html` | RF03–RF05 | Pendiente |
| Análisis | `analisis.html` | RF06–RF08, RF11 | Parcial: [evidencias A19](evidencias/a19/) |
| Objetivos | `objetivos.html` | RF10, RF11 | Pendiente |
| Plan | `plan.html` | RF09, RF10 | Pendiente |
| Sesiones | `sesiones.html` | RF10, RF11 | Pendiente |
| Panel admin | `admin-resumen.html` | RF12 | Pendiente |
| Usuarios admin | `admin-usuarios.html` | RF12 | Pendiente |
| Ejercicios admin | `admin-ejercicios.html` | RF12 | Pendiente |

`panel.html` es el panel de entrada del jugador y no forma parte de las trece pantallas acordadas. Las imágenes de `docs/demo-capturas/` son del cascarón provisional PROGSA y no sirven como evidencia de la versión oficial.

Las capturas nuevas se guardan en `docs/evidencias/lbpweb/` con el nombre del archivo de la pantalla (por ejemplo `replays.png`). Deben salir de una sesión de prueba (`TEST_`/`DEMO_`), sin correos ni tokens visibles.

## Instalación

El procedimiento oficial es el de [A38](a38-ejecucion-reproducible.md) (PR #99):

1. Node 22.19.0 (`.nvmrc`): `cp .env.example .env`, completar las cuatro variables, `npm ci --ignore-scripts`, `npm start`.
2. Docker Compose (entorno acordado): `docker compose up --build -d` con `.env` completo.
3. Supabase vacío: ejecutar `database/instalar-a38.sql` según [database/README.md](../database/README.md#instalación-inicial-a38). No se ejecuta sobre la base activa.
4. Comprobación: `npm test`, `npm run smoke`, `node scripts/validar-heuristicas-a26.cjs` y, con las claves privadas, `npm run check:connections`.

### Comprobación del paquete · 22 de noviembre de 2026

Rama `docs/A40-entrega-lbpweb` con `main` integrado (`0e731bc`, incluye A38). Equipo de David, Windows 11.

| Comprobación | Resultado observado |
| --- | --- |
| `npm ci --ignore-scripts` | Correcto, 0 vulnerabilidades |
| `npm test` | 560/560 aprobadas, 0 fallidas, 0 omitidas |
| `node scripts/validar-heuristicas-a26.cjs` | 43/43, 0 fallidos |
| `npm run smoke` | Salud, 15 páginas, configuración pública y 3 rutas protegidas correctas |
| `npm run check:connections` | No ejecutado: falta `BALLCHASING_TOKEN` en el `.env` local |

Esta corrida usó Node 24.15.0, no la versión fijada 22.19.0. No acredita Docker, login con Google ni cargas reales.

### Lo que A38 deja pendiente

La guía de A38 se declara parcial. Faltan Docker sobre la versión actual (CI lo acreditó el 18 de noviembre para la anterior), la instalación en un Supabase real, el login real con Google y la matriz de once pasos P11/P12 con otro integrante y dos bloques reales. Esa matriz es la evidencia de instalación más fuerte que puede llevar el paquete.

## Observaciones de Fase 2

El profesor aprobó el documento de Fase 2 el 3 de noviembre **sin solicitar correcciones** ([estado](fase2-estado.md), A07 cerrada). No hay correcciones que incorporar. El paquete usa el esquema y el diccionario vigentes, que ya incluyen las migraciones posteriores a Fase 2.

## Pendientes antes del corte

| Pendiente | Responsable propuesto | Bloquea |
| --- | --- | --- |
| Matriz P11/P12 de A38 desde copia limpia (11 pasos) | Roberto, como revisor de A38 | Sección de instalación |
| `npm run check:connections` con las cuatro claves | Quien tenga `BALLCHASING_TOKEN` | Sección de instalación |
| Capturas de las trece pantallas oficiales | Luis / David | Rubro de pantallas |
| Inicio de sesión real con Google (RF01) | Luis | RF01 |
| Confirmar fecha y formato de entrega LBPWEB | Roberto | Envío |
| Firma del checklist por los cuatro | Todos | Copia estable |

## Copia estable

A38 también pide acordar un tag después de validar la versión final. Se propone usar uno solo para ambas tareas. Cuando el checklist esté firmado, se crea la etiqueta `entrega-lbpweb-v1` sobre el commit de `main` revisado. La entrega usa esa etiqueta, no la punta de `main`. Si después hay correcciones, se crea `entrega-lbpweb-v2` y se anota aquí el motivo.
