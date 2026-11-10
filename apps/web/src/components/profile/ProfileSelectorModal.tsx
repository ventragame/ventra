'use client';

import React,{useCallback,useEffect,useState} from 'react';
import {
  VENTRA_AVATARS,VENTRA_STARTER_AVATARS,getAvatarById,
  type PlayerProfile
} from '@ventra/shared';
import {getProgressRepository} from '@/lib/progress';
import {getAvatarShop,purchaseAvatarWithCoins} from '@/lib/rewards/economyRepository';
import {avatarIsOwned,type EconomyState} from '@/lib/rewards/economyEngine';
import {soundService} from '@/lib/audio/SoundService';
import {AvatarPortrait} from './AvatarPortrait';
import './avatar-collection.css';
import {StarterPlacementCheck} from './StarterPlacementCheck';

interface ProfileSelectorModalProps{
 isOpen:boolean;
 onClose:()=>void;
 onProfileSwitched:(profile:PlayerProfile)=>void;
 onOpenParentGate?:()=>void;
}
type Filter='all'|'available'|'locked';
type Shop={economy:EconomyState;balance:number};

/** Player switching and an earned-coin avatar wardrobe share one modal.
 * Avatar purchases are atomic per child; cloud account data is never modified
 * by merely opening a preview. No real-money checkout exists here. */
