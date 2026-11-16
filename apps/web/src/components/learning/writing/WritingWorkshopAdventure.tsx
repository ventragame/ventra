'use client';

import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import type {GameCompletedPayload,WritingAnswerEvidence} from '@ventra/shared';
import {getProgressRepository} from '@/lib/progress';
import {soundService} from '@/lib/audio/SoundService';
import {
 WORKSHOP_CHAPTERS,WRITING_WORKSHOP_GAME_ID,
 getWorkshopTasks,isWorkshopAnswerCorrect,workshopTiles,workshopFeedback,
 type WorkshopLevel
} from '@/lib/learning/writingWorkshopEngine';
import {
 readWorkshopCheckpoint,saveWorkshopCheckpoint,clearWorkshopCheckpoint
} from '@/lib/learning/writingWorkshopCheckpoint';
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
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const session=useRef<string|null>(null);
 const locked=useRef(false);
 const started=useRef(Date.now());
 const current=WORKSHOP_CHAPTERS[chapter-1];
 const deck=getWorkshopTasks(chapter,englishLevel,gradeLevel);
 const task=deck[Math.min(step,deck.length-1)];
 const tiles=useMemo(()=>workshopTiles(task,seed+step*17),[task,seed,step]);
 const tileById=useMemo(()=>new Map(tiles.map(tile=>[tile.key,tile.value])),[tiles]);
 const built=selected.map(index=>tileById.get(index)??'');
 const currentResponse=task.mode==='write'?input:
  task.mode==='spell'?built.join(''):built.join(' ');
 const wordCount=task.target.trim().split(/\s+/).length;

 const refresh=useCallback(async()=>{
  const levels=await getProgressRepository().getAllLevelProgress(WRITING_WORKSHOP_GAME_ID,profileId);
  const stars:Record<number,number>={};let count=0;
  for(let i=1;i<=WORKSHOP_CHAPTERS.length;i++){
   const row=levels[i];
   if(row?.completedCount&&count===i-1)count++;
   stars[i]=Math.max(0,Math.min(3,row?.bestStars??0));
  }
  setCompleted(count);setStarMap(stars);
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

 const enter=(id:number)=>{
  if(id>completed+1||saving||loading)return;
  stop();locked.current=false;
  const saved=readWorkshopCheckpoint(profileId,englishLevel,id);
  const max=getWorkshopTasks(id,englishLevel,gradeLevel).length;
  const valid=saved&&saved.step<max?saved:null;
  setChapter(id);setStep(valid?.step??0);
  setMistakes(valid?.mistakes??0);setHints(valid?.hints??0);
  setIndependent(valid?.independent??0);setTypedIndependent(valid?.typedIndependent??0);
  setAnswers(valid?.answers??[]);
  setSelected([]);setInput('');setSeed(Math.floor(Date.now()/5000)%8192+id);
  setHintOnStep(false);setWrongOnStep(0);setResolved(false);
  setScore(null);setCreative('');setExampleVisible(false);
  setMessage('');setSaveError('');setPhase('playing');
  session.current=null;started.current=Date.now();
  soundService.unlockAudio();soundService.playSfx('tap',.6);
 };
 const back=()=>{
  stop();locked.current=false;
  setResolved(false);setMessage('');setSaveError('');setPhase('map');
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
 const showExample=()=>{
  if(saving||resolved)return;
  if(!hintOnStep){setHints(n=>n+1);setHintOnStep(true);}
  setExampleVisible(true);
  setMessage('Örneği incele; sonra kendi cevabını oluştur.');
 };
 const next=()=>{
  setStep(n=>n+1);setSelected([]);setInput('');
  setResolved(false);setHintOnStep(false);setWrongOnStep(0);
  setExampleVisible(false);setMessage('');locked.current=false;
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
  if(!response){setMessage('Önce harfleri veya kelimeleri yerleştir.');return;}
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
    step:step+1,mistakes,hints,independent:indep,typedIndependent:typedCount,answers:rows
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
 return <div className="writing-root" role="dialog" aria-modal="true" aria-label="Yazı Atölyesi">
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
      <div className="writing-level-pill">{englishLevel} · {gradeLevel?gradeLevel+'. sınıf':'Sınıf seçilmedi'} · Dokunarak veya yazarak</div>
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
       {ch.id<=completed?'⭐'.repeat(starMap[ch.id]??1):
        ch.id===completed+1?'✦ Maceraya Gir':'🔒 Önceki Bölümü Bitir'}
      </span>
     </button>)}
    </section>
    <p className="writing-privacy">🛡️ Yazdığın serbest metin saklanmaz. Yalnızca öğrenme ilerlemen kaydedilir.</p>
   </div>:phase==='playing'?<div className="writing-play">
    <div className="writing-topline">
     <span>{current.icon} {current.title}</span>
     <span>{englishLevel} · {step+1}/{deck.length}</span>
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
     <div className="writing-art" aria-hidden="true">
      <span className="writing-art-icon">{task.icon}</span>
      <span className="writing-art-deco">✦</span>
     </div>
     <h2>{task.promptTr}</h2>
     <p className="writing-task-caption">
      {task.mode==='spell'?'Harfleri seçerek İngilizce kelimeyi tamamla.':
       task.mode==='assemble'?'Kelimelere sırayla dokunarak anlamlı cümle oluştur.':
       'İngilizce cümleni klavyeden yaz. İhtiyacın olursa örneğe bakabilirsin.'}
     </p>
     <div className="writing-learning-tools">
      <button type="button" onClick={speakModel} disabled={saving||resolved}>🔊 Örneği dinle</button>
      <button type="button" onClick={showExample} disabled={saving||resolved}>
       💡 {exampleVisible?'Örneği gördün':'Örneği göster'}
      </button>
     </div>
     {exampleVisible&&<p className="writing-example" lang="en">{task.target}</p>}
     {task.mode==='write'?<div className="writing-answer-area">
      <label htmlFor="workshop-typed-answer">Senin İngilizce yazın</label>
      <textarea id="workshop-typed-answer" lang="en" dir="ltr" spellCheck={false}
       autoComplete="off" autoCapitalize="off"
       value={input} maxLength={180} rows={wordCount>=9?3:2}
       placeholder={englishLevel==='Pre-A1'?'İngilizce kelimeyi yaz…':'İngilizce cümleni yaz…'}
       onChange={event=>{setInput(event.target.value);setMessage('');}}
       disabled={saving||resolved}/>
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
