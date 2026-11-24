-- Okul Paneli: class management, shareable invites and an English summary
-- by skill area for teachers.
--
-- Prerequisite: 20261101000002_school_classrooms_rls.sql. Apply after
-- 20261122000000_teacher_roster_all_english_worlds.sql. The web client works
-- before this file is applied too: it asks ventra_school_api_version() and
-- offers only the older tools when the function is missing.
--
-- Every callable function checks the caller itself (SECURITY DEFINER, fixed
-- search_path), is closed to anonymous users, and never returns an invite
-- code except to the teacher who has just created it.
--
-- What a teacher sees for a child a parent enrolled: nickname, grade, the
-- day the child joined the class, completed English missions and best stars
-- (in total and per English world), the day (not the time) of the last
-- English mission and how many missions were played in the last 7 days.
-- Never: answers, accuracy, audio, transcripts, written text, play time,
-- e-mail or real names. The parent sees exactly the same summary for their
-- own child (ventra_my_classrooms_detail).

-- 1. Version: lets the web client offer the new tools only where they exist.
CREATE OR REPLACE FUNCTION public.ventra_school_api_version()
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,pg_temp
AS $$ SELECT 2 $$;

-- 2. Internal helpers (not callable by any client role).
-- The twelve English worlds and their level counts; must match WORLD_GAMES in
-- apps/web/src/lib/rewards/economyEngine.ts (checked by a test).
CREATE OR REPLACE FUNCTION public.ventra_english_worlds()
RETURNS TABLE(game_id text,level_count integer)
LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,pg_temp
AS $$
 VALUES
  ('island_word_garden_steps',5),
  ('island_word_garden_colors',3),
  ('island_word_garden_numbers',15),
  ('island_word_garden_food',15),
  ('island_word_garden_family',20),
  ('island_word_garden_temple',25),
  ('island_sentence_square_plaza',6),
  ('island_story_forest_discover',6),
  ('island_story_forest_sequence',6),
  ('island_story_forest_detective',6),
  ('island_speaking_harbor_dialogue',5),
  ('island_sentence_workshop_writing',5)
$$;

