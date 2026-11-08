
/** Hikâye Ormanı — data-first listening/story comprehension engine.
 * Scene backgrounds contain no selectable animals: a child's visual evidence
 * must ALWAYS match the actual interactive choice. Offline and deterministic.
 */
export type ForestPlacement = 'Pre-A1' | 'A1' | 'A2';
export type ForestScene = 'path' | 'treehouse' | 'pond' | 'meadow' | 'camp' | 'bridge';
export type ForestMode = 'character' | 'place' | 'trait' | 'action';
export type ForestEpisode = 1 | 2 | 3 | 4 | 5 | 6;

export type ForestActorId =
  | 'rabbit' | 'fox' | 'bird' | 'bear' | 'deer' | 'squirrel' | 'cat' | 'dog'
  | 'fish' | 'butterfly' | 'rabbit_reading' | 'bear_sleeping' | 'fox_running'
  | 'bird_flying' | 'rabbit_tree' | 'rabbit_rock' | 'rabbit_pond'
  | 'red_apple' | 'yellow_star' | 'blue_balloon' | 'pink_flower'
  | 'purple_flower' | 'green_leaf';

export interface ForestEpisodeDefinition {
  id: ForestEpisode;
  title: string;
  scene: ForestScene;
  englishTitle: string;
  badge: string;
}
export const FOREST_EPISODES: readonly ForestEpisodeDefinition[] = Object.freeze([
  {id:1,title:'Yaprak Patikası',scene:'path',englishTitle:'The Leaf Path',badge:'🍃'},
  {id:2,title:'Ağaç Ev',scene:'treehouse',englishTitle:'The Tree House',badge:'🏡'},
  {id:3,title:'Gölet Sırrı',scene:'pond',englishTitle:'The Little Pond',badge:'💧'},
  {id:4,title:'Çiçek Vadisi',scene:'meadow',englishTitle:'The Flower Meadow',badge:'🌷'},
  {id:5,title:'Yıldız Kampı',scene:'camp',englishTitle:'The Star Camp',badge:'⭐'},
  {id:6,title:'Işık Köprüsü',scene:'bridge',englishTitle:'The Rainbow Bridge',badge:'🌈'}
]);

export const FOREST_ACTOR_NAMES: Readonly<Record<ForestActorId,string>> = {
 rabbit:'Tavşan', fox:'Tilki', bird:'Mavi kuş', bear:'Ayı',
 deer:'Geyik', squirrel:'Sincap', cat:'Kedi', dog:'Köpek',
 fish:'Balık', butterfly:'Kelebek',
 rabbit_reading:'Kitap okuyan tavşan',bear_sleeping:'Uyuyan ayı',
 fox_running:'Koşan tilki',bird_flying:'Uçan kuş',
 rabbit_tree:'Ağaç altındaki tavşan',rabbit_rock:'Kayanın üzerindeki tavşan',
 rabbit_pond:'Gölet kenarındaki tavşan',
 red_apple:'Kırmızı elma',yellow_star:'Sarı yıldız',blue_balloon:'Mavi balon',
 pink_flower:'Pembe çiçek',purple_flower:'Mor çiçek',green_leaf:'Yeşil yaprak'
};
const ALL_ACTORS = new Set<ForestActorId>(Object.keys(FOREST_ACTOR_NAMES) as ForestActorId[]);
export interface ForestBlueprint {
  id: string;
  mode: ForestMode;
  targetId: ForestActorId;
  choiceIds: readonly ForestActorId[];
  prompts: Readonly<Record<ForestPlacement,string>>;
}
export interface ForestChallenge extends ForestBlueprint {
  scene: ForestScene;
  episode: ForestEpisode;
  prompt: string;
  choices: readonly ForestActorId[];
}
export interface ForestDeck {
 episode: ForestEpisode;
 englishLevel: ForestPlacement;
 gradeLevel: number | null;
 seed: number;
 questions: readonly ForestChallenge[];
}
export interface ForestAnswer {
 questionId:string;
 selectedId:ForestActorId;
 mode:ForestMode;
 mistakes:number;
 hintUsed:boolean;
 firstTryCorrect:boolean;
 placement:ForestPlacement;
 timestamp:string;
}
export type ForestRow = readonly [
 ForestMode,ForestActorId,readonly ForestActorId[],string,string,string
];

