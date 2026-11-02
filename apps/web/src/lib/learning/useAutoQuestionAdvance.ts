'use client';
import {useEffect,useRef} from 'react';

export interface AutoAdvanceOptions {
 /** True only after the answer's evidence has been appended to component state. */
 ready:boolean;
 /** Save, error, or chapter completion blocks all automatic transitions. */
 blocked:boolean;
 onAdvance:()=>void;
 /** Visual confirmation delay before the next question (milliseconds). */
 delayMs?:number;
 /** Wait for correct-answer English pronunciation when actively speaking. */
 speaking?:boolean;
 /** Speech can stall on some mobile browsers; never wait indefinitely. */
 maxSpeechWaitMs?:number;
}
/**
 * One-shot, visibility-aware question transition. No background timer survives
 * an unmount, mission switch, save error, or user navigation. Does NOT auto-
 * advance between chapters: those require a deliberate reward-screen action.
 */
export function useAutoQuestionAdvance({
 ready,blocked,onAdvance,delayMs=1200,speaking=false,maxSpeechWaitMs=3600
}:AutoAdvanceOptions):void {
 const latest=useRef(onAdvance);
 const isSpeaking=useRef(speaking);
 latest.current=onAdvance;
 isSpeaking.current=speaking;
 useEffect(()=>{
  if(!ready||blocked||typeof window==='undefined')return;
  let timer:number|undefined;
  let started=Date.now();
  let advanced=false;
  const cancel=()=>{
   if(timer!==undefined){window.clearTimeout(timer);timer=undefined;}
  };
  const tick=()=>{
   timer=undefined;
   if(document.hidden||advanced)return;
   if(isSpeaking.current && Date.now()-started<maxSpeechWaitMs){
    timer=window.setTimeout(tick,120);
    return;
   }
   advanced=true;
   latest.current();
  };
  const schedule=()=>{
   cancel();
   if(document.hidden)return;
   started=Date.now();
   timer=window.setTimeout(tick,Math.max(850,delayMs));
  };
  const visibility=()=>{if(document.hidden)cancel();else if(!advanced)schedule();};
  document.addEventListener('visibilitychange',visibility);
  schedule();
  return()=>{cancel();document.removeEventListener('visibilitychange',visibility);};
 },[ready,blocked,delayMs,maxSpeechWaitMs]);
}
