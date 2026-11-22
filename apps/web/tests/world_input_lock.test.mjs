import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EventBus,setWorldInputLocked,isWorldInputLocked} from '../src/lib/game/EventBus.ts';

const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');

// Reproduced in Chrome on `next dev` and on the production build: entering the
// Word Garden within ~2 s of reaching the archipelago (before the Phaser scene
// started), or through a ?open=word_garden link (every time), left the
// WorldScene unlocked under the garden. A mouse click on the
// Food Market card then also hit the Discovery Academy island drawn underneath
// and, 1.5 s later, replaced the garden game with the Academy.
test('A world scene that starts after an island opened still sees the lock',()=>{
 assert.equal(isWorldInputLocked(),false);
 const heard=[];
 const early=locked=>heard.push(locked);
 EventBus.on('SET_WORLD_INPUT_LOCKED',early);
 setWorldInputLocked(true);
 assert.deepEqual(heard,[true],'listeners still receive the event');
 // A scene created now (it missed the event) reads the current state.
 assert.equal(isWorldInputLocked(),true);
 setWorldInputLocked(false);
 assert.equal(isWorldInputLocked(),false);
 assert.deepEqual(heard,[true,false]);
 EventBus.off('SET_WORLD_INPUT_LOCKED',early);
});

test('Scene, frame budget and hub all use the shared lock',()=>{
 const scene=src('components/game/scenes/WorldScene.ts');
 const init=scene.slice(scene.indexOf('  init(data'),scene.indexOf('  preload(): void'));
 assert.match(init,/this\.isInputLocked = isWorldInputLocked\(\);/);
 assert.doesNotMatch(init,/this\.isInputLocked = false;/,'a restarted scene must not unlock the world');
 const create=scene.slice(scene.indexOf('  create(): void'),scene.indexOf('this.events.once(Phaser.Scenes.Events.SHUTDOWN'));
 assert.match(create,/if \(isWorldInputLocked\(\)\) this\.setInputLocked\(true\);/);
 assert.match(create,/this\.events\.once\(Phaser\.Scenes\.Events\.UPDATE, \(\) => EventBus\.emit\('WORLD_SCENE_READY'\)\);/,
  'sleep is applied once the scene runs (Phaser resets status after create)');
 // Island targets are recomputed on every lock change, both ways.
 const lock=scene.slice(scene.indexOf('  public setInputLocked'),scene.indexOf('  public resetAllHoverStates'));
 assert.match(lock,/this\.input\.enabled = !locked;/);
 assert.match(lock,/this\.updateIslandPresentation\(\);/);
 assert.match(scene,/entity\.hitZone\.input\.enabled = shown && !this\.isInputLocked;/);

 const phaser=src('components/game/PhaserGame.tsx');
 assert.doesNotMatch(phaser,/worldLockedRef/,'a per-mount ref forgot the lock when the hub remounted the game');
 assert.match(phaser,/const shouldSleep=isWorldInputLocked\(\) \|\| document\.hidden;/);
 assert.match(phaser,/EventBus\.on\('WORLD_SCENE_READY',applyFrameBudget\);/);
 assert.match(phaser,/EventBus\.off\('WORLD_SCENE_READY',applyFrameBudget\);/);

 const hub=src('app/kids/page.tsx');
 assert.match(hub,/setWorldInputLocked\(isWorldLocked\);/);
 assert.doesNotMatch(hub,/EventBus\.emit\('SET_WORLD_INPUT_LOCKED'/,'every lock goes through the shared state');
});
