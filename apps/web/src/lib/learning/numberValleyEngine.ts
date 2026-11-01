/** Number Valley 1–1000: deterministic, graded English numeral discovery and practice.
 * Bands are gated by actual discovery history; new numerals cannot enter quizzes
 * before an independently persisted discovery event.
 */
import type { NumberAnswerEvidence } from '@ventra/shared';
import {getLearningSnapshot,needsReview} from './adaptiveLearningEngine.ts';
import {resolveGradeAwarePolicy,gradeAwareReviewPriority,type EnglishPlacement} from './gradeAwareLearningPolicy.ts';

export const NUMBER_WORDS = [
  'zero','one','two','three','four','five','six','seven','eight','nine',
  'ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen',
  'seventeen','eighteen','nineteen','twenty'
] as const;
const DECADES=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'] as const;
export const MAX_NUMBER=1000;
export type NumberBand='ones'|'tens'|'hundreds';
export const NUMBER_BANDS:ReadonlyArray<{id:NumberBand;title:string;range:string;minimum:number}>= [
  {id:'ones',title:'Kristal Patikası',range:'1–20',minimum:1},
  {id:'tens',title:'Onluklar Geçidi',range:'21–100',minimum:100},
  {id:'hundreds',title:'Binlikler Zirvesi',range:'101–1000',minimum:1000}
];
export type NumberStage = 1|2|3|4|5;
export type NumberSkill = 'recognition'|'quantity'|'listening'|'application';
export type NumberEvidence = NumberAnswerEvidence;
export type NumberQuestion={target:number;choices:number[];skill:NumberSkill};
export type NumberMissionPlan={
  mission:NumberStage;
  band:NumberBand;
  discoveries:number[];
  questions:NumberQuestion[];
  reviewValues:number[];
  seed:number;
};
export function englishNumber(value:number):string{
  if(!Number.isInteger(value)||value<0||value>MAX_NUMBER)
    throw new RangeError('Number Valley supports integers between 0 and 1000.');
  if(value<=20)return NUMBER_WORDS[value];
  if(value<100){
    const ten=DECADES[Math.floor(value/10)];
    const rest=value%10;
    return rest===0?ten:`${ten}-${NUMBER_WORDS[rest]}`;
  }
  if(value===1000)return 'one thousand';
  const hundreds=Math.floor(value/100);
  const rest=value%100;
  return rest===0?`${NUMBER_WORDS[hundreds]} hundred`:
    `${NUMBER_WORDS[hundreds]} hundred ${englishNumber(rest)}`;
}
function generator(seed:number):()=>number{
  let state=seed>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
function shuffle<T>(items:readonly T[],random:()=>number):T[]{
  const result=[...items];
  for(let i=result.length-1;i>0;i--){
    const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
export function weakNumberValues(history:readonly NumberEvidence[]):number[]{
  const evidence=[...history].filter(e=>e.kind!=='discovery'&&
    Number.isInteger(e.value)&&e.value>=1&&e.value<=MAX_NUMBER&&
    Number.isFinite(Date.parse(e.timestamp))).sort((a,b)=>Date.parse(a.timestamp)-Date.parse(b.timestamp));
  const state=new Map<number,{needs:number;clean:number}>();
  for(const row of evidence){
    const current=state.get(row.value)??{needs:0,clean:0};
    if(row.mistakes>0||!row.firstTryCorrect||row.hintUsed){current.needs=1;current.clean=0;}
    else if(current.needs>0){current.clean++;if(current.clean>=2)current.needs=0;}
    state.set(row.value,current);
  }
  return [...state.entries()].filter(([,v])=>v.needs>0).map(([n])=>n).sort((a,b)=>a-b);
}
/** Three separate lesson paths; higher English ability alone never unlocks a band. */
export function unlockedNumberBands(max:number,history:readonly NumberEvidence[]):NumberBand[]{
  const values=new Set(history.filter(x=>x.kind==='discovery'&&
    Number.isInteger(x.value)&&x.value>=1&&x.value<=MAX_NUMBER).map(x=>x.value));
  const bands:NumberBand[]=['ones'];
  if(max>=100&&[...values].filter(v=>v<=20).length>=8)bands.push('tens');
  if(max>=1000&&[...values].filter(v=>v>=21&&v<=100).length>=6)bands.push('hundreds');
  return bands;
}
const ANCHORS:Record<NumberBand,readonly number[]>={
  ones:Array.from({length:20},(_,i)=>i+1),
  tens:[21,22,25,30,40,50,60,70,80,90,100,33,45,57,68,79,99],
  hundreds:[101,110,125,150,200,250,300,350,400,450,500,600,700,750,800,900,999,1000]
};
/** A structured entry sequence first, eventually every integer through 1000. */
export function bandNumberPool(band:NumberBand,max:number):number[]{
  const min=band==='ones'?1:band==='tens'?21:101;
  const cap=Math.min(max,band==='ones'?20:band==='tens'?100:1000);
  if(cap<min)return [];
  const all=Array.from({length:cap-min+1},(_,i)=>i+min);
  const anchors=ANCHORS[band].filter(n=>n>=min&&n<=cap);
  return [...anchors,...all.filter(n=>!anchors.includes(n))];
}
export function planNumberMission(input:{
  mission:NumberStage;seed:number;englishLevel:EnglishPlacement;
  gradeLevel?:number|null;band?:NumberBand;now?:string;history:readonly NumberEvidence[];
}):NumberMissionPlan{
  const {mission,seed,history}=input;
  if(!Number.isInteger(mission)||mission<1||mission>5)throw new RangeError('Invalid mission.');
  const rand=generator(seed);
  const policy=resolveGradeAwarePolicy({domain:'numbers',gradeLevel:input.gradeLevel,englishLevel:input.englishLevel});
  const band=input.band??'ones';
  if(!NUMBER_BANDS.some(x=>x.id===band)||
      !unlockedNumberBands(policy.maxNumber,history).includes(band))
    throw new RangeError('Number path is locked or unavailable for this learner.');
  const all=bandNumberPool(band,policy.maxNumber);
  const encountered=new Set(history.filter(e=>e.kind==='discovery'&&all.includes(e.value)).map(e=>e.value));
  const weak=new Set(weakNumberValues(history));
  if(mission===1){
    const freshLimit=policy.discoveryCount===6?4:6;
    const unseen=all.filter(n=>!encountered.has(n));
    // Teach anchor numerals before random compounds, then mix discoveries on replay.
    const first=history.length===0&&band==='ones'?
      all.slice(0,policy.discoveryCount):
      unseen.length?unseen.slice(0,freshLimit):[];
    const rest=shuffle(all.filter(n=>!first.includes(n)).sort((x,y)=>
      Number(weak.has(y))-Number(weak.has(x))),rand).slice(0,policy.discoveryCount-first.length);
    return {mission,band,seed,discoveries:shuffle([...first,...rest],rand),questions:[],reviewValues:[]};
  }
  const skill:NumberSkill=mission===2?'recognition':mission===3?'quantity':
    mission===4?'listening':'application';
  const available=all.filter(n=>encountered.has(n));
  if(available.length<3)return {mission,band,seed,discoveries:[],questions:[],reviewValues:[]};
  const learning=getLearningSnapshot({
    animalAnswers:[],colorAnswers:[],animalWords:[],colorWords:[],
    numberAnswers:history,numberWords:available.map(String),
    now:input.now??new Date().toISOString()
  });
  const review=shuffle(available.filter(n=>weak.has(n)),rand).slice(0,2);
  const due=shuffle(available.filter(n=>!review.includes(n)&&
    needsReview(learning,'numbers',skill,String(n))),rand)
    .slice(0,Math.min(2,policy.questionCount-review.length));
  const ranked=gradeAwareReviewPriority(learning,'numbers',skill,available.map(String)).map(Number);
  const targets=[...due,...shuffle(ranked.filter(n=>!review.includes(n)&&!due.includes(n)),rand)
    .slice(0,Math.max(0,policy.questionCount-review.length-due.length))];
  const sequence=shuffle([...review,...targets],rand);
  for(const n of review){
    const first=sequence.indexOf(n),position=first<3?Math.min(sequence.length,first+3):Math.max(0,first-3);
    sequence.splice(position,0,n);
  }
  const questions=sequence.map(target=>{
    // Only discovered vocabulary is used as a distractor; keep adjacent values
    // in the same magnitude whenever possible.
    const competitors=available.filter(n=>n!==target)
      .sort((a,b)=>Math.abs(a-target)-Math.abs(b-target)||a-b);
    const alternatives=shuffle(competitors.slice(0,Math.max(6,policy.choiceCount*2)),rand)
      .slice(0,policy.choiceCount-1);
    return {target,skill,choices:shuffle([target,...alternatives],rand)};
  });
  return {mission,band,seed,discoveries:[],questions,reviewValues:review};
}
