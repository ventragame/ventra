-- Teacher roster counts every English world, not three.
--
-- ventra_teacher_roster counted completed missions and stars only for three
-- Kelime Bahçesi games (Hayvan Çayırı, Renk Korusu, Sayı Vadisi): a child who
-- finished Lezzet Pazarı, Aile Köyü, Keşif Tapınağı or any island showed 0.
-- The game list now matches the twelve worlds of the family panel
-- (WORLD_GAMES in apps/web/src/lib/rewards/economyEngine.ts).
--
-- Unchanged: the signature and return shape (the web client needs no change),
-- the staff check, the parent-owned/not-deleted profile join, and the privacy
-- rule (nickname, grade and aggregate completion/stars only; no event metrics,
-- answers, audio, text or personal data).
CREATE OR REPLACE FUNCTION public.ventra_teacher_roster(p_classroom_id uuid)
RETURNS TABLE(profile_id uuid,nickname text,grade_level smallint,completed_levels bigint,stars bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE sid uuid;
BEGIN
 SELECT c.school_id INTO sid FROM public.ventra_classrooms c WHERE c.id=p_classroom_id;
 IF auth.uid() IS NULL OR sid IS NULL OR NOT EXISTS (
   SELECT 1 FROM public.ventra_school_staff m WHERE m.school_id=sid
      AND m.user_id=auth.uid() AND m.role IN ('owner','teacher')
 ) THEN RAISE EXCEPTION 'Sınıf listesine erişim yetkisi yok'; END IF;
 RETURN QUERY
 SELECT p.id,p.nickname::text,p.grade_level,
        COALESCE(scores.completed,0)::bigint,COALESCE(scores.total_stars,0)::bigint
 FROM public.ventra_class_enrollments e
 JOIN public.player_profiles p ON p.id=e.profile_id AND p.user_id=e.parent_id AND p.deleted_at IS NULL
 LEFT JOIN LATERAL (
  SELECT count(*) completed,coalesce(sum(best_stars),0) total_stars FROM (
    SELECT pe.game_id,pe.level_id,max(least(greatest(pe.stars_earned,0),3)) best_stars
    FROM public.progress_events pe
    WHERE pe.profile_id=p.id AND pe.user_id=p.user_id
      AND pe.event_type='game_level' AND pe.game_id IN (
       'island_word_garden_steps','island_word_garden_colors','island_word_garden_numbers',
       'island_word_garden_food','island_word_garden_family','island_word_garden_temple',
       'island_sentence_square_plaza','island_story_forest_discover','island_story_forest_sequence',
       'island_story_forest_detective','island_speaking_harbor_dialogue','island_sentence_workshop_writing')
    GROUP BY pe.game_id,pe.level_id
  ) t
 ) scores ON true
 WHERE e.classroom_id=p_classroom_id AND e.school_id=sid
 ORDER BY p.nickname,p.id;
END $$;

-- CREATE OR REPLACE keeps existing grants; restate them so the function is
-- never callable by anonymous users even if it was created fresh.
REVOKE ALL ON FUNCTION public.ventra_teacher_roster(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ventra_teacher_roster(uuid) TO authenticated;
