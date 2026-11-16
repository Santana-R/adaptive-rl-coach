'use strict';

const { calculateBlockMetrics } = require('../domain/metrics');
const { parseTimestamp } = require('../domain/timestamps');
const blocks = require('../repositories/blocks');
const { boostMeasurement } = require('../domain/boost');
const { unavailableDefensiveValues } = require('../domain/defensive-positioning');

// A15 ya filtró por propietario. Las métricas se recalculan desde los cinco
// registros del jugador, no desde totales editables ni respuestas ficticias del proveedor.
function fromStoredBlock(block, ownerId) {
  if (!block) return null;
  const outer = { block_id: block.block_id, owner_id: ownerId, status: block.status };
  if (block.status !== 'ready') return outer;
  const invalid = reason => ({ ...outer, status: 'invalid', reason_codes: [reason] });
  const replays = block.replays;
  if (!Array.isArray(replays) || replays.length !== 5) return invalid('REPLAY_COUNT_INVALID');
  if (!['1v1', '2v2', '3v3'].includes(block.mode) || !['ranked', 'casual', 'private'].includes(block.match_type)) {
    return invalid('REPLAY_CONTEXT_UNSUPPORTED');
  }
  const positions = replays.map(r => r.position);
  if (new Set(positions).size !== 5 || positions.some(p => !Number.isInteger(p) || p < 1 || p > 5)) return invalid('REPLAY_POSITION_INVALID');
  if (replays.some(r => r.status !== 'ok')) return invalid('BLOCK_NOT_READY');
  const player = replays[0].player;
  if (!['steam', 'epic'].includes(player?.platform) || typeof player?.player_id !== 'string' || !player.player_id.trim() ||
    replays.some(r => r.player?.platform !== player.platform || r.player.player_id !== player.player_id)) return invalid('PLAYER_MISMATCH');
  if (replays.some(r => r.file?.mode !== block.mode)) return invalid('MODE_MISMATCH');
  if (replays.some(r => r.file?.match_type !== block.match_type)) return invalid('MATCH_TYPE_MISMATCH');
  const seen = new Set(), keys = [], normalized = [], dates = [], dateExclusions = [];
  for (const r of replays) {
    const hash = r.file?.hash?.trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(hash || '')) return invalid('REPLAY_ID_MISSING');
    const id = typeof r.ballchasing_id === 'string' && r.ballchasing_id.trim() ? r.ballchasing_id.trim() : `sha256:${hash}`;
    const replayKeys = [`id:${id}`, `hash:${hash}`];
    if (replayKeys.some(key => seen.has(key))) return invalid('DUPLICATE_REPLAY');
    replayKeys.forEach(key => { seen.add(key); keys.push(key); });
    const values = Object.fromEntries(['goals', 'shots'].map(key => [key,
      { value: r.metrics?.[key] ?? null, unit: 'count', missing_reason: r.metrics?.[key] == null ? 'not_available' : null }]));
    values.play_duration_s = { value: null, unit: 'seconds', scope: 'match', source_field: 'play_duration', missing_reason: 'duration_basis_unverified' };
    values.boost_zero_s = boostMeasurement(r.metrics?.boost_zero_s, 'seconds', 'time_zero_boost');
    // A15 conserva segundos, pero no el porcentaje ni su denominador de origen.
    values.boost_zero_pct = boostMeasurement(null, 'percent', 'percent_zero_boost', 'stored_boost_percentage_not_recorded');
    // A15 no conserva los campos originales de positioning; no se reconstruyen de goles totales.
    values.defensive_positioning = unavailableDefensiveValues('stored_positioning_not_recorded');
    normalized.push({ replay_id: id, values });
    const time = parseTimestamp(r.file.played_at);
    if (time === null) dateExclusions.push({ replay_id: id, reason: r.file.played_at == null ? 'not_available' : 'invalid_timestamp' });
    else dates.push(time);
  }
  const metrics = calculateBlockMetrics({ source: 'stored_replay_metrics', context: {
    platform: player.platform, player_id: player.player_id, mode: block.mode, match_type: block.match_type,
  }, replays: normalized });
  return { ...outer, metrics_block: { ...metrics, block_id: block.block_id, status: 'ready', replay_keys: keys,
    first_match_at: dates.length === 5 ? new Date(Math.min(...dates)).toISOString() : null,
    last_match_at: dates.length === 5 ? new Date(Math.max(...dates)).toISOString() : null,
    date_exclusions: dateExclusions, data_limitations: ['stored_duration_basis_unverified', 'original_provider_not_recorded'] } };
}

function createStoredAnalysisRepository(supabase) {
  return {
    async getBlockForUser(blockId, userId) {
      return fromStoredBlock(await blocks.getBlock(supabase, userId, blockId), userId);
    },
    async listBlocksForUser(userId) {
      const summaries = await blocks.listBlocks(supabase, userId);
      const history = [];
      // Solo lecturas propias; los resúmenes no contienen las estadísticas necesarias.
      for (const summary of summaries) {
        if (summary.status !== 'ready') history.push({ ...summary, owner_id: userId });
        else {
          const block = await this.getBlockForUser(summary.block_id, userId);
          if (block) history.push(block);
        }
      }
      return history;
    },
  };
}

module.exports = { fromStoredBlock, createStoredAnalysisRepository };
