-- ============================================================
-- Engagement daily recommendation snapshots
-- Cache diario para evitar llamar IA cada vez que el usuario entra.
-- ============================================================

create table if not exists public.engagement_recommendation_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recommendation_date date not null,
  type text not null default 'overview',
  language text not null default 'es',
  payload jsonb not null,
  model text not null,
  experiment_variant text not null,
  status text not null default 'ready',
  stale_reason text,
  generated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint engagement_recommendation_snapshots_status_chk
    check (status in ('ready', 'stale', 'failed'))
);

create unique index if not exists engagement_recommendation_snapshots_unique_day_idx
  on public.engagement_recommendation_snapshots(user_id, recommendation_date, type, language);

create index if not exists engagement_recommendation_snapshots_user_status_idx
  on public.engagement_recommendation_snapshots(user_id, status);

create index if not exists engagement_recommendation_snapshots_expires_at_idx
  on public.engagement_recommendation_snapshots(expires_at);

alter table public.engagement_recommendation_snapshots enable row level security;

drop policy if exists "Users can read own engagement recommendation snapshots"
  on public.engagement_recommendation_snapshots;
create policy "Users can read own engagement recommendation snapshots"
  on public.engagement_recommendation_snapshots
  for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage engagement recommendation snapshots"
  on public.engagement_recommendation_snapshots;
create policy "Service role can manage engagement recommendation snapshots"
  on public.engagement_recommendation_snapshots
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table public.engagement_recommendation_snapshots is
  'Paquetes diarios de recomendaciones generadas por Engagement AI para reducir latencia y consumo de tokens.';
