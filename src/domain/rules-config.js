// Cambiar los criterios publicados requiere una versión nueva; no se calibraron con partidas reales.
const RULES_CONFIG = Object.freeze({
  rules_version: 'mvp.rules.v3',
  metrics_version: 'mvp.metrics.v1',
  max_priorities: 3,
  boost: Object.freeze({
    rule_id: 'boost-disponibilidad', priority_key: 'boost',
    metric_key: 'boost_zero_pct', required_replays: 5, required_coverage: 5,
    minimum_matches: 3, threshold_pct: 15, high_threshold_pct: 20,
    score: 1, high_score: 2,
    modes: Object.freeze(['2v2', '3v3']), match_types: Object.freeze(['ranked']),
    calibration_status: 'agreed_heuristic_not_calibrated',
  }),
  defensive_review: Object.freeze({
    rule_id: 'cobertura-defensiva-revision', priority_key: 'defensive_review',
    required_replays: 5, required_coverage: 5, minimum_goals_per_replay: 2, minimum_matches: 3,
    score: 1, modes: Object.freeze(['2v2']), match_types: Object.freeze(['ranked']),
    calibration_status: 'provisional_heuristic_pending_validation',
  }),
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
