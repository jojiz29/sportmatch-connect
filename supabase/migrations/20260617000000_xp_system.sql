-- ============================================================
-- 20260617000000_xp_system.sql
-- SCRUM-229: Sistema de experiencia (XP) y niveles
-- Tabla profiles gana xp, level (INTEGER) y xp_to_next_level.
-- Renombramos profiles.level (TEXT legacy) a level_label para
-- liberar el nombre "level" para el INTEGER.
-- Trigger BEFORE UPDATE OF xp recalcula level via formula cuadratica.
-- SCRUM-230 se engancha en este trigger para emitir notificacion.
-- ============================================================

-- 1) Renombrar columna legacy si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'level' AND data_type = 'text'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN level TO level_label;
  END IF;
END $$;

-- 2) Anadir nuevas columnas (idempotente)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_to_next_level INTEGER NOT NULL DEFAULT 100;

-- 3) Indices para leaderboard rapido
CREATE INDEX IF NOT EXISTS idx_profiles_xp_desc ON profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_level_desc ON profiles(level DESC, xp DESC);

COMMENT ON COLUMN profiles.level IS 'Nivel numerico actual (1 = novato, 10+ = elite)';
COMMENT ON COLUMN profiles.level_label IS 'Etiqueta legible del nivel (Intermedio, Avanzado, etc.)';
COMMENT ON COLUMN profiles.xp IS 'Puntos de experiencia acumulados';
COMMENT ON COLUMN profiles.xp_to_next_level IS 'XP total necesario para alcanzar el siguiente nivel';

-- ============================================================
-- Funcion pura: dado xp acumulado, calcula el nivel.
-- Formula: nivel = 1 + FLOOR(SQRT(xp / 100))
--   nivel 1:   0 -   99 xp
--   nivel 2: 100 -  399 xp
--   nivel 3: 400 -  899 xp
--   nivel 4: 900 - 1599 xp
--   nivel 5: 1600 - 2499 xp
--   nivel 10: 10000+ xp
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_user_level(p_xp INTEGER)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT 1 + FLOOR(SQRT(GREATEST(p_xp, 0)::NUMERIC / 100.0))::INTEGER;
$$;

-- ============================================================
-- Funcion: dado el nivel, retorna el XP total necesario para ese nivel.
-- Inversa: xp_total = (nivel - 1)^2 * 100
-- ============================================================
CREATE OR REPLACE FUNCTION xp_required_for_level(p_level INTEGER)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT GREATEST(0, (p_level - 1) * (p_level - 1) * 100);
$$;

-- ============================================================
-- Funcion: dado el nivel actual, retorna el XP total necesario para
-- alcanzar el siguiente nivel.
-- ============================================================
CREATE OR REPLACE FUNCTION xp_to_next_level(p_level INTEGER)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT (p_level * p_level) * 100;
$$;

-- ============================================================
-- Trigger BEFORE UPDATE: actualiza level y xp_to_next_level
-- automaticamente cuando xp cambia.
-- Solo actua si xp realmente cambio (evita trabajo innecesario).
-- ============================================================
CREATE OR REPLACE FUNCTION trg_update_user_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_level INTEGER;
  v_old_level INTEGER;
  v_xp_to_next INTEGER;
BEGIN
  IF NEW.xp = OLD.xp THEN
    RETURN NEW;
  END IF;

  v_old_level := OLD.level;
  v_new_level := calculate_user_level(NEW.xp);
  v_xp_to_next := xp_to_next_level(v_new_level);

  NEW.level := v_new_level;
  NEW.xp_to_next_level := v_xp_to_next;

  IF v_new_level > v_old_level THEN
    RAISE NOTICE '[xp_system] profile % leveled up: % -> % (xp: %)',
      NEW.id, v_old_level, v_new_level, NEW.xp;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_update_level ON profiles;
CREATE TRIGGER trg_profiles_update_level
  BEFORE UPDATE OF xp ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trg_update_user_level();

-- ============================================================
-- Funcion helper para sumar XP a un usuario.
-- Usada desde otras features (matches, posts, etc.) para dar XP
-- por logros. Hace UPDATE atomico y devuelve el nuevo nivel.
-- Usa profiles.id (UUID) porque no hay columna user_id separada.
-- ============================================================
CREATE OR REPLACE FUNCTION add_user_xp(
  p_user_id UUID,
  p_xp_delta INTEGER
)
RETURNS TABLE (
  new_xp INTEGER,
  new_level INTEGER,
  leveled_up BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_new_xp INTEGER;
BEGIN
  SELECT level INTO v_old_level
  FROM profiles
  WHERE id = p_user_id;

  IF v_old_level IS NULL THEN
    RETURN;
  END IF;

  UPDATE profiles
  SET xp = GREATEST(0, xp + p_xp_delta)
  WHERE id = p_user_id
  RETURNING xp, level INTO v_new_xp, v_new_level;

  RETURN QUERY SELECT v_new_xp, v_new_level, (v_new_level > v_old_level);
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION add_user_xp(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_user_level(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION xp_required_for_level(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION xp_to_next_level(INTEGER) TO authenticated;
