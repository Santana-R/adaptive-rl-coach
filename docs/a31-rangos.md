# A31 · Rango declarado e integridad del historial

## Qué se entrega

- **Rango declarado** con fecha, modalidad y fuente en la tabla `rangos`, que ya estaba en el esquema de la Fase 2. No se añadieron tablas.
- **API** `GET/POST /api/v1/rank-history`, solo para el propietario.
- **Generador de planes**: si la petición no trae `rank`, usa el último rango declarado de la modalidad del bloque.
- **Perfil**: nueva sección "Rango declarado", con un formulario y el historial.
- **Historial de sesiones**: las versiones guardadas de una sesión (A21) no se pueden modificar en la base.
- **Prueba real** `scripts/prueba-a31.cjs`: corrige meta, rango, sesiones y catálogo, comprueba que el plan guardado y las versiones anteriores no cambian, y compara el reporte (A22) antes y después.

## Reglas

| Regla | Dónde se aplica |
| --- | --- |
| Modalidad: `1v1`, `2v2` o `3v3` | `ck_rangos_modalidad_valor` y `domain/ranks.js` |
| Rango normalizado: `bronze` … `supersonic_legend` (las mismas claves que usa el generador) | `ck_rangos_rango_valor` |
| División de 1 a 4. Supersonic Legend no tiene división | `ck_rangos_division_valor` |
| La fuente siempre es `self_reported`: el cliente no la envía, y el rango no se infiere del MMR ni de los replays | `ck_rangos_fuente_valor`. Si se envía `source`, la API responde 400 |
| Un rango registrado no se edita: para corregirlo se registra otro | Trigger `a31_inmutable` (SQLSTATE `A3101`) |
| Una versión guardada de una sesión no se edita: la corrección de A21 inserta la versión siguiente | Trigger `a31_inmutable` en `sesion_versiones` y `sesion_ejercicio` (SQLSTATE `A3102`) |
| La fecha no puede ser futura ni anterior al 2015-07-07 | `domain/ranks.js` |
| Temporada opcional. Si falta, se guarda `no_declarada`, porque la columna es obligatoria | `domain/ranks.js` |

Una fecha sin hora (`AAAA-MM-DD`) se guarda a las 12:00 UTC, así se ve el mismo día en México y en Europa.

## API

```
POST /api/v1/rank-history
{ "mode": "2v2", "rank_label": "diamond", "division": 2, "season": "S21", "recorded_at": "2026-11-10" }
→ 201 { data: { rank_id, mode, rank_label, division, season, recorded_at, source: "self_reported" } }

GET /api/v1/rank-history[?mode=2v2]
→ 200 { data: { entries: [...más reciente primero], current: { "1v1": null, "2v2": {...}, "3v3": null } },
        meta: { source: "self_reported" } }
```

Ante dos registros con la misma fecha, gana el último que se guardó.

## Plan

En `POST /blocks/:id/plan-proposal` y `POST /blocks/:id/plans`, el rango sale del campo `rank` de la petición según este orden:

| `rank` en la petición | Rango que se usa | `meta.rank_origin` |
| --- | --- | --- |
| No viene | El último declarado en la modalidad del bloque (o ninguno) | `rank_history` o `none` |
| `"gold"` | El de la petición | `request` |
| `null` | Ninguno | `none` |

`profile_snapshot.rank_record` guarda `{ rank_id, recorded_at }` del registro que se usó. El plan guardado conserva el rango que tenía al generarse, aunque después se registre otro.

## Sesiones y reportes

Con A21 y A22 en `main`, la prueba real cubre también estas relaciones:

| Corrección | Qué se conserva | Qué muestra el reporte |
| --- | --- | --- |
| Meta: se edita el valor (versión 2) | La versión 1 y el plan que la usó | `goals` trae las dos versiones, cada una con su vigencia; la segunda empieza donde termina la primera |
| Rango: se registra uno nuevo | Los registros anteriores y el rango del plan guardado | `rank` agrega el registro nuevo; los anteriores salen igual |
| Sesión: se corrigen los minutos (versión 2) | La versión 1 de la sesión y su vínculo con la versión 1 del plan | `training` cuenta la sesión una sola vez, con los minutos corregidos |
| Sesión: se borra | La fila, con `eliminado_en` | `training` y la meta de entrenamiento dejan de contarla |
| Catálogo: se desactiva un ejercicio del plan | El plan guardado con ese ejercicio | `performance` no cambia |

El rango es una serie aparte (`rank`, `source: self_reported`). No se mezcla con `performance` ni con `training`.

Una sesión sigue ligada a la versión del plan en la que se registró, aunque después se guarde otra versión. Un ejercicio de otra versión se rechaza con `422 INPUT_INVALID`.

`routes/reports.buildReport({ supabase, repository, userId, interval })` arma el reporte. Lo usan la ruta `GET /api/v1/reports` y la prueba real, así que la prueba revisa el mismo código que consume A28.

## Comprobación

1. Ejecutar en el SQL Editor `database/migraciones/a31-rangos.sql` y `database/migraciones/a31-historial-sesiones.sql`. La segunda requiere `a21-sesiones.sql`.
2. `npm test`: el archivo `tests/rank-history.test.cjs` cubre validación, aislamiento, errores sin detalles privados y el uso del rango en el plan.
3. `node --env-file=.env scripts/prueba-a31.cjs` imprime el plan y el reporte antes y después de las correcciones, y una tabla con el resultado. Al terminar borra lo que creó y reactiva el ejercicio.

`a31-historial-sesiones.sql` también crea `a31_borrar_sesiones_de_planes`, que la prueba usa para borrar sus sesiones. Una sesión exige al menos una versión al confirmar la transacción, así que no se puede borrar por partes desde la API REST. Express no llama a esa función.
