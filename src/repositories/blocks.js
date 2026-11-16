'use strict';

const { ApiError } = require('../middleware/auth');
const { toApiError, requireClient } = require('./errors');

// Mapeo SQL ↔ API de bloques, replays y métricas. Ver docs/a15-persistencia.md.
// Todas las funciones reciben el userId de la sesión verificada (req.user.id) y
// filtran por él: un bloque ajeno se comporta igual que uno inexistente (null → 404).

const MAX_REPLAYS = 5;

// Estado del bloque: bloques.estado (CHECK ck_bloques_estado) ↔ contrato de la API.
const STATUS_TO_API = {
  borrador: 'pending',
  procesando: 'processing',
  espera_servicio: 'failed', // fallo recuperable del servicio externo: permite reintento
  requiere_correccion: 'invalid', // hay que corregir archivos o contexto
  completo: 'ready',
};
const STATUS_TO_SQL = Object.fromEntries(Object.entries(STATUS_TO_API).map(([sql, api]) => [api, sql]));

// replays.origen_carga (CHECK ck_replays_origen) ↔ API.
const ORIGIN_TO_API = { propia: 'own', reutilizada: 'reused' };
const ORIGIN_TO_SQL = { own: 'propia', reused: 'reutilizada' };

// [columna SQL, clave API]
const FILE_FIELDS = [
  ['hash_archivo', 'hash'],
  ['tamano_bytes', 'size_bytes'],
  ['modalidad', 'mode'],
  ['tipo_partida', 'match_type'],
  ['fecha_partida', 'played_at'],
  ['duracion_s', 'duration_s'],
];
const PLAYER_FIELDS = [
  ['plataforma', 'platform'],
  ['cuenta_jugador', 'player_id'],
  ['tiempo_jugado_s', 'time_played_s'],
];
const REPLAY_METRIC_FIELDS = [
  ['tiros', 'shots'],
  ['goles', 'goals'],
  ['asistencias', 'assists'],
  ['salvadas', 'saves'],
  ['puntos', 'score'],
  ['boost_cero_s', 'boost_zero_s'],
  ['boost_bajo_s', 'boost_low_s'],
  ['pads_pequenos', 'small_pads'],
  ['velocidad_media', 'avg_speed'],
  ['distancia_companeros', 'teammate_distance'],
  ['zona_defensiva_s', 'defensive_zone_s'],
];
const BLOCK_METRIC_FIELDS = [
  ['version_calculo', 'metrics_version'],
  ['tiempo_jugado_s', 'play_duration_s'],
  ['tiros_total', 'shots'],
  ['goles_total', 'goals'],
  ['boost_cero_s', 'boost_zero_s'],
  ['boost_bajo_s', 'boost_low_s'],
  ['pads_pequenos_total', 'small_pads'],
  ['velocidad_media', 'avg_speed'],
  ['distancia_companeros', 'teammate_distance'],
  ['zona_defensiva_s', 'defensive_zone_s'],
];

const cols = fields => fields.map(([col]) => col).join(', ');
const BLOCK_SELECT = [
  'id_bloque, modalidad, tipo_partida, ballchasing_grupo_id, estado, creado_en, completado_en',
  `metricas_bloque(${cols(BLOCK_METRIC_FIELDS)})`,
  'replays(posicion, nombre_archivo, ballchasing_id, estado, error, origen_carga, visibilidad, ' +
    'acceso_verificado, grupo_verificado, limpieza_estado, ' +
    `jugadores_replay(${cols(PLAYER_FIELDS)}, archivos_replay(${cols(FILE_FIELDS)}), ` +
    `metricas_replay(${cols(REPLAY_METRIC_FIELDS)})))`,
].join(', ');

// --- utilidades de mapeo ---------------------------------------------------

// undefined → null: un dato ausente se guarda y se devuelve como null, nunca como 0.
function pick(source, fields, from, to) {
  const out = {};
  for (const field of fields) out[field[to]] = source?.[field[from]] ?? null;
  return out;
}
const toApi = (row, fields) => pick(row, fields, 0, 1);
const toSql = (obj, fields) => pick(obj, fields, 1, 0);

// PostgREST devuelve las relaciones 1:1 como objeto (o como arreglo en versiones antiguas).
const one = value => (Array.isArray(value) ? value[0] ?? null : value ?? null);

function parseBlockId(blockId) {
  const text = String(blockId ?? '');
  return /^[1-9]\d{0,17}$/.test(text) ? text : null;
}

