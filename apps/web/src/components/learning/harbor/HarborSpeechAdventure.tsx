'use client';

import React,{useCallback,useEffect,useRef,useState} from 'react';
import type {GameCompletedPayload} from '@ventra/shared';
import {getProgressRepository} from '@/lib/progress';
import {soundService} from '@/lib/audio/SoundService';
import {HARBOR_EPISODES,HARBOR_GAME_ID,matchesExpectedSpeech,type HarborLevel} from '@/lib/learning/harborDialogueEngine';
import {getHarborEpisodeSteps,getHarborEpisodeQuests,harborChoiceOrder} from '@/lib/learning/harborMissionEngine';
import {HARBOR_SCENE_ASSETS} from '@/lib/learning/harborSceneAssets';
import {HarborSceneStage,type HarborPropId} from './HarborSceneStage';
import {readHarborCheckpoint,saveHarborCheckpoint,clearHarborCheckpoint} from '@/lib/learning/harborCheckpoint';
import {speechCapability,installLocalEnglish,listenToChild,testMicrophoneInput,stopSpeechCapture,canOfferBrowserSpeechService,type SpeechCapability,type SpeechCaptureStatus} from '@/lib/speech/childSpeech';
import {ParentalGateModal} from '@/components/profile/ParentalGateModal';
import './harbor-speech.css';
import './harbor-premium-scene.css';

