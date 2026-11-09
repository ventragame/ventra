/**
 * Hikâye Ormanı • Game 3: Hikâye Dedektifi
 * Authored listen → collect multiple clues → infer the location → resolution.
 * All places have 3 meaningfully different, visually illustrated evidence clues.
 * No network requests, generated prose, invisible targets or text-only choices.
 */
import type {ForestActorId,ForestEpisode,ForestPlacement,ForestScene} from './storyForestEngine.ts';

export type DetectiveClueId=
 'flower'|'butterfly'|'mushroom'|
 'fish'|'lily'|'water'|
 'book'|'window'|'lantern'|
 'leaf'|'acorn'|'footprints'|
 'bridge'|'stone'|'river'|
 'tent'|'star'|'moon';
export type DetectiveItemId='apple'|'balloon'|'star'|'book'|'flower';
export type DetectiveStage='intro'|'evidence'|'location'|'ending';

export interface DetectiveChapter{
 episode:ForestEpisode;title:string;start:ForestScene;
 hero:ForestActorId;friend:ForestActorId;item:DetectiveItemId;
 /** Three alternate story resolutions; different across consecutive replays. */
 locations:readonly [ForestScene,ForestScene,ForestScene];
}
export interface DetectiveCase {
 id:string;chapter:DetectiveChapter;destination:ForestScene;
 clueIds:readonly [DetectiveClueId,DetectiveClueId,DetectiveClueId];
}
export interface DetectivePlan{
 chosen:DetectiveCase;englishLevel:ForestPlacement;gradeLevel:number|null;
 seed:number;requiredClues:readonly DetectiveClueId[];
 clueChoices:readonly DetectiveClueId[];locationChoices:readonly ForestScene[];
 /** V2 episodes can prove every distinct visual/story action before rewards. */
 storyVersion?:2;storyId?:string;
 storySteps?:readonly {id:string;acceptedIds:readonly string[];choices:readonly string[]}[];
}
export interface DetectiveAnswer{
 clueId:DetectiveClueId;mistakes:number;hintUsed:boolean;firstTryCorrect:boolean;
}
export interface DetectiveRecord{
 caseId:string;episode:ForestEpisode;destination:ForestScene;
 placement:ForestPlacement;clues:DetectiveAnswer[];
 destinationMistakes:number;destinationHint:boolean;completedAt:string;
 storyId?:string;stepEvidence?:readonly {
  stepId:string;selectedId:string;mistakes:number;hintUsed:boolean;firstTryCorrect:boolean;
 }[];
}
export const DETECTIVE_GAME_ID='island_story_forest_detective';

