-- =====================================================================
-- 🚀 SPORTMATCH CONNECT — PRODUCTION DEPLOYMENT & SCHEMA PARITY MIGRATION
-- =====================================================================

-- 1. Ensure public.posts exists with references to public.profiles(id)
CREATE TABLE IF NOT EXISTS public.posts (
  id VARCHAR(100) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('MATCH_RESULT', 'PHOTO', 'SQUAD_ANNOUNCEMENT', 'TEXT')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  media_url TEXT,
  sport VARCHAR(100)
);

-- Enable RLS on posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_all" ON public.posts;
CREATE POLICY "posts_select_all"
ON public.posts FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
CREATE POLICY "posts_insert_own"
ON public.posts FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = user_id::text
);

-- 2. Ensure public.squads has creator_id RLS rules
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "squads_public_read" ON public.squads;
CREATE POLICY "squads_public_read"
ON public.squads FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "squads_creator_insert" ON public.squads;
CREATE POLICY "squads_creator_insert"
ON public.squads FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = creator_id::text
);

-- 3. Recreate public.squad_members junction table referencing public.profiles(id)
DROP TABLE IF EXISTS public.squad_members CASCADE;
CREATE TABLE public.squad_members (
  id VARCHAR(100) PRIMARY KEY,
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT unique_squad_profile UNIQUE (squad_id, profile_id)
);

-- Enable RLS on squad_members
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "squad_members_select_all" ON public.squad_members;
CREATE POLICY "squad_members_select_all"
ON public.squad_members FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "squad_members_insert_all" ON public.squad_members;
CREATE POLICY "squad_members_insert_all"
ON public.squad_members FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "squad_members_delete_all" ON public.squad_members;
CREATE POLICY "squad_members_delete_all"
ON public.squad_members FOR DELETE
TO authenticated
USING (true);

-- 4. Create public.messages table for Chat Engine persistence
CREATE TABLE IF NOT EXISTS public.messages (
  id VARCHAR(100) PRIMARY KEY,
  chat_id VARCHAR(100) NOT NULL,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  media_url TEXT,
  metadata JSONB
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_all" ON public.messages;
CREATE POLICY "messages_select_all"
ON public.messages FOR SELECT
TO authenticated, anon
USING (true);

DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
CREATE POLICY "messages_insert_own"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid()::text = sender_id::text
);

-- 5. Explicitly GRANT INSERT, SELECT, UPDATE, DELETE permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.posts TO anon, authenticated;
GRANT ALL ON public.squads TO anon, authenticated;
GRANT ALL ON public.squad_members TO anon, authenticated;
GRANT ALL ON public.messages TO anon, authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at ASC);
CREATE INDEX IF NOT EXISTS squad_members_profile_id_idx ON public.squad_members(profile_id);
