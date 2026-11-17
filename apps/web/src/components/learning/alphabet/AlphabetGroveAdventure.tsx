'use client';
import React,{useEffect,useRef,useState} from 'react';
import {soundService} from '@/lib/audio/SoundService';
import {getProgressRepository} from '@/lib/progress';
import type {EnglishPlacement} from '@/lib/learning/gradeAwareLearningPolicy';
import {
 ALPHABET_LETTERS,ALPHABET_LESSONS,ALPHABET_TOTAL_LESSONS,
 alphabetHint,alphabetTaskCorrect,planAlphabetLesson,
 type AlphabetAnswerEvidence,type AlphabetTask
} from '@/lib/learning/alphabetGroveEngine';
import {getAlphabetProgress,recordAlphabetLesson,type AlphabetProgress} from '@/lib/learning/alphabetProgress';
import {
 loadAlphabetCheckpoint,saveAlphabetCheckpoint,clearAlphabetCheckpoint
} from '@/lib/learning/alphabetCheckpoint';
import './alphabet-grove.css';

type Phase='home'|'playing'|'complete';
interface Props{
 profileId:string;englishLevel:EnglishPlacement;gradeLevel:number|null;
 onBack:()=>void;onSaved?:()=>void;
}
const EMPTY:AlphabetProgress={completed:0,total:12,stars:{},replays:{}};
const labelFor=(kind:AlphabetTask['kind']):string=>({
 introduce:'YENİ HARF','word-link':'İNGİLİZCE KELİME AVI','letter-name':'HARF ADINI DİNLE',
 'sound-in-word':'KELİMEDEKİ SES','read-word':'KELİMEYİ OKU','build-word':'HARFLERLE KUR'
})[kind];
const questionNeedsAudio=(kind:AlphabetTask['kind'])=>
 kind==='letter-name'||kind==='sound-in-word';
