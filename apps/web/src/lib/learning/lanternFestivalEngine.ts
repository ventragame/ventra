/**
 * Fener Festivali — Cümle Meydanı mission 6, transfer + authentic final.
 * Curriculum authored, no unconstrained English or external child communication.
 * Grade controls load, English placement controls language independently.
 */
import type {EnglishPlacement} from './gradeAwareLearningPolicy.ts';
import type {SentenceAnswerEvidence} from '@ventra/shared';
import type {PlazaDeck,PlazaQuestion,PlazaSceneEffect,PlazaSentenceKind} from './sentencePlazaEngine.ts';

export type LanternChapter=1|2|3|4;
export type LanternColor='red'|'blue'|'green'|'yellow'|'purple'|'orange';
export type LanternPlace='tree'|'bridge'|'tower'|'fountain';
export type LanternAnimal='bird'|'rabbit'|'dog'|'cat';
export type LanternMode='color'|'location'|'repair'|'final';
export const LANTERN_COLORS:readonly {id:LanternColor;tr:string;hex:string}[]=[
 {id:'red',tr:'kırmızı',hex:'#f47f97'},{id:'blue',tr:'mavi',hex:'#75d7fa'},
 {id:'green',tr:'yeşil',hex:'#83e5aa'},{id:'yellow',tr:'sarı',hex:'#ffdb7b'},
 {id:'purple',tr:'mor',hex:'#c0a4f4'},{id:'orange',tr:'turuncu',hex:'#ffaf79'}];
export const LANTERN_PLACES:readonly {id:LanternPlace;tr:string;label:string;icon:string}[]=[
 {id:'tree',tr:'ağacın',label:'Fener Ağacı',icon:'🌳'},
 {id:'bridge',tr:'köprünün',label:'Ay Köprüsü',icon:'🌉'},
 {id:'tower',tr:'kulenin',label:'Yıldız Kulesi',icon:'🏰'},
 {id:'fountain',tr:'çeşmenin',label:'Işık Çeşmesi',icon:'⛲'}];
export const LANTERN_ANIMALS:readonly {id:LanternAnimal;tr:string;verb:string;ing:string;actionTr:string;emotion:string;emotionTr:string;icon:string}[]=[
 {id:'bird',tr:'kuş',verb:'fly',ing:'flying',actionTr:'uçuyor',emotion:'free',emotionTr:'özgür',icon:'🐦'},
 {id:'rabbit',tr:'tavşan',verb:'jump',ing:'jumping',actionTr:'zıplıyor',emotion:'happy',emotionTr:'mutlu',icon:'🐰'},
 {id:'dog',tr:'köpek',verb:'run',ing:'running',actionTr:'koşuyor',emotion:'excited',emotionTr:'heyecanlı',icon:'🐶'},
 {id:'cat',tr:'kedi',verb:'sleep',ing:'sleeping',actionTr:'uyuyor',emotion:'tired',emotionTr:'yorgun',icon:'🐱'}];