-- One child's English summary. Only level-completion events of the twelve
-- worlds count, each level once, with its best stars (0-3). Times are taken
-- as the earlier of the device and server clocks, so a wrong device clock
-- cannot move a mission into the future.
CREATE OR REPLACE FUNCTION public.ventra_child_english_summary(p_profile_id uuid,p_user_id uuid)
RETURNS TABLE(completed_levels bigint,stars bigint,worlds jsonb,last_played_on date,levels_7d bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
 WITH levels AS (
  SELECT pe.game_id,pe.level_id,
         max(least(greatest(pe.stars_earned,0),3)) AS best_stars,
         max(least(pe.client_timestamp,pe.server_received_at)) AS last_at
  FROM public.progress_events pe
  JOIN public.ventra_english_worlds() w ON w.game_id=pe.game_id
  WHERE pe.profile_id=p_profile_id AND pe.user_id=p_user_id
    AND pe.event_type='game_level' AND pe.level_id BETWEEN 1 AND w.level_count
  GROUP BY pe.game_id,pe.level_id
 ), per_world AS (
  SELECT l.game_id,count(*) AS done FROM levels l GROUP BY l.game_id
 )
 SELECT (SELECT count(*) FROM levels),
        (SELECT coalesce(sum(l.best_stars),0) FROM levels l)::bigint,
        (SELECT coalesce(jsonb_object_agg(w.game_id,w.done),'{}'::jsonb) FROM per_world w),
        (SELECT (max(l.last_at) AT TIME ZONE 'Europe/Istanbul')::date FROM levels l),
        (SELECT count(*) FROM levels l WHERE l.last_at>now()-interval '7 days')
$$;

CREATE OR REPLACE FUNCTION public.ventra_is_school_staff(p_school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.ventra_school_staff s
  WHERE s.school_id=p_school_id AND s.user_id=auth.uid() AND s.role IN ('owner','teacher'))
$$;

-- The school of a class the caller teaches; raises for anyone else (the same
-- message whether or not the class exists).
CREATE OR REPLACE FUNCTION public.ventra_staff_classroom(p_classroom_id uuid)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE sid uuid;
BEGIN
 SELECT c.school_id INTO sid FROM public.ventra_classrooms c WHERE c.id=p_classroom_id;
 IF sid IS NULL OR NOT public.ventra_is_school_staff(sid) THEN
  RAISE EXCEPTION 'Bu sınıf için öğretmen yetkisi yok';
 END IF;
 RETURN sid;
END $$;

-- 3. School settings (owner only). Renaming a verified school removes the
-- verification: the badge must belong to the name that was checked.
CREATE OR REPLACE FUNCTION public.ventra_update_school(p_school_id uuid,p_name text,p_brand_color text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE uid uuid:=auth.uid();
BEGIN
 IF uid IS NULL OR NOT EXISTS (
  SELECT 1 FROM public.ventra_school_staff s
  WHERE s.school_id=p_school_id AND s.user_id=uid AND s.role='owner'
 ) THEN RAISE EXCEPTION 'Okul ayarlarını yalnızca okul alanının sahibi değiştirebilir'; END IF;
 IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 3 AND 90
   THEN RAISE EXCEPTION 'Okul adı 3-90 karakter olmalı'; END IF;
 IF p_brand_color IS NULL OR p_brand_color !~ '^#[0-9A-Fa-f]{6}$'
   THEN RAISE EXCEPTION 'Renk biçimi geçersiz'; END IF;
 UPDATE public.ventra_schools s
  SET name=btrim(p_name),brand_color=p_brand_color,
      verified_at=CASE WHEN s.name=btrim(p_name) THEN s.verified_at ELSE NULL END
  WHERE s.id=p_school_id;
 RETURN FOUND;
END $$;

-- 4. Classes: same checks as before, plus a readable message for a name that
-- is already used in this school.
CREATE OR REPLACE FUNCTION public.ventra_create_classroom(p_school_id uuid,p_name text,p_grade_level smallint)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE uid uuid:=auth.uid(); cid uuid;
BEGIN
 IF uid IS NULL OR NOT EXISTS (
  SELECT 1 FROM public.ventra_school_staff s
  WHERE s.school_id=p_school_id AND s.user_id=uid AND s.role IN ('owner','teacher')
 ) THEN RAISE EXCEPTION 'Okul öğretmeni yetkisi gerekli'; END IF;
 IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 2 AND 60
   OR p_grade_level NOT BETWEEN 1 AND 8 OR p_grade_level IS NULL
  THEN RAISE EXCEPTION 'Sınıf adı veya seviyesi geçersiz'; END IF;
 BEGIN
  INSERT INTO public.ventra_classrooms(school_id,name,grade_level,created_by)
  VALUES(p_school_id,btrim(p_name),p_grade_level,uid) RETURNING id INTO cid;
 EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Bu adla bir sınıf zaten var';
 END;
 RETURN cid;
END $$;

CREATE OR REPLACE FUNCTION public.ventra_update_classroom(p_classroom_id uuid,p_name text,p_grade_level smallint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE sid uuid:=public.ventra_staff_classroom(p_classroom_id);
BEGIN
 IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 2 AND 60
   OR p_grade_level IS NULL OR p_grade_level NOT BETWEEN 1 AND 8
  THEN RAISE EXCEPTION 'Sınıf adı veya seviyesi geçersiz'; END IF;
 BEGIN
  UPDATE public.ventra_classrooms c SET name=btrim(p_name),grade_level=p_grade_level
   WHERE c.id=p_classroom_id AND c.school_id=sid;
 EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Bu adla bir sınıf zaten var';
 END;
 RETURN FOUND;
END $$;

-- Deleting a class removes its invites and enrollments (foreign keys cascade).
-- Children's profiles and English progress are not touched.
CREATE OR REPLACE FUNCTION public.ventra_delete_classroom(p_classroom_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE sid uuid:=public.ventra_staff_classroom(p_classroom_id);
BEGIN
 DELETE FROM public.ventra_classrooms c WHERE c.id=p_classroom_id AND c.school_id=sid;
 RETURN FOUND;
END $$;

-- Classes with their student and active-invite counts (no names, no codes).
CREATE OR REPLACE FUNCTION public.ventra_class_overview(p_school_id uuid)
RETURNS TABLE(id uuid,school_id uuid,name text,grade_level smallint,created_at timestamptz,
 student_count bigint,active_invites bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
BEGIN
 IF NOT public.ventra_is_school_staff(p_school_id) THEN
  RAISE EXCEPTION 'Okul öğretmeni yetkisi gerekli';
 END IF;
 RETURN QUERY
 SELECT c.id,c.school_id,c.name,c.grade_level,c.created_at,
  (SELECT count(*) FROM public.ventra_class_enrollments e
    JOIN public.player_profiles p ON p.id=e.profile_id AND p.user_id=e.parent_id AND p.deleted_at IS NULL
    WHERE e.classroom_id=c.id),
  (SELECT count(*) FROM public.ventra_class_invites i
    WHERE i.classroom_id=c.id AND i.expires_at>now() AND i.used_count<i.max_uses)
 FROM public.ventra_classrooms c
 WHERE c.school_id=p_school_id
 ORDER BY c.name
 LIMIT 200;
END $$;

-- 5. Invites. The teacher picks how long a code stays valid (1, 7 or 30 days);
-- one code admits up to 40 children. The code is returned only here.
CREATE OR REPLACE FUNCTION public.ventra_create_class_invite_for(p_classroom_id uuid,p_days integer)
RETURNS TABLE(invite_code uuid,valid_until timestamptz,use_limit integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE sid uuid:=public.ventra_staff_classroom(p_classroom_id);
 new_code uuid; new_expiry timestamptz; new_limit integer;
BEGIN
 IF p_days IS NULL OR p_days NOT IN (1,7,30) THEN
  RAISE EXCEPTION 'Davet süresi 1, 7 ya da 30 gün olmalı';
 END IF;
 INSERT INTO public.ventra_class_invites AS i(school_id,classroom_id,created_by,expires_at,max_uses)
 VALUES(sid,p_classroom_id,auth.uid(),now()+make_interval(days=>p_days),40)
 RETURNING i.code,i.expires_at,i.max_uses INTO new_code,new_expiry,new_limit;
 invite_code:=new_code; valid_until:=new_expiry; use_limit:=new_limit;
 RETURN NEXT;
END $$;

-- Active invites of a class, without their codes.
CREATE OR REPLACE FUNCTION public.ventra_class_invites_active(p_classroom_id uuid)
RETURNS TABLE(invite_id uuid,valid_until timestamptz,used integer,use_limit integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
BEGIN
 PERFORM public.ventra_staff_classroom(p_classroom_id);
 RETURN QUERY
 SELECT i.id,i.expires_at,i.used_count,i.max_uses
 FROM public.ventra_class_invites i
 WHERE i.classroom_id=p_classroom_id AND i.expires_at>now() AND i.used_count<i.max_uses
 ORDER BY i.expires_at DESC
 LIMIT 20;
END $$;

-- Cancel an invite at once (for a code shared by mistake or lost).
CREATE OR REPLACE FUNCTION public.ventra_revoke_class_invite(p_invite_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE sid uuid;
BEGIN
 SELECT i.school_id INTO sid FROM public.ventra_class_invites i WHERE i.id=p_invite_id;
 IF sid IS NULL OR NOT public.ventra_is_school_staff(sid) THEN
  RAISE EXCEPTION 'Bu davet için öğretmen yetkisi yok';
 END IF;
 DELETE FROM public.ventra_class_invites i WHERE i.id=p_invite_id;
 RETURN FOUND;
END $$;

-- A parent who holds a valid code sees which school and class it opens before
-- agreeing, and which of their own children are already in that class. It
-- does not use up the code.
CREATE OR REPLACE FUNCTION public.ventra_preview_class_invite(p_code uuid)
RETURNS TABLE(school_name text,class_name text,grade_level smallint,verified boolean,
 valid_until timestamptz,joined_profiles uuid[])
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE uid uuid:=auth.uid();
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Yetişkin hesabı gerekli'; END IF;
 RETURN QUERY
 SELECT s.name,c.name,c.grade_level,s.verified_at IS NOT NULL,i.expires_at,
  coalesce((SELECT array_agg(e.profile_id ORDER BY e.profile_id)
             FROM public.ventra_class_enrollments e
             WHERE e.classroom_id=i.classroom_id AND e.parent_id=uid),'{}'::uuid[])
 FROM public.ventra_class_invites i
 JOIN public.ventra_classrooms c ON c.id=i.classroom_id AND c.school_id=i.school_id
 JOIN public.ventra_schools s ON s.id=i.school_id
 WHERE i.code=p_code AND i.expires_at>now() AND i.used_count<i.max_uses;
END $$;

-- 6. Students. A teacher can take a child out of their class; the child's
-- profile and progress stay with the parent.
CREATE OR REPLACE FUNCTION public.ventra_teacher_remove_student(p_classroom_id uuid,p_profile_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE sid uuid:=public.ventra_staff_classroom(p_classroom_id);
BEGIN
 DELETE FROM public.ventra_class_enrollments e
  WHERE e.classroom_id=p_classroom_id AND e.school_id=sid AND e.profile_id=p_profile_id;
 RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.ventra_teacher_roster_detail(p_classroom_id uuid)
RETURNS TABLE(profile_id uuid,nickname text,grade_level smallint,joined_at timestamptz,
 completed_levels bigint,stars bigint,worlds jsonb,last_played_on date,levels_7d bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE sid uuid:=public.ventra_staff_classroom(p_classroom_id);
BEGIN
 RETURN QUERY
 SELECT p.id,p.nickname::text,p.grade_level,e.joined_at,
        x.completed_levels,x.stars,x.worlds,x.last_played_on,x.levels_7d
 FROM public.ventra_class_enrollments e
 JOIN public.player_profiles p ON p.id=e.profile_id AND p.user_id=e.parent_id AND p.deleted_at IS NULL
 CROSS JOIN LATERAL public.ventra_child_english_summary(p.id,p.user_id) x
 WHERE e.classroom_id=p_classroom_id AND e.school_id=sid
 ORDER BY p.nickname,p.id;
END $$;

-- 7. The parent's own view: each class a child is in, with exactly the
-- summary the teacher sees.
CREATE OR REPLACE FUNCTION public.ventra_my_classrooms_detail()
RETURNS TABLE(profile_id uuid,classroom_id uuid,school_name text,class_name text,grade_level smallint,
 verified boolean,joined_at timestamptz,completed_levels bigint,stars bigint,worlds jsonb,
 last_played_on date,levels_7d bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE uid uuid:=auth.uid();
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Oturum gerekli'; END IF;
 RETURN QUERY
 SELECT e.profile_id,e.classroom_id,s.name,c.name,c.grade_level,s.verified_at IS NOT NULL,e.joined_at,
        x.completed_levels,x.stars,x.worlds,x.last_played_on,x.levels_7d
 FROM public.ventra_class_enrollments e
 JOIN public.player_profiles p ON p.id=e.profile_id AND p.user_id=e.parent_id AND p.deleted_at IS NULL
 JOIN public.ventra_classrooms c ON c.id=e.classroom_id
 JOIN public.ventra_schools s ON s.id=e.school_id
 CROSS JOIN LATERAL public.ventra_child_english_summary(p.id,p.user_id) x
 WHERE e.parent_id=uid
 ORDER BY s.name,c.name,p.nickname;
END $$;

-- 8. Grants. Helpers stay internal; the API is for signed-in adults only.
REVOKE ALL ON FUNCTION public.ventra_english_worlds(),
 public.ventra_child_english_summary(uuid,uuid),
 public.ventra_is_school_staff(uuid),
 public.ventra_staff_classroom(uuid) FROM PUBLIC,anon,authenticated;

REVOKE ALL ON FUNCTION public.ventra_school_api_version(),
 public.ventra_update_school(uuid,text,text),
 public.ventra_create_classroom(uuid,text,smallint),
 public.ventra_update_classroom(uuid,text,smallint),
 public.ventra_delete_classroom(uuid),
 public.ventra_class_overview(uuid),
 public.ventra_create_class_invite_for(uuid,integer),
 public.ventra_class_invites_active(uuid),
 public.ventra_revoke_class_invite(uuid),
 public.ventra_preview_class_invite(uuid),
 public.ventra_teacher_remove_student(uuid,uuid),
 public.ventra_teacher_roster_detail(uuid),
 public.ventra_my_classrooms_detail() FROM PUBLIC,anon;

GRANT EXECUTE ON FUNCTION public.ventra_school_api_version(),
 public.ventra_update_school(uuid,text,text),
 public.ventra_create_classroom(uuid,text,smallint),
 public.ventra_update_classroom(uuid,text,smallint),
 public.ventra_delete_classroom(uuid),
 public.ventra_class_overview(uuid),
 public.ventra_create_class_invite_for(uuid,integer),
 public.ventra_class_invites_active(uuid),
 public.ventra_revoke_class_invite(uuid),
 public.ventra_preview_class_invite(uuid),
 public.ventra_teacher_remove_student(uuid,uuid),
 public.ventra_teacher_roster_detail(uuid),
 public.ventra_my_classrooms_detail() TO authenticated;
