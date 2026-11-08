
import React from 'react';
import type {ForestActorId,ForestScene} from '@/lib/learning/storyForestEngine';

/** The exact WebP character is used only for its actual English animal identity.
 * Ineligible roles keep their correctly illustrated SVG fallback.
 */
const PREMIUM_ROOT='/assets/story-forest/premium/';
export const PREMIUM_STORY_CHARACTERS:Readonly<Partial<Record<ForestActorId,string>>> = Object.freeze({
 rabbit:'characters/rabbit_adventurer.webp',
 squirrel:'characters/squirrel_acorn.webp',
 bird:'characters/blue_bird_flying.webp',
 bird_flying:'characters/blue_bird_flying.webp',
 cat:'characters/cat_orange.webp',
 cat_gray_sleeping:'characters/cat_gray_sleeping.webp',
 cat_white_bow:'characters/cat_white_bow.webp',
 hedgehog:'characters/hedgehog_happy.webp'
});
export const PREMIUM_STORY_SCENES:Readonly<Partial<Record<ForestScene,string>>> = Object.freeze({
 path:'scenes/forest_path.webp',
 treehouse:'scenes/forest_treehouse.webp',
 pond:'scenes/forest_pond.webp',
 meadow:'scenes/forest_meadow.webp',
 bridge:'scenes/forest_bridge.webp'
});
export const STORY_FOREST_PREMIUM_COVER=PREMIUM_ROOT+'scenes/forest_clearing.webp';

/* All backgrounds are clean, actor-free storybook environments.
   Every answer illustration is drawn independently in StoryForestActor,
   so no invisible duplicate characters can confuse young learners. */
