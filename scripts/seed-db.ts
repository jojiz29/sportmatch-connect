import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Force non-mock mode for database seeding execution
process.env.VITE_USE_MOCKS = "false";

import { createPool } from "@vercel/postgres";
import { MOCK_USERS, MOCK_COURTS } from "../src/lib/mock";

// Initialize a dedicated seeding database pool
const pool = createPool({
  connectionString: process.env.POSTGRES_URL,
});

async function seed() {
  console.log("==========================================");
  console.log("   Vercel Postgres Database Seeding       ");
  console.log("==========================================");
  
  if (!process.env.POSTGRES_URL) {
    console.error("CRITICAL ERROR: POSTGRES_URL is not defined in your environment.");
    console.log("Please define it in .env.local or check your connection settings.");
    process.exit(1);
  }

  try {
    // 1. Schema setup & PostGIS extension check
    console.log("Verifying tables and PostGIS extension...");
    await pool.query(`create extension if not exists postgis;`);

    await pool.query(`
      create table if not exists public.users (
        id varchar(100) primary key,
        created_at timestamptz default now() not null,
        name varchar(255) not null,
        age integer,
        city varchar(100),
        avatar_url text,
        bio text,
        trust_score integer default 100,
        fitcoins_balance integer default 0,
        level varchar(50) not null,
        preferred_sports varchar(100)[] default '{}'::varchar(100)[] not null,
        matches_played integer default 0,
        last_location_lat numeric,
        last_location_lng numeric,
        email varchar(255) unique,
        password varchar(255),
        user_role varchar(50) default 'PLAYER' check (user_role in ('PLAYER', 'BUSINESS')),
        company_name varchar(255),
        business_category varchar(100) check (business_category in ('Canchas', 'Gym', 'Tienda', 'Bebidas')),
        is_sponsored boolean default false
      );
    `);

    // Ensure B2B columns exist if the table was already created
    await pool.query(`
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
    `);

    await pool.query(`
      create table if not exists public.courts (
        id varchar(100) primary key,
        created_at timestamptz default now() not null,
        name varchar(255) not null,
        sport varchar(100) not null,
        price_per_hour numeric not null,
        rating numeric default 5.0 not null,
        reviews_count integer default 0 not null,
        lat numeric not null,
        lng numeric not null,
        location geography(Point, 4326) not null,
        image_url text,
        amenities varchar(100)[] default '{}'::varchar(100)[] not null,
        is_available boolean default true not null,
        address text
      );
    `);

    await pool.query(`
      create table if not exists public.followers (
        follower_id varchar(100) not null references public.users(id) on delete cascade,
        following_id varchar(100) not null references public.users(id) on delete cascade,
        created_at timestamptz default now() not null,
        primary key (follower_id, following_id),
        constraint chk_self_follow check (follower_id <> following_id)
      );
    `);

    await pool.query(`
      create table if not exists public.squads (
        id varchar(100) primary key,
        name varchar(255) not null,
        description text,
        created_at timestamptz default now() not null,
        creator_id varchar(100) not null references public.users(id) on delete cascade,
        avatar_url text
      );
    `);

    await pool.query(`
      create table if not exists public.squad_members (
        squad_id varchar(100) not null references public.squads(id) on delete cascade,
        user_id varchar(100) not null references public.users(id) on delete cascade,
        joined_at timestamptz default now() not null,
        primary key (squad_id, user_id)
      );
    `);

    await pool.query(`
      create table if not exists public.posts (
        id varchar(100) primary key,
        user_id varchar(100) not null references public.users(id) on delete cascade,
        content text not null,
        type varchar(50) not null check (type in ('MATCH_RESULT', 'PHOTO', 'SQUAD_ANNOUNCEMENT', 'TEXT')),
        created_at timestamptz default now() not null,
        media_url text,
        sport varchar(100)
      );
    `);

    await pool.query(`
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
      create index if not exists business_catalog_business_id_idx on public.business_catalog(business_id);
    `);

    await pool.query(`
      create table if not exists public.notifications (
        id varchar(100) primary key,
        user_id varchar(100) not null references public.users(id) on delete cascade,
        type varchar(50) not null check (type in ('FOLLOW', 'SQUAD_INVITE', 'TRANSACTION_SUCCESS', 'AD_IMPRESSION')),
        title varchar(255) not null,
        content text not null,
        link varchar(255),
        is_read boolean default false not null,
        created_at timestamptz default now() not null
      );
      create index if not exists notifications_user_id_idx on public.notifications(user_id);
      create index if not exists notifications_is_read_idx on public.notifications(is_read);
    `);

    // Ensure GiST index exists
    await pool.query(`create index if not exists courts_location_gist_idx on public.courts using gist(location);`);
    console.log("Tables verified successfully.");

    // 2. Seed Users
    console.log(`Seeding ${MOCK_USERS.length} mock users...`);
    for (const u of MOCK_USERS) {
      await pool.query(`
        insert into public.users (
          id, created_at, name, age, city, avatar_url, bio, trust_score, 
          fitcoins_balance, level, preferred_sports, matches_played, 
          last_location_lat, last_location_lng, email, password,
          user_role, company_name, business_category, is_sponsored
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        on conflict (id) do update set
          name = excluded.name,
          age = excluded.age,
          city = excluded.city,
          avatar_url = excluded.avatar_url,
          bio = excluded.bio,
          trust_score = excluded.trust_score,
          fitcoins_balance = excluded.fitcoins_balance,
          level = excluded.level,
          preferred_sports = excluded.preferred_sports,
          matches_played = excluded.matches_played,
          last_location_lat = excluded.last_location_lat,
          last_location_lng = excluded.last_location_lng,
          email = excluded.email,
          password = excluded.password,
          user_role = excluded.user_role,
          company_name = excluded.company_name,
          business_category = excluded.business_category,
          is_sponsored = excluded.is_sponsored;
      `, [
        u.id, u.created_at, u.name, u.age, u.city, u.avatar_url, u.bio, u.trust_score,
        u.fitcoins_balance, u.level, u.preferred_sports, u.matches_played,
        u.last_location_lat, u.last_location_lng, u.email, u.password,
        u.user_role || 'PLAYER', u.company_name || null, u.business_category || null, u.is_sponsored || false
      ]);
    }
    console.log("Users seeded successfully.");

    // 3. Seed Courts
    console.log(`Seeding ${MOCK_COURTS.length} mock courts...`);
    for (const c of MOCK_COURTS) {
      await pool.query(`
        insert into public.courts (
          id, created_at, name, sport, price_per_hour, rating, reviews_count, 
          lat, lng, location, image_url, amenities, is_available, address
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, st_setsrid(st_point($9, $8), 4326)::geography, $10, $11, $12, $13)
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
      `, [
        c.id, c.created_at, c.name, c.sport, c.price_per_hour, c.rating, c.reviews_count,
        c.lat, c.lng, c.image_url, c.amenities, c.is_available, c.address || "Dirección no especificada"
      ]);
    }
    console.log("Courts seeded successfully.");

    // 4. Seed Business Catalog
    console.log("Seeding business catalog items...");
    const MOCK_CATALOG_ITEMS = [
      {
        id: "puka-power-bottle",
        business_id: "user-puka-power",
        name: "Botella Puka Power",
        description: "Bebida energética de 500ml para máxima resistencia.",
        price: 150,
        type: "PRODUCT",
        image_url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97",
      },
      {
        id: "puka-pack-6",
        business_id: "user-puka-power",
        name: "Puka Pack (6 botellas)",
        description: "Caja de 6 botellas para compartir con tu squad.",
        price: 800,
        type: "PRODUCT",
        image_url: "https://images.unsplash.com/photo-1546429070-1fc422f1d77a",
      },
      {
        id: "puka-vip-pass",
        business_id: "user-puka-power",
        name: "Acceso VIP Arena Puka",
        description: "Entrada exclusiva para eventos de pádel patrocinados.",
        price: 2500,
        type: "SERVICE",
        image_url: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8",
      },
    ];

    for (const item of MOCK_CATALOG_ITEMS) {
      await pool.query(`
        insert into public.business_catalog (
          id, business_id, name, description, price, type, image_url
        ) values ($1, $2, $3, $4, $5, $6, $7)
        on conflict (id) do update set
          name = excluded.name,
          description = excluded.description,
          price = excluded.price,
          type = excluded.type,
          image_url = excluded.image_url;
      `, [item.id, item.business_id, item.name, item.description, item.price, item.type, item.image_url]);
    }
    console.log("Business catalog items seeded successfully.");

    // 5. Seed Sponsor Premium Post
    console.log("Seeding sponsor premium post...");
    await pool.query(`
      insert into public.posts (
        id, user_id, content, type, media_url, sport
      ) values ($1, $2, $3, $4, $5, $6)
      on conflict (id) do nothing;
    `, [
      "post-puka-power-sponsor",
      "user-puka-power",
      "¡Llegó la hora de la recarga! Con Puka Power, saca tu máximo potencial. Consigue tu Botella Puka Power en la sección de FitCoins. ⚡🔋",
      "TEXT",
      "https://images.unsplash.com/photo-1622483767028-3f66f32aef97",
      "Pádel"
    ]);
    console.log("Sponsor premium post seeded successfully.");

    console.log("==========================================");
    console.log("DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("==========================================");
  } catch (error) {
    console.error("Error seeding Vercel Postgres database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
