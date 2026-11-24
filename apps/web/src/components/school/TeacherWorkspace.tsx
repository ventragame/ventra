'use client';

import {useCallback,useEffect,useRef,useState,type FormEvent,type KeyboardEvent} from 'react';
import {assignTeacher,classOverview,classStudents,createClassroom,createSchool,deleteClassroom,myStaffInvites,mySchools,
 schoolApiVersion,schoolClasses,schoolClassrooms,staffList,unassignTeacher,updateClassroom,updateSchool,
 type ClassOverview,type IssuedInvite,type MyStaffInvite,type RosterStudent,type SchoolApiVersion,type SchoolMembership,
 type StaffMember,type VentraSchool} from '@/lib/school/schoolService';
import {ROLE_INFO,SCHOOL_COLORS,staffLabel} from '@/lib/school/schoolInsights';
import {friendlyAccountError} from '@/lib/profile/profileHub';
import {ClassSkillsCard,ClassStats,RosterList} from './ClassRoster';
import {InvitePanel} from './InvitePanel';
import {MyNameForm,MyStaffInvites,RoleBadge,TeamPanel} from './TeamPanel';
import {ConfirmBox,Initial,LoadProblem,LoadingBlocks,card,dangerOutline,eyebrow,field,primary,secondary,type SchoolAct} from './schoolUi';

const ISSUED_KEY='ventra:school:issued';
const CLASS_KEY='ventra:school:class';
const CODE=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Codes shown in this tab survive a reload until they expire (never past
 * the tab: sessionStorage), and are forgotten on sign-out. */
function readIssued():Record<string,IssuedInvite>{
 try{
  const raw=JSON.parse(window.sessionStorage.getItem(ISSUED_KEY)??'{}') as Record<string,IssuedInvite>;
  const out:Record<string,IssuedInvite>={};
  for(const [classId,invite] of Object.entries(raw??{})){
   if(invite&&CODE.test(invite.code)&&Date.parse(invite.validUntil)>Date.now()&&Number.isInteger(invite.useLimit))out[classId]=invite;
  }
  return out;
 }catch{return {};}
}
function writeIssued(value:Record<string,IssuedInvite>){
 try{window.sessionStorage.setItem(ISSUED_KEY,JSON.stringify(value));}catch{/* this visit only */}
}
export function forgetIssuedInvites(){
 try{window.sessionStorage.removeItem(ISSUED_KEY);}catch{/* nothing stored */}
}
const sameName=(a:string,b:string)=>a.trim().replace(/\s+/g,' ').toLocaleLowerCase('tr-TR')===b.trim().replace(/\s+/g,' ').toLocaleLowerCase('tr-TR');

const SCHOOL_KEY='ventra:school:school';
type Data={version:SchoolApiVersion;schools:SchoolMembership[];invites:MyStaffInvite[];school:SchoolMembership|null;
 classes:ClassOverview[];staff:StaffMember[]|null};
type Tab='classes'|'team';

