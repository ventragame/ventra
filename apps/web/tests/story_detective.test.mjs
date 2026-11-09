import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 DETECTIVE_CHAPTERS,DETECTIVE_CASES,DETECTIVE_CLUES,DETECTIVE_SCENE_CLUES,
 DETECTIVE_GAME_ID,planDetectiveCase,detectiveNarration,detectiveStars,
 validateDetectiveRecord,clueCountForGrade,evidenceChoiceCountForGrade
} from '../src/lib/learning/storyDetectiveEngine.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {
 getDetectiveProgress,saveDetectiveCase
} from '../src/lib/progress/storyDetectiveProgress.ts';
import {ARCHIPELAGO_ISLANDS_CATALOG} from '../../../packages/shared/src/archipelago.ts';

function makeRecord(p){
 return {
  caseId:p.chosen.id,episode:p.chosen.chapter.episode,
  destination:p.chosen.destination,placement:p.englishLevel,
  clues:p.requiredClues.map(clueId=>({
   clueId,mistakes:0,hintUsed:false,firstTryCorrect:true
  })),
  destinationMistakes:0,destinationHint:false,
  completedAt:'2026-11-09T07:20:00.000Z'
 };
}
test('Three original games are published, 18 chapters total, six detective worlds',()=>{
 assert.equal(DETECTIVE_GAME_ID,'island_story_forest_detective');
 assert.equal(DETECTIVE_CHAPTERS.length,6);
 assert.equal(DETECTIVE_CASES.length,18);
 assert.equal(new Set(DETECTIVE_CASES.map(c=>c.id)).size,18);
 assert.equal(new Set(DETECTIVE_CHAPTERS.map(c=>c.start)).size,6);
 assert.equal(ARCHIPELAGO_ISLANDS_CATALOG.listening_forest.totalPublishedRequiredLevels,18);
 const all=new Set(Object.keys(DETECTIVE_CLUES));
 for(const chapter of DETECTIVE_CHAPTERS){
  assert.equal(chapter.locations.length,3);
  assert.equal(new Set(chapter.locations).size,3);
  const cases=DETECTIVE_CASES.filter(c=>c.chapter.episode===chapter.episode);
  assert.equal(cases.length,3);
  for(const story of cases){
   assert.ok(chapter.locations.includes(story.destination));
   assert.deepEqual(story.clueIds,DETECTIVE_SCENE_CLUES[story.destination]);
   assert.equal(story.clueIds.length,3);
   assert.equal(new Set(story.clueIds).size,3);
   story.clueIds.forEach(id=>assert.ok(all.has(id)));
  }
 }
});
test('Replay rotates all 3 meaningful story endings per chapter, then cycles',()=>{
 for(let episode=1;episode<=6;episode++){
  const choices=Array.from({length:7},(_,playCount)=>
   planDetectiveCase({episode,gradeLevel:2,englishLevel:'Pre-A1',
    seed:98,playCount}));
  const destinations=choices.map(p=>p.chosen.destination);
  assert.equal(new Set(destinations.slice(0,3)).size,3);
  assert.deepEqual(destinations.slice(0,3),destinations.slice(3,6));
  assert.equal(destinations[0],destinations[6]);
  const repeat=planDetectiveCase({episode,gradeLevel:2,englishLevel:'Pre-A1',
   seed:98,playCount:0});
  assert.deepEqual(choices[0].clueChoices,repeat.clueChoices);
  assert.deepEqual(choices[0].locationChoices,repeat.locationChoices);
 }
});
test('Different grades change evidence load without changing spoken language placement',()=>{
 for(const grade of [1,2,3,4,5,6,7,8,null]){
  const count=clueCountForGrade(grade);
  assert.equal(count,grade!==null&&grade>=5?3:2);
  const options=evidenceChoiceCountForGrade(grade);
  for(const episode of [1,3,6]){
   for(const level of ['Pre-A1','A1','A2']){
    const p=planDetectiveCase({
     episode,gradeLevel:grade,englishLevel:level,
     seed:50+episode,playCount:1
    });
    assert.equal(p.requiredClues.length,count);
    assert.equal(p.clueChoices.length,options);
    assert.equal(new Set(p.clueChoices).size,options);
    assert.deepEqual([...p.locationChoices].sort(),
      [...p.chosen.chapter.locations].sort());
    assert.equal(new Set(p.locationChoices).size,3);
    for(const id of p.requiredClues)assert.ok(p.clueChoices.includes(id));
    for(const id of p.clueChoices.filter(x=>!p.requiredClues.includes(x))){
     assert.ok(!p.chosen.clueIds.includes(id),'Distractors must not also be true clues');
    }
   }
  }
 }
});
test('Narration describes actual hero and lost item; no location-answer leak',()=>{
 for(const c of DETECTIVE_CASES){
  for(const level of ['Pre-A1','A1','A2']){
   const plan=planDetectiveCase({episode:c.chapter.episode,englishLevel:level,
    gradeLevel:6,seed:31,playCount:c.chapter.locations.indexOf(c.destination)});
   for(const phase of ['intro','evidence','location','ending']){
    const narrated=detectiveNarration(plan,phase);
    assert.ok(narrated.length>19);
    assert.match(narrated,/[.!?]$/);
    assert.ok(!narrated.includes('undefined'));
   }
   const evidence=detectiveNarration(plan,'evidence');
   for(const id of plan.requiredClues)assert.ok(evidence.includes(DETECTIVE_CLUES[id].en));
   assert.ok(detectiveNarration(plan,'ending').length>detectiveNarration(plan,'location').length/2);
   assert.ok(!/tree house|forest path|pond|flower meadow|wooden bridge|campsite/i.test(
    detectiveNarration(plan,'location')),'Location must be inferred, not spoken');
  }
 }
 assert.throws(()=>planDetectiveCase({
  episode:7,gradeLevel:2,englishLevel:'A1',seed:1,playCount:0
 }));
 assert.throws(()=>planDetectiveCase({
  episode:1,gradeLevel:2,englishLevel:'B2',seed:1,playCount:0
 }));
 assert.throws(()=>planDetectiveCase({
  episode:1,gradeLevel:2,englishLevel:'A1',seed:1,playCount:-1
 }));
});
test('Evidence validation and star grading reject skipped or spoofed clues',()=>{
 const p=planDetectiveCase({episode:1,gradeLevel:5,englishLevel:'A1',
  seed:24,playCount:0});
 const data=makeRecord(p);
 assert.ok(validateDetectiveRecord(data,p));
 assert.equal(detectiveStars(data),3);
 const withHint={...data,clues:data.clues.map((a,i)=>i===0?
  {...a,hintUsed:true,firstTryCorrect:false}:a)};
 assert.equal(validateDetectiveRecord(withHint,p),true);
 assert.equal(detectiveStars(withHint),2);
 assert.equal(detectiveStars({...data,destinationMistakes:4}),1);
 assert.equal(validateDetectiveRecord({...data,caseId:'fake'},p),false);
 assert.equal(validateDetectiveRecord({...data,destination:'nowhere'},p),false);
 assert.equal(validateDetectiveRecord({...data,clues:data.clues.slice(1)},p),false);
 assert.equal(validateDetectiveRecord({...data,clues:data.clues.map(a=>({
  ...a,clueId:p.requiredClues[0]
 }))},p),false);
 assert.equal(validateDetectiveRecord({...data,clues:data.clues.map((a,i)=>i===0?
  {...a,mistakes:-1}:a)},p),false);
 assert.equal(validateDetectiveRecord({...data,clues:data.clues.map((a,i)=>i===0?
  {...a,firstTryCorrect:false}:a)},p),false);
});
test('Offline sessions isolate children, block chapter skips and avoid replay star inflation',async()=>{
 const repo=MemoryProgressRepository.getInstance();
 await repo.clearAllProgress();
 const alice=await repo.createProfile({nickname:'Detective A',avatarId:'avatar_explorer'});
 const bob=await repo.createProfile({nickname:'Detective B',avatarId:'avatar_explorer'});
 const p=planDetectiveCase({episode:1,gradeLevel:2,englishLevel:'Pre-A1',
  seed:20,playCount:0});
 const payload={repo,profileId:alice.id,episode:1,plan:p,record:makeRecord(p),
  sessionId:'detective:test:once',durationSeconds:41};
 await assert.rejects(()=>saveDetectiveCase({...payload,episode:2}));
 await assert.rejects(()=>saveDetectiveCase({...payload,record:{
  ...payload.record,clues:[]
 }}));
 await saveDetectiveCase(payload);
 await saveDetectiveCase(payload);
 let progress=await getDetectiveProgress(repo,alice.id);
 assert.equal(progress.completedLevels,1);
 assert.equal(progress.playCountByLevel[1],1);
 assert.equal((await getDetectiveProgress(repo,bob.id)).completedLevels,0);
 assert.equal((await repo.getLevelProgress(DETECTIVE_GAME_ID,1,alice.id))?.bestStars,3);
 assert.equal((await repo.getLevelProgress('island_story_forest_sequence',1,alice.id))?.completedCount??0,0);
 assert.equal((await repo.getLevelProgress('island_story_forest_discover',1,alice.id))?.completedCount??0,0);
 const p2=planDetectiveCase({episode:1,gradeLevel:2,englishLevel:'Pre-A1',
  seed:21,playCount:progress.playCountByLevel[1]});
 assert.notEqual(p.chosen.id,p2.chosen.id);
 await saveDetectiveCase({...payload,plan:p2,record:{
  ...makeRecord(p2),destinationMistakes:4
 },sessionId:'detective:test:replay'});
 progress=await getDetectiveProgress(repo,alice.id);
 assert.equal(progress.playCountByLevel[1],2);
 assert.equal((await repo.getLevelProgress(DETECTIVE_GAME_ID,1,alice.id))?.bestStars,3);
 assert.equal(await repo.getTotalStars(alice.id,DETECTIVE_GAME_ID),3);
 assert.equal(await repo.getTotalStars(bob.id,DETECTIVE_GAME_ID),0);
 await repo.clearAllProgress();
});
test('Visual art and mobile interactions remain accessible and scene-target aligned',()=>{
 const base=new URL('../src/components/learning/story/',import.meta.url);
 const ui=fs.readFileSync(new URL('StoryDetectiveAdventure.tsx',base),'utf8');
 const art=fs.readFileSync(new URL('StoryDetectiveArt.tsx',base),'utf8');
 const css=fs.readFileSync(new URL('story-detective.css',base),'utf8');
 const home=fs.readFileSync(new URL('StoryForestHome.tsx',base),'utf8');
 const page=fs.readFileSync(new URL('../src/app/kids/page.tsx',import.meta.url),'utf8');
 assert.match(ui,/detectiveNarration/);
 assert.match(ui,/getDetectiveProgress/);
 assert.match(ui,/saveDetectiveCase/);
 assert.match(ui,/onEnd:/);
 assert.match(ui,/voiceUnavailable/);
 assert.match(ui,/setCaption/);
 assert.match(ui,/tapClue/);
 assert.match(ui,/chooseDestination/);
 assert.match(ui,/locked.current/);
 assert.match(ui,/DetectiveClueArt/);
 assert.match(ui,/StoryForestActor/);
 assert.match(ui,/StoryForestScenery/);
 assert.match(css,/touch-action:manipulation/);
 assert.ok(css.includes('@media(max-width:760px)'));
 assert.ok(css.includes('@media(max-width:380px)'));
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(art,/StoryForestActor/);
 assert.match(art,/StoryForestScenery/);
 assert.match(home,/StoryDetectiveAdventure/);
 assert.match(home,/detective.completedLevels/);
 assert.match(page,/getDetectiveProgress/);
 assert.match(page,/forestCompletedLevels=\\{/);
});
