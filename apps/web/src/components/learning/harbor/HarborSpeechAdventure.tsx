'use client';

import React,{useCallback,useEffect,useRef,useState} from 'react';
import type {GameCompletedPayload} from '@ventra/shared';
import {getProgressRepository} from '@/lib/progress';
import {soundService} from '@/lib/audio/SoundService';
import {HARBOR_EPISODES,HARBOR_GAME_ID,matchesExpectedSpeech,type HarborLevel} from '@/lib/learning/harborDialogueEngine';
import {getHarborEpisodeSteps,getHarborEpisodeQuests,harborChoiceOrder} from '@/lib/learning/harborMissionEngine';
import {HARBOR_SCENE_ASSETS} from '@/lib/learning/harborSceneAssets';
import {harborCoachHint,harborRetryMessage} from '@/lib/learning/harborGamePolish';
import {HarborSceneStage,type HarborPropId} from './HarborSceneStage';
import {HarborCaptainAvatar,type HarborCaptainMood} from './HarborCaptainAvatar';
import {LearningMotion} from '@/components/learning/motion/LearningMotion';
import {readHarborCheckpoint,saveHarborCheckpoint,clearHarborCheckpoint} from '@/lib/learning/harborCheckpoint';
import {speechCapability,installLocalEnglish,listenToChild,listenToIndependentSpeech,stopSpeechCapture,type SpeechCapability,type SpeechCaptureStatus} from '@/lib/speech/childSpeech';
import {independentSttConfigured,hasAdultSession} from '@/lib/speech/independentTranscription';
import {localSherpaAvailable} from '@/lib/speech/localSherpa';
import {ParentalGateModal} from '@/components/profile/ParentalGateModal';
import {HarborSpeechAdultPanel} from './HarborSpeechAdultPanel';
import './harbor-speech.css';
import './harbor-premium-scene.css';
import './harbor-captain-avatar.css';

