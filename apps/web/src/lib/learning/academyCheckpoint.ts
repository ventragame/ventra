import type {AcademyLevel,AcademyAnswer} from './academyEngine.ts';

export type AcademyCheckpoint={
 version:1;zone:number;level:AcademyLevel;step:number;variant:number;
 answers:AcademyAnswer[];attempts:number;hints:number;sessionId:string;updatedAt:number;
 // Optional fields keep existing v1 checkpoints backward-compatible.
 currentMistakes?:number;currentHintLevel?:0|1|2;
 audioAttempted?:boolean;audioPlayed?:boolean;
};
const TTL=30*24*60*60*1000;
const key=(profile:string,level:AcademyLevel,zone:number)=>
 'ventra:academy:checkpoint:v1:'+profile+':'+level+':'+zone;
function storage():Storage|null{
 try{return typeof window==='undefined'?null:window.localStorage;}catch{return null;}
}
export function readAcademyCheckpoint(profile:string,level:AcademyLevel,zone:number):AcademyCheckpoint|null{
 const store=storage();if(!store||!profile)return null;
 const name=key(profile,level,zone);
 try{
  const raw=store.getItem(name);if(!raw)return null;
  const data=JSON.parse(raw) as Partial<AcademyCheckpoint>;
  if(data.version!==1||data.level!==level||data.zone!==zone||
    !Number.isInteger(data.step)||data.step!<0||data.step!>5||
    !Number.isSafeInteger(data.variant)||data.variant!<0||
    !Number.isInteger(data.attempts)||data.attempts!<0||
    !Number.isInteger(data.hints)||data.hints!<0||
    (data.currentMistakes!==undefined&&(!Number.isInteger(data.currentMistakes)||data.currentMistakes<0))||
    (data.currentHintLevel!==undefined&&(!Number.isInteger(data.currentHintLevel)||data.currentHintLevel<0||data.currentHintLevel>2))||
    (data.audioAttempted!==undefined&&typeof data.audioAttempted!=='boolean')||
    (data.audioPlayed!==undefined&&typeof data.audioPlayed!=='boolean')||
    (data.audioPlayed===true&&data.audioAttempted!==true)||
    !Array.isArray(data.answers)||data.answers.length!==data.step||
    typeof data.sessionId!=='string'||data.sessionId.length<8||data.sessionId.length>100||
    !Number.isSafeInteger(data.updatedAt)||data.updatedAt!>Date.now()||
    Date.now()-data.updatedAt!>TTL||
    !data.answers.every(a=>a&&typeof a.taskId==='string'&&
      /^academy-(?:[1-9]|1[0-8])-(?:prea1|a1|a2)-(?:hear|read|talk|build|write)$/.test(a.taskId)&&
      typeof a.firstTryCorrect==='boolean'&&typeof a.hintUsed==='boolean'&&
      typeof a.independentlyCompleted==='boolean'&&typeof a.speechVerified==='boolean'&&
      typeof a.timestamp==='string'&&Number.isInteger(a.mistakes)&&a.mistakes>=0&&
      a.placement===level)){
    store.removeItem(name);return null;
  }
  return data as AcademyCheckpoint;
 }catch{try{store.removeItem(name)}catch{}return null;}
}
export function saveAcademyCheckpoint(profile:string,level:AcademyLevel,zone:number,data:Omit<AcademyCheckpoint,'version'|'updatedAt'|'zone'|'level'>):void{
 const store=storage();if(!store||!profile)return;
 try{
  store.setItem(key(profile,level,zone),JSON.stringify({...data,version:1,zone,level,updatedAt:Date.now()}));
 }catch{/* Offline storage unavailable; game remains playable. */}
}
export function clearAcademyCheckpoint(profile:string,level:AcademyLevel,zone:number):void{
 try{storage()?.removeItem(key(profile,level,zone));}catch{}
}
