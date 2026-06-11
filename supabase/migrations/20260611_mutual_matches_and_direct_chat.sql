-- Conversaciones directas compartidas que nacen únicamente de una conexión recíproca.

create table if not exists public.conversations (
  id text primary key,
  type text not null default 'direct' check (type in ('direct', 'group')),
  direct_key text unique,
  created_at timestamptz not null default now(),
  last_message_at timestamptz
);

create table if not exists public.conversation_participants (
  conversation_id text not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;

create or replace function public.is_conversation_participant(target_conversation_id text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = target_conversation_id and user_id = auth.uid()
  );
$$;

grant execute on function public.is_conversation_participant(text) to authenticated;

drop policy if exists "conversation_participants_read_conversations" on public.conversations;
create policy "conversation_participants_read_conversations"
on public.conversations for select to authenticated
using (public.is_conversation_participant(id));

drop policy if exists "conversation_participants_read_members" on public.conversation_participants;
create policy "conversation_participants_read_members"
on public.conversation_participants for select to authenticated
using (public.is_conversation_participant(conversation_id));

-- El receptor puede leer la conexión entrante para detectar reciprocidad.
drop policy if exists "connection_target_read" on public.player_connections;
create policy "connection_target_read"
on public.player_connections for select to authenticated
using (auth.uid() = connected_user_id);

-- El RPC valida el match mutuo y crea una única conversación para la pareja.
create or replace function public.create_direct_conversation(other_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  pair_key text;
  conversation_id text;
begin
  if current_user_id is null or current_user_id = other_user_id then
    raise exception 'Conversación directa inválida';
  end if;

  if not exists (
    select 1 from public.player_connections
    where user_id = current_user_id and connected_user_id = other_user_id
  ) or not exists (
    select 1 from public.player_connections
    where user_id = other_user_id and connected_user_id = current_user_id
  ) then
    raise exception 'La conversación requiere una conexión recíproca';
  end if;

  pair_key := least(current_user_id::text, other_user_id::text)
    || ':' || greatest(current_user_id::text, other_user_id::text);
  conversation_id := 'direct_' || md5(pair_key);

  insert into public.conversations (id, type, direct_key)
  values (conversation_id, 'direct', pair_key)
  on conflict (id) do nothing;

  insert into public.conversation_participants (conversation_id, user_id)
  values (conversation_id, current_user_id), (conversation_id, other_user_id)
  on conflict do nothing;

  return conversation_id;
end;
$$;

grant execute on function public.create_direct_conversation(uuid) to authenticated;

-- Los mensajes quedan restringidos a participantes de la conversación.
drop policy if exists "messages_select_all" on public.messages;
drop policy if exists "messages_insert_own" on public.messages;
drop policy if exists "messages_participants_select" on public.messages;
create policy "messages_participants_select"
on public.messages for select to authenticated
using (
  messages.chat_id not like 'direct_%'
  or public.is_conversation_participant(messages.chat_id)
);

drop policy if exists "messages_participants_insert" on public.messages;
create policy "messages_participants_insert"
on public.messages for insert to authenticated
with check (
  auth.uid() = sender_id
  and (
    messages.chat_id not like 'direct_%'
    or public.is_conversation_participant(messages.chat_id)
  )
);

drop policy if exists "messages_participants_update" on public.messages;
create policy "messages_participants_update"
on public.messages for update to authenticated
using (
  messages.chat_id not like 'direct_%'
  or public.is_conversation_participant(messages.chat_id)
);

-- Realtime necesita que messages forme parte de la publicación.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'messages'
    ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'player_connections'
    ) then
    alter publication supabase_realtime add table public.player_connections;
  end if;
end $$;
