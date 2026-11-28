import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {VILLAGE_DISTRICTS,VILLAGE_LOOKALIKES,VILLAGE_WORDS,villageLookalike,eligibleVillageWords,planVillageMission} from '../src/lib/learning/familyVillageEngine.ts';

const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const ui=()=>src('components/learning/activities/FamilyVillageAdventure.tsx');
const css=()=>src('components/learning/activities/family-village-premium.css');

test('An answer is never offered next to a picture it could fairly be (every meal is a child at a plate)',()=>{
 for(const [a,b] of VILLAGE_LOOKALIKES){
  assert.ok(VILLAGE_WORDS.some(w=>w.id===a)&&VILLAGE_WORDS.some(w=>w.id===b),a+'/'+b);
  assert.equal(VILLAGE_WORDS.find(w=>w.id===a).district,VILLAGE_WORDS.find(w=>w.id===b).district,'same district: '+a);
  assert.ok(villageLookalike(a,b)&&villageLookalike(b,a));
 }
 assert.ok(villageLookalike('have lunch','have dinner')&&villageLookalike('door','wardrobe'));
 assert.ok(!villageLookalike('kitchen','kitchen')&&!villageLookalike('wake up','go to bed'),'sun and moon are told apart');
 // Measured before the fix: 1 956 of 80 640 such questions (2.4%).
 let questions=0;
 for(const d of VILLAGE_DISTRICTS)for(const englishLevel of ['Pre-A1','A1','A2'])for(const gradeLevel of [null,1,3,5,7])
  for(const stage of [2,3,4,5]){
   const history=eligibleVillageWords(d.id,gradeLevel,englishLevel)
    .map(w=>({wordId:w.id,kind:'discovery',mistakes:0,firstTryCorrect:false,hintUsed:false,timestamp:'2026-11-22T08:00:00.000Z'}));
   for(let seed=1;seed<=30;seed++)for(const q of planVillageMission({district:d.id,stage,englishLevel,gradeLevel,history,seed}).questions){
    questions++;
    assert.ok(q.options.includes(q.target));
    for(const option of q.options)assert.ok(!villageLookalike(option,q.target),`${d.id}/${stage}/${seed}: ${q.target} vs ${option}`);
    // "Don't touch the X. Touch the Y.": X is never a look-alike of Y either.
    if(q.prompt.startsWith("Don't "))assert.ok(!VILLAGE_LOOKALIKES.some(([a,b])=>q.prompt.includes(a)&&q.prompt.includes(b)),q.prompt);
   }
  }
 assert.ok(questions>30000);
});

