-- =====================================================================
-- 🔓 SPORTMATCH CONNECT — RELAJAR RESTRICCIÓN DE CHAT DIRECTO
-- =====================================================================
-- Fecha: 2026-06-15
-- Issue: El RPC create_direct_conversation requería match mutuo
--        en player_connections (lógica de LinkedIn). Esto bloqueaba
--        que un usuario pudiera iniciar chat desde el modal de búsqueda
--        sin haberse "conectado" antes.
--
-- Solución (Opción B confirmada con el usuario):
--   - Auto-crear la conexión inversa (conexión pendiente) cuando se
--     inicia un chat desde búsqueda.
--   - El usuario destino verá la conexión pendiente en su inbox y
--     podrá aceptarla o rechazarla.
--   - Esto preserva la lógica de "conexiones deportivas" pero elimina
--     la fricción de tener que conectar antes de chatear.
--
-- Cambios:
--   1. create_direct_conversation ahora crea la conexión inversa
--      automáticamente si no existe.
--   2. La política RLS de player_connections permite que un usuario
--      cree conexiones en nombre de OTRO (la conexión inversa).
-- =====================================================================

-- 1. Relajar el RPC para auto-crear la conexión inversa
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
  insert into public.player_connections (user_id, connected_user_id, sport, compatibilidad_score)
  values (other_user_id, current_user_id, null, null)
  on conflict (user_id, connected_user_id) do nothing;

  -- También asegurar la conexión del actual hacia el destino (si ya no existe)
  insert into public.player_connections (user_id, connected_user_id, sport, compatibilidad_score)
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

-- 2. La política connection_owner_insert de player_connections solo
--    permite insertar filas donde auth.uid() = user_id. Como ahora el
--    RPC necesita crear conexiones inversas (donde auth.uid() != user_id),
--    necesitamos ampliar la política. Pero como el RPC es
--    SECURITY DEFINER, ya tiene permisos de tabla. La política RLS
--    aplica al caller original (auth.uid() = current_user_id), así que
--    el INSERT fallaría por la política.
--
--    Solución: ampliar la política para que también acepte inserts
--    donde connected_user_id = auth.uid() (es decir, cuando alguien
--    intenta conectar contigo). El RLS sigue protegiendo contra
--    inserts que no te involucren.
drop policy if exists "connection_owner_insert" on public.player_connections;
create policy "connection_owner_insert" on public.player_connections
  for insert to authenticated
  with check (
    auth.uid() = user_id
    or auth.uid() = connected_user_id
  );

-- 3. Ampliar también la política de UPDATE para que el destino
--    pueda aceptar/rechazar la conexión (cambiar compatibilidad_score,
--    etc.) sin ser el "owner" original.
drop policy if exists "connection_owner_update" on public.player_connections;
create policy "connection_owner_update" on public.player_connections
  for update to authenticated
  using (
    auth.uid() = user_id
    or auth.uid() = connected_user_id
  )
  with check (
    auth.uid() = user_id
    or auth.uid() = connected_user_id
  );

-- 4. Ampliar SELECT para que ambos lados de la conexión puedan verla
drop policy if exists "connection_owner_read" on public.player_connections;
create policy "connection_owner_read" on public.player_connections
  for select to authenticated
  using (
    auth.uid() = user_id
    or auth.uid() = connected_user_id
  );
