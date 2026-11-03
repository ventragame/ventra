'use client';

import React from 'react';
import { COLOR_GROVE_WORDS } from '@/lib/progress/colorGroveProgress';
import './color-grove.css';

type ColorWord=(typeof COLOR_GROVE_WORDS)[number];
type MobileMode='discovery'|'matching'|'painting'|'complete';

interface Props {
 mode:MobileMode;
 words?:readonly ColorWord[];
 targetHex?:string;
 discoveredIds?:readonly string[];
 freshIds?:readonly string[];
 paintedIds?:readonly string[];
 wrongId?:string|null;
 correctId?:string|null;
 disabled?:boolean;
 onChoose?:(id:ColorWord['id'])=>void;
}

/** Touch-first version of Color Grove. The desktop SVG stays untouched.
 * Both UIs call the SAME mission engine callbacks and save the same events.
 * An accessible label is always present; no answer depends on hue alone.
 */
export function MobileColorGroveWorld({
 mode, words=[], targetHex, discoveredIds=[], freshIds=[], paintedIds=[],
 wrongId=null, correctId=null, disabled=false, onChoose
}:Props){
 const isDiscovery=mode==='discovery';
 const isPainting=mode==='painting';
 const isDone=mode==='complete';
 const caption=isDiscovery?'Çayırdaki renk çiçeklerini keşfet':
  mode==='matching'?'Çiçeğin İngilizce rengini seç':
  isPainting?'Doğru boyayı dokunarak seç':'Renkli koru canlandı';
 const blooms=Array.from({length:6},(_,index)=>{
  const id=paintedIds[index];
  return COLOR_GROVE_WORDS.find(color=>color.id===id)?.hex ??
   ['#ffce7d','#ff9fc4','#c7a8f5','#8ae3be','#a5d5ff','#f9a7a4'][index];
 });
 return <section className={'cg-world cg-world--'+mode} aria-label={caption}>
  <div className="cg-world-atmosphere" aria-hidden="true">
   <span className="cg-sun"/><span className="cg-cloud cg-cloud-a"/>
   <span className="cg-cloud cg-cloud-b"/><span className="cg-hill cg-hill-back"/>
   <span className="cg-hill cg-hill-front"/>
   <span className="cg-spark cg-spark-a">✦</span><span className="cg-spark cg-spark-b">✧</span>
  </div>
  <div className="cg-world-head">
   <span className="cg-world-marker">
    {isDiscovery?'🌱 RENK KEŞFİ':isPainting?'🖌️ BOYA ATÖLYESİ':isDone?'✨ YENİDEN CANLANDI':'🦋 RENK DEDEKTİFLERİ'}
   </span>
   <span className="cg-world-mascot" aria-hidden="true">🦋</span>
  </div>
  {isDone?(
   <div className="cg-finished-garden" aria-label="Yeniden renklendirilmiş altı çiçek">
    {blooms.map((hex,index)=><span key={index} className="cg-finished-flower">
     <span className="cg-flower cg-flower-finish"
      style={{'--cg-petal':hex} as React.CSSProperties} aria-hidden="true"/>
    </span>)}
    <strong>Harika! Koru yeniden renklerle doldu.</strong>
   </div>
  ):isDiscovery?(
   <div className="cg-flower-grid" role="group" aria-label="Keşif çiçekleri">
    {words.map((word,index)=>{
     const discovered=discoveredIds.includes(word.id);
     return <button type="button" key={word.id} disabled={disabled}
      className="cg-flower-choice vg-answer-card" data-found={discovered}
      style={{'--cg-petal':word.hex,'--cg-delay':(index*45)+'ms'} as React.CSSProperties}
      aria-pressed={discovered}
      aria-label={word.tr+' / '+word.id+' — İngilizceyi dinle ve keşfet'}
      onClick={()=>onChoose?.(word.id)}>
      {freshIds.includes(word.id)&&<span className="cg-new-ribbon">YENİ</span>}
      <span className="cg-flower" aria-hidden="true"/>
      <span className="cg-flower-word">{word.id.toUpperCase()}</span>
      <span className="cg-flower-tr">{word.tr}</span>
      <span className="cg-flower-status" aria-hidden="true">{discovered?'✓':'🔊'}</span>
     </button>;
    })}
   </div>
  ):(
   <>
    <div className="cg-hero-plant">
     <span className="cg-hero-glow" aria-hidden="true"/>
     <span className="cg-hero-stem" aria-hidden="true"/>
     <span className="cg-flower cg-hero-flower"
      style={{'--cg-petal':isPainting?'#c0cfca':targetHex??'#fde68a'} as React.CSSProperties}
      aria-hidden="true"/>
     <div className="cg-hero-caption">
      {isPainting?'DOĞRU BOYAYI SEÇ':'ÇİÇEĞİN RENGİNİ BUL'}
     </div>
    </div>
    <div className="cg-palette-grid" role="group"
     aria-label={isPainting?'Boya renklerini seç':'İngilizce renk adını seç'}
     style={{'--cg-columns':Math.min(3,Math.max(1,words.length))} as React.CSSProperties}>
     {words.map(word=><button key={word.id} type="button"
       disabled={disabled}
       onClick={()=>onChoose?.(word.id)}
       data-correct={correctId===word.id}
       data-wrong={wrongId===word.id}
       className={'cg-palette-choice vg-answer-card'+(isPainting?' cg-palette-choice-paint':'')}
       aria-pressed={correctId===word.id}
       aria-label={isPainting?word.tr+' boyasını seç':word.id+' İngilizce renk adını seç'}>
       {isPainting&&<span className="cg-paint-drop"
         style={{'--cg-petal':word.hex} as React.CSSProperties} aria-hidden="true"/>}
       <span className="cg-palette-label">{isPainting?word.tr:word.id.toUpperCase()}</span>
       {correctId===word.id&&<span className="cg-palette-check" aria-hidden="true">✓</span>}
     </button>)}
    </div>
   </>
  )}
  <div className="cg-world-bottom" aria-hidden="true"><span>✿</span><span>✿</span><span>✦</span><span>✿</span></div>
 </section>;
}
