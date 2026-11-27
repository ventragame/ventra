'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {soundService} from '@/lib/audio/SoundService';
import {ISLAND_GREETINGS,claimIslandGreeting,type IslandHomeId} from '@/lib/learning/islandHomeModel';

/** The island's English welcome: spoken once per app session after the arrival
 *  animation, and again whenever the child taps 🔊. Uses the central voice
 *  settings (mute, voice volume, microphone capture) through SoundService. */
export function useIslandGreeting(island:IslandHomeId){
 const greeting=ISLAND_GREETINGS[island];
 const [speaking,setSpeaking]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const greet=useCallback(()=>{
  if(timer.current)clearTimeout(timer.current);
  const done=()=>{setSpeaking(false);if(timer.current)clearTimeout(timer.current);};
  const accepted=soundService.speakEnglish(greeting.en,{rate:.88,onEnd:done,onError:done});
  setSpeaking(accepted);
  // A newer voice cancels this one without calling back; never leave the guide "talking".
  if(accepted)timer.current=setTimeout(done,5200);
 },[greeting.en]);
 useEffect(()=>{
  const welcome=claimIslandGreeting(island)?setTimeout(greet,950):null;
  return()=>{
   if(welcome)clearTimeout(welcome);
   if(timer.current)clearTimeout(timer.current);
  };
 },[island,greet]);
 return {greeting,speaking,greet};
}

/** Compact greeting for screens with their own hero (Kelime Bahçesi). */
export function IslandGreetingPill({island,className=''}:{island:IslandHomeId;className?:string}){
 const {greeting,speaking,greet}=useIslandGreeting(island);
 return <button type="button" className={'ih-greeting-pill '+className} data-speaking={speaking}
  onClick={()=>{soundService.unlockAudio();greet();}}
  aria-label={'Karşılamayı İngilizce dinle: '+greeting.en} title={greeting.tr}>
  <span aria-hidden="true">🔊</span><span className="ih-greeting-pill-text" lang="en">{greeting.en}</span>
 </button>;
}
