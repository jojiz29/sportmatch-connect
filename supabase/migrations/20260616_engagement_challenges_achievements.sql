-- ============================================================
-- Engagement challenges and achievements
-- Persistencia formal para retos diarios y logros sugeridos por AI Coach.
-- ============================================================

create table if not exists public.engagement_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  reward_hint text,
  status text not null default 'started',
  source text not null default 'engagement_page',
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint engagement_challenges_status_chk
    check (status in ('started', 'completed', 'dismissed'))
);

create index if not exists engagement_challenges_user_status_idx
  on public.engagement_challenges(user_id, status);

create index if not exists engagement_challenges_started_at_idx
  on public.engagement_challenges(started_at desc);

create table if not exists public.engagement_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text not null,
  unlock_condition text,
  status text not null default 'saved',
  source text not null default 'engagement_page',
  metadata jsonb not null default '{}'::jsonb,
  saved_at timestamptz not null default now(),
  unlocked_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint engagement_achievements_status_chk
    check (status in ('saved', 'unlocked', 'dismissed'))
);

create index if not exists engagement_achievements_user_status_idx
  on public.engagement_achievements(user_id, status);

create index if not exists engagement_achievements_saved_at_idx
  on public.engagement_achievements(saved_at desc);

alter table public.engagement_challenges enable row level security;
alter table public.engagement_achievements enable row level security;

drop policy if exists "Users can read own engagement challenges" on public.engagement_challenges;
create policy "Users can read own engagement challenges"
  on public.engagement_challenges
  for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage engagement challenges" on public.engagement_challenges;
create policy "Service role can manage engagement challenges"
  on public.engagement_challenges
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Users can read own engagement achievements" on public.engagement_achievements;
create policy "Users can read own engagement achievements"
  on public.engagement_achievements
  for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage engagement achievements" on public.engagement_achievements;
create policy "Service role can manage engagement achievements"
  on public.engagement_achievements
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table public.engagement_challenges is
  'Retos diarios guardados o completados desde AI Coach.';

comment on table public.engagement_achievements is
  'Logros sugeridos guardados o desbloqueados desde AI Coach.';
