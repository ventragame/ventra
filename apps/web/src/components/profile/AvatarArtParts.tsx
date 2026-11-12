import React from 'react';

/** Tiny reusable facial details. Bodies, heads and props belong to each character,
 * not a shared recolorable mannequin. All coordinates target 180x180 SVG units. */
export const INK='#334267';
export function Eyes({x1=71,x2=109,y=86,r=7,iris=INK,expression='open'}:{
 x1?:number;x2?:number;y?:number;r?:number;iris?:string;
 expression?:'open'|'shy'|'excited'|'sleepy'
}){
 if(expression==='sleepy')return <g fill="none" stroke={iris} strokeWidth="4.2" strokeLinecap="round">
  <path d={`M${x1-r-2} ${y}q${r+2} 8 ${2*r+4} 0`}/>
  <path d={`M${x2-r-2} ${y}q${r+2} 8 ${2*r+4} 0`}/>
 </g>;
 return <g>
  {[x1,x2].map((x,i)=><g key={i}>
   <ellipse cx={x} cy={y} rx={r+3} ry={expression==='shy'?r+3:r+7} fill="#fffdfa"/>
   <ellipse cx={x+1} cy={y+2} rx={r*.78} ry={expression==='shy'?r:r+4} fill={iris}/>
   <circle cx={x-2} cy={y-3} r={Math.max(2,r*.42)} fill="white"/>
   {expression==='excited'&&<path d={`M${x-r} ${y-r-9}l-3 -5`} stroke="#3c4560" strokeWidth="2.7" strokeLinecap="round"/>}
  </g>)}
 </g>;
}
export function Smile({x=90,y=115,width=23,color='#8e4e68',open=false}:{
 x?:number;y?:number;width?:number;color?:string;open?:boolean
}){
 return open
  ? <g><path d={`M${x-width/2} ${y-5}Q${x} ${y+width*.9} ${x+width/2} ${y-5}Q${x} ${y+3} ${x-width/2} ${y-5}Z`} fill={color}/>
   <path d={`M${x-5} ${y+12}q5 -5 10 0`} stroke="#f8a5ad" strokeWidth="3" fill="none" strokeLinecap="round"/></g>
  : <path d={`M${x-width/2} ${y}Q${x} ${y+width*.66} ${x+width/2} ${y}`}
    stroke={color} strokeWidth="4" strokeLinecap="round" fill="none"/>;
}
export function Cheeks({y=108,color='#ff9dac'}:{y?:number;color?:string}){
 return <g fill={color} opacity=".66"><ellipse cx="53" cy={y} rx="11" ry="5"/><ellipse cx="128" cy={y} rx="11" ry="5"/></g>;
}
export function HumanFace({skin='#f2c5a3',hair='#604634',shape='round',mood='open',eyesY=88}:{
 skin?:string;hair?:string;shape?:'round'|'long'|'heart';mood?:'open'|'shy'|'excited'|'sleepy';eyesY?:number
}){
 const facePath=shape==='long'
  ?'M50 65Q52 38 90 38Q132 36 133 69L125 111Q117 136 91 138Q62 133 54 111Z'
  :shape==='heart'
  ?'M45 74Q43 40 90 37Q139 40 135 74Q129 114 91 137Q51 116 45 74Z'
  :'M43 81Q42 38 90 38Q139 38 138 81Q139 125 90 137Q42 123 43 81Z';
 return <g>
  <path d={facePath} fill={skin} stroke="#b37a70" strokeOpacity=".45" strokeWidth="3"/>
  <path d="M50 72Q50 44 77 41Q97 33 117 49" stroke="#fff6df" strokeOpacity=".23" strokeWidth="8" fill="none"/>
  <Eyes y={eyesY} expression={mood}/>
  <Cheeks/>
  <ellipse cx="90" cy="111" rx="5" ry="3.5" fill="#dd917c"/>
  <Smile y={119} open={mood==='excited'}/>
 </g>;
}
export function RoundedPaws({fill='#f9f0e9',stroke='#937a78',y=146}:{
 fill?:string;stroke?:string;y?:number
}){
 return <g fill={fill} stroke={stroke} strokeWidth="3.5">
  <ellipse cx="45" cy={y} rx="18" ry="13" transform={`rotate(15 45 ${y})`}/>
  <ellipse cx="136" cy={y} rx="18" ry="13" transform={`rotate(-15 136 ${y})`}/>
 </g>;
}
export function SmallStar({x=130,y=38,s=1,color='#fff4af'}:{x?:number;y?:number;s?:number;color?:string}){
 return <path d="M0 -11L3 -3L11 0L3 3L0 11L-3 3L-11 0L-3 -3Z"
  transform={`translate(${x} ${y}) scale(${s})`} fill={color} stroke="#fffdf4" strokeWidth="1.1"/>;
}
