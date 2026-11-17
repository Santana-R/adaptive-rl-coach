'use strict';

// Auditoría sintética de A26: no consulta proveedor, sesión ni base de datos.
const assert = require('node:assert/strict');
const { RULES_CONFIG } = require('../src/domain/rules-config');
const { demoInput } = require('../src/services/analysis-demo');
const { findReplayPlayer } = require('../src/services/replay-validation');
const { analyzeBlock } = require('../src/services/analysis');
const { generatePlan } = require('../src/domain/plans');
const { makePlanInput } = require('../tests/helpers/plan-inputs.cjs');
const matrix = require('../planning/fixtures/a26-validacion-heuristicas.v2.json');
const RULE_IDS = {
  shooting:'finalizacion-eficiencia', boost:'boost-disponibilidad',
  defensive_review:'cobertura-defensiva-revision',
};

function inputFor(c) {
  const input = { ...structuredClone(matrix.defaults), ...structuredClone(c.input) };
  const block = demoInput('three-priorities').current;
  block.block_id = 'synthetic-a26-' + c.id;
  block.profile.platform = input.platform;
  block.profile.mode = input.mode;
  block.source = 'synthetic';
  for (const [index,replay] of block.replays.entries()) {
    const player = replay.blue.players[0];
    player.id = { platform:input.platform,id:block.profile.player_id };
    replay.id = 'synthetic-a26-' + c.id + '-' + (index+1);
    replay.date = new Date(Date.UTC(2026,10,16,12) + index*900000).toISOString();
    replay.team_size = Number(input.mode[0]);
    replay.playlist_id = (input.match_type === 'ranked' ? 'ranked-' : 'unranked-') +
      ({'1v1':'duels','2v2':'doubles','3v3':'standard'}[input.mode]);
    replay.play_duration = input.play_duration_s[index];
    if(input.omit_play_duration)delete replay.play_duration;
    if(input.fallback_duration_s!=null)replay.duration=input.fallback_duration_s;
    player.stats.core.goals = input.goals[index];
    player.stats.core.shots = input.shots[index];
    player.stats.boost = {
      percent_zero_boost:input.boost_pct[index], time_zero_boost:input.boost_seconds[index],
    };
    if (input.boost_0_25) player.stats.boost.percent_boost_0_25 = input.boost_0_25[index];
    if (input.omit_boost_percent) delete player.stats.boost.percent_zero_boost;
    player.stats.positioning = {
      goals_against_while_last_defender:input.defender_goals[index],
      time_most_back:input.role_seconds[index], percent_most_back:input.role_percent[index],
      percent_infront_ball:input.infront_percent[index], avg_distance_to_mates:input.mates_distance[index],
    };
    if (input.omit_defender_goals) delete player.stats.positioning.goals_against_while_last_defender;
    if (input.team_goals_against != null) {
      player.stats.core.goals_against = input.team_goals_against;
      replay.blue.stats = { core:{goals_against:input.team_goals_against} };
    }
  }
  if (input.wrong_player) findReplayPlayer(block.replays[0],block.profile).id.id = 'OTHER_SYNTHETIC_PLAYER';
  return { input,block };
}

