'use client';

import React,{useMemo,useState} from 'react';
import dynamic from 'next/dynamic';
import {getDistrictObjects} from './world/worldLayout';
import type {WorldObject} from './world/worldLayout';
import {DistrictPreviewArt} from './DistrictPreviewArt';
import {GARDEN_ORDER,GARDEN_THEMES,decorateWorldObjects,districtPercent,districtStatus,
 districtStatusLabel,mapProgress,type GardenDistrictId,type GardenDistrictProgress} from './world/gardenTheme';
import './word-garden-premium.css';
import './alphabet/alphabet-entry.css';
import './themes/theme-entry.css';
import './word-garden-modular-v4.css';
import './word-garden-hub-v5.css';
import {describeLearnerRoute} from '@/lib/learning/learningJourney';
import {IslandGreetingPill} from './island/IslandGreeting';
import './island/island-home.css';
import type {EnglishPlacement} from '@/lib/learning/gradeAwareLearningPolicy';

const ExplorerCanvas=dynamic(()=>import('./world/ExplorerCanvas').then(x=>x.ExplorerCanvas),{
 ssr:false,loading:()=> <div role="status" className="wg-map-loading">🌿 Harita hazırlanıyor…</div>
});

interface WordGardenDistrictMapProps {
 alphabetCompleted:number;alphabetReady:boolean;alphabetError:boolean;onEnterAlphabet:()=>void;
  themeCompleted:number;themesReady:boolean;themesError:boolean;onEnterThemes:()=>void;
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
 alphabetCompleted,alphabetReady,alphabetError,onEnterAlphabet,
 themeCompleted,themesReady,themesError,onEnterThemes,
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
 const [mapExpanded,setMapExpanded]=useState(false);
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
 // Always recommend an accessible destination. The existing lock policy stays intact.
 const featured=all.find(p=>districtStatus(p)==='continue')??
  all.find(p=>districtStatus(p)==='ready')??
  all.find(p=>districtStatus(p)==='complete')??all[0];
 const featuredState=districtStatus(featured);
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
  className="wg-premium-screen wg-modular-screen">
  <div className="wg-sky-orb wg-sky-orb-one" aria-hidden="true"/>
  <div className="wg-sky-orb wg-sky-orb-two" aria-hidden="true"/>
  <div className="wg-shell">
   <header className="wg-hud">
    <button type="button" onClick={onBack} className="wg-back" aria-label="Adalar evrenine dön">
     <span aria-hidden="true">←</span><span className="wg-back-label">Geri</span></button>
    <div className="wg-hud-identity">
     <span className="wg-hud-crest" aria-hidden="true">🌸</span>
     <div><h1 id="wg-world-title" className="wg-hud-heading"><strong>Kelime Bahçesi</strong></h1>
      {playerName&&<small>{playerName}</small>}</div>
    </div>
    <div className="wg-hud-items">
     <IslandGreetingPill island="word_garden"/>
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
     <div><small>{featuredState==='continue'?'KALDIĞIN YERDEN DEVAM ET':featuredState==='complete'?'YENİDEN KEŞFET':'SANA ÖNERİLEN MACERA'}</small>
      <h2>{GARDEN_THEMES[featured.id].name}</h2>
      <p className="wg-featured-subtitle">{GARDEN_THEMES[featured.id].words} · {featured.completed}/{featured.total} görev</p></div>
    </div>
    <div className="wg-strip-progress" role="progressbar" aria-label="Kelime Bahçesi altı ana dünya toplam ilerlemesi"
       aria-valuenow={summary.percent} aria-valuemin={0} aria-valuemax={100}>
     <div className="wg-strip-track"><span style={{width:`${summary.percent}%`}}/></div>
     <strong>%{summary.percent}</strong>
    </div>
    <button type="button" className="wg-hero-primary" onClick={playFeatured} data-return-focus="featured"
      aria-label={`${GARDEN_THEMES[featured.id].name}: ${featuredState==='complete'?'yeniden oyna':featuredState==='continue'?'devam et':'oyna'}`}>
       <span aria-hidden="true">▶</span> {featuredState==='complete'?'Yeniden Oyna':featuredState==='continue'?'Devam Et':'Oyna'}
    </button>
   </section>

