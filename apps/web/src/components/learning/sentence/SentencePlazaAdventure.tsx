'use client';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import type {SentenceAnswerEvidence} from '@ventra/shared';
import type {EnglishPlacement} from '@/lib/learning/gradeAwareLearningPolicy';
import {getProgressRepository} from '@/lib/progress';
import {getSentencePlazaProgress,saveSentencePlazaMission,type SentencePlazaProgress}
 from '@/lib/progress/sentencePlazaProgress';
import {SENTENCE_PLAZA_MISSIONS,planPlazaMission,plazaWordTiles,evaluatePlazaSentence,
 type PlazaMission,type PlazaDeck,type PlazaQuestion} from '@/lib/learning/sentencePlazaEngine';
import {soundService} from '@/lib/audio/SoundService';
import {SentencePlazaScene} from './SentencePlazaScene';
import {LearningMotion} from '@/components/learning/motion/LearningMotion';
import {SentenceAnimalArtwork,type SentenceAnimalSpecies} from './SentenceAnimalArtwork';
import {sentenceStart,visibleRepairWord} from './sentencePresentation';
import {SentenceQuestBuilder,SentenceQuestProgress,SentenceQuestSuccess,SentenceQuestReward} from './SentenceQuestComponents';
import {sentenceQuestHint,sentenceQuestCorrect} from './sentence-quest-language';
import {advanceAfterSpokenSentence} from './sentenceAutoAdvance';
import './sentence-quest-unified.css';
import {MovementMagicAdventure} from './MovementMagicAdventure';
import {WishFestivalAdventure} from './WishFestivalAdventure';
import {LanternFestivalAdventure} from './LanternFestivalAdventure';
import './sentence-plaza.css';
import './sentence-plaza-v2.css';
import './sentence-clarity-v3.css';
import './sentence-plaza-scenes-v6.css';
import './sentence-plaza-learning-v7.css';
import './sentence-plaza-friends-v9.css';
import {gradeLevelLabel} from '@/lib/learning/gradeLabel';
import {IslandHome} from '../island/IslandHome';

