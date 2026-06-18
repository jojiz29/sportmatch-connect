-- Registra señales privadas que alimentarán el perfil inteligente y las
-- recomendaciones. No almacena el contenido completo de publicaciones.
create table if not exists public.engagement_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  dedupe_key text,
  created_at timestamptz not null default now(),
  constraint engagement_events_type_not_empty check (char_length(trim(event_type)) > 0),
  constraint engagement_events_dedupe_unique unique (user_id, dedupe_key)
);

create index if not exists engagement_events_user_created_idx
  on public.engagement_events(user_id, created_at desc);

create index if not exists engagement_events_type_idx
  on public.engagement_events(event_type);

create index if not exists engagement_events_metadata_idx
  on public.engagement_events using gin(metadata);

alter table public.engagement_events enable row level security;

drop policy if exists "Users can view own engagement events" on public.engagement_events;
create policy "Users can view own engagement events"
  on public.engagement_events for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own engagement events" on public.engagement_events;
create policy "Users can insert own engagement events"
  on public.engagement_events for insert
  with check (auth.uid() = user_id);

-- Los eventos representan hechos históricos y no deben editarse desde el cliente.
grant select, insert on public.engagement_events to authenticated;

comment on table public.engagement_events is
  'Señales privadas y estructuradas para personalización, embeddings y recomendaciones.';

notify pgrst, 'reload schema';
