import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 planDetectiveAdventure,detectiveAdventureNarration,detectiveAdventurePrompt
} from '../src/lib/learning/storyDetectiveAdventureEngine.ts';
import {
 SEQUENCE_STORIES,planSequenceStory,sequencePlayCount,sequenceExcerpts,sequenceLengthForGrade,
 validateSequenceAnswers,validateSequenceComprehension
} from '../src/lib/learning/storySequenceEngine.ts';
import {journeyPlaceLabel} from '../src/lib/learning/storyForestJourneyEngine.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {saveSequenceStory} from '../src/lib/progress/storySequenceProgress.ts';

const story=file=>fs.readFileSync(new URL('../src/components/learning/story/'+file,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const SCENES=['path','treehouse','pond','meadow','camp','bridge'];

/** One completed play = one saved ordering answer per frame (what the repository returns). */
function playedHistory(episode,plays){
 const rows=[];
 for(let p=0;p<plays;p++)for(let slot=0;slot<3;slot++)
  rows.push({frameId:'seq-'+episode+'-'+(slot===0?1:slot+2),slot,mistakes:0,hintUsed:false,
   firstTryCorrect:true,placement:'A1',timestamp:'2026-11-22T08:00:00.000Z'});
 return rows;
}
const orderAnswers=deck=>deck.frames.map((frame,slot)=>({frameId:frame.id,slot,mistakes:0,hintUsed:false,
 firstTryCorrect:true,placement:deck.englishLevel,timestamp:'2026-11-22T08:00:00.000Z'}));
const checkAnswers=deck=>(deck.comprehensionChecks??[]).map(check=>({checkId:check.id,
 selectedId:check.targetFrameId,mistakes:0,hintUsed:false,firstTryCorrect:true}));

test('P2 Detective: every English caption sentence starts with a capital on both routes and all grades',()=>{
 for(let episode=1;episode<=6;episode++)for(const englishLevel of ['Pre-A1','A1','A2'])
  for(const gradeLevel of [1,3,5])for(let playCount=0;playCount<12;playCount++){
   const plan=planDetectiveAdventure({episode,gradeLevel,englishLevel,seed:9001+playCount*31,playCount});
   for(const route of plan.waypoints){
    const texts=[detectiveAdventureNarration(plan,'opening',route),detectiveAdventureNarration(plan,'ending',route),
     ...plan.steps.map(step=>detectiveAdventurePrompt(plan,step,route))];
    for(const text of texts){
     assert.match(text,/^[A-Z]/,text);
     assert.doesNotMatch(text,/[.!?] [a-z]/,'lower-case sentence start: '+text);
    }
   }
  }
});

test('P2 Story load errors offer a child-friendly retry that runs the load again',()=>{
 for(const file of ['StoryForestAdventure.tsx','StoryDetectiveAdventure.tsx','StorySequenceAdventure.tsx']){
  const ui=story(file);
  assert.match(ui,/const \[loadAttempt,setLoadAttempt\]=useState\(0\);/,file);
  assert.match(ui,/\},\[profileId,loadAttempt\]\);/,file+': the load effect re-runs on retry');
  const alert=ui.slice(ui.indexOf('{loadError&&'),ui.indexOf('</div>}',ui.indexOf('{loadError&&')));
  assert.match(alert,/role="alert"/,file);
  // The retry is the shared game-frame secondary button.
  assert.match(alert,/<button type="button" className="gf-btn gf-btn--secondary" onClick=\{\(\)=>setLoadAttempt\(n=>n\+1\)\}>↻ Tekrar dene<\/button>/,file);
  for(const [,message] of ui.matchAll(/setLoadError\('([^']+)'\)/g)){
   assert.doesNotMatch(message,/error|exception|\d|\[|:/i,file+': no technical text for children: '+message);
  }
 }
 // The forest home hands its error and retry to the shared island home.
 const home=story('StoryForestHome.tsx');
 const shared=fs.readFileSync(new URL('../src/components/learning/island/IslandHome.tsx',import.meta.url),'utf8');
 assert.match(home,/const \[loadAttempt,setLoadAttempt\]=useState\(0\);/);
 assert.match(home,/\},\[profileId,loadAttempt\]\);/);
 assert.match(home,/status=\{loadError\?'error':loaded\?'ready':'loading'\} errorText=\{loadError\|\|undefined\}/);
 assert.match(home,/onRetry=\{\(\)=>setLoadAttempt\(n=>n\+1\)\}/);
 assert.match(shared,/status==='error'&&<div className="ih-alert" role="alert">/);
 assert.match(shared,/onClick=\{props\.onRetry\}>↻ Tekrar dene<\/button>/);
 for(const [,message] of home.matchAll(/setLoadError\('([^']+)'\)/g))
  assert.doesNotMatch(message,/error|exception|\d|\[|:/i,'no technical text for children: '+message);
});

test('P2 Sequence: the first play keeps the original excerpt; completed replays rotate story versions and the A1 check',()=>{
 for(let episode=1;episode<=6;episode++){
  const first=planSequenceStory({episode,gradeLevel:1,englishLevel:'A1',seed:77,assessmentVersion:2});
  assert.deepEqual(first.frames.map(f=>f.order),[0,2,4],'no history = the authored default excerpt');
  assert.deepEqual(planSequenceStory({episode,gradeLevel:3,englishLevel:'A1',seed:77,assessmentVersion:2})
   .frames.map(f=>f.order),[0,1,3,4]);
  for(const gradeLevel of [1,2,3,4,null,6])for(const englishLevel of ['Pre-A1','A1','A2']){
   const versions=new Set();
   for(let plays=0;plays<6;plays++){
    const deck=planSequenceStory({episode,gradeLevel,englishLevel,seed:1234,assessmentVersion:2,
     history:playedHistory(episode,plays)});
    const orders=deck.frames.map(f=>f.order);
    assert.equal(orders[0],0);assert.equal(orders.at(-1),4);
    assert.ok(orders.every((o,i)=>i===0||o>orders[i-1]),'chronological excerpt');
    assert.ok(validateSequenceAnswers(orderAnswers(deck),deck));
    assert.ok(validateSequenceComprehension(checkAnswers(deck),deck));
    for(const check of deck.comprehensionChecks){
     assert.equal(check.choiceIds.length,3,'every check offers three pictures (grades 1–2 too)');
     assert.equal(new Set(check.choiceIds).size,3);
     assert.ok(check.choiceIds.every(id=>deck.frames.some(f=>f.id===id)),'only heard scenes are offered');
     if(check.kind==='next'){
      const ref=deck.frames.findIndex(f=>f.id===check.referenceFrameId);
      assert.equal(deck.frames[ref+1]?.id,check.targetFrameId,'"just after" is the next heard scene');
     }
    }
    versions.add(orders.join(',')+'|'+deck.comprehensionChecks.map(c=>c.referenceFrameId+'>'+c.targetFrameId).join(';'));
   }
   // A1 always gets a new check; other levels vary wherever an authored alternative exists
   // (five-scene decks already tell the whole story; then only the card shuffle changes).
   const count=englishLevel==='A2'?Math.max(4,sequenceLengthForGrade(gradeLevel)):sequenceLengthForGrade(gradeLevel);
   if(englishLevel==='A1'||sequenceExcerpts(episode,count,englishLevel==='A2').length>1)
    assert.ok(versions.size>1,`episode ${episode} grade ${gradeLevel} ${englishLevel}: replays never vary`);
  }
 }
});

test('P2 Sequence: every authored alternative keeps the A2 causal scene and only counts completed plays',()=>{
 for(let episode=1;episode<=6;episode++){
  for(const count of [3,4,5])for(const indices of sequenceExcerpts(episode,count)){
   assert.equal(indices.length,count);assert.equal(indices[0],0);assert.equal(indices.at(-1),4);
  }
  assert.equal(sequenceExcerpts(episode,3).length,2,'grades 1–2 always have a second version');
  for(let plays=0;plays<4;plays++){
   const deck=planSequenceStory({episode,gradeLevel:2,englishLevel:'A2',seed:5,assessmentVersion:2,
    history:playedHistory(episode,plays)});
   const cause=deck.comprehensionChecks.find(c=>c.kind==='cause');
   assert.ok(deck.frames.some(f=>f.id===cause.targetFrameId),'the authored cause is always narrated');
  }
 }
 const mixed=[...playedHistory(2,3),...playedHistory(5,1)];
 assert.equal(sequencePlayCount(mixed,2),3);
 assert.equal(sequencePlayCount(mixed,5),1);
 assert.equal(sequencePlayCount(mixed,1),0);
 assert.equal(sequencePlayCount(undefined,1),0);
 assert.equal(SEQUENCE_STORIES.length,6);
});

test('P2 Sequence: a saved play changes the next replay through the real answer history',async()=>{
 const repo=MemoryProgressRepository.getInstance();
 await repo.clearAllProgress();
 const child=await repo.createProfile({nickname:'Replay child',avatarId:'avatar_explorer'});
 const first=planSequenceStory({episode:1,gradeLevel:1,englishLevel:'A1',seed:42,assessmentVersion:2,
  history:await repo.getSequenceAnswerHistory(child.id)});
 await saveSequenceStory({repo,profileId:child.id,episode:1,deck:first,answers:orderAnswers(first),
  comprehensionAnswers:checkAnswers(first),sessionId:'seq:p2:replay:1',durationSeconds:60});
 const replay=planSequenceStory({episode:1,gradeLevel:1,englishLevel:'A1',seed:42,assessmentVersion:2,
  history:await repo.getSequenceAnswerHistory(child.id)});
 assert.notDeepEqual(replay.frames.map(f=>f.id),first.frames.map(f=>f.id),'a different version of the story');
 assert.notEqual(replay.comprehensionChecks[0].targetFrameId,first.comprehensionChecks[0].targetFrameId);
 await repo.clearAllProgress();
 const ui=story('StorySequenceAdventure.tsx');
 assert.match(ui,/planSequenceStory\(\{episode:id,gradeLevel,englishLevel,seed,assessmentVersion:2,history\}\)/,
  'the loaded answer history reaches the planner');
});

test('P2 Story accessibility: Turkish place names, honest lock text and focus that follows the story',()=>{
 for(const scene of SCENES){
  const label=journeyPlaceLabel(scene);
  assert.notEqual(label,scene);
  assert.match(label,/^[A-ZÇĞİÖŞÜ]/,'child-facing Turkish name for '+scene);
 }
 const forest=story('StoryForestAdventure.tsx');
 assert.match(forest,/aria-label=\{journeyPlaceLabel\(place as ForestScene\)\}/);
 assert.doesNotMatch(forest,/aria-label=\{place\}/,'raw English scene id is never the accessible name');
 const sequence=story('StorySequenceAdventure.tsx');
 assert.match(sequence,/open\?'Oyna':'Kilitli'/);
 assert.doesNotMatch(sequence,/Yakında/,'a locked chapter is not "coming soon"');
 const focus={
  'StoryForestAdventure.tsx':[/useQuestionFocus<HTMLDivElement>\(screen==='playing'\?'play:'\+phase:screen\)/,
   /className="sj-scene" role="group" aria-label="[^"]+"\n\s*ref=\{sceneFocus\} tabIndex=\{-1\}/,
   /title=\{active\.title\+' macerasını tamamladın!'\} titleRef=\{rewardHeading\}/],
  'StoryDetectiveAdventure.tsx':[/useQuestionFocus<HTMLHeadingElement>\(\n\s*view==='playing'\?phase\+':'\+stepIndex:view\)/,
   /<h2 ref=\{stepHeading\} tabIndex=\{-1\}>/,/title="Gizem Çözüldü!" titleRef=\{rewardHeading\}/],
  'StorySequenceAdventure.tsx':[/useQuestionFocus<HTMLDivElement>\(\n\s*page==='order'\?'order:'\+slot:page==='check'\?'check:'\+checkIndex:page\)/,
   /className="ss-cards" role="group" aria-label="[^"]+"\n\s*ref=\{stepFocus\} tabIndex=\{-1\}/,
   /className="ss-check-cards" role="group" aria-label="[^"]+"\n\s*ref=\{stepFocus\} tabIndex=\{-1\}/,
   /title=\{currentStory\.title\} titleRef=\{rewardHeading\}/]
 };
 for(const [file,patterns] of Object.entries(focus)){
  const ui=story(file);
  assert.match(ui,/import \{useQuestionFocus\} from '@\/components\/learning\/activities\/useQuestionFocus';/,file);
  for(const pattern of patterns)assert.match(ui,pattern,file);
 }
});

