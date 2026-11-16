'use strict';

// Pruebas de A15 con un Supabase simulado: no necesitan claves ni internet.
// Comprueban mapeo SQL ↔ API, filtro por propietario, null conservados y errores.
// La prueba contra Supabase real está en scripts/prueba-a15.cjs.
const test = require('node:test');
const assert = require('node:assert/strict');
const profiles = require('../src/repositories/profile');
const blocks = require('../src/repositories/blocks');
const { ApiError } = require('../src/middleware/auth');

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';

/**
 * Cliente simulado: registra cada consulta (tabla, operaciones, filtros) y
 * responde con lo que devuelva `respond(query)`.
 */
function fakeSupabase(respond) {
  const calls = [];
  function builder(table) {
    const query = { table, ops: [], filters: {} };
    calls.push(query);
    const finish = () => Promise.resolve(respond(query));
    const chain = {
      select(cols) { query.ops.push(['select', cols]); return chain; },
      insert(row) { query.ops.push(['insert', row]); return chain; },
      upsert(row, opts) { query.ops.push(['upsert', row, opts]); return chain; },
      update(row) { query.ops.push(['update', row]); return chain; },
      eq(col, val) { query.filters[col] = val; return chain; },
      order(col, opts) { query.ops.push(['order', col, opts]); return chain; },
      maybeSingle() { query.single = 'maybe'; return finish(); },
      single() { query.single = 'one'; return finish(); },
      then(resolve, reject) { return finish().then(resolve, reject); },
    };
    return chain;
  }
  return {
    calls,
    from: builder,
    rpc(fn, args) {
      const query = { rpc: fn, args };
      calls.push(query);
      return Promise.resolve(respond(query));
    },
  };
}

// Fila de bloque como la devuelve PostgREST con relaciones embebidas.
function blockRow(overrides = {}) {
  return {
    id_bloque: 7,
    modalidad: '2v2',
    tipo_partida: 'ranked',
    ballchasing_grupo_id: null,
    estado: 'procesando',
    creado_en: '2026-11-15T20:00:00+00:00',
    completado_en: null,
    metricas_bloque: null,
    replays: [
      {
        posicion: 2, nombre_archivo: 'b.replay', ballchasing_id: null, estado: 'pending', error: null,
        origen_carga: 'propia', visibilidad: 'private', acceso_verificado: false, grupo_verificado: false,
        limpieza_estado: 'pendiente',
        jugadores_replay: {
          plataforma: 'steam', cuenta_jugador: 'TEST_A', tiempo_jugado_s: null,
          archivos_replay: { hash_archivo: 'b'.repeat(64), tamano_bytes: 2000, modalidad: '2v2', tipo_partida: 'ranked', fecha_partida: null, duracion_s: null },
          metricas_replay: null,
        },
      },
      {
        posicion: 1, nombre_archivo: 'a.replay', ballchasing_id: 'bc-1', estado: 'ok', error: null,
        origen_carga: 'reutilizada', visibilidad: 'private', acceso_verificado: true, grupo_verificado: true,
        limpieza_estado: 'pendiente',
        jugadores_replay: [{
          plataforma: 'steam', cuenta_jugador: 'TEST_A', tiempo_jugado_s: 300.5,
          archivos_replay: [{ hash_archivo: 'a'.repeat(64), tamano_bytes: 1000, modalidad: '2v2', tipo_partida: 'ranked', fecha_partida: '2026-11-15T19:00:00+00:00', duracion_s: 310 }],
          metricas_replay: [{ tiros: 4, goles: 1, asistencias: 0, salvadas: 2, puntos: 350, boost_cero_s: null, boost_bajo_s: null, pads_pequenos: null, velocidad_media: null, distancia_companeros: null, zona_defensiva_s: null }],
        }],
      },
    ],
    ...overrides,
  };
}

// --- perfil -----------------------------------------------------------------

const PROFILE = {
  gamertag: 'Prueba A', platform: 'steam', player_id: 'TEST_A', mode: '2v2',
  available_minutes: 30, days_per_week: 3, timezone: 'America/Monterrey',
};

