'use client';

import {useEffect,useState,type FormEvent} from 'react';
import {sendAdultOtpEmail,verifyAdultOtp} from '@/lib/supabase/auth';
import {cleanOtpCode,friendlyAccountError,isEmailLike} from '@/lib/profile/profileHub';
import {card,field,primary,secondary} from './schoolUi';

const RESEND_SECONDS=30;

/** Password-free sign-in: an e-mail code, with a resend timer and a way back. */
export function SchoolSignIn({mode,inviteWaiting,onSignedIn}:{mode:'teacher'|'parent';inviteWaiting:boolean;onSignedIn:(email:string)=>void}){
 const [email,setEmail]=useState('');
 const [code,setCode]=useState('');
 const [sent,setSent]=useState(false);
 const [busy,setBusy]=useState(false);
 const [cooldown,setCooldown]=useState(0);
 const [message,setMessage]=useState<{tone:'ok'|'error';text:string}|null>(null);
 useEffect(()=>{
  if(cooldown<=0)return;
  const timer=window.setTimeout(()=>setCooldown(seconds=>seconds-1),1000);
  return()=>window.clearTimeout(timer);
 },[cooldown]);

 const send=async(event?:FormEvent)=>{
  event?.preventDefault();
  if(busy)return;
  const clean=email.trim().toLowerCase();
  if(!isEmailLike(clean)){setMessage({tone:'error',text:'E-posta adresinizi kontrol edin.'});return;}
  setBusy(true);setMessage(null);
  try{
   const res=await sendAdultOtpEmail(clean);
   if(!res.success)throw new Error(res.error);
   setEmail(clean);setSent(true);setCode('');setCooldown(RESEND_SECONDS);
   setMessage({tone:'ok',text:`Giriş kodunu ${clean} adresine gönderdik. Gelen kutunuzu ve gereksiz klasörünü kontrol edin.`});
  }catch(error){
   console.warn('[Okul paneli] kod gönderilemedi',error);
   setMessage({tone:'error',text:friendlyAccountError(error,'Kod gönderilemedi. Biraz sonra yeniden deneyin.',{formal:true})});
  }finally{setBusy(false);}
 };
 const verify=async(event:FormEvent)=>{
  event.preventDefault();
  if(busy)return;
  setBusy(true);setMessage(null);
  try{
   const res=await verifyAdultOtp(email,code);
   if(!res.success)throw new Error(res.error);
   onSignedIn(email);
  }catch(error){
   console.warn('[Okul paneli] giriş',error);
   setMessage({tone:'error',text:friendlyAccountError(error,'Kod doğrulanamadı. Yeniden deneyin.',{formal:true})});
  }finally{setBusy(false);}
 };

 return <section aria-labelledby="school-signin" className={`${card} mx-auto max-w-md`}>
  <ol className="flex items-center gap-2 text-xs font-black" aria-label="Giriş adımları">
   <li aria-current={!sent?'step':undefined} className={`rounded-full px-3 py-1 ${!sent?'bg-sky-300 text-slate-950':'bg-emerald-400/20 text-emerald-100'}`}>{sent?'✓':'1'} E-posta</li>
   <li aria-hidden="true" className="h-px flex-1 bg-white/15"/>
   <li aria-current={sent?'step':undefined} className={`rounded-full px-3 py-1 ${sent?'bg-sky-300 text-slate-950':'bg-white/10 text-sky-100/80'}`}>2 Kod</li>
  </ol>
  <h2 id="school-signin" className="mt-4 text-xl font-black">{mode==='teacher'?'Öğretmen girişi':'Veli girişi'}</h2>
  <p className="mt-2 text-sm leading-relaxed text-slate-300">Şifre yok: e-postanıza gelen kodla girersiniz. Hesabınız yoksa bu adresle açılır. Çocuktan e-posta istenmez.</p>
  {inviteWaiting&&<p className="mt-3 rounded-xl border border-lime-300/40 bg-lime-300/10 p-3 text-sm font-bold leading-relaxed text-lime-50">🔗 Davet kodunuz hazır. Giriş yaptıktan sonra çocuğunuzu seçip onaylamanız yeterli.</p>}
  {!sent?<form onSubmit={send} className="mt-5">
   <label className="block text-sm font-bold">E-posta
    <input type="email" inputMode="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}
     disabled={busy} placeholder="ornek@eposta.com" className={field}/>
   </label>
   <button disabled={busy||!email.trim()} className={`${primary} mt-5 w-full`}>{busy?'Gönderiliyor…':'Giriş Kodu Gönder'}</button>
  </form>:<form onSubmit={verify} className="mt-5">
   <p className="text-sm leading-relaxed text-sky-100/85">Kod <strong className="break-all text-white">{email}</strong> adresine gitti.</p>
   <label className="mt-4 block text-sm font-bold">E-postadaki giriş kodu
    <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={10} required value={code} autoFocus
     onChange={e=>setCode(cleanOtpCode(e.target.value))} placeholder="••••••"
     className={`${field} text-center text-xl font-black tracking-[.3em] tabular-nums`}/>
   </label>
   <button disabled={busy||code.length<6} className={`${primary} mt-5 w-full`}>{busy?'Doğrulanıyor…':'Doğrula ve Gir'}</button>
   <div className="mt-3 grid grid-cols-2 gap-2">
    <button type="button" disabled={busy||cooldown>0} onClick={()=>void send()} className={secondary}>
     {cooldown>0?`Yeni kod (${cooldown} sn)`:'Kodu yeniden gönder'}</button>
    <button type="button" disabled={busy} onClick={()=>{setSent(false);setCode('');setMessage(null);}} className={secondary}>Başka e-posta kullan</button>
   </div>
  </form>}
  {message&&<p role={message.tone==='error'?'alert':'status'}
   className={`mt-4 rounded-xl border p-3 text-sm leading-relaxed ${message.tone==='error'?'border-rose-300/45 bg-rose-950/60':'border-lime-300/45 bg-emerald-950/60'}`}>{message.text}</p>}
 </section>;
}
