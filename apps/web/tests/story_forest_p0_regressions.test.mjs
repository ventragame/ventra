import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {planJourneyStory} from '../src/lib/learning/storyForestJourneyEngine.ts';
import {
 planDetectiveAdventure,detectiveAdventureNarration,detectiveAdventurePrompt
} from '../src/lib/learning/storyDetectiveAdventureEngine.ts';

const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const LEVELS=['Pre-A1','A1','A2'];
const GRADES=[null,1,2,3,4,5,6];

test('Forest place check never offers the starting scene (the backdrop) as a wrong answer',()=>{
 let checked=0;
 for(let episode=1;episode<=6;episode++)for(const englishLevel of ['A1','A2'])for(const gradeLevel of GRADES)
  for(let seed=1;seed<=60;seed++){
   const plan=planJourneyStory({episode,englishLevel,gradeLevel,seed:seed*7919,assessmentVersion:2});
   const place=plan.learningChallenges.find(c=>c.kind==='place');
   assert.ok(place,'A1/A2 stories include the place check');
   const extras=place.choices.filter(scene=>!plan.route.destinations.some(d=>d.scene===scene));
   assert.ok(!extras.includes(plan.route.scene),
    `episode ${episode} seed ${seed}: start scene ${plan.route.scene} offered as a distractor`);
   assert.equal(new Set(place.choices).size,place.choices.length,'no duplicated place cards');
   checked++;
  }
 assert.ok(checked>1000);
});

test('Detective A2 evidence and sequence wrong pairs never use another clue of the real destination',()=>{
 for(let episode=1;episode<=6;episode++)for(const gradeLevel of GRADES)for(let playCount=0;playCount<8;playCount++)
  for(let seed=1;seed<=12;seed++){
   const plan=planDetectiveAdventure({episode,gradeLevel,englishLevel:'A2',seed:seed*104729+playCount,playCount});
   const destinationClues=plan.chosen.clueIds;
   for(const step of plan.steps.filter(s=>s.kind==='evidence'||s.kind==='sequence')){
    for(const choice of step.choices){
     if(step.acceptedIds.includes(choice))continue;
     const parts=choice.split(step.kind==='evidence'?'+':'>');
     if(step.kind==='evidence'){
      assert.ok(parts.some(part=>!destinationClues.includes(part)),
       `episode ${episode}: wrong evidence pair ${choice} is fully valid for ${plan.chosen.destination}`);
     }
    }
   }
  }
});

test('Detective English openings start every sentence with a capital letter',()=>{
 for(let episode=1;episode<=6;episode++)for(const englishLevel of LEVELS)for(let playCount=0;playCount<4;playCount++){
  const plan=planDetectiveAdventure({episode,gradeLevel:3,englishLevel,seed:4242+playCount,playCount});
  const texts=[detectiveAdventureNarration(plan,'opening'),detectiveAdventureNarration(plan,'ending'),
   ...plan.steps.map(step=>detectiveAdventurePrompt(plan,step,plan.waypoints[0]))];
  for(const text of texts){
   assert.match(text,/^[A-Z¿"']/,text);
   assert.doesNotMatch(text,/[.!?] [a-z]/,`lower-case sentence start in: ${text}`);
  }
 }
});

test('Story Forest replay cannot cancel a pending advance, and the helper is hidden while it is the question',()=>{
 const ui=source('../src/components/learning/story/StoryForestAdventure.tsx');
 assert.match(ui,/function replay\(\)\{[\s\S]{0,220}if\(!plan\|\|busy\|\|actionLock\.current\)return;/);
 assert.match(ui,/disabled=\{busy\|\|actionLock\.current\}\n\s*onListen=\{replay\}/);
 const showFriend=ui.match(/const showFriend=\[([^\]]*)\]/)?.[1]??'';
 assert.ok(showFriend.length>0);
 assert.doesNotMatch(showFriend,/'friend'/,'helper must not be drawn during the find-the-helper question');
});
