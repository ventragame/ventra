import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryProgressRepository } from '../src/lib/progress/MemoryProgressRepository.ts';
import {saveNumberValleyMission,getNumberValleyProgress,NUMBER_VALLEY_GAME_ID} from '../src/lib/progress/numberValleyProgress.ts';
import {planNumberMission} from '../src/lib/learning/numberValleyEngine.ts';
const answer=(value,kind='discovery',mistakes=0)=>({value,kind,mistakes,firstTryCorrect:kind==='discovery'?false:mistakes===0,timestamp:'2026-11-01T10:00:00.000Z'});
test('NV1 five missions persist independently; replay never duplicates stars/evidence',async()=>{
  const repo=new MemoryProgressRepository();
  const a=await repo.createProfile({nickname:'Mina',avatarId:'avatar_explorer',gradeLevel:1,englishLevel:'Pre-A1'});
  const b=await repo.createProfile({nickname:'Ece',avatarId:'avatar_owl',gradeLevel:7,englishLevel:'A2'});
  let history=[];
  for(let mission=1;mission<=5;mission++){
    const plan=planNumberMission({mission,seed:mission+11,history,gradeLevel:1,englishLevel:'Pre-A1'});
    const answers=mission===1?plan.discoveries.map(id=>answer(id)):plan.questions.map(q=>answer(q.target,q.skill));
    assert.ok(answers.length>0);
    const key='number-test-'+mission;
    const saved=await saveNumberValleyMission(repo,a.id,mission,0,answers.length,31,answers,key);
    assert.equal(saved.completedLevels,mission);
    assert.equal(await repo.getTotalStars(a.id,NUMBER_VALLEY_GAME_ID),mission*3);
    history.push(...answers);
    await saveNumberValleyMission(repo,a.id,mission,0,answers.length,31,answers,key);
    assert.equal((await repo.getNumberAnswerHistory(a.id)).length,history.length);
  }
  assert.equal((await getNumberValleyProgress(repo,b.id)).completedLevels,0);
  assert.equal((await repo.getNumberAnswerHistory(b.id)).length,0);
  assert.equal(await repo.getTotalStars(a.id,NUMBER_VALLEY_GAME_ID),15);
  assert.equal(await repo.getTotalStars(a.id),15);
  await saveNumberValleyMission(repo,a.id,2,3,1,15,[answer(2,'recognition',3)],'number-replay');
  assert.equal(await repo.getTotalStars(a.id,NUMBER_VALLEY_GAME_ID),15);
  const pending=await repo.getPendingEvents(a.id);
  assert.ok(pending.some(e=>e.gameId===NUMBER_VALLEY_GAME_ID&&e.metrics.numberAnswers?.length));
  await assert.rejects(saveNumberValleyMission(repo,b.id,3,0,1,5,[answer(2,'recognition')],'blocked'),/Önceki/);
});
test('NV1 cloud event replay retains number evidence with profile isolation',async()=>{
  const first=new MemoryProgressRepository(),second=new MemoryProgressRepository();
  const a=await first.createProfile({id:'kid-a',nickname:'Ada',avatarId:'avatar_explorer'});
  await second.createProfile({id:'kid-a',nickname:'Ada',avatarId:'avatar_explorer'});
  await second.createProfile({id:'kid-b',nickname:'Ece',avatarId:'avatar_owl'});
  await saveNumberValleyMission(first,a.id,1,0,2,3,[answer(1),answer(2)],'nv-sync');
  const raw=await first.getPendingEvents(a.id);
  const wire=raw.map(e=>({...e,profile_id:e.profileId,event_id:e.eventId,event_type:e.eventType,game_id:e.gameId,level_id:e.levelId,skill_id:e.skillId,stars_earned:e.starsEarned,client_timestamp:e.clientTimestamp}));
  assert.equal(await second.mergeRemoteEvents(wire,'kid-a'),1);
  assert.equal((await second.getNumberAnswerHistory('kid-a')).length,2);
  assert.equal((await second.getNumberAnswerHistory('kid-b')).length,0);
  assert.equal(await second.mergeRemoteEvents(wire,'kid-a'),0);
  assert.equal(await second.getTotalStars('kid-a',NUMBER_VALLEY_GAME_ID),3);
});
