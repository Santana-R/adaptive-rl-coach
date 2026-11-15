const { calculateReplayBlockMetrics } = require('./block-metrics');
const { evaluateRules } = require('../domain/rules');

// Conserva los rechazos de A14; no se aplican reglas a un bloque inválido.
function evaluateReplayBlockRules(replays, profile, { source = 'ballchasing' } = {}) {
  const measured = calculateReplayBlockMetrics(replays, profile, { source });
  if (!measured.valid) return measured;
  return { ...measured, data: { metrics: measured.data, ...evaluateRules(measured.data) } };
}

module.exports = { evaluateReplayBlockRules };
