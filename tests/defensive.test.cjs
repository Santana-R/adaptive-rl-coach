const test = require('node:test');
const assert = require('node:assert/strict');
const cases = require('../planning/fixtures/cobertura-defensiva-propuesta.v0.json');
const { defensiveBlock, defensivePlan } = require('./helpers/defensive-inputs.cjs');
const { analyzeBlock } = require('../src/services/analysis');
const { findReplayPlayer } = require('../src/services/replay-validation');
const { evaluateRules } = require('../src/domain/rules');
const { generatePlan } = require('../src/domain/plans');
const { fromStoredBlock } = require('../src/services/stored-block');
const { toBlock } = require('../src/repositories/blocks');
const { blockRow, A } = require('./helpers/stored-database.cjs');
const defense = data => data.evaluations.find(e => e.rule_id === 'cobertura-defensiva-revision');
const analyze = options => analyzeBlock({ current:defensiveBlock(options) }).data;

for (const c of cases.cases) test('Cobertura defensiva: ' + c.id, () => {
  const override = c.override || {};
  const block = defensiveBlock({ counts:c.goals_last_defender, ...override, contextual_data:c.contextual_data });
  if (override.replay_ids) block.replays.forEach((r,i) => { r.id = override.replay_ids[i]; });
  if (override.identity_consistent === false) findReplayPlayer(block.replays[0],block.profile).id.id = 'another-player';
  const result = analyzeBlock({ current:block });
  if (!result.valid) { assert.equal(c.expected,'not_evaluable'); return; }
  for (const key of ['unit','scope','source_field']) if (Object.hasOwn(override,key)) {
    result.data.metrics.defensive_review_per_replay.observations.forEach(o => { o.goals[key] = override[key]; });
  }
  const e = defense(evaluateRules(result.data.metrics));
  assert.equal(e.status, { review_candidate:'active', no_candidate:'inactive', not_evaluable:'not_evaluable' }[c.expected]);
});

test('La evidencia conserva campos originales, contexto y el criterio provisional', () => {
  const data = analyze(), e = defense(data), p = data.priorities[0];
  assert.equal(data.rules_version,'mvp.rules.v3');
  assert.equal(e.evidence.coverage,5); assert.equal(e.evidence.matched_replays,3);
  assert.equal(e.evidence.threshold,2); assert.equal(e.evidence.required_matches,3);
  assert.equal(e.evidence.measurement_basis,'provider_goals_against_while_last_defender');
  assert.equal(e.evidence.observations[0].goals.scope,'player');
  assert.equal(e.evidence.observations[0].goals.source_field,'goals_against_while_last_defender');
  assert.equal(e.evidence.observations[0].role_seconds.source_field,'time_most_back');
  assert.equal(e.evidence.observations[0].mates_distance.unit,'uu');
  assert.equal(p.priority_key,'defensive_review'); assert.equal(p.score,1);
  assert.equal(p.calibration_status,'provisional_heuristic_pending_validation');
  assert.match(p.explanation,/no atribuye culpa/);
  assert.ok(data.limitations.includes('defensive_review_heuristic_pending_validation'));
});

for (const value of [undefined,NaN,Infinity,true,'2',-1,2.2]) test('Conteo original inválido: '+String(value), () => {
  const data = analyze({ counts:[2,2,2,value,0] }), e = defense(data);
  assert.equal(e.status,'not_evaluable'); assert.equal(e.evidence.coverage,4);
  assert.equal(e.evidence.matched_replays,null);
  assert.equal(e.evidence.observations[3].goals.value,null);
});

test('La ausencia completa de positioning no crea una prioridad ni ceros', () => {
  const block = defensiveBlock();
  block.replays.forEach(r => { delete findReplayPlayer(r,block.profile).stats.positioning; });
  const data = analyzeBlock({ current:block }).data;
  assert.equal(defense(data).status,'not_evaluable');
  assert.equal(defense(data).evidence.coverage,0);
  assert.deepEqual(data.priorities,[]);
});

