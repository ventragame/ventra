/**
 * Ventra Audio v2 — one consistent mixer for game UI, music and English speech.
 * Local sound settings only (no child audio or microphone data leaves the device).
 * Music is explicit opt-in; the audio context unlocks only after user interaction.
 */
import { EventBus } from '@/lib/game/EventBus';
import { Capacitor } from '@capacitor/core';
// The TTS plugin touches window during module evaluation; importing it on the
// server breaks Next.js /kids prerender. Load it only inside a browser action.
import { preferredEnglishVoiceIndex } from './EnglishVoice';
import { MusicDirector, type MusicScene } from './MusicDirector';
import {playRewardSound,type RewardEvent} from './RewardSounds';

const SILENT_WAV='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
const STORAGE_KEY_MUTED='ventra_sound_muted';
export const STORAGE_KEY_AUDIO_V2='ventra_audio_mix_v2';
export type AudioChannel='music'|'effects'|'voice';
export type SfxName='tap'|'correct'|'fanfare'|'whoosh'|'gentle_retry'|'island_portal';
export interface AudioSettings{
 muted:boolean;
 musicEnabled:boolean;
 music:number;
 effects:number;
 voice:number;
}
export const DEFAULT_AUDIO_SETTINGS:Readonly<AudioSettings>=Object.freeze({
 muted:false,musicEnabled:false,music:0.4,effects:0.7,voice:1
});
const clamp=(v:number):number=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
export function normalizeAudioSettings(value:unknown):AudioSettings{
 const v=value&&typeof value==='object'?value as Partial<AudioSettings>:{};
 return {
  muted:typeof v.muted==='boolean'?v.muted:DEFAULT_AUDIO_SETTINGS.muted,
  musicEnabled:typeof v.musicEnabled==='boolean'?v.musicEnabled:DEFAULT_AUDIO_SETTINGS.musicEnabled,
  music:typeof v.music==='number'?clamp(v.music):DEFAULT_AUDIO_SETTINGS.music,
  effects:typeof v.effects==='number'?clamp(v.effects):DEFAULT_AUDIO_SETTINGS.effects,
  voice:typeof v.voice==='number'?clamp(v.voice):DEFAULT_AUDIO_SETTINGS.voice
 };
}
export function chooseEnglishVoice(voices:SpeechSynthesisVoice[]):SpeechSynthesisVoice|null{
 const index=preferredEnglishVoiceIndex(voices);
 return index<0?null:voices[index];
}
export interface EnglishSpeechOptions{
 rate?:number;pitch?:number;
 onStart?:()=>void;onEnd?:()=>void;onError?:()=>void;
}

