-- Datos sintéticos: comprueba el RPC y JSONB reales, sin conservar filas.
BEGIN;
DO $check$
DECLARE
  owner_id uuid;
  saved_id bigint;
  entries jsonb;
  expected jsonb;
  snapshots integer;
BEGIN
  SELECT id_usuario INTO owner_id FROM public.usuarios ORDER BY creado_en LIMIT 1;
  IF owner_id IS NULL THEN RAISE EXCEPTION 'Se requiere un usuario de prueba existente'; END IF;
  expected := jsonb_build_object('version','ballchasing.player.v1','source','ballchasing',
    'replay_id','sql-regression-1','values',jsonb_build_object(
      'boost_zero_pct',jsonb_build_object('value',0,'unit','percent','scope','player',
        'source_field','percent_zero_boost','missing_reason',NULL),
      'play_duration_s',jsonb_build_object('value',300.125,'unit','seconds','scope','match',
        'source_field','play_duration','missing_reason',NULL)));
  SELECT jsonb_agg(jsonb_build_object('posicion',i,'nombre_archivo','sql-check-'||i||'.replay',
    'ballchasing_id','sql-regression-'||i,'estado','ok','origen_carga','propia',
    'visibilidad','private','acceso_verificado',true,'grupo_verificado',false,'limpieza_estado','pendiente',
    'archivo',jsonb_build_object('hash_archivo',md5('arc-check-'||txid_current()||'-'||i)||md5('arc-check2-'||txid_current()||'-'||i),
      'tamano_bytes',1,'modalidad','2v2','tipo_partida','ranked','fecha_partida','2026-11-18T12:00:00Z'),
    'jugador',jsonb_build_object('plataforma','steam','cuenta_jugador','SQL_REGRESSION_ONLY'),
    'metricas',jsonb_build_object('goles',1,'tiros',4,'boost_cero_s',0,
      'mediciones_proveedor',jsonb_set(expected,'{replay_id}',to_jsonb('sql-regression-'||i)))) ORDER BY i)
  INTO entries FROM generate_series(1,5) i;
  saved_id := public.a15_guardar_bloque(owner_id,jsonb_build_object(
    'modalidad','2v2','tipo_partida','ranked','estado','completo','replays',entries));
  SELECT count(*) INTO snapshots FROM public.replays r
    JOIN public.metricas_replay m USING(id_jugador_replay)
    WHERE r.id_bloque=saved_id AND m.mediciones_proveedor->>'replay_id'=r.ballchasing_id
      AND (m.mediciones_proveedor#>>'{values,boost_zero_pct,value}')::numeric=0
      AND (m.mediciones_proveedor#>>'{values,play_duration_s,value}')::numeric=300.125;
  IF snapshots<>5 THEN RAISE EXCEPTION 'No se conservaron las cinco medidas originales'; END IF;
  BEGIN
    UPDATE public.metricas_replay SET mediciones_proveedor='{}'::jsonb
      WHERE id_jugador_replay=(SELECT id_jugador_replay FROM public.replays WHERE id_bloque=saved_id LIMIT 1);
    RAISE EXCEPTION 'Se aceptó una instantánea sin fuente ni versión';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END;
$check$;
SET CONSTRAINTS ALL IMMEDIATE;
SELECT 'RPC: 5 instantáneas; ceros y fracciones conservados; JSON incompleto rechazado' AS result;
ROLLBACK;
