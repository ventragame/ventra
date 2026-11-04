'use client';

import React,{useMemo,useState} from 'react';
import dynamic from 'next/dynamic';
import {getDistrictObjects} from './world/worldLayout';
import type {WorldObject} from './world/worldLayout';
import {DistrictPreviewArt} from './DistrictPreviewArt';
import {GARDEN_ORDER,GARDEN_THEMES,decorateWorldObjects,districtPercent,districtStatus,
 districtStatusLabel,mapProgress,type GardenDistrictId,type GardenDistrictProgress} from './world/gardenTheme';
import './word-garden-premium.css';
import {describeLearnerRoute} from '@/lib/learning/learningJourney';
import type {EnglishPlacement} from '@/lib/learning/gradeAwareLearningPolicy';

const ExplorerCanvas=dynamic(()=>import('./world/ExplorerCanvas').then(x=>x.ExplorerCanvas),{
 ssr:false,loading:()=> <div role="status" className="wg-map-loading">🌿 Harita hazırlanıyor…</div>
});

interface WordGardenDistrictMapProps {
 completedLevels:number;totalLevels:number;onEnterAnimals:()=>void;
 onEnterColors:()=>void;colorsUnlocked:boolean;colorsAvailable:boolean;colorCompleted:number;
 numberCompleted:number;numberTotal:number;numbersUnlocked:boolean;numbersAvailable:boolean;onEnterNumbers:()=>void;
 foodCompleted:number;foodTotal:number;foodUnlocked:boolean;foodAvailable:boolean;foodError:boolean;onEnterFood:()=>void;
 familyCompleted:number;familyTotal:number;familyUnlocked:boolean;familyAvailable:boolean;familyError:boolean;onEnterFamily:()=>void;
 templeCompleted:number;templeTotal:number;templeUnlocked:boolean;templeAvailable:boolean;templeError:boolean;onEnterTemple:()=>void;
 starsByDistrict?:Partial<Record<GardenDistrictId,number>>;
 coinBalance?:number|null;playerName?:string;onOpenPassport?:()=>void;
 gradeLevel?:number|null;englishLevel?:EnglishPlacement;onBack:()=>void;
}

/** One canonical progression / action layer for all six Word Garden worlds.
 * The Phaser map and visual world cards both call enter(), preserving locks,
 * error handling and persisted activity IDs. Help is opt-in for early readers.
 */
