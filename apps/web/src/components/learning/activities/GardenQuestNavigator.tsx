'use client';
import React,{useEffect,useRef} from 'react';
type Props={areaTitle:string;stageTitle:string;stage:number;totalStages:number;children:React.ReactNode};
/** UI-only: original buttons, locks, session state and progress callbacks stay unchanged. */
export function GardenQuestNavigator({areaTitle,stageTitle,stage,totalStages,children}:Props){
 const root=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const nav=root.current?.querySelector<HTMLElement>('.gg-quest-stage-nav');
  const active=nav?.querySelector<HTMLElement>('[aria-current="step"]');
  if(!nav||!active)return;
  const frame=window.requestAnimationFrame(()=>{
   const outer=nav.getBoundingClientRect(),inner=active.getBoundingClientRect();
   const offset=inner.left-outer.left-(nav.clientWidth-inner.width)/2;
   if(Math.abs(offset)>2)nav.scrollLeft+=offset;
  });
  return()=>window.cancelAnimationFrame(frame);
 },[stage,areaTitle]);
 return <div className="gg-quest-navigation" aria-label="Bölüm ve görev gezinmesi">
  <div className="gg-quest-location" aria-live="polite" aria-atomic="true">
   <div className="gg-quest-location-copy">
    <span className="gg-quest-location-kicker">ŞİMDİ OYNADIĞIN</span>
    <strong><span>{areaTitle}</span><span aria-hidden="true" className="gg-quest-separator">›</span><span>{stageTitle}</span></strong>
   </div>
   <span className="gg-quest-counter" aria-label={'Görev '+stage+' / '+totalStages}>{stage}/{totalStages}</span>
  </div>
  <div className="gg-quest-navigation-lists" ref={root}>{children}</div>
 </div>;
}
