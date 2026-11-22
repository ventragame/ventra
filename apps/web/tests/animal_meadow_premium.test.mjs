import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ANIMAL_MEADOW_WORDS,planAnimalMission,animalsConfusable,ANIMAL_CONFUSABLE_GROUPS} from '../src/lib/learning/animalMissionEngine.ts';
import {FIRST_PLAY_LESSONS} from '../src/lib/learning/firstPlayTutorial.ts';

const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const discovered=ids=>ids.map(wordId=>({wordId,kind:'discovery',mistakes:0,firstTryCorrect:false,timestamp:'2026-11-22T08:00:00.000Z'}));

test('A general word is never offered next to an animal that is also one (bird/duck, fish/shark, cat/lion, dog/wolf)',()=>{
 assert.ok(animalsConfusable('bird','duck')&&animalsConfusable('penguin','bird'));
 assert.ok(animalsConfusable('fish','shark')&&animalsConfusable('fish','dolphin'));
 assert.ok(animalsConfusable('cat','lion')&&animalsConfusable('dog','wolf'));
 assert.ok(!animalsConfusable('duck','owl'),'two kinds of bird are different words');
 assert.ok(!animalsConfusable('cat','dog')&&!animalsConfusable('bird','bird'));
 for(const group of ANIMAL_CONFUSABLE_GROUPS)for(const id of group)
  assert.ok(ANIMAL_MEADOW_WORDS.some(word=>word.id===id),'unknown animal '+id);
 // Measured before the fix: 1 632 of 55 200 such questions (3.0%) were ambiguous.
 const history=discovered(ANIMAL_MEADOW_WORDS.map(word=>word.id));
 let questions=0;
 for(const englishLevel of ['Pre-A1','A1','A2'])for(const gradeLevel of [null,2,4,7])for(const mission of [2,3,4,5])
  for(let seed=1;seed<=60;seed++){
   for(const q of planAnimalMission({mission,history,seed,gradeLevel,englishLevel}).questions){
    questions++;
    assert.ok(q.choices.includes(q.target));
    assert.equal(new Set(q.choices).size,q.choices.length);
    for(const choice of q.choices)
     assert.ok(!animalsConfusable(choice,q.target),`${englishLevel}/${gradeLevel}/${mission}/${seed}: ${q.target} vs ${choice}`);
   }
  }
 assert.ok(questions>10000);
});

test('A tiny collection of birds is topped up with starter animals instead of ambiguous choices',()=>{
 const history=discovered(['bird','duck','owl']);
 for(let seed=1;seed<=40;seed++){
  for(const q of planAnimalMission({mission:2,history,seed,englishLevel:'A1',gradeLevel:4}).questions){
   assert.ok(q.choices.length>=2,'still a real choice');
   for(const choice of q.choices)assert.ok(!animalsConfusable(choice,q.target),q.target+' vs '+choice);
  }
 }
});

