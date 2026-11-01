'use client';
import React from 'react';
import type {CosmeticId} from '@/lib/rewards/economyEngine';

/** Original offline vector cosmetics shared by passport preview and collection shop. */
export function CosmeticArtwork({id,size=80}:{id:CosmeticId;size?:number}){
  const lines='#10344c',shine='#f5fcfa';
  return <svg viewBox="0 0 128 128" width={size} height={size} aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg" style={{filter:'drop-shadow(0 6px 9px rgba(0,10,32,.3))',maxWidth:'100%'}}>
    <circle cx="64" cy="64" r="59" fill="#5fc9db" fillOpacity=".11" stroke="#dcfff4" strokeOpacity=".28" strokeWidth="2"/>
    <path d="M12 64 A52 52 0 0 1 116 64" fill="none" stroke="#e0ffff" strokeWidth="2" strokeDasharray="3 9" opacity=".65"/>
    {id==='hat_sprout'&&<g stroke={lines} strokeLinejoin="round" strokeLinecap="round">
      <path d="M30 73 Q35 44 64 45 Q94 44 99 73 L93 88 H35Z" fill="#167c78" strokeWidth="4"/>
      <path d="M19 88 Q64 108 109 88 Q65 82 19 88Z" fill="#36bfa1" strokeWidth="4"/>
      <path d="M64 46 V22" stroke="#165a46" strokeWidth="5"/>
      <path d="M63 33 Q40 31 39 12 Q57 11 64 27 Q78 6 96 14 Q93 32 67 33Z" fill="#a5ec83" strokeWidth="3"/>
      <path d="M42 66 Q63 55 87 64" stroke="#a1f6c9" strokeWidth="4" fill="none"/>
    </g>}
    {id==='hat_crown'&&<g stroke={lines} strokeLinejoin="round">
      <path d="M24 44 L43 60 L63 22 L85 59 L106 43 L98 95 H31Z" fill="#eab84b" strokeWidth="5"/>
      <path d="M33 82 H97 V96 H33Z" fill="#f9dd84" strokeWidth="4"/>
      <path d="M24 44 L43 60 L63 22 L85 59 L106 43" fill="none" stroke="#fff1ac" strokeWidth="3"/>
      <path d="M63 56 L74 68 L63 80 L51 68Z" fill="#49c6ce" strokeWidth="3"/>
      <circle cx="43" cy="76" r="5" fill="#f28e9c"/>
      <circle cx="85" cy="76" r="5" fill="#b9acfa"/>
    </g>}
    {id==='hat_wizard'&&<g stroke={lines} strokeLinecap="round" strokeLinejoin="round">
      <path d="M31 87 Q45 58 62 17 Q70 44 81 58 L98 91Z" fill="#4759b2" strokeWidth="5"/>
      <path d="M12 88 Q59 70 116 88 Q66 108 12 88Z" fill="#34478f" strokeWidth="5"/>
      <path d="M48 71 L55 60 L62 70 L73 70 L65 80 L70 91 L57 85 L47 90 L49 78Z" fill="#fff2a0"/>
      <path d="M76 43 L82 38 L86 44 L93 46 L86 51 L83 58 L78 49Z" fill="#a0f7ed"/>
      <path d="M34 87 Q67 73 99 88" fill="none" stroke="#e2d6ff" strokeWidth="5"/>
    </g>}
    {id==='badge_fox'&&<g stroke={lines} strokeLinejoin="round">
      <circle cx="64" cy="68" r="43" fill="#d7eae3" strokeWidth="5"/>
      <path d="M28 73 L29 24 L50 41 Q64 34 79 41 L100 25 L99 73 L78 99 H49Z" fill="#ed8c58" strokeWidth="5"/>
      <path d="M34 72 Q47 66 64 82 Q80 65 94 72 L78 100 H50Z" fill="#fff5e2" strokeWidth="3"/>
      <path d="M45 67 L53 71 M74 71 L82 67" stroke="#183d45" strokeWidth="5" strokeLinecap="round"/>
      <path d="M58 83 L70 83 L64 89Z" fill="#1b4152"/>
      <path d="M35 36 L46 46 L36 57Z M91 36 L81 46 L92 57Z" fill="#f4b6b2"/>
    </g>}
    {id==='badge_moon'&&<g strokeLinejoin="round">
      <circle cx="64" cy="65" r="43" fill="#324d94" stroke="#b4dbf6" strokeWidth="5"/>
      <path d="M83 31 A35 35 0 1 0 97 81 Q58 85 83 31Z" fill="#ffe4a5" stroke="#f6f1cb" strokeWidth="4"/>
      <path d="M36 38 L41 44 L48 45 L41 49 L38 56 L35 48 L29 45Z" fill="#fff3bd"/>
      <circle cx="90" cy="63" r="4" fill="#f2e6ff"/><circle cx="71" cy="91" r="3" fill="#bbf6fd"/>
    </g>}
    {id==='badge_star'&&<g strokeLinejoin="round">
      <circle cx="64" cy="64" r="42" fill="#205879" stroke="#80e7e5" strokeWidth="5"/>
      <path d="M64 20 L75 51 L108 54 L82 74 L91 108 L64 89 L37 108 L46 74 L20 54 L53 51Z"
        fill="#ffe49d" stroke="#fff3c9" strokeWidth="5"/>
      <path d="M64 35 L71 58 L94 60 L76 74 L82 96 L64 82 L46 96 L52 74 L34 60 L57 58Z" fill="#ffb96e"/>
      <path d="M64 43 V78" stroke={shine} strokeWidth="3" strokeLinecap="round" opacity=".55"/>
    </g>}
    {id==='aura_aurora'&&<g strokeLinecap="round">
      <path d="M21 100 Q37 30 55 46 T88 28 Q105 36 105 72" fill="none" stroke="#2ff0c4" strokeWidth="14" opacity=".8"/>
      <path d="M27 107 Q45 35 67 55 T106 35" fill="none" stroke="#92b6ff" strokeWidth="11" opacity=".7"/>
      <path d="M15 91 Q32 26 51 38 T92 21" fill="none" stroke="#c4a7f6" strokeWidth="8" opacity=".65"/>
      <circle cx="66" cy="65" r="24" fill="#d5fbfd" fillOpacity=".2" stroke="#c4feef" strokeWidth="3"/>
      <path d="M64 43 L71 58 L87 64 L71 70 L64 87 L58 70 L43 64 L58 57Z" fill="#e9fdf3"/>
    </g>}
    {id==='aura_rain'&&<g strokeLinecap="round" strokeLinejoin="round">
      {[ [36,36,18],[92,38,15],[63,70,26],[30,94,12],[101,95,12] ].map(([x,y,r],i)=>
        <g key={i}>
          <path d={`M${x} ${y-r} Q${x+r/4} ${y-r/4} ${x+r} ${y} Q${x+r/4} ${y+r/4} ${x} ${y+r}
          Q${x-r/4} ${y+r/4} ${x-r} ${y} Q${x-r/4} ${y-r/4} ${x} ${y-r}Z`}
            fill={i%2===0?'#9ceef2':'#ffe9ad'} stroke="#effff6" strokeWidth="2"/>
          <circle cx={x} cy={y} r={r/7} fill="#fff"/>
        </g>)}
    </g>}
  </svg>;
}
