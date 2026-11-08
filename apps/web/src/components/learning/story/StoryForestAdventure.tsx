
'use client';

import React,{useEffect,useRef,useState} from 'react';
import type {ForestActorId,ForestAnswer,ForestChallenge,ForestDeck,ForestEpisode} from '@/lib/learning/storyForestEngine';
import {
 FOREST_EPISODES,FOREST_ACTOR_NAMES,planStoryForestEpisode,forestStars
} from '@/lib/learning/storyForestEngine';
import type {ForestPlacement} from '@/lib/learning/storyForestEngine';
import {getProgressRepository} from '@/lib/progress';
import {getStoryForestProgress,saveStoryForestEpisode,type ForestProgress}
 from '@/lib/progress/storyForestProgress';
import {soundService} from '@/lib/audio/SoundService';
import {StoryForestScenery,StoryForestActor} from './StoryForestArt';
import './story-forest.css';

interface Props{
 profileId:string;
 gradeLevel:number|null;
 englishLevel:ForestPlacement;
 onBack:()=>void;
 onSaved:()=>void;
}
type View='chapters'|'play'|'reward';
const EMPTY:ForestProgress={completedLevels:0,totalLevels:6,starsByLevel:{}};

/**
 * Episode progress is persisted only after all questions are completed.
 * Each answer remains linked to a question and its visually exact target.
 * The same sessionId is reused on a failed-save retry (idempotent).
 */
