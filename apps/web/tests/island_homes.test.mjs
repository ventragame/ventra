import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
 islandHeroPlan,islandChapterState,islandChapterLabel,ISLAND_GREETINGS,ISLAND_HERO_KICKER,ISLAND_HERO_ACTION,
 claimIslandGreeting,turkishPlural
} from '../src/lib/learning/islandHomeModel.ts';

const web=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(web,relative),'utf8').replace(/\r\n/g,'\n');
const chapters=(done,total=5,extra={})=>Array.from({length:total},(_,i)=>({
 id:i+1,done:i<done,unlocked:i<=done,...(extra[i+1]??{})}));

test('The hero points at a saved run first, then the next chapter, then a replay',()=>{
 assert.deepEqual(islandHeroPlan(chapters(0)),{chapterId:1,mode:'start',done:0,total:5});
 assert.deepEqual(islandHeroPlan(chapters(2)),{chapterId:3,mode:'continue',done:2,total:5});
 assert.deepEqual(islandHeroPlan(chapters(2,5,{2:{resumable:true}})),{chapterId:2,mode:'resume',done:2,total:5});
 assert.deepEqual(islandHeroPlan(chapters(5)),{chapterId:1,mode:'complete',done:5,total:5});
 // A saved run on a locked chapter (stale device data) never jumps the queue.
 assert.equal(islandHeroPlan(chapters(1,5,{4:{resumable:true}})).chapterId,2);
 // Story Forest: every game is open; the first unfinished one is suggested.
 const forest=[{id:1,done:true,unlocked:true},{id:2,done:false,unlocked:true,resumable:true},{id:3,done:false,unlocked:true}];
 assert.deepEqual(islandHeroPlan(forest),{chapterId:2,mode:'resume',done:1,total:3});
});

test('Every island names chapter states with the same words',()=>{
 const plan=islandHeroPlan(chapters(2));
 const states=chapters(2).map(c=>islandChapterState(c,plan));
 assert.deepEqual(states,['done','done','current','locked','locked']);
 assert.deepEqual(chapters(5).map(c=>islandChapterState(c,islandHeroPlan(chapters(5)))),Array(5).fill('done'),
  'a finished island highlights nothing as "next"');
 assert.equal(islandChapterLabel('locked'),'Önceki bölümü bitir');
 assert.equal(islandChapterLabel('current'),'Şimdi oyna');
 assert.equal(islandChapterLabel('current',true),'Kaldığın yerden');
 assert.equal(islandChapterLabel('done'),'Tekrar oyna');
 assert.equal(islandChapterLabel('open'),'Oyna');
 for(const mode of ['start','continue','resume','complete']){
  assert.ok(ISLAND_HERO_KICKER[mode].length>5);assert.ok(ISLAND_HERO_ACTION[mode].length>3);
 }
});

test('Greetings are short beginner English with a Turkish meaning and play once per session',()=>{
 assert.deepEqual(Object.keys(ISLAND_GREETINGS).sort(),['academy','harbor','sentence','story','word_garden','writing']);
 for(const [id,{en,tr}] of Object.entries(ISLAND_GREETINGS)){
  assert.match(en,/^[A-Z][A-Za-z ,’!]+!$/,id+' greeting is plain English');
  assert.ok(en.split(/\s+/).length<=7,id+' greeting stays A1-short');
  assert.doesNotMatch(en,/[çğıöşüÇĞİÖŞÜ]/,id);
  assert.match(tr,/[a-zçğıöşü]/i);
 }
 // A greeting must not pre-say an assessed answer: harbor episode 1 asks for "Hello!".
 assert.doesNotMatch(ISLAND_GREETINGS.harbor.en,/hello/i);
 assert.equal(claimIslandGreeting('harbor'),true);
 assert.equal(claimIslandGreeting('harbor'),false,'entering again does not talk over the child');
 assert.equal(claimIslandGreeting('academy'),true);
});

const ISLANDS=[
 ['sentence','components/learning/sentence/SentencePlazaAdventure.tsx'],
 ['story','components/learning/story/StoryForestHome.tsx'],
 ['harbor','components/learning/harbor/HarborSpeechAdventure.tsx'],
 ['writing','components/learning/writing/WritingWorkshopAdventure.tsx'],
 ['academy','components/learning/academy/AcademyAdventure.tsx']
];

