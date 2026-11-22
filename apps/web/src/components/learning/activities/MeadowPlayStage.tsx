'use client';

import React,{useId} from 'react';
import type {AnimalId,AnimalWord} from '@/lib/learning/animalMissionEngine';
import './animal-meadow-v3.css';
import {LearningMotion} from '@/components/learning/motion/LearningMotion';
import {CharacterGuide,type CharacterMood} from '@/components/learning/motion/CharacterGuide';
import './animal-meadow-guides.css';

export type MeadowMode='discover'|'match'|'listen'|'command'|'rescue'|'complete';
export interface MeadowPlayStageProps {
 mode:MeadowMode;
 /** Stars earned in THIS run, shown on the completion scene (default 3). */
 stars?:1|2|3;
 animals:readonly AnimalWord[];
 target?:AnimalWord|null;
 discovered?:readonly AnimalId[];
 wrongId?:AnimalId|null;
 correctId?:AnimalId|null;
 disabled?:boolean;
 noAudioMode?:boolean;
 canSpeak?:boolean;
 speaking?:boolean;
 onSelect?:(id:AnimalId)=>void;
 onListen?:()=>void;
 /** In-scene answer feedback: stays visible on phones (a bar below the scene did not). */
 toast?:{text:string;good:boolean;detail?:string;lang?:'en'}|null;
}
const labels:Record<MeadowMode,string>={
 discover:'Hayvanları Keşfet',match:'Kelimeyi Bul',listen:'Dinle ve Bul',
 command:'Hayvanı Bul',rescue:'Kurtarma',complete:'Tebrikler'
};
const icons:Record<MeadowMode,string>={
 discover:'🐾',match:'🧩',listen:'👂',command:'🧭',rescue:'💛',complete:'⭐'
};
const destinationIcons:Record<string,string>={
 Ev:'🏠',Bahçe:'🏡',Ağaç:'🌳',Çayır:'🌿',Çiftlik:'🚜',
 Gölet:'💧',Çiçeklik:'🌸',Savan:'🌅',Orman:'🌲',
 Kutup:'🧊',Sahil:'🏖️',Dağ:'⛰️',Nehir:'🌊',Otlak:'🌾',Deniz:'🐠'
};
function safeDestination(word:AnimalWord|null|undefined):string{
 return word?destinationIcons[word.place]??'🏡':'🏡';
}

type CoverKind='bush'|'hay'|'log';
const COVERS:readonly CoverKind[]=['bush','hay','log'];
/** Rescue hiding places drawn in the meadow scene's own palette (leaves,
 * hay, wood). They hide only the lower part of the animal: eyes, ears and
 * head stay visible, so finding it is still about the English it heard. */
