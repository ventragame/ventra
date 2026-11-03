/**
 * Hareket Büyüsü — four-chapter action-language adventure.
 * A finished island region within Cümle Meydanı mission #4.
 * No AI-generated grammar: every sentence and its Turkish cue are deterministic.
 * Grade controls length & quantity; English placement controls grammar.
 * Saved with the EXISTING island_sentence_square_plaza / level 4 contract.
 */
import type {EnglishPlacement} from './gradeAwareLearningPolicy.ts';
import type {SentenceAnswerEvidence} from '@ventra/shared';
import type {PlazaDeck,PlazaQuestion,PlazaSentenceKind,PlazaSceneEffect} from './sentencePlazaEngine.ts';

export type MagicActor='bird'|'rabbit'|'dog'|'cat';
export type MagicVerb='fly'|'jump'|'run'|'sleep';
export type MagicPlace='tree'|'pond'|'bridge'|'tower';
export type MagicChapter=1|2|3|4;
export type MagicChallenge='action'|'destination'|'repair'|'final';
export interface MovementTrial{
 id:string;chapter:MagicChapter;challenge:MagicChallenge;actor:MagicActor;
 verb:MagicVerb;place:MagicPlace;color:string;feeling:string;
 question:PlazaQuestion;brokenWords?:string[];errorIndex?:number;
}
export interface MovementPlan {
 deck:PlazaDeck;trials:MovementTrial[];grade:number|null;englishLevel:EnglishPlacement;
 roundsPerChapter:number;estimatedMinutes:[number,number];
}
const CAST:Readonly<Record<MagicActor,{verb:MagicVerb;ing:string;tr:string;actionTr:string;feeling:string;feelingTr:string}>>={
 bird:{verb:'fly',ing:'flying',tr:'kuş',actionTr:'uçmak',feeling:'free',feelingTr:'özgür'},
 rabbit:{verb:'jump',ing:'jumping',tr:'tavşan',actionTr:'zıplamak',feeling:'happy',feelingTr:'mutlu'},
 dog:{verb:'run',ing:'running',tr:'köpek',actionTr:'koşmak',feeling:'excited',feelingTr:'heyecanlı'},
 cat:{verb:'sleep',ing:'sleeping',tr:'kedi',actionTr:'uyumak',feeling:'tired',feelingTr:'yorgun'}
};
const COLORS=[{en:'blue',tr:'mavi'},{en:'yellow',tr:'sarı'},{en:'orange',tr:'turuncu'},
 {en:'purple',tr:'mor'},{en:'green',tr:'yeşil'},{en:'red',tr:'kırmızı'}] as const;
const PLACES:Readonly<Record<MagicPlace,{en:string;tr:string}>>={
 tree:{en:'tree',tr:'ağaç'},pond:{en:'pond',tr:'gölet'},
 bridge:{en:'bridge',tr:'köprü'},tower:{en:'tower',tr:'kule'}
};
export const MOVEMENT_CHAPTERS=[
 {id:1,title:'Hareket Kristalleri',short:'Eylemi tanı',icon:'✦',
  objective:'Bir karakterin ne yapabildiğini İngilizce ifade et.',
  explanation:'CAN + fiilin yalın hâli: The bird can fly. Soru: Can the bird fly?',
  example:'The bird can fly.',exampleTr:'Kuş uçabilir.'},
 {id:2,title:'Işık Rotaları',short:'Yeri keşfet',icon:'◈',
  objective:'Karakteri doğru yere yönlendir ve hareketini tarif et.',
  explanation:'NEAR THE + yer: The rabbit is jumping near the tree.',
  example:'The dog is running near the bridge.',exampleTr:'Köpek köprünün yakınında koşuyor.'},
 {id:3,title:'Bozulan Büyüler',short:'Hatalı cümleyi onar',icon:'✧',
  objective:'Yanlış İngilizce sözcüğü bul ve cümleyi doğru hâliyle oluştur.',
  explanation:'Can fly doğrudur; can flying yanlıştır. Is flying doğrudur; is fly yanlıştır.',
  example:'The cat is sleeping.',exampleTr:'Kedi uyuyor.'},
 {id:4,title:'Gökyüzü Senfonisi',short:'Her şeyi birleştir',icon:'★',
  objective:'Doğru eylemi, yeri ve tam İngilizce cümleyi birlikte kullan.',
  explanation:'Özne + hareket + yer; ileri seviyede because ile neden ekle.',
  example:'The blue bird is flying near the tower.',exampleTr:'Mavi kuş kulenin yanında uçuyor.'}
] as const;
export const MAGIC_VERBS:readonly {id:MagicVerb;en:string;tr:string}[]=[
 {id:'fly',en:'fly',tr:'uçmak'}, {id:'jump',en:'jump',tr:'zıplamak'},
 {id:'run',en:'run',tr:'koşmak'},{id:'sleep',en:'sleep',tr:'uyumak'}
];
export const MAGIC_PLACES:readonly {id:MagicPlace;en:string;tr:string}[]=[
 {id:'tree',en:'tree',tr:'ağaç'}, {id:'pond',en:'pond',tr:'gölet'},
 {id:'bridge',en:'bridge',tr:'köprü'}, {id:'tower',en:'tower',tr:'kule'}
];
const seeded=(initial:number)=>{let seed=initial>>>0;return()=>{
 seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};};
