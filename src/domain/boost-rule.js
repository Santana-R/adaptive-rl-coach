const { RULES_CONFIG: config } = require('./rules-config');
const { BASIS, collectBoostMeasurements } = require('./boost');
const { isDeepStrictEqual } = require('node:util');
const rule = config.boost;

function evaluateBoostRule(block, blockReason) {
  const data = block?.boost_zero_per_replay;
  const observations = Array.isArray(data?.observations) ? data.observations : [];
  const checked = collectBoostMeasurements(observations.map(o => ({ replay_id: o?.replay_id,
    values: { boost_zero_s: o?.seconds, boost_zero_pct: o?.percent } }))).per_replay;
  let reason = blockReason;
  if (!reason && !rule.modes.includes(block.context.mode)) reason = 'BOOST_MODE_UNSUPPORTED';
  if (!reason && !rule.match_types.includes(block.context.match_type)) reason = 'BOOST_MATCH_TYPE_UNSUPPORTED';
  if (!reason && (!data || observations.length === 0)) reason = 'BOOST_METRIC_UNAVAILABLE';
  if (!reason && (data.measurement_basis !== BASIS || data.aggregation !== 'per_replay' ||
      !isDeepStrictEqual(observations.map(o => o?.replay_id), block.replay_ids) ||
      data.coverage !== checked.coverage || data.missing_reason !== checked.missing_reason)) {
    reason = 'BOOST_MEASUREMENT_INCOMPATIBLE';
  }
  if (!reason && checked.coverage !== rule.required_coverage) {
    reason = checked.coverage ? 'INCOMPLETE_BOOST_COVERAGE' : 'BOOST_METRIC_UNAVAILABLE';
  }
  const count = threshold => checked.observations.filter(o => o.percent.value !== null && o.percent.value >= threshold).length;
  const count15 = checked.coverage === 5 ? count(rule.threshold_pct) : null;
  const count20 = checked.coverage === 5 ? count(rule.high_threshold_pct) : null;
  let status = 'not_evaluable', severity = null;
  if (!reason) {
    status = count15 >= rule.minimum_matches ? 'active' : 'inactive';
    severity = status === 'active' ? count20 >= rule.minimum_matches ? 'high' : 'normal' : null;
    reason = status === 'active' ? severity === 'high' ? 'REPEATED_HIGH_ZERO_BOOST' : 'REPEATED_ZERO_BOOST' : 'INSUFFICIENT_REPEATED_EXPOSURE';
  }
  const evidence = {
    metric_key: rule.metric_key, unit: 'percent', measurement_basis: BASIS,
    aggregation: 'per_replay', threshold: rule.threshold_pct, high_threshold: rule.high_threshold_pct,
    operator: '>=', required_matches: rule.minimum_matches, matched_replays: count15,
    high_matched_replays: count20, sample_size: block?.sample_size ?? null, coverage: checked.coverage,
    severity, replay_ids: Array.isArray(block?.replay_ids) ? [...block.replay_ids] : [],
    context: block?.context ? { ...block.context } : null, source: block?.source ?? null,
    metrics_version: block?.metrics_version ?? null,
    observations: checked.observations.map(o => ({ replay_id: o.replay_id,
      percent_zero_boost: o.percent.value, time_zero_boost_s: o.seconds.value,
      percent_missing_reason: o.percent.missing_reason, seconds_missing_reason: o.seconds.missing_reason })),
  };
  let explanation;
  if (status === 'active') {
    const threshold = severity === 'high' ? rule.high_threshold_pct : rule.threshold_pct;
    const matches = severity === 'high' ? count20 : count15;
    explanation = `En ${matches} de 5 partidas pasaste al menos ${threshold} % del tiempo medido con exactamente cero boost. Se sugiere practicar recarga y conservación del movimiento. La estadística no determina la causa ni demuestra mal manejo de boost.`;
  } else if (status === 'inactive') {
    explanation = `Solo ${count15} de 5 partidas alcanzan el umbral inicial de ${rule.threshold_pct} % con cero boost; se requieren al menos ${rule.minimum_matches}. No se activa esta prioridad ni se concluye que el manejo sea correcto.`;
  } else {
    const why = reason === 'BOOST_MODE_UNSUPPORTED' ? 'Esta regla todavía no está definida para 1v1.'
      : reason === 'BOOST_MATCH_TYPE_UNSUPPORTED' ? 'Esta versión solo evalúa partidas ranked.'
      : 'Se requieren porcentajes válidos del proveedor en las cinco partidas; no se deducen de segundos ni de duraciones sin procedencia comprobada.';
    explanation = `${why} No se puede evaluar la disponibilidad de boost con estas entradas.`;
  }
  const evaluation = { rule_id: rule.rule_id, rules_version: config.rules_version, status, reason,
    evidence, explanation, calibration_status: rule.calibration_status };
  const priority = status === 'active' ? { priority_key: rule.priority_key, rule_id: rule.rule_id,
    rules_version: config.rules_version, title: 'Mejorar disponibilidad de boost',
    score: severity === 'high' ? rule.high_score : rule.score, evidence, explanation,
    calibration_status: rule.calibration_status } : null;
  return { evaluation, priority };
}

module.exports = { evaluateBoostRule };
