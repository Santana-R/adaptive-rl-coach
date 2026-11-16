'use strict';

// A23 · Genera database/seeds/a23-catalogo.sql a partir de las fichas deportivas y del
// registro de comprobación. Ejecutar después de cambiar cualquiera de los dos:
//   node scripts/generar-seed-a23.cjs
// El test tests/catalog.test.cjs falla si el SQL guardado no coincide con lo generado.

const fs = require('node:fs');
const path = require('node:path');
const { seedPlan } = require('../src/domain/catalog');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'database', 'seeds', 'a23-catalogo.sql');

// Los saltos de línea se escriben como \n dentro de E'...' para que el SQL no dependa de
// CRLF/LF al clonar en Windows.
function lit(value) {
  if (value === null) return 'NULL';
  if (typeof value !== 'string') return String(value);
  const quoted = value.replace(/'/g, "''");
  if (!value.includes('\n')) return `'${quoted}'`;
  return `E'${quoted.replace(/\\/g, '\\\\').replace(/\n/g, '\\n')}'`;
}

function exerciseBlock(rows) {
  const v = rows.ejercicio_versiones;
  const platforms = rows.ejercicio_plataforma;
  const checks = Object.entries(v)
    .filter(([col]) => !['version', 'nombre'].includes(col))
    .map(([col, value]) => `v_row.${col} IS DISTINCT FROM ${lit(value)}`);
  checks.push(`v_plataformas IS DISTINCT FROM ${lit(platforms.join(','))}`);
  return `
  -- ${rows.exercise_key} · versión ${v.version}
  SELECT ev.* INTO v_row FROM public.ejercicio_versiones ev
   WHERE ev.nombre = ${lit(v.nombre)} AND ev.version = ${v.version};
  IF FOUND THEN
    SELECT string_agg(plataforma, ',' ORDER BY plataforma) INTO v_plataformas
      FROM public.ejercicio_plataforma WHERE id_ejercicio_version = v_row.id_ejercicio_version;
    IF ${checks.join('\n       OR ')} THEN
      RAISE EXCEPTION 'A23: % versión % ya existe con otro contenido. No se sobrescribe: crear otra versión.',
        ${lit(v.nombre)}, ${v.version};
    END IF;
    UPDATE public.ejercicios SET activo = ${rows.ejercicios.activo}
     WHERE id_ejercicio = v_row.id_ejercicio AND eliminado_en IS NULL;
    RAISE NOTICE 'A23: % ya existía; activo = %', ${lit(v.nombre)}, ${rows.ejercicios.activo};
  ELSE
    INSERT INTO public.ejercicios (activo) VALUES (${rows.ejercicios.activo}) RETURNING id_ejercicio INTO v_ejercicio;
    INSERT INTO public.ejercicio_versiones
      (id_ejercicio, version, nombre, categoria, tipo_recurso, codigo_enlace, finalidad, instrucciones, meta, dificultad_base, minutos_base)
    VALUES (v_ejercicio, ${v.version}, ${lit(v.nombre)}, ${lit(v.categoria)}, ${lit(v.tipo_recurso)}, ${lit(v.codigo_enlace)},
      ${lit(v.finalidad)},
      ${lit(v.instrucciones)},
      ${lit(v.meta)},
      ${v.dificultad_base}, ${v.minutos_base})
    RETURNING id_ejercicio_version INTO v_version;
    INSERT INTO public.ejercicio_plataforma (id_ejercicio_version, plataforma) VALUES
      ${platforms.map(p => `(v_version, ${lit(p)})`).join(', ')};
    RAISE NOTICE 'A23: % insertado; activo = %', ${lit(v.nombre)}, ${rows.ejercicios.activo};
  END IF;
`;
}

function buildSeed(content, verification) {
  const plan = seedPlan(content, verification);
  return `-- A23 · Seed del catálogo inicial (${content.catalog_version}).
-- ARCHIVO GENERADO por scripts/generar-seed-a23.cjs. No editar a mano.
-- Fuentes: planning/catalogo-ejercicios.v1.json (Roberto) y planning/catalogo-verificacion.v1.json (David).
--
-- Se ejecuta en el SQL Editor de Supabase. Se puede volver a ejecutar:
--   * Si la versión no existe, inserta ejercicio + versión + plataformas.
--   * Si ya existe con el mismo contenido, solo actualiza ejercicios.activo según la comprobación.
--   * Si ya existe con otro contenido, se detiene sin cambiar nada (las versiones son inmutables).
-- activo = true solo para los ejercicios con status 'verified' en el registro de comprobación.

BEGIN;

DO $$
DECLARE
  v_row public.ejercicio_versiones%ROWTYPE;
  v_plataformas text;
  v_ejercicio bigint;
  v_version bigint;
BEGIN
${plan.map(exerciseBlock).join('')}
END $$;

COMMIT;

-- Comprobación (ejecutar aparte):
--   SELECT e.id_ejercicio, e.activo, v.version, v.nombre, v.tipo_recurso, v.codigo_enlace,
--          string_agg(p.plataforma, ',' ORDER BY p.plataforma) AS plataformas
--   FROM public.ejercicios e
--   JOIN public.ejercicio_versiones v USING (id_ejercicio)
--   LEFT JOIN public.ejercicio_plataforma p USING (id_ejercicio_version)
--   GROUP BY e.id_ejercicio, e.activo, v.version, v.nombre, v.tipo_recurso, v.codigo_enlace
--   ORDER BY e.id_ejercicio, v.version;
`;
}

module.exports = { buildSeed, OUT };

if (require.main === module) {
  const content = require('../planning/catalogo-ejercicios.v1.json');
  const verification = require('../planning/catalogo-verificacion.v1.json');
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, buildSeed(content, verification), 'utf8');
  console.log(`Seed escrito en ${path.relative(ROOT, OUT)}`);
}
