'use client';

import {getSupabaseClient} from '../supabase/client';
import type {SpeechAttempt,SpeechCaptureStatus} from './childSpeech';

export type IndependentSession={result:Promise<SpeechAttempt>;cancel:()=>void};

// Explicit opt-in only. Never ship a vendor key, audio or a transcript to
// localStorage, analytics, IndexedDB or any unauthenticated third-party API.
export function independentSttConfigured():boolean{
 return process.env.NEXT_PUBLIC_HARBOR_STT_ENABLED==='true'&&getSupabaseClient()!==null;
}
export async function hasAdultSession():Promise<boolean>{
 const client=getSupabaseClient();
 if(!client)return false;
 const {data:{session}}=await client.auth.getSession();
 return Boolean(session?.access_token);
}
const fallback=(kind:SpeechAttempt['kind'],reason:string):SpeechAttempt=>
 ({kind,reason,alternatives:[],mode:'server-stt'});

function recorderType():string{
 if(typeof MediaRecorder==='undefined')return '';
 for(const type of ['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg']){
  if(MediaRecorder.isTypeSupported(type))return type;
 }
 return '';
}

/** Begin one microphone recording on a deliberate click; provider use is a
 * separate adult-authorized option in Harbor's settings, not an implicit
 * fallback. Cancel releases all tracks and aborts any upload. */
