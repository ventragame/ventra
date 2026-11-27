import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ANIMAL_MEADOW_WORDS} from '../src/lib/learning/animalMissionEngine.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');
const src=path.resolve(root,'../src');

/** Reads the canvas size and alpha flag of an extended (VP8X) WebP. */
function webpInfo(bytes){
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
 assert.equal(bytes.toString('ascii',12,16),'VP8X','extended WebP with alpha');
 return {alpha:(bytes[20]&0x10)!==0,width:1+bytes.readUIntLE(24,3),height:1+bytes.readUIntLE(27,3)};
}

test('All forty meadow animals are painted, full-body, transparent WebPs of their own species',()=>{
 assert.equal(ANIMAL_MEADOW_WORDS.length,40);
 const used=new Set();
 for(const w of ANIMAL_MEADOW_WORDS){
  assert.equal(w.image,'/assets/animals/painted/'+w.id+'.webp');
  assert.ok(!used.has(w.image));used.add(w.image);
  const b=fs.readFileSync(path.join(root,w.image.replace(/^\//,'')));
  assert.ok(b.length>12000&&b.length<90000,w.id+' image unexpected size: '+b.length);
  const info=webpInfo(b);
  assert.ok(info.alpha,w.id+' must have a transparent background');
  assert.equal(Math.max(info.width,info.height),512,w.id+' long side');
  assert.ok(Math.min(info.width,info.height)>=200,w.id+' is not a sliver');
 }
});

test('Painted animals stay local and the old emoji set is gone',()=>{
 assert.ok(!fs.existsSync(path.join(root,'assets/animals/fluent-3d')),'Fluent emoji folder removed');
 for(const file of ['components/learning/activities/MeadowPlayStage.tsx','components/learning/harbor/HarborSceneStage.tsx',
  'lib/learning/firstPlayTutorial.ts','lib/learning/animalMissionEngine.ts']){
  const source=fs.readFileSync(path.join(src,file),'utf8');
  assert.doesNotMatch(source,/fluent-3d|cdn\.jsdelivr|unpkg\.com|https:\/\/.*(png|webp)/,file);
 }
});

test('Painted animal provenance names the models, licences and every animal',()=>{
 const doc=fs.readFileSync(path.resolve(root,'../../../docs/ANIMAL_MEADOW_PAINTED_ART_V4.md'),'utf8');
 for(const word of ['stable-diffusion-xl-base-1.0','RAIL++','IP-Adapter','Apache-2.0','BiRefNet','MIT'])
  assert.ok(doc.includes(word),word);
 for(const w of ANIMAL_MEADOW_WORDS)assert.match(doc,new RegExp('\\| '+w.id+' \\|'),w.id);
});
