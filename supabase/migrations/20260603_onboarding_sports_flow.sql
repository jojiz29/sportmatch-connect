-- Migration: Onboarding Sports Flow Schema Updates
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_sports JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS game_intent;
