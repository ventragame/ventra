'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import {useQuestionFocus} from './useQuestionFocus';
import type {FamilyAnswerEvidence} from '@ventra/shared';
import {getProgressRepository} from '@/lib/progress';
import type {EnglishPlacement} from '@/lib/learning/gradeAwareLearningPolicy';
import {soundService} from '@/lib/audio/SoundService';
import {useAutoQuestionAdvance} from '@/lib/learning/useAutoQuestionAdvance';
import {VILLAGE_DISTRICTS,VILLAGE_STAGES,VILLAGE_OFFSETS,
 villageWord,villageMissionStars,villageResumePoint,planVillageMission,type VillageDistrict,type VillageStage,type VillagePlan
} from '@/lib/learning/familyVillageEngine';
import type {FamilyVillageProgress} from '@/lib/progress/familyVillageProgress';
import {FamilyVillageScenery} from './FamilyVillageScenery';
import {FamilyWordArt} from './FamilyVillageWordArt';
import './family-village.css';
import './family-village-premium-v3.css';
import './family-village-showcase-v4.css';
import './family-village-reference-v5.css';
import './family-village-characters-v6.css';
import {GardenHelp} from '../GardenHelp';
import {LearningMotion} from '@/components/learning/motion/LearningMotion';
import {CharacterGuide,type CharacterMood} from '@/components/learning/motion/CharacterGuide';
import './family-village-guides.css';
import {GardenQuestNavigator} from './GardenQuestNavigator';
import './garden-quest-navigation.css';
import './family-village-premium.css';
import './garden-child-legibility.css';

