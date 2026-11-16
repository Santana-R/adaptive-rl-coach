const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeBlock } = require('../src/services/analysis');
const { demoInput } = require('../src/services/analysis-demo');
const { startAnalysisServer, testRepository, A } = require('./helpers/analysis-server.cjs');

for (const [name, status, pct, priorityCount] of [
  ['initial', 'baseline', 25, 1], ['followup', 'comparable', 30, 1],
  ['incompatible', 'not_comparable', 30, 1], ['missing', 'comparable', null, 0],
]) {
  test(`Servicio A14 → A09 → A10 → A17: ${name}`, () => {
    const result = analyzeBlock(demoInput(name));
    assert.equal(result.valid, true);
    assert.equal(result.data.comparison.status, status);
    assert.equal(result.data.metrics.values.shooting_pct.value, pct);
    assert.equal(result.data.priorities.length, priorityCount);
    assert.equal(result.data.metrics.values.play_duration_s.value, 1510);
    assert.equal(result.data.source, 'synthetic');
  });
}

test('Comparación conserva +5 pp y denominadores completos, sin promediar porcentajes', () => {
  const result = analyzeBlock(demoInput('followup')).data;
  assert.equal(result.comparison.deltas.shooting_pct.delta, 5);
  assert.equal(result.comparison.deltas.shooting_pct.unit, 'percentage_points');
  assert.equal(result.metrics.values.shooting_pct.numerator.value, 6);
  assert.equal(result.metrics.values.shooting_pct.denominator.value, 20);
});

test('Una modalidad incompatible conserva el motivo y la prioridad propia actual', () => {
  const result = analyzeBlock(demoInput('incompatible')).data;
  assert.ok(result.comparison.reason_codes.includes('MODE_MISMATCH'));
  assert.equal(result.comparison.deltas, null);
  assert.equal(result.priorities[0].evidence.min_shots, 10);
});

test('Un tiro ausente produce null con cobertura 4, conservando los goles completos', () => {
  const result = analyzeBlock(demoInput('missing')).data;
  assert.equal(result.metrics.values.shots.value, null);
  assert.equal(result.metrics.values.shots.coverage, 4);
  assert.equal(result.metrics.values.goals.value, 6);
  assert.equal(result.metrics.values.goals.coverage, 5);
  assert.equal(result.comparison.deltas.shooting_pct.delta, null);
  assert.equal(result.evaluations[0].status, 'not_evaluable');
});

test('Cambiar la entrada cambia cálculo y regla, sin elegir una salida fija por escenario', () => {
  const input = demoInput('followup'), before = structuredClone(input);
  const first = analyzeBlock(input);
  assert.deepEqual(input, before);
  input.current.replays[0].blue.players[0].stats.core.goals += 2;
  const next = analyzeBlock(input);
  assert.equal(next.data.metrics.values.shooting_pct.value, 40);
  assert.equal(next.data.priorities.length, 0);
  assert.equal(first.data.metrics.values.shooting_pct.value, 30);
  assert.equal(analyzeBlock(demoInput('followup')).data.metrics.values.shooting_pct.value, 30);
});

test('Un bloque inválido conserva motivos de A14 sin diagnosticar', () => {
  const input = demoInput('initial'); input.current.replays.pop();
  const result = analyzeBlock(input);
  assert.equal(result.valid, false); assert.equal(result.data, null);
  assert.ok(result.reason_codes.includes('REPLAY_COUNT_INVALID'));
});

test('Fechas ausentes impiden comparar, sin borrar métricas ni fabricar otro reloj', () => {
  const input = demoInput('followup'); delete input.current.replays[0].date;
  const result = analyzeBlock(input).data;
  assert.equal(result.comparison.status, 'not_comparable');
  assert.ok(result.comparison.reason_codes.includes('CHRONOLOGY_INVALID'));
  assert.equal(result.metrics.values.shooting_pct.value, 30);
  assert.equal(result.priorities.length, 1);
});

test('Resuelve el anterior compatible del historial y excluye el mismo bloque', () => {
  const input = demoInput('followup');
  const result = analyzeBlock({ current: input.current, history: [input.current, input.baseline, demoInput('incompatible').current] }).data;
  assert.equal(result.comparison.baseline_block_id, input.baseline.block_id);
  assert.equal(result.comparison.deltas.shooting_pct.delta, 5);
});

test('Anterior explícito pendiente no se trata como si faltara', () => {
  const input = demoInput('followup'); input.baseline.status = 'processing';
  const result = analyzeBlock(input).data;
  assert.equal(result.comparison.status, 'not_comparable');
  assert.ok(result.comparison.reason_codes.includes('BLOCK_NOT_READY'));
});

