import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORLD_WIDTH,WORLD_HEIGHT,PLAYER_START,WALK_SPEED,INTERACTION_DISTANCE,DISTRICTS,
  ANIMAL_POSITIONS,getDistrictObjects,getAnimalObjects,getHabitatObjects,
  walkTowards,distanceBetween,clampToWorld
} from '../src/components/learning/world/worldLayout.ts';
import { ANIMAL_MEADOW_WORDS,planAnimalMission } from '../src/lib/learning/animalMissionEngine.ts';

test('P4 map retains six districts with only real content interactable',()=>{
  const locked=getDistrictObjects(false);
  assert.equal(locked.length,6);
  assert.equal(new Set(locked.map(x=>x.id)).size,6);
  assert.equal(locked.filter(x=>x.unlocked).length,1);
  assert.ok(locked.find(x=>x.id==='animals').unlocked);
  assert.ok(!locked.find(x=>x.id==='colors').unlocked);
  const unlocked=getDistrictObjects(true);
  assert.equal(unlocked.filter(x=>x.unlocked).length,2);
  assert.equal(unlocked.find(x=>x.id==='colors').unlocked,true);
  assert.deepEqual(DISTRICTS.map(x=>x.id),unlocked.map(x=>x.id));
});
test('Sayı Vadisi opens only after Renk Korusu and retains other district locks',()=>{
  const before=getDistrictObjects(true,false);
  const after=getDistrictObjects(true,true);
  assert.equal(before.find(x=>x.id==='numbers')?.unlocked,false);
  assert.equal(after.find(x=>x.id==='numbers')?.unlocked,true);
  assert.equal(after.filter(x=>x.unlocked).length,3);
  assert.equal(getDistrictObjects(false,true).find(x=>x.id==='numbers')?.unlocked,false);
  assert.equal(after.find(x=>x.id==='food')?.unlocked,false);
});
test('P4 navigation is bounded, deterministic and frame-rate independent',()=>{
  const from={x:400,y:470},to={x:1080,y:470};
  assert.deepEqual(walkTowards(from,to,100),{x:419.2,y:470},'delta capped to prevent tab-resume teleport');
  assert.deepEqual(walkTowards(from,to,80),{x:419.2,y:470});
  assert.equal(distanceBetween(from,from),0);
  assert.deepEqual(clampToWorld({x:-30,y:100000}),{x:76,y:WORLD_HEIGHT-76});
  assert.ok(WALK_SPEED>=180 && WALK_SPEED<=280);
  assert.ok(INTERACTION_DISTANCE>50);
  for(const position of Object.values(PLAYER_START)){
    assert.ok(position.x>=0&&position.x<=WORLD_WIDTH);
    assert.ok(position.y>=0&&position.y<=WORLD_HEIGHT);
  }
});
test('P4 all forty animal positions and habitats are unique and playable on a 1400x940 world',()=>{
  const ids=ANIMAL_MEADOW_WORDS.map(x=>x.id);
  const animals=getAnimalObjects(ids,id=>ANIMAL_MEADOW_WORDS.find(x=>x.id===id)?.image);
  const homes=getHabitatObjects(ids,id=>ANIMAL_MEADOW_WORDS.find(x=>x.id===id)?.habitat??id);
  assert.equal(animals.length,40);
  assert.equal(homes.length,40);
  assert.equal(new Set(animals.map(x=>x.x+':'+x.y)).size,40);
  assert.equal(new Set(homes.map(x=>x.x+':'+x.y)).size,40,
    'cow/horse and duck/fish habitats must not overlap');
  for(const target of [...animals,...homes]){
    assert.ok(target.x>=80&&target.x<WORLD_WIDTH-40);
    assert.ok(target.y>=80&&target.y<WORLD_HEIGHT-40);
  }
  assert.ok(animals.every(x=>x.image?.endsWith('.png')));
  assert.ok(homes.every(x=>x.kind==='habitat'&&x.label));
  assert.equal(Object.keys(ANIMAL_POSITIONS).length,40);
});
test('P4 mission IDs still match existing persisted P3 five-stage contract',()=>{
  const intro=planAnimalMission({mission:1,history:[],seed:4});
  assert.equal(intro.animals.length,8);
  const mission=planAnimalMission({
    mission:5,
    history:intro.animals.map(id=>({wordId:id,kind:'discovery',mistakes:0,
      firstTryCorrect:false,timestamp:'2026-11-01T12:00:00.000Z'})),
    seed:9,now:'2026-11-01T12:30:00.000Z'
  });
  assert.equal(mission.questions.length,6);
  assert.equal(getAnimalObjects(mission.questions[0].choices,()=>undefined).length,3);
  assert.equal(getHabitatObjects(mission.questions[0].choices,id=>id).length,3);
});

test('G1 Lezzet Pazarı can open independently from other worlds; future regions stay locked',()=>{
 const separate=getDistrictObjects(false,false,true);
 assert.equal(separate.find(x=>x.id==='food')?.unlocked,true);
 assert.equal(separate.find(x=>x.id==='colors')?.unlocked,false);
 assert.equal(separate.find(x=>x.id==='numbers')?.unlocked,false);
 assert.equal(separate.find(x=>x.id==='family')?.unlocked,false);
 assert.equal(separate.find(x=>x.id==='sanctuary')?.unlocked,false);
 assert.equal(getDistrictObjects(true,true,true).find(x=>x.id==='food')?.unlocked,true);
});

