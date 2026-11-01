import test from 'node:test';
import assert from 'node:assert/strict';
import { getLearningSnapshot, normalizeLearningEvidence, deriveSkillState, rankVocabularyForMission, needsReview } from '../src/lib/learning/adaptiveLearningEngine.ts';
import { PLACEMENT_QUESTIONS, assessStarterVocabulary } from '../src/lib/learning/placementCheck.ts';
import { MemoryProgressRepository } from '../src/lib/progress/MemoryProgressRepository.ts';
import { saveWordGardenLevelCompletion } from '../src/lib/progress/wordGardenProgress.ts';
import { saveColorGroveMission } from '../src/lib/progress/colorGroveProgress.ts';
const at=(day,h=0)=>new Date(Date.UTC(2026,10,day,h)).toISOString();
const discovery=(wordId,domain)=>({wordId,kind:'discovery',mistakes:0,firstTryCorrect:false,timestamp:at(1)});
const animal=(wordId,kind,day,firstTryCorrect=true,other={})=>({wordId,kind,firstTryCorrect, mistakes:firstTryCorrect?0:1,timestamp:at(day),...other});
const color=(wordId,day,skill='recognition',firstTryCorrect=true)=>({wordId,kind:'recall',firstTryCorrect,mistakes:firstTryCorrect?0:1,skill,timestamp:at(day)});
const snapshot=(animalAnswers,colorAnswers,now=at(10))=>getLearningSnapshot({
  animalAnswers,colorAnswers,animalWords:['cat','dog'],colorWords:['red','green'],now
});
test('P3: exposure is not independent proof, zero answers yield honest empty state',()=>{
  const empty=snapshot([],[]);
  assert.equal(empty.practicedWords,0);assert.equal(empty.dueWords,0);
  const seen=snapshot([discovery('cat','animals')],[]);
  const cat=seen.vocabulary.find(v=>v.wordId==='cat');
  assert.equal(cat.status,'exposed');assert.equal(cat.discovered,true);
  assert.equal(cat.practiced,false);assert.equal(cat.skills[0].confidence,0);
});
test('P3: recognition is not listening, and color application is a separate skill',()=>{
  const v=snapshot([discovery('cat'),animal('cat','recognition',1)],[
    discovery('red'),color('red',1,'application')]);
  const cat=v.vocabulary.find(x=>x.wordId==='cat');
  assert.equal(cat.skills.find(s=>s.skill==='recognition').attempts,1);
  assert.equal(cat.skills.find(s=>s.skill==='listening').attempts,0);
  const red=v.vocabulary.find(x=>x.wordId==='red');
  assert.equal(red.skills.find(s=>s.skill==='recognition').attempts,0);
  assert.equal(red.skills.find(s=>s.skill==='application').attempts,1);
});
test('P3: hints do not increase independent streak or imply mastery',()=>{
  const rows=normalizeLearningEvidence([
    animal('cat','recognition',1,true,{hintUsed:true}),animal('cat','recognition',2,false)
  ],[]);
  const state=deriveSkillState(rows,'animals','cat','recognition',at(3));
  assert.equal(state.independentCorrect,0);assert.equal(state.streak,0);
  assert.equal(state.status,'review_due');
});
test('P3: spaced due dates are deterministic, and due recommendation favors weak words',()=>{
  const history=[discovery('cat'),discovery('dog'),
    animal('cat','recognition',1),animal('cat','recognition',2),animal('cat','recognition',3),
    animal('dog','recognition',3,false)];
  const early=snapshot(history,[],at(4));
  const cat=early.vocabulary.find(x=>x.wordId==='cat').skills.find(s=>s.skill==='recognition');
  assert.equal(cat.streak,3);assert.equal(cat.status,'progressing');
  assert.equal(cat.dueAt,at(6));
  assert.ok(needsReview(early,'animals','recognition','dog'));
  const ranking=rankVocabularyForMission(early,'animals','recognition',['cat','dog']);
  assert.deepEqual(ranking,['dog','cat']);
  const late=snapshot(history,[],at(7));
  assert.ok(needsReview(late,'animals','recognition','cat'));
});
test('P3: future events do not leak into earlier time snapshots',()=>{
  const h=[discovery('cat'),animal('cat','recognition',1),animal('cat','recognition',8)];
  const early=snapshot(h,[],at(3));
  assert.equal(early.vocabulary.find(x=>x.wordId==='cat').skills[0].attempts,1);
});
test('P3: replayed cloud histories yield same learning state regardless of event order',()=>{
  const rows=[discovery('cat'),animal('cat','recognition',2,false),animal('cat','recognition',4),
    animal('cat','recognition',5),animal('cat','listening',6)];
  assert.deepEqual(snapshot(rows,[]),snapshot([...rows].reverse(),[]));
});
test('P3: legacy colors without skill stay recognition and never become application',()=>{
  const h=[{wordId:'blue',kind:'recall',mistakes:0,firstTryCorrect:true,timestamp:at(2)}];
  assert.equal(normalizeLearningEvidence([],h)[0].skill,'recognition');
});
test('P3: starter check is bounded and cannot claim A2',()=>{
  assert.equal(PLACEMENT_QUESTIONS.length,8);
  const all=PLACEMENT_QUESTIONS.map(q=>({id:q.id,selected:q.id}));
  assert.deepEqual(assessStarterVocabulary(all),{
    total:8,correct:8,suggested:'A1',explanation:'Temel kelimelerde güçlü başlangıç. A1 içerik denenebilir.'
  });
  assert.equal(assessStarterVocabulary(all.map((x,i)=>i<4?x:{...x,selected:'none'})).suggested,'Pre-A1');
  assert.throws(()=>assessStarterVocabulary(all.slice(0,7)),/tamamlanmadı/);
});
test('P3: persisted profile sessions yield isolated per-child skill reports offline',async()=>{
  const repo=new MemoryProgressRepository();
  const first=await repo.createProfile({nickname:'Öğrenci',avatarId:'avatar_explorer'});
  const other=await repo.createProfile({nickname:'Başka Çocuk',avatarId:'avatar_owl'});
  await saveWordGardenLevelCompletion(repo,first.id,1,3,{
    sessionId:'p3-animal-first',correctAnswers:1,wrongAttempts:0,durationSeconds:15,
    animalAnswers:[discovery('cat')]
  });
  await saveColorGroveMission(repo,first.id,1,0,1,12,[discovery('red')],'p3-color-first');
  const personal=snapshot(await repo.getAnimalAnswerHistory(first.id),await repo.getColorAnswerHistory(first.id));
  const separate=snapshot(await repo.getAnimalAnswerHistory(other.id),await repo.getColorAnswerHistory(other.id));
  assert.equal(personal.totalDiscovered,2);
  assert.equal(separate.totalDiscovered,0);
});
