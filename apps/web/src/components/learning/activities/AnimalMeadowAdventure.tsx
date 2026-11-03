'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { AnimalAnswerEvidence } from '@ventra/shared';
import { soundService } from '@/lib/audio/SoundService';
import {useAutoQuestionAdvance} from '@/lib/learning/useAutoQuestionAdvance';
import { EventBus } from '@/lib/game/EventBus';
import { getProgressRepository } from '@/lib/progress';
import type { WordGardenProgressSnapshot } from '@/lib/progress/wordGardenProgress';
import {
  ANIMAL_MEADOW_WORDS, findAnimal, planAnimalMission, animalCommandFor,
  type AnimalMission, type AnimalWord, type AnimalId, type PlannedAnimalMission
} from '@/lib/learning/animalMissionEngine';
import { resolveRescueChoice } from '@/lib/learning/animalRescueEngine';
import {MobileMeadowWorld} from './MobileMeadowWorld';
import { getAnimalObjects,getHabitatObjects,type WorldObject } from '../world/worldLayout';
const ExplorerCanvas=dynamic(()=>import('../world/ExplorerCanvas').then(m=>m.ExplorerCanvas),{
  ssr:false,loading:()=> <div role="status" className="flex min-h-80 items-center justify-center rounded-3xl bg-emerald-900/60 text-white">Çayır hazırlanıyor…</div>
});
import './animal-meadow.css';

