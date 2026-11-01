'use client';
import React,{useMemo,useState} from 'react';
import dynamic from 'next/dynamic';
import {getDistrictObjects} from './world/worldLayout';
import type {WorldObject} from './world/worldLayout';
import {DistrictPreviewArt} from './DistrictPreviewArt';
import {GARDEN_ORDER,GARDEN_THEMES,decorateWorldObjects,districtPercent,districtStatus,
 districtStatusLabel,mapProgress,type GardenDistrictId,type GardenDistrictProgress} from './world/gardenTheme';
import './word-garden-premium.css';

const ExplorerCanvas=dynamic(()=>import('./world/ExplorerCanvas').then(x=>x.ExplorerCanvas),{
 ssr:false,loading:()=> <div role="status" className="wg-map-loading">Haritanın büyülü dünyası hazırlanıyor…</div>
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
 gradeLevel?:number|null;onBack:()=>void;
}
export const WordGardenDistrictMap:React.FC<WordGardenDistrictMapProps>=({
 completedLevels,totalLevels,onEnterAnimals,onEnterColors,
 colorsUnlocked,colorsAvailable,colorCompleted,numberCompleted,numberTotal,numbersUnlocked,numbersAvailable,onEnterNumbers,
 foodCompleted,foodTotal,foodUnlocked,foodAvailable,foodError,onEnterFood,
 familyCompleted,familyTotal,familyUnlocked,familyAvailable,familyError,onEnterFamily,
 templeCompleted,templeTotal,templeUnlocked,templeAvailable,templeError,onEnterTemple,
 starsByDistrict={},coinBalance=null,playerName,onOpenPassport,gradeLevel=null,onBack
})=>{
 const [notice,setNotice]=useState('');
 const [selected,setSelected]=useState<GardenDistrictId|null>(null);
 const [mapTips,setMapTips]=useState(false);
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
 const pageTitle='Kelime Bahçesi';
 const detail=all.find(p=>p.id===focus)!;
 const enter=(obj:WorldObject)=>{
  const p=all.find(x=>x.id===obj.id);
  if(!p)return;
  const state=districtStatus(p);
  if(state==='error'){
   setNotice(`${GARDEN_THEMES[p.id].name} ilerlemesi yüklenemedi. Kayıtların silinmedi; bölgeden çıkıp yeniden deneyebilirsin.`);
   return;
  }
  if(state==='loading'){setNotice(`${GARDEN_THEMES[p.id].name} ilerlemesi yükleniyor. Tekrar dene.`);return;}
  if(state==='locked'){setNotice(`${GARDEN_THEMES[p.id].name} için önceki İngilizce görevlerini bitirmelisin.`);return;}
  setNotice('');
  const actions:Record<GardenDistrictId,()=>void>={
   animals:onEnterAnimals,colors:onEnterColors,numbers:onEnterNumbers,food:onEnterFood,
   family:onEnterFamily,sanctuary:onEnterTemple
  };
  actions[p.id]();
 };
 const selectedObject=objects.find(o=>o.id===focus);
 return <div role="dialog" aria-modal="true" aria-labelledby="wg-world-title"
  onPointerDown={e=>e.stopPropagation()} onPointerMove={e=>e.stopPropagation()}
  onPointerUp={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()}
  className="wg-premium-screen">
  <div className="wg-sky-orb wg-sky-orb-one" aria-hidden="true"/><div className="wg-sky-orb wg-sky-orb-two" aria-hidden="true"/>
  <div className="wg-shell">
   <header className="wg-hud">
    <button type="button" onClick={onBack} className="wg-back" aria-label="Adalar evrenine dön">
     <span aria-hidden="true">←</span><span>Adalara Dön</span></button>
    <div className="wg-hud-identity">
     <span className="wg-hud-crest" aria-hidden="true">✦</span>
     <div><small>VENTRA KIDS · ENGLISH WORLDS</small>
      <strong>{playerName?playerName+'’ın Macerası':'Maceranın Haritası'}</strong></div>
    </div>
    <div className="wg-hud-items">
     {gradeLevel!=null&&gradeLevel>=1&&gradeLevel<=8&&
      <span className="wg-hud-chip"><span aria-hidden="true">🎓</span> {gradeLevel}. Sınıf</span>}
     <span className="wg-hud-chip wg-star-chip" title="Bu dünyanın altı bölgesinde kazanılan toplam yıldız">
       <span aria-hidden="true">★</span> {summary.stars}</span>
     {onOpenPassport&&<button type="button" onClick={onOpenPassport}
        className="wg-hud-chip wg-passport" aria-label="Maceracı Pasaportu, günlük görevler ve koleksiyonu aç">
        <span aria-hidden="true">🪙</span> {coinBalance??'—'} <span className="wg-passport-label">Pasaport ↗</span>
       </button>}
    </div>
   </header>

   <section className="wg-hero" aria-label="Kelime Bahçesi yolculuğu">
    <div className="wg-hero-left">
     <div className="wg-eyebrow"><span className="wg-eyebrow-star">✧</span> SIX WORLDS. ONE ENGLISH ADVENTURE.</div>
     <h1 id="wg-world-title"><span className="wg-flower" aria-hidden="true">✿</span> Kelime Bahçesi</h1>
     <p>Her yeni kelime bir kapı açar. Büyülü dünyaları keşfet, İngilizce öğren ve kendi maceranı tamamla.</p>
     <div className="wg-hero-actions">
      <button type="button" className="wg-hero-primary"
       onClick={()=>{const obj=objects.find(o=>o.id===featured.id);if(obj)enter(obj);}}>
       <span aria-hidden="true">✦</span> {featured.completed>0?'Maceraya Devam Et':'Maceraya Başla'}
       <span aria-hidden="true">↗</span></button>
      <button type="button" className="wg-hero-secondary" onClick={()=>setMapTips(x=>!x)}
       aria-expanded={mapTips} aria-controls="wg-tips">
       <span aria-hidden="true">🧭</span> Nasıl Gezilir?</button>
     </div>
    </div>
    <div className="wg-progress-orb" role="group" aria-label="Altı dünyanın toplam ilerlemesi">
     <div className="wg-progress-circle" style={{'--wg-fill':`${summary.percent}%`} as React.CSSProperties}>
      <div className="wg-progress-center"><strong>%{summary.percent}</strong><small>KEŞFEDİLDİ</small></div>
     </div>
     <span>{summary.done}/{summary.total} görev · {summary.finished}/6 dünya</span>
    </div>
   </section>
   {mapTips&&<div id="wg-tips" className="wg-tip-panel" role="region" aria-label="Harita kontrolleri">
     <strong>Haritayı keşfet:</strong> Bölge girişine dokun; karakter oraya yürüyerek oyunu açar.
     Masaüstünde WASD/ok tuşları, mobilde sağ alttaki yön tuşları çalışır.
     Alt dünya kartlarından ilgili oyunu doğrudan açabilirsin.
   </div>}

   <section className="wg-main-map" aria-label="Gezilebilir İngilizce dünyası">
    <div className="wg-map-heading">
      <div><span className="wg-small-label">✦ INTERACTIVE WORLD MAP</span><h2>Altı Dünya, Sınırsız Keşif</h2></div>
      <span className="wg-map-counter"><span aria-hidden="true">🌿</span> {summary.finished}/6 dünya tamamlandı</span>
    </div>
    <ExplorerCanvas key="premium-garden" area="garden" objects={objects} progress={Math.round(summary.percent/100*12)}
      caption="Büyülü Keşif Haritası" height={640} onInteract={enter}
      onInspect={obj=>enter(obj)} />
    <div className="wg-map-footer">
      <span><span aria-hidden="true">✧</span> Simgelere dokunarak veya yürüyerek keşfet.</span>
      <span>Oyunları alt kartlardan da açabilirsin. <span aria-hidden="true">✦</span></span>
    </div>
   </section>
   {notice&&<div className="wg-notice" role="status">{notice}
     <button type="button" onClick={()=>setNotice('')}>Kapat ×</button></div>}

   <section className="wg-district-section" aria-labelledby="wg-district-title">
    <div className="wg-section-heading"><div><span className="wg-small-label">EXPLORE YOUR WORLDS</span>
      <h2 id="wg-district-title">Macera Durakları <span>✦</span></h2>
      <p>Her durakta farklı İngilizce kelimeler, sesler ve mini maceralar seni bekliyor.</p></div>
     <span className="wg-count-pill">6 / 6 DÜNYA</span>
    </div>
    <div className="wg-world-grid">
     {GARDEN_ORDER.map((id,index)=>{
      const p=all[index],theme=GARDEN_THEMES[id],state=districtStatus(p);
      const playable=state==='ready'||state==='continue'||state==='complete';
      const pct=districtPercent(p.completed,p.total);
      return <button type="button" key={id} onClick={()=>{setSelected(id);const o=objects[index];if(o)enter(o)}}
       onMouseEnter={()=>setSelected(id)} onFocus={()=>setSelected(id)}
       disabled={!playable}
       aria-label={`${theme.name}, ${p.completed}/${p.total} görev, ${districtStatusLabel(state)}`}
       className={`wg-world-card wg-card-${id} ${focus===id?'wg-card-featured':''} ${!playable?'wg-card-disabled':''}`}
       style={{'--wg-accent':theme.accent,'--wg-light':theme.light} as React.CSSProperties}>
       <div className="wg-card-top"><DistrictPreviewArt id={id}/>
        <span className="wg-card-index">{String(index+1).padStart(2,'0')}</span>
        <span className={`wg-card-status wg-status-${state}`}>
          {state==='complete'?'✓ ':state==='locked'?'🔒 ':''}{districtStatusLabel(state)}</span>
        <span className="wg-card-art-icon" aria-hidden="true">{theme.icon}</span>
       </div>
       <div className="wg-card-body">
        <small className="wg-card-eyebrow">{theme.eyebrow}</small>
        <h3>{theme.name}</h3>
        <p className="wg-card-subtitle">{theme.subtitle}</p>
        <p className="wg-card-words">{theme.words}</p>
        <div className="wg-card-progress-text"><span>GÖREV İLERLEMESİ</span><strong>{p.completed}/{p.total}</strong></div>
        <div className="wg-card-progress"><span style={{width:`${pct}%`}}/></div>
        <div className="wg-card-foot"><span className="wg-card-stars">★ {p.stars} yıldız</span>
         <span className="wg-card-action">{state==='complete'?'Tekrar Oyna ↗':state==='continue'?'Devam Et ↗':state==='ready'?'Keşfet ↗':districtStatusLabel(state)}</span>
        </div>
       </div>
      </button>;
     })}
    </div>
   </section>
   <footer className="wg-bottom-note">
    <span aria-hidden="true">✿</span> Her dünyada farklı bir İngilizce macera. Öğrendikçe dünya seninle büyür.
    {onOpenPassport&&<button type="button" onClick={onOpenPassport}>Günlük Görevler · Koleksiyon · Pasaport ↗</button>}
   </footer>
  </div>
 </div>;
};
