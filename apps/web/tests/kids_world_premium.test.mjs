import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const page=fs.readFileSync(new URL('../src/app/kids/page.tsx',import.meta.url),'utf8');
const scene=fs.readFileSync(new URL('../src/components/game/scenes/WorldScene.ts',import.meta.url),'utf8');
const phaser=fs.readFileSync(new URL('../src/components/game/PhaserGame.tsx',import.meta.url),'utf8');
const style=fs.readFileSync(new URL('../src/app/kids/kids-world-premium.css',import.meta.url),'utf8');
test('Archipelago keeps both existing maps, all six world destinations and functional world selection',()=>{
 assert.match(page,/DynamicPhaserGame/);
 assert.match(page,/LearningPathModal/);
 assert.match(page,/ARCHIPELAGO_ISLANDS_ORDERED\.map/);
 assert.match(page,/handleFocusIsland\(island.id\)/);
 assert.match(page,/handleOpenLearningPath\(focusedIsland==='story_castle'\?'story_castle':'word_garden'\)/);
 assert.match(page,/isWorldLocked/);
 assert.match(page,/setIsParentGateOpen\(true\)/);
 assert.doesNotMatch(page,/6 Ada \(V2\)/);
});
test('Cinematic sky can show through Phaser transparent canvas and has reduced-motion support',()=>{
 assert.match(page,/kids-world-atmosphere/);
 assert.match(page,/kids-world-premium\.css/);
 assert.match(phaser,/transparent: true/);
 assert.match(phaser,/background: 'transparent'/);
 assert.match(scene,/createSkyDetails\(\)/);
 assert.match(scene,/isReducedMotion\(\)/);
 assert.match(style,/@media\(prefers-reduced-motion:reduce\)/);
});
test('Islands have readable labels with clickable nameplates, distinct pending states and capped camera',()=>{
 assert.match(scene,/fontSize: '21px'/);
 assert.match(scene,/fontSize: '15px'/);
 assert.match(scene,/badgeHit\.on\('pointerup'/);
 assert.match(scene,/GÖREV/);
 assert.match(scene,/YAKINDA/);
 assert.match(scene,/this\.cameras\.main\.zoomTo/);
 assert.match(scene,/this\.fitCameraToViewport/);
 assert.doesNotMatch(scene,/updateIslandProgress\('word_garden', 5, 5\)/);
});
test('Touch-screen dock and island panel retain accessible semantics with no fabricated progression',()=>{
 assert.match(page,/aria-pressed=\{selected\}/);
 assert.match(page,/role="progressbar"/);
 assert.match(page,/gardenOverall\.completed/);
 assert.match(page,/onOpenLearningPath/);
 assert.match(style, /@media\(max-width:640px\)/);
 assert.match(style,/safe-area-inset-bottom/);
 assert.match(style,/min-height:5[012]px/);
 assert.doesNotMatch(page,/Seviye Haritasını Aç/);
});

test('R2 island nameplates have explicit anchors instead of overlapping the next artwork',async()=>{
 const {ARCHIPELAGO_DESKTOP_BADGES,archipelagoBadgeAnchor,archipelagoOpticalShiftPixels}=
   await import('../src/lib/game/archipelagoPresentation.ts');
 const {ARCHIPELAGO_ISLANDS_ORDERED}=await import('../../../packages/shared/src/archipelago.ts');
 assert.equal(Object.keys(ARCHIPELAGO_DESKTOP_BADGES).length,6);
 const positions=ARCHIPELAGO_ISLANDS_ORDERED;
 // Screen-space affine camera transforms retain relative intersections.
 const boxes=positions.map(isl=>{
   const anchor=archipelagoBadgeAnchor(isl.id,false);
   return {id:isl.id,x:isl.defaultWorldPos.x+anchor.x,y:isl.defaultWorldPos.y+anchor.y};
 });
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
   const a=boxes[i],b=boxes[j];
   assert.ok(Math.abs(a.x-b.x)>=254||Math.abs(a.y-b.y)>=94,
     'island plaques must not overlap: '+a.id+' vs '+b.id);
 }
 assert.deepEqual(archipelagoBadgeAnchor('word_garden',true),{x:0,y:223});
 assert.equal(archipelagoOpticalShiftPixels(390),0);
 assert.equal(archipelagoOpticalShiftPixels(960),0);
 assert.ok(archipelagoOpticalShiftPixels(1773)>=80);
 assert.ok(archipelagoOpticalShiftPixels(1440)<archipelagoOpticalShiftPixels(1773));
 assert.ok(archipelagoOpticalShiftPixels(3440)<=86);
});
test('R2 independent islands use responsive labels, revised plaques and subtle fairy-dust routes',()=>{
 const map=fs.readFileSync(new URL('../src/lib/game/archipelagoPresentation.ts',import.meta.url),'utf8');
 assert.match(scene,/archipelagoBadgeAnchor\(def.id/);
 assert.match(scene,/archipelagoBadgeAnchor\(id,portrait\)/);
 assert.match(scene,/archipelagoOpticalShiftPixels\(width\)\/fitZoom/);
 assert.match(scene,/const badgeContainer = this.add.container\(badgeAnchor.x,badgeAnchor.y\)/);
 assert.match(scene,/fillRoundedRect\(-127,-43,254,94/);
 assert.match(scene,/this.add.rectangle\(pos.x,pos.y/);
 assert.match(scene,/this.tweens.addCounter/);
 assert.match(scene,/this.isReducedMotion\(\)/);
 assert.match(map,/sentence_workshop/);
 assert.match(style,/kids-world-dock/);
 assert.match(style,/min-height:48px/);
});
