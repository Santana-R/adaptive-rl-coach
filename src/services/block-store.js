const EXPECTED_REPLAYS = 5;

const blocks = new Map();
let nextBlockId = 1;

function error(code, message, details = {}) {
  return { code, message, details };
}

function validateFiles(files) {
  if (!Array.isArray(files) || files.length !== EXPECTED_REPLAYS) {
    return error(
      'REPLAY_COUNT_INVALID',
      `Selecciona exactamente ${EXPECTED_REPLAYS} archivos .replay.`,
      { expected: EXPECTED_REPLAYS, received: Array.isArray(files) ? files.length : 0 }
    );
  }

  const normalized = files.map(file => ({
    name: typeof file?.name === 'string' ? file.name.trim() : '',
    size: Number.isSafeInteger(file?.size) && file.size >= 0 ? file.size : 0
  }));
  if (normalized.some(file => !file.name.toLowerCase().endsWith('.replay'))) {
    return error('INPUT_INVALID', 'Todos los archivos deben tener extensión .replay.');
  }

  const names = normalized.map(file => file.name.toLowerCase());
  if (new Set(names).size !== names.length) {
    return error('DUPLICATE_REPLAY', 'Hay archivos repetidos en el bloque.');
  }
  return null;
}

function createBlock(files) {
  const validationError = validateFiles(files);
  if (validationError) return { error: validationError };

  const block = {
    block_id: `block-${String(nextBlockId++).padStart(4, '0')}`,
    status: 'pending',
    expected_replays: EXPECTED_REPLAYS,
    ready_replays: 0,
    files: files.map(file => ({
      name: file.name.trim(),
      size: Number.isSafeInteger(file.size) && file.size >= 0 ? file.size : 0
    })),
    reason_codes: [],
    retry_allowed: false,
    created_at: new Date().toISOString()
  };
  blocks.set(block.block_id, block); //Se guarda en estilo map para que lo encuentr api/v1/blocks y blocks:/blockid.
  return { block: structuredClone(block) }; //Regresa una copia para no modificar el real.
}

function listBlocks() {
  return [...blocks.values()].map(block => structuredClone(block));
}

function getBlock(blockId) {
  const block = blocks.get(blockId);
  return block ? structuredClone(block) : null;
}

function clearBlocks() {
  blocks.clear();
  nextBlockId = 1;
}

module.exports = {
  EXPECTED_REPLAYS,
  validateFiles,
  createBlock,
  listBlocks,
  getBlock,
  clearBlocks
};
