'use client';

import {useCallback,useEffect,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {getSupabaseClient} from '@/lib/supabase/client';
import {getProgressRepository} from '@/lib/progress';
import {linkLocalSchoolCandidate,localSchoolCandidates,type LocalSchoolCandidate} from '@/lib/school/parentProfileBridge';
import {enrollChild,leaveClassroom,normaliseInviteCode,parentLinkedChildren,parentMemberships,previewInvite,schoolApiVersion,
 type InvitePreview,type LinkedChild,type ParentMembership,type SchoolApiVersion} from '@/lib/school/schoolService';
import {TEACHER_NEVER_SEES,activity,formatDay,istanbulDay,skillProgress,teacherSees} from '@/lib/school/schoolInsights';
import {friendlyAccountError} from '@/lib/profile/profileHub';
import {AvatarPortrait} from '@/components/profile/AvatarPortrait';
import {ConfirmBox,LoadProblem,LoadingBlocks,SkillBars,Initial,card,dangerOutline,eyebrow,field,primary,type SchoolAct} from './schoolUi';

type Data={version:SchoolApiVersion;children:LinkedChild[];memberships:ParentMembership[];
 candidates:LocalSchoolCandidate[];adultId:string;avatars:Record<string,string>};
type Preview={code:string;state:'loading'|'ok'|'invalid'|'error';info?:InvitePreview};

function ChildFace({id,nickname,avatar}:{id:string;nickname:string;avatar?:string}){
 return avatar?<span aria-hidden="true" className="block h-11 w-11 shrink-0 overflow-hidden rounded-2xl"><AvatarPortrait id={avatar} size={44}/></span>
  :<Initial id={id} nickname={nickname}/>;
}

type Props={email:string;act:SchoolAct;busy:boolean;invite:string;fromLink:boolean;onInviteUsed:()=>void};

export function ParentWorkspace({email,act,busy,invite,fromLink,onInviteUsed}:Props){
 const [data,setData]=useState<Data|null>(null);
 const [loadError,setLoadError]=useState('');
 const [pendingLink,setPendingLink]=useState<LocalSchoolCandidate|null>(null);
 const [chosenChild,setChosenChild]=useState('');
 const [inviteCode,setInviteCode]=useState(invite);
 const [preview,setPreview]=useState<Preview|null>(null);
 const [pendingLeave,setPendingLeave]=useState('');
 useEffect(()=>{if(invite)setInviteCode(invite);},[invite]);

 const load=useCallback(async()=>{
  const client=getSupabaseClient();
  if(!client)throw new Error('Bulut bağlantısı kurulamadı.');
  const version=await schoolApiVersion();
  const [profiles,memberships,local,auth]=await Promise.all([
   parentLinkedChildren(),parentMemberships(version),getProgressRepository().getAllProfiles(),client.auth.getUser()
  ]);
  if(auth.error||!auth.data.user)throw new Error('Yetişkin oturumu bulunamadı.');
  const avatars:Record<string,string>={};
  for(const p of local)if(p.avatarId)avatars[p.id]=p.avatarId;
  for(const p of profiles)if(p.avatar_id&&!avatars[p.id])avatars[p.id]=p.avatar_id;
  setData({version,children:profiles,memberships,avatars,adultId:auth.data.user.id,
   candidates:localSchoolCandidates(local,profiles,auth.data.user.id)});
  setChosenChild(old=>profiles.some(p=>p.id===old)?old:profiles[0]?.id??'');
 },[]);
 const reload=useCallback(async()=>{
  setLoadError('');
  try{await load();}
  catch(error){
   console.warn('[Okul paneli] yükleme',error);
   setLoadError(friendlyAccountError(error,'Okul verileri yüklenemedi. Bağlantınızı kontrol edip yeniden deneyin.',{formal:true}));
  }
 },[load]);
 useEffect(()=>{void reload();},[reload]);

 const typedCode=normaliseInviteCode(inviteCode);
 const typedHex=typedCode.replace(/-/g,'').length;
 const complete=typedCode.length===36;
 const version=data?.version??1;
 // A complete code shows which school and class it opens (nothing is used up).
 useEffect(()=>{
  if(version<2||!complete){setPreview(null);return;}
  let alive=true;
  setPreview({code:typedCode,state:'loading'});
  const timer=window.setTimeout(()=>{
   previewInvite(typedCode)
    .then(info=>{if(alive)setPreview(info?{code:typedCode,state:'ok',info}:{code:typedCode,state:'invalid'});})
    .catch(error=>{console.warn('[Okul paneli] davet önizleme',error);if(alive)setPreview({code:typedCode,state:'error'});});
  },250);
  return()=>{alive=false;window.clearTimeout(timer);};
 },[version,complete,typedCode]);

 if(!data)return loadError?<LoadProblem text={loadError} onRetry={()=>void reload()}/>:<LoadingBlocks label="Çocuk profilleri yükleniyor…"/>;
 const {children,memberships,candidates,avatars}=data;
 const nicknameOf=(id:string)=>children.find(c=>c.id===id)?.nickname??'Çocuk profili';
 const chosen=children.find(c=>c.id===chosenChild);
 const already=preview?.state==='ok'&&Boolean(preview.info?.joinedProfiles.includes(chosenChild));
 const blocked=preview?.state==='invalid'||preview?.state==='loading'||already;
 const today=istanbulDay();
 const join=async(event:FormEvent)=>{
  event.preventDefault();
  const nickname=chosen?.nickname??'Çocuğunuz';
  if(await act(async()=>{await enrollChild(chosenChild,typedCode);},
   `${nickname} sınıfa katıldı. Öğretmen artık İngilizce görev özetini görebilir.`)){
   setInviteCode('');setPreview(null);onInviteUsed();await reload();
  }
 };

 return <div className="mx-auto grid max-w-3xl gap-6">
  {loadError&&<div role="alert" className="rounded-2xl border border-rose-300/45 bg-rose-950/60 p-4 text-sm">{loadError}</div>}
  {fromLink&&invite&&<p role="status" className="rounded-2xl border border-lime-300/40 bg-lime-300/10 p-4 text-sm font-bold leading-relaxed text-lime-50">
   🔗 Öğretmeninizin davet bağlantısıyla geldiniz; kod aşağıya yerleştirildi. Çocuğunuzu seçip onaylamanız yeterli.</p>}

  {candidates.length>0&&<section aria-labelledby="parent-step-1" className={card}>
   <p className={`${eyebrow} text-amber-200`}>Adım 1 · Hesaba bağla</p>
   <h2 id="parent-step-1" className="mt-1 text-xl font-black">Bu cihazdaki çocuk profili</h2>
   <p className="mt-2 text-sm leading-relaxed text-slate-300">Sınıfa katılmak için çocuğun profili hesabınıza bağlı olmalı. Bağlarken oyun ilerlemesi korunur.</p>
   <ul className="mt-4 space-y-2">{candidates.map(profile=><li key={profile.id} className="rounded-2xl border border-white/12 bg-white/[.05] p-3">
    <div className="flex flex-wrap items-center gap-3">
     <ChildFace id={profile.id} nickname={profile.nickname} avatar={avatars[profile.id]}/>
     <div className="min-w-0 flex-1"><strong className="text-sm">{profile.nickname}</strong>
      <p className="mt-0.5 text-xs text-slate-300">{profile.gradeLevel?`${profile.gradeLevel}. sınıf · `:''}{profile.status==='unlinked'?'Yalnızca bu cihazda':'Bulut eşitlemesi gerekiyor'}</p></div>
     {pendingLink?.id!==profile.id&&<button type="button" disabled={busy} onClick={()=>setPendingLink(profile)}
      className="min-h-11 rounded-xl bg-amber-200 px-4 text-sm font-black text-slate-950 disabled:opacity-45">
      {profile.status==='unlinked'?'Hesabıma Bağla':'Buluta Eşitle'}</button>}
    </div>
    {pendingLink?.id===profile.id&&<ConfirmBox label="Bağlamayı onayla" tone="amber" confirm="Onaylıyorum" busy={busy}
     onCancel={()=>setPendingLink(null)}
     onConfirm={()=>{setPendingLink(null);void act(async()=>{await linkLocalSchoolCandidate(profile.id,data.adultId);await load();},
      `${profile.nickname} hesabınıza bağlandı. Şimdi sınıfa katılabilir.`);}}>
     “{profile.nickname}” profili <strong className="break-all">{email}</strong> hesabına {profile.status==='unlinked'?'kalıcı olarak bağlanacak':'eşitlenecek'}. Öğrenme kayıtları silinmez; başka bir yetişkin hesabına aktarılamaz.
    </ConfirmBox>}
   </li>)}</ul>
  </section>}

  <form aria-labelledby="parent-step-2" onSubmit={join} className={card}>
   <p className={`${eyebrow} text-lime-200`}>{candidates.length>0?'Adım 2':'Adım 1'} · Sınıfa katıl</p>
   <h2 id="parent-step-2" className="mt-1 text-xl font-black">Öğretmenin davet kodu</h2>
   {children.length===0?<p role="status" className="mt-3 rounded-2xl border border-sky-300/30 bg-sky-950/40 p-4 text-sm leading-relaxed text-slate-200">
    Bu hesapta bağlı çocuk profili yok. {candidates.length>0?'Önce yukarıdan profili hesabınıza bağlayın.':
    <>Profil başka bir cihazdaysa, o cihazda <Link href="/progress" className="font-bold text-sky-200 underline">Aile Paneli → Yedekleme</Link> ile bu hesaba bağlayın.</>}
   </p>:<>
    <fieldset className="mt-4">
     <legend className="text-sm font-bold">Hangi çocuğunuz katılacak?</legend>
     <div className="mt-2 grid gap-2 sm:grid-cols-2">
      {children.map(child=><label key={child.id} className="block cursor-pointer">
       <input type="radio" name="school-child" value={child.id} checked={chosenChild===child.id}
        onChange={()=>setChosenChild(child.id)} className="peer sr-only"/>
       <span className="flex min-h-[68px] items-center gap-3 rounded-2xl border border-white/15 bg-white/[.04] p-3 transition hover:bg-white/10 peer-checked:border-lime-300/80 peer-checked:bg-lime-300/15 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lime-300">
        <ChildFace id={child.id} nickname={child.nickname} avatar={avatars[child.id]}/>
        <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{child.nickname}</strong>
         <span className="block text-xs text-slate-300">{child.grade_level?`${child.grade_level}. sınıf`:'Sınıf seçilmedi'}</span></span>
        {chosenChild===child.id&&<span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-300 text-sm font-black text-emerald-950">✓</span>}
       </span>
      </label>)}
     </div>
    </fieldset>
    <label className="mt-5 block text-sm font-bold">Davet kodu
     <input required value={inviteCode} onChange={e=>setInviteCode(normaliseInviteCode(e.target.value))}
      autoComplete="off" autoCapitalize="off" spellCheck={false} aria-describedby="invite-code-help"
      placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" className={`${field} font-mono text-sm uppercase`}/>
    </label>
    <p id="invite-code-help" className={`mt-2 text-xs leading-relaxed ${complete?'font-bold text-lime-200':'text-sky-200'}`}>
     {!typedCode?'Öğretmenin gönderdiği bağlantıyı açın ya da kodu yapıştırın; büyük-küçük harf, boşluk ve tireler önemli değil. E-postanıza gelen giriş kodu bu değildir.':
      complete?'✓ Kod tamam.':typedHex>32?'Kod fazla uzun görünüyor; yalnızca öğretmenin verdiği kodu yapıştırın.':
      `Kod eksik görünüyor: ${typedHex}/32 harf ve rakam.`}
    </p>
    {preview&&<div role="status" aria-live="polite" className="mt-4">
     {preview.state==='loading'&&<p className="rounded-2xl border border-white/12 bg-white/[.04] p-4 text-sm text-slate-200">Kod kontrol ediliyor…</p>}
     {preview.state==='invalid'&&<p className="rounded-2xl border border-rose-300/45 bg-rose-950/50 p-4 text-sm leading-relaxed">
      ⚠️ Bu kod geçersiz, süresi dolmuş ya da kullanım sınırına ulaşmış. Öğretmeninizden yeni bir davet isteyin.</p>}
     {preview.state==='error'&&<p className="rounded-2xl border border-amber-200/40 bg-amber-950/30 p-4 text-sm leading-relaxed">
      Kod şu an kontrol edilemedi. Yine de katılmayı deneyebilirsiniz.</p>}
     {preview.state==='ok'&&preview.info&&<div className="rounded-2xl border border-lime-300/35 bg-lime-300/[.07] p-4">
      <p className={`${eyebrow} text-lime-200`}>Bu kod şu sınıfı açıyor</p>
      <p className="mt-1 break-words text-lg font-black">🏫 {preview.info.schoolName} · {preview.info.className}</p>
      <p className="mt-0.5 text-sm text-slate-200">{preview.info.gradeLevel}. sınıf düzeyi{preview.info.validUntil?` · Son geçerlilik: ${formatDay(preview.info.validUntil)}`:''}</p>
      {preview.info.verified?<p className="mt-2 text-sm font-bold text-lime-100">✓ Doğrulanmış kurum</p>:
       <p className="mt-2 rounded-xl border border-amber-200/40 bg-amber-950/30 p-3 text-xs leading-relaxed text-amber-50">Bu okul alanı henüz kurum tarafından doğrulanmadı. Daveti tanıdığınız öğretmenden aldıysanız katılabilirsiniz.</p>}
      {already&&<p className="mt-2 text-sm font-black text-lime-100">✓ {chosen?.nickname} bu sınıfa zaten bağlı.</p>}
     </div>}
    </div>}
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
     <div className="rounded-2xl border border-lime-300/25 bg-lime-300/[.06] p-4">
      <p className="text-xs font-black uppercase tracking-[.14em] text-lime-200">Öğretmenin göreceği</p>
      <ul className="mt-2 space-y-1.5 text-sm leading-snug">{teacherSees(version).map(item=><li key={item} className="flex gap-2"><span aria-hidden="true" className="text-lime-200">✓</span>{item}</li>)}</ul>
     </div>
     <div className="rounded-2xl border border-white/12 bg-white/[.03] p-4">
      <p className="text-xs font-black uppercase tracking-[.14em] text-slate-300">Hiçbir zaman paylaşılmaz</p>
      <ul className="mt-2 space-y-1.5 text-sm leading-snug text-slate-200">{TEACHER_NEVER_SEES.map(item=><li key={item} className="flex gap-2"><span aria-hidden="true" className="text-rose-200">✕</span>{item}</li>)}</ul>
     </div>
    </div>
    <button disabled={!chosenChild||typedCode.length!==36||busy||blocked} className={`${primary} mt-5 w-full sm:w-auto`}>Çocuğumun Sınıfa Katılmasını Onaylıyorum</button>
    <p className="mt-3 text-xs leading-relaxed text-slate-300">Bağlantıyı istediğiniz zaman aşağıdan kaldırabilirsiniz.</p>
   </>}
  </form>

  <section aria-labelledby="parent-joined" className={card}>
   <h2 id="parent-joined" className="text-xl font-black">Bağlı sınıflar</h2>
   {memberships.length===0?<p className="mt-2 text-sm text-slate-300">Henüz sınıfa bağlı çocuk yok.</p>:
   <ul className="mt-4 space-y-3">{memberships.map(m=>{
    const key=`${m.classroomId}:${m.profileId}`;
    const nickname=nicknameOf(m.profileId);
    const seen=activity(m.lastPlayedOn,today);
    return <li key={key} className={`rounded-2xl border p-3 sm:p-4 ${pendingLeave===key?'border-rose-300/45 bg-rose-950/30':'border-white/12 bg-white/[.05]'}`}>
     <div className="flex flex-wrap items-center gap-3">
      <ChildFace id={m.profileId} nickname={nickname} avatar={avatars[m.profileId]}/>
      <div className="min-w-0 flex-1">
       <p className="break-words text-sm font-black">{m.schoolName} · {m.className}</p>
       <p className="mt-0.5 text-xs text-slate-300">{nickname}{m.joinedAt?` · Katıldı: ${formatDay(m.joinedAt)}`:''}{m.verified===false?' · Doğrulanmamış okul alanı':''}</p>
      </div>
      {pendingLeave!==key&&<button type="button" disabled={busy} onClick={()=>setPendingLeave(key)} className={dangerOutline}>Bağlantıyı Kaldır</button>}
     </div>
     {version>=2&&<div className="mt-3 rounded-xl border border-white/10 bg-[#0b1d35]/60 p-3">
      <p className="text-xs font-black uppercase tracking-[.14em] text-sky-200">Öğretmenin gördüğü</p>
      <p className="mt-1 text-sm leading-relaxed"><strong>{nickname}</strong> · {m.completedLevels} görev · ⭐ {m.stars} · {seen.tone==='none'?seen.label:`Son görev: ${seen.label}`} · Son 7 gün: {m.levels7d??0} görev</p>
      <div className="mt-3"><SkillBars skills={skillProgress(m.worlds)} compact/></div>
     </div>}
     {pendingLeave===key&&<ConfirmBox label={`${nickname} sınıftan ayrılsın mı?`} confirm="Evet, ayrılsın" busy={busy}
      onCancel={()=>setPendingLeave('')}
      onConfirm={()=>{setPendingLeave('');void act(async()=>{await leaveClassroom(m.profileId,m.classroomId);await load();},`${nickname} sınıftan ayrıldı.`);}}>
      <strong>{nickname}</strong>, {m.schoolName} · {m.className} sınıfından ayrılsın mı? Öğretmen artık görev özetini görmez; oyun ilerlemesi silinmez. Yeniden katılmak için öğretmenden geçerli bir davet kodu gerekir.
     </ConfirmBox>}
    </li>;
   })}</ul>}
  </section>
 </div>;
}
