'use strict';

// A39 · Auditoría real de los tres CRUD (metas, sesiones y ejercicios) y de la integridad.
//
// Requiere ejecutado en el SQL Editor (además de A08, A15, A16, A21, A24, A32 y las seeds):
//   database/migraciones/a31-historial-sesiones.sql
//   database/migraciones/a39-auditoria.sql
//
// Uso (desde la raíz del repo):
//   node --env-file=.env scripts/auditoria-a39.cjs          imprime la matriz
//   node --env-file=.env scripts/auditoria-a39.cjs --doc    además escribe docs/resultados-crud.md
//
// Levanta la aplicación Express real en un puerto local y recorre las rutas por HTTP contra
// Supabase dev con tres identidades: jugador A (TEST_A), jugador B (TEST_B) y el administrador.
// La verificación del token de Supabase Auth se sustituye por identificadores de un solo uso
// (eso lo cubre scripts/prueba-auth.ps1); rol, estado, propiedad, rutas, repositorios y base son
// los reales. El bloque de cinco replays es sintético. Al terminar borra lo que creó y deja el
// catálogo como estaba.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');
const { createServerClient } = require('../src/services/supabase');
const { createApp } = require('../src/app');
const blocks = require('../src/repositories/blocks');
const { profileByAccount, syntheticReplay, removeBlocks, removeGoals, removeExercise, integrity, requireSessionCleanup } = require('./lib/datos-a39.cjs');

const SECTIONS = ['Metas', 'Sesiones', 'Ejercicios'];
const results = [];
function eq(section, operation, name, expected, obtained) {
  results.push({ section, operation, name, expected, obtained: String(obtained), ok: String(obtained) === expected });
}

const FICHA = { title: 'Auditoría A39 recuperaciones', priority_key: 'movement', resource_type: 'custom_training',
  resource: 'ABCD-1234-ABCD-1234', purpose: 'Ficha de la auditoría A39; se borra al terminar.',
  instructions: ['Abrir el paquete.', 'Repetir cada tiro.'], success_criterion: 'Completar el recorrido.',
  difficulty_base: 2, reference_duration_minutes: 10, platforms: ['epic', 'steam'] };

