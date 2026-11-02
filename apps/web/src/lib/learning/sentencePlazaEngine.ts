/**
 * Cümle Meydanı · Uyanan Meydan
 * 6 fully playable missions, curriculum-first and reproducible question decks.
 * The scene is the reward for a meaningful English sentence, not a substitute
 * for producing it. Every template is human authored and grammatically checked.
 */
import type {EnglishPlacement} from './gradeAwareLearningPolicy.ts';
import type {SentenceAnswerEvidence} from '@ventra/shared';

export const SENTENCE_PLAZA_GAME_ID='island_sentence_square_plaza';
export const SENTENCE_PLAZA_MISSIONS=[
 {id:1,title:'Renklerin Uyanışı',icon:'🎨',skill:'describing',rule:'Bir şeyi tarif ederken özne + is + özellik kullanırız.',model:'The flower is yellow.',modelTr:'Çiçek sarı.',story:'Meydanın renk kristalleri sönmüş. İngilizce cümlelerle ışıklarını geri getir.'},
 {id:2,title:'Yeni Dostlar',icon:'🐾',skill:'introducing',rule:'Bir varlığı tanıtırken This is a… veya There is a… yapısını kullanırız.',model:'This is a rabbit.',modelTr:'Bu bir tavşan.',story:'Meydanın dostları kayboldu. İngilizce cümle kur, karakterleri geri çağır.'},
 {id:3,title:'Gizli Yerler',icon:'🧭',skill:'location',rule:'Yer tarif etmek için under, behind, next to ve near gibi kelimeler kullanırız.',model:'The cat is under the tree.',modelTr:'Kedi ağacın altında.',story:'Meydandaki dostlar yollarını kaybetti. Doğru yer cümlesiyle onları bul.'},
 {id:4,title:'Hareket Büyüsü',icon:'🪽',skill:'action',rule:'Can + fiil yetenek belirtir. Is + fiil-ing ise şu anda yapılan eylemi anlatır.',model:'The bird can fly.',modelTr:'Kuş uçabilir.',story:'Şehrin hareket büyüleri durdu. Doğru İngilizceyle dostları yeniden harekete geçir.'},
 {id:5,title:'İstekler Meydanı',icon:'🍎',skill:'preference',rule:'I like… sevdiğimiz bir şeyi anlatır. Because ile nedenini açıklayabiliriz.',model:'I like apples.',modelTr:'Elmaları severim.',story:'Festival için karakterlerin sevdiği yiyecekleri İngilizceyle anlat.'},
 {id:6,title:'Fener Festivali',icon:'🏮',skill:'transfer',rule:'Öğrendiğin renk, nesne, eylem ve yer ifadelerini yeni bir sahnede birlikte kullan.',model:'The blue bird can fly.',modelTr:'Mavi kuş uçabilir.',story:'Meydanı aydınlatan son büyü için farklı İngilizce yapıları birleştir.'}
] as const;
export type PlazaMission=1|2|3|4|5|6;
export type PlazaSkill=typeof SENTENCE_PLAZA_MISSIONS[number]['skill'];
export type PlazaActor='lantern'|'flower'|'house'|'cat'|'dog'|'bird'|'rabbit'|'apple'|'balloon';
export type PlazaAction='glow'|'appear'|'move'|'fly'|'jump'|'run'|'sleep'|'celebrate';
export interface PlazaSceneEffect{actor:PlazaActor;color?:string;place?:string;food?:string;action:PlazaAction;}
export interface PlazaQuestion{
 id:string;mission:PlazaMission;skill:PlazaSkill;englishLevel:EnglishPlacement;
 cue:string;scene:PlazaSceneEffect;sentence:string;tokens:string[];
 decoys:string[];explanation:string;vocabulary:readonly {en:string;tr:string}[];
}
export interface PlazaDeck{mission:PlazaMission;questions:PlazaQuestion[];grade:number|null;englishLevel:EnglishPlacement;seed:number;}
type Theme={actor:PlazaActor;label:string;color?:string;place?:string;action?:PlazaAction;value?:string};
const COLORS=[{name:'red',tr:'kırmızı'},{name:'blue',tr:'mavi'},{name:'green',tr:'yeşil'},{name:'yellow',tr:'sarı'}] as const;
const ANIMALS=[{actor:'cat',en:'cat',tr:'kedi'},{actor:'dog',en:'dog',tr:'köpek'},
 {actor:'bird',en:'bird',tr:'kuş'},{actor:'rabbit',en:'rabbit',tr:'tavşan'}] as const;
