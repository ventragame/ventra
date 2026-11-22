import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {planTempleMission,templeWord,confusableColours} from '../src/lib/learning/templeEngine.ts';
import {economyErrorMessage} from '../src/lib/rewards/economyRepository.ts';

const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');

test('Temple never offers a colour crystal a child cannot tell apart from the answer',()=>{
 assert.ok(confusableColours({en:'purple',domain:'colors'},{en:'violet',domain:'colors'}));
 assert.ok(confusableColours({en:'dark blue',domain:'colors'},{en:'indigo',domain:'colors'}));
 assert.ok(!confusableColours({en:'red',domain:'colors'},{en:'blue',domain:'colors'}));
 assert.ok(!confusableColours({en:'red',domain:'animals'},{en:'red',domain:'colors'}),'only colour swatches are compared');
 let checked=0;
 for(const chamber of ['rune','echo','feast','crown'])for(const stage of [2,3,5])for(const englishLevel of ['Pre-A1','A1','A2'])
  for(let seed=1;seed<=40;seed++){
   const plan=planTempleMission({chamber,stage,englishLevel,gradeLevel:4,history:[],seed});
   for(const q of plan.questions){
    const target=templeWord(q.target);
    for(const option of q.options){
     if(option===q.target)continue;
     assert.ok(!confusableColours(target,templeWord(option)),`${chamber}/${stage}/${seed}: ${target.en} vs ${templeWord(option).en}`);
     checked++;
    }
   }
  }
 assert.ok(checked>1000);
});

test('Help that gives no help is not recorded as assisted; stage 5 help shows the meaning',()=>{
 const family=src('components/learning/activities/FamilyVillageAdventure.tsx');
 assert.match(family,/if\(stage===4\)\{speak\(task\.audio\);setNotice\(\{good:true,text:'🔊 Yönerge okunuyor'\}\);return;\}\n\s*setHint\(true\);speak\(task\.audio\);/);
 assert.match(family,/🔊 \{stage===4\?'Yönergeyi Dinle':'İngilizceyi Duy'\}/);
 const temple=src('components/learning/activities/TempleAdventure.tsx');
 assert.match(temple,/stage===5\?'Anlamı: '\+templeWord\(task\.target\)\.tr:templeWord\(task\.target\)\.en/);
});

test('Animal Meadow celebrates the stars of THIS run, not always three',()=>{
 const ui=src('components/learning/activities/AnimalMeadowAdventure.tsx');
 assert.match(ui,/const animalRunStars=\(wrong:number\):1\|2\|3=>wrong===0\?3:wrong<=2\?2:1;/);
 assert.match(ui,/const stars=animalRunStars\(wrongCount\);/,'saved stars');
 assert.match(ui,/<MeadowPlayStage mode="complete" animals=\{\[\]\} stars=\{animalRunStars\(wrongCount\)\}\/>/,'shown stars');
 const stage=src('components/learning/activities/MeadowPlayStage.tsx');
 assert.doesNotMatch(stage,/⭐ ⭐ ⭐/);
 assert.match(stage,/aria-label=\{stars\+' yıldız ile görev tamamlandı'\}/);
 assert.match(stage,/className=\{n<=stars\?undefined:'am3-victory-star-empty'\}/);
});

test('Colour Grove retries a failed discovery save with the discovery count; Food waits for the last word',()=>{
 assert.match(src('components/learning/activities/ColorGroveAdventure.tsx'),
  /onClick=\{\(\) => void \(step === 1 \? finish\(discovered\.length\) : finish\(correct, finishedAnswers \?\? evidence\)\)\}>Tekrar Kaydet/);
 assert.match(src('components/learning/activities/FoodMarketAdventure.tsx'),/onAdvance:\(\)=>\{void finish\(answers\);\},delayMs:900,speaking\n \}\);/);
});

test('Writing checks the answer on the keyboard Enter/done key; Harbor scene props are not English mistakes',()=>{
 assert.match(src('components/learning/writing/WritingWorkshopAdventure.tsx'),
  /onKeyDown=\{event=>\{if\(event\.key==='Enter'&&!event\.shiftKey&&!event\.nativeEvent\.isComposing\)\{event\.preventDefault\(\);if\(input\.trim\(\)\)submit\(\);\}\}\}/);
 const harbor=src('components/learning/harbor/HarborSpeechAdventure.tsx');
 const scene=harbor.slice(harbor.indexOf('const selectSceneObject='),harbor.indexOf("setSceneSelected(true);"));
 assert.doesNotMatch(scene,/setMistakes/,'a wrong prop never lowers the English score');
 assert.match(scene,/setWrongSceneObjects/);
});

test('The passport explains rejected actions in Turkish and keeps the real reason',()=>{
 assert.equal(economyErrorMessage(new Error('Goal not yet complete')),'Bu görev henüz tamamlanmadı. Biraz daha oyna, sonra tekrar dene!');
 assert.equal(economyErrorMessage(new Error('Yetersiz Ventra Coin')),'Bunun için biraz daha Ventra Coin biriktirmelisin.');
 assert.equal(economyErrorMessage(new Error('Economy transaction rejected')),'İşlem tamamlanamadı. Tekrar deneyebilirsin.');
 assert.equal(economyErrorMessage('x'),'İşlem tamamlanamadı. Tekrar deneyebilirsin.');
 const repo=src('lib/rewards/economyRepository.ts');
 assert.match(repo,/\}catch\(error\)\{failure=error;tx\.abort\(\);\}/);
 assert.match(repo,/reject\(failure\?\?tx\.error\?\?new Error\('Economy transaction rejected'\)\)/);
 const passport=src('components/rewards/KidsPassport.tsx');
 assert.doesNotMatch(passport,/setError\(e instanceof Error\?e\.message/);
 assert.match(passport,/setError\(economyErrorMessage\(e\)\);/);
});