export function beginIndependentTranscription(
 profileId:string,timeoutMs:number,
 onStatus?:(status:SpeechCaptureStatus)=>void
):IndependentSession{
 const abort=new AbortController();
 let cancelled=false;
 let stream:MediaStream|null=null,recorder:MediaRecorder|null=null;
 let context:AudioContext|null=null;
 let recordTimer:ReturnType<typeof setTimeout>|null=null;
 let monitorTimer:ReturnType<typeof setInterval>|null=null;
 let settle!: (value:SpeechAttempt)=>void;
 let completed=false;
 const result=new Promise<SpeechAttempt>(resolve=>{settle=resolve;});
 const finish=(value:SpeechAttempt)=>{
  if(completed)return;
  completed=true;
  if(recordTimer)clearTimeout(recordTimer);
  if(monitorTimer)clearInterval(monitorTimer);
  abort.abort();
  try{if(recorder?.state==='recording')recorder.stop();}catch{}
  stream?.getTracks().forEach(t=>t.stop());
  if(context)void context.close().catch(()=>{});
  settle(value);
 };
 const cancel=()=>{
  cancelled=true;
  finish({kind:'cancelled',reason:'cancelled',alternatives:[],mode:'server-stt'});
 };
 void (async()=>{
  onStatus?.('starting');
  if(!independentSttConfigured()){
   finish(fallback('unavailable','backend-not-configured'));return;
  }
  const client=getSupabaseClient();
  if(!client){
   finish(fallback('unavailable','backend-not-configured'));return;
  }
  const {data:{session}}=await client.auth.getSession();
  if(cancelled)return;
  if(!session?.access_token){
   finish(fallback('unavailable','authentication-required'));return;
  }
  const mime=recorderType();
  if(!mime||!navigator.mediaDevices?.getUserMedia){
   finish(fallback('unavailable','recording-unsupported'));return;
  }
  try{
   stream=await navigator.mediaDevices.getUserMedia({video:false,audio:{
    echoCancellation:true,noiseSuppression:true,autoGainControl:true
   }});
  }catch(e){
   if(cancelled)return;
   const denied=e instanceof Error&&/notallowed|permission|denied/i.test(e.name+' '+e.message);
   finish(fallback(denied?'denied':'unavailable',denied?'permission-denied':'microphone-error'));return;
  }
  if(cancelled){stream.getTracks().forEach(t=>t.stop());return;}
  const parts:Blob[]=[];
  let detected=false;
  let lastSound=0;
  let firstSound=0;
  const started=performance.now();
  try{
   recorder=new MediaRecorder(stream,{mimeType:mime,audioBitsPerSecond:48_000});
   const stopped=new Promise<Blob>((resolve,reject)=>{
    const media=recorder!;
    media.ondataavailable=e=>{if(e.data.size)parts.push(e.data);};
    media.onerror=()=>reject(Error('recorder-error'));
    media.onstop=()=>resolve(new Blob(parts,{type:mime.split(';')[0]}));
   });
   recorder.start(250);
   onStatus?.('microphone-ready');
   // Analyze amplitude locally to avoid sending silence/hallucination triggers.
   const Ctx=window.AudioContext;
   if(Ctx){
    context=new Ctx();
    if(context.state==='suspended')void context.resume().catch(()=>{});
    const source=context.createMediaStreamSource(stream);
    const analyser=context.createAnalyser();
    analyser.fftSize=1024;source.connect(analyser);
    const samples=new Float32Array(analyser.fftSize);
    let voicedFrames=0;
    monitorTimer=setInterval(()=>{
     if(cancelled||completed||!analyser)return;
     analyser.getFloatTimeDomainData(samples);
     let sum=0;for(let i=0;i<samples.length;i++)sum+=samples[i]*samples[i];
     const rms=Math.sqrt(sum/samples.length);
     const now=performance.now();
     voicedFrames=rms>0.015?voicedFrames+1:0;
     if(voicedFrames>=2){
      lastSound=now;
      if(!detected){detected=true;firstSound=now;onStatus?.('speech-detected');}
     }
     if(detected&&now-firstSound>=1100&&now-lastSound>=1350&&recorder?.state==='recording')
      recorder.stop();
    },100);
   }
   recordTimer=setTimeout(()=>{if(recorder?.state==='recording')recorder.stop();},
    Math.min(8500,Math.max(3500,timeoutMs-1500)));
   const audio=await stopped;
   if(cancelled)return;
   if(!detected||audio.size<1500){
    finish(fallback('no-speech','no-speech'));return;
   }
   if(audio.size>1_500_000){
    finish(fallback('unavailable','audio-too-large'));return;
   }
   onStatus?.('processing');
   // The raw recording exists only in this function's memory. It is NOT saved.
   const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
   const apikey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
   const request=await fetch(url+'/functions/v1/harbor-transcribe',{
    method:'POST',
    headers:{
     apikey,
     Authorization:'Bearer '+session.access_token,
     'x-ventra-profile':profileId,
     'content-type':audio.type
    },
    body:audio,
    signal:abort.signal,
    cache:'no-store'
   });
   if(cancelled)return;
   if(!request.ok){
    let failure='';
    try{const body=await request.json();failure=String(body.error??'');}catch{}
    const allowed=['transcription-not-configured','provider-unavailable','provider-timeout-or-network',
     'provider-rate-limited','quota-unavailable','not-authorized-or-rate-limited',
     'adult-login-required','invalid-audio-request','origin-denied'];
    finish(fallback('unavailable',allowed.includes(failure)?failure:'backend-error'));return;
   }
   const payload:unknown=await request.json();
   if(cancelled)return;
   const transcript=payload&&typeof payload==='object'&&'text' in payload&&
    typeof payload.text==='string'?payload.text.trim().slice(0,180):'';
   finish(transcript?{
    kind:'recognized',alternatives:[transcript],mode:'server-stt',source:'final'
   }:fallback('unrecognized','speech-unrecognized'));
  }catch(e){
   if(cancelled)return;
   finish(fallback('unavailable',
    e instanceof Error&&e.message==='recorder-error'?'microphone-error':'backend-error'));
  }finally{
   stream?.getTracks().forEach(t=>t.stop());
   if(context)void context.close().catch(()=>{});
  }
 })().catch(()=>{if(!cancelled)finish(fallback('unavailable','backend-error'));});
 return {result,cancel};
}
