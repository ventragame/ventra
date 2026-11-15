import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HARBOR_QUESTS,getHarborEpisodeSteps} from '../src/lib/learning/harborMissionEngine.ts';
import {HARBOR_BEAT_LABELS,harborBeat,harborCoachHint,harborRetryMessage} from '../src/lib/learning/harborGamePolish.ts';

const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');

test('All 15 missions have three meaningful distinct story beats',()=>{
 assert.equal(Object.keys(HARBOR_BEAT_LABELS).length,15);
 for(const quest of HARBOR_QUESTS){
  const beat=[0,1,2].map(index=>harborBeat(quest.action,index));
  assert.equal(new Set(beat).size,3);
  for(const text of beat)assert.ok(text.length>=6);
  assert.throws(()=>harborBeat(quest.action,3),RangeError);
 }
});
test('Scaffold helps through listening and speech modeling before revealing text',()=>{
 for(const level of ['Pre-A1','A1','A2']){
  const mission=getHarborEpisodeSteps(1,level);
  for(const {step} of mission){
   const h1=harborCoachHint(step.reply,level,1);
   const h2=harborCoachHint(step.reply,level,2);
   const h3=harborCoachHint(step.reply,level,3);
   assert.equal(h1.action,'replay-question');
   assert.equal(h2.action,'model-answer');
   assert.equal(h3.action,'show-text');
   assert.ok(!h1.message.includes(step.reply));
   assert.ok(!h2.message.includes(step.reply));
   assert.ok(h3.message.includes(step.reply));
  }
 }
 assert.match(harborRetryMessage(1),/Bir daha/);
 assert.match(harborRetryMessage(2),/yardım/);
});
test('Stage shows authored 3-beat badge without stealing focus from TTS and options',()=>{
 const stage=read('../src/components/learning/harbor/HarborSceneStage.tsx');
 const styles=read('../src/components/learning/harbor/harbor-premium-scene.css');
 assert.match(stage,/harborBeat\(quest.action,questStep\)/);
 assert.match(stage,/className="hp-beat-label"/);
 assert.match(stage,/onSelect\(id\)/);
 assert.match(stage,/data-step=\{questStep\}/);
 assert.match(styles,/\.hp-beat-label/);
 assert.match(styles,/pointer-events:none/);
 assert.match(styles,/\.hp-scene \.hp-speech-card\{max-height:66%;overflow-y:auto/);
});
