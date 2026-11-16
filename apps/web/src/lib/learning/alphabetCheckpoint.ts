/**
 * 30-day, profile-separated, device-local alphabet session checkpoint.
 * Categorical task evidence only; never persist children's spoken/typed text.
 */
import type {EnglishPlacement} from './gradeAwareLearningPolicy.ts';
import type {AlphabetAnswerEvidence} from './alphabetGroveEngine.ts';
export interface AlphabetCheckpoint{
 version:1;lesson:number;placement:EnglishPlacement;replay:number;
 taskIds:readonly string[];step:number;answers:readonly AlphabetAnswerEvidence[];
 mistakes:number;hints:number;sessionId:string;expiresAt:number;
}
const PREFIX='ventra-alphabet-1:';
export const ALPHABET_CHECKPOINT_TTL=30*24*60*60*1000;
export function alphabetCheckpointKey(profileId:string,placement:EnglishPlacement,lesson:number):string{
 return PREFIX+encodeURIComponent(profileId)+':'+placement+':'+lesson;
}
const kinds=new Set(['introduce','case','letter-name','sound-in-word','read-word','build-word']);
const numberIn=(value:unknown,max:number)=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=max;
export function parseAlphabetCheckpoint(
 raw:string|null,placement:EnglishPlacement,lesson:number,now:number=Date.now()
):AlphabetCheckpoint|null{
 if(!raw||raw.length>32000)return null;
 try{
  const item:unknown=JSON.parse(raw);
  if(!item||typeof item!=='object'||Array.isArray(item))return null;
  const x=item as Record<string,unknown>;
  if(x.version!==1||x.placement!==placement||x.lesson!==lesson||
   !numberIn(x.replay,1000000)||typeof x.sessionId!=='string'||
   !/^[a-zA-Z0-9-]{10,80}$/.test(x.sessionId)||typeof x.expiresAt!=='number'||
   x.expiresAt<=now||x.expiresAt>now+ALPHABET_CHECKPOINT_TTL+60000||
   !Array.isArray(x.taskIds)||x.taskIds.length<9||x.taskIds.length>18||
   !x.taskIds.every(v=>typeof v==='string'&&v.length<160)||
   !numberIn(x.step,x.taskIds.length)||!Array.isArray(x.answers)||
   x.answers.length!==x.step||!numberIn(x.mistakes,100000)||
   !numberIn(x.hints,100000)||new Set(x.taskIds).size!==x.taskIds.length)return null;
  const answers=x.answers as unknown[];
  if(!answers.every((row,i)=>{
   if(!row||typeof row!=='object'||Array.isArray(row))return false;
   const a=row as Record<string,unknown>;
   return a.taskId===x.taskIds[i]&&kinds.has(String(a.kind))&&
    typeof a.firstTryCorrect==='boolean'&&typeof a.hintUsed==='boolean'&&
    typeof a.audioPlayed==='boolean'&&typeof a.independent==='boolean'&&
    numberIn(a.mistakes,10000);
  }))return null;
  return x as unknown as AlphabetCheckpoint;
 }catch{return null;}
}
export function loadAlphabetCheckpoint(profileId:string,placement:EnglishPlacement,lesson:number):AlphabetCheckpoint|null{
 try{
  if(typeof window==='undefined')return null;
  const key=alphabetCheckpointKey(profileId,placement,lesson);
  const parsed=parseAlphabetCheckpoint(window.localStorage.getItem(key),placement,lesson);
  if(!parsed)window.localStorage.removeItem(key);
  return parsed;
 }catch{return null;}
}
export function saveAlphabetCheckpoint(
 profileId:string,placement:EnglishPlacement,lesson:number,
 input:Omit<AlphabetCheckpoint,'version'|'lesson'|'placement'|'expiresAt'>
):void{
 try{
  if(typeof window==='undefined')return;
  const value:AlphabetCheckpoint={...input,version:1,placement,lesson,
   expiresAt:Date.now()+ALPHABET_CHECKPOINT_TTL};
  window.localStorage.setItem(alphabetCheckpointKey(profileId,placement,lesson),JSON.stringify(value));
 }catch{/* Storage may be unavailable; saved completed games remain authoritative. */}
}
export function clearAlphabetCheckpoint(profileId:string,placement:EnglishPlacement,lesson:number):void{
 try{if(typeof window!=='undefined')window.localStorage.removeItem(alphabetCheckpointKey(profileId,placement,lesson));}
 catch{/* No authority outside this device. */}
}
