'use client';

import {useCallback,useEffect,useRef,useState,type KeyboardEvent} from 'react';
import Link from 'next/link';
import {getSupabaseClient,isSupabaseConfigured} from '@/lib/supabase/client';
import {signOutAdult} from '@/lib/supabase/auth';
import {friendlyAccountError} from '@/lib/profile/profileHub';
import {inviteFromHash} from '@/lib/school/schoolInsights';
import {SchoolSignIn} from '@/components/school/SchoolSignIn';
import {TeacherWorkspace,forgetIssuedInvites} from '@/components/school/TeacherWorkspace';
import {ParentWorkspace} from '@/components/school/ParentWorkspace';
import {LoadingBlocks,card,secondary,type SchoolAct} from '@/components/school/schoolUi';

type Mode='teacher'|'parent';
type Toast={id:number;tone:'ok'|'error';text:string};
const ROLE_KEY='ventra:school:role';
/** An invite that arrived by link waits here (this tab only) through sign-in. */
const INVITE_KEY='ventra:school:invite';
const ROLES=[
 {id:'teacher',icon:'👩‍🏫',label:'Öğretmenim',sub:'Sınıf kur, ilerlemeyi gör',short:'Öğretmen'},
 {id:'parent',icon:'🛡️',label:'Veliyim',sub:'Çocuğumu sınıfa bağla',short:'Veli'}
] as const;

/** Radio group with arrow keys, Home and End (one tab stop). */
function RoleSwitch({mode,onChange,compact}:{mode:Mode;onChange:(mode:Mode)=>void;compact:boolean}){
 const refs=useRef<(HTMLButtonElement|null)[]>([]);
 const move=(event:KeyboardEvent<HTMLButtonElement>,index:number)=>{
  const step:Record<string,number>={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1};
  let next=-1;
  if(event.key in step)next=(index+step[event.key]+ROLES.length)%ROLES.length;
  else if(event.key==='Home')next=0;
  else if(event.key==='End')next=ROLES.length-1;
  if(next<0)return;
  event.preventDefault();
  onChange(ROLES[next].id);
  refs.current[next]?.focus();
 };
 return <div role="radiogroup" aria-label="Paneli kim kullanıyor?"
  className={compact?'grid grid-cols-2 gap-1 rounded-2xl border border-white/12 bg-[#06101f]/70 p-1':'mx-auto mb-6 grid max-w-2xl grid-cols-2 gap-3'}>
  {ROLES.map((item,index)=>{
   const on=mode===item.id;
   return <button key={item.id} ref={el=>{refs.current[index]=el;}} type="button" role="radio" aria-checked={on} tabIndex={on?0:-1}
    onClick={()=>onChange(item.id)} onKeyDown={event=>move(event,index)}
    className={compact
     ?`flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300 ${on?'bg-lime-300 text-emerald-950 shadow':'text-sky-100 hover:bg-white/10'}`
     :`flex min-h-[76px] items-center gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 ${on?'border-lime-300/70 bg-lime-300/15':'border-white/15 bg-white/[.05] hover:bg-white/10'}`}>
    <span aria-hidden="true" className={compact?'':'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl sm:h-12 sm:w-12 sm:text-2xl'}>{item.icon}</span>
    {compact?<span>{item.short}</span>:<span className="min-w-0 leading-tight"><span className="block text-[15px] font-black sm:text-base">{item.label}</span>
     <span className="block text-xs text-slate-300">{item.sub}</span></span>}
   </button>;
  })}
 </div>;
}

function ToastView({toast,onClose}:{toast:Toast|null;onClose:()=>void}){
 const shell='pointer-events-auto flex w-full items-start gap-3 rounded-2xl border p-4 text-sm font-bold leading-relaxed shadow-2xl shadow-black/50 backdrop-blur';
 const close=<button type="button" onClick={onClose} aria-label="Bildirimi kapat"
  className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300">✕</button>;
 return <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 px-4"
  style={{paddingBottom:'max(16px,env(safe-area-inset-bottom))'}}>
  <div role="status" aria-live="polite" className="w-full max-w-lg">
   {toast?.tone==='ok'&&<div className={`${shell} border-lime-300/50 bg-emerald-950/95`}><span aria-hidden="true">✅</span><span className="flex-1">{toast.text}</span>{close}</div>}
  </div>
  {toast?.tone==='error'&&<div role="alert" className={`${shell} max-w-lg border-rose-300/55 bg-rose-950/95`}>
   <span aria-hidden="true">⚠️</span><span className="flex-1">{toast.text}</span>{close}</div>}
 </div>;
}

