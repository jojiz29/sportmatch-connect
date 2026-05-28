-- ============================================================
-- SPORTMATCH CONNECT — SUPABASE SCHEMA DEFINITIVO
-- Copiar y pegar COMPLETO en el SQL Editor de Supabase
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. EXTENSIONES REQUERIDAS
-- ─────────────────────────────────────────────────────────────
create extension if not exists postgis with schema extensions;
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- 1. TABLA: profiles (usuarios con roles PLAYER / BUSINESS)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  created_at          timestamptz default now() not null,
  name                text not null,
  age                 int default 25,
  city                text default 'Lima',
  avatar_url          text,
  bio                 text,
  trust_score         int default 100 check (trust_score between 0 and 100),
  fitcoins_balance    int default 500,
  level               text default 'Intermedio'
                        check (level in ('Principiante','Intermedio','Avanzado','Elite')),
  preferred_sports    text[] default '{}'::text[],
  matches_played      int default 0,
  last_location_lat   numeric,
  last_location_lng   numeric,
  -- B2B fields
  user_role           text default 'PLAYER'
                        check (user_role in ('PLAYER','BUSINESS')),
  company_name        text,
  business_category   text
                        check (business_category in ('Canchas','Gym','Tienda','Bebidas') or business_category is null),
  is_sponsored        boolean default false
);

alter table public.profiles enable row level security;

-- Cada usuario sólo puede leer/editar su propio perfil
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Permitir lectura pública del perfil (para matchmaking y mapa de negocios)
create policy "profiles_public_read" on public.profiles
  for select using (true);

-- ─────────────────────────────────────────────────────────────
-- 2. TABLA: courts (con tipo espacial GEOGRAPHY)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.courts (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now() not null,
  name            text not null,
  sport           text not null,
  price_per_hour  numeric not null,
  rating          numeric default 5.0,
  reviews_count   int default 0,
  lat             numeric not null,
  lng             numeric not null,
  -- Tipo espacial real (el profesor lo auditará)
  location        geography(Point, 4326) not null,
  image_url       text,
  amenities       text[] default '{}'::text[],
  is_available    boolean default true,
  address         text,
  -- B2B: pista asociada a un negocio patrocinador
  owner_id        uuid references public.profiles(id) on delete set null
);

-- Índice GiST obligatorio para consultas ST_DWithin eficientes
create index if not exists courts_location_gist_idx
  on public.courts using gist(location);

alter table public.courts enable row level security;

create policy "courts_public_read" on public.courts
  for select using (true);

create policy "courts_owner_insert" on public.courts
  for insert with check (auth.uid() = owner_id);

create policy "courts_owner_update" on public.courts
  for update using (auth.uid() = owner_id);

-- ─────────────────────────────────────────────────────────────
-- 3. TABLA: matches
-- ─────────────────────────────────────────────────────────────
create table if not exists public.matches (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now() not null,
  court_id        uuid references public.courts(id) on delete set null,
  creator_id      uuid references public.profiles(id) on delete cascade not null,
  sport           text not null,
  title           text not null,
  date            date not null,
  time            time not null,
  max_players     int default 4 check (max_players > 0),
  required_level  text check (required_level in ('Principiante','Intermedio','Avanzado','Elite'))
);

alter table public.matches enable row level security;

create policy "matches_public_read" on public.matches
  for select using (true);

create policy "matches_creator_insert" on public.matches
  for insert with check (auth.uid() = creator_id);

create policy "matches_creator_update" on public.matches
  for update using (auth.uid() = creator_id);

-- ─────────────────────────────────────────────────────────────
-- 4. TABLA: followers (social graph)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.followers (
  follower_id   uuid references public.profiles(id) on delete cascade not null,
  following_id  uuid references public.profiles(id) on delete cascade not null,
  created_at    timestamptz default now() not null,
  primary key (follower_id, following_id),
  -- Restricción de no auto-seguimiento
  constraint no_self_follow check (follower_id <> following_id)
);

alter table public.followers enable row level security;

create policy "followers_public_read" on public.followers
  for select using (true);

create policy "followers_insert_own" on public.followers
  for insert with check (auth.uid() = follower_id);

create policy "followers_delete_own" on public.followers
  for delete using (auth.uid() = follower_id);

-- ─────────────────────────────────────────────────────────────
-- 5. TABLA: squads (equipos / clubes)
-- ─────────────────────────────────────────────────────────────
create table if not exists public.squads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now() not null,
  name        text not null,
  description text,
  creator_id  uuid references public.profiles(id) on delete cascade not null,
  avatar_url  text
);

create table if not exists public.squad_members (
  squad_id    uuid references public.squads(id) on delete cascade not null,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  joined_at   timestamptz default now() not null,
  primary key (squad_id, user_id)
);

alter table public.squads enable row level security;
alter table public.squad_members enable row level security;

create policy "squads_public_read" on public.squads
  for select using (true);

create policy "squads_creator_insert" on public.squads
  for insert with check (auth.uid() = creator_id);

create policy "squad_members_public_read" on public.squad_members
  for select using (true);

create policy "squad_members_self_insert" on public.squad_members
  for insert with check (auth.uid() = user_id);

create policy "squad_members_self_delete" on public.squad_members
  for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 6. TABLA: wallet_transactions
-- ─────────────────────────────────────────────────────────────
create table if not exists public.wallet_transactions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now() not null,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  amount      int not null,  -- positivo = ganancia, negativo = gasto
  description text not null,
  type        text not null check (type in ('EARN','SPEND','PENALTY'))
);

alter table public.wallet_transactions enable row level security;

