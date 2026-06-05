-- Migration: post_comments and post_comment_reactions tables for community engagement
-- Simplified version without FK dependencies to work with existing schema

-- 1. Create post_comments table (supports threaded replies)
create table if not exists public.post_comments (
  id varchar(100) primary key,
  post_id varchar(100) not null,
  user_id varchar(100) not null,
  content text not null,
  created_at timestamptz default now() not null,
  parent_id varchar(100)
);

-- 2. Create post_comment_reactions table (emoji reactions)
create table if not exists public.post_comment_reactions (
  id varchar(100) primary key,
  comment_id varchar(100) not null,
  user_id varchar(100) not null,
  reaction_type varchar(20) not null check (reaction_type in ('LIKE', 'DISLIKE', '❤️', '🔥', '👏', '😂', '😢', '🎉')),
  created_at timestamptz default now() not null,
  unique (comment_id, user_id)
);

-- 3. Create Indexes
create index if not exists post_comments_post_id_idx on public.post_comments(post_id);
create index if not exists post_comments_user_id_idx on public.post_comments(user_id);
create index if not exists post_comments_parent_id_idx on public.post_comments(parent_id);
create index if not exists post_comment_reactions_comment_id_idx on public.post_comment_reactions(comment_id);
create index if not exists post_comment_reactions_user_id_idx on public.post_comment_reactions(user_id);

-- 4. Add self-referencing constraint for threaded replies
alter table public.post_comments add constraint post_comments_parent_id_fkey
  foreign key (parent_id) references public.post_comments(id) on delete cascade;

-- 5. RLS Policies
alter table public.post_comments enable row level security;
alter table public.post_comment_reactions enable row level security;

-- Allow anyone to read comments
create policy "Anyone can view comments"
  on public.post_comments for select
  using (true);

-- Allow authenticated users to create comments
create policy "Authenticated users can create comments"
  on public.post_comments for insert
  with check (auth.role() = 'authenticated');

-- Allow users to delete their own comments
create policy "Users can delete own comments"
  on public.post_comments for delete
  using (auth.uid() = user_id);

-- Allow anyone to view reactions
create policy "Anyone can view reactions"
  on public.post_comment_reactions for select
  using (true);

-- Allow authenticated users to add reactions
create policy "Authenticated users can add reactions"
  on public.post_comment_reactions for insert
  with check (auth.role() = 'authenticated');

-- Allow users to delete their own reactions
create policy "Users can delete own reactions"
  on public.post_comment_reactions for delete
  using (auth.uid() = user_id);