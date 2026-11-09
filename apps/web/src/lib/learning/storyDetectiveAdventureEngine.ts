/**
 * Story Forest / Detective Adventure V2.
 *
 * Longer, coherent offline adventures assembled from authored story setups.
 * A child's choice at the crossroads determines the middle scenery and the
 * accompanying dialogue; neither is an invented answer or a visual duplicate.
 * 6 chapters × 4 authored setups × 3 destinations = 72 planning combinations,
 * with two genuine intermediate routes each. They are NOT 72 hand-written books.
 */
import {
 DETECTIVE_CHAPTERS,DETECTIVE_CLUES,DETECTIVE_SCENE_CLUES,planDetectiveCase,
 type DetectiveClueId,type DetectiveItemId,type DetectivePlan
} from './storyDetectiveEngine.ts';
import type {
 ForestActorId,ForestEpisode,ForestPlacement,ForestScene
} from './storyForestEngine.ts';

export type DetectiveAdventureStepKind=
 'friend'|'clue'|'crossroads'|'memory'|'destination'|'recover';
export type DetectiveAdventureScene=ForestScene|'chosenWaypoint';
export type DetectiveStoryTheme='lost'|'surprise'|'delivery'|'treasure';
export interface DetectiveStorySetup{
 hero:ForestActorId;friend:ForestActorId;item:DetectiveItemId;
 theme:DetectiveStoryTheme;
}
export interface DetectiveAdventureStep{
 id:string;kind:DetectiveAdventureStepKind;
 scene:DetectiveAdventureScene;
 target:string;
 acceptedIds:readonly string[];
 choices:readonly string[];
 /** 1-based clue index only when kind === 'clue'. */
 clueIndex?:number;
}
export interface DetectiveAdventurePlan extends DetectivePlan{
 storyVersion:2;storyId:string;setup:DetectiveStorySetup;
 waypoints:readonly [ForestScene,ForestScene];
 steps:readonly DetectiveAdventureStep[];
 storySteps:readonly {id:string;acceptedIds:readonly string[]}[];
 palette:'sunny'|'twilight'|'golden'|'misty';
}
export interface DetectiveStepAnswer{
 stepId:string;selectedId:string;mistakes:number;hintUsed:boolean;
 firstTryCorrect:boolean;
}
export type DetectiveStoryPhase='opening'|'step'|'ending';
const PREMIUM_FRIENDS:readonly ForestActorId[]=[
 'rabbit','squirrel','bird','cat','hedgehog','cat_white_bow'
];
const PREMIUM_ITEMS:readonly DetectiveItemId[]=[
 'apple','balloon','star','book','flower'
];
/** These setups are intentionally authored in complementary character pairs,
 * not randomly mismatched species or scenes.
 */
