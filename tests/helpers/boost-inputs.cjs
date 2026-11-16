const { demoInput } = require('../../src/services/analysis-demo');
const { findReplayPlayer } = require('../../src/services/replay-validation');
const { analyzeBlock } = require('../../src/services/analysis');
const { makePlanInput } = require('./plan-inputs.cjs');

function boostBlock({ percents = [20, 20, 20, 10, 10], seconds = null, mode = '2v2', shooting = true, platform = 'steam' } = {}) {
  const block = demoInput('boost-high').current;
  block.profile.mode = mode;
  for (const [i, replay] of block.replays.entries()) {
    const player = findReplayPlayer(replay, block.profile);
    player.id.platform = platform;
    player.stats.core.goals = shooting ? 1 : 2;
    player.stats.boost = { percent_zero_boost: percents[i], time_zero_boost: seconds ? seconds[i] : percents[i] == null ? null : percents[i] * 3 };
    replay.team_size = Number(mode[0]);
    replay.playlist_id = `ranked-${{ '1v1': 'duels', '2v2': 'doubles', '3v3': 'standard' }[mode]}`;
  }
  block.profile.platform = platform;
  return block;
}
function boostPlan(options = {}) {
  const input = makePlanInput({ platform: options.platform || 'steam', minutes: options.minutes ?? 20, workshop: options.workshop ?? true });
  const block = boostBlock(options);
  input.analysis = analyzeBlock({ current: block }).data;
  input.profile = { ...input.profile, ...block.profile, rank_mode: block.profile.mode };
  return input;
}
module.exports = { boostBlock, boostPlan };
