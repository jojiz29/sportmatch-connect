-- Actividad deportiva abierta alrededor de una sede registrada por una empresa.
create table if not exists public.venue_activities (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.courts(id) on delete cascade,
  creator_id uuid not null references public.profiles(id) on delete cascade,
  squad_id uuid references public.squads(id) on delete set null,
  sport text not null,
  activity_type text not null check (activity_type in ('PLAYER_CHALLENGE', 'TEAM_CHALLENGE')),
  status text not null default 'open' check (status in ('open', 'matched', 'cancelled')),
  participant_id uuid references public.profiles(id) on delete set null,
  participant_ids uuid[] not null default '{}'::uuid[],
  required_players integer not null default 2 check (required_players >= 2),
  created_at timestamptz not null default now()
);

-- Estas columnas también actualizan instalaciones donde la primera versión ya fue aplicada.
alter table public.venue_activities
  add column if not exists participant_ids uuid[] not null default '{}'::uuid[],
  add column if not exists required_players integer not null default 2;

alter table public.venue_activities enable row level security;

create policy "venue_activities_public_read"
on public.venue_activities for select
to authenticated
using (true);

create policy "venue_activities_creator_insert"
on public.venue_activities for insert
to authenticated
with check (auth.uid() = creator_id);

create or replace function public.join_venue_activity(target_activity_id uuid)
returns public.venue_activities
language plpgsql
security definer
set search_path = public
as $$
declare
  joined_activity public.venue_activities;
begin
  -- La actividad permanece abierta hasta completar todos los cupos requeridos.
  update public.venue_activities
  set participant_id = auth.uid(),
      participant_ids = array_append(participant_ids, auth.uid()),
      status = case
        when cardinality(participant_ids) + 2 >= required_players then 'matched'
        else 'open'
      end
  where id = target_activity_id
    and status = 'open'
    and creator_id <> auth.uid()
    and not auth.uid() = any(participant_ids)
  returning * into joined_activity;

  if joined_activity.id is null then
    raise exception 'La actividad ya no está disponible o ya te uniste.';
  end if;

  return joined_activity;
end;
$$;

grant execute on function public.join_venue_activity(uuid) to authenticated;