test('Tiempo y porcentajes de contexto inválidos no reemplazan los conteos ni impiden revisarlos', () => {
  const data = analyze({ contextual_data:{ time_most_back:'120',percent_most_back:101,percent_infront_ball:null } });
  const e = defense(data);
  assert.equal(e.status,'active');
  assert.equal(e.evidence.observations[0].role_seconds.value,null);
  assert.equal(e.evidence.observations[0].role_percent.value,null);
  assert.equal(e.evidence.observations[0].infront_percent.value,null);
  assert.equal(e.evidence.contextual_metrics_affect_activation,false);
});

test('Solo usa la identidad seleccionada; estadísticas del equipo y de otro participante no la activan', () => {
  const block = defensiveBlock({ counts:[0,0,0,0,0] });
  for (const r of block.replays) {
    const other = structuredClone(findReplayPlayer(r,block.profile));
    other.id.id = 'another-player'; other.stats.positioning.goals_against_while_last_defender = 99;
    r.blue.players.push(other); r.orange = { players:[other] };
    r.blue.stats = { positioning:{ goals_against_while_last_defender:99 } };
  }
  assert.equal(defense(analyzeBlock({ current:block }).data).status,'inactive');
});

test('Ninguna media, reloj o total de goles reconstruye un conteo ausente', () => {
  const block = defensiveBlock();
  block.replays.forEach(r => {
    const p = findReplayPlayer(r,block.profile);
    delete p.stats.positioning.goals_against_while_last_defender;
    p.stats.core.goals_against = 5; p.stats.core.saves = 0;
    p.stats.positioning.percent_most_back = 100; r.duration = 9999; r.play_duration = 600;
  });
  assert.equal(defense(analyzeBlock({ current:block }).data).status,'not_evaluable');
});

test('La regla sigue independiente de tiros, boost y de tener un bloque anterior', () => {
  const block = defensiveBlock();
  block.replays.forEach(r => {
    const p = findReplayPlayer(r,block.profile);
    delete p.stats.core.shots; delete p.stats.boost;
  });
  const data = analyzeBlock({ current:block }).data;
  assert.equal(data.comparison.status,'baseline');
  assert.deepEqual(data.priorities.map(p => p.priority_key),['defensive_review']);
});

test('Rechaza cobertura, base, IDs y valores de contexto manipulados', () => {
  for (const mutate of [
    d => { d.coverage = 4; }, d => { d.measurement_basis = 'guessed'; },
    d => { d.observations[0].replay_id = 'another-replay'; },
    d => { d.observations[0].role_percent.value = 101; },
  ]) {
    const data = analyze(); mutate(data.metrics.defensive_review_per_replay);
    assert.equal(defense(evaluateRules(data.metrics)).status,'not_evaluable');
  }
});

test('A15 sin positioning mantiene el faltante y las dos reglas anteriores', () => {
  const data = analyzeBlock({ current:fromStoredBlock(toBlock(blockRow()),A) }).data;
  const e = defense(data);
  assert.equal(e.status,'not_evaluable'); assert.equal(e.evidence.coverage,0);
  assert.equal(e.evidence.observations[0].goals.missing_reason,'stored_positioning_not_recorded');
  assert.deepEqual(data.priorities.map(p => p.priority_key),['shooting']);
});

test('Tres prioridades se ordenan con evidencia independiente y sin duplicados', () => {
  const data = analyze({ boost:true,shooting:true });
  assert.deepEqual(data.priorities.map(p => p.priority_key),['boost','defensive_review','shooting']);
  assert.deepEqual(data.priorities.map(p => p.order),[1,2,3]);
});

test('Una propuesta solo defensiva conserva instrucciones nativas y su versión, también en Epic', () => {
  for (const platform of ['steam','epic']) {
    const p = generatePlan(defensivePlan({ platform,workshop:false }));
    assert.equal(p.generator_version,'mvp.plans.v3'); assert.equal(p.review_catalog_version,'mvp.native-review.v1');
    assert.equal(p.exercises.length,1); assert.equal(p.assigned_minutes,20);
    const e = p.exercises[0];
    assert.equal(e.exercise_key,'review-last-defender'); assert.equal(e.exercise_version_id,null);
    assert.equal(e.exercise_snapshot.source,'bundled_native_review');
    assert.equal(e.exercise_snapshot.resource_type,'native_replay_review');
    assert.equal(e.exercise_snapshot.requires_saved_replay,true);
    assert.match(e.exercise_snapshot.instructions.join(' '),/manualmente/);
    assert.doesNotMatch(e.exercise_snapshot.instructions.join(' '),/Asegurar el contacto/);
    assert.match(e.exercise_snapshot.success_criterion,/autorreportada/);
  }
});

