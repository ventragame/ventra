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
  const seen = new Set(args.history.filter((item) => item.kind === 'discovery').map((item) => item.wordId));
  const validRecall = args.history.filter((item) => item.kind === 'recall');
  const misses = new Map<string, number>();
  const correct = new Map<string, number>();
  for (const attempt of validRecall) {
    misses.set(attempt.wordId, (misses.get(attempt.wordId) || 0) + Math.max(0, attempt.mistakes));
    correct.set(attempt.wordId, (correct.get(attempt.wordId) || 0) + Number(attempt.firstTryCorrect));
  }
  const priority = (id: string) => {
    const wrong = misses.get(id) || 0;
    const right = correct.get(id) || 0;
    return Math.max(0.75, 2 + wrong * 1.7 - right * 0.35);
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
  const targets = weightedShuffle(allowed, priority, rnd).slice(0, count);
  const questions = targets.map((target, index) => {
    const distractors = weightedShuffle(allowed.filter(id => id !== target), () => 1, rnd).slice(0, 2);
    const choices = weightedShuffle([target, ...distractors], () => 1, rnd);
    return {
      target,
      choices,
      scene: ((index + Math.floor(rnd() * 3)) % 3 === 0 ? 'butterfly' : args.mission === 3 ? 'paint' : 'garden') as ColorMissionQuestion['scene']
    };
  });
  const reviewColorIds = targets.filter(id => (misses.get(id) || 0) > (correct.get(id) || 0));
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
