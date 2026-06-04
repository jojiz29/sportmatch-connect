-- SQL Migration: Sports Attendance & Cross-Player Validation Module (20260604_attendance_module.sql)

-- 1. Alter match_participants table to support attendance lifecycle
ALTER TABLE public.match_participants 
  ADD COLUMN IF NOT EXISTS attendance_status TEXT DEFAULT 'PENDING' NOT NULL 
  CHECK (attendance_status IN ('PENDING', 'CONFIRMED', 'ABSENT', 'VALIDATED'));

ALTER TABLE public.match_participants 
  ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ;

-- 2. Create attendance_validations table to log cross-player validations
CREATE TABLE IF NOT EXISTS public.attendance_validations (
  match_id     UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  validator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  validated_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status       TEXT DEFAULT 'CONFIRMED' NOT NULL CHECK (status IN ('CONFIRMED', 'ABSENT')),
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (match_id, validator_id, validated_id),
  CONSTRAINT no_self_validation CHECK (validator_id <> validated_id)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.attendance_validations ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DROP POLICY IF EXISTS "validations_read_all" ON public.attendance_validations;
CREATE POLICY "validations_read_all" ON public.attendance_validations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "validations_insert_self" ON public.attendance_validations;
CREATE POLICY "validations_insert_self" ON public.attendance_validations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = validator_id);

-- 5. Create Trigger function to sync validations with match_participants and adjust user profile stats
CREATE OR REPLACE FUNCTION public.process_attendance_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_status text;
BEGIN
  -- Get the current attendance status
  SELECT attendance_status INTO v_current_status
  FROM public.match_participants
  WHERE match_id = NEW.match_id AND user_id = NEW.validated_id;

  -- If already validated or marked absent, do not double-process metrics
  IF v_current_status = 'VALIDATED' OR v_current_status = 'ABSENT' THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'CONFIRMED' THEN
    -- Update participant status to VALIDATED
    UPDATE public.match_participants
    SET attendance_status = 'VALIDATED',
        validated_at = now()
    WHERE match_id = NEW.match_id AND user_id = NEW.validated_id;

    -- Award 50 FitCoins reward for verified attendance
    INSERT INTO public.wallet_transactions (user_id, amount, description, type)
    VALUES (NEW.validated_id, 50, 'Recompensa: Asistencia verificada', 'EARN');

    -- Increment trust score (+2)
    UPDATE public.profiles
    SET trust_score = LEAST(100, trust_score + 2)
    WHERE id = NEW.validated_id;

  ELSIF NEW.status = 'ABSENT' then
    -- Update participant status to ABSENT
    UPDATE public.match_participants
    SET attendance_status = 'ABSENT',
        validated_at = now()
    WHERE match_id = NEW.match_id AND user_id = NEW.validated_id;

    -- Deduct 100 FitCoins penalty for unexcused absence
    INSERT INTO public.wallet_transactions (user_id, amount, description, type)
    VALUES (NEW.validated_id, -100, 'Penalización: Inasistencia no justificada', 'PENALTY');

    -- Decrement trust score (-15)
    UPDATE public.profiles
    SET trust_score = GREATEST(0, trust_score - 15)
    WHERE id = NEW.validated_id;
  END IF;

  -- Increment the overall matches_played count for the user
  UPDATE public.profiles
  SET matches_played = matches_played + 1
  WHERE id = NEW.validated_id;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_attendance_validation_inserted ON public.attendance_validations;
CREATE TRIGGER on_attendance_validation_inserted
  AFTER INSERT OR UPDATE ON public.attendance_validations
  FOR EACH ROW
  EXECUTE PROCEDURE public.process_attendance_validation();

-- Grant permissions to authenticated users
GRANT ALL ON public.attendance_validations TO authenticated;
