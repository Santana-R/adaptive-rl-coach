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
| Ejecución e instalación | [README](../README.md) · [ejecución y recuperación](ejecucion-y-recuperacion.md) · `Dockerfile` / `compose.yaml` | Documentada; el cierre formal depende de A38 |
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

1. Node 22.19.0: `cp .env.example .env`, completar las cuatro variables, `npm ci --ignore-scripts`, `npm start`.
2. Docker: `docker compose up --build -d` con `.env` completo.
3. Base de datos: `database/esquema-fase2.sql`, después las migraciones de `database/migraciones/` y los seeds según [database/README.md](../database/README.md).

Docker y Node se comprobaron en GitHub Actions ([estado actual](estado-actual.md)). Falta que **otro integrante** reproduzca la instalación desde cero (P12) y que se cierre A38 (#38, ejecución y despliegue reproducibles). Esta sección se actualiza cuando A38 tenga resultado.

## Observaciones de Fase 2

El profesor aprobó el documento de Fase 2 el 3 de noviembre **sin solicitar correcciones** ([estado](fase2-estado.md), A07 cerrada). No hay correcciones que incorporar. El paquete usa el esquema y el diccionario vigentes, que ya incluyen las migraciones posteriores a Fase 2.

## Pendientes antes del corte

| Pendiente | Responsable propuesto | Bloquea |
| --- | --- | --- |
| Cierre de A38: instalación y despliegue reproducibles | OmarHub-star / Roberto | Sección de instalación |
| Instalación por otro integrante (P12) | Tadeo, con revisión de Luis | Sección de instalación |
| Capturas de las trece pantallas oficiales | Luis / David | Rubro de pantallas |
| Inicio de sesión real con Google (RF01) | Luis | RF01 |
| Confirmar fecha y formato de entrega LBPWEB | Roberto | Envío |
| Firma del checklist por los cuatro | Todos | Copia estable |

## Copia estable

Cuando el checklist esté firmado, se crea la etiqueta `entrega-lbpweb-v1` sobre el commit de `main` revisado. La entrega usa esa etiqueta, no la punta de `main`. Si después hay correcciones, se crea `entrega-lbpweb-v2` y se anota aquí el motivo.
