import test from 'node:test';
import assert from 'node:assert/strict';
import {MemoryProgressRepository} from '../src/lib/progress/MemoryProgressRepository.ts';
import {getGardenOverallProgress,tallyGardenProgress,accessibleNumberLevels} from '../src/lib/progress/gardenOverallProgress.ts';
import {saveWordGardenLevelCompletion} from '../src/lib/progress/wordGardenProgress.ts';
const animal=(count)=>({completedLevels:count,totalLevels:5,progressPercent:count*20,starsByLevel:{},totalStars:0,legacyCompleted:false});
const sample=(count=0)=>({animals:animal(count),colors:{completedLevels:0,totalLevels:3},
 numbers:{completedLevels:0,totalLevels:15,completedByBand:{ones:0,tens:0,hundreds:0},starsByLevel:{}},
 food:{completedLevels:0,totalLevels:15},family:{completedLevels:0,totalLevels:20},
 temple:{completedLevels:0,totalLevels:25},gradeLevel:1,englishLevel:'Pre-A1'});
test('Completing Animal Meadow is not whole-garden completion',()=>{
 const result=tallyGardenProgress(sample(5));
 assert.deepEqual([result.completed,result.total,result.percent,result.completedWorlds],[5,73,7,1]);
});
test('Number path denominator matches playable grade/English access',()=>{
 assert.equal(accessibleNumberLevels(null,'A2'),5);
 assert.equal(accessibleNumberLevels(1,'A2'),5);
 assert.equal(accessibleNumberLevels(3,'A1'),10);
 assert.equal(accessibleNumberLevels(7,'A2'),15);
 const p=sample(5);p.gradeLevel=7;p.englishLevel='A2';
 p.numbers.completedByBand={ones:5,tens:5,hundreds:5};
 assert.deepEqual([tallyGardenProgress(p).completed,tallyGardenProgress(p).total],[20,83]);
 p.gradeLevel=1;p.englishLevel='Pre-A1';
 assert.deepEqual([tallyGardenProgress(p).completed,tallyGardenProgress(p).total],[10,73]);
});
test('All six genuine milestones complete garden, invalid progress is clamped',()=>{
 const p=sample(5);p.colors.completedLevels=3;p.numbers.completedByBand.ones=5;
 p.food.completedLevels=15;p.family.completedLevels=20;p.temple.completedLevels=25;
 assert.deepEqual([tallyGardenProgress(p).completed,tallyGardenProgress(p).total,tallyGardenProgress(p).completedWorlds],[73,73,6]);
 p.food.completedLevels=100;p.family.completedLevels=-1;
 assert.equal(tallyGardenProgress(p).completed,53);
});
test('Overall progress remains read-only and profile-isolated',async()=>{
 const repo=new MemoryProgressRepository();
 const first=await repo.createProfile({nickname:'Mina',avatarId:'avatar_explorer'});
 const other=await repo.createProfile({nickname:'Ece',avatarId:'avatar_explorer'});
 await saveWordGardenLevelCompletion(repo,first.id,1,3);
 const a=await getGardenOverallProgress(repo,first.id,1,'Pre-A1');
 const b=await getGardenOverallProgress(repo,other.id,1,'Pre-A1');
 assert.equal(a.completed,1);assert.equal(b.completed,0);
 assert.equal(await repo.getTotalStars(first.id),3);
});
