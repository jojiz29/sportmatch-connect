-- ============================================================
-- 20260617000100_gdpr_user_deletion.sql
-- SCRUM-410: Eliminacion de cuenta con derecho al olvido (GDPR)
-- Tabla user_deletions para audit log de eliminaciones.
-- Columna profiles.deleted_at para soft delete (anonimizacion).
-- Funcion cleanup_old_deleted_users() para purga fisica despues de 30d.
-- SCRUM-245 (US original) cubre UI/backend; esta migracion es la pieza SQL.
-- ============================================================

-- 1) Audit log
CREATE TABLE IF NOT EXISTS user_deletions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_at_deletion TEXT NOT NULL,
  name_at_deletion TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  reason TEXT,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  purged_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_user_deletions_requested_at
  ON user_deletions(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_deletions_user_id
  ON user_deletions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_deletions_unpurged
  ON user_deletions(purged_at) WHERE purged_at IS NULL;

COMMENT ON TABLE user_deletions IS 'Audit log de solicitudes de eliminacion de cuenta (GDPR)';
COMMENT ON COLUMN user_deletions.user_id IS 'UUID del usuario eliminado (sin FK para permitir borrado fisico)';
COMMENT ON COLUMN user_deletions.email_at_deletion IS 'Email del usuario al momento de la eliminacion (para audit)';
COMMENT ON COLUMN user_deletions.confirmed IS 'true si el usuario confirmo con password';
COMMENT ON COLUMN user_deletions.purged_at IS 'Cuando se borro fisicamente de la DB (cron 30 dias)';

-- 2) Soft delete en profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS anonymized_email TEXT;

-- 3) Anonimizacion inmediata en DELETE
CREATE OR REPLACE FUNCTION anonymize_deleted_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    -- Anonimizar datos personales en el momento del soft delete
    NEW.name := 'Usuario eliminado';
    NEW.email := NULL;  -- se mantiene solo en user_deletions.email_at_deletion
    NEW.bio := NULL;
    NEW.avatar_url := NULL;
    NEW.city := NULL;
    NEW.anonymized_email := 'deleted_' || replace(NEW.id::text, '-', '') || '@deleted.local';
    NEW.dni_hash := NULL;
    NEW.dni_verificado := false;
    NEW.dni_intentos := 0;
    NEW.fecha_verificacion := NULL;
    NEW.user_sports := '[]'::jsonb;
    NEW.sport_preferences := NULL;
    NEW.last_location_lat := NULL;
    NEW.last_location_lng := NULL;
    NEW.is_sponsored := false;
    NEW.is_admin := false;
    NEW.push_token := NULL;
    NEW.whatsapp := NULL;
    NEW.instagram := NULL;
    NEW.website := NULL;
    NEW.address := NULL;
    NEW.district := NULL;
    NEW.company_name := NULL;
    NEW.business_category := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_anonymize_deleted_profile ON profiles;
CREATE TRIGGER trg_anonymize_deleted_profile
  BEFORE UPDATE OF deleted_at ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION anonymize_deleted_profile();

-- 4) Funcion para soft delete (la llama el backend o Edge Function)
CREATE OR REPLACE FUNCTION soft_delete_user(
  p_user_id UUID,
  p_email TEXT,
  p_name TEXT DEFAULT NULL,
  p_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
  deletion_id UUID,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deletion_id UUID;
  v_deleted_at TIMESTAMPTZ := now();
BEGIN
  -- 1) Insertar audit log
  INSERT INTO user_deletions (
    user_id, email_at_deletion, name_at_deletion, requested_at,
    ip_address, user_agent, reason, confirmed, confirmed_at
  )
  VALUES (
    p_user_id, p_email, p_name, v_deleted_at,
    p_ip, p_user_agent, p_reason, true, v_deleted_at
  )
  RETURNING id INTO v_deletion_id;

  -- 2) Anonimizar profile (el trigger BEFORE UPDATE OF deleted_at lo hace)
  UPDATE profiles
  SET deleted_at = v_deleted_at
  WHERE id = p_user_id;

  -- 3) Borrar mensajes y posts del usuario (derecho al olvido completo)
  -- Posts: marcar como borrados pero mantener para integridad referencial de comentarios
  UPDATE posts SET content = '[contenido eliminado por el usuario]', updated_at = now()
  WHERE author_id = p_user_id;
  UPDATE post_comments SET content = '[comentario eliminado por el usuario]', updated_at = now()
  WHERE author_id = p_user_id;
  UPDATE messages SET content = '[mensaje eliminado]', updated_at = now()
  WHERE sender_id = p_user_id;
  -- Matches: marcar como finalizados
  UPDATE matches SET status = 'cancelled' WHERE organizer_id = p_user_id AND status = 'open';
  -- Bookings: cancelar y reembolsar FitCoins via trigger
  UPDATE bookings SET status = 'cancelled' WHERE user_id = p_user_id AND status IN ('pending', 'confirmed');
  -- Wallet: vaciar prefs pero mantener audit
  DELETE FROM user_preferences WHERE user_id = p_user_id;
  DELETE FROM user_blocks WHERE user_id = p_user_id OR blocked_id = p_user_id;
  DELETE FROM user_sessions WHERE user_id = p_user_id;
  -- Wallets: poner balance a 0 (mantenemos el row para audit)
  UPDATE wallets SET balance = 0, updated_at = now() WHERE user_id = p_user_id;

  RETURN QUERY SELECT v_deletion_id, v_deleted_at;
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_user(UUID, TEXT, TEXT, INET, TEXT, TEXT) TO authenticated;

-- 5) Funcion para purga fisica (llamada por cron 30 dias despues)
CREATE OR REPLACE FUNCTION cleanup_old_deleted_users(p_max_age_days INTEGER DEFAULT 30)
RETURNS TABLE (
  purged_count INTEGER,
  user_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_count INTEGER := 0;
BEGIN
  FOR v_user_id IN
    SELECT ud.user_id
    FROM user_deletions ud
    WHERE ud.purged_at IS NULL
      AND ud.requested_at < (now() - (p_max_age_days || ' days')::interval)
      AND ud.confirmed = true
  LOOP
    -- Borrar profile (cascade por FK definidas)
    DELETE FROM profiles WHERE id = v_user_id;
    -- Marcar como purgado en audit log
    UPDATE user_deletions
    SET purged_at = now()
    WHERE user_id = v_user_id AND purged_at IS NULL;
    v_count := v_count + 1;
    RETURN QUERY SELECT v_count, v_user_id;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_old_deleted_users(INTEGER) TO service_role;

-- 6) RLS: nadie ve profiles con deleted_at != null excepto service_role
-- (Reemplaza la policy anon de SCRUM-160 si existe)
DROP POLICY IF EXISTS "Hide deleted profiles" ON profiles;
CREATE POLICY "Hide deleted profiles from users" ON profiles
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

-- 7) Filtro para indices (soft delete aware)
DROP INDEX IF EXISTS idx_profiles_xp_desc;
CREATE INDEX idx_profiles_xp_desc ON profiles(xp DESC) WHERE deleted_at IS NULL;
DROP INDEX IF EXISTS idx_profiles_level_desc;
CREATE INDEX idx_profiles_level_desc ON profiles(level DESC, xp DESC) WHERE deleted_at IS NULL;
