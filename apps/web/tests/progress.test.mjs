import test from 'node:test';
import assert from 'node:assert/strict';

import { 
  VENTRA_FRACTION_SKILLS, 
  evaluateSkillMastery, 
  calculateTotalStars, 
  determineRecommendedReview 
} from '../../../packages/shared/src/index.ts';

import { MemoryProgressRepository } from '../src/lib/progress/MemoryProgressRepository.ts';

test('Progress Repository: Learning Session Recording & Idempotency', async () => {
  const repo = new MemoryProgressRepository();
  await repo.clearAllProgress();

  const mockSession = {
    sessionId: 'session_learn_001',
    moduleId: 'fractions-g4-m1',
    topicTitle: 'Kesir Türleri ve Modelleri',
    startedAt: '2026-10-26T08:00:00.000Z',
    completedAt: '2026-10-26T08:05:00.000Z',
    totalQuestions: 4,
    correctCount: 3,
    accuracyRate: 0.75,
    score: 75,
    skillMastery: {},
    attempts: [
      {
        questionId: 'q1',
        skillId: 'ventra.math.g4.fraction.anatomy',
        curriculumCode: 'M.4.1.6.1',
        givenAnswer: 'opt-a',
        expectedAnswer: 'opt-a',
        isCorrect: true,
        timeSpentSeconds: 15
      },
      {
        questionId: 'q2',
        skillId: 'ventra.math.g4.fraction.proper',
        curriculumCode: 'M.4.1.6.1',
        givenAnswer: 'opt-c',
        expectedAnswer: 'opt-c',
        isCorrect: true,
        timeSpentSeconds: 20
      },
      {
        questionId: 'q3',
        skillId: 'ventra.math.g4.fraction.proper',
        curriculumCode: 'M.4.1.6.1',
        givenAnswer: 'opt-a',
        expectedAnswer: 'opt-a',
        isCorrect: true,
        timeSpentSeconds: 18
      },
      {
        questionId: 'q4',
        skillId: 'ventra.math.g4.fraction.improper',
        curriculumCode: 'M.4.1.6.1',
        givenAnswer: 'opt-a',
        expectedAnswer: 'opt-d',
        isCorrect: false,
        timeSpentSeconds: 30
      }
    ],
    isPersistedToBackend: false
  };

  // 1. İlk kayıt
  const res1 = await repo.recordLearningSession(mockSession);
  assert.equal(res1.isDuplicate, false);
  assert.equal(res1.sessionId, 'session_learn_001');

  // 2. Mükerrer kayıt (Idempotency) kontrolü
  const res2 = await repo.recordLearningSession(mockSession);
  assert.equal(res2.isDuplicate, true, 'Aynı sessionId ikinci kez işlenmemeli');

  const summary = await repo.getProgressSummary();
  assert.equal(summary.totalLearningSessions, 1, 'Toplam öğrenme oturumu 1 olmalı');
  assert.equal(summary.hasData, true);
  assert.equal(summary.recentActivities.length, 1);
});