let local;
test.before(async () => { local = await startAnalysisServer(); });
test.after(async () => { await local.close(); });
async function get(path, token, base = local.base) {
  const response = await fetch(base + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return { status: response.status, body: await response.json(), cache: response.headers.get('cache-control') };
}

for (const name of ['initial', 'followup', 'incompatible', 'missing']) {
  test(`HTTP demo calcula ${name} y etiqueta su procedencia`, async () => {
    const r = await get('/api/v1/demo/analysis?case=' + name);
    assert.equal(r.status, 200); assert.equal(r.body.meta.synthetic, true);
    assert.equal(r.body.meta.source, 'synthetic'); assert.equal(r.body.meta.contract_version, '1.0');
    assert.deepEqual(r.body.data, analyzeBlock(demoInput(name)).data);
    assert.equal(r.cache, 'no-store');
  });
}

test('Demo desactivada por defecto no responde con datos fijos alternativos', async () => {
  const disabled = await startAnalysisServer({ demo: false });
  try { assert.equal((await get('/api/v1/demo/analysis', null, disabled.base)).status, 404); }
  finally { await disabled.close(); }
});

test('Caso desconocido o repetido se rechaza sin leer archivos arbitrarios', async () => {
  for (const query of ['case=unknown', 'case=__proto__', 'case=initial&case=followup']) {
    const r = await get('/api/v1/demo/analysis?' + query);
    assert.equal(r.status, 400); assert.equal(r.body.error.code, 'INPUT_INVALID');
  }
});

test('Ruta privada exige token verificado', async () => {
  assert.equal((await get('/api/v1/blocks/demo-current/analysis')).status, 401);
  assert.equal((await get('/api/v1/blocks/demo-current/analysis', 'invalid')).status, 401);
  assert.equal((await get('/api/v1/blocks/demo-current/analysis', 'token-suspended')).status, 403);
});

test('Ruta privada usa dueño de la sesión e ignora un user_id enviado por el cliente', async () => {
  const r = await get('/api/v1/blocks/demo-current/analysis?user_id=other', 'token-a');
  assert.equal(r.status, 200); assert.equal(r.body.data.comparison.status, 'comparable');
  assert.ok(local.repository.calls.some(call => call.id === 'demo-current' && call.owner === A));
  assert.ok(!JSON.stringify(r.body).includes('owned-by-b'));
});

test('Inexistente y ajeno responden igual, incluso si el adaptador devuelve un ajeno', async () => {
  local.repository.unsafeLookup = true;
  try {
    const missing = await get('/api/v1/blocks/not-found/analysis', 'token-a');
    const foreign = await get('/api/v1/blocks/owned-by-b/analysis', 'token-a');
    assert.equal(foreign.status, 404); assert.deepEqual(foreign.body, missing.body);
    assert.equal((await get('/api/v1/blocks/demo-current/analysis?baseline_id=owned-by-b', 'token-a')).status, 404);
    assert.equal((await get('/api/v1/blocks/demo-current/analysis', 'token-admin')).status, 404);
  } finally { local.repository.unsafeLookup = false; }
});

test('Usuario B puede consultar su bloque, pero no el del usuario A', async () => {
  const own = await get('/api/v1/blocks/owned-by-b/analysis', 'token-b');
  assert.equal(own.status, 200); assert.equal(own.body.data.comparison.status, 'baseline');
  assert.equal((await get('/api/v1/blocks/demo-current/analysis', 'token-b')).status, 404);
});

test('Anterior explícito incompatible produce análisis explicado con HTTP 200', async () => {
  const r = await get('/api/v1/blocks/demo-3v3/analysis?baseline_id=demo-previous', 'token-a');
  assert.equal(r.status, 200); assert.equal(r.body.data.comparison.status, 'not_comparable');
  assert.ok(r.body.data.comparison.reason_codes.includes('MODE_MISMATCH'));
});

test('Baseline_id vacío o repetido produce error de entrada', async () => {
  for (const query of ['baseline_id=', 'baseline_id=a&baseline_id=b']) {
    assert.equal((await get('/api/v1/blocks/demo-current/analysis?' + query, 'token-a')).status, 400);
  }
});

test('Bloque pendiente responde 409 sin analizar datos parciales', async () => {
  local.repository.blocks.get('demo-current').status = 'processing';
  try {
    const r = await get('/api/v1/blocks/demo-current/analysis', 'token-a');
    assert.equal(r.status, 409); assert.equal(r.body.error.code, 'BLOCK_NOT_READY');
  } finally { local.repository.blocks.get('demo-current').status = 'ready'; }
});

test('Fallo del proveedor responde 503 sin detalles privados', async () => {
  local.repository.fail = true;
  try {
    const r = await get('/api/v1/blocks/demo-current/analysis', 'token-a');
    assert.equal(r.status, 503); assert.ok(!JSON.stringify(r.body).includes('private-provider-details'));
  } finally { local.repository.fail = false; }
});

test('Sin repositorio o autenticación configurados falla explícitamente', async () => {
  for (const options of [{ repository: null }, { auth: null }]) {
    const pending = await startAnalysisServer(options);
    try { assert.equal((await get('/api/v1/blocks/demo-current/analysis', 'token-a', pending.base)).status, 503); }
    finally { await pending.close(); }
  }
});

test('La pantalla oficial carga el controlador API y conserva los estilos de Luis', async () => {
  const response = await fetch(local.base + '/sitio/html/analisis.html');
  const html = await response.text();
  assert.match(html, /js\/analysis\.js/); assert.match(html, /css\/index\.css/);
  assert.ok(!html.includes('js/demo-data.js')); assert.ok(!html.includes('js/app.js'));
});
