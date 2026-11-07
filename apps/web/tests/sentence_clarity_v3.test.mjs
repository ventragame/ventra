import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {plazaCurriculumPool,planPlazaMission} from '../src/lib/learning/sentencePlazaEngine.ts';
import {sentenceStart,visibleWord,visibleRepairWord} from '../src/components/learning/sentence/sentencePresentation.ts';

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
 assert.match(source('SentencePlazaScene.tsx'),/sentence-plaza\/v3\/plaza-world\.webp/);
 assert.match(source('SentencePlazaScene.tsx'),/sp-v3-effect-house/);
 assert.match(source('SentencePlazaScene.tsx'),/sp-v3-effect-lanterns/);
 const css=source('sentence-clarity-v3.css');
 assert.match(css,/sp-v3-repair-hint/);
 assert.match(css,/sp-v3-waiting/);
 assert.match(css,/@media\(max-width:610px\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
