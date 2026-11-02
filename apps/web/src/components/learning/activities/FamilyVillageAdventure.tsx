'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import type {FamilyAnswerEvidence} from '@ventra/shared';
import {getProgressRepository} from '@/lib/progress';
import type {EnglishPlacement} from '@/lib/learning/gradeAwareLearningPolicy';
import {soundService} from '@/lib/audio/SoundService';
import {VILLAGE_DISTRICTS,VILLAGE_STAGES,VILLAGE_OFFSETS,
 villageWord,villageResumePoint,planVillageMission,type VillageDistrict,type VillageStage,type VillagePlan
} from '@/lib/learning/familyVillageEngine';
import type {FamilyVillageProgress} from '@/lib/progress/familyVillageProgress';
import {FamilyVillageScenery} from './FamilyVillageScenery';
import {FamilyWordArt} from './FamilyVillageWordArt';
import './family-village.css';

type Props={
 profileId:string;gradeLevel:number|null;englishLevel:EnglishPlacement;progress:FamilyVillageProgress;
 onBack:()=>void;
 onSave:(district:VillageDistrict,stage:VillageStage,mistakes:number,duration:number,
 answers:FamilyAnswerEvidence[],sessionId:string)=>Promise<void>;
};
const sessionId=(profile:string,d:VillageDistrict,s:VillageStage)=>
 `family:${profile}:${d}:${s}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
type WordChoiceProps={id:string;mode:'icon'|'english'|'translation'|'phrase';active?:boolean;disabled?:boolean;onPick:()=>void};
function WordChoice({id,mode,active=false,disabled=false,onPick}:WordChoiceProps){
 const w=villageWord(id);
 return <button type="button" onClick={onPick} disabled={disabled} aria-pressed={active}
   className={`fv-choice fv-choice-${mode} ${active?'fv-choice-correct':''}`}
   aria-label={mode==='english'?w.id:mode==='phrase'?w.phrase:`${w.tr}`}>
   {mode!=='english'&&mode!=='phrase'&&<span className="fv-choice-art" aria-hidden="true"><FamilyWordArt id={id}/></span>}
   <span className="fv-choice-label">{mode==='english'?w.id:mode==='phrase'?w.phrase:mode==='translation'?w.tr:w.tr}</span>
   {active&&<span aria-hidden="true" className="fv-check">✓</span>}
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
 const [hint,setHint]=useState(false);
 const [heard,setHeard]=useState(false);
 const [speaking,setSpeaking]=useState(false);
 const [selected,setSelected]=useState<string|null>(null);
 const [answered,setAnswered]=useState(false);
 const [saved,setSaved]=useState(false);
 const [busy,setBusy]=useState(false);
 const [saveError,setSaveError]=useState('');
 const [notice,setNotice]=useState('');
 const [muted,setMuted]=useState(()=>soundService.getMuted());
 const currentSession=useRef(sessionId(profileId,district,stage));
 const started=useRef(Date.now()),locked=useRef(false),speechRun=useRef(0);
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
   if(typeof window!=='undefined'&&'speechSynthesis' in window)soundService.cancelSpeech();
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
 useEffect(()=>()=>{speechRun.current++;if(typeof window!=='undefined'&&'speechSynthesis' in window)soundService.cancelSpeech()},[]);
 useEffect(()=>{
  dialogRef.current?.scrollTo({top:0,behavior:'instant'});
  setHeard(false);setSpeaking(false);
 },[district,stage,question,revision]);

 function speak(text:string,requireFullAudio=false){
   cancelSpeech();
   if(muted||typeof window==='undefined'||!('speechSynthesis' in window)||
      typeof SpeechSynthesisUtterance==='undefined'){
     if(requireFullAudio){setHint(true);setNotice('Ses kullanılamıyor; yazılı ipucuyla devam edebilirsin.');}
     return;
   }
   const run=speechRun.current;
   const started=soundService.speakEnglish(text,{
     rate:0.8,
     onStart:()=>{if(run===speechRun.current)setSpeaking(true);},
     onEnd:()=>{if(run===speechRun.current){setSpeaking(false);if(requireFullAudio)setHeard(true);}},
     onError:()=>{if(run===speechRun.current){setSpeaking(false);if(requireFullAudio){
       setHeard(false);setHint(true);setNotice('Ses tamamlanamadı. Yazılı destek açıldı.');
     }}}
   });
   if(!started&&requireFullAudio){setHint(true);setNotice('Ses açılamadı. Yazılı destek etkin.');}

 }
 function start(nextStage:VillageStage,nextDistrict:VillageDistrict=district){
   if(busy)return;cancelSpeech();locked.current=false;
   currentSession.current=sessionId(profileId,nextDistrict,nextStage);
   started.current=Date.now();
   setDistrict(nextDistrict);setStage(nextStage);setRevision(x=>x+1);
   setVisited([]);setAnswers([]);setMistakes(0);setRoundMistakes(0);setQuestion(0);
   setHint(false);setHeard(false);setAnswered(false);setSelected(null);setSaved(false);
   setBusy(false);setNotice('');setSaveError('');
 }
 function record(id:string,kind:FamilyAnswerEvidence['kind'],wrong:number,assisted:boolean):FamilyAnswerEvidence{
   return {wordId:id,kind,mistakes:wrong,firstTryCorrect:wrong===0&&!assisted,
     hintUsed:assisted,timestamp:new Date().toISOString()};
 }
 function discover(id:string){
   if(!current||stage!==1||busy||saved||visited.includes(id))return;
   setVisited(v=>[...v,id]);setAnswers(v=>[...v,record(id,'discovery',0,false)]);
   speak(villageWord(id).id);setNotice(`${villageWord(id).id.toUpperCase()} — ${villageWord(id).tr}`);
 }
 function choose(id:string){
   if(!task||!current||saved||busy||answered||locked.current)return;
   if(stage===3&&!heard&&!hint)return;
   if(id!==task.target){
     setMistakes(m=>m+1);setRoundMistakes(m=>m+1);
     setNotice('Bir daha dene! İstersen İngilizce sesi veya ipucunu kullan.');
     return;
   }
   const kind=VILLAGE_STAGES[stage-1].kind;
   const next=[...answers,record(id,kind,roundMistakes,hint||(stage===3&&!heard))];
   setAnswers(next);setSelected(id);setAnswered(true);
   setNotice('Doğru! '+villageWord(id).id+' — '+villageWord(id).tr);
   if(stage!==3)speak(stage===5?villageWord(id).phrase:id);
 }
 async function complete(proof:FamilyAnswerEvidence[]){
   if(locked.current||proof.length<4)return;
   locked.current=true;setBusy(true);setSaveError('');
   try{
    await onSave(district,stage,mistakes,(Date.now()-started.current)/1000,proof,currentSession.current);
    setSaved(true);setNotice('Görev başarıyla kaydedildi.');
   }catch(err){
    console.error('Aile Köyü kaydı başarısız',err);
    setSaveError('Görevin kaydı tamamlanamadı. İlerlemen silinmedi; tekrar deneyebilirsin.');
    locked.current=false;
   }finally{setBusy(false);}
 }
 function advance(){
   if(!answered||busy||!current)return;
   if(question+1>=current.questions.length){void complete(answers);return;}
   cancelSpeech();setQuestion(x=>x+1);setRoundMistakes(0);
   setHint(false);setHeard(false);setAnswered(false);setSelected(null);setNotice('');
 }
 const access=(index:number)=>index===0||(index===1?progress.completedByDistrict.family===5:
   index===2?progress.completedByDistrict.rooms===5:progress.completedByDistrict.objects===5);
 return <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Aile Köyü İngilizce öğrenme dünyası"
   className="fv-screen">
  <div className="fv-shell">
    <header className="fv-top">
      <button onClick={()=>{cancelSpeech();onBack();}} className="fv-back">← Kelime Bahçesi</button>
      <div className="fv-heading"><span>VENTRA • ENGLISH WORLD</span><h1>🏡 Aile Köyü</h1>
        <p>My Family · My Home · My Day</p></div>
      <div className="fv-stars">⭐ {Object.values(progress.starsByLevel).reduce((n,v)=>n+v,0)} / 60</div>
    </header>
    <nav className="fv-district-nav" aria-label="Aile Köyü mahalleleri">
      {VILLAGE_DISTRICTS.map((part,i)=><button key={part.id} type="button"
        aria-pressed={district===part.id} disabled={!access(i)||busy}
        className={`fv-district ${district===part.id?'fv-district-current':''}`}
        onClick={()=>start(Math.min(5,progress.completedByDistrict[part.id]+1) as VillageStage,part.id)}>
        <span className="fv-district-icon">{access(i)?part.icon:'🔒'}</span>
        <span><strong>{part.title}</strong><small>{access(i)?`${progress.completedByDistrict[part.id]}/5 bölüm`:'Önceki mahalleyi keşfet'}</small></span>
      </button>)}
    </nav>
    <nav className="fv-stepnav" aria-label="İngilizce görev adımları">
      {VILLAGE_STAGES.map(item=><button key={item.stage} type="button"
        disabled={item.stage>currentCompleted+1||busy}
        aria-pressed={item.stage===stage}
        onClick={()=>start(item.stage as VillageStage)}
        className={`fv-step ${stage===item.stage?'fv-step-current':''}`}>
        <span>{item.icon}</span><small>{item.stage}. {item.title}</small>
        {progress.starsByLevel[VILLAGE_OFFSETS[district]+item.stage]>0&&<b>★</b>}
      </button>)}
    </nav>
    <main className="fv-card">
      <div className="fv-scene">
        <FamilyVillageScenery district={district}/>
        <div className="fv-place"><span>{lane.icon}</span><div>
         <strong>{lane.title}</strong><small>{lane.subtitle}</small></div></div>
        <span className="fv-mission-label">{stageMeta.icon} GÖREV {VILLAGE_OFFSETS[district]+stage} / 20</span>
      </div>
      <div className="fv-panel">
        <div className="fv-panel-head"><div>
          <p className="fv-eyebrow">LEARN & EXPLORE</p>
          <h2>{stageMeta.title}</h2><p>{stageMeta.description}</p>
        </div><button type="button" className="fv-audio-toggle" aria-label={muted?'Sesi aç':'Sesi kapat'}
          onClick={()=>{const next=!muted;setMuted(next);soundService.toggleMute();if(next)cancelSpeech();}}>
          {muted?'🔇':'🔊'}</button></div>
        <div className="fv-meter" role="progressbar" aria-label="Görev ilerlemesi"
         aria-valuenow={progressSteps} aria-valuemin={0} aria-valuemax={Math.max(1,total)}>
          <span style={{width:`${Math.round(100*progressSteps/Math.max(1,total))}%`}}/>
        </div>
        <p className="fv-count">{progressSteps} / {total} adım</p>
        {loadError?<div role="alert" className="fv-error">Görev yüklenemedi.
          <button onClick={()=>start(stage)}>Tekrar Dene</button></div>:
        !current?<p className="fv-loading" role="status">Aile Köyü hazırlanıyor…</p>:
        saved?<div className="fv-celebrate">
          <div className="fv-medal">🏆</div><h2>Well done! Great English!</h2>
          <p>Yeni İngilizce kelimeler ve cümleler öğrendin. Görev ilerlemen kaydedildi.</p>
          <p className="fv-result">⭐ {mistakes===0?'⭐⭐⭐':mistakes<=2?'⭐⭐':'⭐'}</p>
          <button className="fv-primary" onClick={()=>{
           if(stage<5)start((stage+1) as VillageStage);
           else if(district==='family')start(1,'rooms');
           else if(district==='rooms')start(1,'objects');
           else if(district==='objects')start(1,'routines');
           else onBack();
          }}>{stage<5?'Sonraki İngilizce Görevi →':district==='routines'?'Haritaya Dön':'Sonraki Mahalle →'}</button>
          <button className="fv-secondary" onClick={()=>start(stage)}>↻ Tekrar Oyna</button>
        </div>:<div className="fv-activity">
          {stage===1?<><div className="fv-prompt">
            <span>👆</span><div><strong>Explore and listen!</strong>
            <small>Her kutuya dokun, İngilizce kelimeyi öğren.</small></div>
          </div><div className="fv-grid fv-grid-discover">
           {current.words.map(id=><button key={id} type="button"
             onClick={()=>discover(id)} aria-pressed={visited.includes(id)}
             className={`fv-discovery ${visited.includes(id)?'fv-visited':''}`}>
             <span aria-hidden="true"><FamilyWordArt id={id}/></span>
             {visited.includes(id)?<><strong>{id}</strong><small>{villageWord(id).tr}</small></>:<strong>Keşfet ✨</strong>}
             {visited.includes(id)&&<b aria-label="Keşfedildi">✓</b>}
           </button>)}
          </div><button className="fv-primary" disabled={visited.length!==current.words.length||busy}
            onClick={()=>void complete(answers)}>Hepsini Keşfettim →</button></>:
          task?<><div className="fv-prompt">
            <span>{stage===2?'🔠':stage===3?'🎧':stage===4?'🏠':'💬'}</span>
            <div>{stage===2?<><strong>What's this in English?</strong><small>Türkçesi: {task.prompt}</small></>:
             stage===3?<><strong>Listen and find it!</strong><small>Ses tamamlanınca seçimini yap.</small></>:
             stage===4?<><strong className="fv-english">{task.prompt}</strong><small>Evde doğru kişi, yer veya eşyayı bul.</small></>:
             <><strong>Say it in English!</strong><small>Bu ifadeyi İngilizce nasıl söylersin? <b>{task.prompt}</b></small></>}
            </div></div>
            {stage===3&&<div className="fv-audio-task">
              <button type="button" onClick={()=>speak(task.audio,true)}
                className="fv-listen">{speaking?'🔉 Dinleniyor…':'▶ İngilizceyi Dinle'}</button>
              <button type="button" onClick={()=>{setHint(true);setNotice('Yazılı destek kullanıldı; bağımsız dinleme sayılmayacak.');}}
                className="fv-hint-button">Yazılı destek</button>
              {hint&&<p>English: <strong>{task.target}</strong></p>}
            </div>}
            {stage!==3&&<div className="fv-actions">
              <button type="button" className="fv-hint-button" onClick={()=>{
               setHint(true);setNotice('İpucu kullanıldı; cevap destekli olarak kaydedilecek.');
              }}>💡 İpucu</button>
              <button type="button" className="fv-hint-button" onClick={()=>speak(task.audio)}>🔊 İngilizceyi Duy</button>
              {hint&&<span>İpucu: {stage===5?villageWord(task.target).phrase:villageWord(task.target).tr}</span>}
            </div>}
            <div className={`fv-grid ${stage===4?'fv-grid-scene':stage===5?'fv-grid-dialogue':''}`}
              role="group" aria-label={stage===4?'Evin içindeki nesneler':stage===5?'İngilizce cevap seçenekleri':'Kelime seçenekleri'}>
              {(stage===4?current.words:task.options).map(id=><WordChoice key={id} id={id}
                mode={stage===2?'english':stage===3?'translation':stage===4?'icon':'phrase'}
                disabled={busy||answered||(stage===3&&!heard&&!hint)}
                active={selected===id} onPick={()=>choose(id)}/>)}
            </div>
            {stage===3&&!heard&&!hint&&<p className="fv-instruction">
              Sesi dinle veya destek aç. Ses oynatılmadan bağımsız dinleme başarısı kaydedilmez.</p>}
            {answered&&<button className="fv-primary" onClick={advance} disabled={busy}>
              {question+1===current.questions.length?'Görevi Tamamla ✓':'Sonraki Soru →'}
            </button>}
          </>:<p role="alert">Görev içeriği bulunamadı. <button onClick={()=>start(stage)}>Yeniden Aç</button></p>}
          {notice&&<p role="status" className="fv-notice">{notice}</p>}
          {saveError&&<div role="alert" className="fv-error">{saveError}
            <button onClick={()=>void complete(answers)}>Kaydetmeyi Tekrar Dene</button></div>}
        </div>}
      </div>
    </main>
    <footer className="fv-footer">Aile Köyü · İngilizce öğrenme dünyası · Her kelime yeni bir macera 🌻</footer>
  </div>
 </div>;
}