test('5, 10 y 15 minutos indican qué áreas caben antes de repetir ejercicios', () => {
  for (const [minutes,keys,uncovered] of [
    [5,['boost'],['defensive_review','shooting']],
    [10,['boost','defensive_review'],['shooting']],
    [15,['boost','defensive_review','shooting'],[]],
  ]) {
    const p = generatePlan(defensivePlan({ minutes,boost:true,shooting:true }));
    assert.deepEqual(p.exercises.map(e => e.priority_key),keys);
    assert.deepEqual(p.uncovered_priorities,uncovered);
    assert.equal(p.coverage,uncovered.length?'partial':'complete');
    assert.ok(p.exercises.every(e => e.assigned_minutes===5));
  }
});

test('Con 20 minutos las tres áreas reciben 7, 7 y 6 sin duplicar presupuesto', () => {
  const p = generatePlan(defensivePlan({ minutes:20,boost:true,shooting:true }));
  assert.deepEqual(p.exercises.map(e => e.assigned_minutes),[7,7,6]);
  assert.equal(p.coverage,'complete'); assert.equal(p.assigned_minutes,20);
  assert.match(p.explanation,/cobertura defensiva/);
});

test('No acepta una prioridad defensiva con evidencia o score alterados', () => {
  for (const change of [p => { p.score=99; },p => { p.evidence.matched_replays=4; }]) {
    const input = defensivePlan(); change(input.analysis.priorities[0]);
    const p = generatePlan(input);
    assert.equal(p.coverage,'empty'); assert.deepEqual(p.exercises,[]);
    assert.ok(p.uncovered_priorities.includes('defensive_review'));
  }
});

test('Catálogo SQL vacío no inventa recursos de tiro y conserva las dos actividades nativas', () => {
  const input = defensivePlan({ boost:true,shooting:true }); input.catalog.exercises=[];
  const p = generatePlan(input);
  assert.equal(p.coverage,'partial'); assert.deepEqual(p.uncovered_priorities,['shooting']);
  assert.equal(p.assigned_minutes,20);
  assert.ok(p.exercises.some(e => e.priority_key==='defensive_review'));
  assert.ok(!p.exercises.some(e => e.priority_key==='shooting'));
});

test('El diagnóstico y los snapshots de revisión no se mutan', () => {
  const input = defensivePlan(), before=structuredClone(input), first=generatePlan(input);
  first.exercises[0].exercise_snapshot.instructions.push('alteración');
  first.diagnosis_snapshot.priorities[0].evidence.observations[0].goals.value=99;
  const next=generatePlan(input);
  assert.doesNotMatch(next.exercises[0].exercise_snapshot.instructions.join(' '),/alteración/);
  assert.equal(next.diagnosis_snapshot.priorities[0].evidence.observations[0].goals.value,2);
  assert.deepEqual(input,before);
});

test('Tres áreas de 0 a 120 minutos respetan presupuesto, mínimos y cobertura', () => {
  for (const workshop of [false,true]) {
    const input=defensivePlan({ boost:true,shooting:true,workshop });
    for(let minutes=0;minutes<=120;minutes++){
      input.availability_minutes=minutes; const p=generatePlan(input);
      assert.equal(p.assigned_minutes,minutes<5?0:minutes);
      assert.ok(p.exercises.every(e => Number.isInteger(e.assigned_minutes)&&e.assigned_minutes>=5));
      assert.equal(p.unassigned_minutes,minutes-p.assigned_minutes);
      if(minutes>=15) for(const key of ['boost','defensive_review','shooting']){
        const assigned=p.exercises.filter(e => e.priority_key===key).reduce((s,e)=>s+e.assigned_minutes,0);
        assert.ok(Math.abs(assigned-minutes/3)<1);
      }
    }
  }
});
