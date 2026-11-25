'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {useQuestionFocus} from './useQuestionFocus';
import type {FoodAnswerEvidence} from '@ventra/shared';
import {getProgressRepository} from '@/lib/progress';
import {type EnglishPlacement} from '@/lib/learning/gradeAwareLearningPolicy';
import {MARKET_AISLES,MARKET_STAGES,MARKET_OFFSETS,
 marketWord,marketNounPhrase,marketMissionStars,marketResumePoint,planMarketMission,type MarketAisle,type MarketStage,type MarketPlan} from '@/lib/learning/foodMarketEngine';
import type {FoodMarketProgress} from '@/lib/progress/foodMarketProgress';
import {soundService} from '@/lib/audio/SoundService';
import {useAutoQuestionAdvance} from '@/lib/learning/useAutoQuestionAdvance';
import './food-market.css';
import './food-market-v4.css';
import './food-market-logic-v5.css';
import './food-market-visual-v6.css';
import {GardenQuestNavigator} from './GardenQuestNavigator';
import './garden-quest-navigation.css';
import './food-market-premium.css';
import './garden-child-legibility.css';
import {GardenHelp} from '../GardenHelp';
import {LearningMotion} from '@/components/learning/motion/LearningMotion';
import {GameFinale} from '../GameFinale';

