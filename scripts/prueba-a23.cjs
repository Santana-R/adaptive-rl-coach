'use strict';

// A23 · Prueba de solo lectura contra Supabase real (después de ejecutar el seed).
// No escribe nada. Necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env:
//   node --env-file=.env scripts/prueba-a23.cjs
// Muestra el catálogo (activos e inactivos) y lo que se ofrecería en tres contextos.

const { createServerClient } = require('../src/services/supabase');
const { getCatalog } = require('../src/repositories/catalog');
const { compatibleExercises } = require('../src/domain/catalog');

const CONTEXTS = [
  { platform: 'steam', mode: '2v2', workshop_access: true },
  { platform: 'steam', mode: '2v2', workshop_access: false },
  { platform: 'epic', mode: '3v3', workshop_access: false },
];

async function main() {
  const supabase = createServerClient();
  if (!supabase) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.');

  const all = await getCatalog(supabase, { includeInactive: true });
  console.log(`\nCatálogo en la base (${all.exercises.length} ejercicios, eliminados excluidos):`);
  console.table(all.exercises.map(e => ({
    id: e.exercise_id, version_id: e.exercise_version_id, clave: e.exercise_key, version: e.content_version,
    activo: e.active, revision: e.technical_review_status, plataformas: e.platforms.join(','),
    recurso: e.resource_code ?? e.resource_url, historial: e.history_versions,
  })));

  const active = await getCatalog(supabase);
  console.log(`Vista de jugador (solo activos): ${active.exercises.map(e => e.exercise_key).join(', ') || '(ninguno)'}`);

  for (const context of CONTEXTS) {
    const r = compatibleExercises(all, context);
    console.log(`\n${context.platform} · ${context.mode} · Workshop ${context.workshop_access ? 'sí' : 'no'} → ${r.coverage}` +
      (r.reason_codes.length ? ` (${r.reason_codes.join(', ')})` : ''));
    console.log(`  ofrecidos: ${r.exercises.map(e => e.exercise_key).join(', ') || '(ninguno)'}`);
    for (const x of r.excluded) console.log(`  excluido: ${x.exercise_key} → ${x.reason}`);
  }
}

main().catch(err => {
  console.error(`Error: ${err.message}`);
  process.exitCode = 1;
});
