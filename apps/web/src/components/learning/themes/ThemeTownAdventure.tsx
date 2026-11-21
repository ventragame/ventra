'use client';
import React,{useEffect,useRef,useState} from 'react';
import {soundService} from '@/lib/audio/SoundService';
import {themeScene,visualForEnglishWord} from '@/lib/learning/learningArt';
import {ThemeWordCue,ThemeWordArtwork} from './ThemeWordCue';
import {getProgressRepository} from '@/lib/progress';
import type {EnglishPlacement} from '@/lib/learning/gradeAwareLearningPolicy';
import {THEME_DEFINITIONS,THEME_TIERS,THEME_ORDER,
 type ThemeId,type ThemeTier} from '@/lib/learning/themeQuestCatalog';
import {planThemeLesson,themeEffectiveTier,themeTaskHint,themeAnswerIndependent,
 themeGradeTaskCount,isThemeAnswerCorrect,
 type ThemeDeck,type ThemeTask,type ThemeAnswerEvidence} from '@/lib/learning/themeQuestEngine';
import {getThemeTownProgress,recordThemeQuest,
 type ThemeTownProgress} from '@/lib/learning/themeQuestProgress';
import {loadThemeCheckpoint,saveThemeCheckpoint,clearThemeCheckpoint} from '@/lib/learning/themeQuestCheckpoint';
import './theme-town.css';
import './theme-art-v2.css';

type Props={profileId:string;englishLevel:EnglishPlacement;gradeLevel:number|null;
 onBack:()=>void;onSaved?:()=>void;};
type Phase='home'|'playing'|'complete';
const empty=(tier:ThemeTier):ThemeTownProgress=>({
 completed:0,total:8,replays:{school:0,body:0,clothes:0,weather:0,
 calendar:0,hobbies:0,transport:0,feelings:0},
 stars:{school:0,body:0,clothes:0,weather:0,
 calendar:0,hobbies:0,transport:0,feelings:0},tier
});
const taskLabel=(kind:ThemeTask['kind']):string=>({
 discover:'KEŞFET',picture:'RESMİ TANIMLA',translate:'KELİMEYİ BUL',listen:'DİNLE VE BUL',
 meaning:'ANLAMINI BUL',phrase:'GÜNLÜK İNGİLİZCE',assemble:'CÜMLEYİ KUR',clock:'SAATİ OKU'
})[kind];
const wordTiles=(task:ThemeTask,selected:readonly number[])=>selected.map(i=>task.choices[i]);

