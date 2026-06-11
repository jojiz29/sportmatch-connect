-- Conexiones deportivas guardadas desde el carrusel de matchmaking.
-- Son un vínculo unilateral: permiten conservar un jugador recomendado sin
-- obligar a enviar inmediatamente un desafío, invitación o mensaje.

create table if not exists public.player_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  connected_user_id uuid not null references public.profiles(id) on delete cascade,
  sport text,
  compatibility_score integer
    check (compatibility_score is null or compatibility_score between 0 and 100),
  created_at timestamptz not null default now(),
  constraint player_connections_different_users check (user_id <> connected_user_id),
  constraint player_connections_unique_pair unique (user_id, connected_user_id)
);

create index if not exists player_connections_user_created_idx
  on public.player_connections (user_id, created_at desc);

alter table public.player_connections enable row level security;

drop policy if exists "connection_owner_read" on public.player_connections;
create policy "connection_owner_read"
on public.player_connections for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "connection_owner_insert" on public.player_connections;
create policy "connection_owner_insert"
on public.player_connections for insert
to authenticated
with check (auth.uid() = user_id and user_id <> connected_user_id);

drop policy if exists "connection_owner_update" on public.player_connections;
create policy "connection_owner_update"
on public.player_connections for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id and user_id <> connected_user_id);

drop policy if exists "connection_owner_delete" on public.player_connections;
create policy "connection_owner_delete"
on public.player_connections for delete
to authenticated
using (auth.uid() = user_id);

comment on table public.player_connections is
  'Jugadores guardados desde matchmaking para contactarlos y proponer actividades después.';
