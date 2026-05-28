-- Migration for B2B Portal (Business Tier) (SCRUM-60)

-- 1. Add B2B fields to public.users table if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'user_role') then
    alter table public.users add column user_role varchar(50) default 'PLAYER' check (user_role in ('PLAYER', 'BUSINESS'));
  end if;
  
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'company_name') then
    alter table public.users add column company_name varchar(255);
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'business_category') then
    alter table public.users add column business_category varchar(100) check (business_category in ('Canchas', 'Gym', 'Tienda', 'Bebidas'));
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'users' and column_name = 'is_sponsored') then
    alter table public.users add column is_sponsored boolean default false;
  end if;
end $$;

-- 2. Create business_catalog table
create table if not exists public.business_catalog (
  id varchar(100) primary key,
  business_id varchar(100) not null references public.users(id) on delete cascade,
  name varchar(255) not null,
  description text,
  price numeric not null check (price >= 0),
  type varchar(50) not null check (type in ('PRODUCT', 'SERVICE')),
  image_url text,
  created_at timestamptz default now() not null
);

-- 3. Create Indexes for performance
create index if not exists business_catalog_business_id_idx on public.business_catalog(business_id);
