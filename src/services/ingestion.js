'use strict';

const { createHash } = require('node:crypto');
const { mkdir, readFile, readdir, rename, rm, stat, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join, win32 } = require('node:path');
const { setTimeout: sleep } = require('node:timers/promises');
const { ApiError } = require('../middleware/auth');
const blocks = require('../repositories/blocks');
const profiles = require('../repositories/profile');
const { calculateBlockMetrics } = require('../domain/metrics');
const { parseTimestamp } = require('../domain/timestamps');
const { validateFiles } = require('./block-store');
const { extractReplayBlockMetrics } = require('./replay-validation');
const ballchasing = require('./ballchasing');

const MAX_POLL_ROUNDS = 6;
const POLL_INTERVAL_MS = 5000;
const USER_ID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const BLOCK_ID = /^[1-9]\d{0,17}$/;
const scratchRoot = join(tmpdir(), 'adaptive-rl-coach-replays',
  createHash('sha256').update(__dirname).digest('hex').slice(0, 16));

function readPositiveInteger(value, fallback, max) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 && number <= max ? number : fallback;
}

const uploadLimitMb = readPositiveInteger(process.env.REPLAY_UPLOAD_MAX_MB, 100, 100);
const tempTtlMs = readPositiveInteger(process.env.REPLAY_TEMP_TTL_MINUTES, 60, 1440) * 60000;
const hashBytes = bytes => createHash('sha256').update(bytes).digest('hex');

async function parseMultipartFiles(body, contentType) {
  if (!Buffer.isBuffer(body) || !/^multipart\/form-data\s*;/i.test(contentType ?? '')) {
    throw new ApiError(400, 'INPUT_INVALID', 'Envía cinco archivos en un formulario multipart.');
  }
  let form;
  try {
    form = await new Response(body, { headers: { 'Content-Type': contentType } }).formData();
  } catch {
    throw new ApiError(400, 'INPUT_INVALID', 'El formulario multipart no es válido.');
  }
  const files = form.getAll('files');
  if (Array.from(form.keys()).some(key => key !== 'files') ||
      files.some(file => typeof file === 'string')) {
    throw new ApiError(400, 'INPUT_INVALID', 'El formulario debe contener únicamente archivos en el campo files.');
  }
  return files;
}

async function prepareReplayFiles(files) {
  const names = files.map(file => ({ name: win32.basename(file.name).trim(), size: file.size }));
  const invalid = validateFiles(names);
  if (invalid) {
    const status = invalid.code === 'REPLAY_COUNT_INVALID' ? 400 : 422;
    throw new ApiError(status, invalid.code, invalid.message);
  }

  const prepared = [];
  const hashes = new Set();
  for (const [index, file] of files.entries()) {
    const { name, size } = names[index];
    if (name.length > 255 || !size) {
      throw new ApiError(422, 'REPLAY_FORMAT_INVALID', 'Hay un archivo vacío o con un nombre demasiado largo.');
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const hash = hashBytes(bytes);
    if (hashes.has(hash)) {
      throw new ApiError(422, 'DUPLICATE_REPLAY', 'Dos archivos tienen el mismo contenido.');
    }
    hashes.add(hash);
    prepared.push({ position: index + 1, name, size, hash, bytes });
  }
  return prepared;
}

async function savePendingReplayBlock(supabase, userId, files) {
  const profile = await profiles.getProfile(supabase, userId);
  if (!['steam', 'epic'].includes(profile?.platform) ||
      !['1v1', '2v2', '3v3'].includes(profile?.mode) ||
      typeof profile.player_id !== 'string' || !profile.player_id.trim()) {
    throw new ApiError(422, 'PROFILE_INCOMPLETE', 'Completa la plataforma, ID de jugador y modalidad en tu perfil.');
  }
  return blocks.createBlock(supabase, userId, {
    status: 'pending',
    mode: profile.mode,
    match_type: 'pending',
    replays: files.map(file => ({
      position: file.position, file_name: file.name, status: 'pending', upload_origin: 'own',
      file: { hash: file.hash, size_bytes: file.size },
      player: { platform: profile.platform, player_id: profile.player_id }
    }))
  });
}

function replayFolder(userId, blockId) {
  if (!USER_ID.test(userId) || !BLOCK_ID.test(blockId)) {
    throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'El bloque no existe.');
  }
  return join(scratchRoot, userId, blockId);
}

