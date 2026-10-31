import test from 'node:test';
import assert from 'node:assert/strict';
import { planColorMission, getColorInstruction } from '../src/lib/learning/colorMissionEngine.ts';
import { COLOR_GROVE_WORDS } from '../src/lib/progress/colorGroveProgress.ts';
import { MemoryProgressRepository } from '../src/lib/progress/MemoryProgressRepository.ts';
import { getColorGroveProgress, saveColorGroveMission } from '../src/lib/progress/colorGroveProgress.ts';

const discover = COLOR_GROVE_WORDS.slice(0, 6).map((color) => ({
  wordId: color.id, mistakes: 0, firstTryCorrect: false, kind: 'discovery', timestamp: '2026-10-31T00:00:00.000Z'
}));

test('Color mission generator is deterministic, varied and valid', () => {
  const a = planColorMission({ mission: 2, history: discover, seed: 100, englishLevel: 'Pre-A1' });
  const again = planColorMission({ mission: 2, history: discover, seed: 100, englishLevel: 'Pre-A1' });
  const b = planColorMission({ mission: 2, history: discover, seed: 101, englishLevel: 'Pre-A1' });
  assert.deepEqual(a, again);
  assert.notDeepEqual(a.questions, b.questions);
  assert.equal(a.questions.length, 6);
  for (const q of a.questions) {
    assert.ok(q.choices.includes(q.target));
    assert.equal(new Set(q.choices).size, q.choices.length);
    assert.ok(q.choices.every(id => discover.some(d => d.wordId === id)));
  }
});

test('Pre-A1 instructions do not presuppose complex commands', () => {
  const beginner = getColorInstruction('purple', 3, 'Pre-A1');
  assert.equal(beginner.title, 'PURPLE');
  assert.equal(beginner.speech, 'purple');
  const a1 = getColorInstruction('purple', 3, 'A1');
  assert.match(a1.guide, /Find = bul/);
});

test('Mission planner favors seen weak words and introduces new exposure during replay', () => {
  const history = [...discover, { wordId: 'red', mistakes: 6, firstTryCorrect: false, kind: 'recall', timestamp: '2026-10-31T00:00:00.000Z' }];
  const reviewed = planColorMission({ mission: 2, history, seed: 17, englishLevel: 'Pre-A1' });
  assert.ok(reviewed.questions.every(question => discover.some(item => item.wordId === question.target)));
  const discovery = planColorMission({ mission: 1, history, seed: 18, englishLevel: 'Pre-A1' });
  assert.equal(discovery.colors.length, 6);
  assert.ok(discovery.colors.every(id => COLOR_GROVE_WORDS.some(word => word.id === id)));
});

test('Color mission recording preserves child isolation and stores answer evidence', async () => {
  const repo = new MemoryProgressRepository();
  const a = await repo.createProfile({ nickname: 'Can', avatarId: 'avatar_explorer' });
  const b = await repo.createProfile({ nickname: 'Ada', avatarId: 'avatar_explorer' });
  const first = await saveColorGroveMission(repo, a.id, 1, 0, 6, 30, discover);
  assert.equal(first.completedLevels, 1);
  assert.equal((await getColorGroveProgress(repo, b.id)).completedLevels, 0);
  assert.equal((await repo.getColorAnswerHistory(a.id)).length, 6);
  await assert.rejects(saveColorGroveMission(repo, b.id, 3, 0, 6, 20, []), /Önceki/);
  await saveColorGroveMission(repo, a.id, 2, 2, 6, 30, [
    { wordId: 'red', mistakes: 2, firstTryCorrect: false, kind: 'recall', timestamp: '2026-10-31T00:00:00.000Z' }
  ]);
  assert.equal((await repo.getColorAnswerHistory(a.id)).length, 7);
  assert.equal((await getColorGroveProgress(repo, a.id)).completedLevels, 2);
});
