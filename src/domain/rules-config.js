// Cambiar los criterios publicados requiere una versión nueva; no se calibraron con partidas reales.
const RULES_CONFIG = Object.freeze({
  rules_version: 'mvp.rules.v1',
  metrics_version: 'mvp.metrics.v1',
  max_priorities: 3,
  finalization: Object.freeze({
    rule_id: 'finalizacion-eficiencia',
    priority_key: 'shooting',
    metric_key: 'shooting_pct',
    threshold_pct: 30,
    operator: '<=',
    required_replays: 5,
    required_coverage: 5,
    min_shots_by_mode: Object.freeze({ '1v1': 20, '2v2': 15, '3v3': 10 }),
    score: 1,
    calibration_status: 'agreed_heuristic_not_calibrated',
  }),
});

module.exports = { RULES_CONFIG };
