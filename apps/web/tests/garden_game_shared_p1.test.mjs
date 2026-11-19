import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=file=>fs.readFileSync(new URL('../src/components/learning/activities/'+file,import.meta.url),'utf8');
test('Garden games opt into shared control and scene mechanics, preserving their separate engines',()=>{
 for(const file of ['AnimalMeadowAdventure.tsx','ColorGroveAdventure.tsx','NumberValleyAdventure.tsx']){
  const code=read(file);
  assert.match(code,/import '\.\/garden-game-foundation\.css';/);
  assert.match(code,/gg-game-shell/);
  assert.match(code,/gg-game-control/);
  assert.match(code,/role="dialog" aria-modal="true"/);
 }
 for(const file of ['MeadowPlayStage.tsx','ColorGroveScene.tsx','MobileColorGroveWorld.tsx','NumberValleyAdventure.tsx']){
  assert.match(read(file),/gg-game-scene/);
 }
 const css=read('garden-game-foundation.css');
 assert.match(css,/min-height:var\(--gg-touch-target\)/);
 assert.match(css,/touch-action:manipulation/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/overscroll-behavior-y:contain/);
 assert.doesNotMatch(css,/\.nv-|\.cg-|\.am-/);
});
