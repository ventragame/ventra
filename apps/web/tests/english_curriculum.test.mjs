import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 ENGLISH_CURRICULUM_VERSION,ENGLISH_CURRICULUM_TOPICS,ENGLISH_CURRICULUM_OUTCOMES,
 ENGLISH_PLACEMENTS,CURRICULUM_SURFACES,
 getEnglishCurriculum,getEnglishCurriculumByIsland,findEnglishOutcome,
 missingEnglishPrerequisites,getEnglishCurriculumCoverage,validateEnglishCurriculum
} from '../src/lib/learning/englishCurriculum.ts';
import {getJourneyCurriculum,describeLearnerRoute,JOURNEY_ORDER} from '../src/lib/learning/learningJourney.ts';
import {ARCHIPELAGO_ISLANDS_ORDERED,ARCHIPELAGO_ISLANDS_CATALOG} from '../../../packages/shared/src/archipelago.ts';

test('P0 English curriculum defines exactly three placements for every stable topic',()=>{
 assert.match(ENGLISH_CURRICULUM_VERSION,/^kids-english-p3-/);
 assert.deepEqual(ENGLISH_PLACEMENTS,['Pre-A1','A1','A2']);
 assert.equal(ENGLISH_CURRICULUM_TOPICS.length,28);
 assert.equal(ENGLISH_CURRICULUM_OUTCOMES.length,84);
 assert.deepEqual(validateEnglishCurriculum(),[]);
 const seen=new Set();
 for(const topic of ENGLISH_CURRICULUM_TOPICS){
  assert.ok(!seen.has(topic.id));seen.add(topic.id);
  assert.deepEqual(
   ENGLISH_CURRICULUM_OUTCOMES.filter(o=>o.topic===topic.id).map(o=>o.placement),
   ENGLISH_PLACEMENTS
  );
 }
});

test('All real teaching surfaces point to valid existing island IDs, game IDs and source files',()=>{
 const physicalIds=ARCHIPELAGO_ISLANDS_ORDERED.map(x=>x.id);
 assert.equal(CURRICULUM_SURFACES.length,15);
 assert.deepEqual(JOURNEY_ORDER,physicalIds);
 assert.equal(new Set(CURRICULUM_SURFACES.map(x=>x.gameId)).size,CURRICULUM_SURFACES.length);
 const gameIdSources={
  'garden.alphabet':'../src/lib/learning/alphabetGroveEngine.ts',
  'garden.themes':'../src/lib/learning/themeQuestCatalog.ts',
  'garden.animals':'../src/lib/progress/wordGardenProgress.ts',
  'garden.colors':'../src/lib/progress/colorGroveProgress.ts',
  'garden.numbers':'../src/lib/progress/numberValleyProgress.ts',
  'garden.food':'../src/lib/learning/foodMarketEngine.ts',
  'garden.family':'../src/lib/learning/familyVillageEngine.ts',
  'garden.temple':'../src/lib/learning/templeEngine.ts',
  'plaza.sentences':'../src/lib/learning/sentencePlazaEngine.ts',
  'forest.discovery':'../src/lib/progress/storyForestProgress.ts',
  'forest.sequence':'../src/lib/learning/storySequenceEngine.ts',
  'forest.detective':'../src/lib/learning/storyDetectiveEngine.ts',
  'harbor.dialogue':'../src/lib/learning/harborDialogueEngine.ts',
  'workshop.writing':'../src/lib/learning/writingWorkshopEngine.ts',
  'academy.atlas':'../src/lib/learning/academyEngine.ts'
 };
 for(const surface of CURRICULUM_SURFACES){
  assert.ok(ARCHIPELAGO_ISLANDS_CATALOG[surface.islandId],surface.id+' invalid island');
  const source=new URL('../../../'+surface.source,import.meta.url);
  assert.ok(fs.existsSync(source),'missing source for '+surface.id+': '+surface.source);
  const authoritative=fs.readFileSync(new URL(gameIdSources[surface.id],import.meta.url),'utf8');
  assert.ok(authoritative.includes(surface.gameId),'gameId mismatch: '+surface.id);
 }
});

