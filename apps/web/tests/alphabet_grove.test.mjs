import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
 ALPHABET_LETTERS,ALPHABET_LESSONS,ALPHABET_TOTAL_LESSONS,
 ALPHABET_WORDS,ALPHABET_GROVE_GAME_ID,
 introducedAlphabetLetters,eligibleAlphabetWords,
 alphabetLessonLevelId,planAlphabetLesson,alphabetTaskCorrect,alphabetHint,validateAlphabetCatalog
} from '../src/lib/learning/alphabetGroveEngine.ts';
import {getAlphabetProgress,recordAlphabetLesson} from '../src/lib/learning/alphabetProgress.ts';
import {
 alphabetCheckpointKey,parseAlphabetCheckpoint,ALPHABET_CHECKPOINT_TTL
} from '../src/lib/learning/alphabetCheckpoint.ts';
import {
 CURRICULUM_SURFACES,getEnglishCurriculum,findEnglishOutcome,validateEnglishCurriculum
} from '../src/lib/learning/englishCurriculum.ts';
const levels=['Pre-A1','A1','A2'];

test('P1 covers exactly 26 unique A-Z letters in nine introductory and three reinforcement lessons',()=>{
 assert.equal(ALPHABET_LETTERS.length,26);
 assert.equal(ALPHABET_TOTAL_LESSONS,12);
 assert.equal(ALPHABET_LESSONS.length,12);
 assert.deepEqual(validateAlphabetCatalog(),[]);
 const all=ALPHABET_LETTERS.map(x=>x.id);
 assert.equal(new Set(all).size,26);
 assert.equal([...all].sort().join(''),'abcdefghijklmnopqrstuvwxyz');
 assert.equal(ALPHABET_LESSONS.slice(0,9).flatMap(l=>l.letters).length,26);
 assert.deepEqual(introducedAlphabetLetters(1),['s','a','t']);
 assert.deepEqual(introducedAlphabetLetters(9).sort(),[...all].sort());
 assert.equal(eligibleAlphabetWords(1).length,1);
 for(let chapter=2;chapter<=12;chapter++){
  const learned=new Set(introducedAlphabetLetters(chapter));
  assert.ok(eligibleAlphabetWords(chapter).length>1);
  assert.ok(eligibleAlphabetWords(chapter).every(w=>w.word.split('').every(c=>learned.has(c))));
 }
 assert.equal(ALPHABET_WORDS.length,40);
 assert.equal(ALPHABET_LETTERS.find(x=>x.id==='q').anchor,'queen');
 assert.equal(ALPHABET_LETTERS.find(x=>x.id==='q').ipa,'/kw/');
 assert.equal(ALPHABET_LETTERS.find(x=>x.id==='x').focus,'end');
 assert.equal(ALPHABET_LETTERS.find(x=>x.id==='x').anchor,'fox');
});

test('All three English placements produce usable, deterministic varied lessons across grades',()=>{
 for(const level of levels){
  for(let lesson=1;lesson<=12;lesson++){
   const all=new Set();
   for(const gradeLevel of [1,3,6,null]){
    for(const replay of [0,1,2,11]){
     const deck=planAlphabetLesson({lesson,placement:level,gradeLevel,replay});
     assert.deepEqual(deck,planAlphabetLesson({lesson,placement:level,gradeLevel,replay}));
     assert.ok(deck.length>=9&&deck.length<=18);
     assert.ok(deck.some(x=>x.kind==='word-link'));
     assert.ok(deck.some(x=>x.kind==='letter-name'));
     assert.ok(deck.some(x=>x.kind==='sound-in-word'));
     assert.equal(deck.every(t=>t.choices.every(c=>typeof c==='string')),true);
     assert.equal(deck.every(t=>t.id.includes(':'+level+':')),true);
     assert.equal(new Set(deck.map(t=>t.id)).size,deck.length);
     for(const row of deck){
      if(row.kind==='sound-in-word')assert.equal(row.audioText?.length>0,true);
      if(row.kind==='introduce')assert.equal(row.choices.length,0);
      if(row.kind==='read-word')assert.ok(row.choices.length>=2,
       'No single-option reading questions: '+lesson);
     }
     const joined=deck.map(t=>t.id).join('|');
     if(gradeLevel===3){
      assert.ok(!all.has(joined),'Replay collision');
      all.add(joined);
     }
    }
   }
  }
 }
});

