const { isDeepStrictEqual } = require('node:util');
const { RULES_CONFIG: config } = require('./rules-config');
const { BASIS, collectDefensiveMeasurements } = require('./defensive-positioning');
const rule = config.defensive_review;

function evaluateDefensiveRule(block, blockReason) {
  const data = block?.defensive_review_per_replay;
  const observations = Array.isArray(data?.observations) ? data.observations : [];
  const checked = collectDefensiveMeasurements(Array.from(observations, o => ({
    replay_id: o?.replay_id, values: { defensive_positioning: o },
  })));
  let reason = blockReason;
  if (!reason && !rule.modes.includes(block.context.mode)) reason = 'DEFENSIVE_MODE_UNSUPPORTED';
  if (!reason && !rule.match_types.includes(block.context.match_type)) reason = 'DEFENSIVE_MATCH_TYPE_UNSUPPORTED';
  if (!reason && !['steam', 'epic'].includes(block.context.platform)) reason = 'DEFENSIVE_PLATFORM_UNSUPPORTED';
  if (!reason && !data) reason = block?.source === 'stored_replay_metrics'
    ? 'STORED_POSITIONING_NOT_RECORDED' : 'DEFENSIVE_METRIC_UNAVAILABLE';
  if (!reason && (data.measurement_basis !== BASIS || data.aggregation !== 'per_replay' ||
      !isDeepStrictEqual(observations.map(o => o?.replay_id), block.replay_ids) ||
      !isDeepStrictEqual(data, checked))) reason = 'DEFENSIVE_MEASUREMENT_INCOMPATIBLE';
  if (!reason && checked.coverage !== rule.required_coverage) {
    reason = checked.coverage ? 'INCOMPLETE_DEFENSIVE_COVERAGE' : 'DEFENSIVE_METRIC_UNAVAILABLE';
  }
  const matched = checked.coverage === rule.required_coverage && observations.length === 5
    ? checked.observations.filter(o => o.goals.value >= rule.minimum_goals_per_replay).length : null;
  let status = 'not_evaluable';
  if (!reason) {
    status = matched >= rule.minimum_matches ? 'active' : 'inactive';
    reason = status === 'active' ? 'REPEATED_LAST_DEFENDER_GOALS' : 'INSUFFICIENT_DEFENSIVE_REPETITION';
  }
  const evidence = {
    metric_key: 'goals_against_while_last_defender', unit: 'count', scope: 'player',
    measurement_basis: BASIS, aggregation: 'per_replay', operator: '>=',
    threshold: rule.minimum_goals_per_replay, required_matches: rule.minimum_matches,
    matched_replays: matched, coverage: checked.coverage, sample_size: block?.sample_size ?? null,
    replay_ids: Array.isArray(block?.replay_ids) ? [...block.replay_ids] : [],
    context: block?.context ? { ...block.context } : null,
    source: block?.source ?? null, metrics_version: block?.metrics_version ?? null,
    observations: checked.observations,
    contextual_metrics_affect_activation: false,
  };
  let explanation;
  if (status === 'active') {
    explanation = `En ${matched} de 5 partidas el proveedor registra al menos ${rule.minimum_goals_per_replay} goles recibidos mientras figurabas como último defensor. Se propone revisar la preparación y las decisiones defensivas en esas partidas. Es un criterio provisional: no atribuye culpa, no identifica un 2v1 ni demuestra una mala rotación.`;
  } else if (status === 'inactive') {
    explanation = `Solo ${matched} de 5 partidas cumplen la hipótesis de al menos ${rule.minimum_goals_per_replay} goles como último defensor; se requieren ${rule.minimum_matches}. No se propone esta revisión por ese criterio ni se concluye que la defensa sea correcta.`;
  } else {
    const why = reason === 'DEFENSIVE_MODE_UNSUPPORTED' ? 'Esta hipótesis solo está definida para 2v2.'
      : reason === 'DEFENSIVE_MATCH_TYPE_UNSUPPORTED' ? 'Esta hipótesis solo evalúa partidas ranked.'
      : reason === 'DEFENSIVE_PLATFORM_UNSUPPORTED' ? 'La identidad requiere una plataforma admitida por el proyecto.'
      : 'Se necesitan conteos originales válidos del jugador en las cinco partidas; un faltante no se convierte en cero.';
    explanation = `${why} No se puede evaluar la revisión de cobertura defensiva.`;
  }
  const evaluation = { rule_id: rule.rule_id, rules_version: config.rules_version,
    status, reason, evidence, explanation, calibration_status: rule.calibration_status };
  const priority = status === 'active' ? { priority_key: rule.priority_key, rule_id: rule.rule_id,
    rules_version: config.rules_version, title: 'Revisar cobertura defensiva y decisiones como último hombre',
    score: rule.score, evidence, explanation, calibration_status: rule.calibration_status } : null;
  return { evaluation, priority };
}

module.exports = { evaluateDefensiveRule };