export function TeacherWorkspace({act,busy}:{act:SchoolAct;busy:boolean}){
 const [data,setData]=useState<Data|null>(null);
 const [loadError,setLoadError]=useState('');
 const [activeId,setActiveId]=useState('');
 const [issued,setIssued]=useState<Record<string,IssuedInvite>>({});
 const [tab,setTab]=useState<Tab>('classes');
 const tabs=useRef<(HTMLButtonElement|null)[]>([]);

 const load=useCallback(async(preferred?:string)=>{
  const version=await schoolApiVersion();
  const [schools,invites]=await Promise.all([mySchools(version),version>=3?myStaffInvites():Promise.resolve([] as MyStaffInvite[])]);
  let wanted=preferred??'';
  if(!wanted){try{wanted=window.localStorage.getItem(SCHOOL_KEY)??'';}catch{/* none */}}
  const school=schools.find(s=>s.id===wanted)??schools[0]??null;
  let classes:ClassOverview[]=[];let staff:StaffMember[]|null=null;
  if(school&&version>=3)[classes,staff]=await Promise.all([schoolClasses(school.id),staffList(school.id)]);
  else if(school&&version>=2)classes=await classOverview(school.id);
  else if(school)classes=(await schoolClassrooms(school.id)).map(c=>({...c,student_count:null,active_invites:null}));
  setData({version,schools,invites,school,classes,staff});
  setActiveId(old=>{
   let remembered=old;
   if(!remembered){try{remembered=window.localStorage.getItem(CLASS_KEY)??'';}catch{/* none */}}
   const mine=classes.filter(c=>c.mine!==false);
   return classes.some(c=>c.id===remembered)?remembered:(mine[0]??classes[0])?.id??'';
  });
 },[]);
 const reload=useCallback(async(preferred?:string)=>{
  setLoadError('');
  try{await load(preferred);}
  catch(error){
   console.warn('[Okul paneli] yükleme',error);
   setLoadError(friendlyAccountError(error,'Okul verileri yüklenemedi. Bağlantınızı kontrol edip yeniden deneyin.',{formal:true}));
  }
 },[load]);
 useEffect(()=>{setIssued(readIssued());void reload();},[reload]);
 const switchSchool=async(id:string)=>{
  try{window.localStorage.setItem(SCHOOL_KEY,id);}catch{/* this visit only */}
  setActiveId('');setTab('classes');
  await reload(id);
 };

 const choose=(id:string)=>{
  setActiveId(id);
  try{window.localStorage.setItem(CLASS_KEY,id);}catch{/* remembered for this visit */}
 };
 const remember=(classId:string,invite:IssuedInvite|null)=>{
  setIssued(old=>{
   const next={...old};
   if(invite)next[classId]=invite;else delete next[classId];
   writeIssued(next);
   return next;
  });
 };

 if(!data)return loadError?<LoadProblem text={loadError} onRetry={()=>void reload()}/>:<LoadingBlocks label="Okul bilgileri yükleniyor…"/>;
 const invites=<MyStaffInvites invites={data.invites} act={act} busy={busy}
  onAccepted={id=>switchSchool(id)} onDeclined={()=>reload(data.school?.id)}/>;
 if(!data.school)return <div className="space-y-8">
  {invites}
  <CreateSchool act={act} busy={busy} onCreated={()=>reload()} alternative={data.invites.length>0}/>
 </div>;
 const school=data.school;
 const current=data.classes.find(c=>c.id===activeId)??null;
 const team=data.version>=3&&data.staff;
 const me=data.staff?.find(s=>s.isMe)??null;
 const refresh=()=>reload(school.id);
 const tabList:{id:Tab;label:string;count:number}[]=[{id:'classes',label:'📚 Sınıflar',count:data.classes.length},
  {id:'team',label:'👩‍🏫 Öğretmenler',count:data.staff?.length??0}];
 const moveTab=(event:KeyboardEvent<HTMLButtonElement>,index:number)=>{
  const step:Record<string,number>={ArrowRight:1,ArrowLeft:-1};
  let next=-1;
  if(event.key in step)next=(index+step[event.key]+tabList.length)%tabList.length;
  else if(event.key==='Home')next=0;else if(event.key==='End')next=tabList.length-1;
  if(next<0)return;
  event.preventDefault();setTab(tabList[next].id);tabs.current[next]?.focus();
 };
 const classesView=data.classes.length===0?<FirstClass school={school} act={act} busy={busy} teacher={school.role==='teacher'}
   onCreated={async id=>{choose(id);await refresh();}}/>:
  <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(230px,290px)_minmax(0,1fr)]">
   <ClassNav school={school} classes={data.classes} activeId={activeId} onChoose={choose} act={act} busy={busy}
    staff={data.staff} onCreated={async id=>{choose(id);await refresh();}}/>
   {current&&<ClassDetail key={current.id} school={school} klass={current} classes={data.classes} version={data.version}
    staff={data.staff} issued={issued[current.id]??null} onIssued={invite=>remember(current.id,invite)}
    act={act} busy={busy} onChanged={refresh}
    onDeleted={async()=>{remember(current.id,null);setActiveId('');await refresh();}}/>}
  </div>;
 return <div className="space-y-6">
  {loadError&&<div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-300/45 bg-rose-950/60 p-4 text-sm">
   {loadError}<button type="button" onClick={()=>void refresh()} className={secondary}>↻ Yeniden dene</button></div>}
  {invites}
  {data.schools.length>1&&<label className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/12 bg-white/[.04] px-4 py-3 text-sm font-bold">
   <span>🏫 Okul</span>
   <select value={school.id} onChange={e=>void switchSchool(e.target.value)}
    className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/25 bg-[#0b1d35] px-3 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300">
    {data.schools.map(s=><option key={s.id} value={s.id}>{s.name} · {ROLE_INFO[s.role].label}</option>)}
   </select>
  </label>}
  {team&&me&&!me.displayName&&<section aria-label="Adınızı ekleyin" className="rounded-2xl border border-amber-200/40 bg-amber-950/25 p-4 sm:p-5">
   <p className="mb-3 text-sm font-black">👋 Adınızı ekleyin</p>
   <MyNameForm school={school} current={null} act={act} busy={busy} onSaved={refresh} compact/>
  </section>}
  <SchoolBanner school={school} classes={data.classes} version={data.version} staffCount={data.staff?.length??null} act={act} busy={busy} onSaved={refresh}/>
  {team?<>
   <div role="tablist" aria-label="Okul bölümleri" className="grid grid-cols-2 gap-1 rounded-2xl border border-white/12 bg-[#06101f]/70 p-1 sm:inline-grid">
    {tabList.map((item,index)=>{const on=tab===item.id;
     return <button key={item.id} ref={el=>{tabs.current[index]=el;}} type="button" role="tab" id={`school-tab-${item.id}`}
      aria-selected={on} aria-controls={`school-panel-${item.id}`} tabIndex={on?0:-1} onClick={()=>setTab(item.id)} onKeyDown={e=>moveTab(e,index)}
      className={`flex min-h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300 sm:gap-2 sm:px-4 ${on?'bg-lime-300 text-emerald-950 shadow':'text-sky-100 hover:bg-white/10'}`}>
      {item.label}<span className={`rounded-full px-2 py-0.5 text-xs ${on?'bg-emerald-950/15':'bg-white/10'}`}>{item.count}</span>
     </button>;})}
   </div>
   <div role="tabpanel" id="school-panel-classes" aria-labelledby="school-tab-classes" hidden={tab!=='classes'}>{tab==='classes'&&classesView}</div>
   <div role="tabpanel" id="school-panel-team" aria-labelledby="school-tab-team" hidden={tab!=='team'}>
    {tab==='team'&&data.staff&&<TeamPanel school={school} staff={data.staff} classes={data.classes} act={act} busy={busy} onChanged={refresh}/>}
   </div>
  </>:classesView}
 </div>;
}

