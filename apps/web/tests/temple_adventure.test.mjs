import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TEMPLE_GAME_ID,TEMPLE_TOTAL,TEMPLE_WORDS,TEMPLE_STAGES,TEMPLE_CHAMBERS,
 templeAllowedWords,templeResumePoint,planTempleMission,sentenceFor,templeWeakWords,templeWord,validTempleAnswers
} from '../src/lib/learning/templeEngine.ts';
import {getTempleProgress,saveTempleMission} from '../src/lib/progress/templeProgress.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {getLearningSnapshot,normalizeLearningEvidence} from '../src/lib/learning/adaptiveLearningEngine.ts';
import {MemoryEconomyStorage,getPassport} from '../src/lib/rewards/economyRepository.ts';
import {getDistrictObjects} from '../src/components/learning/world/worldLayout.ts';
const when='2026-11-01T13:15:00.000Z';
const proof=(id,kind='recognition',mistakes=0,hintUsed=false)=>({
 wordId:id,sourceDomain:templeWord(id).domain,kind,mistakes,
 firstTryCorrect:mistakes===0&&!hintUsed,hintUsed,timestamp:when
});
function completeAnswers(chamber,stage){
 const plan=planTempleMission({chamber,stage,gradeLevel:3,englishLevel:'A1',history:[],seed:18});
 return (stage===1?plan.words:plan.questions.map(q=>q.target)).map(id=>proof(id,TEMPLE_STAGES[stage-1].kind));
}
test('G3: all 5 chambers and 25 distinctly recorded trials use existing English domains',()=>{
 assert.equal(TEMPLE_CHAMBERS.length,5);
 assert.equal(TEMPLE_STAGES.length,5);
 assert.equal(TEMPLE_TOTAL,25);
 assert.ok(TEMPLE_WORDS.length>=170,'must remix broad vocabulary from previous worlds');
 assert.equal(new Set(TEMPLE_WORDS.map(w=>w.id)).size,TEMPLE_WORDS.length);
 assert.deepEqual(new Set(TEMPLE_WORDS.map(w=>w.domain)),new Set(['animals','colors','numbers','food','family']));
 for(const w of TEMPLE_WORDS){assert.ok(w.en&&w.tr&&w.icon&&w.context);}
 const novice=templeAllowedWords('crown',1,'Pre-A1');
 const advanced=templeAllowedWords('crown',7,'A2');
 assert.ok(novice.length>40);
 assert.ok(advanced.length>novice.length);
 assert.ok(advanced.some(w=>w.id==='numbers:1000'));
 assert.ok(!novice.some(w=>w.id==='numbers:1000'));
});
test('G3: deterministic mission plan has unique valid choices, complete ordered-sentence and paired-seal instructions',()=>{
 for(const chamber of TEMPLE_CHAMBERS)for(const stage of TEMPLE_STAGES){
  const args={chamber:chamber.id,stage:stage.stage,gradeLevel:3,englishLevel:'A1',history:[],seed:191};
  const plan=planTempleMission(args);
  assert.deepEqual(plan,planTempleMission(args));
  assert.equal(plan.words.length,8);
  assert.equal(new Set(plan.words).size,8);
  assert.equal(plan.questions.length,stage.stage===1?0:6);
  const valid=new Set(templeAllowedWords(chamber.id,3,'A1').map(w=>w.id));
  for(const question of plan.questions){
   assert.equal(question.options.length,3);
   assert.equal(new Set(question.options).size,3);
   assert.ok(question.options.every(id=>valid.has(id)));
   assert.ok(question.options.includes(question.target));
   if(stage.stage===3)assert.equal(question.prompt,'Listen and choose');
   if(stage.stage===4){
    assert.ok(question.sentenceAnswer.length>=4);
    assert.equal(question.sentenceAnswer.length,question.sentenceTokens.length);
    assert.deepEqual([...question.sentenceAnswer].sort(),[...question.sentenceTokens].sort());
   }
   if(stage.stage===5)assert.ok(Number.isInteger(question.pair)&&question.pair>=0&&question.pair<=2);
  }
 }
});
test('G3: all eligible words become discoverable via repeated temple visits',()=>{
 for(const chamber of TEMPLE_CHAMBERS)for(const [grade,level] of [[1,'Pre-A1'],[3,'A1'],[7,'A2']]){
  const total=new Set(templeAllowedWords(chamber.id,grade,level).map(w=>w.id));
  const history=[],seen=new Set();
  for(let visit=0;visit<Math.ceil(total.size/6)+2;visit++){
   const plan=planTempleMission({chamber:chamber.id,stage:1,gradeLevel:grade,
    englishLevel:level,history,seed:visit+100});
   for(const id of plan.words){seen.add(id);history.push(proof(id,'discovery'));}
  }
  assert.equal(seen.size,total.size,`incomplete vocabulary ${chamber.id} ${grade} ${level}`);
 }
});
test('G3: weakness in earlier games prioritizes the same concept and repeats preserve context',()=>{
 const prior={animals:[{wordId:'cat',kind:'recognition',mistakes:2,firstTryCorrect:false,hintUsed:true,timestamp:when}],
  colors:[],numbers:[],food:[],family:[]};
 const weak=templeWeakWords(prior);
 assert.ok(weak.has('animals:cat'));
 const plan=planTempleMission({chamber:'rune',stage:2,gradeLevel:3,englishLevel:'A1',history:[],weak,seed:12});
 assert.ok(plan.words.includes('animals:cat'));
 assert.equal(sentenceFor(templeWord('animals:owl')).join(' '),'I can see an owl.');
 assert.equal(sentenceFor(templeWord('numbers:5')).join(' '),'I can count to five.');
 assert.equal(sentenceFor(templeWord('colors:blue')).join(' '),'I can see a blue crystal.');
});
test('G3: discovery, hinted listening, word-order errors and independent seal solutions are distinguished in P3',()=>{
 const answers=[proof('animals:cat','discovery'),proof('animals:cat','listening',0,true),
  proof('animals:cat','sentence',2,false),proof('animals:cat','sequence')];
 assert.equal(validTempleAnswers(answers),true);
 assert.equal(validTempleAnswers([{wordId:'hack',sourceDomain:'animals',kind:'sequence',timestamp:when}]),false);
 const normalized=normalizeLearningEvidence([],[],[],[],[],answers).filter(x=>x.domain==='temple');
 assert.equal(normalized.length,4);
 assert.equal(normalized.filter(x=>x.independent).length,1);
 const snapshot=getLearningSnapshot({animalAnswers:[],colorAnswers:[],animalWords:[],colorWords:[],
  templeAnswers:answers,templeWords:['animals:cat'],now:'2026-11-01T20:00:00.000Z'});
 assert.equal(snapshot.domainStats.temple.discovered,1);
 assert.equal(snapshot.domainStats.temple.practiced,1);
 assert.equal(snapshot.independentAnswers,1);
 assert.equal(snapshot.assistedAnswers,2);
});
test('G3: all 25 missions persist by child, award 75 stars and 250 unique coins only once',async()=>{
 const repo=new MemoryProgressRepository();
 const child=await repo.createProfile({nickname:'Temple Learner',avatarId:'avatar_explorer'});
 const other=await repo.createProfile({nickname:'Second Learner',avatarId:'avatar_explorer'});
 await assert.rejects(saveTempleMission(repo,child.id,'echo',1,0,12,completeAnswers('echo',1),'blocked'),/önceki/i);
 await assert.rejects(saveTempleMission(repo,child.id,'rune',3,0,12,completeAnswers('rune',3),'skipped'),/önceki/i);
 for(const room of TEMPLE_CHAMBERS)for(const step of TEMPLE_STAGES){
   await saveTempleMission(repo,child.id,room.id,step.stage,0,18,completeAnswers(room.id,step.stage),
     `temple:${room.id}:${step.stage}`);
 }
 const completed=await getTempleProgress(repo,child.id);
 assert.equal(completed.completedLevels,25);
 assert.equal(completed.totalLevels,25);
 assert.equal(await repo.getTotalStars(child.id,TEMPLE_GAME_ID),75);
 assert.equal((await repo.getTempleAnswerHistory(other.id)).length,0);
 assert.equal((await getTempleProgress(repo,other.id)).completedLevels,0);
 const economy=new MemoryEconomyStorage();
 const wallet=await getPassport(repo,child.id,economy,new Date('2026-11-01T20:00:00Z'));
 assert.equal(wallet.worldStats.find(w=>w.id===TEMPLE_GAME_ID).completed,25);
 assert.equal(wallet.balance,250);
 assert.ok(wallet.learned.temple>0);
 await saveTempleMission(repo,child.id,'crown',5,0,10,completeAnswers('crown',5),'temple:crown:5');
 assert.equal((await getPassport(repo,child.id,economy,new Date('2026-11-01T20:00:00Z'))).balance,250);
});
test('G3: future stages locked, temple open independently, and returning resumes correctly',()=>{
 assert.deepEqual(templeResumePoint({rune:0,echo:0,feast:0,home:0,crown:0}),{chamber:'rune',stage:1});
 assert.deepEqual(templeResumePoint({rune:5,echo:3,feast:0,home:0,crown:0}),{chamber:'echo',stage:4});
 assert.deepEqual(templeResumePoint({rune:5,echo:5,feast:5,home:5,crown:5}),{chamber:'crown',stage:5});
 assert.equal(getDistrictObjects(false,false,false,false,true).find(x=>x.id==='sanctuary')?.unlocked,true);
 assert.equal(getDistrictObjects(false,false,false,false,true).find(x=>x.id==='food')?.unlocked,false);
});
test('G3: accessible active map, all five temple challenges, audio completion and sentence interaction are wired',()=>{
 const ui=fs.readFileSync(new URL('../src/components/learning/activities/TempleAdventure.tsx',import.meta.url),'utf8');
 const map=fs.readFileSync(new URL('../src/components/learning/WordGardenDistrictMap.tsx',import.meta.url),'utf8');
 const modal=fs.readFileSync(new URL('../src/components/learning/LearningPathModal.tsx',import.meta.url),'utf8');
 const scene=fs.readFileSync(new URL('../src/components/learning/activities/TempleScenery.tsx',import.meta.url),'utf8');
 assert.match(ui,/stage===4/);assert.match(ui,/chooseToken/);assert.match(ui,/current.words:task.options/);
 assert.match(ui,/soundService\.speakEnglish\(text/);assert.match(ui,/onEnd:.*setHeard\(true\)/);
 assert.match(ui,/aria-label="Oluşturulan İngilizce cümle"/);
 assert.match(ui,/role="progressbar"/);
 assert.match(map,/onEnterTemple/);
 assert.match(modal,/templeUnlocked=\{true\}/);
 assert.match(modal,/saveTempleMission/);
 assert.match(scene,/ENGLISH TEMPLE/);
});

test('G3: every English sentence has at least four tokens and natural family/food grammar',()=>{
 for(const concept of TEMPLE_WORDS){
  const words=sentenceFor(concept);
  assert.ok(words.length>=4,`Too short: ${concept.id}`);
  assert.ok(words.at(-1).endsWith('.'),`Punctuation missing: ${concept.id}`);
 }
 assert.equal(sentenceFor(templeWord('food:apple')).join(' '),'I would like an apple.');
 assert.equal(sentenceFor(templeWord('food:bread')).join(' '),'I would like some bread.');
 assert.equal(sentenceFor(templeWord('family:mother')).join(' '),'This is my mother.');
 assert.equal(sentenceFor(templeWord('family:kitchen')).join(' '),'This is the kitchen.');
 assert.equal(sentenceFor(templeWord('family:wake up')).join(' '),'Every day, I wake up.');
});

test('G3: cross-world homonyms never create ambiguous same-label correct/incorrect options',()=>{
 for(const chamber of TEMPLE_CHAMBERS)for(const stage of TEMPLE_STAGES){
  for(let seed=1;seed<=22;seed++){
   const plan=planTempleMission({chamber:chamber.id,stage:stage.stage,gradeLevel:7,
    englishLevel:'A2',history:[],seed});
   assert.equal(new Set(plan.words.map(id=>templeWord(id).en)).size,plan.words.length);
   for(const question of plan.questions){
    assert.equal(new Set(question.options.map(id=>templeWord(id).en)).size,3);
    assert.equal(new Set(question.options.map(id=>templeWord(id).tr)).size,3);
   }
  }
 }
});
