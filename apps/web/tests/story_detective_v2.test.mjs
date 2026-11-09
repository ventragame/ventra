import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 DETECTIVE_CASES,DETECTIVE_GAME_ID,validateDetectiveRecord,detectiveStars
 } from '../src/lib/learning/storyDetectiveEngine.ts';
import {
 DETECTIVE_STORY_SETUPS,DETECTIVE_THEME_NAMES,planDetectiveAdventure,
 sceneForDetectiveStep,detectiveAdventureNarration,
 detectiveAdventurePrompt,validateAdventureEvidence
} from '../src/lib/learning/storyDetectiveAdventureEngine.ts';
import {getDetectiveProgress,saveDetectiveCase}
 from '../src/lib/progress/storyDetectiveProgress.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';

const makeAnswers=(plan)=>plan.steps.map(step=>({
 stepId:step.id,selectedId:step.acceptedIds[0],mistakes:0,
 hintUsed:false,firstTryCorrect:true
}));
function makeRecord(p,steps=makeAnswers(p)){
 const clues=p.steps.filter(s=>s.kind==='clue').map(s=>{
  const a=steps.find(x=>x.stepId===s.id);
  return {clueId:s.target,mistakes:a.mistakes,
   hintUsed:a.hintUsed,firstTryCorrect:a.firstTryCorrect};
 });
 const dest=p.steps.find(s=>s.kind==='destination');
 const answer=steps.find(x=>x.stepId===dest.id);
 return {
  caseId:p.chosen.id,episode:p.chosen.chapter.episode,
  destination:p.chosen.destination,placement:p.englishLevel,
  clues,destinationMistakes:answer.mistakes,destinationHint:answer.hintUsed,
  storyId:p.storyId,stepEvidence:steps,
  completedAt:'2026-11-09T12:00:00.000Z'
 };
}
test('Six levels each cycle through 12 distinct story setups and destinations',()=>{
 assert.equal(Object.keys(DETECTIVE_STORY_SETUPS).length,6);
 const allIds=new Set();
 for(let episode=1;episode<=6;episode++){
  const plans=Array.from({length:12},(_,playCount)=>
   planDetectiveAdventure({episode,englishLevel:'Pre-A1',
    gradeLevel:2,seed:163+episode,playCount}));
  const signatures=new Set(plans.map(p=>p.storyId));
  assert.equal(signatures.size,12);
  assert.equal(new Set(plans.map(p=>p.chosen.id)).size,3);
  assert.equal(new Set(plans.map(p=>p.setup.hero)).size,4);
  assert.equal(new Set(plans.map(p=>p.setup.item)).size,4);
  assert.equal(new Set(plans.map(p=>p.setup.theme)).size,4);
  assert.ok(new Set(plans.map(p=>p.startScene)).size>=3);
  for(const plan of plans){
   assert.equal(plan.storyVersion,2);
   assert.ok(DETECTIVE_CASES.some(c=>c.id===plan.chosen.id));
   assert.ok(!allIds.has(plan.storyId));
   allIds.add(plan.storyId);
   assert.ok(plan.waypoints[0]!==plan.waypoints[1]);
   assert.ok(!plan.waypoints.includes(plan.startScene));
   assert.notEqual(plan.startScene,plan.chosen.destination);
   assert.ok(!plan.waypoints.includes(plan.chosen.destination));
  }
 }
 assert.equal(allIds.size,72);
 assert.equal(Object.keys(DETECTIVE_THEME_NAMES).length,4);
});
test('The child completes seven or eight DISTINCT interactions, not a 3-click quiz',()=>{
 for(const grade of [1,2,3,4,5,6,7,8,null]){
  for(let episode=1;episode<=6;episode++){
   const p=planDetectiveAdventure({episode,gradeLevel:grade,
    englishLevel:'A1',seed:episode*19,playCount:episode+3});
   assert.equal(p.steps.length,grade!==null&&grade>=5?8:7);
   assert.equal(p.steps.filter(s=>s.kind==='clue').length,grade!==null&&grade>=5?3:2);
   assert.deepEqual(p.steps.slice(0,5).map(s=>s.kind),[
    'friend','clue','crossroads','clue','memory'
   ]);
   assert.equal(p.steps.at(-2).kind,'destination');
   assert.equal(p.steps.at(-1).kind,'recover');
   assert.equal(p.steps.filter(s=>s.kind==='crossroads').length,1);
   assert.equal(new Set(p.steps.map(s=>s.id)).size,p.steps.length);
   for(const step of p.steps){
    assert.ok(step.choices.length>=2);
    assert.equal(new Set(step.choices).size,step.choices.length);
    for(const answer of step.acceptedIds)assert.ok(step.choices.includes(answer));
   }
  }
 }
});
test('Choose either route: midway scenery changes while authored clues stay consistent',()=>{
 const p=planDetectiveAdventure({episode:2,gradeLevel:5,
  englishLevel:'A1',seed:15,playCount:6});
 const route=p.steps.find(s=>s.kind==='crossroads');
 const investigating=p.steps.find(s=>s.kind==='memory');
 assert.equal(route.acceptedIds.length,2);
 const a=sceneForDetectiveStep(p,investigating,route.choices[0]);
 const b=sceneForDetectiveStep(p,investigating,route.choices[1]);
 assert.notEqual(a,b);
 assert.deepEqual([a,b].sort(),[...p.waypoints].sort());
 assert.equal(sceneForDetectiveStep(p,p.steps[0]),p.startScene);
 const rec1=makeAnswers(p);
 const rec2=rec1.map(x=>x.stepId===route.id?{...x,selectedId:route.choices[1]}:x);
 assert.ok(validateAdventureEvidence(rec1,p));
 assert.ok(validateAdventureEvidence(rec2,p));
 assert.ok(validateDetectiveRecord(makeRecord(p,rec1),p));
 assert.ok(validateDetectiveRecord(makeRecord(p,rec2),p));
});
test('Child-level narration is coherent, contextual and avoids spoiling the destination',()=>{
 for(let ep=1;ep<=6;ep++){
  for(let version=0;version<12;version++){
   for(const englishLevel of ['Pre-A1','A1','A2']){
    const p=planDetectiveAdventure({
     episode:ep,englishLevel,gradeLevel:4,seed:version*71+ep,
     playCount:version
    });
    const start=detectiveAdventureNarration(p,'opening');
    const end=detectiveAdventureNarration(p,'ending',p.waypoints[1]);
    assert.ok(start.length>30&&end.length>30);
    assert.ok(!start.includes('undefined')&&!end.includes('undefined'));
    assert.notEqual(start,end);
    assert.match(end,/[.!?]$/);
    for(const step of p.steps){
     const prompt=detectiveAdventurePrompt(p,step,p.waypoints[0]);
     assert.ok(prompt.length>15);
     assert.ok(!prompt.includes('undefined'));
     assert.match(prompt,/[.!?]$/);
     assert.ok(!prompt.includes('null'));
     if(step.kind==='destination'){
      const forbidden=['at the forest path','at the tree house','at the pond',
       'at the flower meadow','at the wooden bridge'];
      assert.ok(!forbidden.some(x=>prompt.toLowerCase().includes(x)),
       'Destination should be inferred, not read aloud');
     }
    }
   }
  }
 }
});
test('Evidence validation rejects skipped mini-games, wrong branches and forged scores',()=>{
 const p=planDetectiveAdventure({episode:3,gradeLevel:6,
  englishLevel:'A2',seed:133,playCount:8});
 const answers=makeAnswers(p),record=makeRecord(p,answers);
 assert.ok(validateAdventureEvidence(answers,p));
 assert.ok(validateDetectiveRecord(record,p));
 assert.equal(detectiveStars(record),3);
 assert.equal(detectiveStars(makeRecord(p,answers.map((x,i)=>i===0?{
  ...x,hintUsed:true,firstTryCorrect:false}:x))),2);
 assert.equal(detectiveStars(makeRecord(p,answers.map((x,i)=>i===0?{
  ...x,mistakes:5,firstTryCorrect:false}:x))),1);
 const omit=answers.slice(1);
 assert.equal(validateAdventureEvidence(omit,p),false);
 assert.equal(validateDetectiveRecord({...record,stepEvidence:omit},p),false);
 const swapped=answers.map((x,i)=>i===0?{
  ...x,selectedId:p.steps[0].choices.find(v=>v!==p.steps[0].target)
 }:x);
 assert.equal(validateAdventureEvidence(swapped,p),false);
 assert.equal(validateDetectiveRecord(makeRecord(p,swapped),p),false);
 assert.equal(validateDetectiveRecord({...record,storyId:'fake'},p),false);
 assert.equal(validateDetectiveRecord({...record,clues:[]},p),false);
 assert.equal(validateDetectiveRecord({...record,
  clues:record.clues.map((x,i)=>i===0?{...x,mistakes:1,firstTryCorrect:false}:x)},p),false);
 assert.equal(validateDetectiveRecord({...record,stepEvidence:answers.map((x,i)=>
  i===0?{...x,mistakes:-1}:x)},p),false);
});
test('Replay and child profiles do not double-charge stars or unlock different games',async()=>{
 const repo=MemoryProgressRepository.getInstance();
 await repo.clearAllProgress();
 const childA=await repo.createProfile({nickname:'V2 Detective A',avatarId:'avatar_explorer'});
 const childB=await repo.createProfile({nickname:'V2 Detective B',avatarId:'avatar_explorer'});
 const p=planDetectiveAdventure({episode:1,gradeLevel:1,
  englishLevel:'Pre-A1',seed:17,playCount:0});
 const input={
  repo,profileId:childA.id,episode:1,plan:p,record:makeRecord(p),
  sessionId:'detectiveV2:1',durationSeconds:146
 };
 await assert.rejects(()=>saveDetectiveCase({...input,episode:2}));
 await saveDetectiveCase(input);
 await saveDetectiveCase(input);
 let progress=await getDetectiveProgress(repo,childA.id);
 assert.equal(progress.completedLevels,1);
 assert.equal(progress.playCountByLevel[1],1);
 assert.equal((await getDetectiveProgress(repo,childB.id)).completedLevels,0);
 assert.equal((await repo.getLevelProgress(DETECTIVE_GAME_ID,1,childA.id))?.bestStars,3);
 const p2=planDetectiveAdventure({episode:1,gradeLevel:1,
  englishLevel:'Pre-A1',seed:19,playCount:1});
 assert.notEqual(p.storyId,p2.storyId);
 assert.notEqual(p.setup.hero,p2.setup.hero);
 await saveDetectiveCase({...input,plan:p2,record:makeRecord(p2,
  makeAnswers(p2).map((v,i)=>i===0?{...v,mistakes:6,firstTryCorrect:false}:v)),
  sessionId:'detectiveV2:2'});
 progress=await getDetectiveProgress(repo,childA.id);
 assert.equal(progress.playCountByLevel[1],2);
 assert.equal((await repo.getLevelProgress(DETECTIVE_GAME_ID,1,childA.id))?.bestStars,3);
 assert.equal(await repo.getTotalStars(childA.id,DETECTIVE_GAME_ID),3);
 assert.equal(await repo.getTotalStars(childB.id,DETECTIVE_GAME_ID),0);
 assert.equal((await repo.getLevelProgress('island_story_forest_sequence',1,childA.id))?.completedCount??0,0);
 assert.equal((await repo.getLevelProgress('island_story_forest_discover',1,childA.id))?.completedCount??0,0);
 await repo.clearAllProgress();
});
test('Mobile picture UI keeps independent scenery and speech/safety escape controls',()=>{
 const base=new URL('../src/components/learning/story/',import.meta.url);
 const ui=fs.readFileSync(new URL('StoryDetectiveAdventure.tsx',base),'utf8');
 const css=fs.readFileSync(new URL('story-detective-adventure.css',base),'utf8');
 assert.match(ui,/planDetectiveAdventure/);
 assert.match(ui,/getStartCount/);
 assert.match(ui,/localStorage/);
 assert.match(ui,/sceneForDetectiveStep/);
 assert.match(ui,/detectiveAdventurePrompt/);
 assert.match(ui,/soundService.speakEnglish/);
 assert.match(ui,/onEnd:/);
 assert.match(ui,/voiceUnavailable/);
 assert.match(ui,/prefers-reduced-motion|setCaption/);
 assert.match(ui,/tapClue/);
 assert.match(ui,/chooseDestination/);
 assert.match(ui,/StoryForestScenery/);
 assert.match(ui,/StoryForestActor/);
 assert.match(ui,/aria-label/);
 assert.match(css,/sd-story-options/);
 assert.match(css,/touch-action|sd-story-option/);
 assert.ok(css.includes('@media(max-width:760px)'));
 assert.ok(css.includes('@media(max-width:385px)'));
 assert.match(css,/prefers-reduced-motion/);
});
