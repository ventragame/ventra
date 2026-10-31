import test from 'node:test';
import assert from 'node:assert/strict';
import { ANIMAL_MEADOW_WORDS, findAnimal, planAnimalMission, getWeakAnimalIds, getAnimalPrompt } from '../src/lib/learning/animalMissionEngine.ts';
import { MemoryProgressRepository } from '../src/lib/progress/MemoryProgressRepository.ts';
import { getWordGardenProgress, saveWordGardenLevelCompletion } from '../src/lib/progress/wordGardenProgress.ts';

function evidence(wordId,kind='discovery',mistakes=0,time='2026-11-01T09:00:00.000Z') {
  return {wordId,kind,mistakes,firstTryCorrect:kind==='discovery'?false:mistakes===0,timestamp:time};
}
const starters=ANIMAL_MEADOW_WORDS.slice(0,8).map(word=>evidence(word.id));
test('Animal Meadow catalog contains twelve unique animals and preserves existing audio/image references',()=>{
  assert.equal(ANIMAL_MEADOW_WORDS.length,12);
  assert.equal(new Set(ANIMAL_MEADOW_WORDS.map(w=>w.id)).size,12);
  for(const animal of ANIMAL_MEADOW_WORDS) {
    assert.ok(animal.emoji && animal.tr && animal.habitat && animal.place);
    assert.equal(findAnimal(animal.id),animal);
  }
  for(const id of ['cat','dog','bird','rabbit']){
    const animal=findAnimal(id);
    assert.ok(animal.audio?.endsWith('.wav'));
    assert.ok(animal.image?.endsWith('.svg'));
  }
});
test('New learner discovers eight; replay eventually introduces the four additional animals',()=>{
  const intro=planAnimalMission({mission:1,history:[],seed:1});
  assert.equal(intro.animals.length,8);
  assert.equal(intro.questions.length,0);
  assert.deepEqual(new Set(intro.animals),new Set(starters.map(x=>x.wordId)));
  const replay=planAnimalMission({mission:1,history:intro.animals.map(id=>evidence(id)),seed:8});
  assert.equal(replay.animals.length,8);
  assert.ok(['sheep','frog','bee','butterfly'].every(id=>replay.animals.includes(id)));
});
test('Quiz missions select only encountered animals, ensure valid three-choice prompts',()=>{
  for(let mission=2;mission<=5;mission++){
    for(let seed=1;seed<=80;seed++){
      const a=planAnimalMission({mission,history:starters,seed});
      const b=planAnimalMission({mission,history:starters,seed});
      assert.deepEqual(a,b);
      assert.equal(a.questions.length,6);
      for(const q of a.questions){
        assert.equal(q.choices.length,3);
        assert.ok(q.choices.includes(q.target));
        assert.equal(new Set(q.choices).size,3);
        assert.ok(q.choices.every(id=>starters.some(x=>x.wordId===id)));
        const prompt=getAnimalPrompt(mission,findAnimal(q.target),'Pre-A1');
        assert.ok(prompt.title && prompt.guide);
      }
    }
  }
});
test('Weak animal is guaranteed spaced practice and recovers after two independent recalls',()=>{
  const wrong=evidence('bird','recognition',2,'2026-11-01T10:00:00.000Z');
  const clean1=evidence('bird','listening',0,'2026-11-01T11:00:00.000Z');
  const clean2=evidence('bird','command',0,'2026-11-01T12:00:00.000Z');
  assert.deepEqual(getWeakAnimalIds([wrong]),['bird']);
  assert.deepEqual(getWeakAnimalIds([clean1,wrong]),['bird']);
  assert.deepEqual(getWeakAnimalIds([clean2,wrong,clean1]),[]);
  for(let seed=1;seed<=150;seed++){
    const plan=planAnimalMission({mission:5,history:[...starters,wrong],seed});
    const occurrences=plan.questions.flatMap((q,i)=>q.target==='bird'?[i]:[]);
    assert.equal(plan.questions.length,7);
    assert.equal(occurrences.length,2);
    assert.ok(occurrences[1]-occurrences[0]>=2);
    assert.ok(plan.questions.every(q=>new Set(q.choices).size===3));
  }
});
test('Animal Meadow full five-stage save, profile isolation, accurate stars and replay idempotency',async()=>{
  const repo=new MemoryProgressRepository();
  const first=await repo.createProfile({nickname:'Mina',avatarId:'avatar_explorer'});
  const second=await repo.createProfile({nickname:'Asya',avatarId:'avatar_owl'});
  let history=[];
  for(let mission=1;mission<=5;mission++){
    const plan=planAnimalMission({mission,history,seed:mission*31});
    const answers=mission===1
      ? plan.animals.map(id=>evidence(id))
      : plan.questions.map((q,i)=>evidence(q.target,
          mission===2?'recognition':mission===3?'listening':mission===4?'command':'habitat',
          mission===2&&i===0?2:0,new Date(Date.parse('2026-11-01T10:00:00Z')+mission*100000+i*1000).toISOString()));
    const wrong=mission===2?2:0;
    const stars=wrong?2:3;
    const sessionId='am-test-stage-'+mission;
    const after=await saveWordGardenLevelCompletion(repo,first.id,mission,stars,{
      sessionId,wrongAttempts:wrong,correctAnswers:answers.length,
      durationSeconds:44,animalAnswers:answers
    });
    assert.equal(after.completedLevels,mission);
    assert.equal(after.totalStars,mission*3-(mission>=2?1:0));
    assert.equal((await repo.getAnimalAnswerHistory(first.id)).length,history.length+answers.length);
    history=[...history,...answers];
    const duplicate=await saveWordGardenLevelCompletion(repo,first.id,mission,stars,{
      sessionId,wrongAttempts:wrong,correctAnswers:answers.length,durationSeconds:44,animalAnswers:answers
    });
    assert.equal(duplicate.totalStars,after.totalStars);
  }
  assert.equal((await getWordGardenProgress(repo,second.id)).completedLevels,0);
  assert.equal((await repo.getAnimalAnswerHistory(second.id)).length,0);
  assert.equal(await repo.getTotalStars(first.id),14);
  await saveWordGardenLevelCompletion(repo,first.id,2,3,{
    sessionId:'am-test-replay-2',wrongAttempts:0,correctAnswers:6,
    durationSeconds:30,animalAnswers:[evidence('bird','recognition')]
  });
  assert.equal(await repo.getTotalStars(first.id),15,'replay upgrades best stars, never double counts');
  assert.equal((await getWordGardenProgress(repo,first.id)).completedLevels,5);
  await assert.rejects(saveWordGardenLevelCompletion(repo,second.id,3,3),/Önceki görev/);
});
