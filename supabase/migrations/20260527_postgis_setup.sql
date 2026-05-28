-- Enable PostGIS extension
create extension if not exists postgis with schema extensions;

-- Create courts table
create table if not exists public.courts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now() not null,
  name text not null,
  sport text not null,
  price_per_hour numeric not null,
  rating numeric default 5.0 not null,
  reviews_count integer default 0 not null,
  lat numeric not null,
  lng numeric not null,
  location geography(Point, 4326) not null,
  image_url text,
  amenities text[] default '{}'::text[] not null,
  is_available boolean default true not null,
  address text
);

-- Enable RLS
alter table public.courts enable row level security;

-- Create RLS Policies
create policy "Allow public read access to courts"
  on public.courts for select
  using (true);

-- Create GiST index for fast spatial searches
create index if not exists courts_location_gist_idx on public.courts using gist(location);

-- Seed mock courts data matching frontend mock.ts
insert into public.courts (id, name, sport, price_per_hour, rating, reviews_count, lat, lng, location, image_url, amenities, is_available, address)
values
  (
    '00000000-0000-0000-0000-000000000101',
    'Pádel Center Surco',
    'Pádel',
    40,
    4.8,
    312,
    -12.145,
    -77.0,
    st_setsrid(st_point(-77.0, -12.145), 4326)::geography,
    'https://images.unsplash.com/photo-1554068865-24cecd4e34b8',
    array['Iluminación', 'Vestuarios', 'Parking', 'Cafetería'],
    true,
    'Av. Surco 123, Santiago de Surco'
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'Complejo Deportivo Jorge Chávez',
    'Fútbol',
    120,
    4.6,
    480,
    -12.155,
    -77.005,
    st_setsrid(st_point(-77.005, -12.155), 4326)::geography,
    'https://images.unsplash.com/photo-1551958219-acbc608c6377',
    array['Pasto sintético', 'Gradas', 'Duchas'],
    true,
    'Av. Jorge Chávez 456, Santiago de Surco'
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'Tenis Club San Borja',
    'Tenis',
    35,
    4.9,
    150,
    -12.1,
    -76.99,
    st_setsrid(st_point(-76.99, -12.1), 4326)::geography,
    'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0',
    array['Polvo de ladrillo', 'Árbitro'],
    false,
    'Av. San Borja Sur 789, San Borja'
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'Pádel Rooftop Jockey',
    'Pádel',
    55,
    4.7,
    220,
    -12.085,
    -76.975,
    st_setsrid(st_point(-76.975, -12.085), 4326)::geography,
    'https://images.unsplash.com/photo-1622279457486-62dcc4a631d6',
    array['Vista panorámica', 'Alquiler de paletas'],
    true,
    'Centro Comercial Jockey Plaza, Santiago de Surco'
  ),
  (
    '00000000-0000-0000-0000-000000000105',
    'Polideportivo Limatambo',
    'Fútbol',
    80,
    4.3,
    512,
    -12.109,
    -77.012,
    st_setsrid(st_point(-77.012, -12.109), 4326)::geography,
    'https://images.unsplash.com/photo-1518605368461-1ee7e5302a40',
    array['Fútbol 7', 'Kiosko'],
    true,
    'Av. Malachowski 567, San Borja'
  )
on conflict (id) do update set
  name = excluded.name,
  sport = excluded.sport,
  price_per_hour = excluded.price_per_hour,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  lat = excluded.lat,
  lng = excluded.lng,
  location = excluded.location,
  image_url = excluded.image_url,
  amenities = excluded.amenities,
  is_available = excluded.is_available,
  address = excluded.address;

-- Create RPC function search_nearby_courts for spatial geo queries
create or replace function public.search_nearby_courts(
  latitude numeric,
  longitude numeric,
  max_distance_meters numeric default 50000
)
returns table (
  id uuid,
  created_at timestamptz,
  name text,
  sport text,
  price_per_hour numeric,
  rating numeric,
  reviews_count integer,
  lat numeric,
  lng numeric,
  image_url text,
  amenities text[],
  is_available boolean,
  address text,
  distance_km double precision
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
    st_distance(
      c.location,
      st_setsrid(st_point(longitude, latitude), 4326)::geography
    ) / 1000.0 as distance_km
  from public.courts c
  where st_dwithin(
    c.location,
    st_setsrid(st_point(longitude, latitude), 4326)::geography,
    max_distance_meters
  )
  order by distance_km asc;
end;
$$;
