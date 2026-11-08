
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 SEQUENCE_STORIES,SEQUENCE_GAME_ID,sequenceLengthForGrade,
 planSequenceStory,shuffleSequence,validateSequenceAnswers,sequenceStars
} from '../src/lib/learning/storySequenceEngine.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {getSequenceProgress,saveSequenceStory} from '../src/lib/progress/storySequenceProgress.ts';
import {ARCHIPELAGO_ISLANDS_CATALOG} from '../../../packages/shared/src/archipelago.ts';

const answer=(deck)=>deck.frames.map((frame,slot)=>({
 frameId:frame.id,slot,mistakes:0,hintUsed:false,firstTryCorrect:true,
 placement:deck.englishLevel,timestamp:'2026-11-08T17:00:00.000Z'
}));

test('Game 2 has six causal visual stories with thirty distinct original storyboard frames',()=>{
 assert.equal(SEQUENCE_STORIES.length,6);
 assert.equal(new Set(SEQUENCE_STORIES.map(s=>s.scene)).size,6);
 const names=new Set(),ids=new Set();
 for(const story of SEQUENCE_STORIES){
  assert.ok(!names.has(story.title));names.add(story.title);
  assert.equal(story.frames.length,5);
  const visualKeys=new Set();
  for(const [index,frame] of story.frames.entries()){
   assert.equal(frame.order,index);
   assert.ok(!ids.has(frame.id));ids.add(frame.id);
   assert.equal(typeof frame.actor,'string');
   assert.ok(['left','center','right'].includes(frame.placement));
   assert.ok(frame.action.length>=4);
   const visualKey=[frame.actor,frame.companion,frame.prop,frame.action,frame.placement].join(':');
   assert.ok(!visualKeys.has(visualKey),'No indistinguishable visual story frames: '+frame.id);
   visualKeys.add(visualKey);
   for(const level of ['Pre-A1','A1','A2']){
    assert.ok(frame.narration[level].trim().length>=10,'Pre-A1 commands may be deliberately short');
    assert.match(frame.narration[level],/[.!?]$/);
   }
   assert.ok(frame.narration['Pre-A1'].split(/\s+/).length<=10,'Short beginner listening phrases');
   assert.ok(frame.narration.A2.split(/\s+/).length>=frame.narration['Pre-A1'].split(/\s+/).length);
  }
 }
 assert.equal(ids.size,30);
 assert.equal(ARCHIPELAGO_ISLANDS_CATALOG.listening_forest.totalPublishedRequiredLevels,12);
});
test('Sequence is first/middle/ending, grade controls card count, language does not override it',()=>{
 assert.equal(sequenceLengthForGrade(1),3);
 assert.equal(sequenceLengthForGrade(3),4);
 assert.equal(sequenceLengthForGrade(8),5);
 assert.equal(sequenceLengthForGrade(null),4);
 for(const grade of [1,2,3,4,5,6,7,8,null]){
  for(const level of ['Pre-A1','A1','A2']){
   for(let episode=1;episode<=6;episode++){
    const plan=planSequenceStory({episode,gradeLevel:grade,englishLevel:level,seed:439});
    const full=SEQUENCE_STORIES[episode-1];
    assert.equal(plan.frames.length,sequenceLengthForGrade(grade));
    assert.equal(plan.frames[0].id,full.frames[0].id);
    assert.equal(plan.frames.at(-1).id,full.frames[4].id);
    assert.ok(plan.frames.every((f,i)=>i===0||f.order>plan.frames[i-1].order));
    assert.notDeepEqual(plan.shuffledIds,plan.frames.map(f=>f.id));
    assert.deepEqual([...plan.shuffledIds].sort(),plan.frames.map(f=>f.id).sort());
    assert.ok(validateSequenceAnswers(answer(plan),plan));
    const rerun=planSequenceStory({episode,gradeLevel:grade,englishLevel:level,seed:439});
    assert.deepEqual(rerun.shuffledIds,plan.shuffledIds);
   }
  }
 }
 assert.throws(()=>planSequenceStory({episode:7,gradeLevel:1,englishLevel:'A1',seed:0}));
 assert.equal(new Set(Array.from({length:25},(_,seed)=>
  planSequenceStory({episode:1,gradeLevel:7,englishLevel:'A2',seed}).shuffledIds.join(','))).size>1,true);
});
test('Sequence evidence is strict, assistance never counts as independent skill',()=>{
 const deck=planSequenceStory({episode:3,gradeLevel:5,englishLevel:'A1',seed:20});
 const rows=answer(deck);
 assert.equal(sequenceStars(rows),3);
 assert.equal(validateSequenceAnswers(rows.slice(1),deck),false);
 assert.equal(validateSequenceAnswers(rows.map(x=>({...x,frameId:rows[0].frameId})),deck),false);
 assert.equal(validateSequenceAnswers(rows.map((x,i)=>({...x,slot:i+1})),deck),false);
 assert.equal(validateSequenceAnswers(rows.map((x,i)=>i===0?{...x,firstTryCorrect:false}:x),deck),false);
 assert.equal(validateSequenceAnswers(rows.map((x,i)=>i===0?{...x,placement:'A2'}:x),deck),false);
 const assisted=rows.map((r,i)=>i===0?{...r,hintUsed:true,firstTryCorrect:false}:r);
 assert.equal(validateSequenceAnswers(assisted,deck),true);
 assert.equal(sequenceStars(assisted),2);
 const errors=rows.map((r,i)=>i===0?{...r,mistakes:3,firstTryCorrect:false}:r);
 assert.equal(validateSequenceAnswers(errors,deck),true);
 assert.equal(sequenceStars(errors),1);
});
test('Real offline records: save complete story, block skips, isolate siblings, idempotent awards',async()=>{
 const repo=MemoryProgressRepository.getInstance();
 await repo.clearAllProgress();
 const a=await repo.createProfile({nickname:'Sequencer A',avatarId:'avatar_explorer'});
 const b=await repo.createProfile({nickname:'Sequencer B',avatarId:'avatar_explorer'});
 const p1=planSequenceStory({episode:1,gradeLevel:1,englishLevel:'Pre-A1',seed:25});
 const p2=planSequenceStory({episode:2,gradeLevel:1,englishLevel:'Pre-A1',seed:26});
 await assert.rejects(()=>saveSequenceStory({repo,profileId:a.id,episode:2,
  deck:p2,answers:answer(p2),sessionId:'seq:skip',durationSeconds:30}));
 await assert.rejects(()=>saveSequenceStory({repo,profileId:a.id,episode:1,
  deck:p1,answers:answer(p1).slice(1),sessionId:'seq:partial',durationSeconds:9}));
 const input={repo,profileId:a.id,episode:1,deck:p1,answers:answer(p1),
  sessionId:'seq:unique:first',durationSeconds:34};
 await saveSequenceStory(input);
 await saveSequenceStory(input);
 assert.equal((await getSequenceProgress(repo,a.id)).completedLevels,1);
 assert.equal((await getSequenceProgress(repo,b.id)).completedLevels,0);
 assert.equal((await repo.getSequenceAnswerHistory(a.id)).length,p1.frames.length);
 assert.equal((await repo.getSequenceAnswerHistory(b.id)).length,0);
 assert.equal((await repo.getLevelProgress(SEQUENCE_GAME_ID,1,a.id))?.completedCount,1);
 assert.equal(await repo.getTotalStars(a.id,SEQUENCE_GAME_ID),3);
 await saveSequenceStory({...input,sessionId:'seq:unique:replay',
  answers:answer(p1).map((r,i)=>i===0?{...r,mistakes:4,firstTryCorrect:false}:r)});
 assert.equal((await repo.getLevelProgress(SEQUENCE_GAME_ID,1,a.id))?.bestStars,3);
 assert.equal(await repo.getTotalStars(a.id,SEQUENCE_GAME_ID),3);
 const firstGame=await repo.getAllLevelProgress('island_story_forest_discover',a.id);
 assert.ok(Object.values(firstGame).every(row=>row.completedCount===0&&row.bestStars===0),'Two games do not overwrite one another');
 await repo.clearAllProgress();
});
test('Picture-first UX has native readable fallback, no manual next button in order mode',()=>{
 const root=new URL('../src/components/learning/story/',import.meta.url);
 const ui=fs.readFileSync(new URL('StorySequenceAdventure.tsx',root),'utf8');
 const art=fs.readFileSync(new URL('StorySequenceFrame.tsx',root),'utf8');
 const css=fs.readFileSync(new URL('story-sequence.css',root),'utf8');
 const home=fs.readFileSync(new URL('StoryForestHome.tsx',root),'utf8');
 const page=fs.readFileSync(new URL('../src/app/kids/page.tsx',import.meta.url),'utf8');
 assert.match(ui,/watchIndex===deck\.frames\.length-1/);
 assert.match(ui,/setPage\('order'\)/);
 assert.match(ui,/soundService\.speakEnglish/);
 assert.match(ui,/setShowCaption\(true\)/);
 assert.match(ui,/setSelectedIds\(ordered\)/);
 assert.match(ui,/saveSequenceStory/);
 assert.match(ui,/firstTryCorrect:mistakes===0&&!hintUsed/);
 assert.match(ui,/if\(id!==expected\.id\)/);
 assert.match(ui,/ss-card/);
 assert.match(ui,/ss-slots/);
 assert.match(css,/touch-action:manipulation/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css, /prefers-reduced-motion/);
 assert.match(art,/StoryForestScenery/);
 assert.match(art,/StoryForestActor/);
 assert.match(home,/StoryForestAdventure/);
 assert.match(home,/StorySequenceAdventure/);
 assert.match(page,/StoryForestHome/);
 assert.match(page,/getSequenceProgress/);
 assert.match(page, /forestCompletedLevels=\{/);
});
