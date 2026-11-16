'use strict';

// A23 · Catálogo de ejercicios.
// Une tres fuentes sin crear columnas nuevas:
//   1. Tablas existentes: ejercicios (identidad y activo), ejercicio_versiones (ficha inmutable)
//      y ejercicio_plataforma (plataformas compatibles).
//   2. Fichas deportivas de Roberto (planning/catalogo-ejercicios.v1.json): variantes, modalidades,
//      requisitos y niveles, que no tienen columna en el esquema.
//   3. Registro de comprobación técnica (planning/catalogo-verificacion.v1.json).
// Ver docs/a23-catalogo-tecnico.md.

const { candidateProblem, ROUTINE_KEYS } = require('./plans');

const CATALOG_VERSION = 'mvp.catalog.v1';

/** Clave de una ficha en la base: nombre + versión (el esquema no tiene columna de clave). */
const contentId = (title, version) => `${title}@${version}`;

/** codigo_enlace guarda el código del paquete o, si no hay código, el enlace del recurso. */
function resourceLink(exercise) {
  return exercise.resource_code ?? exercise.resource_url;
}

/**
 * Convierte una ficha deportiva en las filas que el seed inserta.
 * Las variantes, modalidades y requisitos no se guardan en SQL: se leen de la ficha.
 */
function toSeedRows(exercise, verification) {
  return {
    exercise_key: exercise.exercise_key,
    ejercicios: { activo: verification?.status === 'verified' },
    ejercicio_versiones: {
      version: exercise.content_version,
      nombre: exercise.title,
      categoria: exercise.priority_key,
      tipo_recurso: exercise.resource_type,
      codigo_enlace: resourceLink(exercise),
      finalidad: exercise.purpose,
      instrucciones: exercise.instructions.join('\n'),
      meta: exercise.success_criterion,
      dificultad_base: exercise.difficulty_base,
      minutos_base: exercise.reference_duration_minutes,
    },
    ejercicio_plataforma: [...exercise.platforms].sort(),
  };
}

function findVerification(verification, key, version) {
  return (verification?.exercises ?? []).find(
    v => v.exercise_key === key && v.content_version === version) ?? null;
}

/** Valida que el registro de comprobación sea coherente antes de usarlo. */
function validateVerification(content, verification) {
  if (verification?.catalog_version !== content.catalog_version) {
    throw new TypeError('El registro de comprobación no corresponde a la versión del catálogo.');
  }
  const seen = new Set();
  for (const v of verification.exercises ?? []) {
    const id = `${v.exercise_key}@${v.content_version}`;
    if (seen.has(id)) throw new TypeError(`Registro de comprobación duplicado: ${id}.`);
    seen.add(id);
    if (!['pending', 'verified', 'failed'].includes(v.status)) {
      throw new TypeError(`Estado de comprobación no válido en ${id}: ${v.status}.`);
    }
    if (v.status === 'verified' && !(v.checked_on && v.method)) {
      throw new TypeError(`${id} está marcado como verified sin fecha ni método.`);
    }
    if (!content.exercises.some(e => e.exercise_key === v.exercise_key && e.content_version === v.content_version)) {
      throw new TypeError(`${id} no existe en las fichas deportivas.`);
    }
  }
}

function seedPlan(content, verification) {
  validateVerification(content, verification);
  return content.exercises.map(e =>
    toSeedRows(e, findVerification(verification, e.exercise_key, e.content_version)));
}

/** Diferencias entre una versión guardada y la ficha deportiva de la misma versión. */
function contentDifferences(row, platforms, exercise) {
  const expected = toSeedRows(exercise, null);
  const diffs = [];
  for (const [col, value] of Object.entries(expected.ejercicio_versiones)) {
    if (row[col] !== value) diffs.push(col);
  }
  if (platforms.join(',') !== expected.ejercicio_plataforma.join(',')) diffs.push('plataforma');
  return diffs;
}

/**
 * Normaliza las filas consultadas (ejercicios con versiones y plataformas embebidas) al formato
 * que espera generatePlan (docs/generador-planes.md, "Catálogo que debe entregar la integración A23").
 * Solo se expone la versión vigente (la mayor) de cada ejercicio; las anteriores se conservan en la
 * base para los planes que ya las usan.
 */
