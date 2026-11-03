'use client';
import React,{useEffect,useMemo,useRef,useState} from 'react';
import type {SentenceAnswerEvidence} from '@ventra/shared';
import type {EnglishPlacement} from '@/lib/learning/gradeAwareLearningPolicy';
import {soundService} from '@/lib/audio/SoundService';
import {getProgressRepository} from '@/lib/progress';
import {saveSentencePlazaMission} from '@/lib/progress/sentencePlazaProgress';
import {plazaWordTiles} from '@/lib/learning/sentencePlazaEngine';
import {LanternFestivalStage} from './LanternFestivalStage';
import {LANTERN_CHAPTERS,LANTERN_COLORS,LANTERN_PLACES,LANTERN_ANIMALS,
 lanternRoundsForGrade,planLanternFestival,checkLanternColor,checkLanternPlace,
 checkLanternAnimal,checkLanternRepair,checkLanternSentence,
 type LanternPlan,type LanternTrial,type LanternColor,type LanternPlace,type LanternAnimal}
 from '@/lib/learning/lanternFestivalEngine';
import './lantern-festival.css';

type Phase='welcome'|'lesson'|'play'|'reward';
interface Props{
 profileId:string;gradeLevel:number|null;englishLevel:EnglishPlacement;
 history:readonly SentenceAnswerEvidence[];knownWords:readonly string[];
 onExit:()=>void;onComplete:(rows:SentenceAnswerEvidence[])=>void;
}
interface Checkpoint{
 version:1;profileId:string;gradeLevel:number|null;englishLevel:EnglishPlacement;
 plan:LanternPlan;index:number;phase:'lesson'|'play';answers:SentenceAnswerEvidence[];
 selectedColor:LanternColor|null;selectedPlace:LanternPlace|null;
 selectedAnimal:LanternAnimal|null;repairFixed:boolean;
 picked:string[];mistakes:number;hintUsed:boolean;modelHeard:boolean;
 streak:number;bestStreak:number;independent:number;
 sessionId:string;elapsed:number;at:number;pendingSave?:boolean;
}
const KEY='ventra:lantern-festival:v1:';
const formatTime=(seconds:number)=>String(Math.floor(seconds/60)).padStart(2,'0')+
 ':'+String(seconds%60).padStart(2,'0');
