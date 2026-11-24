'use client';

import {useEffect,useMemo,useRef,useState} from 'react';
import {useDialogFocus} from '@/lib/a11y/useDialogFocus';
import {encodeQr,qrPath} from '@/lib/school/qrCode';
import {formatDay} from '@/lib/school/schoolInsights';

/** Dark modules on white with the 4-module quiet zone the standard asks for. */
export function InviteQr({value,label,className=''}:{value:string;label:string;className?:string}){
 const matrix=useMemo(()=>encodeQr(value),[value]);
 if(!matrix)return null;
 const size=matrix.length+8;
 return <svg viewBox={`-4 -4 ${size} ${size}`} role="img" aria-label={label} shapeRendering="crispEdges"
  className={`block bg-white ${className}`} xmlns="http://www.w3.org/2000/svg">
  <rect x={-4} y={-4} width={size} height={size} fill="#ffffff"/>
  <path d={qrPath(matrix)} fill="#0b1530"/>
 </svg>;
}

type Props={schoolName:string;className:string;brand:string;code:string;link:string|null;validUntil:string|null;onClose:()=>void};

/**
 * "Ekranda göster": a large, high-contrast invite for a projector or a parent
 * meeting. Parents scan the code with a phone camera or type the code.
 */
export function InviteShowcase({schoolName,className,brand,code,link,validUntil,onClose}:Props){
 const ref=useRef<HTMLDivElement>(null);
 useDialogFocus(ref,true);
 const [full,setFull]=useState(false);
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();onClose();}};
  const onFull=()=>setFull(Boolean(document.fullscreenElement));
  document.addEventListener('keydown',onKey);
  document.addEventListener('fullscreenchange',onFull);
  const overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  return()=>{
   document.removeEventListener('keydown',onKey);
   document.removeEventListener('fullscreenchange',onFull);
   document.body.style.overflow=overflow;
   if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});
  };
 },[onClose]);
 const canFull=typeof document!=='undefined'&&Boolean(document.fullscreenEnabled);
 const toggleFull=()=>{
  if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});
  else void ref.current?.requestFullscreen?.().catch(()=>{});
 };
 const parts=code.toUpperCase().split('-');
 return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#020617]/90 p-3 backdrop-blur-sm sm:p-6"
  style={{paddingTop:'max(12px,env(safe-area-inset-top))',paddingBottom:'max(12px,env(safe-area-inset-bottom))'}}>
  <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="invite-show-title" aria-describedby="invite-show-help"
   className="relative flex max-h-full w-full max-w-3xl flex-col overflow-y-auto rounded-[2rem] bg-white text-slate-950 shadow-2xl outline-none">
   <div aria-hidden="true" className="h-3 shrink-0 rounded-t-[2rem]" style={{background:brand}}/>
   <div className="flex items-start justify-between gap-3 px-5 pt-4 sm:px-8 sm:pt-6">
    <div className="min-w-0">
     <p className="text-xs font-black uppercase tracking-[.18em] text-slate-500">Ventra · Sınıf daveti</p>
     <h2 id="invite-show-title" className="mt-1 break-words text-2xl font-black leading-tight sm:text-4xl">{schoolName} · {className}</h2>
    </div>
    <div className="flex shrink-0 gap-2">
     {canFull&&<button type="button" onClick={toggleFull}
      className="hidden min-h-12 items-center rounded-xl border border-slate-300 px-4 text-sm font-black text-slate-800 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900 sm:inline-flex">
      {full?'Tam ekrandan çık':'⛶ Tam ekran'}</button>}
     <button type="button" onClick={onClose} autoFocus
      className="inline-flex min-h-12 items-center rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900">Kapat</button>
    </div>
   </div>
   <div className="grid items-center gap-5 px-5 pb-6 pt-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-8 sm:px-8 sm:pb-8">
    {link&&<div className={`mx-auto w-full ${full?'max-w-[min(72vh,640px)]':'max-w-[min(64vh,360px)]'}`}>
     <InviteQr value={link} label={`${className} sınıfının davet bağlantısı için QR kodu`} className="aspect-square w-full rounded-2xl border border-slate-200"/>
    </div>}
    <div className={link?'':'sm:col-span-2'}>
     <p id="invite-show-help" className="text-base font-bold leading-relaxed text-slate-700 sm:text-lg">
      {link?<>📱 Telefonunuzun kamerasıyla okutun, açılan sayfada veli hesabınızla giriş yapın ve çocuğunuzu onaylayın.</>:
       <>Ventra'da <strong>Okul Paneli → Veliyim</strong> bölümüne bu kodu yazın.</>}
     </p>
     {link&&<p className="mt-4 text-sm font-bold text-slate-500">ya da Okul Paneli → Veliyim bölümüne bu kodu yazın:</p>}
     <p className="sr-only">Davet kodu: {code}</p>
     <div aria-hidden="true" className="mt-2 flex flex-wrap gap-1.5 font-mono text-lg font-black tracking-wider sm:text-2xl">
      {parts.map((part,i)=><span key={i} className="rounded-lg bg-slate-100 px-2 py-1 text-slate-900">{part}</span>)}
     </div>
     {validUntil&&<p className="mt-4 text-sm font-bold text-slate-600">Son geçerlilik: {formatDay(validUntil)}</p>}
     <p className="mt-3 text-xs leading-relaxed text-slate-500">Öğretmen yalnızca takma adı, sınıf düzeyini ve İngilizce görev özetini görür. Gerçek ad, ses ve yazılan metinler paylaşılmaz.</p>
    </div>
   </div>
  </div>
 </div>;
}
