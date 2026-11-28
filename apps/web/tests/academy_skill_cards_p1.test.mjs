import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildAcademyPlan,buildAcademyFocusPlan} from '../src/lib/learning/academyEngine.ts';
const read=(file)=>fs.readFileSync(new URL('../src/components/learning/academy/'+file,import.meta.url),'utf8');

test('Skill rail reflects five planned tasks or exactly three targeted review tasks',()=>{
 for(const placement of ['Pre-A1','A1','A2'])for(let zone=1;zone<=6;zone++){
  assert.deepEqual(buildAcademyPlan(zone,placement,0).tasks.map(t=>t.kind),['hear','read','talk','build','write']);
  const focus=buildAcademyFocusPlan(zone,placement,'dialogue',0);
  assert.equal(focus.tasks.length,3);
  assert.deepEqual(focus.tasks.map(t=>t.kind),['talk','talk','talk']);
  assert.equal(new Set(focus.tasks.map(t=>t.id)).size,3);
 }
 const cards=read('AcademySkillSystem.tsx');
 assert.match(cards,/tasks\.map\(\(task,i\)=>/);
 assert.match(cards,/key:task\.id/);
 assert.match(cards,/const state=i<current\?'done':i===current\?'current':'upcoming'/);
 assert.match(cards,/<GameStepRail island="academy" className="academy-skill-rail"/,'the shared rail marks the current step with aria-current');
 assert.match(cards,/review\?'Tekrar '/);
 assert.doesNotMatch(cards,/onClick=|localStorage|listenToChild|recordGameCompleted/);
 for(const kind of ['hear','read','talk','build','write'])assert.ok(cards.includes(' '+kind+':{name:'),kind);
});
test('Shared task identity and single feedback retain local speech validation and privacy checkpoints',()=>{
 const ui=read('AcademyAdventure.tsx');
 for(const check of ['<AcademySkillJourney tasks={plan.tasks}','<AcademyTaskIdentity kind={task.kind}',
   '<AcademyTaskStatus message={message} resolved={resolved}','reviewSkill?buildAcademyFocusPlan',
   'readAcademyCheckpoint','saveAcademyCheckpoint','!hintOnStep&&errorOnStep===0',
   'speechVerified:true','listenToChild(capability,9000',
   "['native-local','sherpa-local','web-local']",'reviewSkill?0:stars']){
  assert.ok(ui.includes(check),check);
 }
 assert.doesNotMatch(ui,/academy-scene-achievement|academy-feedback/);
 assert.match(ui,/ACADEMY_ADVANCE_DELAY_MS=1400/);
 assert.equal((ui.match(/\},ACADEMY_ADVANCE_DELAY_MS\);/g)||[]).length,2);
 assert.match(ui,/questScroller\.current/);
 assert.match(ui,/previousTaskId\.current/);
 assert.match(ui,/<\/section>\s*<section className="academy-task" ref=\{taskTarget\}>/);
 assert.doesNotMatch(read('academy-adventure.css'),/\.academy-scene-achievement\{/);
});
test('Touch, keyboard, voice and reading guidance are accessible at mobile widths',()=>{
 const css=read('academy-skill-system.css'),ui=read('AcademyAdventure.tsx');
 for(const token of ['min-height:44px','font-size:16px;scroll-margin-top','@media(max-width:650px)'])assert.ok(css.includes(token),token);
 // The skill rail is the shared step rail: it scrolls sideways on phones, centres the
 // current step without moving the page, and is calm under reduced motion.
 const frame=fs.readFileSync(new URL('../src/components/learning/game/game-frame.css',import.meta.url),'utf8');
 const rail=fs.readFileSync(new URL('../src/components/learning/game/GameFrame.tsx',import.meta.url),'utf8');
 for(const token of ['overflow-x:auto','.gf-step-short{display:inline}','prefers-reduced-motion:reduce'])assert.ok(frame.includes(token),token);
 assert.match(rail,/rail\.scrollLeft=Math\.max\(0,left\)/);
 assert.match(ui,/autoCapitalize="none" autoCorrect="off"/);
 assert.match(ui,/if\(e\.key==='Enter'&&typed\.trim\(\)\)/);
 assert.match(ui,/task\.kind==='hear'&&!audioAttempted/);
 assert.match(ui,/task\.kind==='write'&&!useTiles/);
 const cards=read('AcademySkillSystem.tsx');
 assert.match(cards,/Dokunarak da ilerleyebilirsin; bu konuşma başarısı sayılmaz/);
 assert.match(cards,/Klavye yerine kelime kartlarını kullanmak yardımlı çalışmadır/);
});
