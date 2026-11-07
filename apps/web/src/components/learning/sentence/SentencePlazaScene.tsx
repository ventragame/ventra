'use client';
import React from 'react';
import type {PlazaSceneEffect,PlazaActor} from '@/lib/learning/sentencePlazaEngine';
interface Props{
 effect:PlazaSceneEffect|null;
 awaken:boolean;
 chapter:number;
 onInteract?:()=>void;
}
const COLOR_MAP:Record<string,string>={red:'#fa6f78',blue:'#64d3fa',green:'#75e6a1',yellow:'#ffdb68',purple:'#c6a1fc',orange:'#f9ab65'};
/** Original scalable art drawn as semantic SVG layers. Meaningful mutations
 * are driven ONLY by a verified constructed sentence, not by correct-choice CSS. */
export function SentencePlazaScene({effect,awaken,chapter,onInteract}:Props){
 const color=effect?.color&&COLOR_MAP[effect.color]||'#ffe6a0';
 const showAnimal=awaken&&effect&&['cat','dog','bird','rabbit'].includes(effect.actor);
 const animal=effect?.actor as PlazaActor;
 const houseTint=awaken&&effect?.actor==='house'?color:'#de96c6';
 const glow=awaken&&effect?.action==='glow';
 const motion=awaken&&effect?.action;
 return <div className={`sp-art sp-v2-art ${awaken?'sp-art-awaken':''} sp-act-${motion||'idle'}`}
   role="img" aria-label={awaken?`İngilizce cümlen gerçek oldu: ${effect?.actor} sahnede değişti`:'Büyülü meydanda uyandırılmayı bekleyen nesneler ve karakterler'}>
 <img src="/assets/sentence-plaza/v3/plaza-world.webp" className="sp-v2-backdrop"
  alt="" aria-hidden="true" draggable={false} decoding="async"/>
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
  </defs>
  <g className="sp-static-scenery" aria-hidden="true">
  <rect width="900" height="478" fill="url(#sp-sky)"/>
  <ellipse cx="702" cy="75" rx="174" ry="126" fill="url(#sp-sun)"/>
  <g opacity=".34" fill="#eaf5ff"><path d="M-24 116q34-44 69-8q39-52 83 2q43-31 82 8z"/><path d="M623 117q43-41 80-6q38-51 88-1q36-25 74 9z"/></g>
  <path d="M0 252Q95 196 173 225Q281 173 356 223Q464 155 552 217Q679 171 791 230Q843 210 900 221V478H0Z" fill="#688f9f"/>
  <path d="M0 289Q151 214 251 264Q348 238 446 257Q583 211 701 272Q824 244 900 280V478H0Z" fill="#589b99"/>
  <path d="M0 324Q191 268 367 305Q547 265 900 321V478H0Z" fill="url(#sp-ground)"/>
  <path d="M346 478Q352 411 410 361Q424 351 435 335L466 335Q471 354 507 370Q561 410 595 478Z" fill="url(#sp-path)"/>
  <path d="M346 478Q352 411 410 361Q424 351 435 335L466 335Q471 354 507 370Q561 410 595 478Z" fill="url(#sp-stones)" opacity=".5"/>
  {/* Tiny far rooflines and bunting for cinematic storybook depth */}
  <g opacity=".72"><path d="M58 270V220l52-30 53 30v52Z" fill="#dca9b4"/><path d="M52 223l58-44 59 44" fill="#5489ad"/><path d="M701 283v-66l76-36 79 36v70Z" fill="#c9a6be"/><path d="M691 225l86-54 92 54" fill="#4c77a5"/></g>
  {/* Cathedral clock-tower landmark */}
  <g filter="url(#sp-soft)">
   <path d="M356 329V160L453 112L554 161V334Z" fill="url(#sp-tower)" stroke="#fae1ca" strokeWidth="7"/>
   <path d="M339 161l115-92 117 92-18 7-99-68-98 68z" fill="url(#sp-roof)" stroke="#c6ebec" strokeWidth="5"/>
   <path d="M434 93V58h39v36" fill="#9b6d99"/><path d="M441 57l12-24 15 24" fill="#f9d6a0"/>
   <circle cx="452" cy="180" r="33" fill="#f8edcf" stroke="#7e5c85" strokeWidth="7"/>
   <circle cx="452" cy="180" r="27" fill="#fff4d9"/>
   <path d="M452 157v25l13 7" fill="none" stroke="#7c5d7b" strokeWidth="4" strokeLinecap="round"/>
   <g fill="#f2dea9"><rect x="378" y="194" width="23" height="43" rx="11"/><rect x="505" y="194" width="23" height="43" rx="11"/></g>
   <path d="M421 335V280a31 31 0 0 1 62 0v55Z" fill="#4f4269" stroke="#f8dcac" strokeWidth="6"/>
   <path d="M447 335v-47" stroke="#cfaf9e" strokeWidth="3" opacity=".6"/>
  </g>
  {/* Left colorful home */}
  <g filter="url(#sp-soft)">
   <path d="M111 347V254h155v93" fill={houseTint} stroke="#ffe5cf" strokeWidth="6"/>
   <path d="M100 253l83-69 91 69-13 12-78-57-74 57z" fill="#365f9c" stroke="#b2d8e5" strokeWidth="4"/>
   <path d="M176 349v-71h41v71" fill="#56618a" stroke="#ffe1c6" strokeWidth="4"/>
   <rect x="125" y="272" width="36" height="35" rx="6" fill="#fff0bb" stroke="#84648b" strokeWidth="5"/>
   <rect x="227" y="271" width="26" height="34" rx="4" fill="#fff0bb" stroke="#84648b" strokeWidth="5"/>
  </g>
  {/* Right cottage and animated flower garden */}
  <g filter="url(#sp-soft)">
   <path d="M662 351v-99h153v99Z" fill="#d6aab4" stroke="#ffedcf" strokeWidth="6"/>
   <path d="M652 253l87-63 89 63-14 14-75-55-73 55z" fill="#ba678e" stroke="#eec4b9" strokeWidth="4"/>
   <path d="M726 350v-64h44v64Z" fill="#816483" stroke="#f2d5c0" strokeWidth="5"/>
   <rect x="681" y="272" width="30" height="36" rx="5" fill="#fef0bb" stroke="#806583" strokeWidth="4"/>
  </g>
  {/* Trees */}
  <g filter="url(#sp-soft)">
   <path d="M306 360V251" stroke="#805b53" strokeWidth="23" strokeLinecap="round"/>
   <ellipse cx="302" cy="237" rx="65" ry="70" fill="#397c78"/>
   <ellipse cx="275" cy="230" rx="45" ry="54" fill="#58a17c"/>
   <ellipse cx="339" cy="224" rx="39" ry="47" fill="#72b887"/>
   <path d="M597 348V253" stroke="#89615c" strokeWidth="19" strokeLinecap="round"/>
   <ellipse cx="589" cy="237" rx="59" ry="58" fill="#397f7f"/>
   <ellipse cx="568" cy="224" rx="34" ry="41" fill="#62af89"/>
  </g>
  {/* Fountain pool */}
  <ellipse cx="451" cy="368" rx="101" ry="25" fill="#2e677e" opacity=".65"/>
  <ellipse cx="451" cy="363" rx="92" ry="23" fill="#d4dfe0" stroke="#f5e7d9" strokeWidth="5"/>
  <ellipse cx="451" cy="360" rx="73" ry="12" fill="#4ec8c9"/>
  <path d="M452 359v-44" stroke="#e4f4f5" strokeWidth="8" strokeLinecap="round"/>
  <path d="M452 315q-42 30-54 13M452 315q43 30 54 13" stroke="#9ef0fa" strokeWidth="6" fill="none" strokeLinecap="round"/>
  <g className="sp-lanterns" filter="url(#sp-soft)">
   <path d="M65 330v-72M834 330v-72" stroke="#69526c" strokeWidth="8"/>
   <path d="M49 266h32l-5-38H54Z M818 266h32l-5-38h-22Z" fill={glow?color:'#bcb6bc'} stroke="#f6e2bb" strokeWidth="4"/>
   {glow&&<g fill={color} opacity=".75" filter="url(#sp-glow)"><circle cx="65" cy="249" r="31"/><circle cx="834" cy="249" r="31"/></g>}
  </g>
  </g>
  {/* Premium static environment is in the WebP. The following visual mutations
      stay separate and are driven ONLY by a verified full sentence. */}
  {awaken&&effect?.actor==='house'&&<g className="sp-v3-effect-house" transform="translate(96 202)">
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
   {[{x:145,y:269},{x:757,y:262}].map(({x,y},i)=><g key={i}>
     <circle cx={x} cy={y} r="51" fill={color} opacity=".55" filter="url(#sp-glow)"/>
     <path d={`M${x-19} ${y-18}h38l-5 40h-28Z`} fill={color}
       stroke="#fff7d4" strokeWidth="5" strokeLinejoin="round"/>
     <path d={`M${x-9} ${y-22}q9-20 18 0`} fill="none"
       stroke="#ffe3ac" strokeWidth="5" strokeLinecap="round"/>
     <path d={`M${x-2} ${y-32}v-9 M${x-43} ${y-3}h-11 M${x+43} ${y-3}h11`}
       stroke="#fff0a9" strokeWidth="5" strokeLinecap="round"/>
   </g>)}
  </g>}
  {/* Real response to color / scene language */}
  {awaken&&effect?.actor==='flower'&&<g className="sp-effect-bloom">
   {Array.from({length:5},(_,i)=><g key={i} transform={`translate(${565+i*26},${366+(i%2)*13})`}>
    <path d="M0 0v-30" stroke="#236759" strokeWidth="4"/>
    {[0,1,2,3,4].map(p=><ellipse key={p} transform={`rotate(${p*72} 0 -34)`} cx="0" cy="-44" ry="10" rx="7" fill={color}/>)}
    <circle cx="0" cy="-35" r="7" fill="#fff1b1"/>
   </g>)}
  </g>}
  {awaken&&effect?.actor==='balloon'&&<g className="sp-effect-float"><path d="M738 310q6-66 0-113" fill="none" stroke="#e8deeb" strokeWidth="2"/><ellipse cx="738" cy="188" rx="34" ry="45" fill={color} stroke="#fff5d9" strokeWidth="5"/></g>}
  {/* Actor shows up or reacts only when the built English has been checked. */}
  {showAnimal&&Array.from({length:Math.max(1,Math.min(3,effect?.count??1))},(_,index)=>
   <g key={index} className={`sp-actor sp-actor-${animal} sp-actor-${motion||'idle'}`}
   transform={(effect?.place?.includes('under')?'translate(310 365)':effect?.place?.includes('behind')?'translate(170 340)':effect?.place?.includes('fountain')?'translate(523 384)':'translate(526 348)')
     + ' translate(' + ((effect?.count??1)>1?index*66-33:0) + ',0)'}>
   <ellipse cx="0" cy="25" rx="35" ry="9" fill="#2f6573" opacity=".35"/>
   {animal==='bird'?<>
    <ellipse cx="0" cy="-16" rx="29" ry="22" fill={effect?.color&&COLOR_MAP[effect.color]||'#87cced'} stroke="#f6f2df" strokeWidth="3"/>
    <path d="M-10-12q-27-14-29 10q19 15 33 6" fill="#d7edf6"/>
    <circle cx="14" cy="-21" r="5" fill="#27445c"/><path d="M26-16l15 5-16 5" fill="#f7be6c"/>
   </>:<>
    <ellipse cx="0" cy="-6" rx="30" ry="22" fill={effect?.color&&COLOR_MAP[effect.color]||'#f8d19d'} stroke="#f6edda" strokeWidth="3"/>
    <circle cx="-2" cy="-31" r="23" fill={effect?.color&&COLOR_MAP[effect.color]||'#f8d19d'} stroke="#f6edda" strokeWidth="3"/>
    {animal==='rabbit'?<><ellipse cx="-15" cy="-63" rx="9" ry="28" fill="#f8d4b8"/><ellipse cx="11" cy="-65" rx="9" ry="28" fill="#f8d4b8"/></>:<><path d="M-24-46l-9-29 29 16" fill="#f3d09e"/><path d="M8-61l25-15-5 31" fill="#f3d09e"/></>}
    <circle cx="-11" cy="-34" r="3.8" fill="#2c425a"/><circle cx="8" cy="-34" r="3.8" fill="#2c425a"/>
    <circle cx="-2" cy="-23" r="4" fill="#925a64"/>
    <path d="M-23 16v12M19 16v12" stroke="#f6e9d8" strokeWidth="8" strokeLinecap="round"/>
   </>}
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
  {/* Decorative SVG elements are subdued when the realistic WebP backdrop is active. */}
  <g className="sp-v3-decorations">
  <path d="M40 149Q450 213 860 142" fill="none" stroke="#f8e9bf" strokeWidth="3" opacity=".8"/>
  {Array.from({length:15},(_,i)=>{
   const x=46+i*55,y=150+31*Math.sin(i/14*Math.PI),shade=['#ffdca4','#88e2d6','#ef9bbc'][i%3];
   return <path key={i} d={`M${x} ${y}l19 7-11 19z`} fill={shade} opacity=".89"/>;
  })}
  {Array.from({length:23},(_,i)=>{
   const x=22+(i*179)%857,y=42+(i*73)%364;
   return <path key={i} className="sp-spark" style={{animationDelay:`${i*0.14}s`}}
    d={`M${x} ${y-3}v6M${x-3} ${y}h6`} stroke={i%3?'#fff2c5':'#adf2ff'} strokeWidth="2" opacity=".75"/>;
  })}
  </g>
 </svg>
 <div className="sp-scene-caption">
  <span className="sp-scene-glyph" aria-hidden="true">✦</span>
  <span>{awaken?'✨ Canlandı!':'✨ Cümleni kur'}</span>
  {onInteract&&<button type="button" onClick={onInteract} className="sp-scene-speak" aria-label="İngilizce cümleyi tekrar dinle">🔊 Dinle</button>}
 </div>
 </div>;
}
