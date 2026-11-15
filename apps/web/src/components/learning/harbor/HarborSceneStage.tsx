'use client';
import React from 'react';
import type {HarborQuest} from '@/lib/learning/harborMissionEngine';
import {HARBOR_SCENE_ASSETS} from '@/lib/learning/harborSceneAssets';
import {harborBeat} from '@/lib/learning/harborGamePolish';
import {HarborCharacterAvatar,type HarborCaptainMood} from './HarborCaptainAvatar';

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
type Props={
 quest:HarborQuest;questStep:number;resolved:boolean;selected:boolean;
 wrongObjects:readonly HarborPropId[];
 onSelect:(id:HarborPropId)=>void;onSpeak:()=>void;
 speakerLine:string;speaking:boolean;
 avatarMood:HarborCaptainMood;avatarCue:string;
};
export function HarborSceneStage({quest,questStep,resolved,selected,wrongObjects,onSelect,onSpeak,speakerLine,speaking,avatarMood,avatarCue}:Props){
 const props=getHarborSceneObjects(quest);
 const sceneArt=HARBOR_SCENE_ASSETS[quest.place];
 const requiresItem=questStep===0&&quest.action!=='meet';
 const stageEvent=resolved?'complete':selected?'selected':'waiting';
 const beat=harborBeat(quest.action,questStep);
 return <section className={['hp-scene','hp-place-'+quest.place,'hp-action-'+quest.action,'hp-'+stageEvent].join(' ')}
  aria-label={quest.title} data-quest={quest.id} data-stage={stageEvent}
  data-step={questStep} data-beat={quest.action}>
   <picture className="hp-scenery" aria-hidden="true">
    <source media="(max-width: 640px)" srcSet={sceneArt.mobile} type="image/webp"/>
    <img src={sceneArt.desktop} alt="" decoding="async" draggable={false}/>
   </picture>
   <div className="hp-sky" aria-hidden="true"><span/><span/><span/></div>
   <div className="hp-beat-label" aria-label={'Görev aşaması '+(questStep+1)+' / 3'}>
    <span>{questStep+1}/3</span>{beat}
   </div>
   <div className="hp-water" aria-hidden="true"><i/><i/><i/></div>
   <div className="hp-dock-floor" aria-hidden="true"/>
   <div className="hp-ship" aria-hidden="true"><span className="hp-ship-mast"/><span className="hp-ship-sail"/><span className="hp-ship-hull"/></div>
   <div className="hp-lighthouse" aria-hidden="true"><span/></div>
   <div className="hp-festival-lights" aria-hidden="true"><span/><span/><span/><span/><span/></div>
   <div className="hp-actor" data-actor={quest.actor}>
    <HarborCharacterAvatar actor={quest.actor} mood={avatarMood} cue={avatarCue}/>
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
      className="hp-object-choice" data-wrong={wrongObjects.includes(id)}
      aria-label={HARBOR_PROPS[id].name+(wrongObjects.includes(id)?', bir daha dene':'')}>
      <HarborProp id={id}/><span>{HARBOR_PROPS[id].name}</span>
     </button>)}
    </div>
   </div>}
   {(selected||resolved)&&<div className="hp-stage-success" aria-hidden="true">
    {resolved?'✦':selected?'✓':''}
   </div>}
  </section>;
}
