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
USING (
  creator_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.squad_members 
    WHERE squad_members.squad_id = id 
    AND squad_members.profile_id = auth.uid()
  )
);

-- 3. Update SELECT policy on squad_members
DROP POLICY IF EXISTS "squad_members_select_all" ON public.squad_members;
DROP POLICY IF EXISTS "squad_members_select" ON public.squad_members;
CREATE POLICY "squad_members_select"
ON public.squad_members FOR SELECT
TO authenticated, anon
USING (
  profile_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.squads 
    WHERE squads.id = squad_id 
    AND squads.creator_id = auth.uid()
  )
);
