
import type {GameCompletedPayload} from '@ventra/shared';
import type {IProgressRepository} from './types.ts';
import {
 SEQUENCE_STORIES,SEQUENCE_GAME_ID,sequenceStars,validateSequenceAnswers,
 validateSequenceComprehension,type SequenceComprehensionAnswer,
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
 answers:SequenceAnswer[];comprehensionAnswers?:SequenceComprehensionAnswer[];
 sessionId:string;durationSeconds:number;
}):Promise<SequenceProgress>{
 const {repo,profileId,episode,deck,answers,sessionId,durationSeconds}=input;
 const extra=deck.assessmentVersion===2?input.comprehensionAnswers??[]:[];
 if(deck.assessmentVersion===2&&!validateSequenceComprehension(extra,deck))
  throw Error('İngilizce anlama görevleri tamamlanmadı.');
 if(!profileId||!sessionId||deck.episode!==episode||
   !Number.isFinite(durationSeconds)||durationSeconds<0||
   !validateSequenceAnswers(answers,deck))
  throw Error('Hikâye sıralama sonuçları doğrulanamadı.');
 const previous=await getSequenceProgress(repo,profileId);
 if(episode>previous.completedLevels+1)throw Error('Önceki sıralama hikâyesi bitmedi.');
 const wrong=[...answers,...extra].reduce((n,a)=>n+a.mistakes,0);
 const independent=[...answers,...extra].filter(a=>a.firstTryCorrect).length;
 const decisions=answers.length+extra.length;
 const totalHints=[...answers,...extra].filter(a=>a.hintUsed).length;
 const stars:1|2|3=deck.assessmentVersion===2?
  wrong===0&&totalHints===0?3:wrong<=2&&totalHints<=1?2:1:
  sequenceStars(answers);
 const payload:GameCompletedPayload={
  sessionId,profileId,gameId:SEQUENCE_GAME_ID,levelId:episode,
  outcomeId:'en.story.forest.sequence',success:true,
  score:Math.round(100*independent/decisions),starsEarned:stars,
  metrics:{
   durationSeconds:Math.round(durationSeconds),attemptsCount:decisions+wrong,
   accuracyRate:independent/decisions,wrongAttempts:wrong,
   hintsUsed:totalHints,
   sequenceAnswers:answers,sequenceChecks:deck.assessmentVersion===2?extra:undefined
  },
  completedAt:new Date().toISOString()
 };
 await repo.recordGameCompleted(payload,profileId);
 return getSequenceProgress(repo,profileId);
}
