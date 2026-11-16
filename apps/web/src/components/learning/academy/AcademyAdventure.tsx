'use client';

import React,{useEffect,useMemo,useRef,useState} from 'react';
import type {GameCompletedPayload} from '@ventra/shared';
import {getProgressRepository} from '@/lib/progress';
import {soundService} from '@/lib/audio/SoundService';
import {listenToChild,speechCapability,stopSpeechCapture,type SpeechCapability} from '@/lib/speech/childSpeech';
import {
 ACADEMY_GAME_ID,ACADEMY_ZONES,buildAcademyPlan,nextAcademyVariant,
 academyWords,academyShuffle,matchesAcademyAnswer,academySkillReview,
 type AcademyLevel,type AcademyTask,type AcademyAnswer
} from '@/lib/learning/academyEngine';
import {
 readAcademyCheckpoint,saveAcademyCheckpoint,clearAcademyCheckpoint
} from '@/lib/learning/academyCheckpoint';
import './academy-adventure.css';

type Props={profileId:string;englishLevel:AcademyLevel;gradeLevel:number|null;
 onBack:()=>void;onSaved:()=>void};
type Stage='map'|'quest'|'final';
const labels={hear:'Dinle',read:'Oku',talk:'Konuş',build:'Cümle Kur',write:'Yaz'};
const kinds=['hear','read','talk','build','write'] as const;
export function AcademyAdventure({profileId,englishLevel,gradeLevel,onBack,onSaved}:Props){
 const [stage,setStage]=useState<Stage>('map');
 const [zone,setZone]=useState(1);
 const [variant,setVariant]=useState(0);
 const [step,setStep]=useState(0);
 const [answers,setAnswers]=useState<AcademyAnswer[]>([]);
 const [mistakes,setMistakes]=useState(0);
 const [hints,setHints]=useState(0);
 const [errorOnStep,setErrorOnStep]=useState(0);
 const [hintOnStep,setHintOnStep]=useState(false);
 const [typed,setTyped]=useState('');
 const [picked,setPicked]=useState<number[]>([]);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [saveError,setSaveError]=useState('');
 const [levels,setLevels]=useState<Record<number,{completedCount:number;bestStars:number}>>({});
 const [capability,setCapability]=useState<SpeechCapability|null>(null);
 const [recorded,setRecorded]=useState<AcademyAnswer[]>([]);
 const [sessionId,setSessionId]=useState('');
 const [started,setStarted]=useState(Date.now());
 const pending=useRef(false);
 const audioEpoch=useRef(0);
 const alive=useRef(true);
 const plan=useMemo(()=>buildAcademyPlan(zone,englishLevel,variant),[zone,englishLevel,variant]);
 const task=plan.tasks[step]??plan.tasks[plan.tasks.length-1];
 const completed=ACADEMY_ZONES.filter(z=>(levels[z.id]?.completedCount??0)>0).length;
 const available=completed+1;
 const currentZone=ACADEMY_ZONES[zone-1];
 const zonePhoto='/assets/kids-islands/language_academy.webp';
 const wordTiles=useMemo(()=>academyShuffle(academyWords(task.answer),task.id+'-order'),[task]);
 const hasSpeech=capability&&['native-local','sherpa-local','web-local','web-browser'].includes(capability.mode);

 useEffect(()=>{
  alive.current=true;
  let live=true;
  void getProgressRepository().getAllLevelProgress(ACADEMY_GAME_ID,profileId).then(rows=>{
   if(!live)return;
   setLevels(rows);setLoading(false);
  }).catch(()=>{if(live){setLoading(false);setSaveError('İlerleme okunamadı. Yeniden dene.');}});
  void speechCapability().then(cap=>{if(live)setCapability(cap);}).catch(()=>{});
  return()=>{live=false;alive.current=false;audioEpoch.current++;stopSpeechCapture();soundService.cancelSpeech();soundService.setCaptureActive(false);};
 },[profileId]);
 const stop=()=>{audioEpoch.current++;stopSpeechCapture();soundService.setCaptureActive(false);soundService.cancelSpeech();};
 function open(id:number){
  if(busy||loading||id>available||id<1)return;
  stop();setSaveError('');setMessage('');setErrorOnStep(0);setHintOnStep(false);
  setTyped('');setPicked([]);
  const checkpoint=readAcademyCheckpoint(profileId,englishLevel,id);
  const count=Math.max(0,levels[id]?.completedCount??0);
  const chosen=checkpoint?.variant??nextAcademyVariant(count);
  const p=buildAcademyPlan(id,englishLevel,chosen);
  const restored=checkpoint&&checkpoint.answers.every((a,i)=>p.tasks[i]?.id===a.taskId)?checkpoint:null;
  setZone(id);setVariant(chosen);
  setStep(restored?.step??0);
  setAnswers(restored?.answers??[]);
  setMistakes(restored?.attempts??0);
  setHints(restored?.hints??0);
  setSessionId(restored?.sessionId??crypto.randomUUID());
  setStarted(Date.now());
  setStage('quest');soundService.playSfx('island_portal',.45);
 }
 function readLine(){
  soundService.unlockAudio();
  const phrase=task.kind==='talk'?task.line:task.kind==='build'||task.kind==='write'?task.answer:task.line;
  soundService.speakEnglish(phrase,{rate:gradeLevel!==null&&gradeLevel<=2?.78:.88});
 }
 function showHint(){
  if(busy||hintOnStep)return;
  setHintOnStep(true);setHints(n=>n+1);
  setMessage('İpucu: '+task.answer);
  soundService.playSfx('tap',.35);
 }
 async function save(rows:AcademyAnswer[],totalErrors:number,totalHints:number){
  const independentlyDone=rows.filter(r=>r.firstTryCorrect&&r.independentlyCompleted).length;
  const stars:1|2|3=totalErrors===0&&totalHints===0?3:
    independentlyDone>=3?2:1;
  const payload:GameCompletedPayload={
   sessionId,profileId,gameId:ACADEMY_GAME_ID,levelId:zone,
   outcomeId:'academy-integrated-practice',skillId:'academy-communication',
   score:Math.round(100*independentlyDone/plan.tasks.length),success:true,starsEarned:stars,
   metrics:{durationSeconds:Math.max(1,Math.round((Date.now()-started)/1000)),
    attemptsCount:rows.length+totalErrors,accuracyRate:independentlyDone/plan.tasks.length,
    wrongAttempts:totalErrors,hintsUsed:totalHints,academyAnswers:rows},
   completedAt:new Date().toISOString()
  };
  try{
   await getProgressRepository().recordGameCompleted(payload,profileId);
   if(!alive.current)return;
   clearAcademyCheckpoint(profileId,englishLevel,zone);
   const updated=await getProgressRepository().getAllLevelProgress(ACADEMY_GAME_ID,profileId);
   if(!alive.current)return;
   setLevels(updated);setRecorded(rows);setBusy(false);setSaveError('');
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
   taskId:task.id,caseId:plan.caseId,placement:englishLevel,skill:task.skill,
   firstTryCorrect:errorOnStep===0,hintUsed:hintOnStep,mistakes:errorOnStep,
   independentlyCompleted:independent,speechVerified,timestamp:new Date().toISOString()
  };
  const next=[...answers,row];
  setAnswers(next);setBusy(true);setMessage(task.feedback);soundService.playSfx('correct',.6);
  saveAcademyCheckpoint(profileId,englishLevel,zone,{
   step:step+1,variant,answers:next,attempts:mistakes,hints,sessionId
  });
  window.setTimeout(()=>{
   pending.current=false;
   if(!alive.current)return;
   if(step+1>=plan.tasks.length){
    void save(next,mistakes,hints);return;
   }
   stop();setStep(step+1);setErrorOnStep(0);setHintOnStep(false);
   setPicked([]);setTyped('');setMessage('');setBusy(false);
  },700);
 }
 function wrong(){
  if(busy)return;
  setMistakes(n=>n+1);setErrorOnStep(n=>n+1);
  setMessage('Bir daha deneyelim. İstersen soru işaretinden ipucu alabilirsin.');
  soundService.playSfx('gentle_retry',.35);
 }
 function choose(value:string){
  if(matchesAcademyAnswer(value,task.answer))accept(false,false);
  else wrong();
 }
 function submit(){
  if(busy)return;
  const attempt=task.kind==='build'?picked.map(i=>wordTiles.find(w=>w.key===i)?.word??'').join(' '):typed;
  if(matchesAcademyAnswer(attempt,task.answer))accept(false,task.kind==='write');
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
     taskId:task.id,caseId:plan.caseId,placement:englishLevel,skill:task.skill,
     firstTryCorrect:errorOnStep===0,hintUsed:hintOnStep,mistakes:errorOnStep,
     independentlyCompleted:!hintOnStep&&errorOnStep===0,speechVerified:true,
     timestamp:new Date().toISOString()
    };
    const next=[...answers,row];setAnswers(next);setMessage(task.feedback);setBusy(true);
    pending.current=true;
    saveAcademyCheckpoint(profileId,englishLevel,zone,{step:step+1,variant,answers:next,attempts:mistakes,hints,sessionId});
    soundService.playSfx('correct',.65);
    window.setTimeout(()=>{
     pending.current=false;if(!alive.current)return;
     if(step+1>=plan.tasks.length){void save(next,mistakes,hints);return;}
     stop();setStep(step+1);setErrorOnStep(0);setHintOnStep(false);setPicked([]);
     setTyped('');setMessage('');setBusy(false);
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
 function exit(){stop();onBack();}
 const review=academySkillReview(recorded);
 return (
  <div className="academy-root" role="dialog" aria-modal="true" aria-label="Keşif Akademisi">
   <div className="academy-stars" aria-hidden="true"/>
   <header className="academy-header">
    <button type="button" className="academy-back" onClick={stage==='map'?exit:()=>{stop();setStage('map');setBusy(false);pending.current=false;}}>
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
       <span className="academy-zone-art" aria-hidden="true"><span>{z.icon}</span></span>
       <span className="academy-zone-text"><strong>{z.name}</strong><small>{z.subtitle}</small>
        <span>{unlocked?(done?'↻ Tekrar keşfet · '+(levels[z.id]?.completedCount??0)+' tur':'✦ Maceraya gir'):'🔒 Önceki bölümü tamamla'}</span>
       </span>
       {done&&<span className="academy-zone-star" aria-label="Tamamlandı">★</span>}
      </button>;
     })}
    </div>
    <p className="academy-note">Tekrar oynadığında yeni görevler gelir. Sözlü yanıtlar yalnızca mikrofonun desteklendiği cihazlarda doğrulanır.</p>
   </main>}
   {stage==='quest'&&<main className="academy-quest">
    <div className="academy-quest-top"><span>{currentZone.icon} {currentZone.name}</span><span>Görev {step+1} / {plan.tasks.length}</span></div>
    <div className="academy-progress" role="progressbar" aria-valuenow={step} aria-valuemin={0} aria-valuemax={5} aria-label="Macera ilerlemesi">
     <span style={{width:(step/5*100)+'%'}}/>
    </div>
    <section className="academy-scene" style={{'--zone-tint':currentZone.tint,'--zone-light':currentZone.light} as React.CSSProperties}>
     <div className="academy-scene-glow" aria-hidden="true"/>
     <div className="academy-scene-icon" aria-hidden="true">{plan.icon}</div>
     <div className="academy-scene-dialogue"><span className="academy-lumi" aria-hidden="true">✦</span>
      <div><strong>{plan.caseTitle}</strong><p>{plan.mission}</p></div>
     </div>
    </section>
    <section className="academy-task">
     <div className="academy-task-head"><span className="academy-kind">{labels[task.kind]}</span>
      <button type="button" className="academy-hint" disabled={busy||hintOnStep} onClick={showHint}
       aria-label="İpucu göster">? <span>İpucu</span></button>
     </div>
     <h2>{task.prompt}</h2>
     {task.line&&<p className={'academy-line '+(task.kind==='hear'?'academy-line-hidden':'')}>
      {task.kind==='hear'&&!hintOnStep?'Önce sesi dinle.':'“'+task.line+'”'}</p>}
     {(task.kind==='hear'||task.kind==='talk')&&
      <button className="academy-audio" type="button" onClick={readLine} disabled={busy}> <span aria-hidden="true">🔊</span> İngilizceyi Dinle</button>}
     {kinds.slice(0,3).includes(task.kind as 'hear'|'read'|'talk')&&<div className="academy-choices">
      {task.options.map(o=><button type="button" key={o} disabled={busy} onClick={()=>choose(o)}>{o}</button>)}
     </div>}
     {task.kind==='talk'&&<div className="academy-voice">
      <button type="button" className="academy-mic" onClick={()=>void speak()} disabled={!hasSpeech||busy}>
       🎙️ {busy?'Dinleniyor…':'Sesinle Cevap Ver'}</button>
      <small>{hasSpeech?'Mikrofon isteğe bağlıdır; dokunarak da ilerleyebilirsin.':'Bu cihazda konuşma tanıma yok. Dokunarak devam et.'}</small>
     </div>}
     {task.kind==='build'&&<div className="academy-build">
      <div className="academy-built" aria-label="Kurulan İngilizce cümle">
       {picked.length?picked.map(i=><button key={i} type="button" onClick={()=>setPicked(old=>old.filter(x=>x!==i))} disabled={busy}>
        {wordTiles.find(w=>w.key===i)?.word}</button>):<span>Kelime kartlarına dokun…</span>}
      </div>
      <div className="academy-tiles">
       {wordTiles.filter(w=>!picked.includes(w.key)).map(w=><button type="button" key={w.key}
        disabled={busy} onClick={()=>setPicked(old=>[...old,w.key])}>{w.word}</button>)}
      </div>
      <button type="button" className="academy-submit" disabled={busy||picked.length===0} onClick={submit}>Cümleyi Kontrol Et</button>
     </div>}
     {task.kind==='write'&&<div className="academy-writing">
      <label htmlFor="academy-write">İngilizce cevabını yaz</label>
      <input id="academy-write" value={typed} maxLength={150} autoComplete="off" spellCheck={false}
       onChange={e=>setTyped(e.target.value)} placeholder={englishLevel==='Pre-A1'?'English word…':'English sentence…'}
       disabled={busy} onKeyDown={e=>{if(e.key==='Enter')submit();}}/>
      <button type="button" className="academy-submit" disabled={busy||!typed.trim()} onClick={submit}>Mesajı Kontrol Et</button>
     </div>}
     <p className="academy-feedback" role="status" aria-live="polite">{message||'Doğru cevabı seçerek macerana devam et.'}</p>
     {saveError&&<div className="academy-alert" role="alert">{saveError}<button type="button" onClick={()=>void save(answers,mistakes,hints)}>Kaydı Yeniden Dene</button></div>}
    </section>
   </main>}
   {stage==='final'&&<main className="academy-finale">
    <div className="academy-final-icon" aria-hidden="true">🌠</div>
    <span className="academy-eyebrow">ATLASIN BİR SAYFASI DAHA AYDINLANDI</span>
    <h1>{currentZone.ending}</h1>
    <p>{plan.result}</p>
    <div className="academy-review">
     {review.map(r=><div key={r.skill}><strong>{r.skill==='listening'?'Dinleme':r.skill==='reading'?'Okuma':
      r.skill==='dialogue'?'İletişim':r.skill==='sentence'?'Cümle':'Yazma'}</strong>
      <span>{r.independent?'Bağımsız cevap':'Destekli çalışma'}</span></div>)}
    </div>
    <p className="academy-note">Bu görevler öğrenme alıştırmasıdır; resmî İngilizce seviye sınavı değildir.</p>
    <div className="academy-final-actions">
     <button type="button" className="academy-submit" onClick={()=>{setStage('map');setMessage('');}}>Bölümleri Gör</button>
     <button type="button" className="academy-again" onClick={()=>open(zone)}>Yeniden Keşfet ↻</button>
    </div>
   </main>}
  </div>
 );
}
