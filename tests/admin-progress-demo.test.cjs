'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildAdminProgressDemo } = require('../src/services/admin-progress-demo');

const now = new Date('2026-11-26T02:00:00Z'); // Todavía es el 25 en Monterrey.

test('demo: calcula los tres indicadores con sus propios denominadores y exclusiones', () => {
  const report = buildAdminProgressDemo({}, now);
  assert.deepEqual(report, {
    source: 'synthetic', mode: '2v2',
    period: { from: '2026-10-27', to: '2026-11-25', timezone: 'America/Monterrey' },
    shooting: { count: 1, evaluated: 2, excluded: 2 },
    goals: { count: 2, evaluated: 3, excluded: 1 },
    ranks: { count: 1, evaluated: 2, excluded: 2 },
  });
});

test('demo: filtra por fecha del bloque actual y conserva el anterior compatible fuera del periodo', () => {
  const recent = buildAdminProgressDemo({ days: '7' }, now);
  assert.deepEqual(recent.shooting, { count: 1, evaluated: 2, excluded: 1 });

  const extended = buildAdminProgressDemo({ days: '60' }, now);
  assert.deepEqual(extended.shooting, { count: 2, evaluated: 3, excluded: 2 });
  assert.deepEqual(extended.goals, { count: 3, evaluated: 4, excluded: 1 });
});

test('demo: cada modalidad tiene su propia muestra y el caso sin datos se identifica', () => {
  assert.deepEqual(buildAdminProgressDemo({ mode: '3v3' }, now).goals, { count: 1, evaluated: 2, excluded: 0 });
  const empty = buildAdminProgressDemo({ mode: '1v1' }, now);
  for (const metric of [empty.shooting, empty.goals, empty.ranks]) {
    assert.deepEqual(metric, { count: 0, evaluated: 0, excluded: 0 });
  }
  assert.throws(() => buildAdminProgressDemo({ mode: 'casual' }, now), { status: 400 });
  assert.throws(() => buildAdminProgressDemo({ days: ['7', '60'] }, now), { status: 400 });
});
