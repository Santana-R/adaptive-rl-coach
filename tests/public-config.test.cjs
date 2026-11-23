'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getPublicConfig } = require('../src/services/supabase');
const { createApp } = require('../src/app');

const env = {
  SUPABASE_URL: 'https://fixture.example/',
  SUPABASE_ANON_KEY: 'sb_publishable_fixture',
  SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_fixture',
  BALLCHASING_TOKEN: 'fixture-private-token',
};
const disabled = { url: '', anonKey: '' };
const legacy = role => `test.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;

test('A38: configura el navegador para el proyecto indicado y acepta anon legacy', () => {
  assert.deepEqual(getPublicConfig(env), { url: 'https://fixture.example', anonKey: env.SUPABASE_ANON_KEY });
  assert.equal(getPublicConfig({ ...env, SUPABASE_ANON_KEY: legacy('anon') }).anonKey, legacy('anon'));
});

test('A38: sin configuración válida, el acceso público permanece deshabilitado', () => {
  for (const override of [
    { SUPABASE_URL: '' }, { SUPABASE_URL: 'not-a-url' },
    { SUPABASE_URL: 'https://user:password@fixture.example' },
    { SUPABASE_ANON_KEY: '' }, { SUPABASE_ANON_KEY: 'sb_secret_other' },
    { SUPABASE_ANON_KEY: legacy('service_role') },
    { SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_ANON_KEY },
    { BALLCHASING_TOKEN: env.SUPABASE_ANON_KEY },
  ]) assert.deepEqual(getPublicConfig({ ...env, ...override }), disabled);
  assert.deepEqual(getPublicConfig({}), disabled);
});

test('A38: Express sirve la configuración de ejecución sin incluir claves privadas', async () => {
  const app = createApp({ supabase: null, publicConfigEnv: env });
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    const url = `http://127.0.0.1:${server.address().port}/sitio/js/supabase-config.js`;
    const response = await fetch(url);
    const body = await response.text();
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /javascript/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(body, `window.SUPABASE_CONFIG = ${JSON.stringify(getPublicConfig(env))};\n`);
    assert.ok(!body.includes(env.SUPABASE_SERVICE_ROLE_KEY));
    assert.ok(!body.includes(env.BALLCHASING_TOKEN));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
