'use client';

import React from 'react';
import {GameStepRail} from '../game/GameFrame';
import {Headphones,BookOpen,Mic,Blocks,PencilLine,ArrowRight,CheckCircle2,Lightbulb} from 'lucide-react';
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

/** The academy's skill steps, drawn by the shared game step rail. */
export function AcademySkillJourney({tasks,activeStep,review}:{
 tasks:readonly AcademyTask[];activeStep:number;review:boolean
}){
 const total=Math.max(tasks.length,1);
 const current=Math.max(0,Math.min(activeStep,total-1));
 return <GameStepRail island="academy" className="academy-skill-rail" showNotes
  ariaLabel={review?'Hedefli tekrar görevleri':'Beceri yolculuğu: görev sırası'}
  steps={tasks.map((task,i)=>{
   const info=ACADEMY_SKILL_UI[task.kind],Icon=info.icon;
   const state=i<current?'done':i===current?'current':'upcoming';
   return {key:task.id,label:info.name,short:info.short,state,
    icon:<Icon size={18} strokeWidth={2.4}/>,note:review?'Tekrar '+(i+1):undefined};
  })}/>;
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
