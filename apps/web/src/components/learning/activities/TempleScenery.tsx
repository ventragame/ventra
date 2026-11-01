'use client';
import React from 'react';
import {TEMPLE_CHAMBERS,type TempleChamber} from '@/lib/learning/templeEngine.ts';
/** Offline SVG architecture: five distinct enchanted chambers, all game art drawn by code. */
export function TempleScenery({chamber,cleared=0}:{chamber:TempleChamber;cleared?:number}){
 const index=TEMPLE_CHAMBERS.findIndex(c=>c.id===chamber);
 const palettes=[
  ['#b3e5c0','#4d987b','#d6b988'],
  ['#a6dff1','#486aa2','#b8bfde'],
  ['#f3d6a2','#a87867','#d9b18a'],
  ['#efc3e4','#9a7298','#bdb6a1'],
  ['#f8e4af','#8560a2','#e2c793']
 ];
 const [sky,stone,gold]=palettes[index];
 const active=Math.min(5,cleared);
 return <svg className="tp-scene-svg" viewBox="0 0 1160 350" preserveAspectRatio="xMidYMid slice"
   role="img" aria-label={TEMPLE_CHAMBERS[index].title+' büyülü tapınak sahnesi'}>
  <defs>
   <linearGradient id="tp-sky" x2="0" y2="1"><stop stopColor={sky}/><stop offset="1" stopColor="#e4e0cb"/></linearGradient>
   <linearGradient id="tp-pillar" x2="1" y2="1"><stop stopColor={stone}/><stop offset=".5" stopColor="#f5e5cf"/><stop offset="1" stopColor={stone}/></linearGradient>
   <radialGradient id="tp-glow"><stop stopColor="#fff9c9"/><stop offset="1" stopColor={sky} stopOpacity="0"/></radialGradient>
  </defs>
  <rect width="1160" height="350" fill="url(#tp-sky)"/>
  <path d="M0 178 Q145 128 350 188 T760 156 T1160 174 V350 H0Z" fill={stone} opacity=".2"/>
  <path d="M0 244 Q280 180 580 258 Q870 198 1160 242 V350 H0Z" fill={stone} opacity=".32"/>
  <ellipse cx="580" cy="125" rx="310" ry="165" fill="url(#tp-glow)" opacity=".9"/>
  <path d="M0 332 L580 220 L1160 332 V350 H0Z" fill={gold} opacity=".65"/>
  <path d="M148 287 L252 119 L908 119 L1012 287Z" fill="#534d73" opacity=".15"/>
  {[195,365,795,965].map((x,i)=><g key={i}>
   <rect x={x-28} y="112" width="56" height="168" rx="8" fill="url(#tp-pillar)" stroke="#f8ebd4" strokeWidth="5"/>
   <rect x={x-37} y="99" width="74" height="19" rx="4" fill={gold} stroke="#f8ebd4" strokeWidth="4"/>
   <rect x={x-37} y="272" width="74" height="22" rx="5" fill={gold} stroke="#f9f1df" strokeWidth="4"/>
   <path d={`M${x-19} 138 V253 M${x+19} 138 V253`} stroke="#fff8e8" strokeWidth="4" opacity=".65"/>
   <circle cx={x} cy="172" r="13" fill={i<active?'#fff6a6':'#57717b'} stroke={i<active?'#fff7ca':'#e1e8db'} strokeWidth="4"/>
   <path d={`M${x} 144 l11 19 -11 18 -11 -18Z`} fill="#f8eed2" opacity=".75"/>
  </g>)}
  <path d="M383 285 V112 Q580 -38 777 112 V285Z" fill="#3b536e" stroke={gold} strokeWidth="15"/>
  <path d="M409 282 V128 Q580 6 751 128 V282Z" fill="#24384e" stroke="#f8f1db" strokeWidth="5"/>
  {[0,1,2,3,4].map((i)=><g key={i}>
   <path d={`M${453+i*63} 264 l-13 -35 13 -16 13 16Z`}
     fill={i<active?'#fff5b5':stone} stroke="#f7dcb9" strokeWidth="3"/>
   <circle cx={453+i*63} cy="208" r="4" fill="#fff6d8"/>
  </g>)}
  <path d="M548 273 V190 L580 160 L612 190 V273" fill={index===4?'#eecf79':'#759bb4'}
   stroke="#f8e6c8" strokeWidth="6"/>
  <path d="M580 166 L580 272" stroke="#fcf5d9" strokeWidth="5"/>
  <circle cx="581" cy="194" r="11" fill="#f8edb6"/>
  {index===0&&[66,113,1045,1095].map((x,i)=><g key={i}>
   <path d={`M${x} 288 v-100`} stroke="#5d866c" strokeWidth="9"/>
   <circle cx={x} cy="180" r="36" fill="#7cbd87" stroke="#d8f3b2" strokeWidth="4"/>
   <circle cx={x-17} cy="166" r="8" fill="#eaf9ce" opacity=".8"/>
  </g>)}
  {index===1&&[95,300,840,1060].map((x,i)=><g key={i}>
   <path d={`M${x} ${195+(i%2)*26} l23 24 -23 38 -23 -38Z`} fill="#b6eafb"
    stroke="#fff8e7" strokeWidth="5"/>
   <circle cx={x} cy={226+(i%2)*26} r="5" fill="#fff"/>
  </g>)}
  {index===2&&[90,290,870,1080].map((x,i)=><g key={i}>
   <rect x={x-38} y="239" width="76" height="35" rx="9" fill="#9b7767"/>
   <circle cx={x-15} cy="239" r="18" fill="#eecb88"/>
   <circle cx={x+17} cy="239" r="18" fill="#ecb08d"/>
  </g>)}
  {index===3&&[83,1080].map((x,i)=><g key={i}>
    <rect x={x-34} y="215" width="68" height="68" rx="7" fill="#f5d5c5"/>
    <path d={`M${x-35} 218 L${x} 181 L${x+35} 218Z`} fill="#c28b9c" stroke="#fff0e3" strokeWidth="5"/>
    <rect x={x-11} y="240" width="22" height="43" rx="5" fill="#876b7b"/>
  </g>)}
  {index===4&&<g>
   <circle cx="580" cy="65" r="35" fill="#ffeda3" stroke="#fff8d6" strokeWidth="8"/>
   <path d="M558 64 l9 -23 13 15 13 -15 9 23 v18 h-44Z" fill="#e9ba68" stroke="#fff4d5" strokeWidth="4"/>
   {[420,740].map((x,i)=><path key={i} d={`M${x} 96 l17 18 -17 21 -17 -21Z`} fill="#ffefae" opacity=".9"/>)}
  </g>}
  <path d="M0 298 Q290 286 580 304 Q870 288 1160 298" stroke="#fff0d3" strokeWidth="6" opacity=".5" fill="none"/>
  {Array.from({length:18},(_,i)=>{
   const x=31+i*63,y=58+(i%4)*42;
   return <circle key={i} cx={x} cy={y} r={i%3===0?4:2.5} fill="#fff8cc" opacity=".8"/>;
  })}
  <rect x="450" y="13" width="260" height="47" rx="16" fill="#fff6d9" stroke="#c4a382" strokeWidth="5"/>
  <text x="580" y="44" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="23" fill="#75536a">ENGLISH TEMPLE</text>
 </svg>;
}
