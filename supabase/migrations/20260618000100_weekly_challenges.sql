-- ============================================================
-- Migration: Weekly Challenges System
-- Fecha: 2026-06-18
--
-- 1. Tabla weekly_challenges con restricciones
-- 2. RPC claim_weekly_challenge (SECURITY DEFINER)
--    - Valida propiedad, completitud, no duplicado
--    - Otorga XP via add_user_xp()
--    - Otorga FitCoins via wallet_transactions
-- 3. RPC generate_weekly_challenges (SECURITY DEFINER)
--    - Genera 3 desafíos por usuario (service_role only)
-- 4. RPC get_weekly_challenges (SECURITY DEFINER)
--    - Obtiene desafíos del usuario para la semana actual
-- 5. RLS policies estrictas
-- ============================================================

-- 1. Tabla weekly_challenges
CREATE TABLE public.weekly_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::DATE,
  challenge_type TEXT NOT NULL CHECK (
    challenge_type IN (
      'play_matches',
      'win_matches',
      'book_courts',
      'invite_friends',
      'maintain_streak',
      'earn_xp'
    )
  ),
  goal INTEGER NOT NULL CHECK (goal > 0),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  reward_xp INTEGER NOT NULL CHECK (reward_xp > 0),
  reward_fitcoins INTEGER NOT NULL DEFAULT 0 CHECK (reward_fitcoins >= 0),
  description TEXT DEFAULT '',
  claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT unique_user_week_type UNIQUE (user_id, week_start, challenge_type),
  CONSTRAINT progress_not_exceed_goal CHECK (progress <= goal)
);

CREATE INDEX idx_weekly_challenges_user_week
  ON weekly_challenges(user_id, week_start);

CREATE INDEX idx_weekly_challenges_claimed
  ON weekly_challenges(claimed)
  WHERE claimed = false;

COMMENT ON TABLE weekly_challenges IS
  'Desafíos semanales personalizados por usuario';
COMMENT ON COLUMN weekly_challenges.challenge_type IS
  'Tipo de desafío: play_matches, win_matches, book_courts, invite_friends, maintain_streak, earn_xp';
COMMENT ON COLUMN weekly_challenges.week_start IS
  'Fecha de inicio de la semana (ISO, lunes)';

-- 2. RLS
ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own challenges"
  ON weekly_challenges
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own challenges"
  ON weekly_challenges
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert challenges"
  ON weekly_challenges
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

-- 3. RPC: Reclamar desafío completado
CREATE OR REPLACE FUNCTION claim_weekly_challenge(
  p_challenge_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge weekly_challenges%ROWTYPE;
  v_xp_result RECORD;
  v_result jsonb;
BEGIN
  -- Validar propiedad
  SELECT * INTO v_challenge
  FROM weekly_challenges
  WHERE id = p_challenge_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Desafío no encontrado'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_challenge.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Este desafío no te pertenece'
      USING ERRCODE = '42501';
  END IF;

  IF v_challenge.claimed THEN
    RAISE EXCEPTION 'Este desafío ya fue reclamado anteriormente'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_challenge.progress < v_challenge.goal THEN
    RAISE EXCEPTION 'El desafío aún no está completo (progreso: % de %)',
      v_challenge.progress, v_challenge.goal
      USING ERRCODE = 'P0001';
  END IF;

  -- Marcar como reclamado
  UPDATE weekly_challenges
  SET claimed = true,
      completed_at = now()
  WHERE id = p_challenge_id;

  -- Otorgar XP via función existente
  PERFORM add_user_xp(auth.uid(), v_challenge.reward_xp);

  -- Otorgar FitCoins si aplica
  IF v_challenge.reward_fitcoins > 0 THEN
    INSERT INTO wallet_transactions (
      user_id,
      amount,
      type,
      description,
      created_at
    ) VALUES (
      auth.uid(),
      v_challenge.reward_fitcoins,
      'EARN',
      format('Recompensa desafío semanal: %s', v_challenge.description),
      now()
    );
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'xp_gained', v_challenge.reward_xp,
    'fitcoins_gained', v_challenge.reward_fitcoins,
    'challenge_id', p_challenge_id
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_weekly_challenge TO authenticated;

-- 4. RPC: Generar desafíos semanales para usuarios
CREATE OR REPLACE FUNCTION generate_weekly_challenges(
  p_user_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  v_user RECORD;
  v_created INTEGER := 0;
  v_result jsonb;
BEGIN
  -- Iterar sobre usuarios activos
  FOR v_user IN (
    SELECT id, raw_user_meta_data->>'sport' AS preferred_sport
    FROM auth.users au
    JOIN profiles p ON p.id = au.id
    WHERE (p_user_id IS NULL OR p.id = p_user_id)
      AND p.deleted_at IS NULL
  ) LOOP
    -- Desafío 1: Jugar partidos (según deporte preferido)
    INSERT INTO weekly_challenges
      (user_id, week_start, challenge_type, goal, reward_xp, reward_fitcoins, description)
    VALUES
      (v_user.id, v_week_start, 'play_matches', 3, 200, 50,
       format('Juega 3 partidos de %s esta semana', COALESCE(v_user.preferred_sport, 'tu deporte')))
    ON CONFLICT (user_id, week_start, challenge_type) DO NOTHING;

    IF FOUND THEN v_created := v_created + 1; END IF;

    -- Desafío 2: Ganar XP
    INSERT INTO weekly_challenges
      (user_id, week_start, challenge_type, goal, reward_xp, reward_fitcoins, description)
    VALUES
      (v_user.id, v_week_start, 'earn_xp', 500, 300, 80,
       'Acumula 500 XP esta semana entrenando y jugando')
    ON CONFLICT (user_id, week_start, challenge_type) DO NOTHING;

    IF FOUND THEN v_created := v_created + 1; END IF;

    -- Desafío 3: Invitar amigos / mantener racha
    INSERT INTO weekly_challenges
      (user_id, week_start, challenge_type, goal, reward_xp, reward_fitcoins, description)
    VALUES
      (v_user.id, v_week_start, 'invite_friends', 1, 100, 30,
       'Invita a 1 amigo a unirse a SportMatch')
    ON CONFLICT (user_id, week_start, challenge_type) DO NOTHING;

    IF FOUND THEN v_created := v_created + 1; END IF;
  END LOOP;

  v_result := jsonb_build_object(
    'success', true,
    'week', v_week_start,
    'challenges_created', v_created
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_weekly_challenges TO service_role;

-- 5. RPC: Obtener desafíos del usuario para la semana actual
CREATE OR REPLACE FUNCTION get_weekly_challenges()
RETURNS SETOF weekly_challenges
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  v_count INTEGER;
BEGIN
  -- Verificar si el usuario tiene desafíos esta semana
  SELECT COUNT(*) INTO v_count
  FROM weekly_challenges
  WHERE user_id = auth.uid()
    AND week_start = v_week_start;

  -- Si no tiene, generar automáticamente
  IF v_count = 0 THEN
    PERFORM generate_weekly_challenges(auth.uid());
  END IF;

  -- Retornar desafíos
  RETURN QUERY
  SELECT *
  FROM weekly_challenges
  WHERE user_id = auth.uid()
    AND week_start = v_week_start
  ORDER BY created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_weekly_challenges TO authenticated;
