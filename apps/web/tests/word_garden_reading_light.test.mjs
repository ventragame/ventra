import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {getDistrictObjects} from '../src/components/learning/world/worldLayout.ts';
import {GARDEN_ORDER,districtStatus} from '../src/components/learning/world/gardenTheme.ts';

const component=(name)=>fs.readFileSync(new URL('../src/components/learning/'+name,import.meta.url),'utf8');
const activity=(name)=>fs.readFileSync(new URL('../src/components/learning/activities/'+name,import.meta.url),'utf8');

test('Reading-light web hub keeps six visual destinations and real progression locks',()=>{
 const view=component('WordGardenDistrictMap.tsx');
 const css=component('word-garden-premium.css');
 assert.match(view,/DistrictPreviewArt id=\{id\}/);
 assert.match(view,/GARDEN_ORDER\.map/);
 assert.match(view,/getDistrictObjects\(/);
 assert.match(view,/districtStatus\(p\)/);
 assert.match(view,/disabled=\{!playable\}/);
 assert.match(view,/onInteract=\{enter\}/);
 assert.match(view,/onInspect=\{obj=>enter\(obj\)\}/);
 assert.match(view,/aria-label=\{\x60\$\{theme.name\}/);
 assert.match(view,/role="progressbar"/);
 assert.doesNotMatch(view,/className="wg-card-subtitle"|className="wg-card-words"/);
 assert.doesNotMatch(view,/SIX WORLDS\. ONE ENGLISH ADVENTURE|EXPLORE YOUR WORLDS/);
 assert.match(css,/\.wg-world-grid\{display:grid/);
 assert.match(css,/\.wg-card-artwork/);
 assert.match(css,/@media\(max-width:900px\)/);
 assert.match(css,/@media\(max-width:630px\)/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.equal(GARDEN_ORDER.length,6);
 const locked=getDistrictObjects(false,false,false,false,false);
 assert.equal(locked.filter(o=>o.unlocked).length,1);
 for(const progress of [
  {id:'colors',completed:0,total:3,stars:0,unlocked:false,available:true},
  {id:'colors',completed:0,total:3,stars:0,unlocked:true,available:true}
 ])assert.equal(districtStatus(progress),progress.unlocked?'ready':'locked');
});

test('Parents can expand game instructions but children can play immediately',()=>{
 const map=component('WordGardenDistrictMap.tsx');
 const help=component('GardenHelp.tsx');
 const helpCSS=component('word-garden-quiet.css');
 assert.match(map,/onClick=\{\(\)=>setMapTips\(x=>!x\)\}/);
 assert.match(map,/aria-expanded=\{mapTips\}/);
 assert.match(map,/id="wg-tips"/);
 assert.match(map,/Bugünkü hedef:/);
 assert.match(map,/onClick=\{onOpenPassport\}/);
 assert.match(help,/<details className="wg-game-help">/);
 assert.match(help,/<summary title=\{label\} aria-label=\{label\}>/);
 assert.match(helpCSS,/focus-visible/);
 for(const file of ['FoodMarketAdventure.tsx','FamilyVillageAdventure.tsx','TempleAdventure.tsx','ColorGroveAdventure.tsx','NumberValleyAdventure.tsx']){
  assert.match(activity(file),/GardenHelp/,'missing optional help: '+file);
 }
 const animal=activity('AnimalMeadowAdventure.tsx');
 assert.match(animal,/am3-help/);
 assert.match(animal,/MeadowPlayStage/);
 assert.match(animal,/aria-label="Pufi'den oyun yardımı"/);
});

test('Visual simplification preserves actual English words, answer events and auto advance',()=>{
 const animal=activity('AnimalMeadowAdventure.tsx');
 const color=activity('ColorGroveAdventure.tsx');
 const number=activity('NumberValleyAdventure.tsx');
 assert.match(animal,/useAutoQuestionAdvance/);
 assert.match(animal,/planAnimalMission/);
 assert.match(animal,/saveError/);
 assert.match(color,/planColorMission/);
 assert.match(color,/useAutoQuestionAdvance/);
 assert.match(color,/getColorInstruction/);
 assert.match(number,/numberWordParts\(current.target\)/);
 assert.match(number,/window\.setTimeout\(\(\)=>next\(\),1050\)/);
});
