import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {journeyEffort,journeyStars} from '../src/lib/learning/storyForestJourneyEngine.ts';
import {storyRewardPraise,storyRewardStats} from '../src/lib/learning/storyRewardSummary.ts';

const src=p=>fs.readFileSync(new URL('../src/'+p,import.meta.url),'utf8').replace(/\r\n/g,'\n');

test('Story reward summary: praise follows the stars, stats name retries and hints',()=>{
 assert.equal(storyRewardPraise(3),'Muhteşem! Her şeyi ilk denemede buldun.');
 assert.equal(storyRewardPraise(2),'Çok iyi! Hikâyeyi neredeyse hatasız çözdün.');
 assert.equal(storyRewardPraise(1),'Başardın! Tekrar oynarsan daha çok yıldız toplarsın.');
 assert.equal(storyRewardStats(0,0),'✓ Hepsi ilk denemede');
 assert.equal(storyRewardStats(3,0),'↻ 3 yeniden deneme');
 assert.equal(storyRewardStats(1,2),'↻ 1 yeniden deneme · 💡 2 ipucu');
});

test('Hikâyeyi Keşfet: effort counts both finds and every learning check; stars use the same numbers',()=>{
 const record={routeId:'journey-1',episode:1,object:'apple',destination:'pond',firstMistakes:1,secondMistakes:0,
  firstHint:false,secondHint:true,completedAt:new Date().toISOString(),
  learningChecks:[{mistakes:2,hintUsed:false},{mistakes:0,hintUsed:true}]};
 assert.deepEqual(journeyEffort(record),{mistakes:3,hints:2});
 assert.equal(journeyStars(record),1);
 assert.equal(journeyStars({...record,firstMistakes:0,secondHint:false,learningChecks:[]}),3);
});

