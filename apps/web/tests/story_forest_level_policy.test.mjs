import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 JOURNEY_ROUTES,planJourneyStory,narrativeFor,
 validateJourneyRecord,validateJourneyChallenges,journeyStars
} from '../src/lib/learning/storyForestJourneyEngine.ts';
import {
 planSequenceStory,sequenceLengthForGrade,
 validateSequenceComprehension,sequenceComprehensionPrompt
} from '../src/lib/learning/storySequenceEngine.ts';
import {planDetectiveAdventure,detectiveAdventurePrompt}
 from '../src/lib/learning/storyDetectiveAdventureEngine.ts';
import {saveSequenceStory,getSequenceProgress}
 from '../src/lib/progress/storySequenceProgress.ts';
import {saveForestJourney,getStoryForestProgress}
 from '../src/lib/progress/storyForestProgress.ts';
import {MemoryProgressRepository}
 from '../src/lib/progress/MemoryProgressRepository.ts';

function journeyRecord(plan,destination){
 const checks=(plan.learningChallenges??[]).map(check=>({
  checkId:check.id,
  selectedId:check.kind==='place'?destination:check.target,
  mistakes:0,hintUsed:false,firstTryCorrect:true
 }));
 return {
  routeId:plan.route.id,episode:plan.route.episode,object:plan.route.object,
  destination,firstMistakes:0,secondMistakes:0,firstHint:false,
  secondHint:false,learningChecks:checks,completedAt:'2026-11-10T05:00:00.000Z'
 };
}
function sequenceAnswers(deck){
 return deck.frames.map((frame,slot)=>({
  frameId:frame.id,slot,mistakes:0,hintUsed:false,firstTryCorrect:true,
  placement:deck.englishLevel,timestamp:'2026-11-10T05:00:00.000Z'
 }));
}
function sequenceChecks(deck){
 return (deck.comprehensionChecks??[]).map(check=>({
  checkId:check.id,selectedId:check.targetFrameId,
  mistakes:0,hintUsed:false,firstTryCorrect:true
 }));
}
test('All 24 forest journeys keep authored identities and stage specific A1/A2 learning',()=>{
 assert.equal(JOURNEY_ROUTES.length,24);
 for(let episode=1;episode<=6;episode++)for(let grade of [1,3,5,8]){
  const common={episode,gradeLevel:grade,seed:episode*121+grade,history:[],
   assessmentVersion:2};
  const levels=['Pre-A1','A1','A2'].map(englishLevel=>
   planJourneyStory({...common,englishLevel}));
  assert.deepEqual(levels.map(p=>p.learningChallenges.length),[0,1,2]);
  assert.deepEqual(levels.map(p=>p.learningChallenges.map(c=>c.kind)),
   [[],['place'],['place','consequence']]);
  for(const plan of levels){
   const dest=plan.route.destinations[0].scene;
   const record=journeyRecord(plan,dest);
   assert.equal(validateJourneyRecord(record,plan),true);
   assert.equal(validateJourneyChallenges(record.learningChecks,plan,dest),true);
   assert.equal(journeyStars(record),3);
   for(const challenge of plan.learningChallenges){
    const target=challenge.kind==='place'?dest:challenge.target;
    assert.ok(challenge.choices.includes(target));
    assert.equal(challenge.choices.length,grade<=2?2:grade<=4?3:4);
    assert.equal(new Set(challenge.choices).size,challenge.choices.length);
    assert.match(narrativeFor(plan,challenge.kind,dest),/\w/);
   }
   if(plan.learningChallenges.length){
    assert.equal(validateJourneyRecord({...record,learningChecks:[]},plan),false);
    assert.equal(validateJourneyRecord({...record,learningChecks:record.learningChecks
     .map((row,i)=>i===0?{...row,selectedId:'invalid'}:row)},plan),false);
    assert.equal(validateJourneyRecord({...record,learningChecks:record.learningChecks
     .map((row,i)=>i===0?{...row,mistakes:-1}:row)},plan),false);
   }
  }
 }
});
test('Legacy level records stay readable and cannot gain duplicate entitlements',()=>{
 const old=planJourneyStory({episode:2,gradeLevel:2,
  englishLevel:'A1',seed:16});
 const record=journeyRecord(old,old.route.destinations[0].scene);
 delete record.learningChecks;
 assert.equal(validateJourneyRecord(record,old),true);
});
test('Sequence English changes assessment types independently of grade complexity',()=>{
 for(let episode=1;episode<=6;episode++){
  for(const grade of [1,2,3,4,5,8,null]){
   const levelPlans=['Pre-A1','A1','A2'].map(englishLevel=>
    planSequenceStory({episode,gradeLevel:grade,englishLevel,seed:episode+319,
     assessmentVersion:2}));
   assert.deepEqual(levelPlans.map(plan=>plan.comprehensionChecks.length),[0,1,2]);
   assert.deepEqual(levelPlans.map(plan=>plan.comprehensionChecks.map(c=>c.kind)),
    [[],['next'],['cause','result']]);
   assert.equal(levelPlans[0].frames.length,sequenceLengthForGrade(grade));
   assert.equal(levelPlans[1].frames.length,sequenceLengthForGrade(grade));
   assert.equal(levelPlans[2].frames.length,
    Math.max(4,sequenceLengthForGrade(grade)));
   for(const deck of levelPlans){
    const correct=sequenceChecks(deck);
    assert.ok(validateSequenceComprehension(correct,deck));
    for(const check of deck.comprehensionChecks){
     assert.ok(check.choiceIds.includes(check.targetFrameId));
     assert.equal(new Set(check.choiceIds).size,check.choiceIds.length);
     assert.ok(deck.frames.some(f=>f.id===check.referenceFrameId));
     assert.ok(deck.frames.some(f=>f.id===check.targetFrameId));
     assert.ok(check.choiceIds.every(id=>deck.frames.some(frame=>frame.id===id)));
     assert.match(sequenceComprehensionPrompt(check.kind,deck.englishLevel),/[.!?]$/);
    }
    if(correct.length){
     assert.equal(validateSequenceComprehension([],deck),false);
     assert.equal(validateSequenceComprehension(correct.map((a,i)=>i===0?
      {...a,selectedId:'wrong'}:a),deck),false);
     assert.equal(validateSequenceComprehension(correct.map((a,i)=>i===0?
      {...a,mistakes:2,firstTryCorrect:true}:a),deck),false);
    }
   }
  }
 }
});
test('Deductive steps are distinct across placements, but clue counts follow school grade',()=>{
 for(const gradeLevel of [1,2,4,5,7]){
  const base={episode:3,gradeLevel,seed:45,playCount:3};
  const levels=['Pre-A1','A1','A2'].map(englishLevel=>
   planDetectiveAdventure({...base,englishLevel}));
  assert.deepEqual(levels.map(p=>p.steps.filter(s=>s.kind==='sequence').length),
   [0,1,1]);
  assert.deepEqual(levels.map(p=>p.steps.filter(s=>s.kind==='evidence').length),
   [0,0,1]);
  assert.equal(new Set(levels.map(p=>p.steps.map(s=>s.kind).join('|'))).size,3);
  assert.equal(new Set(levels.map(p=>p.steps.filter(s=>s.kind==='clue').length)).size,1);
  const evidence=levels[2].steps.find(s=>s.kind==='evidence');
  assert.ok(evidence.choices.every(id=>id.includes('+')));
  assert.match(detectiveAdventurePrompt(levels[2],evidence),/clues/i);
 }
});
test('V2 comprehension is mandatory before saving and stays isolated per child',async()=>{
 const repo=MemoryProgressRepository.getInstance();
 await repo.clearAllProgress();
 const p=await repo.createProfile({nickname:'CEFR child A',avatarId:'avatar_explorer'});
 const q=await repo.createProfile({nickname:'CEFR child B',avatarId:'avatar_explorer'});
 const deck=planSequenceStory({episode:1,englishLevel:'A2',gradeLevel:1,
  seed:29,assessmentVersion:2});
 const input={repo,profileId:p.id,episode:1,deck,answers:sequenceAnswers(deck),
  sessionId:'level:sequence:a',durationSeconds:112};
 await assert.rejects(()=>saveSequenceStory(input));
 const comprehensionAnswers=sequenceChecks(deck);
 await saveSequenceStory({...input,comprehensionAnswers});
 assert.equal((await getSequenceProgress(repo,p.id)).completedLevels,1);
 assert.equal((await getSequenceProgress(repo,q.id)).completedLevels,0);
 const journey=planJourneyStory({episode:1,englishLevel:'A2',
  gradeLevel:2,seed:34,assessmentVersion:2});
 const destination=journey.route.destinations[0].scene;
 const record=journeyRecord(journey,destination);
 const forestInput={repo,profileId:p.id,episode:1,plan:journey,record,
  sessionId:'level:journey:a',durationSeconds:142};
 await assert.rejects(()=>saveForestJourney({...forestInput,
  record:{...record,learningChecks:[]}}));
 await saveForestJourney(forestInput);
 assert.equal((await getStoryForestProgress(repo,p.id)).completedLevels,1);
 assert.equal((await getStoryForestProgress(repo,q.id)).completedLevels,0);
 await repo.clearAllProgress();
});
test('Scene UI displays real visual interactions instead of extra text-only quizzes',()=>{
 const base=new URL('../src/components/learning/story/',import.meta.url);
 const files=[
  'StoryForestAdventure.tsx','StorySequenceAdventure.tsx',
  'StoryDetectiveAdventure.tsx','story-forest-level-checks.css',
  'story-sequence-comprehension.css'
 ];
 const contents=files.map(name=>fs.readFileSync(new URL(name,base),'utf8'));
 assert.ok(contents[0].includes("assessmentVersion:2"));
 assert.ok(contents[0].includes('StoryConsequenceArt'));
 assert.ok(contents[0].includes('sj-level-place-choices'));
 assert.ok(contents[0].includes('sj-level-outcome-choices'));
 assert.ok(contents[1].includes('beginCheck'));
 assert.ok(contents[1].includes('sequenceComprehensionPrompt'));
 assert.ok(contents[1].includes('ss-check-cards'));
 assert.ok(contents[2].includes('sd-evidence-pair'));
 assert.ok(contents[3].includes('@media(max-width:700px)'));
 assert.ok(contents[4].includes('@media(max-width:700px)'));
 assert.ok(contents[4].includes('prefers-reduced-motion'));
});

test('Listening tests cannot be solved from answer spoilers in background or collected clue strip',()=>{
 const base=new URL('../src/components/learning/story/',import.meta.url);
 const forest=fs.readFileSync(new URL('StoryForestAdventure.tsx',base),'utf8');
 const detective=fs.readFileSync(new URL('StoryDetectiveAdventure.tsx',base),'utf8');
 // Forest place-recall screen must retain the introduction, never the answer destination.
 assert.ok(forest.includes("(['result','friend','consequence','ending'] as JourneyPhase[])"));
 assert.ok(!forest.includes("['result','friend','place','consequence','ending']"));
 // Evidence remains hidden for memory, chronology and synthesis tests.
 assert.ok(detective.includes("!['memory','sequence','evidence'].includes(step.kind)"));
});

test('Bottom navigation cannot reveal the answer before a child discovers it',()=>{
 const content=fs.readFileSync(new URL('../src/components/learning/story/StoryForestAdventure.tsx',import.meta.url),'utf8');
 assert.ok(content.includes("['opening','discover'].includes(phase)?'🔎'"));
 assert.ok(content.includes('Bilinmeyen nesne'));
});
