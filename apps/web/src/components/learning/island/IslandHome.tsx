'use client';
import React,{useEffect,useMemo,useRef} from 'react';
import {soundService} from '@/lib/audio/SoundService';
import {
 ISLAND_HERO_ACTION,ISLAND_HERO_KICKER,
 islandChapterLabel,islandChapterState,islandHeroPlan,turkishPlural,type IslandHomeId
} from '@/lib/learning/islandHomeModel';
import {useIslandGreeting} from './IslandGreeting';
import './island-palette.css';
import './island-home.css';

export interface IslandHomeChapter{
 id:number;
 title:string;
 subtitle:string;
 icon:string;
 /** A painted image path, or a composed scene (Story Forest's live cast). */
 art:string|React.ReactNode;
 artMobile?:string;
 done:boolean;
 unlocked:boolean;
 resumable?:boolean;
 /** Best stars (0-3) when the island records them. */
 stars?:number;
 /** Extra fact shown on the card, e.g. "3 görev". */
 meta?:string;
}

interface Props{
 island:IslandHomeId;
 ariaLabel:string;
 eyebrow:string;
 title:string;
 crest:string;
 onBack:()=>void;
 chips?:readonly string[];
 heroArt:string;
 heroArtMobile?:string;
 tagline:string;
 /** A painted guide character standing in the hero. */
 guide?:{src:string;alt?:string};
 chapters:readonly IslandHomeChapter[];
 /** Default "Bölüm"; e.g. "Görev", "Durak", "Oyun". */
 chapterNoun?:string;
 sectionTitle?:string;
 /** Overrides the hero bar when an island counts smaller steps (Story: 18 stories). */
 progress?:{done:number;total:number;noun:string};
 onOpen:(id:number)=>void;
 status:'loading'|'ready'|'error';
 errorText?:string;
 onRetry?:()=>void;
 busy?:boolean;
 /** Rendered between the hero and the chapters. */
 beforeChapters?:React.ReactNode;
 /** Rendered after the chapters (notes, recommendations, future regions). */
 children?:React.ReactNode;
 /** Dialogs owned by the island (parental gate, adult settings). */
 overlays?:React.ReactNode;
 onPointerDown?:React.PointerEventHandler<HTMLDivElement>;
}

const pad=(n:number)=>String(n).padStart(2,'0');
/** Decorative ambient motes; positions are fixed so renders never reshuffle. */
const MOTES=[[6,18,0,1],[14,62,3.2,.8],[23,35,1.4,1.1],[31,78,5.1,.7],[42,12,2.3,.9],[51,55,6.4,1.2],
 [60,28,.8,.8],[68,70,4.2,1],[77,40,2.9,.7],[85,15,5.8,1.1],[92,58,1.9,.9],[97,32,3.7,.8]] as const;

function Art({src,mobile,className}:{src:string;mobile?:string;className:string}){
 return <picture className={className}>
  {mobile&&<source media="(max-width: 640px)" srcSet={mobile}/>}
  <img src={src} alt="" decoding="async" draggable={false}/>
 </picture>;
}

function Stars({value}:{value:number}){
 const n=Math.max(0,Math.min(3,Math.round(value)));
 return <span className="ih-stars" aria-hidden="true">{'★'.repeat(n)}<i>{'★'.repeat(3-n)}</i></span>;
}

