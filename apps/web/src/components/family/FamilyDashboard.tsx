'use client';

import React from 'react';
import Link from 'next/link';
import type {PlayerProfile} from '@ventra/shared';
import {AvatarPortrait} from '../profile/AvatarPortrait';
import type {FamilyReport,FamilyWorld,FamilyWord} from '@/lib/family/familyReport';

const LEVEL_LABEL:Record<string,string>={'Pre-A1':'Yeni başlıyor','A1':'Biraz biliyor','A2':'Temel biliyor'};
const DAY_NAMES=['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];

/** "bugün 14:20", "dün", "3 gün önce" — for a parent glancing at the page. */
export function whenLabel(iso:string|null,now:Date):string{
 if(!iso)return 'Henüz oynamadı';
 const then=new Date(iso);
 if(!Number.isFinite(then.getTime()))return 'Bilinmiyor';
 const start=(d:Date)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
 const days=Math.round((start(now)-start(then))/86400000);
 const time=then.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
 return days<=0?`Bugün ${time}`:days===1?`Dün ${time}`:days<7?`${days} gün önce`:then.toLocaleDateString('tr-TR',{day:'numeric',month:'long'});
}
const percent=(part:number,whole:number)=>whole>0?Math.round(100*part/whole):null;

function Bar({value,total,tone='lime',label}:{value:number;total:number;tone?:'lime'|'amber'|'sky';label:string}){
 const width=total>0?Math.min(100,Math.round(100*value/total)):0;
 const color=tone==='amber'?'from-amber-300 to-orange-300':tone==='sky'?'from-sky-300 to-cyan-200':'from-lime-300 to-emerald-300';
 return <div className="h-2.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={label}
  aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}>
  <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{width:`${width}%`}}/>
 </div>;
}
function WordChip({word}:{word:FamilyWord}){
 return <li className="flex min-h-12 items-center gap-2 rounded-2xl border border-amber-200/30 bg-amber-100/10 py-1.5 pl-2 pr-3">
  <span aria-hidden="true" className="text-lg">{word.icon}</span>
  <span className="flex flex-col leading-tight">
   <span lang="en" className="text-sm font-black text-amber-50">{word.en}</span>
   <span className="text-xs font-semibold text-amber-100/80">{word.tr}</span>
  </span>
 </li>;
}
function WorldCard({world}:{world:FamilyWorld}){
 const done=world.total>0&&world.completed>=world.total;
 return <li className={`rounded-3xl border p-4 ${done?'border-lime-300/45 bg-lime-300/10':'border-white/12 bg-white/[.05]'}`}>
  <div className="flex items-center gap-3">
   <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl">{world.icon}</span>
   <div className="min-w-0 flex-1">
    <h4 className="truncate text-sm font-black text-white">{world.label}</h4>
    <p className="text-xs font-semibold text-sky-100/80">{world.completed}/{world.total} görev{done?' · tamamlandı ✓':''}</p>
   </div>
  </div>
  <div className="mt-3"><Bar value={world.completed} total={world.total} label={`${world.label} görev ilerlemesi`}/></div>
  {world.discovered!==undefined&&<p className="mt-2 text-xs text-slate-300">
   {world.discovered} kelime keşfetti{world.due?<span className="text-amber-200"> · {world.due} tekrar bekliyor</span>:''}
  </p>}
 </li>;
}

