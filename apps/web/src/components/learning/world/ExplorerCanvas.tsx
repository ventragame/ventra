'use client';
import React,{useCallback,useEffect,useRef,useState} from 'react';
import Phaser from 'phaser';
import { ExplorerScene } from './ExplorerScene';
import { WorldAmbience } from '@/lib/audio/WorldAmbience';
import { soundService } from '@/lib/audio/SoundService';
import { EventBus } from '@/lib/game/EventBus';
import type { WorldArea,WorldObject } from './worldLayout';

export interface ExplorerCanvasProps {
  area:WorldArea;
  objects:WorldObject[];
  onInteract:(object:WorldObject)=>void;
  onInspect?:(object:WorldObject)=>void;
  caption?:string;
  height?:number;
  progress?:number;
}
export function ExplorerCanvas({
  area,objects,onInteract,onInspect,caption,height=520,progress=0
}:ExplorerCanvasProps) {
  const host=useRef<HTMLDivElement>(null);
  const game=useRef<Phaser.Game|null>(null);
  const scene=useRef<ExplorerScene|null>(null);
  const onInteractRef=useRef(onInteract);
  const onInspectRef=useRef(onInspect);
  const objectsRef=useRef(objects);
  const [ready,setReady]=useState(false);
  const ambience=useRef<WorldAmbience|null>(null);
  const [ambienceOn,setAmbienceOn]=useState(false);
  const [reduced,setReduced]=useState(false);
  const [hint,setHint]=useState('Yolculuğa başlamak için bir bölgeye dokun.');
  onInteractRef.current=onInteract;
  onInspectRef.current=onInspect;
  objectsRef.current=objects;

  useEffect(()=>{
    if(typeof window==='undefined')return;
    const q=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReduced(q.matches);
    update();
    q.addEventListener?.('change',update);
    return ()=>q.removeEventListener?.('change',update);
  },[]);
  useEffect(()=>{
    let alive=true;
    let handle:ReturnType<typeof setTimeout>|undefined;
    // SSR never loads this module: parent imports it with next/dynamic ssr:false.
    handle=setTimeout(()=>{
      if(!alive||!host.current)return;
      const instance=new ExplorerScene({
        area,targets:objectsRef.current,reducedMotion:reduced,
        onInteract:object=>{
          setHint(`${object.label}: keşfedildi!`);
          onInteractRef.current(object);
        },
        onInspect:object=>{
          setHint(`${object.label} henüz açılmadı.`);
          onInspectRef.current?.(object);
        }
      });
      scene.current=instance;
      instance.setProgress(progress);
      game.current=new Phaser.Game({
        type:Phaser.AUTO,
        parent:host.current,
        transparent:false,
        backgroundColor:'#86cfc5',
        width:host.current.clientWidth || 720,
        height:host.current.clientHeight || height,
        render:{antialias:true,powerPreference:'high-performance',roundPixels:true},
        fps:{target:60,min:30,smoothStep:true},
        scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH},
        scene:[instance]
      });
      setReady(true);
    },0);
    const onVisibility=()=>{
      if(document.hidden){
        ambience.current?.stop();setAmbienceOn(false);
      }
      if(!game.current)return;
      if(document.hidden)game.current.scene.pause('VentraExplorer');
      else game.current.scene.resume('VentraExplorer');
    };
    const onMute=(muted:boolean)=>{
      if(muted){ambience.current?.stop();setAmbienceOn(false);}
    };
    EventBus.on('MUTE_STATE_CHANGED',onMute);
    document.addEventListener('visibilitychange',onVisibility);
    return ()=>{
      alive=false;
      if(handle!==undefined)clearTimeout(handle);
      document.removeEventListener('visibilitychange',onVisibility);
      EventBus.off('MUTE_STATE_CHANGED',onMute);
      ambience.current?.stop();ambience.current=null;
      scene.current=null;
      if(game.current){game.current.destroy(true,false);game.current=null;}
    };
    // The engine survives question changes, only the objects change.
    // area changes are accompanied by a React key from the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[area]);
  useEffect(()=>{
    scene.current?.setTargets(objects);
  },[objects]);
  useEffect(()=>{
    scene.current?.setReducedMotion(reduced);
  },[reduced]);
  useEffect(()=>{
    scene.current?.setProgress(progress);
  },[progress]);
  useEffect(()=>{
    scene.current?.setCallbacks(
      object=>{setHint(`${object.label}: keşfedildi!`);onInteractRef.current(object);},
      object=>{setHint(`${object.label} henüz açılmadı.`);onInspectRef.current?.(object);}
    );
  },[onInteract,onInspect]);
  const toggleAmbience=useCallback(()=>{
    if(ambience.current?.isPlaying){
      ambience.current.stop();setAmbienceOn(false);return;
    }
    if(soundService.getMuted()){
      setHint('Ortam sesini dinlemek için önce genel sesi aç.');return;
    }
    if(!ambience.current)ambience.current=new WorldAmbience();
    const success=ambience.current.start();
    setAmbienceOn(success);
    if(!success)setHint('Bu cihazda ortam sesi açılamadı; ses olmadan oynamaya devam edebilirsin.');
  },[]);
  const move=useCallback((x:number,y:number)=>{
    scene.current?.goDirection(x,y);
  },[]);
  return <div className="relative w-full overflow-hidden rounded-[2rem] border-4 border-[#f9ebaf]/80 bg-[#70ba91] shadow-[0_18px_45px_rgba(17,64,68,.25)]"
    style={{height:`min(${height}px, 68dvh)`,minHeight:'280px'}}>
    <div ref={host} aria-hidden="true" className="absolute inset-0 overflow-hidden"
      style={{touchAction:'none',userSelect:'none'}}/>
    <div className="pointer-events-none absolute left-3 top-3 rounded-xl border border-white/70 bg-[#164958]/85 px-3 py-2 text-xs font-extrabold text-white shadow-lg sm:text-sm">
      🧭 {caption??(area==='garden'?'Keşif Haritası':'Hayvan Dostları')}
    </div>
    <button type="button" onClick={toggleAmbience} aria-pressed={ambienceOn}
      aria-label={ambienceOn?'Ortam sesini kapat':'Ortam sesini aç'}
      className="absolute right-3 top-3 min-h-11 rounded-xl border border-white/60 bg-[#164958]/90 px-3 py-2 text-xs font-black text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200">
      {ambienceOn?'♫ Ortam Açık':'♫ Ortam Sesi'}
    </button>
    <div role="status" aria-live="polite" className="pointer-events-none absolute left-3 right-3 bottom-3 flex justify-start">
      <div className="max-w-[65%] rounded-xl bg-[#134454]/85 px-3 py-2 text-[11px] font-bold text-white shadow-lg sm:text-xs">
        {ready?hint:'Dünya hazırlanıyor…'}
      </div>
    </div>
    <div aria-label="Yön kontrolleri" className="absolute bottom-3 right-3 grid grid-cols-3 gap-1.5" style={{touchAction:'manipulation'}}>
      <span/><button type="button" onClick={()=>move(0,-1)} aria-label="Yukarı yürü" className="min-h-11 min-w-11 rounded-xl border border-white/70 bg-[#fff7d7]/95 font-black text-emerald-950 shadow-lg">↑</button><span/>
      <button type="button" onClick={()=>move(-1,0)} aria-label="Sola yürü" className="min-h-11 min-w-11 rounded-xl border border-white/70 bg-[#fff7d7]/95 font-black text-emerald-950 shadow-lg">←</button>
      <span className="pointer-events-none flex items-center justify-center text-white">●</span>
      <button type="button" onClick={()=>move(1,0)} aria-label="Sağa yürü" className="min-h-11 min-w-11 rounded-xl border border-white/70 bg-[#fff7d7]/95 font-black text-emerald-950 shadow-lg">→</button>
      <span/><button type="button" onClick={()=>move(0,1)} aria-label="Aşağı yürü" className="min-h-11 min-w-11 rounded-xl border border-white/70 bg-[#fff7d7]/95 font-black text-emerald-950 shadow-lg">↓</button><span/>
    </div>
  </div>;
}