export const DETECTIVE_CLUES:Readonly<Record<DetectiveClueId,{en:string;tr:string}>>={
 flower:{en:'pink flower',tr:'Pembe çiçek'},
 butterfly:{en:'butterfly',tr:'Kelebek'},
 mushroom:{en:'red mushroom',tr:'Kırmızı mantar'},
 fish:{en:'fish',tr:'Balık'},
 lily:{en:'water lily',tr:'Nilüfer'},
 water:{en:'water drop',tr:'Su damlası'},
 book:{en:'storybook',tr:'Hikâye kitabı'},
 window:{en:'small window',tr:'Pencere'},
 lantern:{en:'lantern',tr:'Fener'},
 leaf:{en:'green leaf',tr:'Yeşil yaprak'},
 acorn:{en:'acorn',tr:'Palamut'},
 footprints:{en:'footprints',tr:'Ayak izleri'},
 bridge:{en:'wooden bridge',tr:'Tahta köprü'},
 stone:{en:'smooth stone',tr:'Yuvarlak taş'},
 river:{en:'flowing river',tr:'Nehir'},
 tent:{en:'little tent',tr:'Çadır'},
 star:{en:'shining star',tr:'Parlayan yıldız'},
 moon:{en:'bright moon',tr:'Ay'}
};
export const DETECTIVE_SCENE_CLUES:Readonly<Record<ForestScene,readonly [
 DetectiveClueId,DetectiveClueId,DetectiveClueId
]>>={
 meadow:['flower','butterfly','mushroom'],
 pond:['fish','lily','water'],
 treehouse:['book','window','lantern'],
 path:['leaf','acorn','footprints'],
 bridge:['bridge','stone','river'],
 camp:['tent','star','moon']
};
export const DETECTIVE_SCENE_LABELS:Readonly<Record<ForestScene,string>>={
 path:'Yaprak Patikası',treehouse:'Ağaç Ev',pond:'Gölet',
 meadow:'Çiçek Vadisi',camp:'Yıldız Kampı',bridge:'Işık Köprüsü'
};
const HERO_NAMES:Readonly<Record<ForestActorId,string>>={
 rabbit:'rabbit',fox:'fox',bird:'blue bird',bear:'bear',deer:'deer',
 squirrel:'squirrel',cat:'orange cat',dog:'dog',fish:'fish',
 butterfly:'butterfly',hedgehog:'hedgehog',
 cat_gray_sleeping:'grey cat',cat_white_bow:'white kitten',
 rabbit_reading:'rabbit',bear_sleeping:'bear',fox_running:'fox',
 bird_flying:'blue bird',rabbit_tree:'rabbit',rabbit_rock:'rabbit',
 rabbit_pond:'rabbit',red_apple:'apple',yellow_star:'star',
 blue_balloon:'balloon',pink_flower:'flower',purple_flower:'flower',
 green_leaf:'leaf'
};
const ITEM_NAMES:Readonly<Record<DetectiveItemId,string>>={
 apple:'red apple',balloon:'blue balloon',star:'golden star',
 book:'storybook',flower:'pink flower'
};
const DESTINATION_EN:Readonly<Record<ForestScene,string>>={
 path:'forest path',treehouse:'tree house',pond:'pond',
 meadow:'flower meadow',camp:'starry campsite',bridge:'wooden bridge'
};
export const DETECTIVE_CHAPTERS:readonly DetectiveChapter[]=Object.freeze([
 {episode:1,title:'Kayıp Piknik',start:'path',
  hero:'rabbit',friend:'hedgehog',item:'apple',locations:['meadow','pond','treehouse']},
 {episode:2,title:'Uçan Balon',start:'treehouse',
  hero:'cat',friend:'bird',item:'balloon',locations:['bridge','meadow','path']},
 {episode:3,title:'Parlayan Yıldız',start:'pond',
  hero:'bird',friend:'squirrel',item:'star',locations:['treehouse','bridge','meadow']},
 {episode:4,title:'Kayıp Masal',start:'meadow',
  hero:'hedgehog',friend:'cat_white_bow',item:'book',locations:['treehouse','path','pond']},
 {episode:5,title:'Gece Sırrı',start:'camp',
  hero:'cat_gray_sleeping',friend:'rabbit',item:'star',locations:['path','bridge','treehouse']},
 {episode:6,title:'Çiçeklerin İzi',start:'bridge',
  hero:'squirrel',friend:'bird',item:'flower',locations:['pond','meadow','treehouse']}
] as DetectiveChapter[]);
export const DETECTIVE_CASES:readonly DetectiveCase[]=Object.freeze(
 DETECTIVE_CHAPTERS.flatMap(ch=>ch.locations.map((destination,index)=>
  Object.freeze({id:'detective-'+ch.episode+'-'+(index+1),
   chapter:ch,destination,clueIds:DETECTIVE_SCENE_CLUES[destination]})))
);