function normalizeCatalog(rows, content, verification) {
  validateVerification(content, verification);
  const byContent = new Map(content.exercises.map(e => [contentId(e.title, e.content_version), e]));
  const usedKeys = new Set();
  const exercises = [];

  for (const row of [...rows].sort((a, b) => Number(a.id_ejercicio) - Number(b.id_ejercicio))) {
    if (row.eliminado_en != null) continue;
    const versions = row.ejercicio_versiones ?? [];
    if (!versions.length) continue;
    const current = versions.reduce((a, b) => (b.version > a.version ? b : a));
    const platforms = (current.ejercicio_plataforma ?? []).map(p => p.plataforma).sort();
    const ficha = byContent.get(contentId(current.nombre, current.version));

    let key = ficha?.exercise_key;
    let status = 'pending';
    if (!ficha) status = 'not_in_reviewed_content';
    else if (usedKeys.has(key)) status = 'duplicate';
    else if (contentDifferences(current, platforms, ficha).length) status = 'content_mismatch';
    else if (findVerification(verification, key, current.version)?.status === 'verified') status = 'verified';
    if (!ficha || status === 'duplicate') key = `db-${row.id_ejercicio}`;
    usedKeys.add(key);

    const isCustom = current.tipo_recurso === 'custom_training';
    exercises.push({
      exercise_id: String(row.id_ejercicio),
      exercise_version_id: String(current.id_ejercicio_version),
      exercise_key: key,
      content_version: current.version,
      title: current.nombre,
      author: ficha?.author ?? null,
      priority_key: current.categoria,
      resource_type: current.tipo_recurso,
      resource_code: isCustom ? current.codigo_enlace : null,
      resource_url: isCustom ? (ficha?.resource_url ?? null) : current.codigo_enlace,
      platforms,
      modes: ficha?.modes ?? content.modes,
      requirements: ficha?.requirements ?? null,
      difficulty_base: current.dificultad_base,
      reference_duration_minutes: current.minutos_base,
      minimum_duration_minutes: ficha?.minimum_duration_minutes ?? null,
      purpose: current.finalidad,
      instructions: current.instrucciones.split('\n').filter(line => line.trim()),
      practice_level_keys: ficha?.practice_level_keys ?? [],
      ...(ficha?.variants ? { variants: structuredClone(ficha.variants) } : {}),
      success_criterion: current.meta,
      active: row.activo === true,
      technical_review_status: status,
      history_versions: versions.length,
    });
  }

  return {
    catalog_version: CATALOG_VERSION,
    source: 'database',
    modes: [...content.modes],
    practice_levels: structuredClone(content.practice_levels),
    exercises,
  };
}

/**
 * Ejercicios que se pueden ofrecer en un contexto, con las mismas reglas que el generador (A18).
 * context: { platform: 'steam'|'epic', mode: '1v1'|'2v2'|'3v3', workshop_access: boolean }.
 * Devuelve cobertura explícita: nunca rellena con ejercicios inactivos o incompatibles.
 */
function compatibleExercises(catalog, context) {
  const profile = { platform: context.platform, mode: context.mode, workshop_access: context.workshop_access === true };
  const exercises = [], excluded = [];
  for (const exercise of catalog.exercises) {
    const reason = candidateProblem(exercise, catalog, profile);
    if (reason) excluded.push({ exercise_key: exercise.exercise_key, reason });
    else exercises.push(exercise);
  }
  // Recursos esperados en ese contexto: CoCo solo con Steam y acceso confirmado a Workshop.
  const expected = profile.platform === 'steam' && profile.workshop_access ? ROUTINE_KEYS : ROUTINE_KEYS.slice(0, 2);
  const offered = new Set(exercises.map(e => e.exercise_key));
  const missing = expected.filter(k => !offered.has(k));
  let coverage = 'complete';
  if (!exercises.length) coverage = 'empty';
  else if (missing.length) coverage = 'partial';
  return {
    context: profile,
    coverage,
    reason_codes: coverage === 'complete' ? [] : [coverage === 'empty' ? 'NO_CATALOG_COVERAGE' : 'CATALOG_PARTIAL'],
    exercises,
    missing_keys: missing,
    excluded,
  };
}

module.exports = {
  CATALOG_VERSION, toSeedRows, seedPlan, validateVerification, normalizeCatalog,
  compatibleExercises, contentDifferences,
};
