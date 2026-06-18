-- ============================================================
-- Migration: Make Edwin Admin + Admin Role Management
-- Fecha: 2026-06-18
-- 
-- 1. Setea is_admin = true para ejuniorfloress@gmail.com
-- 2. Crea RPC admin_set_user_role (SECURITY DEFINER)
-- 3. Crea RPC admin_check_user (SECURITY DEFINER)
--    para verificar si el usuario actual es admin
-- ============================================================

-- 1. Hacer admin a Edwin Flores
UPDATE profiles
SET is_admin = true
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'ejuniorfloress@gmail.com'
);

-- 2. RPC: Setear/revocar rol de admin (solo para admins)
CREATE OR REPLACE FUNCTION admin_set_user_role(
  p_target_email TEXT,
  p_is_admin BOOLEAN
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_id UUID;
  v_result jsonb;
BEGIN
  -- Solo un admin puede llamar esto
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Solo administradores pueden cambiar roles'
      USING ERRCODE = '42501';
  END IF;

  -- Buscar el usuario target
  SELECT id INTO v_target_id
  FROM auth.users
  WHERE email = p_target_email;

  IF v_target_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email % no encontrado', p_target_email
      USING ERRCODE = 'P0002';
  END IF;

  -- Proteger al admin principal
  IF p_target_email = 'ejuniorfloress@gmail.com' AND p_is_admin = false THEN
    RAISE EXCEPTION 'No se puede revocar el acceso del administrador principal'
      USING ERRCODE = '42501';
  END IF;

  -- Actualizar
  UPDATE profiles
  SET is_admin = p_is_admin
  WHERE id = v_target_id;

  v_result := jsonb_build_object(
    'success', true,
    'email', p_target_email,
    'is_admin', p_is_admin
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_set_user_role TO authenticated;

-- 3. RPC: Verificar si el usuario actual es admin
CREATE OR REPLACE FUNCTION admin_check_user()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_profile RECORD;
  v_result jsonb;
BEGIN
  SELECT is_admin, id, name INTO v_profile
  FROM profiles
  WHERE id = auth.uid();

  IF v_profile.id IS NULL THEN
    RAISE EXCEPTION 'Perfil no encontrado'
      USING ERRCODE = 'P0002';
  END IF;

  v_result := jsonb_build_object(
    'is_admin', COALESCE(v_profile.is_admin, false),
    'user_id', v_profile.id
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_check_user TO authenticated;

-- 4. Crear índice para búsqueda rápida de admins
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin
  ON profiles(is_admin)
  WHERE is_admin = true;