function ColorChoice({value,onChange,name}:{value:string;onChange:(hex:string)=>void;name:string}){
 const custom=!SCHOOL_COLORS.some(c=>c.hex===value);
 return <fieldset className="mt-4">
  <legend className="text-sm font-bold">Okul rengi</legend>
  <div className="mt-2 flex flex-wrap items-center gap-2">
   {SCHOOL_COLORS.map(color=><label key={color.hex} className="cursor-pointer">
    <input type="radio" name={name} value={color.hex} checked={value===color.hex} onChange={()=>onChange(color.hex)}
     aria-label={color.name} className="peer sr-only"/>
    <span aria-hidden="true" className="block h-11 w-11 rounded-full border-2 border-white/20 shadow-inner transition peer-checked:scale-105 peer-checked:border-white peer-checked:ring-4 peer-checked:ring-white/30 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-lime-300"
     style={{background:color.hex}}/>
   </label>)}
   <label className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-bold ${custom?'border-white bg-white/10':'border-white/20'}`}>
    <input type="color" value={value} onChange={e=>onChange(e.target.value)} aria-label="Özel okul rengi"
     className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"/>Özel
   </label>
  </div>
 </fieldset>;
}

function CreateSchool({act,busy,onCreated,alternative=false}:{act:SchoolAct;busy:boolean;onCreated:()=>Promise<void>;alternative?:boolean}){
 const [name,setName]=useState('');
 const [brand,setBrand]=useState<string>(SCHOOL_COLORS[0].hex);
 const submit=async(event:FormEvent)=>{
  event.preventDefault();
  if(await act(async()=>{await createSchool(name,brand);},'Okul alanınız hazır. Şimdi ilk sınıfınızı ekleyin.'))await onCreated();
 };
 return <div className="mx-auto grid max-w-4xl items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
  <form onSubmit={submit} className={card}>
   <p className={`${eyebrow} text-violet-200`}>{alternative?'Ya da kendi okul alanınızı açın':'Adım 1 / 4'}</p>
   <h2 className="mt-1 text-xl font-black sm:text-2xl">Okul alanınızı oluşturun</h2>
   <p className="mt-2 text-sm leading-relaxed text-slate-300">Sınıflarınız ve davetleriniz bu alanda durur. Kurum doğrulaması yapılana kadar alan “doğrulanmamış” etiketiyle görünür; veliler bunu katılmadan önce görür.</p>
   <p className="mt-2 text-sm leading-relaxed text-slate-300">Okulunuzda Ventra kullanan bir öğretmen varsa yeni alan açmak yerine onun sizi “Öğretmenler” bölümünden davet etmesini isteyin; böylece aynı okulda birlikte çalışırsınız.</p>
   <label className="mt-5 block text-sm font-bold">Okul adı
    <input minLength={3} maxLength={90} required value={name} onChange={e=>setName(e.target.value)} placeholder="Örnek: Martı İlkokulu" className={field}/>
   </label>
   <ColorChoice value={brand} onChange={setBrand} name="new-school-color"/>
   <button disabled={busy||name.trim().length<3} className={`${primary} mt-6 w-full sm:w-auto`}>Okul Alanını Oluştur</button>
  </form>
  <aside aria-label="Önizleme ve sonraki adımlar" className={`${card} !p-5`}>
   <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-[#0b1d35] p-3">
    <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-lg" style={{background:brand}}>🏫</span>
    <span className="min-w-0"><span className="block truncate font-black">{name.trim()||'Okulunuzun adı'}</span>
     <span className="block text-xs text-slate-300">Doğrulanmamış okul alanı</span></span>
   </div>
   <ol className="mt-5 space-y-3 text-sm">
    {[['Okul alanı','Adı ve rengi'],['Sınıf','Örneğin 3-A'],['Davet','Bağlantı, mesaj ya da QR kod'],['Öğrenciler','Veli onay verdikçe görünür']].map(([title,sub],i)=>
     <li key={title} className="flex items-start gap-3">
      <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${i===0?'bg-lime-300 text-emerald-950':'bg-white/10 text-sky-100'}`}>{i+1}</span>
      <span><strong className="block">{title}</strong><span className="text-xs text-slate-300">{sub}</span></span>
     </li>)}
   </ol>
  </aside>
 </div>;
}

