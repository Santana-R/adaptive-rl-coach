-- A15 · Consultas de integridad (solo lectura).
-- Ejecutar en el SQL Editor de Supabase después de guardar bloques.
-- Cada consulta devuelve 0 filas (o 0) si los datos están bien.

-- 1) Bloques de usuarios que no existen en usuarios (propietario roto).
SELECT b.id_bloque
FROM bloques b LEFT JOIN usuarios u ON u.id_usuario = b.id_usuario
WHERE u.id_usuario IS NULL;

-- 2) Bloques 'completo' que no tienen exactamente 5 replays en estado 'ok'.
SELECT b.id_bloque, count(r.id_replay) FILTER (WHERE r.estado = 'ok') AS replays_ok
FROM bloques b LEFT JOIN replays r ON r.id_bloque = b.id_bloque
WHERE b.estado = 'completo'
GROUP BY b.id_bloque
HAVING count(r.id_replay) FILTER (WHERE r.estado = 'ok') <> 5;

-- 3) Bloques con más de 5 replays (no debería ser posible por ck_replays_posicion + uq_replays_1).
SELECT id_bloque, count(*) FROM replays GROUP BY id_bloque HAVING count(*) > 5;

-- 4) Archivos duplicados por hash (no debería ser posible por uq_archivos_replay_1).
SELECT lower(hash_archivo) AS hash, count(*) FROM archivos_replay
GROUP BY lower(hash_archivo) HAVING count(*) > 1;

-- 5) Archivos sin ningún jugador ni replay que los use (huérfanos).
SELECT a.id_archivo
FROM archivos_replay a LEFT JOIN jugadores_replay j ON j.id_archivo = a.id_archivo
WHERE j.id_jugador_replay IS NULL;

-- 6) Métricas de bloque que no cuadran con la suma de sus replays (tiros/goles).
--    Una diferencia indica que se guardaron métricas de otro cálculo o de otros replays.
--    Si algún replay tiene null, la suma no es comparable y se omite.
SELECT mb.id_bloque, mb.tiros_total, sum(mr.tiros) AS suma_tiros, mb.goles_total, sum(mr.goles) AS suma_goles
FROM metricas_bloque mb
JOIN replays r ON r.id_bloque = mb.id_bloque
JOIN metricas_replay mr ON mr.id_jugador_replay = r.id_jugador_replay
GROUP BY mb.id_bloque, mb.tiros_total, mb.goles_total
HAVING count(mr.tiros) = count(*) AND count(mr.goles) = count(*)
   AND (mb.tiros_total IS DISTINCT FROM sum(mr.tiros) OR mb.goles_total IS DISTINCT FROM sum(mr.goles));

-- 7) Estado y fecha de cierre incoherentes (no debería ser posible por ck_bloques_cierre).
SELECT id_bloque, estado, completado_en FROM bloques
WHERE (estado = 'completo') <> (completado_en IS NOT NULL);

-- 8) Resumen para la evidencia del PR (sin correos ni ids de usuario).
SELECT
  (SELECT count(*) FROM perfiles)         AS perfiles,
  (SELECT count(*) FROM bloques)          AS bloques,
  (SELECT count(*) FROM replays)          AS replays,
  (SELECT count(*) FROM archivos_replay)  AS archivos,
  (SELECT count(*) FROM metricas_replay)  AS metricas_replay,
  (SELECT count(*) FROM metricas_bloque)  AS metricas_bloque;
