'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const model = require('../public/sitio/js/followup-model');
const { defensivePlan } = require('./helpers/defensive-inputs.cjs');
const { normalizeCatalog, toSeedRows } = require('../src/domain/catalog');
const { generatePlan } = require('../src/domain/plans');
const { toSaveArgs } = require('../src/repositories/plans');
const content = require('../planning/catalogo-ejercicios.v1.json');
const verification = require('../planning/catalogo-verificacion.v1.json');
const source = fs.readFileSync(require.resolve('../public/js/analysis.js'), 'utf8');

test('Análisis abre el último bloque listo y conserva las métricas si falla la gráfica', async () => {
  const html = fs.readFileSync(require.resolve('../public/sitio/html/analisis.html'), 'utf8');
  const firstMetric = html.match(/id="metric-select"[\s\S]*?<option value="([^"]+)"/)[1];
  const analysis = defensivePlan({ boost: true, shooting: true }).analysis;
  const requests = [];
  const elements = new Map();

  function node(id) {
    if (!elements.has(id)) elements.set(id, {
      value: id === 'metric-select' ? firstMetric : '',
      innerHTML: '', textContent: '',
      replaceChildren() { this.innerHTML = ''; },
      setAttribute() {},
      add() {},
    });
    return elements.get(id);
  }

  const window = {
    CoachFollowupModel: model,
    CoachFollowupService: {
      blocks: async () => [
        { block_id: '40', status: 'processing' },
        { block_id: '39', status: 'ready', mode: '2v2', match_type: 'ranked' },
      ]
    },
    CoachAuth: { getAccessToken: async () => 'fixture' },
    location: { search: '', href: 'http://example.test/sitio/html/analisis.html' },
    history: { replaceState(_state, _title, url) { window.location.search = url.search; } },
    async fetch(path, { headers }) {
      requests.push(path);
      assert.equal(headers.Authorization, 'Bearer fixture');
      return { ok: true, json: async () => ({ data: { ...analysis, block_id: '39' }, meta: { synthetic: false } }) };
    },
    Chart: class {
      constructor() { throw new Error('Gráfica no disponible en esta prueba'); }
    },
  };

  vm.runInNewContext(fs.readFileSync(require.resolve('../public/sitio/js/player-ui.js'), 'utf8'), { window });
  vm.runInNewContext(source, {
    window,
    document: { getElementById: node, addEventListener() {} },
    Option: class {},
    Intl, URL, URLSearchParams,
  });
  await window.CoachAnalysis.load();

  assert.equal(firstMetric, 'shooting_pct');
  assert.deepEqual(requests, ['/api/v1/blocks/39/analysis']);
  assert.equal(window.location.search, '?block_id=39');
  assert.equal(node('analysis-error-panel').hidden, true);
  assert.equal(node('analysis-results').hidden, false);
  assert.match(node('analysis-block-context').textContent, /Bloque 39 · 2v2 competitivo · 5 partidas/);
  assert.equal(node('analysis-plan-link').href, 'plan.html?block_id=39');
  assert.match(node('chart-description').textContent, /Consulta los valores en la tabla/);
  assert.match(node('priority-list').innerHTML, /COBERTURA DEFENSIVA/);
});

test('Las rutinas registradas conservan su versión en el plan y en los argumentos SQL', () => {
  const input = defensivePlan({ boost: true, shooting: true });
  const analysis = { ...input.analysis, source: 'stored_replay_metrics' };
  const routines = [
    ...require('../planning/catalogo-boost.v1.json').exercises,
    ...require('../planning/catalogo-revision-defensiva.v1.json').exercises,
  ];
  const entries = [...content.exercises, ...routines];
  const rows = entries.map((exercise, index) => {
    const row = toSeedRows(exercise, null);
    return {
      id_ejercicio: index + 1, activo: true,
      ejercicio_versiones: [{
        ...row.ejercicio_versiones,
        id_ejercicio_version: index + 21,
        ejercicio_plataforma: row.ejercicio_plataforma.map(plataforma => ({ plataforma })),
      }],
    };
  });

  const catalog = normalizeCatalog(rows, content, verification);
  const plan = generatePlan({ ...input, analysis, catalog, availability_minutes: 60 });
  assert.equal(plan.coverage, 'complete');
  assert.equal(plan.assigned_minutes, 60);
  for (const routine of routines) {
    const exercise = plan.exercises.find(item => item.exercise_key === routine.exercise_key);
    assert.equal(exercise.exercise_version_id, String(entries.indexOf(routine) + 21));
    assert.equal(exercise.exercise_snapshot.content_version, routine.content_version);
  }

  const args = toSaveArgs({ userId: 'fixture', blockId: '39', proposal: plan, analysis,
    profile: { days_per_week: 4 } });
  assert.deepEqual(args.p_plan.ejercicios.map(item => item.id_ejercicio_version),
    plan.exercises.map(item => Number(item.exercise_version_id)));
  assert.ok(args.p_plan.ejercicios.some(item => item.rule_id === 'cobertura-defensiva-revision-tasa'));

  rows.at(-1).activo = false;
  const updated = generatePlan({ ...input, analysis, catalog: normalizeCatalog(rows, content, verification),
    availability_minutes: 60 });
  assert.equal(updated.coverage, 'partial');
  assert.ok(!updated.exercises.some(item => item.priority_key === 'defensive_review'));
});