test('English picture-word links and short words grade case-insensitively without guessed pronunciation credit',()=>{
 const quiz=planAlphabetLesson({lesson:2,placement:'Pre-A1',gradeLevel:2,replay:1});
 for(const task of quiz){
  assert.ok(alphabetTaskCorrect(task,task.answer));
  assert.ok(alphabetTaskCorrect(task,task.answer.toUpperCase()));
  assert.equal(alphabetTaskCorrect(task,'__invalid__'),false);
  assert.ok(alphabetHint(task).length>=15);
 }
 for(const gradeLevel of [1,3,6,null]){
  const first=planAlphabetLesson({lesson:1,placement:'Pre-A1',gradeLevel,replay:0});
  assert.ok(first.some(t=>t.kind==='introduce'));
  assert.ok(first.every(t=>t.kind!=='read-word'));
  assert.ok(first.every(t=>t.kind!=='build-word'));
 }
 const q=planAlphabetLesson({lesson:9,placement:'A1',gradeLevel:4,replay:0});
 assert.ok(q.some(t=>t.kind==='sound-in-word'&&t.letterId==='x'&&t.audioText==='fox'));
 assert.ok(q.some(t=>t.kind==='sound-in-word'&&t.letterId==='q'&&t.audioText==='queen'));
});

test('Every English alphabet unit replaces trivial case matching with age-suitable word meaning',()=>{
 const examples=new Map(ALPHABET_LETTERS.map(x=>[x.id,x]));
 for(const placement of levels)for(let lesson=1;lesson<=12;lesson++)for(const gradeLevel of [1,3,6,null])for(const replay of [0,1,7,11]){
  const deck=planAlphabetLesson({lesson,placement,gradeLevel,replay});
  const names=deck.filter(t=>t.kind==='letter-name');
  const links=deck.filter(t=>t.kind==='word-link');
  assert.ok(names.length>=2, 'Listening task required');
  assert.ok(links.length>=2, 'English vocabulary task required');
  assert.equal(deck.some(t=>t.kind==='case'),false);
  assert.equal(deck.some(t=>t.promptTr.includes('küçük hâlini bul')),false);
  for(const task of names){
   const letter=examples.get(task.letterId);
   assert.equal(task.audioText,letter.upper, 'Speak only actual letter');
   assert.match(task.audioText,/^[A-Z]$/);
   assert.ok(task.choices.includes(letter.upper));
  }
  for(const task of links){
   const letter=examples.get(task.letterId);
   assert.equal(task.answer,letter.anchor);
   assert.ok(task.choices.includes(letter.anchor));
   assert.ok(task.choices.length>=2);
   assert.ok(task.choices.every(w=>ALPHABET_LETTERS.some(l=>l.anchor===w)));
   assert.equal(alphabetTaskCorrect(task,letter.anchor),true);
   assert.equal(alphabetTaskCorrect(task,'not an English anchor'),false);
   assert.ok(task.promptTr.includes(letter.tr));
  }
 }
 const x=planAlphabetLesson({lesson:9,placement:'A2',gradeLevel:3,replay:1});
 const fox=x.find(t=>t.kind==='word-link'&&t.letterId==='x');
 assert.equal(fox.answer,'fox');
 assert.match(fox.promptTr,/ile biten/);
});

test('Progress IDs isolate Pre-A1/A1/A2 without renaming the 6 main islands',()=>{
 const ids=new Set();
 for(const level of levels)for(let lesson=1;lesson<=12;lesson++){
  const id=alphabetLessonLevelId(lesson,level);
  assert.ok(id>=1&&id<=36);ids.add(id);
 }
 assert.equal(ids.size,36);
 assert.equal(ALPHABET_GROVE_GAME_ID,'island_word_garden_alphabet');
 const s=CURRICULUM_SURFACES.find(x=>x.id==='garden.alphabet');
 assert.equal(s?.islandId,'word_garden');
 assert.equal(s?.gameId,ALPHABET_GROVE_GAME_ID);
 assert.equal(findEnglishOutcome('en.letters.pre-a1')?.coverage,'authored');
 assert.equal(findEnglishOutcome('en.phonics.pre-a1')?.coverage,'authored');
 assert.equal(findEnglishOutcome('en.phonics.a1')?.coverage,'partial');
 assert.equal(findEnglishOutcome('en.phonics.a2')?.coverage,'gap');
 assert.equal(getEnglishCurriculum({placement:'A2',topics:['phonics'],includeGaps:false}).length,0);
 assert.deepEqual(validateEnglishCurriculum(),[]);
});

