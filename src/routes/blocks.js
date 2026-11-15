const express = require('express');
const store = require('../services/block-store');

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

router.post('/', (req, res) => { //API api/v1/blocks
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
