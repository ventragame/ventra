'use client';
import React from 'react';
import type {MagicActor,MagicChapter,MagicPlace,MagicVerb} from '@/lib/learning/movementMagicEngine';

interface Props{
 chapter:MagicChapter;actor:MagicActor;verb:MagicVerb;color:string;
 place:MagicPlace;selectedPlace:MagicPlace|null;activated:boolean;showTargets:boolean;
 onPlace?:(place:MagicPlace)=>void;disabled:boolean;sentence?:string;
}
const COLORS:Record<string,string>={
 blue:'#6ed0f8',yellow:'#ffda78',orange:'#f7ab73',purple:'#b2a1f9',
 green:'#8edd9c',red:'#f28a9c'
};
const POS:Record<MagicPlace,[number,number]>={
 tree:[333,505],pond:[885,516],bridge:[595,505],tower:[976,415]
};
const HOTSPOTS:[MagicPlace,string,string,number,number][]=[
 ['tree','Ağaç','🌳',27,74],
 ['pond','Gölet','💧',74,80],
 ['bridge','Köprü','🌉',50,76],
 ['tower','Kule','🏰',82,60]
];
export function MovementMagicStage({chapter,actor,verb,color,place,selectedPlace,activated,
 showTargets,onPlace,disabled,sentence}:Props){
 const target=POS[activated?place:selectedPlace??'bridge'];
 const shade=COLORS[color]??'#ffd89a';
 return <div className={'mm-visual mm-chapter-'+chapter+(activated?' mm-active mm-motion-'+verb:'')}
   role="group" aria-label="Etkileşimli büyülü hareket dünyası">
  <svg viewBox="0 0 1200 670" className="mm-scene-svg" xmlns="http://www.w3.org/2000/svg" role="img"
   aria-label="Büyülü ağaç, gölet, köprü ve kalenin olduğu hareket sahnesi; İngilizce komutla hayvan canlanır">
   <defs>
    <linearGradient id="mm-sky" x1="0" y1="0" x2=".7" y2="1">
     <stop stopColor="#122963"/><stop offset=".35" stopColor="#4972a8"/><stop offset=".7" stopColor="#e09cae"/><stop offset="1" stopColor="#ffc8a1"/>
    </linearGradient>
    <radialGradient id="mm-sun"><stop stopColor="#fff7cd"/><stop offset=".22" stopColor="#fff0c8" stopOpacity=".6"/><stop offset="1" stopColor="#fff6df" stopOpacity="0"/></radialGradient>
    <linearGradient id="mm-hill" x1="0" y1="0" x2=".5" y2="1"><stop stopColor="#5ec6a8"/><stop offset="1" stopColor="#236577"/></linearGradient>
    <linearGradient id="mm-water" x1=".1" y1="0" x2=".7" y2="1"><stop stopColor="#7bdde9"/><stop offset=".6" stopColor="#267aa7"/><stop offset="1" stopColor="#1c487f"/></linearGradient>
    <linearGradient id="mm-castle" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff0d7"/><stop offset=".5" stopColor="#d59dca"/><stop offset="1" stopColor="#816ca8"/></linearGradient>
    <linearGradient id="mm-bridge" x1="0" y1="0" x2=".4" y2="1"><stop stopColor="#ffe6b0"/><stop offset=".7" stopColor="#c99093"/><stop offset="1" stopColor="#775974"/></linearGradient>
    <radialGradient id="mm-portal"><stop stopColor="#fff7cb" stopOpacity=".92"/><stop offset=".42" stopColor="#b5ffdc" stopOpacity=".75"/><stop offset="1" stopColor="#8cf0f9" stopOpacity="0"/></radialGradient>
    <filter id="mm-shadow" x="-35%" y="-40%" width="170%" height="190%"><feDropShadow dx="0" dy="12" stdDeviation="11" floodColor="#1a1b49" floodOpacity=".5"/></filter>
    <filter id="mm-blur"><feGaussianBlur stdDeviation="16"/></filter>
    <pattern id="mm-bricks" width="40" height="22" patternUnits="userSpaceOnUse"><path d="M0 0H40M20 0V11M0 11H40M0 11V22M40 11V22" fill="none" stroke="#8a7990" strokeOpacity=".28" strokeWidth="2"/></pattern>
   </defs>
   {/* V6 painting is the stage; location markers remain visible and can be
       selected using the existing accessible HTML hotspots below. */}
   <image href="/assets/sentence-plaza/scenes-v6/scene-4-movement.webp"
    x="0" y="0" width="1200" height="670" preserveAspectRatio="xMidYMid slice"/>
   <g className="mm-v6-stations" aria-hidden="true">
    {HOTSPOTS.map(([id,label,symbol])=>{
      const [x,y]=POS[id];
      return <g key={id} transform={`translate(${x} ${y-50})`}>
       <ellipse cy="27" rx="49" ry="13" fill="#123d48" opacity=".3"/>
       <rect x="-39" y="-70" width="78" height="77" rx="20" fill="#0c4b63" fillOpacity=".84"
        stroke="#ffe6af" strokeWidth="4"/>
       <text y="-25" fontSize="36" textAnchor="middle">{symbol}</text>
       <text y="-10" fontSize="12" fontWeight="900" textAnchor="middle" fill="#fff0d1">{label}</text>
      </g>;
    })}
   </g>
   {/* Playable creature. Original SVG character art, no external fonts or images. */}
   <g transform={'translate('+target[0]+' '+target[1]+')'}>
    <ellipse cx="0" cy="23" rx="78" ry="17" fill="#123f59" opacity=".4"/>
    <g className={'mm-hero mm-hero-'+actor+(activated?' mm-hero-animate':'')} filter="url(#mm-shadow)">
     {actor==='bird'?<g>
       <path d="M-51-19q-62-51-62 13q22 45 80 26" fill="#a0d9ed" stroke="#f5eacb" strokeWidth="5"/>
       <path d="M30-19q54-56 75-8q0 51-64 48" fill="#c2e8ee" stroke="#f5eacb" strokeWidth="5"/>
       <ellipse cy="-15" rx="52" ry="51" fill={shade} stroke="#f8eac9" strokeWidth="6"/>
       <ellipse cx="-17" cy="-25" rx="18" ry="25" fill="#f1faff" opacity=".45"/>
       <circle cx="15" cy="-31" r="8" fill="#203e60"/>
       <circle cx="18" cy="-34" r="2.5" fill="#fff"/>
       <path d="M50-22l40 14-40 13" fill="#f9bd75" stroke="#f6e0ae" strokeWidth="4"/>
       <path d="M-14 26l-3 16m34-16l4 16" stroke="#e6a16c" strokeWidth="7" strokeLinecap="round"/>
       <path d="M-35-61l-15-24 25 15M-17-65l2-24 12 24" fill={shade} stroke="#f1e6c9" strokeWidth="3"/>
      </g>:actor==='rabbit'?<g>
       <ellipse cx="-26" cy="-107" rx="19" ry="64" fill={shade} stroke="#f6dfcf" strokeWidth="5" transform="rotate(-12 -26 -107)"/>
       <ellipse cx="21" cy="-106" rx="19" ry="63" fill={shade} stroke="#f6dfcf" strokeWidth="5" transform="rotate(12 21 -106)"/>
       <ellipse cx="-26" cy="-109" rx="9" ry="46" fill="#eaa1b7" transform="rotate(-12 -26 -109)"/>
       <ellipse cx="21" cy="-110" rx="9" ry="45" fill="#eaa1b7" transform="rotate(12 21 -110)"/>
       <ellipse cx="0" cy="-5" rx="55" ry="48" fill={shade} stroke="#fff0d4" strokeWidth="6"/>
       <circle cx="2" cy="-62" r="46" fill={shade} stroke="#fff0d4" strokeWidth="6"/>
       <ellipse cx="-16" cy="-66" rx="6.5" ry="8" fill="#28435b"/>
       <ellipse cx="18" cy="-66" rx="6.5" ry="8" fill="#28435b"/>
       <ellipse cx="0" cy="-46" rx="7" ry="5" fill="#bf7185"/>
       <path d="M0-43q-8 11-18 7M0-43q8 11 18 7" stroke="#7c6670" strokeWidth="3" fill="none"/>
       <ellipse cx="-39" cy="32" rx="27" ry="12" fill="#f9e2ca"/>
       <ellipse cx="37" cy="32" rx="27" ry="12" fill="#f9e2ca"/>
       <circle cx="55" cy="7" r="18" fill="#fff4e1"/>
      </g>:actor==='dog'?<g>
       <ellipse cx="-5" cy="-5" rx="70" ry="47" fill={shade} stroke="#f8e7cf" strokeWidth="6"/>
       <path d="M-54 10l-17 42m49-15l-3 19M33 27l8 27M57 15l20 40" stroke="#e8ba96" strokeWidth="14" strokeLinecap="round"/>
       <path d="M-70-18q-59-57-60-5" fill="none" stroke={shade} strokeWidth="18" strokeLinecap="round"/>
       <circle cx="40" cy="-46" r="48" fill={shade} stroke="#f8e7cf" strokeWidth="6"/>
       <path d="M6-68q-30-41-35 8l23 23" fill="#a66d84" stroke="#f0decb" strokeWidth="4"/>
       <path d="M66-67q30-40 27 16l-31 14" fill="#a66d84" stroke="#f0decb" strokeWidth="4"/>
       <ellipse cx="55" cy="-34" rx="27" ry="23" fill="#fff0d8"/>
       <circle cx="52" cy="-55" r="6" fill="#2b4157"/>
       <circle cx="75" cy="-35" r="9" fill="#4e4a58"/>
       <path d="M62-23q-8 19-21 8" stroke="#9b5b67" strokeWidth="4" fill="none"/>
      </g>:<g>
       <path d="M-51-7Q-117-26-87-76" fill="none" stroke={shade} strokeWidth="18" strokeLinecap="round"/>
       <ellipse cx="0" cy="-6" rx="65" ry="40" fill={shade} stroke="#f5e5d1" strokeWidth="6"/>
       <path d="M-37-83l-22-44 43 20M15-107l42-20-10 51" fill={shade} stroke="#f5e5d1" strokeWidth="6"/>
       <circle cx="0" cy="-77" r="43" fill={shade} stroke="#f5e5d1" strokeWidth="6"/>
       <path d="M-22-77q8 10 16 0m12 0q9 10 17 0" stroke="#34516a" strokeWidth="5" fill="none" strokeLinecap="round"/>
       <path d="M-4-62l7 4 7-4" stroke="#a96b84" strokeWidth="4" fill="none"/>
       <path d="M-29 15l-6 24M33 14l8 22" stroke="#f9e7cf" strokeWidth="13" strokeLinecap="round"/>
       <path d="M-43-60l-41-7m39 16l-40 10M38-60l43-7m-42 15l43 11" stroke="#fce6d0" strokeWidth="3"/>
      </g>}
    </g>
   </g>
   {/* Visible reward and confetti after semantic sentence evaluation */}
   {activated&&<g className="mm-magic-awaken">
    <ellipse cx={target[0]} cy={target[1]-68} rx="132" ry="127" fill="url(#mm-portal)" opacity=".66"/>
    {Array.from({length:20},(_,i)=>{
     const theta=i*Math.PI*2/20;
     const x=target[0]+Math.cos(theta)*125,y=target[1]-75+Math.sin(theta)*97;
     return <g key={i} className="mm-confetti" style={{animationDelay:i*.056+'s'}}>
      <path d={'M'+x+' '+(y-8)+'v16m-8-8h16'} stroke={i%2?'#fcedac':'#b7faf5'} strokeWidth="5" strokeLinecap="round"/>
     </g>;
    })}
   </g>}
  </svg>
  {showTargets&&<div className="mm-hotspots" aria-label="Oyun dünyasında hedef konumu seç">
   {HOTSPOTS.map(([id,label,symbol,left,top])=><button key={id} type="button" disabled={disabled}
    aria-label={label+' konumuna git'} aria-pressed={selectedPlace===id}
    className="mm-hotspot" data-active={selectedPlace===id} style={{left:left+'%',top:top+'%'}}
    onClick={()=>onPlace?.(id)}><span aria-hidden="true">{symbol}</span><small>{label}</small></button>)}
  </div>}
  <div className="mm-canvas-caption">
   <span className="mm-caption-pulse" aria-hidden="true">✦</span>
   <span>{activated?(sentence??'Hareket büyüsü etkin!'):showTargets?'Haritadaki hedef konumu seç.':'Hareket büyüsü İngilizce cümleni bekliyor.'}</span>
   <span aria-hidden="true">✧ ✦ ✧</span>
  </div>
 </div>;
}
