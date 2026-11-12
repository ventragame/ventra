'use client';

import {Capacitor,registerPlugin} from '@capacitor/core';

export type SpeechMode='native-local'|'web-local'|'practice'|'none';
export type SpeechCapability={mode:SpeechMode;installable:boolean;message:string};
export type SpeechAttempt={
 kind:'recognized'|'heard'|'no-speech'|'denied'|'unavailable'|'cancelled';
 alternatives:string[];mode:SpeechMode;
};
/** No audio files, transcript history, identifiers or telemetry are uploaded. */
interface NativeSpeech {
 getStatus():Promise<{available:boolean;reason?:string}>;
 listen(options:{lang:string;timeoutMs:number}):Promise<{alternatives:string[]}>;
 stop():Promise<void>;
}
const plugin=registerPlugin<NativeSpeech>('VentraSpeech');
type WebSpeechInstance={
 lang:string;continuous:boolean;interimResults:boolean;maxAlternatives:number;
 processLocally?:boolean;
 onresult:((event:{results:ArrayLike<ArrayLike<{transcript:string}>>})=>void)|null;
 onerror:((event:{error:string})=>void)|null;onend:(()=>void)|null;
 start():void;abort():void;
};
type WebSpeechConstructor={
 new():WebSpeechInstance;
 available?:(options:{langs:string[];processLocally:boolean})=>Promise<string>;
 install?:(options:{langs:string[];processLocally:boolean})=>Promise<boolean>;
};
function browserConstructor():WebSpeechConstructor|null{
 if(typeof window==='undefined')return null;
 const root=window as unknown as {SpeechRecognition?:WebSpeechConstructor;webkitSpeechRecognition?:WebSpeechConstructor};
 return root.SpeechRecognition??root.webkitSpeechRecognition??null;
}
let currentCancel:(()=>void)|null=null;
export function stopSpeechCapture():void{
 const stop=currentCancel;currentCancel=null;
 try{stop?.();}catch{}
 if(typeof window!=='undefined'&&Capacitor.isNativePlatform()){
  void plugin.stop().catch(()=>{});
 }
}
async function canUseMic():Promise<boolean>{
 return typeof navigator!=='undefined'&&Boolean(navigator.mediaDevices?.getUserMedia);
}
export async function speechCapability():Promise<SpeechCapability>{
 if(typeof window==='undefined')return {mode:'none',installable:false,message:'Mikrofon kullanılamıyor.'};
 if(Capacitor.isNativePlatform()){
  if(!Capacitor.isPluginAvailable('VentraSpeech'))
   return {mode:await canUseMic()?'practice':'none',installable:false,message:'Bu uygulama sürümünde yerel ses tanıma yok. Sesli tekrar yapabilirsin.'};
  try{
   const status=await plugin.getStatus();
   if(status.available)return {mode:'native-local',installable:false,message:'Konuşman cihazında tanınır.'};
  }catch{}
  return {mode:await canUseMic()?'practice':'none',installable:false,message:'Bu cihazda İngilizce konuşma tanıma yok. Yine de yüksek sesle tekrar edebilirsin.'};
 }
 const ctor=browserConstructor();
 if(ctor&&ctor.available){
  try{
   const result=await ctor.available({langs:['en-US'],processLocally:true});
   if(result==='available')
    return {mode:'web-local',installable:false,message:'İngilizce konuşma bu cihazda tanınır.'};
   if(result==='downloadable'||result==='downloading')
    return {mode:'practice',installable:result==='downloadable',message:'İngilizce ses paketi indirilebilir. İndirmeden de sesli pratik yapabilirsin.'};
  }catch{}
 }
 return {mode:await canUseMic()?'practice':'none',installable:false,
  message:'Bu tarayıcıda özel konuşma tanıma yok. Mikrofonla tekrar et veya cevaba dokun.'};
}
/** Only from the explicit "download language pack" click. Never auto-download. */
export async function installLocalEnglish():Promise<boolean>{
 const ctor=browserConstructor();
 if(!ctor?.install)return false;
 try{return await ctor.install({langs:['en-US'],processLocally:true});}catch{return false;}
}
/** A small local voice-activity detector. It NEVER claims to understand words. */
async function practiceVoice(timeoutMs:number):Promise<SpeechAttempt>{
 if(typeof navigator==='undefined'||!navigator.mediaDevices?.getUserMedia)
  return {kind:'unavailable',alternatives:[],mode:'none'};
 let stream:MediaStream|null=null,ctx:AudioContext|null=null;
 let timer:ReturnType<typeof setTimeout>|null=null,frame=0;
 try{
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
  const Context=window.AudioContext;
  if(!Context)throw Error('Unsupported audio');
  ctx=new Context();
  if(ctx.state==='suspended')await ctx.resume();
  const source=ctx.createMediaStreamSource(stream);
  const analyser=ctx.createAnalyser();analyser.fftSize=1024;source.connect(analyser);
  const samples=new Float32Array(analyser.fftSize);
  return await new Promise<SpeechAttempt>(resolve=>{
   let settled=false;let startedAt=performance.now();let activeFor=0;
   const finish=(kind:SpeechAttempt['kind'])=>{
    if(settled)return;settled=true;
    if(timer)clearTimeout(timer);cancelAnimationFrame(frame);
    currentCancel=null;
    resolve({kind,alternatives:[],mode:'practice'});
   };
   currentCancel=()=>finish('cancelled');
   const measure=()=>{
    if(settled)return;
    analyser.getFloatTimeDomainData(samples);
    let energy=0;for(let i=0;i<samples.length;i++)energy+=samples[i]*samples[i];
    const rms=Math.sqrt(energy/samples.length);
    // Multiple voiced frames required to reject taps and microphone pops.
    activeFor=rms>0.035?activeFor+1:Math.max(0,activeFor-2);
    if(activeFor>=12){finish('heard');return;}
    if(performance.now()-startedAt>=timeoutMs){finish('no-speech');return;}
    frame=requestAnimationFrame(measure);
   };
   timer=setTimeout(()=>finish('no-speech'),timeoutMs+200);
   frame=requestAnimationFrame(measure);
  });
 }catch(error){
  const denied=error instanceof Error&&/notallowed|permission|denied/i.test(error.name+' '+error.message);
  return {kind:denied?'denied':'unavailable',alternatives:[],mode:'practice'};
 }finally{
  currentCancel=null;
  stream?.getTracks().forEach(track=>track.stop());
  if(ctx)void ctx.close().catch(()=>{});
 }
}
function webRecognition(ctor:WebSpeechConstructor,timeoutMs:number):Promise<SpeechAttempt>{
 return new Promise(resolve=>{
  const recognition=new ctor();
  recognition.lang='en-US';recognition.continuous=false;
  recognition.interimResults=false;recognition.maxAlternatives=4;
  recognition.processLocally=true;
  let settled=false;
  const cleanup=()=>{clearTimeout(timer);recognition.onresult=null;recognition.onerror=null;recognition.onend=null;currentCancel=null;};
  const finish=(kind:SpeechAttempt['kind'],alternatives:string[]=[])=>{
   if(settled)return;settled=true;cleanup();
   resolve({kind,alternatives:alternatives.filter(Boolean).slice(0,4),mode:'web-local'});
  };
  const timer=setTimeout(()=>{try{recognition.abort();}catch{}finish('no-speech');},timeoutMs);
  currentCancel=()=>{try{recognition.abort();}catch{}finish('cancelled');};
  recognition.onresult=event=>{
   const batch=event.results[0];const text=Array.from(batch??[]).map(x=>x.transcript.trim());
   finish(text.length?'recognized':'no-speech',text);
  };
  recognition.onerror=event=>finish(event.error==='not-allowed'||event.error==='service-not-allowed'?'denied':'no-speech');
  recognition.onend=()=>finish('no-speech');
  try{recognition.start();}catch{finish('unavailable');}
 });
}
async function nativeRecognition(timeoutMs:number):Promise<SpeechAttempt>{
 let cancelled=false;
 currentCancel=()=>{cancelled=true;void plugin.stop().catch(()=>{});};
 try{
  const response=await plugin.listen({lang:'en-US',timeoutMs});
  return {kind:cancelled?'cancelled':response.alternatives?.length?'recognized':'no-speech',
    alternatives:cancelled?[]:response.alternatives??[],mode:'native-local'};
 }catch(e){
  const message=e instanceof Error?e.message:String(e);
  return {kind:cancelled?'cancelled':/permission|denied|not.authorized/i.test(message)?'denied':
    /no.speech|timeout|speech.timeout/i.test(message)?'no-speech':'unavailable',
    alternatives:[],mode:'native-local'};
 }finally{currentCancel=null;}
}
/** Only a user initiated button can call this. No transcript is persisted. */
export async function listenToChild(capability:SpeechCapability,timeoutMs=8000):Promise<SpeechAttempt>{
 stopSpeechCapture();
 const ms=Math.min(12000,Math.max(3000,timeoutMs));
 if(capability.mode==='native-local')return nativeRecognition(ms);
 if(capability.mode==='web-local'){
  const ctor=browserConstructor();
  if(ctor)return webRecognition(ctor,ms);
 }
 if(capability.mode==='practice')return practiceVoice(Math.min(6000,ms));
 return {kind:'unavailable',alternatives:[],mode:'none'};
}
