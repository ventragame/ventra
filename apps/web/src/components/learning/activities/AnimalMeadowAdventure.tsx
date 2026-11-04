'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { AnimalAnswerEvidence } from '@ventra/shared';
import { soundService } from '@/lib/audio/SoundService';
import {useAutoQuestionAdvance} from '@/lib/learning/useAutoQuestionAdvance';
import { EventBus } from '@/lib/game/EventBus';
import { getProgressRepository } from '@/lib/progress';
import type { WordGardenProgressSnapshot } from '@/lib/progress/wordGardenProgress';
import {
  ANIMAL_MEADOW_WORDS, findAnimal, planAnimalMission, animalCommandFor, animalRescueCommandFor,
  type AnimalMission, type AnimalWord, type AnimalId, type PlannedAnimalMission
} from '@/lib/learning/animalMissionEngine';
import {MeadowPlayStage} from './MeadowPlayStage';
import './animal-meadow.css';

const STAGES = [
  { name:'Keşfet', icon:'🌱',desc:'Hayvanlarla tanış',story:'Çayırın yeni dostları seni bekliyor. Hepsini ziyaret et ve isimlerini öğren!' },
  { name:'Eşleştir',icon:'🧩',desc:'Resim ve kelime',story:'Bir rüzgâr isim kartlarını karıştırdı! Doğru İngilizce isimleri bul.' },
  { name:'Dinle',icon:'👂',desc:'Sesten tanı',story:'Hayvanların sesli ipuçlarını dinle ve doğru dostunu seç.' },
  { name:'Uygula',icon:'🧭',desc:'Yönergeyi uygula',story:'Rehberimiz İngilizce yön veriyor. Söylediği hayvanın yanına git.' },
  { name:'Kurtarma',icon:'💛',desc:'Hayvana yardım et',story:'İngilizce yönergeyi dinle, kayıp hayvanı bul! Hayvanın eve dönüşünü izlemek için tek doğru seçim yeterli.' }
] as const;
type Stage = 1|2|3|4|5;
type Feedback = { text: string; good: boolean } | null;
type Telemetry = {
  wrongAttempts:number;
  correctAnswers:number;
  durationSeconds:number;
  animalAnswers:AnimalAnswerEvidence[];
  sessionId:string;
};
interface Props {
  profileId:string;
  englishLevel:'Pre-A1'|'A1'|'A2';
  gradeLevel?:number|null;
  progress:WordGardenProgressSnapshot;
  onSave:(mission:Stage,stars:number,telemetry:Telemetry)=>Promise<WordGardenProgressSnapshot>;
  onBack:()=>void;
  onAllCompleted:()=>void;
}
function AnimalPicture({word, size='normal'}:{word:AnimalWord;size?:'normal'|'large'}) {
  // Every catalog animal has its own offline SVG illustration.
  return <img src={word.image} alt="" loading="eager" draggable={false}
    className={size==='large'?'h-28 w-28 object-contain drop-shadow-xl sm:h-36 sm:w-36':'h-16 w-16 object-contain drop-shadow-lg sm:h-20 sm:w-20'} />;
}
export function AnimalMeadowAdventure({ profileId, englishLevel, gradeLevel=null, progress, onSave, onBack, onAllCompleted }:Props) {
  const [localProgress,setLocalProgress] = useState(progress);
  // The parent reads IndexedDB asynchronously. If the child enters the meadow
  // before hydration finishes, the real progress must replace placeholders.
  useEffect(() => { setLocalProgress(progress); }, [progress]);
  const [stage,setStage] = useState<Stage>(() => Math.min(5,progress.completedLevels+1) as Stage);
  const [nonce,setNonce] = useState(0);
  const [plan,setPlan] = useState<PlannedAnimalMission|null>(null);
  const [planKey,setPlanKey] = useState<string|null>(null);
  const [loadError,setLoadError] = useState(false);
  const [muted,setMuted] = useState(() => soundService.getMuted());
  const [voiceAvailable,setVoiceAvailable] = useState(false);
  const [speaking,setSpeaking] = useState(false);
  const [audioHelp,setAudioHelp] = useState<string|null>(null);
  const [discovered,setDiscovered] = useState<AnimalId[]>([]);
  const [answered,setAnswered] = useState<AnimalAnswerEvidence[]>([]);
  const [questionIndex,setQuestionIndex] = useState(0);
  const [wrongCount,setWrongCount] = useState(0);
  const [questionWrong,setQuestionWrong] = useState(0);
  const [correctCount,setCorrectCount] = useState(0);
  const [feedback,setFeedback] = useState<Feedback>(null);
  const [awaiting,setAwaiting] = useState(false);
  const [assisted,setAssisted] = useState(false);
  const [wrongChoice,setWrongChoice] = useState<AnimalId|null>(null);
  const [textMode,setTextMode] = useState(false);
  const [showAlbum,setShowAlbum] = useState(false);
  const [seenAnimals,setSeenAnimals] = useState<AnimalId[]>([]);
  const [completed,setCompleted] = useState(false);
  const [saving,setSaving] = useState(false);
  const [saveError,setSaveError] = useState<string|null>(null);
  const startedAt = useRef(Date.now());
  const sessionId = useRef(`am_${profileId}_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const busy = useRef(false);
  // React state commits after the event handler returns. A rapid double tap
  // must not count the same answer twice before awaiting becomes true.
  const answerLocked = useRef(false);
  const discoveredRef = useRef<Set<AnimalId>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const key = `${profileId}:${englishLevel}:${gradeLevel??'unset'}:${stage}:${nonce}`;
  const activePlan = planKey===key && plan?.mission===stage ? plan : null;
  const currentQuestion = stage===1?null:activePlan?.questions[questionIndex]??null;
  const target = currentQuestion?findAnimal(currentQuestion.target):null;
  const noAudioMode = stage===3 && (textMode || muted || (!voiceAvailable && !target?.audio));
  useEffect(()=>{
    setVoiceAvailable(soundService.hasEnglishSpeech());
    const cancelSpeech=()=>soundService.cancelSpeech();
    const listen=(next:boolean)=>{ setMuted(next); if(next)cancelSpeech(); };
    const onVisibility=()=>{if(document.hidden)cancelSpeech();};
    EventBus.on('MUTE_STATE_CHANGED',listen);
    document.addEventListener('visibilitychange',onVisibility);
    return ()=>{
      EventBus.off('MUTE_STATE_CHANGED',listen);
      document.removeEventListener('visibilitychange',onVisibility);
      cancelSpeech();
    };
  },[]);
  useEffect(()=>{
    let live=true;
    setPlan(null);setPlanKey(null);setLoadError(false);
    getProgressRepository().getAnimalAnswerHistory(profileId).then(history=>{
      if(!live)return;
      setSeenAnimals(Array.from(new Set(history.filter(row=>row.kind==='discovery').map(row=>row.wordId)))
        .filter((id): id is AnimalId => Boolean(findAnimal(id))));
      setPlan(planAnimalMission({mission:stage,history,seed:Math.floor(Math.random()*4294967295),gradeLevel,englishLevel}));
      setPlanKey(key);
    }).catch(error=>{ console.error('Hayvan Çayırı planı yüklenemedi',error);if(live)setLoadError(true); });
    return ()=>{live=false};
  },[key,profileId,stage]);
  useEffect(()=>{
    panelRef.current?.scrollTo({top:0,behavior:'auto'});
    headingRef.current?.focus({preventScroll:true});
  },[stage,nonce]);
  function speak(word:AnimalWord, sentence=false) {
    if(muted)return;
    soundService.unlockAudio();
    setAudioHelp(null);
    setSpeaking(false);
    const unavailable=()=>{
      setSpeaking(false);
      if(!sentence&&word.audio){soundService.playSpeech(word.audio);return;}
      setAudioHelp('İngilizce ses açılamadı. Cihazın İngilizce ses paketini kontrol et veya yazılı destekle devam et.');
      if(stage===3){setTextMode(true);setAssisted(true);}
    };
    const accepted=soundService.speakEnglish(
      sentence?(stage===5?animalRescueCommandFor(word,englishLevel,gradeLevel):animalCommandFor(word,englishLevel,gradeLevel)):word.id,
      {rate:0.87,onStart:()=>setSpeaking(true),onEnd:()=>setSpeaking(false),onError:unavailable}
    );
    if(!accepted&&voiceAvailable)setVoiceAvailable(false);
  }
  const canSpeak = (word:AnimalWord|null) => !muted && Boolean(word && (word.audio || voiceAvailable));
  function toggleMute(){
    const next=soundService.toggleMute();
    setMuted(next);
    if(next){soundService.cancelSpeech();setSpeaking(false);}
  }
  function reset(next:Stage){
    if(busy.current)return;
    soundService.cancelSpeech();setSpeaking(false);
    answerLocked.current=false;
    discoveredRef.current.clear();
    setStage(next);setNonce(x=>x+1);setPlan(null);setPlanKey(null);setLoadError(false);
    setDiscovered([]);setAnswered([]);setQuestionIndex(0);setWrongCount(0);setQuestionWrong(0);
    setCorrectCount(0);setFeedback(null);setAwaiting(false);setAssisted(false);setWrongChoice(null);
    setTextMode(false);setAudioHelp(null);setShowAlbum(false);
    setCompleted(false);setSaving(false);setSaveError(null);startedAt.current=Date.now();
    sessionId.current=`am_${profileId}_${next}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
  function discover(word:AnimalWord) {
    if(saving||completed)return;
    soundService.playSfx('tap');speak(word);
    if(discoveredRef.current.has(word.id))return;
    discoveredRef.current.add(word.id);
    setDiscovered(old=>old.includes(word.id)?old:[...old,word.id]);
    setAnswered(old=>[...old,{wordId:word.id,kind:'discovery',mistakes:0,firstTryCorrect:false,timestamp:new Date().toISOString()}]);
  }
  function choose(id:AnimalId) {
    if(saving||completed||awaiting||busy.current||answerLocked.current||!currentQuestion||!target)return;
    if(id!==target.id) {
      setWrongCount(x=>x+1);setQuestionWrong(x=>x+1);setWrongChoice(id);
      setFeedback({text:'Bir daha dene! 🐾',good:false});
      soundService.playSfx('gentle_retry');
      return;
    }
    answerLocked.current=true;
    soundService.playSfx('correct');
    // The final task is a single English instruction, not a habitat quiz.
    const kind=stage===2?'recognition':stage===3?'listening':'command';
    const hintUsed=assisted || (stage===3 && noAudioMode);
    const result:AnimalAnswerEvidence={
      wordId:id,kind,firstTryCorrect:questionWrong===0&&!hintUsed,
      mistakes:questionWrong,hintUsed,timestamp:new Date().toISOString()
    };
    setAnswered(old=>[...old,result]);setCorrectCount(x=>x+1);
    setWrongChoice(null);setAwaiting(true);
    setFeedback({text:stage===5?`💛 ${target.id.toUpperCase()} güvende!`:`✨ ${target.id.toUpperCase()}!`,good:true});
    if(stage===2)speak(target);
  }
  function advance(){
    if(!awaiting||busy.current)return;
    if(!activePlan)return;
    if(questionIndex+1>=activePlan.questions.length) {void finish();return;}
    setQuestionIndex(x=>x+1);setQuestionWrong(0);setAwaiting(false);setAssisted(false);
    soundService.cancelSpeech();setSpeaking(false);
    setFeedback(null);setWrongChoice(null);setAudioHelp(null);
    answerLocked.current=false;
    panelRef.current?.scrollTo({top:0,behavior:'smooth'});
  }
  async function finish() {
    if(busy.current||completed)return;
    if(!activePlan)return;
    const amount=stage===1?discovered.length:correctCount;
    const total=stage===1?activePlan.animals.length:activePlan.questions.length;
    if(amount!==total)return;
    busy.current=true;setSaving(true);setSaveError(null);
    const stars=wrongCount===0?3:wrongCount<=2?2:1;
    try{
      const result=await onSave(stage,stars,{
        wrongAttempts:wrongCount,correctAnswers:amount,
        durationSeconds:(Date.now()-startedAt.current)/1000,
        animalAnswers:answered,sessionId:sessionId.current
      });
      setLocalProgress(result);setCompleted(true);soundService.playSfx('fanfare');
    }catch(error){
      console.error('Animal Meadow save failed',error);
      setSaveError('İlerleme kaydedilemedi. Yerel kayıtlarını silmeden yeniden dene.');
    }finally{busy.current=false;setSaving(false);}
  }
  // On the first task every image is a real vocabulary interaction.
  // Auto-complete discovery once all animals have been heard/tapped.
  useEffect(()=>{
    if(stage===1&&activePlan&&discovered.length===activePlan.animals.length&&
      !completed&&!saving&&!saveError&&!busy.current){
      void finish();
    }
  },[stage,activePlan,discovered.length,completed,saving,saveError]);

  // Listening and spoken commands begin with an English cue. A gesture may
  // still be required by the OS/browser; the large replay button remains.
  useEffect(()=>{
    if(stage<3||!activePlan||!target||muted||awaiting||completed||saving)return;
    const timer=window.setTimeout(()=>{
      soundService.unlockAudio();
      speak(target,stage===4||stage===5);
    },300);
    return()=>window.clearTimeout(timer);
  },[stage,questionIndex,activePlan?.seed,target?.id,muted,awaiting,completed,saving]);

  useAutoQuestionAdvance({ready:awaiting,blocked:saving||completed||Boolean(saveError)||!activePlan,
    delayMs:stage===5?1450:1250,speaking,onAdvance:advance});
  const stars=Object.values(localProgress.starsByLevel).reduce((s,n)=>s+n,0);
  const valid = activePlan && (stage===1?activePlan.animals.length>0:Boolean(currentQuestion && target));
  const completedCount=stage===1?discovered.length:correctCount;
  return (
    <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Hayvan Çayırı macerası"
      onPointerDown={e=>e.stopPropagation()} onPointerMove={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()}
      onWheel={e=>e.stopPropagation()} className="am-shell fixed inset-0 z-50 overflow-y-auto overscroll-contain text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl"/>
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-lime-400/15 blur-3xl"/>
      </div>
      <main className="am-main relative mx-auto max-w-5xl px-3 py-4 sm:px-6" style={{paddingTop:'max(16px, env(safe-area-inset-top))',paddingBottom:'max(30px, env(safe-area-inset-bottom))'}}>
        <header className="am-hud">
          <button type="button" className="am-hud-btn" disabled={saving} onClick={onBack}
            aria-label="Kelime Bahçesi bölgelerine geri dön">← <span className="hidden sm:inline">Bölgeler</span></button>
          <div className="am-hud-title"><span className="am-hud-icon" aria-hidden="true">🐾</span>
            <span><strong>Hayvan Çayırı</strong><small>{gradeLevel??'—'}. sınıf · {englishLevel}</small></span>
          </div>
          <div className="am-hud-actions">
            <span className="am-hud-btn" aria-label={'Toplam '+stars+' yıldız'}>⭐ {stars}</span>
            <button type="button" className="am-hud-btn" onClick={()=>setShowAlbum(v=>!v)}
              aria-expanded={showAlbum} aria-label="Keşif albümünü aç veya kapat">📖</button>
            <button type="button" className="am-hud-btn" onClick={toggleMute}
              aria-label={muted?'Sesi aç':'Sesi kapat'} aria-pressed={muted}>{muted?'🔇':'🔊'}</button>
          </div>
        </header>
        <div className="am-intro am3-intro sr-only">
          <p className="text-[11px] font-black uppercase tracking-[.23em] text-lime-200">Hayvan Çayırı · Bölüm {stage}/5</p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-3xl font-black tracking-tight outline-none sm:text-5xl">{STAGES[stage-1].icon} {STAGES[stage-1].name}</h1>
          <p className="sr-only">
            {stage===1?'Çayırdaki hayvanları keşfet; adlarına dokun ve İngilizcelerini öğren.':
             stage===2?'Gördüğün hayvanın İngilizce adını bul.':
             stage===3?'Duyduğun İngilizce kelimenin hangi hayvana ait olduğunu seç.':
             stage===4?'Kısa İngilizce yönergeyi oku, hayvanı bul.':
             'Kayıp hayvanı İngilizce yönergeden tanı ve kurtar.'}
          </p>
        </div>
        <details className="am3-help">
          <summary aria-label="Pufi'den oyun yardımı" title="Nasıl oynanır?">?<span className="sr-only">Yardım</span></summary>
          <p>{STAGES[stage-1].story}</p>
        </details>
        {showAlbum && <section aria-label="Keşif albümü" className="am-album mb-4 rounded-3xl border border-lime-200/40 bg-[#0b3649]/90 p-3 shadow-2xl sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><h2 className="text-lg font-black text-lime-100">📖 Hayvan Dostları Albümü</h2>
            <p className="text-xs text-sky-100">Çayırı tekrar keşfederek 40 hayvanın İngilizce adını öğren.</p></div>
            <button onClick={()=>setShowAlbum(false)} aria-label="Albümü kapat"
              className="am-tap min-h-11 rounded-xl border border-white/25 bg-white/10 px-3 font-black">✕</button>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {ANIMAL_MEADOW_WORDS.map(word=>{
              const unlocked=seenAnimals.includes(word.id)||discovered.includes(word.id);
              return <button key={word.id} disabled={!unlocked} onClick={()=>speak(word)}
                aria-label={unlocked?`${word.tr}, İngilizce ${word.id}, telaffuzu dinle`:'Henüz keşfedilmemiş hayvan'}
                className={`am-tap flex min-h-36 flex-col items-center justify-center rounded-2xl border p-2 text-center ${unlocked?'border-lime-200/50 bg-white/10':'border-white/10 bg-black/20 opacity-65'}`}>
                {unlocked?<AnimalPicture word={word}/>:<div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-4xl font-black text-white/40">?</div>}
                <span className="mt-1 text-xs font-black uppercase">{unlocked?word.id:'???'}</span>
                <span className="mt-1 text-[11px] text-sky-100">{unlocked?word.tr:'Keşfedilmedi'}</span>

              </button>;
            })}
          </div>
        </section>}
        <nav aria-label="Hayvan Çayırı görevleri" className="am-missions am3-missions">
          {STAGES.map((item,i)=>{
            const order=(i+1) as Stage,locked=order>localProgress.completedLevels+1;
            return <button key={order} type="button" disabled={locked||saving}
              onClick={()=>reset(order)} aria-current={stage===order?'step':undefined}
              aria-label={order+'. '+item.name+(locked?', kilitli':'')}
              className="am-mission am-tap" data-active={stage===order} data-locked={locked}>
              <span aria-hidden="true">{locked?'🔒':order<=localProgress.completedLevels?'✅':item.icon}</span>
              <span className="am-mission-text">{item.name}</span>
            </button>;
          })}
        </nav>
        {loadError && <div role="alert" className="mx-auto max-w-lg space-y-3 rounded-2xl border border-rose-300/50 bg-slate-950/65 p-5 text-center">
          <p>Bu görevin kelime kayıtları okunamadı. Oyuncu ilerlemesi korunuyor.</p>
          <button onClick={()=>reset(stage)} className="am-cta">Tekrar Yükle</button>
        </div>}
        {!loadError && !activePlan && !completed && <div role="status" className="rounded-2xl bg-black/20 p-6 text-center">Macera hazırlanıyor…</div>}
        {!loadError && activePlan && !valid && !completed && <div role="alert" className="rounded-2xl border border-amber-300/50 p-5 text-center">
          <p>Görev planında geçerli soru bulunamadı. Kayıtların korunuyor.</p>
          <button onClick={()=>reset(stage)} className="am-cta mt-4">Yeniden Yükle</button>
        </div>}
        {!loadError && completed && <section className="mx-auto max-w-3xl rounded-3xl border border-lime-300/50 bg-emerald-950/75 p-5 text-center shadow-2xl">
          <MeadowPlayStage mode="complete" animals={[]}/>
          <div aria-hidden="true" className="mt-4 text-5xl">🏆</div>
          <h2 className="mt-2 text-2xl font-black">Görev Tamamlandı!</h2>
          <p className="mt-2 text-sm text-lime-100">Bu görevdeki en iyi ödülün: ⭐ {localProgress.starsByLevel[stage]??0}/3</p>
          <p className="mt-1 text-xs text-white/75">{correctCount || discovered.length} doğru/keşif · {wrongCount} yanlış deneme</p>
          <button onClick={()=>{if(stage===5)onAllCompleted();else reset((stage+1) as Stage)}} className="am-cta mt-5 w-full">
            {stage===5?'Kelime Bahçesine Dön →':'Sonraki Görev →'}
          </button>
          <button onClick={()=>reset(stage)} className="am-tap mt-3 w-full rounded-2xl border border-white/30 bg-white/10 p-3 text-sm font-bold">
            ↻ Bu Görevi Farklı Sorularla Tekrar Oyna
          </button>
        </section>}
        {!loadError && valid && !completed && activePlan && (stage===1?(
          <section className="am-quest-area mx-auto max-w-4xl">
            <MeadowPlayStage mode="discover"
              animals={activePlan.animals.map(id=>findAnimal(id)!)}
              discovered={discovered} disabled={saving||completed}
              onSelect={id=>{const word=findAnimal(id);if(word)discover(word);}}/>
            <div className="am-discovery-progress" role="progressbar"
              aria-label="Keşfedilen hayvanlar" aria-valuemin={0}
              aria-valuemax={activePlan.animals.length} aria-valuenow={discovered.length}>
              <span>🐾 {discovered.length}/{activePlan.animals.length}</span>
              <span>{discovered.length===activePlan.animals.length?'✨ Kaydediliyor…':'🔊 Dokun ve dinle'}</span>
            </div>
          </section>
        ):target && currentQuestion?(
          <section className="am-quest-area mx-auto max-w-4xl rounded-3xl border border-white/25 bg-slate-950/20 p-3 shadow-xl sm:p-6">
            <div className="am-quest-head mb-2 flex items-center justify-between gap-3 text-xs font-extrabold text-lime-100 sm:text-sm">
              <span>🧭 {STAGES[stage-1].desc}</span><span>Soru {questionIndex+1}/{activePlan.questions.length}</span>
            </div>
            <div className="am-quest-progress mb-4 h-2 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-sky-300 transition-all" style={{width:`${Math.round(((questionIndex+Number(awaiting))/activePlan.questions.length)*100)}%`}}/>
            </div>
            <div className="am-task">
              <div className="min-w-0 flex-1">
                <h2 className="am-task-title" tabIndex={-1}>
                  {stage===3?(noAudioMode?'Read: '+target.id.toUpperCase():'🔊 Listen and find!'):
                    stage===4?animalCommandFor(target,englishLevel,gradeLevel):
                    stage===5?animalRescueCommandFor(target,englishLevel,gradeLevel):
                    'Which animal is this?'}
                </h2>
                <p className="am-task-hint">
                  {stage===3?(noAudioMode?'Yazılı destek açık.':'İngilizce kelimeyi dinle.'):
                    stage===5?'Dinle ve kayıp hayvana dokun.':
                    stage===4?'Söylenen hayvanı bul.':'Resme bak, İngilizce adını seç.'}
                </p>
                {stage===2&&assisted&&<p className="am-task-hint">💡 {target.tr}</p>}
                {audioHelp&&<p className="am-task-hint" role="status">🔇 {audioHelp}</p>}
              </div>
              <div className="am-task-actions">
                {(stage===4||stage===5)&&
                  <button type="button" className="am-task-action"
                    onClick={()=>speak(target,stage===4||stage===5)}
                    disabled={!canSpeak(target)} aria-label="İngilizceyi dinle">🔊</button>}
                {stage===3&&!noAudioMode&&<button type="button" className="am-task-action"
                  disabled={awaiting} onClick={()=>{setTextMode(true);setAssisted(true);}}
                  aria-label="Ses yoksa yazılı modu aç">Aa</button>}
                {stage===2&&<button type="button" className="am-task-action"
                  disabled={awaiting} onClick={()=>setAssisted(true)}
                  aria-label="Türkçe ipucu göster">💡</button>}
              </div>
            </div>
            <MeadowPlayStage
              mode={stage===2?'match':stage===3?'listen':stage===4?'command':'rescue'}
              animals={currentQuestion.choices.map(id=>findAnimal(id)!)}
              target={target} wrongId={wrongChoice}
              correctId={awaiting?target.id:null}
              disabled={saving||awaiting}
              noAudioMode={noAudioMode}
              canSpeak={canSpeak(target)}
              onListen={()=>speak(target,stage===4||stage===5)}
              onSelect={choose}/>
            {activePlan.reviewIds.length>0 && <p className="mt-3 rounded-xl bg-sky-950/65 p-2 text-center text-xs text-sky-100">🔁 Pekiştirme turu: zorlandığın kelimeler yeniden karşına çıkıyor.</p>}
            <div className="am3-feedback mt-4 text-center">
              {feedback && <p role="status" aria-live="polite" className={`rounded-xl px-3 py-3 text-sm font-semibold ${feedback.good?'bg-lime-500/15 text-lime-100':'bg-amber-500/20 text-amber-100'}`}>{feedback.text}</p>}
              {awaiting&&!saveError&&<p role="status" aria-live="polite" className="mt-2 rounded-xl border border-lime-200/30 bg-emerald-700/20 px-4 py-3 text-sm font-bold text-lime-100">
                ✨ {questionIndex+1===activePlan.questions.length?'Bölüm sonu kaydediliyor…':'Sıradaki hayvan keşfediliyor…'}
              </p>}
            </div>
          </section>
        ):null)}
        {saveError && <div role="alert" className="mx-auto mt-4 max-w-lg rounded-xl border border-rose-300/60 bg-rose-950/85 p-4 text-center">
          {saveError}
          <button onClick={()=>void finish()} disabled={saving} className="am-tap ml-3 min-h-11 font-black underline">Tekrar Kaydet</button>
        </div>}
        <p className="sr-only">Yıldızlar kaydedilmiş en iyi başarıdan hesaplanır. Dinleme görevinde yazılı destek yardımlı sayılır.</p>
      </main>
    </div>
  );
}
