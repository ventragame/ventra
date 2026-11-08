
'use client';
import React,{useCallback,useEffect,useState} from 'react';
import type {ForestPlacement} from '@/lib/learning/storyForestEngine';
import {SEQUENCE_STORIES} from '@/lib/learning/storySequenceEngine';
import {StoryForestAdventure} from './StoryForestAdventure';
import {StorySequenceAdventure} from './StorySequenceAdventure';
import {StoryForestScenery,StoryForestActor} from './StoryForestArt';
import {StorySequenceFrame} from './StorySequenceFrame';
import {getProgressRepository} from '@/lib/progress';
import {getStoryForestProgress,type ForestProgress} from '@/lib/progress/storyForestProgress';
import {getSequenceProgress,type SequenceProgress} from '@/lib/progress/storySequenceProgress';
import {soundService} from '@/lib/audio/SoundService';
import './story-sequence.css';
import './story-forest-home.css';

type Game='home'|'discover'|'sequence';
interface Props{
 profileId:string;
 gradeLevel:number|null;
 englishLevel:ForestPlacement;
 onBack:()=>void;
 onSaved:()=>void;
}
const EMPTY:ForestProgress={completedLevels:0,totalLevels:6,starsByLevel:{}};
export function StoryForestHome({profileId,gradeLevel,englishLevel,onBack,onSaved}:Props){
 const [game,setGame]=useState<Game>('home');
 const [discover,setDiscover]=useState<ForestProgress>(EMPTY);
 const [sequence,setSequence]=useState<SequenceProgress>(EMPTY);
 const [loadError,setLoadError]=useState('');
 const refresh=useCallback(async()=>{
  const [d,s]=await Promise.all([
   getStoryForestProgress(getProgressRepository(),profileId),
   getSequenceProgress(getProgressRepository(),profileId)
  ]);
  setDiscover(d);setSequence(s);setLoadError('');
 },[profileId]);
 useEffect(()=>{
  let active=true;
  Promise.all([
   getStoryForestProgress(getProgressRepository(),profileId),
   getSequenceProgress(getProgressRepository(),profileId)
  ]).then(([d,s])=>{if(active){setDiscover(d);setSequence(s);}})
  .catch(error=>{console.error('[StoryForestHome] progress',error);
   if(active)setLoadError('İlerleme okunamadı.');});
  return()=>{active=false;};
 },[profileId]);
 const back=()=>{soundService.cancelSpeech();setGame('home');void refresh().catch(()=>setLoadError('İlerleme okunamadı.'));};
 const saved=()=>{void refresh().catch(()=>setLoadError('İlerleme okunamadı.'));onSaved();};
 if(game==='discover')return <StoryForestAdventure profileId={profileId} gradeLevel={gradeLevel}
   englishLevel={englishLevel} onBack={back} onSaved={saved}/>;
 if(game==='sequence')return <StorySequenceAdventure profileId={profileId} gradeLevel={gradeLevel}
   englishLevel={englishLevel} onBack={back} onSaved={saved}/>;
 return <div className="ss-root sfh-root" role="dialog" aria-modal="true" aria-label="Hikâye Ormanı oyunları">
   <header className="ss-head">
    <div className="ss-head-side">
     <button type="button" className="ss-round" onClick={onBack} aria-label="Adalar Evreni'ne dön">←</button>
     <h1>Hikâye Ormanı</h1>
    </div>
    <span className="ss-count">★ {discover.completedLevels+sequence.completedLevels}/12</span>
   </header>
   <main className="ss-main sfh-main">
    <div className="sfh-hero">
     <img src="/assets/kids-islands/listening_forest.webp" alt="" className="sfh-hero-art"/>
     <div className="sfh-hero-text">
      <span>VENTRA · İNGİLİZCE HİKÂYELER</span>
      <h2>Masal Başlıyor!</h2>
      <p>Dinle · Keşfet · Hatırla</p>
     </div>
    </div>
    <div className="sfh-games" aria-label="Hikâye Ormanı oynanabilir oyunları">
     <button type="button" className="sfh-card" onClick={()=>{soundService.unlockAudio();setGame('discover');}}>
      <div className="sfh-card-art sfh-card-art-discover">
       <StoryForestScenery scene="meadow"/>
       <div className="sfh-character sfh-bunny"><StoryForestActor id="rabbit"/></div>
       <div className="sfh-character sfh-fox"><StoryForestActor id="fox"/></div>
       <div className="sfh-card-bubble">🔊</div>
      </div>
      <div className="sfh-card-footer">
       <span className="sfh-number">01</span>
       <div><strong>Hikâyeyi Keşfet</strong><small>Dinle, doğru resmi bul</small></div>
       <span className="sfh-bonus">✦ {discover.completedLevels}/6</span>
      </div>
      <span className="sfh-card-go">Oyuna Gir <span aria-hidden="true">→</span></span>
     </button>
     <button type="button" className="sfh-card" onClick={()=>{soundService.unlockAudio();setGame('sequence');}}>
      <div className="sfh-card-art">
       <StorySequenceFrame frame={SEQUENCE_STORIES[0].frames[4]} scene="path"/>
       <span className="sfh-order-badge" aria-hidden="true">❶ ❷ ❸</span>
      </div>
      <div className="sfh-card-footer">
       <span className="sfh-number">02</span>
       <div><strong>Sonra Ne Oldu?</strong><small>Resimlerle hikâye sırala</small></div>
       <span className="sfh-bonus">✦ {sequence.completedLevels}/6</span>
      </div>
      <span className="sfh-card-go">Oyuna Gir <span aria-hidden="true">→</span></span>
     </button>
    </div>
    {loadError&&<p className="ss-status" role="alert">{loadError}</p>}
    <p className="sfh-next" aria-label="Gelecek oyunlar hazırlanıyor">
     ✨ Yeni maceralar hazırlanıyor
    </p>
   </main>
 </div>;
}