test('Feedback lives in the scene and the celebration never covers words or answers',()=>{
 const stage=src('components/learning/activities/MeadowPlayStage.tsx');
 assert.match(stage,/toast\?:\{text:string;good:boolean;detail\?:string\}\|null;/);
 assert.match(stage,/<p className="am3-toast" data-good=\{toast\.good\} role="status" aria-live="polite">/);
 const ui=src('components/learning/activities/AnimalMeadowAdventure.tsx');
 assert.match(ui,/toast=\{feedback\?\{text:feedback\.text,good:feedback\.good,/);
 assert.doesNotMatch(ui,/am3-feedback|Sıradaki hayvan keşfediliyor/,'one in-scene status, not two bars below the scene');
 const css=src('components/learning/activities/animal-meadow-premium.css');
 assert.match(css,/\.am-shell \.am3-stage \.am3-motion-layer\{z-index:0\}/);
 assert.match(css,/\.am-shell \.am3-victory,\.am-shell \.am3-rescue-success\{position:relative;z-index:2\}/);
 assert.match(css,/\.am-shell \.am3-choice\[data-correct=true\]\{animation:am3-pop/);
 assert.match(css,/\.am-shell \.am3-choice\[data-wrong=true\]\{[^}]*animation:am3-shake/);
 // The legibility floor stays the last stylesheet.
 const imports=[...ui.matchAll(/^import '\.\/([^']+\.css)';/gm)].map(m=>m[1]);
 assert.deepEqual(imports.slice(-2),['animal-meadow-premium.css','garden-child-legibility.css']);
});

test('Phones: help joins the HUD, the scene fills the screen and answers sit in the thumb zone',()=>{
 const ui=src('components/learning/activities/AnimalMeadowAdventure.tsx');
 const hud=ui.slice(ui.indexOf('<div className="am-hud-actions">'),ui.indexOf('</header>'));
 assert.match(hud,/<details className="am3-help">/,'help is a HUD tool, not a row of its own');
 const css=src('components/learning/activities/animal-meadow-premium.css');
 assert.match(css,/\.am-shell \.am3-stage\{display:flex;flex-direction:column;min-height:calc\(100dvh - var\(--am3-chrome,258px\)\)\}/);
 assert.match(css,/\.am-shell \.am3-choices\{margin-top:auto\}/);
 assert.match(css,/\.am-shell \.am-hud\{flex-wrap:nowrap;gap:6px\}/);
 assert.match(css,/@media\(max-height:820px\)\{\s*\.am-shell \.am-done\{display:flex;flex-direction:column\}\s*\.am-shell \.am-done \.am-recap\{order:10\}/,
  'the next-mission button stays on the first screen of short laptops and phones');
 assert.match(css,/\.am-shell \.am-hud-title small,\.am-shell \.am-quest-head,\.am-shell \.am-task-hint\{font-size:12px\}/);
});

test('The reward screen recaps the mission words; the album shows silhouettes and progress',()=>{
 const ui=src('components/learning/activities/AnimalMeadowAdventure.tsx');
 assert.match(ui,/const recap:AnimalWord\[\]=\(activePlan\?\(stage===1\?activePlan\.animals:Array\.from\(new Set\(activePlan\.questions\.map\(q=>q\.target\)\)\)\):\[\]\)/);
 assert.match(ui,/onClick=\{\(\)=>speak\(word\)\} disabled=\{!canSpeak\(word\)\} aria-label=\{`\$\{word\.tr\}, İngilizce \$\{word\.id\}, dinle`\}>/);
 assert.match(ui,/\{stage===1\?`\$\{discovered\.length\} hayvanın İngilizce adını dinledin`:`\$\{correctCount\} doğru · \$\{wrongCount\} yanlış deneme`\}/);
 assert.doesNotMatch(ui,/doğru\/keşif/);
 assert.match(ui,/className="am-silhouette h-16 w-16 object-contain sm:h-20 sm:w-20"/);
 assert.match(ui,/\{albumCount\}\/\{ANIMAL_MEADOW_WORDS\.length\} dost keşfedildi/);
});

test('The first-play lesson uses the meadow\'s own 3D animals and promises only what the game does',()=>{
 const lesson=FIRST_PLAY_LESSONS.animals;
 for(const choice of lesson.choices)assert.match(choice.image,/^\/assets\/animals\/fluent-3d\/[a-z]+\.png$/);
 assert.ok(lesson.choices.every(choice=>fs.existsSync(new URL('../public'+choice.image,import.meta.url))));
 assert.doesNotMatch(lesson.steps[0].prompt,/yürüyecek/);
});

test('English words keep English capitals on a Turkish page (BIRD, FIVE, not BİRD, FİVE)',()=>{
 // CSS text-transform follows the text's language; lang="tr" turned i into İ.
 const meadow=src('components/learning/activities/MeadowPlayStage.tsx');
 assert.match(meadow,/<span className="am3-word-choice" lang="en">/);
 assert.match(meadow,/<span className="am3-caption" lang=\{showName\?'en':undefined\}>/);
 const animal=src('components/learning/activities/AnimalMeadowAdventure.tsx');
 assert.match(animal,/<h2 ref=\{questionHeading\} className="am-task-title" tabIndex=\{-1\} lang="en">/);
 assert.match(animal,/<span className="mt-1 text-xs font-black uppercase" lang=\{unlocked\?'en':undefined\}>/);
 assert.match(src('components/learning/activities/NumberValleyAdventure.tsx'),/<span lang="en">\{tile\.part\}<\/span>/);
 assert.match(src('components/learning/activities/NumberValleyAdventure.tsx'),/<span lang="en">\{englishNumber\(value\)\}<\/span>/);
 assert.match(src('components/learning/alphabet/AlphabetGroveAdventure.tsx'),/<span lang="en">\{wordTiles\[i\]\?\?'·'\}<\/span>/);
 assert.match(src('components/learning/activities/FamilyVillageAdventure.tsx'),/lang=\{mode==='english'\|\|mode==='phrase'\?'en':undefined\}/);
 assert.match(src('components/profile/StarterPlacementCheck.tsx'),/<span lang="en">\{choice\}<\/span>/);
});