export const DETECTIVE_STORY_SETUPS:Readonly<Record<ForestEpisode,readonly [
 DetectiveStorySetup,DetectiveStorySetup,DetectiveStorySetup,DetectiveStorySetup
]>>={
 1:[
  {hero:'rabbit',friend:'hedgehog',item:'apple',theme:'lost'},
  {hero:'squirrel',friend:'bird',item:'flower',theme:'surprise'},
  {hero:'cat',friend:'rabbit',item:'book',theme:'delivery'},
  {hero:'cat_white_bow',friend:'hedgehog',item:'balloon',theme:'treasure'}
 ],
 2:[
  {hero:'cat',friend:'bird',item:'balloon',theme:'lost'},
  {hero:'hedgehog',friend:'squirrel',item:'star',theme:'surprise'},
  {hero:'rabbit',friend:'cat_white_bow',item:'flower',theme:'delivery'},
  {hero:'bird',friend:'cat',item:'book',theme:'treasure'}
 ],
 3:[
  {hero:'bird',friend:'squirrel',item:'star',theme:'lost'},
  {hero:'rabbit',friend:'hedgehog',item:'book',theme:'surprise'},
  {hero:'cat_white_bow',friend:'bird',item:'apple',theme:'delivery'},
  {hero:'squirrel',friend:'cat',item:'flower',theme:'treasure'}
 ],
 4:[
  {hero:'hedgehog',friend:'cat_white_bow',item:'book',theme:'lost'},
  {hero:'cat',friend:'rabbit',item:'flower',theme:'surprise'},
  {hero:'bird',friend:'squirrel',item:'balloon',theme:'delivery'},
  {hero:'rabbit',friend:'hedgehog',item:'star',theme:'treasure'}
 ],
 5:[
  {hero:'cat_white_bow',friend:'rabbit',item:'star',theme:'lost'},
  {hero:'hedgehog',friend:'bird',item:'apple',theme:'surprise'},
  {hero:'squirrel',friend:'cat',item:'book',theme:'delivery'},
  {hero:'rabbit',friend:'cat_white_bow',item:'flower',theme:'treasure'}
 ],
 6:[
  {hero:'squirrel',friend:'bird',item:'flower',theme:'lost'},
  {hero:'rabbit',friend:'cat',item:'apple',theme:'surprise'},
  {hero:'cat_white_bow',friend:'hedgehog',item:'star',theme:'delivery'},
  {hero:'bird',friend:'squirrel',item:'balloon',theme:'treasure'}
 ]
};
const ANIMAL_EN:Partial<Record<ForestActorId,string>>={
 rabbit:'rabbit',squirrel:'squirrel',bird:'blue bird',cat:'orange cat',
 hedgehog:'hedgehog',cat_white_bow:'white kitten'
};
const ITEM_EN:Record<DetectiveItemId,string>={
 apple:'red apple',balloon:'blue balloon',star:'golden star',
 book:'storybook',flower:'pink flower'
};
const SCENE_EN:Record<ForestScene,string>={
 path:'forest path',treehouse:'tree house',pond:'pond',
 meadow:'flower meadow',bridge:'wooden bridge',camp:'starry camp'
};
export const DETECTIVE_THEME_NAMES:Record<DetectiveStoryTheme,string>={
 lost:'Kayıp Eşya',surprise:'Sürpriz Hazırlığı',
 delivery:'Önemli Teslimat',treasure:'Gizli Hazine'
};
function article(name:string):string{
 return /^[aeiou]/i.test(name)?'an ':'a ';
}
function shuffle<T>(src:readonly T[],seed:number):T[]{
 const out=[...src];let state=seed>>>0;
 for(let i=out.length-1;i>0;i--){
  state=(Math.imul(state^state>>>15,1664525)+1013904223)>>>0;
  const j=state%(i+1);[out[i],out[j]]=[out[j],out[i]];
 }
 return out;
}
const ALL_SCENES:readonly ForestScene[]=[
 'path','treehouse','pond','meadow','bridge','camp'
];
const ALL_CLUES=Object.keys(DETECTIVE_CLUES) as DetectiveClueId[];
const colorNames:readonly DetectiveAdventurePlan['palette'][]=[
 'sunny','twilight','golden','misty'
];
function choices<T extends string>(target:T,options:readonly T[],
 count:number,seed:number):T[]{
 const wrong=shuffle(options.filter(x=>x!==target),seed+51);
 return shuffle([target,...wrong.slice(0,count-1)],seed+17);
}
export function planDetectiveAdventure(input:{
 episode:ForestEpisode;gradeLevel:number|null;englishLevel:ForestPlacement;
 seed:number;playCount:number;
}):DetectiveAdventurePlan{
 const base=planDetectiveCase(input);
 const {episode,playCount}=input;
 const setup=DETECTIVE_STORY_SETUPS[episode][playCount%4];
 const seed=input.seed>>>0;
 const alternatives=ALL_SCENES.filter(scene=>
  scene!==base.chosen.destination&&scene!==base.chosen.chapter.start);
 const waypointOptions=shuffle(alternatives,seed+episode*59).slice(0,2) as
  [ForestScene,ForestScene];
 const stepIdPrefix='adventure-'+episode+'-'+(playCount%12);
 const steps:DetectiveAdventureStep[]=[];
 const add=(kind:DetectiveAdventureStepKind,scene:DetectiveAdventureScene,
  target:string,acceptedIds:readonly string[],options:readonly string[],
  clueIndex?:number)=>{
  steps.push({id:stepIdPrefix+'-'+steps.length,kind,scene,target,
   acceptedIds,choices:options,clueIndex});
 };
 add('friend',base.chosen.chapter.start,setup.friend,[setup.friend],
  choices(setup.friend,PREMIUM_FRIENDS.filter(x=>x!==setup.hero),3,seed+1));
 add('clue',base.chosen.chapter.start,base.requiredClues[0],
  [base.requiredClues[0]],
  choices(base.requiredClues[0],
   [base.requiredClues[0],...ALL_CLUES.filter(id=>!base.chosen.clueIds.includes(id))],
   input.gradeLevel!==null&&input.gradeLevel>=3?4:3,seed+11),0);
 add('crossroads',base.chosen.chapter.start,waypointOptions[0],
  waypointOptions,shuffle(waypointOptions,seed+23));
 add('clue','chosenWaypoint',base.requiredClues[1],
  [base.requiredClues[1]],
  choices(base.requiredClues[1],
   [base.requiredClues[1],...ALL_CLUES.filter(id=>!base.chosen.clueIds.includes(id))],
   input.gradeLevel!==null&&input.gradeLevel>=3?4:3,seed+29),1);
 add('memory','chosenWaypoint',base.requiredClues[0],[base.requiredClues[0]],
  choices(base.requiredClues[0],
   [base.requiredClues[0],...ALL_CLUES.filter(id=>!base.chosen.clueIds.includes(id))],
   3,seed+41));
 if(base.requiredClues.length===3){
  add('clue','chosenWaypoint',base.requiredClues[2],[base.requiredClues[2]],
   choices(base.requiredClues[2],
    [base.requiredClues[2],...ALL_CLUES.filter(id=>!base.chosen.clueIds.includes(id))],
    4,seed+53),2);
 }
 add('destination','chosenWaypoint',base.chosen.destination,
  [base.chosen.destination],
  shuffle(base.chosen.chapter.locations,seed+61));
 add('recover',base.chosen.destination,setup.item,[setup.item],
  choices(setup.item,PREMIUM_ITEMS,3,seed+71));
 const storyId='story2-'+episode+'-'+(playCount%12);
 return {
  ...base,storyVersion:2,storyId,setup,waypoints:waypointOptions,
  steps,storySteps:steps.map(step=>({
   id:step.id,acceptedIds:step.acceptedIds,choices:step.choices
  })),palette:colorNames[(playCount+episode)%4]
 };
}
export function sceneForDetectiveStep(
 plan:DetectiveAdventurePlan,step:DetectiveAdventureStep,waypoint?:ForestScene
):ForestScene{
 return step.scene==='chosenWaypoint'?
  waypoint??plan.waypoints[0]:step.scene;
}
function shortClue(id:string):string{
 return DETECTIVE_CLUES[id as DetectiveClueId]?.en??id;
}
function introForTheme(plan:DetectiveAdventurePlan):Record<ForestPlacement,string>{
 const h=ANIMAL_EN[plan.setup.hero]??'forest friend',
  f=ANIMAL_EN[plan.setup.friend]??'friend',item=ITEM_EN[plan.setup.item];
 const here=SCENE_EN[plan.chosen.chapter.start];
 if(plan.setup.theme==='lost')return {
  'Pre-A1':'Oh no! '+article(h)+h+' lost '+article(item)+item+'. Help!',
  A1:'At the '+here+', '+article(h)+h+' loses '+article(item)+item+
   '. Can you and '+article(f)+f+' find it?',
  A2:'During a walk by the '+here+', '+article(h)+h+
   ' notices that '+article(item)+item+' has disappeared. Follow the clues with '+article(f)+f+'.'
 };
 if(plan.setup.theme==='surprise')return {
  'Pre-A1':'A surprise! '+article(item)+item+' is missing. Help '+article(h)+h+'!',
  A1:'The friends are planning a surprise at the '+here+
   '. But the '+item+' has gone missing. Can we find it?',
  A2:'A special celebration is coming. '+article(h)+h+
   ' needs the '+item+' for a surprise, but no one knows where it is. Let us investigate.'
 };
 if(plan.setup.theme==='delivery')return {
  'Pre-A1':'A gift for a friend! Where is the '+item+'? Let us look!',
  A1:article(h)+h+' wants to take '+article(item)+item+
   ' to a friend. The gift is not in the bag. Let us follow the clues!',
  A2:'The forest friends have an important delivery to make. But when '+
   article(h)+h+' opens the bag, the '+item+' is gone. Can you trace the delivery route?'
 };
 return {
  'Pre-A1':'A secret treasure! Find the '+item+'. Ready?',
  A1:'A mystery map shows '+article(item)+item+
   ' hidden somewhere in the forest. Let us follow the clues.',
  A2:article(h)+h+' finds a mysterious treasure map near the '+here+
   '. A special '+item+' is hidden in the forest. Which clues will lead to it?'
 };
}
export function detectiveAdventureNarration(
 plan:DetectiveAdventurePlan,stage:'opening'|'ending',
 route?:ForestScene
):string{
 if(stage==='opening')return introForTheme(plan)[plan.englishLevel];
 const h=ANIMAL_EN[plan.setup.hero]??'friend',
 f=ANIMAL_EN[plan.setup.friend]??'friend',item=ITEM_EN[plan.setup.item];
 const dest=SCENE_EN[plan.chosen.destination];
 const via=SCENE_EN[route??plan.waypoints[0]];
 if(plan.englishLevel==='Pre-A1')return 'We found the '+item+
  '! Great job! Our friends are happy.';
 if(plan.englishLevel==='A1')return 'After following the path by the '+via+
  ', '+article(h)+h+' and '+article(f)+f+' reach the '+dest+
  '. They find the '+item+' together!';
 return 'The clues were right. After taking the path by the '+via+
  ', the friends arrive at the '+dest+
  '. Working as a team, they find the '+item+
  ' and finish their forest mission. Mystery solved!';
}
export function detectiveAdventurePrompt(
 plan:DetectiveAdventurePlan,step:DetectiveAdventureStep,
 waypoint?:ForestScene
):string{
 const level=plan.englishLevel;
 const h=ANIMAL_EN[plan.setup.hero]??'friend';
 const f=ANIMAL_EN[plan.setup.friend]??'friend';
 if(step.kind==='friend')return level==='Pre-A1'?
  'Who can help? Find the '+f+'.':
  level==='A1'?'We need a helper. Can you find the '+f+'?':
  'Our hero needs a partner to investigate the mystery. Which picture shows the '+f+'?';
 if(step.kind==='clue'){
  const clue=shortClue(step.target);
  const picture='a picture of '+article(clue)+clue;
  if(level==='Pre-A1')return 'Look! Find the '+clue+'.';
  if(level==='A1')return 'A new clue! A picture shows '+article(clue)+clue+
   '. Which picture matches the clue?';
  return 'The detective notebook reveals '+picture+
   '. Look carefully and collect the matching evidence before moving on.';
 }
 if(step.kind==='crossroads'){
  if(level==='Pre-A1')return 'Two paths! Pick a path to explore.';
  if(level==='A1')return 'There are two paths through the forest. Which one should the friends explore first?';
  return 'The trail divides into two different routes. Choose the next place to explore. Your choice changes the journey.';
 }
 if(step.kind==='memory'){
  const clue=shortClue(step.target);
  if(level==='Pre-A1')return 'Remember! What did we find first?';
  if(level==='A1')return 'Do you remember our first picture clue? Which object was it?';
  return 'Think back to the first clue we collected. Which picture shows the '+clue+' we saw earlier?';
 }
 if(step.kind==='destination'){
  if(level==='Pre-A1')return 'We have the clues! Where is our treasure?';
  if(level==='A1')return 'Look at the clues we found. Which forest place fits them best?';
  return 'Now we have enough evidence. Compare the clues with these places and choose the most likely destination.';
 }
 const item=ITEM_EN[plan.setup.item];
 return level==='Pre-A1'?'We are here! Find the '+item+'.':
  level==='A1'?'We reached the right place. Which picture shows the missing '+item+'?':
  'The friends have reached the last place on the trail. Find the '+item+
   ' to finish the mission with '+article(h)+h+'.';
}
export function validateAdventureEvidence(
 answers:readonly DetectiveStepAnswer[],plan:DetectiveAdventurePlan
):boolean{
 if(answers.length!==plan.steps.length||new Set(answers.map(a=>a.stepId)).size!==answers.length)
  return false;
 return plan.steps.every((step,index)=>{
  const answer=answers[index];
  return !!answer&&answer.stepId===step.id&&
   step.acceptedIds.includes(answer.selectedId)&&
   step.choices.includes(answer.selectedId)&&
   Number.isInteger(answer.mistakes)&&answer.mistakes>=0&&
   typeof answer.hintUsed==='boolean'&&
   answer.firstTryCorrect===(answer.mistakes===0&&!answer.hintUsed);
 });
}
