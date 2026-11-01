'use client';
import React from 'react';
import type {GardenDistrictId} from './world/gardenTheme';
const palette:Record<GardenDistrictId,[string,string,string]>={
 animals:['#64b79c','#b4e8aa','#ffdd96'],colors:['#8c7acc','#f2b4d8','#87dce5'],
 numbers:['#568fca','#b0edee','#eed2a1'],food:['#d37f75','#f7ca8d','#b9e4b6'],
 family:['#9f86c3','#dec1e7','#ffd9ae'],sanctuary:['#686ba4','#edc48c','#a1dbcd']
};
/** Responsive original SVG mini-landscapes; never require remote images or fonts. */
export function DistrictPreviewArt({id}:{id:GardenDistrictId}){
 const [top,bottom,highlight]=palette[id];
 return <svg className="wg-card-artwork" viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice"
 role="img" aria-label={id==='animals'?'Orman, çayır ve kulübe':id==='colors'?'Renkli kristal korusu':id==='numbers'?'Sayı kristalleri':id==='food'?'Meyve pazarı tezgâhı':id==='family'?'Aile köyü evleri':'Büyülü İngilizce tapınağı'}>
  <defs><linearGradient id={`wg-preview-${id}`} x2="1" y2="1">
   <stop stopColor={top}/><stop offset="1" stopColor={bottom}/></linearGradient></defs>
  <rect width="320" height="150" fill={`url(#wg-preview-${id})`}/>
  <circle cx="250" cy="34" r="35" fill="#fff4cf" opacity=".48"/>
  <path d="M0 125 Q80 92 170 120 Q240 90 320 116 V150 H0Z" fill={highlight} opacity=".53"/>
  <path d="M0 143 Q130 121 320 140 V150 H0Z" fill="#f1e6c6" opacity=".47"/>
  {id==='animals'&&<>
   {[40,77,286].map((x,i)=><g key={i}>
    <path d={`M${x} 123 V75`} stroke="#725c60" strokeWidth="8"/>
    <circle cx={x} cy="67" r="30" fill={i%2?'#8bd293':'#56a989'}/>
    <circle cx={x-12} cy="58" r="13" fill="#b5e8aa"/>
   </g>)}
   <rect x="125" y="72" width="89" height="64" rx="8" fill="#f6d7a4"/>
   <path d="M115 78 L168 30 L225 78Z" fill="#c46f78" stroke="#fff0cb" strokeWidth="5"/>
   <rect x="157" y="101" width="24" height="35" rx="9" fill="#836b71"/>
   <circle cx="99" cy="111" r="6" fill="#ffefce"/><circle cx="236" cy="105" r="5" fill="#ffd791"/>
  </>}
  {id==='colors'&&<>
   {[52,112,172,232,283].map((x,i)=><g key={i}>
    <path d={`M${x} 134 L${x-12} ${92+(i%2)*14} L${x} ${63+(i%3)*12} L${x+14} ${92+(i%2)*14}Z`}
      fill={['#f8b2c9','#b8dcfb','#edce8a','#d3b5f4','#a8e9c2'][i]} stroke="#fff7dd" strokeWidth="4"/>
    <circle cx={x-17} cy={65+(i%2)*9} r="4" fill="#fff1ca"/>
   </g>)}
   <path d="M0 144 Q130 124 320 141" fill="none" stroke="#fff9d5" strokeWidth="7"/>
  </>}
  {id==='numbers'&&<>
   {[72,155,238].map((x,i)=><g key={i}>
    <rect x={x-31} y={70-(i%2)*17} width="62" height={72+(i%2)*17} rx="10" fill="#eff8ee" stroke="#709ec4" strokeWidth="5"/>
    <path d={`M${x-30} ${69-(i%2)*17} L${x} ${28-(i%2)*17} L${x+30} ${69-(i%2)*17}Z`} fill="#9ee8ef" stroke="#f5f1d9" strokeWidth="4"/>
    <text x={x} y={112-(i%2)*10} fontSize="27" fontWeight="900" fill="#4a7193" textAnchor="middle">{[3,7,20][i]}</text>
   </g>)}
  </>}
  {id==='food'&&<>
   <rect x="54" y="81" width="211" height="59" rx="8" fill="#ba7a67"/>
   <path d="M43 80 L62 32 H258 L276 80Z" fill="#f8dec1" stroke="#fff4d8" strokeWidth="4"/>
   {Array.from({length:8},(_,i)=><path key={i} d={`M${63+i*24} 33 L${43+i*29} 79 H${69+i*29} L${87+i*24} 33Z`}
    fill={i%2?'#fff1d1':'#eb8c7f'} opacity=".86"/>)}
   {[88,124,164,207,241].map((x,i)=><g key={i}><ellipse cx={x} cy="103" rx="15" ry="16"
    fill={['#ed7974','#ffcb6e','#c3df91','#f2b26a','#d2697a'][i]}/>
    <path d={`M${x} 92 l4 -9`} stroke="#549576" strokeWidth="3"/></g>)}
   <rect x="65" y="120" width="188" height="14" rx="5" fill="#edc18e"/>
  </>}
  {id==='family'&&<>
   {[[48,86,74,'#f1d9aa','#b77182'],[130,57,91,'#c0e0dc','#947eaf'],[238,90,61,'#f5e2c4','#bb8b99']].map(([x,y,w,wall,roof],i)=><g key={i}>
    <rect x={Number(x)} y={Number(y)} width={Number(w)} height={150-Number(y)} rx="6" fill={String(wall)}/>
    <path d={`M${Number(x)-11} ${Number(y)} L${Number(x)+Number(w)/2} ${Number(y)-42} L${Number(x)+Number(w)+11} ${Number(y)}Z`} fill={String(roof)} stroke="#fff2d8" strokeWidth="5"/>
    <rect x={Number(x)+Number(w)/3} y={Number(y)+30} width={Number(w)/3} height="45" rx="7" fill="#9d8da5"/>
   </g>)}
  </>}
  {id==='sanctuary'&&<>
   <path d="M68 128 V49 L161 9 L250 49 V128" fill="#e6d4b8" stroke="#fff1d6" strokeWidth="10"/>
   <path d="M98 121 V58 Q160 0 220 58 V121Z" fill="#577790" stroke="#c7e7db" strokeWidth="6"/>
   {[79,231].map(x=><g key={x}><rect x={x-14} y="51" width="28" height="86" fill="#f8e9c6"/><rect x={x-20} y="43" width="40" height="16" rx="3" fill="#e4c18a"/></g>)}
   <path d="M160 54 L177 86 L160 113 L142 86Z" fill="#ffe8a2" stroke="#fff9dd" strokeWidth="5"/>
   {[42,280].map(x=><circle key={x} cx={x} cy="52" r="5" fill="#ffe9ae"/>)}
  </>}
 </svg>;
}
