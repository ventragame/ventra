import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {WORKSHOP_CHAPTERS,WRITING_WORKSHOP_GAME_ID} from '../src/lib/learning/writingWorkshopEngine.ts';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');

test('All five published chapters have original content and valid local art',()=>{
 assert.equal(WORKSHOP_CHAPTERS.length,5);
 const ids=new Set(WORKSHOP_CHAPTERS.map(c=>c.id));
 assert.equal(ids.size,5);
 const art=new URL('../public/assets/kids-islands/sentence_workshop.webp',import.meta.url);
 const mobile=new URL('../public/assets/kids-islands/sentence_workshop_mobile.webp',import.meta.url);
 assert.ok(fs.statSync(art).size>100000);
 assert.ok(fs.statSync(mobile).size>100000);
});
test('Writing adventure measures independent typing separately from supported tiles',()=>{
 const ui=read('../src/components/learning/writing/WritingWorkshopAdventure.tsx');
 const css=read('../src/components/learning/writing/writing-workshop.css');
 assert.match(ui,/const typed=task.mode==='write'&&firstTry/);
 assert.match(ui,/independentlyTyped:typed/);
 assert.match(ui,/writingAnswers:answerRows/);
 assert.match(ui,/recordGameCompleted\(payload,profileId\)/);
 assert.match(ui,/isWorkshopAnswerCorrect\(task,response\)/);
 assert.match(ui,/onClick=\{submit\}/);
 assert.match(ui,/clearWorkshopCheckpoint/);
 assert.match(ui,/session.current\?\?crypto.randomUUID\(\)/);
 assert.match(ui,/const valid=saved&&saved.step<resumeDeck.length&&matches\?saved:null/);
 assert.match(ui,/getWorkshopTasks\(id,englishLevel,gradeLevel,index\)/);
 assert.match(ui,/role="progressbar"/);
 assert.match(ui,/aria-label="Oluşturduğun İngilizce cevap"/);
 assert.match(ui,/spellCheck=\{false\}/);
 assert.match(ui,/Bu not sadece şu ekranda görünür/);
 assert.doesNotMatch(ui,/fetch\(|MediaRecorder|formData|upload|\.setItem\(.*input/);
 assert.match(css,/min-height:44px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/sentence_workshop_mobile.webp/);
 assert.equal(WRITING_WORKSHOP_GAME_ID,'island_sentence_workshop_writing');
});

test('Writing Workshop uses real profile progress and is mounted through the island game router',()=>{
 const page=read('../src/app/kids/page.tsx');
 assert.match(page,/WritingWorkshopAdventure/);
 assert.match(page,/WRITING_WORKSHOP_GAME_ID/);
 assert.match(page,/setWorkshopCompleted\(workshopCount\)/);
 assert.match(page,/focusedIsland==='sentence_workshop'/);
 assert.match(page,/activeRegion==='sentence_workshop'&&activeProfile/);
 assert.match(page,/onSaved=\{\(\)=>void loadProfileAndProgress\(activeProfile\)\}/);
});

test('Writing Workshop publication is backed by real chapter runner and economy ledger',async()=>{
 const {ARCHIPELAGO_ISLANDS_CATALOG}=await import('../../../packages/shared/src/archipelago.ts');
 const {ENGLISH_JOURNEY}=await import('../src/lib/learning/learningJourney.ts');
 const {WORLD_GAMES,reconcileRewards,initialEconomy}=await import('../src/lib/rewards/economyEngine.ts');
 const island=ARCHIPELAGO_ISLANDS_CATALOG.sentence_workshop;
 assert.equal(island.isUnlockedDefault,true);
 assert.equal(island.contentPublished,true);
 assert.equal(island.totalPublishedRequiredLevels,5);
 assert.equal(ENGLISH_JOURNEY.find(x=>x.id==='sentence_workshop').playable,true);
 const game=WORLD_GAMES.find(g=>g.id===WRITING_WORKSHOP_GAME_ID);
 assert.equal(game?.count,5);
 const at='2026-11-16T00:00:00.000Z';
 const old=initialEconomy('child-a');
 const earned=reconcileRewards(old,[{gameId:WRITING_WORKSHOP_GAME_ID,levelId:1,stars:3}],at);
 const replay=reconcileRewards(earned,[{gameId:WRITING_WORKSHOP_GAME_ID,levelId:1,stars:3}],at);
 assert.deepEqual(replay,earned,'Replaying a chapter cannot mint coins twice');
});

test('Replays use persisted completed play count and the same plan after checkpoint resume',()=>{
 const ui=read('../src/components/learning/writing/WritingWorkshopAdventure.tsx');
 const engine=read('../src/lib/learning/writingWorkshopEngine.ts');
 const checkpoint=read('../src/lib/learning/writingWorkshopCheckpoint.ts');
 assert.match(ui,/setPlayCounts\(runs\)/);
 assert.match(ui,/saved\?\.playIndex\?\?0/);
 assert.match(ui,/getWorkshopTasks\(id,englishLevel,gradeLevel,savedIndex\)/);
 assert.match(ui,/getLegacyWorkshopTasks\(id,englishLevel,gradeLevel,savedIndex\)/);
 assert.match(ui,/writing-arc/);
 assert.match(ui,/writing-guided-clue/);
 assert.match(ui,/playCounts\[id\]\?\?0/);
 assert.match(ui,/setDeck\(planned\);setPlayIndex\(index\)/);
 assert.match(ui,/playIndex,taskIds:deck\.map\(item=>item\.id\)/);
 assert.match(ui,/setPlayCounts\(old=>/);
 assert.match(engine,/WORKSHOP_BONUS_CHAPTERS/);
 assert.match(engine,/WORKSHOP_EXTENDED_CHAPTERS/);
 assert.match(checkpoint,/item\.taskIds\.some\(id=>!id\.startsWith\(prefix\)\)/);
 assert.match(checkpoint,/playIndex\?:number;taskIds\?:string\[\]/);
});


test('P0 visual desk, progressive help and mobile keyboard are separate and child-safe',async()=>{
 const ui=read('../src/components/learning/writing/WritingWorkshopAdventure.tsx');
 const scene=read('../src/components/learning/writing/WritingDeskScene.tsx');
 const css=read('../src/components/learning/writing/writing-workshop.css');
 const guide=await import('../src/lib/learning/writingWorkshopGuidance.ts');
 assert.match(ui,/WritingDeskScene mode=\{task.mode\}/);
 assert.doesNotMatch(ui,/writing-art-icon/);
 assert.match(scene,/data-scene-mode=\{mode\}/);
 assert.match(ui,/onClick=\{showHelp\}/);
 assert.match(ui,/nextWorkshopHintStage\(helpStage\)/);
 assert.match(ui,/onFocus=\{\(\)=>setTypingFocused\(true\)\}/);
 assert.match(ui,/visualViewport/);
 assert.match(ui,/scrollIntoView/);
 assert.match(ui,/autoCorrect="off"/);
 assert.match(ui,/inputMode="text"/);
 assert.match(ui,/enterKeyHint="done"/);
 assert.match(ui,/Klavyeyi kapat/);
 assert.match(css,/data-keyboard-open="true"/);
 assert.match(css,/sentence_workshop_mobile.webp/);
 assert.equal(guide.nextWorkshopHintStage(0),1);
 assert.equal(guide.nextWorkshopHintStage(1),2);
 assert.equal(guide.nextWorkshopHintStage(2),3);
 assert.equal(guide.nextWorkshopHintStage(3),3);
 const words=[{mode:'spell',target:'bridge'},{mode:'assemble',target:'I see a bird.'},{mode:'write',target:'I can see a blue bird.'}];
 for(const word of words){
  const one=guide.workshopHint(word,1);
  const two=guide.workshopHint(word,2);
  const three=guide.workshopHint(word,3);
  assert.equal(one.showAnswer,false);
  assert.equal(two.showAnswer,false);
  assert.equal(three.showAnswer,true);
  assert.ok(!one.description.includes(word.target));
  assert.ok(!two.description.includes(word.target));
 }
 assert.doesNotMatch(ui,/setItem\(.*input|setItem\(.*creative|fetch\(/);
});


test('Hint stage two never reveals a complete one-word typed answer',async()=>{
 const {workshopHint}=await import('../src/lib/learning/writingWorkshopGuidance.ts');
 for(const chapter of WORKSHOP_CHAPTERS){
  for(const level of ['Pre-A1','A1','A2']){
   for(const task of chapter.quests[level]){
    if(task.mode!=='write'||task.target.trim().split(/\s+/).length!==1)continue;
    const hint=workshopHint(task,2);
    assert.equal(hint.showAnswer,false);
    assert.ok(!hint.description.toLocaleLowerCase('en-US').includes(task.target.toLocaleLowerCase('en-US')),'Full answer exposed: '+task.id);
   }
  }
 }
});