async function stageReplayFiles(folder, files) {
  await mkdir(folder, { recursive: true, mode: 0o700 });
  for (const file of files) {
    await writeFile(join(folder, String(file.position) + '.replay'), file.bytes, { mode: 0o600, flag: 'wx' });
  }
}

async function loadRetryFiles(folder, replays) {
  const missing = replays.filter(replay => !replay.ballchasing_id);
  if (!missing.length) return [];
  try {
    if (Date.now() - (await stat(folder)).mtimeMs >= tempTtlMs) {
      throw new ApiError(409, 'REPLAY_FILES_EXPIRED', 'Los archivos temporales caducaron. Crea un bloque nuevo.');
    }
    const files = [];
    for (const replay of missing) {
      const bytes = await readFile(join(folder, String(replay.position) + '.replay'));
      if (hashBytes(bytes) !== replay.file.hash) {
        throw new ApiError(422, 'REPLAY_FILES_CHANGED', 'Un archivo temporal cambió. Crea un bloque nuevo.');
      }
      files.push({ position: replay.position, name: replay.file_name, bytes });
    }
    return files;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    throw new ApiError(409, 'REPLAY_FILES_EXPIRED', 'Los archivos temporales caducaron o faltan. Crea un bloque nuevo.');
  }
}

async function removeFiles(folder) {
  await rm(folder, { recursive: true, force: true });
}