function statusToSql(status) {
  const sql = STATUS_TO_SQL[status];
  if (!sql) throw new ApiError(422, 'INPUT_INVALID', `Estado de bloque no válido: ${status}.`);
  return sql;
}

// --- SQL → API --------------------------------------------------------------

function toReplay(row) {
  const player = one(row.jugadores_replay);
  const metrics = one(player?.metricas_replay);
  return {
    position: row.posicion,
    file_name: row.nombre_archivo,
    ballchasing_id: row.ballchasing_id ?? null,
    status: row.estado,
    error: row.error ?? null,
    upload_origin: ORIGIN_TO_API[row.origen_carga] ?? null,
    visibility: row.visibilidad ?? null,
    access_verified: row.acceso_verificado,
    group_verified: row.grupo_verificado,
    cleanup_status: row.limpieza_estado,
    file: toApi(one(player?.archivos_replay), FILE_FIELDS),
    player: toApi(player, PLAYER_FIELDS),
    metrics: metrics ? toApi(metrics, REPLAY_METRIC_FIELDS) : null,
  };
}

function toBlock(row) {
  if (!row) return null;
  const replays = (row.replays ?? []).map(toReplay).sort((a, b) => a.position - b.position);
  const metrics = one(row.metricas_bloque);
  return {
    block_id: String(row.id_bloque),
    status: STATUS_TO_API[row.estado] ?? null,
    mode: row.modalidad,
    match_type: row.tipo_partida,
    ballchasing_group_id: row.ballchasing_grupo_id ?? null,
    expected_replays: MAX_REPLAYS,
    ready_replays: replays.filter(r => r.status === 'ok').length,
    created_at: row.creado_en,
    completed_at: row.completado_en ?? null,
    replays,
    metrics: metrics ? toApi(metrics, BLOCK_METRIC_FIELDS) : null,
  };
}

function toBlockSummary(row) {
  const replays = row.replays ?? [];
  return {
    block_id: String(row.id_bloque),
    status: STATUS_TO_API[row.estado] ?? null,
    mode: row.modalidad,
    match_type: row.tipo_partida,
    expected_replays: MAX_REPLAYS,
    ready_replays: replays.filter(r => r.estado === 'ok').length,
    created_at: row.creado_en,
    completed_at: row.completado_en ?? null,
  };
}

// --- API → SQL (argumento de a15_guardar_bloque) ----------------------------

function toBlockPayload(block) {
  const replays = block?.replays ?? [];
  if (!Array.isArray(replays) || replays.length > MAX_REPLAYS) {
    throw new ApiError(400, 'REPLAY_COUNT_INVALID', `Un bloque admite como máximo ${MAX_REPLAYS} replays.`);
  }
  return {
    modalidad: block.mode ?? null,
    tipo_partida: block.match_type ?? null,
    ballchasing_grupo_id: block.ballchasing_group_id ?? null,
    estado: statusToSql(block.status ?? 'pending'),
    replays: replays.map(replay => ({
      posicion: replay.position ?? null,
      nombre_archivo: replay.file_name ?? null,
      ballchasing_id: replay.ballchasing_id ?? null,
      estado: replay.status ?? 'pending',
      error: replay.error ?? null,
      origen_carga: ORIGIN_TO_SQL[replay.upload_origin ?? 'own'] ?? null,
      visibilidad: replay.visibility ?? null,
      acceso_verificado: replay.access_verified ?? false,
      grupo_verificado: replay.group_verified ?? false,
      limpieza_estado: replay.cleanup_status ?? 'pendiente',
      archivo: toSql(replay.file, FILE_FIELDS),
      jugador: toSql(replay.player, PLAYER_FIELDS),
      metricas: replay.metrics ? toSql(replay.metrics, REPLAY_METRIC_FIELDS) : null,
    })),
    metricas: block.metrics ? toSql(block.metrics, BLOCK_METRIC_FIELDS) : null,
  };
}

/**
 * Convierte la salida de calculateBlockMetrics (src/domain/metrics.js) en métricas
 * de bloque para guardar. Los valores no calculados quedan null.
 */
function metricsFromCalculation(result) {
  const v = result?.values ?? {};
  return {
    metrics_version: result?.metrics_version ?? null,
    play_duration_s: v.play_duration_s?.value ?? null,
    shots: v.shots?.value ?? null,
    goals: v.goals?.value ?? null,
    boost_zero_s: null,
    boost_low_s: null,
    small_pads: null,
    avg_speed: null,
    teammate_distance: null,
    defensive_zone_s: null,
  };
}

// --- consultas ---------------------------------------------------------------

