BEGIN;

CREATE OR REPLACE FUNCTION public.a29_cambiar_estado_usuario(
  p_admin_id uuid,
  p_user_id uuid,
  p_estado text
)
RETURNS TABLE (id_usuario uuid, nombre varchar, rol varchar, estado varchar)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_usuario public.usuarios%ROWTYPE;
BEGIN
  IF p_estado IS NULL OR p_estado NOT IN ('activo', 'suspendido') THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'Estado inválido';
  END IF;

  -- Bloquea ambas filas en un orden fijo para cambios simultáneos.
  PERFORM 1
  FROM public.usuarios AS u
  WHERE u.id_usuario IN (p_admin_id, p_user_id)
  ORDER BY u.id_usuario
  FOR UPDATE;

  IF NOT EXISTS (
    SELECT 1
    FROM public.usuarios AS u
    WHERE u.id_usuario = p_admin_id
      AND u.rol = 'administrador'
      AND u.estado = 'activo'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'Se requiere un administrador activo';
  END IF;

  SELECT u.* INTO v_usuario
  FROM public.usuarios AS u
  WHERE u.id_usuario = p_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_usuario.estado <> p_estado THEN
    UPDATE public.usuarios AS u
    SET estado = p_estado
    WHERE u.id_usuario = p_user_id
    RETURNING u.* INTO v_usuario;

    INSERT INTO public.cambios_estado_usuario (
      id_usuario, id_administrador, estado_nuevo, motivo, fecha
    )
    VALUES (
      p_user_id, p_admin_id, p_estado, 'Cambio desde la API de administración', now()
    );
  END IF;

  RETURN QUERY
    SELECT v_usuario.id_usuario, v_usuario.nombre, v_usuario.rol, v_usuario.estado;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.a29_cambiar_estado_usuario(uuid, uuid, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.a29_cambiar_estado_usuario(uuid, uuid, text)
TO service_role;

COMMIT;