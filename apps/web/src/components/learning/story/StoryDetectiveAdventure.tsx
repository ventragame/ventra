'use client';

import React,{useEffect,useRef,useState} from 'react';
import type {ForestEpisode,ForestPlacement,ForestScene} from '@/lib/learning/storyForestEngine';
import {FOREST_ACTOR_NAMES} from '@/lib/learning/storyForestEngine';
import {
 DETECTIVE_CHAPTERS,DETECTIVE_CLUES,DETECTIVE_SCENE_LABELS,
 detectiveStars,type DetectiveRecord,type DetectiveClueId,type DetectiveItemId
} from '@/lib/learning/storyDetectiveEngine';
import {
 planDetectiveAdventure,detectiveAdventurePrompt,detectiveAdventureNarration,
 sceneForDetectiveStep,DETECTIVE_THEME_NAMES,
 type DetectiveAdventurePlan,type DetectiveAdventureStep,
 type DetectiveStepAnswer,type DetectiveStoryPhase
} from '@/lib/learning/storyDetectiveAdventureEngine';
import {
 getDetectiveProgress,saveDetectiveCase,type DetectiveProgress
} from '@/lib/progress/storyDetectiveProgress';
import {getProgressRepository} from '@/lib/progress';
import {soundService} from '@/lib/audio/SoundService';
import {StoryForestActor,StoryForestScenery} from './StoryForestArt';
import {DetectiveClueArt,DetectiveLostItem} from './StoryDetectiveArt';
import './story-detective.css';
import './story-detective-adventure.css';

