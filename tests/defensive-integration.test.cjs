const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { createApp } = require('../src/app');
const { defensiveBlock } = require('./helpers/defensive-inputs.cjs');
const { findReplayPlayer } = require('../src/services/replay-validation');
const { storedDatabase,A } = require('./helpers/stored-database.cjs');
let server,base;
test.before(async()=>{
  const block=defensiveBlock({ boost:true,shooting:true });
  block.replays.forEach(r=>{findReplayPlayer(r,block.profile).id.id='TEST_PLAYER_A';});
  block.profile.player_id='TEST_PLAYER_A';block.owner_id=A;
  const repository={
    async getBlockForUser(id,userId){return id==='defensive-current'&&userId===A?structuredClone(block):null;},
    async listBlocksForUser(){return[];},
  };
  const app=createApp({supabase:storedDatabase(),analysisRepository:repository,enableAnalysisDemo:true});
  await new Promise(resolve=>{server=app.listen(0,'127.0.0.1',resolve);});
  base='http://127.0.0.1:'+server.address().port;
});
test.after(()=>new Promise(resolve=>server.close(resolve)));
async function request(path,{post=false,token='token-a',minutes=15}={}){
  const response=await fetch(base+path,{method:post?'POST':'GET',
    headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
    ...(post?{body:JSON.stringify({availability_minutes:minutes})}:{})});
  return{status:response.status,body:await response.json()};
}
test('HTTP privado calcula tres reglas y propone tres áreas con la evidencia del servidor',async()=>{
  const a=await request('/api/v1/blocks/defensive-current/analysis');
  assert.equal(a.status,200);assert.equal(a.body.meta.synthetic,true);
  assert.deepEqual(a.body.data.priorities.map(p=>p.priority_key),['boost','defensive_review','shooting']);
  const p=await request('/api/v1/blocks/defensive-current/plan-proposal',{post:true});
  assert.equal(p.status,200);assert.equal(p.body.meta.persisted,false);
  assert.equal(p.body.data.coverage,'complete');assert.equal(p.body.data.assigned_minutes,15);
  assert.deepEqual(p.body.data.exercises.map(e=>e.assigned_minutes),[5,5,5]);
  assert.equal(p.body.data.review_catalog_version,'mvp.native-review.v1');
});
test('La integración mantiene 401 sin sesión y 404 para otro propietario',async()=>{
  assert.equal((await request('/api/v1/blocks/defensive-current/plan-proposal',{post:true,token:null})).status,401);
  assert.equal((await request('/api/v1/blocks/defensive-current/plan-proposal',{post:true,token:'token-b'})).status,404);
});
for(const[name,status,count]of[
  ['defense','active',1],['defense-inactive','inactive',0],['defense-missing','not_evaluable',0],['three-priorities','active',3],
  ['defense-long','inactive',0],['defense-long-active','active',1],['defense-duration-missing','not_evaluable',0],
])test('Demo HTTP defensiva identificada: '+name,async()=>{
  const r=await request('/api/v1/demo/analysis?case='+name);
  assert.equal(r.status,200);assert.equal(r.body.meta.synthetic,true);
  assert.equal(r.body.data.priorities.length,count);
  assert.equal(r.body.data.evaluations.find(e=>e.rule_id==='cobertura-defensiva-revision').status,status);
});
for(const name of ['defense','defense-missing','three-priorities','defense-long-active','defense-duration-missing'])test('Controlador de Luis presenta '+name+' con su evidencia correcta',async()=>{
  const elements=new Map();
  function get(id){
    if(!elements.has(id))elements.set(id,{textContent:'',innerHTML:'',value:id==='metric-select'?'shooting_pct':name,
      hidden:false,disabled:false,replaceChildren(){this.innerHTML='';},setAttribute(){},removeAttribute(){},addEventListener(){}});
    return elements.get(id);
  }
  const root={CoachFollowupModel: require('../public/sitio/js/followup-model'),location:{search:'?case='+name,href:base+'/sitio/html/analisis.html?case='+name},fetch:(path,options)=>fetch(base+path,options)};
  const context=vm.createContext({window:root,document:{getElementById:get,addEventListener(){}},URL,URLSearchParams,Intl,console});
  vm.runInContext(fs.readFileSync(require.resolve('../public/js/analysis.js'),'utf8'),context);
  await root.CoachAnalysis.load();
  assert.equal(get('analysis-error').hidden,true);
  if(name==='defense-missing'||name==='defense-duration-missing'){
    assert.match(get('priority-list').innerHTML,/No se puede evaluar la revisión de cobertura defensiva/);
  }else{
    const html=get('priority-list').innerHTML;
    assert.match(html,/COBERTURA DEFENSIVA/);assert.match(html,/Partida 5: 0 goles como último defensor/);
    assert.match(html,/no localiza el minuto/);
    assert.match(html,/goles\/5 min/);
    if(name==='three-priorities'){assert.match(html,/FINALIZACIÓN/);assert.match(html,/DISPONIBILIDAD DE BOOST/);}
  }
});
