(function($){
  'use strict';
  const data=window.CoachDemoData;
  const params=new URLSearchParams(window.location.search);
  const validHistory=(params.get('history')||'').split('.').filter(v=>/^(initial|followup)-(20|40)$/.test(v));
  const scenario=params.get('scenario')==='followup'?'followup':'initial';
  const minutes=params.get('minutes')==='20'?20:40;
  const start=`${scenario}-${minutes}`;
  const state={history:validHistory.length?validHistory:(scenario==='followup'?['initial-40',start]:[start]),files:[],isFixture:false,chart:null};
  let toastTimer;
  const selected=()=>data.parseSnapshot(state.history[state.history.length-1]);
  const $id=id=>document.getElementById(id);
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=v=>v===null?'No disponible':new Intl.NumberFormat('es-MX',{maximumFractionDigits:1}).format(v);
  const signed=v=>v===null?'—':`${v>0?'+':''}${number(v)}`;
  function query(){const s=selected();return new URLSearchParams({scenario:s.scenario,minutes:String(s.minutes),history:state.history.join('.')}).toString();}
  function sync(){
    const s=selected();
    $('.scenario-select').val(s.scenario);
    $(`input[name="minutes"][value="${s.minutes}"]`).prop('checked',true);
    $('[data-availability]').text(`${s.minutes} minutos`);
    $('[data-block-label]').text(s.scenario==='initial'?'Bloque 01':'Bloque 02');
    document.querySelectorAll('a[data-page]').forEach(a=>{a.href=`${a.dataset.page}?${query()}`;});
    try{window.history.replaceState(null,'',`${window.location.pathname}?${query()}`);}catch{/* file:// can restrict history; links still carry state. */}
  }
  function toast(message){const node=$id('toast-status');node.textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{node.textContent='';},4500);}
  function update(next){
    const current=selected();
    const entry=`${next.scenario||current.scenario}-${next.minutes||current.minutes}`;
    if(entry!==state.history[state.history.length-1])state.history.push(entry);
    sync();renderPage();
  }
  function notify(message,type='error'){
    const node=$id('file-notice');if(!node)return;
    node.hidden=false;node.className=`notice ${type}`;node.textContent=message;
  }
  function renderFiles(showNotice=false){
    const list=$id('file-list');if(!list)return;
    list.replaceChildren();
    if(!state.files.length){const li=document.createElement('li');li.className='empty-files';li.textContent='Aún no hay replays seleccionados.';list.append(li);}
    state.files.forEach((file,i)=>{
      const li=document.createElement('li');li.className='file-row';
      const fileIcon=document.createElement('span');fileIcon.className='subtle';fileIcon.textContent=String(i+1).padStart(2,'0');
      const name=document.createElement('span');name.className='file-name';name.textContent=file.name;
      const status=document.createElement('span');status.className='file-state';status.textContent=state.isFixture?'Ejemplo':'Local';
      const remove=document.createElement('button');remove.type='button';remove.className='remove-file';remove.setAttribute('aria-label',`Quitar ${file.name}`);remove.textContent='×';remove.addEventListener('click',()=>{state.files.splice(i,1);renderFiles(true);});
      li.append(fileIcon,name,status,remove);list.append(li);
    });
    $id('file-count').textContent=`${state.files.length} de 5`;
    const validation=data.validateFiles(state.files);$id('view-analysis').disabled=!validation.ok;
    if(showNotice)notify(state.isFixture&&validation.ok?'Cinco replays ficticios listos para recorrer la demostración.':validation.message,validation.ok?'success':'error');
  }
  function bindUpload(){
    const input=$id('replay-input'), zone=$id('dropzone');
    if(!input)return;
    $id('select-files').addEventListener('click',()=>input.click());
    input.addEventListener('change',()=>{state.files=Array.from(input.files);state.isFixture=false;renderFiles(true);input.value='';});
    zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag-over');});
    zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
    zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag-over');state.files=Array.from(e.dataTransfer.files);state.isFixture=false;renderFiles(true);});
    $id('use-fixtures').addEventListener('click',()=>{state.files=Array.from({length:5},(_,i)=>({name:`demo_2v2_partida_0${i+1}.replay`,size:0}));state.isFixture=true;renderFiles(true);});
    $id('upload-form').addEventListener('submit',async e=>{
      e.preventDefault();
      const check=data.validateFiles(state.files);
      if(!check.ok){notify(check.message);return;}
      if(state.isFixture){window.location.href=`analisis.html?${query()}`;return;}
      const button=$id('view-analysis');button.disabled=true;button.firstChild.textContent='Enviando replays... ';
      try{
        const block=await window.CoachBlocks.create(state.files);
        notify(`Carga aceptada. El bloque ${block.block_id} está ${window.CoachBlocks.label(block.status).toLowerCase()}; podrás abrir Análisis cuando esté listo.`,'success');
        button.firstChild.textContent='Carga iniciada ';
      }catch(error){
        button.disabled=false;notify(error.message,'error');button.firstChild.textContent='Iniciar análisis ';
      }
    });
    renderFiles();
  }
  function metricCard(id,value,unit,foot){$id(`${id}-value`).innerHTML=`${esc(number(value))}<span class="unit">${esc(unit)}</span>`;$id(`${id}-foot`).textContent=foot;}
  const metrics={shooting_pct:{label:'Precisión de tiro',unit:'%',description:'Goles ÷ tiros × 100. El cambio se expresa en puntos porcentuales.'},boost_low_pct:{label:'Tiempo con boost bajo',unit:'%',description:'Porcentaje de tiempo con 0–25 de boost. Es una señal, no una explicación de cada jugada.'},shots_per_match:{label:'Tiros por partida',unit:'tiros',description:'Tiros totales ÷ cinco partidas válidas del jugador.'}};
  function chart(analysis,key){
    const metric=metrics[key];const comparison=analysis.comparison;const two=comparison.status==='comparable';
    const values=two?[comparison.deltas[key].baseline,comparison.deltas[key].current]:[analysis.metrics[key]];
    $id('chart-description').textContent=metric.description;
    $id('comparison-chart').setAttribute('aria-label',`${metric.label}: ${two?'bloque anterior '+number(values[0])+metric.unit+', bloque actual ':''}${number(values[values.length-1])}${metric.unit}. Valores también disponibles en la tabla.`);
    if(state.chart)state.chart.destroy();
    if(!window.Chart){$id('chart-description').textContent='Consulta los valores en la tabla de métricas.';return;}
    state.chart=new Chart($id('comparison-chart'),{type:'bar',data:{labels:two?['Bloque 01 · anterior','Bloque 02 · actual']:['Bloque 01 · línea base'],datasets:[{data:values,backgroundColor:two?['#43566e','#70ebc2']:['#70ebc2'],borderRadius:6,maxBarThickness:72,barPercentage:.65}]},options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${number(c.parsed.y)} ${metric.unit}`}}},scales:{x:{grid:{display:false},ticks:{color:'#a1b0c4',font:{size:10}},border:{display:false}},y:{beginAtZero:true,suggestedMax:key==='shots_per_match'?6:50,grid:{color:'#253448'},ticks:{color:'#a1b0c4',font:{size:10},callback:v=>`${v}${key==='shots_per_match'?'':'%'}`},border:{display:false}}}}});
  }
  async function renderAnalysis(){
    if(!$id('comparison-chart'))return;
    const s=selected();const result=await window.CoachDemoService.loadAnalysis(s.scenario);const a=result.data;const comparable=a.comparison.status==='comparable';
    metricCard('shooting',a.metrics.shooting_pct,'%',comparable?'+5 pp frente al bloque anterior':'5 goles de 20 tiros · línea base');
    metricCard('boost',a.metrics.boost_low_pct,'%',comparable?'−15 pp de tiempo con 0–25 de boost':'Tiempo con 0–25 de boost');
    metricCard('shots',a.metrics.shots_per_match,'',comparable?'Sin cambio · 20 tiros en 5 partidas':'20 tiros en 5 partidas');
    metricCard('sample',a.metrics.sample_size,'replays','Mismo jugador · 2v2 · PC');
    $id('analysis-period').textContent=a.block.period;
    $id('comparison-message').textContent=comparable?'Bloques compatibles: mismo jugador, modalidad y medición. El cambio de precisión es +5 puntos porcentuales.':'Este bloque es tu línea base. Todavía no hay un bloque anterior con el que comparar.';
    $id('metric-rows').innerHTML=Object.entries(metrics).map(([key,m])=>`<tr><td>${esc(m.label)}</td><td>${comparable?number(a.comparison.deltas[key].baseline):'—'}</td><td>${number(a.metrics[key])}${m.unit==='%'?' %':''}</td><td>${comparable?signed(a.comparison.deltas[key].delta)+(m.unit==='%'?' pp':''):'Línea base'}</td></tr>`).join('');
    $id('priority-count').textContent=`${a.priorities.length} de 3 como máximo`;
    $id('priority-list').innerHTML=a.priorities.map((p,i)=>`<article class="priority-card ${i?'secondary':''}"><div class="priority-top"><span>PRIORIDAD ${String(i+1).padStart(2,'0')}</span><span>${p.priority_key==='boost'?'RECURSOS':'PRECISIÓN'}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><details><summary>Ver evidencia y regla de ejemplo</summary><p>${number(p.evidence.value)} % ${p.evidence.direction==='above'?'supera':'está por debajo de'} ${number(p.evidence.threshold)} %. Referencia ilustrativa para esta demo, pendiente de calibración. Cinco replays sintéticos.</p></details></article>`).join('');
    $id('maintenance-note').hidden=!comparable;
    chart(a,$id('metric-select').value);
    $id('metric-select').onchange=()=>chart(a,$id('metric-select').value);
  }
  async function renderPlan(){
    const selector=$id('version-select');if(!selector)return;
    selector.innerHTML=state.history.map((entry,i)=>{const s=data.parseSnapshot(entry);return `<option value="${i}">Versión ${i+1} · ${s.scenario==='initial'?'bloque 01':'bloque 02'} · ${s.minutes} min</option>`;}).join('');
    let index=state.planVersion===undefined?state.history.length-1:Math.min(state.planVersion,state.history.length-1);
    selector.value=String(index);selector.onchange=()=>{state.planVersion=Number(selector.value);renderPlan();};
    const snapshot=data.parseSnapshot(state.history[index]);const response=await window.CoachDemoService.loadPlan(snapshot,index+1);const plan=response.data;
    $id('plan-version').textContent=`Versión ${plan.version}`;$id('plan-duration').innerHTML=`${plan.availability_minutes}<span> min</span>`;
    $id('plan-caption').textContent=`${snapshot.scenario==='initial'?'Bloque 01':'Bloque 02'} · ${snapshot.scenario==='initial'?'Dos prioridades':'Una prioridad y mantenimiento'} · PC / Steam`;
    const colors=['#647c98','#70ebc2','#b9a6ff'];
    $id('duration-bar').innerHTML=plan.exercises.map((e,i)=>`<span style="width:${100*e.assigned_minutes/plan.availability_minutes}%;background:${colors[i]}" aria-hidden="true"></span>`).join('');
    $id('duration-legend').innerHTML=plan.exercises.map((e,i)=>`<span><i style="background:${colors[i]}"></i>${esc(e.priority_key==='warmup'?'Calentamiento':e.exercise_snapshot.kind)} · ${e.assigned_minutes} min</span>`).join('');
    $id('exercise-list').innerHTML=plan.exercises.map((e,i)=>{const x=e.exercise_snapshot;return `<li class="exercise"><details${i===1?' open':''}><summary><span class="exercise-number">${String(i+1).padStart(2,'0')}</span><span class="exercise-copy"><strong>${esc(x.title)}</strong><small>${esc(e.role)} · ${esc(x.difficulty)}</small></span><span class="exercise-minutes">${e.assigned_minutes} <span>min</span></span><span class="chevron" aria-hidden="true">⌄</span></summary><div class="exercise-detail"><p>${esc(x.purpose)}</p><ol>${x.steps.map(step=>'<li>'+esc(step)+'</li>').join('')}</ol><p>${esc(x.resource)}</p><div class="exercise-goal">Meta de práctica: ${esc(x.goal)}</div></div></details></li>`;}).join('');
    $id('plan-reason').innerHTML=snapshot.scenario==='initial'?'<li><strong>Boost como prioridad principal</strong>39 % de tiempo con boost bajo activa la regla ilustrativa; concentra el trabajo en rutas de pads.</li><li><strong>Precisión como segunda prioridad</strong>25 % de conversión mantiene práctica de tiros colocados.</li>':'<li><strong>Más tiempo para precisión</strong>La precisión pasó de 25 % a 30 %, pero aún no llega a la referencia de ejemplo de 35 %.</li><li><strong>Boost pasa a mantenimiento</strong>El tiempo con boost bajo bajó de 39 % a 24 %. Conservamos práctica breve en vez de eliminarla.</li>';
    $id('plan-reason').innerHTML+=`<li><strong>Una rutina de ${plan.availability_minutes} minutos</strong>Calentamiento y ejercicios suman exactamente el tiempo disponible.</li>`;
    $id('historical-note').hidden=index===state.history.length-1;
    $id('historical-note').textContent=`Estás consultando la versión ${index+1}. Sus ${plan.availability_minutes} minutos y ejercicios se conservan aunque cambies la configuración actual.`;
  }
  function renderPage(){if($id('comparison-chart'))renderAnalysis();if($id('version-select')){state.planVersion=undefined;renderPlan();}}
  $(function(){
    sync();bindUpload();renderPage();
    $('.scenario-select').on('change',function(){update({scenario:this.value});toast(this.value==='followup'?'Mostrando un bloque posterior compatible de ejemplo.':'Mostrando el primer bloque de ejemplo.');});
    $('input[name="minutes"]').on('change',function(){update({minutes:Number(this.value)});toast(`Nueva versión de ejemplo con ${this.value} minutos. Las anteriores se conservan.`);});
    $('[data-reset]').on('click',function(){state.history=['initial-40'];state.files=[];state.isFixture=false;sync();renderPage();renderFiles();if($id('file-notice'))$id('file-notice').hidden=true;toast('Demo restablecida: primer bloque y 40 minutos.');});
  });
}(jQuery));
