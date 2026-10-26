-- ==============================================================================
-- VENTRA — Phase 3.4: Migration 20261026000001
-- Live Supabase RLS Hardening & Least-Privilege Security
-- ==============================================================================
-- Bu sürümlü migrasyon:
-- 1. Tablo sahipleri dahil tüm sorgular için FORCE ROW LEVEL SECURITY zorlar.
-- 2. (profile_id, user_id) composite sahiplik garantisini doğrular.
-- 3. delete_adult_user() fonksiyonunu search_path = pg_catalog, pg_temp ile
--    şema zehirlenmesine (search_path hijacking) karşı en katı standartta kilitler.
-- 4. anon rolünden tüm izinleri geri alır (Least Privilege).
-- Not: Bu migrasyon schema_migrations tablosuna müdahale etmez.
-- ==============================================================================

-- 1. FORCE ROW LEVEL SECURITY
-- Tablo sahibi ve postgres yöneticisi dahil tüm rollerde RLS politikalarını zorunlu kılar.
ALTER TABLE IF EXISTS public.player_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.progress_events FORCE ROW LEVEL SECURITY;

-- 2. COMPOSITE UNIQUE VE FOREIGN KEY SAHİPLİK GARANTİSİ
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_player_profiles_id_user'
    ) THEN
        ALTER TABLE public.player_profiles 
            ADD CONSTRAINT uq_player_profiles_id_user UNIQUE (id, user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_progress_events_profile_user'
    ) THEN
        ALTER TABLE public.progress_events 
            ADD CONSTRAINT fk_progress_events_profile_user 
            FOREIGN KEY (profile_id, user_id) 
            REFERENCES public.player_profiles(id, user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. EN KATI SEARCH_PATH İLE delete_adult_user() GÜVENLİĞİ
-- pg_catalog ve pg_temp dışındaki tüm şemalar kapatılarak search_path hijacking önlenir.
CREATE OR REPLACE FUNCTION public.delete_adult_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    current_uid UUID;
BEGIN
    -- Supabase Auth JWT bağlamından oturum açmış kullanıcı kimliğini al
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Yetkisiz erişim: Aktif kullanıcı oturumu bulunamadı.';
    END IF;

    -- auth.users silindiğinde ON DELETE CASCADE ile bağlı tüm player_profiles
    -- ve progress_events kayıtları ilişkisel olarak otomatik temizlenir.
    DELETE FROM auth.users WHERE id = current_uid;
END;
$$;

-- 4. EN DAR YETKİLENDİRME (LEAST PRIVILEGE)
REVOKE ALL ON TABLE public.player_profiles FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.progress_events FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_adult_user() FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.player_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.progress_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_adult_user() TO authenticated;

-- 4. EN DAR YETKİLENDİRME (LEAST PRIVILEGE)
REVOKE ALL ON TABLE public.player_profiles FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.progress_events FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_adult_user() FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.player_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.progress_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_adult_user() TO authenticated;

