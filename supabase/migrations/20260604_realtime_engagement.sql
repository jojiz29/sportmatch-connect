-- Migration: Real-Time Engagement Engine Setup
-- Adds push_token column to public.profiles

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Alter notifications table check constraint to support new notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type in ('FOLLOW','SQUAD_INVITE','TRANSACTION_SUCCESS','AD_IMPRESSION','MATCH_ALERT','SQUAD_MESSAGE'));

-- Verify/Ensure the column is exposed to auth and authenticated users (handled by default in postgres/supabase)
COMMENT ON COLUMN public.profiles.push_token IS 'OneSignal Player ID / Web Push Subscription Token';
