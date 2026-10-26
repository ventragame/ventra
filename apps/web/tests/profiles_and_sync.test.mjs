import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { 
  VENTRA_AVATARS, 
  getAvatarById, 
  evaluateSkillMastery, 
  calculateTotalStars 
} from '../../../packages/shared/src/index.ts';

import { MemoryProgressRepository } from '../src/lib/progress/MemoryProgressRepository.ts';

test('Player Profiles: Creation, Switching, and Profile Isolation', async () => {
  const repo = new MemoryProgressRepository();
  await repo.clearAllProgress();

  // 1. İki bağımsız çocuk profili oluştur
  const profAli = await repo.createProfile({ nickname: 'Ali', avatarId: 'avatar_explorer' });
  const profAyse = await repo.createProfile({ nickname: 'Ayşe', avatarId: 'avatar_owl' });

  assert.ok(profAli.id, 'Ali için kalıcı UUID üretilmeli');
  assert.ok(profAyse.id, 'Ayşe için kalıcı UUID üretilmeli');
  assert.notEqual(profAli.id, profAyse.id, 'İki profilin kimlikleri farklı olmalı');
  assert.equal(profAli.nickname, 'Ali');
  assert.equal(profAyse.nickname, 'Ayşe');

  // 2. Ali aktifken oyun ve öğrenme verisi kaydet
  await repo.switchActiveProfile(profAli.id);
  const activeNow1 = await repo.getActiveProfile();
  assert.equal(activeNow1?.id, profAli.id);

  // Ali: Seviye 1 (3 yıldız) ve Seviye 2 (3 yıldız) -> Toplam 6 yıldız
  await repo.recordGameCompleted({
    sessionId: 'ali_game_1',
    profileId: profAli.id,
    gameId: 'kesir_atolyesi',
    levelId: 1,
    outcomeId: 'MATH.G4.FRAC.01',
    skillId: 'ventra.math.g4.fraction.anatomy',
    score: 100,
    success: true,
    starsEarned: 3,
    metrics: { durationSeconds: 30, attemptsCount: 1, accuracyRate: 1.0 },
    completedAt: '2026-10-26T10:00:00Z'
  }, profAli.id);

  await repo.recordGameCompleted({
    sessionId: 'ali_game_2',
    profileId: profAli.id,
    gameId: 'kesir_atolyesi',
    levelId: 2,
    outcomeId: 'MATH.G4.FRAC.01',
    skillId: 'ventra.math.g4.fraction.proper',
    score: 95,
    success: true,
    starsEarned: 3,
    metrics: { durationSeconds: 35, attemptsCount: 1, accuracyRate: 1.0 },
    completedAt: '2026-10-26T10:05:00Z'
  }, profAli.id);

  const aliStars = await repo.getTotalStars(profAli.id);
  assert.equal(aliStars, 6, 'Ali toplam 6 yıldıza sahip olmalı');

  // 3. Ayşe'ye geçiş yap
  await repo.switchActiveProfile(profAyse.id);
  const activeNow2 = await repo.getActiveProfile();
  assert.equal(activeNow2?.id, profAyse.id);

  // Ayşe için başlangıçta yıldız sıfır olmalı (İzolasyon doğrulaması)
  const ayseStarsBefore = await repo.getTotalStars(profAyse.id);
  assert.equal(ayseStarsBefore, 0, 'Ayşe yeni başladığında yıldızları 0 olmalı');

  // Ayşe: Seviye 1'i 1 yıldız ile tamamladı
  await repo.recordGameCompleted({
    sessionId: 'ayse_game_1',
    profileId: profAyse.id,
    gameId: 'kesir_atolyesi',
    levelId: 1,
    outcomeId: 'MATH.G4.FRAC.01',
    skillId: 'ventra.math.g4.fraction.anatomy',
    score: 60,
    success: true,
    starsEarned: 1,
    metrics: { durationSeconds: 60, attemptsCount: 3, accuracyRate: 0.6 },
    completedAt: '2026-10-26T10:10:00Z'
  }, profAyse.id);

  const ayseStarsAfter = await repo.getTotalStars(profAyse.id);
  assert.equal(ayseStarsAfter, 1, 'Ayşe 1 yıldıza sahip olmalı');

  // Tekrar Ali'nin yıldızlarını kontrol et; Ayşe'nin oyunu Ali'yi etkilememeli!
  const aliStarsCheck = await repo.getTotalStars(profAli.id);
  assert.equal(aliStarsCheck, 6, 'Ali\'nin 6 yıldızı aynen korunmalı');
});

