const { createApp } = require('../../src/app');
const { demoInput } = require('../../src/services/analysis-demo');

const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const ADMIN = '00000000-0000-4000-8000-0000000000ad';
const SUSPENDED = '00000000-0000-4000-8000-00000000000c';

function fakeAuth() {
  const tokens = { 'token-a': A, 'token-b': B, 'token-admin': ADMIN, 'token-suspended': SUSPENDED };
  return {
    auth: { async getUser(token) { return { data: { user: tokens[token] ? { id: tokens[token] } : null }, error: null }; } },
    from(table) {
      let userId;
      return {
        select() { return this; }, eq(_key, value) { userId = value; return this; },
        async maybeSingle() {
          return { data: table === 'usuarios' ? { id_usuario: userId, rol: userId === ADMIN ? 'administrador' : 'jugador', estado: userId === SUSPENDED ? 'suspendido' : 'activo' } : null, error: null };
        },
      };
    },
  };
}

function testRepository() {
  const blocks = new Map();
  for (const name of ['initial', 'followup', 'incompatible', 'missing']) {
    const block = demoInput(name).current; block.owner_id = A; blocks.set(block.block_id, block);
  }
  const other = structuredClone(blocks.get('demo-previous')); other.block_id = 'owned-by-b'; other.owner_id = B;
  blocks.set(other.block_id, other);
  return {
    blocks, calls: [], unsafeLookup: false, fail: false,
    async getBlockForUser(id, owner) {
      this.calls.push({ id, owner });
      if (this.fail) throw new Error('private-provider-details');
      const block = blocks.get(id);
      return block && (block.owner_id === owner || this.unsafeLookup) ? structuredClone(block) : null;
    },
    async listBlocksForUser(owner) {
      this.calls.push({ listOwner: owner });
      // Devuelve también un ajeno para comprobar que la ruta lo excluye defensivamente.
      return [...blocks.values()].map(block => structuredClone(block));
    },
  };
}

async function startAnalysisServer({ demo = true, repository = testRepository(), auth = fakeAuth() } = {}) {
  const app = createApp({ supabase: auth, analysisRepository: repository, enableAnalysisDemo: demo });
  let server;
  await new Promise(resolve => { server = app.listen(0, '127.0.0.1', resolve); });
  return { base: `http://127.0.0.1:${server.address().port}`, repository,
    close: () => new Promise(resolve => server.close(resolve)) };
}

module.exports = { startAnalysisServer, testRepository, fakeAuth, A, B };