test('Every authored outcome has a real playable game route and planned gaps never masquerade as lessons',()=>{
 const ids=new Set(CURRICULUM_SURFACES.map(x=>x.id));
 const coverage=getEnglishCurriculumCoverage();
 for(const p of coverage){
  assert.equal(p.authored,p.placement==='Pre-A1'?28:27);
  assert.equal(p.gap,p.placement==='A2'?1:0);
  assert.equal(p.partial,p.placement==='A1'?1:0);
 }
 for(const outcome of ENGLISH_CURRICULUM_OUTCOMES){
  assert.ok(outcome.descriptionTr.length>16);
  assert.ok(outcome.modelEnglish.length>1);
  if(outcome.coverage==='gap')assert.deepEqual(outcome.surfaceIds,[]);
  else assert.ok(outcome.surfaceIds.length>=1&&outcome.surfaceIds.every(id=>ids.has(id)));
  assert.equal(findEnglishOutcome(outcome.id)?.topic,outcome.topic);
  assert.ok(!/mastered|certified/i.test(outcome.quality));
 }
 for(const placement of ENGLISH_PLACEMENTS){
  const all=getEnglishCurriculum({placement});
  assert.equal(all.length,28);
  assert.equal(getEnglishCurriculum({placement,includeGaps:false}).length,placement==='A2'?27:28);
  assert.equal(getEnglishCurriculum({placement,topics:['phonics']}).length,1);
  assert.equal(getEnglishCurriculum({placement,topics:['phonics'],includeGaps:false}).length,placement==='A2'?0:1);
 }
});

test('Pedagogical prerequisites form a DAG and never silently change island locks',()=>{
 assert.equal(findEnglishOutcome('en.phonics.pre-a1').coverage,'authored');
 assert.equal(findEnglishOutcome('en.phonics.a1').coverage,'partial');
 assert.equal(findEnglishOutcome('en.phonics.a2').coverage,'gap');
 const a1=findEnglishOutcome('en.dialogue.a1');
 assert.ok(a1.prerequisiteIds.includes('en.dialogue.pre-a1'));
 assert.ok(a1.prerequisiteIds.includes('en.greetings.a1'));
 assert.ok(a1.prerequisiteIds.includes('en.requests.a1'));
 assert.deepEqual(missingEnglishPrerequisites('en.animals.pre-a1',[]),[]);
 assert.equal(missingEnglishPrerequisites('en.dialogue.a1',['en.dialogue.pre-a1']).length,2);
 assert.deepEqual(missingEnglishPrerequisites('en.dialogue.a1',a1.prerequisiteIds),[]);
 assert.throws(()=>missingEnglishPrerequisites('bad-goal',[]),RangeError);
 for(const island of ARCHIPELAGO_ISLANDS_ORDERED){
  assert.ok(island.contentPublished,'metadata change must not lock any island');
 }
});

test('Six-island journey and optional profile grade remain separate from placement/verified learning',()=>{
 for(const island of JOURNEY_ORDER)for(const placement of ENGLISH_PLACEMENTS){
  const byJourney=getJourneyCurriculum(island,placement);
  assert.deepEqual(byJourney,getEnglishCurriculumByIsland(island,placement));
  assert.ok(byJourney.length>=1, 'no outcome mapping for '+island+' at '+placement);
  assert.ok(byJourney.every(o=>o.surfaceIds.some(id=>CURRICULUM_SURFACES
   .some(s=>s.id===id&&s.islandId===island))));
 }
 for(const level of ENGLISH_PLACEMENTS){
  const younger=describeLearnerRoute(1,level),older=describeLearnerRoute(8,level);
  assert.deepEqual(younger.curriculumOutcomeIds,older.curriculumOutcomeIds);
  assert.deepEqual(younger.curriculumOutcomeIds,
   getJourneyCurriculum('word_garden',level).map(o=>o.id));
  assert.equal(younger.englishLevel,level);
  assert.equal(older.englishLevel,level);
 }
});
