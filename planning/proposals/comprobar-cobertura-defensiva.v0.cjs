// Comprobador aislado de una propuesta; el motor y npm test no importan este archivo.
// No acredita extracción del proveedor, persistencia, HTTP ni validación deportiva.
function comprobarPropuesta(proposal, fixtures) {
  if (proposal?.runtime_enabled !== false || fixtures?.synthetic !== true) {
    throw new Error('La propuesta debe permanecer desactivada y los casos identificarse como sintéticos.');
  }
  const rule = proposal.signal;
  const n = proposal.context.required_replays;
  if (!Number.isSafeInteger(n) || n !== 5 ||
      !Number.isSafeInteger(rule.min_goals_per_replay) || rule.min_goals_per_replay < 1 ||
      !Number.isSafeInteger(rule.min_matching_replays) || rule.min_matching_replays < 1 ||
      rule.min_matching_replays > n || proposal.context.required_count_coverage !== n) {
    throw new Error('Parámetros de la hipótesis inválidos.');
  }
  const ids = new Set();
  const counts = { review_candidate: 0, no_candidate: 0, not_evaluable: 0 };
  for (const c of fixtures.cases) {
    if (typeof c.id !== 'string' || !c.id.trim() || ids.has(c.id)) {
      throw new Error('Identificador de caso ausente o repetido.');
    }
    ids.add(c.id);
    if (!Object.hasOwn(counts, c.expected)) throw new Error('Decisión esperada desconocida.');
    const input = { ...fixtures.descriptor_format.defaults, ...c.override };
    const values = c.goals_last_defender;
    const replayIds = input.replay_ids;
    const validIds = Array.isArray(replayIds) && replayIds.length === n &&
      Array.from(replayIds).every(id => typeof id === 'string' && id.trim()) &&
      new Set(replayIds.map(id => id.trim())).size === n;
    const validCounts = Array.isArray(values) && values.length === n &&
      Array.from(values).every(value => typeof value === 'number' &&
        Number.isSafeInteger(value) && value >= 0);
    const eligible = validIds && validCounts && input.identity_consistent === true &&
      ['steam', 'epic'].includes(input.platform) &&
      typeof input.player_id === 'string' && input.player_id.trim() &&
      input.mode === proposal.context.mode && input.match_type === proposal.context.match_type &&
      input.scope === rule.scope && input.unit === rule.unit &&
      input.source_field === rule.source_field;
    const matched = eligible ? values.filter(value => value >= rule.min_goals_per_replay).length : null;
    const decision = !eligible ? 'not_evaluable'
      : matched >= rule.min_matching_replays ? 'review_candidate' : 'no_candidate';
    if (decision !== c.expected) {
      throw new Error(c.id + ': esperado ' + c.expected + ', calculado ' + decision);
    }
    counts[decision] += 1;
  }
  return { proposal_version: proposal.proposal_version, verified_cases: ids.size,
    decisions: counts, runtime_enabled: false,
    verification_scope: 'synthetic_specification_consistency_only' };
}

module.exports = comprobarPropuesta;
