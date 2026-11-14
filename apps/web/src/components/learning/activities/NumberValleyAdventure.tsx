'use client';

import React, {useEffect,useMemo,useRef,useState} from 'react';
import type {NumberAnswerEvidence} from '@ventra/shared';
import {EventBus} from '@/lib/game/EventBus';
import {soundService} from '@/lib/audio/SoundService';
import {getProgressRepository} from '@/lib/progress';
import {englishNumber,planNumberMission,NUMBER_BANDS,unlockedNumberBands,type NumberBand,type NumberMissionPlan,type NumberStage} from '@/lib/learning/numberValleyEngine';
import {numberWordParts,numberWordTiles,portalSentence} from '@/lib/learning/numberWordQuest';
import type {NumberValleyProgress} from '@/lib/progress/numberValleyProgress';
import {resolveGradeAwarePolicy} from '@/lib/learning/gradeAwareLearningPolicy';
import {NumberValleyScenery,ValleyMilestone} from './NumberValleyScenery';
import './number-valley.css';
import './number-valley-v5.css';
import {useAutoQuestionAdvance} from '@/lib/learning/useAutoQuestionAdvance';
import {GardenHelp} from '../GardenHelp';
import {LearningMotion} from '@/components/learning/motion/LearningMotion';

const CHAPTERS=[
  {icon:'💎',title:'Kristal Keşfi',caption:'Kayıp sayı kristallerini keşfet'},
  {icon:'🌉',title:'Işık Köprüsü',caption:'Doğru kelimeyle köprü kur'},
  {icon:'⭐',title:'Yıldız Kelime Avı',caption:'Yıldız harfleriyle İngilizce sayı kelimesini oluştur'},
  {icon:'🔊',title:'Yankı Kanyonu',caption:'Duyduğun sayıyı bul'},
  {icon:'🌀',title:'Portalın Şifresi',caption:'İngilizce sözcükleri kullanarak cümle kur'}
] as const;
interface Props {
  profileId:string;
  gradeLevel?:number|null;
  englishLevel:'Pre-A1'|'A1'|'A2';
  progress:NumberValleyProgress;
  onBack:()=>void;
  onSave:(mission:number,mistakes:number,correct:number,duration:number,answers:NumberAnswerEvidence[],sessionId:string,band:NumberBand)=>Promise<void>;
}
function newSession(profileId:string,stage:number):string{
  return `nv_${profileId}_${stage}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
function Gem({number,discovered=false}:{number:number;discovered?:boolean}){
  return <span className={`nv-gem ${discovered?'nv-gem-found':''}`} aria-hidden="true">
    <span className="nv-gem-facet"/><span className="nv-gem-number">{number}</span>
  </span>;
}
export function NumberValleyAdventure({profileId,englishLevel,gradeLevel=null,progress,onBack,onSave}:Props){
  const [band,setBand]=useState<NumberBand>('ones');
  const [unlockedBands,setUnlockedBands]=useState<NumberBand[]>(['ones']);
  const [stage,setStage]=useState<NumberStage>(()=>Math.min(5,progress.completedByBand.ones+1) as NumberStage);
  const [nonce,setNonce]=useState(0);
  const [plan,setPlan]=useState<NumberMissionPlan|null>(null);
  const [planKey,setPlanKey]=useState('');
  const [loadError,setLoadError]=useState(false);
  const [visited,setVisited]=useState<number[]>([]);
  const [answers,setAnswers]=useState<NumberAnswerEvidence[]>([]);
  const [question,setQuestion]=useState(0);
  const [selectedWordTiles,setSelectedWordTiles]=useState<number[]>([]);
  const [selectedPortalTokens,setSelectedPortalTokens]=useState<number[]>([]);
  const [portalPhase,setPortalPhase]=useState<'collect'|'decode'|'seal'>('collect');
  const [mistakes,setMistakes]=useState(0);
  const [perQuestionMistakes,setPerQuestionMistakes]=useState(0);
  const [hintUsed,setHintUsed]=useState(false);
  const [feedback,setFeedback]=useState<{text:string;good:boolean}|null>(null);
  const [lastChoice,setLastChoice]=useState<number|null>(null);
  const [awaitingNext,setAwaitingNext]=useState(false);
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState('');
  const [completed,setCompleted]=useState(false);
  const [speechAvailable,setSpeechAvailable]=useState(false);
  const [heardAudio,setHeardAudio]=useState(false);
  const [speaking,setSpeaking]=useState(false);
  const audioRequest=useRef(0);
  const [muted,setMuted]=useState(()=>soundService.getMuted());
  const start=useRef(Date.now());
  const session=useRef(newSession(profileId,stage));
  const writeLock=useRef(false);
  const dialog=useRef<HTMLDivElement>(null);
  const heading=useRef<HTMLHeadingElement>(null);
  const policy=useMemo(()=>resolveGradeAwarePolicy({domain:'numbers',gradeLevel,englishLevel}),[gradeLevel,englishLevel]);
  const key=`${profileId}:${gradeLevel??'unset'}:${englishLevel}:${band}:${stage}:${nonce}`;
  const activePlan=planKey===key&&plan?.mission===stage?plan:null;
  const current=stage===1?null:activePlan?.questions[question]??null;
  const wordTiles=useMemo(()=>current&&stage===3?numberWordTiles(current.target,(activePlan?.seed??0)+question):[],
    [current?.target,stage,activePlan?.seed,question]);
  const portalWords=current?['I','see',englishNumber(current.target),'stars']:[];
  const portalOrder=[2,0,3,1];

  useEffect(()=>{
    let alive=true;
    setLoadError(false);setPlan(null);setPlanKey('');
    getProgressRepository().getNumberAnswerHistory(profileId).then(history=>{
      if(!alive)return;
      setUnlockedBands(unlockedNumberBands(policy.maxNumber,history));
      const next=planNumberMission({mission:stage,gradeLevel,englishLevel,band,history,
        seed:Math.floor(Math.random()*4294967295)});
      setPlan(next);setPlanKey(key);
    }).catch(error=>{
      console.error('Sayı Vadisi görevi yüklenemedi',error);
      if(alive)setLoadError(true);
    });
    return()=>{alive=false;};
  },[key,profileId,gradeLevel,englishLevel,stage,nonce,band,policy.maxNumber]);

  useEffect(()=>{
    const cancel=()=>{audioRequest.current++;setHeardAudio(false);setSpeaking(false);
      soundService.cancelSpeech();};
    const onMute=(next:boolean)=>{setMuted(next);if(next)cancel();};
    const visibility=()=>{if(document.hidden)cancel();};
    setSpeechAvailable(soundService.hasEnglishSpeech());
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
    const request=++audioRequest.current;
    setHeardAudio(false);setSpeaking(false);
    const started=soundService.speakEnglish(phrase?portalSentence(value):englishNumber(value),{
      rate:0.8,
      onStart:()=>{if(request===audioRequest.current)setSpeaking(true);},
      onEnd:()=>{if(request===audioRequest.current){setHeardAudio(true);setSpeaking(false);}},
      onError:()=>{if(request===audioRequest.current){setHeardAudio(false);setSpeaking(false);setSpeechAvailable(false);}}
    });
    if(!started){setSpeechAvailable(false);}

  }
  function restart(next:NumberStage,nextBand:NumberBand=band){
    if(saving)return;
    writeLock.current=false;
    start.current=Date.now();
    session.current=newSession(profileId,next);
    setBand(nextBand);setStage(next);setNonce(v=>v+1);setPlan(null);setPlanKey('');setLoadError(false);
    audioRequest.current++;soundService.cancelSpeech();setHeardAudio(false);setSpeaking(false);
    setVisited([]);setAnswers([]);setQuestion(0);setLastChoice(null);setSelectedWordTiles([]);setSelectedPortalTokens([]);setPortalPhase('collect');
    setMistakes(0);setPerQuestionMistakes(0);setHintUsed(false);setFeedback(null);
    setAwaitingNext(false);setSaving(false);setSaveError('');setCompleted(false);
  }
  async function finish(evidence:NumberAnswerEvidence[],correct:number){
    if(writeLock.current)return;
    writeLock.current=true;setSaving(true);setSaveError('');
    try{
      await onSave(stage,mistakes,correct,(Date.now()-start.current)/1000,evidence,session.current,band);
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
    if(perQuestionMistakes>=1)setHintUsed(true);
  }
  function correctAnswer(){
    if(!activePlan||!current||awaitingNext||saving||completed)return;
    soundService.playSfx('correct');
    const row:NumberAnswerEvidence={
      value:current.target,kind:current.skill,mistakes:perQuestionMistakes,
      firstTryCorrect:perQuestionMistakes===0&&!hintUsed && !(stage===4&&(!heardAudio||muted||!speechAvailable)) && !(stage===3&&(muted||!speechAvailable)),
      hintUsed:hintUsed || (stage===4&&(!heardAudio||muted||!speechAvailable)) || (stage===3&&(muted||!speechAvailable)),
      timestamp:new Date().toISOString()
    };
    setAnswers(old=>[...old,row]);
    setFeedback({good:true,text:`Harika! ${current.target} = ${englishNumber(current.target).toUpperCase()}`});
    setAwaitingNext(true);
  }
  /** Spelling stars: the child builds an English word, not a numeric quantity. */
  function chooseWordTile(index:number){
    if(stage!==3||!current||buttonsDisabled)return;
    if(selectedWordTiles.includes(index))return;
    const needed=numberWordParts(current.target)[selectedWordTiles.length];
    const chosen=wordTiles[index];
    if(chosen?.part!==needed){mistake('Bu parça henüz sırada değil. Parlayan ipucunu deneyebilirsin.');return;}
    setSelectedWordTiles(old=>[...old,index]);
    soundService.playSfx('tap',0.45);
    if(selectedWordTiles.length+1===wordTiles.length)correctAnswer();
  }
  function choosePortalToken(index:number){
    if(stage!==5||portalPhase!=='decode'||!current||buttonsDisabled)return;
    const token=portalOrder[index];
    if(selectedPortalTokens.includes(token))return;
    if(token!==selectedPortalTokens.length){
      mistake('İngilizce cümledeki kelimelerin sırasını yeniden dene.');return;
    }
    setSelectedPortalTokens(old=>[...old,token]);
    soundService.playSfx('tap',0.5);
    if(selectedPortalTokens.length+1===4){
      setPortalPhase('seal');
      setFeedback({good:true,text:'I see … stars! Cümle tamamlandı. Son mühürü seç.'});
    }
  }
  function choose(value:number){
    if(!current||awaitingNext||saving||completed)return;
    if(stage===4&&!heardAudio&&!hintUsed&&!muted&&speechAvailable){
      setFeedback({text:'Önce yankıyı dinle veya yazılı yardım seç.',good:false});return;
    }
    if(value!==current.target){setLastChoice(value);mistake('Sayı kelimesine dikkat et ve tekrar dene.');return;}
    setLastChoice(value);
    if(stage===5&&portalPhase==='collect'){
      setPortalPhase('decode');
      setFeedback({text:'Doğru! Şimdi “I see … stars” cümlesini kur.',good:true});
      soundService.playSfx('correct');return;
    }
    if(stage!==5)correctAnswer();
  }
  function choosePortalSentence(value:number){
    if(stage!==5||portalPhase!=='seal'||buttonsDisabled||!current)return;
    if(value!==current.target){setLastChoice(value);mistake('Cümledeki sayı kelimesini yeniden kontrol et.');return;}
    setLastChoice(value);
    correctAnswer();
  }
  function next(){
    if(!activePlan||!awaitingNext||saving||writeLock.current)return;
    const last=question+1>=activePlan.questions.length;
    if(last){void finish(answers,answers.length);return;}
    audioRequest.current++;setHeardAudio(false);setSpeaking(false);
    soundService.cancelSpeech();
    setQuestion(v=>v+1);setLastChoice(null);setSelectedWordTiles([]);setSelectedPortalTokens([]);setPortalPhase('collect');setPerQuestionMistakes(0);
    setFeedback(null);setHintUsed(false);setAwaitingNext(false);
  }
  // Visibility-aware one-shot transition, canceled on unmount and error.
  useAutoQuestionAdvance({
    ready:awaitingNext,
    blocked:saving||completed||Boolean(saveError)||!activePlan,
    delayMs:1050,onAdvance:next
  });
  // Finish discovery automatically only after every unique crystal is saved
  // into the local evidence array. Failed persistence remains retryable.
  useAutoQuestionAdvance({
    ready:stage===1&&Boolean(activePlan?.discoveries.length)&&
      visited.length===activePlan?.discoveries.length&&answers.length===activePlan?.discoveries.length,
    blocked:saving||completed||Boolean(saveError)||!activePlan,
    delayMs:950,onAdvance:()=>{void finish(answers,answers.length);}
  });

  const total=stage===1?activePlan?.discoveries.length??0:activePlan?.questions.length??0;
  const done=stage===1?visited.length:question+Number(awaitingNext);
  const completeEnabled=stage===1&&activePlan&&visited.length===activePlan.discoveries.length&&visited.length>0;
  const bandLabel=NUMBER_BANDS.find(x=>x.id===band)?.title??'Kristal Patikası';
  const buttonsDisabled=saving||awaitingNext||completed;

  return <div ref={dialog} role="dialog" aria-modal="true" aria-label="Sayı Vadisi macerası"
      onPointerDown={e=>e.stopPropagation()} onPointerMove={e=>e.stopPropagation()}
      onPointerUp={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()}
      className="nv-root nv5-root fixed inset-0 z-50 overflow-y-auto overscroll-contain text-white">
    <div className="nv-sky" aria-hidden="true"><span className="nv-orb nv-orb-one"/><span className="nv-orb nv-orb-two"/>
      <span className="nv-orb nv-orb-three"/><span className="nv-sky-stars">✦ · ✧ · ✦ · ✧ · ✦</span></div>
    <main className="nv5-main relative mx-auto max-w-6xl px-3 pb-12 pt-4 sm:px-7 sm:pt-6"
      style={{paddingTop:'max(16px,env(safe-area-inset-top))',paddingBottom:'max(28px,env(safe-area-inset-bottom))'}}>
      <header className="nv5-header">
        <button onClick={onBack} disabled={saving} aria-label="Kelime Bahçesi’ne dön" className="nv-control nv5-back rounded-2xl px-4 py-3 text-sm font-bold disabled:opacity-50">
          <span className="nv5-back-arrow" aria-hidden="true">‹</span><span className="nv5-back-label">Kelime Bahçesi</span>
        </button>
        <div className="nv5-header-status">
          <span className="nv-control nv5-starcount rounded-xl px-3 py-3 text-xs font-black">
            ⭐ {Object.entries(progress.starsByLevel).filter(([id])=>Number(id)<=
              (policy.maxNumber>=1000?15:policy.maxNumber>=100?10:5)).reduce((s,[,n])=>s+n,0)}/{policy.maxNumber>=1000?45:policy.maxNumber>=100?30:15}
          </span>
          <span className="nv-control hidden rounded-xl px-3 py-3 text-xs font-bold sm:inline-block">
            {gradeLevel?gradeLevel+'. Sınıf':'Keşif'} · {englishLevel}
          </span>
          <button onClick={()=>{const value=soundService.toggleMute();setMuted(value);
            if(value){audioRequest.current++;setHeardAudio(false);setSpeaking(false);soundService.cancelSpeech();}}}
            aria-label={muted?'Sesi aç':'Sesi kapat'} aria-pressed={muted}
            className="nv-control nv5-sound min-h-12 rounded-xl px-3">{muted?'🔇':'🔊'}</button>
        </div>
      </header>
      <div className="nv-stage-intro nv5-intro py-6 text-center sm:py-9">
        <p className="nv5-eyebrow">SAYI VADİSİ · {bandLabel.toUpperCase()} · BÖLÜM {stage}/5</p>
        <h1 ref={heading} tabIndex={-1} className="nv5-title mt-3 text-3xl font-black tracking-tight outline-none sm:text-5xl">
          <span className="nv5-title-icon" aria-hidden="true">{CHAPTERS[stage-1].icon}</span>{CHAPTERS[stage-1].title}
        </h1>
        <GardenHelp label="Sayı Vadisi görev yardımı">{CHAPTERS[stage-1].caption} · {bandLabel}</GardenHelp>
      </div>
      <nav aria-label="Sayı Vadisi sayı yolları" className="nv-bands nv5-bands mb-4 grid grid-cols-3 gap-2 sm:gap-3">
        {NUMBER_BANDS.map((path,i)=>{
          const open=unlockedBands.includes(path.id) && policy.maxNumber>=path.minimum;
          return <button key={path.id} type="button" disabled={!open||saving}
            aria-pressed={band===path.id}
            aria-label={`${path.title}: ${path.range} ${open?'oynanabilir':'henüz kilitli'}`}
            onClick={()=>restart(1,path.id)}
            data-current={band===path.id}
             className={`nv-band-card nv5-band rounded-2xl px-2 py-3 text-center text-xs font-black sm:px-4 sm:py-4 sm:text-sm
              ${band===path.id?'nv-band-selected':''} disabled:cursor-not-allowed disabled:opacity-55`}>
            <span className="nv5-band-icon" aria-hidden="true">{['💎','✨','🏔️'][i]}</span>
            <span className="nv5-band-title">{path.title}</span>
            <span className="nv5-band-range">{path.range}</span>
            {!open&&<span className="nv5-band-lock" aria-hidden="true">🔒</span>}
          </button>;
        })}
      </nav>
      <nav aria-label="Sayı Vadisi görevleri" className="nv5-chapters mb-5 grid grid-cols-5 gap-1.5 sm:gap-3">
        {CHAPTERS.map((part,i)=>{
          const unlocked=i<progress.completedByBand[band]+1;
          return <button key={i} disabled={!unlocked||saving} onClick={()=>restart((i+1) as NumberStage)}
            aria-current={stage===i+1?'step':undefined}
            aria-label={`${i+1}. ${part.title}${unlocked?'':' (kilitli)'}`}
            data-current={stage===i+1}
             className={`nv-chapter nv5-chapter rounded-xl px-1.5 py-3 text-center text-[10px] font-bold sm:px-3 sm:text-sm
              ${stage===i+1?'nv-chapter-current':''} disabled:opacity-35`}>
            <span className="nv5-chapter-icon" aria-hidden="true">{unlocked?part.icon:'🔒'}</span>
            <span className="nv5-chapter-index">{i+1}/5</span>
            <span className="nv5-chapter-name">{part.title}</span>
          </button>;
        })}
      </nav>
      {loadError&&<div role="alert" className="nv-panel mx-auto max-w-xl rounded-2xl p-6 text-center">
        <p>Görev yüklenemedi. Mevcut ilerleme korunuyor.</p>
        <button className="nv-primary mt-3 rounded-xl px-5 py-3" onClick={()=>restart(stage)}>Yeniden Dene</button>
      </div>}
      {!loadError&&!activePlan&&!completed&&<div role="status" className="nv-panel rounded-2xl p-10 text-center">Kristaller hazırlanıyor…</div>}
      {!loadError&&activePlan&&!completed&&(
        <div className="nv-panel nv5-panel overflow-hidden rounded-[28px] p-3 shadow-2xl sm:p-6">
          <div className="nv5-progress-row">
            <span>✨ {stage===1?'Keşfedilen kristaller':'Görev ilerlemesi'}</span>
            <span className="nv5-progress-counter">{done}/{total}</span>
          </div>
          <div className="nv5-progress-line mb-5 h-2 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
            <div className="nv-progress h-full rounded-full" style={{width:`${total?100*done/total:0}%`}}/>
          </div>
          <section aria-label="Sayı Vadisi oyun sahnesi"
            className={`nv-landscape nv5-landscape nv-world-${stage} relative min-h-[270px] overflow-hidden rounded-[22px] px-3 py-7 sm:min-h-[355px] sm:p-8`}>
            <NumberValleyScenery stage={stage}/>
            <LearningMotion variant="success"
             trigger={awaitingNext?'valley-'+band+'-'+stage+'-'+question:null}/>
            <div className="nv5-scene-top">
              <span className="nv5-scene-kicker">{['KRİSTALLER','IŞIK KÖPRÜSÜ','YILDIZ ATÖLYESİ','YANKI KANYONU','PORTAL'][stage-1]}</span>
              <span className="nv5-scene-level">{bandLabel}</span>
            </div>
            {stage===1&&<div className="relative z-10">
              <h2 className="nv5-scene-title mb-3 text-center text-xl font-black text-white drop-shadow-lg sm:text-2xl">Dokun, dinle, keşfet!</h2>
              <div className="nv5-crystals mx-auto grid max-w-3xl grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-5">
                {activePlan.discoveries.map((value,i)=><button key={value} type="button"
                  onClick={()=>discover(value)} aria-pressed={visited.includes(value)}
                  aria-label={`${value} · ${englishNumber(value)} · ${visited.includes(value)?'Keşfedildi':'Keşfet'}`}
                  data-found={visited.includes(value)}
                   className={`nv-crystal-tile nv5-crystal-tile group rounded-2xl p-2 text-center ${visited.includes(value)?'nv-discovered':''}`}
                  style={{animationDelay:`${i*80}ms`}}>
                    <Gem number={value} discovered={visited.includes(value)}/>
                    <span className="nv5-crystal-word">{visited.includes(value)?englishNumber(value).toUpperCase():'✦'}</span>
                    <span className="nv5-crystal-status" aria-hidden="true">{visited.includes(value)?'✓':'♪'}</span>
                  </button>)}
              </div>
            </div>}
            {stage!==1&&current&&<div className="nv5-question relative z-10 mx-auto max-w-3xl text-center">
              <p className="sr-only">Soru {question+1}/{total}</p>
              <h2 className="nv5-scene-title">
                {stage===2?'İngilizcesini bul!':stage===3?'Yıldız kelimesini oluştur!':
                  stage===4?'Dinle ve seç!':'Portalın şifresini çöz!'}
              </h2>
              <p className="nv5-scene-instruction">
                {stage===2?`${current.target} sayısının İngilizcesini seç.`:
                  stage===3?`${current.target} sayısının kelime parçalarını sırala.`:
                  stage===4?'Sesi dinle ve duyduğun rakama dokun.':
                  portalPhase==='collect'?`${current.target} için doğru İngilizce kelimeyi bul.`:
                  portalPhase==='decode'?'I see … stars. Cümleyi oluştur.':
                  'Doğru İngilizce cümleyi seç.'}
              </p>
              <ValleyMilestone stage={stage} completed={question+Number(awaitingNext)}
                total={total} active={speaking&&!muted}/>
              {stage===3&&<div className="nv-word-forge nv5-word-forge mt-5 rounded-[22px] p-4 sm:p-6">
                <div className="mx-auto flex max-w-lg flex-col items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-[.16em] text-lime-100">Yıldızların gizli İngilizce sözcüğü</span>
                  <span className="nv-forge-number rounded-2xl px-8 py-2 text-5xl font-black tabular-nums text-white">{current.target}</span>
                  <button type="button" onClick={()=>speak(current.target)}
                    disabled={muted||!speechAvailable||buttonsDisabled}
                    className="nv-control nv5-listen min-h-12 rounded-full px-6 py-2 text-sm font-black disabled:opacity-45">
                    {muted||!speechAvailable?'🔇 Yazılı ipucu kullan':'🔊 İngilizceyi Dinle'}
                  </button>
                  {(muted||!speechAvailable||hintUsed)&&<p className="text-sm font-black text-lime-100">
                    Yazılı destek: {englishNumber(current.target).toUpperCase()}
                  </p>}
                  {!muted&&speechAvailable&&<button type="button" onClick={()=>{
                    setHintUsed(true);setFeedback({good:true,text:'Yazılı destek açıldı; bu soru destekli çözüm olarak işaretlendi.'});
                  }} className="min-h-10 text-xs font-bold text-sky-100 underline underline-offset-4">Yazılı ipucu göster</button>}
                </div>
                <div aria-label="Oluşturulan İngilizce sayı kelimesi" aria-live="polite"
                  className="nv-forge-output nv5-forge-output mt-5 flex min-h-16 flex-wrap items-center justify-center gap-2 rounded-2xl p-3">
                  {numberWordParts(current.target).map((part,i)=>{
                    const chosenIndex=selectedWordTiles[i];
                    return <span key={i} className={`nv-forge-slot ${chosenIndex!==undefined?'nv-forge-filled':''}`}>
                      {chosenIndex!==undefined?part.toUpperCase():'✧'}
                    </span>;
                  })}
                </div>
                <p className="mt-3 text-center text-xs font-extrabold text-sky-100">Parçaları doğru sırayla seç. Yıldız kelimesini tamamla!</p>
                <div role="group" aria-label="Hareketli yıldız kelime parçaları"
                  className="nv-forge-choices nv5-forge-tiles mt-4 flex flex-wrap justify-center gap-3">
                  {wordTiles.map((tile,i)=><button key={tile.id} type="button"
                    disabled={buttonsDisabled||selectedWordTiles.includes(i)}
                    aria-label={`${tile.part} İngilizce kelime parçasını seç`}
                    onClick={()=>chooseWordTile(i)}
                    className="nv-forge-tile nv5-forge-tile min-h-16 min-w-16 rounded-2xl px-4 py-3 text-xl font-black uppercase disabled:opacity-30"
                    style={{animationDelay:`${i*95}ms`}}>
                    <span aria-hidden="true" className="block text-2xl text-amber-200">✦</span>
                    {tile.part}
                  </button>)}
                </div>
              </div>}
              {stage===5&&portalPhase==='collect'&&<div className="nv-portal-language nv5-portal mx-auto mt-5 max-w-xl rounded-2xl p-4">
                <p className="mb-3 font-extrabold text-amber-100">🔮 {current.target} · İngilizce anahtar kelime hangisi?</p>
                <button type="button" onClick={()=>speak(current.target,true)} disabled={muted||!speechAvailable||buttonsDisabled}
                  className="nv-control nv5-listen mb-4 min-h-11 rounded-xl px-4 text-sm font-bold disabled:opacity-45">🔊 İngilizce Cümleyi Dinle</button>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {current.choices.map(value=><button key={value} type="button" onClick={()=>choose(value)}
                    disabled={buttonsDisabled} className="nv-choice min-h-20 rounded-2xl p-3 text-base font-black uppercase disabled:opacity-50">
                    {englishNumber(value)}
                  </button>)}
                </div>
              </div>}
              {stage===5&&portalPhase==='decode'&&<div className="nv-portal-language nv5-portal mx-auto mt-5 max-w-xl rounded-2xl p-4">
                <p className="mb-3 text-base font-extrabold text-lime-100">✨ “I see … stars.” cümlesini tamamla</p>
                <div aria-live="polite" aria-label="Oluşturulan İngilizce cümle" className="nv-forge-output flex min-h-16 flex-wrap justify-center gap-2 rounded-xl p-3">
                  {portalWords.map((_,i)=><span key={i} className="nv-forge-slot">
                    {selectedPortalTokens.includes(i)?portalWords[i]:'✧'}
                  </span>)}
                </div>
                <div role="group" aria-label="Cümle kelimeleri" className="mt-4 grid grid-cols-2 gap-3">
                  {portalOrder.map((order,i)=><button type="button" key={order}
                    disabled={buttonsDisabled||selectedPortalTokens.includes(order)}
                    className="nv-forge-tile min-h-16 rounded-xl p-3 text-lg font-black disabled:opacity-25"
                    onClick={()=>choosePortalToken(i)}>{portalWords[order]}</button>)}
                </div>
              </div>}
              {stage===5&&portalPhase==='seal'&&<div className="nv-portal-language nv5-portal mx-auto mt-5 max-w-xl rounded-2xl p-4">
                <p className="mb-4 text-base font-extrabold text-lime-100">🌀 Son adım: Doğru İngilizce cümleyi seç</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[current.target,current.choices.find(n=>n!==current.target)??current.target+1].map((value,i)=>
                    <button type="button" key={i} disabled={buttonsDisabled}
                      onClick={()=>choosePortalSentence(value)}
                      className="nv-choice min-h-24 rounded-2xl p-4 text-base font-black disabled:opacity-50">
                      {portalSentence(value)}
                    </button>)}
                </div>
              </div>}
                            {stage===4&&<div className="mt-4 flex flex-col items-center gap-2">
                <button onClick={()=>speak(current.target)} disabled={muted||!speechAvailable||buttonsDisabled}
                  className="nv-control nv5-listen min-h-12 rounded-full px-6 text-sm font-bold disabled:opacity-45">
                  {muted?'🔇 Ses Kapalı':speechAvailable?'🔊 Sayıyı Dinle':'🔇 Ses Kullanılamıyor'}
                </button>
                <button onClick={()=>{setHintUsed(true);setFeedback({good:true,text:`Yazılı destek: ${englishNumber(current.target).toUpperCase()}`});}}
                  disabled={buttonsDisabled} className="min-h-11 rounded-xl px-4 text-xs font-bold underline underline-offset-4">
                  {muted||!speechAvailable?'Yazılı yönergeyi göster':'Yazılı yardım al'}
                </button>
                {(hintUsed||muted||!speechAvailable)&&<p role="status" className="text-sm font-black text-lime-100">
                  {englishNumber(current.target).toUpperCase()} · Bu tur yazılı desteklidir.
                </p>}
              </div>}
              {(stage===2||stage===4)&&
                <div className="nv5-answer-grid mx-auto mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
                  {current.choices.map((value,i)=><button key={value} onClick={()=>choose(value)} disabled={buttonsDisabled}
                    aria-label={stage===2?`${englishNumber(value)} kelimesini seç`:`${value} sayısını seç`}
                    data-result={awaitingNext&&value===current.target?'correct':lastChoice===value&&value!==current.target?'wrong':undefined}
                     className="nv-choice nv5-answer group min-h-24 rounded-2xl px-3 py-5 text-center disabled:opacity-60 sm:min-h-32">
                    <span className="nv5-answer-icon" aria-hidden="true">{stage===4?'◈':'✦'}</span>
                    <span className="nv5-answer-main">{stage===4?value:englishNumber(value).toUpperCase()}</span>
                    <span className="nv5-answer-sub">{stage===4?'Sayı kristali':'Işık taşı'} {i+1}</span>
                  </button>)}
                </div>}
            </div>}
          </section>
          {feedback&&<p role="status" aria-live="polite"
            className={`nv5-feedback mt-4 rounded-xl border px-4 py-3 text-center text-sm font-bold ${feedback.good?
            'border-lime-300/30 bg-emerald-800/45 text-lime-100':'border-amber-300/35 bg-amber-950/60 text-amber-100'}`}>
            {feedback.good?'✨ ':'🔁 '}{feedback.text}
          </p>}
           {stage===1?<p role="status" aria-live="polite" className="nv5-discovery-auto">
             {saving?'Keşif kaydediliyor…':completeEnabled?'Tüm kristaller keşfedildi! Görev otomatik tamamlanıyor…':
               'Kristallere dokun, İngilizce isimlerini keşfet. Son kristalden sonra görev tamamlanır.'}
           </p>:awaitingNext&&<p role="status" aria-live="polite" className="nv-auto-next mt-5 rounded-xl px-4 py-3 text-center text-sm font-black">
             ✨ {question+1===total?'Bölüm sonucu kaydediliyor…':'Yeni sayı geliyor…'}
           </p>}
           {stage!==1&&!current&&<p role="alert" className="mt-5 text-center text-amber-100">Soru oluşturulamadı. Önce Kristal Keşfi görevini tekrar oyna.</p>}
          {saveError&&<p role="alert" className="mt-4 rounded-xl bg-rose-950/80 px-4 py-3 text-center text-sm">
            {saveError} <button onClick={()=>void finish(answers,answers.length)}
              className="ml-2 font-black underline" disabled={saving}>Tekrar kaydet</button>
          </p>}
        </div>
      )}
       {completed&&<section className="nv-panel nv5-finale mx-auto max-w-2xl rounded-[28px] p-6 text-center sm:p-10">
          <LearningMotion variant="victory" trigger={'valley-finale-'+band+'-'+stage}/>
         <div className="nv5-finale-stage">
           <NumberValleyScenery stage={stage}/>
           <span className="nv5-finale-medal" aria-hidden="true">🏆</span>
         </div>
         <h2>{CHAPTERS[stage-1].title} tamamlandı!</h2>
         <p className="mt-2 text-sky-100">İlerleme çocuk profiline kaydedildi.</p>
         <p className="nv5-finale-stars mt-3 text-3xl font-black" aria-label="Bu görevde kazanılan yıldızlar">
           {'⭐'.repeat(mistakes===0?3:mistakes<=2?2:1)}
         </p>
         <div className="nv5-finale-stats"><span>✓ {answers.length} doğru</span><span>↻ {mistakes} hata</span></div>
         <button className="nv-primary nv5-next mt-6 min-h-14 w-full rounded-xl px-6 py-4 font-black" onClick={()=>{
           if(stage===5)onBack();else restart((stage+1) as NumberStage);
         }}>{stage===5?'Kelime Bahçesi’ne Dön →':'Sonraki Bölüme Geç →'}</button>
         <button className="nv-control nv5-replay mt-3 min-h-12 w-full rounded-xl px-4 font-bold" onClick={()=>restart(stage)}>
           ↻ Farklı Sayılarla Tekrar Oyna
         </button>
       </section>}
       <footer className="nv5-footer mt-6 text-center text-xs text-sky-100/75">
        Sayı Vadisi · Sınıf düzeyine uygun görevler · Yanlışlar daha sonra tekrar sorulur · İlerleme kaybolmadan kaydedilir
      </footer>
    </main>
  </div>;
}
