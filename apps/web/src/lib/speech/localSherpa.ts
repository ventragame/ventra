'use client';

import type {SpeechAttempt,SpeechCaptureStatus} from './childSpeech';
import {advanceShortVoice,type ShortVoiceState} from './shortUtteranceVAD.ts';

// Bound-memory, local-only Sherpa recognition. The model is prepared during
// build; it is loaded only after the learner starts a microphone attempt.
const MODEL='/speech/sherpa-english-2023-06-26/manifest.json';
const VERSION='sherpa-onnx-zipformer-en-2023-06-26-int8-6037ea0';
type WorkerReply=
 | {type:'ready'}
 | {type:'progress';file:string;index:number;total:number}
 | {type:'partial';id:number;text:string}
 | {type:'result';id:number;text:string}
 | {type:'error';id?:number;reason:string};

type Pool={worker:Worker;ready:Promise<void>;idle:ReturnType<typeof setTimeout>|null};
let pool:Pool|null=null;
let sessionCounter=0;
const OUT_RATE=16000;
export type LocalSession={result:Promise<SpeechAttempt>;cancel:()=>void};
const failed=(reason:string,kind:SpeechAttempt['kind']='unavailable'):SpeechAttempt=>
 ({mode:'sherpa-local',kind,reason,alternatives:[]});

export type SherpaReadiness={
 ready:boolean;
 reason:'ready'|'unsupported'|'manifest-missing'|'manifest-invalid'|'manifest-network';
};
export async function localSherpaReadiness():Promise<SherpaReadiness>{
 if(typeof window==='undefined'||typeof Worker==='undefined'||typeof AudioContext==='undefined'
    ||!navigator.mediaDevices?.getUserMedia||typeof crypto?.subtle==='undefined')
  return {ready:false,reason:'unsupported'};
 try{
  const response=await fetch(MODEL,{cache:'no-store'});
  if(response.status===404)return {ready:false,reason:'manifest-missing'};
  if(!response.ok)return {ready:false,reason:'manifest-network'};
  const data:unknown=await response.json();
  const valid=!!data&&typeof data==='object'&&'version' in data&&data.version===VERSION;
  return {ready:valid,reason:valid?'ready':'manifest-invalid'};
 }catch{return {ready:false,reason:'manifest-network'};}
}
export async function localSherpaAvailable():Promise<boolean>{
 return (await localSherpaReadiness()).ready;
}
function stopIdle(p:Pool){
 if(p.idle)clearTimeout(p.idle);
 p.idle=null;
}
function scheduleIdle(p:Pool){
 stopIdle(p);
 p.idle=setTimeout(()=>{
  if(pool===p){
   pool=null;
   try{p.worker.postMessage({type:'shutdown'});}catch{}
   p.worker.terminate();
  }
 },120000);
}
function acquireWorker():Pool{
 if(pool){stopIdle(pool);return pool;}
 const worker=new Worker(new URL('./sherpaWorker.ts',import.meta.url),{type:'module'});
 let settled=false;
 let resolve!:()=>void,reject!:(error:Error)=>void;
 const ready=new Promise<void>((yes,no)=>{resolve=yes;reject=no;});
 const p:Pool={worker,ready,idle:null};
 const initial=(event:MessageEvent<WorkerReply>)=>{
  const message=event.data;
  if(message.type==='ready'){
   settled=true;worker.removeEventListener('message',initial);resolve();
  }else if(message.type==='error'&&message.id===undefined){
   settled=true;worker.removeEventListener('message',initial);
   reject(new Error(message.reason));
   if(pool===p){pool=null;worker.terminate();}
  }
 };
 const fail=(error:Error)=>{
  if(settled)return;settled=true;
  worker.removeEventListener('message',initial);
  if(pool===p)pool=null;
  worker.terminate();reject(error);
 };
 worker.addEventListener('message',initial);
 worker.addEventListener('error',()=>fail(new Error('wasm-worker-error')),{once:true});
 pool=p;
 worker.postMessage({type:'init'});
 return p;
}

/** Stateful audio resampling: retain fractional phase AND the final source
 * sample across worklet messages. Restarting interpolation every 1024 frames
 * adds periodic discontinuities at 44.1/48 kHz, damaging short phonemes.
 * No audio is stored beyond the previous sample in this helper.
 */