test('Feedback lives in the scene strip; a wrong answer names what was picked, never the answer',()=>{
 const code=ui();
 assert.match(code,/\{toast&&<p className="fv7-toast" data-good=\{toast\.good\} role="status" aria-live="polite">/);
 assert.doesNotMatch(code,/className="fv-notice"|Sıradaki İngilizce soruya geçiliyor|Kalan seçeneklere dikkatlice bak/,'one status in the scene, not bars under the answers');
 assert.match(code,/if\(stage===2\|\|stage===5\)return `\$\{upper\(w\.id\)\} = \$\{w\.tr\}\. Resme yeniden bak\.`;/);
 assert.match(code,/return `Bu: \$\{w\.tr\} \(\$\{upper\(w\.id\)\}\)\. \$\{stage===4\?'Yönergeyi yeniden oku\.':'Yeniden dinle\.'\}`;/);
 assert.match(code,/detail:notice\.good&&finishing\?'Görev kaydediliyor…':notice\.detail/);
 assert.doesNotMatch(code,/GÖREV \{VILLAGE_OFFSETS\[district\]\+stage\} \/ 20/,'the mission pill covered the grandmother');
 const style=css();
 assert.match(style,/\.fv5-screen\.fv7-screen \.fv5-scene\{height:clamp\(112px,10vw,136px\)\}/);
 assert.match(style,/\.fv7-screen \.fv7-toast\[data-good=false\]\{color:#6b2338;/);
});

test('Navigation art is legible: district icons render, crops without stray letters, crisp step icons',()=>{
 const code=ui();
 // Districts keep their painted village icons inside the shared step rail.
 assert.match(code,/icon:<span className=\{`fv-district-art fv-district-art-\$\{part\.id\}`\}\/>/);
 // Stages use the crisp stage emoji (the reference crops were half a house, half a speech bubble).
 assert.match(code,/stages=\{VILLAGE_STAGES\.map\(item=>\(\{key:String\(item\.stage\),label:item\.title,icon:item\.icon,/);
 const style=css();
 assert.match(style,/\.fv7-screen \.gf-step \.fv-district-art\{display:block;width:28px;height:28px;\n background:url\('\/assets\/family-village\/reference-v5\/village-ref-icons\.webp'\) no-repeat;background-size:900% 100%\}/);
 assert.match(style,/\.fv7-screen \.fv-district-art-objects\{width:18px;background-size:1380% 100%;background-position:23\.96% 50%\}/,'"E Ö" letters next to the backpack');
});

test('One help in the header with the sound button; reward is honest with a tap-to-hear recap',()=>{
 const code=ui();
 assert.equal((code.match(/<GardenHelp/g)||[]).length,1,'two help buttons on one screen');
 const top=code.slice(code.indexOf('<GameTopBar island="garden"'),code.indexOf('<div className="fv-shell'));
 assert.match(top,/<GardenHelp label="Nasıl Oynanır\?">/);
 assert.match(top,/className="gf-tool fv-audio-toggle"/);
 assert.doesNotMatch(code,/className="fv-footer|Görev ilerlemen kaydedildi/);
 assert.match(code,/\{stage===1\?`\$\{answers\.length\} kelimenin İngilizcesini dinledin`:/);
 assert.match(code,/`\$\{practised\.length\} doğru · \$\{mistakes\} yanlış deneme\$\{assisted\?` · \$\{assisted\} destekli`:''\}`/);
 assert.match(code,/onClick=\{\(\)=>speak\(stage===5\?villageWord\(id\)\.phrase:id\)\} disabled=\{!canHear\}/);
 assert.match(code,/<FamilyWordArt id=\{id\}\/><\/span><span lang="en">\{id\}<\/span><\/button>\)\}/);
 assert.match(css(),/@media\(max-height:940px\)\{\n \.fv7-screen \.fv3-celebrate \.fv7-recap\{order:10;width:100%\}/);
});

test('English marked English, place in the shared top bar, phone fill and 12px floor',()=>{
 const code=ui();
 for(const english of ['<strong lang="en">Explore and listen!</strong>','<strong lang="en">What\'s this in English?</strong>',
  '<strong lang="en">Listen and find it!</strong>','<strong className="fv-english" lang="en">{task.prompt}</strong>',
  '<strong lang="en">Say it in English!</strong>','<strong lang="en">{id}</strong><small>{villageWord(id).tr}</small>'])assert.ok(code.includes(english),english);
 const style=css();
 // Place and progress are in the shared top bar; the old location bar and meter are gone.
 assert.doesNotMatch(code,/gg-quest-location|fv5-hud-progress|fv7-scene-count/);
 assert.match(style,/min-height:calc\(100dvh - var\(--fv7-chrome,238px\) - env\(safe-area-inset-bottom,0px\)\)/);
 assert.match(style,/\.fv5-screen\.fv7-screen \.fv5-activity>\.fv5-answer-grid,\.fv5-screen\.fv7-screen \.fv5-activity>\.fv-grid-discover\{width:100%;margin-top:auto\}/);
 const imports=[...code.matchAll(/^import '\.\/([^']+\.css)';/gm)].map(m=>m[1]);
 assert.deepEqual(imports.slice(-3),['garden-quest-navigation.css','family-village-premium.css','garden-child-legibility.css']);
});
