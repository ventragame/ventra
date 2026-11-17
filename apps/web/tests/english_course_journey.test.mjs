import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 ENGLISH_COURSE_VERSION,JOURNEY_CHAPTERS,COURSE_MILESTONES,
 journeyGameLevelIds,loadJourneySnapshot,buildJourneyViewModel,validateJourneyMap
} from '../src/lib/learning/englishCourseJourney.ts';
import {CURRICULUM_SURFACES,ENGLISH_CURRICULUM_OUTCOMES} from '../src/lib/learning/englishCurriculum.ts';
import {ARCHIPELAGO_ISLANDS_ORDERED} from '../../../packages/shared/src/archipelago.ts';
const all=(id,amount,accuracy=0.97)=>Object.fromEntries(Array.from({length:amount},(_,i)=>[
 i+1,{completedCount:1,bestStars:3,bestAccuracy:accuracy,attemptsCount:4,lastCompletedAt:'2026-11-16T00:00:00.000Z'}
]));
const source=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const store=()=>new Map(CURRICULUM_SURFACES.map(s=>[s.gameId,{}]));
const repoFor=(db,fail=new Set())=>({
 async getAllLevelProgress(id,profileId){
  assert.equal(profileId,'child-1');
  if(fail.has(id))throw new Error('Simulated storage error');
  if(!db.has(id))throw new Error('Unknown game ID '+id);
  return db.get(id);
 },
 async getLevelProgress(gameId,levelId,profileId){
  assert.equal(profileId,'child-1');assert.equal(levelId,1);
  if(fail.has(gameId))throw new Error('Legacy storage failure');
  return db.get(gameId)?.[1]??null;
 }
});
test('Seven-course stage map exactly covers 14 REAL curriculum surfaces without mutating 6 island IDs',()=>{
 assert.match(ENGLISH_COURSE_VERSION,/^kids-english-journey-p2-/);
 assert.deepEqual(validateJourneyMap(),[]);
 assert.equal(JOURNEY_CHAPTERS.length,7);
 assert.equal(CURRICULUM_SURFACES.length,14);
 assert.equal(new Set(JOURNEY_CHAPTERS.flatMap(s=>s.surfaces)).size,14);
 assert.deepEqual(ARCHIPELAGO_ISLANDS_ORDERED.map(s=>s.id),[
  'word_garden','story_castle','listening_forest','speaking_harbor',
  'sentence_workshop','language_academ']);
 for(const step of COURSE_MILESTONES){
  assert.ok(CURRICULUM_SURFACES.some(x=>x.id===step.surface));
  assert.ok(step.atLeast>0);
 }
});
test('Progress levels are counted only for actual English placement and age ceiling',()=>{
 for(const placement of ['Pre-A1','A1','A2']){
  const a=journeyGameLevelIds('garden.alphabet',1,placement);
  assert.equal(a.length,12);assert.equal(new Set(a).size,12);
  assert.equal(a[0],placement==='Pre-A1'?1:placement==='A1'?13:25);
  assert.equal(journeyGameLevelIds('garden.numbers',1,placement).length,5);
 }
 assert.equal(journeyGameLevelIds('garden.numbers',3,'A1').length,10);
 assert.equal(journeyGameLevelIds('garden.numbers',6,'A2').length,15);
 assert.equal(journeyGameLevelIds('garden.numbers',null,'A2').length,5);
 const unique=new Set(CURRICULUM_SURFACES.map(x=>x.gameId));
 assert.equal(unique.size,14);
});
test('A new Pre-A1 child starts with alphabet; higher placement starts with contextual words',async()=>{
 const repo=repoFor(store());
 for(const placement of ['Pre-A1','A1','A2']){
  const snapshot=await loadJourneySnapshot(repo,'child-1',placement,1);
  const model=buildJourneyViewModel(snapshot);
  assert.equal(snapshot.games.length,14);
  assert.equal(model.savedGames,0);
  assert.ok(model.totalGames>70);
  assert.equal(model.failedGames,0);
  assert.equal(model.primary?.surfaceId,placement==='Pre-A1'?'garden.alphabet':'garden.animals');
  assert.equal(model.cards.find(x=>x.surfaceId==='garden.colors')?.accessible,false);
  assert.equal(model.cards.find(x=>x.surfaceId==='garden.numbers')?.accessible,false);
  assert.equal(model.review,null);
 }
});
test('Milestones alternate letters and animals and honor actual existing Garden locks',async()=>{
 const data=store();
 const alp=data.get('island_word_garden_alphabet');
 alp[1]={completedCount:1,bestStars:2,attemptsCount:2,bestAccuracy:0.9};
 alp[2]={completedCount:1,bestStars:2,attemptsCount:2,bestAccuracy:0.9};
 let vm=buildJourneyViewModel(await loadJourneySnapshot(repoFor(data),'child-1','Pre-A1',1));
 assert.equal(vm.primary.surfaceId,'garden.animals');
 data.set('island_word_garden_steps',all(0,2));
 vm=buildJourneyViewModel(await loadJourneySnapshot(repoFor(data),'child-1','Pre-A1',1));
 assert.equal(vm.primary.surfaceId,'garden.alphabet');
 data.set('island_word_garden_steps',all(0,5));
 vm=buildJourneyViewModel(await loadJourneySnapshot(repoFor(data),'child-1','Pre-A1',1));
 assert.equal(vm.cards.find(x=>x.surfaceId==='garden.colors').accessible,true);
 assert.equal(vm.cards.find(x=>x.surfaceId==='garden.numbers').accessible,false);
 data.set('island_word_garden_colors',all(0,3));
 vm=buildJourneyViewModel(await loadJourneySnapshot(repoFor(data),'child-1','Pre-A1',1));
 assert.equal(vm.cards.find(x=>x.surfaceId==='garden.numbers').accessible,true);
});
test('Corrupt/denied progress fails closed instead of pretending the learner has zero completed lessons',async()=>{
 const data=store();
 const missing='island_word_garden_alphabet';
 const vm=buildJourneyViewModel(await loadJourneySnapshot(repoFor(data,new Set([missing])),'child-1','Pre-A1',1));
 assert.equal(vm.failedGames,1);
 const card=vm.cards.find(x=>x.surfaceId==='garden.alphabet');
 assert.equal(card.status,'error');
 assert.equal(card.accessible,false);
 assert.equal(card.nextLevel,null);
 assert.equal(vm.primary.surfaceId,'garden.animals');
 const allFail=buildJourneyViewModel(await loadJourneySnapshot(repoFor(data,new Set([...data.keys()])),'child-1','Pre-A1',1));
 assert.equal(allFail.failedGames,14);
 assert.equal(allFail.primary,null);
 assert.equal(allFail.savedGames,0);
 assert.equal(allFail.totalGames,0);
});
test('A legacy whole-island completion stays recognized and never relocks colors for an upgraded child',async()=>{
 const db=store();
 db.set('island_word_garden',{1:{completedCount:1,bestStars:3}});
 let vm=buildJourneyViewModel(await loadJourneySnapshot(repoFor(db),'child-1','Pre-A1',2));
 assert.equal(vm.cards.find(x=>x.surfaceId==='garden.animals').completed,5);
 assert.equal(vm.cards.find(x=>x.surfaceId==='garden.colors').accessible,true);
 db.delete('island_word_garden');
 db.set('phaser_exploration_island',{1:{completedCount:1,bestStars:3}});
 vm=buildJourneyViewModel(await loadJourneySnapshot(repoFor(db),'child-1','Pre-A1',2));
 assert.equal(vm.cards.find(x=>x.surfaceId==='garden.colors').accessible,true);
 const partial=store();
 partial.set('island_word_garden_steps',{1:{completedCount:1,bestStars:2},3:{completedCount:1,bestStars:2}});
 vm=buildJourneyViewModel(await loadJourneySnapshot(repoFor(partial),'child-1','Pre-A1',2));
 assert.equal(vm.cards.find(x=>x.surfaceId==='garden.animals').completed,1);
 assert.equal(vm.cards.find(x=>x.surfaceId==='garden.colors').accessible,false);
});