export function createStreamingResamplerTo16k(){
 let inputRate=0;
 let offset=0;
 let position=0;
 let previous=0;
 return {
  push(source:Float32Array,sampleRate:number):Float32Array{
   if(!Number.isFinite(sampleRate)||sampleRate<8000||sampleRate>192000)
    throw new Error('invalid-sample-rate');
   if(inputRate!==0&&inputRate!==sampleRate)
    throw new Error('sample-rate-changed');
   inputRate=sampleRate;
   if(source.length===0)return new Float32Array();
   if(sampleRate===OUT_RATE){
    offset+=source.length;
    previous=source[source.length-1];
    position=offset;
    return new Float32Array(source);
   }
   const start=offset,end=start+source.length,step=sampleRate/OUT_RATE;
   const out:number[]=[];
   // A fractional output sample spanning two worklet chunks is completed
   // only when the next chunk arrives, using "previous" as its left sample.
   while(position<=end-1){
    const lo=Math.floor(position),hi=lo+1,frac=position-lo;
    if(frac>1e-8&&hi>=end)break;
    const left=lo<start?previous:source[lo-start];
    const right=hi<end?source[hi-start]:left;
    out.push(left+(right-left)*frac);
    position+=step;
   }
   offset=end;
   previous=source[source.length-1];
   return Float32Array.from(out);
  }
 };
}
/** One-shot compatibility wrapper, also used by deterministic fixture tests. */
export function resampleTo16k(source:Float32Array,sampleRate:number):Float32Array{
 return createStreamingResamplerTo16k().push(source,sampleRate);
}

/** One attempt. Worker retains *model weights*, never audio. A no-speech
 * result cannot earn points; ASR text is checked against accepted phrases
 * by the existing Harbor learning engine. */
