import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {plazaCurriculumPool,planPlazaMission} from '../src/lib/learning/sentencePlazaEngine.ts';
import {sentenceStart,visibleWord,visibleRepairWord} from '../src/components/learning/sentence/sentencePresentation.ts';
import {movementMagicPool} from '../src/lib/learning/movementMagicEngine.ts';
import {wishFestivalPool,WISH_FOODS} from '../src/lib/learning/wishFestivalEngine.ts';
import {lanternCurriculumPool} from '../src/lib/learning/lanternFestivalEngine.ts';

const source=name=>fs.readFileSync(new URL('../src/components/learning/sentence/'+name,import.meta.url),'utf8');
const isUpperFirst=value=>/^[A-ZÇĞİÖŞÜ]/u.test(value);

test('All 18 mission/placement pools have capitalized, clearly targetable Turkish cues',()=>{
 let repairs=0;
 for(const level of ['Pre-A1','A1','A2'])for(let mission=1;mission<=6;mission++){
  const pool=plazaCurriculumPool(mission,level);
  assert.ok(pool.length>=15);
  for(const task of pool){
   assert.ok(isUpperFirst(task.cue),task.id+': '+task.cue);
   assert.ok(/^[A-Z]/.test(task.sentence),task.id+': '+task.sentence);
   assert.ok(task.cue.length>=12);
   if(task.mode==='repair'){
    repairs++;
    assert.ok(task.brokenSentence?.length);
    assert.ok(isUpperFirst(task.brokenSentence),task.id);
    assert.equal(task.brokenSentence.endsWith('?'),task.sentence.endsWith('?'),task.id);
    const repaired=task.brokenSentence.replace(/[.,!?]/g,'').split(/\s+/);
    assert.equal(repaired.length,task.tokens.length);
    const differences=repaired.flatMap((w,i)=>w===task.tokens[i]?[]:[i]);
    assert.equal(differences.length,1,'Exactly one change: '+task.id);
    const [index]=differences;
    assert.ok(index>0);
    assert.notEqual(repaired[index],'are','Do not use nonsensical filler repairs: '+task.id);
    assert.equal(repaired[0],task.tokens[0]);
   }
  }
 }
 assert.ok(repairs>40,'Substantial repair coverage across grade bands');
});

test('Child-facing sentence typography keeps engine words untouched',()=>{
 assert.equal(sentenceStart('köpek evin arkasında mı?'),'Köpek evin arkasında mı?');
 assert.equal(sentenceStart('ışık yanıyor.'),'Işık yanıyor.');
 assert.equal(sentenceStart('çilek'),'Çilek');
 assert.equal(visibleWord('the',0),'The');
 assert.equal(visibleWord('dog',2),'dog');
 assert.equal(visibleRepairWord('is',0,5,'Is the dog behind the house?'),'Is');
 assert.equal(visibleRepairWord('house',5,6,'Is the dog behind the house?'),'house?');
 assert.equal(visibleRepairWord('dog',2,3,'The dog runs.'),'dog.');
});

