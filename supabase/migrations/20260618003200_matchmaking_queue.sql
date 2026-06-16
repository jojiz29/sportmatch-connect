-- ============================================================
-- MIGRACIÓN: 20260618003200 — Matchmaking queue + swipes
-- Sprint V2.3 — Matchmaking & Elo System
-- ============================================================
-- Objetivo:
--   1. Tabla swipes (persistencia real de likes/passes)
--   2. Tabla matchmaking_queue (cola de emparejamiento)
--   3. RPC enter_queue    → insertar en cola
--   4. RPC leave_queue    → salir de cola
--   5. RPC find_match     → buscar oponente con Haversine + Elo
--                            + FOR UPDATE SKIP LOCKED + advisory lock
--   6. RPC record_swipe   → insertar swipe + detectar mutual_like
-- ============================================================

-- ============================================================
-- 1. TABLA swipes
-- ============================================================
-- Registra cada acción de swipe (LIKE o PASS) en el carrusel
-- de matchmaking. Útil para:
--   - No volver a mostrar usuarios ya swiped
--   - Detectar mutual likes (ambos se dieron LIKE)
--   - Futuro entrenamiento de modelo de recomendación
-- ============================================================
CREATE TABLE IF NOT EXISTS public.swipes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  target_id uuid NOT NULL,
  action text NOT NULL,
  sport text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pk_swipes PRIMARY KEY (id),
  CONSTRAINT chk_swipe_action CHECK (action IN ('LIKE', 'PASS')),
  CONSTRAINT chk_no_self_swipe CHECK (actor_id != target_id)
);

-- FK condicionales
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_swipes_actor'
    ) THEN
      ALTER TABLE public.swipes
      ADD CONSTRAINT fk_swipes_actor
        FOREIGN KEY (actor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_swipes_target'
    ) THEN
      ALTER TABLE public.swipes
      ADD CONSTRAINT fk_swipes_target
        FOREIGN KEY (target_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_swipes_actor ON public.swipes(actor_id, sport);
CREATE INDEX IF NOT EXISTS idx_swipes_target ON public.swipes(target_id, sport);
CREATE INDEX IF NOT EXISTS idx_swipes_mutual ON public.swipes(actor_id, target_id, action);

-- RLS
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'swipes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.swipes', r.policyname);
  END LOOP;
END $$;

-- Solo el actor puede ver/crear sus swipes
CREATE POLICY "swipes_select_own" ON public.swipes
  FOR SELECT TO authenticated
  USING (auth.uid()::text = actor_id::text);

CREATE POLICY "swipes_insert_own" ON public.swipes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = actor_id::text);

-- ============================================================
-- 2. TABLA matchmaking_queue
-- ============================================================
-- Cada registro representa un usuario buscando partido para
-- un deporte específico, en una ubicación y radio.
-- UNIQUE (user_id, sport): solo una búsqueda activa por deporte.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.matchmaking_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sport text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  radius_km double precision NOT NULL DEFAULT 10.0,
  status text NOT NULL DEFAULT 'WAITING',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  matched_with uuid,
  matched_at timestamptz,
  CONSTRAINT pk_matchmaking_queue PRIMARY KEY (id),
  CONSTRAINT uniq_queue_user_sport UNIQUE (user_id, sport),
  CONSTRAINT chk_queue_status CHECK (status IN ('WAITING', 'FOUND', 'CANCELLED')),
  CONSTRAINT chk_radius_positive CHECK (radius_km > 0),
  CONSTRAINT chk_lat_range CHECK (lat BETWEEN -90 AND 90),
  CONSTRAINT chk_lng_range CHECK (lng BETWEEN -180 AND 180)
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'fk_queue_user'
    ) THEN
      ALTER TABLE public.matchmaking_queue
      ADD CONSTRAINT fk_queue_user
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_queue_user ON public.matchmaking_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_sport_status ON public.matchmaking_queue(sport, status);
CREATE INDEX IF NOT EXISTS idx_queue_matched_with ON public.matchmaking_queue(matched_with);

-- RLS
ALTER TABLE public.matchmaking_queue ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'matchmaking_queue'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.matchmaking_queue', r.policyname);
  END LOOP;
END $$;

-- Usuario ve su propia entrada; service_role ve todo
CREATE POLICY "queue_select_own" ON public.matchmaking_queue
  FOR SELECT TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "queue_insert_own" ON public.matchmaking_queue
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "queue_update_own" ON public.matchmaking_queue
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "queue_delete_own" ON public.matchmaking_queue
  FOR DELETE TO authenticated
  USING (auth.uid()::text = user_id::text);

