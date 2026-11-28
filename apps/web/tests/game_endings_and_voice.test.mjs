import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {planJourneyStory,narrativeFor} from '../src/lib/learning/storyForestJourneyEngine.ts';
import {VILLAGE_WORDS} from '../src/lib/learning/familyVillageEngine.ts';
import {planTempleMission,templeAllowedWords,templeWord} from '../src/lib/learning/templeEngine.ts';

// Found by playing every chapter of every game to its end screen.
const src=p=>fs.readFileSync(new URL('../src/'+p,import.meta.url),'utf8').replace(/\r\n/g,'\n');

test('Hikâyeyi Keşfet openings use natural English for every starting place',()=>{
 const expected={1:'walks along the forest path',2:'plays near the tree house',3:'walks by the pond',
  4:'walks through the flower meadow',5:'walks around the camp',6:'walks across the wooden bridge'};
 for(const episode of [1,2,3,4,5,6]){
  for(const seed of [0,1,2,3,7,11]){
   const plan=planJourneyStory({episode,englishLevel:'Pre-A1',gradeLevel:1,seed});
   const opening=narrativeFor(plan,'opening');
   assert.ok(opening.endsWith(expected[episode]+'.'),opening);
   assert.doesNotMatch(opening,/along the (tree house|camp|pond|flower meadow|wooden bridge)/);
   const a1=narrativeFor({...plan,englishLevel:'A1'},'result',plan.route.destinations[1].scene);
   assert.doesNotMatch(a1,/follow the path and arrive/);
   const a2=narrativeFor({...plan,englishLevel:'A2'},'opening');
   assert.match(a2,/ sets off from the /);
   assert.doesNotMatch(a2,/sets off through/);
  }
 }
});

test('Aile Köyü · Bir Günüm: the spoken routine calls are natural English',()=>{
 const routines=VILLAGE_WORDS.filter(w=>w.district==='routines');
 assert.equal(routines.length,15);
 for(const word of routines){
  assert.match(word.command,/^Time to [a-z ]+!$/,word.command);
  assert.doesNotMatch(word.command,/Show me/);
 }
 assert.equal(routines.find(w=>w.id==='brush my teeth').command,'Time to brush your teeth!');
});

test('Keşif Tapınağı: weak review words never crowd out a hall’s own words',()=>{
 const when=new Date().toISOString();
 const proof=(id,kind,mistakes)=>({wordId:id,sourceDomain:templeWord(id).domain,kind,mistakes,
  firstTryCorrect:mistakes===0,hintUsed:false,timestamp:when});
 for(const [chamber,own] of [['echo','numbers'],['feast','food'],['home','family']]){
  for(const [gradeLevel,englishLevel] of [[1,'Pre-A1'],[3,'A1'],[6,'A2']]){
   const all=templeAllowedWords(chamber,gradeLevel,englishLevel);
   // Everything was discovered, and every review word was answered wrong before.
   const history=[...all.map(w=>proof(w.id,'discovery',0)),
    ...all.filter(w=>w.domain!==own).map(w=>proof(w.id,'recognition',2))];
   for(const stage of [2,3,4,5]){
    const plan=planTempleMission({chamber,stage,gradeLevel,englishLevel,history,seed:7});
    const mine=plan.words.filter(id=>templeWord(id).domain===own).length;
    assert.ok(mine>=Math.ceil(plan.words.length/2),`${chamber} stage ${stage}: ${plan.words.join(',')}`);
    if(stage>=3){
     const asked=plan.questions.filter(q=>templeWord(q.target).domain===own).length;
     assert.ok(asked>=Math.ceil(plan.questions.length/2),`${chamber} stage ${stage} targets`);
    }
    // Review still takes part: the weakest other-domain words are practised too.
    assert.ok(plan.words.some(id=>templeWord(id).domain!==own),`${chamber} stage ${stage} review`);
   }
  }
 }
});