const TONES:Record<ForestScene,{sky:string;skyEnd:string;hill:string;floor:string;shadow:string;glow:string}>={
 path:{sky:'#69c0f5',skyEnd:'#f1f9cf',hill:'#69bda8',floor:'#9cdb78',shadow:'#356d63',glow:'#fff0ad'},
 treehouse:{sky:'#79c6ff',skyEnd:'#fce6e5',hill:'#80bfac',floor:'#b3df88',shadow:'#426c69',glow:'#ffe4b0'},
 pond:{sky:'#78c5f2',skyEnd:'#d6f8f3',hill:'#64bdba',floor:'#a4d78e',shadow:'#2a818e',glow:'#f5f6b5'},
 meadow:{sky:'#98c6fb',skyEnd:'#fbe9f8',hill:'#8bc6aa',floor:'#b1e38f',shadow:'#3b887b',glow:'#fff1cb'},
 camp:{sky:'#345caa',skyEnd:'#b399dd',hill:'#547a9e',floor:'#739786',shadow:'#274d70',glow:'#ffe6a1'},
 bridge:{sky:'#6caafa',skyEnd:'#ffe7da',hill:'#7fbea9',floor:'#a4de86',shadow:'#497e78',glow:'#fff4b8'}
};
const treeXs=[-30,112,250,373,518,692,833,1020,1166,1300];
export function StoryForestScenery({scene}: {scene:ForestScene}){
 const premium=PREMIUM_STORY_SCENES[scene];
 if(premium)return <img className={'sf-scenery sf-premium-scenery sf-scene-'+scene}
  src={PREMIUM_ROOT+premium} alt="" aria-hidden="true" draggable={false}
  decoding="async" loading="eager"/>;
 const t=TONES[scene],skyId='forest-sky-'+scene,grassId='forest-grass-'+scene;
 return <svg className="sf-scenery" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice"
   aria-hidden="true" focusable="false">
  <defs>
   <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
    <stop stopColor={t.sky}/><stop offset="1" stopColor={t.skyEnd}/>
   </linearGradient>
   <linearGradient id={grassId} x1=".2" y1="0" x2=".8" y2="1">
    <stop stopColor={t.floor}/><stop offset="1" stopColor={t.shadow}/>
   </linearGradient>
   <radialGradient id={'forest-glow-'+scene}>
    <stop stopColor={t.glow} stopOpacity=".75"/>
    <stop offset="1" stopColor={t.glow} stopOpacity="0"/>
   </radialGradient>
   <filter id={'forest-blur-'+scene}><feGaussianBlur stdDeviation="20"/></filter>
  </defs>
  <rect width="1200" height="720" fill={'url(#'+skyId+')'}/>
  <circle cx={scene==='camp'?650:945} cy="95" r="265" fill={'url(#forest-glow-'+scene+')'}/>
  <g fill="#fff" opacity={scene==='camp'?.15:.42}>
   <ellipse cx="155" cy="142" rx="130" ry="29"/>
   <ellipse cx="690" cy="94" rx="145" ry="34"/>
   <ellipse cx="1070" cy="178" rx="173" ry="31"/>
  </g>
  <path d="M0 423Q90 300 205 377Q310 204 443 383Q555 248 670 370Q765 204 893 388Q1045 262 1200 390V720H0Z" fill="#e8f0eb" opacity=".37"/>
  <path d="M0 446Q220 327 373 432Q505 331 640 429Q815 307 949 427Q1080 358 1200 446V720H0Z"
    fill={t.hill}/>
  {treeXs.map((x,i)=>{
    const y=380+(i%3)*24,s=.68+(i%4)*.11;
    return <g key={x} transform={'translate('+x+' '+y+') scale('+s+')'}>
     <path d="M0 20V202" stroke="#9d796d" strokeWidth="26" strokeLinecap="round"/>
     <path d="M-73 50Q-120 -34 -68 -85Q-44 -145 15 -126Q86 -145 97 -63Q125 24 53 71Z"
       fill={i%3===0?'#5eb8a0':i%3===1?'#80c989':'#92d993'} stroke="#5ba382" strokeWidth="9"/>
     <ellipse cx="-28" cy="-60" rx="32" ry="22" fill="#e7fbc0" opacity=".28"/>
    </g>;
  })}
  <path d="M-20 520Q268 412 507 543Q715 456 902 526Q1060 450 1230 525V750H0Z" fill={'url(#'+grassId+')'}/>
  {scene==='path'&& <g>
    <path d="M440 720Q470 592 645 506Q728 464 792 470L938 720Z" fill="#f7daa5" opacity=".78"/>
    <path d="M516 722Q572 589 718 508" stroke="#fff0c9" strokeWidth="14" fill="none" opacity=".58"/>
   </g>}
  {scene==='treehouse'&&<g transform="translate(740 165)">
    <path d="M125 380V148" stroke="#7b605c" strokeWidth="72" strokeLinecap="round"/>
    <path d="M5 155L55 51L286 48L335 155Z" fill="#8c5575" stroke="#6b486f" strokeWidth="12"/>
    <rect x="39" y="143" width="252" height="208" rx="24" fill="#e9bf89" stroke="#9d7b71" strokeWidth="11"/>
    <path d="M27 159L168 -15L309 159Z" fill="#d46f98" stroke="#a95e86" strokeWidth="13"/>
    <rect x="136" y="228" width="67" height="123" rx="31" fill="#8e6072"/>
    <rect x="58" y="177" width="61" height="66" rx="13" fill="#a3e7e9" stroke="#fff5c5" strokeWidth="9"/>
    <rect x="222" y="177" width="48" height="64" rx="13" fill="#a3e7e9" stroke="#fff5c5" strokeWidth="9"/>
    <path d="M26 351Q171 392 312 351" stroke="#987665" strokeWidth="27" fill="none" strokeLinecap="round"/>
   </g>}
  {scene==='pond'&&<g>
    <ellipse cx="740" cy="583" rx="444" ry="129" fill="#b9f5ea" opacity=".7"/>
    <ellipse cx="730" cy="589" rx="416" ry="111" fill="#51c4e2" stroke="#b6f5f6" strokeWidth="11"/>
    <path d="M410 559Q600 525 836 566M620 635Q871 604 1050 623" stroke="#f5ffff" strokeWidth="11" fill="none" strokeLinecap="round" opacity=".6"/>
    <ellipse cx="900" cy="530" rx="46" ry="15" fill="#71b97c"/>
   </g>}
  {scene==='meadow'&&<g>
    <path d="M870 515V238" stroke="#7d8369" strokeWidth="44"/>
    <circle cx="865" cy="245" r="134" fill="#8cce92" stroke="#6ca57e" strokeWidth="10"/>
    <circle cx="788" cy="296" r="94" fill="#a5e0a0" opacity=".85"/>
    <circle cx="972" cy="292" r="99" fill="#85caa1" opacity=".86"/>
   </g>}
  {scene==='camp'&&<g>
    <path d="M710 579L882 328L1090 585Z" fill="#ffe1ac" stroke="#d6a178" strokeWidth="12"/>
    <path d="M882 328L890 580L1080 582Z" fill="#c38ba4"/>
    <path d="M893 583L864 467L934 467Z" fill="#74527a"/>
    <path d="M1070 599Q1024 557 1068 501Q1096 539 1080 560Q1136 520 1130 572Q1113 614 1070 599Z" fill="#ffbf65"/>
    <path d="M1072 590Q1054 568 1072 543Q1086 563 1072 590Z" fill="#fff6b6"/>
   </g>}
  {scene==='bridge'&&<g>
    <ellipse cx="823" cy="630" rx="365" ry="110" fill="#6ecfe5"/>
    <path d="M358 604Q635 354 981 603" fill="none" stroke="#ad7e79" strokeWidth="41"/>
    <path d="M350 583Q651 329 990 586" fill="none" stroke="#ffdfb6" strokeWidth="27"/>
    {[370,510,660,812,970].map((x,i)=><path key={x} d={'M'+x+' '+(i%2?440:520)+'v134'} stroke="#8c6d7c" strokeWidth="22" strokeLinecap="round"/>)}
   </g>}
  <path d="M-30 715Q200 639 368 715Q547 661 716 716Q961 643 1230 704V750H-30Z" fill="#2e7c6b" opacity=".29"/>
  {Array.from({length:42},(_,i)=>{
    const x=22+(i*107)%1160,y=551+(i*53)%150,r=5+i%4*2;
    return <g key={i} transform={'translate('+x+' '+y+')'}>
     <path d={'M0 0v-'+(r*2)} stroke="#449a6f" strokeWidth="2"/>
     <circle cy={-r*2} r={r} fill={['#fbd3e0','#fff4af','#d7c8ff','#b1f0ee'][i%4]} opacity=".9"/>
     <circle cy={-r*2} r={r/3} fill="#ffd978"/>
    </g>;
  })}
  {Array.from({length:24},(_,i)=>{
    const x=35+(i*263)%1140,y=70+(i*97)%500,r=i%3===0?7:4;
    return <path key={i} d={'M'+x+' '+(y-r)+'l'+r+' '+r+' -'+r+' '+r+' -'+r+' -'+r+'Z'}
      fill={t.glow} opacity={i%3===0?.85:.44}/>;
  })}
 </svg>;
}
const ANIMAL_COLORS:Record<string,{main:string;stroke:string;belly:string}>={
 rabbit:{main:'#f0eafa',stroke:'#c6bada',belly:'#fffaf2'},
 fox:{main:'#ff9e58',stroke:'#c87458',belly:'#fff0cc'},
 bird:{main:'#6bc7f4',stroke:'#458ccb',belly:'#e7fff5'},
 bear:{main:'#bf9379',stroke:'#936b6f',belly:'#f5d6ac'},
 deer:{main:'#ddaa78',stroke:'#b38a78',belly:'#fff0cb'},
 squirrel:{main:'#f5a36a',stroke:'#ba765c',belly:'#ffeed8'},
 cat:{main:'#e8b9d7',stroke:'#bd8faf',belly:'#fdf1f7'},
 dog:{main:'#c9a68e',stroke:'#977a74',belly:'#ffe8d0'}
};
export function StoryForestActor({id}: {id:ForestActorId}){
 const premium=PREMIUM_STORY_CHARACTERS[id];
 if(premium)return <img className="sf-actor-illustration sf-premium-actor"
   src={PREMIUM_ROOT+premium} alt="" aria-hidden="true" draggable={false}
   decoding="async" loading="eager"/>;
 const kind=id.startsWith('rabbit_')?'rabbit':
  id.startsWith('bear_')?'bear':id.startsWith('fox_')?'fox':
  id.startsWith('bird_')?'bird':id;
 const isColor=['red_apple','yellow_star','blue_balloon','pink_flower','purple_flower','green_leaf'].includes(id);
 const t=ANIMAL_COLORS[kind]||ANIMAL_COLORS.rabbit;
 return <svg className="sf-actor-illustration" viewBox="0 0 320 320" role="presentation" aria-hidden="true" focusable="false">
  <defs>
   <linearGradient id={'sf-fur-'+id} x1="0" y1="0" x2="1" y2="1">
    <stop stopColor={t.belly}/><stop offset=".52" stopColor={t.main}/>
    <stop offset="1" stopColor={t.stroke}/>
   </linearGradient>
  </defs>
  <ellipse cx="159" cy="291" rx="90" ry="12" fill="#264f63" opacity=".15"/>
  {id==='rabbit_tree'&&<g>
    <path d="M53 247V85" stroke="#9e7d73" strokeWidth="26"/>
    <circle cx="61" cy="73" r="57" fill="#79c996" stroke="#4fa77d" strokeWidth="8"/>
   </g>}
  {id==='rabbit_pond'&&<ellipse cx="173" cy="281" rx="133" ry="33" fill="#6bd6ed" stroke="#b7f5ef" strokeWidth="7"/>}
  {id==='rabbit_rock'&&<path d="M27 282L79 203L262 218L294 284Z" fill="#98b3bd" stroke="#7b939f" strokeWidth="8"/>}
  {isColor ? <>
   {id==='red_apple'&&<g>
    <path d="M162 98Q103 68 78 117Q35 185 113 250Q143 274 163 263Q184 277 215 246Q285 164 247 113Q220 76 165 100Z"
      fill="#f35e6c" stroke="#c94d63" strokeWidth="9"/>
    <path d="M166 103Q162 72 184 57" stroke="#827d52" strokeWidth="9"/>
    <path d="M167 91Q203 48 246 77Q205 108 167 91" fill="#74c58b"/>
   </g>}
   {id==='yellow_star'&&<path d="M160 29L199 112L291 125L223 191L238 282L160 236L83 281L98 192L30 126L123 112Z" fill="#ffdc7a" stroke="#edb25c" strokeWidth="11"/>}
   {id==='blue_balloon'&&<g>
    <ellipse cx="160" cy="127" rx="89" ry="103" fill="#65c7f4" stroke="#438bd2" strokeWidth="10"/>
    <ellipse cx="128" cy="89" rx="19" ry="35" fill="#fff" opacity=".4"/>
    <path d="M160 231L148 254L171 254Z" fill="#dba983"/>
    <path d="M161 255Q111 277 173 313" fill="none" stroke="#a696bf" strokeWidth="6"/>
   </g>}
   {(id==='pink_flower'||id==='purple_flower')&&<g>
    {[0,60,120,180,240,300].map(angle=><ellipse key={angle} cx="160" cy="98" rx="43" ry="72"
      transform={'rotate('+angle+' 160 164)'} fill={id==='pink_flower'?'#f5a5d3':'#b7a4f0'}
      stroke={id==='pink_flower'?'#d98eb9':'#9389d6'} strokeWidth="7"/>)}
    <circle cx="160" cy="164" r="50" fill="#ffe6a4" stroke="#e7bf68" strokeWidth="8"/>
   </g>}
   {id==='green_leaf'&&<g>
    <path d="M45 268Q7 84 281 34Q330 249 45 268Z" fill="#90d79b" stroke="#51a381" strokeWidth="11"/>
    <path d="M51 265Q159 147 274 47" stroke="#d8f9c0" fill="none" strokeWidth="10"/>
   </g>}
  </> : kind==='fish'?<g>
   <path d="M78 157L22 97V221Z" fill="#66c7f4" stroke="#438bd2" strokeWidth="9"/>
   <ellipse cx="174" cy="158" rx="116" ry="78" fill="#62c5ec" stroke="#438cbd" strokeWidth="10"/>
   <path d="M138 95L181 29L219 97M167 213L204 267L238 209" fill="#a3e9f2" stroke="#56aed1" strokeWidth="7"/>
   <circle cx="223" cy="139" r="15" fill="#253b59"/><circle cx="229" cy="132" r="5" fill="#fff"/>
  </g>:kind==='butterfly'?<g>
   <path d="M160 161Q7 13 45 164Q8 257 157 203" fill="#ffc8e0" stroke="#d68fc7" strokeWidth="10"/>
   <path d="M160 161Q310 13 275 165Q312 261 164 203" fill="#a4d9f8" stroke="#76a6da" strokeWidth="10"/>
   <ellipse cx="160" cy="167" rx="23" ry="95" fill="#9f7ec2"/>
   <path d="M152 102L135 76M169 103L193 77" stroke="#9874ac" strokeWidth="7"/>
  </g>:kind==='bird'?<g>
   <ellipse cx="157" cy="179" rx="94" ry="102" fill="#70c4f0" stroke="#468fcd" strokeWidth="9"/>
   <path d="M104 182Q23 67 51 204Q80 250 140 221M225 187Q310 68 282 210Q248 243 198 218"
     fill="#329bd4" stroke="#3d83be" strokeWidth="9"/>
   <ellipse cx="156" cy="217" rx="49" ry="51" fill="#e6fff8"/>
   <path d="M166 188L219 197L167 222Z" fill="#ffc56e" stroke="#d89455" strokeWidth="6"/>
   <circle cx="141" cy="164" r="14" fill="#203853"/><circle cx="147" cy="158" r="5" fill="#fff"/>
   {id==='bird_flying'&&<path d="M34 92Q17 58 11 79M277 92Q297 55 312 79" stroke="#e7fdff" strokeWidth="9" fill="none"/>}
  </g>:<g>
   {kind==='rabbit'&&<g>
    <ellipse cx="105" cy="65" rx="32" ry="82" transform="rotate(-12 105 65)" fill={t.main} stroke={t.stroke} strokeWidth="8"/>
    <ellipse cx="215" cy="65" rx="32" ry="82" transform="rotate(12 215 65)" fill={t.main} stroke={t.stroke} strokeWidth="8"/>
    <ellipse cx="105" cy="66" rx="15" ry="60" transform="rotate(-12 105 66)" fill="#f1b2c8"/>
    <ellipse cx="215" cy="66" rx="15" ry="60" transform="rotate(12 215 66)" fill="#f1b2c8"/>
   </g>}
   {(kind==='fox'||kind==='cat'||kind==='deer'||kind==='squirrel')&&<g>
    <path d="M60 151L73 38L132 95L202 95L249 38L262 150Z" fill={t.main} stroke={t.stroke} strokeWidth="10"/>
    {kind==='deer'&&<path d="M104 63L82 9M112 42L65 29M213 63L238 8M209 42L255 28" stroke="#b08062" strokeWidth="12" fill="none" strokeLinecap="round"/>}
    {kind==='squirrel'&&<path d="M52 226Q-20 134 39 91Q-20 14 12 14Q-20 121 80 193" fill="#eda46c" stroke="#bd8662" strokeWidth="9"/>}
   </g>}
   {kind==='bear'&&<g>
    <circle cx="78" cy="120" r="40" fill={t.main} stroke={t.stroke} strokeWidth="8"/>
    <circle cx="248" cy="120" r="40" fill={t.main} stroke={t.stroke} strokeWidth="8"/>
   </g>}
   {kind==='dog'&&<g>
    <ellipse cx="56" cy="143" rx="32" ry="76" transform="rotate(-15 56 143)" fill="#a88772"/>
    <ellipse cx="261" cy="143" rx="32" ry="76" transform="rotate(15 261 143)" fill="#a88772"/>
   </g>}
   <ellipse cx="162" cy="243" rx="88" ry="66" fill={'url(#sf-fur-'+id+')'} stroke={t.stroke} strokeWidth="8"/>
   <ellipse cx="160" cy="155" rx="107" ry="100" fill={'url(#sf-fur-'+id+')'} stroke={t.stroke} strokeWidth="9"/>
   <ellipse cx="157" cy="196" rx="66" ry="44" fill={t.belly} opacity=".94"/>
   <ellipse cx="115" cy="151" rx="15" ry={id==='bear_sleeping'?4:22} fill="#243751"/>
   <ellipse cx="209" cy="151" rx="15" ry={id==='bear_sleeping'?4:22} fill="#243751"/>
   {id!=='bear_sleeping'&&<><circle cx="120" cy="143" r="5" fill="#fff"/><circle cx="214" cy="143" r="5" fill="#fff"/></>}
   <path d="M148 190Q160 179 175 190L161 205Z" fill="#b27b8c"/>
   <path d="M160 205Q147 224 135 215M160 205Q175 224 188 215" stroke="#8d657c" strokeWidth="6" fill="none" strokeLinecap="round"/>
   <ellipse cx="103" cy="205" rx="20" ry="11" fill="#f5a3ba" opacity=".4"/>
   <ellipse cx="220" cy="205" rx="20" ry="11" fill="#f5a3ba" opacity=".4"/>
   <ellipse cx="105" cy="286" rx="31" ry="15" fill={t.belly}/>
   <ellipse cx="210" cy="286" rx="31" ry="15" fill={t.belly}/>
   {id==='rabbit_reading'&&<g>
    <path d="M88 222Q125 206 158 227Q197 205 239 221V288Q192 268 160 291Q127 268 88 285Z" fill="#fff0bc" stroke="#947dbc" strokeWidth="8"/>
    <path d="M160 225V289" stroke="#947dbc" strokeWidth="5"/>
   </g>}
   {id==='fox_running'&&<g stroke="#fff5ca" strokeWidth="9" fill="none" strokeLinecap="round">
    <path d="M41 252L16 235M48 277H12M254 262L295 238"/>
   </g>}
   {id==='bear_sleeping'&&<path d="M253 82l17 -29 25 5 -13 26 23 4" stroke="#fff3aa" strokeWidth="9" fill="none"/>}
  </g>}
 </svg>;
}