const LOCATIONS=[{en:'under the tree',tr:'ağacın altında'},{en:'behind the house',tr:'evin arkasında'},
 {en:'next to the fountain',tr:'çeşmenin yanında'},{en:'near the tree',tr:'ağacın yakınında'}] as const;
const ACTIONS=[
 {actor:'bird',en:'bird',tr:'kuş',verb:'fly',ing:'flying',trAction:'uçmasını'},
 {actor:'rabbit',en:'rabbit',tr:'tavşan',verb:'jump',ing:'jumping',trAction:'zıplamasını'},
 {actor:'dog',en:'dog',tr:'köpek',verb:'run',ing:'running',trAction:'koşmasını'},
 {actor:'cat',en:'cat',tr:'kedi',verb:'sleep',ing:'sleeping',trAction:'uyumasını'}
] as const;
const FOODS=[
 {en:'apples',tr:'elmaları',why:'sweet',whyTr:'tatlı'},{en:'bananas',tr:'muzları',why:'sweet',whyTr:'tatlı'},
 {en:'carrots',tr:'havuçları',why:'healthy',whyTr:'sağlıklı'},{en:'oranges',tr:'portakalları',why:'juicy',whyTr:'sulu'},
 {en:'pears',tr:'armutları',why:'sweet',whyTr:'tatlı'},{en:'grapes',tr:'üzümleri',why:'sweet',whyTr:'tatlı'},
 {en:'strawberries',tr:'çilekleri',why:'sweet',whyTr:'tatlı'},{en:'peaches',tr:'şeftalileri',why:'juicy',whyTr:'sulu'}
] as const;
const split=(sentence:string)=>sentence.replace(/[.,!?]/g,'').split(/\s+/).filter(Boolean);
const shuffle=<T>(items:readonly T[],random:()=>number):T[]=>{
 const arr=[...items];for(let i=arr.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;
};
function seeded(seed:number):()=>number{
 let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
}
function create(mission:PlazaMission,level:EnglishPlacement,index:number):PlazaQuestion{
 const skill=SENTENCE_PLAZA_MISSIONS[mission-1].skill;
 let sentence='',cue='',explanation='',scene:PlazaSceneEffect={actor:'lantern',action:'glow'},vocabulary:{en:string;tr:string}[]=[];
 const advanced=level==='A2',intermediate=level==='A1';
 if(mission===1){
  const color=COLORS[index%COLORS.length];
  const actor=(['lantern','flower','house','balloon'] as const)[Math.floor(index/4)%4];
  const label={lantern:'fener',flower:'çiçek',house:'ev',balloon:'balon'}[actor];
  sentence=advanced?`The ${actor} is ${color.name}, and the square looks bright.`:
    intermediate?`The ${actor} is ${color.name}.`:
    Math.floor(index/4)===0?`It is ${color.name}.`:`The ${actor} is ${color.name}.`;
  cue=`${label[0].toUpperCase()+label.slice(1)} ${color.tr} olsun.`;
  explanation=advanced?'And iki düşünceyi bağlar.':'Is, özneyi renkle bağlar.';
  scene={actor,color:color.name,action:'glow'};vocabulary=[{en:actor,tr:label},{en:color.name,tr:color.tr}];
 }else if(mission===2){
  const animal=ANIMALS[index%ANIMALS.length];
  const color=COLORS[Math.floor(index/4)%COLORS.length];
  sentence=advanced?`There is a ${color.name} ${animal.en} in the square, and it looks happy.`:
    intermediate?`There is a ${color.name} ${animal.en} in the square.`:`This is a ${color.name} ${animal.en}.`;
  cue=`Meydana ${color.tr} bir ${animal.tr} çağır.`;
  explanation=intermediate||advanced?'There is, bir yerde bir şey bulunduğunu belirtir.':'This is a…, karşımızdaki bir varlığı tanıtır.';
  scene={actor:animal.actor,action:'appear',color:color.name};vocabulary=[{en:animal.en,tr:animal.tr},{en:color.name,tr:color.tr}];
 }else if(mission===3){
  const animal=ANIMALS[index%ANIMALS.length],position=LOCATIONS[Math.floor(index/4)%LOCATIONS.length];
  sentence=advanced?`The little ${animal.en} is ${position.en}, and it is safe.`:
    intermediate?`The ${animal.en} is ${position.en}.`:`The ${animal.en} is ${position.en}.`;
  cue=`${animal.tr[0].toUpperCase()+animal.tr.slice(1)} ${position.tr} olsun.`;
  explanation='Is + yer ifadesi, nesnenin nerede olduğunu bildirir.';
  scene={actor:animal.actor,place:position.en,action:'move'};
  vocabulary=[{en:animal.en,tr:animal.tr},{en:position.en,tr:position.tr}];
 }else if(mission===4){
  const a=ACTIONS[index%ACTIONS.length];
  const location=LOCATIONS[Math.floor(index/4)%LOCATIONS.length];
  const suffix=['now','today','here','again'][Math.floor(index/4)%4];
  sentence=advanced?`The ${a.en} is ${a.ing} ${location.en} because it feels safe.`:
    intermediate?`The ${a.en} is ${a.ing} ${location.en}.`:`The ${a.en} can ${a.verb} ${suffix}.`;
  cue=`${a.tr[0].toUpperCase()+a.tr.slice(1)} ${location.tr} ${a.trAction} sağla.`;
  explanation=advanced?'Because, bir durumun nedenini açıklar.':intermediate?'Is + -ing şu anda gerçekleşen eylemdir.':'Can + fiil, bir şeyi yapabilmeyi belirtir.';
  scene={actor:a.actor,place:location.en,action:({fly:'fly',jump:'jump',run:'run',sleep:'sleep'} as const)[a.verb]};
  vocabulary=[{en:a.en,tr:a.tr},{en:a.verb,tr:a.trAction}];
 }else if(mission===5){
  const f=FOODS[index%FOODS.length];
  const occasion=Math.floor(index/FOODS.length)%3;
  sentence=advanced?[
   `I like ${f.en} because they are ${f.why}.`,
   `I like ${f.en} because they taste good.`,
   `I enjoy ${f.en} because they are ${f.why}.`][occasion]:
   intermediate?[
    `I like ${f.en}, but I do not like lemons.`,
    `I like ${f.en} and I like fruit.`,
    `I like ${f.en} in the morning.`][occasion]:
    [`I like ${f.en}.`,`I really like ${f.en}.`,`I like ${f.en} today.`][occasion];
  cue=`Festivalde ${f.tr} sevdiğini söyle.`;
  explanation=advanced?'Because, nedenimizi anlatır.':intermediate?'But, iki farklı düşünceyi karşılaştırır.':'I like…, sevdiğimiz şeyi anlatır.';
  scene={actor:'apple',action:'celebrate',food:f.en,color:index%2===0?'red':'yellow'};
  vocabulary=[{en:f.en,tr:f.tr},{en:advanced?'because':'like',tr:advanced?'çünkü':'sevmek'}];
 }else{
  const a=ACTIONS[index%ACTIONS.length],color=COLORS[Math.floor(index/4)%COLORS.length];
  // The final combines description and action in one meaningful transformation.
  sentence=advanced?`The ${color.name} ${a.en} is ${a.ing} because it is happy.`:
    intermediate?`The ${color.name} ${a.en} is ${a.ing} in the square.`:
    `The ${color.name} ${a.en} can ${a.verb}.`;
  cue=`${color.tr} ${a.tr} ${a.trAction} sağla.`;
  explanation=advanced?'Renk + isim + eylem + because ile neden belirtiyoruz.':intermediate?'Özellik, isim ve eylem bir cümlede birleşiyor.':'Renk + isim + can + fiil bir cümlede birleşir.';
  scene={actor:a.actor,color:color.name,action:({fly:'fly',jump:'jump',run:'run',sleep:'sleep'} as const)[a.verb]};
  vocabulary=[{en:color.name,tr:color.tr},{en:a.en,tr:a.tr},{en:a.verb,tr:a.trAction}];
 }
 const distractors= mission===1?['green','red','is','are','house','blue']:
  mission===2?['the','a','is','are','There','This','dog']:
  mission===3?['in','on','above','behind','tree','under']:
  mission===4?['can','is','running','sleeping','fly','runs']:
  mission===5?['love','like','not','are','because','but']:
  ['can','is','because','are','cat','blue'];
 return {id:`plaza:${mission}:${level}:${index}`,mission,skill,englishLevel:level,
   sentence,cue,scene,explanation,vocabulary,tokens:split(sentence),
   decoys:distractors.filter(w=>!split(sentence).includes(w)).slice(0,2)};
}
/** Grade affects cognitive volume, not linguistic placement. */
export function plazaQuestionsForGrade(grade:number|null|undefined):number{
 return grade!=null&&grade>=1&&grade<=2?3:grade!=null&&grade>=5&&grade<=8?5:4;
}
export function planPlazaMission(input:{mission:PlazaMission;grade:number|null;englishLevel:EnglishPlacement;
 seed:number;history?:readonly SentenceAnswerEvidence[]}):PlazaDeck{
 const {mission,grade,englishLevel,seed}=input;
 if(!Number.isInteger(mission)||mission<1||mission>6)throw new RangeError('Unknown plaza mission');
 const random=seeded(seed^(mission*1009));
 const candidates=Array.from({length:mission===5?24:16},(_,i)=>create(mission,englishLevel,i));
 // Remove duplicate sentences before sampling; equal word strings do not create
 // new educational tasks even when their technical IDs differ.
 const unique=[...new Map(candidates.map(q=>[q.sentence,q])).values()];
 const weak=new Set((input.history??[]).filter(e=>!e.firstTryCorrect||e.hintUsed).map(e=>e.questionId));
 const preferred=shuffle(unique.filter(q=>weak.has(q.id)),random);
 const rest=shuffle(unique.filter(q=>!weak.has(q.id)),random);
 const questions=[...preferred,...rest].slice(0,plazaQuestionsForGrade(grade));
 return {mission,grade,englishLevel,seed,questions};
}
/** Duplicate words are independent physical tiles. */
export function plazaWordTiles(task:PlazaQuestion,seed:number):{id:string;word:string;target:boolean}[]{
 const words=task.tokens.map((word,i)=>({id:`word-${i}`,word,target:true}));
 const extras=task.decoys.map((word,i)=>({id:`extra-${i}`,word,target:false}));
 const mixed=shuffle([...words,...extras],seeded(seed^0x65bda21));
 if(mixed.every((item,i)=>item.id===`word-${i}`))mixed.push(mixed.shift()!);
 return mixed;
}
export function plazaWordExpected(task:PlazaQuestion,position:number):string|null{
 return task.tokens[position]??null;
}
export function validatePlazaEvidence(rows:readonly SentenceAnswerEvidence[],plan:PlazaDeck):boolean{
 if(rows.length!==plan.questions.length||new Set(rows.map(x=>x.questionId)).size!==rows.length)return false;
 return rows.every((row,i)=>row.questionId===plan.questions[i].id&&row.skill===plan.questions[i].skill
  &&row.placement===plan.englishLevel&&Number.isInteger(row.mistakes)&&row.mistakes>=0
  &&typeof row.hintUsed==='boolean'&&typeof row.modelHeard==='boolean'
  &&row.firstTryCorrect===(row.mistakes===0&&!row.hintUsed&&!row.modelHeard)
  &&typeof row.timestamp==='string'&&Number.isFinite(Date.parse(row.timestamp)));
}
