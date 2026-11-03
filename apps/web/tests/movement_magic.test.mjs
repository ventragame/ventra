import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 MOVEMENT_CHAPTERS,MAGIC_VERBS,MAGIC_PLACES,movementQuestionsPerChapter,
 movementWordLimit,movementMagicPool,planMovementMagic,
 checkMagicAction,checkMagicPlace,checkMagicRepair,checkMagicSentence
} from '../src/lib/learning/movementMagicEngine.ts';
import {saveSentencePlazaMission,getSentencePlazaProgress}
 from '../src/lib/progress/sentencePlazaProgress.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {planPlazaMission} from '../src/lib/learning/sentencePlazaEngine.ts';

test('Movement Magic is a four-chapter real action game, not a generic sentence-only minigame',()=>{
 assert.equal(MOVEMENT_CHAPTERS.length,4);
 assert.deepEqual(MOVEMENT_CHAPTERS.map(c=>c.id),[1,2,3,4]);
 assert.deepEqual(MAGIC_VERBS.map(a=>a.id),['fly','jump','run','sleep']);
 assert.deepEqual(MAGIC_PLACES.map(p=>p.id),['tree','pond','bridge','tower']);
 const ui=fs.readFileSync(new URL('../src/components/learning/sentence/MovementMagicAdventure.tsx',import.meta.url),'utf8');
 const scene=fs.readFileSync(new URL('../src/components/learning/sentence/MovementMagicStage.tsx',import.meta.url),'utf8');
 const parent=fs.readFileSync(new URL('../src/components/learning/sentence/SentencePlazaAdventure.tsx',import.meta.url),'utf8');
 assert.match(parent,/if\(m===4\)\{setMovementOpen\(true\);return;\}/);
 assert.match(ui,/checkMagicAction/);assert.match(ui,/checkMagicPlace/);assert.match(ui,/checkMagicRepair/);
 assert.match(ui,/checkMagicSentence/);assert.match(ui,/saveSentencePlazaMission/);
 assert.match(ui,/setTimeout/);assert.match(ui,/setPhase\('chapter'\)/);
 assert.match(ui,/Süre cezası yok/);
 assert.match(scene,/<svg viewBox="0 0 1200 670"/);
 assert.match(scene,/mm-hotspot/);
 assert.match(scene,/mm-hero-bird|mm-hero-/);
 assert.match(scene,/onPlace\?\.\(id\)/);
 const css=fs.readFileSync(new URL('../src/components/learning/sentence/movement-magic.css',import.meta.url),'utf8');
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(max-width:665px\)/);
});
test('All grade × language combinations have 12–20 unique, grammatically gated tasks',()=>{
 const levels=['Pre-A1','A1','A2'];
 for(const grade of [null,1,2,3,4,5,6,7,8]){
  const per=movementQuestionsPerChapter(grade);
  assert.equal(per,grade!=null&&grade<=2?3:grade!=null&&grade>=5?5:4);
  for(const level of levels){
   const pool=movementMagicPool(level,grade);
   assert.ok(pool.length>=per*4);
   for(const chapter of [1,2,3,4]){
    const chapterPool=pool.filter(x=>x.chapter===chapter);
    assert.ok(new Set(chapterPool.map(x=>x.question.sentence)).size>=per,
     'chapter '+chapter+', '+level+', grade '+grade+' needs unique prompts');
   }
   for(const seed of [4,17,83,112,224]){
    const p=planMovementMagic({grade,englishLevel:level,seed});
    assert.equal(p.trials.length,per*4);
    assert.equal(p.deck.questions.length,per*4);
    assert.equal(p.deck.mission,4);
    assert.equal(p.deck.englishLevel,level);
    assert.equal(p.roundsPerChapter,per);
    assert.ok(p.trials.every(x=>x.question.englishLevel===level));
    assert.ok(p.trials.every(x=>x.question.tokens.length<=movementWordLimit(grade)));
    assert.equal(new Set(p.trials.map(x=>x.id)).size,p.trials.length);
    assert.deepEqual(p.trials.map(t=>t.question.id),p.deck.questions.map(q=>q.id));
    assert.deepEqual(p.trials.map(t=>t.chapter).slice(0,per),Array(per).fill(1));
    assert.deepEqual(p.trials.map(t=>t.chapter).slice(per,per*2),Array(per).fill(2));
    assert.deepEqual(p.trials.map(t=>t.chapter).slice(per*2,per*3),Array(per).fill(3));
    assert.deepEqual(p.trials.map(t=>t.chapter).slice(per*3,per*4),Array(per).fill(4));
   }
  }
 }
});
test('Each challenge represents a meaningful physical verb, landmark and a unique grammar repair',()=>{
 for(const level of ['Pre-A1','A1','A2']){
  const p=planMovementMagic({grade:5,englishLevel:level,seed:710});
  for(const t of p.trials){
   const q=t.question;
   assert.ok(q.id.startsWith('movement:v3:'));
   assert.match(q.sentence,/[.?]$/);
   assert.equal(q.mission,4);assert.equal(q.skill,'action');
   assert.ok(q.scene.actor===t.actor);
   assert.ok(checkMagicAction(t,t.verb));
   assert.ok(checkMagicPlace(t,t.place));
   assert.ok(checkMagicSentence(t,q.tokens));
   assert.equal(checkMagicSentence(t,q.tokens.slice(1)),false);
   assert.ok(MAGIC_VERBS.filter(a=>a.id!==t.verb).every(a=>!checkMagicAction(t,a.id)));
   assert.ok(MAGIC_PLACES.filter(p=>p.id!==t.place).every(p=>!checkMagicPlace(t,p.id)));
   if(t.chapter===3){
    assert.equal(t.challenge,'repair');
    assert.ok(Number.isInteger(t.errorIndex)&&t.errorIndex>=1);
    assert.ok(checkMagicRepair(t,t.errorIndex));
    const broken=t.brokenWords;
    assert.equal(broken.length,q.tokens.length);
    assert.equal(broken.filter((word,i)=>word!==q.tokens[i]).length,1);
    assert.equal(checkMagicRepair(t,0),false);
   }
  }
 }
});
test('Older Pre-A1 still gets beginner English; early A2 still has age-size limits',()=>{
 const older=planMovementMagic({grade:8,englishLevel:'Pre-A1',seed:11});
 const younger=planMovementMagic({grade:1,englishLevel:'A2',seed:11});
 assert.equal(older.trials.length,20);
 assert.ok(older.trials.every(t=>!t.question.sentence.includes('because')));
 assert.equal(younger.trials.length,12);
 assert.ok(younger.trials.every(t=>t.question.tokens.length<=10));
 assert.ok(older.trials.every(t=>t.question.englishLevel==='Pre-A1'));
 assert.ok(younger.trials.every(t=>t.question.englishLevel==='A2'));
});
test('Movement save continues existing plaza level 4 and does not increase replay stars',async()=>{
 const repo=new MemoryProgressRepository();
 const profile=await repo.createProfile({nickname:'Magic learner',avatarId:'avatar_explorer',gradeLevel:3,englishLevel:'A1'});
 for(let mission=1;mission<=3;mission++){
  const deck=planPlazaMission({mission,grade:3,englishLevel:'A1',seed:100+mission});
  const answers=deck.questions.map(q=>({questionId:q.id,skill:q.skill,placement:deck.englishLevel,
   mistakes:0,hintUsed:false,modelHeard:false,firstTryCorrect:true,timestamp:new Date().toISOString()}));
  await saveSentencePlazaMission({repo,profileId:profile.id,mission,plan:deck,answers,
   sessionId:'magic-prereq-'+mission,durationSeconds:42});
 }
 const magic=planMovementMagic({grade:3,englishLevel:'A1',seed:902});
 const answers=magic.trials.map(q=>({
  questionId:q.id,skill:'action',placement:'A1',sentenceKind:q.question.kind,
  challengeMode:q.question.mode,mistakes:0,hintUsed:false,modelHeard:false,
  firstTryCorrect:true,timestamp:new Date().toISOString()
 }));
 await saveSentencePlazaMission({repo,profileId:profile.id,mission:4,plan:magic.deck,answers,
  sessionId:'movement-new-level-4',durationSeconds:483});
 const progress=await getSentencePlazaProgress(repo,profile.id);
 assert.equal(progress.completedLevels,4);
 assert.equal(progress.starsByLevel[4],3);
 const before=await repo.getTotalStars(profile.id,'island_sentence_square_plaza');
 await saveSentencePlazaMission({repo,profileId:profile.id,mission:4,plan:magic.deck,answers,
  sessionId:'movement-new-level-4',durationSeconds:483});
 assert.equal(await repo.getTotalStars(profile.id,'island_sentence_square_plaza'),before);
 const history=await repo.getSentenceAnswerHistory(profile.id);
 assert.ok(history.some(item=>item.questionId.startsWith('movement:v3:')));
});