test('A2 consequence choices are read, not solved by matching the found object',async()=>{
 const {JOURNEY_OUTCOMES,planJourneyStory}=await import('../src/lib/learning/storyForestJourneyEngine.ts');
 const objects=['key','apple','bird','crystal'];
 const texts=objects.map(o=>JOURNEY_OUTCOMES[o].en);
 assert.equal(new Set(texts).size,4);
 for(const text of texts){
  assert.match(text,/^[A-Z][^.]*\.$/,'one capitalised sentence');
  for(const object of objects)assert.ok(!new RegExp('\b'+object+'\b','i').test(text),text+' must not name '+object);
 }
 const ui=fs.readFileSync(new URL('../src/components/learning/story/StoryForestAdventure.tsx',import.meta.url),'utf8');
 assert.ok(!/Anahtar sandığı açar|Kuş ailesine kavuşur/.test(ui),'no Turkish label that names the object');
 assert.match(ui,/<span className="sj-outcome-text" lang="en">\{JOURNEY_OUTCOMES\[value as JourneyObject\]\.en\}<\/span>/);
 let checked=0;
 for(let episode=1;episode<=12;episode++)for(const gradeLevel of [3,5])for(let seed=1;seed<=3;seed++){
  let plan;
  try{plan=planJourneyStory({episode,englishLevel:'A2',gradeLevel,seed:seed*17+episode,assessmentVersion:2});}catch{continue;}
  const challenge=plan.learningChallenges?.find(c=>c.kind==='consequence');
  if(!challenge)continue;
  assert.ok(challenge.choices.includes(challenge.target));
  for(const choice of challenge.choices)assert.ok(JOURNEY_OUTCOMES[choice],'every choice has a written result');
  checked++;
 }
 assert.ok(checked>0,'A2 plans ask the consequence question');
});
