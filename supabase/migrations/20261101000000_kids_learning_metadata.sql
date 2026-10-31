-- Ventra Kids: profile metadata for cross-device learning continuity.
-- Applied by owner in Supabase SQL editor; source control records the migration.
ALTER TABLE public.player_profiles
  ADD COLUMN IF NOT EXISTS grade_level SMALLINT NULL,
  ADD COLUMN IF NOT EXISTS english_level TEXT NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ventra_grade_level') THEN
    ALTER TABLE public.player_profiles ADD CONSTRAINT chk_ventra_grade_level
      CHECK (grade_level IS NULL OR grade_level BETWEEN 1 AND 8);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ventra_english_level') THEN
    ALTER TABLE public.player_profiles ADD CONSTRAINT chk_ventra_english_level
      CHECK (english_level IS NULL OR english_level IN ('Pre-A1', 'A1', 'A2'));
  END IF;
END $$;
