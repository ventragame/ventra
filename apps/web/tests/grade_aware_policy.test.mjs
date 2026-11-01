import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveGradeAwarePolicy,gradeAwareReviewPriority} from '../src/lib/learning/gradeAwareLearningPolicy.ts';
import {getLearningSnapshot,normalizeLearningEvidence,needsReview} from '../src/lib/learning/adaptiveLearningEngine.ts';
const at=(day)=>new Date(Date.UTC(2026,10,day)).toISOString();
const number=(value,kind,day,correct=true)=>({value,kind,timestamp:at(day),mistakes:correct?0:1,firstTryCorrect:correct});
test('grade policy rejects missing/invalid grade without changing legacy content',()=>{
  for(const gradeLevel of [undefined,null,0,9,2.5,NaN]){
    const a=resolveGradeAwarePolicy({domain:'animals',gradeLevel,englishLevel:'A1'});
    assert.equal(a.gradeLevel,null);assert.equal(a.discoveryCount,8);
    assert.equal(a.questionCount,6);assert.equal(a.choiceCount,3);
  }
});
test('grade, English and domain are distinct policy dimensions',()=>{
  const early=resolveGradeAwarePolicy({domain:'numbers',gradeLevel:1,englishLevel:'A2'});
  const upper=resolveGradeAwarePolicy({domain:'numbers',gradeLevel:7,englishLevel:'A2'});
  const beginner=resolveGradeAwarePolicy({domain:'numbers',gradeLevel:7,englishLevel:'Pre-A1'});
  assert.equal(early.maxNumber,10);assert.equal(upper.maxNumber,20);
  assert.equal(beginner.maxNumber,10,'older English beginners must not be pushed into A2');
  assert.equal(early.questionCount,4);assert.equal(upper.questionCount,7);
  assert.equal(resolveGradeAwarePolicy({domain:'colors',gradeLevel:2,englishLevel:'A1'}).discoveryCount,4);
});
test('P3 numeric adapter preserves separate skill states, due dates and independent evidence',()=>{
  const history=[number(3,'discovery',1,false),number(3,'recognition',2,false),number(3,'listening',3,true)];
  const snap=getLearningSnapshot({animalAnswers:[],colorAnswers:[],animalWords:[],colorWords:[],
    numberAnswers:history,numberWords:['3','4'],now:at(10)});
  assert.equal(snap.domainStats.numbers.discovered,1);
  const n3=snap.vocabulary.find(x=>x.domain==='numbers'&&x.wordId==='3');
  assert.equal(n3.skills.find(x=>x.skill==='recognition').attempts,1);
  assert.equal(n3.skills.find(x=>x.skill==='listening').independentCorrect,1);
  assert.ok(needsReview(snap,'numbers','recognition','3'));
  assert.deepEqual(gradeAwareReviewPriority(snap,'numbers','recognition',['3','4']),['3','4']);
  const normalized=normalizeLearningEvidence([],[],history);
  assert.equal(normalized.find(x=>x.skill==='discovery').independent,false);
  assert.equal(normalized.find(x=>x.skill==='recognition').independent,false);
});
test('P3 numeric evidence rejects invalid values, future events and hinted recall',()=>{
  const evidence=[number(21,'recognition',1),number(-1,'recognition',1),
    {...number(5,'recognition',1),hintUsed:true},number(5,'recognition',12)];
  const snap=getLearningSnapshot({animalAnswers:[],colorAnswers:[],animalWords:[],colorWords:[],
    numberAnswers:evidence,numberWords:['5'],now:at(5)});
  const state=snap.vocabulary[0].skills.find(x=>x.skill==='recognition');
  assert.equal(state.attempts,1);assert.equal(state.independentCorrect,0);
  assert.equal(normalizeLearningEvidence([],[],evidence).length,2);
});
