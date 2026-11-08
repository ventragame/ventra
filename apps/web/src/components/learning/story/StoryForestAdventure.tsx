'use client';

import React,{useEffect,useRef,useState} from 'react';
import type {ForestActorId,ForestEpisode,ForestPlacement,ForestScene} from '@/lib/learning/storyForestEngine';
import {FOREST_EPISODES} from '@/lib/learning/storyForestEngine';
import {
 JOURNEY_ROUTES,planJourneyStory,narrativeFor,journeyStars,
 type JourneyObject,type JourneyPlan,type JourneyPhase,type JourneyRecord
} from '@/lib/learning/storyForestJourneyEngine';
import {getProgressRepository} from '@/lib/progress';
import {getStoryForestProgress,saveForestJourney,type ForestProgress} from '@/lib/progress/storyForestProgress';
import {soundService} from '@/lib/audio/SoundService';
import {StoryForestActor,StoryForestScenery} from './StoryForestArt';
import './story-forest-journey.css';

type Screen='chapters'|'playing'|'reward';
type Props={profileId:string;gradeLevel:number|null;englishLevel:ForestPlacement;onBack:()=>void;onSaved:()=>void};
const INITIAL:ForestProgress={completedLevels:0,totalLevels:6,starsByLevel:{}};
function JourneyObjectArt({object}:{object:JourneyObject}){
 if(object==='apple')return <StoryForestActor id="red_apple"/>;
 if(object==='bird')return <StoryForestActor id="bird"/>;
 if(object==='key')return <svg viewBox="0 0 256 256" className="sj-object-svg" aria-hidden="true">
  <defs><linearGradient id="sj-gold" x1="0" y1="0" x2="1" y2="1">
   <stop stopColor="#fff6ac"/><stop offset=".55" stopColor="#f5be58"/><stop offset="1" stopColor="#ce8750"/>
  </linearGradient></defs>
  <g transform="rotate(-28 128 128)" fill="url(#sj-gold)" stroke="#d09749" strokeWidth="10">
   <circle cx="130" cy="66" r="44"/><circle cx="130" cy="66" r="20" fill="#f1f9f0" stroke="#e9a752" strokeWidth="6"/>
   <path d="M115 110H145V206H166V228H144V210H113V228H91V199H115Z" strokeLinejoin="round"/>
  </g><path d="M55 52l9 -20 7 20 20 7 -20 8 -7 19 -9 -19 -19 -8Z" fill="#fff9d4"/>
 </svg>;
 return <svg viewBox="0 0 256 256" className="sj-object-svg" aria-hidden="true">
  <defs><linearGradient id="sj-crystal" x1=".3" y1="0" x2=".8" y2="1">
   <stop stopColor="#d9faff"/><stop offset=".52" stopColor="#8ec5ff"/>
   <stop offset="1" stopColor="#aa8dec"/>
  </linearGradient></defs>
  <path d="M127 13L206 71L231 155L128 244L25 155L50 71Z"
   fill="url(#sj-crystal)" stroke="#6ca7dc" strokeWidth="11"/>
  <path d="M127 13L127 244M50 71L128 107L206 71M25 155L127 107L231 155"
   stroke="#eaffff" strokeWidth="7" fill="none" opacity=".7"/>
  <circle cx="127" cy="133" r="29" fill="#e7fcff" opacity=".52"/>
 </svg>;
}
function Actor({id}:{id:ForestActorId}){return <StoryForestActor id={id}/>;}
function StoryScene({plan,phase,location}:{
 plan:JourneyPlan;phase:JourneyPhase;location?:ForestScene|null;
}){
 const {route}=plan;
 const scene=(phase==='result'||phase==='friend'||phase==='ending')&&location?location:route.scene;
 const showHero=phase!=='discover';
 const showFriend=['meet','choose','result','ending'].includes(phase);
 const showObject=['opening','result','ending'].includes(phase);
 return <div className={'sj-story-image sj-phase-'+phase} aria-hidden="true">
  <StoryForestScenery scene={scene}/>
  <div className="sj-scene-haze"/>
  <div className="sj-scene-shimmer">✦ <span>✧</span> ✦</div>
  {showHero&&<div className="sj-hero"><Actor id={route.hero}/></div>}
  {showFriend&&<div className="sj-friend"><Actor id={route.helper}/></div>}
  {showObject&&<div className="sj-held-item"><JourneyObjectArt object={route.object}/></div>}
  {phase==='ending'&&<div className="sj-celebrate" aria-hidden="true">✦ ✦ ✦</div>}
 </div>;
}
export function StoryForestAdventure({profileId,gradeLevel,englishLevel,onBack,onSaved}:Props){
 const [screen,setScreen]=useState<Screen>('chapters');
 const [loading,setLoading]=useState(true);
 const [loadError,setLoadError]=useState('');
 const [saveError,setSaveError]=useState('');
 const [progress,setProgress]=useState<ForestProgress>(INITIAL);
 const [history,setHistory]=useState<JourneyRecord[]>([]);
 const [plan,setPlan]=useState<JourneyPlan|null>(null);
 const [phase,setPhase]=useState<JourneyPhase>('opening');
 const [episode,setEpisode]=useState<ForestEpisode>(1);
 const [destination,setDestination]=useState<ForestScene|null>(null);
 const [mistakes,setMistakes]=useState(0);
 const [usedHint,setUsedHint]=useState(false);
 const [firstResult,setFirstResult]=useState<{mistakes:number;hint:boolean}>({mistakes:0,hint:false});
 const [caption,setCaption]=useState(false);
 const [voiceUnavailable,setVoiceUnavailable]=useState(false);
 const [highlight,setHighlight]=useState(false);
 const [wrong,setWrong]=useState<string|null>(null);
 const [correct,setCorrect]=useState(false);
 const [earnedStars,setEarnedStars]=useState(0);
 const [busy,setBusy]=useState(false);
 const alive=useRef(true);
 const generation=useRef(0);
 const phaseRef=useRef<JourneyPhase>('opening');
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const savingRef=useRef(false);
 const actionLock=useRef(false);
 const runId=useRef('');
 const startedAt=useRef(0);
 const resultRef=useRef<JourneyRecord|null>(null);
 function clearTimer(){if(timer.current!==null){clearTimeout(timer.current);timer.current=null;}}
 function stopAudio(){generation.current++;clearTimer();soundService.cancelSpeech();}
 useEffect(()=>{
  alive.current=true;let active=true;const repo=getProgressRepository();
  Promise.all([getStoryForestProgress(repo,profileId),repo.getStoryJourneyHistory(profileId)])
   .then(([p,h])=>{
    if(!active)return;
    setProgress(p);
    // Existing quiz-only progress never forces a story route to be repeated.
    setHistory(h.filter(x=>x.routeId.startsWith('journey-')&&x.episode>=1&&x.episode<=6) as JourneyRecord[]);
    setLoading(false);
   }).catch(error=>{
    console.error('[StoryJourney] load',error);
    if(active){setLoadError('Hikâye ilerlemesi okunamadı.');setLoading(false);}
   });
  return()=>{active=false;alive.current=false;stopAudio();};
 },[profileId]);
 async function finishStory(nextPlan:JourneyPlan,record:JourneyRecord){
  if(savingRef.current)return;
  savingRef.current=true;setBusy(true);setSaveError('');
  try{
   const p=await saveForestJourney({
    repo:getProgressRepository(),profileId,episode:nextPlan.route.episode,
    plan:nextPlan,record,sessionId:runId.current,
    durationSeconds:(Date.now()-startedAt.current)/1000
   });
   if(!alive.current)return;
   setProgress(p);setHistory(h=>[...h,record]);
   setEarnedStars(journeyStars(record));setScreen('reward');
   soundService.playSfx('fanfare',.72);onSaved();
  }catch(error){
   console.error('[StoryJourney] save',error);
   if(alive.current)setSaveError('Kayıt yapılamadı. Tekrar kaydet.');
  }finally{
   savingRef.current=false;
   if(alive.current)setBusy(false);
  }
 }
 function nextPassive(nextPlan:JourneyPlan,stage:JourneyPhase,loc:ForestScene|null){
  if(stage==='opening')enterPhase(nextPlan,'discover',loc);
  else if(stage==='meet')enterPhase(nextPlan,'choose',loc);
  else if(stage==='result')enterPhase(nextPlan,'friend',loc);
  else if(stage==='ending'&&resultRef.current)void finishStory(nextPlan,resultRef.current);
 }
 function enterPhase(nextPlan:JourneyPlan,stage:JourneyPhase,loc:ForestScene|null){
  stopAudio();phaseRef.current=stage;setPhase(stage);
  setCaption(false);setVoiceUnavailable(false);setWrong(null);setCorrect(false);
  const token=generation.current;
  const spoken=narrativeFor(nextPlan,stage,loc??undefined);
  const voiceStarted=soundService.speakEnglish(spoken,{
   rate:englishLevel==='Pre-A1'?.82:englishLevel==='A1'?.9:.96,
   onEnd:()=>{
    if(!alive.current||token!==generation.current||phaseRef.current!==stage)return;
    if(['opening','meet','result','ending'].includes(stage)){
     timer.current=setTimeout(()=>{
      timer.current=null;
      if(alive.current&&token===generation.current&&phaseRef.current===stage)
       nextPassive(nextPlan,stage,loc);
     },900);
    }
   },
   onError:()=>{
    if(alive.current&&token===generation.current){setVoiceUnavailable(true);setCaption(true);}
   }
  });
  if(!voiceStarted){setVoiceUnavailable(true);setCaption(true);}
 }
 function start(id:ForestEpisode){
  if(loading||loadError||busy||savingRef.current||id>progress.completedLevels+1)return;
  stopAudio();
  const seed=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;
  const selected=planJourneyStory({episode:id,englishLevel,gradeLevel,seed,history});
  setEpisode(id);setPlan(selected);setScreen('playing');
  setDestination(null);setMistakes(0);setUsedHint(false);
  setFirstResult({mistakes:0,hint:false});setHighlight(false);setSaveError('');
  setWrong(null);setCorrect(false);
  actionLock.current=false;resultRef.current=null;
  runId.current='journey:'+profileId+':'+id+':'+Date.now()+':'+seed;
  startedAt.current=Date.now();
  soundService.unlockAudio();soundService.playSfx('whoosh',.48);
  enterPhase(selected,'opening',null);
 }
 function exitToChapters(){
  if(savingRef.current)return;
  stopAudio();actionLock.current=false;setPlan(null);setScreen('chapters');setSaveError('');
 }
 function tapObject(object:JourneyObject){
  if(!plan||phaseRef.current!=='discover'||actionLock.current||busy)return;
  if(object!==plan.route.object){
   setMistakes(n=>n+1);setWrong(object);soundService.playSfx('gentle_retry',.56);return;
  }
  actionLock.current=true;setCorrect(true);setWrong(null);
  setFirstResult({mistakes,hint:usedHint});soundService.playSfx('correct',.8);
  timer.current=setTimeout(()=>{
   timer.current=null;if(!alive.current)return;
   actionLock.current=false;setMistakes(0);setUsedHint(false);setHighlight(false);
   enterPhase(plan,'meet',null);
  },1050);
 }
 function choosePath(loc:ForestScene){
  if(!plan||phaseRef.current!=='choose'||actionLock.current||busy||
   !plan.route.destinations.some(x=>x.scene===loc))return;
  actionLock.current=true;setDestination(loc);
  soundService.playSfx('whoosh',.5);
  timer.current=setTimeout(()=>{
   timer.current=null;if(!alive.current)return;
   actionLock.current=false;enterPhase(plan,'result',loc);
  },450);
 }
 function tapFriend(id:ForestActorId){
  if(!plan||phaseRef.current!=='friend'||actionLock.current||busy||!destination)return;
  if(id!==plan.route.helper){
   setMistakes(n=>n+1);setWrong(id);soundService.playSfx('gentle_retry',.56);return;
  }
  actionLock.current=true;setWrong(null);setCorrect(true);
  soundService.playSfx('correct',.82);
  const record:JourneyRecord={
   routeId:plan.route.id,episode:plan.route.episode,object:plan.route.object,
   destination,firstMistakes:firstResult.mistakes,secondMistakes:mistakes,
   firstHint:firstResult.hint,secondHint:usedHint,completedAt:new Date().toISOString()
  };
  resultRef.current=record;
  timer.current=setTimeout(()=>{
   timer.current=null;if(!alive.current)return;
   actionLock.current=false;enterPhase(plan,'ending',destination);
  },1050);
 }
 function hint(){
  if(!plan||!['discover','friend'].includes(phaseRef.current)||actionLock.current||busy)return;
  setHighlight(true);setUsedHint(true);
  soundService.playSfx('tap',.42);
 }
 function replay(){
  if(!plan||busy)return;
  clearTimer();enterPhase(plan,phaseRef.current,destination);
 }
 const active=FOREST_EPISODES[episode-1];
 const passive=['opening','meet','result','ending'].includes(phase);
 const journeyStep:{[P in JourneyPhase]:number}={
  opening:1,discover:2,meet:3,choose:4,result:5,friend:6,ending:7
 };
 return <div className="sj-root" role="dialog" aria-modal="true" aria-label="Hikâyeyi Keşfet">
  {screen==='chapters'&&<>
   <header className="sj-header">
    <button type="button" className="sj-back" onClick={onBack} aria-label="Hikâye Ormanı'na dön">←</button>
    <strong>📖 Hikâyeyi Keşfet</strong>
    <span className="sj-counter">✦ {progress.completedLevels}/6</span>
   </header>
   <main className="sj-chapters">
    <div className="sj-cover">
     <picture>
      <source media="(max-width:640px)" srcSet="/assets/kids-islands/listening_forest_mobile.webp"/>
      <img src="/assets/kids-islands/listening_forest.webp" alt="" className="sj-cover-art"/>
     </picture>
     <div className="sj-cover-copy"><span>HİKÂYE ORMANI · MACERA</span>
      <h1>Her Seferinde<br/>Yeni Bir Hikâye</h1>
      <p>Dinle · Keşfet · Karar ver</p>
     </div>
    </div>
    <div className="sj-guide">🎭 4 farklı macera yolu &nbsp; · &nbsp; 🌿 2 farklı hikâye sonu</div>
    {loading&&<div className="sj-status" role="status">Hikâyeler yükleniyor…</div>}
    {loadError&&<div className="sj-status" role="alert">{loadError}</div>}
    {!loading&&!loadError&&<section className="sj-episode-grid" aria-label="Altı hikâye dünyası">
      {FOREST_EPISODES.map(chapter=>{
       const enabled=chapter.id<=progress.completedLevels+1;
       const stars=progress.starsByLevel[chapter.id]||0;
       return <button className="sj-episode" key={chapter.id} type="button"
        disabled={!enabled} onClick={()=>start(chapter.id)}
        aria-label={chapter.title+(enabled?'':' kilitli')}>
        <div className="sj-episode-art"><StoryForestScenery scene={chapter.scene}/>
         {!enabled&&<span className="sj-locked">🔒</span>}</div>
        <div className="sj-episode-bottom">
         <span><b>{chapter.id}.</b> {chapter.title}</span>
         <small>{stars?'★'.repeat(stars):enabled?'▶ Oyna':'Kilitli'}</small>
        </div>
       </button>;
      })}
    </section>}
   </main>
  </>}
  {screen==='playing'&&plan&&<>
   <header className="sj-header sj-in-game">
    <button type="button" className="sj-back" onClick={exitToChapters} disabled={busy}
     aria-label="Bölümlere dön">←</button>
    <strong>{active.title}</strong>
    <div className="sj-progress" aria-label={'Hikâye sahnesi '+journeyStep[phase]+' / 7'}>
     {Array.from({length:7},(_,i)=><i key={i}
       className={i<journeyStep[phase]-1?'done':i===journeyStep[phase]-1?'current':''}/>)}
    </div>
   </header>
   <main className="sj-play">
    <div className="sj-scene" aria-label="Resimli, etkileşimli hikâye sahnesi">
     <StoryScene plan={plan} phase={phase} location={destination}/>
     <div className="sj-caption">
      <button type="button" className="sj-speak" onClick={replay}
       aria-label="İngilizce anlatımı tekrar dinle" disabled={busy}>🔊</button>
      <div className="sj-spoken">
       <span>{voiceUnavailable?'SES KAPALI · METİN':'DİNLE VE KEŞFET'}</span>
       {caption||voiceUnavailable?<p lang="en">{narrativeFor(plan,phase,destination??undefined)}</p>:
        <div className="sj-waves" aria-hidden="true">▂ ▄ ▆ ▃ ▅ ▂</div>}
      </div>
      <button className="sj-text" type="button" onClick={()=>setCaption(v=>!v)}
       aria-label="Anlatımı yazılı göster veya gizle" disabled={busy}>Aa</button>
     </div>
     {phase==='discover'&&<div className="sj-objects" role="group" aria-label="Hikâyedeki nesneyi bul">
      {plan.objectChoices.map(object=><button type="button" key={object}
       aria-label={object==='key'?'Altın anahtar':object==='apple'?'Kırmızı elma':object==='bird'?'Mavi kuş':'Kristal'}
       className={'sj-object-choice '+(highlight&&object===plan.route.object?'sj-hint-glow ':'')+
        (wrong===object?'sj-wrong ':'')+(correct&&object===plan.route.object?'sj-correct':'')}
       disabled={busy||actionLock.current} onClick={()=>tapObject(object)}>
       <JourneyObjectArt object={object}/>
      </button>)}
     </div>}
     {phase==='choose'&&<div className="sj-path-choices" role="group" aria-label="Macera için bir yol seç">
      {plan.route.destinations.map(x=><button type="button" className="sj-path" key={x.scene}
       onClick={()=>choosePath(x.scene)} disabled={busy||actionLock.current} aria-label={x.label}>
        <StoryForestScenery scene={x.scene}/>
        <span>{x.label}</span>
      </button>)}
     </div>}
     {phase==='friend'&&<div className="sj-friend-choices" role="group" aria-label="Hikâyede sana yardım eden arkadaşı bul">
      {plan.friendChoices.map(id=><button type="button" key={id}
       onClick={()=>tapFriend(id)} disabled={busy||actionLock.current}
       aria-label={id} className={'sj-friend-choice '+
         (highlight&&id===plan.route.helper?'sj-hint-glow ':'')+
         (wrong===id?'sj-wrong ':'')+(correct&&id===plan.route.helper?'sj-correct':'')}>
        <Actor id={id}/>
       </button>)}
     </div>}
     {(phase==='discover'||phase==='friend')&&<div className="sj-hint-row">
      <button type="button" className="sj-help" onClick={hint}
       disabled={busy||actionLock.current} aria-label="Doğru görseli göster">💡</button>
      <div role="status" aria-live="polite" className="sj-feedback">
       {correct?'✦ Harika!':wrong?'↻ Yeniden dene':''}
      </div>
     </div>}
     {passive&&<button className="sj-continue" type="button" disabled={busy}
       aria-label="Hikâyede sonraki olaya geç"
       onClick={()=>{stopAudio();if(phase==='ending'&&resultRef.current)
        void finishStory(plan,resultRef.current);
        else nextPassive(plan,phase,destination);}}>▶</button>}
    </div>
    <div className="sj-trail"><span>{active.badge} {active.title}</span>
     <span className="sj-trail-badge">{plan.route.object==='key'?'🗝️':
      plan.route.object==='apple'?'🍎':plan.route.object==='bird'?'🐦':'💎'}</span>
    </div>
    {saveError&&<div className="sj-save-error" role="alert">{saveError}
     <button type="button" disabled={busy} onClick={()=>{if(plan&&resultRef.current)
       void finishStory(plan,resultRef.current);}}>Tekrar kaydet</button></div>}
    {busy&&<div className="sj-status" role="status">Macera kaydediliyor…</div>}
   </main>
  </>}
  {screen==='reward'&&plan&&<>
   <header className="sj-header"><button type="button" className="sj-back"
     onClick={exitToChapters} aria-label="Bölümlere dön">←</button><strong>Macera tamamlandı</strong><span/></header>
   <main className="sj-reward">
    <div className="sj-reward-scene"><StoryScene plan={plan} phase="ending" location={destination}/></div>
    <h1>Bir Hikâye Daha!</h1>
    <div className="sj-earned-stars" aria-label={earnedStars+' yıldız'}>
     {[1,2,3].map(n=><span key={n} className={n<=earnedStars?'earned':''}>★</span>)}
    </div>
    <div className="sj-reward-actions">
     <button type="button" className="sj-primary" onClick={()=>start(episode)}>🔄 Başka Macera</button>
     {episode<6&&<button type="button" className="sj-primary"
       onClick={()=>start((episode+1) as ForestEpisode)}>Sonraki Dünya →</button>}
     <button type="button" className="sj-secondary" onClick={exitToChapters}>Hikâyeler</button>
    </div>
   </main>
  </>}
 </div>;
}
