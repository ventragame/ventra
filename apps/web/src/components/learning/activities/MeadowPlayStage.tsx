'use client';

import React from 'react';
import type {AnimalId,AnimalWord} from '@/lib/learning/animalMissionEngine';
import './animal-meadow-v3.css';

export type MeadowMode='discover'|'match'|'listen'|'command'|'rescue'|'complete';
export interface MeadowPlayStageProps {
 mode:MeadowMode;
 animals:readonly AnimalWord[];
 target?:AnimalWord|null;
 discovered?:readonly AnimalId[];
 wrongId?:AnimalId|null;
 correctId?:AnimalId|null;
 disabled?:boolean;
 noAudioMode?:boolean;
 canSpeak?:boolean;
 onSelect?:(id:AnimalId)=>void;
 onListen?:()=>void;
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

/**
 * One composited, sharp-edged playfield for web and mobile:
 * - 3D animals live INSIDE sized, clipped transparent-image slots;
 * - background is decorative only (never a hidden animal answer);
 * - the same question and accessibility callbacks drive every device.
 */
export function MeadowPlayStage({
 mode,animals,target,discovered=[],wrongId=null,correctId=null,disabled=false,
 noAudioMode=false,canSpeak=true,onSelect,onListen
}:MeadowPlayStageProps){
 const seen=new Set(discovered);
 const isDiscovery=mode==='discover',isMatch=mode==='match',isListening=mode==='listen';
 const isRescue=mode==='rescue',isComplete=mode==='complete';
 const imageChoices=!isMatch;
 return <section className={'am3-stage am3-stage--'+mode} data-mode={mode}
  aria-label={labels[mode]}>
  <div className="am3-atmosphere" aria-hidden="true"/>
  <div className="am3-topline">
   <span className="am3-step"><span aria-hidden="true">{icons[mode]}</span>
    <span>{labels[mode]}</span></span>
   {isDiscovery&&<span className="am3-discovered" aria-label={seen.size+' hayvan keşfedildi'}>
    ✨ {seen.size}/{animals.length}</span>}
  </div>
  {isComplete?(
   <div className="am3-victory" role="img" aria-label="Üç yıldız ve görev başarısı">
    <span className="am3-victory-stars">⭐ ⭐ ⭐</span>
    <strong>Harika!</strong>
    <span aria-hidden="true">🎉 ✨ 🎉</span>
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
     <button type="button" className="am3-listen-button" onClick={onListen}
      aria-label="İngilizce kelimeyi tekrar dinle" disabled={disabled||!canSpeak}>
      <span aria-hidden="true">🔊</span><strong>Dinle</strong>
     </button>
     {noAudioMode&&target&&<span className="am3-written-assist"
       aria-label="Yazılı yardım açık">{target.id.toUpperCase()}</span>}
    </div>}
   {isRescue&&<div className="am3-rescue-zone" aria-label="Kurtarma görevi">
     <span aria-hidden="true">🐾</span><span aria-hidden="true">💛</span>
     {correctId&&<span className="am3-home-icon" aria-label="Hayvan güvenli yerine döndü">
      {safeDestination(target)}</span>}
    </div>}
   <div className={'am3-choices'+(isDiscovery?' am3-choices--discover':'')+
     (isMatch?' am3-choices--words':'')}
    role="group" aria-label={isDiscovery?'Dokun, İngilizce adını dinle':
     isMatch?'İngilizce kelime seçenekleri':'Hayvan resmi seçenekleri'}>
    {animals.map((animal,i)=>{
     const known=seen.has(animal.id),right=correctId===animal.id,wrong=wrongId===animal.id;
     const showName=isDiscovery?known:right;
     return <button type="button" key={animal.id} disabled={disabled}
      className="am3-choice"
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
       </span>:
       <span className="am3-word-choice">{animal.id.toUpperCase()}</span>}
      {imageChoices&&<span className="am3-caption">
       {showName?animal.id.toUpperCase():
        isDiscovery?<span className="am3-discover-icon" aria-hidden="true">🔊</span>:
        <span className="am3-answer-placeholder" aria-hidden="true">✦</span>}
      </span>}
      {known&&isDiscovery&&<span className="am3-check" aria-hidden="true">✓</span>}
      {right&&!isDiscovery&&<span className="am3-check" aria-hidden="true">✓</span>}
     </button>;
    })}
   </div>
   {isRescue&&correctId&&<p className="am3-rescue-success" role="status">
    <span aria-hidden="true">💛</span> {target?.id.toUpperCase()}
    <span aria-hidden="true"> {safeDestination(target)}</span>
   </p>}
  </>}
 </section>;
}
