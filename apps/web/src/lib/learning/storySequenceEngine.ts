/**
 * Hikâye Ormanı / Oyun 2 — Sonra Ne Oldu?
 * A real visual narrative sequencing skill: observe a short English story,
 * then rebuild its timeline with only illustrated frames.
 * Language placement and school grade remain independent decisions.
 */
import type {ForestActorId,ForestEpisode,ForestPlacement,ForestScene} from './storyForestEngine.ts';
import {FOREST_EPISODES} from './storyForestEngine.ts';

export type SequenceAction='discover'|'arrive'|'move'|'help'|'watch'|'celebrate'|'read'|'sleep'|'find'|'share';
export type SequenceProp='apple'|'balloon'|'star'|'book'|'leaf'|'flower'|'fish'|'bridge'|'home'|'moon'|'none';
export type SequenceFrameId=string;
export interface SequenceFrame{
 id:SequenceFrameId;
 order:number;
 actor:ForestActorId;
 companion?:ForestActorId;
 prop:SequenceProp;
 action:SequenceAction;
 placement:'left'|'center'|'right';
 narration:Record<ForestPlacement,string>;
}
export interface SequenceStory {
 episode:ForestEpisode;
 title:string;
 scene:ForestScene;
 frames:readonly SequenceFrame[];
}
export interface SequenceDeck {
 episode:ForestEpisode;
 gradeLevel:number|null;
 englishLevel:ForestPlacement;
 seed:number;
 frames:readonly SequenceFrame[];
 shuffledIds:readonly SequenceFrameId[];
}
export interface SequenceAnswer {
 frameId:SequenceFrameId;
 slot:number;
 mistakes:number;
 hintUsed:boolean;
 firstTryCorrect:boolean;
 placement:ForestPlacement;
 timestamp:string;
}
type FrameDef=readonly [
 ForestActorId,ForestActorId|undefined,SequenceProp,SequenceAction,
 'left'|'center'|'right',string,string,string
];
type Arc=readonly [string, readonly FrameDef[]];
const ARCS:Readonly<Record<ForestEpisode,Arc>>={
 1:['Küçük Tavşanın Yolculuğu',[
  ['rabbit',undefined,'apple','discover','left','The rabbit sees an apple.','A rabbit finds a red apple.','At the beginning, a rabbit discovers a red apple on the path.'],
  ['hedgehog','rabbit','none','arrive','right','The hedgehog comes.','A kind hedgehog comes to help.','Soon, a cheerful hedgehog joins the rabbit on the forest path.'],
  ['bird_flying',undefined,'leaf','move','center','The bird flies.','A blue bird flies above them.','Next, a little blue bird flies over their heads.'],
  ['rabbit',undefined,'apple','move','center','The rabbit goes to the tree.','The rabbit takes the apple to a tree.','Then the rabbit carries the apple to a shady tree.']
  ['rabbit','hedgehog','apple','share','center','They share the apple.','The rabbit and hedgehog share the apple.','At last, the rabbit and hedgehog sit together and share the red apple.']
 ]],
 2:['Ağaç Ev Sürprizi',[
  ['cat',undefined,'home','arrive','left','The cat comes home.','The cat visits the tree house.','First, a curious cat arrives at a colourful tree house.'],
  ['bird',undefined,'balloon','discover','right','The bird sees a balloon.','A bird finds a blue balloon.','Then a little bird notices a bright blue balloon outside.'],
  ['rabbit_reading',undefined,'book','read','center','The rabbit reads.','The rabbit opens a story book.','Next, the rabbit sits down to read a story to everyone.'],
  ['cat_white_bow','cat','star','help','left','The white kitten brings a star.','A little white kitten brings a shining star.','After that, a little white kitten with a pink bow brings a golden star to the house.'],
  ['cat','cat_white_bow','star','celebrate','center','The cats are happy.','The orange cat and white kitten celebrate together.','Finally, the two kittens celebrate their wonderful surprise together.']
 ]],
 3:['Göletin Sırrı',[
  ['fish',undefined,'fish','discover','center','A fish is here.','A little fish appears in the pond.','At first, a little fish appears in the sparkling pond.'],
  ['bird_flying',undefined,'none','watch','right','The bird looks.','A blue bird watches the water.','Next, a curious blue bird flies over the water to look.'],
  ['rabbit_pond',undefined,'none','arrive','left','The rabbit comes.','The rabbit comes to the pond.','Then the rabbit quietly arrives beside the little pond.'],
  ['fox','rabbit_pond','fish','find','center','The fox sees the fish.','The fox and rabbit find the fish.','Afterwards, the fox joins the rabbit and spots the fish.'],
  ['rabbit','fox','fish','celebrate','center','They are happy.','The two friends wave to the fish.','In the end, both friends smile as the fish swims away.']
 ]],
 4:['Renkli Çiçekler',[
  ['butterfly',undefined,'flower','discover','left','A butterfly is here.','A butterfly finds a flower.','First, a colourful butterfly lands beside a flower.'],
  ['rabbit',undefined,'flower','arrive','right','The rabbit comes.','The rabbit sees a pink flower.','Next, the rabbit comes to admire the pink flowers.'],
  ['squirrel',undefined,'none','find','center','The squirrel has an acorn.','The squirrel carries a small acorn.','Then a happy squirrel arrives carrying a shiny brown acorn.'],
  ['hedgehog','butterfly','flower','watch','left','The hedgehog looks.','The hedgehog watches a butterfly.','After that, a cheerful hedgehog stops and watches the butterfly dance.'],
  ['rabbit','hedgehog','flower','share','center','They enjoy the flowers.','The rabbit and hedgehog enjoy the flowers.','Finally, the rabbit and the hedgehog enjoy the lovely flowers together.']
 ]],
 5:['Yıldız Kampı',[
  ['cat_gray_sleeping',undefined,'moon','sleep','left','The grey cat sleeps.','A grey cat sleeps under the moon.','At the start of the night, a little grey cat is curled up asleep under the moonlight.'],
  ['bird_flying',undefined,'star','move','right','The bird flies.','A bird flies past a bright star.','Soon a blue bird flies past the first shining star.'],
  ['rabbit_reading',undefined,'book','read','center','The rabbit reads.','The rabbit reads near the tent.','Next, the rabbit opens a book by the quiet camp.'],
  ['fox_running',undefined,'star','arrive','left','The fox comes.','The fox runs into the camp.','Then the fox comes running when it sees the golden star.'],
  ['rabbit','fox','star','celebrate','center','They see a star.','The friends watch the stars together.','At last, the rabbit and fox watch the night sky together.']
 ]],
 6:['Işık Köprüsü',[
  ['deer',undefined,'bridge','arrive','left','The deer is here.','The deer stands by the bridge.','First, a deer arrives at the bridge over the river.'],
  ['fox_running',undefined,'bridge','move','right','The fox runs.','The fox runs over the bridge.','Next, a quick fox runs happily across the wooden bridge.'],
  ['bird_flying',undefined,'star','watch','center','The bird flies.','The bird flies over the bridge.','Then a little bird spreads its wings above the bridge.'],
  ['rabbit',undefined,'apple','find','left','The rabbit has an apple.','The rabbit brings a red apple.','Afterwards, a rabbit carries an apple to its waiting friends.'],
  ['deer','rabbit','apple','share','center','The friends share.','The deer and rabbit share the apple.','Finally, the friends meet and share their lovely picnic.']
 ]]
};

