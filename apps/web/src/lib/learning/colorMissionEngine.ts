import { COLOR_GROVE_WORDS } from '../progress/colorGroveProgress.ts';
import type { ColorAnswerEvidence } from '@ventra/shared';
import { getLearningSnapshot, needsReview } from './adaptiveLearningEngine.ts';
import { resolveGradeAwarePolicy, resolveVocabularyTier, gradeAwareReviewPriority } from './gradeAwareLearningPolicy.ts';

export type ColorId = (typeof COLOR_GROVE_WORDS)[number]['id'];
export type ColorMissionId = 1 | 2 | 3;
export type EnglishPlacement = 'Pre-A1' | 'A1' | 'A2';

/** Advanced shade vocabulary is opt-in through English placement AND grade;
 * a beginner never receives near-identical shades as first-time answers. */
export function eligibleColorWords(gradeLevel: number | null | undefined, englishLevel: EnglishPlacement) {
  const tier=resolveVocabularyTier(gradeLevel,englishLevel);
  return COLOR_GROVE_WORDS.filter(word => (('tier' in word ? word.tier : 0) as number) <= tier);
}

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
  eligibleCount: number;
  encounteredCount: number;
  freshColorIds: ColorId[];
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
    // Array.findLastIndex is unavailable in older iOS WebViews.
    let lastMistake = -1;
    for (let i = attempts.length - 1; i >= 0; i--) {
      if (attempts[i].mistakes > 0 || !attempts[i].firstTryCorrect) {
        lastMistake = i;
        break;
      }
    }
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
  gradeLevel?:number|null;
  now?: string;
}): PlannedColorMission {
  const rnd = random(args.seed);
  const policy=resolveGradeAwarePolicy({domain:'colors',gradeLevel:args.gradeLevel,englishLevel:args.englishLevel});
  const all = eligibleColorWords(args.gradeLevel, args.englishLevel).map((v) => v.id);
  const allSet = new Set<string>(all);
  const seen = new Set(args.history.filter(item => item.kind === 'discovery' && allSet.has(item.wordId)).map(item => item.wordId));
  const planMeta = { eligibleCount: all.length, encounteredCount: seen.size };
  // A learner can recover from an error: two later first-try recalls clear
  // its "needs review" status. Old cumulative mistakes must not trap the
  // child in the same extra questions forever.
  const weak = new Set<string>(getWeakColorIds(args.history));
  const attemptsByWord = new Map<string, ColorAnswerEvidence[]>();
  for (const attempt of args.history.filter(item => item.kind === 'recall')) {
    const attempts = attemptsByWord.get(attempt.wordId) ?? [];
    attempts.push(attempt);
    attemptsByWord.set(attempt.wordId, attempts);
  }
  const learning = getLearningSnapshot({
    animalAnswers:[],colorAnswers:args.history,animalWords:[],colorWords:all,
    now:args.now??new Date().toISOString()
  });
  const due = new Set<string>(all.filter(id=>
    needsReview(learning,'colors',args.mission===3?'application':'recognition',id)));
  const priority = (id: string) => {
    const last = (attemptsByWord.get(id) ?? []).slice(-5);
    const recentMisses = last.reduce((sum, row) => sum + Math.max(0, row.mistakes), 0);
    return weak.has(id) ? Math.min(12, 5 + recentMisses) :
      due.has(id) ? 6 : Math.max(0.75, 2 - last.length * 0.15);
  };

  if (args.mission === 1) {
    // First visit exposes six accessible colors. Replays preferentially introduce unseen colors.
    const starters: ColorId[] = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];
    const pool = seen.size === 0 ? starters : all;
    // At least four unseen concepts per revisit while any remain: the entire
    // tier-appropriate catalogue is reachable without changing level IDs.
    const freshPool = pool.filter(id => !seen.has(id));
    const fresh = weightedShuffle(freshPool, () => 1, rnd).slice(0, Math.min(freshPool.length, policy.discoveryCount === 4 ? 3 : 4));
    const rest = weightedShuffle(pool.filter(id => !fresh.includes(id)), priority, rnd)
      .slice(0, policy.discoveryCount - fresh.length);
    const selected = weightedShuffle([...fresh, ...rest], () => 1, rnd);
    return { mission: 1, colors: selected, questions: [], reviewColorIds: [], seed: args.seed,
      ...planMeta, freshColorIds: fresh };
  }

  // A learner cannot be tested on words they have not encountered in the discovery mission.
  const learned = all.filter(id => seen.has(id));
  const allowed = learned.length > 0 ? learned : ['red', 'blue', 'yellow', 'green', 'purple', 'orange'] as ColorId[];
  const count = Math.min(policy.questionCount, allowed.length);
  // Guarantee currently weak, previously seen words appear in the base
  // questions, rather than merely giving them a higher random probability.
  const review = weightedShuffle(allowed.filter(id => weak.has(id)), priority, rnd).slice(0, 2);
  const dueTargets = weightedShuffle(allowed.filter(id=>due.has(id)&&!review.includes(id)),priority,rnd)
    .slice(0,Math.min(2,count-review.length));
  const otherTargets = [
    ...dueTargets,
    ...weightedShuffle(gradeAwareReviewPriority(learning,'colors',args.mission===3?'application':'recognition',allowed)
        .filter((id): id is ColorId=>!review.includes(id as ColorId)&&!dueTargets.includes(id as ColorId)),priority,rnd)
      .slice(0,Math.max(0,count-review.length-dueTargets.length))
  ];
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
  // Rotate three garden motifs without altering adaptive question selection.
  const sceneOffset = Math.floor(rnd() * 3);
  const sceneVariants = ['garden', 'butterfly', 'paint'] as const;
  const questions = sequence.map((target, index) => {
    const distractors = weightedShuffle(distinctColorDistractors(target, allowed, policy.choiceCount-1), () => 1, rnd)
      .slice(0, policy.choiceCount-1);
    const choices = weightedShuffle([target, ...distractors], () => 1, rnd);
    return {
      target,
      choices,
      scene: sceneVariants[(index + sceneOffset) % sceneVariants.length]
    };
  });
  const reviewColorIds = review;
  return { mission: args.mission, colors: [], questions, reviewColorIds, seed: args.seed,
    ...planMeta, freshColorIds: [] };
}

