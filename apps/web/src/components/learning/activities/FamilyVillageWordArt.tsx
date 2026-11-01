'use client';
import React from 'react';
import {villageWord} from '@/lib/learning/familyVillageEngine';

/** Simple original offline SVG pictograms for objects that have misleading/no emoji equivalents. */
export function FamilyWordArt({id}:{id:string}){
 const item=villageWord(id);
 const custom=['table','wardrobe','carpet','sink','pillow'].includes(id);
 if(!custom)return <span className="fv-emoji-art">{item.icon}</span>;
 return <svg width="94" height="85" viewBox="0 0 100 90" role="img" aria-label={item.tr}
    className="fv-custom-icon" xmlns="http://www.w3.org/2000/svg">
   <ellipse cx="50" cy="79" rx="39" ry="7" fill="#263d48" opacity=".12"/>
   {id==='table'&&<g stroke="#755456" strokeWidth="4" strokeLinejoin="round">
     <path d="M14 35 L24 21 H78 L89 35Z" fill="#deae79"/>
     <rect x="14" y="35" width="75" height="12" rx="4" fill="#f0c28c"/>
     <path d="M27 47 V75 H36 V47 M67 47 V75 H76 V47" fill="#bd855e"/>
     <path d="M24 27 H76" fill="none" stroke="#fff3d6" strokeWidth="3"/>
   </g>}
   {id==='wardrobe'&&<g stroke="#775c63" strokeWidth="4" strokeLinejoin="round">
     <rect x="21" y="8" width="58" height="67" rx="4" fill="#d7a47c"/>
     <path d="M50 10 V73" stroke="#fff0ca" strokeWidth="3"/>
     <rect x="27" y="15" width="17" height="52" rx="2" fill="#efc494"/>
     <rect x="56" y="15" width="17" height="52" rx="2" fill="#efc494"/>
     <circle cx="45" cy="43" r="3" fill="#6e6267" strokeWidth="1"/>
     <circle cx="55" cy="43" r="3" fill="#6e6267" strokeWidth="1"/>
     <path d="M29 76 V80 M70 76 V80" strokeWidth="6" strokeLinecap="round"/>
   </g>}
   {id==='carpet'&&<g strokeWidth="3" strokeLinejoin="round">
     <path d="M10 68 L30 33 L86 48 L65 80Z" fill="#d8a6a0" stroke="#886d86"/>
     <path d="M28 62 L36 44 L70 52 L61 69Z" fill="#c4d9a4" stroke="#f8e6c5"/>
     <path d="M21 67 L26 74 M29 68 L33 78 M60 78 L65 86 M67 76 L74 84" stroke="#e4cdad"/>
     <circle cx="48" cy="57" r="7" fill="#f4dcb5"/>
   </g>}
   {id==='sink'&&<g stroke="#668b9c" strokeLinejoin="round" strokeWidth="4">
     <path d="M39 28 V18 Q39 8 48 8 H52 Q61 8 61 18 V31" fill="none"/>
     <path d="M55 32 H69" strokeLinecap="round"/>
     <path d="M17 41 H83 L73 69 H27Z" fill="#e5f7fa"/>
     <ellipse cx="50" cy="43" rx="33" ry="11" fill="#aad9e2"/>
     <ellipse cx="50" cy="43" rx="21" ry="5" fill="#629eaf" opacity=".4"/>
     <path d="M31 70 V80 M69 70 V80" stroke="#7d9eaa"/>
   </g>}
   {id==='pillow'&&<g stroke="#a18898" strokeLinejoin="round" strokeWidth="4">
     <path d="M24 24 Q50 12 76 24 Q89 26 81 44 Q92 64 76 67 Q50 77 23 67 Q11 64 18 44 Q11 28 24 24Z" fill="#f0cfdf"/>
     <path d="M29 32 Q49 23 69 32 Q79 45 69 59 Q49 68 29 59 Q20 45 29 32Z" fill="#f6e5ed" stroke="#d3b7d0" strokeWidth="2"/>
   </g>}
  </svg>;
}
