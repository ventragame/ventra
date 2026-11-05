'use client';

import type {NumberStage} from '@/lib/learning/numberValleyEngine';

const NUMBER_WORLD_ART:Record<NumberStage,string>={
  1:'/assets/numbers/crystal-meadow-v5.svg',
  2:'/assets/numbers/light-bridge-v5.svg',
  3:'/assets/numbers/star-orchard-v5.svg',
  4:'/assets/numbers/echo-canyon-v5.svg',
  5:'/assets/numbers/portal-temple-v5.svg'
};

/** Five original, bundled vector landscapes. Presentational only: every
 * question remains an accessible HTML control and works offline in WebViews. */
export function NumberValleyScenery({stage}:{stage:NumberStage}){
  return <div className="nv-scenery nv5-scene-art" aria-hidden="true">
    <img src={NUMBER_WORLD_ART[stage]} alt="" draggable={false} decoding="async"/>
    <span className="nv5-scene-light" />
    <span className="nv5-scene-spark nv5-scene-spark--one"/>
    <span className="nv5-scene-spark nv5-scene-spark--two"/>
    <span className="nv5-scene-spark nv5-scene-spark--three"/>
  </div>;
}

export function ValleyMilestone({stage,completed,total,active=false}:{stage:NumberStage;completed:number;total:number;active?:boolean}){
  if(stage===2)return <div className="nv-milestone nv-bridge-track nv5-bridge-track" role="img" aria-label={`Işık Köprüsü: ${completed} / ${total} taş aydınlandı`}>
    {Array.from({length:Math.min(total,9)},(_,i)=><span key={i} className={i<completed?'nv-bridge-lit':'nv-bridge-dim'} aria-hidden="true">⬡</span>)}
  </div>;
  if(stage===5)return <div className="nv-milestone nv-portal-track nv5-portal-track" role="img" aria-label={`Portal enerjisi: ${completed} / ${total}`}>
    <div className="nv-portal-dial"><span aria-hidden="true">✦</span></div>
    <span className="nv-portal-meter">Portal enerjisi %{total?Math.round(100*completed/total):0}</span>
  </div>;
  if(stage===4)return <div className={`nv-milestone nv-echo-track nv5-echo-track ${active?'nv-echo-active':''}`} aria-hidden="true">
    {Array.from({length:13},(_,i)=><span key={i} style={{height:`${14+((i*37)%38)}px`,animationDelay:`${i*.12}s`}}/>)}
  </div>;
  return null;
}
