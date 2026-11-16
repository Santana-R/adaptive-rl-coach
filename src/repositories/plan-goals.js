'use strict';

const { ApiError } = require('../middleware/auth');
const { requireClient, toApiError } = require('./errors');
const one = value => Array.isArray(value) ? value[0] : value;

// Lectura de las versiones activadas propias. El CRUD de metas sigue en A16.
async function getPlanGoals(supabase, userId, ids) {
  if (!ids.length) return [];
  requireClient(supabase);
  const { data, error } = await supabase.from('objetivos')
    .select('id_objetivo, modalidad, estado, archivado_en, objetivo_versiones(id_objetivo_version, version, nombre, comparador, valor_meta, activada_en, metricas(codigo, unidad))')
    .eq('id_usuario', userId).in('id_objetivo', ids);
  if (error) throw toApiError(error, 'No se pudieron consultar las metas.');
  if (ids.some(id => !(data || []).some(row => String(row.id_objetivo) === id))) {
    throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'El recurso no existe.');
  }
  return data.map(row => {
    const version = (row.objetivo_versiones || []).filter(v => v.activada_en != null).sort((a, b) => b.version - a.version)[0];
    const metric = one(version?.metricas);
    if (!version || metric?.codigo !== 'shooting_pct' || metric.unidad !== 'percent' || !['>', '>='].includes(version.comparador)) {
      throw new ApiError(422, 'GOAL_UNSUPPORTED', 'Alguna meta seleccionada todavía no es compatible con esta rutina.');
    }
    return { goal_id: String(row.id_objetivo), goal_version_id: String(version.id_objetivo_version),
      version: version.version, metric_key: metric.codigo, unit: metric.unidad, comparator: version.comparador,
      target_value: Number(version.valor_meta), mode: row.modalidad,
      status: row.estado === 'activo' && row.archivado_en == null ? 'active' : 'archived' };
  });
}

module.exports = { getPlanGoals };
