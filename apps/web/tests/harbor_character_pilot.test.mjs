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
 assert.match(stage,/quest.actor==='leo'\?<HarborCaptainAvatar mood=\{avatarMood\}/);
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
 assert.match(css,/hp-actor\[data-actor="leo"\]\{animation:none/);
 assert.match(css,/max-width:360px/);
});

test('Self-hosted character preserves lifecycle, static fallback and reduced motion',()=>{
 const component=read('src/components/learning/harbor/HarborCaptainAvatar.tsx');
 const css=read('src/components/learning/harbor/harbor-captain-avatar.css');
 for(const mood of ['idle','listen','talk','happy','try_again','celebrate'])
  assert.match(component,new RegExp(mood));
 assert.match(component,/import\('lottie-web'\)/);
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
