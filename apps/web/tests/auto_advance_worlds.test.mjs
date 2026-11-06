import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../src/components/learning/activities/',import.meta.url);
const read=(name)=>fs.readFileSync(new URL(name+'.tsx',root),'utf8');
const worlds=[
 ['AnimalMeadowAdventure','awaiting','saving','completed'],
 ['ColorGroveAdventure','awaitingAdvance','saving','complete'],
 ['FoodMarketAdventure','success','busy','finished'],
 ['FamilyVillageAdventure','answered','busy','saved'],
 ['TempleAdventure','correct','busy','finished']
];

test('All five remaining English worlds automatically advance after a correct quiz answer',()=>{
 for(const [name,ready,busy,completed] of worlds){
  const code=read(name);
  assert.match(code,/useAutoQuestionAdvance\(/,name);
  assert.ok(code.includes('ready:'+ready),name+' ready gating');
  assert.ok(code.includes('Boolean(saveError)'),name+' must block failed saves');
  assert.ok(code.includes(busy),name+' must block saving');
  assert.ok(code.includes(completed),name+' must block completed chapters');
  assert.doesNotMatch(code,/onClick=\{advance\}/,name+' quiz should not require next click');
  assert.match(code,/onAdvance:advance/,name+' must route through existing progress mechanism');
  assert.match(code,/role="status"/,name+' should announce the brief success transition');
  assert.match(code,/Tekrar Oyna|Tekrar Kaydet|Tekrar kaydet/,name+' must offer replay or retry');
 }
});
test('Auto transition cleans up timers on unmount, save errors, page visibility and chapter switch',()=>{
 const hook=fs.readFileSync(new URL('../src/lib/learning/useAutoQuestionAdvance.ts',import.meta.url),'utf8');
 assert.match(hook,/if\(!ready\|\|blocked/);
 assert.match(hook,/window\.clearTimeout\(timer\)/);
 assert.match(hook,/document\.addEventListener\('visibilitychange',visibility\)/);
 assert.match(hook,/document\.removeEventListener\('visibilitychange',visibility\)/);
 assert.match(hook,/document\.hidden/);
 assert.match(hook,/if\(isSpeaking\.current && Date\.now\(\)-started<maxSpeechWaitMs\)/);
 assert.match(hook,/advanced=true/);
 assert.match(hook,/Math\.max\(850,delayMs\)/);
});
test('All worlds still require deliberate chapter reward navigation and persisted completions',()=>{
 const animal=read('AnimalMeadowAdventure');
 const color=read('ColorGroveAdventure');
 const food=read('FoodMarketAdventure');
 const family=read('FamilyVillageAdventure');
 const temple=read('TempleAdventure');
 assert.match(animal,/onClick=\{\(\)=>\{if\(stage===5\)onAllCompleted\(\);else reset/);
 assert.match(color,/onClick=\{\(\) => \{/);
 assert.match(food,/finished\?<div className="fm-win(?: fm4-win)?"/);
 assert.match(family,/saved\?<div className="fv-celebrate(?: fv3-celebrate)?"/);
 assert.match(temple,/finished\?<div className="tp-finished(?: tp6-finished)?"/);
 for(const code of [animal,color,food,family,temple]){
  assert.match(code,/onSave\(/,'persistence still required');
 }
});
test('Food, family and temple use unified musical feedback on correct, retry and completion',()=>{
 for(const name of ['FoodMarketAdventure','FamilyVillageAdventure','TempleAdventure']){
  const code=read(name);
  for(const kind of ['correct','gentle_retry','fanfare']){
   assert.ok(code.includes("soundService.playSfx('"+kind+"'"),name+' '+kind);
  }
 }
});
