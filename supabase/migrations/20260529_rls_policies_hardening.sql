-- =====================================================================
-- 🛡️ SPORTMATCH CONNECT — RLS POLICIES HARDENING (UUID & TEXT COMPATIBILITY)
-- =====================================================================

-- 1. POSTS TABLE
alter table public.posts enable row level security;

drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all"
on public.posts for select
to authenticated
using (true);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
on public.posts for insert
to authenticated
with check (
  auth.uid()::text = user_id::text 
  or auth.uid()::text = user_id
);


-- 2. MATCHES TABLE
alter table public.matches enable row level security;

drop policy if exists "matches_public_read" on public.matches;
create policy "matches_public_read"
on public.matches for select
using (true);

drop policy if exists "matches_creator_insert" on public.matches;
create policy "matches_creator_insert"
on public.matches for insert
with check (
  auth.uid()::text = creator_id::text 
  or auth.uid()::text = creator_id
);

drop policy if exists "matches_creator_update" on public.matches;
create policy "matches_creator_update"
on public.matches for update
using (
  auth.uid()::text = creator_id::text 
  or auth.uid()::text = creator_id
);


-- 3. MATCH_PARTICIPANTS TABLE
alter table public.match_participants enable row level security;

drop policy if exists "participants_read_all" on public.match_participants;
create policy "participants_read_all"
on public.match_participants for select
using (true);

drop policy if exists "participants_join_self" on public.match_participants;
create policy "participants_join_self"
on public.match_participants for insert
with check (
  auth.uid()::text = user_id::text 
  or auth.uid()::text = user_id
);

drop policy if exists "participants_leave_self" on public.match_participants;
create policy "participants_leave_self"
on public.match_participants for delete
using (
  auth.uid()::text = user_id::text 
  or auth.uid()::text = user_id
);


-- 4. SQUADS TABLE
alter table public.squads enable row level security;

drop policy if exists "squads_public_read" on public.squads;
create policy "squads_public_read"
on public.squads for select
using (true);

drop policy if exists "squads_creator_insert" on public.squads;
create policy "squads_creator_insert"
on public.squads for insert
with check (
  auth.uid()::text = creator_id::text 
  or auth.uid()::text = creator_id
);


-- 5. SQUAD_MEMBERS TABLE
alter table public.squad_members enable row level security;

drop policy if exists "squad_members_public_read" on public.squad_members;
create policy "squad_members_public_read"
on public.squad_members for select
using (true);

drop policy if exists "squad_members_self_insert" on public.squad_members;
create policy "squad_members_self_insert"
on public.squad_members for insert
with check (
  auth.uid()::text = user_id::text 
  or auth.uid()::text = user_id
);

drop policy if exists "squad_members_self_delete" on public.squad_members;
create policy "squad_members_self_delete"
on public.squad_members for delete
using (
  auth.uid()::text = user_id::text 
  or auth.uid()::text = user_id
);
