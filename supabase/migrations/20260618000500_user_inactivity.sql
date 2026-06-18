-- ============================================================
-- Migration: User Inactivity Detection & Alert System
-- Fecha: 2026-06-18
--
-- 1. Columna last_login_at en profiles
-- 2. Tabla user_inactivity_log para tracking
-- 3. Trigger que actualiza last_login_at desde auth.users
-- 4. Vista de usuarios inactivos
-- 5. RPC para detectar y registrar inactividad
-- ============================================================

-- 1. Agregar columna last_login_at a profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.last_login_at IS
  'Último inicio de sesión del usuario (actualizado via trigger)';

-- 2. Tabla de log de inactividad
CREATE TABLE public.user_inactivity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alert_level INTEGER NOT NULL CHECK (alert_level IN (1, 2, 3)),
  alert_sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  alert_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  responded_at TIMESTAMPTZ,
  CONSTRAINT unique_user_alert_level UNIQUE (user_id, alert_level)
);

CREATE INDEX idx_inactivity_log_user
  ON user_inactivity_log(user_id);

CREATE INDEX idx_inactivity_log_sent_at
  ON user_inactivity_log(alert_sent_at);

COMMENT ON TABLE user_inactivity_log IS
  'Registro de alertas de inactividad enviadas a usuarios';
COMMENT ON COLUMN user_inactivity_log.alert_level IS
  '1=14 días (bono 50FC), 2=21 días (challenge especial 100FC), 3=28 días (escalado admin)';

-- 3. RLS
ALTER TABLE user_inactivity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own inactivity log"
  ON user_inactivity_log
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages inactivity log"
  ON user_inactivity_log
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. Trigger: Actualizar last_login_at cuando el usuario inicia sesión (Comentado debido a restricciones de propiedad en auth.users en Supabase)
-- CREATE OR REPLACE FUNCTION update_last_login()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql SECURITY DEFINER
-- SET search_path = public
-- AS $$
-- BEGIN
--   UPDATE profiles
--   SET last_login_at = now()
--   WHERE id = NEW.id;
--   RETURN NEW;
-- END;
-- $$;
-- 
-- CREATE TRIGGER trg_auth_users_login
--   AFTER INSERT OR UPDATE OF last_sign_in_at
--   ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION update_last_login();
-- 
-- COMMENT ON TRIGGER trg_auth_users_login ON auth.users IS
--   'Actualiza last_login_at en profiles cada vez que el usuario inicia sesión';

-- 5. Vista: Usuarios inactivos (para Edge Function)
CREATE OR REPLACE VIEW view_inactive_users AS
SELECT
  p.id,
  p.name,
  au.email,
  p.avatar_url,
  p.last_login_at,
  p.push_token,
  p.is_admin,
  p.deleted_at,
  EXTRACT(DAY FROM now() - p.last_login_at)::INTEGER AS days_since_login,
  CASE
    WHEN p.last_login_at IS NULL THEN 0
    ELSE EXTRACT(DAY FROM now() - p.last_login_at)::INTEGER
  END AS inactivity_days
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.deleted_at IS NULL
  AND (p.last_login_at IS NULL OR p.last_login_at < now() - interval '14 days')
  AND (p.is_admin IS NOT TRUE OR p.is_admin IS NULL);

COMMENT ON VIEW view_inactive_users IS
  'Usuarios inactivos por más de 14 días (excluye admins y eliminados)';

-- 6. RPC: Marcar usuario como respondedor (cuando vuelve)
CREATE OR REPLACE FUNCTION mark_inactivity_response()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  UPDATE user_inactivity_log
  SET responded_at = now()
  WHERE user_id = auth.uid()
    AND responded_at IS NULL;

  GET DIAGNOSTICS v_result = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'alerts_responded', v_result
  );
END;
$$;

GRANT EXECUTE ON FUNCTION mark_inactivity_response TO authenticated;

-- 7. RPC: Registrar alerta de inactividad (para Edge Function, service_role)
CREATE OR REPLACE FUNCTION log_inactivity_alert(
  p_user_id UUID,
  p_alert_level INTEGER,
  p_alert_data JSONB DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  INSERT INTO user_inactivity_log (user_id, alert_level, alert_data)
  VALUES (p_user_id, p_alert_level, p_alert_data)
  ON CONFLICT (user_id, alert_level) DO UPDATE
  SET alert_sent_at = now(),
      alert_data = p_alert_data;

  v_result := jsonb_build_object('success', true, 'user_id', p_user_id, 'level', p_alert_level);
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION log_inactivity_alert TO service_role;

-- 8. Trigger: Inicializar last_login_at para usuarios existentes
-- (solo se ejecuta una vez, si el campo estaba NULL y el usuario ya existía)
UPDATE profiles p
SET last_login_at = COALESCE(
  (SELECT last_sign_in_at FROM auth.users au WHERE au.id = p.id),
  p.created_at
)
WHERE last_login_at IS NULL;
