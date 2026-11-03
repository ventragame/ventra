'use client';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import type {SentenceAnswerEvidence} from '@ventra/shared';
import type {EnglishPlacement} from '@/lib/learning/gradeAwareLearningPolicy';
import {soundService} from '@/lib/audio/SoundService';
import {getProgressRepository} from '@/lib/progress';
import {saveSentencePlazaMission} from '@/lib/progress/sentencePlazaProgress';
import {plazaWordTiles} from '@/lib/learning/sentencePlazaEngine';
import {WishFestivalStage} from './WishFestivalStage';
import {WISH_CHAPTERS,WISH_GUESTS,WISH_FOODS,wishRoundsForGrade,planWishFestival,
 checkWishFood,checkWishSecond,checkWishIntent,checkWishSentence,wishIntentOptions,
 type WishChapter,type WishFood,type WishIntent,type WishPlan}
 from '@/lib/learning/wishFestivalEngine';
import './wish-festival.css';

type Screen='welcome'|'lesson'|'play'|'reward';
type WishReason='sweet'|'juicy'|'crunchy';
interface Props{
 profileId:string;gradeLevel:number|null;englishLevel:EnglishPlacement;
 history:readonly SentenceAnswerEvidence[];knownFoods:readonly string[];
 onExit:()=>void;onComplete:(rows:SentenceAnswerEvidence[])=>void;
}
interface WishDraft{
 version:1;profileId:string;gradeLevel:number|null;englishLevel:EnglishPlacement;
 plan:WishPlan;index:number;phase:'lesson'|'play';answers:SentenceAnswerEvidence[];
 sessionId:string;elapsed:number;at:number;
 selectedFood:WishFood|null;selectedSecond:WishFood|null;selectedIntent:WishIntent|null;
 selectedReason:WishReason|null;politeChosen:boolean;
 words:string[];mistakes:number;hintUsed:boolean;modelHeard:boolean;
 independent:number;bestStreak:number;streak:number;pendingSave?:boolean;
}
const STORAGE_PREFIX='ventra:wish-festival:checkpoint:v1:';
const clock=(seconds:number)=>String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
function recoverable(value:unknown,profileId:string,grade:number|null,level:EnglishPlacement):value is WishDraft{
 if(!value||typeof value!=='object')return false;
 const v=value as Partial<WishDraft>,p=v.plan;
 if(v.version!==1||v.profileId!==profileId||v.gradeLevel!==grade||v.englishLevel!==level||
  !p||p.deck?.mission!==5||p.grade!==grade||p.englishLevel!==level||
  !Array.isArray(p.trials)||p.trials.length!==p.deck.questions.length||
  p.trials.length!==4*p.roundsPerChapter||p.roundsPerChapter!==wishRoundsForGrade(grade)||
  !Number.isInteger(v.index)||v.index!<0||v.index!>=p.trials.length||
  (v.phase!=='lesson'&&v.phase!=='play')||!Array.isArray(v.answers)||
  !(v.answers.length===v.index||v.pendingSave&&v.answers.length===p.trials.length)||
  !Array.isArray(v.words)||v.words.some(x=>typeof x!=='string')||
  typeof v.sessionId!=='string'||!v.sessionId.startsWith('wish:'+profileId+':')||
  typeof v.elapsed!=='number'||!Number.isFinite(v.elapsed)||v.elapsed<0||
  typeof v.at!=='number'||Math.abs(Date.now()-v.at)>7*24*3600*1000)return false;
 return p.trials.every((t,i)=>t.question.id===p.deck.questions[i]?.id&&t.question.mission===5)&&
  v.answers.every((row,i)=>row.questionId===p.deck.questions[i]?.id&&row.skill==='preference'&&
   row.placement===level&&Number.isInteger(row.mistakes)&&row.mistakes>=0&&
   typeof row.hintUsed==='boolean'&&typeof row.modelHeard==='boolean'&&
   row.firstTryCorrect===(row.mistakes===0&&!row.hintUsed&&!row.modelHeard)&&
   Number.isFinite(Date.parse(row.timestamp)));
}
export function WishFestivalAdventure({profileId,gradeLevel,englishLevel,history,knownFoods,onExit,onComplete}:Props){
 const [screen,setScreen]=useState<Screen>('welcome');
 const [plan,setPlan]=useState<WishPlan|null>(null);
 const [index,setIndex]=useState(0);
 const [chosenFood,setChosenFood]=useState<WishFood|null>(null);
 const [chosenSecond,setChosenSecond]=useState<WishFood|null>(null);
 const [chosenIntent,setChosenIntent]=useState<WishIntent|null>(null);
 const [chosenReason,setChosenReason]=useState<WishReason|null>(null);
 const [politeChosen,setPoliteChosen]=useState(false);
 const [picked,setPicked]=useState<string[]>([]);
 const [mistakes,setMistakes]=useState(0);
 const [hintUsed,setHintUsed]=useState(false);
 const [modelHeard,setModelHeard]=useState(false);
 const [wrongSlot,setWrongSlot]=useState(-1);
 const [feedback,setFeedback]=useState('');
 const [feedbackError,setFeedbackError]=useState(false);
 const [served,setServed]=useState(false);
 const [saving,setSaving]=useState(false);
 const [saveError,setSaveError]=useState('');
 const [stars,setStars]=useState(0);
 const [elapsed,setElapsed]=useState(0);
 const [streak,setStreak]=useState(0);
 const [bestStreak,setBestStreak]=useState(0);
 const [independent,setIndependent]=useState(0);
 const [resumed,setResumed]=useState(false);
 const done=useRef<SentenceAnswerEvidence[]>([]);
 const session=useRef('');
 const startTime=useRef(0);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const loadingCheckpoint=useRef(false);
 const locked=useRef(false);
 const savingLock=useRef(false);
 const retryRows=useRef<SentenceAnswerEvidence[]|null>(null);
 const root=useRef<HTMLDivElement>(null);
 const trial=plan?.trials[index]??null,question=trial?.question??null;
 const chapter=trial?.chapter??1,meta=WISH_CHAPTERS[chapter-1];
 const rounds=plan?.roundsPerChapter??wishRoundsForGrade(gradeLevel);
 const round=index%rounds+1,total=plan?.trials.length??rounds*4;
 const tiles=useMemo(()=>question?plazaWordTiles(question,(plan?.deck.seed??0)^(index*1039)):[],
  [question,plan?.deck.seed,index]);
 const selectedWords=picked.map(id=>tiles.find(t=>t.id===id)?.word??'');
 const needsSecond=chapter===4&&!(englishLevel==='A2'&&gradeLevel!=null&&gradeLevel<=2);
 const needsReason=chapter===4&&englishLevel==='A2';
 const ready=Boolean(trial&&chosenFood===trial.food&&
  (chapter!==1&&chapter!==3||chosenIntent===trial.intent)&&
  (chapter!==2||politeChosen)&&
  (chapter!==4||(!needsSecond||chosenSecond===trial.second)&&
    (!needsReason||chosenReason===trial.reason)));
 const progress=plan?100*(index+(served?1:0))/plan.trials.length:0;
 const clearTimer=()=>{if(timer.current!==null){clearTimeout(timer.current);timer.current=null;}};
 const clearDraft=()=>{try{window.localStorage.removeItem(STORAGE_PREFIX+profileId);}catch{}};
 function resetRound(){
  setChosenFood(null);setChosenSecond(null);setChosenIntent(null);setChosenReason(null);
  setPoliteChosen(false);setPicked([]);setMistakes(0);setHintUsed(false);setModelHeard(false);
  setWrongSlot(-1);setFeedback('');setFeedbackError(false);setServed(false);setSaveError('');
 }
 useEffect(()=>{
  soundService.setMusicScene('wishes');
  return()=>{clearTimer();soundService.cancelSpeech();soundService.setMusicScene('plaza');};
 },[]);
 useEffect(()=>{
  if(loadingCheckpoint.current)return;
  loadingCheckpoint.current=true;
  try{
   const raw=window.localStorage.getItem(STORAGE_PREFIX+profileId);
   if(!raw)return;
   const object:unknown=JSON.parse(raw);
   if(!recoverable(object,profileId,gradeLevel,englishLevel)){clearDraft();return;}
   const saved=object;
   session.current=saved.sessionId;done.current=saved.answers;
   startTime.current=Date.now()-saved.elapsed*1000;
   setPlan(saved.plan);setIndex(saved.index);setElapsed(saved.elapsed);setResumed(true);
   setStreak(saved.streak);setBestStreak(saved.bestStreak);setIndependent(saved.independent);
   if(saved.pendingSave){
    setServed(true);setSaveError('Oturum tamamlandı; ödül kaydını güvenle yeniden dene.');
    retryRows.current=saved.answers;setScreen('play');
   }else{
    setChosenFood(saved.selectedFood);setChosenSecond(saved.selectedSecond);
    setChosenIntent(saved.selectedIntent);setChosenReason(saved.selectedReason);
    setPoliteChosen(saved.politeChosen);setPicked(saved.words);
    setMistakes(saved.mistakes);setHintUsed(saved.hintUsed);setModelHeard(saved.modelHeard);
    setScreen(saved.phase);
   }
  }catch(error){
   console.warn('İstekler Meydanı devam kaydı okunamadı',error);clearDraft();
  }
 },[profileId,gradeLevel,englishLevel]);
 useEffect(()=>{
  if(!plan||screen==='reward'||!startTime.current)return;
  try{
   const rows=done.current;
   const pendingSave=served&&rows.length===plan.trials.length;
   const skip=served&&rows.length===index+1&&index+1<plan.trials.length;
   const next=skip?index+1:index;
   const nextLesson=skip&&plan.trials[next].chapter!==plan.trials[index].chapter;
   const draft:WishDraft={
    version:1,profileId,gradeLevel,englishLevel,plan,index:next,
    phase:nextLesson?'lesson':screen==='lesson'?'lesson':'play',
    answers:rows,sessionId:session.current,elapsed:(Date.now()-startTime.current)/1000,
    at:Date.now(),selectedFood:skip?null:chosenFood,selectedSecond:skip?null:chosenSecond,
    selectedIntent:skip?null:chosenIntent,selectedReason:skip?null:chosenReason,
    politeChosen:skip?false:politeChosen,words:skip?[]:picked,
    mistakes:skip?0:mistakes,hintUsed:skip?false:hintUsed,modelHeard:skip?false:modelHeard,
    independent,bestStreak,streak,pendingSave
   };
   window.localStorage.setItem(STORAGE_PREFIX+profileId,JSON.stringify(draft));
  }catch(error){console.warn('İstekler Meydanı devam kaydı yazılamadı',error);}
 },[plan,screen,index,served,chosenFood,chosenSecond,chosenIntent,chosenReason,politeChosen,
  picked,mistakes,hintUsed,modelHeard,independent,streak,bestStreak,gradeLevel,englishLevel,profileId]);
 useEffect(()=>{
  if(!startTime.current||screen==='reward')return;
  const id=setInterval(()=>setElapsed(Math.max(0,Math.floor((Date.now()-startTime.current)/1000))),1000);
  return()=>clearInterval(id);
 },[screen]);
 useEffect(()=>{if(screen==='play')root.current?.querySelector<HTMLElement>('.wf-cue')?.focus();},[screen,index]);
 function speech(text:string,model=false){
  soundService.unlockAudio();
  const ok=soundService.speakEnglish(text,{rate:gradeLevel!==null&&gradeLevel<=2?.77:.88});
  if(ok&&model)setModelHeard(true);
  if(!ok)setFeedback('Bu cihazda İngilizce seslendirme bulunamadı. Yazılı ipuçları kullanılabilir.');
 }
 function begin(){
  try{
   const seed=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;
   const next=planWishFestival({grade:gradeLevel,englishLevel,seed,history,knownFoods});
   if(next.trials.length!==next.roundsPerChapter*4)throw Error('Festival curriculum incomplete');
   session.current='wish:'+profileId+':'+Date.now()+':'+Math.random().toString(36).slice(2);
   startTime.current=Date.now();locked.current=false;savingLock.current=false;
   done.current=[];retryRows.current=null;setIndex(0);resetRound();
   setIndependent(0);setStreak(0);setBestStreak(0);setElapsed(0);setResumed(false);
   setPlan(next);setScreen('lesson');soundService.playSfx('whoosh',.65);
  }catch(error){console.error('Festival planı oluşturulamadı',error);
   setFeedbackError(true);setFeedback('Bu sınıf ve dil seviyesi için görev hazırlanamadı. Önceki ilerlemen korundu.');}
 }
 function wrong(message:string){
  if(locked.current||savingLock.current)return;
  setMistakes(m=>m+1);setStreak(0);setFeedbackError(true);setFeedback(message);
  soundService.playSfx('gentle_retry',.65);
 }
 function foodChoice(food:WishFood){
  if(!trial||locked.current||saving||served)return;
  if(!chosenFood){
   if(!checkWishFood(trial,food)){wrong('Bu ürün, festival konuğunun istediği yiyecek değil. Yönergedeki yiyeceği tekrar oku.');return;}
   setChosenFood(food);soundService.playSfx('tap',.52);setFeedbackError(false);
   setFeedback(chapter===4?'Ürünü buldun. Şimdi ikinci anlamlı seçimini yap.':'Doğru ürün! Şimdi İngilizceyle ne söyleyeceğini belirle.');
   return;
  }
  if(chapter===4&&needsSecond&&!chosenSecond){
   if(food===chosenFood){wrong('İkinci seçim farklı bir yiyecek olmalı.');return;}
   if(!checkWishSecond(trial,food)){wrong('Bu ikinci ürün verilen karşılaştırma veya birleşimle uyuşmuyor.');return;}
   setChosenSecond(food);soundService.playSfx('tap',.45);setFeedbackError(false);
   setFeedback(needsReason?'Doğru! Şimdi İngilizce nedenini seç.':'İki ürün hazır. İngilizce cümleyi kur.');
  }
 }
 function intentChoice(intent:WishIntent){
  if(!trial||!chosenFood||chosenIntent||locked.current||saving)return;
  if(!checkWishIntent(trial,intent)){wrong('Bu cevap isteğin anlamını değiştirdi. Like, want ve not like farklıdır.');return;}
  setChosenIntent(intent);setFeedbackError(false);soundService.playSfx('tap',.45);
  setFeedback('Anlamı doğru belirledin. İngilizce cümleyi tamamla.');
 }
 function politeChoice(word:string){
  if(!trial||!chosenFood||politeChosen||locked.current)return;
  if(word!=='please'){wrong('Kibar rica cümlesini tamamlayan kelimeyi seç: lütfen.');return;}
  setPoliteChosen(true);soundService.playSfx('tap',.45);
  setFeedback('Kibar seçimi yaptın. Şimdi tam sipariş cümlesini oluştur.');
  setFeedbackError(false);
 }
 function reasonChoice(reason:WishReason){
  if(!trial||!chosenFood||needsSecond&&!chosenSecond||chosenReason||locked.current)return;
  if(reason!==trial.reason){wrong('Bu yiyeceğin özelliğine tekrar bak: tatlı, sulu veya çıtır mı?');return;}
  setChosenReason(reason);setFeedbackError(false);soundService.playSfx('tap',.45);
  setFeedback('Nedenini buldun. Şimdi because ile cümleyi kur.');
 }
 function pickWord(id:string){
  if(!question||!ready||locked.current||saving||picked.includes(id)||picked.length>=question.tokens.length)return;
  setPicked(old=>[...old,id]);setWrongSlot(-1);setFeedback('');setFeedbackError(false);
  soundService.playSfx('tap',.34);
 }
 function hint(){
  if(!question||locked.current)return;
  setHintUsed(true);setFeedbackError(false);
  setFeedback(question.explanation+' Bir sonraki İngilizce kelime: '+(question.tokens[picked.length]??question.tokens[0]));
 }
 async function finish(rows:SentenceAnswerEvidence[]){
  if(savingLock.current||!plan)return;
  savingLock.current=true;setSaving(true);setSaveError('');retryRows.current=rows;
  try{
   const progress=await saveSentencePlazaMission({
    repo:getProgressRepository(),profileId,mission:5,plan:plan.deck,answers:rows,
    sessionId:session.current,durationSeconds:(Date.now()-startTime.current)/1000
   });
   setStars(progress.starsByLevel[5]??1);
   clearDraft();setScreen('reward');soundService.playSfx('fanfare',.9);onComplete(rows);
  }catch(error){
   console.error('Festival kayıt hatası',error);
   setSaveError('Festival tamamlandı ancak ilerleme kaydı doğrulanamadı. Aynı oturumu tekrar kaydet.');
   setFeedbackError(true);
  }finally{savingLock.current=false;setSaving(false);}
 }
 function submit(){
  if(!trial||!question||!ready||locked.current||saving||saveError)return;
  if(picked.length<question.tokens.length){
   setFeedback('Cümlede eksik sözcük var. Bütün cümleyi tamamla.');setFeedbackError(true);return;
  }
  if(!checkWishSentence(trial,selectedWords)){
   const error=question.tokens.findIndex((w,i)=>w!==selectedWords[i]);
   setWrongSlot(error);wrong('Cümlenin '+(error+1)+'. kelimesini kontrol et. '+question.explanation);return;
  }
  locked.current=true;setServed(true);setFeedbackError(false);
  setFeedback('✦ '+question.sentence+' — Konuğunun dileği İngilizceyle yerine geldi!');
  const evidence:SentenceAnswerEvidence={
   questionId:trial.id,skill:'preference',placement:englishLevel,
   sentenceKind:question.kind,challengeMode:question.mode,mistakes,hintUsed,modelHeard,
   firstTryCorrect:mistakes===0&&!hintUsed&&!modelHeard,timestamp:new Date().toISOString()
  };
  const all=[...done.current,evidence];done.current=all;
  if(evidence.firstTryCorrect){setIndependent(v=>v+1);setStreak(v=>{setBestStreak(b=>Math.max(b,v+1));return v+1;});}
  else setStreak(0);
  soundService.playSfx('correct',.82);
  speech(question.sentence);
  const duration=Math.max(2400,Math.min(5200,1250+question.tokens.length*220));
  clearTimer();
  timer.current=setTimeout(()=>{
   timer.current=null;locked.current=false;soundService.cancelSpeech();
   if(index+1>=plan!.trials.length){void finish(all);return;}
   const change=plan!.trials[index+1].chapter!==trial.chapter;
   setIndex(i=>i+1);resetRound();
   if(change){setScreen('lesson');soundService.playSfx('whoosh',.55);}
  },duration);
 }
 const dialogue=trial?(chapter===3?
  trial.intent==='want'?'What would you like?':'Do you like this food?':
  chapter===2?'Welcome! What would you like?':
  chapter===1?'What do you like?':'Let’s prepare the festival table!'):'Welcome to the festival!';
 const foodAllowed=screen==='play'&&!served&&!saving&&Boolean(trial)&&
  (!chosenFood||chapter===4&&needsSecond&&!chosenSecond);
 const visual=<WishFestivalStage chapter={chapter} guest={trial?.guest??'mila'}
  chosen={chosenFood} secondary={chosenSecond}
  avoidPrimary={trial?.intent==='dislike'} avoided={chapter===4&&englishLevel==='A1'}
  served={served} dialogue={dialogue} activeChoice={foodAllowed} disabled={saving||locked.current}
  onFood={foodChoice}/>;
 const estimates=plan?.estimatedMinutes??(gradeLevel!=null&&gradeLevel<=2?[8,12]:gradeLevel!=null&&gradeLevel>=5?[14,19]:[11,16]);
 const chapterTrack=WISH_CHAPTERS.map(item=><div key={item.id} className="wf-chapter"
  data-current={screen!=='welcome'&&item.id===chapter}
  data-past={screen!=='welcome'&&item.id<chapter}>
  <span className="wf-chapter-ico">{item.icon}</span>
  <span><strong>{item.id}. {item.title}</strong><small>{item.short}</small></span></div>);
 return <div className="wf-root" role="dialog" aria-modal="true" aria-label="İstekler Meydanı İngilizce festival oyunu"
  onPointerDown={e=>e.stopPropagation()} ref={root}>
  <div className="wf-shell">
   <header className="wf-header">
    <div className="wf-title-line"><div className="wf-emblem" aria-hidden="true">❧</div>
     <div><div className="wf-overline">VENTRA · CÜMLE MEYDANI · BÖLÜM 5</div>
      <h1>İstekler Meydanı</h1><small>Konuş, anlaş, paylaş. İngilizceyle canlanan festival.</small></div></div>
    <div className="wf-header-actions"><span className="wf-pill">🎓 {gradeLevel??'—'}. sınıf · {englishLevel}</span>
     <span className="wf-pill">◷ {clock(elapsed)} · Süre sınırı yok</span>
     <button type="button" className="wf-back" disabled={saving}
      onClick={()=>{clearTimer();soundService.cancelSpeech();onExit();}}>← Cümle Meydanı</button></div>
   </header>
   {resumed&&screen!=='reward'&&<div role="status" className="wf-notice">
    ↻ Yarım kalan festivalin bu cihazda kayıtlı. Kaldığın İngilizce görevine geri döndün.</div>}
   {screen==='welcome'?<>
    <section className="wf-intro"><div><div className="wf-overline">DİLEKLER FESTİVALİ · İNGİLİZCE MACERA</div>
     <h2>Bu festivalin dili İngilizce.</h2>
     <p>Dört özel durak, dört farklı iletişim becerisi. Bir ürünü seçmek yetmez: neyi sevdiğini,
      ne istediğini ve nedenini anlaşılır İngilizceyle anlat.</p></div>
     <div className="wf-duration"><strong>{estimates[0]}–{estimates[1]}</strong><span>dakika · tahmini</span></div></section>
    <div className="wf-chapter-track">{chapterTrack}</div>
    <div className="wf-layout">{visual}<aside className="wf-panel">
     <div className="wf-overline">SENİN FESTİVAL KARNEN</div><h2>Gerçek konuşmalar, gerçek tepkiler.</h2>
     <p>Festival misafirleri farklı yiyecekler seviyor. Tezgâhlara dokun, kibarca rica et,
      olumsuzlukları ayırt et ve diyalogları tamamla.</p>
     <div className="wf-preview-stats">
      <div><strong>4</strong>farklı durak</div>
      <div><strong>{rounds*4}</strong>İngilizce görev</div>
      <div><strong>∞</strong>tekrar oynama</div></div>
     <div className="wf-teacher"><strong>ÖĞRENME SÖZÜMÜZ</strong>
      <span>İngilizce bilmek, yalnızca kelime tanımak değildir. Doğru niyetle doğru cümleyi kurmaktır.</span>
     </div>
     <p className="wf-fine">Süre baskısı yok; ses ve ipuçları isteğe bağlı. Yarım kalan görevler aynı cihazda saklanır.
      Destekli cevaplar bağımsız başarılardan ayrı kaydedilir.</p>
     {feedback&&<p role="alert" className="wf-feedback" data-error={feedbackError}>{feedback}</p>}
     <button className="wf-primary" type="button" onClick={begin}>✦ Dilekler Festivaline Gir</button>
    </aside></div>
   </>:screen==='reward'?<div className="wf-reward" role="status">
    <div className="wf-overline">DİLEKLER FESTİVALİ TAMAMLANDI · PROFİL KAYDI</div>
    <div className="wf-reward-stars" aria-label={stars+' yıldız'}>{'★'.repeat(stars)}</div>
    <h2>Festival senin İngilizcenle canlandı!</h2>
    <p>Beğenilerini, isteklerini, kibar ricayı ve karşılaştırmaları kullanarak gerçek
     iletişim görevlerini tamamladın. Kayıtların kendi profiline eklendi.</p>
    <div className="wf-summary">
     <div><strong>{total}</strong>cümle</div><div><strong>{independent}</strong>bağımsız</div>
     <div><strong>{bestStreak}</strong>en iyi seri</div><div><strong>{clock(elapsed)}</strong>süre</div></div>
    <button className="wf-primary" type="button" onClick={begin}>↻ Farklı Festival Macerası</button>
    <button className="wf-back" style={{marginTop:14}} type="button" onClick={onExit}>Cümle Meydanı’na Dön</button>
   </div>:<>
    <section className="wf-status"><div>
     <div className="wf-overline">DURAK {chapter}/4 · {screen==='play'?round+'/'+rounds+' görev':'ÖĞRENME KILAVUZU'}</div>
     <h2>{meta.icon} {meta.title}</h2><p>{meta.objective}</p>
    </div><div className="wf-duration"><strong>{index+1}/{total}</strong><span>görev</span></div></section>
    <div className="wf-chapter-track">{chapterTrack}</div>
    <div className="wf-progress-bar" role="progressbar" aria-label="Festival ilerlemesi"
     aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
     <span style={{width:progress+'%'}}/></div>
    <div className="wf-layout">{visual}<aside className="wf-panel">
     {screen==='lesson'?<>
      <div className="wf-overline">ÖNCE ÖĞREN · SONRA GERÇEK FESTİVALDE UYGULA</div>
      <h2>İngilizcenle neyi anlatacaksın?</h2>
      <p>{meta.objective}</p>
      <div className="wf-teacher"><strong>BU DURAKTA ÖĞRENİYORUZ</strong><span>{meta.rule}</span></div>
      <div className="wf-teacher"><strong>ÖRNEK CÜMLE</strong><span>{meta.sample}</span>
       <small>{meta.translation}</small></div>
      <div className="wf-toolbar"><button type="button" className="wf-minor" onClick={()=>speech(meta.sample)}>
       🔊 İngilizce örneği dinle</button></div>
      <p className="wf-fine">Bu örnek, bir sonraki görevin cevabı değil.
       Öğrendiğin yapıyı yeni yiyecek ve karakterlerle kendi başına kullanacaksın.</p>
      <button type="button" className="wf-primary" onClick={()=>{resetRound();setScreen('play');soundService.playSfx('whoosh',.48);}}>
       ✨ {meta.title} Başlasın</button>
     </>:trial&&question?<>
      <div className="wf-overline">✦ {WISH_GUESTS.find(g=>g.id===trial.guest)?.name} İLE İNGİLİZCE GÖREVİ</div>
      <h2>İsteği anla. Doğru cümleyi kur.</h2>
      <div className="wf-cue-wrap"><h3 tabIndex={-1} className="wf-cue">{question.cue}</h3>
       <p>{chapter===1?'Önce doğru yiyeceği seç, sonra beğeniyi anlat.':
         chapter===2?'Ürünü bul. Nezaket kelimesini seç. Kibarca rica et.':
         chapter===3?'Konuğun sorusuna uygun niyeti seç ve İngilizce yanıt ver.':
         'Sofraya doğru yiyecekleri seç, karşılaştır ve cümleyi tamamla.'}</p></div>
      {(chapter===1||chapter===3)&&chosenFood&&<div className="wf-intent" role="group" aria-label="İngilizce iletişim niyeti">
       <strong>İngilizceyle ne söyleyeceksin?</strong>
       <div>{wishIntentOptions(englishLevel).map(o=><button key={o.id} type="button"
        className="wf-intent-choice" data-selected={chosenIntent===o.id}
        disabled={Boolean(chosenIntent)||served||saving}
        onClick={()=>intentChoice(o.id)}><b>{o.en}</b><small>{o.tr}</small></button>)}</div></div>}
      {chapter===2&&chosenFood&&!politeChosen&&<div className="wf-intent" role="group" aria-label="Kibar İngilizce rica sözcüğünü seç">
       <strong>Rica ederken hangi kelimeyi kullanırsın?</strong>
       <div>{['now','please','never'].map(o=><button key={o} type="button" className="wf-intent-choice"
        disabled={served||saving} onClick={()=>politeChoice(o)}><b>{o}</b></button>)}</div></div>}
      {chapter===4&&chosenFood&&needsSecond&&!chosenSecond&&
       <div className="wf-intent"><strong>Şimdi tezgâhtan ikinci yiyeceği seç.</strong>
        <p>{englishLevel==='Pre-A1'?'Sevdiğin iki yiyeceği and ile birleştir.':
         englishLevel==='A1'?'İstediğin ürünle istemediğin ürünü but ile karşılaştır.':
         'Hangi yiyeceği diğerine tercih ettiğini belirt.'}</p></div>}
      {chapter===4&&chosenFood&&(!needsSecond||chosenSecond)&&needsReason&&!chosenReason&&
       <div className="wf-intent" role="group" aria-label="Yiyeceğin İngilizce özelliğini seç">
        <strong>Bu yiyeceği neden seviyorsun?</strong>
        <div>{[{id:'sweet',tr:'tatlı'},{id:'juicy',tr:'sulu'},{id:'crunchy',tr:'çıtır'}].map(o=>
         <button type="button" key={o.id} className="wf-intent-choice" disabled={served||saving}
          onClick={()=>reasonChoice(o.id as WishReason)}><b>{o.id}</b><small>{o.tr}</small></button>)}</div>
       </div>}
      {ready&&<div className="wf-builder">
       <div className="wf-builder-heading"><b>✧ İngilizce Cümle Atölyesi</b><span>{picked.length}/{question.tokens.length} kelime</span></div>
       <div className="wf-slots" role="group" aria-label="Kurduğun İngilizce cümle">
        {question.tokens.map((word,i)=><button key={i} type="button" className="wf-slot"
         data-filled={Boolean(selectedWords[i])} data-wrong={wrongSlot===i}
         disabled={!selectedWords[i]||served||saving}
         aria-label={selectedWords[i]?selectedWords[i]+' kelimesini çıkar':'Boş kelime alanı'}
         onClick={()=>{setPicked(old=>old.filter((_,j)=>i!==j));setWrongSlot(-1);}}>
         {selectedWords[i]??'✧'}</button>)}</div>
       <div className="wf-tiles" role="group" aria-label="İngilizce cümle kelimeleri">
        {tiles.map(item=><button key={item.id} type="button" className="wf-tile"
         disabled={picked.includes(item.id)||picked.length>=question.tokens.length||served||saving}
         onClick={()=>pickWord(item.id)}>{item.word}</button>)}</div>
      </div>}
      {!ready&&<p className="wf-guide">Önce festivalin içindeki yiyecek ve anlam seçimlerini tamamla.
       İngilizce cümle atölyesi ardından açılır.</p>}
      <div className="wf-toolbar">
       <button className="wf-minor" type="button" disabled={!picked.length||served||saving}
        onClick={()=>{setPicked(old=>old.slice(0,-1));setWrongSlot(-1);}}>↶ Geri Al</button>
       <button className="wf-minor" type="button" disabled={served||saving}
        onClick={()=>speech(question.sentence,true)}>🔊 Tam Cümleyi Dinle</button>
       <button className="wf-minor" type="button" disabled={served||saving} onClick={hint}>💡 Dil İpucu</button>
      </div>
      {feedback&&<div className="wf-feedback" data-error={feedbackError} role="status" aria-live="polite">{feedback}</div>}
      {saveError&&<div role="alert" className="wf-feedback" data-error="true">{saveError}
       <button type="button" className="wf-primary" disabled={saving}
        onClick={()=>{if(retryRows.current)void finish(retryRows.current);}}>Kaydı Güvenle Tekrar Dene</button></div>}
      {!served&&<button type="button" className="wf-primary" disabled={!ready||picked.length!==question.tokens.length||saving||Boolean(saveError)}
       onClick={submit}>✦ İngilizceyle Dileği Gerçekleştir</button>}
      {served&&<div className="wf-success" role="status">✦ İngilizce cümlen kabul edildi. Sonraki görev otomatik başlıyor.</div>}
      <p className="wf-fine">Süre cezası yok. İpucu veya tam cevap dinleme kullanıldıysa
       çözüm yardım alınmış olarak kaydedilir; yanlışları düzelterek devam edebilirsin.</p>
     </>:null}
    </aside></div>
   </>}
  </div>
 </div>;
}
