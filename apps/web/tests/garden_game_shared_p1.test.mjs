import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=file=>fs.readFileSync(new URL('../src/components/learning/activities/'+file,import.meta.url),'utf8');
test('Garden games opt into shared control and scene mechanics, preserving their separate engines',()=>{
 for(const file of ['AnimalMeadowAdventure.tsx','ColorGroveAdventure.tsx','NumberValleyAdventure.tsx']){
  const code=read(file);
  assert.match(code,/import '\.\/garden-game-foundation\.css';/);
  assert.match(code,/gg-game-shell/);
  assert.match(code,/gg-game-control/);
  assert.match(code,/role="dialog" aria-modal="true"/);
 }
 for(const file of ['MeadowPlayStage.tsx','ColorGroveScene.tsx','MobileColorGroveWorld.tsx','NumberValleyAdventure.tsx']){
  assert.match(read(file),/gg-game-scene/);
 }
 const css=read('garden-game-foundation.css');
 assert.match(css,/min-height:var\(--gg-touch-target\)/);
 assert.match(css,/touch-action:manipulation/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/overscroll-behavior-y:contain/);
 assert.doesNotMatch(css,/\.nv-|\.cg-|\.am-/);
});


test('Number Valley V5 uses canonical selectors without legacy reading-layout overrides',()=>{
 const base=read('number-valley.css'),v5=read('number-valley-v5.css');
 assert.doesNotMatch(base,/main>div\.py-6/);
 assert.doesNotMatch(v5,/deliberately outrank|main>\.nv5-intro/);
 assert.match(v5,/\.nv5-root \.nv5-intro\{padding:14px 8px 12px\}/);
 assert.match(v5,/\.nv5-root \.nv5-title\{margin-top:5px/);
 assert.match(v5,/\.nv5-root \.nv5-word-forge \.nv-forge-number\{/);
 assert.match(v5,/\.nv5-root \.nv5-finale-stage \.nv5-scene-art>img/);
 assert.match(v5,/@media\(max-width:767px\)/);
 assert.match(v5,/@media\(max-width:359px\)/);
 assert.match(v5,/prefers-reduced-motion:reduce/);
 assert.match(base,/\.nv-forge-slot/);
 assert.match(v5,/\.nv5-crystal-tile/);
 assert.match(v5,/\.nv5-answer/);
});


test('Shared touch token is added to choice buttons, not to palette grid containers',()=>{
 const world=read('MobileColorGroveWorld.tsx');
 assert.match(world,/className="cg4-choice-grid"/);
 assert.match(world,/cg4-choice gg-game-control vg-answer-card/);
 assert.doesNotMatch(world,/gg-game-control-grid/);
});

test('Garden games share a child legibility floor: 44px exits/help/sound and readable instructions',()=>{
 const css=fs.readFileSync(new URL('../src/components/learning/activities/garden-child-legibility.css',import.meta.url),'utf8');
 assert.match(css,/:is\(\.am-hud-btn,\.fm-back,\.fv-back,\.tp-return,\.tp-mute\)\{\s*min-width:44px!important;min-height:44px!important;/);
 assert.match(css,/\.wg-game-help>summary\{\s*min-width:44px!important;min-height:44px!important;/);
 assert.match(css,/font-size:max\(13px,1em\)!important/);
 for(const game of ['AnimalMeadowAdventure','FoodMarketAdventure','FamilyVillageAdventure','TempleAdventure']){
  const ui=fs.readFileSync(new URL('../src/components/learning/activities/'+game+'.tsx',import.meta.url),'utf8');
  const imports=[...ui.matchAll(/^import '\.\/([^']+\.css)';/gm)].map(m=>m[1]);
  assert.equal(imports.at(-1),'garden-child-legibility.css',game+' imports the floor last');
 }
});
