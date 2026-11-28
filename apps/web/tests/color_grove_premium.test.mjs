import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {COLOR_GROVE_WORDS} from '../src/lib/progress/colorGroveProgress.ts';
import {planColorMission,colorsConfusable,COLOR_FAMILIES,distinctColorDistractors} from '../src/lib/learning/colorMissionEngine.ts';
import {confusableColours} from '../src/lib/learning/templeEngine.ts';

const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const family=(a,b)=>(COLOR_FAMILIES[a]??[]).includes(b)||(COLOR_FAMILIES[b]??[]).includes(a);

test('A general colour is never offered next to its own shade ("Find blue!" with light blue)',()=>{
 assert.ok(colorsConfusable('blue','light blue'),'ΔE 55: swatch distance alone let this through');
 assert.ok(colorsConfusable('green','dark green')&&colorsConfusable('purple','lavender'));
 assert.ok(colorsConfusable('purple','violet'),'still caught by swatch distance');
 assert.ok(!colorsConfusable('light blue','dark blue'),'two shades teach light/dark');
 assert.ok(!colorsConfusable('red','blue')&&!colorsConfusable('red','red'));
 for(const [general,shades] of Object.entries(COLOR_FAMILIES))for(const id of [general,...shades])
  assert.ok(COLOR_GROVE_WORDS.some(word=>word.id===id),'unknown colour '+id);
 // Measured before the fix: 1 348 of 39 000 such questions (3.5%) were ambiguous.
 const history=COLOR_GROVE_WORDS.map(word=>({wordId:word.id,kind:'discovery',mistakes:0,firstTryCorrect:false,timestamp:'2026-11-22T08:00:00.000Z'}));
 let questions=0;
 for(const englishLevel of ['Pre-A1','A1','A2'])for(const gradeLevel of [null,3,5,8])for(const mission of [2,3])
  for(let seed=1;seed<=80;seed++)for(const q of planColorMission({mission,history,seed,englishLevel,gradeLevel}).questions){
   questions++;
   assert.ok(q.choices.includes(q.target));
   for(const choice of q.choices)if(choice!==q.target)
    assert.ok(!family(choice,q.target),`${englishLevel}/${gradeLevel}/${mission}/${seed}: ${q.target} vs ${choice}`);
  }
 assert.ok(questions>10000);
 // A tiny pool still yields a question; a shade is only the very last resort.
 assert.deepEqual(distinctColorDistractors('blue',['blue','light blue','red'],2),['red','light blue']);
 // The Temple uses the same rule for its colour crystals.
 assert.ok(confusableColours({en:'blue',domain:'colors'},{en:'navy blue',domain:'colors'}));
 assert.match(src('lib/learning/templeEngine.ts'),/colorsConfusable\(a\.en,b\.en\)/);
});

test('Feedback lives in the scene; the celebration never hides the reward text',()=>{
 const world=src('components/learning/activities/MobileColorGroveWorld.tsx');
 assert.match(world,/toast\?: \{ text: string; good: boolean; detail\?: string; lang\?: 'en' \} \| null;/);
 assert.match(world,/<p className="cg4-toast" data-good=\{toast\.good\} role="status" aria-live="polite">/);
 const ui=src('components/learning/activities/ColorGroveAdventure.tsx');
 assert.match(ui,/setFeedback\(\{ text: '✨ ' \+ target\.toUpperCase\(\) \+ '!', good: true, lang: 'en', detail: getWord\(target\)\.tr \}\);/);
 assert.doesNotMatch(ui,/cg-feedback|Yeni renk geliyor/,'one in-scene status, not two bars under the scene');
 const css=src('components/learning/activities/color-grove-premium.css');
 assert.match(css,/\.cg-shell \.cg-complete \.learning-motion\{z-index:0\}/);
 // The burst plays inside the result card's art; the reward text sits below it, never on top.
 assert.match(ui,/art=\{<><LearningMotion variant="victory" trigger=\{complete\?'grove-complete-'\+step\+'-'\+replayNonce:null\}\/>/);
 assert.match(ui,/<GameResult island="garden" className="cg-complete" titleRef=\{doneHeading\}/);
 assert.match(css,/\.cg-shell \.cg4-stage:has\(\.cg4-toast\) \.cg4-scene-pill\{visibility:hidden\}/);
});

test('Reward: honest result line and a tap-to-hear colour recap; the next button stays on screen',()=>{
 const ui=src('components/learning/activities/ColorGroveAdventure.tsx');
 assert.match(ui,/\{step === 1 \? `\$\{discovered\.length\} rengin İngilizce adını dinledin` : `\$\{correct\} doğru · \$\{mistakes\} yanlış deneme`\}/,
  'discovery used to say "Doğru: 0"');
 assert.match(ui,/const recap: Word\[\] = \(activePlan \? \(step === 1 \? activePlan\.colors : Array\.from\(new Set\(activePlan\.questions\.map\(q => q\.target\)\)\)\) : \[\]\)/);
 assert.match(ui,/onClick=\{\(\) => listen\(word\.id\)\} disabled=\{muted \|\| !speechAvailable\}/);
 assert.doesNotMatch(ui,/text-6xl" aria-hidden="true">🌟/);
 const css=src('components/learning/activities/color-grove-premium.css');
 assert.match(css,/@media\(max-height:940px\)\{\s*\.cg-shell \.cg-complete \.cg-recap\{order:10\}/);
});

test('Help in the HUD, review chip, compact prompt, 12px floor and English marked English',()=>{
 const ui=src('components/learning/activities/ColorGroveAdventure.tsx');
 const hud=ui.slice(ui.indexOf('<GameTopBar island="garden"'),ui.indexOf('<div className="cg-main'));
 assert.match(hud,/gameExit backClassName="gg-game-control" backDisabled=\{saving\} onBack=\{onBack\}/);
 assert.match(hud,/<GardenHelp label="Renk Korusu nasıl oynanır\?">/);
 assert.doesNotMatch(ui,/className="cg-footer/,'the engine note moved into help');
 assert.match(ui,/<span className="cg-review-chip">🔁 Hatırlama/);
 assert.match(ui,/lang=\{step === 3 \? 'en' : undefined\}/);
 const world=src('components/learning/activities/MobileColorGroveWorld.tsx');
 assert.match(world,/<span className="cg4-discover-name" lang="en">/);
 assert.match(world,/<span className="cg4-choice-label" lang=\{isPainting \? undefined : 'en'\}>/);
 // Paint swatches keep their names for children who cannot tell hues apart.
 assert.match(world,/\{isPainting \? word\.tr : word\.id\.toUpperCase\(\)\}/);
 const css=src('components/learning/activities/color-grove-premium.css');
 assert.match(css,/\.cg-shell \.cg4-stage--matching \.cg4-choice-label\{font-size:clamp\(16px,1\.9vw,22px\)/);
 assert.match(css,/\.cg-shell \.cg4-scene-pill,\.cg-shell \.cg4-counter,\.cg-shell \.cg4-focus-label,/);
 assert.match(css,/\.cg-shell \.cg4-choice-grid\{margin-top:auto\}/,'thumb zone on phones');
 assert.match(src('components/learning/activities/color-grove.css'),/\.cg-mission-prompt \.cg-hint-wrap button\{font-size:13px!important;min-height:44px\}/);
});
