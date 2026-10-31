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

interface StoredSession {
  sessionId: string;
  profileId: string;
  type: 'learning' | 'game';
  data: any;
  timestamp: string;
  isCloudSynced: boolean;
}

interface StoredAttempt {
  profileId: string;
  questionId?: string;
  levelId?: number;
  skillId: string;
  isCorrect?: boolean;
  success?: boolean;
  accuracyRate: number;
  timestamp: string;
}

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

export class MemoryProgressRepository implements IProgressRepository {
  private static instance: MemoryProgressRepository | null = null;

  private profiles: Map<string, PlayerProfile> = new Map();
  private deletedProfileIds: Set<string> = new Set();
  private activeProfileId: string | null = null;
  private sessions: Map<string, StoredSession> = new Map();
  private levels: Map<string, LevelProgressRecord> = new Map(); // key: `${profileId}:${gameId}:${levelId}`
  private activities: Array<ActivityLogEntry & { profileId: string }> = [];
  private learningAttempts: StoredAttempt[] = [];
  private gameAttempts: StoredAttempt[] = [];

  public static getInstance(): MemoryProgressRepository {
    if (!MemoryProgressRepository.instance) {
      MemoryProgressRepository.instance = new MemoryProgressRepository();
    }
    return MemoryProgressRepository.instance;
  }

  // --- Profil Yönetimi ---
  public async getActiveProfile(): Promise<PlayerProfile | null> {
    if (this.activeProfileId && this.profiles.has(this.activeProfileId)) {
      return this.profiles.get(this.activeProfileId)!;
    }
    const all = Array.from(this.profiles.values());
    if (all.length > 0) {
      this.activeProfileId = all[0].id;
      all[0].isActive = true;
      return all[0];
    }
    return null;
  }

  public async getAllProfiles(): Promise<PlayerProfile[]> {
    return Array.from(this.profiles.values()).sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
  }

