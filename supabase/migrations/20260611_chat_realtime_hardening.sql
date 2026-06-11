-- Garantiza que Supabase Realtime publique mensajes nuevos y actualizaciones
-- completas para lectura, vistos y sincronización entre sesiones.

alter table public.messages replica identity full;

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
end $$;
