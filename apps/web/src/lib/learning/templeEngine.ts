import type {TempleAnswerEvidence,AnimalAnswerEvidence,ColorAnswerEvidence,FoodAnswerEvidence,FamilyAnswerEvidence,NumberAnswerEvidence} from '@ventra/shared';
import {resolveVocabularyTier,type EnglishPlacement} from './gradeAwareLearningPolicy.ts';
import {ANIMAL_MEADOW_WORDS,ANIMAL_VOCAB_TIERS} from './animalMissionEngine.ts';
import {COLOR_GROVE_WORDS} from '../progress/colorGroveProgress.ts';
import {MARKET_WORDS,marketNounPhrase} from './foodMarketEngine.ts';
import {VILLAGE_WORDS} from './familyVillageEngine.ts';
import {englishNumber} from './numberValleyEngine.ts';

export type TempleDomain='animals'|'colors'|'numbers'|'food'|'family';
export type TempleChamber='rune'|'echo'|'feast'|'home'|'crown';
export type TempleStage=1|2|3|4|5;
export type TempleSkill='discovery'|'recognition'|'listening'|'context'|'sentence'|'sequence';
export type TempleWord={id:string;en:string;tr:string;icon:string;domain:TempleDomain;
  color?:string;image?:string;tier:0|1|2;context:string};
export type TempleQuestion={
  target:string;options:string[];prompt:string;audio:string;
  /** Five-stage speech/story challenge; exact tokens are displayed only after attempting. */
  sentenceTokens?:string[];sentenceAnswer?:string[];
  pair?:number;
};
export type TemplePlan={chamber:TempleChamber;stage:TempleStage;words:string[];questions:TempleQuestion[]};