-- ============================================================
-- 3. RPC: enter_queue
-- ============================================================
-- Inserta o actualiza al usuario en la cola de matchmaking
-- para un deporte. Si ya existe una entrada WAITING, actualiza
-- lat/lng/radius. Si es CANCELLED o FOUND, la reactiva.
-- SECURITY DEFINER: el caller puede ser authenticated.
-- ============================================================
CREATE OR REPLACE FUNCTION public.enter_queue(
  p_user_id uuid,
  p_sport text,
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision DEFAULT 10.0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_queue RECORD;
BEGIN
  -- Validar coordenadas
  IF p_lat < -90 OR p_lat > 90 THEN
    RAISE EXCEPTION 'Invalid latitude: %', p_lat;
  END IF;
  IF p_lng < -180 OR p_lng > 180 THEN
    RAISE EXCEPTION 'Invalid longitude: %', p_lng;
  END IF;

  INSERT INTO public.matchmaking_queue (user_id, sport, lat, lng, radius_km, status)
  VALUES (p_user_id, p_sport, p_lat, p_lng, p_radius_km, 'WAITING')
  ON CONFLICT (user_id, sport) DO UPDATE
  SET lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      radius_km = EXCLUDED.radius_km,
      status = 'WAITING',
      matched_with = NULL,
      matched_at = NULL,
      updated_at = now();

  SELECT * INTO v_queue
  FROM public.matchmaking_queue
  WHERE user_id = p_user_id AND sport = p_sport;

  RETURN jsonb_build_object(
    'user_id', v_queue.user_id,
    'sport', v_queue.sport,
    'status', v_queue.status,
    'radius_km', v_queue.radius_km,
    'entered_at', v_queue.updated_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.enter_queue(uuid, text, double precision, double precision, double precision) TO authenticated, service_role;

-- ============================================================
-- 4. RPC: leave_queue
-- ============================================================
-- Marca como CANCELLED la entrada del usuario en la cola.
-- ============================================================
CREATE OR REPLACE FUNCTION public.leave_queue(
  p_user_id uuid,
  p_sport text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_queue RECORD;
BEGIN
  SELECT * INTO v_queue
  FROM public.matchmaking_queue
  WHERE user_id = p_user_id AND sport = p_sport AND status = 'WAITING';

  IF v_queue.id IS NOT NULL THEN
    UPDATE public.matchmaking_queue
    SET status = 'CANCELLED', updated_at = now()
    WHERE id = v_queue.id;

    RETURN jsonb_build_object(
      'user_id', p_user_id,
      'sport', p_sport,
      'status', 'CANCELLED'
    );
  ELSE
    RETURN jsonb_build_object(
      'user_id', p_user_id,
      'sport', p_sport,
      'status', 'NOT_IN_QUEUE'
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.leave_queue(uuid, text) TO authenticated, service_role;

-- ============================================================
-- 5. RPC: find_match
-- ============================================================
-- Busca un oponente compatible en la cola considerando:
--   - Mismo deporte
--   - Distancia Haversine <= min(radius_a, radius_b)
--   - Diferencia de Elo < 200
-- Estrategia anti-deadlock:
--   a) pg_advisory_xact_lock por sport → serializa find_match
--      por deporte (solo una búsqueda a la vez por deporte).
--      Performance aceptable para volúmenes de matchmaking bajos.
--   b) El lock es a nivel de transacción (xact) → se libera
--      automáticamente al terminar la RPC.
--   c) FOR UPDATE SKIP LOCKED en el SELECT del candidato
--      previene esperar por filas ya bloqueadas.
-- ============================================================
CREATE OR REPLACE FUNCTION public.find_match(
  p_user_id uuid,
  p_sport text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_lat double precision;
  v_current_lng double precision;
  v_current_radius double precision;
  v_current_elo double precision;
  v_candidate_id uuid;
  v_distance double precision;
BEGIN
  -- Advisory lock para evitar race conditions por sport
  PERFORM pg_advisory_xact_lock(hashtext('matchmaking_' || p_sport));

  -- Obtener datos del usuario actual en la cola
  SELECT mq.lat, mq.lng, mq.radius_km
  INTO v_current_lat, v_current_lng, v_current_radius
  FROM public.matchmaking_queue mq
  WHERE mq.user_id = p_user_id AND mq.sport = p_sport AND mq.status = 'WAITING';

  IF v_current_lat IS NULL THEN
    RETURN jsonb_build_object('matched', false, 'reason', 'not_in_queue');
  END IF;

  -- Obtener Elo actual (crear rating si no existe)
  INSERT INTO public.player_ratings (user_id, sport, elo_rating)
  VALUES (p_user_id, p_sport, 1500.0)
  ON CONFLICT (user_id, sport) DO NOTHING;

  SELECT pr.elo_rating INTO v_current_elo
  FROM public.player_ratings pr
  WHERE pr.user_id = p_user_id AND pr.sport = p_sport;

  -- Buscar candidato (FOR UPDATE SKIP LOCKED: no esperar filas bloqueadas)
  -- La subconsulta usa Haversine para calcular distancia
  SELECT candidate.user_id, candidate.distance_km INTO v_candidate_id, v_distance
  FROM (
    SELECT
      q.user_id,
      -- Haversine distance in km
      6371.0 * acos(
        GREATEST(-1, LEAST(1,
          sin(radians(v_current_lat)) * sin(radians(q.lat)) +
          cos(radians(v_current_lat)) * cos(radians(q.lat)) *
          cos(radians(q.lng - v_current_lng))
        ))
      ) AS distance_km
    FROM public.matchmaking_queue q
    JOIN public.player_ratings pr ON pr.user_id = q.user_id AND pr.sport = q.sport
    WHERE q.sport = p_sport
      AND q.status = 'WAITING'
      AND q.user_id != p_user_id
      AND ABS(pr.elo_rating - v_current_elo) < 200.0
    ORDER BY random()
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  ) candidate
  WHERE candidate.distance_km <= LEAST(
    v_current_radius,
    (SELECT mq.radius_km FROM public.matchmaking_queue mq
     WHERE mq.user_id = candidate.user_id AND mq.sport = p_sport)
  );

  -- Si no hay candidato, retornar
  IF v_candidate_id IS NULL THEN
    RETURN jsonb_build_object(
      'matched', false,
      'reason', 'no_compatible_candidates',
      'queued_at', (SELECT updated_at FROM public.matchmaking_queue WHERE user_id = p_user_id AND sport = p_sport)
    );
  END IF;

  -- Actualizar AMBAS entradas a FOUND (candidato primero por orden)
  -- Nota: el orden por user_id asegura lock determinístico
  IF p_user_id < v_candidate_id THEN
    UPDATE public.matchmaking_queue
    SET status = 'FOUND', matched_with = v_candidate_id, matched_at = now(), updated_at = now()
    WHERE user_id = p_user_id AND sport = p_sport AND status = 'WAITING';

    UPDATE public.matchmaking_queue
    SET status = 'FOUND', matched_with = p_user_id, matched_at = now(), updated_at = now()
    WHERE user_id = v_candidate_id AND sport = p_sport AND status = 'WAITING';
  ELSE
    UPDATE public.matchmaking_queue
    SET status = 'FOUND', matched_with = p_user_id, matched_at = now(), updated_at = now()
    WHERE user_id = v_candidate_id AND sport = p_sport AND status = 'WAITING';

    UPDATE public.matchmaking_queue
    SET status = 'FOUND', matched_with = v_candidate_id, matched_at = now(), updated_at = now()
    WHERE user_id = p_user_id AND sport = p_sport AND status = 'WAITING';
  END IF;

  RETURN jsonb_build_object(
    'matched', true,
    'match_user_id', v_candidate_id,
    'distance_km', round(v_distance::numeric, 1),
    'sport', p_sport
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_match(uuid, text) TO authenticated, service_role;

-- ============================================================
-- 6. RPC: record_swipe
-- ============================================================
-- Registra un swipe (LIKE o PASS) y detecta mutual_like.
-- Si ambos se dieron LIKE, crea una conversación directa.
-- Retorna: { mutual_like, conversation_id (si aplica) }
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_swipe(
  p_actor_id uuid,
  p_target_id uuid,
  p_action text,
  p_sport text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reverse_swipe_exists boolean;
  v_conversation_id uuid;
BEGIN
  -- Validar no self-swipe
  IF p_actor_id = p_target_id THEN
    RAISE EXCEPTION 'Cannot swipe yourself';
  END IF;

  -- Validar action
  IF p_action NOT IN ('LIKE', 'PASS') THEN
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;

  -- Insertar swipe
  INSERT INTO public.swipes (actor_id, target_id, action, sport)
  VALUES (p_actor_id, p_target_id, p_action, p_sport);

  -- Solo detectar mutual en caso de LIKE
  IF p_action = 'LIKE' THEN
    -- Verificar si el target ya dio LIKE al actor para el mismo deporte
    SELECT EXISTS(
      SELECT 1 FROM public.swipes
      WHERE actor_id = p_target_id
        AND target_id = p_actor_id
        AND action = 'LIKE'
        AND sport = p_sport
    ) INTO v_reverse_swipe_exists;

    IF v_reverse_swipe_exists THEN
      -- Intentar crear conversación (si la RPC existe)
      BEGIN
        SELECT public.create_direct_conversation(p_actor_id, p_target_id) INTO v_conversation_id;
      EXCEPTION
        WHEN others THEN
          -- Si la RPC no existe o falla, continuar sin conversación
          v_conversation_id := NULL;
      END;

      RETURN jsonb_build_object(
        'mutual_like', true,
        'conversation_id', v_conversation_id
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'mutual_like', false,
    'action', p_action
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_swipe(uuid, uuid, text, text) TO authenticated, service_role;

-- Habilitar Realtime para la cola (notificaciones de match)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matchmaking_queue;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- NOTIFY PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
