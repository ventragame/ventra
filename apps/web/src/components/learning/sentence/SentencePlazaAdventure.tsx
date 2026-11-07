'use client';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import type {SentenceAnswerEvidence} from '@ventra/shared';
import type {EnglishPlacement} from '@/lib/learning/gradeAwareLearningPolicy';
import {getProgressRepository} from '@/lib/progress';
import {getSentencePlazaProgress,saveSentencePlazaMission,type SentencePlazaProgress}
 from '@/lib/progress/sentencePlazaProgress';
import {SENTENCE_PLAZA_MISSIONS,planPlazaMission,plazaWordTiles,evaluatePlazaSentence,
 type PlazaMission,type PlazaDeck,type PlazaQuestion} from '@/lib/learning/sentencePlazaEngine';
import {soundService} from '@/lib/audio/SoundService';
import {SentencePlazaScene} from './SentencePlazaScene';
import {MovementMagicAdventure} from './MovementMagicAdventure';
import {WishFestivalAdventure} from './WishFestivalAdventure';
import {LanternFestivalAdventure} from './LanternFestivalAdventure';
import './sentence-plaza.css';
import './sentence-plaza-v2.css';

interface Props{
 profileId:string;gradeLevel:number|null;englishLevel:EnglishPlacement;
 onBack:()=>void;onSaved:()=>void;
}
type Screen='map'|'lesson'|'play'|'reward';
const FUTURE=['Büyülü Yapı Atölyesi','Konumlar Parkı','Soru İstasyonu','Gökyüzü Köprüsü'] as const;
const EMPTY:SentencePlazaProgress={completedLevels:0,totalLevels:6,starsByLevel:{}};
function sessionId(profileId:string,mission:PlazaMission):string{
 return `plaza:${profileId}:${mission}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}
export function SentencePlazaAdventure({profileId,gradeLevel,englishLevel,onBack,onSaved}:Props){
 const [progress,setProgress]=useState<SentencePlazaProgress>(EMPTY);
 const [history,setHistory]=useState<SentenceAnswerEvidence[]>([]);
 const [movementOpen,setMovementOpen]=useState(false);
 const [wishOpen,setWishOpen]=useState(false);
 const [lanternOpen,setLanternOpen]=useState(false);
 const [knownWords,setKnownWords]=useState<string[]>([]);
 const [loading,setLoading]=useState(true);
 const [loadError,setLoadError]=useState('');
 const [screen,setScreen]=useState<Screen>('map');
 const [mission,setMission]=useState<PlazaMission>(1);
 const [deck,setDeck]=useState<PlazaDeck|null>(null);
 const [step,setStep]=useState(0);
 const [picked,setPicked]=useState<string[]>([]);
 const [selectedScene,setSelectedScene]=useState<string|null>(null);
 const [repairMarked,setRepairMarked]=useState(false);
 const [wrongSlot,setWrongSlot]=useState(-1);
 const [mistakes,setMistakes]=useState(0);
 const [roundMistakes,setRoundMistakes]=useState(0);
 const [hintUsed,setHintUsed]=useState(false);
 const [modelHeard,setModelHeard]=useState(false);
 const [answers,setAnswers]=useState<SentenceAnswerEvidence[]>([]);
 const [awakened,setAwakened]=useState(false);
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [feedbackError,setFeedbackError]=useState(false);
 const [saveError,setSaveError]=useState('');
 const [completedStars,setCompletedStars]=useState(0);
 const completedAnswers=useRef<SentenceAnswerEvidence[]>([]);
 const startedAt=useRef(Date.now());
 const currentSession=useRef('');
 const nextTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const awaitingTransition=useRef(false);
 const savingLock=useRef(false);
 const root=useRef<HTMLDivElement>(null);
 const task=deck?.questions[step]??null;
 const tiles=useMemo(()=>task?plazaWordTiles(task,(deck?.seed??0)+step*173):[],[task,deck?.seed,step]);
 const selectedWords=picked.map(id=>tiles.find(t=>t.id===id)?.word??'');
 const chosenCount=picked.length;
 const taskReady=task?.mode==='scene'?selectedScene===task.correctSceneChoice:
    task?.mode==='repair'?repairMarked:true;
 const sceneColorMap:Record<string,string>={
  red:'#f77075',blue:'#6ac7f1',yellow:'#ffd86a',green:'#73dfa7',
  purple:'#b49beb',orange:'#f3a65d'
 };
 const sentenceKindLabels:Record<string,string>={
  statement:'Anlatım',question:'Soru',negative:'Olumsuz cümle',
  instruction:'Yönerge',reason:'Neden-sonuç',contrast:'Karşılaştırma',
  preference:'Tercih',request:'İstek'
 };
 const repairWords=task?.brokenSentence?.replace(/[.,!?]/g,'').split(/\s+/).filter(Boolean)??[];
 const repairBadIndex=task?.mode==='repair'?repairWords.findIndex((word,i)=>word!==task.tokens[i]):-1;
 const totalQuestions=deck?.questions.length??0;
 const rule=SENTENCE_PLAZA_MISSIONS[mission-1];
 const starsTotal=Object.values(progress.starsByLevel).reduce((n,v)=>n+v,0);
 const clearTimer=()=>{if(nextTimer.current){clearTimeout(nextTimer.current);nextTimer.current=null;}};
 useEffect(()=>{
  let live=true;
  setLoading(true);setLoadError('');
  const repo=getProgressRepository();
  Promise.all([getSentencePlazaProgress(repo,profileId),repo.getSentenceAnswerHistory(profileId),
    Promise.all([
     repo.getAnimalAnswerHistory(profileId).catch(()=>[]),
     repo.getColorAnswerHistory(profileId).catch(()=>[]),
     repo.getFoodAnswerHistory(profileId).catch(()=>[])
    ])])
    .then(([p,h,garden])=>{if(!live)return;
      setProgress(p);setHistory(h);
      setKnownWords([...new Set(garden.flat().map(item=>item.wordId))]);
      setLoading(false);
    })
    .catch(error=>{console.error('Cümle Meydanı ilerlemesi okunamadı',error);
      if(live){setLoadError('Oyuncu ilerlemesi okunamadı. Kaydını korumak için bölümler açılmadı.');setLoading(false);}});
  return()=>{live=false;clearTimer();soundService.cancelSpeech();};
 },[profileId]);
 useEffect(()=>{
  soundService.setMusicScene('plaza');
  return()=>{soundService.setMusicScene('archipelago');soundService.cancelSpeech();};
 },[]);
 useEffect(()=>{if(screen==='play')root.current?.querySelector<HTMLElement>('.sp-cue')?.focus();},[screen,step]);
 function back(){
  clearTimer();soundService.cancelSpeech();awaitingTransition.current=false;
  if(savingLock.current)return;
  if(screen==='map'){onBack();return;}
  if(screen==='reward'){setScreen('map');return;}
  // Never award half-finished attempts; a complete mission saves atomically.
  setScreen('map');setAwakened(false);setPicked([]);setSelectedScene(null);setRepairMarked(false);setFeedback('');
 }
 function openMission(m:PlazaMission){
  if(loading||loadError||savingLock.current||m>progress.completedLevels+1)return;
  if(m===4){setMovementOpen(true);return;}
  if(m===5){setWishOpen(true);return;}
  if(m===6){setLanternOpen(true);return;}
  clearTimer();soundService.cancelSpeech();
  setMission(m);setScreen('lesson');setDeck(null);setFeedback('');setSaveError('');
  setAwakened(false);setCompletedStars(0);setAnswers([]);completedAnswers.current=[];
  setStep(0);setPicked([]);setSelectedScene(null);setRepairMarked(false);setWrongSlot(-1);setMistakes(0);setRoundMistakes(0);setHintUsed(false);setModelHeard(false);
 }
 function beginMission(){
  const now=Date.now(),seed=(now^Math.floor(Math.random()*0xffffffff))>>>0;
  const next=planPlazaMission({mission,grade:gradeLevel,englishLevel,seed,history,knownWords});
  if(!next.questions.length){setLoadError('Bu bölüm için İngilizce görev oluşturulamadı.');return;}
  currentSession.current=sessionId(profileId,mission);
  startedAt.current=now;
  awaitingTransition.current=false;savingLock.current=false;
  setDeck(next);setStep(0);setAnswers([]);completedAnswers.current=[];
  setPicked([]);setSelectedScene(null);setRepairMarked(false);setWrongSlot(-1);setMistakes(0);setRoundMistakes(0);setHintUsed(false);setModelHeard(false);
  setAwakened(false);setFeedback('');setFeedbackError(false);setSaveError('');
  setScreen('play');
  soundService.playSfx('whoosh',.5);
 }
 function incorrect(detail?:string){
  if(awaitingTransition.current)return;
  setMistakes(n=>n+1);setRoundMistakes(n=>n+1);setFeedbackError(true);
  soundService.playSfx('gentle_retry',.7);
  setFeedback(detail??'Bir sözcüğün yeri veya anlamı doğru değil. Cümleyi tekrar düzenle.');
 }
 function listenModel(){
  soundService.unlockAudio();
  soundService.speakEnglish(rule.model,{rate:.78});
 }
 function listenTask(){
  if(!task||awaitingTransition.current)return;
  soundService.unlockAudio();
  const started=soundService.speakEnglish(task.sentence,{rate:.81});
  if(started){setModelHeard(true);setFeedback('İngilizce cümleyi dinledin. Şimdi sözcükleri kendin sırala.');setFeedbackError(false);}
  else{setFeedback('Cihazında İngilizce ses kullanılamadı. Yazılı yardım açabilirsin.');setFeedbackError(true);}
 }
 function showHint(){
  if(!task||awaitingTransition.current)return;
  setHintUsed(true);setFeedbackError(false);
  setFeedback(`Dil ipucu: ${task.explanation} Sıradaki kelime: “${task.tokens[chosenCount]}”.`);
 }
 async function finish(rows:SentenceAnswerEvidence[]){
  if(savingLock.current||!deck)return;
  savingLock.current=true;setBusy(true);setSaveError('');completedAnswers.current=rows;
  try{
   const p=await saveSentencePlazaMission({repo:getProgressRepository(),profileId,mission,plan:deck,
    answers:rows,sessionId:currentSession.current,durationSeconds:(Date.now()-startedAt.current)/1000});
   const earned=p.starsByLevel[mission]??1;
   setProgress(p);setCompletedStars(earned);
   setHistory(old=>[...old,...rows]);setScreen('reward');setFeedback('');
   soundService.playSfx('fanfare',.8);
   onSaved();
  }catch(error){
   console.error('Cümle Meydanı kayıt hatası',error);
   setSaveError('İlerleme kaydedilemedi. Aynı oturumu tekrar kaydet; ödüllerin iki kez eklenmez.');
   setFeedbackError(true);
  }finally{setBusy(false);savingLock.current=false;}
 }
 function completeQuestion(nextPicked:string[]){
  if(!task||!deck||awaitingTransition.current)return;
  awaitingTransition.current=true;
  setAwakened(true);setFeedbackError(false);
  setFeedback(`✦ ${task.sentence} — Cümleyi kurdun! Sahne canlanıyor.`);
  const evidence:SentenceAnswerEvidence={
   questionId:task.id,skill:task.skill,placement:englishLevel,sentenceKind:task.kind,challengeMode:task.mode,mistakes:roundMistakes,
   hintUsed,modelHeard,firstTryCorrect:roundMistakes===0&&!hintUsed&&!modelHeard,
   timestamp:new Date().toISOString()
  };
  const rows=[...answers,evidence];
  setPicked(nextPicked);setAnswers(rows);completedAnswers.current=rows;
  soundService.playSfx('correct',.85);
  soundService.speakEnglish(task.sentence,{rate:.86});
  // Allow intelligible full-sentence playback and the actual world transformation
  // to complete before automatically advancing. No additional "next" click.
  const duration=Math.max(1950,Math.min(5100,1100+task.tokens.length*230));
  nextTimer.current=setTimeout(()=>{
   nextTimer.current=null;awaitingTransition.current=false;
   if(step+1>=deck.questions.length){void finish(rows);return;}
   soundService.cancelSpeech();
   setStep(n=>n+1);setPicked([]);setSelectedScene(null);setRepairMarked(false);setWrongSlot(-1);setRoundMistakes(0);setHintUsed(false);
   setModelHeard(false);setAwakened(false);setFeedback('');setFeedbackError(false);
  },duration);
 }
 function pickWord(id:string){
  if(!task||!deck||screen!=='play'||awaitingTransition.current||busy||saveError||!taskReady)return;
  if(picked.includes(id)||picked.length>=task.tokens.length)return;
  const tile=tiles.find(x=>x.id===id);
  if(!tile)return;
  soundService.playSfx('tap',.37);
  setPicked(old=>[...old,id]);setWrongSlot(-1);setFeedback('');setFeedbackError(false);
 }
 function selectScene(id:string){
  if(!task||task.mode!=='scene'||awaitingTransition.current||busy||selectedScene)return;
  if(id!==task.correctSceneChoice){
   incorrect('Sahnedeki bu seçenek yönergenin anlamıyla eşleşmiyor. Nesneyi veya yeri yeniden düşün.');
   return;
  }
  soundService.playSfx('tap',.5);
  setSelectedScene(id);setFeedback('Anlamı eşleştirdin. Şimdi İngilizce cümleyi kendi sözcüklerinle kur.');
  setFeedbackError(false);
 }
 function selectRepair(index:number){
  if(!task||task.mode!=='repair'||awaitingTransition.current||busy||repairMarked)return;
  if(index!==repairBadIndex){
   incorrect('Seçtiğin sözcük yanlış olan değil. Cümledeki dil bilgisi ve sözcük sırasını incele.');
   return;
  }
  soundService.playSfx('correct',.35);
  setRepairMarked(true);setFeedback('Hatalı sözcüğü buldun. Şimdi doğru İngilizce cümleyi baştan kur.');
  setFeedbackError(false);
 }
 function submitSentence(){
  if(!task||!deck||!taskReady||awaitingTransition.current||busy||saveError)return;
  const result=evaluatePlazaSentence(task,selectedWords);
  if(!result.correct){
   if(picked.length<task.tokens.length){
    setFeedback('Cümlede eksik sözcük var. Sonra cümleyi kontrol et.');
    setFeedbackError(true);
    return;
   }
   setWrongSlot(result.incorrectIndex);
   incorrect(result.explanation);
   return;
  }
  completeQuestion(picked);
 }
 const sceneEffect=screen==='play'&&awakened?task?.scene??null:null;
 const chapterTotal=6;
 if(lanternOpen){
  return <LanternFestivalAdventure profileId={profileId} gradeLevel={gradeLevel}
    englishLevel={englishLevel} history={history} knownWords={knownWords}
    onExit={()=>setLanternOpen(false)}
    onComplete={(rows)=>{
      setHistory(old=>[...old,...rows]);
      void getSentencePlazaProgress(getProgressRepository(),profileId).then(setProgress)
        .catch(error=>console.error('Fener Festivali ilerleme görünümü yenilenemedi',error));
      onSaved();
    }}/>;
 }
 if(wishOpen){
  return <WishFestivalAdventure profileId={profileId} gradeLevel={gradeLevel}
    englishLevel={englishLevel} history={history} knownFoods={knownWords}
    onExit={()=>setWishOpen(false)}
    onComplete={(rows)=>{
      setHistory(old=>[...old,...rows]);
      void getSentencePlazaProgress(getProgressRepository(),profileId).then(setProgress)
        .catch(error=>console.error('İstekler Meydanı ilerlemesi yenilenemedi',error));
      onSaved();
    }}/>;
 }
 if(movementOpen){
  return <MovementMagicAdventure profileId={profileId} gradeLevel={gradeLevel}
    englishLevel={englishLevel} history={history}
    onExit={()=>setMovementOpen(false)}
    onComplete={(newRows)=>{
      setHistory(old=>[...old,...newRows]);
      void getSentencePlazaProgress(getProgressRepository(),profileId).then(setProgress)
        .catch(error=>console.error('Hareket Büyüsü ilerleme görünümü yenilenemedi',error));
      onSaved();
    }}/>;
 }
 return <div ref={root} role="dialog" aria-modal="true" aria-label="Cümle Meydanı İngilizce macerası"
  className="sp-overlay sp-v2" onPointerDown={event=>event.stopPropagation()}>
  <div className="sp-wrap">
   <header className="sp-top">
    <div className="sp-logo"><div className="sp-logo-emblem" aria-hidden="true">🏰</div>
     <div><div className="sp-eyebrow">VENTRA · SENTENCE ADVENTURE</div>
      <h1 className="sp-brand-title">Cümle Meydanı</h1>
      <p className="sp-sub sr-only">Kelimeler dünyayı değiştirsin.</p></div>
    </div>
    <div className="sp-actions">
     <span className="sp-chip">🎓 {gradeLevel??'—'}. sınıf · {englishLevel}</span>
     <span className="sp-chip">⭐ {starsTotal} / 18</span>
     <button type="button" className="sp-back" onClick={back} disabled={busy}>
      ← {screen==='map'?'Adalar Evreni':'Meydana Dön'}
     </button>
    </div>
   </header>
   {loading?<div role="status" className="sp-reward"><h2>Şehir hazırlanıyor…</h2></div>:
   loadError?<div role="alert" className="sp-reward"><h2>Kayıt okunamadı</h2><p>{loadError}</p>
    <button type="button" onClick={onBack} className="sp-primary">Adalar Evreni'ne Dön</button>
   </div>:
   screen==='map'?<>
    <section className="sp-hero sp-v2-hero"><div>
     <div className="sp-eyebrow">BÖLGE 1 / 5 · CANLANAN CÜMLELER ŞEHRİ</div>
     <h2>Uyanan Meydan</h2>
     <p>Bir cümle kur, meydanı canlandır!</p>
    </div><div className="sp-stars"><strong>{progress.completedLevels}/6</strong>görev tamamlandı</div></section>
    <div className="sp-layout">
     <div>
      <SentencePlazaScene effect={null} awaken={false} chapter={0}/>
      <div className="sp-map-grid" aria-label="Uyanan Meydan öğrenme görevleri">
       {SENTENCE_PLAZA_MISSIONS.map(item=>{
        const unlocked=item.id<=progress.completedLevels+1,done=item.id<=progress.completedLevels;
        return <button type="button" key={item.id} className="sp-mission" disabled={!unlocked}
         data-status={done?'completed':unlocked?'available':'locked'}
          aria-label={`${item.title}. ${done?'Tamamlandı, tekrar oyna':unlocked?'Oynamaya hazır':'Kilitli'}`}
          onClick={()=>openMission(item.id)}>
         <img className="sp-v2-card-art" alt="" aria-hidden="true" loading="lazy" draggable={false}
          src={`/assets/sentence-plaza/v2/mission-${item.id}.webp`}/>
         <div className="sp-mission-top"><span aria-hidden="true">{item.icon}</span><span>{done?'✓':unlocked?'✦':'🔒'}</span></div>
         <strong>{item.id}. {item.title}</strong>
         <small>{done?'✓ Tamamlandı':unlocked?'▶ Oyna':'🔒 Kilitli'}</small>
        </button>;
       })}
      </div>
      <div className="sp-future"><h3>Şehrin diğer bölgeleri</h3>
       <div className="sp-future-grid">{FUTURE.map((name,i)=>
        <div className="sp-future-item" key={name}>🔒 {i+2}. {name}<br/>Yakında</div>)}</div></div>
     </div>
     <aside className="sp-side sp-v2-guide">
       <div className="sp-side-label">✦ BU ADADA</div>
       <h3>Cümle kur, canlandır!</h3>
       <div className="sp-v2-flow" aria-label="Gör → Dinle → Kur → Canlandır">
        <div><span aria-hidden="true">👀</span><strong>Gör</strong></div>
        <div><span aria-hidden="true">🔊</span><strong>Dinle</strong></div>
        <div><span aria-hidden="true">🧩</span><strong>Kur</strong></div>
        <div><span aria-hidden="true">✨</span><strong>Canlandır</strong></div>
       </div>
       <details className="sp-v2-details"><summary>Nasıl oynanır?</summary>
        <p>Doğru cümleyi kurduğunda sahne canlanır. İpuçları ve başarıların ayrı kaydedilir.</p>
       </details>
       <button type="button" className="sp-primary sp-v2-play" onClick={()=>openMission(Math.min(6,progress.completedLevels+1) as PlazaMission)}>
        ✨ {progress.completedLevels>=6?'Tekrar Oyna':'Başla'}
       </button>
      </aside>
    </div>
   </>:screen==='lesson'?<>
    <section className="sp-hero sp-v2-hero"><div><div className="sp-eyebrow">ÖNCE ÖĞREN · GÖREV {mission} / {chapterTotal}</div>
     <h2>{rule.icon} {rule.title}</h2><p>{rule.story}</p></div></section>
    <div className="sp-layout">
     <SentencePlazaScene effect={null} awaken={false} chapter={mission}/>
     <aside className="sp-side sp-v2-guide">
       <div className="sp-side-label">1 · DİNLE</div><h3>Örneği keşfet</h3>
       <div className="sp-learn-card"><strong>ÖRNEK CÜMLE</strong><span>{rule.model}</span>
        <small>{rule.modelTr}</small></div>
       <button type="button" className="sp-secondary sp-v2-listen" onClick={listenModel}>🔊 Dinle</button>
       <details className="sp-v2-details"><summary>📖 Dil yapısı</summary><p>{rule.rule}</p></details>
       <button type="button" className="sp-primary sp-v2-play" onClick={beginMission}>✨ Oyna</button>
      </aside>
    </div>
   </>:screen==='play'&&deck&&task?<>
    <section className="sp-hero"><div><div className="sp-eyebrow">GÖREV {mission} · {rule.skill.toUpperCase()}</div>
     <h2>{rule.title}</h2><p className="sr-only">{rule.story}</p></div>
     <div className="sp-stars"><strong>{step+1}/{totalQuestions}</strong>cümle görevi</div></section>
    <div className="sp-game-layout">
     <div>
      <SentencePlazaScene effect={sceneEffect} awaken={awakened} chapter={mission}
        onInteract={awakened?()=>soundService.speakEnglish(task.sentence,{rate:.82}):undefined}/>
      <details className="sp-v2-details sp-v2-scene-help">
        <summary>📖 Yapı yardımı</summary><p>{task.explanation}</p>
       </details>
     </div>
     <section className="sp-workshop" aria-label="İngilizce cümle oluşturma atölyesi">
      <div className="sp-step"><span>✦ {sentenceKindLabels[task.kind]} · {task.mode==='repair'?'Hata avı':task.mode==='scene'?'Sahneyi eşleştir':'Cümle inşa et'}</span>
       <span>{step+1} / {totalQuestions}</span></div>
      <div className="sp-meter" role="progressbar" aria-label="Bölümde tamamlanan cümleler"
       aria-valuemin={0} aria-valuemax={totalQuestions} aria-valuenow={step+(awakened?1:0)}>
       <span style={{width:`${100*(step+(awakened?1:0))/totalQuestions}%`}}/></div>
      <h3 tabIndex={-1} className="sp-cue">{task.cue}</h3>
      <div className="sp-v2-steps" aria-label="Seç, kur ve canlandır">
        <span className={taskReady?'sp-v2-step-done':'sp-v2-step-current'}>① Seç</span>
        <span className={taskReady?'sp-v2-step-current':''}>② Kur</span>
        <span className={awakened?'sp-v2-step-done':''}>③ Canlandır</span>
       </div>
      {task.mode==='scene'&&task.sceneChoices&&
       <div className="sp-interaction" role="group" aria-label="Anlamla eşleşen görsel sahne seçimi">
        <strong>👀 Sahneyi seç</strong>
        <div className="sp-scene-choices">
         {task.sceneChoices.map(choice=><button type="button" key={choice.id}
          disabled={selectedScene!==null||awakened||busy}
          aria-pressed={selectedScene===choice.id}
          className="sp-scene-choice" data-selected={selectedScene===choice.id}
          onClick={()=>selectScene(choice.id)}>
          {choice.icon==='🎨'?<span className="sp-color-swatch" aria-hidden="true"
           style={{backgroundColor:sceneColorMap[choice.id]??'#9ad3df'}}>✦</span>:
           <span aria-hidden="true">{choice.icon}</span>}<small>{choice.label}</small>
         </button>)}
        </div>
       </div>}
      {task.mode==='repair'&&task.brokenSentence&&
       <div className="sp-interaction" role="group" aria-label="Yanlış sözcüğü bul ve onar">
        <strong>🔎 Yanlışı bul</strong>
        <div className="sp-repair-words">{repairWords.map((word,i)=><button type="button"
         key={i} disabled={repairMarked||awakened||busy}
         data-selected={repairMarked&&i===repairBadIndex}
         className="sp-repair-word" onClick={()=>selectRepair(i)}>{word}</button>)}</div>
       </div>}
      {!taskReady&&<p className="sp-caption" style={{marginTop:10}}>
       {task.mode==='repair'?'Önce yanlış sözcüğü seç.':'Önce sahneyi seç.'}
      </p>}
      <details className="sp-v2-vocab"><summary>📚 Kelimeler</summary>
        <div className="sp-vocab" aria-label="İngilizce kelime desteği">
         {task.vocabulary.map((w,i)=><span key={i}>{w.en} · {w.tr}</span>)}</div>
       </details>
      <div className="sp-slots" role="group" aria-live="polite" aria-label="Oluşturduğun İngilizce cümle">
       {task.tokens.map((word,i)=><button type="button" key={i} disabled={!selectedWords[i]||awakened||busy}
        aria-label={selectedWords[i]?'“'+selectedWords[i]+'” kelimesini kaldır':'Boş kelime yuvası'}
        onClick={()=>{setPicked(old=>old.filter((_,index)=>index!==i));setWrongSlot(-1);}}
        data-error={wrongSlot===i}
        className={`sp-slot ${selectedWords[i]?'sp-slot-filled':''}`}>
        {selectedWords[i]??'✧'}</button>)}</div>
      <div className="sp-tiles" role="group" aria-label="Cümle için kullanılabilecek İngilizce kelimeler">
       {tiles.map(t=><button type="button" key={t.id} className="sp-tile"
        disabled={!taskReady||picked.includes(t.id)||picked.length>=task.tokens.length||awakened||busy||Boolean(saveError)}
        onClick={()=>pickWord(t.id)} aria-label={`“${t.word}” kelimesini cümleye ekle`}>{t.word}</button>)}</div>
      <button type="button" className="sp-primary sp-check" disabled={awakened||busy||!taskReady||picked.length!==task.tokens.length||Boolean(saveError)}
       onClick={submitSentence}>✨ Canlandır</button>
      <div className="sp-tools">
       <button type="button" className="sp-secondary" disabled={awakened||busy||!picked.length}
        onClick={()=>{setPicked(old=>old.slice(0,-1));setWrongSlot(-1);}} aria-label="Son kelimeyi geri al">↶ Geri Al</button>
       <button type="button" className="sp-secondary" disabled={awakened||busy}
        onClick={listenTask}>🔊 Dinle</button>
       <button type="button" className="sp-secondary" disabled={awakened||busy}
        onClick={showHint}>💡 İpucu</button>
      </div>
      {feedback&&<div role="status" aria-live="polite" className="sp-feedback" data-error={feedbackError}>{feedback}</div>}
      {awakened&&<p role="status" className="sp-caption" style={{marginTop:12}}>✨ Sahne canlandı!</p>}
      {saveError&&<div role="alert" className="sp-feedback" data-error="true">
        {saveError}<button type="button" disabled={busy} className="sp-primary" style={{marginTop:12}}
         onClick={()=>void finish(completedAnswers.current)}>Tekrar Kaydet</button></div>}
      <p className="sr-only">İpuçları ve hatalar öğrenme kayıtlarında ayrı tutulur.</p>
     </section>
    </div>
   </>:screen==='reward'?<div className="sp-reward" role="status">
     <div className="sp-eyebrow">Uyanan Meydan · Görev {mission} tamamlandı</div>
     <h2>Şehir canlandı!</h2><div className="sp-reward-stars">{'★'.repeat(completedStars)}</div>
     <p>İngilizce cümleler kurarak dünyayı değiştirdin. Yeni göreve geçebilir veya bu bölümde başka cümlelerle çalışabilirsin.</p>
     <div className="sp-lesson-grid" style={{margin:'20px 0'}}>
      <div className="sp-lesson-tip">📖 <strong>{completedAnswers.current.length} anlamlı cümle</strong></div>
      <div className="sp-lesson-tip">⭐ <strong>{completedStars} / 3 yıldız</strong></div>
      <div className="sp-lesson-tip">🧠 <strong>{completedAnswers.current.filter(x=>x.firstTryCorrect).length} bağımsız başarı</strong></div>
      <div className="sp-lesson-tip">💡 <strong>{completedAnswers.current.filter(x=>x.hintUsed||x.modelHeard).length} destekli deneme</strong></div>
     </div>
     <button type="button" className="sp-primary" onClick={()=>openMission(Math.min(6,mission+1) as PlazaMission)}>
      {mission===6?'↻ Farklı Cümlelerle Yeniden Oyna':'✦ Sıradaki Öğrenme Görevi'}
     </button>
     <button type="button" className="sp-secondary" style={{marginTop:17}} onClick={()=>setScreen('map')}>Meydan Haritasına Dön</button>
    </div>:null}
  </div>
 </div>;
}
