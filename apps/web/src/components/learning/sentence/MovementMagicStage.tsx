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
   <rect width="1200" height="670" fill="url(#mm-sky)"/>
   <ellipse className="mm-halo" cx="918" cy="146" rx="246" ry="220" fill="url(#mm-sun)"/>
   <circle cx="945" cy="140" r="45" fill="#fff1cc" opacity=".8"/>
   <g className="mm-clouds" fill="#fff3e4" opacity=".65">
    <path d="M-33 130q54-58 97-9q50-60 102-10q53-23 88 28H-33Z"/>
    <path d="M568 106q50-53 89-12q50-65 107-13q48-22 79 28H568Z"/>
    <path d="M975 222q35-39 73-9q53-41 98-4q29-18 61 17H975Z"/>
   </g>
   <path d="M0 359q119-108 233-28q100-140 222-46q127-98 246 10q142-110 256-21q110-73 243 35V670H0Z" fill="#456f92" opacity=".72"/>
   <path d="M0 422q128-75 224-25q107-83 212-18q143-82 274-14q180-104 307-19q81-54 183 0V670H0Z" fill="#548d8e"/>
   <path d="M0 486q185-89 336-38q138-93 300-35q157-85 291-33q168-61 273 21V670H0Z" fill="url(#mm-hill)"/>
   <path d="M0 544q176-57 310-28q167-69 348-28q180-66 322-20q138-36 220-24V670H0Z" fill="#3b9787"/>
   <path d="M0 590Q140 558 266 591T529 571T790 587T1200 554V670H0Z" fill="#277b79" opacity=".7"/>
   {/* Reflecting pond and cascading stream */}
   <path d="M738 512q114-40 244 1q122 39 218-1v158H655q9-80 83-158Z" fill="url(#mm-water)"/>
   <path d="M736 514q112-38 248 0q98 27 192 1" fill="none" stroke="#b6e8e5" strokeWidth="9" opacity=".75"/>
   <path className="mm-ripple" d="M792 556q92-25 177-1m-178 33q111-30 219-3m-171 28q66-11 125-1" fill="none" stroke="#a5eeff" strokeWidth="6" opacity=".64" strokeLinecap="round"/>
   {/* Mossy paths */}
   <path d="M518 670q-36-70-23-137t-20-64q53-38 103-6q-2 47 24 66q-16 67 22 141Z" fill="#b8a38d" opacity=".8"/>
   <path d="M532 670q-30-72-20-135l-22-60" fill="none" stroke="#e8c9a8" strokeWidth="7" strokeDasharray="18 17" opacity=".8"/>
   {/* Castle tower: windows, masonry, turrets */}
   <g filter="url(#mm-shadow)">
    <path d="M921 463V224l59-55 70 56V463Z" fill="url(#mm-castle)" stroke="#ffe7d2" strokeWidth="7"/>
    <path d="M896 231l86-97 92 97-23 6-70-77-65 78Z" fill="#425b9e" stroke="#c4d3ed" strokeWidth="6"/>
    <path d="M961 156v-41h35v41" fill="#d7a4bf"/><path d="M954 114l25-42 26 42" fill="#51649f" stroke="#ead6c2" strokeWidth="4"/>
    <path d="M921 464V224l59-55 70 56V463Z" fill="url(#mm-bricks)" opacity=".65"/>
    <path d="M956 463v-65q23-36 48 0v65" fill="#53456f" stroke="#ffebc8" strokeWidth="6"/>
    <circle cx="981" cy="283" r="29" fill="#fff4d2" stroke="#866f94" strokeWidth="7"/>
    <path d="M981 266v17l15 8" fill="none" stroke="#7a6383" strokeWidth="4" strokeLinecap="round"/>
    <rect x="939" y="332" width="18" height="38" rx="9" fill="#d8f9fb" opacity=".85"/>
    <rect x="1008" y="332" width="18" height="38" rx="9" fill="#d8f9fb" opacity=".85"/>
    <path d="M1047 467l-8-157 24-36 30 23-3 168Z" fill="#b18eba" stroke="#f5d7d1" strokeWidth="4"/>
    <path d="M1035 299l33-53 37 53" fill="#486da6" stroke="#c4d6d7" strokeWidth="4"/>
   </g>
   {/* Old wishing tree with braided roots and glowing treehouse */}
   <g filter="url(#mm-shadow)">
    <path d="M284 531l-17-143q-21-52-43-72m62 95q34-61 60-87" fill="none" stroke="#745a62" strokeWidth="31" strokeLinecap="round"/>
    <path d="M276 499q-36 26-69 38m75-34q51 35 87 32" stroke="#95746a" strokeWidth="14" fill="none" strokeLinecap="round"/>
    <ellipse cx="255" cy="315" rx="125" ry="109" fill="#2d7978"/>
    <ellipse cx="193" cy="304" rx="86" ry="82" fill="#49a59a"/>
    <ellipse cx="311" cy="289" rx="98" ry="91" fill="#58b89b"/>
    <ellipse cx="274" cy="247" rx="88" ry="77" fill="#75c6a1"/>
    <ellipse cx="228" cy="257" rx="61" ry="65" fill="#8dd3ad" opacity=".62"/>
    <rect x="237" y="333" width="76" height="61" rx="12" fill="#ae779a" stroke="#ffe4b9" strokeWidth="5"/>
    <path d="M230 335l45-42 46 42" fill="#5b5c99" stroke="#ffe6c1" strokeWidth="5"/>
    <circle cx="275" cy="352" r="12" fill="#fff1b6"/>
    <path d="M220 394q-4 43 18 69" fill="none" stroke="#f7dfac" strokeWidth="6" strokeDasharray="8 11"/>
   </g>
   {/* Floating stones + stone bridge */}
   <g filter="url(#mm-shadow)">
    <path d="M437 525q112-106 296-16l-3 46q-161-84-290 20Z" fill="url(#mm-bridge)" stroke="#ffe0c4" strokeWidth="7"/>
    <path d="M468 505q112-82 230-6" fill="none" stroke="#fff1d1" strokeWidth="12" strokeLinecap="round"/>
    <path d="M485 509v46m55-70v51m66-52v48m58-43v47m35-26v44" stroke="#a6748e" strokeWidth="6" opacity=".85"/>
    <path d="M435 531q120-106 297-12" fill="none" stroke="#9d6a8a" strokeWidth="7" opacity=".9"/>
   </g>
   {/* Magic runes on plinths */}
   {[[115,514],[1101,485],[409,476],[795,445]].map(([x,y],i)=>
    <g key={i} className="mm-rune" style={{animationDelay:i*.32+'s'}}>
     <ellipse cx={x} cy={y+20} rx="35" ry="12" fill="#193e60" opacity=".48"/>
     <path d={'M'+(x-29)+' '+y+'l29-15 29 15-29 16Z'} fill="#b7a9ce" stroke="#e2d0f3" strokeWidth="3"/>
     <ellipse cx={x} cy={y-24} rx="35" ry="35" fill="url(#mm-portal)"/>
     <path d={'M'+x+' '+(y-45)+'l16 22-16 23-16-23z'} fill={['#91e9d9','#ffd195','#f2b3ee','#a7d8ff'][i]} stroke="#ffffff" strokeWidth="2"/>
    </g>)}
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
