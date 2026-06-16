-- =====================================================================
-- ⚙️ SPORTMATCH CONNECT — USER PREFERENCES, BLOCKS & SESSIONS
-- =====================================================================
-- Fecha: 2026-06-16
-- Issue: No existe una vista de Configuración para el usuario.
--        Esta migración crea la infraestructura completa:
--        - user_preferences: 1 fila por usuario con todas las prefs
--        - user_blocks: usuarios bloqueados
--        - user_sessions: sesiones activas del usuario (para "cerrar otras")
--
-- FIX 16-jun-2026: vista de Settings completa al estilo de redes sociales
-- modernas (Instagram, TikTok, LinkedIn).
-- =====================================================================

-- ============================================================
-- 1. TABLA: user_preferences
-- ============================================================
create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,

  -- === PRIVACIDAD ===
  profile_visibility text not null default 'public'
    check (profile_visibility in ('public', 'squads_only', 'private')),
  show_fitcoins_balance boolean not null default true,
  show_trust_score boolean not null default true,
  show_email boolean not null default false,
  show_phone boolean not null default false,
  show_last_seen boolean not null default true,
  show_match_history boolean not null default true,
  allow_messages_from text not null default 'everyone'
    check (allow_messages_from in ('everyone', 'squads_only', 'nobody')),

  -- === NOTIFICACIONES (canales) ===
  notif_push_enabled boolean not null default true,
  notif_email_enabled boolean not null default true,
  notif_inapp_enabled boolean not null default true,
  notif_sound_enabled boolean not null default true,

  -- === NOTIFICACIONES (tipos) ===
  notif_squad_invites boolean not null default true,
  notif_match_requests boolean not null default true,
  notif_chat_messages boolean not null default true,
  notif_followers boolean not null default true,
  notif_rewards boolean not null default true,
  notif_marketing boolean not null default false,
  notif_weekly_digest boolean not null default true,

  -- === APARIENCIA ===
  theme text not null default 'system'
    check (theme in ('system', 'light', 'dark', 'world_cup', 'neon')),
  ui_density text not null default 'comfortable'
    check (ui_density in ('compact', 'comfortable', 'spacious')),
  reduce_motion boolean not null default false,
  high_contrast boolean not null default false,

  -- === SQUADS / MATCHES ===
  matchmaking_radius_km int not null default 25
    check (matchmaking_radius_km between 1 and 100),
  auto_accept_squad_invites boolean not null default false,
  preferred_match_sport text,
  show_me_in_squad_search boolean not null default true,

  -- === IDIOMA / REGIÓN ===
  language text not null default 'es'
    check (language in ('es', 'en', 'pt')),
  timezone text not null default 'America/Lima',
  units_distance text not null default 'km'
    check (units_distance in ('km', 'mi')),

  -- === SEGURIDAD ===
  two_factor_enabled boolean not null default false,
  login_alerts_enabled boolean not null default true,

  -- === META ===
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "user_prefs_read_own" on public.user_preferences;
create policy "user_prefs_read_own" on public.user_preferences
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_prefs_modify_own" on public.user_preferences;
create policy "user_prefs_modify_own" on public.user_preferences
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 2. TABLA: user_blocks (usuarios bloqueados)
-- ============================================================
create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_different_users check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocker_idx
  on public.user_blocks (blocker_id, created_at desc);

alter table public.user_blocks enable row level security;

drop policy if exists "user_blocks_own_all" on public.user_blocks;
create policy "user_blocks_own_all" on public.user_blocks
  for all to authenticated
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

-- ============================================================
-- 3. TABLA: user_sessions (sesiones activas del usuario)
-- ============================================================
create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  device_label text,
  user_agent text,
  ip_address text,
  last_active_at timestamptz not null default now(),
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists user_sessions_user_idx
  on public.user_sessions (user_id, last_active_at desc);

alter table public.user_sessions enable row level security;

drop policy if exists "user_sessions_own_read" on public.user_sessions;
create policy "user_sessions_own_read" on public.user_sessions
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_sessions_own_modify" on public.user_sessions;
create policy "user_sessions_own_modify" on public.user_sessions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- 4.1. Crear fila de prefs por defecto al registrarse
create or replace function public.create_default_user_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created_defaults on public.profiles;
create trigger on_profile_created_defaults
  after insert on public.profiles
  for each row
  execute procedure public.create_default_user_preferences();

-- 4.2. Updated_at para user_preferences
drop trigger if exists user_prefs_updated_at on public.user_preferences;
create trigger user_prefs_updated_at
  before update on public.user_preferences
  for each row
  execute procedure public.set_updated_at();

-- 4.3. Backfill: crear prefs para usuarios existentes
insert into public.user_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;
