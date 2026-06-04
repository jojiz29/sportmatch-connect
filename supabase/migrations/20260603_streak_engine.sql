-- =====================================================================
-- 🛡️ SPORTMATCH CONNECT — WEEKLY STREAK ENGINE & preferences
-- =====================================================================

-- 1. Add sport_preferences JSONB to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sport_preferences JSONB DEFAULT NULL;

-- 2. Create public.user_stats table
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id             uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_streak      int DEFAULT 0,
  max_streak          int DEFAULT 0,
  last_attended_date  date DEFAULT NULL,
  updated_at          timestamptz DEFAULT now() not null
);

-- Enable Row Level Security on user_stats
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS "user_stats_select_all" ON public.user_stats;
CREATE POLICY "user_stats_select_all" ON public.user_stats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "user_stats_modify_own" ON public.user_stats;
CREATE POLICY "user_stats_modify_own" ON public.user_stats
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 3. Implement streak calculation engine
CREATE OR REPLACE FUNCTION public.update_user_stats_streak_for_user(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_current_streak int := 0;
  v_max_streak int := 0;
  v_temp_streak int := 0;
  v_prev_week date := NULL;
  v_curr_week date;
  v_today_week date;
  v_last_attended_date date := NULL;
  r RECORD;
BEGIN
  -- We assume weeks start on Monday (PostgreSQL date_trunc default)
  v_today_week := date_trunc('week', now())::date;

  -- Select all distinct weeks when the user attended a match, ordered chronologically
  FOR r IN
    SELECT DISTINCT date_trunc('week', m.date)::date as match_week
    FROM public.match_participants mp
    JOIN public.matches m ON m.id = mp.match_id
    WHERE mp.user_id = p_user_id AND mp.status = 'ATTENDED'
    ORDER BY match_week ASC
  LOOP
    v_curr_week := r.match_week;
    
    IF v_prev_week IS NULL THEN
      v_temp_streak := 1;
    ELSIF v_curr_week = v_prev_week + INTERVAL '7 days' THEN
      v_temp_streak := v_temp_streak + 1;
    ELSIF v_curr_week = v_prev_week THEN
      -- Same week, do nothing
    ELSE
      v_temp_streak := 1;
    END IF;

    IF v_temp_streak > v_max_streak THEN
      v_max_streak := v_temp_streak;
    END IF;

    v_prev_week := v_curr_week;
  END LOOP;

  -- Verify current streak survival: user must have attended a match in the current week
  -- or the previous week. Otherwise current streak drops to 0.
  IF v_prev_week IS NULL THEN
    v_current_streak := 0;
  ELSIF v_prev_week < v_today_week - INTERVAL '7 days' THEN
    v_current_streak := 0;
  ELSE
    v_current_streak := v_temp_streak;
  END IF;

  -- Find last_attended_date
  SELECT MAX(m.date) INTO v_last_attended_date
  FROM public.match_participants mp
  JOIN public.matches m ON m.id = mp.match_id
  WHERE mp.user_id = p_user_id AND mp.status = 'ATTENDED';

  -- Upsert stats row
  INSERT INTO public.user_stats (user_id, current_streak, max_streak, last_attended_date, updated_at)
  VALUES (p_user_id, v_current_streak, v_max_streak, v_last_attended_date, now())
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = EXCLUDED.current_streak,
    max_streak = EXCLUDED.max_streak,
    last_attended_date = EXCLUDED.last_attended_date,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to fire on match participant attendance update
CREATE OR REPLACE FUNCTION public.update_user_stats_streak()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_user_stats_streak_for_user(OLD.user_id);
  ELSE
    PERFORM public.update_user_stats_streak_for_user(NEW.user_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_user_stats_streak ON public.match_participants;
CREATE TRIGGER trigger_update_user_stats_streak
  AFTER INSERT OR UPDATE OR DELETE ON public.match_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_stats_streak();

-- Populate for any existing attendances
DO $$
DECLARE
  u uuid;
BEGIN
  FOR u IN SELECT DISTINCT user_id FROM public.match_participants WHERE status = 'ATTENDED' LOOP
    PERFORM public.update_user_stats_streak_for_user(u);
  END LOOP;
END;
$$;
