'use strict';

// Pruebas de A23 con un Supabase simulado: no necesitan claves ni internet.
// La prueba contra Supabase real está en scripts/prueba-a23.cjs.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const content = require('../planning/catalogo-ejercicios.v1.json');
const verification = require('../planning/catalogo-verificacion.v1.json');
const { seedPlan, normalizeCatalog, compatibleExercises, validateVerification } = require('../src/domain/catalog');
const { getCatalog } = require('../src/repositories/catalog');
const { generatePlan } = require('../src/domain/plans');
const { buildSeed, OUT } = require('../scripts/generar-seed-a23.cjs');
const { createApp } = require('../src/app');
const { makePlanInput } = require('./helpers/plan-inputs.cjs');

const [GROUND, MID, COCO] = ['castro-ground-shots', 'castro-mid-height-shots', 'coco-aim-training'];

// Las pruebas no dependen del estado real del registro: parten de una copia con todo pendiente.
const pending = structuredClone(verification);
for (const v of pending.exercises) Object.assign(v, { status: 'pending', checked_on: null, method: null });

/** Registro de comprobación con los ejercicios indicados como verified (solo para pruebas). */
function verifiedRecord(keys = [GROUND, MID, COCO]) {
  const record = structuredClone(pending);
  for (const v of record.exercises) {
    if (keys.includes(v.exercise_key)) Object.assign(v, { status: 'verified', checked_on: '2026-11-16', method: 'prueba sintética' });
  }
  return record;
}

/** Filas como las devolvería PostgREST después de ejecutar el seed. */
function dbRows(record, { inactive = [] } = {}) {
  return seedPlan(content, record).map((rows, index) => ({
    id_ejercicio: index + 1,
    activo: rows.ejercicios.activo && !inactive.includes(rows.exercise_key),
    eliminado_en: null,
    ejercicio_versiones: [{
      id_ejercicio_version: 100 + index,
      ...rows.ejercicio_versiones,
      ejercicio_plataforma: rows.ejercicio_plataforma.map(plataforma => ({ plataforma })),
    }],
  }));
}

const keysOf = list => list.map(e => e.exercise_key);
const STEAM_WS = { platform: 'steam', mode: '2v2', workshop_access: true };
const STEAM = { platform: 'steam', mode: '2v2', workshop_access: false };
const EPIC = { platform: 'epic', mode: '3v3', workshop_access: false };

test('el seed guardado coincide con lo que generan las fichas y el registro actuales', () => {
  assert.equal(fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n'), buildSeed(content, verification),
    'Ejecuta: node scripts/generar-seed-a23.cjs');
});

test('mapeo ficha → tablas: código para Custom Training, enlace para Workshop, plataformas en filas', () => {
  const [ground, , coco] = seedPlan(content, pending);
  assert.equal(ground.ejercicio_versiones.codigo_enlace, '9472-6A26-7F5D-767B');
  assert.equal(ground.ejercicio_versiones.categoria, 'shooting');
  assert.equal(ground.ejercicio_versiones.minutos_base, 10);
  assert.equal(ground.ejercicio_versiones.instrucciones.split('\n').length, 5);
  assert.deepEqual(ground.ejercicio_plataforma, ['epic', 'steam']);
  assert.equal(coco.ejercicio_versiones.codigo_enlace, 'https://steamcommunity.com/sharedfiles/filedetails/?id=1906378036');
  assert.deepEqual(coco.ejercicio_plataforma, ['steam']);
});

test('sin comprobación técnica el seed los deja inactivos y el generador no propone nada', () => {
  assert.ok(seedPlan(content, pending).every(r => r.ejercicios.activo === false));
  const catalog = normalizeCatalog(dbRows(pending), content, pending);
  assert.ok(catalog.exercises.every(e => e.active === false && e.technical_review_status === 'pending'));
  const input = makePlanInput();
  const plan = generatePlan({ ...input, catalog });
  assert.equal(plan.exercises.length, 0);
  assert.ok(plan.reason_codes.includes('NO_VERIFIED_ACTIVE_EXERCISE'));
});

test('el registro rechaza verified sin fecha/método, duplicados y claves desconocidas', () => {
  const sinFecha = structuredClone(pending);
  sinFecha.exercises[0].status = 'verified';
  assert.throws(() => validateVerification(content, sinFecha), /sin fecha/);
  const duplicado = structuredClone(pending);
  duplicado.exercises.push(structuredClone(duplicado.exercises[0]));
  assert.throws(() => validateVerification(content, duplicado), /duplicado/);
  const desconocido = structuredClone(pending);
  desconocido.exercises[0].exercise_key = 'inventado';
  assert.throws(() => validateVerification(content, desconocido), /no existe/);
});