const STAGES = [
  { name:'Keşfet', icon:'🌱',desc:'Hayvanlarla tanış',story:'Çayırın yeni dostları seni bekliyor. Hepsini ziyaret et ve isimlerini öğren!' },
  { name:'Eşleştir',icon:'🧩',desc:'Resim ve kelime',story:'Bir rüzgâr isim kartlarını karıştırdı! Doğru İngilizce isimleri bul.' },
  { name:'Dinle',icon:'👂',desc:'Sesten tanı',story:'Hayvanların sesli ipuçlarını dinle ve doğru dostunu seç.' },
  { name:'Uygula',icon:'🧭',desc:'Yönergeyi uygula',story:'Rehberimiz İngilizce yön veriyor. Söylediği hayvanın yanına git.' },
  { name:'Mini Macera',icon:'🏡',desc:'Yuvasını keşfet',story:'Fırtınadan sonra yollar karıştı! Kayıp dostları bul ve güvenle evlerine götür.' }
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
function MeadowScene({stage, word, blooms, choices, onChoose, wrongChoice, awaiting}:{
  stage:Stage;word:AnimalWord|null;blooms:number;
  choices?:AnimalId[];onChoose?:(id:AnimalId)=>void;
  wrongChoice?:AnimalId|null;awaiting?:boolean;
}) {
  return (
    <div className="am-scene relative isolate w-full overflow-hidden rounded-[1.75rem] border border-white/40 shadow-[0_16px_55px_rgba(6,44,48,.25)]" aria-label="Hayvan Çayırı oyun sahnesi">
      <svg aria-hidden="true" className="block h-auto w-full" viewBox="0 0 900 340" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="am-sky" x2="0" y2="1"><stop stopColor="#66c9f6"/><stop offset=".92" stopColor="#b6f4d7"/></linearGradient>
          <linearGradient id="am-grass" x2="0" y2="1"><stop stopColor="#96dc71"/><stop offset="1" stopColor="#2e9668"/></linearGradient>
        </defs>
        <rect width="900" height="340" fill="url(#am-sky)" />
        <circle cx="738" cy="67" r="41" fill="#ffed9b" stroke="#fff7c5" strokeWidth="10"/>
        <g fill="#fff" opacity=".87"><ellipse cx="153" cy="82" rx="72" ry="16"/><circle cx="126" cy="70" r="30"/><circle cx="178" cy="66" r="34"/><ellipse cx="510" cy="64" rx="59" ry="13"/><circle cx="483" cy="57" r="22"/><circle cx="530" cy="52" r="24"/></g>
        <path d="M0 225 Q140 117 294 206 Q425 116 568 203 Q748 118 900 205 V340 H0Z" fill="#8fdba2"/>
        <path d="M0 275 Q150 220 280 266 Q472 190 639 261 Q762 205 900 254 V340 H0Z" fill="url(#am-grass)"/>
        <path d="M0 312 Q215 258 385 317 Q690 254 900 316 V340 H0Z" fill="#3d9767"/>
        <ellipse cx="698" cy="289" rx="145" ry="30" fill="#54cbe2" stroke="#b8f9e3" strokeWidth="7"/>
        <g>
          <rect x="129" y="164" width="22" height="101" rx="4" fill="#84513d"/>
          <circle cx="111" cy="174" r="39" fill="#3baf73"/><circle cx="161" cy="157" r="49" fill="#42b872"/><circle cx="139" cy="132" r="44" fill="#73cf7e"/>
        </g>
        <g><rect x="307" y="199" width="94" height="71" rx="6" fill="#c98565"/><path d="M294 207L356 150L418 207Z" fill="#a8514d"/><rect x="340" y="227" width="28" height="43" rx="5" fill="#654536"/><rect x="379" y="214" width="16" height="17" rx="3" fill="#fff3bc"/></g>
        <path d="M410 340 Q446 275 535 265 L588 340Z" fill="#f4dfa2" opacity=".6"/>
        {Array.from({length:12},(_,i)=>(
          <g key={i} transform={`translate(${30+i*76} ${295+(i%3)*10})`} opacity={i < Math.max(2,blooms*2)?1:.52}>
            <path d="M0 18V-4" stroke="#347d4b" strokeWidth="3"/>
            {Array.from({length:5},(_,j)=><ellipse key={j} rx="5" ry="11" cy="-10" fill={['#ffe08a','#ffc8e2','#c6baff'][i%3]} transform={`rotate(${j*72} 0 -10)`}/>)}
            <circle r="4" cy="-10" fill="#fff"/>
          </g>
        ))}
      </svg>
      <div className="absolute bottom-3 left-3 rounded-full border border-white/50 bg-emerald-950/65 px-3 py-1.5 text-[10px] font-black tracking-wide text-white backdrop-blur-sm">
        {stage===1?'KEŞİF ÇAYIRI':stage===2?'HAYVAN DEDEKTİFLERİ':stage===3?'SES ORMANI':stage===4?'GÖREV PATİKASI':'YUVAYA DÖNÜŞ'}
      </div>
      {stage===2 && word && <div className="am-pop absolute left-1/2 top-[41%] flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[2rem] border-4 border-white/85 bg-white/90 p-3 shadow-2xl sm:p-5">
        <AnimalPicture word={word} size="large"/>
      </div>}
      {stage===5 && word && <div className="am-pop absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 rounded-3xl border-4 border-white/80 bg-emerald-950/85 px-5 py-4 text-center shadow-xl">
        <div aria-hidden="true" className="text-4xl">🏡</div>
        <p className="mt-1 text-base font-extrabold text-white sm:text-2xl">{word.habitat}</p>
      </div>}
      {stage===4 && choices && onChoose && <div className="absolute inset-x-1 bottom-10 flex items-end justify-around gap-1 sm:bottom-7"
        role="group" aria-label="Çayırdaki hayvanlardan doğru olanı seç">
        {choices.map(id=>{
          const item=findAnimal(id);
          return item && <button key={id} type="button" onClick={()=>onChoose(id)} disabled={awaiting}
            aria-label={`${item.tr}, çayırda bul`} aria-pressed={awaiting&&word?.id===id}
            className={`am-tap am-forest-animal flex min-h-20 min-w-20 flex-col items-center justify-end rounded-2xl border-2 bg-white/90 px-1 py-1 shadow-xl sm:min-h-28 sm:min-w-28
              ${wrongChoice===id?'border-rose-400 bg-rose-50':awaiting&&word?.id===id?'border-lime-400 bg-lime-100':'border-white/80'}`}>
            <AnimalPicture word={item}/>
            <span className="text-[10px] font-black text-emerald-950 sm:text-xs">{item.tr}</span>
          </button>;
        })}
      </div>}
      {stage===1 && <div className="am-float absolute bottom-[15%] right-[13%] text-5xl" aria-hidden="true">🦋</div>}
    </div>
  );
}

export function AnimalMeadowAdventure({ profileId, englishLevel, gradeLevel=null, progress, onSave, onBack, onAllCompleted }:Props) {
  const [localProgress,setLocalProgress] = useState(progress);
  const [mobile,setMobile]=useState(false);
  useEffect(()=>{
    const media=window.matchMedia('(max-width:767px)');
    const update=()=>setMobile(media.matches);
    update();media.addEventListener?.('change',update);
    return()=>media.removeEventListener?.('change',update);
  },[]);
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
  const [rescueSelected,setRescueSelected] = useState(false);
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
  const worldObjects=useMemo<WorldObject[]>(()=>{
    if(!activePlan)return [];
    if(stage===1)return getAnimalObjects((mobile?activePlan.animals:activePlan.animals.filter(id=>!discovered.includes(id))),
      id=>findAnimal(id)?.image).map(object=>({...object,label:findAnimal(object.id)?.tr??object.id}));
    if(!currentQuestion || (stage!==4 && stage!==5))return [];
    if(stage===5 && rescueSelected)return getHabitatObjects(currentQuestion.choices,
      id=>findAnimal(id)?.habitat??id);
    return getAnimalObjects(currentQuestion.choices,id=>findAnimal(id)?.image)
      .map(object=>({...object,label:findAnimal(object.id)?.tr??object.id}));
  },[activePlan,stage,discovered,currentQuestion,rescueSelected,mobile]);

  useEffect(()=>{
    setVoiceAvailable(typeof window!=='undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance!=='undefined');
    const cancelSpeech=()=>{
      if(typeof window!=='undefined' && 'speechSynthesis' in window) soundService.cancelSpeech();
    };
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
    if((!sentence || !voiceAvailable) && word.audio){soundService.playSpeech(word.audio);return;}
    if(!voiceAvailable || typeof window==='undefined' || document.hidden)return;
    soundService.speakEnglish(sentence?animalCommandFor(word,englishLevel,gradeLevel):word.id,{rate:0.8});
  }
  const canSpeak = (word:AnimalWord|null) => !muted && Boolean(word && (word.audio || voiceAvailable));
  function toggleMute(){
    const next=soundService.toggleMute();
    setMuted(next);
    if(next && typeof window!=='undefined' && 'speechSynthesis' in window)soundService.cancelSpeech();
  }
  function reset(next:Stage){
    if(busy.current)return;
    answerLocked.current=false;
    discoveredRef.current.clear();
    setStage(next);setNonce(x=>x+1);setPlan(null);setPlanKey(null);setLoadError(false);
    setDiscovered([]);setAnswered([]);setQuestionIndex(0);setWrongCount(0);setQuestionWrong(0);
    setCorrectCount(0);setFeedback(null);setAwaiting(false);setAssisted(false);setWrongChoice(null);
    setRescueSelected(false);setTextMode(false);setShowAlbum(false);
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
    const rescue = stage===5 ? resolveRescueChoice({
      phase: rescueSelected ? 'home' : 'find',
      selected: id,
      target: target.id
    }) : null;
    if(id!==target.id || rescue?.outcome==='wrong') {
      setWrongCount(x=>x+1);setQuestionWrong(x=>x+1);setWrongChoice(id);
      setFeedback({text:stage===5 && rescueSelected?'Bu yuva değil; başka bir yer dene.':'Henüz değil. Başka bir hayvana dokun; tekrar deneyebilirsin.',good:false});
      soundService.playSfx('gentle_retry');
      return;
    }
    if(rescue?.outcome==='found') {
      setRescueSelected(true);
      setWrongChoice(null);
      setFeedback({text:`Harika! ${target.tr} bulundu. Şimdi doğru yuvayı seç.`,good:true});
      soundService.playSfx('correct');
      return;
    }
    answerLocked.current=true;
    soundService.playSfx('correct');
    const kind=stage===2?'recognition':stage===3?'listening':stage===4?'command':'habitat';
    const hintUsed=assisted || (stage===3 && noAudioMode);
    const result:AnimalAnswerEvidence={
      wordId:id,kind,firstTryCorrect:questionWrong===0&&!hintUsed,
      mistakes:questionWrong,hintUsed,timestamp:new Date().toISOString()
    };
    setAnswered(old=>[...old,result]);setCorrectCount(x=>x+1);
    setWrongChoice(null);setAwaiting(true);
    setFeedback({text:`Doğru! ${target.id.toUpperCase()} = ${target.tr}.`,good:true});
  }
  function chooseHabitat(id:AnimalId) {
    if(stage!==5 || !rescueSelected || !target || saving || completed || awaiting || busy.current)return;
    choose(id);
  }
  function advance(){
    if(!awaiting||busy.current)return;
    if(!activePlan)return;
    if(questionIndex+1>=activePlan.questions.length) {void finish();return;}
    setQuestionIndex(x=>x+1);setQuestionWrong(0);setAwaiting(false);setAssisted(false);
    setFeedback(null);setWrongChoice(null);setRescueSelected(false);
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
  const onWorldInteract=(object:WorldObject)=>{
    if(busy.current||saving||completed||awaiting)return;
    const word=findAnimal(object.id);
    if(!word)return;
    if(stage===1){discover(word);return;}
    if(stage===4){choose(word.id);return;}
    if(stage===5){if(rescueSelected)chooseHabitat(word.id);else choose(word.id);}
  };
  useAutoQuestionAdvance({ready:awaiting,blocked:saving||completed||Boolean(saveError)||!activePlan,
    delayMs:1250,onAdvance:advance});
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
        <div className="am-intro py-5 text-center">
          <p className="text-[11px] font-black uppercase tracking-[.23em] text-lime-200">Hayvan Çayırı · Bölüm {stage}/5</p>
          <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-3xl font-black tracking-tight outline-none sm:text-5xl">{STAGES[stage-1].icon} {STAGES[stage-1].name}</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-sky-100 sm:text-base">
            {stage===1?'Çayırdaki hayvanları keşfet; adlarına dokun ve İngilizcelerini öğren.':
             stage===2?'Gördüğün hayvanın İngilizce adını bul.':
             stage===3?'Duyduğun İngilizce kelimenin hangi hayvana ait olduğunu seç.':
             stage===4?'Kısa İngilizce yönergeyi oku, hayvanı bul.':
             'Her hayvanın yaşadığı yeri ve İngilizce adını eşleştir.'}
          </p>
        </div>
        <details className="am-story-guide">
          <summary>🦉 Pufi'den ipucu <span aria-hidden="true">✦</span></summary>
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
                {unlocked && <span className="mt-1 text-[10px] text-lime-100/80">{word.habitat}</span>}
              </button>;
            })}
          </div>
        </section>}
        <nav aria-label="Hayvan Çayırı görevleri" className="am-missions">
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
          <MeadowScene stage={stage} word={null} blooms={5}/>
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
            {mobile?<MobileMeadowWorld objects={worldObjects} discovery
                discoveredIds={discovered} onInteract={onWorldInteract}
                caption="Hayvanlara dokun ve İngilizce isimlerini öğren" progress={discovered.length}/>:
              <div className="am-desktop-world"><ExplorerCanvas key={`meadow-discovery-${nonce}`} area="meadow"
                caption="Keşif Çayırı · Hayvanlara Dokun" objects={worldObjects}
                onInteract={onWorldInteract} height={520} progress={discovered.length}/></div>}
            <p className="am-discovery-help mt-3 rounded-xl bg-emerald-950/65 p-3 text-center text-xs font-bold text-sky-100">Hayvanlara dokun, karakterin yanlarına yürüsün. Keşfettiklerin albüme eklenir. İstersen aşağıdaki erişilebilir listeyi de kullan.</p>
            <div className="my-4 flex items-center justify-between rounded-xl border border-white/20 bg-emerald-950/65 px-4 py-3 text-sm font-bold">
              <span>🌱 Keşfedilen Hayvanlar</span><span className="text-lime-200">{discovered.length}/{activePlan.animals.length}</span>
            </div>
            <details className="am-compact-details mb-3 rounded-2xl border border-white/20 bg-emerald-950/40 p-3">
              <summary className="min-h-11 cursor-pointer py-3 text-sm font-black text-lime-100">♿ Hayvan Listesi / Alternatif Kontrol</summary>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {activePlan.animals.map(id=>{
                const word=findAnimal(id)!;
                return <button key={id} onClick={()=>discover(word)} disabled={saving} aria-pressed={discovered.includes(id)}
                  aria-label={`${word.tr}, İngilizce ${word.id}, keşfet`}
                  className={`am-tap flex min-h-44 flex-col items-center justify-center rounded-3xl border bg-white/10 p-3 shadow-lg ${discovered.includes(id)?'border-lime-300 bg-lime-400/15':'border-white/30 hover:border-white/80'}`}>
                  <AnimalPicture word={word}/>
                  <span className="mt-2 text-base font-black uppercase">{word.id}</span>
                  <span className="mt-1 text-sm text-sky-100">{word.tr}</span>
                  <span className="mt-1 text-[11px] font-semibold text-sky-100/85">🏡 {word.habitat}</span>
                  <span className="mt-1 text-xs font-bold text-lime-200">{discovered.includes(id)?'✓ Keşfedildi':canSpeak(word)?'🔊 Dokun, dinle':'👆 Keşfet'}</span>
                </button>;
              })}
              </div>
            </details>
            <button onClick={()=>void finish()} disabled={saving||discovered.length!==activePlan.animals.length} className="am-cta mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40">
              {saving?'Kaydediliyor…':`Keşfi Tamamla (${discovered.length}/${activePlan.animals.length})`}
            </button>
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
                    stage===5?(rescueSelected?'🏡 Find its home!':animalCommandFor(target,englishLevel,gradeLevel)):
                    'Which animal is this?'}
                </h2>
                <p className="am-task-hint">
                  {stage===3?(noAudioMode?'Yazılı destek açık.':'İngilizce kelimeyi dinle.'):
                    stage===5?(rescueSelected?'Şimdi doğru yuvaya dokun.':'Kayıp hayvanı bul.'):
                    stage===4?'Söylenen hayvanı bul.':'Resme bak, İngilizce adını seç.'}
                </p>
                {stage===2&&assisted&&<p className="am-task-hint">💡 {target.tr}</p>}
              </div>
              <div className="am-task-actions">
                {(stage===3||stage===4||stage===5)&&
                  <button type="button" className="am-task-action"
                    onClick={()=>speak(target,stage===4||stage===5&&!rescueSelected)}
                    disabled={!canSpeak(target)} aria-label="İngilizceyi dinle">🔊</button>}
                {stage===3&&!noAudioMode&&<button type="button" className="am-task-action"
                  disabled={awaiting} onClick={()=>{setTextMode(true);setAssisted(true);}}
                  aria-label="Ses yoksa yazılı modu aç">Aa</button>}
                {stage===2&&<button type="button" className="am-task-action"
                  disabled={awaiting} onClick={()=>setAssisted(true)}
                  aria-label="Türkçe ipucu göster">💡</button>}
              </div>
            </div>
            {(stage===4||stage===5)?(mobile?
              <MobileMeadowWorld objects={worldObjects} onInteract={onWorldInteract}
                caption={stage===5&&rescueSelected?'Doğru yuvaya dokun':'Söylenen hayvana dokun'}
                wrongChoice={wrongChoice} awaiting={awaiting} targetId={target.id}
                habitatMode={stage===5&&rescueSelected} progress={correctCount}/>:
              <div className="am-desktop-world"><ExplorerCanvas
                key={`meadow-quest-${stage}-${nonce}`} area="meadow"
                caption={stage===5 ? rescueSelected?'Yuva Kurtarma · Uygun Yuvaya Yürü':'Kayıp Dostu Bul · Hayvana Yürü' : 'Görev Patikası · Söylenen Hayvanı Bul'}
                objects={worldObjects} onInteract={onWorldInteract} height={510} progress={correctCount}/></div>):
              <MeadowScene stage={stage} word={target} blooms={correctCount}/> }
            {stage===5 && rescueSelected && <div className="am-rescue mt-2 flex items-center justify-center gap-3 rounded-xl bg-emerald-900/75 p-3">
              <AnimalPicture word={target}/>
              <span className="text-sm font-black text-lime-100">→ YUVASINI BUL!</span>
            </div>}
            {stage===4 && awaiting && <div className="am-rescue mt-2 rounded-2xl border border-lime-200/50 bg-lime-400/15 p-3 text-center text-sm font-extrabold text-lime-100">
              🐾 {target.tr} güvenli yuvasına doğru koşuyor!
            </div>}
            {activePlan.reviewIds.length>0 && <p className="mt-3 rounded-xl bg-sky-950/65 p-2 text-center text-xs text-sky-100">🔁 Pekiştirme turu: zorlandığın kelimeler yeniden karşına çıkıyor.</p>}
            <details className={stage===4||stage===5?'am-compact-details':'am-primary-answer-details'}
              open={stage===2||stage===3?true:undefined}>
              <summary className={stage===2||stage===3?'sr-only':'am-details-label'}>
                ♿ Alternatif hayvan / yuva seçenekleri
              </summary>
              <div className="am-choices grid grid-cols-3 gap-2 sm:gap-3" role="group"
              aria-label={stage===5&&rescueSelected?'Hayvan için doğru yuva':'Hayvan cevabı'}>
              {currentQuestion.choices.map(id=>{
                const word=findAnimal(id)!;
                const habitatChoice=stage===5 && rescueSelected;
                const textOnly=stage===2 || habitatChoice;
                return <button key={id} onClick={()=>habitatChoice?chooseHabitat(id):choose(id)} disabled={saving||awaiting}
                  aria-pressed={awaiting && id===target.id}
                  aria-label={habitatChoice?`Yaşam alanı: ${word.habitat}`:textOnly?`${word.id} İngilizce kelimesi`:`${word.tr} hayvanını seç`}
                  className={`am-choice am-tap flex min-h-28 flex-col items-center justify-center rounded-2xl border bg-slate-950/45 p-2 text-center shadow-lg disabled:opacity-65 sm:min-h-36 sm:p-4
                    ${awaiting && id===target.id?'border-lime-300 bg-lime-400/20 ring-2 ring-lime-300/50':wrongChoice===id?'border-rose-300 bg-rose-400/20':'border-white/25 hover:border-sky-200'}`}>
                  {habitatChoice && <span aria-hidden="true" className="mb-2 text-3xl">{word.place==='Gölet'?'💧':word.place==='Çiftlik'?'🚜':word.place==='Ağaç'?'🌳':word.place==='Çayır'?'🌿':word.place==='Çiçeklik'?'🌸':'🏡'}</span>}
                  {!textOnly && <AnimalPicture word={word}/>}
                  <span className="mt-2 text-xs font-black sm:text-lg">{habitatChoice?word.habitat:textOnly?word.id.toUpperCase():word.tr}</span>
                </button>;
              })}
              </div>
            </details>
            <div className="mt-4 min-h-16 text-center">
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
        <p className="py-5 text-center text-xs text-sky-100/70">Yıldızlar yalnızca kaydedilmiş en iyi başarıdan hesaplanır. Ses yoksa yazılı oynanabilir; dinleme etkinliğinde yazılı mod yardımlı sayılır.</p>
      </main>
    </div>
  );
}
