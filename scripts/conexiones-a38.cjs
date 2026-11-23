'use strict';

// A38: prueba de conexión de solo lectura. No imprime datos de usuarios, claves ni tokens.
const { createServerClient, getPublicConfig } = require('../src/services/supabase');

async function main() {
  const config = getPublicConfig();
  if (!config.url || !config.anonKey || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      !process.env.BALLCHASING_TOKEN?.trim()) {
    console.error('A38: completar SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY y BALLCHASING_TOKEN de .env.');
    process.exitCode = 1;
    return;
  }
  let failed = false;
  async function check(label, fn) {
    try {
      if (!(await fn())) throw new Error('Comprobación no satisfecha');
      console.log(`${label}: OK`);
    } catch {
      failed = true;
      console.error(`${label}: FALLO (revisar configuración o conexión).`);
    }
  }
  await check('Supabase Auth / proveedor Google habilitado', async () => {
    const response = await fetch(`${config.url}/auth/v1/settings`, {
      headers: { apikey: config.anonKey }, signal: AbortSignal.timeout(15000), redirect: 'error',
    });
    return response.ok && (await response.json()).external?.google === true;
  });
  await check('Supabase PostgreSQL / auditoría de integridad A39', async () => {
    const client = createServerClient();
    const { data, error } = await client.rpc('a39_auditar_integridad').abortSignal(AbortSignal.timeout(15000));
    return !error && Array.isArray(data) && data.length > 0 &&
      data.every(row => row.filas_invalidas === 0 || row.filas_invalidas === '0');
  });
  await check('Ballchasing / ping autenticado', async () => {
    const response = await fetch('https://ballchasing.com/api/', {
      headers: { Authorization: process.env.BALLCHASING_TOKEN.trim() },
      signal: AbortSignal.timeout(15000), redirect: 'error',
    });
    await response.body?.cancel();
    return response.ok;
  });
  console.log('Comprobar inicio de sesión y redirección OAuth en el navegador sigue siendo obligatorio.');
  process.exitCode = failed ? 1 : 0;
}

main().catch(() => { console.error('A38: no se pudo completar la comprobación.'); process.exitCode = 1; });