async function expireFiles(active) {
  async function directories(folder) {
    try {
      return (await readdir(folder, { withFileTypes: true })).filter(entry => entry.isDirectory());
    } catch (error) {
      if (error.code === 'ENOENT') return [];
      throw error;
    }
  }

  for (const owner of await directories(scratchRoot)) {
    if (!USER_ID.test(owner.name)) continue;
    for (const block of await directories(join(scratchRoot, owner.name))) {
      if (!BLOCK_ID.test(block.name)) continue;
      const folder = replayFolder(owner.name, block.name);
      try {
        const info = await stat(folder);
        if (!active.has(folder) && Date.now() - info.mtimeMs >= tempTtlMs) await removeFiles(folder);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }
}

async function acceptedUpload(folder, file, provider) {
  const receipt = join(folder, String(file.position) + '.json');
  const digest = hashBytes(file.bytes);
  try {
    const saved = JSON.parse(await readFile(receipt, 'utf8'));
    if (saved.hash === digest && typeof saved.id === 'string' && saved.id) {
      return { id: saved.id, duplicate: false, providerStatus: 201 };
    }
    throw new ApiError(422, 'REPLAY_FILES_CHANGED', 'El registro local de este archivo cambió.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const upload = await provider.uploadPrivateReplay(file.name, file.bytes);
  if (upload.duplicate) throw new ApiError(409, 'DUPLICATE_REPLAY', 'El replay ya existe en Ballchasing.');
  if (upload.providerStatus !== 201 || typeof upload.id !== 'string' || !upload.id) {
    throw new ApiError(502, 'PROVIDER_UNAVAILABLE', 'Ballchasing no confirmó la carga.');
  }
  await writeFile(receipt + '.tmp', JSON.stringify({ hash: digest, id: upload.id }), { mode: 0o600 });
  await rename(receipt + '.tmp', receipt);
  return upload;
}

async function processReplayBlock({ supabase, userId, blockId, folder, files, provider = ballchasing, wait = sleep }) {
  const block = await blocks.updateBlockStatus(supabase, userId, blockId, 'processing');
  if (block.replays.length !== blocks.MAX_REPLAYS ||
      block.replays.some((replay, i) => replay.position !== i + 1)) {
    await blocks.updateBlockStatus(supabase, userId, blockId, 'invalid');
    await removeFiles(folder);
    return;
  }
  const change = state => blocks.updateBlockStatus(supabase, userId, blockId, state);
  const record = (replay, status, verified, error) => blocks.recordReplayResult(
    supabase, userId, blockId, replay.position, replay.ballchasing_id, { status, verified, error }
  );

  for (const replay of block.replays) {
    if (replay.ballchasing_id) continue;
    const file = files.find(item => item.position === replay.position);
    if (!file || hashBytes(file.bytes) !== replay.file.hash) {
      throw new ApiError(422, 'REPLAY_FILES_CHANGED', 'No se pudo verificar el archivo temporal.');
    }
    try {
      const upload = await acceptedUpload(folder, file, provider);
      await blocks.recordReplayUpload(supabase, userId, blockId, replay.position, upload);
      replay.ballchasing_id = upload.id;
    } catch (error) {
      const invalid = ['DUPLICATE_REPLAY', 'REPLAY_FORMAT_INVALID', 'REPLAY_FILES_CHANGED'].includes(error.code);
      const code = invalid || error.code === 'RATE_LIMITED' ? error.code : 'UPLOAD_UNAVAILABLE';
      await record(replay, 'failed', false, code);
      await change(invalid ? 'invalid' : 'failed');
      if (invalid) await removeFiles(folder);
      return;
    }
  }

  // Los IDs ya están guardados. Un reintento puede continuar solo con las consultas.
  await removeFiles(folder);
  const processed = new Map();
  for (let round = 0; round < MAX_POLL_ROUNDS && processed.size < block.replays.length; round++) {
    if (round) await wait(POLL_INTERVAL_MS);
    for (const replay of block.replays) {
      if (processed.has(replay.position)) continue;
      let result;
      try {
        result = await provider.getReplay(replay.ballchasing_id);
      } catch (error) {
        await record(replay, 'failed', false, error.code === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'STATUS_UNAVAILABLE');
        if (error.code === 'RATE_LIMITED') {
          await change('failed');
          return;
        }
        continue;
      }

      if (result?.id !== replay.ballchasing_id) {
        await record(replay, 'failed', false, 'STATUS_UNAVAILABLE');
        continue;
      }
      if (result.status === 'pending') {
        await record(replay, 'pending', result.visibility === 'private', null);
        continue;
      }
      if (result.status === 'failed' || (result.status === 'ok' && result.visibility !== 'private')) {
        const code = result.status === 'failed' ? 'REPLAY_PROCESSING_FAILED' : 'REPLAY_NOT_PRIVATE';
        await record(replay, 'failed', result.visibility === 'private', code);
        await change('invalid');
        return;
      }
      if (result.status !== 'ok') {
        await record(replay, 'failed', false, 'STATUS_UNAVAILABLE');
        continue;
      }
      processed.set(replay.position, result);
      // La privacidad está verificada. A14 determina la validez para este jugador.
      await record(replay, 'pending', true, null);
    }
  }

  if (processed.size !== block.replays.length) {
    for (const replay of block.replays) {
      if (!processed.has(replay.position)) await record(replay, 'failed', false, 'PROCESSING_TIMEOUT');
    }
    await change('failed');
    return;
  }

  const ordered = block.replays.map(replay => processed.get(replay.position));
  const { platform, player_id: playerId } = block.replays[0].player;
  const normalized = extractReplayBlockMetrics(ordered, { platform, player_id: playerId, mode: block.mode });
  for (const [i, replay] of block.replays.entries()) {
    const errors = normalized.replays[i].reason_codes;
    await record(replay, errors.length ? 'failed' : 'ok', true, errors.join(',') || null);
  }
  if (!normalized.valid) {
    await change('invalid');
    return;
  }

  const results = normalized.data.replays.map((entry, i) => ({
    position: block.replays[i].position,
    externalId: entry.replay_id,
    playedAt: parseTimestamp(ordered[i].date) === null ? null : ordered[i].date,
    metrics: Object.fromEntries(['goals', 'shots', 'assists', 'saves'].map(key => [key, entry.values[key].value]))
  }));
  const metrics = blocks.metricsFromCalculation(calculateBlockMetrics(normalized.data));
  await blocks.completeReplayBlock(supabase, userId, blockId, normalized.data.context, results, metrics);
}

module.exports = {
  uploadLimitMb, tempTtlMs, parseMultipartFiles, prepareReplayFiles, savePendingReplayBlock,
  replayFolder, stageReplayFiles, loadRetryFiles, expireFiles, removeFiles, processReplayBlock
};
