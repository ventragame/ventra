
'use client';
import React,{useEffect,useRef,useState} from 'react';
import type {ForestEpisode,ForestPlacement} from '@/lib/learning/storyForestEngine';
import {
 SEQUENCE_STORIES,planSequenceStory,sequenceStars,
 sequenceComprehensionPrompt,
 type SequenceDeck,type SequenceAnswer,type SequenceFrame,
 type SequenceComprehensionAnswer
} from '@/lib/learning/storySequenceEngine';
import {getSequenceProgress,saveSequenceStory,type SequenceProgress}
 from '@/lib/progress/storySequenceProgress';
import {getProgressRepository} from '@/lib/progress';
import {soundService} from '@/lib/audio/SoundService';
import {StorySequenceFrame} from './StorySequenceFrame';
import './story-sequence.css';
import './story-sequence-comprehension.css';

interface Props{
 profileId:string;
 gradeLevel:number|null;
 englishLevel:ForestPlacement;
 onBack:()=>void;
 onSaved:()=>void;
}
type Page='chapters'|'watch'|'order'|'check'|'reward';
const EMPTY:SequenceProgress={completedLevels:0,totalLevels:6,starsByLevel:{}};

/** Watch a coherent five-beat illustrated narrative first, then tap images in
 * chronological order. No written word matching, invisible hotspots or dragging
 * required; "tap to fill next slot" is consistent on phones and WebViews.
 */
