'use client';
import React from 'react';

/** Original scalable cartoon characters. Different anatomy per species, not a
 * recolored common placeholder. The Turkish/English question engine owns color. */
export type SentenceAnimalSpecies='dog'|'cat'|'bird'|'rabbit';
type Coat=[string,string,string];
const NATURAL:Record<SentenceAnimalSpecies,Coat>={
 dog:['#E9A45C','#C67840','#F4BA7A'],
 cat:['#EAB16C','#C98248','#F9D093'],
 bird:['#67C7DB','#3696B4','#A3E4EE'],
 rabbit:['#E9DBCC','#C5A997','#FEF0DE']
};
const TINTS:Record<string,Coat>={
 red:['#F75B6A','#CC4050','#FF9299'],
 blue:['#4FADFA','#3079C6','#9DD8FF'],
 green:['#62CF8F','#339D6A','#A8EEBE'],
 yellow:['#F4CD51','#D7A436','#FBE78B'],
 purple:['#B48CF1','#8D60CD','#DBB6FA'],
 orange:['#F5A453','#DB7535','#FFCA83']
};
type P={fur:string;side:string;muzzle:string;eye:string;wing:string;collar:string};
const outline='#49303B';

function Dog({fur,side,muzzle,eye,collar}:P){
 return <g strokeLinejoin="round">
  <path d="M67 187 C27 175 30 143 22 132 C12 117 3 122 11 143 C12 171 26 205 68 207" fill={side} stroke={outline} strokeWidth="5"/>
  <path d="M79 120 C53 137 49 173 57 203 Q61 227 91 230 L160 228 Q187 218 185 181 C187 142 165 125 137 116Z" fill={fur} stroke={outline} strokeWidth="5"/>
  <path d="M101 151 C102 164 94 199 112 220 Q131 230 148 212 C156 194 149 158 139 146" fill={muzzle} opacity=".93"/>
  <path d="M70 184 C49 193 50 226 70 233 L103 233 C113 228 112 215 99 211 C81 210 88 195 78 185" fill={side} stroke={outline} strokeWidth="4"/>
  <path d="M141 171 C143 191 139 220 145 230 Q160 238 172 230 Q179 225 173 219 L166 180" fill={fur} stroke={outline} strokeWidth="4"/>
  <path d="M92 207 L91 230 Q98 238 111 233 Q124 235 131 231 L132 205" fill={fur} stroke={outline} strokeWidth="4"/>
  <path d="M81 230v4M103 232v3M149 231v4M164 229v4" stroke="#985C50" strokeWidth="3" strokeLinecap="round"/>
  <path d="M74 68 C52 54 29 66 27 102 Q26 127 46 142 Q55 148 68 131 L83 110Z" fill={side} stroke={outline} strokeWidth="5"/>
  <path d="M158 66 Q185 58 200 81 C214 109 196 136 184 139 Q170 143 160 120 L150 94Z" fill={side} stroke={outline} strokeWidth="5"/>
  <path d="M70 44 C89 21 145 20 166 47 Q189 74 179 116 C167 147 91 155 70 125 Q52 98 62 69Z" fill={fur} stroke={outline} strokeWidth="5"/>
  <path d="M82 52 Q110 34 149 49" fill="none" stroke="#FFF4CD" strokeOpacity=".5" strokeWidth="9" strokeLinecap="round"/>
  <ellipse cx="103" cy="92" rx="17" ry="22" fill={eye} stroke={outline} strokeWidth="3"/>
  <ellipse cx="151" cy="92" rx="17" ry="22" fill={eye} stroke={outline} strokeWidth="3"/>
  <ellipse cx="108" cy="98" rx="9.5" ry="15" fill="#292D40"/><ellipse cx="155" cy="98" rx="9.5" ry="15" fill="#292D40"/>
  <circle cx="111" cy="91" r="4.5" fill="#FFF"/><circle cx="158" cy="91" r="4.5" fill="#FFF"/>
  <path d="M90 69 Q101 62 112 70M141 70 Q152 62 162 69" fill="none" stroke="#73433A" strokeWidth="4" strokeLinecap="round"/>
  <path d="M106 118 Q126 106 149 117 Q172 112 176 133 Q170 158 146 158 L111 155 Q89 142 106 118Z" fill={muzzle} stroke={outline} strokeWidth="4"/>
  <path d="M124 124 Q146 111 164 123 Q170 136 156 141 Q137 148 127 138Z" fill="#3D3340" stroke={outline} strokeWidth="3"/>
  <ellipse cx="143" cy="125" rx="12" ry="4" fill="#B8A7A1" opacity=".48"/>
  <path d="M148 142 Q150 155 130 160 Q116 160 111 151" fill="none" stroke="#593947" strokeWidth="4" strokeLinecap="round"/>
  <path d="M139 153 Q138 167 150 168 Q159 166 155 157" fill="#F47B91" stroke="#984456" strokeWidth="3"/>
  <path d="M74 145 Q124 169 170 143 L164 158 Q123 183 80 159Z" fill={collar} stroke={outline} strokeWidth="3"/>
  <circle cx="130" cy="171" r="12" fill="#FFDA66" stroke="#916148" strokeWidth="3"/><circle cx="130" cy="171" r="5" fill="#FFF7BC"/>
 </g>;
}
function Cat({fur,side,muzzle,eye}:P){
 return <g strokeLinejoin="round">
  <path d="M67 202 C31 203 11 178 19 151 C26 127 45 126 55 145 Q40 145 38 161 Q36 179 73 180Z" fill={side} stroke={outline} strokeWidth="5"/>
  <path d="M93 126 Q57 139 63 192 Q65 231 101 234 L157 233 Q186 219 175 171 Q166 130 144 124Z" fill={fur} stroke={outline} strokeWidth="5"/>
  <path d="M105 150 Q96 188 112 226 L146 226 Q158 184 145 151" fill={muzzle} opacity=".86"/>
  <path d="M78 209 Q66 231 90 236 L117 236 Q130 231 121 221 M150 217 Q144 238 166 236 Q184 234 179 218" fill={fur} stroke={outline} strokeWidth="4"/>
  <path d="M69 76 L56 21 Q55 13 63 18 L99 40 Q124 36 146 41 L180 17 Q187 12 186 24 L173 79Z" fill={side} stroke={outline} strokeWidth="5"/>
  <path d="M70 39 L80 62 L92 48Z M162 47 L173 38 L165 65Z" fill="#F09C9C" stroke="#9E6670" strokeWidth="2"/>
  <path d="M63 82 Q61 43 118 40 Q181 34 184 88 Q189 133 147 151 Q103 163 72 140 Q53 124 63 82Z" fill={fur} stroke={outline} strokeWidth="5"/>
  <path d="M108 48l3 19M126 45l-3 22M142 51l-8 14" fill="none" stroke="#B27151" strokeWidth="5" strokeLinecap="round" opacity=".75"/>
  <ellipse cx="96" cy="103" rx="17" ry="21" fill={eye} stroke={outline} strokeWidth="3"/>
  <ellipse cx="151" cy="103" rx="17" ry="21" fill={eye} stroke={outline} strokeWidth="3"/>
  <ellipse cx="98" cy="106" rx="6.7" ry="14" fill="#253543"/><ellipse cx="151" cy="106" rx="6.7" ry="14" fill="#253543"/>
  <circle cx="101" cy="97" r="4" fill="#FFF"/><circle cx="154" cy="97" r="4" fill="#FFF"/>
  <path d="M91 128 Q99 115 121 126 Q137 113 153 126 Q157 143 128 153 Q103 152 91 136Z" fill={muzzle}/>
  <path d="M114 130L130 130Q124 141 121 141Z" fill="#D77883" stroke="#895260" strokeWidth="2"/>
  <path d="M121 141v7M121 148q-11 10-21-2M121 148q11 10 22-2" fill="none" stroke="#694452" strokeWidth="3" strokeLinecap="round"/>
  <path d="M93 132L52 126 M94 139L49 145 M151 131L188 126 M151 139L191 145" fill="none" stroke="#FFF6E8" strokeWidth="4" strokeLinecap="round"/>
  <path d="M74 173l15 9M167 173l-16 12M76 196l15 5M165 197l-15 4" fill="none" stroke="#B16E50" strokeWidth="6" strokeLinecap="round" opacity=".65"/>
 </g>;
}
function Bird({fur,side,muzzle,eye,wing}:P){
 return <g strokeLinejoin="round">
  <path d="M70 176 Q28 163 25 123 Q54 124 80 147Z" fill={side} stroke={outline} strokeWidth="4"/>
  <path d="M73 183 Q28 188 13 155 Q43 149 76 158Z" fill={wing} stroke={outline} strokeWidth="4"/>
  <path d="M91 88 C55 98 49 151 66 190 Q84 225 130 222 Q180 217 187 166 Q196 118 164 89Z" fill={fur} stroke={outline} strokeWidth="5"/>
  <ellipse cx="140" cy="163" rx="34" ry="46" fill={muzzle} opacity=".81"/>
  <path d="M83 139 C38 143 51 204 99 205 Q125 195 136 155 Q111 169 83 139Z" fill={wing} stroke={outline} strokeWidth="4"/>
  <path d="M72 173Q91 193 116 171 M77 184Q94 197 104 187" fill="none" stroke="#E2FAF6" strokeWidth="5" strokeLinecap="round" opacity=".7"/>
  <path d="M92 68 Q75 28 99 18 Q114 17 122 44 Q124 13 143 20 Q155 30 146 55" fill={side} stroke={outline} strokeWidth="4"/>
  <path d="M76 72 C79 37 111 26 142 35 Q182 43 188 88 Q187 130 155 142 Q115 158 86 129 Q64 105 76 72Z" fill={fur} stroke={outline} strokeWidth="5"/>
  <path d="M89 57 Q113 37 143 58" stroke="#E6FBFF" strokeWidth="7" opacity=".48" strokeLinecap="round" fill="none"/>
  <ellipse cx="112" cy="90" rx="17" ry="22" fill={eye} stroke={outline} strokeWidth="3"/>
  <ellipse cx="163" cy="92" rx="14" ry="21" fill={eye} stroke={outline} strokeWidth="3"/>
  <ellipse cx="117" cy="96" rx="8" ry="13" fill="#25364E"/><ellipse cx="164" cy="98" rx="7" ry="12" fill="#25364E"/>
  <circle cx="121" cy="89" r="3.5" fill="#FFF"/><circle cx="166" cy="91" r="3" fill="#FFF"/>
  <path d="M156 109 Q180 104 211 121 Q188 144 157 133Z" fill="#FFC353" stroke="#85503B" strokeWidth="4"/>
  <path d="M164 124 Q185 128 201 123" fill="none" stroke="#DB8A38" strokeWidth="3"/>
  <path d="M105 215L103 234 M146 216L148 234" stroke="#B67A41" strokeWidth="5" strokeLinecap="round"/>
  <path d="M103 234l-17 6m17-6 1 7m0-7 15 6 M148 234l-15 6m15-6 2 7m-2-7 16 5" fill="none" stroke="#B67A41" strokeWidth="4" strokeLinecap="round"/>
 </g>;
}
function Rabbit({fur,side,muzzle,eye}:P){
 return <g strokeLinejoin="round">
  <circle cx="62" cy="191" r="23" fill={muzzle} stroke={outline} strokeWidth="4"/>
  <circle cx="53" cy="181" r="14" fill="#FFF4E4" opacity=".9"/>
  <path d="M94 118 Q62 143 73 198 Q79 230 112 232 L171 228 Q186 196 162 143 Q150 122 133 119Z" fill={fur} stroke={outline} strokeWidth="5"/>
  <ellipse cx="130" cy="183" rx="30" ry="39" fill={muzzle} opacity=".86"/>
  <path d="M79 211 Q51 216 59 234 Q74 248 116 236 Q124 225 105 215" fill={fur} stroke={outline} strokeWidth="4"/>
  <path d="M136 219 Q135 240 157 243 Q182 246 190 235 Q185 218 161 217Z" fill={side} stroke={outline} strokeWidth="4"/>
  <path d="M86 89 C65 61 53 7 66 6 Q91 4 111 77Z" fill={side} stroke={outline} strokeWidth="5"/>
  <path d="M139 76 C145 35 169 4 181 10 Q193 27 163 94Z" fill={side} stroke={outline} strokeWidth="5"/>
  <path d="M78 18 Q73 43 96 72 L97 48 Q84 25 78 18Z M174 21 Q158 38 150 73 L164 59 Q177 31 174 21Z" fill="#EFA7AD" stroke="#D97F92" strokeWidth="2"/>
  <ellipse cx="121" cy="113" rx="61" ry="52" fill={fur} stroke={outline} strokeWidth="5"/>
  <path d="M74 83 Q96 67 124 70" stroke="#FFF" strokeOpacity=".3" strokeWidth="7" strokeLinecap="round" fill="none"/>
  <ellipse cx="100" cy="105" rx="17" ry="21" fill={eye} stroke={outline} strokeWidth="3"/>
  <ellipse cx="152" cy="104" rx="16" ry="21" fill={eye} stroke={outline} strokeWidth="3"/>
  <ellipse cx="103" cy="108" rx="8" ry="13" fill="#292F43"/><ellipse cx="154" cy="108" rx="8" ry="13" fill="#292F43"/>
  <circle cx="106" cy="101" r="3.7" fill="#FFF"/><circle cx="157" cy="100" r="3.7" fill="#FFF"/>
  <path d="M94 139 Q109 120 124 138 Q139 123 158 140 Q151 162 126 164 Q99 161 94 139Z" fill={muzzle}/>
  <path d="M114 135L135 135Q126 146 124 147Z" fill="#E18999" stroke="#946475" strokeWidth="2"/>
  <path d="M125 147v9" stroke="#684555" strokeWidth="3" strokeLinecap="round"/>
  <rect x="119" y="154" width="10" height="14" rx="3" fill="#FFF" stroke="#684555" strokeWidth="2"/>
  <rect x="129" y="154" width="10" height="14" rx="3" fill="#FFF" stroke="#684555" strokeWidth="2"/>
  <path d="M100 146l-25-5 M149 146l27-5" stroke="#FFF2E4" strokeWidth="3" strokeLinecap="round"/>
 </g>;
}
export interface SentenceAnimalArtworkProps {
 actor:SentenceAnimalSpecies;
 color?:string;
 index?:number;
}
export function SentenceAnimalArtwork({actor,color,index=0}:SentenceAnimalArtworkProps){
 const colors=(color&&TINTS[color])||NATURAL[actor];
 const [main,dark,light]=colors;
 const id='sp-v8-'+actor+'-'+index;
 const p:P={
  fur:'url(#'+id+'-fur)',side:'url(#'+id+'-side)',
  muzzle:'url(#'+id+'-muzzle)',eye:'url(#'+id+'-eye)',
  wing:'url(#'+id+'-wing)',collar:'url(#'+id+'-collar)'
 };
 return <g data-animal={actor} data-color={color||'natural'} className={'sp-v8-character sp-v8-'+actor}>
  <defs>
   <linearGradient id={id+'-fur'} x1="0" y1="0" x2="1" y2="1"><stop stopColor={light}/><stop offset=".42" stopColor={main}/><stop offset="1" stopColor={dark}/></linearGradient>
   <linearGradient id={id+'-side'} x1="0" y1="0" x2="1" y2="1"><stop stopColor={dark}/><stop offset=".65" stopColor={main}/><stop offset="1" stopColor={light}/></linearGradient>
   <linearGradient id={id+'-muzzle'} x1="0" y1="0" x2=".5" y2="1"><stop stopColor="#FFFCED"/><stop offset=".78" stopColor="#F7E6CC"/><stop offset="1" stopColor="#DDB99D"/></linearGradient>
   <linearGradient id={id+'-eye'} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#FFF"/><stop offset="1" stopColor="#E8F3FA"/></linearGradient>
   <linearGradient id={id+'-wing'} x1="0" y1="0" x2="1" y2="1"><stop stopColor={light}/><stop offset="1" stopColor={dark}/></linearGradient>
   <linearGradient id={id+'-collar'} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#F65D59"/><stop offset="1" stopColor="#AB2C4D"/></linearGradient>
  </defs>
  <g transform="translate(-76 -130) scale(.64)">
   {actor==='dog'?<Dog {...p}/>:actor==='cat'?<Cat {...p}/>:actor==='bird'?<Bird {...p}/>:<Rabbit {...p}/>}
  </g>
 </g>;
}
