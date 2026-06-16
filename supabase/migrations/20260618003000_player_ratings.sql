-- ============================================================
-- MIGRACIÓN: 20260618003000 — Player Ratings (Elo System)
-- Sprint V2.3 — Matchmaking & Elo System
-- ============================================================
-- Objetivo:
--   1. Tabla player_ratings (Elo multideporte, 1 rating por
--      usuario por deporte)
--   2. RPC calculate_elo(winner_rating, loser_rating, k_factor)
--      → fórmula Elo estándar FIDE
--   3. RPC update_elo_after_match(p_match_id)
--      → actualiza ratings de winner + losers atómicamente
-- ============================================================

-- ============================================================
-- 1. TABLA player_ratings
-- ============================================================
-- Elo inicial = 1500 (estándar FIDE para nuevos jugadores).
-- K factor por defecto = 32 (jugadores nuevos/provisionales).
-- Cada usuario tiene un registro por deporte (UNIQUE composite).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.player_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sport text NOT NULL,
  elo_rating double precision NOT NULL DEFAULT 1500.0,
  matches_played integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  last_match_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_player_ratings PRIMARY KEY (id),
  CONSTRAINT uniq_player_sport UNIQUE (user_id, sport),
  CONSTRAINT chk_elo_positive CHECK (elo_rating >= 0),
  CONSTRAINT chk_matches_non_negative CHECK (matches_played >= 0),
  CONSTRAINT chk_wins_non_negative CHECK (wins >= 0),
  CONSTRAINT chk_losses_non_negative CHECK (losses >= 0)
);

-- FKs condicionales (no fallan si profiles no existe aún)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_player_ratings_user'
    ) THEN
      ALTER TABLE public.player_ratings
      ADD CONSTRAINT fk_player_ratings_user
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_player_ratings_user_id ON public.player_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_player_ratings_sport ON public.player_ratings(sport);
CREATE INDEX IF NOT EXISTS idx_player_ratings_elo ON public.player_ratings(sport, elo_rating DESC);

-- ============================================================
-- 2. RLS en player_ratings
-- ============================================================
ALTER TABLE public.player_ratings ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'player_ratings'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.player_ratings', r.policyname);
  END LOOP;
END $$;

-- Cualquier autenticado puede ver ratings (necesario para leaderboards)
CREATE POLICY "player_ratings_select_authenticated" ON public.player_ratings
  FOR SELECT
  TO authenticated
  USING (true);

-- Solo service_role inserta/actualiza (vía RPCs)
CREATE POLICY "player_ratings_insert_service_role" ON public.player_ratings
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "player_ratings_update_service_role" ON public.player_ratings
  FOR UPDATE
  TO service_role
  USING (true);