const RABBIT_PLACE:readonly ForestActorId[]=['rabbit_tree','rabbit_rock','rabbit_pond'];
const ANIMALS_A:readonly ForestActorId[]=['rabbit','fox','bird'];
const ANIMALS_B:readonly ForestActorId[]=['bear','squirrel','deer'];
const ACTIONS:readonly ForestActorId[]=['rabbit_reading','bear_sleeping','bird_flying'];
const COLORS:readonly ForestActorId[]=['red_apple','blue_balloon','yellow_star'];
const FLOWERS:readonly ForestActorId[]=['pink_flower','purple_flower','green_leaf'];
// Every story has different details but the same visual language and navigation.
const EPISODE_ROWS: Readonly<Record<ForestEpisode,readonly ForestRow[]>> = {
1: [
 ['character','rabbit',ANIMALS_A,'Find the rabbit.','Find the white rabbit.','The little animal with long ears is waiting. Find it.'],
 ['character','fox',ANIMALS_A,'Find the fox.','Find the orange fox.','Which animal has a bright orange coat and a long tail?'],
 ['action','bird_flying',ACTIONS,'Find the bird.','Which animal is flying?','Which animal is moving through the air with its wings?'],
 ['trait','red_apple',COLORS,'Find the red apple.','Touch the red apple.','Which of these objects is a red fruit?'],
 ['character','squirrel',ANIMALS_B,'Find the squirrel.','Find the little squirrel.','The small woodland animal has a big fluffy tail. Find it.'],
 ['place','rabbit_tree',RABBIT_PLACE,'Find the rabbit under the tree.','The rabbit is under the tree.','Which picture shows the rabbit under the leafy tree?']
],
2: [
 ['character','bird',['bird','dog','cat'],'Find the bird.','Find the blue bird.','Which creature has blue feathers and a yellow beak?'],
 ['character','cat',['cat','dog','rabbit'],'Find the cat.','Touch the cat.','Which animal has pointy ears and long whiskers?'],
 ['action','rabbit_reading',ACTIONS,'Find the rabbit with a book.','Which animal is reading?','Who is holding an open book and reading?'],
 ['trait','blue_balloon',COLORS,'Find the blue balloon.','Touch the blue balloon.','Which object is blue and floats on a string?'],
 ['character','dog',['dog','cat','squirrel'],'Find the dog.','Find the friendly dog.','Which animal has floppy ears and a wagging tail?'],
 ['place','rabbit_rock',RABBIT_PLACE,'Find the rabbit on the rock.','The rabbit is on the rock.','Which picture places the rabbit on top of a grey rock?']
],
3: [
 ['character','fish',['fish','bird','fox'],'Find the fish.','Find the little fish.','Which animal has fins and swims in the water?'],
 ['place','rabbit_pond',RABBIT_PLACE,'Find the rabbit by the pond.','The rabbit is by the pond.','Which picture shows the rabbit beside the blue pond?'],
 ['action','bird_flying',ACTIONS,'Find the bird.','Find the flying bird.','Which animal is flying above the ground?'],
 ['trait','green_leaf',FLOWERS,'Find the green leaf.','Touch the green leaf.','Which object is green and grows on a tree?'],
 ['character','deer',ANIMALS_B,'Find the deer.','Look for the deer.','Which woodland animal has antlers on its head?'],
 ['action','bear_sleeping',ACTIONS,'Find the sleeping bear.','Which animal is sleeping?','Which friend is resting with its eyes closed?']
],
4: [
 ['trait','pink_flower',FLOWERS,'Find the pink flower.','Touch the pink flower.','Which flower has pink petals and a golden centre?'],
 ['character','butterfly',['butterfly','bird','rabbit'],'Find the butterfly.','Find the butterfly.','Which creature has four colourful wings and antennae?'],
 ['trait','purple_flower',FLOWERS,'Find the purple flower.','Find the purple flower.','Which flower has purple petals rather than pink ones?'],
 ['character','squirrel',ANIMALS_B,'Find the squirrel.','Look for the squirrel.','Find the forest friend with the fluffy orange tail.'],
 ['action','fox_running',['fox_running','bear_sleeping','rabbit_reading'],'Find the running fox.','Which animal is running?','Which friend is moving quickly on its paws?'],
 ['trait','red_apple',COLORS,'Find the apple.','Find the red apple.','Which item is a fruit with a red skin?']
],
5: [
 ['trait','yellow_star',COLORS,'Find the yellow star.','Touch the shining star.','Which object has five bright yellow points?'],
 ['action','bear_sleeping',ACTIONS,'Find the sleeping bear.','The bear is sleeping. Find it.','Which animal is asleep while its friends are awake?'],
 ['character','deer',ANIMALS_B,'Find the deer.','Find the deer.','Which animal has long legs and antlers?'],
 ['action','rabbit_reading',ACTIONS,'Find the rabbit with a book.','The rabbit is reading.','Which friend is looking at the pages of a book?'],
 ['trait','blue_balloon',COLORS,'Find the balloon.','Find the blue balloon.','Which object is filled with air and tied to a string?'],
 ['character','fox',ANIMALS_A,'Find the fox.','Find the fox with the orange tail.','Which animal has a long tail and pointed ears?']
],
6: [
 ['character','rabbit',ANIMALS_A,'Find the rabbit.','Find the white rabbit.','Find the woodland friend with two long ears.'],
 ['place','rabbit_tree',RABBIT_PLACE,'Find the rabbit under the tree.','Find the rabbit under the tree.','Which picture shows the rabbit resting beneath a tree?'],
 ['action','bird_flying',ACTIONS,'Find the flying bird.','The bird is flying.','Which friend is spreading its wings to fly?'],
 ['trait','purple_flower',FLOWERS,'Find the purple flower.','Find the purple flower.','Which flower has purple petals and a yellow middle?'],
 ['character','bear',ANIMALS_B,'Find the bear.','Find the brown bear.','Which woodland friend is large and has round ears?'],
 ['action','fox_running',['fox_running','bear_sleeping','rabbit_reading'],'Find the running fox.','The fox is running.','Who is running instead of reading or sleeping?']
]
};

