-- ============================================================
-- SPORTMATCH CONNECT — SPRINT 3 B2B EVOLUTION SQL MIGRATION
-- ============================================================

-- 1. Extend profiles table with B2B commercial/contact fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS operating_hours text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS instagram text,
ADD COLUMN IF NOT EXISTS website text;

-- 2. Create business_ads table
CREATE TABLE IF NOT EXISTS public.business_ads (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid references public.profiles(id) on delete cascade not null,
  title           text not null,
  description     text not null,
  image_url       text,
  category        text not null check (category in ('Gym','Academia','Tienda','Nutricionista','Fisioterapia','Torneos','Marcas','Patrocinador')),
  location        text,
  district        text,
  valid_until     timestamptz not null,
  contact_phone   text,
  views           int default 0,
  clicks          int default 0,
  contacts        int default 0,
  is_featured     boolean default false,
  is_premium      boolean default false,
  created_at      timestamptz default now() not null,
  updated_at      timestamptz default now() not null
);

-- 3. Enable Row Level Security (RLS) on business_ads
ALTER TABLE public.business_ads ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for business_ads
DROP POLICY IF EXISTS ads_public_read ON public.business_ads;
CREATE POLICY ads_public_read ON public.business_ads
  FOR SELECT USING (true);

DROP POLICY IF EXISTS ads_owner_all ON public.business_ads;
CREATE POLICY ads_owner_all ON public.business_ads
  FOR ALL USING (auth.uid() = business_id);

-- 5. RPC function to increment ad metrics securely (views, clicks, contacts)
CREATE OR REPLACE FUNCTION public.increment_ad_metric(ad_id uuid, metric_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF metric_name = 'views' THEN
    UPDATE public.business_ads SET views = views + 1 WHERE id = ad_id;
  ELIF metric_name = 'clicks' THEN
    UPDATE public.business_ads SET clicks = clicks + 1 WHERE id = ad_id;
  ELIF metric_name = 'contacts' THEN
    UPDATE public.business_ads SET contacts = contacts + 1 WHERE id = ad_id;
  END IF;
END;
$$;
