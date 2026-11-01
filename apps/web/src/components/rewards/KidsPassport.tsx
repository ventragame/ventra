'use client';

import React,{useCallback,useEffect,useRef,useState} from 'react';
import {
  COSMETICS,DAILY_GOALS, WORLD_GAMES,type CosmeticId,type CosmeticGroup,type DailyGoal
} from '@/lib/rewards/economyEngine';
import {
  claimQuest,getPassport,purchaseCosmetic,setEquipped,type PassportSnapshot
} from '@/lib/rewards/economyRepository';
import {getProgressRepository} from '@/lib/progress';
import {CosmeticArtwork} from './CosmeticArtwork';

type Tab='passport'|'quests'|'shop';
type Props={
  profileId:string;nickname:string;avatarEmoji:string;gradeLevel:number|null;
  englishLevel:string;onClose:()=>void;onChanged?:()=>void;
};
export function KidsPassport({profileId,nickname,avatarEmoji,gradeLevel,englishLevel,onClose,onChanged}:Props){
  const closeButton=useRef<HTMLButtonElement>(null);
  const [tab,setTab]=useState<Tab>('passport');
  const [snapshot,setSnapshot]=useState<PassportSnapshot|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [notice,setNotice]=useState('');
  const refresh=useCallback(async()=>{
    const current=await getPassport(getProgressRepository(),profileId);
    setSnapshot(current);return current;
  },[profileId]);
  useEffect(()=>{
    let alive=true;
    setSnapshot(null);setError(null);setNotice('');
    getPassport(getProgressRepository(),profileId).then(x=>{if(alive)setSnapshot(x)})
      .catch(e=>{console.error('P5 passport could not load',e);
        if(alive)setError('Pasaport açılamadı. Oyun kayıtlarını değiştirmeden tekrar dene.');});
    return()=>{alive=false;};
  },[profileId]);
  const perform=async(task:()=>Promise<unknown>,message:string)=>{
    if(busy)return;
    setBusy(true);setError(null);
    try{await task();await refresh();setNotice(message);onChanged?.();}
    catch(e){console.error('P5 economy action rejected',e);
      setError(e instanceof Error?e.message:'İşlem tamamlanamadı. Tekrar deneyebilirsin.');}
    finally{setBusy(false);}
  };
  useEffect(()=>{
    closeButton.current?.focus({preventScroll:true});
    const handleKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();onClose();}
    };
    document.addEventListener('keydown',handleKey,true);
    return()=>document.removeEventListener('keydown',handleKey,true);
  },[onClose]);
  const equipment=snapshot?.economy.equipped??{};
  const hat=COSMETICS.find(c=>c.id===equipment.hat);
  const badge=COSMETICS.find(c=>c.id===equipment.badge);
  const aura=COSMETICS.find(c=>c.id===equipment.aura);
  const complete=snapshot?.completed??0;
  const all=WORLD_GAMES.reduce((sum,w)=>sum+w.count,0);
  return <div role="dialog" aria-modal="true" aria-label="Ventra Maceracı Pasaportu"
    className="fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-[#06152c]/95 p-3 text-white backdrop-blur-xl sm:p-6"
    style={{paddingTop:'max(16px,env(safe-area-inset-top))',paddingBottom:'max(24px,env(safe-area-inset-bottom))'}}>
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute -left-28 -top-40 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl"/>
      <div className="absolute -right-28 top-1/3 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl"/>
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"/>
    </div>
    <div className="mx-auto max-w-5xl">
      <header className="flex items-center justify-between gap-2 pb-5">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-[.22em] text-cyan-300">Ventra Kids • P5</div>
          <h1 className="mt-1 text-xl font-black sm:text-3xl">✨ Maceracı Pasaportu</h1>
        </div>
        <button ref={closeButton} onClick={onClose} className="min-h-12 rounded-2xl border border-white/25 bg-slate-900/90 px-4 text-sm font-black hover:bg-slate-800">
          ✕ Kapat
        </button>
      </header>
      {error&&<div role="alert" className="mb-4 rounded-xl border border-rose-300/40 bg-rose-900/50 p-3 text-sm font-semibold">{error}</div>}
      {notice&&<div role="status" className="mb-4 rounded-xl border border-lime-300/40 bg-emerald-900/50 p-3 text-sm font-semibold">{notice}</div>}
      {!snapshot?<div className="rounded-3xl border border-sky-300/30 bg-slate-900/60 p-10 text-center">
        <p role="status">Pasaport ve koleksiyon bilgileri hazırlanıyor…</p>
        {error&&<button className="mt-4 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950" onClick={()=>void perform(refresh,'Pasaport güncellendi')}>Tekrar dene</button>}
      </div>:<>
        <section className="relative overflow-hidden rounded-[28px] border border-amber-200/30 bg-gradient-to-br from-[#1b476f] via-[#1c3265] to-[#34316c] p-4 shadow-2xl sm:p-6">
          <div className="absolute right-2 top-0 text-8xl opacity-10" aria-hidden="true">✦</div>
          <div className="relative flex flex-wrap items-center gap-4">
            <div aria-label="Kişiselleştirilmiş maceracı avatarın"
              className={`relative flex h-24 w-24 shrink-0 items-center justify-center rounded-[26px] border-2 border-white/30 bg-gradient-to-br from-cyan-500/40 to-violet-500/40 text-5xl shadow-xl sm:h-28 sm:w-28 ${aura?'shadow-yellow-200/60':''}`}>
              <span aria-hidden="true">{avatarEmoji}</span>
              {hat&&<span aria-label={hat.name} className="absolute -right-3 -top-4"><CosmeticArtwork id={hat.id} size={42}/></span>}
              {badge&&<span aria-label={badge.name} className="absolute -bottom-2 -right-2"><CosmeticArtwork id={badge.id} size={35}/></span>}
              {aura&&<span aria-label={aura.name} className="absolute -bottom-3 -left-3"><CosmeticArtwork id={aura.id} size={37}/></span>}
            </div>
            <div className="min-w-[160px] flex-1">
              <p className="text-xs font-black uppercase tracking-[.12em] text-cyan-200">Ventra Kaşifi</p>
              <h2 className="mt-1 text-2xl font-black sm:text-3xl">{nickname}</h2>
              <p className="mt-1 text-xs font-semibold text-sky-100">{gradeLevel?`${gradeLevel}. sınıf`:'Sınıf belirtilmedi'} • {englishLevel}</p>
              <p className="mt-2 text-xs text-cyan-100">{complete}/{all} bölüm keşfedildi</p>
              <div className="mt-2 h-2 max-w-sm overflow-hidden rounded-full bg-black/40" aria-label="Genel ilerleme">
                <div className="h-full rounded-full bg-gradient-to-r from-lime-300 to-cyan-300" style={{width:`${100*complete/all}%`}}/>
              </div>
            </div>
            <div className="flex min-w-[115px] gap-2 sm:gap-3">
              <div className="rounded-xl border border-white/25 bg-slate-950/45 px-3 py-3 text-center">
                <span className="block text-lg">⭐</span><strong className="text-xl text-amber-200">{snapshot.totalStars}</strong>
                <span className="block text-[10px] text-sky-200">Yıldız</span>
              </div>
              <div className="rounded-xl border border-white/25 bg-slate-950/45 px-3 py-3 text-center">
                <span className="block text-lg">🪙</span><strong className="text-xl text-amber-200">{snapshot.balance}</strong>
                <span className="block text-[10px] text-sky-200">Ventra Coin</span>
              </div>
            </div>
          </div>
        </section>
        <nav aria-label="Pasaport menüsü" className="my-4 grid grid-cols-3 gap-2">
          {([
            ['passport','🏅 Pasaport'],['quests','🗺️ Günlük Görev'],['shop','🎁 Koleksiyon']
          ] as [Tab,string][]).map(([id,name])=><button key={id} onClick={()=>{setTab(id);setNotice('');}}
            aria-pressed={tab===id} className={`min-h-12 rounded-xl border px-2 py-3 text-xs font-extrabold sm:text-sm
              ${tab===id?'border-lime-300 bg-emerald-800/75 text-white':'border-sky-300/25 bg-slate-900/70 text-slate-200 hover:bg-slate-800'}`}>{name}</button>)}
        </nav>
        {tab==='passport'&&<div className="space-y-4">
          <section className="grid gap-3 sm:grid-cols-4">
            {[
              {icon:'🐾',label:'Keşfedilen Hayvan',value:snapshot.learned.animals},
              {icon:'🎨',label:'Keşfedilen Renk',value:snapshot.learned.colors},
              {icon:'🔢',label:'Keşfedilen Sayı',value:snapshot.learned.numbers},
              {icon:'🍎',label:'Keşfedilen Yiyecek',value:snapshot.learned.food}
            ].map(x=><div key={x.label} className="flex items-center gap-3 rounded-xl border border-cyan-100/20 bg-slate-900/60 px-4 py-3">
              <span className="text-2xl">{x.icon}</span><div>
                <strong className="block text-xl text-lime-200">{x.value}</strong>
                <span className="text-xs font-semibold text-slate-300">{x.label}</span>
              </div>
            </div>)}
          </section>
          <section className="grid gap-3 sm:grid-cols-3">
            {snapshot.worldStats.map(world=><article key={world.id}
              className="rounded-2xl border border-sky-200/25 bg-slate-900/70 p-4">
              <div className="text-3xl">{world.icon}</div>
              <h3 className="mt-2 font-black">{world.label}</h3>
              <p className="mt-1 text-sm text-cyan-100">{world.completed}/{world.total} görev</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-700">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-300"
                  style={{width:`${100*world.completed/world.total}%`}}/>
              </div>
            </article>)}
          </section>
          <div className="rounded-2xl border border-white/20 bg-slate-900/70 p-4">
            <h3 className="font-black">🏆 Koleksiyon Rozetlerim</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {snapshot.worldStats.map(world=><span key={world.id}
                className={`rounded-xl border px-3 py-2 text-xs font-bold ${world.completed===world.total?'border-lime-300/60 bg-lime-400/15 text-lime-100':'border-slate-600 bg-slate-800 text-slate-400'}`}>
                {world.completed===world.total?'🏅':'🔒'} {world.label}
              </span>)}
            </div>
            <p className="mt-3 text-xs text-slate-300">Yıldızlar başarı kaydıdır, harcanmaz. Coin yalnızca kozmetik eşyalar içindir.</p>
          </div>
        </div>}
        {tab==='quests'&&<section className="rounded-3xl border border-white/20 bg-slate-900/70 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-black">🧭 Bugünün Maceraları</h3>
            <span className="text-xs font-bold text-cyan-100">{snapshot.day}</span>
          </div>
          <p className="mt-2 text-sm text-slate-300">İstediğin dünyada görevleri tamamla. Günlük seri baskısı veya kaçırma cezası yok.</p>
          <div className="mt-4 space-y-3">
            {snapshot.daily.map(goal=><div key={goal.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-sky-300/25 bg-[#142949] p-3">
              <span className="text-2xl" aria-hidden="true">🗺️</span>
              <div className="min-w-[130px] flex-1">
                <h4 className="text-sm font-black">{goal.title}</h4>
                <p className="text-xs text-slate-300">{goal.progress}/{goal.required} görev • 🪙 +{goal.coins}</p>
                <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-700">
                  <div className="h-full rounded-full bg-emerald-300" style={{width:`${100*goal.progress/goal.required}%`}}/>
                </div>
              </div>
              <button disabled={busy||!goal.eligible||goal.claimed}
                className="min-h-11 rounded-xl bg-lime-300 px-4 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
                onClick={()=>void perform(()=>claimQuest(getProgressRepository(),profileId,goal.id),`🪙 +${goal.coins} coin kazandın!`)}>
                {goal.claimed?'✓ Alındı':goal.eligible?'Ödülü Al':'Görev Bekliyor'}
              </button>
            </div>)}
          </div>
        </section>}
        {tab==='shop'&&<section className="rounded-3xl border border-white/20 bg-slate-900/70 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black">🎁 Koleksiyon Dükkânı</h3>
              <p className="mt-1 text-xs text-sky-100">Şapka, rozet ve avatar ışıltılarını coin ile aç.</p>
            </div>
            <div className="rounded-xl border border-amber-200/35 bg-slate-950/55 px-4 py-2 text-sm font-black text-amber-200">🪙 {snapshot.balance}</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {COSMETICS.map(item=>{
              const owned=snapshot.economy.owned.includes(item.id),equipped=equipment[item.group]===item.id;
              return <article key={item.id} className="flex flex-col items-center rounded-2xl border border-sky-300/25 bg-gradient-to-b from-[#214c76] to-[#102641] p-3 text-center">
                <div className="flex min-h-24 w-full items-center justify-center rounded-xl bg-gradient-to-br from-sky-300/15 to-indigo-300/10" aria-hidden="true"><CosmeticArtwork id={item.id} size={90}/></div>
                <h4 className="mt-2 min-h-10 text-xs font-black sm:text-sm">{item.name}</h4>
                <p className="mb-3 text-xs font-bold text-amber-200">{owned?'Koleksiyonda':`🪙 ${item.price}`}</p>
                <button disabled={busy||equipped||(!owned&&snapshot.balance<item.price)}
                  className="mt-auto min-h-11 w-full rounded-xl border border-lime-200/50 bg-lime-300 px-2 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:border-slate-500 disabled:bg-slate-700 disabled:text-slate-300"
                  onClick={()=>void perform(
                    owned?()=>setEquipped(profileId,item.id,item.group):()=>purchaseCosmetic(profileId,item.id),
                    owned?'Kozmetik karakterine uygulandı!':'Koleksiyonuna eklendi!'
                  )}>{equipped?'✓ Takılı':owned?'Kullan':snapshot.balance>=item.price?'Coin ile Aç':'Coin Biriktir'}</button>
              </article>;
            })}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-300">
            Bu dükkân yalnızca oyun içinde kazanılan Ventra Coin kullanır. Gerçek parayla satın alma henüz etkin değil.
            Öğrenme görevleri ücretsiz erişilebilir kalır.
          </p>
        </section>}
        <footer className="mt-5 rounded-xl border border-white/15 bg-slate-950/65 p-3 text-[11px] leading-relaxed text-slate-300">
          Çevrimdışı ödüller bu cihazdaki profile kaydedilir. Farklı cihazlarda güvenilir coin eşitlemesi ve
          ebeveyn onaylı ödeme doğrulaması tamamlanmadan gerçek ücretli coin bakiyesi oluşturulmaz.
        </footer>
      </>}
    </div>
  </div>;
}
