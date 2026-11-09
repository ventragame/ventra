'use client';

import React,{useEffect,useRef,useState} from 'react';
import type {ForestEpisode,ForestPlacement} from '@/lib/learning/storyForestEngine';
import {FOREST_ACTOR_NAMES} from '@/lib/learning/storyForestEngine';
import {
 DETECTIVE_CHAPTERS,DETECTIVE_CLUES,DETECTIVE_SCENE_LABELS,
 planDetectiveCase,detectiveNarration,detectiveStars,
 type DetectivePlan,type DetectiveStage,type DetectiveRecord,
 type DetectiveAnswer,type DetectiveClueId
} from '@/lib/learning/storyDetectiveEngine';
import {
 getDetectiveProgress,saveDetectiveCase,type DetectiveProgress
} from '@/lib/progress/storyDetectiveProgress';
import {getProgressRepository} from '@/lib/progress';
import {soundService} from '@/lib/audio/SoundService';
import {StoryForestActor,StoryForestScenery} from './StoryForestArt';
import {DetectiveClueArt,DetectiveLostItem} from './StoryDetectiveArt';
import './story-detective.css';

interface Props{
 profileId:string;gradeLevel:number|null;englishLevel:ForestPlacement;
 onBack:()=>void;onSaved:()=>void;
}
type View='chapters'|'playing'|'reward';
const EMPTY:DetectiveProgress={
 completedLevels:0,totalLevels:6,starsByLevel:{},playCountByLevel:{}
};
/** Natural listening speed: language placement is primary, school grade only
 * makes a small adjustment. No extreme synthetic slow-motion narration.
 */
