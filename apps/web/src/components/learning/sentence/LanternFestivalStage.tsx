'use client';
import React from 'react';
import {LANTERN_COLORS,LANTERN_PLACES,LANTERN_ANIMALS,
 type LanternAnimal,type LanternChapter,type LanternColor,type LanternPlace}
 from '@/lib/learning/lanternFestivalEngine';

export interface LanternSceneProps{
 chapter:LanternChapter;color:LanternColor|null;place:LanternPlace|null;
 animal:LanternAnimal|null;lit:boolean;lights:number;showPlaces:boolean;
 onPlace?:(place:LanternPlace)=>void;disabled?:boolean;caption?:string;
}
const PINS:{id:LanternPlace;x:number;y:number}[]=[
 {id:'tree',x:26,y:76},{id:'bridge',x:49,y:75},
 {id:'tower',x:79,y:62},{id:'fountain',x:64,y:86}
];
const HEX:Record<LanternColor,string>=Object.fromEntries(LANTERN_COLORS.map(c=>[c.id,c.hex])) as Record<LanternColor,string>;
export function LanternFestivalStage({chapter,color,place,animal,lit,lights,showPlaces,
 onPlace,disabled,caption}:LanternSceneProps){
 const theme=color?HEX[color]:'#ffdfaa';
 const offset=place?PINS.find(p=>p.id===place):null;
 const selectedAnimal=LANTERN_ANIMALS.find(a=>a.id===animal);
 return <div className={'lf-world lf-chapter-'+chapter+(lit?' lf-awaken':'')}
  role="group" aria-label="Etkileşimli büyülü fener festivali, ışık köprüsü, kule, fener ağacı ve çeşme">
  <svg viewBox="0 0 1200 660" className="lf-scene" role="img"
   aria-label="Gece gökyüzündeki fenerler, ay ışıklı köprü, yıldız kulesi, ağaç ve çeşme"
   xmlns="http://www.w3.org/2000/svg">
   <defs>
    <linearGradient id="lf-night" x1="0" y1="0" x2="0.4" y2="1">
     <stop stopColor="#13183f"/><stop offset=".48" stopColor="#3d407e"/>
     <stop offset="1" stopColor="#a780a8"/>
    </linearGradient>
    <radialGradient id="lf-moon"><stop stopColor="#fff8d8"/>
     <stop offset=".27" stopColor="#ffe5c4" stopOpacity=".82"/>
     <stop offset="1" stopColor="#f7a0db" stopOpacity="0"/></radialGradient>
    <linearGradient id="lf-ground" x1="0" y1="0" x2=".7" y2="1">
     <stop stopColor="#477d8c"/><stop offset="1" stopColor="#213e68"/></linearGradient>
    <linearGradient id="lf-water" x1="0" y1="0" x2=".7" y2="1">
     <stop stopColor="#b2d8db"/><stop offset=".36" stopColor="#4b89ad"/><stop offset="1" stopColor="#243b78"/>
    </linearGradient>
    <linearGradient id="lf-gold" x1="0" y1="0" x2="1" y2="1">
     <stop stopColor="#ffefb9"/><stop offset=".45" stopColor="#bfa5ba"/><stop offset="1" stopColor="#747ea6"/>
    </linearGradient>
    <radialGradient id="lf-selected-glow">
     <stop stopColor={theme} stopOpacity=".92"/><stop offset=".37" stopColor={theme} stopOpacity=".44"/>
     <stop offset="1" stopColor={theme} stopOpacity="0"/>
    </radialGradient>
    <filter id="lf-shadow"><feDropShadow dx="0" dy="8" stdDeviation="8"
     floodColor="#0d153a" floodOpacity=".56"/></filter>
    <pattern id="lf-brick" width="45" height="23" patternUnits="userSpaceOnUse">
     <path d="M0 0H45M22 0V12M0 12H45M0 12V23M45 12V23" stroke="#786994" strokeWidth="2" opacity=".28" fill="none"/>
    </pattern>
   </defs>
   {/* The V6 illustrated festival is the world backdrop. These four map
       landmarks are still represented and targetable by the existing PIN controls. */}
   <image href="/assets/sentence-plaza/scenes-v6/scene-6-lanterns.webp"
    x="0" y="0" width="1200" height="660" preserveAspectRatio="xMidYMid slice"/>
   <g className="lf-v6-landmarks" aria-hidden="true">
    {PINS.map(({id,x,y})=>{
     const item=LANTERN_PLACES.find(p=>p.id===id)!;
     const px=x*12,py=y*6.6;
     return <g key={id} transform={`translate(${px} ${py-53})`}>
       <ellipse cy="31" rx="51" ry="14" fill="#052d40" opacity=".35"/>
       <rect x="-46" y="-66" width="92" height="79" rx="22" fill="#0c3c64"
        fillOpacity=".88" stroke="#ffe6ae" strokeWidth="4"/>
       <text y="-22" textAnchor="middle" fontSize="35">{item.icon}</text>
       <text y="-6" textAnchor="middle" fontSize="13" fill="#fff0c7"
        fontWeight="900">{item.label}</text>
     </g>;
    })}
   </g>
   {/* selectable lantern glowing above chosen location */}
   {color&&<g className={'lf-primary-lantern'+(lit?' lf-lantern-raised':'')}
    transform={'translate('+((offset?.x??51)*12)+' '+((offset?.y??71)*6.6-205)+')'}>
    <ellipse cy="5" rx="160" ry="150" fill="url(#lf-selected-glow)" opacity={lit?1:.64}/>
    <path d="M0-62v-36" stroke="#ffebd1" strokeWidth="6" strokeLinecap="round"/>
    <path d="M-43-41q6-28 43-28q38 0 44 28v81q-37 34-88 0Z"
     fill={theme} stroke="#fff2d3" strokeWidth="6" filter="url(#lf-shadow)"/>
    <path d="M-39-37h78M-41 32h82M0-60v92" fill="none" stroke="#ffeccf" strokeWidth="4" opacity=".84"/>
    <ellipse cx="-14" cy="-22" rx="11" ry="17" fill="#ffffff" opacity=".39"/>
    <path d="M-20 44l20 19 20-19" fill="none" stroke="#f9e8c7" strokeWidth="5"/>
   </g>}
   {/* festival progression, real completed rounds light the night sky */}
   {Array.from({length:Math.min(20,lights)},(_,i)=>{
    const x=90+(i*239)%1040,y=142+(i*107)%180;
    return <g key={i} className="lf-floating" style={{animationDelay:i*.17+'s'}}
     transform={'translate('+x+' '+y+')'}>
     <ellipse rx="48" ry="63" fill="#fff7c3" opacity=".13"/>
     <path d="M-17-23q12-16 35 0v37q-15 16-35 0Z"
      fill={['#ffe5aa','#ffadbb','#a9d6ef','#b9e7d2'][i%4]}
      stroke="#fff5d8" strokeWidth="3"/>
     <path d="M-17-12h35M0-29v47" stroke="#b991a7" opacity=".8" strokeWidth="2"/>
    </g>;
   })}
   {/* creature silhouette as final transfer validation, not another text card */}
   {animal&&<g className={'lf-character'+(lit?' lf-creature-animate lf-creature-'+animal:'')}
    transform="translate(628 467)">
    {animal==='bird'?<g>
     <path d="M-36 0Q-102-55-80 22L-17 29M38 0Q99-61 83 20L16 32"
      fill="#b8d7ea" stroke="#f3e7d8" strokeWidth="5"/>
     <ellipse rx="49" ry="44" fill={theme} stroke="#fff4db" strokeWidth="5"/>
     <circle cx="17" cy="-11" r="7" fill="#29435d"/>
     <path d="M45-4l30 12-30 12" fill="#f4c48c" stroke="#f9e6cb" strokeWidth="3"/>
    </g>:animal==='rabbit'?<g>
     <ellipse cx="-23" cy="-78" rx="16" ry="54" fill={theme} stroke="#fff0d7" strokeWidth="5"/>
     <ellipse cx="20" cy="-78" rx="16" ry="54" fill={theme} stroke="#fff0d7" strokeWidth="5"/>
     <ellipse cx="0" cy="-8" rx="50" ry="40" fill={theme} stroke="#fff0d7" strokeWidth="5"/>
     <circle cy="-38" r="43" fill={theme} stroke="#fff0d7" strokeWidth="5"/>
     <circle cx="-13" cy="-41" r="6" fill="#30445c"/><circle cx="15" cy="-41" r="6" fill="#30445c"/>
     <path d="M-5-24q6 8 12 0" stroke="#a56881" strokeWidth="4" fill="none"/>
    </g>:animal==='dog'?<g>
     <ellipse cx="-9" cy="11" rx="62" ry="37" fill={theme} stroke="#fbead5" strokeWidth="6"/>
     <circle cx="36" cy="-26" r="43" fill={theme} stroke="#fbead5" strokeWidth="5"/>
     <path d="M5-53q-23-38-34 0m84-6q25-34 38 4" stroke="#c28c92" strokeWidth="17" strokeLinecap="round"/>
     <circle cx="45" cy="-33" r="7" fill="#35465b"/><circle cx="71" cy="-16" r="9" fill="#83616f"/>
     <path d="M-50 35v30m43-24v24m32-23v25" stroke="#e8b6a8" strokeWidth="11" strokeLinecap="round"/>
    </g>:<g>
     <ellipse cx="-10" cy="6" rx="65" ry="32" fill={theme} stroke="#fbebd6" strokeWidth="6"/>
     <path d="M-38-43l-15-47 44 26 18-2 40-26-7 50Z" fill={theme} stroke="#fbebd6" strokeWidth="5"/>
     <circle cx="3" cy="-37" r="38" fill={theme} stroke="#fbebd6" strokeWidth="5"/>
     <path d="M-15-37q7 7 14 0m12 0q7 7 14 0" stroke="#354866" strokeWidth="5" fill="none"/>
     <path d="M0-19q7 9 14 0" stroke="#a96d81" strokeWidth="4" fill="none"/>
     <path d="M-65 12Q-115-34-87-54" fill="none" stroke={theme} strokeWidth="13" strokeLinecap="round"/>
    </g>}
   </g>}
   {lit&&<g className="lf-lightburst">
    {Array.from({length:24},(_,i)=>{
     const angle=i*Math.PI/12,x=600+Math.cos(angle)*365,y=307+Math.sin(angle)*215;
     return <path key={i} d={'M'+(x-9)+' '+y+'h18M'+x+' '+(y-9)+'v18'}
      stroke={i%2?'#ffe9a5':'#b1ffdf'} strokeWidth="5" strokeLinecap="round"
      className="lf-spark" style={{animationDelay:i*.038+'s'}}/>;
    })}
   </g>}
  </svg>
  {showPlaces&&<div className="lf-hotspots" role="group" aria-label="Festival sahnesinde fener konumu seç">
   {PINS.map(pin=>{
    const p=LANTERN_PLACES.find(l=>l.id===pin.id)!;
    return <button key={p.id} type="button" className="lf-hotspot"
     disabled={disabled} data-selected={place===p.id} aria-pressed={place===p.id}
     onClick={()=>onPlace?.(p.id)} style={{left:pin.x+'%',top:pin.y+'%'}}>
     <span aria-hidden="true">{p.icon}</span><small>{p.label}</small></button>;
   })}
  </div>}
  <div className="lf-scene-footer"><span aria-hidden="true">✦</span>
   <strong>{lit?(caption??'Doğru İngilizce, büyülü feneri yaktı!'):
    chapter===4?'Finalde karakteri, rengi ve konumu birleştir.':
     chapter===2?'Sahnedeki doğru yeri seç.':'Fenerler senin İngilizceni bekliyor.'}</strong>
   <span className="lf-night-counter" aria-label={lights+' fener yakıldı'}>🏮 {lights}</span>
  </div>
 </div>;
}
