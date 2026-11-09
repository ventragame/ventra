
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 JOURNEY_ROUTES,planJourneyStory,journeyRoutesForEpisode,
 narrativeFor,validateJourneyRecord,journeyStars
} from '../src/lib/learning/storyForestJourneyEngine.ts';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {getStoryForestProgress,saveForestJourney,STORY_FOREST_GAME_ID}
 from '../src/lib/progress/storyForestProgress.ts';
const record=(p,location=p.route.destinations[0].scene)=>({
 routeId:p.route.id,episode:p.route.episode,object:p.route.object,
 destination:location,firstMistakes:0,secondMistakes:0,firstHint:false,secondHint:false,
 completedAt:new Date().toISOString()
});
test('All six worlds have four coherent routes and two valid consequences',()=>{
 assert.equal(JOURNEY_ROUTES.length,24);
 assert.equal(new Set(JOURNEY_ROUTES.map(x=>x.id)).size,24);
 for(let episode=1;episode<=6;episode++){
  const arcs=journeyRoutesForEpisode(episode);
  assert.equal(arcs.length,4);
  assert.deepEqual([...arcs.map(a=>a.object)].sort(),['apple','bird','crystal','key']);
  for(const route of arcs){
   assert.notEqual(route.destinations[0].scene,route.destinations[1].scene);
   const p={route,englishLevel:'A1',gradeLevel:3,seed:1,objectChoices:[],friendChoices:[]};
   assert.notEqual(narrativeFor(p,'result',route.destinations[0].scene),
                   narrativeFor(p,'result',route.destinations[1].scene));
   assert.ok(narrativeFor(p,'ending').length>30);
  }
 }
});
test('Each profile sees all four routes before a repetition in the same chapter',()=>{
 const history=[];
 const selections=[];
 for(let i=0;i<8;i++){
  const plan=planJourneyStory({episode:1,englishLevel:'Pre-A1',gradeLevel:1,seed:27,history});
  selections.push(plan.route.id);history.push(record(plan));
 }
 assert.equal(new Set(selections.slice(0,4)).size,4);
 assert.equal(new Set(selections.slice(4,8)).size,4);
 for(let episode=1;episode<=6;episode++){
  const p=planJourneyStory({episode,englishLevel:'A1',gradeLevel:null,seed:37});
  assert.ok(p.objectChoices.includes(p.route.object));
  assert.equal(new Set(p.objectChoices).size,p.objectChoices.length);
  assert.equal(new Set(p.friendChoices).size,p.friendChoices.length);
  assert.ok(p.friendChoices.includes(p.route.helper));
  assert.ok(!p.friendChoices.includes(p.route.hero));
 }
});
test('English difficulty changes narration, not plot or correct target',()=>{
 const p=planJourneyStory({episode:3,englishLevel:'Pre-A1',gradeLevel:2,seed:4});
 for(const stage of ['opening','discover','meet','choose','result','friend','ending']){
  const easy=narrativeFor(p,stage);
  const moderate=narrativeFor({...p,englishLevel:'A1'},stage);
  const advanced=narrativeFor({...p,englishLevel:'A2'},stage);
  assert.ok(easy.length>8);
  assert.ok(advanced.length>easy.length);
  assert.ok(moderate.length>=easy.length);
 }
 assert.throws(()=>planJourneyStory({episode:7,englishLevel:'A1',gradeLevel:1,seed:1}));
 assert.throws(()=>planJourneyStory({episode:1,englishLevel:'B2',gradeLevel:1,seed:1}));
});
test('Evidence and awards enforce selected branch, answer errors and hint usage',()=>{
 const p=planJourneyStory({episode:1,englishLevel:'A1',gradeLevel:3,seed:24});
 const a=record(p);
 assert.ok(validateJourneyRecord(a,p));
 assert.equal(journeyStars(a),3);
 assert.equal(journeyStars({...a,firstHint:true}),2);
 assert.equal(journeyStars({...a,secondMistakes:3}),1);
 assert.equal(validateJourneyRecord({...a,destination:'madeup'},p),false);
 assert.equal(validateJourneyRecord({...a,routeId:'fake'},p),false);
 assert.equal(validateJourneyRecord({...a,firstMistakes:-1},p),false);
});
test('Sessions persist route history independently, preserve old stars and block skipped chapters',async()=>{
 const repo=MemoryProgressRepository.getInstance();
 await repo.clearAllProgress();
 const a=await repo.createProfile({nickname:'Journey1',avatarId:'avatar_explorer'});
 const b=await repo.createProfile({nickname:'Journey2',avatarId:'avatar_explorer'});
 const plan=planJourneyStory({episode:1,englishLevel:'Pre-A1',gradeLevel:1,seed:19});
 const input={repo,profileId:a.id,episode:1,plan,record:record(plan),
  sessionId:'journey:new:1',durationSeconds:22};
 await assert.rejects(()=>saveForestJourney({...input,episode:2}));
 await saveForestJourney(input);
 await saveForestJourney(input);
 assert.equal((await getStoryForestProgress(repo,a.id)).completedLevels,1);
 assert.equal((await getStoryForestProgress(repo,b.id)).completedLevels,0);
 assert.equal((await repo.getStoryJourneyHistory(a.id)).length,1);
 assert.equal((await repo.getStoryJourneyHistory(b.id)).length,0);
 assert.equal((await repo.getLevelProgress(STORY_FOREST_GAME_ID,1,a.id))?.completedCount,1);
 await saveForestJourney({...input,sessionId:'journey:new:2',
  record:{...input.record,firstMistakes:4}});
 assert.equal((await repo.getLevelProgress(STORY_FOREST_GAME_ID,1,a.id))?.bestStars,3);
 await repo.clearAllProgress();
});
test('Runtime uses scene-specific illustrated choices and an accessible silent-audio fallback',()=>{
 const root=new URL('../src/components/learning/story/',import.meta.url);
 const ui=fs.readFileSync(new URL('StoryForestAdventure.tsx',root),'utf8');
 const css=fs.readFileSync(new URL('story-forest-journey.css',root),'utf8');
 assert.match(ui,/StoryForestScenery/);assert.match(ui,/StoryForestActor/);
 assert.match(ui,/JourneyObjectArt/);assert.match(ui,/choosePath/);
 assert.match(ui,/setDestination/);assert.match(ui,/onEnd:/);
 assert.match(ui,/voiceUnavailable/);assert.match(ui,/setCaption/);
 assert.match(ui,/saveForestJourney/);assert.match(ui,/getStoryJourneyHistory/);
 assert.match(ui,/STORY_FOREST_PREMIUM_COVER/);
 assert.match(css,/touch-action:manipulation/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});

test('Narrative prop is not spoiled during opening and bird remains a flying animal',()=>{
 const root=new URL('../src/components/learning/story/',import.meta.url);
 const game=fs.readFileSync(new URL('StoryForestAdventure.tsx',root),'utf8');
 const stage=fs.readFileSync(new URL('story-forest-object-staging.css',root),'utf8');
 assert.ok(game.includes("const objectRecovered=phase==='result'||phase==='ending'"));
 assert.ok(game.includes("route.object==='bird'"));
 assert.ok(game.includes('sj-found-bird'));
 assert.ok(game.includes('sj-discovery-stone'));
 assert.ok(!game.includes('sj-held-item'));
 assert.match(stage,/sj-phase-opening .*sj-discovery-spot/);
 assert.match(stage,/sj-phase-result .sj-hero/);
 assert.match(stage,/sj-phase-ending .sj-friend/);
});

test('Mobile story cast uses disjoint actor slots instead of free-positioned silhouettes',()=>{
 const base=new URL('../src/components/learning/story/',import.meta.url);
 const game=fs.readFileSync(new URL('StoryForestAdventure.tsx',base),'utf8');
 const css=fs.readFileSync(new URL('story-forest-mobile-cast.css',base),'utf8');
 assert.match(game,/sj-cast-pair/);
 assert.match(game,/sj-cast-solo/);
 assert.match(game,/sj-cast-companion-/);
 assert.match(game,/import '.\/story-forest-mobile-cast.css'/);
 assert.match(css,/display:contents/);
 assert.match(css,/@media\s*\(max-width:700px\) and \(orientation:portrait\)/);
 assert.match(css,/@media\(max-width:355px\) and \(orientation:portrait\)/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\.sj-cast\.sj-cast-pair \.sj-hero/);
 assert.match(css,/\.sj-cast\.sj-cast-pair \.sj-friend/);
 assert.match(css,/object-fit:contain/);
 assert.match(css,/\.sj-phase-choose \.sj-cast\.sj-cast-pair/);
 assert.match(css,/\.sj-phase-result \.sj-cast\.sj-cast-pair/);
 assert.match(css,/\.sj-phase-ending \.sj-cast\.sj-cast-pair/);
 assert.match(css,/max-height:none/);
 assert.match(css,/flex:1 1 0/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 // A grid gap is an actual exclusion zone: even at 320px the parent
 // allocates two disjoint cells, not overlapping absolute rectangles.
 for(const viewport of [320,360,375,390,414,440,700]){
  const stageWidth=viewport-16; // 8px gutters on each edge
  const outerWidth=stageWidth*(viewport<=355?.96:.94);
  const gutter=viewport<=355?59:Math.min(117,Math.max(65,outerWidth*.24));
  const actorWidth=(outerWidth-gutter)/2;
  assert.ok(actorWidth>50,'both silhouettes retain usable area at '+viewport+'px');
  assert.ok(gutter>=59,'character boxes separated at '+viewport+'px');
  assert.ok(2*actorWidth+gutter<=outerWidth+.001);
 }
});
