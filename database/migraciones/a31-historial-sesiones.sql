-- A31 · Historial de sesiones que no se reescribe.
-- Se ejecuta UNA vez en el SQL Editor de Supabase. Se puede volver a ejecutar.
-- Requiere a21-sesiones.sql.
--
-- A21 corrige una sesión insertando una versión nueva en sesion_versiones (con su fila en
-- sesion_ejercicio). Esta migración lo vuelve una regla de la base:
--   1. Trigger que impide UPDATE en sesion_versiones y sesion_ejercicio (SQLSTATE A3102).
--      Una corrección siempre es una versión nueva; las anteriores quedan como se guardaron.
--      El borrado lógico de A21 no se afecta: escribe en sesiones, no en estas tablas.
--   2. a31_borrar_sesiones_de_planes: borra por completo las sesiones de versiones de plan
--      propias. La usan las pruebas reales para limpiar sus datos: una sesión exige al menos
--      una versión al confirmar la transacción, así que no se puede borrar por partes desde
--      la API REST. Express no la llama.
--
-- Permisos: igual que el resto de la base, solo service_role.

BEGIN;

CREATE OR REPLACE FUNCTION public.a31_sesiones_inmutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'El historial de sesiones no se modifica; la corrección crea una versión nueva'
    USING ERRCODE = 'A3102';
END;
$$;

DROP TRIGGER IF EXISTS a31_inmutable ON public.sesion_versiones;
CREATE TRIGGER a31_inmutable
  BEFORE UPDATE ON public.sesion_versiones
  FOR EACH ROW EXECUTE FUNCTION public.a31_sesiones_inmutable();

DROP TRIGGER IF EXISTS a31_inmutable ON public.sesion_ejercicio;
CREATE TRIGGER a31_inmutable
  BEFORE UPDATE ON public.sesion_ejercicio
  FOR EACH ROW EXECUTE FUNCTION public.a31_sesiones_inmutable();

CREATE OR REPLACE FUNCTION public.a31_borrar_sesiones_de_planes(
  p_id_usuario uuid,
  p_ids_plan bigint[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_sesiones bigint[];
BEGIN
  SELECT COALESCE(array_agg(s.id_sesion), ARRAY[]::bigint[]) INTO v_sesiones
  FROM public.sesiones AS s
  JOIN public.planes AS p ON p.id_plan = s.id_plan
  JOIN public.analisis AS a ON a.id_analisis = p.id_analisis
  JOIN public.bloques AS b ON b.id_bloque = a.id_bloque
  WHERE s.id_plan = ANY (p_ids_plan) AND b.id_usuario = p_id_usuario;

  DELETE FROM public.sesion_ejercicio AS se
  USING public.sesion_versiones AS sv
  WHERE se.id_sesion_version = sv.id_sesion_version AND sv.id_sesion = ANY (v_sesiones);

  DELETE FROM public.sesion_versiones WHERE id_sesion = ANY (v_sesiones);
  DELETE FROM public.sesiones WHERE id_sesion = ANY (v_sesiones);

  RETURN COALESCE(array_length(v_sesiones, 1), 0);
END;
$$;

REVOKE ALL ON FUNCTION public.a31_sesiones_inmutable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.a31_borrar_sesiones_de_planes(uuid, bigint[])
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.a31_borrar_sesiones_de_planes(uuid, bigint[]) TO service_role;

COMMIT;
