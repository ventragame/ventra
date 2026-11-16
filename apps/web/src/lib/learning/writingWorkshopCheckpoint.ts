import type {WorkshopLevel} from './writingWorkshopEngine.ts';
import type {WritingAnswerEvidence} from '@ventra/shared';

/** Checkpoint stores only per-question categorical success, never child text.
 * It remains profile, placement, chapter, device and version scoped.
 */
export type WorkshopCheckpoint={
 version:1;step:number;mistakes:number;hints:number;
 independent:number;typedIndependent:number;
 answers:WritingAnswerEvidence[];updatedAt:number;
 // Optional for migration: older unfinished lessons used the fixed first deck.
 playIndex?:number;taskIds?:string[];
};
const TTL=30*24*60*60*1000;
const key=(profile:string,level:WorkshopLevel,chapter:number)=>
 'ventra:writing:checkpoint:v1:'+profile+':'+level+':'+chapter;
const validInt=(x:unknown):x is number=>typeof x==='number'&&
 Number.isInteger(x)&&x>=0;
const validAnswer=(a:unknown):a is WritingAnswerEvidence=>{
 if(!a||typeof a!=='object')return false;
 const v=a as Record<string,unknown>;
 return typeof v.taskId==='string'&&/^w[1-5]-(pre|a1|a2)-(?:[1-9]|1[0-9]|2[01])$/.test(v.taskId)&&
  (v.mode==='spell'||v.mode==='assemble'||v.mode==='write')&&
  typeof v.firstTryCorrect==='boolean'&&typeof v.independentlyTyped==='boolean'&&
  validInt(v.hintsUsed)&&validInt(v.wrongAttempts);
};
function storage():Storage|null{
 try{return typeof window==='undefined'?null:window.localStorage;}
 catch{return null;}
}
export function readWorkshopCheckpoint(profileId:string,level:WorkshopLevel,chapter:number):WorkshopCheckpoint|null{
 const store=storage();if(!store)return null;
 const name=key(profileId,level,chapter);
 try{
  const raw=store.getItem(name);if(!raw)return null;
  const item=JSON.parse(raw) as Partial<WorkshopCheckpoint>;
  if(item.version!==1||!validInt(item.step)||item.step>=8||
   !validInt(item.mistakes)||!validInt(item.hints)||
   !validInt(item.independent)||!validInt(item.typedIndependent)||
   !Array.isArray(item.answers)||item.answers.length>8||!item.answers.every(validAnswer)||
   item.answers.length!==item.step||!validInt(item.updatedAt)||
   (item.playIndex!==undefined&&(!Number.isSafeInteger(item.playIndex)||item.playIndex<0))||
   (item.taskIds!==undefined&&(!Array.isArray(item.taskIds)||
    item.taskIds.length<3||item.taskIds.length>8||
    !item.taskIds.every(id=>typeof id==='string'&&
     /^w[1-5]-(pre|a1|a2)-(?:[1-9]|1[0-9]|2[01])$/.test(id))||
    new Set(item.taskIds).size!==item.taskIds.length))||
   item.updatedAt>Date.now()||Date.now()-item.updatedAt>TTL){
   store.removeItem(name);return null;
  }
  // Never import a checkpoint from another chapter/placement.
  const prefix='w'+chapter+'-'+(level==='Pre-A1'?'pre':level.toLowerCase())+'-';
  if(item.answers.some(a=>!a.taskId.startsWith(prefix))||
   (item.taskIds&&(
    item.taskIds.some(id=>!id.startsWith(prefix))||
    item.answers.some((a,i)=>item.taskIds![i]!==a.taskId)
   ))){
   store.removeItem(name);return null;
  }
  return item as WorkshopCheckpoint;
 }catch{try{store.removeItem(name);}catch{}return null;}
}
export function saveWorkshopCheckpoint(profileId:string,level:WorkshopLevel,chapter:number,data:Omit<WorkshopCheckpoint,'version'|'updatedAt'>):void{
 const store=storage();
 if(!store||!profileId||data.step>=8||data.step<0||
  !validInt(data.mistakes)||!validInt(data.hints)||
  !validInt(data.independent)||!validInt(data.typedIndependent)||
  !Array.isArray(data.answers)||data.answers.length!==data.step||
  !data.answers.every(validAnswer)||
  (data.playIndex!==undefined&&(!Number.isSafeInteger(data.playIndex)||data.playIndex<0))||
  (data.taskIds!==undefined&&(
   !Array.isArray(data.taskIds)||data.taskIds.length<3||data.taskIds.length>8||
   new Set(data.taskIds).size!==data.taskIds.length||
   data.taskIds.some(id=>typeof id!=='string'||
    !/^w[1-5]-(pre|a1|a2)-(?:[1-9]|1[0-9]|2[01])$/.test(id))||
   data.answers.some((a,i)=>data.taskIds![i]!==a.taskId)
  )))return;
 try{
  const item:WorkshopCheckpoint={...data,version:1,updatedAt:Date.now()};
  store.setItem(key(profileId,level,chapter),JSON.stringify(item));
 }catch{/* Private browsing may disable storage. Never block gameplay. */}
}
export function clearWorkshopCheckpoint(profileId:string,level:WorkshopLevel,chapter:number):void{
 try{storage()?.removeItem(key(profileId,level,chapter));}catch{}
}
