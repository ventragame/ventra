import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 ACADEMY_GAME_ID,ACADEMY_CASES,ACADEMY_ZONES,buildAcademyPlan,nextAcademyVariant,
 academyShuffle,academyWords,matchesAcademyAnswer,academySkillReview,
 academySafeMission,academyHint,academyRoundOptions,academyReviewPriority,
 isAcademyTaskAnswerCorrect,buildAcademyFocusPlan,ACADEMY_REVIEW_GAME_ID
} from '../src/lib/learning/academyEngine.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {readAcademyCheckpoint,saveAcademyCheckpoint,clearAcademyCheckpoint} from '../src/lib/learning/academyCheckpoint.ts';

test('Six regions, 18 authored situations, three placements and 270 unique task IDs',()=>{
 assert.equal(ACADEMY_GAME_ID,'island_language_academy_atlas');
 assert.equal(ACADEMY_ZONES.length,6);
 assert.equal(ACADEMY_CASES.length,18);
 const ids=new Set();
 for(let zone=1;zone<=6;zone++){
  assert.equal(ACADEMY_CASES.filter(s=>s.zone===zone).length,3);
  for(const level of ['Pre-A1','A1','A2']){
   for(let variant=0;variant<3;variant++){
    const p=buildAcademyPlan(zone,level,variant);
    assert.equal(p.tasks.length,5);
    assert.deepEqual(p.tasks.map(t=>t.kind),['hear','read','talk','build','write']);
    for(const t of p.tasks){
     assert.ok(t.prompt.length>12);
     assert.ok(t.answer.length>2);
     assert.ok(!ids.has(t.id),t.id);
     ids.add(t.id);
     if(['hear','read','talk'].includes(t.kind)){
      assert.equal(t.options.length,3);
      assert.equal(new Set(t.options).size,3);
      assert.ok(t.options.includes(t.answer));
     }else assert.equal(t.options.length,0);
    }
   }
  }
 }
 assert.equal(ids.size,270);
});
test('Three differentiated placements are linguistic, not just changed option order',()=>{
 for(const s of ACADEMY_CASES){
  const a=buildAcademyPlan(s.zone,'Pre-A1',ACADEMY_CASES.filter(x=>x.zone===s.zone).indexOf(s));
  const b=buildAcademyPlan(s.zone,'A1',ACADEMY_CASES.filter(x=>x.zone===s.zone).indexOf(s));
  const c=buildAcademyPlan(s.zone,'A2',ACADEMY_CASES.filter(x=>x.zone===s.zone).indexOf(s));
  assert.notEqual(a.tasks[0].line,b.tasks[0].line);
  assert.notEqual(b.tasks[0].line,c.tasks[0].line);
  assert.notEqual(a.tasks[4].answer,c.tasks[4].answer);
 }
});
test('Consecutive rounds differ without random collision or profile cross-over',()=>{
 for(let z=1;z<=6;z++){
  for(const level of ['Pre-A1','A1','A2']){
   for(let k=0;k<15;k++){
    const a=buildAcademyPlan(z,level,nextAcademyVariant(k));
    const b=buildAcademyPlan(z,level,nextAcademyVariant(k+1));
    assert.notEqual(a.caseId,b.caseId);
    assert.equal(buildAcademyPlan(z,level,k).caseId,buildAcademyPlan(z,level,k).caseId);
   }
  }
 }
 assert.throws(()=>buildAcademyPlan(0,'A2',0),RangeError);
 assert.throws(()=>buildAcademyPlan(7,'A1',0),RangeError);
 assert.throws(()=>buildAcademyPlan(1,'A3',0),RangeError);
 assert.throws(()=>buildAcademyPlan(1,'A2',-1),RangeError);
});
test('Correctness, word duplicate identity and bounded deterministic shuffling',()=>{
 assert.ok(matchesAcademyAnswer('I found the red box!', 'i found the red box.'));
 assert.ok(!matchesAcademyAnswer('red bag','red box'));
 const words=academyWords('I see a red red box.');
 assert.equal(words.length,6);
 assert.equal(new Set(words.map(x=>x.key)).size,6);
 const a=academyShuffle(words,'seed-x');
 assert.deepEqual(a,academyShuffle(words,'seed-x'));
 assert.deepEqual(a.map(x=>x.key).sort((x,y)=>x-y),[0,1,2,3,4,5]);
});
test('Assisted speech/buttons never become independent speaking evidence',()=>{
 const now=Date.parse('2026-11-16T12:00:00Z');
 const base={taskId:'academy-1-a1-talk',caseId:'academy-1',placement:'A1',
  skill:'dialogue',firstTryCorrect:true,hintUsed:false,mistakes:0,
  independentlyCompleted:false,speechVerified:false,
  timestamp:'2026-11-16T09:00:00Z'};
 const report=academySkillReview([base],now);
 const talk=report.find(r=>r.skill==='dialogue');
 assert.equal(talk.independent,0);
 assert.equal(talk.due,true);
 assert.equal(talk.status,'review');
 const second={...base,independentlyCompleted:true,speechVerified:true,
   timestamp:'2026-11-16T11:00:00Z'};
 assert.equal(academySkillReview([base,second],now).find(r=>r.skill==='dialogue').independent,1);
});
test('Academy integrates with per-profile star and session-idempotent ledger',async()=>{
 const repo=new MemoryProgressRepository();
 const p=await repo.createProfile({nickname:'Explorer',avatarId:'avatar_explorer',englishLevel:'Pre-A1'});
 const p2=await repo.createProfile({nickname:'Other',avatarId:'avatar_explorer',englishLevel:'A2'});
 const rows=buildAcademyPlan(1,'Pre-A1',0).tasks.map(t=>({
  taskId:t.id,caseId:t.caseId,placement:'Pre-A1',skill:t.skill,
  firstTryCorrect:true,hintUsed:false,mistakes:0,
  independentlyCompleted:t.kind!=='talk',speechVerified:false,timestamp:new Date().toISOString()
 }));
 const payload={sessionId:'academy-unique-session',profileId:p.id,gameId:ACADEMY_GAME_ID,
  levelId:1,outcomeId:'academy-integrated-practice',success:true,score:80,starsEarned:3,
  metrics:{attemptsCount:5,accuracyRate:.8,durationSeconds:20,academyAnswers:rows},
  completedAt:new Date().toISOString()};
 const first=await repo.recordGameCompleted(payload,p.id);
 assert.equal(first.isDuplicate,false);
 const repeat=await repo.recordGameCompleted(payload,p.id);
 assert.equal(repeat.isDuplicate,true);
 assert.equal((await repo.getAllLevelProgress(ACADEMY_GAME_ID,p.id))[1].completedCount,1);
 assert.equal((await repo.getAcademyAnswerHistory(p.id)).length,5);
 assert.equal((await repo.getAcademyAnswerHistory(p2.id)).length,0);
 assert.equal((await repo.getAllLevelProgress(ACADEMY_GAME_ID,p2.id))[1].completedCount,0);
 assert.equal(await repo.getTotalStars(p.id,ACADEMY_GAME_ID),3);
});
test('New academy island has real game routing, responsive UI and privacy-only checkpoints',async()=>{
 const read=(p)=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
 const page=read('../src/app/kids/page.tsx');
 const ui=read('../src/components/learning/academy/AcademyAdventure.tsx');
 const checkpoint=read('../src/lib/learning/academyCheckpoint.ts');
 const css=read('../src/components/learning/academy/academy-adventure.css');
 const {ARCHIPELAGO_ISLANDS_CATALOG}=await import('../../../packages/shared/src/archipelago.ts');
 const world=ARCHIPELAGO_ISLANDS_CATALOG.language_academy;
 assert.equal(world.contentPublished,true);
 assert.equal(world.totalPublishedRequiredLevels,6);
 assert.match(page,/activeRegion==='language_academy'/);
 assert.match(page,/AcademyAdventure/);
 assert.match(ui,/academyAnswers:rows/);
 assert.match(ui,/recordGameCompleted/);
 assert.match(ui,/speechVerified:true/);
 assert.match(ui,/stopSpeechCapture/);
 assert.match(checkpoint,/sessionId/);
 assert.doesNotMatch(checkpoint,/typed|transcript|audioData|microphoneBlob/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/max-width:650px/);
});


