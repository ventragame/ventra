'use client';

import {useEffect,useRef,useState} from 'react';
import type {AnimationItem} from 'lottie-web';
import './harbor-captain-avatar.css';

/** Kaptan Leo is the speaking character in the original harbor scenes. */
export type HarborCaptainMood='idle'|'listen'|'talk'|'happy'|'try_again'|'celebrate';
export const HARBOR_CAPTAIN_SEGMENTS:Readonly<Record<HarborCaptainMood,readonly [number,number]>>={
 idle:[0,90],listen:[90,150],talk:[150,240],
 happy:[240,294],try_again:[294,348],celebrate:[348,432]
};
const LOOPING=new Set<HarborCaptainMood>(['idle','listen','talk']);
const BASE='/assets/characters/harbor-captain-leo';

interface Props {
 mood:HarborCaptainMood;
 cue?:string|number;
 className?:string;
}

/** Original segmented Lottie puppet, not a floating static WebP.
 * Every view owns at most one Lottie instance. The self-hosted matching SVG
 * is shown while loading, when reduced-motion is requested, or upon failure.
 * This visual component has no access to child recordings or transcripts.
 */
export function HarborCaptainAvatar({mood,cue,className=''}:Props){
 const host=useRef<HTMLSpanElement|null>(null);
 const player=useRef<AnimationItem|null>(null);
 const desired=useRef(mood);
 desired.current=mood;
 const [reduced,setReduced]=useState(false);
 const [ready,setReady]=useState(false);
 const [failed,setFailed]=useState(false);

 useEffect(()=>{
  const query=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>setReduced(query.matches);
  update();
  if(typeof query.addEventListener==='function')query.addEventListener('change',update);
  else query.addListener(update);
  return()=>{
   if(typeof query.removeEventListener==='function')query.removeEventListener('change',update);
   else query.removeListener(update);
  };
 },[]);

 useEffect(()=>{
  setReady(false);setFailed(false);
  if(reduced)return;
  let active=true;
  let animation:AnimationItem|null=null;
  let detach=()=>{};
  const playMood=()=>{
   if(!active||!animation?.isLoaded||document.hidden)return;
   const state=desired.current;
   animation.setLoop(LOOPING.has(state));
   animation.playSegments([...HARBOR_CAPTAIN_SEGMENTS[state]],true);
  };
  void import('lottie-web').then(module=>{
   if(!active||!host.current)return;
   try{
    animation=module.default.loadAnimation({
     container:host.current,renderer:'svg',loop:false,autoplay:false,
     path:BASE+'.json',rendererSettings:{preserveAspectRatio:'xMidYMid meet'}
    });
    player.current=animation;
    const onLoaded=()=>{if(active){setReady(true);playMood();}};
    const onError=()=>{if(active){setFailed(true);setReady(false);animation?.stop();}};
    const onVisibility=()=>{
     if(!active||!animation)return;
     if(document.hidden)animation.pause();
     else playMood();
    };
    animation.addEventListener('DOMLoaded',onLoaded);
    animation.addEventListener('data_failed',onError);
    animation.addEventListener('error',onError);
    document.addEventListener('visibilitychange',onVisibility);
    detach=()=>document.removeEventListener('visibilitychange',onVisibility);
    if(animation.isLoaded)onLoaded();
   }catch(error){
    console.error('[HarborCaptain] Failed to initialize local animation',error);
    if(active)setFailed(true);
   }
  }).catch(error=>{
   console.error('[HarborCaptain] Local animation unavailable',error);
   if(active)setFailed(true);
  });
  return()=>{active=false;detach();animation?.destroy();player.current=null;};
 },[reduced]);

 useEffect(()=>{
  const animation=player.current;
  if(reduced||!animation?.isLoaded||document.hidden)return;
  animation.setLoop(LOOPING.has(mood));
  animation.playSegments([...HARBOR_CAPTAIN_SEGMENTS[mood]],true);
 },[mood,cue,reduced]);

 const showStatic=reduced||failed||!ready;
 return <span className={'harbor-captain-avatar '+className}
  aria-hidden="true" data-mood={mood} data-ready={ready&&!failed}>
   <img src={BASE+'.svg'} alt="" draggable={false} className="harbor-captain-avatar-static"
    style={{opacity:showStatic?1:0}}/>
   <span ref={host} className="harbor-captain-avatar-motion"
    style={{opacity:showStatic?0:1}}/>
  </span>;
}