test('perfil: se lee solo el del usuario de la sesión y se mapea a la API', async () => {
  const db = fakeSupabase(() => ({
    data: { id_usuario: A, gamertag: 'Prueba A', plataforma: 'steam', cuenta_juego_id: 'TEST_A', modalidad_principal: '2v2', minutos_sesion: 30, dias_semana: 3, zona_horaria: 'America/Monterrey' },
    error: null,
  }));
  const profile = await profiles.getProfile(db, A);
  assert.deepEqual(db.calls[0].filters, { id_usuario: A });
  assert.deepEqual(profile, { id: A, ...PROFILE });
});

test('perfil: sin fila devuelve null', async () => {
  const db = fakeSupabase(() => ({ data: null, error: null }));
  assert.equal(await profiles.getProfile(db, A), null);
});

test('perfil: guardar usa el id de la sesión e ignora id/user_id del cliente', async () => {
  const db = fakeSupabase(query => ({ data: query.ops[0][1], error: null }));
  const saved = await profiles.saveProfile(db, A, { ...PROFILE, id: B, user_id: B, gamertag: '  Prueba A  ' });
  const [op, row, opts] = db.calls[0].ops[0];
  assert.equal(op, 'upsert');
  assert.equal(row.id_usuario, A);
  assert.equal(row.gamertag, 'Prueba A');
  assert.deepEqual(opts, { onConflict: 'id_usuario' });
  assert.equal(saved.id, A);
});

test('perfil: faltan campos obligatorios → 422 sin consultar la base', async () => {
  const db = fakeSupabase(() => assert.fail('no debería consultar'));
  await assert.rejects(profiles.saveProfile(db, A, { gamertag: 'X' }), err =>
    err instanceof ApiError && err.status === 422 && /platform/.test(err.message));
});

test('perfil: un CHECK de la base (días fuera de rango) → 422 INPUT_INVALID', async () => {
  const db = fakeSupabase(() => ({ data: null, error: { code: '23514', message: 'ck_perfiles_dias' } }));
  await assert.rejects(profiles.saveProfile(db, A, { ...PROFILE, days_per_week: 9 }), { status: 422, code: 'INPUT_INVALID' });
});

// --- bloques: lectura -------------------------------------------------------

test('bloque: filtra por id y propietario, ordena replays y conserva null', async () => {
  const db = fakeSupabase(() => ({ data: blockRow(), error: null }));
  const block = await blocks.getBlock(db, A, '7');
  assert.deepEqual(db.calls[0].filters, { id_bloque: '7', id_usuario: A });
  assert.equal(block.block_id, '7');
  assert.equal(block.status, 'processing');
  assert.equal(block.ready_replays, 1);
  assert.deepEqual(block.replays.map(r => r.position), [1, 2]);
  const [first, second] = block.replays;
  assert.equal(first.upload_origin, 'reused');
  assert.equal(first.file.duration_s, 310);
  assert.equal(first.metrics.shots, 4);
  assert.equal(first.metrics.boost_zero_s, null); // null se conserva, no se convierte en 0
  assert.equal(second.metrics, null); // replay sin métricas todavía
  assert.equal(second.player.time_played_s, null);
  assert.equal(block.metrics, null);
});

test('bloque: ajeno o inexistente devuelve null (la ruta responde 404)', async () => {
  const db = fakeSupabase(() => ({ data: null, error: null }));
  assert.equal(await blocks.getBlock(db, B, '7'), null);
});

test('bloque: id con formato no numérico devuelve null sin consultar', async () => {
  const db = fakeSupabase(() => assert.fail('no debería consultar'));
  assert.equal(await blocks.getBlock(db, A, 'block-0001'), null);
  assert.equal(await blocks.getBlock(db, A, '7 OR 1=1'), null);
});

test('lista: solo bloques del propietario, recientes primero', async () => {
  const db = fakeSupabase(() => ({
    data: [{ id_bloque: 9, modalidad: '2v2', tipo_partida: 'ranked', estado: 'completo', creado_en: 'x', completado_en: 'y', replays: Array(5).fill({ estado: 'ok' }) }],
    error: null,
  }));
  const list = await blocks.listBlocks(db, A);
  assert.deepEqual(db.calls[0].filters, { id_usuario: A });
  assert.deepEqual(db.calls[0].ops.find(op => op[0] === 'order'), ['order', 'creado_en', { ascending: false }]);
  assert.equal(list[0].status, 'ready');
  assert.equal(list[0].ready_replays, 5);
});

// --- bloques: escritura -----------------------------------------------------

