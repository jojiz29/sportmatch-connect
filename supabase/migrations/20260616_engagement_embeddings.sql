-- ============================================================
-- Engagement embeddings
-- Guarda la huella vectorial del perfil de engagement por usuario.
-- MVP: usa double precision[] para evitar depender de pgvector mientras
-- se valida el flujo. Luego puede migrarse a vector(n) sin cambiar la UI.
-- ============================================================

create table if not exists public.engagement_embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  embedding_vector double precision[] not null default '{}',
  provider text not null,
  dimension integer not null,
  metadata jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint engagement_embeddings_user_unique unique (user_id)
);

create index if not exists engagement_embeddings_provider_idx
  on public.engagement_embeddings(provider);

create index if not exists engagement_embeddings_generated_at_idx
  on public.engagement_embeddings(generated_at desc);

alter table public.engagement_embeddings enable row level security;

drop policy if exists "Users can read own engagement embedding" on public.engagement_embeddings;
create policy "Users can read own engagement embedding"
  on public.engagement_embeddings
  for select
  using (auth.uid() = user_id);

drop policy if exists "Service role can manage engagement embeddings" on public.engagement_embeddings;
create policy "Service role can manage engagement embeddings"
  on public.engagement_embeddings
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table public.engagement_embeddings is
  'Huella vectorial privada del usuario para recomendaciones de Engagement AI.';
