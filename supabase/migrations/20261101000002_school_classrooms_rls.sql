-- Ventra P6.1: school/class management with explicit parent-owned child enrollment.
-- Prerequisite: P2 migrations through 20261101000001 are applied.
-- No direct anonymous access, no child accounts, no public invite list.
CREATE TABLE IF NOT EXISTS public.ventra_schools (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
 name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 3 AND 90),
 brand_color text NOT NULL DEFAULT '#2563eb' CHECK (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
 verified_at timestamptz NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.ventra_school_staff (
 school_id uuid NOT NULL REFERENCES public.ventra_schools(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role text NOT NULL CHECK (role IN ('owner','teacher')),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (school_id,user_id)
);
CREATE TABLE IF NOT EXISTS public.ventra_classrooms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 school_id uuid NOT NULL REFERENCES public.ventra_schools(id) ON DELETE CASCADE,
 name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 60),
 grade_level smallint NOT NULL CHECK (grade_level BETWEEN 1 AND 8),
 created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (id,school_id),
 UNIQUE (school_id,name)
);
CREATE TABLE IF NOT EXISTS public.ventra_class_invites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 school_id uuid NOT NULL,
 classroom_id uuid NOT NULL,
 code uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 expires_at timestamptz NOT NULL DEFAULT (now()+interval '7 days'),
 max_uses int NOT NULL DEFAULT 30 CHECK (max_uses BETWEEN 1 AND 100),
 used_count int NOT NULL DEFAULT 0 CHECK (used_count>=0 AND used_count<=max_uses),
 FOREIGN KEY (classroom_id,school_id) REFERENCES public.ventra_classrooms(id,school_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS public.ventra_class_enrollments (
 school_id uuid NOT NULL,
 classroom_id uuid NOT NULL,
 profile_id uuid NOT NULL,
 parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 joined_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (classroom_id,profile_id),
 FOREIGN KEY (classroom_id,school_id) REFERENCES public.ventra_classrooms(id,school_id) ON DELETE CASCADE,
 FOREIGN KEY (profile_id,parent_id) REFERENCES public.player_profiles(id,user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ventra_class_enrollments_parent ON public.ventra_class_enrollments(parent_id);
CREATE INDEX IF NOT EXISTS idx_ventra_class_enrollments_school ON public.ventra_class_enrollments(school_id);
CREATE INDEX IF NOT EXISTS idx_ventra_staff_user ON public.ventra_school_staff(user_id);

ALTER TABLE public.ventra_schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventra_school_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventra_classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventra_class_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventra_class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventra_schools FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ventra_school_staff FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ventra_classrooms FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ventra_class_invites FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ventra_class_enrollments FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.ventra_schools, public.ventra_school_staff,
 public.ventra_classrooms, public.ventra_class_invites, public.ventra_class_enrollments FROM PUBLIC,anon;
GRANT SELECT ON public.ventra_schools,public.ventra_school_staff,public.ventra_classrooms TO authenticated;
-- No client INSERT/UPDATE/DELETE on school-related tables. All writes are guarded RPCs.
GRANT SELECT ON public.ventra_class_enrollments TO authenticated;
-- No SELECT on invite codes at any role; only creating teacher receives the code once.

CREATE POLICY ventra_staff_own ON public.ventra_school_staff
 FOR SELECT TO authenticated USING (user_id=(select auth.uid()));
CREATE POLICY ventra_school_staff_read ON public.ventra_schools
 FOR SELECT TO authenticated USING (
 EXISTS (SELECT 1 FROM public.ventra_school_staff m
   WHERE m.school_id=id AND m.user_id=(select auth.uid()))
 );
CREATE POLICY ventra_class_staff_read ON public.ventra_classrooms
 FOR SELECT TO authenticated USING (
 EXISTS (SELECT 1 FROM public.ventra_school_staff m
  WHERE m.school_id=ventra_classrooms.school_id AND m.user_id=(select auth.uid()))
 );
CREATE POLICY ventra_parent_enrollment_read ON public.ventra_class_enrollments
 FOR SELECT TO authenticated USING (parent_id=(select auth.uid()));

-- All SECURITY DEFINER operations check identity explicitly and do not expose raw
-- child progress_events to teachers. A self-registered school is NOT a verified school.
CREATE OR REPLACE FUNCTION public.ventra_create_school(p_name text,p_brand_color text DEFAULT '#2563eb')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE uid uuid:=auth.uid(); sid uuid;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Yetişkin hesabı gerekli'; END IF;
 IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 3 AND 90
   THEN RAISE EXCEPTION 'Okul adı 3-90 karakter olmalı'; END IF;
 IF p_brand_color IS NULL OR p_brand_color !~ '^#[0-9A-Fa-f]{6}$'
   THEN RAISE EXCEPTION 'Renk biçimi geçersiz'; END IF;
 INSERT INTO public.ventra_schools(owner_id,name,brand_color)
 VALUES(uid,btrim(p_name),p_brand_color) RETURNING id INTO sid;
 INSERT INTO public.ventra_school_staff(school_id,user_id,role) VALUES(sid,uid,'owner');
 RETURN sid;
END $$;

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
 INSERT INTO public.ventra_classrooms(school_id,name,grade_level,created_by)
 VALUES(p_school_id,btrim(p_name),p_grade_level,uid) RETURNING id INTO cid;
 RETURN cid;
END $$;

CREATE OR REPLACE FUNCTION public.ventra_create_class_invite(p_classroom_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE uid uuid:=auth.uid(); sid uuid; token uuid;
BEGIN
 SELECT school_id INTO sid FROM public.ventra_classrooms WHERE id=p_classroom_id;
 IF uid IS NULL OR sid IS NULL OR NOT EXISTS (
  SELECT 1 FROM public.ventra_school_staff s
  WHERE s.school_id=sid AND s.user_id=uid AND s.role IN ('owner','teacher')
 ) THEN RAISE EXCEPTION 'Sınıf daveti oluşturma yetkisi yok'; END IF;
 INSERT INTO public.ventra_class_invites(school_id,classroom_id,created_by)
 VALUES(sid,p_classroom_id,uid) RETURNING code INTO token;
 RETURN token;
END $$;

-- Only authenticated, profile-owning parents can join with a cryptographically random
-- 122-bit UUID code. Limited time/use, row lock, school/class FK, and no child signup.
CREATE OR REPLACE FUNCTION public.ventra_enroll_child(p_profile_id uuid,p_code uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE uid uuid:=auth.uid(); invite_row public.ventra_class_invites%ROWTYPE;
 class_name text; school_name text; inserted_count integer;
BEGIN
 IF uid IS NULL OR NOT EXISTS (
  SELECT 1 FROM public.player_profiles p WHERE p.id=p_profile_id
    AND p.user_id=uid AND p.deleted_at IS NULL
 ) THEN RAISE EXCEPTION 'Çocuk için ebeveyn yetkisi gerekli'; END IF;
 SELECT * INTO invite_row FROM public.ventra_class_invites
  WHERE code=p_code AND expires_at>now() AND used_count<max_uses FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Davet kodu geçersiz veya süresi dolmuş'; END IF;
 INSERT INTO public.ventra_class_enrollments(school_id,classroom_id,profile_id,parent_id)
 VALUES(invite_row.school_id,invite_row.classroom_id,p_profile_id,uid)
 ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS inserted_count=ROW_COUNT;
 IF inserted_count=1 THEN
  UPDATE public.ventra_class_invites SET used_count=used_count+1 WHERE id=invite_row.id;
 END IF;
 SELECT c.name,s.name INTO class_name,school_name
 FROM public.ventra_classrooms c JOIN public.ventra_schools s ON s.id=c.school_id
 WHERE c.id=invite_row.classroom_id AND c.school_id=invite_row.school_id;
 RETURN school_name || ' · ' || class_name;
END $$;

CREATE OR REPLACE FUNCTION public.ventra_leave_class(p_profile_id uuid,p_classroom_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE changed int;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Oturum gerekli'; END IF;
 DELETE FROM public.ventra_class_enrollments
 WHERE profile_id=p_profile_id AND classroom_id=p_classroom_id AND parent_id=auth.uid();
 GET DIAGNOSTICS changed=ROW_COUNT;
 RETURN changed=1;
END $$;

-- Staff roster: the child explicitly joined via the parent's account.
-- Only nickname, grade, and aggregate completion/stars; no event metrics or PII.
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
      AND pe.event_type='game_level' AND pe.game_id IN
       ('island_word_garden_steps','island_word_garden_colors','island_word_garden_numbers')
    GROUP BY pe.game_id,pe.level_id
  ) t
 ) scores ON true
 WHERE e.classroom_id=p_classroom_id AND e.school_id=sid
 ORDER BY p.nickname,p.id;
END $$;

-- Parent sees only their own enrollments; no roster bypass through this RPC.
CREATE OR REPLACE FUNCTION public.ventra_my_classrooms()
RETURNS TABLE(profile_id uuid,classroom_id uuid,school_name text,class_name text)
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
 SELECT e.profile_id,e.classroom_id,s.name,c.name
 FROM public.ventra_class_enrollments e
 JOIN public.player_profiles p ON p.id=e.profile_id AND p.user_id=e.parent_id AND p.deleted_at IS NULL
 JOIN public.ventra_classrooms c ON c.id=e.classroom_id
 JOIN public.ventra_schools s ON s.id=e.school_id
 WHERE e.parent_id=auth.uid() ORDER BY s.name,c.name;
$$;

-- A parent's existing P2 tombstone must also withdraw school membership.
CREATE OR REPLACE FUNCTION public.ventra_cleanup_deleted_child()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
BEGIN
 IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
   DELETE FROM public.ventra_class_enrollments e WHERE e.profile_id=NEW.id;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_ventra_cleanup_deleted_child ON public.player_profiles;
CREATE TRIGGER trg_ventra_cleanup_deleted_child AFTER UPDATE OF deleted_at
 ON public.player_profiles FOR EACH ROW EXECUTE FUNCTION public.ventra_cleanup_deleted_child();

REVOKE ALL ON FUNCTION public.ventra_create_school(text,text),
 public.ventra_create_classroom(uuid,text,smallint),
 public.ventra_create_class_invite(uuid),
 public.ventra_enroll_child(uuid,uuid),
 public.ventra_leave_class(uuid,uuid),
 public.ventra_teacher_roster(uuid),
 public.ventra_my_classrooms() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ventra_create_school(text,text),
 public.ventra_create_classroom(uuid,text,smallint),
 public.ventra_create_class_invite(uuid),
 public.ventra_enroll_child(uuid,uuid),
 public.ventra_leave_class(uuid,uuid),
 public.ventra_teacher_roster(uuid),
 public.ventra_my_classrooms() TO authenticated;