function evaluateCase(c) {
  const { input,block } = inputFor(c);
  const result = analyzeBlock({current:block});
  const record = { id:c.id,label:c.label,group:c.group,passed:false,
    human_sports_review:c.sports_review.status,
    validation:{valid:result.valid,reason_codes:result.reason_codes || []} };
  try {
    assert.equal(result.valid,c.expected.validation_valid !== false);
    if (!result.valid) {
      assert.ok(result.reason_codes.includes(c.expected.validation_reason));
      record.passed = true;
      return record;
    }
    const data = result.data;
    assert.equal(data.rules_version,matrix.expected_versions.rules);
    assert.equal(data.metrics_version,matrix.expected_versions.metrics);
    const evaluations = Object.fromEntries(Object.entries(RULE_IDS).map(([key,id]) =>
      [key,data.evaluations.find(e=>e.rule_id===id)]));
    const statuses = Object.fromEntries(Object.entries(evaluations).map(([key,e])=>[key,e.status]));
    assert.deepEqual(statuses,c.expected.statuses);
    assert.deepEqual(data.priorities.map(p=>p.priority_key),c.expected.priority_keys);
    if (Object.hasOwn(c.expected,'shooting_pct')) {
      const actual = data.metrics.values.shooting_pct.value;
      if(c.expected.shooting_pct === null) assert.equal(actual,null);
      else assert.ok(Math.abs(actual-c.expected.shooting_pct)<=1e-12,'Aritmética de eficiencia inesperada.');
    }
    if(Object.hasOwn(c.expected,'boost_severity')) assert.equal(evaluations.boost.evidence.severity,c.expected.boost_severity);
    if(Object.hasOwn(c.expected,'boost_matched')) assert.equal(evaluations.boost.evidence.matched_replays,c.expected.boost_matched);
    if(Object.hasOwn(c.expected,'defensive_matched')) assert.equal(evaluations.defensive_review.evidence.matched_replays,c.expected.defensive_matched);

    // El ayudante es exclusivamente un catálogo/identidades de PRUEBA.
    const planInput = makePlanInput({mode:input.mode,platform:input.platform,minutes:input.minutes,workshop:false});
    planInput.analysis = data;
    planInput.profile = { ...planInput.profile,...block.profile,rank_mode:input.mode };
    const plan = generatePlan(planInput);
    assert.equal(plan.generator_version,matrix.expected_versions.generator);
    assert.equal(plan.allocation_version,matrix.expected_versions.allocation);
    const byPriority = {};
    for(const e of plan.exercises) {
      assert.ok(Number.isInteger(e.assigned_minutes)&&e.assigned_minutes>=5);
      byPriority[e.priority_key]=(byPriority[e.priority_key]||0)+e.assigned_minutes;
    }
    assert.equal(plan.assigned_minutes,Object.values(byPriority).reduce((a,b)=>a+b,0));
    assert.ok(plan.assigned_minutes<=input.minutes);
    if(c.expected.plan) {
      assert.equal(plan.coverage,c.expected.plan.coverage);
      assert.equal(plan.assigned_minutes,c.expected.plan.assigned_minutes);
      assert.deepEqual(byPriority,c.expected.plan.minutes_by_priority);
      assert.deepEqual(plan.uncovered_priorities,c.expected.plan.uncovered_priorities);
    }
    record.observed = {
      statuses,reasons:Object.fromEntries(Object.entries(evaluations).map(([key,e])=>[key,e.reason])),
      shooting_pct:data.metrics.values.shooting_pct.value,
      boost_matched:evaluations.boost.evidence.matched_replays,
      boost_severity:evaluations.boost.evidence.severity,
      defensive_matched:evaluations.defensive_review.evidence.matched_replays,
      defensive_rates:evaluations.defensive_review.evidence.observations.map(o=>o.rate.value),
      defensive_duration_coverage:evaluations.defensive_review.evidence.duration_coverage,
      coverage:Object.fromEntries(Object.entries(evaluations).map(([key,e])=>[key,e.evidence.coverage])),
      priority_keys:data.priorities.map(p=>p.priority_key),
      plan:{coverage:plan.coverage,assigned_minutes:plan.assigned_minutes,minutes_by_priority:byPriority,
        uncovered_priorities:plan.uncovered_priorities},
    };
    record.passed = true;
  } catch(error) {
    record.error = error.message;
  }
  return record;
}

function validateMatrix() {
  assert.equal(matrix.source,'synthetic');
  assert.deepEqual(JSON.parse(JSON.stringify(RULES_CONFIG)),matrix.rules_config_snapshot,
    'La configuración cambió: revisar la matriz y su versión.');
  const ids=matrix.cases.map(c=>c.id);
  assert.equal(new Set(ids).size,ids.length,'IDs repetidos.');
  const cases=matrix.cases.map(evaluateCase);
  return {
    matrix_version:matrix.matrix_version,source:'synthetic',baseline_revision:matrix.base_revision,
    execution_commit:process.env.GITHUB_SHA || null,
    head_commit:process.env.A26_HEAD_SHA || null,
    node_version:process.version,versions:matrix.expected_versions,
    total:cases.length,passed:cases.filter(c=>c.passed).length,failed:cases.filter(c=>!c.passed).length,
    sports_review_status:'pending_roberto_review',population_calibration_status:'not_performed',
    cases,
  };
}

if(require.main===module){
  const report=validateMatrix();
  console.log('A26_REPORT_BEGIN');
  console.log(JSON.stringify(report,null,2));
  console.log('A26_REPORT_END');
  if(report.failed)process.exitCode=1;
}
module.exports={validateMatrix};
