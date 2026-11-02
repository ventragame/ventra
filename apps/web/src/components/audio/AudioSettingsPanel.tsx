'use client';
import React,{useEffect,useRef,useState} from 'react';
import {soundService,type AudioChannel,type AudioSettings} from '@/lib/audio/SoundService';
import {EventBus} from '@/lib/game/EventBus';
interface Props{onClose:()=>void;}
const rows:{channel:AudioChannel;label:string;icon:string;description:string}[]=[
 {channel:'music',label:'Macera müziği',icon:'🎵',description:'Dünyaya göre değişen özgün müzik'},
 {channel:'effects',label:'Oyun efektleri',icon:'✨',description:'Dokunma, ödül ve doğru cevaplar'},
 {channel:'voice',label:'İngilizce konuşma',icon:'🗣️',description:'Kelimeleri ve görevleri dinle'}
];
export function AudioSettingsPanel({onClose}:Props){
 const [settings,setSettings]=useState<AudioSettings>(()=>soundService.getSettings());
 const close=useRef<HTMLButtonElement>(null);
 const modal=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  close.current?.focus();
  const handler=(value:AudioSettings)=>setSettings({...value});
  EventBus.on('AUDIO_SETTINGS_CHANGED',handler);
  return()=>{EventBus.off('AUDIO_SETTINGS_CHANGED',handler);};
 },[]);
 const slider=(channel:AudioChannel,value:number)=>soundService.setChannelVolume(channel,value);
 const activateMusic=()=>{
  soundService.unlockAudio();
  soundService.setMusicEnabled(!settings.musicEnabled);
 };
 return <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-[#041a2a]/90 p-3 backdrop-blur-lg"
   onPointerDown={event=>event.stopPropagation()}>
  <div ref={modal} role="dialog" aria-modal="true" aria-labelledby="audio-settings-title"
   className="my-auto w-full max-w-lg rounded-[28px] border-2 border-amber-200/50 bg-gradient-to-b from-[#235a79] to-[#102d49] p-4 text-white shadow-[0_20px_80px_#0008] sm:p-6"
   onKeyDown={event=>{
     if(event.key==='Escape'){event.stopPropagation();onClose();}
     if(event.key==='Tab'){
      const elements=Array.from(modal.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled)')??[]);
      if(!elements.length)return;
      if(event.shiftKey&&document.activeElement===elements[0]){event.preventDefault();elements[elements.length-1].focus();}
      else if(!event.shiftKey&&document.activeElement===elements[elements.length-1]){event.preventDefault();elements[0].focus();}
     }
   }}>
   <header className="mb-4 flex items-start justify-between gap-3">
    <div><p className="text-xs font-black tracking-widest text-amber-200">VENTRA SES STÜDYOSU</p>
     <h2 id="audio-settings-title" className="mt-1 text-2xl font-black">🎧 Ses Ayarları</h2>
     <p className="mt-2 max-w-sm text-sm text-sky-100">Müzik, efektler ve İngilizce telaffuz ayrı ayrı kontrol edilir.</p>
    </div>
    <button ref={close} type="button" aria-label="Ses ayarlarını kapat" onClick={onClose}
      className="min-h-11 min-w-11 rounded-xl border border-white/30 bg-white/10 text-xl font-black hover:bg-white/20 focus-visible:outline focus-visible:outline-4 focus-visible:outline-lime-200">×</button>
   </header>
   <div className="space-y-3">
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-[#0c2c46]/80 p-3">
     <div><div className="font-extrabold">🔈 Tüm sesler</div><p className="text-xs text-sky-200">İstediğin zaman sessize al</p></div>
     <button type="button" aria-pressed={!settings.muted}
      onClick={()=>{soundService.unlockAudio();soundService.setMuted(!settings.muted);}}
      className="min-h-12 rounded-xl border-2 border-amber-200/50 bg-amber-200 px-4 font-black text-[#123649] focus-visible:outline focus-visible:outline-4 focus-visible:outline-white">
      {settings.muted?'🔇 Sesi Aç':'🔊 Açık'}
     </button>
    </div>
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-[#0c2c46]/80 p-3">
     <div><div className="font-extrabold">🎶 Dünya müziği</div>
      <p className="max-w-[235px] text-xs leading-relaxed text-sky-200">Varsayılan kapalıdır. Açmak için dokun.</p></div>
     <button type="button" aria-pressed={settings.musicEnabled} disabled={settings.muted}
      onClick={activateMusic}
      className="min-h-12 rounded-xl border border-lime-200/50 bg-lime-300/20 px-4 text-sm font-black text-lime-100 disabled:opacity-45 focus-visible:outline focus-visible:outline-4 focus-visible:outline-white">
       {settings.musicEnabled?'✓ Müzik Açık':'Müziği Aç'}
     </button>
    </div>
    {rows.map(({channel,label,icon,description})=><label key={channel} className="block rounded-2xl border border-white/15 bg-[#0c2c46]/65 p-3">
      <span className="flex items-center justify-between gap-2 text-sm font-extrabold">
        <span>{icon} {label}</span><span>{Math.round(settings[channel]*100)}%</span>
      </span>
      <input aria-label={label+' ses seviyesi'} type="range" min={0} max={100} step={5} value={Math.round(settings[channel]*100)}
        onChange={event=>slider(channel,Number(event.target.value)/100)}
        className="mt-3 h-8 w-full cursor-pointer accent-lime-300" />
      <span className="block text-xs text-sky-200">{description}</span>
    </label>)}
    <div className="grid grid-cols-2 gap-2">
      <button type="button" disabled={settings.muted||settings.effects===0}
        onClick={()=>soundService.playSfx('correct',0.8)}
        className="min-h-12 rounded-xl border border-white/30 bg-white/10 px-3 text-sm font-extrabold disabled:opacity-40">
        ✨ Efekti Dene
      </button>
      <button type="button" disabled={settings.muted||settings.voice===0}
        onClick={()=>{soundService.unlockAudio();soundService.speakEnglish('Hello, explorer!',{rate:0.85});}}
        className="min-h-12 rounded-xl border border-white/30 bg-white/10 px-3 text-sm font-extrabold disabled:opacity-40">
        🗣️ Telaffuzu Dene
      </button>
    </div>
   </div>
   <p className="mt-4 text-center text-xs leading-relaxed text-sky-200">
    Ses tercihleriniz yalnızca bu cihazda saklanır. Müzik kendiliğinden başlamaz.
   </p>
  </div>
 </div>;
}
