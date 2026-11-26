'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const window = {};
vm.runInNewContext(fs.readFileSync(require.resolve('../public/sitio/js/player-ui.js'), 'utf8'), { window });
const ui = window.CoachPlayerUI;

test('La presentación redondea porcentajes sin alterar el diagnóstico original', () => {
  const priority = { explanation: 'Registraste 4 goles en 23 tiros (17.391304347826086 %).', evidence: {} };
  const original = JSON.stringify(priority);
  assert.match(ui.summary(priority), /17\.39 %/);
  assert.doesNotMatch(ui.summary(priority), /17\.3913/);
  assert.equal(JSON.stringify(priority), original);
  assert.equal(ui.number(null), 'No disponible');
  assert.equal(ui.text('Reglas 1.2.345; identificador abc1.23456'), 'Reglas 1.2.345; identificador abc1.23456');
});

test('El resumen de boost conserva el umbral y la muestra del servidor', () => {
  const priority = { priority_key: 'boost', evidence: { matched_replays: 3, threshold: 15 } };
  assert.match(ui.summary(priority), /3 de 5 partidas/);
  assert.match(ui.summary(priority), /al menos 15 %/);
  assert.doesNotMatch(ui.summary(priority), /mal manejo|causaste/);
  assert.equal(ui.name('boost-pad-routes'), 'Rutas de pads y recuperaciones');
});

test('La revisión defensiva conserva su tasa temporal y usa el texto original si faltan datos', () => {
  assert.match(ui.summary({ priority_key: 'defensive_review', evidence: { matched_replays: 4, threshold: 2 } }), /4 de 5 partidas.*2 goles.*por cada 5 minutos/);
  assert.equal(ui.summary({ priority_key: 'boost', explanation: 'Medición no disponible.' }), 'Medición no disponible.');
});