function randomize<T>(items:readonly T[],seed:number):T[]{
 let state=seed>>>0;const copy=[...items];
 for(let i=copy.length-1;i>0;i--){
  state=(Math.imul(state^state>>>16,1664525)+1013904223)>>>0;
  const j=state%(i+1);[copy[i],copy[j]]=[copy[j],copy[i]];
 }
 return copy;
}
export function clueCountForGrade(grade:number|null|undefined):2|3{
 return grade!==null&&grade!==undefined&&grade>=5&&grade<=8?3:2;
}
export function evidenceChoiceCountForGrade(grade:number|null|undefined):4|5{
 return grade!==null&&grade!==undefined&&grade>=3&&grade<=8?5:4;
}
export function planDetectiveCase(input:{
 episode:ForestEpisode;gradeLevel:number|null;englishLevel:ForestPlacement;
 seed:number;playCount:number;
}):DetectivePlan{
 if(!Number.isInteger(input.episode)||input.episode<1||input.episode>6||
    !['Pre-A1','A1','A2'].includes(input.englishLevel)||
    !Number.isInteger(input.playCount)||input.playCount<0)
   throw new Error('Geçersiz dedektif bölümü.');
 const chapter=DETECTIVE_CHAPTERS[input.episode-1];
 // Sequential replays cycle through three different meaningful resolutions.
 const next=DETECTIVE_CASES.find(c=>c.chapter.episode===chapter.episode&&
   c.destination===chapter.locations[input.playCount%chapter.locations.length]);
 if(!next)throw new Error('Dedektif vakası bulunamadı.');
 const seed=Number.isFinite(input.seed)?input.seed>>>0:0;
 const count=clueCountForGrade(input.gradeLevel);
 const requiredClues=randomize(next.clueIds,seed+97).slice(0,count);
 const wrong=Object.keys(DETECTIVE_CLUES).filter(
   id=>!next.clueIds.includes(id as DetectiveClueId)) as DetectiveClueId[];
 // Target scene never contains a contradictory "fake" clue in its evidence set.
 const choices=randomize([
  ...requiredClues,
  ...randomize(wrong,seed+23).slice(0,evidenceChoiceCountForGrade(input.gradeLevel)-count)
 ],seed+131);
 const destinations=randomize(chapter.locations,seed+211);
 return {chosen:next,gradeLevel:input.gradeLevel,englishLevel:input.englishLevel,
  seed,requiredClues,clueChoices:choices,locationChoices:destinations};
}

function joinClues(ids:readonly DetectiveClueId[]):string{
 const names=ids.map(id=>'the '+DETECTIVE_CLUES[id].en);
 if(names.length<=1)return names[0]??'a clue';
 return names.slice(0,-1).join(', ')+' and '+names.at(-1);
}
export function detectiveNarration(plan:DetectivePlan,stage:DetectiveStage):string{
 const {chosen,requiredClues,englishLevel}=plan;
 const hero=HERO_NAMES[chosen.chapter.hero];
 const item=ITEM_NAMES[chosen.chapter.item];
 const scene=DESTINATION_EN[chosen.destination];
 const article=/^[aeiou]/i.test(hero)?'An':'A';
 if(stage==='intro'){
  if(englishLevel==='Pre-A1')return article+' '+hero+' lost a '+item+'. Oh no! Can you help?';
  if(englishLevel==='A1')return article+' '+hero+' has lost a '+item+
    ' in the forest. Your mission is to help find it.';
  return 'Something has gone missing during the forest adventure! '+
    article+' '+hero+' cannot find a '+item+
    '. Let us work together to follow the evidence and solve the mystery.';
 }
 if(stage==='evidence'){
  const evidence=joinClues(requiredClues);
  if(englishLevel==='Pre-A1')return 'Look carefully! Find '+evidence+'.';
  if(englishLevel==='A1')return 'The forest friends remember seeing '+evidence+
    '. Look at the pictures and collect those clues.';
  return 'Before the object disappeared, the friends noticed '+evidence+
    '. Identify all of these clues to discover where they should search.';
 }
 if(stage==='location'){
  if(englishLevel==='Pre-A1')return 'Good clues! Where should we go?';
  if(englishLevel==='A1')return 'Great detective work! Which forest place matches the clues you found?';
  return 'You have collected all the evidence. Think about which of these three places '+
   'best fits the clues, then choose where the friends should investigate.';
 }
 if(englishLevel==='Pre-A1')return 'We found the '+item+' at the '+scene+'! Hooray!';
 if(englishLevel==='A1')return 'The friends follow the clues to the '+scene+
   '. There is the '+item+'! The mystery is solved.';
 return 'By following the evidence, the friends arrive at the '+scene+
  '. They discover the missing '+item+' and celebrate solving the forest mystery together.';
}