function shuffle<T>(items:readonly T[],random:()=>number):T[]{
 const arr=[...items];
 for(let i=arr.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
 return arr;
}
export function movementQuestionsPerChapter(grade:number|null|undefined):number{
 const valid=Number.isInteger(grade)&&grade!>=1&&grade!<=8;
 return valid&&grade!<=2?3:valid&&grade!>=5?5:4;
}
export function movementWordLimit(grade:number|null|undefined):number{
 const valid=Number.isInteger(grade)&&grade!>=1&&grade!<=8;
 return valid&&grade!<=2?10:valid&&grade!<=4?13:18;
}
export function movementCueFor(chapter:MagicChapter,actor:MagicActor,place:MagicPlace,colorTr:string,level:EnglishPlacement,grade:number|null):string{
 const info=CAST[actor],loc=PLACES[place];
 const advanced=level==='A2'&&!(grade!=null&&grade>=1&&grade<=2);
 if(chapter===1)return advanced?
   colorTr+' '+info.tr+' '+info.feelingTr+' hissettiği için '+info.actionTr+' eylemini şu anda yapıyor.':
   'Bu '+colorTr+' '+info.tr+' ne yapabilir? '+info.actionTr+' eylemini İngilizce anlat.';
 if(chapter===2)return info.tr+(advanced?' '+info.feelingTr+' hissettiği için':'')+
   ' '+loc.tr+' yakınında '+info.actionTr+' eylemini yapıyor. Yeri seç ve İngilizce anlat.';
 if(chapter===3)return advanced?
   'Bozulan cümleyi düzelt: '+info.tr+' '+loc.tr+' yakınında '+info.actionTr+' eylemini yapıyor ve '+info.feelingTr+' hissediyor.':
   'Bozulan cümleyi düzelt: '+info.tr+' '+loc.tr+' yakınında '+info.actionTr+' eylemini yapıyor.';
 return colorTr+' '+info.tr+' '+loc.tr+' yakınında '+info.actionTr+
   ' eylemini yapıyor'+(advanced?' çünkü '+info.feelingTr+' hissediyor':'')+
   '. İki seçimi de yap, sonra cümleyi kur.';
}
function fabricate(chapter:MagicChapter,actor:MagicActor,place:MagicPlace,colorIndex:number,level:EnglishPlacement,grade:number|null):MovementTrial {
 const c=COLORS[colorIndex%COLORS.length],data=CAST[actor],loc=PLACES[place],early=grade!=null&&grade>=1&&grade<=2;
 const a1=level!=='Pre-A1',a2=level==='A2';
 let sentence='',kind:PlazaSentenceKind='statement',explanation='';
 if(chapter===1){
  if(a2&&!early){
   sentence='The '+c.en+' '+actor+' is '+data.ing+' because it feels '+data.feeling+'.';
   kind='reason';explanation='Is + fiil-ing şu anki hareket, because ise neden bildirir.';
  } else if(a1&&colorIndex%2===1){
   sentence='Can the '+actor+' '+data.verb+'?';
   kind='question';explanation='Can öznenin önünde olursa soru oluşur.';
  } else {
   sentence='The '+c.en+' '+actor+' can '+data.verb+'.';
   explanation='Can sözcüğünden sonra fiilin yalın hâli gelir.';
  }
 }else if(chapter===2){
  if(!a1)sentence='The '+actor+' can '+data.verb+' near the '+loc.en+'.';
  else if(a2&&!early)sentence='The '+actor+' is '+data.ing+' near the '+loc.en+' because it feels '+data.feeling+'.';
  else sentence='The '+actor+' is '+data.ing+' near the '+loc.en+'.';
  kind=a2&&!early?'reason':'statement';
  explanation=a1?'Is + fiil-ing devam eden hareketi, near the + yer konumu belirtir.':'Can + fiil yeteneği, near the + yer konumu belirtir.';
 }else if(chapter===3){
  if(!a1)sentence='The '+c.en+' '+actor+' can '+data.verb+'.';
  else if(a2&&!early){
   sentence='The '+actor+' is '+data.ing+' near the '+loc.en+', and it feels '+data.feeling+'.';
   kind='statement';
  } else sentence='The '+actor+' is '+data.ing+' near the '+loc.en+' now.';
  explanation=a2&&!early?'Is + fiil-ing ve and ile iki doğru ifade kurulur.':
   a1?'Is + fiil-ing doğru, is + yalın fiil yanlıştır.':'Can + yalın fiil doğru, can + fiil-ing yanlıştır.';
 }else {
  if(!a1)sentence='The '+c.en+' '+actor+' can '+data.verb+' near the '+loc.en+'.';
  else if(a2&&!early){
   sentence='The '+c.en+' '+actor+' is '+data.ing+' near the '+loc.en+' because it feels '+data.feeling+'.';
   kind='reason';
  }else sentence='The '+c.en+' '+actor+' is '+data.ing+' near the '+loc.en+'.';
  explanation=a1?'Is + fiil-ing, şu anda yapılan hareketi tarif eder.':'Can + fiilin yalın hâli, yeteneği anlatır.';
 }
 const tokens=sentence.replace(/[.,!?]/g,'').split(' ');
 const id='movement:v3:'+chapter+':'+level+':'+(early?'early':'older')+':'+actor+':'+place+':'+c.en;
 const isQuestion=sentence.endsWith('?');
 const forbidden=chapter===3?(a1?'are':'is'):null;
 const brokenTokens=[...tokens];
 const errorIndex=chapter===3?Math.max(1,tokens.indexOf(a1?'is':'can')):-1;
 if(errorIndex>=0&&forbidden)brokenTokens[errorIndex]=forbidden;
 const scene:PlazaSceneEffect={actor,color:c.en,action:data.verb,place:'near the '+loc.en};
 const question:PlazaQuestion={
  id,mission:4,skill:'action',englishLevel:level,kind,mode:chapter===3?'repair':chapter===2?'scene':'construct',
  cue:movementCueFor(chapter,actor,place,c.tr,level,grade),
  scene,sentence,tokens,
  decoys:['are','is','can','running','sleeping','fly','jump','the'].filter(w=>!tokens.includes(w)).slice(0,2),
  explanation,
  vocabulary:[{en:data.verb,tr:data.actionTr},{en:actor,tr:data.tr},{en:loc.en,tr:loc.tr},
   {en:c.en,tr:c.tr}],
  ...(chapter===3?{brokenSentence:brokenTokens.join(' ')+(isQuestion?'?':'.')}:{}),
  ...(chapter===2?{sceneChoices:MAGIC_PLACES.map(p=>({id:p.id,label:p.tr,icon:'✦'})),correctSceneChoice:place}:{})
 };
 return {id,chapter,challenge:chapter===1?'action':chapter===2?'destination':chapter===3?'repair':'final',
  actor,verb:data.verb,place,color:c.en,feeling:data.feeling,question,
  ...(chapter===3?{brokenWords:brokenTokens,errorIndex}:{})};
}
export function movementMagicPool(level:EnglishPlacement,grade:number|null):MovementTrial[]{
 if(!['Pre-A1','A1','A2'].includes(level))throw Error('Invalid English level');
 const result:MovementTrial[]=[];
 const names=['bird','rabbit','dog','cat'] as const, places=['tree','pond','bridge','tower'] as const;
 for(let chapter=1 as MagicChapter;chapter<=4;chapter=(chapter+1) as MagicChapter){
  for(const actor of names)for(const place of places)for(let color=0;color<COLORS.length;color++){
   const trial=fabricate(chapter,actor,place,color,level,grade);
   if(trial.question.tokens.length<=movementWordLimit(grade))result.push(trial);
  }
 }
 return [...new Map(result.map(row=>[row.question.sentence+':'+row.chapter,row])).values()];
}
/** Strongly different actors and positions per chapter, weak examples revisited.
 * Replays remain deterministic by seed; no synthetic profile progression. */
export function planMovementMagic(input:{
 grade:number|null;englishLevel:EnglishPlacement;seed:number;
 history?:readonly SentenceAnswerEvidence[];
}):MovementPlan{
 const {grade,englishLevel,seed}=input,perChapter=movementQuestionsPerChapter(grade);
 const pool=movementMagicPool(englishLevel,grade);
 const random=seeded(seed^0x9fa7342),history=input.history??[];
 const weak=new Set(history.filter(a=>!a.firstTryCorrect||a.hintUsed).map(a=>a.questionId));
 const seen=new Set(history.map(a=>a.questionId));
 const trials:MovementTrial[]=[];
 for(let chapter=1 as MagicChapter;chapter<=4;chapter=(chapter+1) as MagicChapter){
  const available=shuffle(pool.filter(t=>t.chapter===chapter),random);
  const chosen:MovementTrial[]=[],actors=new Set<MagicActor>(),places=new Set<MagicPlace>();
  const ranking=(t:MovementTrial)=>{
   const status=weak.has(t.id)?0:seen.has(t.id)?2:1;
   return status*5+(actors.has(t.actor)?2:0)+(places.has(t.place)?1:0);
  };
  while(chosen.length<perChapter){
   const ordered=shuffle(available,random).sort((x,y)=>ranking(x)-ranking(y));
   const candidate=ordered.find(t=>!chosen.some(c=>c.question.sentence===t.question.sentence));
   if(!candidate)throw Error('Movement Magic: insufficient unique English sentences');
   chosen.push(candidate);actors.add(candidate.actor);places.add(candidate.place);
   const i=available.indexOf(candidate);if(i>=0)available.splice(i,1);
  }
  trials.push(...chosen);
 }
 const deck:PlazaDeck={mission:4,grade,englishLevel,seed,questions:trials.map(t=>t.question)};
 return {deck,trials,grade,englishLevel,roundsPerChapter:perChapter,
  estimatedMinutes:perChapter===3?[7,10]:perChapter===4?[9,13]:[11,16]};
}
export function checkMagicAction(trial:MovementTrial,action:MagicVerb):boolean{
 return trial.verb===action;
}
export function checkMagicPlace(trial:MovementTrial,place:MagicPlace):boolean{
 return trial.place===place;
}
export function checkMagicRepair(trial:MovementTrial,index:number):boolean{
 return trial.chapter===3&&index===trial.errorIndex;
}
export function checkMagicSentence(trial:MovementTrial,words:readonly string[]):boolean{
 return trial.question.tokens.length===words.length&&
  trial.question.tokens.every((w,i)=>w===words[i]);
}
