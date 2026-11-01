/** Sayı Vadisi: deterministic, offline-first English number mission planner.
 * Selected English level controls initial content, never claims measured mastery.
 * No quiz can use vocabulary absent from persisted discovery evidence.
 */
import {getLearningSnapshot,needsReview} from './adaptiveLearningEngine.ts';
import {resolveGradeAwarePolicy,gradeAwareReviewPriority,type EnglishPlacement} from './gradeAwareLearningPolicy.ts';

export const NUMBER_WORDS = [
  'zero','one','two','three','four','five','six','seven','eight','nine',
  'ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen',
  'seventeen','eighteen','nineteen','twenty'
] as const;
export type NumberStage = 1 | 2 | 3 | 4 | 5;
export type NumberSkill = 'recognition' | 'quantity' | 'listening' | 'application';
export type NumberEvidence = {
  value: number;
  kind: 'discovery' | NumberSkill;
  mistakes: number;
  firstTryCorrect: boolean;
  timestamp: string;
  hintUsed?: boolean;
};
export type NumberQuestion = {
  target: number;
  choices: number[];
  skill: NumberSkill;
};
export type NumberMissionPlan = {
  mission: NumberStage;
  discoveries: number[];
  questions: NumberQuestion[];
  reviewValues: number[];
  seed: number;
};
export function englishNumber(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 20) throw new RangeError('Sayı 0–20 aralığında olmalı.');
  return NUMBER_WORDS[value];
}
function generator(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state,1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const output = [...items];
  for (let i=output.length-1;i>0;i--) {
    const j = Math.floor(random() * (i+1));
    [output[i],output[j]] = [output[j],output[i]];
  }
  return output;
}
export function weakNumberValues(history: readonly NumberEvidence[]): number[] {
  const evidence = [...history].filter(e =>
    e.kind !== 'discovery' && Number.isInteger(e.value) && e.value>=1 && e.value<=20
  ).sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
  const state = new Map<number,{needs:number; clean:number}>();
  for (const row of evidence) {
    const current=state.get(row.value) ?? {needs:0,clean:0};
    if (row.mistakes>0 || !row.firstTryCorrect || row.hintUsed) {
      current.needs=1;current.clean=0;
    } else if (current.needs>0) {
      current.clean+=1;
      if (current.clean>=2)current.needs=0;
    }
    state.set(row.value,current);
  }
  return [...state.entries()].filter(([,v])=>v.needs>0).map(([id])=>id).sort((a,b)=>a-b);
}
export function planNumberMission(input:{
  mission:NumberStage;
  seed:number;
  englishLevel:EnglishPlacement;
  gradeLevel?:number|null;
  now?:string;
  history:readonly NumberEvidence[];
}):NumberMissionPlan {
  const {mission,seed,history}=input;
  if (!Number.isInteger(mission) || mission<1 || mission>5)throw new RangeError('Geçersiz Sayı Vadisi görevi.');
  const rand=generator(seed);
  const policy=resolveGradeAwarePolicy({domain:'numbers',gradeLevel:input.gradeLevel,englishLevel:input.englishLevel});
  const max=policy.maxNumber;
  const all=Array.from({length:max},(_,i)=>i+1);
  const encountered=new Set(history.filter(e=>e.kind==='discovery' && all.includes(e.value)).map(e=>e.value));
  const weak=new Set(weakNumberValues(history));
  const learning=getLearningSnapshot({
    animalAnswers:[],colorAnswers:[],animalWords:[],colorWords:[],
    numberAnswers:history,numberWords:all.map(String),
    now:input.now??new Date().toISOString()
  });
  if (mission===1) {
    const fresh=encountered.size===0 ? all.slice(0,policy.discoveryCount) :
      shuffle(all.filter(n=>!encountered.has(n)),rand).slice(0,policy.discoveryCount===6?4:6);
    const remaining=all.filter(n=>!fresh.includes(n)).sort((x,y)=>
      Number(weak.has(y))-Number(weak.has(x)));
    const rest=shuffle(remaining,rand).slice(0,policy.discoveryCount-fresh.length);
    return {mission,seed,discoveries:shuffle([...fresh,...rest],rand),questions:[],reviewValues:[]};
  }
  const skill:NumberSkill=mission===2?'recognition':mission===3?'quantity':
    mission===4?'listening':'application';
  const available=all.filter(n=>encountered.has(n) && ((mission===3 || mission===5)?n<=12:true));
  // A quiz before discovery is an invalid state, not permission to test unseen words.
  if (available.length<3)return {mission,seed,discoveries:[],questions:[],reviewValues:[]};
  const review=shuffle(available.filter(n=>weak.has(n)),rand).slice(0,2);
  const due=shuffle(available.filter(n=>!review.includes(n)&&
    needsReview(learning,'numbers',skill,String(n))),rand)
    .slice(0,Math.min(2,policy.questionCount-review.length));
  const ranked=gradeAwareReviewPriority(learning,'numbers',skill,available.map(String)).map(Number);
  const targets=[...due,...shuffle(ranked.filter(n=>!review.includes(n)&&!due.includes(n)),rand)
    .slice(0,Math.max(0,policy.questionCount-review.length-due.length))];
  const sequence=shuffle([...review,...targets],rand);
  // Distribute a second encounter of missed words with >=2 questions between both sightings.
  for (const n of review) {
    const first=sequence.indexOf(n);
    const position=first<3?Math.min(sequence.length,first+3):Math.max(0,first-3);
    sequence.splice(position,0,n);
  }
  const questions=sequence.map(target=>{
    const alternatives=shuffle(available.filter(n=>n!==target),rand).slice(0,policy.choiceCount-1);
    return {target,skill,choices:shuffle([target,...alternatives],rand)};
  });
  return {mission,seed,discoveries:[],questions,reviewValues:review};
}
