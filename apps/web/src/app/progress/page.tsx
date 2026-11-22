'use client';

import React,{useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import type {PlayerProfile} from '@ventra/shared';
import {getProgressRepository} from '../../lib/progress';
import {loadFamilyReport,type FamilyReport} from '../../lib/family/familyReport';
import {ParentalGateModal} from '../../components/profile/ParentalGateModal';
import {AdultAccountModal} from '../../components/profile/AdultAccountModal';
import {FamilyDashboard} from '../../components/family/FamilyDashboard';

/** The family panel shows a child's records and the account tools: an adult
 * opens it once per browser session (30 minutes), never the child by accident. */
const GATE_KEY='ventra:family-panel:unlocked-at';
const GATE_MS=30*60*1000;
function gateStillOpen():boolean{
 try{const at=Number(window.sessionStorage.getItem(GATE_KEY));return Number.isFinite(at)&&at>0&&Date.now()-at<GATE_MS;}
 catch{return false;}
}
function rememberGate(){try{window.sessionStorage.setItem(GATE_KEY,String(Date.now()));}catch{/* private mode: ask again next time */}}

export default function FamilyPanelPage(){
 const router=useRouter();
 // checking → (ask → open) | open: nothing about a child renders before 'open'.
 const [gate,setGate]=useState<'checking'|'ask'|'open'>('checking');
 const unlocked=gate==='open';
 const [profiles,setProfiles]=useState<PlayerProfile[]>([]);
 const [selectedId,setSelectedId]=useState<string|null>(null);
 const [report,setReport]=useState<FamilyReport|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [cloudOpen,setCloudOpen]=useState(false);
 const [now,setNow]=useState(()=>new Date());
 const request=useRef(0);

 useEffect(()=>{setGate(gateStillOpen()?'open':'ask');},[]);

 const loadProfiles=useCallback(async()=>{
  const repo=getProgressRepository();
  const [all,active]=await Promise.all([repo.getAllProfiles(),repo.getActiveProfile()]);
  setProfiles(all);
  setSelectedId(old=>old&&all.some(p=>p.id===old)?old:active?.id??all[0]?.id??null);
  if(all.length===0)setLoading(false);
 },[]);
 useEffect(()=>{
  if(!unlocked)return;
  loadProfiles().catch(err=>{console.error('Aile paneli profilleri okunamadı',err);setError('Çocuk profilleri okunamadı.');setLoading(false);});
 },[unlocked,loadProfiles]);

 const profile=profiles.find(p=>p.id===selectedId)??null;
 useEffect(()=>{
  if(!unlocked||!profile)return;
  const id=++request.current;
  const at=new Date();
  setLoading(true);setError('');
  loadFamilyReport(getProgressRepository(),profile,at)
   .then(next=>{if(id===request.current){setReport(next);setNow(at);}})
   .catch(err=>{console.error('Aile karnesi hazırlanamadı',err);if(id===request.current)setError('Karne hazırlanamadı. Sayfayı yenileyip tekrar deneyin.');})
   .finally(()=>{if(id===request.current)setLoading(false);});
 },[unlocked,profile]);

 return <div className="min-h-[100dvh] bg-[#071427] text-white">
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
   <div className="absolute -left-40 -top-32 h-[34rem] w-[34rem] rounded-full bg-sky-500/15 blur-3xl"/>
   <div className="absolute -right-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-violet-500/15 blur-3xl"/>
  </div>
  <header className="relative z-30 border-b sm:sticky sm:top-0 border-white/10 bg-[#071427]/85 backdrop-blur-xl" style={{paddingTop:'env(safe-area-inset-top)'}}>
   <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
    <Link href="/" className="flex min-h-11 items-center gap-3">
     <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-500 text-xl shadow-lg shadow-sky-900/40">🛡️</span>
     <span className="leading-tight"><span className="block text-sm font-black tracking-[.18em] text-sky-200">VENTRA</span>
      <span className="block text-base font-black">Aile Paneli</span></span>
    </Link>
    {unlocked&&<nav aria-label="Aile paneli bağlantıları" className="flex flex-wrap items-center gap-2">
     <button type="button" onClick={()=>setCloudOpen(true)} className="min-h-11 rounded-xl border border-white/20 bg-white/[.07] px-3 text-sm font-bold hover:bg-white/15">☁️ Yedekleme</button>
     <Link href="/school" className="flex min-h-11 items-center rounded-xl border border-white/20 bg-white/[.07] px-3 text-sm font-bold hover:bg-white/15">🏫 Okul</Link>
     <Link href="/kids" className="flex min-h-11 items-center rounded-xl bg-gradient-to-r from-lime-300 to-emerald-300 px-4 text-sm font-black text-emerald-950">🏝️ Oyuna Dön</Link>
    </nav>}
   </div>
  </header>
  <main className="relative mx-auto max-w-6xl px-4 pb-16 pt-6" style={{paddingBottom:'max(64px,env(safe-area-inset-bottom))'}}>
   {gate==='ask'&&<h1 className="sr-only">Aile Paneli</h1>}
   {unlocked&&<>
    <h1 className="sr-only">Aile Paneli</h1>
    {error&&<p role="alert" className="mb-5 rounded-2xl border border-rose-300/40 bg-rose-950/60 p-4 text-sm">{error}</p>}
    {!error&&profiles.length===0&&!loading&&<section className="mx-auto mt-6 max-w-xl rounded-[2rem] border border-white/15 bg-white/[.05] p-8 text-center">
     <div aria-hidden="true" className="text-5xl">🏝️</div>
     <h2 className="mt-4 text-2xl font-black">Henüz çocuk profili yok</h2>
     <p className="mt-2 text-sm leading-relaxed text-slate-300">Çocuğunuz Ventra Kids'te bir takma ad ve avatar seçtiğinde karnesi burada görünür. Gerçek ad gerekmez.</p>
     <Link href="/kids" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-gradient-to-r from-lime-300 to-emerald-300 px-5 font-black text-emerald-950">Ventra Kids'e Git →</Link>
    </section>}
    {profile&&report&&<FamilyDashboard profile={profile} profiles={profiles} report={report} now={now}
     onSelect={id=>setSelectedId(id)} onOpenCloud={()=>setCloudOpen(true)}/>}
    {loading&&profiles.length>0&&!report&&<p role="status" className="py-16 text-center text-sm font-semibold text-sky-100">Karne hazırlanıyor…</p>}
   </>}
  </main>
  {gate==='ask'&&<ParentalGateModal isOpen
   title="Aile Paneli"
   description="Bu sayfa ebeveynler içindir: çocuğunuzun İngilizce karnesi ve hesap ayarları. Devam etmek için işlemi çözün."
   confirmLabel="Paneli Aç"
   onClose={()=>router.push('/kids')}
   onSuccess={()=>{rememberGate();setGate('open');}}/>}
  {cloudOpen&&<AdultAccountModal isOpen onClose={()=>setCloudOpen(false)}
   onSyncCompleted={()=>{void loadProfiles();}}/>}
 </div>;
}