function RescueCover({kind}:{kind:CoverKind}){
 const id='am3c'+useId().replace(/[^a-zA-Z0-9]/g,'');
 if(kind==='hay')return <svg viewBox="0 0 200 84" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
  <defs><linearGradient id={id} x2="0" y2="1"><stop stopColor="#ffe58f"/><stop offset=".55" stopColor="#f5b862"/><stop offset="1" stopColor="#c98a3c"/></linearGradient></defs>
  <rect x="12" y="14" width="176" height="68" rx="24" fill={`url(#${id})`} stroke="#8f5c2c" strokeWidth="4"/>
  {[34,62,92,122,152].map(x=><path key={x} d={`M${x} 22q-7 28 0 54`} stroke="#d99a45" strokeWidth="3" fill="none" strokeLinecap="round"/>)}
  <rect x="50" y="15" width="11" height="66" fill="#b17a41"/><rect x="139" y="15" width="11" height="66" fill="#b17a41"/>
  <path d="M24 22q32-11 62 0q30-9 60 0q20-6 32 3" stroke="#fff6c4" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".85"/>
 </svg>;
 if(kind==='log')return <svg viewBox="0 0 200 84" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
  <defs><linearGradient id={id} x2="0" y2="1"><stop stopColor="#e4b878"/><stop offset=".45" stopColor="#b17a41"/><stop offset="1" stopColor="#815732"/></linearGradient>
   <radialGradient id={id+'r'}><stop stopColor="#f8e2b0"/><stop offset=".7" stopColor="#e2b471"/><stop offset="1" stopColor="#a8723c"/></radialGradient></defs>
  <rect x="10" y="26" width="158" height="56" rx="28" fill={`url(#${id})`} stroke="#6e4524" strokeWidth="4"/>
  <path d="M34 42h58M50 58h70M30 70h42" stroke="#8a5a30" strokeWidth="3" strokeLinecap="round" opacity=".55"/>
  <ellipse cx="166" cy="54" rx="23" ry="28" fill={`url(#${id}r)`} stroke="#6e4524" strokeWidth="4"/>
  <ellipse cx="166" cy="54" rx="13" ry="16" fill="none" stroke="#b9854a" strokeWidth="2.5"/>
  <ellipse cx="166" cy="54" rx="5" ry="6.5" fill="#b9854a"/>
  <path d="M58 30q9-19 26-14q-7 12-26 14z" fill="#70cf75" stroke="#2e9466" strokeWidth="2.5" strokeLinejoin="round"/>
 </svg>;
 // Bush: a clean outline of the union of three leaf clusters, then flowers.
 const leaves=<><circle cx="46" cy="58" r="33"/><circle cx="100" cy="45" r="41"/><circle cx="154" cy="58" r="33"/><rect x="16" y="58" width="168" height="30" rx="10"/></>;
 return <svg viewBox="0 0 200 84" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
  <defs><radialGradient id={id} cx=".4" cy=".3" r=".8"><stop stopColor="#aaf59e"/><stop offset=".45" stopColor="#70cf75"/><stop offset="1" stopColor="#2e9466"/></radialGradient></defs>
  <g fill="#24704d" stroke="#24704d" strokeWidth="8">{leaves}</g>
  <g fill={`url(#${id})`}>{leaves}</g>
  <path d="M70 30q12-10 26-6M118 26q12-4 22 4" stroke="#c8f7b5" strokeWidth="4" fill="none" strokeLinecap="round"/>
  <g fill="#ffd1da"><circle cx="68" cy="46" r="6"/><circle cx="134" cy="40" r="6"/></g>
  <g fill="#f8d6ff"><circle cx="104" cy="66" r="6"/><circle cx="38" cy="66" r="5"/><circle cx="162" cy="66" r="5"/></g>
  <g fill="#ffeb8c"><circle cx="68" cy="46" r="2.4"/><circle cx="134" cy="40" r="2.4"/><circle cx="104" cy="66" r="2.4"/></g>
 </svg>;
}

/**
 * One composited, sharp-edged playfield for web and mobile:
 * - 3D animals live INSIDE sized, clipped transparent-image slots;
 * - background is decorative only (never a hidden animal answer);
 * - the same question and accessibility callbacks drive every device.
 */
