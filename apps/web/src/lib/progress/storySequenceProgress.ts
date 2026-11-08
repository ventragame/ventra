
import type {GameCompletedPayload} from '@ventra/shared';
import type {IProgressRepository} from './types.ts';
import {
 SEQUENCE_STORIES,SEQUENCE_GAME_ID,sequenceStars,validateSequenceAnswers,
 type SequenceDeck,type SequenceAnswer
} from '../learning/storySequenceEngine.ts';
import type {ForestEpisode} from '../learning/storyForestEngine.ts';
export interface SequenceProgress{completedLevels:number;totalLevels:6;starsByLevel:Record<number,number>}
export async function getSequenceProgress(repo:IProgressRepository,profileId:string):Promise<SequenceProgress>{
 const rows=await repo.getAllLevelProgress(SEQUENCE_GAME_ID,profileId);
 let completedLevels=0;const starsByLevel:Record<number,number>={};
 for(const story of SEQUENCE_STORIES){
  const row=rows[story.episode];
  if(!row||row.completedCount<=0)continue;
  starsByLevel[story.episode]=Math.max(0,Math.min(3,row.bestStars));
  if(completedLevels===story.episode-1)completedLevels++;
 }
 return {completedLevels,totalLevels:6,starsByLevel};
}
export async function saveSequenceStory(input:{
 repo:IProgressRepository;profileId:string;episode:ForestEpisode;deck:SequenceDeck;
 answers:SequenceAnswer[];sessionId:string;durationSeconds:number;
}):Promise<SequenceProgress>{
 const {repo,profileId,episode,deck,answers,sessionId,durationSeconds}=input;
 if(!profileId||!sessionId||deck.episode!==episode||
   !Number.isFinite(durationSeconds)||durationSeconds<0||
   !validateSequenceAnswers(answers,deck))
  throw Error('Hikâye sıralama sonuçları doğrulanamadı.');
 const previous=await getSequenceProgress(repo,profileId);
 if(episode>previous.completedLevels+1)throw Error('Önceki sıralama hikâyesi bitmedi.');
 const wrong=answers.reduce((n,a)=>n+a.mistakes,0);
 const independent=answers.filter(a=>a.firstTryCorrect).length;
 const payload:GameCompletedPayload={
  sessionId,profileId,gameId:SEQUENCE_GAME_ID,levelId:episode,
  outcomeId:'en.story.forest.sequence',success:true,
  score:Math.round(100*independent/answers.length),starsEarned:sequenceStars(answers),
  metrics:{
   durationSeconds:Math.round(durationSeconds),attemptsCount:answers.length+wrong,
   accuracyRate:independent/answers.length,wrongAttempts:wrong,
   hintsUsed:answers.filter(a=>a.hintUsed).length,
   sequenceAnswers:answers
  },
  completedAt:new Date().toISOString()
 };
 await repo.recordGameCompleted(payload,profileId);
 return getSequenceProgress(repo,profileId);
}
