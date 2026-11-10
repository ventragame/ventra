'use client';

import React, {useId} from 'react';
import {getAvatarById} from '@ventra/shared';

type Props={id:string;className?:string;size?:number};

/** 12 original scalable character portraits. Fully offline, no emoji glyph
 * differences between browsers, no external art dependencies, no animations
 * when the visitor prefers reduced motion. Each old avatar ID stays stable. */
export function AvatarPortrait({id,className='',size=96}:Props){
 const avatar=getAvatarById(id);
 const unique=useId().replace(/:/g,'');
 const bg=unique+'bg',fur=unique+'fur',shirt=unique+'shirt',glow=unique+'glow';
 const owl=id==='avatar_owl',fox=id==='avatar_fox',rabbit=id==='avatar_rabbit';
 const panda=id==='avatar_panda',dragon=id==='avatar_dragon',unicorn=id==='avatar_unicorn';
 const lion=id==='avatar_lion',robot=id==='avatar_robot';
 const animal=owl||fox||rabbit||panda||dragon||unicorn||lion;
 const astronaut=id==='avatar_astronaut',wizard=id==='avatar_wizard';
 const princess=id==='avatar_princess';
 const skin=robot?'#d6f8ff':dragon?'#37c7b5':owl?'#dcb6f8':
  fox?'#f6a452':rabbit?'#f9efff':panda?'#fbfafa':unicorn?'#f9e6ff':
  lion?'#f7cb70':princess?'#ffe0bd':'#fbd3a9';
 const dark=robot?'#4a81a3':dragon?'#197f84':owl?'#8664b9':
  fox?'#ca643a':rabbit?'#c5a2e9':panda?'#667589':unicorn?'#d4a2e7':
  lion?'#b67c42':'#ce8b67';
 const fabric=robot?'#5db9cd':astronaut?'#e8faff':wizard?'#7045b4':
  princess?'#ef87c5':panda?'#4969a2':fox?'#4dbdac':dragon?'#5497d3':
  owl?'#5984c2':rabbit?'#b783d6':unicorn?'#bc84c8':lion?'#2d96a4':'#cf8556';
 return <svg viewBox="0 0 160 160" width={size} height={size}
    className={className} role="img" aria-label={avatar.name} focusable="false"
    xmlns="http://www.w3.org/2000/svg" style={{display:'block',maxWidth:'100%',maxHeight:'100%',overflow:'visible'}}>
   <defs>
    <radialGradient id={bg} cx="35%" cy="24%" r="83%">
     <stop stopColor={avatar.accentColor} stopOpacity=".86"/>
     <stop offset=".66" stopColor={avatar.bgColor}/>
     <stop offset="1" stopColor="#142b60"/>
    </radialGradient>
    <linearGradient id={fur} x1="12%" y1="4%" x2="88%" y2="96%">
     <stop stopColor="#ffffff" stopOpacity=".82"/>
     <stop offset=".22" stopColor={skin}/>
     <stop offset=".72" stopColor={skin}/>
     <stop offset="1" stopColor={dark}/>
    </linearGradient>
    <linearGradient id={shirt} x1="0" y1="0" x2="1" y2="1">
     <stop stopColor="#fff8da" stopOpacity=".45"/>
     <stop offset=".25" stopColor={fabric}/>
     <stop offset="1" stopColor="#16416b"/>
    </linearGradient>
    <radialGradient id={glow}><stop stopColor="#fffad6" stopOpacity=".76"/><stop offset="1" stopColor="#fffad6" stopOpacity="0"/></radialGradient>
    <filter id={unique+'shadow'} x="-30%" y="-40%" width="165%" height="185%">
     <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#0c1747" floodOpacity=".32"/>
    </filter>
   </defs>
   <rect x="3" y="3" width="154" height="154" rx="36" fill={'url(#'+bg+')'}/>
   <circle cx="80" cy="67" r="66" fill={'url(#'+glow+')'}/>
   <path d="M10 116Q80 68 150 117V146Q80 170 10 146Z" fill="#e7fffb" opacity=".13"/>
   <g fill="#fff9c9" opacity=".92"><path d="M29 27l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/><circle cx="129" cy="29" r="2.5"/><path d="M124 104l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></g>
   <g filter={'url(#'+unique+'shadow'+')'}>
    <path d="M28 152Q26 113 58 106Q80 95 102 106Q134 112 133 152Z"
      fill={'url(#'+shirt+')'} stroke="#eefbff" strokeWidth="3"/>
    {animal&&<>
     {owl&&<><path d="M43 59L39 19L70 46M91 46L119 20L117 63" fill="#9571ce" stroke="#634eae" strokeWidth="6"/></>}
     {fox&&<><path d="M43 65L26 22L71 46M90 45L134 21L118 72" fill="#f49b50" stroke="#a95031" strokeWidth="6"/>
      <path d="M44 54L36 32L57 48M104 47L123 33L116 57" fill="#fff0d2"/></>}
     {rabbit&&<><ellipse cx="53" cy="40" rx="16" ry="40" transform="rotate(-14 53 40)" fill="#fff6ff" stroke="#cbadf0" strokeWidth="5"/>
       <ellipse cx="106" cy="40" rx="16" ry="40" transform="rotate(15 106 40)" fill="#fff6ff" stroke="#cbadf0" strokeWidth="5"/>
       <ellipse cx="53" cy="39" rx="7" ry="28" transform="rotate(-14 53 39)" fill="#f4abd0"/>
       <ellipse cx="106" cy="39" rx="7" ry="28" transform="rotate(15 106 39)" fill="#f4abd0"/></>}
     {panda&&<><circle cx="44" cy="47" r="21" fill="#2a384d"/><circle cx="118" cy="47" r="21" fill="#2a384d"/></>}
     {dragon&&<><path d="M39 61L30 27L58 43M95 42L121 23L119 68" fill="#ffe49d" stroke="#bca365" strokeWidth="4"/>
       <path d="M72 31L83 9L92 33" fill="#ffd98b"/></>}
     {unicorn&&<><path d="M80 49L89 5L99 49" fill="#ffe08b" stroke="#e7acbc" strokeWidth="4"/>
       <path d="M38 67L31 26L57 51M105 51L131 26L124 66" fill="#fff2fa" stroke="#d8a9df" strokeWidth="5"/>
       <path d="M42 44Q55 24 83 33Q100 25 124 50" fill="none" stroke="#ac7de8" strokeWidth="12"/></>}
     {lion&&<><ellipse cx="80" cy="78" rx="57" ry="63" fill="#ca8041"/><path d="M40 56Q30 29 53 31Q62 12 79 28Q100 9 111 35Q139 33 125 61" fill="#eaa34e"/>
       <circle cx="36" cy="68" r="13" fill="#db9250"/><circle cx="124" cy="68" r="13" fill="#db9250"/></>}
     <ellipse cx="80" cy="81" rx={panda?50:48} ry="47" fill={'url(#'+fur+')'} stroke={dark} strokeWidth="3"/>
     {panda&&<><ellipse cx="58" cy="79" rx="18" ry="22" fill="#3d4956" transform="rotate(12 58 79)"/>
       <ellipse cx="103" cy="79" rx="18" ry="22" fill="#3d4956" transform="rotate(-12 103 79)"/></>}
     {owl&&<><ellipse cx="60" cy="76" rx="25" ry="30" fill="#f9f1ff"/><ellipse cx="100" cy="76" rx="25" ry="30" fill="#f9f1ff"/></>}
     {dragon&&<><ellipse cx="83" cy="105" rx="38" ry="22" fill="#aaf7cf" stroke="#29948f" strokeWidth="2"/>
       <circle cx="70" cy="106" r="3" fill="#3b777d"/><circle cx="100" cy="106" r="3" fill="#3b777d"/></>}
    </>}
    {!animal&&!robot&&<>
     {astronaut&&<><circle cx="80" cy="77" r="57" fill="#d7f0ff" stroke="#a4cde8" strokeWidth="8"/>
       <circle cx="80" cy="78" r="46" fill="#649ad4" stroke="#315a92" strokeWidth="4"/></>}
     {wizard&&<path d="M37 61L64 7L87 44L117 62Z" fill="#7250c3" stroke="#c8a1eb" strokeWidth="4"/>}
     {princess&&<><ellipse cx="80" cy="75" rx="52" ry="57" fill="#c47c4a"/>
       <path d="M47 50Q74 17 113 49L124 83Q100 55 80 59Q65 49 40 85Z" fill="#f2c37a"/></>}
     {!astronaut&&!wizard&&!princess&&<path d="M41 61Q32 29 69 27Q95 21 120 54Q101 51 92 39Q71 59 41 61Z" fill="#684633" stroke="#432c30" strokeWidth="3"/>}
     <ellipse cx="80" cy="84" rx="43" ry="45" fill={'url(#'+fur+')'} stroke="#d48f71" strokeWidth="2"/>
     {!astronaut&&!wizard&&!princess&&<path d="M39 60Q42 21 71 32Q64 48 46 65M79 31Q100 14 120 52Q105 48 89 43" fill="#71472d"/>}
     {wizard&&<><path d="M24 61Q76 48 137 63Q85 81 24 61Z" fill="#5b3fa8" stroke="#e5b3fb" strokeWidth="3"/><circle cx="75" cy="30" r="5" fill="#fff7b5"/></>}
     {princess&&<><path d="M57 44L53 25L70 34L80 18L92 34L110 25L106 44Z" fill="#ffda81" stroke="#fff6d9" strokeWidth="3"/><circle cx="80" cy="36" r="4" fill="#84ffff"/></>}
     {astronaut&&<path d="M38 49Q80 30 119 53" stroke="#dbf6fe" strokeWidth="6" fill="none"/>}
    </>}
    {robot&&<>
     <path d="M41 47Q42 30 60 29H101Q120 29 120 47V111Q120 129 101 129H58Q40 129 40 111Z" fill="#b8e8f5" stroke="#5da0c2" strokeWidth="5"/>
     <rect x="47" y="52" width="67" height="49" rx="17" fill="#213b73" stroke="#c5faff" strokeWidth="4"/>
     <circle cx="80" cy="23" r="9" fill="#ffe19e" stroke="#75bcd8" strokeWidth="4"/>
     <path d="M80 32V38" stroke="#3f80a4" strokeWidth="4"/>
    </>}
    <g>
     <ellipse cx="61" cy="83" rx={owl?13:10} ry="15" fill={robot?'#88f9ff':'#fffaf5'}/>
     <ellipse cx="100" cy="83" rx={owl?13:10} ry="15" fill={robot?'#88f9ff':'#fffaf5'}/>
     <ellipse cx="63" cy="85" rx="6.5" ry="11" fill="#253c63"/>
     <ellipse cx="98" cy="85" rx="6.5" ry="11" fill="#253c63"/>
     <circle cx="60" cy="80" r="3.5" fill="#ffffff"/><circle cx="95" cy="80" r="3.5" fill="#ffffff"/>
    </g>
    {!robot&&<><ellipse cx="47" cy="105" rx="8" ry="4" fill="#f68f9b" opacity=".7"/>
      <ellipse cx="114" cy="105" rx="8" ry="4" fill="#f68f9b" opacity=".7"/></>}
    {owl?<path d="M74 100L86 100L80 115Z" fill="#ffe5a0" stroke="#b9856e" strokeWidth="2"/>:
      <><ellipse cx="80" cy="106" rx={animal?11:5} ry={animal?6:4} fill={robot?'#7ef8f7':animal?'#9e6271':'#e7a98d'}/>
      <path d="M69 115Q80 126 92 114" stroke={robot?'#7ef8f7':'#923b66'} strokeWidth="4" strokeLinecap="round" fill="none"/></>}
    <path d="M53 134Q80 145 109 134" stroke="#fff8d5" strokeOpacity=".65" strokeWidth="4" fill="none"/>
   </g>
   <path d="M26 22Q63 2 97 15" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity=".25" fill="none"/>
   <rect x="3" y="3" width="154" height="154" rx="36" fill="none" stroke="#ffffff" strokeOpacity=".35" strokeWidth="2"/>
  </svg>;
}
