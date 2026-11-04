import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DISTRICTS,PLAYER_START} from '../src/components/learning/world/worldLayout.ts';
import {GARDEN_ROAD_NODES,GARDEN_ROAD_EDGES,GARDEN_DESTINATION_NODES,
 closestRoadPoint,isGardenWalkable,planGardenRoute,planGardenTapRoute} from '../src/components/learning/world/GardenNavigation.ts';

test('All six locations are connected to a deterministic playable road graph',()=>{
 assert.equal(GARDEN_ROAD_EDGES.length,15);
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
 assert.ok(isGardenWalkable({x:505,y:280}));
 assert.equal(isGardenWalkable({x:1260,y:100}),false);
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
 assert.match(scene,/this.reducedMotion/);
 assert.match(scene,/garden_ground_v3/);
 assert.match(scene,/this.leftBoot.setAngle/);
 assert.match(scene,/const fit=Math.max/);
 assert.doesNotMatch(scene,/fillEllipse\(-104,55,208,65/);
 assert.match(canvas,/aria-label="Yön kontrolleri"/);
 assert.match(canvas,/aria-pressed=\{ambienceOn\}/);
});


test('Cohesive V3 world artwork, rigged motion, and walkable meadow corridor stay in sync',()=>{
 const art=fs.readFileSync(new URL('../src/components/learning/world/GardenWorldArt.ts',import.meta.url),'utf8');
 const scene=fs.readFileSync(new URL('../src/components/learning/world/ExplorerScene.ts',import.meta.url),'utf8');
 const base=new URL('../public/assets/word-garden/premium-v3/',import.meta.url);
 for(const file of ['garden-ground.webp','foreground.webp']){
  const bytes=fs.readFileSync(new URL(file,base));
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.ok(bytes.length>15000);
 }
 const landmark=art.slice(art.indexOf('export function createGardenLandmark('),art.indexOf('export function addGardenAmbient('));
 assert.doesNotMatch(landmark,/fillEllipse|drawGardenPortal|image\('/);
 assert.match(scene,/garden_ground_v3/);
 assert.doesNotMatch(scene,/garden_ground_v2/);
 assert.match(scene,/Math\.max\(w\/WORLD_WIDTH,height\/WORLD_HEIGHT\)/);
 assert.match(scene,/fit\*1\.12/);
 assert.match(scene,/this\.leftBoot\.setAngle\(swing\)/);
 assert.match(scene,/this\.rightBoot\.setAngle\(-swing\)/);
 for(const file of ['left-leg','right-leg']){
  const svg=fs.readFileSync(new URL('../public/assets/kids/explorer-avatar-'+file+'.svg',import.meta.url),'utf8');
  assert.match(svg,/<clipPath id="avatar-half">/);
  assert.match(svg,/<svg /);
 }
 const torso=fs.readFileSync(new URL('../public/assets/kids/explorer-avatar-torso.svg',import.meta.url),'utf8');
 assert.doesNotMatch(torso,/M92 220|M78 273/);
 const route=planGardenRoute(PLAYER_START.garden,'animals',DISTRICTS.find(x=>x.id==='animals'));
 assert.ok(route.some(p=>p.x===466&&p.y===486),'meadow path must traverse the painted farm trail');
});
