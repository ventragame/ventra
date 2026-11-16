'use client';

import React,{useEffect,useMemo,useRef,useState} from 'react';
import type {GameCompletedPayload} from '@ventra/shared';
import {getProgressRepository} from '@/lib/progress';
import {soundService} from '@/lib/audio/SoundService';
import {CharacterGuide} from '@/components/learning/motion/CharacterGuide';
import {listenToChild,speechCapability,stopSpeechCapture,type SpeechCapability} from '@/lib/speech/childSpeech';
import {
 ACADEMY_GAME_ID,ACADEMY_REVIEW_GAME_ID,ACADEMY_ZONES,buildAcademyPlan,buildAcademyFocusPlan,nextAcademyVariant,
 academyWords,academyShuffle,matchesAcademyAnswer,isAcademyTaskAnswerCorrect,academySkillReview,
 academySafeMission,academyHint,academyRoundOptions,academyReviewPriority,
 type AcademyLevel,type AcademySkill,type AcademyAnswer
} from '@/lib/learning/academyEngine';
import {
 readAcademyCheckpoint,saveAcademyCheckpoint,clearAcademyCheckpoint
} from '@/lib/learning/academyCheckpoint';
import './academy-adventure.css';

type Props={profileId:string;englishLevel:AcademyLevel;gradeLevel:number|null;
 onBack:()=>void;onSaved:()=>void};