export const SEQUENCE_STORIES:readonly SequenceStory[]=Object.freeze(FOREST_EPISODES.map(ep=>{
 const arc=ARCS[ep.id];
 const frames=arc[1].map((row,order)=>Object.freeze({
  id:'seq-'+ep.id+'-'+(order+1),order,
  actor:row[0],companion:row[1],prop:row[2],action:row[3],placement:row[4],
  narration:{'Pre-A1':row[5],A1:row[6],A2:row[7]}
 }));
 return Object.freeze({episode:ep.id,title:arc[0],scene:ep.scene,frames:Object.freeze(frames)});
}));
export const SEQUENCE_GAME_ID='island_story_forest_sequence';

export function sequenceLengthForGrade(grade:number|null|undefined):3|4|5 {
 if(grade!==null&&grade!==undefined&&Number.isInteger(grade)&&grade>=1&&grade<=2)return 3;
 if(grade!==null&&grade!==undefined&&Number.isInteger(grade)&&grade>=5&&grade<=8)return 5;
 return 4;
}
function hash(seed:number):number{
 let x=seed>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;
}
export function shuffleSequence<T>(items:readonly T[],seed:number):T[]{
 const result=[...items];let rng=seed>>>0;
 for(let i=result.length-1;i>0;i--){
  rng=hash(rng+1013904223);const j=rng%(i+1);
  [result[i],result[j]]=[result[j],result[i]];
 }
 return result;
}
export function planSequenceStory(input:{
 episode:ForestEpisode;gradeLevel:number|null;englishLevel:ForestPlacement;seed:number
}):SequenceDeck{
 const story=SEQUENCE_STORIES.find(s=>s.episode===input.episode);
 if(!story||!['Pre-A1','A1','A2'].includes(input.englishLevel))throw Error('Geçersiz hikâye.');
 const count=sequenceLengthForGrade(input.gradeLevel);
 // Keep the beginning, an actual middle, and the conclusion. Higher grades
 // see more connecting events; this is NOT a random, causally broken excerpt.
 const indices=count===3?[0,2,4]:count===4?[0,1,3,4]:[0,1,2,3,4];
 const frames=indices.map(index=>story.frames[index]);
 const seed=Number.isFinite(input.seed)?input.seed>>>0:0;
 let shuffled=shuffleSequence(frames.map(f=>f.id),seed+input.episode*211);
 // A lucky sorted shuffle would reveal every answer for free.
 if(shuffled.every((id,i)=>id===frames[i].id))shuffled=[...shuffled.slice(1),shuffled[0]];
 return {episode:input.episode,gradeLevel:input.gradeLevel,englishLevel:input.englishLevel,
  seed,frames,shuffledIds:shuffled};
}
export function validateSequenceAnswers(answers:readonly SequenceAnswer[],deck:SequenceDeck):boolean{
 if(!Array.isArray(answers)||answers.length!==deck.frames.length||
   new Set(answers.map(a=>a.frameId)).size!==deck.frames.length)return false;
 return deck.frames.every((frame,i)=>{
  const answer=answers[i];return !!answer&&answer.frameId===frame.id&&answer.slot===i&&
   answer.placement===deck.englishLevel&&Number.isInteger(answer.mistakes)&&answer.mistakes>=0&&
   typeof answer.hintUsed==='boolean'&&
   answer.firstTryCorrect===(answer.mistakes===0&&!answer.hintUsed)&&
   typeof answer.timestamp==='string'&&Number.isFinite(Date.parse(answer.timestamp));
 });
}
export function sequenceStars(answers:readonly SequenceAnswer[]):1|2|3{
 const errors=answers.reduce((n,a)=>n+a.mistakes,0);
 const hints=answers.filter(a=>a.hintUsed).length;
 return errors===0&&hints===0?3:errors<=2&&hints<=1?2:1;
}
