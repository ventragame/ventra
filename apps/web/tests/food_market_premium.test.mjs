import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MARKET_AISLES,MARKET_LOOKALIKES,MARKET_WORDS,marketLookalike,marketNounPhrase,eligibleMarketWords,planMarketMission} from '../src/lib/learning/foodMarketEngine.ts';

const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');
const ui=()=>src('components/learning/activities/FoodMarketAdventure.tsx');
const css=()=>src('components/learning/activities/food-market-premium.css');
const discovered=(aisle,gradeLevel,englishLevel)=>eligibleMarketWords(aisle,gradeLevel,englishLevel)
 .map(w=>({wordId:w.id,kind:'discovery',mistakes:0,firstTryCorrect:false,timestamp:'2026-11-22T08:00:00.000Z'}));

test('An answer is never offered next to its look-alike (apple/tomato, tea/coffee, juice/lemonade)',()=>{
 for(const [a,b] of MARKET_LOOKALIKES){
  assert.ok(MARKET_WORDS.some(w=>w.id===a)&&MARKET_WORDS.some(w=>w.id===b),a+'/'+b);
  assert.ok(marketLookalike(a,b)&&marketLookalike(b,a));
 }
 assert.ok(!marketLookalike('apple','apple')&&!marketLookalike('apple','banana'));
 // Measured before the fix: 2 799 of 45 360 such questions (6.2%) offered a look-alike.
 let questions=0;
 for(const aisle of MARKET_AISLES)for(const englishLevel of ['Pre-A1','A1','A2'])for(const gradeLevel of [null,1,3,5,7])
  for(const stage of [2,3,4]){
   const history=discovered(aisle.id,gradeLevel,englishLevel);
   for(let seed=1;seed<=40;seed++)for(const q of planMarketMission({aisle:aisle.id,stage,englishLevel,gradeLevel,history,seed}).questions){
    questions++;
    assert.ok(q.options.includes(q.target));
    for(const option of q.options)assert.ok(!marketLookalike(option,q.target),`${aisle.id}/${stage}/${seed}: ${q.target} vs ${option}`);
   }
  }
 assert.ok(questions>20000);
});

test('The basket stall avoids look-alike pairs whenever the aisle has enough other items',()=>{
 let grids=0,pairs=0;
 for(const aisle of MARKET_AISLES)for(const englishLevel of ['A1','A2'])for(const gradeLevel of [null,5,7])for(let seed=1;seed<=40;seed++){
  const plan=planMarketMission({aisle:aisle.id,stage:5,englishLevel,gradeLevel,history:discovered(aisle.id,gradeLevel,englishLevel),seed});
  grids++;
  for(const a of plan.words)for(const b of plan.words)if(a<b&&marketLookalike(a,b))pairs++;
  // Still winnable: distinct targets and two spare products.
  assert.equal(new Set(plan.questions.map(q=>q.target)).size,plan.questions.length);
  assert.ok(plan.words.length>=plan.questions.length+2);
 }
 assert.equal(pairs,0,`${pairs} look-alike pairs in ${grids} stalls`);
});

test('Shopping English matches the pictures: slices take "some", a smoothie is "a smoothie"',()=>{
 assert.equal(marketNounPhrase('cake'),'some cake');
 assert.equal(marketNounPhrase('pizza'),'some pizza');
 assert.equal(marketNounPhrase('watermelon'),'some watermelon');
 assert.equal(marketNounPhrase('smoothie'),'a smoothie');
 assert.equal(marketNounPhrase('egg'),'an egg');
 // The shopkeeper starts a new sentence: "Here you go! A banana."
 assert.match(ui(),/const handOver=\(id:string\)=>\{const phrase=marketNounPhrase\(id\);return `Here you go! \$\{phrase\[0\]\.toUpperCase\(\)\}\$\{phrase\.slice\(1\)\}\.`;\};/);
 assert.doesNotMatch(ui(),/`Here you go! \$\{marketNounPhrase\(id\)\}\.`/);
});