test('L6 Premium: listening never gives away the target before hearing the English phrase',()=>{
 const ui=fs.readFileSync(new URL('../src/components/learning/academy/AcademyAdventure.tsx',import.meta.url),'utf8');
 assert.match(ui,/step===0\?academySafeMission\(zone\):plan\.mission/);
 assert.match(ui,/step===0\?currentZone\.name:plan\.caseTitle/);
 assert.match(ui,/task\.kind==='hear'&&!audioAttempted/);
 assert.match(ui,/audioPlayed/);
 for(const scene of ACADEMY_CASES){
  const safelyAuthored=academySafeMission(scene.zone).toLowerCase();
  assert.ok(!safelyAuthored.includes(scene.item.toLowerCase()),scene.title);
  assert.ok(!safelyAuthored.includes(scene.otherA.toLowerCase()),scene.title);
 }
});
test('L6 Premium: staged hints start without answer disclosure',()=>{
 for(const scene of ACADEMY_CASES)for(const level of ['Pre-A1','A1','A2']){
  const variant=ACADEMY_CASES.filter(c=>c.zone===scene.zone).indexOf(scene);
  const plan=buildAcademyPlan(scene.zone,level,variant);
  for(const task of plan.tasks){
   const first=academyHint(task,1);
   const second=academyHint(task,2);
   assert.ok(first.length>30);
   assert.ok(!first.includes(task.answer),'hint must not echo full answer: '+task.id);
   assert.ok(second.includes(task.answer),'second hint is explicitly supported model');
  }
 }
});
test('L6 Premium: targeted review has three unique situations, respects placement, never advances zone rewards',async()=>{
 const r1=buildAcademyFocusPlan(3,'Pre-A1','listening',0);
 const r2=buildAcademyFocusPlan(3,'A2','dialogue',1);
 assert.equal(r1.tasks.length,3);
 assert.equal(r2.tasks.length,3);
 assert.equal(new Set(r1.tasks.map(t=>t.caseId)).size,3);
 assert.equal(new Set(r2.tasks.map(t=>t.caseId)).size,3);
 assert.ok(r1.tasks.every(t=>t.skill==='listening'));
 assert.ok(r2.tasks.every(t=>t.skill==='dialogue'));
 assert.deepEqual(r1,buildAcademyFocusPlan(3,'Pre-A1','listening',0));
 assert.throws(()=>buildAcademyFocusPlan(0,'A2','listening',0),RangeError);
 assert.throws(()=>buildAcademyFocusPlan(1,'A2','nonsense',0),RangeError);
 const repo=new MemoryProgressRepository();
 const p=await repo.createProfile({nickname:'Review learner',avatarId:'avatar_explorer'});
 const payload={sessionId:'academy-review-one',profileId:p.id,gameId:ACADEMY_REVIEW_GAME_ID,
  levelId:3,outcomeId:'academy-review',success:true,score:67,starsEarned:0,
  metrics:{durationSeconds:31,attemptsCount:3,accuracyRate:2/3,academyAnswers:r1.tasks.map(t=>({
   taskId:t.id,caseId:t.caseId,placement:'Pre-A1',skill:t.skill,
   firstTryCorrect:true,hintUsed:false,mistakes:0,independentlyCompleted:true,
   speechVerified:false,timestamp:new Date().toISOString()
  }))},
  completedAt:new Date().toISOString()};
 await repo.recordGameCompleted(payload,p.id);
 assert.equal((await repo.getAcademyAnswerHistory(p.id)).length,3);
 assert.equal((await repo.getAllLevelProgress(ACADEMY_GAME_ID,p.id))[3].completedCount,0);
 assert.equal(await repo.getTotalStars(p.id,ACADEMY_GAME_ID),0);
 assert.equal((await repo.recordGameCompleted(payload,p.id)).isDuplicate,true);
});
test('L6 Premium: accepted English variants and placement-isolated review recommendations',()=>{
 const task=buildAcademyPlan(2,'A2',1).tasks[4];
 assert.equal(task.kind,'write');
 assert.ok(task.accepted.length>=2);
 for(const valid of [task.answer,...task.accepted])
  assert.ok(isAcademyTaskAnswerCorrect(task,valid));
 assert.ok(!isAcademyTaskAnswerCorrect(task,'Some unrelated sentence.'));
 const base={taskId:'academy-1-a1-talk',caseId:'academy-1',skill:'dialogue',
  firstTryCorrect:true,hintUsed:false,mistakes:0,independentlyCompleted:true,
  speechVerified:true,timestamp:'2026-11-16T09:00:00Z'};
 const now=Date.parse('2026-11-16T20:00:00Z');
 const diff={...base,placement:'Pre-A1',independentlyCompleted:false};
 const a1=academySkillReview([{...base,placement:'A1'},diff],now,'A1');
 const pre=academySkillReview([{...base,placement:'A1'},diff],now,'Pre-A1');
 assert.equal(a1.find(s=>s.skill==='dialogue').independent,1);
 assert.equal(pre.find(s=>s.skill==='dialogue').independent,0);
 assert.equal(academyReviewPriority([diff],'Pre-A1',now)?.skill,'dialogue');
});
test('L6 Premium: verified existing WebP art covers all six regions and mobile scene is responsive',()=>{
 for(const zone of ACADEMY_ZONES){
  for(const key of ['art','mobileArt']){
   assert.ok(zone[key].endsWith('.webp'));
   assert.ok(fs.statSync(new URL('../public'+zone[key],import.meta.url)).size>5000);
  }
 }
 const ui=fs.readFileSync(new URL('../src/components/learning/academy/AcademyAdventure.tsx',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../src/components/learning/academy/academy-adventure.css',import.meta.url),'utf8');
 assert.match(ui,/currentZone\.mobileArt/);
 assert.match(ui,/\['native-local','sherpa-local','web-local'\]/);
 assert.doesNotMatch(ui,/\['native-local','sherpa-local','web-local','web-browser'\]/);
 assert.match(ui,/CharacterGuide character="meadow-owl"/);
 assert.match(ui,/task\.caseId/);
 assert.match(ui,/setRecorded\(history=>\[\.\.\.history,\.\.\.rows\]\)/);
 assert.match(ui,/cancelAdvance/);
 assert.match(ui,/reviewSkill\?0:stars/);
 assert.match(css,/academy-scene-photo/);
 assert.match(css,/academy-scene-character/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});


test('L6 Premium: unfinished hint/error state survives refresh without persisting child text',()=>{
 const previousWindow=globalThis.window;
 const cache=new Map();
 const storage={getItem:k=>cache.get(k)??null,setItem:(k,v)=>cache.set(k,v),removeItem:k=>cache.delete(k)};
 globalThis.window={localStorage:storage};
 try{
  const p='review-checkpoint-profile',lev='Pre-A1',zone=2;
  const data={step:1,variant:0,answers:[{
    taskId:buildAcademyPlan(2,lev,0).tasks[0].id,
    caseId:buildAcademyPlan(2,lev,0).caseId,placement:lev,skill:'listening',
    firstTryCorrect:true,hintUsed:false,mistakes:0,independentlyCompleted:true,
    speechVerified:false,timestamp:new Date().toISOString()
  }],attempts:2,hints:1,sessionId:'uuid-preserved-1234',
  currentMistakes:2,currentHintLevel:1,audioAttempted:true,audioPlayed:true};
  saveAcademyCheckpoint(p,lev,zone,data);
  const restored=readAcademyCheckpoint(p,lev,zone);
  assert.equal(restored.currentMistakes,2);
  assert.equal(restored.currentHintLevel,1);
  assert.equal(restored.audioPlayed,true);
  assert.equal(restored.sessionId,data.sessionId);
  assert.ok(!JSON.stringify([...cache.values()]).includes('child-entered'));
  // Invalid inflated audio evidence is not accepted from stored checkpoints.
  saveAcademyCheckpoint(p,lev,zone,{...data,audioAttempted:false,audioPlayed:true});
  assert.equal(readAcademyCheckpoint(p,lev,zone),null);
  // Legacy v1 checkpoints without optional fields are still readable.
  saveAcademyCheckpoint(p,lev,zone,{
   step:data.step,variant:data.variant,answers:data.answers,attempts:data.attempts,
   hints:data.hints,sessionId:data.sessionId
  });
  assert.equal(readAcademyCheckpoint(p,lev,zone).step,1);
  clearAcademyCheckpoint(p,lev,zone);
  assert.equal(readAcademyCheckpoint(p,lev,zone),null);
 }finally{
  if(previousWindow===undefined)delete globalThis.window;
  else globalThis.window=previousWindow;
 }
});
