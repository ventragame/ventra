import type { ActivityLogEntry, GameCompletedPayload, LevelProgressRecord, PlayerProfile } from '@ventra/shared';
import { gameActivityLabel } from './activityTitles.ts';

/**
 * Pure description of what one finished game session writes. Both progress
 * repositories apply the same plan, so best-star, coin and attempt rules cannot
 * drift between the browser store (IndexedDB) and the in-memory fallback.
 *
 * The plan never decides idempotency or profile deletion: the repository must
 * check the session ID and the deleted-profile marker in the same atomic step
 * that applies the plan (see IndexedDBProgressRepository.recordGameCompleted).
 */
export interface GameCompletionInput {
  payload: GameCompletedPayload;
  profileId: string;
  sessionId: string;
  completedAt: string;
  previous: LevelProgressRecord | null;
  profile: PlayerProfile | null;
  activityId: string;
}

export interface GameCompletionPlan {
  session: { sessionId: string; profileId: string; type: 'game'; data: GameCompletedPayload; timestamp: string; isCloudSynced: false };
  level: LevelProgressRecord;
  profile: PlayerProfile | null;
  gameAttempt: { profileId: string; levelId: number; skillId: string; success: boolean; accuracyRate: number; timestamp: string } | null;
  activity: ActivityLogEntry & { profileId: string };
  previousBestStars: number;
  newBestStars: number;
  starsAdded: number;
}

export function clampStars(stars: number): number {
  return Math.min(3, Math.max(0, Number.isFinite(stars) ? stars : 0));
}

export function planGameCompletion(input: GameCompletionInput): GameCompletionPlan {
  const { payload, profileId, sessionId, completedAt, previous } = input;
  const previousBestStars = previous ? previous.bestStars : 0;
  const newBestStars = Math.max(previousBestStars, clampStars(payload.starsEarned));
  const level: LevelProgressRecord = {
    gameId: payload.gameId,
    levelId: payload.levelId,
    bestStars: newBestStars,
    bestScore: Math.max(previous ? previous.bestScore : 0, payload.score),
    bestAccuracy: Math.max(previous ? previous.bestAccuracy : 0, payload.metrics.accuracyRate),
    attemptsCount: (previous ? previous.attemptsCount : 0) + (payload.metrics.attemptsCount || 1),
    completedCount: (previous ? previous.completedCount : 0) + (payload.success ? 1 : 0),
    firstCompletedAt: previous ? previous.firstCompletedAt : completedAt,
    lastCompletedAt: completedAt
  };
  const profile = input.profile ? { ...input.profile, lastPlayedAt: completedAt, updatedAt: completedAt } : null;
  const gameAttempt = payload.skillId ? {
    profileId,
    levelId: payload.levelId,
    skillId: payload.skillId,
    success: payload.success,
    accuracyRate: payload.metrics.accuracyRate,
    timestamp: completedAt
  } : null;
  const activity: ActivityLogEntry & { profileId: string } = {
    id: input.activityId,
    profileId,
    type: 'game',
    title: `${gameActivityLabel(payload.gameId)} — Bölüm ${payload.levelId}`,
    subtitle: `${payload.starsEarned} Yıldız • Skor: ${payload.score} (%${Math.round(payload.metrics.accuracyRate * 100)})`,
    timestamp: completedAt,
    score: payload.score,
    starsEarned: payload.starsEarned,
    accuracyRate: payload.metrics.accuracyRate,
    status: payload.success ? 'success' : 'needs_practice',
    skillId: payload.skillId,
    levelId: payload.levelId
  };
  return {
    session: { sessionId, profileId, type: 'game', data: payload, timestamp: completedAt, isCloudSynced: false },
    level,
    profile,
    gameAttempt,
    activity,
    previousBestStars,
    newBestStars,
    starsAdded: newBestStars - previousBestStars
  };
}

export function newActivityId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}
