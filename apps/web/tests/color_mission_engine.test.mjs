import test from 'node:test';
import assert from 'node:assert/strict';
import { planColorMission, getColorInstruction, getActiveColorQuestion, getWeakColorIds } from '../src/lib/learning/colorMissionEngine.ts';
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

test('Color Grove stage transitions cannot use questions from a previous mission', () => {
  const discovery = planColorMission({ mission: 1, history: [], seed: 7, englishLevel: 'Pre-A1' });
  const quiz = planColorMission({ mission: 2, history: discover, seed: 7, englishLevel: 'Pre-A1' });
  const paint = planColorMission({ mission: 3, history: discover, seed: 8, englishLevel: 'Pre-A1' });

  // The original runtime crash: stage 2 was rendered with stage 1's empty plan.
  assert.equal(discovery.questions.length, 0);
  assert.equal(getActiveColorQuestion(discovery, 2, 0), null);
  assert.equal(getActiveColorQuestion(quiz, 3, 0), null);
  assert.equal(getActiveColorQuestion(paint, 2, 0), null);
  assert.equal(getActiveColorQuestion(quiz, 1, 0), null);
  assert.equal(getActiveColorQuestion(null, 2, 0), null);

  // Invalid indices must not throw during rapid stage changes / replay.
  assert.equal(getActiveColorQuestion(quiz, 2, -1), null);
  assert.equal(getActiveColorQuestion(quiz, 2, quiz.questions.length), null);
  assert.equal(getActiveColorQuestion(quiz, 2, NaN), null);
  assert.deepEqual(getActiveColorQuestion(quiz, 2, 0), quiz.questions[0]);
  assert.deepEqual(getActiveColorQuestion(paint, 3, 0), paint.questions[0]);
});

test('Replay explicitly practices weak colors again with spaced questions', () => {
  const history = [
    ...discover,
    { wordId: 'red', mistakes: 3, firstTryCorrect: false, kind: 'recall', timestamp: '2026-10-31T00:00:00.000Z' },
    { wordId: 'blue', mistakes: 2, firstTryCorrect: false, kind: 'recall', timestamp: '2026-10-31T00:00:00.000Z' }
  ];
  const plan = planColorMission({ mission: 2, history, seed: 77, englishLevel: 'Pre-A1' });
  assert.equal(plan.questions.length, 8);
  assert.deepEqual(new Set(plan.reviewColorIds), new Set(['red', 'blue']));
  assert.equal(plan.questions.filter(q => q.target === 'red').length, 2);
  assert.equal(plan.questions.filter(q => q.target === 'blue').length, 2);
  for (let i = 1; i < plan.questions.length; i++) {
    assert.notEqual(plan.questions[i].target, plan.questions[i - 1].target, 'repeat must not be adjacent');
  }
  assert.ok(plan.questions.every(q => q.choices.includes(q.target)));
  assert.ok(plan.questions.every(q => new Set(q.choices).size === q.choices.length));
});

test('No weak words means no unnecessary extended replay', () => {
  const history = [...discover, { wordId: 'red', mistakes: 0, firstTryCorrect: true, kind: 'recall', timestamp: '2026-10-31T00:00:00.000Z' }];
  const plan = planColorMission({ mission: 3, history, seed: 88, englishLevel: 'A1' });
  assert.equal(plan.questions.length, 6);
  assert.equal(plan.reviewColorIds.length, 0);
});

test('Weak-word state clears after two later first-try correct answers', () => {
  const wrong = { wordId: 'red', mistakes: 2, firstTryCorrect: false, kind: 'recall', timestamp: '2026-10-31T10:00:00.000Z' };
  const right1 = { ...wrong, mistakes: 0, firstTryCorrect: true, timestamp: '2026-10-31T11:00:00.000Z' };
  const right2 = { ...right1, timestamp: '2026-10-31T12:00:00.000Z' };
  assert.deepEqual(getWeakColorIds([right1, wrong]), ['red'], 'out-of-order events are timestamp sorted');
  assert.deepEqual(getWeakColorIds([wrong, right1]), ['red'], 'one correct still requires practice');
  assert.deepEqual(getWeakColorIds([right2, wrong, right1]), [], 'two later successful recalls clear weakness');
  const recovered = planColorMission({ mission: 2, history: [...discover, wrong, right1, right2], seed: 2, englishLevel: 'Pre-A1' });
  assert.equal(recovered.reviewColorIds.length, 0);
  assert.equal(recovered.questions.length, 6);
});

test('Review planning guarantees weak colors appear and are spaced over many seeds', () => {
  const allDiscovery = COLOR_GROVE_WORDS.map(word => ({
    wordId: word.id, mistakes: 0, firstTryCorrect: false, kind: 'discovery', timestamp: '2026-10-31T00:00:00.000Z'
  }));
  const weak = ['pink', 'brown'].map(wordId => ({
    wordId, mistakes: 2, firstTryCorrect: false, kind: 'recall', timestamp: '2026-10-31T11:00:00.000Z'
  }));
  for (let seed = 1; seed <= 150; seed++) {
    const plan = planColorMission({ mission: 3, history: [...allDiscovery, ...weak], seed, englishLevel: 'A1' });
    assert.equal(plan.questions.length, 8);
    assert.deepEqual(new Set(plan.reviewColorIds), new Set(['pink', 'brown']));
    for (const word of ['pink', 'brown']) {
      const indices = plan.questions.flatMap((q, i) => q.target === word ? [i] : []);
      assert.equal(indices.length, 2, 'weak word must be tested twice');
      assert.ok(indices[1] - indices[0] >= 2, 'weak word repeats must not be consecutive');
    }
    assert.ok(plan.questions.every(q => new Set(q.choices).size === q.choices.length));
  }
});