export function validateDetectiveRecord(record:DetectiveRecord,plan:DetectivePlan):boolean{
 if(!record||record.caseId!==plan.chosen.id||
  record.episode!==plan.chosen.chapter.episode||
  record.destination!==plan.chosen.destination||
  record.placement!==plan.englishLevel||
  !Number.isInteger(record.destinationMistakes)||record.destinationMistakes<0||
  typeof record.destinationHint!=='boolean'||
  typeof record.completedAt!=='string'||!Number.isFinite(Date.parse(record.completedAt))||
  !Array.isArray(record.clues)||record.clues.length!==plan.requiredClues.length)return false;
 const ids=new Set(record.clues.map(a=>a.clueId));
 if(ids.size!==plan.requiredClues.length||!plan.requiredClues.every(id=>ids.has(id)))return false;
 if(!record.clues.every(a=>
  Number.isInteger(a.mistakes)&&a.mistakes>=0&&
  typeof a.hintUsed==='boolean'&&
  a.firstTryCorrect===(a.mistakes===0&&!a.hintUsed)))return false;
 if(plan.storyVersion!==2)return !record.storyId&&!record.stepEvidence;
 if(!plan.storyId||!plan.storySteps||record.storyId!==plan.storyId||
  !Array.isArray(record.stepEvidence)||
  record.stepEvidence.length!==plan.storySteps.length)return false;
 const seen=new Set(record.stepEvidence.map(s=>s.stepId));
 if(seen.size!==plan.storySteps.length)return false;
 const valid=plan.storySteps.every((expected,index)=>{
  const row=record.stepEvidence?.[index];
  return !!row&&row.stepId===expected.id&&
   expected.acceptedIds.includes(row.selectedId)&&
   expected.choices.includes(row.selectedId)&&
   Number.isInteger(row.mistakes)&&row.mistakes>=0&&
   typeof row.hintUsed==='boolean'&&
   row.firstTryCorrect===(row.mistakes===0&&!row.hintUsed);
 });
 if(!valid)return false;
 const clueSteps=record.stepEvidence.filter(row=>plan.requiredClues.includes(row.selectedId as DetectiveClueId)&&
  plan.storySteps?.some(expected=>expected.id===row.stepId&&
   expected.acceptedIds.length===1));
 return plan.requiredClues.every(id=>{
  const legacy=record.clues.find(a=>a.clueId===id);
  return !!legacy&&clueSteps.some(step=>step.selectedId===id&&
   step.mistakes===legacy.mistakes&&step.hintUsed===legacy.hintUsed&&
   step.firstTryCorrect===legacy.firstTryCorrect);
 })&&record.stepEvidence.some(row=>row.selectedId===plan.chosen.destination&&
  row.mistakes===record.destinationMistakes&&row.hintUsed===record.destinationHint);
}
export function detectiveStars(record:DetectiveRecord):1|2|3{
 const steps=record.stepEvidence;
 if(steps?.length){
  const mistakes=steps.reduce((n,a)=>n+a.mistakes,0);
  const hints=steps.filter(a=>a.hintUsed).length;
  return !mistakes&&!hints?3:mistakes<=2&&hints<=1?2:1;
 }
 const mistakes=record.destinationMistakes+
   record.clues.reduce((n,a)=>n+a.mistakes,0);
 const hints=Number(record.destinationHint)+record.clues.filter(a=>a.hintUsed).length;
 return !mistakes&&!hints?3:mistakes<=2&&hints<=1?2:1;
}
