import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TEMPLE_CHAMBERS,planTempleMission,templeWord,templeLookalike,sentenceFor} from '../src/lib/learning/templeEngine.ts';

const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const ui=()=>src('components/learning/activities/TempleAdventure.tsx');
const css=()=>src('components/learning/activities/temple-premium.css');
const w=id=>templeWord(id);

test('The Temple uses every world\'s look-alike rule, in its answers and in the seal-gate stall',()=>{
 assert.ok(templeLookalike(w('animals:bird'),w('animals:duck')),'a duck is a bird');
 assert.ok(templeLookalike(w('animals:cat'),w('animals:lion')));
 assert.ok(templeLookalike(w('food:apple'),w('food:tomato')));
 assert.ok(templeLookalike(w('family:have lunch'),w('family:have dinner')));
 assert.ok(templeLookalike(w('colors:blue'),w('colors:light blue')));
 assert.ok(!templeLookalike(w('animals:cat'),w('food:apple'))&&!templeLookalike(w('animals:cat'),w('animals:cat')));
 // Measured before: 295 of 50 400 answers (0.6%) and 732 of 4 500 seal-gate stalls (16.3%).
 let questions=0,stalls=0;
 for(const c of TEMPLE_CHAMBERS)for(const englishLevel of ['Pre-A1','A1','A2'])for(const gradeLevel of [null,1,3,5,7])
  for(const stage of [2,3,5])for(let seed=1;seed<=30;seed++){
   const plan=planTempleMission({chamber:c.id,stage,englishLevel,gradeLevel,history:[],seed});
   if(stage===5){stalls++;
    for(const a of plan.words)for(const b of plan.words)assert.ok(!templeLookalike(w(a),w(b)),`${c.id}/${seed}: ${a} and ${b} in one stall`);}
   for(const q of plan.questions){questions++;
    assert.ok(q.options.includes(q.target));
    for(const o of q.options)assert.ok(!templeLookalike(w(o),w(q.target)),`${c.id}/${stage}/${seed}: ${q.target} vs ${o}`);}
  }
 assert.ok(questions>20000&&stalls>2000);
});

test('Sentence bridge: correct English, never handed over in order, and a wrong try keeps the right start',()=>{
 assert.deepEqual(sentenceFor(w('family:baby')),['This','is','the','baby.'],'a child does not say "my baby"');
 assert.deepEqual(sentenceFor(w('family:mother')),['This','is','my','mother.']);
 assert.deepEqual(sentenceFor(w('food:cake')),['I','would','like','some','cake.']);
 for(const c of TEMPLE_CHAMBERS)for(let seed=1;seed<=60;seed++)
  for(const q of planTempleMission({chamber:c.id,stage:4,englishLevel:'A2',gradeLevel:7,history:[],seed}).questions){
   assert.deepEqual([...q.sentenceTokens].sort(),[...q.sentenceAnswer].sort());
   assert.notDeepEqual(q.sentenceTokens,q.sentenceAnswer,'tiles are never in reading order');
  }
 const code=ui();
 assert.match(code,/const firstWrong=next\.findIndex\(\(v,i\)=>task\.sentenceTokens\?\.\[v\]!==task\.sentenceAnswer\?\.\[i\]\);\n\s*const kept=next\.slice\(0,Math\.max\(0,firstWrong\)\);/);
 assert.match(code,/`İlk \$\{kept\.length\} kelime doğru; gerisini yeniden sırala\.`/);
 assert.match(code,/'İngilizce cümle büyük harfle başlar, noktayla biter\.'/);
});

