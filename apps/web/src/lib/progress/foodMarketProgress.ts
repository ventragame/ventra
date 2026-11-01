import type {GameCompletedPayload,FoodAnswerEvidence} from '@ventra/shared';
import type {IProgressRepository} from './types.ts';
import {MARKET_GAME_ID,MARKET_OFFSETS,MARKET_TOTAL,MARKET_KINDS,
 validMarketAnswers,type MarketAisle,type MarketStage} from '../learning/foodMarketEngine.ts';

export interface FoodMarketProgress {
 completedLevels:number; totalLevels:number;
 completedByAisle:Record<MarketAisle,number>;
 starsByLevel:Record<number,number>;
}
export async function getFoodMarketProgress(repo:IProgressRepository,profileId:string):Promise<FoodMarketProgress>{
 const levels=await repo.getAllLevelProgress(MARKET_GAME_ID,profileId);
 const completedByAisle:Record<MarketAisle,number>={orchard:0,bakery:0,cafe:0};
 const starsByLevel:Record<number,number>={};
 for(const aisle of ['orchard','bakery','cafe'] as const){
   for(let n=1;n<=5;n++){
     const id=MARKET_OFFSETS[aisle]+n;
     const row=levels[id];
     if(!row||(row.completedCount<=0&&row.bestStars<=0))continue;
     starsByLevel[id]=Math.max(0,Math.min(3,row.bestStars));
     if(completedByAisle[aisle]===n-1)completedByAisle[aisle]++;
   }
 }
 return {completedLevels:Object.values(completedByAisle).reduce((s,n)=>s+n,0),
   totalLevels:MARKET_TOTAL,completedByAisle,starsByLevel};
}
export async function saveFoodMarketMission(
 repo:IProgressRepository,profileId:string,aisle:MarketAisle,stage:MarketStage,
 mistakes:number,durationSeconds:number,answers:FoodAnswerEvidence[],sessionId:string
):Promise<FoodMarketProgress>{
 if(!(aisle in MARKET_OFFSETS)||!MARKET_KINDS[stage-1])throw Error('Geçersiz Lezzet Pazarı görevi.');
 if(!profileId||!sessionId||!Number.isFinite(mistakes)||mistakes<0||
   !Number.isFinite(durationSeconds)||durationSeconds<0||
   !validMarketAnswers(answers)||answers.length<4||
   answers.some(x=>x.kind!==MARKET_KINDS[stage-1]))
   throw Error('Geçersiz dil öğrenme kanıtı.');
 const previous=await getFoodMarketProgress(repo,profileId);
 if(stage>previous.completedByAisle[aisle]+1)
   throw Error('Önceki pazar dil görevini tamamla.');
 // Opening a new lane requires the previous lane to be fully finished; replays remain allowed.
 if(aisle==='bakery'&&previous.completedByAisle.orchard<5 ||
    aisle==='cafe'&&previous.completedByAisle.bakery<5)
   throw Error('Önce önceki pazar sokağını tamamla.');
 const correct=answers.length,attempts=correct+mistakes;
 const stars=mistakes===0?3:mistakes<=2?2:1;
 const payload:GameCompletedPayload={
   sessionId,profileId,gameId:MARKET_GAME_ID,
   levelId:MARKET_OFFSETS[aisle]+stage,
   outcomeId:'en.a1.vocab.food',skillId:stage===1?undefined:'en.a1.vocab.food',
   score:Math.round(100*correct/attempts),success:true,starsEarned:stars,
   metrics:{durationSeconds:Math.round(durationSeconds),attemptsCount:attempts,
     accuracyRate:correct/attempts,wrongAttempts:mistakes,foodAnswers:answers},
   completedAt:new Date().toISOString()
 };
 await repo.recordGameCompleted(payload,profileId);
 return getFoodMarketProgress(repo,profileId);
}
