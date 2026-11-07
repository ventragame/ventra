'use client';

import {TEMPLE_CHAMBERS,type TempleChamber} from '@/lib/learning/templeEngine.ts';

const SCENES:Record<TempleChamber,string>={
 rune:'/assets/temple/temple-rune-v7.webp',
 echo:'/assets/temple/temple-echo-v7.webp',
 feast:'/assets/temple/temple-feast-v7.webp',
 home:'/assets/temple/temple-home-v7.webp',
 crown:'/assets/temple/temple-crown-v7.webp'
};

/**
 * Five distinct offline illustrated halls. Progress flames are HTML so that
 * screen readers never mistake decorative scene lights for answer controls.
 */
export function TempleScenery({chamber,cleared=0}:{chamber:TempleChamber;cleared?:number}){
 const hall=TEMPLE_CHAMBERS.find(c=>c.id===chamber)!;
 return <div className="tp-scene-svg tp6-scene tp7-scene" aria-hidden="true" data-chamber={chamber}>
  <img className="tp6-scene-img tp7-scene-img" src={SCENES[chamber]} alt="" draggable={false} decoding="async"/>
  <div className="tp6-scene-gradient tp7-scene-gradient"/>
  <div className="tp6-scene-embers tp7-scene-embers"/>
  <div className="tp6-seal-trail" aria-label="ENGLISH TEMPLE">
   {Array.from({length:5},(_,i)=><span key={i}
     className={i<cleared?'tp6-seal-active':'tp6-seal-dormant'}
     title={`${hall.title}: ${i+1}. görev`}>✦</span>)}
  </div>
 </div>;
}
