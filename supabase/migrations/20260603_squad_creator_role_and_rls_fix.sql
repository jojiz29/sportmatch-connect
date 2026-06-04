-- SQL Migration: Update squad_members role constraint and secure SELECT policies

-- 1. Alter check constraint on squad_members role
ALTER TABLE public.squad_members DROP CONSTRAINT IF EXISTS squad_members_role_check;
ALTER TABLE public.squad_members ADD CONSTRAINT squad_members_role_check CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'CREATOR'));

-- 2. Update SELECT policy on squads to ensure consistency
DROP POLICY IF EXISTS "squads_public_read" ON public.squads;
DROP POLICY IF EXISTS "squads_select" ON public.squads;
CREATE POLICY "squads_select"
ON public.squads FOR SELECT
TO authenticated, anon
USING (true);

-- 3. Update SELECT policy on squad_members
DROP POLICY IF EXISTS "squad_members_select_all" ON public.squad_members;
DROP POLICY IF EXISTS "squad_members_select" ON public.squad_members;
CREATE POLICY "squad_members_select"
ON public.squad_members FOR SELECT
TO authenticated, anon
USING (true);

