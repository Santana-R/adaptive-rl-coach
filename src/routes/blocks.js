const express = require('express');
const store = require('../services/block-store');
const blocks = require('../repositories/blocks');
const { ApiError, CONTRACT_VERSION } = require('../middleware/auth');
const ballchasing = require('../services/ballchasing');
const ingestion = require('../services/ingestion');

const router = express.Router();

function sendError(res, status, failure) {
  return res.status(status).json({
    error: {
      code: failure.code,
      message: failure.message,
      details: failure.details
    },
    meta: { contract_version: '1.0' }
  });
}

function parseMultipartFiles(body, contentType) { //Lee la informacion dada por el navegador del archivo
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || ''); //Identifica por partes
  if (!match) return null;
  const boundary = `--${match[1] || match[2]}`;
  const text = body.toString('latin1');
  const files = [];
  for (const part of text.split(boundary)) {
    const filename = /filename="([^"]*)"/i.exec(part)?.[1]; //Busca el atributo filename y obtiene los nombres.
    if (filename !== undefined) files.push({ name: filename, size: 0 }); //Obtiene nombre, cantidad y tamaño basico.
  }
  return files;
}

const readMultipart = express.raw({
  type: 'multipart/form-data', limit: ingestion.uploadLimitMb + 'mb'
});

router.post('/', readMultipart, (req, res) => { //API api/v1/blocks
  //Valida que se pueda subir los 5 replays con todo lo que conlleva que estos sean correctos.
  let files;
  if (Buffer.isBuffer(req.body)) {
    files = parseMultipartFiles(req.body, req.headers['content-type']);
    if (!files) return sendError(res, 400, {
      code: 'INPUT_INVALID',
      message: 'El formulario multipart no tiene un boundary válido.',
      details: {}
    });
  } else {
    files = req.body?.files;
  }

  const result = store.createBlock(files);
  if (result.error) {
    const status = result.error.code === 'REPLAY_COUNT_INVALID' ? 400 : 422;
    return sendError(res, status, result.error);
  }
  return res.status(202).json({
    data: result.block,
    meta: { contract_version: '1.0' }
  });
});

router.get('/', (_req, res) => { //API api/v1/blocks/:blockID. 
  //Consulta un bloque en especifico.
  res.json({
    data: store.listBlocks(),
    meta: { contract_version: '1.0' }
  });
});

router.get('/:blockId', (req, res) => {
  const block = store.getBlock(req.params.blockId);
  if (!block) return sendError(res, 404, {
    code: 'RESOURCE_NOT_FOUND',
    message: 'El bloque no existe.',
    details: {}
  });
  return res.json({
    data: block,
    meta: { contract_version: '1.0' }
  });
});

module.exports = router;

function createPrivateBlocksRouter({ supabase, requireAuth }) {
  const routes = express.Router();
  const active = new Set();

  function reportCleanupError() {
    console.error('A13: no se pudieron limpiar los replays temporales.');
  }

  if (supabase) {
    const expire = () => ingestion.expireFiles(active).catch(reportCleanupError);
    expire();
    setInterval(expire, Math.min(ingestion.tempTtlMs, 60000)).unref();
  }

  routes.use(requireAuth, (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  function response(res, status, data) {
    return res.status(status).json({ data, meta: { contract_version: CONTRACT_VERSION } });
  }

  function reserve(folder) {
    if (active.has(folder)) {
      throw new ApiError(409, 'BLOCK_NOT_READY', 'El bloque ya se está procesando.');
    }
    active.add(folder);
  }

  function statusForClient(block, folder) {
    return {
      ...block,
      retry_allowed: !active.has(folder) && ['failed', 'pending', 'processing'].includes(block.status),
      reason_codes: [...new Set((block.replays ?? []).flatMap(replay =>
        replay.error ? replay.error.split(',') : []
      ))]
    };
  }

  async function run({ userId, blockId, folder, files }) {
    try {
      await ingestion.processReplayBlock({ supabase, userId, blockId, folder, files });
    } catch {
      try {
        await blocks.updateBlockStatus(supabase, userId, blockId, 'failed');
      } catch {
        console.error('A13: no se pudo registrar el fallo del bloque.');
      }
    } finally {
      active.delete(folder);
    }
  }

  async function ownBlock(req) {
    const block = await blocks.getBlock(supabase, req.user.id, req.params.blockId);
    if (!block) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'El bloque no existe.');
    return block;
  }

  routes.post('/', readMultipart, async (req, res) => {
    ballchasing.requireToken();
    const parts = await ingestion.parseMultipartFiles(req.body, req.get('content-type'));
    const files = await ingestion.prepareReplayFiles(parts);
    const userId = req.user.id;
    const block = await ingestion.savePendingReplayBlock(supabase, userId, files);
    const blockId = block.block_id;
    const folder = ingestion.replayFolder(userId, blockId);
    reserve(folder);
    try {
      await ingestion.stageReplayFiles(folder, files);
    } catch {
      await ingestion.removeFiles(folder).catch(reportCleanupError);
      active.delete(folder);
      await blocks.updateBlockStatus(supabase, userId, blockId, 'failed');
      throw new ApiError(503, 'PROVIDER_UNAVAILABLE', 'No se pudieron guardar los archivos temporales.');
    }
    response(res, 202, statusForClient(block, folder));
    void run({ userId, blockId, folder, files });
  });

  routes.get('/', async (req, res) => {
    const list = await blocks.listBlocks(supabase, req.user.id);
    return response(res, 200, list.map(block =>
      statusForClient(block, ingestion.replayFolder(req.user.id, block.block_id))
    ));
  });

  routes.get('/:blockId', async (req, res) => {
    const block = await ownBlock(req);
    return response(res, 200, statusForClient(block, ingestion.replayFolder(req.user.id, block.block_id)));
  });

  routes.post('/:blockId/retry', async (req, res) => {
    const block = await ownBlock(req);
    const userId = req.user.id;
    const blockId = block.block_id;
    const folder = ingestion.replayFolder(userId, blockId);
    if (!statusForClient(block, folder).retry_allowed || block.replays.length !== blocks.MAX_REPLAYS) {
      throw new ApiError(409, 'BLOCK_NOT_READY', 'Este bloque no admite un reintento.');
    }
    ballchasing.requireToken();
    reserve(folder);
    let files;
    try {
      files = await ingestion.loadRetryFiles(folder, block.replays);
    } catch (error) {
      try {
        if (['REPLAY_FILES_EXPIRED', 'REPLAY_FILES_CHANGED'].includes(error.code)) {
          const missing = block.replays.find(replay => !replay.ballchasing_id);
          await blocks.recordReplayResult(supabase, userId, blockId, missing.position, null, {
            status: 'failed', verified: false, error: error.code
          });
          await blocks.updateBlockStatus(supabase, userId, blockId, 'invalid');
          await ingestion.removeFiles(folder).catch(reportCleanupError);
        }
      } finally {
        active.delete(folder);
      }
      throw error;
    }
    response(res, 202, statusForClient({ ...block, status: 'processing' }, folder));
    void run({ userId, blockId, folder, files });
  });

  routes.use((error, _req, res, next) => {
    if (error.type !== 'entity.too.large') return next(error);
    return sendError(res, 413, {
      code: 'INPUT_INVALID',
      message: 'El formulario supera el límite de ' + ingestion.uploadLimitMb + ' MB.'
    });
  });

  return routes;
}

module.exports.createPrivateBlocksRouter = createPrivateBlocksRouter;
