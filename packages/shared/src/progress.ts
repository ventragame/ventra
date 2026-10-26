/**
 * VENTRA — Ortak İlerleme, Beceri Ustalığı ve Oyun Ekonomisi Veri Sözleşmesi
 * 
 * İlkeler:
 * 1. Pedagojik Beceri Ustalığı ile Oyun Ekonomisi (Yıldızlar) kesin olarak ayrıdır.
 * 2. Yeterli kanıt (evidence) olmadan öğrenci "usta" olarak değerlendirilmez (en az 2 deneme).
 * 3. Seviyeleri tekrar oynamak en iyi yıldız derecesini günceller; sınırsız yıldız biriktirilemez.
 * 4. Çevrimdışı çalışabilir, deterministik ve açıklanabilir hesaplama kuralları içerir.
 */

import { VENTRA_FRACTION_SKILLS } from './curriculum.ts';
import type { GameCompletedPayload } from './bridge.ts';
import type { LearningSessionResult } from './curriculum.ts';

export type MasteryStatus = 'insufficient_data' | 'struggling' | 'developing' | 'mastered';

export interface SkillMasteryRecord {
  skillId: string;
  skillTitle: string;
  curriculumCode: string;
  totalAttempts: number;
  learningAttempts: number;
  learningCorrect: number;
  learningAccuracy: number;     // 0.0 - 1.0
  gameAttempts: number;
  gameSuccesses: number;
  gameAccuracy: number;         // 0.0 - 1.0
  combinedScore: number;        // 0 - 100 tam sayı yüzde
  status: MasteryStatus;
  lastAttemptedAt: string | null;
  evidenceCount: number;
}

export interface LevelProgressRecord {
  gameId: string;
  levelId: number;
  bestStars: number;            // 0 - 3
  bestScore: number;
  bestAccuracy: number;         // 0.0 - 1.0
  attemptsCount: number;
  completedCount: number;
  firstCompletedAt: string;
  lastCompletedAt: string;
}

export interface ActivityLogEntry {
  id: string;
  type: 'learning' | 'game';
  title: string;
  subtitle: string;
  timestamp: string;
  score: number;
  starsEarned?: number;
  accuracyRate: number;
  status: 'success' | 'needs_practice';
  skillId?: string;
  levelId?: number;
}

export interface RecommendedReview {
  skillId: string;
  skillTitle: string;
  reason: 'struggling' | 'unattempted' | 'practice_more';
  status: MasteryStatus;
  explanation: string;
  suggestedAction: 'learn_lesson' | 'practice_exercise' | 'play_level';
  targetUrl: string;
  targetLevelId?: number;
}

export interface UnifiedProgressSummary {
  hasData: boolean;
  totalLearningSessions: number;
  totalGameSessions: number;
  totalActivitiesCompleted: number;
  totalStarsEarned: number;
  maxPossibleStars: number;
  overallLearningAccuracy: number;
  completedLevelsCount: number;
  totalLevelsCount: number;
  lastActivityAt: string | null;
  lastTopicStudied: string | null;
  skillMasteries: Record<string, SkillMasteryRecord>;
  levelProgress: Record<number, LevelProgressRecord>;
  recentActivities: ActivityLogEntry[];
  recommendedReview: RecommendedReview | null;
}

/**
 * Bir beceri için pedagojik ustalık durumunu hesaplar.
 * Yeterli kanıt eşiği: en az 2 deneme (soru veya oyun seviyesi).
 */
export function evaluateSkillMastery(
  skillId: string,
  learningAttempts: number,
  learningCorrect: number,
  gameAttempts: number,
  gameSuccesses: number,
  gameTotalAccuracySum: number,
  lastAttemptedAt: string | null
): SkillMasteryRecord {
  const meta = VENTRA_FRACTION_SKILLS[skillId] || {
    id: skillId,
    title: 'Kesir Becerisi',
    curriculumCodes: ['M.4.1.6.1']
  };

  const totalAttempts = learningAttempts + gameAttempts;
  const learningAcc = learningAttempts > 0 ? learningCorrect / learningAttempts : 0;
  const gameAcc = gameAttempts > 0 ? gameTotalAccuracySum / gameAttempts : 0;

  let combinedScore = 0;
  let status: MasteryStatus = 'insufficient_data';

  if (totalAttempts < 2) {
    status = 'insufficient_data';
    combinedScore = totalAttempts === 1 ? Math.round((learningAcc * learningAttempts + gameAcc * gameAttempts) * 100) : 0;
  } else {
    // Ağırlıklı birleştirilmiş başarı oranı
    const weightedRate = (learningAcc * learningAttempts + gameAcc * gameAttempts) / totalAttempts;
    combinedScore = Math.round(weightedRate * 100);

    if (combinedScore >= 85) {
      status = 'mastered';
    } else if (combinedScore >= 60) {
      status = 'developing';
    } else {
      status = 'struggling';
    }
  }

  return {
    skillId,
    skillTitle: meta.title,
    curriculumCode: meta.curriculumCodes[0] || 'M.4.1.6.1',
    totalAttempts,
    learningAttempts,
    learningCorrect,
    learningAccuracy: Math.round(learningAcc * 100) / 100,
    gameAttempts,
    gameSuccesses,
    gameAccuracy: Math.round(gameAcc * 100) / 100,
    combinedScore,
    status,
    lastAttemptedAt,
    evidenceCount: totalAttempts
  };
}

