'use strict';

// A38: comprobación HTTP sin cuentas ni datos privados. Sin argumento levanta Express
// en un puerto local libre; con una URL comprueba el entorno que ya está en ejecución.
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { getPublicConfig } = require('../src/services/supabase');

const pages = [
  '/', ...['index', 'aboutus', 'helpme', 'login', 'perfil', 'replays', 'analisis',
    'objetivos', 'plan', 'sesiones', 'panel', 'admin-resumen', 'admin-usuarios', 'admin-ejercicios']
    .map(name => `/sitio/html/${name}.html`),
];

async function main() {
  let server;
  try {
    let base = process.argv[2];
    if (!base) {
      server = require('../src/app').listen(0, '127.0.0.1');
      await once(server, 'listening');
      base = `http://127.0.0.1:${server.address().port}`;
    }
    const origin = new URL(base).origin;
    const get = path => fetch(new URL(path, origin), { signal: AbortSignal.timeout(15000), redirect: 'error' });
    const health = await get('/health');
    assert.equal(health.status, 200, '/health');
    assert.equal((await health.json()).status, 'ok');
    for (const path of pages) {
      const res = await get(path);
      assert.equal(res.status, 200, path);
      assert.match(res.headers.get('content-type'), /text\/html/);
      await res.arrayBuffer();
    }
    const res = await get('/sitio/js/supabase-config.js');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    const body = await res.text();
    const expected = `window.SUPABASE_CONFIG = ${JSON.stringify(getPublicConfig())};\n`;
    if (body !== expected) throw new Error('La configuración pública no coincide con el .env de la comprobación.');
    for (const name of ['SUPABASE_SERVICE_ROLE_KEY', 'BALLCHASING_TOKEN']) {
      const secret = process.env[name]?.trim();
      if (secret && body.includes(secret)) throw new Error('Se detectó una clave privada en la configuración pública.');
    }
    // En modo sin Supabase se espera 503; con Supabase, 401. Ningún caso admite acceso anónimo.
    const configured = Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
    for (const path of ['/api/v1/me', '/api/v1/profile', '/api/v1/admin/users']) {
      const response = await get(path);
      assert.equal(response.status, configured ? 401 : 503, path);
      assert.equal((await response.json()).error.code, configured ? 'AUTH_REQUIRED' : 'PROVIDER_UNAVAILABLE');
    }
    console.log(`A38: salud, ${pages.length} páginas, configuración pública y 3 rutas protegidas: correctas.`);
    console.log(`Modo de ejecución: ${configured ? 'configurado' : 'sin proveedores'}; no acredita login, OAuth ni cargas reales.`);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => {
  // No imprimir respuestas completas ni configuración ni claves de servicios.
  console.error(`A38: smoke fallido (${error.name}). Revisar .env, URL y estado del servidor.`);
  process.exitCode = 1;
});
