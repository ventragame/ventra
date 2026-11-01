import type { AnimalAnswerEvidence, ColorAnswerEvidence } from '@ventra/shared';

/** P3 v1: deterministic, explainable and fully offline learning analytics. */
export type LearningDomain = 'animals' | 'colors' | 'numbers';
export type LearningSkill = 'recognition' | 'listening' | 'command' | 'habitat' | 'application' | 'quantity';
export type LearningStatus = 'unseen' | 'exposed' | 'practicing' | 'review_due' | 'progressing';
/** Numeric evidence uses the same P3 clock and independence rules as vocabulary. */
export interface NumberLearningEvidence {
  value:number;
  kind:'discovery'|'recognition'|'quantity'|'listening'|'application';
  mistakes:number;
  firstTryCorrect:boolean;
  hintUsed?:boolean;
  timestamp:string;
}
export interface LearningEvidence {
  domain: LearningDomain;
  wordId: string;
  skill: LearningSkill | 'discovery';
  timestamp: string;
  mistakes: number;
  independent: boolean;
}
export interface WordSkillState {
  domain: LearningDomain;
  wordId: string;
  skill: LearningSkill;
  attempts: number;
  independentCorrect: number;
  errors: number;
  streak: number;
  status: LearningStatus;
  lastPracticedAt: string | null;
  dueAt: string | null;
  due: boolean;
  confidence: number; // a heuristic, NOT a psychometrically validated proficiency
}
export interface VocabularyState {
  domain: LearningDomain;
  wordId: string;
  discovered: boolean;
  practiced: boolean;
  due: boolean;
  status: LearningStatus;
  skills: WordSkillState[];
}
export interface LearningSnapshot {
  asOf: string;
  vocabulary: VocabularyState[];
  totalDiscovered: number;
  practicedWords: number;
  dueWords: number;
  progressingWords: number;
  independentAnswers: number;
  assistedAnswers: number;
  domainStats: Record<LearningDomain, { discovered: number; practiced: number; due: number; progressing: number }>;
}
const SKILLS: Record<LearningDomain, readonly LearningSkill[]> = {
  animals: ['recognition', 'listening', 'command', 'habitat'],
  colors: ['recognition', 'application'],
  numbers: ['recognition', 'quantity', 'listening', 'application']
};
const INTERVAL_DAYS = [0, 0.5, 1, 3, 7, 14, 30] as const;
const DAY = 86400000;
const EPOCH = '1970-01-01T00:00:00.000Z';
const validDate = (value: string) => {
  const date = Date.parse(value);
  return Number.isFinite(date) ? date : null;
};
const sanitizeMistakes = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(100, Math.floor(value))) : 0;

/**
 * Do not treat discovery, hinted responses, or muted listening as evidence of
 * independent recall. Legacy color answers default to recognition; older
 * records are still readable and never silently relabeled as application.
 */
export function normalizeLearningEvidence(
  animal: readonly AnimalAnswerEvidence[],
  color: readonly ColorAnswerEvidence[],
  numbers: readonly NumberLearningEvidence[] = []
): LearningEvidence[] {
  const rows: LearningEvidence[] = [];
  for (const item of animal) {
    const t = validDate(item.timestamp);
    if (t === null || !item.wordId || !['discovery',...SKILLS.animals].includes(item.kind)) continue;
    rows.push({
      domain:'animals',wordId:item.wordId,skill:item.kind,
      timestamp:new Date(t).toISOString(),mistakes:sanitizeMistakes(item.mistakes),
      independent:item.kind !== 'discovery' && item.firstTryCorrect === true &&
        item.hintUsed !== true && item.mistakes === 0
    });
  }
  for (const item of color) {
    const t = validDate(item.timestamp);
    if (t === null || !item.wordId || !['discovery','recall'].includes(item.kind)) continue;
    rows.push({
      domain:'colors',wordId:item.wordId,
      skill:item.kind === 'discovery' ? 'discovery' : item.skill === 'application' ? 'application' : 'recognition',
      timestamp:new Date(t).toISOString(),mistakes:sanitizeMistakes(item.mistakes),
      independent:item.kind === 'recall' && item.firstTryCorrect === true &&
        item.hintUsed !== true && item.mistakes === 0
    });
  }
  for (const item of numbers) {
    const t=validDate(item.timestamp);
    if(t===null || !Number.isInteger(item.value) || item.value<1 || item.value>20 ||
       !['discovery',...SKILLS.numbers].includes(item.kind)) continue;
    rows.push({
      domain:'numbers',wordId:String(item.value),skill:item.kind,
      timestamp:new Date(t).toISOString(),mistakes:sanitizeMistakes(item.mistakes),
      independent:item.kind!=='discovery' && item.firstTryCorrect===true &&
        item.hintUsed!==true && item.mistakes===0
    });
  }
  // Stable ordering across repeated cloud event merges, independent of source array order.
  rows.sort((a,b) => a.timestamp.localeCompare(b.timestamp) ||
    a.domain.localeCompare(b.domain) || a.wordId.localeCompare(b.wordId) ||
    a.skill.localeCompare(b.skill) || Number(a.independent)-Number(b.independent) ||
    a.mistakes-b.mistakes);
  return rows;
}

