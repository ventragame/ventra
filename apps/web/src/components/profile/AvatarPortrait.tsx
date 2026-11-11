'use client';

import React,{useId} from 'react';
import {getAvatarById} from '@ventra/shared';

type Props={id:string;className?:string;size?:number};

const cats=new Set(['avatar_cat','avatar_astro_cat','avatar_moon_fox','avatar_fox']);
const rounded=new Set(['avatar_panda','avatar_koala','avatar_otter','avatar_bear','avatar_lion']);
const animals=new Set([
 'avatar_owl','avatar_fox','avatar_rabbit','avatar_panda','avatar_dragon','avatar_unicorn',
 'avatar_lion','avatar_cat','avatar_koala','avatar_otter','avatar_penguin','avatar_deer',
 'avatar_bear','avatar_phoenix','avatar_moon_fox','avatar_astro_cat'
]);
const machines=new Set(['avatar_robot','avatar_cyborg','avatar_satellite']);
const elements=new Set(['avatar_cloud','avatar_star_sprite','avatar_planet','avatar_alien']);
const SKIN:Record<string,string>={
 avatar_owl:'#dcc3f3',avatar_fox:'#ed9e64',avatar_rabbit:'#fff0fb',
 avatar_panda:'#fafbfd',avatar_dragon:'#53c9b8',avatar_unicorn:'#fff0fa',
 avatar_lion:'#eac07b',avatar_cat:'#f7bd9e',avatar_koala:'#cbd6e0',
 avatar_otter:'#b97952',avatar_penguin:'#f6f8fa',avatar_deer:'#dfb084',
 avatar_bear:'#bd8b69',avatar_phoenix:'#ffc36b',avatar_moon_fox:'#e0c3fa',
 avatar_astro_cat:'#e6d8f7',avatar_alien:'#acdfb3',
 avatar_adventurer:'#f7c99f',avatar_inventor:'#b98261',
 avatar_painter:'#e9b38d',avatar_musician:'#b98166',avatar_gardener:'#ebbd91',
 avatar_diver:'#ad795f',avatar_mermaid:'#cf9476',
 avatar_fairy:'#d4a47a',avatar_cosmic:'#995e43'
};
const HAIR:Record<string,string>={
 avatar_explorer:'#704835',avatar_adventurer:'#a15434',avatar_inventor:'#342e4b',
 avatar_painter:'#4c343c',avatar_musician:'#3f3444',avatar_gardener:'#92532c',
 avatar_diver:'#49302c',avatar_mermaid:'#5c3a8d',avatar_fairy:'#ae77c8',
 avatar_cosmic:'#373a75',avatar_princess:'#b87940',avatar_astronaut:'#65433a',
 avatar_wizard:'#6a4e4d'
};

/** Original vector portraits: differentiated silhouettes, faces, costumes, and
 * accessories rather than merely changing hues of one emoji. Offline and crisp
 * at every resolution, with no external requests or user-uploaded images. */
