-- ==============================================================================
-- VENTRA — Phase 3.4: Player Profiles & Progress Sync Schema
-- ==============================================================================
-- Bu migrasyon, çocuk oyuncu profillerini ve isteğe bağlı yetişkin bulut hesabına
-- bağlı senkronize edilen ilerleme etkinliklerini tanımlar.
--
-- Güvenlik ve Gizlilik İlkeleri:
-- 1. Çocuk profilleri anonim takma ad ve avatarlarla temsil edilir.
-- 2. anon rolünün bu tablolara doğrudan erişim izni yoktur (REVOKE ALL).
-- 3. Row Level Security (RLS) ile yetişkin kullanıcı yalnızca kendi hesabına
--    (auth.uid() = user_id) ait profilleri ve etkinlikleri okuyup yazabilir.
-- 4. Çocuk profili sahipliği (user_id) istemciden keyfi olarak değiştirilemez.
-- ==============================================================================

-- 1. EXTENSIONS & FUNCTIONS
-- PostgreSQL 13+ yerleşik gen_random_uuid() fonksiyonunu kullanır.

-- 2. TABLO: player_profiles
CREATE TABLE IF NOT EXISTS public.player_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname VARCHAR(30) NOT NULL CONSTRAINT chk_nickname_length CHECK (char_length(trim(nickname)) >= 2),
    avatar_id VARCHAR(50) NOT NULL DEFAULT 'avatar_explorer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_played_at TIMESTAMPTZ NULL,
    deleted_at TIMESTAMPTZ NULL,
    -- Gelecek sürümlerde öğretmen ve okul/sınıf desteği için genişletilebilir nullable alanlar
    school_id UUID NULL,
    classroom_id UUID NULL,
    -- Sahiplik bütünlüğü: (id, user_id) ikilisi tekil olmalıdır (composite FK referansı için)
    CONSTRAINT uq_player_profiles_id_user UNIQUE (id, user_id)
);

-- 3. TABLO: progress_events
-- Her öğrenme alıştırması ve oyun seviyesi tamamlanması tekil bir olaydır (Event Sourcing)
CREATE TABLE IF NOT EXISTS public.progress_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id VARCHAR(100) UNIQUE NOT NULL, -- İstemci idempotency anahtarı
    profile_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CONSTRAINT chk_event_type CHECK (event_type IN ('learning_session', 'game_level')),
    schema_version INT NOT NULL DEFAULT 1,
    game_id VARCHAR(50) NULL,
    level_id INT NULL,
    skill_id VARCHAR(100) NULL,
    score INT NOT NULL DEFAULT 0,
    stars_earned INT NOT NULL DEFAULT 0 CONSTRAINT chk_stars CHECK (stars_earned >= 0 AND stars_earned <= 3),
    accuracy_rate NUMERIC(5, 4) NOT NULL DEFAULT 0 CONSTRAINT chk_accuracy CHECK (accuracy_rate >= 0.0 AND accuracy_rate <= 1.0),
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    client_timestamp TIMESTAMPTZ NOT NULL,
    server_received_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    -- Sahiplik Garantisi: profile_id kesinlikle aynı user_id'ye ait bir profile ait olmak zorundadır!
    -- Başka bir kullanıcının profile_id'si ile event oluşturulamaz (Veritabanı seviyesi koruma)
    CONSTRAINT fk_progress_events_profile_user FOREIGN KEY (profile_id, user_id) 
        REFERENCES public.player_profiles(id, user_id) ON DELETE CASCADE
);

-- 4. İNDEKSLER
CREATE INDEX IF NOT EXISTS idx_player_profiles_user_id ON public.player_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_player_profiles_active ON public.player_profiles(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_progress_events_user_id ON public.progress_events(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_profile_id ON public.progress_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_skill_id ON public.progress_events(skill_id);
CREATE INDEX IF NOT EXISTS idx_progress_events_client_timestamp ON public.progress_events(client_timestamp DESC);

-- 5. RLS (ROW LEVEL SECURITY)
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_events ENABLE ROW LEVEL SECURITY;

-- Production Hardening: FORCE ROW LEVEL SECURITY
-- Tablo sahiplerinin ve yöneticilerin dahi RLS politikalarını yanlışlıkla atlamasını engeller
ALTER TABLE public.player_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.progress_events FORCE ROW LEVEL SECURITY;

-- Anonim rolün erişimini kesin olarak kısıtla
REVOKE ALL ON TABLE public.player_profiles FROM anon;
REVOKE ALL ON TABLE public.progress_events FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.player_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.progress_events TO authenticated;

-- player_profiles RLS Politikaları
-- Cihazlar arası silme (tombstone) senkronizasyonu için kullanıcının silinen kayıtları da
-- (deleted_at IS NOT NULL) okuyabilmesi gerekir; böylece 2. cihaz profili yerelde temizler.
CREATE POLICY "Users can view their own profiles"
    ON public.player_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create profiles for their account"
    ON public.player_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
    ON public.player_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles"
    ON public.player_profiles
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- progress_events RLS Politikaları
CREATE POLICY "Users can view progress events of their profiles"
    ON public.progress_events
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert progress events into their profiles"
    ON public.progress_events
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.player_profiles p
            WHERE p.id = progress_events.profile_id
              AND p.user_id = auth.uid()
              AND p.deleted_at IS NULL
        )
    );

CREATE POLICY "Users can update their own progress events"
    ON public.progress_events
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress events"
    ON public.progress_events
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 6. AUDIT TRIGGER: updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_player_profiles_updated_at
    BEFORE UPDATE ON public.player_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. SUNUCU TARAFI HESAP VE VERİ SİLME (SECURITY DEFINER RPC)
-- Yetişkin kullanıcının kendi hesabını auth.users'dan kalıcı olarak silmesini sağlar.
-- auth.users silindiğinde ON DELETE CASCADE ile bağlı tüm player_profiles
-- ve progress_events kayıtları ilişkisel olarak otomatik temizlenir.
-- Güvenlik: search_path = pg_catalog, pg_temp ile şema zehirlenmesi önlenir.
CREATE OR REPLACE FUNCTION public.delete_adult_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    current_uid UUID;
BEGIN
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Yetkisiz erişim: Aktif kullanıcı oturumu bulunamadı.';
    END IF;

    DELETE FROM auth.users WHERE id = current_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_adult_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_adult_user() TO authenticated;