export function deriveSkillState(
  events: readonly LearningEvidence[],
  domain: LearningDomain, wordId: string, skill: LearningSkill, now: string
): WordSkillState {
  const timestamp = validDate(now);
  if (timestamp === null) throw new Error('Geçersiz değerlendirme tarihi.');
  const observations = events.filter(e => e.domain===domain && e.wordId===wordId && e.skill===skill &&
    (validDate(e.timestamp)??Number.POSITIVE_INFINITY) <= timestamp);
  let streak=0, errors=0, independentCorrect=0;
  for (const e of observations) {
    if(e.independent){ streak=Math.min(streak+1,6);independentCorrect++; }
    else { streak=0; errors+=e.mistakes>0?e.mistakes:1; }
  }
  const last=observations[observations.length-1];
  const dueAt=last?new Date((validDate(last.timestamp)??0)+INTERVAL_DAYS[streak]*DAY).toISOString():null;
  const due=dueAt!==null && timestamp>=validDate(dueAt)!;
  const discovered=events.some(e=>e.domain===domain&&e.wordId===wordId&&e.skill==='discovery' &&
    (validDate(e.timestamp)??Number.POSITIVE_INFINITY)<=timestamp);
  let status:LearningStatus='unseen';
  if(observations.length===0)status=discovered?'exposed':'unseen';
  else if(streak>=3 && !due)status='progressing';
  else if(due)status='review_due';
  else status='practicing';
  const confidence=observations.length===0?0:Math.min(1,Math.round(
    100*(0.12+0.15*Math.min(streak,4)+0.08*Math.min(independentCorrect,3)))/100);
  return {domain,wordId,skill,attempts:observations.length,independentCorrect,errors,
    streak,status,lastPracticedAt:last?.timestamp??null,dueAt,due,confidence};
}

export function getLearningSnapshot(args:{
  animalAnswers:readonly AnimalAnswerEvidence[];
  colorAnswers:readonly ColorAnswerEvidence[];
  animalWords:readonly string[];
  colorWords:readonly string[];
  numberAnswers?:readonly NumberLearningEvidence[];
  numberWords?:readonly string[];
  now:string;
}):LearningSnapshot {
  const events=normalizeLearningEvidence(args.animalAnswers,args.colorAnswers,args.numberAnswers??[]);
  const timestamp=validDate(args.now);
  if(timestamp===null)throw new Error('Geçersiz değerlendirme tarihi.');
  const domainStats={
    animals:{discovered:0,practiced:0,due:0,progressing:0},
    colors:{discovered:0,practiced:0,due:0,progressing:0},
    numbers:{discovered:0,practiced:0,due:0,progressing:0}
  };
  const vocabulary:VocabularyState[]=[];
  for(const [domain,words] of [
    ['animals',args.animalWords],['colors',args.colorWords],['numbers',args.numberWords??[]]
  ] as const){
    for(const wordId of [...new Set(words)]){
      const discovered=events.some(e=>e.domain===domain&&e.wordId===wordId&&e.skill==='discovery' &&
        (validDate(e.timestamp)??Number.POSITIVE_INFINITY)<=timestamp);
      const skills=SKILLS[domain].map(skill=>deriveSkillState(events,domain,wordId,skill,args.now));
      const practiced=skills.some(s=>s.attempts>0);
      const due=skills.some(s=>s.due);
      const progressing=skills.some(s=>s.status==='progressing');
      const status:LearningStatus=due?'review_due':progressing?'progressing':practiced?'practicing':discovered?'exposed':'unseen';
      vocabulary.push({domain,wordId,discovered,practiced,due,status,skills});
      if(discovered)domainStats[domain].discovered++;
      if(practiced)domainStats[domain].practiced++;
      if(due)domainStats[domain].due++;
      if(progressing)domainStats[domain].progressing++;
    }
  }
  const relevant=events.filter(e=>e.skill!=='discovery' && validDate(e.timestamp)!<=timestamp);
  return {asOf:args.now,vocabulary,
    totalDiscovered:vocabulary.filter(v=>v.discovered).length,
    practicedWords:vocabulary.filter(v=>v.practiced).length,
    dueWords:vocabulary.filter(v=>v.due).length,
    progressingWords:vocabulary.filter(v=>v.status==='progressing').length,
    independentAnswers:relevant.filter(e=>e.independent).length,
    assistedAnswers:relevant.filter(e=>!e.independent).length,
    domainStats};
}
/** Named mastery recommendations are tied to one skill, not generic global stars. */
export function rankVocabularyForMission(
  snapshot:LearningSnapshot,domain:LearningDomain,skill:LearningSkill,eligible:readonly string[]
):string[] {
  const order=new Map(eligible.map((id,i)=>[id,i]));
  return snapshot.vocabulary.filter(v=>v.domain===domain && order.has(v.wordId))
    .sort((a,b)=>{
      const sa=a.skills.find(x=>x.skill===skill);
      const sb=b.skills.find(x=>x.skill===skill);
      const score=(s:WordSkillState|undefined)=>!s?0:s.due?1000+s.errors*4:
        s.attempts===0?400:Math.max(1,300-s.streak*30);
      return score(sb)-score(sa) || (order.get(a.wordId)??0)-(order.get(b.wordId)??0);
    }).map(v=>v.wordId);
}
export function needsReview(snapshot:LearningSnapshot, domain:LearningDomain, skill:LearningSkill, wordId:string):boolean{
  return snapshot.vocabulary.find(x=>x.domain===domain&&x.wordId===wordId)?.skills.some(x=>x.skill===skill&&x.due)??false;
}
