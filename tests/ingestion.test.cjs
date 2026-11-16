'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { setTimeout: sleep } = require('node:timers/promises');
const { createApp } = require('../src/app');
const { ApiError } = require('../src/middleware/auth');
const blocks = require('../src/repositories/blocks');
const profiles = require('../src/repositories/profile');
const provider = require('../src/services/ballchasing');
const { prepareReplayFiles } = require('../src/services/ingestion');

const OWNER = 'cb16d0c1-cc27-4acf-9a88-19c155e007fc';
const OTHER = 'af56758d-5ec8-4500-9ce4-c958329722e5';

function files() {
  return Array.from({ length: 5 }, (_, i) => new File(['fixture ' + i], i + '.replay'));
}

function multipart() {
  const form = new FormData();
  for (const file of files()) form.append('files', file);
  return form;
}

test('A13 valida cinco archivos binarios con nombres y hashes distintos', async () => {
  const prepared = await prepareReplayFiles(files());
  assert.equal(prepared.length, 5);
  assert.equal(prepared[2].bytes.toString(), 'fixture 2');
  const bad = files();
  await assert.rejects(prepareReplayFiles(bad.slice(1)), { code: 'REPLAY_COUNT_INVALID' });
  bad[1] = new File(['fixture 0'], 'otro.replay');
  await assert.rejects(prepareReplayFiles(bad), { code: 'DUPLICATE_REPLAY' });
  bad[1] = new File(['fixture 1'], 'otro.txt');
  await assert.rejects(prepareReplayFiles(bad), { code: 'INPUT_INVALID' });
});

function mockStorage(t) {
  let saved;
  t.mock.method(profiles, 'getProfile', async () => ({
    mode: '2v2', platform: 'steam', player_id: 'test-player'
  }));
  t.mock.method(blocks, 'createBlock', async (_db, _user, input) => {
    saved = { ...input, block_id: '9017', expected_replays: 5, ready_replays: 0 };
    return structuredClone(saved);
  });
  t.mock.method(blocks, 'getBlock', async (_db, userId, id) =>
    userId === OWNER && id === saved?.block_id ? structuredClone(saved) : null
  );
  t.mock.method(blocks, 'updateBlockStatus', async (_db, _user, _id, status) => {
    saved.status = status;
    return structuredClone(saved);
  });
  t.mock.method(blocks, 'recordReplayUpload', async (_db, _user, _id, position, upload) => {
    saved.replays[position - 1].ballchasing_id = upload.id;
  });
  t.mock.method(blocks, 'recordReplayResult', async (_db, _user, _id, position, _external, result) => {
    Object.assign(saved.replays[position - 1], result);
  });
  t.mock.method(blocks, 'completeReplayBlock', async (_db, _user, _id, context, results, metrics) => {
    assert.equal(context.match_type, 'ranked');
    assert.equal(results.length, 5);
    assert.equal(metrics.goals, 5);
    assert.ok(results.every(replay => replay.metrics.assists === 0));
    saved.status = 'ready';
    saved.ready_replays = 5;
  });
}

function fakeAuth() {
  return {
    auth: {
      getUser: async token => ({
        data: { user: { id: token === 'owner' ? OWNER : OTHER } }
      })
    },
    from: () => ({
      select: () => ({
        eq: (_key, id) => ({
          maybeSingle: async () => ({ data: { id_usuario: id, rol: 'jugador', estado: 'activo' } })
        })
      })
    })
  };
}

test('A13 exige sesión y conserva ID y cargas aceptadas al reintentar', async t => {
  mockStorage(t);
  t.mock.method(provider, 'requireToken', () => 'fixture-token');
  let interrupted = false;
  const uploaded = [];
  const queried = [];
  t.mock.method(provider, 'uploadPrivateReplay', async name => {
    uploaded.push(name);
    if (name === '2.replay' && !interrupted) {
      interrupted = true;
      throw new ApiError(429, 'RATE_LIMITED', 'Simulación de cuota.');
    }
    return { id: 'test-' + name, providerStatus: 201, duplicate: false };
  });
  t.mock.method(provider, 'getReplay', async id => {
    queried.push(id);
    return {
      id, status: 'ok', visibility: 'private', team_size: 2, playlist_id: 'ranked-doubles',
      blue: { players: [{ id: { platform: 'steam', id: 'test-player' }, stats: {
        core: { goals: 1, shots: 2, assists: 0, saves: 0 }
      } }] }
    };
  });
  const app = createApp({ supabase: fakeAuth() });
  const server = await new Promise(resolve => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = 'http://127.0.0.1:' + server.address().port + '/api/v1/blocks';
  const headers = { Authorization: 'Bearer owner' };
  const request = (path, options) => fetch(url + path, { headers, ...options });
  async function waitFor(id, status) {
    for (let attempt = 0; attempt < 80; attempt++) {
      const response = await request('/' + id);
      assert.equal(response.status, 200);
      const { data } = await response.json();
      if (data.status === status && (status !== 'failed' || data.retry_allowed)) return data;
      await sleep(20);
    }
    assert.fail('No se observó el estado ' + status);
  }

  assert.equal((await request('', { method: 'POST', body: multipart(), headers: {} })).status, 401);
  const start = await request('', { method: 'POST', body: multipart() });
  assert.equal(start.status, 202);
  const { data: block } = await start.json();
  assert.equal(block.status, 'pending');

  const failed = await waitFor(block.block_id, 'failed');
  assert.equal(failed.replays[0].ballchasing_id, 'test-0.replay');
  assert.deepEqual(failed.reason_codes, ['RATE_LIMITED']);
  assert.equal(queried.length, 0);
  assert.equal((await request('/' + block.block_id + '/retry', {
    method: 'POST', headers: { Authorization: 'Bearer other' }
  })).status, 404);

  const retry = await request('/' + block.block_id + '/retry', { method: 'POST' });
  assert.equal(retry.status, 202);
  assert.equal((await retry.json()).data.block_id, block.block_id);
  const ready = await waitFor(block.block_id, 'ready');
  assert.equal(ready.ready_replays, 5);
  assert.deepEqual(uploaded, ['0.replay', '1.replay', '2.replay', '2.replay', '3.replay', '4.replay']);
  assert.equal(new Set(queried).size, 5);
});

test('A13 solicita privacidad y distingue duplicados del formato rechazado', async t => {
  const previous = process.env.BALLCHASING_TOKEN;
  process.env.BALLCHASING_TOKEN = 'fixture-token';
  t.after(() => {
    if (previous === undefined) delete process.env.BALLCHASING_TOKEN;
    else process.env.BALLCHASING_TOKEN = previous;
  });

  const client = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://ballchasing.com/api/v2/upload?visibility=private');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, 'fixture-token');
    assert.equal(options.body.get('file').name, 'demo.replay');
    return Response.json({ id: 'existing' }, { status: 409 });
  });
  assert.deepEqual(await provider.uploadPrivateReplay('demo.replay', Buffer.from('data')), {
    id: 'existing', duplicate: true, providerStatus: 409
  });
  client.mock.mockImplementation(async () => Response.json({}, { status: 400 }));
  await assert.rejects(provider.uploadPrivateReplay('demo.replay', Buffer.from('data')), {
    code: 'REPLAY_FORMAT_INVALID'
  });
});