/** Cliente real, salvo auth.getUser: reconoce los identificadores de esta ejecución. */
function withAuditIdentities(supabase, identities) {
  const auth = Object.create(supabase.auth);
  auth.getUser = async token => identities.has(token)
    ? { data: { user: { id: identities.get(token) } }, error: null }
    : { data: { user: null }, error: { message: 'invalid token' } };
  return new Proxy(supabase, {
    get(target, prop) {
      if (prop === 'auth') return auth;
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

function client(base) {
  return async (method, route, token, body) => {
    const response = await fetch(base + route, {
      method,
      headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });
    let json = null;
    try { json = await response.json(); } catch { /* sin cuerpo */ }
    const code = json?.error?.code;
    return { status: response.status, data: json?.data, meta: json?.meta, label: response.status + (code ? ' ' + code : '') };
  };
}

async function sessionVersions(supabase, sessionId) {
  const { data, error } = await supabase.from('sesion_versiones')
    .select('version, sesion_ejercicio(minutos)').eq('id_sesion', Number(sessionId)).order('version');
  if (error) throw new Error('No se pudo leer el historial de la sesión: ' + error.message);
  return data.map(v => ({ version: v.version, minutes: v.sesion_ejercicio[0]?.minutos }));
}

async function audit({ supabase, call, A, B, tokens, created }) {
  const { a, b, admin } = tokens;

  // ---------- Metas ----------
  let r = await call('POST', '/api/v1/goals', a, { type: 'performance', mode: '2v2', name: 'Auditoría A39 eficiencia', target_value: 35 });
  const goalId = r.data?.goal_id;
  created.goalIds.push(goalId);
  eq('Metas', 'Alta', 'Crear una meta de rendimiento', '201, versión 1, active', `${r.status}, versión ${r.data?.version}, ${r.data?.status}`);
  r = await call('POST', '/api/v1/goals', a, { type: 'performance', mode: '2v2', name: 'Auditoría A39 duplicada', target_value: 50 });
  if (r.data?.goal_id) created.goalIds.push(r.data.goal_id);
  eq('Metas', 'Alta', 'Segunda meta activa del mismo tipo y modalidad', '409 GOAL_ACTIVE_EXISTS', r.label);
  r = await call('POST', '/api/v1/goals', a, { type: 'performance', mode: '3v3', name: 'Auditoría A39 inválida', target_value: 150 });
  if (r.data?.goal_id) created.goalIds.push(r.data.goal_id);
  eq('Metas', 'Alta', 'Valor fuera de rango (150 %)', '400 INPUT_INVALID', r.label);
  r = await call('POST', '/api/v1/goals', null, { type: 'performance', mode: '2v2', name: 'Auditoría A39 anónima', target_value: 35 });
  eq('Metas', 'Alta', 'Sin sesión', '401 AUTH_REQUIRED', r.label);

  r = await call('GET', '/api/v1/goals', a);
  eq('Metas', 'Consulta', 'Lista de metas activas', '200, incluye la meta', `${r.status}, ${r.data?.some(g => g.goal_id === goalId) ? 'incluye' : 'no incluye'} la meta`);
  r = await call('GET', `/api/v1/goals/${goalId}`, a);
  eq('Metas', 'Consulta', 'Detalle de la meta', '200, versión 1, meta 35', `${r.status}, versión ${r.data?.version}, meta ${r.data?.target_value}`);
  r = await call('GET', `/api/v1/goals/${goalId}`, b);
  eq('Metas', 'Consulta', 'Otro jugador pide el detalle', '404 RESOURCE_NOT_FOUND', r.label);
  r = await call('GET', '/api/v1/goals?status=all', b);
  eq('Metas', 'Consulta', 'Otro jugador lista sus metas', '200, sin la meta', `${r.status}, ${r.data?.some(g => g.goal_id === goalId) ? 'con' : 'sin'} la meta`);

  r = await call('PATCH', `/api/v1/goals/${goalId}`, a, { target_value: 40 });
  eq('Metas', 'Edición', 'Cambiar el valor a 40', '200, versión 2, meta 40, versión nueva', `${r.status}, versión ${r.data?.version}, meta ${r.data?.target_value}, ${r.meta?.version_created ? 'versión nueva' : 'sin versión nueva'}`);
  r = await call('GET', `/api/v1/goals/${goalId}`, a);
  eq('Metas', 'Edición', 'Historial después de editar', '2 versiones; la 1 conserva 35', `${r.data?.versions?.length} versiones; la 1 conserva ${r.data?.versions?.[0]?.target_value}`);
  r = await call('PATCH', `/api/v1/goals/${goalId}`, a, { target_value: 40 });
  eq('Metas', 'Edición', 'Enviar el mismo valor', '200, versión 2, sin versión nueva', `${r.status}, versión ${r.data?.version}, ${r.meta?.version_created ? 'versión nueva' : 'sin versión nueva'}`);
  r = await call('PATCH', `/api/v1/goals/${goalId}`, b, { target_value: 10 });
  eq('Metas', 'Edición', 'Otro jugador edita la meta', '404 RESOURCE_NOT_FOUND', r.label);

  r = await call('POST', '/api/v1/goals', a, { type: 'training', mode: '2v2', name: 'Auditoría A39 minutos', target_value: 30 });
  const looseGoalId = r.data?.goal_id;
  created.goalIds.push(looseGoalId);
  r = await call('DELETE', `/api/v1/goals/${looseGoalId}`, b);
  eq('Metas', 'Eliminación', 'Otro jugador borra la meta', '404 RESOURCE_NOT_FOUND', r.label);
  r = await call('DELETE', `/api/v1/goals/${looseGoalId}`, a);
  const gone = await call('GET', `/api/v1/goals/${looseGoalId}`, a);
  eq('Metas', 'Eliminación', 'Borrar una meta sin plan', '200 deleted; después 404', `${r.status} ${r.data?.effect}; después ${gone.status}`);

  // Plan (versión 1) con la meta: lo necesitan el archivo de la meta, las sesiones y el catálogo.
  const blockId = created.blockIds[0];
  r = await call('POST', `/api/v1/blocks/${blockId}/plans`, a, { goal_ids: [goalId], availability_minutes: 20 });
  const plan = r.data;
  if (r.status !== 201 || !plan?.exercises?.length) throw new Error(`No se pudo guardar el plan de la auditoría (${r.label}, ${plan?.exercises?.length ?? 0} ejercicios).`);
  const planRoute = `/api/v1/plans/${plan.plan_id}/versions/1`;
  const planBefore = (await call('GET', planRoute, a)).data;
  const planUnchanged = async () => (isDeepStrictEqual((await call('GET', planRoute, a)).data, planBefore) ? 'plan versión 1 idéntico' : 'plan versión 1 cambió');

  // ---------- Sesiones ----------
  const practiced = new Date(Date.now() - 3_600_000).toISOString();
  const sessionBody = minutes => ({ plan_version_id: plan.plan_version_id, plan_exercise_id: plan.exercises[0].plan_exercise_id,
    performed_at: practiced, duration_minutes: minutes, notes: 'Auditoría A39' });
  r = await call('POST', '/api/v1/sessions', a, sessionBody(20));
  const sessionId = r.data?.session_id;
  eq('Sesiones', 'Alta', 'Registrar 20 min en la versión 1 del plan', '201, versión 1, 20 min', `${r.status}, versión ${r.data?.version}, ${r.data?.duration_minutes} min`);
  r = await call('POST', '/api/v1/sessions', a, sessionBody(0));
  eq('Sesiones', 'Alta', 'Duración de 0 minutos', '400 INPUT_INVALID', r.label);
  r = await call('POST', '/api/v1/sessions', a, { ...sessionBody(10), performed_at: new Date(Date.now() + 86_400_000).toISOString() });
  eq('Sesiones', 'Alta', 'Fecha futura', '400 INPUT_INVALID', r.label);
  r = await call('POST', '/api/v1/sessions', null, sessionBody(10));
  eq('Sesiones', 'Alta', 'Sin sesión', '401 AUTH_REQUIRED', r.label);
  r = await call('POST', '/api/v1/sessions', b, sessionBody(10));
  eq('Sesiones', 'Alta', 'Otro jugador registra sobre el plan de A', '404 RESOURCE_NOT_FOUND', r.label);

  r = await call('GET', '/api/v1/sessions', a);
  eq('Sesiones', 'Consulta', 'Lista con el resumen de práctica', '200, 1 sesión, 20 min', `${r.status}, ${r.meta?.training?.session_count} sesión, ${r.meta?.training?.duration_minutes} min`);
  r = await call('GET', `/api/v1/sessions/${sessionId}`, a);
  eq('Sesiones', 'Consulta', 'Detalle de la sesión', '200, versión 1', `${r.status}, versión ${r.data?.version}`);
  r = await call('GET', `/api/v1/sessions/${sessionId}`, b);
  eq('Sesiones', 'Consulta', 'Otro jugador pide el detalle', '404 RESOURCE_NOT_FOUND', r.label);

  r = await call('PATCH', `/api/v1/sessions/${sessionId}`, a, { duration_minutes: 35 });
  eq('Sesiones', 'Edición', 'Corregir a 35 min', '200, versión 2, 35 min', `${r.status}, versión ${r.data?.version}, ${r.data?.duration_minutes} min`);
  let history = await sessionVersions(supabase, sessionId);
  eq('Sesiones', 'Edición', 'Historial después de corregir', '2 versiones; la 1 conserva 20 min', `${history.length} versiones; la 1 conserva ${history[0]?.minutes} min`);
  r = await call('PATCH', `/api/v1/sessions/${sessionId}`, a, { duration_minutes: 35 });
  eq('Sesiones', 'Edición', 'Enviar el mismo valor', '200, versión 2', `${r.status}, versión ${r.data?.version}`);
  r = await call('PATCH', `/api/v1/sessions/${sessionId}`, b, { duration_minutes: 1 });
  eq('Sesiones', 'Edición', 'Otro jugador corrige la sesión', '404 RESOURCE_NOT_FOUND', r.label);

  r = await call('POST', `/api/v1/blocks/${blockId}/plans`, a, { goal_ids: [goalId], availability_minutes: 20 });
  const planV2 = r.data;
  if (r.status !== 201 || planV2?.version !== 2 || !planV2.exercises?.length) throw new Error(`No se pudo guardar la versión 2 del plan (${r.label}).`);
  r = await call('PATCH', `/api/v1/sessions/${sessionId}`, a, { plan_exercise_id: planV2.exercises[0].plan_exercise_id });
  eq('Sesiones', 'Edición', 'Usar un ejercicio de la versión 2 del plan', '422 INPUT_INVALID', r.label);
  r = await call('GET', `/api/v1/sessions/${sessionId}`, a);
  eq('Sesiones', 'Edición', 'Vínculo después de guardar la versión 2 del plan', 'sigue en la versión 1',
    r.data?.plan_version_id === plan.plan_version_id ? 'sigue en la versión 1' : `versión ${r.data?.plan_version_id}`);

  r = await call('POST', '/api/v1/sessions', a, sessionBody(5));
  const secondId = r.data?.session_id;
  const before = (await call('GET', '/api/v1/sessions', a)).meta?.training;
  r = await call('DELETE', `/api/v1/sessions/${secondId}`, b);
  eq('Sesiones', 'Eliminación', 'Otro jugador borra la sesión', '404 RESOURCE_NOT_FOUND', r.label);
  r = await call('DELETE', `/api/v1/sessions/${secondId}`, a);
  const goneSession = await call('GET', `/api/v1/sessions/${secondId}`, a);
  eq('Sesiones', 'Eliminación', 'Borrar la segunda sesión (5 min)', '200 deleted; después 404', `${r.status} ${r.data?.effect}; después ${goneSession.status}`);
  const after = (await call('GET', '/api/v1/sessions', a)).meta?.training;
  eq('Sesiones', 'Eliminación', 'Recalcular la práctica declarada', 'antes 2 sesiones y 40 min; después 1 sesión y 35 min',
    `antes ${before?.session_count} sesiones y ${before?.duration_minutes} min; después ${after?.session_count} sesión y ${after?.duration_minutes} min`);
  const { data: deletedRow } = await supabase.from('sesiones').select('eliminado_en').eq('id_sesion', Number(secondId)).maybeSingle();
  eq('Sesiones', 'Eliminación', 'Registro de la sesión borrada', 'la fila se conserva con eliminado_en',
    deletedRow?.eliminado_en ? 'la fila se conserva con eliminado_en' : 'la fila no tiene eliminado_en');
  r = await call('DELETE', `/api/v1/sessions/${secondId}`, a);
  eq('Sesiones', 'Eliminación', 'Borrar la misma sesión otra vez', '404 RESOURCE_NOT_FOUND', r.label);

  // ---------- Metas: archivo de una meta enlazada ----------
  r = await call('DELETE', `/api/v1/goals/${goalId}`, a);
  const archived = await call('GET', `/api/v1/goals/${goalId}`, a);
  eq('Metas', 'Archivo', 'Borrar una meta enlazada a un plan', '200 archived; archived con 2 versiones',
    `${r.status} ${r.data?.effect}; ${archived.data?.status} con ${archived.data?.versions?.length} versiones`);
  const activeList = await call('GET', '/api/v1/goals', a);
  const archivedList = await call('GET', '/api/v1/goals?status=archived', a);
  eq('Metas', 'Archivo', 'Listas después de archivar', 'fuera de activas; en archivadas',
    `${activeList.data?.some(g => g.goal_id === goalId) ? 'en' : 'fuera de'} activas; ${archivedList.data?.some(g => g.goal_id === goalId) ? 'en' : 'fuera de'} archivadas`);
  r = await call('PATCH', `/api/v1/goals/${goalId}`, a, { target_value: 45 });
  eq('Metas', 'Archivo', 'Editar una meta archivada', '409 GOAL_ARCHIVED', r.label);
  eq('Metas', 'Archivo', 'El plan conserva la versión de la meta', 'plan versión 1 idéntico', await planUnchanged());

  // ---------- Ejercicios ----------
  const catalogIds = async (token, query = '') => {
    const res = await call('GET', '/api/v1/exercises' + query, token);
    return { res, list: res.data?.exercises ?? [] };
  };
  let catalog = await catalogIds(a);
  eq('Ejercicios', 'Consulta', 'El jugador consulta el catálogo', '200, solo ejercicios activos',
    `${catalog.res.status}, ${catalog.list.length && catalog.list.every(e => e.active) ? 'solo ejercicios activos' : 'con inactivos o vacío'}`);
  r = await call('GET', '/api/v1/exercises?include_inactive=true', a);
  eq('Ejercicios', 'Consulta', 'El jugador pide los inactivos', '403 ROLE_DENIED', r.label);
  r = await call('GET', '/api/v1/exercises', null);
  eq('Ejercicios', 'Consulta', 'Sin sesión', '401 AUTH_REQUIRED', r.label);

  r = await call('POST', '/api/v1/exercises', a, FICHA);
  if (r.data?.exercise_id) created.exerciseIds.push(r.data.exercise_id);
  eq('Ejercicios', 'Alta', 'El jugador crea un ejercicio', '403 ROLE_DENIED', r.label);
  r = await call('POST', '/api/v1/exercises', admin, { ...FICHA, title: '' });
  if (r.data?.exercise_id) created.exerciseIds.push(r.data.exercise_id);
  eq('Ejercicios', 'Alta', 'Ficha sin título', '400 INPUT_INVALID', r.label);
  r = await call('POST', '/api/v1/exercises', admin, FICHA);
  const exerciseId = r.data?.exercise_id;
  if (exerciseId) created.exerciseIds.push(exerciseId);
  eq('Ejercicios', 'Alta', 'El administrador crea un ejercicio', '201, versión 1, inactivo, not_in_reviewed_content',
    `${r.status}, versión ${r.data?.version}, ${r.data?.active ? 'activo' : 'inactivo'}, ${r.data?.technical_review_status}`);

  r = await call('GET', `/api/v1/exercises/${exerciseId}`, admin);
  eq('Ejercicios', 'Consulta', 'Detalle para el administrador', '200, versión 1, 10 min', `${r.status}, versión ${r.data?.version}, ${r.data?.ficha?.reference_duration_minutes} min`);
  const adminCatalog = await catalogIds(admin, '?include_inactive=true');
  catalog = await catalogIds(a);
  eq('Ejercicios', 'Consulta', 'Borrador inactivo en el catálogo', 'el administrador lo ve; el jugador no',
    `el administrador ${adminCatalog.list.some(e => e.exercise_id === exerciseId) ? 'lo ve' : 'no lo ve'}; el jugador ${catalog.list.some(e => e.exercise_id === exerciseId) ? 'sí' : 'no'}`);

  r = await call('PATCH', `/api/v1/exercises/${exerciseId}`, admin, { reference_duration_minutes: 15 });
  eq('Ejercicios', 'Edición', 'Cambiar la duración a 15 min', '200, versión 2, 15 min, versión nueva',
    `${r.status}, versión ${r.data?.version}, ${r.data?.ficha?.reference_duration_minutes} min, ${r.meta?.version_created ? 'versión nueva' : 'sin versión nueva'}`);
  eq('Ejercicios', 'Edición', 'Historial después de editar', '2 versiones; la 1 conserva 10 min',
    `${r.data?.versions?.length} versiones; la 1 conserva ${r.data?.versions?.[0]?.reference_duration_minutes} min`);
  r = await call('PATCH', `/api/v1/exercises/${exerciseId}`, admin, { active: true });
  eq('Ejercicios', 'Edición', 'Activar un ejercicio sin revisión técnica', '409 EXERCISE_NOT_VERIFIED', r.label);
  r = await call('PATCH', `/api/v1/exercises/${exerciseId}`, a, { reference_duration_minutes: 30 });
  eq('Ejercicios', 'Edición', 'El jugador edita un ejercicio', '403 ROLE_DENIED', r.label);

  r = await call('DELETE', `/api/v1/exercises/${exerciseId}`, a);
  eq('Ejercicios', 'Eliminación', 'El jugador borra un ejercicio', '403 ROLE_DENIED', r.label);
  r = await call('DELETE', `/api/v1/exercises/${exerciseId}`, admin);
  const goneExercise = await call('GET', `/api/v1/exercises/${exerciseId}`, admin);
  eq('Ejercicios', 'Eliminación', 'Borrar un ejercicio sin uso', '200 deleted; después 404', `${r.status} ${r.data?.effect}; después ${goneExercise.status}`);
  r = await call('DELETE', '/api/v1/exercises/999999999', admin);
  eq('Ejercicios', 'Eliminación', 'Borrar un ejercicio que no existe', '404 RESOURCE_NOT_FOUND', r.label);

  const { data: usedVersion, error: usedError } = await supabase.from('ejercicio_versiones').select('id_ejercicio')
    .eq('id_ejercicio_version', Number(plan.exercises[0].exercise_version_id)).single();
  if (usedError) throw new Error('No se pudo identificar el ejercicio del plan: ' + usedError.message);
  const usedId = String(usedVersion.id_ejercicio);
  r = await call('PATCH', `/api/v1/exercises/${usedId}`, admin, { active: false });
  if (r.meta?.status_changed) created.reactivate.push(usedId);
  catalog = await catalogIds(a);
  eq('Ejercicios', 'Archivo', 'Desactivar un ejercicio usado en un plan', '200, inactivo; fuera del catálogo del jugador',
    `${r.status}, ${r.data?.active ? 'activo' : 'inactivo'}; ${catalog.list.some(e => e.exercise_id === usedId) ? 'sigue en el' : 'fuera del'} catálogo del jugador`);
  eq('Ejercicios', 'Archivo', 'El plan conserva el ejercicio', 'plan versión 1 idéntico', await planUnchanged());
  r = await call('DELETE', `/api/v1/exercises/${usedId}`, admin);
  const kept = await call('GET', `/api/v1/exercises/${usedId}`, admin);
  eq('Ejercicios', 'Archivo', 'Borrar un ejercicio usado en un plan', '200 already_inactive; el ejercicio se conserva',
    `${r.status} ${r.data?.effect}; el ejercicio ${kept.status === 200 ? 'se conserva' : 'ya no existe'}`);
  r = await call('PATCH', `/api/v1/exercises/${usedId}`, admin, { active: true });
  if (r.data?.active) created.reactivate.length = 0;
  catalog = await catalogIds(a);
  eq('Ejercicios', 'Archivo', 'Reactivar el ejercicio', '200, activo; de vuelta en el catálogo del jugador',
    `${r.status}, ${r.data?.active ? 'activo' : 'inactivo'}; ${catalog.list.some(e => e.exercise_id === usedId) ? 'de vuelta en el' : 'fuera del'} catálogo del jugador`);
}

function matrix(section) {
  const rows = results.filter(r => r.section === section);
  return ['| # | Operación | Caso | Esperado | Obtenido | OK |', '| --- | --- | --- | --- | --- | --- |',
    ...rows.map((r, i) => `| ${i + 1} | ${r.operation} | ${r.name} | ${r.expected} | ${r.obtained} | ${r.ok ? 'Sí' : 'NO'} |`)].join('\n');
}

function integrityTable(rows) {
  return ['| Consulta | Filas inválidas |', '| --- | --- |', ...rows.map(r => `| \`${r.check}\` | ${r.invalid} |`)].join('\n');
}

function document({ date, commit, passed, withData, afterCleanup }) {
  const count = section => { const rows = results.filter(r => r.section === section); return `${rows.filter(r => r.ok).length} de ${rows.length}`; };
  const same = isDeepStrictEqual(withData, afterCleanup);
  return `# Resultados de los tres CRUD y de la integridad (A39)

Este archivo lo genera \`scripts/auditoria-a39.cjs --doc\` con el resultado de una ejecución real. No se edita a mano.

| Dato | Valor |
| --- | --- |
| Fecha de ejecución | ${date} |
| Commit base | \`${commit}\` |
| Entorno | Supabase de desarrollo, Express local |
| Resultado | ${passed} de ${results.length} casos correctos; ${withData.filter(r => r.invalid > 0).length} consultas de integridad con filas inválidas |

## Cómo se ejecutó

1. La auditoría levanta la aplicación Express real y llama a las rutas por HTTP con tres identidades: el jugador A (\`TEST_A\`), el jugador B (\`TEST_B\`) y el administrador.
2. Rol, estado, propiedad, validación, repositorios y base de datos son los reales. Solo se sustituye la verificación del token de Supabase Auth, que ya cubre \`scripts/prueba-auth.ps1\` ([resultado](prueba-auth.md)).
3. El bloque de cinco replays es sintético. El plan se guarda con \`POST /api/v1/blocks/:blockId/plans\`.
4. Al terminar, la auditoría borra lo que creó y reactiva el ejercicio que desactivó.

Para repetirla:

\`\`\`
node --env-file=.env scripts/auditoria-a39.cjs --doc
\`\`\`

Antes hay que ejecutar en el SQL Editor \`database/migraciones/a31-historial-sesiones.sql\` y \`database/migraciones/a39-auditoria.sql\`.

## Metas (\`/api/v1/goals\`) · ${count('Metas')}

Editar crea una versión nueva. Borrar elimina la meta si no está en ningún plan; si está enlazada, la archiva y conserva sus versiones.

${matrix('Metas')}

## Sesiones (\`/api/v1/sessions\`) · ${count('Sesiones')}

Corregir crea una versión nueva. Borrar es lógico: la fila queda con \`eliminado_en\` y deja de contar en la práctica declarada.

${matrix('Sesiones')}

## Ejercicios (\`/api/v1/exercises\`) · ${count('Ejercicios')}

Solo el administrador crea, edita y borra. Un ejercicio usado en un plan no se elimina: se desactiva, y el plan guardado conserva su versión.

${matrix('Ejercicios')}

## Integridad

\`a39_auditar_integridad()\` cuenta las filas que rompen cada regla en toda la base. Se ejecutó con los datos de la auditoría todavía guardados (una meta archivada con dos versiones, dos versiones del plan, una sesión corregida y otra borrada)${same ? ' y otra vez después de borrarlos, con el mismo resultado' : ''}.

${integrityTable(withData)}
${same ? '' : `\nDespués de borrar los datos de la auditoría:\n\n${integrityTable(afterCleanup)}\n`}
| Consulta | Regla |
| --- | --- |
| \`objetivos_sin_version\`, \`sesiones_sin_version\`, \`ejercicios_sin_version\` | Cada meta, sesión y ejercicio tiene al menos una versión. |
| \`*_versiones_no_consecutivas\` | Las versiones van de 1 a n sin huecos: ninguna se borró ni se reescribió. |
| \`objetivo_versiones_sin_activar\` | Toda versión de meta guardada está activada. |
| \`objetivos_activos_duplicados\` | Una sola meta activa por jugador, modalidad y tipo. |
| \`objetivos_archivo_incoherente\`, \`sesiones_baja_incoherente\` | El estado y la fecha de archivo o de baja coinciden. |
| \`plan_objetivo_de_otro_propietario\` | Un plan solo enlaza metas del mismo jugador. |
| \`plan_ejercicio_orden_repetido\` | Un plan no repite el orden de un ejercicio. |
| \`analisis_base_de_otro_propietario\` | La línea base de un análisis es un bloque del mismo jugador. |
| \`sesion_versiones_sin_ejercicio\` | Cada versión de sesión registra su ejercicio y sus minutos. |
| \`sesion_ejercicio_de_otro_plan\` | Una sesión solo usa ejercicios de la versión del plan a la que está ligada. |
| \`ejercicios_activos_eliminados\` | Un ejercicio eliminado no queda activo. |
| \`rangos_fuente_no_declarada\` | Todo rango es declarado por el jugador (\`self_reported\`). |

Las reglas que la base ya impide por sí misma están en las pruebas de cada tarea: [metas](a16-objetivos.md), [planes](a24-planes.md), [sesiones](a21-sesiones.md), [rango e historial](a31-rangos.md) y [catálogo](a32-admin.md).

## Seed de demo

\`scripts/seed-demo.cjs\` deja un perfil de desarrollo con datos de demostración coherentes y comprueba la integridad al terminar.

\`\`\`
node --env-file=.env scripts/seed-demo.cjs              crea los datos en TEST_B
node --env-file=.env scripts/seed-demo.cjs --reset      borra los datos de TEST_B
node --env-file=.env scripts/seed-demo.cjs --account TEST_A
\`\`\`

Solo acepta cuentas \`TEST_\` o \`DEMO_\`. Antes de crear, borra los bloques, planes, sesiones, metas y rangos de esa cuenta.

| Dato | Contenido |
| --- | --- |
| Rango declarado | Dos registros en 2v2: Platinum III hace 28 días y Diamond I hace 7 días. |
| Bloques | Dos bloques 2v2 ranked de cinco replays sintéticos: 25 % de tiro hace 14 días y 30 % hace 2 días. |
| Metas | Rendimiento (versión 1 con 30 %, versión 2 con 35 %) y entrenamiento (60 min). |
| Planes | Uno por bloque. El primero usa la versión 1 de la meta de rendimiento; el segundo, la versión 2. |
| Sesiones | Tres activas sobre el primer plan (20, 25 y 20 min; la última corregida desde 15) y una borrada. |

Las metas se activan al crearse, así que la de rendimiento queda sin datos suficientes hasta que se suba un bloque posterior. La de entrenamiento sí se evalúa con las sesiones del seed.
`;
}

async function main() {
  const supabase = createServerClient();
  if (!supabase) throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.');
  const A = await profileByAccount(supabase, 'TEST_A');
  const B = await profileByAccount(supabase, 'TEST_B');
  const { data: admins, error: adminError } = await supabase.from('usuarios').select('id_usuario')
    .eq('rol', 'administrador').eq('estado', 'activo').limit(1);
  if (adminError || !admins?.length) throw new Error('No hay un administrador activo en el entorno de desarrollo.');
  await requireSessionCleanup(supabase, A.userId);
  await integrity(supabase);

  const { count: goalCount } = await supabase.from('objetivos').select('*', { count: 'exact', head: true }).eq('id_usuario', A.userId);
  const { count: blockCount } = await supabase.from('bloques').select('*', { count: 'exact', head: true }).eq('id_usuario', A.userId);
  if (goalCount || blockCount) throw new Error('TEST_A tiene metas o bloques guardados. Bórralos antes (node --env-file=.env scripts/seed-demo.cjs --account TEST_A --reset).');

  const tokens = { a: crypto.randomBytes(24).toString('hex'), b: crypto.randomBytes(24).toString('hex'), admin: crypto.randomBytes(24).toString('hex') };
  const identities = new Map([[tokens.a, A.userId], [tokens.b, B.userId], [tokens.admin, admins[0].id_usuario]]);
  const created = { blockIds: [], goalIds: [], exerciseIds: [], reactivate: [] };
  let server = null, withData = null, afterCleanup = null, failure = null;

  try {
    const block = await blocks.createBlock(supabase, A.userId, { mode: '2v2', match_type: 'ranked', status: 'ready',
      replays: [1, 2, 3, 4, 5].map(position => syntheticReplay(A, { prefix: 'a39-auditoria', position,
        hash: crypto.randomBytes(32).toString('hex'), goals: position === 1 ? 2 : 1, playedAt: `2026-11-15T1${position}:00:00Z` })) });
    created.blockIds.push(block.block_id);

    server = createApp({ supabase: withAuditIdentities(supabase, identities) }).listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const call = client('http://127.0.0.1:' + server.address().port);

    await audit({ supabase, call, A, B, tokens, created });
    withData = await integrity(supabase);
  } catch (error) {
    failure = error;
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    const admin = require('../src/repositories/exercises-admin');
    for (const id of created.reactivate) {
      try { await admin.setActive(supabase, id, true); } catch (err) { console.error(`No se pudo reactivar el ejercicio ${id}: ${err.message}`); }
    }
    for (const id of created.exerciseIds) {
      try { await removeExercise(supabase, id); } catch (err) { console.error(`No se pudo borrar el ejercicio ${id}: ${err.message}`); }
    }
    await removeBlocks(supabase, A.userId, created.blockIds);
    await removeGoals(supabase, A.userId, created.goalIds);
    console.log('Datos de la auditoría borrados y catálogo restaurado.');
  }
  if (failure) throw failure;
  afterCleanup = await integrity(supabase);

  for (const section of SECTIONS) console.log(`\n${section}\n${matrix(section)}`);
  console.log('\nIntegridad con los datos de la auditoría\n' + integrityTable(withData));
  if (!isDeepStrictEqual(withData, afterCleanup)) console.log('\nIntegridad después de borrar\n' + integrityTable(afterCleanup));

  const passed = results.filter(r => r.ok).length;
  const invalid = withData.filter(r => r.invalid > 0).length;
  console.log(`\n${passed}/${results.length} casos correctos; ${invalid} consultas de integridad con filas inválidas.`);

  if (process.argv.includes('--doc')) {
    let commit = 'desconocido';
    try { commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).trim(); } catch { /* sin git */ }
    const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Monterrey', dateStyle: 'short', timeStyle: 'short' }).format(new Date()) + ' (America/Monterrey)';
    const file = path.join(__dirname, '../docs/resultados-crud.md');
    fs.writeFileSync(file, document({ date, commit, passed, withData, afterCleanup }));
    console.log('Resultado escrito en docs/resultados-crud.md.');
  }
  process.exitCode = passed === results.length && invalid === 0 ? 0 : 1;
}

main().catch(err => { console.error('Error:', err.message); process.exitCode = 1; });
