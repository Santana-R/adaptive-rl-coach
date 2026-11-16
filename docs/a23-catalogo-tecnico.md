# A23 · Catálogo de ejercicios: seed y consulta

Implementación técnica de [A23](https://github.com/Santana-R/adaptive-rl-coach/issues/23) sobre las tres tablas existentes (`ejercicios`, `ejercicio_versiones`, `ejercicio_plataforma`). No crea tablas ni columnas. El contenido deportivo es el de Roberto ([fichas](catalogo-ejercicios.md), [`planning/catalogo-ejercicios.v1.json`](../planning/catalogo-ejercicios.v1.json)) y no se modifica.

## Archivos

| Archivo | Qué hace |
| --- | --- |
| `planning/catalogo-verificacion.v1.json` | Registro de la comprobación técnica de cada ejercicio (`pending`, `verified` o `failed`). |
| `scripts/generar-seed-a23.cjs` | Genera el seed a partir de las fichas y del registro. |
| `database/seeds/a23-catalogo.sql` | Seed generado. Se ejecuta en el SQL Editor de Supabase. |
| `src/domain/catalog.js` | Mapeo ficha ↔ tablas, normalización para `generatePlan` y filtro de compatibilidad. |
| `src/repositories/catalog.js` | Consulta `getCatalog` sobre Supabase. |
| `GET /api/v1/exercises` | Jugador: solo activos. Admin: `?include_inactive=true` también devuelve inactivos. |
| `tests/catalog.test.cjs` | 17 pruebas con Supabase simulado. |
| `scripts/prueba-a23.cjs` | Prueba de solo lectura contra Supabase real. |

## Mapeo a las tablas

| Ficha (JSON) | Columna |
| --- | --- |
| `title` | `ejercicio_versiones.nombre` |
| `content_version` | `ejercicio_versiones.version` |
| `priority_key` | `categoria` (`shooting`) |
| `resource_type` | `tipo_recurso` (`custom_training` o `steam_workshop`) |
| `resource_code` o, si no hay código, `resource_url` | `codigo_enlace` |
| `purpose` / `success_criterion` | `finalidad` / `meta` |
| `instructions` (lista) | `instrucciones`, un paso por línea |
| `difficulty_base` / `reference_duration_minutes` | `dificultad_base` / `minutos_base` |
| `platforms` | una fila por plataforma en `ejercicio_plataforma` |
| comprobación técnica `verified` | `ejercicios.activo = true` |

Lo que no tiene columna (variantes de CoCo, modalidades, requisitos, niveles de práctica, mínimo de cinco minutos y enlace del documento de Castro) se lee de la ficha al consultar. La ficha y la fila se unen por `nombre` + `version`, porque el esquema no tiene una columna de clave.

## Reglas

- **Activo.** El seed solo activa un ejercicio si su registro dice `verified`, con fecha y método. El 2026-11-16 David comprobó en el juego los dos códigos de Castro y el mapa de CoCo; los tres están `verified` y el seed los carga **activos**.
- **Revisión técnica.** `technical_review_status` vale `verified` solo si el registro lo dice **y** la fila guardada coincide campo por campo con la ficha. Si alguien activa un ejercicio desde la base sin comprobarlo, o cambia su código, el generador lo excluye (`UNVERIFIED_RESOURCE`).
- **Versiones inmutables.** Volver a ejecutar el seed no duplica filas. Si una versión ya existe con otro contenido, el seed se detiene y revierte todo. Un cambio de contenido se hace como versión nueva, que primero revisa Roberto.
- **Versión vigente.** La consulta ofrece la versión mayor de cada ejercicio. Las anteriores se quedan en la base para los planes que ya las usan.
- **Eliminados.** Un ejercicio con `eliminado_en` no aparece nunca.
- **Compatibilidad.** `compatibleExercises(catalog, { platform, mode, workshop_access })` usa las mismas reglas que `generatePlan` (`candidateProblem`, exportado de `src/domain/plans.js`) y devuelve `complete`, `partial` o `empty` con sus motivos. CoCo solo se ofrece con Steam y acceso a Workshop confirmado.

## Cómo ejecutarlo

1. Comprobar en el juego cada recurso (ver `check` en el registro). Por cada uno que funcione, poner `status: "verified"`, `checked_on` (AAAA-MM-DD) y `method` (qué se hizo).
2. `node scripts/generar-seed-a23.cjs` regenera el seed. `npm test` falla si el seed no está actualizado.
3. Ejecutar `database/seeds/a23-catalogo.sql` en el SQL Editor de Supabase.
4. `node --env-file=.env scripts/prueba-a23.cjs` muestra el catálogo y lo que se ofrece en tres contextos (Steam con Workshop, Steam sin Workshop y Epic).

## Comprobación realizada

- `npm test`: 242 pruebas aprobadas (225 anteriores y 17 de A23). Cubren el mapeo, los dos contextos de plataforma, Workshop, ejercicios inactivos, eliminados y duplicados, contenido distinto, versiones históricas, catálogo sin cobertura, la ruta y el reparto de 20 minutos de `generatePlan` con el catálogo de la base.
- Seed probado en PostgreSQL (PGlite) con las tres tablas del esquema: la primera ejecución inserta 3 ejercicios con 3 versiones y 5 plataformas; la segunda no cambia nada; con un ejercicio verificado solo ese queda activo; con contenido distinto se detiene y revierte.
- Comprobación en el juego (2026-11-16, David): los códigos `9472-6A26-7F5D-767B` y `E6E3-1E82-E6DE-C4B4` abren en Entrenamiento personalizado y el mapa de CoCo (Workshop 1906378036) abre desde Steam.
- `scripts/prueba-a23.cjs` contra Supabase dev, antes del seed: la consulta funciona y devuelve 0 ejercicios con cobertura `empty` (`NO_CATALOG_COVERAGE`) en los tres contextos.
- Seed ejecutado en Supabase dev el 2026-11-16 ("Success. No rows returned"). Después, `scripts/prueba-a23.cjs`:

| id | Clave | Versión | Activo | Revisión | Plataformas | Recurso |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | castro-ground-shots | 1 | sí | verified | epic, steam | 9472-6A26-7F5D-767B |
| 2 | castro-mid-height-shots | 1 | sí | verified | epic, steam | E6E3-1E82-E6DE-C4B4 |
| 3 | coco-aim-training | 1 | sí | verified | steam | Workshop 1906378036 |

| Contexto | Cobertura | Ofrecidos | Excluidos |
| --- | --- | --- | --- |
| Steam · 2v2 · con Workshop | complete | los 3 | — |
| Steam · 2v2 · sin Workshop | complete | 2 de Castro | CoCo → `WORKSHOP_UNAVAILABLE` |
| Epic · 3v3 | complete | 2 de Castro | CoCo → `PLATFORM_INCOMPATIBLE` |

## Pendiente

- El CRUD de administración sigue en A32. A24 persiste la versión de ejercicio y la variante elegidas.