function validCheckpoint(raw:unknown,id:string,grade:number|null,level:EnglishPlacement):raw is Checkpoint{
 if(!raw||typeof raw!=='object')return false;
 const c=raw as Partial<Checkpoint>,p=c.plan;
 if(c.version!==1||c.profileId!==id||c.gradeLevel!==grade||c.englishLevel!==level||
  !p||p.grade!==grade||p.englishLevel!==level||p.deck?.mission!==6||
  !Array.isArray(p.trials)||p.trials.length!==p.deck.questions.length||
  p.trials.length!==4*p.roundsPerChapter||p.roundsPerChapter!==lanternRoundsForGrade(grade)||
  !Number.isInteger(c.index)||c.index!<0||c.index!>=p.trials.length||
  (c.phase!=='lesson'&&c.phase!=='play')||!Array.isArray(c.answers)||
  !(c.answers.length===c.index||c.pendingSave&&c.answers.length===p.trials.length)||
  !Array.isArray(c.picked)||c.picked.some(x=>typeof x!=='string')||
  typeof c.sessionId!=='string'||!c.sessionId.startsWith('lantern:'+id+':')||
  typeof c.elapsed!=='number'||!Number.isFinite(c.elapsed)||c.elapsed<0||
  typeof c.at!=='number'||Math.abs(Date.now()-c.at)>7*86400000)return false;
 return p.trials.every((t,i)=>t.question.id===p.deck.questions[i]?.id&&t.question.mission===6)&&
  c.answers.every((e,i)=>e.questionId===p.deck.questions[i]?.id&&e.skill==='transfer'&&
   e.placement===level&&Number.isInteger(e.mistakes)&&e.mistakes>=0&&
   typeof e.hintUsed==='boolean'&&typeof e.modelHeard==='boolean'&&
   e.firstTryCorrect===(e.mistakes===0&&!e.hintUsed&&!e.modelHeard)&&
   Number.isFinite(Date.parse(e.timestamp)));
}
export function LanternFestivalAdventure({profileId,gradeLevel,englishLevel,history,knownWords,
 onExit,onComplete}:Props){
 const [phase,setPhase]=useState<Phase>('welcome'),[plan,setPlan]=useState<LanternPlan|null>(null);
 const [index,setIndex]=useState(0);
 const [selectedColor,setSelectedColor]=useState<LanternColor|null>(null);
 const [selectedPlace,setSelectedPlace]=useState<LanternPlace|null>(null);
 const [selectedAnimal,setSelectedAnimal]=useState<LanternAnimal|null>(null);
 const [repairFixed,setRepairFixed]=useState(false),[picked,setPicked]=useState<string[]>([]);
 const [mistakes,setMistakes]=useState(0),[hintUsed,setHintUsed]=useState(false);
 const [modelHeard,setModelHeard]=useState(false),[wrongSlot,setWrongSlot]=useState(-1);
 const [feedback,setFeedback]=useState(''),[feedbackError,setFeedbackError]=useState(false);
 const [lit,setLit]=useState(false),[saving,setSaving]=useState(false),[saveError,setSaveError]=useState('');
 const [stars,setStars]=useState(0),[seconds,setSeconds]=useState(0);
 const [streak,setStreak]=useState(0),[bestStreak,setBestStreak]=useState(0);
 const [independent,setIndependent]=useState(0),[resumed,setResumed]=useState(false);
 const answers=useRef<SentenceAnswerEvidence[]>([]),session=useRef(''),startedAt=useRef(0);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null),lock=useRef(false);
 const savingLock=useRef(false),loaded=useRef(false),retryRows=useRef<SentenceAnswerEvidence[]|null>(null);
 const root=useRef<HTMLDivElement>(null);
 const trial=plan?.trials[index]??null,question=trial?.question??null;
 const chapter=trial?.chapter??1,meta=LANTERN_CHAPTERS[chapter-1];
 const per=plan?.roundsPerChapter??lanternRoundsForGrade(gradeLevel);
 const total=plan?.trials.length??per*4;
 const tiles=useMemo(()=>question?plazaWordTiles(question,(plan?.deck.seed??0)^(index*1237)):[],
  [question,plan?.deck.seed,index]);
 const chosenWords=picked.map(id=>tiles.find(t=>t.id===id)?.word??'');
 const requiresColor=chapter===1||chapter===4;
 const requiresPlace=chapter===2||chapter===4;
 const requiresAnimal=chapter===4;
 const requiresRepair=chapter===3;
 const prepared=Boolean(trial&&(!requiresColor||selectedColor===trial.color)&&
  (!requiresPlace||selectedPlace===trial.place)&&
  (!requiresAnimal||selectedAnimal===trial.animal)&&(!requiresRepair||repairFixed));
 const canSelectPlace=phase==='play'&&requiresPlace&&!selectedPlace&&
  (!requiresColor||Boolean(selectedColor))&&(!requiresAnimal||Boolean(selectedAnimal))&&!lit;
 const progress=plan?100*(index+(lit?1:0))/plan.trials.length:0;
 const litCount=answers.current.length;
 const clearTimer=()=>{if(timer.current!==null){clearTimeout(timer.current);timer.current=null;}};
 const removeCheckpoint=()=>{try{window.localStorage.removeItem(KEY+profileId);}catch{}};
 function resetRound(){
  setSelectedColor(null);setSelectedPlace(null);setSelectedAnimal(null);setRepairFixed(false);
  setPicked([]);setMistakes(0);setHintUsed(false);setModelHeard(false);setWrongSlot(-1);
  setFeedback('');setFeedbackError(false);setLit(false);setSaveError('');
 }
 useEffect(()=>{
  soundService.setMusicScene('lantern');
  return()=>{lock.current=false;clearTimer();soundService.cancelSpeech();soundService.setMusicScene('plaza');};
 },[]);
 useEffect(()=>{
  if(loaded.current)return;loaded.current=true;
  try{
   const stored=window.localStorage.getItem(KEY+profileId);
   if(!stored)return;
   const value:unknown=JSON.parse(stored);
   if(!validCheckpoint(value,profileId,gradeLevel,englishLevel)){removeCheckpoint();return;}
   session.current=value.sessionId;answers.current=value.answers;
   startedAt.current=Date.now()-value.elapsed*1000;
   setPlan(value.plan);setIndex(value.index);setSeconds(Math.floor(value.elapsed));setResumed(true);
   setStreak(value.streak??0);setBestStreak(value.bestStreak??0);
   setIndependent(value.independent??0);
   if(value.pendingSave){
    setLit(true);setSaveError('Final tamamlandı; profil kaydını güvenle tekrar dene.');
    retryRows.current=value.answers;setPhase('play');
   }else{
    setSelectedColor(value.selectedColor);setSelectedPlace(value.selectedPlace);
    setSelectedAnimal(value.selectedAnimal);setRepairFixed(value.repairFixed);
    setPicked(value.picked);setMistakes(value.mistakes);
    setHintUsed(value.hintUsed);setModelHeard(value.modelHeard);setPhase(value.phase);
   }
  }catch(error){console.warn('Fener Festivali devam kaydı okunamadı',error);removeCheckpoint();}
 },[profileId,gradeLevel,englishLevel]);
 useEffect(()=>{
  if(!plan||!startedAt.current||phase==='reward')return;
  try{
   const pendingSave=lit&&answers.current.length===plan.trials.length;
   const advanced=lit&&answers.current.length===index+1&&index+1<plan.trials.length;
   const futureIndex=advanced?index+1:index;
   const newChapter=advanced&&plan.trials[futureIndex].chapter!==plan.trials[index].chapter;
   const c:Checkpoint={version:1,profileId,gradeLevel,englishLevel,plan,index:futureIndex,
    phase:newChapter?'lesson':phase==='lesson'?'lesson':'play',answers:answers.current,
    selectedColor:advanced?null:selectedColor,selectedPlace:advanced?null:selectedPlace,
    selectedAnimal:advanced?null:selectedAnimal,repairFixed:advanced?false:repairFixed,
    picked:advanced?[]:picked,mistakes:advanced?0:mistakes,
    hintUsed:advanced?false:hintUsed,modelHeard:advanced?false:modelHeard,
    streak,bestStreak,independent,sessionId:session.current,
    elapsed:(Date.now()-startedAt.current)/1000,at:Date.now(),pendingSave};
   window.localStorage.setItem(KEY+profileId,JSON.stringify(c));
  }catch(error){console.warn('Fener Festivali devam kaydı yazılamadı',error);}
 },[phase,plan,index,lit,selectedColor,selectedPlace,selectedAnimal,repairFixed,picked,
  mistakes,hintUsed,modelHeard,streak,bestStreak,independent,profileId,gradeLevel,englishLevel]);
 useEffect(()=>{
  if(!startedAt.current||phase==='reward')return;
  const id=setInterval(()=>setSeconds(Math.max(0,Math.floor((Date.now()-startedAt.current)/1000))),1000);
  return()=>clearInterval(id);
 },[phase]);
 useEffect(()=>{if(phase==='play')root.current?.querySelector<HTMLElement>('.lf-cue')?.focus();},[phase,index]);
 function speak(text:string,full=false){
  soundService.unlockAudio();
  const used=soundService.speakEnglish(text,{rate:gradeLevel!=null&&gradeLevel<=2?.77:.87});
  if(used&&full)setModelHeard(true);
  if(!used)setFeedback('Bu cihazda seslendirme kullanılamıyor. Yazılı ipucunu kullanabilirsin.');
 }
 function begin(){
  try{
   const seed=(Date.now()^Math.floor(Math.random()*0xffffffff))>>>0;
   const generated=planLanternFestival({grade:gradeLevel,englishLevel,seed,history,knownWords});
   if(generated.trials.length!==generated.roundsPerChapter*4)throw Error('Incomplete Lantern Festival');
   answers.current=[];retryRows.current=null;session.current='lantern:'+profileId+':'+Date.now()+':'+Math.random().toString(36).slice(2);
   startedAt.current=Date.now();lock.current=false;savingLock.current=false;
   setIndex(0);resetRound();setStreak(0);setBestStreak(0);setIndependent(0);
   setSeconds(0);setResumed(false);setPlan(generated);setPhase('lesson');
   soundService.playSfx('whoosh',.6);
  }catch(error){console.error('Fener Festivali planı kurulamadı',error);
   setFeedbackError(true);setFeedback('Bu öğrenci için içerik hazırlanamadı. Önceki ilerlemen korundu.');}
 }
 function wrong(message:string){
  if(lock.current||savingLock.current)return;
  setMistakes(n=>n+1);setStreak(0);setFeedback(message);setFeedbackError(true);
  soundService.playSfx('gentle_retry',.65);
 }
 function pickColor(color:LanternColor){
  if(!trial||!requiresColor||selectedColor||lock.current||saving)return;
  if(!checkLanternColor(trial,color)){
   wrong('Fenerin rengini yeniden düşün. Yönergede belirtilen İngilizce renk kelimesine dikkat et.');return;
  }
  setSelectedColor(color);soundService.playSfx('tap',.45);
  setFeedbackError(false);setFeedback('Rengi doğru eşleştirdin. '+(requiresAnimal?'Karakteri ve yeri de seç.':'İngilizce cümleyi kur.'));
 }
 function pickAnimal(animal:LanternAnimal){
  if(!trial||!requiresAnimal||selectedAnimal||!selectedColor||lock.current||saving)return;
  if(!checkLanternAnimal(trial,animal)){
   wrong('Yönergedeki karakter farklı. Bird, rabbit, dog, cat kelimelerini karşılaştır.');return;
  }
  setSelectedAnimal(animal);soundService.playSfx('tap',.42);
  setFeedbackError(false);setFeedback('Karakter doğru. Şimdi doğru konumu sahnede göster.');
 }
 function pickPlace(place:LanternPlace){
  if(!trial||!requiresPlace||selectedPlace||lock.current||saving||
   requiresColor&&!selectedColor||requiresAnimal&&!selectedAnimal)return;
  if(!checkLanternPlace(trial,place)){
   wrong('Bu konum yönergedeki yer değil. Tree, bridge, tower ve fountain yerlerini tekrar incele.');return;
  }
  setSelectedPlace(place);soundService.playSfx('tap',.47);
  setFeedbackError(false);setFeedback('Doğru yere dokundun. Bu anlamı İngilizce cümleyle tamamla.');
 }
 function pickError(i:number){
  if(!trial||!requiresRepair||repairFixed||lock.current||saving)return;
  if(!checkLanternRepair(trial,i)){
   wrong('Bu sözcük hatalı değil. Can + fiil ve is + fiil-ing kuralına odaklan.');return;
  }
  setRepairFixed(true);soundService.playSfx('correct',.4);setFeedbackError(false);
  setFeedback('Dil bilgisi hatasını buldun. Şimdi bütün cümleyi doğru sırayla oluştur.');
 }
 function selectWord(id:string){
  if(!prepared||!question||lock.current||saving||picked.includes(id)||picked.length>=question.tokens.length)return;
  setPicked(old=>[...old,id]);setFeedback('');setFeedbackError(false);setWrongSlot(-1);
  soundService.playSfx('tap',.34);
 }
 function hint(){
  if(!question||lock.current)return;
  setHintUsed(true);setFeedbackError(false);
  setFeedback(question.explanation+' Sıradaki İngilizce kelime: '+(question.tokens[picked.length]??question.tokens[0]));
 }
 async function finish(rows:SentenceAnswerEvidence[]){
  if(savingLock.current||!plan)return;
  savingLock.current=true;setSaving(true);setSaveError('');retryRows.current=rows;
  try{
   const progress=await saveSentencePlazaMission({
    repo:getProgressRepository(),profileId,mission:6,plan:plan.deck,answers:rows,
    sessionId:session.current,durationSeconds:(Date.now()-startedAt.current)/1000
   });
   setStars(progress.starsByLevel[6]??1);
   removeCheckpoint();setPhase('reward');soundService.playSfx('fanfare',.92);
   onComplete(rows);
  }catch(error){
   console.error('Fener Festivali final kaydı başarısız',error);
   setSaveError('Festival tamamlandı fakat ilerleme kaydı doğrulanamadı. Aynı oturumu tekrar kaydet.');
   setFeedbackError(true);
  }finally{savingLock.current=false;setSaving(false);}
 }
 function submit(){
  if(!trial||!question||!plan||!prepared||lock.current||saving||saveError)return;
  if(picked.length!==question.tokens.length){setFeedbackError(true);setFeedback('Önce bütün İngilizce cümleyi tamamla.');return;}
  if(!checkLanternSentence(trial,chosenWords)){
   const bad=question.tokens.findIndex((w,i)=>w!==chosenWords[i]);
   setWrongSlot(bad);wrong('Cümlenin '+(bad+1)+'. kelimesini incele. '+question.explanation);return;
  }
  lock.current=true;setLit(true);setFeedbackError(false);
  setFeedback('✦ '+question.sentence+' — fener sahnede ışıldıyor!');
  const evidence:SentenceAnswerEvidence={
   questionId:question.id,skill:'transfer',placement:englishLevel,
   sentenceKind:question.kind,challengeMode:question.mode,mistakes,hintUsed,modelHeard,
   firstTryCorrect:mistakes===0&&!hintUsed&&!modelHeard,timestamp:new Date().toISOString()
  };
  const rows=[...answers.current,evidence];answers.current=rows;
  if(evidence.firstTryCorrect){
   setIndependent(n=>n+1);setStreak(n=>{setBestStreak(s=>Math.max(s,n+1));return n+1;});
  }else setStreak(0);
  soundService.playSfx('correct',.86);
  const start=Date.now();let scheduled=false;
  const advance=(delay:number)=>{
   if(scheduled||!lock.current)return;
   scheduled=true;clearTimer();
   timer.current=setTimeout(()=>{
    timer.current=null;if(!lock.current)return;
    lock.current=false;soundService.cancelSpeech();
    if(index+1>=plan.trials.length){void finish(rows);return;}
    const newChapter=plan.trials[index+1].chapter!==trial.chapter;
    setIndex(n=>n+1);resetRound();
    if(newChapter){setPhase('lesson');soundService.playSfx('whoosh',.55);}
   },delay);
  };
  // Let English playback finish before automatic movement; fallback if speech events never fire.
  const played=soundService.speakEnglish(question.sentence,{
   rate:gradeLevel!=null&&gradeLevel<=2?.77:.87,
   onEnd:()=>advance(Math.max(650,2000-(Date.now()-start))),
   onError:()=>advance(2300)
  });
  if(!played)advance(2400);
  else timer.current=setTimeout(()=>{timer.current=null;advance(750);},
   Math.max(3600,Math.min(10500,1300+question.tokens.length*490)));
 }
 const showPalette=phase==='play'&&requiresColor&&!selectedColor&&!lit;
 const showAnimals=phase==='play'&&requiresAnimal&&Boolean(selectedColor)&&!selectedAnimal&&!lit;
 const showRepair=phase==='play'&&requiresRepair&&!repairFixed&&!lit;
 const showPlaces=phase==='play'&&canSelectPlace;
 const currentPlace=selectedPlace??(lit?trial?.place??null:null);
 const lights=answers.current.length;
 const stage=<LanternFestivalStage chapter={chapter} color={selectedColor??(lit?trial?.color??null:null)}
  animal={selectedAnimal??(lit?trial?.animal??null:null)} place={currentPlace}
  lit={lit} lights={lights} showPlaces={showPlaces} onPlace={pickPlace}
  disabled={saving||lock.current} caption={question?.sentence}/>;
 const duration=plan?.estimatedMinutes??(gradeLevel!=null&&gradeLevel<=2?[8,12]:gradeLevel!=null&&gradeLevel>=5?[14,19]:[11,16]);
 const track=LANTERN_CHAPTERS.map(c=><div key={c.id} className="lf-chapter"
  data-current={phase!=='welcome'&&c.id===chapter} data-complete={phase!=='welcome'&&c.id<chapter}>
  <span>{c.icon}</span><strong>{c.id}. {c.title}</strong><small>{c.short}</small></div>);
 return <div className="lf-root" role="dialog" aria-modal="true"
  aria-label="Fener Festivali İngilizce final macerası" onPointerDown={e=>e.stopPropagation()} ref={root}>
  <div className="lf-container">
   <header className="lf-header">
    <div className="lf-brand"><div className="lf-crest">🏮</div><div>
     <div className="lf-eyebrow">VENTRA · CÜMLE MEYDANI · FİNAL MACERASI</div>
     <h1>Fener Festivali</h1><small>İngilizcenle gece göğünü aydınlat.</small></div></div>
    <div className="lf-header-actions">
     <span className="lf-chip">🎓 {gradeLevel??'—'}. sınıf · {englishLevel}</span>
     <span className="lf-chip">◷ {formatTime(seconds)} · Süre cezası yok</span>
     <button type="button" className="lf-back" disabled={saving} onClick={()=>{
      lock.current=false;clearTimer();soundService.cancelSpeech();onExit();
     }}>← Cümle Meydanı</button>
    </div>
   </header>
   {resumed&&phase!=='reward'&&<div role="status" className="lf-message">
    ↻ Kaldığın Fener Festivali görevi bu cihazda korunmuş. Aynı görevden devam ediyorsun.</div>}
   {phase==='welcome'?<>
    <section className="lf-intro">
     <div className="lf-eyebrow">DÖRT DÜNYA · FİNAL TÖRENİ</div><h2>Karanlık meydanı İngilizceyle aydınlat.</h2>
     <p>Kelime Bahçesi’nde tanıdığın renkleri, nesneleri ve hareketleri artık tek başına değil,
      anlamlı İngilizce cümlelerle birleştireceksin. Bu gece fenerlerin hepsi senin kararlarınla yanacak.</p>
     <div className="lf-intro-duration">{duration[0]}–{duration[1]} dk · Tahmini</div>
    </section>
    <div className="lf-track">{track}</div>
    <div className="lf-layout">{stage}<aside className="lf-panel">
     <div className="lf-eyebrow">KELİMEDEN CÜMLEYE · GEÇİŞ BECERİSİ</div>
     <h2>Son büyüyü ezberlemeden tamamla.</h2>
     <p>Her bölüm farklı bir beceri ister: rengi ayırt et, sahnede gerçek yer seç,
      hatalı İngilizceyi düzelt ve hepsini finalde birleştir.</p>
     <div className="lf-stats"><div><strong>4</strong>bölüm</div><div><strong>{per*4}</strong>görev</div>
      <div><strong>∞</strong>tekrar</div></div>
     <div className="lf-teacher"><strong>NASIL ÖĞRENECEKSİN?</strong>
      <span>Gör → Anla → Seç → İngilizce Kur → Canlandır</span></div>
     <p className="lf-small">Süre kısıtı yok. Ses ve ipucu kullanabilirsin; bunlar bağımsız başarıdan ayrı kaydedilir.
      Yarım kalan oturum aynı cihazda kaldığın yerden açılabilir.</p>
     {feedback&&<div className="lf-message" data-error={feedbackError} role="alert">{feedback}</div>}
     <button type="button" className="lf-primary" onClick={begin}>✦ Fener Festivaline Başla</button>
    </aside></div>
   </>:phase==='reward'?<section className="lf-final" role="status">
    <div className="lf-eyebrow">FİNAL MÜHRÜ · KAYITLI İNGİLİZCE BAŞARISI</div>
    <div className="lf-final-stars" aria-label={stars+' yıldız'}>{'★'.repeat(stars)}</div>
    <h2>Fener Festivali Aydınlandı!</h2>
    <p>Cümle Meydanı’nın altı görevini birleştiren bu finali tamamladın.
     Yeni denemelerde farklı renk, nesne, yer, karakter ve İngilizce ifadeleri keşfedebilirsin.</p>
    <div className="lf-result-grid">
     <div><strong>{total}</strong>İngilizce cümle</div><div><strong>{independent}</strong>bağımsız çözüm</div>
     <div><strong>{bestStreak}</strong>en uzun seri</div><div><strong>{formatTime(seconds)}</strong>süre</div></div>
    <button type="button" className="lf-primary" onClick={begin}>↻ Yeni Gece Festivali</button>
    <button type="button" className="lf-back" onClick={onExit}>Cümle Meydanı’na Dön</button>
   </section>:<>
    <section className="lf-status"><div><div className="lf-eyebrow">FİNAL · BÖLÜM {chapter}/4</div>
     <h2>{meta.icon} {meta.title}</h2><p>{meta.objective}</p></div>
     <div className="lf-counter">{index+1}<span> / {total} görev</span></div></section>
    <div className="lf-track">{track}</div>
    <div className="lf-progress" role="progressbar" aria-label="Fener Festivali ilerleme"
     aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
     <span style={{width:progress+'%'}}/></div>
    <div className="lf-layout">{stage}<aside className="lf-panel">
     {phase==='lesson'?<>
      <div className="lf-eyebrow">{chapter}. BÖLÜM · ÖĞRENME DURAĞI</div>
      <h2>İngilizceyi öğren, büyüyü yönet.</h2>
      <p>{meta.rule}</p>
      <div className="lf-teacher"><strong>ÖRNEK CÜMLE</strong>
       <span>{meta.example}</span><small>{meta.tr}</small></div>
      <div className="lf-tools"><button type="button" className="lf-tool"
       onClick={()=>speak(meta.example)}>🔊 Örneği Dinle</button></div>
      <p className="lf-small">Örnek öğrenmen için var. Sonraki görev farklı renk, konum veya karakterle
       kendi cümleni kurmanı isteyecek.</p>
      <button type="button" className="lf-primary" onClick={()=>{
       resetRound();setPhase('play');soundService.playSfx('whoosh',.48);
      }}>✦ {meta.title} Başlasın</button>
     </>:trial&&question?<>
      <div className="lf-eyebrow">🎯 {chapter}. DÜNYA · {index%per+1}/{per} GÖREV</div>
      <h2>Doğru anlamı İngilizceyle kur.</h2>
      <div className="lf-cue-wrap"><h3 className="lf-cue" tabIndex={-1}>{question.cue}</h3>
       <p>{chapter===1?'Rengi seç. Ardından feneri İngilizce tarif et.':
        chapter===2?'Sahnede doğru yerin üzerine dokun, ardından cümleyi kur.':
        chapter===3?'Hatalı kelimeyi keşfet, sonra cümlenin doğru hâlini kur.':
         'Rengi, karakteri ve konumu doğru seç; final cümlesini oluştur.'}</p></div>
      {showPalette&&<div className="lf-choice-block" role="group" aria-label="Fener rengini seç">
       <strong>✦ Işık kristalinin rengini seç</strong>
       <div className="lf-colors">{LANTERN_COLORS.map(c=><button type="button" key={c.id}
        className="lf-color-choice" style={{'--color':c.hex} as React.CSSProperties}
        disabled={lit||saving} onClick={()=>pickColor(c.id)}
        aria-label={c.tr+' renk'}><span>✦</span><small>{c.tr}</small></button>)}</div></div>}
      {showAnimals&&<div className="lf-choice-block" role="group" aria-label="Festival karakterini seç">
       <strong>🐾 Doğru karakter kim?</strong>
       <div className="lf-animals">{LANTERN_ANIMALS.map(a=><button type="button" key={a.id}
        className="lf-animal-choice" onClick={()=>pickAnimal(a.id)} disabled={lit||saving}>
        <span aria-hidden="true">{a.icon}</span><strong>{a.id}</strong><small>{a.tr}</small></button>)}</div></div>}
      {requiresPlace&&<div className="lf-instruction">
       {selectedPlace?'✓ Konumu doğru seçtin.':
         requiresAnimal&&!selectedAnimal?'Önce renk ve karakteri seç; sonra sahnedeki yerler açılacak.':
         requiresColor&&!selectedColor?'Önce rengi seç.':
         '👆 Ağaç, köprü, kule veya çeşme etiketine sahnede dokun.'}
      </div>}
      {showRepair&&trial.brokenWords&&<div className="lf-choice-block">
       <strong>🔎 Bu İngilizce cümlede bir kelime yanlış. Hangisi?</strong>
       <div className="lf-repair" role="group" aria-label="Yanlış İngilizce sözcüğü işaretle">
        {trial.brokenWords.map((part,i)=><button key={i} type="button" className="lf-repair-token"
         disabled={lit||saving} onClick={()=>pickError(i)}>{part}</button>)}</div></div>}
      {prepared&&<div className="lf-builder">
       <div className="lf-builder-head"><strong>✦ CÜMLE İNŞASI</strong>
        <span>{picked.length}/{question.tokens.length} kelime</span></div>
       <div className="lf-slots" role="group" aria-label="İngilizce cümle alanı">
        {question.tokens.map((_,i)=><button key={i} type="button" className="lf-slot"
         disabled={!chosenWords[i]||lit||saving} data-filled={Boolean(chosenWords[i])}
         data-error={wrongSlot===i}
         aria-label={chosenWords[i]?chosenWords[i]+' kelimesini çıkar':'Boş kelime alanı'}
         onClick={()=>{setPicked(old=>old.filter((_,j)=>j!==i));setWrongSlot(-1);}}>
         {chosenWords[i]??'✧'}</button>)}</div>
       <div className="lf-tiles" role="group" aria-label="Cümleye eklenebilecek kelimeler">
        {tiles.map(t=><button type="button" key={t.id} className="lf-tile"
         disabled={picked.includes(t.id)||picked.length>=question.tokens.length||lit||saving}
         onClick={()=>selectWord(t.id)}>{t.word}</button>)}</div>
      </div>}
      {!prepared&&<p className="lf-small">Cümle kurmak için önce bu bölümün görsel veya dil bilgisi görevini tamamla.</p>}
      <div className="lf-tools">
       <button type="button" className="lf-tool" disabled={!picked.length||lit||saving}
        onClick={()=>{setPicked(old=>old.slice(0,-1));setWrongSlot(-1);}}>↶ Geri Al</button>
       <button type="button" className="lf-tool" disabled={lit||saving}
        onClick={()=>speak(question.sentence,true)}>🔊 Tam Cümleyi Dinle</button>
       <button type="button" className="lf-tool" disabled={lit||saving} onClick={hint}>💡 Dil İpucu</button>
      </div>
      {feedback&&<div className="lf-message" data-error={feedbackError} role="status" aria-live="polite">{feedback}</div>}
      {saveError&&<div className="lf-message" data-error="true" role="alert">{saveError}
       <button type="button" className="lf-primary" disabled={saving}
        onClick={()=>{if(retryRows.current)void finish(retryRows.current);}}>Ödülü Güvenle Kaydet</button></div>}
      {!lit&&<button type="button" className="lf-primary"
       disabled={!prepared||picked.length!==question.tokens.length||saving||Boolean(saveError)}
       onClick={submit}>🏮 İngilizce Cümleyle Feneri Yak</button>}
      {lit&&<div className="lf-success" role="status">✨ Fener ışıldıyor; sıradaki görev otomatik başlıyor.</div>}
      <p className="lf-small">Süre baskısı yok. İpucuyla veya tam cevap dinleyerek çözdüğün görevler
       bağımsız öğrenme başarısından ayrı değerlendirilir.</p>
     </>:null}
    </aside></div>
   </>}
  </div>
 </div>;
}
