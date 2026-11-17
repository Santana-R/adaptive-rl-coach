const { boostBlock, boostPlan } = require('./boost-inputs.cjs');
const { analyzeBlock } = require('../../src/services/analysis');
const { findReplayPlayer } = require('../../src/services/replay-validation');

function defensiveBlock({ counts = [2,2,2,0,0], boost = false, shooting = false,
    mode = '2v2', platform = 'steam', match_type = 'ranked', contextual_data = {} } = {}) {
  const block = boostBlock({ percents: boost ? [20,20,20,10,10] : [0,0,0,0,0], shooting, mode, platform });
  const seeds = block.replays;
  block.block_id = 'defensive-current';
  block.replays = counts.map((count,i) => {
    const replay = structuredClone(seeds[i % seeds.length]);
    replay.id = 'defensive-replay-' + (i+1);
    if (match_type !== 'ranked') replay.playlist_id = match_type === 'private'
      ? 'private' : 'unranked-' + ({ '1v1':'duels', '2v2':'doubles', '3v3':'standard' }[mode]);
    const player = findReplayPlayer(replay, block.profile);
    player.stats.positioning = {
      goals_against_while_last_defender: count,
      time_most_back: 120, percent_most_back: 40,
      percent_infront_ball: 25, avg_distance_to_mates: 3200,
    };
    for (const [key,values] of Object.entries(contextual_data)) {
      if (key === 'play_duration_s') replay.play_duration = Array.isArray(values) ? values[i] : values;
      else player.stats.positioning[key] = Array.isArray(values) ? values[i] : values;
    }
    return replay;
  });
  return block;
}
function defensivePlan(options = {}) {
  const input = boostPlan(options), block = defensiveBlock(options);
  input.analysis = analyzeBlock({ current:block }).data;
  input.profile = { ...input.profile, ...block.profile, rank_mode:block.profile.mode };
  return input;
}
module.exports = { defensiveBlock, defensivePlan };
