-- Amplía las actividades existentes para soportar varios participantes y cupos de inicio.
alter table public.venue_activities
  add column if not exists participant_ids uuid[] not null default '{}'::uuid[],
  add column if not exists required_players integer not null default 2;

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
