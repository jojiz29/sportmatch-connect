-- Vercel Postgres Relational and Spatial Schema Setup

-- 1. Enable PostGIS extension for spatial geography queries
create extension if not exists postgis;

-- 2. Create users table (compatible with both mock text IDs and standard UUIDs)
create table if not exists public.users (
  id varchar(100) primary key,
  created_at timestamptz default now() not null,
  name varchar(255) not null,
  age integer check (age >= 0),
  city varchar(100),
  avatar_url text,
  bio text,
  trust_score integer default 100 check (trust_score between 0 and 100),
  fitcoins_balance integer default 0 check (fitcoins_balance >= 0),
  level varchar(50) not null, -- Principiante | Intermedio | Avanzado | Elite
  preferred_sports varchar(100)[] default '{}'::varchar(100)[] not null,
  matches_played integer default 0 check (matches_played >= 0),
  last_location_lat numeric,
  last_location_lng numeric,
  email varchar(255) unique,
  password varchar(255)
);

-- 3. Create courts table with PostGIS geography point support
create table if not exists public.courts (
  id varchar(100) primary key,
  created_at timestamptz default now() not null,
  name varchar(255) not null,
  sport varchar(100) not null,
  price_per_hour numeric not null check (price_per_hour >= 0),
  rating numeric default 5.0 check (rating between 0.0 and 5.0) not null,
  reviews_count integer default 0 check (reviews_count >= 0) not null,
  lat numeric not null,
  lng numeric not null,
  location geography(Point, 4326) not null,
  image_url text,
  amenities varchar(100)[] default '{}'::varchar(100)[] not null,
  is_available boolean default true not null,
  address text
);

-- 4. Create followers table representing the V2 Social Graph
create table if not exists public.followers (
  follower_id varchar(100) not null references public.users(id) on delete cascade,
  following_id varchar(100) not null references public.users(id) on delete cascade,
  created_at timestamptz default now() not null,
  primary key (follower_id, following_id),
  constraint chk_self_follow check (follower_id <> following_id)
);

-- 5. Create Indexes for optimization

-- Spatial GiST index for ultra-fast geographical proximity queries
create index if not exists courts_location_gist_idx on public.courts using gist(location);

-- B-Tree index for looking up followers quickly (Social Graph V2)
create index if not exists followers_follower_id_idx on public.followers(follower_id);
create index if not exists followers_following_id_idx on public.followers(following_id);

-- Index on sports filtering
create index if not exists courts_sport_idx on public.courts(sport);
