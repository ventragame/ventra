'use client';
import React,{useEffect,useRef,useState} from 'react';
import {FIRST_PLAY_LESSONS,tutorialSeenKey,type TutorialWorld} from '@/lib/learning/firstPlayTutorial';
import {soundService} from '@/lib/audio/SoundService';

// A storage fallback protects children when a browser blocks localStorage.
const sessionSeen=new Set<string>();
interface FirstPlayGuideProps {
  world:TutorialWorld;
  profileId:string;
  ready:boolean;
  hasPlayed:boolean;
}
export function FirstPlayGuide({world,profileId,ready,hasPlayed}:FirstPlayGuideProps){
  const lesson=FIRST_PLAY_LESSONS[world];
  const [checked,setChecked]=useState(false);
  const [open,setOpen]=useState(false);
  const [step,setStep]=useState(0);
  const [feedback,setFeedback]=useState('');
  const firstButton=useRef<HTMLButtonElement>(null);
  const modal=useRef<HTMLElement>(null);
  const key=tutorialSeenKey(profileId,world);

  useEffect(()=>{
    if(!ready)return;
    let seen=sessionSeen.has(key);
    try{seen=seen||window.localStorage.getItem(key)==='done';}catch{}
    setChecked(true);
    setOpen(!hasPlayed&&!seen);
  },[key,ready,hasPlayed]);

  useEffect(()=>{
    if(open)firstButton.current?.focus();
  },[open]);

  const remember=()=>{
    sessionSeen.add(key);
    try{window.localStorage.setItem(key,'done');}catch{}
    setOpen(false);setStep(0);setFeedback('');
  };
  const reopen=()=>{setStep(0);setFeedback('');setOpen(true);};
  const choose=(choiceId:string)=>{
    if(step>=lesson.steps.length)return;
    const current=lesson.steps[step];
    if(current.choiceId!==choiceId){
      soundService.playSfx('gentle_retry',0.4);
      setFeedback('Bir daha dene. Parlayan seçeneğe dokun.');
      return;
    }
    soundService.playSfx('correct',0.6);
    setFeedback(current.done);
    setStep(step+1);
  };
  const available=lesson.choices.filter(choice=>
    world!=='food'||step===1?world!=='food'||step!==1||choice.id==='basket':choice.id!=='basket');
  const result=step>=lesson.steps.length;
  return <>
    {checked&&!open&&<button type="button" onClick={reopen}
      aria-label={lesson.name+' nasıl oynanır? Öğretimi tekrar aç'}
      className="fixed right-3 top-[75px] z-[70] flex min-h-11 items-center gap-1.5 rounded-full border-2 border-amber-200 bg-slate-950/95 px-3 py-2 text-xs font-extrabold text-amber-100 shadow-xl shadow-slate-950/60 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300"
      title="Nasıl Oynanır?">
      <span aria-hidden="true">❔</span><span className="hidden sm:inline">Nasıl Oynanır?</span>
    </button>}
    {checked&&open&&<div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#061927]/90 p-3 backdrop-blur-md sm:p-6"
      onPointerDown={event=>event.stopPropagation()}>
      <section ref={modal} role="dialog" aria-modal="true" aria-labelledby="ventra-tutorial-title"
        aria-describedby="ventra-tutorial-help"
        onKeyDown={event=>{
          if(event.key==='Escape'){event.preventDefault();event.stopPropagation();remember();}
          if(event.key==='Tab'){
            const buttons=Array.from(modal.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]);
            if(!buttons.length)return;
            if(event.shiftKey&&document.activeElement===buttons[0]){event.preventDefault();buttons[buttons.length-1].focus();}
            else if(!event.shiftKey&&document.activeElement===buttons[buttons.length-1]){event.preventDefault();buttons[0].focus();}
          }
        }}
        className="relative my-auto w-full max-w-xl rounded-[28px] border-2 border-sky-200/50 bg-gradient-to-b from-[#225e82] via-[#153d63] to-[#112a49] p-4 text-white shadow-[0_28px_80px_#0009] sm:p-7">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold tracking-wide text-lime-200">İLK KEŞİF · UYGULAMALI ÖRNEK</p>
            <h2 id="ventra-tutorial-title" className="mt-1 text-2xl font-black leading-tight sm:text-3xl">
              <span aria-hidden="true">{lesson.hero} </span>{lesson.name}
            </h2>
          </div>
          <button ref={firstButton} type="button" onClick={remember}
            className="min-h-11 shrink-0 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-xs font-bold text-sky-50 hover:bg-white/20 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300">
            Atla ✕
          </button>
        </header>
        <p id="ventra-tutorial-help" className="mt-3 text-sm leading-relaxed text-sky-100 sm:text-base">{lesson.intro}</p>
        <div className="my-4 flex items-center justify-between gap-2">
          <span className="rounded-full bg-lime-300/20 px-3 py-1 text-xs font-bold text-lime-100">
            {result?'✓ Örnek tamamlandı':`Örnek ${step+1}/${lesson.steps.length}`}
          </span>
          <span className="text-xs font-semibold text-sky-100">Burada puan veya yıldız kazanılmaz</span>
        </div>
        <div className="rounded-[22px] border border-white/20 bg-[#0c2c45]/90 p-4 shadow-inner sm:p-5">
          {result?(
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
              <span aria-hidden="true" className="text-6xl">🌟</span>
              <h3 className="text-xl font-black">Artık hazırsın!</h3>
              <p className="max-w-sm text-sm leading-relaxed text-sky-100">{lesson.completion}</p>
            </div>
          ):<>
            <p className="text-center text-base font-extrabold text-white sm:text-lg">
              {lesson.steps[step].prompt}
            </p>
            {world==='sanctuary'&&<p className="mt-2 text-center text-sm font-bold text-lime-200">
              {lesson.steps.slice(0,step).map(s=>s.choiceId==='cat'?'cat.':s.choiceId==='i'?'I':s.choiceId).join(' ')||'Cümleyi oluştur'}
            </p>}
            {world==='food'&&step===1&&<p className="mt-2 text-center text-3xl" aria-label="Seçilen elma">🍎 → 🧺</p>}
            <div className={`mt-4 grid gap-3 ${available.length===4?'grid-cols-2 sm:grid-cols-4':'grid-cols-3'}`}>
              {available.map(choice=>{
                const used=world==='sanctuary'&&lesson.steps.slice(0,step).some(s=>s.choiceId===choice.id);
                const target=lesson.steps[step].choiceId===choice.id;
                return <button key={choice.id} type="button" disabled={used} onClick={()=>choose(choice.id)}
                  aria-label={choice.label+' seç'}
                  className={`flex min-h-[110px] flex-col items-center justify-center gap-2 rounded-2xl border-[3px] bg-[#f8f0dd] p-2 text-center text-slate-900 transition-transform active:scale-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300 disabled:opacity-40 ${target?'border-lime-300 shadow-[0_0_20px_#c6ff8c88] motion-safe:animate-pulse':'border-sky-100'}`}>
                  {choice.image?<img src={choice.image} alt="" className="h-14 w-16 object-contain" />:
                    choice.color?<span aria-hidden="true" className="h-14 w-14 rounded-full border-4 border-white shadow-md" style={{backgroundColor:choice.color}}/>:
                    <span aria-hidden="true" className="text-4xl leading-none">{choice.icon||choice.label}</span>}
                  <span className="text-sm font-black sm:text-base">{choice.label}</span>
                </button>;
              })}
            </div>
          </>}
          <p role="status" aria-live="polite" className="mt-3 min-h-6 text-center text-sm font-extrabold text-lime-200">{feedback}</p>
        </div>
        {result?<button type="button" onClick={remember}
          className="mt-5 min-h-14 w-full rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-5 py-3 text-lg font-black text-emerald-950 shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-white">
          Oyuna Başla <span aria-hidden="true">→</span>
        </button>:<p className="mt-4 text-center text-xs font-semibold text-sky-100">
          Parlayan seçeneğe dokunarak örnek hareketi kendin yap. Yardım gerekirse atlayabilirsin.
        </p>}
      </section>
    </div>}
  </>;
}
