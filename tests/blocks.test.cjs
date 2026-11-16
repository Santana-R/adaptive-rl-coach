const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { createApp } = require('../src/app');
const app = createApp({ supabase: null, enableBlocksDemo: true });
const store = require('../src/services/block-store');

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const req = http.request({ hostname: '127.0.0.1', port, method, path, headers }, response => {
        let text = '';
        response.setEncoding('utf8');
        response.on('data', chunk => { text += chunk; });
        response.on('end', () => {
          server.close();
          resolve({ status: response.statusCode, data: JSON.parse(text) });
        });
      });
      req.on('error', error => { server.close(); reject(error); });
      req.end(body);
    });
  });
}

function jsonRequest(method, path, value) {
  const body = JSON.stringify(value);
  return request(method, path, body, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body)
  });
}

test.beforeEach(() => store.clearBlocks());

test('POST blocks accepts exactly five replays and GET returns pending block', async () => {
  const files = Array.from({ length: 5 }, (_, index) => ({ name: `match-${index + 1}.replay`, size: 10 }));
  const created = await jsonRequest('POST', '/api/v1/blocks', { files });

  assert.equal(created.status, 202);
  assert.equal(created.data.data.status, 'pending');
  assert.equal(created.data.data.expected_replays, 5);

  const listed = await request('GET', '/api/v1/blocks');
  assert.equal(listed.status, 200);
  assert.equal(listed.data.data.length, 1);
  assert.equal(listed.data.data[0].block_id, created.data.data.block_id);
});

test('POST blocks accepts multipart files from the browser', async () => {
  const server = await new Promise((resolve, reject) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
    listener.on('error', reject);
  });
  try {
    const port = server.address().port;
    const form = new FormData();
    for (let index = 1; index <= 5; index += 1) {
      form.append('files', new Blob([`synthetic replay ${index}`]), `match-${index}.replay`);
    }
    const response = await fetch(`http://127.0.0.1:${port}/api/v1/blocks`, {
      method: 'POST',
      body: form
    });
    const payload = await response.json();
    assert.equal(response.status, 202);
    assert.equal(payload.data.status, 'pending');
    assert.equal(payload.data.files.length, 5);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

test('POST blocks rejects count, extension and duplicate errors', async () => {
  const tooFew = await jsonRequest('POST', '/api/v1/blocks', {
    files: [{ name: 'only.replay', size: 1 }]
  });
  assert.equal(tooFew.status, 400);
  assert.equal(tooFew.data.error.code, 'REPLAY_COUNT_INVALID');

  const invalidExtension = await jsonRequest('POST', '/api/v1/blocks', {
    files: Array.from({ length: 4 }, (_, index) => ({ name: `${index}.replay`, size: 1 }))
      .concat({ name: 'notes.txt', size: 1 })
  });
  assert.equal(invalidExtension.status, 422);
  assert.equal(invalidExtension.data.error.code, 'INPUT_INVALID');

  const duplicate = await jsonRequest('POST', '/api/v1/blocks', {
    files: [{ name: 'same.replay', size: 1 }, { name: 'same.replay', size: 2 },
      { name: 'a.replay', size: 1 }, { name: 'b.replay', size: 1 }, { name: 'c.replay', size: 1 }]
  });
  assert.equal(duplicate.status, 422);
  assert.equal(duplicate.data.error.code, 'DUPLICATE_REPLAY');
});
// node --test tests/blocks.test.cjs tests/metrics.test.cjs tests/comparison.test.cjs