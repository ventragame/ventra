'use client';

import React from 'react';
import type {AnimalId,AnimalWord} from '@/lib/learning/animalMissionEngine';

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
 discover:'🐾 Hayvanlarla Tanış',match:'🧩 Resimden Kelimeye',
 listen:'👂 Dinle ve Bul',command:'🌿 Hayvan Macerası',
 rescue:'✨ Kurtarma Macerası',complete:'🏆 Harika!'
};

/**
 * One visual, semantic stage for desktop + mobile. No second map, fake
 * character walking or image-only answer hotspots. The real question plan
 * drives all options; displayed vocabulary is revealed at the right moment.
 */
export function MeadowPlayStage({
 mode,animals,target,discovered=[],wrongId=null,correctId=null,disabled=false,
 noAudioMode=false,canSpeak=true,onSelect,onListen
}:MeadowPlayStageProps){
 const isDiscovery=mode==='discover',isMatch=mode==='match';
 const isListening=mode==='listen';
 const isRescue=mode==='rescue';
 const isComplete=mode==='complete';
 const revealed=new Set(discovered);
 const showImage=!isMatch;
 return <section className={'am-v2-stage am-v2-'+mode}
   aria-label={labels[mode]} data-mode={mode}>
   <div className="am-v2-atmosphere" aria-hidden="true">
    <div className="am-v2-sun"/><div className="am-v2-cloud am-v2-cloud-one"/>
    <div className="am-v2-cloud am-v2-cloud-two"/>
    <span className="am-v2-butterfly">🦋</span><span className="am-v2-flower">✿</span>
   </div>
   <div className="am-v2-stage-top">
    <span className="am-v2-stage-label">{labels[mode]}</span>
    {isDiscovery&&<span className="am-v2-count" aria-label={revealed.size+' hayvan öğrenildi'}>
      ✨ {revealed.size}/{animals.length}
    </span>}
   </div>
   {isComplete?(
    <div className="am-v2-victory" role="img" aria-label="Üç yıldız ve kutlama">
     <span className="am-v2-win-spark">✦ ✨ ✦</span>
     <span className="am-v2-win-stars">⭐ ⭐ ⭐</span>
     <strong>Harika!</strong>
     <span className="am-v2-win-spark">✿ ✨ ✿</span>
    </div>
   ):<>
    {isMatch&&target&&<div className="am-v2-hero">
      <div className="am-v2-hero-frame" aria-label="Hangi hayvan?">
       <img src={target.image} alt="" width={320} height={320} draggable={false}/>
       {correctId===target.id&&<span className="am-v2-hero-tick" aria-label="Doğru">✓</span>}
      </div>
     </div>}
    {(isListening||isRescue)&&<div className="am-v2-audio-hero">
      {isListening?(
        <button className="am-v2-hero-sound" type="button" onClick={onListen}
         disabled={disabled||!canSpeak} aria-label="İngilizce hayvan seslendirmesini tekrar dinle">
         <span aria-hidden="true">🔊</span><span>Dinle</span>
        </button>
      ):(
        <div className="am-v2-rescue-sign" aria-hidden="true">
          <span>🐾</span><span>💛</span><span>🏡</span>
        </div>
      )}
      {noAudioMode&&isListening&&target&&
        <div className="am-v2-audio-fallback" aria-label={'Yazılı ipucu '+target.id}>
          {target.id.toUpperCase()}
        </div>}
    </div>}
    <div className={'am-v2-options'+(isDiscovery?' am-v2-options-discover':'')+(isMatch?' am-v2-options-text':'')}
      role="group" aria-label={isDiscovery?'Hayvanlara dokunarak İngilizceyi öğren':
        isMatch?'Doğru İngilizce kelimeyi seç':'Doğru hayvanı seç'}>
      {animals.map((animal,i)=>{
        const found=revealed.has(animal.id);
        const right=correctId===animal.id;
        const wrong=wrongId===animal.id;
        const revealedWord=isDiscovery&&found;
        return <button key={animal.id} type="button" disabled={disabled}
         className={'am-v2-option'+(isMatch?' am-v2-word-option':'')}
         data-found={found} data-right={right} data-wrong={wrong}
         data-rescued={isRescue&&right}
         style={{'--am-order':i} as React.CSSProperties}
         onClick={()=>onSelect?.(animal.id)}
         aria-pressed={isDiscovery?found:right}
         aria-label={isDiscovery?
          animal.tr+', '+(found?'tekrar dinle':'dokun ve öğren'):
          isMatch?animal.id+' İngilizce kelimesini seç':
          animal.tr+' hayvanını seç'}>
         {showImage&&<span className="am-v2-animal-art">
           <img src={animal.image} alt="" width={320} height={320}
             draggable={false} loading="eager"/>
          </span>}
         {isMatch?<span className="am-v2-word-label">{animal.id.toUpperCase()}</span>:
          isDiscovery?<span className="am-v2-animal-name">
           {revealedWord?animal.id.toUpperCase():'🔊'}
          </span>:
          right?<span className="am-v2-animal-name am-v2-answer-reveal">{animal.id.toUpperCase()}</span>:null}
         {found&&isDiscovery&&<span className="am-v2-learned" aria-hidden="true">✓</span>}
         {right&&!isDiscovery&&<span className="am-v2-correct" aria-hidden="true">✓</span>}
        </button>;
      })}
    </div>
    {isRescue&&correctId&&<div className="am-v2-rescue-reward" role="status" aria-live="polite">
       <span aria-hidden="true">🐾</span> {target?.id.toUpperCase()} <span aria-hidden="true">💛 🏡</span>
     </div>}
   </>}
   <div className="am-v2-ground-glow" aria-hidden="true">✿　✦　✿　✧　✿</div>
 </section>;
}
