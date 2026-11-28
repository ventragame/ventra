'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {useQuestionFocus} from './useQuestionFocus';
import type {TempleAnswerEvidence} from '@ventra/shared';
import type {EnglishPlacement} from '@/lib/learning/gradeAwareLearningPolicy';
import {getProgressRepository} from '@/lib/progress';
import {soundService} from '@/lib/audio/SoundService';
import {useAutoQuestionAdvance} from '@/lib/learning/useAutoQuestionAdvance';
import {TEMPLE_CHAMBERS,TEMPLE_STAGES,TEMPLE_OFFSETS,
 sentenceFor,templeWord,templeResumePoint,planTempleMission,templeWeakWords,templeMissionStars,
 type TemplePlan,type TempleChamber,type TempleStage} from '@/lib/learning/templeEngine';
import type {TempleProgress} from '@/lib/progress/templeProgress';
import {TempleScenery} from './TempleScenery';
import './temple-adventure.css';
import './temple-v6.css';
import './temple-v7.css';
import {GardenQuestNavigator} from './GardenQuestNavigator';
import './garden-quest-navigation.css';
import './temple-premium.css';
import './garden-child-legibility.css';
import {GardenHelp} from '../GardenHelp';
import {LearningMotion} from '@/components/learning/motion/LearningMotion';
import {GameFinale} from '../GameFinale';
import {GameTopBar,GameResult} from '../game/GameFrame';

type Props={profileId:string;gradeLevel:number|null;englishLevel:EnglishPlacement;
 progress:TempleProgress;onBack:()=>void;
 onSave:(chamber:TempleChamber,stage:TempleStage,mistakes:number,duration:number,
  answers:TempleAnswerEvidence[],sessionId:string)=>Promise<void>};