export function IslandHome(props:Props){
 const {island,chapters,onOpen,status,busy=false,chapterNoun='Bölüm'}=props;
 const plan=useMemo(()=>islandHeroPlan(chapters),[chapters]);
 const next=chapters.find(x=>x.id===plan.chapterId)??chapters[0];
 const {greeting,speaking,greet}=useIslandGreeting(island);
 const ready=status==='ready';
 const hero=useRef<HTMLElement|null>(null);
 const heading=useRef<HTMLHeadingElement|null>(null);
 const frame=useRef(0);

 useEffect(()=>{
  // Focus is only moved when the island entry button disappeared with it.
  const active=document.activeElement;
  if(!active||active===document.body)heading.current?.focus({preventScroll:true});
  return()=>cancelAnimationFrame(frame.current);
 },[]);

 // Mouse-only depth: the painted scene drifts against the guide. Touch and
 // reduced-motion users get a still image.
 const onHeroMove=(event:React.PointerEvent<HTMLElement>)=>{
  if(event.pointerType!=='mouse'||!hero.current)return;
  const box=hero.current.getBoundingClientRect();
  const x=(event.clientX-box.left)/box.width-.5,y=(event.clientY-box.top)/box.height-.5;
  cancelAnimationFrame(frame.current);
  frame.current=requestAnimationFrame(()=>{
   hero.current?.style.setProperty('--ih-px',x.toFixed(3));
   hero.current?.style.setProperty('--ih-py',y.toFixed(3));
  });
 };
 const onHeroLeave=()=>{
  cancelAnimationFrame(frame.current);
  hero.current?.style.setProperty('--ih-px','0');hero.current?.style.setProperty('--ih-py','0');
 };

 const progress=props.progress??{done:plan.done,total:plan.total,noun:chapterNoun.toLocaleLowerCase('tr')};
 const percent=progress.total>0?Math.round(Math.min(1,progress.done/progress.total)*100):0;
 const action=ISLAND_HERO_ACTION[plan.mode];
 const nextLine=plan.mode==='complete'?props.tagline:
  chapterNoun.toLocaleUpperCase('tr')+' '+pad(next?.id??1)+' · '+(next?.subtitle??'');

 return <div className="ih-root" data-island={island} role="dialog" aria-modal="true"
  aria-label={props.ariaLabel} onPointerDown={props.onPointerDown}>
  <div className="ih-backdrop" aria-hidden="true">
   {MOTES.map(([x,y,delay,scale],i)=><span key={i} className="ih-mote"
    style={{'--x':x+'%','--y':y+'%','--d':delay+'s','--s':scale} as React.CSSProperties}/>)}
  </div>
  <header className="ih-topbar">
   <button type="button" className="ih-back" onClick={props.onBack} aria-label="Adalar Evreni’ne dön">
    <span aria-hidden="true">←</span><span className="ih-back-label">Adalar</span>
   </button>
   <div className="ih-identity">
    <span className="ih-crest" aria-hidden="true">{props.crest}</span>
    <div><small>{props.eyebrow}</small><h1 ref={heading} tabIndex={-1}>{props.title}</h1></div>
   </div>
   {props.chips&&props.chips.length>0&&<div className="ih-chips">
    {props.chips.map(chip=><span key={chip} className="ih-chip">{chip}</span>)}
   </div>}
  </header>

  <main className="ih-main">
   <section ref={hero} className="ih-hero" aria-label={ISLAND_HERO_KICKER[plan.mode]}
    data-has-guide={Boolean(props.guide)} onPointerMove={onHeroMove} onPointerLeave={onHeroLeave}>
    <div className="ih-hero-art" aria-hidden="true">
     <Art src={props.heroArt} mobile={props.heroArtMobile} className="ih-hero-picture"/>
    </div>
    <div className="ih-hero-scrim" aria-hidden="true"/>
    {props.guide&&<div className="ih-guide" data-speaking={speaking}>
     <img src={props.guide.src} alt={props.guide.alt??''} draggable={false} decoding="async"/>
    </div>}
    <div className="ih-bubble" data-speaking={speaking}>
     <button type="button" className="ih-bubble-play" onClick={()=>{soundService.unlockAudio();greet();}}
      aria-label={'Karşılamayı İngilizce dinle: '+greeting.en}>
      <span aria-hidden="true">🔊</span>
     </button>
     <span className="ih-bubble-text"><strong lang="en">{greeting.en}</strong><small>{greeting.tr}</small></span>
    </div>
    <div className="ih-hero-copy">
     <span className="ih-kicker">{status==='loading'?'İLERLEMEN YÜKLENİYOR':status==='error'?'İLERLEME OKUNAMADI':ISLAND_HERO_KICKER[plan.mode]}</span>
     <h2>{plan.mode==='complete'?props.title+' tamamlandı!':next?.title}</h2>
     <p>{nextLine}</p>
     <div className="ih-progress">
      <div className="ih-progress-track" role="progressbar" aria-label={props.title+' ilerlemesi'}
       aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={ready?progress.done:0}
       aria-valuetext={ready?progress.done+' / '+progress.total+' '+progress.noun:'Yükleniyor'}>
       <span style={{width:(ready?percent:0)+'%'}}/>
      </div>
      <strong>{ready?progress.done+'/'+progress.total:'…'}</strong>
     </div>
     <button type="button" className="ih-cta" disabled={!ready||busy||!next}
      onClick={()=>{soundService.unlockAudio();onOpen(plan.chapterId);}}
      aria-label={(next?.title??props.title)+': '+action}>
      <span aria-hidden="true">{plan.mode==='complete'?'↻':'▶'}</span>{action}
     </button>
    </div>
   </section>

   {status==='error'&&<div className="ih-alert" role="alert">
    <span>{props.errorText??'İlerleme okunamadı.'}</span>
    {props.onRetry&&<button type="button" onClick={props.onRetry}>↻ Tekrar dene</button>}
   </div>}

   {props.beforeChapters}

   <section className="ih-chapters" aria-labelledby={'ih-chapters-'+island}>
    <div className="ih-section-head">
     <div><small>{turkishPlural(chapterNoun).toLocaleUpperCase('tr')}</small>
      <h2 id={'ih-chapters-'+island}>{props.sectionTitle??'Maceranı seç'}</h2></div>
     <span className="ih-count">✦ {ready?plan.done:'…'}/{plan.total} tamamlandı</span>
    </div>
    <div className="ih-grid" data-count={chapters.length}>
     {chapters.map((chapter,index)=>{
      const state=ready?islandChapterState(chapter,plan):'locked';
      const label=ready?islandChapterLabel(state,chapter.resumable):'Yükleniyor';
      return <button key={chapter.id} type="button" className="ih-card" data-state={state}
       style={{'--i':index} as React.CSSProperties}
       disabled={!ready||busy||!chapter.unlocked} onClick={()=>{soundService.unlockAudio();onOpen(chapter.id);}}
       aria-label={chapter.title+'. '+label+(chapter.done&&chapter.stars?', '+chapter.stars+' yıldız':'')}>
       <span className="ih-card-art" aria-hidden="true">
        {typeof chapter.art==='string'?
         <Art src={chapter.art} mobile={chapter.artMobile} className="ih-card-picture"/>:
         <span className="ih-card-scene">{chapter.art}</span>}
        <span className="ih-card-icon">{chapter.icon}</span>
        {state==='current'&&<span className="ih-card-ribbon">SIRADAKİ</span>}
        <span className="ih-card-badge">{state==='done'?'✓':state==='locked'?'🔒':state==='current'?'▶':'✦'}</span>
       </span>
       <span className="ih-card-body">
        <span className="ih-card-number">{chapterNoun.toLocaleUpperCase('tr')} {pad(chapter.id)}</span>
        <strong>{chapter.title}</strong>
        <small>{chapter.subtitle}{chapter.meta?' · '+chapter.meta:''}</small>
        <span className="ih-card-state">
         <span>{state==='done'?'↻ ':state==='locked'?'🔒 ':state==='current'?'▶ ':''}{label}</span>
         {chapter.done&&chapter.stars!==undefined&&<Stars value={chapter.stars}/>}
        </span>
       </span>
      </button>;
     })}
    </div>
   </section>
   {props.children}
  </main>
  {props.overlays}
 </div>;
}
