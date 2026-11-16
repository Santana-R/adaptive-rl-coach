-- Solo desarrollo: bloque sintético sobre un perfil TEST existente, dentro de BEGIN/ROLLBACK.
-- No cambia el esquema, perfiles, catálogo ni planes. Las secuencias SQL pueden avanzar.
-- Guardar el objeto fixture de la respuesta como captura.json para prueba-a18-captura.cjs.
begin;
do $qa$
declare p public.perfiles%rowtype; payload jsonb;
begin
  select * into p from public.perfiles where cuenta_juego_id like 'TEST%' order by id_usuario limit 1;
  if not found then raise exception 'No hay perfil de desarrollo controlado'; end if;
  select jsonb_build_object('modalidad',p.modalidad_principal,'tipo_partida','ranked','estado','completo','replays',
    jsonb_agg(jsonb_build_object(
      'posicion',i,'nombre_archivo','a18-integration-20261116-q5-'||i||'.replay','estado','ok',
      'origen_carga','propia','visibilidad','private','acceso_verificado',false,'grupo_verificado',false,'limpieza_estado','pendiente',
      'archivo',jsonb_build_object('hash_archivo',md5('a18-20261116-q5-'||i)||md5('a18-20261116-q5-'||i),'tamano_bytes',1000,'modalidad',p.modalidad_principal,'tipo_partida','ranked','fecha_partida','2026-11-15T10:0'||i||':00Z','duracion_s',300),
      'jugador',jsonb_build_object('plataforma',p.plataforma,'cuenta_jugador',p.cuenta_juego_id,'tiempo_jugado_s',150),
      'metricas',jsonb_build_object('goles',case when i=1 then 2 else 1 end,'tiros',4,'asistencias',0,'salvadas',0))
      order by i)) into payload from generate_series(1,5) i;
  perform public.a15_guardar_bloque(p.id_usuario,payload);
end $qa$;
select jsonb_build_object(
  'block',(select jsonb_build_object('id_bloque',b.id_bloque,'id_usuario',b.id_usuario,'modalidad',b.modalidad,'tipo_partida',b.tipo_partida,'estado',b.estado,'creado_en',b.creado_en,'completado_en',b.completado_en,'metricas_bloque',null,
    'replays',(select jsonb_agg(to_jsonb(r)||jsonb_build_object('jugadores_replay',to_jsonb(j)||jsonb_build_object('archivos_replay',to_jsonb(f),'metricas_replay',to_jsonb(m))) order by r.posicion)
    from public.replays r join public.jugadores_replay j using(id_jugador_replay) join public.archivos_replay f using(id_archivo) left join public.metricas_replay m using(id_jugador_replay) where r.id_bloque=b.id_bloque))
    from public.bloques b where exists(select 1 from public.replays r where r.id_bloque=b.id_bloque and r.nombre_archivo='a18-integration-20261116-q5-1.replay')),
  'profile',(select to_jsonb(p) from public.perfiles p where p.id_usuario=(select b.id_usuario from public.bloques b join public.replays r using(id_bloque) where r.nombre_archivo='a18-integration-20261116-q5-1.replay')),
  'catalog',(select jsonb_agg(to_jsonb(e)||jsonb_build_object('ejercicio_versiones',
    (select jsonb_agg(to_jsonb(v)||jsonb_build_object('ejercicio_plataforma',(select jsonb_agg(to_jsonb(ep)) from public.ejercicio_plataforma ep where ep.id_ejercicio_version=v.id_ejercicio_version)))
     from public.ejercicio_versiones v where v.id_ejercicio=e.id_ejercicio)))
     from public.ejercicios e where e.activo and e.eliminado_en is null)
) as fixture;
rollback;