export const WordGardenDistrictMap:React.FC<WordGardenDistrictMapProps>=({
 completedLevels,totalLevels,onEnterAnimals,onEnterColors,
 colorsUnlocked,colorsAvailable,colorCompleted,numberCompleted,numberTotal,numbersUnlocked,numbersAvailable,onEnterNumbers,
 foodCompleted,foodTotal,foodUnlocked,foodAvailable,foodError,onEnterFood,
 familyCompleted,familyTotal,familyUnlocked,familyAvailable,familyError,onEnterFamily,
 templeCompleted,templeTotal,templeUnlocked,templeAvailable,templeError,onEnterTemple,
 starsByDistrict={},coinBalance=null,playerName,onOpenPassport,gradeLevel=null,englishLevel='Pre-A1',onBack
})=>{
 const [notice,setNotice]=useState('');
 const [selected,setSelected]=useState<GardenDistrictId|null>(null);
 const [mapTips,setMapTips]=useState(false);
 const route=useMemo(()=>describeLearnerRoute(gradeLevel,englishLevel),[gradeLevel,englishLevel]);
 const all=useMemo<GardenDistrictProgress[]>(()=>[
  {id:'animals',completed:completedLevels,total:totalLevels,stars:starsByDistrict.animals??0,unlocked:true,available:true},
  {id:'colors',completed:colorCompleted,total:3,stars:starsByDistrict.colors??0,unlocked:colorsUnlocked,available:colorsAvailable},
  {id:'numbers',completed:numberCompleted,total:numberTotal,stars:starsByDistrict.numbers??0,unlocked:numbersUnlocked,available:numbersAvailable},
  {id:'food',completed:foodCompleted,total:foodTotal,stars:starsByDistrict.food??0,unlocked:foodUnlocked,available:foodAvailable,error:foodError},
  {id:'family',completed:familyCompleted,total:familyTotal,stars:starsByDistrict.family??0,unlocked:familyUnlocked,available:familyAvailable,error:familyError},
  {id:'sanctuary',completed:templeCompleted,total:templeTotal,stars:starsByDistrict.sanctuary??0,unlocked:templeUnlocked,available:templeAvailable,error:templeError}
 ],[completedLevels,totalLevels,colorCompleted,colorsUnlocked,colorsAvailable,numberCompleted,numberTotal,numbersUnlocked,numbersAvailable,
  foodCompleted,foodTotal,foodUnlocked,foodAvailable,foodError,familyCompleted,familyTotal,familyUnlocked,familyAvailable,familyError,
  templeCompleted,templeTotal,templeUnlocked,templeAvailable,templeError,starsByDistrict]);
 const base=useMemo(()=>getDistrictObjects(colorsUnlocked&&colorsAvailable,numbersUnlocked&&numbersAvailable,
  foodUnlocked&&foodAvailable,familyUnlocked&&familyAvailable,templeUnlocked&&templeAvailable),
  [colorsUnlocked,colorsAvailable,numbersUnlocked,numbersAvailable,foodUnlocked,foodAvailable,
   familyUnlocked,familyAvailable,templeUnlocked,templeAvailable]);
 const objects=useMemo(()=>decorateWorldObjects(base,all),[base,all]);
 const summary=useMemo(()=>mapProgress(all),[all]);
 const featured=all.find(p=>districtStatus(p)==='continue')??all.find(p=>districtStatus(p)==='ready')??all[0];
 const focus=selected??featured.id;
 const enter=(obj:WorldObject)=>{
  const p=all.find(x=>x.id===obj.id);
  if(!p)return;
  const state=districtStatus(p);
  if(state==='error'){
   setNotice(`${GARDEN_THEMES[p.id].name} ilerlemesi yüklenemedi. Kayıtların silinmedi; yeniden deneyebilirsin.`);
   return;
  }
  if(state==='loading'){setNotice(`${GARDEN_THEMES[p.id].name} yükleniyor. Birazdan yeniden dene.`);return;}
  if(state==='locked'){setNotice(`${GARDEN_THEMES[p.id].name} için önceki görevlerini tamamlamalısın.`);return;}
  setNotice('');
  const actions:Record<GardenDistrictId,()=>void>={
   animals:onEnterAnimals,colors:onEnterColors,numbers:onEnterNumbers,food:onEnterFood,
   family:onEnterFamily,sanctuary:onEnterTemple
  };
  actions[p.id]();
 };
 const playFeatured=()=>{const target=objects.find(obj=>obj.id===featured.id);if(target)enter(target);};
 return <div role="dialog" aria-modal="true" aria-labelledby="wg-world-title"
  onPointerDown={e=>e.stopPropagation()} onPointerMove={e=>e.stopPropagation()}
  onPointerUp={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()}
  className="wg-premium-screen">
  <div className="wg-sky-orb wg-sky-orb-one" aria-hidden="true"/>
  <div className="wg-sky-orb wg-sky-orb-two" aria-hidden="true"/>
  <div className="wg-shell">
   <header className="wg-hud">
    <button type="button" onClick={onBack} className="wg-back" aria-label="Adalar evrenine dön">
     <span aria-hidden="true">←</span><span className="wg-back-label">Geri</span></button>
    <div className="wg-hud-identity">
     <span className="wg-hud-crest" aria-hidden="true">🌸</span>
     <div><strong id="wg-world-title">Kelime Bahçesi</strong>
      {playerName&&<small>{playerName}</small>}</div>
    </div>
    <div className="wg-hud-items">
     <span className="wg-hud-chip wg-star-chip" aria-label={`Toplam ${summary.stars} yıldız`}>
       <span aria-hidden="true">⭐</span> {summary.stars}</span>
     {onOpenPassport&&<button type="button" onClick={onOpenPassport}
       className="wg-hud-chip wg-passport" aria-label="Maceracı Pasaportu ve koleksiyonunu aç"
       title="Pasaport"><span aria-hidden="true">🎒</span><span className="wg-passport-label">{coinBalance??'—'}</span></button>}
     <button type="button" className="wg-help-toggle"
      onClick={()=>setMapTips(x=>!x)} aria-expanded={mapTips} aria-controls="wg-tips"
      aria-label="Harita yardımı ve öğrenme hedefleri" title="Nasıl oynanır?">?</button>
    </div>
   </header>

   {mapTips&&<section id="wg-tips" className="wg-tip-panel" role="region" aria-label="Harita kontrolleri ve öğrenme hedefleri">
    <div className="wg-tip-heading"><h2>🧭 Nasıl Oynanır?</h2>
     <button type="button" aria-label="Yardımı kapat" onClick={()=>setMapTips(false)}>✕</button></div>
    <div className="wg-tip-steps">
     <p><span aria-hidden="true">👆</span> Haritadaki dünyaya veya resmine dokun.</p>
     <p><span aria-hidden="true">🎮</span> Masaüstünde WASD/ok tuşlarıyla da gezebilirsin.</p>
     <p><span aria-hidden="true">🔒</span> Kilitli dünyalar önceki görevlerden sonra açılır.</p>
    </div>
    <div className="wg-route-summary" role="note" aria-label="Profiline göre İngilizce öğrenme hedefleri">
     <span className="wg-route-label">🎓 {route.gradeLabel} · İngilizce {route.englishLevel}</span>
     <span className="wg-route-goal">Bugünkü hedef: {route.goals[0]}</span>
    </div>
   </section>}

   <section className="wg-play-strip" aria-label="Macera ve ilerleme">
    <div className="wg-strip-heading">
     <span className="wg-strip-flower" aria-hidden="true">🌷</span>
     <div><small>HAYDİ KEŞFEDELİM!</small><h2>Altı büyülü dünya</h2></div>
    </div>
    <div className="wg-strip-progress" role="progressbar" aria-label="Kelime Bahçesi toplam ilerlemesi"
       aria-valuenow={summary.percent} aria-valuemin={0} aria-valuemax={100}>
     <div className="wg-strip-track"><span style={{width:`${summary.percent}%`}}/></div>
     <strong>%{summary.percent}</strong>
    </div>
    <button type="button" className="wg-hero-primary" onClick={playFeatured}
      aria-label={`${GARDEN_THEMES[featured.id].name}: ${featured.completed>0?'Devam et':'Oyna'}`}>
       <span aria-hidden="true">▶</span> {featured.completed>0?'Devam Et':'Oyna'}
    </button>
   </section>

   <main>
    <section className="wg-main-map" aria-label="Gezilebilir İngilizce dünyası">
     <div className="wg-map-heading">
      <h2><span aria-hidden="true">🗺️</span> Keşif Haritası</h2>
      <span className="wg-map-counter" aria-label={`${summary.finished} dünya tamamlandı, toplam altı dünya`}>✦ {summary.finished}/6</span>
     </div>
     <div className="wg-map-stage">
      <ExplorerCanvas key="premium-garden" area="garden" objects={objects}
       progress={Math.round(summary.percent/100*12)}
       caption="Büyülü Keşif Haritası" height={570} onInteract={enter} onInspect={obj=>enter(obj)}/>
     </div>
    </section>
    {notice&&<div className="wg-notice" role="status"><span aria-hidden="true">🧭</span>{notice}
      <button type="button" onClick={()=>setNotice('')} aria-label="Bildirimi kapat">✕</button></div>}

    <section className="wg-district-section" aria-labelledby="wg-district-title">
     <div className="wg-section-heading">
      <h2 id="wg-district-title"><span aria-hidden="true">🎮</span> Oyunlar</h2>
      <span className="wg-count-pill" aria-label={`${summary.finished} dünya tamamlandı`}>⭐ {summary.finished}/6</span>
     </div>
     <div className="wg-world-grid">
      {GARDEN_ORDER.map((id,index)=>{
       const p=all[index],theme=GARDEN_THEMES[id],state=districtStatus(p);
       const playable=state==='ready'||state==='continue'||state==='complete';
       const pct=districtPercent(p.completed,p.total);
       const obj=objects.find(x=>x.id===id);
       return <button type="button" key={id}
        onClick={()=>{setSelected(id);if(obj)enter(obj);}}
        onMouseEnter={()=>setSelected(id)} onFocus={()=>setSelected(id)}
        disabled={!playable}
        aria-label={`${theme.name}, ${p.completed}/${p.total} görev, ${districtStatusLabel(state)}`}
        className={`wg-world-card wg-card-${id} ${focus===id?'wg-card-featured':''} ${!playable?'wg-card-disabled':''}`}
        style={{'--wg-accent':theme.accent,'--wg-light':theme.light} as React.CSSProperties}>
        <div className="wg-card-top"><DistrictPreviewArt id={id}/>
         <span className="wg-card-index" aria-hidden="true">{String(index+1).padStart(2,'0')}</span>
         <span className={`wg-card-status wg-status-${state}`} aria-hidden="true">
           {state==='locked'?'🔒':state==='complete'?'✓':state==='loading'?'⏳':state==='error'?'!':'▶'}</span>
         <span className="wg-card-art-icon" aria-hidden="true">{theme.icon}</span>
        </div>
        <div className="wg-card-body">
         <h3>{theme.name}</h3>
         <div className="wg-card-meta">
          <span className="wg-card-stars" aria-label={`${p.stars} yıldız`}>⭐ {p.stars}</span>
          <span className="wg-card-task">{p.completed}/{p.total}</span>
          <span className="wg-card-action" aria-hidden="true">{state==='complete'?'↻':playable?'▶':state==='loading'?'…':'🔒'}</span>
         </div>
         <div className="wg-card-progress" role="progressbar" aria-label={`${theme.name} görev ilerlemesi`}
           aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
           <span style={{width:`${pct}%`}}/></div>
        </div>
       </button>;
      })}
     </div>
    </section>
   </main>
  </div>
 </div>;
};
