'use strict';

const { win32 } = require('node:path');
const { setTimeout: sleep } = require('node:timers/promises');
const { ApiError } = require('../middleware/auth');

const API = 'https://ballchasing.com/api';
let nextRead = 0;
let retryAt = 0;

function requireToken() {
  const token = process.env.BALLCHASING_TOKEN?.trim();
  if (!token) throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'Ballchasing no está configurado en el servidor.');
  return token;
}

function limitError() {
  const error = new ApiError(429, 'RATE_LIMITED', 'Ballchasing limitó las consultas. Vuelve a intentar más tarde.');
  error.providerStatus = 429;
  error.retryAfter = Math.max(1, Math.ceil((retryAt - Date.now()) / 1000));
  return error;
}

async function request(path, { method, body, timeout, accepted }) {
  const token = requireToken();
  if (Date.now() < retryAt) throw limitError();
  let response;
  try {
    response = await fetch(API + path, {
      method, body, redirect: 'error', signal: AbortSignal.timeout(timeout),
      headers: { Authorization: token }
    });
  } catch {
    throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'No se pudo contactar a Ballchasing.');
  }

  if (response.status === 429) {
    const value = response.headers.get('Retry-After');
    const until = value && /^\d+$/.test(value) ? Date.now() + Number(value) * 1000 : Date.parse(value);
    retryAt = Math.max(retryAt, Date.now() + 5000, Number.isFinite(until) ? until : 0);
    await response.body?.cancel();
    throw limitError();
  }

  if (!accepted.includes(response.status)) {
    await response.body?.cancel();
    const invalid = method === 'POST' && [400, 413, 415, 422].includes(response.status);
    const error = invalid
      ? new ApiError(422, 'REPLAY_FORMAT_INVALID', 'Ballchasing rechazó el archivo.')
      : new ApiError(503, 'PROVIDER_UNAVAILABLE', 'Ballchasing no pudo completar la operación.');
    error.providerStatus = response.status;
    throw error;
  }

  try {
    return { status: response.status, data: await response.json() };
  } catch {
    throw new ApiError(502, 'PROVIDER_UNAVAILABLE', 'Ballchasing devolvió una respuesta inválida.');
  }
}

async function uploadPrivateReplay(name, bytes) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || !/\.replay$/i.test(name)) {
    throw new ApiError(422, 'REPLAY_FORMAT_INVALID', 'El archivo .replay no es válido.');
  }
  const body = new FormData();
  body.append('file', new Blob([bytes], { type: 'application/octet-stream' }), win32.basename(name));
  const { status, data } = await request('/v2/upload?visibility=private', {
    method: 'POST', body, timeout: 30000, accepted: [201, 409]
  });
  if (typeof data?.id !== 'string' || !data.id.trim()) {
    throw new ApiError(502, 'PROVIDER_UNAVAILABLE', 'Ballchasing no devolvió un identificador.');
  }
  return { id: data.id, duplicate: status === 409, providerStatus: status };
}

async function getReplay(id) {
  const now = Date.now();
  if (now < retryAt) throw limitError();
  const start = Math.max(now, nextRead);
  nextRead = start + 550;
  if (start > now) await sleep(start - now);
  const { data } = await request('/replays/' + encodeURIComponent(id), {
    method: 'GET', timeout: 10000, accepted: [200]
  });
  return data;
}

module.exports = { getReplay, uploadPrivateReplay, requireToken };