export function StorySequenceAdventure({profileId,gradeLevel,englishLevel,onBack,onSaved}:Props){
 const [page,setPage]=useState<Page>('chapters');
 const [progress,setProgress]=useState<SequenceProgress>(EMPTY);
 const [history,setHistory]=useState<SequenceAnswer[]>([]);
 const [loading,setLoading]=useState(true);
 const [loadError,setLoadError]=useState('');
 const [deck,setDeck]=useState<SequenceDeck|null>(null);
 const [episode,setEpisode]=useState<ForestEpisode>(1);
 const [watchIndex,setWatchIndex]=useState(0);
 const [slot,setSlot]=useState(0);
 const [selectedIds,setSelectedIds]=useState<string[]>([]);
 const [answers,setAnswers]=useState<SequenceAnswer[]>([]);
 const [checks,setChecks]=useState<SequenceComprehensionAnswer[]>([]);
 const [checkIndex,setCheckIndex]=useState(0);
 const [checkMistakes,setCheckMistakes]=useState(0);
 const [checkHint,setCheckHint]=useState(false);
 const [checkWrong,setCheckWrong]=useState<string|null>(null);
 const [mistakes,setMistakes]=useState(0);
 const [hintUsed,setHintUsed]=useState(false);
 const [hintFrame,setHintFrame]=useState<string|null>(null);
 const [wrongId,setWrongId]=useState<string|null>(null);
 const [message,setMessage]=useState('');
 const [showCaption,setShowCaption]=useState(false);
 const [voiceUnavailable,setVoiceUnavailable]=useState(false);
 const [saveError,setSaveError]=useState('');
 const [busy,setBusy]=useState(false);
 const [earnedStars,setEarnedStars]=useState(0);
 const sessionId=useRef('');
 const startedAt=useRef(0);
 const locked=useRef(false);
 const saving=useRef(false);
 const alive=useRef(true);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const currentStory=SEQUENCE_STORIES[episode-1];
 const watchFrame=deck?.frames[watchIndex];
 const nextFrame=deck?.frames[slot];
 const activeCheck=deck?.comprehensionChecks?.[checkIndex]??null;
 function clearNext(){if(timer.current!==null){clearTimeout(timer.current);timer.current=null;}}
 useEffect(()=>{
  alive.current=true;let active=true;
  setLoading(true);setLoadError('');
  Promise.all([
   getSequenceProgress(getProgressRepository(),profileId),
   getProgressRepository().getSequenceAnswerHistory(profileId)
  ]).then(([p,h])=>{
   if(!active)return;
   setProgress(p);setHistory(h);setLoading(false);
  }).catch(error=>{
   console.error('[StorySequence] failed to load progress',error);
   if(active){setLoadError('İlerleme yüklenemedi.');setLoading(false);}
  });
  return()=>{active=false;alive.current=false;clearNext();soundService.cancelSpeech();};
 },[profileId]);
 function narrate(frame:SequenceFrame){
  soundService.unlockAudio();
  setVoiceUnavailable(false);
  const started=soundService.speakEnglish(frame.narration[englishLevel],{
   rate:englishLevel==='Pre-A1'?.81:.9,
   onError:()=>{if(alive.current){setVoiceUnavailable(true);setShowCaption(true);}}
  });
  if(!started){setVoiceUnavailable(true);setShowCaption(true);}
 }
 function start(id:ForestEpisode){
  if(loading||loadError||busy||saving.current||id>progress.completedLevels+1)return;
  clearNext();soundService.cancelSpeech();
  const seed=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;
  const next=planSequenceStory({episode:id,gradeLevel,englishLevel,seed,assessmentVersion:2});
  sessionId.current='seq:'+profileId+':'+id+':'+Date.now()+':'+Math.random().toString(36).slice(2);
  startedAt.current=Date.now();
  locked.current=false;saving.current=false;
  setEpisode(id);setDeck(next);setWatchIndex(0);setSlot(0);
  setSelectedIds([]);setAnswers([]);setChecks([]);setCheckIndex(0);
  setCheckMistakes(0);setCheckHint(false);setCheckWrong(null);
  setMistakes(0);setHintUsed(false);setHintFrame(null);
  setWrongId(null);setMessage('');setShowCaption(false);setVoiceUnavailable(false);
  setSaveError('');setEarnedStars(0);setPage('watch');
  soundService.playSfx('whoosh',.6);
  narrate(next.frames[0]);
 }
 function back(){
  if(saving.current)return;
  clearNext();soundService.cancelSpeech();locked.current=false;
  if(page==='chapters'){onBack();return;}
  setPage('chapters');setDeck(null);setSaveError('');
 }
 function watchNext(){
  if(!deck||page!=='watch')return;
  if(watchIndex===deck.frames.length-1){
   setPage('order');setShowCaption(false);setVoiceUnavailable(false);
   soundService.cancelSpeech();
   // The initial guided playback is complete; now the child assembles it.
   soundService.speakEnglish('What happened first?',{rate:.87});
   return;
  }
  const next=watchIndex+1;
  setWatchIndex(next);setShowCaption(false);
  setVoiceUnavailable(false);
  soundService.playSfx('tap',.36);
  narrate(deck.frames[next]);
 }
 function replayNarration(){
  if(!deck)return;
  if(page==='watch'&&watchFrame)narrate(watchFrame);
  if(page==='order'){
   soundService.unlockAudio();
   soundService.speakEnglish('What happened next?',{rate:.84});
  }
 }
 function showHint(){
  if(!nextFrame||locked.current||busy)return;
  soundService.playSfx('tap',.4);
  setHintUsed(true);setHintFrame(nextFrame.id);
  setMessage('Parlayan resmi seç.');
 }
 function restartWatch(){
  if(!deck||busy)return;
  // Listening again is a supported comprehension scaffold, not a reward.
  clearNext();soundService.cancelSpeech();locked.current=false;
  setWatchIndex(0);setSlot(0);setSelectedIds([]);setAnswers([]);
  setMistakes(0);setHintUsed(false);setHintFrame(null);setWrongId(null);
  setMessage('');setSaveError('');setPage('watch');setShowCaption(false);
  narrate(deck.frames[0]);
 }
 function selectFrame(id:string){
  if(!deck||page!=='order'||locked.current||busy||saveError||selectedIds.includes(id))return;
  const expected=deck.frames[slot];
  if(!expected)return;
  if(id!==expected.id){
   setMistakes(n=>n+1);setWrongId(id);setMessage('Başka bir resim dene.');
   soundService.playSfx('gentle_retry',.64);
   return;
  }
  locked.current=true;
  setWrongId(null);setHintFrame(null);setMessage('');
  soundService.playSfx('correct',.78);
  const answer:SequenceAnswer={
   frameId:id,slot,mistakes,hintUsed,firstTryCorrect:mistakes===0&&!hintUsed,
   placement:englishLevel,timestamp:new Date().toISOString()
  };
  const completed=[...answers,answer],ordered=[...selectedIds,id];
  setSelectedIds(ordered);setAnswers(completed);
  const last=slot+1===deck.frames.length;
  timer.current=setTimeout(()=>{
   timer.current=null;
   if(!alive.current)return;
   if(last){
    if(deck.comprehensionChecks?.length){beginCheck(deck,0);return;}
    void finish(deck,completed);return;
   }
   locked.current=false;
   setSlot(s=>s+1);setMistakes(0);setHintUsed(false);setHintFrame(null);
  },last?1150:430);
 }
 function sayCheck(currentDeck:SequenceDeck,index:number){
  const challenge=currentDeck.comprehensionChecks?.[index];if(!challenge)return;
  soundService.unlockAudio();soundService.speakEnglish(
   sequenceComprehensionPrompt(challenge.kind,englishLevel),
   {rate:englishLevel==='A2'?.96:.9,
    onError:()=>{if(alive.current)setVoiceUnavailable(true);}
   });
 }
 function beginCheck(currentDeck:SequenceDeck,index:number){
  locked.current=false;setCheckIndex(index);setCheckMistakes(0);
  setCheckHint(false);setCheckWrong(null);setMessage('');
  setPage('check');sayCheck(currentDeck,index);
 }
 function selectCheck(id:string){
  if(!deck||page!=='check'||!activeCheck||locked.current||busy||saveError)return;
  if(!activeCheck.choiceIds.includes(id))return;
  if(id!==activeCheck.targetFrameId){
   setCheckMistakes(n=>n+1);setCheckWrong(id);
   soundService.playSfx('gentle_retry',.62);return;
  }
  locked.current=true;setCheckWrong(null);
  soundService.cancelSpeech();soundService.playSfx('correct',.78);
  const answer:SequenceComprehensionAnswer={
   checkId:activeCheck.id,selectedId:id,mistakes:checkMistakes,
   hintUsed:checkHint,firstTryCorrect:checkMistakes===0&&!checkHint
  };
  const finishedChecks=[...checks,answer];
  setChecks(finishedChecks);
  const final=checkIndex+1===(deck.comprehensionChecks?.length??0);
  timer.current=setTimeout(()=>{
   timer.current=null;if(!alive.current)return;
   if(final){void finish(deck,answers,finishedChecks);return;}
   beginCheck(deck,checkIndex+1);
  },700);
 }
 async function finish(completedDeck:SequenceDeck,completed:SequenceAnswer[],
  completedChecks:SequenceComprehensionAnswer[]=checks){
  if(saving.current)return;
  saving.current=true;setBusy(true);setSaveError('');
  try{
   const saved=await saveSequenceStory({
    repo:getProgressRepository(),profileId,episode:completedDeck.episode,
    deck:completedDeck,answers:completed,comprehensionAnswers:completedChecks,
    sessionId:sessionId.current,
    durationSeconds:(Date.now()-startedAt.current)/1000
   });
   if(!alive.current)return;
   setProgress(saved);setHistory(current=>[...current,...completed]);
   const assessmentMistakes=[...completed,...completedChecks]
    .reduce((sum,a)=>sum+a.mistakes,0);
   const assessmentHints=[...completed,...completedChecks].filter(a=>a.hintUsed).length;
   setEarnedStars(completedDeck.assessmentVersion===2?
    assessmentMistakes===0&&assessmentHints===0?3:
    assessmentMistakes<=2&&assessmentHints<=1?2:1:
    sequenceStars(completed));setPage('reward');
   soundService.playSfx('fanfare',.85);
   onSaved();
  }catch(error){
   console.error('[StorySequence] failed to save',error);
   if(alive.current)setSaveError('Kayıt yapılamadı. Tekrar dene.');
  }finally{
   saving.current=false;
   if(alive.current)setBusy(false);
  }
 }
 const scene=currentStory.scene;
 const previewFrame=currentStory.frames[0];
 return <div className="ss-root" role="dialog" aria-modal="true" aria-label="Sonra Ne Oldu?">
  <header className="ss-head">
   <div className="ss-head-side">
    <button type="button" className="ss-round" onClick={back} disabled={busy} aria-label="Geri dön">←</button>
    <h1>{page==='chapters'?'Sonra Ne Oldu?':currentStory.title}</h1>
   </div>
   <div className="ss-count" aria-label="Oyun ilerlemesi">
    {page==='chapters'?('★ '+progress.completedLevels+'/6'):
     page==='watch'&&deck?('📖 '+(watchIndex+1)+'/'+deck.frames.length):
     page==='order'&&deck?('✦ '+selectedIds.length+'/'+deck.frames.length):
     page==='check'&&deck?('🧠 '+(checkIndex+1)+'/'+(deck.comprehensionChecks?.length??0)):'★'}
   </div>
  </header>
  {page==='chapters'&&<main className="ss-main">
   <div className="ss-intro">
    <StorySequenceFrame frame={previewFrame} scene={scene}/>
    <div className="ss-intro-copy">
      <span>HİKÂYE ORMANI · OYUN 2</span><strong>Sonra Ne Oldu?</strong>
      <p>Dinle, hatırla, resimleri sırala.</p>
    </div>
   </div>
   {loading&&<div className="ss-status" role="status">Hikâyeler hazırlanıyor…</div>}
   {loadError&&<div className="ss-status" role="alert">{loadError}
    <button type="button" className="ss-secondary" onClick={onBack}>Geri</button>
   </div>}
   {!loading&&!loadError&&<section className="ss-episodes" aria-label="Altı sıralama hikâyesi">
     {SEQUENCE_STORIES.map(story=>{
      const open=story.episode<=progress.completedLevels+1;
      const star=progress.starsByLevel[story.episode]||0;
      return <button type="button" className="ss-episode" key={story.episode}
       disabled={!open} onClick={()=>start(story.episode)}
       aria-label={story.title+(open?'':' kilitli')}>
       <div className="ss-episode-image">
        <StorySequenceFrame frame={story.frames[0]} scene={story.scene}/>
        {!open&&<span className="ss-episode-lock" aria-hidden="true">🔒</span>}
       </div>
       <div className="ss-episode-bottom">
        <strong>{story.episode}. {story.title}</strong>
        <span>{star?'★'.repeat(star):open?'Oyna':'Yakında'}</span>
       </div>
      </button>;
     })}
    </section>}
  </main>}
  {page==='watch'&&deck&&watchFrame&&<main className="ss-main ss-story-content">
    <div className="ss-story-top" aria-label="Hikâyeyi sırayla izle">
      {deck.frames.map((frame,i)=><span key={frame.id}
        className={'ss-pip '+(i<watchIndex?'done':i===watchIndex?'active':'')}/>)}
    </div>
    <div className="ss-screen" aria-label="Hikâye resmi">
     <StorySequenceFrame frame={watchFrame} scene={scene}/>
    </div>
    <div className="ss-narration">
     <button type="button" className="ss-speak" onClick={replayNarration}
      aria-label="Bu sahneyi tekrar dinle">🔊</button>
     <div className="ss-narration-body">
      <span className="ss-narration-label">{voiceUnavailable?'SES YOK · OKUYABİLİRSİN':'DİNLE VE İZLE'}</span>
      {showCaption||voiceUnavailable?
       <p lang="en">{watchFrame.narration[englishLevel]}</p>:
       <span className="ss-audio-wave" aria-hidden="true">▂ ▅ ▃ ▆ ▃ ▅ ▂</span>}
     </div>
     <button type="button" className="ss-text-toggle" onClick={()=>setShowCaption(s=>!s)}
      aria-label="İngilizce metni göster veya gizle">Aa</button>
    </div>
    <div className="ss-bottom-actions">
     <button type="button" className="ss-primary" onClick={watchNext}>
      {watchIndex+1===deck.frames.length?'Resimleri sırala →':'Sonraki sahne →'}
     </button>
    </div>
  </main>}
  {page==='order'&&deck&&<main className="ss-main ss-order-screen">
    <div className="ss-instruction">
      <button type="button" onClick={replayNarration} aria-label="Sesli ipucunu tekrarla">🔊</button>
      <span>Hikâyede önce ne oldu?</span>
    </div>
    <div className="ss-slots" aria-label="Hikâyenin tamamlanan sıralaması">
     {deck.frames.map((frame,i)=><div key={frame.id}
       className={'ss-slot '+(i===slot?'active':i<slot?'done':'')}>
       <span className="ss-slot-index">{i+1}</span>
       {selectedIds[i]?<StorySequenceFrame frame={frame} scene={scene}/>:i===slot?'?':'·'}
     </div>)}
    </div>
    <div className="ss-cards" role="group" aria-label="Olay resimlerini doğru sırayla seç">
     {deck.shuffledIds.filter(id=>!selectedIds.includes(id)).map(id=>{
      const frame=deck.frames.find(f=>f.id===id);
      if(!frame)return null;
      return <button type="button" className={'ss-card '+
       (wrongId===id?'wrong ':'')+(hintFrame===id?'hint ':'')}
       key={id} onClick={()=>selectFrame(id)}
       aria-label={frame.narration[englishLevel]} disabled={busy||locked.current}>
       <StorySequenceFrame frame={frame} scene={scene}/>
      </button>;
     })}
    </div>
    <div className="ss-hint-bar">
     <button type="button" className="ss-hint-button" onClick={showHint}
       disabled={busy||locked.current||!nextFrame} aria-label="Doğru sıradaki resmi ışıkla göster">
       💡 İpucu
     </button>
     <div role="status" aria-live="polite" className={'ss-feedback '+(!message?'correct':'')}>
       {busy?'Kaydediliyor…':message||('✦ '+selectedIds.length+'/'+deck.frames.length)}
     </div>
     <button type="button" className="ss-hint-button" onClick={restartWatch}
      disabled={busy} aria-label="Hikâyeyi yeniden dinle">↻ Dinle</button>
    </div>
    {saveError&&<div role="alert" className="ss-save-error">{saveError}
     <button type="button" onClick={()=>{if(deck)void finish(deck,answers);}}
       disabled={busy} className="ss-secondary">Yeniden kaydet</button>
    </div>}
  </main>}
  {page==='check'&&deck&&activeCheck&&<main className="ss-main ss-comprehension"
   aria-label="Dinlediğini anlama görevi">
   <div className="ss-check-heading">
    <span>🧠 {englishLevel==='A2'?'Hikâyeyi Yorumla':'Sonra Ne Oldu?'}</span>
    <strong>{activeCheck.kind==='next'?'Bir Sonraki Olay':
      activeCheck.kind==='cause'?'Neden Oldu?':'Nasıl Bitti?'}</strong>
   </div>
   <div className="ss-check-audio">
    <button type="button" className="ss-speak" aria-label="Soruyu tekrar dinle"
     onClick={()=>sayCheck(deck,checkIndex)}>🔊</button>
    <p lang="en">{sequenceComprehensionPrompt(activeCheck.kind,englishLevel)}</p>
   </div>
   <div className="ss-check-reference" aria-label="Hatırlanacak hikâye sahnesi">
    {deck.frames.find(frame=>frame.id===activeCheck.referenceFrameId)&&
     <StorySequenceFrame
      frame={deck.frames.find(frame=>frame.id===activeCheck.referenceFrameId)!}
      scene={scene}/>}
   </div>
   <div className="ss-check-cards" role="group" aria-label="Resimlerden doğru olayı seç">
    {activeCheck.choiceIds.map(id=>{
     const frame=deck.frames.find(f=>f.id===id);if(!frame)return null;
     return <button type="button" key={id} className={'ss-check-card '+
      (checkWrong===id?'wrong ':'')+
      (checkHint&&id===activeCheck.targetFrameId?'hint ':'')}
      onClick={()=>selectCheck(id)} disabled={busy||locked.current||!!saveError}
      aria-label={frame.narration[englishLevel]}>
      <StorySequenceFrame frame={frame} scene={scene}/>
     </button>;
    })}
   </div>
   <div className="ss-hint-bar">
    <button type="button" className="ss-hint-button" disabled={busy||locked.current}
     onClick={()=>{setCheckHint(true);soundService.playSfx('tap',.36);}}>
     💡 İpucu
    </button>
    <span role="status" aria-live="polite" className="ss-feedback">
     {checkWrong?'↻ Tekrar dene':'✦ '+(checkIndex+1)+' / '+(deck.comprehensionChecks?.length??0)}
    </span>
   </div>
   {saveError&&<div className="ss-save-error" role="alert">{saveError}
    <button type="button" onClick={()=>void finish(deck,answers,checks)}
     disabled={busy} className="ss-secondary">Yeniden kaydet</button></div>}
  </main>}
  {page==='reward'&&<main className="ss-main ss-reward">
     <div className="ss-reward-visual">
      <StorySequenceFrame frame={currentStory.frames[4]} scene={scene}/>
     </div>
     <p>HİKÂYE TAMAMLANDI</p>
     <h2>{currentStory.title}</h2>
     <div className="ss-reward-stars" aria-label={earnedStars+' yıldız'}>
       {[1,2,3].map(i=><span key={i} className={earnedStars>=i?'earned':''}>★</span>)}
     </div>
     <div className="ss-bottom-actions">
       {episode<6&&<button type="button" className="ss-primary"
         onClick={()=>start((episode+1) as ForestEpisode)}>Yeni hikâye →</button>}
       <button type="button" className="ss-secondary" onClick={back}>Hikâyelere dön</button>
     </div>
  </main>}
 </div>;
}
