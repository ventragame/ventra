import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 WISH_CHAPTERS,WISH_FOODS,WISH_GUESTS,wishRoundsForGrade,wishWordsForGrade,
 wishFestivalPool,planWishFestival,checkWishFood,checkWishSecond,
 checkWishIntent,checkWishSentence,wishIntentOptions
} from '../src/lib/learning/wishFestivalEngine.ts';
import {saveSentencePlazaMission,getSentencePlazaProgress}
 from '../src/lib/progress/sentencePlazaProgress.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {planPlazaMission,SENTENCE_PLAZA_GAME_ID} from '../src/lib/learning/sentencePlazaEngine.ts';

const answer=(plan)=>plan.deck.questions.map(q=>({
 questionId:q.id,skill:'preference',placement:plan.englishLevel,
 sentenceKind:q.kind,challengeMode:q.mode,mistakes:0,hintUsed:false,modelHeard:false,
 firstTryCorrect:true,timestamp:'2026-11-03T15:00:00.000Z'
}));
test('Festival has four distinct language worlds and original illustrated market art',()=>{
 assert.deepEqual(WISH_CHAPTERS.map(c=>c.id),[1,2,3,4]);
 assert.equal(WISH_FOODS.length,8);assert.equal(WISH_GUESTS.length,4);
 assert.equal(new Set(WISH_FOODS.map(f=>f.id)).size,8);
 const parent=fs.readFileSync(new URL('../src/components/learning/sentence/SentencePlazaAdventure.tsx',import.meta.url),'utf8');
 const ui=fs.readFileSync(new URL('../src/components/learning/sentence/WishFestivalAdventure.tsx',import.meta.url),'utf8');
 const scene=fs.readFileSync(new URL('../src/components/learning/sentence/WishFestivalStage.tsx',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../src/components/learning/sentence/wish-festival.css',import.meta.url),'utf8');
 assert.match(parent,/if\(m===5\)\{setWishOpen\(true\);return;\}/);
 for(const method of ['checkWishFood','checkWishSecond','checkWishIntent','checkWishSentence',
  'saveSentencePlazaMission'])assert.ok(ui.includes(method));
 assert.match(ui,/setTimeout/);assert.match(ui,/setScreen\('lesson'\)/);
 assert.match(ui,/Süre sınırı yok/);
 assert.match(scene,/<svg viewBox="0 0 1200 660"/);
 assert.match(scene,/WishFruitArtwork/);assert.match(scene,/GuestPortrait/);
 assert.match(scene,/onFood\?\.\(item\.id\)/);assert.match(scene,/aria-pressed/);
 assert.match(css,/story_castle\.webp/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(max-width:700px\)/);
});
test('Grade and English placement are independent: 12–20 unique tasks and cognitive limits',()=>{
 for(const grade of [null,1,2,3,4,5,6,7,8])for(const level of ['Pre-A1','A1','A2']){
  const count=wishRoundsForGrade(grade);
  assert.equal(count,grade!==null&&grade<=2?3:grade!==null&&grade>=5?5:4);
  const pool=wishFestivalPool(level,grade);
  for(const ch of [1,2,3,4]){
   const unique=new Set(pool.filter(q=>q.chapter===ch).map(q=>q.sentence));
   assert.ok(unique.size>=count,'Missing variety grade '+grade+' '+level+' chapter '+ch);
  }
  for(const seed of [7,29,65,108,403]){
   const plan=planWishFestival({grade,englishLevel:level,seed});
   assert.equal(plan.roundsPerChapter,count);
   assert.equal(plan.trials.length,4*count);
   assert.equal(plan.deck.questions.length,plan.trials.length);
   assert.equal(plan.deck.mission,5);
   assert.equal(plan.deck.grade,grade);
   assert.equal(plan.deck.englishLevel,level);
   assert.equal(new Set(plan.trials.map(t=>t.id)).size,plan.trials.length);
   assert.ok(plan.trials.every(t=>t.question.tokens.length<=wishWordsForGrade(grade)));
   assert.ok(plan.trials.every(t=>t.question.englishLevel===level));
   for(let ch=1;ch<=4;ch++)
    assert.deepEqual(plan.trials.slice((ch-1)*count,ch*count).map(t=>t.chapter),Array(count).fill(ch));
  }
 }
 const young=planWishFestival({grade:1,englishLevel:'A2',seed:44});
 const older=planWishFestival({grade:8,englishLevel:'Pre-A1',seed:44});
 assert.equal(young.trials.length,12);assert.equal(older.trials.length,20);
 assert.ok(young.trials.every(t=>t.question.tokens.length<=10));
 assert.ok(older.trials.every(t=>!t.sentence.includes('because')&&!t.sentence.includes('Could')));
});
test('All sentences match the fruit, communicative intent, grammar and scene semantics',()=>{
 for(const level of ['Pre-A1','A1','A2'])for(const grade of [1,4,8])
  for(const t of wishFestivalPool(level,grade)){
   const q=t.question;
   assert.equal(q.id,t.id);assert.equal(q.skill,'preference');assert.equal(q.mission,5);
   assert.match(q.sentence,/[.?]$/);assert.ok(q.id.startsWith('wish:v1:'));
   assert.ok(q.cue.includes(WISH_FOODS.find(f=>f.id===t.food).tr));
   assert.ok(q.vocabulary.some(v=>v.en===t.food));
   assert.ok(checkWishFood(t,t.food));assert.ok(checkWishSecond(t,t.second));
   assert.ok(checkWishIntent(t,t.intent));assert.ok(checkWishSentence(t,q.tokens));
   assert.equal(checkWishSentence(t,q.tokens.slice(1)),false);
   assert.equal(q.tokens.join(' '),q.sentence.replace(/[.,!?]/g,''));
   if(t.chapter===1)assert.match(q.sentence,/\blike\b/);
   if(t.chapter===2)assert.match(q.sentence,/please[.?]$/);
   if(t.chapter===3)assert.ok(['like','want','dislike','polite'].includes(t.intent));
   if(t.chapter===4){
    assert.match(q.sentence,level==='Pre-A1'?/ and /:level==='A1'?/ but /:/because/);
   }
  }
 assert.deepEqual(wishIntentOptions('Pre-A1').map(x=>x.id),['like','want','dislike']);
});
test('Deterministic replay is reproducible; new seed changes meaningful scene prompts',()=>{
 for(const level of ['Pre-A1','A1','A2']){
  const early=wishFestivalPool(level,1),older=wishFestivalPool(level,7);
  const seen=new Map(early.map(t=>[t.id,t.sentence]));
  for(const trial of older)if(seen.has(trial.id))assert.equal(seen.get(trial.id),trial.sentence);
  const one=planWishFestival({grade:4,englishLevel:level,seed:1});
  const same=planWishFestival({grade:4,englishLevel:level,seed:1});
  assert.deepEqual(one.trials.map(t=>t.id),same.trials.map(t=>t.id));
  const another=planWishFestival({grade:4,englishLevel:level,seed:2});
  assert.notDeepEqual(one.trials.map(t=>t.id),another.trials.map(t=>t.id));
 }
});
test('Real profile save is sequential, isolated, idempotent and opens mission 6',async()=>{
 const repo=new MemoryProgressRepository();
 const first=await repo.createProfile({nickname:'Mina',avatarId:'avatar_explorer',gradeLevel:4,englishLevel:'A1'});
 const sibling=await repo.createProfile({nickname:'Nora',avatarId:'avatar_explorer',gradeLevel:4,englishLevel:'A1'});
 const wish=planWishFestival({grade:4,englishLevel:'A1',seed:84});
 await assert.rejects(saveSentencePlazaMission({repo,profileId:first.id,mission:5,plan:wish.deck,
  answers:answer(wish),sessionId:'wish-skip',durationSeconds:640}));
 for(let mission=1;mission<=4;mission++){
  const plan=planPlazaMission({mission,grade:4,englishLevel:'A1',seed:75+mission});
  const evidence=plan.questions.map(q=>({questionId:q.id,skill:q.skill,placement:plan.englishLevel,
   mistakes:0,hintUsed:false,modelHeard:false,firstTryCorrect:true,timestamp:new Date().toISOString()}));
  await saveSentencePlazaMission({repo,profileId:first.id,mission,plan,answers:evidence,
   sessionId:'prereq-'+mission,durationSeconds:60});
 }
 const record={repo,profileId:first.id,mission:5,plan:wish.deck,answers:answer(wish),
  sessionId:'wish-actual-finish',durationSeconds:740};
 const progress=await saveSentencePlazaMission(record);
 assert.equal(progress.completedLevels,5);assert.equal(progress.starsByLevel[5],3);
 const before=await repo.getTotalStars(first.id,SENTENCE_PLAZA_GAME_ID);
 await saveSentencePlazaMission(record);
 assert.equal(await repo.getTotalStars(first.id,SENTENCE_PLAZA_GAME_ID),before);
 assert.equal((await getSentencePlazaProgress(repo,sibling.id)).completedLevels,0);
 assert.equal((await repo.getSentenceAnswerHistory(first.id))
  .filter(q=>q.questionId.startsWith('wish:')).length,wish.trials.length);
 const next=planPlazaMission({mission:6,grade:4,englishLevel:'A1',seed:98});
 const six=next.questions.map(q=>({questionId:q.id,skill:q.skill,placement:next.englishLevel,
  mistakes:0,hintUsed:false,modelHeard:false,firstTryCorrect:true,timestamp:new Date().toISOString()}));
 const after=await saveSentencePlazaMission({repo,profileId:first.id,mission:6,plan:next,answers:six,
  sessionId:'after-wish-festival',durationSeconds:87});
 assert.equal(after.completedLevels,6);
});
test('Same-device checkpoint cannot credit incomplete play and captures assisted evidence',()=>{
 const src=fs.readFileSync(new URL('../src/components/learning/sentence/WishFestivalAdventure.tsx',import.meta.url),'utf8');
 assert.match(src,/STORAGE_PREFIX/);
 assert.match(src,/window\.localStorage\.setItem\(STORAGE_PREFIX/);
 assert.match(src,/window\.localStorage\.removeItem\(STORAGE_PREFIX/);
 assert.match(src,/recoverable\(object,profileId,gradeLevel,englishLevel\)/);
 assert.match(src,/p\.deck\?\.mission!==5/);
 assert.match(src,/v\.answers\.length===v\.index/);
 assert.match(src,/row\.firstTryCorrect===\(row\.mistakes===0&&!row\.hintUsed&&!row\.modelHeard\)/);
 assert.match(src,/hintUsed,modelHeard/);
 assert.match(src,/firstTryCorrect:mistakes===0&&!hintUsed&&!modelHeard/);
 assert.match(src,/sessionId:session\.current/);
 assert.match(src,/retryRows\.current/);
 assert.match(src,/onComplete\(rows\)/);
 assert.match(src,/onEnd:\(\)=>scheduleNext/);
 assert.match(src,/const fallback=Math\.max\(3500/);
});

test('Polite dialogue distinguishes would like from ordinary want, at A1 and A2',()=>{
 for(const level of ['A1','A2']){
  const pool=wishFestivalPool(level,4).filter(t=>t.chapter===3);
  const polite=pool.filter(t=>t.sentence.includes('would like'));
  assert.ok(polite.length>=5);
  assert.ok(polite.every(t=>t.intent==='polite'));
  assert.ok(polite.every(t=>t.question.kind==='request'));
  assert.ok(polite.every(t=>t.question.cue.includes('iste')||t.question.cue.includes('rica')));
 }
 const src=fs.readFileSync(new URL('../src/components/learning/sentence/WishFestivalAdventure.tsx',import.meta.url),'utf8');
 assert.match(src,/trial\.intent==='want'\|\|trial\.intent==='polite'/);
});
