import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(relative)=>fs.readFileSync(path.join(root,relative),'utf8');

test('Two original, self-hosted Lottie effects have real vector layers and no remote assets',()=>{
 for(const type of ['success','victory']){
  const animation=JSON.parse(read('public/assets/motion/'+type+'.json'));
  assert.match(animation.v,/^5\./);
  assert.equal(animation.w,320);
  assert.equal(animation.h,320);
  assert.equal(animation.fr,30);
  assert.ok(animation.op>0);
  assert.ok(animation.layers.length>=12);
  assert.deepEqual(animation.assets,[]);
  for(const layer of animation.layers){
   assert.equal(layer.ty,4);
   assert.ok(layer.shapes.length>0);
   assert.ok(layer.ks.o.a===1);
   assert.ok(layer.ks.p);
  }
 }
});

test('Animation lifecycle is isolated, reduced motion compliant and CDN independent',()=>{
 const code=read('src/components/learning/motion/LearningMotion.tsx');
 const css=read('src/components/learning/motion/learning-motion.css');
 assert.match(code,/import\('lottie-web'\)/);
 assert.match(code,/const enabled=Boolean\(trigger\)&&!reduced/);
 assert.match(code,/if\(!enabled\)return/);
 assert.match(code,/document\.hidden/);
 assert.match(code,/animation\.pause\(\)/);
 assert.match(code,/document\.addEventListener\('visibilitychange',onVisibility\)/);
 assert.match(code,/detachVisibility\(\)/);
 assert.match(code,/player\.current\?\.destroy\(\)/);
 assert.match(code,/animation\?\.stop\(\)|animation\?\.stop\(\)/);
 assert.match(code,/prefers-reduced-motion: reduce/);
 assert.match(code,/assets\/motion/);
 assert.doesNotMatch(code,/cdn\.jsdelivr|unpkg\.com|lottie\.host/);
 assert.match(css,/pointer-events:none/);
 assert.match(css,/prefers-reduced-motion/);
});
test('Both games connect animations to real game state, not decorative timers',()=>{
 const meadow=read('src/components/learning/activities/MeadowPlayStage.tsx');
 const story=read('src/components/learning/story/StoryForestAdventure.tsx');
 const art=read('src/components/learning/story/StoryForestArt.tsx');
 const characterCss=read('src/components/learning/story/story-forest-rabbit-motion.css');
 assert.match(meadow,/LearningMotion variant=\{isComplete\?'victory':'success'\}/);
 assert.match(meadow,/correctId\?/);
 assert.match(story,/LearningMotion variant=\{phase==='ending'\?'victory':'success'\}/);
 assert.match(story,/motion=\{route\.hero==='rabbit'\?rabbitMotion:undefined\}/);
 assert.match(art,/sf-rabbit-motion/);
 assert.match(characterCss,/sf-rabbit-cheer/);
 assert.match(characterCss,/prefers-reduced-motion/);
});

test('No third-party animation subscriptions or hosted runtime are required',()=>{
 const rootPackage=JSON.parse(read('package.json'));
 const webPackage=JSON.parse(read('package.json'));
 const lock=JSON.parse(fs.readFileSync(path.resolve(root,'../../package-lock.json'),'utf8'));
 assert.equal(webPackage.dependencies['lottie-web'],'5.13.0');
 assert.equal(lock.packages['node_modules/lottie-web'].license,'MIT');
 assert.equal(lock.packages['node_modules/lottie-web'].version,'5.13.0');
 assert.equal(rootPackage.dependencies['@rive-app/react-canvas'],undefined);
 const notes=read('docs/animation-system.md');
 assert.match(notes,/MIT/);
 assert.match(notes,/original/);
 assert.match(notes,/No LottieFiles login, SaaS subscription, cloud API key, or CDN/);
});
