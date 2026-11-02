import type {FamilyAnswerEvidence} from '@ventra/shared';
import {resolveVocabularyTier,type EnglishPlacement} from './gradeAwareLearningPolicy.ts';

export type VillageDistrict='family'|'rooms'|'objects'|'routines';
export type VillageStage=1|2|3|4|5;
export type VillageWord={
 id:string;tr:string;icon:string;district:VillageDistrict;tier:0|1|2;
 phrase:string;command:string;
};
type WordTuple=readonly [id:string,tr:string,icon:string,tier:0|1|2,phrase:string,command:string];
const section=(district:VillageDistrict,items:readonly WordTuple[]):VillageWord[]=>
 items.map(([id,tr,icon,tier,phrase,command])=>({id,tr,icon,tier,phrase,command,district}));

/** Sixty curriculum-reviewed English concepts: family, rooms, objects, everyday actions. */
export const VILLAGE_WORDS:readonly VillageWord[]=[
 ...section('family',[
  ['mother','Anne','👩',0,'This is my mother.','Find my mother.'],
  ['father','Baba','👨',0,'This is my father.','Find my father.'],
  ['sister','Kız kardeş','👧',0,'This is my sister.','Find my sister.'],
  ['brother','Erkek kardeş','👦',0,'This is my brother.','Find my brother.'],
  ['baby','Bebek','👶',0,'This is the baby.','Find the baby.'],
  ['grandmother','Büyükanne','👵',0,'This is my grandmother.','Find my grandmother.'],
  ['grandfather','Büyükbaba','👴',0,'This is my grandfather.','Find my grandfather.'],
  ['family','Aile','👨‍👩‍👧‍👦',0,'This is my family.','Find my family.'],
  ['aunt','Teyze / hala','👩‍🦰',1,'This is my aunt.','Find my aunt.'],
  ['uncle','Amca / dayı','👨‍🦱',1,'This is my uncle.','Find my uncle.'],
  ['cousin','Kuzen','🧒',1,'This is my cousin.','Find my cousin.'],
  ['parents','Anne ve baba','👨‍👩‍👧',1,'These are my parents.','Find my parents.'],
  ['daughter','Kız evlat','👧🏻',2,'This is my daughter.','Find my daughter.'],
  ['son','Erkek evlat','👦🏻',2,'This is my son.','Find my son.'],
  ['grandchild','Torun','👶🏻',2,'This is my grandchild.','Find my grandchild.']
 ]),
 ...section('rooms',[
  ['kitchen','Mutfak','🍳',0,'This is the kitchen.','Go to the kitchen.'],
  ['bedroom','Yatak odası','🛏️',0,'This is the bedroom.','Go to the bedroom.'],
  ['bathroom','Banyo','🛁',0,'This is the bathroom.','Go to the bathroom.'],
  ['living room','Oturma odası','🛋️',0,'This is the living room.','Go to the living room.'],
  ['garden','Bahçe','🌻',0,'This is the garden.','Go to the garden.'],
  ['dining room','Yemek odası','🍽️',0,'This is the dining room.','Go to the dining room.'],
  ['hallway','Koridor','🚪',0,'This is the hallway.','Go to the hallway.'],
  ['balcony','Balkon','🪴',0,'This is the balcony.','Go to the balcony.'],
  ['study','Çalışma odası','📚',1,'This is the study.','Go to the study.'],
  ['garage','Garaj','🚗',1,'This is the garage.','Go to the garage.'],
  ['attic','Çatı katı','🏚️',1,'This is the attic.','Go to the attic.'],
  ['basement','Bodrum','🧱',1,'This is the basement.','Go to the basement.'],
  ['laundry room','Çamaşır odası','🧺',2,'This is the laundry room.','Go to the laundry room.'],
  ['guest room','Misafir odası','🛌',2,'This is the guest room.','Go to the guest room.'],
  ['stairs','Merdiven','🪜',2,'These are the stairs.','Find the stairs.']
 ]),
 ...section('objects',[
  ['door','Kapı','🚪',0,'I can see a door.','Touch the door.'],
  ['window','Pencere','🪟',0,'I can see a window.','Touch the window.'],
  ['table','Masa','🪑',0,'I can see a table.','Touch the table.'],
  ['chair','Sandalye','💺',0,'I can see a chair.','Touch the chair.'],
  ['bed','Yatak','🛏️',0,'I can see a bed.','Touch the bed.'],
  ['lamp','Lamba','💡',0,'I can see a lamp.','Touch the lamp.'],
  ['sofa','Kanepe','🛋️',0,'I can see a sofa.','Touch the sofa.'],
  ['clock','Saat','🕰️',0,'I can see a clock.','Touch the clock.'],
  ['mirror','Ayna','🪞',1,'I can see a mirror.','Touch the mirror.'],
  ['bookshelf','Kitaplık','📚',1,'I can see a bookshelf.','Touch the bookshelf.'],
  ['fridge','Buzdolabı','🧊',1,'I can see a fridge.','Touch the fridge.'],
  ['sink','Lavabo','🚰',1,'I can see a sink.','Touch the sink.'],
  ['pillow','Yastık','🛌',2,'I can see a pillow.','Touch the pillow.'],
  ['wardrobe','Gardırop','🚪',2,'I can see a wardrobe.','Touch the wardrobe.'],
  ['carpet','Halı','🧶',2,'I can see a carpet.','Touch the carpet.']
 ]),
 ...section('routines',[
  ['wake up','Uyanmak','🌅',0,'I wake up.','Show me: wake up.'],
  ['brush my teeth','Dişlerimi fırçalamak','🪥',0,'I brush my teeth.','Show me: brush my teeth.'],
  ['wash my face','Yüzümü yıkamak','🧼',0,'I wash my face.','Show me: wash my face.'],
  ['get dressed','Giyinmek','👕',0,'I get dressed.','Show me: get dressed.'],
  ['eat breakfast','Kahvaltı etmek','🥞',0,'I eat breakfast.','Show me: eat breakfast.'],
  ['go to school','Okula gitmek','🎒',0,'I go to school.','Show me: go to school.'],
  ['read a book','Kitap okumak','📖',0,'I read a book.','Show me: read a book.'],
  ['go to bed','Yatmak','🌙',0,'I go to bed.','Show me: go to bed.'],
  ['do homework','Ödev yapmak','✏️',1,'I do homework.','Show me: do homework.'],
  ['have lunch','Öğle yemeği yemek','🍱',1,'I have lunch.','Show me: have lunch.'],
  ['play outside','Dışarıda oynamak','🛝',1,'I play outside.','Show me: play outside.'],
  ['take a shower','Duş almak','🚿',1,'I take a shower.','Show me: take a shower.'],
  ['tidy my room','Odamı toplamak','🧺',2,'I tidy my room.','Show me: tidy my room.'],
  ['help at home','Ev işlerine yardım etmek','🧹',2,'I help at home.','Show me: help at home.'],
  ['have dinner','Akşam yemeği yemek','🍽️',2,'I have dinner.','Show me: have dinner.']
 ])
];

