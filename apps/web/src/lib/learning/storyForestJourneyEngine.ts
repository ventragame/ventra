/**
 * Story Engine 2.0 — safe, finite, causally coherent story paths.
 * Branches change destination, picture, consequence and ending.
 * No open-ended AI generation or interchangeable scenes with inconsistent props.
 */
import type {ForestEpisode,ForestPlacement,ForestScene,ForestActorId} from './storyForestEngine.ts';
import {FOREST_EPISODES} from './storyForestEngine.ts';

export type JourneyObject='key'|'apple'|'bird'|'crystal';
export type JourneyPhase='opening'|'discover'|'meet'|'choose'|'result'|'friend'|'ending';
export type JourneyAnswerId=JourneyObject|ForestActorId;
export interface JourneyLocation{scene:ForestScene;label:string;}
export interface JourneyRoute{
 id:string;episode:ForestEpisode;title:string;scene:ForestScene;
 object:JourneyObject;hero:ForestActorId;helper:ForestActorId;
 destinations:readonly [JourneyLocation,JourneyLocation];
}
export interface JourneyRecord{
 routeId:string;episode:ForestEpisode;object:JourneyObject;
 destination:ForestScene;firstMistakes:number;secondMistakes:number;
 firstHint:boolean;secondHint:boolean;completedAt:string;
}
export interface JourneyPlan{
 route:JourneyRoute;englishLevel:ForestPlacement;gradeLevel:number|null;
 seed:number;objectChoices:readonly JourneyObject[];friendChoices:readonly ForestActorId[];
}
const ROUTES:readonly JourneyObject[]=['key','apple','bird','crystal'];
const CHARACTERS:Record<JourneyObject,readonly [ForestActorId,ForestActorId]>={
 key:['rabbit','hedgehog'],apple:['cat','squirrel'],bird:['rabbit','squirrel'],crystal:['cat','hedgehog']
};
const LOCATIONS:Record<ForestScene,JourneyLocation>={
 path:{scene:'path',label:'Orman Patikası'},
 treehouse:{scene:'treehouse',label:'Ağaç Ev'},
 pond:{scene:'pond',label:'Gölet'},
 meadow:{scene:'meadow',label:'Çiçekli Çayır'},
 camp:{scene:'camp',label:'Kamp Alanı'},
 bridge:{scene:'bridge',label:'Tahta Köprü'}
};
const PAIRS:Readonly<Record<ForestEpisode,readonly [ForestScene,ForestScene]>>={
 1:['treehouse','pond'],2:['meadow','bridge'],3:['path','treehouse'],
 4:['camp','pond'],5:['bridge','meadow'],6:['treehouse','path']
};
const CHARACTER_NAMES:Record<string,string>={
 rabbit:'rabbit',fox:'fox',bird:'bird',bear:'bear',deer:'deer',
 squirrel:'squirrel',cat:'orange cat',hedgehog:'hedgehog',
 cat_white_bow:'white kitten',cat_gray_sleeping:'sleeping grey cat',
 dog:'dog',fish:'fish',butterfly:'butterfly'
};
const OBJECT_NAMES:Readonly<Record<JourneyObject,string>>={
 key:'golden key',apple:'red apple',bird:'little blue bird',crystal:'glowing crystal'
};
export const JOURNEY_ROUTES:readonly JourneyRoute[]=Object.freeze(FOREST_EPISODES.flatMap(episode=>
 ROUTES.map(object=>{
  const [hero,helper]=CHARACTERS[object];
  const destinations=PAIRS[episode.id].map(id=>LOCATIONS[id]) as unknown as [JourneyLocation,JourneyLocation];
  return Object.freeze({id:'journey-'+episode.id+'-'+object,episode:episode.id,
   title:episode.title,scene:episode.scene,object,hero,helper,
   destinations:Object.freeze(destinations) as unknown as readonly [JourneyLocation,JourneyLocation]});
 })
));
export function journeyRoutesForEpisode(episode:ForestEpisode):readonly JourneyRoute[]{
 return JOURNEY_ROUTES.filter(route=>route.episode===episode);
}
function rand32(value:number):number{let x=value>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;}
function shuffle<T>(arr:readonly T[],seed:number):T[]{
 let state=seed>>>0;const result=[...arr];
 for(let i=result.length-1;i>0;i--){
  state=rand32(state+1013904223);const j=state%(i+1);
  [result[i],result[j]]=[result[j],result[i]];
 }
 return result;
}
export function planJourneyStory(input:{
 episode:ForestEpisode;englishLevel:ForestPlacement;gradeLevel:number|null;
 seed:number;history?:readonly JourneyRecord[];
}):JourneyPlan{
 if(!['Pre-A1','A1','A2'].includes(input.englishLevel))throw Error('Unknown placement');
 const pool=journeyRoutesForEpisode(input.episode);
 if(pool.length!==4)throw Error('Unknown story chapter');
 const history=(input.history??[]).filter(x=>x.episode===input.episode);
 const recent=history.slice(-3).map(x=>x.routeId);
 const seed=Number.isFinite(input.seed)?input.seed>>>0:0;
 const ranked=shuffle(pool,seed).sort((a,b)=>{
  const aRecent=recent.includes(a.id)?1:0,bRecent=recent.includes(b.id)?1:0;
  if(aRecent!==bRecent)return aRecent-bRecent;
  const aLast=history.map(h=>h.routeId).lastIndexOf(a.id);
  const bLast=history.map(h=>h.routeId).lastIndexOf(b.id);
  return aLast-bLast; // Least recently used; random tie-break by shuffled order.
 });
 const route=ranked[0];
 const friends:ForestActorId[]=['rabbit','squirrel','cat','hedgehog','cat_white_bow','cat_gray_sleeping'];
 const distractors=shuffle(friends.filter(x=>x!==route.helper&&x!==route.hero),seed+203);
 const friendChoices=shuffle([route.helper,...distractors.slice(0,2)],seed+301);
 const objectChoices=shuffle(ROUTES.filter(x=>x===route.object).concat(
    shuffle(ROUTES.filter(x=>x!==route.object),seed+103).slice(0,2)),seed+101);
 return {route,englishLevel:input.englishLevel,gradeLevel:input.gradeLevel,
  seed,objectChoices,friendChoices};
}
export function narrativeFor(plan:JourneyPlan,phase:JourneyPhase,branchScene?:ForestScene):string{
 const route=plan.route,level=plan.englishLevel,hero=CHARACTER_NAMES[route.hero],
 helper=CHARACTER_NAMES[route.helper],object=OBJECT_NAMES[route.object];
 const heroArticle=/^[aeiou]/i.test(hero)?'an':'a';
 const landscape=route.scene==='treehouse'?'tree house':route.scene==='meadow'?'flower meadow':
  route.scene==='pond'?'pond':route.scene==='camp'?'camp':
  route.scene==='bridge'?'wooden bridge':'forest path';
 const dest=route.destinations.find(x=>x.scene===branchScene)||route.destinations[0];
 const location=dest.scene==='treehouse'?'tree house':dest.scene==='meadow'?'flower meadow':
  dest.scene==='pond'?'pond':dest.scene==='camp'?'camp':
  dest.scene==='bridge'?'bridge':'forest path';
 const pre:Record<JourneyPhase,string>={
  opening:'One day, '+heroArticle+' '+hero+' walks along the '+landscape+'.',
  discover:'Oh! A '+object+'! Find it.',
  meet:'A friendly '+helper+' comes to help.',
  choose:'Where should they go? Choose a place.',
  result:'They go to the '+location+'.',
  friend:'Who helped the '+hero+'? Find the '+helper+'.',
  ending:route.object==='key'?'They find a little box. The key opens it.':
   route.object==='apple'?'They share the red apple. Everyone smiles.':
   route.object==='bird'?'The little blue bird finds its family. Hooray!':
   'The crystal lights up the forest. It is beautiful!'
 };
 const a1:Record<JourneyPhase,string>={
  opening:'One morning, a curious '+hero+' goes to the '+landscape+' looking for an adventure.',
  discover:'Something is shining nearby. Can you find the '+object+'?',
  meet:'Soon a kind '+helper+' joins the '+hero+'. Together they make a plan.',
  choose:'The friends must decide where to go next. Choose their destination.',
  result:'They follow the path and arrive at the '+location+'. Their adventure continues.',
  friend:'Who joined the '+hero+' on this adventure? Find the '+helper+'.',
  ending:route.object==='key'?'Together they discover a locked box. Their golden key opens it!':
   route.object==='apple'?'They find a hungry friend and share the red apple. What a happy ending!':
   route.object==='bird'?'The small blue bird sees its family again. The friends have helped it!':
   'They place the glowing crystal on a stone. The whole forest shines!'
 };
 const a2:Record<JourneyPhase,string>={
  opening:'Early one morning, an adventurous '+hero+' sets off through the '+landscape+' to discover something new.',
  discover:'A mysterious object catches their attention. Can you identify the '+object+' among the objects?',
  meet:'Just when the '+hero+' needs a little help, a friendly '+helper+' appears and offers to join the journey.',
  choose:'There are two possible routes ahead, and either could lead to an exciting discovery. Where should they explore?',
  result:'After following their chosen route, the two friends finally reach the '+location+' and look around carefully.',
  friend:'Think back to the beginning of the adventure. Which friend joined the '+hero+' on the way?',
  ending:route.object==='key'?'At last they find a little locked box and use the golden key to open it. Their discovery is complete.':
   route.object==='apple'?'Instead of keeping the apple, the two friends decide to share it with someone who is hungry.':
   route.object==='bird'?'The lost little blue bird finally returns to its family, and the friends feel proud of helping.':
   'When they place the crystal on a stone, its gentle light fills the forest and guides everyone home.'
 };
 // Replays rotate authored listening instructions without changing the answer
 // or inventing unsupported actions. This is variation in *learning prompts*,
 // not a claim that every run creates a completely new story.
 if(phase==='discover'){
  const templates:Record<ForestPlacement,readonly string[]>={
   'Pre-A1':['Oh! A '+object+'! Find it.','Look! Find the '+object+'.','Can you see the '+object+'? Tap it.'],
   A1:['Something is shining nearby. Can you find the '+object+'?',
       'Take a look around. Which picture shows the '+object+'?',
       'The friends have spotted an object. Touch the '+object+'.'],
   A2:['A mysterious object catches their attention. Can you identify the '+object+' among the objects?',
       'Look carefully at the objects and choose the '+object+' that the friends discovered.',
       'Which of the objects matches the '+object+' mentioned in the story?']
  };
  return templates[level][plan.seed%3];
 }
 if(phase==='friend'){
  const templates:Record<ForestPlacement,readonly string[]>={
   'Pre-A1':['Who helped the '+hero+'? Find the '+helper+'.',
      'Find the '+helper+'. Who is the friend?','Who came to help? Tap the '+helper+'.'],
   A1:['Who joined the '+hero+' on this adventure? Find the '+helper+'.',
       'Do you remember the friend? Touch the '+helper+'.',
       'Which animal helped during this adventure? Find the '+helper+'.'],
   A2:['Think back to the beginning of the adventure. Which friend joined the '+hero+' on the way?',
       'The story introduced a friendly companion. Can you identify the helpful '+helper+'?',
       'Recall the character who offered help. Which picture shows the '+helper+'?']
  };
  return templates[level][(plan.seed>>>3)%3];
 }
 return (level==='Pre-A1'?pre:level==='A1'?a1:a2)[phase];
}
export function validateJourneyRecord(record:JourneyRecord,plan:JourneyPlan):boolean{
 return record.routeId===plan.route.id&&record.episode===plan.route.episode&&
  record.object===plan.route.object&&
  plan.route.destinations.some(x=>x.scene===record.destination)&&
  Number.isInteger(record.firstMistakes)&&record.firstMistakes>=0&&
  Number.isInteger(record.secondMistakes)&&record.secondMistakes>=0&&
  typeof record.firstHint==='boolean'&&typeof record.secondHint==='boolean'&&
  typeof record.completedAt==='string'&&Number.isFinite(Date.parse(record.completedAt));
}
export function journeyStars(record:JourneyRecord):1|2|3{
 const errors=record.firstMistakes+record.secondMistakes;
 const hints=Number(record.firstHint)+Number(record.secondHint);
 return errors===0&&hints===0?3:errors<=2&&hints<=1?2:1;
}
