import type { 
  LearningSessionResult, 
  GameCompletedPayload, 
  UnifiedProgressSummary, 
  SkillMasteryRecord, 
  LevelProgressRecord, 
  ActivityLogEntry, 
  RecommendedReview,
  PlayerProfile
} from '@ventra/shared';
import { 
  VENTRA_FRACTION_SKILLS, 
  evaluateSkillMastery, 
  calculateTotalStars, 
  determineRecommendedReview 
} from '@ventra/shared';
import type { 
  IProgressRepository, 
  RecordLearningSessionResult, 
  RecordGameCompletedResult,
  CreateProfileInput
} from './types.ts';

const DB_NAME = 'VentraProgressDB';
const DB_VERSION = 2; // Phase 3.4: v1 -> v2 (Oyuncu Profilleri desteği)

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class IndexedDBProgressRepository implements IProgressRepository {
  private static instance: IndexedDBProgressRepository | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  public static getInstance(): IndexedDBProgressRepository {
    if (!IndexedDBProgressRepository.instance) {
      IndexedDBProgressRepository.instance = new IndexedDBProgressRepository();
    }
    return IndexedDBProgressRepository.instance;
  }

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB ortamda bulunamadı'));
      }

      const req = window.indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (event) => {
        const db = req.result;
        const oldVersion = event.oldVersion;

        // V1 Mağazaları
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'sessionId' });
        }
        if (!db.objectStoreNames.contains('levels')) {
          db.createObjectStore('levels', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('learning_attempts')) {
          const lStore = db.createObjectStore('learning_attempts', { autoIncrement: true });
          lStore.createIndex('skillId', 'skillId', { unique: false });
        }
        if (!db.objectStoreNames.contains('game_attempts')) {
          const gStore = db.createObjectStore('game_attempts', { autoIncrement: true });
          gStore.createIndex('skillId', 'skillId', { unique: false });
        }
        if (!db.objectStoreNames.contains('activities')) {
          db.createObjectStore('activities', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }

        // V2 Yükseltmesi: Oyuncu Profilleri (profiles) ve profileId indeksleri
        if (!db.objectStoreNames.contains('profiles')) {
          const pStore = db.createObjectStore('profiles', { keyPath: 'id' });
          pStore.createIndex('userId', 'userId', { unique: false });
        }

        const tx = req.transaction;
        if (tx) {
          const sStore = tx.objectStore('sessions');
          if (!sStore.indexNames.contains('profileId')) {
            sStore.createIndex('profileId', 'profileId', { unique: false });
          }

          const lStore = tx.objectStore('levels');
          if (!lStore.indexNames.contains('profileId')) {
            lStore.createIndex('profileId', 'profileId', { unique: false });
          }

          const laStore = tx.objectStore('learning_attempts');
          if (!laStore.indexNames.contains('profileId')) {
            laStore.createIndex('profileId', 'profileId', { unique: false });
          }

          const gaStore = tx.objectStore('game_attempts');
          if (!gaStore.indexNames.contains('profileId')) {
            gaStore.createIndex('profileId', 'profileId', { unique: false });
          }

          const actStore = tx.objectStore('activities');
          if (!actStore.indexNames.contains('profileId')) {
            actStore.createIndex('profileId', 'profileId', { unique: false });
          }
        }
      };

      req.onsuccess = async () => {
        const db = req.result;
        try {
          // v1 -> v2 Veri Taşıma (Migration) Kontrolü
          await this.migrateV1DataIfNeeded(db);
        } catch (mErr) {
          console.warn('[IndexedDB] v1->v2 migration uyarısı:', mErr);
        }
        resolve(db);
      };

      req.onerror = () => reject(req.error);
    });

    return this.dbPromise;
  }

  /**
   * v1'deki verileri kayıpsız olarak yeni bir varsayılan profile aktarır (v1 -> v2 Migration).
   */
  private async migrateV1DataIfNeeded(db: IDBDatabase): Promise<void> {
    const profiles = await this.getAllRecords<PlayerProfile>(db, 'profiles');
    if (profiles.length > 0) {
      return; // Zaten profiller mevcut
    }

    const sessions = await this.getAllRecords<any>(db, 'sessions');
    const levels = await this.getAllRecords<any>(db, 'levels');

    // Eğer v1'den kalma oturum veya seviye verisi varsa ilk profile taşı
    if (sessions.length > 0 || levels.length > 0) {
      const legacyProfileId = generateUUID();
      const now = new Date().toISOString();

      const legacyProfile: PlayerProfile = {
        id: legacyProfileId,
        userId: null,
        nickname: 'İlk Kaşif',
        avatarId: 'avatar_explorer',
        createdAt: now,
        updatedAt: now,
        lastPlayedAt: now,
        isActive: true,
        isCloudSynced: false
      };

      const tx = db.transaction(['profiles', 'sessions', 'levels', 'learning_attempts', 'game_attempts', 'activities', 'meta'], 'readwrite');
      tx.objectStore('profiles').put(legacyProfile);
      tx.objectStore('meta').put({ key: 'activeProfileId', value: legacyProfileId });

      // Sessions güncelle
      const sStore = tx.objectStore('sessions');
      for (const s of sessions) {
        if (!s.profileId) {
          s.profileId = legacyProfileId;
          sStore.put(s);
        }
      }

      // Levels güncelle (ID formatını `${profileId}:${gameId}:${levelId}` yap)
      const lStore = tx.objectStore('levels');
      for (const lvl of levels) {
        if (!lvl.profileId) {
          lvl.profileId = legacyProfileId;
          const newKey = `${legacyProfileId}:${lvl.gameId || 'kesir_atolyesi'}:${lvl.levelId}`;
          lStore.delete(lvl.id);
          lvl.id = newKey;
          lStore.put(lvl);
        }
      }

      // Tüm cursor okumaları ve yazmaları aynı transaction'ın kendi callback'inde kalır.
      // Auto-increment mağazalarında cursor.update orijinal anahtarları korur.
      for (const name of ['learning_attempts', 'game_attempts', 'activities']) {
        const request = tx.objectStore(name).openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return;
          const record = cursor.value;
          if (!record.profileId) {
            cursor.update({ ...record, profileId: legacyProfileId });
          }
          cursor.continue();
        };
      }

      await this.waitForTx(tx);
      console.log('[IndexedDB] v1 verileri başarıyla İlk Kaşif profiline taşındı.');
    }
  }

  // --- Profil Yönetimi ---
  public async getActiveProfile(): Promise<PlayerProfile | null> {
    const db = await this.getDB();
    const metaRecord = await this.getRecord<{ key: string; value: string }>(db, 'meta', 'activeProfileId');
    if (metaRecord?.value) {
      const prof = await this.getRecord<PlayerProfile>(db, 'profiles', metaRecord.value);
      if (prof) return prof;
    }

    const all = await this.getAllProfiles();
    if (all.length > 0) {
      await this.switchActiveProfile(all[0].id);
      return all[0];
    }
    return null;
  }

  public async getAllProfiles(): Promise<PlayerProfile[]> {
    const db = await this.getDB();
    const all = await this.getAllRecords<PlayerProfile>(db, 'profiles');
    return all.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
  }

  public async createProfile(input: CreateProfileInput): Promise<PlayerProfile> {
    const db = await this.getDB();
    const all = await this.getAllProfiles();
    const isFirst = all.length === 0;
    const now = new Date().toISOString();
    const id = input.id || generateUUID();

    const profile: PlayerProfile = {
      id,
      userId: null,
      nickname: input.nickname.trim() || 'Yeni Kaşif',
      avatarId: input.avatarId || 'avatar_explorer',
      createdAt: now,
      updatedAt: now,
      lastPlayedAt: null,
      isActive: isFirst,
      isCloudSynced: false
    };

    const tx = db.transaction(['profiles', 'meta'], 'readwrite');
    tx.objectStore('profiles').put(profile);
    // Yeniden açıkça oluşturulduysa tombstone'u temizle
    tx.objectStore('meta').delete(`tombstone:${id}`);
    if (isFirst) {
      tx.objectStore('meta').put({ key: 'activeProfileId', value: id });
    }
    await this.waitForTx(tx);

    return profile;
  }

  public async updateProfile(id: string, updates: Partial<Omit<PlayerProfile, 'id' | 'createdAt'>>): Promise<PlayerProfile> {
    const db = await this.getDB();
    const existing = await this.getRecord<PlayerProfile>(db, 'profiles', id);
    if (!existing) {
      throw new Error(`Profil bulunamadı: ${id}`);
    }

    const updated: PlayerProfile = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const tx = db.transaction('profiles', 'readwrite');
    tx.objectStore('profiles').put(updated);
    await this.waitForTx(tx);

    return updated;
  }

  public async deleteProfile(id: string): Promise<void> {
    const db = await this.getDB();
    const profiles = await this.getAllProfiles();
    if (!profiles.some((p) => p.id === id)) return;

    const activeMeta = await this.getRecord<{ key: string; value: string }>(db, 'meta', 'activeProfileId');
    const wasActive = activeMeta?.value === id || profiles.some((p) => p.id === id && p.isActive);
    const replacement = wasActive ? profiles.find((p) => p.id !== id) : undefined;

    const tx = db.transaction(
      ['profiles', 'sessions', 'levels', 'learning_attempts', 'game_attempts', 'activities', 'meta'],
      'readwrite'
    );
    tx.objectStore('profiles').delete(id);
    tx.objectStore('meta').put({
      key: `tombstone:${id}`,
      value: { id, deletedAt: new Date().toISOString() }
    });

    // İlgili tüm kayıtları transaction içinde index cursor ile sil.
    // Ayrı readonly sorgulara await yapmak transaction'ı kapatabiliyordu.
    for (const name of ['sessions', 'levels', 'learning_attempts', 'game_attempts', 'activities']) {
      const request = tx.objectStore(name).index('profileId').openKeyCursor(id);
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) return;
        tx.objectStore(name).delete(cursor.primaryKey);
        cursor.continue();
      };
    }

    if (wasActive) {
      if (replacement) {
        tx.objectStore('profiles').put({ ...replacement, isActive: true });
        tx.objectStore('meta').put({ key: 'activeProfileId', value: replacement.id });
      } else {
        tx.objectStore('meta').delete('activeProfileId');
      }
    }
    await this.waitForTx(tx);
  }

  public async getDeletedProfileIds(): Promise<string[]> {
    const db = await this.getDB();
    const allMeta = await this.getAllRecords<any>(db, 'meta');
    return allMeta
      .filter(m => typeof m?.key === 'string' && m.key.startsWith('tombstone:'))
      .map(m => m.key.replace('tombstone:', ''));
  }

  public async switchActiveProfile(id: string): Promise<PlayerProfile> {
    const db = await this.getDB();
    // Bütün okumaları write transaction açılmadan önce tamamla.
    const all = await this.getAllProfiles();
    const target = all.find((profile) => profile.id === id);
    if (!target) throw new Error(`Profil bulunamadı: ${id}`);

    const tx = db.transaction(['profiles', 'meta'], 'readwrite');
    const store = tx.objectStore('profiles');
    for (const profile of all) {
      store.put({ ...profile, isActive: profile.id === id });
    }
    tx.objectStore('meta').put({ key: 'activeProfileId', value: id });
    await this.waitForTx(tx);
    return { ...target, isActive: true };
  }

  private async ensureActiveProfileId(targetProfileId?: string): Promise<string> {
    if (targetProfileId) return targetProfileId;
    const active = await this.getActiveProfile();
    if (active) return active.id;
    const created = await this.createProfile({ nickname: 'Kaşif', avatarId: 'avatar_explorer' });
    return created.id;
  }

  // --- İlerleme Kayıtları ---
  public async recordLearningSession(result: LearningSessionResult, targetProfileId?: string): Promise<RecordLearningSessionResult> {
    const db = await this.getDB();
    const profileId = await this.ensureActiveProfileId(targetProfileId || result.profileId);
    const sessionId = result.sessionId || `learning_${Date.now()}`;

    const existing = await this.getRecord<any>(db, 'sessions', sessionId);
    if (existing) {
      return { isDuplicate: true, sessionId, profileId };
    }

    const completedAt = result.completedAt || new Date().toISOString();
    const p = await this.getRecord<PlayerProfile>(db, 'profiles', profileId);
    const tx = db.transaction(['sessions', 'learning_attempts', 'activities', 'profiles'], 'readwrite');

    tx.objectStore('sessions').put({
      sessionId,
      profileId,
      type: 'learning',
      data: result,
      timestamp: completedAt,
      isCloudSynced: false
    });

    // Profil son oynama tarihini güncelle
    if (p) {
      p.lastPlayedAt = completedAt;
      p.updatedAt = completedAt;
      tx.objectStore('profiles').put(p);
    }

    if (Array.isArray(result.attempts)) {
      const attemptsStore = tx.objectStore('learning_attempts');
      for (const att of result.attempts) {
        attemptsStore.add({
          profileId,
          questionId: att.questionId,
          skillId: att.skillId,
          isCorrect: att.isCorrect,
          accuracyRate: att.isCorrect ? 1.0 : 0.0,
          timestamp: completedAt
        });
      }
    }

    const isSuccess = result.accuracyRate >= 0.6;
    const logEntry: ActivityLogEntry & { profileId: string } = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      profileId,
      type: 'learning',
      title: 'Öğrenme Merkezi Alıştırması',
      subtitle: `${result.topicTitle} • ${result.correctCount}/${result.totalQuestions} Doğru (%${Math.round(result.accuracyRate * 100)})`,
      timestamp: completedAt,
      score: result.score,
      accuracyRate: result.accuracyRate,
      status: isSuccess ? 'success' : 'needs_practice'
    };
    tx.objectStore('activities').put(logEntry);

    await this.waitForTx(tx);
    return { isDuplicate: false, sessionId, profileId };
  }

  public async recordGameCompleted(payload: GameCompletedPayload, targetProfileId?: string): Promise<RecordGameCompletedResult> {
    const db = await this.getDB();
    const profileId = await this.ensureActiveProfileId(targetProfileId || payload.profileId);
    const sessionId = payload.sessionId || `game_${payload.levelId}_${Date.now()}`;

    const existing = await this.getRecord<any>(db, 'sessions', sessionId);
    if (existing) {
      const currentStars = await this.getTotalStars(profileId);
      return {
        isDuplicate: true,
        sessionId,
        profileId,
        previousBestStars: 0,
        newBestStars: 0,
        starsAddedToBalance: 0,
        totalStarsBalance: currentStars
      };
    }

    const completedAt = payload.completedAt || new Date().toISOString();
    const gameKey = `${profileId}:${payload.gameId}:${payload.levelId}`;
    const prevLevel = await this.getRecord<LevelProgressRecord>(db, 'levels', gameKey);

    const p = await this.getRecord<PlayerProfile>(db, 'profiles', profileId);
    const oldBestStars = prevLevel ? prevLevel.bestStars : 0;
    const newBestStars = Math.max(oldBestStars, Math.min(3, Math.max(0, payload.starsEarned)));
    const starsAdded = newBestStars - oldBestStars;

    const levelRecord: LevelProgressRecord = {
      gameId: payload.gameId,
      levelId: payload.levelId,
      bestStars: newBestStars,
      bestScore: Math.max(prevLevel ? prevLevel.bestScore : 0, payload.score),
      bestAccuracy: Math.max(prevLevel ? prevLevel.bestAccuracy : 0, payload.metrics.accuracyRate),
      attemptsCount: (prevLevel ? prevLevel.attemptsCount : 0) + (payload.metrics.attemptsCount || 1),
      completedCount: (prevLevel ? prevLevel.completedCount : 0) + (payload.success ? 1 : 0),
      firstCompletedAt: prevLevel ? prevLevel.firstCompletedAt : completedAt,
      lastCompletedAt: completedAt
    };

    const tx = db.transaction(['sessions', 'levels', 'game_attempts', 'activities', 'profiles'], 'readwrite');
    tx.objectStore('sessions').put({
      sessionId,
      profileId,
      type: 'game',
      data: payload,
      timestamp: completedAt,
      isCloudSynced: false
    });

    tx.objectStore('levels').put({ id: gameKey, profileId, ...levelRecord });

    if (p) {
      p.lastPlayedAt = completedAt;
      p.updatedAt = completedAt;
      tx.objectStore('profiles').put(p);
    }

    if (payload.skillId) {
      tx.objectStore('game_attempts').add({
        profileId,
        levelId: payload.levelId,
        skillId: payload.skillId,
        success: payload.success,
        accuracyRate: payload.metrics.accuracyRate,
        timestamp: completedAt
      });
    }

    const gameTitle = payload.gameId === 'island_word_garden_colors' ? 'Renk Korusu'
      : payload.gameId === 'island_word_garden_steps' || payload.gameId === 'phaser_exploration_island'
      ? 'Hayvan Çayırı'
      : payload.gameId === 'kesir_koprusu' ? 'Kesir Köprüsü' : 'Kesir Atölyesi';
    const logEntry: ActivityLogEntry & { profileId: string } = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      profileId,
      type: 'game',
      title: `${gameTitle} — Bölüm ${payload.levelId}`,
      subtitle: `${payload.starsEarned} Yıldız • Skor: ${payload.score} (%${Math.round(payload.metrics.accuracyRate * 100)})`,
      timestamp: completedAt,
      score: payload.score,
      starsEarned: payload.starsEarned,
      accuracyRate: payload.metrics.accuracyRate,
      status: payload.success ? 'success' : 'needs_practice',
      skillId: payload.skillId,
      levelId: payload.levelId
    };
    tx.objectStore('activities').put(logEntry);

    await this.waitForTx(tx);
    const totalStarsBalance = await this.getTotalStars(profileId);

    return {
      isDuplicate: false,
      sessionId,
      profileId,
      previousBestStars: oldBestStars,
      newBestStars,
      starsAddedToBalance: starsAdded,
      totalStarsBalance
    };
  }

  // --- İlerleme Sorguları ---
  public async getProgressSummary(targetProfileId?: string): Promise<UnifiedProgressSummary> {
    const db = await this.getDB();
    const profileId = await this.ensureActiveProfileId(targetProfileId);
    const sessions = await this.getRecordsByIndex<any>(db, 'sessions', 'profileId', profileId);
    const hasData = sessions.length > 0;

    const skillMasteries: Record<string, SkillMasteryRecord> = {};
    for (const skillKey of Object.keys(VENTRA_FRACTION_SKILLS)) {
      skillMasteries[skillKey] = await this.getSkillMastery(skillKey, profileId);
    }

    const atolyeLevels = await this.getAllLevelProgress('kesir_atolyesi', profileId);
    const kopruLevels = await this.getAllLevelProgress('kesir_koprusu', profileId);
    const atolyeStars = calculateTotalStars(atolyeLevels);
    const kopruStars = calculateTotalStars(kopruLevels);
    const totalStars = atolyeStars + kopruStars;
    const completedLevelsCount = Object.values(atolyeLevels).filter(l => l.bestStars > 0).length +
      Object.values(kopruLevels).filter(l => l.bestStars > 0).length;

    const learningAttempts = await this.getRecordsByIndex<{ isCorrect: boolean }>(db, 'learning_attempts', 'profileId', profileId);
    const learningAttemptsCount = learningAttempts.length;
    const learningCorrectCount = learningAttempts.filter(a => a.isCorrect).length;
    const overallLearningAccuracy = learningAttemptsCount > 0 ? learningCorrectCount / learningAttemptsCount : 0;

    let learningSessionsCount = 0;
    let gameSessionsCount = 0;
    let lastActivityAt: string | null = null;

    for (const s of sessions) {
      if (s.type === 'learning') learningSessionsCount++;
      if (s.type === 'game') gameSessionsCount++;
      if (!lastActivityAt || s.timestamp > lastActivityAt) {
        lastActivityAt = s.timestamp;
      }
    }

    const activities = await this.getActivityLog(20, profileId);
    const recommendedReview = determineRecommendedReview(skillMasteries);

    return {
      hasData,
      totalLearningSessions: learningSessionsCount,
      totalGameSessions: gameSessionsCount,
      totalActivitiesCompleted: sessions.length,
      totalStarsEarned: totalStars,
      maxPossibleStars: 60,
      overallLearningAccuracy: Math.round(overallLearningAccuracy * 100) / 100,
      completedLevelsCount,
      totalLevelsCount: 20,
      lastActivityAt,
      lastTopicStudied: hasData ? '4. Sınıf Kesirler (M.4.1.6.1 & M.4.1.6.2)' : null,
      skillMasteries,
      levelProgress: atolyeLevels,
      gamesProgress: {
        'kesir_atolyesi': {
          gameId: 'kesir_atolyesi',
          gameTitle: 'Kesir Atölyesi',
          totalStars: atolyeStars,
          maxStars: 30,
          completedLevels: Object.values(atolyeLevels).filter(l => l.bestStars > 0).length,
          totalLevels: 10,
          levels: atolyeLevels
        },
        'kesir_koprusu': {
          gameId: 'kesir_koprusu',
          gameTitle: 'Kesir Köprüsü',
          totalStars: kopruStars,
          maxStars: 30,
          completedLevels: Object.values(kopruLevels).filter(l => l.bestStars > 0).length,
          totalLevels: 10,
          levels: kopruLevels
        }
      },
      recentActivities: activities,
      recommendedReview
    };
  }

  public async getSkillMastery(skillId: string, targetProfileId?: string): Promise<SkillMasteryRecord> {
    const db = await this.getDB();
    const profileId = await this.ensureActiveProfileId(targetProfileId);

    const allLa = await this.getRecordsByIndex<{ skillId: string; isCorrect: boolean; timestamp: string }>(db, 'learning_attempts', 'profileId', profileId);
    const lAttempts = allLa.filter(a => a.skillId === skillId);

    const allGa = await this.getRecordsByIndex<{ skillId: string; success: boolean; accuracyRate: number; timestamp: string }>(db, 'game_attempts', 'profileId', profileId);
    const gAttempts = allGa.filter(a => a.skillId === skillId);

    const lCorrect = lAttempts.filter(a => a.isCorrect).length;
    const gSuccesses = gAttempts.filter(a => a.success).length;
    const gTotalAccuracy = gAttempts.reduce((sum, a) => sum + a.accuracyRate, 0);

    let lastAttempt: string | null = null;
    for (const a of [...lAttempts, ...gAttempts]) {
      if (!lastAttempt || a.timestamp > lastAttempt) {
        lastAttempt = a.timestamp;
      }
    }

    return evaluateSkillMastery(
      skillId,
      lAttempts.length,
      lCorrect,
      gAttempts.length,
      gSuccesses,
      gTotalAccuracy,
      lastAttempt
    );
  }

  public async getLevelProgress(gameId: string, levelId: number, targetProfileId?: string): Promise<LevelProgressRecord | null> {
    const db = await this.getDB();
    const profileId = await this.ensureActiveProfileId(targetProfileId);
    const key = `${profileId}:${gameId}:${levelId}`;
    return this.getRecord<LevelProgressRecord>(db, 'levels', key);
  }

  public async getAllLevelProgress(gameId = 'kesir_atolyesi', targetProfileId?: string): Promise<Record<number, LevelProgressRecord>> {
    const db = await this.getDB();
    const profileId = await this.ensureActiveProfileId(targetProfileId);
    const result: Record<number, LevelProgressRecord> = {};

    for (let i = 1; i <= 10; i++) {
      const key = `${profileId}:${gameId}:${i}`;
      const rec = await this.getRecord<LevelProgressRecord>(db, 'levels', key);
      if (rec) {
        result[i] = rec;
      } else {
        result[i] = {
          gameId,
          levelId: i,
          bestStars: 0,
          bestScore: 0,
          bestAccuracy: 0,
          attemptsCount: 0,
          completedCount: 0,
          firstCompletedAt: '',
          lastCompletedAt: ''
        };
      }
    }
    return result;
  }

  public async getActivityLog(limit = 20, targetProfileId?: string): Promise<ActivityLogEntry[]> {
    const db = await this.getDB();
    const profileId = await this.ensureActiveProfileId(targetProfileId);
    const all = await this.getRecordsByIndex<ActivityLogEntry>(db, 'activities', 'profileId', profileId);
    all.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
    return all.slice(0, limit);
  }

  public async getRecommendedReview(targetProfileId?: string): Promise<RecommendedReview | null> {
    const summary = await this.getProgressSummary(targetProfileId);
    return summary.recommendedReview;
  }

  public async getColorAnswerHistory(profileId: string): Promise<import('@ventra/shared').ColorAnswerEvidence[]> {
    const db = await this.getDB();
    const sessions = await this.getRecordsByIndex<any>(db, 'sessions', 'profileId', profileId);
    return sessions.flatMap(session => {
      if (session.data?.gameId !== 'island_word_garden_colors') return [];
      const answers = session.data?.metrics?.colorAnswers;
      return Array.isArray(answers) ? answers.filter(
        (a: any) => typeof a.wordId === 'string' && (a.kind === 'discovery' || a.kind === 'recall')
      ) : [];
    });
  }

  public async getTotalStars(targetProfileId?: string, gameId?: string): Promise<number> {
    if (gameId) {
      const levels = await this.getAllLevelProgress(gameId, targetProfileId);
      return calculateTotalStars(levels);
    }
    const [atolye, kopru, exploration, legacyIsland, wordSteps, colors] = await Promise.all([
      this.getAllLevelProgress('kesir_atolyesi', targetProfileId),
      this.getAllLevelProgress('kesir_koprusu', targetProfileId),
      this.getAllLevelProgress('phaser_exploration_island', targetProfileId),
      this.getAllLevelProgress('island_word_garden', targetProfileId),
      this.getAllLevelProgress('island_word_garden_steps', targetProfileId),
      this.getAllLevelProgress('island_word_garden_colors', targetProfileId)
    ]);
    // Legacy island completion and the five modern steps represent the same
    // achievement: never count both awards for the same area.
    const animalStars = Math.max(
      calculateTotalStars(exploration),
      calculateTotalStars(legacyIsland),
      calculateTotalStars(wordSteps)
    );
    return calculateTotalStars(atolye) + calculateTotalStars(kopru) +
      animalStars + calculateTotalStars(colors);
  }

  // --- Bulut Eşitleme Desteği ---
  public async getPendingEvents(profileId: string): Promise<any[]> {
    const db = await this.getDB();
    const sessions = await this.getRecordsByIndex<any>(db, 'sessions', 'profileId', profileId);
    return sessions
      .filter(s => !s.isCloudSynced)
      .map(s => ({
        eventId: s.sessionId,
        profileId: s.profileId,
        eventType: s.type === 'learning' ? 'learning_session' : 'game_level',
        gameId: s.data.gameId || null,
        levelId: s.data.levelId || null,
        skillId: s.data.skillId || null,
        score: s.data.score || 0,
        starsEarned: s.data.starsEarned || 0,
        accuracyRate: s.data.accuracyRate || s.data.metrics?.accuracyRate || 0,
        metrics: s.data.metrics || {},
        clientTimestamp: s.timestamp
      }));
  }

  public async markEventsSynced(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) return;
    const db = await this.getDB();
    const tx = db.transaction('sessions', 'readwrite');
    const store = tx.objectStore('sessions');
    for (const id of new Set(eventIds)) {
      const request = store.get(id);
      request.onsuccess = () => {
        const session = request.result;
        if (session) store.put({ ...session, isCloudSynced: true });
      };
    }
    await this.waitForTx(tx);
  }

  public async mergeRemoteEvents(remoteEvents: any[], profileId: string): Promise<number> {
    let mergedCount = 0;
    for (const ev of remoteEvents) {
      const sessionId = ev.event_id || ev.eventId;
      const existing = await this.getRecord<any>(await this.getDB(), 'sessions', sessionId);
      if (!existing) {
        if (ev.event_type === 'learning_session' || ev.eventType === 'learning_session') {
          await this.recordLearningSession({
            sessionId,
            profileId,
            moduleId: 'fractions-g4-m1',
            topicTitle: '4. Sınıf Kesirler',
            startedAt: ev.client_timestamp || ev.clientTimestamp,
            completedAt: ev.client_timestamp || ev.clientTimestamp,
            totalQuestions: ev.metrics?.totalQuestions || 4,
            correctCount: ev.metrics?.correctCount || 3,
            accuracyRate: Number(ev.accuracy_rate ?? ev.accuracyRate ?? 0.75),
            score: ev.score || 0,
            skillMastery: {},
            attempts: ev.metrics?.attempts || [],
            isPersistedToBackend: true
          }, profileId);
        } else {
          await this.recordGameCompleted({
            sessionId,
            profileId,
            gameId: ev.game_id || ev.gameId || 'kesir_atolyesi',
            levelId: ev.level_id || ev.levelId || 1,
            outcomeId: 'MATH.G4.FRAC.01',
            skillId: ev.skill_id || ev.skillId,
            score: ev.score || 0,
            success: (ev.stars_earned || ev.starsEarned || 0) > 0,
            starsEarned: ev.stars_earned || ev.starsEarned || 0,
            metrics: {
              durationSeconds: ev.metrics?.durationSeconds || 30,
              attemptsCount: ev.metrics?.attemptsCount || 1,
              accuracyRate: Number(ev.accuracy_rate ?? ev.accuracyRate ?? 1.0)
            },
            completedAt: ev.client_timestamp || ev.clientTimestamp
          }, profileId);
        }
        await this.markEventsSynced([sessionId]);
        mergedCount++;
      }
    }
    return mergedCount;
  }

  public async clearAllProgress(): Promise<void> {
    const db = await this.getDB();
    const stores = ['profiles', 'sessions', 'levels', 'learning_attempts', 'game_attempts', 'activities', 'meta'];
    const tx = db.transaction(stores, 'readwrite');
    for (const name of stores) {
      tx.objectStore(name).clear();
    }
    await this.waitForTx(tx);
  }

  // --- Yardımcı DB Fonksiyonları ---
  private getRecord<T>(db: IDBDatabase, storeName: string, key: IDBValidKey): Promise<T | null> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  private getAllRecords<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  private getRecordsByIndex<T>(db: IDBDatabase, storeName: string, indexName: string, key: IDBValidKey): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const req = index.getAll(key);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  private waitForTx(tx: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }
}
