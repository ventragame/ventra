'use client';

import React, {useEffect,useMemo,useRef,useState} from 'react';
import {useQuestionFocus} from './useQuestionFocus';
import type {NumberAnswerEvidence} from '@ventra/shared';
import {EventBus} from '@/lib/game/EventBus';
import {soundService} from '@/lib/audio/SoundService';
import {getProgressRepository} from '@/lib/progress';
import {englishNumber,planNumberMission,NUMBER_BANDS,unlockedNumberBands,type NumberBand,type NumberMissionPlan,type NumberStage} from '@/lib/learning/numberValleyEngine';
import {numberWordParts,numberWordTiles,numberWordDecoy,teenTyPartner,portalSentence,portalWords,portalTiles} from '@/lib/learning/numberWordQuest';
import type {NumberValleyProgress} from '@/lib/progress/numberValleyProgress';
import {resolveGradeAwarePolicy} from '@/lib/learning/gradeAwareLearningPolicy';
import {NumberValleyScenery,ValleyMilestone} from './NumberValleyScenery';
import './garden-game-foundation.css';
import './number-valley.css';
import './number-valley-v5.css';
import './number-valley-premium.css';
import {useAutoQuestionAdvance} from '@/lib/learning/useAutoQuestionAdvance';
import {GardenHelp} from '../GardenHelp';
import {LearningMotion} from '@/components/learning/motion/LearningMotion';
import {GameTopBar,GameStepRail,GameResult} from '../game/GameFrame';