const NEW_BLOCK = {
  user_id: B, // debe ignorarse
  mode: '2v2',
  match_type: 'ranked',
  status: 'pending',
  replays: [{
    position: 1, file_name: 'a.replay', status: 'pending',
    file: { hash: 'a'.repeat(64), size_bytes: 1000, mode: '2v2', match_type: 'ranked' },
    player: { platform: 'steam', player_id: 'TEST_A' },
    metrics: { shots: 4, goals: null },
  }],
};

test('crear: usa la función transaccional con el usuario de la sesión y el mapeo SQL', async () => {
  const db = fakeSupabase(query => (query.rpc ? { data: 7, error: null } : { data: blockRow(), error: null }));
  const block = await blocks.createBlock(db, A, NEW_BLOCK);
  const { rpc, args } = db.calls[0];
  assert.equal(rpc, 'a15_guardar_bloque');
  assert.equal(args.p_id_usuario, A);
  assert.equal(args.p_bloque.estado, 'borrador');
  const replay = args.p_bloque.replays[0];
  assert.equal(replay.origen_carga, 'propia');
  assert.equal(replay.limpieza_estado, 'pendiente');
  assert.equal(replay.archivo.hash_archivo, 'a'.repeat(64));
  assert.equal(replay.archivo.fecha_partida, null);
  assert.equal(replay.jugador.cuenta_jugador, 'TEST_A');
  assert.equal(replay.metricas.tiros, 4);
  assert.equal(replay.metricas.goles, null);
  assert.equal(args.p_bloque.metricas, null);
  assert.ok(!JSON.stringify(args).includes(B), 'el user_id del cliente no llega a la base');
  // Después de guardar, relee el bloque filtrando por propietario.
  assert.deepEqual(db.calls[1].filters, { id_bloque: '7', id_usuario: A });
  assert.equal(block.block_id, '7');
});

test('crear: más de 5 replays → 400 REPLAY_COUNT_INVALID sin consultar', async () => {
  const db = fakeSupabase(() => assert.fail('no debería consultar'));
  const replays = Array.from({ length: 6 }, (_, i) => ({ ...NEW_BLOCK.replays[0], position: i + 1 }));
  await assert.rejects(blocks.createBlock(db, A, { ...NEW_BLOCK, replays }), { status: 400, code: 'REPLAY_COUNT_INVALID' });
});

test('crear: estado desconocido → 422', async () => {
  const db = fakeSupabase(() => assert.fail('no debería consultar'));
  await assert.rejects(blocks.createBlock(db, A, { ...NEW_BLOCK, status: 'borrador' }), { status: 422 });
});

test('crear: replay repetido en el bloque (UNIQUE) → 409 DUPLICATE_REPLAY', async () => {
  const db = fakeSupabase(() => ({ data: null, error: { code: '23505', message: 'uq_replays_2' } }));
  await assert.rejects(blocks.createBlock(db, A, NEW_BLOCK), { status: 409, code: 'DUPLICATE_REPLAY' });
});

test('crear: fallo de conexión → 503 sin exponer el mensaje original', async () => {
  const db = fakeSupabase(() => ({ data: null, error: { code: 'XX000', message: 'detalle interno con datos' } }));
  await assert.rejects(blocks.createBlock(db, A, NEW_BLOCK), err =>
    err.status === 503 && err.code === 'PROVIDER_UNAVAILABLE' && !/detalle interno/.test(err.message));
});

test('estado: ready fija completado_en; otros estados lo dejan en null', async () => {
  const db = fakeSupabase(query => ({ data: query.ops[0]?.[0] === 'update' ? { id_bloque: 7 } : blockRow(), error: null }));
  await blocks.updateBlockStatus(db, A, '7', 'ready');
  const [, readyRow] = db.calls[0].ops[0];
  assert.equal(readyRow.estado, 'completo');
  assert.ok(readyRow.completado_en);
  assert.deepEqual(db.calls[0].filters, { id_bloque: '7', id_usuario: A });

  await blocks.updateBlockStatus(db, A, '7', 'invalid');
  const [, invalidRow] = db.calls[2].ops[0];
  assert.equal(invalidRow.estado, 'requiere_correccion');
  assert.equal(invalidRow.completado_en, null);
});

