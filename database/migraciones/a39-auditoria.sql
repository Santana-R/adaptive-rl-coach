-- A39 · Consultas de integridad de metas, planes, sesiones, catálogo y rangos.
-- Se ejecuta UNA vez en el SQL Editor de Supabase. Se puede volver a ejecutar.
--
-- a39_auditar_integridad() solo lee. Devuelve una fila por consulta con el número de filas
-- que rompen la regla; en una base sana todas valen 0. La usan scripts/auditoria-a39.cjs y
-- scripts/seed-demo.cjs. También se puede ejecutar a mano:
--   SELECT * FROM public.a39_auditar_integridad();
--
-- Permisos: igual que el resto de la base, solo service_role.

CREATE OR REPLACE FUNCTION public.a39_auditar_integridad()
RETURNS TABLE (orden integer, consulta text, filas_invalidas bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  -- Metas
  SELECT 1, 'objetivos_sin_version'::text, count(*)
  FROM public.objetivos AS o
  WHERE NOT EXISTS (SELECT 1 FROM public.objetivo_versiones AS v WHERE v.id_objetivo = o.id_objetivo)
  UNION ALL
  SELECT 2, 'objetivo_versiones_no_consecutivas', count(*)
  FROM (SELECT v.id_objetivo FROM public.objetivo_versiones AS v
        GROUP BY v.id_objetivo HAVING min(v.version) <> 1 OR max(v.version) <> count(*)) AS x
  UNION ALL
  SELECT 3, 'objetivo_versiones_sin_activar', count(*)
  FROM public.objetivo_versiones AS v WHERE v.activada_en IS NULL
  UNION ALL
  SELECT 4, 'objetivos_activos_duplicados', count(*)
  FROM (SELECT 1 FROM public.objetivos AS o WHERE o.estado = 'activo'
        GROUP BY o.id_usuario, o.modalidad, o.tipo HAVING count(*) > 1) AS x
  UNION ALL
  SELECT 5, 'objetivos_archivo_incoherente', count(*)
  FROM public.objetivos AS o
  WHERE (o.estado = 'archivado') <> (o.archivado_en IS NOT NULL)
  -- Planes
  UNION ALL
  SELECT 6, 'plan_objetivo_de_otro_propietario', count(*)
  FROM public.plan_objetivo AS po
  JOIN public.objetivo_versiones AS v ON v.id_objetivo_version = po.id_objetivo_version
  JOIN public.objetivos AS o ON o.id_objetivo = v.id_objetivo
  JOIN public.planes AS p ON p.id_plan = po.id_plan
  JOIN public.analisis AS a ON a.id_analisis = p.id_analisis
  JOIN public.bloques AS b ON b.id_bloque = a.id_bloque
  WHERE o.id_usuario <> b.id_usuario
  UNION ALL
  SELECT 7, 'planes_versiones_no_consecutivas', count(*)
  FROM (SELECT p.id_analisis FROM public.planes AS p
        GROUP BY p.id_analisis HAVING min(p.version) <> 1 OR max(p.version) <> count(*)) AS x
  UNION ALL
  SELECT 8, 'plan_ejercicio_orden_repetido', count(*)
  FROM (SELECT 1 FROM public.plan_ejercicio AS pe
        GROUP BY pe.id_plan, pe.orden HAVING count(*) > 1) AS x
  UNION ALL
  SELECT 9, 'analisis_base_de_otro_propietario', count(*)
  FROM public.analisis AS a
  JOIN public.bloques AS b ON b.id_bloque = a.id_bloque
  JOIN public.bloques AS base ON base.id_bloque = a.id_bloque_base
  WHERE base.id_usuario <> b.id_usuario
  -- Sesiones
  UNION ALL
  SELECT 10, 'sesiones_sin_version', count(*)
  FROM public.sesiones AS s
  WHERE NOT EXISTS (SELECT 1 FROM public.sesion_versiones AS v WHERE v.id_sesion = s.id_sesion)
  UNION ALL
  SELECT 11, 'sesion_versiones_no_consecutivas', count(*)
  FROM (SELECT v.id_sesion FROM public.sesion_versiones AS v
        GROUP BY v.id_sesion HAVING min(v.version) <> 1 OR max(v.version) <> count(*)) AS x
  UNION ALL
  SELECT 12, 'sesion_versiones_sin_ejercicio', count(*)
  FROM public.sesion_versiones AS v
  WHERE NOT EXISTS (SELECT 1 FROM public.sesion_ejercicio AS se WHERE se.id_sesion_version = v.id_sesion_version)
  UNION ALL
  SELECT 13, 'sesion_ejercicio_de_otro_plan', count(*)
  FROM public.sesion_ejercicio AS se
  JOIN public.sesion_versiones AS v ON v.id_sesion_version = se.id_sesion_version
  JOIN public.sesiones AS s ON s.id_sesion = v.id_sesion
  JOIN public.plan_ejercicio AS pe ON pe.id_plan_ejercicio = se.id_plan_ejercicio
  WHERE pe.id_plan <> s.id_plan
  UNION ALL
  SELECT 14, 'sesiones_baja_incoherente', count(*)
  FROM public.sesiones AS s
  WHERE (s.eliminado_en IS NULL) <> (s.motivo_exclusion IS NULL)
  -- Catálogo
  UNION ALL
  SELECT 15, 'ejercicios_sin_version', count(*)
  FROM public.ejercicios AS e
  WHERE NOT EXISTS (SELECT 1 FROM public.ejercicio_versiones AS v WHERE v.id_ejercicio = e.id_ejercicio)
  UNION ALL
  SELECT 16, 'ejercicio_versiones_no_consecutivas', count(*)
  FROM (SELECT v.id_ejercicio FROM public.ejercicio_versiones AS v
        GROUP BY v.id_ejercicio HAVING min(v.version) <> 1 OR max(v.version) <> count(*)) AS x
  UNION ALL
  SELECT 17, 'ejercicios_activos_eliminados', count(*)
  FROM public.ejercicios AS e WHERE e.activo AND e.eliminado_en IS NOT NULL
  -- Rango
  UNION ALL
  SELECT 18, 'rangos_fuente_no_declarada', count(*)
  FROM public.rangos AS r WHERE r.fuente <> 'self_reported'
  ORDER BY 1;
$$;

REVOKE ALL ON FUNCTION public.a39_auditar_integridad() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.a39_auditar_integridad() TO service_role;
