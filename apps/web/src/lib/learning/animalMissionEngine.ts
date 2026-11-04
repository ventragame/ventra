import type { AnimalAnswerEvidence } from '@ventra/shared';
import { getLearningSnapshot, needsReview } from './adaptiveLearningEngine.ts';
import { resolveGradeAwarePolicy, resolveVocabularyTier, gradeAwareReviewPriority, type EnglishPlacement, type VocabularyTier } from './gradeAwareLearningPolicy.ts';

export const ANIMAL_MEADOW_WORDS = [
  { id: 'cat', tr: 'Kedi', emoji: '🐱', habitat: 'Yumuşak minder', place: 'Ev', audio: '/audio/en/animals/cat.wav', image: '/assets/animals/fluent-3d/cat.png' },
  { id: 'dog', tr: 'Köpek', emoji: '🐶', habitat: 'Köpek kulübesi', place: 'Bahçe', audio: '/audio/en/animals/dog.wav', image: '/assets/animals/fluent-3d/dog.png' },
  { id: 'bird', tr: 'Kuş', emoji: '🐦', habitat: 'Ağaç dalı', place: 'Ağaç', audio: '/audio/en/animals/bird.wav', image: '/assets/animals/fluent-3d/bird.png' },
  { id: 'rabbit', tr: 'Tavşan', emoji: '🐰', habitat: 'Havuçlu yuva', place: 'Çayır', audio: '/audio/en/animals/rabbit.wav', image: '/assets/animals/fluent-3d/rabbit.png' },
  { id: 'cow', tr: 'İnek', emoji: '🐮', habitat: 'Çiftlik ahırı', place: 'Çiftlik', audio: null, image: '/assets/animals/fluent-3d/cow.png' },
  { id: 'fish', tr: 'Balık', emoji: '🐟', habitat: 'Su altı', place: 'Gölet', audio: null, image: '/assets/animals/fluent-3d/fish.png' },
  { id: 'horse', tr: 'At', emoji: '🐴', habitat: 'At ahırı', place: 'Çiftlik', audio: null, image: '/assets/animals/fluent-3d/horse.png' },
  { id: 'duck', tr: 'Ördek', emoji: '🦆', habitat: 'Sazlıklı gölet', place: 'Gölet', audio: null, image: '/assets/animals/fluent-3d/duck.png' },
  { id: 'sheep', tr: 'Koyun', emoji: '🐑', habitat: 'Otlayan sürü', place: 'Çayır', audio: null, image: '/assets/animals/fluent-3d/sheep.png' },
  { id: 'frog', tr: 'Kurbağa', emoji: '🐸', habitat: 'Nilüfer yaprağı', place: 'Gölet', audio: null, image: '/assets/animals/fluent-3d/frog.png' },
  { id: 'bee', tr: 'Arı', emoji: '🐝', habitat: 'Bal peteği', place: 'Çiçeklik', audio: null, image: '/assets/animals/fluent-3d/bee.png' },
  { id: 'butterfly', tr: 'Kelebek', emoji: '🦋', habitat: 'Çiçek bahçesi', place: 'Çiçeklik', audio: null, image: '/assets/animals/fluent-3d/butterfly.png' },
  { id: 'lion', tr: 'Aslan', emoji: '🦁', habitat: 'Savan gölgesi', place: 'Savan', audio: null, image: '/assets/animals/fluent-3d/lion.png' },
  { id: 'elephant', tr: 'Fil', emoji: '🐘', habitat: 'Nehir kenarı', place: 'Savan', audio: null, image: '/assets/animals/fluent-3d/elephant.png' },
  { id: 'monkey', tr: 'Maymun', emoji: '🐒', habitat: 'Orman ağacı', place: 'Orman', audio: null, image: '/assets/animals/fluent-3d/monkey.png' },
  { id: 'penguin', tr: 'Penguen', emoji: '🐧', habitat: 'Buz kıyısı', place: 'Kutup', audio: null, image: '/assets/animals/fluent-3d/penguin.png' },
  { id: 'turtle', tr: 'Kaplumbağa', emoji: '🐢', habitat: 'Sahil kumu', place: 'Sahil', audio: null, image: '/assets/animals/fluent-3d/turtle.png' },
  { id: 'fox', tr: 'Tilki', emoji: '🦊', habitat: 'Orman ini', place: 'Orman', audio: null, image: '/assets/animals/fluent-3d/fox.png' },
  { id: 'bear', tr: 'Ayı', emoji: '🐻', habitat: 'Dağ mağarası', place: 'Dağ', audio: null, image: '/assets/animals/fluent-3d/bear.png' },
  { id: 'owl', tr: 'Baykuş', emoji: '🦉', habitat: 'Ağaç kovuğu', place: 'Orman', audio: null, image: '/assets/animals/fluent-3d/owl.png' },
  { id: 'zebra', tr: 'Zebra', emoji: '🦓', habitat: 'Savan çayırı', place: 'Savan', audio: null, image: '/assets/animals/fluent-3d/zebra.png' },
  { id: 'giraffe', tr: 'Zürafa', emoji: '🦒', habitat: 'Akasya ağacı', place: 'Savan', audio: null, image: '/assets/animals/fluent-3d/giraffe.png' },
  { id: 'panda', tr: 'Panda', emoji: '🐼', habitat: 'Bambu ormanı', place: 'Orman', audio: null, image: '/assets/animals/fluent-3d/panda.png' },
  { id: 'tiger', tr: 'Kaplan', emoji: '🐯', habitat: 'Orman inisi', place: 'Orman', audio: null, image: '/assets/animals/fluent-3d/tiger.png' },
  { id: 'crocodile', tr: 'Timsah', emoji: '🐊', habitat: 'Nehir kıyısı', place: 'Nehir', audio: null, image: '/assets/animals/fluent-3d/crocodile.png' },
  { id: 'hippo', tr: 'Su aygırı', emoji: '🦛', habitat: 'Nehir gölü', place: 'Nehir', audio: null, image: '/assets/animals/fluent-3d/hippo.png' },
  { id: 'rhino', tr: 'Gergedan', emoji: '🦏', habitat: 'Savan gölgesi', place: 'Savan', audio: null, image: '/assets/animals/fluent-3d/rhino.png' },
  { id: 'kangaroo', tr: 'Kanguru', emoji: '🦘', habitat: 'Otlak', place: 'Otlak', audio: null, image: '/assets/animals/fluent-3d/kangaroo.png' },
  { id: 'koala', tr: 'Koala', emoji: '🐨', habitat: 'Okaliptüs ağacı', place: 'Orman', audio: null, image: '/assets/animals/fluent-3d/koala.png' },
  { id: 'deer', tr: 'Geyik', emoji: '🦌', habitat: 'Orman açıklığı', place: 'Orman', audio: null, image: '/assets/animals/fluent-3d/deer.png' },
  { id: 'wolf', tr: 'Kurt', emoji: '🐺', habitat: 'Dağ patikası', place: 'Dağ', audio: null, image: '/assets/animals/fluent-3d/wolf.png' },
  { id: 'hedgehog', tr: 'Kirpi', emoji: '🦔', habitat: 'Yaprak yuvası', place: 'Orman', audio: null, image: '/assets/animals/fluent-3d/hedgehog.png' },
  { id: 'squirrel', tr: 'Sincap', emoji: '🐿️', habitat: 'Ağaç kovuğu', place: 'Orman', audio: null, image: '/assets/animals/fluent-3d/squirrel.png' },
  { id: 'snake', tr: 'Yılan', emoji: '🐍', habitat: 'Taş gölgesi', place: 'Çayır', audio: null, image: '/assets/animals/fluent-3d/snake.png' },
  { id: 'dolphin', tr: 'Yunus', emoji: '🐬', habitat: 'Deniz koyu', place: 'Deniz', audio: null, image: '/assets/animals/fluent-3d/dolphin.png' },
  { id: 'whale', tr: 'Balina', emoji: '🐳', habitat: 'Açık deniz', place: 'Deniz', audio: null, image: '/assets/animals/fluent-3d/whale.png' },
  { id: 'shark', tr: 'Köpek balığı', emoji: '🦈', habitat: 'Derin deniz', place: 'Deniz', audio: null, image: '/assets/animals/fluent-3d/shark.png' },
  { id: 'octopus', tr: 'Ahtapot', emoji: '🐙', habitat: 'Mercan yuvası', place: 'Deniz', audio: null, image: '/assets/animals/fluent-3d/octopus.png' },
  { id: 'crab', tr: 'Yengeç', emoji: '🦀', habitat: 'Kum sahili', place: 'Sahil', audio: null, image: '/assets/animals/fluent-3d/crab.png' },
  { id: 'parrot', tr: 'Papağan', emoji: '🦜', habitat: 'Tropik ağaç', place: 'Orman', audio: null, image: '/assets/animals/fluent-3d/parrot.png' }
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

/** Every vocabulary item receives an explicit pedagogical tier; adding a new
 * animal requires a deliberate tier classification rather than falling into
 * Pre-A1 by default. These are Ventra's tiers, not formal CEFR approvals. */
export const ANIMAL_VOCAB_TIERS:Readonly<Record<AnimalId,VocabularyTier>>={
 cat:0,dog:0,bird:0,rabbit:0,cow:0,fish:0,horse:0,duck:0,sheep:0,frog:0,
 bee:0,butterfly:0,lion:0,elephant:0,monkey:0,penguin:0,
 turtle:1,fox:1,bear:1,owl:1,zebra:1,giraffe:1,panda:1,tiger:1,
 crocodile:1,hippo:1,rhino:1,kangaroo:1,koala:1,deer:1,
 wolf:2,hedgehog:2,squirrel:2,snake:2,dolphin:2,whale:2,shark:2,
 octopus:2,crab:2,parrot:2
};
export function eligibleAnimalWords(gradeLevel:number|null|undefined,englishLevel:EnglishPlacement):AnimalWord[]{
 const tier=resolveVocabularyTier(gradeLevel,englishLevel);
 return ANIMAL_MEADOW_WORDS.filter(word=>ANIMAL_VOCAB_TIERS[word.id]<=tier);
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
  gradeLevel?:number|null;
  englishLevel?:EnglishPlacement;
}): PlannedAnimalMission {
  const rnd = rndGenerator(input.seed);
  const policy=resolveGradeAwarePolicy({domain:'animals',gradeLevel:input.gradeLevel,englishLevel:input.englishLevel??'Pre-A1'});
  const all: AnimalId[] = eligibleAnimalWords(input.gradeLevel,input.englishLevel??'Pre-A1').map(item => item.id);
  const seen = new Set(input.history.filter(item => item.kind === 'discovery').map(item => item.wordId));
  const weak = new Set<string>(getWeakAnimalIds(input.history).filter(id=>all.includes(id)));
  const mistakes = new Map<string,number>();
  for (const row of input.history.filter(item => item.kind !== 'discovery').slice(-80)) {
    mistakes.set(row.wordId, (mistakes.get(row.wordId)||0)+Math.max(0,row.mistakes));
  }
  const learning = getLearningSnapshot({
    animalAnswers:input.history,colorAnswers:[],animalWords:all,colorWords:[],
    now:input.now??new Date().toISOString()
  });
  const targetSkill = input.mission===2?'recognition':
    input.mission===3?'listening':'command';
  const due = new Set<string>(all.filter(id=>needsReview(learning,'animals',targetSkill,id)));
  const weight = (id: string) => weak.has(id) ? Math.min(12,5+(mistakes.get(id)||0)) :
    due.has(id)?6:2;
  if (input.mission === 1) {
    const pool = input.history.length === 0 ? STARTERS : all;
    // Eight per round, with at least six fresh animals while they exist.
    // Never quiz unseen vocabulary: new animals enter the assessment pool
    // only after an actual discovery event is persisted.
    const unseen = shuffleWeighted(pool.filter(id => !seen.has(id)), () => 1, rnd);
    const fresh = unseen.slice(0, Math.min(policy.discoveryCount===6?4:6, unseen.length));
    const rest = shuffleWeighted(pool.filter(id => !fresh.includes(id)), weight, rnd)
      .slice(0, policy.discoveryCount - fresh.length);
    return { mission: 1, animals: shuffleWeighted([...fresh,...rest], () => 1, rnd),
      questions: [], reviewIds: [], seed: input.seed };
  }
  const encountered = all.filter(id => seen.has(id));
  const allowed = encountered.length >= 3 ? encountered : STARTERS; // legacy players
  const count = Math.min(policy.questionCount, allowed.length);
  const review = shuffleWeighted(allowed.filter(id => weak.has(id)), weight, rnd).slice(0, 2);
  const dueTargets = shuffleWeighted(allowed.filter(id => due.has(id) && !review.includes(id)),weight,rnd)
    .slice(0,Math.min(2,count-review.length));
  const ordinary = [
    ...dueTargets,
    ...shuffleWeighted(gradeAwareReviewPriority(learning,'animals',targetSkill,allowed)
      .filter((id): id is AnimalId => !review.includes(id as AnimalId) && !dueTargets.includes(id as AnimalId)),weight,rnd)
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
    const others = shuffleWeighted(allowed.filter(id => id !== target),()=>1,rnd).slice(0,policy.choiceCount-1);
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
    case 5: return { title:'Help the '+word.id+'!',guide:'İngilizce yönergeyi dinle, hayvanı seç ve kurtar.',speech:'Help the '+word.id };
    default: return { title:word.id.toUpperCase(),guide:word.tr,speech:word.id };
  }
}

/** Consistent visible + spoken commands for the three language placements.
 * School grade limits sentence length without upgrading actual placement. */
export function animalCommandFor(word:AnimalWord,level:EnglishPlacement,grade:number|null|undefined):string {
 if(level==='Pre-A1')return 'Find the '+word.id+'!';
 if(level==='A1')return 'Can you find the '+word.id+'?';
 if(grade!=null&&grade>=1&&grade<=2)return 'Find the '+word.id+', please.';
 return 'Please find the '+word.id+' in the meadow.';
}

/** The rescue mini-adventure tests listening to an English command, not
 * factual knowledge of an animal's habitat. Do not record it as 'habitat'.
 * Existing historical habitat events remain readable in user progress. */
export function animalRescueCommandFor(word:AnimalWord,level:EnglishPlacement,grade:number|null|undefined):string{
 if(level==='Pre-A1')return 'Help the '+word.id+'!';
 if(level==='A1'||(grade!==null&&grade!==undefined&&grade<=2))
  return 'Can you help the '+word.id+'?';
 return 'Please help the '+word.id+' get home!';
}
