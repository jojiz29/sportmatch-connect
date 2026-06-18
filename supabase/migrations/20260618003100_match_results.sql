-- ============================================================
-- MIGRACIÓN: 20260618003100 — Match results
-- Sprint V2.3 — Matchmaking & Elo System
-- ============================================================
-- Objetivo:
--   1. ALTER matches: añadir winner_id, score_home, score_away
--   2. Normalizar status de matches (OPEN/FINISHED/CANCELLED)
--   3. RPC record_match_result → cierra match + dispara Elo
-- ============================================================

-- ============================================================
-- 1. ALTER TABLE matches
-- ============================================================
DO $$
BEGIN
  -- winner_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'winner_id'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN winner_id uuid;
  END IF;

  -- score_home
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'score_home'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN score_home integer;
  END IF;

  -- score_away
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'score_away'
  ) THEN
    ALTER TABLE public.matches ADD COLUMN score_away integer;
  END IF;
END $$;

-- FK condicional a profiles para winner_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_matches_winner'
  ) THEN
    ALTER TABLE public.matches
    ADD CONSTRAINT fk_matches_winner
      FOREIGN KEY (winner_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 2. Normalizar status
-- ============================================================
-- Eliminar la constraint de status heredada si existe
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_status_check;

-- Convertir NULL, capitalizados y heredados a la nueva convención en mayúsculas
UPDATE public.matches SET status = 'OPEN' WHERE status IS NULL OR UPPER(status) = 'OPEN' OR UPPER(status) = 'FULL';
UPDATE public.matches SET status = 'FINISHED' WHERE UPPER(status) = 'FINISHED';
UPDATE public.matches SET status = 'CANCELLED' WHERE UPPER(status) = 'CANCELLED';

-- Agregar CHECK constraint si no existe
DO $$
BEGIN
  -- Intentar crear la constraint
  BEGIN
    ALTER TABLE public.matches
    ADD CONSTRAINT chk_matches_status
      CHECK (status IN ('OPEN', 'FINISHED', 'CANCELLED'));
  EXCEPTION
    WHEN duplicate_object THEN
      -- La constraint ya existe, ignorar
      NULL;
  END;
END $$;

-- Agregar DEFAULT si no tiene
ALTER TABLE public.matches ALTER COLUMN status SET DEFAULT 'OPEN';

-- ============================================================
-- 3. Índices de soporte
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_sport_status ON public.matches(sport, status);

-- ============================================================
-- 4. RPC: record_match_result
-- ============================================================
-- Cierra un partido registrando ganador y marcador.
-- Llama internamente a update_elo_after_match para actualizar
-- los ratings de todos los participantes.
-- Validaciones:
--   - El match debe existir y estar en status 'OPEN'
--   - El winner_id debe ser un participante confirmado
--   - Los scores deben ser >= 0
-- SECURITY DEFINER: necesita escribir en matches, match_participants
--   y player_ratings (vía update_elo_after_match).
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_match_result(
  p_match_id uuid,
  p_winner_id uuid,
  p_score_home integer DEFAULT NULL,
  p_score_away integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_match RECORD;
  v_participant_count integer;
  v_elo_result jsonb;
BEGIN
  -- Validar match existe y está OPEN
  SELECT m.id, m.sport, m.status, m.winner_id AS existing_winner
  INTO v_match
  FROM public.matches m
  WHERE m.id = p_match_id;

  IF v_match.id IS NULL THEN
    RAISE EXCEPTION 'Match % not found', p_match_id;
  END IF;

  IF v_match.status != 'OPEN' THEN
    RAISE EXCEPTION 'Match % is not OPEN (current status: %)', p_match_id, v_match.status;
  END IF;

  IF v_match.existing_winner IS NOT NULL THEN
    RAISE EXCEPTION 'Match % already has a winner', p_match_id;
  END IF;

  -- Validar que el winner es participante
  SELECT COUNT(*) INTO v_participant_count
  FROM public.match_participants mp
  WHERE mp.match_id = p_match_id AND mp.user_id = p_winner_id;

  IF v_participant_count = 0 THEN
    RAISE EXCEPTION 'User % is not a participant of match %', p_winner_id, p_match_id;
  END IF;

  -- Validar scores (si se proveen)
  IF p_score_home IS NOT NULL AND p_score_home < 0 THEN
    RAISE EXCEPTION 'score_home must be >= 0, got %', p_score_home;
  END IF;

  IF p_score_away IS NOT NULL AND p_score_away < 0 THEN
    RAISE EXCEPTION 'score_away must be >= 0, got %', p_score_away;
  END IF;

  -- Actualizar match
  UPDATE public.matches
  SET winner_id = p_winner_id,
      score_home = p_score_home,
      score_away = p_score_away,
      status = 'FINISHED'
  WHERE id = p_match_id;

  -- Disparar actualización de Elo
  v_elo_result := public.update_elo_after_match(p_match_id);

  RETURN jsonb_build_object(
    'match_id', p_match_id,
    'winner_id', p_winner_id,
    'score_home', p_score_home,
    'score_away', p_score_away,
    'status', 'FINISHED',
    'elo_results', v_elo_result->'results'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_match_result(uuid, uuid, integer, integer) TO authenticated, service_role;

-- NOTIFY PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
