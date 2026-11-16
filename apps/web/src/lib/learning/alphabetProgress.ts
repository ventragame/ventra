import type {GameCompletedPayload} from '@ventra/shared';
import type {IProgressRepository} from '../progress/types.ts';
import type {EnglishPlacement} from './gradeAwareLearningPolicy.ts';
import {ALPHABET_GROVE_GAME_ID,ALPHABET_TOTAL_LESSONS,alphabetLessonLevelId,
 type AlphabetAnswerEvidence} from './alphabetGroveEngine.ts';

export interface AlphabetProgress{
 completed:number;total:number;stars:Readonly<Record<number,number>>;
 replays:Readonly<Record<number,number>>;
}
export async function getAlphabetProgress(
 repo:IProgressRepository,profileId:string,placement:EnglishPlacement
):Promise<AlphabetProgress>{
 const rows=await repo.getAllLevelProgress(ALPHABET_GROVE_GAME_ID,profileId);
 const stars:Record<number,number>={},replays:Record<number,number>={};
 let completed=0;
 for(let lesson=1;lesson<=ALPHABET_TOTAL_LESSONS;lesson++){
  const saved=rows[alphabetLessonLevelId(lesson,placement)];
  stars[lesson]=Math.max(0,Math.min(3,saved?.bestStars??0));
  replays[lesson]=Math.max(0,saved?.completedCount??0);
  if(saved?.completedCount&&saved.completedCount>0)completed++;
 }
 return {completed,total:ALPHABET_TOTAL_LESSONS,stars,replays};
}
export async function recordAlphabetLesson(input:{
 repo:IProgressRepository;profileId:string;placement:EnglishPlacement;lesson:number;
 sessionId:string;answers:readonly AlphabetAnswerEvidence[];durationSeconds:number;
}):Promise<AlphabetProgress>{
 const {repo,profileId,placement,lesson,sessionId,answers,durationSeconds}=input;
 if(!profileId||!Array.isArray(answers)||answers.length<9||answers.length>18||
  new Set(answers.map(x=>x.taskId)).size!==answers.length||
  !Number.isFinite(durationSeconds)||durationSeconds<0||
  !/^[a-zA-Z0-9-]{10,80}$/.test(sessionId))
  throw new Error('Geçersiz Harf Korusu kayıt kanıtı.');
 const levelId=alphabetLessonLevelId(lesson,placement);
 const mistakes=answers.reduce((n,a)=>n+a.mistakes,0);
 const hints=answers.filter(a=>a.hintUsed).length;
 const independent=answers.filter(a=>a.independent&&a.firstTryCorrect).length;
 const score=Math.round(100*independent/answers.length);
 const stars:1|2|3=mistakes===0&&hints===0?3:mistakes<=3&&hints<=2?2:1;
 const payload:GameCompletedPayload={
  sessionId,profileId,gameId:ALPHABET_GROVE_GAME_ID,levelId,
  outcomeId:lesson<=9?'en.letters.'+placement.toLowerCase():'en.phonics.'+placement.toLowerCase(),
  skillId:'en.alphabet.'+placement.toLowerCase(),success:true,starsEarned:stars,score,
  metrics:{durationSeconds:Math.max(1,Math.round(durationSeconds)),
   attemptsCount:answers.length+mistakes,accuracyRate:independent/answers.length,
   wrongAttempts:mistakes,hintsUsed:hints},
  completedAt:new Date().toISOString()
 };
 await repo.recordGameCompleted(payload,profileId);
 return getAlphabetProgress(repo,profileId,placement);
}
