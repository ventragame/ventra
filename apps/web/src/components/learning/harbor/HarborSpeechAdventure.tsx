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
import {speechCapability,installLocalEnglish,listenToChild,listenToIndependentSpeech,stopSpeechCapture,type SpeechCapability,type SpeechCaptureStatus} from '@/lib/speech/childSpeech';
import {independentSttConfigured,hasAdultSession} from '@/lib/speech/independentTranscription';
import {localSherpaAvailable} from '@/lib/speech/localSherpa';
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
 const [independentEnabled,setIndependentEnabled]=useState(false);
 const [listening,setListening]=useState(false);
 const [micStatus,setMicStatus]=useState<SpeechCaptureStatus|'idle'>('idle');
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [mistakes,setMistakes]=useState(0);
 const [hints,setHints]=useState(0);
 const [voiceRecognized,setVoiceRecognized]=useState(0);
 const [saveError,setSaveError]=useState('');
 const [parentDiagnostic,setParentDiagnostic]=useState('');
 // Store only recognition mode/outcome, never a child's words or audio.
 const [speechDiagnosticCode,setSpeechDiagnosticCode]=useState('');
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
 const activeCapability:SpeechCapability=independentEnabled
  ?{mode:'server-stt',installable:false,
    message:'Yetişkin hesabıyla etkinleştirilmiş bağımsız İngilizce konuşma tanıma.'}
  :capability;
 const speechAvailable=['web-local','web-browser','native-local','sherpa-local','server-stt'].includes(activeCapability.mode);
 const close=useCallback(()=>{
  generation.current++;stopSpeechCapture();soundService.setCaptureActive(false);soundService.cancelSpeech();
  if(timer.current)clearTimeout(timer.current);
  onBack();
 },[onBack]);
 useEffect(()=>{
  let live=true;
  void speechCapability().then(result=>{if(live)setCapability(result);});
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
  setFeedback('');setSaveError('');setParentDiagnostic('');setSpeechDiagnosticCode('');setMicStatus('idle');setPhase('playing');locked.current=false;startedAt.current=Date.now();
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
   const onStatus=(status:SpeechCaptureStatus)=>{
    if(run===generation.current)setMicStatus(status);
   };
   result=independentEnabled
    ?await listenToIndependentSpeech(profileId,10000,onStatus)
    :await listenToChild(activeCapability,10000,onStatus,prompt.choices);
  }catch{
   // Browser/OS failures are not evidence that the child spoke incorrectly.
   if(run===generation.current){
    setFeedback('Konuşma tanıma başlatılamadı. Cevabı seçerek devam edebilirsin.');
    setListening(false);setMicStatus('idle');
   }
   return;
  }finally{
   if(run===generation.current)soundService.setCaptureActive(false);
  }
  if(run!==generation.current)return;
  setListening(false);setMicStatus('idle');
  setSpeechDiagnosticCode('mode='+result.mode+', kind='+result.kind+', reason='+(result.reason??'none')+', source='+(result.source??'none'));
  setParentDiagnostic(
   result.kind==='recognized'?'İngilizce konuşma metne dönüştürüldü ('+result.mode+', '+(result.source??'final')+').':
   result.kind==='heard'?'Mikrofon ses algıladı, ancak pratik modu İngilizce kelimeleri tanımaz.':
   result.kind==='unrecognized'?'Ses algılandı, fakat konuşma motoru metin üretmedi. Mod: '+result.mode+'.':
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
   if(result.mode==='web-local'){
    // Local recognizer reported a real voice but produced no words.
    // Repeating the same local provider indefinitely cannot fix this.
    setCapability({mode:'web-browser',installable:false,localAvailable:true,
     message:'Yerel motor kelime üretemedi. Sonraki denemede tarayıcı konuşma hizmeti kullanılacak.'});
    setParentDiagnostic('Yerel konuşma motoru sesi algıladı ancak metin üretmedi. Sonraki deneme farklı motorla yapılacak.');
    setFeedback('🎤 Tekrar söyle! Bu kez farklı bir konuşma motoruyla deneyeceğiz.');
   }else{
    setFeedback(result.mode==='server-stt'
     ?'🎤 Ses algılandı ancak sunucu motoru kelime üretemedi. Yeniden söyle veya cevabı seç.'
     :result.mode==='sherpa-local'
     ?'🎤 Cihaz içi model kelimeyi anlayamadı. Bir kez daha söyle veya cevaba dokun.'
     :'🎤 Ses algılandı ama tarayıcı kelime üretemedi. Tekrar söyle veya cevabı seç.');
   }
  }else if(result.kind==='heard'){
   setFeedback('Mikrofon sesi algıladı ancak konuşma tanıma yok. Cevabı seçerek devam et.');
  }else if(result.kind==='denied'){
   setFeedback('Mikrofon kapalı. Cevaplardan birini seçerek devam edebilirsin.');
  }else if(result.kind==='no-speech'){
   setFeedback('Seni henüz duyamadım. İstersen yeniden dene!');
  }else if(result.kind==='unavailable'){
   const errorMessage:Record<string,string>={
    'microphone-error':'Tarayıcı mikrofona erişemedi. Mikrofon iznini ve giriş aygıtını kontrol et.',
    'language-pack':'Cihazdaki İngilizce konuşma paketi başlatılamıyor. Ses paketini yeniden kontrol et.',
    'not-started':'Konuşma motoru başlatılamadı. Tarayıcıyı yeniden açıp tekrar dene.',
    'service-unavailable':'Tarayıcının konuşma tanıma motoru çalışmıyor.',
    'service-blocked':'Tarayıcı konuşma hizmetini engelledi. Farklı tarayıcıyı dene.',
    'network-error':'Tarayıcı konuşma sunucusuna erişemedi. Bağlantıyı veya ağ engellerini kontrol et.',
    'context-unsupported':'Tarayıcı deneysel konuşma ipuçlarını desteklemiyor.',
    'start-failed':'Konuşma tanıma tarayıcı tarafından başlatılamadı.',
    'service-aborted':'Tarayıcı konuşma motoru kendiliğinden iptal etti. Web Speech bu cihazda güvenilir çalışmıyor.',
    'timeout':'Tarayıcı konuşma motoru sonuç üretmeden takıldı. Bağımsız tanıma seçeneği kullanılabilir.',
    'backend-not-configured':'Bağımsız STT henüz sunucuda yapılandırılmadı.',
    'transcription-not-configured':'Sunucuda konuşma tanıma anahtarı eksik.',
    'authentication-required':'Bağımsız tanıma için yetişkin hesabıyla giriş yapmalısın.',
    'adult-login-required':'Yetişkin oturumu sona erdi. Yeniden giriş yap.',
    'not-authorized-or-rate-limited':'Bu hesap için ses tanıma kotası doldu veya çocuk profiline erişim izni bulunmuyor.',
    'quota-unavailable':'Konuşma kotası sunucuda henüz yapılandırılmadı.',
    'provider-rate-limited':'Konuşma hizmeti yoğun. Biraz sonra tekrar dene.',
    'provider-unavailable':'Bağımsız konuşma sağlayıcısı yanıt vermedi.',
    'provider-timeout-or-network':'Konuşma sağlayıcısına bağlantı zaman aşımına uğradı.',
    'recording-unsupported':'Tarayıcı ses kaydı yapmayı desteklemiyor.',
    'audio-too-large':'Ses kaydı izin verilen boyutu aştı.',
    'origin-denied':'Bu adres konuşma hizmeti için yetkilendirilmemiş.',
    'backend-error':'Bağımsız konuşma tanıma sunucusu yanıt vermedi.',
    'model-initialize':'İngilizce sherpa-onnx modeli hazırlanamadı. Model dosyalarını kontrol et.',
    'model-missing':'Yerel İngilizce model dosyaları henüz bulunamadı.',
    'model-invalid':'İngilizce model bildirimi geçersiz.',
    'model-download':'İngilizce model indirilemedi.',
    'model-integrity':'İngilizce model doğrulaması başarısız.',
    'model-incomplete':'İngilizce model dosyaları eksik.',
    'model-not-ready':'Yerel model henüz hazır değil.',
    'decode-failed':'Yerel İngilizce tanıma motoru çözümlenemedi.',
    'decoder-timeout':'Yerel İngilizce konuşma çözümlemesi zaman aşımına uğradı.',
    'wasm-worker-error':'Tarayıcı WebAssembly worker başlatamadı.',
    'audio-pipeline-failed':'Cihazın mikrofon ses akışı başlatılamadı.',
    'stream-create':'Yerel konuşma akışı oluşturulamadı.'
   };
   const diagnostic=errorMessage[result.reason??'']??'Konuşma tanıma bu cihazda kullanılamıyor.';
   setParentDiagnostic(diagnostic);
   setFeedback('Konuşma tanıma bu denemede çalışmadı. Yeniden söyle ya da cevabı seç.');
   if(activeCapability.mode==='sherpa-local'&&result.reason!=='microphone-error'&&
      result.reason!=='permission-denied'){
    const browser=await speechCapability(false,true);
    if(run!==generation.current)return;
    setCapability(browser);
    setParentDiagnostic('Cihaz içi sherpa-onnx çalıştırılamadı ('+(result.reason??'bilinmiyor')+'). Tarayıcı motoruna geçildi; istersen dokunarak cevap verebilirsin.');
   }else if(activeCapability.mode==='web-local'&&result.reason!=='microphone-error'&&
      result.reason!=='permission-denied'){
    // Next user click may try the browser provider; don't fake recognition.
    setCapability({mode:'web-browser',installable:false,localAvailable:true,
     message:'Yerel tanıma başarısız oldu; bir sonraki denemede tarayıcı hizmeti kullanılacak.'});
    setFeedback('Cihaz içi tanıma yanıt vermedi. Yeniden konuşmayı deneyebilirsin.');
   }
  }
 };
 const toggleIndependent=async()=>{
  if(independentEnabled){
   setIndependentEnabled(false);
   setParentDiagnostic('Tarayıcı konuşma tanımasına geri dönüldü.');
   return;
  }
  if(!independentSttConfigured()){
   setParentDiagnostic('Bağımsız konuşma hizmeti henüz yapılandırılmadı.');
   return;
  }
  setBusy(true);
  try{
   if(!(await hasAdultSession())){
    setParentDiagnostic('Bağımsız konuşma hizmetini kullanmak için önce yetişkin hesabıyla giriş yap.');
    return;
   }
   // Explicit adult-side choice; do not auto-upload child audio after Web Speech failure.
   setIndependentEnabled(true);
   setParentDiagnostic('Bağımsız konuşma tanıma açık. Kısa ses kaydı yalnızca tanıma amacıyla sağlayıcıya gönderilir; Ventra kaydı saklamaz.');
  }finally{setBusy(false);}
 };
 const selectBrowserEngine=async()=>{
  if(busy||listening)return;
  setBusy(true);
  try{
   setCapability(await speechCapability(false,true));
   setParentDiagnostic('Tarayıcının konuşma motoru seçildi. Sesi tarayıcı sağlayıcısı işleyebilir.');
  }finally{setBusy(false);}
 };
 const selectSherpaEngine=async()=>{
  if(busy||listening)return;
  setBusy(true);
  try{
   if(await localSherpaAvailable()){
    setCapability({mode:'sherpa-local',installable:false,
     message:'Ventra İngilizce konuşmayı cihaz üzerinde, ücretsiz sherpa-onnx modeliyle tanır.'});
    setParentDiagnostic('Cihaz içi model seçildi. İlk konuşma denemesinde modelin yüklenmesi biraz sürebilir.');
   }else setParentDiagnostic('Cihaz içi model henüz hazır değil. npm run speech:prepare ile model dosyaları hazırlanmalı.');
  }finally{setBusy(false);}
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
 const chooseOffline=async()=>{
  if(busy||listening)return;
  setBusy(true);
  try{
   const offline=await speechCapability(true);
   setCapability(offline);
   setParentDiagnostic(offline.mode==='web-local'
    ?'Cihaz içi tanıma seçildi. Bu motor kelime üretmezse tarayıcı motoruna dönülecek.'
    :'Cihaz içi tanıma hazır değil. Tarayıcı motoru kullanılacak.');
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
  setFeedback('');setSaveError('');setMicStatus('idle');setParentDiagnostic('');setSpeechDiagnosticCode('');
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
      <button type="button" onClick={()=>void mic()} disabled={busy||listening||locked.current||!canAnswer||!speechAvailable}
       className="harbor-mic-button" aria-label={listening?'Dinleniyor':'Mikrofonla konuş'}>
       {listening?'🎙️ Dinliyorum…':'🎤 Konuşarak Cevapla'}
      </button>
      {listening&&<button type="button" onClick={()=>{
       generation.current++;stopSpeechCapture();soundService.setCaptureActive(false);
       setListening(false);setMicStatus('idle');
      }} className="harbor-stop">Dur ✕</button>}
      <small className="harbor-child-caption">{speechAvailable
        ?'Dinle, söyle veya cevaba dokun! ✨'
        :'Bu cihazda sesli cevap desteklenmiyor; cevabı seç.'}</small>
     </div>
     {!speechAvailable&&<p className="harbor-speech-help harbor-speech-help-static">
       Bu tarayıcı konuşmayı metne çeviremiyor. Cevabı seçerek devam edebilirsin.
      </p>}
     {listening&&<p className="harbor-mic-live" role="status" aria-live="polite">{
      micStatus==='model-loading'?'⏳ İngilizce tanıma modeli hazırlanıyor…':
      micStatus==='starting'?'🎤 Hazırlanıyorum…':
      micStatus==='microphone-ready'?'🟢 Seni dinliyorum! Şimdi söyle.':
      micStatus==='speech-detected'?'🎤 Ses algılandı, kelimeler bekleniyor…':
      micStatus==='processing'?'⏳ İngilizce yanıt çözümleniyor…':
      '🎚️ Seni dinliyorum…'
     }</p>}
     <details className="harbor-parent-tools">
      <summary>Ses tanıma çalışmıyor mu?</summary>
      <div className="harbor-parent-content">
       <p>Varsayılan motor: cihaz içi sherpa-onnx (ücretsiz, API anahtarı yok).
        İlk kullanımda yaklaşık 45 MB İngilizce model indirilebilir; ses ve kelimeler cihazda kalır.
        Web Speech API ve yetişkin hesabıyla isteğe bağlı sunucu motoru alternatif olarak korunur.</p>
       <p className="harbor-parent-diagnostic"><strong>Tanıma motoru:</strong> {activeCapability.mode}. {activeCapability.message}</p>
       {parentDiagnostic&&<p className="harbor-parent-diagnostic" role="status">{parentDiagnostic}</p>}
       {speechDiagnosticCode&&<p className="harbor-parent-diagnostic" role="status">
        <strong>Son deneme:</strong> <code>{speechDiagnosticCode}</code>
       </p>}
       <div className="harbor-parent-actions">
        <button type="button" onClick={()=>void recheckSpeech()} disabled={busy||listening||locked.current}
         className="harbor-recheck">↻ Tekrar kontrol et</button>
        {capability.mode==='sherpa-local'&&<button type="button"
         onClick={()=>void selectBrowserEngine()} disabled={busy||listening||locked.current}
         className="harbor-recheck">Tarayıcı motorunu dene</button>}
        {capability.mode!=='sherpa-local'&&<button type="button"
         onClick={()=>void selectSherpaEngine()} disabled={busy||listening||locked.current}
         className="harbor-recheck">Ücretsiz cihaz içi motoru dene</button>}
        {capability.installable&&<button type="button" onClick={()=>void install()}
         disabled={busy||listening||locked.current} className="harbor-download">
         ⬇ Çevrimdışı İngilizce paketini kur
        </button>}
        {capability.localAvailable&&capability.mode==='web-browser'&&
         <button type="button" onClick={()=>void chooseOffline()}
          disabled={busy||listening||locked.current} className="harbor-recheck">
          Cihaz içi tanımayı dene
         </button>}
        {independentSttConfigured()&&<div className="harbor-stt-option">
         <p>Bağımsız tanıma: Kısa ses kaydı Groq sağlayıcısına işlenmek üzere gönderilebilir.
          Ventra ses kaydını ve konuşma metnini saklamaz. Yalnızca yetişkin hesabıyla kullanılabilir.</p>
         <button type="button" onClick={()=>void toggleIndependent()}
          disabled={busy||listening||locked.current} className="harbor-recheck">
          {independentEnabled?'Tarayıcı motorunu kullan':'Bağımsız konuşma tanımayı etkinleştir'}
         </button>
        </div>}
       </div>
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
  <footer className="harbor-footer">🎤 Mikrofon isteğe bağlıdır. Seçilen sağlayıcı sesi işleyebilir; Ventra ses kaydını ve transkripti saklamaz.</footer>
  </div>;
}