function SchoolBanner({school,classes,version,staffCount,act,busy,onSaved}:{school:SchoolMembership;classes:ClassOverview[];version:SchoolApiVersion;
 staffCount:number|null;act:SchoolAct;busy:boolean;onSaved:()=>Promise<void>}){
 const [editing,setEditing]=useState(false);
 const [name,setName]=useState(school.name);
 const [brand,setBrand]=useState(school.brand_color);
 const students=classes.every(c=>c.student_count!=null)?classes.reduce((n,c)=>n+(c.student_count??0),0):null;
 const renamesVerified=Boolean(school.verified_at)&&!sameName(name,school.name);
 const save=async(event:FormEvent)=>{
  event.preventDefault();
  if(await act(async()=>{await updateSchool(school.id,name,brand);},'Okul bilgileri kaydedildi.')){setEditing(false);await onSaved();}
 };
 return <section aria-labelledby="school-name" className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-br from-[#1c2c5c] via-[#14264a] to-[#102a42] p-5 sm:p-7">
  <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5" style={{background:school.brand_color}}/>
  <div className="flex flex-wrap items-center gap-4">
   <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl text-3xl shadow-xl" style={{background:school.brand_color}}>🏫</span>
   <div className="min-w-[12rem] flex-1">
    <h2 id="school-name" className="break-words text-2xl font-black sm:text-3xl">{school.name}</h2>
    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-200">
     <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${school.verified_at?'border-lime-300/50 bg-lime-300/15 text-lime-100':'border-amber-200/45 bg-amber-300/10 text-amber-100'}`}>
      {school.verified_at?'✓ Doğrulanmış kurum':'Doğrulanmamış okul alanı'}</span>
     {version>=3&&<RoleBadge role={school.role}/>}
     <span>{classes.length} sınıf{students!=null?` · ${students} öğrenci`:''}{staffCount?` · ${staffCount} öğretmen`:''}</span>
    </p>
    {version>=3&&school.role==='teacher'&&<p className="mt-2 text-xs text-slate-300">Yalnızca size atanan sınıfları görüyorsunuz.</p>}
   </div>
   {version>=2&&school.role==='owner'&&!editing&&<button type="button" onClick={()=>{setName(school.name);setBrand(school.brand_color);setEditing(true);}} className={secondary}>⚙️ Okulu Düzenle</button>}
  </div>
  {editing&&<form onSubmit={save} aria-label="Okul bilgilerini düzenle" className="mt-5 border-t border-white/12 pt-5">
   <label className="block text-sm font-bold">Okul adı
    <input minLength={3} maxLength={90} required value={name} onChange={e=>setName(e.target.value)} className={field}/>
   </label>
   <ColorChoice value={brand} onChange={setBrand} name="school-color"/>
   {renamesVerified&&<p role="note" className="mt-3 rounded-xl border border-amber-200/40 bg-amber-950/30 p-3 text-sm">Adı değiştirirseniz “doğrulanmış kurum” etiketi kalkar; yeni ad yeniden doğrulanmalıdır.</p>}
   <div className="mt-5 flex flex-wrap gap-2">
    <button disabled={busy||name.trim().length<3} className={primary}>Kaydet</button>
    <button type="button" onClick={()=>setEditing(false)} className={secondary}>Vazgeç</button>
   </div>
  </form>}
 </section>;
}

function ClassFields({name,setName,grade,setGrade,taken,idPrefix}:{name:string;setName:(v:string)=>void;grade:number;setGrade:(v:number)=>void;taken:boolean;idPrefix:string}){
 return <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
  <label className="text-sm font-bold">Sınıf adı
   <input required minLength={2} maxLength={60} value={name} onChange={e=>setName(e.target.value)} placeholder="Örnek: 3-A"
    aria-invalid={taken} aria-describedby={taken?`${idPrefix}-taken`:undefined} className={field}/>
  </label>
  <label className="text-sm font-bold">Sınıf düzeyi
   <select value={grade} onChange={e=>setGrade(Number(e.target.value))} className={field}>
    {Array.from({length:8},(_,i)=><option key={i} value={i+1}>{i+1}. sınıf</option>)}
   </select>
  </label>
  {taken&&<p id={`${idPrefix}-taken`} className="text-sm font-bold text-amber-100 sm:col-span-2">Bu adla bir sınıf zaten var.</p>}
 </div>;
}

function AddClassForm({school,classes,act,busy,onCreated,onCancel}:{school:VentraSchool;classes:ClassOverview[];act:SchoolAct;busy:boolean;
 onCreated:(id:string)=>Promise<void>;onCancel?:()=>void}){
 const [name,setName]=useState('');
 const [grade,setGrade]=useState(3);
 const taken=classes.some(c=>sameName(c.name,name));
 const submit=async(event:FormEvent)=>{
  event.preventDefault();
  if(taken)return;
  let id='';
  if(await act(async()=>{id=await createClassroom(school.id,name,grade);},`${name.trim()} sınıfı eklendi.`)){setName('');await onCreated(id);}
 };
 return <form onSubmit={submit} aria-label="Yeni sınıf" className="space-y-4">
  <ClassFields name={name} setName={setName} grade={grade} setGrade={setGrade} taken={taken} idPrefix="new-class"/>
  <div className="flex flex-wrap gap-2">
   <button disabled={busy||taken||name.trim().length<2} className={primary}>+ Sınıf Ekle</button>
   {onCancel&&<button type="button" onClick={onCancel} className={secondary}>Vazgeç</button>}
  </div>
 </form>;
}

function FirstClass({school,act,busy,onCreated,teacher=false}:{school:VentraSchool;act:SchoolAct;busy:boolean;onCreated:(id:string)=>Promise<void>;teacher?:boolean}){
 return <section aria-labelledby="first-class" className={`${card} mx-auto max-w-2xl`}>
  <p className={`${eyebrow} text-lime-200`}>{teacher?'Sınıflarınız':'Adım 2 / 4'}</p>
  <h3 id="first-class" className="mt-1 text-xl font-black sm:text-2xl">{teacher?'Henüz size atanmış sınıf yok':'İlk sınıfınızı ekleyin'}</h3>
  <p className="mt-2 mb-5 text-sm leading-relaxed text-slate-300">{teacher
   ?'Okul yöneticiniz sizi bir sınıfa atayabilir ya da burada kendi sınıfınızı açabilirsiniz. Açtığınız sınıf size atanır.'
   :'Sınıfı ekleyince velilere davet gönderebilir, katılan öğrencilerin İngilizce görevlerini görebilirsiniz.'}</p>
  <AddClassForm school={school} classes={[]} act={act} busy={busy} onCreated={onCreated}/>
 </section>;
}

/** Teacher names of a class, from the class list or (for owners) the e-mail. */
function teacherNames(klass:ClassOverview,staff:StaffMember[]|null):string[]{
 return (klass.teachers??[]).map(t=>{
  const member=staff?.find(s=>s.userId===t.userId);
  return t.name??(member?staffLabel(member):'Adı eklenmemiş öğretmen');
 });
}

function ClassNav({school,classes,activeId,onChoose,act,busy,onCreated,staff}:{school:SchoolMembership;classes:ClassOverview[];activeId:string;
 onChoose:(id:string)=>void;act:SchoolAct;busy:boolean;onCreated:(id:string)=>Promise<void>;staff:StaffMember[]|null}){
 const [adding,setAdding]=useState(false);
 // Owners see every class: their own first, then the rest of the school.
 const mine=classes.filter(c=>c.mine!==false);
 const others=classes.filter(c=>c.mine===false);
 const groups=others.length?[{title:'Sınıflarım',list:mine},{title:'Okuldaki diğer sınıflar',list:others}]:[{title:'Sınıflarım',list:classes}];
 return <nav aria-label="Sınıflar" className={`${card} min-w-0 !p-4 lg:sticky lg:top-24`}>
  {groups.map((group,g)=><div key={group.title} className={g>0?'mt-5':''}>
   <div className="mb-3 flex items-center justify-between gap-2 px-1">
    <h3 className="text-sm font-black uppercase tracking-[.14em] text-sky-200">{group.title}</h3>
    <span className="text-xs font-bold text-slate-300">{group.list.length}</span>
   </div>
   {group.list.length===0?<p className="px-1 text-xs text-slate-300">Size atanmış sınıf yok.</p>:
   <ul className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
    {group.list.map(c=>{
     const names=teacherNames(c,staff);
     return <li key={c.id} className="shrink-0 snap-start lg:shrink">
      <button type="button" onClick={()=>onChoose(c.id)} aria-pressed={activeId===c.id}
       className={`flex min-h-14 w-full min-w-[9.5rem] items-center justify-between gap-3 rounded-2xl border px-4 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300
        ${activeId===c.id?'border-lime-300/70 bg-lime-300/15':'border-white/12 bg-white/[.04] hover:bg-white/10'}`}>
       <span className="min-w-0"><span className="block truncate text-sm font-black">{c.name}</span>
        <span className="block text-xs font-bold text-sky-100/85">{c.grade_level}. sınıf{c.student_count!=null?` · ${c.student_count} öğrenci`:''}</span>
        {group.title!=='Sınıflarım'&&<span className="block max-w-[14rem] truncate text-xs text-slate-300">{names.length?`👩‍🏫 ${names.join(', ')}`:'Öğretmen atanmadı'}</span>}</span>
       {activeId===c.id&&<span aria-hidden="true" className="text-lime-200">●</span>}
      </button>
     </li>;
    })}
   </ul>}
  </div>)}
  {adding?<div className="mt-4 border-t border-white/12 pt-4">
   <AddClassForm school={school} classes={classes} act={act} busy={busy} onCancel={()=>setAdding(false)}
    onCreated={async id=>{setAdding(false);await onCreated(id);}}/>
  </div>:<button type="button" onClick={()=>setAdding(true)} className={`${secondary} mt-3 w-full`}>+ Yeni Sınıf</button>}
 </nav>;
}

function GettingStarted({invited}:{invited:boolean}){
 const steps=[
  {title:'Davet oluşturun',text:'Süreyi seçip bir davet oluşturun.',done:invited},
  {title:'Velilere gönderin',text:'Mesajı veli grubunuza yapıştırın ya da QR kodu ekranda gösterin.',done:false},
  {title:'Öğrenciler burada',text:'Veli onay verdikçe çocuklar bu listede görünür.',done:false}
 ];
 return <ol aria-label="Sınıfa öğrenci eklemek için" className="grid gap-2 sm:grid-cols-3">
  {steps.map((step,i)=><li key={step.title} className="rounded-2xl border border-white/12 bg-white/[.04] p-3">
   <span aria-hidden="true" className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${step.done?'bg-lime-300 text-emerald-950':'bg-white/10 text-sky-100'}`}>{step.done?'✓':i+1}</span>
   <strong className="mt-2 block text-sm">{step.title}{step.done&&<span className="sr-only"> (tamam)</span>}</strong>
   <span className="mt-0.5 block text-xs leading-relaxed text-slate-300">{step.text}</span>
  </li>)}
 </ol>;
}

