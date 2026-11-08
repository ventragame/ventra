'use client';
import React from 'react';
import type {PlazaSceneEffect,PlazaActor} from '@/lib/learning/sentencePlazaEngine';
import {SentenceAnimalArtwork,type SentenceAnimalSpecies} from './SentenceAnimalArtwork';
interface Props{
 effect:PlazaSceneEffect|null;
 preview?:PlazaSceneEffect|null;
 previewAtTarget?:boolean;
 awaken:boolean;
 chapter:number;
 onInteract?:()=>void;
 sceneChoices?:readonly {id:string;label:string;icon:string}[];
 selectedChoice?:string|null;
 onSceneChoice?:(id:string)=>void;
 interactionDisabled?:boolean;
}
const COLOR_MAP:Record<string,string>={red:'#fa6f78',blue:'#64d3fa',green:'#75e6a1',yellow:'#ffdb68',purple:'#c6a1fc',orange:'#f9ab65'};
const CHAPTER_ART:readonly string[]=[
 '/assets/sentence-plaza/scenes-v6/scene-1-colors.webp',
 '/assets/sentence-plaza/scenes-v6/scene-1-colors.webp',
 '/assets/sentence-plaza/scenes-v6/scene-2-friends.webp',
 '/assets/sentence-plaza/scenes-v6/scene-3-locations.webp',
 '/assets/sentence-plaza/scenes-v6/scene-4-movement.webp',
 '/assets/sentence-plaza/scenes-v6/scene-5-market.webp',
 '/assets/sentence-plaza/scenes-v6/scene-6-lanterns.webp'
];
const LOCATION_HOTSPOTS:Record<string,{left:string;top:string}>={
 'under the tree':{left:'16%',top:'71%'},
 'behind the house':{left:'63%',top:'43%'},
 'next to the fountain':{left:'44%',top:'70%'},
 'near the tree':{left:'25%',top:'40%'}
};
/** Original scalable art drawn as semantic SVG layers. Meaningful mutations
 * are driven ONLY by a verified constructed sentence, not by correct-choice CSS. */
