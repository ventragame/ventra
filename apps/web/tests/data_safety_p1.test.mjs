import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {gameActivityLabel} from '../src/lib/progress/activityTitles.ts';
import {WORLD_GAMES} from '../src/lib/rewards/economyEngine.ts';
import {CURRICULUM_SURFACES} from '../src/lib/learning/englishCurriculum.ts';

const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const completion=(profileId,sessionId)=>({
 sessionId,profileId,gameId:'island_word_garden_colors',levelId:1,outcomeId:'en.colors',skillId:'en.colors',
 success:true,starsEarned:3,score:100,completedAt:'2026-11-22T10:00:00.000Z',
 metrics:{durationSeconds:40,attemptsCount:5,accuracyRate:1,wrongAttempts:0,hintsUsed:0}
});

test('A deleted child profile can never receive new progress; the UI switches to the replacement',async()=>{
 const repo=new MemoryProgressRepository();
 const a=await repo.createProfile({nickname:'Ada',avatarId:'avatar_explorer'});
 const b=await repo.createProfile({nickname:'Bora',avatarId:'avatar_explorer'});
 await repo.switchActiveProfile(a.id);
 await repo.recordGameCompleted(completion(a.id,'before-delete'),a.id);
 await repo.deleteProfile(a.id);
 await assert.rejects(repo.recordGameCompleted(completion(a.id,'after-delete'),a.id),/Deleted player profile/);
 const ok=await repo.recordGameCompleted(completion(b.id,'other-child'),b.id);
 assert.equal(ok.isDuplicate,false,'other children keep saving normally');
 const modal=src('components/profile/ProfileSelectorModal.tsx');
 assert.match(modal,/if\(p\.id===activeProfile\?\.id\)\{\n\s*const replacement=await repo\.getActiveProfile\(\);\n\s*if\(replacement\)onProfileSwitched\(replacement\);/);
 assert.match(src('lib/progress/IndexedDBProgressRepository.ts'),/tombstone: \['meta', `tombstone:\$\{profileId\}`\]/);
});

test('Every English game logs its own title, and daily-quest labels match exactly',()=>{
 for(const world of WORLD_GAMES)assert.equal(gameActivityLabel(world.id),world.label,world.id);
 for(const surface of CURRICULUM_SURFACES){
  const label=gameActivityLabel(surface.gameId);
  assert.ok(!/Kesir/.test(label),surface.gameId+' must not be logged as a fractions game');
  assert.notEqual(label,'Ventra İngilizce',surface.gameId+' needs an explicit title');
 }
 assert.equal(gameActivityLabel('kesir_koprusu'),'Kesir Köprüsü','historical records keep their titles');
 assert.match(src('lib/progress/gameCompletionPlan.ts'),/title: `\$\{gameActivityLabel\(payload\.gameId\)\} — Bölüm \$\{payload\.levelId\}`/);
 for(const repo of ['IndexedDBProgressRepository.ts','MemoryProgressRepository.ts']){
  const code=src('lib/progress/'+repo);
  assert.match(code,/planGameCompletion\(\{/,repo+' uses the shared completion plan');
  assert.doesNotMatch(code,/payload\.gameId === 'island_language_academy_atlas' \?/);
 }
});

test('A failed IndexedDB open is retried and other tabs can upgrade the schema',()=>{
 const code=src('lib/progress/IndexedDBProgressRepository.ts');
 assert.match(code,/pending\.catch\(\(\) => \{\n\s*if \(this\.dbPromise === pending\) this\.dbPromise = null;/);
 assert.match(code,/db\.onversionchange = \(\) => \{\n\s*db\.close\(\);\n\s*this\.dbPromise = null;/);
 assert.match(code,/db\.onclose = \(\) => \{/);
});

test('Escape inside a garden game uses the game exit control, which is disabled while saving',()=>{
 const modal=src('components/learning/LearningPathModal.tsx');
 assert.match(modal,/document\.querySelector<HTMLButtonElement>\('\[data-game-exit\]'\)/);
 assert.match(modal,/if \(exit\) \{ if \(!exit\.disabled\) exit\.click\(\); return; \}/);
 const games={
  'components/learning/activities/AnimalMeadowAdventure.tsx':/data-game-exit[^>]*disabled=\{saving\}/,
  'components/learning/activities/ColorGroveAdventure.tsx':/data-game-exit[^>]*disabled=\{saving\}/,
  'components/learning/activities/NumberValleyAdventure.tsx':/data-game-exit[^>]*disabled=\{saving\}/,
  'components/learning/activities/FoodMarketAdventure.tsx':/data-game-exit[^>]*disabled=\{busy\}/,
  'components/learning/activities/FamilyVillageAdventure.tsx':/data-game-exit disabled=\{busy\}/,
  'components/learning/activities/TempleAdventure.tsx':/data-game-exit[^>]*disabled=\{busy\}/,
  'components/learning/themes/ThemeTownAdventure.tsx':/data-game-exit disabled=\{saving\}/,
  'components/learning/alphabet/AlphabetGroveAdventure.tsx':/data-game-exit[^>]*disabled=\{saving\}/
 };
 for(const [file,pattern] of Object.entries(games))assert.match(src(file),pattern,file);
});

test('The app never speaks into an open microphone',()=>{
 const sound=src('lib/audio/SoundService.ts');
 assert.match(sound,/setCaptureActive\(active:boolean\):void\{\n\s*this\.captureActive=active;\n\s*if\(active\)this\.cancelSpeech\(\);/);
 assert.match(sound,/this\.settings\.voice<=0\|\|this\.captureActive\|\|/);
});

test('Harbor and Academy saves keep speaking and completion evidence honest',()=>{
 const harbor=src('components/learning/harbor/HarborSpeechAdventure.tsx');
 assert.match(harbor,/speakingSteps:\{recognized:Math\.min\(recognized,script\.length\),\n\s*tapped:Math\.max\(0,script\.length-recognized\),assisted\}/);
 assert.match(harbor,/<button type="button" disabled=\{busy\}\n\s*onClick=\{\(\)=>\{if\(!busy\)void save\(/);
 const academy=src('components/learning/academy/AcademyAdventure.tsx');
 assert.match(academy,/const runComplete=answers\.length>=plan\.tasks\.length;/);
 assert.match(academy,/if\(busy\|\|pending\.current\|\|runComplete\)return;/);
 assert.doesNotMatch(academy,/academy-submit" disabled=\{busy\|\|!typed\.trim\(\)\}/,'inputs lock after the run is complete');
 assert.match(academy,/\{saveError\}<button type="button" disabled=\{busy\}/);
});

test('Full-screen games keep their exit controls out of the iOS status bar',()=>{
 const css={
  'components/learning/harbor/harbor-premium-scene.css':/\.harbor-root \.harbor-header\{padding-top:max\(10px,env\(safe-area-inset-top,0px\)\)\}/,
  'components/learning/writing/writing-workshop.css':/\.writing-root \.writing-header\{padding-top:max\(9px,env\(safe-area-inset-top,0px\)\)\}/,
  'components/learning/academy/academy-adventure.css':/\.academy-root \.academy-back\{min-height:44px;min-width:44px\}/,
  'components/learning/sentence/sentence-plaza.css':/\.sp-overlay\{padding-top:env\(safe-area-inset-top,0px\)/,
  'components/learning/sentence/movement-magic.css':/\.mm-root\{padding-top:env\(safe-area-inset-top,0px\)/,
  'components/learning/sentence/wish-festival.css':/\.wf-root\{padding-top:env\(safe-area-inset-top,0px\)/,
  'components/learning/sentence/lantern-festival.css':/\.lf-root\{padding-top:env\(safe-area-inset-top,0px\)/
 };
 for(const [file,pattern] of Object.entries(css))assert.match(src(file),pattern,file);
});

test('The Kids home never shows a failed or stale progress read as zero or as another child',()=>{
 const kids=src('app/kids/page.tsx');
 assert.match(kids,/const load = \+\+progressLoadRef\.current;/);
 assert.match(kids,/if\(stale\(\)\)return;\n\s*let harborCount=0;/);
 assert.match(kids,/useState<number\|null>\(null\);\n\s*const \[workshopCompleted/);
 assert.match(kids,/setTotalStars\(null\);setCoinBalance\(null\);/);
 assert.match(kids,/harborCompleted===null\?'İlerleme okunamadı'/);
 assert.match(kids,/\{totalStars\?\?'—'\}/);
});

test('Functional labels measured at 11px on 320px phones have readable floors',()=>{
 assert.match(src('components/learning/harbor/harbor-premium-scene.css'),/\.harbor-root \.hp-replay\{font-size:13px;min-height:44px\}/);
 assert.match(src('components/learning/writing/writing-workshop.css'),/\.writing-root \.writing-learning-tools button\{font-size:13px;min-height:44px\}/);
 assert.match(src('components/learning/academy/academy-adventure.css'),/\.academy-root \.academy-zone-text>span:last-child\{font-size:12px\}/);
 assert.match(src('components/learning/sentence/sentence-plaza-v2.css'),/\.sp-v2-details>summary\{min-height:44px;/);
});

test('Deleting a child profile needs the parental gate; Escape and cancel never delete',()=>{
 const modal=src('components/profile/ProfileSelectorModal.tsx');
 assert.doesNotMatch(modal,/window\.confirm/,'no one-tap browser confirm');
 assert.match(modal,/setError\(''\);setDeleteCandidate\(p\);/);
 assert.match(modal,/<ParentalGateModal isOpen zIndex=\{140\} tone="danger"/);
 assert.match(modal,/onSuccess=\{\(\)=>\{const target=deleteCandidate;setDeleteCandidate\(null\);void deleteConfirmedProfile\(target\);\}\}/);
 assert.equal(modal.match(/repo\.deleteProfile\(/g).length,1,'deletion has a single entry point');
 assert.match(modal.slice(modal.indexOf('async function deleteConfirmedProfile')),/^async function deleteConfirmedProfile\(p:PlayerProfile\)\{\n\s*if\(busy\)return;/);
 assert.match(modal,/e\.key==='Escape'&&!busy&&!deleteCandidate/,'Escape closes the gate first, not the whole selector');
 const gate=src('components/profile/ParentalGateModal.tsx');
 assert.match(gate,/title = 'Ebeveyn Doğrulaması'/);
 assert.match(gate,/confirmLabel = 'Onayla'/);
 assert.match(gate,/if \(e\.key === 'Escape'\) \{ e\.stopPropagation\(\); onClose\(\); \}/);
 const buttons=[...gate.matchAll(/<button[\s\S]*?className=\{?['"]([^'"]*)/g)].map(m=>m[1]);
 assert.ok(buttons.length>=6,'question, PIN, e-mail and lock controls');
 for(const cls of buttons)assert.match(cls,/min-h-1[12](?![0-9])/,'every gate button is a 44px+ touch target: '+cls.slice(0,40));
});
