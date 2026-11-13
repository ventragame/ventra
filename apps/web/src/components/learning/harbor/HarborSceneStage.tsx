'use client';
import React from 'react';
import type {HarborQuest} from '@/lib/learning/harborMissionEngine';
import {HARBOR_SCENE_ASSETS} from '@/lib/learning/harborSceneAssets';

export type HarborPropId='boat'|'water'|'apple'|'fish'|'map'|'key'|'lantern'|'crystal'|'parrot'|'cat'|'rabbit'|'turtle';
export const HARBOR_PROPS:Record<HarborPropId,{name:string;image:string|null;fallback:string}>={
 boat:{name:'Yelkenli',image:null,fallback:'⛵'},
 water:{name:'Su',image:null,fallback:'💧'},
 apple:{name:'Elma',image:'/assets/story-forest/premium/objects/apple.webp',fallback:'🍎'},
 fish:{name:'Balık',image:'/assets/animals/fluent-3d/fish.png',fallback:'🐟'},
 map:{name:'Harita',image:null,fallback:'🗺️'},
 key:{name:'Anahtar',image:'/assets/story-forest/premium/objects/gold_key.webp',fallback:'🗝️'},
 lantern:{name:'Fener',image:'/assets/story-forest/premium/clues/lantern.webp',fallback:'🏮'},
 crystal:{name:'Kristal',image:'/assets/story-forest/premium/objects/crystal.webp',fallback:'💎'},
 parrot:{name:'Papağan',image:'/assets/animals/fluent-3d/parrot.png',fallback:'🦜'},
 cat:{name:'Kedi',image:'/assets/story-forest/premium/characters/cat_orange.webp',fallback:'🐈'},
 rabbit:{name:'Tavşan',image:'/assets/story-forest/premium/characters/rabbit_adventurer.webp',fallback:'🐇'},
 turtle:{name:'Kaplumbağa',image:'/assets/animals/fluent-3d/turtle.png',fallback:'🐢'}
};
const ART:Record<Exclude<HarborQuest['actor'],'leo'>,string>={
 parrot:'/assets/animals/fluent-3d/parrot.png',
 turtle:'/assets/animals/fluent-3d/turtle.png',
 fox:'/assets/story-forest/premium/characters/cat_orange.webp',
 rabbit:'/assets/story-forest/premium/characters/rabbit_adventurer.webp'
};
export const HARBOR_OBJECT_PAIRS:Record<HarborQuest['action'],readonly HarborPropId[]>={
 meet:['parrot','boat'],crew:['parrot','cat'],board:['boat','map'],deliver:['water','fish'],
 trade:['apple','fish'],help:['fish','apple'],chart:['map','key'],
 navigate:['map','boat'],rescue:['turtle','cat'],light:['lantern','key'],
 repair:['key','lantern'],signal:['crystal','lantern'],invite:['parrot','rabbit'],
 decorate:['lantern','apple'],celebrate:['boat','lantern']
};
export function getHarborSceneObjects(quest:HarborQuest):readonly HarborPropId[]{
 const source=HARBOR_OBJECT_PAIRS[quest.action];
 return [quest.item,...source.filter(x=>x!==quest.item)].slice(0,2);
}
export function HarborVectorProp({id}:{id:'boat'|'map'|'water'}){
 if(id==='water')return <svg viewBox="0 0 88 74" className="hp-prop-vector" role="img" aria-label="Su bardağı">
 <defs><linearGradient id="hp-glass" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e1fbff"/><stop offset="1" stopColor="#66d8ee"/></linearGradient></defs>
 <path d="M18 9H71L64 63Q44 75 24 63Z" fill="url(#hp-glass)" stroke="#317fa5" strokeWidth="3"/>
 <path d="M25 29H65L60 59Q42 69 29 57Z" fill="#58c5ed" opacity=".8"/><path d="M30 16V37" stroke="white" strokeWidth="5" opacity=".8" strokeLinecap="round"/>
 </svg>;
 if(id==='map')return <svg viewBox="0 0 88 74" className="hp-prop-vector" role="img" aria-label="Harita">
 <defs><linearGradient id="hp-mapfill" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffefb9"/><stop offset="1" stopColor="#d8ae69"/></linearGradient></defs>
 <path d="M9 14L30 8L52 14L78 7V62L52 68L30 61L9 67Z" fill="url(#hp-mapfill)" stroke="#956441" strokeWidth="3" strokeLinejoin="round"/>
 <path d="M30 8V61M52 14V68" stroke="#ac865b" strokeWidth="2" opacity=".8"/>
 <path d="M24 45Q33 20 49 34L63 24" stroke="#3786a1" strokeWidth="4" strokeLinecap="round" fill="none" strokeDasharray="5 4"/>
 <path d="M57 20L68 35M68 20L57 35" stroke="#ba4f53" strokeWidth="5" strokeLinecap="round"/>
 </svg>;
 return <svg viewBox="0 0 88 74" className="hp-prop-vector" role="img" aria-label="Yelkenli">
 <defs><linearGradient id="hp-boathull" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e0ae6e"/><stop offset="1" stopColor="#85583c"/></linearGradient></defs>
 <path d="M8 52H81L69 67H22Z" fill="url(#hp-boathull)" stroke="#674a36" strokeWidth="3"/>
 <path d="M42 13V52" stroke="#725a3b" strokeWidth="4"/><path d="M47 13L77 47H47Z" fill="#f7e8bd" stroke="#dfc29a" strokeWidth="2"/>
 <path d="M36 18L14 47H36Z" fill="#e9f9ff" stroke="#a2d7dc" strokeWidth="2"/><path d="M10 71Q22 67 35 71T58 71T83 71" stroke="#409cc3" strokeWidth="3" fill="none"/>
 </svg>;
}
export function HarborProp({id}: {id:HarborPropId}){
 const item=HARBOR_PROPS[id];
 if(id==='boat'||id==='map'||id==='water')return <HarborVectorProp id={id}/>;
 return item.image?<img src={item.image} alt="" loading="eager" draggable={false}
   className="hp-prop-art"/>:
 <div className="hp-prop-icon" aria-hidden="true">{item.fallback}</div>;
}
/** Custom vector captain with dedicated facial structure, not a platform emoji. */
export function HarborCaptain(){
 return <svg className="hp-leo" viewBox="0 0 240 300" role="img" aria-label="Kaptan Leo"
  xmlns="http://www.w3.org/2000/svg">
 <defs>
  <linearGradient id="hp-coat" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#377bad"/><stop offset=".53" stopColor="#16426f"/><stop offset="1" stopColor="#102c57"/></linearGradient>
  <radialGradient id="hp-face" cx=".3" cy=".25" r=".9"><stop stopColor="#ffe3b1"/><stop offset=".57" stopColor="#eeb474"/><stop offset="1" stopColor="#ca824b"/></radialGradient>
  <linearGradient id="hp-cap" x1="0" y1="0" x2="1" y2=".9"><stop stopColor="#2a68a6"/><stop offset="1" stopColor="#072955"/></linearGradient>
  <radialGradient id="hp-shine" cx=".3" cy=".3" r="1"><stop stopColor="#fff" stopOpacity=".7"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
 </defs>
 <ellipse cx="121" cy="292" rx="91" ry="8" fill="#002d47" opacity=".3"/>
 <path d="M41 287Q45 213 76 194L161 195Q196 213 202 288Z" fill="url(#hp-coat)" stroke="#91caee" strokeWidth="3"/>
 <path d="M88 197L118 264L151 197L145 283L94 284Z" fill="#fff3d6" stroke="#ffd6a0" strokeWidth="3"/>
 <path d="M116 214L129 229L121 283L108 230Z" fill="#e16b59"/>
 <path d="M59 236L83 221L92 247L79 279M181 237L160 220L149 247L165 280" fill="none" stroke="#c9dffa" strokeWidth="5"/>
 <circle cx="64" cy="241" r="6" fill="#ffdb80" stroke="#fff3c1" strokeWidth="2"/>
 <circle cx="175" cy="241" r="6" fill="#ffdb80" stroke="#fff3c1" strokeWidth="2"/>
 <rect x="84" y="174" width="73" height="35" rx="14" fill="#d8a06b"/>
 <path d="M51 111Q45 55 91 49Q154 30 184 94L176 145Q168 195 124 200Q70 195 58 157Z"
  fill="url(#hp-face)" stroke="#bc7844" strokeWidth="4"/>
 <ellipse cx="56" cy="141" rx="16" ry="25" fill="#efb67b" stroke="#c88e5e" strokeWidth="3"/>
 <ellipse cx="178" cy="139" rx="16" ry="24" fill="#efb67b" stroke="#c88e5e" strokeWidth="3"/>
 <path d="M65 128Q80 116 98 124M139 120Q157 114 170 124" fill="none" stroke="#79502f" strokeWidth="6" strokeLinecap="round"/>
 <g fill="#fff"><ellipse cx="87" cy="142" rx="17" ry="18"/><ellipse cx="150" cy="139" rx="17" ry="18"/></g>
 <g fill="#2a4e72"><ellipse cx="91" cy="145" rx="9" ry="12"/><ellipse cx="149" cy="143" rx="9" ry="12"/></g>
 <g fill="#0e283e"><circle cx="94" cy="146" r="5"/><circle cx="151" cy="144" r="5"/></g>
 <g fill="#fff"><circle cx="96" cy="140" r="4"/><circle cx="153" cy="138" r="4"/></g>
 <path d="M115 147Q113 163 120 168L132 165" stroke="#bb814c" strokeWidth="4" fill="none" strokeLinecap="round"/>
 <path d="M93 179Q117 199 149 178" stroke="#9c4f46" strokeWidth="5" fill="none" strokeLinecap="round"/>
 <path d="M84 164L74 163M167 160L175 158" stroke="#cb7159" strokeWidth="4" strokeLinecap="round"/>
 <path d="M52 95Q54 48 83 43L148 41Q181 49 190 98L160 95L154 80Q116 91 71 80L69 98Z"
 fill="url(#hp-cap)" stroke="#99d5fb" strokeWidth="4"/>
 <path d="M53 91Q118 70 188 91Q183 112 141 111L91 110Q59 109 53 91Z"
 fill="#133f78" stroke="#e4bf79" strokeWidth="4"/>
 <path d="M102 55L120 48L138 56L131 68L122 73L110 68Z" fill="#ffdf81" stroke="#fff3bd" strokeWidth="2"/>
 <path d="M121 52L121 69M110 61H132" stroke="#bc8745" strokeWidth="3"/>
 <path d="M42 287Q36 244 50 226L58 207L74 210L69 245L83 262Q91 282 72 289Z" fill="#d4e8ed"/>
 <path d="M200 286Q214 235 191 212L181 214L173 241L161 260Q150 281 169 291Z" fill="#e1f4f8"/>
 <path d="M77 91Q103 82 148 86" stroke="#fff" strokeOpacity=".3" strokeWidth="5" fill="none"/>
 <ellipse cx="102" cy="123" rx="56" ry="83" fill="url(#hp-shine)" opacity=".2"/>
 </svg>;
}
type Props={
 quest:HarborQuest;questStep:number;resolved:boolean;selected:boolean;
 onSelect:(id:HarborPropId)=>void;onSpeak:()=>void;
 speakerLine:string;speaking:boolean;
};
export function HarborSceneStage({quest,questStep,resolved,selected,onSelect,onSpeak,speakerLine,speaking}:Props){
 const props=getHarborSceneObjects(quest);
 const sceneArt=HARBOR_SCENE_ASSETS[quest.place];
 const requiresItem=questStep===0&&quest.action!=='meet';
 const stageEvent=resolved?'complete':selected?'selected':'waiting';
 return <section className={['hp-scene','hp-place-'+quest.place,'hp-action-'+quest.action,'hp-'+stageEvent].join(' ')}
  aria-label={quest.title} data-quest={quest.id} data-stage={stageEvent}>
   <picture className="hp-scenery" aria-hidden="true">
    <source media="(max-width: 640px)" srcSet={sceneArt.mobile} type="image/webp"/>
    <img src={sceneArt.desktop} alt="" decoding="async" draggable={false}/>
   </picture>
   <div className="hp-sky" aria-hidden="true"><span/><span/><span/></div>
   <div className="hp-water" aria-hidden="true"><i/><i/><i/></div>
   <div className="hp-dock-floor" aria-hidden="true"/>
   <div className="hp-ship" aria-hidden="true"><span className="hp-ship-mast"/><span className="hp-ship-sail"/><span className="hp-ship-hull"/></div>
   <div className="hp-lighthouse" aria-hidden="true"><span/></div>
   <div className="hp-festival-lights" aria-hidden="true"><span/><span/><span/><span/><span/></div>
   <div className="hp-actor" data-actor={quest.actor}>
    {quest.actor==='leo'?<HarborCaptain/>:
     <img src={ART[quest.actor]} alt="" draggable={false}/>}
   </div>
   <div className="hp-speech-card">
    <span className="hp-speaker-tag">{quest.actor==='leo'?'KAPTAN LEO':
     quest.actor==='parrot'?'MİMİ':quest.actor==='turtle'?'KAPLUMBAĞA NİNO':
     quest.actor==='fox'?'LİMAN ESNAFI':'DENİZCİ LUNA'}</span>
    <p>{speakerLine}</p>
    <button type="button" onClick={onSpeak} disabled={speaking} className="hp-replay"
     aria-label="Konuşmayı tekrar dinle">🔊 Tekrar dinle</button>
   </div>
   {requiresItem&&!selected&&<div className="hp-object-task" aria-label="Sahne görevi">
    <strong>🔎 {quest.mission}</strong>
    <div className="hp-object-options">
     {props.map(id=><button key={id} type="button" onClick={()=>onSelect(id)}
      className="hp-object-choice" aria-label={HARBOR_PROPS[id].name}>
      <HarborProp id={id}/><span>{HARBOR_PROPS[id].name}</span>
     </button>)}
    </div>
   </div>}
   {(selected||resolved)&&<div className="hp-stage-success" aria-hidden="true">
    {resolved?'✦':selected?'✓':''}
   </div>}
  </section>;
}
