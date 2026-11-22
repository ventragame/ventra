'use client';

import React,{useCallback,useEffect,useRef,useState} from 'react';
import {
  VENTRA_AVATARS,VENTRA_STARTER_AVATARS,AVATAR_COLLECTIONS,getAvatarById,
  type PlayerProfile
} from '@ventra/shared';
import {getProgressRepository} from '@/lib/progress';
import {getAvatarShop,purchaseAvatarWithCoins} from '@/lib/rewards/economyRepository';
import {avatarIsOwned,type EconomyState} from '@/lib/rewards/economyEngine';
import {soundService} from '@/lib/audio/SoundService';
import {AvatarPortrait} from './AvatarPortrait';
import './avatar-collection.css';
import './profile-hub.css';
import {StarterPlacementCheck} from './StarterPlacementCheck';
import {ParentalGateModal} from './ParentalGateModal';
import {useDialogFocus} from '@/lib/a11y/useDialogFocus';
import {useFocusRescue} from '@/lib/a11y/useFocusRescue';
import {ENGLISH_LEVEL_CHOICES,GRADE_CHOICES,lastPlayedLabel,nicknameProblem,playerDetail,type EnglishLevel} from '@/lib/profile/profileHub';

interface ProfileSelectorModalProps{
 isOpen:boolean;
 onClose:()=>void;
 onProfileSwitched:(profile:PlayerProfile)=>void;
 onOpenParentGate?:()=>void;
}
type Filter='all'|'available'|'locked';
type Collection='all'|'heroes'|'animals'|'fantasy'|'space';
type Shop={economy:EconomyState;balance:number};
type Tab='avatar'|'players'|'level';
const TABS:ReadonlyArray<{id:Tab;icon:string;label:string}>=[
 {id:'avatar',icon:'✨',label:'Avatarım'},
 {id:'players',icon:'🧭',label:'Kaşiflerim'},
 {id:'level',icon:'📚',label:'Seviyem'}
];

/** The child's hub: avatar wardrobe, the players on this device and the
 * learning level, as three tabs. Avatar purchases are atomic per child;
 * cloud account data is never modified by merely opening a preview. No
 * real-money checkout exists here. */