type Props={profileId:string;englishLevel:HarborLevel;gradeLevel:number|null;onBack:()=>void;onSaved:()=>void};
type Phase='map'|'playing'|'completed';
type HarborSummary={stars:1|2|3;score:number;spoken:number};
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
 const [narrating,setNarrating]=useState(false);
 const [micStatus,setMicStatus]=useState<SpeechCaptureStatus|'idle'>('idle');
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [mistakes,setMistakes]=useState(0);
 const [hints,setHints]=useState(0);
 const [hintStage,setHintStage]=useState(0);
 const [modeledAnswer,setModeledAnswer]=useState(false);
 const [wrongChoices,setWrongChoices]=useState<readonly string[]>([]);
 const [wrongSceneObjects,setWrongSceneObjects]=useState<readonly HarborPropId[]>([]);
 const [summary,setSummary]=useState<HarborSummary|null>(null);
 const [voiceRecognized,setVoiceRecognized]=useState(0);
 const [saveError,setSaveError]=useState('');
 const [parentDiagnostic,setParentDiagnostic]=useState('');
 const [parentGateOpen,setParentGateOpen]=useState(false);
 const [parentToolsOpen,setParentToolsOpen]=useState(false);
 const [speechNeedsHelp,setSpeechNeedsHelp]=useState(false);
 // Store only recognition mode/outcome, never a child's words or audio.
 const [speechDiagnosticCode,setSpeechDiagnosticCode]=useState('');
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const completionSessionId=useRef<string|null>(null);
 const generation=useRef(0);
 const narrationRun=useRef(0);
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
 const openAdultSettings=()=>{
  generation.current++;narrationRun.current++;setNarrating(false);
  stopSpeechCapture();soundService.setCaptureActive(false);soundService.cancelSpeech();
  setListening(false);setMicStatus('idle');setParentGateOpen(true);
 };
 const closeAdultSettings=()=>{setParentGateOpen(false);setParentToolsOpen(false);};
 const close=useCallback(()=>{
  generation.current++;narrationRun.current++;setNarrating(false);stopSpeechCapture();soundService.setCaptureActive(false);soundService.cancelSpeech();
  if(timer.current)clearTimeout(timer.current);
  setParentGateOpen(false);setParentToolsOpen(false);onBack();
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
   generation.current++;narrationRun.current++;setNarrating(false);soundService.cancelSpeech();
   stopSpeechCapture();soundService.setCaptureActive(false);setListening(false);
   setParentGateOpen(false);setParentToolsOpen(false);
  }};
  document.addEventListener('visibilitychange',stopOnBackground);
  return()=>{narrationRun.current++;document.removeEventListener('visibilitychange',stopOnBackground);
   live=false;generation.current++;stopSpeechCapture();soundService.setCaptureActive(false);
   if(timer.current)clearTimeout(timer.current);
   soundService.cancelSpeech();
  };
 },[profileId,englishLevel]);
 const start=(id:number)=>{
  if(id>completed+1||busy)return;
  generation.current++;narrationRun.current++;setNarrating(false);
  completionSessionId.current=null;
  soundService.unlockAudio();stopSpeechCapture();soundService.cancelSpeech();
  if(timer.current)clearTimeout(timer.current);
  const checkpoint=readHarborCheckpoint(profileId,englishLevel,id);
  setEpisode(id);setQuestion(checkpoint?.step??0);
  setSceneSelected(Boolean(checkpoint&&checkpoint.step%3!==0));setSceneResolved(false);
  setMistakes(checkpoint?.mistakes??0);setHints(checkpoint?.hints??0);
  setHintStage(0);setWrongChoices([]);setWrongSceneObjects([]);setModeledAnswer(false);setSummary(null);
  setVoiceRecognized(checkpoint?.voiceRecognized??0);setReplayIndex(levelPlays[id]??0);
  setFeedback('');setSaveError('');setParentDiagnostic('');setSpeechDiagnosticCode('');setMicStatus('idle');closeAdultSettings();setSpeechNeedsHelp(false);setPhase('playing');locked.current=false;startedAt.current=Date.now();
  soundService.playSfx('tap',.5);
 };
 const speakLine=(line:string)=>{
  if(busy||listening||locked.current)return;
  soundService.unlockAudio();
  const run=++narrationRun.current;
  setNarrating(false);
  const started=soundService.speakEnglish(line,{
   rate:gradeLevel!==null&&gradeLevel<=2?.77:englishLevel==='A2'?.93:.83,
   onStart:()=>{if(run===narrationRun.current)setNarrating(true);},
   onEnd:()=>{if(run===narrationRun.current)setNarrating(false);},
   onError:()=>{if(run===narrationRun.current)setNarrating(false);}
  });
  if(!started)setNarrating(false);
 };
 const speak=()=>speakLine(prompt.line);
 const speakReply=()=>speakLine(prompt.reply);
 const selectSceneObject=(id:HarborPropId)=>{
  if(sceneSelected||busy||locked.current||listening)return;
  if(id!==quest.item){
   if(!wrongSceneObjects.includes(id)){
    setWrongSceneObjects(previous=>[...previous,id]);
    setMistakes(count=>count+1);
   }
   setFeedback('Bir daha bakalım! Bu eşya değil; diğerini dene.');
   soundService.playSfx('gentle_retry',.35);return;
  }
  setSceneSelected(true);setFeedback('Bulduk! Şimdi arkadaşımızı dinle. ✨');
  soundService.playSfx('correct',.55);
 };
 useEffect(()=>{
  if(phase!=='playing'||!canAnswer||parentGateOpen||parentToolsOpen)return;
  const handle=window.setTimeout(()=>{
   if(!document.hidden&&!locked.current){
    speak(); // Real narration callbacks drive the captain mouth.
   }
  },400);
  return()=>window.clearTimeout(handle);
 },[phase,episode,question,canAnswer,englishLevel,gradeLevel,prompt.line,parentGateOpen,parentToolsOpen]);
 const save=async(errors:number,assisted:number,recognized:number)=>{
  narrationRun.current++;setNarrating(false);
  setBusy(true);setFeedback('Bölüm tamamlandı! Yıldızların kaydediliyor…');
  const independent=Math.max(0,script.length-errors);
  const stars:1|2|3=errors===0&&assisted===0?3:errors<=2?2:1;
  const score=Math.max(0,Math.round(100*independent/script.length));
  // Reuse the same session id if the server commits but the acknowledgement fails.
  const sessionId=completionSessionId.current??crypto.randomUUID();
  completionSessionId.current=sessionId;
  const payload:GameCompletedPayload={
   sessionId,profileId,gameId:HARBOR_GAME_ID,levelId:episode,
   outcomeId:'en.speaking.harbor.dialogue',success:true,starsEarned:stars,
   score,
   metrics:{durationSeconds:Math.max(1,Math.round((Date.now()-startedAt.current)/1000)),
    attemptsCount:script.length+errors,wrongAttempts:errors,hintsUsed:assisted,
    accuracyRate:independent/script.length,
    speakingSteps:{recognized:Math.min(recognized,script.length),
     tapped:Math.max(0,script.length-recognized),assisted}},
   completedAt:new Date().toISOString()
  };
  try{
   await getProgressRepository().recordGameCompleted(payload,profileId);
   setCompleted(current=>Math.max(current,episode));
   setLevelPlays(prev=>({...prev,[episode]:(prev[episode]??0)+1}));
   clearHarborCheckpoint(profileId,englishLevel,episode);
   setCheckpointed(prev=>({...prev,[episode]:false}));
   setSummary({stars,score,spoken:recognized});
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
  generation.current++;narrationRun.current++;setNarrating(false);
  stopSpeechCapture();soundService.setCaptureActive(false);setListening(false);
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
   setHintStage(0);setModeledAnswer(false);setWrongChoices([]);setWrongSceneObjects([]);
   setFeedback('');locked.current=false;
  },1000);
 };
 const tap=(choice:string)=>{
  if(busy||locked.current||listening||!canAnswer)return;
  if(choice===prompt.reply){correct();return;}
  if(!wrongChoices.includes(choice)){
   setWrongChoices(previous=>[...previous,choice]);
   setMistakes(n=>n+1);
  }
  setFeedback(harborRetryMessage(wrongChoices.length+1));
  soundService.playSfx('gentle_retry',.5);
 };
 // Sample speech is scaffolding, not confirmation that the child pronounced it.
 // Replaying an example is charged as ONE hint per question.
 const hearReply=()=>{
  if(busy||locked.current||listening||!canAnswer)return;
  if(!modeledAnswer){setHints(n=>n+1);setModeledAnswer(true);}
  speakReply();
 };
 const help=()=>{
  if(busy||locked.current||listening||!canAnswer)return;
  const stage=Math.min(3,hintStage+1);
  if(stage>hintStage){setHints(n=>n+1);setHintStage(stage);}
  const hint=harborCoachHint(prompt.reply,englishLevel,stage);
  setFeedback('💡 '+hint.message);
  if(hint.action==='replay-question')speak();
  else if(hint.action==='model-answer'){setModeledAnswer(true);speakReply();}
 };
 const mic=async()=>{
  if(locked.current||busy||listening||!canAnswer)return;
  const run=++generation.current;
  setListening(true);setMicStatus('starting');setFeedback('');setSpeechNeedsHelp(false);
  narrationRun.current++;setNarrating(false);soundService.cancelSpeech();
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
    setSpeechNeedsHelp(true);setParentDiagnostic('Konuşma tanıma başlatılırken beklenmeyen hata oluştu.');
     setFeedback('🎤 Mikrofon bu kez çalışmadı. Cevaba dokunarak devam edebilirsin.');
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
    // Never show uncertain transcripts of a child's speech in play.
    setFeedback('🎤 Sesini duydum! Bir daha söyle veya doğru cevaba dokun.');
   }
  }else if(result.kind==='unrecognized'){
   // Never silently switch from local speech to a different provider.
   setSpeechNeedsHelp(true);
   setFeedback('🎤 Sesini duydum ama kelimeleri seçemedim. Yeniden dene veya cevaba dokun.');
  }else if(result.kind==='heard'){
   setSpeechNeedsHelp(true);setFeedback('🎤 Sesini duydum! İstersen cevaba dokunarak devam et.');
  }else if(result.kind==='denied'){
   setSpeechNeedsHelp(true);setFeedback('🎤 Mikrofon izni kapalı. Cevaba dokunarak devam edebilirsin.');
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
    'wasm-http-404':'WebAssembly dosyası bulunamadı (404). Yerel ses motorunun çalışma dosyaları eksik.',
    'wasm-http-403':'WebAssembly dosyasına erişim engellendi (403).',
    'wasm-http-500':'WebAssembly sunucusu hata döndürdü (500).',
    'wasm-html-or-invalid':'WASM yerine HTML veya hatalı ikili döndü. Ses motorunun dosya adresi yanlış olabilir.',
    'wasm-invalid-size':'WebAssembly dosyası eksik veya hasarlı.',
    'wasm-loader-invalid':'WebAssembly yükleme modülü geçersiz.',
    'wasm-init-invalid':'WebAssembly belleği veya dosya sistemi başlatılamadı.',
    'wasm-api-invalid':'Cihaz içi konuşma motoru API uyumsuzluğu.',
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
    'audio-context-suspended':'Tarayıcı mikrofon ses işleyicisini askıda tuttu. Ekrana dokunup tekrar deneyin.',
    'stream-create':'Yerel konuşma akışı oluşturulamadı.'
   };
   const diagnostic=errorMessage[result.reason??'']??'Konuşma tanıma bu cihazda kullanılamıyor.';
   setParentDiagnostic(diagnostic);setSpeechNeedsHelp(true);
   setFeedback('🎤 Bu kez seni duyamadım. Yeniden dene veya cevaba dokun.');
   if(activeCapability.mode==='sherpa-local'){
    // Keep the selected independent on-device engine. Automatically falling
    // back to Chrome concealed the real WASM error, then retried the already
    // broken Web Speech API. The adult can explicitly choose a fallback.
    setParentDiagnostic('Ventra cihaz içi motoru: '+diagnostic+' (hata: '+(result.reason??'bilinmiyor')+'). Tarayıcı motoruna geçiş yalnızca yetişkin tarafından seçilebilir.');
   }
  }
 };
 const toggleIndependent=async()=>{
  if(independentEnabled){
   setIndependentEnabled(false);
   setParentDiagnostic('Önceki yerel/tarayıcı motoruna dönüldü.');
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
   setIndependentEnabled(false);setCapability(await speechCapability(false,true));
   setParentDiagnostic('Tarayıcının konuşma motoru seçildi. Sesi tarayıcı sağlayıcısı işleyebilir.');
  }finally{setBusy(false);}
 };
 const selectSherpaEngine=async()=>{
  if(busy||listening)return;
  setBusy(true);
  try{
   if(await localSherpaAvailable()){
    setIndependentEnabled(false);
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
   setIndependentEnabled(false);setCapability(state);
   setParentDiagnostic(state.mode==='web-local'?'Cihaz içi tanıma kullanılabilir görünüyor; başarı garanti değil.':state.message);
   setFeedback('Konuşmayı yeniden deneyebilirsin!');
  }finally{setBusy(false);}
 };
 const chooseOffline=async()=>{
  if(busy||listening)return;
  setBusy(true);
  try{
   const offline=await speechCapability(true);
   setIndependentEnabled(false);setCapability(offline);
   setParentDiagnostic(offline.mode==='web-local'
    ?'Cihaz içi tanıma seçildi. Bu motor kelime üretmezse tarayıcı motoruna dönülecek.'
    :'Cihaz içi tanıma hazır değil. Tarayıcı motoru kullanılacak.');
  }finally{setBusy(false);}
 };
 const install=async()=>{
  if(busy||listening)return;
  setBusy(true);
  try{
   const ok=await installLocalEnglish();
   setIndependentEnabled(false);setCapability(await speechCapability());
   setParentDiagnostic(ok?'Yerel ses paketi hazır görünüyor; cihazda kontrol edin.':'Ses paketi kurulamadı; dokunarak devam edilebilir.');
  }catch{setParentDiagnostic('İngilizce ses paketi kurulurken beklenmeyen hata oluştu.');}
  finally{setBusy(false);}
 };
 const backToMap=()=>{
  generation.current++;narrationRun.current++;setNarrating(false);stopSpeechCapture();soundService.setCaptureActive(false);soundService.cancelSpeech();
  if(timer.current)clearTimeout(timer.current);locked.current=false;
  setPhase('map');setSceneSelected(false);setSceneResolved(false);
  setHintStage(0);setModeledAnswer(false);setWrongChoices([]);setWrongSceneObjects([]);setSummary(null);
  setFeedback('');setSaveError('');setMicStatus('idle');setParentDiagnostic('');setSpeechDiagnosticCode('');
  closeAdultSettings();setSpeechNeedsHelp(false);
 };
 const options=harborChoiceOrder(prompt,englishLevel,question,replayIndex);
 // Real TTS events control talk; microphone capture controls listen. The
 // existing NPC art remains intact in quests not spoken by Captain Leo.
 const captainMood:HarborCaptainMood=phase==='completed'?'celebrate':
  listening?'listen':narrating?'talk':sceneResolved?'happy':
  feedback.startsWith('Bir daha')||feedback.startsWith('Biraz daha')||
  feedback.startsWith('🎤 Tekrar')?'try_again':'idle';
 const captainCue=episode+':'+question+':'+Number(sceneSelected)+':'+
  Number(sceneResolved)+':'+Number(listening)+':'+Number(narrating)+':'+feedback;
 return <div className="harbor-root" role="dialog" aria-modal="true" aria-label="Diyalog Limanı">
  <header className="harbor-header">
   <button type="button" className="harbor-back" onClick={phase==='map'?close:backToMap} aria-label={phase==='map'?'Adalar Evreni’ne dön':'Bölümlere dön'}>←</button>
   <div><small>VENTRA · KONUŞARAK İNGİLİZCE</small><h1>Diyalog Limanı</h1></div>
   <div className="harbor-progress">⭐ {completed}/{HARBOR_EPISODES.length}</div>
  </header>
  <main className="harbor-main">
   <div className="harbor-cover" aria-hidden="true"/>
   {phase==='map'?<>
    <div className="harbor-intro harbor-intro-character">
     <div className="harbor-intro-captain">
      <HarborCaptainAvatar mood="idle" cue="harbor-map"/>
     </div>
     <div className="harbor-intro-copy">
      <span>⚓ KAPTAN LEO SENİ BEKLİYOR!</span>
      <h2>Konuş, Dinle, Maceraya Katıl!</h2>
      <p>Beş eğlenceli yolculukta İngilizce konuşmayı keşfet. Mikrofon isteğe bağlı; her görevi dokunarak da tamamlayabilirsin.</p>
     </div>
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
    <div className="harbor-adult-entry"><button type="button" className="harbor-adult-open" onClick={openAdultSettings} disabled={busy}>⚙ Yetişkinler için ses ayarları</button></div>
   </>:phase==='playing'?<>
    <div className="harbor-level-title"><span>{mission.icon} {mission.title}</span>
      <span>{englishLevel} · {question+1}/{script.length}</span>
     </div>
    <div className="hp-quest-top">
     <span>{quest.title} — {Math.floor(question/3)+1}/3 görev</span>
     <div className="hp-progress-track" role="progressbar" aria-label="Bölüm ilerlemesi" aria-valuemin={0} aria-valuemax={script.length} aria-valuenow={question}>
      <i style={{width:(question/script.length*100)+'%'}}/>
     </div>
    </div>
    <HarborSceneStage key={quest.id} quest={quest} questStep={questStep}
     selected={sceneSelected} resolved={sceneResolved} wrongObjects={wrongSceneObjects}
     onSelect={selectSceneObject}
     onSpeak={speak} speakerLine={prompt.line} speaking={listening||busy}
     avatarMood={captainMood} avatarCue={captainCue}/>
    <div className="hp-quest-text">
     {quest.mission}
     <small>{canAnswer?'Dinle, sonra cevabı söyle veya seç!':
      'Sahnedeki doğru nesneye dokunarak işe başla.'}</small>
    </div>
    <div className="harbor-talk">
     <div className="harbor-talk-title"><strong>Sen ne dersin?</strong><span>Doğru ifadeyi söyle veya seç!</span></div>
     {canAnswer?<div className="harbor-answer-grid">
      {options.map((option,i)=><button type="button" key={option}
        data-level={englishLevel}
        data-answer={sceneResolved&&option===prompt.reply?'correct':wrongChoices.includes(option)?'try-again':undefined}
        aria-label={String.fromCharCode(65+i)+'. '+option}
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
       Sesli cevap burada çalışmıyor. Seçeneklerden birine dokunarak devam et.
      </p>}
     {listening&&<p className="harbor-mic-live" role="status" aria-live="polite">{
      micStatus==='model-loading'?'⏳ Mikrofon hazırlanıyor…':
      micStatus==='starting'?'🎤 Hazırlanıyorum…':
      micStatus==='microphone-ready'?'🟢 Seni dinliyorum! Şimdi söyle.':
      micStatus==='speech-detected'?'🎤 Sesini duydum, devam edebilirsin!':
      micStatus==='processing'?'⏳ Cevabına bakıyorum…':
      '🎤 Seni dinliyorum…'
     }</p>}
     {(speechNeedsHelp||!speechAvailable)&&!listening&&<button type="button" className="harbor-adult-help"
      onClick={openAdultSettings} disabled={busy||locked.current}>Bir yetişkinden yardım iste</button>}
     <p role="status" aria-live="polite" className="harbor-feedback">{feedback}</p>
     {canAnswer&&<div className="harbor-coach-actions">
      <button type="button" className="harbor-model-answer"
       disabled={busy||listening||locked.current} onClick={hearReply}>🔊 Örnek cevabı dinle</button>
      <button type="button" className="harbor-hint"
       disabled={busy||listening||locked.current} onClick={help}>
       💡 {hintStage>0?'İpucu '+hintStage+'/3':'Yardım Et'}
      </button>
     </div>}
     {saveError&&<p role="alert" className="harbor-error">{saveError}<button type="button" disabled={busy}
      onClick={()=>{if(!busy)void save(mistakes,hints,voiceRecognized);}}>{busy?'Kaydediliyor…':'Tekrar Kaydet'}</button></p>}
    </div>
   </>:<>
    <div className="harbor-finale relative isolate overflow-hidden">
     <LearningMotion variant="victory" trigger={'harbor-finished-'+episode}/>
     <div className="harbor-finale-captain" aria-hidden="true">
      <HarborCaptainAvatar mood="celebrate" cue={'saved-'+episode}/>
     </div>
     <h2>{mission.title} Tamamlandı!</h2>
     <div className="harbor-finale-stars" role="img" aria-label={(summary?.stars??1)+' yıldız'}>
      {'⭐'.repeat(summary?.stars??1)}<span aria-hidden="true">{'☆'.repeat(3-(summary?.stars??1))}</span>
     </div>
     <p>{feedback}</p>
     <div className="harbor-finale-stats" aria-label="Bölüm sonuçları">
      <span><strong>{script.length}/{script.length}</strong> öğrenme adımı</span>
      <span><strong>{summary?.spoken??0}</strong> sesli cevap</span>
      <span><strong>{summary?.score??0}%</strong> başarı</span>
     </div>
     <p className="harbor-finale-tip">Öğrendiğin ifadeleri günlük hayatta da kullanabilirsin.</p>
     <div className="harbor-finale-actions">
      {episode<HARBOR_EPISODES.length&&<button type="button" onClick={()=>start(episode+1)}>Sonraki Bölüm →</button>}
      <button type="button" className="harbor-finale-secondary" onClick={backToMap}>Bölüm Haritası</button>
     </div>
    </div>
   </>}
  </main>
  <footer className="harbor-footer">🎤 Konuşmak isteğe bağlı. Sesin cihaz veya tarayıcı tarafından işlenebilir; dokunarak da oynayabilirsin.</footer>
  <ParentalGateModal isOpen={parentGateOpen} zIndex={120}
   description="Konuşma motorları ve teknik hata bilgileri yetişkinlere özeldir. Devam etmek için lütfen işlemi çözün."
   onClose={()=>setParentGateOpen(false)}
   onSuccess={()=>{setParentGateOpen(false);setParentToolsOpen(true);}}/>
  {parentToolsOpen&&<HarborSpeechAdultPanel capability={capability} activeCapability={activeCapability}
   diagnostic={parentDiagnostic} diagnosticCode={speechDiagnosticCode}
   independentEnabled={independentEnabled} independentConfigured={independentSttConfigured()}
   busy={busy} listening={listening} onClose={closeAdultSettings}
   onRecheck={()=>void recheckSpeech()} onSelectBrowser={()=>void selectBrowserEngine()}
   onSelectLocal={()=>void selectSherpaEngine()} onChooseOffline={()=>void chooseOffline()}
   onInstall={()=>void install()} onToggleIndependent={()=>void toggleIndependent()}/>} 
  </div>;
}
