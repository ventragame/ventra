import test from 'node:test';
import assert from 'node:assert/strict';
import { NUMBER_WORDS,englishNumber,planNumberMission,weakNumberValues } from '../src/lib/learning/numberValleyEngine.ts';

const discovery=(value)=>({value,kind:'discovery',mistakes:0,firstTryCorrect:false,timestamp:'2026-11-01T10:00:00.000Z'});
test('NV0 English numbers 1–20 are correct and zero is not a quiz objective',()=>{
  assert.equal(NUMBER_WORDS.length,21);
  assert.equal(englishNumber(13),'thirteen');
  assert.equal(englishNumber(20),'twenty');
  assert.equal(englishNumber(21),'twenty-one');
  assert.equal(englishNumber(105),'one hundred five');
  assert.equal(englishNumber(999),'nine hundred ninety-nine');
  assert.equal(englishNumber(1000),'one thousand');
  assert.throws(()=>englishNumber(1001),RangeError);
});
test('NV0 first Pre-A1 expedition discovers only eight numbers, replay rotates fresh values',()=>{
  const intro=planNumberMission({mission:1,englishLevel:'Pre-A1',history:[],seed:3});
  assert.deepEqual(new Set(intro.discoveries),new Set([1,2,3,4,5,6,7,8]));
  const replay=planNumberMission({mission:1,englishLevel:'Pre-A1',history:intro.discoveries.map(discovery),seed:9});
  assert.equal(replay.discoveries.length,8);
  assert.ok(replay.discoveries.includes(9)&&replay.discoveries.includes(10));
  assert.equal(new Set(replay.discoveries).size,8);
});
test('NV0 quiz stages never introduce numbers before discovery, and produce unique choices',()=>{
  for(let stage=2;stage<=5;stage++){
    const history=[1,2,3,4,5,6,7,8,9,10,11,12,13].map(discovery);
    for(let seed=0;seed<25;seed++){
      const args={mission:stage,englishLevel:'A1',history,seed};
      const a=planNumberMission(args),b=planNumberMission(args);
      assert.deepEqual(a,b);
      assert.equal(a.questions.length,6);
      for(const question of a.questions){
        assert.ok(history.some(x=>x.value===question.target));
        assert.equal(new Set(question.choices).size,3);
        assert.ok(question.choices.includes(question.target));
        if(stage===3||stage===5)assert.ok(question.target<=20);
      }
    }
  }
  assert.equal(planNumberMission({mission:2,englishLevel:'A1',history:[],seed:1}).questions.length,0);
});
test('NV0 missed words return as spaced review then recover after two independent recalls',()=>{
  const wrong={value:3,kind:'recognition',mistakes:1,firstTryCorrect:false,timestamp:'2026-11-01T11:00:00.000Z'};
  const good1={...wrong,kind:'quantity',mistakes:0,firstTryCorrect:true,timestamp:'2026-11-01T12:00:00.000Z'};
  const good2={...wrong,kind:'listening',mistakes:0,firstTryCorrect:true,timestamp:'2026-11-01T13:00:00.000Z'};
  assert.deepEqual(weakNumberValues([wrong]),[3]);
  assert.deepEqual(weakNumberValues([wrong,good1]),[3]);
  assert.deepEqual(weakNumberValues([wrong,good1,good2]),[]);
  for(let seed=0;seed<100;seed++){
    const plan=planNumberMission({mission:5,englishLevel:'A1',history:[...Array.from({length:12},(_,i)=>discovery(i+1)),wrong],seed});
    const at=plan.questions.flatMap((q,i)=>q.target===3?[i]:[]);
    assert.equal(at.length,2);
    assert.ok(at[1]-at[0]>=2);
  }
});
test('NV0 reduced initial exposure stays in 1-10 for Pre-A1, advanced unlocks 20',()=>{
  const familiar=Array.from({length:20},(_,i)=>discovery(i+1));
  const small=planNumberMission({mission:4,englishLevel:'Pre-A1',history:familiar,seed:2});
  assert.ok(small.questions.every(q=>q.target<=10));
  const larger=planNumberMission({mission:1,englishLevel:'A2',history:[],seed:2});
  assert.equal(larger.discoveries.length,8);
});

test('NV4 quantity and portal use the full discovered 1–20 set for upper grades',()=>{
  const familiar=Array.from({length:20},(_,i)=>discovery(i+1));
  for(const stage of [3,5]){
    const targets=new Set();
    for(let seed=0;seed<120;seed++){
      const plan=planNumberMission({mission:stage,englishLevel:'A2',gradeLevel:7,history:familiar,seed,
        now:'2026-11-01T12:00:00.000Z'});
      for(const item of plan.questions)targets.add(item.target);
    }
    assert.ok(targets.has(20), '20 must be available to physical counting missions');
    assert.ok(targets.has(13), '13 must be available to physical counting missions');
  }
});
