'use strict';

// A32 · Panel admin: conteos actuales de GET /api/v1/admin/summary.
(async function () {
  const { request, guard, notify, escape, date } = window.CoachAdmin;
  const $ = id => document.getElementById(id);
  const list = items => items.map(text => `<li>${escape(text)}</li>`).join('');
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  if (!await guard()) return;
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
    $('r-progreso').textContent = d.progress.message;
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