test('All four sentence adventures clarify repairs, first-word case and progression',()=>{
 const plaza=source('SentencePlazaAdventure.tsx');
 const move=source('MovementMagicAdventure.tsx');
 const wish=source('WishFestivalAdventure.tsx');
 const lantern=source('LanternFestivalAdventure.tsx');
 for(const ui of [plaza,move,wish,lantern]){
  assert.match(ui,/sentenceStart\(question\.cue\)|sentenceStart\(task\.cue\)/);
  assert.match(ui,/visibleWord\(/);
  assert.match(ui,/saveSentencePlazaMission/);
  assert.match(ui,/sentence-clarity-v3\.css/);
 }
 for(const ui of [plaza,move,lantern])assert.match(ui,/visibleRepairWord/);
 assert.match(plaza,/Bu İngilizce cümlede bir kelime yanlış/);
 assert.match(plaza,/Yukarıdaki Türkçe anlamla karşılaştır/);
 assert.match(plaza,/taskReady\?<\>/);
 assert.match(plaza,/sp-v3-waiting/);
 assert.match(plaza,/nextTimer\.current=setTimeout/);
 assert.match(plaza,/src=\{`\/assets\/sentence-plaza\/v5\/mission-/);
 assert.match(move,/İngilizce cümlede bir dil bilgisi hatası var/);
 assert.match(lantern,/İngilizce cümlede bir dil bilgisi hatası var/);
 assert.match(wish,/wf-compact-help/);
});

test('V3 ships real original local WebP files, never references missing artwork',()=>{
 const root=new URL('../public/assets/sentence-plaza/v3/',import.meta.url);
 for(const file of ['plaza-world.webp',...Array.from({length:6},(_,i)=>'mission-'+(i+1)+'.webp')]){
  const bytes=fs.readFileSync(new URL(file,root));
  assert.equal(bytes.toString('ascii',0,4),'RIFF',file);
  assert.equal(bytes.toString('ascii',8,12),'WEBP',file);
  assert.ok(bytes.length>11000&&bytes.length<200000,file);
 }
 assert.match(source('SentencePlazaScene.tsx'),/sentence-plaza\/scenes-v6\/scene-1-colors\.webp/);
 assert.match(source('SentencePlazaScene.tsx'),/sp-v3-effect-house/);
 assert.match(source('SentencePlazaScene.tsx'),/sp-v3-effect-lanterns/);
 const css=source('sentence-clarity-v3.css');
 assert.match(css,/sp-v3-repair-hint/);
 assert.match(css,/sp-v3-waiting/);
 assert.match(css,/@media\(max-width:610px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test('V7: every placement has correct Turkish object/destination cases for movement commands',()=>{
 const objectNames=['Kediyi','Köpeği','Kuşu','Tavşanı'];
 const destinations=['ağacın altına','evin arkasına','çeşmenin yanına','ağacın yakınına'];
 let locations=0,festival=0;
 for(const level of ['Pre-A1','A1','A2'])for(let mission=1;mission<=6;mission++){
  for(const q of plazaCurriculumPool(mission,level)){
   assert.ok(isUpperFirst(q.cue),'Uppercase prompt: '+q.id);
   assert.doesNotMatch(q.cue,/renkte OLMASIN|uçmak yapabilir|zıplamak yapabilir|koşmak yapabilir|uyumak yapabilir|eylemini yapıyor|biraz (elmaları|muzları|portakalları|çilekleri)/i,q.id);
   if(mission===1&&q.kind==='negative')assert.match(q.cue,/renkte değil\.$/,q.id);
   if(mission===3&&q.kind==='instruction'){
    locations++;
    const re=new RegExp('^('+objectNames.join('|')+') ('+destinations.join('|')+') yerleştir\\.$');
    assert.match(q.cue,re,q.id+': '+q.cue);
    assert.ok(q.sentence.startsWith('Put the '));
   }
   if(mission===3&&q.mode==='scene'){
    assert.equal(q.correctSceneChoice,q.scene.place,q.id);
    assert.equal(q.sceneChoices?.length,4,q.id);
    assert.match(q.sentence,/^The (cat|dog|bird|rabbit) is (under the tree|behind the house|next to the fountain|near the tree)\.$/);
   }
   if(mission===6&&q.kind==='instruction'){
    festival++;
    assert.match(q.cue,/^(Kırmızı|Mavi|Sarı|Yeşil|Mor|Turuncu) (kediyi|köpeği|kuşu|tavşanı) (ağacın altına|evin arkasına|çeşmenin yanına) koy\.$/i,q.id+': '+q.cue);
   }
   if(mission===4&&q.sentence.includes(' can '))assert.match(q.cue,/uçabilir|zıplayabilir|koşabilir|uyuyabilir|İngilizce sor/,q.id+': '+q.cue);
   if(mission===5&&q.sentence.startsWith('Can I have'))assert.match(q.cue,/Kibarca İngilizce sor/,q.id);
  }
 }
 assert.ok(locations>=16,'Command variants must remain available');
 assert.ok(festival>=10,'Transfer commands remain available');
});

test('V7: independent movement, market and lantern curricula remain readable and consistent',()=>{
 let checked=0;
 for(const level of ['Pre-A1','A1','A2'])for(const grade of [1,4,8]){
  for(const trial of movementMagicPool(level,grade)){
   const cue=trial.question.cue;
   assert.doesNotMatch(cue,/uçmak yapabilir|zıplamak yapabilir|koşmak yapabilir|uyumak yapabilir|eylemini yapıyor|ağaç yakınında|gölet yakınında|köprü yakınında|kule yakınında/,cue);
   if(trial.question.sentence.includes(' can '))assert.match(cue,/uçabilir|zıplayabilir|koşabilir|uyuyabilir|Yanlış sözcüğü düzelt/,cue);
   checked++;
  }
  for(const trial of wishFestivalPool(level,grade)){
   const cue=trial.question.cue;
   const bare=WISH_FOODS.find(f=>f.id===trial.food).label.toLocaleLowerCase('tr-TR');
   const stem=bare==='havuç'?'havu':bare==='armut'?'armu':bare==='çilek'?'çile':bare;
   assert.ok(cue.toLocaleLowerCase('tr-TR').includes(stem),cue);
   assert.doesNotMatch(cue,/biraz (elmaları|muzları|portakalları|üzümleri|havuçları|çilekleri|armutları|şeftalileri)/,cue);
   checked++;
  }
  for(const trial of lanternCurriculumPool(level,grade)){
   const cue=trial.question.cue;
   assert.ok(cue.length>=15);
   assert.doesNotMatch(cue,/uçmak yapabilir|zıplamak yapabilir|koşmak yapabilir|uyumak yapabilir/);
   checked++;
  }
 }
 assert.ok(checked>=300);
});

test('V7: child must see the actor, choose its location only once, and then describe it',()=>{
 const ui=source('SentencePlazaAdventure.tsx');
 const scene=source('SentencePlazaScene.tsx');
 const css=source('sentence-plaza-learning-v7.css');
 assert.match(ui,/preview=\{mission<=3\?task\.scene:null\}/);
 assert.match(ui,/previewAtTarget=\{mission===3&&task\.kind!=='instruction'\}/);
 assert.match(ui,/visualLocation&&!selectedScene/);
 assert.match(ui,/task\.sceneChoices&&!visualLocation&&/);
 assert.match(ui,/onSceneChoice=\{mission===3&&task\.mode==='scene'\?selectScene:undefined\}/);
 assert.match(scene,/const shown=awaken\?effect:preview/);
 assert.match(scene,/const showAnimal=Boolean\(shown/);
 assert.match(scene,/const actorPlaced=awaken\|\|previewAtTarget/);
 assert.match(scene,/sp-v7-peek-clip/);
 assert.match(scene,/sp-v6-hotspots/);
 assert.match(css,/sp-v7-location-scene/);
 assert.match(css,/\.sp-v6-hotspot-tooltip/);
 assert.match(css,/min-width:44px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(ui,/saveSentencePlazaMission/);
 assert.match(ui,/nextTimer\.current=setTimeout/);
});

test('V8 species-specific vector characters never use one anonymous animal placeholder',()=>{
 const component=source('SentenceAnimalArtwork.tsx');
 const scene=source('SentencePlazaScene.tsx');
 const css=source('sentence-plaza-learning-v7.css');
 for(const species of ['Dog','Cat','Bird','Rabbit']){
  assert.ok(component.includes('function '+species+'('),'Missing species artwork: '+species);
 }
 const sections=['Dog','Cat','Bird','Rabbit'].map((name,i,arr)=>{
  const from=component.indexOf('function '+name+'(');
  const to=i+1<arr.length?component.indexOf('function '+arr[i+1]+'(',from):component.indexOf('export interface SentenceAnimalArtworkProps',from);
  assert.ok(from>=0&&to>from,'Dedicated vector markup for '+name);
  const markup=component.slice(from,to);
  assert.ok((markup.match(/<path /g)??[]).length>=7,name+' needs clear anatomical silhouette');
  return markup;
 });
 assert.match(sections[0],/collar/); // dog has a recognizable collar, snout and long drooping ears
 assert.match(sections[0],/rx="12"/);
 assert.match(sections[1],/whiskers|M93 132L52 126|M151 131L188 126/);
 assert.match(sections[2],/M156 109 Q180 104 211 121/); // unambiguous bird beak
 assert.match(sections[3],/M86 89 C65 61 53 7/); // long rabbit ears
 assert.match(sections[3],/width="10" height="14"/); // buck teeth
 for(const tint of ['red','blue','green','yellow','purple','orange']){
  assert.ok(component.includes(tint+':['),'Missing educational color: '+tint);
 }
 assert.match(component,/NATURAL\[actor\]/);
 assert.match(component,/data-animal=\{actor\}/);
 assert.match(component,/data-color=\{color\|\|'natural'\}/);
 assert.match(component,/actor==='dog'\?<Dog/);
 assert.match(component,/actor==='cat'\?<Cat/);
 assert.match(component,/actor==='bird'\?<Bird/);
 assert.match(scene,/import \{SentenceAnimalArtwork,type SentenceAnimalSpecies\}/);
 assert.match(scene,/<SentenceAnimalArtwork actor=\{animal as SentenceAnimalSpecies\}/);
 assert.match(scene,/color=\{shown\?\.color\} index=\{index\}/);
 assert.match(scene,/data-species=\{animal\}/);
 assert.doesNotMatch(scene,/animal==='bird'\?<|animal==='rabbit'\?</,'generic stick-figure placeholder must be gone');
 assert.match(scene,/clipPath=\{actorBehindHouse/);
 assert.match(css,/sp-v8-actor/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test('V9 friend garden removes duplicate baked-in animals and uses one dynamic question subject',()=>{
 const scene=source('SentencePlazaScene.tsx');
 const ui=source('SentencePlazaAdventure.tsx');
 const css=source('sentence-plaza-friends-v9.css');
 const art=source('SentenceAnimalArtwork.tsx');
 const root=new URL('../public/assets/sentence-plaza/scenes-v9/scene-2-friends-empty.webp',import.meta.url);
 const b=fs.readFileSync(root);
 assert.equal(b.toString('ascii',0,4),'RIFF');
 assert.equal(b.toString('ascii',8,12),'WEBP');
 assert.ok(b.length>=90000&&b.length<=320000,'Retain sharp local WebP without bloating mobile payload');
 assert.match(scene,/scenes-v9\/scene-2-friends-empty\.webp/);
 assert.match(scene,/const shown=awaken\?effect:preview/);
 assert.match(scene,/const isFriends=chapter===2/);
 assert.match(scene,/const friendsCount=shown\?\.count===2\?2:1/);
 assert.match(scene,/showAnimal&&Array\.from/);
 assert.match(scene,/sp-v9-friends-scene/);
 assert.match(scene,/data-subject=\{isFriends\?'learning-target':undefined\}/);
 assert.match(scene,/isFriends\?' scale\(1\.35\)'/);
 assert.match(scene,/data-species=\{animal\}/);
 assert.match(scene,/color=\{shown\?\.color\} index=\{index\}/);
 assert.match(scene,/sceneAccessibleLabel/);
 assert.match(ui,/preview=\{mission<=3\?task\.scene:null\}/);
 assert.match(ui,/mission===2\?'Hayvanı seç'/);
 assert.match(ui,/Resimde hangi hayvan var/);
 assert.match(ui,/sp-v9-animal-choice-art/);
 assert.match(ui,/<SentenceAnimalArtwork actor=\{choice\.id as SentenceAnimalSpecies\}/);
 assert.match(ui,/color=\{task\.scene\.color\} index=\{30\+i\}/);
 assert.match(art,/function Dog\(/);
 assert.match(art,/function Cat\(/);
 assert.match(art,/function Bird\(/);
 assert.match(art,/function Rabbit\(/);
 assert.match(css,/\.sp-v9-friends-scene/);
 assert.match(css,/\.sp-v9-animal-option/);
 assert.match(css,/@media\(max-width:580px\)/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(ui,/saveSentencePlazaMission/);
 assert.match(ui,/nextTimer\.current=setTimeout/);
});

test('V9 Pre-A1, A1, A2 friend prompts, pictures and counts always agree',()=>{
 const animals=['cat','dog','bird','rabbit'];
 const colors=['red','blue','yellow','green','purple','orange'];
 let total=0,plural=0, beginner=0;
 for(const level of ['Pre-A1','A1','A2']){
  const pool=plazaCurriculumPool(2,level);
  assert.ok(pool.length>=24);
  for(const q of pool){
   total++;
   assert.ok(animals.includes(q.scene.actor),q.id);
   assert.ok(colors.includes(q.scene.color),q.id);
   assert.equal(q.englishLevel,level,q.id);
   assert.ok(q.cue[0]===q.cue[0].toLocaleUpperCase('tr-TR'),q.id);
   assert.doesNotMatch(q.sentence,/in the square|festival has started/,q.id);
   assert.doesNotMatch(q.cue,/Meydanda|Festival başladığı/,q.id);
   const count=q.scene.count??1;
   assert.ok(count===1||count===2,'Only one or two subjects: '+q.id);
   if(q.sentence.startsWith('There are two ')){
    plural++;
    assert.equal(count,2,'Visual must display exactly two matching animals: '+q.id);
    assert.ok(q.cue.includes('iki '),q.id);
    assert.equal(q.mode,'repair');
   }else{
    assert.equal(count,1,'No decorative duplicate subjects: '+q.id);
   }
   if(q.mode==='scene'){
    assert.equal(q.correctSceneChoice,q.scene.actor,q.id);
    assert.equal(q.sceneChoices?.length,4);
    assert.ok(q.sceneChoices.some(choice=>choice.id===q.scene.actor),q.id);
   }
   if(level==='Pre-A1'){
    beginner++;
    assert.equal(q.mode,'scene');
    assert.match(q.sentence,/^I see (a|an) (red|blue|yellow|green|purple|orange) (cat|dog|bird|rabbit)\.$/);
    assert.equal(count,1);
   }
   if(q.kind==='reason')assert.match(q.sentence,/because it likes the sunshine\.$/);
  }
 }
 assert.ok(total>=100,'Broad replayable pool across 3 levels');
 assert.ok(plural>=20,'Retain plural learning in advanced levels');
 assert.ok(beginner>=20,'Retain beginner vocabulary variety');
});
