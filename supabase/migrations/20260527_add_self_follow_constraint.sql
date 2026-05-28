-- Migration to add check constraint preventing self-following in public.followers table

do $$
begin
  if exists (
    select 1 from information_schema.tables 
    where table_schema = 'public' and table_name = 'followers'
  ) then
    -- Add constraint only if it doesn't already exist
    if not exists (
      select 1 from information_schema.constraint_column_usage 
      where table_schema = 'public' and table_name = 'followers' and constraint_name = 'chk_self_follow'
    ) then
      alter table public.followers add constraint chk_self_follow check (follower_id <> following_id);
    end if;
  end if;
end $$;
