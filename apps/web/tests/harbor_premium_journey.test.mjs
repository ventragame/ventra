import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {HARBOR_SCENE_ASSETS} from '../src/lib/learning/harborSceneAssets.ts';
import {
 HARBOR_QUESTS,HARBOR_TOTAL_MISSIONS,HARBOR_STEPS_PER_EPISODE,
 getHarborEpisodeQuests,getHarborEpisodeSteps,
 getHarborQuestSteps,harborChoiceOrder,parseHarborStep,harborSceneEvent
} from '../src/lib/learning/harborMissionEngine.ts';
const game=(name)=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const levels=['Pre-A1','A1','A2'];

test('All fifteen authored mission scenes exist and have separate pedagogical tasks',()=>{
 assert.equal(HARBOR_TOTAL_MISSIONS,15);
 assert.equal(HARBOR_QUESTS.length,15);
 assert.equal(new Set(HARBOR_QUESTS.map(q=>q.id)).size,15);
 assert.equal(new Set(HARBOR_QUESTS.map(q=>q.action)).size,15);
 const places=new Set(HARBOR_QUESTS.map(q=>q.place));
 assert.deepEqual([...places].sort(),['dock','festival','lighthouse','market','sea']);
 for(let episode=1;episode<=5;episode++){
  const missions=getHarborEpisodeQuests(episode);
  assert.equal(missions.length,3,'Every episode must have 3 story missions');
  for(const level of levels){
   const script=getHarborEpisodeSteps(episode,level);
   assert.equal(script.length,HARBOR_STEPS_PER_EPISODE);
   assert.equal(script.length,9);
   assert.equal(new Set(script.map(x=>x.quest.id)).size,3);
   assert.deepEqual(script.map(x=>x.index),[0,1,2,3,4,5,6,7,8]);
   assert.deepEqual(script.map(x=>x.questStep),[0,1,2,0,1,2,0,1,2]);
  }
 }
});

test('135 level-aware English prompts have unique, answerable, plausible choices',()=>{
 const eachLevel=new Set();
 for(const q of HARBOR_QUESTS){
  assert.ok(q.title.length>=6&&q.mission.length>=12);
  for(const level of levels){
   const tasks=getHarborQuestSteps(q,level);
   assert.equal(tasks.length,3,q.id+' '+level);
   for(const step of tasks){
    assert.ok(step.line.length>=5&&step.reply.length>=2);
    assert.equal(step.choices.length,3);
    assert.equal(new Set(step.choices.map(x=>x.toLowerCase())).size,3);
    assert.equal(step.choices[0],step.reply);
    assert.deepEqual(step.accept,[step.reply]);
    assert.ok(!eachLevel.has(level+q.id+step.line),'Duplicated mission prompt');
    eachLevel.add(level+q.id+step.line);
   }
  }
  assert.notDeepEqual(q.pre,q.a1);
  assert.notDeepEqual(q.a1,q.a2);
 }
 assert.equal(eachLevel.size,135);
});

test('Beginner sees only two large options; replay changes positions without changing correct text',()=>{
 const step=getHarborQuestSteps(HARBOR_QUESTS[0],'Pre-A1')[0];
 assert.equal(harborChoiceOrder(step,'Pre-A1',0,0).length,2);
 assert.equal(harborChoiceOrder(step,'A1',0,0).length,3);
 assert.deepEqual(new Set(harborChoiceOrder(step,'Pre-A1',0,0)),new Set(step.choices.slice(0,2)));
 assert.notDeepEqual(harborChoiceOrder(step,'Pre-A1',0,0),harborChoiceOrder(step,'Pre-A1',0,1));
 assert.equal(step.reply,step.accept[0]);
 assert.equal(parseHarborStep('Hello!|Hi!|Bye!|Good night!').reply,'Hi!');
 assert.throws(()=>parseHarborStep('Hello!|Hi!|Hi!|No!'),/Duplicated/);
 assert.throws(()=>parseHarborStep('Hello!|Hi!|Bye!'),/Invalid/);
});

test('Each distinct mechanic contains three deterministic in-scene reactions',()=>{
 for(const quest of HARBOR_QUESTS){
  const values=[0,1,2].map(i=>harborSceneEvent(quest.action,i));
  assert.equal(values.length,3);
  assert.equal(new Set(values).size,3,quest.action);
 }
});