export const TEMPLE_CHAMBERS=[
 {id:'rune',title:'Rün Ormanı',subtitle:'Animals & Colours',icon:'🌿',tone:'#9bdfbb'},
 {id:'echo',title:'Yankı Galerisi',subtitle:'Numbers & Listening',icon:'🔮',tone:'#9acfe8'},
 {id:'feast',title:'Bereket Salonu',subtitle:'Food & Requests',icon:'🍓',tone:'#eacb9d'},
 {id:'home',title:'Hatıra Odaları',subtitle:'Home & Family',icon:'🏡',tone:'#e9b9d6'},
 {id:'crown',title:'Kristal Taht',subtitle:'The Great English Finale',icon:'👑',tone:'#e5dba4'}
] as const;
export const TEMPLE_STAGES=[
 {stage:1,title:'Kayıp Rünler',icon:'🗺️',kind:'discovery',desc:'Sembolleri keşfet, İngilizce anlamlarını dinle.'},
 {stage:2,title:'Gizemli Yazıt',icon:'🔤',kind:'recognition',desc:'İpucundan doğru İngilizce kelimeyi bul.'},
 {stage:3,title:'Yankı Kristalleri',icon:'🎧',kind:'listening',desc:'Sesi dinleyerek doğru kristale dokun.'},
 {stage:4,title:'Cümle Köprüsü',icon:'🧩',kind:'sentence',desc:'İngilizce cümleyi kelime kelime tamamla.'},
 {stage:5,title:'Mühür Kapısı',icon:'🔐',kind:'sequence',desc:'İki parçalı İngilizce şifreyi sırayla çöz.'}
] as const;
export const TEMPLE_GAME_ID='island_word_garden_temple';
export const TEMPLE_TOTAL=25;
export const TEMPLE_OFFSETS:Record<TempleChamber,number>={rune:0,echo:5,feast:10,home:15,crown:20};
export const TEMPLE_KINDS=['discovery','recognition','listening','sentence','sequence'] as const;
const numAnchors=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,25,30,40,50,60,70,80,90,100,125,200,350,500,750,1000];
const numberWords:TempleWord[]=numAnchors.map((n,i)=>({
 id:'numbers:'+n,en:englishNumber(n),tr:String(n),icon:String(n),domain:'numbers',tier:(n<=10?0:n<=100?1:2) as 0|1|2,
 context:`Find the number ${englishNumber(n)}.`
}));
export const TEMPLE_WORDS:readonly TempleWord[]=[
 ...ANIMAL_MEADOW_WORDS.map((w,i)=>({id:'animals:'+w.id,en:w.id,tr:w.tr,icon:w.emoji,image:w.image,domain:'animals' as const,
 tier:ANIMAL_VOCAB_TIERS[w.id],context:`Find the ${w.id}.`})),
 ...COLOR_GROVE_WORDS.map((w,i)=>({id:'colors:'+w.id,en:w.id,tr:w.tr,icon:'◆',color:w.hex,domain:'colors' as const,
 tier:('tier' in w ? w.tier : 0) as 0|1|2,context:`Find the ${w.id} crystal.`})),
 ...numberWords,
 ...MARKET_WORDS.map(w=>({id:'food:'+w.id,en:w.id,tr:w.tr,icon:w.icon,domain:'food' as const,
 tier:w.tier,context:`Find the ${w.id}.`})),
 ...VILLAGE_WORDS.map(w=>({id:'family:'+w.id,en:w.id,tr:w.tr,icon:w.icon,domain:'family' as const,
 tier:w.tier,context:w.command}))
];
export function templeWord(id:string):TempleWord{
 const word=TEMPLE_WORDS.find(w=>w.id===id);
 if(!word)throw Error('Unknown temple word: '+id);
 return word;
}
const CHAMBER_DOMAINS:Record<TempleChamber,readonly TempleDomain[]>={
 rune:['animals','colors'],echo:['numbers','colors'],feast:['food','colors'],
 home:['family','animals'],crown:['animals','colors','numbers','food','family']
};
export function templeAllowedWords(chamber:TempleChamber,gradeLevel:number|null|undefined,englishLevel:EnglishPlacement):TempleWord[]{
 const max=resolveVocabularyTier(gradeLevel,englishLevel);
 return TEMPLE_WORDS.filter(w=>CHAMBER_DOMAINS[chamber].includes(w.domain)&&w.tier<=max);
}
export function templeResumePoint(completed:Record<TempleChamber,number>){
 const c=(TEMPLE_CHAMBERS.find(w=>completed[w.id]<5)??TEMPLE_CHAMBERS[4]).id;
 return {chamber:c,stage:Math.min(5,completed[c]+1) as TempleStage};
}
function rngFor(seed:number){let state=seed>>>0;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
function shuffle<T>(values:readonly T[],random:()=>number):T[]{
 const a=[...values];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
}
export type TemplePriorEvidence={
 animals:readonly AnimalAnswerEvidence[];
 colors:readonly ColorAnswerEvidence[];
 numbers:readonly NumberAnswerEvidence[];
 food:readonly FoodAnswerEvidence[];
 family:readonly FamilyAnswerEvidence[];
};
export function templeWeakWords(prior:TemplePriorEvidence):Set<string>{
 const out=new Set<string>();
 for(const [domain,rows] of [
  ['animals',prior.animals],['colors',prior.colors],['food',prior.food],['family',prior.family]
 ] as const)for(const row of rows){
  if(row.kind==='discovery')continue;
  if(row.mistakes>0||!row.firstTryCorrect||row.hintUsed)out.add(domain+':'+row.wordId);
 }
 for(const row of prior.numbers)if(row.kind!=='discovery'&&(row.mistakes>0||!row.firstTryCorrect||row.hintUsed))
  out.add('numbers:'+row.value);
 return out;
}
export function planTempleMission(input:{chamber:TempleChamber;stage:TempleStage;gradeLevel?:number|null;
 englishLevel:EnglishPlacement;history:readonly TempleAnswerEvidence[];weak?:ReadonlySet<string>;seed:number}):TemplePlan{
 const {chamber,stage,gradeLevel,englishLevel,history,weak,seed}=input;
 if(!TEMPLE_CHAMBERS.some(c=>c.id===chamber)||!TEMPLE_STAGES.some(s=>s.stage===stage)||!Number.isFinite(seed))
  throw Error('Invalid temple mission');
 const random=rngFor(seed),all=templeAllowedWords(chamber,gradeLevel,englishLevel);
 const encountered=new Set(history.filter(h=>h.kind==='discovery').map(h=>h.wordId));
 const known=all.filter(w=>encountered.has(w.id));
 const pool=stage===1?all:known.length>=4?known:all;
 const localWrong=(id:string)=>history.filter(e=>e.wordId===id&&e.kind!=='discovery').slice(-4).reduce((n,e)=>
  n+(e.mistakes>0||e.hintUsed||!e.firstTryCorrect?2:0),0);
 const ordered=shuffle(pool,random).sort((a,b)=>stage===1?
   Number(encountered.has(a.id))-Number(encountered.has(b.id)):
   (localWrong(b.id)+(weak?.has(b.id)?3:0))-(localWrong(a.id)+(weak?.has(a.id)?3:0)));
 const count=gradeLevel!=null&&gradeLevel>=1&&gradeLevel<=2?6:8;
 // Cross-world homonyms must not produce two visually or audibly ambiguous answers
 // (e.g. orange as colour/fruit, fish as animal/food).
 const seenEnglish=new Set<string>(),seenTurkish=new Set<string>();
 const chosen=ordered.filter(w=>{
  const english=w.en.toLowerCase(),turkish=w.tr.toLowerCase();
  if(seenEnglish.has(english)||seenTurkish.has(turkish))return false;
  seenEnglish.add(english);seenTurkish.add(turkish);return true;
 }).slice(0,count);
 const words=chosen.map(w=>w.id);
 if(stage===1)return {chamber,stage,words,questions:[]};
 const rounds=stage===5?6:(gradeLevel!=null&&gradeLevel<=2?4:6);
 const targets=shuffle(Array.from({length:rounds},(_,i)=>chosen[i%chosen.length]),random);
 const questions=targets.map((w,i)=>{
  // Assess earlier discoveries before introducing unfamiliar distractors.
  // Fall back to grade-scoped vocabulary only if unique choices are scarce.
  // Same-label cross-world homonyms must never create two correct options.
  const safe=(other:TempleWord)=>other.id!==w.id&&other.en.toLowerCase()!==w.en.toLowerCase()&&
    other.tr.toLowerCase()!==w.tr.toLowerCase();
  const preferred=shuffle(pool.filter(safe),random);
  const fallback=shuffle(all.filter(safe),random);
  const unique=new Map<string,TempleWord>();
  for(const candidate of [...preferred,...fallback]){
   if([...unique.values()].some(p=>p.en.toLowerCase()===candidate.en.toLowerCase()||
      p.tr.toLowerCase()===candidate.tr.toLowerCase()))continue;
   unique.set(candidate.id,candidate);
   if(unique.size>=2)break;
  }
  const distractors=[...unique.keys()];
  const options=shuffle([w.id,...distractors],random);
  const sentence=sentenceFor(w);
  return {target:w.id,options,prompt:stage===2?w.tr:
    stage===3?'Listen and choose':stage===4?'Build this English sentence':w.context,
    audio:stage===3?w.en:stage===5?w.context:sentence.join(' '),
    ...(stage===4?{sentenceTokens:shuffle(sentence,random),sentenceAnswer:sentence}:{}),
    ...(stage===5?{pair:Math.floor(i/2)}:{})};
 });
 return {chamber,stage,words,questions};
}
const VOWEL=/^[aeiou]/i;
const FAMILY_MEMBERS=new Set(['mother','father','sister','brother','baby','grandmother','grandfather','family',
 'aunt','uncle','cousin','parents','daughter','son','grandchild']);
const DAILY_ACTIONS=new Set(['wake up','brush my teeth','wash my face','get dressed','eat breakfast','go to school',
 'read a book','go to bed','do homework','have lunch','play outside','take a shower','tidy my room','help at home','have dinner']);
/** A phrase for every source-domain concept; always 4+ meaningful reorderable tokens. */
export function sentenceFor(w:TempleWord):string[]{
 if(w.domain==='numbers')return ['I','can','count','to',w.en+'.'];
 if(w.domain==='colors')return ['I','can','see','a',w.en,'crystal.'];
 if(w.domain==='animals')return ['I','can','see',VOWEL.test(w.en)?'an':'a',w.en+'.'];
 if(w.domain==='food')return ['I','would','like',...marketNounPhrase(w.en).split(' ').map((token,i,a)=>
   i===a.length-1?token+'.':token)];
 if(DAILY_ACTIONS.has(w.en))return ['Every','day,','I',...w.en.split(' ').map((x,i,a)=>i===a.length-1?x+'.':x)];
 if(w.en==='stairs')return ['These','are','the','stairs.'];
 if(w.en==='parents')return ['These','are','my','parents.'];
 if(FAMILY_MEMBERS.has(w.en))return ['This','is','my',w.en+'.'];
 return ['This','is','the',w.en+'.'];
}
/** Three-star mastery requires zero mistakes AND zero assistance.
 * Discovery measures exposure, not independent language proficiency. */
export function templeMissionStars(mistakes:number,proof:readonly TempleAnswerEvidence[]):1|2|3{
 const aided=proof.filter(answer=>answer.hintUsed).length;
 return mistakes===0&&aided===0?3:mistakes<=2&&aided<=2?2:1;
}
export function validTempleAnswers(value:unknown):value is TempleAnswerEvidence[]{
 return Array.isArray(value)&&value.every(x=>x&&typeof x.wordId==='string'&&
  TEMPLE_WORDS.some(w=>w.id===x.wordId&&w.domain===x.sourceDomain)&&
  TEMPLE_KINDS.includes(x.kind)&&Number.isInteger(x.mistakes)&&x.mistakes>=0&&
  typeof x.firstTryCorrect==='boolean'&&typeof x.hintUsed==='boolean'&&
  typeof x.timestamp==='string'&&Number.isFinite(Date.parse(x.timestamp)));
}
