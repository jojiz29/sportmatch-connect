-- Desafíos directos entre jugadores recomendados por matchmaking.
-- La tabla conserva el ciclo de vida completo para evitar que la UI dependa
-- de estados temporales del navegador.

create table if not exists public.player_challenges (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references public.profiles(id) on delete cascade,
  challenged_id uuid not null references public.profiles(id) on delete cascade,
  sport text not null,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_challenges_different_users check (challenger_id <> challenged_id)
);

-- Impide solicitudes pendientes duplicadas entre los mismos jugadores y deporte.
create unique index if not exists player_challenges_unique_pending_idx
  on public.player_challenges (challenger_id, challenged_id, sport)
  where status = 'pending';

create index if not exists player_challenges_challenger_idx
  on public.player_challenges (challenger_id, created_at desc);

create index if not exists player_challenges_challenged_idx
  on public.player_challenges (challenged_id, created_at desc);

drop trigger if exists player_challenges_updated_at on public.player_challenges;
create trigger player_challenges_updated_at
  before update on public.player_challenges
  for each row execute procedure public.set_updated_at();

alter table public.player_challenges enable row level security;

drop policy if exists "challenge_participants_read" on public.player_challenges;
create policy "challenge_participants_read"
on public.player_challenges for select
to authenticated
using (auth.uid() = challenger_id or auth.uid() = challenged_id);

drop policy if exists "challenge_challenger_insert" on public.player_challenges;
create policy "challenge_challenger_insert"
on public.player_challenges for insert
to authenticated
with check (auth.uid() = challenger_id and challenger_id <> challenged_id);

drop policy if exists "challenge_participants_update" on public.player_challenges;
create policy "challenge_participants_update"
on public.player_challenges for update
to authenticated
using (auth.uid() = challenger_id or auth.uid() = challenged_id)
with check (auth.uid() = challenger_id or auth.uid() = challenged_id);

comment on table public.player_challenges is
  'Solicitudes deportivas directas creadas desde recomendaciones de matchmaking.';