export function MeadowPlayStage({
 mode,animals,target,discovered=[],wrongId=null,correctId=null,disabled=false,stars=3,
 noAudioMode=false,canSpeak=true,speaking=false,onSelect,onListen,toast=null
}:MeadowPlayStageProps){
 const seen=new Set(discovered);
 const isDiscovery=mode==='discover',isMatch=mode==='match',isListening=mode==='listen';
 const isRescue=mode==='rescue',isComplete=mode==='complete';
 const imageChoices=!isMatch;
 const guideMood:CharacterMood=isComplete?'celebrate':wrongId?'try_again':
  correctId?'happy':speaking?'listen':noAudioMode?'hint':
  isDiscovery&&seen.size?'point':isRescue?'hint':'idle';
 const guideCue=mode+':'+(correctId??'')+':'+(wrongId??'')+':'+seen.size;
 return <section className={'am3-stage gg-game-scene am3-stage--'+mode} data-mode={mode}
  aria-label={labels[mode]}>
  <div className="am3-atmosphere" aria-hidden="true"/>
  <LearningMotion variant={isComplete?'victory':'success'}
   trigger={isComplete?'meadow-complete':correctId?
    mode+':'+correctId:isDiscovery&&seen.size?'discover:'+Array.from(seen).sort().join('|'):null}
   className="am3-motion-layer"/>
  <div className="am3-topline">
   {/* Question modes state the task in the card above; no second label here. */}
   {(isDiscovery||isComplete)?<span className="am3-step"><span aria-hidden="true">{icons[mode]}</span>
    <span>{labels[mode]}</span></span>:<span/>}
   <div className="am3-topline-side">
    {!isComplete&&<div className="am3-guide-inline">
     <CharacterGuide character="meadow-owl" mood={guideMood} cueKey={guideCue}/>
    </div>}
   </div>
  </div>
  {toast&&!isComplete&&<p className="am3-toast" data-good={toast.good} role="status" aria-live="polite">
   <span lang={toast.lang}>{toast.text}</span>{toast.detail&&<small>{toast.detail}</small>}
  </p>}
  {isComplete?(
   <div className="am3-victory" role="img" aria-label={stars+' yıldız ile görev tamamlandı'}>
    <div className="am3-guide-finale">
     <CharacterGuide character="meadow-owl" mood="celebrate" cueKey="meadow-saved"/>
    </div>
    <span className="am3-victory-stars">{[1,2,3].map(n=><span key={n} className={n<=stars?undefined:'am3-victory-star-empty'}>⭐</span>)}</span>
    <strong>{stars===3?'Harika!':stars===2?'Çok iyi!':'Başardın!'}</strong>
   </div>
  ):<>
   {isMatch&&target&&<div className="am3-focus" aria-label="İngilizce adı sorulan hayvan">
     <div className="am3-focus-frame">
      <img src={target.image} alt={target.tr+' resmi'} width={256} height={256}
       decoding="async" draggable={false}/>
      {correctId===target.id&&<span className="am3-focus-check" aria-hidden="true">✓</span>}
     </div>
    </div>}
   {isListening&&<div className="am3-listen-zone">
     <button type="button" className="am3-listen-button gg-game-control" onClick={onListen}
      aria-label="İngilizce kelimeyi tekrar dinle" disabled={disabled||!canSpeak}>
      <span aria-hidden="true">🔊</span><strong>Dinle</strong>
     </button>
     {noAudioMode&&target&&<span className="am3-written-assist" lang="en"
       aria-label="Yazılı yardım açık">{target.id.toUpperCase()}</span>}
    </div>}
   {isRescue&&<div className="am3-rescue-zone" aria-hidden="true">
     {correctId&&target?<span className="am3-homecoming">
       <img className="am3-homecoming-animal" src={target.image} alt="" width={64} height={64} draggable={false}/>
       <span className="am3-home-icon">{safeDestination(target)}</span>
      </span>:
      <span className="am3-trail"><span>🐾</span><span>🐾</span><span>🐾</span></span>}
    </div>}
   <div className={'am3-choices'+(isDiscovery?' am3-choices--discover':'')+
     (isMatch?' am3-choices--words':'')}
    role="group" aria-label={isDiscovery?'Dokun, İngilizce adını dinle':
     isMatch?'İngilizce kelime seçenekleri':'Hayvan resmi seçenekleri'}>
    {animals.map((animal,i)=>{
     const known=seen.has(animal.id),right=correctId===animal.id,wrong=wrongId===animal.id;
     const showName=isDiscovery?known:right;
     return <button type="button" key={animal.id} disabled={disabled}
      className="am3-choice gg-game-control"
      data-known={known} data-correct={right} data-wrong={wrong}
      data-rescued={isRescue&&right}
      style={{'--am3-order':i} as React.CSSProperties}
      aria-pressed={isDiscovery?known:right}
      aria-label={isDiscovery?
       animal.tr+(known?', yeniden dinle':', dokun ve İngilizceyi dinle'):
       isMatch?animal.id+' kelimesini seç':animal.tr+' hayvanını seç'}
      onClick={()=>onSelect?.(animal.id)}>
      {imageChoices?
       <span className="am3-portrait" aria-hidden="true">
        <img src={animal.image} alt="" width={256} height={256}
         decoding="async" draggable={false} loading={i>5?'lazy':'eager'}/>
        {isRescue&&<span className="am3-cover" data-kind={COVERS[i%COVERS.length]}><RescueCover kind={COVERS[i%COVERS.length]}/></span>}
       </span>:
       <span className="am3-word-choice" lang="en">{animal.id.toUpperCase()}</span>}
      {imageChoices&&<span className="am3-caption" lang={showName?'en':undefined}>
       {showName?animal.id.toUpperCase():
        isDiscovery?<span className="am3-discover-icon" aria-hidden="true">🔊</span>:
        <span className="am3-answer-placeholder" aria-hidden="true">✦</span>}
      </span>}
      {known&&isDiscovery&&<span className="am3-check" aria-hidden="true">✓</span>}
      {right&&!isDiscovery&&<span className="am3-check" aria-hidden="true">✓</span>}
     </button>;
    })}
   </div>
  </>}
 </section>;
}