export const FOREST_BANK:Readonly<Record<ForestEpisode,readonly ForestBlueprint[]>> =
 Object.freeze(FOREST_EPISODES.reduce((all,ep)=>{
  const rows=EPISODE_ROWS[ep.id];
  all[ep.id]=Object.freeze(rows.map((r,index)=>{
   const [mode,targetId,choiceIds,beginner,intermediate,advanced]=r;
   if(choiceIds.length!==3||new Set(choiceIds).size!==3||
      !choiceIds.includes(targetId)||choiceIds.some(id=>!ALL_ACTORS.has(id)))
     throw Error('Invalid scene choice contract: '+ep.id+'-'+index);
   return Object.freeze({
    id:'forest-'+ep.id+'-'+(index+1),mode,targetId,
    choiceIds:Object.freeze([...choiceIds]),
    prompts:Object.freeze({'Pre-A1':beginner,A1:intermediate,A2:advanced})
   });
  }));
  return all;
 },{} as Record<ForestEpisode,readonly ForestBlueprint[]>));

export function forestQuestionsForGrade(grade:number|null|undefined):3|4|5{
 if(grade===null||grade===undefined||!Number.isInteger(grade)||grade<1||grade>8)return 4;
 return grade<=2?3:grade<=4?4:5;
}
function hash32(value:number):number{let x=value>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return x>>>0;}
function shuffled<T>(input:readonly T[],seed:number):T[]{
 const result=[...input];let x=seed>>>0;
 for(let i=result.length-1;i>0;i--){x=hash32(x+1013904223);const j=x%(i+1);[result[i],result[j]]=[result[j],result[i]];}
 return result;
}
export function planStoryForestEpisode(input:{
 episode:ForestEpisode;gradeLevel:number|null;englishLevel:ForestPlacement;seed:number;
 history?:readonly ForestAnswer[];
}):ForestDeck{
 const definition=FOREST_EPISODES.find(e=>e.id===input.episode);
 if(!definition||!['Pre-A1','A1','A2'].includes(input.englishLevel))throw Error('Unknown forest episode/placement.');
 const seed=Number.isFinite(input.seed)?input.seed>>>0:0;
 const history=input.history||[];
 const weaknesses=new Map<string,number>();
 for(const row of history){
  if(row.mistakes>0||row.hintUsed){
   weaknesses.set(row.questionId,(weaknesses.get(row.questionId)||0)+Math.max(1,row.mistakes)+(row.hintUsed?1:0));
  }
 }
 const pool=shuffled(FOREST_BANK[input.episode],seed+input.episode*71);
 const ranked=pool.map((q,i)=>({q,i,priority:weaknesses.get(q.id)||0}))
    .sort((a,b)=>b.priority-a.priority||a.i-b.i);
 const questions=ranked.slice(0,forestQuestionsForGrade(input.gradeLevel)).map(({q},i)=>({
  ...q,scene:definition.scene,episode:input.episode,prompt:q.prompts[input.englishLevel],
  choices:shuffled(q.choiceIds,seed+i*193+input.episode*997)
 }));
 return {episode:input.episode,englishLevel:input.englishLevel,gradeLevel:input.gradeLevel,seed,questions};
}
export function validateStoryForestEvidence(answers:readonly ForestAnswer[],deck:ForestDeck):boolean{
 if(answers.length!==deck.questions.length||new Set(answers.map(a=>a.questionId)).size!==answers.length)return false;
 return deck.questions.every((q,index)=>{
  const a=answers[index];
  return a&&a.questionId===q.id&&a.mode===q.mode&&a.placement===deck.englishLevel&&
   a.selectedId===q.targetId&&Number.isInteger(a.mistakes)&&a.mistakes>=0&&
   typeof a.hintUsed==='boolean'&&
   a.firstTryCorrect===(a.mistakes===0&&!a.hintUsed)&&
   typeof a.timestamp==='string'&&Number.isFinite(Date.parse(a.timestamp));
 });
}
export function forestStars(answers:readonly ForestAnswer[]):1|2|3{
 const mistakes=answers.reduce((n,a)=>n+a.mistakes,0);
 const assisted=answers.filter(a=>a.hintUsed).length;
 return mistakes===0&&assisted===0?3:mistakes<=2&&assisted<=2?2:1;
}