test('Progress Repository: Game Completed Replay & Star Accumulation Safeguards', async () => {
  const repo = new MemoryProgressRepository();
  await repo.clearAllProgress();

  // 1. İlk oynayış: Seviye 1, 2 yıldız
  const gamePayload1 = {
    sessionId: 'game_sess_1_first',
    gameId: 'kesir_atolyesi',
    levelId: 1,
    outcomeId: 'MATH.G4.FRAC.01',
    skillId: 'ventra.math.g4.fraction.anatomy',
    score: 80,
    success: true,
    starsEarned: 2,
    metrics: {
      durationSeconds: 45,
      attemptsCount: 2,
      accuracyRate: 0.8,
      wrongAttempts: 1,
      hintsUsed: 0
    },
    completedAt: '2026-10-26T08:10:00.000Z'
  };

  const gRes1 = await repo.recordGameCompleted(gamePayload1);
  assert.equal(gRes1.isDuplicate, false);
  assert.equal(gRes1.newBestStars, 2);
  assert.equal(gRes1.starsAddedToBalance, 2);
  assert.equal(gRes1.totalStarsBalance, 2);

  // 2. Seviye 1'i tekrar oynadı, bu kez 3 yıldız aldı
  const gamePayload2 = {
    sessionId: 'game_sess_1_perfect',
    gameId: 'kesir_atolyesi',
    levelId: 1,
    outcomeId: 'MATH.G4.FRAC.01',
    skillId: 'ventra.math.g4.fraction.anatomy',
    score: 100,
    success: true,
    starsEarned: 3,
    metrics: {
      durationSeconds: 25,
      attemptsCount: 1,
      accuracyRate: 1.0,
      wrongAttempts: 0,
      hintsUsed: 0
    },
    completedAt: '2026-10-26T08:15:00.000Z'
  };

  const gRes2 = await repo.recordGameCompleted(gamePayload2);
  assert.equal(gRes2.isDuplicate, false);
  assert.equal(gRes2.previousBestStars, 2);
  assert.equal(gRes2.newBestStars, 3);
  assert.equal(gRes2.starsAddedToBalance, 1, 'Yalnızca aradaki 1 yıldız fark eklenmeli');
  assert.equal(gRes2.totalStarsBalance, 3, 'Toplam yıldız bakiyesi 3 olmalı');

  // 3. Seviye 1'i tekrar oynadı ama bu kez 1 yıldız aldı (eski 3 yıldız bozulmamalı!)
  const gamePayload3 = {
    sessionId: 'game_sess_1_lower',
    gameId: 'kesir_atolyesi',
    levelId: 1,
    outcomeId: 'MATH.G4.FRAC.01',
    skillId: 'ventra.math.g4.fraction.anatomy',
    score: 60,
    success: true,
    starsEarned: 1,
    metrics: {
      durationSeconds: 60,
      attemptsCount: 3,
      accuracyRate: 0.6,
      wrongAttempts: 2,
      hintsUsed: 1
    },
    completedAt: '2026-10-26T08:20:00.000Z'
  };

  const gRes3 = await repo.recordGameCompleted(gamePayload3);
  assert.equal(gRes3.newBestStars, 3, 'En iyi 3 yıldız korunmalı');
  assert.equal(gRes3.starsAddedToBalance, 0, 'Düşük skor yıldız eklememeli');
  assert.equal(gRes3.totalStarsBalance, 3, 'Toplam yıldız 3 kalmalı');

  // 4. Aynı oturumu tekrar gönderdi (Idempotency)
  const gRes4 = await repo.recordGameCompleted(gamePayload3);
  assert.equal(gRes4.isDuplicate, true, 'Aynı sessionId mükerrer sayılmamalı');
  assert.equal(gRes4.totalStarsBalance, 3);
});

test('Mastery Calculation: Sufficient Evidence & Scoring Categories', () => {
  // Durum 1: Tek 1 deneme (%100 doğru olsa bile yetersiz kanıt -> insufficient_data)
  const singleAttempt = evaluateSkillMastery(
    'ventra.math.g4.fraction.anatomy',
    1, // 1 deneme
    1, // 1 doğru
    0, // 0 oyun
    0,
    0,
    '2026-10-26T08:00:00Z'
  );
  assert.equal(singleAttempt.status, 'insufficient_data', 'Tek 1 denemede Usta olunamaz');
  assert.equal(singleAttempt.evidenceCount, 1);

  // Durum 2: 2 deneme, 2 doğru -> %100 -> mastered
  const masteredSkill = evaluateSkillMastery(
    'ventra.math.g4.fraction.proper',
    2,
    2,
    1,
    1,
    1.0,
    '2026-10-26T08:00:00Z'
  );
  assert.equal(masteredSkill.status, 'mastered');
  assert.ok(masteredSkill.combinedScore >= 85);

  // Durum 3: 4 deneme, 1 doğru -> %25 -> struggling
  const strugglingSkill = evaluateSkillMastery(
    'ventra.math.g4.fraction.improper',
    4,
    1,
    0,
    0,
    0,
    '2026-10-26T08:00:00Z'
  );
  assert.equal(strugglingSkill.status, 'struggling');
  assert.equal(strugglingSkill.combinedScore, 25);

  // Durum 4: 5 deneme, %70 başarı -> developing
  const developingSkill = evaluateSkillMastery(
    'ventra.math.g4.fraction.mixed',
    3,
    2, // 66%
    2,
    2,
    1.5, // 75%
    '2026-10-26T08:00:00Z'
  );
  assert.equal(developingSkill.status, 'developing');
});

