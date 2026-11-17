# A31 · Rango declarado e integridad del historial

## Qué se entrega

- **Rango declarado** con fecha, modalidad y fuente en la tabla `rangos`, que ya estaba en el esquema de la Fase 2. No se añadieron tablas.
- **API** `GET/POST /api/v1/rank-history`, solo para el propietario.
- **Generador de planes**: si la petición no trae `rank`, usa el último rango declarado de la modalidad del bloque.
- **Perfil**: nueva sección "Rango declarado", con un formulario y el historial.
- **Prueba real** `scripts/prueba-a31.cjs`: corrige meta, rango y catálogo, y comprueba que el plan guardado no cambia.

## Reglas

| Regla | Dónde se aplica |
| --- | --- |
| Modalidad: `1v1`, `2v2` o `3v3` | `ck_rangos_modalidad_valor` y `domain/ranks.js` |
| Rango normalizado: `bronze` … `supersonic_legend` (las mismas claves que usa el generador) | `ck_rangos_rango_valor` |
| División de 1 a 4. Supersonic Legend no tiene división | `ck_rangos_division_valor` |
| La fuente siempre es `self_reported`: el cliente no la envía, y el rango no se infiere del MMR ni de los replays | `ck_rangos_fuente_valor`. Si se envía `source`, la API responde 400 |
| Un rango registrado no se edita: para corregirlo se registra otro | Trigger `a31_inmutable` (SQLSTATE `A3101`) |
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

## Para reportes (A22 y A28)

`repositories/ranks.listRanks(supabase, userId, { mode })` devuelve `entries` y `current`. El rango es una serie aparte con `source: self_reported`. No se mezcla con las métricas de rendimiento ni de entrenamiento.

## Comprobación

1. Ejecutar `database/migraciones/a31-rangos.sql` en el SQL Editor.
2. `npm test`: el archivo `tests/rank-history.test.cjs` cubre validación, aislamiento, errores sin detalles privados y el uso del rango en el plan.
3. `node --env-file=.env scripts/prueba-a31.cjs` imprime una tabla con el resultado y el plan antes y después de las correcciones. Al terminar borra lo que creó y reactiva el ejercicio.

## Pendiente

- **Sesiones**: la corrección de sesiones (`sesion_versiones`) depende de A21 (Tadeo).
- **Reportes**: la coherencia con los reportes depende de A22 (Tadeo).

Mientras falten las dos, el issue queda abierto con un avance parcial.
