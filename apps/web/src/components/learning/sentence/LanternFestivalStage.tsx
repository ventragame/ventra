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
   <rect width="1200" height="660" fill="url(#lf-night)"/>
   <ellipse cx="914" cy="136" rx="228" ry="214" fill="url(#lf-moon)" opacity=".88"/>
   <circle cx="921" cy="122" r="56" fill="#fff5dc" opacity=".86"/>
   <circle cx="895" cy="102" r="50" fill="#fffbed" opacity=".27"/>
   {Array.from({length:62},(_,i)=>{
    const x=(i*149+31)%1200,y=25+(i*83)%305,size=i%7===0?4:2;
    return <g key={i} className="lf-star" style={{animationDelay:(i%9)*.37+'s'}}>
     <circle cx={x} cy={y} r={size} fill="#ffebd0" opacity=".7"/>
     {i%9===0&&<path d={'M'+(x-10)+' '+y+'h20M'+x+' '+(y-10)+'v20'}
      stroke="#fff8e1" strokeWidth="2.3" opacity=".6"/>}
    </g>;
   })}
   <path d="M0 400q136-101 268-38q121-117 240-45q130-108 276-30q189-112 416 12V660H0Z"
    fill="#4f5b84" opacity=".72"/>
   <path d="M0 447q140-78 277-28q141-91 299-40q164-87 293-43q185-69 331-10V660H0Z"
    fill="#5d7395"/>
   <path d="M0 509q192-87 359-34q175-55 282-29q190-88 368-37q112-29 191-18V660H0Z"
    fill="url(#lf-ground)"/>
   <path d="M0 563q201-43 346 3q170-40 349-10q173-60 302-20q133-27 203-15V660H0Z"
    fill="#2b6679" opacity=".87"/>
   {/* moonlit river winding beneath the bridge */}
   <path d="M420 567q115-54 235-9q115 27 224-14l160-19q-122 82-18 135H316q89-52 104-93Z"
    fill="url(#lf-water)"/>
   <path d="M407 576q116-51 243-9q105 23 229-15" fill="none" stroke="#c3e5da" strokeWidth="7" opacity=".77"/>
   <g className="lf-water-sparkle" stroke="#cde6f3" strokeWidth="5" strokeLinecap="round" opacity=".6">
    <path d="M433 607h110m73-17h109m-219 35h76m180 0h116"/>
   </g>
   {/* luminous forest lantern tree */}
   <g filter="url(#lf-shadow)">
    <path d="M294 535l-13-147q-35-40-75-64m83 95q54-55 86-73"
     fill="none" stroke="#715c75" strokeWidth="29" strokeLinecap="round"/>
    <path d="M281 496q-39 27-68 37m71-30q33 30 81 29"
     fill="none" stroke="#99807d" strokeWidth="12" strokeLinecap="round"/>
    <ellipse cx="264" cy="328" rx="143" ry="107" fill="#2e7c80"/>
    <ellipse cx="211" cy="317" rx="103" ry="92" fill="#3d9b97"/>
    <ellipse cx="323" cy="301" rx="101" ry="100" fill="#66b9a5"/>
    <ellipse cx="256" cy="258" rx="93" ry="73" fill="#7dcbb0"/>
    <ellipse cx="201" cy="273" rx="58" ry="61" fill="#a2e1ba" opacity=".54"/>
    <path d="M231 385q15-57 54-8l32-8" stroke="#dfb8bc" strokeWidth="5" fill="none"/>
    {[[-64,24],[-5,-39],[79,12],[-83,-32],[41,52]].map(([x,y],i)=>
     <g key={i} transform={'translate('+(265+x)+' '+(317+y)+')'} className="lf-tree-light"
      style={{animationDelay:i*.34+'s'}}>
      <ellipse rx="22" ry="30" fill="#ffe6a4" opacity=".25"/>
      <rect x="-10" y="-18" width="20" height="31" rx="6" fill={['#ffb3ad','#fff0b9','#b7d7fc'][i%3]} stroke="#ffe5bd" strokeWidth="3"/>
      <path d="M-10-10h20M0-18v31" stroke="#a67d8b" strokeWidth="2"/>
      </g>)}
   </g>
   {/* bridge and far-side arch */}
   <g filter="url(#lf-shadow)">
    <path d="M417 542q103-112 250-9l-6 53q-120-81-242 11Z"
     fill="#d7b4ae" stroke="#fbe6d0" strokeWidth="7"/>
    <path d="M441 544q113-83 201-2" fill="none" stroke="#fff5dc" strokeWidth="12"/>
    <path d="M459 539v50m60-67v46m60-47v46m55-29v40"
     stroke="#a77d98" strokeWidth="7"/>
    <path d="M415 540q132-104 251-10" fill="none" stroke="#916f8e" strokeWidth="6"/>
    <path d="M450 519v-38m179 33v-40" stroke="#f9e3c5" strokeWidth="9"/>
    <circle cx="450" cy="479" r="17" fill="#ffeda9"/><circle cx="629" cy="473" r="17" fill="#ffeda9"/>
   </g>
   {/* star observatory tower */}
   <g filter="url(#lf-shadow)">
    <path d="M863 488V244l90-70 92 70v244Z" fill="url(#lf-gold)" stroke="#fbe5d4" strokeWidth="7"/>
    <path d="M860 488V244l90-70 92 70v244Z" fill="url(#lf-brick)" opacity=".56"/>
    <path d="M842 249l109-113 110 113-21 11-91-92-85 94Z"
     fill="#4d5790" stroke="#f7e4d8" strokeWidth="6"/>
    <path d="M936 146v-45h31v45" fill="#f1cfb5"/>
    <path d="M931 105l20-42 20 42" fill="#8382b5" stroke="#fff1d1" strokeWidth="4"/>
    <circle cx="954" cy="305" r="36" fill="#fff4ce" stroke="#877f9e" strokeWidth="7"/>
    <path d="M936 306l12 13 25-29" stroke="#7388a0" strokeWidth="6" fill="none" strokeLinecap="round"/>
    <path d="M912 486v-74q41-54 83 0v74" fill="#555e83" stroke="#f7dfbf" strokeWidth="6"/>
    <rect x="887" y="355" width="17" height="38" rx="9" fill="#c1f7fa"/>
    <rect x="1005" y="355" width="17" height="38" rx="9" fill="#c1f7fa"/>
    <path d="M1038 480l-10-153 31-39 32 39-6 153Z" fill="#a69ab9" stroke="#f9dfca" strokeWidth="5"/>
    <path d="M1019 338l38-61 47 61" fill="#5665a2" stroke="#f9e8d1" strokeWidth="5"/>
   </g>
   {/* fountain; water that re-awakens */}
   <g transform="translate(765 554)" filter="url(#lf-shadow)">
    <ellipse cy="43" rx="104" ry="27" fill="#b5a4b8" stroke="#f7e2d0" strokeWidth="7"/>
    <path d="M-71 30Q-56 72 0 68Q56 72 71 30Z" fill="#588ba9" stroke="#eedbcd" strokeWidth="6"/>
    <ellipse cy="24" rx="79" ry="19" fill="#96d9e0" stroke="#f5e2d6" strokeWidth="5"/>
    <path d="M-4 12v-52" stroke="#dfc5c7" strokeWidth="14" strokeLinecap="round"/>
    <path d="M-5-36q-67 10-46 53M0-38q61 0 44 53" fill="none" stroke="#c8ecf5"
     strokeWidth="6" opacity=".75"/>
    <path d="M0-65l20 23-20 19-20-19Z" fill="#fff3c2" stroke="#d9b2c4" strokeWidth="4"/>
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