test('Hikâyeyi Keşfet: the reward names the finished world; phone cards clear the hint button',()=>{
 const forest=src('components/learning/story/StoryForestAdventure.tsx');
 // The shared GameResult card names the finished world and takes the reward focus.
 assert.match(forest,/title=\{active\.title\+' macerasını tamamladın!'\} titleRef=\{rewardHeading\}/);
 assert.doesNotMatch(forest,/Bir Hikâye Daha!/);
 const css=src('components/learning/story/premium-story-art.css');
 const phone=css.slice(css.indexOf('@media(max-width:700px)'));
 assert.match(phone,/\.sj-objects,\.sj-friend-choices\{left:4%;right:4%;bottom:max\(6%,60px\);gap:7px\}/);
});

test('Diyalog Limanı: the object cards are one labelled group and stay compact on phones',()=>{
 const stage=src('components/learning/harbor/HarborSceneStage.tsx');
 assert.match(stage,/const taskId=React\.useId\(\);/);
 assert.match(stage,/<div className="hp-object-task" role="group" aria-labelledby=\{taskId\}>\n    <strong id=\{taskId\}>/);
 assert.doesNotMatch(stage,/aria-label="Sahne görevi"/);
 const css=src('components/learning/harbor/harbor-premium-scene.css');
 assert.match(css,/\.hp-object-choice \.hp-prop-vector\{flex:none;width:52px;height:44px\}/);
 assert.match(css,/\.hp-object-choice\{flex-direction:row;width:auto;min-width:124px;min-height:56px;/);
});

test('Voice: right answers in Lezzet Pazarı, Yazı Atölyesi, Harf Korusu and Tema Kasabası are heard in English',()=>{
 const market=src('components/learning/activities/FoodMarketAdventure.tsx');
 assert.match(market,/if\(stage===2\|\|stage===5\)speak\(id\);/);
 const writing=src('components/learning/writing/WritingWorkshopAdventure.tsx');
 const submit=writing.slice(writing.indexOf(' const submit=()=>{'),writing.indexOf(' const removeTile='));
 assert.match(submit,/soundService\.speakEnglish\(task\.target,\{rate:gradeLevel!==null&&gradeLevel<=2\?\.78:\.88,\n   onEnd:\(\)=>move\(350\),onError:\(\)=>move\(350\)\}\);/);
 assert.match(submit,/if\(!moved\)timer\.current=setTimeout\(\(\)=>move\(0\),voiced\?6000:900\);/);
 assert.doesNotMatch(submit,/\},900\);/);
 const grove=src('components/learning/alphabet/AlphabetGroveAdventure.tsx');
 const finish=grove.slice(grove.indexOf(' const finishTask=(answer:string)=>{'),grove.indexOf(' const addTile='));
 assert.match(finish,/const word=task\.kind==='introduce'\?undefined:task\.word\?\.word;/);
 assert.match(finish,/const voiced=word\?soundService\.speakEnglish\(word,\{rate:gradeLevel!=null&&gradeLevel<=2\?0\.79:0\.9,\n   onEnd:\(\)=>move\(300\),onError:\(\)=>move\(300\)\}\):false;/);
 assert.match(finish,/if\(!moved\)time\.current=setTimeout\(\(\)=>move\(0\),voiced\?5000:850\);/);
 // The evidence row is built before the voice, so hearing the word afterwards never marks it assisted.
 assert.ok(finish.indexOf('const evidence:AlphabetAnswerEvidence')<finish.indexOf('const voiced='));
 const town=src('components/learning/themes/ThemeTownAdventure.tsx');
 const check=town.slice(town.indexOf(' const check=(input:string)=>{'),town.indexOf(' const selectedTiles='));
 assert.match(check,/const english=task\.kind==='discover'\?undefined:task\.audioText\?\?task\.word\?\.en;/);
 assert.match(check,/if\(!moved\)timerRef\.current=setTimeout\(\(\)=>move\(0\),voiced\?5000:750\);/);
 assert.ok(check.indexOf('const evidence:ThemeAnswerEvidence')<check.indexOf('const voiced='));
});