type Props={
 profileId:string;gradeLevel?:number|null;englishLevel:EnglishPlacement;
 progress:FoodMarketProgress;onBack:()=>void;
 onSave:(aisle:MarketAisle,stage:MarketStage,mistakes:number,duration:number,
  answers:FoodAnswerEvidence[],sessionId:string)=>Promise<void>;
};
type Feedback={text:string;good:boolean;detail?:string;lang?:'en'};
const newSession=(profileId:string,aisle:MarketAisle,stage:MarketStage)=>
  `food:${profileId}:${aisle}:${stage}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

const MARKET_ART:Record<MarketAisle,string>={
 orchard:'/assets/foods/market-orchard-v6.webp',
 bakery:'/assets/foods/market-bakery-v4.svg',
 cafe:'/assets/foods/market-cafe-v4.svg'
};
function MarketBackdrop({aisle}:{aisle:MarketAisle}){
 return <div className="fm-backdrop fm4-backdrop" aria-hidden="true">
   <img alt="" src={MARKET_ART[aisle]} decoding="async" draggable={false}/>
   <span className="fm4-atmosphere fm4-atmosphere-one"/>
   <span className="fm4-atmosphere fm4-atmosphere-two"/>
 </div>;
}
function FoodIllustration({id,className=''}:{id:string;className?:string}){
 return <svg className={`fm4-food-svg ${className}`} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
   <use href={`/assets/foods/food-sprite-v4.svg#food-${id}`}/>
 </svg>;
}
function BasketIllustration(){
 return <svg className="fm4-basket-illustration" viewBox="0 0 130 115" aria-hidden="true" focusable="false">
   <defs><linearGradient id="fm4-wicker" x2="0" y2="1"><stop stopColor="#ffe5a9"/><stop offset="1" stopColor="#b7734d"/></linearGradient></defs>
   <path d="M22 43L43 97Q64 110 88 98L112 43Z" fill="url(#fm4-wicker)" stroke="#fff0bb" strokeWidth="5"/>
   <path d="M39 46Q65 -10 95 46" fill="none" stroke="#ce8d60" strokeWidth="12" strokeLinecap="round"/>
   <path d="M36 63H100M42 80H92M45 43L51 99M65 43V106M85 43L80 99" stroke="#925b49" strokeWidth="4" opacity=".7"/>
   <rect x="16" y="37" width="103" height="17" rx="8" fill="#deaa69" stroke="#fff0c3" strokeWidth="4"/>
 </svg>;
}
function Item({id,showEnglish=false,selected=false,active=false,disabled=false,onClick,draggable=false,wrong=false,onDragStart}:
 {id:string;showEnglish?:boolean;selected?:boolean;active?:boolean;disabled?:boolean;onClick?:()=>void;draggable?:boolean;wrong?:boolean;onDragStart?:(event:React.DragEvent<HTMLButtonElement>)=>void}){
 const w=marketWord(id);
 return <button type="button" onClick={onClick} disabled={disabled} draggable={draggable&&!disabled} onDragStart={onDragStart}
   aria-pressed={selected} data-wrong={wrong} data-aisle={w.aisle}
   aria-label={showEnglish?`${w.id}, ${w.tr}`:`Ürün resmi: ${w.tr}`}
   className={`fm-product fm4-product ${selected?'fm-product-selected':''} ${active?'fm-product-good':''} ${wrong?'fm4-product-wrong':''}`}
   title={showEnglish?w.id:undefined}>
   <span className={`fm-product-illustration fm-product-illustration-${w.aisle}`} aria-hidden="true">
      <span className="fm4-product-halo"/>
      <FoodIllustration id={id}/>
    </span>
    {showEnglish&&<span className="fm-product-name" lang="en">{w.id}</span>}
   {selected&&<span className="fm-check" aria-hidden="true">✓</span>}
 </button>;
}
const upper=(id:string)=>id.toUpperCase();
/** "Here you go! A banana.": a new sentence after the exclamation mark. */
const handOver=(id:string)=>{const phrase=marketNounPhrase(id);return `Here you go! ${phrase[0].toUpperCase()}${phrase.slice(1)}.`;};
export function FoodMarketAdventure({profileId,gradeLevel=null,englishLevel,progress,onBack,onSave}:Props){
 const [aisle,setAisle]=useState<MarketAisle>(()=>marketResumePoint(progress.completedByAisle).aisle);
 const [stage,setStage]=useState<MarketStage>(()=>marketResumePoint(progress.completedByAisle).stage);
 const [revision,setRevision]=useState(0);
 const [plan,setPlan]=useState<MarketPlan|null>(null);
 const [planKey,setPlanKey]=useState('');
 const [loadError,setLoadError]=useState(false);
 const [visited,setVisited]=useState<string[]>([]);
 const [answers,setAnswers]=useState<FoodAnswerEvidence[]>([]);
 const [wrong,setWrong]=useState(0);
 const [roundWrong,setRoundWrong]=useState(0);
 const [q,setQ]=useState(0);
 const questionPrompt=useQuestionFocus<HTMLDivElement>(`${stage}:${q}`);
 const [hint,setHint]=useState(false);
 const [heard,setHeard]=useState(false);
 const [speaking,setSpeaking]=useState(false);
 const [selected,setSelected]=useState<string|null>(null);
 const [wrongIds,setWrongIds]=useState<string[]>([]);
 const [success,setSuccess]=useState(false);
 const [finished,setFinished]=useState(false);
 // Same rule for the end-of-mission panel: the last answer is gone with it.
 const doneHeading=useQuestionFocus<HTMLHeadingElement>(finished?'done':'play');
 const [busy,setBusy]=useState(false);
 const [saveError,setSaveError]=useState('');
 const [feedback,setFeedback]=useState<Feedback|null>(null);
 const [muted,setMuted]=useState(()=>soundService.getMuted());
 const started=useRef(Date.now());
 const session=useRef(newSession(profileId,aisle,stage));
 const locked=useRef(false);
 const answerLock=useRef(false);
 const visitedRef=useRef<Set<string>>(new Set());
 const wrongRef=useRef<Set<string>>(new Set());
 const dialog=useRef<HTMLDivElement>(null);
 const speechRun=useRef(0);
 const key=`${profileId}/${aisle}/${stage}/${gradeLevel}/${englishLevel}/${revision}`;
 const current=planKey===key&&plan?.stage===stage&&plan?.aisle===aisle?plan:null;
 const task=current?.questions[q];
 const usedStage=progress.completedByAisle[aisle];
 const numberOfQuestions=stage===1?current?.words.length??0:current?.questions.length??0;
 const completed=stage===1?visited.length:q+Number(success);
 const stageMeta=MARKET_STAGES[stage-1];
 const currentAisle=MARKET_AISLES.find(x=>x.id===aisle)!;
 const cancelVoice=useCallback(()=>{
   speechRun.current++;
   setSpeaking(false);
   soundService.cancelSpeech();
 },[]);
 useEffect(()=>{
  let alive=true;
  setLoadError(false);setPlan(null);setPlanKey('');
  getProgressRepository().getFoodAnswerHistory(profileId).then(history=>{
   if(!alive)return;
   const next=planMarketMission({aisle,stage,history,englishLevel,gradeLevel,seed:Math.floor(Math.random()*4294967295)});
   setPlan(next);setPlanKey(key);
  }).catch(err=>{console.error('Pazar görevi planlanamadı',err);if(alive)setLoadError(true)});
  return()=>{alive=false};
 },[key,profileId,aisle,stage,englishLevel,gradeLevel]);
 useEffect(()=>()=>{speechRun.current++;soundService.cancelSpeech()},[]);
 useEffect(()=>{
  dialog.current?.scrollTo({top:0,behavior:'instant'});
  setHeard(false);setSpeaking(false);
 },[aisle,stage,q,revision]);
 // Listening and order rounds play their English as soon as a question opens,
 // as Hayvan Çayırı does; the big button replays it. Without a device voice
 // the same call opens the written support at once.
 useEffect(()=>{
  if((stage!==3&&stage!==4)||!task||muted||success||busy||finished)return;
  const timer=window.setTimeout(()=>{soundService.unlockAudio();speak(task.audio,true);},450);
  return()=>window.clearTimeout(timer);
 },[aisle,stage,q,revision,task?.audio,muted,success,busy,finished]);
 function speak(text:string,listenGate=false){
  cancelVoice();
  if(muted||!soundService.hasEnglishSpeech()){
    if(listenGate){setHint(true);setFeedback({good:false,text:'Ses kullanılamıyor',detail:'Yazılı destekle devam edebilirsin.'});}
    return;
  }
  const token=speechRun.current;
  const started=soundService.speakEnglish(text,{
    rate:0.81,
    onStart:()=>{if(token===speechRun.current)setSpeaking(true);},
    onEnd:()=>{if(token===speechRun.current){setSpeaking(false);if(listenGate)setHeard(true);}},
    onError:()=>{if(token===speechRun.current){setSpeaking(false);
      if(listenGate){setHeard(false);setHint(true);setFeedback({good:false,text:'Ses tamamlanamadı',detail:'Yazılı destek açıldı.'});}}}
  });
  if(!started&&listenGate){setHint(true);setFeedback({good:false,text:'Ses açılamadı',detail:'Yazılı destekle devam et.'});}

 }
 function changeStage(next:MarketStage,nextAisle:MarketAisle=aisle){
   if(busy)return;
   cancelVoice();locked.current=false;answerLock.current=false;visitedRef.current.clear();wrongRef.current.clear();
   session.current=newSession(profileId,nextAisle,next);
   started.current=Date.now();
   setStage(next);setAisle(nextAisle);setRevision(v=>v+1);
   setVisited([]);setAnswers([]);setWrong(0);setRoundWrong(0);setQ(0);
   setHint(false);setHeard(false);setSelected(null);setWrongIds([]);setSuccess(false);
   setFinished(false);setBusy(false);setSaveError('');setFeedback(null);
 }
 async function finish(result:FoodAnswerEvidence[]){
   if(locked.current||result.length<4)return;
   locked.current=true;setBusy(true);setSaveError('');
   try{
     await onSave(aisle,stage,wrong,(Date.now()-started.current)/1000,result,session.current);
     setFinished(true);soundService.playSfx('fanfare',0.8);
     setFeedback(null);
   }catch(err){console.error('Pazar görevi kaydedilemedi',err);
     setSaveError('İlerleme kaydedilemedi. Tekrar deneyebilirsin.');
     locked.current=false;
   }finally{setBusy(false);}
 }
 function record(id:string,kind:FoodAnswerEvidence['kind'],errors:number,assisted:boolean):FoodAnswerEvidence{
  return {wordId:id,kind,mistakes:errors,firstTryCorrect:errors===0&&!assisted,
    hintUsed:assisted,timestamp:new Date().toISOString()};
 }
 function discover(id:string){
  if(!current||stage!==1||busy||finished)return;
  speak(id);setFeedback({good:true,text:upper(marketWord(id).id),lang:'en',detail:marketWord(id).tr});
  if(visitedRef.current.has(id))return;
  visitedRef.current.add(id);
  setVisited(a=>[...a,id]);
  setAnswers(a=>[...a,record(id,'discovery',0,false)]);
 }
 /** A wrong answer says what the child picked, never what the answer is. */
 function wrongDetail(id:string):string{
  const w=marketWord(id);
  if(stage===2)return `${upper(w.id)} = ${w.tr}. Resme yeniden bak.`;
  if(stage===5&&task&&q%2===0&&current?.questions.some(x=>x.orderPair===task.orderPair&&x.target===id))
   return `${upper(w.id)} listede ikinci. Önce ilk ürünü bul!`;
  return `Bu: ${w.tr} (${upper(w.id)}). ${stage===5?'Listeye yeniden bak.':stage===4?'Müşteriyi yeniden dinle.':'Yeniden dinle.'}`;
 }
 function choose(id:string){
  if(!current||!task||busy||finished||success||locked.current||answerLock.current||wrongRef.current.has(id))return;
  if(stage===3&&!heard&&!hint)return;
  if(stage===4&&!heard&&!hint)return;
  if(id!==task.target){
    wrongRef.current.add(id);
    setWrongIds([...wrongRef.current]);
    setWrong(x=>x+1);setRoundWrong(x=>x+1);
    soundService.playSfx('gentle_retry',0.65);
    setFeedback({good:false,text:'Bir daha dene! 🧺',detail:wrongDetail(id)});
    return;
  }
  const kind=stage===2?'recognition':stage===3?'listening':stage===4?'dialogue':'application';
  answerLock.current=true;
  const proof=record(id,kind,roundWrong,hint||(stage===3&&!heard));
  const next=[...answers,proof];
  setAnswers(next);setSelected(id);setSuccess(true);
  soundService.playSfx('correct',0.75);
  setFeedback(stage===4
   ?{good:true,text:handOver(id),lang:'en',detail:`${marketWord(id).tr} · Müşteri mutlu!`}
   :{good:true,text:`✓ ${upper(marketWord(id).id)}!`,lang:'en',detail:`${marketWord(id).tr} · ${stage===5?'Sepete girdi!':'Doğru!'}`});
  if(stage===2||stage===5)speak(id);
  if(stage===4)speak(handOver(id));
 }
 function advance(){
  if(!success||busy||!current)return;
  if(q+1>=current.questions.length){void finish(answers);return;}
  cancelVoice();answerLock.current=false;wrongRef.current.clear();setWrongIds([]);setQ(n=>n+1);setSuccess(false);setSelected(null);
  setHint(false);setHeard(false);setFeedback(null);setRoundWrong(0);
 }
 useAutoQuestionAdvance({ready:success,blocked:busy||finished||Boolean(saveError)||!current,
   onAdvance:advance,delayMs:1150,speaking});
 // Discovery completes without a second confirmation, but never before every
 // unique exposure has a corresponding evidence row ready for persistence.
 useAutoQuestionAdvance({
   ready:stage===1&&Boolean(current?.words.length)&&
     visited.length===current?.words.length&&answers.length===current?.words.length,
   blocked:busy||finished||Boolean(saveError)||!current,
   // Wait for the last product's English word to finish (as Family and Temple do).
   onAdvance:()=>{void finish(answers);},delayMs:900,speaking
 });
 const allowedAisle=(i:number)=>i===0||(i===1?progress.completedByAisle.orchard===5:progress.completedByAisle.bakery===5);
 const stageEnabled=(n:number)=>n<=usedStage+1;
 // The last answer of a mission says the mission is being saved.
 const finishing=!saveError&&(stage===1?Boolean(current?.words.length)&&visited.length===current?.words.length:
   success&&q+1===numberOfQuestions);
 const toast=feedback?{...feedback,detail:feedback.good&&finishing?'Görev kaydediliyor…':feedback.detail}:null;
 const stars=marketMissionStars(wrong,answers);
 const practised=answers.filter(a=>a.kind!=='discovery');
 const assisted=practised.filter(a=>a.hintUsed).length;
 // The words this mission practised, for the tap-to-hear recap.
 const recap=[...new Set((stage===1?answers:practised).map(a=>a.wordId))];
 const canHear=!muted&&soundService.hasEnglishSpeech();
 return <div ref={dialog} role="dialog" aria-modal="true" aria-label="Lezzet Pazarı İngilizce macerası"
 className="fm-screen fm4-screen fm6-screen gg-quest-screen fm7-screen" data-aisle={aisle} data-stage={stage}>
  <div className="fm-shell fm4-shell">
   <header className="fm-header fm4-header">
    <button type="button" data-game-exit className="fm-back fm4-back" disabled={busy} aria-label="Kelime Bahçesi’ne dön" onClick={()=>{cancelVoice();onBack();}}>
      <span className="fm4-back-arrow" aria-hidden="true">‹</span><span className="fm4-back-label">Kelime Bahçesi</span>
     </button>
    <div className="fm-brand fm4-brand"><span>VENTRA KIDS · WORD GARDEN</span><h1><span aria-hidden="true">🍓</span> Lezzet Pazarı</h1>
      <p className="sr-only" lang="en">See it · Hear it · Say it · Find it!</p></div>
    <div className="fm7-hud-tools">
     <div className="fm-score fm4-score">⭐ {Object.values(progress.starsByLevel).reduce((n,v)=>n+v,0)} / 45</div>
     <GardenHelp label="Lezzet Pazarı nasıl oynanır?">
      <p><strong>{stageMeta.title}:</strong> {stageMeta.description}</p>
      <p>Her sokakta beş görev var: keşfet, kelimeyi bul, dinle, siparişi anla ve sepeti doldur. Ses açılmasa da yazılı destekle oynanabilir; destekli cevaplar ayrıca kaydedilir.</p>
     </GardenHelp>
     <button className="fm-sound fm4-sound" onClick={()=>{const next=!muted;setMuted(next);soundService.toggleMute();
      if(next)cancelVoice();}} aria-label={muted?'Sesi aç':'Sesi kapat'}>{muted?'🔇':'🔊'}</button>
    </div>
   </header>
   <GardenQuestNavigator areaTitle={currentAisle.title} stageTitle={stageMeta.title} stage={stage} totalStages={5}>
   <section className="fm-map fm4-map gg-quest-zone-nav" aria-label="Pazar sokakları">
    {MARKET_AISLES.map((lane,i)=>{
     const unlocked=allowedAisle(i);
     return <button key={lane.id} disabled={!unlocked||busy} onClick={()=>changeStage(
      Math.min(5,progress.completedByAisle[lane.id]+1) as MarketStage,lane.id)}
      data-current={lane.id===aisle} data-aisle={lane.id}
      aria-current={lane.id===aisle?'true':undefined}
       className={`fm-lane fm4-lane gg-quest-zone ${lane.id===aisle?'fm-lane-active':''}`}>
      <span className="fm6-lane-art" aria-hidden="true"><img src={MARKET_ART[lane.id]} alt="" loading="lazy" decoding="async" draggable={false}/></span>
      <span className="fm-lane-icon" aria-hidden="true">{lane.icon}</span>
      <span className="fm-lane-copy"><strong>{lane.title}</strong><small>{unlocked?`${progress.completedByAisle[lane.id]}/5 görev`:'Önce önceki sokağı tamamla'}</small></span>
     </button>})}
   </section>
   <section className="fm-stagebar fm4-stagebar gg-quest-stage-nav" aria-label="Dil görevleri">
    {MARKET_STAGES.map(item=><button key={item.stage} disabled={!stageEnabled(item.stage)||busy}
      data-current={item.stage===stage}
      data-completed={progress.starsByLevel[MARKET_OFFSETS[aisle]+item.stage]>0}
      aria-label={`${item.stage}. ${item.title}${stageEnabled(item.stage)?'':' (henüz açılmadı)'}`}
       aria-current={item.stage===stage?'step':undefined}
       className={`fm-stage-pill fm4-stage-pill gg-quest-step ${item.stage===stage?'fm-pill-active':''}`}
      onClick={()=>changeStage(item.stage as MarketStage)}>
      <span className="fm4-step-icon" aria-hidden="true">{item.icon}</span><span className="fm4-step-name">{item.stage}. {item.title}</span><span className="fm4-step-index">{item.stage}/5</span>
    </button>)}
   </section>
   </GardenQuestNavigator>
   <section className="fm-play fm4-play" aria-label={stageMeta.title}>
    <div className="fm-scenery fm4-scenery">
      <MarketBackdrop aisle={aisle}/>
      <LearningMotion variant={finished?'victory':stage===1?'discovery':'success'}
       trigger={finished?'market-finished-'+aisle+'-'+stage+'-'+revision:
        success?'market-correct-'+aisle+'-'+stage+'-'+q:
        stage===1&&visited.length?'market-discovery-'+aisle+'-'+visited.length:null}/>
      <div className="fm-scene-label fm4-scene-label"><span>{currentAisle.icon}</span><div>
        <strong>{currentAisle.title}</strong><small lang="en">{currentAisle.subtitle}</small></div>
      </div>
      <span className="fm7-scene-count" aria-label={`Görev ilerlemesi ${completed} / ${numberOfQuestions}`}>{completed}/{numberOfQuestions}</span>
      {toast&&<p className="fm7-toast" data-good={toast.good} role="status" aria-live="polite">
        <span lang={toast.lang}>{toast.text}</span>{toast.detail&&<small>{toast.detail}</small>}
      </p>}
    </div>
    <div className="fm-workshop fm4-workshop">
     <h2 className="sr-only">{stageMeta.title}</h2>
     <div className="fm-meter fm4-meter" role="progressbar" aria-label="Görev ilerlemesi" aria-valuemin={0}
       aria-valuemax={Math.max(1,numberOfQuestions)} aria-valuenow={completed}>
       <span style={{width:`${100*completed/Math.max(1,numberOfQuestions)}%`}}/></div>
     {loadError?<div className="fm-error" role="alert">Öğrenme görevi açılamadı.
       <button onClick={()=>changeStage(stage)}>Tekrar Dene</button></div>:
     !current?<div className="fm-loading" role="status">Pazar sokağı hazırlanıyor…</div>:
     finished?<div className="fm-win fm4-win">
       <div className="fm-win-icon">🏆</div><h2 ref={doneHeading} tabIndex={-1} lang="en">Fantastic! Great shopping!</h2>
       <p className="fm-gained" aria-label={`${stars} yıldız kazanıldı`}>{'⭐'.repeat(stars)}</p>
       <p className="fm7-win-stats">{stage===1?`${answers.length} ürünün İngilizcesini dinledin`:
         `${practised.length} doğru · ${wrong} yanlış deneme${assisted?` · ${assisted} destekli`:''}`}</p>
       {recap.length>0&&<div className="fm7-recap" role="group" aria-label="Bu görevin İngilizce kelimeleri">
         <p className="fm7-recap-title">Bu görevin kelimeleri · dokun ve dinle</p>
         <div className="fm7-recap-list">{recap.map(id=><button key={id} type="button" className="fm7-recap-word"
           onClick={()=>speak(id)} disabled={!canHear} aria-label={`${marketWord(id).tr}, İngilizce ${id}, dinle`}>
           <FoodIllustration id={id} className="fm7-recap-art"/><span lang="en">{id}</span></button>)}</div>
       </div>}
       {aisle==='cafe'&&stage===5&&<GameFinale title="Lezzet Pazarı tamamlandı!"
        detail="Üç sokağın 15 görevinin hepsini bitirdin."/>}
       <button className="fm-cta" onClick={()=>{
         if(stage<5)changeStage((stage+1) as MarketStage);
         else if(aisle==='orchard')changeStage(1,'bakery');
         else if(aisle==='bakery')changeStage(1,'cafe');
         else onBack();
       }}>{stage<5?'Sonraki Dil Görevi →':aisle==='cafe'?'Bahçeye Dön':'Sonraki Sokağı Keşfet →'}</button>
       <button className="fm-secondary" onClick={()=>changeStage(stage)}>↻ Tekrar Oyna</button>
     </div>:
     <div className="fm-activity fm4-activity">
      {stage===1?<>
       <div className="fm-command fm4-command"><span>👆</span><div><strong lang="en">Explore & listen</strong><small>Her ürüne dokun, İngilizce adını keşfet.</small></div></div>
       <div className="fm-products fm4-products fm7-answers">
        {current.words.map(id=><Item key={id} id={id} showEnglish={visited.includes(id)}
          selected={visited.includes(id)} disabled={busy||visited.length===current.words.length} onClick={()=>discover(id)}/>)}
       </div>
      </>:task?<>
       <div ref={questionPrompt} tabIndex={-1} className="fm-command fm4-command">
          <span aria-hidden="true">{stage===2?'🔤':stage===3?'🎧':stage===4?'💬':'🛒'}</span>
          <div>
           {stage===2?<><strong lang="en">What is this in English?</strong><small>Resme bak ve İngilizce adını seç.</small></>:
            stage===3?<><strong lang="en">Listen and find it!</strong><small>Önce kelimeyi dinle, sonra doğru ürüne dokun.</small></>:
            stage===4?<><strong lang="en">Customer says:</strong><small>Müşterinin İngilizce isteğini dinle ve ürünü ver.</small></>:
            <><strong><span lang="en">Shopping list</span> · {Math.floor(q/2)+1}/3</strong>
             <strong className="fm-english fm5-order-sentence" lang="en">{task.prompt}</strong>
             <small className="fm5-order-progress">{q%2===0?'1. ürün: FIRST':'2. ürün: THEN'} — Listedeki sırayı takip et.</small>
            </>}
          </div>
        </div>
        {stage===2&&<div className="fm-featured fm4-featured" role="img"
          aria-label={`Bu ürünün İngilizcesini seç: ${marketWord(task.target).tr}`}>
         <span className="fm4-featured-stand" aria-hidden="true"><FoodIllustration id={task.target} className="fm4-featured-product"/></span>
        </div>}
       {(stage===3||stage===4)&&<div className="fm-audio-panel fm4-audio-panel fm5-customer-audio">
          <button type="button" className="fm-audio-button" disabled={busy||success} onClick={()=>speak(task.audio,true)}>
            {speaking?'🔉 Dinleniyor…':stage===4?'▶ Müşteriyi Dinle':'▶ İngilizceyi Dinle'}
          </button>
          <button type="button" className="fm-text-hint" disabled={busy||success}
           onClick={()=>{setHint(true);setFeedback({good:true,text:'Yazılı destek açık',detail:'Bu cevap destekli sayılır.'})}}>
           Yazılı yardım
          </button>
          {hint&&<p className="fm5-assisted-text">Yazılı destek: <strong lang="en">{stage===4?task.prompt:task.target.toUpperCase()}</strong></p>}
          {!heard&&!hint&&<p className="fm5-listen-status">Önce dinle: ürünler sesi duyduktan sonra açılır.</p>}
        </div>}
        {(stage===2||stage===5)&&<div className="fm-hint-row">
          <button type="button" className="fm-text-hint" disabled={busy||success}
           onClick={()=>{setHint(true);setFeedback({good:true,text:'💡 İpucu açık',detail:'Bu cevap destekli sayılır.'})}}>💡 İpucu</button>
          <button type="button" className="fm-text-hint" disabled={busy||success}
           onClick={()=>{setHint(true);speak(task.audio);}}>🔊 İngilizceyi Duy</button>
          {hint&&<span className="fm7-hint-text">{stage===2?`İlk harf: ${task.target[0].toUpperCase()}`:`Şimdi: ${marketWord(task.target).tr}`}</span>}
        </div>}
        {stage===2?
         <div className="fm5-word-choices" aria-label="İngilizce kelime seçenekleri">
          {task.options.map((id,i)=><button key={id} type="button"
            aria-label={`Seçenek ${i+1}: ${id}`}
            data-result={success&&selected===id?'correct':wrongIds.includes(id)?'wrong':undefined}
            className="fm5-word-option"
            disabled={success||busy||wrongIds.includes(id)}
            onClick={()=>choose(id)}>
            <span className="fm5-option-marker" aria-hidden="true">{String.fromCharCode(65+i)}</span>
            <span className="fm5-word-label" lang="en">{id.toUpperCase()}</span>
            {success&&selected===id&&<span aria-hidden="true" className="fm5-answer-check">✓</span>}
            {wrongIds.includes(id)&&<span aria-hidden="true" className="fm5-answer-check">×</span>}
          </button>)}
         </div>:
         stage===4?
         <div className="fm-dialogue-choices fm4-dialogue-choices fm5-dialogue-choices fm7-answers" aria-label="Müşterinin istediği ürünü seç">
          {task.options.map((id,i)=><button key={id} type="button"
            aria-label={`Seçenek ${i+1}: ${marketWord(id).tr} görseli`}
            data-result={success&&selected===id?'correct':wrongIds.includes(id)?'wrong':undefined}
            className="fm-dialogue-option fm4-dialogue-option fm5-dialogue-option"
            disabled={success||busy||wrongIds.includes(id)||(!heard&&!hint)}
            onClick={()=>choose(id)}>
            <FoodIllustration id={id} className="fm4-dialogue-art"/>
            <span className="fm5-dialogue-option-label">{i+1}</span>
            {success&&selected===id&&<span className="fm5-answer-check" aria-hidden="true">✓</span>}
          </button>)}
         </div>:
         <div className={`fm-products fm4-products fm-choices fm7-answers ${stage===5?'fm-supermarket-grid':''}`}>
          {(stage===5?current.words:task.options).map(id=><Item key={id} id={id}
            active={success&&id===task.target} selected={selected===id} wrong={wrongIds.includes(id)}
            disabled={success||busy||wrongIds.includes(id)||(stage===3&&!heard&&!hint)||
              (stage===5&&answers.some(a=>a.kind==='application'&&a.wordId===id))}
            draggable={stage===5}
            onDragStart={event=>{event.dataTransfer.setData('text/plain',id);event.dataTransfer.effectAllowed='move';}}
            onClick={()=>choose(id)}/>)}
         </div>}
        {stage===5&&<div className="fm-basket-target fm4-basket-target" role="region"
         aria-label="Pazar sepeti. Bir ürünü sürükleyip buraya bırakabilir veya ürüne dokunabilirsin."
         onDragOver={event=>event.preventDefault()}
         onDrop={event=>{event.preventDefault();const id=event.dataTransfer.getData('text/plain');
           if(id&&current.words.includes(id))choose(id);}}>
           <BasketIllustration/>
           <div><strong lang="en">Drop it in the basket!</strong>
             <small>Ürünü sepete sürükle veya kartına dokun.</small></div>
           <div className="fm-basket fm4-basket" role="status" aria-label="Sepetteki öğrenilmiş ürünler">
            <span>SEPETTE · {answers.filter(x=>x.kind==='application').length}/{current.questions.length}</span>
            <div className="fm4-basket-products">
             {answers.filter(x=>x.kind==='application').map((row,i)=><span key={i}
               title={marketWord(row.wordId).tr}><FoodIllustration id={row.wordId}/></span>)}
            </div>
           </div>
         </div>}
      </>:<div role="alert">Görev içeriği eksik. <button onClick={()=>changeStage(stage)}>Yenile</button></div>}
      {saveError&&<div role="alert" className="fm-error">{saveError}
       <button onClick={()=>void finish(answers)}>Kaydetmeyi Tekrar Dene</button></div>}
     </div>}
    </div>
   </section>
  </div>
 </div>;
}
