(function(root){
  'use strict';
  const $ = id => document.getElementById(id);
  const definitions = {
    shooting_pct: { label: 'Eficiencia de tiro', unit: '%' },
    goals: { label: 'Goles', unit: 'goles' },
    shots: { label: 'Tiros totales', unit: 'tiros' },
    play_duration_s: { label: 'Duración de las partidas', unit: 's' },
    boost_zero_s: { label: 'Tiempo acumulado con cero boost', unit: 's' },
  };
  const reasons = {
    MODE_MISMATCH: 'Las modalidades son distintas.', PLAYER_MISMATCH: 'La identidad del jugador es distinta.',
    MATCH_TYPE_MISMATCH: 'El tipo de partida es distinto.', CHRONOLOGY_INVALID: 'No se pudo comprobar un orden temporal posterior.',
    SHARED_REPLAYS: 'Los bloques comparten partidas.', METRICS_VERSION_MISMATCH: 'La medición utiliza versiones diferentes.',
    SAME_BLOCK: 'Se eligió el mismo bloque.', SOURCE_MISMATCH: 'Las fuentes de datos son distintas.',
    BLOCK_NOT_READY: 'El bloque anterior no está listo.', NO_COMPARABLE_METRICS: 'No hay métricas suficientes para comparar.',
  };
  let activeAnalysis = null, activeChart = null, requestId = 0;
  let tokenProvider = async () => {
    if (root.CoachAuth?.getAccessToken) return root.CoachAuth.getAccessToken();
    const client = root.CoachProfileApi?.getClient();
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw new Error('No se pudo comprobar tu sesión. Inicia sesión de nuevo.');
    return data?.session?.access_token ?? null;
  };
  const number = value => Number.isFinite(value)
    ? new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 }).format(value) : 'No disponible';
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const unit = (key, value) => Math.abs(value) === 1 && key === 'goals' ? 'gol'
    : Math.abs(value) === 1 && key === 'shots' ? 'tiro' : definitions[key].unit;
  const measure = (metric, key) => metric?.value == null ? 'No disponible' : `${number(metric.value)} ${unit(key, metric.value)}`;

  function clear() {
    activeAnalysis = null;
    if (activeChart) activeChart.destroy(); activeChart = null;
    for (const name of ['shooting', 'goals', 'shots', 'sample']) {
      $(`${name}-value`).textContent = '—'; $(`${name}-foot`).textContent = '';
    }
    $('metric-rows').replaceChildren(); $('priority-list').replaceChildren();
    $('priority-count').textContent = ''; $('comparison-message').textContent = '';
    $('analysis-period').textContent = ''; $('chart-description').textContent = '';
    $('comparison-chart').setAttribute('aria-label', 'Sin datos de análisis.');
  }

  function plot(key) {
    if (!activeAnalysis) return;
    const a = activeAnalysis, metric = definitions[key];
    const delta = a.comparison.deltas?.[key];
    const compared = a.comparison.status === 'comparable';
    const values = compared ? [delta?.baseline ?? null, delta?.current ?? null] : [a.metrics.values[key]?.value ?? null];
    const labels = compared ? ['Anterior', 'Actual'] : ['Bloque actual'];
    $('chart-description').textContent = key === 'shooting_pct'
      ? 'Goles ÷ tiros × 100. Los cambios se expresan en puntos porcentuales.'
      : key === 'play_duration_s' ? 'Segundos de las partidas; no representa tiempo individual de participación.'
      : key === 'boost_zero_s' ? 'Segundos acumulados del jugador con exactamente cero boost. La regla evalúa el porcentaje de cada partida por separado.'
      : `Conteo del jugador seleccionado en cinco partidas. Unidad: ${metric.unit}.`;
    $('comparison-chart').setAttribute('aria-label', `${metric.label}: ${values.map((v, i) => `${labels[i]} ${measure({ value: v }, key)}`).join('; ')}. Valores también disponibles en la tabla.`);
    if (activeChart) activeChart.destroy();
    if (!root.Chart) return;
    activeChart = new root.Chart($('comparison-chart'), {
      type: 'bar', data: { labels, datasets: [{ data: values, backgroundColor: compared ? ['#43566e', '#70ebc2'] : ['#70ebc2'], borderRadius: 6, maxBarThickness: 72 }] },
      options: { responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { color: '#a1b0c4' } }, x: { ticks: { color: '#a1b0c4' } } } },
    });
  }

  function render(envelope) {
    const a = envelope.data;
    if (!a?.metrics?.values || !a.comparison || !Array.isArray(a.priorities)) throw new Error('La respuesta de análisis está incompleta.');
    activeAnalysis = a;
    const values = a.metrics.values, comparison = a.comparison;
    function card(name, key) {
      $(name + '-value').textContent = measure(values[key], key);
      const metric = values[key];
      $(name + '-foot').textContent = `${metric?.coverage ?? 0} de ${a.metrics.sample_size} partidas con datos${metric?.missing_reason ? '; medición no disponible' : ''}.`;
    }
    card('shooting', 'shooting_pct'); card('goals', 'goals'); card('shots', 'shots');
    $('sample-value').textContent = `${a.metrics.sample_size} replays`;
    const context = a.metrics.context;
    $('sample-foot').textContent = `${context.mode} · ${context.match_type} · ${context.platform}`;
    const first = Date.parse(a.block.first_match_at), last = Date.parse(a.block.last_match_at);
    const format = value => new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(value);
    $('analysis-period').textContent = Number.isFinite(first) && Number.isFinite(last)
      ? `${format(first)} — ${format(last)} UTC` : 'Fechas de partida no disponibles.';
    if (comparison.status === 'baseline') $('comparison-message').textContent = 'Este bloque establece tu línea base. No hay un bloque anterior compatible para calcular cambios.';
    else if (comparison.status === 'not_comparable') {
      $('comparison-message').textContent = 'No se pueden comparar estos bloques. ' + comparison.reason_codes.map(code => reasons[code] || 'No se cumplen los requisitos de comparación.').join(' ');
    } else {
      const change = comparison.deltas?.shooting_pct;
      $('comparison-message').textContent = change?.delta == null
        ? 'Los bloques son compatibles; la eficiencia no tiene datos completos para calcular su cambio.'
        : `Bloques compatibles. Cambio de eficiencia: ${change.delta > 0 ? '+' : ''}${number(change.delta)} puntos porcentuales.`;
    }
    $('metric-rows').innerHTML = Object.entries(definitions).map(([key, metric]) => {
      const delta = comparison.deltas?.[key];
      const previous = comparison.status === 'comparable' && delta?.baseline != null ? measure({ value: delta.baseline }, key) : '—';
      const difference = delta?.delta == null ? '—' : `${delta.delta > 0 ? '+' : ''}${number(delta.delta)} ${delta.unit === 'percentage_points' ? 'pp' : unit(key, delta.delta)}`;
      return `<tr><td>${escape(metric.label)}</td><td>${escape(previous)}</td><td>${escape(measure(values[key], key))}<br><small>${escape(`${values[key]?.coverage ?? 0}/${a.metrics.sample_size} partidas`)}</small></td><td>${escape(difference)}</td></tr>`;
    }).join('');
    $('priority-count').textContent = `${a.priorities.length} de 3 como máximo`;
    $('priority-list').innerHTML = a.priorities.map((p, index) => {
      const boost = p.priority_key === 'boost', defense = p.priority_key === 'defensive_review', e = p.evidence;
      const detail = defense
        ? `${e.matched_replays}/5 partidas con ≥ ${e.threshold} goles como último defensor por cada 5 minutos jugados; se requieren ${e.required_matches}; cobertura ${e.coverage}/5 de conteo y duración. El contexto posicional no modifica la activación.`
        : boost
        ? `${e.matched_replays}/5 partidas con ≥ ${e.threshold} % en cero; ${e.high_matched_replays}/5 con ≥ ${e.high_threshold} %. Se requieren ${e.required_matches}; cobertura ${e.coverage}/5.`
        : `${number(e.goals.value)} goles / ${number(e.shots.value)} tiros; ${e.coverage}/5 partidas. Mínimo aplicado: ${e.min_shots} tiros.`;
      const observations = defense ? `<ul>${e.observations.map((o, i) => `<li>Partida ${i + 1}: ${escape(number(o.goals.value))} goles como último defensor en ${escape(number(o.duration.value))} s de partida; equivalente a ${escape(number(o.rate.value))} goles/5 min; ${escape(number(o.role_seconds.value))} s en el papel más retrasado (${escape(number(o.role_percent.value))} %); por delante del balón ${escape(number(o.infront_percent.value))} %; separación media ${escape(number(o.mates_distance.value))} uu.</li>`).join('')}</ul><p>El agregado no localiza el minuto del gol ni demuestra un error; la revisión de la replay es manual.</p>`
        : boost ? `<ul>${e.observations.map((o, i) => `<li>Partida ${i + 1}: ${escape(number(o.percent_zero_boost))} % en cero; ${escape(number(o.time_zero_boost_s))} s acumulados.</li>`).join('')}</ul>` : '';
      return `<article class="priority-card${index ? ' secondary' : ''}"><div class="priority-top d-flex justify-content-between flex-wrap gap-2"><span>PRIORIDAD ${String(index + 1).padStart(2, '0')}</span><span>${defense ? 'COBERTURA DEFENSIVA' : boost ? 'DISPONIBILIDAD DE BOOST' : 'FINALIZACIÓN'}</span></div><h3>${escape(p.title)}</h3><p>${escape(p.explanation)}</p><details><summary>Ver evidencia y regla</summary><p>${escape(p.rule_id)} · ${escape(p.rules_version)}. ${escape(detail)} Criterio inicial pendiente de calibración.</p>${observations}</details></article>`;
    }).join('') + (a.evaluations || []).filter(e => e.status !== 'active').map(e => `<p>${escape(e.explanation)}</p>`).join('');
    $('analysis-source').textContent = envelope.meta.synthetic
      ? 'Datos sintéticos de prueba. El motor calcula estas métricas y prioridades; no provienen de replays cargados.'
      : 'Estadísticas del bloque consultado. Las recomendaciones usan criterios iniciales pendientes de calibración.';
    plot($('metric-select').value);
  }

  async function load() {
    const id = ++requestId;
    clear(); $('analysis-error').hidden = true;
    $('analysis-status').textContent = 'Cargando análisis…'; $('metric-select').disabled = true;
    const params = new URLSearchParams(root.location.search);
    try {
      const headers = {}, block = params.get('block_id');
      let endpoint;
      if (params.has('block_id')) {
        if (!block?.trim()) throw new Error('Selecciona un bloque válido.');
        const token = await tokenProvider();
        if (!token) throw new Error('Inicia sesión para consultar tus bloques.');
        headers.Authorization = `Bearer ${token}`;
        endpoint = `/api/v1/blocks/${encodeURIComponent(block)}/analysis`;
        if (params.has('baseline_id')) endpoint += '?' + new URLSearchParams({ baseline_id: params.get('baseline_id') });
      } else endpoint = '/api/v1/demo/analysis?' + new URLSearchParams({ case: $('scenario-select').value });
      const response = await root.fetch(endpoint, { headers, cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || 'No se pudo obtener el análisis.');
      if (id !== requestId) return;
      render(body); $('analysis-status').textContent = ''; $('metric-select').disabled = false;

      // A27 recibe el mismo bloque que acaba de analizarse; las demos no crean planes.
      if (block && /^[1-9]\d{0,17}$/.test(block)) {
        const plan = $('analysis-plan-link');
        plan.href = 'plan.html?' + new URLSearchParams({ block_id: block });
        plan.removeAttribute('aria-disabled');
        plan.tabIndex = 0;
        plan.textContent = 'Ver o generar mi plan';
      }

    } catch (error) {
      if (id !== requestId) return;
      clear(); $('analysis-status').textContent = '';
      $('analysis-error').textContent = error instanceof TypeError ? 'No se pudo conectar con el servidor de análisis. Intenta de nuevo.' : error.message;
      $('analysis-error').hidden = false;
    }
  }

  root.CoachAnalysis = { load, configure({ getAccessToken }) { if (typeof getAccessToken === 'function') tokenProvider = getAccessToken; } };
  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(root.location.search), real = params.has('block_id');
    $('scenario-select').hidden = real; $('scenario-label').hidden = real;
    $('scenario-select').value = params.get('case') || params.get('scenario') || 'initial';
    if (!$('scenario-select').value) $('scenario-select').value = 'initial';
    $('scenario-select').addEventListener('change', () => {
      const url = new URL(root.location.href); url.searchParams.set('case', $('scenario-select').value); url.searchParams.delete('scenario');
      root.history.replaceState(null, '', url); load();
    });
    $('metric-select').addEventListener('change', () => plot($('metric-select').value));
    const plan = $('analysis-plan-link'); plan.removeAttribute('href'); plan.setAttribute('aria-disabled', 'true');
    plan.tabIndex = -1; plan.textContent = 'Plan de este bloque no disponible';
    // El gate de Perfil llama a load después de comprobar el perfil privado.
    if (!real) load();
  });
}(window));
