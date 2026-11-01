import type {FoodAnswerEvidence} from '@ventra/shared';
import type {EnglishPlacement} from './gradeAwareLearningPolicy.ts';

export type MarketAisle='orchard'|'bakery'|'cafe';
export type MarketStage=1|2|3|4|5;
export type FoodWord={id:string;tr:string;icon:string;aisle:MarketAisle;tier:0|1|2;category:'food'|'drink'};
const catalog=(aisle:MarketAisle,items:readonly [string,string,string,0|1|2,('food'|'drink')?][]):FoodWord[]=>items.map(([id,tr,icon,tier,category])=>({id,tr,icon,tier,aisle,category:category??'food'}));
/** Curated, hand-translated English vocabulary. Each aisle has 15 distinct items. */
export const MARKET_WORDS:readonly FoodWord[]=[
 ...catalog('orchard',[
  ['apple','Elma','🍎',0],['banana','Muz','🍌',0],['orange','Portakal','🍊',0],
  ['strawberry','Çilek','🍓',0],['grapes','Üzüm','🍇',0],['watermelon','Karpuz','🍉',0],
  ['carrot','Havuç','🥕',0],['tomato','Domates','🍅',0],['pear','Armut','🍐',1],
  ['lemon','Limon','🍋',1],['peach','Şeftali','🍑',1],['cherries','Kiraz','🍒',1],
  ['potato','Patates','🥔',2],['cucumber','Salatalık','🥒',2],['onion','Soğan','🧅',2]
 ]),
 ...catalog('bakery',[
  ['bread','Ekmek','🍞',0],['cake','Pasta','🍰',0],['cookie','Kurabiye','🍪',0],
  ['donut','Donut','🍩',0],['cheese','Peynir','🧀',0],['egg','Yumurta','🥚',0],
  ['pizza','Pizza','🍕',0],['sandwich','Sandviç','🥪',0],['croissant','Kruvasan','🥐',1],
  ['pancakes','Pankek','🥞',1],['butter','Tereyağı','🧈',1],['honey','Bal','🍯',1],
  ['muffin','Muffin','🧁',2],['pretzel','Simit benzeri pretzel','🥨',2],['bagel','Bagel','🥯',2]
 ]),
 ...catalog('cafe',[
  ['milk','Süt','🥛',0,'drink'],['water','Su','💧',0,'drink'],['juice','Meyve suyu','🧃',0,'drink'],
  ['tea','Çay','🍵',0,'drink'],['lemonade','Limonata','🍋',0,'drink'],
  ['soup','Çorba','🍲',0],['rice','Pirinç','🍚',0],['fish','Balık','🐟',0],
  ['smoothie','Smoothie','🥤',1,'drink'],['coffee','Kahve','☕',1,'drink'],
  ['pasta','Makarna','🍝',1],['chicken','Tavuk','🍗',1],
  ['cereal','Kahvaltılık gevrek','🥣',2],['beans','Fasulye','🫘',2],['salt','Tuz','🧂',2]
 ])
];
export const MARKET_AISLES=[
 {id:'orchard',title:'Meyve & Sebze Sokağı',subtitle:'Fresh fruit and vegetables',icon:'🍓',color:'#fbbf77'},
 {id:'bakery',title:'Fırın Meydanı',subtitle:'Bakery favourites',icon:'🥐',color:'#ffdfa1'},
 {id:'cafe',title:'Kafe & Sofra',subtitle:'Drinks and food',icon:'🥛',color:'#a7efda'}
] as const;
export const MARKET_STAGES=[
 {stage:1,title:'Tezgâhları Keşfet',skill:'discovery',icon:'🧺',description:'Ürünlere dokun, adını gör ve dinle.'},
 {stage:2,title:'Kelimeyi Bul',skill:'recognition',icon:'🔤',description:'Gördüğün ürünün İngilizce adını seç.'},
 {stage:3,title:'Dinle ve İşaret Et',skill:'listening',icon:'🎧',description:'İngilizce adı dinle, doğru ürünü seç.'},
 {stage:4,title:'Siparişi Anla',skill:'dialogue',icon:'💬',description:'Müşterinin İngilizce isteğini yerine getir.'},
 {stage:5,title:'Sepeti Doldur',skill:'application',icon:'🛒',description:'İngilizce alışveriş listesini tamamla.'}
] as const;
export const MARKET_GAME_ID='island_word_garden_food';
export const MARKET_TOTAL=15;
export const MARKET_OFFSETS:Record<MarketAisle,number>={orchard:0,bakery:5,cafe:10};
export const MARKET_KINDS=['discovery','recognition','listening','dialogue','application'] as const;
export type MarketQuestion={
 target:string;options:string[];
 prompt:string;audio:string;
 /** For final stage each pair belongs to one customer order. */
 orderPair?:number;
};
export type MarketPlan={
 aisle:MarketAisle;stage:MarketStage;words:string[];questions:MarketQuestion[];
};
function stableRandom(seed:number){
 let v=seed>>>0;
 return ()=>{v=(Math.imul(1664525,v)+1013904223)>>>0;return v/4294967296;};
}
function shuffled<T>(values:readonly T[],random:()=>number):T[]{
 const copy=[...values];
 for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}
 return copy;
}
export function eligibleMarketWords(aisle:MarketAisle,gradeLevel:number|null|undefined,englishLevel:EnglishPlacement):FoodWord[]{
 const grade=gradeLevel??0;
 const maxTier=englishLevel==='Pre-A1'||grade>0&&grade<=2?0:englishLevel==='A1'||grade>0&&grade<=4?1:2;
 return MARKET_WORDS.filter(x=>x.aisle===aisle&&x.tier<=maxTier);
}
const PLURAL_MARKET=new Set(['grapes','cherries','pancakes','beans']);
const MASS_MARKET=new Set(['bread','cheese','butter','honey','milk','water','juice','tea','lemonade','soup','rice','fish','smoothie','coffee','pasta','chicken','cereal','salt']);
/** Natural introductory shopping English; avoid "I want apple" or "a bread". */
export function marketNounPhrase(id:string):string{
 marketWord(id);
 return PLURAL_MARKET.has(id)||MASS_MARKET.has(id)?`some ${id}`:
 /^[aeiou]/.test(id)?`an ${id}`:`a ${id}`;
}
export function marketWord(id:string):FoodWord{
 const found=MARKET_WORDS.find(w=>w.id===id);if(!found)throw Error('Unknown market item: '+id);return found;
}
function priority(word:FoodWord,history:readonly FoodAnswerEvidence[]):number{
 const recent=history.filter(h=>h.wordId===word.id && h.kind!=='discovery').slice(-4);
 if(recent.length===0)return 1;
 const wrong=recent.filter(h=>h.mistakes>0||h.hintUsed||!h.firstTryCorrect).length;
 return wrong?5+wrong:0;
}
export function planMarketMission(input:{
 aisle:MarketAisle;stage:MarketStage;gradeLevel?:number|null;englishLevel:EnglishPlacement;
 history:readonly FoodAnswerEvidence[];seed:number
}):MarketPlan{
 const {aisle,stage,history,seed,gradeLevel,englishLevel}=input;
 if(!(aisle in MARKET_OFFSETS)||!MARKET_STAGES.some(x=>x.stage===stage)||!Number.isFinite(seed))throw Error('Invalid market plan');
 const rng=stableRandom(seed);
 const all=eligibleMarketWords(aisle,gradeLevel,englishLevel);
 const count=gradeLevel!==null&&gradeLevel!==undefined&&gradeLevel<=2?6:8;
 const discovered=new Set(history.filter(h=>h.kind==='discovery').map(h=>h.wordId));
 // First discovery has broad coverage; subsequent lessons prioritise missed items.
 const pool=stage===1?all:(all.filter(w=>discovered.has(w.id)).length>=4?
   all.filter(w=>discovered.has(w.id)):all);
 const ordered=shuffled(pool,rng).sort((a,b)=>{
  if(stage===1)return Number(discovered.has(a.id))-Number(discovered.has(b.id));
  return priority(b,history)-priority(a,history);
 });
 const active=ordered.slice(0,count);
 const words=active.map(w=>w.id);
 if(stage===1)return {aisle,stage,words,questions:[]};
 const rounds=stage===5?6:gradeLevel!=null&&gradeLevel<=2?4:6;
 const selected=Array.from({length:rounds},(_,i)=>active[i%active.length]);
 const sequence=shuffled(selected,rng);
 const questions=sequence.map((word,i)=>{
   const distractorPool=all.filter(w=>w.id!==word.id);
   const distractors=shuffled(distractorPool,rng).slice(0,2).map(w=>w.id);
   const options=shuffled([word.id,...distractors],rng);
   const customer=i%2===0?'I would like':'Can I have';
   const phrase=stage===4?`${customer} ${marketNounPhrase(word.id)}, please${i%2===0?'.':'?'}`:
      stage===5?`Find the ${word.id}.`:word.id;
   return {target:word.id,options,prompt:stage===2?'Choose the English name':
     stage===3?'Listen and find the item':phrase,
     audio:stage===3?word.id:phrase,
     ...(stage===5?{orderPair:Math.floor(i/2)}:{})};
 });
 return {aisle,stage,words,questions};
}
export function validMarketAnswers(answers:unknown):answers is FoodAnswerEvidence[]{
 return Array.isArray(answers)&&answers.every(x=>x&&typeof x.wordId==='string'&&
 MARKET_WORDS.some(w=>w.id===x.wordId)&&MARKET_KINDS.includes(x.kind)&&
 Number.isInteger(x.mistakes)&&x.mistakes>=0&&
 typeof x.firstTryCorrect==='boolean'&&
 typeof x.hintUsed==='boolean'&&
 Number.isFinite(Date.parse(x.timestamp)));
}
