'use client';

import React,{useEffect,useRef} from 'react';
import {Headphones,BookOpen,Mic,Blocks,PencilLine,Check,ArrowRight,CheckCircle2,Lightbulb} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import type {AcademyKind,AcademyTask} from '@/lib/learning/academyEngine';

/** These are presentation instructions, not task answers or evidence of mastery. */
export const ACADEMY_SKILL_UI:Readonly<Record<AcademyKind,{
 name:string;instruction:string;icon:LucideIcon;short:string
}>>={
 hear:{name:'Dinleme',short:'Dinle',icon:Headphones,
  instruction:'Önce İngilizce sesi dinle, sonra duyduğun cevabı seç.'},
 read:{name:'Okuma',short:'Oku',icon:BookOpen,
  instruction:'İngilizce cümleyi oku; ipucuna uygun cevabı seç.'},
 talk:{name:'Konuşma',short:'Konuş',icon:Mic,
  instruction:'İngilizce cevabı söylemeyi dene. Dokunarak da ilerleyebilirsin; bu konuşma başarısı sayılmaz.'},
 build:{name:'Cümle Kurma',short:'Kur',icon:Blocks,
  instruction:'Kelimeleri sırayla seç. Değiştirmek için oluşturduğun cümledeki kelimeye dokun.'},
 write:{name:'Yazma',short:'Yaz',icon:PencilLine,
  instruction:'Cevabını İngilizce yaz. Klavye yerine kelime kartlarını kullanmak yardımlı çalışmadır.'}
};

export function AcademySkillJourney({tasks,activeStep,review}:{
 tasks:readonly AcademyTask[];activeStep:number;review:boolean
}){
 const listRef=useRef<HTMLOListElement>(null);
 const total=Math.max(tasks.length,1);
 const current=Math.max(0,Math.min(activeStep,total-1));
 useEffect(()=>{
  const list=listRef.current;
  const active=list?.querySelector<HTMLElement>('[aria-current="step"]');
  if(!list||!active)return;
  // Center only the skill rail; never jump the whole scrollable game screen.
  const frame=window.requestAnimationFrame(()=>{
   const parent=list.getBoundingClientRect(),child=active.getBoundingClientRect();
   const delta=child.left-parent.left-(list.clientWidth-child.width)/2;
   if(Math.abs(delta)>8)list.scrollLeft+=delta;
  });
  return()=>window.cancelAnimationFrame(frame);
 },[activeStep,review,tasks.length]);
 return <section className="academy-skill-journey" aria-label="Beceri ve görev ilerlemesi">
  <div className="academy-journey-heading">
   <div><span className="academy-journey-eyebrow">{review?'HEDEFLİ TEKRAR':'BECERİ YOLCULUĞU'}</span>
    <strong>{review?'Üç küçük alıştırma':'Beş beceri, tek macera'}</strong></div>
   <span className="academy-journey-count">Görev {current+1} / {total}</span>
  </div>
  <div className="academy-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total}
   aria-valuenow={current} aria-valuetext={current+' görev tamamlandı, '+total+' görevden'}
   aria-label="Macera ilerlemesi">
   <span style={{width:(current/total*100)+'%'}}/>
  </div>
  <ol ref={listRef} className="academy-skill-rail" aria-label="Görev sırası">
   {tasks.map((task,i)=>{
    const info=ACADEMY_SKILL_UI[task.kind],Icon=info.icon;
    const state=i<current?'done':i===current?'current':'upcoming';
    const status=state==='done'?'Tamamlandı':state==='current'?'Şimdi':'Sırada';
    return <li key={task.id} className={'academy-skill-card academy-skill-card--'+state}
     data-state={state} aria-current={state==='current'?'step':undefined}>
     <span className="academy-skill-card-icon" aria-hidden="true">
      {state==='done'?<Check size={20} strokeWidth={3}/>:<Icon size={20} strokeWidth={2.25}/>}
     </span>
     <span className="academy-skill-card-copy"><strong>{info.name}</strong>
      <small>{review?'Tekrar '+(i+1):status}</small></span>
     <span className="academy-skill-card-index" aria-hidden="true">{i+1}</span>
    </li>;
   })}
  </ol>
 </section>;
}

export function AcademyTaskIdentity({kind,current,total}:{kind:AcademyKind;current:number;total:number}){
 const info=ACADEMY_SKILL_UI[kind],Icon=info.icon;
 return <div className="academy-task-identity">
  <span className="academy-task-identity-icon" aria-hidden="true"><Icon size={25} strokeWidth={2.25}/></span>
  <div className="academy-task-identity-copy">
   <span>{'BECERİ '+current+' / '+total}</span>
   <strong>{info.name}</strong>
   <p>{info.instruction}</p>
  </div>
 </div>;
}

export function AcademyTaskStatus({message,resolved,index,total,kind}:{
 message:string;resolved:boolean;index:number;total:number;kind:AcademyKind
}){
 const hasMessage=Boolean(message.trim());
 const title=resolved?'Görev tamamlandı':hasMessage?'Görev yardımı':'Hazırsın';
 const copy=resolved?
  (message+' '+(index+1>=total?'Sonuçların kaydediliyor…':'Sıradaki beceriye geçiliyor…')):
  (hasMessage?message:ACADEMY_SKILL_UI[kind].instruction);
 return <div className={'academy-task-status'+(resolved?' is-complete':hasMessage?' has-message':'')}
  role="status" aria-live="polite" aria-atomic="true">
  <span className="academy-task-status-icon" aria-hidden="true">
   {resolved?<CheckCircle2 size={22}/>:hasMessage?<Lightbulb size={21}/>:<ArrowRight size={21}/>}
  </span>
  <div><strong>{title}</strong><p>{copy}</p></div>
 </div>;
}