export function detectiveVoiceRate(level:ForestPlacement,grade:number|null):number{
 const base=level==='Pre-A1'?.89:level==='A1'?.94:.98;
 return Math.max(.86,Math.min(1,base+(grade!==null&&grade<=2?-.025:grade!==null&&grade>=6?.012:0)));
}
export function StoryDetectiveAdventure({profileId,gradeLevel,englishLevel,onBack,onSaved}:Props){
 const [view,setView]=useState<View>('chapters');
 const [progress,setProgress]=useState<DetectiveProgress>(EMPTY);
 const [loading,setLoading]=useState(true);
 const [loadError,setLoadError]=useState('');
 const [plan,setPlan]=useState<DetectivePlan|null>(null);
 const [stage,setStage]=useState<DetectiveStage>('intro');
 const [picked,setPicked]=useState<DetectiveClueId[]>([]);
 const [answers,setAnswers]=useState<DetectiveAnswer[]>([]);
 const [mistakes,setMistakes]=useState(0);
 const [hintTarget,setHintTarget]=useState<DetectiveClueId|null>(null);
 const [destMistakes,setDestMistakes]=useState(0);
 const [destinationHint,setDestinationHint]=useState(false);
 const [wrongClue,setWrongClue]=useState<DetectiveClueId|null>(null);
 const [wrongDestination,setWrongDestination]=useState<string|null>(null);
 const [correct,setCorrect]=useState(false);
 const [caption,setCaption]=useState(false);
 const [voiceUnavailable,setVoiceUnavailable]=useState(false);
 const [busy,setBusy]=useState(false);
 const [saveError,setSaveError]=useState('');
 const [stars,setStars]=useState(0);
 const alive=useRef(true);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const generation=useRef(0);
 const stageRef=useRef<DetectiveStage>('intro');
 const locked=useRef(false);
 const saving=useRef(false);
 const completed=useRef<DetectiveRecord|null>(null);
 const sessionId=useRef('');
 const startedAt=useRef(0);

 function clearTimer(){
  if(timer.current!==null){clearTimeout(timer.current);timer.current=null;}
 }
 function stopAudio(){
  generation.current++;
  clearTimer();
  soundService.cancelSpeech();
 }
 useEffect(()=>{
  alive.current=true;let valid=true;
  setLoading(true);setLoadError('');
  getDetectiveProgress(getProgressRepository(),profileId)
   .then(row=>{if(valid){setProgress(row);setLoading(false);}})
   .catch(error=>{
    console.error('[StoryDetective] Failed to load progress',error);
    if(valid){setLoadError('Bölümler yüklenemedi.');setLoading(false);}
   });
  return()=>{valid=false;alive.current=false;stopAudio();};
 },[profileId]);

 async function finish(p:DetectivePlan,evidence:DetectiveRecord){
  if(saving.current)return;
  saving.current=true;setBusy(true);setSaveError('');
  try{
   const next=await saveDetectiveCase({
    repo:getProgressRepository(),profileId,
    episode:p.chosen.chapter.episode,plan:p,record:evidence,
    sessionId:sessionId.current,
    durationSeconds:(Date.now()-startedAt.current)/1000
   });
   if(!alive.current)return;
   setProgress(next);setStars(detectiveStars(evidence));
   setView('reward');soundService.playSfx('fanfare',.77);
   onSaved();
  }catch(error){
   console.error('[StoryDetective] Failed to save',error);
   if(alive.current)setSaveError('İlerleme kaydedilemedi. Yeniden dene.');
  }finally{
   saving.current=false;
   if(alive.current)setBusy(false);
  }
 }
 function nextPassive(p:DetectivePlan,phase:DetectiveStage){
  if(phase==='intro')enterStage(p,'evidence');
  if(phase==='ending'&&completed.current)void finish(p,completed.current);
 }
 function speak(p:DetectivePlan,phase:DetectiveStage){
  stopAudio();
  setVoiceUnavailable(false);
  const token=generation.current;
  const started=soundService.speakEnglish(detectiveNarration(p,phase),{
   rate:detectiveVoiceRate(englishLevel,gradeLevel),
   onEnd:()=>{
    if(!alive.current||token!==generation.current||stageRef.current!==phase)return;
    if(phase==='intro'||phase==='ending'){
     timer.current=setTimeout(()=>{
      timer.current=null;
      if(alive.current&&token===generation.current&&stageRef.current===phase)
       nextPassive(p,phase);
     },phase==='intro'?650:1250);
    }
   },
   onError:()=>{
    if(alive.current&&token===generation.current){
     setVoiceUnavailable(true);setCaption(true);
    }
   }
  });
  if(!started){setVoiceUnavailable(true);setCaption(true);}
 }
 function enterStage(p:DetectivePlan,next:DetectiveStage){
  locked.current=false;
  stageRef.current=next;setStage(next);
  setCaption(false);setWrongClue(null);setWrongDestination(null);
  setCorrect(false);
  speak(p,next);
 }
 function start(episode:ForestEpisode){
  if(loading||loadError||busy||saving.current||episode>progress.completedLevels+1)return;
  stopAudio();locked.current=false;
  const seed=(Date.now()^Math.floor(Math.random()*0x7fffffff))>>>0;
  const next=planDetectiveCase({
   episode,englishLevel,gradeLevel,seed,
   playCount:progress.playCountByLevel[episode]??0
  });
  sessionId.current='detective:'+profileId+':'+episode+':'+Date.now()+':'+seed;
  startedAt.current=Date.now();completed.current=null;
  setPlan(next);setPicked([]);setAnswers([]);setMistakes(0);
  setHintTarget(null);setDestMistakes(0);setDestinationHint(false);
  setSaveError('');setStars(0);setWrongClue(null);
  setWrongDestination(null);setView('playing');
  soundService.unlockAudio();soundService.playSfx('whoosh',.55);
  enterStage(next,'intro');
 }
 function back(){
  if(saving.current)return;
  stopAudio();locked.current=false;
  if(view==='chapters'){onBack();return;}
  setView('chapters');setPlan(null);setSaveError('');
 }
 function replayNarration(){
  if(!plan||busy)return;
  soundService.unlockAudio();speak(plan,stageRef.current);
 }
 function tapClue(id:DetectiveClueId){
  if(!plan||view!=='playing'||stageRef.current!=='evidence'||locked.current||
   busy||picked.includes(id))return;
  if(!plan.requiredClues.includes(id)){
   setMistakes(v=>v+1);setWrongClue(id);soundService.playSfx('gentle_retry',.55);return;
  }
  const response:DetectiveAnswer={
   clueId:id,mistakes,hintUsed:hintTarget===id,
   firstTryCorrect:mistakes===0&&hintTarget!==id
  };
  const nextPicked=[...picked,id];
  setPicked(nextPicked);setAnswers(v=>[...v,response]);
  setWrongClue(null);setMistakes(0);setCorrect(true);
  if(hintTarget===id)setHintTarget(null);
  soundService.playSfx('correct',.65);
  if(nextPicked.length===plan.requiredClues.length){
   locked.current=true;
   timer.current=setTimeout(()=>{
    timer.current=null;
    if(alive.current)enterStage(plan,'location');
   },750);
  }else{
   // Keep the next clue independently assessable.
   timer.current=setTimeout(()=>{timer.current=null;if(alive.current)setCorrect(false);},420);
  }
 }
 function chooseDestination(scene:string){
  if(!plan||view!=='playing'||stageRef.current!=='location'||busy||locked.current)return;
  if(scene!==plan.chosen.destination){
   setDestMistakes(v=>v+1);setWrongDestination(scene);
   soundService.playSfx('gentle_retry',.65);return;
  }
  locked.current=true;
  setWrongDestination(null);setCorrect(true);
  soundService.playSfx('correct',.78);
  const record:DetectiveRecord={
   caseId:plan.chosen.id,episode:plan.chosen.chapter.episode,
   destination:plan.chosen.destination,placement:englishLevel,
   clues:answers,destinationMistakes:destMistakes,
   destinationHint,completedAt:new Date().toISOString()
  };
  completed.current=record;
  timer.current=setTimeout(()=>{
   timer.current=null;
   if(alive.current)enterStage(plan,'ending');
  },600);
 }
 function hint(){
  if(!plan||view!=='playing'||busy||locked.current)return;
  if(stageRef.current==='evidence'){
   const next=plan.requiredClues.find(id=>!picked.includes(id));
   if(next)setHintTarget(next);
  }else if(stageRef.current==='location'){
   setDestinationHint(true);
  }else return;
  soundService.playSfx('tap',.4);
 }
 const chapter=plan?.chosen.chapter;
 const passive=stage==='intro'||stage==='ending';
 const activeStage=stage==='intro'?1:stage==='evidence'?2:stage==='location'?3:4;
 return <div className="sd-root" role="dialog" aria-modal="true"
  aria-label="Hikâye Dedektifi">
  <header className="sd-header">
   <button type="button" className="sd-back" onClick={back} disabled={busy}
    aria-label={view==='chapters'?"Hikâye Ormanı'na dön":'Bölümlere dön'}>←</button>
   <strong>{view==='chapters'?'🔍 Hikâye Dedektifi':chapter?.title??'Hikâye Dedektifi'}</strong>
   <div className="sd-header-right">
    {view==='playing'&&<div className="sd-steps"
      aria-label={'Görev adımı '+activeStage+' / 4'}>
      {[1,2,3,4].map(n=><i key={n} className={n<activeStage?'done':n===activeStage?'active':''}/>)}
     </div>}
    <span className="sd-count">
     {view==='chapters'?'★ '+progress.completedLevels+'/6':
      view==='reward'?'★ '+stars:
      stage==='evidence'?'✦ '+picked.length+'/'+(plan?.requiredClues.length??2):
      stage==='location'?'🧭':'📖'}
    </span>
   </div>
  </header>

  {view==='chapters'&&<main className="sd-chapters">
   <section className="sd-cover">
    <StoryForestScenery scene="path"/>
    <div className="sd-cover-shade"/>
    <div className="sd-cover-character"><StoryForestActor id="rabbit"/></div>
    <div className="sd-cover-text"><span>HİKÂYE ORMANI · OYUN 03</span>
     <h1>Hikâye Dedektifi</h1><p>Dinle · İpuçlarını Bul · Gizemi Çöz</p>
    </div>
    <div className="sd-cover-glass" aria-hidden="true">⌕</div>
   </section>
   {loading&&<p className="sd-status" role="status">Dedektif maceraları açılıyor…</p>}
   {loadError&&<p className="sd-status" role="alert">{loadError}</p>}
   {!loading&&!loadError&&<>
    <div className="sd-available">🔍 6 gizem · 18 farklı çözüm yolu</div>
    <section className="sd-chapter-grid" aria-label="Dedektif bölümleri">
     {DETECTIVE_CHAPTERS.map(ch=>{
      const open=ch.episode<=progress.completedLevels+1;
      const best=progress.starsByLevel[ch.episode]??0;
      return <button type="button" key={ch.episode} disabled={!open}
       onClick={()=>start(ch.episode)} className="sd-chapter"
       aria-label={ch.title+(open?'':' kilitli')}>
       <div className="sd-chapter-image">
        <StoryForestScenery scene={ch.start}/>
        <div className="sd-chapter-mascot"><StoryForestActor id={ch.hero}/></div>
        {!open&&<span className="sd-chapter-lock">🔒</span>}
       </div>
       <div className="sd-chapter-bottom">
        <span><b>{String(ch.episode).padStart(2,'0')}</b> {ch.title}</span>
        <small>{best?'★'.repeat(best):open?'▶ Oyna':'Kilitli'}</small>
       </div>
      </button>;
     })}
    </section>
   </>}
  </main>}

  {view==='playing'&&plan&&chapter&&<main className="sd-playing">
   <div className={'sd-world sd-world-'+stage}>
    <StoryForestScenery scene={stage==='ending'?plan.chosen.destination:chapter.start}/>
    <div className="sd-world-vignette"/>
    <div className="sd-world-hero"><StoryForestActor id={chapter.hero}/></div>
    {stage==='ending'&&<>
     <div className="sd-world-friend"><StoryForestActor id={chapter.friend}/></div>
     <div className="sd-world-treasure"><DetectiveLostItem id={chapter.item}/></div>
     <div className="sd-world-confetti" aria-hidden="true">✦ ✦ ✧</div>
    </>}
    {stage!=='ending'&&<div className="sd-lost-bubble" aria-hidden="true">
     <span>?</span><div><DetectiveLostItem id={chapter.item}/></div>
    </div>}
    <div className="sd-world-corner" aria-hidden="true">
     <span>🔍</span>
    </div>
   </div>
   <section className="sd-notebook" aria-label="Dedektif defteri">
    <div className="sd-notebook-top">
     <div className="sd-notebook-eyebrow">HİKÂYE ORMANI · DOSYA {String(chapter.episode).padStart(2,'0')}</div>
     <div className="sd-notebook-title">
      <span className="sd-notebook-icon" aria-hidden="true">{stage==='evidence'?'🔎':stage==='location'?'🧭':stage==='ending'?'✦':'📖'}</span>
      <h2>{stage==='evidence'?'İpuçlarını Topla':
           stage==='location'?'Gizemin Yerini Bul':
           stage==='ending'?'Gizem Çözüldü!':'Yeni Bir Gizem'}</h2>
     </div>
    </div>
    <div className="sd-audio">
     <button type="button" onClick={replayNarration} disabled={busy}
      aria-label="İngilizce hikâyeyi tekrar dinle" className="sd-sound">🔊</button>
     <div className="sd-audio-body">
      <small>{voiceUnavailable?'SES KAPALI · METİN':'DİNLE VE KEŞFET'}</small>
      {caption||voiceUnavailable?<p lang="en">{detectiveNarration(plan,stage)}</p>:
       <span className="sd-audio-waves" aria-hidden="true">▂ ▄ ▆ ▃ ▅ ▂</span>}
     </div>
     <button type="button" onClick={()=>setCaption(v=>!v)}
      className="sd-captions" disabled={busy}
      aria-label="İngilizce anlatımı göster veya gizle">Aa</button>
    </div>

    {stage==='intro'&&<div className="sd-intro-box">
     <div className="sd-intro-stamp" aria-hidden="true"><DetectiveLostItem id={chapter.item}/></div>
     <div className="sd-intro-title">Kayıp eşyanın izini sür!</div>
     <div className="sd-intro-graphic" aria-hidden="true">✦ · · · ✦</div>
    </div>}

    {stage==='evidence'&&<>
     <div className="sd-clue-stamps" aria-label="Toplanan kanıtlar">
      {plan.requiredClues.map((id,i)=><div className={'sd-stamp '+(picked.includes(id)?'found':'')}
       key={id} aria-label={'Kanıt '+(i+1)+(picked.includes(id)?' bulundu':' bekleniyor')}>
       {picked.includes(id)?<DetectiveClueArt id={id}/>:<span>?</span>}
      </div>)}
     </div>
     <div className="sd-evidence-grid" role="group" aria-label="Resimli kanıt seçenekleri">
      {plan.clueChoices.map(id=><button type="button" key={id}
       className={'sd-evidence-card '+(picked.includes(id)?'selected ':'')+
        (wrongClue===id?'wrong ':'')+(hintTarget===id?'hint ':'')}
       onClick={()=>tapClue(id)} disabled={busy||locked.current||picked.includes(id)}
       aria-label={DETECTIVE_CLUES[id].tr+(picked.includes(id)?' bulundu':'')}>
       <DetectiveClueArt id={id}/>
       {picked.includes(id)&&<span className="sd-mark" aria-hidden="true">✓</span>}
      </button>)}
     </div>
    </>}

    {stage==='location'&&<>
     <div className="sd-clue-stamps sd-clue-stamps-small" aria-label="Bulunan ipuçları">
      {plan.requiredClues.map(id=><div className="sd-stamp found" key={id}>
       <DetectiveClueArt id={id}/></div>)}
     </div>
     <div className="sd-locations" role="group" aria-label="İpuçlarından doğru yeri seç">
      {plan.locationChoices.map(id=><button type="button" key={id}
       className={'sd-location-card '+(wrongDestination===id?'wrong ':'')+
        (destinationHint&&id===plan.chosen.destination?'hint':'')}
       onClick={()=>chooseDestination(id)} disabled={busy||locked.current}
       aria-label={DETECTIVE_SCENE_LABELS[id]}>
       <StoryForestScenery scene={id}/>
       <span>{DETECTIVE_SCENE_LABELS[id]}</span>
      </button>)}
     </div>
    </>}

    {stage==='ending'&&<div className="sd-ending-box" aria-hidden="true">
     <span>✦</span><div><DetectiveLostItem id={chapter.item}/></div><span>✦</span>
    </div>}
    <div className="sd-controls">
     <button type="button" className="sd-hint"
      onClick={hint}
      disabled={busy||locked.current||!['evidence','location'].includes(stage)}
      aria-label="İpucu al">💡 <span>İpucu</span></button>
     <div role="status" aria-live="polite" className="sd-feedback">
      {correct?'✦ Harika!':wrongClue||wrongDestination?'↻ Bir daha dene':''}
     </div>
     {passive&&<button type="button" className="sd-next" disabled={busy}
      onClick={()=>{stopAudio();nextPassive(plan,stage);}}
      aria-label={stage==='intro'?'İpuçlarına geç':'Macera ödülünü kaydet'}>▶</button>}
    </div>
    {busy&&<p role="status" className="sd-status">Macera kaydediliyor…</p>}
    {saveError&&<div role="alert" className="sd-error">{saveError}
     <button type="button" disabled={busy}
      onClick={()=>{if(completed.current)void finish(plan,completed.current);}}>
      Yeniden Kaydet</button></div>}
   </section>
  </main>}

  {view==='reward'&&plan&&chapter&&<main className="sd-reward">
   <div className="sd-reward-illustration">
    <StoryForestScenery scene={plan.chosen.destination}/>
    <div className="sd-reward-mascot"><StoryForestActor id={chapter.hero}/></div>
    <div className="sd-reward-helper"><StoryForestActor id={chapter.friend}/></div>
    <div className="sd-reward-item"><DetectiveLostItem id={chapter.item}/></div>
   </div>
   <h2>Gizem Çözüldü!</h2>
   <div className="sd-reward-stars" aria-label={stars+' yıldız'}>
    {[1,2,3].map(n=><span className={n<=stars?'earned':''} key={n}>★</span>)}
   </div>
   <div className="sd-reward-actions">
    <button type="button" className="sd-primary"
     onClick={()=>start(chapter.episode)}>↻ Yeni Gizem</button>
    {chapter.episode<6&&<button type="button" className="sd-primary"
     onClick={()=>start((chapter.episode+1) as ForestEpisode)}>Sonraki Bölüm →</button>}
    <button type="button" className="sd-secondary" onClick={back}>Bölümler</button>
   </div>
  </main>}
 </div>;
}
