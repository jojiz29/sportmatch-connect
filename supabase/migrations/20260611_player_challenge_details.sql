-- Amplía los desafíos para que representen una propuesta deportiva concreta
-- creada después de que dos jugadores hayan conectado.
alter table public.player_challenges
  add column if not exists modality text not null default 'amistoso',
  add column if not exists scheduled_date date,
  add column if not exists scheduled_time time,
  add column if not exists location text;

alter table public.player_challenges
  drop constraint if exists player_challenges_modality_check;

alter table public.player_challenges
  add constraint player_challenges_modality_check
  check (modality in ('amistoso', 'competitivo'));

alter table public.player_challenges
  drop constraint if exists player_challenges_status_check;

alter table public.player_challenges
  add constraint player_challenges_status_check
  check (status in ('pending', 'counter_proposed', 'accepted', 'rejected', 'cancelled'));

-- El receptor puede cambiar únicamente los detalles coordinables y dejar la
-- decisión final al creador original del desafío.
create or replace function public.propose_challenge_changes(
  target_challenge_id uuid,
  proposed_date date,
  proposed_time time,
  proposed_location text
)
returns public.player_challenges
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_challenge public.player_challenges;
begin
  update public.player_challenges
  set scheduled_date = proposed_date,
      scheduled_time = proposed_time,
      location = nullif(trim(proposed_location), ''),
      status = 'counter_proposed',
      updated_at = now()
  where id = target_challenge_id
    and challenged_id = auth.uid()
    and status = 'pending'
  returning * into updated_challenge;

  if updated_challenge.id is null then
    raise exception 'El desafío ya no está disponible.';
  end if;

  return updated_challenge;
end;
$$;

create or replace function public.respond_to_challenge_counter_proposal(
  target_challenge_id uuid,
  decision text
)
returns public.player_challenges
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_challenge public.player_challenges;
begin
  if decision not in ('accepted', 'rejected') then
    raise exception 'Decisión no válida.';
  end if;

  update public.player_challenges
  set status = decision,
      updated_at = now()
  where id = target_challenge_id
    and challenger_id = auth.uid()
    and status = 'counter_proposed'
  returning * into updated_challenge;

  if updated_challenge.id is null then
    raise exception 'La contrapropuesta ya no está disponible.';
  end if;

  return updated_challenge;
end;
$$;

grant execute on function public.propose_challenge_changes(uuid, date, time, text) to authenticated;
grant execute on function public.respond_to_challenge_counter_proposal(uuid, text) to authenticated;
