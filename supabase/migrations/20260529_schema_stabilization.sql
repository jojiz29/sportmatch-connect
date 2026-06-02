-- =====================================================================
-- 🛡️ SPORTMATCH CONNECT — DATABASE SCHEMA STABILIZATION
-- =====================================================================

-- 1. Alter courts.id and related foreign keys to varchar(100) to match frontend IDs ('lima-court-XX')
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_court_id_fkey;
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_court_id_fkey;

ALTER TABLE public.courts ALTER COLUMN id TYPE varchar(100);
ALTER TABLE public.bookings ALTER COLUMN court_id TYPE varchar(100);
ALTER TABLE public.matches ALTER COLUMN court_id TYPE varchar(100);

-- Re-create foreign keys with varchar(100) compatibility
ALTER TABLE public.bookings 
  ADD CONSTRAINT bookings_court_id_fkey 
  FOREIGN KEY (court_id) REFERENCES public.courts(id) ON DELETE CASCADE;

ALTER TABLE public.matches 
  ADD CONSTRAINT matches_court_id_fkey 
  FOREIGN KEY (court_id) REFERENCES public.courts(id) ON DELETE SET NULL;

-- 2. Add missing columns to courts
ALTER TABLE public.courts ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT false;

-- 3. Create the posts table referencing public.profiles (user profiles)
CREATE TABLE IF NOT EXISTS public.posts (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('MATCH_RESULT', 'PHOTO', 'SQUAD_ANNOUNCEMENT', 'TEXT')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  media_url TEXT,
  sport VARCHAR(100)
);

-- Enable Row Level Security on posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop and recreate posts policies
DROP POLICY IF EXISTS "posts_select_all" ON public.posts;
CREATE POLICY "posts_select_all"
ON public.posts FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
CREATE POLICY "posts_insert_own"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);
