/**
 * İstekler Meydanı — Dilekler Festivali.
 * Four distinct language interactions, safe and curated. No money arithmetic.
 * Persists via existing island_sentence_square_plaza / mission 5.
 */
import type {EnglishPlacement} from './gradeAwareLearningPolicy.ts';
import type {SentenceAnswerEvidence} from '@ventra/shared';
import type {PlazaDeck,PlazaQuestion,PlazaSentenceKind,PlazaSceneEffect} from './sentencePlazaEngine.ts';
export type WishChapter=1|2|3|4;
export type WishFood='apples'|'bananas'|'oranges'|'grapes'|'carrots'|'strawberries'|'pears'|'peaches';
export type WishGuest='mila'|'leo'|'luna'|'niko';
export type WishIntent='like'|'want'|'dislike'|'polite'|'prefer';
export type WishMode='taste'|'order'|'dialogue'|'festival';
export interface WishTrial{
 id:string;chapter:WishChapter;mode:WishMode;guest:WishGuest;food:WishFood;
 second:WishFood;intent:WishIntent;sentence:string;question:PlazaQuestion;
 reason:'sweet'|'juicy'|'crunchy';targetCount:1|2;
}
export interface WishPlan{deck:PlazaDeck;trials:WishTrial[];grade:number|null;
 englishLevel:EnglishPlacement;roundsPerChapter:number;estimatedMinutes:[number,number];}
