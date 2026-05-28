-- Migration to create posts, squads, and squad_members tables for community V2 (SCRUM-53 & SCRUM-54)

-- 1. Create squads table
create table if not exists public.squads (
  id varchar(100) primary key,
  name varchar(255) not null,
  description text,
  created_at timestamptz default now() not null,
  creator_id varchar(100) not null references public.users(id) on delete cascade,
  avatar_url text
);

-- 2. Create squad_members many-to-many relationship
create table if not exists public.squad_members (
  squad_id varchar(100) not null references public.squads(id) on delete cascade,
  user_id varchar(100) not null references public.users(id) on delete cascade,
  joined_at timestamptz default now() not null,
  primary key (squad_id, user_id)
);

-- 3. Create posts table
create table if not exists public.posts (
  id varchar(100) primary key,
  user_id varchar(100) not null references public.users(id) on delete cascade,
  content text not null,
  type varchar(50) not null check (type in ('MATCH_RESULT', 'PHOTO', 'SQUAD_ANNOUNCEMENT', 'TEXT')),
  created_at timestamptz default now() not null,
  media_url text,
  sport varchar(100)
);

-- 4. Create Indexes for performance
create index if not exists posts_user_id_idx on public.posts(user_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists squads_creator_id_idx on public.squads(creator_id);
create index if not exists squad_members_user_id_idx on public.squad_members(user_id);
