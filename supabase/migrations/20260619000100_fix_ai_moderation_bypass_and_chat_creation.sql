-- =====================================================================
-- 🛡️ SPORTMATCH CONNECT — CORRECCIÓN DE MODERACIÓN Y CREACIÓN DE CHATS
-- =====================================================================
-- Fecha: 2026-06-19
--
-- 1. Corrige la columna inexistente en el RPC create_direct_conversation.
-- 2. Asegura send_direct_message contra usuarios bloqueados por IA.
-- 3. Asegura la tabla messages con RLS contra usuarios bloqueados por IA.
-- =====================================================================

-- 1. CORREGIR RPC create_direct_conversation (reemplazar compatibilidad_score por compatibility_score)
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

  -- Auto-conectar: si no existe conexión del destino hacia el actual,
  -- crearla como pendiente. Esto permite iniciar chat sin match previo.
  -- Usamos 'compatibility_score' en lugar de 'compatibilidad_score'
  insert into public.player_connections (user_id, connected_user_id, sport, compatibility_score)
  values (other_user_id, current_user_id, null, null)
  on conflict (user_id, connected_user_id) do nothing;

  -- También asegurar la conexión del actual hacia el destino (si ya no existe)
  insert into public.player_connections (user_id, connected_user_id, sport, compatibility_score)
  values (current_user_id, other_user_id, null, null)
  on conflict (user_id, connected_user_id) do nothing;

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

-- 2. CORREGIR RPC send_direct_message (verificar bloqueos activos)
create or replace function public.send_direct_message(
  target_conversation_id text,
  client_message_id text,
  message_text text default '',
  message_media_url text default null,
  message_metadata jsonb default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesión para enviar mensajes';
  end if;

  -- Verificar si el usuario emisor está bloqueado
  if exists (
    select 1 from public.user_blocks
    where blocked_id = current_user_id
      and timestamp_fin > now()
  ) then
    raise exception 'Tu cuenta ha sido restringida temporalmente por actividad inusual';
  end if;

  if not public.is_conversation_participant(target_conversation_id) then
    raise exception 'No perteneces a esta conversación';
  end if;

  if nullif(trim(message_text), '') is null and message_media_url is null then
    raise exception 'El mensaje no puede estar vacío';
  end if;

  insert into public.messages (id, chat_id, sender_id, text, media_url, metadata)
  values (
    client_message_id,
    target_conversation_id,
    current_user_id,
    trim(message_text),
    message_media_url,
    message_metadata
  );

  update public.conversations
  set last_message_at = now()
  where id = target_conversation_id;

  return client_message_id;
end;
$$;

grant execute on function public.send_direct_message(text, text, text, text, jsonb) to authenticated;

-- 3. CORREGIR POLÍTICA DE INSERCIÓN RLS EN TABLA messages (verificar bloqueos activos)
drop policy if exists "messages_participants_insert" on public.messages;
create policy "messages_participants_insert"
on public.messages for insert to authenticated
with check (
  auth.uid() = sender_id
  and (
    messages.chat_id not like 'direct_%'
    or public.is_conversation_participant(messages.chat_id)
  )
  and not exists (
    select 1 from public.user_blocks
    where blocked_id = auth.uid()
      and timestamp_fin > now()
  )
);
