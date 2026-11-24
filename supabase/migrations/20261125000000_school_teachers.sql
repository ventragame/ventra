-- Okul Paneli: several teachers in one school.
--
-- Prerequisite: 20261124000000_school_panel_management.sql (apply it first).
-- The web client asks ventra_school_api_version(); version 3 turns on the
-- teachers tools. Without this file the panel keeps the version 2 tools.
--
-- Roles (ventra_school_staff.role):
--   'owner'   shown as "Yönetici": school settings, teachers, every class.
--   'teacher' shown as "Öğretmen": only the classes they are assigned to
--             (a class they create is assigned to them). They never see the
--             students of other classes.
-- A school always keeps at least one owner.
--
-- Teacher invitations are bound to an e-mail address and carry no secret
-- code: only an adult signed in with that confirmed address can accept.
--
-- The school area stays tied to one account (ventra_schools.owner_id, whose
-- deletion still deletes the school). When that person leaves or is removed,
-- the school moves to another owner. One account can still open only one
-- school area of its own, but can teach in several schools.

-- 1. Tables ---------------------------------------------------------------
ALTER TABLE public.ventra_school_staff
 ADD COLUMN IF NOT EXISTS display_name text NULL,
 ADD COLUMN IF NOT EXISTS invited_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='chk_ventra_staff_display_name') THEN
  ALTER TABLE public.ventra_school_staff ADD CONSTRAINT chk_ventra_staff_display_name
   CHECK (display_name IS NULL OR char_length(btrim(display_name)) BETWEEN 2 AND 60);
 END IF;
END $$;

-- owner_id was UNIQUE; a school area can now move to another owner who may
-- already hold one, so the limit is checked in ventra_create_school instead.
DO $$ DECLARE c text; BEGIN
 FOR c IN SELECT con.conname FROM pg_constraint con
  JOIN pg_attribute a ON a.attrelid=con.conrelid AND a.attnum=ANY(con.conkey)
  WHERE con.conrelid='public.ventra_schools'::regclass AND con.contype='u'
    AND a.attname='owner_id' AND cardinality(con.conkey)=1
 LOOP EXECUTE format('ALTER TABLE public.ventra_schools DROP CONSTRAINT %I',c); END LOOP;
END $$;
CREATE INDEX IF NOT EXISTS idx_ventra_schools_owner ON public.ventra_schools(owner_id);