  public async createProfile(input: CreateProfileInput): Promise<PlayerProfile> {
    const now = new Date().toISOString();
    const id = input.id || generateUUID();
    const isFirst = this.profiles.size === 0;

    const newProfile: PlayerProfile = {
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

    if (isFirst) {
      this.activeProfileId = id;
    }

    this.profiles.set(id, newProfile);
    this.deletedProfileIds.delete(id); // Yeniden açıkça oluşturulduysa silinenlerden çıkar
    return newProfile;
  }

  public async updateProfile(id: string, updates: Partial<Omit<PlayerProfile, 'id' | 'createdAt'>>): Promise<PlayerProfile> {
    const existing = this.profiles.get(id);
    if (!existing) {
      throw new Error(`Profil bulunamadı: ${id}`);
    }

    const updated: PlayerProfile = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.profiles.set(id, updated);
    return updated;
  }

  public async deleteProfile(id: string): Promise<void> {
    this.profiles.delete(id);
    this.deletedProfileIds.add(id);

    // Profile ait verileri temizle
    for (const [key, s] of Array.from(this.sessions.entries())) {
      if (s.profileId === id) this.sessions.delete(key);
    }
    for (const key of Array.from(this.levels.keys())) {
      if (key.startsWith(`${id}:`)) this.levels.delete(key);
    }
    this.activities = this.activities.filter(a => a.profileId !== id);
    this.learningAttempts = this.learningAttempts.filter(a => a.profileId !== id);
    this.gameAttempts = this.gameAttempts.filter(a => a.profileId !== id);

    if (this.activeProfileId === id) {
      const remaining = Array.from(this.profiles.values());
      if (remaining.length > 0) {
        this.activeProfileId = remaining[0].id;
        remaining[0].isActive = true;
      } else {
        this.activeProfileId = null;
      }
    }
  }

  public async getDeletedProfileIds(): Promise<string[]> {
    return Array.from(this.deletedProfileIds);
  }

  public async switchActiveProfile(id: string): Promise<PlayerProfile> {
    const target = this.profiles.get(id);
    if (!target) {
      throw new Error(`Geçiş yapılacak profil bulunamadı: ${id}`);
    }

    for (const p of this.profiles.values()) {
      p.isActive = (p.id === id);
    }
    this.activeProfileId = id;
    return target;
  }

  private async ensureActiveProfileId(targetProfileId?: string): Promise<string> {
    if (targetProfileId) return targetProfileId;
    const active = await this.getActiveProfile();
    if (active) return active.id;
    // Otomatik ilk profil oluştur
    const created = await this.createProfile({ nickname: 'Kaşif', avatarId: 'avatar_explorer' });
    return created.id;
  }

  // --- İlerleme Kayıtları ---
  public async recordLearningSession(result: LearningSessionResult, targetProfileId?: string): Promise<RecordLearningSessionResult> {
    const profileId = await this.ensureActiveProfileId(targetProfileId || result.profileId);
    const sessionId = result.sessionId || `learning_${Date.now()}`;

    // Idempotency: Aynı session daha önce işlendi mi?
    if (this.sessions.has(sessionId)) {
      return { isDuplicate: true, sessionId, profileId };
    }

    const completedAt = result.completedAt || new Date().toISOString();

    this.sessions.set(sessionId, {
      sessionId,
      profileId,
      type: 'learning',
      data: result,
      timestamp: completedAt,
      isCloudSynced: false
    });

    // Profil son oynama zamanını güncelle
    const prof = this.profiles.get(profileId);
    if (prof) {
      prof.lastPlayedAt = completedAt;
      prof.updatedAt = completedAt;
    }

    // Soru bazlı denemeleri kaydet
    if (Array.isArray(result.attempts)) {
      for (const att of result.attempts) {
        this.learningAttempts.push({
          profileId,
          questionId: att.questionId,
          skillId: att.skillId,
          isCorrect: att.isCorrect,
          accuracyRate: att.isCorrect ? 1.0 : 0.0,
          timestamp: completedAt
        });
      }
    }

    // Aktivite günlüğü
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
    this.activities.unshift(logEntry);

    return { isDuplicate: false, sessionId, profileId };
  }

  public async recordGameCompleted(payload: GameCompletedPayload, targetProfileId?: string): Promise<RecordGameCompletedResult> {
    const profileId = await this.ensureActiveProfileId(targetProfileId || payload.profileId);
    const sessionId = payload.sessionId || `game_${payload.levelId}_${Date.now()}`;

    // Idempotency kontrolü
    if (this.sessions.has(sessionId)) {
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

    this.sessions.set(sessionId, {
      sessionId,
      profileId,
      type: 'game',
      data: payload,
      timestamp: completedAt,
      isCloudSynced: false
    });

    const prof = this.profiles.get(profileId);
    if (prof) {
      prof.lastPlayedAt = completedAt;
      prof.updatedAt = completedAt;
    }

    // Seviye kaydını güncelle
    const levelKey = `${profileId}:${payload.gameId}:${payload.levelId}`;
    const existing = this.levels.get(levelKey);

    const oldBestStars = existing ? existing.bestStars : 0;
    const newBestStars = Math.max(oldBestStars, Math.min(3, Math.max(0, payload.starsEarned)));
    const starsAdded = newBestStars - oldBestStars;

    const levelRecord: LevelProgressRecord = {
      gameId: payload.gameId,
      levelId: payload.levelId,
      bestStars: newBestStars,
      bestScore: Math.max(existing ? existing.bestScore : 0, payload.score),
      bestAccuracy: Math.max(existing ? existing.bestAccuracy : 0, payload.metrics.accuracyRate),
      attemptsCount: (existing ? existing.attemptsCount : 0) + (payload.metrics.attemptsCount || 1),
      completedCount: (existing ? existing.completedCount : 0) + (payload.success ? 1 : 0),
      firstCompletedAt: existing ? existing.firstCompletedAt : completedAt,
      lastCompletedAt: completedAt
    };
    this.levels.set(levelKey, levelRecord);

    if (payload.skillId) {
      this.gameAttempts.push({
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
    this.activities.unshift(logEntry);

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
    const profileId = await this.ensureActiveProfileId(targetProfileId);
    const profileSessions = Array.from(this.sessions.values()).filter(s => s.profileId === profileId);
    const hasData = profileSessions.length > 0;

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

    const profileLearningAttempts = this.learningAttempts.filter(a => a.profileId === profileId);
    const learningAttemptsCount = profileLearningAttempts.length;
    const learningCorrectCount = profileLearningAttempts.filter(a => a.isCorrect).length;
    const overallLearningAccuracy = learningAttemptsCount > 0 ? learningCorrectCount / learningAttemptsCount : 0;

    let learningSessionsCount = 0;
    let gameSessionsCount = 0;
    let lastActivityAt: string | null = null;

    for (const s of profileSessions) {
      if (s.type === 'learning') learningSessionsCount++;
      if (s.type === 'game') gameSessionsCount++;
      if (!lastActivityAt || s.timestamp > lastActivityAt) {
        lastActivityAt = s.timestamp;
      }
    }

    const profileActivities = this.activities.filter(a => a.profileId === profileId);
    const recommendedReview = determineRecommendedReview(skillMasteries);

    return {
      hasData,
      totalLearningSessions: learningSessionsCount,
      totalGameSessions: gameSessionsCount,
      totalActivitiesCompleted: profileSessions.length,
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
      recentActivities: profileActivities.slice(0, 20),
      recommendedReview
    };
  }

  public async getSkillMastery(skillId: string, targetProfileId?: string): Promise<SkillMasteryRecord> {
    const profileId = await this.ensureActiveProfileId(targetProfileId);
    const lAttempts = this.learningAttempts.filter(a => a.profileId === profileId && a.skillId === skillId);
    const lCorrect = lAttempts.filter(a => a.isCorrect).length;

    const gAttempts = this.gameAttempts.filter(a => a.profileId === profileId && a.skillId === skillId);
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
    const profileId = await this.ensureActiveProfileId(targetProfileId);
    const key = `${profileId}:${gameId}:${levelId}`;
    return this.levels.get(key) || null;
  }

  public async getAllLevelProgress(gameId = 'kesir_atolyesi', targetProfileId?: string): Promise<Record<number, LevelProgressRecord>> {
    const profileId = await this.ensureActiveProfileId(targetProfileId);
    const result: Record<number, LevelProgressRecord> = {};

    for (let i = 1; i <= 10; i++) {
      const key = `${profileId}:${gameId}:${i}`;
      const rec = this.levels.get(key);
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
    const profileId = await this.ensureActiveProfileId(targetProfileId);
    return this.activities.filter(a => a.profileId === profileId).slice(0, limit);
  }

  public async getRecommendedReview(targetProfileId?: string): Promise<RecommendedReview | null> {
    const summary = await this.getProgressSummary(targetProfileId);
    return summary.recommendedReview;
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

  // --- Bulut Senkronizasyon Metodları ---
  public async getPendingEvents(profileId: string): Promise<any[]> {
    return Array.from(this.sessions.values())
      .filter(s => s.profileId === profileId && !s.isCloudSynced)
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
    for (const eid of eventIds) {
      const s = this.sessions.get(eid);
      if (s) {
        s.isCloudSynced = true;
      }
    }
  }

  public async mergeRemoteEvents(remoteEvents: any[], profileId: string): Promise<number> {
    let mergedCount = 0;
    for (const ev of remoteEvents) {
      const sessionId = ev.event_id || ev.eventId;
      if (!this.sessions.has(sessionId)) {
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
        // Uzaktan geldiği için isCloudSynced: true işaretle
        const s = this.sessions.get(sessionId);
        if (s) s.isCloudSynced = true;
        mergedCount++;
      }
    }
    return mergedCount;
  }

  // --- Temizleme & Test ---
  public async clearAllProgress(): Promise<void> {
    this.profiles.clear();
    this.activeProfileId = null;
    this.sessions.clear();
    this.levels.clear();
    this.activities = [];
    this.learningAttempts = [];
    this.gameAttempts = [];
  }
}
