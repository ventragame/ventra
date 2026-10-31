import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryProgressRepository } from '../src/lib/progress/MemoryProgressRepository.ts';
import { COLOR_GROVE_WORDS, saveColorGroveMission, getColorGroveProgress } from '../src/lib/progress/colorGroveProgress.ts';
import { planColorMission, getWeakColorIds } from '../src/lib/learning/colorMissionEngine.ts';

test('Color Grove save retry is idempotent across identical session IDs', async () => {
  const repo = new MemoryProgressRepository();
  const profile = await repo.createProfile({ nickname: 'Ada', avatarId: 'avatar_explorer' });
  const key = 'cg_Ada_1_test_fixed';
  await saveColorGroveMission(repo, profile.id, 1, 0, 6, 40, [], key);
  const firstStars = await repo.getTotalStars(profile.id);
  await saveColorGroveMission(repo, profile.id, 1, 0, 6, 40, [], key);
  assert.equal(await repo.getTotalStars(profile.id), firstStars);
  assert.equal((await getColorGroveProgress(repo, profile.id)).completedLevels, 1);
});

test('Child grade and placement can be preserved without changing child identity', async () => {
  const repo = new MemoryProgressRepository();
  const p = await repo.createProfile({ nickname: 'Deniz', avatarId: 'avatar_owl', gradeLevel: 3, englishLevel: 'Pre-A1' });
  const before = p.id;
  const updated = await repo.updateProfile(p.id, { gradeLevel: 4, englishLevel: 'A1' });
  assert.equal(updated.id, before);
  assert.equal(updated.gradeLevel, 4);
  assert.equal(updated.englishLevel, 'A1');
  assert.equal(updated.isCloudSynced, false);
});

test('Full Color Grove loop: discovery -> matching -> painting -> adaptive recovery -> replay', async () => {
  const repo = new MemoryProgressRepository();
  const child = await repo.createProfile({ nickname: 'Minik Kaşif', avatarId: 'avatar_explorer', englishLevel: 'Pre-A1' });
  const other = await repo.createProfile({ nickname: 'İkinci Çocuk', avatarId: 'avatar_owl' });
  const discovery = planColorMission({ mission: 1, history: [], seed: 17, englishLevel: 'Pre-A1' });
  assert.equal(discovery.colors.length, 6);
  const exposure = discovery.colors.map(wordId => ({
    wordId, kind: 'discovery', firstTryCorrect: false, mistakes: 0, timestamp: '2026-11-01T09:00:00.000Z'
  }));
  await saveColorGroveMission(repo, child.id, 1, 0, exposure.length, 25, exposure, 'full-slice-discover');
  assert.equal((await getColorGroveProgress(repo, child.id)).completedLevels, 1);
  const matching = planColorMission({ mission: 2, history: await repo.getColorAnswerHistory(child.id), seed: 13, englishLevel: 'Pre-A1' });
  assert.equal(matching.questions.length, 6);
  const struggled = matching.questions[0].target;
  const matchingAnswers = matching.questions.map((q,i) => ({
    wordId: q.target, kind: 'recall', firstTryCorrect: i !== 0,
    mistakes: i === 0 ? 2 : 0, hintUsed: i === 0,
    timestamp: new Date(Date.parse('2026-11-01T10:00:00Z') + i * 1000).toISOString()
  }));
  await saveColorGroveMission(repo, child.id, 2, 2, matching.questions.length, 55, matchingAnswers, 'full-slice-match');
  assert.ok(getWeakColorIds(await repo.getColorAnswerHistory(child.id)).includes(struggled));

  const painting = planColorMission({ mission: 3, history: await repo.getColorAnswerHistory(child.id), seed: 23, englishLevel: 'Pre-A1' });
  assert.equal(painting.questions.length, 7, 'a weak color is reviewed twice');
  assert.equal(painting.questions.filter(q => q.target === struggled).length, 2);
  const paintAnswers = painting.questions.map((q,i) => ({
    wordId: q.target, kind: 'recall', firstTryCorrect: true, mistakes: 0, hintUsed: false,
    timestamp: new Date(Date.parse('2026-11-01T11:00:00Z') + i * 1000).toISOString()
  }));
  await saveColorGroveMission(repo, child.id, 3, 0, painting.questions.length, 60, paintAnswers, 'full-slice-paint');
  assert.equal((await getColorGroveProgress(repo, child.id)).completedLevels, 3);
  assert.equal((await getColorGroveProgress(repo, other.id)).completedLevels, 0, 'child isolation');
  assert.equal((await repo.getTotalStars(child.id)), 8, 'best stars, not session summation');
  assert.ok(!getWeakColorIds(await repo.getColorAnswerHistory(child.id)).includes(struggled),
    'two clean later recalls recover the weak color');

  const replay = planColorMission({ mission: 2, history: await repo.getColorAnswerHistory(child.id), seed: 56, englishLevel: 'Pre-A1' });
  assert.equal(replay.questions.length, 6, 'mastered word does not create an endless review loop');
  await saveColorGroveMission(repo, child.id, 2, 0, replay.questions.length, 30,
    replay.questions.map(q => ({ wordId: q.target, kind: 'recall', firstTryCorrect: true, mistakes: 0, timestamp: '2026-11-01T12:00:00.000Z' })),
    'full-slice-replay');
  assert.equal(await repo.getTotalStars(child.id), 9);
  assert.equal((await getColorGroveProgress(repo, child.id)).completedLevels, 3);
  assert.equal(COLOR_GROVE_WORDS.length, 10, 'catalog remains intact');
});
