import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 LANTERN_CHAPTERS,LANTERN_COLORS,LANTERN_PLACES,LANTERN_ANIMALS,
 lanternRoundsForGrade,lanternWordLimit,lanternCurriculumPool,planLanternFestival,
 checkLanternColor,checkLanternPlace,checkLanternAnimal,
 checkLanternRepair,checkLanternSentence
} from '../src/lib/learning/lanternFestivalEngine.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {getSentencePlazaProgress,saveSentencePlazaMission}
 from '../src/lib/progress/sentencePlazaProgress.ts';
import {planPlazaMission,SENTENCE_PLAZA_GAME_ID} from '../src/lib/learning/sentencePlazaEngine.ts';
const evidence=plan=>plan.deck.questions.map(q=>({
 questionId:q.id,skill:'transfer',placement:plan.englishLevel,sentenceKind:q.kind,
 challengeMode:q.mode,mistakes:0,hintUsed:false,modelHeard:false,
 firstTryCorrect:true,timestamp:'2026-11-03T16:01:00.000Z'
}));
test('Lantern Festival is a real fourth-stage transfer game with original animated night art',()=>{
 assert.deepEqual(LANTERN_CHAPTERS.map(x=>x.id),[1,2,3,4]);
 assert.equal(LANTERN_COLORS.length,6);assert.equal(LANTERN_PLACES.length,4);
 assert.equal(LANTERN_ANIMALS.length,4);
 const parent=fs.readFileSync(new URL('../src/components/learning/sentence/SentencePlazaAdventure.tsx',import.meta.url),'utf8');
 const ui=fs.readFileSync(new URL('../src/components/learning/sentence/LanternFestivalAdventure.tsx',import.meta.url),'utf8');
 const scene=fs.readFileSync(new URL('../src/components/learning/sentence/LanternFestivalStage.tsx',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../src/components/learning/sentence/lantern-festival.css',import.meta.url),'utf8');
 assert.match(parent,/if\(m===6\)\{setLanternOpen\(true\);return;\}/);
 for(const fn of ['checkLanternColor','checkLanternPlace','checkLanternAnimal',
  'checkLanternRepair','checkLanternSentence','saveSentencePlazaMission'])assert.ok(ui.includes(fn));
 assert.match(scene,/<svg viewBox="0 0 1200 660"/);
 assert.match(scene,/lf-primary-lantern/);
 assert.match(scene,/lf-character/);
 assert.match(scene,/lf-hotspot/);
 assert.match(scene,/onPlace\?\.\(p\.id\)/);
 assert.match(css,/story_castle\.webp/);
 assert.match(css,/@media\(max-width:660px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(ui,/const played=soundService\.speakEnglish/);
 assert.match(ui,/onEnd:\(\)=>advance/);
 assert.match(ui,/const progress=await saveSentencePlazaMission/);
});
test('All 1–8 grades, missing grade, Pre-A1/A1/A2 placement and random replays have complete unique curricula',()=>{
 for(const grade of [null,1,2,3,4,5,6,7,8]){
  const per=lanternRoundsForGrade(grade);
  assert.equal(per,grade!=null&&grade<=2?3:grade!=null&&grade>=5?5:4);
  for(const level of ['Pre-A1','A1','A2']){
   const pool=lanternCurriculumPool(level,grade);
   for(const chapter of [1,2,3,4]){
    const unique=new Set(pool.filter(x=>x.chapter===chapter).map(x=>x.question.sentence));
    assert.ok(unique.size>=per,'Unique English tasks missing: '+grade+' '+level+' chapter '+chapter);
   }
   for(const seed of [1,7,22,99,1234]){
    const plan=planLanternFestival({grade,englishLevel:level,seed});
    assert.equal(plan.trials.length,per*4);
    assert.equal(plan.deck.mission,6);
    assert.equal(plan.deck.grade,grade);
    assert.equal(plan.deck.englishLevel,level);
    assert.deepEqual(plan.deck.questions.map(q=>q.id),plan.trials.map(t=>t.id));
    assert.equal(new Set(plan.trials.map(x=>x.id)).size,plan.trials.length);
    for(let chapter=1;chapter<=4;chapter++)assert.deepEqual(
     plan.trials.slice((chapter-1)*per,chapter*per).map(x=>x.chapter),Array(per).fill(chapter));
    assert.ok(plan.trials.every(x=>x.question.tokens.length<=lanternWordLimit(grade)));
    assert.ok(plan.trials.every(x=>x.question.englishLevel===level));
    for(let chapter=1;chapter<=4;chapter++)assert.equal(
     new Set(plan.trials.filter(x=>x.chapter===chapter).map(x=>x.question.sentence)).size,per);
   }
  }
 }
});
test('All scene semantics, animal actions, stage 3 grammar repairs and language levels are consistent',()=>{
 for(const level of ['Pre-A1','A1','A2'])for(const grade of [1,4,8])
  for(const t of lanternCurriculumPool(level,grade)){
   const q=t.question;
   assert.equal(q.id,t.id);assert.equal(q.mission,6);assert.equal(q.skill,'transfer');
   assert.equal(q.tokens.join(' '),q.sentence.replace(/[.,!?]/g,''));
   assert.ok(q.cue.length>20);
   assert.ok(q.cue.includes(LANTERN_COLORS.find(c=>c.id===t.color).tr));
   assert.ok(checkLanternColor(t,t.color));
   assert.ok(checkLanternPlace(t,t.place));
   assert.ok(checkLanternAnimal(t,t.animal));
   assert.ok(checkLanternSentence(t,q.tokens));
   assert.equal(checkLanternSentence(t,q.tokens.slice(1)),false);
   if(t.chapter===3){
    assert.equal(q.mode,'repair');
    assert.ok(t.errorIndex>=1);
    assert.ok(checkLanternRepair(t,t.errorIndex));
    assert.equal(t.brokenWords.length,q.tokens.length);
    assert.equal(t.brokenWords.filter((x,i)=>x!==q.tokens[i]).length,1);
    assert.equal(checkLanternRepair(t,0),false);
   }
   if(level==='Pre-A1'){
    assert.ok(!q.sentence.includes('because'));
    if(t.chapter>=3)assert.match(q.sentence,/ can /);
   }
   if(level==='A2'&&grade>2&&t.chapter>=3)assert.match(q.sentence,/because/);
   if(t.chapter===4)assert.match(q.sentence,/\bnear the\b/);
  }
 const early=planLanternFestival({grade:1,englishLevel:'A2',seed:91});
 const older=planLanternFestival({grade:8,englishLevel:'Pre-A1',seed:91});
 assert.equal(early.trials.length,12);assert.equal(older.trials.length,20);
 assert.ok(early.trials.every(x=>x.question.tokens.length<=10));
 assert.ok(older.trials.every(x=>!x.question.sentence.includes('because')));
});
test('Grade-specific answer identifiers never claim a new sentence was previously learned',()=>{
 for(const level of ['Pre-A1','A1','A2']){
  const early=lanternCurriculumPool(level,1),late=lanternCurriculumPool(level,8);
  const lookup=new Map(early.map(x=>[x.id,x.question.sentence]));
  for(const t of late)if(lookup.has(t.id))assert.equal(lookup.get(t.id),t.question.sentence);
  const x=planLanternFestival({grade:4,englishLevel:level,seed:102});
  const y=planLanternFestival({grade:4,englishLevel:level,seed:102});
  assert.deepEqual(x.trials.map(q=>q.id),y.trials.map(q=>q.id));
  const z=planLanternFestival({grade:4,englishLevel:level,seed:104});
  assert.notDeepEqual(x.trials.map(q=>q.id),z.trials.map(q=>q.id));
 }
});
test('Final mission 6 is sequential, profile-isolated, saved once and does not create extra stars on replay',async()=>{
 const repo=new MemoryProgressRepository();
 const child=await repo.createProfile({nickname:'Night explorer',avatarId:'avatar_explorer',gradeLevel:3,englishLevel:'A1'});
 const sibling=await repo.createProfile({nickname:'Sky explorer',avatarId:'avatar_explorer',gradeLevel:3,englishLevel:'A1'});
 const plan=planLanternFestival({grade:3,englishLevel:'A1',seed:43});
 await assert.rejects(saveSentencePlazaMission({repo,profileId:child.id,
  mission:6,plan:plan.deck,answers:evidence(plan),sessionId:'lantern-no-prereqs',durationSeconds:500}));
 for(let mission=1;mission<=5;mission++){
  const first=planPlazaMission({mission,grade:3,englishLevel:'A1',seed:100+mission});
  const answers=first.questions.map(q=>({
   questionId:q.id,skill:q.skill,placement:'A1',mistakes:0,hintUsed:false,modelHeard:false,
   firstTryCorrect:true,timestamp:new Date().toISOString()}));
  await saveSentencePlazaMission({repo,profileId:child.id,mission,plan:first,answers,
   sessionId:'prereq-'+mission,durationSeconds:80});
 }
 const payload={repo,profileId:child.id,mission:6,plan:plan.deck,
  answers:evidence(plan),sessionId:'lantern-final-2026',durationSeconds:806};
 const result=await saveSentencePlazaMission(payload);
 assert.equal(result.completedLevels,6);assert.equal(result.starsByLevel[6],3);
 const starsBefore=await repo.getTotalStars(child.id,SENTENCE_PLAZA_GAME_ID);
 await saveSentencePlazaMission(payload);
 assert.equal(await repo.getTotalStars(child.id,SENTENCE_PLAZA_GAME_ID),starsBefore);
 assert.equal((await getSentencePlazaProgress(repo,sibling.id)).completedLevels,0);
 assert.equal((await repo.getSentenceAnswerHistory(child.id))
  .filter(q=>q.questionId.startsWith('lantern:v1:')).length,plan.trials.length);
});
test('Resumable same-device final does not grant incomplete rewards or misclassify supported responses',()=>{
 const s=fs.readFileSync(new URL('../src/components/learning/sentence/LanternFestivalAdventure.tsx',import.meta.url),'utf8');
 assert.match(s,/window\.localStorage\.setItem\(KEY\+profileId/);
 assert.match(s,/window\.localStorage\.removeItem\(KEY\+profileId/);
 assert.match(s,/validCheckpoint\(value,profileId,gradeLevel,englishLevel\)/);
 assert.match(s,/p\.deck\?\.mission!==6/);
 assert.match(s,/c\.answers\.length===c\.index/);
 assert.match(s,/e\.firstTryCorrect===\(e\.mistakes===0&&!e\.hintUsed&&!e\.modelHeard\)/);
 assert.match(s,/firstTryCorrect:mistakes===0&&!hintUsed&&!modelHeard/);
 assert.match(s,/retryRows\.current/);
 assert.match(s,/onComplete\(rows\)/);
 assert.match(s,/onEnd:\(\)=>advance/);
});
