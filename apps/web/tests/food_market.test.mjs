import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MARKET_WORDS,MARKET_AISLES,MARKET_STAGES,MARKET_TOTAL,
 eligibleMarketWords,planMarketMission,marketResumePoint,validMarketAnswers,marketWord,marketNounPhrase,marketMissionStars,MARKET_GAME_ID} from '../src/lib/learning/foodMarketEngine.ts';
import {saveFoodMarketMission,getFoodMarketProgress} from '../src/lib/progress/foodMarketProgress.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {normalizeLearningEvidence,getLearningSnapshot} from '../src/lib/learning/adaptiveLearningEngine.ts';
import {MemoryEconomyStorage,getPassport} from '../src/lib/rewards/economyRepository.ts';

const stamp='2026-11-01T11:15:00.000Z';
const make=(id,kind='recognition',mistakes=0,hintUsed=false)=>({
 wordId:id,kind,mistakes,firstTryCorrect:mistakes===0&&!hintUsed,hintUsed,timestamp:stamp
});
const proof=(stage,aisle='orchard')=>{
 const plan=planMarketMission({aisle,stage,gradeLevel:3,englishLevel:'A1',history:[],seed:123});
 return (stage===1?plan.words:plan.questions.map(q=>q.target))
   .map(id=>make(id,MARKET_STAGES[stage-1].skill));
};
test('G1 curriculum: 45 unique English food and drink items across 3 districts and 15 language lessons',()=>{
 assert.equal(MARKET_WORDS.length,45);
 assert.equal(new Set(MARKET_WORDS.map(x=>x.id)).size,45);
 assert.equal(MARKET_AISLES.length,3);
 assert.equal(MARKET_STAGES.length,5);
 assert.equal(MARKET_TOTAL,15);
 for(const aisle of MARKET_AISLES){
  assert.equal(MARKET_WORDS.filter(w=>w.aisle===aisle.id).length,15);
 }
 for(const word of MARKET_WORDS){
  assert.ok(word.tr&&word.icon&&!/\d/.test(word.id));
  assert.equal(marketWord(word.id).tr,word.tr);
 }
 assert.equal(eligibleMarketWords('orchard',1,'Pre-A1').length,8);
 assert.equal(eligibleMarketWords('orchard',3,'A1').length,12);
 assert.equal(eligibleMarketWords('orchard',7,'A2').length,15);
});
test('G1 mission plan: deterministic, correctly scoped and distractors never match target',()=>{
 for(const lane of ['orchard','bakery','cafe']){
  for(let stage=1;stage<=5;stage++){
   const props={aisle:lane,stage,gradeLevel:3,englishLevel:'A1',history:[],seed:791};
   const p=planMarketMission(props);
   assert.deepEqual(p,planMarketMission(props));
   assert.ok(p.words.length>=6);
   const allowed=new Set(eligibleMarketWords(lane,3,'A1').map(w=>w.id));
   assert.ok(p.words.every(id=>allowed.has(id)));
   for(const q of p.questions){
    assert.equal(q.options.length,3);
    assert.equal(new Set(q.options).size,3);
    assert.ok(allowed.has(q.target));
    assert.ok(q.options.includes(q.target));
    assert.ok(q.options.every(id=>allowed.has(id)));
    if(stage===3)assert.ok(!q.prompt.includes(q.target));
   }
   assert.equal(p.questions.length,stage===1?0:6);
   if(stage===5)assert.equal(new Set(p.questions.map(q=>q.orderPair)).size,3);
  }
 }
});
test('G1 struggling food vocabulary is revisited, grade scope does not exceed policy',()=>{
 const history=[make('apple','recognition',2),make('apple','listening',1,true)];
 const result=planMarketMission({aisle:'orchard',stage:2,englishLevel:'Pre-A1',gradeLevel:1,history,seed:4});
 assert.ok(result.words.includes('apple'));
 assert.equal(result.words.length,6);
 assert.equal(result.questions.length,4);
 assert.ok(result.questions.every(q=>q.options.length===3));
});
test('G1 food evidence stays separate: discovery, listening fallback, independent application',()=>{
 const rows=[make('apple','discovery'),make('apple','listening',0,true),make('apple','application',0,false)];
 assert.equal(validMarketAnswers(rows),true);
 assert.equal(validMarketAnswers([{wordId:'unknown',kind:'listening',timestamp:stamp}]),false);
 const normalized=normalizeLearningEvidence([],[],[],rows);
 assert.equal(normalized.filter(x=>x.domain==='food').length,3);
 assert.equal(normalized.find(x=>x.skill==='discovery').independent,false);
 assert.equal(normalized.find(x=>x.skill==='listening').independent,false);
 assert.equal(normalized.find(x=>x.skill==='application').independent,true);
 const snapshot=getLearningSnapshot({animalAnswers:[],animalWords:[],colorAnswers:[],colorWords:[],
  foodAnswers:rows,foodWords:['apple'],now:'2026-11-01T15:15:00.000Z'});
 assert.equal(snapshot.domainStats.food.discovered,1);
 assert.equal(snapshot.domainStats.food.practiced,1);
});
test('G1 saved missions persist by child profile, lock future stages and prevent duplicate stars/coins',async()=>{
 const repo=new MemoryProgressRepository();
 const first=await repo.createProfile({nickname:'Market Child',avatarId:'avatar_explorer'});
 const second=await repo.createProfile({nickname:'Other Child',avatarId:'avatar_explorer'});
 const now=Date.now();
 await assert.rejects(saveFoodMarketMission(repo,first.id,'orchard',2,0,20,proof(2),'no-stage1'),/Önceki/);
 await assert.rejects(saveFoodMarketMission(repo,first.id,'bakery',1,0,20,proof(1,'bakery'),'locked-bakery'),/önceki pazar sokağını/i);
 for(let stage=1;stage<=5;stage++){
  await saveFoodMarketMission(repo,first.id,'orchard',stage,0,20,proof(stage),'orchard-'+stage);
 }
 let p=await getFoodMarketProgress(repo,first.id);
 assert.equal(p.completedByAisle.orchard,5);
 assert.equal(p.completedLevels,5);
 assert.equal(p.starsByLevel[5],3);
 assert.equal((await repo.getTotalStars(first.id,MARKET_GAME_ID)),15);
 assert.equal((await repo.getFoodAnswerHistory(second.id)).length,0);
 assert.equal((await getFoodMarketProgress(repo,second.id)).completedLevels,0);
 await saveFoodMarketMission(repo,first.id,'bakery',1,1,19,proof(1,'bakery'),'bakery-1');
 p=await getFoodMarketProgress(repo,first.id);
 assert.equal(p.starsByLevel[6],2);
 await saveFoodMarketMission(repo,first.id,'orchard',1,0,20,proof(1),'orchard-1');
 assert.equal((await repo.getTotalStars(first.id,MARKET_GAME_ID)),17);
 const store=new MemoryEconomyStorage();
 const wallet=await getPassport(repo,first.id,store,new Date());
 assert.equal(wallet.worldStats.find(x=>x.id===MARKET_GAME_ID).completed,6);
 assert.equal(wallet.balance,60);
 assert.ok(wallet.learned.food>0);
 assert.ok(now>0);
});
test('G1 content is English-focused, never a math or money game, and linked in the map',()=>{
 const ui=fs.readFileSync(new URL('../src/components/learning/activities/FoodMarketAdventure.tsx',import.meta.url),'utf8');
 const map=fs.readFileSync(new URL('../src/components/learning/WordGardenDistrictMap.tsx',import.meta.url),'utf8');
 const mod=fs.readFileSync(new URL('../src/components/learning/LearningPathModal.tsx',import.meta.url),'utf8');
 assert.match(ui,/Listen and find it/);
 assert.match(ui,/Customer says:/);
 assert.match(ui,/Shopping list/);
 assert.doesNotMatch(ui,/calculate|profit|checkout payment|change due/i);
 assert.match(map,/onEnterFood/);
 assert.match(mod,/saveFoodMarketMission/);
});

