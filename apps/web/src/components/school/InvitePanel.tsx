'use client';

import {useCallback,useEffect,useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {activeInvites,issueClassInvite,issueClassInviteFor,revokeInvite,
 type ActiveInvite,type ClassOverview,type InviteDays,type IssuedInvite,type SchoolApiVersion,type VentraSchool} from '@/lib/school/schoolService';
import {formatDay,inviteBaseUrl,inviteLink,inviteMessage} from '@/lib/school/schoolInsights';
import {InviteShowcase} from './InviteShowcase';
import {ConfirmBox,copyText,dangerOutline,primary,secondary,type SchoolAct} from './schoolUi';

const DAY_CHOICES:{days:InviteDays;title:string;hint:string}[]=[
 {days:1,title:'1 gün',hint:'Veli toplantısı'},
 {days:7,title:'7 gün',hint:'Önerilen'},
 {days:30,title:'30 gün',hint:'Dönem başı'}
];
/** The original invite (before the management migration): 7 days, 30 children. */
const LEGACY_DAYS=7,LEGACY_USES=30;

type Props={school:VentraSchool;klass:ClassOverview;version:SchoolApiVersion;issued:IssuedInvite|null;
 onIssued:(invite:IssuedInvite|null)=>void;onInvitesChanged:()=>void;act:SchoolAct;busy:boolean;emphasis:boolean};

/**
 * Invite parents: pick how long the code works, then send a ready message,
 * copy the link or the code, or show a QR code on a screen. Active codes can
 * be cancelled; codes themselves are only shown right after creation.
 */
export function InvitePanel({school,klass,version,issued,onIssued,onInvitesChanged,act,busy,emphasis}:Props){
 const [days,setDays]=useState<InviteDays>(7);
 const [base,setBase]=useState<string|null>(null);
 const [touchShare,setTouchShare]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [messageOpen,setMessageOpen]=useState(false);
 const [showcase,setShowcase]=useState(false);
 const [invites,setInvites]=useState<ActiveInvite[]|null>(null);
 const [pendingRevoke,setPendingRevoke]=useState('');
 useEffect(()=>{
  setBase(inviteBaseUrl(process.env.NEXT_PUBLIC_SITE_URL,window.location.origin,Capacitor.isNativePlatform()));
  setTouchShare(typeof navigator.share==='function'&&window.matchMedia?.('(pointer: coarse)').matches===true);
 },[]);
 const loadInvites=useCallback(async()=>{
  if(version<2)return;
  try{setInvites(await activeInvites(klass.id));}
  catch(error){console.warn('[Okul paneli] davetler',error);setInvites(null);}
 },[klass.id,version]);
 useEffect(()=>{void loadInvites();},[loadInvites]);

 const create=()=>void act(async()=>{
  const invite:IssuedInvite=version>=2?await issueClassInviteFor(klass.id,days)
   :{code:await issueClassInvite(klass.id),validUntil:new Date(Date.now()+LEGACY_DAYS*86400000).toISOString(),useLimit:LEGACY_USES};
  onIssued(invite);setFeedback('');setMessageOpen(false);
  await loadInvites();onInvitesChanged();
 },'Davet hazır. Şimdi velilere gönderebilirsiniz.');

 const link=issued?inviteLink(base,issued.code):null;
 const message=issued?inviteMessage({schoolName:school.name,className:klass.name,code:issued.code,link,validUntil:issued.validUntil}):'';
 const copy=async(value:string,done:string)=>{
  setFeedback('');
  const ok=await copyText(value);
  setFeedback(ok?done:'Bu tarayıcı kopyalamaya izin vermedi. Mesajı aşağıdan seçip kopyalayabilirsiniz.');
  if(!ok)setMessageOpen(true);
 };
 const send=async()=>{
  if(touchShare){
   try{await navigator.share({title:`${klass.name} sınıf daveti`,text:message});setFeedback('✓ Paylaşım ekranı açıldı.');return;}
   catch(error){if((error as {name?:string})?.name==='AbortError')return;}
  }
  await copy(message,'✓ Davet mesajı kopyalandı. Veli grubunuza yapıştırabilirsiniz.');
 };

 return <section aria-labelledby={`invite-title-${klass.id}`}
  className={`rounded-2xl border p-4 sm:p-5 ${emphasis?'border-lime-300/40 bg-lime-300/[.07]':'border-violet-300/30 bg-violet-500/10'}`}>
  <div className="flex flex-wrap items-center justify-between gap-2">
   <h4 id={`invite-title-${klass.id}`} className="text-lg font-black">🔑 Velileri davet edin</h4>
   {version>=2&&invites&&invites.length>0&&<span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{invites.length} etkin davet</span>}
  </div>

  {!issued?<>
   <p className="mt-1 text-sm leading-relaxed text-slate-200">Bir davet oluşturup velilere gönderin. Veli bağlantıyı açar, kendi hesabıyla giriş yapar ve çocuğunu onaylayarak bu sınıfa bağlar.</p>
   {version>=2?<fieldset className="mt-4">
    <legend className="text-sm font-bold">Davet ne kadar geçerli olsun?</legend>
    <div className="mt-2 grid grid-cols-3 gap-2">
     {DAY_CHOICES.map(choice=><label key={choice.days} className="block cursor-pointer">
      <input type="radio" name={`invite-days-${klass.id}`} value={choice.days} checked={days===choice.days}
       onChange={()=>setDays(choice.days)} className="peer sr-only"/>
      <span className="flex min-h-[64px] flex-col items-center justify-center rounded-xl border border-white/15 bg-white/[.04] px-2 py-2 text-center transition hover:bg-white/10 peer-checked:border-lime-300/80 peer-checked:bg-lime-300/15 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lime-300">
       <span className="text-base font-black">{choice.title}</span>
       <span className="text-xs text-sky-100/80">{choice.hint}</span>
      </span>
     </label>)}
    </div>
    <p className="mt-2 text-xs text-slate-300">Bir davetle en fazla 40 çocuk katılabilir.</p>
   </fieldset>:<p className="mt-2 text-sm text-slate-300">Kod 7 gün ve en fazla 30 kez geçerlidir; yalnızca şimdi gösterilir.</p>}
   <button type="button" disabled={busy} onClick={create} className={`${primary} mt-4`}>Davet Oluştur</button>
  </>:<>
   <p className="mt-1 text-sm font-bold text-lime-100">✓ Davet hazır · Son geçerlilik: {formatDay(issued.validUntil)} · en fazla {issued.useLimit} çocuk</p>
   <p className="sr-only">Davet kodu: {issued.code}</p>
   <div aria-hidden="true" className="mt-3 flex flex-wrap items-center gap-1 font-mono text-base font-black tracking-wider sm:text-lg">
    {issued.code.toUpperCase().split('-').map((part,i)=><span key={i} className="contents">
     {i>0&&<span className="text-slate-500">-</span>}<span className="rounded-lg bg-[#0b1d35] px-2.5 py-2">{part}</span></span>)}
   </div>
   <div className="mt-4 grid gap-2 sm:grid-cols-2">
    <button type="button" onClick={()=>void send()} className={`${primary} sm:col-span-2`}>
     {touchShare?'📤 Velilere Gönder':'📋 Davet Mesajını Kopyala'}</button>
    {link&&<button type="button" onClick={()=>void copy(link,'✓ Bağlantı kopyalandı.')} className={secondary}>🔗 Bağlantıyı Kopyala</button>}
    <button type="button" onClick={()=>void copy(issued.code,'✓ Kod kopyalandı. Veliler tireleri yazmasa da kod kabul edilir.')} className={secondary}>🔑 Kodu Kopyala</button>
    <button type="button" onClick={()=>setShowcase(true)} className={`${secondary} ${link?'':'sm:col-span-2'}`}>🖥️ Ekranda Göster{link?' (QR)':''}</button>
   </div>
   <p role="status" className="mt-2 min-h-5 text-xs font-bold leading-relaxed text-lime-100">{feedback}</p>
   <button type="button" aria-expanded={messageOpen} aria-controls={`invite-message-${klass.id}`} onClick={()=>setMessageOpen(open=>!open)}
    className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-bold text-sky-200 underline-offset-4 hover:underline">
    {messageOpen?'▴ Mesajı gizle':'▾ Gönderilecek mesajı gör'}</button>
   <div id={`invite-message-${klass.id}`} hidden={!messageOpen}>
    <p className="mt-2 select-all whitespace-pre-wrap rounded-xl [overflow-wrap:anywhere] border border-white/12 bg-[#0b1d35] p-3 text-sm leading-relaxed text-sky-50">{message}</p>
   </div>
   {!link&&<p className="mt-2 text-xs leading-relaxed text-slate-300">Uygulama içinden bağlantı oluşturulamıyor; veliler kodu Okul Paneli → Veliyim bölümüne yazar.</p>}
   <button type="button" onClick={()=>{onIssued(null);setFeedback('');}} className={`${secondary} mt-3`}>＋ Başka bir davet oluştur</button>
  </>}

  {version>=2&&invites&&invites.length>0&&<div className="mt-5 border-t border-white/12 pt-4">
   <h5 className="text-sm font-black">Etkin davetler</h5>
   <ul className="mt-2 space-y-2">
    {invites.map(invite=>{
     const shown=Boolean(issued&&Math.abs(Date.parse(issued.validUntil)-Date.parse(invite.validUntil))<5000);
     return <li key={invite.id} className="rounded-xl border border-white/12 bg-white/[.04] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
       <span className="text-sm"><strong>Son geçerlilik: {formatDay(invite.validUntil)}</strong>
        <span className="block text-xs text-slate-300">{invite.used}/{invite.useLimit} çocuk katıldı{shown?' · yukarıdaki kod':''}</span></span>
       {pendingRevoke!==invite.id&&<button type="button" disabled={busy} onClick={()=>setPendingRevoke(invite.id)} className={dangerOutline}>İptal Et</button>}
      </div>
      {pendingRevoke===invite.id&&<ConfirmBox label="Davet iptal edilsin mi?" confirm="Evet, iptal et" busy={busy}
       onCancel={()=>setPendingRevoke('')}
       onConfirm={()=>{setPendingRevoke('');void act(async()=>{
        await revokeInvite(invite.id);if(shown)onIssued(null);await loadInvites();onInvitesChanged();
       },'Davet iptal edildi. Bu kodla artık katılım olmaz.');}}>
       Bu kodla artık kimse katılamaz. Daha önce katılan çocuklar sınıfta kalır.
      </ConfirmBox>}
     </li>;
    })}
   </ul>
   <p className="mt-2 text-xs leading-relaxed text-slate-300">Güvenlik için kodlar yalnızca oluşturuldukları anda gösterilir. Kaybettiğiniz bir kodu iptal edip yenisini oluşturabilirsiniz.</p>
  </div>}

  {showcase&&issued&&<InviteShowcase schoolName={school.name} className={klass.name} brand={school.brand_color}
   code={issued.code} link={link} validUntil={issued.validUntil} onClose={()=>setShowcase(false)}/>}
 </section>;
}
