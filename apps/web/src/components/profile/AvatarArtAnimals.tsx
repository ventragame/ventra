import React from 'react';
import {Eyes,Smile,Cheeks,RoundedPaws,SmallStar} from './AvatarArtParts';

/** Hand-shaped animal portraits. Each species has its own anatomy and prop;
 * not one recolored circular face with interchangeable ears. */
export const ANIMAL_ART:Record<string,React.ReactNode>={
 avatar_owl:<g>
  <path d="M26 165Q18 100 46 49L42 23L69 42Q91 26 110 42L137 20L135 55Q165 102 151 167Z" fill="#9576c7" stroke="#e0bdf4" strokeWidth="5"/>
  <path d="M41 96Q9 104 23 139Q36 151 53 143M135 95Q171 109 159 139Q143 150 131 143" fill="#a98ad5" stroke="#e8cefc" strokeWidth="4"/>
  <ellipse cx="92" cy="105" rx="52" ry="55" fill="#efe0ff"/>
  <ellipse cx="64" cy="82" rx="32" ry="36" fill="#fff8f1" stroke="#8665bb" strokeWidth="4"/>
  <ellipse cx="115" cy="82" rx="32" ry="36" fill="#fff8f1" stroke="#8665bb" strokeWidth="4"/>
  <Eyes x1={64} x2={115} y={85} r={10} iris="#4b3873"/>
  <path d="M84 109L99 109L91 129Z" fill="#ffd789" stroke="#d89d6f" strokeWidth="3"/>
  <path d="M55 143Q90 160 124 142" fill="none" stroke="#c3a4dd" strokeWidth="8"/>
  <g transform="translate(110 148) rotate(8)"><rect x="-29" y="-10" width="51" height="30" rx="5" fill="#59b4bf" stroke="#fff7cf" strokeWidth="4"/><path d="M-5 -10V18" stroke="#f7e9c2" strokeWidth="3"/><SmallStar x={10} y={1} s={.55}/></g>
 </g>,
 avatar_fox:<g>
  <path d="M40 125Q1 97 13 62Q37 98 62 98" fill="#cb7b4a" stroke="#fff0d0" strokeWidth="4"/>
  <path d="M29 161Q26 120 56 114L126 115Q157 131 153 161Z" fill="#ed9e67" stroke="#fff0d4" strokeWidth="5"/>
  <path d="M34 92L18 21L70 56M109 52L159 18L143 97" fill="#e77d4f" stroke="#a85549" strokeWidth="5"/>
  <path d="M36 67L30 40L58 58M119 60L149 39L140 69" fill="#fbb3af"/>
  <path d="M43 73Q66 43 90 59Q118 40 138 75L135 113Q119 132 92 128Q62 134 46 110Z" fill="#f6af73" stroke="#ffe1b7" strokeWidth="4"/>
  <path d="M38 98Q64 97 89 117Q113 93 146 99Q134 128 91 140Q54 133 38 98Z" fill="#fff5df"/>
  <Eyes x1={67} x2={112} y={89} expression="excited" iris="#623d50"/>
  <path d="M84 116L97 116L90 123Z" fill="#543b4e"/>
  <Smile x={90} y={125} width={21} open/>
  <path d="M56 143Q89 153 123 143" stroke="#3aa3a1" strokeWidth="8" fill="none"/>
 </g>,
 avatar_rabbit:<g>
  <path d="M28 163Q35 118 60 118L122 119Q149 130 155 165Z" fill="#e9d2f7" stroke="#fffbff" strokeWidth="5"/>
  <ellipse cx="56" cy="42" rx="18" ry="46" transform="rotate(-16 56 42)" fill="#fff7ff" stroke="#be9ed8" strokeWidth="5"/>
  <ellipse cx="127" cy="42" rx="18" ry="46" transform="rotate(17 127 42)" fill="#fff7ff" stroke="#be9ed8" strokeWidth="5"/>
  <ellipse cx="56" cy="41" rx="8" ry="31" transform="rotate(-16 56 41)" fill="#f7acd3"/>
  <ellipse cx="127" cy="41" rx="8" ry="31" transform="rotate(17 127 41)" fill="#f7acd3"/>
  <ellipse cx="91" cy="95" rx="48" ry="47" fill="#fcf3fb" stroke="#dbc5e7" strokeWidth="4"/>
  <ellipse cx="68" cy="107" rx="17" ry="13" fill="#fff"/><ellipse cx="113" cy="107" rx="17" ry="13" fill="#fff"/>
  <Eyes x1={70} x2={111} y={87} r={8} iris="#75416b"/><Cheeks y={106}/>
  <path d="M86 108Q91 103 97 109Q91 117 86 108Z" fill="#ed91ad"/><Smile x={92} y={117} width={17}/>
  <RoundedPaws fill="#fef9ff" stroke="#c7b5d5" y={146}/>
  <g transform="translate(130 137) rotate(28)"><path d="M-3 -1Q-13 -33 0 -44Q17 -32 9 -1" fill="#61bd82" stroke="#3b876f" strokeWidth="3"/><path d="M-6 -1Q2 -21 14 -4L7 28Q-8 33 -16 13Z" fill="#ef9e54" stroke="#fff0b5" strokeWidth="3"/></g>
 </g>,
 avatar_panda:<g>
  <ellipse cx="90" cy="143" rx="66" ry="47" fill="#35465c" stroke="#d3e4ed" strokeWidth="5"/>
  <circle cx="42" cy="55" r="23" fill="#2e3b4f" stroke="#91a4ac" strokeWidth="4"/><circle cx="138" cy="55" r="23" fill="#2e3b4f" stroke="#91a4ac" strokeWidth="4"/>
  <ellipse cx="90" cy="90" rx="56" ry="55" fill="#fafaf5" stroke="#c9e2e7" strokeWidth="5"/>
  <ellipse cx="64" cy="89" rx="22" ry="28" fill="#334152" transform="rotate(14 64 89)"/>
  <ellipse cx="115" cy="89" rx="22" ry="28" fill="#334152" transform="rotate(-14 115 89)"/>
  <Eyes x1={65} x2={115} y={90} r={8} iris="#203451"/>
  <ellipse cx="91" cy="114" rx="15" ry="10" fill="#f3f0ee"/>
  <path d="M83 110Q91 105 99 111Q95 122 87 120Z" fill="#333e50"/><Smile x={91} y={124} width={21}/>
  <RoundedPaws fill="#f9fafa" stroke="#485a69"/>
  <g transform="translate(137 137) rotate(-19)"><path d="M0 -38V35" stroke="#589f71" strokeWidth="10"/><path d="M1 -28Q-28 -32 -19 -8Q-8 0 1 -3M1 -10Q29 -16 22 7Q11 15 1 11M1 10Q-20 5 -17 24Q-5 30 1 24" fill="#9ce1a2" stroke="#50916a" strokeWidth="3"/></g>
 </g>,
 avatar_lion:<g>
  <path d="M45 37L54 13L72 30L90 11L107 31L134 17L138 45L161 55L148 77L167 97L147 119L151 145L123 151L106 169L85 154L58 169L51 146L24 139L36 112L16 91L38 72L27 48Z"
   fill="#d28c4a" stroke="#fff0aa" strokeWidth="5"/>
  <ellipse cx="90" cy="94" rx="48" ry="47" fill="#f6c87d" stroke="#b77842" strokeWidth="4"/>
  <ellipse cx="48" cy="85" rx="13" ry="16" fill="#ebaa6b"/><ellipse cx="133" cy="85" rx="13" ry="16" fill="#ebaa6b"/>
  <path d="M57 67Q72 45 88 59Q110 43 126 70" fill="none" stroke="#bb7041" strokeWidth="10"/>
  <Eyes x1={68} x2={114} y={90} iris="#7b4d3d" expression="excited"/>
  <ellipse cx="90" cy="115" rx="28" ry="19" fill="#fff0c8"/>
  <path d="M83 108Q90 102 98 108L91 120Z" fill="#9c5945"/><Smile x={91} y={119} width={23}/>
  <path d="M40 148Q91 179 140 148" fill="none" stroke="#f7d98d" strokeWidth="10"/>
  <path d="M73 47L80 33L93 44L108 32L113 48" fill="none" stroke="#fff1bc" strokeWidth="6"/>
 </g>,
 avatar_cat:<g>
  <path d="M32 165Q25 125 53 121L124 118Q161 129 152 167Z" fill="#e5a4ad" stroke="#fff2e6" strokeWidth="5"/>
  <path d="M42 76L24 24L79 52M107 50L156 22L139 84" fill="#d88774" stroke="#a75e64" strokeWidth="5"/>
  <path d="M49 64L38 38L70 58M115 60L146 35L133 66" fill="#ffc8c9"/>
  <path d="M41 73Q40 49 86 52Q136 44 142 77L135 120Q119 137 89 137Q53 133 42 110Z" fill="#f8bd9c" stroke="#fff1d3" strokeWidth="4"/>
  <path d="M72 52L65 70M92 47L92 66M110 53L117 68" stroke="#d17d73" strokeWidth="6" strokeLinecap="round"/>
  <Eyes x1={68} x2={114} y={88} r={7} iris="#687c67"/>
  <path d="M83 110L98 110L91 118Z" fill="#bd6d7b"/><Smile x={91} y={120} width={20}/>
  <g stroke="#ad7778" strokeWidth="2.5"><path d="M75 113L38 106M75 119L34 123M107 113L143 106M107 119L146 122"/></g>
  <path d="M52 146Q90 160 128 144" fill="none" stroke="#63c2a8" strokeWidth="9"/>
  <path d="M138 145Q154 127 166 139" fill="none" stroke="#b77c84" strokeWidth="8"/>
 </g>,
 avatar_koala:<g>
  <path d="M31 159Q30 119 61 123L124 119Q156 132 152 162Z" fill="#94a9b9" stroke="#e1f2f1" strokeWidth="5"/>
  <circle cx="43" cy="59" r="31" fill="#9daab7" stroke="#e5f4f7" strokeWidth="6"/>
  <circle cx="138" cy="59" r="31" fill="#9daab7" stroke="#e5f4f7" strokeWidth="6"/>
  <circle cx="43" cy="59" r="20" fill="#e9e0ed"/><circle cx="138" cy="59" r="20" fill="#e9e0ed"/>
  <path d="M43 83Q38 45 86 43Q140 43 143 87Q137 137 90 141Q40 136 43 83Z" fill="#bccbd2" stroke="#f0fbfb" strokeWidth="5"/>
  <Eyes x1={68} x2={115} y={88} iris="#5c5d74" expression="sleepy"/>
  <ellipse cx="91" cy="111" rx="17" ry="24" fill="#53636c"/><ellipse cx="86" cy="102" rx="6" ry="10" fill="#7d9096" opacity=".65"/>
  <Smile x={92} y={135} width={22}/>
  <g transform="translate(140 142) rotate(18)"><path d="M-2 -44L-7 33" stroke="#a17a58" strokeWidth="8"/><ellipse cx="-20" cy="-22" rx="14" ry="29" fill="#70c18d" transform="rotate(23 -20 -22)"/><ellipse cx="13" cy="-14" rx="14" ry="29" fill="#84d1a6" transform="rotate(-28 13 -14)"/></g>
 </g>,
 avatar_otter:<g>
  <path d="M33 163Q24 124 47 112Q70 96 107 112L143 124Q153 137 147 165Z" fill="#b77c60" stroke="#e9c8ac" strokeWidth="5"/>
  <path d="M42 77Q37 51 68 43Q109 32 133 64Q147 83 132 119L113 138L69 137Q35 121 42 77Z" fill="#a97760" stroke="#efd0b2" strokeWidth="5"/>
  <ellipse cx="90" cy="107" rx="51" ry="30" fill="#f3d7b6"/>
  <circle cx="47" cy="65" r="14" fill="#b78364"/><circle cx="132" cy="65" r="14" fill="#b78364"/>
  <Eyes x1={70} x2={110} y={86} r={6} iris="#5b4858"/>
  <path d="M84 102Q91 98 98 102L91 109Z" fill="#604954"/><Smile x={91} y={113} width={17}/>
  <g fill="none" stroke="#fff1dc" strokeWidth="2"><path d="M73 111L43 102M73 116L41 120M107 111L137 102M107 116L139 120"/></g>
  <g transform="translate(94 150)"><path d="M-22 10Q-20 -12 0 -14Q21 -13 22 10Q8 26 -10 23Z" fill="#e5b0ac" stroke="#fff0cf" strokeWidth="4"/><path d="M-18 5Q0 14 17 5" fill="none" stroke="#c88587" strokeWidth="3"/><circle cy="-3" r="5" fill="#ffeedc"/></g>
  <path d="M135 134Q165 143 158 164" fill="none" stroke="#bf906f" strokeWidth="11" strokeLinecap="round"/>
 </g>,
 avatar_penguin:<g>
  <path d="M53 52Q59 26 93 28Q132 28 143 68L157 156Q139 171 90 170Q39 166 23 154Z" fill="#334767" stroke="#bdd7ef" strokeWidth="5"/>
  <path d="M46 108Q14 102 9 139Q28 148 49 142M136 105Q166 99 174 136Q155 151 136 144" fill="#405879" stroke="#d6e5f4" strokeWidth="4"/>
  <path d="M58 80Q64 50 92 49Q125 50 128 78L132 154Q91 174 51 152Z" fill="#fffafa"/>
  <Eyes x1={70} x2={113} y={82} r={7} iris="#426080"/>
  <path d="M78 108L107 108L92 123Z" fill="#f7ad67" stroke="#f9dda8" strokeWidth="3"/>
  <path d="M49 130Q93 144 133 129" fill="none" stroke="#67ccdb" strokeWidth="12"/>
  <path d="M126 130L134 154L112 143" fill="#67ccdb"/>
  <ellipse cx="66" cy="165" rx="25" ry="8" fill="#f6b76c"/><ellipse cx="116" cy="165" rx="25" ry="8" fill="#f6b76c"/>
  <SmallStar x={145} y={36} s={.6}/>
 </g>,
 avatar_deer:<g>
  <path d="M31 169Q25 131 58 118L121 119Q157 130 152 169Z" fill="#bd8772" stroke="#f2d4af" strokeWidth="5"/>
  <g fill="none" stroke="#a36e58" strokeWidth="8" strokeLinecap="round">
   <path d="M66 61L47 29L31 19M47 29L20 30M48 30L51 13"/>
   <path d="M114 61L133 29L149 19M133 29L160 30M133 30L129 13"/>
  </g>
  <path d="M41 78L19 65Q20 43 57 54M125 55Q158 43 160 65L139 79" fill="#d3a084" stroke="#ffe0c3" strokeWidth="4"/>
  <path d="M53 67Q61 42 90 49Q120 44 129 66L123 120Q111 145 90 147Q62 140 55 120Z" fill="#eac09d" stroke="#b27b68" strokeWidth="4"/>
  <path d="M71 106Q84 87 102 106L110 132Q93 148 75 134Z" fill="#fff0dd"/>
  <Eyes x1={70} x2={113} y={86} r={7} iris="#72585a"/>
  <ellipse cx="92" cy="126" rx="9" ry="6" fill="#9e7064"/><Smile x={92} y={134} width={16}/>
  <g fill="#fff1d7"><circle cx="63" cy="62" r="4"/><circle cx="118" cy="59" r="4"/><circle cx="86" cy="53" r="3"/></g>
  <g transform="translate(142 136)"><path d="M-8 1Q-23 -13 -16 -23Q-4 -30 0 -16Q7 -30 19 -24Q27 -10 9 1L0 14Z" fill="#f6a9cb" stroke="#ffe6ec" strokeWidth="3"/></g>
 </g>,
 avatar_bear:<g>
  <path d="M20 166Q15 116 57 112Q91 102 127 113Q163 121 160 168Z" fill="#9a735e" stroke="#f0d0a2" strokeWidth="5"/>
  <circle cx="43" cy="52" r="24" fill="#9c7059" stroke="#d6ad83" strokeWidth="5"/>
  <circle cx="135" cy="52" r="24" fill="#9c7059" stroke="#d6ad83" strokeWidth="5"/>
  <circle cx="43" cy="52" r="13" fill="#d9a18f"/><circle cx="135" cy="52" r="13" fill="#d9a18f"/>
  <ellipse cx="90" cy="94" rx="57" ry="51" fill="#c19073" stroke="#f1d9b6" strokeWidth="4"/>
  <Eyes x1={69} x2={114} y={84} r={7} iris="#5a4655" expression="shy"/>
  <ellipse cx="90" cy="112" rx="29" ry="21" fill="#edc9aa"/>
  <path d="M83 106Q90 101 98 107Q93 119 87 117Z" fill="#76504c"/><Smile x={90} y={123} width={21}/>
  <RoundedPaws fill="#cca184" stroke="#986e58" y={149}/>
  <g transform="translate(139 140)"><path d="M-15 -23H13L21 17Q20 28 8 29H-10Q-20 27 -20 17Z" fill="#f0b75e" stroke="#ffe9a4" strokeWidth="4"/>
   <rect x="-20" y="-28" width="39" height="11" rx="5" fill="#f8edbd" stroke="#b88859" strokeWidth="3"/><path d="M-7 -1Q0 -9 8 0" fill="none" stroke="#a76d4c" strokeWidth="4"/></g>
 </g>
};
