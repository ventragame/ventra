import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const src=p=>fs.readFileSync(new URL('../src/'+p,import.meta.url),'utf8').replace(/\r\n/g,'\n');

test('Sayı Vadisi: every success is heard in English and listening rounds play their number',()=>{
 const code=src('components/learning/activities/NumberValleyAdventure.tsx');
 // Recognition, spelling and portal rounds say the word (or sentence) when solved.
 assert.match(code,/if\(stage!==4\)speak\(current\.target,stage===5\);\n    setAwaitingNext\(true\);/);
 // The next question waits for that word instead of cutting it off.
 assert.match(code,/delayMs:1050,speaking:speaking&&!muted,onAdvance:next/);
 // Listening rounds start with their number; the big button still replays it.
 assert.match(code,/if\(stage!==4\|\|!current\|\|muted\|\|!speechAvailable\|\|awaitingNext\|\|completed\|\|saving\)return;\n    const timer=window\.setTimeout\(\(\)=>\{soundService\.unlockAudio\(\);speak\(current\.target\);\},350\);/);
});

test('Renk Korusu: a solved matching round says the colour once',()=>{
 const code=src('components/learning/activities/ColorGroveAdventure.tsx');
 assert.match(code,/if \(step === 2 && !muted\) pronounce\(target\);/);
});

test('Lezzet Pazarı, Aile Köyü and Keşif Tapınağı play their listening cue when a question opens',()=>{
 const food=src('components/learning/activities/FoodMarketAdventure.tsx');
 assert.match(food,/if\(\(stage!==3&&stage!==4\)\|\|!task\|\|muted\|\|success\|\|busy\|\|finished\)return;\n  const timer=window\.setTimeout\(\(\)=>\{soundService\.unlockAudio\(\);speak\(task\.audio,true\);\},450\);/);
 const family=src('components/learning/activities/FamilyVillageAdventure.tsx');
 // The word is gated (it must be heard in full); the room instruction is not.
 assert.match(family,/if\(\(stage!==3&&stage!==4\)\|\|!task\|\|muted\|\|answered\|\|busy\|\|saved\)return;\n  const timer=window\.setTimeout\(\(\)=>\{soundService\.unlockAudio\(\);speak\(task\.audio,stage===3\);\},450\);/);
 const temple=src('components/learning/activities/TempleAdventure.tsx');
 assert.match(temple,/if\(stage!==3\|\|!task\|\|muted\|\|correct\|\|busy\|\|finished\)return;\n  const timer=window\.setTimeout\(\(\)=>\{soundService\.unlockAudio\(\);speak\(task\.audio,true\);\},450\);/);
 // Each timer is cleared when the question changes or the game closes.
 for(const code of [food,family,temple])assert.match(code,/return\(\)=>window\.clearTimeout\(timer\);/);
});

test('Keşif Tapınağı echo rounds show a decorative echo crystal instead of an empty stage',()=>{
 const code=src('components/learning/activities/TempleAdventure.tsx');
 assert.match(code,/\{stage===3&&<div className="tp6-featured tp9-echo" aria-hidden="true" data-speaking=\{speaking\|\|undefined\}>/);
 const css=src('components/learning/activities/temple-premium.css');
 assert.match(css,/\.tp9-echo\[data-speaking\] \.tp9-echo-orb>i\{animation:tp9-echo-ring 1\.35s ease-out infinite\}/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\n \.tp9-echo \.tp9-echo-orb>i\{animation:none!important\}/);
});

test('Keşif Akademisi: listening tasks play at once; the final screen shows stars and the next stop',()=>{
 const code=src('components/learning/academy/AcademyAdventure.tsx');
 assert.match(code,/if\(stage!=='quest'\|\|task\.kind!=='hear'\|\|audioAttempted\|\|busy\|\|resolved\)return;\n  const timer=window\.setTimeout\(\(\)=>readLine\(\),500\);/);
 assert.match(code,/setEarnedStars\(stars\);setStage\('final'\);soundService\.playSfx\('fanfare',\.65\);onSaved\(\);/);
 assert.match(code,/\{!reviewSkill&&<div className="academy-final-stars" aria-label=\{earnedStars\+' yıldız'\}>/);
 // The next stop opens only when it is unlocked; review runs keep their own buttons.
 assert.match(code,/\{!reviewSkill&&zone<ACADEMY_ZONES\.length&&zone\+1<=available&&<button type="button" className="academy-submit"\n      onClick=\{\(\)=>open\(zone\+1\)\}>Sıradaki Durak: \{ACADEMY_ZONES\[zone\]\.name\} →<\/button>\}/);
});

test('Touch-target minimums are never 43px',()=>{
 const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):e.name.endsWith('.css')?[dir+'/'+e.name]:[]);
 const root=new URL('../src',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1');
 for(const file of walk(root)){
  const css=fs.readFileSync(file,'utf8');
  assert.doesNotMatch(css,/min-(?:height|width):43px/,file);
 }
});

test('Harf Korusu and Tema Kasabası start listening questions with their sound; help audio stays tap-only',()=>{
 const alphabet=src('components/learning/alphabet/AlphabetGroveAdventure.tsx');
 // Only letter-name / sound-in-word: hearing word-link audio would mark the answer assisted.
 assert.match(alphabet,/if\(phase!=='playing'\|\|!task\?\.audioText\|\|!questionNeedsAudio\(task\.kind\)\|\|resolved\|\|saving\)return;/);
 const theme=src('components/learning/themes/ThemeTownAdventure.tsx');
 assert.match(theme,/\(task\.kind!=='listen'&&task\.kind!=='discover'\)/);
 for(const code of [alphabet,theme])assert.match(code,/return\(\)=>window\.clearTimeout\(timer\);\n \},\[phase,task\?\.id\]\);/);
});

test('Diyalog Limanı and Yazı Atölyesi end screens offer a replay like every other game',()=>{
 assert.match(src('components/learning/harbor/HarborSpeechAdventure.tsx'),/onClick=\{\(\)=>start\(episode\)\}>↻ Bu Bölümü Tekrar Oyna<\/button>/);
 assert.match(src('components/learning/writing/WritingWorkshopAdventure.tsx'),/onClick=\{\(\)=>enter\(chapter\)\}>↻ Bu Bölümü Tekrar Oyna<\/button>/);
});

test('Diyalog Limanı finale buttons keep a readable size; Harf Korusu back button is a full target',()=>{
 // .harbor-finale>div sets 55px for an old emoji icon; the action row is a div too.
 const harbor=src('components/learning/harbor/harbor-premium-scene.css');
 assert.match(harbor,/\.harbor-finale-actions\{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;font-size:16px;line-height:1\.25\}/);
 assert.match(harbor,/\.harbor-finale-actions>button\{margin-top:5px;min-height:48px;font-size:16px\}/);
 assert.match(src('components/learning/alphabet/alphabet-grove.css'),/\.ag-back\{[^}]*min-height:47px;min-width:47px\}/);
});
