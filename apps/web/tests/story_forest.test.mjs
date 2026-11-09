
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 FOREST_EPISODES,FOREST_BANK,FOREST_ACTOR_NAMES,planStoryForestEpisode,
 forestQuestionsForGrade,forestStars,validateStoryForestEvidence
} from '../src/lib/learning/storyForestEngine.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {getStoryForestProgress,saveStoryForestEpisode,STORY_FOREST_GAME_ID}
 from '../src/lib/progress/storyForestProgress.ts';
import {ARCHIPELAGO_ISLANDS_CATALOG} from '../../../packages/shared/src/archipelago.ts';

const answer=(deck)=>deck.questions.map(q=>({
 questionId:q.id,selectedId:q.targetId,mode:q.mode,
 mistakes:0,hintUsed:false,firstTryCorrect:true,
 placement:deck.englishLevel,timestamp:'2026-11-08T14:00:00.000Z'
}));
test('Six original scenes, three levels and four visual modes are all grounded',()=>{
 assert.equal(FOREST_EPISODES.length,6);
 assert.equal(new Set(FOREST_EPISODES.map(e=>e.scene)).size,6);
 assert.equal(ARCHIPELAGO_ISLANDS_CATALOG.listening_forest.contentPublished,true);
 assert.equal(ARCHIPELAGO_ISLANDS_CATALOG.listening_forest.totalPublishedRequiredLevels,18);
 const modes=new Set();
 for(const episode of FOREST_EPISODES){
  assert.equal(FOREST_BANK[episode.id].length,6);
  for(const q of FOREST_BANK[episode.id]){
   modes.add(q.mode);
   assert.equal(q.choiceIds.length,3);
   assert.equal(new Set(q.choiceIds).size,3);
   assert.ok(q.choiceIds.includes(q.targetId));
   assert.ok(q.choiceIds.every(x=>x in FOREST_ACTOR_NAMES));
   for(const level of ['Pre-A1','A1','A2'])assert.ok(q.prompts[level].length>10);
   assert.ok(q.prompts['Pre-A1'].split(' ').length<=9,'minimal spoken beginner cue');
  }
 }
 assert.deepEqual([...modes].sort(),['action','character','place','trait']);
});
test('Story planner respects English level separately from cognitive grade and shuffles choices',()=>{
 assert.equal(forestQuestionsForGrade(1),3);
 assert.equal(forestQuestionsForGrade(3),4);
 assert.equal(forestQuestionsForGrade(7),5);
 for(const grade of [1,2,3,4,5,6,7,8,null]){
  for(const level of ['Pre-A1','A1','A2']){
   for(let episode=1;episode<=6;episode++){
    const p=planStoryForestEpisode({episode,gradeLevel:grade,englishLevel:level,seed:231});
    assert.equal(p.questions.length,forestQuestionsForGrade(grade));
    assert.equal(new Set(p.questions.map(x=>x.id)).size,p.questions.length);
    assert.ok(p.questions.every(q=>q.prompt===q.prompts[level]));
    assert.ok(p.questions.every(q=>q.choices.includes(q.targetId)));
    assert.ok(validateStoryForestEvidence(answer(p),p));
   }
  }
 }
 const p=planStoryForestEpisode({episode:1,gradeLevel:8,englishLevel:'A2',seed:7});
 const other=planStoryForestEpisode({episode:1,gradeLevel:8,englishLevel:'A2',seed:81009});
 assert.notDeepEqual(p.questions.map(q=>q.id),other.questions.map(q=>q.id));
});
test('Assist and errors are not counted as independent language evidence',()=>{
 const p=planStoryForestEpisode({episode:2,gradeLevel:4,englishLevel:'A1',seed:10});
 const a=answer(p);
 assert.equal(forestStars(a),3);
 assert.equal(validateStoryForestEvidence(a.slice(1),p),false);
 assert.equal(validateStoryForestEvidence(a.map(x=>({...x,selectedId:'fox'})),p),false);
 assert.equal(validateStoryForestEvidence(a.map((x,i)=>i===0?{...x,firstTryCorrect:false}:x),p),false);
 const helped=a.map((x,i)=>i===0?{...x,hintUsed:true,firstTryCorrect:false}:x);
 assert.ok(validateStoryForestEvidence(helped,p));
 assert.equal(forestStars(helped),2);
 const errors=a.map((x,i)=>i===0?{...x,mistakes:3,firstTryCorrect:false}:x);
 assert.equal(forestStars(errors),1);
});
test('Missed questions rank higher on the next session without granting progress',()=>{
 const p=planStoryForestEpisode({episode:1,gradeLevel:1,englishLevel:'Pre-A1',seed:12});
 const weakest=p.questions[2];
 const wrong={...answer(p)[2],mistakes:2,firstTryCorrect:false};
 const revisit=planStoryForestEpisode({episode:1,gradeLevel:1,englishLevel:'Pre-A1',seed:412,history:[wrong]});
 assert.equal(revisit.questions[0].id,weakest.id);
});
test('Forest saves after full episodes, isolates profiles, prevents skipping and duplicate session rewards',async()=>{
 const repo=MemoryProgressRepository.getInstance();
 await repo.clearAllProgress();
 const left=await repo.createProfile({nickname:'Forest 1',avatarId:'avatar_explorer'});
 const right=await repo.createProfile({nickname:'Forest 2',avatarId:'avatar_explorer'});
 const p2=planStoryForestEpisode({episode:2,gradeLevel:2,englishLevel:'Pre-A1',seed:2});
 await assert.rejects(()=>saveStoryForestEpisode({repo,profileId:left.id,episode:2,
  deck:p2,answers:answer(p2),sessionId:'story:skip',durationSeconds:15}));
 const p1=planStoryForestEpisode({episode:1,gradeLevel:2,englishLevel:'Pre-A1',seed:2});
 const data={repo,profileId:left.id,episode:1,deck:p1,answers:answer(p1),
  sessionId:'story:one',durationSeconds:15};
 await saveStoryForestEpisode(data);
 await saveStoryForestEpisode(data);
 const leftP=await getStoryForestProgress(repo,left.id);
 const rightP=await getStoryForestProgress(repo,right.id);
 assert.equal(leftP.completedLevels,1);
 assert.equal(leftP.starsByLevel[1],3);
 assert.equal(rightP.completedLevels,0);
 assert.equal((await repo.getStoryAnswerHistory(left.id)).length,p1.questions.length);
 assert.equal((await repo.getStoryAnswerHistory(right.id)).length,0);
 const saved=await repo.getLevelProgress(STORY_FOREST_GAME_ID,1,left.id);
 assert.equal(saved?.completedCount,1);
 assert.equal(await repo.getTotalStars(left.id,STORY_FOREST_GAME_ID),3);
 await repo.clearAllProgress();
});
test('Story UI ships independent illustration layers, offline audio and no manual next step',()=>{
 const ui=fs.readFileSync(new URL('../src/components/learning/story/StoryForestAdventure.tsx',import.meta.url),'utf8');
 const art=fs.readFileSync(new URL('../src/components/learning/story/StoryForestArt.tsx',import.meta.url),'utf8');
 const css=fs.readFileSync(new URL('../src/components/learning/story/story-forest-journey.css',import.meta.url),'utf8');
 const page=fs.readFileSync(new URL('../src/app/kids/page.tsx',import.meta.url),'utf8');
 assert.match(ui,/StoryForestScenery/);
 assert.match(ui,/StoryForestActor/);
 assert.match(ui,/soundService.speakEnglish/);
 assert.match(ui,/setTimeout/);
 assert.match(ui,/saveForestJourney/);
 assert.match(ui,/planJourneyStory/);
 assert.match(ui,/choosePath/);
 assert.match(ui,/tapFriend/);
 assert.doesNotMatch(ui,/Sonraki Soru/);
 assert.match(art,/Every answer illustration is drawn independently/);
 assert.match(css,/touch-action:manipulation/);
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/sj-path-choices/);
 assert.match(page,/activeRegion==='listening_forest'/);
 assert.match(page,/StoryForestHome/);
 assert.match(page,/sequenceProgress/);
 assert.match(page,/forestCompletedLevels/);
});
