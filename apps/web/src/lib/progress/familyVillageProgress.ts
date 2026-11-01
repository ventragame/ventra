import type {FamilyAnswerEvidence,GameCompletedPayload} from '@ventra/shared';
import type {IProgressRepository} from './types.ts';
import {VILLAGE_GAME_ID,VILLAGE_OFFSETS,VILLAGE_TOTAL,VILLAGE_KINDS,villageWord,validVillageAnswers,
 type VillageDistrict,type VillageStage} from '../learning/familyVillageEngine.ts';

export type FamilyVillageProgress={
 completedLevels:number;totalLevels:number;
 completedByDistrict:Record<VillageDistrict,number>;
 starsByLevel:Record<number,number>;
};
export async function getFamilyVillageProgress(repo:IProgressRepository,profileId:string):Promise<FamilyVillageProgress>{
 const rows=await repo.getAllLevelProgress(VILLAGE_GAME_ID,profileId);
 const completedByDistrict:Record<VillageDistrict,number>={family:0,rooms:0,objects:0,routines:0};
 const starsByLevel:Record<number,number>={};
 for(const d of ['family','rooms','objects','routines'] as const)for(let n=1;n<=5;n++){
  const id=VILLAGE_OFFSETS[d]+n,entry=rows[id];
  if(!entry||(entry.bestStars<=0&&entry.completedCount<=0))continue;
  starsByLevel[id]=Math.max(0,Math.min(3,entry.bestStars));
  if(completedByDistrict[d]===n-1)completedByDistrict[d]++;
 }
 return {completedLevels:Object.values(completedByDistrict).reduce((s,v)=>s+v,0),totalLevels:VILLAGE_TOTAL,
  completedByDistrict,starsByLevel};
}
export async function saveFamilyVillageMission(repo:IProgressRepository,profileId:string,district:VillageDistrict,
 stage:VillageStage,mistakes:number,durationSeconds:number,answers:FamilyAnswerEvidence[],sessionId:string)
 :Promise<FamilyVillageProgress>{
 if(!(district in VILLAGE_OFFSETS)||!VILLAGE_KINDS[stage-1])throw Error('Geçersiz Aile Köyü görevi.');
 if(!profileId||!sessionId||!Number.isFinite(mistakes)||mistakes<0||!Number.isFinite(durationSeconds)||durationSeconds<0||
  !validVillageAnswers(answers)||answers.length<4||
  answers.some(a=>a.kind!==VILLAGE_KINDS[stage-1]||villageWord(a.wordId).district!==district))
  throw Error('Geçersiz dil öğrenme kanıtı.');
 const previous=await getFamilyVillageProgress(repo,profileId);
 if(stage>previous.completedByDistrict[district]+1)throw Error('Önceki İngilizce görevini tamamla.');
 if(district==='rooms'&&previous.completedByDistrict.family<5||
  district==='objects'&&previous.completedByDistrict.rooms<5||
  district==='routines'&&previous.completedByDistrict.objects<5)
  throw Error('Önce önceki Aile Köyü sokağını tamamla.');
 const stars=mistakes===0?3:mistakes<=2?2:1;
 const attempts=answers.length+mistakes;
 const payload:GameCompletedPayload={
  profileId,sessionId,gameId:VILLAGE_GAME_ID,levelId:VILLAGE_OFFSETS[district]+stage,
  outcomeId:'en.a1.vocab.family',skillId:stage===1?undefined:'en.a1.vocab.family',
  score:Math.round(100*answers.length/attempts),success:true,starsEarned:stars,
  completedAt:new Date().toISOString(),
  metrics:{durationSeconds:Math.round(durationSeconds),attemptsCount:attempts,
   accuracyRate:answers.length/attempts,wrongAttempts:mistakes,familyAnswers:answers}
 };
 await repo.recordGameCompleted(payload,profileId);
 return getFamilyVillageProgress(repo,profileId);
}
