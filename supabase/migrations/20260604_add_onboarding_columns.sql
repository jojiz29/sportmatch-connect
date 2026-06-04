-- ============================================================
-- MIGRATION: Add missing onboarding columns to profiles table
-- SportMatch 2026 — Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add user_sports column (array of sport objects with level)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_sports JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Add onboarding_completed flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- 3. Add sport_preferences JSONB (sports_matrix + behavioral_intent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sport_preferences JSONB DEFAULT NULL;

-- 4. Notify PostgREST to reload schema cache immediately
-- (This avoids waiting for the 5-minute auto-refresh)
NOTIFY pgrst, 'reload schema';

-- 5. Verify columns were created
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('user_sports', 'onboarding_completed', 'sport_preferences')
ORDER BY column_name;
