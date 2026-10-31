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

export interface RecordLearningSessionResult {
  isDuplicate: boolean;
  sessionId: string;
  profileId: string;
}

export interface RecordGameCompletedResult {
  isDuplicate: boolean;
  sessionId: string;
  profileId: string;
  previousBestStars: number;
  newBestStars: number;
  starsAddedToBalance: number;
  totalStarsBalance: number;
}

export interface CreateProfileInput {
  id?: string;
  nickname: string;
  avatarId: string;
}

export interface IProgressRepository {
  // --- Profil Yönetimi ---
  getActiveProfile(): Promise<PlayerProfile | null>;
  getAllProfiles(): Promise<PlayerProfile[]>;
  createProfile(input: CreateProfileInput): Promise<PlayerProfile>;
  updateProfile(id: string, updates: Partial<Omit<PlayerProfile, 'id' | 'createdAt'>>): Promise<PlayerProfile>;
  deleteProfile(id: string): Promise<void>;
  switchActiveProfile(id: string): Promise<PlayerProfile>;
  getDeletedProfileIds?(): Promise<string[]>;
  // Evidence is read from persisted game sessions; supports offline and cloud sync.
  getColorAnswerHistory(profileId: string): Promise<import('@ventra/shared').ColorAnswerEvidence[]>;

  // --- İlerleme ve Ustalık Kayıtları (Profil Duyarlı) ---
  recordLearningSession(result: LearningSessionResult, targetProfileId?: string): Promise<RecordLearningSessionResult>;
  recordGameCompleted(payload: GameCompletedPayload, targetProfileId?: string): Promise<RecordGameCompletedResult>;
  
  // --- İlerleme Sorguları ---
  getProgressSummary(targetProfileId?: string): Promise<UnifiedProgressSummary>;
  getSkillMastery(skillId: string, targetProfileId?: string): Promise<SkillMasteryRecord>;
  getLevelProgress(gameId: string, levelId: number, targetProfileId?: string): Promise<LevelProgressRecord | null>;
  getAllLevelProgress(gameId?: string, targetProfileId?: string): Promise<Record<number, LevelProgressRecord>>;
  getActivityLog(limit?: number, targetProfileId?: string): Promise<ActivityLogEntry[]>;
  getRecommendedReview(targetProfileId?: string): Promise<RecommendedReview | null>;
  getTotalStars(targetProfileId?: string, gameId?: string): Promise<number>;
  
  // --- Bulut Eşitleme Desteği (Cloud Sync) ---
  getPendingEvents(profileId: string): Promise<any[]>;
  markEventsSynced(eventIds: string[]): Promise<void>;
  mergeRemoteEvents(remoteEvents: any[], profileId: string): Promise<number>;

  // --- Test & Bakım ---
  clearAllProgress(): Promise<void>;
}
