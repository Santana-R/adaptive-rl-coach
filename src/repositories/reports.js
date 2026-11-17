'use strict';

const { MODES } = require('../domain/goals');
const { parseId } = require('../domain/sessions');
const { listSessions } = require('./sessions');
const { toApiError } = require('./errors');

const PLAN_SELECT = 'plan_version_id:id_plan::text,analisis!fk_planes_id_analisis!inner(' +
  'bloques!fk_analisis_id_bloque!inner(id_usuario,modalidad))';
const BATCH_SIZE = 100;

async function listTrainingSessions(supabase, userId, interval) {
  const sessions = await listSessions(supabase, userId);
  const inPeriod = sessions.filter(session => {
    const time = Date.parse(session.performed_at);
    return time >= interval.startMs && time < interval.endExclusiveMs;
  });
  const ids = [...new Set(inPeriod.map(session => parseId(session.plan_version_id)).filter(Boolean))];
  const modes = new Map();

  for (let start = 0; start < ids.length; start += BATCH_SIZE) {
    const batch = ids.slice(start, start + BATCH_SIZE);
    const { data, error } = await supabase.from('planes').select(PLAN_SELECT)
      .eq('analisis.bloques.id_usuario', userId)
      .in('id_plan', batch);

    if (error) throw toApiError(error, 'No se pudo consultar la modalidad de las sesiones.');

    for (const plan of data ?? []) {
      const block = plan.analisis?.bloques;
      if (block?.id_usuario === userId && MODES.includes(block.modalidad)) {
        modes.set(plan.plan_version_id, block.modalidad);
      }
    }
  }

  return sessions.map(session => ({
    ...session,
    mode: modes.get(parseId(session.plan_version_id)) ?? null
  }));
}

module.exports = { listTrainingSessions };