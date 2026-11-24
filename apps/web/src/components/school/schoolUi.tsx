'use client';

import type {ReactNode} from 'react';
import {initialColor,initialOf,percent,type SkillProgress} from '@/lib/school/schoolInsights';

/** Shared look of the school panel (formal "siz" copy, 44 px+ touch targets). */
export const card='rounded-[2rem] border border-white/12 bg-white/[.05] p-5 sm:p-7';
export const field='mt-2 min-h-12 w-full rounded-xl border border-white/25 bg-[#0b1d35] px-4 text-base text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300';
export const primary='inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-300 to-emerald-300 px-5 font-black text-emerald-950 shadow-lg shadow-emerald-900/30 transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-200 disabled:cursor-not-allowed disabled:opacity-45';
export const secondary='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[.07] px-4 text-sm font-bold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300 disabled:cursor-not-allowed disabled:opacity-45';
export const dangerButton='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-black text-white transition hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-200 disabled:cursor-not-allowed disabled:opacity-45';
export const dangerOutline='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-300/50 px-4 text-sm font-black text-rose-100 transition hover:bg-rose-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-200 disabled:cursor-not-allowed disabled:opacity-45';
export const eyebrow='text-xs font-black uppercase tracking-[.16em]';

/** What an action reports back: a short toast, kept in the page. */
export type SchoolAct=(action:()=>Promise<unknown>,success?:string,fallback?:string)=>Promise<boolean>;
export type SchoolNotify=(tone:'ok'|'error',text:string)=>void;

/** A child's initial in a steady colour (teachers never see avatars). */
export function Initial({id,nickname,size='h-11 w-11 text-lg'}:{id:string;nickname:string;size?:string}){
 return <span aria-hidden="true" className={`flex ${size} shrink-0 items-center justify-center rounded-2xl font-black text-white shadow-inner`}
  style={{background:initialColor(id)}}>{initialOf(nickname)}</span>;
}

/** Five skill areas as small labelled bars, with the counts in text. */
export function SkillBars({skills,compact=false}:{skills:SkillProgress[];compact?:boolean}){
 return <ul className={compact?'grid gap-2 sm:grid-cols-2':'grid gap-3'}>
  {skills.map(s=>{
   const share=percent(s.done,s.total);
   return <li key={s.id} className="text-xs">
    <div className="flex items-center justify-between gap-2 font-bold text-sky-50">
     <span><span aria-hidden="true">{s.icon}</span> {s.label}</span>
     <span className="tabular-nums text-sky-100/85">{s.done}/{s.total} görev</span>
    </div>
    <span aria-hidden="true" className="mt-1 block h-2 overflow-hidden rounded-full bg-white/10">
     <span className="block h-full rounded-full bg-gradient-to-r from-sky-300 to-lime-300" style={{width:`${s.done>0?Math.max(4,share):0}%`}}/>
    </span>
   </li>;
  })}
 </ul>;
}

/** An in-page "are you sure?" that works in app WebViews and says what happens. */
export function ConfirmBox({label,children,confirm,onConfirm,onCancel,busy,tone='danger'}:{
 label:string;children:ReactNode;confirm:string;onConfirm:()=>void;onCancel:()=>void;busy:boolean;tone?:'danger'|'amber';
}){
 return <div role="group" aria-label={label}
  className={`mt-3 rounded-xl border p-3 ${tone==='danger'?'border-rose-300/35 bg-rose-950/40':'border-amber-200/40 bg-amber-950/30'}`}>
  <div className="text-sm leading-relaxed">{children}</div>
  <div className="mt-3 flex flex-wrap gap-2">
   <button type="button" disabled={busy} onClick={onConfirm}
    className={tone==='danger'?dangerButton:'inline-flex min-h-11 items-center rounded-xl bg-amber-200 px-4 text-sm font-black text-slate-950 disabled:opacity-45'}>{confirm}</button>
   <button type="button" autoFocus onClick={onCancel} className={secondary}>Vazgeç</button>
  </div>
 </div>;
}

/** A load failure with a way to try again (instead of an empty page). */
export function LoadProblem({text,onRetry}:{text:string;onRetry:()=>void}){
 return <div role="alert" className={`${card} mx-auto max-w-xl text-center`}>
  <div aria-hidden="true" className="text-4xl">⚠️</div>
  <p className="mt-3 text-sm leading-relaxed text-rose-50">{text}</p>
  <button type="button" onClick={onRetry} className={`${secondary} mt-4`}>↻ Yeniden dene</button>
 </div>;
}

/** Placeholder blocks while the cloud answers. */
export function LoadingBlocks({label}:{label:string}){
 return <div role="status" className="space-y-4" aria-live="polite">
  <span className="sr-only">{label}</span>
  {[0,1].map(i=><div key={i} aria-hidden="true" className="h-36 animate-pulse rounded-[2rem] border border-white/10 bg-white/[.05] motion-reduce:animate-none"/>)}
 </div>;
}

/** Copy text; falls back to a selection copy where the clipboard API is missing (app WebViews). */
export async function copyText(value:string):Promise<boolean>{
 try{
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return true;}
 }catch{/* fall back below */}
 try{
  const area=document.createElement('textarea');
  area.value=value;area.setAttribute('readonly','');
  area.style.position='fixed';area.style.opacity='0';area.style.pointerEvents='none';
  document.body.appendChild(area);area.select();
  const ok=document.execCommand('copy');
  area.remove();
  return ok;
 }catch{return false;}
}
