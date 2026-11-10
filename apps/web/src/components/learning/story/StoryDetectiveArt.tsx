'use client';
import React from 'react';
import {StoryForestActor,StoryForestScenery} from './StoryForestArt';
import type {DetectiveClueId,DetectiveItemId} from '@/lib/learning/storyDetectiveEngine';

/** Each object has its own visual identity. Never reuse another animal or prop
 * just because the shapes look similar. These figures are independent of the
 * painted WebP forest backdrops and remain touchable at phone sizes.
 */
/** Render scene-matched 3D WebP props, not old flat vector icons. */
const PREMIUM_CLUE_ROOT='/assets/story-forest/premium/clues/';
const PREMIUM_CLUE_ASSETS:Readonly<Partial<Record<DetectiveClueId,string>>> = {
 tent:'tent.webp',moon:'moon.webp',lantern:'lantern.webp'
};
export function DetectiveClueArt({id}:{id:DetectiveClueId}){
 const premium=PREMIUM_CLUE_ASSETS[id];
 if(premium)return <img className="sd-illustration sd-premium-clue"
  src={PREMIUM_CLUE_ROOT+premium} alt="" aria-hidden="true"
  draggable={false} loading="eager" decoding="async"/>;
 if(id==='flower')return <StoryForestActor id="pink_flower"/>;
 if(id==='butterfly')return <StoryForestActor id="butterfly"/>;
 if(id==='fish')return <StoryForestActor id="fish"/>;
 if(id==='leaf')return <StoryForestActor id="green_leaf"/>;
 if(id==='star')return <StoryForestActor id="yellow_star"/>;
 if(id==='bridge')return <div className="sd-clue-scene"><StoryForestScenery scene="bridge"/></div>;
 return <svg className="sd-illustration" viewBox="0 0 140 140"
   aria-hidden="true" focusable="false">
  <ellipse cx="70" cy="124" rx="46" ry="9" fill="#274f5d" opacity=".14"/>
  {id==='mushroom'&&<>
   <path d="M56 75L54 115Q69 126 84 115L83 75Z"
      fill="#fbe8c0" stroke="#bd9369" strokeWidth="5"/>
   <path d="M22 76Q27 26 70 22Q113 26 118 76Q111 95 70 88Q29 94 22 76Z"
      fill="#e65554" stroke="#b54b59" strokeWidth="6"/>
   <ellipse cx="52" cy="56" rx="10" ry="8" fill="#fff5e5"/>
   <circle cx="83" cy="44" r="11" fill="#fff5e5"/>
   <ellipse cx="95" cy="68" rx="7" ry="5" fill="#fff5e5"/>
  </>}
  {id==='lily'&&<>
   <ellipse cx="70" cy="100" rx="53" ry="24" fill="#6fbda2" stroke="#347e80" strokeWidth="5"/>
   <path d="M69 100L104 80L91 114Z" fill="#b3edbd"/>
   {[-28,-12,8,28].map((angle,i)=>
    <ellipse key={i} cx="70" cy="75" rx="12" ry="30"
     transform={'rotate('+angle+' 70 89)'} fill={i%2?'#f9bad0':'#fff2ed'}
     stroke="#d58dba" strokeWidth="3"/>)}
   <circle cx="70" cy="91" r="8" fill="#ffd269"/>
  </>}
  {id==='water'&&<>
   <path d="M70 18Q39 64 35 88A35 35 0 0 0 105 88Q104 65 70 18Z"
    fill="#70d5ee" stroke="#258dbe" strokeWidth="7"/>
   <path d="M50 87Q48 68 62 53" fill="none" stroke="#ddfaff"
    strokeWidth="8" strokeLinecap="round"/>
   <ellipse cx="84" cy="100" rx="9" ry="5" fill="#c7faff"/>
  </>}
  {id==='book'&&<>
   <path d="M16 35Q43 22 70 39Q98 22 124 35V110Q92 98 70 117Q42 98 16 110Z"
     fill="#fff3cb" stroke="#b48a73" strokeWidth="7"/>
   <path d="M70 40V118" stroke="#bc9c8b" strokeWidth="5"/>
   <path d="M28 53L54 57M27 70L55 75M85 59L112 54M85 76L112 72"
     fill="none" stroke="#d0b7a0" strokeWidth="4" strokeLinecap="round"/>
   <path d="M112 29V67L102 59L92 67V30" fill="#eb887c"/>
  </>}
  {id==='window'&&<>
   <rect x="26" y="23" width="88" height="100" rx="24" fill="#b87858"
    stroke="#8f5f52" strokeWidth="6"/>
   <rect x="38" y="34" width="64" height="76" rx="17" fill="#9fe6e8"
    stroke="#fff0c0" strokeWidth="7"/>
   <path d="M70 38V107M42 73H99" stroke="#fff9d8" strokeWidth="8"/>
   <path d="M47 52Q60 43 65 50M75 50Q83 42 94 47" stroke="#fff" strokeWidth="4" opacity=".85"/>
  </>}
  {id==='acorn'&&<>
   <path d="M36 61Q34 100 70 119Q104 101 104 61Z"
    fill="#c78551" stroke="#975937" strokeWidth="6"/>
   <path d="M26 63Q27 25 70 30Q113 25 114 63Q74 85 26 63Z"
    fill="#9f6747" stroke="#714d43" strokeWidth="6"/>
   <path d="M68 33Q67 19 78 15" fill="none" stroke="#82553e"
    strokeWidth="8" strokeLinecap="round"/>
   <path d="M36 47L46 52L55 44L65 52L75 44L85 52L96 45"
    fill="none" stroke="#ddb17c" strokeWidth="5"/>
  </>}
  {id==='footprints'&&<g fill="#9e715d">
   <ellipse cx="44" cy="89" rx="19" ry="27" transform="rotate(-22 44 89)"/>
   <circle cx="25" cy="54" r="8"/><circle cx="39" cy="45" r="8"/><circle cx="54" cy="51" r="7"/>
   <ellipse cx="98" cy="55" rx="19" ry="27" transform="rotate(23 98 55)"/>
   <circle cx="76" cy="22" r="7"/><circle cx="92" cy="16" r="8"/><circle cx="108" cy="22" r="8"/>
  </g>}
  {id==='stone'&&<>
   <path d="M18 108L34 56L77 39L114 64L124 105Q72 126 18 108Z"
    fill="#a2b8b6" stroke="#748f96" strokeWidth="7"/>
   <path d="M34 56L62 82L114 64M62 82L58 116" fill="none"
    stroke="#ccdfd5" strokeWidth="6"/>
  </>}
  {id==='river'&&<>
   <path d="M25 19Q84 35 45 63Q4 91 96 125" fill="none"
    stroke="#4fbbd9" strokeWidth="35" strokeLinecap="round"/>
   <path d="M25 19Q84 35 45 63Q4 91 96 125" fill="none"
    stroke="#beeef8" strokeWidth="7" strokeLinecap="round" strokeDasharray="10 17"/>
  </>}
 </svg>;
}
export function DetectiveLostItem({id}:{id:DetectiveItemId}){
 if(id==='apple')return <StoryForestActor id="red_apple"/>;
 if(id==='balloon')return <StoryForestActor id="blue_balloon"/>;
 if(id==='star')return <StoryForestActor id="yellow_star"/>;
 if(id==='flower')return <StoryForestActor id="pink_flower"/>;
 return <DetectiveClueArt id="book"/>;
}
