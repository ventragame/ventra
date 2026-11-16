import test from 'node:test';
import assert from 'node:assert/strict';
import {
 WORKSHOP_CHAPTERS,WRITING_WORKSHOP_GAME_ID,getWorkshopTasks,workshopTaskCount,
 getLegacyWorkshopTasks,isWorkshopAnswerCorrect,workshopTiles,normalizeWorkshopAnswer,workshopFeedback
} from '../src/lib/learning/writingWorkshopEngine.ts';

test('Five chapters, 3 placements and 315 authored evidence-led writing tasks',()=>{
 assert.equal(WRITING_WORKSHOP_GAME_ID,'island_sentence_workshop_writing');
 assert.equal(WORKSHOP_CHAPTERS.length,5);
 const keys=new Set();
 for(const chapter of WORKSHOP_CHAPTERS){
  for(const level of ['Pre-A1','A1','A2']){
   const tasks=chapter.quests[level];
   assert.equal(tasks.length,21);
   for(const mode of ['spell','assemble','write'])
    assert.equal(tasks.filter(t=>t.mode===mode).length,7);
   assert.deepEqual(tasks.slice(0,3).map(x=>x.mode),['spell','assemble','write']);
   for(const t of tasks){
    assert.ok(t.target.length>1&&t.promptTr.length>=16&&t.icon.length>0);
    assert.ok(!keys.has(t.id));keys.add(t.id);
    assert.equal(isWorkshopAnswerCorrect(t,t.target),true);
    assert.equal(isWorkshopAnswerCorrect(t,'random unrelated content'),false);
   }
  }
 }
 assert.equal(keys.size,315);
});
test('Grade changes count independently from English placement, including older beginners',()=>{
 assert.equal(workshopTaskCount(null),7);
 assert.equal(workshopTaskCount(1),6);
 assert.equal(workshopTaskCount(3),7);
 assert.equal(workshopTaskCount(8),8);
 assert.equal(workshopTaskCount(12),7);
 for(const level of ['Pre-A1','A1','A2']){
  assert.equal(getWorkshopTasks(2,level,1).length,6);
  assert.equal(getWorkshopTasks(2,level,4).length,7);
  assert.equal(getWorkshopTasks(2,level,8).length,8);
 }
 assert.equal(getWorkshopTasks(2,'Pre-A1',8)[0].target,'cat');
 assert.equal(getWorkshopTasks(2,'A2',1)[0].target,'support');
 assert.throws(()=>getWorkshopTasks(6,'A2',4),RangeError);
});
test('Spelling and ordering tiles are deterministic, preserve repeated letters and vary replay',()=>{
 for(const chapter of WORKSHOP_CHAPTERS){
  for(const level of ['Pre-A1','A1','A2']){
   for(const task of chapter.quests[level]){
    if(task.mode==='write'){assert.equal(workshopTiles(task,2).length,0);continue;}
    const one=workshopTiles(task,1),two=workshopTiles(task,1);
    assert.deepEqual(one,two);
    assert.equal(new Set(one.map(x=>x.key)).size,one.length);
    const original=task.mode==='spell'?Array.from(task.target.replace(/[^a-z]/gi,'')):
     task.target.trim().split(/\s+/);
    assert.deepEqual([...one].sort((a,b)=>a.key-b.key).map(x=>x.value),original);
   }
  }
 }
});
test('Answer checks are strict, case- and punctuation-tolerant, never hallucinate creative mastery',()=>{
 const task=getWorkshopTasks(1,'Pre-A1',2)[0];
 assert.equal(isWorkshopAnswerCorrect(task,'CAT!'),true);
 assert.equal(isWorkshopAnswerCorrect(task,'ca'),false);
 assert.equal(isWorkshopAnswerCorrect(task,'dog'),false);
 assert.equal(normalizeWorkshopAnswer(' I\u2019m happy! '),"i'm happy");
 const sentence=getWorkshopTasks(1,'A2',8)[2];
 assert.equal(isWorkshopAnswerCorrect(sentence,sentence.target.toUpperCase()),true);
 assert.equal(isWorkshopAnswerCorrect(sentence,'I wrote something else.'),false);
 assert.match(workshopFeedback(task,'ca'),/Harflerin/);
});