export const VILLAGE_DISTRICTS=[
 {id:'family',title:'Aile Evi',subtitle:'My Family',icon:'🏡',color:'#f3b7a9'},
 {id:'rooms',title:'Oda Kaşifleri',subtitle:'Rooms & Places',icon:'🚪',color:'#f5d398'},
 {id:'objects',title:'Eşya Avı',subtitle:'Things at Home',icon:'🪑',color:'#b7daeb'},
 {id:'routines',title:'Bir Günüm',subtitle:'Daily Routines',icon:'🌞',color:'#c7b5f0'}
] as const;
export const VILLAGE_STAGES=[
 {stage:1,title:'Evi Keşfet',kind:'discovery',icon:'🔎',description:'Yeni İngilizce kelimeleri gör ve dinle.'},
 {stage:2,title:'Kelimeyi Hatırla',kind:'recognition',icon:'🔠',description:'Türkçe anlamı için İngilizce kelimeyi seç.'},
 {stage:3,title:'Kim Konuşuyor?',kind:'listening',icon:'🎧',description:'İngilizce sesi dinle ve doğru nesneyi bul.'},
 {stage:4,title:'Evin İçinde Bul',kind:'context',icon:'🏠',description:'İngilizce yönergeyi gerçek sahnede uygula.'},
 {stage:5,title:'Günlük Konuşma',kind:'dialogue',icon:'💬',description:'Doğru İngilizce ifadeyle cevap ver.'}
] as const;
export const VILLAGE_GAME_ID='island_word_garden_family';
export const VILLAGE_TOTAL=20;
export const VILLAGE_OFFSETS:Record<VillageDistrict,number>={family:0,rooms:5,objects:10,routines:15};
export const VILLAGE_KINDS=['discovery','recognition','listening','context','dialogue'] as const;