/** Who teaches this class. Owners add and remove teachers here. */
function ClassTeachers({school,klass,staff,act,busy,onChanged}:{school:SchoolMembership;klass:ClassOverview;staff:StaffMember[];
 act:SchoolAct;busy:boolean;onChanged:()=>Promise<void>}){
 const [choice,setChoice]=useState('');
 const owner=school.role==='owner';
 const teachers=klass.teachers??[];
 const names=teacherNames(klass,staff);
 const free=staff.filter(s=>!teachers.some(t=>t.userId===s.userId));
 return <div className="rounded-2xl border border-white/12 bg-white/[.04] p-3 sm:p-4">
  <p className="text-xs font-black uppercase tracking-[.14em] text-sky-200">Sınıfın öğretmenleri</p>
  <ul className="mt-2 flex flex-wrap gap-2">
   {teachers.length===0&&<li className="text-sm text-slate-300">Bu sınıfa atanmış öğretmen yok{owner?'; yöneticiler yine de görebilir.':'.'}</li>}
   {teachers.map((t,i)=><li key={t.userId} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[.06] pl-1 pr-2 text-sm font-bold">
    <Initial id={t.userId} nickname={names[i]} size="h-8 w-8 text-sm"/>{names[i]}
    {owner&&<button type="button" disabled={busy} aria-label={`${names[i]} bu sınıftan çıkarılsın`}
     onClick={()=>void act(async()=>{await unassignTeacher(klass.id,t.userId);await onChanged();},`${names[i]} artık ${klass.name} sınıfını görmüyor.`)}
     className="-my-1 -mr-1.5 flex h-11 w-11 items-center justify-center rounded-full text-slate-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300">✕</button>}
   </li>)}
  </ul>
  {owner&&free.length>0&&<div className="mt-3 flex flex-wrap items-center gap-2">
   <label className="sr-only" htmlFor={`add-teacher-${klass.id}`}>Bu sınıfa öğretmen ekle</label>
   <select id={`add-teacher-${klass.id}`} value={choice} onChange={e=>setChoice(e.target.value)}
    className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/25 bg-[#0b1d35] px-3 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300 sm:max-w-xs">
    <option value="">Öğretmen seçin…</option>
    {free.map(s=><option key={s.userId} value={s.userId}>{staffLabel(s)} · {ROLE_INFO[s.role].label}</option>)}
   </select>
   <button type="button" disabled={busy||!choice} className={secondary}
    onClick={()=>{const member=free.find(s=>s.userId===choice);if(!member)return;
     void act(async()=>{await assignTeacher(klass.id,member.userId);setChoice('');await onChanged();},`${staffLabel(member)} artık ${klass.name} sınıfında.`);}}>+ Sınıfa Ekle</button>
  </div>}
 </div>;
}

type DetailProps={school:SchoolMembership;klass:ClassOverview;classes:ClassOverview[];version:SchoolApiVersion;staff:StaffMember[]|null;
 issued:IssuedInvite|null;onIssued:(invite:IssuedInvite|null)=>void;act:SchoolAct;busy:boolean;onChanged:()=>Promise<void>;onDeleted:()=>Promise<void>};

function ClassDetail({school,klass,classes,version,staff,issued,onIssued,act,busy,onChanged,onDeleted}:DetailProps){
 const [students,setStudents]=useState<RosterStudent[]|null>(null);
 const [rosterError,setRosterError]=useState('');
 const [mode,setMode]=useState<'view'|'edit'|'delete'>('view');
 const [name,setName]=useState(klass.name);
 const [grade,setGrade]=useState(klass.grade_level);
 // The selected class shows its students straight away.
 const loadRoster=useCallback(async()=>{
  setRosterError('');
  try{setStudents(await classStudents(klass.id,version));}
  catch(error){
   console.warn('[Okul paneli] öğrenci listesi',error);
   setRosterError(friendlyAccountError(error,'Öğrenci listesi yüklenemedi. Biraz sonra yeniden deneyin.',{formal:true}));
  }
 },[klass.id,version]);
 useEffect(()=>{void loadRoster();},[loadRoster]);

 const taken=classes.some(c=>c.id!==klass.id&&sameName(c.name,name));
 const save=async(event:FormEvent)=>{
  event.preventDefault();
  if(taken)return;
  if(await act(async()=>{await updateClassroom(klass.id,name,grade);},'Sınıf bilgileri kaydedildi.')){setMode('view');await onChanged();}
 };
 const count=students?.length??klass.student_count;
 const empty=students!==null&&students.length===0;
 const invited=Boolean(issued)||(klass.active_invites??0)>0;
 const invitePanel=<InvitePanel school={school} klass={klass} version={version} issued={issued} onIssued={onIssued}
  onInvitesChanged={()=>void onChanged()} act={act} busy={busy} emphasis={empty}/>;

 return <section aria-labelledby="class-title" className={`${card} min-w-0 space-y-5`}>
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div className="min-w-0">
    <h3 id="class-title" className="break-words text-2xl font-black">🎒 {klass.name}</h3>
    <p className="mt-1 text-sm text-slate-300">{klass.grade_level}. sınıf düzeyi{count!=null?` · ${count} öğrenci`:''}</p>
   </div>
   {version>=2&&mode==='view'&&<div className="flex flex-wrap gap-2">
    <button type="button" onClick={()=>{setName(klass.name);setGrade(klass.grade_level);setMode('edit');}} className={secondary}>✏️ Düzenle</button>
    {(version<3||school.role==='owner')&&<button type="button" onClick={()=>setMode('delete')} className={dangerOutline}>🗑️ Sınıfı Sil</button>}
   </div>}
  </div>
  {version>=3&&staff&&mode==='view'&&<ClassTeachers school={school} klass={klass} staff={staff} act={act} busy={busy} onChanged={onChanged}/>}
  {mode==='edit'&&<form onSubmit={save} aria-label={`${klass.name} sınıfını düzenle`} className="rounded-2xl border border-white/12 bg-white/[.04] p-4">
   <ClassFields name={name} setName={setName} grade={grade} setGrade={setGrade} taken={taken} idPrefix="edit-class"/>
   <div className="mt-4 flex flex-wrap gap-2">
    <button disabled={busy||taken||name.trim().length<2} className={primary}>Kaydet</button>
    <button type="button" onClick={()=>setMode('view')} className={secondary}>Vazgeç</button>
   </div>
  </form>}
  {mode==='delete'&&<ConfirmBox label={`${klass.name} sınıfı silinsin mi?`} confirm="Evet, sınıfı sil" busy={busy}
   onCancel={()=>setMode('view')}
   onConfirm={()=>{setMode('view');void act(async()=>{await deleteClassroom(klass.id);await onDeleted();},`${klass.name} sınıfı silindi.`);}}>
   <strong>{klass.name}</strong> sınıfı silinsin mi? {count?`${count} öğrencinin sınıf bağlantısı ve `:''}etkin davet kodları kaldırılır{(klass.teachers?.length??0)>1?'; sınıfın öğretmenleri de bu sınıfı artık görmez':''}. Çocukların oyun ilerlemesi silinmez; veliler çocuklarını başka bir sınıfa yeniden bağlayabilir.
  </ConfirmBox>}

  <ClassStats students={students} version={version}/>
  {rosterError&&<div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-300/45 bg-rose-950/60 p-4 text-sm">
   {rosterError}<button type="button" onClick={()=>void loadRoster()} className={secondary}>↻ Yeniden dene</button></div>}
  {students===null&&!rosterError&&<p role="status" className="text-sm text-slate-300">Öğrenci listesi yükleniyor…</p>}
  {empty&&<>
   <p className="rounded-2xl border border-white/10 bg-white/[.03] p-4 text-sm leading-relaxed text-slate-200">Bu sınıfa henüz bağlanan öğrenci yok. Davet kodunu velilere ilettiğinizde öğrenciler burada görünür.</p>
   <GettingStarted invited={invited}/>
   {invitePanel}
  </>}
  {students&&students.length>0&&<>
   {version>=2&&<ClassSkillsCard students={students} classId={klass.id}/>}
   <RosterList klass={klass} version={version} students={students} act={act} busy={busy}
    onRemoved={()=>{void loadRoster();void onChanged();}}/>
   {invitePanel}
  </>}
  <p className="text-xs leading-relaxed text-slate-300">Görev ve yıldızlar velinin bulut hesabına yedeklenmiş oyunlardan gelir. Gerçek ad, e-posta, ses ya da yazılan metin paylaşılmaz.</p>
 </section>;
}
