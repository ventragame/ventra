'use client';

import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {ARCHIPELAGO_ISLANDS_CATALOG} from '@ventra/shared';
import {getProgressRepository} from '@/lib/progress';
import {soundService} from '@/lib/audio/SoundService';
import type {EnglishPlacement} from '@/lib/learning/gradeAwareLearningPolicy';
import type {TeachingSurfaceId} from '@/lib/learning/englishCurriculum';
import {
 JOURNEY_CHAPTERS,loadJourneySnapshot,buildJourneyViewModel,
 type JourneySnapshot,type JourneyCard,type JourneyRecommendation
} from '@/lib/learning/englishCourseJourney';
import './english-journey-dashboard.css';

type Props={
 profileId:string;playerName:string;placement:EnglishPlacement;gradeLevel:number|null;
 onClose:()=>void;onOpenSurface:(surfaceId:TeachingSurfaceId)=>void;
};
const ART:Record<string,string>={
 start:'/assets/kids-islands/word_garden.webp',
 words:'/assets/kids-islands/word_garden.webp',
 express:'/assets/kids-islands/story_castle.webp',
 story:'/assets/kids-islands/listening_forest.webp',
 talk:'/assets/kids-islands/speaking_harbor.webp',
 write:'/assets/kids-islands/sentence_workshop.webp',
 combine:'/assets/kids-islands/language_academy.webp'
};
const statusName=(card:JourneyCard):string=>
 card.status==='error'?'İlerleme okunamadı':
 !card.accessible?'Önceki oyundan sonra açılır':
 card.completed===card.total?'Tekrar oynanabilir':
 card.completed>0?'Devam edilebilir':'Yeni keşif';
const actionName=(card:JourneyCard):string=>
 card.status==='error'?'Kayıt okunamadı':
 !card.accessible?'Şu an kilitli':
 card.completed===card.total?'Tekrar oyna':
 card.completed>0?'Devam et':'Oyna';