import fs from 'node:fs';
import {
 GARDEN_THEMES,GARDEN_ORDER,districtStatus,districtStatusLabel,districtPercent,mapProgress,
 decorateWorldObjects
} from '../src/components/learning/world/gardenTheme.ts';

test('M1 six authored landmarks and status metadata remain linked to all existing game IDs',()=>{
 assert.deepEqual([...GARDEN_ORDER],['animals','colors','numbers','food','family','sanctuary']);
 assert.equal(Object.keys(GARDEN_THEMES).length,6);
 assert.equal(new Set(Object.keys(GARDEN_THEMES).map(x=>GARDEN_THEMES[x].art)).size,6);
 const objects=getDistrictObjects(true,true,true,true,true);
 assert.equal(objects.length,6);
 for(const id of GARDEN_ORDER){
   const world=objects.find(x=>x.id===id);
   assert.ok(world?.unlocked);
   assert.ok(GARDEN_THEMES[id].name&&GARDEN_THEMES[id].accent&&GARDEN_THEMES[id].words);
 }
});
test('M1 map milestones derive from real child data without invented stars and clamp invalid totals',()=>{
 const progress=GARDEN_ORDER.map((id,i)=>({
   id,completed:i,stars:i*3,total:5,unlocked:true,available:true
 }));
 assert.deepEqual(mapProgress(progress),{done:15,total:30,stars:45,percent:50,finished:1});
 assert.equal(districtPercent(5,5),100);
 assert.equal(districtPercent(-1,5),0);
 assert.equal(districtPercent(25,5),100);
 assert.equal(districtPercent(1,0),0);
 const decorated=decorateWorldObjects(getDistrictObjects(true,true,true,true,true),progress);
 assert.equal(decorated[0].stars,0);
 assert.equal(decorated[5].completed,5);
 assert.equal(decorated[5].total,5);
 assert.deepEqual(getDistrictObjects(true,true,true,true,true)[0].completed,undefined,
  'world layout contract must not be mutated by map view state');
});
test('M1 ready, continue, completed, loading, gated and failure states remain distinct',()=>{
 const entry={id:'food',completed:0,total:15,stars:0,unlocked:true,available:true};
 const expected=[
  ['ready',entry],['continue',{...entry,completed:4}],['complete',{...entry,completed:15}],
  ['loading',{...entry,available:false}],['locked',{...entry,unlocked:false}],
  ['error',{...entry,error:true}]
 ];
 for(const [status,data] of expected){
   assert.equal(districtStatus(data),status);
   assert.ok(districtStatusLabel(status).length>3);
 }
 assert.equal(districtStatus({...entry,completed:15,unlocked:false}),'locked');
 assert.equal(districtStatus({...entry,completed:0,available:false,error:true}),'error');
});
test('M1 premium Phaser world fits six landmarks on desktop and still follows explorer on mobile',()=>{
 const scene=fs.readFileSync(new URL('../src/components/learning/world/ExplorerScene.ts',import.meta.url),'utf8');
 const theme=fs.readFileSync(new URL('../src/components/learning/world/GardenWorldArt.ts',import.meta.url),'utf8');
 assert.match(scene,/const overview=w>=750&&height>=430/);
 assert.match(scene,/Math\.max\(w\/WORLD_WIDTH,height\/WORLD_HEIGHT\)/);
 assert.match(scene,/this\.cameras\.main\.stopFollow\(\)/);
 assert.match(scene,/this\.cameras\.main\.startFollow\(this\.player/);
 assert.match(scene,/paintGardenWorld\(this\)/);
 assert.match(scene,/garden_district_'/);
 assert.match(scene,/drawGardenRoads/);
 assert.match(theme,/object\.id==='sanctuary'/);
 assert.match(theme,/object\.id==='animals'/);
 assert.match(theme,/object\.id==='family'/);
});
test('M1 illustrated district cards and passport/guidance controls open real actions',()=>{
 const map=fs.readFileSync(new URL('../src/components/learning/WordGardenDistrictMap.tsx',import.meta.url),'utf8');
 const modal=fs.readFileSync(new URL('../src/components/learning/LearningPathModal.tsx',import.meta.url),'utf8');
 const kids=fs.readFileSync(new URL('../src/app/kids/page.tsx',import.meta.url),'utf8');
 const cards=fs.readFileSync(new URL('../src/components/learning/DistrictPreviewArt.tsx',import.meta.url),'utf8');
 assert.match(map,/DistrictPreviewArt id=\{id\}/);
 assert.match(map,/role="dialog"/);
 assert.match(map,/onClick=\{onOpenPassport\}/);
 assert.match(map,/aria-label=/);
 assert.match(map,/onClick=\{\(\)=>setMapTips\(x=>!x\)\}/);
 assert.match(modal,/starsByDistrict=\{\{/);
 assert.match(kids,/onOpenPassport=\{\(\)=>\{handleCloseLearningPath\(\);setIsPassportOpen\(true\);\}\}/);
 for(const id of GARDEN_ORDER)assert.match(cards,new RegExp("id==='"+id+"'"));
});
