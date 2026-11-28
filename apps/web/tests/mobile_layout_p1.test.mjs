import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gradeLevelLabel} from '../src/lib/learning/gradeLabel.ts';

const src=path=>fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8').replace(/\r\n/g,'\n');

test('Lantern Festival: phone layouts pick places from a readable list, not overlapping pins',()=>{
 const stage=src('components/learning/sentence/LanternFestivalStage.tsx');
 // Geometry that made the pins overlap at the phone layout (≤660px): centres in % of the scene.
 const pins=[...stage.matchAll(/\{id:'(\w+)',x:(\d+),y:(\d+)\}/g)].map(m=>({id:m[1],x:+m[2],y:+m[3]}));
 assert.equal(pins.length,4);
 const world={w:284,h:196},pin={w:60,h:50};
 const overlaps=pins.flatMap((a,i)=>pins.slice(i+1).filter(b=>
  Math.abs(a.x-b.x)*world.w/100<pin.w&&Math.abs(a.y-b.y)*world.h/100<pin.h).map(b=>a.id+'/'+b.id));
 assert.ok(overlaps.length>0,'labelled pins do overlap at 320px, so the compact picker is required');
 assert.match(stage,/const COMPACT_PLACES='\(max-width:660px\)';/);
 assert.match(stage,/aria-hidden=\{compact\|\|undefined\}/,'map markers are not announced twice');
 assert.match(stage,/className="lf-hotspot" tabIndex=\{compact\?-1:undefined\}/);
 assert.match(stage,/\{showPlaces&&compact&&<div className="lf-place-list" role="group" aria-label="Festival sahnesinde fener konumu seç">/);
 assert.match(stage,/className="lf-place" disabled=\{disabled\}\n\s*data-selected=\{place===p\.id\} aria-pressed=\{place===p\.id\} onClick=\{\(\)=>onPlace\?\.\(p\.id\)\}/);
 const css=src('components/learning/sentence/lantern-festival.css');
 assert.match(css,/\.lf-hotspots-markers \.lf-hotspot\{min-width:38px;min-height:38px;width:38px;height:38px;padding:0;border-radius:50%;pointer-events:none\}/);
 assert.match(css,/\.lf-place\{display:flex;align-items:center;gap:8px;min-height:48px;/);
 // 38px markers no longer collide at 320px.
 const markerOverlaps=pins.flatMap((a,i)=>pins.slice(i+1).filter(b=>
  Math.hypot((a.x-b.x)*world.w/100,(a.y-b.y)*world.h/100)<38));
 assert.equal(markerOverlaps.length,0);
 for(const rule of ['.lf-scene-footer{min-height:41px;font-size:12px','.lf-animal-choice strong{font-size:12px','.lf-intro p{font-size:13px'])
  assert.ok(css.includes(rule),rule);
});

test('Family Village: place, stars and tools sit in the shared top bar on narrow phones',()=>{
 const ui=src('components/learning/activities/FamilyVillageAdventure.tsx');
 // The wooden sign no longer has to squeeze between the exit and the star badge.
 assert.doesNotMatch(ui,/fv5-brand|fv5-stars-total/);
 assert.match(ui,/stars=\{\{earned:Object\.values\(progress\.starsByLevel\)\.reduce\(\(n,v\)=>n\+v,0\),total:60\}\}/);
 // On phones the frame keeps exit, place, progress and tools; extra chips step aside.
 const frame=src('components/learning/game/game-frame.css');
 assert.match(frame,/@media\(max-width:640px\)\{[\s\S]*\.gf-chip--extra,\.gf-chip--stars\{display:none\}/);
 assert.match(frame,/\.gf-back-label\{display:none\}/);
});

test('The tutorial replay lives in the game\'s own help; the floating button is only a fallback',()=>{
 const replay=src('components/learning/tutorialReplay.tsx');
 assert.match(replay,/useIsomorphicLayoutEffect\(\(\)=>tutorial\?\.registerHost\(\),\[tutorial\]\);/);
 assert.match(replay,/if\(!tutorial\)return null;/,'no replay action outside a tutorial host');
 const guide=src('components/learning/FirstPlayGuide.tsx');
 assert.match(guide,/\{checked&&!open&&floating&&<button type="button" onClick=\{reopen\}/);
 assert.match(guide,/floating=\{hosts===0\} replayRef=\{replay\}/);
 assert.match(src('components/learning/GardenHelp.tsx'),/\{children\}<TutorialReplayButton\/><\/div>/);
 // Animal Meadow's help opens from the HUD as a panel; the replay stays inside it.
 assert.match(src('components/learning/activities/AnimalMeadowAdventure.tsx'),/<div className=\"am3-help-panel\"><p>\{STAGES\[stage-1\]\.story\}<\/p><TutorialReplayButton\/><\/div>\n\s*<\/details>/);
 assert.match(src('components/learning/LearningPathModal.tsx'),/<FirstPlayHost key=\{profileId\+':'\+world\}/);
 assert.match(src('components/learning/tutorial-replay.css'),/min-height:44px/);
});

test('Header chips never show "—. sınıf" for a profile without a grade',()=>{
 assert.equal(gradeLevelLabel(3),'3. sınıf');
 assert.equal(gradeLevelLabel(null),'Sınıf seçilmedi');
 assert.equal(gradeLevelLabel(undefined),'Sınıf seçilmedi');
 assert.equal(gradeLevelLabel(0),'Sınıf seçilmedi');
 for(const file of ['components/learning/activities/AnimalMeadowAdventure.tsx','components/learning/sentence/LanternFestivalAdventure.tsx',
  'components/learning/sentence/MovementMagicAdventure.tsx','components/learning/sentence/SentencePlazaAdventure.tsx','components/learning/sentence/WishFestivalAdventure.tsx']){
  const code=src(file);
  assert.doesNotMatch(code,/\?\?'—'\}\. sınıf/,file);
  assert.match(code,/gradeLevelLabel\(gradeLevel\)/,file);
 }
});

test('Garden navigation and progress labels have a 12px floor; scene-painted labels 11px',()=>{
 const css=src('components/learning/activities/garden-child-legibility.css');
 // Zone and step names are the shared step rail now (game-frame.css); the
 // in-game counters keep their floor here.
 assert.match(css,/:is\(\.am3-step,\.fv-count,\.fv-discovery strong\)\{\n font-size:12px!important;/);
 assert.match(css,/:is\(\.fm-banner,\.tp-mission-tag,\.fv-mission-label\)\{font-size:11px!important\}/);
 assert.match(src('components/learning/game/game-frame.css'),/\.gf-step\{min-height:46px;padding:5px 12px 5px 5px;font-size:13px\}/);
});

test('Sentence Plaza word slots and scene choices stay 44px on phones',()=>{
 const css=src('components/learning/sentence/sentence-plaza-v2.css');
 assert.match(css,/\.sp-v2 \.sp-slot\{min-width:44px;min-height:44px;/);
 assert.doesNotMatch(css,/\.sp-v2 \.sp-slot\{min-width:30px;min-height:39px/);
 assert.match(css,/\.sp-v2 \.sp-scene-choice\{padding:5px 7px;min-height:44px\}/);
});