test('G1 market illustrations distinguish visually selectable products and order phrases are grammatical',()=>{
 for(const lane of MARKET_AISLES){
  const icons=MARKET_WORDS.filter(w=>w.aisle===lane.id).map(w=>w.icon);
  assert.equal(new Set(icons).size,icons.length,`Duplicate visual icon in ${lane.id}`);
 }
 assert.equal(marketNounPhrase('apple'),'an apple');
 assert.equal(marketNounPhrase('banana'),'a banana');
 assert.equal(marketNounPhrase('bread'),'some bread');
 assert.equal(marketNounPhrase('grapes'),'some grapes');
 const plan=planMarketMission({aisle:'orchard',stage:4,englishLevel:'A1',gradeLevel:3,history:[],seed:92});
 assert.ok(plan.questions.every(q=>/^(I would like|Can I have) (a|an|some) /.test(q.prompt)));
});

test('G1 distinct dialogue responses and accessible market cart actions exist',()=>{
 const ui=fs.readFileSync(new URL('../src/components/learning/activities/FoodMarketAdventure.tsx',import.meta.url),'utf8');
 assert.match(ui,/fm-dialogue-option/);
 assert.match(ui,/fm5-dialogue-option/);
 assert.doesNotMatch(ui,/You asked for \{marketNounPhrase\(id\)\}/);
 assert.match(ui,/onDrop=\{event=>/);
 assert.match(ui,/onClick=\{\(\)=>choose\(id\)\}/);
 assert.match(ui,/stage===5\?current\.words:task\.options/);
});

test('G1 learner resumes correct incomplete stage when returning after finishing first or second street',()=>{
 assert.deepEqual(marketResumePoint({orchard:0,bakery:0,cafe:0}),{aisle:'orchard',stage:1});
 assert.deepEqual(marketResumePoint({orchard:3,bakery:0,cafe:0}),{aisle:'orchard',stage:4});
 assert.deepEqual(marketResumePoint({orchard:5,bakery:0,cafe:0}),{aisle:'bakery',stage:1});
 assert.deepEqual(marketResumePoint({orchard:5,bakery:2,cafe:0}),{aisle:'bakery',stage:3});
 assert.deepEqual(marketResumePoint({orchard:5,bakery:5,cafe:0}),{aisle:'cafe',stage:1});
 assert.deepEqual(marketResumePoint({orchard:5,bakery:5,cafe:5}),{aisle:'cafe',stage:5});
});
test('G1 entire 15-level path yields exactly 45 stars and 150 first-time earned coins',async()=>{
 const repo=new MemoryProgressRepository();
 const p=await repo.createProfile({nickname:'Full market',avatarId:'avatar_explorer'});
 for(const aisle of ['orchard','bakery','cafe']){
  for(let stage=1;stage<=5;stage++){
   await saveFoodMarketMission(repo,p.id,aisle,stage,0,12,proof(stage,aisle),`${aisle}-${stage}`);
  }
 }
 const progress=await getFoodMarketProgress(repo,p.id);
 assert.equal(progress.completedLevels,15);
 assert.deepEqual(progress.completedByAisle,{orchard:5,bakery:5,cafe:5});
 assert.equal(await repo.getTotalStars(p.id,MARKET_GAME_ID),45);
 const storage=new MemoryEconomyStorage();
 const wallet=await getPassport(repo,p.id,storage,new Date());
 assert.equal(wallet.balance,150);
 assert.equal(wallet.worldStats.find(w=>w.id===MARKET_GAME_ID).completed,15);
 await saveFoodMarketMission(repo,p.id,'cafe',5,0,15,proof(5,'cafe'),'cafe-5');
 assert.equal((await getPassport(repo,p.id,storage,new Date())).balance,150);
});

test('G1 live map accessibility: food area is playable without completing Number Valley',()=>{
 const modal=fs.readFileSync(new URL('../src/components/learning/LearningPathModal.tsx',import.meta.url),'utf8');
 const map=fs.readFileSync(new URL('../src/components/learning/WordGardenDistrictMap.tsx',import.meta.url),'utf8');
 const layout=fs.readFileSync(new URL('../src/components/learning/world/worldLayout.ts',import.meta.url),'utf8');
 assert.match(modal,/foodUnlocked=\{true\}/);
 assert.match(modal,/foodAvailable=\{foodLoaded&&!foodError\}/);
 assert.doesNotMatch(modal,/foodUnlocked=\{[^}]*completedByBand/);
 assert.match(layout,/d\.id==='food'\?\{\.\.\.d,unlocked:foodUnlocked\}/);
 assert.match(map,/foodUnlocked&&foodAvailable/);
 assert.match(map,/onEnterFood/);
 const theme=fs.readFileSync(new URL('../src/components/learning/world/gardenTheme.ts',import.meta.url),'utf8');
 assert.match(theme,/districtStatus/);
 assert.match(map,/districtStatusLabel/);
 assert.match(map,/districtStatus\(p\)/);
 assert.match(map,/onEnterTemple/);
 assert.match(map,/templeError/);
 assert.match(map,/districtStatus\(p\)/);
});

test('G1.5: every eligible food item becomes discoverable through repeated stage-one missions',()=>{
 for(const aisle of ['orchard','bakery','cafe']){
  for(const [gradeLevel,englishLevel] of [[1,'Pre-A1'],[3,'A1'],[6,'A2']]){
   const history=[],seen=new Set();
   const available=eligibleMarketWords(aisle,gradeLevel,englishLevel);
   for(let visit=0;visit<8;visit++){
    const plan=planMarketMission({aisle,stage:1,gradeLevel,englishLevel,history,seed:100+visit});
    for(const id of plan.words){seen.add(id);history.push(make(id,'discovery'));}
   }
   assert.equal(seen.size,available.length,`Incomplete word discovery ${aisle} ${englishLevel}`);
  }
 }
});
test('G1.6: listening choices unlock only after completed voice or explicit assisted fallback',()=>{
 const code=fs.readFileSync(new URL('../src/components/learning/activities/FoodMarketAdventure.tsx',import.meta.url),'utf8');
 assert.match(code,/soundService\.speakEnglish\(text/);
 assert.match(code,/onEnd:.*if\(listenGate\)setHeard\(true\)/);
 assert.match(code,/onError:.*if\(token===speechRun\.current\).*setSpeaking\(false\)/);
 assert.match(code,/if\(stage===3&&!heard&&!hint\)return/);
 assert.match(code,/hint\|\|\(stage===3&&!heard\)/);
 assert.match(code,/aria-label=\{showEnglish\?/);
});

test('G4 local food art covers all 45 words and three distinct market streets',()=>{
 const read=(relative)=>fs.readFileSync(new URL(relative,import.meta.url),'utf8');
 const sprite=read('../public/assets/foods/food-sprite-v4.svg');
 const ids=[...sprite.matchAll(/<symbol id="food-([a-z]+)" viewBox=/g)].map(x=>x[1]);
 assert.equal(ids.length,45);
 assert.deepEqual(new Set(ids),new Set(MARKET_WORDS.map(w=>w.id)));
 assert.equal(sprite.match(/<\/symbol>/g)?.length,45);
 assert.doesNotMatch(sprite,/href=["']https?:/);
 for(const name of ['orchard','bakery','cafe']){
  const scene=read('../public/assets/foods/market-'+name+'-v4.svg');
  assert.match(scene,/^<svg /);
  assert.match(scene,/<\/svg>$/);
  assert.match(scene,/viewBox="0 0 1280 720"/);
  assert.ok(scene.length>9000);
 }
});
test('G4 native-capable voice, product artwork, retry and tap safety contracts',()=>{
 const read=(relative)=>fs.readFileSync(new URL(relative,import.meta.url),'utf8');
 const code=read('../src/components/learning/activities/FoodMarketAdventure.tsx');
 const css=read('../src/components/learning/activities/food-market-v4.css');
 assert.match(code,/food-sprite-v4\.svg#food-/);
 assert.match(code,/market-orchard-v4\.svg/);
 assert.match(code,/market-bakery-v4\.svg/);
 assert.match(code,/market-cafe-v4\.svg/);
 assert.match(code,/function FoodIllustration/);
 assert.match(code,/function BasketIllustration/);
 assert.match(code,/soundService\.hasEnglishSpeech\(\)/);
 assert.match(code,/soundService\.cancelSpeech\(\)/);
 assert.match(code,/visitedRef\.current\.has\(id\)/);
 assert.match(code,/answerLock\.current=true/);
 assert.match(code,/answerLock\.current=false/);
 assert.match(code,/ready:stage===1&&Boolean\(current\?\.words.length\)/);
 assert.match(code,/Boolean\(saveError\)/);
 assert.match(code,/onAdvance:advance/);
 assert.match(code,/onDrop=\{event=>/);
 assert.match(code,/onClick=\{\(\)=>choose\(id\)\}/);
 assert.match(code,/Kaydetmeyi Tekrar Dene/);
 assert.doesNotMatch(code,/Tüm Ürünleri Keşfettim/);
 assert.doesNotMatch(code,/fm-product-art.*w\.icon/);
 assert.match(css,/@media\(max-width:359px\)/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(css,/focus-visible/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/touch-action:manipulation/);
});
test('G4 questions never use unknown distractors when enough foods are discovered',()=>{
 const ids=['apple','banana','orange','strawberry'];
 const history=ids.map(id=>make(id,'discovery'));
 const plan=planMarketMission({aisle:'orchard',stage:2,gradeLevel:1,englishLevel:'Pre-A1',history,seed:47});
 assert.ok(plan.questions.length>0);
 assert.ok(plan.questions.every(q=>ids.includes(q.target)));
 assert.ok(plan.questions.every(q=>q.options.every(option=>ids.includes(option))));
});

test('G5 recognition assesses English words, never copies the featured illustration into answer options',()=>{
 const ui=fs.readFileSync(new URL('../src/components/learning/activities/FoodMarketAdventure.tsx',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../src/components/learning/activities/food-market-logic-v5.css',import.meta.url),'utf8');
 const imagePrompt=ui.indexOf('{stage===2&&<div className="fm-featured');
 const textChoice=ui.indexOf('stage===2?\n         <div className="fm5-word-choices"');
 const speech=ui.indexOf('stage===4?\n         <div className="fm-dialogue-choices');
 assert.ok(imagePrompt>0 && textChoice>imagePrompt && speech>textChoice);
 const answerUI=ui.slice(textChoice,speech);
 assert.match(answerUI,/fm5-word-label/);
 assert.match(answerUI,/\{id\.toUpperCase\(\)\}/);
 assert.doesNotMatch(answerUI,/FoodIllustration|<Item|\.icon/,'no picture matching in English recognition');
 assert.doesNotMatch(ui,/showEnglish=\{stage===2\}/);
 assert.match(css,/fm5-word-option/);
});
test('G5 listening and customer dialogue do not print or duplicate the answer without assisted mode',()=>{
 const ui=fs.readFileSync(new URL('../src/components/learning/activities/FoodMarketAdventure.tsx',import.meta.url),'utf8');
 const intro=ui.slice(ui.indexOf('<div className="fm-command fm4-command">',ui.indexOf('<div className="fm-command fm4-command">')+1),
  ui.indexOf('{stage===2&&<div className="fm-featured'));
 assert.match(intro,/Customer says:/);
 assert.doesNotMatch(intro,/stage===4\?<><strong>Customer says:<\/strong><strong className="fm-english">\{task.prompt\}/);
 assert.match(ui,/\(stage===3\|\|stage===4\)&&<div className="fm-audio-panel/);
 assert.match(ui,/stage===4&&!heard&&!hint\)return/);
 assert.match(ui,/Yazılı destek:/);
 assert.match(ui,/stage===4\?task.prompt:task.target.toUpperCase\(\)/);
 const response=ui.slice(ui.indexOf('stage===4?\n         <div className="fm-dialogue-choices'),ui.indexOf('stage===5?current.words:task.options'));
 assert.match(response,/fm5-dialogue-option/);
 assert.match(response,/FoodIllustration id=\{id\}/);
 assert.doesNotMatch(response,/marketNounPhrase\(id\)|\{task.prompt\}|\{id.toUpperCase\(\)\}/);
 assert.match(response,/\(!heard&&!hint\)/);
});
test('G5 orders say FIRST and THEN, and every pair has two different targets',()=>{
 for(const aisle of MARKET_AISLES){
  for(const [gradeLevel,englishLevel] of [[1,'Pre-A1'],[4,'A1'],[7,'A2']]){
   for(let seed=1;seed<=5;seed++){
    const plan=planMarketMission({aisle:aisle.id,stage:5,gradeLevel,englishLevel,history:[],seed});
    assert.equal(plan.questions.length,6);
    assert.equal(new Set(plan.questions.map(q=>q.target)).size,6,'distinct products per order session');
    for(let i=0;i<6;i+=2){
     const first=plan.questions[i],second=plan.questions[i+1];
     assert.equal(first.orderPair,second.orderPair);
     assert.equal(first.prompt,second.prompt);
     assert.equal(first.audio,first.prompt);
     assert.equal(second.audio,second.prompt);
     assert.equal(first.prompt,`First, find ${marketNounPhrase(first.target)}. Then, find ${marketNounPhrase(second.target)}.`);
    }
   }
  }
 }
});
test('G5 stars do not treat pronunciation and written hints as perfect independent mastery',async()=>{
 assert.equal(marketMissionStars(0,[make('apple','recognition')]),3);
 assert.equal(marketMissionStars(0,[make('apple','recognition',0,true)]),2);
 assert.equal(marketMissionStars(0,[...Array(3)].map(()=>make('apple','recognition',0,true))),1);
 assert.equal(marketMissionStars(1,[make('apple','recognition')]),2);
 assert.equal(marketMissionStars(3,[make('apple','recognition')]),1);
 const repo=new MemoryProgressRepository();
 const child=await repo.createProfile({nickname:'Hinted market learner',avatarId:'avatar_explorer'});
 await saveFoodMarketMission(repo,child.id,'orchard',1,0,11,proof(1),'hinted-discovery');
 const aided=proof(2);aided[0]={...aided[0],hintUsed:true,firstTryCorrect:false};
 await saveFoodMarketMission(repo,child.id,'orchard',2,0,11,aided,'hinted-quiz');
 let p=await getFoodMarketProgress(repo,child.id);
 assert.equal(p.starsByLevel[2],2,'assisted recognition cannot earn three stars');
 await saveFoodMarketMission(repo,child.id,'orchard',2,0,11,proof(2),'unassisted-replay');
 p=await getFoodMarketProgress(repo,child.id);
 assert.equal(p.starsByLevel[2],3,'independent replay can improve the best star rating');
});
test('G5 wrong taps, assist buttons, progress and responsive answer cards are guarded',()=>{
 const ui=fs.readFileSync(new URL('../src/components/learning/activities/FoodMarketAdventure.tsx',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../src/components/learning/activities/food-market-logic-v5.css',import.meta.url),'utf8');
 assert.match(ui,/wrongRef\.current\.has\(id\)/);
 assert.match(ui,/wrongRef\.current\.add\(id\)/);
 assert.match(ui,/setWrongIds\(\[\.\.\.wrongRef\.current\]\)/);
 assert.match(ui,/wrongRef\.current\.clear\(\)/);
 assert.match(ui,/onClick=\{\(\)=>\{setHint\(true\);speak\(task.audio\);\}\}/);
 assert.match(ui,/marketMissionStars\(wrong,answers\)/);
 assert.match(ui,/stage===5&&answers.some\(a=>a.kind==='application'&&a.wordId===id\)/);
 assert.match(ui,/q%2===0\?'1\. ürün: FIRST':'2\. ürün: THEN'/);
 assert.match(css,/@media\(max-width:680px\)/);
 assert.match(css,/@media\(max-width:359px\)/);
 assert.match(css,/touch-action:manipulation/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test('G5 higher A2 customer orders require selecting requested rather than rejected items',()=>{
 for(const aisle of MARKET_AISLES){
  const plan=planMarketMission({aisle:aisle.id,stage:4,englishLevel:'A2',gradeLevel:7,history:[],seed:209});
  const contrasting=plan.questions.filter(q=>q.prompt.startsWith("I don't want "));
  assert.ok(contrasting.length>=2,'A2 must contain some negation and preference contexts');
  for(const q of contrasting){
   assert.match(q.prompt,/I would like /);
   assert.equal(q.audio,q.prompt);
   assert.ok(q.prompt.includes(marketNounPhrase(q.target)));
   assert.ok(q.options.some(id=>id!==q.target&&q.prompt.includes(marketNounPhrase(id))),
     'rejected item must also be visible, so keyword spotting alone is not enough');
  }
  const beginner=planMarketMission({aisle:aisle.id,stage:4,englishLevel:'Pre-A1',gradeLevel:1,history:[],seed:209});
  assert.ok(beginner.questions.every(q=>!q.prompt.includes("I don't want ")));
 }
});

test('G1 visual V6 keeps market assets resolvable and UI design independent of engine',()=>{
 const ui=fs.readFileSync(new URL('../src/components/learning/activities/FoodMarketAdventure.tsx',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../src/components/learning/activities/food-market-visual-v6.css',import.meta.url),'utf8');
 assert.match(ui,/import '\.\/food-market-visual-v6\.css'/);
 assert.match(ui,/className="fm-screen fm4-screen fm6-screen"/);
 assert.match(ui,/data-aisle=\{aisle\}/);
 assert.match(ui,/data-current=\{lane\.id===aisle\}/);
 assert.match(ui,/data-completed=\{progress\.starsByLevel/);
 assert.match(ui,/useAutoQuestionAdvance/);
 assert.match(ui,/await onSave\(aisle,stage,wrong/);
 for(const asset of ['market-orchard-v6.webp','market-bakery-v4.svg','market-cafe-v4.svg']){
  assert.ok(fs.existsSync(new URL('../public/assets/foods/'+asset,import.meta.url)),asset);
  assert.ok(ui.includes(asset),'scene art must reference an existing local asset');
 }
 for(const selector of ['.fm6-screen','.fm6-lane-art','.fm4-stage-pill','.fm4-product','.fm5-word-option','.fm4-scenery']){
  assert.ok(css.includes(selector),'V6 lacks '+selector);
 }
 assert.match(css,/@media\(max-width:680px\)/);
 assert.match(css,/@media\(max-width:359px\)/);
 assert.match(css, /prefers-reduced-motion:reduce/);
});

test('G1 V6 orchard hero is a real, compressed local WebP connected to the market',()=>{
 const file=new URL('../public/assets/foods/market-orchard-v6.webp',import.meta.url);
 const bytes=fs.readFileSync(file);
 assert.ok(bytes.length>50000&&bytes.length<180000,'hero WebP should be detailed but compressed');
 assert.equal(bytes.toString('ascii',0,4),'RIFF','RIFF header');
 assert.equal(bytes.toString('ascii',8,12),'WEBP','WebP signature');
 const ui=fs.readFileSync(new URL('../src/components/learning/activities/FoodMarketAdventure.tsx',import.meta.url),'utf8');
 assert.match(ui,/orchard:'\/assets\/foods\/market-orchard-v6\.webp'/);
 assert.match(ui,/<MarketBackdrop aisle=\{aisle\}\/>/);
});
