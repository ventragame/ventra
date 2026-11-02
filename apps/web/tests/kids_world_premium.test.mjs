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
 assert.match(page,/handleOpenLearningPath\('word_garden'\)/);
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
