'use client';

import React,{useEffect,useRef,useState} from 'react';
import type {AnimationItem} from 'lottie-web';
import './learning-motion.css';

type MotionVariant='success'|'victory';
interface Props{
 variant:MotionVariant;
 /** Unique game-state event; null immediately hides and stops the animation. */
 trigger:string|null;
 className?:string;
}

/**
 * Self-hosted Lottie JSON player. One instance per stage, never per answer card.
 * It is decorative only, so the game's accessibility feedback remains textual.
 *
 * The player code is split into an on-demand JS chunk, assets are local, and
 * any failures have a lightweight static fallback. No CDN dependency.
 */
export function LearningMotion({variant,trigger,className=''}:Props){
 const container=useRef<HTMLSpanElement|null>(null);
 const player=useRef<AnimationItem|null>(null);
 const latestTrigger=useRef(trigger);
 latestTrigger.current=trigger;
 const [reduced,setReduced]=useState(false);
 const [visible,setVisible]=useState(false);
 const [failed,setFailed]=useState(false);

 useEffect(()=>{
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync=()=>setReduced(mq.matches);
  sync();
  mq.addEventListener('change',sync);
  return()=>mq.removeEventListener('change',sync);
 },[]);

 useEffect(()=>{
  let active=true;
  if(reduced)return;
  setFailed(false);
  void import('lottie-web').then(mod=>{
   if(!active||!container.current)return;
   const lottie=mod.default;
   const animation=lottie.loadAnimation({
    container:container.current,
    renderer:'svg',
    loop:false,
    autoplay:false,
    path:'/assets/motion/'+variant+'.json',
    rendererSettings:{preserveAspectRatio:'xMidYMid meet'}
   });
   player.current=animation;
   const start=()=>{
    if(!active||!latestTrigger.current)return;
    setVisible(true);
    animation.goToAndPlay(0,true);
   };
   const completed=()=>{if(active)setVisible(false);};
   const errored=()=>{if(active){setFailed(true);setVisible(false);}};
   animation.addEventListener('DOMLoaded',start);
   animation.addEventListener('complete',completed);
   animation.addEventListener('data_failed',errored);
   animation.addEventListener('error',errored);
   if(animation.isLoaded)start();
  }).catch(()=>{
   if(active){setFailed(true);setVisible(false);}
  });
  return()=>{
   active=false;
   player.current?.destroy();
   player.current=null;
  };
 },[variant,reduced]);

 useEffect(()=>{
  const animation=player.current;
  if(reduced){
   setVisible(false);
   return;
  }
  if(!trigger){
   animation?.stop();
   setVisible(false);
  }else if(animation?.isLoaded){
   setVisible(true);
   animation.goToAndPlay(0,true);
  }
 },[trigger,variant,reduced]);

 const showFallback=Boolean(trigger)&&(reduced||failed);
 return <span
  className={'learning-motion '+className}
  aria-hidden="true"
  data-motion-variant={variant}
  data-motion-state={trigger?'active':'idle'}
  style={{opacity:visible||showFallback?1:0,pointerEvents:'none'}}>
  <span className="learning-motion-canvas" ref={container}/>
  {showFallback&&<span className="learning-motion-fallback">✦</span>}
 </span>;
}
