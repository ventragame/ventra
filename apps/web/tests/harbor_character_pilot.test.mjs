import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

test('Captain Leo is a six-state, original, multi-part Lottie vector puppet',()=>{
 const a=JSON.parse(read('public/assets/characters/harbor-captain-leo.json'));
 const fallback=read('public/assets/characters/harbor-captain-leo.svg');
 assert.match(a.v,/^5\./);
 assert.equal(a.fr,30);
 assert.equal(a.w,320);assert.equal(a.h,380);assert.equal(a.op,432);
 assert.deepEqual(a.assets,[]);
 assert.deepEqual(a.markers.map(x=>x.cm),['idle','listen','talk','happy','try_again','celebrate']);
 assert.deepEqual(a.markers.map(x=>[x.tm,x.dr]),[[0,90],[90,60],[150,90],[240,54],[294,54],[348,84]]);
 assert.ok(a.layers.length>=40);
 assert.ok(a.layers.some(x=>x.nm.includes('eye')&&x.ks.s.a===1),'Eyes independently blink');
 assert.ok(a.layers.some(x=>x.nm.includes('mouth')&&x.ks.s.a===1),'Mouth has real speech articulation');
 assert.ok(a.layers.some(x=>x.nm.includes('arm')&&x.ks.r.a===1),'Arms gesture separately');
 assert.ok(a.layers.some(x=>x.nm.includes('hat')&&x.ks.p.a===1),'Hat follows face gestures');
 for(const layer of a.layers){
  assert.equal(layer.ty,4);
  assert.ok(layer.shapes.length>0);
  for(const key of ['p','r','s','o']){
   const track=layer.ks[key];
   if(track?.a!==1)continue;
   assert.ok(track.k.length>=6);
   for(let i=0;i<track.k.length;i++){
    assert.ok(track.k[i].s.every(Number.isFinite));
    if(i>0)assert.ok(track.k[i].t>track.k[i-1].t,'Strictly monotonic timeline');
   }
  }
 }
 assert.match(fallback,/viewBox="0 0 320 380"/);
 assert.match(fallback,/<path/);assert.match(fallback,/<ellipse/);
 assert.doesNotMatch(fallback,/<image\b|(?:href|src)=["']https?:|url\(https?:/i);
 assert.ok(fs.statSync(path.join(root,'public/assets/characters/harbor-captain-leo.json')).size<900000);
});

test('The animated captain replaces the existing NPC, not the question or answer art',()=>{
 const stage=read('src/components/learning/harbor/HarborSceneStage.tsx');
 const game=read('src/components/learning/harbor/HarborSpeechAdventure.tsx');
 const css=read('src/components/learning/harbor/harbor-captain-avatar.css');
 assert.match(stage,/<HarborCharacterAvatar actor=\{quest.actor\} mood=\{avatarMood\}/);
 assert.doesNotMatch(stage,/function HarborCaptain\(/);
 assert.match(stage,/hp-object-choice/);
 assert.match(stage,/speakerLine/);
 assert.match(game,/HarborCaptainAvatar mood="idle"/);
 assert.match(game,/HarborCaptainAvatar mood="celebrate"/);
 assert.match(game,/avatarMood=\{captainMood\}/);
 assert.match(game,/listening\?'listen'/);
 assert.match(game,/narrating\?'talk'/);
 assert.match(game,/sceneResolved\?'happy'/);
 assert.match(game,/onStart:\(\)=>\{if\(run===narrationRun.current\)setNarrating\(true\)/);
 assert.match(game,/onEnd:\(\)=>\{if\(run===narrationRun.current\)setNarrating\(false\)/);
 assert.match(game,/recordGameCompleted/);
 assert.match(css,/\.hp-actor\{animation:none/);
 assert.match(css,/max-width:360px/);
});

test('Self-hosted character preserves lifecycle, static fallback and reduced motion',()=>{
 const component=read('src/components/learning/harbor/HarborCaptainAvatar.tsx');
 const css=read('src/components/learning/harbor/harbor-captain-avatar.css');
 for(const mood of ['idle','listen','talk','happy','try_again','celebrate'])
  assert.match(component,new RegExp(mood));
 assert.match(component,/import\('lottie-web'\)/);
 assert.match(component,/export function HarborCharacterAvatar/);
 assert.match(component,/parrot:'harbor-mimi'/);
 assert.match(component,/turtle:'harbor-nino'/);
 assert.match(component,/fox:'harbor-fox'/);
 assert.match(component,/rabbit:'harbor-luna'/);
 assert.match(component,/actor="leo"/);
 assert.match(component,/\[actor,reduced\]/);
 assert.match(component,/playSegments\(\[\.\.\.HARBOR_CAPTAIN_SEGMENTS\[state\]\],true\)/);
 assert.match(component,/setLoop\(LOOPING.has/);
 assert.match(component,/animation\?\.destroy\(\)/);
 assert.match(component,/document.hidden/);
 assert.match(component,/prefers-reduced-motion: reduce/);
 assert.match(component,/\.svg'/);
 assert.doesNotMatch(component,/https?:\/\/|lottiefiles\.com|lottie\.host/);
 assert.match(css,/pointer-events:none/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test('Four additional friendly Lottie speakers have original visible pupils, gestures and no remote assets',()=>{
 for(const id of ['harbor-mimi','harbor-nino','harbor-fox','harbor-luna']){
  const a=JSON.parse(read('public/assets/characters/'+id+'.json'));
  const fallback=read('public/assets/characters/'+id+'.svg');
  assert.equal(a.w,320);assert.equal(a.h,380);assert.equal(a.fr,30);assert.equal(a.op,432);
  assert.deepEqual(a.assets,[]);
  assert.deepEqual(a.markers.map(x=>x.cm),
    ['idle','listen','talk','happy','try_again','celebrate']);
  assert.ok(a.layers.length>=27,'Each character has separate facial/anatomical layers');
  const leftWhite=a.layers.findIndex(x=>x.nm==='left eye white');
  const leftIris=a.layers.findIndex(x=>x.nm==='left eye iris');
  const rightWhite=a.layers.findIndex(x=>x.nm==='right eye white');
  const rightIris=a.layers.findIndex(x=>x.nm==='right eye iris');
  assert.ok(leftIris>=0&&leftWhite>=0&&leftIris<leftWhite,'Left pupil draws on top of white');
  assert.ok(rightIris>=0&&rightWhite>=0&&rightIris<rightWhite,'Right pupil draws on top of white');
  assert.ok(a.layers.some(x=>x.nm.includes('smile')&&x.ks.s.a===1),
    'Friendly speaking mouth is independently articulated');
  assert.ok(a.layers.some(x=>x.nm.includes('arm')&&x.ks.r.a===1)||
   a.layers.some(x=>x.nm.includes('flipper')&&x.ks.r.a===1),
   'Independently articulated limbs');
  assert.match(fallback,/viewBox="0 0 320 380"/);
  assert.doesNotMatch(fallback,/<image\b|(?:href|src)=["']https?:|url\(https?:/i);
  assert.ok(Buffer.byteLength(JSON.stringify(a))<400000,'Mobile-conscious vector animation size');
 }
 const stage=read('src/components/learning/harbor/HarborSceneStage.tsx');
 assert.match(stage,/HarborCharacterAvatar actor=\{quest.actor\}/);
 assert.doesNotMatch(stage,/const ART:Record/);
});

test('Captain Leo has dark pupils drawn above white sclera and an unobstructed hat brim',()=>{
 const a=JSON.parse(read('public/assets/characters/harbor-captain-leo.json'));
 const left=a.layers.find(x=>x.nm==='Left eye white');
 const right=a.layers.find(x=>x.nm==='Right eye white');
 assert.deepEqual(left.shapes.slice(0,3).map(x=>x.nm),
  ['left glint','left pupil','left eye white']);
 assert.deepEqual(right.shapes.slice(0,3).map(x=>x.nm),
  ['right glint','right pupil','right eye white']);
 const brim=a.layers.find(x=>x.nm==='Cap broad navy brim');
 const path=brim.shapes[0].it.find(x=>x.ty==='sh').ks.k;
 assert.ok(Math.max(...path.v.map(pt=>pt[1]))<=149,'Hat not drawn across eyes');
 const mouth=a.layers.find(x=>x.nm==='Captain friendly mouth');
 assert.ok(mouth.shapes.some(x=>x.nm==='smiling friendly mouth corners'));
});
