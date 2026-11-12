'use client';

import React,{useCallback,useEffect,useRef,useState} from 'react';
import type {GameCompletedPayload} from '@ventra/shared';
import {getProgressRepository} from '@/lib/progress';
import {soundService} from '@/lib/audio/SoundService';
import {HARBOR_EPISODES,HARBOR_GAME_ID,matchesExpectedSpeech,type HarborPrompt,type HarborLevel} from '@/lib/learning/harborDialogueEngine';
import {speechCapability,installLocalEnglish,listenToChild,testMicrophoneInput,stopSpeechCapture,type SpeechCapability,type SpeechCaptureStatus} from '@/lib/speech/childSpeech';
import './harbor-speech.css';

type Props={profileId:string;englishLevel:HarborLevel;gradeLevel:number|null;onBack:()=>void;onSaved:()=>void};
type Phase='map'|'playing'|'completed';
const EMPTY_CAPABILITY:SpeechCapability={mode:'none',installable:false,message:'Mikrofon kontrol ediliyor…'};
export function HarborSpeechAdventure({profileId,englishLevel,gradeLevel,onBack,onSaved}:Props){
 const [phase,setPhase]=useState<Phase>('map');
 const [completed,setCompleted]=useState(0);
 const [episode,setEpisode]=useState(1);
 const [question,setQuestion]=useState(0);
 const [capability,setCapability]=useState<SpeechCapability>(EMPTY_CAPABILITY);
 const [listening,setListening]=useState(false);
 const [micStatus,setMicStatus]=useState<SpeechCaptureStatus|'idle'>('idle');
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [mistakes,setMistakes]=useState(0);
 const [hints,setHints]=useState(0);
 const [voiceRecognized,setVoiceRecognized]=useState(0);
 const [saveError,setSaveError]=useState('');
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const generation=useRef(0);
 const locked=useRef(false);
 const startedAt=useRef(Date.now());
 const mission=HARBOR_EPISODES[episode-1];
 const script=mission.prompts[englishLevel];
 const prompt=script[question]??script[0];
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
 },[profileId]);
 const start=(id:number)=>{
  if(id>completed+1||busy)return;
  generation.current++;
  soundService.unlockAudio();stopSpeechCapture();soundService.cancelSpeech();
  if(timer.current)clearTimeout(timer.current);
  setEpisode(id);setQuestion(0);setMistakes(0);setHints(0);setVoiceRecognized(0);
  setFeedback('');setSaveError('');setMicStatus('idle');setPhase('playing');locked.current=false;startedAt.current=Date.now();
  soundService.playSfx('tap',.5);
 };
 const speak=()=>{
  if(busy||listening)return;
  soundService.unlockAudio();
  soundService.speakEnglish(prompt.line,{rate:gradeLevel!==null&&gradeLevel<=2?.77:englishLevel==='A2'?.93:.83});
 };
 const save=async(errors:number,assisted:number,recognized:number)=>{
  setBusy(true);setFeedback('Bölüm tamamlandı! Yıldızların kaydediliyor…');
  const independent=Math.max(0,script.length-errors);
  const stars:1|2|3=errors===0&&assisted===0?3:errors<=2?2:1;
  const payload:GameCompletedPayload={
   sessionId:crypto.randomUUID(),profileId,gameId:HARBOR_GAME_ID,levelId:episode,
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
   setPhase('completed');setFeedback(recognized>0?'Sesinle maceraya renk kattın!':'Macera tamamlandı!');
   soundService.playSfx('fanfare',.7);onSaved();
  }catch(err){
   console.error('[Harbor] progress',err);
   setSaveError('Yıldızlar kaydedilemedi. Tekrar deneyebilirsin; ilerlemeni kaybetmemek için çıkma.');
   locked.current=false;
  }finally{setBusy(false);}
 };
 const correct=()=>{
  if(locked.current||busy)return;
  locked.current=true;
  generation.current++;stopSpeechCapture();setListening(false);
  setFeedback('Harika! ✨');soundService.playSfx('correct',.7);
  if(timer.current)clearTimeout(timer.current);
  timer.current=setTimeout(()=>{
   locked.current=false;
   if(question+1>=script.length)void save(mistakes,hints,voiceRecognized);
   else{setQuestion(q=>q+1);setFeedback('');}
  },750);
 };
 const tap=(choice:string)=>{
  if(busy||locked.current||listening)return;
  if(choice===prompt.reply){correct();return;}
  setMistakes(n=>n+1);setFeedback('Bir daha deneyelim! Kaptanı dinle veya ipucunu kullan.');
  soundService.playSfx('gentle_retry',.5);
 };
 const mic=async()=>{
  if(locked.current||busy||listening)return;
  const run=++generation.current;
  setListening(true);setMicStatus('starting');setFeedback('');
  soundService.cancelSpeech();
  soundService.setCaptureActive(true);
  let result;
  try{
   result=await listenToChild(capability,10000,status=>{
    if(run===generation.current)setMicStatus(status);
   });
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
  if(result.kind==='recognized'){
   if(matchesExpectedSpeech(result.alternatives,prompt.accept)){
    setVoiceRecognized(n=>n+1);
    correct();
   }else{
    // Only show a short ephemeral, device-produced text. Never persist it.
    const heard=result.alternatives[0]?.slice(0,70);
    setFeedback(heard?'Şöyle duydum: “'+heard+'”. Farklı bir ifade olabilir; tekrar dene veya cevaba dokun.':
     'Konuşmanı aldım fakat hedef ifadeyle eşleşmedi. Tekrar deneyebilirsin.');
   }
  }else if(result.kind==='unrecognized'){
   setFeedback('Sesini algıladım ama İngilizceye çeviremedim. Bu yanlış telaffuz ettiğin anlamına gelmez; tekrar deneyebilirsin.');
  }else if(result.kind==='heard'){
   setFeedback('Sesini duydum! 🎤 Mikrofon çalışıyor. Şimdi doğru cevaba dokunarak devam edebilirsin.');
  }else if(result.kind==='denied'){
   setFeedback('Mikrofon izni reddedildi. Tarayıcı izinlerini kontrol et veya cevaplara dokun.');
  }else if(result.kind==='no-speech'){
   setFeedback('Konuşma motoru açık kaldı ama ses algılamadı. “Mikrofonu Test Et” ile bilgisayarın ses girişini kontrol et.');
  }else if(result.kind==='unavailable'){
   const errorMessage:Record<string,string>={
    'microphone-error':'Tarayıcı mikrofona erişemedi. Windows ses girişini ve mikrofon iznini kontrol et.',
    'language-pack':'Cihazdaki İngilizce konuşma paketi başlatılamıyor. Ses paketini yeniden kontrol et.',
    'not-started':'Konuşma motoru mikrofonu başlatamadı. Mikrofon testini kullan veya tarayıcıyı yeniden aç.',
    'service-unavailable':'Tarayıcının yerel konuşma tanıması hata verdi. Mikrofonu test et; gerekirse farklı tarayıcı kullan.'
   };
   setFeedback(errorMessage[result.reason??'']??'Yerel tanıma şu anda kullanılamıyor. Mikrofonu test et veya cevaba dokun.');
   if(capability.mode==='web-local'){
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
   setFeedback('✅ Mikrofonun ses alıyor! Sorun konuşma tanıma motorundaysa yeniden kontrol edebilirsin. Bu test İngilizceyi değerlendirmez.');
  }else if(result.kind==='denied'){
   setFeedback('Mikrofon izni verilmedi. Tarayıcı ve işletim sistemi izinlerine bak.');
  }else{
   setFeedback('Mikrofon testinde ses algılanmadı. Giriş cihazını, mikrofon seviyesini ve izinleri kontrol et.');
  }
 };
 const recheckSpeech=async()=>{
  if(busy||listening)return;
  setBusy(true);
  try{
   const state=await speechCapability();
   setCapability(state);
   setFeedback(state.mode==='web-local'?'Yerel İngilizce tanıma hazır görünüyor. Tekrar deneyebilirsin.':state.message);
  }finally{setBusy(false);}
 };
 const install=async()=>{
  setBusy(true);const ok=await installLocalEnglish();
  setCapability(await speechCapability());setBusy(false);
  setFeedback(ok?'İngilizce ses paketi hazır! Şimdi mikrofonu deneyebilirsin.':'Ses paketi indirilemedi. Dokunarak veya sesli tekrar ederek devam edebilirsin.');
 };
 const backToMap=()=>{
  generation.current++;stopSpeechCapture();soundService.setCaptureActive(false);soundService.cancelSpeech();
  if(timer.current)clearTimeout(timer.current);locked.current=false;
  setPhase('map');setFeedback('');setSaveError('');setMicStatus('idle');
 };
 const order=question%3;
 const options=order===0?[prompt.choices[1],prompt.choices[0],prompt.choices[2]]:
  order===1?[prompt.choices[2],prompt.choices[1],prompt.choices[0]]:
  [prompt.choices[0],prompt.choices[2],prompt.choices[1]];
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
       <span className="harbor-episode-icon">{item.icon}</span>
       <span className="harbor-episode-number">{String(item.id).padStart(2,'0')}</span>
       <strong>{item.title}</strong><small>{item.subtitle}</small>
       <span className="harbor-episode-state">{item.id<=completed?'✓ Tekrar Oyna':item.id===completed+1?'Macera Başlasın →':'🔒 Önceki Bölüm'}</span>
      </button>)}
    </div>
   </>:phase==='playing'?<>
    <div className="harbor-level-title"><span>{mission.icon} {mission.title}</span><span>{englishLevel} · {question+1}/{script.length}</span></div>
    <div className="harbor-stage">
     <div className="harbor-captain" aria-hidden="true"><span>🧑‍✈️</span><span className="harbor-stage-icon">{prompt.illustration}</span></div>
     <div className="harbor-bubble"><small>KAPTAN LEO SORUYOR</small><h2>{prompt.line}</h2>
      <button type="button" onClick={speak} disabled={listening||busy} className="harbor-listen">🔊 Tekrar Dinle</button>
     </div>
    </div>
    <div className="harbor-talk">
     <div className="harbor-talk-title"><strong>Sen ne dersin?</strong><span>Doğru ifadeyi söyle veya seç!</span></div>
     <div className="harbor-answer-grid">
      {options.map((option,i)=><button type="button" key={option}
        disabled={busy||listening||locked.current} onClick={()=>tap(option)}
        className="harbor-answer"><span>{String.fromCharCode(65+i)}</span>{option}</button>)}
     </div>
     <div className="harbor-microphone">
      <button type="button" onClick={()=>void mic()} disabled={busy||listening||locked.current||capability.mode==='none'}
       className="harbor-mic-button" aria-label={listening?'Dinleniyor':'Mikrofonla konuş'}>
       {listening?'🎙️ Dinliyorum…':'🎤 Konuşarak Dene'}
      </button>
      {listening&&<button type="button" onClick={()=>{
       generation.current++;stopSpeechCapture();soundService.setCaptureActive(false);
       setListening(false);setMicStatus('idle');
      }} className="harbor-stop">Dur ✕</button>}
      {!listening&&<button type="button" onClick={()=>void testMic()}
       disabled={busy||locked.current} className="harbor-mic-test">🎚️ Mikrofonu Test Et</button>}
      <small>{capability.message}</small>
     </div>
     {listening&&<p className="harbor-mic-live" role="status" aria-live="polite">{
      micStatus==='starting'?'⏳ Mikrofon hazırlanıyor… Hazır mesajından sonra konuş.':
      micStatus==='microphone-ready'?'🟢 Mikrofon hazır! Şimdi İngilizce cevabı söyle.':
      micStatus==='speech-detected'?'🎤 Ses algılandı! Birazdan işleyeceğim.':
      micStatus==='processing'?'✨ Sesini işliyorum…':
      '🎚️ Mikrofon test ediliyor… Ses çıkar veya birkaç kelime söyle.'
     }</p>}
     {!listening&&capability.mode==='practice'&&<button type="button"
      onClick={()=>void recheckSpeech()} disabled={busy||locked.current}
      className="harbor-recheck">↻ Yerel konuşma tanımayı yeniden kontrol et</button>}
     {capability.installable&&<button type="button" disabled={busy||listening}
      className="harbor-download" onClick={()=>void install()}>↓ İngilizce ses paketini ücretsiz indir</button>}
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
  <footer className="harbor-footer">🔐 Konuşmalar kaydedilmez. Mikrofon sadece bastığında açılır. Konuşma tanıma telaffuz puanı değildir.</footer>
 </div>;
}
