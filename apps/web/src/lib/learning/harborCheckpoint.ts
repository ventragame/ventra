import type {HarborLevel} from './harborQuestContentA.ts';

/** Store only numerical, device-local gameplay progress. Never audio, words,
 * transcripts, real names, credentials or any other child data.
 *
 * Fully completed five-part island levels continue to be stored by the
 * existing validated ProgressRepository and rewards engine; this is ONLY
 * a resumable checkpoint for an interrupted nine-step mission sequence.
 */
export type HarborCheckpoint={
 step:number;mistakes:number;hints:number;voiceRecognized:number;
 updatedAt:number;version:2;
};
const TIME_TO_LIVE=30*24*60*60*1000;
const buildKey=(profile:string,level:HarborLevel,episode:number)=>
 'ventra:harbor:checkpoint:v2:'+profile+':'+level+':'+episode;
const validInt=(n:unknown)=>typeof n==='number'&&Number.isInteger(n)&&n>=0;
function store():Storage|null{
 try{return typeof window==='undefined'?null:window.localStorage;}catch{return null;}
}
export function readHarborCheckpoint(profileId:string,level:HarborLevel,episode:number):HarborCheckpoint|null{
 const storage=store();if(!storage)return null;
 const key=buildKey(profileId,level,episode);
 try{
  const raw=storage.getItem(key);
  if(!raw)return null;
  const saved=JSON.parse(raw) as Partial<HarborCheckpoint>;
  if(saved.version!==2||!validInt(saved.step)||saved.step!>=9||
   !validInt(saved.mistakes)||!validInt(saved.hints)||!validInt(saved.voiceRecognized)||
   !validInt(saved.updatedAt)||saved.updatedAt!>Date.now()||
   Date.now()-saved.updatedAt!>TIME_TO_LIVE){
   storage.removeItem(key);return null;
  }
  return saved as HarborCheckpoint;
 }catch{try{storage.removeItem(key);}catch{}return null;}
}
export function saveHarborCheckpoint(
 profileId:string,level:HarborLevel,episode:number,
 step:number,mistakes:number,hints:number,voiceRecognized:number
):void{
 const storage=store();
 if(!storage||!validInt(step)||step>=9||!validInt(mistakes)||!validInt(hints)||!validInt(voiceRecognized))return;
 try{
  const value:HarborCheckpoint={version:2,step,mistakes,hints,voiceRecognized,updatedAt:Date.now()};
  storage.setItem(buildKey(profileId,level,episode),JSON.stringify(value));
 }catch{/* storage may be blocked in private browsing; gameplay remains available */}
}
export function clearHarborCheckpoint(profileId:string,level:HarborLevel,episode:number):void{
 try{store()?.removeItem(buildKey(profileId,level,episode));}catch{}
}
