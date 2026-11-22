import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Minimal DOM surface for the pure focus rule (no browser in node:test).
class FakeElement{constructor(props={}){Object.assign(this,{isConnected:true,attrs:{}},props);}getAttribute(name){return this.attrs[name]??null;}}
globalThis.HTMLButtonElement=class extends FakeElement{};
globalThis.HTMLInputElement=class extends FakeElement{};
globalThis.document={body:new FakeElement(),documentElement:new FakeElement()};
const {questionFocusLost}=await import('../src/components/learning/activities/useQuestionFocus.ts');

const read=file=>fs.readFileSync(new URL('../src/components/learning/activities/'+file,import.meta.url),'utf8').replace(/\r\n/g,'\n');

test('Focus counts as lost only on body, removed nodes and just-disabled controls',()=>{
 assert.equal(questionFocusLost(null),true);
 assert.equal(questionFocusLost(document.body),true);
 assert.equal(questionFocusLost(document.documentElement),true);
 assert.equal(questionFocusLost(new HTMLButtonElement({isConnected:false})),true,'the chosen answer was removed');
 assert.equal(questionFocusLost(new HTMLButtonElement({disabled:true})),true,'the chosen answer was disabled');
 assert.equal(questionFocusLost(new FakeElement({attrs:{'aria-disabled':'true'}})),true);
 assert.equal(questionFocusLost(new HTMLButtonElement({disabled:false})),false,'a live control keeps focus (exit, sound, help)');
 assert.equal(questionFocusLost(new HTMLInputElement({disabled:false})),false);
 assert.equal(questionFocusLost(new FakeElement()),false);
});

test('The hook never steals focus, never scrolls and skips the first render',()=>{
 const hook=read('useQuestionFocus.ts');
 assert.match(hook,/if\(previous\.current===questionKey\)return;/);
 assert.match(hook,/if\(!node\?\.isConnected\|\|!questionFocusLost\(document\.activeElement\)\)return;/);
 assert.match(hook,/node\.focus\(\{preventScroll:true\}\);/);
 assert.match(hook,/return\(\)=>cancelAnimationFrame\(frame\);/);
});

test('All six garden games with answer rounds move focus to their own question prompt',()=>{
 const games={
  'AnimalMeadowAdventure.tsx':[/useQuestionFocus<HTMLHeadingElement>\(`\$\{stage\}:\$\{questionIndex\}`\)/,/<h2 ref=\{questionHeading\} className="am-task-title" tabIndex=\{-1\} lang="en">/],
  'ColorGroveAdventure.tsx':[/useQuestionFocus<HTMLHeadingElement>\(`\$\{step\}:\$\{question\}`\)/,/<h2 ref=\{questionHeading\} tabIndex=\{-1\}/],
  'NumberValleyAdventure.tsx':[/useQuestionFocus<HTMLHeadingElement>\(`\$\{stage\}:\$\{question\}`\)/,/<h2 ref=\{questionHeading\} tabIndex=\{-1\} className="nv5-scene-title">/],
  'FoodMarketAdventure.tsx':[/useQuestionFocus<HTMLDivElement>\(`\$\{stage\}:\$\{q\}`\)/,/<div ref=\{questionPrompt\} tabIndex=\{-1\} className="fm-command fm4-command">/],
  'FamilyVillageAdventure.tsx':[/useQuestionFocus<HTMLDivElement>\(`\$\{stage\}:\$\{question\}`\)/,/<div ref=\{questionPrompt\} tabIndex=\{-1\} className="fv-prompt fv3-prompt fv5-prompt">/],
  'TempleAdventure.tsx':[/useQuestionFocus<HTMLDivElement>\(`\$\{stage\}:\$\{question\}`\)/,/<div ref=\{questionPrompt\} tabIndex=\{-1\} className="tp-command tp6-command">/]
 };
 for(const [file,patterns] of Object.entries(games)){
  const code=read(file);
  assert.match(code,/import \{useQuestionFocus\} from '\.\/useQuestionFocus';/,file);
  for(const pattern of patterns)assert.match(code,pattern,file);
 }
});

test('The end-of-mission panel takes focus the same way when the last answer disappears',()=>{
 const games={
  'AnimalMeadowAdventure.tsx':[/useQuestionFocus<HTMLHeadingElement>\(completed\?'done':'play'\)/,/<h2 ref=\{doneHeading\} tabIndex=\{-1\} className="mt-2 text-2xl font-black">Görev Tamamlandı!<\/h2>/],
  'ColorGroveAdventure.tsx':[/useQuestionFocus<HTMLHeadingElement>\(complete \? 'done' : 'play'\)/,/<h2 ref=\{doneHeading\} tabIndex=\{-1\} className="mt-3 text-2xl font-black">Koru Canlandı!<\/h2>/],
  'NumberValleyAdventure.tsx':[/useQuestionFocus<HTMLHeadingElement>\(completed\?'done':'play'\)/,/<h2 ref=\{doneHeading\} tabIndex=\{-1\}>\{CHAPTERS\[stage-1\]\.title\} tamamlandı!<\/h2>/],
  'FoodMarketAdventure.tsx':[/useQuestionFocus<HTMLHeadingElement>\(finished\?'done':'play'\)/,/<h2 ref=\{doneHeading\} tabIndex=\{-1\}>Fantastic! Great shopping!<\/h2>/],
  'FamilyVillageAdventure.tsx':[/useQuestionFocus<HTMLHeadingElement>\(saved\?'done':'play'\)/,/<h2 ref=\{doneHeading\} tabIndex=\{-1\}>Well done! Great English!<\/h2>/],
  'TempleAdventure.tsx':[/useQuestionFocus<HTMLHeadingElement>\(finished\?'done':'play'\)/,/<h2 ref=\{doneHeading\} tabIndex=\{-1\}>\{chamber==='crown'&&stage===5/]
 };
 for(const [file,patterns] of Object.entries(games)){const code=read(file);for(const pattern of patterns)assert.match(code,pattern,file);}
});
