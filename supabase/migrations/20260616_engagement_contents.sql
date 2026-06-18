-- ============================================================
-- Engagement saved contents
-- Guarda contenidos generados por AI Coach: newsletter y narrativa deportiva.
-- ============================================================

create table if not exists public.engagement_contents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_type text not null,
  title text not null,
  body text not null,
  source text not null default 'engagement_page',
  metadata jsonb not null default '{}'::jsonb,
  saved_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint engagement_contents_type_chk
    check (content_type in ('weekly_brief', 'tour_narrative'))
);

create index if not exists engagement_contents_user_type_idx
  on public.engagement_contents(user_id, content_type);

create index if not exists engagement_contents_saved_at_idx
  on public.engagement_contents(saved_at desc);

alter table public.engagement_contents enable row level security;

drop policy if exists "Users can read own engagement contents" on public.engagement_contents;
create policy "Users can read own engagement contents"
  on public.engagement_contents
  for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage engagement contents" on public.engagement_contents;
create policy "Service role can manage engagement contents"
  on public.engagement_contents
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table public.engagement_contents is
  'Contenidos personalizados guardados desde AI Coach, como resumen semanal y narrativa deportiva.';
