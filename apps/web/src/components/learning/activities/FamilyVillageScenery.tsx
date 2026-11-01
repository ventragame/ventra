'use client';
import React from 'react';
import type {VillageDistrict} from '@/lib/learning/familyVillageEngine';

export function FamilyVillageScenery({district}:{district:VillageDistrict}){
 const palette={
  family:['#f9dbbd','#eeaa9a','#f6c6a6'],
  rooms:['#f8e8c7','#bddeca','#acd6ed'],
  objects:['#eed8f0','#acc9df','#eeb7a4'],
  routines:['#cddcf7','#fbd59f','#c4d3a2']
 }[district];
 return <svg className="fv-landscape" viewBox="0 0 1000 350" preserveAspectRatio="xMidYMid slice"
   role="img" aria-label="Renkli Aile Köyü masal evleri ve bahçesi">
  <defs>
   <linearGradient id="fv-sky" x2="0" y2="1"><stop stopColor={palette[0]}/><stop offset="1" stopColor="#edf8d3"/></linearGradient>
   <linearGradient id="fv-wall" x2="0" y2="1"><stop stopColor={palette[1]}/><stop offset="1" stopColor={palette[2]}/></linearGradient>
  </defs>
  <rect width="1000" height="350" fill="url(#fv-sky)"/>
  <circle cx={district==='routines'?790:825} cy="65" r="41" fill="#fff6bc"/>
  {[135,282,742,910].map((x,i)=><g key={i} opacity=".9">
   <path d={`M${x-60} 277 V${183-i*8} Q${x} ${132-i*8} ${x+60} ${183-i*8} V277Z`} fill="#8ecf9e"/>
   <rect x={x-8} y={197-i*8} width="16" height="90" fill="#aa795c"/>
   {[-40,-10,20,45].map((offset,j)=><circle key={j} cx={x+offset} cy={172-i*8+(j%2)*14}
    r={j%2?27:22} fill={['#6bbf92','#80d0a3','#5dab9b'][j%3]}/>)}
  </g>)}
  <path d="M0 287 Q250 266 480 294 Q700 255 1000 287 V350 H0Z" fill="#a5d5ad"/>
  <path d="M0 329 Q480 298 1000 329 V350 H0Z" fill="#eecda9"/>
  <path d="M305 155 L500 33 L696 155" fill="#b76375" stroke="#f3f2d1" strokeWidth="17" strokeLinejoin="round"/>
  <rect x="329" y="139" width="343" height="150" rx="10" fill="url(#fv-wall)" stroke="#ffeacb" strokeWidth="8"/>
  <path d="M455 288 V202 Q499 158 542 202 V288Z" fill="#795b73" stroke="#fff1e2" strokeWidth="8"/>
  <circle cx="529" cy="244" r="6" fill="#ffe2a0"/>
  {[370,582].map((x,i)=><g key={i}>
   <rect x={x} y="170" width="56" height="61" rx="9" fill="#bde8e9" stroke="#f9ebcc" strokeWidth="7"/>
   <path d={`M${x+28} 172 V229 M${x} 199 H${x+56}`} stroke="#f9ebcc" strokeWidth="5"/>
   <path d={`M${x-8} 233 Q${x+28} 248 ${x+64} 233`} stroke="#b36e6a" strokeWidth="9" fill="none"/>
  </g>)}
  <rect x="453" y="109" width="94" height="30" rx="8" fill="#fef7df" stroke="#e5bcb2" strokeWidth="4"/>
  <text x="500" y="129" fontSize="15" fill="#8b5963" fontWeight="900" textAnchor="middle">MY HOME</text>
  {district==='rooms'&&<g>
   <path d="M356 250 H643" stroke="#fff2d9" strokeWidth="5"/>
   <path d="M430 153 V251 M563 153 V251" stroke="#fff2d9" strokeWidth="5"/>
   <rect x="367" y="209" width="54" height="20" rx="7" fill="#8bbac3"/>
   <rect x="463" y="201" width="55" height="27" rx="7" fill="#b5899c"/>
   <rect x="577" y="203" width="45" height="24" rx="7" fill="#dfce93"/>
  </g>}
  {district==='objects'&&<g>
   <rect x="376" y="252" width="67" height="21" rx="9" fill="#71a6a9"/>
   <rect x="551" y="251" width="50" height="22" rx="8" fill="#d69e6f"/>
   <path d="M600 245 V216 M590 215 H610" stroke="#fff0ae" strokeWidth="8" strokeLinecap="round"/>
  </g>}
  {district==='family'&&[400,430,564,594].map((x,i)=><g key={i}>
   <circle cx={x} cy={274-(i%2)*8} r={i%2?11:15} fill={i%2?'#805f63':'#b38169'}/>
   <path d={`M${x-15} 308 Q${x-18} 282 ${x} 285 Q${x+18} 282 ${x+15} 308Z`}
    fill={['#77bfa4','#ba82b7','#8eb6d5','#e6b676'][i]}/>
  </g>)}
  {district==='routines'&&<g>
   <path d="M280 305 Q350 265 400 302" stroke="#f6e5a4" strokeWidth="10" fill="none"/>
   <path d="M600 301 Q665 260 724 295" stroke="#f6e5a4" strokeWidth="10" fill="none"/>
  </g>}
  {[40,95,205,270,735,790,865,955].map((x,i)=><g key={i}>
   <path d={`M${x} 310 v18`} stroke="#5fa77c" strokeWidth="3"/>
   <circle cx={x} cy="308" r="7" fill={i%2?'#f7a6ab':'#f3dd90'}/>
   <circle cx={x} cy="308" r="3" fill="#fff9d5"/>
  </g>)}
 </svg>;
}