type Stage='map'|'quest'|'pending'|'final';
const labels={hear:'Dinle',read:'Oku',talk:'Konuş',build:'Cümle Kur',write:'Yaz'};
const kinds=['hear','read','talk','build','write'] as const;
/** Accessible visual labels: illustrations are illustrative, English text remains authoritative. */
function choiceVisual(option:string){
 const lower=option.toLowerCase();
 const objects:Record<string,string>={compass:'🧭',star:'⭐',key:'🗝️',envelope:'✉️',card:'💌',
  parcel:'📦',lantern:'🏮',shell:'🐚',map:'🗺️',ticket:'🎟️',bag:'🎒',teddy:'🧸',
  feather:'🪶',moon:'🌙',crystal:'💎',heart:'💛',fountain:'⛲',garden:'🌳',
  tower:'🏰',bridge:'🌉',library:'📚',gate:'🚪',station:'🚉',beach:'🏖️',
  platform:'🚉',treehouse:'🏡',observatory:'🔭'};
 const icon=Object.entries(objects).find(([word])=>lower.includes(word))?.[1]??'✨';
 const colors:Record<string,string>={blue:'#8dc7ff',red:'#f7a1a1',green:'#98e3af',
  yellow:'#ffe69a',purple:'#d9b7ff',pink:'#ffc2d6',brown:'#cda986',
  white:'#f3f2e9',silver:'#d6dce9',golden:'#ffe5a2',bright:'#fff0a8',
  old:'#d8b488',new:'#a1d6ed',small:'#bcd9ff',large:'#ffdf9e',round:'#e6c6f4'};
 const tint=Object.entries(colors).find(([word])=>lower.includes(word))?.[1]??'#dbe6fb';
 return {icon,tint};
}
export function AcademyAdventure({profileId,englishLevel,gradeLevel,onBack,onSaved}:Props){
 const [stage,setStage]=useState<Stage>('map');
 const [zone,setZone]=useState(1);
 const [variant,setVariant]=useState(0);
 const [reviewSkill,setReviewSkill]=useState<AcademySkill|null>(null);
 const [step,setStep]=useState(0);
 const [answers,setAnswers]=useState<AcademyAnswer[]>([]);
 const [mistakes,setMistakes]=useState(0);
 const [hints,setHints]=useState(0);
 const [errorOnStep,setErrorOnStep]=useState(0);
 const [hintLevel,setHintLevel]=useState<0|1|2>(0);
 const hintOnStep=hintLevel>0;
 const [audioPlayed,setAudioPlayed]=useState(false);
 const [audioAttempted,setAudioAttempted]=useState(false);
 const [typed,setTyped]=useState('');
 const [picked,setPicked]=useState<number[]>([]);
 const [message,setMessage]=useState('');
 const [resolved,setResolved]=useState(false);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [saveError,setSaveError]=useState('');
 const [levels,setLevels]=useState<Record<number,{completedCount:number;bestStars:number}>>({});
 const [capability,setCapability]=useState<SpeechCapability|null>(null);
 const [recorded,setRecorded]=useState<AcademyAnswer[]>([]);
 const [sessionId,setSessionId]=useState('');
 const [started,setStarted]=useState(Date.now());
 const pending=useRef(false);
 const runVersion=useRef(0);
 const advanceTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const audioEpoch=useRef(0);
 const alive=useRef(true);
 const plan=useMemo(()=>reviewSkill?buildAcademyFocusPlan(zone,englishLevel,reviewSkill,variant):
  buildAcademyPlan(zone,englishLevel,variant),[zone,englishLevel,variant,reviewSkill]);
 const task=plan.tasks[step]??plan.tasks[plan.tasks.length-1];
 const completed=ACADEMY_ZONES.filter(z=>(levels[z.id]?.completedCount??0)>0).length;
 const available=completed+1;
 const currentZone=ACADEMY_ZONES[zone-1];
 const zonePhoto='/assets/kids-islands/language_academy.webp';
 const recommended=academyReviewPriority(recorded,englishLevel);
 const recommendationText=recommended?({listening:'Dinleme',reading:'Okuma',dialogue:'Konuşma',sentence:'Cümle kurma',writing:'Yazma'} as const)[recommended.skill]:null;
 const wordTiles=useMemo(()=>academyShuffle(academyWords(task.answer),task.id+'-order'),[task]);
 // Academy permits only local/native speech recognition for children by default.
 const hasSpeech=capability&&['native-local','sherpa-local','web-local'].includes(capability.mode);

 useEffect(()=>{
  alive.current=true;
  let live=true;
  void getProgressRepository().getAllLevelProgress(ACADEMY_GAME_ID,profileId).then(rows=>{
   if(!live)return;
   setLevels(rows);setLoading(false);
  }).catch(()=>{if(live){setLoading(false);setSaveError('İlerleme okunamadı. Yeniden dene.');}});
  void getProgressRepository().getAcademyAnswerHistory(profileId).then(rows=>{
   if(live)setRecorded(rows);
  }).catch(()=>{});
  void speechCapability().then(cap=>{if(live)setCapability(cap);}).catch(()=>{});
  return()=>{live=false;alive.current=false;runVersion.current++;
   if(advanceTimer.current)clearTimeout(advanceTimer.current);
   audioEpoch.current++;stopSpeechCapture();soundService.cancelSpeech();soundService.setCaptureActive(false);};
 },[profileId]);
 const stop=()=>{audioEpoch.current++;stopSpeechCapture();soundService.setCaptureActive(false);soundService.cancelSpeech();};
 const cancelAdvance=()=>{runVersion.current++;
  if(advanceTimer.current)clearTimeout(advanceTimer.current);
  advanceTimer.current=null;pending.current=false;};
 // Keep only categorical evidence during unfinished tasks; never typed input.
 function persistDraft(patch:Partial<{
  attempts:number;hints:number;currentMistakes:number;currentHintLevel:0|1|2;
  audioAttempted:boolean;audioPlayed:boolean;
 }>={}){
  if(reviewSkill||!sessionId)return;
  saveAcademyCheckpoint(profileId,englishLevel,zone,{
   step,variant,answers,sessionId,attempts:mistakes,hints,
   currentMistakes:errorOnStep,currentHintLevel:hintLevel,
   audioAttempted,audioPlayed,...patch
  });
 }
 function open(id:number){
  if(busy||loading||id>available||id<1)return;
  cancelAdvance();stop();setResolved(false);setSaveError('');setMessage('');setErrorOnStep(0);setHintLevel(0);setAudioPlayed(false);setAudioAttempted(false);
  setTyped('');setPicked([]);
  const checkpoint=readAcademyCheckpoint(profileId,englishLevel,id);
  const count=Math.max(0,levels[id]?.completedCount??0);
  const chosen=checkpoint?.variant??nextAcademyVariant(count);
  const p=buildAcademyPlan(id,englishLevel,chosen);
  const restored=checkpoint&&checkpoint.answers.every((a,i)=>p.tasks[i]?.id===a.taskId)?checkpoint:null;
  setZone(id);setVariant(chosen);setReviewSkill(null);
  setStep(restored?.step??0);
  setAnswers(restored?.answers??[]);
  setMistakes(restored?.attempts??0);
  setHints(restored?.hints??0);
  setErrorOnStep(restored?.currentMistakes??0);
  setHintLevel(restored?.currentHintLevel??0);
  setAudioAttempted(restored?.audioAttempted??false);
  setAudioPlayed(restored?.audioPlayed??false);
  setSessionId(restored?.sessionId??crypto.randomUUID());
  setStarted(Date.now());
  setStage(restored?.step===5?'pending':'quest');soundService.playSfx('island_portal',.45);
 }
 function startSkillReview(skill:AcademySkill){
  if(busy||loading||completed===0)return;
  const region=Math.min(6,completed);
  cancelAdvance();stop();setReviewSkill(skill);setZone(region);
  setVariant(Math.max(0,recorded.length+(levels[region]?.completedCount??0)));
  setStep(0);setAnswers([]);setMistakes(0);setHints(0);
  setHintLevel(0);setErrorOnStep(0);setAudioPlayed(false);setAudioAttempted(false);
  setTyped('');setPicked([]);setResolved(false);setMessage('');setSaveError('');
  setSessionId(crypto.randomUUID());setStarted(Date.now());
  setStage('quest');soundService.playSfx('island_portal',.45);
 }
 function readLine(){
  soundService.unlockAudio();
  const phrase=task.kind==='talk'?task.line:task.kind==='build'||task.kind==='write'?task.answer:task.line;
  const started=soundService.speakEnglish(phrase,{rate:gradeLevel!==null&&gradeLevel<=2?.78:.88});
  if(task.kind==='hear'){
   setAudioAttempted(true);if(started)setAudioPlayed(true);
   persistDraft({audioAttempted:true,audioPlayed:audioPlayed||started});
  }
  if((task.kind==='build'||task.kind==='write')&&started&&!hintOnStep){
   setHintLevel(1);setHints(n=>n+1);
   setMessage('Sesli örnek yardım olarak kullanıldı. Macerana devam edebilirsin.');
   persistDraft({hints:hints+1,currentHintLevel:1});
  }
 }
 function showHint(){
  if(busy||hintLevel>=2)return;
  const next=(hintLevel+1) as 1|2;
  setHintLevel(next);setHints(n=>n+1);
  persistDraft({hints:hints+1,currentHintLevel:next});
  setMessage(academyHint(task,next));
  soundService.playSfx('tap',.35);
 }
 async function save(rows:AcademyAnswer[],totalErrors:number,totalHints:number){
  const independentlyDone=rows.filter(r=>r.firstTryCorrect&&r.independentlyCompleted).length;
  const stars:1|2|3=totalErrors===0&&totalHints===0?3:
    independentlyDone>=3?2:1;
  const version=runVersion.current;
  const payload:GameCompletedPayload={
   sessionId,profileId,gameId:reviewSkill?ACADEMY_REVIEW_GAME_ID:ACADEMY_GAME_ID,levelId:zone,
   outcomeId:'academy-integrated-practice',skillId:'academy-communication',
   score:Math.round(100*independentlyDone/plan.tasks.length),success:true,
   starsEarned:reviewSkill?0:stars,
   metrics:{durationSeconds:Math.max(1,Math.round((Date.now()-started)/1000)),
    attemptsCount:rows.length+totalErrors,accuracyRate:independentlyDone/plan.tasks.length,
    wrongAttempts:totalErrors,hintsUsed:totalHints,academyAnswers:rows},
   completedAt:new Date().toISOString()
  };
  try{
   await getProgressRepository().recordGameCompleted(payload,profileId);
   if(!alive.current)return;
   if(!reviewSkill)clearAcademyCheckpoint(profileId,englishLevel,zone);
   if(!alive.current||version!==runVersion.current){onSaved();return;}
   const updated=await getProgressRepository().getAllLevelProgress(ACADEMY_GAME_ID,profileId);
   if(!alive.current)return;
   if(version!==runVersion.current)return;
   setLevels(updated);setRecorded(history=>[...history,...rows]);setBusy(false);setSaveError('');
   setStage('final');soundService.playSfx('fanfare',.65);onSaved();
  }catch{
   if(!alive.current)return;
   setBusy(false);setSaveError('Kayıt tamamlanamadı. Bağlantıyı kontrol edip yeniden dene.');
  }
 }
 function accept(speechVerified=false,independentOverride?:boolean){
  if(busy||pending.current)return;
  pending.current=true;
  const independent=(independentOverride??(task.kind==='write'||task.kind==='build'))&&
    !hintOnStep&&errorOnStep===0;
  const row:AcademyAnswer={
   taskId:task.id,caseId:task.caseId,placement:englishLevel,skill:task.skill,
   firstTryCorrect:errorOnStep===0,hintUsed:hintOnStep,mistakes:errorOnStep,
   independentlyCompleted:independent,speechVerified,timestamp:new Date().toISOString()
  };
  const next=[...answers,row];
  setAnswers(next);setBusy(true);setResolved(true);setMessage(task.feedback);soundService.playSfx('correct',.6);
  if(!reviewSkill)saveAcademyCheckpoint(profileId,englishLevel,zone,{
   step:step+1,variant,answers:next,attempts:mistakes,hints,sessionId,
   currentMistakes:0,currentHintLevel:0,audioAttempted:false,audioPlayed:false
  });
  const version=runVersion.current;
  advanceTimer.current=window.setTimeout(()=>{
   pending.current=false;
   if(!alive.current||version!==runVersion.current)return;
   if(step+1>=plan.tasks.length){
    void save(next,mistakes,hints);return;
   }
   stop();setStep(step+1);setErrorOnStep(0);setHintLevel(0);setAudioPlayed(false);setAudioAttempted(false);
   setPicked([]);setTyped('');setMessage('');setResolved(false);setBusy(false);
  },700);
 }
 function wrong(){
  if(busy)return;
  setMistakes(n=>n+1);setErrorOnStep(n=>n+1);
  persistDraft({attempts:mistakes+1,currentMistakes:errorOnStep+1});
  setMessage('Bir daha deneyelim. İstersen soru işaretinden ipucu alabilirsin.');
  soundService.playSfx('gentle_retry',.35);
 }
 function choose(value:string){
  if(matchesAcademyAnswer(value,task.answer))accept(false,task.kind==='read'||(task.kind==='hear'&&audioPlayed));
  else wrong();
 }
 function submit(useTiles=false){
  if(busy)return;
  const attempt=(task.kind==='build'||useTiles)?picked.map(i=>wordTiles.find(w=>w.key===i)?.word??'').join(' '):typed;
  if(isAcademyTaskAnswerCorrect(task,attempt))accept(false,task.kind==='build'||(task.kind==='write'&&!useTiles));
  else wrong();
 }
 async function speak(){
  if(busy||!hasSpeech||!capability)return;
  stop();setBusy(true);setMessage('Dinliyorum…');soundService.unlockAudio();
  const epoch=audioEpoch.current;
  soundService.setCaptureActive(true);
  try{
   const result=await listenToChild(capability,9000,undefined,[task.answer]);
   if(epoch!==audioEpoch.current||!alive.current)return;
   soundService.setCaptureActive(false);
   if(result.kind==='recognized'&&result.alternatives.some(s=>matchesAcademyAnswer(s,task.answer))){
    setBusy(false);pending.current=false;
    // Speech is evaluated only when the recognizer produces the expected words.
    const row:AcademyAnswer={
     taskId:task.id,caseId:task.caseId,placement:englishLevel,skill:task.skill,
     firstTryCorrect:errorOnStep===0,hintUsed:hintOnStep,mistakes:errorOnStep,
     independentlyCompleted:!hintOnStep&&errorOnStep===0,speechVerified:true,
     timestamp:new Date().toISOString()
    };
    const next=[...answers,row];setAnswers(next);setMessage(task.feedback);setResolved(true);setBusy(true);
    pending.current=true;
    if(!reviewSkill)saveAcademyCheckpoint(profileId,englishLevel,zone,{step:step+1,variant,answers:next,attempts:mistakes,hints,sessionId,
      currentMistakes:0,currentHintLevel:0,audioAttempted:false,audioPlayed:false});
    soundService.playSfx('correct',.65);
    const version=runVersion.current;
    advanceTimer.current=window.setTimeout(()=>{
     pending.current=false;if(!alive.current||version!==runVersion.current)return;
     if(step+1>=plan.tasks.length){void save(next,mistakes,hints);return;}
     stop();setStep(step+1);setErrorOnStep(0);setHintLevel(0);setAudioPlayed(false);setAudioAttempted(false);setPicked([]);
     setTyped('');setMessage('');setResolved(false);setBusy(false);
    },700);
   }else{
    setBusy(false);
    if(result.kind==='recognized'){wrong();setMessage('Söylediğini duydum fakat cevap farklı. Yeniden deneyebilirsin.');}
    else setMessage('Konuşma tanınamadı. Yeniden deneyebilir veya dokunarak devam edebilirsin.');
   }
  }catch{
   if(alive.current)setMessage('Mikrofon bu cihazda kullanılamadı. Dokunarak devam edebilirsin.');
   setBusy(false);
  }finally{soundService.setCaptureActive(false);}
 }
 function exit(){cancelAdvance();stop();onBack();}
 const review=academySkillReview(answers,Date.now(),englishLevel);
 return (
  <div className="academy-root" role="dialog" aria-modal="true" aria-label="Keşif Akademisi">
   <div className="academy-stars" aria-hidden="true"/>
   <header className="academy-header">
    <button type="button" className="academy-back" onClick={stage==='map'?exit:()=>{cancelAdvance();stop();setStage('map');setBusy(false);}}>
     ← {stage==='map'?'Adalara Dön':'Bölümlere Dön'}</button>
    <div className="academy-brand"><span aria-hidden="true">✦</span> KEŞİF AKADEMİSİ <small>Kayıp Yıldız Atlası</small></div>
    <span className="academy-level">{englishLevel} · {gradeLevel?gradeLevel+'. sınıf':'Keşif'}</span>
   </header>
   {stage==='map'&&<main className="academy-map">
    <section className="academy-hero">
     <div className="academy-hero-copy">
      <span className="academy-eyebrow">VENTRA · SON BÜYÜK MACERA</span>
      <h1>Yıldız Atlası seni bekliyor!</h1>
      <p>İngilizce öğren, yeni dostlara yardım et ve atlasın altı sayfasını ışıkla doldur.</p>
      <div className="academy-hero-status">{completed} / 6 bölge keşfedildi <span aria-hidden="true">✦</span></div>
     </div>
     <img src={zonePhoto} alt="Keşif Akademisi adasının büyülü manzarası" className="academy-hero-image"/>
    </section>
    {saveError&&<p className="academy-alert" role="alert">{saveError}</p>}
    <h2 className="academy-section-title">Macera durakların</h2>
    <div className="academy-zone-grid">
     {ACADEMY_ZONES.map(z=>{
      const unlocked=z.id<=available,done=(levels[z.id]?.completedCount??0)>0;
      return <button className={'academy-zone-card '+(!unlocked?'is-locked':'')}
        type="button" key={z.id} disabled={!unlocked||loading} onClick={()=>open(z.id)}
        style={{'--zone-tint':z.tint,'--zone-light':z.light} as React.CSSProperties}>
       <span className="academy-zone-art" aria-hidden="true"><picture>
        <source media="(max-width: 650px)" srcSet={z.mobileArt}/>
        <img src={z.art} alt="" loading="lazy"/></picture><span>{z.icon}</span></span>
       <span className="academy-zone-text"><strong>{z.name}</strong><small>{z.subtitle}</small>
        <span>{unlocked?(done?'↻ Tekrar keşfet · '+(levels[z.id]?.completedCount??0)+' tur':'✦ Maceraya gir'):'🔒 Önceki bölümü tamamla'}</span>
       </span>
       {done&&<span className="academy-zone-star" aria-label="Tamamlandı">★</span>}
      </button>;
     })}
    </div>
    {recommended&&<section className="academy-today" aria-label="Öğrenme önerisi">
     <span aria-hidden="true">🪄</span>
     <div><strong>Bugünün keşif önerisi: {recommendationText}</strong>
      <p>Son cevaplarına göre bu beceride üç yeni alıştırma yapabilirsin. Bu tur yeni yıldız kazandırmaz.</p>
     </div>
     <button type="button" onClick={()=>startSkillReview(recommended.skill)}>
       3 Görevlik Tekrar</button>
    </section>}
    <p className="academy-note">Her bölgede üç farklı hikâye var. Yeniden oynadığında yeni bir durumla karşılaşırsın. Dokunarak verilen diyalog cevapları konuşma başarısı sayılmaz.</p>
   </main>}
   {stage==='quest'&&<main className="academy-quest">
    <div className="academy-quest-top"><span>{currentZone.icon} {reviewSkill?'Kısa Tekrar':currentZone.name}</span><span>Görev {step+1} / {plan.tasks.length}</span></div>
    <div className="academy-progress" role="progressbar" aria-valuenow={step} aria-valuemin={0} aria-valuemax={plan.tasks.length} aria-label="Macera ilerlemesi">
     <span style={{width:(step/plan.tasks.length*100)+'%'}}/>
    </div>
    <section className="academy-scene" style={{'--zone-tint':currentZone.tint,'--zone-light':currentZone.light} as React.CSSProperties}>
     <div className="academy-scene-photo" aria-hidden="true">
      <picture><source media="(max-width: 650px)" srcSet={currentZone.mobileArt}/>
       <img src={currentZone.art} alt="" decoding="async"/></picture>
    </div>
    <div className="academy-scene-glow" aria-hidden="true"/>
    <div className="academy-scene-sparks" aria-hidden="true">
      {Array.from({length:step+1},(_,i)=><span key={i}>✧</span>)}
    </div>
    <div className="academy-scene-icon" aria-hidden="true">{plan.icon}</div>
    <div className="academy-scene-character" aria-hidden="true">
      <CharacterGuide character="meadow-owl"
       mood={resolved?'happy':busy&&task.kind==='talk'?'listen':hintOnStep?'hint':task.kind==='hear'?'listen':'idle'}
       cueKey={task.id+'-'+String(busy)+'-'+String(hintLevel)}/>
    </div>
     <div className="academy-scene-dialogue"><span className="academy-lumi" aria-hidden="true"><span className="academy-lumi-eyes"><i/><i/></span><span className="academy-lumi-smile"/></span>
      <div><strong>{step===0?currentZone.name:plan.caseTitle}</strong>
       <p>{step===0?academySafeMission(zone):plan.mission}</p></div>
     </div>
    {resolved&&<div className="academy-scene-achievement" role="status" aria-live="polite">
      <span aria-hidden="true">✦</span> {task.feedback}
     </div>}
    </section>
    <section className="academy-task">
     <div className="academy-task-head"><span className="academy-kind">{labels[task.kind]}</span>
      <button type="button" className="academy-hint" disabled={busy||hintLevel===2} onClick={showHint}
       aria-label={hintLevel===0?'İpucu göster':hintLevel===1?'Bir ipucu daha göster':'Tüm ipuçları gösterildi'}>?
       <span>{hintLevel===0?'İpucu':hintLevel===1?'Bir İpucu Daha':'İpucu Kullanıldı'}</span></button>
     </div>
     <h2>{task.prompt}</h2>
     {task.line&&<p className={'academy-line '+(task.kind==='hear'?'academy-line-hidden':'')}>
      {task.kind==='hear'&&!hintOnStep?'Önce sesi dinle.':'“'+task.line+'”'}</p>}
     {(task.kind==='hear'||task.kind==='talk')&&
      <button className="academy-audio" type="button" onClick={readLine} disabled={busy}> <span aria-hidden="true">🔊</span> {task.kind==='hear'?'Dinle / Tekrar Dinle':'Soruyu Dinle'}</button>}
     {task.kind==='hear'&&!audioAttempted&&<p className="academy-listen-note">🔊 İlk olarak İngilizce sesi dinle.</p>}
     {kinds.slice(0,3).includes(task.kind as 'hear'|'read'|'talk')&&<div className="academy-choices">
      {academyRoundOptions(task,levels[zone]?.completedCount??0).map(o=>{
       const visual=choiceVisual(o);
       return <button type="button" key={o} disabled={busy||(task.kind==='hear'&&!audioAttempted)} onClick={()=>choose(o)}>
        <span className="academy-choice-icon" aria-hidden="true" style={{backgroundColor:visual.tint}}>{visual.icon}</span>
        <span>{o}</span>
       </button>;
      })}
     </div>}
     {task.kind==='talk'&&<div className="academy-voice">
      <button type="button" className="academy-mic" onClick={()=>void speak()} disabled={!hasSpeech||busy}>
       🎙️ {busy?'Dinleniyor…':'Sesinle Cevap Ver'}</button>
      <small>{hasSpeech?'Mikrofon isteğe bağlıdır; dokunarak da ilerleyebilirsin.':'Cihaz içi konuşma tanıma kullanılamıyor. Dokunarak devam et.'}</small>
     </div>}
     {(task.kind==='build'||task.kind==='write')&&
      <button type="button" className="academy-audio academy-audio-support" onClick={readLine} disabled={busy}>🔊 Sesli Örnek Dinle (yardımlı)</button>}
     {task.kind==='build'&&<div className="academy-build">
      <div className="academy-built" aria-label="Kurulan İngilizce cümle">
       {picked.length?picked.map(i=><button key={i} type="button" onClick={()=>setPicked(old=>old.filter(x=>x!==i))} disabled={busy}>
        {wordTiles.find(w=>w.key===i)?.word}</button>):<span>Kelime kartlarına dokun…</span>}
      </div>
      <div className="academy-tiles">
       {wordTiles.filter(w=>!picked.includes(w.key)).map(w=><button type="button" key={w.key}
        disabled={busy} onClick={()=>setPicked(old=>[...old,w.key])}>{w.word}</button>)}
      </div>
      <button type="button" className="academy-submit" disabled={busy||picked.length===0} onClick={()=>submit()}>Cümleyi Kontrol Et</button>
     </div>}
     {task.kind==='write'&&<div className="academy-writing">
      <label htmlFor="academy-write">İngilizce cevabını yaz</label>
      <input id="academy-write" value={typed} maxLength={150} autoComplete="off" spellCheck={false}
       onChange={e=>setTyped(e.target.value)} placeholder={englishLevel==='Pre-A1'?'English word…':'English sentence…'}
       disabled={busy} onKeyDown={e=>{if(e.key==='Enter')submit();}}/>
      <button type="button" className="academy-submit" disabled={busy||!typed.trim()} onClick={()=>submit()}>Mesajı Kontrol Et</button>
      {englishLevel==='Pre-A1'&&<div className="academy-touch-write">
       <p>Klavye zor mu? Kelime kartlarıyla da tamamlayabilirsin. Bu, bağımsız yazma olarak sayılmaz.</p>
       <div className="academy-built">{picked.length?picked.map(i=><button type="button" key={i}
        disabled={busy} onClick={()=>setPicked(old=>old.filter(x=>x!==i))}>
         {wordTiles.find(w=>w.key===i)?.word}</button>):<span>Kelimeleri sıraya koy…</span>}</div>
       <div className="academy-tiles">{wordTiles.filter(w=>!picked.includes(w.key)).map(w=>
        <button type="button" key={w.key} disabled={busy} onClick={()=>setPicked(old=>[...old,w.key])}>{w.word}</button>)}</div>
       <button type="button" className="academy-submit" disabled={busy||picked.length===0} onClick={()=>submit(true)}>
        Kartlarla Tamamla
       </button>
      </div>}
     </div>}
     <p className="academy-feedback" role="status" aria-live="polite">{message||(task.kind==='write'?'Cevabını yaz veya kartlarla oluştur.':task.kind==='build'?'Kelimeleri sıraya koy.':'Görevi tamamlamak için uygun cevabı seç.')}</p>
     {saveError&&<div className="academy-alert" role="alert">{saveError}<button type="button" onClick={()=>void save(answers,mistakes,hints)}>Kaydı Yeniden Dene</button></div>}
    </section>
   </main>}
   {stage==='pending'&&<main className="academy-finale">
    <div className="academy-final-icon" aria-hidden="true">💾</div>
    <span className="academy-eyebrow">ATLAS KAYIT KONTROLÜ</span>
    <h1>Maceran tamamlandı!</h1>
    <p>Önceki oturumunda bütün görevleri bitirdin. Yıldızlarını kaydetmek için devam et.</p>
    {saveError&&<p className="academy-alert" role="alert">{saveError}</p>}
    <button className="academy-submit" type="button" disabled={busy}
      onClick={()=>{setBusy(true);void save(answers,mistakes,hints);}}>
      {busy?'Kaydediliyor…':'Kaydı Tamamla'}
    </button>
   </main>}
   {stage==='final'&&<main className="academy-finale">
    <div className="academy-final-icon" aria-hidden="true">🌠</div>
    <span className="academy-eyebrow">{reviewSkill?'ÖĞRENME TEKRARI TAMAMLANDI':'ATLASIN BİR SAYFASI DAHA AYDINLANDI'}</span>
    <h1>{reviewSkill?'Üç küçük görevi tamamladın!':currentZone.ending}</h1>
    <p>{plan.result}</p>
    <div className="academy-review">
     {review.filter(r=>r.attempts>0).map(r=><div key={r.skill}><strong>{r.skill==='listening'?'Dinleme':r.skill==='reading'?'Okuma':
      r.skill==='dialogue'?'İletişim':r.skill==='sentence'?'Cümle':'Yazma'}</strong>
      <span>{r.independent?'Bağımsız cevap':'Destekli çalışma'}</span></div>)}
    </div>
    <p className="academy-note">Bu görevler öğrenme alıştırmasıdır; resmî İngilizce seviye sınavı değildir.</p>
    <div className="academy-final-actions">
     <button type="button" className="academy-submit" onClick={()=>{setStage('map');setMessage('');}}>Bölümleri Gör</button>
     <button type="button" className="academy-again" onClick={()=>reviewSkill?startSkillReview(reviewSkill):open(zone)}>{reviewSkill?'Tekrar Çalış ↻':'Yeniden Keşfet ↻'}</button>
    </div>
   </main>}
  </div>
 );
}
