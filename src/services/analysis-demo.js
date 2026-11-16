const fixture = require('../../planning/fixtures/analysis-demo.json');

function rawBlock(key) {
  const block = fixture.blocks[key];
  const profile = { ...fixture.profile, mode: block.mode };
  return {
    block_id: block.block_id, status: 'ready', source: 'synthetic', profile,
    replays: block.goals.map((goals, index) => ({
      id: `${block.block_id}-${index + 1}`, status: 'ok', team_size: Number(block.mode[0]),
      playlist_id: block.mode === '2v2' ? 'ranked-doubles' : 'ranked-standard',
      date: new Date(Date.parse(block.date) + index * 60000).toISOString(), date_has_timezone: true,
      play_duration: 300 + index,
      blue: { players: [{ id: { platform: profile.platform, id: profile.player_id },
        stats: { core: { goals, shots: block.shots[index] } } }] },
    })),
  };
}

function demoInput(caseName) {
  if (!Object.hasOwn(fixture.cases, caseName)) return null;
  const selected = fixture.cases[caseName];
  return { current: rawBlock(selected.current), baseline: selected.baseline === null ? null : rawBlock(selected.baseline) };
}

module.exports = { demoInput };