export function FamilyDashboard({profile,profiles,report,now,onSelect,onOpenCloud}:{
 profile:PlayerProfile;profiles:PlayerProfile[];report:FamilyReport;now:Date;
 onSelect:(id:string)=>void;onOpenCloud:()=>void;
}){
 const answered=report.independentAnswers+report.assistedAnswers;
 const independentShare=percent(report.independentAnswers,answered);
 const activeCount=report.activeDays.filter(Boolean).length;
 const nextTone=report.next.kind==='review'?'from-amber-500/30 via-orange-500/20 to-rose-500/10 border-amber-300/45':
  report.next.kind==='celebrate'?'from-lime-400/25 to-emerald-500/15 border-lime-300/45':
  'from-sky-500/30 via-cyan-500/15 to-emerald-400/10 border-sky-300/45';
 return <div className="space-y-6">
  {profiles.length>1&&<nav aria-label="Çocuklar" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
   {profiles.map(p=><button key={p.id} type="button" onClick={()=>onSelect(p.id)} aria-pressed={p.id===profile.id}
    className={`flex min-h-14 shrink-0 items-center gap-3 rounded-2xl border px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300
     ${p.id===profile.id?'border-lime-300/70 bg-lime-300/15':'border-white/15 bg-white/[.06] hover:bg-white/10'}`}>
    <AvatarPortrait id={p.avatarId} size={40} className="h-10 w-10 rounded-xl"/>
    <span className="flex flex-col leading-tight"><span className="text-sm font-black">{p.nickname}</span>
     <span className="text-xs text-sky-100/75">{p.gradeLevel?`${p.gradeLevel}. sınıf`:'Sınıf seçilmedi'}</span></span>
   </button>)}
  </nav>}

  <section aria-labelledby="family-child-name" className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-br from-[#123a5c] via-[#0f2a47] to-[#16294a] p-5 shadow-2xl shadow-black/30 sm:p-7">
   <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl"/>
   <div className="relative flex flex-wrap items-center gap-4 sm:gap-6">
    <AvatarPortrait id={profile.avatarId} size={96} className="h-20 w-20 rounded-3xl shadow-xl shadow-cyan-900/40 sm:h-24 sm:w-24"/>
    <div className="min-w-0 flex-1">
     <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-200">İngilizce karnesi</p>
     <h2 id="family-child-name" className="mt-1 truncate text-3xl font-black tracking-tight sm:text-4xl">{profile.nickname}</h2>
     <ul className="mt-3 flex flex-wrap gap-2 text-xs font-bold" aria-label="Profil bilgileri">
      <li className="rounded-full bg-white/10 px-3 py-1.5">{profile.gradeLevel?`${profile.gradeLevel}. sınıf`:'Sınıf seçilmedi'}</li>
      <li className="rounded-full bg-white/10 px-3 py-1.5">{LEVEL_LABEL[profile.englishLevel??'Pre-A1']} · {profile.englishLevel??'Pre-A1'}</li>
      <li className="rounded-full bg-white/10 px-3 py-1.5">Son oyun: {whenLabel(report.lastPlayedAt,now)}</li>
      <li className={`rounded-full px-3 py-1.5 ${profile.isCloudSynced?'bg-lime-300/20 text-lime-100':'bg-amber-300/15 text-amber-100'}`}>
       {profile.isCloudSynced?'☁️ Bulutta yedekli':'📱 Yalnızca bu cihazda'}</li>
     </ul>
    </div>
   </div>
   <dl className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
    {[
     {icon:'⭐',label:'Yıldız',value:String(report.stars),sub:'tamamlanan görevlerden'},
     {icon:'🏆',label:'Görev',value:`${report.completedMissions}/${report.totalMissions}`,sub:`${report.garden.length+report.islands.length} dünyada`},
     {icon:'📚',label:'Kelime',value:String(report.wordsDiscovered),sub:`keşfetti · ${report.wordsStrong} güçlü`},
     {icon:'🎯',label:'Yardımsız doğru',value:independentShare===null?'—':`%${independentShare}`,sub:answered?`${answered} cevap içinde`:'henüz soru cevaplamadı'}
    ].map(k=><div key={k.label} className="rounded-2xl border border-white/12 bg-white/[.07] p-4">
     <dt className="flex items-center gap-2 text-xs font-black text-sky-100"><span aria-hidden="true">{k.icon}</span>{k.label}</dt>
     <dd className="mt-2 text-3xl font-black tabular-nums">{k.value}</dd>
     <dd className="mt-1 text-xs text-slate-300">{k.sub}</dd>
    </div>)}
   </dl>
   <div className="relative mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-white/10 bg-black/15 px-4 py-3">
    <p className="text-sm font-bold">Son 7 gün: <span className="text-lime-200">{activeCount} gün oynadı</span></p>
    <ol className="flex gap-1.5" aria-label="Son yedi günün oyun günleri">
     {report.activeDays.map((on,i)=>{
      const day=new Date(now);day.setDate(now.getDate()-(6-i));
      const name=DAY_NAMES[day.getDay()];
      return <li key={i} className="flex flex-col items-center gap-1" aria-label={`${name}: ${on?'oynadı':'oynamadı'}`}>
       <span aria-hidden="true" className={`h-7 w-7 rounded-lg ${on?'bg-gradient-to-br from-lime-300 to-emerald-400 shadow-[0_0_12px_#a3e63580]':'bg-white/10'}`}/>
       <span aria-hidden="true" className="text-xs text-slate-300">{name}</span>
      </li>;
     })}
    </ol>
   </div>
  </section>

  <section aria-labelledby="family-next" className={`rounded-[2rem] border bg-gradient-to-br p-5 sm:p-6 ${nextTone}`}>
   <p className="text-xs font-black uppercase tracking-[.16em] text-white/80">Sıradaki adım</p>
   <h3 id="family-next" className="mt-1 text-xl font-black sm:text-2xl">{report.next.title}</h3>
   <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/85">{report.next.detail}</p>
   <Link href="/kids" className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-5 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-900/30">
    Oyuna Git <span aria-hidden="true">→</span>
   </Link>
  </section>

  <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
   <section aria-labelledby="family-garden" className="rounded-[2rem] border border-white/12 bg-white/[.04] p-5 sm:p-6">
    <h3 id="family-garden" className="text-lg font-black">🌱 Kelime Bahçesi</h3>
    <p className="mt-1 text-sm text-slate-300">Altı dünyanın görevleri ve keşfettiği İngilizce kelimeler.</p>
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">{report.garden.map(w=><WorldCard key={w.id} world={w}/>)}</ul>
   </section>
   <div className="space-y-6">
    <section aria-labelledby="family-review" className="rounded-[2rem] border border-white/12 bg-white/[.04] p-5 sm:p-6">
     <h3 id="family-review" className="text-lg font-black">🔁 Tekrar listesi</h3>
     {report.due.length===0?<p className="mt-2 text-sm leading-relaxed text-slate-300">
      Şu an tekrar zamanı gelen kelime yok. Yeni kelimeler keşfettikçe oyunlar onları uygun zamanda yeniden sorar.
     </p>:<>
      <p className="mt-1 text-sm text-slate-300">Evde birlikte söyleyebileceğiniz kelimeler; Türkçesi altında.</p>
      <ul className="mt-4 flex flex-wrap gap-2">{report.due.slice(0,12).map(w=><WordChip key={w.domain+':'+w.id} word={w}/>)}</ul>
      {report.due.length>12&&<p className="mt-3 text-xs text-slate-300">ve {report.due.length-12} kelime daha</p>}
     </>}
    </section>
    <section aria-labelledby="family-skills" className="rounded-[2rem] border border-white/12 bg-white/[.04] p-5 sm:p-6">
     <h3 id="family-skills" className="text-lg font-black">🧭 Beceri dengesi</h3>
     <p className="mt-1 text-sm text-slate-300">İlk denemede ve yardım almadan verilen doğru cevaplar.</p>
     <ul className="mt-4 space-y-4">{report.skills.map(s=>{
      const share=percent(s.independent,s.attempts);
      return <li key={s.id}>
       <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-black">{s.label}</span>
        <span className="text-sm font-black tabular-nums text-sky-100">{share===null?'—':`%${share}`}</span>
       </div>
       <p className="mb-2 text-xs text-slate-300">{s.hint}{s.attempts?` · ${s.attempts} deneme`:' · henüz deneme yok'}</p>
       <Bar value={s.independent} total={Math.max(1,s.attempts)} tone="sky" label={`${s.label} yardımsız doğru oranı`}/>
      </li>;
     })}</ul>
    </section>
   </div>
  </div>

  <section aria-labelledby="family-islands" className="rounded-[2rem] border border-white/12 bg-white/[.04] p-5 sm:p-6">
   <h3 id="family-islands" className="text-lg font-black">🏝️ Diğer adalar</h3>
   <p className="mt-1 text-sm text-slate-300">Cümle, hikâye, konuşma ve yazı görevleri.</p>
   <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{report.islands.map(w=><WorldCard key={w.id} world={w}/>)}</ul>
  </section>

  <section aria-labelledby="family-recent" className="rounded-[2rem] border border-white/12 bg-white/[.04] p-5 sm:p-6">
   <h3 id="family-recent" className="text-lg font-black">🕘 Son oyunlar</h3>
   {report.recent.length===0?<p className="mt-2 text-sm text-slate-300">Henüz tamamlanmış bir İngilizce oyun yok.</p>:
   <ul className="mt-4 divide-y divide-white/10">{report.recent.map((r,i)=><li key={i} className="flex min-h-14 items-center gap-3 py-2">
    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">{r.icon}</span>
    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{r.title}</span>
     <span className="block text-xs text-slate-300">{whenLabel(r.timestamp,now)}</span></span>
    {r.stars!==undefined&&<span className="shrink-0 text-sm font-black text-amber-200" aria-label={`${r.stars} yıldız`}>{'⭐'.repeat(Math.max(0,Math.min(3,r.stars)))}</span>}
   </li>)}</ul>}
  </section>

  <details className="group rounded-[2rem] border border-white/12 bg-white/[.03] p-5 sm:p-6">
   <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-base font-black">
    Bu karne nasıl hazırlanıyor? <span aria-hidden="true" className="text-sky-200 transition group-open:rotate-180">⌄</span>
   </summary>
   <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-300">
    <li>Yalnızca oyunlarda verilen cevaplardan hazırlanır; bir seviye sınavı değildir.</li>
    <li>“Yardımsız doğru”, ilk denemede ve ipucu, yazılı destek ya da sesli yardım kullanmadan verilen doğru cevaptır.</li>
    <li>Bir kelime “güçlü” sayılmadan önce farklı günlerde birkaç kez doğru cevaplanmalıdır; unutulmaya başlayınca tekrar listesine döner.</li>
    <li>Kayıtlar bu cihazda tutulur. Ses kaydı ya da çocuğun yazdığı metin saklanmaz. İsterseniz “Yedekleme” ile ilerlemeyi aile hesabınıza bağlayabilirsiniz.</li>
   </ul>
   <button type="button" onClick={onOpenCloud}
    className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold hover:bg-white/15">☁️ Yedekleme ve hesap</button>
  </details>
 </div>;
}