export function SentencePlazaScene({effect,preview=null,previewAtTarget=false,awaken,chapter,onInteract,
 sceneChoices,selectedChoice,onSceneChoice,interactionDisabled=false}:Props){
 const shown=awaken?effect:preview;
 const color=shown?.color&&COLOR_MAP[shown.color]||'#ffe6a0';
 const showAnimal=Boolean(shown&&['cat','dog','bird','rabbit'].includes(shown.actor));
 const animal=shown?.actor as PlazaActor;
 const motion=awaken&&effect?.action;
 const sceneImage=CHAPTER_ART[chapter]??CHAPTER_ART[1];
 const chapterNames=['','Renk Kristalleri','Dostluk Bahçesi','Gizli Yerler','Hareket Parkuru','Lezzet Pazarı','Fener Festivali'];
 const position=shown?.place??'';
 const actorPlaced=awaken||previewAtTarget;
 const actorBehindHouse=chapter===3&&actorPlaced&&position==='behind the house';
 const actorBase=chapter===3?
   !actorPlaced?'translate(440 383)':
   position.includes('behind')?'translate(577 286)':
   position.includes('under')?'translate(120 375)':
   position.includes('fountain')?'translate(356 389)':'translate(225 353)':
   chapter===2?'translate(560 369)':
   chapter===4?'translate(464 346)':
   chapter===6?'translate(508 364)':'translate(526 348)';
 return <div className={`sp-art sp-v2-art sp-v6-scene ${chapter===3&&onSceneChoice?'sp-v7-location-scene':''} ${awaken?'sp-art-awaken':''} sp-act-${motion||'idle'}`}
   role="group" aria-label={awaken?`${chapterNames[chapter]??'Görev'}: ${shown?.actor??'nesne'} doğru cevapla canlandı`:`${chapterNames[chapter]??'Görev'}: ${shown?.actor??'nesne'} sahnede; İngilizce cümleyi kur` }>
 <img src={sceneImage} className="sp-v2-backdrop sp-v6-backdrop" width={1280} height={680}
  alt="" aria-hidden="true" draggable={false} decoding="async" loading="eager"/>
 <svg viewBox="0 0 900 478" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="sp-world-svg">
  <defs>
   <linearGradient id="sp-sky" x1="0" y1="0" x2="0.18" y2="1"><stop stopColor="#2b4e94"/><stop offset=".42" stopColor="#7b9dc3"/><stop offset="1" stopColor="#f9c49f"/></linearGradient>
   <linearGradient id="sp-ground" x1="0" x2=".9" y1="0" y2="1"><stop stopColor="#87bd93"/><stop offset="1" stopColor="#3b8882"/></linearGradient>
   <linearGradient id="sp-tower" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f6d4ba"/><stop offset=".58" stopColor="#b27a94"/><stop offset="1" stopColor="#805d8e"/></linearGradient>
   <linearGradient id="sp-roof" x1=".2" y1="0" x2=".8" y2="1"><stop stopColor="#67bfe4"/><stop offset="1" stopColor="#385b9d"/></linearGradient>
   <linearGradient id="sp-path" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#eac49e"/><stop offset="1" stopColor="#b48d91"/></linearGradient>
   <radialGradient id="sp-sun"><stop stopColor="#fffcce" stopOpacity=".92"/><stop offset="1" stopColor="#ffefc6" stopOpacity="0"/></radialGradient>
   <filter id="sp-glow"><feGaussianBlur stdDeviation="9"/></filter>
   <filter id="sp-soft"><feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#24365b" floodOpacity=".4"/></filter>
   <pattern id="sp-stones" width="58" height="29" patternUnits="userSpaceOnUse"><path d="M0 0H58 M29 0V15 M0 15H58 M4 15V29 M50 15V29" stroke="#ac8290" strokeOpacity=".25" fill="none" strokeWidth="2"/></pattern>
   <clipPath id="sp-v7-peek-clip"><rect x="-81" y="-134" width="162" height="111"/></clipPath>
  </defs>
  {/* Each chapter has its own optimized WebP scene. Dynamic SVG effects below
      are rendered only after a verified sentence; no fixed plaza geometry remains. */}
  {/* Premium static environment is in the WebP. The following visual mutations
      stay separate and are driven ONLY by a verified full sentence. */}
  {awaken&&effect?.actor==='house'&&<g className="sp-v3-effect-house" transform={chapter===1?'translate(610 210)':'translate(365 205)'}>
    <ellipse cx="90" cy="153" rx="97" ry="17" fill="#244d5a" opacity=".32"/>
    <path d="M18 140V53L90 8l71 45v87Z" fill={color} opacity=".96"
      stroke="#fff7d2" strokeWidth="7" strokeLinejoin="round"/>
    <path d="M3 58L90 0l86 58" stroke="#ffe39c" strokeWidth="15"
      fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="71" y="84" width="39" height="56" rx="9" fill="#f8e9bb"
      stroke="#c99063" strokeWidth="5"/>
    <rect x="29" y="77" width="29" height="30" rx="6" fill="#a4eeff"
      stroke="#fffbe4" strokeWidth="5"/>
    <rect x="122" y="77" width="27" height="30" rx="6" fill="#a4eeff"
      stroke="#fffbe4" strokeWidth="5"/>
    <path d="M14 147L90 155 166 147" stroke="#fff8cf" strokeWidth="6"
      fill="none" strokeLinecap="round"/>
  </g>}
  {awaken&&effect?.actor==='lantern'&&<g className="sp-v3-effect-lanterns">
   {(chapter===6?[{x:330,y:160},{x:710,y:177}]:[{x:145,y:269},{x:757,y:262}]).map(({x,y},i)=><g key={i}>
     <circle cx={x} cy={y} r="51" fill={color} opacity=".55" filter="url(#sp-glow)"/>
     <path d={`M${x-19} ${y-18}h38l-5 40h-28Z`} fill={color}
       stroke="#fff7d4" strokeWidth="5" strokeLinejoin="round"/>
     <path d={`M${x-9} ${y-22}q9-20 18 0`} fill="none"
       stroke="#ffe3ac" strokeWidth="5" strokeLinecap="round"/>
     <path d={`M${x-2} ${y-32}v-9 M${x-43} ${y-3}h-11 M${x+43} ${y-3}h11`}
       stroke="#fff0a9" strokeWidth="5" strokeLinecap="round"/>
   </g>)}
  </g>}
  {/* A real, colored object is visible during the picture-reading question. */}
  {shown&&!awaken&&chapter===1&&<g className="sp-v7-color-preview" transform="translate(460 306)">
   {shown.actor==='balloon'?<>
     <path d="M0 75Q14 33 0 2" stroke="#fff4dc" strokeWidth="3" fill="none"/>
     <ellipse cy="-43" rx="37" ry="48" fill={color} stroke="#fff1d5" strokeWidth="5"/>
    </>:shown.actor==='flower'?<>
     <path d="M0 70v-75" stroke="#1c7758" strokeWidth="8"/>
     {Array.from({length:6},(_,i)=><ellipse key={i} cx="0" cy="-35" rx="14" ry="28"
       transform={`rotate(${60*i} 0 -24)`} fill={color} stroke="#fff0d5" strokeWidth="2"/>)}
     <circle cy="-24" r="14" fill="#f8e8ab"/>
    </>:shown.actor==='house'?<>
     <path d="M-65 69v-79L0-59l65 49v79Z" fill={color} stroke="#fff1ca" strokeWidth="6"/>
     <path d="M-75-10L0-73 75-10" fill="none" stroke="#ffde9d" strokeWidth="12"/>
     <rect x="-13" y="18" width="26" height="51" rx="7" fill="#f6ead5"/>
    </>:<>
     <path d="M-30-58h60l-9 113h-42Z" fill={color} stroke="#ffefd3" strokeWidth="5"/>
     <path d="M-12-63q12-29 24 0" fill="none" stroke="#ffefd3" strokeWidth="5"/>
    </>}
  </g>}
  {/* Real response to color / scene language */}
  {awaken&&effect?.actor==='flower'&&<g className="sp-effect-bloom">
   {Array.from({length:5},(_,i)=><g key={i} transform={`translate(${490+i*26},${351+(i%2)*13})`}>
    <path d="M0 0v-30" stroke="#236759" strokeWidth="4"/>
    {[0,1,2,3,4].map(p=><ellipse key={p} transform={`rotate(${p*72} 0 -34)`} cx="0" cy="-44" ry="10" rx="7" fill={color}/>)}
    <circle cx="0" cy="-35" r="7" fill="#fff1b1"/>
   </g>)}
  </g>}
  {awaken&&effect?.actor==='balloon'&&<g className="sp-effect-float"><path d="M738 310q6-66 0-113" fill="none" stroke="#e8deeb" strokeWidth="2"/><ellipse cx="738" cy="188" rx="34" ry="45" fill={color} stroke="#fff5d9" strokeWidth="5"/></g>}
  {/* Actor shows up or reacts only when the built English has been checked. */}
  {/* Species-specific original vectors: floppy-eared dog, whiskered cat,
      beaked bird, tall-eared rabbit. Colors stay tied to the question data. */}
  {showAnimal&&Array.from({length:Math.max(1,Math.min(3,shown?.count??1))},(_,index)=>
   <g key={index}
      className={`sp-actor sp-actor-${animal} sp-actor-${motion||'idle'} sp-v8-actor`}
      data-species={animal}
      clipPath={actorBehindHouse?'url(#sp-v7-peek-clip)':undefined}
      transform={actorBase+' translate('+((shown?.count??1)>1?index*116-58:0)+',0)'}>
      <SentenceAnimalArtwork actor={animal as SentenceAnimalSpecies}
       color={shown?.color} index={index}/>
   </g>)}
  {awaken&&effect?.actor==='apple'&&<g className="sp-effect-bloom" transform="translate(722 383)">
    <ellipse rx="73" ry="22" fill="#e4bd8d" stroke="#fff0c7" strokeWidth="4"/>
    {effect?.action==='remove'?
     <g><path d="M-23-23L23 23M23-23L-23 23" stroke="#ffd0b3" strokeWidth="8" strokeLinecap="round"/>
      <circle cx="0" cy="0" r="30" fill="none" stroke="#ffd0b3" strokeWidth="5"/></g>
    :Array.from({length:5},(_,i)=>{
     const fruit=effect.food??'apples',x=(i-2)*22,y=i%2?-6:-16;
     const isOrange=fruit==='oranges'||fruit==='peaches',isBanana=fruit==='bananas';
     const isCarrot=fruit==='carrots',isGrape=fruit==='grapes',isStrawberry=fruit==='strawberries';
     const fill=isOrange?fruit==='peaches'?'#f6ad72':'#eea24c':isCarrot?'#f39c45':isGrape?'#a08add':
       isStrawberry?'#ef7680':fruit==='pears'?'#a7c875':isBanana?'#f6d977':'#ee727a';
     return <g key={i} transform={`translate(${x} ${y})`}>
       {isCarrot?<path d="M-9 -12Q-15 8 0 22Q15 8 9 -12Z" fill={fill} stroke="#fff4c1" strokeWidth="2"/>:
        isBanana?<path d="M-14-11Q-7 19 14-7Q8 8-5 3Z" fill={fill} stroke="#fff4c1" strokeWidth="2"/>:
        isGrape?<g fill={fill}><circle cx="-7" cy="-8" r="9"/><circle cx="7" cy="-8" r="9"/><circle cy="2" r="10"/></g>:
        <ellipse rx={isStrawberry?12:14} ry={isStrawberry?17:13} fill={fill} stroke="#fff4c1" strokeWidth="2"/>}
       <path d="M0-14l3-7" stroke="#5e8060" strokeWidth="3"/>
     </g>;
    })}</g>}
 </svg>
 {chapter===3&&sceneChoices?.length&&onSceneChoice&&<div className="sp-v6-hotspots"
  role="group" aria-label="Haritadaki yerleri seç">
  {sceneChoices.map(choice=>{
   const point=LOCATION_HOTSPOTS[choice.id];
   if(!point)return null;
   return <button key={choice.id} type="button"
     className="sp-v6-hotspot" data-selected={selectedChoice===choice.id}
     style={{left:point.left,top:point.top}}
     aria-label={`Sahnede ${choice.label} konumunu seç`}
     aria-pressed={selectedChoice===choice.id}
     title={choice.label}
     disabled={interactionDisabled||selectedChoice!==null}
     onClick={()=>onSceneChoice(choice.id)}>
      <span aria-hidden="true">{choice.icon}</span>
      <span className="sp-v6-hotspot-tooltip">{choice.label}</span>
    </button>;
  })}
 </div>}
 <div className="sp-scene-caption">
  <span className="sp-scene-glyph" aria-hidden="true">✦</span>
  <span>{awaken?'✨ Sahne canlandı!':'🔎 Sahneyi keşfet'}</span>
  {onInteract&&<button type="button" onClick={onInteract} className="sp-scene-speak" aria-label="İngilizce cümleyi tekrar dinle">🔊 Dinle</button>}
 </div>
 </div>;
}
