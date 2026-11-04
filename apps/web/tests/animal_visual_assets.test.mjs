import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ANIMAL_MEADOW_WORDS} from '../src/lib/learning/animalMissionEngine.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');

test('All forty catalog animals have genuine same-family local transparent 3D PNGs',()=>{
 assert.equal(ANIMAL_MEADOW_WORDS.length,40);
 const used=new Set();
 for(const w of ANIMAL_MEADOW_WORDS){
  assert.equal(w.image,'/assets/animals/fluent-3d/'+w.id+'.png');
  assert.ok(!used.has(w.image));used.add(w.image);
  const b=fs.readFileSync(path.join(root,w.image.replace(/^\//,'')));
  assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a',w.id);
  assert.ok(b.length>12000&&b.length<110000,w.id+' image unexpected size: '+b.length);
  assert.equal(b.readUInt32BE(16),256,w.id+' width');
  assert.equal(b.readUInt32BE(20),256,w.id+' height');
  assert.equal(b[25],6,w.id+' must have alpha channel');
 }
});
test('3D illustration licensing and rendering remain local/offline',()=>{
 const license=fs.readFileSync(path.join(root,'assets/animals/fluent-3d/LICENSE.txt'),'utf8');
 assert.match(license,/Microsoft Corporation/);
 assert.match(license,/MIT License/);
 const source=fs.readFileSync(new URL('../src/components/learning/activities/MeadowPlayStage.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(source,/cdn\.jsdelivr|unpkg\.com|https:\/\/.*png/);
});
