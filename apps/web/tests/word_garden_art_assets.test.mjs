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
  const variants=['','_mobile'];
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
 const worldArt=fs.readFileSync(path.resolve(here,'../src/components/learning/word-garden-world-art.css'),'utf8');
 for(const id of names)assert.match(worldArt,new RegExp('premium-v2/'+id+'\\.webp'));
 assert.match(worldArt,/@media\(min-width:768px\)/);
 assert.match(worldArt,/linear-gradient/);
 assert.match(worldArt,/@media\(max-width:767px\)/);
 assert.match(fs.readFileSync(path.resolve(here,'../src/components/learning/LearningPathModal.tsx'),'utf8'),/word-garden-world-art\.css/);
});


test('V4 card and interactive map reuse identical source illustrations',()=>{
 const scene=fs.readFileSync(path.resolve(here,'../src/components/learning/world/ExplorerScene.ts'),'utf8');
 const art=fs.readFileSync(path.resolve(here,'../src/components/learning/DistrictPreviewArt.tsx'),'utf8');
 assert.match(scene,/modular-v4\//);
 assert.match(art,/modular-v4\//);
 const root4=path.resolve(here,'../public/assets/word-garden/modular-v4');
 const ids=['animals','colors','numbers','food','family','sanctuary'];
 for(const id of ids){
   const file=path.join(root4,id+'.webp');
   const bytes=fs.readFileSync(file);
   assert.equal(bytes.toString('ascii',0,4),'RIFF');
   assert.equal(bytes.toString('ascii',8,12),'WEBP');
   assert.ok(bytes.length>20000&&bytes.length<150000);
   assert.ok(!fs.existsSync(path.join(root4,id+'_mobile.webp')),'one shared hero asset per world');
 }
 const ground=fs.readFileSync(path.join(root4,'garden-ground.webp'));
 assert.equal(ground.toString('ascii',8,12),'WEBP');
 assert.ok(ground.length<500000);
});

test('V5 quiet meadow is a separate valid WebP without baked landmarks',()=>{
 const asset=path.resolve(here,'../public/assets/word-garden/modular-v5/garden-ground.webp');
 const buf=fs.readFileSync(asset);
 assert.equal(buf.toString('ascii',0,4),'RIFF');
 assert.equal(buf.toString('ascii',8,12),'WEBP');
 assert.ok(buf.length>30000&&buf.length<200000);
 const scene=fs.readFileSync(path.resolve(here,'../src/components/learning/world/ExplorerScene.ts'),'utf8');
 assert.match(scene,/garden-ground\.webp/);
 assert.match(scene,/modular-v5/);
 for(const id of names) assert.match(scene,new RegExp("garden_district_"));
});