export const ProfileSelectorModal:React.FC<ProfileSelectorModalProps>=({
 isOpen,onClose,onProfileSwitched,onOpenParentGate
})=>{
 const [profiles,setProfiles]=useState<PlayerProfile[]>([]);
 const [activeProfile,setActiveProfile]=useState<PlayerProfile|null>(null);
 const [pendingByProfile,setPendingByProfile]=useState<Record<string,number>>({});
 const [starsByProfile,setStarsByProfile]=useState<Record<string,number|null>>({});
 const [shop,setShop]=useState<Shop|null>(null);
 const [tab,setTab]=useState<Tab>('avatar');
 const [preview,setPreview]=useState('avatar_explorer');
 const [filter,setFilter]=useState<Filter>('all');
 const [collection,setCollection]=useState<Collection>('all');
 const [search,setSearch]=useState('');
 const [confirmId,setConfirmId]=useState<string|null>(null);
 // Deleting a child erases their progress on this device: an adult confirms
 // through the parental gate (a sibling cannot do it with one tap).
 const [deleteCandidate,setDeleteCandidate]=useState<PlayerProfile|null>(null);
 const deleteTrigger=useRef<HTMLElement|null>(null);
 // Focus moves into the dialog on open (so Escape works at once), stays inside
 // and returns to the opener on close.
 const dialogRef=useRef<HTMLDivElement>(null);
 useDialogFocus(dialogRef,isOpen);
 const tabRefs=useRef<Partial<Record<Tab,HTMLButtonElement|null>>>({});
 const bodyRef=useRef<HTMLDivElement>(null);
 const [creating,setCreating]=useState(false);
 const [nickname,setNickname]=useState('');
 const [newAvatar,setNewAvatar]=useState(VENTRA_STARTER_AVATARS[0].id);
 const [newLevel,setNewLevel]=useState<EnglishLevel>('Pre-A1');
 const [newGrade,setNewGrade]=useState('');
 const [placementOpen,setPlacementOpen]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 useFocusRescue(dialogRef,isOpen&&!deleteCandidate,[tab,creating,confirmId,profiles,placementOpen,busy,deleteCandidate]);
 const loadProfiles=useCallback(async()=>{
  try{
   const repo=getProgressRepository();
   const [all,active]=await Promise.all([repo.getAllProfiles(),repo.getActiveProfile()]);
   const [pendings,stars]=await Promise.all([
    Promise.all(all.map(async p=>{
     try{return [p.id,(await repo.getPendingEvents(p.id)).length] as const;}
     catch{return [p.id,-1] as const;}
    })),
    Promise.all(all.map(async p=>{
     try{return [p.id,await repo.getTotalStars(p.id)] as const;}
     catch{return [p.id,null] as const;}
    }))
   ]);
   setProfiles(all);setActiveProfile(active);
   setPendingByProfile(Object.fromEntries(pendings));
   setStarsByProfile(Object.fromEntries(stars));
   if(active){
    setPreview(active.avatarId);
    const snapshot=await getAvatarShop(repo,active.id,active.avatarId);
    setShop(snapshot);
   }else setShop(null);
  }catch(e){console.error('[Avatar collection] profiles',e);setError('Oyuncular veya ödüller yüklenemedi. Yeniden dene.');}
 },[]);
 useEffect(()=>{
  if(!isOpen)return;
  setCreating(false);setConfirmId(null);setNotice('');setError('');setPlacementOpen(false);
  setCollection('all');setFilter('all');setSearch('');setTab('avatar');
  void loadProfiles();
 },[isOpen,loadProfiles]);
 if(!isOpen)return null;
 const selected=getAvatarById(preview);
 const unlocked=(id:string)=>getAvatarById(id).price===0||
  Boolean(shop&&avatarIsOwned(shop.economy,id))||activeProfile?.avatarId===id;
 const owned=unlocked(preview);
 const available=VENTRA_AVATARS.filter(av=>(collection==='all'||av.collection===collection)&&
  (filter==='all'||(filter==='available'?unlocked(av.id):!unlocked(av.id)))&&
  (search.trim()===''||av.name.toLocaleLowerCase('tr-TR').includes(search.trim().toLocaleLowerCase('tr-TR'))));
 const collectionName=AVATAR_COLLECTIONS.find(x=>x.id===selected.collection)?.name??'Kahramanlar';
 const ownedCount=VENTRA_AVATARS.filter(av=>unlocked(av.id)).length;
 const missingCoins=shop?Math.max(0,selected.price-shop.balance):selected.price;
 const activeStars=activeProfile?starsByProfile[activeProfile.id]:null;
 const selectPreview=(id:string)=>{
  setPreview(id);setConfirmId(null);setNotice('');
  soundService.playSfx('tap',0.32);
 };
 const cyclePreview=(direction:1|-1)=>{
  if(!available.length)return;
  const index=available.findIndex(av=>av.id===preview);
  const next=(index+direction+available.length)%available.length;
  selectPreview(available[next].id);
 };
 const openTab=(next:Tab)=>{
  setTab(next);setConfirmId(null);setNotice('');setError('');
  bodyRef.current?.scrollTo({top:0});
 };
 const onTabKey=(event:React.KeyboardEvent)=>{
  const index=TABS.findIndex(t=>t.id===tab);
  const target=event.key==='ArrowRight'?(index+1)%TABS.length:event.key==='ArrowLeft'?(index-1+TABS.length)%TABS.length:
   event.key==='Home'?0:event.key==='End'?TABS.length-1:-1;
  if(target<0)return;
  event.preventDefault();
  const next=TABS[target].id;openTab(next);tabRefs.current[next]?.focus();
 };
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
  const problem=nicknameProblem(trimmed);
  if(problem){setError(problem);return;}
  if(!VENTRA_STARTER_AVATARS.some(a=>a.id===newAvatar)){setError('Ücretsiz bir başlangıç avatarı seç.');return;}
  setBusy(true);setError('');
  try{
   const repo=getProgressRepository();
   const created=await repo.createProfile({nickname:trimmed,avatarId:newAvatar,
    gradeLevel:newGrade?Number(newGrade):null,englishLevel:newLevel});
   await repo.switchActiveProfile(created.id);
   setNickname('');setNewGrade('');setNewLevel('Pre-A1');setCreating(false);
   onProfileSwitched(created);onClose();
  }catch(e){console.error(e);setError('Oyuncu profili oluşturulamadı.');}
  finally{setBusy(false);}
 }
 async function removeProfile(p:PlayerProfile){
  if(busy)return;
  if (p.userId){setError('Aileye bağlı profili yalnızca ebeveyn alanından silebilirsin.');onOpenParentGate?.();return;}
  if(profiles.length<=1){setError('En az bir oyuncu profili bulunmalı.');return;}
  deleteTrigger.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  setError('');setDeleteCandidate(p);
 }
 async function deleteConfirmedProfile(p:PlayerProfile){
  if(busy)return;
  setBusy(true);setError('');
  try{
   const repo=getProgressRepository();
   await repo.deleteProfile(p.id);
   await loadProfiles();
   // Deleting the child who is playing: the repository already activated a
   // replacement, the page must switch too or games keep saving to a deleted ID.
   if(p.id===activeProfile?.id){
    const replacement=await repo.getActiveProfile();
    if(replacement)onProfileSwitched(replacement);
   }
   setNotice(p.nickname+' profili bu cihazdan silindi.');
  }catch(e){console.error(e);setError('Profil silinemedi.');}
  finally{setBusy(false);}
 }
 async function updatePlacement(updates:Partial<Pick<PlayerProfile,'gradeLevel'|'englishLevel'>>){
  if(!activeProfile||busy)return false;
  setBusy(true);setError('');setNotice('');
  try{
   const updated=await getProgressRepository().updateProfile(activeProfile.id,updates);
   setActiveProfile(updated);setProfiles(list=>list.map(p=>p.id===updated.id?updated:p));
   onProfileSwitched(updated);soundService.playSfx('tap',.4);
   setNotice('Kaydedildi: '+playerDetail(updated)+'.');
   return true;
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
 const inUse=activeProfile?.avatarId===preview;
 const action=owned
  ?inUse?'✓ Kullanılıyor':'Avatarımı Kullan'
  :shop&&shop.balance>=selected.price?'Coin ile Kilidi Aç':'Coin Biriktir';
 const affordable=Boolean(shop&&shop.balance>=selected.price);
 const cloudLabel=(p:PlayerProfile)=>!p.userId?'📱 Bu cihazda':
  pendingByProfile[p.id]>0?`☁️ ${pendingByProfile[p.id]} oyun yedek bekliyor`:'☁️ Aileye yedekli';
 return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#030c20]/90 p-2 backdrop-blur-xl sm:p-4"
  onKeyDown={e=>{if(e.key==='Escape'&&!busy&&!deleteCandidate){e.stopPropagation();onClose();}}}>
  <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Oyuncular ve avatar koleksiyonu"
   className="avatar-v2 ph-dialog relative flex outline-none h-[min(96dvh,880px)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border-2 border-sky-200/35 bg-gradient-to-br from-[#143c69] via-[#151b55] to-[#25134f] text-white shadow-[0_24px_85px_#010a29b8] sm:rounded-[35px]">
   <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
    <div className="absolute -top-24 right-4 h-72 w-72 rounded-full bg-fuchsia-400/15 blur-[80px]"/>
    <div className="absolute bottom-0 left-4 h-64 w-64 rounded-full bg-cyan-300/10 blur-[80px]"/>
   </div>
   <header className="ph-head relative flex items-center justify-between gap-3 px-4 pb-3 pt-4 sm:px-7 sm:pt-5">
    <div className="flex min-w-0 items-center gap-3">
     {activeProfile&&!creating&&<AvatarPortrait id={activeProfile.avatarId} size={64} className="ph-head-avatar h-14 w-14 shrink-0 rounded-2xl sm:h-16 sm:w-16"/>}
     <div className="min-w-0">
      <p className="text-xs font-black uppercase tracking-[.22em] text-amber-200">✨ Kaşif merkezi</p>
      <h2 className="truncate text-xl font-black tracking-tight sm:text-3xl">{creating?'Yeni kaşif':activeProfile?.nickname??'Kaşiflerim'}</h2>
      {!creating&&activeProfile&&<p className="ph-head-stats mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm font-bold text-sky-100/90">
       <span>⭐ {activeStars??'—'} yıldız</span><span>🪙 {shop?.balance??'—'} coin</span><span className="ph-head-level">{playerDetail(activeProfile)}</span>
      </p>}
     </div>
    </div>
    <button type="button" aria-label="Pencereyi kapat" disabled={busy} onClick={onClose}
     className="grid min-h-12 min-w-12 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/10 text-xl font-black hover:bg-white/20 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300">✕</button>
   </header>
   {!creating&&<div role="tablist" aria-label="Kaşif merkezi bölümleri" className="ph-tabs relative mx-4 grid grid-cols-3 gap-1 rounded-2xl border border-white/15 bg-[#06153a]/70 p-1 sm:mx-7" onKeyDown={onTabKey}>
    {TABS.map(t=><button key={t.id} ref={el=>{tabRefs.current[t.id]=el;}} type="button" role="tab" id={'ph-tab-'+t.id}
     aria-selected={tab===t.id} aria-controls={'ph-panel-'+t.id} tabIndex={tab===t.id?0:-1} onClick={()=>openTab(t.id)}
     className={'ph-tab'+(tab===t.id?' ph-tab--active':'')}>
     <span aria-hidden="true">{t.icon}</span> {t.label}{t.id==='players'&&profiles.length>1&&<span className="ph-tab-count">{profiles.length}</span>}
    </button>)}
   </div>}
   {(error||notice)&&<div role="status" aria-live="polite" className={'relative mx-4 mt-3 rounded-xl border p-3 text-sm font-bold sm:mx-7 '+(error?'border-rose-300/50 bg-rose-950/65 text-rose-100':'border-lime-300/50 bg-emerald-700/40 text-lime-100')}>{error||notice}</div>}

   <div ref={bodyRef} className="ph-body relative min-h-0 flex-1 overflow-y-auto">
   {creating?<form onSubmit={createProfile} className="space-y-5 p-4 sm:p-7">
    <button type="button" onClick={()=>{setCreating(false);setError('');}} className="flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-bold text-sky-100 hover:text-white">← Kaşiflerime dön</button>
    <label className="block text-sm font-bold text-white">Kaşifinin takma adı
     <input required minLength={2} maxLength={15} autoComplete="off" value={nickname}
      onChange={e=>setNickname(e.target.value)} placeholder="Örnek: Cesur Kaşif"
      className="mt-2 min-h-14 w-full rounded-2xl border border-white/30 bg-[#091b39] px-4 text-base text-white outline-none focus-visible:border-lime-300 focus-visible:ring-4 focus-visible:ring-lime-300/20"/>
    </label>
    <p className="-mt-3 text-xs text-sky-100/75">Gerçek adını yazmana gerek yok.</p>
    <fieldset>
     <legend className="text-sm font-bold text-white">İlk macera arkadaşı · 5 ücretsiz kahraman</legend>
     <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
      {VENTRA_STARTER_AVATARS.map(av=><button type="button" key={av.id}
       onClick={()=>{setNewAvatar(av.id);soundService.playSfx('tap',.4);}}
       aria-pressed={newAvatar===av.id}
       className={'group flex min-h-32 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-2 transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300 '+(newAvatar===av.id?'border-lime-200 bg-emerald-400/20 shadow-[0_0_25px_#b5fca04b]':'border-white/20 bg-white/5')}>
        <AvatarPortrait id={av.id} size={96} className="h-20 w-20 max-w-full transition-transform group-hover:scale-105"/>
        <strong className="text-center text-xs sm:text-sm">{av.name}</strong>
       </button>)}
     </div>
    </fieldset>
    <fieldset>
     <legend className="text-sm font-bold text-white">İngilizcede nerede?</legend>
     <div className="mt-2 grid gap-2 sm:grid-cols-3">
      {ENGLISH_LEVEL_CHOICES.map(choice=><button type="button" key={choice.id} aria-pressed={newLevel===choice.id}
       onClick={()=>setNewLevel(choice.id)} className={'ph-option'+(newLevel===choice.id?' ph-option--on':'')}>
       <span aria-hidden="true" className="text-2xl">{choice.icon}</span>
       <span className="min-w-0"><strong className="block text-sm">{choice.title}</strong><span className="block text-xs text-sky-100/80">{choice.hint}</span></span>
      </button>)}
     </div>
    </fieldset>
    <label className="block text-sm font-bold text-white">Sınıf <span className="font-normal text-sky-100/70">(isteğe bağlı)</span>
     <select value={newGrade} onChange={e=>setNewGrade(e.target.value)}
      className="mt-2 block min-h-12 w-full rounded-2xl border border-white/30 bg-[#091b39] px-3 text-base text-white sm:max-w-xs">
      <option value="">Şimdilik seçme</option>{GRADE_CHOICES.map(n=><option key={n} value={n}>{n}. sınıf</option>)}
     </select>
    </label>
    <p className="text-xs leading-relaxed text-sky-100/75">Her kaşifin yıldızları, avatarları ve görevleri ayrı tutulur. Yeni avatarlar İngilizce görevlerinden kazanılan coin ile açılır.</p>
    <button type="submit" disabled={busy} className="min-h-14 w-full rounded-2xl bg-gradient-to-r from-lime-300 to-emerald-300 px-4 text-base font-black text-emerald-950 shadow-[0_5px_0_#298e80] disabled:opacity-50">{busy?'Kaydediliyor…':'Macera Başlasın →'}</button>
   </form>
   :tab==='avatar'?<div role="tabpanel" id="ph-panel-avatar" aria-labelledby="ph-tab-avatar" className="ph-avatar-layout grid gap-4 p-4 sm:p-7 lg:grid-cols-[300px_minmax(0,1fr)]">
     <div className="avatar-showcase ph-showcase relative overflow-hidden rounded-[26px] border border-amber-200/35 p-3 sm:p-5"
       style={{'--avatar-accent':selected.accentColor,'--avatar-background':selected.bgColor} as React.CSSProperties}>
      <div className="ph-stage relative flex items-center justify-center gap-2">
       <button type="button" aria-label="Önceki avatar" disabled={!available.length||busy}
        onClick={()=>cyclePreview(-1)} className="avatar-stage-arrow">‹</button>
       <div key={preview} className="avatar-stage-avatar relative rounded-[30px] border border-white/35 bg-white/10 p-2">
        <AvatarPortrait id={preview} size={174} className="ph-stage-portrait h-36 w-36 sm:h-44 sm:w-44"/>
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-amber-100/65 bg-[#142451] px-3 py-1 text-xs font-bold text-amber-100">{selected.rarity==='starter'?'✨ Başlangıç':selected.rarity==='legendary'?'👑 Efsane':'🌟 Nadir'}</span>
       </div>
       <button type="button" aria-label="Sonraki avatar" disabled={!available.length||busy}
        onClick={()=>cyclePreview(1)} className="avatar-stage-arrow">›</button>
      </div>
      <div className="ph-showcase-text relative mt-5 min-w-0 text-center">
       <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold text-sky-100">{collectionName}</span>
       <h3 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{selected.name}</h3>
       <p className="mt-1 text-sm text-indigo-100">{selected.tagline}</p>
       <p className="mt-2 text-sm font-black text-lime-200">{owned?'✓ Koleksiyonunda':'🔒 '+selected.price+' coin ile açılır'}</p>
      </div>
     </div>
     <div className="min-w-0 space-y-3">
      <div className="rounded-2xl border border-white/15 bg-[#061b40]/45 p-3">
       <div className="flex items-center justify-between gap-2 text-sm font-bold text-sky-100">
        <span>✨ Kahraman koleksiyonum</span><span>{shop?ownedCount:'…'} / {VENTRA_AVATARS.length}</span>
       </div>
       <div role="progressbar" aria-label="Açılmış avatarlar" aria-valuemin={0} aria-valuemax={VENTRA_AVATARS.length} aria-valuenow={ownedCount}
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/35">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-sky-300 to-amber-200 transition-[width] duration-300"
          style={{width:`${ownedCount/VENTRA_AVATARS.length*100}%`}}/>
       </div>
      </div>
      <div className="ph-chip-row flex gap-2" role="group" aria-label="Koleksiyon kategorileri">
       <button type="button" aria-pressed={collection==='all'} onClick={()=>{setCollection('all');setConfirmId(null);}}
        className={'avatar-filter '+(collection==='all'?'avatar-filter--active':'')}>🌈 Hepsi <span>{VENTRA_AVATARS.length}</span></button>
       {AVATAR_COLLECTIONS.map(group=><button type="button" key={group.id} aria-pressed={collection===group.id}
        onClick={()=>{setCollection(group.id);setConfirmId(null);}}
        className={'avatar-filter '+(collection===group.id?'avatar-filter--active':'')}>
        {group.icon} {group.name} <span>{VENTRA_AVATARS.filter(a=>a.collection===group.id).length}</span>
       </button>)}
      </div>
      <div className="flex items-center gap-2">
       <div className="ph-segment grid min-w-0 flex-1 grid-cols-3 gap-1 rounded-2xl border border-white/15 bg-[#06153a]/60 p-1 sm:max-w-md" role="group" aria-label="Avatarları filtrele">
        {([{id:'all',label:'Tümü'},{id:'available',label:'Açtıklarım'},{id:'locked',label:'Keşfedilecek'}] as const).map(t=>
         <button key={t.id} type="button" aria-pressed={filter===t.id} onClick={()=>{setFilter(t.id);setConfirmId(null);}}
          className={'min-h-11 rounded-xl px-2 text-sm font-bold '+(filter===t.id?'bg-sky-400 text-slate-950':'text-indigo-100 hover:bg-white/10')}>{t.label}</button>)}
       </div>
       <label className="relative hidden min-w-0 flex-1 sm:block sm:max-w-[220px]">
        <span className="sr-only">Avatar ara</span>
        <input type="search" value={search} onChange={event=>setSearch(event.target.value)}
         placeholder="🔎 Avatar ara" aria-label="Avatar ara"
         className="min-h-12 w-full rounded-2xl border border-white/25 bg-[#0a2051]/70 px-3 text-sm text-white placeholder:text-sky-200/65 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300"/>
       </label>
      </div>
      <div className="avatar-gallery grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-[#061632]/35 p-2 sm:grid-cols-4 xl:grid-cols-5" role="group" aria-label="Avatar koleksiyonu">
       {available.map(av=>{
        const selectedTile=av.id===preview,has=unlocked(av.id);
        return <button type="button" key={av.id} disabled={busy} aria-pressed={selectedTile}
         aria-label={av.name+(has?'':' kilitli '+av.price+' coin')}
         onClick={()=>selectPreview(av.id)}
         className={'avatar-tile group relative flex min-h-32 min-w-0 flex-col items-center gap-1.5 overflow-hidden rounded-2xl border-2 p-2 text-center transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-300 '+(selectedTile?'border-lime-200 bg-emerald-400/20 shadow-[0_0_24px_#86fff14d]':'border-white/20 bg-[#0b2350]/70 hover:border-sky-200/65')}>
         <AvatarPortrait id={av.id} size={88} className={'h-20 w-20 max-w-full transition-transform group-hover:scale-105 '+(!has?'saturate-75':'')}/>
         <strong className="w-full truncate text-xs">{av.name}</strong>
         <span className={'text-xs font-black '+(has?'text-lime-200':'text-amber-200')}>{has?'✓ Açık':'🔒 '+av.price+' 🪙'}</span>
         {activeProfile?.avatarId===av.id&&<span className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-lime-300 text-xs font-black text-emerald-950" aria-label="Kullanılıyor">✓</span>}
        </button>;
       })}
      </div>
      {available.length===0&&<div className="rounded-2xl border border-white/20 bg-white/5 p-5 text-center text-sm text-sky-100">
       Bu filtrede avatar bulunamadı. <button type="button" className="min-h-11 font-black text-lime-200 underline" onClick={()=>{setFilter('all');setCollection('all');setSearch('');}}>Tüm karakterleri göster</button>
      </div>}
      <p className="text-center text-xs leading-relaxed text-indigo-100/80">✨ İngilizce görevlerini tamamlayarak Ventra Coin kazanırsın. Avatarlar yalnızca oyun içi coin ile açılır; gerçek para yoktur. Coin ve koleksiyon bu cihazda saklanır.</p>
     </div>
    </div>
   :tab==='players'?<div role="tabpanel" id="ph-panel-players" aria-labelledby="ph-tab-players" className="space-y-4 p-4 sm:p-7">
     <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {profiles.map(p=>{
       const current=p.id===activeProfile?.id;
       return <li key={p.id} className={'ph-player'+(current?' ph-player--current':'')}>
        <button type="button" disabled={busy} onClick={()=>void switchProfile(p)}
         aria-current={current?'true':undefined} className="ph-player-main">
         <AvatarPortrait id={p.avatarId} size={72} className="h-[72px] w-[72px] shrink-0 rounded-2xl"/>
         <span className="min-w-0 flex-1">
          <strong className="block truncate text-lg font-black">{p.nickname}</strong>
          <span className="block truncate text-xs text-sky-100/80">{playerDetail(p)}</span>
          <span className="mt-1.5 flex flex-wrap gap-1.5">
           <span className="ph-chip">⭐ {starsByProfile[p.id]??'—'}</span>
           <span className="ph-chip">{cloudLabel(p)}</span>
          </span>
         </span>
        </button>
        <div className="ph-player-foot">
         <span className="min-w-0 truncate">{current?'✓ Şu an oynuyor':lastPlayedLabel(p.lastPlayedAt)}</span>
         {profiles.length>1&&<button type="button" disabled={busy} onClick={()=>void removeProfile(p)}
          aria-label={p.nickname+' profilini sil'} className="ph-player-delete">🗑️ Sil</button>}
        </div>
       </li>;
      })}
      <li><button type="button" disabled={busy} onClick={()=>{setCreating(true);setError('');setNotice('');}}
       className="ph-player-add">
       <span aria-hidden="true" className="grid h-14 w-14 place-items-center rounded-2xl border-2 border-dashed border-emerald-200/70 text-3xl">＋</span>
       <span><strong className="block text-base font-black">Yeni Kaşif Ekle</strong><span className="block text-xs text-emerald-50/80">Kardeşin için ayrı yıldız, avatar ve görevler</span></span>
      </button></li>
     </ul>
     <p className="text-xs leading-relaxed text-sky-100/75">Bir kaşife dokununca oyun onunla devam eder. Silmek için bir yetişkin onayı gerekir.</p>
     {onOpenParentGate&&<button type="button" onClick={onOpenParentGate}
      className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-amber-200/30 bg-amber-300/10 px-4 text-left text-sm font-bold text-amber-50 hover:bg-amber-300/20 sm:max-w-md">
      <span aria-hidden="true" className="text-2xl">🛡️</span>
      <span className="min-w-0 flex-1"><strong className="block font-black">Ebeveyn Alanı</strong><span className="block text-xs font-semibold text-amber-50/80">Yedekleme, aile hesabı ve İngilizce karnesi</span></span>
      <span aria-hidden="true">→</span>
     </button>}
    </div>
   :<div role="tabpanel" id="ph-panel-level" aria-labelledby="ph-tab-level" className="grid gap-4 p-4 sm:p-7 lg:grid-cols-2">
     {activeProfile&&<>
      <section aria-labelledby="ph-level-title" className="ph-card">
       <h3 id="ph-level-title" className="text-lg font-black">İngilizcem</h3>
       <p className="mt-1 text-sm leading-relaxed text-sky-100/80">Oyunlar kelime ve cümle zorluğunu buna göre seçer. Bir sınav sonucu değildir; dilediğin zaman değiştirebilirsin.</p>
       <div role="group" aria-labelledby="ph-level-title" className="mt-3 grid gap-2">
        {ENGLISH_LEVEL_CHOICES.map(choice=>{const on=(activeProfile.englishLevel??'Pre-A1')===choice.id;
         return <button key={choice.id} type="button" aria-pressed={on} disabled={busy}
          onClick={()=>{if(!on)void updatePlacement({englishLevel:choice.id});}} className={'ph-option'+(on?' ph-option--on':'')}>
          <span aria-hidden="true" className="text-2xl">{choice.icon}</span>
          <span className="min-w-0 flex-1"><strong className="block text-base">{choice.title}</strong><span className="block text-xs text-sky-100/80">{choice.hint}</span></span>
          <span className="ph-option-tag">{choice.id}</span>
         </button>;})}
       </div>
      </section>
      <section aria-labelledby="ph-grade-title" className="ph-card">
       <h3 id="ph-grade-title" className="text-lg font-black">Sınıfım</h3>
       <p className="mt-1 text-sm leading-relaxed text-sky-100/80">İsteğe bağlı. Görevlerdeki kelime sayısı ve kelime havuzu sınıfa göre ayarlanır.</p>
       <div role="group" aria-labelledby="ph-grade-title" className="mt-3 grid grid-cols-4 gap-2">
        {GRADE_CHOICES.map(n=>{const on=activeProfile.gradeLevel===n;
         return <button key={n} type="button" aria-pressed={on} disabled={busy} onClick={()=>{if(!on)void updatePlacement({gradeLevel:n});}}
          className={'ph-grade'+(on?' ph-grade--on':'')}>{n}.<span className="sr-only"> sınıf</span></button>;})}
        <button type="button" aria-pressed={!activeProfile.gradeLevel} disabled={busy}
         onClick={()=>{if(activeProfile.gradeLevel)void updatePlacement({gradeLevel:null});}}
         className={'ph-grade col-span-4 text-sm'+(!activeProfile.gradeLevel?' ph-grade--on':'')}>Belirtmek istemiyorum</button>
       </div>
      </section>
      <section aria-labelledby="ph-check-title" className="ph-card lg:col-span-2">
       {!placementOpen?<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-lime-300/15 text-3xl">🧭</span>
        <div className="min-w-0 flex-1">
         <h3 id="ph-check-title" className="text-lg font-black">Başlangıç yoklaması</h3>
         <p className="mt-1 text-sm leading-relaxed text-sky-100/80">8 resimli soruyla sana uygun başlangıcı önerelim. Cevaplar buluta gönderilmez.</p>
        </div>
        <button type="button" disabled={busy} onClick={()=>setPlacementOpen(true)}
         className="min-h-12 rounded-2xl border border-lime-300/50 bg-lime-300/15 px-5 text-sm font-black text-lime-100 hover:bg-lime-300/25">Yoklamaya başla →</button>
       </div>
       :<><h3 id="ph-check-title" className="sr-only">Başlangıç yoklaması</h3>
        <StarterPlacementCheck saving={busy} onCancel={()=>setPlacementOpen(false)}
         onApply={async level=>{if(!await updatePlacement({englishLevel:level}))throw Error('Kaydedilemedi');setPlacementOpen(false);}}/></>}
      </section>
     </>}
    </div>}
   </div>

   {!creating&&tab==='avatar'&&<div className="ph-dock relative border-t border-white/15 bg-[#0b1640]/95 px-4 py-3 sm:px-7">
    {confirmId===preview&&!owned?<div role="group" aria-label="Avatarı açmayı onayla" className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
     <p className="text-center text-sm font-bold sm:text-left">🪙 {selected.price} Coin harcayarak {selected.name} avatarını açmak istiyor musun?</p>
     <div className="flex w-full gap-2 sm:w-auto">
      <button type="button" disabled={busy} onClick={()=>setConfirmId(null)} className="min-h-12 flex-1 rounded-2xl border border-white/30 px-5 font-bold sm:flex-none">Vazgeç</button>
      <button type="button" disabled={busy} onClick={()=>void equipAvatar(true)} className="min-h-12 flex-1 rounded-2xl bg-lime-300 px-5 font-black text-emerald-950 disabled:opacity-50 sm:flex-none">Evet, Kilidi Aç</button>
     </div>
    </div>:<div className="flex items-center gap-3">
     <AvatarPortrait id={preview} size={48} className="h-12 w-12 shrink-0 rounded-xl"/>
     <div className="min-w-0 flex-1">
      <strong className="block truncate text-base">{selected.name}</strong>
      <span className="block truncate text-xs font-bold text-sky-100/85">{inUse?'Şu an bu avatarı kullanıyorsun':owned?'Koleksiyonunda · kullanıma hazır':
       !shop?selected.price+' coin':missingCoins===0?selected.price+' coin · bakiyen yeterli':missingCoins+' coin daha biriktir'}</span>
     </div>
     <button type="button" disabled={busy||(!owned&&!affordable)||inUse}
      onClick={()=>{if(owned)void equipAvatar(false);else setConfirmId(preview);}}
      className="ph-dock-cta min-h-12 shrink-0 rounded-2xl border-2 border-white/80 bg-gradient-to-r from-lime-300 to-emerald-300 px-4 text-sm font-black text-emerald-950 shadow-[0_4px_0_#298e80] transition hover:brightness-110 disabled:opacity-60 sm:px-6">
      {busy?'Kaydediliyor…':action}{inUse||(!owned&&!affordable)?'':' →'}
     </button>
    </div>}
   </div>}
  </div>
  {deleteCandidate&&<ParentalGateModal isOpen zIndex={140} tone="danger"
   title={'“'+deleteCandidate.nickname+'” profilini sil'}
   confirmLabel="Profili sil"
   description={'Bu profil, bu cihazdaki oyun ilerlemesi ve yıldızlarıyla birlikte kalıcı olarak silinir; geri alınamaz. Devam etmek için bir yetişkin soruyu yanıtlamalı.'}
   onClose={()=>{setDeleteCandidate(null);requestAnimationFrame(()=>deleteTrigger.current?.focus());}}
   onSuccess={()=>{const target=deleteCandidate;setDeleteCandidate(null);void deleteConfirmedProfile(target);}}/>}
 </div>;
};