CREATE TABLE IF NOT EXISTS public.ventra_classroom_teachers (
 classroom_id uuid NOT NULL,
 school_id uuid NOT NULL,
 user_id uuid NOT NULL,
 added_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (classroom_id,user_id),
 FOREIGN KEY (classroom_id,school_id) REFERENCES public.ventra_classrooms(id,school_id) ON DELETE CASCADE,
 FOREIGN KEY (school_id,user_id) REFERENCES public.ventra_school_staff(school_id,user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_ventra_classroom_teachers_user ON public.ventra_classroom_teachers(user_id);

CREATE TABLE IF NOT EXISTS public.ventra_staff_invites (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 school_id uuid NOT NULL REFERENCES public.ventra_schools(id) ON DELETE CASCADE,
 email text NOT NULL CHECK (email=lower(btrim(email)) AND char_length(email)<=254
  AND email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
 role text NOT NULL CHECK (role IN ('owner','teacher')),
 classroom_ids uuid[] NOT NULL DEFAULT '{}' CHECK (cardinality(classroom_ids)<=50),
 invited_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT (now()+interval '14 days'),
 UNIQUE (school_id,email)
);
CREATE INDEX IF NOT EXISTS idx_ventra_staff_invites_email ON public.ventra_staff_invites(email);

ALTER TABLE public.ventra_classroom_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventra_classroom_teachers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.ventra_staff_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventra_staff_invites FORCE ROW LEVEL SECURITY;
-- No client access at all: everything goes through the functions below.
REVOKE ALL ON public.ventra_classroom_teachers,public.ventra_staff_invites FROM PUBLIC,anon,authenticated;

-- Every existing class keeps the teacher who created it.
INSERT INTO public.ventra_classroom_teachers(classroom_id,school_id,user_id)
SELECT c.id,c.school_id,c.created_by FROM public.ventra_classrooms c
JOIN public.ventra_school_staff s ON s.school_id=c.school_id AND s.user_id=c.created_by
ON CONFLICT DO NOTHING;

-- 2. Access helpers -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ventra_school_role(p_school_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
 SELECT s.role FROM public.ventra_school_staff s
 WHERE s.school_id=p_school_id AND s.user_id=auth.uid()
$$;

-- Owners open every class of their school; teachers only their own classes.
CREATE OR REPLACE FUNCTION public.ventra_can_open_classroom(p_classroom_id uuid,p_school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
 SELECT auth.uid() IS NOT NULL AND (
  coalesce(public.ventra_school_role(p_school_id)='owner',false)
  OR EXISTS (SELECT 1 FROM public.ventra_classroom_teachers t
   WHERE t.classroom_id=p_classroom_id AND t.school_id=p_school_id AND t.user_id=auth.uid()))
$$;

-- Used by every class-level function since 20261124: now class-scoped.
CREATE OR REPLACE FUNCTION public.ventra_staff_classroom(p_classroom_id uuid)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE sid uuid;
BEGIN
 SELECT c.school_id INTO sid FROM public.ventra_classrooms c WHERE c.id=p_classroom_id;
 IF sid IS NULL OR NOT public.ventra_can_open_classroom(p_classroom_id,sid) THEN
  RAISE EXCEPTION 'Bu sınıf için öğretmen yetkisi yok';
 END IF;
 RETURN sid;
END $$;

DROP POLICY IF EXISTS ventra_class_staff_read ON public.ventra_classrooms;
CREATE POLICY ventra_class_staff_read ON public.ventra_classrooms
 FOR SELECT TO authenticated USING (public.ventra_can_open_classroom(id,school_id));

-- 3. Older functions, now class-scoped -----------------------------------
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
 IF EXISTS (SELECT 1 FROM public.ventra_schools s WHERE s.owner_id=uid)
   THEN RAISE EXCEPTION 'Bu hesabın zaten bir okul alanı var'; END IF;
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
 IF uid IS NULL OR public.ventra_school_role(p_school_id) IS NULL
  THEN RAISE EXCEPTION 'Okul öğretmeni yetkisi gerekli'; END IF;
 IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 2 AND 60
   OR p_grade_level NOT BETWEEN 1 AND 8 OR p_grade_level IS NULL
  THEN RAISE EXCEPTION 'Sınıf adı veya seviyesi geçersiz'; END IF;
 BEGIN
  INSERT INTO public.ventra_classrooms(school_id,name,grade_level,created_by)
  VALUES(p_school_id,btrim(p_name),p_grade_level,uid) RETURNING id INTO cid;
 EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'Bu adla bir sınıf zaten var';
 END;
 INSERT INTO public.ventra_classroom_teachers(classroom_id,school_id,user_id)
 VALUES(cid,p_school_id,uid) ON CONFLICT DO NOTHING;
 RETURN cid;
END $$;

-- Deleting a class affects every teacher of it: owners only.
CREATE OR REPLACE FUNCTION public.ventra_delete_classroom(p_classroom_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE sid uuid;
BEGIN
 SELECT c.school_id INTO sid FROM public.ventra_classrooms c WHERE c.id=p_classroom_id;
 IF sid IS NULL OR public.ventra_school_role(sid) IS DISTINCT FROM 'owner' THEN
  RAISE EXCEPTION 'Sınıfı yalnızca okul yöneticisi silebilir';
 END IF;
 DELETE FROM public.ventra_classrooms c WHERE c.id=p_classroom_id AND c.school_id=sid;
 RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.ventra_create_class_invite(p_classroom_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE sid uuid:=public.ventra_staff_classroom(p_classroom_id); token uuid;
BEGIN
 INSERT INTO public.ventra_class_invites(school_id,classroom_id,created_by)
 VALUES(sid,p_classroom_id,auth.uid()) RETURNING code INTO token;
 RETURN token;
END $$;

CREATE OR REPLACE FUNCTION public.ventra_revoke_class_invite(p_invite_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE sid uuid; cid uuid;
BEGIN
 SELECT i.school_id,i.classroom_id INTO sid,cid FROM public.ventra_class_invites i WHERE i.id=p_invite_id;
 IF sid IS NULL OR NOT public.ventra_can_open_classroom(cid,sid) THEN
  RAISE EXCEPTION 'Bu davet için öğretmen yetkisi yok';
 END IF;
 DELETE FROM public.ventra_class_invites i WHERE i.id=p_invite_id;
 RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.ventra_teacher_roster(p_classroom_id uuid)
RETURNS TABLE(profile_id uuid,nickname text,grade_level smallint,completed_levels bigint,stars bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE sid uuid:=public.ventra_staff_classroom(p_classroom_id);
BEGIN
 RETURN QUERY
 SELECT p.id,p.nickname::text,p.grade_level,x.completed_levels,x.stars
 FROM public.ventra_class_enrollments e
 JOIN public.player_profiles p ON p.id=e.profile_id AND p.user_id=e.parent_id AND p.deleted_at IS NULL
 CROSS JOIN LATERAL public.ventra_child_english_summary(p.id,p.user_id) x
 WHERE e.classroom_id=p_classroom_id AND e.school_id=sid
 ORDER BY p.nickname,p.id;
END $$;

CREATE OR REPLACE FUNCTION public.ventra_class_overview(p_school_id uuid)
RETURNS TABLE(id uuid,school_id uuid,name text,grade_level smallint,created_at timestamptz,
 student_count bigint,active_invites bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
BEGIN
 IF public.ventra_school_role(p_school_id) IS NULL THEN
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
 WHERE c.school_id=p_school_id AND public.ventra_can_open_classroom(c.id,c.school_id)
 ORDER BY c.name
 LIMIT 200;
END $$;

-- 4. Classes with their teachers ------------------------------------------
CREATE OR REPLACE FUNCTION public.ventra_school_classes(p_school_id uuid)
RETURNS TABLE(id uuid,school_id uuid,name text,grade_level smallint,created_at timestamptz,
 student_count bigint,active_invites bigint,teachers jsonb,mine boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
BEGIN
 IF public.ventra_school_role(p_school_id) IS NULL THEN
  RAISE EXCEPTION 'Okul öğretmeni yetkisi gerekli';
 END IF;
 RETURN QUERY
 SELECT c.id,c.school_id,c.name,c.grade_level,c.created_at,
  (SELECT count(*) FROM public.ventra_class_enrollments e
    JOIN public.player_profiles p ON p.id=e.profile_id AND p.user_id=e.parent_id AND p.deleted_at IS NULL
    WHERE e.classroom_id=c.id),
  (SELECT count(*) FROM public.ventra_class_invites i
    WHERE i.classroom_id=c.id AND i.expires_at>now() AND i.used_count<i.max_uses),
  (SELECT coalesce(jsonb_agg(jsonb_build_object('user_id',t.user_id,'name',s.display_name)
     ORDER BY s.display_name NULLS LAST,t.added_at),'[]'::jsonb)
    FROM public.ventra_classroom_teachers t
    JOIN public.ventra_school_staff s ON s.school_id=t.school_id AND s.user_id=t.user_id
    WHERE t.classroom_id=c.id),
  EXISTS (SELECT 1 FROM public.ventra_classroom_teachers t WHERE t.classroom_id=c.id AND t.user_id=auth.uid())
 FROM public.ventra_classrooms c
 WHERE c.school_id=p_school_id AND public.ventra_can_open_classroom(c.id,c.school_id)
 ORDER BY c.name
 LIMIT 200;
END $$;

-- 5. The team ---------------------------------------------------------------
-- Owners see colleagues' e-mail addresses; teachers see names and roles, and
-- only the classes they can open themselves.
CREATE OR REPLACE FUNCTION public.ventra_school_staff_list(p_school_id uuid)
RETURNS TABLE(user_id uuid,display_name text,email text,role text,joined_at timestamptz,
 classroom_ids uuid[],is_me boolean,is_holder boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE my_role text:=public.ventra_school_role(p_school_id);
BEGIN
 IF my_role IS NULL THEN RAISE EXCEPTION 'Okul öğretmeni yetkisi gerekli'; END IF;
 RETURN QUERY
 SELECT s.user_id,s.display_name,
  CASE WHEN my_role='owner' OR s.user_id=auth.uid() THEN u.email::text END,
  s.role,s.created_at,
  coalesce((SELECT array_agg(t.classroom_id ORDER BY t.added_at) FROM public.ventra_classroom_teachers t
   WHERE t.school_id=s.school_id AND t.user_id=s.user_id
     AND (my_role='owner' OR public.ventra_can_open_classroom(t.classroom_id,t.school_id))),'{}'::uuid[]),
  s.user_id=auth.uid(),
  EXISTS (SELECT 1 FROM public.ventra_schools x WHERE x.id=s.school_id AND x.owner_id=s.user_id)
 FROM public.ventra_school_staff s
 LEFT JOIN auth.users u ON u.id=s.user_id
 WHERE s.school_id=p_school_id
 ORDER BY (s.role='owner') DESC,lower(coalesce(s.display_name,u.email::text,''));
END $$;

CREATE OR REPLACE FUNCTION public.ventra_set_my_display_name(p_school_id uuid,p_name text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE clean_name text:=btrim(regexp_replace(coalesce(p_name,''),'[[:space:]]+',' ','g'));
BEGIN
 IF public.ventra_school_role(p_school_id) IS NULL THEN RAISE EXCEPTION 'Okul öğretmeni yetkisi gerekli'; END IF;
 IF char_length(clean_name) NOT BETWEEN 2 AND 60 THEN RAISE EXCEPTION 'Adınız 2-60 karakter olmalı'; END IF;
 UPDATE public.ventra_school_staff s SET display_name=clean_name
  WHERE s.school_id=p_school_id AND s.user_id=auth.uid();
 RETURN FOUND;
END $$;

-- Invite by e-mail (owners). Inviting the same address again refreshes it.
CREATE OR REPLACE FUNCTION public.ventra_invite_staff(p_school_id uuid,p_email text,p_role text,p_classroom_ids uuid[] DEFAULT '{}')
RETURNS TABLE(invite_id uuid,valid_until timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE clean_email text:=lower(btrim(coalesce(p_email,''))); chosen uuid[]; new_id uuid; new_expiry timestamptz;
BEGIN
 IF public.ventra_school_role(p_school_id) IS DISTINCT FROM 'owner' THEN
  RAISE EXCEPTION 'Öğretmenleri yalnızca okul yöneticisi davet edebilir';
 END IF;
 IF char_length(clean_email)>254 OR clean_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
  RAISE EXCEPTION 'E-posta adresi geçersiz';
 END IF;
 IF p_role IS NULL OR p_role NOT IN ('owner','teacher') THEN RAISE EXCEPTION 'Rol geçersiz'; END IF;
 IF EXISTS (SELECT 1 FROM public.ventra_school_staff s JOIN auth.users u ON u.id=s.user_id
   WHERE s.school_id=p_school_id AND lower(u.email::text)=clean_email) THEN
  RAISE EXCEPTION 'Bu kişi zaten okulunuzda';
 END IF;
 IF (SELECT count(*) FROM public.ventra_staff_invites i WHERE i.school_id=p_school_id AND i.email<>clean_email)>=50 THEN
  RAISE EXCEPTION 'Bekleyen öğretmen daveti sınırına ulaşıldı';
 END IF;
 SELECT coalesce(array_agg(c.id),'{}'::uuid[]) INTO chosen FROM public.ventra_classrooms c
  WHERE c.school_id=p_school_id AND c.id=ANY(coalesce(p_classroom_ids,'{}'::uuid[]));
 INSERT INTO public.ventra_staff_invites AS i(school_id,email,role,classroom_ids,invited_by,expires_at)
 VALUES(p_school_id,clean_email,p_role,chosen,auth.uid(),now()+interval '14 days')
 ON CONFLICT (school_id,email) DO UPDATE SET role=EXCLUDED.role,classroom_ids=EXCLUDED.classroom_ids,
  invited_by=EXCLUDED.invited_by,created_at=now(),expires_at=EXCLUDED.expires_at
 RETURNING i.id,i.expires_at INTO new_id,new_expiry;
 invite_id:=new_id; valid_until:=new_expiry;
 RETURN NEXT;
END $$;

CREATE OR REPLACE FUNCTION public.ventra_staff_invites_pending(p_school_id uuid)
RETURNS TABLE(invite_id uuid,email text,role text,class_names text[],valid_until timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
BEGIN
 IF public.ventra_school_role(p_school_id) IS DISTINCT FROM 'owner' THEN
  RAISE EXCEPTION 'Öğretmen davetlerini yalnızca okul yöneticisi görebilir';
 END IF;
 RETURN QUERY
 SELECT i.id,i.email,i.role,
  coalesce((SELECT array_agg(c.name ORDER BY c.name) FROM public.ventra_classrooms c
   WHERE c.school_id=i.school_id AND c.id=ANY(i.classroom_ids)),'{}'::text[]),
  i.expires_at
 FROM public.ventra_staff_invites i
 WHERE i.school_id=p_school_id AND i.expires_at>now()
 ORDER BY i.created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION public.ventra_cancel_staff_invite(p_invite_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE sid uuid;
BEGIN
 SELECT i.school_id INTO sid FROM public.ventra_staff_invites i WHERE i.id=p_invite_id;
 IF sid IS NULL OR public.ventra_school_role(sid) IS DISTINCT FROM 'owner' THEN
  RAISE EXCEPTION 'Öğretmen davetlerini yalnızca okul yöneticisi geri alabilir';
 END IF;
 DELETE FROM public.ventra_staff_invites i WHERE i.id=p_invite_id;
 RETURN FOUND;
END $$;

-- The signed-in adult's own invitations (matched by confirmed e-mail).
CREATE OR REPLACE FUNCTION public.ventra_my_staff_invites()
RETURNS TABLE(invite_id uuid,school_id uuid,school_name text,brand_color text,verified boolean,role text,
 invited_by_name text,class_names text[],valid_until timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE my_email text;
BEGIN
 SELECT lower(u.email::text) INTO my_email FROM auth.users u
  WHERE u.id=auth.uid() AND u.email_confirmed_at IS NOT NULL;
 IF my_email IS NULL THEN RETURN; END IF;
 RETURN QUERY
 SELECT i.id,i.school_id,s.name,s.brand_color,s.verified_at IS NOT NULL,i.role,
  (SELECT st.display_name FROM public.ventra_school_staff st WHERE st.school_id=i.school_id AND st.user_id=i.invited_by),
  coalesce((SELECT array_agg(c.name ORDER BY c.name) FROM public.ventra_classrooms c
   WHERE c.school_id=i.school_id AND c.id=ANY(i.classroom_ids)),'{}'::text[]),
  i.expires_at
 FROM public.ventra_staff_invites i
 JOIN public.ventra_schools s ON s.id=i.school_id
 WHERE i.email=my_email AND i.expires_at>now()
   AND NOT EXISTS (SELECT 1 FROM public.ventra_school_staff x WHERE x.school_id=i.school_id AND x.user_id=auth.uid())
 ORDER BY i.created_at DESC;
END $$;

CREATE OR REPLACE FUNCTION public.ventra_accept_staff_invite(p_invite_id uuid,p_display_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE uid uuid:=auth.uid(); my_email text; inv public.ventra_staff_invites%ROWTYPE;
 clean_name text:=btrim(regexp_replace(coalesce(p_display_name,''),'[[:space:]]+',' ','g'));
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Yetişkin hesabı gerekli'; END IF;
 SELECT lower(u.email::text) INTO my_email FROM auth.users u WHERE u.id=uid AND u.email_confirmed_at IS NOT NULL;
 SELECT * INTO inv FROM public.ventra_staff_invites i
  WHERE i.id=p_invite_id AND i.email=my_email AND i.expires_at>now() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Davet bulunamadı ya da süresi dolmuş'; END IF;
 IF char_length(clean_name) NOT BETWEEN 2 AND 60 THEN RAISE EXCEPTION 'Adınız 2-60 karakter olmalı'; END IF;
 INSERT INTO public.ventra_school_staff(school_id,user_id,role,display_name,invited_by)
 VALUES(inv.school_id,uid,inv.role,clean_name,inv.invited_by)
 ON CONFLICT (school_id,user_id) DO UPDATE SET display_name=EXCLUDED.display_name;
 INSERT INTO public.ventra_classroom_teachers(classroom_id,school_id,user_id)
 SELECT c.id,c.school_id,uid FROM public.ventra_classrooms c
 WHERE c.school_id=inv.school_id AND c.id=ANY(inv.classroom_ids)
 ON CONFLICT DO NOTHING;
 DELETE FROM public.ventra_staff_invites i WHERE i.id=inv.id;
 RETURN inv.school_id;
END $$;

CREATE OR REPLACE FUNCTION public.ventra_decline_staff_invite(p_invite_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE my_email text;
BEGIN
 SELECT lower(u.email::text) INTO my_email FROM auth.users u WHERE u.id=auth.uid() AND u.email_confirmed_at IS NOT NULL;
 DELETE FROM public.ventra_staff_invites i WHERE i.id=p_invite_id AND i.email=my_email;
 IF NOT FOUND THEN RAISE EXCEPTION 'Davet bulunamadı ya da süresi dolmuş'; END IF;
 RETURN true;
END $$;

-- Roles. The school always keeps at least one owner (rows are locked so two
-- owners cannot demote each other at the same moment).
CREATE OR REPLACE FUNCTION public.ventra_set_staff_role(p_school_id uuid,p_user_id uuid,p_role text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE current_role_of text; owners integer;
BEGIN
 IF public.ventra_school_role(p_school_id) IS DISTINCT FROM 'owner' THEN
  RAISE EXCEPTION 'Rolleri yalnızca okul yöneticisi değiştirebilir';
 END IF;
 IF p_role IS NULL OR p_role NOT IN ('owner','teacher') THEN RAISE EXCEPTION 'Rol geçersiz'; END IF;
 PERFORM 1 FROM public.ventra_school_staff s WHERE s.school_id=p_school_id FOR UPDATE;
 SELECT s.role INTO current_role_of FROM public.ventra_school_staff s WHERE s.school_id=p_school_id AND s.user_id=p_user_id;
 IF current_role_of IS NULL THEN RAISE EXCEPTION 'Bu kişi okulun öğretmeni değil'; END IF;
 SELECT count(*) INTO owners FROM public.ventra_school_staff s WHERE s.school_id=p_school_id AND s.role='owner';
 IF current_role_of='owner' AND p_role='teacher' AND owners<=1 THEN
  RAISE EXCEPTION 'Okulda en az bir yönetici kalmalı';
 END IF;
 UPDATE public.ventra_school_staff s SET role=p_role WHERE s.school_id=p_school_id AND s.user_id=p_user_id;
 RETURN FOUND;
END $$;

-- Owners remove anyone; everyone can leave. The last owner cannot go. When
-- the school's account holder goes, the school moves to the longest-serving
-- remaining owner.
CREATE OR REPLACE FUNCTION public.ventra_remove_staff(p_school_id uuid,p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE uid uuid:=auth.uid(); target_role text; owners integer; heir uuid;
BEGIN
 IF uid IS NULL OR (p_user_id<>uid AND public.ventra_school_role(p_school_id) IS DISTINCT FROM 'owner') THEN
  RAISE EXCEPTION 'Öğretmenleri yalnızca okul yöneticisi çıkarabilir';
 END IF;
 PERFORM 1 FROM public.ventra_school_staff s WHERE s.school_id=p_school_id FOR UPDATE;
 SELECT s.role INTO target_role FROM public.ventra_school_staff s WHERE s.school_id=p_school_id AND s.user_id=p_user_id;
 IF target_role IS NULL THEN RAISE EXCEPTION 'Bu kişi okulun öğretmeni değil'; END IF;
 SELECT count(*) INTO owners FROM public.ventra_school_staff s WHERE s.school_id=p_school_id AND s.role='owner';
 IF target_role='owner' AND owners<=1 THEN
  RAISE EXCEPTION 'Okulda en az bir yönetici kalmalı; önce başka birini yönetici yapın';
 END IF;
 IF EXISTS (SELECT 1 FROM public.ventra_schools x WHERE x.id=p_school_id AND x.owner_id=p_user_id) THEN
  SELECT s.user_id INTO heir FROM public.ventra_school_staff s
   WHERE s.school_id=p_school_id AND s.role='owner' AND s.user_id<>p_user_id
   ORDER BY s.created_at LIMIT 1;
  UPDATE public.ventra_schools x SET owner_id=heir WHERE x.id=p_school_id;
 END IF;
 DELETE FROM public.ventra_school_staff s WHERE s.school_id=p_school_id AND s.user_id=p_user_id;
 RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.ventra_assign_teacher(p_classroom_id uuid,p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE sid uuid;
BEGIN
 SELECT c.school_id INTO sid FROM public.ventra_classrooms c WHERE c.id=p_classroom_id;
 IF sid IS NULL OR public.ventra_school_role(sid) IS DISTINCT FROM 'owner' THEN
  RAISE EXCEPTION 'Sınıflara öğretmeni yalnızca okul yöneticisi atayabilir';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.ventra_school_staff s WHERE s.school_id=sid AND s.user_id=p_user_id) THEN
  RAISE EXCEPTION 'Bu kişi okulun öğretmeni değil';
 END IF;
 INSERT INTO public.ventra_classroom_teachers(classroom_id,school_id,user_id)
 VALUES(p_classroom_id,sid,p_user_id) ON CONFLICT DO NOTHING;
 RETURN true;
END $$;

-- Owners take anyone off a class; a teacher can step off their own class.
CREATE OR REPLACE FUNCTION public.ventra_unassign_teacher(p_classroom_id uuid,p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
DECLARE sid uuid;
BEGIN
 SELECT c.school_id INTO sid FROM public.ventra_classrooms c WHERE c.id=p_classroom_id;
 IF sid IS NULL OR auth.uid() IS NULL
   OR (p_user_id<>auth.uid() AND public.ventra_school_role(sid) IS DISTINCT FROM 'owner') THEN
  RAISE EXCEPTION 'Sınıf öğretmenlerini yalnızca okul yöneticisi değiştirebilir';
 END IF;
 DELETE FROM public.ventra_classroom_teachers t WHERE t.classroom_id=p_classroom_id AND t.user_id=p_user_id;
 RETURN FOUND;
END $$;

-- A parent holding a valid class code sees the names of that class's
-- teachers before agreeing (names only; nothing else about them).
CREATE OR REPLACE FUNCTION public.ventra_preview_class_teachers(p_code uuid)
RETURNS TABLE(display_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,pg_temp
AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Yetişkin hesabı gerekli'; END IF;
 RETURN QUERY
 SELECT s.display_name
 FROM public.ventra_class_invites i
 JOIN public.ventra_classroom_teachers t ON t.classroom_id=i.classroom_id AND t.school_id=i.school_id
 JOIN public.ventra_school_staff s ON s.school_id=t.school_id AND s.user_id=t.user_id
 WHERE i.code=p_code AND i.expires_at>now() AND i.used_count<i.max_uses AND s.display_name IS NOT NULL
 ORDER BY s.display_name
 LIMIT 10;
END $$;

CREATE OR REPLACE FUNCTION public.ventra_school_api_version()
RETURNS integer LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,pg_temp
AS $$ SELECT 3 $$;

-- 6. Grants -----------------------------------------------------------------
REVOKE ALL ON FUNCTION public.ventra_school_role(uuid),
 public.ventra_staff_classroom(uuid) FROM PUBLIC,anon,authenticated;
-- Row policies call this as the signed-in user; it only answers about them.
REVOKE ALL ON FUNCTION public.ventra_can_open_classroom(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ventra_can_open_classroom(uuid,uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.ventra_create_school(text,text),
 public.ventra_create_classroom(uuid,text,smallint),
 public.ventra_delete_classroom(uuid),
 public.ventra_create_class_invite(uuid),
 public.ventra_revoke_class_invite(uuid),
 public.ventra_teacher_roster(uuid),
 public.ventra_class_overview(uuid),
 public.ventra_school_classes(uuid),
 public.ventra_school_staff_list(uuid),
 public.ventra_set_my_display_name(uuid,text),
 public.ventra_invite_staff(uuid,text,text,uuid[]),
 public.ventra_staff_invites_pending(uuid),
 public.ventra_cancel_staff_invite(uuid),
 public.ventra_my_staff_invites(),
 public.ventra_accept_staff_invite(uuid,text),
 public.ventra_decline_staff_invite(uuid),
 public.ventra_set_staff_role(uuid,uuid,text),
 public.ventra_remove_staff(uuid,uuid),
 public.ventra_assign_teacher(uuid,uuid),
 public.ventra_unassign_teacher(uuid,uuid),
 public.ventra_preview_class_teachers(uuid),
 public.ventra_school_api_version() FROM PUBLIC,anon;

GRANT EXECUTE ON FUNCTION public.ventra_create_school(text,text),
 public.ventra_create_classroom(uuid,text,smallint),
 public.ventra_delete_classroom(uuid),
 public.ventra_create_class_invite(uuid),
 public.ventra_revoke_class_invite(uuid),
 public.ventra_teacher_roster(uuid),
 public.ventra_class_overview(uuid),
 public.ventra_school_classes(uuid),
 public.ventra_school_staff_list(uuid),
 public.ventra_set_my_display_name(uuid,text),
 public.ventra_invite_staff(uuid,text,text,uuid[]),
 public.ventra_staff_invites_pending(uuid),
 public.ventra_cancel_staff_invite(uuid),
 public.ventra_my_staff_invites(),
 public.ventra_accept_staff_invite(uuid,text),
 public.ventra_decline_staff_invite(uuid),
 public.ventra_set_staff_role(uuid,uuid,text),
 public.ventra_remove_staff(uuid,uuid),
 public.ventra_assign_teacher(uuid,uuid),
 public.ventra_unassign_teacher(uuid,uuid),
 public.ventra_preview_class_teachers(uuid),
 public.ventra_school_api_version() TO authenticated;
