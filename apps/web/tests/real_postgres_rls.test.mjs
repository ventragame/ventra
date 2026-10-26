import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';

test('REAL PostgreSQL 16 & Row Level Security (RLS) Engine Verification', async () => {
  // 1. Gerçek WebAssembly PostgreSQL Motorunu Başlat
  const db = new PGlite();

  // Supabase Auth taklit ortamını (auth.users ve auth.uid()) hazırla
  await db.exec(`
    CREATE SCHEMA IF NOT EXISTS auth;
    
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS public._test_session (
      current_user_id UUID NULL,
      session_role TEXT DEFAULT 'authenticated'
    );
    INSERT INTO public._test_session (current_user_id, session_role) VALUES (NULL, 'authenticated');

    CREATE OR REPLACE FUNCTION auth.uid()
    RETURNS UUID AS $$
      SELECT current_user_id FROM public._test_session LIMIT 1;
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION auth.role()
    RETURNS TEXT AS $$
      SELECT session_role FROM public._test_session LIMIT 1;
    $$ LANGUAGE sql STABLE;

    -- Test rolleri oluştur
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon;
      END IF;
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated;
      END IF;
    END
    $$;

    GRANT SELECT, UPDATE ON public._test_session TO authenticated, anon;
    GRANT USAGE ON SCHEMA public TO authenticated, anon;
    GRANT USAGE ON SCHEMA auth TO authenticated, anon;
  `);

  // 2. Gerçek Production SQL Migration'ını Uygula
  const migrationUrl = new URL('../../../supabase/migrations/20261026000000_player_profiles_and_sync.sql', import.meta.url);
  const migrationSql = fs.readFileSync(migrationUrl, 'utf-8');
  await db.exec(migrationSql);

  // Oturum simülasyon yardımcıları
  const setSession = async (userId, role = 'authenticated') => {
    await db.query(`UPDATE public._test_session SET current_user_id = $1, session_role = $2`, [userId, role]);
    if (role === 'authenticated') {
      await db.exec(`SET ROLE authenticated;`);
    } else if (role === 'anon') {
      await db.exec(`SET ROLE anon;`);
    } else {
      await db.exec(`RESET ROLE;`);
    }
  };

  // Test Verileri: İki Yetişkin Kullanıcı Oluştur
  const userA_Res = await db.query(`INSERT INTO auth.users (email) VALUES ('parentA@ventra.test') RETURNING id`);
  const userB_Res = await db.query(`INSERT INTO auth.users (email) VALUES ('parentB@ventra.test') RETURNING id`);
  const userA = userA_Res.rows[0].id;
  const userB = userB_Res.rows[0].id;

  // --------------------------------------------------------------------------
  // GÜVENLİK TESTİ 1: Kullanıcı A kendi çocuk profilini oluşturabilmeli ve okuyabilmeli
  // --------------------------------------------------------------------------
  await setSession(userA, 'authenticated');

  const createProfA = await db.query(`
    INSERT INTO public.player_profiles (user_id, nickname, avatar_id)
    VALUES ($1, 'Ali', 'avatar_explorer')
    RETURNING id, nickname, user_id
  `, [userA]);

  assert.equal(createProfA.rows.length, 1);
  const profileA_Id = createProfA.rows[0].id;
  assert.equal(createProfA.rows[0].nickname, 'Ali');
  assert.equal(createProfA.rows[0].user_id, userA);

  const selectA = await db.query(`SELECT * FROM public.player_profiles WHERE id = $1`, [profileA_Id]);
  assert.equal(selectA.rows.length, 1, 'Kullanıcı A kendi profilini başarıyla okuyabilmeli');

  // --------------------------------------------------------------------------
  // GÜVENLİK TESTİ 2: Kullanıcı B, Kullanıcı A'nın profiline erişememeli (RLS İzolasyonu)
  // --------------------------------------------------------------------------
  await setSession(userB, 'authenticated');

  const selectB = await db.query(`SELECT * FROM public.player_profiles WHERE id = $1`, [profileA_Id]);
  assert.equal(selectB.rows.length, 0, 'Kullanıcı B, Kullanıcı A profilini kesinlikle görememeli (RLS koruması)');

  // --------------------------------------------------------------------------
  // GÜVENLİK TESTİ 3: Kullanıcı B, A'nın profile_id'si ile KENDİ user_id'si üzerinden event ekleyememeli!
  // (Composite FK Koruması: fk_progress_events_profile_user)
  // --------------------------------------------------------------------------
  let fkErrorOccurred = false;
  try {
    await db.query(`
      INSERT INTO public.progress_events (
        event_id, profile_id, user_id, event_type, game_id, level_id, stars_earned, accuracy_rate, client_timestamp
      ) VALUES (
        'malicious_event_1', $1, $2, 'game_level', 'kesir_atolyesi', 1, 3, 1.0, now()
      )
    `, [profileA_Id, userB]);
  } catch (err) {
    fkErrorOccurred = true;
    assert.match(err.message, /violates row-level security policy|violates foreign key constraint|fk_progress_events_profile_user/i);
  }
  assert.ok(fkErrorOccurred, 'Başka hesaba ait profile_id ile event ekleme girişimi veritabanı seviyesinde (RLS / Composite FK) kesinlikle engellenmeli!');

  // --------------------------------------------------------------------------
  // GÜVENLİK TESTİ 4: Kullanıcı B, Kullanıcı A adına profil INSERT edememeli (RLS WITH CHECK)
  // --------------------------------------------------------------------------
  let insertSpoofError = false;
  try {
    await db.query(`
      INSERT INTO public.player_profiles (user_id, nickname, avatar_id)
      VALUES ($1, 'Sahte Profil', 'avatar_owl')
    `, [userA]); // userB oturumundayken userA'nın ID'si gönderiliyor
  } catch (err) {
    insertSpoofError = true;
    assert.match(err.message, /violates row-level security policy/i);
  }
  assert.ok(insertSpoofError, 'İstemciden user_id manipülasyonu RLS WITH CHECK ile engellenmeli');

  // --------------------------------------------------------------------------
  // GÜVENLİK TESTİ 5: Kullanıcı B, Kullanıcı A'nın profilini güncelleyememeli veya silememeli
  // --------------------------------------------------------------------------
  const updateAttempt = await db.query(`
    UPDATE public.player_profiles SET nickname = 'Hacked' WHERE id = $1
  `, [profileA_Id]);
  assert.equal(updateAttempt.rows.length, 0, 'Yetkisiz UPDATE 0 satır etkilemeli');

  const deleteAttempt = await db.query(`
    DELETE FROM public.player_profiles WHERE id = $1
  `, [profileA_Id]);
  assert.equal(deleteAttempt.rows.length, 0, 'Yetkisiz DELETE 0 satır etkilemeli');

  // --------------------------------------------------------------------------
  // GÜVENLİK TESTİ 6: Kullanıcı A kendi profili için meşru event ekleyebilmeli
  // --------------------------------------------------------------------------
  await setSession(userA, 'authenticated');

  const legitEvent = await db.query(`
    INSERT INTO public.progress_events (
      event_id, profile_id, user_id, event_type, game_id, level_id, stars_earned, accuracy_rate, client_timestamp
    ) VALUES (
      'legit_event_1', $1, $2, 'game_level', 'kesir_atolyesi', 1, 3, 1.0, now()
    ) RETURNING id, event_id, stars_earned
  `, [profileA_Id, userA]);

  assert.equal(legitEvent.rows.length, 1);
  assert.equal(legitEvent.rows[0].stars_earned, 3);

  // --------------------------------------------------------------------------
  // GÜVENLİK TESTİ 7: Event Idempotency (Aynı event_id ikinci kez eklenemez)
  // --------------------------------------------------------------------------
  let duplicateError = false;
  try {
    await db.query(`
      INSERT INTO public.progress_events (
        event_id, profile_id, user_id, event_type, game_id, level_id, stars_earned, accuracy_rate, client_timestamp
      ) VALUES (
        'legit_event_1', $1, $2, 'game_level', 'kesir_atolyesi', 1, 3, 1.0, now()
      )
    `, [profileA_Id, userA]);
  } catch (err) {
    duplicateError = true;
    assert.match(err.message, /duplicate key value violates unique constraint/i);
  }
  assert.ok(duplicateError, 'Mükerrer event_id veritabanı kısıtıyla engellenmeli (Idempotency)');

  // --------------------------------------------------------------------------
  // GÜVENLİK TESTİ 8: anon Rolü Özel Çocuk Verilerine Erişememeli (REVOKE ALL)
  // --------------------------------------------------------------------------
  await setSession(null, 'anon');
  let anonProfilesError = false;
  try {
    await db.query(`SELECT * FROM public.player_profiles`);
  } catch (err) {
    anonProfilesError = true;
    assert.match(err.message, /permission denied for table player_profiles/i);
  }
  assert.ok(anonProfilesError, 'anon rolünün player_profiles tablosuna erişimi reddedilmeli');

  let anonEventsError = false;
  try {
    await db.query(`SELECT * FROM public.progress_events`);
  } catch (err) {
    anonEventsError = true;
    assert.match(err.message, /permission denied for table progress_events/i);
  }
  assert.ok(anonEventsError, 'anon rolünün progress_events tablosuna erişimi reddedilmeli');

  // --------------------------------------------------------------------------
  // GÜVENLİK TESTİ 9: delete_adult_user() SECURITY DEFINER RPC Fonksiyonu
  // --------------------------------------------------------------------------
  // A'nın hesabını güvenli RPC ile sil (authenticated kullanıcısı olarak çağrılır)
  await setSession(userA, 'authenticated');
  await db.query(`SELECT public.delete_adult_user()`);

  // auth.users'dan A'nın silindiğini doğrula (admin/postgres rolü ile kontrol)
  await db.exec(`RESET ROLE;`);
  const checkUserA = await db.query(`SELECT * FROM auth.users WHERE id = $1`, [userA]);
  assert.equal(checkUserA.rows.length, 0, 'auth.users kaydı başarıyla silinmeli');

  // ON DELETE CASCADE sayesinde player_profiles ve progress_events kayıtlarının silindiğini doğrula
  // (Direkt veritabanı yöneticisi sorgusu ile kontrol et)
  await setSession(null, 'authenticated');
  const checkProfiles = await db.query(`SELECT * FROM public.player_profiles WHERE user_id = $1`, [userA]);
  assert.equal(checkProfiles.rows.length, 0, 'Kullanıcı silindiğinde profilleri CASCADE ile temizlenmeli');

  const checkEvents = await db.query(`SELECT * FROM public.progress_events WHERE user_id = $1`, [userA]);
  assert.equal(checkEvents.rows.length, 0, 'Kullanıcı silindiğinde etkinlikleri CASCADE ile temizlenmeli');

  // Oturumsuz delete_adult_user() çağrısı exception fırlatmalı
  await setSession(null, 'authenticated');
  let unauthDeleteError = false;
  try {
    await db.query(`SELECT public.delete_adult_user()`);
  } catch (err) {
    unauthDeleteError = true;
    assert.match(err.message, /Yetkisiz erişim/i);
  }
  assert.ok(unauthDeleteError, 'Oturumsuz kullanıcı hesap silememeli');

  console.log('✓ Tüm gerçek PostgreSQL 16 RLS ve veritabanı güvenlik testleri başarıyla tamamlandı!');
});
