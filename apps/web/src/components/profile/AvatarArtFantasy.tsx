import React from 'react';
import {Eyes,Smile,Cheeks,HumanFace,SmallStar} from './AvatarArtParts';

/** Ten original fantasy silhouettes: no generic round-face palette swaps. */
export const FANTASY_ART:Record<string,React.ReactNode>={
 avatar_wizard:<g>
  <path d="M21 167Q28 113 54 109L126 109Q156 126 161 168Z" fill="#6b55b1" stroke="#e4b8fb" strokeWidth="5"/>
  <path d="M73 112L90 156L111 110" fill="#f1c6df"/><path d="M73 139L89 163L109 140" fill="#513a88"/>
  <HumanFace skin="#e3b28c" hair="#b8b5cc" shape="long" mood="shy"/>
  <path d="M46 63L82 5Q91 28 118 37L131 65Z" fill="#7250c4" stroke="#edb9ff" strokeWidth="5"/>
  <path d="M22 71Q91 52 155 70" fill="none" stroke="#bd8dea" strokeWidth="13" strokeLinecap="round"/>
  <path d="M80 48L84 37L95 33L88 46L96 56L85 51L75 61Z" fill="#fff2a1"/>
  <path d="M64 115Q73 148 89 147Q112 148 120 114Q108 128 95 123Q78 137 64 115Z" fill="#e8eef5" stroke="#c6c2df" strokeWidth="3"/>
  <g transform="translate(146 120)"><path d="M0 -38L-3 52" stroke="#a77957" strokeWidth="8" strokeLinecap="round"/><SmallStar x={0} y={-48} s={1.6}/></g>
 </g>,
 avatar_dragon:<g>
  <path d="M52 123Q8 93 15 51Q33 58 55 66M127 118Q169 96 166 51Q148 62 122 64" fill="#49a5b3" stroke="#d2eaff" strokeWidth="5"/>
  <path d="M19 169Q25 125 59 112L124 113Q159 125 161 169Z" fill="#4db9a5" stroke="#b8ffda" strokeWidth="5"/>
  <path d="M51 67L31 22L70 50M106 45L149 23L136 74" fill="#ffdf9c" stroke="#bca269" strokeWidth="5"/>
  <path d="M79 45L90 10L104 47M67 49L65 26L79 48M108 48L121 28L123 53" fill="#ffc97a" stroke="#c89b6e" strokeWidth="3"/>
  <path d="M44 81Q38 45 89 48Q141 46 140 83L139 104Q146 112 129 133L60 135Q31 124 43 104Z" fill="#5dd1b4" stroke="#1a928c" strokeWidth="4"/>
  <path d="M47 111Q87 92 136 112L133 135Q92 153 51 133Z" fill="#b5f0cb" stroke="#319889" strokeWidth="3"/>
  <Eyes x1={67} x2={114} y={83} r={8} iris="#245777" expression="excited"/>
  <g fill="#347d80"><ellipse cx="70" cy="114" rx="4" ry="3"/><ellipse cx="113" cy="114" rx="4" ry="3"/></g>
  <Smile y={125} width={26} color="#34847c" open/>
  <path d="M64 140L70 148L76 141M108 142L113 149L120 140" fill="#fff2d9"/>
  <path d="M45 150Q31 145 26 153L35 161" stroke="#fff4d8" strokeWidth="5" fill="none"/>
 </g>,
 avatar_unicorn:<g>
  <path d="M23 166Q29 125 61 117L121 114Q151 132 156 168Z" fill="#c49bdf" stroke="#fff6fc" strokeWidth="5"/>
  <path d="M46 113Q15 74 50 42Q73 18 109 43Q157 28 148 82L133 142L107 140Z" fill="#b7a0e5" stroke="#eae1ff" strokeWidth="5"/>
  <path d="M90 56L111 8L122 64" fill="#ffdfa6" stroke="#fff8d8" strokeWidth="5"/>
  <path d="M49 66L35 28L76 47M125 45L156 30L145 74" fill="#f7efff" stroke="#dbbeee" strokeWidth="5"/>
  <path d="M56 74Q61 47 93 49Q122 44 134 69L127 106L153 127L136 141L88 132Q47 133 49 95Z" fill="#fff1fc" stroke="#e7cae8" strokeWidth="4"/>
  <path d="M45 75Q25 60 43 44Q70 40 70 75Q77 41 99 42Q103 71 90 89" fill="none" stroke="#86d9dd" strokeWidth="14"/>
  <path d="M129 57Q151 73 143 95" fill="none" stroke="#eda8d9" strokeWidth="15"/>
  <ellipse cx="107" cy="91" rx="11" ry="15" fill="#fff"/>
  <ellipse cx="110" cy="92" rx="7" ry="10" fill="#62517c"/><circle cx="108" cy="87" r="3" fill="#fff"/>
  <ellipse cx="137" cy="126" rx="7" ry="5" fill="#d6a5c2"/>
  <path d="M112 139Q127 146 139 137" stroke="#ad78b1" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
  <SmallStar x={40} y={135} s={.85}/>
 </g>,
 avatar_princess:<g>
  <path d="M8 171Q12 130 49 111L129 114Q168 125 174 171Z" fill="#e89ebc" stroke="#ffe7ed" strokeWidth="5"/>
  <path d="M43 121L91 162L139 120" fill="#f2d3e9" stroke="#fff7e3" strokeWidth="4"/>
  <path d="M48 79Q26 47 48 31Q70 6 101 30Q125 10 142 40L141 122Q137 151 120 152" fill="#bd8754" stroke="#efc78b" strokeWidth="5"/>
  <HumanFace skin="#f1bba1" hair="#b77f51" shape="heart" mood="excited"/>
  <path d="M54 47L44 18L71 31L90 5L112 31L139 17L129 48Z" fill="#ffe2a0" stroke="#fffbe6" strokeWidth="4"/>
  <path d="M63 47L91 37L119 47" fill="none" stroke="#e9ab75" strokeWidth="5"/>
  <circle cx="91" cy="31" r="6" fill="#75e4e9" stroke="#fffaf3" strokeWidth="3"/>
  <path d="M43 81Q21 116 43 142Q55 151 66 139M139 83Q161 119 138 146Q124 153 114 138" fill="none" stroke="#ad704e" strokeWidth="12"/>
  <g transform="translate(140 144)"><path d="M-15 -11Q0 -30 16 -11V15Q2 29 -14 14Z" fill="#ffebbd" stroke="#fffaf1" strokeWidth="4"/><SmallStar x={0} y={0} s={.7} color="#f5b4cb"/></g>
 </g>,
 avatar_phoenix:<g>
  <path d="M54 125Q12 110 10 42Q32 65 53 58Q34 83 55 124" fill="#ffbf51" stroke="#fff1bb" strokeWidth="4"/>
  <path d="M124 125Q166 108 168 42Q148 63 127 58Q146 83 124 124" fill="#ffa454" stroke="#ffe6a6" strokeWidth="4"/>
  <path d="M47 135L26 170L69 154L87 175L105 154L147 171L133 136" fill="#e77b55" stroke="#ffe19f" strokeWidth="5"/>
  <path d="M34 105Q38 65 77 53L90 17L103 51Q142 59 148 104L140 158Q93 178 38 155Z" fill="#e59a4c" stroke="#ffe2a3" strokeWidth="5"/>
  <path d="M57 84Q90 48 125 83L125 142Q92 158 55 140Z" fill="#ffcf76"/>
  <path d="M71 55L57 16L81 33L91 4L103 33L129 16L113 57" fill="#ffd65d" stroke="#fff3ae" strokeWidth="4"/>
  <Eyes x1={70} x2={112} y={88} iris="#85445b" expression="excited"/>
  <path d="M76 108L106 108L91 127Z" fill="#d96e55" stroke="#fff0bd" strokeWidth="3"/>
  <path d="M61 139Q91 149 121 138" fill="none" stroke="#fff0b9" strokeWidth="6"/>
  <g fill="#fdf3cb"><circle cx="44" cy="42" r="4"/><circle cx="147" cy="35" r="5"/></g>
 </g>,
 avatar_mermaid:<g>
  <path d="M72 124Q41 131 32 160Q43 148 57 164Q74 175 87 159L109 132Z" fill="#72d6cb" stroke="#cbfdf0" strokeWidth="5"/>
  <path d="M111 131Q150 140 154 174Q133 154 117 164Q105 171 90 157Z" fill="#6dbdd4" stroke="#b5fff8" strokeWidth="5"/>
  <path d="M29 166Q26 130 55 120L130 120Q155 136 153 167Z" fill="#68c6bd" stroke="#e4ffed" strokeWidth="4"/>
  <path d="M36 94Q27 38 60 32Q83 13 112 28Q148 37 143 98L132 129Q93 154 50 126Z" fill="#7153a7" stroke="#cab3f2" strokeWidth="4"/>
  <HumanFace skin="#cf9a77" hair="#604a91" shape="heart" mood="shy"/>
  <path d="M43 81Q26 92 28 123L36 143M140 80Q155 102 141 137" fill="none" stroke="#845db5" strokeWidth="14"/>
  <g transform="translate(87 31)" fill="#f5daa8" stroke="#e9ffeb" strokeWidth="2"><path d="M-19 9Q-19 -6 -5 -5L0 -17L9 -4Q25 -9 24 9Z"/><circle cy="4" r="6" fill="#9ce2ec"/></g>
  <path d="M56 126Q71 111 89 128Q107 111 124 126" fill="none" stroke="#ffdbb4" strokeWidth="9"/>
  <g fill="#b6ffec"><circle cx="144" cy="30" r="7"/><circle cx="158" cy="46" r="4"/><circle cx="134" cy="17" r="3"/></g>
 </g>,
 avatar_fairy:<g>
  <g fill="#d9fbf4" stroke="#fffaff" strokeWidth="4" opacity=".85">
   <ellipse cx="43" cy="101" rx="23" ry="47" transform="rotate(-28 43 101)"/>
   <ellipse cx="139" cy="101" rx="23" ry="47" transform="rotate(28 139 101)"/>
   <ellipse cx="43" cy="130" rx="17" ry="29" transform="rotate(-52 43 130)"/>
   <ellipse cx="141" cy="130" rx="17" ry="29" transform="rotate(52 141 130)"/>
  </g>
  <path d="M28 166Q30 128 55 121L121 121Q151 130 159 166Z" fill="#a98ad9" stroke="#f8e8ff" strokeWidth="5"/>
  <path d="M65 123L90 162L115 123" fill="#d4eece"/>
  <HumanFace skin="#e1b59a" hair="#b48bdb" shape="heart" mood="excited"/>
  <path d="M43 69Q42 31 66 35L91 22Q121 30 136 69L119 58L89 43L56 66Z" fill="#ae84c3" stroke="#e8b8f1" strokeWidth="4"/>
  <path d="M65 31L90 9L111 31" fill="none" stroke="#fff5bd" strokeWidth="5"/><SmallStar x={91} y={14} s={.8}/>
  <g transform="translate(146 137) rotate(24)"><path d="M0 -30V34" stroke="#ffe9b9" strokeWidth="5"/><SmallStar x={0} y={-38} s={1.25} color="#fff2bb"/></g>
 </g>,
 avatar_cloud:<g>
  <path d="M31 133Q12 130 13 107Q7 90 28 80Q26 53 57 50Q68 18 101 34Q127 27 141 57Q168 60 160 88Q176 107 159 129Q149 144 123 143Q88 158 49 142Z"
   fill="#f1fcff" stroke="#9fd5f5" strokeWidth="6"/>
  <path d="M38 77Q49 45 80 52M102 52Q127 44 138 70" fill="none" stroke="#fff" strokeWidth="9" opacity=".92"/>
  <Eyes x1={69} x2={112} y={95} iris="#427dba" expression="shy"/>
  <Cheeks y={113} color="#fab8d9"/><Smile x={91} y={119} width={24} color="#4b89b3"/>
  <path d="M54 148L49 164M91 148L91 171M126 148L131 163" stroke="#8ed5e8" strokeWidth="6" strokeLinecap="round"/>
  <path d="M44 161L52 153L59 161Q52 174 44 161M82 169L91 157L99 169Q91 178 82 169M122 162L130 153L138 162Q130 171 122 162"
   fill="#b5f6fd" stroke="#78cadc" strokeWidth="2"/>
  <SmallStar x={133} y={25} s={1}/>
 </g>,
 avatar_star_sprite:<g>
  <path d="M91 7L115 49L161 55L130 90L141 140L91 115L40 140L52 90L18 55L66 49Z"
    fill="#ffe5a0" stroke="#fffbe9" strokeWidth="6" strokeLinejoin="round"/>
  <path d="M90 27L106 58L139 61L115 87L126 118L91 101L57 118L68 87L42 61L77 57Z" fill="#fff0b0" opacity=".55"/>
  <Eyes x1={69} x2={111} y={83} r={8} iris="#7762a2" expression="excited"/>
  <Smile x={91} y={111} width={27} color="#ab7190" open/>
  <path d="M43 121Q21 132 17 148M139 120Q160 130 167 149" fill="none" stroke="#ffe0ac" strokeWidth="9" strokeLinecap="round"/>
  <circle cx="17" cy="148" r="8" fill="#fff4d6"/><circle cx="166" cy="149" r="8" fill="#fff4d6"/>
  <path d="M65 131L59 169M114 131L122 169" stroke="#f1b98c" strokeWidth="10" strokeLinecap="round"/>
  <ellipse cx="59" cy="166" rx="17" ry="8" fill="#efabd3"/><ellipse cx="122" cy="166" rx="17" ry="8" fill="#efabd3"/>
 </g>,
 avatar_moon_fox:<g>
  <path d="M32 163Q18 115 52 113L128 115Q157 132 149 165Z" fill="#5359a0" stroke="#d6bfff" strokeWidth="5"/>
  <path d="M33 77L19 18L70 52M109 53L160 16L145 81" fill="#a19bca" stroke="#ddd7f8" strokeWidth="5"/>
  <path d="M43 57L34 32L66 57M119 56L151 31L138 65" fill="#efc1ed"/>
  <path d="M43 76Q51 47 92 49Q129 43 140 81L132 117Q115 140 88 136Q51 133 43 107Z" fill="#b2a6d6" stroke="#e9d3f7" strokeWidth="4"/>
  <path d="M45 103Q69 101 91 122Q109 99 138 100Q130 134 91 145Q52 133 45 103Z" fill="#f1e3fa"/>
  <Eyes x1={67} x2={113} y={87} r={8} iris="#4b4f85" expression="shy"/>
  <path d="M85 119L99 119L91 129Z" fill="#78618e"/><Smile x={92} y={129} width={18} color="#856f91"/>
  <path d="M40 141Q13 121 21 90Q34 119 64 133" fill="#ded1f1" stroke="#fff3e7" strokeWidth="4"/>
  <path d="M141 24A28 28 0 1 0 162 48Q133 53 141 24Z" fill="#fff0bf" stroke="#fffcdd" strokeWidth="3"/>
  <SmallStar x={35} y={25} s={.6}/>
 </g>
};