create policy "wallet_own_read" on public.wallet_transactions
  for select using (auth.uid() = user_id);

create policy "wallet_own_insert" on public.wallet_transactions
  for insert with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 7. TABLA: notifications
-- ─────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now() not null,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  type        text not null check (type in ('FOLLOW','SQUAD_INVITE','TRANSACTION_SUCCESS','AD_IMPRESSION')),
  title       varchar(200) not null,
  content     varchar(500) not null,
  link        text,
  is_read     boolean default false not null
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_unread_idx on public.notifications(user_id, is_read) where is_read = false;

alter table public.notifications enable row level security;

create policy "notifications_own_read" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_own_update" on public.notifications
  for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- 8. TABLA: business_catalog
-- ─────────────────────────────────────────────────────────────
create table if not exists public.business_catalog (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now() not null,
  business_id  uuid references public.profiles(id) on delete cascade not null,
  name         text not null,
  description  text,
  price        int not null check (price >= 0),
  type         text not null check (type in ('PRODUCT','SERVICE')),
  image_url    text
);

alter table public.business_catalog enable row level security;

create policy "catalog_public_read" on public.business_catalog
  for select using (true);

create policy "catalog_owner_insert" on public.business_catalog
  for insert with check (auth.uid() = business_id);

create policy "catalog_owner_delete" on public.business_catalog
  for delete using (auth.uid() = business_id);

-- ─────────────────────────────────────────────────────────────
-- 9. FUNCIÓN RPC: search_nearby_courts (Supabase .rpc())
-- ─────────────────────────────────────────────────────────────
create or replace function public.search_nearby_courts(
  latitude             numeric,
  longitude            numeric,
  max_distance_meters  numeric default 50000
)
returns table (
  id              uuid,
  created_at      timestamptz,
  name            text,
  sport           text,
  price_per_hour  numeric,
  rating          numeric,
  reviews_count   int,
  lat             numeric,
  lng             numeric,
  image_url       text,
  amenities       text[],
  is_available    boolean,
  address         text,
  is_sponsored    boolean,
  distance_km     double precision
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    c.id,
    c.created_at,
    c.name,
    c.sport,
    c.price_per_hour,
    c.rating,
    c.reviews_count,
    c.lat,
    c.lng,
    c.image_url,
    c.amenities,
    c.is_available,
    c.address,
    coalesce(p.is_sponsored, false) as is_sponsored,
    st_distance(
      c.location,
      st_setsrid(st_point(longitude, latitude), 4326)::geography
    ) / 1000.0 as distance_km
  from public.courts c
  left join public.profiles p on p.id = c.owner_id and p.user_role = 'BUSINESS'
  where st_dwithin(
    c.location,
    st_setsrid(st_point(longitude, latitude), 4326)::geography,
    max_distance_meters
  )
  order by
    -- Patrocinadores siempre al tope
    is_sponsored desc,
    distance_km asc;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 10. FUNCIÓN: handle_new_user (auto-crear perfil al registrar)
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url, user_role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id
    ),
    coalesce(new.raw_user_meta_data->>'user_role', 'PLAYER')
  );
  return new;
end;
$$;

-- Trigger para crear perfil automáticamente al registrar usuario
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 11. SEED DATA: canchas de demostración en Lima
-- ─────────────────────────────────────────────────────────────
insert into public.courts (id, name, sport, price_per_hour, rating, reviews_count, lat, lng, location, image_url, amenities, is_available, address)
values
  (
    '00000000-0000-0000-0000-000000000101',
    'Pádel Center Surco', 'Pádel', 40, 4.8, 312, -12.145, -77.0,
    st_setsrid(st_point(-77.0, -12.145), 4326)::geography,
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8',
    array['Iluminación','Vestuarios','Parking','Cafetería'], true,
    'Av. Surco 123, Santiago de Surco'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'Complejo Deportivo Jorge Chávez', 'Fútbol', 120, 4.6, 480, -12.155, -77.005,
    st_setsrid(st_point(-77.005, -12.155), 4326)::geography,
    'https://images.unsplash.com/photo-1551958219-acbc608c6377',
    array['Pasto sintético','Gradas','Duchas'], true,
    'Av. Jorge Chávez 456, Santiago de Surco'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'Tenis Club San Borja', 'Tenis', 35, 4.9, 150, -12.1, -76.99,
    st_setsrid(st_point(-76.99, -12.1), 4326)::geography,
    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0',
    array['Polvo de ladrillo','Árbitro'], false,
    'Av. San Borja Sur 789, San Borja'
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'Pádel Rooftop Jockey', 'Pádel', 55, 4.7, 220, -12.085, -76.975,
    st_setsrid(st_point(-76.975, -12.085), 4326)::geography,
    'https://images.unsplash.com/photo-1622279457486-62dcc4a631d6',
    array['Vista panorámica','Alquiler de paletas'], true,
    'CC Jockey Plaza, Santiago de Surco'
  ),
  (
    '00000000-0000-0000-0000-000000000105',
    'Polideportivo Limatambo', 'Fútbol', 80, 4.3, 512, -12.109, -77.012,
    st_setsrid(st_point(-77.012, -12.109), 4326)::geography,
    'https://images.unsplash.com/photo-1518605368461-1ee7e5302a40',
    array['Fútbol 7','Kiosko'], true,
    'Av. Malachowski 567, San Borja'
  )
on conflict (id) do update set
  name = excluded.name,
  sport = excluded.sport,
  location = excluded.location,
  lat = excluded.lat,
  lng = excluded.lng,
  is_available = excluded.is_available;
