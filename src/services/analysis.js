const { buildComparisonBlock } = require('./block-comparison');
const { compareBlocks, resolveBaseline } = require('../domain/comparison');
const { evaluateRules } = require('../domain/rules');

function normalized(input) {
  if (input?.status && input.status !== 'ready') {
    return { block_id: input.block_id, status: input.status, reason_codes: input.reason_codes || ['BLOCK_NOT_READY'] };
  }
  if (input?.metrics_block) return input.metrics_block;
  return buildComparisonBlock(input);
}

// Recibe datos del repositorio/adaptador, no un diagnóstico precalculado del navegador.
function analyzeBlock({ current, baseline = null, history = [] }) {
  if (!Array.isArray(history)) throw new TypeError('El historial debe ser una lista de bloques.');
  const block = normalized(current);
  if (block.status !== 'ready') {
    return { valid: false, data: null, reason_codes: block.reason_codes || ['BLOCK_INVALID'], replay_errors: block.replay_errors || [] };
  }
  const comparison = baseline !== null
    ? compareBlocks(block, normalized(baseline))
    : resolveBaseline(block, history.filter(item => item?.block_id !== block.block_id).map(normalized));
  const rules = evaluateRules(block);
  return {
    valid: true,
    data: {
      block_id: block.block_id, source: block.source, metrics_version: block.metrics_version,
      block: { status: block.status, context: { ...block.context }, first_match_at: block.first_match_at,
        last_match_at: block.last_match_at, replay_ids: [...block.replay_ids] },
      metrics: block, comparison, ...rules,
      limitations: [...new Set([...(rules.limitations || []), ...(block.data_limitations || [])])],
    },
  };
}

module.exports = { analyzeBlock };
