'use client';

import {useMemo,useState} from 'react';
import {removeStudent,type ClassOverview,type RosterStudent,type SchoolApiVersion} from '@/lib/school/schoolService';
import {ROSTER_SORTS,TOTAL_LEVELS,activity,classInsight,classSkills,formatDay,istanbulDay,matchesName,
 percent,skillProgress,sortStudents,startedWorlds,type Activity,type RosterSort} from '@/lib/school/schoolInsights';
import {ConfirmBox,Initial,SkillBars,dangerOutline,secondary,type SchoolAct} from './schoolUi';

const TONE:Record<Activity['tone'],string>={
 today:'border-lime-300/50 bg-lime-300/15 text-lime-100',
 week:'border-sky-300/40 bg-sky-400/10 text-sky-100',
 quiet:'border-amber-300/45 bg-amber-400/10 text-amber-100',
 none:'border-white/15 bg-white/[.05] text-slate-300'
};

/** Four numbers a teacher reads first. */
export function ClassStats({students,version}:{students:RosterStudent[]|null;version:SchoolApiVersion}){
 const list=students??[];
 const missions=list.reduce((n,s)=>n+s.completedLevels,0);
 const average=list.length?Math.round(10*missions/list.length)/10:0;
 const active=list.filter(s=>(s.levels7d??0)>0).length;
 const tiles:[string,string,string][]=[
  ['Öğrenci',String(list.length),'👧'],
  ...(version>=2?[['Son 7 günde aktif',`${active}/${list.length}`,'🔥'] as [string,string,string]]:[]),
  ['Ortalama görev',average.toLocaleString('tr-TR',{maximumFractionDigits:1}),'🎯'],
  ['Toplam yıldız',list.reduce((n,s)=>n+s.stars,0).toLocaleString('tr-TR'),'⭐']
 ];
 return <dl className={`grid grid-cols-2 gap-3 ${tiles.length===4?'lg:grid-cols-4':'sm:grid-cols-3'}`}>
  {tiles.map(([label,value,icon])=><div key={label} className="rounded-2xl border border-white/12 bg-white/[.06] p-3 sm:p-4">
   <dt className="flex items-center gap-1.5 text-xs font-bold leading-tight text-sky-100"><span aria-hidden="true">{icon}</span>{label}</dt>
   <dd className="mt-1 text-2xl font-black tabular-nums">{students?value:'…'}</dd>
  </div>)}
 </dl>;
}

/** Class average per English skill area, with one sentence to act on. */
export function ClassSkillsCard({students,classId}:{students:RosterStudent[];classId:string}){
 const skills=useMemo(()=>classSkills(students),[students]);
 const insight=classInsight(skills,students.length);
 return <section aria-labelledby={`skills-${classId}`} className="rounded-2xl border border-sky-300/25 bg-sky-500/[.07] p-4 sm:p-5">
  <h4 id={`skills-${classId}`} className="text-lg font-black">📊 Sınıfın İngilizce becerileri</h4>
  {insight&&<p className="mt-1 text-sm leading-relaxed text-sky-50/90"><span aria-hidden="true">💡 </span>{insight}</p>}
  <ul className="mt-4 grid gap-3">
   {skills.map(skill=><li key={skill.id}>
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
     <span className="font-black"><span aria-hidden="true">{skill.icon}</span> {skill.label}</span>
     <span className="text-xs font-bold text-sky-100/85"><span className="text-sm font-black tabular-nums text-white">%{skill.percent}</span> · {skill.students}/{students.length} öğrenci başladı</span>
    </div>
    <span aria-hidden="true" className="mt-1.5 block h-2.5 overflow-hidden rounded-full bg-white/10">
     <span className="block h-full rounded-full bg-gradient-to-r from-sky-300 to-lime-300" style={{width:`${skill.percent>0?Math.max(3,skill.percent):0}%`}}/>
    </span>
   </li>)}
  </ul>
  <p className="mt-3 text-xs leading-relaxed text-slate-300">Yüzde, öğrencilerin o alandaki görevlerden tamamladıklarının sınıf ortalamasıdır.</p>
 </section>;
}

type ListProps={klass:ClassOverview;version:SchoolApiVersion;students:RosterStudent[];act:SchoolAct;busy:boolean;onRemoved:()=>void};