-- ============================================================
-- 3. RPC: calculate_elo
-- ============================================================
-- Fórmula Elo estándar FIDE:
--   expected_winner = 1 / (1 + 10^((rating_loser - rating_winner) / 400))
--   new_winner = rating_winner + K * (1 - expected_winner)
--   new_loser  = rating_loser  + K * (0 - expected_loser)
--   where expected_loser = 1 - expected_winner
-- SECURITY DEFINER: el caller puede ser cualquier rol,
--   esta función es puramente matemática, sin acceso a datos.
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_elo(
  p_winner_rating double precision,
  p_loser_rating double precision,
  p_k_factor integer DEFAULT 32
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expected_winner double precision;
  v_expected_loser double precision;
  v_new_winner double precision;
  v_new_loser double precision;
  v_delta double precision;
BEGIN
  -- Validar entradas
  IF p_winner_rating IS NULL OR p_loser_rating IS NULL THEN
    RAISE EXCEPTION 'ratings cannot be NULL';
  END IF;
  IF p_k_factor <= 0 THEN
    RAISE EXCEPTION 'K factor must be positive, got %', p_k_factor;
  END IF;

  -- Expected score del ganador
  v_expected_winner := 1.0 / (1.0 + power(10.0, (p_loser_rating - p_winner_rating) / 400.0));

  -- Expected score del perdedor (complemento)
  v_expected_loser := 1.0 - v_expected_winner;

  -- Nuevos ratings
  v_new_winner := p_winner_rating + p_k_factor * (1.0 - v_expected_winner);
  v_new_loser  := p_loser_rating  + p_k_factor * (0.0 - v_expected_loser);

  -- El delta es la ganancia del ganador = pérdida del perdedor
  v_delta := v_new_winner - p_winner_rating;

  RETURN jsonb_build_object(
    'new_winner_rating', round(v_new_winner::numeric, 1),
    'new_loser_rating',  round(v_new_loser::numeric, 1),
    'rating_delta',      round(v_delta::numeric, 1),
    'expected_winner',   round(v_expected_winner::numeric, 3)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_elo(double precision, double precision, integer) TO authenticated, service_role;

-- ============================================================
-- 4. RPC: update_elo_after_match
-- ============================================================
-- Se dispara después de registrar el resultado de un partido.
-- Para cada participante que NO es el winner (losers):
--   aplica calculate_elo(winner, loser) y actualiza los ratings.
-- El winner también se actualiza comparando contra cada loser.
-- Si un usuario no tiene player_ratings para ese deporte,
--   se crea con el default 1500 automáticamente.
-- SECURITY DEFINER: necesita escribir en player_ratings.
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_elo_after_match(p_match_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sport text;
  v_winner_id uuid;
  v_winner_rating double precision;
  v_loser_record RECORD;
  v_elo_result jsonb;
  v_results jsonb[] := ARRAY[]::jsonb[];
BEGIN
  -- Obtener sport y winner del match
  SELECT m.sport, m.winner_id
  INTO v_sport, v_winner_id
  FROM public.matches m
  WHERE m.id = p_match_id;

  IF v_sport IS NULL THEN
    RAISE EXCEPTION 'Match % not found', p_match_id;
  END IF;

  IF v_winner_id IS NULL THEN
    RAISE EXCEPTION 'Match % has no winner_id set', p_match_id;
  END IF;

  -- Asegurar rating del winner (crear si no existe)
  INSERT INTO public.player_ratings (user_id, sport, elo_rating)
  VALUES (v_winner_id, v_sport, 1500.0)
  ON CONFLICT (user_id, sport) DO NOTHING;

  SELECT pr.elo_rating INTO v_winner_rating
  FROM public.player_ratings pr
  WHERE pr.user_id = v_winner_id AND pr.sport = v_sport;

  -- Procesar cada loser (participante que NO es el winner)
  FOR v_loser_record IN
    SELECT mp.user_id
    FROM public.match_participants mp
    WHERE mp.match_id = p_match_id
      AND mp.user_id != v_winner_id
  LOOP
    -- Asegurar rating del loser (crear si no existe)
    INSERT INTO public.player_ratings (user_id, sport, elo_rating)
    VALUES (v_loser_record.user_id, v_sport, 1500.0)
    ON CONFLICT (user_id, sport) DO NOTHING;

    -- Calcular nuevo Elo
    v_elo_result := public.calculate_elo(
      v_winner_rating,
      (SELECT pr.elo_rating FROM public.player_ratings pr
       WHERE pr.user_id = v_loser_record.user_id AND pr.sport = v_sport),
      32
    );

    -- Actualizar winner
    UPDATE public.player_ratings
    SET elo_rating = (v_elo_result->>'new_winner_rating')::double precision,
        matches_played = matches_played + 1,
        wins = wins + 1,
        last_match_at = now(),
        updated_at = now()
    WHERE user_id = v_winner_id AND sport = v_sport;

    -- Actualizar loser
    UPDATE public.player_ratings
    SET elo_rating = (v_elo_result->>'new_loser_rating')::double precision,
        matches_played = matches_played + 1,
        losses = losses + 1,
        last_match_at = now(),
        updated_at = now()
    WHERE user_id = v_loser_record.user_id AND sport = v_sport;

    -- El nuevo rating del winner es la base para el siguiente loser
    v_winner_rating := (v_elo_result->>'new_winner_rating')::double precision;

    -- Acumular resultado
    v_results := array_append(v_results, jsonb_build_object(
      'loser_id', v_loser_record.user_id,
      'winner_new', v_elo_result->'new_winner_rating',
      'loser_new', v_elo_result->'new_loser_rating',
      'delta', v_elo_result->'rating_delta'
    ));
  END LOOP;

  RETURN jsonb_build_object(
    'match_id', p_match_id,
    'sport', v_sport,
    'winner_id', v_winner_id,
    'results', to_jsonb(v_results)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_elo_after_match(uuid) TO authenticated, service_role;

-- NOTIFY PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