type Feedback={text:string;good:boolean;detail?:string;lang?:'en'};
const upper=(text:string)=>text.toUpperCase();
const idFor=(profile:string,room:TempleChamber,stage:TempleStage)=>
 `temple:${profile}:${room}:${stage}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

const KINSHIP=new Set(['mother','father','sister','brother','baby','grandmother','grandfather',
 'family','aunt','uncle','cousin','parents','daughter','son','grandchild']);
const needsRelationshipText=(id:string)=>{
 const word=templeWord(id);
 return word.domain==='family'&&KINSHIP.has(word.en);
};
function RuneArt({id}:{id:string}){
 const word=templeWord(id),slug=word.en.replace(/\s+/g,'-');
 return <span className="tp-rune-art tp6-rune-art" aria-hidden="true">
   {word.color?<span className="tp-color-crystal tp6-color-crystal" style={{background:word.color}}/>:
    word.image?<img className="tp-rune-animal tp6-rune-animal" src={word.image} alt="" draggable={false}/>:
    word.domain==='food'||word.domain==='family'?
     <svg className="tp6-sprite" viewBox="0 0 200 200" focusable="false" aria-hidden="true">
      <use href={word.domain==='food'?
        `/assets/foods/food-sprite-v4.svg#food-${slug}`:
        `/assets/family-village/family-word-sprite-v3.svg#fv-${slug}`}/>
     </svg>:
    <span className="tp-number-glyph tp6-number-glyph">{word.icon}</span>}
 </span>;
}
function Rune({id,mode='icon',active=false,wrong=false,visited=false,disabled=false,onClick}:{
 id:string;mode?:'icon'|'en'|'tr';active?:boolean;wrong?:boolean;
 visited?:boolean;disabled?:boolean;onClick?:()=>void
}){
 const word=templeWord(id);
 return <button type="button" onClick={onClick} disabled={disabled} aria-pressed={active||visited}
   data-result={active?'correct':wrong?'wrong':undefined}
   aria-label={mode==='en'?word.en:mode==='tr'?word.tr:word.tr+' görseli'}
   className={`tp-rune tp6-rune tp-rune-${word.domain} ${active?'tp-rune-lit':''} ${visited?'tp-rune-seen':''}`}>
   {mode==='icon'?<RuneArt id={id}/>:<span className="tp-rune-text tp6-rune-text" lang={mode==='en'?'en':undefined}>{mode==='en'?word.en:word.tr}</span>}
   {(active||visited)&&<span className="tp-rune-check" aria-hidden="true">✓</span>}
   {wrong&&<span className="tp6-wrong-mark" aria-hidden="true">×</span>}
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
 const questionPrompt=useQuestionFocus<HTMLDivElement>(`${stage}:${question}`);
 const [chosenTokens,setChosenTokens]=useState<number[]>([]);
 const [selected,setSelected]=useState<string|null>(null);
 const [wrongIds,setWrongIds]=useState<string[]>([]);
 const [correct,setCorrect]=useState(false);
 const [finished,setFinished]=useState(false);
 // Same rule for the end-of-mission panel: the last answer is gone with it.
 const doneHeading=useQuestionFocus<HTMLHeadingElement>(finished?'done':'play');
 const [busy,setBusy]=useState(false);
 const [saveError,setSaveError]=useState('');
 const [hint,setHint]=useState(false);
 const [heard,setHeard]=useState(false);
 const [speaking,setSpeaking]=useState(false);
 const [notice,setNotice]=useState<Feedback|null>(null);
 const [muted,setMuted]=useState(()=>soundService.getMuted());
 const started=useRef(Date.now()),locked=useRef(false),run=useRef(0);
 const visitedRef=useRef<Set<string>>(new Set());
 const wrongRef=useRef<Set<string>>(new Set());
 const answerLock=useRef(false);
 const tokensRef=useRef<number[]>([]);
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
  soundService.cancelSpeech();
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
 useEffect(()=>()=>{run.current++;soundService.cancelSpeech()},[]);
 useEffect(()=>{
  scrollRef.current?.scrollTo({top:0,behavior:'instant'});
  setHeard(false);setSpeaking(false);
 },[chamber,stage,question,revision]);
 // Echo rounds play their English word as soon as a question opens, as
 // Hayvan Çayırı does; the big button replays it. Without a device voice the
 // same call opens the written help at once.
 useEffect(()=>{
  if(stage!==3||!task||muted||correct||busy||finished)return;
  const timer=window.setTimeout(()=>{soundService.unlockAudio();speak(task.audio,true);},450);
  return()=>window.clearTimeout(timer);
 },[chamber,stage,question,revision,task?.audio,muted,correct,busy,finished]);
 function speak(text:string,requireFullAudio=false){
  stopAudio();
  if(muted||!soundService.hasEnglishSpeech()){
   if(requireFullAudio){setHint(true);setNotice({good:false,text:'Ses kullanılamıyor',detail:'Yazılı destekle devam edebilirsin.'});}
   return;
  }
  const token=run.current;
  const started=soundService.speakEnglish(text,{
   rate:0.79,pitch:1.04,
   onStart:()=>{if(token===run.current)setSpeaking(true);},
   onEnd:()=>{if(token===run.current){setSpeaking(false);if(requireFullAudio)setHeard(true);}},
   onError:()=>{if(token===run.current){setSpeaking(false);if(requireFullAudio){
     setHeard(false);setHint(true);setNotice({good:false,text:'Ses oynatılamadı',detail:'Yazılı yardım açıldı.'});
   }}}
  });
  if(!started&&requireFullAudio){setHint(true);setNotice({good:false,text:'Ses açılamadı',detail:'Yazılı yardım açık.'});}

 }
 function enter(nextChamber:TempleChamber,nextStage:TempleStage){
  if(busy)return;
  stopAudio();locked.current=false;answerLock.current=false;visitedRef.current.clear();wrongRef.current.clear();tokensRef.current=[];
  session.current=idFor(profileId,nextChamber,nextStage);
  started.current=Date.now();
  setChamber(nextChamber);setStage(nextStage);setRevision(n=>n+1);
  setPlan(null);setLoadedKey('');setLoadError(false);
  setVisited([]);setAnswers([]);setMistakes(0);setRoundMistakes(0);
  setQuestion(0);setChosenTokens([]);setSelected(null);setWrongIds([]);setCorrect(false);
  setFinished(false);setBusy(false);setSaveError('');setHint(false);setHeard(false);setNotice(null);
 }
 function record(id:string,kind:TempleAnswerEvidence['kind'],wrong:number,assisted:boolean):TempleAnswerEvidence{
  return {wordId:id,sourceDomain:templeWord(id).domain,kind,mistakes:wrong,
   firstTryCorrect:wrong===0&&!assisted,hintUsed:assisted,timestamp:new Date().toISOString()};
 }
 function discover(id:string){
  if(!current||stage!==1||busy||finished)return;
  speak(templeWord(id).en);
  setNotice({good:true,text:upper(templeWord(id).en),lang:'en',detail:templeWord(id).tr});
  if(visitedRef.current.has(id))return;
  visitedRef.current.add(id);
  setVisited(v=>[...v,id]);
  setAnswers(v=>[...v,record(id,'discovery',0,false)]);
 }
 function markCorrect(id:string,kind:TempleAnswerEvidence['kind']){
  if(!current||!task||correct||busy||locked.current||answerLock.current)return;
  answerLock.current=true;
  setAnswers(v=>[...v,record(id,kind,roundMistakes,hint||(stage===3&&!heard))]);
  setSelected(id);setCorrect(true);
  soundService.playSfx('correct',0.75);
  setNotice(stage===4&&task.sentenceAnswer?{good:true,text:'✓ '+task.sentenceAnswer.join(' '),lang:'en',detail:templeWord(id).tr}:
   {good:true,text:`✓ ${upper(templeWord(id).en)}!`,lang:'en',detail:`${templeWord(id).tr} · Doğru!`});
  if(stage===4&&task.sentenceAnswer)speak(task.sentenceAnswer.join(' '));
  else if(stage!==3)speak(templeWord(id).en);
 }
 function wrongDetail(id:string):string{
  const w=templeWord(id);
  if(stage===2)return `${upper(w.en)} = ${w.tr}. Resme yeniden bak.`;
  if(stage===5&&task&&question%2===0&&pairQuestions[1]?.target===id)return `${upper(w.en)} ikinci mühür. Önce FIRST kelimesini bul!`;
  return `Bu: ${w.tr} (${upper(w.en)}). ${stage===5?'Şifredeki kelimeye yeniden bak.':'Yeniden dinle.'}`;
 }
 function pick(id:string){
  if(!task||!current||finished||correct||busy||locked.current||answerLock.current||wrongRef.current.has(id))return;
  if(stage===3&&!heard&&!hint)return;
  if(id!==task.target){
   wrongRef.current.add(id);setWrongIds([...wrongRef.current]);
   setMistakes(v=>v+1);setRoundMistakes(v=>v+1);
   soundService.playSfx('gentle_retry',0.65);
   setNotice({good:false,text:'Bir daha dene! ✨',detail:wrongDetail(id)});
   return;
  }
  markCorrect(id,stage===2?'recognition':stage===3?'listening':'sequence');
 }
 function chooseToken(index:number){
  if(stage!==4||!task?.sentenceTokens||!task.sentenceAnswer||correct||busy||answerLock.current||tokensRef.current.includes(index))return;
  const next=[...tokensRef.current,index];tokensRef.current=next;
  if(next.length<task.sentenceAnswer.length){setChosenTokens(next);return;}
  if(next.every((v,i)=>task.sentenceTokens?.[v]===task.sentenceAnswer?.[i])){
   setChosenTokens(next);markCorrect(task.target,'sentence');
  }else{
   // Keep the correct beginning and say how much of it was right.
   const firstWrong=next.findIndex((v,i)=>task.sentenceTokens?.[v]!==task.sentenceAnswer?.[i]);
   const kept=next.slice(0,Math.max(0,firstWrong));
   setMistakes(n=>n+1);setRoundMistakes(n=>n+1);
   tokensRef.current=kept;setChosenTokens(kept);soundService.playSfx('gentle_retry',0.65);
   setNotice({good:false,text:'Sıra henüz doğru değil',detail:kept.length?`İlk ${kept.length} kelime doğru; gerisini yeniden sırala.`:
    'İngilizce cümle büyük harfle başlar, noktayla biter.'});
  }
 }
 async function complete(result:TempleAnswerEvidence[]){
  if(locked.current||result.length<4)return;
  locked.current=true;setBusy(true);setSaveError('');
  try{
   await onSave(chamber,stage,mistakes,(Date.now()-started.current)/1000,result,session.current);
   setFinished(true);soundService.playSfx('fanfare',0.8);
   setNotice(null);
  }catch(err){
   console.error('Tapınak görevi kaydedilemedi',err);
   setSaveError('Görev kaydedilemedi. İnternet/cihaz depolamasını kontrol edip tekrar dene.');
   locked.current=false;
  }finally{setBusy(false);}
 }
 function advance(){
  if(!correct||!current||busy)return;
  if(question+1>=current.questions.length){void complete(answers);return;}
  stopAudio();answerLock.current=false;tokensRef.current=[];wrongRef.current.clear();setWrongIds([]);setQuestion(x=>x+1);setCorrect(false);setSelected(null);
  setChosenTokens([]);setHint(false);setHeard(false);setRoundMistakes(0);setNotice(null);
 }
 useAutoQuestionAdvance({ready:correct,blocked:busy||finished||Boolean(saveError)||!current,
   onAdvance:advance,delayMs:1150,speaking});
 useAutoQuestionAdvance({
  ready:stage===1&&Boolean(current?.words.length)&&
   visited.length===current?.words.length&&answers.length===current?.words.length,
  blocked:busy||finished||Boolean(saveError)||!current,
  onAdvance:()=>{void complete(answers);},delayMs:850,speaking
 });
 const canEnter=(i:number)=>i===0||progress.completedByChamber[TEMPLE_CHAMBERS[i-1].id]===5;
 // The last answer of a mission says the mission is being saved.
 const finishing=!saveError&&(stage===1?Boolean(current?.words.length)&&visited.length===current?.words.length:
  correct&&question+1===stepTotal);
 const toast=notice?{...notice,detail:notice.good&&finishing?'Mühür kaydediliyor…':notice.detail}:null;
 const stars=templeMissionStars(mistakes,answers);
 const practised=answers.filter(a=>a.kind!=='discovery');
 const aided=practised.filter(a=>a.hintUsed).length;
 // The words this mission practised, for the tap-to-hear recap.
 const recap=[...new Set((stage===1?answers:practised).map(a=>a.wordId))];
 const canHear=!muted&&soundService.hasEnglishSpeech();
 const pairQuestions=stage===5&&current?current.questions.slice(Math.floor(question/2)*2,Math.floor(question/2)*2+2):[];
 return <div className="tp-screen tp6-screen tp7-screen gg-quest-screen tp8-screen" data-chamber={chamber} data-stage={stage} role="dialog" aria-modal="true"
  aria-label="Keşif Tapınağı İngilizce final dünyası" ref={scrollRef}>
  <GameTopBar island="garden" gameExit backDisabled={busy} onBack={()=>{stopAudio();onBack()}}
   backLabel="Bölgeler" backAriaLabel="Kelime Bahçesi bölgelerine dön" crest="✨" accent="#ffd479"
   eyebrow={'Kelime Bahçesi · '+roomInfo.title} title="Keşif Tapınağı" titleAs="p"
   progress={current&&!finished?{current:stage===1?stepCount:Math.min(stepCount+1,Math.max(1,stepTotal)),total:Math.max(1,stepTotal),label:stage===1?'Keşif':'Görev'}:undefined}
   stars={{earned:Object.values(progress.starsByLevel).reduce((sum,v)=>sum+v,0),total:75}}
   tools={<>
    <GardenHelp label="Keşif Tapınağı nasıl oynanır?">
     <p><strong>{stageInfo.title}:</strong> {stageInfo.desc}</p>
     <p>Tapınak, bahçedeki bütün dünyaların kelimelerini bir araya getirir. Her salonda beş görev var; Kristal Taht büyük finaldir.</p>
    </GardenHelp>
    <button type="button" className="gf-tool tp-mute" aria-label={muted?'Sesi aç':'Sesi kapat'} aria-pressed={muted}
     onClick={()=>{const m=!muted;setMuted(m);soundService.toggleMute();if(m)stopAudio();}}>
     {muted?'🔇':'🔊'}</button>
   </>}/>
  <div className="tp-shell tp6-shell">
   <div className="tp-title sr-only"><h1>Keşif Tapınağı</h1><p>Explore · Listen · Build · Unlock</p></div>
   <GardenQuestNavigator zoneLabel="Keşif Tapınağı bölümleri" stageLabel="Bölümün beş dil görevi"
    zones={TEMPLE_CHAMBERS.map((room,i)=>({key:room.id,label:room.title,className:'tp-chamber',
     icon:<img src={`/assets/temple/temple-${room.id}-v7.webp`} alt="" loading="lazy" decoding="async" draggable={false}/>,
     note:canEnter(i)?`${progress.completedByChamber[room.id]}/5 görev`:'Kilitli',
     state:chamber===room.id?'current':!canEnter(i)?'locked':progress.completedByChamber[room.id]===5?'done':'upcoming',
     disabled:busy,onSelect:()=>enter(room.id,Math.min(5,progress.completedByChamber[room.id]+1) as TempleStage),
     ariaLabel:room.title+(canEnter(i)?` · ${progress.completedByChamber[room.id]}/5 görev`:' · kilitli')}))}
    stages={TEMPLE_STAGES.map(trial=>({key:String(trial.stage),label:trial.title,icon:trial.icon,className:'tp-trial',
     state:trial.stage===stage?'current':trial.stage>completedSteps+1?'locked':
      progress.starsByLevel[TEMPLE_OFFSETS[chamber]+trial.stage]>0?'done':'upcoming',
     disabled:busy,onSelect:()=>enter(chamber,trial.stage as TempleStage),
     ariaLabel:`${trial.stage}. ${trial.title}${trial.stage>completedSteps+1?' (henüz açılmadı)':''}`}))}/>
   <section className="tp-quest tp6-quest">
    <div className="tp-scenery tp6-scenery">
     <TempleScenery chamber={chamber} cleared={completedSteps}/>
     <LearningMotion variant={finished?'victory':'success'}
      trigger={finished?'temple-finished-'+chamber+'-'+stage:
       correct?'temple-correct-'+chamber+'-'+stage+'-'+question:null}/>
     <div className="tp-scene-label tp6-scene-label"><span>{roomInfo.icon}</span><div>
      <strong>{roomInfo.title}</strong><small lang="en">{roomInfo.subtitle}</small></div></div>
     {toast&&<p className="tp8-toast" data-good={toast.good} role="status" aria-live="polite">
      <span lang={toast.lang}>{toast.text}</span>{toast.detail&&<small>{toast.detail}</small>}
     </p>}
    </div>
    <div className="tp-workbench tp6-workbench">
     <h2 className="sr-only">{stageInfo.title}</h2>
     {loadError?<div className="tp-error" role="alert">Tapınak planı yüklenemedi.
      <button type="button" className="gf-btn gf-btn--primary" onClick={()=>enter(chamber,stage)}>Tekrar Dene</button></div>:
     !current?<p className="tp-loading" role="status">Tapınağın kristalleri hazırlanıyor…</p>:
     finished?<GameResult island="garden" className="tp-finished tp6-finished" titleRef={doneHeading}
      art={<img src={`/assets/temple/temple-${chamber}-v7.webp`} alt="" decoding="async" draggable={false}/>}
      kicker={roomInfo.title+' · '+stageInfo.title}
      title={chamber==='crown'&&stage===5?'The English Temple is yours!':'Crystal unlocked!'} titleLang="en"
      stars={{earned:stars}}
      message={<span className="tp6-performance">{stage===1?`${answers.length} kelimenin İngilizcesini dinledin`:
       `${practised.length} doğru · ${mistakes} yanlış deneme${aided?` · ${aided} destekli`:''}`}</span>}
      actions={<>
       <button type="button" className="tp-primary gf-btn gf-btn--primary" onClick={()=>{
        if(stage<5)enter(chamber,(stage+1) as TempleStage);
        else if(chamber!=='crown')enter(TEMPLE_CHAMBERS[TEMPLE_CHAMBERS.findIndex(w=>w.id===chamber)+1].id,1);
        else onBack();
       }}>{stage<5?'Sonraki Görev →':chamber==='crown'?'Bahçeye Dön':'Yeni Salonu Aç →'}</button>
       <button type="button" className="tp-secondary gf-btn gf-btn--secondary" onClick={()=>enter(chamber,stage)}>↻ Tekrar Oyna</button>
      </>}>
      {recap.length>0&&<div className="tp8-recap" role="group" aria-label="Bu görevin İngilizce kelimeleri">
       <p className="tp8-recap-title">Bu görevin kelimeleri · {stage===4?'dokun, cümleyi dinle':'dokun ve dinle'}</p>
       <div className="tp8-recap-list">{recap.map(id=><button key={id} type="button" className="tp8-recap-word"
         onClick={()=>speak(stage===4?sentenceFor(templeWord(id)).join(' '):templeWord(id).en)} disabled={!canHear}
         aria-label={`${templeWord(id).tr}, İngilizce ${templeWord(id).en}, dinle`}>
         <RuneArt id={id}/><span lang="en">{templeWord(id).en}</span></button>)}</div>
      </div>}
      {chamber==='crown'&&stage===5&&<GameFinale title="Keşif Tapınağı tamamlandı!"
       detail="Beş salonun 25 görevinin hepsini bitirdin. İngilizce maceranın büyük finali senin!"/>}
     </GameResult>:<div className="tp-play tp6-play">
      {stage===1?<><div className="tp-command tp6-command"><span>🗺️</span><div>
        <strong>Keşfet ve Dinle!</strong><small>Her rüne dokun, İngilizcesini dinle.</small>
       </div></div>
       <div className="tp-grid tp-discovery tp6-discovery">
        {current.words.map(id=><div key={id} className="tp-discovery-cell tp6-discovery-cell">
         <Rune id={id} visited={visited.includes(id)} disabled={busy} onClick={()=>discover(id)}/>
         {visited.includes(id)&&<div className="tp-reveal"><strong lang="en">{templeWord(id).en}</strong>
          <small>{templeWord(id).tr}</small></div>}
        </div>)}
       </div>
      </>:task?<><div ref={questionPrompt} tabIndex={-1} className="tp-command tp6-command"><span>{stageInfo.icon}</span><div>
       {stage===2?<><strong>Gizemli Kelimeyi Bul!</strong>
        <small>Türkçe: <b>{task.prompt}</b> — İngilizce kelimeyi seç.</small></>:
       stage===3?<><strong>Yankı Kristalini Dinle!</strong>
        <small>Ses tamamlanınca görseli veya aile ilişkisini seç.</small></>:
       stage===4?<><strong>İngilizce Cümle Köprüsü</strong>
        <small>Bu ifadeyi İngilizce bir cümle olarak sırala: <b>{templeWord(task.target).tr}</b></small></>:
       <><strong>Mühür Kapısı · {Math.floor(question/2)+1}/3</strong>
        <small>İki İngilizce kelimeyi sırayla anla:</small>
        <strong className="tp-code tp6-code" lang="en">{pairQuestions.map((q,i)=>
          `${i===0?'FIRST':'THEN'}: ${templeWord(q.target).en.toUpperCase()}`).join(' · ')}</strong>
        <small>Şimdi {question%2===0?'FIRST · birinci':'THEN · ikinci'} mühür için doğru anlamı veya görseli bul.</small></>}
       </div></div>
       {stage===2&&<div className="tp6-featured" role="img" aria-label={`Kavram: ${templeWord(task.target).tr}`}>
         <Rune id={task.target} disabled/>
         <span>{templeWord(task.target).tr}</span>
        </div>}
       {/* Listening rounds show no picture (it would give the answer away):
           an echo crystal that rings while the English plays fills its place. */}
       {stage===3&&<div className="tp6-featured tp9-echo" aria-hidden="true" data-speaking={speaking||undefined}>
         <span className="tp9-echo-orb"><span className="tp9-echo-gem"/><i/><i/><i/></span>
         <span>{speaking?'Yankı çalıyor…':'Yankı Kristali'}</span>
        </div>}
       {stage===3&&<div className="tp-listen-panel tp6-listen-panel">
        <button type="button" className="tp-listen gf-btn gf-btn--tool" disabled={busy||correct} onClick={()=>speak(task.audio,true)}>
         {speaking?'🔉 Listening…':'▶ Listen in English'}</button>
        <button type="button" className="tp-help gf-btn gf-btn--tool" disabled={busy||correct} onClick={()=>{setHint(true);setNotice({good:true,text:'Yazılı yardım açık',detail:'Bu cevap destekli sayılır.'});}}>
         Yazılı yardım</button>
        {hint&&<p>English: <strong lang="en">{templeWord(task.target).en}</strong></p>}
        {!heard&&!hint&&<p className="tp8-listen-status">Önce dinle: kristaller sesi duyduktan sonra açılır.</p>}
       </div>}
       {stage!==3&&<div className="tp-controls tp6-controls">
        <button type="button" className="tp-help gf-btn gf-btn--tool" disabled={busy||correct} onClick={()=>{setHint(true);setNotice({good:true,text:'💡 İpucu açık',detail:'Bu cevap destekli sayılır.'});}}>💡 İpucu</button>
        <button type="button" className="tp-help gf-btn gf-btn--tool" disabled={busy||correct} onClick={()=>{setHint(true);speak(task.audio);}}>🔊 İngilizceyi Duy</button>
        {hint&&<span className="tp8-hint-text">İpucu: {stage===4?task.sentenceAnswer?.join(' '):
         // Stage 5 already prints the English words; the help is their meaning.
         stage===5?'Anlamı: '+templeWord(task.target).tr:templeWord(task.target).en}</span>}
       </div>}
       {stage===4?<div className="tp-sentence tp6-sentence">
        <div className="tp-sentence-line" role="group" aria-label="Oluşturulan İngilizce cümle" lang="en">
         {chosenTokens.length===0?<em>İngilizce kelimelere sırayla dokun…</em>:
          chosenTokens.map((index,i)=><span key={index} className="tp-sentence-token">{task.sentenceTokens?.[index]}</span>)}
        </div>
        <div className="tp-token-options" role="group" aria-label="Cümle kelimeleri" lang="en">
         {task.sentenceTokens?.map((word,i)=><button key={i} type="button"
           onClick={()=>chooseToken(i)} disabled={chosenTokens.includes(i)||correct||busy}
           className="tp-word-token">{word}</button>)}
        </div>
        {!correct&&chosenTokens.length>0&&<button type="button" className="tp-secondary gf-btn gf-btn--secondary"
          onClick={()=>{tokensRef.current=[];setChosenTokens([]);}}>↺ Baştan Dene</button>}
       </div>:
       <div className={`tp-grid ${stage===5?'tp-seal-grid':''}`} role="group" aria-label="İngilizce büyülü seçenekler">
        {(stage===5?current.words:task.options).map(id=><Rune key={id} id={id}
         mode={stage===2?'en':needsRelationshipText(id)?'tr':'icon'} active={selected===id}
         wrong={wrongIds.includes(id)}
         disabled={busy||correct||wrongIds.includes(id)||(stage===3&&!heard&&!hint)}
         onClick={()=>pick(id)}/>)}
       </div>}
       {stage===5&&<div className="tp-collected" role="status">
        <span>🔐</span><strong>Toplanan mühürler</strong>
        <span className="tp6-collected-chips">{answers.filter(x=>x.kind==='sequence').length===0?
         'Henüz mühür yok':answers.filter(x=>x.kind==='sequence').map((e,i)=>
          <b className="tp6-collected-chip" key={i} lang="en">{templeWord(e.wordId).en}</b>)}</span>
       </div>}
      </>:<div className="tp-error">Soru yüklenemedi. <button onClick={()=>enter(chamber,stage)}>Yenile</button></div>}
      {saveError&&<div role="alert" className="tp-error">{saveError}
       <button onClick={()=>void complete(answers)}>Kaydı Tekrar Dene</button></div>}
     </div>}
    </div>
   </section>
  </div>
 </div>;
}
