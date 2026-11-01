'use client';
import React, {useEffect, useState} from 'react';
import { getProgressRepository } from '@/lib/progress';
import { loadLearningReport } from '@/lib/learning/learningReport';
import type { LearningSnapshot, LearningDomain } from '@/lib/learning/adaptiveLearningEngine';
import { ANIMAL_MEADOW_WORDS } from '@/lib/learning/animalMissionEngine';
import { COLOR_GROVE_WORDS } from '@/lib/progress/colorGroveProgress';
import Link from 'next/link';

export function LearningIntelligencePanel({profileId}:{profileId:string}){
  const [report,setReport]=useState<LearningSnapshot|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(false);
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    let live=true;setLoading(true);setError(false);setReport(null);
    loadLearningReport(getProgressRepository(),profileId)
      .then(next=>{if(live){setReport(next);setLoading(false)}})
      .catch(err=>{console.error('P3 öğrenme raporu yüklenemedi',err);if(live){setError(true);setLoading(false)}});
    return ()=>{live=false};
  },[profileId,refresh]);
  const lookUp=(domain:LearningDomain,id:string)=>{
    if(domain==='animals')return ANIMAL_MEADOW_WORDS.find(w=>w.id===id)?.tr??id;
    return COLOR_GROVE_WORDS.find(w=>w.id===id)?.tr??id;
  };
  const due=report?.vocabulary.filter(v=>v.due)??[];
  const lastDue=due.slice(0,8);
  return <section aria-label="İngilizce öğrenme karnesi"
    className="rounded-3xl border border-cyan-300/30 bg-gradient-to-br from-[#12334c] via-[#10243c] to-[#172b38] p-4 text-white shadow-xl sm:p-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[.16em] text-cyan-200">P3 · Adaptif Öğrenme</p>
        <h2 className="mt-1 text-xl font-black sm:text-2xl">İngilizce Öğrenme Karnesi</h2>
        <p className="mt-1 text-xs text-slate-300">Yıldızlardan ayrı, gerçek cevap kayıtlarını temel alan gösterge. Resmî seviye testi değildir.</p>
      </div>
      <button type="button" onClick={()=>setRefresh(x=>x+1)}
        className="min-h-11 rounded-xl border border-white/25 bg-white/10 px-4 text-xs font-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200">
        ↻ Yenile
      </button>
    </div>
    {loading&&<p role="status" className="py-6 text-center text-sm">Kelime kayıtları inceleniyor…</p>}
    {error&&<p role="alert" className="rounded-xl bg-rose-950/70 p-4 text-sm">Öğrenme kayıtları okunamadı. Yenile ile tekrar deneyebilirsin.</p>}
    {report&&!loading&&<>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ['Keşfedilen',report.totalDiscovered,'/ 22 kelime'],
          ['Alıştırılan',report.practicedWords,'ayrı kelime'],
          ['Tekrar zamanı',report.dueWords,'kelime'],
          ['Güçlenen',report.progressingWords,'kelime/beceri']
        ].map(([label,value,sub])=><div key={label} className="rounded-2xl border border-white/15 bg-white/10 p-3">
          <p className="text-xs font-bold text-sky-200">{label}</p>
          <p className="mt-2 text-3xl font-black tabular-nums">{value}</p>
          <p className="mt-1 text-[11px] text-slate-300">{sub}</p>
        </div>)}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(['animals','colors'] as const).map(domain=>{
          const domainData=report.domainStats[domain];
          const title=domain==='animals'?'🐾 Hayvan Çayırı':'🎨 Renk Korusu';
          const total=domain==='animals'?12:10;
          return <div key={domain} className="rounded-2xl border border-white/15 bg-slate-950/30 p-4">
            <h3 className="font-black">{title}</h3>
            <p className="mt-1 text-xs text-slate-300">{domainData.discovered}/{total} keşfedildi · {domainData.practiced} çalışıldı</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15" role="progressbar"
              aria-label={title+' keşif ilerlemesi'} aria-valuenow={domainData.discovered} aria-valuemin={0} aria-valuemax={total}>
              <div className="h-full rounded-full bg-lime-300" style={{width:`${100*domainData.discovered/total}%`}}/>
            </div>
            <p className="mt-2 text-xs text-amber-100">Tekrar gereken: {domainData.due}</p>
          </div>;
        })}
      </div>
      <div className="mt-4 rounded-2xl border border-white/15 bg-slate-950/35 p-4">
        <h3 className="text-base font-black">Bugün neleri tekrar edelim?</h3>
        {lastDue.length===0?<p className="mt-2 text-sm text-slate-300">
          Şu an kayıtlı bir gecikmiş tekrar bulunmuyor. Yeni kelimeleri oyunlarda keşfetmeye devam edebilirsin.
        </p>:<>
          <div className="mt-3 flex flex-wrap gap-2">
            {lastDue.map(v=><span key={v.domain+':'+v.wordId}
              className="rounded-xl border border-amber-300/30 bg-amber-200/10 px-3 py-2 text-sm font-bold text-amber-100">
              {lookUp(v.domain,v.wordId)} <span className="text-xs opacity-75">({v.wordId})</span>
            </span>)}
          </div>
          <p className="mt-2 text-xs text-slate-400">Aynı kelimenin tanıma, dinleme ve uygulama becerileri farklı zamanlarda tekrar gerektirebilir.</p>
        </>}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-400">Bağımsız ilk-deneme doğrusu: {report.independentAnswers} · Destekli / yanlış deneme: {report.assistedAnswers}</p>
          <Link href="/kids" className="rounded-xl bg-lime-300 px-4 py-3 text-xs font-black text-emerald-950">
            Oyunlara Git →
          </Link>
        </div>
      </div>
    </>}
  </section>;
}
