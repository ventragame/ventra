import type {GameCompletedPayload,TempleAnswerEvidence} from '@ventra/shared';
import type {IProgressRepository} from './types.ts';
import {TEMPLE_TOTAL,TEMPLE_GAME_ID,TEMPLE_CHAMBERS,TEMPLE_OFFSETS,TEMPLE_KINDS,
 validTempleAnswers,templeWord,type TempleStage,type TempleChamber} from '../learning/templeEngine.ts';
export type TempleProgress={completedLevels:number;totalLevels:number;
 completedByChamber:Record<TempleChamber,number>;starsByLevel:Record<number,number>};
export async function getTempleProgress(repo:IProgressRepository,profileId:string):Promise<TempleProgress>{
 const levels=await repo.getAllLevelProgress(TEMPLE_GAME_ID,profileId);
 const completedByChamber:Record<TempleChamber,number>={rune:0,echo:0,feast:0,home:0,crown:0};
 const starsByLevel:Record<number,number>={};
 for(const c of TEMPLE_CHAMBERS)for(let n=1;n<=5;n++){
  const id=TEMPLE_OFFSETS[c.id]+n,entry=levels[id];
  if(!entry||(entry.completedCount<=0&&entry.bestStars<=0))continue;
  starsByLevel[id]=Math.max(0,Math.min(3,entry.bestStars));
  if(completedByChamber[c.id]===n-1)completedByChamber[c.id]++;
 }
 return {completedByChamber,completedLevels:Object.values(completedByChamber).reduce((s,n)=>s+n,0),
  totalLevels:TEMPLE_TOTAL,starsByLevel};
}
export async function saveTempleMission(repo:IProgressRepository,profileId:string,chamber:TempleChamber,
 stage:TempleStage,mistakes:number,durationSeconds:number,answers:TempleAnswerEvidence[],sessionId:string){
 if(!(chamber in TEMPLE_OFFSETS)||!TEMPLE_KINDS[stage-1])throw Error('Geçersiz tapınak görevi');
 if(!profileId||!sessionId||!Number.isFinite(mistakes)||mistakes<0||!Number.isFinite(durationSeconds)||durationSeconds<0||
  !validTempleAnswers(answers)||answers.length<4||
  answers.some(a=>a.kind!==TEMPLE_KINDS[stage-1]||
   !['animals','colors','numbers','food','family'].includes(templeWord(a.wordId).domain)||
   !((chamber==='crown')||(chamber==='rune'&&['animals','colors'].includes(a.sourceDomain))||
   (chamber==='echo'&&['numbers','colors'].includes(a.sourceDomain))||
   (chamber==='feast'&&['food','colors'].includes(a.sourceDomain))||
   (chamber==='home'&&['family','animals'].includes(a.sourceDomain)))))
  throw Error('Geçersiz İngilizce öğrenme kanıtı');
 const before=await getTempleProgress(repo,profileId);
 if(stage>before.completedByChamber[chamber]+1)throw Error('Önce önceki tapınak görevini bitir');
 const index=TEMPLE_CHAMBERS.findIndex(c=>c.id===chamber);
 if(index>0&&before.completedByChamber[TEMPLE_CHAMBERS[index-1].id]<5)
  throw Error('Önce önceki tapınak bölümünü bitir');
 const attempts=answers.length+mistakes;
 const payload:GameCompletedPayload={
  profileId,sessionId,gameId:TEMPLE_GAME_ID,levelId:TEMPLE_OFFSETS[chamber]+stage,
  outcomeId:'en.a1.vocab.temple_review',skillId:stage===1?undefined:'en.a1.vocab.temple_review',
  score:Math.round(100*answers.length/attempts),success:true,starsEarned:mistakes===0?3:mistakes<=2?2:1,
  metrics:{durationSeconds:Math.round(durationSeconds),attemptsCount:attempts,
    accuracyRate:answers.length/attempts,wrongAttempts:mistakes,templeAnswers:answers},
  completedAt:new Date().toISOString()
 };
 await repo.recordGameCompleted(payload,profileId);
 return getTempleProgress(repo,profileId);
}
