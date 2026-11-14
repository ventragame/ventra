import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(relative)=>fs.readFileSync(path.join(root,relative),'utf8');
const moods=['idle','listen','point','hint','happy','celebrate','try_again'];
const segments={
 idle:[0,72],listen:[72,126],point:[126,180],hint:[180,234],
 happy:[234,288],celebrate:[288,360],try_again:[360,420]
};

test('Two original royalty-free guide characters contain real independent facial and limb animation',()=>{
 for(const id of ['village-fox','meadow-owl']){
  const json=JSON.parse(read('public/assets/characters/'+id+'.json'));
  const svg=read('public/assets/characters/'+id+'.svg');
  assert.match(json.v,/^5\./);
  assert.equal(json.w,320);assert.equal(json.h,320);assert.equal(json.fr,30);
  assert.equal(json.op,420);
  assert.deepEqual(json.assets,[],'No remote fonts, images or subscription APIs');
  assert.equal(json.markers.length,7);
  assert.deepEqual(json.markers.map(x=>x.cm),moods);
  for(const marker of json.markers){
   const [start,end]=segments[marker.cm];
   assert.equal(marker.tm,start);
   assert.equal(marker.dr,end-start);
  }
  assert.ok(json.layers.length>=20,'Individually animated art, not one moving picture');
  assert.ok(json.layers.some(x=>x.nm.includes('eye')&&x.ks.s.a===1),'Blinking eyes');
  assert.ok(json.layers.some(x=>x.nm.includes('mouth')&&x.ks.s.a===1),'Facial expressions');
  assert.ok(json.layers.some(x=>(x.nm.includes('sleeve')||x.nm.includes('wing'))&&x.ks.r.a===1),'Articulated arm or wings');
  assert.ok(json.layers.some(x=>x.nm.includes('head')&&x.ks.p.a===1),'Head independently animated');
  assert.ok(json.layers.every(x=>x.ty===4&&x.shapes.length>0),'Vector geometry only');
  // Every animated property must stay in its allotted timeline with finite values.
  for(const layer of json.layers){
   for(const key of ['o','r','p','s']){
    const value=layer.ks[key];
    if(value?.a!==1)continue;
    const frames=value.k;
    assert.ok(frames.length>=7,'Each articulated property has state transitions');
    for(let i=0;i<frames.length;i++){
     assert.ok(Number.isFinite(frames[i].t));
     assert.ok(frames[i].s.every(Number.isFinite),'No invalid transform values');
     if(i>0)assert.ok(frames[i].t>frames[i-1].t,'Strict timeline order');
    }
   }
  }
  assert.match(svg,/<svg/);assert.match(svg,/<path/);
  assert.doesNotMatch(svg,/<image\b|(?:href|src)=["']https?:|url\(https?:/i,'No externally loaded assets');
 }
});

test('One lightweight Lottie player handles seven visual states, motion preferences, and offline SVG fallback',()=>{
 const component=read('src/components/learning/motion/CharacterGuide.tsx');
 const css=read('src/components/learning/motion/character-guide.css');
 for(const name of moods)assert.match(component,new RegExp(name));
 assert.match(component,/playSegments\(\[from,to\],true\)/);
 assert.match(component,/setLoop\(LOOPING_MOODS.has\(mood\)\)/);
 assert.match(component,/import\('lottie-web'\)/);
 assert.match(component,/prefers-reduced-motion: reduce/);
 assert.match(component,/animation\?\.destroy\(\)/);
 assert.match(component,/document\.hidden/);
 assert.match(component,/else playState\(\)/);
 assert.match(component,/setReady\(false\)/);
 assert.match(component,/\.svg'/);
 assert.match(component,/aria-hidden="true"/);
 assert.doesNotMatch(component,/https?:\/\/|lottie\.host|lottiefiles\.com/i);
 assert.match(css,/pointer-events:none/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test('Guides never replace assessment targets and use genuine game state',()=>{
 const family=read('src/components/learning/activities/FamilyVillageAdventure.tsx');
 const meadow=read('src/components/learning/activities/MeadowPlayStage.tsx');
 const meadowFlow=read('src/components/learning/activities/AnimalMeadowAdventure.tsx');
 const fcss=read('src/components/learning/activities/family-village-guides.css');
 const mcss=read('src/components/learning/activities/animal-meadow-guides.css');
 assert.match(family,/CharacterGuide character="village-fox"/);
 assert.match(family,/guideMood:CharacterMood=saved\?'celebrate'/);
 assert.match(family,/wrongIds.length\?'try_again'/);
 assert.match(family,/FamilyWordArt id=\{task.target\}/);
 assert.match(family,/task.options.map/);
 assert.match(meadow,/CharacterGuide character="meadow-owl"/);
 assert.match(meadow,/guideMood:CharacterMood=isComplete\?'celebrate'/);
 assert.match(meadow,/correctId\?'happy'/);
 assert.match(meadow,/animals.map/);
 assert.match(meadow,/src=\{animal.image\}/);
 assert.match(meadowFlow,/speaking=\{speaking\}/);
 assert.match(fcss,/max-width:359px/);
 assert.match(mcss,/max-width:359px/);
});