export function AvatarPortrait({id,className='',size=96}:Props){
 const avatar=getAvatarById(id);
 const uid=useId().replace(/:/g,'');
 const sky=uid+'sky',face=uid+'face',costume=uid+'costume',halo=uid+'halo';
 const animal=animals.has(id),machine=machines.has(id),element=elements.has(id);
 const isCat=cats.has(id),round=rounded.has(id),owl=id==='avatar_owl';
 const isBird=id==='avatar_phoenix'||id==='avatar_penguin';
 const flesh=SKIN[id]??'#f3c49b',hair=HAIR[id]??'#634936';
 const pupil=machine?'#c8ffff':id==='avatar_alien'?'#176167':'#273356';
 const ink='#283251',isFantasy=avatar.collection==='fantasy';
 const isRobot=machine;
 return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"
   width={size} height={size} className={className} role="img"
   aria-label={avatar.name} focusable="false"
   style={{display:'block',maxWidth:'100%',maxHeight:'100%',overflow:'hidden'}}>
  <defs>
   <radialGradient id={sky} cx="36%" cy="18%" r="95%">
    <stop offset="0" stopColor={avatar.accentColor}/>
    <stop offset=".57" stopColor={avatar.bgColor}/>
    <stop offset="1" stopColor="#141844"/>
   </radialGradient>
   <linearGradient id={face} x1=".1" y1="0" x2=".95" y2="1">
    <stop stopColor="#ffffff" stopOpacity=".62"/>
    <stop offset=".18" stopColor={flesh}/>
    <stop offset=".7" stopColor={flesh}/>
    <stop offset="1" stopColor={avatar.bgColor}/>
   </linearGradient>
   <linearGradient id={costume} x1="0" y1="0" x2="1" y2="1">
    <stop stopColor={avatar.accentColor}/>
    <stop offset=".4" stopColor={avatar.bgColor}/>
    <stop offset="1" stopColor="#1a325c"/>
   </linearGradient>
   <radialGradient id={halo}>
    <stop stopColor="#ffffff" stopOpacity=".53"/>
    <stop offset="1" stopColor="#ffffff" stopOpacity="0"/>
   </radialGradient>
  </defs>
  <rect x="2" y="2" width="176" height="176" rx="39" fill={'url(#'+sky+')'}/>
  <ellipse cx="85" cy="74" rx="87" ry="88" fill={'url(#'+halo+')'}/>
  {avatar.collection==='space'&&<g stroke="#f1ffff" fill="none" opacity=".35">
   <ellipse cx="90" cy="90" rx="78" ry="52" transform="rotate(-25 90 90)"/>
   <ellipse cx="90" cy="90" rx="48" ry="77" transform="rotate(22 90 90)"/>
  </g>}
  {isFantasy&&<path d="M0 138Q44 104 92 136T180 125V180H0Z" fill="#edbcfd" opacity=".18"/>}
  <g fill="#fff8d2" opacity=".89">
   <path d="M28 26L31 34L40 38L31 42L28 50L25 42L16 38L25 34Z"/>
   <circle cx="147" cy="29" r="3"/>
   <circle cx="24" cy="115" r="2"/>
   <path d="M147 109l2.5 7 7 2.5-7 2.5-2.5 7-2.5-7-7-2.5 7-2.5Z"/>
  </g>
  <ellipse cx="90" cy="163" rx="57" ry="13" fill="#0c214d" opacity=".3"/>
  {/* Back attachments, each drawn behind the character's face. */}
  {id==='avatar_fairy'&&<g fill="#cafef4" fillOpacity=".64" stroke="#f8f5ff" strokeWidth="2">
   <ellipse cx="44" cy="108" rx="20" ry="44" transform="rotate(-26 44 108)"/>
   <ellipse cx="139" cy="107" rx="20" ry="44" transform="rotate(25 139 107)"/>
  </g>}
  {id==='avatar_mermaid'&&<path d="M56 135Q20 113 15 159Q36 155 54 176Q80 160 75 147Z" fill="#6de9d5" stroke="#d5ffff" strokeWidth="3"/>}
  {id==='avatar_phoenix'&&<g fill="#ffbe65" stroke="#ffe9a0" strokeWidth="3">
   <path d="M51 109Q4 109 10 46Q32 68 51 60Q34 90 51 109Z"/>
   <path d="M128 109Q170 95 168 44Q145 68 129 61Q141 83 128 109Z"/>
  </g>}
  {/* Body and collar */}
  <path d="M18 171Q20 126 51 123Q70 112 91 114Q119 115 132 123Q164 132 161 171Z"
   fill={'url(#'+costume+')'} stroke="#e6faff" strokeOpacity=".77" strokeWidth="3"/>
  <path d="M65 121Q88 143 114 121" fill="none" stroke="#fff6da" strokeWidth="6" strokeLinecap="round" opacity=".8"/>
  <ellipse cx="90" cy="147" rx="7" ry="7" fill="#ffecab" stroke="#ffffff" strokeWidth="2"/>
  {machine&&<g>
   {id==='avatar_satellite'&&<><rect x="6" y="61" width="35" height="41" rx="4" fill="#285fa1" stroke="#b0faff" strokeWidth="4"/><rect x="138" y="61" width="35" height="41" rx="4" fill="#285fa1" stroke="#b0faff" strokeWidth="4"/>
    {[18,30].map((x,i)=><g key={i}><path d={'M'+x+' 65V99'} stroke="#73bbf2" strokeWidth="2"/><path d={'M'+(x+120)+' 65V99'} stroke="#73bbf2" strokeWidth="2"/></g>)}</>}
   <rect x="39" y="40" width="103" height="102" rx={id==='avatar_cyborg'?34:26} fill="#bcecf7" stroke="#4e91bc" strokeWidth="7"/>
   <rect x="49" y="59" width="83" height="55" rx="16" fill="#20396e" stroke="#8fdffa" strokeWidth="4"/>
   <path d="M67 44V31" stroke="#9feef1" strokeWidth="5"/><circle cx="67" cy="25" r="8" fill="#ffe7a6" stroke="#fdfaff" strokeWidth="3"/>
   {id==='avatar_cyborg'&&<path d="M95 43L139 52L141 117L119 142L99 126Z" fill="#5c8cae" opacity=".79"/>}
  </g>}
  {element&&<>
   {id==='avatar_cloud'&&<path d="M36 119Q15 117 18 95Q18 77 36 70Q33 45 57 40Q75 20 100 39Q131 33 139 61Q169 66 157 96Q166 123 139 130Q99 143 59 133Z" fill="#f4ffff" stroke="#b4e8ff" strokeWidth="5"/>}
   {id==='avatar_star_sprite'&&<path d="M90 13L113 51L157 55L128 90L139 137L90 112L42 137L52 90L22 55L68 50Z" fill="#fff1af" stroke="#fffefa" strokeWidth="5"/>}
   {id==='avatar_planet'&&<><circle cx="90" cy="87" r="51" fill="#d0a9f6" stroke="#ffe6bb" strokeWidth="5"/><ellipse cx="90" cy="87" rx="76" ry="29" transform="rotate(-24 90 87)" fill="none" stroke="#ffe1a5" strokeWidth="11" opacity=".8"/></>}
   {id==='avatar_alien'&&<><path d="M59 51Q63 19 84 21Q116 15 121 49" fill="none" stroke="#90dab7" strokeWidth="5"/><circle cx="84" cy="19" r="9" fill="#f6ffb5"/>
     <ellipse cx="90" cy="89" rx="51" ry="52" fill="#b5f5b7" stroke="#71b7a2" strokeWidth="4"/></>}
  </>}
  {animal&&<>
   {isCat&&<g fill={flesh} stroke={avatar.bgColor} strokeWidth="5">
    <path d="M43 78L27 28L79 52Z"/><path d="M103 53L152 27L135 81Z"/>
    <path d="M48 58L38 41L65 55M117 54L142 40L130 66" fill="#ffbdcb" stroke="none"/>
   </g>}
   {rounded&&<g fill={id==='avatar_panda'?'#33405b':flesh} stroke={avatar.bgColor} strokeWidth="5">
    <circle cx="47" cy="52" r={id==='avatar_koala'?27:23}/>
    <circle cx="135" cy="52" r={id==='avatar_koala'?27:23}/>
   </g>}
   {id==='avatar_rabbit'&&<g fill="#fff0fb" stroke="#c2a0df" strokeWidth="5">
    <ellipse cx="57" cy="38" rx="17" ry="42" transform="rotate(-15 57 38)"/>
    <ellipse cx="121" cy="38" rx="17" ry="42" transform="rotate(17 121 38)"/>
    <ellipse cx="56" cy="37" rx="7" ry="28" transform="rotate(-15 56 37)" fill="#ffb6d8" stroke="none"/>
    <ellipse cx="120" cy="37" rx="7" ry="28" transform="rotate(17 120 37)" fill="#ffb6d8" stroke="none"/>
   </g>}
   {id==='avatar_deer'&&<g fill="none" stroke="#eac393" strokeWidth="7" strokeLinecap="round">
    <path d="M63 60L45 28L33 18M45 28L21 30M45 28L51 13"/>
    <path d="M119 60L137 28L149 16M137 28L158 30M137 28L131 13"/>
   </g>}
   {id==='avatar_owl'&&<path d="M40 68L44 24L68 44Q91 30 112 44L137 25L140 74" fill="#9273c9" stroke="#dbb5fa" strokeWidth="4"/>}
   {id==='avatar_dragon'&&<g fill="#ffdf94" stroke="#b4aa64" strokeWidth="4">
    <path d="M45 69L31 28L61 48Z"/><path d="M112 49L145 27L134 73Z"/><path d="M76 42L90 10L101 43Z"/>
   </g>}
   {id==='avatar_unicorn'&&<><path d="M83 54L99 7L109 55" fill="#ffe4a4" stroke="#f9f4d2" strokeWidth="5"/>
    <path d="M48 68L30 35L70 47M115 48L154 35L137 71" fill="#f8e8fe" stroke="#c8a8e8" strokeWidth="5"/></>}
   {id==='avatar_phoenix'&&<path d="M45 70L52 27L76 42L89 6L105 40L135 26L136 74" fill="#ffd45c" stroke="#fc8664" strokeWidth="5"/>}
   {id==='avatar_penguin'&&<path d="M38 95Q27 40 72 35Q113 23 139 72L148 122Q99 147 43 124Z" fill="#3c4e71"/>}
   {id==='avatar_lion'&&<ellipse cx="91" cy="87" rx="60" ry="65" fill="#d79050" stroke="#f9ca70" strokeWidth="6"/>}
   <ellipse cx="90" cy="92" rx={id==='avatar_owl'?55:50} ry="50" fill={'url(#'+face+')'}
     stroke={avatar.bgColor} strokeOpacity=".52" strokeWidth="3"/>
   {id==='avatar_panda'&&<><ellipse cx="67" cy="87" rx="20" ry="24" fill="#2c3d53"/><ellipse cx="110" cy="87" rx="20" ry="24" fill="#2c3d53"/></>}
   {id==='avatar_penguin'&&<path d="M51 82Q92 52 132 80Q136 125 90 141Q51 123 51 82Z" fill="#fffaf1" opacity=".73"/>}
   {id==='avatar_owl'&&<g fill="#faf5ff"><ellipse cx="65" cy="88" rx="26" ry="29"/><ellipse cx="111" cy="88" rx="26" ry="29"/></g>}
  </>}
  {!animal&&!machine&&!element&&<>
   {id==='avatar_mermaid'&&<path d="M43 124Q20 51 56 33Q99 9 130 55L140 130Q111 107 90 127Q63 112 43 124Z" fill="#875aa8"/>}
   {id==='avatar_fairy'&&<path d="M45 111Q26 44 69 36Q95 17 129 55L131 128Q105 106 90 120Z" fill="#b87cbe"/>}
   {id==='avatar_princess'&&<ellipse cx="92" cy="86" rx="54" ry="60" fill="#c89459"/>}
   {id==='avatar_cosmic'&&<ellipse cx="91" cy="84" rx="57" ry="60" fill="#343e87" stroke="#b6b2f8" strokeWidth="6"/>}
   {id==='avatar_astronaut'&&<ellipse cx="90" cy="85" rx="58" ry="60" fill="#d3f1ff" stroke="#91cced" strokeWidth="7"/>}
   <ellipse cx="90" cy="91" rx="46" ry="51" fill={'url(#'+face+')'} stroke="#f8dec9" strokeOpacity=".48" strokeWidth="3"/>
   <path d="M43 72Q34 27 72 29Q103 16 128 60Q107 53 97 46Q65 69 43 72Z" fill={hair}/>
   {id==='avatar_astronaut'&&<path d="M42 59Q90 27 138 61" stroke="#daeffe" strokeWidth="7" fill="none"/>}
  </>}
  {/* Facial expression. Larger highlights improve legibility at HUD size. */}
  <g>
   {isRobot?<><rect x="57" y="79" width="25" height="19" rx="8" fill="#95fff4"/><rect x="103" y="79" width="25" height="19" rx="8" fill="#95fff4"/></>:
    <><ellipse cx="67" cy="89" rx={owl?12:10} ry="15" fill="#fffdf7"/><ellipse cx="110" cy="89" rx={owl?12:10} ry="15" fill="#fffdf7"/>
    <ellipse cx="69" cy="92" rx="6.8" ry="10" fill={pupil}/><ellipse cx="108" cy="92" rx="6.8" ry="10" fill={pupil}/>
    <circle cx="66" cy="86" r="3.5" fill="#fff"/><circle cx="106" cy="86" r="3.5" fill="#fff"/></>}
   {!machine&&!element&&<><ellipse cx="52" cy="112" rx="10" ry="4.5" fill="#f79caf" opacity=".6"/>
     <ellipse cx="125" cy="112" rx="10" ry="4.5" fill="#f79caf" opacity=".6"/></>}
   {owl||isBird?<path d="M82 108L96 108L89 122Z" fill="#ffe29b" stroke="#de9e76" strokeWidth="2"/>:
    <><ellipse cx="88" cy="110" rx={animal?9:5} ry={animal?6:4} fill={animal?'#6e5a69':'#d89380'}/>
     <path d="M78 120Q90 131 101 120" fill="none" stroke={isRobot?'#9df9e8':'#904763'} strokeWidth="4" strokeLinecap="round"/></>}
  </g>
  {/* Signature costume and silhouette details: unique per character. */}
  {id==='avatar_explorer'&&<><path d="M37 63Q64 29 120 44L129 64Q85 76 37 63Z" fill="#c67d4b" stroke="#f9d69a" strokeWidth="4"/>
    <path d="M28 65Q82 49 139 64" stroke="#ffe6a8" strokeWidth="9" strokeLinecap="round"/></>}
  {id==='avatar_adventurer'&&<><path d="M39 62Q48 23 92 25Q125 26 138 59L117 70Q84 59 48 74Z" fill="#edab59" stroke="#ffe6ac" strokeWidth="4"/>
    <path d="M37 71Q90 52 144 69" stroke="#f3cf81" strokeWidth="9"/></>}
  {id==='avatar_inventor'&&<g stroke="#c5f0ff" strokeWidth="4" fill="none"><circle cx="67" cy="91" r="18"/><circle cx="112" cy="91" r="18"/><path d="M85 91H94M42 84L53 89M126 88L139 83"/></g>}
  {id==='avatar_painter'&&<><path d="M40 61Q40 27 71 27Q78 12 102 26Q137 33 131 60Z" fill="#bf6382" stroke="#ffe0cb" strokeWidth="4"/>
    <path d="M31 61Q93 47 143 65" stroke="#efabc4" strokeWidth="7" fill="none"/></>}
  {id==='avatar_musician'&&<g fill="none" stroke="#e6c8ff" strokeWidth="9">
    <path d="M37 93V77Q37 34 90 32Q143 34 143 78V95"/><path d="M37 78H49V106H37ZM132 78H145V106H132Z" fill="#8a60b7"/></g>}
  {id==='avatar_gardener'&&<><path d="M43 58Q91 18 134 60" fill="none" stroke="#55ae7e" strokeWidth="9"/>
    {[50,69,90,111,130].map((x,i)=><g key={i}><circle cx={x} cy={i%2?38:46} r="8" fill={i%2?'#ffd78e':'#f6adca'}/><circle cx={x} cy={i%2?38:46} r="3" fill="#fffdf1"/></g>)}</>}
  {id==='avatar_diver'&&<><rect x="43" y="75" width="93" height="35" rx="16" fill="#82e6ed" fillOpacity=".42" stroke="#d6faff" strokeWidth="6"/>
    <path d="M136 91H153V132" fill="none" stroke="#f7dfa4" strokeWidth="6"/></>}
  {id==='avatar_wizard'&&<><path d="M37 65L80 6L101 45L127 67Z" fill="#7654bb" stroke="#e4b8ff" strokeWidth="5"/><path d="M26 67Q88 50 151 68" stroke="#c18ef4" strokeWidth="9" fill="none"/>
    <path d="M82 24L86 32L95 35L86 38L82 47L79 38L70 35L79 32Z" fill="#fff6b4"/></>}
  {id==='avatar_princess'&&<><path d="M53 45L47 21L70 31L90 12L109 32L134 21L125 46Z" fill="#ffe295" stroke="#fff7dc" strokeWidth="4"/><circle cx="89" cy="35" r="5" fill="#9deae9"/></>}
  {id==='avatar_fairy'&&<path d="M77 41L90 18L102 41M90 18L90 9" fill="none" stroke="#fff3be" strokeWidth="5"/>}
  {id==='avatar_mermaid'&&<><path d="M40 78Q49 40 70 39Q55 73 40 78M129 74Q117 38 103 39Q124 63 129 74" fill="#65c4c6"/>
    <circle cx="127" cy="62" r="8" fill="#fff2bb"/><circle cx="119" cy="54" r="3" fill="#fff"/></>}
  {id==='avatar_unicorn'&&<path d="M44 63Q67 31 110 44L134 62" fill="none" stroke="#c593df" strokeWidth="12"/>}
  {id==='avatar_astro_cat'&&<><ellipse cx="90" cy="91" rx="63" ry="65" fill="none" stroke="#c5eafa" strokeWidth="8"/><path d="M48 57Q88 32 130 58" stroke="#fff6d0" strokeWidth="5" fill="none"/></>}
  {id==='avatar_moon_fox'&&<><path d="M124 31A28 28 0 1 0 144 52Q115 57 124 31Z" fill="#fff4c2"/><path d="M53 129Q88 148 128 129" stroke="#ead3ff" strokeWidth="5" fill="none"/></>}
  {id==='avatar_koala'&&<ellipse cx="90" cy="109" rx="13" ry="17" fill="#505c6d"/>}
  {id==='avatar_otter'&&<g stroke="#fff3dc" strokeWidth="2"><path d="M74 111L44 105M74 116L43 117M105 111L132 106M105 116L134 118"/></g>}
  {id==='avatar_deer'&&<g fill="#ffe6bb"><circle cx="58" cy="56" r="3"/><circle cx="121" cy="56" r="3"/><circle cx="90" cy="49" r="3"/></g>}
  {id==='avatar_penguin'&&<path d="M63 136Q90 149 116 136" fill="none" stroke="#c0edfa" strokeWidth="6"/>}
  {id==='avatar_bear'&&<path d="M72 127Q91 137 108 127" stroke="#ffe6b6" strokeWidth="7" strokeLinecap="round"/>}
  {id==='avatar_phoenix'&&<circle cx="89" cy="32" r="8" fill="#fff2bd"/>}
  {id==='avatar_star_sprite'&&<path d="M91 26L96 42L113 44L101 56L105 71L91 62L76 71L80 56L68 44L85 42Z" fill="#fffce1" opacity=".6"/>}
  {id==='avatar_cloud'&&<><circle cx="49" cy="79" r="12" fill="#f6ffff"/><circle cx="133" cy="79" r="12" fill="#f6ffff"/></>}
  {id==='avatar_satellite'&&<path d="M90 31V17" stroke="#e7faff" strokeWidth="5"/>}
  {id==='avatar_cyborg'&&<path d="M117 60V119M128 73V106" stroke="#9dfaf2" strokeWidth="4" fill="none"/>}
  {id==='avatar_cosmic'&&<><path d="M40 64Q88 37 142 64" fill="none" stroke="#a4bdff" strokeWidth="7"/><circle cx="90" cy="31" r="5" fill="#fff2be"/></>}
  {id==='avatar_planet'&&<circle cx="126" cy="64" r="10" fill="#ffeeab" opacity=".7"/>}
  {id==='avatar_lion'&&<path d="M59 46L76 33L89 45L104 28L122 50" fill="none" stroke="#f5c56d" strokeWidth="8"/>}
  <path d="M19 21Q63 -3 98 14" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" fill="none" opacity=".25"/>
  <rect x="2" y="2" width="176" height="176" rx="39" fill="none" stroke="#ffffff" strokeOpacity=".4" strokeWidth="2"/>
 </svg>;
}
