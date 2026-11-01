'use client';

import {useCallback,useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {getSupabaseClient,isSupabaseConfigured} from '@/lib/supabase/client';
import {sendAdultOtpEmail,verifyAdultOtp,signOutAdult} from '@/lib/supabase/auth';
import {getProgressRepository} from '@/lib/progress';
import {linkLocalSchoolCandidate,localSchoolCandidates,type LocalSchoolCandidate} from '@/lib/school/parentProfileBridge';
import {
 schoolDashboard,createSchool,createClassroom,issueClassInvite,teacherRoster,
 parentLinkedChildren,enrollChild,parentClassrooms,leaveClassroom,
 type VentraSchool,type VentraClassroom,type TeacherRosterEntry,type ParentClassroom,type LinkedChild
} from '@/lib/school/schoolService';

type Mode='teacher'|'parent';
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
 const [newSchool,setNewSchool]=useState('');
 const [brand,setBrand]=useState('#2563eb');
 const [newClass,setNewClass]=useState('');
 const [grade,setGrade]=useState(3);
 const [issuedInvite,setIssuedInvite]=useState('');
 const [children,setChildren]=useState<LinkedChild[]>([]);
 const [localCandidates,setLocalCandidates]=useState<LocalSchoolCandidate[]>([]);
 const [adultUserId,setAdultUserId]=useState('');
 const [chosenChild,setChosenChild]=useState('');
 const [inviteCode,setInviteCode]=useState('');
 const [joined,setJoined]=useState<ParentClassroom[]>([]);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const refresh=useCallback(async(nextMode:Mode)=>{
   if(nextMode==='teacher'){
     const result=await schoolDashboard();
     setSchools(result.schools);setClasses(result.classes);
     const hasClass=result.classes.some(c=>c.id===activeClass);
     setActiveClass(hasClass?activeClass:result.classes[0]?.id??'');
   }else{
     const client=getSupabaseClient();
     if(!client)throw new Error('Supabase bağlantısı yok.');
     const [profiles,memberships,local,auth]=await Promise.all([
       parentLinkedChildren(),parentClassrooms(),getProgressRepository().getAllProfiles(),client.auth.getUser()
     ]);
     if(auth.error||!auth.data.user)throw new Error('Yetişkin oturumu bulunamadı.');
     setAdultUserId(auth.data.user.id);
     setLocalCandidates(localSchoolCandidates(local,profiles,auth.data.user.id));
     setChildren(profiles);setJoined(memberships);
     setChosenChild(old=>profiles.some(p=>p.id===old)?old:profiles[0]?.id??'');
   }
 },[activeClass]);
 useEffect(()=>{
   let alive=true;
   const initialize=async()=>{
     if(!isSupabaseConfigured()){if(alive){setError('Bu bölüm için Supabase yapılandırılması gerekiyor.');setLoading(false);}return;}
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
   refresh(mode).catch(e=>{if(alive)setError(e instanceof Error?e.message:'Okul verileri yüklenemedi.');})
     .finally(()=>{if(alive)setLoading(false);});
   return()=>{alive=false;};
 },[signedIn,mode,refresh]);

 const run=async(action:()=>Promise<void>,success:string)=>{
   if(busy)return;
   setBusy(true);setError('');setNotice('');
   try{await action();setNotice(success);await refresh(mode);}
   catch(e){setError(e instanceof Error?e.message:'İşlem tamamlanamadı.');}
   finally{setBusy(false);}
 };
 const login=async(event:FormEvent)=>{
   event.preventDefault();
   await run(async()=>{
     if(!otpSent){
       const res=await sendAdultOtpEmail(email);
       if(!res.success)throw new Error(res.error);
       setOtpSent(true);
     }else{
       const res=await verifyAdultOtp(email,code);
       if(!res.success)throw new Error(res.error);
       setSignedIn(true);
     }
   },otpSent?'Yetişkin hesabına giriş yapıldı.':'E-postana giriş kodu gönderildi.');
 };
 const activeSchool=schools[0];
 const currentClass=classes.find(c=>c.id===activeClass);
 return <main className="min-h-screen bg-gradient-to-b from-[#09152c] via-[#142b4d] to-[#071e35] px-3 pb-20 pt-5 text-white sm:px-8">
   <div className="mx-auto max-w-6xl">
     <header className="flex flex-wrap items-center justify-between gap-3">
       <Link href="/kids" className="min-h-11 rounded-xl border border-slate-400/40 bg-slate-900/60 px-4 py-3 text-sm font-bold hover:bg-slate-800">← Ventra Kids</Link>
       <span className="rounded-full border border-cyan-300/40 bg-cyan-900/35 px-3 py-2 text-xs font-extrabold text-cyan-100">VENTRA · OKUL YÖNETİMİ</span>
     </header>
     <div className="mx-auto max-w-3xl py-8 text-center">
       <div className="text-6xl" aria-hidden="true">🏫</div>
       <h1 className="mt-3 text-3xl font-black sm:text-5xl">Okulumla Oyna</h1>
       <p className="mt-3 text-sm leading-relaxed text-sky-100 sm:text-base">
         Öğretmen sınıfını oluşturur, ebeveyn davet koduyla çocuğunu bağlar.
         Çocuk takma adları ve yalnızca özet öğrenme ilerlemesi sınıf panelinde görüntülenir.
       </p>
     </div>
     <nav aria-label="Okul portalı görünümü" className="mx-auto mb-5 grid max-w-xl grid-cols-2 gap-2">
       {([{id:'teacher',label:'👩‍🏫 Öğretmen Paneli'},{id:'parent',label:'🛡️ Ebeveyn Katılımı'}] as const).map(item=>
         <button key={item.id} aria-pressed={mode===item.id} onClick={()=>{setMode(item.id);setError('');setNotice('');}}
           className={`min-h-14 rounded-xl border p-3 text-sm font-bold ${mode===item.id?'border-lime-300 bg-emerald-700/65':'border-sky-300/30 bg-slate-900/70'}`}>{item.label}</button>)}
     </nav>
     {error&&<div role="alert" className="mx-auto mb-5 max-w-3xl rounded-xl border border-rose-300/50 bg-rose-950/65 p-4 text-sm">{error}</div>}
     {notice&&<div role="status" className="mx-auto mb-5 max-w-3xl rounded-xl border border-lime-300/50 bg-emerald-950/65 p-4 text-sm">{notice}</div>}
     {loading?<p role="status" className="p-10 text-center font-semibold text-sky-100">Okul hesabı yükleniyor…</p>:
     !signedIn?<form onSubmit={login} className="mx-auto max-w-md rounded-3xl border border-white/20 bg-slate-900/80 p-6 shadow-2xl">
       <h2 className="text-xl font-black">Yetişkin Hesabıyla Giriş</h2>
       <p className="mt-2 text-sm text-slate-300">Öğretmen veya ebeveyn e-posta doğrulaması gerekir. Çocuktan e-posta istenmez.</p>
       <label className="mt-5 block text-sm font-bold">E-posta
         <input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}
           disabled={otpSent||busy} className="mt-2 min-h-12 w-full rounded-xl border border-white/30 bg-slate-800 px-4 text-white"/>
       </label>
       {otpSent&&<label className="mt-4 block text-sm font-bold">Doğrulama kodu
         <input inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={e=>setCode(e.target.value)}
           className="mt-2 min-h-12 w-full rounded-xl border border-white/30 bg-slate-800 px-4 text-white"/>
       </label>}
       <button disabled={busy} className="mt-5 min-h-12 w-full rounded-xl bg-lime-300 px-5 font-black text-slate-950 disabled:opacity-50">
         {busy?'İşleniyor…':otpSent?'Doğrula ve Gir':'Giriş Kodu Gönder'}
       </button>
       {otpSent&&<button type="button" onClick={()=>{setOtpSent(false);setCode('');}}
         className="mt-3 min-h-11 w-full text-xs font-bold text-cyan-200">Başka e-posta kullan</button>}
     </form>:
     <div className="space-y-5">
       <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-300/25 bg-slate-900/60 p-3">
         <span className="text-sm text-sky-100">Yetişkin hesabı: <strong>{email}</strong></span>
         <button disabled={busy} onClick={()=>{if(busy)return;setBusy(true);setError('');
           void signOutAdult().then(()=>{
             setSignedIn(false);setSchools([]);setChildren([]);setLocalCandidates([]);setAdultUserId('');setClasses([]);setRoster([]);setIssuedInvite('');
             setOtpSent(false);setCode('');setNotice('Oturum kapatıldı.');
           }).catch(e=>setError(e instanceof Error?e.message:'Çıkış yapılamadı.'))
             .finally(()=>setBusy(false));
         }}
           className="min-h-11 rounded-xl border border-white/25 bg-slate-800 px-4 text-xs font-bold">Çıkış Yap</button>
       </div>
       {mode==='teacher'?<>
         {!activeSchool?<form onSubmit={e=>{e.preventDefault();void run(async()=>{await createSchool(newSchool,brand);},'Okul çalışma alanı oluşturuldu.');}}
           className="mx-auto max-w-xl rounded-3xl border border-sky-200/25 bg-slate-900/70 p-6">
           <h2 className="text-xl font-black">Okul çalışma alanı oluştur</h2>
           <p className="mt-2 text-sm text-slate-300">Bu kayıt okul doğrulaması değildir. Kurum kimliği ve lisanslama P6'nın sonraki kabul kapısıdır.</p>
           <label className="mt-5 block text-sm font-semibold">Okul adı
             <input minLength={3} maxLength={90} required value={newSchool} onChange={e=>setNewSchool(e.target.value)}
               placeholder="Örnek: Ventra Eğitim Merkezi" className="mt-2 min-h-12 w-full rounded-xl border border-white/30 bg-slate-800 px-3"/>
           </label>
           <label className="mt-4 flex items-center gap-4 text-sm font-semibold">Marka rengi
             <input aria-label="Okul marka rengi" type="color" value={brand} onChange={e=>setBrand(e.target.value)}
               className="h-12 w-24 rounded-lg border border-white/20 bg-transparent"/>
           </label>
           <button disabled={busy} className="mt-5 min-h-12 rounded-xl bg-lime-300 px-6 font-black text-slate-950 disabled:opacity-40">Okulu Oluştur</button>
         </form>:<>
           <section className="rounded-3xl border border-sky-300/30 bg-slate-900/75 p-5 sm:p-7">
             <div className="flex flex-wrap items-center gap-3">
               <span className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
                 style={{background:activeSchool.brand_color}}>🏫</span>
               <div className="flex-1"><h2 className="text-2xl font-black">{activeSchool.name}</h2>
                 <p className="text-xs text-slate-300">{activeSchool.verified_at?'Doğrulanmış kurum':'Doğrulanmamış okul çalışma alanı'}</p></div>
               <span className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black">{classes.length} sınıf</span>
             </div>
             <form onSubmit={e=>{e.preventDefault();void run(async()=>{await createClassroom(activeSchool.id,newClass,grade);setNewClass('');},'Sınıf oluşturuldu.');}}
               className="mt-6 grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-[1fr_140px_auto]">
               <label className="text-xs font-semibold text-sky-100">Yeni sınıf adı
                 <input required minLength={2} maxLength={60} value={newClass} onChange={e=>setNewClass(e.target.value)}
                   placeholder="Örnek: 3-A" className="mt-2 min-h-12 w-full rounded-xl border border-white/30 bg-slate-800 px-3 text-base text-white"/>
               </label>
               <label className="text-xs font-semibold text-sky-100">Sınıf düzeyi
                 <select value={grade} onChange={e=>setGrade(Number(e.target.value))}
                   className="mt-2 min-h-12 w-full rounded-xl border border-white/30 bg-slate-800 px-3 text-base text-white">
                   {Array.from({length:8},(_,i)=><option key={i} value={i+1}>{i+1}. sınıf</option>)}
                 </select>
               </label>
               <button disabled={busy} className="self-end min-h-12 rounded-xl bg-lime-300 px-4 text-sm font-black text-slate-950 disabled:opacity-40">+ Sınıf Ekle</button>
             </form>
           </section>
           {classes.length>0&&<section className="grid gap-4 lg:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)]">
             <nav aria-label="Sınıflar" className="space-y-2 rounded-3xl border border-white/20 bg-slate-900/65 p-4">
               <h3 className="mb-3 font-black">📚 Sınıflarım</h3>
               {classes.map(c=><button key={c.id} onClick={()=>{setActiveClass(c.id);setRoster([]);setIssuedInvite('');}}
                 aria-pressed={activeClass===c.id}
                 className={`flex min-h-14 w-full items-center justify-between rounded-xl border px-4 text-left text-sm font-bold
                   ${activeClass===c.id?'border-lime-300 bg-emerald-700/60':'border-white/20 bg-slate-800/75'}`}>
                 <span>{c.name}</span><span className="text-xs text-cyan-100">{c.grade_level}. sınıf</span>
               </button>)}
             </nav>
             <div className="rounded-3xl border border-white/20 bg-slate-900/65 p-5">
               <h3 className="text-xl font-black">🎒 {currentClass?.name??'Sınıf seç'}</h3>
               <p className="mt-2 text-xs leading-relaxed text-slate-300">Katılım kodunu ebeveyne özel ilet. Öğrenci, kendi yetişkin hesabından bağlanır.</p>
               <div className="mt-5 flex flex-wrap gap-3">
                 <button disabled={!activeClass||busy}
                   onClick={()=>void run(async()=>{setIssuedInvite(await issueClassInvite(activeClass));},'7 gün geçerli, en fazla 30 kullanımlık davet oluşturuldu.')}
                   className="min-h-12 rounded-xl bg-lime-300 px-4 text-sm font-black text-slate-950 disabled:opacity-40">🔑 Davet Kodu Üret</button>
                 <button disabled={!activeClass||busy}
                   onClick={()=>void run(async()=>{setRoster(await teacherRoster(activeClass));},'Sınıf listesi yenilendi.')}
                   className="min-h-12 rounded-xl border border-white/25 bg-sky-900/60 px-4 text-sm font-bold disabled:opacity-40">↻ Öğrencileri Gör</button>
               </div>
               {issuedInvite&&<div className="mt-4 break-all rounded-xl border border-cyan-300/35 bg-[#082a47] p-4">
                 <p className="mb-2 text-xs text-cyan-100">Davet kodu (yalnızca burada gösterilir)</p>
                 <code className="text-sm font-bold">{issuedInvite}</code>
                 <button onClick={()=>void navigator.clipboard?.writeText(issuedInvite)}
                   className="mt-2 block min-h-11 rounded-lg bg-sky-300 px-4 text-xs font-black text-slate-950">Kopyala</button>
               </div>}
               <h4 className="mt-6 font-bold">Öğrenci ilerleme özeti</h4>
               <div className="mt-3 overflow-x-auto rounded-xl border border-white/20">
                 <table className="min-w-full text-left text-xs sm:text-sm">
                   <thead className="bg-slate-700/50 text-slate-200"><tr><th className="px-3 py-3">Takma ad</th><th className="px-3 py-3">Sınıf</th>
                     <th className="px-3 py-3">Görev</th><th className="px-3 py-3">Yıldız</th></tr></thead>
                   <tbody>{roster.map(x=><tr key={x.profile_id} className="border-t border-white/10">
                     <td className="px-3 py-3 font-bold">{x.nickname}</td><td className="px-3 py-3">{x.grade_level??'—'}</td>
                     <td className="px-3 py-3">{x.completed_levels}</td><td className="px-3 py-3">⭐ {x.stars}</td></tr>)}
                   </tbody>
                 </table>
                 {!roster.length&&<p className="px-3 py-5 text-center text-xs text-slate-300">Kayıtlı öğrenci henüz yok veya sınıf listesi yüklenmedi.</p>}
               </div>
             </div>
           </section>}
         </>}
       </>:<section className="mx-auto max-w-3xl rounded-3xl border border-white/20 bg-slate-900/70 p-5 sm:p-7">
         <h2 className="text-xl font-black">🛡️ Çocuğumu Sınıfa Bağla</h2>
         <p className="mt-2 text-sm leading-relaxed text-slate-300">
           Ebeveyn olarak öğretmenin verdiği davet kodunu kullan. Yalnızca bu hesabına bulutta bağlı olan çocuklar seçilebilir.
           Katılımı daha sonra kaldırabilirsin. Öğretmen gerçek isim veya e-posta yerine takma adı ve özet ilerlemeyi görür.
         </p>
         {localCandidates.length>0&&<div className="mt-5 rounded-2xl border border-amber-300/45 bg-amber-950/25 p-4">
           <h3 className="text-base font-black text-amber-100">☁️ Cihazdaki Çocuk Profilini Aileye Bağla</h3>
           <p className="mt-2 text-sm leading-relaxed text-amber-50/90">
             Bu tarayıcıdaki profiller henüz yetişkin hesabının bulut listesinde görünmüyor.
             Mevcut oyun ilerlemesi korunarak aile hesabına bağlanabilir.
           </p>
           <div className="mt-3 space-y-2">
             {localCandidates.map(profile=><div key={profile.id}
               className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-slate-900/75 p-3">
               <div>
                 <strong className="text-sm">{profile.nickname}</strong>
                 <p className="mt-1 text-xs text-slate-300">
                   {profile.gradeLevel?`${profile.gradeLevel}. sınıf · `:''}
                   {profile.status==='unlinked'?'Yalnızca bu cihazda':'Bulut eşitlemesi gerekiyor'}
                 </p>
               </div>
               <button type="button" disabled={busy}
                 onClick={()=>{
                   const verb=profile.status==='unlinked'?'kalıcı olarak bağlamak':'bulutla eşitlemek';
                   if(!window.confirm(
                     `"${profile.nickname}" profilini ${email} hesabına ${verb} istiyor musun? `+
                     'Öğrenme kayıtları silinmez; farklı yetişkin hesabına aktarma desteklenmez.'
                   ))return;
                   void run(async()=>{await linkLocalSchoolCandidate(profile.id,adultUserId);},
                     `${profile.nickname} aile hesabına bağlandı. Şimdi sınıfa katılabilir.`);
                 }}
                 className="min-h-11 rounded-xl bg-amber-200 px-4 text-xs font-black text-slate-950 disabled:opacity-40">
                 {profile.status==='unlinked'?'Aileye Bağla':'Buluta Eşitle'}
               </button>
             </div>)}
           </div>
         </div>}
         {children.length===0&&<div role="status" className="mt-5 rounded-2xl border border-sky-300/30 bg-sky-950/45 p-4">
           <p className="text-sm font-extrabold text-sky-100">Bu yetişkin hesabında bağlı çocuk bulunamadı</p>
           <p className="mt-2 text-sm leading-relaxed text-slate-200">
             Yukarıda mevcut profilin görünüyorsa önce <strong>Aileye Bağla</strong> düğmesini kullan.
             Hiç görünmüyorsa başka Chrome profilinde veya cihazda oluşturmuş olabilirsin.
             O cihazdaki <strong>Ebeveyn &amp; Bulut</strong> alanından aynı yetişkin hesabına bağla ve bu sayfayı yenile.
           </p>
           <Link href="/kids" className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-sky-300/40 bg-sky-900/70 px-4 text-xs font-bold">
             🎮 Çocuk profillerine git
           </Link>
         </div>}
         <form onSubmit={e=>{e.preventDefault();void run(async()=>{
           await enrollChild(chosenChild,inviteCode);setInviteCode('');
         },'Çocuk sınıfa bağlandı.');}} className="mt-5 space-y-4">
           <label className="block text-sm font-bold">Bağlı çocuk profili
             <select required value={chosenChild} onChange={e=>setChosenChild(e.target.value)}
               className="mt-2 min-h-12 w-full rounded-xl border border-white/30 bg-slate-800 px-3 text-white">
               {children.length===0&&<option value="">Bu yetişkin hesabında bulut profili yok</option>}
               {children.map(c=><option key={c.id} value={c.id}>{c.nickname} {c.grade_level?`(${c.grade_level}. sınıf)`:''}</option>)}
             </select>
           </label>
           <label className="block text-sm font-bold">Öğretmenin gönderdiği davet kodu
             <input required value={inviteCode} onChange={e=>setInviteCode(e.target.value)}
               minLength={36} maxLength={36} pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
               title="Öğretmen panelindeki 36 karakterli sınıf davet kodunu kullan."
               autoComplete="off" placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
               className="mt-2 min-h-12 w-full rounded-xl border border-white/30 bg-slate-800 px-3 font-mono text-sm text-white"/>
           </label>
           <p className="-mt-2 text-xs text-sky-200">Sınıf daveti 36 karakterli UUID kodudur; e-postaya gelen giriş kodunu kullanma.</p>
           <button disabled={!children.length||!chosenChild||busy}
             className="min-h-12 rounded-xl bg-lime-300 px-5 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">
             Çocuğumun Sınıfa Katılmasını Onaylıyorum
           </button>
         </form>
         <h3 className="mt-7 font-bold">Bağlı Sınıflar</h3>
         <div className="mt-3 space-y-2">
           {joined.length===0&&<p className="text-sm text-slate-300">Henüz sınıfa bağlı çocuk yok.</p>}
           {joined.map(x=><div key={`${x.classroom_id}:${x.profile_id}`}
             className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/20 bg-slate-800/75 p-3">
             <div className="text-sm font-bold">{x.school_name} · {x.class_name}
               <span className="block text-xs font-normal text-slate-300">{children.find(c=>c.id===x.profile_id)?.nickname??'Çocuk profili'}</span>
             </div>
             <button disabled={busy} className="min-h-11 rounded-xl border border-rose-300/50 px-3 text-xs font-black text-rose-100"
               onClick={()=>void run(async()=>{await leaveClassroom(x.profile_id,x.classroom_id);},'Sınıf bağlantısı kaldırıldı.')}>Bağlantıyı Kaldır</button>
           </div>)}
         </div>
       </section>}
     </div>}
     <footer className="mx-auto mt-9 max-w-3xl text-center text-xs leading-relaxed text-slate-300">
       Okul hesapları başlangıçta doğrulanmamıştır. Kişisel çocuk verileri doğrudan paylaşılmaz; sınıfa katılım yetişkin onayı gerektirir.
       İki cihaz ve gerçek Supabase güvenlik kabulü tamamlanmadan kurumsal yayına açılmamalıdır.
     </footer>
   </div>
 </main>;
}
