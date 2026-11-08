
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
 'cat_orange','cat_gray_sleeping','cat_white_bow'
];
const scenes=[
 'forest_clearing','forest_path','forest_treehouse','forest_pond',
 'forest_meadow','forest_bridge'
];
const code=fs.readFileSync(path.join(root,'src/components/learning/story/StoryForestArt.tsx'),'utf8');
test('All 13 premium WebP assets are real image bytes and have budgeted sizes',()=>{
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
 assert.match(code,/<img className="sf-actor-illustration sf-premium-actor"/);
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
