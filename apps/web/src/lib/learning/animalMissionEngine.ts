import type { AnimalAnswerEvidence } from '@ventra/shared';
import { getLearningSnapshot, needsReview } from './adaptiveLearningEngine.ts';

export const ANIMAL_MEADOW_WORDS = [
  { id: 'cat', tr: 'Kedi', emoji: '🐱', habitat: 'Yumuşak minder', place: 'Ev', audio: '/audio/en/animals/cat.wav', image: '/assets/animals/premium/cat.svg' },
  { id: 'dog', tr: 'Köpek', emoji: '🐶', habitat: 'Köpek kulübesi', place: 'Bahçe', audio: '/audio/en/animals/dog.wav', image: '/assets/animals/premium/dog.svg' },
  { id: 'bird', tr: 'Kuş', emoji: '🐦', habitat: 'Ağaç dalı', place: 'Ağaç', audio: '/audio/en/animals/bird.wav', image: '/assets/animals/premium/bird.svg' },
  { id: 'rabbit', tr: 'Tavşan', emoji: '🐰', habitat: 'Havuçlu yuva', place: 'Çayır', audio: '/audio/en/animals/rabbit.wav', image: '/assets/animals/premium/rabbit.svg' },
  { id: 'cow', tr: 'İnek', emoji: '🐮', habitat: 'Çiftlik ahırı', place: 'Çiftlik', audio: null, image: '/assets/animals/premium/cow.svg' },
  { id: 'fish', tr: 'Balık', emoji: '🐟', habitat: 'Su altı', place: 'Gölet', audio: null, image: '/assets/animals/premium/fish.svg' },
  { id: 'horse', tr: 'At', emoji: '🐴', habitat: 'At ahırı', place: 'Çiftlik', audio: null, image: '/assets/animals/premium/horse.svg' },
  { id: 'duck', tr: 'Ördek', emoji: '🦆', habitat: 'Sazlıklı gölet', place: 'Gölet', audio: null, image: '/assets/animals/premium/duck.svg' },
  { id: 'sheep', tr: 'Koyun', emoji: '🐑', habitat: 'Otlayan sürü', place: 'Çayır', audio: null, image: '/assets/animals/premium/sheep.svg' },
  { id: 'frog', tr: 'Kurbağa', emoji: '🐸', habitat: 'Nilüfer yaprağı', place: 'Gölet', audio: null, image: '/assets/animals/premium/frog.svg' },
  { id: 'bee', tr: 'Arı', emoji: '🐝', habitat: 'Bal peteği', place: 'Çiçeklik', audio: null, image: '/assets/animals/premium/bee.svg' },
  { id: 'butterfly', tr: 'Kelebek', emoji: '🦋', habitat: 'Çiçek bahçesi', place: 'Çiçeklik', audio: null, image: '/assets/animals/premium/butterfly.svg' }
] as const;
export type AnimalId = (typeof ANIMAL_MEADOW_WORDS)[number]['id'];
export type AnimalMission = 1 | 2 | 3 | 4 | 5;
export type AnimalWord = (typeof ANIMAL_MEADOW_WORDS)[number];
export type AnimalMode = 'recognition' | 'listening' | 'command' | 'habitat';

export interface AnimalQuestion {
  target: AnimalId;
  choices: AnimalId[];
}
export interface PlannedAnimalMission {
  mission: AnimalMission;
  animals: AnimalId[];
  questions: AnimalQuestion[];
  reviewIds: AnimalId[];
  seed: number;
}

const STARTERS: AnimalId[] = ['cat', 'dog', 'bird', 'rabbit', 'cow', 'fish', 'horse', 'duck'];

export function findAnimal(id: string): AnimalWord | null {
  return ANIMAL_MEADOW_WORDS.find(item => item.id === id) ?? null;
}

function rndGenerator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
function shuffleWeighted<T>(items: T[], weight: (item: T) => number, rnd: () => number): T[] {
  return items.map(item => ({
    item,
    rank: -Math.log(Math.max(Number.EPSILON, rnd())) / Math.max(0.01, weight(item))
  })).sort((a,b) => a.rank - b.rank).map(row => row.item);
}
export function getWeakAnimalIds(history: AnimalAnswerEvidence[]): AnimalId[] {
  const valid = history.filter(event =>
    event.kind !== 'discovery' && Boolean(findAnimal(event.wordId)) &&
    // Audio unavailable / optional hints are neutral exposure, not proof of
    // independent recall and not a failure when the child made no mistake.
    (event.mistakes > 0 || !event.hintUsed)
  ).map((event, index) => ({ event, index }))
    .sort((a,b) => (Date.parse(a.event.timestamp) || 0) - (Date.parse(b.event.timestamp) || 0) || a.index - b.index);
  const map = new Map<string, AnimalAnswerEvidence[]>();
  valid.forEach(({event}) => map.set(event.wordId, [...(map.get(event.wordId) || []), event]));
  return ANIMAL_MEADOW_WORDS.filter(word => {
    const attempts = map.get(word.id) ?? [];
    let lastFailure = -1;
    attempts.forEach((a,i) => { if (a.mistakes > 0 || !a.firstTryCorrect || a.hintUsed) lastFailure = i; });
    return lastFailure >= 0 &&
      attempts.slice(lastFailure+1).filter(a => a.mistakes === 0 && a.firstTryCorrect && !a.hintUsed).length < 2;
  }).map(item => item.id);
}

