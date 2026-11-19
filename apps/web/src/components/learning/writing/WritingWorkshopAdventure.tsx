'use client';

import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import type {GameCompletedPayload,WritingAnswerEvidence} from '@ventra/shared';
import {getProgressRepository} from '@/lib/progress';
import {soundService} from '@/lib/audio/SoundService';
import {
 WORKSHOP_CHAPTERS,WRITING_WORKSHOP_GAME_ID,
 getWorkshopTasks,getLegacyWorkshopTasks,workshopTaskCount,isWorkshopAnswerCorrect,workshopTiles,workshopFeedback,
 type WorkshopLevel,type WorkshopTask
} from '@/lib/learning/writingWorkshopEngine';
import {
 readWorkshopCheckpoint,saveWorkshopCheckpoint,clearWorkshopCheckpoint
} from '@/lib/learning/writingWorkshopCheckpoint';
import {WritingDeskScene} from './WritingDeskScene';
import {nextWorkshopHintStage,workshopHint} from '@/lib/learning/writingWorkshopGuidance';
import './writing-workshop.css';

type Phase='map'|'playing'|'complete';
type Props={
 profileId:string;englishLevel:WorkshopLevel;gradeLevel:number|null;
 onBack:()=>void;onSaved:()=>void;
};
type Score={stars:1|2|3;accuracy:number;independent:number;typed:number};
export function WritingWorkshopAdventure({profileId,englishLevel,gradeLevel,onBack,onSaved}:Props){
 const [phase,setPhase]=useState<Phase>('map');
 const [completed,setCompleted]=useState(0);
 const [starMap,setStarMap]=useState<Record<number,number>>({});
 const [playCounts,setPlayCounts]=useState<Record<number,number>>({});
 const [playIndex,setPlayIndex]=useState(0);
 const [deck,setDeck]=useState<readonly WorkshopTask[]>(()=>getWorkshopTasks(1,englishLevel,gradeLevel,0));
 const [chapter,setChapter]=useState(1);
 const [step,setStep]=useState(0);
 const [seed,setSeed]=useState(1);
 const [selected,setSelected]=useState<number[]>([]);
 const [input,setInput]=useState('');
 const [hintOnStep,setHintOnStep]=useState(false);
 const [wrongOnStep,setWrongOnStep]=useState(0);
 const [mistakes,setMistakes]=useState(0);
 const [hints,setHints]=useState(0);
 const [independent,setIndependent]=useState(0);
 const [typedIndependent,setTypedIndependent]=useState(0);
 const [answers,setAnswers]=useState<WritingAnswerEvidence[]>([]);
 const [message,setMessage]=useState('');
 const [resolved,setResolved]=useState(false);
 const [saving,setSaving]=useState(false);
 const [saveError,setSaveError]=useState('');
 const [loading,setLoading]=useState(true);
 const [score,setScore]=useState<Score|null>(null);
 const [creative,setCreative]=useState('');
 const [exampleVisible,setExampleVisible]=useState(false);
 const [helpStage,setHelpStage]=useState(0);
 const [typingFocused,setTypingFocused]=useState(false);
 const [keyboardInset,setKeyboardInset]=useState(0);
 const inputRef=useRef<HTMLTextAreaElement|null>(null);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const session=useRef<string|null>(null);
 const locked=useRef(false);
 const started=useRef(Date.now());
 const current=WORKSHOP_CHAPTERS[chapter-1];
 const task=deck[Math.min(step,deck.length-1)];
 const tiles=useMemo(()=>workshopTiles(task,seed+step*17),[task,seed,step]);
 const tileById=useMemo(()=>new Map(tiles.map(tile=>[tile.key,tile.value])),[tiles]);
 const built=selected.map(index=>tileById.get(index)??'');
 const currentResponse=task.mode==='write'?input:
  task.mode==='spell'?built.join(''):built.join(' ');
 const wordCount=task.target.trim().split(/\s+/).length;
 const act=Math.min(2,Math.floor(step*3/deck.length));
 const acts=['1 · Keşfet','2 · Deneyerek Yaz','3 · Kendi Başına'];
 const activeHelp=helpStage?workshopHint(task,helpStage as 1|2|3):null;
 const keyboardOpen=typingFocused&&keyboardInset>100;

 const refresh=useCallback(async()=>{
  const levels=await getProgressRepository().getAllLevelProgress(WRITING_WORKSHOP_GAME_ID,profileId);
  const stars:Record<number,number>={},runs:Record<number,number>={};
  let count=0;
  for(let i=1;i<=WORKSHOP_CHAPTERS.length;i++){
   const row=levels[i];
   if(row?.completedCount&&count===i-1)count++;
   stars[i]=Math.max(0,Math.min(3,row?.bestStars??0));
   runs[i]=Math.max(0,row?.completedCount??0);
  }
  setCompleted(count);setStarMap(stars);setPlayCounts(runs);
 },[profileId]);

 useEffect(()=>{
  let active=true;
  setLoading(true);
  void refresh().catch(()=>{if(active)setSaveError('İlerleme okunamadı. Bağlantıyı kontrol edip tekrar dene.');})
    .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[refresh]);

 const stop=useCallback(()=>{
  if(timer.current)clearTimeout(timer.current);
  soundService.cancelSpeech();timer.current=null;
 },[]);
 useEffect(()=>()=>{
  stop();
 },[stop]);
 useEffect(()=>{
  const handle=()=>{if(document.hidden)soundService.cancelSpeech();};
  document.addEventListener('visibilitychange',handle);
  return()=>document.removeEventListener('visibilitychange',handle);
 },[]);

 useEffect(()=>{
  if(phase!=='playing'||task.mode!=='write')return;
  const viewport=window.visualViewport;
  if(!viewport)return;
  let frame=0;
  const sync=()=>{
   const covered=Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop);
   setKeyboardInset(covered>100?Math.min(520,Math.ceil(covered)):0);
   if(document.activeElement===inputRef.current){
    window.cancelAnimationFrame(frame);
    frame=window.requestAnimationFrame(()=>inputRef.current?.scrollIntoView({block:'nearest',behavior:'auto'}));
   }
  };
  sync();
  viewport.addEventListener('resize',sync);
  viewport.addEventListener('scroll',sync);
  return()=>{viewport.removeEventListener('resize',sync);viewport.removeEventListener('scroll',sync);window.cancelAnimationFrame(frame);};
 },[phase,task.mode,step]);
 
 const enter=(id:number)=>{
  if(id>completed+1||saving||loading)return;
  stop();locked.current=false;
  const saved=readWorkshopCheckpoint(profileId,englishLevel,id);
  // A resumed lesson keeps EXACTLY its original task IDs. Legacy checkpoints
  // with no replay metadata use the pre-upgrade (playIndex=0) lesson.
  const savedIndex=saved?.playIndex??0;
  const legacy=Boolean(saved&&(!saved.taskIds||saved.taskIds.length<=5));
  const resumeDeck=legacy?
   getLegacyWorkshopTasks(id,englishLevel,gradeLevel,savedIndex):
   getWorkshopTasks(id,englishLevel,gradeLevel,savedIndex);
  const matches=!saved?.taskIds||
   (saved.taskIds.length===resumeDeck.length&&
    saved.taskIds.every((taskId,i)=>resumeDeck[i].id===taskId));
  const valid=saved&&saved.step<resumeDeck.length&&matches?saved:null;
  const index=valid?savedIndex:(playCounts[id]??0);
  const planned=valid?resumeDeck:getWorkshopTasks(id,englishLevel,gradeLevel,index);
  setDeck(planned);setPlayIndex(index);
  setChapter(id);setStep(valid?.step??0);
  setMistakes(valid?.mistakes??0);setHints(valid?.hints??0);
  setIndependent(valid?.independent??0);setTypedIndependent(valid?.typedIndependent??0);
  setAnswers(valid?.answers??[]);
  setSelected([]);setInput('');setSeed(Math.floor(Date.now()/5000)%8192+id);
  setHintOnStep(false);setWrongOnStep(0);setResolved(false);
  setScore(null);setCreative('');setExampleVisible(false);setHelpStage(0);setTypingFocused(false);setKeyboardInset(0);
  setMessage('');setSaveError('');setPhase('playing');
  session.current=null;started.current=Date.now();
  soundService.unlockAudio();soundService.playSfx('tap',.6);
 };
 const back=()=>{
  stop();locked.current=false;
  setResolved(false);setMessage('');setSaveError('');setTypingFocused(false);setKeyboardInset(0);setPhase('map');
 };
 const exit=()=>{
  stop();onBack();
 };
 const speakModel=()=>{
  if(saving||resolved)return;
  soundService.unlockAudio();
  if(!hintOnStep){setHints(n=>n+1);setHintOnStep(true);}
  soundService.speakEnglish(task.target,{rate:gradeLevel!==null&&gradeLevel<=2?.78:.88});
 };
 const showHelp=()=>{
  if(saving||resolved)return;
  if(!hintOnStep){setHints(n=>n+1);setHintOnStep(true);}
  const stage=nextWorkshopHintStage(helpStage);
  setHelpStage(stage);
  if(stage===3)setExampleVisible(true);
  setMessage(stage===3?'Örneği incele; sonra yeniden dene.':'İpucunu kullanıp bir kez daha dene.');
 };
 const next=()=>{
  setStep(n=>n+1);setSelected([]);setInput('');
  setResolved(false);setHintOnStep(false);setWrongOnStep(0);
  setExampleVisible(false);setHelpStage(0);setTypingFocused(false);setKeyboardInset(0);
  setMessage('');locked.current=false;
 };
 const save=async(answerRows:WritingAnswerEvidence[],errors:number,helpCount:number,correctIndependent:number,typed:number)=>{
  setSaving(true);setSaveError('');
  const stars:1|2|3=errors===0&&helpCount===0?3:
   errors<=2&&helpCount<=2?2:1;
  const accuracy=correctIndependent/deck.length;
  const sessionId=session.current??crypto.randomUUID();
  session.current=sessionId;
  const payload:GameCompletedPayload={
   sessionId,profileId,gameId:WRITING_WORKSHOP_GAME_ID,levelId:chapter,
   outcomeId:'en.writing.workshop',
   success:true,starsEarned:stars,score:Math.round(100*accuracy),
   metrics:{
    durationSeconds:Math.max(1,Math.round((Date.now()-started.current)/1000)),
    attemptsCount:deck.length+errors,wrongAttempts:errors,hintsUsed:helpCount,
    accuracyRate:accuracy,
    writingAnswers:answerRows
   },completedAt:new Date().toISOString()
  };
  try{
   await getProgressRepository().recordGameCompleted(payload,profileId);
   clearWorkshopCheckpoint(profileId,englishLevel,chapter);
   setCompleted(old=>Math.max(old,chapter));
   setStarMap(old=>({...old,[chapter]:Math.max(stars,old[chapter]??0)}));
   setPlayCounts(old=>({...old,[chapter]:Math.max(old[chapter]??0,playIndex+1)}));
   setScore({stars,accuracy:Math.round(accuracy*100),independent:correctIndependent,typed});
   setPhase('complete');setMessage('Yazı defterine yeni bir sayfa ekledin!');
   soundService.playSfx('fanfare',.6);
   onSaved();
  }catch(err){
   console.error('[WritingWorkshop] completion',err);
   setSaveError('Yıldızların kaydedilemedi. Tekrar kaydet; ilerlemeni kaybetmemek için çıkma.');
   locked.current=true;
  }finally{setSaving(false);}
 };

 const submit=()=>{
  if(saving||resolved||locked.current)return;
  const response=currentResponse.trim();
  if(!response){setMessage(task.mode==='write'?'Önce İngilizce cevabını yaz.':'Önce harfleri veya kelimeleri yerleştir.');return;}
  if(!isWorkshopAnswerCorrect(task,response)){
   setMistakes(n=>n+1);setWrongOnStep(n=>n+1);
   setMessage(workshopFeedback(task,response));
   soundService.playSfx('gentle_retry',.45);return;
  }
  locked.current=true;setResolved(true);
  soundService.playSfx('correct',.6);
  const firstTry=wrongOnStep===0&&!hintOnStep;
  const typed=task.mode==='write'&&firstTry;
  const row:WritingAnswerEvidence={
   taskId:task.id,mode:task.mode,firstTryCorrect:firstTry,
   hintsUsed:hintOnStep?1:0,wrongAttempts:wrongOnStep,
   independentlyTyped:typed
  };
  const rows=[...answers,row];
  const indep=independent+Number(firstTry);
  const typedCount=typedIndependent+Number(typed);
  setAnswers(rows);setIndependent(indep);setTypedIndependent(typedCount);
  setMessage('Doğru yazdın! ✨');
  if(step+1<deck.length){
   saveWorkshopCheckpoint(profileId,englishLevel,chapter,{
    step:step+1,mistakes,hints,independent:indep,typedIndependent:typedCount,
    answers:rows,playIndex,taskIds:deck.map(item=>item.id)
   });
  }
  timer.current=setTimeout(()=>{
   if(step+1>=deck.length)void save(rows,mistakes,hints,indep,typedCount);
   else next();
  },900);
 };
 const removeTile=(key:number)=>{
  if(resolved||saving)return;
  setSelected(prev=>prev.filter(x=>x!==key));
 };
 const addTile=(key:number)=>{
  if(resolved||saving||selected.includes(key))return;
  setSelected(prev=>[...prev,key]);
  setMessage('');
 };
 const clearEntry=()=>{
  if(resolved||saving)return;
  setSelected([]);setInput('');setMessage('');
 };
 return <div className="writing-root" role="dialog" aria-modal="true" aria-label="Yazı Atölyesi"
  data-keyboard-open={keyboardOpen} style={{'--writing-keyboard-inset':keyboardInset+'px'} as React.CSSProperties}>
  <header className="writing-header">
   <button type="button" onClick={phase==='map'?exit:back} className="writing-back"
    aria-label={phase==='map'?'Adalara dön':'Bölüm haritasına dön'}>←</button>
   <div className="writing-brand"><small>VENTRA · İNGİLİZCE YAZMA</small><h1>Yazı Atölyesi</h1></div>
   <span className="writing-badge">⭐ {completed}/5</span>
  </header>
  <main className="writing-main">
   {phase==='map'?<div className="writing-map">
    <section className="writing-hero">
     <div className="writing-hero-copy">
      <span>✏️ KENDİ KELİMELERİNLE YAZ</span>
      <h2>Harflerin Büyüsü Başlıyor!</h2>
      <p>Kelimeleri kur, cümleleri tamamla, kendi notlarını yaz. Her bölümde yeni bir hikâye seni bekliyor.</p>
      <div className="writing-level-pill">{englishLevel} · {gradeLevel?gradeLevel+'. sınıf':'Sınıf seçilmedi'} · Her tur {workshopTaskCount(gradeLevel)} farklı yazma görevi</div>
     </div>
    </section>
    {saveError&&<p className="writing-alert" role="alert">{saveError}</p>}
    <section className="writing-chapters" aria-label="Yazı Atölyesi bölümleri">
     {WORKSHOP_CHAPTERS.map(ch=><button key={ch.id} type="button" className="writing-chapter"
      onClick={()=>enter(ch.id)} disabled={loading||saving||ch.id>completed+1}
      style={{'--chapter-accent':ch.color} as React.CSSProperties}>
      <span className="writing-chapter-icon">{ch.icon}</span>
      <span className="writing-chapter-index">BÖLÜM {String(ch.id).padStart(2,'0')}</span>
      <strong>{ch.title}</strong><small>{ch.subtitle}</small>
      <span className="writing-chapter-status">
       {ch.id<=completed?'↻ Yeniden oyna · '+'⭐'.repeat(starMap[ch.id]??1):
        ch.id===completed+1?'✦ Maceraya Gir':'🔒 Önceki Bölümü Bitir'}
      </span>
     </button>)}
    </section>
    <p className="writing-replay-note">🔄 Her turda {workshopTaskCount(gradeLevel)} görev, üç yazma becerisi ve yeni kelime-cümle eşleşmeleri. İlerlemen bölüm bölüm korunur.</p>
    <p className="writing-privacy">🛡️ Yazdığın serbest metin saklanmaz. Yalnızca öğrenme ilerlemen kaydedilir.</p>
   </div>:phase==='playing'?<div className="writing-play">
    <div className="writing-topline">
     <span>{current.icon} {current.title}</span>
     <span>{englishLevel} · {step+1}/{deck.length} · Tur {playIndex+1}</span>
    </div>
    <div className="writing-arc" aria-label="Yazı yolculuğunun aşamaları">
     {acts.map((label,i)=><span key={label} data-state={i<act?'done':i===act?'now':'later'}>
      {i<act?'✓ ':''}{label}</span>)}
    </div>
    <div className="writing-progress" role="progressbar" aria-label="Bölüm ilerlemesi"
     aria-valuemin={0} aria-valuemax={deck.length} aria-valuenow={step}>
     <span style={{width:(step/deck.length*100)+'%'}}/>
    </div>
    <section className="writing-desk" data-mode={task.mode}
     style={{'--chapter-accent':current.color} as React.CSSProperties}>
     <div className="writing-desk-top">
      <span className="writing-mode">{task.mode==='spell'?'🔤 Harfleri Diz':
       task.mode==='assemble'?'🧩 Cümleyi Kur':'✍️ Kendin Yaz'}</span>
      <span className="writing-stage">GÖREV {step+1} / {deck.length}</span>
     </div>
     <WritingDeskScene mode={task.mode}/>
     <h2>{task.promptTr}</h2>
     <p className="writing-task-caption">
      {task.mode==='spell'?'Harfleri seçerek İngilizce kelimeyi tamamla.':
       task.mode==='assemble'?'Kelimelere sırayla dokunarak anlamlı cümle oluştur.':
       'İngilizce cümleni klavyeden yaz. İhtiyacın olursa örneğe bakabilirsin.'}
     </p>
     <div className="writing-learning-tools">
      <button type="button" onClick={speakModel} disabled={saving||resolved}>🔊 Örneği dinle</button>
      <button type="button" onClick={showHelp} disabled={saving||resolved||helpStage===3}
        aria-label={'Aşamalı ipucu '+(helpStage===3?3:helpStage+1)+'/3'}>
       💡 {helpStage===3?'Tüm ipuçları açıldı':'İpucu '+(helpStage+1)+'/3'}
      </button>
     </div>
     {activeHelp&&<div className="writing-step-help" role="status" aria-live="polite">
      <strong>{activeHelp.title}</strong><span>{activeHelp.description}</span>
     </div>}
     {exampleVisible&&<p className="writing-example" lang="en">{task.target}</p>}
     {task.mode==='write'?<div className="writing-answer-area">
      <label htmlFor="workshop-typed-answer">Senin İngilizce yazın</label>
      <textarea ref={inputRef} id="workshop-typed-answer" lang="en" dir="ltr" spellCheck={false}
       autoComplete="off" autoCapitalize="off" autoCorrect="off"
       inputMode="text" enterKeyHint="done" aria-describedby="workshop-keyboard-guidance"
       value={input} maxLength={180} rows={wordCount>=9?3:2}
       placeholder={englishLevel==='Pre-A1'?'İngilizce kelimeyi yaz…':'İngilizce cümleni yaz…'}
       onChange={event=>{setInput(event.target.value);setMessage('');}}
       onFocus={()=>setTypingFocused(true)} onBlur={()=>setTypingFocused(false)}
       disabled={saving||resolved}/>
      <div className="writing-keyboard-guidance" id="workshop-keyboard-guidance">
       <span>İngilizce klavyeyle yaz · Otomatik düzeltme kapalı</span>
       {typingFocused&&<button type="button" onPointerDown={()=>inputRef.current?.blur()}
        onClick={()=>inputRef.current?.blur()}>Klavyeyi kapat</button>}
      </div>
     </div>:<>
      <div className="writing-paper" aria-label="Oluşturduğun İngilizce cevap" lang="en">
       {selected.length?selected.map(key=><button type="button" className="writing-written-tile"
        key={key} onClick={()=>removeTile(key)} disabled={saving||resolved}
        aria-label={(tileById.get(key)??'')+' harfini veya kelimesini geri al'}>
        {tileById.get(key)}</button>):
        <span className="writing-paper-placeholder">
         {task.mode==='spell'?'Harfleri buraya diz…':'Kelimeleri buraya diz…'}
        </span>}
      </div>
      <div className="writing-tiles" aria-label="Kullanılabilir harf ve kelimeler">
       {tiles.filter(tile=>!selected.includes(tile.key)).map(tile=>
        <button type="button" className="writing-tile" key={tile.key}
         onClick={()=>addTile(tile.key)} disabled={saving||resolved}
         lang="en">{tile.value}</button>)}
      </div>
     </>}
     <div className="writing-feedback" role="status" aria-live="polite">
      {message||(resolved?'Doğru yazdın!':'Kelimeleri düşün, acele etme.')}
     </div>
     {wrongOnStep>=2&&!resolved&&helpStage===0&&<p className="writing-guided-clue">
      💡 Bir ipucu alıp adım adım devam edebilirsin. Cevap hemen gösterilmez.
     </p>}
     <div className="writing-actions">
      <button className="writing-reset" type="button" disabled={saving||resolved}
       onClick={clearEntry}>↺ Yeniden Dene</button>
      <button className="writing-submit" type="button"
       onClick={submit} disabled={saving||resolved||!currentResponse.trim()}>
       {saving?'Kaydediliyor…':resolved?'✓ Başardın!':'Kontrol Et ✓'}
      </button>
     </div>
     {saveError&&<div className="writing-alert" role="alert">
      {saveError}<button type="button" onClick={()=>void save(answers,mistakes,hints,independent,typedIndependent)}
       disabled={saving}>Tekrar Kaydet</button>
     </div>}
    </section>
    <p className="writing-skill-note">Harf dizme ve cümle kurma, bağımsız yazı yazmaktan farklı becerilerdir. ✨</p>
   </div>:<section className="writing-finale">
    <span className="writing-final-icon" aria-hidden="true">📚</span>
    <h2>{current.title} Tamamlandı!</h2>
    <div className="writing-final-stars" role="img" aria-label={(score?.stars??1)+' yıldız'}>
     {'⭐'.repeat(score?.stars??1)}{'☆'.repeat(3-(score?.stars??1))}
    </div>
    <p>Yazı atölyendeki yeni sayfayı tamamladın.</p>
    <div className="writing-finale-stats">
     <span><strong>{deck.length}</strong> görev</span>
     <span><strong>{score?.independent??0}</strong> yardımsız doğru</span>
     <span><strong>{score?.typed??0}</strong> bağımsız yazı</span>
    </div>
    <div className="writing-creative">
     <label htmlFor="writing-creative-note">
      🌟 İstersen kendi İngilizce notunu yaz (puanlanmaz)
     </label>
     <textarea id="writing-creative-note" maxLength={160} rows={3}
      spellCheck={false} lang="en" dir="ltr" value={creative}
      placeholder={englishLevel==='Pre-A1'?'Hello, friend!':
       englishLevel==='A1'?'I like my friends and my school.':
        'Today I learned something new. I want to write about it.'}
      onChange={event=>setCreative(event.target.value)}/>
     <small>Bu not sadece şu ekranda görünür; kaydedilmez veya paylaşılmaz.</small>
    </div>
    <div className="writing-finale-buttons">
     {chapter<WORKSHOP_CHAPTERS.length&&<button type="button" onClick={()=>enter(chapter+1)}>
      Sonraki Bölüm →
     </button>}
     <button type="button" className="writing-secondary" onClick={back}>Bölüm Haritası</button>
    </div>
   </section>}
  </main>
 </div>;
}
