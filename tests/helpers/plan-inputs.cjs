const content = require('../../planning/catalogo-ejercicios.v1.json');
const replayFixture = require('../fixtures/replay-validation/bloque-a14.json');
const { evaluateReplayBlockRules } = require('../../src/services/block-rules');

// Catálogo de PRUEBA: las banderas de revisión simulan la consulta futura de David.
// No modifica las fichas ni acredita validación de recursos/carga/consulta real.
function makePlanInput({ minutes = 20, mode = '2v2', platform = 'steam', rank = 'diamond',
  workshop = true, goalsTotal = 3, shotsTotal = { '1v1': 20, '2v2': 15, '3v3': 10 }[mode] } = {}) {
  const input = structuredClone(replayFixture.input);
  input.profile = { ...input.profile, platform, mode };
  for (const [index, replay] of input.replays.entries()) {
    replay.team_size = Number(mode[0]);
    replay.playlist_id = `ranked-${{ '1v1': 'duels', '2v2': 'doubles', '3v3': 'standard' }[mode]}`;
    const player = [...(replay.blue?.players || []), ...(replay.orange?.players || [])]
      .find(p => p.id?.platform === replayFixture.input.profile.platform && p.id?.id === input.profile.player_id);
    player.id = { platform, id: input.profile.player_id };
    player.stats.core.goals = index === 0 ? goalsTotal : 0;
    player.stats.core.shots = index === 0 ? shotsTotal : 0;
  }
  const rules = evaluateReplayBlockRules(input.replays, input.profile, { source: 'synthetic' });
  if (!rules.valid) throw new Error('El fixture debe producir un bloque válido.');
  const catalog = structuredClone(content);
  catalog.source = 'synthetic';
  catalog.document_type = 'synthetic_normalized_catalog_for_tests';
  catalog.review.technical_status = 'synthetic_fixture_only';
  for (const exercise of catalog.exercises) {
    exercise.active = true;
    exercise.technical_review_status = 'verified';
    exercise.exercise_id = `test-${exercise.exercise_key}`;
    exercise.exercise_version_id = `test-${exercise.exercise_key}-v1`;
  }
  return {
    analysis: { block_id: 'test-block-shooting-plan', metrics_version: rules.data.metrics.metrics_version, ...rules.data },
    profile: { ...input.profile, rank, rank_mode: mode, rank_source: 'self_reported', workshop_access: workshop },
    catalog,
    availability_minutes: minutes,
    goals: [], version: 1,
  };
}

module.exports = { makePlanInput };
