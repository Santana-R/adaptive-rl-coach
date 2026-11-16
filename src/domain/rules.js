const { RULES_CONFIG: config } = require('./rules-config');
const { evaluateBoostRule } = require('./boost-rule');
const { evaluateDefensiveRule } = require('./defensive-rule');
const rule = config.finalization;
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

// Recibe prioridades ya respaldadas por reglas. No inventa señales para llenar tres lugares.
function rankPriorities(priorities) {
  if (!Array.isArray(priorities)) throw new TypeError('Las prioridades deben ser una lista.');
  const ids = new Set();
  const copy = Array.from(priorities);
  for (const priority of copy) {
    if (!nonempty(priority?.rule_id) || !Number.isFinite(priority.score) || priority.score < 0) {
      throw new TypeError('Cada prioridad requiere una regla y un score finito no negativo.');
    }
    if (ids.has(priority.rule_id)) throw new TypeError('Una regla no puede ocupar dos prioridades.');
    ids.add(priority.rule_id);
  }
  return copy.sort((a, b) => b.score - a.score ||
    (a.rule_id < b.rule_id ? -1 : a.rule_id > b.rule_id ? 1 : 0))
    .slice(0, config.max_priorities)
    .map((priority, index) => ({ ...priority, order: index + 1 }));
}

function blockProblem(block) {
  if (!block || typeof block !== 'object' || Array.isArray(block)) return 'BLOCK_INVALID';
  if (block.status !== undefined && block.status !== 'ready') return 'BLOCK_NOT_READY';
  if (block.metrics_version !== config.metrics_version) return 'METRICS_VERSION_MISMATCH';
  if (!nonempty(block.source)) return 'SOURCE_MISSING';
  if (!['platform', 'player_id', 'mode', 'match_type'].every(key => nonempty(block.context?.[key])) ||
      !['ranked', 'casual', 'private'].includes(block.context.match_type)) return 'CONTEXT_INCOMPLETE';
  if (!Object.hasOwn(rule.min_shots_by_mode, block.context.mode)) return 'MODE_UNSUPPORTED';
  const ids = Array.isArray(block.replay_ids) ? Array.from(block.replay_ids) : [];
  if (block.sample_size !== rule.required_replays || ids.length !== rule.required_replays ||
      !ids.every(nonempty)) return 'REPLAY_COUNT_INVALID';
  if (new Set(ids.map(id => id.trim())).size !== rule.required_replays) return 'DUPLICATE_REPLAY';
  return null;
}

function metricProblem(values) {
  const goals = values?.goals, shots = values?.shots, pct = values?.shooting_pct;
  if ([goals, shots, pct].some(metric => metric && metric.coverage !== rule.required_coverage)) {
    return 'INCOMPLETE_METRIC_COVERAGE';
  }
  if (goals?.value == null || shots?.value == null) return 'METRIC_UNAVAILABLE';
  if (goals.unit !== 'count' || shots.unit !== 'count' || (pct && pct.unit !== 'percent')) {
    return 'UNIT_MISMATCH';
  }
  if (![goals.value, shots.value].every(value => Number.isSafeInteger(value) && value >= 0)) {
    return 'INVALID_METRIC_VALUE';
  }
  if (goals.missing_reason != null || shots.missing_reason != null) return 'METRIC_UNAVAILABLE';
  if (shots.value === 0) return 'zero_denominator';
  if (pct?.value == null || pct.missing_reason != null) return 'METRIC_UNAVAILABLE';
  if (!Number.isFinite(pct.value) || pct.value < 0 || pct.value > 100) return 'INVALID_METRIC_VALUE';
  // A09 conserva precisión completa. Un resumen inconsistente no permite una conclusión.
  if (pct.value !== (goals.value / shots.value) * 100) return 'INCONSISTENT_METRICS';
  const numerator = pct.numerator, denominator = pct.denominator;
  if (numerator?.metric_key !== 'goals' || numerator.value !== goals.value || numerator.unit !== 'count' ||
      denominator?.metric_key !== 'shots' || denominator.value !== shots.value || denominator.unit !== 'count') {
    return 'INCONSISTENT_METRICS';
  }
  return null;
}

function evidenceFor(block) {
  const values = block?.values;
  const value = metric => Number.isFinite(metric?.value) ? metric.value : null;
  const coverage = metric => Number.isInteger(metric?.coverage) && metric.coverage >= 0 &&
    metric.coverage <= rule.required_replays ? metric.coverage : null;
  return {
    metric_key: rule.metric_key,
    value: value(values?.shooting_pct),
    unit: 'percent',
    threshold: rule.threshold_pct,
    direction: 'below_or_equal',
    operator: rule.operator,
    sample_size: block?.sample_size ?? null,
    coverage: coverage(values?.shooting_pct),
    goals: { value: value(values?.goals), unit: 'count', coverage: coverage(values?.goals) },
    shots: { value: value(values?.shots), unit: 'count', coverage: coverage(values?.shots) },
    min_shots: Object.hasOwn(rule.min_shots_by_mode, block?.context?.mode)
      ? rule.min_shots_by_mode[block.context.mode] : null,
    context: block?.context ? { ...block.context } : null,
    source: block?.source ?? null,
    metrics_version: block?.metrics_version ?? null,
    replay_ids: Array.isArray(block?.replay_ids) ? [...block.replay_ids] : [],
  };
}

