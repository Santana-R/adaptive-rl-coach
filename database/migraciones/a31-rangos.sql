-- A31 · Rango declarado con historial.
-- Se ejecuta UNA vez en el SQL Editor de Supabase. Se puede volver a ejecutar.
--
-- La tabla rangos ya existe (esquema Fase 2). Esta migración solo fija sus valores válidos
-- y la vuelve de solo inserción:
--   1. modalidad: 1v1, 2v2 o 3v3 (las mismas que bloques y objetivos).
--   2. rango: clave normalizada (bronze … supersonic_legend), la misma que usa el generador.
--   3. division: 1 a 4; Supersonic Legend no tiene división.
--   4. fuente: 'self_reported'. El rango es declarado por el jugador; no se infiere del MMR.
--   5. Trigger que impide UPDATE: una corrección es un registro nuevo con su fecha, así el
--      historial nunca se reescribe.
--   6. Índice para "último rango por modalidad".
--
-- Permisos: igual que el resto de la base, solo service_role (Express) escribe y lee.
-- Antes de ejecutarla, la tabla debe estar vacía o cumplir estos valores (en dev está vacía).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_rangos_modalidad_valor') THEN
    ALTER TABLE public.rangos ADD CONSTRAINT ck_rangos_modalidad_valor
      CHECK (modalidad IN ('1v1', '2v2', '3v3'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_rangos_rango_valor') THEN
    ALTER TABLE public.rangos ADD CONSTRAINT ck_rangos_rango_valor
      CHECK (rango IN ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'champion',
                       'grand_champion', 'supersonic_legend'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_rangos_division_valor') THEN
    ALTER TABLE public.rangos ADD CONSTRAINT ck_rangos_division_valor
      CHECK (division IS NULL OR (division BETWEEN 1 AND 4 AND rango <> 'supersonic_legend'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_rangos_fuente_valor') THEN
    ALTER TABLE public.rangos ADD CONSTRAINT ck_rangos_fuente_valor
      CHECK (fuente = 'self_reported');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_rangos_usuario_modalidad_fecha
  ON public.rangos (id_usuario, modalidad, fecha_registro DESC, id_rango DESC);

CREATE OR REPLACE FUNCTION public.a31_rangos_inmutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'El historial de rangos no se modifica; registra un rango nuevo'
    USING ERRCODE = 'A3101';
END;
$$;

DROP TRIGGER IF EXISTS a31_inmutable ON public.rangos;
CREATE TRIGGER a31_inmutable
  BEFORE UPDATE ON public.rangos
  FOR EACH ROW EXECUTE FUNCTION public.a31_rangos_inmutable();

REVOKE ALL ON FUNCTION public.a31_rangos_inmutable() FROM PUBLIC, anon, authenticated;
