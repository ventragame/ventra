'use client';

import React,{useEffect,useRef,useState} from 'react';
import type {AnimationItem} from 'lottie-web';
import './learning-motion.css';

type MotionVariant='success'|'victory';
interface Props{
 variant:MotionVariant;
 /** Stable game-event identity. Null stops the effect without affecting play. */
 trigger:string|null;
 className?:string;
}

/**
 * Original on-device Lottie vectors; no LottieFiles API or external CDN.
 * One decorative player per interactive stage, never one per answer card.
 * Only downloads the player and animation when a real game event requests one.
 */
export function LearningMotion({variant,trigger,className=''}:Props){
 const container=useRef<HTMLSpanElement|null>(null);
 const player=useRef<AnimationItem|null>(null);
 const latestTrigger=useRef(trigger);
 latestTrigger.current=trigger;
 const [reduced,setReduced]=useState(false);
 const [visible,setVisible]=useState(false);
 const [failed,setFailed]=useState(false);
 const enabled=Boolean(trigger)&&!reduced;

 useEffect(()=>{
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync=()=>setReduced(mq.matches);
  sync();
  mq.addEventListener('change',sync);
  return()=>mq.removeEventListener('change',sync);
 },[]);

 useEffect(()=>{
  if(!enabled)return;
  let active=true;
  let started=false;
  let detachVisibility:()=>void=()=>{};
  setFailed(false);

  void import('lottie-web').then(mod=>{
   if(!active||!container.current)return;
   let animation:AnimationItem;
   try{
    animation=mod.default.loadAnimation({
     container:container.current,
     renderer:'svg',
     loop:false,
     autoplay:false,
     path:'/assets/motion/'+variant+'.json',
     rendererSettings:{preserveAspectRatio:'xMidYMid meet'}
    });
   }catch(error){
    console.error('[LearningMotion] Could not create animation',error);
    if(active){setFailed(true);setVisible(false);}
    return;
   }
   player.current=animation;
   const start=()=>{
    if(!active||!latestTrigger.current||document.hidden||started)return;
    started=true;
    setVisible(true);
    animation.goToAndPlay(0,true);
   };
   const completed=()=>{if(active)setVisible(false);};
   const errored=()=>{
    if(active){setFailed(true);setVisible(false);animation.stop();}
   };
   const onVisibility=()=>{
    if(document.hidden){
     animation.pause();
     setVisible(false);
    }else if(latestTrigger.current){
     if(!started)start();
     else if(animation.isPaused){
      setVisible(true);
      animation.play();
     }
    }
   };
   animation.addEventListener('DOMLoaded',start);
   animation.addEventListener('complete',completed);
   animation.addEventListener('data_failed',errored);
   animation.addEventListener('error',errored);
   document.addEventListener('visibilitychange',onVisibility);
   detachVisibility=()=>document.removeEventListener('visibilitychange',onVisibility);
   if(animation.isLoaded)start();
  }).catch(error=>{
   console.error('[LearningMotion] Player import unavailable',error);
   if(active){setFailed(true);setVisible(false);}
  });

  return()=>{
   active=false;
   detachVisibility();
   player.current?.destroy();
   player.current=null;
  };
 },[enabled,variant]);

 // Repeat a correctly answered challenge while the same stage stays mounted.
 useEffect(()=>{
  const animation=player.current;
  if(!enabled){
   animation?.stop();
   setVisible(false);
  }else if(animation?.isLoaded&&!document.hidden){
   setFailed(false);
   setVisible(true);
   animation.goToAndPlay(0,true);
  }
 },[trigger,enabled]);

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