type Props={
 profileId:string;gradeLevel:number|null;englishLevel:EnglishPlacement;progress:FamilyVillageProgress;
 onBack:()=>void;
 onSave:(district:VillageDistrict,stage:VillageStage,mistakes:number,duration:number,
 answers:FamilyAnswerEvidence[],sessionId:string)=>Promise<void>;
};
type Feedback={text:string;good:boolean;detail?:string;lang?:'en'};
const upper=(id:string)=>id.toUpperCase();
const sessionId=(profile:string,d:VillageDistrict,s:VillageStage)=>
 `family:${profile}:${d}:${s}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
type WordChoiceProps={id:string;mode:'icon'|'english'|'translation'|'phrase';
 active?:boolean;wrong?:boolean;disabled?:boolean;onPick:()=>void};
function WordChoice({id,mode,active=false,wrong=false,disabled=false,onPick}:WordChoiceProps){
 const w=villageWord(id);
 // Kinship cannot be identified reliably by hairstyle or age alone.
 // For this category, the Turkish relationship label is part of the
 // comprehension task; other districts use image-only visual recognition.
 const showRelation=w.district==='family'&&(mode==='icon'||mode==='translation');
 const hasArt=mode==='icon'||mode==='translation';
 return <button type="button" onClick={onPick} disabled={disabled}
   aria-pressed={active} data-wrong={wrong}
   className={`fv-choice fv3-choice fv-choice-${mode} ${active?'fv-choice-correct':''}`}
   lang={mode==='english'||mode==='phrase'?'en':undefined}
   aria-label={mode==='english'?w.id:mode==='phrase'?w.phrase:`Görsel: ${w.tr}`}>
   {hasArt&&<span className="fv-choice-art" aria-hidden="true"><FamilyWordArt id={id}/></span>}
   {(mode==='english'||mode==='phrase'||showRelation)&&<span className="fv-choice-label">
      {mode==='english'?w.id:mode==='phrase'?w.phrase:w.tr}
   </span>}
   {active&&<span aria-hidden="true" className="fv-check">✓</span>}
   {wrong&&<span aria-hidden="true" className="fv3-choice-wrong">×</span>}
 </button>;
}
export function FamilyVillageAdventure({profileId,gradeLevel,englishLevel,progress,onBack,onSave}:Props){
 const initial=villageResumePoint(progress.completedByDistrict);
 const [district,setDistrict]=useState<VillageDistrict>(initial.district);
 const [stage,setStage]=useState<VillageStage>(initial.stage);
 const [revision,setRevision]=useState(0);
 const [plan,setPlan]=useState<VillagePlan|null>(null);
 const [loadedKey,setLoadedKey]=useState('');
 const [loadError,setLoadError]=useState(false);
 const [visited,setVisited]=useState<string[]>([]);
 const [answers,setAnswers]=useState<FamilyAnswerEvidence[]>([]);
 const [mistakes,setMistakes]=useState(0);
 const [roundMistakes,setRoundMistakes]=useState(0);
 const [question,setQuestion]=useState(0);
 const questionPrompt=useQuestionFocus<HTMLDivElement>(`${stage}:${question}`);
 const [hint,setHint]=useState(false);
 const [heard,setHeard]=useState(false);
 const [speaking,setSpeaking]=useState(false);
 const [selected,setSelected]=useState<string|null>(null);
 const [wrongIds,setWrongIds]=useState<string[]>([]);
 const [answered,setAnswered]=useState(false);
 const [saved,setSaved]=useState(false);
 // Same rule for the end-of-mission panel: the last answer is gone with it.
 const doneHeading=useQuestionFocus<HTMLHeadingElement>(saved?'done':'play');
 const [busy,setBusy]=useState(false);
 const [saveError,setSaveError]=useState('');
 const [notice,setNotice]=useState<Feedback|null>(null);
 const [muted,setMuted]=useState(()=>soundService.getMuted());
 const currentSession=useRef(sessionId(profileId,district,stage));
 const started=useRef(Date.now()),locked=useRef(false),speechRun=useRef(0);
 const answerLock=useRef(false);
 const visitedRef=useRef<Set<string>>(new Set());
 const wrongRef=useRef<Set<string>>(new Set());
 const dialogRef=useRef<HTMLDivElement>(null);
 const key=`${profileId}/${district}/${stage}/${gradeLevel}/${englishLevel}/${revision}`;
 const current=loadedKey===key&&plan?.district===district&&plan.stage===stage?plan:null;
 const task=current?.questions[question];
 const stageMeta=VILLAGE_STAGES[stage-1];
 const lane=VILLAGE_DISTRICTS.find(x=>x.id===district)!;
 const currentCompleted=progress.completedByDistrict[district];
 const total=stage===1?current?.words.length??0:current?.questions.length??0;
 const progressSteps=stage===1?visited.length:question+Number(answered);
 const cancelSpeech=useCallback(()=>{
   speechRun.current++;
   soundService.cancelSpeech();
   setSpeaking(false);
 },[]);
 useEffect(()=>{
  let alive=true;setLoadError(false);setPlan(null);setLoadedKey('');
  getProgressRepository().getFamilyAnswerHistory(profileId).then(history=>{
   if(!alive)return;
   setPlan(planVillageMission({district,stage,englishLevel,gradeLevel,history,seed:Math.floor(Math.random()*4294967295)}));
   setLoadedKey(key);
  }).catch(err=>{console.error('Aile Köyü içeriği açılamadı',err);if(alive)setLoadError(true)});
  return()=>{alive=false;};
 },[key,profileId,district,stage,englishLevel,gradeLevel]);
 useEffect(()=>()=>{speechRun.current++;soundService.cancelSpeech()},[]);
 useEffect(()=>{
  dialogRef.current?.scrollTo({top:0,behavior:'instant'});
  setHeard(false);setSpeaking(false);
 },[district,stage,question,revision]);
 // Listening rounds play their word, and "find it in the house" rounds their
 // English instruction, as soon as a question opens (as Hayvan Çayırı does);
 // the buttons replay them. Without a device voice the listening call opens
 // the written support at once.
 useEffect(()=>{
  if((stage!==3&&stage!==4)||!task||muted||answered||busy||saved)return;
  const timer=window.setTimeout(()=>{soundService.unlockAudio();speak(task.audio,stage===3);},450);
  return()=>window.clearTimeout(timer);
 },[district,stage,question,revision,task?.audio,muted,answered,busy,saved]);

 function speak(text:string,requireFullAudio=false){
   cancelSpeech();
   if(muted||!soundService.hasEnglishSpeech()){
     if(requireFullAudio){setHint(true);setNotice({good:false,text:'Ses kullanılamıyor',detail:'Yazılı destekle devam edebilirsin.'});}
     return;
   }
   const run=speechRun.current;
   const started=soundService.speakEnglish(text,{
     rate:0.8,
     onStart:()=>{if(run===speechRun.current)setSpeaking(true);},
     onEnd:()=>{if(run===speechRun.current){setSpeaking(false);if(requireFullAudio)setHeard(true);}},
     onError:()=>{if(run===speechRun.current){setSpeaking(false);if(requireFullAudio){
       setHeard(false);setHint(true);setNotice({good:false,text:'Ses tamamlanamadı',detail:'Yazılı destek açıldı.'});
     }}}
   });
   if(!started&&requireFullAudio){setHint(true);setNotice({good:false,text:'Ses açılamadı',detail:'Yazılı destek etkin.'});}

 }
 function start(nextStage:VillageStage,nextDistrict:VillageDistrict=district){
   if(busy)return;cancelSpeech();locked.current=false;
   answerLock.current=false;visitedRef.current.clear();wrongRef.current.clear();
   currentSession.current=sessionId(profileId,nextDistrict,nextStage);
   started.current=Date.now();
   setDistrict(nextDistrict);setStage(nextStage);setRevision(x=>x+1);
   setVisited([]);setAnswers([]);setMistakes(0);setRoundMistakes(0);setQuestion(0);
   setHint(false);setHeard(false);setAnswered(false);setSelected(null);setWrongIds([]);setSaved(false);
   setBusy(false);setNotice(null);setSaveError('');
 }
 function record(id:string,kind:FamilyAnswerEvidence['kind'],wrong:number,assisted:boolean):FamilyAnswerEvidence{
   return {wordId:id,kind,mistakes:wrong,firstTryCorrect:wrong===0&&!assisted,
     hintUsed:assisted,timestamp:new Date().toISOString()};
 }
 function discover(id:string){
   if(!current||stage!==1||busy||saved)return;
   // A previously explored card can be replayed for pronunciation without
   // recording a duplicate discovery event.
   speak(villageWord(id).id);setNotice({good:true,text:upper(villageWord(id).id),lang:'en',detail:villageWord(id).tr});
   if(visitedRef.current.has(id))return;
   visitedRef.current.add(id);
   setVisited(v=>[...v,id]);setAnswers(v=>[...v,record(id,'discovery',0,false)]);
 }
 /** A wrong answer says what the child picked, never what the answer is. */
 function wrongDetail(id:string):string{
   const w=villageWord(id);
   if(stage===2||stage===5)return `${upper(w.id)} = ${w.tr}. Resme yeniden bak.`;
   return `Bu: ${w.tr} (${upper(w.id)}). ${stage===4?'Yönergeyi yeniden oku.':'Yeniden dinle.'}`;
 }
 function choose(id:string){
   if(!task||!current||saved||busy||answered||locked.current||answerLock.current||wrongRef.current.has(id))return;
   if(stage===3&&!heard&&!hint)return;
   if(id!==task.target){
     wrongRef.current.add(id);setWrongIds([...wrongRef.current]);
     setMistakes(m=>m+1);setRoundMistakes(m=>m+1);
     soundService.playSfx('gentle_retry',0.65);
     setNotice({good:false,text:'Bir daha dene! 🦊',detail:wrongDetail(id)});
     return;
   }
   answerLock.current=true;
   const kind=VILLAGE_STAGES[stage-1].kind;
   const next=[...answers,record(id,kind,roundMistakes,hint||(stage===3&&!heard))];
   setAnswers(next);setSelected(id);setAnswered(true);
   soundService.playSfx('correct',0.75);
   setNotice(stage===5?{good:true,text:'✓ '+villageWord(id).phrase,lang:'en',detail:villageWord(id).tr}:
    {good:true,text:`✓ ${upper(villageWord(id).id)}!`,lang:'en',detail:`${villageWord(id).tr} · Doğru!`});
   if(stage===2)speak(id);
   if(stage===4)speak(villageWord(id).command);
   if(stage===5)speak(villageWord(id).phrase);
 }
 async function complete(proof:FamilyAnswerEvidence[]){
   if(locked.current||proof.length<4)return;
   locked.current=true;setBusy(true);setSaveError('');
   try{
    await onSave(district,stage,mistakes,(Date.now()-started.current)/1000,proof,currentSession.current);
    setSaved(true);soundService.playSfx('fanfare',0.8);
    setNotice(null);
   }catch(err){
    console.error('Aile Köyü kaydı başarısız',err);
    setSaveError('Görevin kaydı tamamlanamadı. İlerlemen silinmedi; tekrar deneyebilirsin.');
    locked.current=false;
   }finally{setBusy(false);}
 }
 function advance(){
   if(!answered||busy||!current)return;
   if(question+1>=current.questions.length){void complete(answers);return;}
   cancelSpeech();answerLock.current=false;wrongRef.current.clear();setWrongIds([]);
   setQuestion(x=>x+1);setRoundMistakes(0);
   setHint(false);setHeard(false);setAnswered(false);setSelected(null);setNotice(null);
 }
 useAutoQuestionAdvance({ready:answered,blocked:busy||saved||Boolean(saveError)||!current,
   onAdvance:advance,delayMs:1150,speaking});
 // Final discovery exposure automatically persists without a manual confirmation.
 // Persisted reward still requires the onSave promise to resolve.
 useAutoQuestionAdvance({
   ready:stage===1&&Boolean(current?.words.length)&&
     visited.length===current?.words.length&&answers.length===current?.words.length,
   blocked:busy||saved||Boolean(saveError)||!current,
   onAdvance:()=>{void complete(answers);},delayMs:950,speaking
 });
 // Only a decorative guide responds. Correctness and answer artwork are unchanged.
 const guideMood:CharacterMood=saved?'celebrate':wrongIds.length?'try_again':
  answered?'happy':hint?'hint':speaking?'listen':
  stage===1&&visited.length?'point':'idle';
 const guideCue=revision+':'+question+':'+visited.length+':'+wrongIds.length+':'+
  Number(answered)+':'+Number(hint)+':'+Number(saved);
 // The last answer of a mission says the mission is being saved.
 const finishing=!saveError&&(stage===1?Boolean(current?.words.length)&&visited.length===current?.words.length:
   answered&&question+1===total);
 const toast=notice?{...notice,detail:notice.good&&finishing?'Görev kaydediliyor…':notice.detail}:null;
 const stars=villageMissionStars(mistakes,answers);
 const practised=answers.filter(a=>a.kind!=='discovery');
 const assisted=practised.filter(a=>a.hintUsed).length;
 // The words this mission practised, for the tap-to-hear recap.
 const recap=[...new Set((stage===1?answers:practised).map(a=>a.wordId))];
 const canHear=!muted&&soundService.hasEnglishSpeech();
 const access=(index:number)=>index===0||(index===1?progress.completedByDistrict.family===5:
   index===2?progress.completedByDistrict.rooms===5:progress.completedByDistrict.objects===5);
 return <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Aile Köyü İngilizce öğrenme dünyası"
   className="fv-screen fv3-screen fv4-screen fv5-screen gg-quest-screen fv7-screen" data-stage={stage}>
  <div className="fv-shell fv3-shell fv4-shell">
    <header className="fv-top fv3-top fv5-top">
      <button type="button" data-game-exit disabled={busy} onClick={()=>{cancelSpeech();onBack();}}
        className="fv-back fv3-back fv5-back" aria-label="Kelime Bahçesi’ne dön">
        <span className="fv5-back-arrow" aria-hidden="true">←</span>
        <span className="fv5-back-text">Kelime Bahçesi</span>
      </button>
      <div className="fv5-brand" aria-label="Aile Köyü">
        <img src="/assets/family-village/reference-v5/village-wooden-brand.webp" alt="" decoding="async" draggable={false}/>
        <h1 className="sr-only">Aile Köyü</h1>
      </div>
      <div className="fv5-top-actions">
        <div className="fv-stars fv3-stars fv4-stars fv5-stars" role="img"
          aria-label={`${Object.values(progress.starsByLevel).reduce((n,v)=>n+v,0)} / 60 yıldız`}>
          <span aria-hidden="true">⭐</span> {Object.values(progress.starsByLevel).reduce((n,v)=>n+v,0)}<span className="fv5-stars-total"> / 60</span>
        </div>
        <GardenHelp label="Nasıl Oynanır?">
          <p><strong>{stageMeta.title}:</strong> {stageMeta.description}</p>
          <p>Her mahallede beş görev var: keşfet, hatırla, dinle, evin içinde bul ve konuş. Aile kartlarında Türkçe akrabalık adı yazar; çünkü kimin teyze, kimin kuzen olduğu yüzden anlaşılmaz.</p>
        </GardenHelp>
        <button type="button" className="fv-audio-toggle fv3-audio-toggle fv5-audio-toggle"
          aria-label={muted?'Sesi aç':'Sesi kapat'} aria-pressed={!muted}
          onClick={()=>{const next=!muted;setMuted(next);soundService.toggleMute();if(next)cancelSpeech();}}>
          {muted?'🔇':'🔊'}
        </button>
      </div>
    </header>
    <GardenQuestNavigator areaTitle={lane.title} stageTitle={stageMeta.title} stage={stage} totalStages={5}>
    <nav className="fv-district-nav fv3-district-nav fv5-district-nav gg-quest-zone-nav" aria-label="Aile Köyü mahalleleri">
      {VILLAGE_DISTRICTS.map((part,i)=><button key={part.id} type="button"
        aria-pressed={district===part.id} aria-current={district===part.id?'true':undefined} disabled={!access(i)||busy}
        className={`fv-district fv3-district gg-quest-zone ${district===part.id?'fv-district-current':''}`}
        onClick={()=>start(Math.min(5,progress.completedByDistrict[part.id]+1) as VillageStage,part.id)}>
        <span className={`fv-district-icon fv5-district-icon fv5-district-icon-${part.id}`} aria-hidden="true"/>
        <span className="fv4-district-copy"><strong>{part.title}</strong><small>{access(i)?`${progress.completedByDistrict[part.id]}/5 bölüm`:'Önceki mahalleyi keşfet'}</small></span>
        {!access(i)&&<span className="fv4-district-lock" aria-hidden="true">🔒</span>}
      </button>)}
    </nav>
    <nav className="fv-stepnav fv3-stepnav fv5-stepnav gg-quest-stage-nav" aria-label="İngilizce görev adımları">
      {VILLAGE_STAGES.map(item=><button key={item.stage} type="button"
        disabled={item.stage>currentCompleted+1||busy}
        aria-pressed={item.stage===stage}
        aria-current={item.stage===stage?'step':undefined}
        onClick={()=>start(item.stage as VillageStage)}
        className={`fv-step fv3-step gg-quest-step ${stage===item.stage?'fv-step-current':''}`}>
        <span className={`fv3-step-icon fv5-step-icon fv5-step-icon-${item.stage}`} aria-hidden="true">{item.icon}</span><small className="fv3-step-title">{item.stage}. {item.title}</small><small className="fv3-step-index">{item.stage}/5</small>
        {progress.starsByLevel[VILLAGE_OFFSETS[district]+item.stage]>0&&<b>★</b>}
      </button>)}
    </nav>
    </GardenQuestNavigator>
    <main className="fv-card fv3-card fv5-card">
      <div className="fv-scene fv3-scene fv5-scene">
        <FamilyVillageScenery district={district}/>
        <LearningMotion variant={saved?'victory':stage===1?'discovery':'success'}
         trigger={saved?'family-finished-'+district+'-'+stage+'-'+revision:
          answered?'family-correct-'+district+'-'+stage+'-'+question:
          stage===1&&visited.length?'family-discovery-'+district+'-'+visited.length:null}/>
        {district!=='family'&&<div className="fv-place fv3-place">
         <span aria-hidden="true">{lane.icon}</span><div><strong>{lane.title}</strong>
         <small lang="en">{lane.subtitle}</small></div></div>}
        {district==='family'&&<span className="sr-only">Aile Evi</span>}
        <span className="fv7-scene-count" aria-label={`Görev ilerlemesi ${progressSteps} / ${total}`}>{progressSteps}/{total}</span>
        {toast&&<p className="fv7-toast" data-good={toast.good} role="status" aria-live="polite">
          <span lang={toast.lang}>{toast.text}</span>{toast.detail&&<small>{toast.detail}</small>}
        </p>}
      </div>
      <div className="fv-panel fv3-panel fv5-panel">
        <h2 className="sr-only">{stageMeta.title}</h2>
        <div className="fv5-hud-progress">
          <div className="fv-meter fv3-meter" role="progressbar" aria-label="Görev ilerlemesi"
           aria-valuenow={progressSteps} aria-valuemin={0} aria-valuemax={Math.max(1,total)}>
            <span style={{width:`${Math.round(100*progressSteps/Math.max(1,total))}%`}}/>
          </div>
        </div>
        {loadError?<div role="alert" className="fv-error">Görev yüklenemedi.
          <button onClick={()=>start(stage)}>Tekrar Dene</button></div>:
        !current?<p className="fv-loading" role="status">Aile Köyü hazırlanıyor…</p>:
        saved?<div className="fv-celebrate fv3-celebrate">
          <div className="fv-guide-reward">
            <CharacterGuide character="village-fox" mood="celebrate" cueKey={'saved-'+revision}/>
          </div><h2 ref={doneHeading} tabIndex={-1} lang="en">Well done! Great English!</h2>
          <p className="fv-result" aria-label={`${stars} yıldız kazanıldı`}>{'⭐'.repeat(stars)}</p>
          <p className="fv7-win-stats">{stage===1?`${answers.length} kelimenin İngilizcesini dinledin`:
            `${practised.length} doğru · ${mistakes} yanlış deneme${assisted?` · ${assisted} destekli`:''}`}</p>
          {recap.length>0&&<div className="fv7-recap" role="group" aria-label="Bu görevin İngilizce kelimeleri">
            <p className="fv7-recap-title">Bu görevin kelimeleri · {stage===5?'dokun, cümleyi dinle':'dokun ve dinle'}</p>
            <div className="fv7-recap-list">{recap.map(id=><button key={id} type="button" className="fv7-recap-word"
              onClick={()=>speak(stage===5?villageWord(id).phrase:id)} disabled={!canHear}
              aria-label={`${villageWord(id).tr}, İngilizce ${id}, dinle`}>
              <span className="fv7-recap-art" aria-hidden="true"><FamilyWordArt id={id}/></span><span lang="en">{id}</span></button>)}</div>
          </div>}
          <button className="fv-primary" onClick={()=>{
           if(stage<5)start((stage+1) as VillageStage);
           else if(district==='family')start(1,'rooms');
           else if(district==='rooms')start(1,'objects');
           else if(district==='objects')start(1,'routines');
           else onBack();
          }}>{stage<5?'Sonraki İngilizce Görevi →':district==='routines'?'Haritaya Dön':'Sonraki Mahalle →'}</button>
          <button className="fv-secondary" onClick={()=>start(stage)}>↻ Tekrar Oyna</button>
        </div>:<div className="fv-activity fv3-activity fv5-activity">
          {stage===1?<><div className="fv-prompt fv3-prompt fv5-prompt">
            <span className="fv-guide-portrait">
              <CharacterGuide character="village-fox" mood={guideMood} cueKey={guideCue}/>
            </span><div><strong lang="en">Explore and listen!</strong>
            <small>Her kutuya dokun, İngilizce kelimeyi öğren.</small></div>
          </div><div className="fv-grid fv-grid-discover fv3-grid-discover">
           {current.words.map(id=><button key={id} type="button"
             disabled={busy}
             onClick={()=>discover(id)} aria-pressed={visited.includes(id)}
             className={`fv-discovery fv3-discovery ${visited.includes(id)?'fv-visited':''}`}>
             <span aria-hidden="true"><FamilyWordArt id={id}/></span>
             {visited.includes(id)?<><strong lang="en">{id}</strong><small>{villageWord(id).tr}</small></>:<strong>Keşfet ✨</strong>}
             {visited.includes(id)&&<b aria-label="Keşfedildi">✓</b>}
           </button>)}
          </div></>:
          task?<><div ref={questionPrompt} tabIndex={-1} className="fv-prompt fv3-prompt fv5-prompt">
            <span className="fv-guide-portrait">
              <CharacterGuide character="village-fox" mood={guideMood} cueKey={guideCue}/>
            </span>
            <div>{stage===2?<><strong lang="en">What's this in English?</strong>
              <small>Resme bak, İngilizce adını seç.</small></>:
             stage===3?<><strong lang="en">Listen and find it!</strong><small>İngilizce sesi dinle, görseli bul.</small></>:
             stage===4?<><strong className="fv-english" lang="en">{task.prompt}</strong><small>İngilizce yönergeye uyan görseli seç.</small></>:
             <><strong lang="en">Say it in English!</strong><small>Resme uyan İngilizce cümleyi seç.</small></>}
            </div></div>
            {(stage===2||stage===5)&&<div className={`fv3-featured fv5-featured ${district==='family'?'fv5-featured-portrait':''}`} role="img"
             aria-label={`Bu kavramı İngilizce ifade et: ${villageWord(task.target).tr}`}>
             <FamilyWordArt id={task.target}/>
             {district==='family'&&<span className="fv3-featured-label">{villageWord(task.target).tr}</span>}
            </div>}
            {stage===3&&<div className="fv-audio-task fv3-audio-task">
              <button type="button" onClick={()=>speak(task.audio,true)} disabled={busy||answered}
                className="fv-listen">{speaking?'🔉 Dinleniyor…':'▶ İngilizceyi Dinle'}</button>
              <button type="button" disabled={busy||answered}
                onClick={()=>{setHint(true);setNotice({good:true,text:'Yazılı destek açık',detail:'Bu cevap destekli sayılır.'});}}
                className="fv-hint-button">Yazılı destek</button>
              {hint&&<p>English: <strong lang="en">{task.target}</strong></p>}
              {!heard&&!hint&&<p className="fv7-listen-status">Önce dinle: resimler sesi duyduktan sonra açılır.</p>}
            </div>}
            {stage!==3&&<div className="fv-actions fv3-actions">
              <button type="button" className="fv-hint-button" disabled={busy||answered} onClick={()=>{
               setHint(true);setNotice({good:true,text:'💡 İpucu açık',detail:'Bu cevap destekli sayılır.'});
              }}>💡 İpucu</button>
              <button type="button" className="fv-hint-button" disabled={busy||answered} onClick={()=>{
               // Stage 4 audio is the English instruction already on screen: replaying it
               // is not help, so it must not lower stars or mark the word as weak.
               if(stage===4){speak(task.audio);setNotice({good:true,text:'🔊 Yönerge okunuyor'});return;}
               setHint(true);speak(task.audio);
               setNotice({good:true,text:'🔊 Sesli destek açık',detail:'Bu cevap destekli sayılır.'});
              }}>🔊 {stage===4?'Yönergeyi Dinle':'İngilizceyi Duy'}</button>
              {hint&&<span className="fv3-hint-reveal">İpucu: {
                stage===2?`İlk harf: ${task.target[0].toUpperCase()}`:
                stage===4?villageWord(task.target).tr:
                `Türkçesi: ${villageWord(task.target).tr}`
              }</span>}
            </div>}
            <div className={`fv-grid fv3-answer-grid fv5-answer-grid ${stage===4?'fv-grid-scene':stage===5?'fv-grid-dialogue':''}`}
              role="group" aria-label={stage===4?'Yönergeye uygun görseli seç':stage===5?'İngilizce cümle seçenekleri':'Kelime seçenekleri'}>
              {task.options.map(id=><WordChoice key={id} id={id}
                mode={stage===2?'english':stage===3?(district==='family'?'translation':'icon'):stage===4?'icon':'phrase'}
                disabled={busy||answered||wrongIds.includes(id)||(stage===3&&!heard&&!hint)}
                wrong={wrongIds.includes(id)}
                active={selected===id} onPick={()=>choose(id)}/>)}
            </div>
          </>:<p role="alert">Görev içeriği bulunamadı. <button onClick={()=>start(stage)}>Yeniden Aç</button></p>}
          {saveError&&<div role="alert" className="fv-error">{saveError}
            <button onClick={()=>void complete(answers)}>Kaydetmeyi Tekrar Dene</button></div>}
        </div>}
      </div>
    </main>
  </div>
 </div>;
}