const CHAPTERS=[
  {icon:'💎',title:'Kristal Keşfi',caption:'Kayıp sayı kristallerini keşfet',
    how:'Kristallere dokun ve her sayının İngilizcesini dinle. Son kristalden sonra bölüm kendiliğinden tamamlanır.'},
  {icon:'🌉',title:'Işık Köprüsü',caption:'Doğru kelimeyle köprü kur',
    how:'Büyük kristaldeki sayıya bak ve İngilizce adını seç. Her doğru taş köprüyü uzatır.'},
  {icon:'⭐',title:'Yıldız Kelime Avı',caption:'Yıldız harfleriyle İngilizce sayı kelimesini oluştur',
    how:'Sayının İngilizcesini parça parça kur. Bazı kelimelerde bir parça fazladır: -teen mi, -ty mi?'},
  {icon:'🔊',title:'Yankı Kanyonu',caption:'Duyduğun sayıyı bul',
    how:'Sesi dinle ve duyduğun sayıya dokun. Ses yoksa yazılı yardımı kullanabilirsin.'},
  {icon:'🌀',title:'Portalın Şifresi',caption:'İngilizce sözcükleri kullanarak cümle kur',
    how:'Sayıya bak ve “I see … stars.” cümlesini kur. Doğru sayı kelimesini seç; bir kelime fazla!'}
] as const;
interface Props {
  profileId:string;
  gradeLevel?:number|null;
  englishLevel:'Pre-A1'|'A1'|'A2';
  progress:NumberValleyProgress;
  onBack:()=>void;
  onSave:(mission:number,mistakes:number,correct:number,duration:number,answers:NumberAnswerEvidence[],sessionId:string,band:NumberBand)=>Promise<void>;
}
type Feedback={text:string;good:boolean;detail?:string;lang?:'en'};
function newSession(profileId:string,stage:number):string{
  return `nv_${profileId}_${stage}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
function Gem({number,discovered=false}:{number:number;discovered?:boolean}){
  return <span className={`nv-gem ${discovered?'nv-gem-found':''}`} aria-hidden="true">
    <span className="nv-gem-facet"/><span className="nv-gem-number">{number}</span>
  </span>;
}
const upperTr=(text:string)=>text.toLocaleUpperCase('tr-TR');
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
  const questionHeading=useQuestionFocus<HTMLHeadingElement>(`${stage}:${question}`);
  const [selectedWordTiles,setSelectedWordTiles]=useState<number[]>([]);
  /** Portal: sentence slots already filled, in English word order. */
  const [selectedPortalTokens,setSelectedPortalTokens]=useState<number[]>([]);
  /** The tile that was just tapped wrongly (shakes; cleared on the next tap). */
  const [wrongTile,setWrongTile]=useState<number|null>(null);
  const [mistakes,setMistakes]=useState(0);
  const [perQuestionMistakes,setPerQuestionMistakes]=useState(0);
  const [hintUsed,setHintUsed]=useState(false);
  /** The portal's listen button reads the finished sentence ("I see seven
   * stars."), so using it makes the answer assisted. */
  const [answerAudioUsed,setAnswerAudioUsed]=useState(false);
  const lastMistakeAt=useRef(0);
  const [feedback,setFeedback]=useState<Feedback|null>(null);
  const [lastChoice,setLastChoice]=useState<number|null>(null);
  const [awaitingNext,setAwaitingNext]=useState(false);
  const [saving,setSaving]=useState(false);
  const [saveError,setSaveError]=useState('');
  const [completed,setCompleted]=useState(false);
  // Same rule for the end-of-mission panel: the last answer is gone with it.
  const doneHeading=useQuestionFocus<HTMLHeadingElement>(completed?'done':'play');
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
  /** Each number path resumes at its own next unfinished chapter. */
  const resumeStage=(path:NumberBand)=>Math.min(5,progress.completedByBand[path]+1) as NumberStage;
  const bandOpen=(path:NumberBand,unlocked:readonly NumberBand[])=>unlocked.includes(path)&&
    policy.maxNumber>=(NUMBER_BANDS.find(x=>x.id===path)?.minimum??Infinity);
  /** Entry goes to the furthest unlocked path that still has open chapters (once). */
  const entryBandChosen=useRef(false);
  const key=`${profileId}:${gradeLevel??'unset'}:${englishLevel}:${band}:${stage}:${nonce}`;
  const activePlan=planKey===key&&plan?.mission===stage?plan:null;
  const current=stage===1?null:activePlan?.questions[question]??null;
  const wordTiles=useMemo(()=>current&&stage===3?numberWordTiles(current.target,(activePlan?.seed??0)+question):[],
    [current?.target,stage,activePlan?.seed,question]);
  const wordDecoy=current&&stage===3?numberWordDecoy(current.target):null;
  // Tile order varies per question/replay; a constant order let children
  // memorise tap positions instead of English word order.
  const portalSeed=((activePlan?.seed??0)>>>0)+question*7;
  const portalDecoy=current?current.choices.find(n=>n!==current.target)??current.target:0;
  const portal=useMemo(()=>current&&stage===5?portalTiles(current.target,portalDecoy,portalSeed):[],
    [current?.target,stage,portalDecoy,portalSeed]);

  useEffect(()=>{
    let alive=true;
    setLoadError(false);setPlan(null);setPlanKey('');
    getProgressRepository().getNumberAnswerHistory(profileId).then(history=>{
      if(!alive)return;
      const unlocked=unlockedNumberBands(policy.maxNumber,history);
      setUnlockedBands(unlocked);
      if(!entryBandChosen.current){
        entryBandChosen.current=true;
        const entry=[...NUMBER_BANDS].reverse().find(path=>bandOpen(path.id,unlocked)&&progress.completedByBand[path.id]<5);
        if(entry&&entry.id!==band){restart(resumeStage(entry.id),entry.id);return;}
      }
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
    setVisited([]);setAnswers([]);setQuestion(0);setLastChoice(null);setSelectedWordTiles([]);setSelectedPortalTokens([]);setWrongTile(null);
    setMistakes(0);setPerQuestionMistakes(0);setHintUsed(false);setAnswerAudioUsed(false);setFeedback(null);
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
    const fresh=!visited.includes(value);
    setFeedback({good:true,text:englishNumber(value).toUpperCase()+'!',lang:'en',detail:fresh?`${value} · Yeni kristal!`:String(value)});
    if(!fresh)return;
    setVisited(old=>[...old,value]);
    setAnswers(old=>[...old,{value,kind:'discovery',mistakes:0,firstTryCorrect:false,timestamp:new Date().toISOString()}]);
  }
  function mistake(detail:string){
    if(saving||awaitingNext)return;
    // A double tap is one mistake: the second one would also reveal the written answer.
    const now=Date.now();
    if(now-lastMistakeAt.current<280)return;
    lastMistakeAt.current=now;
    setMistakes(v=>v+1);setPerQuestionMistakes(v=>v+1);
    setFeedback({text:'Bir daha dene! 💎',good:false,detail});soundService.playSfx('gentle_retry');
    if(perQuestionMistakes>=1)setHintUsed(true);
  }
  function correctAnswer(){
    if(!activePlan||!current||awaitingNext||saving||completed)return;
    soundService.playSfx('correct');
    const row:NumberAnswerEvidence={
      value:current.target,kind:current.skill,mistakes:perQuestionMistakes,
      firstTryCorrect:perQuestionMistakes===0&&!hintUsed&&!answerAudioUsed && !(stage===4&&(!heardAudio||muted||!speechAvailable)) && !(stage===3&&(muted||!speechAvailable)),
      hintUsed:hintUsed || answerAudioUsed || (stage===4&&(!heardAudio||muted||!speechAvailable)) || (stage===3&&(muted||!speechAvailable)),
      timestamp:new Date().toISOString()
    };
    setAnswers(old=>[...old,row]);
    setWrongTile(null);
    setFeedback(stage===5
      ?{good:true,text:'✨ '+portalSentence(current.target),lang:'en',detail:`${current.target} yıldız görüyorum.`}
      :{good:true,text:'✨ '+englishNumber(current.target).toUpperCase()+'!',lang:'en',detail:`${current.target} · Harika!`});
    // Every success is heard once in English: the word, or the whole portal
    // sentence. Listening rounds already played the word as their question.
    if(stage!==4)speak(current.target,stage===5);
    setAwaitingNext(true);
  }
  /** Spelling stars: the child builds an English word, not a numeric quantity. */
  function chooseWordTile(index:number){
    if(stage!==3||!current||buttonsDisabled)return;
    if(selectedWordTiles.includes(index))return;
    const parts=numberWordParts(current.target);
    const needed=parts[selectedWordTiles.length];
    const chosen=wordTiles[index];
    if(chosen?.part!==needed){
      setWrongTile(chosen?.id??null);
      const partner=teenTyPartner(current.target);
      if(chosen?.decoy&&partner!==null&&(chosen.part==='ty'||chosen.part==='teen'))
        mistake(`${englishNumber(partner).toUpperCase()} = ${partner}. ${current.target} için -${needed==='teen'||parts.includes('teen')?'teen':'ty'} gerekir.`);
      else if(chosen?.decoy)mistake(`Bu parça ${current.target} sayısında yok. Dinle ve yeniden dene.`);
      else mistake('Bu parça henüz sırada değil. Dinle ve yeniden dene.');
      return;
    }
    setWrongTile(null);
    setSelectedWordTiles(old=>[...old,index]);
    soundService.playSfx('tap',0.45);
    if(selectedWordTiles.length+1===parts.length)correctAnswer();
  }
  /** Portal: pick the right number word and put "I see … stars." in English order. */
  function choosePortalToken(index:number){
    if(stage!==5||!current||buttonsDisabled)return;
    const tile=portal[index];
    if(!tile||(tile.slot!==null&&selectedPortalTokens.includes(tile.slot)))return;
    if(tile.slot===null){
      setWrongTile(tile.id);
      mistake(`${tile.word.toUpperCase()} = ${portalDecoy}. Portal ${current.target} sayısını istiyor.`);return;
    }
    if(tile.slot!==selectedPortalTokens.length){
      setWrongTile(tile.id);
      mistake(`Kelime sırası: ${portalWords(current.target).map((_,i)=>i===2?'…':_).join(' ')}.`);return;
    }
    setWrongTile(null);
    setSelectedPortalTokens(old=>[...old,tile.slot!]);
    soundService.playSfx('tap',0.5);
    if(selectedPortalTokens.length+1===portalWords(current.target).length)correctAnswer();
  }
  function choose(value:number){
    if(!current||awaitingNext||saving||completed)return;
    if(stage===4&&!heardAudio&&!hintUsed&&!muted&&speechAvailable){
      setFeedback({text:'Önce dinle! 🔊',good:false,detail:'Sayıyı dinle ya da yazılı yardımı aç.'});return;
    }
    if(value!==current.target){
      setLastChoice(value);
      // Recognition: say what the wrong word means. Listening: never reveal the answer.
      mistake(stage===2?`${englishNumber(value).toUpperCase()} = ${value}. ${current.target} sayısını bul.`:'Yeniden dinle ve tekrar dene.');
      return;
    }
    setLastChoice(value);
    correctAnswer();
  }
  function next(){
    if(!activePlan||!awaitingNext||saving||writeLock.current)return;
    const last=question+1>=activePlan.questions.length;
    if(last){void finish(answers,answers.length);return;}
    audioRequest.current++;setHeardAudio(false);setSpeaking(false);
    soundService.cancelSpeech();
    setQuestion(v=>v+1);setLastChoice(null);setSelectedWordTiles([]);setSelectedPortalTokens([]);setWrongTile(null);setPerQuestionMistakes(0);
    setFeedback(null);setHintUsed(false);setAnswerAudioUsed(false);setAwaitingNext(false);
  }
  // Visibility-aware one-shot transition, canceled on unmount and error.
  useAutoQuestionAdvance({
    ready:awaitingNext,
    blocked:saving||completed||Boolean(saveError)||!activePlan,
    delayMs:1050,speaking:speaking&&!muted,onAdvance:next
  });
  // Listening rounds play their number as soon as the question opens, as the
  // other worlds do; the big button replays it. If a browser refuses speech
  // without a tap, the button and the written help stay available.
  useEffect(()=>{
    if(stage!==4||!current||muted||!speechAvailable||awaitingNext||completed||saving)return;
    const timer=window.setTimeout(()=>{soundService.unlockAudio();speak(current.target);},350);
    return()=>window.clearTimeout(timer);
  },[stage,question,current?.target,activePlan,muted,speechAvailable,awaitingNext,completed,saving]);
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
  const nextPath=NUMBER_BANDS.slice(NUMBER_BANDS.findIndex(x=>x.id===band)+1)
    .find(path=>bandOpen(path.id,unlockedBands)&&progress.completedByBand[path.id]<5);
  const buttonsDisabled=saving||awaitingNext||completed;
  // The last answer of a chapter says the chapter is being saved.
  const finishing=(stage===1?Boolean(completeEnabled):awaitingNext&&question+1===total)&&!saveError;
  const toast=feedback?{...feedback,detail:feedback.good&&finishing?'Bölüm kaydediliyor…':feedback.detail}:null;
  const longChoices=Boolean(current?.choices.some(n=>englishNumber(n).length>13));
  const stars=mistakes===0?3:mistakes<=2?2:1;
  // The numbers this chapter practised, for the tap-to-hear recap.
  const recap=activePlan?[...new Set(stage===1?activePlan.discoveries:activePlan.questions.map(q=>q.target))].sort((a,b)=>a-b):[];
  const writtenHelp=hintUsed||muted||!speechAvailable;

  return <div ref={dialog} role="dialog" aria-modal="true" aria-label="Sayı Vadisi macerası"
      onPointerDown={e=>e.stopPropagation()} onPointerMove={e=>e.stopPropagation()}
      onPointerUp={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()}
      className="nv-root nv5-root nv6-root gg-game-shell fixed inset-0 z-50 overflow-y-auto overscroll-contain text-white">
    <div className="nv-sky" aria-hidden="true"><span className="nv-orb nv-orb-one"/><span className="nv-orb nv-orb-two"/>
      <span className="nv-orb nv-orb-three"/><span className="nv-sky-stars">✦ · ✧ · ✦ · ✧ · ✦</span></div>
    <GameTopBar island="garden" gameExit backClassName="gg-game-control" backDisabled={saving} onBack={onBack}
      backLabel="Bölgeler" backAriaLabel="Kelime Bahçesi bölgelerine dön" crest="💎" accent="#9fd8ff"
      eyebrow={'Kelime Bahçesi · '+bandLabel} title="Sayı Vadisi" titleAs="p"
      progress={!completed&&activePlan&&total>0?(stage===1
        ?{current:done,total,label:'Keşif'}
        :{current:question+1,total,label:'Soru'}):undefined}
      stars={{earned:Object.entries(progress.starsByLevel).filter(([id])=>Number(id)<=
        (policy.maxNumber>=1000?15:policy.maxNumber>=100?10:5)).reduce((s,[,n])=>s+n,0),
        total:policy.maxNumber>=1000?45:policy.maxNumber>=100?30:15}}
      chips={[(gradeLevel?gradeLevel+'. Sınıf':'Keşif')+' · '+englishLevel]}
      tools={<>
        <GardenHelp label="Sayı Vadisi nasıl oynanır?">
          <p>{CHAPTERS[stage-1].how}</p>
          <p>Ses açılmasa da bütün bölümler yazılı olarak oynanabilir. Yanlışlar daha sonra tekrar sorulur; yıldızlar bölüm kaydedilince verilir.</p>
        </GardenHelp>
        <button type="button" onClick={()=>{const value=soundService.toggleMute();setMuted(value);
          if(value){audioRequest.current++;setHeardAudio(false);setSpeaking(false);soundService.cancelSpeech();}}}
          aria-label={muted?'Sesi aç':'Sesi kapat'} aria-pressed={muted}
          className="gf-tool gg-game-control">{muted?'🔇':'🔊'}</button>
      </>}/>
    <main className="nv5-main relative mx-auto max-w-6xl px-3 pb-12 pt-4 sm:px-7 sm:pt-6"
      style={{paddingBottom:'max(28px,env(safe-area-inset-bottom))'}}>
      <div className="nv-stage-intro nv5-intro sr-only">
        <p className="nv5-eyebrow">{upperTr(`Sayı Vadisi · ${bandLabel} · Bölüm ${stage}/5`)}</p>
        <h1 ref={heading} tabIndex={-1} className="nv5-title outline-none">
          <span className="nv5-title-icon" aria-hidden="true">{CHAPTERS[stage-1].icon}</span>{CHAPTERS[stage-1].title}
        </h1>
      </div>
      <GameStepRail island="garden" className="nv5-bands" ariaLabel="Sayı Vadisi sayı yolları" showNotes
        steps={NUMBER_BANDS.map((path,i)=>{
          const open=unlockedBands.includes(path.id) && policy.maxNumber>=path.minimum;
          return {key:path.id,label:path.title,note:path.range,icon:['💎','✨','🏔️'][i],className:'gg-game-control',
            state:band===path.id?'current':!open?'locked':progress.completedByBand[path.id]>=CHAPTERS.length?'done':'upcoming',
            disabled:saving,onSelect:()=>restart(resumeStage(path.id),path.id),
            ariaLabel:`${path.title}: ${path.range} ${open?'oynanabilir':'henüz kilitli'}`};
        })}/>
      <GameStepRail island="garden" className="nv5-chapters" ariaLabel="Sayı Vadisi görevleri"
        steps={CHAPTERS.map((part,i)=>{
          const unlocked=i<progress.completedByBand[band]+1;
          return {key:String(i),label:part.title,icon:part.icon,className:'gg-game-control',
            state:stage===i+1?'current':!unlocked?'locked':i<progress.completedByBand[band]?'done':'upcoming',
            disabled:saving,onSelect:()=>restart((i+1) as NumberStage),
            ariaLabel:`${i+1}. ${part.title}${unlocked?'':' (kilitli)'}`};
        })}/>
      {loadError&&<div role="alert" className="nv-panel mx-auto max-w-xl rounded-2xl p-6 text-center">
        <p>Görev yüklenemedi. Mevcut ilerleme korunuyor.</p>
        <button type="button" className="gf-btn gf-btn--primary mt-3" onClick={()=>restart(stage)}>Yeniden Dene</button>
      </div>}
      {!loadError&&!activePlan&&!completed&&<div role="status" className="nv-panel rounded-2xl p-10 text-center">Kristaller hazırlanıyor…</div>}
      {!loadError&&activePlan&&!completed&&(
        <div className="nv-panel nv5-panel overflow-hidden rounded-[28px] p-3 shadow-2xl sm:p-6">
          <section aria-label="Sayı Vadisi oyun sahnesi"
            className={`nv-landscape nv5-landscape gg-game-scene nv-world-${stage} nv6-stage relative min-h-[270px] overflow-hidden rounded-[22px] px-3 py-7 sm:min-h-[355px] sm:p-8`}>
            <NumberValleyScenery stage={stage}/>
            <LearningMotion variant="success"
             trigger={awaitingNext?'valley-'+band+'-'+stage+'-'+question:null}/>
            <div className="nv5-scene-top">
              <span className="nv5-scene-kicker">{['KRİSTALLER','IŞIK KÖPRÜSÜ','YILDIZ ATÖLYESİ','YANKI KANYONU','PORTAL'][stage-1]}</span>
            </div>
            {toast&&<p className="nv5-toast" data-good={toast.good} role="status" aria-live="polite">
              <span lang={toast.lang}>{toast.text}</span>{toast.detail&&<small>{toast.detail}</small>}
            </p>}
            {stage===1&&<div className="nv5-play nv5-discover relative z-10">
              <h2 className="nv5-scene-title mb-3 text-center text-xl font-black text-white drop-shadow-lg sm:text-2xl">Dokun, dinle, keşfet!</h2>
              <p className="nv5-scene-instruction">Kristallere dokun ve her sayının İngilizcesini dinle.</p>
              <div className="nv5-crystals mx-auto grid max-w-3xl grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-5">
                {activePlan.discoveries.map((value,i)=><button key={value} type="button"
                  onClick={()=>discover(value)} aria-pressed={visited.includes(value)}
                  aria-label={`${value} · ${englishNumber(value)} · ${visited.includes(value)?'Keşfedildi':'Keşfet'}`}
                  data-found={visited.includes(value)}
                   className={`nv-crystal-tile nv5-crystal-tile gg-game-control group rounded-2xl p-2 text-center ${visited.includes(value)?'nv-discovered':''}`}
                  style={{animationDelay:`${i*80}ms`}}>
                    <Gem number={value} discovered={visited.includes(value)}/>
                    {visited.includes(value)
                      ?<span className="nv5-crystal-word" lang="en">{englishNumber(value).toUpperCase()}</span>
                      :<span className="nv5-crystal-listen" aria-hidden="true">♪</span>}
                  </button>)}
              </div>
            </div>}
            {stage!==1&&current&&<div className="nv5-play nv5-question relative z-10 mx-auto max-w-3xl text-center">
              <p className="sr-only">Soru {question+1}/{total}</p>
              <h2 ref={questionHeading} tabIndex={-1} className="nv5-scene-title">
                {stage===2?'İngilizcesini bul!':stage===3?'Yıldız kelimesini oluştur!':
                  stage===4?'Dinle ve seç!':'Portalın şifresini çöz!'}
              </h2>
              <p className="nv5-scene-instruction">
                {stage===2?`${current.target} sayısının İngilizcesini seç.`:
                  stage===3?(wordDecoy?`${current.target} sayısının İngilizcesini kur. Bir parça fazla!`:`${current.target} sayısının İngilizcesini parça parça kur.`):
                  stage===4?'Sesi dinle ve duyduğun sayıya dokun.':
                  `Cümleyi kur: “${current.target} yıldız görüyorum.” Bir kelime fazla!`}
              </p>
              {(stage===2||stage===5)&&<div className="nv5-target" aria-hidden="true"><Gem number={current.target} discovered/></div>}
              <ValleyMilestone stage={stage} completed={question+Number(awaitingNext)}
                total={total} active={speaking&&!muted}/>
              {stage===3&&<div className="nv-word-forge nv5-word-forge mt-5 rounded-[22px] p-4 sm:p-6">
                <div className="nv5-forge-head">
                  <span className="nv-forge-number rounded-2xl px-8 py-2 text-5xl font-black tabular-nums text-white">{current.target}</span>
                  <div className="nv5-forge-tools">
                    <button type="button" onClick={()=>speak(current.target)}
                      disabled={muted||!speechAvailable||buttonsDisabled}
                      className="nv5-listen gf-btn gf-btn--tool gg-game-control">
                      {muted?'🔇 Ses kapalı':speechAvailable?'🔊 İngilizceyi Dinle':'🔇 Ses yok'}
                    </button>
                    {writtenHelp?<p className="nv5-written-help">Yazılı destek: <span lang="en">{englishNumber(current.target).toUpperCase()}</span></p>
                      :<button type="button" onClick={()=>{
                        setHintUsed(true);setFeedback({good:true,text:'Yazılı ipucu açıldı',detail:'Bu soru destekli sayılır.'});
                      }} className="nv5-hint-link gf-btn gf-btn--tool gg-game-control">Yazılı ipucu göster</button>}
                  </div>
                </div>
                <div aria-label="Oluşturulan İngilizce sayı kelimesi" aria-live="polite" lang="en"
                  className="nv-forge-output nv5-forge-output mt-5 flex min-h-16 flex-wrap items-center justify-center gap-2 rounded-2xl p-3">
                  {numberWordParts(current.target).map((part,i)=>{
                    const chosenIndex=selectedWordTiles[i];
                    return <span key={i} className={`nv-forge-slot ${chosenIndex!==undefined?'nv-forge-filled':''}`}>
                      {chosenIndex!==undefined?part.toUpperCase():'✧'}
                    </span>;
                  })}
                </div>
                <div role="group" aria-label="İngilizce kelime parçaları"
                  className="nv-forge-choices nv5-forge-tiles mt-4 flex flex-wrap justify-center gap-3">
                  {wordTiles.map((tile,i)=><button key={tile.id} type="button"
                    disabled={buttonsDisabled||selectedWordTiles.includes(i)}
                    aria-label={`${tile.part} İngilizce kelime parçasını seç`}
                    onClick={()=>chooseWordTile(i)} data-wrong={wrongTile===tile.id||undefined}
                    className="nv-forge-tile nv5-forge-tile gg-game-control min-h-16 min-w-16 rounded-2xl px-4 py-3 text-xl font-black uppercase"
                    style={{animationDelay:`${i*95}ms`}}>
                    <span aria-hidden="true" className="nv5-tile-star">✦</span>
                    <span lang="en">{tile.part}</span>
                  </button>)}
                </div>
              </div>}
              {stage===5&&<div className="nv-portal-language nv5-portal mx-auto mt-5 max-w-xl rounded-2xl p-4">
                <div aria-live="polite" aria-label="Oluşturulan İngilizce cümle" lang="en" className="nv-forge-output nv5-sentence">
                  {portalWords(current.target).map((word,i)=><span key={i} className={`nv-forge-slot ${selectedPortalTokens.includes(i)?'nv-forge-filled':''}`}>
                    {selectedPortalTokens.includes(i)?word:'✧'}
                  </span>)}<span className="nv5-sentence-dot" aria-hidden="true">.</span>
                </div>
                <div role="group" aria-label="Cümle kelimeleri" className="nv5-portal-tiles">
                  {portal.map((tile,i)=><button type="button" key={tile.id}
                    disabled={buttonsDisabled||(tile.slot!==null&&selectedPortalTokens.includes(tile.slot))}
                    data-wrong={wrongTile===tile.id||undefined}
                    className="nv-forge-tile nv5-forge-tile nv5-word-tile gg-game-control"
                    onClick={()=>choosePortalToken(i)}><span lang="en">{tile.word}</span></button>)}
                </div>
                <div className="nv5-portal-tools">
                  <button type="button" onClick={()=>{setAnswerAudioUsed(true);speak(current.target,true);}} disabled={muted||!speechAvailable||buttonsDisabled}
                    className="nv5-listen gf-btn gf-btn--tool gg-game-control">🔊 Cümleyi dinle</button>
                  {hintUsed&&<p className="nv5-written-help">Yazılı destek: <span lang="en">{portalSentence(current.target)}</span></p>}
                </div>
              </div>}
              {stage===4&&<div className="nv5-listen-row">
                <button type="button" onClick={()=>speak(current.target)} disabled={muted||!speechAvailable||buttonsDisabled}
                  className="nv5-listen nv5-listen-main gf-btn gf-btn--tool gg-game-control">
                  {muted?'🔇 Ses Kapalı':speechAvailable?'🔊 Sayıyı Dinle':'🔇 Ses Kullanılamıyor'}
                </button>
                {writtenHelp?<p role="status" className="nv5-written-help">
                  <span lang="en">{englishNumber(current.target).toUpperCase()}</span> · Bu tur yazılı desteklidir.
                </p>:<button onClick={()=>setHintUsed(true)}
                  disabled={buttonsDisabled} className="nv5-hint-link gf-btn gf-btn--tool gg-game-control">Yazılı yardım al</button>}
              </div>}
              {(stage===2||stage===4)&&
                <div className="nv5-answer-grid mx-auto mt-6 grid max-w-xl gap-3"
                  data-count={current.choices.length} data-long={longChoices||undefined}>
                  {current.choices.map(value=><button key={value} onClick={()=>choose(value)} disabled={buttonsDisabled}
                    aria-label={stage===2?`${englishNumber(value)} kelimesini seç`:`${value} sayısını seç`}
                    data-result={awaitingNext&&value===current.target?'correct':lastChoice===value&&value!==current.target?'wrong':undefined}
                     className="nv-choice nv5-answer gg-game-control group min-h-24 rounded-2xl px-3 py-5 text-center sm:min-h-32">
                    <span className="nv5-answer-icon" aria-hidden="true">{stage===4?'◈':'✦'}</span>
                    <span className="nv5-answer-main" lang={stage===2?'en':undefined}>{stage===4?value:englishNumber(value).toUpperCase()}</span>
                  </button>)}
                </div>}
            </div>}
          </section>
           {stage!==1&&!current&&<p role="alert" className="mt-5 text-center text-amber-100">Soru oluşturulamadı. Önce Kristal Keşfi görevini tekrar oyna.</p>}
          {saveError&&<p role="alert" className="mt-4 rounded-xl bg-rose-950/80 px-4 py-3 text-center text-sm">
            {saveError} <button onClick={()=>void finish(answers,answers.length)}
              className="ml-2 font-black underline" disabled={saving}>Tekrar kaydet</button>
          </p>}
        </div>
      )}
       {completed&&<GameResult island="garden" className="nv5-finale" titleRef={doneHeading}
         art={<><LearningMotion variant="victory" trigger={'valley-finale-'+band+'-'+stage}/>
           <div className="nv5-finale-stage">
             <NumberValleyScenery stage={stage}/>
             <span className="nv5-finale-medal" aria-hidden="true">🏆</span>
           </div></>}
         kicker={'Sayı Vadisi · '+bandLabel} title={CHAPTERS[stage-1].title+' tamamlandı!'}
         stars={{earned:stars}}
         message={<span className="nv5-finale-stats">{stage===1?`${answers.length} sayının İngilizcesini dinledin`:`${answers.length} doğru · ${mistakes} yanlış deneme`}</span>}
         actions={<>
           <button type="button" className="nv5-next gf-btn gf-btn--primary gg-game-control" onClick={()=>{
             if(stage<5)restart((stage+1) as NumberStage);
             else if(nextPath)restart(resumeStage(nextPath.id),nextPath.id);
             else onBack();
           }}>{stage<5?'Sonraki Bölüme Geç →':nextPath?`${nextPath.title} yoluna geç →`:'Kelime Bahçesi’ne Dön →'}</button>
           <button type="button" className="nv5-replay gf-btn gf-btn--secondary gg-game-control" onClick={()=>restart(stage)}>
             ↻ Farklı Sayılarla Tekrar Oyna
           </button>
         </>}>
         {recap.length>0&&<div className="nv5-recap" role="group" aria-label="Bu bölümün İngilizce sayıları">
           <p className="nv5-recap-title">Bu bölümün sayıları · {stage===5?'dokun, cümleyi dinle':'dokun ve dinle'}</p>
           <div className="nv5-recap-list">{recap.map(value=><button key={value} type="button" className="nv5-recap-word gg-game-control"
             onClick={()=>speak(value,stage===5)} disabled={muted||!speechAvailable}
             aria-label={`${value}, İngilizce ${stage===5?portalSentence(value):englishNumber(value)}, dinle`}>
             <span className="nv5-recap-number" aria-hidden="true">{value}</span>
             <span lang="en">{englishNumber(value)}</span></button>)}</div>
         </div>}
       </GameResult>}
    </main>
  </div>;
}
