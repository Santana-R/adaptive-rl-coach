'use strict';

$(async function () {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('plan_id')) return;
  const box = $('#sessions-plan-context').prop('hidden', false);
  box.text('Comprobando la versión del plan…');

  try {
    const id = params.get('plan_id');
    const version = params.get('version');
    if (!window.CoachPlanModel.validId(id) || !/^[1-9]\d{0,8}$/.test(version || '')) {
      throw new Error('El enlace no contiene una versión de plan válida.');
    }
    const response = await window.CoachPlanService.version(id, version);
    const plan = response.data;
    const exercise = params.get('plan_exercise_id');
    if ((params.has('plan_version_id') && params.get('plan_version_id') !== plan.plan_version_id) ||
      (params.has('block_id') && params.get('block_id') !== plan.block_id) ||
      (exercise && !plan.exercises.some(item => item.plan_exercise_id === exercise))) {
      throw new Error('El contexto del enlace no corresponde a esa versión del plan.');
    }
    const query = new URLSearchParams({ plan_id: plan.plan_id, version: String(plan.version), block_id: plan.block_id });
    box.empty().append(
      $('<h2>').addClass('h5').text('Versión elegida para la práctica'),
      $('<p>').text('Plan ' + plan.plan_id + ' · Versión ' + plan.version + ' · ID de versión ' + plan.plan_version_id +
        (exercise ? ' · Ejercicio de plan ' + exercise : '') + ' · ' + plan.assigned_minutes + ' min asignados.'),
      $('<p>').text('Este contexto fue consultado en el servidor. El registro e historial de sesiones que aparecen debajo siguen siendo un bosquejo pendiente de A21/A28.'),
      $('<a>').addClass('btn-rl btn-rl-outline').attr('href', 'plan.html?' + query).text('Volver a esta versión del plan')
    );
  } catch (error) {
    box.empty().append(
      $('<p>').text(error.message),
      $('<a>').attr('href', 'plan.html').addClass('text-accent').text('Ir a Plan')
    );
  }
});
