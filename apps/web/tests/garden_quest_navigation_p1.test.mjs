import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=file=>fs.readFileSync(new URL('../src/components/learning/activities/'+file,import.meta.url),'utf8');
test('All three games expose the same current area, five-stage nav and original task logic',()=>{
 const cases=[
 ['FoodMarketAdventure.tsx','MARKET_AISLES','MARKET_STAGES'],
 ['FamilyVillageAdventure.tsx','VILLAGE_DISTRICTS','VILLAGE_STAGES'],
 ['TempleAdventure.tsx','TEMPLE_CHAMBERS','TEMPLE_STAGES']
 ];
 for(const [file,areas,stages] of cases){
  const code=read(file);
  assert.match(code,/GardenQuestNavigator areaTitle=/);
  assert.match(code,/gg-quest-screen/);
  assert.match(code,/gg-quest-zone-nav/);
  assert.match(code,/gg-quest-stage-nav/);
  assert.match(code,/gg-quest-step/);
  assert.match(code,/aria-current=.*step/);
  assert.match(code,new RegExp(areas+'\\.map'));
  assert.match(code,new RegExp(stages+'\\.map'));
  assert.match(code,/garden-quest-navigation\.css/);
 }
 const component=read('GardenQuestNavigator.tsx');
 assert.match(component,/aria-live="polite"/);
 assert.match(component,/scrollLeft\+=offset/);
 assert.match(component,/\[aria-current="step"\]/);
});
test('Mobile navigation raises legibility while preserving each worlds art selectors',()=>{
 const css=read('garden-quest-navigation.css');
 assert.match(css,/@media\(max-width:767px\)/);
 assert.match(css,/overflow-x:auto/);
 assert.match(css,/scroll-snap-type:x proximity/);
 assert.match(css,/min-height:44px/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/\.fv3-step-title/);
 assert.match(css,/\.fm4-step-name/);
 assert.match(css,/\.tp6-command small/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(css,/\.nv5-|\.cg4-|\.am3-/);
});


test('Legacy island styles no longer hide stage names or force tiny stage fractions on mobile',()=>{
 const food=read('food-market-v4.css');
 const family=read('family-village-reference-v5.css');
 const temple=read('temple-v6.css');
 const shared=read('garden-quest-navigation.css');
 assert.doesNotMatch(food,/\.fm4-step-name\{display:none\}/);
 assert.doesNotMatch(family,/\.fv5-stepnav \.fv3-step-title\{display:none\}/);
 assert.doesNotMatch(temple,/\.tp6-trials \.tp-trial small:not\(\.tp6-trial-index\)\{display:none\}/);
 assert.match(shared,/\.gg-quest-screen \.gg-quest-navigation \.gg-quest-step \.tp6-trial-index\{display:none\}/);
 assert.match(shared,/\.gg-quest-screen \.gg-quest-navigation \.gg-quest-step small:not\(\.fv3-step-index\):not\(\.tp6-trial-index\)/);
});