test('Per-profile category-only checkpoint has TTL, preserves task sequence and rejects tampering',()=>{
 const profileA='profile-a',profileB='profile-b';
 assert.notEqual(alphabetCheckpointKey(profileA,'Pre-A1',1),alphabetCheckpointKey(profileB,'Pre-A1',1));
 assert.notEqual(alphabetCheckpointKey(profileA,'Pre-A1',1),alphabetCheckpointKey(profileA,'A1',1));
 const deck=planAlphabetLesson({lesson:2,placement:'Pre-A1',gradeLevel:1,replay:0});
 const now=Date.UTC(2026,10,16);
 const raw={version:1,lesson:2,placement:'Pre-A1',replay:0,sessionId:'00000000-0000-4000-8000-000000000000',
  taskIds:deck.map(x=>x.id),step:1,answers:[{taskId:deck[0].id,kind:deck[0].kind,
   firstTryCorrect:false,mistakes:0,hintUsed:false,audioPlayed:false,independent:false}],
  mistakes:0,hints:0,expiresAt:now+ALPHABET_CHECKPOINT_TTL};
 assert.equal(parseAlphabetCheckpoint(JSON.stringify(raw),'Pre-A1',2,now)?.step,1);
 assert.equal(parseAlphabetCheckpoint(JSON.stringify(raw),'A1',2,now),null);
 assert.equal(parseAlphabetCheckpoint(JSON.stringify(raw),'Pre-A1',3,now),null);
 assert.equal(parseAlphabetCheckpoint(JSON.stringify(raw),'Pre-A1',2,now+ALPHABET_CHECKPOINT_TTL+1),null);
 assert.equal(parseAlphabetCheckpoint(JSON.stringify({...raw,step:2}),'Pre-A1',2,now),null);
 assert.equal(parseAlphabetCheckpoint(JSON.stringify({...raw,taskIds:[...raw.taskIds,'bogus']}),'Pre-A1',2,now),null);
 assert.equal(parseAlphabetCheckpoint(JSON.stringify({...raw,answers:[{...raw.answers[0],typedResponse:'secret'}]}),'Pre-A1',2,now),null);
 // The actual app never passes free-form text to this checkpoint or completion event.
 const cp=fs.readFileSync(new URL('../src/lib/learning/alphabetCheckpoint.ts',import.meta.url),'utf8');
 assert.doesNotMatch(cp,/transcript\s*:/);
});

test('Replay-safe completed sessions use a distinct game ID and retain old progress',async()=>{
 const rows={};const payloads=[];
 const repo={
  async getAllLevelProgress(gameId,profileId){
   assert.equal(gameId,ALPHABET_GROVE_GAME_ID);assert.equal(profileId,'child-a');
   return rows;
  },
  async recordGameCompleted(payload){
   payloads.push(payload);
   const old=rows[payload.levelId]??{bestStars:0,completedCount:0};
   rows[payload.levelId]={bestStars:Math.max(old.bestStars,payload.starsEarned),
    completedCount:old.completedCount+1};
   return {isDuplicate:false};
  }
 };
 const first=await getAlphabetProgress(repo,'child-a','A1');
 assert.equal(first.completed,0);
 const deck=planAlphabetLesson({lesson:3,placement:'A1',gradeLevel:3,replay:0});
 const answers=deck.map(task=>({taskId:task.id,kind:task.kind,firstTryCorrect:true,
  mistakes:0,hintUsed:false,audioPlayed:false,independent:task.kind==='word-link'}));
 const next=await recordAlphabetLesson({repo,profileId:'child-a',placement:'A1',lesson:3,
  answers,sessionId:'11111111-1111-4111-8111-111111111111',durationSeconds:61});
 assert.equal(next.completed,1);
 assert.equal(next.replays[3],1);
 assert.equal(payloads[0].levelId,15);
 assert.equal(payloads[0].gameId,ALPHABET_GROVE_GAME_ID);
 assert.equal(payloads[0].outcomeId,'en.letters.a1');
 assert.equal(payloads[0].starsEarned,3);
 assert.equal(payloads[0].metrics.accuracyRate<1,true);
 assert.equal((await getAlphabetProgress(repo,'child-a','Pre-A1')).completed,0);
 await assert.rejects(()=>recordAlphabetLesson({repo,profileId:'child-a',placement:'A1',lesson:3,
  answers:[],sessionId:'12345678-1111-4111-8111-111111111111',durationSeconds:12}));
});

test('UI is linked from Word Garden without modifying original six district IDs and contains accessibility controls',()=>{
 const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
 const ui=read('../src/components/learning/alphabet/AlphabetGroveAdventure.tsx');
 const modal=read('../src/components/learning/LearningPathModal.tsx');
 const map=read('../src/components/learning/WordGardenDistrictMap.tsx');
 const garden=read('../src/components/learning/world/gardenTheme.ts');
 assert.match(modal,/district==='alphabet'/);
 assert.match(modal,/onEnterAlphabet/);
 assert.match(modal,/onAlphabetProgressSaved/);
 assert.match(map,/Harf Korusu/);
 assert.match(map,/onEnterAlphabet/);
 assert.match(map,/Altı büyülü dünya/);
 assert.match(ui,/role="progressbar"/);
 assert.match(ui,/aria-live="polite"/);
 assert.match(ui,/saveAlphabetCheckpoint/);
 assert.match(ui,/onStart:/);
 assert.match(ui,/speak\(focus\.upper,'name'\)/);
 assert.match(ui,/ag-word-link-scene/);
 assert.doesNotMatch(ui,/speak\(['"]Letter /);
 assert.match(ui,/setAudioFailed/);

 assert.match(read('../src/components/learning/alphabet/alphabet-grove.css'),/prefers-reduced-motion:reduce/);
 assert.match(garden,/GARDEN_ORDER:readonly GardenDistrictId\[\]=\['animals','colors','numbers','food','family','sanctuary'\]/);
});