/** Guarda bloque + replays (+ métricas opcionales) en una transacción. Devuelve el bloque guardado. */
async function createBlock(supabase, userId, block) {
  requireClient(supabase);
  const payload = toBlockPayload(block);
  const { data: blockId, error } = await supabase.rpc('a15_guardar_bloque', {
    p_id_usuario: userId, // siempre el de la sesión; block.user_id se ignora
    p_bloque: payload,
  });
  if (error) throw toApiError(error, 'No se pudo guardar el bloque.');
  return getBlock(supabase, userId, blockId);
}

async function getBlock(supabase, userId, blockId) {
  requireClient(supabase);
  const id = parseBlockId(blockId);
  if (!id) return null;
  const { data, error } = await supabase
    .from('bloques')
    .select(BLOCK_SELECT)
    .eq('id_bloque', id)
    .eq('id_usuario', userId)
    .maybeSingle();
  if (error) throw toApiError(error, 'No se pudo consultar el bloque.');
  return toBlock(data);
}

async function listBlocks(supabase, userId) {
  requireClient(supabase);
  const { data, error } = await supabase
    .from('bloques')
    .select('id_bloque, modalidad, tipo_partida, estado, creado_en, completado_en, replays(estado)')
    .eq('id_usuario', userId)
    .order('creado_en', { ascending: false });
  if (error) throw toApiError(error, 'No se pudieron consultar los bloques.');
  return (data ?? []).map(toBlockSummary);
}

async function assertBlockOwner(supabase, userId, blockId) {
  const id = parseBlockId(blockId);
  const { data, error } = id
    ? await supabase.from('bloques').select('id_bloque').eq('id_bloque', id).eq('id_usuario', userId).maybeSingle()
    : { data: null, error: null };
  if (error) throw toApiError(error, 'No se pudo consultar el bloque.');
  if (!data) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'El bloque no existe.');
  return id;
}

/** Cambia el estado. 'ready' fija completado_en; cualquier otro estado lo deja en null (ck_bloques_cierre). */
async function updateBlockStatus(supabase, userId, blockId, status) {
  requireClient(supabase);
  const estado = statusToSql(status);
  const id = parseBlockId(blockId);
  if (!id) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'El bloque no existe.');
  const { data, error } = await supabase
    .from('bloques')
    .update({ estado, completado_en: estado === 'completo' ? new Date().toISOString() : null })
    .eq('id_bloque', id)
    .eq('id_usuario', userId)
    .select('id_bloque')
    .maybeSingle();
  if (error) throw toApiError(error, 'No se pudo actualizar el bloque.');
  if (!data) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'El bloque no existe.');
  return getBlock(supabase, userId, id);
}

/** Guarda (o reemplaza) las métricas del bloque: una fila por bloque. */
async function saveBlockMetrics(supabase, userId, blockId, metrics) {
  requireClient(supabase);
  const id = await assertBlockOwner(supabase, userId, blockId);
  const row = { id_bloque: id, ...toSql(metrics, BLOCK_METRIC_FIELDS) };
  const { error } = await supabase.from('metricas_bloque').upsert(row, { onConflict: 'id_bloque' });
  if (error) throw toApiError(error, 'No se pudieron guardar las métricas del bloque.');
  return getBlock(supabase, userId, id);
}

/** Guarda (o reemplaza) las métricas del replay en la posición indicada del bloque. */
async function saveReplayMetrics(supabase, userId, blockId, position, metrics) {
  requireClient(supabase);
  const id = await assertBlockOwner(supabase, userId, blockId);
  const { data: replay, error: findError } = await supabase
    .from('replays')
    .select('id_jugador_replay')
    .eq('id_bloque', id)
    .eq('posicion', position)
    .maybeSingle();
  if (findError) throw toApiError(findError, 'No se pudo consultar el replay.');
  if (!replay) throw new ApiError(404, 'RESOURCE_NOT_FOUND', 'El replay no existe en el bloque.');
  const row = { id_jugador_replay: replay.id_jugador_replay, ...toSql(metrics, REPLAY_METRIC_FIELDS) };
  const { error } = await supabase.from('metricas_replay').upsert(row, { onConflict: 'id_jugador_replay' });
  if (error) throw toApiError(error, 'No se pudieron guardar las métricas del replay.');
  return getBlock(supabase, userId, id);
}

module.exports = {
  createBlock,
  getBlock,
  listBlocks,
  updateBlockStatus,
  saveBlockMetrics,
  saveReplayMetrics,
  metricsFromCalculation,
  toBlock,
  toBlockPayload,
  STATUS_TO_API,
  STATUS_TO_SQL,
  MAX_REPLAYS,
};
