-- Enable Row Level Security on the posts table
alter table public.posts enable row level security;

-- Policy to allow authenticated users to view posts
drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all"
on public.posts
for select
to authenticated
using (true);

-- Policy to allow authenticated users to create their own posts
drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
on public.posts
for insert
to authenticated
with check (
  auth.uid()::text = user_id::text 
  or auth.uid()::text = user_id
);
