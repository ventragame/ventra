import type { GameCompletedPayload } from '@ventra/shared';
import type { IProgressRepository } from './types.ts';

/**
 * Each published Word Garden activity owns a distinct persisted level.
 * The previous app stored one whole-island completion under a different game ID.
 * Keep reading that record so upgrading cannot erase an existing completion.
 */
export const WORD_GARDEN_STEPS_GAME_ID = 'island_word_garden_steps';
export const WORD_GARDEN_LEVEL_COUNT = 5;

export interface WordGardenProgressSnapshot {
  completedLevels: number;
  totalLevels: number;
  progressPercent: number;
  starsByLevel: Record<number, number>;
  totalStars: number;
  legacyCompleted: boolean;
}

function isCompleted(record: { completedCount: number; bestStars: number } | null | undefined): boolean {
  return Boolean(record && (record.completedCount > 0 || record.bestStars > 0));
}

export async function getWordGardenProgress(
  repo: IProgressRepository,
  profileId: string
): Promise<WordGardenProgressSnapshot> {
  const [steps, oldIslandRecord, oldExplorationRecord] = await Promise.all([
    repo.getAllLevelProgress(WORD_GARDEN_STEPS_GAME_ID, profileId),
    repo.getLevelProgress('island_word_garden', 1, profileId),
    repo.getLevelProgress('phaser_exploration_island', 1, profileId)
  ]);

  // The legacy record was written only when the entire five-step island finished.
  const legacyCompleted = isCompleted(oldIslandRecord) || isCompleted(oldExplorationRecord);
  const starsByLevel: Record<number, number> = {};
  let completedInOrder = 0;

  for (let order = 1; order <= WORD_GARDEN_LEVEL_COUNT; order += 1) {
    const record = steps[order];
    if (isCompleted(record)) {
      starsByLevel[order] = Math.max(0, Math.min(3, record.bestStars || 0));
      if (completedInOrder === order - 1) completedInOrder += 1;
    }
  }

  const completedLevels = legacyCompleted ? WORD_GARDEN_LEVEL_COUNT : completedInOrder;
  const earnedStars = Object.values(starsByLevel).reduce((sum, stars) => sum + stars, 0);
  const legacyStars = legacyCompleted
    ? Math.max(oldIslandRecord?.bestStars || 0, oldExplorationRecord?.bestStars || 0)
    : 0;

  // Preserve the original three-star award without pretending every legacy step
  // separately earned three stars.
  if (legacyCompleted && earnedStars === 0 && legacyStars > 0) {
    starsByLevel[WORD_GARDEN_LEVEL_COUNT] = legacyStars;
  }

  return {
    completedLevels,
    totalLevels: WORD_GARDEN_LEVEL_COUNT,
    progressPercent: Math.round((completedLevels / WORD_GARDEN_LEVEL_COUNT) * 100),
    starsByLevel,
    totalStars: Math.max(earnedStars, legacyStars),
    legacyCompleted
  };
}

export async function saveWordGardenLevelCompletion(
  repo: IProgressRepository,
  profileId: string,
  levelOrder: number,
  starsEarned: number
): Promise<WordGardenProgressSnapshot> {
  if (!Number.isInteger(levelOrder) || levelOrder < 1 || levelOrder > WORD_GARDEN_LEVEL_COUNT) {
    throw new Error('Geçersiz Kelime Bahçesi seviyesi.');
  }
  const before = await getWordGardenProgress(repo, profileId);
  if (!before.legacyCompleted && levelOrder > before.completedLevels + 1) {
    throw new Error('Önceki görev tamamlanmadan bu seviye açılamaz.');
  }

  const stars = Math.max(0, Math.min(3, Math.trunc(starsEarned) || 0));
  const payload: GameCompletedPayload = {
    sessionId: `wg_${profileId}_${levelOrder}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    profileId,
    gameId: WORD_GARDEN_STEPS_GAME_ID,
    levelId: levelOrder,
    outcomeId: 'en.a1.vocab.animals',
    skillId: 'en.a1.vocab.animals',
    score: Math.round((stars / 3) * 100),
    success: true,
    starsEarned: stars,
    // Existing activities do not yet expose real timing/accuracy telemetry.
    // Keep unknown measurements neutral rather than fabricating data.
    metrics: { durationSeconds: 0, attemptsCount: 1, accuracyRate: 0 },
    completedAt: new Date().toISOString()
  };

  await repo.recordGameCompleted(payload, profileId);
  return getWordGardenProgress(repo, profileId);
}