function ClockFace({minutes}: {minutes:number}){
 const hour=minutes/60,minute=minutes%60;
 const thetaHour=(hour%12)*Math.PI/6-Math.PI/2;
 const thetaMinute=minute*Math.PI/30-Math.PI/2;
 const hx=100+37*Math.cos(thetaHour),hy=100+37*Math.sin(thetaHour);
 const mx=100+63*Math.cos(thetaMinute),my=100+63*Math.sin(thetaMinute);
 return <svg className="tt-clock" viewBox="0 0 200 200" role="img"
  aria-label="Analog saat: kısa ibre saatleri, uzun ibre dakikaları gösteriyor">
  <circle cx="100" cy="100" r="94" fill="#fcfcf4" stroke="#c58b5d" strokeWidth="8"/>
  <circle cx="100" cy="100" r="83" fill="none" stroke="#dcebe0" strokeWidth="2"/>
  {Array.from({length:12},(_,i)=>{
   const angle=(i+1)*Math.PI/6-Math.PI/2;
   const x=100+72*Math.cos(angle),y=100+72*Math.sin(angle);
   return <text x={x} y={y+5} key={i} fill="#2a655d" fontWeight="900" fontSize="14"
    textAnchor="middle">{i+1}</text>;
  })}
  <line x1="100" y1="100" x2={hx} y2={hy} stroke="#235d60" strokeWidth="9" strokeLinecap="round"/>
  <line x1="100" y1="100" x2={mx} y2={my} stroke="#e7a95d" strokeWidth="6" strokeLinecap="round"/>
  <circle cx="100" cy="100" r="7" fill="#2e6b62"/>
 </svg>;
}
export function ThemeTownAdventure({profileId,englishLevel,gradeLevel,onBack,onSaved}:Props){
 const tier=themeEffectiveTier(gradeLevel,englishLevel);
 const [phase,setPhase]=useState<Phase>('home');
 const [progress,setProgress]=useState<ThemeTownProgress>(()=>empty(tier));
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 const [loadError,setLoadError]=useState(''),[saveError,setSaveError]=useState('');
 const [active,setActive]=useState<ThemeId>('school');
 const [deck,setDeck]=useState<ThemeDeck|null>(null);
 const [step,setStep]=useState(0);
 const [answers,setAnswers]=useState<readonly ThemeAnswerEvidence[]>([]);
 const [mistakes,setMistakes]=useState(0),[hints,setHints]=useState(0);
 const [wrongThisStep,setWrongThisStep]=useState(0),[hintVisible,setHintVisible]=useState(false);
 const [speechStarted,setSpeechStarted]=useState(false),[speechFailed,setSpeechFailed]=useState(false);
 const [selected,setSelected]=useState<readonly number[]>([]);
 const [locked,setLocked]=useState(false);
 const [retrySave,setRetrySave]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [result,setResult]=useState<{stars:number;independent:number}|null>(null);
 const sessionRef=useRef(''),startedRef=useRef(0);
 const runRef=useRef(0),isMounted=useRef(true),lockRef=useRef(false);
 const timerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
 const task=deck?.tasks[step],currentTheme=THEME_DEFINITIONS.find(t=>t.id===active)!;
 const wordArt=task?.word?visualForEnglishWord(task.word.en,task.word.tr):null;
 const gradeMode=gradeLevel!==null&&gradeLevel<=2?'Küçük kaşif':gradeLevel!==null&&gradeLevel>=5?'İleri kaşif':'Kaşif';
 const tierLabel=THEME_TIERS[tier];
 const recommended=THEME_ORDER.find(t=>!progress.replays[t])??'school';
 const count=deck?.tasks.length??0;

 useEffect(()=>{
  let live=true;isMounted.current=true;runRef.current++;
  setPhase('home');setProgress(empty(tier));setLoading(true);setLoadError('');
  void getThemeTownProgress(getProgressRepository(),profileId,englishLevel,gradeLevel)
   .then(data=>{if(live)setProgress(data);})
   .catch(()=>{if(live)setLoadError('İlerleme kayıtları okunamadı. Eski kayıtların korunuyor.');})
   .finally(()=>{if(live)setLoading(false);});
  return ()=>{live=false;isMounted.current=false;runRef.current++;
   if(timerRef.current)clearTimeout(timerRef.current);soundService.cancelSpeech();};
 },[profileId,englishLevel,gradeLevel,tier]);
 const reload=()=>{
  setLoading(true);setLoadError('');
  void getThemeTownProgress(getProgressRepository(),profileId,englishLevel,gradeLevel)
   .then(setProgress).catch(()=>setLoadError('İlerleme yeniden okunamadı.'))
   .finally(()=>setLoading(false));
 };
 const leave=()=>{
  if(saving)return;
  runRef.current++;lockRef.current=false;
  if(timerRef.current)clearTimeout(timerRef.current);
  soundService.cancelSpeech();
  setFeedback('');setSaveError('');
  if(phase==='home')onBack();else setPhase('home');
 };
 const start=(theme:ThemeId)=>{
  if(loading||loadError||saving)return;
  const replay=progress.replays[theme]??0;
  const next=planThemeLesson({theme,placement:englishLevel,gradeLevel,replay});
  const saved=loadThemeCheckpoint(profileId,englishLevel,next.tier,theme);
  const valid=saved?.replay===replay&&saved.taskIds.length===next.tasks.length&&
   saved.taskIds.every((id,i)=>id===next.tasks[i].id);
  if(saved&&!valid)clearThemeCheckpoint(profileId,englishLevel,next.tier,theme);
  runRef.current++;lockRef.current=false;
  if(timerRef.current)clearTimeout(timerRef.current);
  soundService.cancelSpeech();soundService.unlockAudio();
  sessionRef.current=valid?saved.sessionId:crypto.randomUUID();
  startedRef.current=Date.now();
  setActive(theme);setDeck(next);setStep(valid?saved.step:0);
  setAnswers(valid?saved.answers:[]);
  setMistakes(valid?saved.mistakes:0);setHints(valid?saved.hints:0);
  setWrongThisStep(0);setHintVisible(false);setSpeechStarted(false);
  setSpeechFailed(false);setSelected([]);setLocked(false);
  setRetrySave(Boolean(valid&&saved.step===next.tasks.length));
  setSaveError('');setFeedback('');setResult(null);setPhase('playing');
  soundService.playSfx('island_portal',0.35);
 };
 const speak=(text:string,slow=false)=>{
  if(saving||locked||!task)return;
  soundService.unlockAudio();setSpeechFailed(false);
  const worked=soundService.speakEnglish(text,{
   rate:slow?0.67:gradeLevel!==null&&gradeLevel<=2?0.8:0.92,
   onStart:()=>setSpeechStarted(true),
   onError:()=>setSpeechFailed(true)
  });
  if(!worked)setSpeechFailed(true);
 };
 const showHint=()=>{
  if(!task||hintVisible||saving||locked)return;
  setHintVisible(true);setHints(n=>n+1);
 };
 const finish=async(finalAnswers:readonly ThemeAnswerEvidence[],totalMistakes:number,totalHints:number)=>{
  if(!deck)return;
  const run=runRef.current;
  setSaving(true);setRetrySave(true);setSaveError('');
  try{
   const next=await recordThemeQuest({
    repo:getProgressRepository(),profileId,placement:englishLevel,gradeLevel,
    theme:deck.theme,replay:deck.replay,sessionId:sessionRef.current,
    answers:finalAnswers,durationSeconds:Math.max(1,(Date.now()-startedRef.current)/1000)
   });
   clearThemeCheckpoint(profileId,englishLevel,deck.tier,deck.theme);
   if(!isMounted.current||runRef.current!==run)return;
   setProgress(next);setSaving(false);setRetrySave(false);
   setResult({
    stars:totalMistakes===0&&totalHints===0?3:totalMistakes<=3&&totalHints<=2?2:1,
    independent:finalAnswers.filter(a=>a.kind!=='discover'&&a.independent&&a.firstTryCorrect).length
   });
   setPhase('complete');
   soundService.playSfx('fanfare',0.55);onSaved?.();
  }catch{
   if(!isMounted.current||runRef.current!==run)return;
   setSaving(false);
   setSaveError('Ders bitti ancak kayıt yapılamadı. Yanıtlarını tekrar çözmeden kaydı yeniden dene.');
  }
 };
 const next=()=>{
  if(!deck)return;
  lockRef.current=false;setLocked(false);setStep(s=>s+1);
  setWrongThisStep(0);setHintVisible(false);setSpeechStarted(false);
  setSpeechFailed(false);setFeedback('');setSelected([]);
  soundService.cancelSpeech();
 };
 const check=(input:string)=>{
  if(!task||!deck||saving||locked||lockRef.current||retrySave)return;
  if(task.kind!=='discover'&&!isThemeAnswerCorrect(task,input)){
   const count=wrongThisStep+1;
   setWrongThisStep(count);setMistakes(n=>n+1);
   setFeedback('Bir kez daha deneyelim. İstersen ipucunu açabilirsin.');
   if(task.kind==='assemble')setSelected([]);
   soundService.playSfx('gentle_retry',0.4);
   if(count>=2&&!hintVisible){setHintVisible(true);setHints(n=>n+1);}
   return;
  }
  lockRef.current=true;setLocked(true);setFeedback('✓ Doğru! Yeni göreve geçiyoruz.');
  soundService.playSfx('correct',0.5);
  const firstTry=wrongThisStep===0&&!hintVisible;
  const evidence:ThemeAnswerEvidence={
   taskId:task.id,kind:task.kind,firstTryCorrect:firstTry,
   mistakes:wrongThisStep,hintUsed:hintVisible,speechStarted,
   independent:themeAnswerIndependent(task,firstTry,speechStarted)
  };
  const nextAnswers=[...answers,evidence];
  setAnswers(nextAnswers);
  saveThemeCheckpoint(profileId,englishLevel,deck.tier,deck.theme,{
   replay:deck.replay,sessionId:sessionRef.current,
   taskIds:deck.tasks.map(t=>t.id),step:step+1,answers:nextAnswers,
   mistakes,hints
  });
  const run=runRef.current;
  timerRef.current=setTimeout(()=>{
   if(!isMounted.current||runRef.current!==run)return;
   if(step+1===deck.tasks.length)void finish(nextAnswers,mistakes,hints);
   else next();
  },750);
 };
 const selectedTiles=task?wordTiles(task,selected):[];
 const percent=deck&&count?Math.round(100*Math.min(step,count)/count):0;
 return <div className="tt-root" role="dialog" aria-modal="true" aria-label="Tema Kasabası">
  <div className="tt-shell">
   <header className="tt-header">
    <button className="tt-back" type="button" data-game-exit disabled={saving} onClick={leave} aria-label="Kelime Bahçesi'ne ya da tema listesine dön">← <span>Geri</span></button>
    <div className="tt-brand"><span className="tt-brand-icon" aria-hidden="true">🏘️</span>
     <div><small>VENTRA · KELİME BAHÇESİ</small><h1>Tema Kasabası</h1></div>
    </div>
    <div className="tt-header-chips"><span>{englishLevel}</span><span>✦ {progress.completed}/8</span></div>
   </header>
   {phase==='home'&&<main className="tt-home">
    <section className="tt-hero">
     <div className="tt-hero-copy"><span className="tt-eyebrow">✦ GÜNLÜK HAYATTA İNGİLİZCE ✦</span>
      <h2>Her sokakta yeni bir İngilizce macera!</h2>
      <p>Okuldan hava durumuna, hobilerden duygulara… Resimlere bak, kelimeleri dinle ve günlük İngilizceyi oyunlarla keşfet.</p>
      <div className="tt-hero-metrics"><span>🏘️ 8 tema</span><span>🎧 Dinle ve seç</span>
       <span>🕰️ Gerçek saat oyunları</span></div>
      <button type="button" className="tt-hero-button" disabled={loading||Boolean(loadError)}
       onClick={()=>start(recommended)}>
       {progress.completed===0?'İlk Sokağı Keşfet':'Yolculuğa Devam Et'} <span aria-hidden="true">→</span>
      </button>
     </div>
     <div className="tt-hero-illustration tt-hero-illustration-v2" aria-hidden="true">
      <div className="tt-scene-mosaic">
       {(['school','weather','clothes','hobbies'] as const).map(id=><img key={id}
        src={themeScene(id)} alt="" loading="lazy" decoding="async"/>)}
      </div>
     </div>
    </section>
    <div className="tt-progress-overview" aria-label="Tema Kasabası tamamlanan oyun sayısı">
     <span>🧭 {progress.completed} / {progress.total} temada oyun tamamlandı</span>
     <div className="tt-overview-meter" role="progressbar" aria-label="Kayıtlı tamamlanan tema oyunları" aria-valuemin={0} aria-valuemax={8} aria-valuenow={progress.completed}>
      <span style={{width:(progress.completed/8*100)+'%'}}/></div>
     <small>İngilizce düzeyin: {englishLevel} · İçerik: {tierLabel} · {gradeMode}</small>
    </div>
    {loadError&&<div className="tt-error" role="alert">{loadError} <button type="button" onClick={reload}>Yeniden dene</button></div>}
    <section className="tt-worlds">
     <div className="tt-section-head"><div><span className="tt-eyebrow">KEŞİF YOLUN</span><h2>Hangi sokağa gidelim?</h2></div>
      <p>Her temayı istediğin kadar oynayabilirsin. Doğru kelimeler yeni görevlerde tekrar karşına çıkar.</p>
     </div>
     <div className="tt-world-grid">
      {THEME_DEFINITIONS.map((theme,i)=>{
       const count=progress.replays[theme.id]??0;
       const lastStars=progress.stars[theme.id]??0;
       return <button type="button" key={theme.id} disabled={loading||Boolean(loadError)}
        onClick={()=>start(theme.id)}
        className={'tt-world-card tt-world-'+theme.id+(count?' tt-world-replayed':'')}
        aria-label={theme.title+', '+(count?'tekrar oyna':'keşfet')}>
        <div className="tt-world-top"><span>{String(i+1).padStart(2,'0')} / 08</span>
         <span>{count?'⭐ '+lastStars:theme.id===recommended?'✦ Önerilen':'↗'}</span></div>
        <span className="tt-world-emoji tt-world-scene" aria-hidden="true"><img
          src={themeScene(theme.id)} alt="" loading="lazy" decoding="async"/></span>
        <strong>{theme.title}</strong><small>{theme.subtitle}</small>
        <span className="tt-world-action">{count?'↻ Yeniden Oyna':'Keşfet →'}</span>
       </button>;
      })}
     </div>
    </section>
    <aside className="tt-respect"><span aria-hidden="true">🌟</span>
     <p><strong>Her seviyeye uygun yol:</strong> Sınıfın ve seçtiğin İngilizce düzeyi görevlerin kelimelerini ve uzunluğunu etkiler. Bir dersi bitirmek, tüm kelimeleri kalıcı öğrendiğin anlamına gelmez.</p></aside>
   </main>}
   {phase==='playing'&&<main className="tt-play">
    <div className="tt-play-heading"><div><img className="tt-play-scene" src={themeScene(active)} alt="" decoding="async"/>
     <strong>{currentTheme.title}</strong><small>{tierLabel} · {gradeMode}</small></div>
     <span>{Math.min(step+1,count)} / {count}</span></div>
    <div className="tt-lesson-progress" role="progressbar" aria-label="Dersin ilerlemesi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
     <span style={{width:percent+'%'}}/></div>
    {task&&!retrySave&&<section className="tt-challenge">
     <div className="tt-challenge-head"><span className="tt-task-label">✧ {taskLabel(task.kind)}</span>
      <span className="tt-task-stage">{step<2?'1 · Keşfet':step<count-2?'2 · Dene':'3 · Kullan'}</span></div>
     <h2>{task.promptTr}</h2>
     {task.kind==='clock'&&task.clockMinutes!==undefined&&<>
      <p className="tt-clock-instruction">🕰️ Kısa ibre saati, uzun ibre dakikayı gösterir. Resme dikkatlice bak.</p>
      <ClockFace minutes={task.clockMinutes}/>
     </>}
     {(task.kind==='discover'||task.kind==='picture'||task.kind==='translate')&&task.word&&<div className="tt-picture tt-picture-v2">
      <ThemeWordArtwork key={task.word.en} theme={active} english={task.word.en} translation={task.word.tr} src={wordArt}/>
      <small>{task.word.tr}</small>
      {task.kind==='discover'&&<strong>{task.word.en}</strong>}
     </div>}
     {task.kind==='meaning'&&task.word&&<div className="tt-word-spotlight">{task.word.en}</div>}
     {(task.kind==='phrase'||task.kind==='assemble')&&task.phrase&&<div className="tt-scenario tt-scenario-v2">
      <img className="tt-scenario-theme" src={themeScene(active)} alt="" aria-hidden="true" decoding="async"/>
      <ThemeWordCue theme={active}/><strong>{task.phrase.tr}</strong>
     </div>}
     {task.kind==='listen'&&<div className="tt-headphones" aria-hidden="true">🎧</div>}
     {task.audioText&&<div className="tt-sound-options">
       <button className="tt-speak" type="button" disabled={saving||locked}
        onClick={()=>speak(task.audioText!)}>🔊 {task.kind==='discover'?'İngilizcesini dinle':
        task.kind==='listen'?'Kelimeyi dinle':'İngilizceyi dinle'}</button>
       <button className="tt-speak tt-speak-slow" type="button" disabled={saving||locked}
        onClick={()=>speak(task.audioText!,true)}>🐢 Yavaş dinle</button>
      </div>}
     {speechFailed&&<p className="tt-audio-warning" role="status">
      Ses başlatılamadı. Görselle ve ipucuyla devam edebilirsin. Bu görev dinleme yeterliliği sayılmaz.
     </p>}
     {task.kind==='discover'&&<button className="tt-primary" type="button" disabled={locked||saving}
      onClick={()=>check(task.answer)}>Öğrendim, devam! →</button>}
     {task.kind!=='discover'&&task.kind!=='assemble'&&<div className="tt-choices">
      {task.choices.map((choice,i)=><button type="button" key={i}
       className="tt-choice" disabled={locked||saving} onClick={()=>check(choice)}>{choice}</button>)}
     </div>}
     {task.kind==='assemble'&&<div className="tt-builder">
      <div className="tt-sentence-slots" aria-label="Cümlede seçtiğin İngilizce kelimeler">
       {task.answer.split(' ').map((_,i)=><button type="button" key={i}
        aria-label={i<selected.length?'Kelime '+selectedTiles[i]+' kaldır':'Boş kelime yeri'}
        disabled={locked||saving||i>=selected.length}
        onClick={()=>{setSelected(v=>v.filter((__,index)=>index!==i));setFeedback('');}}>
        {selectedTiles[i]??'·'}</button>)}
      </div>
      <div className="tt-word-bank" aria-label="Seçilebilecek kelimeler">
       {task.choices.map((token,i)=><button key={i} type="button"
        disabled={locked||saving||selected.includes(i)} onClick={()=>setSelected(v=>[...v,i])}>
        {token}</button>)}
      </div>
      <button type="button" className="tt-primary" disabled={locked||saving||selected.length!==task.choices.length}
       onClick={()=>check(selectedTiles.join(' '))}>Cümleyi Kontrol Et ✓</button>
     </div>}
     {task.kind!=='discover'&&<div className="tt-hint-row">
      <button type="button" onClick={showHint} disabled={locked||saving||hintVisible}>💡 Küçük ipucu</button>
      {task.kind==='listen'&&<small>{speechStarted?'✓ Ses başlatıldı':'🔊 Düğmeden dinle'}</small>}
     </div>}
     {hintVisible&&<p role="status" className="tt-hint">💡 {themeTaskHint(task)}</p>}
     <p className={'tt-feedback'+(locked?' tt-feedback-ok':'')} aria-live="polite" role="status">
      {feedback||'Resme bak, düşün, dinle. Acele etmene gerek yok.'}</p>
    </section>}
    {retrySave&&<section className="tt-finish">
     <div className="tt-completion-symbol" aria-hidden="true">🎒</div>
     <h2>Bu macerayı bitirdin!</h2>
     <p>Dersin kaydını tamamlıyoruz. Aynı soruları yeniden çözmene gerek yok.</p>
     {saveError&&<p className="tt-error" role="alert">{saveError}</p>}
     <button type="button" className="tt-primary" disabled={saving}
      onClick={()=>void finish(answers,mistakes,hints)}>{saving?'Kaydediliyor…':'Kaydı yeniden dene'}</button>
    </section>}
   </main>}
   {phase==='complete'&&<main className="tt-complete">
    <span className="tt-complete-art" aria-hidden="true">{currentTheme.icon}</span>
    <span className="tt-eyebrow">MACERA TAMAMLANDI</span>
    <h2>{currentTheme.title}</h2><p>Bu temada yeni İngilizce kelimeleri ve ifadeleri çalıştın. Tekrar ederek daha iyi hatırlayabilirsin.</p>
    <div className="tt-stars" aria-label={(result?.stars??1)+' yıldız kazandın'}>{'⭐'.repeat(result?.stars??1)}</div>
    <small>Yardım almadan ilk denemede çözdüğün görev: {result?.independent??0}. Bu sayı tek başına dil yeterliği ölçümü değildir.</small>
    <div className="tt-complete-actions">
     <button type="button" className="tt-primary" onClick={()=>start(THEME_ORDER[(THEME_ORDER.indexOf(active)+1)%8])}>Sonraki Sokağa Geç →</button>
     <button type="button" className="tt-secondary" onClick={()=>start(active)}>↻ Farklı sorularla tekrar oyna</button>
     <button type="button" className="tt-secondary" onClick={leave}>Tema Kasabası haritasına dön</button>
    </div>
   </main>}
   <footer className="tt-footer">🌿 Her çocuk kendi hızında öğrenir. Yanlışlar, bir sonraki denemeye hazırlıktır.</footer>
  </div>
 </div>;
}
