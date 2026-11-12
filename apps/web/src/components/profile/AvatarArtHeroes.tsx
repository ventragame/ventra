import React from 'react';
import {Eyes,Smile,Cheeks,HumanFace,SmallStar} from './AvatarArtParts';

/** Seven fully different silhouettes: ranger, cartographer, tinkerer, artist,
 * drummer, gardener and diver. Their clothing/props are not palette swaps. */
export const HERO_ART:Record<string,React.ReactNode>={
 avatar_explorer:<g>
  <path d="M29 165Q24 130 45 122L67 118Q92 128 114 118L143 129Q155 146 152 168Z" fill="#257d79" stroke="#c8f7ca" strokeWidth="4"/>
  <path d="M46 141L65 120L77 133L109 120L127 141" fill="none" stroke="#f3b15b" strokeWidth="8"/>
  <HumanFace skin="#d79d78" hair="#5a382f" mood="excited"/>
  <path d="M47 64Q47 34 70 30L110 30Q135 40 136 64Z" fill="#d9a05e" stroke="#a7703b" strokeWidth="5"/>
  <path d="M21 69Q93 49 157 69Q92 83 21 69Z" fill="#f2c77e" stroke="#b98348" strokeWidth="4"/>
  <path d="M66 54H116" stroke="#319f91" strokeWidth="9"/>
  <g transform="translate(131 130) rotate(14)"><rect x="-20" y="-12" width="42" height="30" rx="7" fill="#d4aa76" stroke="#604d3e" strokeWidth="4"/><circle cx="-7" cy="2" r="8" fill="#5ac4d7"/><circle cx="12" cy="2" r="8" fill="#5ac4d7"/></g>
 </g>,
 avatar_adventurer:<g>
  <path d="M31 169Q27 126 52 124L72 114L114 116L138 124Q155 142 149 169Z" fill="#f29e5f" stroke="#fff0bf" strokeWidth="4"/>
  <path d="M54 129L64 163M121 126L133 163" stroke="#7354a3" strokeWidth="9"/>
  <path d="M42 65Q26 90 43 123Q55 138 57 154" fill="none" stroke="#9c563d" strokeWidth="16" strokeLinecap="round"/>
  <HumanFace skin="#f0b48f" shape="heart" mood="excited"/>
  <path d="M40 65Q37 24 94 26Q128 27 140 64L110 59L78 41L59 66Z" fill="#b45e55" stroke="#f6cb91" strokeWidth="5"/>
  <path d="M22 70Q86 48 146 66" stroke="#ffe7af" strokeWidth="12" strokeLinecap="round"/>
  <g transform="translate(135 140)"><circle r="20" fill="#e4d9ad" stroke="#6a6390" strokeWidth="5"/><path d="M0 -14L5 -3L0 14L-5 3Z" fill="#e46d5f"/><circle r="3" fill="#fff"/></g>
 </g>,
 avatar_inventor:<g>
  <path d="M25 169Q28 123 61 120L118 120Q156 128 157 169Z" fill="#436da3" stroke="#a9eaf2" strokeWidth="4"/>
  <path d="M65 127L60 165M117 126L123 165" stroke="#f7b56f" strokeWidth="8"/>
  <HumanFace skin="#ad7455" hair="#302e45" shape="long" mood="shy"/>
  <path d="M45 66L35 43L57 49L63 20L78 42L96 17L107 44L134 33L129 67" fill="#3a3d62" stroke="#9adfe2" strokeWidth="4"/>
  <g stroke="#c3f8ff" strokeWidth="5" fill="#6895cb"><circle cx="68" cy="89" r="21"/><circle cx="111" cy="89" r="21"/><path d="M88 89H91M44 86L32 81M134 86L145 81" fill="none"/></g>
  <g transform="translate(139 138) rotate(20)"><path d="M-3 -28Q-18 -23 -13 -11L-2 -7L-2 19Q-4 28 5 28Q11 27 9 18L9 -8Q24 -12 20 -25L10 -17L2 -18Z" fill="#a9f2fc" stroke="#477ca3" strokeWidth="4"/></g>
 </g>,
 avatar_painter:<g>
  <path d="M26 167Q26 123 55 120L123 120Q159 126 153 167Z" fill="#e37f96" stroke="#ffdfd8" strokeWidth="4"/>
  <path d="M75 119L90 158L107 120" fill="#fff2d5" stroke="#a65e69" strokeWidth="3"/>
  <HumanFace skin="#e3a984" hair="#51364b" shape="heart" mood="shy"/>
  <path d="M42 58Q30 17 74 22Q94 3 116 25Q145 29 142 57Q90 48 42 58Z" fill="#a34c7e" stroke="#f3acd4" strokeWidth="5"/>
  <path d="M29 63Q93 52 140 64" stroke="#f7badc" strokeWidth="9"/>
  <g transform="translate(134 137) rotate(-18)"><path d="M-10 -21Q-34 -14 -30 8Q-23 26 4 24Q21 18 12 6Q2 -1 14 -12Q11 -26 -10 -21Z" fill="#f7d7a7" stroke="#b77b6c" strokeWidth="3"/>
   {[[ -17,-3,'#6f9ede'],[0,-10,'#ea8aa9'],[-12,13,'#75ca91'],[7,11,'#eabd63']].map(([x,y,c],i)=><circle key={i} cx={Number(x)} cy={Number(y)} r="4.5" fill={String(c)}/>)}
   <circle cx="-3" cy="5" r="4" fill="#65496e"/></g>
  <path d="M133 103L151 148" stroke="#d7a077" strokeWidth="5"/><path d="M131 101L125 88L143 93L140 104Z" fill="#8ad6f9"/>
 </g>,
 avatar_musician:<g>
  <path d="M20 168Q23 130 55 119Q87 107 122 119Q155 132 158 168Z" fill="#4d4fa2" stroke="#c4d2ff" strokeWidth="4"/>
  <path d="M44 136Q92 154 137 135" fill="none" stroke="#eea7f0" strokeWidth="8"/>
  <HumanFace skin="#c18567" hair="#30325b" mood="excited"/>
  <path d="M42 68Q25 26 88 28Q139 25 139 73L124 62L101 48L79 60L50 69Z" fill="#4d3765"/>
  <path d="M33 97V78Q34 22 89 22Q147 25 148 81V99" stroke="#ffe1ba" strokeWidth="12" fill="none"/>
  <rect x="22" y="73" width="25" height="40" rx="10" fill="#80bedb" stroke="#e1f8ff" strokeWidth="4"/>
  <rect x="137" y="73" width="25" height="40" rx="10" fill="#80bedb" stroke="#e1f8ff" strokeWidth="4"/>
  <path d="M137 112Q157 128 144 143" stroke="#f2ccbe" strokeWidth="4" fill="none"/>
  <g transform="translate(140 145) rotate(12)"><circle r="18" fill="#ed9bdc" stroke="#ffdef5" strokeWidth="4"/><path d="M-7 -9V9M0 -11V9M7 -9V9" stroke="#fff" strokeWidth="2"/></g>
 </g>,
 avatar_gardener:<g>
  <path d="M22 170Q24 126 52 122L118 123Q158 130 154 170Z" fill="#4a9468" stroke="#c8f3a1" strokeWidth="4"/>
  <path d="M58 123L65 163M119 123L111 163" stroke="#c6e8a7" strokeWidth="8"/>
  <HumanFace skin="#f4c49a" hair="#8e5536" mood="sleepy" shape="round"/>
  <path d="M47 59Q51 25 87 25Q133 27 132 59Z" fill="#edce84" stroke="#a68f5e" strokeWidth="5"/>
  <path d="M17 66Q91 52 162 66Q92 82 17 66Z" fill="#f9e7a5" stroke="#b7a176" strokeWidth="4"/>
  <path d="M61 52H115" stroke="#4eaf85" strokeWidth="9"/>
  <g transform="translate(133 140)"><path d="M-18 -14Q12 -30 24 2L13 28H-14Z" fill="#8fc7de" stroke="#fff0d2" strokeWidth="4"/><path d="M19 -3Q37 -10 38 0Q32 10 24 7" fill="none" stroke="#fff0d2" strokeWidth="5"/><circle cx="-2" cy="-3" r="5" fill="#ffdf89"/></g>
  {[[41,51],[69,44],[109,45],[139,56]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="7" fill={i%2?'#fff0ae':'#efaec4'}/><circle cx={x} cy={y} r="3" fill="#efbb71"/></g>)}
 </g>,
 avatar_diver:<g>
  <path d="M17 170Q20 126 54 119Q90 112 122 119Q163 130 164 170Z" fill="#47a8ba" stroke="#e0fcfc" strokeWidth="4"/>
  <path d="M68 117V167M116 117V167" stroke="#1d6387" strokeWidth="12"/>
  <ellipse cx="90" cy="86" rx="60" ry="67" fill="#52abc3" stroke="#d0f7ff" strokeWidth="7"/>
  <HumanFace skin="#c79579" hair="#5c3c37" shape="long" eyesY={88}/>
  <rect x="36" y="66" width="109" height="49" rx="19" fill="#a9f3f4" fillOpacity=".42" stroke="#e1fdff" strokeWidth="8"/>
  <path d="M138 88Q168 85 166 110V132" stroke="#fff0a7" strokeWidth="8" fill="none"/>
  <path d="M158 132H172" stroke="#ffda79" strokeWidth="7"/>
  <g fill="#d9f9ff" stroke="#eaffff" strokeWidth="2"><circle cx="149" cy="43" r="8"/><circle cx="162" cy="28" r="5"/><circle cx="132" cy="20" r="4"/></g>
 </g>
};