test('normaliza al formato de A18: ids como cadena, variantes de CoCo y recurso completo', () => {
  const record = verifiedRecord();
  const catalog = normalizeCatalog(dbRows(record), content, record);
  assert.equal(catalog.source, 'database');
  assert.deepEqual(keysOf(catalog.exercises), [GROUND, MID, COCO]);
  const [ground, , coco] = catalog.exercises;
  assert.equal(ground.exercise_id, '1');
  assert.equal(ground.exercise_version_id, '100');
  assert.equal(ground.resource_code, '9472-6A26-7F5D-767B');
  assert.match(ground.resource_url, /^https:\/\/docs\.google\.com\//);
  assert.equal(ground.technical_review_status, 'verified');
  assert.equal(coco.resource_code, null);
  assert.equal(coco.variants.length, 5);
});

test('dos contextos de plataforma: Steam con Workshop recibe 3, Epic recibe los 2 de Castro', () => {
  const record = verifiedRecord();
  const catalog = normalizeCatalog(dbRows(record), content, record);
  const steam = compatibleExercises(catalog, STEAM_WS);
  assert.equal(steam.coverage, 'complete');
  assert.deepEqual(keysOf(steam.exercises), [GROUND, MID, COCO]);
  const epic = compatibleExercises(catalog, EPIC);
  assert.equal(epic.coverage, 'complete');
  assert.deepEqual(keysOf(epic.exercises), [GROUND, MID]);
  assert.deepEqual(epic.excluded, [{ exercise_key: COCO, reason: 'PLATFORM_INCOMPATIBLE' }]);
});

test('Steam sin acceso confirmado a Workshop no recibe CoCo', () => {
  const record = verifiedRecord();
  const result = compatibleExercises(normalizeCatalog(dbRows(record), content, record), STEAM);
  assert.equal(result.coverage, 'complete');
  assert.deepEqual(result.excluded, [{ exercise_key: COCO, reason: 'WORKSHOP_UNAVAILABLE' }]);
});

test('un ejercicio inactivo no se ofrece aunque esté verificado: cobertura parcial explicada', () => {
  const record = verifiedRecord();
  const catalog = normalizeCatalog(dbRows(record, { inactive: [MID] }), content, record);
  const result = compatibleExercises(catalog, EPIC);
  assert.equal(result.coverage, 'partial');
  assert.deepEqual(result.reason_codes, ['CATALOG_PARTIAL']);
  assert.deepEqual(result.missing_keys, [MID]);
  assert.deepEqual(result.excluded.find(e => e.exercise_key === MID), { exercise_key: MID, reason: 'INACTIVE' });
});

test('sin cobertura se devuelve vacío explícito, sin forzar ejercicios', () => {
  const vacio = compatibleExercises(normalizeCatalog([], content, pending), EPIC);
  assert.equal(vacio.coverage, 'empty');
  assert.deepEqual(vacio.reason_codes, ['NO_CATALOG_COVERAGE']);
  const pendientes = compatibleExercises(normalizeCatalog(dbRows(pending), content, pending), STEAM_WS);
  assert.equal(pendientes.coverage, 'empty');
  assert.ok(pendientes.excluded.every(e => e.reason === 'INACTIVE'));
});

test('verificado solo un ejercicio: el resto queda fuera aunque alguien lo active en la base', () => {
  const record = verifiedRecord([GROUND]);
  const rows = dbRows(record).map(r => ({ ...r, activo: true }));
  const result = compatibleExercises(normalizeCatalog(rows, content, record), STEAM_WS);
  assert.deepEqual(keysOf(result.exercises), [GROUND]);
  assert.ok(result.excluded.every(e => e.reason === 'UNVERIFIED_RESOURCE'));
});

test('si la base no coincide con la ficha revisada, el ejercicio no cuenta como verificado', () => {
  const record = verifiedRecord();
  const rows = dbRows(record);
  rows[1].ejercicio_versiones[0].codigo_enlace = 'AAAA-BBBB-CCCC-DDDD';
  const catalog = normalizeCatalog(rows, content, record);
  assert.equal(catalog.exercises[1].technical_review_status, 'content_mismatch');
  assert.ok(compatibleExercises(catalog, EPIC).excluded.some(e => e.exercise_key === MID && e.reason === 'UNVERIFIED_RESOURCE'));
});

test('versiones: se ofrece la vigente y la histórica se conserva sin modificarse', () => {
  const record = verifiedRecord();
  const rows = dbRows(record);
  const v1 = rows[0].ejercicio_versiones[0];
  const v2 = { ...structuredClone(v1), id_ejercicio_version: 200, version: 2, minutos_base: 12 };
  rows[0].ejercicio_versiones.push(v2);
  const before = structuredClone(rows);
  const catalog = normalizeCatalog(rows, content, record);
  const ground = catalog.exercises[0];
  assert.equal(ground.content_version, 2);
  assert.equal(ground.exercise_version_id, '200');
  assert.equal(ground.history_versions, 2);
  // La versión 2 aún no está en las fichas de Roberto: no se acredita como revisada.
  assert.equal(ground.technical_review_status, 'not_in_reviewed_content');
  assert.deepEqual(rows, before);
});

test('eliminados no aparecen y un duplicado no reemplaza al original', () => {
  const record = verifiedRecord();
  const rows = dbRows(record);
  rows[2].eliminado_en = '2026-11-16T00:00:00Z';
  rows[2].activo = false;
  rows.push({ ...structuredClone(rows[0]), id_ejercicio: 9 });
  const catalog = normalizeCatalog(rows, content, record);
  assert.deepEqual(keysOf(catalog.exercises), [GROUND, MID, 'db-9']);
  assert.equal(catalog.exercises[2].technical_review_status, 'duplicate');
});

test('el catálogo normalizado alimenta generatePlan con el reparto aprobado (20 min con Workshop)', () => {
  const record = verifiedRecord();
  const catalog = normalizeCatalog(dbRows(record), content, record);
  const plan = generatePlan({ ...makePlanInput({ minutes: 20 }), catalog });
  assert.equal(plan.catalog_source, 'database');
  assert.deepEqual(Object.fromEntries(plan.exercises.map(e => [e.exercise_key, e.assigned_minutes])),
    { [GROUND]: 10, [COCO]: 5, [MID]: 5 });
  assert.ok(plan.exercises.every(e => /^\d+$/.test(e.exercise_version_id)));
});

// ── Consulta (repositorio) ────────────────────────────────────────────────

function fakeSupabase(rows, { error = null } = {}) {
  const calls = [];
  return {
    calls,
    from(table) {
      const q = { table, filters: [] };
      calls.push(q);
      const chain = {
        select(cols) { q.select = cols; return chain; },
        is(col, val) { q.filters.push(['is', col, val]); return chain; },
        eq(col, val) { q.filters.push(['eq', col, val]); return chain; },
        then(resolve, reject) {
          const data = rows.filter(r => q.filters.every(([, c, v]) => r[c] === v));
          return Promise.resolve(error ? { data: null, error } : { data, error: null }).then(resolve, reject);
        },
      };
      return chain;
    },
  };
}

test('getCatalog filtra eliminados y, para jugador, solo activos', async () => {
  const record = verifiedRecord([GROUND]);
  const sb = fakeSupabase(dbRows(record));
  const catalog = await getCatalog(sb, { verification: record });
  assert.deepEqual(sb.calls[0].filters, [['is', 'eliminado_en', null], ['eq', 'activo', true]]);
  assert.deepEqual(keysOf(catalog.exercises), [GROUND]);
  const all = await getCatalog(sb, { includeInactive: true, verification: record });
  assert.deepEqual(sb.calls[1].filters, [['is', 'eliminado_en', null]]);
  assert.equal(all.exercises.length, 3);
});

test('getCatalog: error de Supabase → 503 sin filtrar el mensaje original', async () => {
  await assert.rejects(getCatalog(fakeSupabase([], { error: { message: 'secreto' } })),
    e => e.status === 503 && e.code === 'PROVIDER_UNAVAILABLE' && !e.message.includes('secreto'));
  await assert.rejects(getCatalog(null), e => e.status === 503);
});

// ── Ruta GET /api/v1/exercises ────────────────────────────────────────────

test('GET /api/v1/exercises: jugador ve activos, no puede pedir inactivos; admin sí', async () => {
  const users = { 'token-a': { id_usuario: 'a', rol: 'jugador', estado: 'activo' },
    'token-admin': { id_usuario: 'ad', rol: 'administrador', estado: 'activo' } };
  const rows = dbRows(pending);
  const sb = {
    auth: { async getUser(t) { return users[t] ? { data: { user: { id: users[t].id_usuario } }, error: null } : { data: {}, error: {} }; } },
    from(table) {
      if (table === 'usuarios') {
        let id;
        const chain = { select: () => chain, eq: (_c, v) => { id = v; return chain; },
          maybeSingle: async () => ({ data: Object.values(users).find(u => u.id_usuario === id) ?? null, error: null }) };
        return chain;
      }
      return fakeSupabase(rows).from(table);
    },
  };
  const app = createApp({ supabase: sb });
  const server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api/v1/exercises`;
  const get = async (q, token) => {
    const res = await fetch(base + q, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return { status: res.status, body: await res.json() };
  };
  try {
    assert.equal((await get('', null)).status, 401);
    const player = await get('', 'token-a');
    assert.equal(player.status, 200);
    assert.equal(player.body.data.exercises.length, 0); // todo pendiente → nada activo
    assert.equal((await get('?include_inactive=true', 'token-a')).body.error.code, 'ROLE_DENIED');
    const admin = await get('?include_inactive=true', 'token-admin');
    assert.equal(admin.status, 200);
    assert.equal(admin.body.data.exercises.length, 3);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
