const { extractReplayBlockMetrics } = require('./replay-validation');
const { calculateBlockMetrics } = require('../domain/metrics');

// source es metadato del servicio: las pruebas se identifican como synthetic.
function calculateReplayBlockMetrics(replays, profile, { source = 'ballchasing' } = {}) {
  const extracted = extractReplayBlockMetrics(replays, profile);
  if (!extracted.valid) return extracted;

  return {
    ...extracted,
    data: calculateBlockMetrics({ ...extracted.data, source }),
  };
}

module.exports = { calculateReplayBlockMetrics };
