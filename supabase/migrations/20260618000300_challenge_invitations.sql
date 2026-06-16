-- ============================================================
-- Migration: Challenge Invitations with Deep Links
-- Fecha: 2026-06-18
--
-- 1. Tabla challenge_invitations con token único
-- 2. RLS: lectura pública (para landing page), inserción solo challenger
-- 3. RPC helpers para gestión de invitaciones
-- 4. Trigger de expiración automática
-- ============================================================

-- 1. Tabla de invitaciones
CREATE TABLE public.challenge_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  challenger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  modality TEXT NOT NULL DEFAULT 'amistoso' CHECK (modality IN ('amistoso', 'competitivo')),
  scheduled_date DATE,
  scheduled_time TIME,
  location TEXT,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'opened', 'accepted', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE INDEX idx_challenge_invitations_token
  ON challenge_invitations(token);

CREATE INDEX idx_challenge_invitations_challenger
  ON challenge_invitations(challenger_id);

CREATE INDEX idx_challenge_invitations_status
  ON challenge_invitations(status)
  WHERE status = 'pending';

COMMENT ON TABLE challenge_invitations IS
  'Invitaciones a retos con deep link token';
COMMENT ON COLUMN challenge_invitations.token IS
  'Token único hexadecimal para deep link (64 chars)';
COMMENT ON COLUMN challenge_invitations.expires_at IS
  'La invitación expira después de 7 días';

-- 2. RLS
ALTER TABLE challenge_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view invitation by token"
  ON challenge_invitations
  FOR SELECT
  USING (true);

CREATE POLICY "Challenger can create invitations"
  ON challenge_invitations
  FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Challenger can update own invitations"
  ON challenge_invitations
  FOR UPDATE
  USING (auth.uid() = challenger_id)
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Challenger can delete own invitations"
  ON challenge_invitations
  FOR DELETE
  USING (auth.uid() = challenger_id);

-- 3. RPC: Crear invitación con token
CREATE OR REPLACE FUNCTION create_challenge_invitation(
  p_sport TEXT,
  p_modality TEXT DEFAULT 'amistoso',
  p_message TEXT DEFAULT '',
  p_scheduled_date DATE DEFAULT NULL,
  p_scheduled_time TIME DEFAULT NULL,
  p_location TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation challenge_invitations%ROWTYPE;
  v_profile RECORD;
  v_result jsonb;
BEGIN
  -- Obtener datos del challenger
  SELECT name INTO v_profile
  FROM profiles
  WHERE id = auth.uid();

  IF v_profile.name IS NULL THEN
    RAISE EXCEPTION 'Perfil no encontrado'
      USING ERRCODE = 'P0002';
  END IF;

  -- Crear invitación
  INSERT INTO challenge_invitations (
    challenger_id, sport, modality, message,
    scheduled_date, scheduled_time, location
  ) VALUES (
    auth.uid(), p_sport, p_modality, p_message,
    p_scheduled_date, p_scheduled_time, p_location
  )
  RETURNING * INTO v_invitation;

  v_result := jsonb_build_object(
    'success', true,
    'token', v_invitation.token,
    'id', v_invitation.id,
    'expires_at', v_invitation.expires_at,
    'url', format('https://sportmatch-connect.vercel.app/challenge/%s', v_invitation.token)
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION create_challenge_invitation TO authenticated;

-- 4. RPC: Aceptar invitación (convierte en player_challenge real)
CREATE OR REPLACE FUNCTION accept_challenge_invitation(
  p_token TEXT
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation challenge_invitations%ROWTYPE;
  v_challenge_id UUID;
  v_result jsonb;
BEGIN
  -- Buscar por token
  SELECT * INTO v_invitation
  FROM challenge_invitations
  WHERE token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitación no encontrada'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_invitation.status <> 'pending' THEN
    RAISE EXCEPTION 'Esta invitación ya fue procesada (estado: %)', v_invitation.status
      USING ERRCODE = 'P0001';
  END IF;

  IF v_invitation.expires_at < now() THEN
    UPDATE challenge_invitations
    SET status = 'expired'
    WHERE id = v_invitation.id;

    RAISE EXCEPTION 'Esta invitación ha expirado'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_invitation.challenger_id = auth.uid() THEN
    RAISE EXCEPTION 'No puedes aceptar tu propia invitación'
      USING ERRCODE = '42501';
  END IF;

  -- Crear player_challenge real
  INSERT INTO player_challenges (
    challenger_id, challenged_id, sport, modality,
    scheduled_date, scheduled_time, location, message, status
  ) VALUES (
    v_invitation.challenger_id, auth.uid(), v_invitation.sport, v_invitation.modality,
    v_invitation.scheduled_date, v_invitation.scheduled_time,
    v_invitation.location, v_invitation.message, 'accepted'
  )
  RETURNING id INTO v_challenge_id;

  -- Marcar invitación como aceptada
  UPDATE challenge_invitations
  SET status = 'accepted'
  WHERE id = v_invitation.id;

  v_result := jsonb_build_object(
    'success', true,
    'challenge_id', v_challenge_id,
    'challenger_id', v_invitation.challenger_id,
    'sport', v_invitation.sport
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_challenge_invitation TO authenticated;

-- 5. RPC: Obtener datos de invitación por token (para landing page)
CREATE OR REPLACE FUNCTION get_invitation_by_token(
  p_token TEXT
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation challenge_invitations%ROWTYPE;
  v_challenger RECORD;
  v_result jsonb;
BEGIN
  SELECT ci.* INTO v_invitation
  FROM challenge_invitations ci
  WHERE ci.token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT name, avatar_url, level, level_label
  INTO v_challenger
  FROM profiles
  WHERE id = v_invitation.challenger_id;

  v_result := jsonb_build_object(
    'found', true,
    'id', v_invitation.id,
    'token', v_invitation.token,
    'sport', v_invitation.sport,
    'modality', v_invitation.modality,
    'message', v_invitation.message,
    'scheduled_date', v_invitation.scheduled_date,
    'scheduled_time', v_invitation.scheduled_time,
    'location', v_invitation.location,
    'status', v_invitation.status,
    'expires_at', v_invitation.expires_at,
    'expired', v_invitation.expires_at < now(),
    'challenger', jsonb_build_object(
      'name', v_challenger.name,
      'avatar_url', v_challenger.avatar_url,
      'level', v_challenger.level,
      'label', v_challenger.level_label
    )
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_invitation_by_token TO anon, authenticated;

-- 6. RPC: Cancelar invitación propia
CREATE OR REPLACE FUNCTION cancel_challenge_invitation(
  p_token TEXT
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  UPDATE challenge_invitations
  SET status = 'cancelled'
  WHERE token = p_token
    AND challenger_id = auth.uid()
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitación no encontrada o no puedes cancelarla'
      USING ERRCODE = 'P0002';
  END IF;

  v_result := jsonb_build_object('success', true, 'token', p_token, 'status', 'cancelled');
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_challenge_invitation TO authenticated;
