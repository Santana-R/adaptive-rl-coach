'use strict';

// A19: solo lecturas de bloques propios y prueba de permisos con DOS sesiones.
// El CLI inicia Express local con .env; no sube archivos ni cambia usuarios/datos.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function renderController(base, blockId, token, fetchImpl = fetch) {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, {
      textContent: '', innerHTML: '', value: id === 'metric-select' ? 'shooting_pct' : 'initial',
      hidden: false, disabled: false, replaceChildren() { this.innerHTML = ''; },
      setAttribute() {}, removeAttribute() {}, addEventListener() {}, add() {},
    });
    return elements.get(id);
  };
  const search = '?block_id=' + encodeURIComponent(blockId);
  const root = { CoachFollowupModel: require('../public/sitio/js/followup-model'), location: { search, href: base + '/sitio/html/analisis.html' + search },
    fetch: (url, options) => fetchImpl(new URL(url, base), { ...options, redirect: 'error', signal: AbortSignal.timeout(15000) }) };
  root.CoachFollowupService = {
    async blocks() {
      const response = await root.fetch('/api/v1/blocks', { headers: { Authorization: 'Bearer ' + token } });
      const body = await response.json();
      if (!response.ok) throw new Error('No se pudo consultar el historial del comprobador.');
      return body.data;
    },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/sitio/js/player-ui.js'), 'utf8'), { window: root });
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/js/analysis.js'), 'utf8'),
    { window: root, document: { getElementById: get, addEventListener() {} }, Option: class {}, URL, URLSearchParams, Intl },
    { timeout: 1000 });
  root.CoachAnalysis.configure({ getAccessToken: async () => token });
  await root.CoachAnalysis.load();
  return {
    error_hidden: get('analysis-error').hidden,
    shooting: get('shooting-value').textContent,
    goals: get('goals-value').textContent,
    shots: get('shots-value').textContent,
    sample: get('sample-value').textContent,
  };
}