/** Students, sortable and searchable; a row opens to show skills and worlds. */
export function RosterList({klass,version,students,act,busy,onRemoved}:ListProps){
 const [sort,setSort]=useState<RosterSort>('name');
 const [query,setQuery]=useState('');
 const [open,setOpen]=useState('');
 const [pendingRemove,setPendingRemove]=useState('');
 const today=istanbulDay();
 const sorts=ROSTER_SORTS.filter(s=>version>=2||s.id!=='recent');
 const list=sortStudents(students,sort).filter(s=>matchesName(s.nickname,query));
 return <section aria-labelledby={`roster-${klass.id}`}>
  <div className="flex flex-wrap items-end justify-between gap-3">
   <h4 id={`roster-${klass.id}`} className="text-lg font-black">Öğrencilerin İngilizce görevleri
    <span className="ml-2 rounded-full bg-white/10 px-2.5 py-0.5 align-middle text-xs font-bold">{students.length}</span></h4>
   {students.length>1&&<label className="flex items-center gap-2 text-xs font-bold text-sky-100">Sırala
    <select value={sort} onChange={e=>setSort(e.target.value as RosterSort)}
     className="min-h-11 rounded-xl border border-white/25 bg-[#0b1d35] px-3 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300">
     {sorts.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
    </select>
   </label>}
  </div>
  {students.length>8&&<label className="mt-3 block">
   <span className="sr-only">Takma adla öğrenci ara</span>
   <input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="🔎 Takma adla ara"
    className="min-h-12 w-full rounded-xl border border-white/20 bg-[#0b1d35] px-4 text-base text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300"/>
  </label>}
  <ul className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/12 bg-white/[.03]">
   {list.map(student=>{
    const id=student.profileId;
    const seen=activity(student.lastPlayedOn,today);
    const expanded=open===id;
    const worlds=startedWorlds(student.worlds);
    return <li key={id} className="px-3 py-3 sm:px-4">
     <div className="flex flex-wrap items-center gap-3">
      <Initial id={id} nickname={student.nickname}/>
      <div className="min-w-[8rem] flex-1">
       <p className="truncate text-sm font-black">{student.nickname}</p>
       <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
        <span>{student.gradeLevel?`${student.gradeLevel}. sınıf`:'Sınıf seçilmedi'}</span>
        {version>=2&&<span className={`rounded-full border px-2 py-0.5 font-bold ${TONE[seen.tone]}`}>
         {seen.tone==='none'?seen.label:`Son görev: ${seen.label}`}</span>}
       </p>
      </div>
      <div className="w-full min-w-[10rem] flex-[2] sm:w-auto">
       <div className="flex justify-between text-xs font-bold text-sky-100"><span>{student.completedLevels} görev</span><span>⭐ {student.stars}</span></div>
       <span aria-hidden="true" className="mt-1.5 block h-2 overflow-hidden rounded-full bg-white/10">
        <span className="block h-full rounded-full bg-gradient-to-r from-lime-300 to-emerald-300"
         style={{width:`${student.completedLevels>0?Math.max(3,percent(student.completedLevels,TOTAL_LEVELS)):0}%`}}/>
       </span>
      </div>
      {version>=2&&<button type="button" aria-expanded={expanded} aria-controls={`student-${klass.id}-${id}`}
       onClick={()=>{setOpen(expanded?'':id);setPendingRemove('');}} className={`${secondary} w-full sm:w-auto`}>
       {expanded?'Gizle':'Ayrıntı'}<span aria-hidden="true">{expanded?'▴':'▾'}</span><span className="sr-only">: {student.nickname}</span>
      </button>}
     </div>
     {version>=2&&<div id={`student-${klass.id}-${id}`} hidden={!expanded} className="mt-3 rounded-xl border border-white/10 bg-[#0b1d35]/60 p-3 sm:p-4">
      <SkillBars skills={skillProgress(student.worlds)} compact/>
      {worlds.length>0?<ul aria-label="Başladığı dünyalar" className="mt-3 flex flex-wrap gap-1.5">
       {worlds.map(w=><li key={w.id} className="rounded-full border border-white/12 bg-white/[.06] px-2.5 py-1 text-xs font-bold">
        <span aria-hidden="true">{w.icon}</span> {w.label} <span className="tabular-nums text-sky-100/85">{w.done}/{w.total}</span></li>)}
      </ul>:<p className="mt-3 text-xs text-slate-300">Henüz tamamlanmış İngilizce görev yok.</p>}
      <p className="mt-3 text-xs text-slate-300">
       {student.joinedAt?`Sınıfa katıldı: ${formatDay(student.joinedAt)} · `:''}Son 7 gün: {student.levels7d??0} görev
      </p>
      {pendingRemove!==id?<button type="button" disabled={busy} onClick={()=>setPendingRemove(id)} className={`${dangerOutline} mt-3`}>Sınıftan Çıkar</button>:
       <ConfirmBox label={`${student.nickname} sınıftan çıkarılsın mı?`} confirm="Evet, sınıftan çıkar" busy={busy}
        onCancel={()=>setPendingRemove('')}
        onConfirm={()=>{setPendingRemove('');setOpen('');void act(async()=>{await removeStudent(klass.id,id);onRemoved();},
         `${student.nickname} ${klass.name} sınıfından çıkarıldı.`);}}>
        <strong>{student.nickname}</strong>, {klass.name} sınıfından çıkarılsın mı? Görev özetini artık görmezsiniz; çocuğun oyun ilerlemesi silinmez. Etkin bir davet kodu varsa veli yeniden katılabilir; bunu istemiyorsanız kodu iptal edin.
       </ConfirmBox>}
     </div>}
    </li>;
   })}
  </ul>
  {list.length===0&&query&&<p role="status" className="mt-3 text-sm text-slate-300">“{query}” ile eşleşen öğrenci yok.</p>}
 </section>;
}