export const ProfileSelectorModal:React.FC<ProfileSelectorModalProps>=({
 isOpen,onClose,onProfileSwitched,onOpenParentGate
})=>{
 const [profiles,setProfiles]=useState<PlayerProfile[]>([]);
 const [activeProfile,setActiveProfile]=useState<PlayerProfile|null>(null);
 const [pendingByProfile,setPendingByProfile]=useState<Record<string,number>>({});
 const [shop,setShop]=useState<Shop|null>(null);
 const [preview,setPreview]=useState('avatar_explorer');
 const [filter,setFilter]=useState<Filter>('all');
 const [confirmId,setConfirmId]=useState<string|null>(null);
 const [creating,setCreating]=useState(false);
 const [nickname,setNickname]=useState('');
 const [newAvatar,setNewAvatar]=useState(VENTRA_STARTER_AVATARS[0].id);
 const [placementOpen,setPlacementOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const loadProfiles=useCallback(async()=>{
  try{
   const repo=getProgressRepository();
   const [all,active]=await Promise.all([repo.getAllProfiles(),repo.getActiveProfile()]);
   const pendings=await Promise.all(all.map(async p=>{
    try{return [p.id,(await repo.getPendingEvents(p.id)).length] as const;}
    catch{return [p.id,-1] as const;}
   }));
   setProfiles(all);setActiveProfile(active);
   setPendingByProfile(Object.fromEntries(pendings));
   if(active){
    setPreview(active.avatarId);
    const snapshot=await getAvatarShop(repo,active.id,active.avatarId);
    setShop(snapshot);
   }else setShop(null);
  }catch(e){console.error('[Avatar collection] profiles',e);setError('Oyuncular veya ödüller yüklenemedi. Yeniden dene.');}
 },[]);
 useEffect(()=>{
  if(!isOpen)return;
  setCreating(false);setConfirmId(null);setNotice('');setError('');
  void loadProfiles();
 },[isOpen,loadProfiles]);
 if(!isOpen)return null;
 const selected=getAvatarById(preview);
 const unlocked=(id:string)=>Boolean(shop&&avatarIsOwned(shop.economy,id))||
  activeProfile?.avatarId===id;
 const owned=unlocked(preview);
 const available=VENTRA_AVATARS.filter(av=>filter==='all'||
  (filter==='available'?unlocked(av.id):!unlocked(av.id)));
 async function switchProfile(p:PlayerProfile){
  if(busy)return;
  if(p.id===activeProfile?.id){onClose();return;}
  setBusy(true);setError('');
  try{
   const next=await getProgressRepository().switchActiveProfile(p.id);
   setActiveProfile(next);onProfileSwitched(next);onClose();
  }catch(e){console.error(e);setError('Oyuncu değiştirilemedi.');}
  finally{setBusy(false);}
 }
 async function createProfile(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;
  const trimmed=nickname.trim();
  if(trimmed.length<2||trimmed.length>15){setError('Takma ad 2–15 karakter arasında olmalı.');return;}
  if(!VENTRA_STARTER_AVATARS.some(a=>a.id===newAvatar)){setError('Ücretsiz bir başlangıç avatarı seç.');return;}
  setBusy(true);setError('');
  try{
   const repo=getProgressRepository();
   const created=await repo.createProfile({nickname:trimmed,avatarId:newAvatar});
   await repo.switchActiveProfile(created.id);
   setNickname('');setCreating(false);
   onProfileSwitched(created);onClose();
  }catch(e){console.error(e);setError('Oyuncu profili oluşturulamadı.');}
  finally{setBusy(false);}
 }
 async function removeProfile(p:PlayerProfile){
  if(busy)return;
  if(p.userId){setError('Aileye bağlı profili yalnızca ebeveyn alanından silebilirsin.');onOpenParentGate?.();return;}
  if(profiles.length<=1){setError('En az bir oyuncu profili bulunmalı.');return;}
  if(!window.confirm('“'+p.nickname+'” profilini ve bu profile ait oyun ilerlemesini silmek istediğine emin misin?'))return;
  setBusy(true);setError('');
  try{
   await getProgressRepository().deleteProfile(p.id);
   await loadProfiles();
  }catch(e){console.error(e);setError('Profil silinemedi.');}
  finally{setBusy(false);}
 }
 async function updatePlacement(updates:Partial<Pick<PlayerProfile,'gradeLevel'|'englishLevel'>>){
  if(!activeProfile||busy)return false;
  setBusy(true);setError('');
  try{
   const updated=await getProgressRepository().updateProfile(activeProfile.id,updates);
   setActiveProfile(updated);setProfiles(list=>list.map(p=>p.id===updated.id?updated:p));
   onProfileSwitched(updated);return true;
  }catch(e){console.error(e);setError('Öğrenme tercihleri kaydedilemedi.');return false;}
  finally{setBusy(false);}
 }
 async function equipAvatar(pay:boolean){
  if(!activeProfile||busy)return;
  setBusy(true);setError('');setNotice('');
  try{
   const repo=getProgressRepository();
   let nextShop=shop;
   if(pay){
    const state=await purchaseAvatarWithCoins(repo,activeProfile.id,preview,activeProfile.avatarId);
    nextShop={economy:state,balance:state.entries.reduce((s,e)=>s+e.amount,0)};
    setShop(nextShop);
   }else if(!unlocked(preview)){
    setError('Bu avatar henüz açılmadı.');return;
   }
   const updated=await repo.updateProfile(activeProfile.id,{avatarId:preview});
   setActiveProfile(updated);setProfiles(list=>list.map(p=>p.id===updated.id?updated:p));
   onProfileSwitched(updated);soundService.playSfx('correct',.65);
   setConfirmId(null);
   setNotice(pay?'Yeni arkadaşın koleksiyonuna katıldı!':'Yeni avatarın hazır!');
  }catch(e){
   console.error('[Avatar collection] unlock/apply',e);
   // If the profile update fails after a successful coin purchase, ownership
   // is retained. Re-selecting the avatar applies it without spending twice.
   setError('Avatar uygulanamadı. Coin harcandıysa avatar koleksiyonunda kalır; yeniden seçebilirsin.');
  }finally{setBusy(false);}
 }
 const action=owned
  ?activeProfile?.avatarId===preview?'✓ Kullanılıyor':'Avatarımı Kullan'
  :shop&&shop.balance>=selected.price?'Coin ile Kilidi Aç':'Coin Biriktir';
 const affordable=Boolean(shop&&shop.balance>=selected.price);
 return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#030c20]/90 p-2 backdrop-blur-xl sm:p-4"
  onKeyDown={e=>{if(e.key==='Escape'&&!busy){e.stopPropagation();onClose();}}}>
  <div role="dialog" aria-modal="true" aria-label="Oyuncular ve avatar koleksiyonu"
   className="relative flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-y-auto rounded-[28px] border-2 border-sky-200/35 bg-gradient-to-br from-[#143c69] via-[#151b55] to-[#25134f] text-white shadow-[0_24px_85px_#010a29b8] sm:rounded-[35px]">
   <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
    <div className="absolute -top-24 right-4 h-72 w-72 rounded-full bg-fuchsia-400/15 blur-[80px]"/>
    <div className="absolute bottom-0 left-4 h-64 w-64 rounded-full bg-cyan-300/10 blur-[80px]"/>
   </div>
   <header className="relative flex items-center justify-between gap-3 border-b border-white/15 p-4 sm:px-7 sm:py-5">
    <div><p className="text-[10px] font-black uppercase tracking-[.25em] text-amber-200">✨ VENTRA KAHRAMANLARI</p>
     <h2 className="mt-1 text-xl font-black tracking-tight sm:text-3xl">{creating?'Yeni Kaşifini Oluştur':'Avatar Koleksiyonu'}</h2>
     <p className="mt-1 text-xs text-sky-100/80 sm:text-sm">{creating?'Bir arkadaş seç, maceran başlasın!':'Bir karakter seç, İngilizce maceralarına birlikte çıkın!'}</p>
    </div>
    <button type="button" aria-label="Pencereyi kapat" disabled={busy} onClick={onClose}
     className="grid min-h-11 min-w-11 place-items-center rounded-2xl border border-white/30 bg-white/10 text-xl font-black hover:bg-white/20 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300">✕</button>
   </header>
   {(error||notice)&&<div role="status" aria-live="polite" className={'relative mx-4 mt-3 rounded-xl border p-3 text-sm font-bold sm:mx-7 '+(error?'border-rose-300/50 bg-rose-950/65 text-rose-100':'border-lime-300/50 bg-emerald-700/40 text-lime-100')}>{error||notice}</div>}

   {creating?<form onSubmit={createProfile} className="relative space-y-5 p-4 sm:p-7">
    <p className="text-sm font-bold text-sky-100">Üç ücretsiz kahramandan birini seç:</p>
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
     {VENTRA_STARTER_AVATARS.map(av=><button type="button" key={av.id}
      onClick={()=>{setNewAvatar(av.id);soundService.playSfx('tap',.4);}}
      aria-pressed={newAvatar===av.id}
      className={'group flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-2 transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300 '+(newAvatar===av.id?'border-lime-200 bg-emerald-400/20 shadow-[0_0_25px_#b5fca04b]':'border-white/20 bg-white/5')}>
       <AvatarPortrait id={av.id} size={112} className="h-24 w-24 max-w-full transition-transform group-hover:scale-105"/>
       <strong className="text-center text-xs sm:text-sm">{av.name}</strong>
       <span className="text-[11px] font-black text-lime-200">ÜCRETSİZ</span>
      </button>)}
    </div>
    <label className="block text-sm font-bold text-white">Kaşifinin Takma Adı
     <input required minLength={2} maxLength={15} autoComplete="off" value={nickname}
      onChange={e=>setNickname(e.target.value)} placeholder="Örnek: Cesur Kaşif"
      className="mt-2 min-h-12 w-full rounded-xl border border-white/30 bg-[#091b39] p-3 text-white outline-none focus-visible:border-lime-300"/>
    </label>
    <p className="text-xs text-sky-100/70">Gerçek adını yazmana gerek yok. Yeni avatarlar oyun oynayarak kazanılan Coin ile açılır.</p>
    <div className="grid grid-cols-2 gap-3">
     <button type="button" onClick={()=>setCreating(false)} className="min-h-12 rounded-xl border border-white/25 bg-white/10 font-bold">← Geri</button>
     <button type="submit" disabled={busy} className="min-h-12 rounded-xl bg-gradient-to-r from-lime-300 to-emerald-300 px-4 font-black text-emerald-950 disabled:opacity-50">Macera Başlasın →</button>
    </div>
   </form>:<div className="relative grid gap-5 p-4 lg:grid-cols-[250px_minmax(0,1fr)] lg:p-6">
     <aside className="space-y-3">
      <div className="rounded-[22px] border border-white/20 bg-[#051b38]/45 p-3">
       <h3 className="mb-2 px-1 text-xs font-black uppercase tracking-widest text-sky-100">Kaşiflerim</h3>
       <div className="space-y-2">
       {profiles.map(p=>{
        const selected=p.id===activeProfile?.id;
        return <div key={p.id} className={'flex min-w-0 items-center gap-1 rounded-xl border '+(selected?'border-lime-300/70 bg-emerald-400/15':'border-white/10 bg-white/5')}>
         <button type="button" disabled={busy} onClick={()=>void switchProfile(p)}
          aria-current={selected?'true':undefined}
          className="flex min-h-14 min-w-0 flex-1 items-center gap-2 p-2 text-left focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300">
          <AvatarPortrait id={p.avatarId} size={44} className="h-11 w-11 shrink-0"/>
          <span className="min-w-0"><strong className="block truncate text-xs">{p.nickname}</strong>
           <small className="block text-[10px] text-sky-100/70">{selected?'✓ Oynuyorsun':p.userId&&p.isCloudSynced&&pendingByProfile[p.id]===0?'Kayıtlı profil':'Macera arkadaşın'}</small>
          </span>
         </button>
         {profiles.length>1&&<button type="button" disabled={busy} onClick={()=>void removeProfile(p)}
          title="Profili Sil" aria-label={p.nickname+' profilini sil'} className="min-h-11 min-w-9 text-xs text-rose-200/75 hover:text-rose-100">✕</button>}
        </div>;
       })}
       </div>
       <button type="button" disabled={busy} onClick={()=>{setCreating(true);setError('');}}
        className="mt-3 min-h-12 w-full rounded-xl border border-dashed border-emerald-200/65 bg-emerald-300/10 text-sm font-bold text-emerald-100">＋ Yeni Kaşif Ekle</button>
      </div>
      {onOpenParentGate&&<button type="button" onClick={onOpenParentGate}
       className="min-h-11 w-full rounded-xl border border-white/20 bg-white/10 p-2 text-xs font-bold text-sky-100">🛡️ Ebeveyn Alanı</button>}
      {activeProfile&&<div className="rounded-[22px] border border-white/20 bg-[#051b38]/45 p-3">
       <h3 className="text-xs font-black text-sky-100">📚 Öğrenme Tercihleri</h3>
       <label className="mt-3 block text-xs font-bold text-sky-200">Sınıf
        <select value={activeProfile.gradeLevel??''} disabled={busy}
         onChange={e=>void updatePlacement({gradeLevel:e.target.value?Number(e.target.value):null})}
         className="mt-1 min-h-11 w-full rounded-xl border border-white/20 bg-[#122c52] px-2 text-white">
         <option value="">Belirtilmedi</option>{[1,2,3,4,5,6,7,8].map(x=><option key={x} value={x}>{x}. sınıf</option>)}
        </select>
       </label>
       <label className="mt-3 block text-xs font-bold text-sky-200">İngilizce
        <select value={activeProfile.englishLevel??'Pre-A1'} disabled={busy}
         onChange={e=>void updatePlacement({englishLevel:e.target.value as 'Pre-A1'|'A1'|'A2'})}
         className="mt-1 min-h-11 w-full rounded-xl border border-white/20 bg-[#122c52] px-2 text-white">
         <option value="Pre-A1">Yeni başlıyorum</option><option value="A1">A1</option><option value="A2">A2</option>
        </select>
       </label>
       {!placementOpen&&<button type="button" disabled={busy} onClick={()=>setPlacementOpen(true)}
        className="mt-3 min-h-11 w-full rounded-xl border border-lime-300/30 bg-lime-300/10 px-2 text-xs font-black text-lime-100">🧭 Başlangıç Yoklaması</button>}
       {placementOpen&&<div className="mt-3"><StarterPlacementCheck saving={busy} onCancel={()=>setPlacementOpen(false)}
        onApply={async level=>{if(!await updatePlacement({englishLevel:level}))throw Error('Kaydedilemedi');setPlacementOpen(false);}}/></div>}
      </div>}
     </aside>
     <section className="min-w-0 space-y-4">
      <div className="grid items-center gap-3 rounded-[25px] border border-amber-200/30 bg-gradient-to-r from-[#273f85] via-[#402f8a] to-[#663994] p-3 sm:grid-cols-[170px_1fr] sm:gap-5 sm:p-5">
       <div className="flex justify-center">
        <div key={preview} className="relative rounded-[28px] bg-white/10 p-2 shadow-[0_0_36px_#d4aaff55] motion-safe:animate-[avatar-reveal_.35s_ease-out]">
         <AvatarPortrait id={preview} size={154} className="h-36 w-36 sm:h-40 sm:w-40"/>
         <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-100/65 bg-[#142451] px-3 py-1 text-[11px] font-bold text-amber-100">{selected.rarity==='starter'?'✨ Başlangıç':selected.rarity==='legendary'?'👑 Efsane':'🌟 Nadir'}</span>
        </div>
       </div>
       <div className="text-center sm:text-left">
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/45 bg-amber-100/15 px-3 py-1 text-xs font-black text-amber-100">🪙 {shop?.balance??'—'} Ventra Coin</span>
        <h3 className="mt-3 text-xl font-black sm:text-2xl">{selected.name}</h3>
        <p className="mt-1 text-xs text-indigo-100 sm:text-sm">{selected.tagline}</p>
        <p className="mt-2 text-xs font-bold text-lime-200">{owned?'✓ Koleksiyonunda':selected.price+' Coin ile açılır'}</p>
       </div>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Avatarları filtrele">
       {([{id:'all',label:'Tümü'},{id:'available',label:'Açık Avatarlar'},{id:'locked',label:'Kilidi Açılacaklar'}] as const).map(tab=>
        <button key={tab.id} type="button" aria-pressed={filter===tab.id} onClick={()=>setFilter(tab.id)}
         className={'min-h-10 rounded-full border px-3 text-xs font-bold '+(filter===tab.id?'border-cyan-200 bg-sky-500 text-white':'border-white/20 bg-white/10 text-indigo-100')}>{tab.label}</button>)}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6" role="group" aria-label="Avatar koleksiyonu">
       {available.map(av=>{
        const selectedTile=av.id===preview,has=unlocked(av.id);
        return <button type="button" key={av.id} disabled={busy} aria-pressed={selectedTile}
         aria-label={av.name+(has?'':' kilitli '+av.price+' coin')}
         onClick={()=>{setPreview(av.id);setConfirmId(null);setNotice('');soundService.playSfx('tap',.3);}}
         className={'group relative flex min-h-32 min-w-0 flex-col items-center gap-1.5 overflow-hidden rounded-2xl border-2 p-2 text-center transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300 '+(selectedTile?'border-lime-200 bg-emerald-400/20 shadow-[0_0_24px_#86fff14d]':'border-white/20 bg-[#0b2350]/70 hover:border-sky-200/65')}>
         <AvatarPortrait id={av.id} size={88} className={'h-20 w-20 max-w-full transition-transform group-hover:scale-105 '+(!has?'saturate-75':'')}/>
         <strong className="w-full truncate text-[11px]">{av.name}</strong>
         <span className={'text-[10px] font-black '+(has?'text-lime-200':'text-amber-200')}>{has?'✓ Açık':'🔒 '+av.price+' 🪙'}</span>
        </button>;
       })}
      </div>
      {available.length===0&&<p className="p-5 text-center text-sm text-sky-100">Bu bölümde henüz avatar yok.</p>}
      {confirmId===preview&&!owned?<div role="group" aria-label="Avatarı açmayı onayla"
        className="rounded-2xl border border-amber-300/50 bg-amber-200/10 p-4 text-center">
       <p className="text-sm font-bold">🪙 {selected.price} Coin harcayarak {selected.name} avatarını açmak istiyor musun?</p>
       <div className="mt-3 flex justify-center gap-2">
        <button type="button" disabled={busy} onClick={()=>setConfirmId(null)} className="min-h-11 rounded-xl border border-white/30 px-5 font-bold">Vazgeç</button>
        <button type="button" disabled={busy} onClick={()=>void equipAvatar(true)} className="min-h-11 rounded-xl bg-lime-300 px-5 font-black text-emerald-950 disabled:opacity-50">Evet, Kilidi Aç</button>
       </div>
      </div>:<button type="button" disabled={busy||(!owned&&!affordable)||activeProfile?.avatarId===preview}
       onClick={()=>{if(owned)void equipAvatar(false);else setConfirmId(preview);}}
       className="min-h-14 w-full rounded-2xl border-2 border-white/80 bg-gradient-to-r from-lime-300 to-emerald-300 px-5 text-sm font-black text-emerald-950 shadow-[0_5px_0_#298e80] transition hover:brightness-110 disabled:opacity-60">
       {busy?'Kaydediliyor…':action} {activeProfile?.avatarId===preview?'':' →'}
      </button>}
      <p className="text-center text-xs leading-relaxed text-indigo-100/80">✨ Görevleri bitir, Ventra Coin kazan ve yeni macera arkadaşlarının kilidini aç. Coin ve avatarların şu an bu cihazda saklanır.</p>
     </section>
   </div>}
  </div>
 </div>;
};