test('estado: bloque ajeno → 404', async () => {
  const db = fakeSupabase(() => ({ data: null, error: null }));
  await assert.rejects(blocks.updateBlockStatus(db, B, '7', 'ready'), { status: 404, code: 'RESOURCE_NOT_FOUND' });
});

test('métricas de bloque: comprueba propietario y hace upsert por id_bloque', async () => {
  const db = fakeSupabase(query => {
    if (query.table === 'metricas_bloque') return { data: null, error: null };
    if (query.ops[0][1] === 'id_bloque') return { data: { id_bloque: 7 }, error: null };
    return { data: blockRow(), error: null };
  });
  const calc = {
    metrics_version: 'mvp.metrics.v1',
    values: { goals: { value: 3 }, shots: { value: 12 }, play_duration_s: { value: 1500 }, shooting_pct: { value: 25 } },
  };
  await blocks.saveBlockMetrics(db, A, '7', blocks.metricsFromCalculation(calc));
  assert.deepEqual(db.calls[0].filters, { id_bloque: '7', id_usuario: A });
  const [op, row, opts] = db.calls[1].ops[0];
  assert.equal(op, 'upsert');
  assert.deepEqual(opts, { onConflict: 'id_bloque' });
  assert.deepEqual(row, {
    id_bloque: '7', version_calculo: 'mvp.metrics.v1', tiempo_jugado_s: 1500, tiros_total: 12, goles_total: 3,
    boost_cero_s: null, boost_bajo_s: null, pads_pequenos_total: null, velocidad_media: null,
    distancia_companeros: null, zona_defensiva_s: null,
  });
});

test('métricas de bloque: bloque ajeno → 404 sin escribir', async () => {
  const db = fakeSupabase(query => {
    if (query.table === 'metricas_bloque') assert.fail('no debería escribir');
    return { data: null, error: null };
  });
  await assert.rejects(blocks.saveBlockMetrics(db, B, '7', {}), { status: 404 });
});

test('métricas de replay: busca el replay por posición dentro del bloque propio', async () => {
  const db = fakeSupabase(query => {
    if (query.table === 'replays') return { data: { id_jugador_replay: 55 }, error: null };
    if (query.table === 'metricas_replay') return { data: null, error: null };
    if (query.ops[0][1] === 'id_bloque') return { data: { id_bloque: 7 }, error: null };
    return { data: blockRow(), error: null };
  });
  await blocks.saveReplayMetrics(db, A, '7', 2, { shots: 0, goals: 0 });
  assert.deepEqual(db.calls[1].filters, { id_bloque: '7', posicion: 2 });
  const [, row, opts] = db.calls[2].ops[0];
  assert.deepEqual(opts, { onConflict: 'id_jugador_replay' });
  assert.equal(row.id_jugador_replay, 55);
  assert.equal(row.tiros, 0); // 0 se guarda como 0
  assert.equal(row.asistencias, null); // ausente se guarda como null
});

test('sin Supabase configurado → 503', async () => {
  await assert.rejects(blocks.listBlocks(null, A), { status: 503 });
  await assert.rejects(profiles.getProfile(null, A), { status: 503 });
});

test('mapeo de estados ida y vuelta cubre los 5 estados del CHECK', () => {
  assert.deepEqual(Object.keys(blocks.STATUS_TO_API).sort(),
    ['borrador', 'completo', 'espera_servicio', 'procesando', 'requiere_correccion']);
  for (const [sql, api] of Object.entries(blocks.STATUS_TO_API)) assert.equal(blocks.STATUS_TO_SQL[api], sql);
});

test('la función SQL lee exactamente las claves que envía toBlockPayload', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const sqlText = fs.readFileSync(path.join(__dirname, '..', 'database', 'migraciones', 'a15-guardar-bloque.sql'), 'utf8');
  const sqlKeys = new Set([...sqlText.matchAll(/->>?'([a-z_]+)'/g)].map(m => m[1]));
  const payload = blocks.toBlockPayload({ ...NEW_BLOCK, metrics: {}, replays: [{ ...NEW_BLOCK.replays[0], metrics: {} }] });
  const replay = payload.replays[0];
  const sent = new Set([payload, replay, replay.archivo, replay.jugador, replay.metricas, payload.metricas].flatMap(Object.keys));
  assert.deepEqual([...sqlKeys].filter(k => !sent.has(k)), [], 'el SQL lee claves que el JS no envía');
});
