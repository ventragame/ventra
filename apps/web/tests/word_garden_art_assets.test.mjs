import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../public/assets/word-garden/premium-v2');
const source=fs.readFileSync(path.resolve(here,'../src/components/learning/DistrictPreviewArt.tsx'),'utf8');
const css=fs.readFileSync(path.resolve(here,'../src/components/learning/word-garden-premium.css'),'utf8');
const names=['animals','colors','numbers','food','family','sanctuary'];

test('all six illustrated games ship real local desktop and mobile WebP files',()=>{
 for(const id of [...names,'cover']){
  const variants=id==='cover'?['','_mobile']:['','_mobile'];
  for(const suffix of variants){
   const name=id+suffix+'.webp';
   const buffer=fs.readFileSync(path.join(root,name));
   assert.equal(buffer.toString('ascii',0,4),'RIFF',name+' must be WebP');
   assert.equal(buffer.toString('ascii',8,12),'WEBP',name+' must be WebP');
   assert.ok(buffer.length>20000,name+' should contain real illustration detail');
   assert.ok(buffer.length<450000,name+' should be download-friendly');
  }
 }
});
test('art is responsive and decorative without changing learning or accessibility',()=>{
 assert.match(source,/<picture/);
 assert.match(source,/media="\(max-width: 630px\)"/);
 assert.match(source,/loading="lazy"/);
 assert.match(source,/decoding="async"/);
 assert.match(source,/aria-hidden="true"/);
 assert.match(source,/alt=""/);
 for(const id of names)assert.match(source,new RegExp("id==='"+id+"'"));
 assert.match(css,/premium-v2\/cover\.webp/);
 assert.match(css,/premium-v2\/cover_mobile\.webp/);
 assert.match(css,/object-fit:cover/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