/** Turkish generic food names and explicit case forms for polite requests/comparisons. */
const WISH_FOOD_TURKISH:Readonly<Record<WishFood,{bare:string;acc:string;dat:string}>>={
 apples:{bare:'elma',acc:'elmayı',dat:'elmaya'},
 bananas:{bare:'muz',acc:'muzu',dat:'muza'},
 oranges:{bare:'portakal',acc:'portakalı',dat:'portakala'},
 grapes:{bare:'üzüm',acc:'üzümü',dat:'üzüme'},
 carrots:{bare:'havuç',acc:'havucu',dat:'havuca'},
 strawberries:{bare:'çilek',acc:'çileği',dat:'çileğe'},
 pears:{bare:'armut',acc:'armudu',dat:'armuda'},
 peaches:{bare:'şeftali',acc:'şeftaliyi',dat:'şeftaliye'}
};
export const WISH_FOODS:readonly {id:WishFood;tr:string;label:string;trait:'sweet'|'juicy'|'crunchy';traitTr:string;color:string}[]=[
 {id:'apples',tr:'elmaları',label:'Elma',trait:'sweet',traitTr:'tatlı',color:'#ea778a'},
 {id:'bananas',tr:'muzları',label:'Muz',trait:'sweet',traitTr:'tatlı',color:'#f6d16f'},
 {id:'oranges',tr:'portakalları',label:'Portakal',trait:'juicy',traitTr:'sulu',color:'#f3a96d'},
 {id:'grapes',tr:'üzümleri',label:'Üzüm',trait:'sweet',traitTr:'tatlı',color:'#b5a3ef'},
 {id:'carrots',tr:'havuçları',label:'Havuç',trait:'crunchy',traitTr:'çıtır',color:'#ed955e'},
 {id:'strawberries',tr:'çilekleri',label:'Çilek',trait:'sweet',traitTr:'tatlı',color:'#e96f83'},
 {id:'pears',tr:'armutları',label:'Armut',trait:'juicy',traitTr:'sulu',color:'#a8cd73'},
 {id:'peaches',tr:'şeftalileri',label:'Şeftali',trait:'juicy',traitTr:'sulu',color:'#f3ba87'}
];
export const WISH_GUESTS:readonly {id:WishGuest;name:string;tr:string;accent:string;kind:string}[]=[
 {id:'mila',name:'Mila',tr:'Mila',accent:'#f4bfaa',kind:'rabbit'},
 {id:'leo',name:'Leo',tr:'Leo',accent:'#f5d08b',kind:'fox'},
 {id:'luna',name:'Luna',tr:'Luna',accent:'#c6b3ee',kind:'cat'},
 {id:'niko',name:'Niko',tr:'Niko',accent:'#9fdbcb',kind:'bear'}
];
export const WISH_CHAPTERS=[
 {id:1,title:'Lezzetler Bahçesi',short:'Beğenimi anlat',icon:'♥',
  objective:'Bir karakterin sevdiği yiyeceği anlayıp “I like...” veya “I do not like...” ile anlat.',
  rule:'I like apples. = Elmaları severim. I do not like apples. = Elmaları sevmem.',
  sample:'I like bananas.',translation:'Muzları severim.'},
 {id:2,title:'Nezaket Tezgâhı',short:'Kibarca iste',icon:'✧',
  objective:'Gerçek bir siparişi iste ve kibar İngilizceyle tezgahtaki ürünü al.',
  rule:'I want ... please. → Can I have some ... please? → Could I have some ... please?',
  sample:'Can I have some oranges, please?',translation:'Biraz portakal alabilir miyim, lütfen?'},
 {id:3,title:'Karakter Sohbeti',short:'Diyalog kur',icon:'♫',
  objective:'Karakterin söylediğini dinle, uygun cevabın niyetini seç ve kendi cümleni kur.',
  rule:'I like = severim, I do not like = sevmem, I want = isterim.',
  sample:'I do not like carrots.',translation:'Havuçları sevmem.'},
 {id:4,title:'Büyük Festival Sofrası',short:'Birleştir ve sun',icon:'★',
  objective:'Festival sofrasına uygun yiyecekleri seçerek iki düşünceyi İngilizce birleştir.',
  rule:'And = ve, but = ama, because = çünkü. Cümleler seçtiğin yiyeceklerin anlamıyla uyuşmalı.',
  sample:'I like apples and bananas.',translation:'Elma ve muz severim.'}
] as const;
const foodById=(id:WishFood)=>WISH_FOODS.find(f=>f.id===id)!;
const F=(seed:number)=>{let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};};
function shuffle<T>(input:readonly T[],rand:()=>number):T[]{
 const result=[...input];for(let i=result.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;
}
export function wishRoundsForGrade(grade:number|null|undefined):number{
 const v=Number.isInteger(grade)&&grade!>=1&&grade!<=8;
 return v&&grade!<=2?3:v&&grade!>=5?5:4;
}
export function wishWordsForGrade(grade:number|null|undefined):number{
 const v=Number.isInteger(grade)&&grade!>=1&&grade!<=8;
 return v&&grade!<=2?10:v&&grade!<=4?13:19;
}
const normalizeWords=(text:string)=>text.replace(/[.,!?]/g,'').split(/\s+/).filter(Boolean);
function author(chapter:WishChapter,level:EnglishPlacement,grade:number|null,guest:WishGuest,
 food:WishFood,second:WishFood,variant:number):WishTrial{
 const ageYoung=grade!=null&&grade>=1&&grade<=2,early=level==='Pre-A1';
 const a1=level==='A1',a2=level==='A2';
 const first=foodById(food),other=foodById(second);
 const support=A1_CAP(level,ageYoung);
 const firstTr=WISH_FOOD_TURKISH[food],otherTr=WISH_FOOD_TURKISH[second];
 let sentence='',intent:WishIntent='like',kind:PlazaSentenceKind='preference';
 let cue='',explanation='',mode:WishMode='taste';
 if(chapter===1){
  mode='taste';
  if(early){sentence='I like '+food+'.';intent='like';cue=firstTr.bare+' sevdiğini söyle.';explanation='I like + yiyecek, bir beğeni bildirir.';}
  else if(a1){intent=variant%2?'dislike':'like';kind=intent==='dislike'?'negative':'preference';
   sentence=intent==='dislike'?'I do not like '+food+'.':'I really like '+food+'.';
   cue=firstTr.bare+(intent==='dislike'?' sevmediğini':' çok sevdiğini')+' anlat.';
   explanation='I do not like = sevmem. I really like = çok severim.';}
  else{
   intent=variant%2?'dislike':'like';kind=intent==='dislike'?'negative':'reason';
   sentence=intent==='dislike'?'I do not like '+food+'.':
    support?'I like '+food+' because they are '+first.trait+'.':
      'I really like '+food+' because they are '+first.trait+'.';
   cue=firstTr.bare+(intent==='dislike'?' sevmediğini anlat.':' '+first.traitTr+' oldukları için sevdiğini anlat.');
   explanation='Not olumsuzluk, because neden-sonuç anlamı oluşturur.';
  }
 }else if(chapter===2){
  mode='order';intent='want';kind=early?'request':'question';
  if(early){sentence='I want '+food+', please.';cue='Kibarca '+firstTr.bare+' istediğini söyle.';}
  else if(a1){sentence='Can I have some '+food+', please?';cue='Kibarca biraz '+firstTr.bare+' iste.';intent='polite';}
  else {sentence=support?'Can I have some '+food+', please?':'Could I have some '+food+', please?';
    cue='Kibarca biraz '+firstTr.bare+' iste.';intent='polite';}
  explanation=early?'Please rica ederken kullanılır.':'Can/Could I have ... please? kibarca rica etmenin bir yoludur.';
 }else if(chapter===3){
  mode='dialogue';
  if(early){
   intent=variant%2?'want':'like';kind=intent==='want'?'request':'preference';
   sentence='I '+(intent==='want'?'want ':'like ')+food+'.';
   cue='Konuğun sorusuna cevap ver: '+firstTr.bare+(intent==='want'?' istediğini':' sevdiğini')+' söyle.';
   explanation='Want = istemek, like = sevmek. Sorunun amacına göre farklı cümle kur.';
  } else if(a1){
   intent=variant%3===0?'polite':variant%3===1?'like':'dislike';
   kind=intent==='polite'?'request':intent==='dislike'?'negative':'preference';
   sentence=intent==='dislike'?'I do not like '+food+'.':
     intent==='polite'?'I would like some '+food+'.':'Yes, I like '+food+'.';
   cue=firstTr.bare+(intent==='dislike'?' sevmediğini':intent==='polite'?' rica ettiğini':' sevdiğini')+' söyle.';
   explanation='Would like kibar bir istek, do not like olumsuz tercih belirtir.';
  }else{
   intent=variant%3===0?'polite':variant%3===1?'like':'dislike';
   kind=intent==='dislike'?'negative':intent==='polite'?'request':'reason';
   sentence=intent==='dislike'?'No, I do not like '+food+'.':
    intent==='polite'?'I would like some '+food+', please.':
    'I like '+food+' because they are '+first.trait+'.';
   cue=firstTr.bare+(intent==='dislike'?' sevmediğini':intent==='polite'?' kibarca istediğini':' '+first.traitTr+' oldukları için sevdiğini')+' söyle.';
   explanation='No olumsuz cevabı, would like kibar isteği, because nedeni belirtir.';
  }
 }else{
  mode='festival';intent='prefer';
  if(early){
   sentence='I like '+food+' and '+second+'.';
   cue=firstTr.bare+' ve '+otherTr.bare+' sevdiğini anlat.';
   kind='preference';explanation='And iki sevdiğimiz şeyi birleştirir.';
  }else if(a1){
   sentence=ageYoung?'I want '+food+', but not '+second+'.':
    'I want '+food+', but I do not want '+second+'.';
   cue=firstTr.bare+' istediğini ama '+otherTr.bare+' istemediğini söyle.';
   kind='contrast';explanation='But bir isteği diğerinden ayırır; not istemediğin şeyi söyler.';
  }else{
   sentence=ageYoung?'I like '+food+' because they are '+first.trait+'.':
    'I prefer '+food+' to '+second+' because they are '+first.trait+'.';
   cue=ageYoung?firstTr.bare+' '+first.traitTr+' olduğu için sevdiğini anlat.':
    firstTr.acc+' '+otherTr.dat+' tercih ettiğini, çünkü '+first.traitTr+' olduğunu söyle.';
   kind='reason';explanation='Prefer ... to ... bir tercihi karşılaştırır; because gerekçesini açıklar.';
  }
 }
 const tokens=normalizeWords(sentence);
 const ageBand=ageYoung?'junior':grade!=null&&grade>=3&&grade<=4?'middle':'senior';
 const id='wish:v1:'+chapter+':'+level+':'+ageBand+':'+guest+':'+food+':'+second+':'+intent;
 const scene:PlazaSceneEffect={actor:'apple',action:intent==='dislike'?'remove':'celebrate',food:food};
 const question:PlazaQuestion={
   id,mission:5,skill:'preference',englishLevel:level,
   kind,mode:'construct',cue,scene,sentence,tokens,
   decoys:['want','like','not','are','do','because','but','please','have','some']
    .filter(w=>!tokens.includes(w)).slice(0,3),
   explanation,vocabulary:[{en:food,tr:first.tr},{en:second,tr:other.tr},
    {en:first.trait,tr:first.traitTr}]
 };
 return {id,chapter,mode,guest,food,second,intent,sentence,question,
  reason:first.trait,targetCount:chapter===4&&!(a2&&ageYoung)?2:1};
}
// A2 grammar is gated by placement; younger classes see shortened, meaningful versions.
function A1_CAP(level:EnglishPlacement,young:boolean){return level==='A2'&&young;}
export function wishFestivalPool(level:EnglishPlacement,grade:number|null):WishTrial[]{
 if(!['Pre-A1','A1','A2'].includes(level))throw Error('Invalid English level');
 const generated:WishTrial[]=[];
 for(let chapter=1 as WishChapter;chapter<=4;chapter=(chapter+1) as WishChapter){
  for(let i=0;i<WISH_FOODS.length;i++)for(let j=0;j<WISH_GUESTS.length;j++){
   const one=WISH_FOODS[i].id,second=WISH_FOODS[(i+j+1)%WISH_FOODS.length].id;
   if(one===second)continue;
   const trial=author(chapter,level,grade,WISH_GUESTS[j].id,one,second,i+j);
   if(trial.question.tokens.length<=wishWordsForGrade(grade))generated.push(trial);
  }
 }
 return generated;
}
export function planWishFestival(input:{
 grade:number|null;englishLevel:EnglishPlacement;seed:number;
 history?:readonly SentenceAnswerEvidence[];knownFoods?:readonly string[];
}):WishPlan{
 const {grade,englishLevel,seed}=input,per=wishRoundsForGrade(grade);
 const random=F(seed^0x2b41eac),pool=wishFestivalPool(englishLevel,grade);
 const history=input.history??[],weak=new Set(history.filter(x=>!x.firstTryCorrect||x.hintUsed).map(x=>x.questionId));
 const seen=new Set(history.map(x=>x.questionId));
 const familiar=new Set((input.knownFoods??[]).map(x=>x.toLowerCase()));
 const trials:WishTrial[]=[];
 for(let chapter=1 as WishChapter;chapter<=4;chapter=(chapter+1) as WishChapter){
  const choices=shuffle(pool.filter(t=>t.chapter===chapter),random);
  const tieBreak=new Map(choices.map(t=>[t.id,random()]));
  const usedFoods=new Set<WishFood>(),usedGuests=new Set<WishGuest>();
  const chosen:WishTrial[]=[];
  const rank=(t:WishTrial)=>{
   const term=weak.has(t.id)?0:seen.has(t.id)?8:3;
   return term+(usedFoods.has(t.food)?5:0)+(usedGuests.has(t.guest)?1.4:0)
    -(familiar.has(t.food)?1:0)+(tieBreak.get(t.id)??0)*.05;
  };
  while(chosen.length<per){
   const next=choices.filter(t=>!chosen.some(c=>c.sentence===t.sentence))
    .sort((a,b)=>rank(a)-rank(b))[0];
   if(!next)throw Error('İstekler Meydanı: yetersiz benzersiz dil görevi');
   chosen.push(next);usedFoods.add(next.food);usedGuests.add(next.guest);
   choices.splice(choices.indexOf(next),1);
  }
  trials.push(...chosen);
 }
 return {deck:{mission:5,grade,englishLevel,seed,questions:trials.map(t=>t.question)},
  trials,grade,englishLevel,roundsPerChapter:per,
  estimatedMinutes:per===3?[8,12]:per===4?[11,16]:[14,19]};
}
export function checkWishFood(t:WishTrial,id:WishFood):boolean{return t.food===id;}
export function checkWishSecond(t:WishTrial,id:WishFood):boolean{return t.second===id;}
export function checkWishIntent(t:WishTrial,intent:WishIntent):boolean{return t.intent===intent;}
export function checkWishSentence(t:WishTrial,words:readonly string[]):boolean{
 return words.length===t.question.tokens.length&&words.every((w,i)=>w===t.question.tokens[i]);
}
export function wishIntentOptions(level:EnglishPlacement):readonly {id:WishIntent;en:string;tr:string}[]{
 return level==='Pre-A1'
  ?[{id:'like',en:'I like',tr:'seviyorum'},{id:'want',en:'I want',tr:'istiyorum'},{id:'dislike',en:'not like',tr:'sevmiyorum'}]
  :[{id:'like',en:'I like',tr:'seviyorum'},{id:'dislike',en:'I do not like',tr:'sevmiyorum'},
    {id:'want',en:'I want',tr:'istiyorum'},{id:'polite',en:'I would like',tr:'kibarca istiyorum'}];
}