type Props={profileId:string;englishLevel:HarborLevel;gradeLevel:number|null;onBack:()=>void;onSaved:()=>void};
type Phase='map'|'playing'|'completed';
const EMPTY_CAPABILITY:SpeechCapability={mode:'none',installable:false,message:'Mikrofon kontrol ediliyor…'};
export function HarborSpeechAdventure({profileId,englishLevel,gradeLevel,onBack,onSaved}:Props){
 const [phase,setPhase]=useState<Phase>('map');
 const [completed,setCompleted]=useState(0);
 const [episode,setEpisode]=useState(1);
 const [question,setQuestion]=useState(0);
 const [sceneSelected,setSceneSelected]=useState(false);
 const [sceneResolved,setSceneResolved]=useState(false);
 const [levelPlays,setLevelPlays]=useState<Record<number,number>>({});
 const [replayIndex,setReplayIndex]=useState(0);
 const [checkpointed,setCheckpointed]=useState<Record<number,boolean>>({});
 const [capability,setCapability]=useState<SpeechCapability>(EMPTY_CAPABILITY);
 const [listening,setListening]=useState(false);
 const [micStatus,setMicStatus]=useState<SpeechCaptureStatus|'idle'>('idle');
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [mistakes,setMistakes]=useState(0);
 const [hints,setHints]=useState(0);
 const [voiceRecognized,setVoiceRecognized]=useState(0);
 const [saveError,setSaveError]=useState('');
 const [parentGateOpen,setParentGateOpen]=useState(false);
 const [parentConsentOpen,setParentConsentOpen]=useState(false);
 const [parentAcknowledged,setParentAcknowledged]=useState(false);
 const [browserServiceApproved,setBrowserServiceApproved]=useState(false);
 const [browserServiceAvailable,setBrowserServiceAvailable]=useState(false);
 const [failedRecognitionCount,setFailedRecognitionCount]=useState(0);
 const [parentDiagnostic,setParentDiagnostic]=useState('');
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const completionSessionId=useRef<string|null>(null);
 const generation=useRef(0);
 const locked=useRef(false);
 const startedAt=useRef(Date.now());
 const mission=HARBOR_EPISODES[episode-1];
 const script=getHarborEpisodeSteps(episode,englishLevel);
 const activeStep=script[Math.min(question,script.length-1)];
 const prompt=activeStep.step;
 const quest=activeStep.quest;
 const questStep=activeStep.questStep;
 const sceneRequiresSelection=questStep===0&&quest.action!=='meet';
 const canAnswer=!sceneRequiresSelection||sceneSelected;
 const activeCapability:SpeechCapability=browserServiceApproved&&browserServiceAvailable
  ?{mode:'web-browser',installable:false,message:'Konuşmaya hazırım.'}
  :capability;
 const close=useCallback(()=>{
  generation.current++;stopSpeechCapture();soundService.setCaptureActive(false);soundService.cancelSpeech();
  if(timer.current)clearTimeout(timer.current);
  onBack();
 },[onBack]);
 useEffect(()=>{
  let live=true;
  void speechCapability().then(result=>{if(live)setCapability(result);});
  setBrowserServiceAvailable(canOfferBrowserSpeechService());
  void getProgressRepository().getAllLevelProgress(HARBOR_GAME_ID,profileId)
   .then(levels=>{
    if(!live)return;
    let count=0;
    for(let index=1;index<=HARBOR_EPISODES.length;index++){
     if(!levels[index]||levels[index].completedCount<=0)break;
     count++;
    }
    setCompleted(count);
    setLevelPlays(Object.fromEntries(
     Array.from({length:HARBOR_EPISODES.length},(_,i)=>[i+1,levels[i+1]?.completedCount??0])
    ));
    setCheckpointed(Object.fromEntries(
     Array.from({length:HARBOR_EPISODES.length},(_,i)=>
      [i+1,Boolean(readHarborCheckpoint(profileId,englishLevel,i+1))])
    ));
   }).catch(()=>{if(live)setSaveError('Kayıtlı görevler okunamadı. Sonraki bölüm için önce bağlantını kontrol et.');});
  const stopOnBackground=()=>{if(document.hidden){
   generation.current++;stopSpeechCapture();soundService.setCaptureActive(false);setListening(false);
  }};
  document.addEventListener('visibilitychange',stopOnBackground);
  return()=>{document.removeEventListener('visibilitychange',stopOnBackground);
   live=false;generation.current++;stopSpeechCapture();soundService.setCaptureActive(false);
   if(timer.current)clearTimeout(timer.current);
   soundService.cancelSpeech();
  };
 },[profileId,englishLevel]);
 const start=(id:number)=>{
  if(id>completed+1||busy)return;
  generation.current++;
  completionSessionId.current=null;
  soundService.unlockAudio();stopSpeechCapture();soundService.cancelSpeech();
  if(timer.current)clearTimeout(timer.current);
  const checkpoint=readHarborCheckpoint(profileId,englishLevel,id);
  setEpisode(id);setQuestion(checkpoint?.step??0);
  setSceneSelected(Boolean(checkpoint&&checkpoint.step%3!==0));setSceneResolved(false);
  setMistakes(checkpoint?.mistakes??0);setHints(checkpoint?.hints??0);
  setVoiceRecognized(checkpoint?.voiceRecognized??0);setReplayIndex(levelPlays[id]??0);
  setFeedback('');setSaveError('');setParentDiagnostic('');setMicStatus('idle');setPhase('playing');locked.current=false;startedAt.current=Date.now();
  soundService.playSfx('tap',.5);
 };
 const speak=()=>{
  if(busy||listening)return;
  soundService.unlockAudio();
  soundService.speakEnglish(prompt.line,{rate:gradeLevel!==null&&gradeLevel<=2?.77:englishLevel==='A2'?.93:.83});
 };
 const selectSceneObject=(id:HarborPropId)=>{
  if(sceneSelected||busy||locked.current||listening)return;
  if(id!==quest.item){
   setFeedback('Biraz daha bakalım! Doğru nesneyi bulabilirsin.');
   soundService.playSfx('gentle_retry',.35);return;
  }
  setSceneSelected(true);setFeedback('Bulduk! Şimdi arkadaşımızı dinle. ✨');
  soundService.playSfx('correct',.55);
 };
 useEffect(()=>{
  if(phase!=='playing'||!canAnswer)return;
  const handle=window.setTimeout(()=>{
   if(!document.hidden&&!locked.current){
    soundService.speakEnglish(prompt.line,{rate:gradeLevel!==null&&gradeLevel<=2?.77:englishLevel==='A2'?.92:.83});
   }
  },400);
  return()=>window.clearTimeout(handle);
 },[phase,episode,question,canAnswer,englishLevel,gradeLevel,prompt.line]);
 const save=async(errors:number,assisted:number,recognized:number)=>{
  setBusy(true);setFeedback('Bölüm tamamlandı! Yıldızların kaydediliyor…');
  const independent=Math.max(0,script.length-errors);
  const stars:1|2|3=errors===0&&assisted===0?3:errors<=2?2:1;
  // Reuse the same session id if the server commits but the acknowledgement fails.
  const sessionId=completionSessionId.current??crypto.randomUUID();
  completionSessionId.current=sessionId;
  const payload:GameCompletedPayload={
   sessionId,profileId,gameId:HARBOR_GAME_ID,levelId:episode,
   outcomeId:'en.speaking.harbor.dialogue',success:true,starsEarned:stars,
   score:Math.round(100*independent/script.length),
   metrics:{durationSeconds:Math.max(1,Math.round((Date.now()-startedAt.current)/1000)),
    attemptsCount:script.length+errors,wrongAttempts:errors,hintsUsed:assisted,
    accuracyRate:independent/script.length},
   completedAt:new Date().toISOString()
  };
  try{
   await getProgressRepository().recordGameCompleted(payload,profileId);
   setCompleted(current=>Math.max(current,episode));
   setLevelPlays(prev=>({...prev,[episode]:(prev[episode]??0)+1}));
   clearHarborCheckpoint(profileId,englishLevel,episode);
   setCheckpointed(prev=>({...prev,[episode]:false}));
   setPhase('completed');setFeedback(recognized>0?'Sesinle maceraya renk kattın!':'Macera tamamlandı!');
   soundService.playSfx('fanfare',.7);onSaved();
  }catch(err){
   console.error('[Harbor] progress',err);
   setSaveError('Yıldızlar kaydedilemedi. Tekrar deneyebilirsin; ilerlemeni kaybetmemek için çıkma.');
   locked.current=false;
  }finally{setBusy(false);}
 };
 const correct=(recognizedCount=voiceRecognized)=>{
  if(locked.current||busy||!canAnswer)return;
  locked.current=true;setSceneResolved(true);
  generation.current++;stopSpeechCapture();soundService.setCaptureActive(false);setListening(false);
  setFeedback('Harika! ✨');soundService.playSfx('correct',.7);
  if(timer.current)clearTimeout(timer.current);
  saveHarborCheckpoint(profileId,englishLevel,episode,
   Math.min(question+1,script.length-1),mistakes,hints,recognizedCount);
  setCheckpointed(prev=>({...prev,[episode]:true}));
  timer.current=setTimeout(()=>{
   if(question+1>=script.length){void save(mistakes,hints,recognizedCount);return;}
   const next=script[question+1];
   setSceneSelected(next.quest.id===quest.id);
   setSceneResolved(false);
   setQuestion(q=>q+1);
   setFeedback('');locked.current=false;
  },1000);
 };
 const tap=(choice:string)=>{
  if(busy||locked.current||listening||!canAnswer)return;
  if(choice===prompt.reply){correct();return;}
  setMistakes(n=>n+1);setFeedback('Bir daha deneyelim! Kaptanı dinle veya ipucunu kullan.');
  soundService.playSfx('gentle_retry',.5);
 };
 const mic=async()=>{
  if(locked.current||busy||listening||!canAnswer)return;
  const run=++generation.current;
  setListening(true);setMicStatus('starting');setFeedback('');
  soundService.cancelSpeech();
  soundService.setCaptureActive(true);
  let result;
  try{
   result=await listenToChild(activeCapability,10000,status=>{
    if(run===generation.current)setMicStatus(status);
   },prompt.choices,browserServiceApproved);
  }catch{
   // Browser/OS failures are not evidence that the child spoke incorrectly.
   if(run===generation.current){
    setFeedback('Konuşma tanıma başlatılamadı. Mikrofon testini dene veya cevaba dokun.');
    setListening(false);setMicStatus('idle');
   }
   return;
  }finally{
   if(run===generation.current)soundService.setCaptureActive(false);
  }
  if(run!==generation.current)return;
  setListening(false);setMicStatus('idle');
  setParentDiagnostic(
   result.kind==='recognized'?'Konuşma çözümlendi ('+(result.source??'yerel')+').':
   result.kind==='unrecognized'?'Ses algılandı, fakat konuşma motoru metin üretmedi.':
   result.kind==='no-speech'?'Konuşma motoru sesi yakalayamadı.':
   result.kind==='denied'?'Mikrofon izni reddedildi.':
   result.kind==='unavailable'?'Tanıma hizmeti kullanılamıyor ('+(result.reason??'bilinmiyor')+').':
   ''
  );
  if(result.kind==='recognized'){
   if(matchesExpectedSpeech(result.alternatives,prompt.accept)){
    // State setters are async: don't lose the last spoken response on completion.
    const recognizedCount=voiceRecognized+1;
    setVoiceRecognized(recognizedCount);
    correct(recognizedCount);
   }else{
    const heard=result.alternatives[0]?.slice(0,70);
    setFeedback(heard?'💬 “'+heard+'” duydum. Bir daha deneyelim!':
     'Bir daha deneyelim ya da cevabı seçelim!');
   }
  }else if(result.kind==='unrecognized'){
   setFailedRecognitionCount(n=>n+1);
   setFeedback('🎤 Sesini duydum! Bir daha deneyelim ya da doğru cevabı seçelim.');
  }else if(result.kind==='heard'){
   setFeedback('🎤 Sesini duydum! Şimdi cevabını seçerek devam edebilirsin.');
  }else if(result.kind==='denied'){
   setFeedback('Mikrofon kapalı. Cevaplardan birini seçerek devam edebilirsin.');
  }else if(result.kind==='no-speech'){
   setFailedRecognitionCount(n=>n+1);
   setFeedback('Seni henüz duyamadım. İstersen yeniden dene!');
  }else if(result.kind==='unavailable'){
   setFailedRecognitionCount(n=>n+1);
   const errorMessage:Record<string,string>={
    'microphone-error':'Tarayıcı mikrofona erişemedi. Windows ses girişini ve mikrofon iznini kontrol et.',
    'language-pack':'Cihazdaki İngilizce konuşma paketi başlatılamıyor. Ses paketini yeniden kontrol et.',
    'not-started':'Konuşma motoru mikrofonu başlatamadı. Mikrofon testini kullan veya tarayıcıyı yeniden aç.',
    'service-unavailable':'Tarayıcının yerel konuşma tanıması hata verdi. Mikrofonu test et; gerekirse farklı tarayıcı kullan.'
   };
   setParentDiagnostic(errorMessage[result.reason??'']??'Yerel konuşma tanıma şu anda kullanılamıyor.');
   setFeedback('🎤 Biraz daha deneyelim! İstersen cevabını seçebilirsin.');
   if(capability.mode==='web-local'&&!browserServiceApproved){
    // An "available" response is not a guarantee that recognition actually starts.
    // Avoid repeated identical failures and never switch to a remote service.
    const updated=await speechCapability();
    if(run!==generation.current)return;
    setCapability(updated.mode==='web-local'?{
     mode:'practice',installable:false,
     message:'Yerel tanıma başlatılamadı. Sesli pratik ve dokunmatik cevap kullanılabilir.'
    }:updated);
   }
  }
 };
 const testMic=async()=>{
  if(locked.current||busy||listening)return;
  const run=++generation.current;
  setListening(true);setMicStatus('testing');setFeedback('');
  soundService.cancelSpeech();soundService.setCaptureActive(true);
  let result;
  try{
   result=await testMicrophoneInput(5000,status=>{
    if(run===generation.current)setMicStatus(status);
   });
  }finally{
   if(run===generation.current)soundService.setCaptureActive(false);
  }
  if(run!==generation.current)return;
  setListening(false);setMicStatus('idle');
  if(result.kind==='heard'){
   setParentDiagnostic('Mikrofon ses alıyor. Konuşma tanıma ayrı bir özelliktir.');
   setFeedback('✅ Sesin geliyor! Hadi tekrar deneyelim.');
  }else if(result.kind==='denied'){
   setParentDiagnostic('Mikrofon izni tarayıcıdan/işletim sisteminden verilmemiş.');
   setFeedback('Mikrofonu açabilir ya da cevabını seçebilirsin.');
  }else{
   setParentDiagnostic('Mikrofon testinde ses algılanmadı. Giriş cihazı, izin ve ses seviyesini kontrol edin.');
   setFeedback('Seni duyamadım. İstersen bir daha deneyelim!');
  }
 };
 const recheckSpeech=async()=>{
  if(busy||listening)return;
  setBusy(true);
  try{
   const state=await speechCapability();
   setCapability(state);
   setParentDiagnostic(state.mode==='web-local'?'Cihaz içi tanıma kullanılabilir görünüyor; başarı garanti değil.':state.message);
   setFeedback('Konuşmayı yeniden deneyebilirsin!');
  }finally{setBusy(false);}
 };
 const install=async()=>{
  setBusy(true);const ok=await installLocalEnglish();
  setCapability(await speechCapability());setBusy(false);
  setParentDiagnostic(ok?'Ses tanıma desteği hazır görünüyor. Gerçek performansı cihazda test edin.':'Ses desteği indirilemedi; dokunmatik cevaplar çalışmaya devam eder.');
  setFeedback(ok?'Artık konuşmayı yeniden deneyebilirsin!':'Cevabı seçerek de devam edebilirsin.');
 };
 const backToMap=()=>{
  generation.current++;stopSpeechCapture();soundService.setCaptureActive(false);soundService.cancelSpeech();
  if(timer.current)clearTimeout(timer.current);locked.current=false;
  setPhase('map');setSceneSelected(false);setSceneResolved(false);
  setFeedback('');setSaveError('');setMicStatus('idle');setParentDiagnostic('');
 };
 const options=harborChoiceOrder(prompt,englishLevel,question,replayIndex);
 return <div className="harbor-root" role="dialog" aria-modal="true" aria-label="Diyalog Limanı">
  <header className="harbor-header">
   <button type="button" className="harbor-back" onClick={phase==='map'?close:backToMap} aria-label={phase==='map'?'Adalar Evreni’ne dön':'Bölümlere dön'}>←</button>
   <div><small>VENTRA · KONUŞARAK İNGİLİZCE</small><h1>Diyalog Limanı</h1></div>
   <div className="harbor-progress">⭐ {completed}/{HARBOR_EPISODES.length}</div>
  </header>
  <main className="harbor-main">
   <div className="harbor-cover" aria-hidden="true"/>
   {phase==='map'?<>
    <div className="harbor-intro"><span>⚓ KAPTANIN SANA BİR MESAJI VAR!</span>
     <h2>Konuş, Dinle, Maceraya Katıl!</h2>
     <p>Beş eğlenceli yolculukta İngilizce konuşmayı keşfet. Mikrofon isteğe bağlı; her görevi dokunarak da tamamlayabilirsin.</p>
    </div>
    <div className="harbor-episode-grid">
     {HARBOR_EPISODES.map(item=><button type="button" key={item.id}
       disabled={item.id>completed+1||busy}
       onClick={()=>start(item.id)} className="harbor-episode-card">
       <span className="harbor-episode-thumb"><img
        src={HARBOR_SCENE_ASSETS[getHarborEpisodeQuests(item.id)[0].place].desktop} alt=""
        loading="lazy" draggable={false}/></span>
       <span className="harbor-episode-icon">{item.icon}</span>
       <span className="harbor-episode-number">BÖLÜM {String(item.id).padStart(2,'0')}</span>
       <strong>{item.title}</strong>
       <small>{getHarborEpisodeQuests(item.id).length} görev · {item.subtitle}</small>
       <span className="harbor-episode-state">{checkpointed[item.id]?'▶ Kaldığın Yerden':item.id<=completed?'✓ Tekrar Oyna':item.id===completed+1?'Maceraya Gir →':'🔒 Önceki Bölüm'}</span>
      </button>)}
    </div>
   </>:phase==='playing'?<>
    <div className="harbor-level-title"><span>{mission.icon} {mission.title}</span>
      <span>{englishLevel} · {question+1}/{script.length}</span>
     </div>
    <div className="hp-quest-top">
     <span>{quest.title} — {Math.floor(question/3)+1}/3 görev</span>
     <div className="hp-progress-track" aria-label="Bölüm ilerlemesi">
      <i style={{width:((question+1)/script.length*100)+'%'}}/>
     </div>
    </div>
    <HarborSceneStage key={quest.id} quest={quest} questStep={questStep}
     selected={sceneSelected} resolved={sceneResolved} onSelect={selectSceneObject}
     onSpeak={speak} speakerLine={prompt.line} speaking={listening||busy}/>
    <div className="hp-quest-text">
     {quest.mission}
     <small>{canAnswer?'Dinle ve cevap ver. Doğru cevapla dünya değişsin!':
      'Sahnedeki doğru nesneye dokunarak işe başla.'}</small>
    </div>
    <div className="harbor-talk">
     <div className="harbor-talk-title"><strong>Sen ne dersin?</strong><span>Doğru ifadeyi söyle veya seç!</span></div>
     {canAnswer?<div className="harbor-answer-grid">
      {options.map((option,i)=><button type="button" key={option}
        data-level={englishLevel}
        disabled={busy||listening||locked.current} onClick={()=>tap(option)}
        className="harbor-answer"><span>{String.fromCharCode(65+i)}</span>{option}</button>)}
     </div>:<p className="hp-need-interaction">Önce sahnedeki nesneyi keşfet! 🔎</p>}
     <div className="harbor-microphone">
      <button type="button" onClick={()=>void mic()} disabled={busy||listening||locked.current||!canAnswer||activeCapability.mode==='none'}
       className="harbor-mic-button" aria-label={listening?'Dinleniyor':'Mikrofonla konuş'}>
       {listening?'🎙️ Dinliyorum…':activeCapability.mode==='practice'?'🎤 Sesli Pratik Yap':'🎤 Konuşarak Cevapla'}
      </button>
      {listening&&<button type="button" onClick={()=>{
       generation.current++;stopSpeechCapture();soundService.setCaptureActive(false);
       setListening(false);setMicStatus('idle');
      }} className="harbor-stop">Dur ✕</button>}
      <small className="harbor-child-caption">{activeCapability.mode==='practice'
       ?'Mikrofon sesini duyar; devam etmek için cevaba dokun.'
       :activeCapability.mode==='none'?'Mikrofon olmadan da cevaba dokunabilirsin.'
       :'Dinle, söyle veya cevaba dokun! ✨'}</small>
     </div>
     {listening&&<p className="harbor-mic-live" role="status" aria-live="polite">{
      micStatus==='starting'?'🎤 Hazırlanıyorum…':
      micStatus==='microphone-ready'?'🟢 Seni dinliyorum! Şimdi söyle.':
      micStatus==='speech-detected'?'🎤 Duydum!':
      micStatus==='processing'?'✨ Bakalım ne söyledin…':
      '🎚️ Seni dinliyorum…'
     }</p>}
     <details className="harbor-parent-tools">
      <summary>👪 Veliler için ses seçenekleri</summary>
      <div className="harbor-parent-content">
       <p>Çocuk için mikrofon zorunlu değil. Cihazdaki İngilizce tanıma her zaman doğru çalışmayabilir.</p>
       <div className="harbor-parent-actions">
        <button type="button" onClick={()=>void testMic()} disabled={busy||listening||locked.current}
         className="harbor-mic-test">🎚️ Mikrofonu Test Et</button>
        <button type="button" onClick={()=>void recheckSpeech()} disabled={busy||listening||locked.current}
         className="harbor-recheck">↻ Cihazdaki Tanımayı Kontrol Et</button>
        {capability.installable&&<button type="button" disabled={busy||listening||locked.current}
         className="harbor-download" onClick={()=>void install()}>⬇ İngilizce konuşma desteğini kur</button>}
       </div>
       {parentDiagnostic&&<p className="harbor-parent-diagnostic" role="status">{parentDiagnostic}</p>}
       {browserServiceAvailable&&<div className="harbor-parent-provider">
        {browserServiceApproved?<>
         <strong>Tarayıcı konuşma hizmeti: Bu oturumda açık</strong>
         <p>Sesi tarayıcı sağlayıcısı işleyebilir. Ventra konuşmayı saklamaz.</p>
         <button type="button" className="harbor-recheck" onClick={()=>setBrowserServiceApproved(false)}
          disabled={listening}>Çevrimiçi tanımayı kapat</button>
        </>:<>
         <strong>Ek konuşma tanıma seçeneği</strong>
         <p>{failedRecognitionCount>=2?'Cihaz içi tanıma birkaç kez yanıt vermedi. ':
          'Cihaz içi tanıma çalışmazsa '}Tarayıcının ücretsiz konuşma hizmeti denenebilir.
          Ses tarayıcı sağlayıcısına gönderilebilir; yalnızca veli onayıyla açılır.</p>
         <button type="button" className="harbor-recheck" disabled={busy||listening||locked.current}
          onClick={()=>setParentGateOpen(true)}>🔒 Ebeveyn Ayarı</button>
        </>}
       </div>}
      </div>
     </details>
     <p role="status" aria-live="polite" className="harbor-feedback">{feedback}</p>
     <button type="button" className="harbor-hint" disabled={busy||listening||locked.current}
      onClick={()=>{setHints(x=>x+1);setFeedback('💡 İpucu: '+prompt.reply);}}>
      💡 Yardım Et
     </button>
     {saveError&&<p role="alert" className="harbor-error">{saveError}<button type="button" onClick={()=>void save(mistakes,hints,voiceRecognized)}>Tekrar Kaydet</button></p>}
    </div>
   </>:<>
    <div className="harbor-finale"><div aria-hidden="true">🎉🏆✨</div>
     <h2>{mission.title} Tamamlandı!</h2>
     <p>{feedback}</p>
     <p>İngilizce konuşmaya devam et; her deneme yeni bir keşif!</p>
     <button type="button" onClick={backToMap}>Yeni Maceraya Geç →</button>
    </div>
   </>}
  </main>
  <footer className="harbor-footer">🎤 Mikrofon isteğe bağlıdır. Ventra konuşmaları kaydetmez. Konuşma tanıma telaffuz puanı değildir.</footer>
  <ParentalGateModal isOpen={parentGateOpen} onClose={()=>setParentGateOpen(false)}
   onSuccess={()=>{setParentGateOpen(false);setParentAcknowledged(false);setParentConsentOpen(true);}}
   zIndex={160}
   description="Tarayıcı sağlayıcısının isteğe bağlı konuşma hizmetini açmak yalnızca veli kararıdır. Devam etmek için ebeveyn kontrolünü geçin."/>
  {parentConsentOpen&&<div className="harbor-consent-backdrop" role="presentation">
   <div className="harbor-consent-dialog" role="dialog" aria-modal="true"
    aria-labelledby="harbor-consent-title">
    <h2 id="harbor-consent-title">Ebeveyn Onayı · Konuşma Desteği</h2>
    <p>Ventra'nın cihaz içi tanıması yerine, tarayıcının ücretsiz konuşma hizmetini
     kullanabilirsiniz. <strong>Çocuğun sesi tarayıcı sağlayıcısının sunucusuna
     gönderilebilir.</strong> Ventra ses kaydı veya konuşma metni saklamaz;
     ancak tarayıcı sağlayıcısının veri işlemesini Ventra kontrol etmez.</p>
    <p>Bu seçenek yalnızca bu Diyalog Limanı oturumu boyunca açık kalır.
     İstediğiniz zaman kapatabilirsiniz. Kullanmak zorunda değilsiniz.</p>
    <label><input type="checkbox" checked={parentAcknowledged}
     onChange={e=>setParentAcknowledged(e.target.checked)}/>
     <span>Veli olarak üçüncü taraf ses işleme ihtimalini anladım ve bu oturum için onaylıyorum.</span></label>
    <div className="harbor-consent-actions">
     <button type="button" onClick={()=>setParentConsentOpen(false)}>Vazgeç</button>
     <button type="button" disabled={!parentAcknowledged}
      onClick={()=>{setBrowserServiceApproved(true);setParentConsentOpen(false);
       setFeedback('🎤 Yeniden konuşmayı deneyebilirsin!');}}>Bu Oturum İçin Aç</button>
    </div>
   </div>
  </div>}
 </div>;
}
