'use client';

import {useCallback,useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {getSupabaseClient,isSupabaseConfigured} from '@/lib/supabase/client';
import {sendAdultOtpEmail,verifyAdultOtp,signOutAdult} from '@/lib/supabase/auth';
import {getProgressRepository} from '@/lib/progress';
import {linkLocalSchoolCandidate,localSchoolCandidates,type LocalSchoolCandidate} from '@/lib/school/parentProfileBridge';
import {
 schoolDashboard,createSchool,createClassroom,issueClassInvite,teacherRoster,
 parentLinkedChildren,enrollChild,parentClassrooms,leaveClassroom,normaliseInviteCode,
 type VentraSchool,type VentraClassroom,type TeacherRosterEntry,type ParentClassroom,type LinkedChild
} from '@/lib/school/schoolService';
import {cleanOtpCode,friendlyAccountError} from '@/lib/profile/profileHub';

type Mode='teacher'|'parent';
const ROLE_KEY='ventra:school:role';
/** Shown in groups so a teacher can read it out or copy it without mistakes. */
function groupedCode(code:string){return code.toUpperCase().split('-');}

const card='rounded-[2rem] border border-white/12 bg-white/[.05] p-5 sm:p-7';
const field='mt-2 min-h-12 w-full rounded-xl border border-white/25 bg-[#0b1d35] px-4 text-base text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300';
const primary='inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-300 to-emerald-300 px-5 font-black text-emerald-950 shadow-lg shadow-emerald-900/30 disabled:cursor-not-allowed disabled:opacity-45';
const secondary='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[.07] px-4 text-sm font-bold hover:bg-white/15 disabled:opacity-45';

export default function SchoolPortal(){
 const [mode,setMode]=useState<Mode>('teacher');
 const [signedIn,setSignedIn]=useState(false);
 const [email,setEmail]=useState('');
 const [code,setCode]=useState('');
 const [otpSent,setOtpSent]=useState(false);
 const [schools,setSchools]=useState<VentraSchool[]>([]);
 const [classes,setClasses]=useState<VentraClassroom[]>([]);
 const [activeClass,setActiveClass]=useState('');
 const [roster,setRoster]=useState<TeacherRosterEntry[]>([]);
 const [rosterLoading,setRosterLoading]=useState(false);
 const [newSchool,setNewSchool]=useState('');
 const [brand,setBrand]=useState('#2563eb');
 const [newClass,setNewClass]=useState('');
 const [grade,setGrade]=useState(3);
 const [issuedInvite,setIssuedInvite]=useState('');
 const [copied,setCopied]=useState(false);
 const [copyFailed,setCopyFailed]=useState(false);
 // Leaving a class asks first: key `${classroom_id}:${profile_id}`.
 const [pendingLeave,setPendingLeave]=useState('');
 const [children,setChildren]=useState<LinkedChild[]>([]);
 const [localCandidates,setLocalCandidates]=useState<LocalSchoolCandidate[]>([]);
 const [pendingLink,setPendingLink]=useState<LocalSchoolCandidate|null>(null);
 const [adultUserId,setAdultUserId]=useState('');
 const [chosenChild,setChosenChild]=useState('');
 const [inviteCode,setInviteCode]=useState('');
 const [joined,setJoined]=useState<ParentClassroom[]>([]);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');

 const chooseMode=(next:Mode)=>{
  setMode(next);setError('');setNotice('');
  try{window.localStorage.setItem(ROLE_KEY,next);}catch{/* remembered for this visit only */}
 };
 useEffect(()=>{try{const saved=window.localStorage.getItem(ROLE_KEY);if(saved==='teacher'||saved==='parent')setMode(saved);}catch{/* ignore */}},[]);

 const refresh=useCallback(async(nextMode:Mode)=>{
   if(nextMode==='teacher'){
     const result=await schoolDashboard();
     setSchools(result.schools);setClasses(result.classes);
     setActiveClass(old=>result.classes.some(c=>c.id===old)?old:result.classes[0]?.id??'');
   }else{
     const client=getSupabaseClient();
     if(!client)throw new Error('Bulut bağlantısı kurulamadı.');
     const [profiles,memberships,local,auth]=await Promise.all([
       parentLinkedChildren(),parentClassrooms(),getProgressRepository().getAllProfiles(),client.auth.getUser()
     ]);
     if(auth.error||!auth.data.user)throw new Error('Yetişkin oturumu bulunamadı.');
     setAdultUserId(auth.data.user.id);
     setLocalCandidates(localSchoolCandidates(local,profiles,auth.data.user.id));
     setChildren(profiles);setJoined(memberships);
     setChosenChild(old=>profiles.some(p=>p.id===old)?old:profiles[0]?.id??'');
   }
 },[]);
 useEffect(()=>{
   let alive=true;
   const initialize=async()=>{
     if(!isSupabaseConfigured()){if(alive)setLoading(false);return;}
     const {data,error}=await getSupabaseClient()!.auth.getUser();
     if(!alive)return;
     setSignedIn(!error&&Boolean(data.user));
     setEmail(data.user?.email??'');
     setLoading(false);
   };
   void initialize();
   return()=>{alive=false;};
 },[]);
 useEffect(()=>{
   if(!signedIn)return;
   let alive=true;
   setLoading(true);setError('');
   refresh(mode).catch(e=>{console.warn('[Okul paneli] yükleme',e);if(alive)setError(friendlyAccountError(e,'Okul verileri yüklenemedi. Sayfayı yenileyip yeniden deneyin.',{formal:true}));})
     .finally(()=>{if(alive)setLoading(false);});
   return()=>{alive=false;};
 },[signedIn,mode,refresh]);
 // The selected class shows its students straight away.
 useEffect(()=>{
   if(!signedIn||mode!=='teacher'||!activeClass)return;
   let alive=true;
   setRosterLoading(true);setRoster([]);
   teacherRoster(activeClass).then(list=>{if(alive)setRoster(list);})
     .catch(e=>{console.warn('[Okul paneli] öğrenci listesi',e);if(alive)setError(friendlyAccountError(e,'Öğrenci listesi yüklenemedi. Biraz sonra yeniden deneyin.',{formal:true}));})
     .finally(()=>{if(alive)setRosterLoading(false);});
   return()=>{alive=false;};
 },[signedIn,mode,activeClass]);

 const run=async(action:()=>Promise<void>,success:string)=>{
   if(busy)return;
   setBusy(true);setError('');setNotice('');
   try{await action();setNotice(success);await refresh(mode);}
   catch(e){console.warn('[Okul paneli]',e);setError(friendlyAccountError(e,'İşlem tamamlanamadı. Biraz sonra yeniden deneyin.',{formal:true}));}
   finally{setBusy(false);}
 };
 const login=async(event:FormEvent)=>{
   event.preventDefault();
   await run(async()=>{
     if(!otpSent){
       const clean=email.trim().toLowerCase();
       const res=await sendAdultOtpEmail(clean);
       if(!res.success)throw new Error(res.error);
       setEmail(clean);setOtpSent(true);
     }else{
       const res=await verifyAdultOtp(email,code);
       if(!res.success)throw new Error(res.error);
       setSignedIn(true);
     }
   },otpSent?'Giriş yapıldı.':'E-postanıza bir giriş kodu gönderdik. Gelen kutunuzu ve gereksiz klasörünü kontrol edin.');
 };
 const signOut=()=>{
   if(busy)return;setBusy(true);setError('');
   void signOutAdult().then(()=>{
     setSignedIn(false);setSchools([]);setChildren([]);setLocalCandidates([]);setAdultUserId('');setClasses([]);setRoster([]);setIssuedInvite('');
     setOtpSent(false);setCode('');setNotice('Oturum kapatıldı.');
   }).catch(e=>{console.warn('[Okul paneli] çıkış',e);setError(friendlyAccountError(e,'Çıkış yapılamadı. Yeniden deneyin.',{formal:true}));}).finally(()=>setBusy(false));
 };
 const activeSchool=schools[0];
 const currentClass=classes.find(c=>c.id===activeClass);
 const totalStars=roster.reduce((n,r)=>n+Number(r.stars),0);
 const averageMissions=roster.length?Math.round(10*roster.reduce((n,r)=>n+Number(r.completed_levels),0)/roster.length)/10:0;
 const averageLabel=averageMissions.toLocaleString('tr-TR',{maximumFractionDigits:1});
 const maxMissions=Math.max(1,...roster.map(r=>Number(r.completed_levels)));
 const typedCode=normaliseInviteCode(inviteCode);
 const typedHex=typedCode.replace(/-/g,'').length;

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
  <main className="relative mx-auto max-w-6xl px-4 pt-6" style={{paddingBottom:'max(64px,env(safe-area-inset-bottom))'}}>
   <div className="mx-auto max-w-3xl pb-6 pt-2 text-center sm:pt-6">
    <h1 className="text-3xl font-black tracking-tight sm:text-5xl">Okulumla Oyna</h1>
    <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-sky-100/85 sm:text-base">
     Öğretmen sınıfını kurar ve veliye bir davet kodu verir; veli, çocuğunu kendi hesabından sınıfa bağlar.
     Öğretmen yalnızca çocuğun takma adını ve İngilizce görev özetini görür.
    </p>
   </div>
   <div role="radiogroup" aria-label="Paneli kim kullanıyor?" className="mx-auto mb-6 grid max-w-2xl grid-cols-2 gap-3">
    {([{id:'teacher',icon:'👩‍🏫',label:'Öğretmenim',sub:'Sınıf kur, ilerlemeyi gör'},{id:'parent',icon:'🛡️',label:'Veliyim',sub:'Çocuğumu sınıfa bağla'}] as const).map(item=>
     <button key={item.id} type="button" role="radio" aria-checked={mode===item.id} onClick={()=>chooseMode(item.id)}
      className={`flex min-h-[76px] items-center gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300
       ${mode===item.id?'border-lime-300/70 bg-lime-300/15':'border-white/15 bg-white/[.05] hover:bg-white/10'}`}>
      <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl sm:h-12 sm:w-12 sm:text-2xl">{item.icon}</span>
      <span className="min-w-0 leading-tight"><span className="block text-[15px] font-black sm:text-base">{item.label}</span><span className="block text-xs text-slate-300">{item.sub}</span></span>
     </button>)}
   </div>
   {error&&<div role="alert" className="mx-auto mb-5 max-w-3xl rounded-2xl border border-rose-300/45 bg-rose-950/60 p-4 text-sm">{error}</div>}
   {notice&&<div role="status" className="mx-auto mb-5 max-w-3xl rounded-2xl border border-lime-300/45 bg-emerald-950/60 p-4 text-sm">{notice}</div>}

   {loading?<p role="status" className="p-10 text-center font-semibold text-sky-100">Yükleniyor…</p>:
   !isSupabaseConfigured()?<section className={`${card} mx-auto max-w-xl text-center`}>
    <div aria-hidden="true" className="text-5xl">☁️</div>
    <h2 className="mt-3 text-xl font-black">Okul paneli bu kurulumda kapalı</h2>
    <p className="mt-2 text-sm leading-relaxed text-slate-300">Sınıflar ve davetler bulut hesabıyla çalışır. Bu sürümde bulut bağlantısı tanımlı değil; çocuklar Ventra Kids'te bireysel oynamaya devam edebilir.</p>
   </section>:
   !signedIn?<form onSubmit={login} className={`${card} mx-auto max-w-md`}>
    <h2 className="text-xl font-black">{mode==='teacher'?'Öğretmen girişi':'Veli girişi'}</h2>
    <p className="mt-2 text-sm leading-relaxed text-slate-300">Şifre yok: e-postanıza gelen kodla girersiniz. Çocuktan e-posta istenmez.</p>
    <label className="mt-5 block text-sm font-bold">E-posta
     <input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}
      disabled={otpSent||busy} className={field}/>
    </label>
    {otpSent&&<label className="mt-4 block text-sm font-bold">E-postadaki giriş kodu
     <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={10} required value={code}
      onChange={e=>setCode(cleanOtpCode(e.target.value))} className={`${field} text-center text-xl font-black tracking-[.3em] tabular-nums`}/>
    </label>}
    <button disabled={busy||(otpSent&&code.length<6)} className={`${primary} mt-5 w-full`}>{busy?'İşleniyor…':otpSent?'Doğrula ve Gir':'Giriş Kodu Gönder'}</button>
    {otpSent&&<button type="button" onClick={()=>{setOtpSent(false);setCode('');}} className="mt-3 min-h-11 w-full text-sm font-bold text-sky-200">Başka e-posta kullan</button>}
   </form>:
   <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/12 bg-white/[.04] px-4 py-3">
     <span className="text-sm text-sky-100">Giriş yapan: <strong className="break-all">{email}</strong></span>
     <button type="button" disabled={busy} onClick={signOut} className={secondary}>Çıkış Yap</button>
    </div>
    {mode==='teacher'?(!activeSchool?
     <form onSubmit={e=>{e.preventDefault();void run(async()=>{await createSchool(newSchool,brand);},'Okul alanınız hazır. Şimdi ilk sınıfınızı ekleyin.');}} className={`${card} mx-auto max-w-xl`}>
      <h2 className="text-xl font-black">Okul alanınızı oluşturun</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">Sınıflarınız ve davet kodlarınız bu alanda durur. Okul alanı, kurum doğrulaması yapılana kadar “doğrulanmamış” etiketiyle görünür.</p>
      <label className="mt-5 block text-sm font-bold">Okul adı
       <input minLength={3} maxLength={90} required value={newSchool} onChange={e=>setNewSchool(e.target.value)} placeholder="Örnek: Martı İlkokulu" className={field}/>
      </label>
      <label className="mt-4 flex items-center gap-4 text-sm font-bold">Okul rengi
       <input aria-label="Okul rengi" type="color" value={brand} onChange={e=>setBrand(e.target.value)} className="h-12 w-20 cursor-pointer rounded-xl border border-white/20 bg-transparent"/>
      </label>
      <button disabled={busy} className={`${primary} mt-5`}>Okul Alanını Oluştur</button>
     </form>:<>
     <section aria-labelledby="school-name" className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-br from-[#1c2c5c] via-[#14264a] to-[#102a42] p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-4">
       <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-3xl text-3xl shadow-xl" style={{background:activeSchool.brand_color}}>🏫</span>
       <div className="min-w-0 flex-1">
        <h2 id="school-name" className="truncate text-2xl font-black sm:text-3xl">{activeSchool.name}</h2>
        <p className="mt-1 text-sm text-slate-300">{activeSchool.verified_at?'✓ Doğrulanmış kurum':'Doğrulanmamış okul alanı'} · {classes.length} sınıf</p>
       </div>
      </div>
      <form onSubmit={e=>{e.preventDefault();void run(async()=>{await createClassroom(activeSchool.id,newClass,grade);setNewClass('');},'Sınıf eklendi.');}}
       className="mt-6 grid gap-3 border-t border-white/12 pt-5 sm:grid-cols-[1fr_150px_auto]">
       <label className="text-sm font-bold">Yeni sınıf
        <input required minLength={2} maxLength={60} value={newClass} onChange={e=>setNewClass(e.target.value)} placeholder="Örnek: 3-A" className={field}/>
       </label>
       <label className="text-sm font-bold">Sınıf düzeyi
        <select value={grade} onChange={e=>setGrade(Number(e.target.value))} className={field}>
         {Array.from({length:8},(_,i)=><option key={i} value={i+1}>{i+1}. sınıf</option>)}
        </select>
       </label>
       <button disabled={busy} className={`${primary} self-end`}>+ Sınıf Ekle</button>
      </form>
     </section>
     {classes.length===0?<p className="text-center text-sm text-slate-300">İlk sınıfınızı ekleyince davet kodu üretebilir ve öğrencilerinizi görebilirsiniz.</p>:
     <div className="grid items-start gap-6 lg:grid-cols-[minmax(220px,300px)_minmax(0,1fr)]">
      <nav aria-label="Sınıflar" className={`${card} space-y-2 !p-4`}>
       <h3 className="mb-2 px-1 text-sm font-black uppercase tracking-[.14em] text-sky-200">Sınıflarım</h3>
       {classes.map(c=><button key={c.id} type="button" onClick={()=>{setActiveClass(c.id);setIssuedInvite('');setCopied(false);setCopyFailed(false);}}
        aria-pressed={activeClass===c.id}
        className={`flex min-h-14 w-full items-center justify-between gap-2 rounded-2xl border px-4 text-left text-sm font-black transition
         ${activeClass===c.id?'border-lime-300/70 bg-lime-300/15':'border-white/12 bg-white/[.04] hover:bg-white/10'}`}>
        <span className="truncate">{c.name}</span><span className="shrink-0 text-xs font-bold text-sky-100">{c.grade_level}. sınıf</span>
       </button>)}
      </nav>
      <section aria-labelledby="class-title" className={card}>
       <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="class-title" className="text-2xl font-black">🎒 {currentClass?.name??'Sınıf seçin'}</h3>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{currentClass?`${currentClass.grade_level}. sınıf`:''}</span>
       </div>
       <dl className="mt-5 grid grid-cols-3 gap-3">
        {[['Öğrenci',String(roster.length)],['Ort. görev',averageLabel],['Toplam ⭐',totalStars.toLocaleString('tr-TR')]].map(([label,value])=>
         <div key={label} className="rounded-2xl border border-white/12 bg-white/[.06] p-3 sm:p-4">
          <dt className="text-xs font-bold text-sky-100">{label}</dt><dd className="mt-1 text-2xl font-black tabular-nums">{rosterLoading?'…':value}</dd>
         </div>)}
       </dl>
       <div className="mt-5 rounded-2xl border border-violet-300/30 bg-violet-500/10 p-4">
        <h4 className="font-black">🔑 Veli davet kodu</h4>
        <p className="mt-1 text-sm leading-relaxed text-slate-300">Kodu velilere iletin; veli, “Veliyim” bölümünden çocuğunu bu sınıfa bağlar. Kod 7 gün ve en fazla 30 kez geçerlidir; yalnızca şimdi gösterilir.</p>
        {issuedInvite?<div className="mt-3">
         <p className="sr-only">Davet kodu: {issuedInvite}</p>
         <div aria-hidden="true" className="flex flex-wrap items-center gap-1 font-mono text-base font-black tracking-wider sm:text-lg">
          {groupedCode(issuedInvite).map((part,i)=><span key={i} className="contents">
           {i>0&&<span className="text-slate-500">-</span>}<span className="rounded-lg bg-[#0b1d35] px-2.5 py-2">{part}</span></span>)}
         </div>
         <button type="button" onClick={()=>{setCopyFailed(false);
          const copy=navigator.clipboard?.writeText(issuedInvite);
          if(!copy){setCopyFailed(true);return;}
          void copy.then(()=>setCopied(true)).catch(()=>{setCopied(false);setCopyFailed(true);});}}
          className={`${secondary} mt-3`}>{copied?'✓ Kopyalandı':'📋 Kodu Kopyala'}</button>
         {copyFailed&&<p role="status" className="mt-2 text-xs leading-relaxed text-amber-100">Bu tarayıcı kopyalamaya izin vermedi. Kodu seçip kopyalayabilir ya da sesli okuyabilirsiniz; veliler tireleri yazmasa da kod kabul edilir.</p>}
        </div>:
        <button type="button" disabled={!activeClass||busy}
         onClick={()=>void run(async()=>{setCopied(false);setIssuedInvite(await issueClassInvite(activeClass));},'Yeni davet kodu hazır.')}
         className={`${primary} mt-3`}>Davet Kodu Oluştur</button>}
       </div>
       <h4 className="mt-6 font-black">Öğrencilerin İngilizce görevleri</h4>
       {rosterLoading?<p role="status" className="mt-3 text-sm text-slate-300">Öğrenci listesi yükleniyor…</p>:
       roster.length===0?<p className="mt-3 rounded-2xl border border-white/10 bg-white/[.03] p-4 text-sm text-slate-300">Bu sınıfa henüz bağlanan öğrenci yok. Davet kodunu velilere ilettiğinizde öğrenciler burada görünür.</p>:
       <ul className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/12 bg-white/[.03]">
        {roster.map(x=><li key={x.profile_id} className="flex flex-wrap items-center gap-3 px-4 py-3">
         <span className="min-w-[8rem] flex-1">
          <span className="block text-sm font-black">{x.nickname}</span>
          <span className="block text-xs text-slate-300">{x.grade_level?`${x.grade_level}. sınıf`:'Sınıf seçilmedi'}</span>
         </span>
         <span className="w-full min-w-[10rem] flex-[2] sm:w-auto">
          <span className="flex justify-between text-xs font-bold text-sky-100"><span>{Number(x.completed_levels)} görev</span><span>⭐ {Number(x.stars)}</span></span>
          <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
           <span className="block h-full rounded-full bg-gradient-to-r from-lime-300 to-emerald-300" style={{width:`${Math.round(100*Number(x.completed_levels)/maxMissions)}%`}}/>
          </span>
         </span>
        </li>)}
       </ul>}
       <p className="mt-3 text-xs leading-relaxed text-slate-400">Görev ve yıldızlar velinin bulut hesabına yedeklenmiş oyunlardan gelir. Gerçek ad, e-posta, ses ya da yazılan metin paylaşılmaz.</p>
      </section>
     </div>}
    </>):
    <div className="mx-auto grid max-w-3xl gap-6">
     {localCandidates.length>0&&<section aria-labelledby="parent-step-1" className={card}>
      <p className="text-xs font-black uppercase tracking-[.16em] text-amber-200">Adım 1 · Hesaba bağla</p>
      <h2 id="parent-step-1" className="mt-1 text-xl font-black">Bu cihazdaki çocuk profili</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">Sınıfa katılmak için çocuğun profili hesabınıza bağlı olmalı. Bağlarken oyun ilerlemesi korunur.</p>
      <ul className="mt-4 space-y-2">{localCandidates.map(profile=><li key={profile.id}
       className="rounded-2xl border border-white/12 bg-white/[.05] p-3">
       <div className="flex flex-wrap items-center justify-between gap-3">
        <div><strong className="text-sm">{profile.nickname}</strong>
         <p className="mt-0.5 text-xs text-slate-300">{profile.gradeLevel?`${profile.gradeLevel}. sınıf · `:''}{profile.status==='unlinked'?'Yalnızca bu cihazda':'Bulut eşitlemesi gerekiyor'}</p></div>
        {pendingLink?.id!==profile.id&&<button type="button" disabled={busy} onClick={()=>setPendingLink(profile)}
         className="min-h-11 rounded-xl bg-amber-200 px-4 text-sm font-black text-slate-950 disabled:opacity-45">
         {profile.status==='unlinked'?'Hesabıma Bağla':'Buluta Eşitle'}</button>}
       </div>
       {pendingLink?.id===profile.id&&<div role="group" aria-label="Bağlamayı onayla" className="mt-3 rounded-xl border border-amber-200/40 bg-amber-950/30 p-3">
        <p className="text-sm leading-relaxed">“{profile.nickname}” profili <strong className="break-all">{email}</strong> hesabına {profile.status==='unlinked'?'kalıcı olarak bağlanacak':'eşitlenecek'}. Öğrenme kayıtları silinmez; başka bir yetişkin hesabına aktarılamaz.</p>
        <div className="mt-3 flex flex-wrap gap-2">
         <button type="button" disabled={busy} onClick={()=>{setPendingLink(null);void run(async()=>{await linkLocalSchoolCandidate(profile.id,adultUserId);},
          `${profile.nickname} hesabınıza bağlandı. Şimdi sınıfa katılabilir.`);}} className="min-h-11 rounded-xl bg-amber-200 px-4 text-sm font-black text-slate-950">Onaylıyorum</button>
         <button type="button" onClick={()=>setPendingLink(null)} className={secondary}>Vazgeç</button>
        </div>
       </div>}
      </li>)}</ul>
     </section>}
     <form aria-labelledby="parent-step-2" onSubmit={e=>{e.preventDefault();
       const nickname=children.find(c=>c.id===chosenChild)?.nickname??'Çocuğunuz';
       void run(async()=>{
       await enrollChild(chosenChild,typedCode);setInviteCode('');
      },`${nickname} sınıfa katıldı. Öğretmen artık İngilizce görev özetini görebilir.`);}} className={card}>
      <p className="text-xs font-black uppercase tracking-[.16em] text-lime-200">{localCandidates.length>0?'Adım 2':'Adım 1'} · Sınıfa katıl</p>
      <h2 id="parent-step-2" className="mt-1 text-xl font-black">Öğretmenin davet kodu</h2>
      {children.length===0?<p role="status" className="mt-3 rounded-2xl border border-sky-300/30 bg-sky-950/40 p-4 text-sm leading-relaxed text-slate-200">
       Bu hesapta bağlı çocuk profili yok. {localCandidates.length>0?'Önce yukarıdan profili hesabınıza bağlayın.':
       <>Profil başka bir cihazdaysa, o cihazda <Link href="/progress" className="font-bold text-sky-200 underline">Aile Paneli → Yedekleme</Link> ile bu hesaba bağlayın.</>}
      </p>:<>
       <label className="mt-4 block text-sm font-bold">Çocuk
        <select required value={chosenChild} onChange={e=>setChosenChild(e.target.value)} className={field}>
         {children.map(c=><option key={c.id} value={c.id}>{c.nickname}{c.grade_level?` (${c.grade_level}. sınıf)`:''}</option>)}
        </select>
       </label>
       <label className="mt-4 block text-sm font-bold">Davet kodu
        <input required value={inviteCode} onChange={e=>setInviteCode(normaliseInviteCode(e.target.value))}
         autoComplete="off" autoCapitalize="off" spellCheck={false} aria-describedby="invite-code-help"
         placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" className={`${field} font-mono text-sm uppercase`}/>
       </label>
       <p id="invite-code-help" className={`mt-2 text-xs leading-relaxed ${typedCode.length===36?'font-bold text-lime-200':'text-sky-200'}`}>
        {!typedCode?'Öğretmenin verdiği kodu yapıştırın ya da yazın; büyük-küçük harf, boşluk ve tireler önemli değil. E-postanıza gelen giriş kodu bu değildir.':
         typedCode.length===36?'✓ Kod tamam.':typedHex>32?'Kod fazla uzun görünüyor; yalnızca öğretmenin verdiği kodu yapıştırın.':
         `Kod eksik görünüyor: ${typedHex}/32 harf ve rakam.`}
       </p>
       <button disabled={!chosenChild||typedCode.length!==36||busy} className={`${primary} mt-5`}>Çocuğumun Sınıfa Katılmasını Onaylıyorum</button>
       <p className="mt-3 text-xs leading-relaxed text-slate-400">Öğretmen yalnızca takma adı, sınıf düzeyini ve İngilizce görev özetini görür. Bağlantıyı istediğiniz zaman kaldırabilirsiniz.</p>
      </>}
     </form>
     <section aria-labelledby="parent-joined" className={card}>
      <h2 id="parent-joined" className="text-xl font-black">Bağlı sınıflar</h2>
      {joined.length===0?<p className="mt-2 text-sm text-slate-300">Henüz sınıfa bağlı çocuk yok.</p>:
      <ul className="mt-4 space-y-2">{joined.map(x=>{
       const key=`${x.classroom_id}:${x.profile_id}`;
       const nickname=children.find(c=>c.id===x.profile_id)?.nickname??'Çocuk profili';
       return <li key={key} className={`rounded-2xl border p-3 ${pendingLeave===key?'border-rose-300/45 bg-rose-950/30':'border-white/12 bg-white/[.05]'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
         <span className="text-sm font-black">{x.school_name} · {x.class_name}
          <span className="block text-xs font-normal text-slate-300">{nickname}</span></span>
         {pendingLeave!==key&&<button type="button" disabled={busy} onClick={()=>setPendingLeave(key)}
          className="min-h-11 rounded-xl border border-rose-300/50 px-4 text-sm font-black text-rose-100 hover:bg-rose-500/10">Bağlantıyı Kaldır</button>}
        </div>
        {pendingLeave===key&&<div role="group" aria-label={`${nickname} sınıftan ayrılsın mı?`} className="mt-3 rounded-xl border border-rose-300/35 bg-rose-950/40 p-3">
         <p className="text-sm leading-relaxed"><strong>{nickname}</strong>, {x.school_name} · {x.class_name} sınıfından ayrılsın mı? Öğretmen artık görev özetini görmez; oyun ilerlemesi silinmez. Yeniden katılmak için öğretmenden yeni bir davet kodu gerekir.</p>
         <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={()=>{setPendingLeave('');void run(async()=>{await leaveClassroom(x.profile_id,x.classroom_id);},`${nickname} sınıftan ayrıldı.`);}}
           className="min-h-11 rounded-xl bg-rose-600 px-4 text-sm font-black text-white disabled:opacity-45">Evet, ayrılsın</button>
          <button type="button" onClick={()=>setPendingLeave('')} className={secondary}>Vazgeç</button>
         </div>
        </div>}
       </li>;})}</ul>}
     </section>
    </div>}
   </div>}
  </main>
 </div>;
}