function explanationFor(status, reason, evidence) {
  if (reason === 'INSUFFICIENT_SHOTS') {
    return `El bloque tiene ${evidence.shots.value} tiros; ${evidence.context.mode} requiere al menos ${evidence.min_shots} para evaluar esta regla.`;
  }
  if (reason === 'zero_denominator') return 'No hay tiros registrados: la eficiencia no se puede calcular.';
  if (status === 'not_evaluable') {
    const messages = {
      BLOCK_INVALID: 'El bloque no tiene un formato válido.',
      BLOCK_NOT_READY: 'El bloque todavía no está listo.',
      METRICS_VERSION_MISMATCH: 'La versión de las métricas no es compatible con esta regla.',
      SOURCE_MISSING: 'Falta identificar la procedencia de las métricas.',
      CONTEXT_INCOMPLETE: 'Falta un contexto válido del jugador o del tipo de partida.',
      MODE_UNSUPPORTED: 'Esta regla solo admite 1v1, 2v2 y 3v3.',
      REPLAY_COUNT_INVALID: 'Se requieren exactamente cinco partidas identificadas.',
      DUPLICATE_REPLAY: 'Hay identificadores de partida repetidos.',
      INCOMPLETE_METRIC_COVERAGE: 'Faltan datos de goles o tiros en alguna de las cinco partidas.',
      METRIC_UNAVAILABLE: 'No están disponibles todas las métricas necesarias.',
      UNIT_MISMATCH: 'Las unidades de las métricas no corresponden a conteos y porcentaje.',
      INVALID_METRIC_VALUE: 'Hay una medición fuera de su rango válido.',
      INCONSISTENT_METRICS: 'La eficiencia o sus denominadores no coinciden con los goles y tiros.',
    };
    return `${messages[reason]} No se puede concluir una prioridad de finalización con estos datos.`;
  }
  const measured = `${evidence.goals.value} goles en ${evidence.shots.value} tiros (${evidence.value} %)`;
  if (status === 'inactive') {
    return `Registraste ${measured}; superas el umbral inicial de ${evidence.threshold} %. Esta regla no activa una prioridad de finalización.`;
  }
  return `Registraste ${measured}. Cumples el mínimo de ${evidence.min_shots} tiros para ${evidence.context.mode} y el criterio inicial de eficiencia ≤ ${evidence.threshold} %; se sugiere practicar colocación y finalización.`;
}

// Entrada: data de A09, o bloque normalizado de A10. La regla no necesita un anterior ni fechas.
function evaluateRules(block) {
  let reason = blockProblem(block) || metricProblem(block?.values);
  const evidence = evidenceFor(block);
  let status = 'not_evaluable';
  if (reason === null) {
    const shots = block.values.shots.value;
    const shootingPct = block.values.shooting_pct.value;
    const minimumShots = rule.min_shots_by_mode[block.context.mode];
    if (shots < minimumShots) reason = 'INSUFFICIENT_SHOTS';
    else {
      // El límite es inclusivo y se evalúa sin redondear el porcentaje.
      const active = shots >= minimumShots && shootingPct <= rule.threshold_pct;
      status = active ? 'active' : 'inactive';
      reason = active ? 'AT_OR_BELOW_THRESHOLD' : 'ABOVE_THRESHOLD';
    }
  }
  const evaluation = {
    rule_id: rule.rule_id, rules_version: config.rules_version,
    status, reason, evidence, explanation: explanationFor(status, reason, evidence),
    calibration_status: rule.calibration_status,
  };
  const priorities = status === 'active' ? [{
    priority_key: rule.priority_key, rule_id: rule.rule_id, rules_version: config.rules_version,
    title: 'Practicar colocación y finalización', score: rule.score,
    evidence, explanation: evaluation.explanation, calibration_status: rule.calibration_status,
  }] : [];
  const boost = evaluateBoostRule(block, blockProblem(block));
  if (boost.priority) priorities.push(boost.priority);
  const defense = evaluateDefensiveRule(block, blockProblem(block));
  if (defense.priority) priorities.push(defense.priority);
  return {
    rules_version: config.rules_version,
    priorities: rankPriorities(priorities),
    evaluations: [evaluation, boost.evaluation, defense.evaluation],
    limitations: ['heuristics_pending_calibration_A26',
      ...(defense.priority ? ['defensive_review_heuristic_pending_validation'] : []),
      ...(block?.source === 'synthetic' ? ['synthetic_fixture'] : [])],
  };
}

module.exports = { evaluateRules, rankPriorities };