test('All three story games end with the summary and the story sentences to hear again',()=>{
 const forest=src('components/learning/story/StoryForestAdventure.tsx');
 assert.match(forest,/\{rewardRecord&&<StoryRewardSummary stars=\{earnedStars\} \{\.\.\.journeyEffort\(rewardRecord\)\}\/>\}/);
 assert.match(forest,/lines=\{\(\['opening','meet','result','ending'\] as const\)\.map\(step=>narrativeFor\(plan,step,/);
 const sequence=src('components/learning/story/StorySequenceAdventure.tsx');
 assert.match(sequence,/lines=\{deck\?deck\.frames\.map\(frame=>frame\.narration\[deck\.englishLevel\]\):\[\]\}/);
 // A finished story can be replayed at once, not only the next one.
 assert.match(sequence,/onClick=\{\(\)=>start\(episode\)\}>↻ Tekrar Oyna<\/button>/);
 const detective=src('components/learning/story/StoryDetectiveAdventure.tsx');
 assert.match(detective,/<StoryRewardSummary stars=\{stars\} mistakes=\{answers\.reduce\(\(n,a\)=>n\+a\.mistakes,0\)\}/);
 assert.match(detective,/detectiveAdventureNarration\(plan,'ending',route\?\?undefined\)/);
 // A case in play has a page heading; the chapter list keeps its cover h1.
 assert.match(detective,/<h1 className="sd-header-title">\{chapter\?\.title\?\?'Hikâye Dedektifi'\}<\/h1>\}/);
 const recap=src('components/learning/story/StoryRewardRecap.tsx');
 // Lines are spoken on demand only and speech stops when the screen closes.
 assert.match(recap,/useEffect\(\(\)=>\(\)=>\{request\.current\+\+;soundService\.cancelSpeech\(\);\},\[\]\);/);
 assert.match(recap,/aria-label=\{line\+' cümlesini dinle'\}/);
 const css=src('components/learning/story/story-reward-recap.css');
 // Tall rewards scroll instead of clipping their top (auto margins, not justify-content).
 assert.match(css,/\.sj-root \.sj-reward,\.sd-root \.sd-reward\{overflow-y:auto;overscroll-behavior:contain;justify-content:flex-start;/);
 assert.match(css,/\.story-recap-line\{width:100%;min-height:44px;/);
});

test('Cümle Meydanı: readable builder hint and reward note on every theme',()=>{
 const css=src('components/learning/sentence/sentence-quest-unified.css');
 assert.match(css,/\.sq-builder-instruction\{margin:0;padding:7px 12px;border-radius:12px;background:rgba\(255,253,242,\.94\);/);
 assert.match(css,/\.sq-reward-note\.sq-reward-note\{border:1px solid #a3d5a3;background:#e7fae8;color:#245a48;/);
});

test('Cümle Meydanı: screens open at their top and the scene copy fits phones',()=>{
 const plaza=src('components/learning/sentence/SentencePlazaAdventure.tsx');
 assert.match(plaza,/useEffect\(\(\)=>\{root\.current\?\.scrollTo\(\{top:0,behavior:'instant'\}\);\},\[screen,mission\]\);/);
 assert.doesNotMatch(plaza,/Soldaki sahnede/);
 assert.match(src('components/learning/sentence/MovementMagicAdventure.tsx'),/useEffect\(\(\)=>\{rootRef\.current\?\.scrollTo\(\{top:0,behavior:'instant'\}\);\},\[phase\]\);/);
 assert.match(src('components/learning/sentence/WishFestivalAdventure.tsx'),/useEffect\(\(\)=>\{root\.current\?\.scrollTo\(\{top:0,behavior:'instant'\}\);\},\[screen\]\);/);
 assert.match(src('components/learning/sentence/LanternFestivalAdventure.tsx'),/useEffect\(\(\)=>\{root\.current\?\.scrollTo\(\{top:0,behavior:'instant'\}\);\},\[phase\]\);/);
 const scene=src('components/learning/sentence/SentencePlazaScene.tsx');
 assert.match(scene,/'under the tree':\{left:'16%',top:'71%',tip:'below'\}/);
 assert.match(src('components/learning/sentence/sentence-plaza-learning-v7.css'),/\.sp-v6-hotspot\[data-tip=below\] \.sp-v6-hotspot-tooltip\{bottom:auto;top:calc\(100% \+ 4px\)\}/);
 assert.match(src('components/learning/sentence/sentence-plaza.css'),/\.sp-reward>\.learning-motion\{bottom:auto;height:min\(440px,62%\)\}/);
});

test('Cümle Meydanı: Hareket Büyüsü and İstekler Meydanı lead straight to the next mission',()=>{
 const plaza=src('components/learning/sentence/SentencePlazaAdventure.tsx');
 assert.match(plaza,/onNext=\{\(\)=>\{setMovementOpen\(false\);openMission\(5\);\}\} nextLabel=\{SENTENCE_PLAZA_MISSIONS\[4\]\.title\}/);
 assert.match(plaza,/onNext=\{\(\)=>\{setWishOpen\(false\);openMission\(6\);\}\} nextLabel=\{SENTENCE_PLAZA_MISSIONS\[5\]\.title\}/);
 for(const file of ['MovementMagicAdventure.tsx','WishFestivalAdventure.tsx']){
  const code=src('components/learning/sentence/'+file);
  assert.match(code,/onNext\?:\(\)=>void;nextLabel\?:string;/,file);
  assert.match(code,/✦ Sıradaki Görev\{nextLabel\?': '\+nextLabel:''\} →/,file);
 }
});

test('Festival games mark a wrong pick on the option itself, not only in a message below the fold',()=>{
 const move=src('components/learning/sentence/MovementMagicAdventure.tsx');
 assert.match(move,/setWrongVerb\(action\);\n   incorrect\(/);
 assert.match(move,/data-wrong=\{wrongVerb===item\.id\|\|undefined\}/);
 assert.match(src('components/learning/sentence/MovementMagicStage.tsx'),/data-wrong=\{wrongPlace===id\|\|undefined\}/);
 const wish=src('components/learning/sentence/WishFestivalAdventure.tsx');
 assert.match(wish,/setWrongPick\('food:'\+food\);wrong\(/);
 assert.match(wish,/data-wrong=\{wrongPick==='intent:'\+o\.id\|\|undefined\}/);
 assert.match(src('components/learning/sentence/WishFestivalStage.tsx'),/data-wrong=\{wrongFood===item\.id\|\|undefined\}/);
 const lantern=src('components/learning/sentence/LanternFestivalAdventure.tsx');
 assert.match(lantern,/setWrongPick\('color:'\+color\);wrong\(/);
 assert.match(lantern,/data-wrong=\{wrongPick==='animal:'\+a\.id\|\|undefined\}/);
 const stage=src('components/learning/sentence/LanternFestivalStage.tsx');
 assert.equal((stage.match(/data-wrong=\{wrongPlace===p\.id\|\|undefined\}/g)||[]).length,2,'map pins and the phone list');
 // Each new round starts clean.
 assert.match(move,/setWrongVerb\(null\);setWrongPlace\(null\);/);
 assert.match(wish,/setWrongSlot\(-1\);setWrongPick\(null\);/);
 assert.match(lantern,/setWrongSlot\(-1\);setWrongPick\(null\);/);
 const css=src('components/learning/sentence/sentence-quest-unified.css');
 assert.match(css,/:is\(\.wf-food-button,\.wf-intent-choice,\.lf-color-choice,\.lf-animal-choice,\.lf-place\)\[data-wrong=true\]/);
 assert.match(src('components/learning/sentence/movement-magic.css'),/\.mm-verb\[data-wrong=true\],\.mm-verb\[data-wrong=true\]:hover:not\(:disabled\)\{/);
});
