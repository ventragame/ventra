import type {GameCompletedPayload,SentenceAnswerEvidence} from '@ventra/shared';
import type {IProgressRepository} from './types.ts';
import {SENTENCE_PLAZA_GAME_ID,validatePlazaEvidence,type PlazaDeck,type PlazaMission} from '../learning/sentencePlazaEngine.ts';

export interface SentencePlazaProgress {
 completedLevels:number;totalLevels:6;starsByLevel:Record<number,number>;
}
export async function getSentencePlazaProgress(repo:IProgressRepository,profileId:string):Promise<SentencePlazaProgress>{
 const levels=await repo.getAllLevelProgress(SENTENCE_PLAZA_GAME_ID,profileId);
 const starsByLevel:Record<number,number>={};let completedLevels=0;
 for(let i=1;i<=6;i++){
  const row=levels[i];
  if(!row||(!row.completedCount&&!row.bestStars))continue;
  starsByLevel[i]=Math.max(0,Math.min(3,row.bestStars));
  if(completedLevels===i-1)completedLevels++;
 }
 return {completedLevels,totalLevels:6,starsByLevel};
}
export async function saveSentencePlazaMission(input:{
 repo:IProgressRepository;profileId:string;mission:PlazaMission;
 plan:PlazaDeck;answers:SentenceAnswerEvidence[];sessionId:string;
 durationSeconds:number;
}):Promise<SentencePlazaProgress>{
 const {repo,profileId,mission,plan,answers,sessionId,durationSeconds}=input;
 if(!profileId||!sessionId||!Number.isFinite(durationSeconds)||durationSeconds<0||
    plan.mission!==mission||!validatePlazaEvidence(answers,plan))
   throw Error('Cümle Meydanı İngilizce kanıtları doğrulanamadı.');
 const previous=await getSentencePlazaProgress(repo,profileId);
 if(mission>previous.completedLevels+1)
   throw Error('Önceki Cümle Meydanı görevini tamamla.');
 const errors=answers.reduce((sum,x)=>sum+x.mistakes,0);
 const assisted=answers.filter(x=>x.hintUsed||x.modelHeard).length;
 const attempts=answers.length+errors;
 const independent=answers.filter(x=>x.firstTryCorrect).length;
 const stars=errors===0&&assisted===0?3:errors<=2&&assisted<=2?2:1;
 const payload:GameCompletedPayload={
  sessionId,profileId,gameId:SENTENCE_PLAZA_GAME_ID,levelId:mission,
  outcomeId:'en.sentence.plaza.'+plan.questions[0].skill,
  // No skillId yet: bridge-level mastery currently counts successful game
  // completions without distinguishing scaffolded vs independent outcomes.
  // SentenceAnswerEvidence is the independent source of educational truth.
  score:Math.round(100*independent/answers.length),
  success:true,starsEarned:stars,
  metrics:{durationSeconds:Math.round(durationSeconds),attemptsCount:attempts,
   wrongAttempts:errors,hintsUsed:assisted,accuracyRate:independent/answers.length,
   sentenceAnswers:answers},
  completedAt:new Date().toISOString()
 };
 await repo.recordGameCompleted(payload,profileId);
 return getSentencePlazaProgress(repo,profileId);
}