export type VillageQuestion={target:string;options:string[];prompt:string;audio:string};
export type VillagePlan={district:VillageDistrict;stage:VillageStage;words:string[];questions:VillageQuestion[]};

const random=(seed:number)=>{let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}};
function shuffle<T>(input:readonly T[],rng:()=>number):T[]{
 const a=[...input];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
}
export function villageWord(id:string):VillageWord{
 const word=VILLAGE_WORDS.find(x=>x.id===id);
 if(!word)throw Error('Unknown village word '+id);
 return word;
}
export function eligibleVillageWords(district:VillageDistrict,grade:number|null|undefined,level:EnglishPlacement):VillageWord[]{
 const tier=resolveVocabularyTier(grade,level);
 return VILLAGE_WORDS.filter(w=>w.district===district&&w.tier<=tier);
}
export function villageResumePoint(completed:Record<VillageDistrict,number>){
 const district:VillageDistrict=completed.family<5?'family':completed.rooms<5?'rooms':completed.objects<5?'objects':'routines';
 return {district,stage:Math.min(5,completed[district]+1) as VillageStage};
}
export function planVillageMission(args:{district:VillageDistrict;stage:VillageStage;gradeLevel?:number|null;
 englishLevel:EnglishPlacement;history:readonly FamilyAnswerEvidence[];seed:number}):VillagePlan{
 const {district,stage,gradeLevel,englishLevel,history,seed}=args;
 if(!(district in VILLAGE_OFFSETS)||!VILLAGE_STAGES.some(s=>s.stage===stage)||!Number.isFinite(seed))throw Error('Invalid village mission');
 const rng=random(seed);const all=eligibleVillageWords(district,gradeLevel,englishLevel);
 const seen=new Set(history.filter(a=>a.kind==='discovery').map(a=>a.wordId));
 const known=all.filter(w=>seen.has(w.id));
 const pool=stage===1?all:known.length>=4?known:all;
 const prioritised=shuffle(pool,rng).sort((a,b)=>{
  if(stage===1)return Number(seen.has(a.id))-Number(seen.has(b.id));
  const score=(word:VillageWord)=>{
   const recent=history.filter(x=>x.wordId===word.id&&x.kind!=='discovery').slice(-4);
   return recent.length===0?1:recent.some(x=>x.mistakes>0||x.hintUsed||!x.firstTryCorrect)?5+recent.filter(x=>x.mistakes>0||x.hintUsed).length:0;
  };
  return score(b)-score(a);
 });
 const words=prioritised.slice(0,gradeLevel!=null&&gradeLevel<=2?6:8).map(x=>x.id);
 if(stage===1)return {district,stage,words,questions:[]};
 const count=gradeLevel!=null&&gradeLevel<=2?4:6;
 const sequence=shuffle(Array.from({length:count},(_,i)=>words[i%words.length]),rng);
 return {district,stage,words,questions:sequence.map(id=>{
  const word=villageWord(id),options=shuffle([id,...shuffle(all.filter(w=>w.id!==id),rng).slice(0,2).map(w=>w.id)],rng);
  return {target:id,options,prompt:stage===2?word.tr:
    stage===3?'Listen carefully':stage===4?word.command:word.tr,
    audio:stage===3?word.id:stage===4?word.command:word.phrase};
 })};
}
export function validVillageAnswers(v:unknown):v is FamilyAnswerEvidence[]{
 return Array.isArray(v)&&v.every(x=>x&&typeof x.wordId==='string'&&
  VILLAGE_WORDS.some(w=>w.id===x.wordId)&&VILLAGE_KINDS.includes(x.kind)&&
  Number.isInteger(x.mistakes)&&x.mistakes>=0&&
  typeof x.hintUsed==='boolean'&&typeof x.firstTryCorrect==='boolean'&&
  typeof x.timestamp==='string'&&Number.isFinite(Date.parse(x.timestamp)));
}