class SoundService {
 private audioPool=new Map<string,HTMLAudioElement[]>();
 private isUnlocked=false;
 private isMuted=false;
 private music=new MusicDirector();
 private settings:AudioSettings={...DEFAULT_AUDIO_SETTINGS};
 private context:AudioContext|null=null;
 private voiceActive=false;
 private speechGeneration=0;
 private nativeSpeaking=false;
 private nativeStopQueue:Promise<void>=Promise.resolve();
 private nativeVoiceIndex:number|undefined;
 private nativeVoicesRequested=false;
 private speechWatchdog:ReturnType<typeof setTimeout>|null=null;
 private gestureListenerAttached=false;
 private lastSfx=new Map<SfxName,number>();
 private sfxCooldown:Readonly<Record<SfxName,number>>={
  tap:38,correct:90,fanfare:550,whoosh:130,gentle_retry:150,
  // A scene click also raises OPEN_LEARNING_PATH ~420ms later; never double-play.
  island_portal:950
 };
 constructor(){
  if(typeof window!=='undefined'){
   try{
    const legacy=window.localStorage.getItem(STORAGE_KEY_MUTED)==='true';
    const saved=window.localStorage.getItem(STORAGE_KEY_AUDIO_V2);
    this.settings=normalizeAudioSettings(saved?JSON.parse(saved):{muted:legacy});
    this.isMuted=this.settings.muted;
   }catch{this.settings={...DEFAULT_AUDIO_SETTINGS};}
   this.music.setVolume(this.settings.music);
   this.music.setEnabled(this.settings.musicEnabled);
   this.music.setPaused(true);
   this.attachGlobalGestureUnlock();
   document.addEventListener('visibilitychange',()=>{
    if(document.hidden){this.cancelSpeech();this.music.setPaused(true);this.stopAllAudio();}
    else this.refreshMusic();
   });
   window.addEventListener('pagehide',()=>{this.cancelSpeech();this.music.setPaused(true);});
   window.addEventListener('pageshow',()=>this.refreshMusic());
  }
 }
 private persist(){
  if(typeof window==='undefined')return;
  try{
   window.localStorage.setItem(STORAGE_KEY_AUDIO_V2,JSON.stringify(this.settings));
   window.localStorage.setItem(STORAGE_KEY_MUTED,String(this.settings.muted));
  }catch{}
  EventBus.emit('AUDIO_SETTINGS_CHANGED',this.getSettings());
 }
 private attachGlobalGestureUnlock(){
  if(this.gestureListenerAttached||typeof window==='undefined')return;
  this.gestureListenerAttached=true;
  const unlock=()=>{this.unlockAudio();};
  // Keep a once-only handler for each input; audio can still be resumed on
  // direct button actions if a browser rejected the very first gesture.
  window.addEventListener('pointerdown',unlock,{once:true,passive:true});
  window.addEventListener('touchstart',unlock,{once:true,passive:true});
  window.addEventListener('keydown',unlock,{once:true,passive:true});
 }
 unlockAudio():void{
  if(typeof window==='undefined')return;
  try{
   if(!this.context){
    const Ctor=window.AudioContext||(window as any).webkitAudioContext;
    if(Ctor)this.context=new Ctor({latencyHint:'interactive'});
   }
   const ctx=this.context;
   if(ctx&&ctx.state==='suspended')void ctx.resume().then(()=>{
    this.isUnlocked=true;this.refreshMusic();
   }).catch(()=>{});
   else if(ctx?.state==='running'){this.isUnlocked=true;this.refreshMusic();}
   else if(!ctx&&!this.isUnlocked){
    const silent=new Audio(SILENT_WAV);
    void silent.play().then(()=>{this.isUnlocked=true;}).catch(()=>{});
   }
  }catch{}
 }
 private refreshMusic():void{
  if(typeof window==='undefined')return;
  const playable=this.settings.musicEnabled&&!this.isMuted&&!document.hidden;
  this.music.setEnabled(this.settings.musicEnabled);
  this.music.setVolume(this.settings.music);
  this.music.setDucked(this.voiceActive);
  this.music.setPaused(!playable);
  if(playable&&this.context?.state==='running')this.music.start(this.context);
 }
 setMusicScene(scene:MusicScene):void{this.music.setScene(scene);this.refreshMusic();}
 getMusicScene():MusicScene{return this.music.getScene();}
 getSettings():AudioSettings{return {...this.settings};}
 getMuted():boolean{return this.isMuted;}
 toggleMute():boolean{return this.setMuted(!this.isMuted);}
 setMuted(muted:boolean):boolean{
  this.isMuted=Boolean(muted);this.settings.muted=this.isMuted;
  if(this.isMuted){this.cancelSpeech();this.stopAllAudio();}
  else this.unlockAudio();
  this.refreshMusic();this.persist();
  EventBus.emit('MUTE_STATE_CHANGED',this.isMuted);return this.isMuted;
 }
 setMusicEnabled(enabled:boolean):void{
  this.settings.musicEnabled=Boolean(enabled);
  // Must be invoked by a real user action before starting the score.
  if(enabled&&!this.isMuted)this.unlockAudio();
  this.refreshMusic();this.persist();
 }
 setChannelVolume(channel:AudioChannel,volume:number):void{
  this.settings[channel]=clamp(volume);
  if(channel==='effects'||channel==='voice')this.updatePooledVolumes();
  if(channel==='voice'&&this.settings.voice===0)this.cancelSpeech();
  this.refreshMusic();this.persist();
 }
 private updatePooledVolumes():void{
  for(const [url,items] of this.audioPool){
   const channel:AudioChannel=url.startsWith('/audio/sfx/')?'effects':'voice';
   for(const audio of items){
    const desired=Number(audio.dataset.requestVolume??'1');
    audio.volume=this.isMuted?0:clamp(desired*this.settings[channel]);
   }
  }
 }
 private getAudioInstance(url:string):HTMLAudioElement{
  const pool=this.audioPool.get(url)??[];
  if(!this.audioPool.has(url))this.audioPool.set(url,pool);
  const available=pool.find(x=>x.paused||x.ended);
  if(available){try{available.currentTime=0;}catch{}return available;}
  if(pool.length>=4){const old=pool[0];old.pause();old.currentTime=0;return old;}
  const audio=new Audio(url);audio.preload='auto';pool.push(audio);return audio;
 }
 private playChannel(url:string,volume:number,channel:'effects'|'voice'):HTMLAudioElement|null{
  if(typeof window==='undefined'||this.isMuted||document.hidden||this.settings[channel]<=0)return null;
  try{
   this.unlockAudio();
   const audio=this.getAudioInstance(url);
   audio.dataset.requestVolume=String(clamp(volume));
   audio.volume=clamp(volume*this.settings[channel]);
   // Recorded speech ducker is tied to the actual onplay/ended lifecycle.
   if(channel==='voice'){
    const restore=()=>{if(this.voiceActive){this.voiceActive=false;this.refreshMusic();}};
    audio.onplay=()=>{this.voiceActive=true;this.refreshMusic();};
    audio.onended=restore;audio.onpause=restore;audio.onerror=restore;
   }
   void audio.play().catch(error=>{
    if(error?.name!=='NotAllowedError')console.warn('[Ventra audio] Ses dosyası açılamadı',url);
   });
   return audio;
  }catch{return null;}
 }
 play(url:string,volume=1):HTMLAudioElement|null{
  return this.playChannel(url,volume,url.startsWith('/audio/sfx/')?'effects':'voice');
 }
 playSfx(name:SfxName,volume=0.8):void{
  if(this.settings.effects<=0||this.isMuted)return;
  const now=typeof performance!=='undefined'?performance.now():Date.now();
  const last=this.lastSfx.get(name)??-10000;
  if(now-last<this.sfxCooldown[name])return;
  this.lastSfx.set(name,now);
  // Custom major arpeggio / soft recovery / celebratory fanfare. Keep the
  // existing local WAV as an offline fallback when WebAudio is unavailable.
  if(name==='correct'||name==='gentle_retry'||name==='fanfare'){
   this.unlockAudio();
   const ctx=this.context;
   if(ctx&&playRewardSound(ctx,name as RewardEvent,clamp(volume)*this.settings.effects))return;
  }
  this.playChannel(`/audio/sfx/${name}.wav`,volume,'effects');
 }
 /**
  * Capacitor community TTS v4 accesses window at import time. Never load it
  * while rendering the server. The dynamic import is used only on real devices.
  */
 private async nativeTextToSpeech(){
  const module=await import('@capacitor-community/text-to-speech');
  return module.TextToSpeech;
 }
 /** Native voice is used by Android/iOS builds; browsers keep Web Speech. */
 hasEnglishSpeech():boolean{
  return typeof window!=='undefined'&&(this.hasNativeSpeech()||
   ('speechSynthesis' in window&&typeof SpeechSynthesisUtterance!=='undefined'));
 }
 private hasNativeSpeech():boolean{
  return typeof window!=='undefined'&&Capacitor.isNativePlatform()&&Capacitor.isPluginAvailable('TextToSpeech');
 }
 private primeNativeVoice():void{
  if(this.nativeVoicesRequested||!this.hasNativeSpeech())return;
  this.nativeVoicesRequested=true;
  void this.nativeTextToSpeech().then(plugin=>plugin.getSupportedVoices()).then(({voices})=>{
   const index=preferredEnglishVoiceIndex(voices??[]);
   if(index>=0)this.nativeVoiceIndex=index;
  }).catch(()=>{ /* The OS default voice is still usable. */ });
 }
 private clearSpeechWatchdog():void{
  if(this.speechWatchdog!==null)clearTimeout(this.speechWatchdog);
  this.speechWatchdog=null;
 }
 private stopRecordedSpeech():void{
  for(const [path,items] of this.audioPool){
   if(path.startsWith('/audio/sfx/'))continue;
   for(const item of items)try{item.pause();item.currentTime=0;}catch{}
  }
 }
 playSpeech(path:string,volume=1):void{
  this.cancelSpeech();
  this.playChannel(path,volume,'voice');
 }
 cancelSpeech():void{
  this.speechGeneration++;
  this.clearSpeechWatchdog();
  if(this.nativeSpeaking&&this.hasNativeSpeech()){
   this.nativeStopQueue=this.nativeStopQueue.catch(()=>{}).then(async()=>{
    const plugin=await this.nativeTextToSpeech();
    await plugin.stop().catch(()=>{});
   }).catch(()=>{});

  }
  this.nativeSpeaking=false;
  if(typeof window!=='undefined'&&'speechSynthesis' in window){
   try{window.speechSynthesis.cancel();}catch{}
  }
  this.stopRecordedSpeech();
  this.voiceActive=false;this.refreshMusic();
 }
 private speakInBrowser(text:string,options:EnglishSpeechOptions,id:number):boolean{
  if(typeof window==='undefined'||!('speechSynthesis' in window)||
   typeof SpeechSynthesisUtterance==='undefined')return false;
  try{
   const utterance=new SpeechSynthesisUtterance(text);
   utterance.lang='en-US';
   utterance.rate=Math.max(0.75,Math.min(1.05,options.rate??0.9));
   utterance.pitch=Math.max(0.9,Math.min(1.12,options.pitch??1));
   utterance.volume=this.settings.voice;
   const voice=chooseEnglishVoice(window.speechSynthesis.getVoices());
   if(voice)utterance.voice=voice;
   let started=false,finished=false;
   const finish=(success:boolean)=>{
    if(finished||this.speechGeneration!==id)return;
    finished=true;this.clearSpeechWatchdog();
    this.voiceActive=false;this.refreshMusic();
    if(success)options.onEnd?.();else options.onError?.();
   };
   utterance.onstart=()=>{
    if(this.speechGeneration!==id||this.isMuted)return;
    started=true;this.clearSpeechWatchdog();
    this.voiceActive=true;this.refreshMusic();options.onStart?.();
   };
   utterance.onend=()=>finish(true);
   utterance.onerror=()=>finish(false);
   window.speechSynthesis.speak(utterance);
   // A WebView can expose speechSynthesis while never starting playback.
   this.speechWatchdog=setTimeout(()=>{
    if(started||finished||this.speechGeneration!==id)return;
    try{window.speechSynthesis.cancel();}catch{}
    finish(false);
   },4500);
   return true;
  }catch{return false;}
 }
 speakEnglish(text:string,options:EnglishSpeechOptions={}):boolean{
  this.cancelSpeech();
  if(!text.trim()||this.isMuted||this.settings.voice<=0||
   typeof window==='undefined'||document.hidden)return false;
  const id=this.speechGeneration;
  if(this.hasNativeSpeech()){
   this.primeNativeVoice();
   this.nativeSpeaking=true;this.voiceActive=true;this.refreshMusic();
   void this.nativeStopQueue.then(async()=>{
    if(this.speechGeneration!==id||this.isMuted)return false;
    options.onStart?.();
    const plugin=await this.nativeTextToSpeech();
    if(this.speechGeneration!==id||this.isMuted)return false;
    await plugin.speak({
     text,lang:'en-US',rate:Math.max(0.75,Math.min(1.05,options.rate??0.9)),
     pitch:Math.max(0.9,Math.min(1.12,options.pitch??1)),volume:this.settings.voice,
     category:'ambient',
     ...(this.nativeVoiceIndex===undefined?{}:{voice:this.nativeVoiceIndex})
    });
    return true;
   }).then(completed=>{
    if(this.speechGeneration!==id)return;
    this.nativeSpeaking=false;this.voiceActive=false;this.refreshMusic();
    if(completed)options.onEnd?.();
   }).catch(()=>{
    if(this.speechGeneration!==id)return;
    this.nativeSpeaking=false;this.voiceActive=false;this.refreshMusic();
    if(!this.speakInBrowser(text,options,id))options.onError?.();
   });
   return true;
  }
  const accepted=this.speakInBrowser(text,options,id);
  if(!accepted)options.onError?.();
  return accepted;
 }
 stopAllAudio():void{
  for(const pool of this.audioPool.values())for(const audio of pool){
   try{audio.pause();audio.currentTime=0;}catch{}
  }
  this.voiceActive=false;this.refreshMusic();
 }
}
export const soundService=new SoundService();