   <main>
    <section className="wg-learning-paths" aria-labelledby="wg-learning-paths-title">
     <div className="wg-section-heading wg-learning-paths-heading">
      <div><span className="wg-path-eyebrow">KENDİ YOLUNU SEÇ</span><h2 id="wg-learning-paths-title">🌱 İngilizceyi Keşfet</h2></div>
      <span className="wg-path-count">2 öğrenme yolu</span>
     </div>
     <div className="wg-learning-path-grid">
    <section className="wg-alphabet-entry" aria-label="Harf Korusu başlangıç macerası">
     <div className="wg-alpha-miniart" aria-hidden="true">
      <span className="wg-alpha-tile wg-alpha-a">A<small>a</small></span>
      <span className="wg-alpha-tile wg-alpha-b">B<small>b</small></span>
      <span className="wg-alpha-tile wg-alpha-c">C<small>c</small></span>
      <span className="wg-alpha-leaf">🌱</span>
     </div>
     <div className="wg-alpha-copy">
      <span className="wg-alpha-kicker">✦ BAŞLANGIÇ ÖĞRENME PATİKASI</span>
      <h2>🌿 Harf Korusu <span>Yeni mini macera</span></h2>
      <p>Harfleri dinle, resimlerle kelimeleri keşfet.</p>
      <div className="wg-alpha-meta"><span>🔤 A–Z</span><span>🎧 Ses ve kelime</span><span>✦ {alphabetCompleted}/12 ders</span></div>
     </div>
     <button className="wg-alpha-start" type="button" onClick={onEnterAlphabet} data-return-focus="view:alphabet"
      disabled={!alphabetReady||alphabetError}
      aria-label={'Harf Korusu: '+(alphabetError?'ilerleme yüklenemedi':alphabetReady?'öğrenmeye başla':'yükleniyor')}>
      {alphabetError?'Kayıt okunamadı':!alphabetReady?'Yükleniyor…':alphabetCompleted?'Devam Et →':'Keşfet →'}
     </button>
    </section>
    <section className="wg-theme-entry" aria-label="Tema Kasabası günlük İngilizce üniteleri">
     <div className="wg-theme-art" aria-hidden="true">
      <img src="/assets/word-garden/premium-v2/cover.webp" alt=""/>
      <span className="wg-theme-icon wg-theme-icon-one">🎒</span>
      <span className="wg-theme-icon wg-theme-icon-two">🌦️</span>
      <span className="wg-theme-icon wg-theme-icon-three">🕰️</span>
     </div>
     <div className="wg-theme-content">
      <span className="wg-theme-label">✦ GÜNLÜK HAYATTA İNGİLİZCE</span>
      <h2>🏘️ Tema Kasabası <small>8 öğrenme sokağı</small></h2>
      <p>Okul, kıyafetler, hava durumu ve günlük İngilizce.</p>
      <div className="wg-theme-tags"><span>🎧 Sesli</span><span>🕰️ Saat oyunu</span><span>✦ {themeCompleted}/8 tema</span></div>
     </div>
     <button type="button" className="wg-theme-enter" onClick={onEnterThemes} data-return-focus="view:themes"
      disabled={!themesReady||themesError}
      aria-label={'Tema Kasabası: '+(themesError?'ilerleme okunamadı':themesReady?'oyunlara gir':'yükleniyor')}>
      {themesError?'Kayıt okunamadı':!themesReady?'Yükleniyor…':themeCompleted?'Devam Et →':'Keşfet →'}
     </button>
    </section>
     </div>
    </section>
    {notice&&<div className="wg-notice" role="status"><span aria-hidden="true">🧭</span>{notice}
      <button type="button" onClick={()=>setNotice('')} aria-label="Bildirimi kapat">✕</button></div>}

    <section className="wg-district-section" aria-labelledby="wg-district-title">
     <div className="wg-section-heading">
      <h2 id="wg-district-title"><span aria-hidden="true">🎮</span> Altı büyülü dünya</h2>
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
        disabled={!playable} data-return-focus={'view:'+id}
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
    <section className="wg-map-explore" aria-labelledby="wg-map-explore-title">
     <div className="wg-map-access">
      <span className="wg-map-access-icon" aria-hidden="true">🗺️</span>
      <div className="wg-map-access-copy">
       <h2 id="wg-map-explore-title">Keşif Haritası</h2>
       <p>Altı dünyayı gezebilirsin. İstersen yukarıdan doğrudan oyun da seçebilirsin.</p>
      </div>
      <button type="button" className="wg-map-toggle" aria-expanded={mapExpanded}
       aria-controls="wg-optional-map" onClick={()=>setMapExpanded(v=>!v)}>
       {mapExpanded?'Haritayı Kapat ↑':'Haritayı Keşfet ↓'}
      </button>
     </div>
     <div id="wg-optional-map" hidden={!mapExpanded}>
      {mapExpanded&&(
       <section className="wg-main-map" aria-label="Gezilebilir İngilizce dünyası">
       <div className="wg-map-heading">
       <h2><span aria-hidden="true">🗺️</span> Keşif Haritası</h2>
       <span className="wg-map-counter" aria-label={`${summary.finished} dünya tamamlandı, toplam altı dünya`}>✦ {summary.finished}/6</span>
       </div>
       <div className="wg-map-stage">
       <ExplorerCanvas key="premium-garden" area="garden" objects={objects}
       progress={Math.round(summary.percent/100*12)}
       caption="Altı Dünya · Canlı Patika" height={620} onInteract={enter} onInspect={obj=>enter(obj)}/>
       </div>
       </section>
      )}
     </div>
    </section>
   </main>
  </div>
 </div>;
};
