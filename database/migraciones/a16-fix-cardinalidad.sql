-- A16 · Corrección del bloqueo de cardinalidad del esquema de Fase 2.
-- Se ejecuta UNA vez en el SQL Editor de Supabase. Se puede volver a ejecutar.
--
-- Problema: arc_private.bloquear_padre_cardinalidad (database/esquema-fase2.sql) bloqueaba la fila
-- padre con "UPDATE padre SET id = id". Los id de objetivos, planes y sesiones son columnas
-- GENERATED ALWAYS AS IDENTITY y Postgres rechaza asignarlas, incluso con el mismo valor:
--   428C9 column "id_objetivo" can only be updated to DEFAULT
-- Resultado: ningún INSERT/DELETE en objetivo_versiones, plan_objetivo ni sesion_versiones
-- funcionaba (A16 metas, A24 planes con metas, A21 sesiones).
--
-- Corrección: el mismo bloqueo de fila con SELECT … FOR UPDATE, que no modifica la fila.
-- Las verificaciones diferidas (arc_private.verificar_cardinalidad) no cambian: siguen
-- comprobando al confirmar la transacción que cada padre tenga el número de hijos permitido.
-- Los triggers existentes no se tocan: llaman a esta función por nombre.

CREATE OR REPLACE FUNCTION arc_private.bloquear_padre_cardinalidad()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    ids bigint[] := ARRAY[]::bigint[];
    id_actual bigint;
BEGIN
    IF TG_OP <> 'INSERT' THEN
        ids := array_append(ids, (to_jsonb(OLD) ->> TG_ARGV[2])::bigint);
    END IF;
    IF TG_OP <> 'DELETE' THEN
        ids := array_append(ids, (to_jsonb(NEW) ->> TG_ARGV[2])::bigint);
    END IF;
    FOR id_actual IN SELECT DISTINCT x FROM unnest(ids) AS u(x) WHERE x IS NOT NULL ORDER BY x
    LOOP
        -- Antes: UPDATE public.<padre> SET <id> = <id> WHERE <id> = $1 (falla con identidad GENERATED ALWAYS).
        EXECUTE format('SELECT 1 FROM public.%I WHERE %I = $1 FOR UPDATE',
            TG_ARGV[0], TG_ARGV[1]) USING id_actual;
    END LOOP;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$function$;

-- Comprobación (ejecutar aparte): debe mostrar "FOR UPDATE" y no "UPDATE public".
--   SELECT pg_get_functiondef('arc_private.bloquear_padre_cardinalidad'::regproc);