test('Feedback lives in the scene strip; a wrong answer names what was picked, and the seal order is explained',()=>{
 const code=ui();
 assert.match(code,/\{toast&&<p className="tp8-toast" data-good=\{toast\.good\} role="status" aria-live="polite">/);
 assert.doesNotMatch(code,/className="tp-notice"|Bu mühür değil|Yeni İngilizce mühür açılıyor|tp6-discovery-guide|tp-mission-tag/);
 assert.match(code,/if\(stage===2\)return `\$\{upper\(w\.en\)\} = \$\{w\.tr\}\. Resme yeniden bak\.`;/);
 assert.match(code,/if\(stage===5&&task&&question%2===0&&pairQuestions\[1\]\?\.target===id\)return `\$\{upper\(w\.en\)\} ikinci mühür\. Önce FIRST kelimesini bul!`;/);
 assert.match(code,/return `Bu: \$\{w\.tr\} \(\$\{upper\(w\.en\)\}\)\./);
 const style=css();
 assert.match(style,/\.tp8-screen \.tp6-scenery\{height:clamp\(112px,11vw,140px\)\}/);
 assert.match(style,/\.tp8-screen \.tp8-toast\[data-good=false\]\{color:#6b2338;/,'a wrong answer was shown in green');
});

test('Colours are shown true: the asked crystal is not dimmed and light crystals keep an edge',()=>{
 const style=css();
 assert.match(style,/\.tp8-screen \.tp6-play \.tp6-featured \.tp-rune:disabled\{opacity:1;filter:none\}/,'yellow looked pale yellow');
 assert.match(style,/\.tp8-screen \.tp-rune-art:has\(\.tp6-color-crystal\)\{filter:drop-shadow\(0 0 1px #1d3f41b3\)/,'white vanished on a cream card');
});

test('HUD tools, honest reward with a tap-to-hear recap, English marked English, phone fill',()=>{
 const code=ui();
 const hud=code.slice(code.indexOf('<GameTopBar island="garden"'),code.indexOf('<div className="tp-shell'));
 assert.match(hud,/<GardenHelp label="Keşif Tapınağı nasıl oynanır\?">/);
 assert.match(hud,/className="gf-tool tp-mute"/);
 assert.equal((code.match(/<GardenHelp/g)||[]).length,1,'one help button');
 assert.doesNotMatch(code,/<footer className="tp-footer"|Tapınak rünü|İngilizce mührü açtın/);
 assert.match(code,/\{stage===1\?`\$\{answers\.length\} kelimenin İngilizcesini dinledin`:/);
 assert.match(code,/`\$\{practised\.length\} doğru · \$\{mistakes\} yanlış deneme\$\{aided\?` · \$\{aided\} destekli`:''\}`/);
 assert.match(code,/onClick=\{\(\)=>speak\(stage===4\?sentenceFor\(templeWord\(id\)\)\.join\(' '\):templeWord\(id\)\.en\)\} disabled=\{!canHear\}/);
 assert.match(code,/<RuneArt id=\{id\}\/><span lang="en">\{templeWord\(id\)\.en\}<\/span><\/button>\)\}/);
 assert.match(code,/<span className="tp-rune-text tp6-rune-text" lang=\{mode==='en'\?'en':undefined\}>/);
 assert.match(code,/aria-label="Oluşturulan İngilizce cümle" lang="en"/);
 const style=css();
 // The reward is the shared result card; the recap moves below the buttons on short screens.
 assert.match(code,/finished\?<GameResult island="garden" className="tp-finished tp6-finished" titleRef=\{doneHeading\}/);
 assert.match(style,/@media\(max-height:940px\)\{\n \.tp8-screen \.tp6-finished \.tp8-recap\{order:10/);
 assert.match(style,/min-height:calc\(100dvh - var\(--tp8-chrome,260px\) - env\(safe-area-inset-bottom,0px\)\)/);
 assert.doesNotMatch(code,/gg-quest-location|tp8-scene-count/,'place and progress live in the shared top bar');
 const imports=[...code.matchAll(/^import '\.\/([^']+\.css)';/gm)].map(m=>m[1]);
 assert.deepEqual(imports.slice(-3),['garden-quest-navigation.css','temple-premium.css','garden-child-legibility.css']);
});
