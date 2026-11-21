import test from 'node:test';
import assert from 'node:assert/strict';
import {
 canonicalEnglishAnswer,sameEnglishAnswer,englishNumberWords,foldTurkishKeyboardLetters
} from '../src/lib/learning/englishAnswerText.ts';
import {matchesExpectedSpeech,normalizeSpeech} from '../src/lib/learning/harborDialogueEngine.ts';
import {HARBOR_QUESTS,getHarborQuestSteps} from '../src/lib/learning/harborMissionEngine.ts';
import {matchesAcademyAnswer} from '../src/lib/learning/academyEngine.ts';
import {isWorkshopAnswerCorrect,normalizeWorkshopAnswer} from '../src/lib/learning/writingWorkshopEngine.ts';

test('Turkish keyboard ı/İ never deletes or changes an English letter',()=>{
 assert.equal(foldTurkishKeyboardLetters('İ see a bırd'),'I see a bird');
 assert.equal(canonicalEnglishAnswer('İ found the golden compass.'),'i found the golden compass');
 assert.equal(canonicalEnglishAnswer('pınk card'),'pink card');
 assert.equal(normalizeWorkshopAnswer('ı see a cat'),'i see a cat','the letter is kept, not stripped');
 assert.ok(matchesAcademyAnswer('İ found the golden compass.','I found the golden compass.'));
 assert.ok(matchesAcademyAnswer('pınk card','pink card'));
});

test('Contractions and digits match the authored full form, both directions',()=>{
 const pairs=[
  ["I'm happy","I am happy!"],["I’M HAPPY","I am happy"],["IM HAPPY","I am happy"],
  ["It's beside the dock.","It is beside the dock."],["Let's go!","Let us go!"],
  ["We're here to help you!","We are here to help you!"],["That's very kind","That is very kind"],
  ["I'd like some water, please.","I would like some water, please."],
  ["I don't like rain","I do not like rain"],["I can't swim","I cannot swim"],
  ["I need 2 apples.","I need two apples."],["I am 25","I am twenty-five"],["100 stars","one hundred stars"]
 ];
 for(const [said,authored] of pairs){
  assert.ok(sameEnglishAnswer(said,authored),said+' = '+authored);
  assert.ok(sameEnglishAnswer(authored,said),authored+' = '+said);
 }
});

test('Canonical answers are not fuzzy: different words still fail',()=>{
 for(const [a,b] of [['red bag','red box'],['I am sad','I am happy'],['its tail','it is tail'],
  ['lets go','let us go'],['I need 3 apples','I need two apples'],['','']]){
  assert.equal(sameEnglishAnswer(a,b),false,a+' must not equal '+b);
 }
 assert.equal(englishNumberWords(42),'forty two');
 assert.equal(englishNumberWords(101),null);
 assert.equal(canonicalEnglishAnswer('Room 404'),'room 404','numbers above 100 stay as digits');
});

test('Harbor accepts recognised contractions of every authored reply',()=>{
 assert.equal(normalizeSpeech(' Hello, WORLD!  '),'hello world');
 const contract=text=>text
  .replace(/\bI am\b/g,"I'm").replace(/\bIt is\b/g,"It's").replace(/\bthat is\b/gi,"that's")
  .replace(/\bWe are\b/g,"We're").replace(/\bI would\b/g,"I'd").replace(/\bLet us\b/g,"Let's");
 let contracted=0;
 for(const quest of HARBOR_QUESTS)for(const level of ['Pre-A1','A1','A2'])for(const step of getHarborQuestSteps(quest,level)){
  const replies=step.accept;
  for(const reply of replies){
   const spoken=contract(reply);
   if(spoken===reply)continue;
   contracted++;
   assert.ok(matchesExpectedSpeech([spoken],replies),`"${spoken}" should match "${reply}"`);
  }
 }
 assert.ok(contracted>0,'harbor content contains contractible replies');
});

test('Writing workshop accepts contractions and Turkish-keyboard letters as the same sentence',()=>{
 const task={id:'t',mode:'write',target:'I am at the harbor.',accepted:[]};
 assert.ok(isWorkshopAnswerCorrect(task,"I'm at the harbor"));
 assert.ok(isWorkshopAnswerCorrect(task,'ı am at the harbor.'));
 assert.ok(!isWorkshopAnswerCorrect(task,'I am at the school.'));
 assert.ok(!isWorkshopAnswerCorrect(task,'   '));
});

test('Writing tasks with a two-sentence answer always show the exact Turkish sentences to write',async()=>{
 const {WORKSHOP_CHAPTERS}=await import('../src/lib/learning/writingWorkshopEngine.ts');
 let checked=0;
 for(const chapter of WORKSHOP_CHAPTERS)for(const level of ['Pre-A1','A1','A2'])for(const task of chapter.quests[level]){
  if(task.mode!=='write')continue;
  assert.doesNotMatch(task.promptTr,/^(İki cümlelik|Bir dostluk cümlesi|Kısa bir seyahat notu|Hikâyeye mutlu bir bitiş)/,
   'open-ended prompt with a single exact answer: '+task.promptTr);
  if(/[.!?] [A-Z]/.test(task.target)){
   assert.match(task.promptTr,/“[^”]+”/,'two-sentence task needs the Turkish model: '+task.target);
   checked++;
  }
 }
 assert.ok(checked>=5);
});