export function beginLocalSherpaRecognition(
 timeoutMs=10000,onStatus?:(s:SpeechCaptureStatus)=>void
):LocalSession{
 const id=++sessionCounter;
 const controller=new AbortController();
 let done=false,stream:MediaStream|null=null,context:AudioContext|null=null;
 let recorder:AudioWorkletNode|ScriptProcessorNode|null=null;
 let source:MediaStreamAudioSourceNode|null=null;
 let micTimeout:ReturnType<typeof setTimeout>|null=null;
 let silenceTimeout:ReturnType<typeof setTimeout>|null=null;
 let poolForRun:Pool|null=null;
 let startedOnWorker=false;
 let voiceState:ShortVoiceState={voicedMs:0,detected:false};
 const resampler=createStreamingResamplerTo16k();
 let capturedMs=0,voiceStartMs=0,quietAfterVoiceMs=0;
 let capturedSamples=0,peakRms=0;
 let finishDecodeRequested=false;
 let promiseResolve!:(value:SpeechAttempt)=>void;
 const result=new Promise<SpeechAttempt>(r=>{promiseResolve=r;});
 const stopAudio=()=>{
  if(micTimeout)clearTimeout(micTimeout);
  if(silenceTimeout)clearTimeout(silenceTimeout);
  micTimeout=null;silenceTimeout=null;
  if(recorder){
   try{recorder.disconnect();}catch{}
   if('onaudioprocess' in recorder)recorder.onaudioprocess=null;
   if('port' in recorder)recorder.port.onmessage=null;
  }
  if(source){try{source.disconnect();}catch{}}
  stream?.getTracks().forEach(track=>track.stop());
  stream=null;
  if(context){void context.close().catch(()=>{});context=null;}
 };
 let listener:((event:MessageEvent<WorkerReply>)=>void)|null=null;
 const finish=(outcome:SpeechAttempt)=>{
  if(done)return;
  done=true;controller.abort();stopAudio();
  if(poolForRun){
   if(listener)poolForRun.worker.removeEventListener('message',listener);
   if(startedOnWorker)poolForRun.worker.postMessage({type:'cancel',id});
   scheduleIdle(poolForRun);
  }
  promiseResolve(outcome);
 };
 const cancel=()=>finish(failed('cancelled','cancelled'));
 const requestDecode=()=>{
  if(finishDecodeRequested||done)return;
  finishDecodeRequested=true;
  stopAudio();onStatus?.('processing');
  if(poolForRun?.worker&&startedOnWorker){
   poolForRun.worker.postMessage({type:'finish',id});
   silenceTimeout=setTimeout(()=>finish(failed('decoder-timeout')),8000);
  }else finish(failed('model-not-ready'));
 };
 const onSamples=(chunk:Float32Array,rate:number)=>{
  if(done||finishDecodeRequested||!poolForRun||chunk.length===0)return;
  const durationMs=1000*chunk.length/rate;
  capturedMs+=durationMs;
  const previouslyDetected=voiceState.detected;
  voiceState=advanceShortVoice(voiceState,chunk,rate);
  let power=0;
  for(let i=0;i<chunk.length;i++)power+=chunk[i]*chunk[i];
  const rms=Math.sqrt(power/chunk.length);
  peakRms=Math.max(peakRms,rms);
  if(voiceState.detected){
   if(!previouslyDetected){voiceStartMs=capturedMs;onStatus?.('speech-detected');}
   // Count actual quiet audio frames. Do not extend the timer simply because
   // the VAD's smoothed voicedMs is still decaying after a long sentence.
   quietAfterVoiceMs=rms>0.006?0:quietAfterVoiceMs+durationMs;
  }
  const samples=resampler.push(chunk,rate);
  capturedSamples+=samples.length;
  if(samples.length){
   poolForRun.worker.postMessage({type:'audio',id,samples,sampleRate:16000},[samples.buffer]);
  }
  // Short "yes" and full A2 sentences both need a genuine quiet tail.
  // Avoid cutting after the first syllable or a pause between words.
  if(voiceState.detected&&capturedMs-voiceStartMs>=1800&&
   quietAfterVoiceMs>=1350)requestDecode();
 };
 void (async()=>{
  if(!navigator.mediaDevices?.getUserMedia){finish(failed('microphone-unsupported'));return;}
  // Request microphone on user activation BEFORE any model downloads.
  // OS may prompt for permission while the model loads independently.
  onStatus?.('model-loading');
  const mic=navigator.mediaDevices.getUserMedia({
   video:false,audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}
  });
  // Initiate audio context while the microphone-button gesture is still
  // active. Safari/Chrome may suspend an AudioContext resumed only after the
  // first 73MB download, even when permission itself has been granted.
  let contextReady:Promise<void>|null=null;
  try{context=new AudioContext({sampleRate:OUT_RATE});}
  catch{context=new AudioContext();}
  if(context.state==='suspended'){
   contextReady=context.resume().catch(()=>{});
  }
  const engine=acquireWorker();
  poolForRun=engine;
  try{stream=await mic;}catch(error){
   if(done)return;
   const denied=error instanceof Error&&/denied|notallowed|permission/i.test(error.name+' '+error.message);
   finish(failed(denied?'permission-denied':'microphone-error',denied?'denied':'unavailable'));
   return;
  }
  if(done){stream.getTracks().forEach(track=>track.stop());return;}
  try{await engine.ready;}catch(error){
   if(!done)finish(failed(error instanceof Error?error.message:'model-load-failed'));
   return;
  }
  if(done)return;
  try{
  // Same loaded module is reused between answers until idle to avoid model
  // redownload and WASM initialization on every child microphone click.
  const worker=engine.worker;
  listener=(event)=>{
   const message=event.data;
   if(!('id' in message)||message.id!==id)return;
   if(message.type==='result'){
    const words=message.text.trim().slice(0,180);
    finish(words?{kind:'recognized',alternatives:[words],mode:'sherpa-local',source:'final'}
     :failed(voiceState.detected?'speech-unrecognized':'no-speech',voiceState.detected?'unrecognized':'no-speech'));
   }else if(message.type==='error')finish(failed(message.reason));
  };
  worker.addEventListener('message',listener);
  startedOnWorker=true;
  worker.postMessage({type:'start',id});
  // The mic is connected only once model download and initialization finish;
  // previously requested audio context has already been unlocked on tap.
  if(contextReady)await contextReady;
  if(done)return;
  if(!context){finish(failed('audio-pipeline-failed'));return;}
  if(context.state==='suspended'){
   try{await context.resume();}catch{}
  }
  if(done)return;
  if(context.state!=='running'){
   finish(failed('audio-context-suspended'));return;
  }
  source=context.createMediaStreamSource(stream);
  if(context.audioWorklet&&typeof AudioWorkletNode!=='undefined'){
   try{
    await context.audioWorklet.addModule('/speech/ventra-speech-processor.js');
    if(done)return;
    const node=new AudioWorkletNode(context,'ventra-speech-processor');
    node.port.onmessage=(event:MessageEvent<Float32Array>)=>{
     if(!done)onSamples(event.data,context!.sampleRate);
    };
    recorder=node;
   }catch{ /* older iOS WebView: use the compatibility capture below */ }
  }
  if(!recorder){
   const node=context.createScriptProcessor(4096,1,1);
   node.onaudioprocess=event=>{
    const input=event.inputBuffer.getChannelData(0);
    if(!done)onSamples(input,context!.sampleRate);
    event.outputBuffer.getChannelData(0).fill(0);
   };
   recorder=node;
  }
  source.connect(recorder);
  recorder.connect(context.destination); // processor outputs silence
  onStatus?.('microphone-ready');
  micTimeout=setTimeout(()=>{
   if(done)return;
   // Quiet children often remain below the energy VAD threshold. Decode the
   // recorded PCM anyway if there is plausible input, rather than discard it
   // as silence without even asking the speech recognizer.
   if(capturedSamples>=OUT_RATE/4&&peakRms>=0.0018)requestDecode();
   else finish(failed('no-speech','no-speech'));
  },Math.max(3500,Math.min(10500,timeoutMs)));
  // Keep processing bounded even if a browser suspends timers on idle tabs.
 }catch(error){
  if(!done)finish(failed(error instanceof Error?error.message==='invalid-sample-rate'?
   'sample-rate':'audio-pipeline-failed':'audio-pipeline-failed'));
 }
 })().catch(()=>{if(!done)finish(failed('audio-pipeline-failed'));});
 return {result,cancel};
}
