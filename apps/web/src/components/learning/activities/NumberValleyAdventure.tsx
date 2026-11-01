'use client';

import React, {useEffect,useMemo,useRef,useState} from 'react';
import type {NumberAnswerEvidence} from '@ventra/shared';
import {EventBus} from '@/lib/game/EventBus';
import {soundService} from '@/lib/audio/SoundService';
import {getProgressRepository} from '@/lib/progress';
import {englishNumber,planNumberMission,type NumberMissionPlan,type NumberStage} from '@/lib/learning/numberValleyEngine';
import type {NumberValleyProgress} from '@/lib/progress/numberValleyProgress';
import {resolveGradeAwarePolicy} from '@/lib/learning/gradeAwareLearningPolicy';
import './number-valley.css';

const CHAPTERS=[
  {icon:'💎',title:'Kristal Keşfi',caption:'Kayıp sayı kristallerini keşfet'},
  {icon:'🌉',title:'Işık Köprüsü',caption:'Doğru kelimeyle köprü kur'},
  {icon:'⭐',title:'Yıldız Hasadı',caption:'İstenen miktarda yıldız topla'},
  {icon:'🔊',title:'Yankı Kanyonu',caption:'Duyduğun sayıyı bul'},
  {icon:'🌀',title:'Portal Onarımı',caption:'Kristal say, doğru şifreyi seç'}
] as const;
const DECOR=['💎','🔮','✨','⭐','🌟','💠'] as const;
interface Props {
  profileId:string;
  gradeLevel?:number|null;
  englishLevel:'Pre-A1'|'A1'|'A2';
  progress:NumberValleyProgress;
  onBack:()=>void;
  onSave:(mission:number,mistakes:number,correct:number,duration:number,answers:NumberAnswerEvidence[],sessionId:string)=>Promise<void>;
}
function newSession(profileId:string,stage:number):string{
  return `nv_${profileId}_${stage}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
function Stars({count,active=false}:{count:number;active?:boolean}){
  return <div className="nv-stars" aria-label={`${count} adet yıldız`}>
    {Array.from({length:count},(_,i)=><span key={i} aria-hidden="true"
      className={active?'nv-star nv-star-active':'nv-star'}
      style={{animationDelay:`${(i%7)*110}ms`}}>★</span>)}
  </div>;
}
function Gem({number,discovered=false}:{number:number;discovered?:boolean}){
  return <span className={`nv-gem ${discovered?'nv-gem-found':''}`} aria-hidden="true">
    <span className="nv-gem-facet"/><span className="nv-gem-number">{number}</span>
  </span>;
}
export function NumberValleyAdventure({profileId,englishLevel,gradeLevel=null,progress,onBack,onSave}:Props){
  const [stage,setStage]=useState<NumberStage>(()=>Math.min(5,progress.completedLevels+1) as NumberStage);
  const [nonce,setNonce]=useState(0);
  const [plan,setPlan]=useState<NumberMissionPlan|null>(null);
  const [planKey,setPlanKey]=useState('');
  const [loadError,setLoadError]=useState(false);
  const [visited,setVisited]=useState<number[]>([]);
  const [answers,setAnswers]=useState<NumberAnswerEvidence[]>([]);
  const [question,setQuestion]=useState(0);
  const [count,setCount]=useState(0);
  const [portalPhase,setPortalPhase]=useState<'collect'|'decode'>('collect');
  const [mistakes,setMistakes]=useState(0);
  const [perQuestionMistakes,setPerQuestionMistakes]=useState(0);
  const [hintUsed,setHintUsed]=useState(false);
  const [feedback,setFeedback]=useState<{text:string;good:boolean}|null>(null);
  const [awaitingNext,setAwaitingNext]=useState(false);
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState('');
  const [completed,setCompleted]=useState(false);
  const [speechAvailable,setSpeechAvailable]=useState(false);
  const [muted,setMuted]=useState(()=>soundService.getMuted());
  const start=useRef(Date.now());
  const session=useRef(newSession(profileId,stage));
  const writeLock=useRef(false);
  const dialog=useRef<HTMLDivElement>(null);
  const heading=useRef<HTMLHeadingElement>(null);
  const policy=useMemo(()=>resolveGradeAwarePolicy({domain:'numbers',gradeLevel,englishLevel}),[gradeLevel,englishLevel]);
  const key=`${profileId}:${gradeLevel??'unset'}:${englishLevel}:${stage}:${nonce}`;
  const activePlan=planKey===key&&plan?.mission===stage?plan:null;
  const current=stage===1?null:activePlan?.questions[question]??null;

  useEffect(()=>{
    let alive=true;
    setLoadError(false);setPlan(null);setPlanKey('');
    getProgressRepository().getNumberAnswerHistory(profileId).then(history=>{
      if(!alive)return;
      const next=planNumberMission({mission:stage,gradeLevel,englishLevel,history,
        seed:Math.floor(Math.random()*4294967295)});
      setPlan(next);setPlanKey(key);
    }).catch(error=>{
      console.error('Sayı Vadisi görevi yüklenemedi',error);
      if(alive)setLoadError(true);
    });
    return()=>{alive=false;};
  },[key,profileId,gradeLevel,englishLevel,stage,nonce]);

  useEffect(()=>{
    const cancel=()=>{if(typeof window!=='undefined'&&'speechSynthesis' in window)window.speechSynthesis.cancel();};
    const onMute=(next:boolean)=>{setMuted(next);if(next)cancel();};
    const visibility=()=>{if(document.hidden)cancel();};
    setSpeechAvailable(typeof window!=='undefined'&&'speechSynthesis' in window&&
      typeof SpeechSynthesisUtterance!=='undefined');
    EventBus.on('MUTE_STATE_CHANGED',onMute);
    document.addEventListener('visibilitychange',visibility);
    return()=>{EventBus.off('MUTE_STATE_CHANGED',onMute);document.removeEventListener('visibilitychange',visibility);cancel();};
  },[]);
  useEffect(()=>{
    dialog.current?.scrollTo({top:0,behavior:'instant'});
    heading.current?.focus({preventScroll:true});
  },[stage,nonce]);

  function speak(value:number,phrase=false){
    if(muted||!speechAvailable)return;
    try{
      window.speechSynthesis.cancel();
      const line=new SpeechSynthesisUtterance(phrase?`Collect ${englishNumber(value)} stars`:englishNumber(value));
      line.lang='en-US';line.rate=.79;
      const voices=window.speechSynthesis.getVoices();
      line.voice=voices.find(x=>x.lang.toLowerCase()==='en-us')??
        voices.find(x=>x.lang.toLowerCase().startsWith('en'))??null;
      window.speechSynthesis.speak(line);
    }catch(error){console.warn('Sayı seslendirme kullanılamıyor',error);setSpeechAvailable(false);}
  }
  function restart(next:NumberStage){
    if(saving)return;
    writeLock.current=false;
    start.current=Date.now();
    session.current=newSession(profileId,next);
    setStage(next);setNonce(v=>v+1);setPlan(null);setPlanKey('');setLoadError(false);
    setVisited([]);setAnswers([]);setQuestion(0);setCount(0);setPortalPhase('collect');
    setMistakes(0);setPerQuestionMistakes(0);setHintUsed(false);setFeedback(null);
    setAwaitingNext(false);setSaving(false);setSaveError('');setCompleted(false);
  }
  async function finish(evidence:NumberAnswerEvidence[],correct:number){
    if(writeLock.current)return;
    writeLock.current=true;setSaving(true);setSaveError('');
    try{
      await onSave(stage,mistakes,correct,(Date.now()-start.current)/1000,evidence,session.current);
      soundService.playSfx('fanfare');
      setAnswers(evidence);setCompleted(true);setFeedback(null);
    }catch(error){
      console.error('Sayı Vadisi ilerlemesi kaydedilemedi',error);
      setSaveError('İlerleme kaydedilemedi. İnternet gerekmeden yeniden deneyebilirsin.');
      writeLock.current=false;
    }finally{setSaving(false);}
  }
  function discover(value:number){
    if(!activePlan||stage!==1||saving||completed)return;
    speak(value);soundService.playSfx('tap');
    if(visited.includes(value))return;
    setVisited(old=>[...old,value]);
    setFeedback({good:true,text:`${value} — ${englishNumber(value).toUpperCase()}! Kristal keşfedildi.`});
    setAnswers(old=>[...old,{value,kind:'discovery',mistakes:0,firstTryCorrect:false,timestamp:new Date().toISOString()}]);
  }
  function mistake(message:string){
    if(saving||awaitingNext)return;
    setMistakes(v=>v+1);setPerQuestionMistakes(v=>v+1);
    setFeedback({text:message,good:false});soundService.playSfx('gentle_retry');
  }
  function correctAnswer(){
    if(!activePlan||!current||awaitingNext||saving||completed)return;
    soundService.playSfx('correct');
    const row:NumberAnswerEvidence={
      value:current.target,kind:current.skill,mistakes:perQuestionMistakes,
      firstTryCorrect:perQuestionMistakes===0&&!hintUsed,hintUsed,
      timestamp:new Date().toISOString()
    };
    setAnswers(old=>[...old,row]);
    setFeedback({good:true,text:`Harika! ${current.target} = ${englishNumber(current.target).toUpperCase()}`});
    setAwaitingNext(true);
  }
  function choose(value:number){
    if(!current||awaitingNext||saving||completed)return;
    if(value!==current.target){mistake('Bu sayı değil. Diğer seçeneği dene.');return;}
    correctAnswer();
  }
  function confirmCount(){
    if(!current||saving||awaitingNext||completed)return;
    if(count!==current.target){mistake('Henüz doğru miktar değil. Yıldızları yeniden say.');return;}
    if(stage===5&&portalPhase==='collect'){
      setPortalPhase('decode');setFeedback({text:'Portal doldu! Şimdi İngilizce şifreyi bul.',good:true});
      soundService.playSfx('correct');
      return;
    }
    correctAnswer();
  }
  function next(){
    if(!activePlan||!awaitingNext||saving||writeLock.current)return;
    const last=question+1>=activePlan.questions.length;
    if(last){void finish(answers,answers.length);return;}
    setQuestion(v=>v+1);setCount(0);setPortalPhase('collect');setPerQuestionMistakes(0);
    setFeedback(null);setHintUsed(false);setAwaitingNext(false);
  }
  const total=stage===1?activePlan?.discoveries.length??0:activePlan?.questions.length??0;
  const done=stage===1?visited.length:question+Number(awaitingNext);
  const completeEnabled=stage===1&&activePlan&&visited.length===activePlan.discoveries.length&&visited.length>0;
  const buttonsDisabled=saving||awaitingNext||completed;

  return <div ref={dialog} role="dialog" aria-modal="true" aria-label="Sayı Vadisi macerası"
      onPointerDown={e=>e.stopPropagation()} onPointerMove={e=>e.stopPropagation()}
      onPointerUp={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()}
      className="nv-root fixed inset-0 z-50 overflow-y-auto overscroll-contain text-white">
    <div className="nv-sky" aria-hidden="true"><span className="nv-orb nv-orb-one"/><span className="nv-orb nv-orb-two"/>
      <span className="nv-orb nv-orb-three"/><span className="nv-sky-stars">✦ · ✧ · ✦ · ✧ · ✦</span></div>
    <main className="relative mx-auto max-w-6xl px-3 pb-12 pt-4 sm:px-7 sm:pt-6"
      style={{paddingTop:'max(16px,env(safe-area-inset-top))',paddingBottom:'max(28px,env(safe-area-inset-bottom))'}}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={onBack} disabled={saving} className="nv-control rounded-2xl px-4 py-3 text-sm font-bold disabled:opacity-50">← Kelime Bahçesi</button>
        <div className="flex items-center gap-2">
          <span className="nv-control rounded-xl px-3 py-3 text-xs font-black">
            ⭐ {Object.values(progress.starsByLevel).reduce((s,n)=>s+n,0)}/15
          </span>
          <span className="nv-control hidden rounded-xl px-3 py-3 text-xs font-bold sm:inline-block">
            {gradeLevel?gradeLevel+'. Sınıf':'Keşif'} · {englishLevel}
          </span>
          <button onClick={()=>{const value=soundService.toggleMute();setMuted(value);if(value)window.speechSynthesis?.cancel();}}
            aria-label={muted?'Sesi aç':'Sesi kapat'} aria-pressed={muted}
            className="nv-control min-h-12 rounded-xl px-3">{muted?'🔇':'🔊'}</button>
        </div>
      </header>
      <div className="py-6 text-center sm:py-9">
        <p className="text-xs font-black uppercase tracking-[.23em] text-cyan-200">VENTRA KIDS · SAYI VADİSİ · BÖLÜM {stage}/5</p>
        <h1 ref={heading} tabIndex={-1} className="mt-3 text-3xl font-black tracking-tight outline-none sm:text-5xl">
          {CHAPTERS[stage-1].icon} {CHAPTERS[stage-1].title}
        </h1>
        <p className="mt-3 text-sm text-sky-100 sm:text-base">{CHAPTERS[stage-1].caption}</p>
      </div>
      <nav aria-label="Sayı Vadisi görevleri" className="mb-5 grid grid-cols-5 gap-1.5 sm:gap-3">
        {CHAPTERS.map((part,i)=>{
          const unlocked=i<progress.completedLevels+1;
          return <button key={i} disabled={!unlocked||saving} onClick={()=>restart((i+1) as NumberStage)}
            aria-current={stage===i+1?'step':undefined}
            aria-label={`${i+1}. ${part.title}${unlocked?'':' (kilitli)'}`}
            className={`nv-chapter rounded-xl px-1.5 py-3 text-center text-[10px] font-bold sm:px-3 sm:text-sm
              ${stage===i+1?'nv-chapter-current':''} disabled:opacity-35`}>
            <span className="block text-xl sm:text-2xl" aria-hidden="true">{unlocked?part.icon:'🔒'}</span>
            <span className="mt-1 block">{i+1}. {part.title}</span>
          </button>;
        })}
      </nav>
      {loadError&&<div role="alert" className="nv-panel mx-auto max-w-xl rounded-2xl p-6 text-center">
        <p>Görev yüklenemedi. Mevcut ilerleme korunuyor.</p>
        <button className="nv-primary mt-3 rounded-xl px-5 py-3" onClick={()=>restart(stage)}>Yeniden Dene</button>
      </div>}
      {!loadError&&!activePlan&&!completed&&<div role="status" className="nv-panel rounded-2xl p-10 text-center">Kristaller hazırlanıyor…</div>}
      {!loadError&&activePlan&&!completed&&(
        <div className="nv-panel overflow-hidden rounded-[28px] p-3 shadow-2xl sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3 text-xs font-bold text-sky-100 sm:text-sm">
            <span>✨ {stage===1?'Keşfedilen kristaller':'Görev ilerlemesi'}</span>
            <span>{done}/{total}</span>
          </div>
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
            <div className="nv-progress h-full rounded-full" style={{width:`${total?100*done/total:0}%`}}/>
          </div>
          <section aria-label="Sayı Vadisi oyun sahnesi" className="nv-landscape relative min-h-[270px] overflow-hidden rounded-[22px] px-3 py-7 sm:min-h-[355px] sm:p-8">
            <div aria-hidden="true" className="nv-mountain nv-mountain-one"/><div aria-hidden="true" className="nv-mountain nv-mountain-two"/>
            <div aria-hidden="true" className="nv-land"/><div aria-hidden="true" className="nv-cloud">☁️</div>
            {stage===1&&<div className="relative z-10">
              <h2 className="mb-3 text-center text-xl font-black text-white drop-shadow-lg sm:text-2xl">Kristallere dokun ve sayılarını dinle!</h2>
              <div className="mx-auto grid max-w-3xl grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-5">
                {activePlan.discoveries.map((value,i)=><button key={value} type="button"
                  onClick={()=>discover(value)} aria-pressed={visited.includes(value)}
                  aria-label={`${value} · ${englishNumber(value)} · ${visited.includes(value)?'Keşfedildi':'Keşfet'}`}
                  className={`nv-crystal-tile group rounded-2xl p-2 text-center ${visited.includes(value)?'nv-discovered':''}`}
                  style={{animationDelay:`${i*80}ms`}}>
                    <Gem number={value} discovered={visited.includes(value)}/>
                    <span className="mt-2 block text-xs font-black uppercase tracking-wide sm:text-sm">{visited.includes(value)?englishNumber(value):'Keşfet'}</span>
                    <span className="block text-xs text-emerald-100">{visited.includes(value)?'✓ Öğrenildi':'Dokun'}</span>
                  </button>)}
              </div>
            </div>}
            {stage!==1&&current&&<div className="relative z-10 mx-auto max-w-3xl text-center">
              <p className="text-xs font-extrabold uppercase tracking-[.18em] text-sky-100">Soru {question+1}/{total}</p>
              <h2 className="mt-2 text-2xl font-black drop-shadow-lg sm:text-4xl">
                {stage===2?'Doğru köprü taşını seç!':stage===3?'İstenen yıldızları topla!':
                  stage===4?'Yankıyı dinle, sayıyı bul!':'Portalı çalıştır!'}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-relaxed text-white/90">
                {stage===2?`${current.target} sayısının İngilizce adını bul.`:
                  stage===3?`Collect ${englishNumber(current.target)} stars — ${current.target} yıldız topla.`:
                  stage===4?'İngilizce duyduğun sayıya ait taşı seç.':
                  portalPhase==='collect'?`Collect ${englishNumber(current.target)} gems — ${current.target} kristal topla.`:
                  'Kristal sayısı doğru. Şimdi portalın İngilizce şifresini seç.'}
              </p>
              {(stage===3||stage===5)&&<div className="nv-counting mt-5 rounded-[22px] p-3 sm:p-5">
                <div className="mb-2 flex items-center justify-center gap-3">
                  <button type="button" disabled={buttonsDisabled||count===0||portalPhase==='decode'}
                    onClick={()=>setCount(x=>Math.max(0,x-1))}
                    aria-label="Bir nesneyi geri bırak"
                    className="nv-control min-h-12 min-w-12 rounded-full text-2xl font-black disabled:opacity-35">−</button>
                  <span className="min-w-16 text-4xl font-black tabular-nums text-amber-200">{count}</span>
                  <button type="button" disabled={buttonsDisabled||count>=20||portalPhase==='decode'}
                    onClick={()=>{setCount(x=>Math.min(20,x+1));soundService.playSfx('tap');}}
                    aria-label="Bir nesne topla" className="nv-control min-h-12 min-w-12 rounded-full text-2xl font-black disabled:opacity-35">+</button>
                </div>
                {stage===3?<Stars count={count} active/>:
                  <div aria-label={`${count} kristal toplandı`} className="flex min-h-14 flex-wrap justify-center gap-1.5" >
                    {Array.from({length:count},(_,i)=><span key={i} className="text-xl sm:text-2xl" aria-hidden="true">💎</span>)}
                  </div>}
                {(stage===3||portalPhase==='collect')&&
                  <button onClick={confirmCount} disabled={buttonsDisabled} className="nv-primary mt-3 min-h-12 rounded-xl px-7 py-3 text-sm font-black disabled:opacity-50">
                    {stage===5?'Portal Kristallerini Yerleştir':'Yıldızları Teslim Et'}
                  </button>}
              </div>}
              {(stage===2||stage===4||(stage===5&&portalPhase==='decode'))&&
                <div className="mx-auto mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
                  {current.choices.map((value,i)=><button key={value} onClick={()=>choose(value)} disabled={buttonsDisabled}
                    aria-label={stage===2||stage===5?`${englishNumber(value)} kelimesini seç`:`${value} sayısını seç`}
                    className="nv-choice group min-h-24 rounded-2xl px-3 py-5 text-center disabled:opacity-60 sm:min-h-32">
                    <span className="block text-xl font-black tracking-wide sm:text-2xl">{stage===4?value:englishNumber(value).toUpperCase()}</span>
                    <span className="mt-2 block text-xs text-sky-100">{stage===4?'Sayı taşı':'Işık taşı'} {i+1}</span>
                  </button>)}
                </div>}
              {stage===4&&<div className="mt-4 flex flex-col items-center gap-2">
                <button onClick={()=>speak(current.target)} disabled={muted||!speechAvailable||buttonsDisabled}
                  className="nv-control min-h-12 rounded-full px-6 text-sm font-bold disabled:opacity-45">
                  {muted?'🔇 Ses Kapalı':speechAvailable?'🔊 Yeniden Dinle':'🔇 Ses Kullanılamıyor'}
                </button>
                <button onClick={()=>{setHintUsed(true);setFeedback({good:true,text:`Yazılı destek: ${englishNumber(current.target).toUpperCase()}`});}}
                  disabled={buttonsDisabled} className="min-h-11 rounded-xl px-4 text-xs font-bold underline underline-offset-4">
                  {muted||!speechAvailable?'Yazılı yönergeyi göster':'Yazılı yardım al'}
                </button>
                {(hintUsed||muted||!speechAvailable)&&<p role="status" className="text-sm font-black text-lime-100">
                  {englishNumber(current.target).toUpperCase()} · Bu tur yazılı desteklidir.
                </p>}
              </div>}
            </div>}
          </section>
          {feedback&&<p role="status" aria-live="polite"
            className={`mt-4 rounded-xl border px-4 py-3 text-center text-sm font-bold ${feedback.good?
            'border-lime-300/30 bg-emerald-800/45 text-lime-100':'border-amber-300/35 bg-amber-950/60 text-amber-100'}`}>
            {feedback.good?'✨ ':'🔁 '}{feedback.text}
          </p>}
          {stage===1?<button onClick={()=>void finish(answers,answers.length)}
            disabled={!completeEnabled||saving} className="nv-primary mt-5 min-h-14 w-full rounded-2xl p-4 font-black disabled:cursor-not-allowed disabled:opacity-40">
            {saving?'Kaydediliyor…':`Keşfi Tamamla (${visited.length}/${total})`}
          </button>:awaitingNext&&<button onClick={next} disabled={saving} className="nv-primary mt-5 min-h-14 w-full rounded-2xl p-4 font-black disabled:opacity-45">
            {saving?'Kaydediliyor…':question+1===total?'Görevi Kaydet →':'Sonraki Görev →'}
          </button>}
          {stage!==1&&!current&&<p role="alert" className="mt-5 text-center text-amber-100">Soru oluşturulamadı. Önce Kristal Keşfi görevini tekrar oyna.</p>}
          {saveError&&<p role="alert" className="mt-4 rounded-xl bg-rose-950/80 px-4 py-3 text-center text-sm">
            {saveError} <button onClick={()=>void finish(answers,answers.length)}
              className="ml-2 font-black underline" disabled={saving}>Tekrar kaydet</button>
          </p>}
        </div>
      )}
      {completed&&<section className="nv-panel mx-auto max-w-2xl rounded-[28px] p-6 text-center sm:p-10">
        <p className="text-6xl" aria-hidden="true">🏆</p>
        <h2 className="mt-3 text-3xl font-black">Görev Tamamlandı!</h2>
        <p className="mt-2 text-sky-100">İlerlemen bu çocuğun profiline kaydedildi.</p>
        <p className="mt-4 text-3xl font-black text-amber-200" aria-label="Bu görevde kazanılan yıldızlar">
          {'⭐'.repeat(mistakes===0?3:mistakes<=2?2:1)}
        </p>
        <p className="mt-3 text-sm text-sky-100">Doğru cevap: {answers.length} · Hata: {mistakes}</p>
        <button className="nv-primary mt-6 min-h-14 w-full rounded-xl px-6 py-4 font-black" onClick={()=>{
          if(stage===5)onBack();else restart((stage+1) as NumberStage);
        }}>{stage===5?'Kelime Bahçesi’ne Dön →':'Sonraki Bölüme Geç →'}</button>
        <button className="nv-control mt-3 min-h-12 w-full rounded-xl px-4 font-bold" onClick={()=>restart(stage)}>
          ↻ Bu Bölümü Yeni Sayılarla Tekrar Oyna
        </button>
      </section>}
      <footer className="mt-6 text-center text-xs text-sky-100/75">
        Sayı Vadisi · Sınıf düzeyine uygun görevler · Yanlışlar daha sonra tekrar sorulur · İlerleme kaybolmadan kaydedilir
      </footer>
    </main>
  </div>;
}
