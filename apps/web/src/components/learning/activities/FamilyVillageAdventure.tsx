'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
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
import {GardenHelp} from '../GardenHelp';

type Props={
 profileId:string;gradeLevel:number|null;englishLevel:EnglishPlacement;progress:FamilyVillageProgress;
 onBack:()=>void;
 onSave:(district:VillageDistrict,stage:VillageStage,mistakes:number,duration:number,
 answers:FamilyAnswerEvidence[],sessionId:string)=>Promise<void>;
};
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
 const [hint,setHint]=useState(false);
 const [heard,setHeard]=useState(false);
 const [speaking,setSpeaking]=useState(false);
 const [selected,setSelected]=useState<string|null>(null);
 const [wrongIds,setWrongIds]=useState<string[]>([]);
 const [answered,setAnswered]=useState(false);
 const [saved,setSaved]=useState(false);
 const [busy,setBusy]=useState(false);
 const [saveError,setSaveError]=useState('');
 const [notice,setNotice]=useState('');
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

 function speak(text:string,requireFullAudio=false){
   cancelSpeech();
   if(muted||!soundService.hasEnglishSpeech()){
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
   answerLock.current=false;visitedRef.current.clear();wrongRef.current.clear();
   currentSession.current=sessionId(profileId,nextDistrict,nextStage);
   started.current=Date.now();
   setDistrict(nextDistrict);setStage(nextStage);setRevision(x=>x+1);
   setVisited([]);setAnswers([]);setMistakes(0);setRoundMistakes(0);setQuestion(0);
   setHint(false);setHeard(false);setAnswered(false);setSelected(null);setWrongIds([]);setSaved(false);
   setBusy(false);setNotice('');setSaveError('');
 }
 function record(id:string,kind:FamilyAnswerEvidence['kind'],wrong:number,assisted:boolean):FamilyAnswerEvidence{
   return {wordId:id,kind,mistakes:wrong,firstTryCorrect:wrong===0&&!assisted,
     hintUsed:assisted,timestamp:new Date().toISOString()};
 }
 function discover(id:string){
   if(!current||stage!==1||busy||saved)return;
   // A previously explored card can be replayed for pronunciation without
   // recording a duplicate discovery event.
   speak(villageWord(id).id);setNotice(`${villageWord(id).id.toUpperCase()} — ${villageWord(id).tr}`);
   if(visitedRef.current.has(id))return;
   visitedRef.current.add(id);
   setVisited(v=>[...v,id]);setAnswers(v=>[...v,record(id,'discovery',0,false)]);
 }
 function choose(id:string){
   if(!task||!current||saved||busy||answered||locked.current||answerLock.current||wrongRef.current.has(id))return;
   if(stage===3&&!heard&&!hint)return;
   if(id!==task.target){
     wrongRef.current.add(id);setWrongIds([...wrongRef.current]);
     setMistakes(m=>m+1);setRoundMistakes(m=>m+1);
     soundService.playSfx('gentle_retry',0.65);
     setNotice('Bir daha dene! Kalan seçeneklere dikkatlice bak.');
     return;
   }
   answerLock.current=true;
   const kind=VILLAGE_STAGES[stage-1].kind;
   const next=[...answers,record(id,kind,roundMistakes,hint||(stage===3&&!heard))];
   setAnswers(next);setSelected(id);setAnswered(true);
   soundService.playSfx('correct',0.75);
   setNotice('Doğru! '+villageWord(id).id+' — '+villageWord(id).tr);
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
    setNotice('Görev başarıyla kaydedildi.');
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
   setHint(false);setHeard(false);setAnswered(false);setSelected(null);setNotice('');
 }
 useAutoQuestionAdvance({ready:answered,blocked:busy||saved||Boolean(saveError)||!current,
   onAdvance:advance,delayMs:1150,speaking});
 // Final discovery exposure automatically persists without a manual confirmation.
 // Persisted reward still requires the onSave promise to resolve.
 useAutoQuestionAdvance({
   ready:stage===1&&Boolean(current?.words.length)&&
     visited.length===current?.words.length&&answers.length===current?.words.length,
   blocked:busy||saved||Boolean(saveError)||!current,
   onAdvance:()=>{void complete(answers);},delayMs:950
 });
 const access=(index:number)=>index===0||(index===1?progress.completedByDistrict.family===5:
   index===2?progress.completedByDistrict.rooms===5:progress.completedByDistrict.objects===5);
 return <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Aile Köyü İngilizce öğrenme dünyası"
   className="fv-screen fv3-screen">
  <div className="fv-shell fv3-shell">
    <header className="fv-top fv3-top">
      <button onClick={()=>{cancelSpeech();onBack();}} className="fv-back fv3-back" aria-label="Kelime Bahçesi’ne dön">
       <span aria-hidden="true" className="fv3-back-arrow">‹</span><span className="fv3-back-label">Kelime Bahçesi</span>
      </button>
      <div className="fv-heading fv3-heading"><span>VENTRA • ENGLISH WORLD</span><h1>🏡 Aile Köyü</h1>
        <p className="sr-only">My Family · My Home · My Day</p></div>
      <div className="fv-stars fv3-stars">⭐ {Object.values(progress.starsByLevel).reduce((n,v)=>n+v,0)} / 60</div>
    </header>
    <nav className="fv-district-nav fv3-district-nav" aria-label="Aile Köyü mahalleleri">
      {VILLAGE_DISTRICTS.map((part,i)=><button key={part.id} type="button"
        aria-pressed={district===part.id} disabled={!access(i)||busy}
        className={`fv-district fv3-district ${district===part.id?'fv-district-current':''}`}
        onClick={()=>start(Math.min(5,progress.completedByDistrict[part.id]+1) as VillageStage,part.id)}>
        <span className="fv-district-icon">{part.icon}</span>
        <span><strong>{part.title}</strong><small>{access(i)?`${progress.completedByDistrict[part.id]}/5 bölüm`:'Önceki mahalleyi keşfet'}</small></span>
      </button>)}
    </nav>
    <nav className="fv-stepnav fv3-stepnav" aria-label="İngilizce görev adımları">
      {VILLAGE_STAGES.map(item=><button key={item.stage} type="button"
        disabled={item.stage>currentCompleted+1||busy}
        aria-pressed={item.stage===stage}
        onClick={()=>start(item.stage as VillageStage)}
        className={`fv-step fv3-step ${stage===item.stage?'fv-step-current':''}`}>
        <span className="fv3-step-icon" aria-hidden="true">{item.icon}</span><small className="fv3-step-title">{item.stage}. {item.title}</small><small className="fv3-step-index">{item.stage}/5</small>
        {progress.starsByLevel[VILLAGE_OFFSETS[district]+item.stage]>0&&<b>★</b>}
      </button>)}
    </nav>
    <main className="fv-card fv3-card">
      <div className="fv-scene fv3-scene">
        <FamilyVillageScenery district={district}/>
        <div className="fv-place fv3-place"><span>{lane.icon}</span><div>
         <strong>{lane.title}</strong><small>{lane.subtitle}</small></div></div>
        <span className="fv-mission-label fv3-mission-label">{stageMeta.icon} GÖREV {VILLAGE_OFFSETS[district]+stage} / 20</span>
      </div>
      <div className="fv-panel fv3-panel">
        <div className="fv-panel-head fv3-panel-head"><div>
          <p className="fv-eyebrow">LEARN & EXPLORE</p>
          <h2>{stageMeta.title}</h2><GardenHelp>{stageMeta.description}</GardenHelp>
        </div><button type="button" className="fv-audio-toggle fv3-audio-toggle" aria-label={muted?'Sesi aç':'Sesi kapat'}
          onClick={()=>{const next=!muted;setMuted(next);soundService.toggleMute();if(next)cancelSpeech();}}>
          {muted?'🔇':'🔊'}</button></div>
        <div className="fv-meter fv3-meter" role="progressbar" aria-label="Görev ilerlemesi"
         aria-valuenow={progressSteps} aria-valuemin={0} aria-valuemax={Math.max(1,total)}>
          <span style={{width:`${Math.round(100*progressSteps/Math.max(1,total))}%`}}/>
        </div>
        <p className="fv-count fv3-count">{progressSteps} / {total} adım</p>
        {loadError?<div role="alert" className="fv-error">Görev yüklenemedi.
          <button onClick={()=>start(stage)}>Tekrar Dene</button></div>:
        !current?<p className="fv-loading" role="status">Aile Köyü hazırlanıyor…</p>:
        saved?<div className="fv-celebrate fv3-celebrate">
          <div className="fv-medal">🏆</div><h2>Well done! Great English!</h2>
          <p>Görev ilerlemen kaydedildi. Yeniden oynayarak öğrendiklerini pekiştirebilirsin.</p>
          <p className="fv-result" aria-label={`${villageMissionStars(mistakes,answers)} yıldız kazanıldı`}>
            {'⭐'.repeat(villageMissionStars(mistakes,answers))}
          </p>
          <button className="fv-primary" onClick={()=>{
           if(stage<5)start((stage+1) as VillageStage);
           else if(district==='family')start(1,'rooms');
           else if(district==='rooms')start(1,'objects');
           else if(district==='objects')start(1,'routines');
           else onBack();
          }}>{stage<5?'Sonraki İngilizce Görevi →':district==='routines'?'Haritaya Dön':'Sonraki Mahalle →'}</button>
          <button className="fv-secondary" onClick={()=>start(stage)}>↻ Tekrar Oyna</button>
        </div>:<div className="fv-activity fv3-activity">
          {stage===1?<><div className="fv-prompt fv3-prompt">
            <span>👆</span><div><strong>Explore and listen!</strong>
            <small>Her kutuya dokun, İngilizce kelimeyi öğren.</small></div>
          </div><div className="fv-grid fv-grid-discover fv3-grid-discover">
           {current.words.map(id=><button key={id} type="button"
             disabled={busy||visited.length===current.words.length}
             onClick={()=>discover(id)} aria-pressed={visited.includes(id)}
             className={`fv-discovery fv3-discovery ${visited.includes(id)?'fv-visited':''}`}>
             <span aria-hidden="true"><FamilyWordArt id={id}/></span>
             {visited.includes(id)?<><strong>{id}</strong><small>{villageWord(id).tr}</small></>:<strong>Keşfet ✨</strong>}
             {visited.includes(id)&&<b aria-label="Keşfedildi">✓</b>}
           </button>)}
          </div><p role="status" aria-live="polite" className="fv3-discovery-status">
              {busy?'Keşif kaydediliyor…':visited.length===current.words.length?
               'Tüm kelimeler keşfedildi! Bölüm otomatik kaydediliyor…':
               'Çizimlere dokun, İngilizcesini dinle. Son karttan sonra bölüm tamamlanır.'}
             </p></>:
          task?<><div className="fv-prompt fv3-prompt">
            <span>{stage===2?'🔠':stage===3?'🎧':stage===4?'🏠':'💬'}</span>
            <div>{stage===2?<><strong>What's this in English?</strong><small>Görseli incele, doğru İngilizce kelimeyi seç.</small></>:
             stage===3?<><strong>Listen and find it!</strong><small>İngilizce sesi dinle, görseli bul.</small></>:
             stage===4?<><strong className="fv-english">{task.prompt}</strong><small>İngilizce yönergeye uyan görseli seç.</small></>:
             <><strong>Say it in English!</strong><small>Görsele uygun İngilizce cümleyi seç.</small></>}
            </div></div>
            {(stage===2||stage===5)&&<div className="fv3-featured" role="img"
             aria-label={`Bu kavramı İngilizce ifade et: ${villageWord(task.target).tr}`}>
             <FamilyWordArt id={task.target}/>
             {district==='family'&&<span className="fv3-featured-label">{villageWord(task.target).tr}</span>}
            </div>
            {stage===3&&<div className="fv-audio-task fv3-audio-task">
              <button type="button" onClick={()=>speak(task.audio,true)} disabled={busy||answered}
                className="fv-listen">{speaking?'🔉 Dinleniyor…':'▶ İngilizceyi Dinle'}</button>
              <button type="button" disabled={busy||answered}
                onClick={()=>{setHint(true);setNotice('Yazılı destek kullanıldı; bağımsız dinleme sayılmayacak.');}}
                className="fv-hint-button">Yazılı destek</button>
              {hint&&<p>English: <strong>{task.target}</strong></p>}
            </div>}
            {stage!==3&&<div className="fv-actions fv3-actions">
              <button type="button" className="fv-hint-button" disabled={busy||answered} onClick={()=>{
               setHint(true);setNotice('İpucu kullanıldı; yanıt destekli olarak kaydedilecek.');
              }}>💡 İpucu</button>
              <button type="button" className="fv-hint-button" disabled={busy||answered} onClick={()=>{
               setHint(true);speak(task.audio);
               setNotice('Sesli destek kullanıldı; yanıt destekli olarak kaydedilecek.');
              }}>🔊 İngilizceyi Duy</button>
              {hint&&<span className="fv3-hint-reveal">İpucu: {
                stage===2?`İlk harf: ${task.target[0].toUpperCase()}`:
                stage===4?villageWord(task.target).tr:
                `Türkçesi: ${villageWord(task.target).tr}`
              }</span>}
            </div>
            <div className={`fv-grid fv3-answer-grid ${stage===4?'fv-grid-scene':stage===5?'fv-grid-dialogue':''}`}
              role="group" aria-label={stage===4?'Yönergeye uygun görseli seç':stage===5?'İngilizce cümle seçenekleri':'Kelime seçenekleri'}>
              {task.options.map(id=><WordChoice key={id} id={id}
                mode={stage===2?'english':stage===3?(district==='family'?'translation':'icon'):stage===4?'icon':'phrase'}
                disabled={busy||answered||wrongIds.includes(id)||(stage===3&&!heard&&!hint)}
                wrong={wrongIds.includes(id)}
                active={selected===id} onPick={()=>choose(id)}/>)}
            </div>
            {stage===3&&!heard&&!hint&&<p className="fv-instruction">
              Sesi dinle veya destek aç. Ses oynatılmadan bağımsız dinleme başarısı kaydedilmez.</p>}
            {answered&&!saveError&&<p role="status" aria-live="polite" className="fv-notice">
              ✨ {question+1===current.questions.length?'Bölüm sonucu kaydediliyor…':'Sıradaki İngilizce soruya geçiliyor…'}
            </p>}
          </>:<p role="alert">Görev içeriği bulunamadı. <button onClick={()=>start(stage)}>Yeniden Aç</button></p>}
          {notice&&<p role="status" className="fv-notice">{notice}</p>}
          {saveError&&<div role="alert" className="fv-error">{saveError}
            <button onClick={()=>void complete(answers)}>Kaydetmeyi Tekrar Dene</button></div>}
        </div>}
      </div>
    </main>
    <footer className="fv-footer fv3-footer">Aile Köyü · İngilizce öğrenme dünyası · Her kelime yeni bir macera 🌻</footer>
  </div>
 </div>;
}