test('Feedback lives in the scene strip and a wrong answer names what was picked, never the answer',()=>{
 const code=ui();
 assert.match(code,/\{toast&&<p className="fm7-toast" data-good=\{toast\.good\} role="status" aria-live="polite">/);
 assert.doesNotMatch(code,/Henüz değil\. Kalan seçeneklere|Yeni İngilizce ürün geliyor|className="fm-feedback/,'one status in the scene, not bars under the answers');
 assert.match(code,/if\(stage===2\)return `\$\{upper\(w\.id\)\} = \$\{w\.tr\}\. Resme yeniden bak\.`;/);
 assert.match(code,/return `\$\{upper\(w\.id\)\} listede ikinci\. Önce ilk ürünü bul!`;/,'right item, wrong order');
 assert.match(code,/return `Bu: \$\{w\.tr\} \(\$\{upper\(w\.id\)\}\)\./);
 assert.match(code,/detail:feedback\.good&&finishing\?'Görev kaydediliyor…':feedback\.detail/);
 const style=css();
 assert.match(style,/\.fm7-screen \.fm4-scenery\{height:clamp\(112px,12vw,136px\)\}/,'the hero picture pushed the answers below the fold');
 assert.match(style,/\.fm7-screen \.fm7-toast\[data-good=false\]\{color:#6b2338;/,'a wrong answer was shown in green');
 assert.match(style,/\.fm7-screen \.fm4-scenery:has\(\.fm7-toast\) \.fm4-scene-label\{visibility:hidden\}/);
});

test('Reward: honest result, tap-to-hear word recap, next button first on short screens',()=>{
 const code=ui();
 assert.match(code,/\{stage===1\?`\$\{answers\.length\} ürünün İngilizcesini dinledin`:/);
 assert.match(code,/`\$\{practised\.length\} doğru · \$\{wrong\} yanlış deneme\$\{assisted\?` · \$\{assisted\} destekli`:''\}`/);
 assert.match(code,/onClick=\{\(\)=>speak\(id\)\} disabled=\{!canHear\}/);
 assert.match(code,/<FoodIllustration id=\{id\} className="fm7-recap-art"\/><span lang="en">\{id\}<\/span><\/button>\)\}/);
 assert.doesNotMatch(code,/Bu görevdeki ilerlemen kaydedildi|English first · No money calculations/);
 // The result card body is a flex column: the recap moves below the buttons on short screens.
 assert.match(css(),/@media\(max-height:940px\)\{\n \.fm7-screen \.fm4-win \.fm7-recap\{order:10;width:100%\}/);
});

test('HUD tools and place in the shared top bar, 12px floor, phone fill, English marked English',()=>{
 const code=ui();
 const hud=code.slice(code.indexOf('<GameTopBar island="garden"'),code.indexOf('<div className="fm-shell'));
 assert.match(hud,/<GardenHelp label="Lezzet Pazarı nasıl oynanır\?">/);
 assert.match(hud,/className="gf-tool" onClick=/);
 assert.doesNotMatch(code,/fm-step-head|fm4-banner|fm-instruction/);
 assert.doesNotMatch(code,/<span>⭐<\/span>/,'the completed step showed a second star under the corner star');
 for(const english of ['<strong lang="en">Explore & listen</strong>','<strong lang="en">What is this in English?</strong>',
  '<strong lang="en">Listen and find it!</strong>','<strong lang="en">Customer says:</strong>','<strong lang="en">Drop it in the basket!</strong>',
  '<span className="fm5-word-label" lang="en">','<span className="fm-product-name" lang="en">'])assert.ok(code.includes(english),english);
 const style=css();
 // The place and progress live in the shared top bar; no second location bar.
 assert.doesNotMatch(code,/gg-quest-location|fm7-scene-count/);
 assert.match(style,/\.fm7-screen \.fm5-dialogue-option>\.fm5-dialogue-option-label\{min-width:26px;height:26px;font-size:13px\}/);
 assert.match(style,/min-height:calc\(100dvh - var\(--fm7-chrome,248px\) - env\(safe-area-inset-bottom,0px\)\)/);
 assert.match(style,/\.fm7-screen \.fm4-activity>:is\(\.fm7-answers,\.fm5-word-choices\)\{width:100%;margin-top:auto\}/);
 // The legibility floor is still imported last.
 const imports=[...code.matchAll(/^import '\.\/([^']+\.css)';/gm)].map(m=>m[1]);
 assert.deepEqual(imports.slice(-3),['garden-quest-navigation.css','food-market-premium.css','garden-child-legibility.css']);
});
