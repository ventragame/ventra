'use client';
import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';
import type {SentenceAnswerEvidence} from '@ventra/shared';
import type {EnglishPlacement} from '@/lib/learning/gradeAwareLearningPolicy';
import {soundService} from '@/lib/audio/SoundService';
import {getProgressRepository} from '@/lib/progress';
import {saveSentencePlazaMission} from '@/lib/progress/sentencePlazaProgress';
import {plazaWordTiles} from '@/lib/learning/sentencePlazaEngine';
import {MovementMagicStage} from './MovementMagicStage';
import {MAGIC_VERBS,MOVEMENT_CHAPTERS,checkMagicAction,checkMagicPlace,
 checkMagicRepair,checkMagicSentence,planMovementMagic,movementQuestionsPerChapter,
 type MagicVerb,type MagicPlace,type MovementPlan,type MovementTrial}
 from '@/lib/learning/movementMagicEngine';
import './movement-magic.css';

type Phase='welcome'|'chapter'|'play'|'reward';
interface Props{
 profileId:string;gradeLevel:number|null;englishLevel:EnglishPlacement;
 history:readonly SentenceAnswerEvidence[];onExit:()=>void;onComplete:(rows:SentenceAnswerEvidence[])=>void;
}
const STAGE_ICONS:Record<MagicVerb,string>={fly:'🪽',jump:'✦',run:'➜',sleep:'☾'};
const CLOCK=(seconds:number)=>String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
export function MovementMagicAdventure({profileId,gradeLevel,englishLevel,history,onExit,onComplete}:Props){
 const [phase,setPhase]=useState<Phase>('welcome');
 const [plan,setPlan]=useState<MovementPlan|null>(null);
 const [index,setIndex]=useState(0);
 const [chosenAction,setChosenAction]=useState<MagicVerb|null>(null);
 const [chosenPlace,setChosenPlace]=useState<MagicPlace|null>(null);
 const [repairFixed,setRepairFixed]=useState(false);
 const [picked,setPicked]=useState<string[]>([]);
 const [wrongSlot,setWrongSlot]=useState(-1);
 const [mistakes,setMistakes]=useState(0);
 const [assisted,setAssisted]=useState(false);
 const [heardModel,setHeardModel]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [feedbackError,setFeedbackError]=useState(false);
 const [activated,setActivated]=useState(false);
 const [saving,setSaving]=useState(false);
 const [saveError,setSaveError]=useState('');
 const [rewardStars,setRewardStars]=useState(0);
 const [seconds,setSeconds]=useState(0);
 const [streak,setStreak]=useState(0);
 const [bestStreak,setBestStreak]=useState(0);
 const [independentCount,setIndependentCount]=useState(0);
 const answersRef=useRef<SentenceAnswerEvidence[]>([]);
 const startedAt=useRef(0);
 const sessionIdRef=useRef('');
 const pending=useRef<ReturnType<typeof setTimeout>|null>(null);
 const advancing=useRef(false);
 const saveLock=useRef(false);
 const finishedRef=useRef<SentenceAnswerEvidence[]|null>(null);
 const rootRef=useRef<HTMLDivElement>(null);
 const trial=plan?.trials[index]??null;
 const question=trial?.question??null;
 const stage=trial?.chapter??1;
 const meta=MOVEMENT_CHAPTERS[stage-1];
 const perChapter=plan?.roundsPerChapter??movementQuestionsPerChapter(gradeLevel);
 const currentChapterRound=index%perChapter+1;
 const tiles=useMemo(()=>question?plazaWordTiles(question,(plan?.deck.seed??0)^(index*16807)):[],
  [question,plan?.deck.seed,index]);
 const selectedWords=picked.map(id=>tiles.find(w=>w.id===id)?.word??'');
 const requiredAction=trial?.challenge==='action'||trial?.challenge==='final';
 const requiredPlace=trial?.challenge==='destination'||trial?.challenge==='final';
 const needsRepair=trial?.challenge==='repair';
 const prepared=Boolean(trial&&(!requiredAction||chosenAction===trial.verb)
  &&(!requiredPlace||chosenPlace===trial.place)&&(!needsRepair||repairFixed));
 const isComplete=Boolean(trial&&picked.length===trial.question.tokens.length);
 const percent=plan?100*(index+(activated?1:0))/plan.trials.length:0;
 const clearPending=()=>{if(pending.current!==null){clearTimeout(pending.current);pending.current=null;}};
 const speak=(text:string,fullAnswer=false)=>{
  soundService.unlockAudio();
  const played=soundService.speakEnglish(text,{rate:gradeLevel!==null&&gradeLevel<=2?.75:.86});
  if(played&&fullAnswer)setHeardModel(true);
  if(!played)setFeedback('Bu cihazda İngilizce seslendirme kullanılamıyor. Yazılı açıklama ve ipucu kullanılabilir.');
 };
 useEffect(()=>{
  soundService.setMusicScene('movement');
  return()=>{clearPending();soundService.cancelSpeech();soundService.setMusicScene('plaza');};
 },[]);
 useEffect(()=>{
  if(!startedAt.current||phase==='reward')return;
  const id=setInterval(()=>setSeconds(Math.max(0,Math.floor((Date.now()-startedAt.current)/1000))),1000);
  return()=>clearInterval(id);
 },[phase]);
 useEffect(()=>{
  if(phase==='play')rootRef.current?.querySelector<HTMLElement>('.mm-cue')?.focus();
 },[phase,index]);
 const resetRound=()=>{
  setChosenAction(null);setChosenPlace(null);setRepairFixed(false);setPicked([]);
  setMistakes(0);setAssisted(false);setHeardModel(false);setWrongSlot(-1);
  setFeedback('');setFeedbackError(false);setActivated(false);setSaveError('');
 };
 function begin(){
  const seed=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;
  try{
   const built=planMovementMagic({grade:gradeLevel,englishLevel,seed,history});
   if(built.trials.length!==built.roundsPerChapter*4)throw Error('Incomplete action curriculum');
   sessionIdRef.current='movement:'+profileId+':'+Date.now()+':'+Math.random().toString(36).slice(2);
   startedAt.current=Date.now();
   answersRef.current=[];finishedRef.current=null;
   saveLock.current=false;advancing.current=false;
   setIndex(0);resetRound();setIndependentCount(0);setStreak(0);setBestStreak(0);
   setSeconds(0);setPlan(built);setPhase('chapter');
   soundService.playSfx('whoosh',.6);
  }catch(error){
   console.error('Hareket Büyüsü öğrenme planı hatası',error);
   setFeedbackError(true);setFeedback('Dil ve sınıfına uygun görevler hazırlanamadı; mevcut ilerlemen korunuyor.');
  }
 }
 const incorrect=(message:string)=>{
  if(advancing.current||saveLock.current)return;
  setMistakes(x=>x+1);setStreak(0);setFeedbackError(true);setFeedback(message);
  soundService.playSfx('gentle_retry',.64);
 };
 function actionChoice(action:MagicVerb){
  if(!trial||!requiredAction||chosenAction||advancing.current)return;
  if(!checkMagicAction(trial,action)){
   incorrect('Bu hareket bu karaktere ait değil. İngilizce eylem ile hayvanın yapabileceği şeyi eşleştir.');
   return;
  }
  setChosenAction(action);setFeedbackError(false);
  setFeedback('Hareketi buldun. '+(requiredPlace?'Şimdi sahnede konumu seç.':'İngilizce cümleyi oluştur.'));
  soundService.playSfx('tap',.42);
 }
 function placeChoice(place:MagicPlace){
  if(!trial||!requiredPlace||chosenPlace||advancing.current||requiredAction&&!chosenAction)return;
  if(!checkMagicPlace(trial,place)){
   incorrect('Seçtiğin yer verilen konumla uyuşmuyor. Konum sözcüğünü ve sahneyi karşılaştır.');
   return;
  }
  setChosenPlace(place);setFeedbackError(false);
  setFeedback('Doğru konum! Şimdi hareketi İngilizce cümlede anlat.');
  soundService.playSfx('tap',.45);
 }
 function repairChoice(i:number){
  if(!trial||!needsRepair||repairFixed||advancing.current)return;
  if(!checkMagicRepair(trial,i)){
   incorrect('Bu kelime doğru olabilir. Can + fiilin yalın hâli, is + fiil-ing kuralını hatırla.');
   return;
  }
  setRepairFixed(true);setFeedbackError(false);
  setFeedback('Dil bilgisi hatasını yakaladın! Şimdi cümlenin doğrusunu kur.');
  soundService.playSfx('correct',.38);
 }
 function addWord(id:string){
  if(!question||!prepared||advancing.current||saving||picked.includes(id)||picked.length>=question.tokens.length)return;
  setPicked(old=>[...old,id]);setWrongSlot(-1);setFeedback('');setFeedbackError(false);
  soundService.playSfx('tap',.35);
 }
 function removeWord(i:number){
  if(advancing.current||saving)return;
  setPicked(old=>old.filter((_,j)=>j!==i));setWrongSlot(-1);
 }
 function hint(){
  if(!question||advancing.current)return;
  setAssisted(true);setFeedbackError(false);
  const next=question.tokens[picked.length]??question.tokens[0];
  setFeedback(question.explanation+' Sonraki kelime: '+next+'.');
 }
 async function finish(rows:SentenceAnswerEvidence[]){
  if(saveLock.current||!plan)return;
  saveLock.current=true;setSaving(true);setSaveError('');
  finishedRef.current=rows;
  try{
   const result=await saveSentencePlazaMission({
    repo:getProgressRepository(),profileId,mission:4,plan:plan.deck,answers:rows,
    sessionId:sessionIdRef.current,durationSeconds:(Date.now()-startedAt.current)/1000
   });
   setRewardStars(result.starsByLevel[4]??1);
   setPhase('reward');soundService.playSfx('fanfare',.86);
   onComplete(rows);
  }catch(error){
   console.error('Hareket Büyüsü kayıt hatası',error);
   setSaveError('Görevlerin kaydı doğrulanamadı. Aynı oturumu güvenli biçimde yeniden kaydedebilirsin.');
   setFeedbackError(true);
  }finally{saveLock.current=false;setSaving(false);}
 }
 function advanceWithSuccess(){
  if(!trial||!question||!plan||advancing.current||saving||!prepared)return;
  if(!isComplete){setFeedbackError(true);setFeedback('Önce İngilizce cümleyi tamamla.');return;}
  if(!checkMagicSentence(trial,selectedWords)){
   const wrong=question.tokens.findIndex((w,i)=>w!==selectedWords[i]);
   setWrongSlot(wrong);incorrect('Bu cümlenin '+(wrong+1)+'. kelimesinde sıralama veya dil bilgisi hatası var. '+question.explanation);
   return;
  }
  advancing.current=true;setActivated(true);setFeedbackError(false);
  setFeedback('✦ '+question.sentence+' — İngilizce cümlen sahneyi harekete geçirdi!');
  const row:SentenceAnswerEvidence={
   questionId:question.id,skill:'action',placement:englishLevel,
   sentenceKind:question.kind,challengeMode:question.mode,
   mistakes,hintUsed:assisted,modelHeard:heardModel,
   firstTryCorrect:mistakes===0&&!assisted&&!heardModel,timestamp:new Date().toISOString()
  };
  const rows=[...answersRef.current,row];answersRef.current=rows;
  const nextStreak=row.firstTryCorrect?streak+1:0;
  setStreak(nextStreak);setBestStreak(p=>Math.max(p,nextStreak));
  if(row.firstTryCorrect)setIndependentCount(n=>n+1);
  soundService.playSfx('correct',.82);
  speak(question.sentence,false);
  const duration=Math.min(5200,Math.max(2600,1400+question.tokens.length*235));
  clearPending();pending.current=setTimeout(()=>{
   pending.current=null;advancing.current=false;
   soundService.cancelSpeech();
   if(index+1>=plan.trials.length){void finish(rows);return;}
   const newChapter=plan.trials[index+1].chapter!==trial.chapter;
   setIndex(n=>n+1);resetRound();
   if(newChapter){setPhase('chapter');soundService.playSfx('whoosh',.54);}
  },duration);
 }
 const chapterCards=MOVEMENT_CHAPTERS.map(c=><div className="mm-chapter-pill" key={c.id}
   data-active={phase!=='welcome'&&c.id===stage} data-complete={phase!=='welcome'&&c.id<stage}>
   <span className="mm-chapter-symbol">{c.icon}</span>
   <span className="mm-chapter-text"><strong>SAHNE {c.id}</strong>{c.short}</span>
 </div>);
 const visual=<MovementMagicStage chapter={stage} actor={trial?.actor??'bird'}
  verb={trial?.verb??'fly'} color={trial?.color??'blue'} place={trial?.place??'bridge'}
  selectedPlace={chosenPlace} activated={activated} showTargets={phase==='play'&&Boolean(requiredPlace)&&(!requiredAction||Boolean(chosenAction))&&!chosenPlace}
  onPlace={placeChoice} disabled={saving||advancing.current} sentence={question?.sentence}/>;
 const estimated=plan?.estimatedMinutes??(gradeLevel!==null&&gradeLevel<=2?[7,10]:gradeLevel!==null&&gradeLevel>=5?[11,16]:[9,13]);
 const estimatedText=estimated[0]+'–'+estimated[1]+' dk';
 return <div className="mm-root" ref={rootRef} role="dialog" aria-modal="true"
  aria-label="Hareket Büyüsü İngilizce öğrenme macerası"
  onPointerDown={event=>event.stopPropagation()}>
 <div className="mm-container">
  <header className="mm-top">
   <div className="mm-titlebar"><div className="mm-seal" aria-hidden="true">✦</div>
    <div><div className="mm-eyebrow">VENTRA · CÜMLE MEYDANI · ÖZGÜN MACERA</div>
     <h1 className="mm-main-title">Hareket Büyüsü</h1></div></div>
   <div className="mm-top-pills">
    <span className="mm-pill">🎓 {gradeLevel??'—'}. sınıf · {englishLevel}</span>
    <span className="mm-pill">⏳ {CLOCK(seconds)} · Süre cezası yok</span>
    <button type="button" className="mm-back" onClick={()=>{if(saving)return;clearPending();soundService.cancelSpeech();onExit();}}
     disabled={saving}>← Cümle Meydanı</button>
   </div>
  </header>
  {phase==='welcome'?<>
   <section className="mm-status"><div>
    <div className="mm-eyebrow">DÖRT CANLI BÖLÜM · HAREKETİN DİLİ</div>
    <h2 className="mm-section-title">Hareketin büyüsünü sen yönet.</h2>
    <p className="mm-section-subtitle">Hangi hayvan ne yapabilir? Nereye gidiyor? İngilizce cümlede ne yanlış?
     Kelimeleri sıraya koymanın ötesine geç: sahneye dokun, karakterleri yönlendir, gerçek cümle kur.</p>
    </div><div className="mm-progress">Tahmini <strong>{estimatedText}</strong></div></section>
   <div className="mm-chapter-track">{chapterCards}</div>
   <div className="mm-main-layout">
    {visual}
    <aside className="mm-sidebar">
     <div className="mm-eyebrow">MACERANIN KURALLARI</div><h3>Dört dünya, bir İngilizce ustalığı.</h3>
     <p>Dört bölümün her birinde {perChapter} görev, toplam {perChapter*4} İngilizce etkileşim bulunur. Önce
      dili keşfeder, ardından hareket, konum ve tam cümle kurma görevlerini birleştirirsin.</p>
     <div className="mm-lesson-block"><strong>ÖĞRENME YOLCULUĞU</strong>
      <span>Keşfet → Hareket Et → İngilizce Kur → Canlandır</span>
      <small>Sınıf: {gradeLevel??'seçilmemiş'} · İngilizce: {englishLevel} · {perChapter} görev/bölüm</small>
     </div>
     <div className="mm-preview-stats">
      <div className="mm-stat"><strong>4</strong>bölüm</div>
      <div className="mm-stat"><strong>{estimatedText}</strong>tahmini süre</div>
      <div className="mm-stat"><strong>∞</strong>tekrar</div>
     </div>
     <p className="mm-caption-text">Süre geri saymaz. Yavaş okuma cezalandırılmaz. İpucu ve ses desteği her görevde bulunur;
      ancak bunlar bağımsız öğrenme başarısından ayrı kaydedilir.</p>
     {feedback&&<p role="alert" className="mm-feedback" data-error={feedbackError}>{feedback}</p>}
     <button type="button" className="mm-primary" style={{marginTop:17}}
      onClick={begin}>✦ Hareket Macerasına Başla</button>
    </aside>
   </div>
  </>:phase==='reward'?<div className="mm-final-card" role="status">
   <div className="mm-eyebrow">DÖRT BÖLÜM · GERÇEK PROFİL KAYDI</div>
   <h2>Hareket Büyüsü Tamamlandı!</h2>
   <div className="mm-final-stars" aria-label={rewardStars+' yıldız'}>{'★'.repeat(rewardStars)}</div>
   <p>Karakterleri doğru İngilizceyle yönlendirdin. Öğrenme kanıtların profiline kaydedildi;
    aynı görev tekrar oynandığında yeni cümleler ve sahne seçimleri seni bekliyor.</p>
   <div className="mm-learning-summary">
    <div><strong>{plan?.trials.length}</strong>İngilizce cümle</div>
    <div><strong>{independentCount}</strong>Bağımsız çözüm</div>
    <div><strong>{bestStreak}</strong>En uzun seri</div>
    <div><strong>{CLOCK(seconds)}</strong>Öğrenme süresi</div>
   </div>
   <button type="button" className="mm-primary" onClick={begin}>↻ Yeni Hareket Macerası</button>
   <button type="button" className="mm-tool" style={{marginTop:15}} onClick={onExit}>Cümle Meydanı’na Dön</button>
  </div>:<>
   <section className="mm-status">
    <div><div className="mm-eyebrow">HAREKET BÜYÜSÜ · SAHNE {stage} / 4</div>
     <h2 className="mm-section-title">{meta.icon} {meta.title}</h2>
     <p className="mm-section-subtitle">{meta.objective}</p></div>
    <div className="mm-progress"><strong>{index+1}</strong> / {plan?.trials.length??12} görev</div>
   </section>
   <div className="mm-chapter-track">{chapterCards}</div>
   {plan&&<div className="mm-progress-bar" role="progressbar" aria-label="Hareket Büyüsü ilerlemesi"
    aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}>
    <span style={{width:percent+'%'}}/></div>}
   <div className="mm-main-layout">
    {visual}
    <aside className="mm-sidebar">
     {phase==='chapter'?<>
      <div className="mm-eyebrow">ÖĞRETİCİ BÖLÜM · {stage}. DÜNYA</div>
      <h3>Önce öğren, sonra uygula.</h3>
      <p>{meta.explanation}</p>
      <div className="mm-lesson-block">
       <strong>İNGİLİZCE ÖRNEĞİ</strong><span>{meta.example}</span>
       <small>{meta.exampleTr}</small></div>
      <div className="mm-tools">
       <button type="button" className="mm-tool" onClick={()=>speak(meta.example)}>
        🔊 Örneği Dinle</button>
      </div>
      <p className="mm-caption-text">Doğru ya da yanlış kelimeleri işaretlemek için sadece tahmin etmeye gerek yok.
       Önce anlamı öğren; takıldığında ipucu iste. İngilizce seviyen ve sınıfın görev uzunluğunu belirler.</p>
      <button type="button" className="mm-primary" style={{marginTop:18}}
       onClick={()=>{resetRound();setPhase('play');soundService.playSfx('whoosh',.4);}}>
       ✨ {meta.title} Başlasın</button>
     </>:trial&&question?<>
      <div className="mm-eyebrow">🎯 BÖLÜMÜN {currentChapterRound}. GÖREVİ / {perChapter}</div>
      <h3>İngilizceyle sahneyi yönet.</h3>
      <div className="mm-challenge">
       <h4 className="mm-cue" tabIndex={-1}>{question.cue}</h4>
       <p className="mm-cue-sub">{trial.challenge==='action'?
        '1. Doğru İngilizce eylemi seç. 2. Cümleyi kendi başına oluştur.':
        trial.challenge==='destination'?
        '1. Hareketin gerçekleşeceği yeri sahnenin üzerinde bul. 2. Cümleyi kur.':
        trial.challenge==='repair'?
        '1. Hatalı İngilizce kelimeyi bul. 2. Cümlenin doğrusunu oluştur.':
        '1. Hareketi seç. 2. Sahnede doğru yeri göster. 3. Cümleyi oluştur.'}</p>
      </div>
      {requiredAction&&<div className="mm-verb-grid" role="group" aria-label="İngilizce hareketi seç">
       {MAGIC_VERBS.map(item=><button key={item.id} type="button" className="mm-verb"
        disabled={Boolean(chosenAction)||activated||saving}
        data-correct={chosenAction===item.id} aria-pressed={chosenAction===item.id}
        onClick={()=>actionChoice(item.id)}>
        <span className="mm-verb-icon" aria-hidden="true">{STAGE_ICONS[item.id]}</span>
        <span><strong>{item.en}</strong><small>{item.tr}</small></span>
       </button>)}
      </div>}
      {requiredPlace&&<p className="mm-inline-help">{requiredAction&&!chosenAction?
       'Önce hareketi seç. Sonra sahnenin üzerindeki konumlar açılacak.':
       chosenPlace?'✓ Konumu seçtin. Artık İngilizce cümleyi kurabilirsin.':
       '👆 Sahnenin üzerinde ağaç, gölet, köprü veya kuleyi seç.'}</p>}
      {needsRepair&&trial.brokenWords&&<div>
       <div className="mm-eyebrow" style={{marginTop:13}}>🔎 BU CÜMLEDE BİR DİL BİLGİSİ HATASI VAR</div>
       <div className="mm-repair" role="group" aria-label="Yanlış İngilizce kelimeyi bul">
        {trial.brokenWords.map((word,i)=><button type="button" key={i}
         className="mm-repair-token" data-correct={repairFixed&&i===trial.errorIndex}
         disabled={repairFixed||activated||saving} onClick={()=>repairChoice(i)}>{word}</button>)}
       </div></div>}
      {prepared?<div className="mm-builder">
       <div className="mm-builder-label"><span>✦ CÜMLE İNŞASI</span><span>{picked.length}/{question.tokens.length} kelime</span></div>
       <div className="mm-sentence-slots" role="group" aria-label="Hazırladığın İngilizce cümle">
        {question.tokens.map((word,i)=><button type="button" key={i}
         className="mm-slot" data-filled={Boolean(selectedWords[i])} data-error={wrongSlot===i}
         disabled={!selectedWords[i]||activated||saving}
         aria-label={selectedWords[i]?selectedWords[i]+' kelimesini kaldır':'Boş kelime alanı'}
         onClick={()=>removeWord(i)}>{selectedWords[i]??'✧'}</button>)}
       </div>
       <div className="mm-tile-tray" role="group" aria-label="İngilizce sözcükler">
        {tiles.map(t=><button type="button" key={t.id} className="mm-tile"
         disabled={picked.includes(t.id)||picked.length>=question.tokens.length||activated||saving}
         onClick={()=>addWord(t.id)}>{t.word}</button>)}
       </div>
      </div>:<p className="mm-inline-help">Hareketi ve/veya yeri doğru seçtikten sonra İngilizce cümle atölyesi açılır.</p>}
      <div className="mm-tools">
       <button type="button" className="mm-tool" disabled={!picked.length||activated||saving}
        onClick={()=>removeWord(picked.length-1)}>↶ Geri Al</button>
       <button type="button" className="mm-tool" disabled={activated||saving}
        onClick={()=>{soundService.unlockAudio();speak(question.sentence,true);}}>🔊 Tam Cümleyi Dinle</button>
       <button type="button" className="mm-tool" disabled={activated||saving}
        onClick={hint}>💡 Dil İpucu</button>
      </div>
      {feedback&&<div className="mm-feedback" data-error={feedbackError} role="status" aria-live="polite">{feedback}</div>}
      {saveError&&<div className="mm-feedback" data-error="true" role="alert">{saveError}
       <button type="button" className="mm-primary" style={{marginTop:10}}
        disabled={saving} onClick={()=>{if(finishedRef.current)void finish(finishedRef.current);}}>
        Kaydı Yeniden Dene</button></div>}
      {!activated&&<button type="button" className="mm-primary" style={{marginTop:10}}
       disabled={!prepared||!isComplete||saving||Boolean(saveError)}
       onClick={advanceWithSuccess}>✦ Cümleyle Hareketi Başlat!</button>}
      {activated&&<div className="mm-feedback" role="status">✨ Hareket gerçekleşiyor; sıradaki görev kendiliğinden başlayacak.</div>}
      <p className="mm-caption-text" style={{marginTop:12}}>
       İpucu veya tam cümle dinleme kullanırsan öğrenme kaydında destekli çözüm olarak görünür.
       Yavaş çözmek puan kaybettirmez.</p>
     </>:null}
    </aside>
   </div>
  </>}
 </div>
 </div>;
}
