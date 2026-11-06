'use client';

import {TEMPLE_CHAMBERS,type TempleChamber} from '@/lib/learning/templeEngine.ts';

const SCENES:Record<TempleChamber,string>={
 rune:'/assets/temple/temple-rune-v6.svg',
 echo:'/assets/temple/temple-echo-v6.svg',
 feast:'/assets/temple/temple-feast-v6.svg',
 home:'/assets/temple/temple-home-v6.svg',
 crown:'/assets/temple/temple-crown-v6.svg'
};

/**
 * Five distinct offline illustrated halls. Progress flames are HTML so that
 * screen readers never mistake decorative scene lights for answer controls.
 */
export function TempleScenery({chamber,cleared=0}:{chamber:TempleChamber;cleared?:number}){
 const hall=TEMPLE_CHAMBERS.find(c=>c.id===chamber)!;
 return <div className="tp-scene-svg tp6-scene" aria-hidden="true" data-chamber={chamber}>
  <img className="tp6-scene-img" src={SCENES[chamber]} alt="" draggable={false} decoding="async"/>
  <div className="tp6-scene-gradient"/>
  <div className="tp6-scene-embers"/>
  <div className="tp6-seal-trail" aria-label="ENGLISH TEMPLE">
   {Array.from({length:5},(_,i)=><span key={i}
     className={i<cleared?'tp6-seal-active':'tp6-seal-dormant'}
     title={`${hall.title}: ${i+1}. görev`}>✦</span>)}
  </div>
 </div>;
}
