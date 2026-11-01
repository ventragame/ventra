'use client';
import React,{useMemo,useState} from 'react';
import dynamic from 'next/dynamic';
import { getDistrictObjects } from './world/worldLayout';
import type { WorldObject } from './world/worldLayout';

const ExplorerCanvas=dynamic(()=>import('./world/ExplorerCanvas').then(x=>x.ExplorerCanvas),{
  ssr:false,
  loading:()=> <div role="status" className="flex min-h-80 items-center justify-center rounded-3xl bg-emerald-900/60 text-white">Kelime Bahçesi yükleniyor…</div>
});

interface WordGardenDistrictMapProps {
  completedLevels:number;
  totalLevels:number;
  onEnterAnimals:()=>void;
  onEnterColors:()=>void;
  colorsUnlocked:boolean;
  colorsAvailable:boolean;
  colorCompleted:number;
  numberCompleted:number;
  numberTotal:number;
  numbersUnlocked:boolean;
  numbersAvailable:boolean;
  onEnterNumbers:()=>void;
  foodCompleted:number;
  foodTotal:number;
  foodUnlocked:boolean;
  foodAvailable:boolean;
  foodError:boolean;
  onEnterFood:()=>void;
  familyCompleted:number;
  familyTotal:number;
  familyUnlocked:boolean;
  familyAvailable:boolean;
  familyError:boolean;
  onEnterFamily:()=>void;
  templeCompleted:number;
  templeTotal:number;
  templeUnlocked:boolean;
  templeAvailable:boolean;
  templeError:boolean;
  onEnterTemple:()=>void;
  gradeLevel?:number|null;
  onBack:()=>void;
}
const PLACES:Record<string,{title:string;description:string;icon:string}>={
  animals:{title:'Hayvan Çayırı',description:'40 hayvan · Sınıfa göre 6–8 keşif · 5 görev',icon:'🐾'},
  colors:{title:'Renk Korusu',description:'Renkleri keşfet, boya ve hafızanı güçlendir',icon:'🎨'},
  numbers:{title:'Sayı Vadisi',description:'İngilizce sayılar · 1–1000 · Düzeye uygun 15 görev',icon:'🔢'},
  food:{title:'Lezzet Pazarı',description:'45 İngilizce yiyecek/içecek · 3 sokak · 15 dil görevi',icon:'🍎'},
  family:{title:'Aile Köyü',description:'60 İngilizce kelime & ifade · 4 mahalle · 20 dil görevi',icon:'🏡'},
  sanctuary:{title:'Keşif Tapınağı',description:'5 tapınak salonu · 25 İngilizce final görevi · Karma tekrar',icon:'✨'}
};
export const WordGardenDistrictMap:React.FC<WordGardenDistrictMapProps>=({
  completedLevels,totalLevels,onEnterAnimals,onEnterColors,
  colorsUnlocked,colorsAvailable,colorCompleted,numberCompleted,numberTotal,numbersUnlocked,numbersAvailable,onEnterNumbers,
  foodCompleted,foodTotal,foodUnlocked,foodAvailable,foodError,onEnterFood,
  familyCompleted,familyTotal,familyUnlocked,familyAvailable,familyError,onEnterFamily,
  templeCompleted,templeTotal,templeUnlocked,templeAvailable,templeError,onEnterTemple,gradeLevel=null,onBack
})=>{
  const [notice,setNotice]=useState('');
  const journeyTotal=totalLevels+3+numberTotal+foodTotal+familyTotal+templeTotal;
  const progress=journeyTotal>0?Math.min(100,Math.round(100*(completedLevels+colorCompleted+numberCompleted+foodCompleted+familyCompleted+templeCompleted)/journeyTotal)):0;
  const objects=useMemo(()=>getDistrictObjects(colorsUnlocked&&colorsAvailable,numbersUnlocked&&numbersAvailable,foodUnlocked&&foodAvailable,familyUnlocked&&familyAvailable,templeUnlocked&&templeAvailable),[colorsUnlocked,colorsAvailable,numbersUnlocked,numbersAvailable,foodUnlocked,foodAvailable,familyUnlocked,familyAvailable,templeUnlocked,templeAvailable]);
  const enter=(obj:WorldObject)=>{
    if(obj.id==='animals')onEnterAnimals();
    else if(obj.id==='colors'&&colorsUnlocked&&colorsAvailable)onEnterColors();
    else if(obj.id==='numbers'&&numbersUnlocked&&numbersAvailable)onEnterNumbers();
    else if(obj.id==='food'&&foodUnlocked&&foodAvailable)onEnterFood();
    else if(obj.id==='family'&&familyUnlocked&&familyAvailable)onEnterFamily();
    else if(obj.id==='sanctuary'&&templeUnlocked&&templeAvailable)onEnterTemple();
    else if(obj.id==='sanctuary')setNotice(templeError?'Keşif Tapınağı kayıtları yüklenemedi.':'Keşif Tapınağı hazırlanıyor; yeniden dene.');
    else if(obj.id==='family')setNotice(familyError?'Aile Köyü kayıtları yüklenemedi.':'Aile Köyü hazırlanıyor; yeniden dene.');
    else if(obj.id==='food')setNotice(foodError?'Lezzet Pazarı kayıtları yüklenemedi. Haritadan çıkıp yeniden deneyin.':'Lezzet Pazarı yükleniyor; biraz sonra yeniden seçin.');
    else setNotice(PLACES[obj.id]?.title+' bölgesi henüz açılmadı.');
  };
  return <div role="dialog" aria-modal="true" aria-labelledby="wg-world-title"
    onPointerDown={e=>e.stopPropagation()} onPointerMove={e=>e.stopPropagation()}
    onPointerUp={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()}
    className="fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-gradient-to-b from-[#153d54] via-[#1a6973] to-[#174f46] text-white">
    <div className="mx-auto max-w-6xl px-3 pb-10 pt-4 sm:px-6" style={{paddingTop:'max(16px, env(safe-area-inset-top))',paddingBottom:'max(24px, env(safe-area-inset-bottom))'}}>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <button onClick={onBack} className="min-h-12 rounded-xl border border-white/35 bg-[#083e50]/70 px-4 py-3 text-xs font-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 sm:text-sm">
          ← Takımadaya Dön
        </button>
        <div className="rounded-xl border border-lime-200/30 bg-[#073d4a]/80 px-4 py-3 text-xs font-bold text-lime-100 sm:text-sm">
          🐾 {completedLevels}/{totalLevels} · 🎨 {colorCompleted}/3 · 🔢 {numberCompleted}/{numberTotal} · 🍎 {foodCompleted}/{foodTotal} · 🏡 {familyCompleted}/{familyTotal} · ✨ {templeCompleted}/{templeTotal} · ⭐ Yolculuk %{progress}
        </div>
      </header>
      <div className="mb-4 text-center">
        <p className="text-[11px] font-black uppercase tracking-[.2em] text-amber-200">Ventra Kids · Keşif Dünyası</p>
        <h1 id="wg-world-title" className="mt-1 text-3xl font-black tracking-tight text-white sm:text-5xl">🌸 Kelime Bahçesi</h1>
        <p className="mt-2 text-xs text-sky-100 sm:text-sm">
          Yol boyunca ilerle, bölge tabelalarına dokun. Bilgisayarda WASD/oklar, telefonda yön tuşları da çalışır.
          {gradeLevel!==null&&Number.isInteger(gradeLevel)&&gradeLevel>=1&&gradeLevel<=8 && <span className="ml-2 font-bold text-lime-200">• {gradeLevel}. sınıfa uygun görevler</span>}
        </p>
      </div>
      <ExplorerCanvas key="garden" area="garden" objects={objects} caption="Gezilebilir Keşif Haritası"
        height={570} onInteract={enter} onInspect={obj=>setNotice(`${obj.label} henüz oynanabilir değil.`)}/>
      {templeError&&<div role="alert" className="mb-3 rounded-xl border border-rose-300/50 bg-rose-950/75 px-4 py-3 text-sm font-semibold text-white">Keşif Tapınağı kayıtları okunamadı; verilerin korunuyor. Haritadan çıkıp tekrar dene.</div>}
      {familyError&&<div role="alert" className="mb-3 rounded-xl border border-rose-300/50 bg-rose-950/75 px-4 py-3 text-sm font-semibold text-white">Aile Köyü ilerlemesi açılamadı; mevcut kayıtların korunuyor. Haritadan çıkıp yeniden deneyebilirsin.</div>}
      {foodError&&<div role="alert" className="mb-3 rounded-xl border border-rose-300/50 bg-rose-950/75 px-4 py-3 text-sm font-semibold text-white">Lezzet Pazarı ilerlemesi okunamadı. Kayıtların silinmedi; haritadan çıkıp tekrar açarak yeniden dene.</div>}
      {notice&&<div role="status" className="mt-3 rounded-xl border border-amber-300/40 bg-slate-950/65 px-4 py-3 text-sm font-semibold text-amber-100">
        {notice} <button onClick={()=>setNotice('')} className="ml-3 rounded-md underline">Kapat</button>
      </div>}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {objects.map(obj=>{
          const info=PLACES[obj.id];
          const playable=obj.unlocked===true;
          const status=playable?'OYNANABİLİR':obj.id==='food'
            ?(foodError?'YÜKLEME HATASI':'YÜKLENİYOR')
            :obj.id==='family'?(familyError?'YÜKLEME HATASI':'YÜKLENİYOR')
            :obj.id==='sanctuary'?(templeError?'YÜKLEME HATASI':'YÜKLENİYOR'):'🔒 KİLİTLİ';
          return <button key={obj.id} type="button" disabled={!playable} onClick={()=>enter(obj)}
            aria-label={`${info.title} — ${playable?'oyna':'kilitli'}`}
            className={`min-h-28 rounded-2xl border px-3 py-4 text-left shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300
              ${playable?'border-lime-200/60 bg-emerald-900/65 hover:bg-emerald-800/75':'border-white/15 bg-slate-950/30 text-white/65'}`}>
            <div className="flex items-center justify-between gap-2"><span aria-hidden="true" className="text-2xl">{info.icon}</span>
              <span className="text-[10px] font-black">{status}</span></div>
            <h2 className="mt-2 text-sm font-black sm:text-base">{info.title}</h2>
            <p className="mt-1 text-[11px] leading-snug text-white/75">{info.description}</p>
          </button>;
        })}
      </div>
      <p className="mt-5 text-center text-xs text-sky-100/80">Lezzet Pazarı oynanabilir bir İngilizce bölgesidir ve diğer dünyaları bitirmeden açılabilir. Altı dil bölgesi oynanabilir. Keşif Tapınağı, önceki dünyalarda öğrenilen İngilizceyi bir araya getiren büyük finaldir.</p>
    </div>
  </div>;
};
