-- Optional independent English speech recognition: bounded, authenticated quota.
-- This migration only creates data structures; no child voice or transcript is stored.
-- Apply manually before deploying the harbor-transcribe Edge Function.
CREATE TABLE IF NOT EXISTS public.harbor_speech_quotas (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  minute_started timestamptz NOT NULL DEFAULT now(),
  minute_count integer NOT NULL DEFAULT 0,
  day_started timestamptz NOT NULL DEFAULT now(),
  day_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT harbor_minute_count CHECK (minute_count BETWEEN 0 AND 10),
  CONSTRAINT harbor_day_count CHECK (day_count BETWEEN 0 AND 120)
);
ALTER TABLE public.harbor_speech_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harbor_speech_quotas FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.harbor_speech_quotas FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.authorize_harbor_transcription(p_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  caller uuid := auth.uid();
  current_time timestamptz := now();
  minute_used integer;
  day_used integer;
BEGIN
  IF caller IS NULL OR p_profile_id IS NULL THEN RETURN false; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.player_profiles p
     WHERE p.id = p_profile_id AND p.user_id = caller AND p.deleted_at IS NULL
  ) THEN RETURN false; END IF;
  -- Serialize quota adjustments for this account, even under parallel requests.
  PERFORM pg_advisory_xact_lock(hashtextextended(caller::text, 20261114));
  INSERT INTO public.harbor_speech_quotas(user_id, minute_started, minute_count, day_started, day_count, updated_at)
   VALUES(caller, current_time, 0, current_time, 0, current_time)
   ON CONFLICT(user_id) DO NOTHING;
  SELECT
   CASE WHEN q.minute_started <= current_time - interval '1 minute' THEN 0 ELSE q.minute_count END,
   CASE WHEN q.day_started <= current_time - interval '1 day' THEN 0 ELSE q.day_count END
  INTO minute_used, day_used
  FROM public.harbor_speech_quotas q WHERE q.user_id = caller FOR UPDATE;
  IF minute_used >= 10 OR day_used >= 120 THEN RETURN false; END IF;
  UPDATE public.harbor_speech_quotas SET
    minute_started = CASE WHEN minute_started <= current_time - interval '1 minute'
      THEN current_time ELSE minute_started END,
    minute_count = minute_used + 1,
    day_started = CASE WHEN day_started <= current_time - interval '1 day'
      THEN current_time ELSE day_started END,
    day_count = day_used + 1,
    updated_at = current_time
   WHERE user_id = caller;
  RETURN true;
END $$;

REVOKE ALL ON FUNCTION public.authorize_harbor_transcription(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.authorize_harbor_transcription(uuid) TO authenticated;