interface Props{
 profileId:string;gradeLevel:number|null;englishLevel:ForestPlacement;
 onBack:()=>void;onSaved:()=>void;
}
type View='chapters'|'playing'|'reward';
const EMPTY:DetectiveProgress={
 completedLevels:0,totalLevels:6,starsByLevel:{},playCountByLevel:{}
};
const OBJECT_NAMES:Record<DetectiveItemId,string>={
 apple:'Elma',balloon:'Balon',star:'Yıldız',book:'Kitap',flower:'Çiçek'
};
/** Preserve natural voice prosody even for the youngest children. */
export function detectiveVoiceRate(level:ForestPlacement,grade:number|null):number{
 const base=level==='Pre-A1'?.89:level==='A1'?.94:.98;
 return Math.max(.86,Math.min(1,base+(grade!==null&&grade<=2?-.025:grade!==null&&grade>=6?.012:0)));
}
function getStartCount(profileId:string,episode:ForestEpisode,completedCount:number):number{
 // Profile and chapter scoped to prevent rerunning the same opening if a child
 // leaves midway through an investigation. Works offline; no private story text.
 if(typeof window==='undefined')return completedCount;
 try{
  const key='ventra:detective:v2:last-start:'+profileId+':'+episode;
  const raw=window.localStorage.getItem(key);
  const previous=raw===null?-1:Number(raw);
  const next=Math.max(completedCount,Number.isSafeInteger(previous)?previous+1:completedCount);
  window.localStorage.setItem(key,String(next));
  return next;
 }catch{return completedCount;}
}
function ChoiceArt({value,kind}:{
 value:string;kind:DetectiveAdventureStep['kind']
}){
 if(kind==='sequence'||kind==='evidence'){
  const separator=kind==='sequence'?'>':'+';
  const ids=value.split(separator);
  if(ids.length!==2)return null;
  return <div className="sd-evidence-pair" aria-hidden="true">
   <span><DetectiveClueArt id={ids[0] as DetectiveClueId}/></span>
   <b>{kind==='sequence'?'→':'+'}</b>
   <span><DetectiveClueArt id={ids[1] as DetectiveClueId}/></span>
  </div>;
 }
 if(kind==='friend')return <StoryForestActor id={value as import('@/lib/learning/storyForestEngine').ForestActorId}/>;
 if(kind==='recover')return <DetectiveLostItem id={value as DetectiveItemId}/>;
 if(kind==='destination'||kind==='crossroads')
  return <StoryForestScenery scene={value as ForestScene}/>;
 return <DetectiveClueArt id={value as DetectiveClueId}/>;
}
function choiceName(value:string,kind:DetectiveAdventureStep['kind']):string{
 if(kind==='sequence'||kind==='evidence'){
  const ids=value.split(kind==='sequence'?'>':'+');
  return ids.map(id=>DETECTIVE_CLUES[id as DetectiveClueId]?.tr??id)
   .join(kind==='sequence'?' ardından ':' ve ');
 }
 if(kind==='friend')return FOREST_ACTOR_NAMES[value as keyof typeof FOREST_ACTOR_NAMES]??value;
 if(kind==='recover')return OBJECT_NAMES[value as DetectiveItemId]??value;
 if(kind==='destination'||kind==='crossroads')
  return DETECTIVE_SCENE_LABELS[value as ForestScene]??value;
 return DETECTIVE_CLUES[value as DetectiveClueId]?.tr??value;
}
export function StoryDetectiveAdventure({profileId,gradeLevel,englishLevel,onBack,onSaved}:Props){
 const [view,setView]=useState<View>('chapters');
 const [progress,setProgress]=useState<DetectiveProgress>(EMPTY);
 const [loading,setLoading]=useState(true);
 const [loadError,setLoadError]=useState('');
 const [plan,setPlan]=useState<DetectiveAdventurePlan|null>(null);
 const [phase,setPhase]=useState<DetectiveStoryPhase>('opening');
 const [stepIndex,setStepIndex]=useState(0);
 const [route,setRoute]=useState<ForestScene|null>(null);
 const [answers,setAnswers]=useState<DetectiveStepAnswer[]>([]);
 const [picked,setPicked]=useState<DetectiveClueId[]>([]);
 const [mistakes,setMistakes]=useState(0);
 const [hintUsed,setHintUsed]=useState(false);
 const [wrong,setWrong]=useState<string|null>(null);
 const [correct,setCorrect]=useState(false);
 const [caption,setCaption]=useState(false);
 const [voiceUnavailable,setVoiceUnavailable]=useState(false);
 const [busy,setBusy]=useState(false);
 const [saveError,setSaveError]=useState('');
 const [stars,setStars]=useState(0);
 const [speechOn,setSpeechOn]=useState(false);
 const alive=useRef(true);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const generation=useRef(0);
 const phaseRef=useRef<DetectiveStoryPhase>('opening');
 const locked=useRef(false);
 const saving=useRef(false);
 const completed=useRef<DetectiveRecord|null>(null);
 const sessionId=useRef('');
 const startedAt=useRef(0);

 const step=plan?.steps[stepIndex]??null;
 const currentScene:ForestScene|undefined=plan?
  phase==='opening'?plan.startScene:
  phase==='ending'?plan.chosen.destination:
  step?sceneForDetectiveStep(plan,step,route??undefined):
   plan.chosen.chapter.start:undefined;
 const choicesArePlaces=step?.kind==='crossroads'||step?.kind==='destination';
 const isMemory=step?.kind==='memory';
 const showFriend=phase==='ending'||(phase==='step'&&step?.kind!=='friend'&&answers.length>0);
 const showTreasure=phase==='ending';
 const visualCount=plan?.steps.length??7;
 const position=phase==='opening'?0:phase==='ending'?visualCount+1:stepIndex+1;
 const phrase=plan?
  phase==='step'&&step?detectiveAdventurePrompt(plan,step,route??undefined):
  detectiveAdventureNarration(plan,phase==='ending'?'ending':'opening',route??undefined):'';
 function clearTimer(){
  if(timer.current!==null){clearTimeout(timer.current);timer.current=null;}
 }
 function stopNarration(){
  generation.current++;clearTimer();soundService.cancelSpeech();setSpeechOn(false);
 }
 useEffect(()=>{
  alive.current=true;let active=true;setLoading(true);setLoadError('');
  getDetectiveProgress(getProgressRepository(),profileId)
   .then(next=>{if(active){setProgress(next);setLoading(false);}})
   .catch(error=>{
    console.error('[StoryDetective] failed to load chapters',error);
    if(active){setLoadError('Macera ilerlemesi okunamadı.');setLoading(false);}
   });
  return()=>{active=false;alive.current=false;generation.current++;
   if(timer.current!==null)clearTimeout(timer.current);
   soundService.cancelSpeech();};
 },[profileId]);

 async function finish(currentPlan:DetectiveAdventurePlan,record:DetectiveRecord){
  if(saving.current)return;
  saving.current=true;setBusy(true);setSaveError('');
  try{
   const next=await saveDetectiveCase({
    repo:getProgressRepository(),profileId,
    episode:currentPlan.chosen.chapter.episode,plan:currentPlan,
    record,sessionId:sessionId.current,
    durationSeconds:(Date.now()-startedAt.current)/1000
   });
   if(!alive.current)return;
   setProgress(next);setStars(detectiveStars(record));
   setView('reward');soundService.playSfx('fanfare',.75);onSaved();
  }catch(error){
   console.error('[StoryDetective] save',error);
   if(alive.current)setSaveError('Kayıt yapılamadı. Yeniden kaydet.');
  }finally{
   saving.current=false;
   if(alive.current)setBusy(false);
  }
 }
 function speak(currentPlan:DetectiveAdventurePlan,currentPhase:DetectiveStoryPhase,
  currentStep?:DetectiveAdventureStep,currentRoute?:ForestScene){
  stopNarration();setVoiceUnavailable(false);setSpeechOn(true);
  const token=generation.current;
  const spoken=currentPhase==='step'&&currentStep?
   detectiveAdventurePrompt(currentPlan,currentStep,currentRoute):
   detectiveAdventureNarration(currentPlan,currentPhase==='ending'?'ending':'opening',currentRoute);
  soundService.unlockAudio();
  const started=soundService.speakEnglish(spoken,{
   rate:detectiveVoiceRate(englishLevel,gradeLevel),
   onEnd:()=>{
    if(!alive.current||token!==generation.current||
     phaseRef.current!==currentPhase)return;
    setSpeechOn(false);
    if(currentPhase==='opening'||currentPhase==='ending'){
     timer.current=setTimeout(()=>{
      timer.current=null;
      if(!alive.current||token!==generation.current||
       phaseRef.current!==currentPhase)return;
      if(currentPhase==='opening')enterStep(currentPlan,0,currentRoute);
      else if(completed.current)void finish(currentPlan,completed.current);
     },currentPhase==='opening'?1050:1600);
    }
   },
   onError:()=>{
    if(alive.current&&token===generation.current){
     setVoiceUnavailable(true);setCaption(true);setSpeechOn(false);
    }
   }
  });
  if(!started){setVoiceUnavailable(true);setCaption(true);setSpeechOn(false);}
 }
 function enterStep(currentPlan:DetectiveAdventurePlan,index:number,
  currentRoute?:ForestScene){
  locked.current=false;phaseRef.current='step';setPhase('step');
  setStepIndex(index);setMistakes(0);setHintUsed(false);
  setWrong(null);setCorrect(false);setCaption(false);
  speak(currentPlan,'step',currentPlan.steps[index],currentRoute);
 }
 function start(episode:ForestEpisode){
  if(loading||loadError||busy||saving.current||
   episode>progress.completedLevels+1)return;
  stopNarration();locked.current=false;
  const playCount=getStartCount(profileId,episode,progress.playCountByLevel[episode]??0);
  const seed=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;
  const next=planDetectiveAdventure({
   episode,englishLevel,gradeLevel,seed,playCount
  });
  sessionId.current='detective-v2:'+profileId+':'+episode+':'+Date.now()+':'+seed;
  startedAt.current=Date.now();completed.current=null;
  setPlan(next);setView('playing');setPhase('opening');
  phaseRef.current='opening';setStepIndex(0);setRoute(null);
  setAnswers([]);setPicked([]);setMistakes(0);
  setHintUsed(false);setWrong(null);setCorrect(false);
  setCaption(false);setSaveError('');setStars(0);
  soundService.unlockAudio();soundService.playSfx('whoosh',.5);
  speak(next,'opening');
 }
 function back(){
  if(saving.current)return;
  stopNarration();locked.current=false;
  if(view==='chapters'){onBack();return;}
  setView('chapters');setPlan(null);setSaveError('');
 }
 function replayNarration(){
  if(!plan||busy||locked.current)return;
  speak(plan,phase,phase==='step'?step??undefined:undefined,route??undefined);
 }
 function collectRecord(currentPlan:DetectiveAdventurePlan,
  completedAnswers:DetectiveStepAnswer[]):DetectiveRecord{
  const clueAnswers=currentPlan.steps.filter(s=>s.kind==='clue').map(s=>{
   const a=completedAnswers.find(x=>x.stepId===s.id);
   if(!a)throw Error('Clue evidence missing');
   return {clueId:s.target as DetectiveClueId,mistakes:a.mistakes,
    hintUsed:a.hintUsed,firstTryCorrect:a.firstTryCorrect};
  });
  const destinationStep=currentPlan.steps.find(s=>s.kind==='destination');
  const destinationAnswer=completedAnswers.find(a=>a.stepId===destinationStep?.id);
  if(!destinationAnswer)throw Error('Destination evidence missing');
  return {
   caseId:currentPlan.chosen.id,episode:currentPlan.chosen.chapter.episode,
   destination:currentPlan.chosen.destination,placement:englishLevel,
   clues:clueAnswers,destinationMistakes:destinationAnswer.mistakes,
   destinationHint:destinationAnswer.hintUsed,
   storyId:currentPlan.storyId,stepEvidence:completedAnswers,
   completedAt:new Date().toISOString()
  };
 }
 function answerChoice(id:string){
  if(!plan||!step||view!=='playing'||phaseRef.current!=='step'||
    busy||locked.current)return;
  if(!step.choices.includes(id))return;
  if(!step.acceptedIds.includes(id)){
   setMistakes(n=>n+1);setWrong(id);
   soundService.playSfx('gentle_retry',.6);
   return;
  }
  locked.current=true;stopNarration();setWrong(null);setCorrect(true);
  soundService.playSfx('correct',.75);
  const answer:DetectiveStepAnswer={
   stepId:step.id,selectedId:id,mistakes,hintUsed,
   firstTryCorrect:mistakes===0&&!hintUsed
  };
  const nextAnswers=[...answers,answer];
  const selectedRoute=step.kind==='crossroads'?id as ForestScene:route;
  if(step.kind==='crossroads')setRoute(id as ForestScene);
  if(step.kind==='clue')setPicked(current=>[...current,id as DetectiveClueId]);
  setAnswers(nextAnswers);
  timer.current=setTimeout(()=>{
   timer.current=null;if(!alive.current)return;
   if(stepIndex+1<plan.steps.length){
    enterStep(plan,stepIndex+1,selectedRoute??undefined);
    return;
   }
   const record=collectRecord(plan,nextAnswers);
   completed.current=record;
   locked.current=false;phaseRef.current='ending';setPhase('ending');
   setCaption(false);setCorrect(false);
   speak(plan,'ending',undefined,selectedRoute??undefined);
  },750);
 }
 function tapClue(id:string){answerChoice(id);}
 function chooseDestination(id:string){answerChoice(id);}
 function hint(){
  if(!step||phaseRef.current!=='step'||busy||locked.current||
   step.kind==='crossroads')return;
  setHintUsed(true);soundService.playSfx('tap',.4);
 }
 function nextPassive(){
  if(!plan||busy)return;
  stopNarration();
  if(phase==='opening')enterStep(plan,0);
  else if(phase==='ending'&&completed.current)void finish(plan,completed.current);
 }
 const chapter=plan?.chosen.chapter;
 const isStep=phase==='step'&&!!step;
 return <div className="sd-root sd-adventure-root" role="dialog" aria-modal="true"
  aria-label="Hikâye Dedektifi">
  <header className="sd-header">
   <button type="button" className="sd-back" onClick={back} disabled={busy}
    aria-label={view==='chapters'?"Hikâye Ormanı'na dön":'Bölümlere dön'}>←</button>
   <strong>{view==='chapters'?'🔍 Hikâye Dedektifi':chapter?.title??'Hikâye Dedektifi'}</strong>
   <div className="sd-header-right">
    {view==='playing'&&<div className="sd-steps sd-adventure-pips"
      aria-label={'Macera adımı '+(position+1)+' / '+(visualCount+2)}>
      {Array.from({length:visualCount+2},(_,i)=>
       <i key={i} className={i<position?'done':i===position?'active':''}/>)}
     </div>}
    <span className="sd-count">{view==='chapters'?
     '★ '+progress.completedLevels+'/6':view==='reward'?'★ '+stars:
      '✦ '+(position+1)+'/'+(visualCount+2)}</span>
   </div>
  </header>

  {view==='chapters'&&<main className="sd-chapters">
   <section className="sd-cover">
    <StoryForestScenery scene="path"/>
    <div className="sd-cover-shade"/>
    <div className="sd-cover-character"><StoryForestActor id="rabbit"/></div>
    <div className="sd-cover-text"><span>HİKÂYE ORMANI · OYUN 03</span>
     <h1>Hikâye Dedektifi</h1><p>Dinle · İz Sür · Keşfet</p>
    </div>
    <div className="sd-cover-glass" aria-hidden="true">⌕</div>
   </section>
   {loading&&<p className="sd-status" role="status">Macera dünyaları açılıyor…</p>}
   {loadError&&<p className="sd-status" role="alert">{loadError}</p>}
   {!loading&&!loadError&&<>
    <div className="sd-available">🔍 6 bölüm · Her seferinde yeni bir macera yolu</div>
    <section className="sd-chapter-grid" aria-label="Dedektif bölümleri">
     {DETECTIVE_CHAPTERS.map(ch=>{
      const open=ch.episode<=progress.completedLevels+1;
      const best=progress.starsByLevel[ch.episode]??0;
      return <button type="button" key={ch.episode} disabled={!open}
       onClick={()=>start(ch.episode)} className="sd-chapter"
       aria-label={ch.title+(open?'':' kilitli')}>
       <div className="sd-chapter-image">
        <StoryForestScenery scene={ch.start}/>
        <div className="sd-chapter-mascot"><StoryForestActor id={ch.hero}/></div>
        {!open&&<span className="sd-chapter-lock">🔒</span>}
       </div>
       <div className="sd-chapter-bottom">
        <span><b>{String(ch.episode).padStart(2,'0')}</b> {ch.title}</span>
        <small>{best?'★'.repeat(best):open?'▶ Oyna':'Kilitli'}</small>
       </div>
      </button>;
     })}
    </section>
   </>}
  </main>}

  {view==='playing'&&plan&&chapter&&currentScene&&<main className="sd-playing sd-adventure-playing">
   <div className={'sd-world sd-adventure-world sd-world-'+phase+
     ' sd-palette-'+plan.palette}>
    <StoryForestScenery scene={currentScene}/>
    <div className="sd-world-vignette"/>
    <div className="sd-world-hero"><StoryForestActor id={plan.setup.hero}/></div>
    {showFriend&&<div className="sd-world-friend">
     <StoryForestActor id={plan.setup.friend}/></div>}
    {showTreasure&&<div className="sd-world-treasure">
     <DetectiveLostItem id={plan.setup.item}/></div>}
    {phase==='opening'&&<div className="sd-lost-bubble" aria-hidden="true">
     <span>?</span><div><DetectiveLostItem id={plan.setup.item}/></div>
    </div>}
    {isStep&&step.kind==='clue'&&<div className="sd-story-floating-clue" aria-hidden="true">
     {correct?<DetectiveClueArt id={step.target as DetectiveClueId}/>:
      <span className="sd-unknown-clue">?</span>}</div>}
    {isStep&&step.kind==='memory'&&<div className="sd-story-memory" aria-hidden="true">?</div>}
    {isStep&&step.kind==='crossroads'&&<div className="sd-story-crossroads" aria-hidden="true">
     ✦　↗　✦</div>}
    {phase==='ending'&&<div className="sd-world-confetti" aria-hidden="true">✦ ✦ ✧</div>}
    <div className="sd-world-corner" aria-hidden="true">🔍</div>
    <div className="sd-story-scene-tag">
     {DETECTIVE_SCENE_LABELS[currentScene]}
    </div>
   </div>

   <section className="sd-notebook sd-story-notebook" aria-label="Dedektif defteri">
    <div className="sd-notebook-top">
     <div className="sd-notebook-eyebrow">
      HİKÂYE ORMANI · DOSYA {String(chapter.episode).padStart(2,'0')}
     </div>
     <div className="sd-notebook-title">
      <span className="sd-notebook-icon" aria-hidden="true">
       {phase==='opening'?'📖':phase==='ending'?'🏆':
        step?.kind==='friend'?'🐾':step?.kind==='crossroads'?'🗺️':
        step?.kind==='memory'?'🧠':step?.kind==='sequence'?'⏳':
        step?.kind==='evidence'?'🔗':step?.kind==='destination'?'🧭':
        step?.kind==='recover'?'🎁':'🔎'}
      </span>
      <h2>{phase==='opening'?DETECTIVE_THEME_NAMES[plan.setup.theme]:
       phase==='ending'?'Gizemi Çözdün!':
       step?.kind==='friend'?'Arkadaşını Bul':
       step?.kind==='crossroads'?'Yolunu Seç':
       step?.kind==='memory'?'İpucunu Hatırla':
       step?.kind==='sequence'?'Önce ve Sonra':
       step?.kind==='evidence'?'İpuçlarını Birleştir':
       step?.kind==='destination'?'Gizemin Yerini Bul':
       step?.kind==='recover'?'Hazineyi Bul':'Yeni İpucu'}</h2>
     </div>
    </div>
    <div className="sd-audio">
     <button type="button" onClick={replayNarration} disabled={busy||correct}
      aria-label="İngilizce hikâyeyi tekrar dinle" className="sd-sound">🔊</button>
     <div className="sd-audio-body">
      <small>{voiceUnavailable?'SES KAPALI · METİN':
       speechOn?'DİNLE VE KEŞFET':'HAZIR · TEKRAR DİNLEYEBİLİRSİN'}</small>
      {caption||voiceUnavailable?<p lang="en">{phrase}</p>:
       <span className="sd-audio-waves" aria-hidden="true">▂ ▄ ▆ ▃ ▅ ▂</span>}
     </div>
     <button type="button" onClick={()=>setCaption(v=>!v)}
      className="sd-captions" disabled={busy}
      aria-label="İngilizce anlatımı göster veya gizle">Aa</button>
    </div>

    {phase==='opening'&&<div className="sd-intro-box sd-story-intro">
     <div className="sd-intro-stamp" aria-hidden="true"><DetectiveLostItem id={plan.setup.item}/></div>
     <div className="sd-intro-title">Yeni bir macera seni bekliyor!</div>
     <div className="sd-intro-graphic" aria-hidden="true">✦ · · ✦ · · ✦</div>
    </div>}

    {isStep&&<>
     {step.kind!=='memory'&&picked.length>0&&<div className="sd-story-trail"
      aria-label="Topladığın ipuçları">
      {picked.map(id=><div className="sd-story-trail-item" key={id}>
       <DetectiveClueArt id={id}/></div>)}
     </div>}
     <div className={'sd-story-options '+(choicesArePlaces?'sd-story-places':'sd-story-images')}
      role="group" aria-label="Macera resimli seçimleri">
      {step.choices.map(choice=><button type="button" key={choice}
       className={'sd-story-option '+(choicesArePlaces?'place ':'')+
        (wrong===choice?'wrong ':'')+
        (hintUsed&&step.acceptedIds.includes(choice)?'hint ':'')+
        (correct&&step.acceptedIds.includes(choice)?'selected':'')}
       disabled={busy||locked.current}
       aria-label={choiceName(choice,step.kind)}
       onClick={()=>step.kind==='destination'||step.kind==='crossroads'?
        chooseDestination(choice):tapClue(choice)}>
       <ChoiceArt kind={step.kind} value={choice}/>
       {choicesArePlaces&&<span className="sd-story-choice-name">
        {choiceName(choice,step.kind)}</span>}
      </button>)}
     </div>
     {step.kind==='crossroads'&&<div className="sd-story-note">
      ✦ İki yol da yeni bir macera açar
     </div>}
    </>}

    {phase==='ending'&&<div className="sd-ending-box" aria-hidden="true">
     <span>✦</span>
     <div><DetectiveLostItem id={plan.setup.item}/></div>
     <span>✦</span>
    </div>}
    <div className="sd-controls">
     <button type="button" className="sd-hint" onClick={hint}
      disabled={busy||locked.current||phase!=='step'||step?.kind==='crossroads'}
      aria-label="Doğru görseli aydınlat">💡 <span>İpucu</span></button>
     <div role="status" aria-live="polite" className="sd-feedback">
      {busy?'Kaydediliyor…':correct?'✦ Harika!':wrong?'↻ Yeniden dene':
       phase==='step'?('✦ '+answers.length+'/'+visualCount):''}
     </div>
     {(phase==='opening'||phase==='ending')&&<button type="button"
      className="sd-next" disabled={busy}
      onClick={nextPassive}
      aria-label={phase==='opening'?'Macera başlasın':'Ödül ekranına geç'}>▶</button>}
    </div>
    {busy&&<p role="status" className="sd-status">Macera kaydediliyor…</p>}
    {saveError&&<div role="alert" className="sd-error">{saveError}
     <button type="button" disabled={busy}
      onClick={()=>{if(completed.current)void finish(plan,completed.current);}}>
      Yeniden Kaydet</button></div>}
   </section>
  </main>}

  {view==='reward'&&plan&&chapter&&<main className="sd-reward">
   <div className="sd-reward-illustration">
    <StoryForestScenery scene={plan.chosen.destination}/>
    <div className="sd-reward-mascot"><StoryForestActor id={plan.setup.hero}/></div>
    <div className="sd-reward-helper"><StoryForestActor id={plan.setup.friend}/></div>
    <div className="sd-reward-item"><DetectiveLostItem id={plan.setup.item}/></div>
   </div>
   <h2>Gizem Çözüldü!</h2>
   <div className="sd-reward-stars" aria-label={stars+' yıldız'}>
    {[1,2,3].map(n=><span className={n<=stars?'earned':''} key={n}>★</span>)}
   </div>
   <div className="sd-reward-actions">
    <button type="button" className="sd-primary"
     onClick={()=>start(chapter.episode)}>↻ Başka Macera</button>
    {chapter.episode<6&&<button type="button" className="sd-primary"
     onClick={()=>start((chapter.episode+1) as ForestEpisode)}>Sonraki Bölüm →</button>}
    <button type="button" className="sd-secondary" onClick={back}>Bölümler</button>
   </div>
  </main>}
 </div>;
}
