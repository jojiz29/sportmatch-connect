-- ============================================================
-- Migration: Favorite Courts
-- Fecha: 2026-06-18
--
-- 1. Tabla favorite_courts (user <-> court many-to-many)
-- 2. RLS policies estrictas
-- 3. Función helper para obtener court IDs favoritos
-- ============================================================

-- 1. Tabla favoritos
CREATE TABLE public.favorite_courts (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, court_id)
);

CREATE INDEX idx_favorite_courts_user
  ON favorite_courts(user_id);

CREATE INDEX idx_favorite_courts_court
  ON favorite_courts(court_id);

COMMENT ON TABLE favorite_courts IS
  'Canchas favoritas por usuario';

-- 2. RLS: cada usuario solo puede gestionar sus propios favoritos
ALTER TABLE favorite_courts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites"
  ON favorite_courts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. RPC: Alternar favorito (toggle)
CREATE OR REPLACE FUNCTION toggle_favorite_court(
  p_court_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
  v_result jsonb;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM favorite_courts
    WHERE user_id = auth.uid() AND court_id = p_court_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM favorite_courts
    WHERE user_id = auth.uid() AND court_id = p_court_id;

    v_result := jsonb_build_object(
      'favorite', false,
      'court_id', p_court_id
    );
  ELSE
    INSERT INTO favorite_courts (user_id, court_id)
    VALUES (auth.uid(), p_court_id);

    v_result := jsonb_build_object(
      'favorite', true,
      'court_id', p_court_id
    );
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_favorite_court TO authenticated;

-- 4. RPC: Obtener IDs de canchas favoritas del usuario actual
CREATE OR REPLACE FUNCTION get_favorite_court_ids()
RETURNS TABLE(court_id UUID)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT fc.court_id
  FROM favorite_courts fc
  WHERE fc.user_id = auth.uid()
  ORDER BY fc.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_favorite_court_ids TO authenticated;
