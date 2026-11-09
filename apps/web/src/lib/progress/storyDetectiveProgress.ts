import type {GameCompletedPayload} from '@ventra/shared';
import type {IProgressRepository} from './types.ts';
import {
 DETECTIVE_CHAPTERS,DETECTIVE_GAME_ID,detectiveStars,validateDetectiveRecord,
 type DetectivePlan,type DetectiveRecord
} from '../learning/storyDetectiveEngine.ts';
import type {ForestEpisode} from '../learning/storyForestEngine.ts';

export interface DetectiveProgress{
 completedLevels:number;totalLevels:6;
 starsByLevel:Record<number,number>;playCountByLevel:Record<number,number>;
}
export async function getDetectiveProgress(
 repo:IProgressRepository,profileId:string
):Promise<DetectiveProgress>{
 const saved=await repo.getAllLevelProgress(DETECTIVE_GAME_ID,profileId);
 let completedLevels=0;
 const starsByLevel:Record<number,number>={};
 const playCountByLevel:Record<number,number>={};
 for(const ch of DETECTIVE_CHAPTERS){
  const row=saved[ch.episode];
  playCountByLevel[ch.episode]=row?.completedCount??0;
  if(!row||row.completedCount<=0)continue;
  starsByLevel[ch.episode]=Math.max(0,Math.min(3,row.bestStars));
  if(completedLevels===ch.episode-1)completedLevels++;
 }
 return {completedLevels,totalLevels:6,starsByLevel,playCountByLevel};
}
export async function saveDetectiveCase(input:{
 repo:IProgressRepository;profileId:string;episode:ForestEpisode;
 plan:DetectivePlan;record:DetectiveRecord;sessionId:string;
 durationSeconds:number;
}):Promise<DetectiveProgress>{
 const {repo,profileId,episode,plan,record,sessionId,durationSeconds}=input;
 if(!profileId||!sessionId||plan.chosen.chapter.episode!==episode||
  !Number.isFinite(durationSeconds)||durationSeconds<0||
  !validateDetectiveRecord(record,plan))
  throw new Error('Dedektif macerasının cevapları doğrulanamadı.');
 const previous=await getDetectiveProgress(repo,profileId);
 if(episode>previous.completedLevels+1)
  throw new Error('Önce önceki dedektif bölümü tamamlanmalı.');
 // The modern multi-scene flow scores all 7–8 decisions, including memory,
 // partner recognition, route choice and final object recovery.
 const evidence=record.stepEvidence;
 const errors=evidence?.length?evidence.reduce((sum,a)=>sum+a.mistakes,0):
  record.clues.reduce((sum,a)=>sum+a.mistakes,0)+record.destinationMistakes;
 const hints=evidence?.length?evidence.filter(a=>a.hintUsed).length:
  record.clues.filter(answer=>answer.hintUsed).length+Number(record.destinationHint);
 const count=evidence?.length??(record.clues.length+1);
 const independent=evidence?.length?evidence.filter(a=>a.firstTryCorrect).length:
  record.clues.filter(a=>a.firstTryCorrect).length+
   Number(record.destinationMistakes===0&&!record.destinationHint);
 const payload:GameCompletedPayload={
  sessionId,profileId,gameId:DETECTIVE_GAME_ID,levelId:episode,
  outcomeId:'en.story.forest.detective',skillId:'listening_inference',
  success:true,score:Math.round(100*independent/count),
  starsEarned:detectiveStars(record),
  metrics:{
   durationSeconds:Math.round(durationSeconds),
   attemptsCount:count+errors,
   accuracyRate:independent/count,wrongAttempts:errors,hintsUsed:hints,
   detectiveRuns:[record]
  },completedAt:record.completedAt
 };
 await repo.recordGameCompleted(payload,profileId);
 return getDetectiveProgress(repo,profileId);
}
