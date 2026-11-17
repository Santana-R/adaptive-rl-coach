'use strict';

// A24 · Traduce el análisis del motor (services/analysis → data) a las filas de
// analisis/prioridades que guarda a24_guardar_plan. Función pura: no consulta la base.

// La métrica de reglas es inmutable en SQL. V4 usa una regla SQL distinta para
// la tasa; los IDs lógicos del motor y de los snapshots públicos se conservan.
function toStoredRuleId(ruleId, rulesVersion) {
  return rulesVersion === 'mvp.rules.v4' && ruleId === 'cobertura-defensiva-revision'
    ? 'cobertura-defensiva-revision-tasa' : ruleId;
}

function currentValue(evidence) {
  // Finalización: porcentaje medido. Boost: partidas que alcanzan el umbral (de 5).
  if (Number.isFinite(evidence?.value)) return evidence.value;
  if (Number.isFinite(evidence?.matched_replays)) return evidence.matched_replays;
  return null;
}

function toStoredAnalysis(analysis) {
  const priorities = (analysis?.priorities || []).map(priority => {
    const value = currentValue(priority.evidence);
    if (value === null) throw new TypeError(`La prioridad ${priority.rule_id} no tiene un valor medido.`);
    return {
      rule_id: toStoredRuleId(priority.rule_id, analysis.rules_version),
      orden: priority.order,
      valor_actual: value,
      // El plan se genera sin bloque base; la comparación vive en Análisis (A10/A19).
      valor_base: null,
      // Snapshot completo: mínimo por modalidad, contexto, replays, fuente y versión de métricas.
      evidencia: JSON.stringify({
        rule_id: priority.rule_id, priority_key: priority.priority_key, rules_version: priority.rules_version, title: priority.title,
        score: priority.score, explanation: priority.explanation,
        calibration_status: priority.calibration_status, evidence: priority.evidence,
      }),
    };
  });
  const explanations = (analysis?.evaluations || []).map(e => e.explanation).filter(Boolean);
  return {
    rules_version: analysis?.rules_version,
    explicacion: explanations.join(' ') || 'Análisis sin prioridades respaldadas por reglas.',
    prioridades: priorities,
  };
}

module.exports = { toStoredAnalysis, currentValue, toStoredRuleId };
