import test from 'node:test';
import assert from 'node:assert/strict';
import {
 WORKSHOP_CHAPTERS,WRITING_WORKSHOP_GAME_ID,getWorkshopTasks,workshopTaskCount,
 isWorkshopAnswerCorrect,workshopTiles,normalizeWorkshopAnswer,workshopFeedback
} from '../src/lib/learning/writingWorkshopEngine.ts';

test('Five original chapters, 3 placements and 75 distinct evidence-led writing tasks',()=>{
 assert.equal(WRITING_WORKSHOP_GAME_ID,'island_sentence_workshop_writing');
 assert.equal(WORKSHOP_CHAPTERS.length,5);
 const keys=new Set();
 for(const chapter of WORKSHOP_CHAPTERS){
  for(const level of ['Pre-A1','A1','A2']){
   const tasks=chapter.quests[level];
   assert.equal(tasks.length,5);
   assert.deepEqual(tasks.slice(0,3).map(x=>x.mode),['spell','assemble','write']);
   for(const t of tasks){
    assert.ok(t.target.length>1&&t.promptTr.length>=16&&t.icon.length>0);
    assert.ok(!keys.has(t.id));keys.add(t.id);
    assert.equal(isWorkshopAnswerCorrect(t,t.target),true);
    assert.equal(isWorkshopAnswerCorrect(t,'random unrelated content'),false);
   }
  }
 }
 assert.equal(keys.size,75);
});
test('Grade changes count independently from English placement, including older beginners',()=>{
 assert.equal(workshopTaskCount(null),4);
 assert.equal(workshopTaskCount(1),3);
 assert.equal(workshopTaskCount(3),4);
 assert.equal(workshopTaskCount(8),5);
 assert.equal(workshopTaskCount(12),4);
 for(const level of ['Pre-A1','A1','A2']){
  assert.equal(getWorkshopTasks(2,level,1).length,3);
  assert.equal(getWorkshopTasks(2,level,4).length,4);
  assert.equal(getWorkshopTasks(2,level,8).length,5);
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