export const AlphabetGroveAdventure:React.FC<Props>=({
 profileId,englishLevel,gradeLevel,onBack,onSaved
})=>{
 const [phase,setPhase]=useState<Phase>('home');
 const [progress,setProgress]=useState<AlphabetProgress>(EMPTY);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [lesson,setLesson]=useState(1);
 const [deck,setDeck]=useState<readonly AlphabetTask[]>([]);
 const [replay,setReplay]=useState(0);
 const [step,setStep]=useState(0);
 const [answers,setAnswers]=useState<readonly AlphabetAnswerEvidence[]>([]);
 const [mistakes,setMistakes]=useState(0);
 const [hints,setHints]=useState(0);
 const [wrongOnStep,setWrongOnStep]=useState(0);
 const [hintVisible,setHintVisible]=useState(false);
 const [heard,setHeard]=useState(false);
 const [audioFailed,setAudioFailed]=useState(false);
 const [selected,setSelected]=useState<readonly number[]>([]);
 const [resolved,setResolved]=useState(false);
 const [saving,setSaving]=useState(false);
 const [message,setMessage]=useState('');
 const [result,setResult]=useState<{stars:number;firstTry:number}|null>(null);
 const [pendingRetry,setPendingRetry]=useState(false);
 const run=useRef(0);
 const time=useRef<ReturnType<typeof setTimeout>|null>(null);
 const session=useRef('');
 const started=useRef(0);
 const locked=useRef(false);
 const alive=useRef(true);
 const task=deck[step];
 const focus=ALPHABET_LETTERS.find(x=>x.id===task?.letterId);
 const recommended=ALPHABET_LESSONS.find(x=>!progress.replays[x.id])?.id??1;
 const discovered=ALPHABET_LESSONS.filter(x=>x.group==='letters'&&progress.replays[x.id]>0)
  .reduce((n,x)=>n+x.letters.length,0);

 useEffect(()=>{
  alive.current=true;
  let active=true;
  setLoading(true);setError('');setPhase('home');setProgress(EMPTY);
  void getAlphabetProgress(getProgressRepository(),profileId,englishLevel)
   .then(row=>{if(active)setProgress(row);})
   .catch(()=>{if(active)setError('Harf Korusu ilerlemesi okunamadı. Mevcut kayıtların korunuyor.');})
   .finally(()=>{if(active)setLoading(false);});
  return ()=>{
   active=false;alive.current=false;run.current++;
   if(time.current)clearTimeout(time.current);
   soundService.cancelSpeech();
  };
 },[profileId,englishLevel]);
 useEffect(()=>{
  const visibility=()=>{if(document.hidden)soundService.cancelSpeech();};
  document.addEventListener('visibilitychange',visibility);
  return ()=>document.removeEventListener('visibilitychange',visibility);
 },[]);
 const leave=()=>{
  if(saving)return;
  run.current++;locked.current=false;
  if(time.current)clearTimeout(time.current);
  soundService.cancelSpeech();
  if(phase==='home')onBack();
  else {setPhase('home');setError('');setMessage('');}
 };
 const enter=(id:number)=>{
  if(loading||saving||!profileId)return;
  const index=progress.replays[id]??0;
  const saved=loadAlphabetCheckpoint(profileId,englishLevel,id);
  const fromCheckpoint=saved?.replay===index?saved:null;
  const plan=planAlphabetLesson({lesson:id,placement:englishLevel,gradeLevel,replay:index});
  const valid=fromCheckpoint&&fromCheckpoint.taskIds.length===plan.length&&
   fromCheckpoint.taskIds.every((entry,i)=>entry===plan[i].id);
  if(saved&&!valid)clearAlphabetCheckpoint(profileId,englishLevel,id);
  run.current++;locked.current=false;
  session.current=valid?fromCheckpoint.sessionId:crypto.randomUUID();
  started.current=Date.now();setDeck(plan);setReplay(index);setLesson(id);
  setStep(valid?fromCheckpoint.step:0);
  setAnswers(valid?fromCheckpoint.answers:[]);
  setMistakes(valid?fromCheckpoint.mistakes:0);
  setHints(valid?fromCheckpoint.hints:0);
  setWrongOnStep(0);setHintVisible(false);setHeard(false);
  setAudioFailed(false);setSelected([]);setResolved(false);
  setResult(null);setPendingRetry(Boolean(valid&&fromCheckpoint.step===plan.length));
  setMessage('');setError('');setPhase('playing');
  soundService.unlockAudio();soundService.playSfx('island_portal',.35);
 };
 const speak=(value:string,kind:'word'|'name'='word')=>{
  if(saving||resolved)return;
  soundService.unlockAudio();
  setAudioFailed(false);
  const done=soundService.speakEnglish(value,{
   rate:gradeLevel!=null&&gradeLevel<=2?0.79:0.9,
   onStart:()=>{if(kind==='word'&&task?.kind==='sound-in-word'||kind==='name'&&task?.kind==='letter-name')setHeard(true);},
   onError:()=>setAudioFailed(true)
  });
  if(!done)setAudioFailed(true);
 };
 const showHint=()=>{
  if(saving||resolved||!task||hintVisible)return;
  setHintVisible(true);setHints(v=>v+1);
 };
 const advance=()=>{
  locked.current=false;soundService.cancelSpeech();setStep(v=>v+1);setWrongOnStep(0);
  setHintVisible(false);setHeard(false);setAudioFailed(false);
  setSelected([]);setResolved(false);setMessage('');
 };
 const save=async(rows:readonly AlphabetAnswerEvidence[],totalErrors:number,totalHints:number)=>{
  const active=run.current;setSaving(true);setPendingRetry(true);setError('');
  try{
   const next=await recordAlphabetLesson({
    repo:getProgressRepository(),profileId,placement:englishLevel,lesson,
    sessionId:session.current,answers:rows,
    durationSeconds:Math.max(1,(Date.now()-started.current)/1000)
   });
   clearAlphabetCheckpoint(profileId,englishLevel,lesson);
   if(!alive.current||run.current!==active)return;
   setProgress(next);setPendingRetry(false);setSaving(false);
   const firstTry=rows.filter(x=>x.firstTryCorrect&&x.kind!=='introduce').length;
   setResult({firstTry,stars:totalErrors===0&&totalHints===0?3:totalErrors<=3&&totalHints<=2?2:1});
   setPhase('complete');soundService.playSfx('fanfare',.6);onSaved?.();
  }catch{
   if(!alive.current||run.current!==active)return;
   setSaving(false);setError('Kayıt tamamlanamadı. Aynı oturumla yeniden dene; cevaplarını tekrar vermene gerek yok.');
  }
 };
 const finishTask=(answer:string)=>{
  if(!task||saving||resolved||locked.current||pendingRetry)return;
  if(task.kind!=='introduce'&&!alphabetTaskCorrect(task,answer)){
   const wrong=wrongOnStep+1;
   setWrongOnStep(wrong);setMistakes(n=>n+1);
   setMessage('Bu kez olmadı. Tekrar dene, istersen ipucunu kullan.');
   soundService.playSfx('gentle_retry',.5);
   if(wrong>=2&&!hintVisible){setHintVisible(true);setHints(n=>n+1);}
   return;
  }
  locked.current=true;setResolved(true);setMessage('Harika, devam ediyoruz!');
  soundService.playSfx('correct',.6);
  const firstTry=wrongOnStep===0&&!hintVisible;
  const evidence:AlphabetAnswerEvidence={
   taskId:task.id,kind:task.kind,firstTryCorrect:firstTry,
   mistakes:wrongOnStep,hintUsed:hintVisible,audioPlayed:heard,
   independent:task.kind!=='introduce'&&task.kind!=='build-word'&&firstTry&&
    (!questionNeedsAudio(task.kind)||heard)
  };
  const rows=[...answers,evidence];
  const errors=mistakes,hintsUsed=hints;
  setAnswers(rows);
  saveAlphabetCheckpoint(profileId,englishLevel,lesson,{
   replay,taskIds:deck.map(t=>t.id),step:step+1,answers:rows,
   mistakes:errors,hints:hintsUsed,sessionId:session.current
  });
  const active=run.current;
  time.current=setTimeout(()=>{
   if(!alive.current||run.current!==active)return;
   if(step+1===deck.length)void save(rows,errors,hintsUsed);
   else advance();
  },850);
 };
 const addTile=(index:number)=>{
  if(!task||resolved||saving||selected.includes(index))return;
  const next=[...selected,index];setSelected(next);setMessage('');
 };
 const wordTiles=task?.kind==='build-word'?selected.map(index=>task.choices[index]):[];
 const percent=deck.length?Math.round(100*Math.min(step,deck.length)/deck.length):0;
 return <div className="ag-root" role="dialog" aria-modal="true" aria-label="Harf Korusu">
  <div className="ag-starscape" aria-hidden="true"/>
  <div className="ag-shell">
   <header className="ag-header">
    <button type="button" onClick={leave} disabled={saving} className="ag-back" aria-label={phase==='home'?'Kelime Bahçesi’ne dön':'Harf Korusu haritasına dön'}>← <span>Geri</span></button>
    <div className="ag-identity"><span className="ag-crest" aria-hidden="true">🌿</span>
     <div><small>VENTRA · KELİME BAHÇESİ</small><h1>Harf Korusu</h1></div>
    </div>
    <div className="ag-header-pills"><span className="ag-mini-pill">{englishLevel}</span>
     <span className="ag-mini-pill">✨ {progress.completed}/12</span></div>
   </header>
   {phase==='home'&&<main className="ag-home">
    <section className="ag-hero" aria-labelledby="ag-hero-title">
     <div className="ag-hero-copy">
      <span className="ag-eyebrow">✦ İNGİLİZCE OKUMAYA İLK ADIM ✦</span>
      <h2 id="ag-hero-title">Harflerden kelimelere, kendi sihirli yolculuğun.</h2>
      <p>Harflerin İngilizce adını öğren, kelimelerin içindeki sesleri keşfet ve kısa kelimeleri kendin kur.</p>
      <div className="ag-hero-stats"><span>🔤 26 harf</span><span>📖 12 macera</span><span>🔊 Kelimelerle ses keşfi</span></div>
      <button type="button" onClick={()=>enter(recommended)} disabled={loading||Boolean(error)} className="ag-cta">
       {progress.completed?'Kaldığın yerden keşfet':'Keşfe Başla'} <span aria-hidden="true">→</span>
      </button>
     </div>
     <div className="ag-hero-art" aria-hidden="true">
      <div className="ag-art-sun">✧</div>
      <div className="ag-tree ag-tree-left">🌳</div>
      <div className="ag-tree ag-tree-right">🌲</div>
      <div className="ag-art-card ag-art-a">A<span>a</span></div>
      <div className="ag-art-card ag-art-b">B<span>b</span></div>
      <div className="ag-art-card ag-art-c">C<span>c</span></div>
      <div className="ag-art-ground">🌼 🌱 🍄 🌷 🌿</div>
     </div>
    </section>
    <div className="ag-metrics">
     <div><b>{discovered}<small>/26</small></b><span>Görevini tamamladığın harf</span></div>
     <div><b>{progress.completed}<small>/12</small></b><span>Bitirdiğin mini ders</span></div>
     <div><b>3</b><span>Tanı · Dinle · Oku</span></div>
    </div>
    {error&&<div className="ag-error" role="alert">{error}
     <button onClick={()=>{setError('');setLoading(true);void getAlphabetProgress(getProgressRepository(),profileId,englishLevel).then(setProgress).catch(()=>setError('İlerleme okunamadı.')).finally(()=>setLoading(false));}}>Yeniden dene</button></div>}
    <section className="ag-catalog" aria-labelledby="ag-catalog-title">
     <div className="ag-section-head"><div><small>12 DURAKLI İNGİLİZCE YOLU</small><h2 id="ag-catalog-title">Hangi maceraya gidelim?</h2></div>
      <span>İstediğin dersi tekrar oynayabilirsin</span></div>
     <div className="ag-grid">
      {ALPHABET_LESSONS.map((unit,index)=>{
       const done=Boolean(progress.replays[unit.id]),suggested=unit.id===recommended;
       return <button type="button" key={unit.id}
        className={'ag-lesson-card'+(suggested?' ag-suggested':'')+(done?' ag-done':'')}
        disabled={loading||Boolean(error)} onClick={()=>enter(unit.id)}
        aria-label={unit.title+', '+unit.subtitle+', '+(done?'tekrar oyna':'başla')}>
        <span className="ag-unit-top"><span className="ag-unit-index">{String(index+1).padStart(2,'0')}</span>
         <span className="ag-unit-star">{done?'⭐ '+(progress.stars[unit.id]??0):suggested?'✦ Önerilen':'↗'}</span></span>
        <span className="ag-unit-symbol" aria-hidden="true">{unit.icon}</span>
        <strong>{unit.title}</strong><small>{unit.subtitle}</small>
        <span className="ag-unit-action">{done?'↻ Tekrar oyna':'→ Keşfet'}</span>
       </button>;
      })}
     </div>
    </section>
    <section className="ag-letter-library" aria-label="İngilizce alfabe harfleri">
     <h2>🔤 İngilizce harf koleksiyonun</h2>
     <p>Harfleri İngilizce kelimelerle keşfet, resimlerle eşleştir ve kelimelerdeki seslerini dinle. Büyük ve küçük yazılışlar yalnızca yardımcı gösterimdir.</p>
     <div className="ag-mini-letters">{ALPHABET_LETTERS.map(l=>
      <span key={l.id} title={l.anchor+' · '+l.tr}>{l.upper}<small>{l.lower}</small></span>)}</div>
    </section>
   </main>}
   {phase==='playing'&&<main className="ag-play">
    <div className="ag-play-top"><span>{ALPHABET_LESSONS[lesson-1]?.icon} {ALPHABET_LESSONS[lesson-1]?.title}</span>
     <span>{Math.min(step+1,deck.length)} / {deck.length} görev</span></div>
    <div className="ag-progress" role="progressbar" aria-label="Ders ilerlemesi" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{width:percent+'%'}}/></div>
    {task&&!pendingRetry&&<section className="ag-challenge" aria-live="off">
     <div className="ag-challenge-head"><span className="ag-task-badge">{labelFor(task.kind)}</span><span className="ag-task-icon" aria-hidden="true">{task.kind==='introduce'?'🌱':task.kind==='build-word'?'✍️':'✨'}</span></div>
     <h2>{task.promptTr}</h2>
     {task.kind==='introduce'&&focus&&<div className="ag-introduce">
      <div className="ag-letter-monument"><span>{focus.upper}</span><small>{focus.lower}</small></div>
      <div className="ag-intro-example"><span className="ag-emoji" aria-hidden="true">{focus.icon}</span>
       <strong>{focus.anchor}</strong><small>{focus.tr}</small>
       <p>Kelimenin {focus.focus==='end'?'sonundaki':'başındaki'} ses: <b>{focus.ipa}</b></p>
       {focus.noteTr&&<p>{focus.noteTr}</p>}</div>
      <div className="ag-voice-row">
       <button type="button" disabled={saving||resolved} onClick={()=>speak(focus.upper,'name')}>🔊 Harf adını dinle</button>
       <button type="button" disabled={saving||resolved} onClick={()=>speak(focus.anchor)}>🎧 Kelimeyi dinle</button>
      </div>
      <button type="button" className="ag-primary-action" disabled={saving||resolved} onClick={()=>finishTask(task.answer)}>Anladım, devam et →</button>
     </div>}
     {task.kind!=='introduce'&&<>
      {task.kind==='word-link'&&focus&&<div className="ag-word-link-scene" aria-label={focus.upper+' harfi ve '+focus.tr+' için İngilizce kelime seç'}>
       <div className="ag-word-link-letter" aria-label={focus.upper+' harfi'}>{focus.upper}</div>
       <span className="ag-word-link-arrow" aria-hidden="true">✦</span>
       <div className="ag-word-link-picture"><span aria-hidden="true">{focus.icon}</span>
        <small>{focus.tr}</small></div>
      </div>}
      {task.word&&<div className="ag-target-art"><span aria-hidden="true">{task.word.icon}</span><small>{task.word.tr}</small></div>}
      {task.kind==='sound-in-word'&&focus&&<div className="ag-target-art"><span aria-hidden="true">{focus.icon}</span><small>{focus.tr}</small></div>}
      {task.kind==='letter-name'&&<div className="ag-hearing-icon" aria-hidden="true">🎧</div>}
      {task.audioText&&<button type="button" className="ag-listen" disabled={saving||resolved}
       onClick={()=>speak(task.audioText!,task.kind==='letter-name'?'name':'word')}>
       🔊 {task.kind==='letter-name'?'Harf adını dinle':'İngilizce kelimeyi dinle'}
      </button>}
      {audioFailed&&<p role="status" className="ag-audio-warning">Ses bu cihazda başlamadı. İpucunu kullanarak görselden devam edebilirsin; bu dinleme başarısı sayılmaz.</p>}
      {task.kind!=='build-word'&&<div className="ag-choices">
       {task.choices.map((choice,i)=><button type="button" key={i} disabled={resolved||saving}
        className={'ag-choice'+(choice.length===1?' ag-choice-letter':'')} onClick={()=>finishTask(choice)}>
        {choice}</button>)}
      </div>}
      {task.kind==='build-word'&&<div className="ag-builder">
       <div className="ag-answer-slots" aria-label="Oluşturduğun kelime">
        {task.answer.split('').map((_,i)=><button type="button" key={i}
         disabled={resolved||saving||i>=selected.length}
         onClick={()=>{setSelected(old=>old.filter((__,idx)=>idx!==i));setMessage('');}}
         aria-label={i<selected.length?'Harf '+wordTiles[i]+' kaldır':'Boş harf yeri'}>
         {wordTiles[i]??'·'}</button>)}
       </div>
       <div className="ag-letter-tiles" aria-label="Harf bankası">
        {task.choices.map((ch,i)=><button type="button" key={i} disabled={resolved||saving||selected.includes(i)}
         onClick={()=>addTile(i)}>{ch.toUpperCase()}</button>)}
       </div>
       <button type="button" className="ag-primary-action" onClick={()=>finishTask(wordTiles.join(''))}
        disabled={resolved||saving||selected.length!==task.answer.length}>Kelimeyi kontrol et ✓</button>
      </div>}
      <div className="ag-help-row">
       <button type="button" onClick={showHint} disabled={saving||resolved||hintVisible}>💡 Küçük ipucu</button>
       {questionNeedsAudio(task.kind)&&<span>{heard?'✓ Ses çalındı':'🔊 Dinleyerek öğren'}</span>}
      </div>
      {hintVisible&&<p className="ag-hint" role="status">💡 {alphabetHint(task)}
       {audioFailed&&focus&&<span> Harf: <b>{focus.upper}</b>.</span>}</p>}
     </>}
     <p className={'ag-feedback'+(resolved?' ag-correct':'')} role="status" aria-live="polite">{message||(resolved?'✓ Doğru!':'Düşün, dinle ve seç. Acele etmene gerek yok.')}</p>
    </section>}
    {pendingRetry&&<section className="ag-challenge ag-pending">
     <div aria-hidden="true" className="ag-finish-emblem">🗝️</div>
     <h2>Macera tamamlandı!</h2>
     <p>Yanıtların hazır. Kaydı tamamlamak için aşağıdaki düğmeye dokun.</p>
     {error&&<p role="alert" className="ag-error">{error}</p>}
     <button className="ag-primary-action" disabled={saving} onClick={()=>void save(answers,mistakes,hints)}>{saving?'Kaydediliyor…':'Kaydı tekrar dene'}</button>
    </section>}
   </main>}
   {phase==='complete'&&<main className="ag-complete">
    <div className="ag-trophy" aria-hidden="true">🏆</div>
    <span className="ag-eyebrow">DERS TAMAMLANDI</span>
    <h2>{ALPHABET_LESSONS[lesson-1]?.title}</h2>
    <p>Yeni harfleri ve İngilizce kelimeleri çalıştın. Hatırlamak için başka bir gün tekrar gel.</p>
    <div className="ag-earned" aria-label={(result?.stars??0)+' yıldız kazandın'}>{'⭐'.repeat(result?.stars??1)}</div>
    <p className="ag-evidence">İlk denemede, yardımsız doğru: {result?.firstTry??0}. Tamamlamak tek başına İngilizce ustalığı kanıtı değildir.</p>
    <div className="ag-complete-buttons">
     <button type="button" className="ag-primary-action" onClick={()=>enter(Math.min(12,lesson+1))}>{lesson===12?'Başka bir tur →':'Sonraki ders →'}</button>
     <button type="button" className="ag-secondary-action" onClick={()=>enter(lesson)}>↻ Farklı görevlerle tekrar oyna</button>
     <button type="button" className="ag-secondary-action" onClick={leave}>Harf Korusu haritasına dön</button>
    </div>
   </main>}
   <footer className="ag-footer">🌿 Her çocuk kendi hızında öğrenir. Ses yoksa görselle devam edebilirsin.</footer>
  </div>
 </div>;
};
