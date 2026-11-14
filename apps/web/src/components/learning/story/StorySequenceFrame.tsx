
'use client';
import React from 'react';
import {StoryForestActor,StoryForestScenery,type StoryActorMotion} from './StoryForestArt';
import type {ForestScene,ForestActorId} from '@/lib/learning/storyForestEngine';
import type {SequenceFrame,SequenceProp} from '@/lib/learning/storySequenceEngine';

/** Reuses the same isolated, identity-accurate WebP or SVG art as Game 1.
 * Each action has a contextual companion, physical item or motion cue; no
 * illustrated "correct" answer is hidden in the scenery behind the cards.
 */
const itemActors:Partial<Record<SequenceProp,ForestActorId>>={
 apple:'red_apple',balloon:'blue_balloon',star:'yellow_star',leaf:'green_leaf',
 flower:'pink_flower',fish:'fish'
};
function StoryItem({kind}:{kind:SequenceProp}){
 const actor=itemActors[kind];
 if(actor)return <StoryForestActor id={actor}/>;
 if(kind==='book')return <svg viewBox="0 0 120 105" aria-hidden="true">
  <path d="M11 16Q34 5 60 23Q84 5 109 16V88Q80 78 60 100Q34 78 11 88Z"
    fill="#fff1bf" stroke="#8664ad" strokeWidth="7"/>
  <path d="M60 22V100" stroke="#9676bf" strokeWidth="5"/>
  <path d="M24 37L47 46M24 52L46 60M73 44L95 36M73 59L96 51"
    fill="none" stroke="#d1b789" strokeWidth="4" strokeLinecap="round"/></svg>;
 if(kind==='moon')return <img className="ss-premium-prop" alt="" aria-hidden="true"
  src="/assets/story-forest/premium/clues/moon.webp" draggable={false}
  decoding="async" loading="eager"/>;
 if(kind==='bridge'||kind==='home')return <svg viewBox="0 0 120 120" aria-hidden="true">
  {kind==='home'?<><path d="M10 51L61 10L112 51" fill="#f5a19c" stroke="#a76f83" strokeWidth="9"/>
    <rect x="25" y="49" width="74" height="64" rx="7" fill="#ffe5b2" stroke="#b58a80" strokeWidth="7"/>
    <rect x="50" y="69" width="25" height="44" rx="9" fill="#c58b8e"/></>:
   <><path d="M6 94Q60 8 114 94" fill="none" stroke="#a87e7a" strokeWidth="18"/>
    <path d="M6 94Q60 8 114 94" fill="none" stroke="#ffdda5" strokeWidth="10"/>
    <path d="M15 91V110M105 91V110" stroke="#8a6b78" strokeWidth="9"/></>}</svg>;
 return null;
}
export function StorySequenceFrame({frame,scene,characterMotion}:{
 frame:SequenceFrame;scene:ForestScene;characterMotion?:StoryActorMotion
}){
 return <div className={'ss-illustration ss-action-'+frame.action+' ss-placement-'+frame.placement} aria-hidden="true">
  <StoryForestScenery scene={scene}/>
  <div className="ss-frame-glow"/>
  <div className="ss-frame-ground"/>
  <div className="ss-primary-character"><StoryForestActor id={frame.actor} motion={characterMotion}/></div>
  {frame.companion&&<div className="ss-companion">
   <StoryForestActor id={frame.companion} motion={characterMotion==='cheer'?'cheer':characterMotion?'idle':undefined}/>
  </div>}
  {frame.prop!=='none'&&<div className="ss-prop"><StoryItem kind={frame.prop}/></div>}
  <span className="ss-spark ss-spark-a">✦</span><span className="ss-spark ss-spark-b">✧</span>
  {['arrive','move','help','share'].includes(frame.action)&&<div className="ss-motion" aria-hidden="true">✧ ✧ ✧</div>}
 </div>;
}
