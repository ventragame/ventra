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
  assert.ok(animals.every(x=>x.image?.endsWith('.svg')));
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
