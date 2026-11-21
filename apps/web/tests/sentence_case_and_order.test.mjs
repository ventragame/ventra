import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 planPlazaMission,plazaCurriculumPool,plazaWordTiles,evaluatePlazaSentence
} from '../src/lib/learning/sentencePlazaEngine.ts';
import {planMovementMagic,checkMagicSentence} from '../src/lib/learning/movementMagicEngine.ts';
import {planWishFestival,checkWishSentence} from '../src/lib/learning/wishFestivalEngine.ts';
import {planLanternFestival,checkLanternSentence} from '../src/lib/learning/lanternFestivalEngine.ts';
import {
 sentenceWordKey,firstSentenceMismatch,sentenceMatches,decoysOutsideSentence
} from '../src/lib/learning/sentenceTokens.ts';

const LEVELS=['Pre-A1','A1','A2'];
const GRADES=[null,1,3,5,7];
const lowerFirst=tokens=>[tokens[0].toLowerCase(),...tokens.slice(1)];

test('Case is typography: a lowercase first tile still forms the correct sentence',()=>{
 assert.equal(sentenceWordKey('Is'),'is');
 assert.ok(sentenceMatches(['Is','the','cat','under','the','tree'],['is','the','cat','under','the','tree']));
 assert.ok(sentenceMatches(['The','cat','is','under','the','tree'],['the','cat','is','under','The','tree']),
  'the two "the" tiles are interchangeable');
 assert.equal(firstSentenceMismatch(['The','cat','runs'],['the','dog','runs']),1,'real word errors are still caught');
 assert.ok(!sentenceMatches(['I','like','apples'],['I','like']),'missing words are still wrong');
 assert.deepEqual(decoysOutsideSentence(['is','are','the','can'],['Is','the','cat','red']),['are','can']);
});

test('No sentence game offers a decoy that only differs by case from a target word',()=>{
 const decks=[];
 for(const englishLevel of LEVELS)for(const grade of GRADES)for(const seed of [11,202,3003]){
  for(const mission of [1,2,3])decks.push(...planPlazaMission({mission,grade,englishLevel,seed}).questions);
  decks.push(...planMovementMagic({grade,englishLevel,seed}).deck.questions);
  decks.push(...planWishFestival({grade,englishLevel,seed}).deck.questions);
  decks.push(...planLanternFestival({grade,englishLevel,seed}).deck.questions);
 }
 assert.ok(decks.length>500);
 for(const q of decks){
  const keys=new Set(q.tokens.map(sentenceWordKey));
  for(const decoy of q.decoys)assert.ok(!keys.has(sentenceWordKey(decoy)),`${q.sentence}: decoy "${decoy}"`);
 }
});

test('Every validator accepts the correct sentence built with a lowercase first tile',()=>{
 for(const englishLevel of LEVELS)for(const grade of GRADES){
  for(const mission of [1,2,3]){
   for(const q of plazaCurriculumPool(mission,englishLevel)){
    assert.equal(evaluatePlazaSentence(q,lowerFirst(q.tokens)).correct,true,q.sentence);
   }
  }
  for(const trial of planMovementMagic({grade,englishLevel,seed:7}).trials)
   assert.ok(checkMagicSentence(trial,lowerFirst(trial.question.tokens)),trial.question.sentence);
  for(const trial of planWishFestival({grade,englishLevel,seed:7}).trials)
   assert.ok(checkWishSentence(trial,lowerFirst(trial.question.tokens)),trial.question.sentence);
  for(const trial of planLanternFestival({grade,englishLevel,seed:7}).trials)
   assert.ok(checkLanternSentence(trial,lowerFirst(trial.question.tokens)),trial.question.sentence);
 }
});

test('Word tiles never present the target words in reading order',()=>{
 let checked=0;
 for(const englishLevel of LEVELS)for(const mission of [1,2,3]){
  for(const q of plazaCurriculumPool(mission,englishLevel)){
   if(q.tokens.length<2)continue;
   for(let seed=1;seed<=25;seed++){
    const order=plazaWordTiles(q,seed*977).filter(t=>t.target).map(t=>t.id);
    assert.ok(!order.every((id,i)=>id==='word-'+i),`${q.sentence} seed ${seed} is in reading order`);
    checked++;
   }
  }
 }
 assert.ok(checked>1000);
});

test('Picture-choice answers are shuffled, not always the first option',()=>{
 const positions=new Set();
 for(const englishLevel of LEVELS)for(let seed=1;seed<=40;seed++){
  for(const q of planPlazaMission({mission:1,grade:3,englishLevel,seed}).questions){
   if(!q.sceneChoices)continue;
   assert.ok(q.sceneChoices.some(c=>c.id===q.correctSceneChoice),'answer stays available');
   positions.add(q.sceneChoices.findIndex(c=>c.id===q.correctSceneChoice));
  }
 }
 assert.ok(positions.size>=3,'correct colour appears in several positions: '+[...positions]);
});

test('Leaving during the final auto-advance saves the solved mission instead of dropping it',()=>{
 const ui=fs.readFileSync(new URL('../src/components/learning/sentence/SentencePlazaAdventure.tsx',import.meta.url),'utf8');
 const back=ui.slice(ui.indexOf(' function back(){'),ui.indexOf(' function openMission('));
 assert.match(back,/solved\.length===deck\.questions\.length/);
 assert.match(back,/void finish\(solved\);return;/);
 assert.ok(back.indexOf('if(savingLock.current)return;')<back.indexOf('clearTimer();soundService.cancelSpeech();'),
  'an in-flight save is never interrupted');
 assert.match(ui,/repo\.getSentenceAnswerHistory\(profileId\)\.catch\(\(\)=>\[\]\)/);
 assert.match(ui,/setLoadAttempt\(n=>n\+1\)/);
});
