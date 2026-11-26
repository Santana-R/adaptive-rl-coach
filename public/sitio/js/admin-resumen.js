'use strict';

// A32 · Panel admin: conteos actuales de GET /api/v1/admin/summary.
(async function () {
  const { request, guard, notify, escape, date } = window.CoachAdmin;
  const $ = id => document.getElementById(id);
  const list = items => items.map(text => `<li>${escape(text)}</li>`).join('');
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const demoToggle = $('progress-demo-toggle');
  const demo = $('progress-demo');
  const results = $('progress-demo-results');
  const days = $('progress-demo-days');
  const mode = $('progress-demo-mode');
  const status = $('progress-demo-status');
  const formatDate = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: 'UTC' });
  let demoRequest = 0;

  async function loadDemo() {
    const currentRequest = ++demoRequest;
    results.hidden = true;
    status.textContent = 'Calculando progreso de ejemplo…';
    try {
      const query = new URLSearchParams({ days: days.value, mode: mode.value });
      const { data } = await request('GET', `/api/v1/admin/summary/progress-demo?${query}`);
      if (currentRequest !== demoRequest) return;

      for (const key of ['shooting', 'goals', 'ranks']) {
        const { count, evaluated, excluded } = data[key];
        $(`demo-${key}`).textContent = evaluated ? `${count} de ${evaluated}` : '—';
        $(`demo-${key}-excluded`).textContent = evaluated || excluded
          ? plural(excluded, 'excluido por falta de evidencia', 'excluidos por falta de evidencia')
          : 'Sin casos evaluables';
      }
      const { count, evaluated } = data.shooting;
      const bar = $('demo-shooting-bar');
      bar.max = Math.max(evaluated, 1);
      bar.value = count;
      bar.hidden = evaluated === 0;
      $('demo-shooting-label').textContent = evaluated
        ? `Eficiencia de tiro · ${count} de ${evaluated} (${Math.round(count / evaluated * 100)} %)`
        : 'Eficiencia de tiro · Sin bloques comparables en este periodo';
      const from = formatDate.format(new Date(data.period.from));
      const to = formatDate.format(new Date(data.period.to));
      status.textContent = `${data.mode} · Del ${from} al ${to}`;
      results.hidden = false;
    } catch (error) {
      if (currentRequest === demoRequest) status.textContent = `No se pudo cargar la demo: ${error.message}`;
    }
  }

  if (!await guard()) return;
  demoToggle.addEventListener('click', () => {
    const open = demo.hidden;
    demo.hidden = !open;
    demoToggle.setAttribute('aria-expanded', String(open));
    demoToggle.textContent = open ? 'Cerrar demo de progreso' : 'Ver demo de progreso';
    if (open) {
      $('progress-demo-title').focus();
      loadDemo();
    } else {
      demoRequest++;
    }
  });
  days.addEventListener('change', loadDemo);
  mode.addEventListener('change', loadDemo);

  try {
    const { data: d, meta } = await request('GET', '/api/v1/admin/summary');
    $('r-usuarios').textContent = `${d.users.active} de ${d.users.total}`;
    $('r-usuarios-sub').textContent = `${plural(d.users.suspended, 'suspendido', 'suspendidos')} · ${plural(d.users.admins, 'admin', 'admins')}`;
    $('r-ejercicios').textContent = `${d.catalog.offered} de ${d.catalog.total}`;
    $('r-ejercicios-sub').textContent = `${plural(d.catalog.inactive, 'inactivo', 'inactivos')}`;
    $('r-bloques').textContent = String(d.blocks.needs_correction);
    $('r-bloques-sub').textContent = `${d.blocks.waiting_service} en espera del servicio`;
    $('r-planes').textContent = String(d.plans.saved_versions);
    $('r-planes-sub').textContent = `versiones · ${plural(d.goals.active, 'meta activa', 'metas activas')}`;
    $('r-catalogo').innerHTML = list([
      `${plural(d.catalog.active, 'ejercicio activo', 'ejercicios activos')}, ${d.catalog.inactive} inactivos.`,
      `${plural(d.catalog.verified, 'versión vigente verificada', 'versiones vigentes verificadas')}.`,
      `Ofrecidos en planes nuevos (activos y verificados): ${d.catalog.offered}.`,
    ]);
    $('r-operativo').innerHTML = list([
      `${plural(d.blocks.needs_correction, 'bloque requiere', 'bloques requieren')} corrección.`,
      `${d.blocks.waiting_service} en espera del servicio; ${d.blocks.processing} procesando.`,
      `${plural(d.blocks.ready, 'bloque listo', 'bloques listos')} para análisis.`,
    ]);
    $('resumen-fecha').textContent = `Consultado: ${date(meta.generated_at)}`;
    $('resumen-tarjetas').hidden = false;
    $('resumen-detalle').hidden = false;
    notify('');
  } catch (error) {
    notify(`No se pudo cargar el resumen: ${error.message}`, 'error');
  }
})();
