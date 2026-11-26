const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { createApp } = require('../src/app');
const { boostBlock } = require('./helpers/boost-inputs.cjs');
const { storedDatabase, A } = require('./helpers/stored-database.cjs');
const { findReplayPlayer } = require('../src/services/replay-validation');
let base, server;
test.before(async () => {
  const db = storedDatabase(), block = boostBlock();
  for (const replay of block.replays) findReplayPlayer(replay, block.profile).id.id = 'TEST_PLAYER_A';
  block.profile.player_id = 'TEST_PLAYER_A'; block.owner_id = A;
  const repository = { async getBlockForUser(id, uid) {
    return id === 'boost-current' && uid === A ? structuredClone(block) : null;
  }, async listBlocksForUser() { return []; } };
  const app = createApp({ supabase: db, analysisRepository: repository, enableAnalysisDemo: true });
  await new Promise(resolve => { server = app.listen(0,'127.0.0.1',resolve); });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => new Promise(resolve => server.close(resolve)));
async function request(path, { post = false, token = 'token-a' } = {}) {
  const response = await fetch(base+path, { method: post ? 'POST' : 'GET',
    headers: { 'Content-Type':'application/json', ...(token ? { Authorization:'Bearer '+token } : {}) },
    ...(post ? { body:JSON.stringify({ availability_minutes:20 }) } : {}) });
  return { status:response.status, body:await response.json() };
}
test('HTTP privado ejecuta ambas reglas y genera dos áreas sin duplicar los minutos', async () => {
  const analysis = await request('/api/v1/blocks/boost-current/analysis');
  assert.equal(analysis.status,200); assert.equal(analysis.body.meta.synthetic,true);
  assert.deepEqual(analysis.body.data.priorities.map(p => p.priority_key),['boost','shooting']);
  const result = await request('/api/v1/blocks/boost-current/plan-proposal',{ post:true });
  assert.equal(result.status,200); assert.equal(result.body.meta.persisted,false);
  assert.equal(result.body.data.assigned_minutes,20);
  assert.deepEqual(result.body.data.exercises.map(e => e.assigned_minutes),[5,5,5,5]);
  assert.equal(result.body.data.native_catalog_version,'mvp.native-boost.v1');
});
test('Nueva propuesta conserva denegación sin sesión y a un dueño diferente', async () => {
  assert.equal((await request('/api/v1/blocks/boost-current/plan-proposal',{ post:true,token:null })).status,401);
  assert.equal((await request('/api/v1/blocks/boost-current/plan-proposal',{ post:true,token:'token-b' })).status,404);
});
for (const [name,count,status] of [['boost',1,'active'],['boost-high',2,'active'],['boost-missing',0,'not_evaluable']]) {
  test('Demo HTTP identificada: '+name,async () => {
    const r = await request('/api/v1/demo/analysis?case='+name);
    assert.equal(r.status,200); assert.equal(r.body.meta.synthetic,true);
    assert.equal(r.body.data.priorities.length,count);
    assert.equal(r.body.data.evaluations[1].status,status);
  });
}
for (const name of ['boost-high','boost-missing']) test('Controlador real de Análisis presenta '+name+' sin confundir evidencia',async () => {
  const elements = new Map();
  function get(id) {
    if (!elements.has(id)) elements.set(id,{ textContent:'',innerHTML:'',value:id==='metric-select'?'boost_zero_s':name,
      hidden:false,disabled:false,replaceChildren(){this.innerHTML='';},setAttribute(){},removeAttribute(){},addEventListener(){} });
    return elements.get(id);
  }
  const root = { CoachFollowupModel: require('../public/sitio/js/followup-model'), location:{ search:'?case='+name,href:base+'/sitio/html/analisis.html?case='+name },
    fetch:(path,options)=>fetch(base+path,options) };
  const context = vm.createContext({window:root,document:{getElementById:get,addEventListener(){}},URL,URLSearchParams,Intl,console});
  vm.runInContext(fs.readFileSync(require.resolve('../public/sitio/js/player-ui.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(require.resolve('../public/js/analysis.js'),'utf8'),context);
  await root.CoachAnalysis.load();
  assert.equal(get('analysis-error').hidden,true);
  assert.match(get('metric-rows').innerHTML,/Tiempo acumulado con cero boost/);
  if (name==='boost-high') {
    assert.match(get('priority-list').innerHTML,/DISPONIBILIDAD DE BOOST/);
    assert.match(get('priority-list').innerHTML,/FINALIZACIÓN/);
    assert.match(get('priority-list').innerHTML,/Partida 5:/);
  } else assert.match(get('priority-list').innerHTML,/No se puede evaluar la disponibilidad de boost/);
});