test('All five playable islands render their overview through the shared island home',()=>{
 for(const [id,file] of ISLANDS){
  const ui=read('src/'+file);
  assert.match(ui,new RegExp('<IslandHome island="'+id+'"'),file);
  assert.match(ui,/heroArt=/,file);
  assert.match(ui,/guide=\{\{src:/,file+' has a painted guide');
  assert.match(ui,/status=\{/,file+' passes its real load state');
  assert.match(ui,/onRetry=/,file+' can retry a failed read');
  assert.match(ui,/unlocked:/,file);
  assert.match(ui,/done:/,file);
 }
 // Old per-island overview markup is gone.
 for(const [file,old] of [['harbor/HarborSpeechAdventure.tsx','harbor-episode-grid'],['writing/WritingWorkshopAdventure.tsx','writing-chapters'],
  ['academy/AcademyAdventure.tsx','academy-zone-grid'],['sentence/SentencePlazaAdventure.tsx','sp-v4-home'],['story/StoryForestHome.tsx','sfh-games']])
  assert.doesNotMatch(read('src/components/learning/'+file),new RegExp(old),file);
});

test('Island progress is read, never assumed: pending or failed reads disable play and show no zeros',()=>{
 const harbor=read('src/components/learning/harbor/HarborSpeechAdventure.tsx');
 assert.match(harbor,/useState<'loading'\|'ready'\|'error'>\('loading'\)/);
 assert.match(harbor,/\.catch\(\(\)=>\{if\(live\)setProgressState\('error'\);\}\)/);
 const writing=read('src/components/learning/writing/WritingWorkshopAdventure.tsx');
 assert.match(writing,/status=\{loading\?'loading':loadFailed\?'error':'ready'\}/);
 const academy=read('src/components/learning/academy/AcademyAdventure.tsx');
 assert.match(academy,/status=\{loading\?'loading':loadFailed\?'error':'ready'\}/);
 const home=read('src/components/learning/island/IslandHome.tsx');
 assert.match(home,/disabled=\{!ready\|\|busy\|\|!next\}/,'hero button waits for real progress');
 assert.match(home,/disabled=\{!ready\|\|busy\|\|!chapter\.unlocked\}/,'cards wait for real progress');
 assert.match(home,/ready\?progress\.done\+'\/'\+progress\.total:'…'/,'no fake 0/5 while loading');
 assert.match(home,/const state=ready\?islandChapterState\(chapter,plan\):'locked';/);
});

test('The shared home is touch-friendly, keyboard-reachable and calm for reduced motion',()=>{
 const ui=read('src/components/learning/island/IslandHome.tsx');
 const css=read('src/components/learning/island/island-home.css');
 assert.match(ui,/role="dialog" aria-modal="true"/);
 assert.match(ui,/aria-label="Adalar Evreni’ne dön"/);
 assert.match(ui,/role="progressbar"/);
 assert.match(ui,/lang="en"/,'the greeting is marked as English for screen readers');
 assert.match(ui,/if\(!active\|\|active===document\.body\)heading\.current\?\.focus\(\{preventScroll:true\}\)/,
  'focus moves only when it was lost');
 assert.match(ui,/event\.pointerType!=='mouse'/,'parallax never runs for touch');
 const greet=read('src/components/learning/island/IslandGreeting.tsx');
 assert.match(ui,/useIslandGreeting\(island\)/);
 assert.match(greet,/claimIslandGreeting\(island\)\?setTimeout\(greet,950\):null/);
 assert.match(greet,/soundService\.speakEnglish\(greeting\.en/,'speech respects the central mute and voice volume');
 assert.match(greet,/if\(accepted\)timer\.current=setTimeout\(done,5200\)/,'a cancelled voice never leaves the guide talking');
 // Kelime Bahçesi keeps its own hero but greets the same way.
 assert.match(read('src/components/learning/WordGardenDistrictMap.tsx'),/<IslandGreetingPill island="word_garden"\/>/);
 assert.match(css,/\.ih-greeting-pill\{[^}]*min-height:44px/);
 assert.match(css,/\.ih-back\{[^}]*min-width:44px;min-height:44px/);
 assert.match(css,/\.ih-cta\{[^}]*min-height:54px/);
 assert.match(css,/\.ih-bubble-play\{[^}]*width:44px;height:44px/);
 assert.match(css,/padding:max\(10px,env\(safe-area-inset-top,0px\)\)/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\n \.ih-root \*,\.ih-root \*::before,\.ih-root \*::after\{animation:none!important;transition:none!important\}/);
 for(const id of ['sentence','harbor','writing','academy','story'])
  assert.match(css,new RegExp('\\.ih-root\\[data-island="'+id+'"\\]\\{'),id+' keeps its own palette');
});

test('Writing Workshop chapters and guide are painted WebPs, not emoji cards',()=>{
 const ui=read('src/components/learning/writing/WritingWorkshopAdventure.tsx');
 assert.match(ui,/art:WRITING_ART\+'chapter-'\+ch\.id\+'\.webp'/);
 const hashes=new Set();
 for(let n=1;n<=5;n++){
  const bytes=fs.readFileSync(path.join(web,'public/assets/writing-workshop/chapter-'+n+'.webp'));
  assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.ok(bytes.length>25000&&bytes.length<180000,'chapter '+n+' size '+bytes.length);
  hashes.add(bytes.subarray(0,400).toString('base64'));
 }
 assert.equal(hashes.size,5,'five different scenes');
 const guide=fs.readFileSync(path.join(web,'public/assets/characters/painted/writing-postcat.webp'));
 assert.equal(guide.toString('ascii',12,16),'VP8X');
 assert.ok((guide[20]&0x10)!==0,'guide has a transparent background');
});

test('Section headings use Turkish vowel harmony for every chapter noun',()=>{
 assert.equal(turkishPlural('Bölüm'),'Bölümler');
 assert.equal(turkishPlural('Görev'),'Görevler');
 assert.equal(turkishPlural('Oyun'),'Oyunlar');
 assert.equal(turkishPlural('Durak'),'Duraklar');
});