export const LANTERN_CHAPTERS=[
 {id:1,title:'Renk Kristalleri',short:'Rengi tarif et',icon:'✦',objective:'Doğru fener rengini seç ve nesneyi İngilizce tarif et.',
  rule:'The red lantern is bright. = Kırmızı fener parlak.',example:'The red lantern is bright.',tr:'Kırmızı fener parlak.'},
 {id:2,title:'Işık Rotaları',short:'Yeri tarif et',icon:'✧',objective:'Feneri doğru yere götür; İngilizce yönerge veya yer ifadesi kur.',
  rule:'Near the tree = ağacın yakınında. Next to = hemen yanında.',example:'Put the blue lantern near the tower.',tr:'Mavi feneri kulenin yakınına koy.'},
 {id:3,title:'Rüzgârın Sırrı',short:'Cümleyi onar',icon:'◈',objective:'Bozulan hareket cümlesindeki yanlış İngilizce kelimeyi bul ve düzelt.',
  rule:'Can + fly, is + flying. Tek bir dil bilgisi sözcüğü yanlış.',example:'The bird is flying.',tr:'Kuş uçuyor.'},
 {id:4,title:'Gökyüzü Töreni',short:'Bilgini birleştir',icon:'★',
  objective:'Karakteri, rengini ve konumunu eşleştir; sonra bütün İngilizce cümleyi üret.',
  rule:'Renk + karakter + hareket + yer; uygun seviyede because ile neden.',
  example:'The blue bird is flying near the tower.',tr:'Mavi kuş kulenin yakınında uçuyor.'}
] as const;
export interface LanternTrial{
 id:string;chapter:LanternChapter;mode:LanternMode;color:LanternColor;
 place:LanternPlace;animal:LanternAnimal;question:PlazaQuestion;
 brokenWords?:string[];errorIndex?:number;
}
export interface LanternPlan{
 deck:PlazaDeck;trials:LanternTrial[];grade:number|null;englishLevel:EnglishPlacement;
 roundsPerChapter:number;estimatedMinutes:[number,number];
}
const colorOf=(c:LanternColor)=>LANTERN_COLORS.find(v=>v.id===c)!;
const placeOf=(c:LanternPlace)=>LANTERN_PLACES.find(v=>v.id===c)!;
const animalOf=(c:LanternAnimal)=>LANTERN_ANIMALS.find(v=>v.id===c)!;
const shuffle=<T>(values:readonly T[],random:()=>number):T[]=>{
 const items=[...values];for(let i=items.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;};
const seeded=(seed:number)=>{let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};};
export function lanternRoundsForGrade(g:number|null|undefined):number{
 return g!=null&&Number.isInteger(g)&&g>=1&&g<=2?3:g!=null&&Number.isInteger(g)&&g>=5&&g<=8?5:4;
}
export function lanternWordLimit(g:number|null|undefined):number{
 return g!=null&&Number.isInteger(g)&&g>=1&&g<=2?10:g!=null&&Number.isInteger(g)&&g>=3&&g<=4?13:18;
}
const words=(sentence:string)=>sentence.replace(/[.,!?]/g,'').split(/\s+/).filter(Boolean);
function create(chapter:LanternChapter,color:LanternColor,place:LanternPlace,
 animal:LanternAnimal,grade:number|null,level:EnglishPlacement):LanternTrial{
 const col=colorOf(color),where=placeOf(place),who=animalOf(animal);
 const young=grade!=null&&grade>=1&&grade<=2;
 const a1=level!=='Pre-A1',a2=level==='A2';
 let sentence='',cue='',explanation='',kind:PlazaSentenceKind='statement';
 const loc='near the '+place;
 if(chapter===1){
  if(a2&&!young){
   sentence='The '+color+' lantern is shining '+loc+'.';
   cue=where.tr+' yakınındaki '+col.tr+' fenerin ışıldadığını İngilizce anlat.';
   explanation='Is + shining, şu anda yapılan eylemi ve near the + yer ifadesi konumu belirtir.';
  }else if(a1){
   sentence='There is '+(color==='orange'?'an':'a')+' '+color+' lantern '+loc+'.';
   cue=where.tr+' yakınında '+col.tr+' bir fener olduğunu anlat.';
   explanation='There is tek bir nesnenin bulunduğunu söyler.';
  }else{
   sentence='The '+color+' lantern is bright '+loc+'.';
   cue=where.tr+' yakınındaki '+col.tr+' fenerin parlak olduğunu anlat.';
   explanation='The + renk + lantern + is bright; near the yeri belirtir.';
  }
 }else if(chapter===2){
  if(!a1){
   sentence='Put the '+color+' lantern '+loc+'.';
   cue=col.tr+' feneri '+where.tr+' yakınına yerleştir.';
   kind='instruction';explanation='Put + nesne + near the + yer komut verir.';
  }else if(a2&&!young){
   sentence='Please put the '+color+' lantern next to the '+place+'.';
   cue=col.tr+' feneri kibarca '+where.tr+' hemen yanına koymalarını iste.';
   kind='request';explanation='Please kibarlaştırır; next to hemen yanında demektir.';
  }else{
   sentence='The '+color+' lantern is next to the '+place+'.';
   cue=col.tr+' fenerin '+where.tr+' hemen yanında olduğunu anlat.';
   explanation='Is next to, bir nesnenin hemen yanında bulunduğunu söyler.';
  }
 }else if(chapter===3){
  if(!a1){
   sentence='The '+color+' '+animal+' can '+who.verb+' '+loc+'.';
   cue=col.tr+' '+who.tr+' '+where.tr+' yakınında '+({bird:'uçabilir',rabbit:'zıplayabilir',dog:'koşabilir',cat:'uyuyabilir'} as const)[animal]+'. İngilizce anlat.';
   explanation='Can sözcüğünden sonra fiilin yalın biçimi gelir.';
  }else if(a2&&!young){
   sentence='The '+color+' '+animal+' is '+who.ing+' '+loc+' because it feels '+who.emotion+'.';
   cue=col.tr+' '+who.tr+' '+where.tr+' yakınında '+who.emotionTr+' hissettiği için '+who.actionTr+'.';
   kind='reason';explanation='Is + -ing eylemi, because ise neden-sonuç ilişkisini gösterir.';
  }else{
   sentence='The '+color+' '+animal+' is '+who.ing+' '+loc+'.';
   cue=col.tr+' '+who.tr+' '+where.tr+' yakınında '+who.actionTr+'.';
   explanation='Is + -ing, şu anda devam eden hareketi anlatır.';
  }
 }else{
  if(!a1){
   sentence='The '+color+' '+animal+' can '+who.verb+' '+loc+'.';
   cue=col.tr+' '+who.tr+' '+where.tr+' yakınında '+({bird:'uçabilir',rabbit:'zıplayabilir',dog:'koşabilir',cat:'uyuyabilir'} as const)[animal]+'. İngilizce anlat.';
   explanation='Can + fiil yeteneği; near the konumu belirtir.';
  }else if(a2&&!young){
   sentence='The '+color+' '+animal+' is '+who.ing+' '+loc+' because it feels '+who.emotion+'.';
   cue=col.tr+' '+who.tr+' '+where.tr+' yakınında '+who.emotionTr+' hissettiği için '+who.actionTr+'.';
   kind='reason';explanation='Renk, karakter, is + -ing, yer ve because birlikte doğru bilgi verir.';
  }else{
   sentence='The '+color+' '+animal+' is '+who.ing+' '+loc+'.';
   cue=col.tr+' '+who.tr+' '+where.tr+' yakınında '+who.actionTr+'.';
   explanation='Renk + karakter + is + fiil-ing + konum kurduğumuz birleştirilmiş cümledir.';
  }
 }
 const tokens=words(sentence),band=young?'junior':grade!=null&&grade>=3&&grade<=4?'middle':'senior';
 const id=['lantern','v1',chapter,level,band,color,place,animal].join(':');
 const incorrectIndex=chapter===3?tokens.indexOf(level==='Pre-A1'?'can':'is'):-1;
 const broken=tokens.map((word,i)=>i===incorrectIndex?'are':word);
 const scene:PlazaSceneEffect={actor:chapter<=2?'lantern':animal,
  color,place:loc,action:chapter<=2?'glow':who.verb as 'fly'|'jump'|'run'|'sleep'};
 const question:PlazaQuestion={
  id,mission:6,skill:'transfer',englishLevel:level,kind,mode:chapter===3?'repair':'construct',
  sentence,cue,tokens,scene,
  decoys:['are','is','can','not','the','near','and','because','please']
   .filter(w=>!tokens.includes(w)).slice(0,3),
  explanation,vocabulary:[{en:color,tr:col.tr},{en:animal,tr:who.tr},{en:place,tr:where.label},
   {en:who.verb,tr:who.actionTr}],
  ...(chapter===3?{brokenSentence:broken.join(' ')+'.'}:{})
 };
 return {id,chapter,mode:chapter===1?'color':chapter===2?'location':chapter===3?'repair':'final',
  color,place,animal,question,...(chapter===3?{brokenWords:broken,errorIndex:incorrectIndex}:{})};
}
export function lanternCurriculumPool(level:EnglishPlacement,grade:number|null):LanternTrial[]{
 if(!['Pre-A1','A1','A2'].includes(level))throw Error('Invalid English placement');
 const pool:LanternTrial[]=[];
 for(let ch=1 as LanternChapter;ch<=4;ch=(ch+1) as LanternChapter)
  for(const c of LANTERN_COLORS)for(const p of LANTERN_PLACES)for(const a of LANTERN_ANIMALS){
   const t=create(ch,c.id,p.id,a.id,grade,level);
   if(t.question.tokens.length<=lanternWordLimit(grade))pool.push(t);
  }
 return pool;
}
export function planLanternFestival(input:{grade:number|null;englishLevel:EnglishPlacement;seed:number;
 history?:readonly SentenceAnswerEvidence[];knownWords?:readonly string[]}):LanternPlan{
 const {grade,englishLevel,seed}=input,per=lanternRoundsForGrade(grade);
 const pool=lanternCurriculumPool(englishLevel,grade),random=seeded(seed^0x635f1ab);
 const history=input.history??[],weak=new Set(history.filter(e=>!e.firstTryCorrect||e.hintUsed).map(e=>e.questionId));
 const seen=new Set(history.map(e=>e.questionId));
 const familiar=new Set((input.knownWords??[]).map(w=>w.toLowerCase()));
 const trials:LanternTrial[]=[];
 for(let chapter=1 as LanternChapter;chapter<=4;chapter=(chapter+1) as LanternChapter){
  const candidates=shuffle(pool.filter(x=>x.chapter===chapter),random);
  const tie=new Map(candidates.map(t=>[t.id,random()]));
  const chosen:LanternTrial[]=[],usedColor=new Set<LanternColor>(),
    usedPlace=new Set<LanternPlace>(),usedAnimal=new Set<LanternAnimal>();
  const rank=(t:LanternTrial)=>{
   const repeat=weak.has(t.id)?0:seen.has(t.id)?7:2;
   return repeat+(usedColor.has(t.color)?2.5:0)+(usedPlace.has(t.place)?1.5:0)
    +(chapter>=3&&usedAnimal.has(t.animal)?1.5:0)
    -(familiar.has(t.color)?0.5:0)-(familiar.has(t.animal)?0.5:0)
    +(tie.get(t.id)??0)*0.1;
  };
  while(chosen.length<per){
   const next=candidates.filter(t=>!chosen.some(x=>x.question.sentence===t.question.sentence))
    .sort((a,b)=>rank(a)-rank(b))[0];
   if(!next)throw Error('Lantern Festival: not enough distinct English tasks');
   chosen.push(next);usedColor.add(next.color);usedPlace.add(next.place);usedAnimal.add(next.animal);
   candidates.splice(candidates.indexOf(next),1);
  }
  trials.push(...chosen);
 }
 return {deck:{mission:6,grade,englishLevel,seed,questions:trials.map(t=>t.question)},
  trials,grade,englishLevel,roundsPerChapter:per,
  estimatedMinutes:per===3?[8,12]:per===4?[11,16]:[14,19]};
}
export function checkLanternColor(t:LanternTrial,c:LanternColor){return t.color===c;}
export function checkLanternPlace(t:LanternTrial,c:LanternPlace){return t.place===c;}
export function checkLanternAnimal(t:LanternTrial,c:LanternAnimal){return t.animal===c;}
export function checkLanternRepair(t:LanternTrial,i:number){return t.chapter===3&&t.errorIndex===i;}
export function checkLanternSentence(t:LanternTrial,parts:readonly string[]){
 return parts.length===t.question.tokens.length&&parts.every((part,i)=>part===t.question.tokens[i]);
}