test('Recommended Review Logic: Identifies Weakest Skills Accurately', () => {
  const masteries = {
    'ventra.math.g4.fraction.anatomy': evaluateSkillMastery(
      'ventra.math.g4.fraction.anatomy', 3, 3, 1, 1, 1.0, null
    ), // Mastered (100%)
    'ventra.math.g4.fraction.proper': evaluateSkillMastery(
      'ventra.math.g4.fraction.proper', 4, 3, 0, 0, 0, null
    ), // Developing (75%)
    'ventra.math.g4.fraction.improper': evaluateSkillMastery(
      'ventra.math.g4.fraction.improper', 4, 1, 0, 0, 0, null
    ), // Struggling (25%) -> En zayıf!
    'ventra.math.g4.fraction.mixed': evaluateSkillMastery(
      'ventra.math.g4.fraction.mixed', 0, 0, 0, 0, 0, null
    ), // Unattempted
    'ventra.math.g4.fraction.visual_reading': evaluateSkillMastery(
      'ventra.math.g4.fraction.visual_reading', 0, 0, 0, 0, 0, null
    ) // Unattempted
  };

  const rec = determineRecommendedReview(masteries);
  assert.ok(rec);
  assert.equal(rec.skillId, 'ventra.math.g4.fraction.improper', 'En zayıf beceri (Bileşik Kesirler) tavsiye edilmeli');
  assert.equal(rec.reason, 'struggling');
  assert.match(rec.explanation, /Bileşik Kesirleri Tanıma/i);
  assert.equal(rec.suggestedAction, 'learn_lesson');
});

test('Catalog Single Source of Truth & Curriculum Codes Parity', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  
  const { fileURLToPath } = await import('node:url');
  const catalogPath = fileURLToPath(new URL('../../../packages/shared/src/catalog/skills.json', import.meta.url));
  assert.ok(fs.existsSync(catalogPath), 'skills.json canonical katalog dosyası mevcut olmalı');
  
  const jsonContent = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  assert.equal(jsonContent.authority, 'MEB');
  assert.equal(jsonContent.grade, 4);
  assert.equal(jsonContent.subject, 'Matematik');
  assert.equal(jsonContent.subLearningArea, 'Kesirler');
  assert.ok(Array.isArray(jsonContent.skills));
  assert.ok(jsonContent.skills.length >= 6, 'En az 6 adet iç beceri tanımlanmış olmalı (M.4.1.6.1 ve M.4.1.6.2)');

  for (const sk of jsonContent.skills) {
    const tsSkill = VENTRA_FRACTION_SKILLS[sk.id];
    assert.ok(tsSkill, `TypeScript tarafında ${sk.id} tanımlı olmalı`);
    assert.equal(tsSkill.title, sk.title);
    assert.equal(tsSkill.description, sk.description);
    assert.deepEqual(tsSkill.curriculumCodes, sk.curriculumCodes);
    assert.ok(
      (sk.targetWorkshopLevels && sk.targetWorkshopLevels.length > 0) ||
      (sk.targetBridgeLevels && sk.targetBridgeLevels.length > 0),
      `${sk.id} için atölye veya köprü seviyesi haritalanmış olmalı`
    );
  }
});

test('Star Economy: Invariants and Replay Resistance across All 10 Levels', () => {
  const levelProgress = {};
  for (let i = 1; i <= 10; i++) {
    levelProgress[i] = {
      gameId: 'kesir_atolyesi',
      levelId: i,
      bestStars: 3,
      bestScore: 100,
      bestAccuracy: 1.0,
      attemptsCount: 1,
      completedCount: 1,
      firstCompletedAt: '',
      lastCompletedAt: ''
    };
  }

  // 10 seviye * 3 yıldız = 30 max yıldız
  assert.equal(calculateTotalStars(levelProgress), 30);

  // Seviye 1'i 100 kez 3 yıldızla oynamış olsa bile 3 yıldız kalır
  levelProgress[1].attemptsCount = 100;
  levelProgress[1].completedCount = 100;
  assert.equal(calculateTotalStars(levelProgress), 30);

  // Sıfır yıldızlı boş harita
  const emptyProgress = {};
  for (let i = 1; i <= 10; i++) {
    emptyProgress[i] = {
      gameId: 'kesir_atolyesi',
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
  assert.equal(calculateTotalStars(emptyProgress), 0);
});