async function runChecks({ base, tokenA, tokenB, userA, userB, blockId, fetchImpl = fetch }) {
  const cases = [];
  const check = (id, ok, expected, observed) => cases.push({ id, passed: Boolean(ok), expected, observed });
  const request = async (route, token) => {
    const r = await fetchImpl(new URL(route, base), {
      headers: token ? { Authorization: 'Bearer ' + token } : {},
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
    });
    const body = await r.json();
    return { status: r.status, body, cache: r.headers.get('cache-control') };
  };
  check('distinct_accounts', userA && userB && userA !== userB, 'A y B distintos', userA !== userB);
  const meA = await request('/api/v1/me', tokenA), meB = await request('/api/v1/me', tokenB);
  for (const [alias, response, expectedId] of [['A', meA, userA], ['B', meB, userB]]) {
    check('session_' + alias, response.status === 200 && response.body.id === expectedId && response.body.status === 'active',
      '200, identidad de la sesión activa', response.status);
  }
  if (!cases.every(c => c.passed)) return finish();
  const listA = await request('/api/v1/blocks', tokenA);
  const own = Array.isArray(listA.body.data) ? listA.body.data : [];
  const selected = blockId ? own.find(b => String(b.block_id) === String(blockId))
    : own.find(b => b.status === 'ready' && b.ready_replays === 5);
  check('own_ready_block', listA.status === 200 && selected?.status === 'ready' && selected.ready_replays === 5,
    'Un bloque propio ready con cinco replays', selected ? selected.status : 'not_available');
  if (!cases.every(c => c.passed)) return finish();
  const id = encodeURIComponent(selected.block_id), endpoint = '/api/v1/blocks/' + id + '/analysis';
  const none = await request(endpoint), invalid = await request(endpoint, 'a19-intentionally-invalid');
  check('no_session', none.status === 401 && none.body.error?.code === 'AUTH_REQUIRED', '401 AUTH_REQUIRED', none.status);
  check('invalid_session', invalid.status === 401 && invalid.body.error?.code === 'AUTH_REQUIRED', '401 AUTH_REQUIRED', invalid.status);
  const detail = await request('/api/v1/blocks/' + id, tokenA);
  const response = await request(endpoint, tokenA), a = response.body.data, m = a?.metrics;
  check('own_analysis', response.status === 200 && String(a?.block_id) === String(selected.block_id) &&
    a?.source === 'stored_replay_metrics' && m?.sample_size === 5 && response.cache === 'no-store',
    '200, cinco replays guardados, no-store', response.status);
  const replays = detail.body.data?.replays;
  const numeric = value => value !== null && value !== undefined && value !== '' &&
    Number.isSafeInteger(Number(value)) && Number(value) >= 0;
  const complete = detail.status === 200 && Array.isArray(replays) && replays.length === 5 &&
    replays.every(r => r.status === 'ok' && numeric(r.metrics?.goals) && numeric(r.metrics?.shots));
  check('original_counts_available', complete, 'Cinco conteos originales guardados válidos', complete);
  let manual = null;
  if (complete && response.status === 200) {
    const goals = replays.reduce((s, r) => s + Number(r.metrics.goals), 0);
    const shots = replays.reduce((s, r) => s + Number(r.metrics.shots), 0);
    const pct = shots === 0 ? null : goals / shots * 100;
    manual = { goals, shots, shooting_pct: pct };
    const actual = m?.values?.shooting_pct?.value;
    check('manual_totals', m?.values?.goals?.value === goals && m?.values?.shots?.value === shots &&
      (pct === null ? actual === null : Number.isFinite(actual) && Math.abs(actual - pct) < 1e-10),
      manual, { goals: m?.values?.goals?.value, shots: m?.values?.shots?.value, shooting_pct: actual });
    const ui = await renderController(base, selected.block_id, tokenA, fetchImpl);
    const format = value => value === null ? 'No disponible' : new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(value) + ' %';
    const countText = (value, one, many) => new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(value) + ' ' + (value === 1 ? one : many);
    check('api_controller_values', ui.error_hidden && ui.shooting === format(pct) && ui.goals === countText(goals, 'gol', 'goles') &&
      ui.shots === countText(shots, 'tiro', 'tiros') && ui.sample === '5 replays',
      'Controlador presenta los valores calculados; DOM mínimo, no revisión visual', ui);
  }
  const foreign = await request(endpoint, tokenB);
  const missing = await request('/api/v1/blocks/999999999999999999/analysis', tokenB);
  const same404 = r => r.status === 404 && r.body.error?.code === 'RESOURCE_NOT_FOUND' && !r.body.data;
  check('foreign_same_as_missing', same404(foreign) && same404(missing) && JSON.stringify(foreign.body) === JSON.stringify(missing.body),
    'Ajeno e inexistente: mismo 404, sin datos', { foreign: foreign.status, missing: missing.status });
  const spoofed = await request(endpoint + '?user_id=' + encodeURIComponent(userA), tokenB);
  check('owner_not_from_query', same404(spoofed), 'B no suplanta a A mediante user_id', spoofed.status);
  const listB = await request('/api/v1/blocks', tokenB);
  check('history_owner_filtered', listB.status === 200 && Array.isArray(listB.body.data) &&
    !listB.body.data.some(b => String(b.block_id) === String(selected.block_id)),
    'Historial de B excluye el bloque de A', listB.status);
  const selfBaseline = await request(endpoint + '?baseline_id=' + id, tokenA);
  check('explicit_owned_baseline', selfBaseline.status === 200 && selfBaseline.body.data?.comparison?.status === 'not_comparable' &&
    selfBaseline.body.data.comparison.reason_codes?.includes('SAME_BLOCK'),
    'Anterior propio permitido; mismo bloque explicado sin comparación ficticia', selfBaseline.status);
  return finish();

  function finish() {
    return { evidence_version: 'a19.private-check.v1', passed: cases.length > 0 && cases.every(c => c.passed),
      total: cases.length, failed: cases.filter(c => !c.passed).length, cases,
      limitations: ['No es una auditoría completa A37.', 'Controlador ejecutado en DOM mínimo: falta revisión visual de Luis en escritorio y 390 px.',
        'Los datos se leen de bloques existentes; no se acredita una nueva carga o llamada a Ballchasing.',
        'No se crea, modifica o elimina ningún bloque, replay, perfil ni plan.'] };
  }
}

