'use client';

import React,{useId} from 'react';
import {getAvatarById} from '@ventra/shared';
import {HERO_ART} from './AvatarArtHeroes';
import {ANIMAL_ART} from './AvatarArtAnimals';
import {FANTASY_ART} from './AvatarArtFantasy';
import {SPACE_ART} from './AvatarArtSpace';

type Props={id:string;className?:string;size?:number};

/**
 * Distinctive, handmade 36-character artwork.
 *
 * This renderer owns only the frame/lighting. Every CHARACTER is built as an
 * independent silhouette in its own family module; a name or a recolored
 * common face can no longer masquerade as a new collectible.
 *
 * No external image requests; works on mobile/offline and in React SSR.
 */
export const VENTRA_AVATAR_ART={
 ...HERO_ART,...ANIMAL_ART,...FANTASY_ART,...SPACE_ART
} as const;

export function AvatarPortrait({id,className='',size=96}:Props){
 const avatar=getAvatarById(id);
 const unique=useId().replace(/:/g,'');
 const sky=unique+'sky',glow=unique+'glow',beam=unique+'beam',clip=unique+'clip';
 const art=VENTRA_AVATAR_ART[avatar.id as keyof typeof VENTRA_AVATAR_ART]??VENTRA_AVATAR_ART.avatar_explorer;
 return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"
   width={size} height={size} className={className} role="img"
   aria-label={avatar.name} data-avatar-id={avatar.id} focusable="false"
   style={{display:'block',maxWidth:'100%',maxHeight:'100%',overflow:'hidden'}}>
   <defs>
    <radialGradient id={sky} cx="36%" cy="19%" r="94%">
     <stop stopColor={avatar.accentColor} stopOpacity=".91"/>
     <stop offset=".61" stopColor={avatar.bgColor}/>
     <stop offset="1" stopColor="#132348"/>
    </radialGradient>
    <radialGradient id={glow} cx="50%" cy="40%" r="58%">
     <stop stopColor="#fffdf0" stopOpacity=".36"/>
     <stop offset="1" stopColor="#ffffff" stopOpacity="0"/>
    </radialGradient>
    <linearGradient id={beam} x1="0%" y1="0%" x2="100%" y2="100%">
     <stop stopColor="#ffffff" stopOpacity=".35"/>
     <stop offset=".33" stopColor="#ffffff" stopOpacity="0"/>
     <stop offset="1" stopColor="#122c65" stopOpacity=".15"/>
    </linearGradient>
    <clipPath id={clip}><rect x="2" y="2" width="176" height="176" rx="38"/></clipPath>
   </defs>
   <g clipPath={'url(#'+clip+')'}>
    <rect x="2" y="2" width="176" height="176" rx="38" fill={'url(#'+sky+')'}/>
    <circle cx="86" cy="84" r="84" fill={'url(#'+glow+')'}/>
    <ellipse cx="87" cy="169" rx="78" ry="24" fill="#102b55" opacity=".21"/>
    <g fill="#fffdf1" opacity=".8">
     <circle cx="26" cy="33" r="2.1"/><circle cx="151" cy="41" r="2.3"/>
     <path d="M24 108l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/>
    </g>
    {art}
    <path d="M13 21Q62 -7 106 12" fill="none" stroke="#ffffff" strokeWidth="8"
      opacity=".24" strokeLinecap="round"/>
    <rect x="2" y="2" width="176" height="176" rx="38" fill={'url(#'+beam+')'}/>
   </g>
   <rect x="2" y="2" width="176" height="176" rx="38"
     stroke="#ffffff" strokeOpacity=".49" strokeWidth="2.5" fill="none"/>
 </svg>;
}