/** Perceptual (CIE76 ΔE) distance between two colour words' swatches. */
const labCache = new Map<string, readonly [number, number, number]>();
function swatchLab(id: string): readonly [number, number, number] {
  const cached = labCache.get(id);
  if (cached) return cached;
  const hex = COLOR_GROVE_WORDS.find(word => word.id === id)?.hex ?? '#000000';
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const x = f((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047);
  const y = f(r * 0.2126 + g * 0.7152 + b * 0.0722);
  const z = f((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
  const lab = [116 * y - 16, 500 * (x - y), 200 * (y - z)] as const;
  labCache.set(id, lab);
  return lab;
}
export function colorSwatchDistance(a: string, b: string): number {
  const [l1, a1, b1] = swatchLab(a), [l2, a2, b2] = swatchLab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}
/** Below this ΔE two swatches are easy to confuse (purple/violet, dark blue/indigo,
 * yellow/gold, gray/silver, light/mint green…): a fair question never pairs them. */
export const CONFUSABLE_COLOR_DELTA_E = 30;

/** A general colour word and the named shades a child could defend as ALSO
 * being it: "Find blue!" next to light blue (ΔE 55) or navy blue, "green"
 * next to dark or mint green, "purple" next to lavender. Swatch distance alone
 * let these through. Two shades of one family (light blue, dark blue) stay
 * pairable: telling them apart is exactly what "light" and "dark" teach. */
export const COLOR_FAMILIES: Readonly<Record<string, readonly string[]>> = {
  blue: ['light blue', 'dark blue', 'navy blue', 'indigo'],
  green: ['light green', 'dark green', 'olive green', 'mint green'],
  purple: ['violet', 'lavender', 'indigo'],
  red: ['maroon'],
  pink: ['coral'],
  orange: ['peach', 'coral'],
  yellow: ['gold', 'cream'],
  white: ['cream', 'silver'],
  gray: ['silver'],
  brown: ['beige', 'maroon']
};
function sameColorFamily(a: string, b: string): boolean {
  return (COLOR_FAMILIES[a] ?? []).includes(b) || (COLOR_FAMILIES[b] ?? []).includes(a);
}
/** True when a fair question must not offer both: a general word with its own
 * shade, or two swatches closer than CONFUSABLE_COLOR_DELTA_E. */
export function colorsConfusable(a: string, b: string): boolean {
  return a !== b && (sameColorFamily(a, b) || colorSwatchDistance(a, b) < CONFUSABLE_COLOR_DELTA_E);
}
export function distinctColorDistractors<T extends string>(target: T, allowed: readonly T[], needed: number): T[] {
  const others = allowed.filter(id => id !== target);
  const distinct = others.filter(id => !colorsConfusable(target, id));
  if (distinct.length >= needed) return distinct;
  // Never block a mission: top up with the least confusable colours left -
  // a general word's own shade only as the very last resort.
  const rest = others.filter(id => !distinct.includes(id)).sort((a, b) =>
    Number(sameColorFamily(target, a)) - Number(sameColorFamily(target, b)) ||
    colorSwatchDistance(target, b) - colorSwatchDistance(target, a));
  return [...distinct, ...rest].slice(0, Math.max(needed, distinct.length));
}

export function getColorInstruction(
  target: ColorId,
  mission: ColorMissionId,
  level: EnglishPlacement
): { title: string; guide: string; speech: string } {
  if (mission === 2) {
    // The child must recall the colour word: the speaker asks the question and
    // never says the answer (it used to speak `target`, saved as independent).
    return { title: 'Bu renk İngilizcede ne?', guide: 'Rengi gör ve İngilizce adını seç.', speech: 'What color is this?' };
  }
  if (mission === 3 && level === 'Pre-A1') {
    // No unintroduced verb or sentence structure for beginners.
    return { title: target.toUpperCase(), guide: 'Yazılan İngilizce rengi bul ve dokun.', speech: target };
  }
  // The verb is explicitly translated: the sentence is never treated as prior knowledge.
  return { title: `Find ${target}!`, guide: 'Find = bul. Renkli nesneler arasından doğru rengi bul.', speech: `Find ${target}` };
}