/**
 * Tüm seviyelerdeki en iyi yıldız derecelerini toplayarak toplam yıldızı hesaplar.
 * Replay yapıldığında mükerrer yıldız birikimini kesin olarak engeller.
 */
export function calculateTotalStars(levelProgress: Record<number, LevelProgressRecord>): number {
  let sum = 0;
  for (const lvl of Object.values(levelProgress)) {
    sum += Math.min(3, Math.max(0, lvl.bestStars || 0));
  }
  return sum;
}

/**
 * Beceri ustalık durumlarına göre öğrenciye en uygun tekrar önerisini belirler.
 * 1. Öncelik: En zayıf beceri (struggling).
 * 2. Öncelik: Yetersiz kanıtlı henüz çalışılmamış beceri (unattempted / insufficient_data).
 * 3. Öncelik: Gelişmekte olan beceri (developing).
 * 4. Tüm beceriler ustaysa: Başarı tebriği ve pekiştirme önerisi.
 */
export function determineRecommendedReview(
  masteries: Record<string, SkillMasteryRecord>
): RecommendedReview | null {
  const allSkills = Object.values(masteries);
  if (allSkills.length === 0) return null;

  // 1. Struggling beceriler arasında skoru en düşük olan
  const struggling = allSkills
    .filter(s => s.status === 'struggling' && s.evidenceCount > 0)
    .sort((a, b) => a.combinedScore - b.combinedScore);

  if (struggling.length > 0) {
    const target = struggling[0];
    return {
      skillId: target.skillId,
      skillTitle: target.skillTitle,
      reason: 'struggling',
      status: target.status,
      explanation: `${target.skillTitle} konusunda başarı oranı %${target.combinedScore}. Bu konudaki modelleri tekrar inceleyerek pekiştirmen önerilir.`,
      suggestedAction: 'learn_lesson',
      targetUrl: '/learn?tab=lesson'
    };
  }

  // 2. Henüz hiç çalışılmamış veya yetersiz kanıtlı ilk beceri
  const unattempted = allSkills.find(s => s.evidenceCount === 0);
  if (unattempted) {
    return {
      skillId: unattempted.skillId,
      skillTitle: unattempted.skillTitle,
      reason: 'unattempted',
      status: 'insufficient_data',
      explanation: `${unattempted.skillTitle} konusunu henüz denemedin. Öğrenme Merkezi'ndeki dersi inceleyerek başlayabilirsin.`,
      suggestedAction: 'learn_lesson',
      targetUrl: '/learn?tab=lesson'
    };
  }

  // 3. Gelişmekte olan beceriler
  const developing = allSkills
    .filter(s => s.status === 'developing')
    .sort((a, b) => a.combinedScore - b.combinedScore);

  if (developing.length > 0) {
    const target = developing[0];
    return {
      skillId: target.skillId,
      skillTitle: target.skillTitle,
      reason: 'practice_more',
      status: target.status,
      explanation: `${target.skillTitle} konusunda iyi gidiyorsun (%${target.combinedScore}). Alıştırmaları tamamlayarak Usta seviyesine ulaşabilirsin.`,
      suggestedAction: 'practice_exercise',
      targetUrl: '/learn?tab=exercises'
    };
  }

  // 4. Tüm beceriler Usta seviyesinde
  const firstSkill = allSkills[0];
  return {
    skillId: firstSkill.skillId,
    skillTitle: 'Kesirler Ustalığı',
    reason: 'practice_more',
    status: 'mastered',
    explanation: 'Harika bir başarı! Kesirler modülündeki tüm becerilerde Usta seviyesine ulaştın. Macera Evreni\'nde Kesir Atölyesi\'nin zorlu bölümlerini tamamlayabilirsin.',
    suggestedAction: 'play_level',
    targetUrl: '/?game=kesir_atolyesi'
  };
}

