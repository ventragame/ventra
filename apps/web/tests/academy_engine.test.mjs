import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 ACADEMY_GAME_ID,ACADEMY_CASES,ACADEMY_ZONES,buildAcademyPlan,nextAcademyVariant,
 academyShuffle,academyWords,matchesAcademyAnswer,academySkillReview
} from '../src/lib/learning/academyEngine.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';

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
