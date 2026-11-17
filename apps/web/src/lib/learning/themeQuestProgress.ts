import type {GameCompletedPayload} from '@ventra/shared';
import type {IProgressRepository} from '../progress/types.ts';
import type {EnglishPlacement} from './gradeAwareLearningPolicy.ts';
import {THEME_ORDER,THEME_QUEST_GAME_ID,themeLevelId,type ThemeId,type ThemeTier} from './themeQuestCatalog.ts';
import {planThemeLesson,themeEffectiveTier,type ThemeAnswerEvidence} from './themeQuestEngine.ts';

export interface ThemeTownProgress{
 completed:number;total:number;replays:Readonly<Record<ThemeId,number>>;
 stars:Readonly<Record<ThemeId,number>>;tier:ThemeTier;
}
export async function getThemeTownProgress(
 repo:Pick<IProgressRepository,'getAllLevelProgress'>,
 profileId:string,placement:EnglishPlacement,gradeLevel:number|null
):Promise<ThemeTownProgress>{
 if(!profileId)throw new Error('Missing child profile');
 const saved=await repo.getAllLevelProgress(THEME_QUEST_GAME_ID,profileId);
 const tier=themeEffectiveTier(gradeLevel,placement);
 const replays={} as Record<ThemeId,number>,stars={} as Record<ThemeId,number>;
 let completed=0;
 for(const theme of THEME_ORDER){
  const level=themeLevelId(theme,placement,tier);
  const row=saved[level];
  replays[theme]=Math.max(0,row?.completedCount??0);
  stars[theme]=Math.max(0,Math.min(3,row?.bestStars??0));
  if(replays[theme]>0)completed++;
 }
 return {completed,total:THEME_ORDER.length,replays,stars,tier};
}
export async function recordThemeQuest(input:{
 repo:IProgressRepository;profileId:string;placement:EnglishPlacement;gradeLevel:number|null;
 theme:ThemeId;replay:number;sessionId:string;answers:readonly ThemeAnswerEvidence[];
 durationSeconds:number;
}):Promise<ThemeTownProgress>{
 const {repo,profileId,placement,gradeLevel,theme,replay,sessionId,answers,durationSeconds}=input;
 const planned=planThemeLesson({theme,placement,gradeLevel,replay});
 if(!profileId||!/^[0-9a-zA-Z-]{12,80}$/.test(sessionId)||
  !Number.isFinite(durationSeconds)||durationSeconds<=0||
  answers.length!==planned.tasks.length||answers.some((x,i)=>
   x.taskId!==planned.tasks[i].id||x.kind!==planned.tasks[i].kind||
   !Number.isSafeInteger(x.mistakes)||x.mistakes<0||x.mistakes>100||
   typeof x.firstTryCorrect!=='boolean'||typeof x.hintUsed!=='boolean'||
   typeof x.speechStarted!=='boolean'||typeof x.independent!=='boolean'))
   throw new Error('Invalid Theme Town completion evidence');
 const errors=answers.reduce((sum,a)=>sum+a.mistakes,0);
 const hinted=answers.filter(a=>a.hintUsed).length;
 const quiz=answers.filter(a=>a.kind!=='discover');
 const independentCorrect=quiz.filter(a=>a.firstTryCorrect&&a.independent).length;
 const accuracy=quiz.length?independentCorrect/quiz.length:0;
 const stars:1|2|3=errors===0&&hinted===0?3:errors<=3&&hinted<=2?2:1;
 const payload:GameCompletedPayload={
  sessionId,profileId,gameId:THEME_QUEST_GAME_ID,
  levelId:themeLevelId(theme,placement,planned.tier),
  outcomeId:'en.'+theme+'.'+placement.toLowerCase(),
  skillId:'en.theme.'+theme+'.'+placement.toLowerCase(),
  score:Math.round(accuracy*100),success:true,starsEarned:stars,
  metrics:{durationSeconds:Math.max(1,Math.round(durationSeconds)),
   attemptsCount:quiz.length+errors,accuracyRate:accuracy,
   wrongAttempts:errors,hintsUsed:hinted},
  completedAt:new Date().toISOString()
 };
 await repo.recordGameCompleted(payload,profileId);
 return getThemeTownProgress(repo,profileId,placement,gradeLevel);
}
