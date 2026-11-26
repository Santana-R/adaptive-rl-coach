'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const model = require('../public/sitio/js/followup-model');
const source = fs.readFileSync(require.resolve('../public/sitio/js/sessions.js'), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

// DOM mínimo del controlador: comprobamos dos órdenes reales de respuesta HTTP.
function harness(rowVersion = '81') {
  const nodes = new Map();
  class Node {
    constructor() { this.children = []; this.value = ''; this.label = ''; this[0] = { reset() {} }; }
    text(value) { if (value === undefined) return this.label + this.children.map(node => node.text()).join(' '); this.label = String(value); return this; }
    empty() { this.children = []; this.label = ''; return this; }
    append(...items) { this.children.push(...items); return this; }
    val(value) { if (value === undefined) return this.value; this.value = value; return this; }
    prop() { return this; } attr() { return this; } on() { return this; }
    addClass() { return this; } toggleClass() { return this; } trigger() { return this; }
  }
  const $ = value => {
    if (typeof value === 'function') return value();
    if (value.startsWith('<')) return new Node();
    if (!nodes.has(value)) nodes.set(value, new Node());
    return nodes.get(value);
  };
  let resolvePlan, resolveSessions;
  const planRequest = new Promise(resolve => { resolvePlan = resolve; });
  const sessionRequest = new Promise(resolve => { resolveSessions = resolve; });
  const plan = { plan_id: '8', plan_version_id: '81', version: 1, block_id: '39', exercises: [
    { plan_exercise_id: '100', assigned_minutes: 7, exercise_snapshot: { title: 'Rutas de pads' } }
  ] };
  const window = { location: { search: '?plan_id=8&version=1&block_id=39&plan_exercise_id=100' },
    CoachFollowupModel: model,
    CoachFollowupService: { sessions: () => sessionRequest },
    CoachPlanService: { version: () => planRequest }
  };
  vm.runInNewContext(source, { $, window, URLSearchParams, document: {} });
  return {
    plan: () => resolvePlan({ data: plan }),
    sessions: () => resolveSessions([{ session_id: '7', plan_version_id: rowVersion, plan_exercise_id: '100', duration_minutes: 10, performed_at: '2026-11-25T20:00:00Z' }]),
    text: () => $('#sessions-list').text()
  };
}
for (const first of ['sessions', 'plan']) test('Mi progreso permite corregir la sesión propia aunque primero llegue ' + first, async () => {
  const view = harness();
  view[first](); await flush();
  view[first === 'sessions' ? 'plan' : 'sessions'](); await flush();
  assert.match(view.text(), /Rutas de pads/);
  assert.match(view.text(), /Corregir/);
});
test('Mi progreso no habilita corregir una sesión de otra versión', async () => {
  const view = harness('82'); view.sessions(); await flush(); view.plan(); await flush();
  assert.doesNotMatch(view.text(), /Corregir/);
  assert.match(view.text(), /versión exacta/);
});
