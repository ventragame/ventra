import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { COLOR_GROVE_WORDS } from '../src/lib/progress/colorGroveProgress.ts';
import { planColorMission } from '../src/lib/learning/colorMissionEngine.ts';

const file=(name)=>fs.readFileSync(new URL('../src/components/learning/activities/'+name,import.meta.url),'utf8');

test('Mobile Color Grove has a real touch-first game world and retains separate desktop SVG',()=>{
 const world=file('MobileColorGroveWorld.tsx');
 const view=file('ColorGroveAdventure.tsx');
 const css=file('color-grove.css');
 assert.match(view,/<MobileColorGroveWorld[\s\S]*?mode="discovery"/);
 assert.match(view,/mode=\{step === 2 \? 'matching' : 'painting'\}/);
 assert.match(view,/onChoose=\{explore\}/);
 assert.match(view,/onChoose=\{choose\}/);
 assert.match(view,/cg-desktop-view/);
 assert.match(view,/cg-mobile-view/);
 assert.match(view,/<ColorGroveScene/);
 assert.match(world,/data-found=\{discovered\}/);
 assert.match(world,/data-wrong=\{wrongId===word.id\}/);
 assert.match(world,/data-correct=\{correctId===word.id\}/);
 assert.match(world,/aria-label=\{isPainting\?/);
 assert.match(world,/onClick=\{\(\)=>onChoose\?\.\(word.id\)\}/);
 assert.match(css,/@media\(max-width:767px\)/);
 assert.match(css,/@media\(max-width:359px\)/);
 assert.match(css,/orientation:landscape/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/env\(safe-area-inset-bottom/);
 assert.match(css,/focus-visible/);
 assert.match(css,/touch-action:manipulation/);
});
test('Mobile Color Grove keeps discovery, grade eligibility and replay contracts unchanged',()=>{
 assert.equal(COLOR_GROVE_WORDS.length,30);
 for(const [level,grade] of [['Pre-A1',1],['A1',3],['A2',7]]){
  const plan=planColorMission({mission:1,history:[],seed:43,englishLevel:level,gradeLevel:grade});
  assert.equal(plan.colors.length,grade<=2?4:6,'grade-aware discovery remains unchanged');
  assert.ok(plan.colors.every(id=>COLOR_GROVE_WORDS.some(word=>word.id===id)));
 }
});
test('Mobile Color Grove audio controls detect Capacitor speech and honor sound errors',()=>{
 const view=file('ColorGroveAdventure.tsx');
 assert.match(view,/soundService\.hasEnglishSpeech\(\)/);
 assert.match(view,/soundService\.cancelSpeech\(\)/);
 assert.match(view,/answerLocked\.current/);
 assert.match(view,/discoveredRef\.current/);
 assert.match(view,/onError/);
 assert.match(view,/setSpeechError\(true\)/);
 assert.match(view,/onPointerDown=\{\(event\) => event.stopPropagation\(\)\}/);
});

test('Color Grove v4 preserves accessible answers while updating the illustration and stage',()=>{
 const world=file('MobileColorGroveWorld.tsx');
 const css=file('color-grove-v4.css');
 const desktop=file('ColorGroveScene.tsx');
 const adventure=file('ColorGroveAdventure.tsx');
 assert.match(world,/cg4-stage/);
 assert.match(world,/cg4-discovery-grid/);
 assert.match(world,/cg4-choice-grid/);
 assert.match(world,/variant = 'garden'/);
 assert.match(world,/data-found=\{discovered\}/);
 assert.match(world,/data-wrong=\{wrongId===word.id\}/);
 assert.match(world,/data-correct=\{correctId===word.id\}/);
 assert.match(world,/aria-label=\{isPainting\?/);
 assert.match(world,/onClick=\{\(\)=>onChoose\?\.\(word.id\)\}/);
 assert.match(css,/grove-stage-v4\.svg/);
 assert.match(css,/@media\(max-width:359px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/focus-visible/);
 assert.match(desktop,/grove-stage-v4\.svg/);
 assert.match(adventure,/variant=\{currentQuestion.scene\}/);
 assert.match(adventure,/cg4-discovery-note/);
 assert.match(adventure,/ready:step===1&&Boolean\(activePlan\?\.colors.length\)/);
 assert.doesNotMatch(adventure,/onClick=\{\(\) => void finish\(discovered.length\)\}/);
});
