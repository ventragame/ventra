import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=file=>fs.readFileSync(new URL('../src/components/learning/activities/'+file,import.meta.url),'utf8');
const frame=file=>fs.readFileSync(new URL('../src/components/learning/game/'+file,import.meta.url),'utf8');
test('All three games expose the same zone and five-stage nav through the shared game step rails',()=>{
 const cases=[
 ['FoodMarketAdventure.tsx','MARKET_AISLES','MARKET_STAGES'],
 ['FamilyVillageAdventure.tsx','VILLAGE_DISTRICTS','VILLAGE_STAGES'],
 ['TempleAdventure.tsx','TEMPLE_CHAMBERS','TEMPLE_STAGES']
 ];
 for(const [file,areas,stages] of cases){
  const code=read(file);
  assert.match(code,/<GardenQuestNavigator zoneLabel=/,file);
  assert.match(code,new RegExp('zones=\\{'+areas+'\\.map'),file);
  assert.match(code,new RegExp('stages=\\{'+stages+'\\.map'),file);
  // Locks and the current stage stay owned by the game, as before.
  assert.match(code,/state:[a-z]+(\.id)?===[a-z.]+\?'current':/,file);
  assert.match(code,/'locked'/,file);
  assert.match(code,/gg-quest-screen/,file);
  assert.match(code,/garden-quest-navigation\.css/,file);
  assert.match(code,/<GameTopBar island="garden" gameExit/,file);
  assert.match(code,/<GameResult island="garden"/,file);
 }
 const component=read('GardenQuestNavigator.tsx');
 assert.match(component,/<GameStepRail island="garden" className="gg-quest-zone-nav"/);
 assert.match(component,/<GameStepRail island="garden" className="gg-quest-stage-nav"/);
 assert.match(component,/'gg-quest-zone gg-game-control'/);
 assert.match(component,/'gg-quest-step gg-game-control'/);
 // The shared rail marks the current step and scrolls only itself sideways.
 const rail=frame('GameFrame.tsx');
 assert.match(rail,/'aria-current':step\.state==='current'\?'step'/);
 assert.match(rail,/rail\.scrollLeft=Math\.max\(0,left\)/);
});
test('Mobile navigation legibility lives in the shared frame; quest CSS keeps only prompt floors',()=>{
 const css=frame('game-frame.css');
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/overflow-x:auto/);
 assert.match(css,/\.gf-step\{[^}]*min-height:50px/);
 assert.match(css,/\.gf-step\{min-height:46px/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 const shared=read('garden-quest-navigation.css');
 assert.match(shared,/\.tp6-command small/);
 assert.doesNotMatch(shared,/gg-quest-location|gg-quest-counter/,'the top bar names the place and the progress');
 assert.doesNotMatch(shared,/\.nv5-|\.cg4-|\.am3-/);
});


test('Legacy island styles no longer hide stage names or force tiny stage fractions on mobile',()=>{
 const food=read('food-market-v4.css');
 const family=read('family-village-reference-v5.css');
 const temple=read('temple-v6.css');
 assert.doesNotMatch(food,/\.fm4-step-name\{display:none\}/);
 assert.doesNotMatch(family,/\.fv5-stepnav \.fv3-step-title\{display:none\}/);
 assert.doesNotMatch(temple,/\.tp6-trials \.tp-trial small:not\(\.tp6-trial-index\)\{display:none\}/);
 // Old per-game navigation chrome is gone, so it cannot override the shared rail.
 assert.doesNotMatch(food+family+temple,/\.fm4-stage-pill|\.fv5-stepnav|\.tp6-trials/);
});
