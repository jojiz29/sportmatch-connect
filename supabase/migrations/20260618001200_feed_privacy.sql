-- ============================================================
-- MIGRACIÓN: 20260618001200 — Feed privacy
-- Sprint V2.1 — Social Graph & Followers
-- ============================================================
-- Objetivo:
--   1. Añadir columna is_private a profiles para cuentas privadas
--   2. Cuando is_private = true, solo seguidores pueden ver
--      los posts del usuario (se implementa en la lógica de feed)
-- ============================================================

-- ============================================================
-- 1. AÑADIR is_private a profiles
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'is_private'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN is_private boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- ============================================================
-- 2. ÍNDICE para consultas de feed que filtran por privacidad
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_is_private
  ON public.profiles(is_private)
  WHERE is_private = true;

-- NOTIFY PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