test('Writing evidence contract stores only task IDs and categorical metrics, not child text',async()=>{
 const fs=await import('node:fs');
 const checkpoint=fs.readFileSync(new URL('../src/lib/learning/writingWorkshopCheckpoint.ts',import.meta.url),'utf8');
 const bridge=fs.readFileSync(new URL('../../../packages/shared/src/bridge.ts',import.meta.url),'utf8');
 assert.match(checkpoint,/writing:checkpoint:v1/);
 assert.match(checkpoint,/answers\.length!==item\.step/);
 assert.match(checkpoint,/readWorkshopCheckpoint/);
 assert.match(bridge,/writingAnswers\?: WritingAnswerEvidence\[\]/);
 assert.doesNotMatch(bridge,/writtenText|studentText|rawSentence|transcript:string/);
});

// Three independently rotated seven-task skill banks generate 343 distinct
// sets per chapter and placement while preserving adjacent-session novelty.
test('Replay draws 343 distinct and educationally balanced writing decks per chapter and placement',()=>{
 for(const chapter of WORKSHOP_CHAPTERS){
  for(const level of ['Pre-A1','A1','A2']){
   for(const grade of [1,4,8]){
    const seen=new Set();
    let previous=null;
    const expected=workshopTaskCount(grade);
    for(let play=0;play<343;play++){
     const deck=getWorkshopTasks(chapter.id,level,grade,play);
     assert.equal(deck.length,expected);
     assert.equal(new Set(deck.map(t=>t.id)).size,expected);
     for(const mode of ['spell','assemble','write'])
      assert.ok(deck.some(t=>t.mode===mode),'Each session includes '+mode);
     const signature=deck.map(t=>t.id).join('|');
     assert.ok(!seen.has(signature),'Replay collision before 343 rounds: '+signature);
     seen.add(signature);
     if(previous){
      const before=new Set(previous.map(t=>t.id));
      assert.ok(deck.every(t=>!before.has(t.id)),
       'Consecutive lessons must not repeat ANY question');
     }
     previous=deck;
    }
    assert.equal(seen.size,343);
   }
  }
 }
});
test('3/4/5-question legacy checkpoints preserve historical tasks and IDs',()=>{
 for(const chapter of WORKSHOP_CHAPTERS){
  for(const level of ['Pre-A1','A1','A2']){
   const original=chapter.quests[level].slice(0,5);
   assert.deepEqual(getLegacyWorkshopTasks(chapter.id,level,8,0).map(t=>t.id),
    original.map(t=>t.id));
   assert.deepEqual(getLegacyWorkshopTasks(chapter.id,level,1,0).map(t=>t.id),
    original.slice(0,3).map(t=>t.id));
   assert.equal(getLegacyWorkshopTasks(chapter.id,level,4,4).length,4);
   assert.equal(getLegacyWorkshopTasks(chapter.id,level,8,40).length,5);
   assert.equal(getWorkshopTasks(chapter.id,level,8,0).length,8);
  }
 }
 assert.throws(()=>getWorkshopTasks(1,'A1',5,-1),RangeError);
 assert.throws(()=>getWorkshopTasks(1,'A1',5,1.4),RangeError);
 assert.throws(()=>getWorkshopTasks(1,'A1',5,NaN),RangeError);
});

test('Expanded checkpoints allow eight steps and original 1-21 IDs without child text',async()=>{
 const fs=await import('node:fs');
 const source=fs.readFileSync(new URL('../src/lib/learning/writingWorkshopCheckpoint.ts',import.meta.url),'utf8');
 assert.match(source,/item\.step>=8/);
 assert.match(source,/item\.taskIds\.length>8/);
 assert.match(source,/2\[01\]/);
 assert.match(source,/item\.answers\.length!==item\.step/);
});
