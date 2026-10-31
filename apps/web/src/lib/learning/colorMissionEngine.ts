import { COLOR_GROVE_WORDS } from '../progress/colorGroveProgress.ts';
import type { ColorAnswerEvidence } from '@ventra/shared';

export type ColorId = (typeof COLOR_GROVE_WORDS)[number]['id'];
export type ColorMissionId = 1 | 2 | 3;
export type EnglishPlacement = 'Pre-A1' | 'A1' | 'A2';

export interface ColorMissionQuestion {
  target: ColorId;
  choices: ColorId[];
  // Two scene variants add interaction variety without pretending these are different curricula.
  scene: 'garden' | 'butterfly' | 'paint';
}
export interface PlannedColorMission {
  mission: ColorMissionId;
  colors: ColorId[];
  questions: ColorMissionQuestion[];
  reviewColorIds: ColorId[];
  seed: number;
}

/**
 * Switching stages can briefly expose the previous stage's plan to React.
 * Mission 1 intentionally has no questions. Never dereference an invalid
 * question or a question belonging to another stage.
 */
export function getActiveColorQuestion(
  plan: PlannedColorMission | null,
  mission: ColorMissionId,
  index: number
): ColorMissionQuestion | null {
  if (!plan || plan.mission !== mission || mission === 1 ||
      !Number.isInteger(index) || index < 0) {
    return null;
  }
  return plan.questions[index] ?? null;
}

/**
 * Weakness is recoverable. A previous wrong answer schedules review until the
 * child recalls the word correctly on the first try twice afterwards.
 * Sort timestamps for deterministic cloud/offline event reconciliation.
 */
export function getWeakColorIds(history: ColorAnswerEvidence[]): ColorId[] {
  const byWord = new Map<string, ColorAnswerEvidence[]>();
  const chronological = history
    .filter(item => item.kind === 'recall' && COLOR_GROVE_WORDS.some(word => word.id === item.wordId))
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const at = Date.parse(a.item.timestamp), bt = Date.parse(b.item.timestamp);
      return (Number.isFinite(at) ? at : 0) - (Number.isFinite(bt) ? bt : 0) || a.index - b.index;
    });
  for (const { item } of chronological) {
    const group = byWord.get(item.wordId) ?? [];
    group.push(item);
    byWord.set(item.wordId, group);
  }
  return COLOR_GROVE_WORDS.filter(word => {
    const attempts = byWord.get(word.id) ?? [];
    const lastMistake = attempts.findLastIndex(attempt =>
      attempt.mistakes > 0 || !attempt.firstTryCorrect
    );
    if (lastMistake < 0) return false;
    const recovered = attempts.slice(lastMistake + 1).filter(attempt =>
      attempt.firstTryCorrect && attempt.mistakes === 0
    ).length >= 2;
    return !recovered;
  }).map(word => word.id);
}

function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function weightedShuffle<T>(items: T[], weight: (item: T) => number, rnd: () => number): T[] {
  // Efraimidis-Spirakis weighted sampling without replacement.
  return items.map((item) => ({
    item,
    key: -Math.log(Math.max(rnd(), Number.EPSILON)) / Math.max(0.01, weight(item))
  })).sort((a, b) => a.key - b.key).map(({ item }) => item);
}

export function planColorMission(args: {
  mission: ColorMissionId;
  history: ColorAnswerEvidence[];
  seed: number;
  englishLevel: EnglishPlacement;
}): PlannedColorMission {
  const rnd = random(args.seed);
  const all = COLOR_GROVE_WORDS.map((v) => v.id);
  const seen = new Set(args.history.filter(item => item.kind === 'discovery').map(item => item.wordId));
  // A learner can recover from an error: two later first-try recalls clear
  // its "needs review" status. Old cumulative mistakes must not trap the
  // child in the same extra questions forever.
  const weak = new Set(getWeakColorIds(args.history));
  const attemptsByWord = new Map<string, ColorAnswerEvidence[]>();
  for (const attempt of args.history.filter(item => item.kind === 'recall')) {
    const attempts = attemptsByWord.get(attempt.wordId) ?? [];
    attempts.push(attempt);
    attemptsByWord.set(attempt.wordId, attempts);
  }
  const priority = (id: string) => {
    const last = (attemptsByWord.get(id) ?? []).slice(-5);
    const recentMisses = last.reduce((sum, row) => sum + Math.max(0, row.mistakes), 0);
    return weak.has(id) ? Math.min(12, 5 + recentMisses) : Math.max(0.75, 2 - last.length * 0.15);
  };

  if (args.mission === 1) {
    // First visit exposes six accessible colors. Replays preferentially introduce unseen colors.
    const starters: ColorId[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];
    const pool = args.history.length === 0 ? starters : all;
    const selected = weightedShuffle(pool, id => seen.has(id) ? priority(id) : 4, rnd).slice(0, 6);
    return { mission: 1, colors: selected, questions: [], reviewColorIds: [], seed: args.seed };
  }

  // A learner cannot be tested on words they have not encountered in the discovery mission.
  const learned = all.filter(id => seen.has(id));
  const allowed = learned.length > 0 ? learned : ['red', 'blue', 'yellow', 'green', 'purple', 'orange'] as ColorId[];
  const count = Math.min(6, allowed.length);
  // Guarantee currently weak, previously seen words appear in the base
  // questions, rather than merely giving them a higher random probability.
  const review = weightedShuffle(allowed.filter(id => weak.has(id)), priority, rnd).slice(0, 2);
  const otherTargets = weightedShuffle(allowed.filter(id => !review.includes(id)), priority, rnd)
    .slice(0, Math.max(0, count - review.length));
  const targets = weightedShuffle([...review, ...otherTargets], priority, rnd);
  const sequence = [...targets];
  for (const target of review) {
    const positions = Array.from({ length: sequence.length + 1 }, (_, i) => i)
      .filter(i => (i === 0 || sequence[i - 1] !== target) &&
                   (i === sequence.length || sequence[i] !== target));
    const original = sequence.indexOf(target);
    // Keep duplicate review questions apart even on short plans.
    const position = positions.sort((a, b) =>
      Math.abs(b - original) - Math.abs(a - original) || a - b
    )[0] ?? sequence.length;
    sequence.splice(position, 0, target);
  }
  const questions = sequence.map((target, index) => {
    const distractors = weightedShuffle(allowed.filter(id => id !== target), () => 1, rnd).slice(0, 2);
    const choices = weightedShuffle([target, ...distractors], () => 1, rnd);
    return {
      target,
      choices,
      scene: ((index + Math.floor(rnd() * 3)) % 3 === 0 ? 'butterfly' : args.mission === 3 ? 'paint' : 'garden') as ColorMissionQuestion['scene']
    };
  });
  const reviewColorIds = review;
  return { mission: args.mission, colors: [], questions, reviewColorIds, seed: args.seed };
}

export function getColorInstruction(
  target: ColorId,
  mission: ColorMissionId,
  level: EnglishPlacement
): { title: string; guide: string; speech: string } {
  if (mission === 2) {
    return { title: 'Bu renk İngilizcede ne?', guide: 'Rengi gör ve İngilizce adını seç.', speech: target };
  }
  if (mission === 3 && level === 'Pre-A1') {
    // No unintroduced verb or sentence structure for beginners.
    return { title: target.toUpperCase(), guide: 'Yazılan İngilizce rengi bul ve dokun.', speech: target };
  }
  // The verb is explicitly translated: the sentence is never treated as prior knowledge.
  return { title: `Find ${target}!`, guide: 'Find = bul. Renkli nesneler arasından doğru rengi bul.', speech: `Find ${target}` };
}
