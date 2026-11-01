import type { GameCompletedPayload, NumberAnswerEvidence } from '@ventra/shared';
import type { IProgressRepository } from './types.ts';

export const NUMBER_VALLEY_GAME_ID='island_word_garden_numbers';
export const NUMBER_VALLEY_MISSIONS=5;
export interface NumberValleyProgress {
  completedLevels:number;
  totalLevels:number;
  starsByLevel:Record<number,number>;
}
export async function getNumberValleyProgress(repo:IProgressRepository,profileId:string):Promise<NumberValleyProgress>{
  const levels=await repo.getAllLevelProgress(NUMBER_VALLEY_GAME_ID,profileId);
  let completedLevels=0;
  const starsByLevel:Record<number,number>={};
  for(let step=1;step<=NUMBER_VALLEY_MISSIONS;step++){
    const level=levels[step];
    if(!level || (level.completedCount<=0 && level.bestStars<=0))continue;
    starsByLevel[step]=Math.max(0,Math.min(3,level.bestStars));
    if(completedLevels===step-1)completedLevels++;
  }
  return {completedLevels,totalLevels:NUMBER_VALLEY_MISSIONS,starsByLevel};
}
export async function saveNumberValleyMission(
  repo:IProgressRepository,profileId:string,mission:number,
  mistakes:number,correct:number,durationSeconds:number,
  answers:NumberAnswerEvidence[],sessionId:string
):Promise<NumberValleyProgress>{
  if(!Number.isInteger(mission)||mission<1||mission>NUMBER_VALLEY_MISSIONS)
    throw new Error('Geçersiz Sayı Vadisi görevi.');
  if(![mistakes,correct,durationSeconds].every(Number.isFinite)||mistakes<0||correct<=0||durationSeconds<0)
    throw new Error('Geçersiz görev ölçümleri.');
  if(!sessionId||!profileId||!Array.isArray(answers)||answers.length!==correct)
    throw new Error('Eksik Sayı Vadisi görev kanıtı.');
  if(answers.some(row=>!Number.isInteger(row.value)||row.value<1||row.value>20||
    !['discovery','recognition','quantity','listening','application'].includes(row.kind)||
    !Number.isFinite(row.mistakes)||row.mistakes<0||
    typeof row.firstTryCorrect!=='boolean'||
    !Number.isFinite(Date.parse(row.timestamp))))
    throw new Error('Geçersiz Sayı Vadisi cevap kanıtı.');
  const before=await getNumberValleyProgress(repo,profileId);
  if(mission>before.completedLevels+1)throw new Error('Önceki Sayı Vadisi görevi tamamlanmadı.');
  const stars=mistakes===0?3:mistakes<=2?2:1;
  const attempts=Math.max(1,correct+mistakes);
  const payload:GameCompletedPayload={
    sessionId,profileId,gameId:NUMBER_VALLEY_GAME_ID,levelId:mission,
    outcomeId:'en.a1.vocab.numbers',skillId:'en.a1.vocab.numbers',
    score:Math.round(100*correct/attempts),success:true,starsEarned:stars,
    metrics:{durationSeconds:Math.round(durationSeconds),attemptsCount:attempts,
      accuracyRate:correct/attempts,wrongAttempts:mistakes,numberAnswers:answers},
    completedAt:new Date().toISOString()
  };
  await repo.recordGameCompleted(payload,profileId);
  return getNumberValleyProgress(repo,profileId);
}