test('Scene is layered and uses real existing artwork, with separate mobile composition',()=>{
 const ui=game('../src/components/learning/harbor/HarborSpeechAdventure.tsx');
 const stage=game('../src/components/learning/harbor/HarborSceneStage.tsx');
 const css=game('../src/components/learning/harbor/harbor-premium-scene.css');
 const publicRoot=new URL('../public/',import.meta.url);
 const artwork=[
  'assets/kids-islands/speaking_harbor.webp',
  'assets/kids-islands/speaking_harbor_mobile.webp',
  'assets/story-forest/premium/objects/apple.webp',
  'assets/story-forest/premium/clues/lantern.webp',
  'assets/story-forest/premium/characters/rabbit_adventurer.webp',
  'assets/story-forest/premium/objects/gold_key.webp',
  'assets/animals/fluent-3d/parrot.png',
  'assets/animals/fluent-3d/turtle.png'
 ];
 for(const asset of artwork){
  const abs=new URL(asset,publicRoot);
  assert.ok(fs.existsSync(abs),'Missing actual game asset '+asset);
  assert.ok(fs.statSync(abs).size>1000,'Placeholder asset detected: '+asset);
 }
 assert.match(stage,/HarborCaptain/);
 assert.match(stage,/hp-scenery/);
 assert.match(stage,/onSelect\(id\)/);
 assert.match(stage,/HARBOR_SCENE_ASSETS/);
 assert.match(stage,/srcSet=\{sceneArt.mobile\}/);
 assert.match(stage,/src=\{sceneArt.desktop\}/);
 assert.match(ui,/HarborSceneStage/);
 assert.match(ui,/setSceneSelected\(true\)/);
 assert.match(ui,/setSceneResolved\(true\)/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/hp-actor\[data-actor="leo"\]/);
 assert.doesNotMatch(stage,/🧑‍✈️/);
});

test('Speech remains optional and 5 existing level IDs stay stable for saved coins',()=>{
 const ui=game('../src/components/learning/harbor/HarborSpeechAdventure.tsx');
 const economy=game('../src/lib/rewards/economyEngine.ts');
 assert.match(ui,/HARBOR_GAME_ID/);
 assert.match(ui,/levelId:episode/);
 assert.match(ui,/recordGameCompleted\(payload,profileId\)/);
 assert.match(ui,/canAnswer/);
 assert.match(ui,/harborChoiceOrder/);
 assert.match(ui,/listenToChild/);
 assert.match(ui,/onClick=\{\(\)=>tap\(option\)\}/);
 assert.match(economy,/id:'island_speaking_harbor_dialogue',label:'Diyalog Limanı',count:5/);
});

test('Speech success persists the final recognized response and save retry stays idempotent',()=>{
 const ui=game('../src/components/learning/harbor/HarborSpeechAdventure.tsx');
 assert.match(ui,/const correct=\(recognizedCount=voiceRecognized\)=>/);
 assert.match(ui,/const recognizedCount=voiceRecognized\+1;/);
 assert.match(ui,/correct\(recognizedCount\);/);
 assert.match(ui,/Math\.min\(question\+1,script\.length-1\),mistakes,hints,recognizedCount/);
 assert.match(ui,/save\(mistakes,hints,recognizedCount\)/);
 assert.match(ui,/const sessionId=completionSessionId\.current\?\?crypto\.randomUUID\(\)/);
 assert.match(ui,/completionSessionId\.current=sessionId/);
 assert.match(ui,/completionSessionId\.current=null/);
});

test('Speech button only starts actual word recognition and profile level stays isolated',()=>{
 const ui=game('../src/components/learning/harbor/HarborSpeechAdventure.tsx');
 assert.match(ui,/speechAvailable=\['web-local','web-browser','native-local'\]/);
 assert.match(ui,/!speechAvailable/);
 assert.match(ui,/Konuşarak Cevapla/);
 assert.doesNotMatch(ui,/Sesli Pratik Yap|ParentalGateModal/);
 assert.match(ui,/\},\[profileId,englishLevel\]\);/);
});

test('Five unique 3D WebP worlds include responsive mobile scenes with valid bitstreams',()=>{
 const places=['dock','market','sea','lighthouse','festival'];
 assert.deepEqual(Object.keys(HARBOR_SCENE_ASSETS),places);
 const publicRoot=new URL('../public/',import.meta.url);
 const all=new Set();
 const dims=(buf)=>{
  assert.equal(buf.subarray(0,4).toString(),'RIFF');
  assert.equal(buf.subarray(8,12).toString(),'WEBP');
  assert.equal(buf.subarray(12,16).toString(),'VP8 ');
  return {w:buf.readUInt16LE(26)&0x3fff,h:buf.readUInt16LE(28)&0x3fff};
 };
 for(const place of places){
  const pair=HARBOR_SCENE_ASSETS[place];
  for(const [device,uri] of Object.entries(pair)){
   assert.ok(uri.startsWith('/assets/harbor-scenes/')&&uri.endsWith('.webp'));
   assert.ok(!all.has(uri),'Scenes must not reuse the same WebP: '+uri);
   all.add(uri);
   const file=new URL(uri.slice(1),publicRoot);
   assert.ok(fs.existsSync(file),'Missing '+place+' '+device+' scene');
   const fileBytes=fs.readFileSync(file);
   assert.ok(fileBytes.byteLength>=8000&&fileBytes.byteLength<150000,
    'Small placeholders or oversized assets are not permitted: '+uri);
   const {w,h}=dims(fileBytes);
   if(device==='desktop'){assert.ok(w>=900&&h>=500,uri);}
   else {assert.ok(w>=600&&h>=700,uri);}
  }
 }
 assert.equal(all.size,10);
 const ui=game('../src/components/learning/harbor/HarborSpeechAdventure.tsx');
 const stage=game('../src/components/learning/harbor/HarborSceneStage.tsx');
 assert.match(ui,/HARBOR_SCENE_ASSETS\[getHarborEpisodeQuests\(item.id\)\[0\]\.place\]\.desktop/);
 assert.match(stage,/sceneArt\.mobile/);
 assert.match(stage,/sceneArt\.desktop/);
});
