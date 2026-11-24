'use client';

import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {Capacitor} from '@capacitor/core';
import {acceptStaffInvite,assignTeacher,cancelStaffInvite,declineStaffInvite,inviteStaff,isEmailAddress,pendingStaffInvites,
 removeStaff,setMyDisplayName,setStaffRole,unassignTeacher,type ClassOverview,type MyStaffInvite,type SchoolMembership,
 type StaffInvite,type StaffMember,type StaffRole} from '@/lib/school/schoolService';
import {ROLE_INFO,formatDay,inviteBaseUrl,staffInviteMessage,staffLabel} from '@/lib/school/schoolInsights';
import {ConfirmBox,Initial,card,copyText,dangerOutline,eyebrow,field,primary,secondary,type SchoolAct} from './schoolUi';

const NAME_HELP='Bu okulun öğretmenleri ve sınıf kodunu alan veliler sizi bu adla görür.';

/** Role badge in the words people use. */
export function RoleBadge({role}:{role:StaffRole}){
 return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${role==='owner'
  ?'border-violet-300/50 bg-violet-400/15 text-violet-100':'border-sky-300/40 bg-sky-400/10 text-sky-100'}`}>
  <span aria-hidden="true">{ROLE_INFO[role].icon}</span>{ROLE_INFO[role].label}</span>;
}

function RoleChoice({value,onChange,name}:{value:StaffRole;onChange:(role:StaffRole)=>void;name:string}){
 return <fieldset className="mt-4">
  <legend className="text-sm font-bold">Rolü</legend>
  <div className="mt-2 grid gap-2 sm:grid-cols-2">
   {(['teacher','owner'] as const).map(role=><label key={role} className="block cursor-pointer">
    <input type="radio" name={name} value={role} checked={value===role} onChange={()=>onChange(role)} className="peer sr-only"/>
    <span className="flex min-h-[72px] flex-col justify-center rounded-xl border border-white/15 bg-white/[.04] px-3 py-2 transition hover:bg-white/10 peer-checked:border-lime-300/80 peer-checked:bg-lime-300/15 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lime-300">
     <span className="text-sm font-black"><span aria-hidden="true">{ROLE_INFO[role].icon}</span> {ROLE_INFO[role].label}</span>
     <span className="mt-0.5 text-xs leading-snug text-sky-100/80">{ROLE_INFO[role].can}</span>
    </span>
   </label>)}
  </div>
 </fieldset>;
}

function ClassChoice({classes,chosen,onChange,legend}:{classes:ClassOverview[];chosen:string[];onChange:(ids:string[])=>void;legend:string}){
 if(!classes.length)return <p className="mt-4 text-xs text-slate-300">Okulda henüz sınıf yok; öğretmen kendi sınıfını açabilir.</p>;
 return <fieldset className="mt-4">
  <legend className="text-sm font-bold">{legend}</legend>
  <div className="mt-2 flex flex-wrap gap-2">
   {classes.map(c=><label key={c.id} className="cursor-pointer">
    <input type="checkbox" checked={chosen.includes(c.id)} className="peer sr-only"
     onChange={e=>onChange(e.target.checked?[...chosen,c.id]:chosen.filter(id=>id!==c.id))}/>
    <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/[.04] px-3 text-sm font-bold transition hover:bg-white/10 peer-checked:border-lime-300/80 peer-checked:bg-lime-300/15 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-lime-300">
     <span aria-hidden="true">{chosen.includes(c.id)?'☑':'☐'}</span>{c.name}<span className="text-xs font-normal text-slate-300">{c.grade_level}. sınıf</span>
    </span>
   </label>)}
  </div>
 </fieldset>;
}

/** Ask for a name once: it is how colleagues and parents recognise you. */
export function MyNameForm({school,current,act,busy,onSaved,compact=false}:{school:SchoolMembership;current:string|null;act:SchoolAct;busy:boolean;
 onSaved:()=>Promise<void>;compact?:boolean}){
 const [name,setName]=useState(current??'');
 const [editing,setEditing]=useState(!current);
 useEffect(()=>{setName(current??'');setEditing(!current);},[current]);
 const save=async(event:FormEvent)=>{
  event.preventDefault();
  if(await act(async()=>{await setMyDisplayName(school.id,name);},'Adınız kaydedildi.'))await onSaved();
 };
 if(!editing)return <div className="flex flex-wrap items-center justify-between gap-3">
  <p className="text-sm">Adınız: <strong>{current}</strong></p>
  <button type="button" onClick={()=>setEditing(true)} className={secondary}>✏️ Değiştir</button>
 </div>;
 return <form onSubmit={save} className={compact?'flex flex-wrap items-end gap-3':''}>
  <label className={`block text-sm font-bold ${compact?'min-w-[14rem] flex-1':''}`}>Adınız
   <input required minLength={2} maxLength={60} value={name} onChange={e=>setName(e.target.value)} autoComplete="name"
    placeholder="Örnek: Ayşe Yılmaz" aria-describedby={`name-help-${school.id}`} className={field}/>
  </label>
  <div className={`flex flex-wrap gap-2 ${compact?'':'mt-3'}`}>
   <button disabled={busy||name.trim().length<2} className={primary}>Kaydet</button>
   {current&&<button type="button" onClick={()=>{setName(current);setEditing(false);}} className={secondary}>Vazgeç</button>}
  </div>
  <p id={`name-help-${school.id}`} className={`text-xs leading-relaxed text-slate-300 ${compact?'w-full':'mt-2'}`}>{NAME_HELP}</p>
 </form>;
}

/** Invitations waiting for this adult: accept with a name, or decline. */
export function MyStaffInvites({invites,act,busy,onAccepted,onDeclined}:{invites:MyStaffInvite[];act:SchoolAct;busy:boolean;
 onAccepted:(schoolId:string)=>Promise<void>;onDeclined:()=>Promise<void>}){
 const [names,setNames]=useState<Record<string,string>>({});
 const [declining,setDeclining]=useState('');
 if(!invites.length)return null;
 return <section aria-labelledby="my-staff-invites" className="space-y-3">
  <h2 id="my-staff-invites" className="text-lg font-black">📨 Okul davetleriniz</h2>
  {invites.map(invite=>{
   const name=names[invite.id]??'';
   return <article key={invite.id} aria-label={`${invite.schoolName} daveti`}
    className="relative overflow-hidden rounded-[2rem] border border-lime-300/40 bg-gradient-to-br from-[#16324a] to-[#122640] p-5 sm:p-6">
    <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5" style={{background:invite.brandColor}}/>
    <div className="flex flex-wrap items-center gap-4">
     <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-lg" style={{background:invite.brandColor}}>🏫</span>
     <div className="min-w-[12rem] flex-1">
      <p className="text-lg font-black leading-snug"><span className="break-words">{invite.schoolName}</span> sizi {ROLE_INFO[invite.role].label.toLocaleLowerCase('tr-TR')} olarak davet ediyor</p>
      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-200">
       <RoleBadge role={invite.role}/>
       {!invite.verified&&<span className="rounded-full border border-amber-200/45 bg-amber-300/10 px-2.5 py-0.5 font-bold text-amber-100">Doğrulanmamış okul alanı</span>}
       {invite.invitedByName&&<span>Davet eden: <strong>{invite.invitedByName}</strong></span>}
       <span>Son geçerlilik: {formatDay(invite.validUntil)}</span>
      </p>
     </div>
    </div>
    <p className="mt-3 text-sm text-sky-50/90">{invite.classNames.length?<>Sınıflarınız: <strong>{invite.classNames.join(', ')}</strong></>:
     'Henüz bir sınıfa atanmadınız; kabul edince kendi sınıfınızı açabilir ya da yöneticiden atama isteyebilirsiniz.'}</p>
    <form onSubmit={async event=>{event.preventDefault();
      let schoolId='';
      if(await act(async()=>{schoolId=await acceptStaffInvite(invite.id,name);},`${invite.schoolName} okul alanına katıldınız.`))await onAccepted(schoolId);}}
     className="mt-4 flex flex-wrap items-end gap-3">
     <label className="block min-w-[14rem] flex-1 text-sm font-bold">Adınız
      <input required minLength={2} maxLength={60} value={name} autoComplete="name" placeholder="Örnek: Ayşe Yılmaz"
       onChange={e=>setNames(old=>({...old,[invite.id]:e.target.value}))} aria-describedby={`invite-name-${invite.id}`} className={field}/>
     </label>
     <div className="flex flex-wrap gap-2">
      <button disabled={busy||name.trim().length<2} className={primary}>✓ Kabul Et</button>
      {declining!==invite.id&&<button type="button" disabled={busy} onClick={()=>setDeclining(invite.id)} className={secondary}>Reddet</button>}
     </div>
     <p id={`invite-name-${invite.id}`} className="w-full text-xs leading-relaxed text-slate-300">{NAME_HELP}</p>
    </form>
    {declining===invite.id&&<ConfirmBox label="Davet reddedilsin mi?" confirm="Evet, reddet" busy={busy} onCancel={()=>setDeclining('')}
     onConfirm={()=>{setDeclining('');void act(async()=>{await declineStaffInvite(invite.id);await onDeclined();},'Davet reddedildi.');}}>
     {invite.schoolName} davetini reddederseniz okula katılmazsınız. Yönetici sizi yeniden davet edebilir.
    </ConfirmBox>}
   </article>;
  })}
 </section>;
}

type TeamProps={school:SchoolMembership;staff:StaffMember[];classes:ClassOverview[];act:SchoolAct;busy:boolean;onChanged:()=>Promise<void>};

/**
 * Öğretmenler: who works in this school, in which role and classes. Owners
 * invite colleagues by e-mail, change roles and classes, and remove people;
 * everyone can set their name and leave. At least one owner always stays.
 */
export function TeamPanel({school,staff,classes,act,busy,onChanged}:TeamProps){
 const owner=school.role==='owner';
 const me=staff.find(s=>s.isMe)??null;
 const owners=staff.filter(s=>s.role==='owner').length;
 const className=(id:string)=>classes.find(c=>c.id===id)?.name;
 const [pending,setPending]=useState<StaffInvite[]|null>(null);
 const [email,setEmail]=useState('');
 const [role,setRole]=useState<StaffRole>('teacher');
 const [chosen,setChosen]=useState<string[]>([]);
 const [sent,setSent]=useState<{email:string;role:StaffRole;validUntil:string}|null>(null);
 const [feedback,setFeedback]=useState('');
 const [base,setBase]=useState<string|null>(null);
 const [touchShare,setTouchShare]=useState(false);
 const [editing,setEditing]=useState('');
 const [editClasses,setEditClasses]=useState<string[]>([]);
 const [removing,setRemoving]=useState('');
 useEffect(()=>{
  setBase(inviteBaseUrl(process.env.NEXT_PUBLIC_SITE_URL,window.location.origin,Capacitor.isNativePlatform()));
  setTouchShare(typeof navigator.share==='function'&&window.matchMedia?.('(pointer: coarse)').matches===true);
 },[]);
 const loadPending=useCallback(async()=>{
  if(!owner)return;
  try{setPending(await pendingStaffInvites(school.id));}
  catch(error){console.warn('[Okul paneli] öğretmen davetleri',error);setPending(null);}
 },[owner,school.id]);
 useEffect(()=>{void loadPending();},[loadPending]);

 const address=email.trim().toLowerCase();
 const already=staff.some(s=>s.email&&s.email.toLowerCase()===address);
 const valid=isEmailAddress(email);
 const invite=async(event:FormEvent)=>{
  event.preventDefault();
  if(!valid||already)return;
  await act(async()=>{
   const result=await inviteStaff(school.id,address,role,chosen);
   setSent({email:address,role,validUntil:result.validUntil});setFeedback('');
   setEmail('');setChosen([]);setRole('teacher');
   await loadPending();
  },'Öğretmen daveti hazır. Mesajı gönderin; davet, o e-postayla giriş yapınca görünür.');
 };
 const message=sent?staffInviteMessage({schoolName:school.name,email:sent.email,role:sent.role,link:base,validUntil:sent.validUntil,inviter:me?.displayName??null}):'';
 const send=async()=>{
  setFeedback('');
  if(touchShare){
   try{await navigator.share({title:`${school.name} öğretmen daveti`,text:message});setFeedback('✓ Paylaşım ekranı açıldı.');return;}
   catch(error){if((error as {name?:string})?.name==='AbortError')return;}
  }
  setFeedback(await copyText(message)?'✓ Davet mesajı kopyalandı.':'Bu tarayıcı kopyalamaya izin vermedi; mesajı aşağıdan seçip kopyalayın.');
 };
 const saveClasses=(member:StaffMember)=>void act(async()=>{
  const add=editClasses.filter(id=>!member.classroomIds.includes(id));
  const drop=member.classroomIds.filter(id=>!editClasses.includes(id));
  for(const id of add)await assignTeacher(id,member.userId);
  for(const id of drop)await unassignTeacher(id,member.userId);
  setEditing('');await onChanged();
 },`${staffLabel(member)} için sınıflar kaydedildi.`);

 return <div className="grid gap-6">
  <section aria-labelledby="team-me" className={card}>
   <h3 id="team-me" className="text-lg font-black">Sizin bilgileriniz</h3>
   <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-200">
    <RoleBadge role={school.role}/>{me?.email&&<span className="break-all">{me.email}</span>}</div>
   <div className="mt-4"><MyNameForm school={school} current={me?.displayName??null} act={act} busy={busy} onSaved={onChanged}/></div>
  </section>

  <section aria-label="Roller" className="grid gap-3 sm:grid-cols-2">
   {(['owner','teacher'] as const).map(r=><div key={r} className="rounded-2xl border border-white/12 bg-white/[.04] p-4">
    <RoleBadge role={r}/><p className="mt-2 text-sm leading-relaxed text-slate-200">{ROLE_INFO[r].can}</p>
    {r==='teacher'&&<p className="mt-1 text-xs leading-relaxed text-slate-300">Başka sınıfların öğrencilerini göremez.</p>}
    {r==='owner'&&<p className="mt-1 text-xs leading-relaxed text-slate-300">Okulda her zaman en az bir yönetici kalır.</p>}
   </div>)}
  </section>

  {owner&&<section aria-labelledby="team-invite" className={card}>
   <p className={`${eyebrow} text-lime-200`}>E-postayla davet</p>
   <h3 id="team-invite" className="mt-1 text-lg font-black">Öğretmen davet edin</h3>
   {!sent?<form onSubmit={invite} aria-label="Öğretmen daveti">
    <p className="mt-1 text-sm leading-relaxed text-slate-300">Davet yalnızca bu e-postayla giriş yapan kişiye görünür; kod paylaşmanız gerekmez.</p>
    <label className="mt-4 block text-sm font-bold">Öğretmenin e-postası
     <input type="email" inputMode="email" autoComplete="off" required value={email} onChange={e=>setEmail(e.target.value)}
      placeholder="ogretmen@okul.k12.tr" aria-invalid={Boolean(email)&&(!valid||already)} aria-describedby="team-email-help" className={field}/>
    </label>
    <p id="team-email-help" className={`mt-2 text-xs ${already?'font-bold text-amber-100':'text-slate-300'}`}>
     {already?'Bu kişi zaten okulunuzda.':'Öğretmenin Ventra\'ya gireceği adresi yazın.'}</p>
    <RoleChoice value={role} onChange={setRole} name="team-role"/>
    {role==='teacher'&&<ClassChoice classes={classes} chosen={chosen} onChange={setChosen} legend="Hangi sınıfları görsün?"/>}
    <button disabled={busy||!valid||already} className={`${primary} mt-5`}>📨 Davet Et</button>
   </form>:<div className="mt-3">
    <p className="text-sm font-bold text-lime-100">✓ {sent.email} davet edildi · Son geçerlilik: {formatDay(sent.validUntil)}</p>
    <p className="mt-1 text-sm leading-relaxed text-slate-200">Davet, öğretmen Okul Paneli'ne bu e-postayla girdiğinde görünür. İsterseniz aşağıdaki mesajı ona gönderin.</p>
    <p className="mt-3 select-all whitespace-pre-wrap rounded-xl border border-white/12 bg-[#0b1d35] p-3 text-sm leading-relaxed text-sky-50 [overflow-wrap:anywhere]">{message}</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
     <button type="button" onClick={()=>void send()} className={primary}>{touchShare?'📤 Mesajı Gönder':'📋 Mesajı Kopyala'}</button>
     <a href={`mailto:${encodeURIComponent(sent.email)}?subject=${encodeURIComponent(`${school.name} · Ventra Okul Paneli daveti`)}&body=${encodeURIComponent(message)}`}
      className={secondary}>✉️ E-postayla Gönder</a>
    </div>
    <p role="status" className="mt-2 min-h-5 text-xs font-bold text-lime-100">{feedback}</p>
    <button type="button" onClick={()=>{setSent(null);setFeedback('');}} className={`${secondary} mt-2`}>＋ Başka bir öğretmen davet et</button>
   </div>}
   {pending&&pending.length>0&&<div className="mt-5 border-t border-white/12 pt-4">
    <h4 className="text-sm font-black">Bekleyen davetler</h4>
    <ul className="mt-2 space-y-2">{pending.map(p=><li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/12 bg-white/[.04] p-3">
     <span className="min-w-0 text-sm"><strong className="break-all">{p.email}</strong>
      <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300"><RoleBadge role={p.role}/>
       {p.classNames.length?<span>{p.classNames.join(', ')}</span>:null}<span>Son geçerlilik: {formatDay(p.validUntil)}</span></span></span>
     <button type="button" disabled={busy} onClick={()=>void act(async()=>{await cancelStaffInvite(p.id);await loadPending();},`${p.email} daveti geri alındı.`)}
      className={dangerOutline}>Geri Al</button>
    </li>)}</ul>
   </div>}
  </section>}

  <section aria-labelledby="team-list" className={card}>
   <div className="flex flex-wrap items-center justify-between gap-2">
    <h3 id="team-list" className="text-lg font-black">Okulun öğretmenleri <span className="ml-1 rounded-full bg-white/10 px-2.5 py-0.5 align-middle text-xs font-bold">{staff.length}</span></h3>
   </div>
   <ul className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/12 bg-white/[.03]">
    {staff.map(member=>{
     const label=staffLabel(member);
     const lastOwner=member.role==='owner'&&owners<=1;
     const memberClasses=member.classroomIds.map(className).filter((n):n is string=>Boolean(n));
     return <li key={member.userId} className="px-3 py-3 sm:px-4">
      <div className="flex flex-wrap items-center gap-3">
       <Initial id={member.userId} nickname={label}/>
       <div className="min-w-[12rem] flex-1">
        <p className="text-sm font-black">{label}{member.isMe&&<span className="ml-2 rounded-full bg-lime-300/20 px-2 py-0.5 text-xs text-lime-100">siz</span>}
         {!member.displayName&&<span className="ml-2 text-xs font-normal text-amber-100">(ad eklenmedi)</span>}</p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300">
         <RoleBadge role={member.role}/>
         {member.email&&<span className="break-all">{member.email}</span>}
         {member.joinedAt&&<span>Katıldı: {formatDay(member.joinedAt)}</span>}
        </p>
        <p className="mt-1.5 text-xs text-sky-100/85">{member.role==='owner'?'Bütün sınıflar':memberClasses.length?`Sınıflar: ${memberClasses.join(', ')}`:'Henüz sınıfı yok'}</p>
       </div>
       {owner&&!member.isMe&&<div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor={`role-${member.userId}`}>{label} rolü</label>
        <select id={`role-${member.userId}`} value={member.role} disabled={busy||lastOwner}
         onChange={e=>{const next=e.target.value as StaffRole;void act(async()=>{await setStaffRole(school.id,member.userId,next);await onChanged();},
          `${label} artık ${ROLE_INFO[next].label.toLocaleLowerCase('tr-TR')}.`);}}
         className="min-h-11 rounded-xl border border-white/25 bg-[#0b1d35] px-3 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300">
         <option value="teacher">Öğretmen</option><option value="owner">Yönetici</option>
        </select>
        {member.role==='teacher'&&<button type="button" aria-expanded={editing===member.userId}
         onClick={()=>{setEditing(editing===member.userId?'':member.userId);setEditClasses(member.classroomIds);setRemoving('');}} className={secondary}>Sınıflar</button>}
        {removing!==member.userId&&<button type="button" disabled={busy||lastOwner} onClick={()=>{setRemoving(member.userId);setEditing('');}} className={dangerOutline}>Okuldan Çıkar</button>}
       </div>}
       {member.isMe&&removing!==member.userId&&<button type="button" disabled={busy||lastOwner} onClick={()=>setRemoving(member.userId)} className={dangerOutline}>Okuldan Ayrıl</button>}
      </div>
      {member.isMe&&lastOwner&&<p className="mt-2 text-xs leading-relaxed text-amber-100">Okulun tek yöneticisi sizsiniz. Ayrılmadan önce başka bir öğretmeni yönetici yapın.</p>}
      {member.isMe&&member.isHolder&&<p className="mt-2 text-xs leading-relaxed text-slate-300">Okul alanı sizin hesabınıza bağlı: hesabınızı silerseniz okul alanı da silinir. Okuldan ayrılırsanız alan, en eski yöneticiye geçer.</p>}
      {editing===member.userId&&<div className="mt-3 rounded-xl border border-white/12 bg-[#0b1d35]/60 p-3">
       <ClassChoice classes={classes} chosen={editClasses} onChange={setEditClasses} legend={`${label} hangi sınıfları görsün?`}/>
       <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={()=>saveClasses(member)} className={primary}>Kaydet</button>
        <button type="button" onClick={()=>setEditing('')} className={secondary}>Vazgeç</button>
       </div>
      </div>}
      {removing===member.userId&&<ConfirmBox label={member.isMe?'Okuldan ayrılmak istiyor musunuz?':`${label} okuldan çıkarılsın mı?`}
       confirm={member.isMe?'Evet, ayrıl':'Evet, okuldan çıkar'} busy={busy} onCancel={()=>setRemoving('')}
       onConfirm={()=>{setRemoving('');void act(async()=>{await removeStaff(school.id,member.userId);await onChanged();},
        member.isMe?`${school.name} okul alanından ayrıldınız.`:`${label} okuldan çıkarıldı.`);}}>
       {member.isMe?<>{school.name} sınıflarına erişiminiz hemen kapanır. Yeniden katılmak için bir yöneticinin sizi davet etmesi gerekir.</>:
        <><strong>{label}</strong> okuldan çıkarılsın mı? Sınıflarına erişimi hemen kapanır. Açtığı sınıflar, öğrenciler ve veli davetleri okulda kalır.</>}
      </ConfirmBox>}
     </li>;
    })}
   </ul>
  </section>
 </div>;
}