export default function SchoolPortal(){
 const [mode,setMode]=useState<Mode>('teacher');
 const [auth,setAuth]=useState<'loading'|'off'|'out'|'in'>('loading');
 const [email,setEmail]=useState('');
 const [invite,setInvite]=useState('');
 const [fromLink,setFromLink]=useState(false);
 const [busy,setBusy]=useState(false);
 const busyRef=useRef(false);
 const [toast,setToast]=useState<Toast|null>(null);

 const chooseMode=(next:Mode)=>{
  setMode(next);setToast(null);
  try{window.localStorage.setItem(ROLE_KEY,next);}catch{/* remembered for this visit only */}
 };
 useEffect(()=>{
  try{const saved=window.localStorage.getItem(ROLE_KEY);if(saved==='teacher'||saved==='parent')setMode(saved);}catch{/* ignore */}
  // A teacher's link (/school#davet=…) opens the parent view with the code
  // filled in, also when /school is already open (only the "#" part
  // changes then). The code is then removed from the address bar.
  const pick=()=>{
   const linked=inviteFromHash(window.location.hash);
   let waiting:string|null=null;
   try{
    if(linked)window.sessionStorage.setItem(INVITE_KEY,linked);
    waiting=inviteFromHash('#davet='+(window.sessionStorage.getItem(INVITE_KEY)??''));
   }catch{waiting=linked;}
   // A fresh link opens the parent view and remembers that choice; a code
   // kept from earlier never overrides a role the person picked since.
   if(linked){
    window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);
    try{window.localStorage.setItem(ROLE_KEY,'parent');}catch{/* this visit only */}
    setMode('parent');
   }
   if(waiting){setInvite(waiting);setFromLink(true);}
  };
  pick();
  window.addEventListener('hashchange',pick);
  return()=>window.removeEventListener('hashchange',pick);
 },[]);
 useEffect(()=>{
  if(!isSupabaseConfigured()){setAuth('off');return;}
  let alive=true;
  getSupabaseClient()!.auth.getUser()
   .then(({data,error})=>{
    if(!alive)return;
    const user=!error?data.user:null;
    setEmail(user?.email??'');setAuth(user?'in':'out');
   })
   .catch(()=>{if(alive)setAuth('out');});
  return()=>{alive=false;};
 },[]);

 const show=useCallback((tone:Toast['tone'],text:string)=>setToast({id:Date.now(),tone,text}),[]);
 useEffect(()=>{
  if(toast?.tone!=='ok')return;
  const timer=window.setTimeout(()=>setToast(current=>current?.id===toast.id?null:current),6000);
  return()=>window.clearTimeout(timer);
 },[toast]);
 const act=useCallback<SchoolAct>(async(action,success,fallback='İşlem tamamlanamadı. Biraz sonra yeniden deneyin.')=>{
  if(busyRef.current)return false;
  busyRef.current=true;setBusy(true);setToast(null);
  try{await action();if(success)show('ok',success);return true;}
  catch(error){console.warn('[Okul paneli]',error);show('error',friendlyAccountError(error,fallback,{formal:true}));return false;}
  finally{busyRef.current=false;setBusy(false);}
 },[show]);
 const signOut=()=>void act(async()=>{
  await signOutAdult();
  forgetIssuedInvites();
  setAuth('out');setEmail('');
 },'Oturum kapatıldı.','Çıkış yapılamadı. Yeniden deneyin.');
 const inviteUsed=()=>{
  setInvite('');setFromLink(false);
  try{window.sessionStorage.removeItem(INVITE_KEY);}catch{/* nothing stored */}
 };

 return <div className="min-h-[100dvh] bg-[#071427] text-white">
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
   <div className="absolute -left-40 -top-32 h-[34rem] w-[34rem] rounded-full bg-violet-500/15 blur-3xl"/>
   <div className="absolute -right-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-sky-500/15 blur-3xl"/>
  </div>
  <header className="relative z-30 border-b border-white/10 bg-[#071427]/85 backdrop-blur-xl sm:sticky sm:top-0" style={{paddingTop:'env(safe-area-inset-top)'}}>
   <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
    <Link href="/" className="flex min-h-11 items-center gap-3">
     <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-sky-500 text-xl shadow-lg shadow-violet-900/40">🏫</span>
     <span className="leading-tight"><span className="block text-sm font-black tracking-[.18em] text-violet-200">VENTRA</span>
      <span className="block text-base font-black">Okul Paneli</span></span>
    </Link>
    <nav aria-label="Okul paneli bağlantıları" className="flex flex-wrap items-center gap-2">
     <Link href="/progress" className={secondary}>🛡️ Aile Paneli</Link>
     <Link href="/kids" className="flex min-h-11 items-center rounded-xl bg-gradient-to-r from-lime-300 to-emerald-300 px-4 text-sm font-black text-emerald-950">🏝️ Ventra Kids</Link>
    </nav>
   </div>
  </header>
  <main className="relative mx-auto max-w-6xl px-4 pt-6" style={{paddingBottom:'max(112px,env(safe-area-inset-bottom))'}}>
   {auth==='in'?<div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/12 bg-white/[.04] px-4 py-3">
    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
     <h1 className="text-lg font-black sm:text-xl">Okulumla Oyna</h1>
     <RoleSwitch mode={mode} onChange={chooseMode} compact/>
    </div>
    <div className="flex min-w-0 flex-wrap items-center gap-3">
     <span className="min-w-0 text-sm text-sky-100">Giriş yapan: <strong className="break-all">{email}</strong></span>
     <button type="button" disabled={busy} onClick={signOut} className={secondary}>Çıkış Yap</button>
    </div>
   </div>:<>
    <div className="mx-auto max-w-3xl pb-6 pt-2 text-center sm:pt-6">
     <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Okulumla Oyna</h1>
     <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-sky-100/85 sm:text-base">
      Öğretmen sınıfını kurar ve velilere bir davet bağlantısı gönderir; veli, çocuğunu kendi hesabından onaylayarak sınıfa bağlar.
      Öğretmen yalnızca çocuğun takma adını ve İngilizce görev özetini görür.
     </p>
     <ul className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-bold text-sky-50">
      {['🔗 Tek bağlantıyla katılım','📊 İngilizce görev özeti','🔒 Ses, metin ve gerçek ad paylaşılmaz'].map(item=>
       <li key={item} className="rounded-full border border-white/15 bg-white/[.06] px-3 py-1.5">{item}</li>)}
     </ul>
    </div>
    {auth!=='off'&&<RoleSwitch mode={mode} onChange={chooseMode} compact={false}/>}
   </>}

   {auth==='loading'?<LoadingBlocks label="Yükleniyor…"/>:
   auth==='off'?<section className={`${card} mx-auto max-w-xl text-center`}>
    <div aria-hidden="true" className="text-5xl">☁️</div>
    <h2 className="mt-3 text-xl font-black">Okul paneli bu kurulumda kapalı</h2>
    <p className="mt-2 text-sm leading-relaxed text-slate-300">Sınıflar ve davetler bulut hesabıyla çalışır. Bu sürümde bulut bağlantısı tanımlı değil; çocuklar Ventra Kids'te bireysel oynamaya devam edebilir.</p>
   </section>:
   auth==='out'?<SchoolSignIn mode={mode} inviteWaiting={Boolean(invite)}
    onSignedIn={address=>{setEmail(address);setAuth('in');show('ok','Giriş yapıldı.');}}/>:
   mode==='teacher'?<TeacherWorkspace act={act} busy={busy}/>:
   <ParentWorkspace email={email} act={act} busy={busy} invite={invite} fromLink={fromLink} onInviteUsed={inviteUsed}/>}
  </main>
  <ToastView toast={toast} onClose={()=>setToast(null)}/>
 </div>;
}
