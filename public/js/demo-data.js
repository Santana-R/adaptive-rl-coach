/* Synthetic data and illustrative rules only. Replace through DemoService for A19.
 * No file parsing, network request, auth, database or calibrated diagnosis here. */
(function (root) {
  'use strict';
  const CONTEXT = Object.freeze({ platform: 'steam', player_id: 'TEST_PLAYER_01', mode: '2v2', match_type: 'ranked' });
  const RULES_VERSION = 'demo.rules.v1';
  const METRICS_VERSION = 'demo.metrics.v1';
  const RULES = Object.freeze({ boostLow: 30, shooting: 35 });
  const replay = (id, shots, goals, boost) => ({ replay_id: id, shots, goals, boost_low_pct: boost, player_seconds: 300 });
  const initial = { block_id: 'test-block-01', label: 'Bloque 01', period: '01–05 oct 2026', context: CONTEXT, metrics_version: METRICS_VERSION, first_match_at: '2026-10-01T20:00:00Z', last_match_at: '2026-10-05T21:00:00Z', replays: [replay('a1',4,1,42),replay('a2',5,1,37),replay('a3',3,1,40),replay('a4',4,1,36),replay('a5',4,1,40)] };
  const followup = { block_id: 'test-block-02', label: 'Bloque 02', period: '08–12 oct 2026', context: CONTEXT, metrics_version: METRICS_VERSION, first_match_at: '2026-10-08T20:00:00Z', last_match_at: '2026-10-12T21:00:00Z', replays: [replay('b1',5,2,27),replay('b2',4,1,23),replay('b3',5,1,25),replay('b4',3,1,20),replay('b5',3,1,25)] };
  const clone = value => JSON.parse(JSON.stringify(value));
  function aggregate(replays) {
    const usable = replays.filter(r => Number.isFinite(r.shots) && Number.isFinite(r.goals));
    const shots = usable.reduce((s,r) => s+r.shots,0);
    const goals = usable.reduce((s,r) => s+r.goals,0);
    const boosts = replays.filter(r => Number.isFinite(r.boost_low_pct) && r.player_seconds > 0);
    const seconds = boosts.reduce((s,r) => s+r.player_seconds,0);
    return { shots, goals, shooting_pct: shots > 0 ? 100*goals/shots : null, shooting_missing_reason: shots > 0 ? null : 'zero_denominator', shots_per_match: usable.length ? shots/usable.length : null, boost_low_pct: seconds ? boosts.reduce((s,r) => s+r.boost_low_pct*r.player_seconds,0)/seconds : null, sample_size: replays.length };
  }
  function compare(previous,current) {
    if (!previous) return { status:'baseline',baseline_block_id:null,reason_codes:['NO_PREVIOUS_COMPATIBLE_BLOCK'],deltas:{} };
    const reasons=[];
    if (previous.context.player_id!==current.context.player_id || previous.context.platform!==current.context.platform) reasons.push('PLAYER_MISMATCH');
    if (previous.context.mode!==current.context.mode) reasons.push('MODE_MISMATCH');
    if (previous.context.match_type!==current.context.match_type) reasons.push('MATCH_TYPE_MISMATCH');
    if (previous.metrics_version!==current.metrics_version) reasons.push('METRICS_VERSION_MISMATCH');
    if (Date.parse(current.first_match_at)<=Date.parse(previous.last_match_at)) reasons.push('CHRONOLOGY_INVALID');
    if (current.replays.some(r=>previous.replays.some(p=>p.replay_id===r.replay_id))) reasons.push('SHARED_REPLAYS');
    if (reasons.length) return {status:'not_comparable',baseline_block_id:previous.block_id,reason_codes:reasons,deltas:{}};
    const a=aggregate(previous.replays), b=aggregate(current.replays), deltas={};
    for (const key of ['shooting_pct','boost_low_pct','shots_per_match']) deltas[key]={baseline:a[key],current:b[key],delta:a[key]===null||b[key]===null?null:b[key]-a[key],unit:key==='shots_per_match'?'shots_per_match':'percentage_points'};
    return {status:'comparable',baseline_block_id:previous.block_id,reason_codes:[],deltas};
  }
  function diagnose(metrics) {
    const priorities=[];
    if (metrics.boost_low_pct!==null && metrics.boost_low_pct>RULES.boostLow) priorities.push({priority_key:'boost',rule_id:'demo-boost-low',score:2,title:'Administración de boost',description:'El tiempo con 0–25 de boost supera la referencia de esta demo. Practica rutas de pads pequeños para reducir los períodos con pocos recursos.',evidence:{metric_key:'boost_low_pct',value:metrics.boost_low_pct,unit:'percent',threshold:RULES.boostLow,direction:'above'},rules_version:RULES_VERSION});
    if (metrics.shooting_pct!==null && metrics.shooting_pct<RULES.shooting) priorities.push({priority_key:'shooting',rule_id:'demo-shooting',score:1,title:'Precisión de tiro',description:'La conversión de tiros todavía está por debajo de la referencia de ejemplo. Trabaja colocación y contacto antes de añadir velocidad.',evidence:{metric_key:'shooting_pct',value:metrics.shooting_pct,unit:'percent',threshold:RULES.shooting,direction:'below'},rules_version:RULES_VERSION});
    return priorities.sort((a,b)=>b.score-a.score||a.rule_id.localeCompare(b.rule_id)).slice(0,3);
  }
  function analysis(scenario) {
    const current=clone(scenario==='followup'?followup:initial);
    const baseline=scenario==='followup'?clone(initial):null;
    const metrics=aggregate(current.replays);
    return {meta:{contract_version:'1.0',synthetic:true},data:{block_id:current.block_id,block:current,metrics_version:METRICS_VERSION,metrics,comparison:compare(baseline,current),priorities:diagnose(metrics),rules_version:RULES_VERSION,limitations:['synthetic_fixture','illustrative_thresholds_not_calibrated']}};
  }
  const CATALOG = {
    warmup:{exercise_id:'demo-warmup',title:'Control y contacto',kind:'Calentamiento',difficulty:'Suave',purpose:'Preparar el control del balón antes de trabajar las prioridades.',steps:['Entra a entrenamiento libre en una arena estándar.','Alterna controles suaves, cambios de dirección y contactos con el balón.','Busca contacto limpio; prioriza control sobre velocidad.'],goal:'Terminar con control consistente del balón.',resource:'Entrenamiento libre · Steam y Epic Games'},
    boost:{exercise_id:'demo-pads',title:'Rutas de pads pequeños',kind:'Administración de boost',difficulty:'Básica',purpose:'Mantener recursos durante el movimiento sin depender de los pads grandes.',steps:['En entrenamiento libre, recorre una vuelta usando pads pequeños.','Alterna recorridos ofensivos y defensivos, manteniendo control del vehículo.','Evita desviarte hacia los pads grandes y revisa dónde pierdes la ruta.'],goal:'Completar tres recorridos consecutivos conservando una ruta fluida.',resource:'Entrenamiento libre · Steam y Epic Games'},
    shooting:{exercise_id:'demo-shooting',title:'Tiros colocados',kind:'Precisión de tiro',difficulty:'Básica',purpose:'Mejorar el contacto y dirigir el balón hacia una zona elegida de la portería.',steps:['Coloca el balón en una posición reproducible en entrenamiento libre.','Elige una zona de la portería y realiza diez intentos desde un ángulo similar.','Anota cuántos entran y repite con otro ángulo; prioriza colocación.'],goal:'Registrar aciertos de práctica sin confundirlos con métricas de partidas.',resource:'Entrenamiento libre · Steam y Epic Games'}
  };
  function plan(snapshot,version) {
    const state=typeof snapshot==='string'?parseSnapshot(snapshot):snapshot;
    const a=analysis(state.scenario).data;
    const minutes=state.minutes===20?20:40;
    const warmup=minutes===40?5:3;
    const remaining=minutes-warmup;
    const focus=Math.round(remaining*(state.scenario==='followup'?.72:.57));
    const entries=state.scenario==='followup'?[['warmup',warmup,'Preparación'],['shooting',focus,'Prioridad principal'],['boost',remaining-focus,'Mantenimiento']]:[['warmup',warmup,'Preparación'],['boost',focus,'Prioridad principal'],['shooting',remaining-focus,'Segunda prioridad']];
    const exercises=entries.map(([key,duration,role],i)=>({plan_exercise_id:`demo-v${version}-e${i+1}`,priority_key:key,assigned_minutes:duration,role,exercise_snapshot:clone(CATALOG[key])}));
    return {meta:{contract_version:'1.0',synthetic:true},data:{plan_id:'test-plan',plan_version_id:`test-plan-v${version}`,version,block_id:a.block_id,metrics_version:METRICS_VERSION,rules_version:RULES_VERSION,availability_minutes:minutes,coverage:'complete',diagnosis_snapshot:{priorities:clone(a.priorities)},goals_snapshot:[{metric_key:'shooting_pct',target_value:35,unit:'percent'}],profile_snapshot:{...CONTEXT,available_minutes:minutes},exercises}};
  }
  function parseSnapshot(value) {
    const match=/^(initial|followup)-(20|40)$/.exec(value||'');
    return match?{scenario:match[1],minutes:Number(match[2])}:{scenario:'initial',minutes:40};
  }
  function validateFiles(files) {
    if(files.length!==5)return {ok:false,message:`Selecciona exactamente cinco archivos .replay. Actualmente tienes ${files.length}.`};
    if(files.some(f=>!f.name.toLowerCase().endsWith('.replay')))return {ok:false,message:'Todos los archivos deben tener extensión .replay.'};
    const ids=files.map(f=>`${f.name.toLowerCase()}|${f.size}`);
    if(new Set(ids).size!==files.length)return {ok:false,message:'Hay archivos repetidos. Sustituye el duplicado antes de continuar.'};
    return {ok:true,message:'Cantidad y extensión válidas. El análisis siguiente usa datos de ejemplo; los archivos no se leen ni se envían.'};
  }
  const api={aggregate,compare,diagnose,analysis,plan,parseSnapshot,validateFiles,initial:clone(initial),followup:clone(followup),rules:RULES};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.CoachDemoData=api;
}(typeof window!=='undefined'?window:globalThis));