const messageFor=(card:JourneyCard):string=>{
 if(card.surfaceId==='garden.colors')return 'Önce Hayvan Çayırı görevlerini tamamla.';
 if(card.surfaceId==='garden.numbers')return 'Önce Renk Korusu görevlerini tamamla.';
 return 'Bu bölüme henüz erişilemiyor.';
};
export function EnglishJourneyDashboard({profileId,playerName,placement,gradeLevel,onClose,onOpenSurface}:Props){
 const [snapshot,setSnapshot]=useState<JourneySnapshot|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [chapterId,setChapterId]=useState<string|null>(null);
 const [showGoals,setShowGoals]=useState(false);
 const refresh=useCallback(async()=>{
  const data=await loadJourneySnapshot(getProgressRepository(),profileId,placement,gradeLevel);
  setSnapshot(data);
 },[profileId,placement,gradeLevel]);
 useEffect(()=>{
  let active=true;
  setLoading(true);setSnapshot(null);setError('');setChapterId(null);
  void loadJourneySnapshot(getProgressRepository(),profileId,placement,gradeLevel)
   .then(data=>{if(active)setSnapshot(data);})
   .catch(()=>{if(active)setError('İngilizce Yolculuğum ilerlemesi okunamadı. Kayıtların korunuyor.');})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[profileId,placement,gradeLevel]);
 useEffect(()=>{
  const handle=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();onClose();}};
  window.addEventListener('keydown',handle);
  return()=>window.removeEventListener('keydown',handle);
 },[onClose]);
 const model=useMemo(()=>snapshot?buildJourneyViewModel(snapshot):null,[snapshot]);
 const chosen=chapterId??model?.cards.find(x=>x.surfaceId===model.primary?.surfaceId)?.chapterId??'start';
 const chapter=JOURNEY_CHAPTERS.find(x=>x.id===chosen)??JOURNEY_CHAPTERS[0];
 const cards=model?.cards.filter(x=>chapter.surfaces.includes(x.surfaceId))??[];
 const current=model?.cards.find(x=>x.surfaceId===model.primary?.surfaceId);
 const review=model?.cards.find(x=>x.surfaceId===model.review?.surfaceId);
 const open=(surfaceId:TeachingSurfaceId)=>{
  const selected=model?.cards.find(x=>x.surfaceId===surfaceId);
  if(!selected||!selected.accessible)return;
  soundService.unlockAudio();soundService.playSfx('tap',0.55);
  onOpenSurface(surfaceId);
 };
 const retry=()=>{
  setLoading(true);setError('');
  void refresh().catch(()=>setError('Kayıt okunamadı. Bağlantını kontrol edip yeniden dene.'))
   .finally(()=>setLoading(false));
 };
 const suggestion=(recommendation:JourneyRecommendation|null,game:JourneyCard|undefined,secondary=false)=>{
  if(!recommendation||!game)return null;
  return <div className={'jy-recommendation'+(secondary?' jy-recommendation-small':'')}>
   <div className="jy-recommendation-art">
    <img src={ARCHIPELAGO_ISLANDS_CATALOG[game.islandId as keyof typeof ARCHIPELAGO_ISLANDS_CATALOG].desktopAsset}
     loading="lazy" alt=""/>
   </div>
   <div className="jy-rec-content">
    <span className="jy-rec-tag">{secondary?'🔁 PEKİŞTİRME ÖNERİSİ':'✦ ŞİMDİ NE ÖĞRENELİM?'}</span>
    <h2>{game.label}</h2>
    <p>{recommendation.reason}</p>
    <div className="jy-rec-meta"><span>{game.chapterTitle}</span>
     <span>{game.completed}/{game.total} oyun görevi</span></div>
   </div>
   <button type="button" className="jy-rec-button" disabled={!game.accessible}
    onClick={()=>open(game.surfaceId)} aria-label={game.label+' oyununa gir'}>
    {game.completed>0?'Devam et':'Başla'} <span aria-hidden="true">→</span>
   </button>
  </div>;
 };
 return <div className="jy-root" role="dialog" aria-modal="true" aria-labelledby="jy-title">
  <div className="jy-shell">
   <header className="jy-header">
    <button type="button" className="jy-back" onClick={onClose} aria-label="Adalar Evrenine dön">← <span>Adalara Dön</span></button>
    <div className="jy-header-brand"><span className="jy-brand-icon" aria-hidden="true">📚</span>
     <div><small>VENTRA · ÖĞRENME REHBERİ</small><h1 id="jy-title">İngilizce Yolculuğum</h1></div>
    </div>
    <span className="jy-header-level">{placement}<span>{gradeLevel?' · '+gradeLevel+'. sınıf':''}</span></span>
   </header>
   <main>
    <section className="jy-hero" aria-labelledby="jy-welcome">
     <div className="jy-hero-content">
      <span className="jy-eyebrow">✨ KENDİ HIZINDA İNGİLİZCE</span>
      <h2 id="jy-welcome">Bugün ne öğrenmek istersin, {playerName||'Kaşif'}?</h2>
      <p>Yolunu birlikte bulalım! Bütün maceralar tek yerde. Bir oyundan diğerine geçerek İngilizceni geliştir.</p>
      <div className="jy-hero-chips"><span>🌱 7 öğrenme durağı</span><span>🏝️ 6 oyun adası</span>
       <span>🎒 Kendi oyun yolun</span></div>
     </div>
     <img className="jy-hero-art" src="/assets/kids-islands/word_garden.webp" alt=""/>
     <div className="jy-hero-glow" aria-hidden="true">✧</div>
    </section>
    {loading&&<section className="jy-loading" role="status">🧭 Oyun yolun hazırlanıyor…</section>}
    {error&&<div className="jy-error" role="alert"><span>{error}</span>
     <button type="button" onClick={retry}>Tekrar dene</button></div>}
    {model&&!loading&&<div className="jy-content">
     <section className="jy-overview" aria-label="Oyun yolculuğundaki kayıtlı etkinlikler">
      <div><span className="jy-overview-emoji" aria-hidden="true">🧭</span>
       <div><strong>{model.savedGames} / {model.totalGames}</strong>
        <small>Kayıtlı tamamlanan oyun görevi (öğrenme seviyesi değil)</small></div></div>
      <div className="jy-overview-track" role="progressbar" aria-valuemin={0} aria-valuemax={100}
       aria-valuenow={model.totalGames?Math.round(100*model.savedGames/model.totalGames):0}
       aria-label="Kayıtları okunabilen oyun görevlerinin tamamlanma oranı">
       <span style={{width:(model.totalGames?100*model.savedGames/model.totalGames:0)+'%'}}/>
      </div>
      <span className="jy-overview-count">{model.totalGames?Math.round(100*model.savedGames/model.totalGames):0}%</span>
     </section>
     {model.failedGames>0&&<div role="alert" className="jy-warning">
      ⚠️ {model.failedGames} oyunun kaydı okunamadı; bunları tamamlanmamış saymıyoruz.
      <button type="button" disabled={loading} onClick={retry}>Yeniden yükle</button>
     </div>}
     {(model.primary||model.review)?<section className="jy-next" aria-label="Öğrenme önerileri">
      {suggestion(model.primary,current)}
      {model.review&&review&&suggestion(model.review,review,true)}
     </section>:<section className="jy-loading" role="status">
      Öneri oluşturmak için oyun kayıtlarının okunması gerekiyor. Yukarıdaki düğmeden tekrar dene.
     </section>}
     <section className="jy-map-section" aria-labelledby="jy-route-title">
      <div className="jy-section-heading">
       <div><span className="jy-eyebrow">HER DURAĞIN BİR MACERASI VAR</span>
        <h2 id="jy-route-title">İngilizce öğrenme haritan</h2></div>
       <p>İstediğin durağı seç. Kilitler yalnız ilgili oyunun mevcut kurallarına bağlı.</p>
      </div>
      <div className="jy-path" aria-label="Yedi öğrenme durağı">
       {model.chapters.map((item,index)=>{
        const active=chapter.id===item.id;
        const count=item.totalGames;
        const pct=count?Math.round(100*item.savedGames/count):0;
        return <button type="button" key={item.id} className={'jy-path-step'+(active?' jy-path-active':'')}
         onClick={()=>setChapterId(item.id)} aria-pressed={active}
         aria-label={(index+1)+'. durak: '+item.title+', '+(count?item.savedGames+'/'+count+' görev':'kayıt yok')}>
         <span className="jy-step-num">{String(index+1).padStart(2,'0')}</span>
         <span className="jy-step-emoji" aria-hidden="true">{item.icon}</span>
         <strong>{item.title}</strong>
         <small>{item.eyebrow}</small>
         <span className="jy-step-meter"><span style={{width:pct+'%'}}/></span>
         <span className="jy-step-status">{item.hasError?'Kısmi veri':count?item.savedGames+'/'+count+' görev':'Kayıt yok'}</span>
        </button>;
       })}
      </div>
     </section>
     <section className="jy-chapter" aria-labelledby="jy-chapter-title">
      <div className="jy-chapter-heading">
       <img src={ART[chapter.id]} alt="" loading="lazy"/>
       <div><span className="jy-eyebrow">{chapter.eyebrow}</span>
        <h2 id="jy-chapter-title">{chapter.icon} {chapter.title}</h2>
        <p>{chapter.description}</p></div>
      </div>
      <div className="jy-games">
       {cards.map(card=><article key={card.surfaceId} className={'jy-game'+(!card.accessible?' jy-game-locked':'')}>
        <div className="jy-game-top">
         <span className="jy-game-icon" aria-hidden="true">{ARCHIPELAGO_ISLANDS_CATALOG[card.islandId as keyof typeof ARCHIPELAGO_ISLANDS_CATALOG].emoji}</span>
         <div><h3>{card.label}</h3><small>{ARCHIPELAGO_ISLANDS_CATALOG[card.islandId as keyof typeof ARCHIPELAGO_ISLANDS_CATALOG].nameTr}</small></div>
         <span className="jy-game-state">{card.status==='error'?'!':!card.accessible?'🔒':card.completed===card.total?'↻':'▶'}</span>
        </div>
        <p className="jy-game-description">{card.outcomes[0]?.descriptionTr??'Bu oyunla İngilizceni pratik et.'}</p>
        <div className="jy-game-progress" role="progressbar" aria-label={card.label+' kayıtlı görev tamamlama oranı'}
         aria-valuemin={0} aria-valuemax={100}
         aria-valuenow={card.total&&card.status==='ready'?Math.round(100*card.completed/card.total):0}>
         <span style={{width:card.total&&card.status==='ready'?(100*card.completed/card.total)+'%':'0%'}}/>
        </div>
        <div className="jy-game-meta"><span>{statusName(card)}</span>
         <strong>{card.status==='error'?'—':card.completed+'/'+card.total+' görev'}</strong></div>
        {!card.accessible&&card.status!=='error'&&<p className="jy-game-lock">{messageFor(card)}</p>}
        <button type="button" disabled={!card.accessible} onClick={()=>open(card.surfaceId)}
         className="jy-game-action" aria-label={card.label+': '+actionName(card)}>
         {actionName(card)} <span aria-hidden="true">→</span>
        </button>
       </article>)}
      </div>
     </section>
     <section className="jy-info" aria-label="Öğrenme rehberi açıklaması">
      <button className="jy-info-toggle" type="button" aria-expanded={showGoals} aria-controls="jy-goals"
       onClick={()=>setShowGoals(v=>!v)}>
       <span>💡 Bu yol bana nasıl yardımcı oluyor?</span><span aria-hidden="true">{showGoals?'−':'+'}</span>
      </button>
      {showGoals&&<div id="jy-goals" className="jy-info-body">
       <p>Önceki oyunlarından kaydedilmiş görevleri kontrol edip sana erişebileceğin bir sonraki macerayı öneriyoruz. Tekrar oynamak faydalı olabilir ama hiçbir oyunu sırf önerildi diye bitirmek zorunda değilsin.</p>
       <p>Görev tamamlamak ile İngilizceyi kalıcı öğrenmek farklı şeylerdir. Haritada gösterilen sayılar oyun kayıtlarıdır; İngilizce seviyeni otomatik değiştirmeyiz.</p>
       <p>Senin seçtiğin düzey {placement}; sınıfın da oyunların sunuluşunu etkiler, ama tek başına İngilizce bilginin ölçümü değildir.</p>
      </div>}
     </section>
    </div>}
   </main>
   <footer className="jy-footer">✦ Ventra Kids · Bir sonraki adımın hazır. Yolculuk her zaman senin.</footer>
  </div>
 </div>;
}
