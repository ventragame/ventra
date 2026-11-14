'use client';

import {useEffect,useRef,useState} from 'react';
import type {AnimationItem} from 'lottie-web';
import './character-guide.css';

/** Seven emotional and instructional states, animated with original Lottie layers. */
export type CharacterMood='idle'|'listen'|'point'|'hint'|'happy'|'celebrate'|'try_again';
export type CharacterId='village-fox'|'meadow-owl';

export const CHARACTER_SEGMENTS:Readonly<Record<CharacterMood,readonly [number,number]>>={
 idle:[0,72],listen:[72,126],point:[126,180],hint:[180,234],
 happy:[234,288],celebrate:[288,360],try_again:[360,420]
};
const LOOPING_MOODS:ReadonlySet<CharacterMood>=new Set(['idle','listen']);
const SRC_ROOT='/assets/characters/';

interface CharacterGuideProps{
 character:CharacterId;
 mood:CharacterMood;
 /** A new correct answer or discovery replays its current state. */
 cueKey?:string|number;
 className?:string;
}

/**
 * Genuine articulated Lottie character player. A single local JSON asset per
 * character has independent facial, wing/arm, ear and tail animations.
 *
 * - Loads lottie-web on demand, no remote animation service.
 * - Plays the relevant state timeline rather than swapping full WebP sprites.
 * - Shows an illustration-matched, static SVG on reduced-motion or load failure.
 * - Decorative only: all learning prompts / answers stay accessible native HTML.
 */
export function CharacterGuide({character,mood,cueKey,className=''}:CharacterGuideProps){
 const hostRef=useRef<HTMLSpanElement|null>(null);
 const instanceRef=useRef<AnimationItem|null>(null);
 const latestRef=useRef({mood,cueKey});
 latestRef.current={mood,cueKey};
 const [reduced,setReduced]=useState(false);
 const [ready,setReady]=useState(false);
 const [failed,setFailed]=useState(false);

 useEffect(()=>{
  const query=window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync=()=>setReduced(query.matches);
  sync();
  if(typeof query.addEventListener==='function')query.addEventListener('change',sync);
  else query.addListener(sync);
  return()=>{
   if(typeof query.removeEventListener==='function')query.removeEventListener('change',sync);
   else query.removeListener(sync);
  };
 },[]);

 useEffect(()=>{
  if(reduced)return;
  let active=true;
  let cleanupVisibility=()=>{};
  let animation:AnimationItem|null=null;

  const playState=()=>{
   if(!active||document.hidden||!animation?.isLoaded)return;
   const [from,to]=CHARACTER_SEGMENTS[latestRef.current.mood];
   animation.setLoop(LOOPING_MOODS.has(latestRef.current.mood));
   animation.playSegments([from,to],true);
  };
  void import('lottie-web').then(module=>{
   if(!active||!hostRef.current)return;
   try{
    animation=module.default.loadAnimation({
     container:hostRef.current,
     renderer:'svg',autoplay:false,loop:false,
     path:SRC_ROOT+character+'.json',
     rendererSettings:{preserveAspectRatio:'xMidYMid meet'}
    });
    instanceRef.current=animation;
    const onLoaded=()=>{
     if(!active)return;
     setReady(true);
     playState();
    };
    const onFailed=()=>{if(active){setFailed(true);setReady(false);animation?.stop();}};
    const onVisibility=()=>{
     if(!active||!animation?.isLoaded)return;
     if(document.hidden)animation.pause();
     else animation.play();
    };
    animation.addEventListener('DOMLoaded',onLoaded);
    animation.addEventListener('data_failed',onFailed);
    animation.addEventListener('error',onFailed);
    document.addEventListener('visibilitychange',onVisibility);
    cleanupVisibility=()=>document.removeEventListener('visibilitychange',onVisibility);
    if(animation.isLoaded)onLoaded();
   }catch(err){
    console.error('[Ventra Character] Unable to load local character',err);
    if(active)setFailed(true);
   }
  }).catch(err=>{
   console.error('[Ventra Character] Player load failed',err);
   if(active)setFailed(true);
  });
  return()=>{
   active=false;cleanupVisibility();
   animation?.destroy();
   instanceRef.current=null;
  };
 },[character,reduced]);

 useEffect(()=>{
  const animation=instanceRef.current;
  if(reduced||!animation?.isLoaded||document.hidden)return;
  const [from,to]=CHARACTER_SEGMENTS[mood];
  animation.setLoop(LOOPING_MOODS.has(mood));
  animation.playSegments([from,to],true);
 },[mood,cueKey,reduced]);

 const showStatic=reduced||failed||!ready;
 return <span className={'ventra-character '+className} aria-hidden="true"
  data-character={character} data-mood={mood}>
  <img src={SRC_ROOT+character+'.svg'} alt="" draggable={false}
   className="ventra-character-fallback"
   style={{opacity:showStatic?1:0}}/>
  <span ref={hostRef} className="ventra-character-player"
   style={{opacity:showStatic?0:1}}/>
 </span>;
}