interface Props{
 profileId:string;gradeLevel:number|null;englishLevel:EnglishPlacement;
 onBack:()=>void;onSaved:()=>void;
}
type Screen='map'|'lesson'|'play'|'reward';
const FUTURE=['Büyülü Yapı Atölyesi','Konumlar Parkı','Soru İstasyonu','Gökyüzü Köprüsü'] as const;
/** What each mission's English does, in a child's words (home cards). */
const PLAZA_SKILL_LINE:Readonly<Record<typeof SENTENCE_PLAZA_MISSIONS[number]['skill'],string>>={
 describing:'Renkleri cümleyle anlat',introducing:'Yeni dostları tanıt',location:'Nerede olduklarını söyle',
 action:'Ne yapabildiklerini söyle',preference:'Ne istediğini söyle',transfer:'Hepsini birlikte kullan'
};
const EMPTY:SentencePlazaProgress={completedLevels:0,totalLevels:6,starsByLevel:{}};
function sessionId(profileId:string,mission:PlazaMission):string{
 return `plaza:${profileId}:${mission}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}
export function SentencePlazaAdventure({profileId,gradeLevel,englishLevel,onBack,onSaved}:Props){
 const [progress,setProgress]=useState<SentencePlazaProgress>(EMPTY);
 const [history,setHistory]=useState<SentenceAnswerEvidence[]>([]);
 const [movementOpen,setMovementOpen]=useState(false);
 const [wishOpen,setWishOpen]=useState(false);
 const [lanternOpen,setLanternOpen]=useState(false);
 const [knownWords,setKnownWords]=useState<string[]>([]);
 const [loading,setLoading]=useState(true);
 const [loadAttempt,setLoadAttempt]=useState(0);
 const [loadError,setLoadError]=useState('');
 const [screen,setScreen]=useState<Screen>('map');
 const [mission,setMission]=useState<PlazaMission>(1);
 const [deck,setDeck]=useState<PlazaDeck|null>(null);
 const [step,setStep]=useState(0);
 const [picked,setPicked]=useState<string[]>([]);
 const [selectedScene,setSelectedScene]=useState<string|null>(null);
 const [repairMarked,setRepairMarked]=useState(false);
 const [wrongSlot,setWrongSlot]=useState(-1);
 const [mistakes,setMistakes]=useState(0);
 const [roundMistakes,setRoundMistakes]=useState(0);
 const [hintUsed,setHintUsed]=useState(false);
 const [modelHeard,setModelHeard]=useState(false);
 const [answers,setAnswers]=useState<SentenceAnswerEvidence[]>([]);
 const [awakened,setAwakened]=useState(false);
 const [busy,setBusy]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [feedbackError,setFeedbackError]=useState(false);
 const [saveError,setSaveError]=useState('');
 const [completedStars,setCompletedStars]=useState(0);
 const completedAnswers=useRef<SentenceAnswerEvidence[]>([]);
 const startedAt=useRef(Date.now());
 const currentSession=useRef('');
 const nextTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const awaitingTransition=useRef(false);
 const savingLock=useRef(false);
 const root=useRef<HTMLDivElement>(null);
 const task=deck?.questions[step]??null;
 const actorNames:Record<string,string>={cat:'Kedi',dog:'Köpek',bird:'Kuş',rabbit:'Tavşan'};
 const visualLocation=mission===3&&task?.mode==='scene';
 const locationAnimal=task?.scene?.actor?actorNames[task.scene.actor]??'Hayvan':'Hayvan';
 const tiles=useMemo(()=>task?plazaWordTiles(task,(deck?.seed??0)+step*173):[],[task,deck?.seed,step]);
 const selectedWords=picked.map(id=>tiles.find(t=>t.id===id)?.word??'');
 const chosenCount=picked.length;
 const taskReady=task?.mode==='scene'?selectedScene===task.correctSceneChoice:
    task?.mode==='repair'?repairMarked:true;
 const sceneColorMap:Record<string,string>={
  red:'#f77075',blue:'#6ac7f1',yellow:'#ffd86a',green:'#73dfa7',
  purple:'#b49beb',orange:'#f3a65d'
 };
 const sentenceKindLabels:Record<string,string>={
  statement:'Anlatım',question:'Soru',negative:'Olumsuz cümle',
  instruction:'Yönerge',reason:'Neden-sonuç',contrast:'Karşılaştırma',
  preference:'Tercih',request:'İstek'
 };
 const repairWords=task?.brokenSentence?.replace(/[.,!?]/g,'').split(/\s+/).filter(Boolean)??[];
 const repairBadIndex=task?.mode==='repair'?repairWords.findIndex((word,i)=>word!==task.tokens[i]):-1;
 const totalQuestions=deck?.questions.length??0;
 const rule=SENTENCE_PLAZA_MISSIONS[mission-1];
 const starsTotal=Object.values(progress.starsByLevel).reduce((n,v)=>n+v,0);
 const clearTimer=()=>{if(nextTimer.current){clearTimeout(nextTimer.current);nextTimer.current=null;}};
 useEffect(()=>{
  let live=true;
  setLoading(true);setLoadError('');
  const repo=getProgressRepository();
  // Answer history only ranks questions; it must not lock the whole plaza.
  Promise.all([getSentencePlazaProgress(repo,profileId),repo.getSentenceAnswerHistory(profileId).catch(()=>[]),
    Promise.all([
     repo.getAnimalAnswerHistory(profileId).catch(()=>[]),
     repo.getColorAnswerHistory(profileId).catch(()=>[]),
     repo.getFoodAnswerHistory(profileId).catch(()=>[])
    ])])
    .then(([p,h,garden])=>{if(!live)return;
      setProgress(p);setHistory(h);
      setKnownWords([...new Set(garden.flat().map(item=>item.wordId))]);
      setLoading(false);
    })
    .catch(error=>{console.error('Cümle Meydanı ilerlemesi okunamadı',error);
      if(live){setLoadError('Oyuncu ilerlemesi okunamadı. Kaydını korumak için bölümler açılmadı.');setLoading(false);}});
  return()=>{live=false;clearTimer();soundService.cancelSpeech();};
 },[profileId,loadAttempt]);
 useEffect(()=>{
  soundService.setMusicScene('plaza');
  return()=>{soundService.setMusicScene('archipelago');soundService.cancelSpeech();};
 },[]);
 // A new screen (map, lesson, play, reward) starts at its top, not where the
 // child last scrolled to reach the build button.
 useEffect(()=>{root.current?.scrollTo({top:0,behavior:'instant'});},[screen,mission]);
 useEffect(()=>{if(screen==='play')root.current?.querySelector<HTMLElement>('.sp-cue')?.focus();},[screen,step]);
 function back(){
  if(savingLock.current)return;
  const solved=completedAnswers.current;
  if(screen==='play'&&deck&&!saveError&&solved.length>0&&solved.length===deck.questions.length){
   // The last sentence is solved and only waiting for its auto-advance. Leaving
   // here used to cancel that timer and silently drop the finished mission:
   // save it now instead (the reward screen still offers the way back).
   clearTimer();awaitingTransition.current=false;void finish(solved);return;
  }
  clearTimer();soundService.cancelSpeech();awaitingTransition.current=false;
  if(screen==='map'){onBack();return;}
  if(screen==='reward'){setScreen('map');return;}
  // Never award half-finished attempts; a complete mission saves atomically.
  setScreen('map');setAwakened(false);setPicked([]);setSelectedScene(null);setRepairMarked(false);setFeedback('');
 }
 function openMission(m:PlazaMission){
  if(loading||loadError||savingLock.current||m>progress.completedLevels+1)return;
  if(m===4){setMovementOpen(true);return;}
  if(m===5){setWishOpen(true);return;}
  if(m===6){setLanternOpen(true);return;}
  clearTimer();soundService.cancelSpeech();
  setMission(m);setScreen('lesson');setDeck(null);setFeedback('');setSaveError('');
  setAwakened(false);setCompletedStars(0);setAnswers([]);completedAnswers.current=[];
  setStep(0);setPicked([]);setSelectedScene(null);setRepairMarked(false);setWrongSlot(-1);setMistakes(0);setRoundMistakes(0);setHintUsed(false);setModelHeard(false);
 }
 function beginMission(){
  const now=Date.now(),seed=(now^Math.floor(Math.random()*0xffffffff))>>>0;
  const next=planPlazaMission({mission,grade:gradeLevel,englishLevel,seed,history,knownWords});
  if(!next.questions.length){setLoadError('Bu bölüm için İngilizce görev oluşturulamadı.');return;}
  currentSession.current=sessionId(profileId,mission);
  startedAt.current=now;
  awaitingTransition.current=false;savingLock.current=false;
  setDeck(next);setStep(0);setAnswers([]);completedAnswers.current=[];
  setPicked([]);setSelectedScene(null);setRepairMarked(false);setWrongSlot(-1);setMistakes(0);setRoundMistakes(0);setHintUsed(false);setModelHeard(false);
  setAwakened(false);setFeedback('');setFeedbackError(false);setSaveError('');
  setScreen('play');
  soundService.playSfx('whoosh',.5);
 }
 function incorrect(detail?:string){
  if(awaitingTransition.current)return;
  setMistakes(n=>n+1);setRoundMistakes(n=>n+1);setFeedbackError(true);
  soundService.playSfx('gentle_retry',.7);
  setFeedback(detail??'Bir sözcüğün yeri veya anlamı doğru değil. Cümleyi tekrar düzenle.');
 }
 function listenModel(){
  soundService.unlockAudio();
  soundService.speakEnglish(rule.model,{rate:.78});
 }
 function listenTask(){
  if(!task||awaitingTransition.current)return;
  soundService.unlockAudio();
  const started=soundService.speakEnglish(task.sentence,{rate:.81});
  if(started){setModelHeard(true);setFeedback('İngilizce cümleyi dinledin. Şimdi sözcükleri kendin sırala.');setFeedbackError(false);}
  else{setFeedback('Cihazında İngilizce ses kullanılamadı. Yazılı yardım açabilirsin.');setFeedbackError(true);}
 }
 function showHint(){
  if(!task||awaitingTransition.current)return;
  setHintUsed(true);setFeedbackError(false);
  if(mission===3&&task.mode==='scene'&&!selectedScene){
   setFeedback('Sahnedeki parlak hayvanı bul. Bulunduğu yerin işaretine dokun.');
   return;
  }
  setFeedback(sentenceQuestHint(task.explanation,task.tokens[chosenCount]));
 }
 async function finish(rows:SentenceAnswerEvidence[]){
  if(savingLock.current||!deck)return;
  savingLock.current=true;setBusy(true);setSaveError('');completedAnswers.current=rows;
  try{
   const p=await saveSentencePlazaMission({repo:getProgressRepository(),profileId,mission,plan:deck,
    answers:rows,sessionId:currentSession.current,durationSeconds:(Date.now()-startedAt.current)/1000});
   const earned=p.runStars;
   setProgress(p);setCompletedStars(earned);
   setHistory(old=>[...old,...rows]);setScreen('reward');setFeedback('');
   soundService.playSfx('fanfare',.8);
   onSaved();
  }catch(error){
   console.error('Cümle Meydanı kayıt hatası',error);
   setSaveError('İlerleme kaydedilemedi. Aynı oturumu tekrar kaydet; ödüllerin iki kez eklenmez.');
   setFeedbackError(true);
  }finally{setBusy(false);savingLock.current=false;}
 }
 function completeQuestion(nextPicked:string[]){
  if(!task||!deck||awaitingTransition.current)return;
  awaitingTransition.current=true;
  setAwakened(true);setFeedbackError(false);
  setFeedback(sentenceQuestCorrect(task.sentence,'Sahne canlanıyor.'));
  const evidence:SentenceAnswerEvidence={
   questionId:task.id,skill:task.skill,placement:englishLevel,sentenceKind:task.kind,challengeMode:task.mode,mistakes:roundMistakes,
   hintUsed,modelHeard,firstTryCorrect:roundMistakes===0&&!hintUsed&&!modelHeard,
   timestamp:new Date().toISOString()
  };
  const rows=[...answers,evidence];
  setPicked(nextPicked);setAnswers(rows);completedAnswers.current=rows;
  soundService.playSfx('correct',.85);
  // Let the full English sentence finish (a fixed timer cut long A2 sentences
  // off) and the world transformation play before automatically advancing.
  // No additional "next" click; without a voice the old reading time applies.
  advanceAfterSpokenSentence({
   speak:events=>soundService.speakEnglish(task.sentence,{rate:.86,...events}),
   wordCount:task.tokens.length,minDwellMs:1950,
   silentDelayMs:Math.max(1950,Math.min(5100,1100+task.tokens.length*230)),
   setTimer:(run,delay)=>{
    clearTimer();
    nextTimer.current=setTimeout(()=>{nextTimer.current=null;run();},delay);
   },
   stillWaiting:()=>awaitingTransition.current,
   advance:()=>{
    awaitingTransition.current=false;
    if(step+1>=deck.questions.length){void finish(rows);return;}
    soundService.cancelSpeech();
    setStep(n=>n+1);setPicked([]);setSelectedScene(null);setRepairMarked(false);setWrongSlot(-1);setRoundMistakes(0);setHintUsed(false);
    setModelHeard(false);setAwakened(false);setFeedback('');setFeedbackError(false);
   }
  });
 }
 function pickWord(id:string){
  if(!task||!deck||screen!=='play'||awaitingTransition.current||busy||saveError||!taskReady)return;
  if(picked.includes(id)||picked.length>=task.tokens.length)return;
  const tile=tiles.find(x=>x.id===id);
  if(!tile)return;
  soundService.playSfx('tap',.37);
  setPicked(old=>[...old,id]);setWrongSlot(-1);setFeedback('');setFeedbackError(false);
 }
 function selectScene(id:string){
  if(!task||task.mode!=='scene'||awaitingTransition.current||busy||selectedScene)return;
  if(id!==task.correctSceneChoice){
   incorrect(mission===3?'Resimdeki hayvanın yerini tekrar incele.':mission===2?'Resimdeki hayvana tekrar bak. Hangi hayvan?':'Resme yeniden bak ve doğru seçeneği bul.');
   return;
  }
  soundService.playSfx('tap',.5);
  setSelectedScene(id);setFeedback(mission===3?'Doğru yeri buldun! Şimdi gördüğünü İngilizce anlat.':mission===2?'Hayvanı doğru buldun! Şimdi cümleyi İngilizce kur.':'Doğru seçtin! Şimdi İngilizce cümleyi kur.');
  setFeedbackError(false);
 }
 function selectRepair(index:number){
  if(!task||task.mode!=='repair'||awaitingTransition.current||busy||repairMarked)return;
  if(index!==repairBadIndex){
   incorrect('Bir kez daha dene. Yukarıdaki Türkçe cümleyle karşılaştır.');
   return;
  }
  soundService.playSfx('correct',.35);
  setRepairMarked(true);setFeedback('Evet! Şimdi Türkçe anlamdaki doğru İngilizce cümleyi kur.');
  setFeedbackError(false);
 }
 function submitSentence(){
  if(!task||!deck||!taskReady||awaitingTransition.current||busy||saveError)return;
  const result=evaluatePlazaSentence(task,selectedWords);
  if(!result.correct){
   if(picked.length<task.tokens.length){
    setFeedback('Cümlede eksik sözcük var. Sonra cümleyi kontrol et.');
    setFeedbackError(true);
    return;
   }
   setWrongSlot(result.incorrectIndex);
   incorrect(result.explanation);
   return;
  }
  completeQuestion(picked);
 }
 const sceneEffect=screen==='play'&&awakened?task?.scene??null:null;
 const chapterTotal=6;
 if(lanternOpen){
  return <LanternFestivalAdventure profileId={profileId} gradeLevel={gradeLevel}
    englishLevel={englishLevel} history={history} knownWords={knownWords}
    onExit={()=>setLanternOpen(false)}
    onComplete={(rows)=>{
      setHistory(old=>[...old,...rows]);
      void getSentencePlazaProgress(getProgressRepository(),profileId).then(setProgress)
        .catch(error=>console.error('Fener Festivali ilerleme görünümü yenilenemedi',error));
      onSaved();
    }}/>;
 }
 if(wishOpen){
  return <WishFestivalAdventure profileId={profileId} gradeLevel={gradeLevel}
    englishLevel={englishLevel} history={history} knownFoods={knownWords}
    onExit={()=>setWishOpen(false)}
    onNext={()=>{setWishOpen(false);openMission(6);}} nextLabel={SENTENCE_PLAZA_MISSIONS[5].title}
    onComplete={(rows)=>{
      setHistory(old=>[...old,...rows]);
      void getSentencePlazaProgress(getProgressRepository(),profileId).then(setProgress)
        .catch(error=>console.error('İstekler Meydanı ilerlemesi yenilenemedi',error));
      onSaved();
    }}/>;
 }
 if(movementOpen){
  return <MovementMagicAdventure profileId={profileId} gradeLevel={gradeLevel}
    englishLevel={englishLevel} history={history}
    onExit={()=>setMovementOpen(false)}
    onNext={()=>{setMovementOpen(false);openMission(5);}} nextLabel={SENTENCE_PLAZA_MISSIONS[4].title}
    onComplete={(newRows)=>{
      setHistory(old=>[...old,...newRows]);
      void getSentencePlazaProgress(getProgressRepository(),profileId).then(setProgress)
        .catch(error=>console.error('Hareket Büyüsü ilerleme görünümü yenilenemedi',error));
      onSaved();
    }}/>;
 }
 // The overview shares one home grammar with every island; the lesson,
 // play and reward screens below keep the plaza's own scene.
 if(screen==='map')return <IslandHome island="sentence" ariaLabel="Cümle Meydanı İngilizce macerası"
  eyebrow="BÖLGE 1 / 5 · UYANAN MEYDAN" title="Cümle Meydanı" crest="🏰" onBack={back}
  chips={[gradeLevelLabel(gradeLevel)+' · '+englishLevel,'⭐ '+(loading||loadError?'…':starsTotal)+' / 18']}
  heroArt="/assets/kids-islands/story_castle.webp" heroArtMobile="/assets/kids-islands/story_castle_mobile.webp"
  tagline="Bir cümle kur, meydanı canlandır!"
  guide={{src:'/assets/story-forest/premium/characters/dog_puppy.webp',alt:'Meydanın köpek dostu'}}
  chapterNoun="Görev" sectionTitle="Bir macera seç"
  chapters={SENTENCE_PLAZA_MISSIONS.map(item=>({id:item.id,title:item.title,subtitle:PLAZA_SKILL_LINE[item.skill],icon:item.icon,
   art:`/assets/sentence-plaza/v5/mission-${item.id}.webp`,
   done:item.id<=progress.completedLevels,unlocked:item.id<=progress.completedLevels+1,
   stars:progress.starsByLevel[item.id]}))}
  onOpen={id=>openMission(id as PlazaMission)}
  status={loading?'loading':loadError?'error':'ready'} errorText={loadError||undefined}
  onRetry={()=>setLoadAttempt(n=>n+1)}
  onPointerDown={event=>event.stopPropagation()}
  beforeChapters={<ol className="ih-steps" aria-label="Oyunun dört adımı">
   <li><span aria-hidden="true">👀</span>Gör</li><li><span aria-hidden="true">🔊</span>Dinle</li>
   <li><span aria-hidden="true">🧩</span>Kur</li><li><span aria-hidden="true">✨</span>Canlandır</li>
  </ol>}>
  <details className="ih-panel ih-future">
   <summary>🔒 Diğer bölgeler <span aria-hidden="true">⌄</span></summary>
   <ul>{FUTURE.map((name,i)=><li key={name}>🔒 {i+2}. {name} · Yakında</li>)}</ul>
  </details>
 </IslandHome>;
 return <div ref={root} role="dialog" aria-modal="true" aria-label="Cümle Meydanı İngilizce macerası"
  className="sp-overlay sp-v2 sp-v3" onPointerDown={event=>event.stopPropagation()}>
  <div className="sp-wrap">
   <header className="sp-top">
    <div className="sp-logo"><div className="sp-logo-emblem" aria-hidden="true">🏰</div>
     <div><div className="sp-eyebrow">VENTRA · SENTENCE ADVENTURE</div>
      <h1 className="sp-brand-title">Cümle Meydanı</h1>
      <p className="sp-sub sr-only">Kelimeler dünyayı değiştirsin.</p></div>
    </div>
    <div className="sp-actions">
     <span className="sp-chip">🎓 {gradeLevelLabel(gradeLevel)} · {englishLevel}</span>
     <span className="sp-chip">⭐ {starsTotal} / 18</span>
     <button type="button" className="sp-back" onClick={back} disabled={busy}>
      ← Meydana Dön
     </button>
    </div>
   </header>
   {loading?<div role="status" className="sp-reward"><h2>Şehir hazırlanıyor…</h2></div>:
   loadError?<div role="alert" className="sp-reward"><h2>Kayıt okunamadı</h2><p>{loadError}</p>
    <button type="button" onClick={()=>setLoadAttempt(n=>n+1)} className="sp-primary">↻ Tekrar dene</button>
    <button type="button" onClick={onBack} className="sp-primary">Adalar Evreni'ne Dön</button>
   </div>:
   screen==='lesson'?<>
    <section className="sp-hero sp-v2-hero"><div><div className="sp-eyebrow">ÖNCE ÖĞREN · GÖREV {mission} / {chapterTotal}</div>
     <h2>{rule.icon} {rule.title}</h2><p>{rule.story}</p></div></section>
    <div className="sp-layout">
     <SentencePlazaScene effect={null} awaken={false} chapter={mission}/>
     <aside className="sp-side sp-v2-guide">
       <div className="sp-side-label">1 · DİNLE</div><h3>Örneği keşfet</h3>
       <div className="sp-learn-card"><strong>ÖRNEK CÜMLE</strong><span>{rule.model}</span>
        <small>{rule.modelTr}</small></div>
       <button type="button" className="sp-secondary sp-v2-listen" onClick={listenModel}>🔊 Dinle</button>
       <details className="sp-v2-details"><summary>📖 Dil yapısı</summary><p>{rule.rule}</p></details>
       <button type="button" className="sp-primary sp-v2-play" onClick={beginMission}>✨ Oyna</button>
      </aside>
    </div>
   </>:screen==='play'&&deck&&task?<>
    <section className="sp-hero"><div><div className="sp-eyebrow">GÖREV {mission} · {rule.skill.toUpperCase()}</div>
     <h2>{rule.title}</h2><p className="sr-only">{rule.story}</p></div>
     <div className="sp-stars"><strong>{step+1}/{totalQuestions}</strong>cümle görevi</div></section>
    <div className="sp-game-layout">
     <div className="relative isolate">
      <SentencePlazaScene effect={sceneEffect} awaken={awakened} chapter={mission}
        preview={mission<=3?task.scene:null}
        previewAtTarget={mission===3&&task.kind!=='instruction'}
        sceneChoices={mission===3&&task.mode==='scene'?task.sceneChoices:undefined}
        selectedChoice={selectedScene}
        onSceneChoice={mission===3&&task.mode==='scene'?selectScene:undefined}
        interactionDisabled={busy||awakened||Boolean(saveError)}
        onInteract={awakened?()=>soundService.speakEnglish(task.sentence,{rate:.82}):undefined}/>
      <LearningMotion variant="discovery"
       trigger={awakened?'sentence-awaken-'+mission+'-'+step:null}/>
      <details className="sp-v2-details sp-v2-scene-help">
        <summary>📖 Yapı yardımı</summary><p>{task.explanation}</p>
       </details>
     </div>
     <section className="sp-workshop" aria-label="İngilizce cümle oluşturma atölyesi">
      <div className="sp-step"><span>✦ {sentenceKindLabels[task.kind]} · {task.mode==='repair'?'Yanlış kelimeyi seç':task.mode==='scene'?(mission===2?'Hayvanı seç':'Sahneyi seç'):'Cümleyi kur'}</span>
       <span>{step+1} / {totalQuestions}</span></div>
      <div className="sp-meter" role="progressbar" aria-label="Bölümde tamamlanan cümleler"
       aria-valuemin={0} aria-valuemax={totalQuestions} aria-valuenow={step+(awakened?1:0)}>
       <span style={{width:`${100*(step+(awakened?1:0))/totalQuestions}%`}}/></div>
      <SentenceQuestProgress index={step+1} total={totalQuestions} label={sentenceKindLabels[task.kind]}/>
       <h3 tabIndex={-1} className="sp-cue">{visualLocation&&!selectedScene?
        `${locationAnimal} nerede? Resimde bul.`:sentenceStart(task.cue)}</h3>
      <div className="sp-v2-steps" aria-label="Seç, kur ve canlandır">
        <span className={taskReady?'sp-v2-step-done':'sp-v2-step-current'}>① {task.mode==='repair'?'Düzelt':task.mode==='scene'?'Seç':'Bak'}</span>
        <span className={taskReady&&!awakened?'sp-v2-step-current':awakened?'sp-v2-step-done':''}>② Kur</span>
        <span className={awakened?'sp-v2-step-done':''}>③ Canlandır</span>
       </div>
      {visualLocation&&<div className="sp-v7-visual-task" role="status">
        <span aria-hidden="true">👀</span>
        <span>{selectedScene?'Yeri buldun. Şimdi İngilizce cümleyi kur.':'Sahnede hayvanı bul. Bulunduğu yerin işaretine dokun.'}</span>
       </div>}
      {task.mode==='scene'&&task.sceneChoices&&!visualLocation&&
       <div className={`sp-interaction ${mission===2?'sp-v9-animal-interaction':''}`} role="group" aria-label={mission===2?'Resimdeki hayvanı seç':'Anlamla eşleşen görsel sahne seçimi'}>
        <strong>{mission===2?'👀 Resimde hangi hayvan var?':'👀 Sahneyi seç'}</strong>
        <div className="sp-scene-choices">
         {task.sceneChoices.map((choice,i)=><button type="button" key={choice.id}
          disabled={selectedScene!==null||awakened||busy}
          aria-pressed={selectedScene===choice.id}
          className={`sp-scene-choice ${mission===2?'sp-v9-animal-option':''}`} data-selected={selectedScene===choice.id}
          onClick={()=>selectScene(choice.id)}>
          {mission===2&&['cat','dog','bird','rabbit'].includes(choice.id)?
           <svg className="sp-v9-animal-choice-art" viewBox="-81 -138 145 174"
            role="img" aria-label={choice.label}>
             <SentenceAnimalArtwork actor={choice.id as SentenceAnimalSpecies}
              color={task.scene.color} index={30+i}/>
           </svg>:choice.icon==='🎨'?<span className="sp-color-swatch" aria-hidden="true"
           style={{backgroundColor:sceneColorMap[choice.id]??'#9ad3df'}}>✦</span>:
           <span aria-hidden="true">{choice.icon}</span>}<small>{choice.label}</small>
         </button>)}
        </div>
       </div>}
      {task.mode==='repair'&&task.brokenSentence&&
       <div className="sp-interaction" role="group" aria-label="Yanlış sözcüğü bul ve onar">
        <strong>🔎 Bu İngilizce cümlede bir kelime yanlış.</strong>
        <p className="sp-v3-repair-hint">Yukarıdaki Türkçe anlamla karşılaştır. Yanlış kelimeye dokun.</p>
        <div className="sp-repair-words">{repairWords.map((word,i)=><button type="button"
         key={i} disabled={repairMarked||awakened||busy}
         data-selected={repairMarked&&i===repairBadIndex}
         className="sp-repair-word" onClick={()=>selectRepair(i)} aria-label={`${visibleRepairWord(word,i,repairWords.length,task.sentence)} kelimesini seç`}>{visibleRepairWord(word,i,repairWords.length,task.sentence)}</button>)}</div>
       </div>}
      {!taskReady&&<p className="sp-caption" style={{marginTop:10}}>
       {task.mode==='repair'?'Önce anlamı değiştiren kelimeyi seç.':visualLocation?'Önce resimdeki yerini seç.':'Önce sahneyi seç.'}
      </p>}
      <details className="sp-v2-vocab"><summary>📚 Kelimeler</summary>
        <div className="sp-vocab" aria-label="İngilizce kelime desteği">
         {task.vocabulary.map((w,i)=><span key={i}>{w.en} · {w.tr}</span>)}</div>
       </details>
      {taskReady?<>
      <SentenceQuestBuilder tokens={task.tokens} tiles={tiles} pickedIds={picked}
 selectedWords={selectedWords} wrongIndex={wrongSlot} locked={awakened||busy||Boolean(saveError)}
 onRemove={i=>{setPicked(old=>old.filter((_,index)=>index!==i));setWrongSlot(-1);}}
 onAdd={pickWord} slotRowClass="sp-slots" slotClass="sp-slot" tileRowClass="sp-tiles" tileClass="sp-tile"/>
      </>:<div className="sp-v3-waiting" role="status" aria-live="polite">
        <span aria-hidden="true">🔒</span>
        <span>{task.mode==='repair'?'Yanlış kelimeyi seçince cümle kurma alanı açılacak.':'Sahneyi seçince cümle kurma alanı açılacak.'}</span>
       </div>}
      <button type="button" className="sp-primary sp-check" disabled={awakened||busy||!taskReady||picked.length!==task.tokens.length||Boolean(saveError)}
       onClick={submitSentence}>✨ Canlandır</button>
      <div className="sp-tools">
       <button type="button" className="sp-secondary" disabled={awakened||busy||!picked.length}
        onClick={()=>{setPicked(old=>old.slice(0,-1));setWrongSlot(-1);}} aria-label="Son kelimeyi geri al">↶ Geri Al</button>
       <button type="button" className="sp-secondary" disabled={awakened||busy}
        onClick={listenTask}>🔊 Dinle</button>
       <button type="button" className="sp-secondary" disabled={awakened||busy}
        onClick={showHint}>💡 İpucu Al</button>
      </div>
      {feedback&&<div role="status" aria-live="polite" className="sp-feedback" data-error={feedbackError}>{feedback}</div>}
      {awakened&&<SentenceQuestSuccess detail="Sahne canlandı!"/>}
      {saveError&&<div role="alert" className="sp-feedback" data-error="true">
        {saveError}<button type="button" disabled={busy} className="sp-primary" style={{marginTop:12}}
         onClick={()=>void finish(completedAnswers.current)}>Tekrar Kaydet</button></div>}
      <p className="sr-only">İpuçları ve hatalar öğrenme kayıtlarında ayrı tutulur.</p>
     </section>
    </div>
   </>:screen==='reward'?<div className="sp-reward relative isolate overflow-hidden" role="status">
     <LearningMotion variant="victory" trigger={'sentence-reward-'+mission}/>
     <div className="sp-eyebrow">Uyanan Meydan · Görev {mission} tamamlandı</div>
     <SentenceQuestReward independent={completedAnswers.current.filter(x=>x.firstTryCorrect).length}/>
      <h2>Şehir canlandı!</h2><div className="sp-reward-stars">{'★'.repeat(completedStars)}</div>
     <p>İngilizce cümleler kurarak dünyayı değiştirdin. Yeni göreve geçebilir veya bu bölümde başka cümlelerle çalışabilirsin.</p>
     <div className="sp-lesson-grid" style={{margin:'20px 0'}}>
      <div className="sp-lesson-tip">📖 <strong>{completedAnswers.current.length} anlamlı cümle</strong></div>
      <div className="sp-lesson-tip">⭐ <strong>{completedStars} / 3 yıldız</strong></div>
      <div className="sp-lesson-tip">🧠 <strong>{completedAnswers.current.filter(x=>x.firstTryCorrect).length} bağımsız başarı</strong></div>
      <div className="sp-lesson-tip">💡 <strong>{completedAnswers.current.filter(x=>x.hintUsed||x.modelHeard).length} destekli deneme</strong></div>
     </div>
     <button type="button" className="sp-primary" onClick={()=>openMission(Math.min(6,mission+1) as PlazaMission)}>
      {mission===6?'↻ Farklı Cümlelerle Yeniden Oyna':'✦ Sıradaki Öğrenme Görevi'}
     </button>
     <button type="button" className="sp-secondary" style={{marginTop:17}} onClick={()=>setScreen('map')}>Meydan Haritasına Dön</button>
    </div>:null}
  </div>
 </div>;
}