test('Copy: recap labels drop sentence-final dots; Harf Korusu says it is saving while it saves',()=>{
 const recap=src('components/learning/WordRecap.tsx');
 assert.match(recap,/const bare=\(text:string\)=>text\.replace\(\/\[\.!\?\]\+\$\/,''\);/);
 assert.match(recap,/aria-label=\{bare\(word\.tr\)\+', İngilizce '\+bare\(word\.en\)\+', dinle'\}/);
 const grove=src('components/learning/alphabet/AlphabetGroveAdventure.tsx');
 assert.match(grove,/<p role="status">\{saving\?'Yıldızların kaydediliyor…':'Yanıtların hazır\. Kaydı tamamlamak için aşağıdaki düğmeye dokun\.'\}<\/p>/);
});

test('İstekler Meydanı: no 7px guest subtitle on phones (the name stays at the 12px floor)',()=>{
 const css=src('components/learning/sentence/wish-festival.css');
 assert.doesNotMatch(css,/font-size:7px/);
 assert.match(css,/\.wf-guest-label\{font-size:12px;padding:3px 8px\}\.wf-guest-label small\{display:none\}/);
});

test('Every game closes its last chapter with the shared finale, only when the game is really done',()=>{
 const finale=src('components/learning/GameFinale.tsx');
 assert.match(finale,/export function GameFinale\(\{title,detail,tone='light'\}/);
 assert.match(finale,/<span className="game-finale-medal" aria-hidden="true">/);
 const css=src('components/learning/game-finale.css');
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\n \.game-finale\.game-finale,\.game-finale \.game-finale-medal\{animation:none\}/);
 for(const size of css.matchAll(/font-size:(\d+)px/g))assert.ok(Number(size[1])>=12,'finale text >= 12px');
 const games={
  'story/StoryForestAdventure.tsx':/\{episode===6&&<GameFinale /,
  'story/StorySequenceAdventure.tsx':/\{episode===6&&<GameFinale /,
  'story/StoryDetectiveAdventure.tsx':/\{chapter\.episode===6&&<GameFinale /,
  'harbor/HarborSpeechAdventure.tsx':/\{episode===HARBOR_EPISODES\.length&&<GameFinale tone="dark" /,
  'writing/WritingWorkshopAdventure.tsx':/\{chapter===WORKSHOP_CHAPTERS\.length&&<GameFinale tone="dark" /,
  'academy/AcademyAdventure.tsx':/\{!reviewSkill&&zone===ACADEMY_ZONES\.length&&<GameFinale tone="dark" /,
  'alphabet/AlphabetGroveAdventure.tsx':/\{progress\.completed>=ALPHABET_TOTAL_LESSONS&&<GameFinale /,
  'themes/ThemeTownAdventure.tsx':/\{progress\.completed>=progress\.total&&<GameFinale /,
  'activities/FoodMarketAdventure.tsx':/\{aisle==='cafe'&&stage===5&&<GameFinale /,
  'activities/FamilyVillageAdventure.tsx':/\{district==='routines'&&stage===5&&<GameFinale tone="dark" /,
  'activities/TempleAdventure.tsx':/\{chamber==='crown'&&stage===5&&<GameFinale /,
  'activities/ColorGroveAdventure.tsx':/\{step === 3 && <GameFinale tone="dark" /,
  'activities/AnimalMeadowAdventure.tsx':/\{stage===5&&<GameFinale tone="dark" /,
  'sentence/LanternFestivalAdventure.tsx':/<GameFinale tone="dark" title="Cümle Meydanı tamamlandı!"/
 };
 for(const [file,pattern] of Object.entries(games)){
  const code=src('components/learning/'+file);
  assert.match(code,/import \{GameFinale\} from '\.\.\/GameFinale';/,file);
  assert.match(code,pattern,file);
 }
 const academy=src('components/learning/academy/AcademyAdventure.tsx');
 assert.match(academy,/zone===ACADEMY_ZONES\.length\?'YILDIZ ATLASI TAMAMLANDI':'ATLASIN BİR SAYFASI DAHA AYDINLANDI'/);
 // Phones keep the last stop's two actions on the first screen next to the note.
 const academyCss=src('components/learning/academy/academy-adventure.css');
 assert.match(academyCss,/@media\(max-width:650px\)\{\n \.academy-finale \.academy-review\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}\n\}/);
});
