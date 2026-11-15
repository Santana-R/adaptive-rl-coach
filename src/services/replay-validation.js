function findReplayPlayer(replay, profile) {
  const platform = profile?.platform;
  const playerId = profile?.player_id;

  if (typeof platform !== 'string' || !platform ||
      typeof playerId !== 'string' || !playerId) {
    return null;
  }

  for (const team of ['blue', 'orange']) {
    const players = replay?.[team]?.players;
    if (!Array.isArray(players)) continue;

    const player = players.find(entry =>
      entry?.id?.platform === platform && entry.id.id === playerId
    );

    if (player) return player;
  }

  return null;
}

const TEAM_MODES = new Map([[1, '1v1'], [2, '2v2'], [3, '3v3']]);

const PLAYLISTS = new Map([
  ['ranked-duels', { mode: '1v1', matchType: 'ranked' }],
  ['ranked-doubles', { mode: '2v2', matchType: 'ranked' }],
  ['ranked-standard', { mode: '3v3', matchType: 'ranked' }],
  ['unranked-duels', { mode: '1v1', matchType: 'casual' }],
  ['unranked-doubles', { mode: '2v2', matchType: 'casual' }],
  ['unranked-standard', { mode: '3v3', matchType: 'casual' }]
]);

function readReplayContext(replay) {
  const mode = TEAM_MODES.get(replay.team_size);
  if (!mode) return null;

  if (replay.playlist_id === 'private') return { mode, matchType: 'private' };

  const playlist = PLAYLISTS.get(replay.playlist_id);
  return playlist?.mode === mode ? playlist : null;
}

function validateReplayBlock(replays, profile) {
  if (!Array.isArray(replays) || replays.length !== 5) {
    return { valid: false, reason_codes: ['REPLAY_COUNT_INVALID'], replays: [] };
  }

  const entries = Array.from(replays);
  const contexts = entries.map(replay =>
    replay?.status === 'ok' ? readReplayContext(replay) : null
  );

  const matchType = contexts.find(context => context?.mode === profile?.mode)?.matchType;
  const seen = new Set();

  const results = entries.map((replay, index) => {
    const reasonCodes = [];
    const replayId = typeof replay?.id === 'string' ? replay.id.trim() || null : null;

    if (!replayId) reasonCodes.push('REPLAY_ID_MISSING');

    const keys = ['id', 'rocket_league_id', 'match_guid'].flatMap(field => {
      const value = replay?.[field];
      return typeof value === 'string' && value.trim() ? [field + ':' + value.trim()] : [];
    });

    if (keys.some(key => seen.has(key))) reasonCodes.push('DUPLICATE_REPLAY');
    for (const key of keys) seen.add(key);

    const context = contexts[index];

    if (replay?.status !== 'ok') {
      reasonCodes.push('BLOCK_NOT_READY');
    } else {
      if (!context) {
        reasonCodes.push('REPLAY_CONTEXT_UNSUPPORTED');
      } else {
        if (context.mode !== profile?.mode) reasonCodes.push('MODE_MISMATCH');
        if (matchType && context.matchType !== matchType) {
          reasonCodes.push('MATCH_TYPE_MISMATCH');
        }
      }

      if (!findReplayPlayer(replay, profile)) reasonCodes.push('PLAYER_MISMATCH');
    }

    return { position: index + 1, replay_id: replayId, reason_codes: reasonCodes };
  });

  const reasonCodes = [...new Set(results.flatMap(replay => replay.reason_codes))];
  return { valid: reasonCodes.length === 0, reason_codes: reasonCodes, replays: results };
}

function extractReplayBlockMetrics(replays, profile) {
  const validation = validateReplayBlock(replays, profile);
  if (!validation.valid) return { ...validation, data: null };

  const context = readReplayContext(replays[0]);
  const replayMetrics = replays.map((replay, index) => {
    const player = findReplayPlayer(replay, profile);
    const core = player.stats?.core;

    const values = Object.fromEntries(
      ['goals', 'shots', 'assists', 'saves'].map(metric => {
        const count = core?.[metric];
        const available = Number.isSafeInteger(count) && count >= 0;

        return [metric, {
          value: available ? count : null,
          unit: 'count',
          missing_reason: available ? null : 'not_available'
        }];
      })
    );

    // Es tiempo de la partida, no tiempo de participación del jugador.
    const duration = replay.play_duration;
    const durationAvailable = Number.isFinite(duration) && duration >= 0 &&
      duration <= Number.MAX_SAFE_INTEGER;
    values.play_duration_s = {
      value: durationAvailable ? duration : null,
      unit: 'seconds',
      scope: 'match',
      source_field: 'play_duration',
      missing_reason: durationAvailable ? null
        : (duration == null ? 'not_available' : 'invalid_duration')
    };

    return { replay_id: validation.replays[index].replay_id, values };
  });

  return {
    ...validation,
    data: {
      source: 'ballchasing',
      context: {
        platform: profile.platform,
        player_id: profile.player_id,
        mode: context.mode,
        match_type: context.matchType
      },
      replays: replayMetrics
    }
  };
}

module.exports = { findReplayPlayer, validateReplayBlock, extractReplayBlockMetrics };
