const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const followupModel = require('../public/sitio/js/followup-model');

const flush = () => new Promise(resolve => setImmediate(resolve));

function controller(search) {
  const elements = new Map(), events = {}, calls = [];
  const element = id => {
    if (!elements.has(id)) elements.set(id, { value: id === 'metric-select' ? 'shooting_pct' : 'initial',
      setAttribute() {}, removeAttribute() {}, addEventListener() {}, replaceChildren() {}, add() {} });
    return elements.get(id);
  };
  const root = { location: { search }, history: {}, CoachFollowupModel: followupModel,
    CoachFollowupService: { async blocks() { return []; } },
    fetch: async (url, options) => {
      calls.push({ url, ...options });
      return { ok: false, json: async () => ({ error: { message: 'Consulta pendiente.' } }) };
    },
  };
  const document = { getElementById: element, addEventListener: (name, callback) => { events[name] = callback; } };
  vm.runInNewContext(fs.readFileSync('public/js/analysis.js', 'utf8'), { window: root, document, Option: class {}, URLSearchParams, URL, Intl });
  return { root, events, calls, element };
}

test('Demo de Análisis consulta solo su ruta sintética sin pedir sesión', async () => {
  const c = controller('?demo=1');
  c.root.CoachProfileApi = { getClient() { throw new Error('No debe consultar identidad para la demo'); } };
  c.events.DOMContentLoaded(); await flush();
  assert.equal(c.calls.length, 1);
  assert.equal(c.calls[0].url, '/api/v1/demo/analysis?case=initial');
  assert.deepEqual(Object.keys(c.calls[0].headers), []);
});

test('Bloque privado espera el gate y usa la sesión vigente del cliente de Luis', async () => {
  const c = controller('?block_id=12');
  let token = 'session-first';
  c.root.CoachProfileApi = { getClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: token } }, error: null }) } }) };
  c.events.DOMContentLoaded(); await flush();
  assert.equal(c.calls.length, 0);
  await c.root.CoachAnalysis.load();
  assert.equal(c.calls[0].url, '/api/v1/blocks/12/analysis');
  assert.equal(c.calls[0].headers.Authorization, 'Bearer session-first');
  token = 'session-refreshed';
  await c.root.CoachAnalysis.load();
  assert.equal(c.calls[1].headers.Authorization, 'Bearer session-refreshed');
  assert.equal(c.element('scenario-select').hidden, true);
});

test('Sesión privada ausente no llama a Análisis ni cae a datos de demo', async () => {
  const c = controller('?block_id=12');
  c.root.CoachProfileApi = { getClient: () => ({ auth: { getSession: async () => ({ data: { session: null } }) } }) };
  c.events.DOMContentLoaded(); await c.root.CoachAnalysis.load();
  assert.equal(c.calls.length, 0);
  assert.match(c.element('analysis-error').textContent, /Inicia sesión/);
});

async function gate({ search = '?block_id=12', valid = true, status = null } = {}) {
  const state = {}, order = [];
  const jq = key => ({ prop(name, value) { (state[key] ||= {})[name] = value; return this; },
    empty() { return this; }, append() { return this; }, addClass() { return this; },
    text() { return this; }, attr() { return this; }, on() { return this; } });
  const root = { location: { search, replace: url => order.push(url) },
    CoachAnalysis: { demo: controller(search).root.CoachAnalysis.demo, load: async () => order.push('analysis') },
    CoachProfileApi: { load: async () => {
      order.push('profile'); if (status) throw { status }; return {};
    } },
    CoachProfileValidation: { validate: () => ({ valid, errors: { player_id: 'Completa tu identidad.' } }) },
  };
  const $ = arg => typeof arg === 'function' ? arg() : jq(arg);
  vm.runInNewContext(fs.readFileSync('public/sitio/js/profile-gate.js', 'utf8'), { window: root, $, URLSearchParams });
  await flush();
  return { state, order };
}

test('Gate conserva el acceso privado: perfil válido antes del análisis; incompleto o sin sesión lo impide', async () => {
  const ok = await gate();
  assert.deepEqual(ok.order, ['profile', 'analysis']);
  assert.equal(ok.state['#analysis-content'].hidden, false);
  const incomplete = await gate({ valid: false });
  assert.deepEqual(incomplete.order, ['profile']);
  assert.equal(incomplete.state['#analysis-content'].hidden, true);
  const expired = await gate({ status: 401 });
  assert.deepEqual(expired.order, ['profile', 'login.html']);
});

test('Gate permite la demo separada sin consultar un perfil ni cargar análisis dos veces', async () => {
  const demo = await gate({ search: '?case=followup' });
  assert.deepEqual(demo.order, []);
  assert.equal(demo.state['#perfil-gate'].hidden, true);
  assert.equal(demo.state['#analysis-content'].hidden, false);
});
