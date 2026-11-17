'use strict';

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CoachPlanModel = factory();
})(typeof window === 'undefined' ? globalThis : window, function () {
  const ranks = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'champion', 'grand_champion', 'supersonic_legend'];
  const variants = ['easy-base', 'normal-fixed', 'normal-distance', 'normal-random', 'survival-optional'];
  const validId = value => typeof value === 'string' && /^[1-9]\d{0,17}$/.test(value);

  function validate(input) {
    const errors = {};
    if (!validId(input.block_id)) errors.block_id = 'Selecciona un bloque propio.';
    if (!Number.isInteger(input.availability_minutes) || input.availability_minutes < 0 || input.availability_minutes > 32767) {
      errors.availability_minutes = 'Escribe minutos enteros entre 0 y 32767.';
    }
    const ids = input.goal_ids || [];
    if (!Array.isArray(ids) || ids.length > 20 || ids.some(id => !validId(id)) || new Set(ids).size !== ids.length) {
      errors.goal_ids = 'Selecciona metas válidas, sin repetir.';
    }
    if (typeof input.workshop_access !== 'boolean') errors.workshop_access = 'Indica si tienes acceso al mapa.';
    if (input.rank && !ranks.includes(input.rank)) errors.rank = 'Selecciona un rango válido o déjalo sin declarar.';
    if (input.coco_variant_key && !variants.includes(input.coco_variant_key)) errors.coco_variant_key = 'Selecciona una variante válida.';
    const data = {
      availability_minutes: input.availability_minutes,
      goal_ids: ids,
      workshop_access: input.workshop_access,
      rank: input.rank || null
    };
    if (input.coco_variant_key) data.coco_variant_key = input.coco_variant_key;
    return { valid: Object.keys(errors).length === 0, errors, data };
  }

  function canSave(plan) {
    return Number.isInteger(plan?.availability_minutes) && plan.availability_minutes > 0 &&
      Array.isArray(plan.exercises) && plan.exercises.every(item => validId(item.exercise_version_id));
  }

  function safeResource(value) {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  }

  function sessionsUrl(plan, exerciseId) {
    if (!validId(plan?.plan_id) || !validId(plan?.plan_version_id) || !Number.isInteger(plan.version) || plan.version < 1 || !validId(plan.block_id)) return null;
    const params = new URLSearchParams({
      plan_id: plan.plan_id,
      plan_version_id: plan.plan_version_id,
      version: String(plan.version),
      block_id: plan.block_id
    });
    if (exerciseId && validId(exerciseId)) params.set('plan_exercise_id', exerciseId);
    return 'sesiones.html?' + params.toString();
  }

  return { ranks, variants, validId, validate, canSave, safeResource, sessionsUrl };
});
