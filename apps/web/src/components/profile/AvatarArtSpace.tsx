import React from 'react';
import {Eyes,Smile,Cheeks,HumanFace,SmallStar} from './AvatarArtParts';

/** Space cast: six nonhumanoid mechanical/celestial forms plus two
 * suited explorers, with distinguishable silhouettes even at 44px. */
export const SPACE_ART:Record<string,React.ReactNode>={
 avatar_astronaut:<g>
  <path d="M16 169Q15 132 46 117L129 118Q168 132 166 169Z" fill="#d9eefb" stroke="#fdf8e8" strokeWidth="6"/>
  <path d="M38 141L57 123M141 143L119 121" stroke="#5692c9" strokeWidth="11"/>
  <rect x="64" y="134" width="53" height="29" rx="10" fill="#447ca5" stroke="#e8f8ff" strokeWidth="4"/>
  <ellipse cx="91" cy="86" rx="63" ry="66" fill="#c9f1ff" stroke="#e8fdff" strokeWidth="8"/>
  <ellipse cx="91" cy="87" rx="50" ry="52" fill="#558bb8" stroke="#87d8f2" strokeWidth="5"/>
  <ellipse cx="91" cy="91" rx="43" ry="45" fill="#f1c4a5"/>
  <path d="M49 77Q51 40 83 42Q118 41 130 76Q105 59 89 55L58 83Z" fill="#65473d"/>
  <Eyes x1={71} x2={113} y={91} iris="#425477" expression="excited"/>
  <Smile x={91} y={119} width={23}/>
  <path d="M51 57Q91 30 131 57" fill="none" stroke="#fbfffe" strokeWidth="6" opacity=".8"/>
  <SmallStar x={139} y={28} s={.7}/>
 </g>,
 avatar_robot:<g>
  <path d="M22 165Q19 130 49 118H133Q159 130 157 165Z" fill="#5b9bac" stroke="#cbfaff" strokeWidth="5"/>
  <rect x="43" y="32" width="96" height="103" rx="26" fill="#b4e4ee" stroke="#44779e" strokeWidth="7"/>
  <rect x="52" y="52" width="78" height="60" rx="13" fill="#24476e" stroke="#b7f4f5" strokeWidth="4"/>
  <path d="M90 33V17" stroke="#5a88ad" strokeWidth="6"/><circle cx="90" cy="13" r="9" fill="#ffeaa0" stroke="#fff4dc" strokeWidth="4"/>
  <g fill="#94f8fa"><rect x="61" y="76" width="22" height="21" rx="8"/><rect x="102" y="76" width="22" height="21" rx="8"/></g>
  <path d="M77 107Q91 119 106 107" stroke="#acfef0" strokeWidth="5" fill="none"/>
  <circle cx="57" cy="127" r="8" fill="#ffd595"/><circle cx="125" cy="127" r="8" fill="#ffd595"/>
  <rect x="68" y="143" width="46" height="22" rx="6" fill="#2e5575" stroke="#f7e4b0" strokeWidth="3"/>
  <path d="M78 154H105" stroke="#8af2f0" strokeWidth="5"/>
 </g>,
 avatar_cyborg:<g>
  <path d="M19 168Q21 127 51 117L121 118Q158 134 162 168Z" fill="#326c86" stroke="#a6f8f0" strokeWidth="5"/>
  <path d="M90 123V163" stroke="#8af9d8" strokeWidth="7"/>
  <path d="M48 65Q48 40 90 38Q135 38 135 74L128 116Q115 140 90 139Q56 128 50 113Z" fill="#d8a98d" stroke="#ffe5c8" strokeWidth="4"/>
  <path d="M92 37Q135 38 137 67L132 119Q119 141 92 139Z" fill="#97c9d7" stroke="#537b9d" strokeWidth="4"/>
  <path d="M50 70Q51 32 90 32L91 52Q65 51 53 74Z" fill="#303e5c"/>
  <Eyes x1={69} x2={111} y={88} iris="#2f526c"/>
  <rect x="96" y="71" width="34" height="29" rx="8" fill="#1a4465" stroke="#a6faf1" strokeWidth="3"/>
  <rect x="102" y="79" width="21" height="12" rx="5" fill="#8dfff4"/>
  <path d="M78 119Q91 129 104 119" fill="none" stroke="#9f6b72" strokeWidth="4"/>
  <g stroke="#a5fff1" strokeWidth="3" fill="none"><path d="M121 105V116H139M113 123V137M136 70V57L147 50"/><circle cx="146" cy="50" r="4" fill="#f2ffaf"/></g>
 </g>,
 avatar_satellite:<g>
  <path d="M48 52L5 38V126L48 112M130 51L175 37V127L130 112" fill="#28639d" stroke="#a6e1ff" strokeWidth="5"/>
  <g stroke="#72c4f4" strokeWidth="3" fill="none"><path d="M16 49V119M30 45V116M149 45V117M162 48V120M6 75H42M140 75H175M6 103H42M140 103H175"/></g>
  <rect x="42" y="43" width="95" height="92" rx="19" fill="#a8ccdc" stroke="#fff6e2" strokeWidth="6"/>
  <rect x="53" y="60" width="73" height="50" rx="12" fill="#173f6a" stroke="#82e8ef" strokeWidth="4"/>
  <path d="M89 43V23" stroke="#bceeff" strokeWidth="5"/><circle cx="89" cy="16" r="9" fill="#ffe7a4" stroke="#fff8dc" strokeWidth="4"/>
  <Eyes x1={73} x2={107} y={85} r={6} iris="#8dfaff"/>
  <path d="M73 100Q90 110 107 100" stroke="#a2ffed" strokeWidth="4" fill="none"/>
  <path d="M66 135L53 157M114 135L130 157" stroke="#b6dbf0" strokeWidth="8" strokeLinecap="round"/>
  <ellipse cx="50" cy="159" rx="14" ry="9" fill="#ccebf5"/><ellipse cx="132" cy="159" rx="14" ry="9" fill="#ccebf5"/>
 </g>,
 avatar_cosmic:<g>
  <path d="M18 168Q28 125 59 115L127 114Q157 132 162 168Z" fill="#393d83" stroke="#c0aaf2" strokeWidth="5"/>
  <path d="M26 166L43 118Q48 49 80 26Q112 12 138 66Q145 105 151 164Z" fill="#6861b3" stroke="#d2bfff" strokeWidth="5"/>
  <ellipse cx="91" cy="87" rx="55" ry="62" fill="#252e70" stroke="#94a2e6" strokeWidth="5"/>
  <path d="M47 83Q60 46 95 47Q129 52 136 84L130 125Q110 146 87 143Q53 130 47 104Z" fill="#ad796a" stroke="#deb5aa" strokeWidth="4"/>
  <path d="M45 77Q53 35 90 32Q129 33 138 77Q117 63 90 58Q59 63 45 77Z" fill="#303676"/>
  <Eyes x1={70} x2={112} y={91} r={8} iris="#41375c" expression="shy"/><Smile y={119} width={19}/>
  <path d="M49 137Q90 152 132 136" fill="none" stroke="#efc3ef" strokeWidth="6"/>
  <g fill="#fff4bd"><SmallStar x={93} y={23} s={.8}/><circle cx="48" cy="49" r="4"/><circle cx="132" cy="50" r="3.5"/><circle cx="146" cy="118" r="3"/></g>
  <path d="M52 155Q91 176 133 155" stroke="#ffdf9d" strokeWidth="4" fill="none"/>
 </g>,
 avatar_alien:<g>
  <path d="M24 166Q31 128 60 121L122 120Q151 130 158 167Z" fill="#72b6ad" stroke="#d4fae3" strokeWidth="5"/>
  <path d="M67 56L58 30L69 18M110 56L125 31L116 17" fill="none" stroke="#64b693" strokeWidth="6"/>
  <circle cx="69" cy="18" r="9" fill="#cfff9f"/><circle cx="116" cy="17" r="9" fill="#cfff9f"/>
  <path d="M39 68Q41 30 89 31Q140 30 142 71L130 116Q118 148 91 150Q63 144 49 115Z" fill="#b9efb3" stroke="#7ac5a3" strokeWidth="5"/>
  <path d="M43 70Q19 63 25 86Q32 104 50 104M139 70Q159 59 162 86Q160 104 132 108" fill="#8dd2a3" stroke="#d6ffc9" strokeWidth="4"/>
  <ellipse cx="67" cy="92" rx="18" ry="26" fill="#397f80" transform="rotate(-13 67 92)"/>
  <ellipse cx="116" cy="92" rx="18" ry="26" fill="#397f80" transform="rotate(13 116 92)"/>
  <ellipse cx="62" cy="84" rx="6" ry="9" fill="#d2fff1"/><ellipse cx="111" cy="84" rx="6" ry="9" fill="#d2fff1"/>
  <Smile x={90} y={128} width={22} color="#4c988a"/>
  <ellipse cx="91" cy="161" rx="15" ry="9" fill="#f6ecb9"/>
 </g>,
 avatar_astro_cat:<g>
  <path d="M21 167Q21 129 53 121L126 119Q156 128 160 167Z" fill="#a7b8e9" stroke="#ebf3ff" strokeWidth="5"/>
  <ellipse cx="91" cy="88" rx="65" ry="69" fill="#bcdaf5" stroke="#effdff" strokeWidth="8"/>
  <path d="M45 81L34 40L78 61M105 59L149 39L136 83" fill="#c6a1ce" stroke="#f1d7fc" strokeWidth="5"/>
  <path d="M48 72L41 50L68 67M114 67L140 50L135 75" fill="#f3b9d0"/>
  <ellipse cx="91" cy="98" rx="48" ry="42" fill="#e1c7e9" stroke="#fff4f9" strokeWidth="4"/>
  <Eyes x1={68} x2={113} y={91} iris="#59628e"/>
  <path d="M84 111L97 111L90 118Z" fill="#a87a9e"/><Smile x={90} y={122} width={19} color="#91628a"/>
  <g stroke="#ae91bf" strokeWidth="2"><path d="M72 114L49 111M72 121L46 127M106 113L134 109M106 120L138 126"/></g>
  <path d="M47 55Q91 26 134 54" fill="none" stroke="#fffae0" strokeWidth="6" opacity=".75"/>
  <rect x="76" y="145" width="31" height="20" rx="7" fill="#5599be" stroke="#eaffff" strokeWidth="3"/>
  <SmallStar x={148} y={30} s={.7}/>
 </g>,
 avatar_planet:<g>
  <ellipse cx="92" cy="94" rx="81" ry="30" transform="rotate(-23 92 94)" fill="#ffe4a0" opacity=".5" stroke="#fff7ce" strokeWidth="5"/>
  <circle cx="90" cy="91" r="56" fill="#b7a4ec" stroke="#fff0ce" strokeWidth="5"/>
  <path d="M51 76Q81 53 122 77Q131 112 109 138Q74 149 52 113Z" fill="#a8c7eb" opacity=".65"/>
  <path d="M46 88Q81 68 131 96" fill="none" stroke="#7f88c8" strokeWidth="11" opacity=".65"/>
  <Eyes x1={69} x2={111} y={87} iris="#4f6392" expression="excited"/>
  <Cheeks y={108} color="#ffd0d9"/><Smile x={91} y={116} width={26} color="#786a9c"/>
  <path d="M35 131Q18 146 17 161M145 130Q161 147 166 159" stroke="#c5afed" strokeWidth="11" fill="none" strokeLinecap="round"/>
  <circle cx="17" cy="160" r="9" fill="#f8e0c6"/><circle cx="166" cy="159" r="9" fill="#f8e0c6"/>
  <path d="M70 143L59 168M111 143L125 167" stroke="#c3afe7" strokeWidth="9" strokeLinecap="round"/>
  <ellipse cx="58" cy="165" rx="16" ry="7" fill="#ffe2a8"/><ellipse cx="124" cy="165" rx="16" ry="7" fill="#ffe2a8"/>
  <ellipse cx="92" cy="94" rx="79" ry="27" transform="rotate(-23 92 94)" fill="none" stroke="#fff4c7" strokeWidth="9" strokeDasharray="142 208"/>
  <SmallStar x={147} y={27} s={.8}/>
 </g>
};
