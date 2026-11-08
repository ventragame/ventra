
import type {GameCompletedPayload} from '@ventra/shared';
import type {IProgressRepository} from './types.ts';
import {
 FOREST_EPISODES,forestStars,validateStoryForestEvidence,
 type ForestAnswer,type ForestDeck,type ForestEpisode
} from '../learning/storyForestEngine.ts';

export const STORY_FOREST_GAME_ID='island_story_forest_discover';
export interface ForestProgress{
 completedLevels:number;totalLevels:6;starsByLevel:Record<number,number>;
}
export async function getStoryForestProgress(repo:IProgressRepository,profileId:string):Promise<ForestProgress>{
 const saved=await repo.getAllLevelProgress(STORY_FOREST_GAME_ID,profileId);
 const starsByLevel:Record<number,number>={};
 let completedLevels=0;
 for(const episode of FOREST_EPISODES){
  const row=saved[episode.id];
  if(!row||!(row.completedCount>0))continue;
  starsByLevel[episode.id]=Math.max(0,Math.min(3,row.bestStars));
  if(completedLevels===episode.id-1)completedLevels++;
 }
 return {completedLevels,totalLevels:6,starsByLevel};
}
export async function saveStoryForestEpisode(input:{
 repo:IProgressRepository;profileId:string;episode:ForestEpisode;deck:ForestDeck;
 answers:ForestAnswer[];sessionId:string;durationSeconds:number;
}):Promise<ForestProgress>{
 const {repo,profileId,episode,deck,answers,sessionId,durationSeconds}=input;
 if(!profileId||!sessionId||!Number.isFinite(durationSeconds)||durationSeconds<0||
    deck.episode!==episode||!validateStoryForestEvidence(answers,deck))
   throw Error('Hikâye Ormanı görev kayıtları doğrulanamadı.');
 const previous=await getStoryForestProgress(repo,profileId);
 if(episode>previous.completedLevels+1)throw Error('Önceki hikâye henüz tamamlanmadı.');
 const mistakes=answers.reduce((n,row)=>n+row.mistakes,0);
 const independent=answers.filter(a=>a.firstTryCorrect).length;
 const stars=forestStars(answers);
 const payload:GameCompletedPayload={
  sessionId,profileId,gameId:STORY_FOREST_GAME_ID,levelId:episode,
  outcomeId:'en.story.forest.listening',success:true,
  score:Math.round(100*independent/answers.length),starsEarned:stars,
  metrics:{
   durationSeconds:Math.round(durationSeconds),attemptsCount:answers.length+mistakes,
   accuracyRate:independent/answers.length,wrongAttempts:mistakes,
   hintsUsed:answers.filter(a=>a.hintUsed).length,storyAnswers:answers
  },
  completedAt:new Date().toISOString()
 };
 await repo.recordGameCompleted(payload,profileId);
 return getStoryForestProgress(repo,profileId);
}

/** Story Engine 2.0 writes to the ORIGINAL game id/levels.
 * Existing completed chapters and stars remain valid; routes are additional
 * learning evidence and never create a second reward entitlement.
 */
import {journeyStars,validateJourneyRecord,
 type JourneyPlan,type JourneyRecord} from '../learning/storyForestJourneyEngine.ts';
export async function saveForestJourney(input:{
 repo:IProgressRepository;profileId:string;episode:ForestEpisode;
 plan:JourneyPlan;record:JourneyRecord;sessionId:string;durationSeconds:number;
}):Promise<ForestProgress>{
 const {repo,profileId,episode,plan,record,sessionId,durationSeconds}=input;
 if(!profileId||!sessionId||plan.route.episode!==episode||
   !Number.isFinite(durationSeconds)||durationSeconds<0||
   !validateJourneyRecord(record,plan))
  throw Error('Hikâye kayıtları doğrulanamadı.');
 const previous=await getStoryForestProgress(repo,profileId);
 if(episode>previous.completedLevels+1)throw Error('Önceki hikâye henüz tamamlanmadı.');
 const mistakes=record.firstMistakes+record.secondMistakes;
 const independent=Number(record.firstMistakes===0&&!record.firstHint)+
  Number(record.secondMistakes===0&&!record.secondHint);
 const payload:GameCompletedPayload={
  sessionId,profileId,gameId:STORY_FOREST_GAME_ID,levelId:episode,
  outcomeId:'en.story.forest.branching',success:true,
  score:independent*50,starsEarned:journeyStars(record),
  metrics:{
   durationSeconds:Math.round(durationSeconds),
   attemptsCount:2+mistakes,accuracyRate:independent/2,
   wrongAttempts:mistakes,hintsUsed:Number(record.firstHint)+Number(record.secondHint),
   storyJourneys:[record]
  },
  completedAt:record.completedAt
 };
 await repo.recordGameCompleted(payload,profileId);
 return getStoryForestProgress(repo,profileId);
}
