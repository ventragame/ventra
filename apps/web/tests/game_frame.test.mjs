import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// One in-game frame for every Ventra game (docs/VENTRA_GAME_FRAME_V1.md).
const read=file=>fs.readFileSync(new URL('../src/'+file,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const frame=read('components/learning/game/GameFrame.tsx');
const css=read('components/learning/game/game-frame.css');
const palette=read('components/learning/island/island-palette.css');

test('The frame is presentational and takes its colours from the island palette',()=>{
 assert.doesNotMatch(frame,/getProgressRepository|recordGameCompleted|localStorage|soundService|listenToChild/);
 assert.match(frame,/import '\.\.\/island\/island-palette\.css';/);
 for(const id of ['sentence','story','harbor','writing','academy','garden'])
  assert.ok(palette.includes(':is(.ih-root,.gf-theme)[data-island="'+id+'"]{'),id);
 assert.match(frame,/export type GameFrameIsland='sentence'\|'story'\|'harbor'\|'writing'\|'academy'\|'garden';/);
});

test('Top bar: one back place, notch-safe, Escape target for garden games, honest progressbar',()=>{
 assert.match(frame,/\{\.\.\.\(props\.gameExit\?\{'data-game-exit':''\}:\{\}\)\}/);
 assert.match(frame,/aria-label=\{props\.backAriaLabel\?\?props\.backLabel\}/);
 assert.match(frame,/role="progressbar"/);
 assert.match(frame,/aria-valuenow=\{Math\.min\(progress\.current,progress\.total\)\}/);
 assert.match(css,/\.gf-bar\{[^}]*padding-top:env\(safe-area-inset-top,0px\)/);
 assert.match(css,/\.gf-back\{[^}]*min-width:46px;min-height:46px/);
 assert.match(css,/\.gf-tool,[^{]*\{[^}]*width:46px;min-width:46px;height:46px;min-height:46px/);
 assert.match(css,/@media\(max-width:640px\)\{[\s\S]*?\.gf-tool,\.gf-tools \.wg-game-help>summary\{width:44px;min-width:44px;height:44px;min-height:44px/,
  'phone tools stay full 44px targets');
});

test('Step rail: states are announced, the current step is centred without moving the page',()=>{
 assert.match(frame,/'aria-current':step\.state==='current'\?'step' as const:undefined/);
 assert.match(frame,/<span className="gf-sr">\{' · '\+STEP_NOTE\[step\.state\]\}<\/span>/,'non-interactive steps say their state');
 assert.match(frame,/disabled=\{step\.disabled\|\|step\.state==='locked'\}/);
 assert.match(frame,/rail\.scrollLeft=Math\.max\(0,left\)/);
 assert.doesNotMatch(frame,/scrollIntoView/);
});

test('Result card and stars: one layout, calm for reduced motion',()=>{
 assert.match(frame,/role="img" aria-label=\{total\+' yıldızdan '\+earned\}/);
 assert.match(frame,/<div className="gf-result-actions">\{actions\}<\/div>/);
 assert.match(css,/\.gf-btn\{[^}]*min-height:50px/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\n \.gf-bar,\.gf-result,\.gf-star,\.gf-step-mark\{animation:none!important\}/);
});

test('Harbor, Writing and Academy play on the shared frame',()=>{
 const games={
  'components/learning/harbor/HarborSpeechAdventure.tsx':['<GameTopBar island="harbor"','<GameStepRail island="harbor"','<GameResult island="harbor"'],
  'components/learning/writing/WritingWorkshopAdventure.tsx':['<GameTopBar island="writing"','<GameStepRail island="writing"','<GameResult island="writing"'],
  'components/learning/academy/AcademyAdventure.tsx':['<GameTopBar island="academy"','<GameResult island="academy"'],
  'components/learning/academy/AcademySkillSystem.tsx':['<GameStepRail island="academy"']
 };
 for(const [file,marks] of Object.entries(games)){
  const code=read(file);
  for(const mark of marks)assert.ok(code.includes(mark),file+' '+mark);
 }
 // The retired per-game headers are gone, not hidden.
 assert.doesNotMatch(read('components/learning/harbor/HarborSpeechAdventure.tsx'),/className="harbor-header"/);
 assert.doesNotMatch(read('components/learning/writing/WritingWorkshopAdventure.tsx'),/className="writing-header"/);
 assert.doesNotMatch(read('components/learning/academy/AcademyAdventure.tsx'),/className="academy-header"/);
 // Academy no longer leaves an empty left half on wide screens.
 assert.match(read('components/learning/academy/academy-adventure.css'),/@media\(min-width:1100px\)\{\n \.academy-quest\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(0,1\.08fr\)/);
});

test('Every Ventra game plays inside the same frame',()=>{
 const games={
  'sentence/SentencePlazaAdventure.tsx':'sentence','sentence/MovementMagicAdventure.tsx':'sentence',
  'sentence/WishFestivalAdventure.tsx':'sentence','sentence/LanternFestivalAdventure.tsx':'sentence',
  'story/StoryForestAdventure.tsx':'story','story/StorySequenceAdventure.tsx':'story','story/StoryDetectiveAdventure.tsx':'story',
  'harbor/HarborSpeechAdventure.tsx':'harbor','writing/WritingWorkshopAdventure.tsx':'writing','academy/AcademyAdventure.tsx':'academy',
  'activities/AnimalMeadowAdventure.tsx':'garden','activities/ColorGroveAdventure.tsx':'garden','activities/NumberValleyAdventure.tsx':'garden',
  'activities/FoodMarketAdventure.tsx':'garden','activities/FamilyVillageAdventure.tsx':'garden','activities/TempleAdventure.tsx':'garden',
  'alphabet/AlphabetGroveAdventure.tsx':'garden','themes/ThemeTownAdventure.tsx':'garden'
 };
 for(const [file,island] of Object.entries(games)){
  const code=read('components/learning/'+file);
  assert.ok(code.includes('<GameTopBar island="'+island+'"'),file+' top bar');
  assert.ok(code.includes('<GameResult island="'+island+'"'),file+' result card');
  if(island==='garden')assert.match(code,/<GameTopBar island="garden"[^>]*gameExit/,file+' keeps the Escape exit');
 }
});

test('Frame labels never drop under the 12px child legibility floor',()=>{
 for(const m of css.matchAll(/font-size:(\d+(?:\.\d+)?)px/g))assert.ok(Number(m[1])>=12,'font-size '+m[1]+'px');
});
