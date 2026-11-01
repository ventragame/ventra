import type { GameCompletedPayload, ColorAnswerEvidence } from '@ventra/shared';
import type { IProgressRepository } from './types.ts';

export const COLOR_GROVE_GAME_ID = 'island_word_garden_colors';
export const COLOR_GROVE_MISSIONS = 3;

export const COLOR_GROVE_WORDS = [
  { id: 'red', tr: 'Kırmızı', hex: '#ef4444' },
  { id: 'blue', tr: 'Mavi', hex: '#3b82f6' },
  { id: 'yellow', tr: 'Sarı', hex: '#facc15' },
  { id: 'green', tr: 'Yeşil', hex: '#22c55e' },
  { id: 'purple', tr: 'Mor', hex: '#a855f7' },
  { id: 'orange', tr: 'Turuncu', hex: '#fb923c' },
  { id: 'pink', tr: 'Pembe', hex: '#ec4899' },
  { id: 'black', tr: 'Siyah', hex: '#1f2937' },
  { id: 'white', tr: 'Beyaz', hex: '#f8fafc' },
  { id: 'brown', tr: 'Kahverengi', hex: '#92400e' },
  { id: 'gray', tr: 'Gri', hex: '#808080', tier: 1 },
  { id: 'gold', tr: 'Altın rengi', hex: '#d4a017', tier: 1 },
  { id: 'silver', tr: 'Gümüş rengi', hex: '#aeb7c2', tier: 1 },
  { id: 'violet', tr: 'Menekşe moru', hex: '#7c3aed', tier: 1 },
  { id: 'beige', tr: 'Bej', hex: '#d6bd98', tier: 1 },
  { id: 'turquoise', tr: 'Turkuaz', hex: '#24b8af', tier: 1 },
  { id: 'navy blue', tr: 'Lacivert', hex: '#1e3a8a', tier: 1 },
  { id: 'light blue', tr: 'Açık mavi', hex: '#7dd3fc', tier: 1 },
  { id: 'dark blue', tr: 'Koyu mavi', hex: '#1d4ed8', tier: 1 },
  { id: 'light green', tr: 'Açık yeşil', hex: '#86efac', tier: 1 },
  { id: 'dark green', tr: 'Koyu yeşil', hex: '#166534', tier: 1 },
  { id: 'indigo', tr: 'Çivit mavisi', hex: '#4338ca', tier: 2 },
  { id: 'teal', tr: 'Camgöbeği', hex: '#0f766e', tier: 2 },
  { id: 'coral', tr: 'Mercan rengi', hex: '#fb7185', tier: 2 },
  { id: 'maroon', tr: 'Bordo', hex: '#800020', tier: 2 },
  { id: 'olive green', tr: 'Zeytin yeşili', hex: '#708238', tier: 2 },
  { id: 'mint green', tr: 'Nane yeşili', hex: '#6ee7b7', tier: 2 },
  { id: 'lavender', tr: 'Lavanta rengi', hex: '#b4a3d9', tier: 2 },
  { id: 'cream', tr: 'Krem', hex: '#fff3c8', tier: 2 },
  { id: 'peach', tr: 'Şeftali rengi', hex: '#ffb59f', tier: 2 }
] as const;

export interface ColorGroveProgress {
  completedLevels: number;
  totalLevels: number;
  starsByLevel: Record<number, number>;
}

function completed(record: { completedCount: number; bestStars: number } | null): boolean {
  return Boolean(record && (record.completedCount > 0 || record.bestStars > 0));
}

export async function getColorGroveProgress(
  repo: IProgressRepository,
  profileId: string
): Promise<ColorGroveProgress> {
  const records = await Promise.all(
    Array.from({ length: COLOR_GROVE_MISSIONS }, (_, index) =>
      repo.getLevelProgress(COLOR_GROVE_GAME_ID, index + 1, profileId)
    )
  );
  const starsByLevel: Record<number, number> = {};
  let completedLevels = 0;
  for (let i = 0; i < records.length; i += 1) {
    if (completed(records[i])) {
      starsByLevel[i + 1] = Math.max(0, Math.min(3, records[i]?.bestStars ?? 0));
      if (completedLevels === i) completedLevels += 1;
    }
  }
  return { completedLevels, totalLevels: COLOR_GROVE_MISSIONS, starsByLevel };
}

export async function saveColorGroveMission(
  repo: IProgressRepository,
  profileId: string,
  mission: number,
  wrongAttempts: number,
  correctAnswers: number,
  durationSeconds: number,
  colorAnswers: ColorAnswerEvidence[] = [],
  sessionId?: string
): Promise<ColorGroveProgress> {
  if (!Number.isInteger(mission) || mission < 1 || mission > COLOR_GROVE_MISSIONS) {
    throw new Error('Geçersiz Renk Korusu görevi.');
  }
  if (![wrongAttempts, correctAnswers, durationSeconds].every(Number.isFinite) ||
      wrongAttempts < 0 || correctAnswers < 0 || durationSeconds < 0) {
    throw new Error('Geçersiz görev ölçümleri.');
  }
  const before = await getColorGroveProgress(repo, profileId);
  if (mission > before.completedLevels + 1) {
    throw new Error('Önceki Renk Korusu görevi henüz tamamlanmadı.');
  }
  const stars = wrongAttempts === 0 ? 3 : wrongAttempts <= 2 ? 2 : 1;
  const attemptsCount = correctAnswers + wrongAttempts;
  const payload: GameCompletedPayload = {
    sessionId: sessionId || `cg_${profileId}_${mission}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    profileId,
    gameId: COLOR_GROVE_GAME_ID,
    levelId: mission,
    outcomeId: 'en.a1.vocab.colors',
    skillId: 'en.a1.vocab.colors',
    score: Math.round((stars / 3) * 100),
    success: true,
    starsEarned: stars,
    metrics: {
      durationSeconds: Math.round(durationSeconds),
      attemptsCount: Math.max(1, attemptsCount),
      accuracyRate: attemptsCount > 0 ? correctAnswers / attemptsCount : 0,
      wrongAttempts,
      colorAnswers
    },
    completedAt: new Date().toISOString()
  };
  await repo.recordGameCompleted(payload, profileId);
  return getColorGroveProgress(repo, profileId);
}