test('Honest review hints never upgrade raw game stars to verified language mastery',async()=>{
 const data=store();
 data.set('island_word_garden_alphabet',{1:{completedCount:1,bestStars:2,bestAccuracy:0.5,attemptsCount:3}});
 data.set('island_word_garden_steps',{1:{completedCount:1,bestStars:1,bestAccuracy:0.55,attemptsCount:3}});
 const vm=buildJourneyViewModel(await loadJourneySnapshot(repoFor(data),'child-1','Pre-A1',2));
 assert.equal(vm.primary.surfaceId,'garden.alphabet');
 assert.equal(vm.review.surfaceId,'garden.animals');
 assert.equal(vm.review.kind,'review');
 assert.ok(!('mastered' in vm.cards[0]));
 const limited=vm.cards.filter(x=>x.outcomes.some(o=>o.coverage==='gap'));
 assert.equal(limited.length,0);
 const a2=buildJourneyViewModel(await loadJourneySnapshot(repoFor(data),'child-1','A2',2));
 assert.equal(a2.cards.find(x=>x.surfaceId==='garden.alphabet').outcomes.every(o=>o.coverage!=='gap'),true);
 assert.ok(a2.cards.find(x=>x.surfaceId==='garden.alphabet').outcomes.every(o=>o.topic!=='phonics'));
 assert.ok(ENGLISH_CURRICULUM_OUTCOMES.some(o=>o.topic==='phonics'&&o.placement==='A2'&&o.coverage==='gap'));
});
test('Course can actually route to ALL Word Garden subgames, Story Forest three subgames and four independent islands',()=>{
 const kids=source('../src/app/kids/page.tsx');
 const garden=source('../src/components/learning/LearningPathModal.tsx');
 const forest=source('../src/components/learning/story/StoryForestHome.tsx');
 const ui=source('../src/components/learning/journey/EnglishJourneyDashboard.tsx');
 const styles=source('../src/components/learning/journey/english-journey-dashboard.css');
 assert.match(kids,/handleOpenCourseSurface/);
 assert.match(kids,/onOpenSurface=\{handleOpenCourseSurface\}/);
 assert.match(kids,/initialSurface=\{journeySurface\}/);
 assert.match(kids,/initialGame=\{journeySurface==='forest.discovery'/);
 assert.match(kids,/kids-course-floating/);
 assert.match(kids,/isJourneyOpen \|\|/);
 for(const section of ['alphabet','animals','colors','numbers','food','family','sanctuary']){
  assert.match(garden,new RegExp("'"+section+"'"));
 }
 assert.match(garden,/INITIAL_GARDEN_DESTINATIONS/);
 assert.match(forest,/initialGame='home'/);
 assert.match(ui,/role="dialog"/);
 assert.match(ui,/aria-modal="true"/);
 assert.match(ui,/role="progressbar"/);
 assert.match(ui,/aria-label="Yedi öğrenme durağı"/);
 assert.match(ui,/Kayıtlı tamamlanan oyun görevi/);
 assert.match(styles,/prefers-reduced-motion:reduce/);
 assert.match(styles,/max-width:670px/);
});
