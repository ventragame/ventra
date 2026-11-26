
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {FOREST_ACTOR_NAMES} from '../src/lib/learning/storyForestEngine.ts';
import {SEQUENCE_STORIES} from '../src/lib/learning/storySequenceEngine.ts';
import {JOURNEY_ROUTES} from '../src/lib/learning/storyForestJourneyEngine.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const assets=path.join(root,'public/assets/story-forest/premium');
const characters=[
 'rabbit_adventurer','squirrel_acorn','blue_bird_flying','hedgehog_happy',
 'cat_orange','cat_gray_sleeping','cat_white_bow',
 'rabbit_reading','rabbit_tree','rabbit_rock','rabbit_pond','fox_orange','fox_running',
 'deer_antlers','bear_cub','bear_sleeping','dog_puppy','fish_orange','butterfly_colourful'
];
const scenes=[
 'forest_clearing','forest_path','forest_treehouse','forest_pond',
 'forest_meadow','forest_bridge','forest_camp'
];
const code=fs.readFileSync(path.join(root,'src/components/learning/story/StoryForestArt.tsx'),'utf8');
test('All 26 premium WebP assets are real image bytes and have budgeted sizes',()=>{
 for(const name of characters){
  const p=path.join(assets,'characters',name+'.webp');
  assert.ok(fs.existsSync(p),'Missing character asset: '+name);
  const bytes=fs.readFileSync(p);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.ok(bytes.length>10000 && bytes.length<155000,'Character WebP bytes '+name);
  assert.ok(code.includes('characters/'+name+'.webp'),'Character has a renderer mapping: '+name);
 }
 for(const name of scenes){
  const p=path.join(assets,'scenes',name+'.webp');
  assert.ok(fs.existsSync(p),'Missing scene asset: '+name);
  const bytes=fs.readFileSync(p);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.ok(bytes.length>80000&&bytes.length<400000,'Scene WebP size '+name);
  assert.ok(code.includes('scenes/'+name+'.webp'),'Scene has a renderer mapping: '+name);
 }
});
test('Illustration identity is never falsified: fox and bear cannot be rendered as cat',()=>{
 assert.ok(code.includes("cat:'characters/cat_orange.webp'"));
 assert.ok(code.includes("bird_flying:'characters/blue_bird_flying.webp'"));
 assert.ok(code.includes("hedgehog:'characters/hedgehog_happy.webp'"));
 assert.ok(!code.includes("fox:'characters/cat_orange.webp'"));
 assert.ok(!code.includes("bear:'characters/cat_orange.webp'"));
 assert.equal(FOREST_ACTOR_NAMES.hedgehog,'Kirpi');
 assert.ok(JOURNEY_ROUTES.some(r=>r.helper==='hedgehog'));
 assert.ok(JOURNEY_ROUTES.some(r=>r.hero==='cat'));
 assert.ok(SEQUENCE_STORIES.flatMap(s=>s.frames).some(f=>f.actor==='cat_gray_sleeping'));
 assert.ok(SEQUENCE_STORIES.flatMap(s=>s.frames).some(f=>f.actor==='cat_white_bow'));
});
test('Art stays as separate, responsive layers in both games and island menu',()=>{
 const game=fs.readFileSync(path.join(root,'src/components/learning/story/StoryForestAdventure.tsx'),'utf8');
 const sequence=fs.readFileSync(path.join(root,'src/components/learning/story/StorySequenceFrame.tsx'),'utf8');
 const home=fs.readFileSync(path.join(root,'src/components/learning/story/StoryForestHome.tsx'),'utf8');
 const css=fs.readFileSync(path.join(root,'src/components/learning/story/premium-story-art.css'),'utf8');
 assert.match(code,/export function StoryForestActor/);
 assert.match(code,/export function StoryForestScenery/);
 assert.match(code,/return <img className=\{'sf-actor-illustration sf-premium-actor'/);
 assert.match(code,/sf-actor-illustration sf-premium-actor/);
 assert.match(code,/motionClass/);
 assert.ok(code.includes("className={'sf-scenery sf-premium-scenery"));
 assert.match(game,/JourneyObjectArt/);
 assert.match(game,/sj-path-choices/);
 assert.match(home,/STORY_FOREST_PREMIUM_COVER/);
 assert.ok(home.includes("premium-story-art.css"));
 assert.match(sequence,/StoryForestActor/);
 assert.match(sequence,/StoryForestScenery/);
 assert.match(css,/object-fit:contain/);
 assert.match(css,/object-fit:cover/);
 assert.ok(css.includes('@media(max-width:700px)'));
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test('Found items use transparent premium WebP and ground-based scene staging',()=>{
 const stageDir=new URL('../src/components/learning/story/',import.meta.url);
 const game=fs.readFileSync(new URL('StoryForestAdventure.tsx',stageDir),'utf8');
 const stage=fs.readFileSync(new URL('story-forest-object-staging.css',stageDir),'utf8');
 const old=fs.readFileSync(new URL('story-forest-journey.css',stageDir),'utf8');
 for(const name of ['apple','crystal','gold_key']){
  const bytes=fs.readFileSync(path.join(assets,'objects',name+'.webp'));
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.ok(bytes.length>5000&&bytes.length<120000,name+' bytes');
  assert.ok(game.includes('objects/'+name+'.webp'),name+' must render');
 }
 assert.ok(game.includes("const objectRecovered=phase==='result'||phase==='ending'"));
 assert.ok(game.includes("route.object==='bird'"));
 assert.ok(game.includes('sj-found-bird'));
 assert.ok(game.includes('sj-discovery-spot'));
 assert.ok(game.includes('sj-discovery-stone'));
 assert.ok(game.includes('sj-discovery-object'));
 assert.ok(game.includes("import './story-forest-object-staging.css'"));
 assert.ok(!game.includes('sj-held-item'));
 assert.ok(!old.includes('sj-held-item'));
 assert.match(stage,/sj-discovery-shadow/);
 assert.match(stage,/perspective\(130px\)/);
 assert.match(stage,/@media\(max-width:700px\)/);
 assert.match(stage,/@media\(max-width:355px\)/);
 assert.match(stage,/prefers-reduced-motion:reduce/);
});

test('Portrait phone scene expands instead of centering a fixed-height story card',()=>{
 const base=new URL('../src/components/learning/story/',import.meta.url);
 const mobile=fs.readFileSync(new URL('story-forest-mobile-cast.css',base),'utf8');
 const baseline=fs.readFileSync(new URL('story-forest-journey.css',base),'utf8');
 assert.match(baseline,/height:min\(76dvh,620px\)/);
 assert.match(mobile,/\.sj-root \.sj-play>\.sj-scene/);
 assert.match(mobile,/height:auto/);
 assert.match(mobile,/max-height:none/);
 assert.match(mobile,/min-height:0/);
 assert.match(mobile,/align-items:center/);
 assert.match(mobile,/@media\s*\(max-width:700px\) and \(orientation:landscape\)/);
});

test('All six story backgrounds have unique WebP mappings, with no SVG fallback',()=>{
 assert.match(code,/Readonly<Record<ForestScene,string>>/);
 for(const scene of ['path','treehouse','pond','meadow','bridge','camp']){
  assert.ok(code.includes(scene+":'scenes/forest_"),'Missing environment: '+scene);
 }
 const scenery=code.slice(code.indexOf('export function StoryForestScenery'),
  code.indexOf('export type StoryActorMotion'));
 assert.match(scenery,/<img className=/);
 assert.doesNotMatch(scenery,/<svg|linearGradient|treeXs/);
 const css=fs.readFileSync(path.join(root,'src/components/learning/story/premium-story-art.css'),'utf8');
 assert.match(css,/\.sf-scene-camp/);
 assert.match(css,/@media\(max-width:700px\)/);
});

test('Tent, moon and lantern clue art is WebP, not the old flat SVG',()=>{
 const clue=fs.readFileSync(path.join(root,'src/components/learning/story/StoryDetectiveArt.tsx'),'utf8');
 const seq=fs.readFileSync(path.join(root,'src/components/learning/story/StorySequenceFrame.tsx'),'utf8');
 for(const name of ['tent','moon','lantern']){
  const bytes=fs.readFileSync(path.join(assets,'clues',name+'.webp'));
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.ok(bytes.length>1500&&bytes.length<50000);
  assert.ok(clue.includes(name+":'"+name+".webp'"));
  assert.ok(!clue.includes("id==='"+name+"'&&<>"));
 }
 assert.match(seq,/assets\/story-forest\/premium\/clues\/moon\.webp/);
});

/** Reads the canvas size and alpha flag of an extended (VP8X) WebP. */
function webpInfo(bytes){
 assert.equal(bytes.toString('ascii',12,16),'VP8X','extended WebP with alpha');
 return {alpha:(bytes[20]&0x10)!==0,width:1+bytes.readUIntLE(24,3),height:1+bytes.readUIntLE(27,3)};
}
test('Every story animal is painted art of its own identity; vectors remain only for objects',()=>{
 const objects=['red_apple','yellow_star','blue_balloon','pink_flower','purple_flower','green_leaf'];
 const animals=Object.keys(FOREST_ACTOR_NAMES).filter(id=>!objects.includes(id));
 assert.equal(animals.length,20);
 assert.match(code,/PREMIUM_STORY_CHARACTERS:Readonly<Record<StoryAnimalId,string>>/);
 for(const id of animals){
  const m=code.match(new RegExp('\\n '+id+":'characters/([a-z_]+)\\.webp'"));
  assert.ok(m,'painted art for '+id);
  const info=webpInfo(fs.readFileSync(path.join(assets,'characters',m[1]+'.webp')));
  assert.ok(info.alpha,id+' has a transparent background');
  assert.ok(Math.max(info.width,info.height)>=600&&Math.max(info.width,info.height)<=800,id+' is sized like the set');
 }
 // Identity: each species keeps its own picture (a fox is never the cat, a deer never the dog).
 for(const [id,file] of [['fox','fox_orange'],['fox_running','fox_running'],['deer','deer_antlers'],
  ['bear','bear_cub'],['bear_sleeping','bear_sleeping'],['dog','dog_puppy'],['fish','fish_orange'],
  ['butterfly','butterfly_colourful'],['rabbit_reading','rabbit_reading'],['rabbit_pond','rabbit_pond']]){
  assert.ok(code.includes(id+":'characters/"+file+".webp'"),id);
 }
 const vector=code.slice(code.indexOf('// Only simple objects reach the vector art.'));
 assert.doesNotMatch(vector,/deer|fox|bear|dog|fish|butterfly|rabbit|ANIMAL_COLORS/);
 assert.doesNotMatch(code,/ANIMAL_COLORS|kind==='/);
});
test('Generated story art is documented with its models, licences and prompts',()=>{
 const doc=fs.readFileSync(path.join(root,'../../docs/STORY_FOREST_ANIMAL_ART_V2.md'),'utf8');
 for(const word of ['stable-diffusion-xl-base-1.0','RAIL++','IP-Adapter','Apache-2.0','BiRefNet','MIT',
  'deer_antlers','fox_running','rabbit_pond','butterfly_colourful']){
  assert.ok(doc.includes(word),word);
 }
});
