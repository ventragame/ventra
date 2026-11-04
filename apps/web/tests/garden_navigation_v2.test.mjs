import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DISTRICTS,PLAYER_START} from '../src/components/learning/world/worldLayout.ts';
import {GARDEN_ROAD_NODES,GARDEN_ROAD_EDGES,GARDEN_DESTINATION_NODES,
 closestRoadPoint,isGardenWalkable,planGardenRoute,planGardenTapRoute} from '../src/components/learning/world/GardenNavigation.ts';

test('All six locations are connected to a deterministic playable road graph',()=>{
 assert.equal(GARDEN_ROAD_EDGES.length,8);
 assert.equal(Object.keys(GARDEN_DESTINATION_NODES).length,6);
 for(const district of DISTRICTS){
  const path=planGardenRoute(PLAYER_START.garden,district.id,district);
  assert.ok(path.length>0,'no path to '+district.id);
  const last=path.at(-1);
  assert.deepEqual(last,{x:district.x,y:district.y+76});
  assert.ok(path.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  assert.ok(path.length<12,'route should not visit arbitrary scenic points');
 }
});
test('Tap and controls project onto paths, never walk through ponds or out of bounds',()=>{
 assert.equal(isGardenWalkable({x:-20,y:350}),false);
 assert.equal(isGardenWalkable(GARDEN_ROAD_NODES.center),true);
 assert.ok(closestRoadPoint({x:1300,y:120}).distance>100);
 const tap=planGardenTapRoute(PLAYER_START.garden,{x:1200,y:70});
 assert.ok(tap.length>0);
 assert.ok(closestRoadPoint(tap.at(-1)).distance<1);
 assert.deepEqual(planGardenTapRoute(PLAYER_START.garden,GARDEN_ROAD_NODES.center),[]);
});
test('The map scene routes touch travel, keeps callbacks and honors reduced motion',()=>{
 const scene=fs.readFileSync(new URL('../src/components/learning/world/ExplorerScene.ts',import.meta.url),'utf8');
 const canvas=fs.readFileSync(new URL('../src/components/learning/world/ExplorerCanvas.tsx',import.meta.url),'utf8');
 assert.match(scene,/planGardenRoute/);
 assert.match(scene,/planGardenTapRoute/);
 assert.match(scene,/isGardenWalkable/);
 assert.match(scene,/pendingTarget/);
 assert.match(scene,/onInteract\(object\)/);
 assert.match(scene,/onInspect\(object\)/);
 assert.match(scene,/this\.reducedMotion/);
 assert.match(canvas,/aria-label="Yön kontrolleri"/);
 assert.match(canvas,/aria-pressed=\{ambienceOn\}/);
});