async function masked(label) {
  if (!process.stdin.isTTY) throw new Error('TTY_REQUIRED');
  const readline = require('node:readline');
  process.stdout.write(label);
  readline.emitKeypressEvents(process.stdin);
  const previous = Boolean(process.stdin.isRaw);
  process.stdin.setRawMode(true); process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '';
    function done(error) {
      process.stdin.off('keypress', onKey); process.stdin.setRawMode(previous); process.stdin.pause();
      process.stdout.write('\n'); error ? reject(error) : resolve(value);
    }
    function onKey(str, key = {}) {
      if (key.ctrl && key.name === 'c') return done(new Error('CANCELLED'));
      if (key.name === 'return') return done();
      if (key.name === 'backspace') value = value.slice(0, -1);
      else if (!key.ctrl && !key.meta && str && !str.includes('\u001b')) value += str;
    }
    process.stdin.on('keypress', onKey);
  });
}

async function main() {
  const { createClient } = require('@supabase/supabase-js');
  const { execFileSync } = require('node:child_process');
  const env = process.env;
  if (new URL(env.SUPABASE_URL || 'https://missing.invalid').hostname !== 'fylupliaforboawqdutb.supabase.co' ||
      !env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_ANON_KEY) throw new Error('CONFIG_REQUIRED');
  const clients = [];
  let server, report;
  try {
    const sessions = [];
    for (const alias of ['A', 'B']) {
      console.log('Cuenta ' + alias + ': escribe el correo y contraseña; no se mostrarán.');
      let email = await masked('Correo ' + alias + ': '), password = await masked('Contraseña ' + alias + ': ');
      const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      clients.push(client);
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      email = ''; password = '';
      if (error || !data?.session?.access_token || !data?.user?.id) throw new Error('SIGN_IN_FAILED');
      sessions.push({ token: data.session.access_token, user: data.user.id });
    }
    const { createApp } = require('../src/app');
    server = createApp().listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    report = await runChecks({ base: 'http://127.0.0.1:' + server.address().port,
      tokenA: sessions[0].token, tokenB: sessions[1].token, userA: sessions[0].user, userB: sessions[1].user,
      blockId: env.A19_BLOCK_ID });
    report.execution_source = 'real_supabase_sessions_existing_stored_blocks';
    report.node_version = process.version;
    report.executed_at = new Date().toISOString();
    try { report.commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: path.join(__dirname, '..'), encoding: 'utf8' }).trim(); }
    catch { report.commit = null; }
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    // Solo sesiones creadas por esta comprobación, sin cerrar las otras del usuario.
    for (const client of clients) {
      try { await client.auth.signOut({ scope: 'local' }); } catch {}
    }
  }
  const args = process.argv.slice(2);
  if (args.length) {
    if (args.length !== 2 || args[0] !== '--report') throw new Error('ARGUMENTS_INVALID');
    const output = path.resolve(args[1]);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    console.log('Reporte sin credenciales guardado.');
  }
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.passed ? 0 : 1;
}

if (require.main === module) main().catch(error => {
  const messages = { CONFIG_REQUIRED: 'Configura .env para Adaptive RL Coach con sus claves de servidor y pública.',
    TTY_REQUIRED: 'Ejecuta el comando en una terminal interactiva.', SIGN_IN_FAILED: 'No se pudo iniciar sesión; revisa las credenciales de la cuenta.',
    CANCELLED: 'Prueba cancelada.', ARGUMENTS_INVALID: 'Usa --report seguido de una ruta nueva para el JSON.' };
  console.error(messages[error.message] || 'A19 no pudo completar la prueba. Revisa la conexión y que el archivo de salida no exista.');
  console.error('No se registraron credenciales.');
  process.exitCode = 1;
});

module.exports = { runChecks, renderController };
