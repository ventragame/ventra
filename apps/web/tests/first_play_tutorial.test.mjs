import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FIRST_PLAY_LESSONS,tutorialSeenKey} from '../src/lib/learning/firstPlayTutorial.ts';
const all=['animals','colors','numbers','food','family','sanctuary'];
test('First-play sandbox teaches exactly the six real English worlds and each action is touchable',()=>{
 assert.deepEqual(Object.keys(FIRST_PLAY_LESSONS),all);
 for(const world of all){
  const lesson=FIRST_PLAY_LESSONS[world];
  assert.ok(lesson.name&&lesson.intro&&lesson.completion);
  const ids=lesson.choices.map(c=>c.id);
  assert.equal(ids.length,new Set(ids).size);
  assert.ok(lesson.steps.length>=1);
  assert.ok(lesson.steps.every(s=>ids.includes(s.choiceId)&&s.prompt&&s.done));
 }
 assert.deepEqual(FIRST_PLAY_LESSONS.food.steps.map(s=>s.choiceId),['apple','basket']);
 assert.deepEqual(FIRST_PLAY_LESSONS.sanctuary.steps.map(s=>s.choiceId),['i','see','a','cat']);
});
test('Tutorial completion keys stay separate by child, world and version',()=>{
 assert.notEqual(tutorialSeenKey('kid-1','food'),tutorialSeenKey('kid-2','food'));
 assert.notEqual(tutorialSeenKey('kid-1','food'),tutorialSeenKey('kid-1','animals'));
 assert.match(tutorialSeenKey('kid-1','animals'),/first-play:v1/);
 assert.throws(()=>tutorialSeenKey('','animals'),/profili/);
});
test('Guides appear after actual progress loads, support skipping and replay, not lesson rewards',()=>{
 const modal=fs.readFileSync(new URL('../src/components/learning/LearningPathModal.tsx',import.meta.url),'utf8');
 const gui=fs.readFileSync(new URL('../src/components/learning/FirstPlayGuide.tsx',import.meta.url),'utf8');
 for(const world of all)assert.ok(modal.includes("withFirstPlay('"+world+"'"),'missing '+world);
 assert.match(gui,/hasPlayed/);
 assert.match(gui,/sessionSeen\.add\(key\)/);
 assert.match(gui,/localStorage\.setItem\(key,'done'\)/);
 assert.match(gui,/onClick=\{remember\}/);
 assert.match(gui,/onClick=\{reopen\}/);
 assert.match(gui,/role="dialog"/);
 assert.doesNotMatch(gui,/recordGameCompleted|saveWordGardenLevelCompletion|onSave|starsEarned/);
});
