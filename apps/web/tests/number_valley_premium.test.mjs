import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {englishNumber} from '../src/lib/learning/numberValleyEngine.ts';
import {numberWordParts,numberWordDecoy,numberWordTiles,teenTyPartner,portalSentence,portalWords,portalNoun} from '../src/lib/learning/numberWordQuest.ts';

const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const ui=()=>src('components/learning/activities/NumberValleyAdventure.tsx');
const css=()=>src('components/learning/activities/number-valley-premium.css');

test('The portal sentence is correct English for every number ("one star", not "one stars")',()=>{
 // The live game offered "I see one stars." as the right answer and the
 // grammatical "I see six stars." as the wrong one.
 assert.equal(portalSentence(1),'I see one star.');
 assert.deepEqual(portalWords(1),['I','see','one','star']);
 for(let n=2;n<=1000;n++){
  assert.equal(portalNoun(n),'stars');
  assert.equal(portalSentence(n),`I see ${englishNumber(n)} stars.`);
 }
 assert.doesNotMatch(ui(),/'stars'\]/,'the sentence words come from portalWords, never a fixed plural');
});

test('Star workshop: two-piece words get the decoy learners really confuse (-teen / -ty)',()=>{
 for(const n of [13,15,16,17,18,19]){
  assert.equal(numberWordDecoy(n),'ty',String(n));
  // thir+ty is thirty: the decoy builds the real word it is confused with.
  assert.equal(numberWordParts(n)[0]+'ty',englishNumber(teenTyPartner(n)),String(n));
 }
 assert.equal(numberWordDecoy(14),null,'"fourty" is a misspelling of forty');
 assert.equal(numberWordDecoy(70),'teen');
 assert.equal(numberWordParts(70)[0]+'teen',englishNumber(teenTyPartner(70)));
 // Compounds: a neighbouring units word (twenty-five, not twenty-six).
 for(let n=21;n<=99;n++){
  const decoy=numberWordDecoy(n);
  if(n%10===0)continue;
  assert.ok(decoy&&decoy!==englishNumber(n%10)&&englishNumber(n).includes('-'),n+': '+decoy);
 }
 // Spelled words and long phrases already ask for real order: no decoy.
 for(const n of [1,2,3,5,6,10,11,12,20,40,100,125,1000])assert.equal(numberWordDecoy(n),null,String(n));
 const tiles=numberWordTiles(17,3);
 assert.equal(tiles.length,3);
 assert.deepEqual(tiles.filter(t=>t.decoy).map(t=>t.part),['ty']);
 // The UI finishes the word on its real parts, not on the tile count, and
 // explains the teen/ty mix-up with the number it would have made.
 assert.match(ui(),/if\(selectedWordTiles\.length\+1===parts\.length\)correctAnswer\(\);/);
 assert.match(ui(),/mistake\(`\$\{englishNumber\(partner\)\.toUpperCase\(\)\} = \$\{partner\}\./);
});

test('The asked number is shown big; feedback lives in the scene; the celebration stays behind',()=>{
 const code=ui();
 assert.match(code,/\{\(stage===2\|\|stage===5\)&&<div className="nv5-target" aria-hidden="true"><Gem number=\{current\.target\} discovered\/><\/div>\}/,
  'the number was only inside a 13px instruction line');
 assert.match(code,/\{toast&&<p className="nv5-toast" data-good=\{toast\.good\} role="status" aria-live="polite">/);
 assert.doesNotMatch(code,/nv5-feedback|nv-auto-next|Yeni sayı geliyor|nv5-discovery-auto/,'one in-scene status, not bars under the scene');
 assert.match(code,/detail:feedback\.good&&finishing\?'Bölüm kaydediliyor…':feedback\.detail/);
 const style=css();
 assert.match(style,/\.nv6-root \.nv5-landscape \.learning-motion\{z-index:2\}/);
 assert.match(style,/\.nv6-root \.nv5-finale \.learning-motion\{z-index:0\}/);
 // The finale is the shared result card; the celebration plays inside its art.
 assert.match(code,/\{completed&&<GameResult island="garden" className="nv5-finale" titleRef=\{doneHeading\}/);
 assert.match(code,/art=\{<><LearningMotion variant="victory"/);
 // Waiting stones are dimmed, not see-through (the scenery showed through them).
 assert.match(style,/\.nv6-root \.nv5-answer:disabled\{opacity:1;filter:grayscale\(\.65\) brightness\(\.86\)\}/);
});

test('Wrong answers teach: a wrong word says what it means; listening never gives the answer away',()=>{
 const code=ui();
 assert.match(code,/mistake\(stage===2\?`\$\{englishNumber\(value\)\.toUpperCase\(\)\} = \$\{value\}\. \$\{current\.target\} sayısını bul\.`:'Yeniden dinle ve tekrar dene\.'\);/);
 assert.match(code,/mistake\(`\$\{tile\.word\.toUpperCase\(\)\} = \$\{portalDecoy\}\. Portal \$\{current\.target\} sayısını istiyor\.`\)/);
 assert.doesNotMatch(code,/Parlayan ipucunu/,'nothing glows: the old message pointed at a hint that did not exist');
 assert.doesNotMatch(code,/mühürü/,'Turkish: mühür → mührü');
});

test('Reward: honest result, tap-to-hear recap, next button first on short screens',()=>{
 const code=ui();
 assert.match(code,/\{stage===1\?`\$\{answers\.length\} sayının İngilizcesini dinledin`:`\$\{answers\.length\} doğru · \$\{mistakes\} yanlış deneme`\}/,
  'discovery used to say "8 doğru · 0 hata"');
 assert.match(code,/onClick=\{\(\)=>speak\(value,stage===5\)\} disabled=\{muted\|\|!speechAvailable\}/);
 assert.match(code,/<span lang="en">\{englishNumber\(value\)\}<\/span><\/button>\)\}/);
 const style=css();
 // The result card body is a flex column: the recap moves below the buttons on short screens.
 assert.match(style,/@media\(max-height:940px\)\{\n \.nv6-root \.nv5-finale \.nv5-recap\{order:10\}/);
 assert.match(style,/\.nv6-root \.nv5-finale-stage\{width:100%;/,'auto margins shrank the scene in the flex column');
});

test('Compact chrome, help in the HUD, 12px floor, phone fill and Turkish/English casing',()=>{
 const code=ui();
 const hud=code.slice(code.indexOf('<GameTopBar island="garden"'),code.indexOf('<main className="nv5-main'));
 assert.match(hud,/gameExit backClassName="gg-game-control" backDisabled=\{saving\} onBack=\{onBack\}/);
 assert.match(hud,/<GardenHelp label="Sayı Vadisi nasıl oynanır\?">/);
 assert.match(hud,/className="gf-tool gg-game-control"/,'sound sits with help in the top bar');
 assert.doesNotMatch(code,/<footer className="nv5-footer/,'the footer note moved into help');
 assert.match(code,/const upperTr=\(text:string\)=>text\.toLocaleUpperCase\('tr-TR'\);/,'"KRISTAL PATIKASI" → "KRİSTAL PATİKASI"');
 assert.match(code,/<span className="nv5-crystal-word" lang="en">/);
 assert.match(code,/<span className="nv5-answer-main" lang=\{stage===2\?'en':undefined\}>/);
 assert.match(code,/aria-label="Oluşturulan İngilizce cümle" lang="en"/);
 assert.doesNotMatch(code,/Işık taşı|Sayı kristali \{/,'filler labels under the answers');
 const style=css();
 // Paths and chapters are the shared step rails (12px+ labels live in game-frame.css).
 assert.match(code,/<GameStepRail island="garden" className="nv5-bands" ariaLabel="Sayı Vadisi sayı yolları" showNotes/);
 assert.match(code,/<GameStepRail island="garden" className="nv5-chapters" ariaLabel="Sayı Vadisi görevleri"/);
 assert.match(style,/\.nv6-root \.nv5-scene-kicker\{font-size:12px/);
 assert.match(style,/min-height:calc\(100dvh - var\(--nv-chrome,284px\) - env\(safe-area-inset-bottom,0px\)\)!important/);
 assert.match(style,/\.nv6-root \.nv5-play>\.nv5-answer-grid,\.nv6-root \.nv5-play>\.nv5-crystals,/);
 assert.match(style,/\.nv6-root \.nv5-answer-grid\[data-count="3"\]\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)\}/);
 assert.match(code,/import '\.\/number-valley-v5\.css';\nimport '\.\/number-valley-premium\.css';/);
});

test('Shared tutorial: the glowing target glows instead of fading to half opacity',()=>{
 const guide=src('components/learning/FirstPlayGuide.tsx');
 assert.doesNotMatch(guide,/motion-safe:animate-pulse/,'the pulsing "3" looked disabled');
 assert.match(guide,/first-play-target/);
});
