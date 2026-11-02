import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ARCHIPELAGO_ISLANDS_ORDERED,ARCHIPELAGO_ISLANDS_CATALOG} from '../../../packages/shared/src/archipelago.ts';
import {ENGLISH_JOURNEY,JOURNEY_ORDER,describeLearnerRoute} from '../src/lib/learning/learningJourney.ts';
import {resolveVocabularyTier,resolveGradeAwarePolicy} from '../src/lib/learning/gradeAwareLearningPolicy.ts';
import {eligibleAnimalWords,ANIMAL_MEADOW_WORDS,ANIMAL_VOCAB_TIERS,planAnimalMission} from '../src/lib/learning/animalMissionEngine.ts';
import {eligibleColorWords} from '../src/lib/learning/colorMissionEngine.ts';
import {eligibleMarketWords,MARKET_AISLES} from '../src/lib/learning/foodMarketEngine.ts';
import {eligibleVillageWords,VILLAGE_DISTRICTS} from '../src/lib/learning/familyVillageEngine.ts';
import {templeAllowedWords,TEMPLE_CHAMBERS} from '../src/lib/learning/templeEngine.ts';
import {planNumberMission} from '../src/lib/learning/numberValleyEngine.ts';

const ids=['word_garden','story_castle','listening_forest','speaking_harbor','sentence_workshop','language_academy'];
test('Six islands follow vocabulary → sentences → stories → dialogue → writing → mastery, stable IDs preserved',()=>{
 assert.deepEqual(JOURNEY_ORDER,ids);
 assert.deepEqual(ARCHIPELAGO_ISLANDS_ORDERED.map(i=>i.id),ids);
 assert.deepEqual(ENGLISH_JOURNEY.map(i=>i.order),[1,2,3,4,5,6]);
 assert.deepEqual(ENGLISH_JOURNEY.map(i=>i.playable),[true,true,false,false,false,false]);
 assert.deepEqual(ENGLISH_JOURNEY.map(i=>i.goal),
  ['vocabulary','sentence-building','story-comprehension','dialogue','writing','integrated-mastery']);
 for(const [i,id] of ids.entries()){
  const world=ARCHIPELAGO_ISLANDS_CATALOG[id],plan=ENGLISH_JOURNEY[i];
  assert.equal(world.id,id);
  assert.equal(world.nameTr,plan.title);
  assert.equal(world.contentPublished,plan.playable);
  assert.ok(world.desktopAsset.endsWith('.webp'));
  assert.ok(world.mobileAsset.endsWith('_mobile.webp'));
  assert.ok(!world.contentPublished?world.unlockRequirementNotice.length>8:true);
  assert.deepEqual(Object.keys(plan.atLevel).sort(),['A1','A2','Pre-A1'].sort());
  for(const level of ['Pre-A1','A1','A2'])assert.ok(plan.atLevel[level].length>=3);
 }
});
test('Grade is separate from language placement and manifests do not over-claim CEFR certification',()=>{
 assert.equal(describeLearnerRoute(7,'Pre-A1').instructionSupport,'supported');
 assert.equal(describeLearnerRoute(1,'A2').instructionSupport,'supported');
 assert.equal(describeLearnerRoute(7,'A2').instructionSupport,'independent');
 assert.equal(describeLearnerRoute(null,'A2').gradeBand,'unselected');
 assert.equal(resolveVocabularyTier(1,'A2'),0);
 assert.equal(resolveVocabularyTier(7,'Pre-A1'),0);
 assert.equal(resolveVocabularyTier(7,'A1'),1);
 assert.equal(resolveVocabularyTier(7,'A2'),2);
 assert.equal(resolveVocabularyTier(null,'A2'),2);
 for(const grade of [0,9,1.5,NaN])assert.equal(resolveVocabularyTier(grade,'A2'),2);
 for(const level of ['Pre-A1','A1','A2'])for(const grade of [null,1,2,3,4,5,7,8]){
  const t=resolveVocabularyTier(grade,level);
  assert.ok([0,1,2].includes(t));
  const base=resolveGradeAwarePolicy({domain:'numbers',gradeLevel:grade,englishLevel:level});
  if(level==='Pre-A1')assert.equal(base.maxNumber,10);
  if(grade===1&&level==='A2')assert.equal(base.maxNumber,20);
 }
});
test('All five word catalogs use the SAME lower-of-grade-and-language tier policy',()=>{
 const inputs=[[1,'A2'],[7,'Pre-A1'],[3,'A1'],[7,'A1'],[7,'A2'],[null,'A2']];
 for(const [grade,level] of inputs){
  const tier=resolveVocabularyTier(grade,level);
  assert.deepEqual(Object.keys(ANIMAL_VOCAB_TIERS).sort(),ANIMAL_MEADOW_WORDS.map(x=>x.id).sort());
  assert.ok(eligibleAnimalWords(grade,level).every(w=>ANIMAL_VOCAB_TIERS[w.id]<=tier));
  assert.equal(eligibleAnimalWords(7,'A2').length,40);
  assert.ok(eligibleAnimalWords(1,'Pre-A1').length>=12);
  assert.ok(eligibleColorWords(grade,level).every(x=>(x.tier??0)<=tier));
  for(const aisle of MARKET_AISLES)assert.ok(eligibleMarketWords(aisle.id,grade,level).every(w=>w.tier<=tier));
  for(const district of VILLAGE_DISTRICTS)assert.ok(eligibleVillageWords(district.id,grade,level).every(w=>w.tier<=tier));
  for(const chamber of TEMPLE_CHAMBERS)assert.ok(templeAllowedWords(chamber.id,grade,level).every(w=>w.tier<=tier));
 }
});
test('Animal learner only sees eligible and previously discovered words in recall',()=>{
 const history=ANIMAL_MEADOW_WORDS.map(w=>({
  wordId:w.id,kind:'discovery',mistakes:0,firstTryCorrect:false,timestamp:'2026-11-01T00:00:00Z'
 }));
 for(const [grade,level] of [[1,'Pre-A1'],[7,'Pre-A1'],[3,'A1'],[7,'A2']]){
  const allowed=new Set(eligibleAnimalWords(grade,level).map(x=>x.id));
  const d=planAnimalMission({mission:1,history:[],gradeLevel:grade,englishLevel:level,seed:9});
  assert.ok(d.animals.every(id=>allowed.has(id)));
  const q=planAnimalMission({mission:2,history,gradeLevel:grade,englishLevel:level,seed:19,
   now:'2026-11-02T12:00:00Z'});
  assert.ok(q.questions.length>0);
  assert.ok(q.questions.every(row=>allowed.has(row.target)&&row.choices.every(w=>allowed.has(w))));
 }
});
test('Number Valley remains English-only and obeys separate grade/placement ceilings',()=>{
 for(const [grade,level,max] of [[1,'A2',20],[7,'Pre-A1',10],[3,'A1',100],[7,'A2',1000]]){
  const plan=planNumberMission({mission:1,seed:7,gradeLevel:grade,englishLevel:level,history:[]});
  assert.ok(plan.discoveries.every(n=>n>=1&&n<=max));
 }
 const src=fs.readFileSync(new URL('../src/components/learning/activities/NumberValleyAdventure.tsx',import.meta.url),'utf8');
 assert.match(src,/numberWordParts\(current.target\)/);
 assert.doesNotMatch(src,/Which costs less/);
});
test('Active map displays selected grade AND English placement, future islands remain locked',()=>{
 const src=fs.readFileSync(new URL('../src/components/learning/WordGardenDistrictMap.tsx',import.meta.url),'utf8');
 const modal=fs.readFileSync(new URL('../src/components/learning/LearningPathModal.tsx',import.meta.url),'utf8');
 assert.match(src,/describeLearnerRoute\(gradeLevel,englishLevel\)/);
 assert.match(src,/Bugünkü hedef:/);
 assert.match(modal,/englishLevel=\{englishLevel\}\s+colorsAvailable/);
 const scene=fs.readFileSync(new URL('../src/components/game/scenes/WorldScene.ts',import.meta.url),'utf8');
 assert.ok(scene.indexOf("from: 'story_castle'")>scene.indexOf("from: 'word_garden'"));
 assert.ok(scene.indexOf("from: 'listening_forest'")>scene.indexOf("from: 'story_castle'"));
});