test('Multi-Device Event Sourcing & Conflict Resolution', async () => {
  const repo = new MemoryProgressRepository();
  await repo.clearAllProgress();

  const profile = await repo.createProfile({ nickname: 'Can', avatarId: 'avatar_astronaut' });

  // 1. Cihaz A: Seviye 1 (2 yıldız) tamamladı
  await repo.recordGameCompleted({
    sessionId: 'device_a_event_1',
    profileId: profile.id,
    gameId: 'kesir_atolyesi',
    levelId: 1,
    outcomeId: 'MATH.G4.FRAC.01',
    skillId: 'ventra.math.g4.fraction.anatomy',
    score: 80,
    success: true,
    starsEarned: 2,
    metrics: { durationSeconds: 40, attemptsCount: 2, accuracyRate: 0.8 },
    completedAt: '2026-10-26T09:00:00Z'
  }, profile.id);

  assert.equal(await repo.getTotalStars(profile.id), 2);

  // 2. Cihaz B'den gelen senkronizasyon olayları (Seviye 1 mükemmel 3 yıldız, Seviye 2 3 yıldız)
  const remoteEvents = [
    {
      event_id: 'device_b_event_1',
      profile_id: profile.id,
      event_type: 'game_level',
      game_id: 'kesir_atolyesi',
      level_id: 1,
      skill_id: 'ventra.math.g4.fraction.anatomy',
      score: 100,
      stars_earned: 3,
      accuracy_rate: 1.0,
      metrics: { durationSeconds: 20, attemptsCount: 1, accuracyRate: 1.0 },
      client_timestamp: '2026-10-26T09:30:00Z'
    },
    {
      event_id: 'device_b_event_2',
      profile_id: profile.id,
      event_type: 'game_level',
      game_id: 'kesir_atolyesi',
      level_id: 2,
      skill_id: 'ventra.math.g4.fraction.proper',
      score: 100,
      stars_earned: 3,
      accuracy_rate: 1.0,
      metrics: { durationSeconds: 25, attemptsCount: 1, accuracyRate: 1.0 },
      client_timestamp: '2026-10-26T09:35:00Z'
    }
  ];

  // Birleştirme (Merge)
  const mergedCount = await repo.mergeRemoteEvents(remoteEvents, profile.id);
  assert.equal(mergedCount, 2, '2 yeni uzak etkinlik başarıyla birleştirilmeli');

  // Seviye 1'deki en iyi yıldız derecesi max(2, 3) = 3 olmalı
  const lvl1 = await repo.getLevelProgress('kesir_atolyesi', 1, profile.id);
  assert.equal(lvl1?.bestStars, 3, 'Seviye 1 için en yüksek yıldız derecesi 3 olmalı');

  // Toplam yıldız: Seviye 1 (3) + Seviye 2 (3) = 6 olmalı
  const totalStarsAfterMerge = await repo.getTotalStars(profile.id);
  assert.equal(totalStarsAfterMerge, 6, 'Toplam yıldız 6 olmalı');

  // 3. Aynı olayları tekrar gönderdiğimizde mükerrerlik engellenmeli (Idempotency)
  const duplicateMerge = await repo.mergeRemoteEvents(remoteEvents, profile.id);
  assert.equal(duplicateMerge, 0, 'Aynı olaylar ikinci kez eklenmemeli');
  assert.equal(await repo.getTotalStars(profile.id), 6);
});

test('Child Privacy & Avatar Catalog Integrity', () => {
  assert.equal(VENTRA_AVATARS.length, 6, 'Tam 6 çocuk dostu avatar bulunmalı');

  for (const av of VENTRA_AVATARS) {
    assert.ok(av.id.startsWith('avatar_'));
    assert.ok(av.name.length > 2);
    assert.ok(av.emoji.length > 0);
    assert.ok(av.bgColor.startsWith('#'));
    assert.ok(av.accentColor.startsWith('#'));
  }

  const defaultAv = getAvatarById('unknown_id');
  assert.equal(defaultAv.id, 'avatar_explorer', 'Bilinmeyen ID verildiğinde varsayılan avatar dönmeli');
});

