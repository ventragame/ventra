import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');

/** Canvas size and alpha flag of an extended (VP8X) WebP. */
function webpInfo(bytes){
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
 assert.equal(bytes.toString('ascii',12,16),'VP8X','extended WebP with alpha');
 return {alpha:(bytes[20]&0x10)!==0,width:1+bytes.readUIntLE(24,3),height:1+bytes.readUIntLE(27,3)};
}
const component=()=>read('src/components/learning/harbor/HarborCaptainAvatar.tsx');
const castArt=()=>Object.fromEntries([...component().matchAll(/^ (leo|parrot|turtle|fox|rabbit):'([^']+)'/gm)].map(m=>[m[1],m[2]]));

test('Every harbor speaker is a painted, transparent, local WebP; Leo and Luna are harbor originals',()=>{
 const art=castArt();
 assert.deepEqual(Object.keys(art).sort(),['fox','leo','parrot','rabbit','turtle']);
 assert.equal(new Set(Object.values(art)).size,5,'five different speakers');
 assert.equal(art.leo,'/assets/characters/painted/harbor-leo.webp');
 assert.equal(art.rabbit,'/assets/characters/painted/harbor-luna.webp');
 // Mimi, Nino and the fox are the same painted animals as in the meadow and the story forest.
 assert.equal(art.parrot,'/assets/animals/painted/parrot.webp');
 assert.equal(art.turtle,'/assets/animals/painted/turtle.webp');
 assert.equal(art.fox,'/assets/story-forest/premium/characters/fox_orange.webp');
 for(const [actor,src] of Object.entries(art)){
  const bytes=fs.readFileSync(path.join(root,'public',src));
  const info=webpInfo(bytes);
  assert.ok(info.alpha,actor+' has a transparent background');
  assert.ok(Math.max(info.width,info.height)>=512,actor+' is sharp enough for the hero');
  assert.ok(bytes.length>12000&&bytes.length<160000,actor+' size '+bytes.length);
 }
 for(const old of ['harbor-captain-leo','harbor-mimi','harbor-nino','harbor-fox','harbor-luna'])
  for(const ext of ['.json','.svg'])
   assert.ok(!fs.existsSync(path.join(root,'public/assets/characters',old+ext)),'retired vector puppet '+old+ext);
});

test('The painted captain replaces the existing NPC, not the question or answer art',()=>{
 const stage=read('src/components/learning/harbor/HarborSceneStage.tsx');
 const game=read('src/components/learning/harbor/HarborSpeechAdventure.tsx');
 const css=read('src/components/learning/harbor/harbor-captain-avatar.css');
 assert.match(stage,/<HarborCharacterAvatar actor=\{quest.actor\} mood=\{avatarMood\}/);
 assert.doesNotMatch(stage,/function HarborCaptain\(/);
 assert.match(stage,/hp-object-choice/);
 assert.match(stage,/speakerLine/);
 assert.match(game,/guide=\{\{src:HARBOR_CAST_ART\.leo,alt:'Kaptan Leo'\}\}/,'the island home shows the same captain');
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

test('Moods are body language: looping CSS for idle/listen/talk, one-shot reactions that clean up',()=>{
 const ui=component();
 const css=read('src/components/learning/harbor/harbor-captain-avatar.css');
 for(const mood of ['idle','listen','talk','happy','try_again','celebrate'])assert.match(ui,new RegExp("'"+mood+"'"));
 for(const mood of ['idle','listen','talk'])
  assert.match(css,new RegExp('\\.harbor-captain-avatar\\[data-mood="'+mood+'"\\] \\.harbor-captain-avatar-static\\{animation:'));
 for(const reaction of ['happy','try_again','celebrate'])assert.match(ui,new RegExp(' '+reaction+':\\{duration:'));
 assert.match(ui,/element\.animate\(reaction\.frames/);
 assert.match(ui,/return\(\)=>animation\.cancel\(\);/,'a newer mood never stacks on an old reaction');
 assert.match(ui,/\},\[mood,cue\]\);/,'the same reaction can replay for a new event');
 assert.match(ui,/prefers-reduced-motion: reduce/);
 assert.match(ui,/document\.hidden/);
 assert.match(ui,/aria-hidden="true"/);
 assert.doesNotMatch(ui,/lottie|https?:\/\//i);
 assert.match(css,/pointer-events:none/);
 assert.match(css,/prefers-reduced-motion:reduce\)\{\n \.harbor-captain-avatar-static\{animation:none!important\}/);
});

test('Legacy parrot and turtle img sizing cannot shrink the painted speakers',()=>{
 const css=read('src/components/learning/harbor/harbor-captain-avatar.css');
 assert.match(css,/hp-actor\[data-actor="parrot"\] \.harbor-captain-avatar-static/);
 assert.match(css,/hp-actor\[data-actor="turtle"\] \.harbor-captain-avatar-static/);
 assert.match(css,/height:100%;width:100%;object-fit:contain/);
});
