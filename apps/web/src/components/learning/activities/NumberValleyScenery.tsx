'use client';

import type {NumberStage} from '@/lib/learning/numberValleyEngine';

/**
 * Original, resolution-independent SVG stage artwork.
 * Decorative only: the lesson controls remain semantic HTML buttons.
 */
const GLOW_POINTS=Array.from({length:38},(_,i)=>({
  x:43+((i*251+61)%1175),y:20+((i*97+17)%475),r:1.6+(i%4)*.8
}));
export function NumberValleyScenery({stage}:{stage:NumberStage}){
  const palette=stage===1?['#144d92','#5aa7c9','#0b4268']:
    stage===2?['#142a76','#6977c3','#214d77']:
    stage===3?['#0b6d94','#8acdaf','#267a69']:
    stage===4?['#31246e','#7073c4','#2e456e']:
    ['#193e7b','#6d6ec5','#175b80'];
  return <svg aria-hidden="true" focusable="false" className="nv-scenery" xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1280 680" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="nvs-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={palette[0]}/><stop offset=".63" stopColor={palette[1]}/>
        <stop offset="1" stopColor={palette[2]}/>
      </linearGradient>
      <linearGradient id="nvs-peak" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#dcf8ff"/><stop offset=".32" stopColor="#6dbbd0"/><stop offset="1" stopColor="#245f8b"/>
      </linearGradient>
      <linearGradient id="nvs-ground" x1="0" x2="0" y1="0" y2="1">
        <stop stopColor="#69d2b5"/><stop offset=".5" stopColor="#307e8b"/><stop offset="1" stopColor="#194a67"/>
      </linearGradient>
      <radialGradient id="nvs-light"><stop stopColor="#f5fbfc" stopOpacity=".9"/>
        <stop offset=".3" stopColor="#a7f3eb" stopOpacity=".45"/><stop offset="1" stopColor="#8cfcf4" stopOpacity="0"/></radialGradient>
      <linearGradient id="nvs-gem" x1="0" x2="1" y1="0" y2="1">
        <stop stopColor="#f0ffff"/><stop offset=".22" stopColor="#a7f4ec"/>
        <stop offset=".58" stopColor="#67bbfa"/><stop offset="1" stopColor="#9b86ea"/>
      </linearGradient>
      <linearGradient id="nvs-gold" x1="0" x2="0" y1="0" y2="1">
        <stop stopColor="#fff7bf"/><stop offset=".55" stopColor="#e3c480"/><stop offset="1" stopColor="#bd8b4c"/>
      </linearGradient>
      <filter id="nvs-soft"><feGaussianBlur stdDeviation="18"/></filter>
      <filter id="nvs-halo" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="5" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <pattern id="nvs-dots" width="32" height="28" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="5" r="1" fill="#fff" opacity=".1"/>
      </pattern>
    </defs>
    <rect width="1280" height="680" fill="url(#nvs-sky)"/>
    <rect width="1280" height="680" fill="url(#nvs-dots)"/>
    <ellipse cx="695" cy="90" rx="400" ry="290" fill="url(#nvs-light)" opacity=".75"/>
    <circle cx="930" cy="125" r="49" fill="#e5ffef" opacity=".62"/>
    <circle cx="930" cy="125" r="75" fill="none" stroke="#dcffff" strokeWidth="2" opacity=".22"/>
    {GLOW_POINTS.map((pt,i)=><g key={i} opacity={i%3===0?.66:.32} fill="#efffff">
      <circle cx={pt.x} cy={pt.y} r={pt.r}/>
      {i%8===0&&<path d={`M${pt.x-9} ${pt.y} h18 M${pt.x} ${pt.y-9} v18`} stroke="#eaffff" strokeWidth="1.4"/>}
    </g>)}
    <path d="M0 387 L135 215 L230 310 L405 126 L535 304 L661 194 L830 368 L979 173 L1100 319 L1234 200 L1280 244 V680 H0Z"
      fill="#264d87" opacity=".36"/>
    <path d="M0 469 L158 254 L295 437 L444 218 L608 452 L725 316 L892 485 L1008 236 L1170 425 L1280 324 V680 H0Z"
      fill="url(#nvs-peak)" opacity=".67"/>
    <path d="M116 317 L158 254 L202 324 L158 310Z M395 282 L444 218 L492 299 L445 285Z M965 299 L1008 236 L1054 304 L1009 283Z"
      fill="#effeff" opacity=".78"/>
    <path d="M0 535 Q120 490 246 532 T514 528 T756 520 T1005 529 T1280 506 V680 H0Z"
      fill="url(#nvs-ground)"/>
    <path d="M0 599 Q204 536 372 587 T684 560 T1017 569 T1280 545 V680 H0Z"
      fill="#246782" opacity=".7"/>
    <path d="M0 645 Q215 585 482 626 T950 602 T1280 633 V680 H0Z"
      fill="#144967" opacity=".65"/>
    {[70,185,1015,1165].map((x,i)=><g key={i} transform={`translate(${x} ${465+(i%2)*35})`} opacity=".72">
      <path d="M-4 110 L-4 18 H4 V110" fill="#3f6678"/>
      <path d="M0 -28 L-38 39 H38 Z" fill="#165777"/>
      <path d="M0 0 L-48 67 H48 Z" fill="#1c6c80"/>
      <path d="M0 29 L-55 91 H55 Z" fill="#238482"/>
      <circle cx="0" cy="22" r="4" fill="#fff4bc" opacity=".8"/>
    </g>)}
    {stage===1&&<g filter="url(#nvs-halo)">
      <path d="M488 535 Q632 415 778 534" fill="none" stroke="#c9fefe" strokeWidth="15" opacity=".45"/>
      {[0,1,2,3,4].map((i)=><g key={i} transform={`translate(${435+i*108} ${420-(i%2)*70})`}>
        <path d="M0 0 L24 21 L14 94 L-14 94 L-24 21Z" fill="url(#nvs-gem)" stroke="#ceffff" strokeWidth="3"/>
        <path d="M0 0 L0 88 L14 94" fill="none" stroke="#ffffff" strokeWidth="2" opacity=".7"/>
        <path d="M-15 100 Q0 82 15 100" fill="none" stroke="#fff9c0" strokeWidth="4"/>
      </g>)}
      <path d="M579 380 L635 286 L691 380 L665 483 L608 483Z" fill="url(#nvs-gem)"
        stroke="#e0ffff" strokeWidth="7"/>
      <path d="M635 286 L635 483 M579 380 L691 380" stroke="#ffffff" opacity=".65" strokeWidth="3"/>
      <ellipse cx="635" cy="500" rx="170" ry="18" fill="#baf8f0" opacity=".35" filter="url(#nvs-soft)"/>
    </g>}
    {stage===2&&<g>
      <path d="M305 570 Q650 275 975 570" fill="none" stroke="#aef9fa" strokeWidth="20" opacity=".21"/>
      <path d="M315 553 Q640 331 965 553" fill="none" stroke="#e8d6a4" strokeWidth="22" strokeDasharray="34 15"/>
      <path d="M315 553 Q640 331 965 553" fill="none" stroke="#fff8d4" strokeWidth="5" strokeDasharray="34 15"/>
      {[0,1,2,3,4].map((n)=>{const x=410+n*115,y=472-Math.sin((n+1)*Math.PI/6)*90;return <g key={n}>
        <circle cx={x} cy={y} r="23" fill="url(#nvs-gold)" stroke="#fff1ac" strokeWidth="3"/>
        <path d={`M${x-10} ${y} h20`} stroke="#fff" strokeWidth="3" opacity=".75"/>
      </g>})}
      <path d="M160 553 L160 398 L195 346 L230 398 L230 553Z" fill="#4373a0" stroke="#a6d4e5" strokeWidth="4"/>
      <path d="M1080 553 L1080 397 L1115 346 L1150 397 L1150 553Z" fill="#4373a0" stroke="#a6d4e5" strokeWidth="4"/>
    </g>}
    {stage===3&&<g>
      {[375,498,635,772,900].map((x,i)=><g key={x} transform={`translate(${x} ${475+(i%2)*21})`}>
        <path d="M0 116 Q-10 53 -18 10 M0 116 Q10 49 25 -8" stroke="#b6faab" strokeWidth="5" fill="none"/>
        <path d="M-17 9 L-40 -8 L-22 -21 L-12 -42 L4 -22 L24 -12 L9 6 L-1 27Z"
          fill="#fff1a7" stroke="#fffbc7" strokeWidth="3" filter="url(#nvs-halo)"/>
        <ellipse cx="-16" cy="62" rx="21" ry="9" transform="rotate(-25 -16 62)" fill="#74e1b4"/>
        <ellipse cx="15" cy="81" rx="22" ry="10" transform="rotate(22 15 81)" fill="#74e1b4"/>
      </g>)}
      <path d="M150 570 Q640 460 1120 570" fill="none" stroke="#9cf5bf" strokeWidth="6" opacity=".5"/>
    </g>}
    {stage===4&&<g>
      <path d="M80 625 L420 280 L540 390 L540 680 H80Z" fill="#2d427c" opacity=".75"/>
      <path d="M1210 625 L862 280 L742 390 L742 680 H1210Z" fill="#2d427c" opacity=".75"/>
      <g transform="translate(640 348)" fill="none" stroke="#c8fcff" strokeWidth="6" filter="url(#nvs-halo)">
        <circle r="62" opacity=".8"/><circle r="101" opacity=".45"/><circle r="145" opacity=".27"/>
        <path d="M-24 -24 Q0 -52 24 -24 L24 24 Q0 53 -24 24Z" fill="#c8f5ff" fillOpacity=".15"/>
      </g>
      <path d="M530 585 Q645 530 750 585" fill="none" stroke="#82efff" strokeWidth="9" opacity=".4"/>
    </g>}
    {stage===5&&<g transform="translate(650 360)" filter="url(#nvs-halo)">
      <circle r="184" fill="url(#nvs-light)" opacity=".65"/>
      <circle r="154" fill="#265798" fillOpacity=".35" stroke="url(#nvs-gold)" strokeWidth="19"/>
      <circle r="140" fill="none" stroke="#fff2c1" strokeWidth="2" strokeDasharray="11 7"/>
      <circle r="120" fill="#93ebf2" fillOpacity=".18" stroke="#a0edfa" strokeWidth="5"/>
      <circle r="93" fill="#effffd" fillOpacity=".22" stroke="#eeffff" strokeWidth="3"/>
      <path d="M0 -105 L24 -30 L100 0 L24 30 L0 105 L-24 30 L-100 0 L-24 -30Z"
        fill="#c9f8ff" fillOpacity=".24" stroke="#ddffff" strokeWidth="3"/>
      {[0,1,2,3,4,5].map(i=><g key={i} transform={`rotate(${i*60}) translate(0,-152)`}>
        <path d="M0 -20 L15 0 L0 20 L-15 0Z" fill="url(#nvs-gem)" stroke="#fff3b0" strokeWidth="2"/>
      </g>)}
      <circle r="44" fill="#f3ffff" opacity=".27"/>
    </g>}
    <path d="M0 0 H1280 V680 H0Z" fill="none" stroke="#f3ffff" opacity=".08" strokeWidth="30"/>
  </svg>;
}

export function ValleyMilestone({stage,completed,total,active=false}:{stage:NumberStage;completed:number;total:number;active?:boolean}){
  if(stage===2)return <div className="nv-milestone nv-bridge-track" role="img" aria-label={`Işık Köprüsü: ${completed} / ${total} taş aydınlandı`}>
    {Array.from({length:Math.min(total,9)},(_,i)=><span key={i} className={i<completed?'nv-bridge-lit':'nv-bridge-dim'} aria-hidden="true">⬡</span>)}
  </div>;
  if(stage===5)return <div className="nv-milestone nv-portal-track" role="img" aria-label={`Portal enerjisi: ${completed} / ${total}`}>
    <div className="nv-portal-dial"><span aria-hidden="true">✦</span></div>
    <span className="nv-portal-meter">Portal enerjisi %{total?Math.round(100*completed/total):0}</span>
  </div>;
  if(stage===4)return <div className={`nv-milestone nv-echo-track ${active?'nv-echo-active':''}`} aria-hidden="true">
    {Array.from({length:13},(_,i)=><span key={i} style={{height:`${14+((i*37)%38)}px`,animationDelay:`${i*.12}s`}}/>)}
  </div>;
  return null;
}
