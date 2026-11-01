'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import type {FoodAnswerEvidence} from '@ventra/shared';
import {getProgressRepository} from '@/lib/progress';
import {type EnglishPlacement} from '@/lib/learning/gradeAwareLearningPolicy';
import {MARKET_AISLES,MARKET_STAGES,MARKET_OFFSETS,
 marketWord,marketNounPhrase,marketResumePoint,planMarketMission,type MarketAisle,type MarketStage,type MarketPlan} from '@/lib/learning/foodMarketEngine';
import type {FoodMarketProgress} from '@/lib/progress/foodMarketProgress';
import {soundService} from '@/lib/audio/SoundService';
import './food-market.css';

type Props={
 profileId:string;gradeLevel?:number|null;englishLevel:EnglishPlacement;
 progress:FoodMarketProgress;onBack:()=>void;
 onSave:(aisle:MarketAisle,stage:MarketStage,mistakes:number,duration:number,
  answers:FoodAnswerEvidence[],sessionId:string)=>Promise<void>;
};
const newSession=(profileId:string,aisle:MarketAisle,stage:MarketStage)=>
  `food:${profileId}:${aisle}:${stage}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

function MarketBackdrop({aisle,stage}:{aisle:MarketAisle;stage:MarketStage}){
 return <svg aria-hidden="true" className="fm-backdrop" viewBox="0 0 1000 340" preserveAspectRatio="xMidYMid slice">
  <defs>
   <linearGradient id="fm-sky" x2="0" y2="1"><stop stopColor="#7ce4e8"/><stop offset="1" stopColor="#f4dfb1"/></linearGradient>
   <linearGradient id="fm-canopy" x2="0" y2="1"><stop stopColor={aisle==='orchard'?'#f78f77':aisle==='bakery'?'#f6ba6b':'#7cd5ac'}/><stop offset="1" stopColor={aisle==='orchard'?'#c8527a':aisle==='bakery'?'#dc835e':'#3c9e9f'}/></linearGradient>
  </defs>
  <rect width="1000" height="340" fill="url(#fm-sky)"/>
  <circle cx="838" cy="47" r="48" fill="#fff7cd" opacity=".8"/>
  <path d="M0 185 Q110 112 245 174 T500 157 T750 152 T1000 161 V340 H0Z" fill="#8ecfa5"/>
  <path d="M0 220 Q155 164 325 230 T675 195 T1000 224 V340 H0Z" fill="#64b99b"/>
  <path d="M0 285 Q500 242 1000 285 V340 H0Z" fill="#d8b28f"/>
  {[115,525,886].map((x,i)=><g key={i} opacity={i===1?.94:.75}>
    <rect x={x-90} y="166" width="180" height="115" rx="9" fill="#f1d8ad" stroke="#9f8d72" strokeWidth="4"/>
    <rect x={x-102} y="160" width="204" height="17" rx="6" fill="#6a554e"/>
    <path d={`M${x-106} 163 L${x-80} 106 H${x+80} L${x+106} 163Z`} fill="url(#fm-canopy)" stroke="#fff1c5" strokeWidth="6"/>
    {Array.from({length:5},(_,n)=><path key={n} d={`M${x-80+n*40} 109 L${x-60+n*40} 160`}
      stroke="#ffeed1" strokeWidth="9" opacity=".68"/>)}
    <rect x={x-107} y="248" width="214" height="28" rx="8" fill="#835950"/>
    <rect x={x-90} y="232" width="180" height="15" rx="4" fill="#e7ab63"/>
    {Array.from({length:5},(_,n)=><circle key={n} cx={x-67+n*33} cy="236" r="13"
     fill={i===0?['#f26e5a','#ffb954','#ea617c'][n%3]:i===1?'#efcf8d':'#9be3df'}
     stroke="#fff5d8" strokeWidth="2"/>)}
    <path d={`M${x-73} 283 v23 m146 -23 v23`} stroke="#614b4a" strokeWidth="9" strokeLinecap="round"/>
   </g>)}
   {Array.from({length:12},(_,i)=><g key={i} opacity=".75">
    <path d={`M${15+i*91} ${291+(i%3)*12} v-10`} stroke="#4a966b" strokeWidth="2"/>
    <circle cx={15+i*91} cy={286+(i%3)*12} r="4" fill={i%3===0?'#fff8be':'#fd91b4'}/>
   </g>)}
   <rect x="357" y="39" width="286" height="64" rx="18" fill="#fff8df" stroke="#b4766a" strokeWidth="6"/>
   <text x="500" y="81" textAnchor="middle" fontFamily="sans-serif" fontWeight="900" fontSize="31" fill="#9b4e56">FOOD MARKET</text>
   {stage===5&&<g><path d="M470 280 l25 29 h60 l24 -29" fill="none" stroke="#fdf1ce" strokeWidth="10" strokeLinecap="round"/></g>}
 </svg>;
}
function Item({id,showEnglish=false,selected=false,active=false,disabled=false,onClick,draggable=false,onDragStart}:
 {id:string;showEnglish?:boolean;selected?:boolean;active?:boolean;disabled?:boolean;onClick?:()=>void;draggable?:boolean;onDragStart?:(event:React.DragEvent<HTMLButtonElement>)=>void}){
 const w=marketWord(id);
 return <button type="button" onClick={onClick} disabled={disabled} draggable={draggable&&!disabled} onDragStart={onDragStart}
   aria-pressed={selected}
   aria-label={showEnglish?`${w.id}, ${w.tr}`:`Ürün resmi: ${w.tr}`}
   className={`fm-product ${selected?'fm-product-selected':''} ${active?'fm-product-good':''}`}
   title={showEnglish?w.id:undefined}>
   <span className={`fm-product-illustration fm-product-illustration-${w.aisle}`} aria-hidden="true">
     <svg className="fm-product-illustration-frame" viewBox="0 0 140 112" preserveAspectRatio="xMidYMid meet">
       <defs><linearGradient id={`fm-item-${w.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#fff9df"/><stop offset="1" stopColor={w.aisle==='orchard'?'#f3b9a4':w.aisle==='bakery'?'#efd1a1':'#b1e0d5'}/>
       </linearGradient></defs>
       <rect x="7" y="8" width="126" height="96" rx="27" fill={`url(#fm-item-${w.id})`} stroke="#ffffff" strokeWidth="3"/>
       <ellipse cx="70" cy="93" rx="39" ry="7" fill="#735b5a" opacity=".16"/>
       <path d="M29 39 Q70 7 110 39" fill="none" stroke="#fffef1" strokeWidth="3" opacity=".75"/>
       <circle cx="20" cy="78" r="3" fill="#ffffff" opacity=".9"/><circle cx="117" cy="23" r="4" fill="#ffffff" opacity=".9"/>
     </svg>
     <span className="fm-product-art">{w.icon}</span>
   </span>
   {showEnglish&&<span className="fm-product-name">{w.id}</span>}
   {selected&&<span className="fm-check" aria-hidden="true">✓</span>}
 </button>;
}
export function FoodMarketAdventure({profileId,gradeLevel=null,englishLevel,progress,onBack,onSave}:Props){
 const [aisle,setAisle]=useState<MarketAisle>(()=>marketResumePoint(progress.completedByAisle).aisle);
 const [stage,setStage]=useState<MarketStage>(()=>marketResumePoint(progress.completedByAisle).stage);
 const [revision,setRevision]=useState(0);
 const [plan,setPlan]=useState<MarketPlan|null>(null);
 const [planKey,setPlanKey]=useState('');
 const [loadError,setLoadError]=useState(false);
 const [visited,setVisited]=useState<string[]>([]);
 const [answers,setAnswers]=useState<FoodAnswerEvidence[]>([]);
 const [wrong,setWrong]=useState(0);
 const [roundWrong,setRoundWrong]=useState(0);
 const [q,setQ]=useState(0);
 const [hint,setHint]=useState(false);
 const [heard,setHeard]=useState(false);
 const [speaking,setSpeaking]=useState(false);
 const [selected,setSelected]=useState<string|null>(null);
 const [success,setSuccess]=useState(false);
 const [finished,setFinished]=useState(false);
 const [busy,setBusy]=useState(false);
 const [saveError,setSaveError]=useState('');
 const [feedback,setFeedback]=useState('');
 const [muted,setMuted]=useState(()=>soundService.getMuted());
 const started=useRef(Date.now());
 const session=useRef(newSession(profileId,aisle,stage));
 const locked=useRef(false);
 const dialog=useRef<HTMLDivElement>(null);
 const speechRun=useRef(0);
 const key=`${profileId}/${aisle}/${stage}/${gradeLevel}/${englishLevel}/${revision}`;
 const current=planKey===key&&plan?.stage===stage&&plan?.aisle===aisle?plan:null;
 const task=current?.questions[q];
 const usedStage=progress.completedByAisle[aisle];
 const numberOfQuestions=stage===1?current?.words.length??0:current?.questions.length??0;
 const completed=stage===1?visited.length:q+Number(success);
 const stageMeta=MARKET_STAGES[stage-1];
 const currentAisle=MARKET_AISLES.find(x=>x.id===aisle)!;
 const cancelVoice=useCallback(()=>{
   speechRun.current++;
   setSpeaking(false);
   if(typeof window!=='undefined'&&'speechSynthesis' in window)window.speechSynthesis.cancel();
 },[]);
 useEffect(()=>{
  let alive=true;
  setLoadError(false);setPlan(null);setPlanKey('');
  getProgressRepository().getFoodAnswerHistory(profileId).then(history=>{
   if(!alive)return;
   const next=planMarketMission({aisle,stage,history,englishLevel,gradeLevel,seed:Math.floor(Math.random()*4294967295)});
   setPlan(next);setPlanKey(key);
  }).catch(err=>{console.error('Pazar görevi planlanamadı',err);if(alive)setLoadError(true)});
  return()=>{alive=false};
 },[key,profileId,aisle,stage,englishLevel,gradeLevel]);
 useEffect(()=>()=>{speechRun.current++;if(typeof window!=='undefined'&&'speechSynthesis' in window)window.speechSynthesis.cancel()},[]);
 useEffect(()=>{
  dialog.current?.scrollTo({top:0,behavior:'instant'});
  setHeard(false);setSpeaking(false);
 },[aisle,stage,q,revision]);
 function speak(text:string,listenGate=false){
  cancelVoice();
  if(muted||typeof window==='undefined'||!('speechSynthesis' in window)||
     typeof SpeechSynthesisUtterance==='undefined'){
    if(listenGate){setHint(true);setFeedback('Ses kullanılamıyor. Yazılı destekle devam edebilirsin.');}
    return;
  }
  const token=speechRun.current;
  try{
    const voice=new SpeechSynthesisUtterance(text);voice.lang='en-US';voice.rate=.78;
    voice.onstart=()=>{if(token!==speechRun.current)return;setSpeaking(true);};
    voice.onend=()=>{if(token===speechRun.current){setSpeaking(false);if(listenGate)setHeard(true);}};
    voice.onerror=()=>{if(token!==speechRun.current)return;setSpeaking(false);
      if(listenGate){setHeard(false);setHint(true);setFeedback('Ses tamamlanamadı; yazılı destek açıldı.');}};
    window.speechSynthesis.speak(voice);
  }catch{if(listenGate){setHint(true);setFeedback('Ses açılamadı. Yazılı destekle devam et.');}}
 }
 function changeStage(next:MarketStage,nextAisle:MarketAisle=aisle){
   if(busy)return;
   cancelVoice();locked.current=false;
   session.current=newSession(profileId,nextAisle,next);
   started.current=Date.now();
   setStage(next);setAisle(nextAisle);setRevision(v=>v+1);
   setVisited([]);setAnswers([]);setWrong(0);setRoundWrong(0);setQ(0);
   setHint(false);setHeard(false);setSelected(null);setSuccess(false);
   setFinished(false);setBusy(false);setSaveError('');setFeedback('');
 }
 async function finish(result:FoodAnswerEvidence[]){
   if(locked.current||result.length<4)return;
   locked.current=true;setBusy(true);setSaveError('');
   try{
     await onSave(aisle,stage,wrong,(Date.now()-started.current)/1000,result,session.current);
     setFinished(true);setFeedback('Görev kaydedildi! Pazar biraz daha canlandı.');
   }catch(err){console.error('Pazar görevi kaydedilemedi',err);
     setSaveError('İlerleme kaydedilemedi. Tekrar deneyebilirsin.');
     locked.current=false;
   }finally{setBusy(false);}
 }
 function record(id:string,kind:FoodAnswerEvidence['kind'],errors:number,assisted:boolean):FoodAnswerEvidence{
  return {wordId:id,kind,mistakes:errors,firstTryCorrect:errors===0&&!assisted,
    hintUsed:assisted,timestamp:new Date().toISOString()};
 }
 function discover(id:string){
  if(!current||stage!==1||busy||finished)return;
  speak(id);setFeedback(`${marketWord(id).id.toUpperCase()} · ${marketWord(id).tr}`);
  if(visited.includes(id))return;
  setVisited(a=>[...a,id]);
  setAnswers(a=>[...a,record(id,'discovery',0,false)]);
 }
 function choose(id:string){
  if(!current||!task||busy||finished||success||locked.current)return;
  if(stage===3&&!heard&&!hint)return;
  if(id!==task.target){
    setWrong(x=>x+1);setRoundWrong(x=>x+1);
    setFeedback('Bir kez daha dene. İngilizce kelimeyi veya sesi tekrar incele.');
    return;
  }
  const kind=stage===2?'recognition':stage===3?'listening':stage===4?'dialogue':'application';
  const proof=record(id,kind,roundWrong,hint||(stage===3&&!heard));
  const next=[...answers,proof];
  setAnswers(next);setSelected(id);setSuccess(true);
  setFeedback(`✓ ${marketWord(id).id.toUpperCase()} — doğru seçim!`);
  if(stage!==3)speak(stage===4?`Thank you! ${id}.`:id);
 }
 function advance(){
  if(!success||busy||!current)return;
  if(q+1>=current.questions.length){void finish(answers);return;}
  cancelVoice();setQ(n=>n+1);setSuccess(false);setSelected(null);
  setHint(false);setHeard(false);setFeedback('');setRoundWrong(0);
 }
 const allowedAisle=(i:number)=>i===0||(i===1?progress.completedByAisle.orchard===5:progress.completedByAisle.bakery===5);
 const stageEnabled=(n:number)=>n<=usedStage+1;
 return <div ref={dialog} role="dialog" aria-modal="true" aria-label="Lezzet Pazarı İngilizce macerası"
 className="fm-screen">
  <div className="fm-shell">
   <header className="fm-header">
    <button className="fm-back" onClick={()=>{cancelVoice();onBack();}}>← Kelime Bahçesi</button>
    <div className="fm-brand"><span>VENTRA · ENGLISH ADVENTURE</span><h1>🍓 Lezzet Pazarı</h1>
      <p>See it · Hear it · Say it · Find it!</p></div>
    <div className="fm-score">⭐ {Object.values(progress.starsByLevel).reduce((n,v)=>n+v,0)} / 45</div>
   </header>
   <section className="fm-map" aria-label="Pazar sokakları">
    {MARKET_AISLES.map((lane,i)=>{
     const unlocked=allowedAisle(i);
     return <button key={lane.id} disabled={!unlocked||busy} onClick={()=>changeStage(
      Math.min(5,progress.completedByAisle[lane.id]+1) as MarketStage,lane.id)}
      className={`fm-lane ${lane.id===aisle?'fm-lane-active':''}`}>
      <span className="fm-lane-icon">{unlocked?lane.icon:'🔒'}</span>
      <span className="fm-lane-copy"><strong>{lane.title}</strong><small>{unlocked?`${progress.completedByAisle[lane.id]}/5 görev`:'Önce önceki sokağı tamamla'}</small></span>
     </button>})}
   </section>
   <section className="fm-stagebar" aria-label="Dil görevleri">
    {MARKET_STAGES.map(item=><button key={item.stage} disabled={!stageEnabled(item.stage)||busy}
      className={`fm-stage-pill ${item.stage===stage?'fm-pill-active':''}`}
      onClick={()=>changeStage(item.stage as MarketStage)}>
      <span>{item.icon}</span><span>{item.stage}. {item.title}</span>
      {progress.starsByLevel[MARKET_OFFSETS[aisle]+item.stage]>0&&<span>⭐</span>}
    </button>)}
   </section>
   <section className="fm-play" aria-label={stageMeta.title}>
    <div className="fm-scenery">
      <MarketBackdrop aisle={aisle} stage={stage}/>
      <div className="fm-scene-label"><span>{currentAisle.icon}</span><div>
        <strong>{currentAisle.title}</strong><small>{currentAisle.subtitle}</small></div>
      </div>
      <div className="fm-banner"><span>{stageMeta.icon}</span> {stageMeta.title}</div>
    </div>
    <div className="fm-workshop">
     <div className="fm-step-head">
      <div><p className="fm-eyebrow">MISSION {MARKET_OFFSETS[aisle]+stage} / 15</p>
       <h2>{stageMeta.title}</h2><p>{stageMeta.description}</p></div>
      <button className="fm-sound" onClick={()=>{const next=!muted;setMuted(next);soundService.toggleMute();
       if(next)cancelVoice();}} aria-label={muted?'Sesi aç':'Sesi kapat'}>{muted?'🔇':'🔊'}</button>
     </div>
     <div className="fm-meter" role="progressbar" aria-label="Görev ilerlemesi" aria-valuemin={0}
       aria-valuemax={Math.max(1,numberOfQuestions)} aria-valuenow={completed}>
       <span style={{width:`${100*completed/Math.max(1,numberOfQuestions)}%`}}/></div>
     <p className="fm-count">{completed}/{numberOfQuestions} adım</p>
     {loadError?<div className="fm-error" role="alert">Öğrenme görevi açılamadı.
       <button onClick={()=>changeStage(stage)}>Tekrar Dene</button></div>:
     !current?<div className="fm-loading" role="status">Pazar sokağı hazırlanıyor…</div>:
     finished?<div className="fm-win">
       <div className="fm-win-icon">🏆</div><h2>Fantastic! Great shopping!</h2>
       <p>Bu sokakta İngilizce kelimeleri öğrendin ve görev ilerlemen kaydedildi.</p>
       <p className="fm-gained">⭐ {wrong===0?'⭐⭐⭐':wrong<=2?'⭐⭐':'⭐'} · {answers.length} kelime alıştırması</p>
       <button className="fm-cta" onClick={()=>{
         if(stage<5)changeStage((stage+1) as MarketStage);
         else if(aisle==='orchard')changeStage(1,'bakery');
         else if(aisle==='bakery')changeStage(1,'cafe');
         else onBack();
       }}>{stage<5?'Sonraki Dil Görevi →':aisle==='cafe'?'Bahçeye Dön':'Sonraki Sokağı Keşfet →'}</button>
       <button className="fm-secondary" onClick={()=>changeStage(stage)}>↻ Tekrar Oyna</button>
     </div>:
     <div className="fm-activity">
      {stage===1?<>
       <div className="fm-command"><span>👆</span><div><strong>Explore & listen</strong><small>Her ürüne dokun, İngilizce adını keşfet.</small></div></div>
       <div className="fm-products">
        {current.words.map(id=><Item key={id} id={id} showEnglish={visited.includes(id)}
          selected={visited.includes(id)} onClick={()=>discover(id)}/>)}
       </div>
       <p className="fm-instruction">Her ürünü keşfettikten sonra sonraki göreve geçebilirsin.</p>
       <button className="fm-cta" disabled={visited.length<current.words.length||busy}
         onClick={()=>void finish(answers)}>{busy?'Kaydediliyor…':'Tüm Ürünleri Keşfettim →'}</button>
      </>:task?<>
       <div className="fm-command">
        <span>{stage===2?'🔤':stage===3?'🎧':stage===4?'💬':'🛒'}</span>
        <div>
         {stage===2?<><strong>What is this in English?</strong><small>Görseldeki yiyeceğin İngilizce adını bul.</small></>:
         stage===3?<><strong>Listen and find it!</strong><small>Sesi dinle, doğru görsele dokun.</small></>:
         stage===4?<><strong>Customer says:</strong><strong className="fm-english">{task.prompt}</strong></>:
         <><strong>Shopping list · {Math.floor(q/2)+1}/3</strong><strong className="fm-english">
           Find the {current.questions[Math.floor(q/2)*2]?.target} and the {current.questions[Math.floor(q/2)*2+1]?.target}.
         </strong><small>İngilizce listedeki ürünleri sırayla sepete koy.</small></>}
        </div>
       </div>
       {stage===2&&<div className="fm-featured" aria-label="Hangi ürünün adı?">
         <span aria-hidden="true">{marketWord(task.target).icon}</span>
         <p>Choose the correct English word</p></div>}
       {stage===3&&<div className="fm-audio-panel">
         <button className="fm-audio-button" onClick={()=>speak(task.audio,true)}>
           {speaking?'🔉 Dinleniyor…':'▶ İngilizceyi Dinle'}</button>
         <button className="fm-text-hint" onClick={()=>{setHint(true);setFeedback('Yazılı destek etkin; bu yanıt bağımsız dinleme sayılmaz.')}}>Yazılı yardım</button>
         {hint&&<p>Yazılı destek: <strong>{task.target.toUpperCase()}</strong></p>}
       </div>}
       {stage!==3&&<div className="fm-hint-row">
         <button className="fm-text-hint" onClick={()=>{setHint(true);setFeedback('İpucu kullanıldı; yanıt destekli olarak kaydedilir.')}}>💡 İpucu</button>
         <button className="fm-text-hint" onClick={()=>speak(task.audio)}>🔊 İngilizceyi Duy</button>
         {hint&&<span>Türkçesi: {marketWord(task.target).tr}</span>}
       </div>}
       {stage===4?
         <div className="fm-dialogue-choices" aria-label="Doğru İngilizce cevabı seç">
           {task.options.map(id=><button key={id}
             className={`fm-dialogue-option ${selected===id?'fm-dialogue-correct':''}`}
             disabled={success||busy} onClick={()=>choose(id)}>
             <span aria-hidden="true">💬</span> You asked for {marketNounPhrase(id)}.
           </button>)}
         </div>:
         <div className={`fm-products fm-choices ${stage===5?'fm-supermarket-grid':''}`}>
           {(stage===5?current.words:task.options).map(id=><Item key={id} id={id} showEnglish={stage===2}
             active={success&&id===task.target} selected={selected===id}
             disabled={success||busy||(stage===3&&!heard&&!hint)}
             draggable={stage===5}
             onDragStart={event=>{event.dataTransfer.setData('text/plain',id);event.dataTransfer.effectAllowed='move';}}
             onClick={()=>choose(id)}/>)}
         </div>}
       {stage===5&&<div className="fm-basket-target" role="region"
         aria-label="Pazar sepeti. Bir ürünü sürükleyip buraya bırakabilir veya ürüne dokunabilirsin."
         onDragOver={event=>event.preventDefault()}
         onDrop={event=>{event.preventDefault();const id=event.dataTransfer.getData('text/plain');
           if(id&&current.words.includes(id))choose(id);}}>
           <span aria-hidden="true">🧺</span>
           <div><strong>Drop it in the basket!</strong>
             <small>Ürünü sepete sürükle veya kartına dokun.</small></div>
         </div>}
       {stage===3&&!heard&&!hint&&<p className="fm-instruction">Önce sesi dinle. Cihazda ses yoksa “Yazılı yardım” seçeneğiyle devam et.</p>}
       {stage===5&&<p className="fm-basket">🛒 Sepette: {answers.filter(x=>x.kind==='application').map(x=>marketWord(x.wordId).icon).join(' ')||'Henüz ürün yok'}</p>}
       {success&&<button className="fm-cta" onClick={advance} disabled={busy}>
         {q+1===current.questions.length?'Görevi Tamamla ✓':'Sonraki Ürün →'}
       </button>}
      </>:<div role="alert">Görev içeriği eksik. <button onClick={()=>changeStage(stage)}>Yenile</button></div>}
      {feedback&&<div role="status" className="fm-feedback">{feedback}</div>}
      {saveError&&<div role="alert" className="fm-error">{saveError}
       <button onClick={()=>void finish(answers)}>Kaydetmeyi Tekrar Dene</button></div>}
     </div>}
    </div>
   </section>
   <footer className="fm-footer">English first · No money calculations · Every word learned matters 🌷</footer>
  </div>
 </div>;
}
