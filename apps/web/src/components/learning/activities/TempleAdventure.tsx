'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import type {TempleAnswerEvidence} from '@ventra/shared';
import type {EnglishPlacement} from '@/lib/learning/gradeAwareLearningPolicy';
import {getProgressRepository} from '@/lib/progress';
import {soundService} from '@/lib/audio/SoundService';
import {TEMPLE_CHAMBERS,TEMPLE_STAGES,TEMPLE_OFFSETS,TEMPLE_TOTAL,
 templeWord,templeResumePoint,planTempleMission,templeWeakWords,
 type TemplePlan,type TempleChamber,type TempleStage} from '@/lib/learning/templeEngine';
import type {TempleProgress} from '@/lib/progress/templeProgress';
import {TempleScenery} from './TempleScenery';
import './temple-adventure.css';

type Props={profileId:string;gradeLevel:number|null;englishLevel:EnglishPlacement;
 progress:TempleProgress;onBack:()=>void;
 onSave:(chamber:TempleChamber,stage:TempleStage,mistakes:number,duration:number,
  answers:TempleAnswerEvidence[],sessionId:string)=>Promise<void>};
const idFor=(profile:string,room:TempleChamber,stage:TempleStage)=>
 `temple:${profile}:${room}:${stage}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

function Rune({id,mode='icon',active=false,visited=false,disabled=false,onClick}:{
 id:string;mode?:'icon'|'en'|'tr';active?:boolean;visited?:boolean;disabled?:boolean;onClick?:()=>void
}){
 const word=templeWord(id);
 return <button type="button" onClick={onClick} disabled={disabled} aria-pressed={active||visited}
   aria-label={mode==='en'?word.en:mode==='tr'?word.tr:word.tr+' sembolü'}
   className={`tp-rune tp-rune-${word.domain} ${active?'tp-rune-lit':''} ${visited?'tp-rune-seen':''}`}>
   {mode==='icon'?<span className="tp-rune-art" aria-hidden="true">
     {word.color?<span className="tp-color-crystal" style={{background:word.color}}/>:
      word.image?<img className="tp-rune-animal" src={word.image} alt="" draggable={false}/>:
      <span className={word.domain==='numbers'?'tp-number-glyph':'tp-emoji-glyph'}>{word.icon}</span>}
   </span>:<span className="tp-rune-text">{mode==='en'?word.en:word.tr}</span>}
   {(active||visited)&&<span className="tp-rune-check" aria-hidden="true">✓</span>}
 </button>;
}
export function TempleAdventure({profileId,gradeLevel,englishLevel,progress,onBack,onSave}:Props){
 const initial=templeResumePoint(progress.completedByChamber);
 const [chamber,setChamber]=useState<TempleChamber>(initial.chamber);
 const [stage,setStage]=useState<TempleStage>(initial.stage);
 const [revision,setRevision]=useState(0);
 const [plan,setPlan]=useState<TemplePlan|null>(null);
 const [loadedKey,setLoadedKey]=useState('');
 const [loadError,setLoadError]=useState(false);
 const [visited,setVisited]=useState<string[]>([]);
 const [answers,setAnswers]=useState<TempleAnswerEvidence[]>([]);
 const [mistakes,setMistakes]=useState(0);
 const [roundMistakes,setRoundMistakes]=useState(0);
 const [question,setQuestion]=useState(0);
 const [chosenTokens,setChosenTokens]=useState<number[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [correct,setCorrect]=useState(false);
 const [finished,setFinished]=useState(false);
 const [busy,setBusy]=useState(false);
 const [saveError,setSaveError]=useState('');
 const [hint,setHint]=useState(false);
 const [heard,setHeard]=useState(false);
 const [speaking,setSpeaking]=useState(false);
 const [notice,setNotice]=useState('');
 const [muted,setMuted]=useState(()=>soundService.getMuted());
 const started=useRef(Date.now()),locked=useRef(false),run=useRef(0);
 const session=useRef(idFor(profileId,initial.chamber,initial.stage));
 const scrollRef=useRef<HTMLDivElement>(null);
 const key=`${profileId}/${chamber}/${stage}/${gradeLevel}/${englishLevel}/${revision}`;
 const current=plan&&loadedKey===key&&plan.chamber===chamber&&plan.stage===stage?plan:null;
 const task=current?.questions[question];
 const stageInfo=TEMPLE_STAGES[stage-1],roomInfo=TEMPLE_CHAMBERS.find(w=>w.id===chamber)!;
 const completedSteps=progress.completedByChamber[chamber];
 const stepTotal=stage===1?current?.words.length??0:current?.questions.length??0;
 const stepCount=stage===1?visited.length:question+Number(correct);
 const stopAudio=useCallback(()=>{
  run.current++;setSpeaking(false);
  if(typeof window!=='undefined'&&'speechSynthesis' in window)window.speechSynthesis.cancel();
 },[]);
 useEffect(()=>{
  let alive=true;
  setPlan(null);setLoadedKey('');setLoadError(false);
  const repo=getProgressRepository();
  Promise.all([
   repo.getTempleAnswerHistory(profileId),repo.getAnimalAnswerHistory(profileId),
   repo.getColorAnswerHistory(profileId),repo.getNumberAnswerHistory(profileId),
   repo.getFoodAnswerHistory(profileId),repo.getFamilyAnswerHistory(profileId)
  ]).then(([history,animals,colors,numbers,food,family])=>{
   if(!alive)return;
   const weak=templeWeakWords({animals,colors,numbers,food,family});
   setPlan(planTempleMission({chamber,stage,gradeLevel,englishLevel,history,weak,seed:Math.floor(Math.random()*4294967295)}));
   setLoadedKey(key);
  }).catch(err=>{console.error('Keşif Tapınağı planı oluşturulamadı',err);if(alive)setLoadError(true);});
  return()=>{alive=false};
 },[key,profileId,gradeLevel,englishLevel,chamber,stage]);
 useEffect(()=>()=>{run.current++;if(typeof window!=='undefined'&&'speechSynthesis' in window)window.speechSynthesis.cancel()},[]);
 useEffect(()=>{
  scrollRef.current?.scrollTo({top:0,behavior:'instant'});
  setHeard(false);setSpeaking(false);
 },[chamber,stage,question,revision]);
 function speak(text:string,requireFullAudio=false){
  stopAudio();
  if(muted||typeof window==='undefined'||!('speechSynthesis' in window)||
    typeof SpeechSynthesisUtterance==='undefined'){
   if(requireFullAudio){setHint(true);setNotice('Ses yok; yazılı ipucuyla devam edebilirsin.');}
   return;
  }
  const token=run.current;
  try{
   const utterance=new SpeechSynthesisUtterance(text);
   utterance.lang='en-US';utterance.rate=.76;utterance.pitch=1.04;
   utterance.onstart=()=>{if(token===run.current)setSpeaking(true)};
   utterance.onend=()=>{if(token===run.current){setSpeaking(false);if(requireFullAudio)setHeard(true)}};
   utterance.onerror=()=>{if(token===run.current){setSpeaking(false);
    if(requireFullAudio){setHeard(false);setHint(true);setNotice('Ses oynatılamadı; yazılı yardım açıldı.')}}};
   window.speechSynthesis.speak(utterance);
  }catch{if(requireFullAudio){setHint(true);setNotice('Ses açılamadı; yazılı yardım açık.');}}
 }
 function enter(nextChamber:TempleChamber,nextStage:TempleStage){
  if(busy)return;
  stopAudio();locked.current=false;
  session.current=idFor(profileId,nextChamber,nextStage);
  started.current=Date.now();
  setChamber(nextChamber);setStage(nextStage);setRevision(n=>n+1);
  setPlan(null);setLoadedKey('');setLoadError(false);
  setVisited([]);setAnswers([]);setMistakes(0);setRoundMistakes(0);
  setQuestion(0);setChosenTokens([]);setSelected(null);setCorrect(false);
  setFinished(false);setBusy(false);setSaveError('');setHint(false);setHeard(false);setNotice('');
 }
 function record(id:string,kind:TempleAnswerEvidence['kind'],wrong:number,assisted:boolean):TempleAnswerEvidence{
  return {wordId:id,sourceDomain:templeWord(id).domain,kind,mistakes:wrong,
   firstTryCorrect:wrong===0&&!assisted,hintUsed:assisted,timestamp:new Date().toISOString()};
 }
 function discover(id:string){
  if(!current||stage!==1||busy||finished)return;
  speak(templeWord(id).en);
  setNotice(templeWord(id).en.toUpperCase()+' · '+templeWord(id).tr);
  if(visited.includes(id))return;
  setVisited(v=>[...v,id]);
  setAnswers(v=>[...v,record(id,'discovery',0,false)]);
 }
 function markCorrect(id:string,kind:TempleAnswerEvidence['kind']){
  if(!current||!task||correct||busy||locked.current)return;
  setAnswers(v=>[...v,record(id,kind,roundMistakes,hint||(stage===3&&!heard))]);
  setSelected(id);setCorrect(true);
  setNotice('✓ '+templeWord(id).en+' — doğru!');
  if(stage!==3)speak(templeWord(id).en);
 }
 function pick(id:string){
  if(!task||!current||finished||correct||busy||locked.current)return;
  if(stage===3&&!heard&&!hint)return;
  if(id!==task.target){
   setMistakes(v=>v+1);setRoundMistakes(v=>v+1);
   setNotice('Bu mühür değil. Yeniden dene veya ipucunu aç.');
   return;
  }
  markCorrect(id,stage===2?'recognition':stage===3?'listening':'sequence');
 }
 function chooseToken(index:number){
  if(stage!==4||!task?.sentenceTokens||!task.sentenceAnswer||correct||busy||chosenTokens.includes(index))return;
  const next=[...chosenTokens,index];
  if(next.length<task.sentenceAnswer.length){setChosenTokens(next);return;}
  if(next.every((v,i)=>task.sentenceTokens?.[v]===task.sentenceAnswer?.[i])){
   setChosenTokens(next);markCorrect(task.target,'sentence');
  }else{
   setMistakes(n=>n+1);setRoundMistakes(n=>n+1);
   setChosenTokens([]);setNotice('Cümlenin sırası henüz doğru değil. Yeniden kur!');
  }
 }
 async function complete(result:TempleAnswerEvidence[]){
  if(locked.current||result.length<4)return;
  locked.current=true;setBusy(true);setSaveError('');
  try{
   await onSave(chamber,stage,mistakes,(Date.now()-started.current)/1000,result,session.current);
   setFinished(true);setNotice('Tapınak mührü kaydedildi!');
  }catch(err){
   console.error('Tapınak görevi kaydedilemedi',err);
   setSaveError('Görev kaydedilemedi. İnternet/cihaz depolamasını kontrol edip tekrar dene.');
   locked.current=false;
  }finally{setBusy(false);}
 }
 function advance(){
  if(!correct||!current||busy)return;
  if(question+1>=current.questions.length){void complete(answers);return;}
  stopAudio();setQuestion(x=>x+1);setCorrect(false);setSelected(null);
  setChosenTokens([]);setHint(false);setHeard(false);setRoundMistakes(0);setNotice('');
 }
 const canEnter=(i:number)=>i===0||progress.completedByChamber[TEMPLE_CHAMBERS[i-1].id]===5;
 const pairQuestions=stage===5&&current?current.questions.slice(Math.floor(question/2)*2,Math.floor(question/2)*2+2):[];
 return <div className="tp-screen" role="dialog" aria-modal="true"
  aria-label="Keşif Tapınağı İngilizce final dünyası" ref={scrollRef}>
  <div className="tp-shell">
   <header className="tp-header">
    <button className="tp-return" onClick={()=>{stopAudio();onBack()}}>← Kelime Bahçesi</button>
    <div className="tp-title"><span>VENTRA • THE ENGLISH TEMPLE</span>
     <h1>✨ Keşif Tapınağı</h1><p>Explore · Listen · Build · Unlock</p>
    </div>
    <div className="tp-score">⭐ {Object.values(progress.starsByLevel).reduce((sum,v)=>sum+v,0)} / 75</div>
   </header>
   <nav className="tp-chambers" aria-label="Keşif Tapınağı bölümleri">
    {TEMPLE_CHAMBERS.map((room,i)=><button type="button" key={room.id}
       disabled={!canEnter(i)||busy} aria-pressed={chamber===room.id}
       className={`tp-chamber ${chamber===room.id?'tp-active-chamber':''}`}
       onClick={()=>enter(room.id,Math.min(5,progress.completedByChamber[room.id]+1) as TempleStage)}>
       <span>{canEnter(i)?room.icon:'🔒'}</span>
       <strong>{room.title}</strong>
       <small>{canEnter(i)?`${progress.completedByChamber[room.id]}/5 görev`:'Mühür kilitli'}</small>
     </button>)}
   </nav>
   <nav className="tp-trials" aria-label="Bölümün beş dil görevi">
    {TEMPLE_STAGES.map(trial=><button type="button" key={trial.stage}
     disabled={trial.stage>completedSteps+1||busy} aria-pressed={trial.stage===stage}
     className={`tp-trial ${trial.stage===stage?'tp-active-trial':''}`}
     onClick={()=>enter(chamber,trial.stage as TempleStage)}>
     <span>{trial.icon}</span><small>{trial.stage}. {trial.title}</small>
     {progress.starsByLevel[TEMPLE_OFFSETS[chamber]+trial.stage]>0&&<b>★</b>}
    </button>)}
   </nav>
   <section className="tp-quest">
    <div className="tp-scenery">
     <TempleScenery chamber={chamber} cleared={completedSteps}/>
     <div className="tp-scene-label"><span>{roomInfo.icon}</span><div>
      <strong>{roomInfo.title}</strong><small>{roomInfo.subtitle}</small></div></div>
     <div className="tp-mission-tag">✦ TRIAL {TEMPLE_OFFSETS[chamber]+stage}/{TEMPLE_TOTAL}</div>
    </div>
    <div className="tp-workbench">
     <div className="tp-panel-head"><div><span className="tp-eyebrow">THE LEGEND OF WORDS</span>
      <h2>{stageInfo.icon} {stageInfo.title}</h2><p>{stageInfo.desc}</p></div>
      <button className="tp-mute" aria-label={muted?'Sesi aç':'Sesi kapat'}
       onClick={()=>{const m=!muted;setMuted(m);soundService.toggleMute();if(m)stopAudio();}}>
       {muted?'🔇':'🔊'}</button>
     </div>
     <div className="tp-meter" role="progressbar" aria-label="Görev ilerlemesi" aria-valuemin={0}
       aria-valuemax={Math.max(1,stepTotal)} aria-valuenow={stepCount}>
       <span style={{width:`${100*stepCount/Math.max(1,stepTotal)}%`}}/></div>
     <p className="tp-step-count">{stepCount}/{stepTotal} · Tapınak rünü</p>
     {loadError?<div className="tp-error" role="alert">Tapınak planı yüklenemedi.
      <button onClick={()=>enter(chamber,stage)}>Tekrar Dene</button></div>:
     !current?<p className="tp-loading" role="status">Tapınağın kristalleri hazırlanıyor…</p>:
     finished?<div className="tp-finished">
      <div className="tp-trophy">{chamber==='crown'&&stage===5?'👑':'🏆'}</div>
      <h2>{chamber==='crown'&&stage===5?'The English Temple is yours!':'Crystal unlocked!'}</h2>
      <p>{chamber==='crown'&&stage===5?
       'İngilizce maceranın büyük finalini tamamladın! Eski kelimelerini yeni görevlerde tekrar kullanabilirsin.':
       'İngilizce mührü açtın; kazanımların ve yıldızların kaydedildi.'}</p>
      <strong>⭐ {mistakes===0?'⭐⭐⭐':mistakes<=2?'⭐⭐':'⭐'}</strong>
      <button className="tp-primary" onClick={()=>{
       if(stage<5)enter(chamber,(stage+1) as TempleStage);
       else if(chamber!=='crown')enter(TEMPLE_CHAMBERS[TEMPLE_CHAMBERS.findIndex(w=>w.id===chamber)+1].id,1);
       else onBack();
      }}>{stage<5?'Sonraki Görev →':chamber==='crown'?'Bahçeye Dön':'Yeni Salonu Aç →'}</button>
      <button className="tp-secondary" onClick={()=>enter(chamber,stage)}>↻ Tekrar Oyna</button>
     </div>:<div className="tp-play">
      {stage===1?<><div className="tp-command"><span>🗺️</span><div>
        <strong>Touch every lost rune!</strong><small>Sembolü keşfet, İngilizce adını dinle.</small>
       </div></div>
       <div className="tp-grid tp-discovery">
        {current.words.map(id=><div key={id} className="tp-discovery-cell">
         <Rune id={id} visited={visited.includes(id)} onClick={()=>discover(id)}/>
         {visited.includes(id)&&<div className="tp-reveal"><strong>{templeWord(id).en}</strong>
          <small>{templeWord(id).tr}</small></div>}
        </div>)}
       </div>
       <button className="tp-primary" disabled={visited.length<current.words.length||busy}
        onClick={()=>void complete(answers)}>Rünleri Açtım ✓</button>
      </>:task?<><div className="tp-command"><span>{stageInfo.icon}</span><div>
       {stage===2?<><strong>Translate the mysterious inscription!</strong>
        <small>Türkçe: <b>{task.prompt}</b> — doğru İngilizce kelimeyi bul.</small></>:
       stage===3?<><strong>Listen to the crystal!</strong>
        <small>İngilizce sesi sonuna kadar dinle, doğru sembolü seç.</small></>:
       stage===4?<><strong>Build the English bridge!</strong>
        <small>Bu ifadeyi İngilizce bir cümle olarak sırala: <b>{templeWord(task.target).tr}</b></small></>:
       <><strong>The secret seal · {Math.floor(question/2)+1}/3</strong>
        <small>İngilizce mühürleri sırayla topla:</small>
        <strong className="tp-code">{pairQuestions.map(q=>templeWord(q.target).en).join(' ✧ ')}</strong>
        <small>Şimdi {question%2===0?'ilk':'ikinci'} sembolü bul.</small></>}
       </div></div>
       {stage===3&&<div className="tp-listen-panel">
        <button className="tp-listen" onClick={()=>speak(task.audio,true)}>
         {speaking?'🔉 Listening…':'▶ Listen in English'}</button>
        <button className="tp-help" onClick={()=>{setHint(true);setNotice('Yazılı yardım etkin: bağımsız dinleme sayılmaz.');}}>
         Yazılı yardım</button>
        {hint&&<p>English: <strong>{templeWord(task.target).en}</strong></p>}
       </div>}
       {stage!==3&&<div className="tp-controls">
        <button className="tp-help" onClick={()=>{setHint(true);setNotice('İpucu açıldı: yanıt destekli olarak kaydedilecek.');}}>💡 İpucu</button>
        <button className="tp-help" onClick={()=>speak(task.audio)}>🔊 İngilizceyi Duy</button>
        {hint&&<span>İpucu: {stage===4?task.sentenceAnswer?.join(' '):templeWord(task.target).en}</span>}
       </div>}
       {stage===4?<div className="tp-sentence">
        <div className="tp-sentence-line" role="group" aria-label="Oluşturulan İngilizce cümle">
         {chosenTokens.length===0?<em>İngilizce kelimelere sırayla dokun…</em>:
          chosenTokens.map((index,i)=><span key={index} className="tp-sentence-token">{task.sentenceTokens?.[index]}</span>)}
        </div>
        <div className="tp-token-options" role="group" aria-label="Cümle kelimeleri">
         {task.sentenceTokens?.map((word,i)=><button key={i} type="button"
           onClick={()=>chooseToken(i)} disabled={chosenTokens.includes(i)||correct||busy}
           className="tp-word-token">{word}</button>)}
        </div>
        {!correct&&chosenTokens.length>0&&<button className="tp-secondary"
          onClick={()=>setChosenTokens([])}>↺ Cümleyi Sıfırla</button>}
       </div>:
       <div className={`tp-grid ${stage===5?'tp-seal-grid':''}`} role="group" aria-label="İngilizce büyülü seçenekler">
        {(stage===5?current.words:task.options).map(id=><Rune key={id} id={id}
         mode={stage===2?'en':'icon'} active={selected===id}
         disabled={busy||correct||(stage===3&&!heard&&!hint)} onClick={()=>pick(id)}/>)}
       </div>}
       {stage===3&&!heard&&!hint&&<p className="tp-info">Önce dinle; cihazda ses yoksa yazılı yardımla devam et.</p>}
       {stage===5&&<div className="tp-collected" role="status">
        <span>🔐</span><strong>Toplanan mühürler</strong>
        <span>{answers.filter(x=>x.kind==='sequence').map(e=>templeWord(e.wordId).icon).join('  ')||'Henüz mühür yok'}</span>
       </div>}
       {correct&&<button className="tp-primary" onClick={advance} disabled={busy}>
        {question+1===current.questions.length?'Mührü Aç ✓':'Devam Et →'}</button>}
      </>:<div className="tp-error">Soru yüklenemedi. <button onClick={()=>enter(chamber,stage)}>Yenile</button></div>}
      {notice&&<p role="status" className="tp-notice">{notice}</p>}
      {saveError&&<div role="alert" className="tp-error">{saveError}
       <button onClick={()=>void complete(answers)}>Kaydı Tekrar Dene</button></div>}
     </div>}
    </div>
   </section>
   <footer className="tp-footer">All roads lead to English · Every word opens a new door ✨</footer>
  </div>
 </div>;
}