export function planAnimalMission(input: {
  mission: AnimalMission;
  history: AnimalAnswerEvidence[];
  seed: number;
  now?: string;
}): PlannedAnimalMission {
  const rnd = rndGenerator(input.seed);
  const all: AnimalId[] = ANIMAL_MEADOW_WORDS.map(item => item.id);
  const seen = new Set(input.history.filter(item => item.kind === 'discovery').map(item => item.wordId));
  const weak = new Set<string>(getWeakAnimalIds(input.history));
  const mistakes = new Map<string,number>();
  for (const row of input.history.filter(item => item.kind !== 'discovery').slice(-80)) {
    mistakes.set(row.wordId, (mistakes.get(row.wordId)||0)+Math.max(0,row.mistakes));
  }
  const learning = getLearningSnapshot({
    animalAnswers:input.history,colorAnswers:[],animalWords:all,colorWords:[],
    now:input.now??new Date().toISOString()
  });
  const targetSkill = input.mission===2?'recognition':
    input.mission===3?'listening':input.mission===4?'command':'habitat';
  const due = new Set<string>(all.filter(id=>needsReview(learning,'animals',targetSkill,id)));
  const weight = (id: string) => weak.has(id) ? Math.min(12,5+(mistakes.get(id)||0)) :
    due.has(id)?6:2;
  if (input.mission === 1) {
    const pool = input.history.length === 0 ? STARTERS : all;
    // New animals are always available on replay, but new vocabulary cannot
    // enter a quiz until the child has encountered it during discovery.
    const fresh = shuffleWeighted(pool.filter(id => !seen.has(id)), () => 5, rnd).slice(0, 4);
    const rest = shuffleWeighted(pool.filter(id => !fresh.includes(id)), weight, rnd)
      .slice(0, 8 - fresh.length);
    return { mission: 1, animals: shuffleWeighted([...fresh,...rest], () => 1, rnd),
      questions: [], reviewIds: [], seed: input.seed };
  }
  const encountered = all.filter(id => seen.has(id));
  const allowed = encountered.length >= 3 ? encountered : STARTERS; // legacy players
  const count = Math.min(6, allowed.length);
  const review = shuffleWeighted(allowed.filter(id => weak.has(id)), weight, rnd).slice(0, 2);
  const dueTargets = shuffleWeighted(allowed.filter(id => due.has(id) && !review.includes(id)),weight,rnd)
    .slice(0,Math.min(2,count-review.length));
  const ordinary = [
    ...dueTargets,
    ...shuffleWeighted(allowed.filter(id => !review.includes(id) && !dueTargets.includes(id)),weight,rnd)
      .slice(0,count-review.length-dueTargets.length)
  ];
  const sequence = shuffleWeighted([...review,...ordinary], weight, rnd);
  for (const target of review) {
    const original = sequence.indexOf(target);
    const positions = Array.from({length:sequence.length+1},(_,i)=>i)
      .filter(i=>(i===0||sequence[i-1]!==target)&&(i===sequence.length||sequence[i]!==target));
    positions.sort((a,b)=>Math.abs(b-original)-Math.abs(a-original)||a-b);
    sequence.splice(positions[0] ?? sequence.length,0,target);
  }
  const questions: AnimalQuestion[] = sequence.map(target => {
    const others = shuffleWeighted(allowed.filter(id => id !== target),()=>1,rnd).slice(0,2);
    return { target, choices: shuffleWeighted([target,...others],()=>1,rnd) };
  });
  return { mission:input.mission,animals:[],questions,reviewIds:review,seed:input.seed };
}
export function getAnimalPrompt(mission: AnimalMission, word: AnimalWord, level: 'Pre-A1'|'A1'|'A2') {
  switch(mission){
    case 2: return { title:'Bu hayvan İngilizcede ne?', guide:'Hayvanı gör ve İngilizce adını seç.',speech:word.id };
    case 3: return { title:'Dinle ve hayvanı bul',guide:'Ses açıksa dinle, sonra doğru resme dokun.',speech:word.id };
    case 4: return { title: level==='Pre-A1' ? `Find the ${word.id.toUpperCase()}` : `Find the ${word.id}!`,
      guide:'Find = bul. Söylenen hayvanı çayırda bul.',speech:`Find the ${word.id}` };
    case 5: return { title:word.habitat,guide:'Burası hangi hayvanın yuvası? İngilizce adını seç.',speech:word.id };
    default: return { title:word.id.toUpperCase(),guide:word.tr,speech:word.id };
  }
}
