const { seedPlan } = require('../../src/domain/catalog');
const content = require('../../planning/catalogo-ejercicios.v1.json');
const verification = require('../../planning/catalogo-verificacion.v1.json');
const { A, B } = require('./analysis-server.cjs');

// Filas SQL sintéticas; el recorrido probado usa los repositorios reales A15/A23.
function blockRow(id = '11', owner = A, { date = '2026-11-14', mode = '2v2', goals = 6, platform = 'steam' } = {}) {
  return { id_bloque: id, id_usuario: owner, modalidad: mode, tipo_partida: 'ranked', estado: 'completo',
    creado_en: '2026-11-16T10:00:00Z', completado_en: '2026-11-16T11:00:00Z',
    metricas_bloque: { version_calculo: 'old', goles_total: 999, tiros_total: 999, tiempo_jugado_s: 999 },
    replays: Array.from({ length: 5 }, (_, i) => ({ posicion: i + 1, nombre_archivo: `test-${i}.replay`,
      ballchasing_id: `bc-${id}-${i}`, estado: 'ok', origen_carga: 'propia', visibilidad: 'private',
      acceso_verificado: true, grupo_verificado: false, limpieza_estado: 'pendiente',
      jugadores_replay: { plataforma: platform, cuenta_jugador: owner === A ? 'TEST_PLAYER_A' : 'TEST_PLAYER_B', tiempo_jugado_s: 150,
        archivos_replay: { hash_archivo: (Number(id) * 5 + i).toString(16).padStart(64, '0'), tamano_bytes: 1000,
          modalidad: mode, tipo_partida: 'ranked', fecha_partida: `${date}T10:0${i}:00Z`, duracion_s: 300 },
        metricas_replay: { goles: i === 0 ? goals - 4 : 1, tiros: 4, asistencias: 0, salvadas: 0 },
      } })),
  };
}

function catalogRows() {
  return seedPlan(content, verification).map((item, i) => ({ id_ejercicio: String(i + 1), activo: item.ejercicios.activo, eliminado_en: null,
    ejercicio_versiones: [{ ...item.ejercicio_versiones, id_ejercicio_version: String(100 + i),
      ejercicio_plataforma: item.ejercicio_plataforma.map(plataforma => ({ plataforma })) }] }));
}

function storedDatabase() {
  const state = { rows: [blockRow('10', A, { date: '2026-11-10', goals: 5 }), blockRow(), blockRow('20', B)],
    catalog: catalogRows(), goals: [], calls: [], fail: null,
    profiles: new Map([A, B].map(id => [id, { id_usuario: id, gamertag: 'Prueba sintética', plataforma: 'steam',
      cuenta_juego_id: id === A ? 'TEST_PLAYER_A' : 'TEST_PLAYER_B', modalidad_principal: '2v2',
      minutos_sesion: 20, dias_semana: 3, zona_horaria: 'America/Monterrey' }])) };
  const tokens = { 'token-a': A, 'token-b': B, 'token-suspended': 'suspended', 'token-admin': 'admin' };
  return { state,
    auth: { getUser: async token => ({ data: { user: tokens[token] ? { id: tokens[token] } : null }, error: null }) },
    from(table) {
      const query = { table, filters: {} }; state.calls.push(query);
      function result() {
        if (state.fail === table) return { data: null, error: { code: 'XX', message: 'private database error' } };
        const uid = query.filters.id_usuario;
        let data;
        if (table === 'usuarios') data = { id_usuario: uid, rol: uid === 'admin' ? 'administrador' : 'jugador', estado: uid === 'suspended' ? 'suspendido' : 'activo' };
        else if (table === 'perfiles') data = state.profiles.get(uid) ?? null;
        else if (table === 'bloques') {
          data = state.rows.filter(row => row.id_usuario === uid && (!query.filters.id_bloque || row.id_bloque === query.filters.id_bloque));
          if (query.single) data = data[0] ?? null;
        } else if (table === 'ejercicios') data = state.catalog.filter(row => row.eliminado_en == null && (query.filters.activo !== true || row.activo));
        else if (table === 'objetivos') data = state.goals.filter(row => row.id_usuario === uid && query.filters.id_objetivo.includes(String(row.id_objetivo)));
        else throw new Error('Unexpected table ' + table);
        return { data: structuredClone(data), error: null };
      }
      return {
        select(columns) { query.columns = columns; return this; }, eq(key, value) { query.filters[key] = value; return this; },
        is(key, value) { query.filters[key] = value; return this; }, in(key, value) { query.filters[key] = value; return this; },
        order() { return this; }, maybeSingle() { query.single = true; return Promise.resolve(result()); },
        then(resolve, reject) { return Promise.resolve().then(result).then(resolve, reject); },
      };
    },
  };
}

module.exports = { storedDatabase, blockRow, catalogRows, A, B };
