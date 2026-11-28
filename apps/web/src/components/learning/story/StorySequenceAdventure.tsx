
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
import {LearningMotion} from '@/components/learning/motion/LearningMotion';
import {StoryNarrationPanel,StorySceneGuide,storyDecisionFeedback} from './StorySceneStandard';
import {useQuestionFocus} from '@/components/learning/activities/useQuestionFocus';
import {StoryRewardLines,StoryRewardSummary} from './StoryRewardRecap';
import './story-sequence.css';
import './story-sequence-comprehension.css';
import './story-character-motion.css';
import './story-motion-guards.css';
import './story-scene-standard.css';
import {GameFinale} from '../GameFinale';
import {GameTopBar,GameStepRail,GameResult} from '../game/GameFrame';

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
 const [loadAttempt,setLoadAttempt]=useState(0);
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
 /**
  * Mistakes and hints made before "↻ Dinle" restarts the watch phase.
  * Re-listening is a supported scaffold, but it must not erase evidence:
  * a slot that was missed or hinted once is never re-saved as independent.
  */
 const carried=useRef<Record<number,{mistakes:number;hint:boolean}>>({});
 // A chosen card (or the "next scene" button) disappears with each step; keyboard
 // and screen-reader focus then moves to the new step instead of <body>.
 const stepFocus=useQuestionFocus<HTMLDivElement>(
  page==='order'?'order:'+slot:page==='check'?'check:'+checkIndex:page);
 const rewardHeading=useQuestionFocus<HTMLHeadingElement>(page==='reward'?'done':'play');
 // Gentle speaking-speed changes preserve natural prosody rather than
 // stretching short beginner words into synthetic slow motion.
 const voiceRate=Math.max(.87,Math.min(1.02,
  (englishLevel==='Pre-A1'?.89:englishLevel==='A1'?.95:.99)+
   (gradeLevel!==null&&gradeLevel<=2?-.015:
    gradeLevel!==null&&gradeLevel>=6?.015:0)));
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
 },[profileId,loadAttempt]);
 function narrate(frame:SequenceFrame){
  soundService.unlockAudio();
  setVoiceUnavailable(false);
  const started=soundService.speakEnglish(frame.narration[englishLevel],{
   rate:voiceRate,
   onError:()=>{if(alive.current){setVoiceUnavailable(true);setShowCaption(true);}}
  });
  if(!started){setVoiceUnavailable(true);setShowCaption(true);}
 }
 function start(id:ForestEpisode){
  if(loading||loadError||busy||saving.current||id>progress.completedLevels+1)return;
  clearNext();soundService.cancelSpeech();
  const seed=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;
  // Saved answers make each completed replay a different authored version
  // of the story and a different A1 "what happened next?" check.
  const next=planSequenceStory({episode:id,gradeLevel,englishLevel,seed,assessmentVersion:2,history});
  sessionId.current='seq:'+profileId+':'+id+':'+Date.now()+':'+Math.random().toString(36).slice(2);
  startedAt.current=Date.now();
  locked.current=false;saving.current=false;carried.current={};
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
   setPage('order');setVoiceUnavailable(false);
   soundService.cancelSpeech();
   // The initial guided playback is complete; now the child assembles it.
   soundService.speakEnglish('What happened first?',{rate:voiceRate});
   return;
  }
  const next=watchIndex+1;
  setWatchIndex(next);
  setVoiceUnavailable(false);
  soundService.playSfx('tap',.36);
  narrate(deck.frames[next]);
 }
 function replayNarration(){
  if(!deck)return;
  if(page==='watch'&&watchFrame)narrate(watchFrame);
  if(page==='order'){
   soundService.unlockAudio();
   soundService.speakEnglish(slot===0?'What happened first?':'What happened next?',{rate:voiceRate});
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
  // Saved slot answers already include earlier carried evidence.
  for(const answer of answers){
   if(answer.mistakes>0||answer.hintUsed)
    carried.current[answer.slot]={mistakes:answer.mistakes,hint:answer.hintUsed};
  }
  if(page==='order'&&!answers.some(answer=>answer.slot===slot)&&(mistakes>0||hintUsed)){
   const prior=carried.current[slot]??{mistakes:0,hint:false};
   carried.current[slot]={mistakes:prior.mistakes+mistakes,hint:prior.hint||hintUsed};
  }
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
   setMistakes(n=>n+1);setWrongId(id);setMessage(storyDecisionFeedback('retry'));
   soundService.playSfx('gentle_retry',.64);
   return;
  }
  locked.current=true;
  setWrongId(null);setHintFrame(null);setMessage('');
  soundService.playSfx('correct',.78);
  const prior=carried.current[slot];
  const slotMistakes=mistakes+(prior?.mistakes??0),slotHint=hintUsed||Boolean(prior?.hint);
  const answer:SequenceAnswer={
   frameId:id,slot,mistakes:slotMistakes,hintUsed:slotHint,
   firstTryCorrect:slotMistakes===0&&!slotHint,
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
   sequenceComprehensionPrompt(challenge.kind,englishLevel,currentDeck.episode),
   {rate:voiceRate,
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
  <GameTopBar island="story" onBack={back} backDisabled={busy}
   backLabel={page==='chapters'?'Oyunlar':'Hikâyeler'}
   backAriaLabel={page==='chapters'?'Hikâye Ormanı’na dön':'Hikâyelere dön'}
   crest="🧩" eyebrow={page==='chapters'?'Hikâye Ormanı':'Sonra Ne Oldu? · Hikâye '+episode}
   title={page==='chapters'?'Sonra Ne Oldu?':currentStory.title}
   chips={page==='chapters'?[(loading||loadError?'…':progress.completedLevels)+'/6 hikâye']:undefined}
   progress={page==='watch'&&deck?{current:watchIndex+1,total:deck.frames.length,label:'Sahne'}:
    page==='order'&&deck?{current:selectedIds.length,total:deck.frames.length,label:'Sıra'}:
    page==='check'&&deck?{current:checkIndex+1,total:deck.comprehensionChecks?.length??0,label:'Soru'}:undefined}
   stars={page==='reward'?{earned:earnedStars,total:3}:undefined}/>
  {(page==='watch'||page==='order'||page==='check')&&deck&&<GameStepRail island="story" className="ss-step-rail"
   ariaLabel="Oyunun adımları" steps={[
    {key:'watch',label:'İzle ve dinle',short:'İzle',state:page==='watch'?'current':'done'},
    {key:'order',label:'Resimleri sırala',short:'Sırala',state:page==='order'?'current':page==='watch'?'upcoming':'done'},
    ...((deck.comprehensionChecks?.length??0)>0?[{key:'check',label:'Anladığını göster',short:'Anla',
     state:page==='check'?'current' as const:'upcoming' as const}]:[])]}/>}
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
    <button type="button" className="gf-btn gf-btn--secondary" onClick={()=>setLoadAttempt(n=>n+1)}>↻ Tekrar dene</button>
    <button type="button" className="gf-btn gf-btn--secondary" onClick={onBack}>Geri</button>
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
        <span>{star?'★'.repeat(star):open?'Oyna':'Kilitli'}</span>
       </div>
      </button>;
     })}
    </section>}
  </main>}
  {page==='watch'&&deck&&watchFrame&&<main className="ss-main ss-story-content">
    <StorySceneGuide mode="watch" current={watchIndex+1} total={deck.frames.length}
     title={currentStory.title}/>
    <div className="ss-screen" aria-label="Hikâye resmi" ref={stepFocus} tabIndex={-1}>
     <StorySequenceFrame frame={watchFrame} scene={scene}
      characterMotion={watchFrame.action==='help'||watchFrame.action==='share'?'cheer':'listen'}/>
    </div>
    <StoryNarrationPanel text={watchFrame.narration[englishLevel]}
     showText={showCaption} voiceUnavailable={voiceUnavailable} disabled={busy}
     onListen={replayNarration} onToggleText={()=>setShowCaption(v=>!v)}
     classes={{root:'ss-narration',listen:'ss-speak',body:'ss-narration-body',
      label:'ss-narration-label',waves:'ss-audio-wave',toggle:'ss-text-toggle'}}/>
    <div className="ss-bottom-actions">
     <button type="button" className="gf-btn gf-btn--primary" onClick={watchNext}>
      {watchIndex+1===deck.frames.length?'Resimleri sırala →':'Sonraki sahne →'}
     </button>
    </div>
  </main>}
  {page==='order'&&deck&&<main className="ss-main ss-order-screen relative isolate">
    <LearningMotion variant="success"
     trigger={selectedIds.length>slot?'sequence-ordered-'+episode+'-'+slot:null}/>
    <StorySceneGuide mode="order" current={slot+1} total={deck.frames.length}
     title={currentStory.title}/>
    <StoryNarrationPanel text={slot===0?'What happened first?':'What happened next?'}
     showText={true} promptOnly voiceUnavailable={false} disabled={busy}
     onListen={replayNarration} classes={{root:'ss-instruction',
      listen:'ss-speak',body:'ss-order-instruction-body'}}/>
    <div className="ss-slots" aria-label="Hikâyenin tamamlanan sıralaması">
     {deck.frames.map((frame,i)=><div key={frame.id}
       className={'ss-slot '+(i===slot?'active':i<slot?'done':'')}>
       <span className="ss-slot-index">{i+1}</span>
       {selectedIds[i]?<StorySequenceFrame frame={frame} scene={scene}/>:i===slot?'?':'·'}
     </div>)}
    </div>
    <div className="ss-cards" role="group" aria-label="Olay resimlerini doğru sırayla seç"
     ref={stepFocus} tabIndex={-1}>
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
     <button type="button" className="ss-hint-button gf-btn gf-btn--tool" onClick={showHint}
       disabled={busy||locked.current||!nextFrame} aria-label="Doğru sıradaki resmi ışıkla göster">
       💡 İpucu
     </button>
     <div role="status" aria-live="polite" className={'ss-feedback '+(!message?'correct':'')}>
       {busy?'Kaydediliyor…':selectedIds.length>slot?storyDecisionFeedback('correct'):message||('✦ '+selectedIds.length+'/'+deck.frames.length)}
     </div>
     <button type="button" className="ss-hint-button gf-btn gf-btn--tool" onClick={restartWatch}
      disabled={busy} aria-label="Hikâyeyi yeniden dinle">↻ Dinle</button>
    </div>
    {saveError&&<div role="alert" className="ss-save-error">{saveError}
     <button type="button" onClick={()=>{if(deck)void finish(deck,answers);}}
       disabled={busy} className="gf-btn gf-btn--secondary">Yeniden kaydet</button>
    </div>}
  </main>}
  {page==='check'&&deck&&activeCheck&&<main className="ss-main ss-comprehension relative isolate"
   aria-label="Dinlediğini anlama görevi">
   <LearningMotion variant="discovery"
    trigger={checks.length>checkIndex?'sequence-understood-'+episode+'-'+checkIndex:null}/>
   <StorySceneGuide mode="remember" current={checkIndex+1}
     total={deck.comprehensionChecks?.length??1} title={currentStory.title}/>
    <div className="ss-check-heading">
    <span>🧠 {englishLevel==='A2'?'Hikâyeyi Yorumla':'Sonra Ne Oldu?'}</span>
    <strong>{activeCheck.kind==='next'?'Bir Sonraki Olay':
      activeCheck.kind==='cause'?'Neden Oldu?':'Nasıl Bitti?'}</strong>
   </div>
   <StoryNarrationPanel text={sequenceComprehensionPrompt(activeCheck.kind,englishLevel,deck.episode)}
    showText={true} voiceUnavailable={false} promptOnly disabled={busy}
    onListen={()=>sayCheck(deck,checkIndex)}
    classes={{root:'ss-check-audio',listen:'ss-speak',body:'ss-check-body'}}/>
   <div className="ss-check-reference" aria-label="Hatırlanacak hikâye sahnesi">
    {deck.frames.find(frame=>frame.id===activeCheck.referenceFrameId)&&
     <StorySequenceFrame
      frame={deck.frames.find(frame=>frame.id===activeCheck.referenceFrameId)!}
      scene={scene}/>}
   </div>
   <div className="ss-check-cards" role="group" aria-label="Resimlerden doğru olayı seç"
    ref={stepFocus} tabIndex={-1}>
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
    <button type="button" className="ss-hint-button gf-btn gf-btn--tool" disabled={busy||locked.current}
     onClick={()=>{setCheckHint(true);soundService.playSfx('tap',.36);}}>
     💡 İpucu
    </button>
    <span role="status" aria-live="polite" className="ss-feedback">
     {checkWrong?storyDecisionFeedback('retry'):'✦ '+(checkIndex+1)+' / '+(deck.comprehensionChecks?.length??0)}
    </span>
   </div>
   {saveError&&<div className="ss-save-error" role="alert">{saveError}
    <button type="button" onClick={()=>void finish(deck,answers,checks)}
     disabled={busy} className="gf-btn gf-btn--secondary">Yeniden kaydet</button></div>}
  </main>}
  {page==='reward'&&<main className="ss-main ss-reward">
    <GameResult island="story" className="ss-result" kicker="Hikâye tamamlandı"
     title={currentStory.title} titleRef={rewardHeading} stars={{earned:earnedStars}}
     art={<div className="ss-reward-visual relative isolate">
      <LearningMotion variant="victory" trigger={'sequence-saved-'+episode}/>
      <StorySequenceFrame frame={currentStory.frames[4]} scene={scene}
       characterMotion="cheer"/>
     </div>}
     actions={<>
       {episode<6&&<button type="button" className="gf-btn gf-btn--primary"
         onClick={()=>start((episode+1) as ForestEpisode)}>Yeni hikâye →</button>}
       <button type="button" className={'gf-btn '+(episode<6?'gf-btn--secondary':'gf-btn--primary')} onClick={()=>start(episode)}>↻ Tekrar Oyna</button>
       <button type="button" className="gf-btn gf-btn--secondary" onClick={back}>Hikâyelere dön</button>
     </>}>
     <StoryRewardSummary stars={earnedStars}
      mistakes={answers.reduce((n,a)=>n+a.mistakes,0)+checks.reduce((n,c)=>n+c.mistakes,0)}
      hints={answers.filter(a=>a.hintUsed).length+checks.filter(c=>c.hintUsed).length}/>
     {episode===6&&<GameFinale title="Bütün hikâyeleri sıraladın!"
      detail="Altı hikâyenin hepsinde olayları doğru sıraya koydun."/>}
    </GameResult>
    <StoryRewardLines rate={voiceRate}
     lines={deck?deck.frames.map(frame=>frame.narration[deck.englishLevel]):[]}/>
  </main>}
 </div>;
}