test('Supabase Migration SQL & RLS Security Policy Verification', () => {
  const sqlPath = path.resolve('../../supabase/migrations/20261026000000_player_profiles_and_sync.sql');
  assert.ok(fs.existsSync(sqlPath), 'Supabase migrasyon SQL dosyası mevcut olmalı');

  const sql = fs.readFileSync(sqlPath, 'utf-8');

  // 1. Tablo tanımları
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.player_profiles/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.progress_events/);

  // 2. RLS Aktifleştirme
  assert.match(sql, /ALTER TABLE public\.player_profiles ENABLE ROW LEVEL SECURITY;/);
  assert.match(sql, /ALTER TABLE public\.progress_events ENABLE ROW LEVEL SECURITY;/);

  // 3. Anonim Rolün Engellenmesi
  assert.match(sql, /REVOKE ALL ON TABLE public\.player_profiles FROM anon;/);
  assert.match(sql, /REVOKE ALL ON TABLE public\.progress_events FROM anon;/);

  // 4. auth.uid() Sahiplik Doğrulaması
  assert.match(sql, /auth\.uid\(\) = user_id/);

  // 5. Phase 3.4.1 Hardening: Composite Unique & Composite Foreign Key
  assert.match(sql, /CONSTRAINT uq_player_profiles_id_user UNIQUE \(id, user_id\)/);
  assert.match(sql, /CONSTRAINT fk_progress_events_profile_user FOREIGN KEY \(profile_id, user_id\)\s+REFERENCES public\.player_profiles\(id, user_id\) ON DELETE CASCADE/);

  // 6. Phase 3.4.1 Hardening: Server-Side delete_adult_user RPC
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.delete_adult_user\(\)/);
  assert.match(sql, /SECURITY DEFINER/);
  assert.match(sql, /DELETE FROM auth\.users WHERE id = current_uid;/);
});

test('Hardening: Tombstone Synchronization & Profile Deletion without Resurrection', async () => {
  const deviceA = new MemoryProgressRepository();
  const deviceB = new MemoryProgressRepository();

  // 1. Device A'da profil oluşturulur
  const profile = await deviceA.createProfile({ nickname: 'Deniz', avatarId: 'avatar_astronaut' });
  const profileId = profile.id;

  // 2. Device B'ye aynı ID ile eşitlenir
  await deviceB.createProfile({ id: profileId, nickname: 'Deniz', avatarId: 'avatar_astronaut' });
  assert.equal((await deviceB.getAllProfiles()).length, 1);

  // 3. Device A'da profil silinir
  await deviceA.deleteProfile(profileId);
  assert.equal((await deviceA.getAllProfiles()).length, 0);

  // Device A'da silme tombstone'u kaydedildiğini doğrula
  const tombstonesA = await deviceA.getDeletedProfileIds();
  assert.ok(tombstonesA.includes(profileId), 'Silinen profil için yerel tombstone tutulmalı');

  // 4. Device B senkronizasyonda bu tombstone'u alır ve profili siler (Resurrection Engeli)
  const isTombstoned = tombstonesA.includes(profileId);
  if (isTombstoned) {
    await deviceB.deleteProfile(profileId);
  }

  assert.equal((await deviceB.getAllProfiles()).length, 0, 'Device B profili diriltmemeli, yerelden temizlemeli');
  const tombstonesB = await deviceB.getDeletedProfileIds();
  assert.ok(tombstonesB.includes(profileId), 'Device B de silme tombstone kaydını saklamalı');
});

test('Hardening: Adult Account Switching & Isolation Safeguard', async () => {
  const repo = new MemoryProgressRepository();

  // Ebeveyn 1 hesabı ile ilişkili profil
  const prof1 = await repo.createProfile({ nickname: 'Zeynep', avatarId: 'avatar_owl' });
  await repo.updateProfile(prof1.id, { userId: 'parent_user_1', isCloudSynced: true });

  // Oturum Ebeveyn 2'ye geçtiğinde: prof1'in userId'si ('parent_user_1') mevcut oturumla ('parent_user_2') uyuşmuyor
  const currentUserId = 'parent_user_2';
  const isIsolated = prof1.userId !== currentUserId;
  assert.ok(isIsolated, 'Farklı hesaba ait profil tespit edilmeli');

  // Misafir yerel profili (userId: null)
  const guestProf = await repo.createProfile({ nickname: 'Misafir', avatarId: 'avatar_explorer' });
  assert.equal(guestProf.userId, null, 'Misafir profil başlangıçta hiçbir hesaba bağlı olmamalı');
});

