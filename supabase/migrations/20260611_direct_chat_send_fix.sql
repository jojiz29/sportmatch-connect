-- Envío atómico para chats directos. El RPC valida participación antes de insertar
-- y evita que errores de políticas RLS dejen mensajes únicamente en el navegador.

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

grant execute on function public.send_direct_message(text, text, text, text, jsonb)
to authenticated;
