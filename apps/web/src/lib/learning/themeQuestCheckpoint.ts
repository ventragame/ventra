/**
 * Device-only P3 checkpoint. Never store free-form child responses or audio.
 * Real completed progress remains in the existing profile progress repository.
 */
import type {EnglishPlacement} from './gradeAwareLearningPolicy.ts';
import type {ThemeId,ThemeTier} from './themeQuestCatalog.ts';
import type {ThemeAnswerEvidence} from './themeQuestEngine.ts';
export const THEME_CHECKPOINT_TTL_MS=30*24*60*60*1000;
export interface ThemeCheckpoint{
 version:1;theme:ThemeId;placement:EnglishPlacement;tier:ThemeTier;replay:number;
 sessionId:string;step:number;taskIds:readonly string[];
 answers:readonly ThemeAnswerEvidence[];mistakes:number;hints:number;
 expiresAt:number;
}
const TYPES=new Set(['discover','picture','translate','listen','meaning','phrase','assemble','clock']);
const integer=(x:unknown,max:number)=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0&&x<=max;
export function themeCheckpointKey(profileId:string,placement:EnglishPlacement,tier:ThemeTier,theme:ThemeId):string{
 return 'ventra-theme-p3:'+encodeURIComponent(profileId)+':'+placement+':'+tier+':'+theme;
}
export function parseThemeCheckpoint(
 raw:string|null,placement:EnglishPlacement,tier:ThemeTier,theme:ThemeId,
 now=Date.now()
):ThemeCheckpoint|null{
 if(!raw||raw.length>32000)return null;
 try{
  const value:unknown=JSON.parse(raw);
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const v=value as Record<string,unknown>;
  if(v.version!==1||v.theme!==theme||v.placement!==placement||v.tier!==tier||
   !integer(v.replay,1000000)||typeof v.sessionId!=='string'||
   !/^[0-9a-zA-Z-]{12,80}$/.test(v.sessionId)||!Array.isArray(v.taskIds)||
   v.taskIds.length<8||v.taskIds.length>12||
   !v.taskIds.every(x=>typeof x==='string'&&x.length<170&&
    x.startsWith('theme:'+theme+':'+placement+':'+tier+':'+String(v.replay)+':'))||
   new Set(v.taskIds).size!==v.taskIds.length||
   !integer(v.step,v.taskIds.length)||!Array.isArray(v.answers)||v.answers.length!==v.step||
   !integer(v.mistakes,10000)||!integer(v.hints,10000)||typeof v.expiresAt!=='number'||
   v.expiresAt<=now||v.expiresAt>now+THEME_CHECKPOINT_TTL_MS+60000)return null;
  const ids=v.taskIds as string[];
  const allowed=new Set(['taskId','kind','firstTryCorrect','mistakes','hintUsed','speechStarted','independent']);
  if(!(v.answers as unknown[]).every((x,i)=>{
   if(!x||typeof x!=='object'||Array.isArray(x))return false;
   const a=x as Record<string,unknown>;
   return Object.keys(a).every(k=>allowed.has(k))&&a.taskId===ids[i]&&
    TYPES.has(String(a.kind))&&integer(a.mistakes,100)&&
    typeof a.firstTryCorrect==='boolean'&&typeof a.hintUsed==='boolean'&&
    typeof a.speechStarted==='boolean'&&typeof a.independent==='boolean';
  }))return null;
  return v as unknown as ThemeCheckpoint;
 }catch{return null;}
}
export function loadThemeCheckpoint(profile:string,placement:EnglishPlacement,tier:ThemeTier,theme:ThemeId):ThemeCheckpoint|null{
 try{
  if(typeof window==='undefined')return null;
  const key=themeCheckpointKey(profile,placement,tier,theme);
  const valid=parseThemeCheckpoint(window.localStorage.getItem(key),placement,tier,theme);
  if(!valid)window.localStorage.removeItem(key);
  return valid;
 }catch{return null;}
}
export function saveThemeCheckpoint(profile:string,placement:EnglishPlacement,tier:ThemeTier,theme:ThemeId,
 data:Omit<ThemeCheckpoint,'version'|'theme'|'placement'|'tier'|'expiresAt'>):void{
 try{
  if(typeof window==='undefined')return;
  const checkpoint:ThemeCheckpoint={version:1,theme,placement,tier,
   expiresAt:Date.now()+THEME_CHECKPOINT_TTL_MS,...data};
  window.localStorage.setItem(themeCheckpointKey(profile,placement,tier,theme),JSON.stringify(checkpoint));
 }catch{/* Storage can be disabled; active session continues safely. */}
}
export function clearThemeCheckpoint(profile:string,placement:EnglishPlacement,tier:ThemeTier,theme:ThemeId):void{
 try{if(typeof window!=='undefined')window.localStorage.removeItem(themeCheckpointKey(profile,placement,tier,theme));}
 catch{/* No sensitive child text has been stored. */}
}