test('Changing a child grade never silently reuses an evidence ID for a different sentence',()=>{
 const early=movementMagicPool('A2',1);
 const older=movementMagicPool('A2',7);
 const e=new Map(early.map(t=>[t.id,t.question.sentence]));
 const l=new Map(older.map(t=>[t.id,t.question.sentence]));
 assert.ok(early.length>0&&older.length>0);
 for(const [id,sentence] of e)if(l.has(id))assert.equal(l.get(id),sentence);
 assert.equal([...e.keys()].filter(id=>id.includes(':early:')).length,e.size);
});

test('A paused 12–20 question adventure can resume safely without granting incomplete stars',()=>{
 const ui=fs.readFileSync(new URL('../src/components/learning/sentence/MovementMagicAdventure.tsx',import.meta.url),'utf8');
 assert.match(ui,/MOVEMENT_CHECKPOINT_PREFIX/);
 assert.match(ui,/validCheckpoint\(saved,profileId,gradeLevel,englishLevel\)/);
 assert.match(ui,/window\.localStorage\.setItem\(MOVEMENT_CHECKPOINT_PREFIX/);
 assert.match(ui,/window\.localStorage\.removeItem\(MOVEMENT_CHECKPOINT_PREFIX/);
 assert.match(ui,/p\.deck\.mission!==4/);
 assert.match(ui,/row\.firstTryCorrect===\(row\.mistakes===0&&!row\.hintUsed&&!row\.modelHeard\)/);
 assert.match(ui,/awaitingFinalSave/);
 assert.match(ui,/resume|resumed/);
 assert.match(ui,/saveSentencePlazaMission\(/);
});