export function StoryForestAdventure({profileId,gradeLevel,englishLevel,onBack,onSaved}:Props){
 const [view,setView]=useState<View>('chapters');
 const [loading,setLoading]=useState(true);
 const [loadError,setLoadError]=useState('');
 const [saveError,setSaveError]=useState('');
 const [progress,setProgress]=useState<ForestProgress>(EMPTY);
 const [history,setHistory]=useState<ForestAnswer[]>([]);
 const [deck,setDeck]=useState<ForestDeck|null>(null);
 const [episode,setEpisode]=useState<ForestEpisode>(1);
 const [step,setStep]=useState(0);
 const [misses,setMisses]=useState(0);
 const [hintUsed,setHintUsed]=useState(false);
 const [showText,setShowText]=useState(false);
 const [voiceUnavailable,setVoiceUnavailable]=useState(false);
 const [feedback,setFeedback]=useState<'correct'|'wrong'|null>(null);
 const [chosen,setChosen]=useState<ForestActorId|null>(null);
 const [wrongChoice,setWrongChoice]=useState<ForestActorId|null>(null);
 const [answers,setAnswers]=useState<ForestAnswer[]>([]);
 const [earnedStars,setEarnedStars]=useState(0);
 const [busy,setBusy]=useState(false);
 const stepLock=useRef(false);
 const savingLock=useRef(false);
 const currentSession=useRef('');
 const startedAt=useRef(0);
 const nextTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const alive=useRef(true);
 const task=deck?.questions[step]??null;

 function cancelNext(){
  if(nextTimer.current!==null){clearTimeout(nextTimer.current);nextTimer.current=null;}
 }
 useEffect(()=>{
  alive.current=true;
  let active=true;
  const repo=getProgressRepository();
  setLoading(true);setLoadError('');
  Promise.all([getStoryForestProgress(repo,profileId),repo.getStoryAnswerHistory(profileId)])
    .then(([p,h])=>{
      if(!active)return;
      setProgress(p);
      setHistory(h.filter(row=>row.selectedId in FOREST_ACTOR_NAMES).map(row=>({
        ...row,selectedId:row.selectedId as ForestActorId
      })));
      setLoading(false);
    })
    .catch(error=>{
      console.error('[StoryForest] Loading failed',error);
      if(active){setLoadError('Kayıtlar yüklenemedi.');setLoading(false);}
    });
  return()=>{
   active=false;alive.current=false;cancelNext();soundService.cancelSpeech();
  };
 },[profileId]);
 // Never play TTS behind another child's game or when this scene closes.
 function speak(challenge:ForestChallenge){
  soundService.unlockAudio();
  const okay=soundService.speakEnglish(challenge.prompt,{
    rate:englishLevel==='Pre-A1'?0.8:0.9,
    onError:()=>{if(alive.current){setVoiceUnavailable(true);setShowText(true);}}
  });
  if(!okay){setVoiceUnavailable(true);setShowText(true);}
  return okay;
 }
 function start(id:ForestEpisode){
  if(loading||loadError||busy||savingLock.current||id>progress.completedLevels+1)return;
  cancelNext();soundService.cancelSpeech();
  const seed=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;
  const nextDeck=planStoryForestEpisode({episode:id,gradeLevel,englishLevel,seed,history});
  if(!nextDeck.questions.length){setLoadError('Bu hikâyede görev bulunamadı.');return;}
  currentSession.current='forest:'+profileId+':'+id+':'+Date.now()+':'+Math.random().toString(36).slice(2);
  startedAt.current=Date.now();
  stepLock.current=false;savingLock.current=false;
  setEpisode(id);setDeck(nextDeck);setStep(0);setMisses(0);
  setHintUsed(false);setShowText(false);setVoiceUnavailable(false);
  setFeedback(null);setChosen(null);setWrongChoice(null);setAnswers([]);setSaveError('');
  setEarnedStars(0);setView('play');
  soundService.playSfx('whoosh',.55);
  // Start under the explicit user gesture, not from a background autoplay effect.
  speak(nextDeck.questions[0]);
 }
 function stop(){
  if(savingLock.current)return;
  cancelNext();soundService.cancelSpeech();stepLock.current=false;
  setView('chapters');setDeck(null);setFeedback(null);setSaveError('');
 }
 function replay(){
  if(!task||busy)return;
  speak(task);
 }
 function hint(){
  if(!task||stepLock.current||busy)return;
  setHintUsed(true);
  setShowText(true);
  soundService.playSfx('tap',.4);
 }
 function pick(id:ForestActorId){
  if(!task||!deck||stepLock.current||busy||saveError||view!=='play')return;
  if(!task.choices.includes(id))return;
  soundService.unlockAudio();
  if(id!==task.targetId){
   setMisses(n=>n+1);
   setWrongChoice(id);
   setFeedback('wrong');
   soundService.playSfx('gentle_retry',.6);
   return;
  }
  stepLock.current=true;setWrongChoice(null);setChosen(id);setFeedback('correct');
  soundService.playSfx('correct',.78);
  const row:ForestAnswer={
   questionId:task.id,selectedId:id,mode:task.mode,
   mistakes:misses,hintUsed,
   firstTryCorrect:misses===0&&!hintUsed,placement:englishLevel,
   timestamp:new Date().toISOString()
  };
  const next=[...answers,row];
  setAnswers(next);
  nextTimer.current=setTimeout(()=>{
   nextTimer.current=null;
   if(!alive.current)return;
   if(step+1===deck.questions.length){
    void finish(deck,next);
    return;
   }
   const nextIndex=step+1;
   stepLock.current=false;
   setStep(nextIndex);setMisses(0);setHintUsed(false);setShowText(false);
   setVoiceUnavailable(false);setFeedback(null);setChosen(null);setWrongChoice(null);
   speak(deck.questions[nextIndex]);
  },1400);
 }
 async function finish(finalDeck:ForestDeck,finalAnswers:ForestAnswer[]){
  if(savingLock.current)return;
  savingLock.current=true;setBusy(true);setSaveError('');
  try{
   const updated=await saveStoryForestEpisode({
    repo:getProgressRepository(),profileId,episode:finalDeck.episode,
    deck:finalDeck,answers:finalAnswers,sessionId:currentSession.current,
    durationSeconds:(Date.now()-startedAt.current)/1000
   });
   if(!alive.current)return;
   setProgress(updated);
   setEarnedStars(forestStars(finalAnswers));
   setHistory(old=>[...old,...finalAnswers]);
   setView('reward');
   soundService.playSfx('fanfare',.75);
   onSaved();
  }catch(error){
   console.error('[StoryForest] Save failed',error);
   if(alive.current)setSaveError('Kayıt yapılamadı. Yeniden dene.');
  }finally{
   savingLock.current=false;
   if(alive.current)setBusy(false);
  }
 }
 const activeEpisode=FOREST_EPISODES[episode-1];
 return <div className="sf-root" role="dialog" aria-modal="true" aria-label="Hikâye Ormanı">
  <div className="sf-ambient" aria-hidden="true"/>
  {view==='chapters'&&<>
   <header className="sf-header">
    <button type="button" className="sf-round-button" onClick={onBack} aria-label="Adalar Evreni'ne dön">←</button>
    <div className="sf-brand"><span aria-hidden="true">📖</span><span>Hikâye Ormanı</span></div>
    <div className="sf-mini-progress">✦ {progress.completedLevels}/6</div>
   </header>
   <main className="sf-main">
    <div className="sf-cover">
     <img src="/assets/kids-islands/listening_forest.webp" alt="" className="sf-cover-art"/>
     <div className="sf-cover-copy">
      <span className="sf-eyebrow">SES · GÖRSEL · MACERA</span>
      <h1>Hikâyeyi Keşfet</h1>
      <p>Dinle, bul, hikâyeyi canlandır.</p>
     </div>
    </div>
    {loading&&<div className="sf-status" role="status">Hikâyeler hazırlanıyor…</div>}
    {loadError&&<div className="sf-status" role="alert">{loadError}
     <button type="button" onClick={onBack}>Geri dön</button>
    </div>}
    {!loading&&!loadError&&<section className="sf-episode-grid" aria-label="Altı hikâye bölümü">
     {FOREST_EPISODES.map(chapter=>{
      const unlocked=chapter.id<=progress.completedLevels+1;
      const stars=progress.starsByLevel[chapter.id]??0;
      return <button type="button" key={chapter.id} className="sf-episode"
       disabled={!unlocked} onClick={()=>start(chapter.id)}
       aria-label={chapter.title+(unlocked?'':' kilitli')}>
       <div className="sf-episode-art"><StoryForestScenery scene={chapter.scene}/>
        {!unlocked&&<div className="sf-lock" aria-hidden="true">🔒</div>}</div>
       <div className="sf-episode-meta">
        <strong><span className="sf-episode-number">{chapter.id}</span>{chapter.title}</strong>
        <span className="sf-episode-stars" aria-label={stars+' yıldız'}>{stars?'★'.repeat(stars):unlocked?'Oyna':'Yakında'}</span>
       </div>
      </button>;
     })}
    </section>}
   </main>
  </>}
  {view==='play'&&deck&&task&&<>
    <header className="sf-header sf-game-header">
      <button className="sf-round-button" type="button" onClick={stop} disabled={busy}
        aria-label="Hikâye bölümlerine dön">←</button>
      <div className="sf-game-name">{activeEpisode.title}</div>
      <div className="sf-steps" aria-label={'Görev '+(step+1)+' / '+deck.questions.length}>
       {deck.questions.map((item,i)=><span key={item.id}
        className={i<step?'sf-step-done':i===step?'sf-step-active':''}/>)}
      </div>
    </header>
    <main className="sf-playing">
     <div className="sf-stage" aria-label="Etkileşimli hikâye sahnesi">
      <StoryForestScenery scene={task.scene}/>
      <div className="sf-scene-vignette" aria-hidden="true"/>
      <div className="sf-cue">
       <button type="button" className="sf-listen" onClick={replay}
        aria-label="İngilizce cümleyi tekrar dinle" disabled={busy}>🔊</button>
       <div className="sf-cue-content">
        <span className="sf-cue-label">{voiceUnavailable?'SES YOK · OKUYABİLİRSİN':'DİNLE VE DOKUN'}</span>
        {(showText||voiceUnavailable)&&<p lang="en">{task.prompt}</p>}
        {!showText&&!voiceUnavailable&&<span className="sf-wave" aria-hidden="true"><i/><i/><i/><i/><i/></span>}
       </div>
       <button className="sf-hint" type="button" onClick={hint}
        disabled={busy||stepLock.current} aria-label="Cümleyi yazılı göster">Aa</button>
      </div>
      <div className="sf-choices" role="group" aria-label="Resimde doğru karakteri veya nesneyi seç">
       {task.choices.map((id,i)=><button type="button" key={id} onClick={()=>pick(id)}
          disabled={busy||stepLock.current}
          className={'sf-choice '+(chosen===id?'sf-choice-correct':'')+
           (wrongChoice===id?' sf-choice-try':'')}
          aria-label={FOREST_ACTOR_NAMES[id]} title={FOREST_ACTOR_NAMES[id]}>
         <StoryForestActor id={id}/>
         <span className="sf-choice-glint" aria-hidden="true"/>
         {chosen===id&&<span className="sf-correct-mark" aria-hidden="true">✓</span>}
        </button>)}
      </div>
      <div className="sf-feedback" aria-live="polite">
       {feedback==='correct'&&<span className="sf-good">✦ Harika!</span>}
       {feedback==='wrong'&&<span className="sf-retry">↻ Tekrar dene</span>}
      </div>
     </div>
     <div className="sf-game-footer">
       <span>🌿 {step+1}/{deck.questions.length}</span>
       <span className="sf-footer-label">Hikâyeyi Keşfet</span>
       <button type="button" onClick={hint} disabled={busy||stepLock.current}>? İpucu</button>
     </div>
     {saveError&&<div className="sf-save-error" role="alert">
       {saveError}
       <button type="button" disabled={busy} onClick={()=>{if(deck)void finish(deck,answers);}}>Tekrar kaydet</button>
     </div>}
     {busy&&<div className="sf-saving" role="status">Hikâye kaydediliyor…</div>}
    </main>
  </>}
  {view==='reward'&&<>
   <header className="sf-header">
     <button className="sf-round-button" type="button" onClick={stop} aria-label="Bölümlere dön">←</button>
     <div className="sf-brand">Hikâye tamamlandı</div>
     <span/>
   </header>
   <main className="sf-reward">
     <div className="sf-reward-art"><StoryForestScenery scene={activeEpisode.scene}/>
       <div className="sf-reward-symbol">📖</div></div>
     <span className="sf-eyebrow">HİKÂYE KEŞFİ TAMAMLANDI</span>
     <h1>{activeEpisode.title}</h1>
     <div className="sf-big-stars" aria-label={earnedStars+' yıldız'}>
      {Array.from({length:3},(_,i)=><span key={i} className={i<earnedStars?'sf-earned':''}>★</span>)}
     </div>
     <div className="sf-reward-actions">
      {episode<6&&<button type="button" className="sf-primary" onClick={()=>start((episode+1) as ForestEpisode)}>
       Sonraki hikâye →
      </button>}
      <button type="button" className="sf-secondary" onClick={stop}>Hikâyelere dön</button>
     </div>
   </main>
  </>}
 </div>;
}
